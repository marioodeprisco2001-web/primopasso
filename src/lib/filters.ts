import { AREAS, CATEGORIES, CATEGORY_KEYS, EMPTY_FILTERS, MODE_KEYS, MODES, type Category, type Filters, type Mode } from "./types";

type Params = Record<string, string | string[] | undefined>;

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";
const list = (v: string | string[] | undefined) => one(v).split(",").map((s) => s.trim()).filter(Boolean);

/** Legge i filtri dall'indirizzo della pagina (?q=marketing&dove=Milano&tipo=extra,junior ...). */
export function parseFilters(p: Params): Filters {
  const days = Number(one(p.giorni));
  return {
    q: one(p.q).slice(0, 80),
    where: one(p.dove).slice(0, 60),
    cats: list(p.tipo).filter((c): c is Category => CATEGORY_KEYS.includes(c as Category)),
    areas: list(p.area).filter((a) => (AREAS as readonly string[]).includes(a)),
    modes: list(p.modo).filter((m): m is Mode => MODE_KEYS.includes(m as Mode)),
    paid: one(p.compenso) === "1",
    days: [1, 7, 30].includes(days) ? days : 0,
    sort: one(p.ordina) === "compenso" ? "compenso" : "recenti",
  };
}

/** Trasforma i filtri in query string, omettendo i valori vuoti. */
export function toQuery(f: Partial<Filters>): string {
  const s = new URLSearchParams();
  const full = { ...EMPTY_FILTERS, ...f };
  if (full.q) s.set("q", full.q);
  if (full.where) s.set("dove", full.where);
  if (full.cats.length) s.set("tipo", full.cats.join(","));
  if (full.areas.length) s.set("area", full.areas.join(","));
  if (full.modes.length) s.set("modo", full.modes.join(","));
  if (full.paid) s.set("compenso", "1");
  if (full.days) s.set("giorni", String(full.days));
  if (full.sort !== "recenti") s.set("ordina", full.sort);
  const str = s.toString();
  return str ? "?" + str : "";
}

/** Etichetta leggibile per una ricerca, usata negli avvisi. */
export function filtersLabel(f: Filters): string {
  const parts: string[] = [f.q ? `«${f.q}»` : "Tutti gli annunci"];
  if (f.where) parts.push(f.where);
  f.cats.forEach((c) => parts.push(CATEGORIES[c]));
  f.areas.forEach((a) => parts.push(a));
  f.modes.forEach((m) => parts.push(MODES[m]));
  if (f.paid) parts.push("con compenso");
  return parts.join(" · ");
}

export const normalize = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
