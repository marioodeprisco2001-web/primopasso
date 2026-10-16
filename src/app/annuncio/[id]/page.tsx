import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { FavButton } from "@/components/FavButton";
import { CheckIcon, ExtIcon, InfoIcon, WarnIcon } from "@/components/icons";
import { CategoryTag } from "@/components/JobCard";
import { ago, experienceLabel, payLabel, payNote } from "@/lib/format";
import { favoriteIds, getJob } from "@/lib/jobs";
import { MODES } from "@/lib/types";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const job = await getJob((await params).id);
  if (!job) return { title: "Annuncio non trovato" };
  return { title: `${job.title} — ${job.company}`, description: job.summary ?? undefined };
}

export default async function JobPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [job, favs] = await Promise.all([getJob(id), favoriteIds()]);
  if (!job) notFound();
  const pay = payLabel(job);
  const note = payNote(job);
  const NoteIcon = note?.tone === "good" ? CheckIcon : note?.tone === "warn" ? WarnIcon : InfoIcon;
  const support = process.env.NEXT_PUBLIC_SUPPORT_EMAIL;

  return (
    <div className="wrap detail">
      <article className="detail-main">
        <Link href="/" className="back">← Torna agli annunci</Link>
        <div style={{ display: "grid", gap: 10 }}>
          <div><CategoryTag job={job} /></div>
          <h1>{job.title}</h1>
          <p className="co">{job.company} · {job.city ?? "Italia"}{job.mode ? ` · ${MODES[job.mode]}` : ""}</p>
        </div>
        {job.summary && (
          <section style={{ display: "grid", gap: 8 }}>
            <h2>Di cosa ti occuperai</h2>
            <p>{job.summary}</p>
          </section>
        )}
        {job.requirements.length > 0 && (
          <section style={{ display: "grid", gap: 8 }}>
            <h2>Requisiti principali</h2>
            <ul className="reqs">{job.requirements.map((r) => <li key={r}>{r}</li>)}</ul>
          </section>
        )}
        <p className="source">
          Riassunto generato dall&apos;annuncio originale. Prima di candidarti leggi il testo completo sul sito dell&apos;azienda. Fonte: {job.source}.
        </p>
      </article>

      <aside className="detail-side">
        <div className="verified">
          <div className="verified-head"><CheckIcon />Dati verificati sull&apos;annuncio</div>
          <dl>
            <dt>Esperienza</dt><dd><mark className="ok">{experienceLabel(job.experienceYears, true)}</mark></dd>
            {job.education && <><dt>Titolo di studio</dt><dd>{job.education}</dd></>}
            <dt>{pay.label}</dt>
            <dd>
              {pay.value ?? "Non dichiarato"}
              {note && <div className={`note ${note.tone}`}><NoteIcon />{note.text}</div>}
            </dd>
            {job.durationMonths && <><dt>Durata</dt><dd>{job.durationMonths} mesi</dd></>}
            <dt>Sede</dt><dd>{job.city ?? "Italia"}{job.region ? `, ${job.region}` : ""}</dd>
            <dt>Pubblicato</dt><dd>{ago(job.postedAt)}</dd>
          </dl>
        </div>
        <a className="btn btn-primary" href={job.url} target="_blank" rel="noopener nofollow">Candidati sul sito dell&apos;azienda <ExtIcon /></a>
        <FavButton jobId={job.id} initial={favs.has(job.id)} variant="button" />
        {support && (
          <p className="fine">Un dato è sbagliato? Scrivi a <span style={{ userSelect: "all" }}>{support}</span> indicando il codice {job.id.slice(0, 8)}.</p>
        )}
      </aside>
    </div>
  );
}
