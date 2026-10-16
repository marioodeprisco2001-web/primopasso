"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { filtersLabel } from "@/lib/filters";
import { supabaseServer } from "@/lib/supabase/server";
import type { Filters } from "@/lib/types";

type Result = { ok: true; message?: string } | { ok: false; needLogin?: boolean; message: string };

async function authed() {
  const sb = await supabaseServer();
  if (!sb) return { sb: null, uid: null };
  const { data } = await sb.auth.getUser();
  return { sb, uid: data.user?.id ?? null };
}

export async function toggleFavorite(jobId: string): Promise<Result & { fav?: boolean }> {
  const { sb, uid } = await authed();
  if (!sb) return { ok: false, message: "Sito in modalità anteprima: i preferiti si attivano con il database." };
  if (!uid) return { ok: false, needLogin: true, message: "Accedi per salvare gli annunci." };
  const { data: existing } = await sb.from("favorites").select("job_id").eq("user_id", uid).eq("job_id", jobId).maybeSingle();
  const res = existing
    ? await sb.from("favorites").delete().eq("user_id", uid).eq("job_id", jobId)
    : await sb.from("favorites").insert({ user_id: uid, job_id: jobId });
  if (res.error) return { ok: false, message: "Non siamo riusciti a salvare il preferito. Riprova tra poco." };
  revalidatePath("/", "layout");
  return { ok: true, fav: !existing };
}

export async function createSavedSearch(f: Filters): Promise<Result> {
  const { sb, uid } = await authed();
  if (!sb) return { ok: false, message: "Sito in modalità anteprima: gli avvisi si attivano con il database." };
  if (!uid) return { ok: false, needLogin: true, message: "Accedi per creare un avviso." };
  const label = filtersLabel(f);
  const { data: dup } = await sb.from("saved_searches").select("id").eq("user_id", uid).eq("label", label).maybeSingle();
  if (dup) return { ok: true, message: "Hai già un avviso per questa ricerca" };
  const { count } = await sb.from("saved_searches").select("id", { count: "exact", head: true }).eq("user_id", uid);
  if ((count ?? 0) >= 10) return { ok: false, message: "Puoi avere al massimo 10 avvisi. Eliminane uno per crearne un altro." };
  const filters = { q: f.q, where: f.where, cats: f.cats, areas: f.areas, modes: f.modes, paid: f.paid };
  const { error } = await sb.from("saved_searches").insert({ user_id: uid, label, filters });
  if (error) return { ok: false, message: "Non siamo riusciti a creare l'avviso. Riprova tra poco." };
  revalidatePath("/", "layout");
  return { ok: true, message: "Avviso creato: ti scriviamo ogni lunedì" };
}

export async function updateAlertFrequency(id: string, frequency: "giornaliero" | "settimanale") {
  const { sb, uid } = await authed();
  if (!sb || !uid) return;
  await sb.from("saved_searches").update({ frequency }).eq("id", id).eq("user_id", uid);
  revalidatePath("/avvisi");
}

export async function deleteAlert(id: string) {
  const { sb, uid } = await authed();
  if (!sb || !uid) return;
  await sb.from("saved_searches").delete().eq("id", id).eq("user_id", uid);
  revalidatePath("/", "layout");
}

export async function deleteAccount() {
  const { sb, uid } = await authed();
  if (!sb || !uid) redirect("/");
  await supabaseAdmin().auth.admin.deleteUser(uid); // preferiti, avvisi e profilo si cancellano a cascata
  await sb.auth.signOut();
  redirect("/?account=eliminato");
}

export async function saveProfile(form: FormData): Promise<Result> {
  const { sb, uid } = await authed();
  if (!sb || !uid) return { ok: false, needLogin: true, message: "Accedi di nuovo." };
  const { error } = await sb.from("profiles").update({
    city: String(form.get("city") ?? "").slice(0, 60),
    areas: form.getAll("areas").map(String).slice(0, 9),
    emails: form.get("emails") === "on",
  }).eq("id", uid);
  return error ? { ok: false, message: "Salvataggio non riuscito. Riprova." } : { ok: true, message: "Profilo salvato" };
}
