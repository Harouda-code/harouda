-- ============================================================================
-- harouda-app · Sprint Fristen / P3.2 · Feiertagsanwendung-pro-AGS-Registry
--
-- Globale Stammdaten-Tabelle, die eine Feiertagsregel
-- (`public.deadline_holiday_rules`) mit einem konkreten Amtlichen
-- Gemeindeschluessel verbindet. Diese Tabelle ist NICHT mandanten-
-- spezifisch und traegt KEIN client_id-Feld; ebenfalls KEIN company_id-
-- Feld. Sie ist die P3.2-Entitaet "Feiertagsanwendung pro Gemeinde/AGS".
--
-- Zweck:
--   Pro Kombination aus AGS + holiday_key + Gueltigkeits-Spanne wird hier
--   abgelegt, OB eine Feiertagsregel an dieser Gemeinde gilt (`applies`).
--   Jeder Datensatz traegt:
--     * AGS als Pflicht-Schluessel (8-stellig).
--     * holiday_rule_id als FK auf die Regel-Registry.
--     * holiday_key als bewusst DENORMALISIERTE Lesebruecke zur Regel
--       (Performance + Lesbarkeit; konsistenz wird durch Importer geprueft).
--     * source_id + source_version als Provenance-Beleg.
--     * confidence + review_status als Berechnungs-Gates fuer SPAETERE
--       Schichten — hier ohne Berechnungswirkung.
--
-- Architektur:
--   * KEIN client_id, KEIN company_id (globales Stammdatum).
--   * AGS ist Pflicht-Schluessel; keine PLZ-/Postleitzahl-/postal_code-
--     Logik. PLZ ist keine stabile 1:1-Zuordnung zu Gemeinden.
--   * `applies = true/false` ist reine Stammdaten-Anwendung der Regel,
--     KEIN Frist-Status, KEIN Workflow-Status.
--   * `confidence` (high/medium/low) bewertet die Belastbarkeit der
--     Quelle/Importroutine; in dieser Migration nur Daten-Marker.
--   * `review_status` (confirmed/manual_review_required/disputed/
--     deprecated) ist Review-/Quality-Marker. `manual_review_required`
--     ist Review-Marker, KEIN Lifecycle-Status und KEIN Wert einer
--     spaeteren Status-History.
--   * Diese Tabelle aktiviert KEINE Feiertagsberechnung, KEINEN Frist-
--     Rollover, KEIN Owner-/Workflow-System.
--   * Eintraege aus deadline_source_versions mit
--     source_kind='validation_reference' duerfen NICHT als tragende
--     Quelle einer Anwendung verwendet werden — Durchsetzung erfolgt in
--     der spaeteren Import-/Validierungs-Schicht (kein DB-Trigger hier).
--   * RLS-Read: alle authentifizierten Benutzer.
--   * RLS-Write: KEINE Policy fuer authenticated → nur service_role.
--   * Explizite GRANTs (Lehre 44 aus 0054: GRANT und RLS sind orthogonale
--     Schichten).
--
-- Bewusst NICHT in diesem Sprint:
--   * Keine Konsistenz-Pruefung holiday_key vs. holiday_rule_id (Importer).
--   * Keine bundesland-Spalte; AGS traegt die Bundesland-Kennung implizit
--     in den ersten zwei Ziffern und wird in spaeterer Validierungs-/
--     Berechnungs-Schicht abgeleitet.
--   * Keine UI-, Service-, ArbeitsplatzPage-, DeadlinesPage-,
--     KanzleiDashboardPage- oder DeadlineService-Aktivierung.
--   * Kein client_deadline / deadline_status_history.
--   * Keine Trigger, Functions, Materialized Views.
-- ============================================================================

create table if not exists public.deadline_holiday_applications (
  id uuid primary key default gen_random_uuid(),

  -- Amtlicher Gemeindeschluessel (8-stellig). Pflicht-Schluessel.
  ags text not null
    check (ags ~ '^[0-9]{8}$'),

  -- FK auf die Feiertagsregel.
  holiday_rule_id uuid not null
    references public.deadline_holiday_rules(id) on delete restrict,

  -- Bewusst denormalisierte Lesebruecke zur Regel (Performance + Lesbarkeit).
  -- Konsistenz holiday_key vs. holiday_rule_id pruefen Importroutinen.
  holiday_key text not null
    check (
      char_length(holiday_key) between 1 and 100
      and holiday_key ~ '^[a-z][a-z0-9_]*$'
    ),

  -- Reine Stammdaten-Anwendung: gilt die Regel an dieser Gemeinde?
  -- KEIN Frist-Status, KEIN Workflow-Status.
  applies boolean not null,

  -- Fachliche Gueltigkeits-Spanne als Kalenderdatum (DATE).
  gueltig_ab date not null,
  gueltig_bis date null,

  -- Provenance.
  source_id uuid not null
    references public.deadline_source_versions(id) on delete restrict,
  source_version text not null
    check (char_length(source_version) between 1 and 100),

  -- Berechnungs-Gates fuer SPAETERE Schichten — hier ohne Berechnungswirkung.
  confidence text not null check (
    confidence in ('high', 'medium', 'low')
  ),
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
  constraint deadline_holiday_applications_gueltigkeit_range check (
    gueltig_bis is null or gueltig_bis >= gueltig_ab
  )
);

-- Lookup-Indizes fuer typische Abfragen.
create index if not exists deadline_holiday_applications_ags_key_gueltig_idx
  on public.deadline_holiday_applications(ags, holiday_key, gueltig_ab);

create index if not exists deadline_holiday_applications_rule_idx
  on public.deadline_holiday_applications(holiday_rule_id);

create index if not exists deadline_holiday_applications_source_idx
  on public.deadline_holiday_applications(source_id);

create index if not exists deadline_holiday_applications_review_idx
  on public.deadline_holiday_applications(review_status);

create index if not exists deadline_holiday_applications_confidence_idx
  on public.deadline_holiday_applications(confidence);

-- Partial-Index fuer Review-Queue-Lookups: nur Eintraege, die manuelle
-- Pruefung brauchen oder strittig sind, werden indexiert. Spart Platz und
-- macht spaetere Review-Listen schnell, ohne Berechnung zu aktivieren.
create index if not exists deadline_holiday_applications_review_queue_idx
  on public.deadline_holiday_applications(review_status, ags)
  where review_status in ('manual_review_required', 'disputed');

alter table public.deadline_holiday_applications enable row level security;

-- SELECT: alle authentifizierten Benutzer duerfen lesen (globale Stammdaten).
drop policy if exists deadline_holiday_applications_select
  on public.deadline_holiday_applications;
create policy deadline_holiday_applications_select
  on public.deadline_holiday_applications
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
grant select on public.deadline_holiday_applications to authenticated;
grant all on public.deadline_holiday_applications to service_role;

comment on table public.deadline_holiday_applications is
  'Globale Feiertagsanwendung-pro-AGS-Registry. Kein client_id, kein '
  'company_id. AGS ist Pflicht-Schluessel, keine PLZ-Logik. applies ist '
  'reine Stammdaten-Anwendung, kein Frist-Status. confidence und '
  'review_status sind Berechnungs-Gates fuer spaetere Schichten — hier '
  'ohne Berechnungswirkung. manual_review_required ist Review-Marker, '
  'KEIN Lifecycle-Status.';

comment on column public.deadline_holiday_applications.ags is
  'Amtlicher Gemeindeschluessel (8-stellige Ziffer). Pflicht. Konsistenz '
  'mit public.deadline_municipalities pruefen Importer.';

comment on column public.deadline_holiday_applications.holiday_key is
  'Bewusst denormalisierte Lesebruecke zur Feiertagsregel. Konsistenz '
  'mit deadline_holiday_rules.holiday_key bei demselben holiday_rule_id '
  'pruefen Importer.';

comment on column public.deadline_holiday_applications.applies is
  'true = Regel gilt an dieser Gemeinde im Gueltigkeitszeitraum, '
  'false = Regel gilt explizit NICHT. Reine Stammdaten-Anwendung, kein '
  'Frist-Status, kein Workflow-Status.';

comment on column public.deadline_holiday_applications.confidence is
  'Berechnungs-Gate (high/medium/low) fuer spaetere Schichten. In dieser '
  'Migration ohne Berechnungswirkung — reine Daten-Bewertung.';

comment on column public.deadline_holiday_applications.review_status is
  'Review-/Quality-Marker (4 Werte). manual_review_required und disputed '
  'erfordern menschliche Pruefung BEVOR Berechnungs-Schichten den '
  'Eintrag konsumieren. Strikt getrennt von Lifecycle-Status oder '
  'Status-History (gehoeren in spaetere Tabellen).';

comment on column public.deadline_holiday_applications.source_id is
  'Pflicht-FK auf public.deadline_source_versions(id). Eintraege mit '
  'source_kind=validation_reference duerfen NICHT als tragende Quelle '
  'einer Anwendung dienen — Durchsetzung in spaeterer Import-/'
  'Validierungs-Schicht.';
