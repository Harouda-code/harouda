-- ============================================================================
-- harouda-app · Sprint Fristen / P2 v1.1 · client_deadline Foundation
--
-- Mandantenspezifische Foundation-Tabelle fuer die spaetere Fristen-
-- Schicht (MandantDeadlineService). Diese Tabelle traegt company_id
-- NOT NULL UND client_id NOT NULL — sie ist die erste mandanten-
-- spezifische Tabelle der Fristen-Schicht. Sie ergaenzt die globalen
-- Stammdaten-Registries aus 0060-0066 und ersetzt sie nicht.
--
-- Zweck:
--   Persistenz-Skelett fuer eine einzelne Steuer-/Compliance-Frist eines
--   konkreten Klienten einer Kanzlei (z. B. eine UStVA-Abgabefrist fuer
--   Klient X im Voranmeldungsmonat 10/2026). Foundation-only:
--     * KEIN Lifecycle-Status (kommt erst mit deadline_status_history in
--       einem spaeteren Sprint, gemeinsam mit dem Service-Schreibpfad).
--     * KEINE Berechnungslogik (kommt mit MandantDeadlineService).
--     * KEINE UI-Aktivierung in dieser Migration.
--     * KEINE Trigger / KEINE Function / KEINE Materialized View.
--     * Schreibpfad in 0067 ausschliesslich via service_role — sobald
--       MandantDeadlineService steht, ergaenzt eine spaetere Migration
--       die INSERT/UPDATE-Policies fuer authenticated.
--
-- Architektur:
--   * P1: gehoert zum neuen MandantDeadlineService-Pfad, nicht zum
--     bestehenden DeadlineService (DeadlineService und data/deadlines.ts
--     bleiben unveraendert).
--   * P2 v1.1: client_deadline ist die mandantenspezifische
--     Haupt-Persistenzentitaet. status als materialisierte Projektion
--     von deadline_status_history wird in einem spaeteren Sprint
--     aktiviert — in 0067 gibt es bewusst KEINE status-Spalte. Damit
--     entsteht keine NOT-NULL-Verpflichtung ohne historischen Beleg.
--   * P3.2: globale Registry-Tabellen 0060-0066 bleiben unveraendert.
--   * P3.4 v1.1: deadline_type ist exakt eine geschlossene 7-Werte-Liste
--     (siehe CHECK). deadline_class ist exakt eine geschlossene
--     3-Werte-Liste. Die Type-Class-Matrix ist exakt durch CHECK
--     erzwungen. ZM_ABGABE bekommt deadline_class=abgabe (nicht
--     nicht_zugeordnet); JAHRESABSCHLUSS_ABGABE bekommt
--     deadline_class=nicht_zugeordnet. catalog_status lebt im
--     Katalog (ausserhalb dieser Migration) und wird hier NICHT als
--     Spalte materialisiert.
--   * P4 v1.1: company_id NOT NULL + client_id NOT NULL. KEIN
--     completed-Pfad. KEINE neuen Rollen. Audit-FK-Quelle waere
--     auth.users(id), aber in 0067 existiert noch kein Lifecycle-Audit
--     (kommt mit History).
--   * 0026-Konvention: RESTRICTIVE client_consistency-Policy mit
--     public.client_belongs_to_company(client_id, company_id).
--   * 0004/0057-Konvention: SELECT-Gate via public.is_company_member
--     (company_id) — kein public.can_read (existiert im Repo nicht).
--   * 0054-Konvention: Object-Level GRANTs (Lehre 44: GRANT und RLS
--     sind orthogonale Schichten). Lese-Pfad: SELECT fuer authenticated.
--     Schreib-Pfad: ALL fuer service_role. Kein GRANT an anon
--     (0052-Konvention).
--
-- Katalog-Sperrstatus reserved_blocked (ausserhalb dieser Migration):
--   ZM_ABGABE und JAHRESABSCHLUSS_ABGABE sind im Katalog (ausserhalb
--   0067) auf catalog_status=reserved_blocked gesetzt. Diese Sperre
--   wird im Rule-/Service-Layer beruecksichtigt; 0067 aktiviert
--   KEINEN automatischen Berechnungslauf und KEINE Sperrlogik.
--   Eintraege in public.client_deadline mit diesen deadline_type-
--   Werten sind strukturell zulaessig (z. B. fuer Migrations-/Audit-
--   Zwecke), werden aber von einem spaeteren MandantDeadlineService
--   NICHT automatisch erzeugt.
--
-- Bewusst NICHT in dieser Migration:
--   * Keine status-Spalte.
--   * Keine deadline_status_history-Tabelle.
--   * Keine catalog_status-Spalte.
--   * Keine review_status-Spalte.
--   * Keine confidence-Spalte.
--   * Keine frist- oder zeitraum-Spalte.
--   * Keine FK auf 0066 (FA-Kasse-Zuordnungs-Snapshot kommt mit der
--     Berechnungsschicht).
--   * Keine Trigger, Functions, Materialized Views.
--   * Keine UI-, Service-, ArbeitsplatzPage-, DeadlinesPage-,
--     KanzleiDashboardPage- oder DeadlineService-Aktivierung.
--   * Keine Aktivierung der Wertemengen completed / submitted /
--     approved / overdue / erledigt / manual_review_required als
--     Lifecycle-Werte.
--   * Keine INSERT/UPDATE/DELETE-Policy fuer authenticated.
--   * Keine Veraenderung an Migrationen 0060-0066.
-- ============================================================================

create table if not exists public.client_deadline (
  id uuid primary key default gen_random_uuid(),

  -- Mandantenspezifischer Scope (P4 v1.1): beide FKs sind PFLICHT.
  company_id uuid not null
    references public.companies(id) on delete restrict,
  client_id uuid not null
    references public.clients(id) on delete restrict,

  -- Geschlossene P3.4-v1.1-Wertemenge (7 Werte). Wertemenge wird durch
  -- den client_deadline_type_enum-CHECK erzwungen.
  deadline_type text not null,

  -- Geschlossene P3.4-v1.1-Wertemenge (3 Werte). Wertemenge wird durch
  -- den client_deadline_class_enum-CHECK erzwungen.
  deadline_class text not null,

  -- Fachlicher Zeitraum (DATE, KEIN Timestamp). Beispielsemantik:
  -- bei USTVA der Voranmeldungsmonat (01.10. bis 31.10.); bei EBILANZ
  -- das Wirtschaftsjahr.
  period_start date not null,
  period_end date not null,

  -- Fachliche Faelligkeit (DATE, KEIN Timestamp). Wird vom spaeteren
  -- MandantDeadlineService aus globalen Stammdaten am Stichtag
  -- aufgeloest und in 0067 nur als Wert persistiert.
  due_date date not null,

  -- Provenance: Pflicht-FK auf importierte Source-Version.
  source_id uuid not null
    references public.deadline_source_versions(id) on delete restrict,
  source_version text not null
    check (char_length(source_version) between 1 and 100),

  -- Audit-Standard (UTC-Timestamp).
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  -- CHECK 1: deadline_type ist exakt eine der 7 P3.4-v1.1-Werte.
  constraint client_deadline_type_enum check (
    deadline_type in (
      'USTVA_ABGABE',
      'USTVA_ZAHLUNG',
      'LSTA_ABGABE',
      'LSTA_ZAHLUNG',
      'ZM_ABGABE',
      'EBILANZ_ABGABE',
      'JAHRESABSCHLUSS_ABGABE'
    )
  ),

  -- CHECK 2: deadline_class ist exakt eine der 3 P3.4-v1.1-Werte.
  constraint client_deadline_class_enum check (
    deadline_class in (
      'abgabe',
      'zahlung',
      'nicht_zugeordnet'
    )
  ),

  -- CHECK 3: Type-Class-Matrix exakt. Jede Kombination muss eines der
  -- folgenden sieben Paare sein (P3.4 v1.1). JAHRESABSCHLUSS_ABGABE
  -- ist als einzige mit deadline_class=nicht_zugeordnet verbunden.
  -- ZM_ABGABE ist mit deadline_class=abgabe verbunden (nicht
  -- nicht_zugeordnet).
  constraint client_deadline_type_class_matrix check (
    (deadline_type = 'USTVA_ABGABE'           and deadline_class = 'abgabe')
    or (deadline_type = 'USTVA_ZAHLUNG'           and deadline_class = 'zahlung')
    or (deadline_type = 'LSTA_ABGABE'             and deadline_class = 'abgabe')
    or (deadline_type = 'LSTA_ZAHLUNG'            and deadline_class = 'zahlung')
    or (deadline_type = 'ZM_ABGABE'               and deadline_class = 'abgabe')
    or (deadline_type = 'EBILANZ_ABGABE'          and deadline_class = 'abgabe')
    or (deadline_type = 'JAHRESABSCHLUSS_ABGABE'  and deadline_class = 'nicht_zugeordnet')
  ),

  -- CHECK 4: Periodenbereich konsistent.
  constraint client_deadline_period_range check (
    period_end >= period_start
  )
);

-- Lookup-Indizes (alle if not exists, idempotent).
create index if not exists client_deadline_company_due_idx
  on public.client_deadline(company_id, due_date);

create index if not exists client_deadline_client_due_idx
  on public.client_deadline(client_id, due_date);

create index if not exists client_deadline_type_period_idx
  on public.client_deadline(deadline_type, period_start);

create index if not exists client_deadline_source_idx
  on public.client_deadline(source_id);

alter table public.client_deadline enable row level security;

-- SELECT: kanzlei-scoped via Repo-Helper public.is_company_member
-- (definiert in 0004 und in 0057 als SECURITY DEFINER neuverankert).
-- Kein public.can_read — dieser Helper existiert im Repo nicht.
drop policy if exists client_deadline_select
  on public.client_deadline;
create policy client_deadline_select
  on public.client_deadline
  for select
  to authenticated
  using (public.is_company_member(company_id));

-- RESTRICTIVE Zusatzsicherung: client_id MUSS strukturell zu
-- company_id gehoeren (0026-Konvention). Greift zusaetzlich zu jeder
-- permissiven Policy — auch zukuenftig, wenn z. B. INSERT/UPDATE-
-- Policies fuer authenticated ergaenzt werden, bleibt die
-- Konsistenzpruefung aktiv.
drop policy if exists client_deadline_client_consistency
  on public.client_deadline;
create policy client_deadline_client_consistency
  on public.client_deadline
  as restrictive for all
  using (
    public.client_belongs_to_company(client_id, company_id)
  )
  with check (
    public.client_belongs_to_company(client_id, company_id)
  );

-- KEINE INSERT-Policy fuer authenticated.
-- KEINE UPDATE-Policy fuer authenticated.
-- KEINE DELETE-Policy fuer authenticated.
-- Schreibpfad bleibt service_role-only, bis MandantDeadlineService
-- gelockt ist. Eine spaetere Migration ergaenzt INSERT/UPDATE-
-- Policies (typischerweise mit public.can_write(company_id) —
-- bestehender Helper aus 0004/0057), nicht diese.

-- Object-level GRANTs nach 0054-Konvention (Lehre 44 — GRANT und RLS
-- sind orthogonale Schichten). Lese-Pfad: SELECT fuer authenticated.
-- Schreib-Pfad: ALL fuer service_role. Kein GRANT an anon
-- (0052-Konvention).
grant select on public.client_deadline to authenticated;
grant all on public.client_deadline to service_role;

comment on table public.client_deadline is
  'Mandantenspezifische Foundation-Tabelle der Fristen-Schicht. '
  'company_id NOT NULL und client_id NOT NULL (P4 v1.1). '
  'Foundation-only: KEIN Lifecycle in dieser Migration. P2 v1.1 '
  'lockt eine spaetere materialisierte Projektion aus History — in '
  '0067 wird dazu noch keine Spalte angelegt. Schreibpfad in 0067 '
  'nur via service_role. RLS-Read via public.is_company_member '
  '(company_id) plus RESTRICTIVE client_belongs_to_company.';

comment on column public.client_deadline.deadline_type is
  'Geschlossene 7-Werte-Wertemenge gemaess P3.4 v1.1: USTVA_ABGABE, '
  'USTVA_ZAHLUNG, LSTA_ABGABE, LSTA_ZAHLUNG, ZM_ABGABE, '
  'EBILANZ_ABGABE, JAHRESABSCHLUSS_ABGABE. ZM_ABGABE und '
  'JAHRESABSCHLUSS_ABGABE sind im Katalog reserved_blocked — '
  'Sperre wird im Rule-/Service-Layer beruecksichtigt, nicht in '
  'dieser Migration.';

comment on column public.client_deadline.deadline_class is
  'Geschlossene 3-Werte-Wertemenge gemaess P3.4 v1.1: abgabe, '
  'zahlung, nicht_zugeordnet. Type-Class-Matrix in CHECK erzwungen. '
  'JAHRESABSCHLUSS_ABGABE ist als einzige mit nicht_zugeordnet '
  'verbunden. ZM_ABGABE ist mit abgabe verbunden, nicht mit '
  'nicht_zugeordnet.';

comment on column public.client_deadline.due_date is
  'Fachliche Faelligkeit als Kalenderdatum (DATE, kein UTC-Timestamp). '
  'Wert wird vom spaeteren MandantDeadlineService aus globalen '
  'Stammdaten am Stichtag aufgeloest und gespeichert. 0067 selbst '
  'erzeugt keine Berechnung.';

comment on column public.client_deadline.period_start is
  'Beginn des fachlichen Zeitraums (DATE). Beispielsemantik: erster '
  'Tag des Voranmeldungsmonats bei USTVA-Typen, erster Tag des '
  'Wirtschaftsjahres bei EBILANZ_ABGABE oder JAHRESABSCHLUSS_ABGABE.';

comment on column public.client_deadline.period_end is
  'Ende des fachlichen Zeitraums (DATE). Der Range-Constraint '
  'client_deadline_period_range erzwingt period_end >= period_start.';

comment on column public.client_deadline.source_id is
  'Provenance: Pflicht-FK auf public.deadline_source_versions(id) aus '
  'der globalen Source-Versions-Registry. Audit-Beleg-Pfad. '
  'source_kind=validation_reference darf spaeter NICHT als tragende '
  'Quelle eines produktiven client_deadline-Eintrags dienen — '
  'Durchsetzung in der spaeteren Validierungs-Schicht. '
  'source_kind=manuell bleibt ausschliesslich Pflegeweg und niemals '
  'alleinige Source of Truth.';
