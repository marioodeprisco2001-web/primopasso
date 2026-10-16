"use client";
import { usePathname, useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { createSavedSearch } from "@/app/actions";
import { toQuery } from "@/lib/filters";
import type { Facets } from "@/lib/jobs";
import { AREAS, CATEGORIES, CATEGORY_KEYS, MODE_KEYS, MODES, type Category, type Filters, type Mode } from "@/lib/types";
import { BellIcon, PinIcon, SearchIcon } from "./icons";

type Props = {
  filters: Filters;
  facets: Facets;
  total: number;
  heading?: React.ReactNode;
  intro?: string;
  children: React.ReactNode;
};

const toggle = <T,>(arr: T[], v: T) => (arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);

export function SearchShell({ filters: f, facets, total, heading, intro, children }: Props) {
  const router = useRouter();
  const path = usePathname();
  const [pending, start] = useTransition();
  const [q, setQ] = useState(f.q);
  const [where, setWhere] = useState(f.where);
  const [open, setOpen] = useState(false);
  const [msg, setMsg] = useState("");

  // Ogni cambio di filtro porta alla ricerca principale con i nuovi parametri.
  const go = (next: Partial<Filters>) => start(() => router.push("/" + toQuery({ ...f, ...next }), { scroll: false }));

  const saveSearch = () =>
    start(async () => {
      const res = await createSavedSearch(f);
      if (!res.ok && res.needLogin) { router.push(`/accedi?next=${encodeURIComponent(path + toQuery(f))}`); return; }
      setMsg(res.message ?? "");
    });

  const pills: { key: string; label: string; next: Partial<Filters> }[] = [
    ...(f.q ? [{ key: "q", label: `«${f.q}»`, next: { q: "" } }] : []),
    ...(f.where ? [{ key: "w", label: f.where, next: { where: "" } }] : []),
    ...f.cats.map((c) => ({ key: "c" + c, label: CATEGORIES[c], next: { cats: f.cats.filter((x) => x !== c) } })),
    ...f.areas.map((a) => ({ key: "a" + a, label: a, next: { areas: f.areas.filter((x) => x !== a) } })),
    ...f.modes.map((m) => ({ key: "m" + m, label: MODES[m], next: { modes: f.modes.filter((x) => x !== m) } })),
    ...(f.paid ? [{ key: "p", label: "Con compenso", next: { paid: false } }] : []),
    ...(f.days ? [{ key: "d", label: f.days === 1 ? "Ultime 24 ore" : `Ultimi ${f.days} giorni`, next: { days: 0 } }] : []),
  ];

  return (
    <>
      <div className="hero">
        <div className="wrap">
          <div className="eyebrow">Stage · tirocini · apprendistato · primo impiego</div>
          {heading ?? <h1>Solo annunci per chi inizia. <span className="hl">Verificati</span> uno per uno.</h1>}
          <p className="lede">{intro ?? "Ogni annuncio viene letto e scartato se chiede più di 2 anni di esperienza. Il rimborso è sempre in vista, con il minimo previsto dalla Regione."}</p>
          <form className="search" role="search" onSubmit={(e) => { e.preventDefault(); go({ q: q.trim(), where: where.trim() }); }}>
            <label className="field" htmlFor="q">
              <SearchIcon />
              <input id="q" name="q" type="text" placeholder="Ruolo, area o azienda" autoComplete="off" value={q} onChange={(e) => setQ(e.target.value)} />
            </label>
            <label className="field" htmlFor="where">
              <PinIcon />
              <input id="where" name="dove" type="text" placeholder="Città, regione o «remoto»" autoComplete="off" value={where} onChange={(e) => setWhere(e.target.value)} />
            </label>
            <button className="btn btn-primary" type="submit">Cerca</button>
          </form>
          <div className="chips" aria-label="Tipo di contratto">
            {CATEGORY_KEYS.map((c: Category) => (
              <button key={c} type="button" className={`catchip cat-${c}`} aria-pressed={f.cats.includes(c)} onClick={() => go({ cats: toggle(f.cats, c) })}>
                <span className="dot" />{CATEGORIES[c]}<span className="n num">{facets.cats[c]}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="wrap layout" aria-busy={pending}>
        <aside className={`filters ${open ? "open" : ""}`} id="filters" aria-label="Filtri">
          <div className="fgroup">
            <h2>Area professionale</h2>
            {AREAS.map((a) => (
              <label key={a} className="check">
                <input type="checkbox" checked={f.areas.includes(a)} onChange={() => go({ areas: toggle(f.areas, a) })} /> {a}
                <span className="n num">{facets.areas[a] ?? 0}</span>
              </label>
            ))}
          </div>
          <div className="fgroup">
            <h2>Modalità</h2>
            {MODE_KEYS.map((m: Mode) => (
              <label key={m} className="check">
                <input type="checkbox" checked={f.modes.includes(m)} onChange={() => go({ modes: toggle(f.modes, m) })} /> {MODES[m]}
                <span className="n num">{facets.modes[m]}</span>
              </label>
            ))}
          </div>
          <div className="fgroup">
            <h2>Compenso</h2>
            <label className="check"><input type="checkbox" checked={f.paid} onChange={() => go({ paid: !f.paid })} /> Solo con rimborso o stipendio dichiarato</label>
          </div>
          <div className="fgroup">
            <h2>Pubblicato</h2>
            <div className="seg">
              {[[0, "Sempre"], [1, "24 ore"], [7, "7 giorni"], [30, "30 giorni"]].map(([v, l]) => (
                <button key={v} type="button" aria-pressed={f.days === v} onClick={() => go({ days: v as number })}>{l}</button>
              ))}
            </div>
          </div>
          <button type="button" className="btn btn-quiet" onClick={() => start(() => router.push("/", { scroll: false }))}>Azzera filtri</button>
        </aside>

        <div>
          <div className="toolbar">
            <div className="count num" aria-live="polite">{total === 1 ? "1 annuncio" : `${total} annunci`}</div>
            <button type="button" className="btn btn-ghost filters-toggle" aria-expanded={open} aria-controls="filters" onClick={() => setOpen(!open)}>Filtri</button>
            <button type="button" className="btn btn-ghost" onClick={saveSearch} disabled={pending}><BellIcon />Crea avviso</button>
            <select aria-label="Ordina per" value={f.sort} onChange={(e) => go({ sort: e.target.value as Filters["sort"] })}>
              <option value="recenti">Più recenti</option>
              <option value="compenso">Compenso più alto</option>
            </select>
          </div>
          {msg && <p className="okmsg" role="status" style={{ marginBottom: 12 }}>{msg}</p>}
          {pills.length > 0 && (
            <div className="active-filters">
              {pills.map((p) => (
                <button key={p.key} type="button" className="pill" aria-label={`Rimuovi filtro ${p.label}`} onClick={() => go(p.next)}>{p.label} <span>×</span></button>
              ))}
            </div>
          )}
          {children}
        </div>
      </div>
    </>
  );
}
