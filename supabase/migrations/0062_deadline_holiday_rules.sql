-- ============================================================================
-- harouda-app · Sprint Fristen / P3.2 + P3.4 · Feiertagsregel-Registry (global)
--
-- Globale, kanzleiuebergreifende Stammdaten-Tabelle fuer Feiertagsregeln
-- (Bundesweit, Landesweit, Gemeinde-/Stadt-spezifisch, Sonderfall). Diese
-- Tabelle ist NICHT mandantenspezifisch und traegt KEIN client_id-Feld;
-- ebenfalls KEIN company_id-Feld. Alle Kanzleien teilen denselben
-- Feiertagsregel-Katalog.
--
-- Zweck:
--   Reiner Regel-Katalog fuer spaetere Frist-Berechnung. Jeder Datensatz
--   beschreibt eine Feiertagsregel (z. B. "Karfreitag bundesweit",
--   "Allerheiligen in DE-NW"), mit eindeutigem holiday_key, scope_type,
--   date_rule-Typ, Katalogstatus, Provenance-Verweis auf die Source-
--   Versions-Registry und fachliche Gueltigkeits-Spanne. Aenderungen
--   am Regelbestand (Neueinfuehrung, Aufhebung, Umordnung) werden ueber
--   gueltig_ab / gueltig_bis und catalog_status abgebildet.
--
-- Architektur:
--   * KEIN client_id, KEIN company_id (globales Stammdatum aus P3.2).
--   * scope_type beschreibt nur die fachliche Ebene der Regel; es
--     ersetzt KEINE Feiertagsanwendung pro AGS. scope_type-Werte
--     'gemeinde', 'stadt' und 'sonderfall' werden spaeter ausschliesslich
--     ueber AGS-Anwendungstabellen (separater Sprint) aktiviert.
--   * catalog_status ist KATALOGSTATUS und strikt getrennt von einem
--     Workflow-/Review-Marker wie 'manual_review_required'. Letzterer
--     gehoert in spaeter modellierte Workflow-/Audit-Schichten und darf
--     hier NICHT als Katalogstatus verwendet werden.
--   * date_rule beschreibt ausschliesslich den REGELTYP (relative zum
--     Osterdatum / explizites Kalenderdatum / rule_versioned_special_case).
--     Keine Berechnungsfunktion wird in dieser Migration aktiviert.
--   * source_id ist Pflicht. Eintraege aus deadline_source_versions mit
--     source_kind='validation_reference' duerfen jedoch NICHT als tragende
--     Quelle einer Feiertagsregel dienen — sie sind Validierungs-/
--     Referenzquellen, nicht authoritative Quelle. Diese Einschraenkung
--     wird hier dokumentarisch verankert und in der spaeteren Import-/
--     Validierungs-Schicht durchgesetzt (kein DB-Trigger in diesem Sprint).
--   * gueltig_ab / gueltig_bis sind fachliche Kalenderdaten (DATE),
--     keine UTC-Timestamps.
--   * created_at / updated_at sind UTC-Timestamps (Audit-Standard).
--   * RLS-Read: alle authentifizierten Benutzer.
--   * RLS-Write: KEINE Policy fuer authenticated → nur service_role
--     kann schreiben (Imports laufen per Backend-Skript).
--   * GRANTs explizit (Lehre 44 aus Migration 0054: GRANT und RLS sind
--     orthogonale Schichten).
--
-- Bewusst NICHT in diesem Sprint:
--   * Keine Feiertagsanwendung pro AGS / Gemeinde / Stadt.
--   * Keine Berechnungsfunktion / kein Frist-Rollover.
--   * Keine Finanzamt-/Finanzkassen-Tabelle.
--   * Kein client_deadline / deadline_status_history.
--   * Keine Trigger, keine Functions, keine Materialized Views.
--   * Keine UI-/ArbeitsplatzPage-/DeadlinesPage-Aenderung.
-- ============================================================================

create table if not exists public.deadline_holiday_rules (
  id uuid primary key default gen_random_uuid(),

  -- Technisch stabiler Identifier der Regel (lower snake case, z. B.
  -- 'karfreitag_bundesweit', 'allerheiligen_de_nw', 'reformationstag_2017').
  holiday_key text not null
    check (
      char_length(holiday_key) between 1 and 100
      and holiday_key ~ '^[a-z][a-z0-9_]*$'
    ),

  -- Klartext-Bezeichnung der Regel.
  holiday_name text not null
    check (char_length(holiday_name) between 1 and 200),

  -- Fachliche Ebene der Regel (geschlossene Wertemenge, 5 Werte).
  -- 'gemeinde'/'stadt'/'sonderfall' werden spaeter ueber AGS-Anwendungs-
  -- tabellen wirksam — nicht durch diese Migration.
  scope_type text not null check (
    scope_type in (
      'bundesweit',
      'landesweit',
      'gemeinde',
      'stadt',
      'sonderfall'
    )
  ),

  -- Regeltyp (geschlossene Wertemenge, 3 Werte). Keine Berechnung wird
  -- in dieser Migration aktiviert; date_rule beschreibt nur den Typ.
  date_rule text not null check (
    date_rule in (
      'relative_to_easter',
      'explicit_calendar_date',
      'rule_versioned_special_case'
    )
  ),

  -- Katalogstatus (geschlossene Wertemenge, 3 Werte). Strikt getrennt
  -- von Workflow-/Review-Markern wie 'manual_review_required' — letztere
  -- gehoeren in spaetere Workflow-Schichten.
  catalog_status text not null check (
    catalog_status in (
      'active',
      'reserved_blocked',
      'deprecated'
    )
  ),

  -- Optionales Bundesland im ISO 3166-2:DE-Format (z. B. 'DE-BY').
  -- NULL fuer bundesweit gueltige Regeln; Pflicht-Format-Check, wenn
  -- gesetzt. Konsistenz mit scope_type wird in der Import-/Validierungs-
  -- Schicht spaeter geprueft (kein DB-Trigger hier).
  bundesland text null
    check (bundesland is null or bundesland ~ '^DE-[A-Z]{2}$'),

  -- Rechtliche Quelle als kurzer Kennzeichner (z. B. '§ 2 FTG NRW',
  -- '§ 1 GG-DD', 'Sonderfall-Beschluss 2017'). Reine Beleg-Information.
  source_rule text not null
    check (char_length(source_rule) between 1 and 200),

  -- Provenance: Pflicht-FK auf importierte Source-Version.
  source_id uuid not null
    references public.deadline_source_versions(id) on delete restrict,
  source_version text not null
    check (char_length(source_version) between 1 and 100),

  -- Fachliche Gueltigkeits-Spanne als Kalenderdatum (DATE, kein
  -- Timestamp). NULL in gueltig_bis bedeutet "weiterhin gueltig".
  gueltig_ab date not null,
  gueltig_bis date null,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  -- Konsistenz: gueltig_bis nicht vor gueltig_ab.
  constraint deadline_holiday_rules_gueltigkeit_range check (
    gueltig_bis is null or gueltig_bis >= gueltig_ab
  )
);

-- Lookup-Indizes fuer typische Abfragen.
create index if not exists deadline_holiday_rules_key_gueltig_idx
  on public.deadline_holiday_rules(holiday_key, gueltig_ab);

create index if not exists deadline_holiday_rules_scope_idx
  on public.deadline_holiday_rules(scope_type);

create index if not exists deadline_holiday_rules_status_idx
  on public.deadline_holiday_rules(catalog_status);

create index if not exists deadline_holiday_rules_bundesland_idx
  on public.deadline_holiday_rules(bundesland)
  where bundesland is not null;

create index if not exists deadline_holiday_rules_source_idx
  on public.deadline_holiday_rules(source_id);

alter table public.deadline_holiday_rules enable row level security;

-- SELECT: alle authentifizierten Benutzer duerfen lesen (globale Stammdaten).
drop policy if exists deadline_holiday_rules_select
  on public.deadline_holiday_rules;
create policy deadline_holiday_rules_select
  on public.deadline_holiday_rules
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
grant select on public.deadline_holiday_rules to authenticated;
grant all on public.deadline_holiday_rules to service_role;

comment on table public.deadline_holiday_rules is
  'Globale Feiertagsregel-Registry. Kein client_id, kein company_id. '
  'scope_type beschreibt fachliche Ebene der Regel und ersetzt keine '
  'Feiertagsanwendung pro AGS. catalog_status ist strikt vom Workflow-'
  'Marker manual_review_required getrennt. RLS-Read fuer authenticated, '
  'RLS-Write nur via service_role.';

comment on column public.deadline_holiday_rules.holiday_key is
  'Technisch stabiler Identifier (lower snake case). Bleibt ueber '
  'Gueltigkeits-Spannen hinweg stabil; bei substanzieller Aenderung '
  'wird ein neuer Schluessel vergeben und der alte deprecated.';

comment on column public.deadline_holiday_rules.scope_type is
  'Geschlossene Wertemenge (5): bundesweit, landesweit, gemeinde, '
  'stadt, sonderfall. gemeinde/stadt/sonderfall werden spaeter ueber '
  'AGS-Anwendungstabellen wirksam — nicht durch diese Migration.';

comment on column public.deadline_holiday_rules.date_rule is
  'Regeltyp (3 Werte). Keine Berechnungsfunktion wird in dieser '
  'Migration aktiviert; date_rule beschreibt nur den Typ.';

comment on column public.deadline_holiday_rules.catalog_status is
  'Katalogstatus (3 Werte: active, reserved_blocked, deprecated). '
  'Strikt getrennt von Workflow-/Review-Markern. manual_review_required '
  'gehoert NICHT in den Katalogstatus.';

comment on column public.deadline_holiday_rules.source_id is
  'Pflicht-FK auf public.deadline_source_versions(id). Eintraege mit '
  'source_kind=validation_reference duerfen NICHT als tragende Quelle '
  'einer Feiertagsregel dienen — Durchsetzung erfolgt in der spaeteren '
  'Import-/Validierungs-Schicht.';
