import type { Metadata } from "next";
import { SubmitForm } from "./SubmitForm";

export const metadata: Metadata = {
  title: "Per le aziende: pubblica stage e posizioni junior",
  description: "Pubblica gratis stage, tirocini, apprendistati e posizioni junior su Primopasso. Metti in evidenza l'annuncio per arrivare a più candidati.",
};

export default function Page() {
  const email = process.env.NEXT_PUBLIC_SUPPORT_EMAIL;
  const featuredPrice = process.env.NEXT_PUBLIC_PRICE_FEATURED?.trim() || null;
  return (
    <div className="wrap page">
      <div className="page-head">
        <div className="eyebrow">Per le aziende</div>
        <h1>Trova chi inizia, senza farti cercare tra mille annunci</h1>
        <p>Primopasso pubblica solo stage, tirocini, apprendistati e posizioni junior: chi lo visita cerca esattamente questo. I candidati si candidano direttamente sul tuo sito o via email.</p>
      </div>

      <div className="plans">
        <div className="plan">
          <div className="eyebrow">Base</div>
          <b className="price">Gratis</b>
          <ul>
            <li>Annuncio pubblicato dopo la nostra verifica</li>
            <li>Online per 60 giorni</li>
            <li>Candidature sul tuo sito o via email</li>
          </ul>
        </div>
        <div className="plan plan-hi">
          <div className="eyebrow">In evidenza</div>
          <b className="price">{featuredPrice ?? "Su richiesta"}</b>
          <ul>
            <li>30 giorni in cima ai risultati di ricerca</li>
            <li>Etichetta «In evidenza»</li>
            <li>Report dei click su «Candidati» a fine periodo</li>
          </ul>
        </div>
        <div className="plan">
          <div className="eyebrow">Hai già una pagina carriere?</div>
          <b className="price">Gratis</b>
          <ul>
            <li>Se usi Greenhouse, Lever, Ashby o Workable leggiamo i tuoi annunci ogni notte</li>
            <li>{email ? <>Scrivici a <span style={{ userSelect: "all" }}>{email}</span></> : "Scrivici dall'email indicata nel sito"}</li>
          </ul>
        </div>
      </div>

      <div className="page-head" style={{ marginTop: 8 }}>
        <h2 style={{ fontSize: 26 }}>Pubblica un annuncio</h2>
        <p>Compila il modulo: lo controlliamo e lo mettiamo online entro due giorni lavorativi.</p>
      </div>
      <SubmitForm featuredPrice={featuredPrice} />
    </div>
  );
}
