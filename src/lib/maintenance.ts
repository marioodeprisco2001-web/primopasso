import "server-only";
import { supabaseAdmin } from "./supabase/admin";

/**
 * Pulizia notturna:
 * - toglie l'evidenza agli annunci la cui evidenza è scaduta;
 * - segna come scaduti gli annunci inviati dalle aziende oltre la data di scadenza.
 */
export async function runMaintenance(): Promise<{ featuredEnded: number; directExpired: number; error?: string }> {
  const db = supabaseAdmin();
  const now = new Date().toISOString();
  const featured = await db.from("jobs").update({ featured_until: null }).lt("featured_until", now).select("id");
  const expired = await db.from("jobs").update({ status: "scaduto", featured_until: null })
    .eq("source", "diretto").eq("status", "pubblicato").lt("expires_at", now).select("id");
  const error = featured.error?.message ?? expired.error?.message;
  return { featuredEnded: featured.data?.length ?? 0, directExpired: expired.data?.length ?? 0, ...(error ? { error } : {}) };
}
