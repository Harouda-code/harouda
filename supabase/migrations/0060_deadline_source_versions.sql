-- ============================================================================
-- harouda-app · Sprint Fristen / P1 · Source-Versions-Registry (global)
--
-- Globale, kanzleiuebergreifende Registry fuer Versions- und Importvorgaenge
-- offizieller Fristen-Quellen (Bundesfeiertage, Landesgesetze, Stadt-/
-- Verordnungs-Material, Statistik-Exporte). Diese Tabelle ist NICHT
-- mandantenspezifisch und traegt KEIN client_id-Feld; ebenfalls KEIN
-- company_id-Feld — alle Kanzleien teilen denselben Source-Registry.
--
-- Zweck:
--   Jeder Import eines offiziellen Quellen-Standes legt einen Datensatz an.
--   Die spaetere mandantenspezifische Fristen-Schicht (separate Tabelle,
--   nicht Teil dieses Sprints) wuerde beim Berechnen pro Frist einen
--   Verweis auf den verwendeten Source-Versions-Eintrag fuehren — als
--   Audit-Beleg-Pfad, NICHT als RLS-Quelle.
--
-- Architektur:
--   * KEIN client_id, KEIN company_id.
--   * RLS-Read: alle authentifizierten Benutzer (globale Stammdaten).
--   * RLS-Write: KEINE Policy fuer authenticated → nur service_role kann
--     schreiben (Import laeuft per Backend-Skript, nicht per User-UI).
--   * Idempotent (CREATE TABLE / INDEX / POLICY mit IF NOT EXISTS bzw.
--     DROP/CREATE-Pattern).
--   * Reine Tabellendefinition: keine Trigger, keine Funktionen, keine
--     Material-Views. Kein Import-/UI-/Berechnungspfad wird aktiviert.
--
-- source_kind Wertemenge (exakt 8, geschlossen):
--   gemfa                  — Gemeindeverzeichnis-Standard
--   destatis_gv_isys       — Destatis GV-ISYS-Export
--   landesgesetz           — Landesfeiertagsgesetz / Laendersatzung
--   landesstatistik        — Statistisches Landesamt
--   stadtsatzung           — Stadtsatzung (Bezirks-/Stadt-Feiertage)
--   verordnung             — Bundes-/Landesverordnung
--   manuell                — Manuelle Pflege als Erfassungskanal;
--                            NIE alleinige Source of Truth.
--   validation_reference   — Zweitquelle zur Validierung anderer
--                            Sources; NIE tragende Source of Truth.
--
-- Bewusst NICHT in diesem Sprint:
--   * Keine Feiertagsregel-Anwendung.
--   * Keine Feiertagstabelle.
--   * Kein client_deadline / deadline_status_history.
--   * Keine Finanzamt-/Finanzkassen-Tabelle.
--   * Keine produktive Importlogik.
--   * Keine mandantenspezifischen Tabellen.
--   * Keine UI-/ArbeitsplatzPage-/DeadlinesPage-Aenderung.
-- ============================================================================

create table if not exists public.deadline_source_versions (
  id uuid primary key default gen_random_uuid(),

  -- Klartext-Bezeichnung der Quelle (z. B. "Bayern Landesfeiertage 2026").
  source_name text not null
    check (char_length(source_name) between 1 and 200),

  -- Art der Quelle — geschlossene Wertemenge (siehe Header).
  source_kind text not null check (
    source_kind in (
      'gemfa',
      'destatis_gv_isys',
      'landesgesetz',
      'landesstatistik',
      'stadtsatzung',
      'verordnung',
      'manuell',
      'validation_reference'
    )
  ),

  -- Versions-Identifier (z. B. "v2026.1", "Stand 2026-05-13", "2026-Q2").
  source_version text not null
    check (char_length(source_version) between 1 and 100),

  -- Optionaler Hash des importierten Inhalts (z. B. SHA-256 hex).
  source_hash text null,

  -- Zeitstempel des Imports.
  imported_at timestamptz not null default now(),

  -- Optional: Importeur als FK auf auth.users(id) — NICHT auf employees
  -- (Lohn-Stammdaten-Entitaet) und NICHT auf user_profiles (App-Profile);
  -- Konvention im Repo ist auth.users(id) als Audit-FK-Quelle.
  imported_by uuid null references auth.users(id) on delete set null,

  -- Optionaler Geltungsbereich (z. B. "DE-BW", "DE", "Stadt Muenchen").
  coverage text null,

  -- Optionaler Selbst-FK: source_kind='validation_reference'-Eintraege
  -- koennen auf einen anderen Source-Versions-Eintrag verweisen, den sie
  -- validieren. Andere Eintraege belassen das Feld NULL.
  validation_against uuid null
    references public.deadline_source_versions(id) on delete restrict,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Lookup-Indizes fuer typische Abfragen (current version je kind,
-- chronologische Liste je kind, Validation-Referenz-Aufloesung).
create index if not exists deadline_source_versions_kind_version_idx
  on public.deadline_source_versions(source_kind, source_version);

create index if not exists deadline_source_versions_kind_imported_idx
  on public.deadline_source_versions(source_kind, imported_at desc);

create index if not exists deadline_source_versions_validation_idx
  on public.deadline_source_versions(validation_against)
  where validation_against is not null;

alter table public.deadline_source_versions enable row level security;

-- SELECT: alle authentifizierten Benutzer duerfen lesen (globale Stammdaten).
drop policy if exists deadline_source_versions_select
  on public.deadline_source_versions;
create policy deadline_source_versions_select
  on public.deadline_source_versions
  for select
  to authenticated
  using (true);

-- INSERT / UPDATE / DELETE: KEINE Policy fuer authenticated → nur
-- service_role kann schreiben. Imports laufen per Backend-Skript, nicht
-- per User-UI. RLS-Default-Deny stellt sicher, dass authentifizierte
-- Benutzer diese Tabelle nicht mutieren koennen.

-- Object-level GRANTs nach 0054-Konvention ("Lehre 44: GRANT und RLS sind
-- orthogonale Schichten"). 0054 hat das per-Tabellen-GRANT-Set fuer die
-- damals existierenden 42 Tabellen verteilt; eine spaeter angelegte Tabelle
-- wie diese erbt diese GRANTs nicht automatisch und muss sie eigens fuehren.
-- Gruppe-E-Pattern (Read-Only) aus 0054:136: nur SELECT fuer authenticated;
-- service_role bekommt ALL fuer spaetere Backend-/Importpfade. Kein GRANT
-- an anon (0052-Konvention bleibt unveraendert).
grant select on public.deadline_source_versions to authenticated;
grant all on public.deadline_source_versions to service_role;

comment on table public.deadline_source_versions is
  'Globale Source-Versions-Registry fuer die Fristen-Schicht. Kein '
  'client_id, kein company_id. RLS-Read fuer authenticated, RLS-Write '
  'nur via service_role.';

comment on column public.deadline_source_versions.source_kind is
  'Geschlossene Wertemenge (8): gemfa, destatis_gv_isys, landesgesetz, '
  'landesstatistik, stadtsatzung, verordnung, manuell, validation_reference. '
  'manuell und validation_reference sind explizit NICHT alleinige Source '
  'of Truth.';

comment on column public.deadline_source_versions.validation_against is
  'Self-FK: source_kind=validation_reference-Eintraege verweisen auf den '
  'Source-Versions-Eintrag, den sie validieren. Andere Eintraege belassen '
  'das Feld NULL.';

comment on column public.deadline_source_versions.imported_by is
  'FK auf auth.users(id) — nicht auf employees oder user_profiles. '
  'Imports werden einer User-Identitaet zugeordnet, nicht einer Lohn-/'
  'App-Profil-Entitaet.';
