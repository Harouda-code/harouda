-- ============================================================================
-- harouda-app · Audit log
--
-- Append-only audit trail for journal entries, accounts, clients, documents
-- and settings. Rows are readable only by the owner. Inserts are allowed for
-- the owner; no updates or deletes are permitted even for the owner, to
-- preserve immutability (Grundsatz der Unveränderbarkeit – Teilaspekt der
-- GoBD). Full GoBD-Konformität erfordert darüber hinaus dokumentierte
-- Prozesse und eine externe Prüfung (IDW PS 880).
-- ============================================================================

create table if not exists public.audit_log (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  at timestamptz not null default now(),
  actor text null,
  action text not null check (action in ('create','update','delete','import','export')),
  entity text not null check (entity in ('journal_entry','account','client','document','settings')),
  entity_id uuid null,
  summary text not null,
  before jsonb null,
  after jsonb null
);

create index if not exists audit_log_owner_at_idx
  on public.audit_log(owner_id, at desc);
create index if not exists audit_log_entity_idx
  on public.audit_log(owner_id, entity, entity_id);

alter table public.audit_log enable row level security;

drop policy if exists "audit_log_select" on public.audit_log;
drop policy if exists "audit_log_insert" on public.audit_log;
-- Intentionally no update or delete policy — keeping the log immutable.

create policy "audit_log_select" on public.audit_log
  for select using (owner_id = auth.uid());
create policy "audit_log_insert" on public.audit_log
  for insert with check (owner_id = auth.uid());

-- Revoke any default UPDATE/DELETE from authenticated role.
revoke update, delete on public.audit_log from authenticated;
