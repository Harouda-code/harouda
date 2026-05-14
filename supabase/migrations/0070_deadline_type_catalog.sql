-- ============================================================================
-- harouda-app · Sprint Fristen / P3.4 v1.1 · deadline_type_catalog
--
-- Globale, kanzleiuebergreifende Catalog-Tabelle fuer die sieben P3.4-
-- v1.1-deadline_type-Werte mit ihrer fachlichen deadline_class-Zuordnung
-- und ihrem catalog_status-Lifecycle. Diese Tabelle ist NICHT mandanten-
-- spezifisch und traegt KEIN client_id-Feld; ebenfalls KEIN company_id-
-- Feld. Sie ist die letzte fehlende globale Tabelle der Fristen-Schicht
-- und persistiert die in 0067-Headern bisher nur dokumentarisch
-- verankerten Sperr-Regeln fuer ZM_ABGABE und JAHRESABSCHLUSS_ABGABE.
--
-- Zweck:
--   Persistierte DB-Quelle der Wahrheit fuer:
--     * die geschlossene 7-Werte-deadline_type-Wertemenge (identisch zu
--       0067-Mandant-CHECK und 0068-History-CHECK).
--     * die geschlossene 3-Werte-deadline_class-Wertemenge.
--     * den 3-Werte-catalog_status-Lifecycle: active, reserved_blocked,
--       deprecated.
--     * die Type-Class-Matrix (identisch zu 0067).
--     * die Reserved-Blocked-Regel: ZM_ABGABE und JAHRESABSCHLUSS_ABGABE
--       MUESSEN catalog_status=reserved_blocked tragen.
--   Spaeter wird ein MandantDeadlineService dieser Catalog-Tabelle als
--   Lese-Quelle nutzen, um reservierte Typen NICHT automatisch zu
--   erzeugen — die Sperre lebt damit in der DB, nicht in Service-Code.
--
-- Architektur:
--   * P3.4 v1.1: gelockte Wertemengen identisch zu 0067 und 0068.
--     Catalog ist persistente Quelle, nicht nur Konvention.
--   * P2 v1.1: catalog_status ist KATALOG-Lifecycle, NICHT Mandanten-
--     Lifecycle. manual_review_required ist Quality-Marker der
--     Stammdaten-Registry (siehe 0063/0064/0065/0066) und gehoert
--     NIEMALS in catalog_status.
--   * P4 v1.1: kein client_id/company_id. Keine kuenstliche User-ID.
--     Keine neuen Rollen. Bestehende RLS-/GRANT-Konvention aus 0060-0066
--     wiederverwendet.
--   * 0060-0066-Pattern: global read-only — SELECT fuer authenticated,
--     service_role-only schreibend, kein GRANT an anon.
--   * 0054-Konvention: Object-Level GRANTs (Lehre 44).
--   * PostgreSQL unterstuetzt KEIN add constraint if not exists fuer
--     Table-Constraints. Diese Migration definiert alle named CHECK-
--     und UNIQUE-Constraints INLINE in CREATE TABLE IF NOT EXISTS, wo
--     sie nur einmal entstehen (idempotent via if not exists).
--
-- Bewusst NICHT in dieser Migration:
--   * Kein client_id, kein company_id.
--   * Kein FK auf client_deadline oder deadline_status_history.
--   * Kein MandantDeadlineService.
--   * Keine Berechnungslogik.
--   * Keine UI-/Page-Aktivierung.
--   * Keine ArbeitsplatzPage-Fristenkarte.
--   * Keine authenticated INSERT/UPDATE/DELETE-Policy.
--   * Keine Trigger, Functions, Materialized Views.
--   * Kein Backfill, kein INSERT INTO, kein UPDATE, kein DELETE FROM.
--   * Keine Aenderung an client_deadline oder deadline_status_history.
--   * Keine Aenderung an dem 0069-Materialisierungs-Trigger oder
--     Guard-Trigger.
--   * Kein audit_log_ref, keine FK auf public.audit_log.
--   * Kein actor_type/actor_kind/system_actor.
--   * Keine Hash-Chain.
--   * Kein Supabase-Apply / kein DB-Zugriff in dieser Sprint-Ausfuehrung.
--   * Keine ELSTER-/ERiC-/UEbermittlungs-Bezuege.
--   * Keine Aenderung an Migrationen 0060-0069 und an deren Tests.
-- ============================================================================

create table if not exists public.deadline_type_catalog (
  id uuid primary key default gen_random_uuid(),

  -- Geschlossene 7-Werte-Wertemenge gemaess P3.4 v1.1, identisch zu
  -- 0067-client_deadline.deadline_type und 0068-deadline_status_history
  -- (history bindet ueber client_deadline indirekt an dieselbe Liste).
  deadline_type text not null,

  -- Geschlossene 3-Werte-Wertemenge. Type-Class-Matrix als eigenes
  -- CHECK weiter unten.
  deadline_class text not null,

  -- Katalog-Lifecycle, KEIN Mandanten-Lifecycle. manual_review_required
  -- gehoert NICHT in diese Wertemenge.
  catalog_status text not null,

  -- Pflicht-Klartext-Beschreibung der Type-Bedeutung (z. B. UEbersetzung
  -- fuer UI, fachliche Anker, gesetzlicher Bezug).
  description text not null,

  -- Provenance: Pflicht-FK auf importierte Source-Version.
  source_id uuid not null
    references public.deadline_source_versions(id) on delete restrict,
  source_version text not null,

  -- Fachliche Gueltigkeits-Spanne (DATE, kein Timestamp). Erlaubt
  -- historische Versionierung pro deadline_type (z. B. neue
  -- Rechtsgrundlage ab 2027).
  gueltig_ab date not null,
  gueltig_bis date null,

  -- Audit-Standard (UTC-Timestamp).
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  -- CHECK A: deadline_type ist exakt eine der 7 P3.4-v1.1-Werte.
  constraint deadline_type_catalog_type_enum check (
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

  -- CHECK B: deadline_class ist exakt eine der 3 P3.4-v1.1-Werte.
  constraint deadline_type_catalog_class_enum check (
    deadline_class in (
      'abgabe',
      'zahlung',
      'nicht_zugeordnet'
    )
  ),

  -- CHECK C: catalog_status ist exakt einer der 3 Lifecycle-Werte.
  -- manual_review_required ist Quality-Marker der Stammdaten-Registry
  -- und gehoert NICHT in diese Wertemenge.
  constraint deadline_type_catalog_status_enum check (
    catalog_status in (
      'active',
      'reserved_blocked',
      'deprecated'
    )
  ),

  -- CHECK D: Type-Class-Matrix exakt. Identisch zu 0067-Mandant-Matrix.
  -- JAHRESABSCHLUSS_ABGABE ist als einzige mit deadline_class=
  -- nicht_zugeordnet verbunden. ZM_ABGABE ist mit deadline_class=abgabe
  -- verbunden (NICHT nicht_zugeordnet).
  constraint deadline_type_catalog_type_class_matrix check (
    (deadline_type = 'USTVA_ABGABE'           and deadline_class = 'abgabe')
    or (deadline_type = 'USTVA_ZAHLUNG'           and deadline_class = 'zahlung')
    or (deadline_type = 'LSTA_ABGABE'             and deadline_class = 'abgabe')
    or (deadline_type = 'LSTA_ZAHLUNG'            and deadline_class = 'zahlung')
    or (deadline_type = 'ZM_ABGABE'               and deadline_class = 'abgabe')
    or (deadline_type = 'EBILANZ_ABGABE'          and deadline_class = 'abgabe')
    or (deadline_type = 'JAHRESABSCHLUSS_ABGABE'  and deadline_class = 'nicht_zugeordnet')
  ),

  -- CHECK E: Reserved-Blocked-Regel. ZM_ABGABE und JAHRESABSCHLUSS_ABGABE
  -- MUESSEN catalog_status=reserved_blocked tragen. Andere Werte koennen
  -- jeden catalog_status haben (typisch active, ggf. spaeter deprecated).
  -- Implikationsform: NOT A OR B.
  constraint deadline_type_catalog_reserved_blocked_rule check (
    deadline_type not in ('ZM_ABGABE', 'JAHRESABSCHLUSS_ABGABE')
    or catalog_status = 'reserved_blocked'
  ),

  -- CHECK F: description Pflicht mit 1-1000 Zeichen.
  constraint deadline_type_catalog_description_length check (
    char_length(description) between 1 and 1000
  ),

  -- CHECK G: source_version Pflicht mit 1-100 Zeichen.
  constraint deadline_type_catalog_source_version_length check (
    char_length(source_version) between 1 and 100
  ),

  -- CHECK H: Gueltigkeits-Range konsistent.
  constraint deadline_type_catalog_gueltigkeit_range check (
    gueltig_bis is null or gueltig_bis >= gueltig_ab
  ),

  -- CONSTRAINT I: Eindeutigkeit pro deadline_type und Gueltigkeits-Start.
  -- Erlaubt historische Versionierung (z. B. USTVA_ABGABE mit
  -- gueltig_ab=2020-01-01 und Nachfolger mit gueltig_ab=2027-01-01),
  -- verhindert aber Duplikate.
  constraint deadline_type_catalog_type_gueltig_uk
    unique (deadline_type, gueltig_ab)
);

-- Lookup-Indizes (alle if not exists, idempotent).
create index if not exists deadline_type_catalog_type_gueltig_idx
  on public.deadline_type_catalog(deadline_type, gueltig_ab);

create index if not exists deadline_type_catalog_status_idx
  on public.deadline_type_catalog(catalog_status);

create index if not exists deadline_type_catalog_source_idx
  on public.deadline_type_catalog(source_id);

alter table public.deadline_type_catalog enable row level security;

-- SELECT: alle authentifizierten Benutzer duerfen lesen (globale
-- Stammdaten — analog 0060-0066). KEIN public.is_company_member-Filter,
-- weil die Tabelle keinen Mandanten-Scope hat.
drop policy if exists deadline_type_catalog_select
  on public.deadline_type_catalog;
create policy deadline_type_catalog_select
  on public.deadline_type_catalog
  for select
  to authenticated
  using (true);

-- KEINE INSERT-Policy fuer authenticated.
-- KEINE UPDATE-Policy fuer authenticated.
-- KEINE DELETE-Policy fuer authenticated.
-- Schreibpfad bleibt service_role-only (Import-Skripte / Migration-
-- Folgesprints). RLS-Default-Deny stellt sicher, dass authentifizierte
-- Benutzer diese Tabelle nicht mutieren koennen.

-- Object-level GRANTs nach 0054-Konvention (Lehre 44 — GRANT und RLS
-- sind orthogonale Schichten). Gruppe-E-Pattern (Read-Only) wie
-- 0060-0066: nur SELECT fuer authenticated, service_role bekommt ALL.
-- Kein GRANT an anon (0052-Konvention).
grant select on public.deadline_type_catalog to authenticated;
grant all on public.deadline_type_catalog to service_role;

comment on table public.deadline_type_catalog is
  'Globale Catalog-Tabelle fuer die sieben P3.4-v1.1-deadline_type-Werte. '
  'Kein client_id, kein company_id. catalog_status ist Katalog-Lifecycle, '
  'KEIN Mandanten-Lifecycle. Reserved-Blocked-Regel ist als CHECK '
  'erzwungen — ZM_ABGABE und JAHRESABSCHLUSS_ABGABE muessen '
  'catalog_status=reserved_blocked tragen. Diese Sperre verhindert '
  'spaeter, dass ein MandantDeadlineService oder ein UI-Pfad reservierte '
  'Typen automatisch erzeugt. RLS-Read fuer authenticated, RLS-Write nur '
  'via service_role. Keine Berechnung, keine Trigger, keine UI-'
  'Aktivierung in dieser Migration.';

comment on column public.deadline_type_catalog.deadline_type is
  'Geschlossene 7-Werte-Wertemenge gemaess P3.4 v1.1. Identisch zu '
  '0067-client_deadline.deadline_type und 0068-deadline_status_history '
  'indirekt ueber die Bindung an client_deadline. Erweiterungen '
  'erfordern eine ausdrueckliche Architekturentscheidung — keine stille '
  'Migration.';

comment on column public.deadline_type_catalog.deadline_class is
  'Geschlossene 3-Werte-Wertemenge: abgabe, zahlung, nicht_zugeordnet. '
  'Type-Class-Matrix in CHECK D erzwungen. JAHRESABSCHLUSS_ABGABE ist '
  'als einzige mit nicht_zugeordnet verbunden. ZM_ABGABE ist mit '
  'abgabe verbunden (nicht nicht_zugeordnet).';

comment on column public.deadline_type_catalog.catalog_status is
  'Katalog-Lifecycle (3 Werte): active, reserved_blocked, deprecated. '
  'KEIN Mandanten-Lifecycle. Der Quality-Marker manual_review_required '
  'aus 0063/0064/0065/0066 gehoert NICHT in diese Wertemenge. '
  'reserved_blocked sperrt automatische Erzeugung durch spaeteren '
  'Service. deprecated markiert abgekuendigte Typen.';

comment on column public.deadline_type_catalog.description is
  'Pflicht-Klartext (1-1000 Zeichen). Fachliche Bedeutung des Type-'
  'Eintrags fuer UI-Anzeige und Service-Lese-Pfad. Keine '
  'Berechnungsquelle.';

comment on column public.deadline_type_catalog.source_id is
  'Pflicht-FK auf public.deadline_source_versions(id) aus 0060. Audit-'
  'Beleg-Pfad: jeder Catalog-Eintrag ist einer importierten Source-'
  'Version zuordenbar.';

comment on column public.deadline_type_catalog.gueltig_ab is
  'Fachliches Kalenderdatum (DATE). UNIQUE-Constraint auf '
  '(deadline_type, gueltig_ab) erlaubt historische Versionierung, '
  'verhindert Duplikate.';
