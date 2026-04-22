-- ============================================================================
-- harouda-app · Skalierungs-Readiness
--
-- Diese Migration ist bewusst KEINE Infrastruktur-Änderung (das meiste liegt
-- im Supabase-Dashboard oder bei der Auswahl des Tarifs), sondern ergänzt
-- Performance-Indizes und dokumentiert die empfohlene Konfiguration.
--
-- Was in Supabase-Dashboard gesetzt werden muss (nicht in SQL):
--
--   1. Connection Pooling: Supavisor ist in allen Projekten aktiv. Anwendungen
--      mit hoher Schreiblast sollten den "Transaction Mode" (Port 6543) statt
--      der Session-Variante (Port 5432) nutzen. Für diese App genügt die
--      PostgREST-Schicht (auto-pooled).
--
--   2. Point-In-Time-Recovery (PITR): ab dem Pro-Tarif verfügbar. PITR im
--      Projekt aktivieren, damit Backups pro Minute feingranular zurückspielbar
--      sind.
--
--   3. Read Replicas: im Enterprise-Tarif optional. Für das Prüfer-Dashboard
--      und die Reports-Seiten wäre ein Read-Only-Endpunkt ideal, ist aber für
--      kleine/mittlere Kanzleien nicht notwendig.
--
--   4. Partitionierung: journal_entries nach company_id zu partitionieren ist
--      technisch möglich, aber erst ab ~10 Mio. Zeilen pro Tabelle wirtschaftlich.
--      Bis dahin reichen B-Tree-Indizes auf (company_id, datum).
--
--   5. Monitoring: Supabase "Database → Reports" zeigt Slow Queries. Externe
--      Alerts über PostgREST-Status-Endpunkt + Uptime-Robot.
-- ============================================================================

-- --- Zusätzliche Indizes für häufige Filter ------------------------------

create index if not exists journal_company_storno_idx
  on public.journal_entries(company_id, storno_status)
  where storno_status <> 'active';

create index if not exists journal_company_locked_idx
  on public.journal_entries(company_id, locked_at);

create index if not exists journal_company_parent_idx
  on public.journal_entries(company_id, parent_entry_id)
  where parent_entry_id is not null;

-- Audit-Log: Häufige Filterkombinationen (action + entity)
create index if not exists audit_company_action_idx
  on public.audit_log(company_id, action);

-- Company Members: häufig für Permission-Checks
create index if not exists company_members_role_idx
  on public.company_members(company_id, role);

-- --- Table-Comments zur Dokumentation im DB-Client -----------------------

comment on table public.journal_entries is
  'Append-only Journal. Änderungen nur über Storno (siehe Trigger trg_journal_protect_update). Index auf (company_id, datum) für gängige Filter.';

comment on table public.audit_log is
  'WORM (Write-Once-Read-Many). Triggers trg_audit_protect_* verhindern UPDATE/DELETE. Hash-Kette pro company_id.';

comment on table public.company_members is
  'Mitgliedschaft + Rolle. Prüferzugänge können über access_valid_until befristet werden (Migration 0007).';

-- ============================================================================
-- Health-Check-View: leichtgewichtige Sicht, die die App pingen kann, ohne
-- einen Aggregats-Scan auf einer großen Tabelle auszulösen.
-- ============================================================================

create or replace view public.health_check as
  select
    now() as server_time,
    current_database() as database,
    version() as postgres_version;

-- Die View ist bewusst ohne RLS, damit auch anonyme Clients einen Ping
-- auslösen können. Falls das Projekt anonym-lesen ganz verbietet, kommentiert
-- man die grant-Zeile aus.
grant select on public.health_check to anon, authenticated;

-- ============================================================================
