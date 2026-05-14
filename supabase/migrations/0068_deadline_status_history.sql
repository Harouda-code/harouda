-- ============================================================================
-- harouda-app · Sprint Fristen / P2 v1.1 + P4 v1.1 · deadline_status_history
--
-- Mandantenspezifische append-only History-Tabelle fuer Statuswechsel der
-- Fristen-Schicht. Diese Tabelle haelt jeden Statuswechsel eines
-- public.client_deadline-Eintrags als unveraenderlichen Audit-Trail.
-- Spaeter (P2 v1.1) wird public.client_deadline.status als materialisierte
-- Projektion des jeweils juengsten Eintrags dieser Tabelle gefuehrt — die
-- Materialisierung selbst (Trigger oder Service-Aufruf) ist NICHT Teil
-- dieser Migration.
--
-- Diese Migration ist History-only:
--   * KEINE Aenderung an public.client_deadline.
--   * KEINE client_deadline.status-Spalte.
--   * KEINE Materialisierungs-Mechanik (kein Trigger, keine Function).
--   * KEINE Hash-Chain (additiv aufschiebbar, kein v1-Lock erzwingt sie).
--   * KEINE Verknuepfung zu public.audit_log (audit_log ist
--     owner_id/auth.uid()-scoped, deadline_status_history ist
--     company_id-scoped — die Vermischung ist bewusst aufgeschoben).
--   * KEIN systemischer Actor — nur menschliche Actor in v1.
--   * KEIN Service-Schreibpfad — service_role-only.
--
-- Architektur:
--   * P2 v1.1: Diese Tabelle ist die Quelle der spaeteren Materialisierung
--     in public.client_deadline.status. Sie ist append-only.
--   * P3.4 v1.1: status_from und status_to nutzen die gleiche geschlossene
--     v1-Lifecycle-Wertemenge. manual_review_required ist Quality-Marker
--     der Stammdaten-Registry, NICHT Lifecycle und erscheint hier nicht.
--   * P4 v1.1: changed_by_user_id ist NOT NULL FK auf auth.users(id) —
--     nicht auf public.employees, nicht auf public.user_profiles. KEINE
--     kuenstliche User-ID, KEINE system_user-Konstante,
--     KEINE 00000000-0000-0000-0000-000000000000-Default. Systemische
--     Actor-Repraesentation bleibt offen und kommt in eigener Migration
--     mit Architektur-Begruendung.
--   * 0026-Konvention: RESTRICTIVE client_consistency-Policy mit
--     public.client_belongs_to_company(client_id, company_id) in USING
--     und WITH CHECK. KEIN USING (true).
--   * 0004/0057-Konvention: SELECT-Gate via public.is_company_member
--     (company_id). Kein public.can_read (existiert im Repo nicht).
--   * 0002-Append-Only-Pattern: keine UPDATE/DELETE-Policy fuer
--     authenticated, plus REVOKE UPDATE, DELETE on Tabelle FROM
--     authenticated. service_role behaelt ALL fuer spaetere
--     Service-Schreibpfade.
--   * 0054-Konvention: Object-Level GRANTs (Lehre 44 — GRANT und RLS
--     orthogonale Schichten). Kein GRANT an anon (0052-Konvention).
--
-- v1-Status-Wertemenge (Konversations-Lock, dokumentarisch verankert):
--   * planned          — Frist wurde fuer Mandant/Zeitraum angelegt,
--                        aber noch nicht aktiv bearbeitet.
--   * in_progress      — Bearbeitung laeuft.
--   * not_applicable   — menschlich/auditierbar gesetzte Entscheidung,
--                        dass die Frist fuer diesen Mandant/Zeitraum
--                        fachlich nicht einschlaegig ist.
--   * cancelled        — fachliche Ruecknahme eines irrtuemlichen
--                        Eintrags ohne Delete (append-only).
--
-- Bewusst verboten in 0068 (P4 v1.1 / P3.4 v1.1):
--   * completed, done, erledigt
--   * submitted, uebermittelt
--   * approved, geprueft, freigegeben
--   * overdue (berechneter Zustand aus due_date + now, kein Lifecycle)
--   * GREEN, YELLOW, RED (UI-Ampel, keine Lifecycle-Werte)
--   * manual_review_required (Quality-Marker P3.4, kein Lifecycle)
--   * open, new, closed, pending, review, unknown (Drift-Varianten)
--
-- Bewusst NICHT in dieser Migration:
--   * Keine Aenderung an public.client_deadline.
--   * Keine client_deadline.status-Spalte.
--   * Keine Materialisierungs-Trigger / Function / Materialized View.
--   * Kein audit_log_ref-Feld.
--   * Keine references public.audit_log.
--   * Kein actor_type / actor_kind / system_actor.
--   * Keine Hash-Chain-Spalten (prev_hash, chain_hash, entry_hash).
--   * Kein pg_notify / kein Berechnungs-Aktivierungsanker.
--   * Keine UI-/Page-/Service-Bezuege.
--   * Keine Aenderung an Migrationen 0060-0067.
-- ============================================================================

create table if not exists public.deadline_status_history (
  id uuid primary key default gen_random_uuid(),

  -- Bindung an die Foundation-Tabelle aus 0067.
  client_deadline_id uuid not null
    references public.client_deadline(id) on delete restrict,

  -- Mandantenspezifischer Scope (P4 v1.1). Denormalisiert fuer RLS-
  -- Performance — Konsistenz mit client_deadline_id wird durch die
  -- RESTRICTIVE client_consistency-Policy und Importer-Disziplin
  -- gewahrt.
  company_id uuid not null
    references public.companies(id) on delete restrict,
  client_id uuid not null
    references public.clients(id) on delete restrict,

  -- Statuswechsel als Uebergang. status_from ist NULL beim ersten
  -- History-Eintrag eines client_deadline (kein vorheriger Status).
  -- status_to ist immer der neue Lifecycle-Status. CHECKs schraenken
  -- beide auf die geschlossene v1-Wertemenge ein.
  status_from text null,
  status_to text not null,

  -- Optionale Begruendung (Klartext, max. 1000 Zeichen). Audit-Spur,
  -- keine Berechnungsquelle.
  status_reason text null,

  -- Menschlicher Actor in v1: Pflicht-FK auf auth.users(id). KEIN FK auf
  -- public.employees (Lohn-Stammdaten), KEIN FK auf public.user_profiles
  -- (App-Profile). on delete restrict bewahrt die Audit-Spur, wenn ein
  -- Benutzer-Konto entfernt wird.
  changed_by_user_id uuid not null
    references auth.users(id) on delete restrict,

  -- Zeitpunkt des Statuswechsels (fachlicher Audit-Timestamp).
  changed_at timestamptz not null default now(),

  -- Audit-Standard (Erzeugungs-Timestamp der Zeile).
  created_at timestamptz not null default now(),

  -- CHECK 1: status_to ist exakt eine der 4 v1-Wertemenge.
  constraint deadline_status_history_status_to_enum check (
    status_to in (
      'planned',
      'in_progress',
      'not_applicable',
      'cancelled'
    )
  ),

  -- CHECK 2: status_from ist entweder NULL oder exakt einer der 4
  -- v1-Wertemenge.
  constraint deadline_status_history_status_from_enum check (
    status_from is null or status_from in (
      'planned',
      'in_progress',
      'not_applicable',
      'cancelled'
    )
  ),

  -- CHECK 3: status_reason ist NULL oder hat 1 bis 1000 Zeichen.
  constraint deadline_status_history_reason_length check (
    status_reason is null
    or char_length(status_reason) between 1 and 1000
  )
);

-- Lookup-Indizes (alle if not exists, idempotent).
create index if not exists deadline_status_history_deadline_changed_idx
  on public.deadline_status_history(client_deadline_id, changed_at desc);

create index if not exists deadline_status_history_company_changed_idx
  on public.deadline_status_history(company_id, changed_at desc);

create index if not exists deadline_status_history_actor_changed_idx
  on public.deadline_status_history(changed_by_user_id, changed_at desc);

alter table public.deadline_status_history enable row level security;

-- SELECT: kanzlei-scoped via Repo-Helper public.is_company_member
-- (definiert in 0004 und in 0057 als SECURITY DEFINER neuverankert).
-- Kein public.can_read — dieser Helper existiert im Repo nicht.
drop policy if exists deadline_status_history_select
  on public.deadline_status_history;
create policy deadline_status_history_select
  on public.deadline_status_history
  for select
  to authenticated
  using (public.is_company_member(company_id));

-- RESTRICTIVE Zusatzsicherung: client_id MUSS strukturell zu company_id
-- gehoeren (0026-Konvention). Greift sowohl auf Read als auch auf
-- jedem zukuenftigen Write — auch wenn spaeter ein INSERT-Policy fuer
-- authenticated ergaenzt wird, bleibt die Konsistenzpruefung aktiv.
-- KEIN USING (true) — beide Klauseln pruefen real.
drop policy if exists deadline_status_history_client_consistency
  on public.deadline_status_history;
create policy deadline_status_history_client_consistency
  on public.deadline_status_history
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
-- gelockt ist. Eine spaetere Migration ergaenzt INSERT-Policy nach
-- dem 0026/0004-Pattern (typisch mit public.can_write(company_id) und
-- changed_by_user_id = auth.uid()) — nicht diese.

-- Append-only-Sicherung nach 0002-Pattern: zusaetzlich zur fehlenden
-- UPDATE/DELETE-Policy werden die Default-Privilegien von authenticated
-- explizit zurueckgenommen. So koennen auch zukuenftige permissive
-- Policies, die versehentlich UPDATE/DELETE oeffnen, durch die fehlenden
-- Object-Rechte gestoppt werden. service_role behaelt ALL.
revoke update, delete on public.deadline_status_history from authenticated;

-- Object-level GRANTs nach 0054-Konvention (Lehre 44). Lese-Pfad:
-- SELECT fuer authenticated. Schreib-Pfad: ALL fuer service_role.
-- Kein GRANT an anon (0052-Konvention).
grant select on public.deadline_status_history to authenticated;
grant all on public.deadline_status_history to service_role;

comment on table public.deadline_status_history is
  'Mandantenspezifische append-only History-Tabelle fuer Statuswechsel '
  'der Fristen-Schicht. company_id NOT NULL und client_id NOT NULL '
  'plus client_deadline_id NOT NULL (P4 v1.1). status_from und '
  'status_to nutzen die gleiche geschlossene v1-Lifecycle-Wertemenge: '
  'planned, in_progress, not_applicable, cancelled. Append-only '
  'gesichert durch fehlende UPDATE/DELETE-Policy plus REVOKE UPDATE, '
  'DELETE FROM authenticated. RLS-Read via '
  'public.is_company_member(company_id) plus RESTRICTIVE '
  'client_belongs_to_company. Schreibpfad in 0068 nur via service_role. '
  'Die spaetere Materialisierung in client_deadline.status ist NICHT '
  'Teil dieser Migration.';

comment on column public.deadline_status_history.client_deadline_id is
  'FK auf public.client_deadline(id) aus 0067. on delete restrict — '
  'History-Eintraege werden nicht implizit geloescht, wenn ein '
  'client_deadline-Eintrag entfernt wuerde. Da client_deadline selbst '
  'auf companies/clients mit on delete restrict zeigt, ist die '
  'Loeschkette doppelt geschuetzt.';

comment on column public.deadline_status_history.status_to is
  'Neuer Lifecycle-Status nach diesem History-Eintrag. Geschlossene '
  'v1-Wertemenge (4 Werte): planned, in_progress, not_applicable, '
  'cancelled. Erweiterungen erfordern eine ausdrueckliche '
  'Architekturentscheidung — nicht eine stille Migration.';

comment on column public.deadline_status_history.status_from is
  'Vorheriger Lifecycle-Status. NULL beim ersten History-Eintrag eines '
  'client_deadline (kein vorheriger Status). Sonst exakt einer der 4 '
  'v1-Werte. CHECK erzwingt Geschlossenheit der Wertemenge.';

comment on column public.deadline_status_history.status_reason is
  'Optionale Klartext-Begruendung des Statuswechsels (1 bis 1000 '
  'Zeichen). Audit-Spur, keine Berechnungsquelle. Insbesondere '
  'KEIN Lifecycle-Statuswert und KEIN Quality-Marker.';

comment on column public.deadline_status_history.changed_by_user_id is
  'Menschlicher Actor des Statuswechsels. FK auf auth.users(id) — '
  'NICHT auf public.employees, NICHT auf public.user_profiles. NOT NULL '
  'in v1: jeder Statuswechsel wird einer menschlichen Identitaet '
  'zugeordnet. Systemische Actor-Repraesentation (z. B. fuer initiale '
  'Service-Erzeugung) bleibt offen und wird in eigener Migration mit '
  'Architektur-Begruendung gelockt.';

comment on column public.deadline_status_history.changed_at is
  'Zeitpunkt des Statuswechsels (UTC-Timestamp). Default now() — der '
  'Service oder ein zukuenftiger Schreibpfad darf einen abweichenden '
  'changed_at setzen, wenn historische Eintraege rekonstruiert werden.';
