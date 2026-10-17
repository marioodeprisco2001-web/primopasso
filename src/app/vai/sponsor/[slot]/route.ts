import { NextResponse } from "next/server";
import { isSafeUrl, recordClick, withUtm } from "@/lib/clicks";
import { getSponsor } from "@/lib/sponsors";
import { SITE_URL } from "@/lib/supabase/config";

export const dynamic = "force-dynamic";

/** Link dello sponsor: conta il click (dato da mostrare allo sponsor) e porta al suo sito. */
export async function GET(request: Request, { params }: { params: Promise<{ slot: string }> }) {
  const { slot } = await params;
  if (slot !== "sito" && slot !== "email") return NextResponse.redirect(`${SITE_URL}/`, 302);
  const sponsor = await getSponsor(slot);
  if (!sponsor || !isSafeUrl(sponsor.url)) return NextResponse.redirect(`${SITE_URL}/`, 302);
  await recordClick(request, slot === "sito" ? "sponsor_sito" : "sponsor_email");
  const res = NextResponse.redirect(withUtm(sponsor.url, `sponsor_${slot}`), 302);
  res.headers.set("Cache-Control", "no-store");
  res.headers.set("X-Robots-Tag", "noindex, nofollow");
  return res;
}
