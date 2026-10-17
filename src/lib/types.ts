export type Category = "curricolare" | "extra" | "apprendistato" | "internship" | "junior";
export type Mode = "presenza" | "ibrido" | "remoto";

export const CATEGORIES: Record<Category, string> = {
  curricolare: "Stage curricolare",
  extra: "Tirocinio extracurricolare",
  apprendistato: "Apprendistato",
  internship: "Internship",
  junior: "Junior 0-2 anni",
};
export const CATEGORY_KEYS = Object.keys(CATEGORIES) as Category[];

export const AREAS = [
  "Marketing",
  "IT e sviluppo",
  "Finanza",
  "Design",
  "Vendite",
  "Ingegneria",
  "Risorse umane",
  "Legale",
  "Operations",
] as const;
export type Area = (typeof AREAS)[number];

export const MODES: Record<Mode, string> = { presenza: "In sede", ibrido: "Ibrido", remoto: "Da remoto" };
export const MODE_KEYS = Object.keys(MODES) as Mode[];

export const REGIONS = [
  "Abruzzo", "Basilicata", "Calabria", "Campania", "Emilia-Romagna", "Friuli-Venezia Giulia", "Lazio", "Liguria",
  "Lombardia", "Marche", "Molise", "Piemonte", "Puglia", "Sardegna", "Sicilia", "Toscana", "Trentino-Alto Adige",
  "Umbria", "Valle d'Aosta", "Veneto",
] as const;

/**
 * Indennità minima mensile del tirocinio extracurricolare per Regione.
 * Inserire solo valori verificati sulla normativa regionale aggiornata.
 */
export const REGION_MIN_STIPEND: Partial<Record<string, number>> = {
  Lombardia: 500,
  Lazio: 500,
  "Emilia-Romagna": 500,
};
export const NATIONAL_MIN_STIPEND = 300;

export type Job = {
  id: string;
  title: string;
  company: string;
  url: string;
  source: string;
  category: Category;
  area: string | null;
  city: string | null;
  region: string | null;
  mode: Mode | null;
  payMonthly: number | null;
  payAnnual: number | null;
  durationMonths: number | null;
  experienceYears: number | null;
  education: string | null;
  summary: string | null;
  requirements: string[];
  postedAt: string; // ISO
  featured?: boolean; // in evidenza (a pagamento)
};

export type SponsorSlot = "sito" | "email";
export type Sponsor = { slot: SponsorSlot; active: boolean; name: string; text: string; url: string };

export type Filters = {
  q: string;
  where: string;
  cats: Category[];
  areas: string[];
  modes: Mode[];
  paid: boolean;
  days: number; // 0 = sempre
  sort: "recenti" | "compenso";
};

export const EMPTY_FILTERS: Filters = { q: "", where: "", cats: [], areas: [], modes: [], paid: false, days: 0, sort: "recenti" };
