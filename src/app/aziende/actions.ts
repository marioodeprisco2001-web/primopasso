"use server";
import { Resend } from "resend";
import { z } from "zod";
import { isSafeUrl } from "@/lib/clicks";
import { isSupabaseConfigured, SITE_URL } from "@/lib/supabase/config";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { AREAS, CATEGORY_KEYS, MODE_KEYS, REGIONS } from "@/lib/types";

export type SubmitState = { ok: boolean; message: string } | null;

const optInt = z.preprocess((v) => (v === "" || v === null ? undefined : Number(String(v).replace(/[^\d]/g, ""))), z.number().int().min(0).max(500_000).optional());
const optText = (max: number) => z.preprocess((v) => (typeof v === "string" && v.trim() ? v.trim() : undefined), z.string().max(max).optional());

const Schema = z.object({
  title: z.string().trim().min(4, "Inserisci il titolo dell'annuncio").max(120),
  company_name: z.string().trim().min(2, "Inserisci il nome dell'azienda").max(100),
  apply_url: z.string().trim().min(5, "Inserisci il link o l'email per candidarsi").max(500),
  city: optText(80),
  region: z.preprocess((v) => (v ? v : undefined), z.enum(REGIONS).optional()),
  mode: z.enum(MODE_KEYS, "Scegli la modalità di lavoro"),
  category: z.enum(CATEGORY_KEYS, "Scegli il tipo di posizione"),
  area: z.preprocess((v) => (v ? v : undefined), z.enum(AREAS).optional()),
  pay_monthly: optInt,
  pay_annual: optInt,
  duration_months: optInt,
  description: z.string().trim().min(80, "La descrizione deve avere almeno 80 caratteri").max(4000),
  requirements: optText(1500),
  wants_featured: z.boolean(),
  contact_name: z.string().trim().min(2, "Inserisci il tuo nome").max(100),
  contact_email: z.string().trim().pipe(z.email("Email di contatto non valida")),
  vat_number: optText(20),
  notes: optText(1000),
  consent: z.literal(true, "Serve il consenso al trattamento dei dati"),
});

/** Modulo «Pubblica un annuncio»: salva la richiesta, che pubblichi tu dall'area admin. */
export async function submitJob(_prev: SubmitState, form: FormData): Promise<SubmitState> {
  // Campo trappola: le persone non lo vedono, i bot lo compilano.
  if (String(form.get("website") ?? "")) return { ok: true, message: "Richiesta inviata." };
  if (!isSupabaseConfigured()) return { ok: false, message: "Sito in modalità anteprima: il modulo si attiva con il database." };

  const raw = Object.fromEntries(form.entries());
  const parsed = Schema.safeParse({ ...raw, wants_featured: raw.wants_featured === "on", consent: raw.consent === "on" });
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message ?? "Controlla i campi del modulo." };
  const d = parsed.data;

  // Link di candidatura: indirizzo web oppure email
  let apply = d.apply_url;
  if (!/^https?:\/\//i.test(apply) && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(apply)) apply = "mailto:" + apply;
  else if (!/^https?:\/\//i.test(apply) && !apply.startsWith("mailto:")) apply = "https://" + apply;
  if (!isSafeUrl(apply)) return { ok: false, message: "Il link per candidarsi non è valido." };

  const db = supabaseAdmin();
  const since = new Date(Date.now() - 86_400_000).toISOString();
  const { count } = await db.from("job_submissions").select("id", { count: "exact", head: true }).eq("contact_email", d.contact_email).gte("created_at", since);
  if ((count ?? 0) >= 5) return { ok: false, message: "Hai già inviato 5 annunci oggi. Scrivici se te ne servono di più." };

  const { error } = await db.from("job_submissions").insert({
    title: d.title, company_name: d.company_name, apply_url: apply, city: d.city ?? null, region: d.region ?? null,
    mode: d.mode, category: d.category, area: d.area ?? null,
    pay_monthly: d.pay_monthly ?? null, pay_annual: d.pay_annual ?? null, duration_months: d.duration_months ?? null,
    description: d.description,
    requirements: (d.requirements ?? "").split("\n").map((r) => r.replace(/^[-•*\s]+/, "").trim()).filter(Boolean).slice(0, 10),
    wants_featured: d.wants_featured, contact_name: d.contact_name, contact_email: d.contact_email,
    vat_number: d.vat_number ?? null, notes: d.notes ?? null,
  });
  if (error) return { ok: false, message: "Invio non riuscito. Riprova tra poco." };

  await notifyAdmin(d.company_name, d.title, d.wants_featured);
  return {
    ok: true,
    message: d.wants_featured
      ? "Richiesta inviata. Ti scriviamo entro due giorni lavorativi con i dettagli per l'evidenza; l'annuncio va online dopo la verifica."
      : "Richiesta inviata. Controlliamo l'annuncio e lo pubblichiamo entro due giorni lavorativi.",
  };
}

/** Avvisa l'admin via email, se Resend e l'email di supporto sono configurati. */
async function notifyAdmin(company: string, title: string, featured: boolean) {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  const to = process.env.NEXT_PUBLIC_SUPPORT_EMAIL;
  if (!key || !from || !to) return;
  try {
    await new Resend(key).emails.send({
      from, to,
      subject: `Nuovo annuncio da approvare${featured ? " (vuole l'evidenza)" : ""}: ${company}`,
      text: `${company} ha inviato «${title}».\n\nApprova o rifiuta da ${SITE_URL}/admin`,
    });
  } catch {
    // La richiesta è salvata comunque: la trovi nell'area admin.
  }
}
