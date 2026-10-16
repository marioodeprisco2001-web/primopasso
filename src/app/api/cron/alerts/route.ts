import { NextResponse } from "next/server";
import { sendAlerts } from "@/lib/alerts";
import { isCronAuthorized } from "@/lib/cron";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function GET(request: Request) {
  if (!isCronAuthorized(request)) return NextResponse.json({ error: "Non autorizzato" }, { status: 401 });
  return NextResponse.json(await sendAlerts());
}
