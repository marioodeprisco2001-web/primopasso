"use client";
import { useState, useTransition } from "react";
import { setFeatured } from "@/app/admin/actions";

/** Visibile solo all'admin: mette o toglie l'annuncio dalla cima dei risultati. */
export function FeatureControl({ jobId, featured }: { jobId: string; featured: boolean }) {
  const [on, setOn] = useState(featured);
  const [msg, setMsg] = useState("");
  const [pending, start] = useTransition();
  const run = (days: number) =>
    start(async () => {
      const r = await setFeatured(jobId, days);
      setMsg(r);
      setOn(days > 0);
    });
  return (
    <div className="panel admin-box" aria-busy={pending}>
      <div className="eyebrow">Admin · evidenza</div>
      {on ? (
        <button className="btn btn-ghost" disabled={pending} onClick={() => run(0)}>Togli dall&apos;evidenza</button>
      ) : (
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button className="btn btn-ghost" disabled={pending} onClick={() => run(30)}>In evidenza 30 giorni</button>
          <button className="btn btn-quiet" disabled={pending} onClick={() => run(7)}>7 giorni</button>
        </div>
      )}
      {msg && <p className="fine" role="status">{msg}</p>}
    </div>
  );
}
