import { NextResponse } from "next/server";
import { isCronAuthorized } from "@/lib/cron";
import { runIngest } from "@/lib/ingest/run";
import { runMaintenance } from "@/lib/maintenance";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function GET(request: Request) {
  if (!isCronAuthorized(request)) return NextResponse.json({ error: "Non autorizzato" }, { status: 401 });
  const maintenance = await runMaintenance();
  const report = await runIngest();
  return NextResponse.json({ ...report, maintenance });
}
