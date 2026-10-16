"use client";
import Link from "next/link";
import { useTransition } from "react";
import { deleteAlert, updateAlertFrequency } from "@/app/actions";

type Props = { id: string; label: string; frequency: "giornaliero" | "settimanale"; href: string; fresh: number };

export function AlertRow({ id, label, frequency, href, fresh }: Props) {
  const [pending, start] = useTransition();
  return (
    <div className="panel alert-row" aria-busy={pending}>
      <div>
        <h3>{label}</h3>
        <div className="meta num">{fresh} {fresh === 1 ? "annuncio nuovo" : "annunci nuovi"} negli ultimi 7 giorni</div>
      </div>
      <div className="alert-actions">
        <select aria-label="Frequenza email" defaultValue={frequency} onChange={(e) => start(() => updateAlertFrequency(id, e.target.value as Props["frequency"]))}>
          <option value="giornaliero">Ogni giorno</option>
          <option value="settimanale">Ogni lunedì</option>
        </select>
        <Link className="btn btn-ghost" href={href}>Apri ricerca</Link>
        <button className="btn btn-quiet" onClick={() => start(() => deleteAlert(id))} aria-label={`Elimina avviso ${label}`}>Elimina</button>
      </div>
    </div>
  );
}
