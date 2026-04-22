-- ============================================================================
-- harouda-app · Beleg-Anforderungen (Receipt Requests)
--
-- Ehrlicher Scope:
--   • KEIN automatischer E-Mail-Versand aus der App — es gibt keinen
--     Mail-Server, und clientseitiges SMTP ist nicht machbar.
--   • KEIN Kundenportal für Belege-Uploads — eine solche Ingest-Route
--     existiert nicht.
--   • Was die App leistet: eine Liste offener Beleg-Anforderungen, die
--     manuell per mailto: oder Telefon abgearbeitet werden. Wenn der
--     Beleg nachgereicht wurde, wird der Status manuell auf "received"
--     gestellt.
-- ============================================================================

create table if not exists public.receipt_requests (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  requested_by uuid null references auth.users(id) on delete set null,
  requested_at timestamptz not null default now(),

  /** Bank-Transaktions-Schlüssel (Datum + Betrag + Verwendung). Kein FK,
   *  weil bank_transactions-Tabelle nicht existiert; Bank-Daten liegen
   *  nur in der Session. */
  bank_datum date not null,
  bank_betrag numeric not null,
  bank_verwendung text null,
  bank_gegenseite text null,
  bank_iban text null,

  /** Adressat — E-Mail oder Name. Optional, wenn nur Telefon-Kontakt. */
  recipient_email text null,
  recipient_name text null,

  /** Freitext (eigene Notiz / Aufforderung an die Gegenseite). */
  notes text null,

  status text not null default 'open'
    check (status in ('open','received','cancelled')),
  received_at timestamptz null,

  /** Wann hat der Nutzer den Status auf "received" gesetzt. */
  linked_journal_entry_id uuid null references public.journal_entries(id) on delete set null
);

create index if not exists receipt_requests_company_status_idx
  on public.receipt_requests(company_id, status, requested_at desc);
create index if not exists receipt_requests_company_age_idx
  on public.receipt_requests(company_id, requested_at);

alter table public.receipt_requests enable row level security;

drop policy if exists receipt_requests_select on public.receipt_requests;
create policy receipt_requests_select
  on public.receipt_requests
  for select
  using (exists (
    select 1 from public.company_members cm
    where cm.company_id = receipt_requests.company_id
      and cm.user_id = auth.uid()
  ));

drop policy if exists receipt_requests_insert on public.receipt_requests;
create policy receipt_requests_insert
  on public.receipt_requests
  for insert
  with check (exists (
    select 1 from public.company_members cm
    where cm.company_id = receipt_requests.company_id
      and cm.user_id = auth.uid()
      and cm.role in ('owner','admin','member')
  ));

drop policy if exists receipt_requests_update on public.receipt_requests;
create policy receipt_requests_update
  on public.receipt_requests
  for update
  using (exists (
    select 1 from public.company_members cm
    where cm.company_id = receipt_requests.company_id
      and cm.user_id = auth.uid()
      and cm.role in ('owner','admin','member')
  ));

drop policy if exists receipt_requests_delete on public.receipt_requests;
create policy receipt_requests_delete
  on public.receipt_requests
  for delete
  using (exists (
    select 1 from public.company_members cm
    where cm.company_id = receipt_requests.company_id
      and cm.user_id = auth.uid()
      and cm.role in ('owner','admin')
  ));

comment on table public.receipt_requests is
  'Manueller Tracker für fehlende Belege. Kein automatischer Versand.';
