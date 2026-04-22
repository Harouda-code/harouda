-- ============================================================================
-- harouda-app · Trennung System-Log ↔ Audit-Log
--
-- app_logs sammelt technische Ereignisse (JS-Fehler, Performance, generische
-- Diagnose). Absichtlich OHNE Hash-Kette und OHNE WORM-Trigger, weil:
--
--   • GoBD-Relevanz liegt beim audit_log (Buchungs-Änderungen)
--   • app_logs können (und sollten) älter als 90 Tage rotiert werden
--   • Performance: keine Hash-Berechnung auf heißer Schreibbahn
--
-- Zugriff:
--   • eigene Nutzer:innen sehen ihre eigenen Logs (user_id = auth.uid())
--   • Admin/Owner der Firma sieht alle Logs ihrer Firma
-- ============================================================================

create table if not exists public.app_logs (
  id uuid primary key default gen_random_uuid(),
  at timestamptz not null default now(),
  level text not null check (level in ('debug','info','warn','error')),
  message text not null,
  context jsonb null,
  user_id uuid null references auth.users(id) on delete set null,
  company_id uuid null references public.companies(id) on delete cascade
);

create index if not exists app_logs_at_idx
  on public.app_logs(at desc);
create index if not exists app_logs_company_at_idx
  on public.app_logs(company_id, at desc);
create index if not exists app_logs_level_idx
  on public.app_logs(level)
  where level in ('warn','error');

alter table public.app_logs enable row level security;

-- Einfügen: authentisierte Nutzer:innen dürfen eigene Einträge anlegen.
drop policy if exists app_logs_insert_self on public.app_logs;
create policy app_logs_insert_self
  on public.app_logs
  for insert
  with check (
    auth.uid() is not null and (user_id is null or user_id = auth.uid())
  );

-- Lesen: eigene Einträge oder Admin/Owner der Firma.
drop policy if exists app_logs_select_self_or_admin on public.app_logs;
create policy app_logs_select_self_or_admin
  on public.app_logs
  for select
  using (
    user_id = auth.uid() or
    exists (
      select 1 from public.company_members cm
      where cm.company_id = app_logs.company_id
        and cm.user_id = auth.uid()
        and cm.role in ('owner','admin')
    )
  );

-- app_logs sind nicht "heilig" — UPDATE/DELETE bleiben möglich, damit Admins
-- Rotationsläufe fahren können (z. B. Einträge > 90 Tage löschen).

comment on table public.app_logs is
  'Technisches System-Log. Keine Hash-Kette. Rotation durch Admins zulässig. NICHT für GoBD-relevante Ereignisse.';

-- ============================================================================
