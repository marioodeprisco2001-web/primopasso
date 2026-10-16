import Link from "next/link";
import { toQuery } from "@/lib/filters";
import { PAGE_SIZE } from "@/lib/jobs";
import type { Filters, Job } from "@/lib/types";
import { JobCard } from "./JobCard";

export function Results({ jobs, favs, total, page, filters }: { jobs: Job[]; favs: Set<string>; total: number; page: number; filters: Filters }) {
  if (!jobs.length)
    return (
      <ul className="results">
        <li className="empty">
          <strong>Nessun annuncio con questi filtri</strong>
          Prova a togliere un filtro, oppure crea un avviso: ti scriviamo quando arriva un annuncio adatto.
          <Link className="btn btn-ghost" href="/">Azzera filtri</Link>
        </li>
      </ul>
    );
  const pages = Math.ceil(total / PAGE_SIZE);
  const href = (p: number) => {
    const q = toQuery(filters);
    return "/" + (q ? q + "&" : "?") + "pagina=" + p;
  };
  return (
    <>
      <ul className="results">{jobs.map((j) => <JobCard key={j.id} job={j} fav={favs.has(j.id)} />)}</ul>
      {pages > 1 && (
        <nav className="pager" aria-label="Pagine">
          {page > 1 && <Link className="btn btn-ghost" href={href(page - 1)}>Precedenti</Link>}
          <span className="fine" style={{ alignSelf: "center" }}>Pagina {page} di {pages}</span>
          {page < pages && <Link className="btn btn-ghost" href={href(page + 1)}>Successivi</Link>}
        </nav>
      )}
    </>
  );
}

export function DemoBanner() {
  return (
    <div className="demo-banner">
      <div className="wrap">Modalità anteprima: il database non è ancora collegato, gli annunci sono di esempio.</div>
    </div>
  );
}
