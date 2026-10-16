"use server";
import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/account";
import { runIngest } from "@/lib/ingest/run";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { CATEGORY_KEYS, type Category } from "@/lib/types";

async function requireAdmin() {
  const s = await getSession();
  if (!s.isAdmin) throw new Error("Non autorizzato");
}

export async function approveJob(id: string, category: Category) {
  await requireAdmin();
  if (!CATEGORY_KEYS.includes(category)) return;
  await supabaseAdmin().from("jobs").update({ status: "pubblicato", category, review_reason: null, classified_at: new Date().toISOString() }).eq("id", id);
  revalidatePath("/admin");
}

export async function rejectJob(id: string) {
  await requireAdmin();
  await supabaseAdmin().from("jobs").update({ status: "scartato", classified_at: new Date().toISOString() }).eq("id", id);
  revalidatePath("/admin");
}

const ATS = ["greenhouse", "lever", "ashby", "workable"] as const;

export async function addCompany(form: FormData): Promise<string> {
  await requireAdmin();
  const name = String(form.get("name") ?? "").trim();
  const ats = String(form.get("ats") ?? "");
  // Accetta sia lo slug sia l'indirizzo completo della pagina carriere
  const slug = String(form.get("slug") ?? "").trim().replace(/\/+$/, "").split("/").pop() ?? "";
  if (!name || !slug || !ATS.includes(ats as (typeof ATS)[number])) return "Compila nome, sistema e indirizzo della pagina carriere.";
  const { error } = await supabaseAdmin().from("companies").insert({ name, ats, ats_slug: slug });
  revalidatePath("/admin");
  if (error) return error.code === "23505" ? "Questa azienda è già in elenco." : "Salvataggio non riuscito.";
  return `${name} aggiunta: i suoi annunci arrivano con la prossima raccolta.`;
}

export async function toggleCompany(id: string, active: boolean) {
  await requireAdmin();
  await supabaseAdmin().from("companies").update({ active }).eq("id", id);
  revalidatePath("/admin");
}

export async function ingestNow(): Promise<string> {
  await requireAdmin();
  const r = await runIngest({ maxCompanies: 10, maxClassify: 25 });
  revalidatePath("/admin");
  return `Raccolta completata: ${r.fetched} annunci letti, ${r.newJobs} nuovi, ${r.published} pubblicati, ${r.review} in revisione, ${r.rejected} scartati, ${r.expired} scaduti.${r.errors.length ? " Errori: " + r.errors.join("; ") : ""}`;
}
