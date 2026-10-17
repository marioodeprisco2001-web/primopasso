-- Primopasso: aggiornamento 01 — strumenti per guadagnare
-- Annunci in evidenza, annunci inviati dalle aziende, conteggio dei click, spazi sponsor.
-- Da eseguire una volta in Supabase: SQL Editor -> New query -> incolla tutto -> Run.
-- Si può rieseguire senza danni.

-- ---------- Annunci: evidenza e scadenza ----------
alter table jobs add column if not exists featured_until timestamptz;  -- in cima ai risultati fino a questa data
alter table jobs add column if not exists expires_at timestamptz;      -- solo annunci inviati dalle aziende
create index if not exists jobs_featured_idx on jobs (featured_until) where featured_until is not null;

-- ---------- Annunci inviati dalle aziende (in attesa di approvazione) ----------
create table if not exists job_submissions (
  id uuid primary key default gen_random_uuid(),
  status text not null default 'in_attesa' check (status in ('in_attesa', 'approvato', 'rifiutato')),
  -- annuncio
  title text not null,
  company_name text not null,
  apply_url text not null,
  city text,
  region text,
  mode work_mode,
  category job_category not null,
  area text,
  pay_monthly integer,
  pay_annual integer,
  duration_months integer,
  description text not null,
  requirements text[] not null default '{}',
  -- richiesta commerciale
  wants_featured boolean not null default false,
  contact_name text not null,
  contact_email text not null,
  vat_number text,
  notes text,
  job_id uuid references jobs (id) on delete set null,
  created_at timestamptz not null default now(),
  decided_at timestamptz
);
create index if not exists job_submissions_status_idx on job_submissions (status, created_at);

-- ---------- Click in uscita (candidature e sponsor) ----------
-- Nessun dato personale: solo cosa è stato cliccato e quando.
create table if not exists clicks (
  id bigint generated always as identity primary key,
  kind text not null check (kind in ('candidatura', 'sponsor_sito', 'sponsor_email')),
  job_id uuid references jobs (id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists clicks_created_idx on clicks (created_at desc);
create index if not exists clicks_job_idx on clicks (job_id, created_at desc);

-- ---------- Spazi sponsor (uno sul sito, uno nelle email) ----------
create table if not exists sponsors (
  slot text primary key check (slot in ('sito', 'email')),
  active boolean not null default false,
  name text not null default '',
  text text not null default '',
  url text not null default '',
  updated_at timestamptz not null default now()
);
insert into sponsors (slot) values ('sito'), ('email') on conflict do nothing;

-- ---------- Regole di accesso ----------
-- Richieste e click si scrivono e si leggono solo dal server con la chiave di servizio.
alter table job_submissions enable row level security;
alter table clicks enable row level security;
alter table sponsors enable row level security;

drop policy if exists "sponsor attivi visibili a tutti" on sponsors;
create policy "sponsor attivi visibili a tutti" on sponsors for select using (active);
