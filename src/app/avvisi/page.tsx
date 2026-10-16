import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { toQuery } from "@/lib/filters";
import { searchJobs } from "@/lib/jobs";
import { supabaseServer } from "@/lib/supabase/server";
import { EMPTY_FILTERS, type Filters } from "@/lib/types";
import { AlertRow } from "./AlertRow";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Avvisi email", robots: { index: false } };

export default async function AlertsPage() {
  const sb = await supabaseServer();
  const user = sb ? (await sb.auth.getUser()).data.user : null;
  if (!sb || !user) redirect("/accedi?next=/avvisi");
  const { data } = await sb.from("saved_searches").select("id,label,filters,frequency").eq("user_id", user.id).order("created_at", { ascending: false });
  const alerts = await Promise.all(
    (data ?? []).map(async (a) => {
      const f: Filters = { ...EMPTY_FILTERS, ...(a.filters as Partial<Filters>) };
      const res = await searchJobs({ ...f, days: 7 });
      return { ...a, href: "/" + toQuery(f), fresh: res.total };
    }),
  );
  return (
    <div className="wrap page">
      <div className="page-head">
        <div className="eyebrow">Il tuo account</div>
        <h1>Avvisi email</h1>
        <p>Salva una ricerca e ricevi via email i nuovi annunci che la rispettano. Ogni email ha il link per disiscriversi.</p>
      </div>
      {alerts.length ? (
        <div className="alerts">
          {alerts.map((a) => <AlertRow key={a.id} id={a.id} label={a.label} frequency={a.frequency} href={a.href} fresh={a.fresh} />)}
        </div>
      ) : (
        <div className="empty">
          <strong>Nessun avviso attivo</strong>
          Imposta i filtri nella ricerca e premi «Crea avviso».
          <Link className="btn btn-ghost" href="/">Vai alla ricerca</Link>
        </div>
      )}
    </div>
  );
}
