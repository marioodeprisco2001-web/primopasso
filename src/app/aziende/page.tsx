import type { Metadata } from "next";
export const metadata: Metadata = { title: "Per le aziende" };
export default function Page() {
  const email = process.env.NEXT_PUBLIC_SUPPORT_EMAIL;
  return (
    <div className="wrap page"><div className="prose">
      <h1>Per le aziende</h1>
      <p>Se la tua azienda pubblica stage, tirocini, apprendistati o posizioni junior su una pagina carriere, possiamo mostrarli su Primopasso gratuitamente.</p>
      <p>Presto potrai pubblicare annunci direttamente e metterli in evidenza.</p>
      {email && <p>Scrivici a <span style={{ userSelect: "all" }}>{email}</span>.</p>}
    </div></div>
  );
}
