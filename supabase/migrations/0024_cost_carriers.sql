-- ============================================================================
-- harouda-app · Kostenträger (Cost Carriers)
--
-- Zweite Reporting-Dimension neben Kostenstellen (Migration 0017).
-- Konvention im deutschen Rechnungswesen:
--   • Kostenstelle (KST) = „Wo kostet es?" (Abteilung, Standort, Filiale).
--   • Kostenträger (KTR) = „Wofür kostet es?" (Projekt, Produkt, Auftrag).
-- In DATEV-Systemen typischerweise als KOST1 und KOST2 geführt.
--
-- Scope symmetrisch zu Migration 0017:
--   • EIN Kostenträger pro Buchung (Text-Code, kein FK).
--   • KEINE Mehrfach-Allokation.
--   • NICHT Teil des Journal-Hashes (wie kostenstelle, siehe 0017).
--
-- journal_entries_compute_hash (Migration 0010) bleibt unverändert — weder
-- kostenstelle noch kostentraeger fließen in die Hash-Kette. Beide Felder
-- gelten als nachträglich korrigierbare Reporting-Dimensionen.
-- ============================================================================

create table if not exists public.cost_carriers (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  /** Kostenträger-Code, frei wählbar (z. B. 'PROJ-2025-01', 'PRODUKT-A'). */
  code text not null,
  name text not null,
  description text null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint cost_carriers_code_unique unique (company_id, code)
);

create index if not exists cost_carriers_company_idx
  on public.cost_carriers(company_id, is_active);

alter table public.cost_carriers enable row level security;

drop policy if exists cost_carriers_select on public.cost_carriers;
create policy cost_carriers_select
  on public.cost_carriers
  for select
  using (exists (
    select 1 from public.company_members cm
    where cm.company_id = cost_carriers.company_id
      and cm.user_id = auth.uid()
  ));

drop policy if exists cost_carriers_write on public.cost_carriers;
create policy cost_carriers_write
  on public.cost_carriers
  for all
  using (exists (
    select 1 from public.company_members cm
    where cm.company_id = cost_carriers.company_id
      and cm.user_id = auth.uid()
      and cm.role in ('owner','admin','member')
  ))
  with check (exists (
    select 1 from public.company_members cm
    where cm.company_id = cost_carriers.company_id
      and cm.user_id = auth.uid()
      and cm.role in ('owner','admin','member')
  ));

-- Spalte im Journal — optional, ohne Foreign Key (Text-Code)
alter table public.journal_entries
  add column if not exists kostentraeger text null;

create index if not exists journal_company_kostentraeger_idx
  on public.journal_entries(company_id, kostentraeger)
  where kostentraeger is not null;

comment on column public.journal_entries.kostentraeger is
  'Reporting-Dimension (Projekt/Produkt). Nicht Teil der Hash-Kette (vgl. journal_entries_compute_hash in Migration 0010).';
