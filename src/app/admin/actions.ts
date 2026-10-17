"use server";
import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/account";
import { runIngest } from "@/lib/ingest/run";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { CATEGORY_KEYS, type Category } from "@/lib/types";

async function requireAdmin() {
  const s = await getSession();
  if (!s.isAdmin) throw new Error("Non autorizzato");
}

export async function approveJob(id: string, category: Category) {
  await requireAdmin();
  if (!CATEGORY_KEYS.includes(category)) return;
  await supabaseAdmin().from("jobs").update({ status: "pubblicato", category, review_reason: null, classified_at: new Date().toISOString() }).eq("id", id);
  revalidatePath("/admin");
}

export async function rejectJob(id: string) {
  await requireAdmin();
  await supabaseAdmin().from("jobs").update({ status: "scartato", classified_at: new Date().toISOString() }).eq("id", id);
  revalidatePath("/admin");
}

const ATS = ["greenhouse", "lever", "ashby", "workable"] as const;

export async function addCompany(form: FormData): Promise<string> {
  await requireAdmin();
  const name = String(form.get("name") ?? "").trim();
  const ats = String(form.get("ats") ?? "");
  // Accetta sia lo slug sia l'indirizzo completo della pagina carriere
  const slug = String(form.get("slug") ?? "").trim().replace(/\/+$/, "").split("/").pop() ?? "";
  if (!name || !slug || !ATS.includes(ats as (typeof ATS)[number])) return "Compila nome, sistema e indirizzo della pagina carriere.";
  const { error } = await supabaseAdmin().from("companies").insert({ name, ats, ats_slug: slug });
  revalidatePath("/admin");
  if (error) return error.code === "23505" ? "Questa azienda è già in elenco." : "Salvataggio non riuscito.";
  return `${name} aggiunta: i suoi annunci arrivano con la prossima raccolta.`;
}

export async function toggleCompany(id: string, active: boolean) {
  await requireAdmin();
  await supabaseAdmin().from("companies").update({ active }).eq("id", id);
  revalidatePath("/admin");
}

export async function ingestNow(): Promise<string> {
  await requireAdmin();
  const r = await runIngest({ maxCompanies: 10, maxClassify: 25 });
  revalidatePath("/admin");
  return `Raccolta completata: ${r.fetched} annunci letti, ${r.newJobs} nuovi, ${r.published} pubblicati, ${r.review} in revisione, ${r.rejected} scartati, ${r.expired} scaduti.${r.errors.length ? " Errori: " + r.errors.join("; ") : ""}`;
}

// ---------- Evidenza, richieste delle aziende, sponsor ----------

const days = (n: number) => new Date(Date.now() + n * 86_400_000).toISOString();

/** Mette in evidenza un annuncio per n giorni (0 = toglie l'evidenza). */
export async function setFeatured(jobId: string, n: number): Promise<string> {
  await requireAdmin();
  const featured_until = n > 0 ? days(Math.min(n, 365)) : null;
  const { error } = await supabaseAdmin().from("jobs").update({ featured_until }).eq("id", jobId);
  revalidatePath("/", "layout");
  if (error) return "Salvataggio non riuscito.";
  return n > 0 ? `In evidenza fino al ${new Date(featured_until!).toLocaleDateString("it-IT")}.` : "Evidenza tolta.";
}

/** Pubblica un annuncio inviato da un'azienda. Gli annunci diretti scadono dopo 60 giorni. */
export async function approveSubmission(id: string, featuredDays: number): Promise<string> {
  await requireAdmin();
  const db = supabaseAdmin();
  const { data: s } = await db.from("job_submissions").select("*").eq("id", id).eq("status", "in_attesa").maybeSingle();
  if (!s) return "Richiesta non trovata o già gestita.";
  const now = new Date().toISOString();
  const { data: job, error } = await db.from("jobs").insert({
    company_name: s.company_name, source: "diretto", external_id: s.id, url: s.apply_url,
    title: s.title, location_raw: [s.city, s.region].filter(Boolean).join(", ") || null,
    description: s.description, summary: s.description.slice(0, 1200), requirements: s.requirements,
    category: s.category, area: s.area, city: s.city, region: s.region, mode: s.mode,
    pay_monthly: s.pay_monthly, pay_annual: s.pay_annual, duration_months: s.duration_months,
    experience_years: s.category === "junior" ? 2 : 0, confidence: 100, status: "pubblicato",
    classified_at: now, posted_at: now, last_seen_at: now,
    expires_at: days(60), featured_until: featuredDays > 0 ? days(featuredDays) : null,
  }).select("id").single();
  if (error || !job) return "Pubblicazione non riuscita: " + (error?.message ?? "errore sconosciuto");
  await db.from("job_submissions").update({ status: "approvato", job_id: job.id, decided_at: now }).eq("id", id);
  revalidatePath("/", "layout");
  return `Pubblicato${featuredDays > 0 ? ` e in evidenza per ${featuredDays} giorni` : ""}.`;
}

export async function rejectSubmission(id: string) {
  await requireAdmin();
  await supabaseAdmin().from("job_submissions").update({ status: "rifiutato", decided_at: new Date().toISOString() }).eq("id", id);
  revalidatePath("/admin");
}

/** Salva uno spazio sponsor (sito o email). */
export async function saveSponsor(form: FormData): Promise<string> {
  await requireAdmin();
  const slot = String(form.get("slot") ?? "");
  if (slot !== "sito" && slot !== "email") return "Spazio non valido.";
  const name = String(form.get("name") ?? "").trim().slice(0, 60);
  const text = String(form.get("text") ?? "").trim().slice(0, 160);
  const url = String(form.get("url") ?? "").trim();
  const active = form.get("active") === "on";
  if (active && (!name || !/^https?:\/\//i.test(url))) return "Per attivarlo servono nome e un indirizzo che inizia con https://";
  const { error } = await supabaseAdmin().from("sponsors").upsert({ slot, name, text, url, active, updated_at: new Date().toISOString() });
  revalidatePath("/", "layout");
  if (error) return "Salvataggio non riuscito: hai eseguito l'aggiornamento del database?";
  return active ? "Sponsor attivo." : "Salvato (non attivo).";
}
