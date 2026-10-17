-- Primopasso: schema del database
-- Da eseguire una volta in Supabase: SQL Editor -> New query -> incolla tutto -> Run.

create extension if not exists pgcrypto;

-- ---------- Tipi ----------
do $$ begin
  create type job_category as enum ('curricolare', 'extra', 'apprendistato', 'internship', 'junior');
exception when duplicate_object then null; end $$;

do $$ begin
  create type work_mode as enum ('presenza', 'ibrido', 'remoto');
exception when duplicate_object then null; end $$;

do $$ begin
  create type job_status as enum ('pubblicato', 'in_revisione', 'scartato', 'scaduto');
exception when duplicate_object then null; end $$;

-- ---------- Aziende da seguire (pagine carriere su ATS) ----------
create table if not exists companies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  ats text not null check (ats in ('greenhouse', 'lever', 'ashby', 'workable')),
  ats_slug text not null,
  active boolean not null default true,
  last_fetched_at timestamptz,
  last_error text,
  created_at timestamptz not null default now(),
  unique (ats, ats_slug)
);

-- ---------- Annunci ----------
create table if not exists jobs (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references companies (id) on delete set null,
  company_name text not null,
  source text not null,              -- greenhouse, lever, ashby, workable, diretto
  external_id text not null,         -- id dell'annuncio nella fonte
  url text not null,                 -- annuncio originale: qui si candida l'utente
  title text not null,
  location_raw text,
  description text,                  -- testo originale, usato solo per la classificazione
  summary text,                      -- riassunto scritto dalla classificazione
  requirements text[] not null default '{}',
  category job_category,
  area text,
  city text,
  region text,
  mode work_mode,
  pay_monthly integer,               -- rimborso o stipendio mensile dichiarato
  pay_annual integer,                -- RAL dichiarata
  duration_months integer,
  experience_years integer,
  education text,
  confidence integer,                -- 0-100, sicurezza della classificazione
  review_reason text,
  status job_status not null default 'in_revisione',
  classified_at timestamptz,
  posted_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  has_pay boolean generated always as (pay_monthly is not null or pay_annual is not null) stored,
  pay_sort integer generated always as (coalesce(pay_monthly, pay_annual / 13)) stored,
  search tsvector generated always as (
    to_tsvector('italian', coalesce(title, '') || ' ' || coalesce(company_name, '') || ' ' || coalesce(area, '') || ' ' || coalesce(summary, ''))
  ) stored,
  unique (source, external_id)
);

create index if not exists jobs_search_idx on jobs using gin (search);
create index if not exists jobs_status_posted_idx on jobs (status, posted_at desc);
create index if not exists jobs_company_idx on jobs (company_id);

-- ---------- Profili utente ----------
create table if not exists profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  city text,
  areas text[] not null default '{}',
  emails boolean not null default true,
  is_admin boolean not null default false,
  created_at timestamptz not null default now()
);

create or replace function handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into profiles (id) values (new.id) on conflict do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function handle_new_user();

-- ---------- Preferiti ----------
create table if not exists favorites (
  user_id uuid not null references auth.users (id) on delete cascade,
  job_id uuid not null references jobs (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, job_id)
);

-- ---------- Ricerche salvate (avvisi email) ----------
create table if not exists saved_searches (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  label text not null,
  filters jsonb not null,
  frequency text not null default 'settimanale' check (frequency in ('giornaliero', 'settimanale')),
  last_sent_at timestamptz,
  unsubscribe_token uuid not null default gen_random_uuid(),
  created_at timestamptz not null default now()
);
create index if not exists saved_searches_user_idx on saved_searches (user_id);

-- ---------- Regole di accesso (Row Level Security) ----------
-- Le scritture su annunci e aziende avvengono solo dal server con la chiave di servizio.
alter table companies enable row level security;
alter table jobs enable row level security;
alter table profiles enable row level security;
alter table favorites enable row level security;
alter table saved_searches enable row level security;

drop policy if exists "annunci pubblicati visibili a tutti" on jobs;
create policy "annunci pubblicati visibili a tutti" on jobs
  for select using (status = 'pubblicato');

drop policy if exists "profilo: lettura propria" on profiles;
create policy "profilo: lettura propria" on profiles for select using (auth.uid() = id);
drop policy if exists "profilo: modifica propria" on profiles;
create policy "profilo: modifica propria" on profiles for update using (auth.uid() = id)
  with check (auth.uid() = id and is_admin = (select p.is_admin from profiles p where p.id = auth.uid()));

drop policy if exists "preferiti: solo i propri" on favorites;
create policy "preferiti: solo i propri" on favorites for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "ricerche: solo le proprie" on saved_searches;
create policy "ricerche: solo le proprie" on saved_searches for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ========== Strumenti per guadagnare (identico a aggiornamento-01-guadagni.sql) ==========
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

-- ---------- Dopo la prima registrazione ----------
-- Per diventare admin, sostituisci l'email e esegui:
-- update profiles set is_admin = true where id = (select id from auth.users where email = 'tua@email.it');
