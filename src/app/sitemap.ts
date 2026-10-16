import type { MetadataRoute } from "next";
import { SEO_PAGES } from "@/lib/seo";
import { SITE_URL } from "@/lib/supabase/config";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: SITE_URL, changeFrequency: "daily", priority: 1 },
    ...SEO_PAGES.map((p) => ({ url: `${SITE_URL}/lavoro/${p.slug}`, changeFrequency: "daily" as const, priority: 0.8 })),
  ];
}
