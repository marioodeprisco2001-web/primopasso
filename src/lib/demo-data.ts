import type { Category, Job, Mode } from "./types";

/**
 * Annunci di esempio, usati solo quando Supabase non è ancora configurato
 * (anteprima locale). Aziende e annunci sono inventati.
 */
const daysAgo = (d: number) => new Date(Date.now() - d * 86_400_000).toISOString();

type Row = [string, string, string, string | null, Mode, Category, string, number | null, number | null, number | null, number, string, number, string, string[]];

const ROWS: Row[] = [
  ["Stage Marketing digitale", "Ortensia Cosmetici", "Milano", "Lombardia", "ibrido", "extra", "Marketing", 800, null, 6, 0, "Laurea triennale", 0, "Affiancherai il team digital nella gestione delle campagne social e newsletter.", ["Laurea in economia, comunicazione o affini", "Inglese buono"]],
  ["Junior Data Analyst", "Quadrante Analytics", "Milano", "Lombardia", "ibrido", "junior", "IT e sviluppo", null, 28000, null, 1, "Laurea magistrale", 1, "Report e dashboard per clienti del retail.", ["SQL di base", "Excel avanzato"]],
  ["Tirocinio Ufficio acquisti", "Brenta Meccanica", "Bergamo", "Lombardia", "presenza", "extra", "Operations", 600, null, 6, 0, "Laurea triennale", 3, "Supporto ai buyer nella gestione di fornitori e ordini.", ["Laurea in ingegneria gestionale o economia"]],
  ["Apprendistato Sviluppatore front-end", "Lumen Software", "Bologna", "Emilia-Romagna", "ibrido", "apprendistato", "IT e sviluppo", null, 24000, null, 0, "Diploma", 2, "Percorso di 3 anni con formazione su React e TypeScript.", ["Basi di HTML, CSS e JavaScript"]],
  ["Summer Internship Finance", "Aurelia Capital", "Milano", "Lombardia", "presenza", "internship", "Finanza", 1200, null, 3, 0, "Iscrizione università", 5, "Tre mesi nel team investimenti.", ["Inglese fluente"]],
  ["Stage curricolare Risorse umane", "Gruppo Vela Retail", "Roma", "Lazio", "presenza", "curricolare", "Risorse umane", 400, null, 4, 0, "Iscrizione università", 2, "Screening dei CV e organizzazione dei colloqui.", ["Iscrizione a un corso di laurea"]],
  ["Junior UX/UI Designer", "Pixelfarm", "Da remoto", null, "remoto", "junior", "Design", null, 26000, null, 1, "Laurea triennale", 0, "Flussi e interfacce per app mobili.", ["Portfolio", "Figma"]],
  ["Tirocinio Customer Success", "Tessera App", "Milano", "Lombardia", "ibrido", "extra", "Vendite", 700, null, 6, 0, "Laurea triennale", 4, "Onboarding e formazione dei clienti business.", ["Inglese buono"]],
  ["Stage curricolare Ufficio legale", "Studio Morandi Associati", "Roma", "Lazio", "presenza", "curricolare", "Legale", null, null, 3, 0, "Iscrizione università", 9, "Ricerca giurisprudenziale nel diritto commerciale.", ["Studenti di giurisprudenza al 4° o 5° anno"]],
  ["Apprendistato Tecnico manutentore", "Officine Adda", "Bergamo", "Lombardia", "presenza", "apprendistato", "Ingegneria", null, 22000, null, 0, "Diploma", 6, "Manutenzione di impianti con tutor dedicato.", ["Diploma tecnico"]],
  ["Internship Software Engineering", "Corvo Robotics", "Torino", "Piemonte", "ibrido", "internship", "IT e sviluppo", 1000, null, 6, 0, "Laurea magistrale", 1, "Software per robot da magazzino.", ["Python o C++"]],
  ["Tirocinio Social media", "Torrefazione Lido", "Napoli", "Campania", "presenza", "extra", "Marketing", 500, null, 6, 0, "Diploma", 3, "Contenuti social per i punti vendita.", ["Portfolio o profilo social curato"]],
];

export const DEMO_JOBS: Job[] = ROWS.map((r, i) => ({
  id: `demo-${i + 1}`,
  title: r[0], company: r[1], city: r[2], region: r[3], mode: r[4], category: r[5], area: r[6],
  payMonthly: r[7], payAnnual: r[8], durationMonths: r[9], experienceYears: r[10], education: r[11],
  postedAt: daysAgo(r[12]), summary: r[13], requirements: r[14],
  url: "https://example.com", source: "Esempio",
  featured: i === 4, // un annuncio in evidenza per vedere come appare
}));
