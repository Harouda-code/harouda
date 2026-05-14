-- ============================================================================
-- harouda-app · Sprint Fristen / P3.2 + P3.4 · Gemeinde-/AGS-Registry (global)
--
-- Globale, kanzleiuebergreifende Stammdaten-Tabelle fuer Gemeinden mit
-- Amtlichem Gemeindeschluessel (AGS). Diese Tabelle ist NICHT mandanten-
-- spezifisch und traegt KEIN client_id-Feld; ebenfalls KEIN company_id-Feld.
-- Alle Kanzleien teilen dieselbe AGS-Stammdaten-Basis.
--
-- Zweck:
--   Reine Stammdaten-Grundlage fuer spaetere Frist-/Feiertags-Logik. Jeder
--   Datensatz beschreibt eine Gemeinde mit ihrem AGS, Bundesland, Gueltig-
--   keits-Spanne und Provenance-Verweis auf die Source-Versions-Registry
--   (`public.deadline_source_versions`). Aenderungen am AGS-Bestand
--   (Eingemeindung, Umgliederung, Umbenennung) werden ueber gueltig_ab /
--   gueltig_bis und vorgaenger_ags / nachfolger_ags abgebildet.
--
-- Architektur:
--   * KEIN client_id, KEIN company_id.
--   * AGS ist fachlicher Schluessel (8-stellige Ziffer, amtliche Vergabe).
--   * PLZ wird in dieser Version NICHT modelliert: PLZ ist keine fachlich
--     stabile 1:1-Zuordnung zu Gemeinden (mehrere Gemeinden teilen sich
--     PLZ-Bereiche, eine Gemeinde kann mehrere PLZ haben). Stammdaten-
--     Schluessel bleibt strikt AGS.
--   * source_id ist Pflicht: jeder AGS-Datensatz ist beweisbar einer
--     importierten Source-Version zuordenbar (Audit-Beleg-Pfad).
--   * gueltig_ab / gueltig_bis sind fachliche Kalenderdaten (DATE),
--     KEINE UTC-Timestamps. Eine Gemeinde gilt "ab dem 1.1.2026", nicht
--     "ab 2026-01-01 00:00:00+02".
--   * created_at / updated_at sind UTC-Timestamps (Audit-Standard).
--   * RLS-Read: alle authentifizierten Benutzer.
--   * RLS-Write: KEINE Policy fuer authenticated → nur service_role kann
--     schreiben (Imports laufen per Backend-Skript).
--   * GRANTs explizit (siehe Migration 0054, Lehre 44).
--
-- Bewusst NICHT in diesem Sprint:
--   * Keine Feiertagstabelle.
--   * Keine Feiertagsregel-Anwendung.
--   * Keine Finanzamt-/Finanzkassen-Tabelle.
--   * Kein client_deadline / deadline_status_history.
--   * Keine Berechnungslogik / kein MandantDeadlineService.
--   * Keine PLZ-Tabelle.
--   * Keine Trigger, keine Functions, keine Materialized Views.
--   * Keine UI-/ArbeitsplatzPage-/DeadlinesPage-Aenderung.
-- ============================================================================

create table if not exists public.deadline_municipalities (
  id uuid primary key default gen_random_uuid(),

  -- Amtlicher Gemeindeschluessel (8-stellig, fachlicher Schluessel).
  ags text not null
    check (ags ~ '^[0-9]{8}$'),

  -- Klartext-Bezeichnung der Gemeinde (z. B. "Muenchen, Landeshauptstadt").
  gemeindename text not null
    check (char_length(gemeindename) between 1 and 200),

  -- Bundesland im ISO 3166-2:DE-Format (z. B. "DE-BY", "DE-BW", "DE-NW").
  bundesland text not null
    check (bundesland ~ '^DE-[A-Z]{2}$'),

  -- Optionaler Regionalschluessel (12-stellig, Erweiterung des AGS um
  -- Regionalkennziffer; nicht fuer alle Quellen verfuegbar).
  regionalschluessel text null
    check (regionalschluessel is null or regionalschluessel ~ '^[0-9]{12}$'),

  -- Optionaler Klartext-Kreis/Landkreis (z. B. "Landkreis Muenchen",
  -- "kreisfreie Stadt"). Reine Hilfsdarstellung, nicht Schluessel.
  kreis text null
    check (kreis is null or char_length(kreis) between 1 and 200),

  -- Fachliche Gueltigkeits-Spanne als Kalenderdatum (DATE, kein
  -- Timestamp). NULL in gueltig_bis bedeutet "weiterhin gueltig".
  gueltig_ab date not null,
  gueltig_bis date null,

  -- Verkettung bei Eingemeindung / Umgliederung. vorgaenger_ags zeigt auf
  -- die historisch ersetzten AGS-Schluessel; nachfolger_ags zeigt auf den
  -- AGS, in den dieser Eintrag aufgegangen ist. Beide sind text-Felder,
  -- KEINE FKs auf die eigene Tabelle (mehrere Vorgaenger pro Nachfolger
  -- moeglich; eine FK-only-Modellierung waere unscharf).
  vorgaenger_ags text null
    check (vorgaenger_ags is null or vorgaenger_ags ~ '^[0-9]{8}$'),
  nachfolger_ags text null
    check (nachfolger_ags is null or nachfolger_ags ~ '^[0-9]{8}$'),

  -- Provenance: jede Zeile traegt Verweis auf die importierte Source-
  -- Version (Audit-Beleg-Pfad, NICHT RLS-Quelle).
  source_id uuid not null
    references public.deadline_source_versions(id) on delete restrict,
  source_version text not null
    check (char_length(source_version) between 1 and 100),

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  -- Konsistenz: gueltig_bis nicht vor gueltig_ab.
  constraint deadline_municipalities_gueltigkeit_range check (
    gueltig_bis is null or gueltig_bis >= gueltig_ab
  )
);

-- Lookup-Indizes fuer typische Abfragen (per AGS + Zeitpunkt, per
-- Bundesland, Source-Traversal, Vorgaenger/Nachfolger-Aufloesung).
create index if not exists deadline_municipalities_ags_gueltig_idx
  on public.deadline_municipalities(ags, gueltig_ab);

create index if not exists deadline_municipalities_bundesland_idx
  on public.deadline_municipalities(bundesland);

create index if not exists deadline_municipalities_source_idx
  on public.deadline_municipalities(source_id);

create index if not exists deadline_municipalities_vorgaenger_idx
  on public.deadline_municipalities(vorgaenger_ags)
  where vorgaenger_ags is not null;

create index if not exists deadline_municipalities_nachfolger_idx
  on public.deadline_municipalities(nachfolger_ags)
  where nachfolger_ags is not null;

alter table public.deadline_municipalities enable row level security;

-- SELECT: alle authentifizierten Benutzer duerfen lesen (globale Stammdaten).
drop policy if exists deadline_municipalities_select
  on public.deadline_municipalities;
create policy deadline_municipalities_select
  on public.deadline_municipalities
  for select
  to authenticated
  using (true);

-- INSERT / UPDATE / DELETE: KEINE Policy fuer authenticated → nur
-- service_role kann schreiben. RLS-Default-Deny stellt sicher, dass
-- authentifizierte Benutzer diese Tabelle nicht mutieren koennen.

-- Object-level GRANTs nach 0054-Konvention ("Lehre 44: GRANT und RLS sind
-- orthogonale Schichten"). 0054 hat das per-Tabellen-GRANT-Set fuer die
-- damals existierenden 42 Tabellen verteilt; eine spaeter angelegte Tabelle
-- wie diese erbt diese GRANTs nicht automatisch und muss sie eigens fuehren.
-- Gruppe-E-Pattern (Read-Only) aus 0054:136: nur SELECT fuer authenticated;
-- service_role bekommt ALL fuer spaetere Backend-/Importpfade. Kein GRANT
-- an anon (0052-Konvention bleibt unveraendert).
grant select on public.deadline_municipalities to authenticated;
grant all on public.deadline_municipalities to service_role;

comment on table public.deadline_municipalities is
  'Globale AGS-Stammdaten-Registry. Kein client_id, kein company_id. '
  'AGS ist fachlicher Schluessel (8-stellig). PLZ wird bewusst nicht '
  'modelliert. RLS-Read fuer authenticated, RLS-Write nur via service_role.';

comment on column public.deadline_municipalities.ags is
  'Amtlicher Gemeindeschluessel (8-stellige Ziffer). Fachlicher Schluessel '
  'der Gemeinde; bleibt ueber Gueltigkeits-Spannen hinweg stabil, bis ein '
  'Nachfolger-AGS aktiv wird.';

comment on column public.deadline_municipalities.bundesland is
  'ISO 3166-2:DE-Format (z. B. DE-BY, DE-BW, DE-NW). Bestimmt spaeter den '
  'Geltungsbereich fuer Landesfeiertage; in dieser Version reine Stammdaten.';

comment on column public.deadline_municipalities.source_id is
  'Pflicht-FK auf public.deadline_source_versions(id). Audit-Beleg-Pfad: '
  'jeder AGS-Datensatz ist einer importierten Source-Version zuordenbar.';

comment on column public.deadline_municipalities.gueltig_ab is
  'Fachliches Kalenderdatum (DATE, kein UTC-Timestamp). Eine Gemeinde '
  'gilt "ab dem 1.1.2026", nicht "ab 2026-01-01 00:00:00+02".';
