"use client";
import { useEffect, useState } from "react";

/** Banner di consenso: finché l'utente non accetta, si caricano solo i cookie tecnici. */
export function CookieBanner() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    try { setShow(!localStorage.getItem("pp_cookie")); } catch { setShow(true); }
  }, []);
  const choose = (v: "all" | "tech") => {
    try { localStorage.setItem("pp_cookie", v); } catch {}
    setShow(false);
  };
  if (!show) return null;
  return (
    <div className="cookie" role="region" aria-label="Cookie">
      <div>Usiamo solo cookie tecnici per far funzionare il sito; le statistiche non usano cookie. Eventuali cookie di terze parti verrebbero caricati solo se accetti. <a href="/cookie" style={{ color: "inherit" }}>Dettagli</a></div>
      <div className="row">
        <button className="yes" onClick={() => choose("all")}>Accetta</button>
        <button onClick={() => choose("tech")}>Solo tecnici</button>
      </div>
    </div>
  );
}
