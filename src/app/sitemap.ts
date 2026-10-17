import type { MetadataRoute } from "next";
import { createClient } from "@supabase/supabase-js";
import { SEO_PAGES } from "@/lib/seo";
import { SITE_URL, SUPABASE_ANON_KEY, SUPABASE_URL, isSupabaseConfigured } from "@/lib/supabase/config";

export const revalidate = 3600;

/** Pagine fisse + annunci pubblicati: più pagine indicizzate da Google, più visite. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const fixed: MetadataRoute.Sitemap = [
    { url: SITE_URL, changeFrequency: "daily", priority: 1 },
    { url: `${SITE_URL}/aziende`, changeFrequency: "monthly", priority: 0.5 },
    ...SEO_PAGES.map((p) => ({ url: `${SITE_URL}/lavoro/${p.slug}`, changeFrequency: "daily" as const, priority: 0.8 })),
  ];
  if (!isSupabaseConfigured()) return fixed;
  try {
    const sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { auth: { persistSession: false } });
    const { data } = await sb.from("jobs").select("id,posted_at").eq("status", "pubblicato").order("posted_at", { ascending: false }).limit(5000);
    return [
      ...fixed,
      ...(data ?? []).map((j) => ({ url: `${SITE_URL}/annuncio/${j.id}`, lastModified: j.posted_at as string, changeFrequency: "weekly" as const, priority: 0.6 })),
    ];
  } catch {
    return fixed;
  }
}
