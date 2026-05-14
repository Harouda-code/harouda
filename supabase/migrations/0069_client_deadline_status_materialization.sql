-- ============================================================================
-- harouda-app · Sprint Fristen / P2 v1.1 + P4 v1.1 · client_deadline.status
-- Materialisierungs-Bridge.
--
-- Bridge zwischen public.deadline_status_history (0068) und
-- public.client_deadline (0067). Diese Migration:
--   1. Fuegt public.client_deadline.status als nullable Projection-
--      Spalte mit geschlossenem v1-CHECK hinzu.
--   2. Materialisiert den juengsten History-Eintrag durch AFTER-INSERT-
--      Trigger auf public.deadline_status_history.
--   3. Schuetzt die Projection vor direkten Updates durch BEFORE-UPDATE-
--      OF-status-Guard auf public.client_deadline mit pg_trigger_depth-
--      Mechanismus.
--
-- Architektur:
--   * P2 v1.1: client_deadline.status ist materialisierte Projektion von
--     deadline_status_history.status_to. status darf NIE unabhaengig von
--     History geaendert werden. Beide Richtungen werden in 0069
--     DB-seitig erzwungen — Materialisierungs-Trigger schliesst die
--     Vorwaerts-Richtung (History -> Projection), Guard-Trigger
--     schliesst die Rueck-Richtung (kein direkter UPDATE).
--   * P3.4 v1.1: gelockte v1-Wertemenge planned/in_progress/
--     not_applicable/cancelled. Identisch zur 0068-status_to-Wertemenge.
--     Verbotene Werte (completed, submitted, approved, overdue,
--     manual_review_required und UI-Ampel-Werte sowie Drift-Varianten)
--     sind via CHECK und Negativ-Stichproben ausgeschlossen.
--   * P4 v1.1: KEIN completed-Pfad. Keine kuenstliche User-ID. Keine
--     neuen Rollen. Bestehende RLS aus 0067/0068 bleibt unveraendert.
--   * Repo-Konvention 0057/0058: SECURITY DEFINER mit gepinntem
--     search_path fuer Trigger-Funktionen.
--   * Repo-Konvention 0021/0032/0033/0034/0040/0041: drop constraint
--     if exists + add constraint fuer idempotente CHECK-Constraints.
--     PostgreSQL unterstuetzt KEIN add constraint if not exists — der
--     Versuch waere ein Syntaxfehler.
--   * Repo-Konvention architecture-governance.md Abschnitt 3:
--     Constraints, Audit und Materialisierungs-Invarianten gehoeren in
--     die Datenbank.
--
-- Guard-Mechanismus:
--   * pg_trigger_depth() = 1 erkennt eindeutig den direkten Top-Level-
--     UPDATE-Pfad. Beim direkten Aufruf eines UPDATE auf
--     public.client_deadline.status feuert der BEFORE-UPDATE-Trigger
--     mit pg_trigger_depth() = 1 und die Bedingung blockt mit
--     RAISE EXCEPTION.
--   * Beim verschachtelten Aufruf aus dem Materialisierungs-Trigger
--     heraus feuert der Guard mit pg_trigger_depth() > 1 (mindestens
--     der aeussere History-Trigger sitzt darueber); die Bedingung greift
--     nicht und der UPDATE wird durchgelassen.
--
-- Bewusst NICHT in dieser Migration:
--   * Kein Backfill bestehender client_deadline-Zeilen. status bleibt
--     NULL, bis fuer den jeweiligen client_deadline eine History-Zeile
--     entsteht. Backfill, falls je noetig, ist eigener Sprint nach
--     DB-Apply.
--   * Keine RLS-/GRANT-/REVOKE-/Policy-Aenderung. Bestehende Policies
--     aus 0067 (client_deadline) und 0068 (deadline_status_history)
--     bleiben unveraendert in Kraft.
--   * Kein Service-Code (MandantDeadlineService bleibt offen).
--   * Keine UI-/Page-Aktivierung.
--   * Keine Status-Transition-Validierung im Guard
--     (cancelled->planned bleibt strukturell erlaubt — Disziplin lebt
--     im Service).
--   * Keine ELSTER-/ERiC-Bezuege.
--   * Keine Hash-Chain.
--   * Kein audit_log_ref.
--   * Keine FK auf public.audit_log.
--   * Kein systemischer Actor.
--   * Keine Aenderung an Migrationen 0060-0068 und an deren Tests.
-- ============================================================================

-- 1) status-Spalte additiv hinzufuegen (idempotent).
alter table public.client_deadline
  add column if not exists status text null;

-- 2) CHECK-Constraint idempotent neu definieren. PostgreSQL
-- unterstuetzt KEIN add constraint if not exists fuer CHECK-Constraints
-- — daher drop-if-exists + add nach 0021/0032/0033/0034/0040/0041-
-- Konvention. NULL ist explizit erlaubt fuer Bestand und neu erzeugte
-- Zeilen ohne History.
alter table public.client_deadline
  drop constraint if exists client_deadline_status_enum;
alter table public.client_deadline
  add constraint client_deadline_status_enum
  check (
    status is null
    or status in (
      'planned',
      'in_progress',
      'not_applicable',
      'cancelled'
    )
  );

-- 3) Materialisierungs-Funktion: setzt client_deadline.status aus dem
-- neu eingefuegten deadline_status_history-Eintrag. Beruehrt
-- AUSSCHLIESSLICH die Spalten status und updated_at; keine anderen
-- Tabellen-Spalten, keine anderen Tabellen, keine Berechnung, kein
-- Notify. SECURITY DEFINER mit gepinntem search_path nach 0057/0058-
-- Konvention.
create or replace function public.deadline_status_history_materialize()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
begin
  update public.client_deadline
     set status = new.status_to,
         updated_at = now()
   where id = new.client_deadline_id;
  return new;
end;
$$;

-- 4) Materialisierungs-Trigger: feuert NUR nach INSERT in
-- deadline_status_history. Append-only-Disziplin aus 0068 garantiert,
-- dass UPDATE/DELETE auf History nicht stattfinden — ein UPDATE- oder
-- DELETE-Trigger waere toter Code.
drop trigger if exists deadline_status_history_materialize_aiur
  on public.deadline_status_history;
create trigger deadline_status_history_materialize_aiur
  after insert on public.deadline_status_history
  for each row
  execute function public.deadline_status_history_materialize();

-- 5) Guard-Funktion: blockiert direkte UPDATE-Statements auf
-- client_deadline.status. pg_trigger_depth() = 1 erkennt den direkten
-- Top-Level-Aufrufpfad; aus dem Materialisierungs-Trigger heraus hat
-- dieser Guard pg_trigger_depth() > 1 und laesst den UPDATE durch.
-- Die Bedingung loest die Ausnahme NUR bei tatsaechlicher Status-
-- Aenderung (IS DISTINCT FROM) aus — UPDATEs, die status nicht
-- aendern, bleiben moeglich. Keine Status-Transition-Validierung im
-- Body — die Disziplin (z. B. cancelled als Endzustand) lebt im
-- spaeteren Service.
create or replace function public.client_deadline_protect_status()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
begin
  if new.status is distinct from old.status
     and pg_trigger_depth() = 1 then
    raise exception 'client_deadline.status must not be modified outside of deadline_status_history materialization (P2 v1.1)';
  end if;
  return new;
end;
$$;

-- 6) Guard-Trigger: BEFORE UPDATE OF status. Feuert NUR, wenn der
-- UPDATE-Statement die status-Spalte adressiert. Andere UPDATEs auf
-- public.client_deadline bleiben unberuehrt.
drop trigger if exists client_deadline_protect_status_bu
  on public.client_deadline;
create trigger client_deadline_protect_status_bu
  before update of status on public.client_deadline
  for each row
  execute function public.client_deadline_protect_status();

comment on column public.client_deadline.status is
  'Materialisierte Projektion des juengsten public.deadline_status_history'
  '.status_to-Eintrags fuer diesen client_deadline. Geschlossene '
  'v1-Wertemenge: planned, in_progress, not_applicable, cancelled. Wird '
  'durch AFTER-INSERT-Trigger auf public.deadline_status_history '
  'automatisch gesetzt. Direkte Aenderungen sind durch '
  'BEFORE-UPDATE-OF-status-Guard blockiert (P2 v1.1). Bei Bestandszeilen '
  'ohne History bleibt status NULL (kein Backfill in 0069).';
