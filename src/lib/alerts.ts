import "server-only";
import { Resend } from "resend";
import { searchJobs } from "./jobs";
import { payLabel } from "./format";
import { toQuery } from "./filters";
import { SITE_URL } from "./supabase/config";
import { supabaseAdmin } from "./supabase/admin";
import { CATEGORIES, EMPTY_FILTERS, type Filters, type Job } from "./types";

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);

function emailHtml(label: string, jobs: Job[], searchUrl: string, unsubscribeUrl: string) {
  const items = jobs.slice(0, 10).map((j) => {
    const pay = payLabel(j).value ?? "Compenso non dichiarato";
    return `<tr><td style="padding:12px 0;border-top:1px solid #d9e1de">
      <div style="font-size:12px;color:#586863">${esc(CATEGORIES[j.category])}</div>
      <a href="${SITE_URL}/annuncio/${j.id}" style="font-size:16px;font-weight:700;color:#2340d8;text-decoration:none">${esc(j.title)}</a>
      <div style="font-size:14px;color:#13201c">${esc(j.company)} · ${esc(j.city ?? "Italia")} · ${esc(pay)}</div>
    </td></tr>`;
  }).join("");
  return `<!doctype html><html lang="it"><body style="margin:0;background:#f3f6f5;font-family:Arial,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:24px 12px">
  <table width="100%" style="max-width:560px;background:#fff;border-radius:12px;padding:24px" cellpadding="0" cellspacing="0">
    <tr><td style="font-size:20px;font-weight:800;color:#13201c;padding-bottom:4px">primopasso</td></tr>
    <tr><td style="font-size:15px;color:#13201c;padding-bottom:12px">${jobs.length} ${jobs.length === 1 ? "nuovo annuncio" : "nuovi annunci"} per <b>${esc(label)}</b></td></tr>
    ${items}
    <tr><td style="padding-top:16px"><a href="${searchUrl}" style="background:#2340d8;color:#fff;padding:10px 16px;border-radius:8px;text-decoration:none;font-weight:700">Vedi tutti gli annunci</a></td></tr>
    <tr><td style="padding-top:20px;font-size:12px;color:#586863">Ricevi questa email perché hai creato un avviso su Primopasso. <a href="${unsubscribeUrl}" style="color:#586863">Disiscriviti da questo avviso</a>.</td></tr>
  </table></td></tr></table></body></html>`;
}

/** Invia le email degli avvisi: ogni giorno i giornalieri, il lunedì anche i settimanali. */
export async function sendAlerts(): Promise<{ sent: number; skipped: number; errors: string[] }> {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  if (!key || !from) return { sent: 0, skipped: 0, errors: ["RESEND_API_KEY o EMAIL_FROM non impostati"] };
  const resend = new Resend(key);
  const db = supabaseAdmin();
  const isMonday = new Date().getUTCDay() === 1;
  const freqs = isMonday ? ["giornaliero", "settimanale"] : ["giornaliero"];

  const { data: searches } = await db.from("saved_searches").select("id,user_id,label,filters,last_sent_at,created_at,unsubscribe_token").in("frequency", freqs);
  const out = { sent: 0, skipped: 0, errors: [] as string[] };

  for (const s of searches ?? []) {
    try {
      const { data: profile } = await db.from("profiles").select("emails").eq("id", s.user_id).maybeSingle();
      if (profile && !profile.emails) { out.skipped++; continue; }
      const f: Filters = { ...EMPTY_FILTERS, ...(s.filters as Partial<Filters>) };
      const since = s.last_sent_at ?? s.created_at;
      const res = await searchJobs(f, 1, since, db);
      if (!res.jobs.length) { out.skipped++; continue; }
      const { data: user } = await db.auth.admin.getUserById(s.user_id);
      const email = user.user?.email;
      if (!email) { out.skipped++; continue; }
      const { error } = await resend.emails.send({
        from, to: email,
        subject: `${res.total} ${res.total === 1 ? "nuovo annuncio" : "nuovi annunci"}: ${s.label}`,
        html: emailHtml(s.label, res.jobs, SITE_URL + "/" + toQuery(f), `${SITE_URL}/avvisi/disiscriviti?t=${s.unsubscribe_token}`),
      });
      if (error) throw new Error(error.message);
      await db.from("saved_searches").update({ last_sent_at: new Date().toISOString() }).eq("id", s.id);
      out.sent++;
    } catch (e) {
      out.errors.push(`${s.id}: ${e instanceof Error ? e.message : String(e)}`);
    }
  }
  return out;
}
