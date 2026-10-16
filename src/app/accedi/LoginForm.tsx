"use client";
import { useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/browser";

export function LoginForm({ next, configured }: { next: string; configured: boolean }) {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [error, setError] = useState("");
  const redirectTo = () => `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`;

  if (!configured) return <p className="err">Il database non è ancora collegato: l&apos;accesso si attiva dopo aver impostato Supabase.</p>;

  const google = async () => {
    const { error } = await supabaseBrowser().auth.signInWithOAuth({ provider: "google", options: { redirectTo: redirectTo() } });
    if (error) { setState("error"); setError("Accesso con Google non disponibile. Usa l'email."); }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setState("error"); setError("Inserisci un indirizzo email valido, per esempio nome@esempio.it."); return; }
    setState("sending");
    const { error } = await supabaseBrowser().auth.signInWithOtp({ email, options: { emailRedirectTo: redirectTo() } });
    if (error) { setState("error"); setError("Invio non riuscito. Riprova tra un minuto."); return; }
    setState("sent");
  };

  if (state === "sent")
    return <p className="okmsg" role="status">Ti abbiamo mandato un link a {email}. Aprilo da questo dispositivo per entrare.</p>;

  return (
    <form onSubmit={submit} style={{ display: "grid", gap: 14 }} noValidate>
      <button type="button" className="btn btn-ghost" onClick={google}>Continua con Google</button>
      <div className="or">oppure</div>
      <label htmlFor="email" className="fine">Email</label>
      <input id="email" type="email" autoComplete="email" placeholder="nome@esempio.it" value={email} onChange={(e) => setEmail(e.target.value)} />
      {state === "error" && <p className="err" role="alert">{error}</p>}
      <button className="btn btn-primary" type="submit" disabled={state === "sending"}>{state === "sending" ? "Invio in corso…" : "Ricevi il link di accesso"}</button>
      <p className="fine">Niente password: ti mandiamo un link via email. Registrandoti accetti i <a href="/termini">termini d&apos;uso</a> e la <a href="/privacy">privacy policy</a>.</p>
    </form>
  );
}
