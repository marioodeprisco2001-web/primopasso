import "server-only";
import { isSupabaseConfigured } from "./supabase/config";
import { supabaseAdmin } from "./supabase/admin";

export type ClickKind = "candidatura" | "sponsor_sito" | "sponsor_email";

const BOT = /bot|crawl|spider|slurp|preview|facebookexternalhit|whatsapp|telegram|discord|curl|wget|python|headless|lighthouse|monitor/i;

/** Registra un click in uscita. Non salva dati personali e non blocca mai il redirect. */
export async function recordClick(request: Request, kind: ClickKind, jobId: string | null = null) {
  if (!isSupabaseConfigured() || !process.env.SUPABASE_SERVICE_ROLE_KEY) return;
  const ua = request.headers.get("user-agent") ?? "";
  if (!ua || BOT.test(ua) || request.headers.get("purpose") === "prefetch") return;
  try {
    await supabaseAdmin().from("clicks").insert({ kind, job_id: jobId });
  } catch {
    // Il conteggio è secondario: se fallisce, l'utente arriva comunque a destinazione.
  }
}

/** Aggiunge i parametri UTM: l'azienda vede nelle sue statistiche che il candidato arriva da Primopasso. */
export function withUtm(raw: string, campaign: string): string {
  try {
    const u = new URL(raw);
    if (u.protocol !== "http:" && u.protocol !== "https:") return raw;
    if (!u.searchParams.has("utm_source")) {
      u.searchParams.set("utm_source", "primopasso");
      u.searchParams.set("utm_medium", "referral");
      u.searchParams.set("utm_campaign", campaign);
    }
    return u.toString();
  } catch {
    return raw;
  }
}

/** Solo indirizzi web o email: niente javascript: o altri schemi. */
export function isSafeUrl(raw: string): boolean {
  try {
    const u = new URL(raw);
    return u.protocol === "http:" || u.protocol === "https:" || u.protocol === "mailto:";
  } catch {
    return false;
  }
}
