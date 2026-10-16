import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { AREAS, CATEGORY_KEYS, REGIONS, type Category } from "./types";

export type Classification = {
  pertinente: boolean;
  motivo: string;
  categoria: Category | null;
  anni_esperienza: number | null;
  titolo_studio: string | null;
  area: string | null;
  citta: string | null;
  regione: string | null;
  modalita: "presenza" | "ibrido" | "remoto" | null;
  rimborso_mensile: number | null;
  ral_annua: number | null;
  durata_mesi: number | null;
  riassunto: string;
  requisiti: string[];
  confidenza: number;
};

const SYSTEM = `Classifichi annunci di lavoro per un sito italiano dedicato solo a chi entra nel mondo del lavoro.

Categorie ammesse:
- curricolare: stage per studenti iscritti all'università o a una scuola, con crediti formativi.
- extra: tirocinio extracurricolare per neolaureati, diplomati o disoccupati, con indennità obbligatoria.
- apprendistato: contratto di apprendistato (giovani fino a 29 anni).
- internship: internship o summer internship, spesso di multinazionali, quando non è chiaro se curricolare o extracurricolare.
- junior: contratto di lavoro per chi ha al massimo 2 anni di esperienza (junior, graduate program, primo impiego).

Regole:
- pertinente = false se l'annuncio chiede più di 2 anni di esperienza, se è un ruolo di responsabilità (manager, senior, lead), se non è in Italia, o se non rientra in nessuna categoria.
- Il titolo può mentire: leggi i requisiti. "Junior" con "3+ anni di esperienza" non è pertinente.
- anni_esperienza: anni minimi richiesti; 0 se non ne chiede.
- rimborso_mensile e ral_annua solo se scritti nell'annuncio, in euro. Mai stimarli.
- riassunto: massimo 2 frasi in italiano, scritte con parole tue, senza copiare frasi dall'annuncio.
- requisiti: massimo 5 voci brevi in italiano, con parole tue.
- confidenza: da 0 a 100, quanto sei sicuro di categoria e pertinenza. Sotto 75 se l'annuncio è ambiguo.
- motivo: una frase in italiano. Se pertinente, cosa ti ha fatto scegliere la categoria; altrimenti perché lo escludi.`;

const TOOL: Anthropic.Tool = {
  name: "classifica_annuncio",
  description: "Registra la classificazione dell'annuncio.",
  input_schema: {
    type: "object",
    properties: {
      pertinente: { type: "boolean" },
      motivo: { type: "string" },
      categoria: { type: ["string", "null"], enum: [...CATEGORY_KEYS, null] },
      anni_esperienza: { type: ["integer", "null"] },
      titolo_studio: { type: ["string", "null"], description: "Es. Diploma, Laurea triennale, Laurea magistrale, Iscrizione università" },
      area: { type: ["string", "null"], enum: [...AREAS, null] },
      citta: { type: ["string", "null"], description: "Città italiana in italiano, oppure 'Da remoto'" },
      regione: { type: ["string", "null"], enum: [...REGIONS, null] },
      modalita: { type: ["string", "null"], enum: ["presenza", "ibrido", "remoto", null] },
      rimborso_mensile: { type: ["integer", "null"] },
      ral_annua: { type: ["integer", "null"] },
      durata_mesi: { type: ["integer", "null"] },
      riassunto: { type: "string" },
      requisiti: { type: "array", items: { type: "string" }, maxItems: 5 },
      confidenza: { type: "integer", minimum: 0, maximum: 100 },
    },
    required: ["pertinente", "motivo", "categoria", "anni_esperienza", "area", "citta", "regione", "modalita", "riassunto", "requisiti", "confidenza"],
  },
};

export const isClassifierConfigured = () => Boolean(process.env.ANTHROPIC_API_KEY);

let client: Anthropic | null = null;

export async function classifyJob(input: { title: string; company: string; location: string; description: string }): Promise<Classification> {
  client ??= new Anthropic();
  const msg = await client.messages.create({
    model: process.env.ANTHROPIC_MODEL || "claude-haiku-5-5",
    max_tokens: 1024,
    system: SYSTEM,
    tools: [TOOL],
    tool_choice: { type: "tool", name: TOOL.name },
    messages: [{
      role: "user",
      content: `Azienda: ${input.company}\nTitolo: ${input.title}\nSede indicata: ${input.location}\n\nTesto dell'annuncio:\n${input.description.slice(0, 8000)}`,
    }],
  });
  const block = msg.content.find((b) => b.type === "tool_use");
  if (!block || block.type !== "tool_use") throw new Error("Risposta di classificazione vuota");
  const c = block.input as Classification;
  return { ...c, requisiti: (c.requisiti ?? []).slice(0, 5), confidenza: Math.max(0, Math.min(100, c.confidenza ?? 0)) };
}

/** Decide se pubblicare, mandare in revisione o scartare. */
export function decideStatus(c: Classification): { status: "pubblicato" | "in_revisione" | "scartato"; reason: string | null } {
  if ((c.anni_esperienza ?? 0) > 2) return { status: "scartato", reason: c.motivo };
  if (!c.pertinente) return c.confidenza >= 60 ? { status: "scartato", reason: c.motivo } : { status: "in_revisione", reason: `Probabile esclusione: ${c.motivo}` };
  if (!c.categoria || c.confidenza < 75) return { status: "in_revisione", reason: c.motivo };
  return { status: "pubblicato", reason: null };
}
