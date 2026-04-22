-- ============================================================================
-- harouda-app · Sprint 18 · Client-Anschrift (Expand-Phase)
--
-- DEUeV-Meldungen nach § 28a SGB IV enthalten eine Arbeitgeber-Anschrift.
-- Die bestehende `clients`-Tabelle hat keine Anschrift-Spalten. Diese
-- Migration ergaenzt sie als NULLABLE (Expand-Phase). NOT NULL nach
-- 100%-Backfill via Folge-Sprint — siehe
-- docs/TECH-DEBT-EMPLOYEE-SV-FIELDS-CONTRACT.md §4.
-- ============================================================================

alter table public.clients
  add column if not exists anschrift_strasse text;
alter table public.clients
  add column if not exists anschrift_hausnummer text;
alter table public.clients
  add column if not exists anschrift_plz text;
alter table public.clients
  add column if not exists anschrift_ort text;
alter table public.clients
  add column if not exists anschrift_land text not null default 'DE';

alter table public.clients
  drop constraint if exists chk_client_anschrift_plz;
alter table public.clients
  add constraint chk_client_anschrift_plz check (
    anschrift_plz is null
    or anschrift_plz ~ '^[0-9]{4,5}$'
  );

comment on column public.clients.anschrift_plz is
  'PLZ Arbeitgeber-Adresse (SV-Meldung-Pflichtfeld). Sprint 18.';
comment on column public.clients.anschrift_land is
  'ISO 3166-1 alpha-2. Default DE. Sprint 18.';
