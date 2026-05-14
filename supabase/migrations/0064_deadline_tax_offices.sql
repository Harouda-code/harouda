-- ============================================================================
-- harouda-app · Sprint Fristen / P3.2 + P3.4 · Finanzamt-Stammdaten-Registry
--
-- Globale, kanzleiuebergreifende Stammdaten-Tabelle fuer Finanzaemter
-- (Bundesfinanzamt-Nummer, Name, Anschrift, Bundesland-Zuordnung,
-- AGS-Sitz). Diese Tabelle ist NICHT mandantenspezifisch und traegt
-- KEIN client_id-Feld; ebenfalls KEIN company_id-Feld. Alle Kanzleien
-- teilen denselben Finanzamt-Stammdaten-Bestand.
--
-- Zweck:
--   Reine Stammdaten-Grundlage als spaeterer Feiertagsanker fuer
--   Abgabefristen. Diese Tabelle ist NOCH NICHT berechnungswirksam.
--   Jeder Datensatz beschreibt ein Finanzamt mit:
--     * bufa_nr als 4-stelliger Bundesfinanzamt-Nummer (fachlicher
--       Identifier — KEIN Primaerschluessel; bufa_nr + Gueltigkeits-
--       spanne identifiziert).
--     * name + Anschriftsfeldern (adresse, plz, ort) — plz ist NUR
--       Adressfeld, niemals Aufloesungsschluessel fuer Frist-Logik.
--     * bundesland im ISO 3166-2:DE-Format als spaeterer
--       Geltungsbereich.
--     * ags_sitz als 8-stelliger Amtlicher Gemeindeschluessel des
--       Sitzes — der SPAETERE Feiertagsanker fuer Abgabefristen.
--     * source_id + source_version als Provenance-Beleg.
--     * review_status als Quality-Marker (siehe Architekturregeln).
--
-- Architektur:
--   * KEIN client_id, KEIN company_id (globales Stammdatum).
--   * KEIN Primaerschluessel-Status fuer bufa_nr — fachlicher
--     Identifier mit Gueltigkeits-Spanne; technischer PK bleibt id.
--   * plz ist NUR Adressfeld. Frist-/Feiertags-Logik darf NIEMALS
--     ueber plz aufgeloest werden. Aufloesungsschluessel ist ags_sitz.
--   * ags_sitz ist der spaetere Feiertagsanker. In dieser Migration
--     reine Datenhaltung, keine Berechnung aktiviert.
--   * review_status ist Stammdaten-/Quality-Marker, KEIN Lifecycle-
--     Status. Der Wert manual_review_required darf NICHT als Wert
--     einer client_deadline.status-Spalte, einer deadline_status_history-
--     Spalte oder eines status_reason-Feldes uebertragen werden — er
--     gehoert ausschliesslich in den review_status-Kontext.
--   * Eintraege aus deadline_source_versions mit
--     source_kind=validation_reference duerfen spaeter NICHT als
--     tragende Quelle produktiver Finanzamt-Stammdaten dienen. Diese
--     Einschraenkung wird hier dokumentarisch verankert und in der
--     spaeteren Import-/Validierungs-Schicht durchgesetzt — KEIN
--     DB-Trigger in diesem Sprint.
--   * source_kind=manuell bleibt ausschliesslich Pflegeweg und
--     niemals alleinige Source of Truth. Dokumentarische Verankerung,
--     keine technische Erzwingung in dieser Migration.
--   * gueltig_ab / gueltig_bis sind fachliche Kalenderdaten (DATE),
--     KEINE UTC-Timestamps.
--   * created_at / updated_at sind UTC-Timestamps (Audit-Standard).
--   * RLS-Read: alle authentifizierten Benutzer.
--   * RLS-Write: KEINE Policy fuer authenticated → nur service_role.
--   * Explizite GRANTs (Lehre 44 aus 0054: GRANT und RLS sind
--     orthogonale Schichten).
--
-- Bewusst NICHT in diesem Sprint:
--   * Keine Finanzkasse-Tabelle.
--   * Keine FA-Kasse-Zuordnung.
--   * Keine Feiertagsregel-/Feiertagsanwendung-Erweiterung.
--   * Keine Berechnungslogik.
--   * Keine Trigger, Functions, Materialized Views.
--   * Keine Aenderung an bestehenden Tabellen.
--   * Keine UI-/ArbeitsplatzPage-/DeadlinesPage-/KanzleiDashboardPage-/
--     DeadlineService-Aktivierung.
--   * Kein client_deadline / deadline_status_history.
-- ============================================================================

create table if not exists public.deadline_tax_offices (
  id uuid primary key default gen_random_uuid(),

  -- 4-stellige Bundesfinanzamt-Nummer (BUFA-Nr).
  bufa_nr text not null
    check (bufa_nr ~ '^[0-9]{4}$'),

  name text not null
    check (char_length(name) between 1 and 200),

  -- Anschriftsfelder. plz ist NUR Adressfeld.
  adresse text not null
    check (char_length(adresse) between 1 and 200),

  plz text not null
    check (plz ~ '^[0-9]{5}$'),

  ort text not null
    check (char_length(ort) between 1 and 200),

  -- Bundesland im ISO 3166-2:DE-Format (z. B. DE-BY, DE-BW, DE-NW).
  bundesland text not null
    check (bundesland ~ '^DE-[A-Z]{2}$'),

  -- Amtlicher Gemeindeschluessel des Finanzamts-Sitzes (8-stellig).
  -- Spaeterer Feiertagsanker fuer Abgabefristen — in dieser Migration
  -- reine Datenhaltung.
  ags_sitz text not null
    check (ags_sitz ~ '^[0-9]{8}$'),

  -- Fachliche Gueltigkeits-Spanne als Kalenderdatum (DATE, kein
  -- Timestamp). NULL in gueltig_bis bedeutet "weiterhin gueltig".
  gueltig_ab date not null,
  gueltig_bis date null,

  -- Provenance: Pflicht-FK auf importierte Source-Version.
  source_id uuid not null
    references public.deadline_source_versions(id) on delete restrict,
  source_version text not null
    check (char_length(source_version) between 1 and 100),

  -- Quality-Marker (geschlossene Wertemenge, 4 Werte). KEIN Lifecycle-
  -- Status. manual_review_required und disputed erfordern menschliche
  -- Pruefung BEVOR Berechnungs-Schichten den Eintrag konsumieren.
  review_status text not null check (
    review_status in (
      'confirmed',
      'manual_review_required',
      'disputed',
      'deprecated'
    )
  ),

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  -- Konsistenz: gueltig_bis nicht vor gueltig_ab.
  constraint deadline_tax_offices_gueltigkeit_range check (
    gueltig_bis is null or gueltig_bis >= gueltig_ab
  )
);

-- Lookup-Indizes fuer typische Abfragen.
create index if not exists deadline_tax_offices_bufa_gueltig_idx
  on public.deadline_tax_offices(bufa_nr, gueltig_ab);

create index if not exists deadline_tax_offices_ags_sitz_idx
  on public.deadline_tax_offices(ags_sitz);

create index if not exists deadline_tax_offices_bundesland_idx
  on public.deadline_tax_offices(bundesland);

create index if not exists deadline_tax_offices_source_idx
  on public.deadline_tax_offices(source_id);

create index if not exists deadline_tax_offices_review_idx
  on public.deadline_tax_offices(review_status);

alter table public.deadline_tax_offices enable row level security;

-- SELECT: alle authentifizierten Benutzer duerfen lesen (globale Stammdaten).
drop policy if exists deadline_tax_offices_select
  on public.deadline_tax_offices;
create policy deadline_tax_offices_select
  on public.deadline_tax_offices
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
grant select on public.deadline_tax_offices to authenticated;
grant all on public.deadline_tax_offices to service_role;

comment on table public.deadline_tax_offices is
  'Globale Finanzamt-Stammdaten-Registry. Kein client_id, kein '
  'company_id. plz ist nur Adressfeld, niemals Aufloesungsschluessel. '
  'ags_sitz ist der spaetere Feiertagsanker fuer Abgabefristen. '
  'review_status ist Stammdaten-/Quality-Marker, KEIN Lifecycle-Status. '
  'RLS-Read fuer authenticated, RLS-Write nur via service_role.';

comment on column public.deadline_tax_offices.bufa_nr is
  '4-stellige Bundesfinanzamt-Nummer (BUFA-Nr). Fachlicher Identifier; '
  'eindeutig in Kombination mit der Gueltigkeits-Spanne.';

comment on column public.deadline_tax_offices.plz is
  'Postleitzahl als reines Adressfeld. Frist-/Feiertags-Logik darf '
  'NIEMALS ueber plz aufgeloest werden. Aufloesungsschluessel fuer den '
  'Feiertagsanker ist ags_sitz.';

comment on column public.deadline_tax_offices.ags_sitz is
  'Amtlicher Gemeindeschluessel des Finanzamts-Sitzes (8-stellig). '
  'Spaeterer Feiertagsanker fuer Abgabefristen — in dieser Migration '
  'reine Datenhaltung, keine Berechnung aktiviert.';

comment on column public.deadline_tax_offices.bundesland is
  'ISO 3166-2:DE-Format (z. B. DE-BY, DE-BW, DE-NW). Spaeterer '
  'Geltungsbereich fuer Landesfeiertage; in dieser Migration reine '
  'Stammdaten.';

comment on column public.deadline_tax_offices.review_status is
  'Stammdaten-/Quality-Marker (4 Werte: confirmed, '
  'manual_review_required, disputed, deprecated). KEIN Lifecycle-Status. '
  'manual_review_required darf NICHT in client_deadline.status, '
  'deadline_status_history oder status_reason uebertragen werden — er '
  'gehoert ausschliesslich in den review_status-Kontext.';

comment on column public.deadline_tax_offices.source_id is
  'Pflicht-FK auf public.deadline_source_versions(id). Eintraege mit '
  'source_kind=validation_reference duerfen spaeter NICHT als tragende '
  'Quelle produktiver Finanzamt-Stammdaten dienen — Durchsetzung in '
  'spaeterer Import-/Validierungs-Schicht. source_kind=manuell bleibt '
  'ausschliesslich Pflegeweg und niemals alleinige Source of Truth.';
