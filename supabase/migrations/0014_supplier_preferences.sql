-- ============================================================================
-- harouda-app · Lieferanten-Präferenzen (Nutzer-Lernen ohne ML)
--
-- Jedes Mal, wenn der Nutzer eine Buchung mit einer klar identifizierbaren
-- Gegenseite anlegt, protokollieren wir die Kombination (Lieferant →
-- Soll-/Haben-Konto). Beim nächsten Mal schlägt die App diese Kombi prominent
-- vor. Keine ML-Inference, nur "Was hast du beim letzten Mal genommen?".
--
-- Die Normalisierung des Schlüssels passiert in der Anwendung (lowercase +
-- Leerzeichen-collapse), damit Tipp-Varianten desselben Lieferanten im selben
-- Bucket landen. Die Originalschreibweise steht in display_name.
-- ============================================================================

create table if not exists public.supplier_preferences (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  /** Normalisiert: trimmed + lowercase + Mehrfach-Spaces → einfach. */
  supplier_key text not null,
  /** Originalschreibweise der zuletzt verbuchten Variante. */
  display_name text not null,
  soll_konto text null,
  haben_konto text null,
  usage_count integer not null default 1,
  first_used_at timestamptz not null default now(),
  last_used_at timestamptz not null default now(),

  constraint supplier_preferences_unique unique (company_id, supplier_key)
);

create index if not exists supplier_preferences_company_idx
  on public.supplier_preferences(company_id, last_used_at desc);
create index if not exists supplier_preferences_key_idx
  on public.supplier_preferences(company_id, supplier_key);

alter table public.supplier_preferences enable row level security;

drop policy if exists supplier_preferences_select on public.supplier_preferences;
create policy supplier_preferences_select
  on public.supplier_preferences
  for select
  using (exists (
    select 1 from public.company_members cm
    where cm.company_id = supplier_preferences.company_id
      and cm.user_id = auth.uid()
  ));

drop policy if exists supplier_preferences_upsert on public.supplier_preferences;
create policy supplier_preferences_upsert
  on public.supplier_preferences
  for all
  using (exists (
    select 1 from public.company_members cm
    where cm.company_id = supplier_preferences.company_id
      and cm.user_id = auth.uid()
      and cm.role in ('owner','admin','member')
  ))
  with check (exists (
    select 1 from public.company_members cm
    where cm.company_id = supplier_preferences.company_id
      and cm.user_id = auth.uid()
      and cm.role in ('owner','admin','member')
  ));

comment on table public.supplier_preferences is
  'Nutzer-Historie: welches Soll-/Haben-Konto wurde zuletzt für einen Lieferanten gebucht? Keine ML.';
