import "server-only";
import { classifyJob, decideStatus, isClassifierConfigured } from "../classify";
import { supabaseAdmin } from "../supabase/admin";
import { FETCHERS, type Ats } from "./ats";
import { passesPrefilter } from "./prefilter";

export type IngestReport = { fetched: number; newJobs: number; published: number; review: number; rejected: number; expired: number; errors: string[] };

/**
 * Raccolta notturna:
 * 1. legge le pagine carriere delle aziende attive (le meno aggiornate per prime);
 * 2. salva gli annunci nuovi e aggiorna quelli già visti;
 * 3. segna come scaduti quelli spariti dalla pagina carriere;
 * 4. classifica con l'AI gli annunci non ancora classificati.
 */
export async function runIngest({ maxCompanies = 40, maxClassify = 40 } = {}): Promise<IngestReport> {
  const db = supabaseAdmin();
  const report: IngestReport = { fetched: 0, newJobs: 0, published: 0, review: 0, rejected: 0, expired: 0, errors: [] };
  const now = new Date().toISOString();

  const { data: companies } = await db.from("companies").select("id,name,ats,ats_slug").eq("active", true)
    .order("last_fetched_at", { ascending: true, nullsFirst: true }).limit(maxCompanies);

  for (const c of companies ?? []) {
    try {
      const raw = await FETCHERS[c.ats as Ats](c.ats_slug);
      const jobs = raw.filter(passesPrefilter);
      report.fetched += raw.length;

      const { data: existing } = await db.from("jobs").select("id,external_id,status").eq("source", c.ats).eq("company_id", c.id);
      const known = new Map((existing ?? []).map((e) => [e.external_id as string, e]));
      const seen = new Set(jobs.map((j) => j.externalId));

      const fresh = jobs.filter((j) => !known.has(j.externalId));
      if (fresh.length) {
        const { error } = await db.from("jobs").insert(fresh.map((j) => ({
          company_id: c.id, company_name: c.name, source: c.ats, external_id: j.externalId, url: j.url, title: j.title,
          location_raw: j.location, description: j.description, mode: j.remote ? "remoto" : null,
          posted_at: j.postedAt ?? now, last_seen_at: now, status: "in_revisione",
        })));
        if (error) throw new Error(error.message);
        report.newJobs += fresh.length;
      }

      const stillThere = [...seen].filter((id) => known.has(id));
      if (stillThere.length) await db.from("jobs").update({ last_seen_at: now }).eq("company_id", c.id).in("external_id", stillThere);

      const gone = (existing ?? []).filter((e) => !seen.has(e.external_id) && (e.status === "pubblicato" || e.status === "in_revisione")).map((e) => e.id);
      if (gone.length) {
        await db.from("jobs").update({ status: "scaduto" }).in("id", gone);
        report.expired += gone.length;
      }

      await db.from("companies").update({ last_fetched_at: now, last_error: null }).eq("id", c.id);
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      report.errors.push(`${c.name}: ${message}`);
      await db.from("companies").update({ last_fetched_at: now, last_error: message.slice(0, 300) }).eq("id", c.id);
    }
  }

  await classifyPending(maxClassify, report);
  return report;
}

async function classifyPending(limit: number, report: IngestReport) {
  const db = supabaseAdmin();
  const { data: pending } = await db.from("jobs").select("id,title,company_name,location_raw,description,mode")
    .is("classified_at", null).eq("status", "in_revisione").order("created_at").limit(limit);
  if (!pending?.length) return;

  if (!isClassifierConfigured()) {
    await db.from("jobs").update({ review_reason: "Classificazione automatica non attiva: scegli tu la categoria." })
      .in("id", pending.map((p) => p.id)).is("review_reason", null);
    report.review += pending.length;
    return;
  }

  for (const p of pending) {
    try {
      const c = await classifyJob({ title: p.title, company: p.company_name, location: p.location_raw ?? "", description: p.description ?? "" });
      const d = decideStatus(c);
      await db.from("jobs").update({
        status: d.status, review_reason: d.reason, confidence: c.confidenza, category: c.categoria,
        experience_years: c.anni_esperienza, education: c.titolo_studio, area: c.area, city: c.citta, region: c.regione,
        mode: c.modalita ?? p.mode, pay_monthly: c.rimborso_mensile, pay_annual: c.ral_annua, duration_months: c.durata_mesi,
        summary: c.riassunto, requirements: c.requisiti, classified_at: new Date().toISOString(),
      }).eq("id", p.id);
      if (d.status === "pubblicato") report.published++;
      else if (d.status === "scartato") report.rejected++;
      else report.review++;
    } catch (e) {
      report.errors.push(`Classificazione "${p.title}": ${e instanceof Error ? e.message : String(e)}`);
    }
  }
}
