import type { Metadata } from "next";
import Link from "next/link";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const metadata: Metadata = { title: "Disiscrizione", robots: { index: false } };
export const dynamic = "force-dynamic";

/** Link presente in ogni email: elimina l'avviso senza bisogno di accedere. */
export default async function Unsubscribe({ searchParams }: { searchParams: Promise<{ t?: string }> }) {
  const { t } = await searchParams;
  let label: string | null = null;
  if (t && /^[0-9a-f-]{36}$/i.test(t) && isSupabaseConfigured()) {
    const { data } = await supabaseAdmin().from("saved_searches").delete().eq("unsubscribe_token", t).select("label").maybeSingle();
    label = data?.label ?? null;
  }
  return (
    <div className="wrap">
      <div className="auth-card">
        <h1>{label ? "Disiscrizione fatta" : "Link non valido"}</h1>
        <p>{label ? `Non riceverai più email per l'avviso «${label}».` : "Questo avviso è già stato eliminato oppure il link è incompleto."}</p>
        <Link className="btn btn-ghost" href="/avvisi">Gestisci i tuoi avvisi</Link>
      </div>
    </div>
  );
}
