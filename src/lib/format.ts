import { NATIONAL_MIN_STIPEND, REGION_MIN_STIPEND, type Job } from "./types";

export const eur = (n: number) => n.toLocaleString("it-IT") + " €";

export function ago(iso: string): string {
  const days = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000));
  if (days === 0) return "Oggi";
  if (days === 1) return "Ieri";
  return `${days} giorni fa`;
}

export const isFresh = (iso: string) => Date.now() - new Date(iso).getTime() < 2 * 86_400_000;

export function payLabel(j: Job): { label: string; value: string | null } {
  if (j.payAnnual) return { label: "Stipendio", value: "RAL " + eur(j.payAnnual) };
  if (j.payMonthly) return { label: j.category === "junior" || j.category === "apprendistato" ? "Stipendio" : "Rimborso", value: eur(j.payMonthly) + "/mese" };
  return { label: j.category === "junior" || j.category === "apprendistato" ? "Stipendio" : "Rimborso", value: null };
}

export function experienceLabel(years: number | null, long = false): string {
  if (!years) return "Nessuna";
  const unit = years === 1 ? "anno" : "anni";
  return long ? `Fino a ${years} ${unit}` : `Max ${years} ${unit}`;
}

export type PayNote = { tone: "good" | "warn" | "neutral"; text: string } | null;

/** Confronta il rimborso del tirocinio extracurricolare con il minimo regionale. */
export function payNote(j: Job): PayNote {
  if (j.category === "extra") {
    const min = j.region ? REGION_MIN_STIPEND[j.region] : undefined;
    if (min && j.payMonthly && j.payMonthly >= min) return { tone: "good", text: `Sopra il minimo della Regione ${j.region} (${eur(min)} al mese)` };
    if (min && j.payMonthly) return { tone: "warn", text: `Sotto il minimo della Regione ${j.region} (${eur(min)} al mese): segnalalo` };
    return { tone: "neutral", text: `Minimo nazionale ${eur(NATIONAL_MIN_STIPEND)} al mese; molte Regioni prevedono di più` };
  }
  if (j.category === "curricolare") return { tone: "neutral", text: "Lo stage curricolare dà crediti e può non essere retribuito" };
  if (j.category === "apprendistato") return { tone: "neutral", text: "Contratto di lavoro con formazione, non un tirocinio" };
  return null;
}

export const monthlyValue = (j: Job) => j.payMonthly ?? (j.payAnnual ? Math.round(j.payAnnual / 13) : 0);
