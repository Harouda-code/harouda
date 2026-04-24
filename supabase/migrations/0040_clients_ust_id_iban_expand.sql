-- Migration 0040: Add USt-IdNr, IBAN, and VIES verification fields to clients
-- Rationale: § 14 Abs. 4 Nr. 2 UStG requires USt-IdNr on invoices.
--            § 18e UStG requires VIES verification tracking.
--            Fields previously declared in TS type but missing from DB (drift fix).

alter table public.clients
  add column if not exists ust_id text,
  add column if not exists iban text,
  add column if not exists ust_id_status text not null default 'unchecked',
  add column if not exists ust_id_checked_at timestamptz,
  add column if not exists last_daten_holen_at timestamptz;

alter table public.clients
  drop constraint if exists chk_clients_ust_id_format;
alter table public.clients
  add constraint chk_clients_ust_id_format check (
    ust_id is null
    or ust_id ~ '^[A-Z]{2}[A-Z0-9]{2,12}$'
  );

alter table public.clients
  drop constraint if exists chk_clients_iban_format;
alter table public.clients
  add constraint chk_clients_iban_format check (
    iban is null
    or iban ~ '^[A-Z]{2}[0-9]{2}[A-Z0-9]{10,30}$'
  );

alter table public.clients
  drop constraint if exists chk_clients_ust_id_status;
alter table public.clients
  add constraint chk_clients_ust_id_status check (
    ust_id_status in ('unchecked','valid','invalid','service_unavailable','error')
  );

comment on column public.clients.ust_id is
  'USt-IdNr. des Mandanten. § 14 Abs. 4 Nr. 2 UStG Pflichtfeld auf Ausgangsrechnungen.';
comment on column public.clients.iban is
  'IBAN des Mandanten fuer Zahlungsverkehr.';
comment on column public.clients.ust_id_status is
  'Status der letzten VIES-Verifikation nach § 18e UStG.';
comment on column public.clients.ust_id_checked_at is
  'Zeitpunkt der letzten VIES-Verifikation.';
comment on column public.clients.last_daten_holen_at is
  'Zeitpunkt des letzten Daten-Abrufs (audit trail).';
