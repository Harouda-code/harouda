-- ============================================================================
-- harouda-app · Sprint Fristen / P3.2 + P3.4 · Finanzkasse-Stammdaten-Registry
--
-- Globale, kanzleiuebergreifende Stammdaten-Tabelle fuer Finanzkassen
-- (Kassen-Identifier, Name, Anschrift, Bundesland-Zuordnung, AGS-Sitz).
-- Diese Tabelle ist NICHT mandantenspezifisch und traegt KEIN client_id-
-- Feld; ebenfalls KEIN company_id-Feld. Alle Kanzleien teilen denselben
-- Finanzkasse-Stammdaten-Bestand.
--
-- Zweck:
--   Reine Stammdaten-Grundlage als spaeterer Feiertagsanker fuer
--   Zahlungsfristen. Diese Tabelle ist NOCH NICHT berechnungswirksam.
--   Jeder Datensatz beschreibt eine Finanzkasse mit:
--     * kasse_id als fachlicher Identifier (Text, 1-100 Zeichen) —
--       die Vergabe-Konvention je Bundesland ist unterschiedlich (keine
--       einheitliche bundesweite Nummer wie BUFA), daher Text statt
--       starre Format-Regel.
--     * name + Anschriftsfeldern (adresse, plz, ort) — plz ist NUR
--       Adressfeld, niemals Aufloesungsschluessel fuer Frist-Logik.
--     * bundesland im ISO 3166-2:DE-Format als spaeterer
--       Geltungsbereich.
--     * ags_sitz als 8-stelliger Amtlicher Gemeindeschluessel des
--       Sitzes — der SPAETERE Feiertagsanker fuer Zahlungsfristen.
--     * source_id + source_version als Provenance-Beleg.
--     * review_status als Quality-Marker (siehe Architekturregeln).
--
-- Architektur:
--   * KEIN client_id, KEIN company_id (globales Stammdatum).
--   * Finanzkasse ist eigenstaendige Entitaet und darf NICHT mit
--     Finanzamt (public.deadline_tax_offices) verschmolzen werden.
--     Strukturell + organisatorisch getrennt: Finanzamt = Veranlagung/
--     Abgabefrist-Anker; Finanzkasse = Zahlungsabwicklung/Zahlungsfrist-
--     Anker.
--   * KEINE FA-Kasse-Zuordnung in diesem Sprint. Kein FK auf
--     public.deadline_tax_offices. Die Verknuepfung zwischen Finanzamt
--     und Finanzkasse ist ein eigener, spaeterer Sprint mit eigener
--     Zuordnungs-Tabelle und Gueltigkeits-Spannen — kein impliziter
--     1:1-FK.
--   * plz ist NUR Adressfeld. Frist-/Feiertags-Logik darf NIEMALS
--     ueber plz aufgeloest werden. Aufloesungsschluessel ist ags_sitz.
--   * ags_sitz ist der spaetere Feiertagsanker fuer Zahlungsfristen.
--     In dieser Migration reine Datenhaltung, keine Berechnung
--     aktiviert.
--   * review_status ist Stammdaten-/Quality-Marker, KEIN Lifecycle-
--     Status. Der Wert manual_review_required darf NICHT als Wert
--     einer client_deadline.status-Spalte, einer deadline_status_history-
--     Spalte oder eines status_reason-Feldes uebertragen werden — er
--     gehoert ausschliesslich in den review_status-Kontext.
--   * Eintraege aus deadline_source_versions mit
--     source_kind=validation_reference duerfen spaeter NICHT als
--     tragende Quelle produktiver Finanzkasse-Stammdaten dienen.
--     Dokumentarische Verankerung, keine technische Erzwingung in
--     dieser Migration.
--   * source_kind=manuell bleibt ausschliesslich Pflegeweg und niemals
--     alleinige Source of Truth. Dokumentarische Verankerung, keine
--     technische Erzwingung in dieser Migration.
--   * gueltig_ab / gueltig_bis sind fachliche Kalenderdaten (DATE),
--     KEINE UTC-Timestamps.
--   * created_at / updated_at sind UTC-Timestamps (Audit-Standard).
--   * RLS-Read: alle authentifizierten Benutzer.
--   * RLS-Write: KEINE Policy fuer authenticated → nur service_role.
--   * Explizite GRANTs (Lehre 44 aus 0054: GRANT und RLS sind
--     orthogonale Schichten).
--
-- Bewusst NICHT in diesem Sprint:
--   * Keine Finanzamt-Tabelle (existiert separat in 0064).
--   * Keine FA-Kasse-Zuordnung (kein FK auf public.deadline_tax_offices).
--   * Keine Feiertagsregel-/Feiertagsanwendung-Erweiterung.
--   * Keine Berechnungslogik.
--   * Keine Trigger, Functions, Materialized Views.
--   * Keine Aenderung an bestehenden Tabellen.
--   * Keine UI-/ArbeitsplatzPage-/DeadlinesPage-/KanzleiDashboardPage-/
--     DeadlineService-Aktivierung.
--   * Kein client_deadline / deadline_status_history.
-- ============================================================================

create table if not exists public.deadline_tax_cash_offices (
  id uuid primary key default gen_random_uuid(),

  -- Fachlicher Identifier der Finanzkasse (Text, da keine bundesweit
  -- einheitliche Nummerierung existiert). Eindeutig in Kombination
  -- mit der Gueltigkeits-Spanne.
  kasse_id text not null
    check (char_length(kasse_id) between 1 and 100),

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

  -- Amtlicher Gemeindeschluessel des Finanzkasse-Sitzes (8-stellig).
  -- Spaeterer Feiertagsanker fuer Zahlungsfristen — in dieser
  -- Migration reine Datenhaltung.
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
  constraint deadline_tax_cash_offices_gueltigkeit_range check (
    gueltig_bis is null or gueltig_bis >= gueltig_ab
  )
);

-- Lookup-Indizes fuer typische Abfragen.
create index if not exists deadline_tax_cash_offices_kasse_gueltig_idx
  on public.deadline_tax_cash_offices(kasse_id, gueltig_ab);

create index if not exists deadline_tax_cash_offices_ags_sitz_idx
  on public.deadline_tax_cash_offices(ags_sitz);

create index if not exists deadline_tax_cash_offices_bundesland_idx
  on public.deadline_tax_cash_offices(bundesland);

create index if not exists deadline_tax_cash_offices_source_idx
  on public.deadline_tax_cash_offices(source_id);

create index if not exists deadline_tax_cash_offices_review_idx
  on public.deadline_tax_cash_offices(review_status);

alter table public.deadline_tax_cash_offices enable row level security;

-- SELECT: alle authentifizierten Benutzer duerfen lesen (globale Stammdaten).
drop policy if exists deadline_tax_cash_offices_select
  on public.deadline_tax_cash_offices;
create policy deadline_tax_cash_offices_select
  on public.deadline_tax_cash_offices
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
grant select on public.deadline_tax_cash_offices to authenticated;
grant all on public.deadline_tax_cash_offices to service_role;

comment on table public.deadline_tax_cash_offices is
  'Globale Finanzkasse-Stammdaten-Registry. Kein client_id, kein '
  'company_id. Eigenstaendige Entitaet — NICHT mit Finanzamt-Tabelle '
  '(public.deadline_tax_offices) verschmolzen. KEINE FA-Kasse-'
  'Zuordnung in diesem Sprint (eigener spaeterer Sprint). plz ist nur '
  'Adressfeld, niemals Aufloesungsschluessel. ags_sitz ist der '
  'spaetere Feiertagsanker fuer Zahlungsfristen. review_status ist '
  'Stammdaten-/Quality-Marker, KEIN Lifecycle-Status. RLS-Read fuer '
  'authenticated, RLS-Write nur via service_role.';

comment on column public.deadline_tax_cash_offices.kasse_id is
  'Fachlicher Identifier der Finanzkasse (Text, 1-100 Zeichen). '
  'Eindeutig in Kombination mit der Gueltigkeits-Spanne. Die Vergabe-'
  'Konvention je Bundesland ist unterschiedlich, daher Text statt '
  'starre Format-Regel.';

comment on column public.deadline_tax_cash_offices.plz is
  'Postleitzahl als reines Adressfeld. Frist-/Feiertags-Logik darf '
  'NIEMALS ueber plz aufgeloest werden. Aufloesungsschluessel fuer den '
  'Feiertagsanker ist ags_sitz.';

comment on column public.deadline_tax_cash_offices.ags_sitz is
  'Amtlicher Gemeindeschluessel des Finanzkasse-Sitzes (8-stellig). '
  'Spaeterer Feiertagsanker fuer Zahlungsfristen — in dieser Migration '
  'reine Datenhaltung, keine Berechnung aktiviert.';

comment on column public.deadline_tax_cash_offices.bundesland is
  'ISO 3166-2:DE-Format (z. B. DE-BY, DE-BW, DE-NW). Spaeterer '
  'Geltungsbereich fuer Landesfeiertage; in dieser Migration reine '
  'Stammdaten.';

comment on column public.deadline_tax_cash_offices.review_status is
  'Stammdaten-/Quality-Marker (4 Werte: confirmed, '
  'manual_review_required, disputed, deprecated). KEIN Lifecycle-Status. '
  'manual_review_required darf NICHT in client_deadline.status, '
  'deadline_status_history oder status_reason uebertragen werden — er '
  'gehoert ausschliesslich in den review_status-Kontext.';

comment on column public.deadline_tax_cash_offices.source_id is
  'Pflicht-FK auf public.deadline_source_versions(id). Eintraege mit '
  'source_kind=validation_reference duerfen spaeter NICHT als tragende '
  'Quelle produktiver Finanzkasse-Stammdaten dienen — Durchsetzung in '
  'spaeterer Import-/Validierungs-Schicht. source_kind=manuell bleibt '
  'ausschliesslich Pflegeweg und niemals alleinige Source of Truth.';
