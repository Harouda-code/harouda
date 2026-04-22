-- ============================================================================
-- harouda-app · Sprint 18 · Employee-SV-Stammdaten (Expand-Phase)
--
-- Expand-and-Contract-Pattern: alle neuen Felder sind NULLABLE. Die
-- Contract-Phase (NOT NULL setzen) passiert nach 100% Backfill via
-- Folge-Sprint — siehe docs/TECH-DEBT-EMPLOYEE-SV-FIELDS-CONTRACT.md.
--
-- Rechtsbasis:
--   § 28a Abs. 3 SGB IV — Meldepflicht-Felder.
--   BA-Taetigkeitsschluesselverzeichnis 2010 (9-stellig).
--   DEUeV-Gemeinsame-Grundsaetze — Anschrift-Format.
--   GoBD Rz. 45 — Vollstaendigkeit der Stammdaten.
--
-- Scope Sprint 18:
--   • 6 Semantik-Felder (Staatsangehoerigkeit, Geburtsname, Geburtsort,
--     Taetigkeitsschluessel, Mehrfachbeschaeftigung, Einzugsstelle-BBNR).
--   • 5 Anschrift-Felder (Strasse, Hausnummer, PLZ, Ort, Land).
--   • Soft-Constraints (erlauben NULL, validieren Format bei Werten).
-- Nicht-Ziel:
--   • Geburtsdatum (existiert in Phase-2-`Arbeitnehmer`, aber nicht im
--     Employee-Model). Wird in Folge-Sprint ergaenzt — gefuehrt in
--     docs/TECH-DEBT-EMPLOYEE-SV-FIELDS-CONTRACT.md §3.
--   • NOT-NULL-Constraints (Contract-Phase).
-- ============================================================================

-- --- 1. Neue Spalten -------------------------------------------------------

alter table public.employees
  add column if not exists staatsangehoerigkeit text;
alter table public.employees
  add column if not exists geburtsname text;
alter table public.employees
  add column if not exists geburtsort text;
alter table public.employees
  add column if not exists taetigkeitsschluessel text;
alter table public.employees
  add column if not exists mehrfachbeschaeftigung boolean not null default false;
alter table public.employees
  add column if not exists einzugsstelle_bbnr text;
alter table public.employees
  add column if not exists anschrift_strasse text;
alter table public.employees
  add column if not exists anschrift_hausnummer text;
alter table public.employees
  add column if not exists anschrift_plz text;
alter table public.employees
  add column if not exists anschrift_ort text;
alter table public.employees
  add column if not exists anschrift_land text not null default 'DE';

-- --- 2. Soft Check-Constraints (erlauben NULL) ----------------------------

alter table public.employees
  drop constraint if exists chk_employee_taetigkeitsschluessel;
alter table public.employees
  add constraint chk_employee_taetigkeitsschluessel check (
    taetigkeitsschluessel is null
    or taetigkeitsschluessel ~ '^[0-9]{9}$'
  );

alter table public.employees
  drop constraint if exists chk_employee_einzugsstelle_bbnr;
alter table public.employees
  add constraint chk_employee_einzugsstelle_bbnr check (
    einzugsstelle_bbnr is null
    or einzugsstelle_bbnr ~ '^[0-9]{8}$'
  );

alter table public.employees
  drop constraint if exists chk_employee_anschrift_plz;
alter table public.employees
  add constraint chk_employee_anschrift_plz check (
    anschrift_plz is null
    or anschrift_plz ~ '^[0-9]{4,5}$'
  );

-- --- 3. Spalten-Kommentare --------------------------------------------------

comment on column public.employees.staatsangehoerigkeit is
  'ISO 3166-1 alpha-2 (z. B. DE) oder DEUeV-Schluessel (3-stellig, z. B. 000). Sprint 18.';
comment on column public.employees.taetigkeitsschluessel is
  'BA-Verzeichnis 2010, 9-stellig. Sprint 18.';
comment on column public.employees.einzugsstelle_bbnr is
  'Betriebsnummer der Krankenkasse, 8-stellig. Sprint 18.';
comment on column public.employees.mehrfachbeschaeftigung is
  'Beschaeftigter hat weitere versicherungspflichtige Taetigkeit. Default false (Standardfall). Sprint 18.';
comment on column public.employees.anschrift_land is
  'ISO 3166-1 alpha-2. Default DE. Sprint 18.';
