-- ============================================================================
-- harouda-app · Sprint Fristen / P3.4 v1.1 · source_kind-Erweiterung um
-- 'bundesgesetz'.
--
-- Diese Migration erweitert ausschliesslich die geschlossene Wertemenge
-- von public.deadline_source_versions.source_kind um den neuen Wert
-- 'bundesgesetz'. Sie aendert KEINE Tabelle anders als per
-- Constraint-Drop+Add, KEINE Daten, KEINE Policy, KEINEN Trigger,
-- KEINE Function ausser einem anonymen DO-Block zur
-- Constraint-Ermittlung.
--
-- Hintergrund:
--   * Die 7 v1-deadline_type-Werte in 0070 (USTVA_ABGABE, USTVA_ZAHLUNG,
--     LSTA_ABGABE, LSTA_ZAHLUNG, ZM_ABGABE, EBILANZ_ABGABE,
--     JAHRESABSCHLUSS_ABGABE) haben als Rechtsgrundlage Bundesgesetze
--     (UStG, EStG, HGB, AO).
--   * Der in 0060 definierte source_kind-Wert 'verordnung' bezeichnet
--     Rechtsverordnungen (Art. 80 GG), nicht formelle Bundesgesetze.
--     Eine Typisierung von UStG, EStG, HGB, AO als 'verordnung' waere
--     semantisch falsch.
--   * Die Werte 'manuell' und 'validation_reference' duerfen laut
--     0060-Header NIE alleinige tragende Source of Truth sein und
--     scheiden damit fuer Catalog-Provenance aus.
--   * Daher: neuer Wert 'bundesgesetz' fuer formelle Bundesgesetze
--     (UStG, EStG, HGB, AO).
--
-- Architektur-Disziplin:
--   * 'bundesgesetz' wird ADDITIV zur bestehenden Wertemenge ergaenzt.
--   * Keine Umbenennung von 'verordnung' (Bestand bleibt erhalten).
--   * Keine Umbenennung oder Entfernung anderer Werte.
--   * 'manuell' und 'validation_reference' bleiben in der Wertemenge,
--     duerfen aber weiterhin nicht als alleinige tragende Source of
--     Truth verwendet werden — diese Disziplin bleibt durch die
--     0060-Header-Konvention dokumentarisch verankert.
--   * PostgreSQL unterstuetzt ADD CONSTRAINT IF NOT EXISTS nicht; das
--     Anti-Pattern wird konsequent vermieden.
--
-- Pattern-Wahl (vgl. 0006-DO-Block-Pattern):
--   * Der urspruengliche CHECK in 0060 ist column-level und unnamed.
--     Der Auto-Name ist nach Postgres-Konvention typischerweise
--     'deadline_source_versions_source_kind_check', kann aber
--     theoretisch abweichen.
--   * Diese Migration verwendet einen anonymen DO-Block, der via
--     pg_constraint introspectiv den existierenden source_kind-CHECK
--     auf der Tabelle ermittelt und droppt — robust gegen
--     Auto-Name-Variationen. pg_constraint ist die kanonische
--     Postgres-Quelle fuer Constraint-Metadaten; sie liefert per
--     pg_get_constraintdef die Definition zur eindeutigen
--     source_kind-Identifikation.
--   * Anschliessend wird ein klar BENANNTER neuer Constraint
--     'deadline_source_versions_source_kind_enum' angelegt. Spaetere
--     Erweiterungen koennen dann den named constraint direkt
--     adressieren.
--
-- Idempotenz:
--   * Auf erster Migration: DO-Block droppt den unnamed Original-CHECK.
--   * Auf jeder weiteren Ausfuehrung: DO-Block schliesst den
--     Ziel-Namen aus und findet keinen abweichenden Constraint mehr,
--     ist also no-op.
--   * DROP CONSTRAINT IF EXISTS auf den named Constraint laeuft
--     idempotent.
--   * ADD CONSTRAINT laeuft erneut, weil zuvor gedroppt.
--
-- Bewusst NICHT in dieser Migration:
--   * KEINE Initialdaten / KEIN INSERT / UPDATE / DELETE.
--   * KEIN Touch auf public.deadline_type_catalog (kommt in 0072).
--   * KEINE deadline_source_versions-Zeilen (kommt in 0072).
--   * KEINE Aenderung an public.client_deadline,
--     public.deadline_status_history, public.deadline_type_catalog.
--   * KEINE Aenderung an 0060-0070 oder deren Tests.
--   * KEINE RLS-/GRANT-/Policy-Aenderung.
--   * KEIN Trigger, KEINE Function ausser dem anonymen DO-Block.
--   * KEINE Materialized View.
--   * KEIN Service-/UI-/Berechnungscode.
--   * KEIN ELSTER- oder ERiC-Bezug.
--   * KEIN Supabase-Apply / KEIN DB-Zugriff in dieser Ausfuehrung.
--   * KEIN weiterer source_kind-Wert (rechtsverordnung,
--     verwaltungsvorschrift, amtliche_portalquelle bleiben v2-fragen).
-- ============================================================================

-- 1) Existierenden unnamed source_kind-CHECK auf der Tabelle
-- ermitteln und droppen. Die WHERE-Klausel schliesst den Ziel-Namen
-- aus, damit der DO-Block auf erneutem Lauf no-op ist. Der Body
-- enthaelt KEIN INSERT/UPDATE/DELETE — nur Schema-Introspektion und
-- ein dynamisches ALTER TABLE DROP CONSTRAINT.
do $$
declare
  v_old_constraint_name text;
begin
  select c.conname into v_old_constraint_name
  from pg_constraint c
  join pg_class t on t.oid = c.conrelid
  join pg_namespace n on n.oid = t.relnamespace
  where n.nspname = 'public'
    and t.relname = 'deadline_source_versions'
    and c.contype = 'c'
    and pg_get_constraintdef(c.oid) ilike '%source_kind%in%'
    and c.conname <> 'deadline_source_versions_source_kind_enum'
  limit 1;

  if v_old_constraint_name is not null then
    execute format(
      'alter table public.deadline_source_versions drop constraint %I',
      v_old_constraint_name
    );
  end if;
end $$;

-- 2) Idempotenter Drop des Ziel-Namens. Auf erstem Lauf no-op, auf
-- jedem weiteren Lauf droppt er den vorhergehend benannten Constraint
-- vor dem Re-Add.
alter table public.deadline_source_versions
  drop constraint if exists deadline_source_versions_source_kind_enum;

-- 3) Neuer benannter Constraint mit erweiterten 9 Werten. Reihenfolge
-- der Originalwerte aus 0060 erhalten, 'bundesgesetz' als 9. Wert
-- additiv. KEIN ADD CONSTRAINT IF NOT EXISTS (PostgreSQL-Anti-Pattern).
alter table public.deadline_source_versions
  add constraint deadline_source_versions_source_kind_enum
  check (
    source_kind in (
      'gemfa',
      'destatis_gv_isys',
      'landesgesetz',
      'landesstatistik',
      'stadtsatzung',
      'verordnung',
      'manuell',
      'validation_reference',
      'bundesgesetz'
    )
  );

comment on column public.deadline_source_versions.source_kind is
  'Art der Quelle - geschlossene Wertemenge nach 0060 plus 0071. '
  'Erlaubte Werte (9): gemfa, destatis_gv_isys, landesgesetz, '
  'landesstatistik, stadtsatzung, verordnung, manuell, '
  'validation_reference, bundesgesetz. bundesgesetz bezeichnet '
  'formelle Bundesgesetze (UStG, EStG, HGB, AO) und ist semantisch '
  'streng von verordnung (Rechtsverordnung Art. 80 GG) zu trennen. '
  'manuell und validation_reference duerfen nach 0060-Header NIE '
  'alleinige tragende Source of Truth sein. Der neu benannte '
  'Constraint heisst deadline_source_versions_source_kind_enum.';
