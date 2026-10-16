import "server-only";
import { supabaseServer } from "./supabase/server";

export type Session = {
  user: { id: string; email: string } | null;
  isAdmin: boolean;
  favCount: number;
  alertCount: number;
};

/** Dati dell'utente collegato per header e barre di navigazione. */
export async function getSession(): Promise<Session> {
  const sb = await supabaseServer();
  if (!sb) return { user: null, isAdmin: false, favCount: 0, alertCount: 0 };
  const { data } = await sb.auth.getUser();
  if (!data.user) return { user: null, isAdmin: false, favCount: 0, alertCount: 0 };
  const uid = data.user.id;
  const [profile, favs, alerts] = await Promise.all([
    sb.from("profiles").select("is_admin").eq("id", uid).maybeSingle(),
    sb.from("favorites").select("job_id", { count: "exact", head: true }).eq("user_id", uid),
    sb.from("saved_searches").select("id", { count: "exact", head: true }).eq("user_id", uid),
  ]);
  return {
    user: { id: uid, email: data.user.email ?? "" },
    isAdmin: Boolean(profile.data?.is_admin),
    favCount: favs.count ?? 0,
    alertCount: alerts.count ?? 0,
  };
}
