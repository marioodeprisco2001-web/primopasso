import { normalize } from "../filters";
import type { RawJob } from "./ats";

/**
 * Filtro veloce e gratuito prima della classificazione con AI:
 * tiene solo annunci in Italia (o da remoto in Italia) e scarta i titoli chiaramente senior.
 */
const ITALY = [
  "italy", "italia", "milano", "milan", "roma", "rome", "torino", "turin", "bologna", "napoli", "naples", "firenze", "florence",
  "genova", "genoa", "venezia", "venice", "padova", "verona", "bergamo", "brescia", "bari", "palermo", "catania", "trieste",
  "trento", "parma", "modena", "pisa", "monza", "varese", "como", "cagliari", "perugia", "ancona", "pescara", "lecce", "salerno",
  "lombardia", "lombardy", "lazio", "piemonte", "piedmont", "veneto", "emilia", "toscana", "tuscany", "campania", "sicilia", "sardegna", "puglia",
];
const SENIOR = /\b(senior|sr\.?|lead|principal|staff|head|director|direttore|manager|vp|chief|architect|expert|esperto)\b/i;
const JUNIOR_HINT = /\b(intern|internship|stage|stagista|tirocin|apprendist|junior|jr\.?|graduate|trainee|entry|neolaureat|working student|praticante)\b/i;

export function isInItaly(j: RawJob): boolean {
  if (j.country && ["it", "ita", "italy", "italia"].includes(j.country.toLowerCase())) return true;
  const loc = normalize(j.location);
  return ITALY.some((k) => new RegExp(`\\b${k}\\b`).test(loc));
}

export function passesPrefilter(j: RawJob): boolean {
  if (!isInItaly(j)) return false;
  // "Junior Product Manager" passa, "Product Manager" no.
  if (SENIOR.test(j.title) && !JUNIOR_HINT.test(j.title)) return false;
  return true;
}
