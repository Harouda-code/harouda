-- ============================================================================
-- harouda-app · Sprint Fristen / P3.2 + P3.4 · FA-Kasse-Zuordnungs-Registry
--
-- Globale, kanzleiuebergreifende Stammdaten-Tabelle, die ein Finanzamt
-- (public.deadline_tax_offices) mit der zustaendigen Finanzkasse
-- (public.deadline_tax_cash_offices) ueber eine fachliche Gueltigkeits-
-- Spanne verbindet. Diese Tabelle ist NICHT mandantenspezifisch und
-- traegt KEIN client_id-Feld; ebenfalls KEIN company_id-Feld. Alle
-- Kanzleien teilen denselben Zuordnungs-Bestand.
--
-- Zweck:
--   Temporale Zuordnung "welche Finanzkasse ist fuer welches Finanzamt
--   ab welchem Datum zustaendig". Spaeter wird eine Zahlungsfrist-
--   Berechnungsschicht diese Zuordnung am Stichtag aufloesen, um den
--   Zahlungsfrist-Anker (ags_sitz der zustaendigen Finanzkasse) zu
--   bestimmen. In dieser Migration ist dies REINE DATENHALTUNG —
--   die Berechnung wird NICHT in diesem Sprint gebaut.
--
-- Architektur:
--   * KEIN client_id, KEIN company_id (globales Stammdatum).
--   * Finanzamt und Finanzkasse bleiben strukturell + organisatorisch
--     GETRENNTE Entitaeten. Diese Zuordnungstabelle verschmilzt sie
--     NICHT — sie verbindet sie nur ueber FK-Beziehungen mit
--     Gueltigkeits-Spanne. Beide Eltern-Tabellen sind unveraendert.
--   * Diese Tabelle erzeugt KEINE Zahlungsfristberechnung.
--   * Die blosse Existenz eines Datensatzes ist KEIN sicherer
--     Feiertagsanker — eine spaetere Berechnungsschicht darf einen
--     Datensatz nur dann als Anker nutzen, wenn er zum Stichtag
--     eindeutig, ausreichend bestaetigt (review_status='confirmed')
--     und vertrauenswuerdig (confidence='high' oder gepruefte
--     Geschaeftsregel) ist. Diese Eindeutigkeits-/Vertrauens-Logik
--     wird in dieser Migration NICHT durchgesetzt.
--   * review_status ist Stammdaten-/Quality-Marker, KEIN Lifecycle-
--     Status. manual_review_required darf NICHT als Wert einer
--     client_deadline.status-Spalte, einer deadline_status_history-
--     Spalte oder eines status_reason-Feldes uebertragen werden — er
--     gehoert ausschliesslich in den review_status-Kontext.
--   * confidence ist Quality-Metadatum (high/medium/low), KEIN
--     Lifecycle-Status. Es bewertet die Belastbarkeit der Zuordnung,
--     nicht den Bearbeitungsstand.
--   * reviewed_by_user_id zeigt auf auth.users(id) — NICHT auf
--     employees (Lohn-Stammdaten-Entitaet) und NICHT auf
--     user_profiles (App-Profile). Konvention im Repo ist
--     auth.users(id) als Audit-FK-Quelle.
--   * reviewed_by_user_id und reviewed_at bleiben in dieser Migration
--     bewusst VORBEREITET und nullable. Ein produktiver Review-
--     Workflow (Reviewer-Pflicht, Audit-Trail, Status-Uebergaenge)
--     wird in dieser Migration NICHT aktiviert.
--   * Eintraege aus deadline_source_versions mit
--     source_kind=validation_reference duerfen spaeter NICHT als
--     tragende Quelle produktiver FA-Kasse-Zuordnungen dienen.
--     Dokumentarische Verankerung, keine technische Erzwingung in
--     dieser Migration.
--   * source_kind=manuell bleibt ausschliesslich Pflegeweg und niemals
--     alleinige Source of Truth. Dokumentarische Verankerung, keine
--     technische Erzwingung in dieser Migration.
--   * gueltig_ab / gueltig_bis sind fachliche Kalenderdaten (DATE),
--     KEINE UTC-Timestamps.
--   * created_at / updated_at / reviewed_at sind UTC-Timestamps.
--   * RLS-Read: alle authentifizierten Benutzer.
--   * RLS-Write: KEINE Policy fuer authenticated → nur service_role.
--   * Explizite GRANTs (Lehre 44 aus 0054: GRANT und RLS sind
--     orthogonale Schichten).
--
-- Bewusst NICHT in diesem Sprint:
--   * Keine neue Finanzamt-Tabelle (existiert separat in 0064).
--   * Keine neue Finanzkasse-Tabelle (existiert separat in 0065).
--   * Keine Eindeutigkeits-Constraints ueber (tax_office_id,
--     gueltig_ab) — Zuordnungen koennen historisch parallel existieren
--     (z. B. Uebergangszeitraeume); die spaetere Berechnungsschicht
--     muss die Eindeutigkeit am Stichtag selbst pruefen.
--   * Keine Feiertagsregel-/Feiertagsanwendung-Erweiterung.
--   * Keine Berechnungslogik.
--   * Keine Trigger, Functions, Materialized Views.
--   * Keine Aenderung an bestehenden Tabellen.
--   * Keine UI-/ArbeitsplatzPage-/DeadlinesPage-/KanzleiDashboardPage-/
--     DeadlineService-Aktivierung.
--   * Kein client_deadline / deadline_status_history.
--   * Keine direkte Verwendung von audit_log_ref als Statusquelle.
-- ============================================================================

create table if not exists public.deadline_tax_office_cash_office_assignments (
  id uuid primary key default gen_random_uuid(),

  -- FK auf das Finanzamt (siehe 0064).
  tax_office_id uuid not null
    references public.deadline_tax_offices(id) on delete restrict,

  -- FK auf die zustaendige Finanzkasse (siehe 0065).
  tax_cash_office_id uuid not null
    references public.deadline_tax_cash_offices(id) on delete restrict,

  -- Fachliche Gueltigkeits-Spanne als Kalenderdatum (DATE, kein
  -- Timestamp). NULL in gueltig_bis bedeutet "weiterhin gueltig".
  gueltig_ab date not null,
  gueltig_bis date null,

  -- Provenance: Pflicht-FK auf importierte Source-Version.
  source_id uuid not null
    references public.deadline_source_versions(id) on delete restrict,
  source_version text not null
    check (char_length(source_version) between 1 and 100),

  -- Quality-Metadatum (high/medium/low). KEIN Lifecycle-Status.
  -- Bewertet die Belastbarkeit der Zuordnungs-Information, nicht den
  -- Bearbeitungsstand.
  confidence text not null check (
    confidence in ('high', 'medium', 'low')
  ),

  -- Stammdaten-/Quality-Marker (4 Werte). KEIN Lifecycle-Status.
  -- manual_review_required und disputed erfordern menschliche Pruefung
  -- BEVOR Berechnungs-Schichten den Eintrag konsumieren.
  review_status text not null check (
    review_status in (
      'confirmed',
      'manual_review_required',
      'disputed',
      'deprecated'
    )
  ),

  -- Vorbereitetes Reviewer-Audit (nullable). Aktiviert KEINEN Review-
  -- Workflow in dieser Migration. FK zeigt auf auth.users(id) — nicht
  -- auf employees, nicht auf user_profiles.
  reviewed_by_user_id uuid null
    references auth.users(id) on delete set null,
  reviewed_at timestamptz null,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  -- Konsistenz: gueltig_bis nicht vor gueltig_ab.
  constraint deadline_tax_office_cash_office_assignments_gueltigkeit_range check (
    gueltig_bis is null or gueltig_bis >= gueltig_ab
  )
);

-- Lookup-Indizes fuer typische Abfragen.
create index if not exists deadline_tax_office_cash_office_assignments_office_gueltig_idx
  on public.deadline_tax_office_cash_office_assignments(tax_office_id, gueltig_ab);

create index if not exists deadline_tax_office_cash_office_assignments_cash_office_idx
  on public.deadline_tax_office_cash_office_assignments(tax_cash_office_id);

create index if not exists deadline_tax_office_cash_office_assignments_source_idx
  on public.deadline_tax_office_cash_office_assignments(source_id);

create index if not exists deadline_tax_office_cash_office_assignments_review_idx
  on public.deadline_tax_office_cash_office_assignments(review_status);

create index if not exists deadline_tax_office_cash_office_assignments_confidence_idx
  on public.deadline_tax_office_cash_office_assignments(confidence);

-- Partial-Index fuer Review-Queue-Lookups: nur Eintraege, die manuelle
-- Pruefung brauchen oder strittig sind, werden indexiert. Spart Platz
-- und macht spaetere Review-Listen schnell, ohne Berechnung zu
-- aktivieren.
create index if not exists deadline_tax_office_cash_office_assignments_review_queue_idx
  on public.deadline_tax_office_cash_office_assignments(review_status, tax_office_id)
  where review_status in ('manual_review_required', 'disputed');

alter table public.deadline_tax_office_cash_office_assignments enable row level security;

-- SELECT: alle authentifizierten Benutzer duerfen lesen (globale Stammdaten).
drop policy if exists deadline_tax_office_cash_office_assignments_select
  on public.deadline_tax_office_cash_office_assignments;
create policy deadline_tax_office_cash_office_assignments_select
  on public.deadline_tax_office_cash_office_assignments
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
grant select on public.deadline_tax_office_cash_office_assignments to authenticated;
grant all on public.deadline_tax_office_cash_office_assignments to service_role;

comment on table public.deadline_tax_office_cash_office_assignments is
  'Globale FA-Kasse-Zuordnungs-Registry. Kein client_id, kein '
  'company_id. Verbindet Finanzamt (0064) und Finanzkasse (0065) ueber '
  'eine fachliche Gueltigkeits-Spanne, ohne die Eltern-Entitaeten zu '
  'verschmelzen. Erzeugt KEINE Zahlungsfristberechnung und KEINEN '
  'sicheren Feiertagsanker allein durch Existenz eines Datensatzes — '
  'die spaetere Berechnungsschicht muss Eindeutigkeit, Bestaetigung '
  'und Vertrauenswuerdigkeit am Stichtag selbst pruefen. review_status '
  'ist Stammdaten-/Quality-Marker, KEIN Lifecycle-Status. RLS-Read '
  'fuer authenticated, RLS-Write nur via service_role.';

comment on column public.deadline_tax_office_cash_office_assignments.tax_office_id is
  'FK auf public.deadline_tax_offices(id). on delete restrict — '
  'historisch belegte Zuordnungen werden nicht implizit geloescht, '
  'wenn ein Finanzamt entfernt wird.';

comment on column public.deadline_tax_office_cash_office_assignments.tax_cash_office_id is
  'FK auf public.deadline_tax_cash_offices(id). on delete restrict — '
  'historisch belegte Zuordnungen werden nicht implizit geloescht, '
  'wenn eine Finanzkasse entfernt wird.';

comment on column public.deadline_tax_office_cash_office_assignments.confidence is
  'Quality-Metadatum (high/medium/low). KEIN Lifecycle-Status. '
  'Bewertet die Belastbarkeit der Zuordnungs-Information; die spaetere '
  'Berechnungsschicht darf einen Datensatz nur dann als Zahlungsfrist-'
  'Anker nutzen, wenn confidence ausreichend ist und review_status '
  'confirmed lautet.';

comment on column public.deadline_tax_office_cash_office_assignments.review_status is
  'Stammdaten-/Quality-Marker (4 Werte: confirmed, '
  'manual_review_required, disputed, deprecated). KEIN Lifecycle-Status. '
  'manual_review_required darf NICHT in client_deadline.status, '
  'deadline_status_history oder status_reason uebertragen werden — er '
  'gehoert ausschliesslich in den review_status-Kontext.';

comment on column public.deadline_tax_office_cash_office_assignments.reviewed_by_user_id is
  'Vorbereitetes Reviewer-Audit. FK auf auth.users(id) on delete set '
  'null — NICHT auf employees (Lohn-Stammdaten-Entitaet) und NICHT auf '
  'user_profiles (App-Profile). In dieser Migration nullable und ohne '
  'aktivierten Review-Workflow.';

comment on column public.deadline_tax_office_cash_office_assignments.source_id is
  'Pflicht-FK auf public.deadline_source_versions(id). Eintraege mit '
  'source_kind=validation_reference duerfen spaeter NICHT als tragende '
  'Quelle produktiver FA-Kasse-Zuordnungen dienen — Durchsetzung in '
  'spaeterer Import-/Validierungs-Schicht. source_kind=manuell bleibt '
  'ausschliesslich Pflegeweg und niemals alleinige Source of Truth.';
