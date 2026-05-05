-- 0057_security_definer_company_helpers.sql
-- Charge: Issue #54 — RLS helper recursion fix
-- Zweck:
--   Konvertiert die drei bestehenden Membership-Helper auf SECURITY DEFINER
--   mit gehaertetem search_path, um die RLS-Rekursion auf public.company_members
--   zu beseitigen. Die fachliche Semantik bleibt unveraendert.
-- Nicht im Scope:
--   - weitere RPCs
--   - Protokollierungs-Aenderungen
--   - RLS-Policy-Aenderungen
--   - Tabellen- oder Constraint-Aenderungen

begin;

-- ============================================================
-- 1) public.is_company_member(uuid)
-- ============================================================
create or replace function public.is_company_member(cid uuid)
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  select exists (
    select 1
    from public.company_members
    where company_id = cid
      and user_id = auth.uid()
  );
$$;

revoke execute on function public.is_company_member(uuid) from public;
revoke execute on function public.is_company_member(uuid) from anon;
grant execute on function public.is_company_member(uuid) to authenticated;

comment on function public.is_company_member(uuid) is
  'Issue #54: Membership-Helper als SECURITY DEFINER zur Vermeidung der RLS-Rekursion auf public.company_members; Semantik unveraendert.';

-- ============================================================
-- 2) public.can_write(uuid)
-- ============================================================
create or replace function public.can_write(cid uuid)
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  select exists (
    select 1
    from public.company_members
    where company_id = cid
      and user_id = auth.uid()
      and role in ('owner', 'admin', 'member')
  );
$$;

revoke execute on function public.can_write(uuid) from public;
revoke execute on function public.can_write(uuid) from anon;
grant execute on function public.can_write(uuid) to authenticated;

comment on function public.can_write(uuid) is
  'Issue #54: Schreibrechte-Helper als SECURITY DEFINER zur Vermeidung der RLS-Rekursion auf public.company_members; Semantik unveraendert.';

-- ============================================================
-- 3) public.is_company_admin(uuid)
-- ============================================================
create or replace function public.is_company_admin(cid uuid)
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  select exists (
    select 1
    from public.company_members
    where company_id = cid
      and user_id = auth.uid()
      and role in ('owner', 'admin')
  );
$$;

revoke execute on function public.is_company_admin(uuid) from public;
revoke execute on function public.is_company_admin(uuid) from anon;
grant execute on function public.is_company_admin(uuid) to authenticated;

comment on function public.is_company_admin(uuid) is
  'Issue #54: Admin-Helper als SECURITY DEFINER zur Vermeidung der RLS-Rekursion auf public.company_members; Semantik unveraendert.';

commit;
