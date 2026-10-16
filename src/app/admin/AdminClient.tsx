"use client";
import { useState, useTransition } from "react";
import { WarnIcon } from "@/components/icons";
import { CATEGORIES, CATEGORY_KEYS, type Category } from "@/lib/types";
import { addCompany, approveJob, ingestNow, rejectJob, toggleCompany } from "./actions";

export type QueueItem = { id: string; title: string; company: string; city: string | null; url: string; reason: string | null; confidence: number | null; category: Category | null };
export type CompanyRow = { id: string; name: string; ats: string; slug: string; active: boolean; lastFetched: string | null; lastError: string | null };

export function ReviewItem({ item }: { item: QueueItem }) {
  const [cat, setCat] = useState<Category>(item.category ?? "junior");
  const [pending, start] = useTransition();
  return (
    <div className="qitem" aria-busy={pending}>
      <div>
        <h3>{item.title}</h3>
        <p className="co">{item.company}{item.city ? ` · ${item.city}` : ""} · <a href={item.url} target="_blank" rel="noopener">annuncio originale</a></p>
      </div>
      {item.reason && <div className="reason"><WarnIcon /><span>{item.reason}</span></div>}
      {item.confidence !== null && (
        <div className="conf">Sicurezza della classificazione <span className="bar"><i style={{ width: `${item.confidence}%` }} /></span> <span className="num">{item.confidence}%</span></div>
      )}
      <div className="qactions">
        <select aria-label="Categoria da assegnare" value={cat} onChange={(e) => setCat(e.target.value as Category)}>
          {CATEGORY_KEYS.map((k) => <option key={k} value={k}>{CATEGORIES[k]}</option>)}
        </select>
        <button className="btn btn-primary" disabled={pending} onClick={() => start(() => approveJob(item.id, cat))}>Pubblica</button>
        <button className="btn btn-ghost" disabled={pending} onClick={() => start(() => rejectJob(item.id))}>Scarta</button>
      </div>
    </div>
  );
}

export function CompanyManager({ companies }: { companies: CompanyRow[] }) {
  const [msg, setMsg] = useState("");
  const [pending, start] = useTransition();
  return (
    <div style={{ display: "grid", gap: 14 }}>
      <form className="addco" action={(fd) => start(async () => setMsg(await addCompany(fd)))}>
        <input name="name" placeholder="Nome azienda" aria-label="Nome azienda" required />
        <select name="ats" aria-label="Sistema della pagina carriere" defaultValue="greenhouse">
          <option value="greenhouse">Greenhouse</option>
          <option value="lever">Lever</option>
          <option value="ashby">Ashby</option>
          <option value="workable">Workable</option>
        </select>
        <input name="slug" placeholder="Indirizzo pagina carriere o slug" aria-label="Indirizzo della pagina carriere" required />
        <button className="btn btn-primary" disabled={pending}>Aggiungi</button>
      </form>
      {msg && <p className="okmsg" role="status">{msg}</p>}
      <div className="table-scroll">
        <table className="cos">
          <thead><tr><th>Azienda</th><th>Sistema</th><th>Ultima raccolta</th><th>Stato</th></tr></thead>
          <tbody>
            {companies.map((c) => (
              <tr key={c.id}>
                <td>{c.name}<div className="fine">{c.slug}</div></td>
                <td>{c.ats}</td>
                <td>{c.lastFetched ? new Date(c.lastFetched).toLocaleString("it-IT") : "Mai"}{c.lastError && <div className="err">{c.lastError}</div>}</td>
                <td><button className="btn btn-quiet" onClick={() => start(() => toggleCompany(c.id, !c.active))}>{c.active ? "Attiva · sospendi" : "Sospesa · riattiva"}</button></td>
              </tr>
            ))}
            {!companies.length && <tr><td colSpan={4} className="fine">Nessuna azienda. Aggiungi la prima qui sopra.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function IngestButton() {
  const [msg, setMsg] = useState("");
  const [pending, start] = useTransition();
  return (
    <div style={{ display: "grid", gap: 8 }}>
      <div><button className="btn btn-ghost" disabled={pending} onClick={() => start(async () => setMsg(await ingestNow()))}>{pending ? "Raccolta in corso…" : "Avvia raccolta ora"}</button></div>
      {msg && <p className="fine" role="status">{msg}</p>}
    </div>
  );
}
