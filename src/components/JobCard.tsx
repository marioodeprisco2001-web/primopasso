import Link from "next/link";
import { ago, experienceLabel, isFresh, payLabel } from "@/lib/format";
import { CATEGORIES, MODES, type Job } from "@/lib/types";
import { FavButton } from "./FavButton";
import { FeaturedTag } from "./SponsorCard";

export function CategoryTag({ job }: { job: Pick<Job, "category"> }) {
  return <span className={`tag cat-${job.category}`}><span className="dot" />{CATEGORIES[job.category]}</span>;
}

export function JobCard({ job, fav }: { job: Job; fav: boolean }) {
  const pay = payLabel(job);
  return (
    <li className={`card${job.featured ? " featured" : ""}`}>
      <Link href={`/annuncio/${job.id}`} className="card-main">
        <div className="card-top">
          <CategoryTag job={job} />
          {job.featured && <FeaturedTag />}
          <span className={`posted ${isFresh(job.postedAt) ? "new" : ""}`}>{ago(job.postedAt)}</span>
        </div>
        <h3>{job.title}</h3>
        <p className="co">
          {job.company} · {job.city ?? "Italia"}
          {job.mode && job.mode !== "remoto" ? ` · ${MODES[job.mode]}` : ""}
        </p>
        <dl className="facts">
          <div><dt>{pay.label}</dt><dd className={pay.value ? "" : "none"}>{pay.value ?? "Non dichiarato"}</dd></div>
          {job.durationMonths ? <div><dt>Durata</dt><dd>{job.durationMonths} mesi</dd></div> : null}
          <div><dt>Esperienza</dt><dd><mark className="ok">{experienceLabel(job.experienceYears)}</mark></dd></div>
        </dl>
      </Link>
      <FavButton jobId={job.id} initial={fav} />
    </li>
  );
}
