import { NextResponse } from "next/server";
import { isSafeUrl, recordClick, withUtm } from "@/lib/clicks";
import { getJob } from "@/lib/jobs";
import { SITE_URL } from "@/lib/supabase/config";

export const dynamic = "force-dynamic";

/** Bottone «Candidati»: conta il click e porta all'annuncio originale dell'azienda. */
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const job = await getJob(id);
  if (!job || !isSafeUrl(job.url)) return NextResponse.redirect(`${SITE_URL}/`, 302);
  await recordClick(request, "candidatura", job.id.startsWith("demo-") ? null : job.id);
  const res = NextResponse.redirect(withUtm(job.url, "annuncio"), 302);
  res.headers.set("Cache-Control", "no-store");
  res.headers.set("X-Robots-Tag", "noindex, nofollow");
  return res;
}
