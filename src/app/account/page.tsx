import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";
import { ProfileForm } from "./ProfileForm";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Profilo", robots: { index: false } };

export default async function AccountPage() {
  const sb = await supabaseServer();
  const user = sb ? (await sb.auth.getUser()).data.user : null;
  if (!sb || !user) redirect("/accedi?next=/account");
  const { data: p } = await sb.from("profiles").select("city,areas,emails").eq("id", user.id).maybeSingle();
  return (
    <div className="wrap page">
      <div className="page-head">
        <div className="eyebrow">Il tuo account</div>
        <h1>Profilo</h1>
        <p>Pochi dati, solo quelli che servono per gli avvisi.</p>
      </div>
      <div className="panel">
        <ProfileForm email={user.email ?? ""} city={p?.city ?? ""} areas={p?.areas ?? []} emails={p?.emails ?? true} />
      </div>
    </div>
  );
}
