-- ============================================================================
-- harouda-app · Sprint 16 · bank_reconciliation_matches
--
-- GoBD Rz. 45 (Vollstaendigkeit): persistiert das Matching zwischen
-- Bank-Transaktionen und Journal-Einträgen. Loest die Offenheit aus
-- docs/TECH-DEBT-BANK-RECONCILIATION-PERSISTENZ.md (CLOSED via Sprint 16).
--
-- Scope:
--   • Neue Tabelle `bank_reconciliation_matches` mit Fingerprint-Spalte
--     (weil `bank_transactions`-Tabelle nicht existiert — Bank-Tx liegen
--     nur in der Session, parseBankFile-Output).
--   • `company_id`-basierte RLS-Policies analog Migration 0004
--     (`is_company_member` / `can_write`) + RESTRICTIVE-Policy fuer
--     `client_id`-Konsistenz analog Migration 0026.
--   • `tg_set_updated_at`-Trigger fuer updated_at-Spalte
--     (Funktion aus 0004 wiederverwendet).
--
-- Nicht-Ziele:
--   • Keine Festschreibung der Match-Records (sie sind Meta-Daten, keine
--     Buchungen).
--   • Keine Erweiterung von `journal_entries` oder `clients`.
-- ============================================================================

create table if not exists public.bank_reconciliation_matches (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  client_id uuid not null references public.clients(id) on delete restrict,
  -- Session-Bank-Tx-Referenz (UUID, wird pro Row von der UI vergeben).
  bank_transaction_id uuid not null,
  -- Hash aus (datum, betrag, vwz, iban_gegenkonto) — ersetzt FK-Verweis,
  -- weil `bank_transactions`-Tabelle nicht existiert.
  bank_transaction_fingerprint text not null,
  journal_entry_id uuid null references public.journal_entries(id)
    on delete restrict,
  match_status text not null check (match_status in (
    'matched',         -- manuell zugeordnet
    'ignored',         -- bewusst uebersprungen
    'pending_review',  -- manuell markiert
    'auto_matched'     -- vom Algorithmus + User-Zustimmung
  )),
  match_confidence numeric(3,2) null check (
    match_confidence is null
    or (match_confidence >= 0 and match_confidence <= 1)
  ),
  matched_at timestamptz not null default now(),
  matched_by_user_id uuid null,
  notiz text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (client_id, bank_transaction_fingerprint)
);

comment on table public.bank_reconciliation_matches is
  'GoBD-Rz.-45 Bank-Journal-Matching-Log. Sprint 16. Nicht Teil der Festschreibung — reines Reconciliation-Artefakt.';

comment on column public.bank_reconciliation_matches.bank_transaction_fingerprint is
  'SHA-256 Hex oder base64url ueber (datum|betrag|vwz|iban_gegenkonto). Ersetzt FK auf nicht-existierende bank_transactions-Tabelle.';

comment on column public.bank_reconciliation_matches.match_status is
  'matched = User-manuell; auto_matched = Algorithmus + User-Bestätigung; ignored = bewusst übergangen; pending_review = manuell markiert.';

-- --- Indizes ----------------------------------------------------------------

create index if not exists bank_recon_matches_company_client_idx
  on public.bank_reconciliation_matches(company_id, client_id);

create index if not exists bank_recon_matches_status_idx
  on public.bank_reconciliation_matches(client_id, match_status);

create index if not exists bank_recon_matches_journal_idx
  on public.bank_reconciliation_matches(journal_entry_id);

-- --- RLS --------------------------------------------------------------------

alter table public.bank_reconciliation_matches enable row level security;

drop policy if exists bank_recon_matches_select
  on public.bank_reconciliation_matches;
create policy bank_recon_matches_select
  on public.bank_reconciliation_matches
  for select using (public.is_company_member(company_id));

drop policy if exists bank_recon_matches_insert
  on public.bank_reconciliation_matches;
create policy bank_recon_matches_insert
  on public.bank_reconciliation_matches
  for insert with check (public.can_write(company_id));

drop policy if exists bank_recon_matches_update
  on public.bank_reconciliation_matches;
create policy bank_recon_matches_update
  on public.bank_reconciliation_matches
  for update
  using (public.can_write(company_id))
  with check (public.can_write(company_id));

drop policy if exists bank_recon_matches_delete
  on public.bank_reconciliation_matches;
create policy bank_recon_matches_delete
  on public.bank_reconciliation_matches
  for delete using (public.can_write(company_id));

-- RESTRICTIVE-Policy: client_id muss tatsaechlich zur company_id gehoeren
-- (Pattern aus Migration 0026).
drop policy if exists bank_recon_matches_client_consistency
  on public.bank_reconciliation_matches;
create policy bank_recon_matches_client_consistency
  on public.bank_reconciliation_matches
  as restrictive for all
  using (true)
  with check (public.client_belongs_to_company(client_id, company_id));

-- --- updated_at-Trigger -----------------------------------------------------

drop trigger if exists bank_recon_matches_set_updated_at
  on public.bank_reconciliation_matches;
create trigger bank_recon_matches_set_updated_at
  before update on public.bank_reconciliation_matches
  for each row
  execute function public.tg_set_updated_at();
