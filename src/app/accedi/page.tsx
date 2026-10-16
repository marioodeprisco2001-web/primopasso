import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { currentUser } from "@/lib/supabase/server";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = { title: "Accedi", robots: { index: false } };

const safeNext = (n: unknown) => (typeof n === "string" && n.startsWith("/") && !n.startsWith("//") ? n : "/");

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string; errore?: string }> }) {
  const sp = await searchParams;
  const next = safeNext(sp.next);
  if (await currentUser()) redirect(next);
  return (
    <div className="wrap">
      <div className="auth-card">
        <h1>Accedi o registrati</h1>
        <p>Con un account salvi gli annunci e ricevi via email quelli nuovi.</p>
        {sp.errore && <p className="err">Il link non è più valido. Chiedine uno nuovo.</p>}
        <LoginForm next={next} configured={isSupabaseConfigured()} />
      </div>
    </div>
  );
}
