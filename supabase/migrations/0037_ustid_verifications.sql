-- ============================================================================
-- harouda-app · Sprint 19.A · ustid_verifications (VIES-Log, WORM)
--
-- Persistentes Log aller VIES-Abfragen (§ 18e UStG Nachweispflicht).
-- Schreibt Raw-Response (bytea) + extrahierte Felder; das Raw-Feld ist
-- fuer § 147 Abs. 2 Nr. 1 AO (bildliche Uebereinstimmung) gedacht.
--
-- Scope Sprint 19.A:
--   • Tabelle + RLS + WORM-Konstruktion (kein UPDATE, DELETE durch
--     Retention-Trigger blockiert).
--   • Noch KEIN Edge-Function-Call — der kommt in 19.B. Dual-Mode-
--     DEMO schreibt synthetische Mock-Records direkt hier hinein.
--
-- Spaeter (Sprint 20+):
--   • Hash-Chain zu Vorgaenger-Eintrag.
--   • Periodic-Re-Verification (Scheduled).
-- ============================================================================

create table if not exists public.ustid_verifications (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  client_id uuid not null references public.clients(id) on delete restrict,
  partner_id uuid null
    references public.business_partners(id) on delete set null,

  requested_ust_idnr text not null,
  requester_ust_idnr text null,

  -- § 147 Abs. 2 Nr. 1 AO — Bildliche Uebereinstimmung
  raw_http_response bytea null,
  raw_http_response_headers jsonb null,
  raw_http_request_url text not null,

  -- Extrahierte Felder fuer Queries
  vies_valid boolean null,
  vies_request_date date null,
  vies_request_identifier text null,
  vies_trader_name text null,
  vies_trader_address text null,
  vies_raw_parsed jsonb null,

  verification_status text not null
    check (verification_status in (
      'VALID','INVALID','PENDING','SERVICE_UNAVAILABLE','ERROR'
    )),
  error_message text null,

  -- Retention
  created_at timestamptz not null default now(),
  created_by uuid null references auth.users(id),
  entstehungsjahr integer not null
    generated always as (extract(year from (created_at at time zone 'Europe/Berlin'))::integer) stored,
  retention_until date not null,
  retention_hold boolean not null default false,
  retention_hold_reason text null
);

create index if not exists uv_by_partner
  on public.ustid_verifications(partner_id, created_at desc);

create index if not exists uv_by_ustidnr
  on public.ustid_verifications(client_id, requested_ust_idnr, created_at desc);

create index if not exists uv_pending
  on public.ustid_verifications(created_at)
  where verification_status = 'PENDING';

alter table public.ustid_verifications enable row level security;

drop policy if exists uv_company_read on public.ustid_verifications;
create policy uv_company_read
  on public.ustid_verifications
  for select
  using (public.is_company_member(company_id));

drop policy if exists uv_company_insert on public.ustid_verifications;
create policy uv_company_insert
  on public.ustid_verifications
  for insert
  with check (public.can_write(company_id));
-- KEIN UPDATE, DELETE nur nach Retention-Ablauf (Trigger).

drop policy if exists uv_client_belongs on public.ustid_verifications;
create policy uv_client_belongs
  on public.ustid_verifications
  as restrictive
  for all
  using (true)
  with check (public.client_belongs_to_company(client_id, company_id));

-- Retention-Block: wiederverwendet tg_bpv_block_delete_retention aus 0035.
-- Die Funktion prueft OLD.retention_until / OLD.retention_hold; beide
-- Felder heissen hier identisch, also funktioniert dieselbe Funktion.
drop trigger if exists trg_uv_block_delete on public.ustid_verifications;
create trigger trg_uv_block_delete
  before delete on public.ustid_verifications
  for each row
  execute function public.tg_bpv_block_delete_retention();

comment on table public.ustid_verifications is
  'Sprint 19: VIES-Verifikations-Log. § 18e UStG Nachweispflicht. 10J Retention (§ 147 Abs. 2 Nr. 1 AO).';

comment on column public.ustid_verifications.raw_http_response is
  'Raw HTTP-Response-Body der VIES-SOAP-Antwort. Pflicht fuer bildliche Uebereinstimmung.';

comment on column public.ustid_verifications.verification_status is
  'VALID = qualifiziert bestaetigt, INVALID = negativ, PENDING = laeuft, SERVICE_UNAVAILABLE = VIES down, ERROR = Netzwerk/Format.';
