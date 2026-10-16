import "server-only";

/** Annuncio letto da una pagina carriere, prima della classificazione. */
export type RawJob = {
  externalId: string;
  url: string;
  title: string;
  location: string;
  country: string | null;
  remote: boolean;
  description: string;
  postedAt: string | null;
};

export type Ats = "greenhouse" | "lever" | "ashby" | "workable";

const entities: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: '"', "#39": "'", apos: "'", nbsp: " " };
const decode = (s: string) => s.replace(/&(amp|lt|gt|quot|#39|apos|nbsp);/g, (_, e) => entities[e] ?? _);

/** HTML → testo semplice, compatto, limitato in lunghezza. */
export function htmlToText(html: string, max = 8000): string {
  let s = decode(decode(html ?? "")); // Greenhouse manda l'HTML codificato due volte
  s = s.replace(/<(script|style)[\s\S]*?<\/\1>/gi, " ")
    .replace(/<\/(p|div|li|h[1-6]|br|tr)>/gi, "\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<li[^>]*>/gi, "- ")
    .replace(/<[^>]+>/g, " ");
  s = decode(s).replace(/[ \t]+/g, " ").replace(/\n\s*\n+/g, "\n").trim();
  return s.slice(0, max);
}

async function getJson(url: string) {
  const res = await fetch(url, { headers: { "User-Agent": "PrimopassoBot/1.0 (+job board entry level Italia)", Accept: "application/json" }, cache: "no-store" });
  if (!res.ok) throw new Error(`${res.status} da ${new URL(url).host}`);
  return res.json();
}

/* eslint-disable @typescript-eslint/no-explicit-any */

async function greenhouse(slug: string): Promise<RawJob[]> {
  const data = await getJson(`https://boards-api.greenhouse.io/v1/boards/${encodeURIComponent(slug)}/jobs?content=true`);
  return (data.jobs ?? []).map((j: any) => ({
    externalId: String(j.id),
    url: j.absolute_url,
    title: j.title,
    location: j.location?.name ?? "",
    country: null,
    remote: /remote/i.test(j.location?.name ?? ""),
    description: htmlToText(j.content ?? ""),
    postedAt: j.first_published ?? j.updated_at ?? null,
  }));
}

async function lever(slug: string): Promise<RawJob[]> {
  const data = await getJson(`https://api.lever.co/v0/postings/${encodeURIComponent(slug)}?mode=json`);
  return (Array.isArray(data) ? data : []).map((j: any) => {
    const lists = (j.lists ?? []).map((l: any) => `${l.text}\n${htmlToText(l.content ?? "", 3000)}`).join("\n");
    return {
      externalId: j.id,
      url: j.hostedUrl,
      title: j.text,
      location: [j.categories?.location, ...(j.categories?.allLocations ?? [])].filter(Boolean).join(" / "),
      country: j.country ?? null,
      remote: j.workplaceType === "remote",
      description: `${j.descriptionPlain ?? ""}\n${lists}\n${j.additionalPlain ?? ""}`.slice(0, 8000),
      postedAt: j.createdAt ? new Date(j.createdAt).toISOString() : null,
    };
  });
}

async function ashby(slug: string): Promise<RawJob[]> {
  const data = await getJson(`https://api.ashbyhq.com/posting-api/job-board/${encodeURIComponent(slug)}?includeCompensation=true`);
  return (data.jobs ?? []).map((j: any) => ({
    externalId: String(j.id),
    url: j.jobUrl ?? j.applyUrl,
    title: j.title,
    location: [j.location, ...(j.secondaryLocations ?? []).map((l: any) => l.location)].filter(Boolean).join(" / "),
    country: j.address?.postalAddress?.addressCountry ?? null,
    remote: Boolean(j.isRemote),
    description: (j.descriptionPlain ?? htmlToText(j.descriptionHtml ?? "")).slice(0, 8000),
    postedAt: j.publishedAt ?? null,
  }));
}

async function workable(slug: string): Promise<RawJob[]> {
  const data = await getJson(`https://apply.workable.com/api/v1/widget/accounts/${encodeURIComponent(slug)}?details=true`);
  return (data.jobs ?? []).map((j: any) => ({
    externalId: String(j.shortcode ?? j.id),
    url: j.url ?? j.application_url,
    title: j.title,
    location: [j.city, j.state, j.country].filter(Boolean).join(", "),
    country: j.country ?? null,
    remote: Boolean(j.telecommuting),
    description: htmlToText(j.description ?? ""),
    postedAt: j.published_on ?? j.created_at ?? null,
  }));
}

export const FETCHERS: Record<Ats, (slug: string) => Promise<RawJob[]>> = { greenhouse, lever, ashby, workable };
