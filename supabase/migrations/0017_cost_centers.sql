-- ============================================================================
-- harouda-app · Kostenstellen (Cost Centers)
--
-- Scope ehrlich:
--   • EINE Kostenstelle pro Buchung (Text-Code, nicht FK, damit
--     historische Buchungen bei gelöschten/umbenannten Kostenstellen
--     nicht kaputt gehen und Kostenstellen-Codes frei wählbar bleiben).
--   • KEINE Mehrfach-Allokation (split 70/30 o. ä.) — das würde eine
--     separate journal_entry_allocations-Tabelle brauchen und hat
--     Seiteneffekte auf die Journal-Hash-Kette (Migration 0010).
--     Ausdrücklich für einen späteren Release vorgesehen.
--
-- Die Kostenstelle ist NICHT Teil des Journal-Hashes — sie gilt als
-- Reporting-Dimension und darf nachträglich korrigiert werden
-- (typisch: Stammdaten-Abgleich nach Monatsabschluss).
-- ============================================================================

create table if not exists public.cost_centers (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  /** Kostenstellen-Code, frei wählbar (z. B. '100', 'ABT-A', 'VERTRIEB'). */
  code text not null,
  name text not null,
  description text null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint cost_centers_code_unique unique (company_id, code)
);

create index if not exists cost_centers_company_idx
  on public.cost_centers(company_id, is_active);

alter table public.cost_centers enable row level security;

drop policy if exists cost_centers_select on public.cost_centers;
create policy cost_centers_select
  on public.cost_centers
  for select
  using (exists (
    select 1 from public.company_members cm
    where cm.company_id = cost_centers.company_id
      and cm.user_id = auth.uid()
  ));

drop policy if exists cost_centers_write on public.cost_centers;
create policy cost_centers_write
  on public.cost_centers
  for all
  using (exists (
    select 1 from public.company_members cm
    where cm.company_id = cost_centers.company_id
      and cm.user_id = auth.uid()
      and cm.role in ('owner','admin','member')
  ))
  with check (exists (
    select 1 from public.company_members cm
    where cm.company_id = cost_centers.company_id
      and cm.user_id = auth.uid()
      and cm.role in ('owner','admin','member')
  ));

-- Spalte im Journal — optional, ohne Foreign Key (Text-Code)
alter table public.journal_entries
  add column if not exists kostenstelle text null;

create index if not exists journal_company_kostenstelle_idx
  on public.journal_entries(company_id, kostenstelle)
  where kostenstelle is not null;

comment on column public.journal_entries.kostenstelle is
  'Reporting-Dimension. Nicht Teil der Hash-Kette (vgl. journal_entries_compute_hash).';
