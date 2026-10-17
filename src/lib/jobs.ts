import "server-only";
import { DEMO_JOBS } from "./demo-data";
import { normalize } from "./filters";
import { monthlyValue } from "./format";
import { isSupabaseConfigured } from "./supabase/config";
import { supabaseServer } from "./supabase/server";
import { AREAS, CATEGORY_KEYS, MODE_KEYS, type Category, type Filters, type Job, type Mode } from "./types";

export const PAGE_SIZE = 40;

const COLUMNS =
  "id,title,company_name,url,source,category,area,city,region,mode,pay_monthly,pay_annual,duration_months,experience_years,education,summary,requirements,posted_at,featured_until";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapRow(r: any): Job {
  return {
    id: r.id,
    title: r.title,
    company: r.company_name,
    url: r.url,
    source: r.source,
    category: r.category,
    area: r.area,
    city: r.city,
    region: r.region,
    mode: r.mode,
    payMonthly: r.pay_monthly,
    payAnnual: r.pay_annual,
    durationMonths: r.duration_months,
    experienceYears: r.experience_years,
    education: r.education,
    summary: r.summary,
    requirements: r.requirements ?? [],
    postedAt: r.posted_at,
    featured: Boolean(r.featured_until && new Date(r.featured_until).getTime() > Date.now()),
  };
}

export type Facets = { cats: Record<Category, number>; areas: Record<string, number>; modes: Record<Mode, number> };
export type SearchResult = { jobs: Job[]; total: number; facets: Facets; demo: boolean };

const zero = <K extends string>(keys: readonly K[]) => Object.fromEntries(keys.map((k) => [k, 0])) as Record<K, number>;

/** Calcola i conteggi di ogni filtro tenendo conto degli altri filtri attivi. */
function facetsFrom(rows: { category: Category; area: string | null; mode: Mode | null }[], f: Filters): Facets {
  const facets: Facets = { cats: zero(CATEGORY_KEYS), areas: zero(AREAS), modes: zero(MODE_KEYS) };
  const okCat = (r: (typeof rows)[number]) => !f.cats.length || f.cats.includes(r.category);
  const okArea = (r: (typeof rows)[number]) => !f.areas.length || (r.area !== null && f.areas.includes(r.area));
  const okMode = (r: (typeof rows)[number]) => !f.modes.length || (r.mode !== null && f.modes.includes(r.mode));
  for (const r of rows) {
    if (okArea(r) && okMode(r)) facets.cats[r.category]++;
    if (r.area && okCat(r) && okMode(r) && r.area in facets.areas) facets.areas[r.area]++;
    if (r.mode && okCat(r) && okArea(r)) facets.modes[r.mode]++;
  }
  return facets;
}

const cleanWhere = (w: string) => w.replace(/[,()%*\\]/g, " ").trim();
const isRemote = (w: string) => normalize(w).includes("remot");

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function searchJobs(f: Filters, page = 1, since?: string, client?: any): Promise<SearchResult> {
  if (!isSupabaseConfigured()) return searchDemo(f);
  const sb = client ?? (await supabaseServer())!;

  // Filtri comuni a risultati e conteggi
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const base = (query: any) => {
    let q = query.eq("status", "pubblicato");
    if (f.q) q = q.textSearch("search", f.q, { type: "websearch", config: "italian" });
    if (f.where) {
      const w = cleanWhere(f.where);
      q = isRemote(w) ? q.eq("mode", "remoto") : q.or(`city.ilike.%${w}%,region.ilike.%${w}%`);
    }
    if (f.paid) q = q.eq("has_pay", true);
    if (f.days) q = q.gte("posted_at", new Date(Date.now() - f.days * 86_400_000).toISOString());
    if (since) q = q.gt("created_at", since);
    return q;
  };

  let list = base(sb.from("jobs").select(COLUMNS, { count: "exact" }));
  if (f.cats.length) list = list.in("category", f.cats);
  if (f.areas.length) list = list.in("area", f.areas);
  if (f.modes.length) list = list.in("mode", f.modes);
  // Ordinamento predefinito: prima gli annunci in evidenza, poi i più recenti.
  // Le evidenze scadute vengono azzerate ogni notte (vedi maintenance.ts).
  list = f.sort === "compenso"
    ? list.order("pay_sort", { ascending: false, nullsFirst: false }).order("posted_at", { ascending: false })
    : list.order("featured_until", { ascending: false, nullsFirst: false }).order("posted_at", { ascending: false });
  list = list.range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);

  const [res, facetRes] = await Promise.all([list, base(sb.from("jobs").select("category,area,mode")).limit(5000)]);
  if (res.error) throw new Error(res.error.message);
  return {
    jobs: (res.data ?? []).map(mapRow),
    total: res.count ?? 0,
    facets: facetsFrom(facetRes.data ?? [], f),
    demo: false,
  };
}

function searchDemo(f: Filters): SearchResult {
  const base = DEMO_JOBS.filter((j) => {
    if (f.q && !normalize(`${j.title} ${j.company} ${j.area}`).includes(normalize(f.q))) return false;
    if (f.where) {
      if (isRemote(f.where)) { if (j.mode !== "remoto") return false; }
      else if (!normalize(`${j.city} ${j.region ?? ""}`).includes(normalize(f.where))) return false;
    }
    if (f.paid && !j.payMonthly && !j.payAnnual) return false;
    if (f.days && Date.now() - new Date(j.postedAt).getTime() > f.days * 86_400_000) return false;
    return true;
  });
  const jobs = base
    .filter((j) => (!f.cats.length || f.cats.includes(j.category)) && (!f.areas.length || (j.area && f.areas.includes(j.area))) && (!f.modes.length || (j.mode && f.modes.includes(j.mode))))
    .sort((a, b) => (f.sort === "compenso" ? monthlyValue(b) - monthlyValue(a) : Number(Boolean(b.featured)) - Number(Boolean(a.featured)) || b.postedAt.localeCompare(a.postedAt)));
  return { jobs, total: jobs.length, facets: facetsFrom(base, f), demo: true };
}

export async function getJob(id: string): Promise<Job | null> {
  if (!isSupabaseConfigured()) return DEMO_JOBS.find((j) => j.id === id) ?? null;
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const sb = (await supabaseServer())!;
  const { data } = await sb.from("jobs").select(COLUMNS).eq("id", id).maybeSingle();
  return data ? mapRow(data) : null;
}

export async function getJobsByIds(ids: string[]): Promise<Job[]> {
  if (!ids.length) return [];
  if (!isSupabaseConfigured()) return DEMO_JOBS.filter((j) => ids.includes(j.id));
  const sb = (await supabaseServer())!;
  const { data } = await sb.from("jobs").select(COLUMNS).in("id", ids);
  return (data ?? []).map(mapRow);
}

/** Id dei preferiti dell'utente collegato (insieme vuoto se non collegato). */
export async function favoriteIds(): Promise<Set<string>> {
  const sb = await supabaseServer();
  if (!sb) return new Set();
  const { data: auth } = await sb.auth.getUser();
  if (!auth.user) return new Set();
  const { data } = await sb.from("favorites").select("job_id").eq("user_id", auth.user.id);
  return new Set((data ?? []).map((r) => r.job_id as string));
}
