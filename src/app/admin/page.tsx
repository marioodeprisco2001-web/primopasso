import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/account";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { CompanyManager, IngestButton, ReviewItem, type CompanyRow, type QueueItem } from "./AdminClient";

export const metadata: Metadata = { title: "Admin", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const s = await getSession();
  if (!s.user) redirect("/accedi?next=/admin");
  if (!s.isAdmin) redirect("/");
  const db = supabaseAdmin();
  const since = new Date(Date.now() - 86_400_000).toISOString();
  const [pub, queue, rejected, companies] = await Promise.all([
    db.from("jobs").select("id", { count: "exact", head: true }).eq("status", "pubblicato"),
    db.from("jobs").select("id,title,company_name,city,url,review_reason,confidence,category").eq("status", "in_revisione").order("created_at").limit(30),
    db.from("jobs").select("id", { count: "exact", head: true }).eq("status", "scartato").gte("classified_at", since),
    db.from("companies").select("id,name,ats,ats_slug,active,last_fetched_at,last_error").order("name"),
  ]);
  const items: QueueItem[] = (queue.data ?? []).map((r) => ({ id: r.id, title: r.title, company: r.company_name, city: r.city, url: r.url, reason: r.review_reason, confidence: r.confidence, category: r.category }));
  const cos: CompanyRow[] = (companies.data ?? []).map((c) => ({ id: c.id, name: c.name, ats: c.ats, slug: c.ats_slug, active: c.active, lastFetched: c.last_fetched_at, lastError: c.last_error }));

  return (
    <div className="wrap page">
      <div className="page-head">
        <div className="eyebrow">Area riservata</div>
        <h1>Revisione annunci</h1>
        <p>Gli annunci che la classificazione non ha saputo giudicare con sicurezza. Nessuno viene pubblicato senza il tuo via libera.</p>
      </div>
      <div className="stats">
        <div className="stat"><b className="num">{pub.count ?? 0}</b><span>Annunci pubblicati</span></div>
        <div className="stat"><b className="num">{items.length}</b><span>In attesa di revisione</span></div>
        <div className="stat"><b className="num">{rejected.count ?? 0}</b><span>Scartati nelle ultime 24 ore</span></div>
      </div>
      <div className="panel">
        {items.length ? items.map((i) => <ReviewItem key={i.id} item={i} />) : (
          <div className="empty" style={{ border: 0 }}><strong>Coda vuota</strong>I prossimi annunci incerti arrivano con la raccolta di stanotte.</div>
        )}
      </div>
      <div className="page-head" style={{ marginTop: 16 }}>
        <h1 style={{ fontSize: 26 }}>Aziende seguite</h1>
        <p>Le pagine carriere da cui raccogliamo gli annunci ogni notte.</p>
      </div>
      <IngestButton />
      <div className="panel"><CompanyManager companies={cos} /></div>
    </div>
  );
}
