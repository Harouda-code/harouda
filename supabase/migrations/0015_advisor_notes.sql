-- ============================================================================
-- harouda-app · Beraternotizen (plain, nicht "verschlüsselter Chat")
--
-- Eine generische Notiz-Tabelle, die sich an beliebige Entitäten anheften
-- lässt — aktuell primär an journal_entries. Die Namensgebung ist bewusst
-- sachlich: wir versprechen keine E2E-Verschlüsselung (dafür bräuchten wir
-- Client-Side-KMS), sondern nur serverseitige Verschlüsselung at-rest via
-- Supabase und TLS in-transit.
--
-- Append-only: Notizen können nicht editiert werden. Wer sich vertan hat,
-- schreibt eine neue Notiz. Löschen nur durch Owner/Admin.
-- ============================================================================

create table if not exists public.advisor_notes (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  /** Art der verlinkten Entität: 'journal_entry', 'client', 'invoice_archive', ... */
  entity_type text not null,
  entity_id text not null,
  author_user_id uuid null references auth.users(id) on delete set null,
  author_email text null,
  body text not null check (char_length(body) between 1 and 4000),
  created_at timestamptz not null default now()
);

create index if not exists advisor_notes_entity_idx
  on public.advisor_notes(company_id, entity_type, entity_id, created_at desc);
create index if not exists advisor_notes_company_created_idx
  on public.advisor_notes(company_id, created_at desc);

alter table public.advisor_notes enable row level security;

drop policy if exists advisor_notes_select on public.advisor_notes;
create policy advisor_notes_select
  on public.advisor_notes
  for select
  using (exists (
    select 1 from public.company_members cm
    where cm.company_id = advisor_notes.company_id
      and cm.user_id = auth.uid()
  ));

drop policy if exists advisor_notes_insert on public.advisor_notes;
create policy advisor_notes_insert
  on public.advisor_notes
  for insert
  with check (exists (
    select 1 from public.company_members cm
    where cm.company_id = advisor_notes.company_id
      and cm.user_id = auth.uid()
      and cm.role in ('owner','admin','member')
  ));

-- UPDATE verboten — Notizen sind append-only.
drop policy if exists advisor_notes_no_update on public.advisor_notes;
create policy advisor_notes_no_update
  on public.advisor_notes
  for update
  using (false);

-- DELETE nur für Owner/Admin (z. B. zum Zurückziehen eines falsch angehängten
-- Kommentars). Jede Löschung soll im audit_log auftauchen — das macht die App.
drop policy if exists advisor_notes_delete on public.advisor_notes;
create policy advisor_notes_delete
  on public.advisor_notes
  for delete
  using (exists (
    select 1 from public.company_members cm
    where cm.company_id = advisor_notes.company_id
      and cm.user_id = auth.uid()
      and cm.role in ('owner','admin')
  ));

comment on table public.advisor_notes is
  'Beraternotizen zu beliebigen Entitäten. Append-only. Keine E2E-Verschlüsselung.';
