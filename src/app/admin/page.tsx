import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/account";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { CompanyManager, IngestButton, ReviewItem, SponsorForm, SubmissionItem, type CompanyRow, type QueueItem, type SponsorRow, type SubmissionRow } from "./AdminClient";

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
  const month = new Date(Date.now() - 30 * 86_400_000).toISOString();
  const [subs, clicks, sponsorsRes, featuredRes] = await Promise.all([
    db.from("job_submissions").select("*").eq("status", "in_attesa").order("created_at").limit(30),
    db.from("clicks").select("kind,job_id,jobs(title,company_name)").gte("created_at", month).limit(20000),
    db.from("sponsors").select("slot,active,name,text,url").order("slot", { ascending: false }),
    db.from("jobs").select("id,title,company_name,featured_until").eq("status", "pubblicato").not("featured_until", "is", null).order("featured_until"),
  ]);
  const needsUpdate = Boolean(subs.error || clicks.error || sponsorsRes.error);
  const subItems: SubmissionRow[] = (subs.data ?? []).map((r) => ({
    id: r.id, title: r.title, company: r.company_name, city: r.city, category: r.category, applyUrl: r.apply_url, description: r.description,
    wantsFeatured: r.wants_featured, contactName: r.contact_name, contactEmail: r.contact_email, vat: r.vat_number, notes: r.notes, createdAt: r.created_at,
  }));

  // Click degli ultimi 30 giorni: totali e annunci più cliccati
  const totals = { candidatura: 0, sponsor_sito: 0, sponsor_email: 0 } as Record<string, number>;
  const perJob = new Map<string, { title: string; company: string; n: number }>();
  for (const c of clicks.data ?? []) {
    totals[c.kind] = (totals[c.kind] ?? 0) + 1;
    if (c.kind !== "candidatura" || !c.job_id) continue;
    const j = (Array.isArray(c.jobs) ? c.jobs[0] : c.jobs) as { title: string; company_name: string } | null;
    const row = perJob.get(c.job_id) ?? { title: j?.title ?? "Annuncio rimosso", company: j?.company_name ?? "", n: 0 };
    row.n++;
    perJob.set(c.job_id, row);
  }
  const top = [...perJob.entries()].sort((a, b) => b[1].n - a[1].n).slice(0, 10);
  const featuredJobs = (featuredRes.data ?? []).map((j) => ({ id: j.id, title: j.title, company: j.company_name, until: j.featured_until as string, clicks: perJob.get(j.id)?.n ?? 0 }));
  const emptySponsor = (slot: "sito" | "email"): SponsorRow => ({ slot, active: false, name: "", text: "", url: "" });
  const sponsorRows: SponsorRow[] = (["sito", "email"] as const).map((slot) => (sponsorsRes.data ?? []).find((x) => x.slot === slot) ?? emptySponsor(slot));

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
      {needsUpdate && (
        <div className="panel warn-panel" role="alert">
          <strong>Manca l&apos;aggiornamento del database.</strong> Apri Supabase → SQL Editor, incolla il file <code>supabase/aggiornamento-01-guadagni.sql</code> e premi Run: poi ricarica questa pagina.
        </div>
      )}

      <div className="page-head" style={{ marginTop: 16 }}>
        <h1 style={{ fontSize: 26 }}>Richieste dalle aziende</h1>
        <p>Annunci inviati dal modulo della pagina «Per le aziende». Se chiedono l&apos;evidenza, pubblicali dopo il pagamento.</p>
      </div>
      <div className="panel">
        {subItems.length ? subItems.map((i) => <SubmissionItem key={i.id} item={i} />) : (
          <div className="empty" style={{ border: 0 }}><strong>Nessuna richiesta</strong>Quando un&apos;azienda invia un annuncio lo trovi qui{process.env.NEXT_PUBLIC_SUPPORT_EMAIL ? " e ricevi un'email" : ""}.</div>
        )}
      </div>

      <div className="page-head" style={{ marginTop: 16 }}>
        <h1 style={{ fontSize: 26 }}>Click negli ultimi 30 giorni</h1>
        <p>Quante persone sono andate a candidarsi o sul sito di uno sponsor. Sono i numeri da mostrare ad aziende e inserzionisti. Le visite al sito sono nella sezione Analytics di Vercel.</p>
      </div>
      <div className="stats">
        <div className="stat"><b className="num">{totals.candidatura}</b><span>Click su «Candidati»</span></div>
        <div className="stat"><b className="num">{totals.sponsor_sito}</b><span>Click sullo sponsor del sito</span></div>
        <div className="stat"><b className="num">{totals.sponsor_email}</b><span>Click sullo sponsor delle email</span></div>
      </div>
      <div className="panel">
        <div className="table-scroll">
          <table className="cos">
            <thead><tr><th>Annunci più cliccati</th><th>Azienda</th><th className="num">Click</th></tr></thead>
            <tbody>
              {top.map(([id, r]) => (
                <tr key={id}><td><a href={`/annuncio/${id}`}>{r.title}</a></td><td>{r.company}</td><td className="num">{r.n}</td></tr>
              ))}
              {!top.length && <tr><td colSpan={3} className="fine">Ancora nessun click registrato.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      <div className="page-head" style={{ marginTop: 16 }}>
        <h1 style={{ fontSize: 26 }}>Annunci in evidenza</h1>
        <p>Per mettere in evidenza un annuncio qualsiasi, aprilo: nella colonna a destra trovi i pulsanti riservati all&apos;admin.</p>
      </div>
      <div className="panel">
        <div className="table-scroll">
          <table className="cos">
            <thead><tr><th>Annuncio</th><th>Fino al</th><th className="num">Click (30 gg)</th></tr></thead>
            <tbody>
              {featuredJobs.map((j) => (
                <tr key={j.id}><td><a href={`/annuncio/${j.id}`}>{j.title}</a><div className="fine">{j.company}</div></td><td>{new Date(j.until).toLocaleDateString("it-IT")}</td><td className="num">{j.clicks}</td></tr>
              ))}
              {!featuredJobs.length && <tr><td colSpan={3} className="fine">Nessun annuncio in evidenza.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      <div className="page-head" style={{ marginTop: 16 }}>
        <h1 style={{ fontSize: 26 }}>Spazi sponsor</h1>
        <p>Spazi venduti direttamente (per esempio a corsi, master o academy). Non usano cookie, quindi non serve il consenso dei visitatori.</p>
      </div>
      <div className="panel" style={{ display: "grid", gap: 22 }}>
        {sponsorRows.map((sp) => <SponsorForm key={sp.slot} sponsor={sp} clicks={sp.slot === "sito" ? totals.sponsor_sito : totals.sponsor_email} />)}
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
