import type { Metadata } from "next";
export const metadata: Metadata = { title: "Cookie policy" };
export default function Page() {
  return (
    <div className="wrap page"><div className="prose">
      <h1>Cookie policy</h1>
      <p><strong>Bozza da completare prima del lancio.</strong></p>
      <p>Cookie tecnici: servono per mantenere l&apos;accesso al tuo account e ricordare la tua scelta sui cookie. Non richiedono consenso.</p>
      <p>Statistiche: usiamo Vercel Web Analytics, che non installa cookie e non raccoglie dati che ti identificano.</p>
      <p>Contenuti sponsorizzati: sono link diretti agli sponsor, senza cookie né tracciamento pubblicitario.</p>
      <p>Cookie di pubblicità di terze parti: oggi non ne usiamo. Se in futuro li introdurremo, verranno caricati solo dopo il tuo consenso. Puoi cambiare idea cancellando i dati del sito dal browser.</p>
    </div></div>
  );
}
