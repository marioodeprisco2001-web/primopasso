"use client";
import { useState, useTransition } from "react";
import { deleteAccount, saveProfile } from "@/app/actions";
import { AREAS } from "@/lib/types";

type Props = { email: string; city: string; areas: string[]; emails: boolean };

export function ProfileForm({ email, city, areas, emails }: Props) {
  const [msg, setMsg] = useState("");
  const [confirm, setConfirm] = useState(false);
  const [pending, start] = useTransition();

  return (
    <form className="form" action={(fd) => start(async () => { const r = await saveProfile(fd); setMsg(r.message ?? ""); })}>
      <label className="lbl" htmlFor="pEmail">Email<input id="pEmail" type="email" value={email} disabled /></label>
      <label className="lbl" htmlFor="pCity">Dove cerchi<input id="pCity" name="city" type="text" defaultValue={city} placeholder="Per esempio Milano" /></label>
      <fieldset style={{ border: 0, padding: 0, margin: 0, display: "grid", gap: 8 }}>
        <legend className="lbl" style={{ fontWeight: 600, fontSize: 14, marginBottom: 8 }}>Aree che ti interessano</legend>
        <div className="checks">
          {AREAS.map((a) => (
            <label key={a} className="check"><input type="checkbox" name="areas" value={a} defaultChecked={areas.includes(a)} /> {a}</label>
          ))}
        </div>
      </fieldset>
      <label className="check"><input type="checkbox" name="emails" defaultChecked={emails} /> Voglio ricevere gli avvisi via email</label>
      <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
        <button className="btn btn-primary" type="submit" disabled={pending}>Salva profilo</button>
        {msg && <span className="okmsg" role="status">{msg}</span>}
      </div>
      <div className="danger-zone">
        <button type="submit" formAction="/auth/esci" formMethod="post" className="btn btn-ghost">Esci</button>
        {confirm ? (
          <>
            <span className="fine">Elimini account, preferiti e avvisi. Non si può annullare.</span>
            <button type="button" className="btn btn-danger" onClick={() => start(() => deleteAccount())}>Sì, elimina</button>
            <button type="button" className="btn btn-quiet" onClick={() => setConfirm(false)}>Annulla</button>
          </>
        ) : (
          <button type="button" className="btn btn-danger" onClick={() => setConfirm(true)}>Elimina account</button>
        )}
      </div>
    </form>
  );
}
