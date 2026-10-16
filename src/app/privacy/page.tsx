import type { Metadata } from "next";
export const metadata: Metadata = { title: "Privacy policy" };
export default function Page() {
  return (
    <div className="wrap page"><div className="prose">
      <h1>Privacy policy</h1>
      <p><strong>Bozza da completare prima del lancio</strong>, idealmente con un generatore conforme al GDPR o con un professionista.</p>
      <p>Dati raccolti: indirizzo email, città e aree di interesse indicate nel profilo, annunci salvati e ricerche salvate. Servono solo per far funzionare l&apos;account e inviare gli avvisi richiesti.</p>
      <p>I dati sono conservati su server nell&apos;Unione Europea (Supabase, regione Francoforte). Puoi eliminare l&apos;account e tutti i dati collegati in qualsiasi momento dalla pagina Profilo.</p>
      <p>Titolare del trattamento: da indicare.</p>
    </div></div>
  );
}
