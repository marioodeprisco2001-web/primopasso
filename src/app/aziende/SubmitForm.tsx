"use client";
import { useActionState } from "react";
import { AREAS, CATEGORIES, CATEGORY_KEYS, MODES, MODE_KEYS, REGIONS } from "@/lib/types";
import { submitJob, type SubmitState } from "./actions";

export function SubmitForm({ featuredPrice }: { featuredPrice: string | null }) {
  const [state, action, pending] = useActionState<SubmitState, FormData>(submitJob, null);

  if (state?.ok)
    return (
      <div className="panel" role="status">
        <h2 style={{ fontSize: 22, marginBottom: 6 }}>Grazie!</h2>
        <p style={{ margin: 0 }}>{state.message}</p>
      </div>
    );

  return (
    <form className="form submit-form" action={action}>
      <fieldset>
        <legend>L&apos;annuncio</legend>
        <label className="lbl">Titolo<input name="title" type="text" required maxLength={120} placeholder="Per esempio: Stage Marketing digitale" /></label>
        <div className="grid2">
          <label className="lbl">Azienda<input name="company_name" type="text" required maxLength={100} /></label>
          <label className="lbl">Tipo di posizione
            <select name="category" required defaultValue="">
              <option value="" disabled>Scegli</option>
              {CATEGORY_KEYS.map((k) => <option key={k} value={k}>{CATEGORIES[k]}</option>)}
            </select>
          </label>
        </div>
        <div className="grid2">
          <label className="lbl">Area
            <select name="area" defaultValue="">
              <option value="">Altro</option>
              {AREAS.map((a) => <option key={a} value={a}>{a}</option>)}
            </select>
          </label>
          <label className="lbl">Modalità
            <select name="mode" required defaultValue="">
              <option value="" disabled>Scegli</option>
              {MODE_KEYS.map((k) => <option key={k} value={k}>{MODES[k]}</option>)}
            </select>
          </label>
        </div>
        <div className="grid2">
          <label className="lbl">Città<input name="city" type="text" maxLength={80} placeholder="Lascia vuoto se da remoto" /></label>
          <label className="lbl">Regione
            <select name="region" defaultValue="">
              <option value="">—</option>
              {REGIONS.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          </label>
        </div>
        <div className="grid3">
          <label className="lbl">Rimborso o stipendio mensile (€)<input name="pay_monthly" type="text" inputMode="numeric" placeholder="es. 800" /></label>
          <label className="lbl">oppure RAL annua (€)<input name="pay_annual" type="text" inputMode="numeric" placeholder="es. 26000" /></label>
          <label className="lbl">Durata (mesi)<input name="duration_months" type="text" inputMode="numeric" placeholder="es. 6" /></label>
        </div>
        <label className="lbl">Descrizione<textarea name="description" required minLength={80} maxLength={4000} rows={6} placeholder="Di cosa si occuperà la persona, il team, cosa imparerà." /></label>
        <label className="lbl">Requisiti principali <span className="fine">uno per riga</span><textarea name="requirements" maxLength={1500} rows={4} /></label>
        <label className="lbl">Link o email per candidarsi<input name="apply_url" type="text" required maxLength={500} placeholder="https://… oppure lavora@azienda.it" /></label>
      </fieldset>

      <fieldset>
        <legend>Visibilità</legend>
        <label className="check featured-choice">
          <input type="checkbox" name="wants_featured" />
          <span><b>Metti in evidenza{featuredPrice ? ` · ${featuredPrice}` : ""}</b><br /><span className="fine">30 giorni in cima ai risultati, con etichetta «In evidenza». Ti mandiamo i dettagli per il pagamento prima della pubblicazione.</span></span>
        </label>
      </fieldset>

      <fieldset>
        <legend>I tuoi dati (non vengono pubblicati)</legend>
        <div className="grid2">
          <label className="lbl">Nome e cognome<input name="contact_name" type="text" required maxLength={100} autoComplete="name" /></label>
          <label className="lbl">Email aziendale<input name="contact_email" type="email" required maxLength={200} autoComplete="email" /></label>
        </div>
        <label className="lbl">Partita IVA <span className="fine">facoltativa, serve per la fattura dell&apos;evidenza</span><input name="vat_number" type="text" maxLength={20} /></label>
        <label className="lbl">Note<textarea name="notes" maxLength={1000} rows={2} /></label>
      </fieldset>

      {/* Campo trappola per i bot: nascosto alle persone */}
      <input name="website" type="text" tabIndex={-1} autoComplete="off" aria-hidden="true" className="hp" />

      <label className="check"><input type="checkbox" name="consent" required /> <span>Ho letto la <a href="/privacy" target="_blank">privacy policy</a> e i <a href="/termini" target="_blank">termini d&apos;uso</a>.</span></label>
      {state && !state.ok && <p className="err" role="alert">{state.message}</p>}
      <div><button className="btn btn-primary" disabled={pending}>{pending ? "Invio…" : "Invia l'annuncio"}</button></div>
    </form>
  );
}
