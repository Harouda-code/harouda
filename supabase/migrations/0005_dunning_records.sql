-- ============================================================================
-- harouda-app · Mahnwesen-Tabelle
--
-- Jede ausgestellte Mahnung wird als Record gespeichert — dient als
-- Belegkette (welche Buchung wurde wann mit welcher Stufe gemahnt),
-- und als Grundlage für "darf ich eine weitere Mahnstufe ziehen"-Logik.
-- ============================================================================

create table if not exists public.dunning_records (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  beleg_nr text not null,
  stage smallint not null check (stage between 1 and 3),
  gegenseite text not null default '',
  issued_at timestamptz not null default now(),
  betrag_offen numeric(14,2) not null,
  fee numeric(10,2) not null default 0,
  verzugszinsen numeric(10,2) not null default 0,
  faelligkeit_alt date not null,
  faelligkeit_neu date not null,
  ueberfaellig_tage_bei_mahnung integer not null default 0,
  created_by uuid null references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists dunning_company_beleg_idx
  on public.dunning_records(company_id, beleg_nr, stage desc);
create index if not exists dunning_company_issued_idx
  on public.dunning_records(company_id, issued_at desc);

alter table public.dunning_records enable row level security;

drop policy if exists dunning_select on public.dunning_records;
drop policy if exists dunning_insert on public.dunning_records;
drop policy if exists dunning_delete on public.dunning_records;

create policy dunning_select on public.dunning_records
  for select using (public.is_company_member(company_id));
create policy dunning_insert on public.dunning_records
  for insert with check (public.can_write(company_id));
-- Mahnhistorie ist einmal ausgestellt; Änderungen wären rechtlich heikel.
-- Löschen nur für Admins (z. B. Stornos).
create policy dunning_delete on public.dunning_records
  for delete using (public.is_company_admin(company_id));

-- Kein UPDATE — einmal ausgestellt bleibt unveränderlich.
revoke update on public.dunning_records from authenticated;
