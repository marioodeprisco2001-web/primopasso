import type { Metadata } from "next";
export const metadata: Metadata = { title: "Privacy policy" };
export default function Page() {
  return (
    <div className="wrap page"><div className="prose">
      <h1>Privacy policy</h1>
      <p><strong>Bozza da completare prima del lancio</strong>, idealmente con un generatore conforme al GDPR o con un professionista.</p>
      <h2>Chi cerca lavoro</h2>
      <p>Dati raccolti: indirizzo email, città e aree di interesse indicate nel profilo, annunci salvati e ricerche salvate. Servono solo per far funzionare l&apos;account e inviare gli avvisi richiesti.</p>
      <h2>Aziende che pubblicano annunci</h2>
      <p>Dal modulo «Pubblica un annuncio» raccogliamo nome, email aziendale ed eventuale partita IVA della persona di contatto. Li usiamo per verificare l&apos;annuncio, rispondere alla richiesta ed emettere la fattura dei servizi a pagamento. Non vengono pubblicati.</p>
      <h2>Statistiche</h2>
      <p>Per sapere quante persone visitano il sito usiamo Vercel Web Analytics, che non usa cookie e non identifica i singoli visitatori. Contiamo anche i click sul pulsante «Candidati» e sui contenuti sponsorizzati, registrando solo cosa è stato cliccato e quando, senza dati personali.</p>
      <h2>Conservazione e diritti</h2>
      <p>I dati sono conservati su server nell&apos;Unione Europea (Supabase, regione Francoforte). Puoi eliminare l&apos;account e tutti i dati collegati in qualsiasi momento dalla pagina Profilo, oppure scriverci per esercitare gli altri diritti previsti dal GDPR.</p>
      <h2>Cessione del sito</h2>
      <p>Se Primopasso venisse ceduto o trasferito a un altro titolare, i dati degli utenti passerebbero al nuovo titolare, che dovrà rispettare questa informativa. Gli utenti verrebbero avvisati prima del trasferimento e potrebbero eliminare il proprio account.</p>
      <p>Titolare del trattamento: da indicare.</p>
    </div></div>
  );
}
