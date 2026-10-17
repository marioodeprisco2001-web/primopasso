import "server-only";
import { isSupabaseConfigured } from "./supabase/config";
import { supabaseServer } from "./supabase/server";
import type { Sponsor, SponsorSlot } from "./types";

/** Sponsor attivo per uno spazio, o null. Le regole del database mostrano solo quelli attivi. */
export async function getSponsor(slot: SponsorSlot): Promise<Sponsor | null> {
  if (!isSupabaseConfigured()) return null;
  try {
    const sb = await supabaseServer();
    if (!sb) return null;
    const { data } = await sb.from("sponsors").select("slot,active,name,text,url").eq("slot", slot).eq("active", true).maybeSingle();
    return data && data.name && data.url ? (data as Sponsor) : null;
  } catch {
    return null;
  }
}
