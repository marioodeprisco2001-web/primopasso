import type { Filters } from "./types";

/**
 * Pagine statiche per le ricerche più comuni: portano traffico gratuito da Google.
 * Per aggiungerne una basta una riga qui.
 */
export type SeoPage = { slug: string; title: string; intro: string; filters: Partial<Filters> };

export const SEO_PAGES: SeoPage[] = [
  { slug: "stage-milano", title: "Stage a Milano", intro: "Stage curricolari e tirocini extracurricolari a Milano, con rimborso spese e durata sempre indicati.", filters: { where: "Milano", cats: ["curricolare", "extra"] } },
  { slug: "stage-roma", title: "Stage a Roma", intro: "Stage e tirocini a Roma per studenti e neolaureati.", filters: { where: "Roma", cats: ["curricolare", "extra"] } },
  { slug: "tirocini-extracurricolari-lombardia", title: "Tirocini extracurricolari in Lombardia", intro: "Tirocini extracurricolari in Lombardia, con il confronto tra il rimborso offerto e il minimo regionale.", filters: { where: "Lombardia", cats: ["extra"] } },
  { slug: "apprendistato-milano", title: "Apprendistato a Milano", intro: "Contratti di apprendistato a Milano per diplomati e laureati fino a 29 anni.", filters: { where: "Milano", cats: ["apprendistato"] } },
  { slug: "lavoro-junior-remoto", title: "Lavoro junior da remoto", intro: "Posizioni junior da remoto per chi ha al massimo 2 anni di esperienza.", filters: { where: "remoto", cats: ["junior"] } },
  { slug: "internship-milano", title: "Internship a Milano", intro: "Internship in multinazionali e scale-up a Milano.", filters: { where: "Milano", cats: ["internship"] } },
  { slug: "stage-marketing", title: "Stage nel marketing", intro: "Stage e tirocini nel marketing digitale, nella comunicazione e nelle ricerche di mercato.", filters: { areas: ["Marketing"], cats: ["curricolare", "extra", "internship"] } },
  { slug: "lavoro-junior-it", title: "Lavoro junior nell'IT", intro: "Posizioni junior e apprendistato per sviluppatori, data analyst e cloud engineer.", filters: { areas: ["IT e sviluppo"], cats: ["junior", "apprendistato"] } },
  { slug: "stage-bologna", title: "Stage a Bologna", intro: "Stage e tirocini a Bologna per studenti e neolaureati.", filters: { where: "Bologna", cats: ["curricolare", "extra"] } },
  { slug: "stage-torino", title: "Stage a Torino", intro: "Stage e tirocini a Torino per studenti e neolaureati.", filters: { where: "Torino", cats: ["curricolare", "extra"] } },
];

export const findSeoPage = (slug: string) => SEO_PAGES.find((p) => p.slug === slug);
