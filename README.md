# Primopasso

Job board italiano con soli annunci per chi inizia: stage curricolari, tirocini extracurricolari, apprendistato, internship e posizioni junior (0-2 anni di esperienza).

Ogni notte il sito legge le pagine carriere delle aziende, classifica gli annunci con l'AI e pubblica solo quelli davvero entry level. Gli annunci incerti finiscono in una coda di revisione nell'area admin.

## Come è fatto

| Parte | Tecnologia |
| --- | --- |
| Sito e logica | Next.js (App Router, TypeScript) |
| Database, login, ricerca | Supabase (Postgres) |
| Hosting e job notturni | Vercel (Cron) |
| Classificazione annunci | Claude API |
| Email degli avvisi | Resend |

Senza le chiavi di Supabase il sito parte in **modalità anteprima** con annunci di esempio.

## Messa online, passo per passo

### 1. Database (Supabase)

1. Apri il progetto su supabase.com → **SQL Editor** → **New query**.
2. Incolla tutto il contenuto di `supabase/schema.sql` e premi **Run**.
3. **Authentication → URL Configuration**: in *Site URL* metti l'indirizzo del sito (es. `https://primopasso.vercel.app`) e aggiungi `https://primopasso.vercel.app/auth/callback` tra i *Redirect URLs*.
4. **Project Settings → API**: copia *Project URL*, la chiave *anon public* e la chiave *service_role* (questa è segreta).

### 2. Pubblicazione (Vercel)

1. Su vercel.com → **Add New → Project** → importa il repository `primopasso`.
2. In **Environment Variables** inserisci le variabili di `.env.example` (almeno le tre di Supabase, `NEXT_PUBLIC_SITE_URL` e `CRON_SECRET`).
3. **Deploy**. Dopo il primo deploy aggiorna `NEXT_PUBLIC_SITE_URL` con l'indirizzo reale e rifai il deploy.

### 3. Diventare admin

Registrati sul sito con la tua email, poi in Supabase → SQL Editor esegui:

```sql
update profiles set is_admin = true where id = (select id from auth.users where email = 'tua@email.it');
```

Nel menu compare **Admin**: da lì aggiungi le aziende da seguire e avvii la raccolta.

### 4. Classificazione e avvisi (facoltativi all'inizio)

- **Classificazione**: crea una chiave su console.anthropic.com e impostala in `ANTHROPIC_API_KEY`. Senza chiave gli annunci arrivano tutti in revisione e scegli tu la categoria.
- **Email degli avvisi**: crea un account su resend.com, verifica un dominio, imposta `RESEND_API_KEY` ed `EMAIL_FROM`.

## Aggiungere un'azienda

Nell'area admin, sezione *Aziende seguite*: nome, sistema e indirizzo della pagina carriere.

| Sistema | Esempio di indirizzo |
| --- | --- |
| Greenhouse | `https://job-boards.greenhouse.io/nomeazienda` |
| Lever | `https://jobs.lever.co/nomeazienda` |
| Ashby | `https://jobs.ashbyhq.com/nomeazienda` |
| Workable | `https://apply.workable.com/nomeazienda` |

Basta incollare l'indirizzo: il sito ne estrae l'ultima parte. I connettori Ashby e Workable vanno verificati con un'azienda reale.

## Strumenti per guadagnare

Dopo aver aggiornato il codice, esegui **una volta** in Supabase → SQL Editor il file `supabase/aggiornamento-01-guadagni.sql` (se parti da zero basta `schema.sql`, che lo contiene già). Finché non lo esegui, l'area admin mostra un avviso.

| Cosa | Dove si gestisce | Come funziona |
| --- | --- | --- |
| Statistiche di visita | Vercel → progetto → **Analytics** → *Enable* | Senza cookie, non serve il consenso |
| Click su «Candidati» | Admin → *Click negli ultimi 30 giorni* | Il bottone passa da `/vai/<id>`, conta il click e aggiunge `utm_source=primopasso` al link dell'azienda |
| Annunci inviati dalle aziende | Pagina `/aziende` → Admin → *Richieste dalle aziende* | Li approvi tu; restano online 60 giorni |
| Annunci in evidenza | Admin, oppure i pulsanti admin nella pagina di ogni annuncio | In cima ai risultati con l'etichetta «In evidenza»; l'evidenza scade da sola |
| Sponsor sul sito e nelle email | Admin → *Spazi sponsor* | Riquadro «Sponsorizzato» dopo il quinto annuncio, nella pagina annuncio e nelle email degli avvisi; i click vengono contati |
| Prezzo dell'evidenza | Variabile `NEXT_PUBLIC_PRICE_FEATURED` su Vercel | Es. `49 € + IVA`; se vuota la pagina aziende mostra «Su richiesta» |

I pagamenti per ora sono manuali: l'azienda chiede l'evidenza dal modulo, tu ricevi un'email (se Resend è configurato), mandi i dati per il pagamento e pubblichi dall'admin.

Gli annunci pubblicati sono anche nella sitemap e hanno i dati strutturati `JobPosting`, che permettono a Google di mostrarli nella sua ricerca lavoro.

## Job notturni

Definiti in `vercel.json` (orari UTC):

| Job | Orario (Italia, ora legale) | Cosa fa |
| --- | --- | --- |
| `/api/cron/ingest` | 05:00 | Toglie le evidenze scadute, legge le pagine carriere, segna gli annunci scaduti, classifica i nuovi |
| `/api/cron/alerts` | 08:00 | Invia gli avvisi giornalieri; il lunedì anche i settimanali |

Se Vercel rifiuta `maxDuration = 300` per il piano gratuito, abbassalo a `60` nelle due route e riduci `maxCompanies` e `maxClassify` in `src/lib/ingest/run.ts`.

## Sviluppo in locale (facoltativo)

```bash
npm install
cp .env.example .env.local   # e compila le variabili
npm run dev
```

## Prima del lancio

- Completare privacy policy, cookie policy e termini d'uso (`src/app/privacy`, `cookie`, `termini`).
- Verificare i minimi regionali del tirocinio in `src/lib/types.ts` (`REGION_MIN_STIPEND`).
- Controllare i termini d'uso di ogni fonte prima di attivarla.
