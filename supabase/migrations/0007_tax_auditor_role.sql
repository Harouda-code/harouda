-- ============================================================================
-- harouda-app · Rolle "tax_auditor" (Betriebsprüfer:in) ergänzen
--
-- Erweitert den company_role-Enum um eine Rolle für externe Prüfer:innen.
-- Die Rolle ist funktional Lesezugriff (wie "readonly"), aber semantisch
-- klar getrennt, damit Prüferzugriffe im Audit-Log erkennbar sind.
--
-- RLS-Policies müssen unverändert bleiben (readonly-Semantik), siehe
-- Migration 0004 für die bestehenden Select-Policies. Dieses Skript ergänzt
-- ausschließlich den Enum sowie eine optionale "access_valid_until"-Spalte
-- in company_members zur zeitlichen Begrenzung von Prüferzugängen.
-- ============================================================================

-- 1) Enum-Erweiterung -------------------------------------------------------

do $$ begin
  if not exists (
    select 1 from pg_enum e
    join pg_type t on t.oid = e.enumtypid
    where t.typname = 'company_role' and e.enumlabel = 'tax_auditor'
  ) then
    alter type public.company_role add value 'tax_auditor';
  end if;
end $$;

-- 2) Zeitliche Begrenzung für Prüferzugänge ---------------------------------

alter table public.company_members
  add column if not exists access_valid_until timestamptz;

comment on column public.company_members.access_valid_until is
  'Für Prüferzugänge: Ab diesem Zeitpunkt verweigert die RLS-Policy Lesezugriff.';

-- 3) RLS-Erweiterung: Prüferzugang läuft nach access_valid_until aus --------
--
-- Hinweis: Wir ersetzen NICHT die bestehende Select-Policy global, sondern
-- ergänzen eine zusätzliche Bedingung für genau die tax_auditor-Rolle. Dadurch
-- bleiben owner/admin/member/readonly-Zugänge unverändert.

do $$ begin
  if exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'journal_entries'
      and policyname = 'journal_entries_auditor_expiry'
  ) then
    drop policy journal_entries_auditor_expiry on public.journal_entries;
  end if;
end $$;

-- Blockiert sämtliche Operationen für Prüfer:innen, deren access_valid_until
-- bereits in der Vergangenheit liegt. Für Prüfer:innen ohne Ablauf (NULL)
-- und für alle anderen Rollen greift die Policy nicht.
create policy journal_entries_auditor_expiry
  on public.journal_entries
  as restrictive
  for all
  using (
    not exists (
      select 1
      from public.company_members cm
      where cm.company_id = journal_entries.company_id
        and cm.user_id = auth.uid()
        and cm.role = 'tax_auditor'
        and cm.access_valid_until is not null
        and cm.access_valid_until < now()
    )
  );

-- ============================================================================
-- Admin-Workflow:
--   1. Prüfer:in anlegen: insert into company_members (..., role, access_valid_until)
--      values (..., 'tax_auditor', now() + interval '30 days');
--   2. Zugriff beenden:   update company_members set access_valid_until = now()
--      where user_id = '…' and role = 'tax_auditor';
--
-- Die echte IP-Beschränkung und Rate-Limits kommen nicht aus Postgres, sondern
-- aus einer vorgelagerten API-Gateway-Schicht (z. B. Supabase Edge Function).
-- ============================================================================
