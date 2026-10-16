import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { JobCard } from "@/components/JobCard";
import { favoriteIds, getJobsByIds } from "@/lib/jobs";
import { currentUser } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Preferiti", robots: { index: false } };

export default async function FavoritesPage() {
  if (!(await currentUser())) redirect("/accedi?next=/preferiti");
  const ids = await favoriteIds();
  const jobs = await getJobsByIds([...ids]);
  return (
    <div className="wrap page">
      <div className="page-head">
        <div className="eyebrow">Il tuo account</div>
        <h1>Preferiti</h1>
        <p>Gli annunci che hai salvato. Quelli scaduti spariscono da qui automaticamente.</p>
      </div>
      {jobs.length ? (
        <ul className="results">{jobs.map((j) => <JobCard key={j.id} job={j} fav />)}</ul>
      ) : (
        <div className="empty">
          <strong>Nessun preferito</strong>
          Tocca il cuore su un annuncio per salvarlo qui.
          <Link className="btn btn-ghost" href="/">Cerca annunci</Link>
        </div>
      )}
    </div>
  );
}
