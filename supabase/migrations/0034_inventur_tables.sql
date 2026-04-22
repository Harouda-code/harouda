-- ============================================================================
-- harouda-app · Sprint 17 · Inventur-Modul (Anlagen + Bestaende)
--
-- Rechtsbasis:
--   § 240 HGB — Inventur-Pflicht.
--   § 241a HGB — Erleichterungen fuer Kleinkaufleute.
--   § 253 Abs. 3/4 HGB — Wertminderung + Niederstwertprinzip.
--   § 256 HGB — Bewertungsverfahren.
--   GoBD Rz. 50-52 — Inventur-Archivierung.
--
-- Drei neue Tabellen:
--   - inventur_sessions: Session pro Mandant pro Jahr.
--   - inventur_anlagen: Pro Anlage der Inventur-Status.
--   - inventur_bestaende: Manuelle Bestandspositionen mit
--     Inventurlisten-Upload.
--
-- RLS-Pattern: company_id (is_company_member / can_write) +
-- RESTRICTIVE-Policy (client_belongs_to_company) wie Migration 0031.
-- ============================================================================

-- --- 1. inventur_sessions ---------------------------------------------------

create table if not exists public.inventur_sessions (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  client_id uuid not null references public.clients(id) on delete restrict,
  stichtag date not null,
  jahr integer not null,
  status text not null default 'offen' check (
    status in ('offen', 'abgeschlossen', 'gebucht')
  ),
  anlagen_inventur_abgeschlossen boolean not null default false,
  bestands_inventur_abgeschlossen boolean not null default false,
  notiz text null,
  erstellt_von uuid null,
  erstellt_am timestamptz not null default now(),
  abgeschlossen_am timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (client_id, jahr)
);

comment on table public.inventur_sessions is
  'GoBD/§ 240 HGB Inventur-Session pro Mandant pro Jahr. Sprint 17.';

create index if not exists idx_inventur_session_client
  on public.inventur_sessions(client_id, jahr);

alter table public.inventur_sessions enable row level security;

drop policy if exists inventur_sessions_select on public.inventur_sessions;
create policy inventur_sessions_select
  on public.inventur_sessions
  for select using (public.is_company_member(company_id));

drop policy if exists inventur_sessions_insert on public.inventur_sessions;
create policy inventur_sessions_insert
  on public.inventur_sessions
  for insert with check (public.can_write(company_id));

drop policy if exists inventur_sessions_update on public.inventur_sessions;
create policy inventur_sessions_update
  on public.inventur_sessions
  for update using (public.can_write(company_id))
  with check (public.can_write(company_id));

drop policy if exists inventur_sessions_delete on public.inventur_sessions;
create policy inventur_sessions_delete
  on public.inventur_sessions
  for delete using (public.can_write(company_id));

drop policy if exists inventur_sessions_client_consistency
  on public.inventur_sessions;
create policy inventur_sessions_client_consistency
  on public.inventur_sessions
  as restrictive for all
  using (true)
  with check (public.client_belongs_to_company(client_id, company_id));

drop trigger if exists inventur_sessions_set_updated_at
  on public.inventur_sessions;
create trigger inventur_sessions_set_updated_at
  before update on public.inventur_sessions
  for each row execute function public.tg_set_updated_at();

-- --- 2. inventur_anlagen ----------------------------------------------------

create table if not exists public.inventur_anlagen (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.inventur_sessions(id)
    on delete cascade,
  anlage_id uuid not null references public.anlagegueter(id)
    on delete restrict,
  status text not null check (
    status in ('vorhanden', 'verlust', 'schaden', 'nicht_geprueft')
  ),
  notiz text null,
  abgangs_buchung_id uuid null references public.journal_entries(id)
    on delete restrict,
  geprueft_am timestamptz null,
  geprueft_von uuid null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (session_id, anlage_id)
);

create index if not exists idx_inventur_anlagen_session
  on public.inventur_anlagen(session_id);

comment on column public.inventur_anlagen.abgangs_buchung_id is
  'NULL bis User-bestaetigte Abgangs-Buchung commited wurde. Sprint 17.';

alter table public.inventur_anlagen enable row level security;

-- Policies ueber den Join zur Session:
drop policy if exists inventur_anlagen_select on public.inventur_anlagen;
create policy inventur_anlagen_select
  on public.inventur_anlagen
  for select using (
    session_id in (
      select s.id from public.inventur_sessions s
      where public.is_company_member(s.company_id)
    )
  );

drop policy if exists inventur_anlagen_modify on public.inventur_anlagen;
create policy inventur_anlagen_modify
  on public.inventur_anlagen
  for all using (
    session_id in (
      select s.id from public.inventur_sessions s
      where public.can_write(s.company_id)
    )
  )
  with check (
    session_id in (
      select s.id from public.inventur_sessions s
      where public.can_write(s.company_id)
    )
  );

drop trigger if exists inventur_anlagen_set_updated_at
  on public.inventur_anlagen;
create trigger inventur_anlagen_set_updated_at
  before update on public.inventur_anlagen
  for each row execute function public.tg_set_updated_at();

-- --- 3. inventur_bestaende --------------------------------------------------

create table if not exists public.inventur_bestaende (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.inventur_sessions(id)
    on delete cascade,
  bezeichnung text not null,
  vorrat_konto_nr text not null,
  anfangsbestand numeric(14,2) not null default 0,
  endbestand numeric(14,2) not null,
  niederstwert_aktiv boolean not null default false,
  niederstwert_begruendung text null,
  inventurliste_document_id uuid null,
  bestandsveraenderungs_buchung_id uuid null
    references public.journal_entries(id) on delete restrict,
  notiz text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on column public.inventur_bestaende.niederstwert_begruendung is
  '§ 253 Abs. 4 HGB — Pflicht wenn niederstwert_aktiv=true. Sprint 17.';
comment on column public.inventur_bestaende.inventurliste_document_id is
  'Beleg-Upload (Excel/PDF). GoBD Rz. 50-52. Sprint 17.';

-- Niederstwert-Begruendung ist Pflicht wenn Flag true.
alter table public.inventur_bestaende
  drop constraint if exists chk_inventur_niederstwert_begruendung;
alter table public.inventur_bestaende
  add constraint chk_inventur_niederstwert_begruendung check (
    niederstwert_aktiv = false
    or (
      niederstwert_begruendung is not null
      and length(trim(niederstwert_begruendung)) > 0
    )
  );

create index if not exists idx_inventur_bestaende_session
  on public.inventur_bestaende(session_id);

alter table public.inventur_bestaende enable row level security;

drop policy if exists inventur_bestaende_select on public.inventur_bestaende;
create policy inventur_bestaende_select
  on public.inventur_bestaende
  for select using (
    session_id in (
      select s.id from public.inventur_sessions s
      where public.is_company_member(s.company_id)
    )
  );

drop policy if exists inventur_bestaende_modify on public.inventur_bestaende;
create policy inventur_bestaende_modify
  on public.inventur_bestaende
  for all using (
    session_id in (
      select s.id from public.inventur_sessions s
      where public.can_write(s.company_id)
    )
  )
  with check (
    session_id in (
      select s.id from public.inventur_sessions s
      where public.can_write(s.company_id)
    )
  );

drop trigger if exists inventur_bestaende_set_updated_at
  on public.inventur_bestaende;
create trigger inventur_bestaende_set_updated_at
  before update on public.inventur_bestaende
  for each row execute function public.tg_set_updated_at();
