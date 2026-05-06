-- 0058_company_bootstrap_rpc.sql
-- Charge: Erst-Mandant-Bootstrap fuer authentifizierte Nutzer ohne Mitgliedschaft
-- Zweck:
--   Stellt eine atomare SECURITY DEFINER Routine bereit, die fuer einen
--   eingeloggten Nutzer ohne bestehende Mitgliedschaft genau eine Company
--   und genau eine zugehoerige owner-Mitgliedschaft anlegt und genau eine
--   Zeile (id, name) zurueckgibt.
-- Nicht im Scope:
--   - RLS-Policy-Aenderungen
--   - audit_log-Schema-Aenderungen
--   - Aenderungen an Migration 0057 / Issue #54 Helpers
--   - Aenderungen an Tabellen-Constraints
--   - Server-seitige Slug-Generierung
--   - Slug-Format-Regex oder Laengenlimits

begin;

create or replace function public.bootstrap_first_company(
  p_name text,
  p_slug text
)
returns table (id uuid, name text)
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_user_id  uuid;
  v_name     text;
  v_slug     text;
  v_new_id   uuid;
  v_new_name text;
begin
  -- Schritt a) Identitaet der aufrufenden Sitzung erfassen.
  v_user_id := auth.uid();

  -- Schritt b) Fehlende Authentifizierung ablehnen.
  -- SQLSTATE 28000 (invalid_authorization_specification) signalisiert,
  -- dass kein authentifizierter Nutzer im Aufrufkontext vorliegt.
  if v_user_id is null then
    raise exception 'authentication required'
      using errcode = '28000';
  end if;

  -- Schritt c) Eingaben defensiv bereinigen und validieren.
  -- COALESCE ist ein SQL-Ausdruck und keine schema-qualifizierbare
  -- Funktion; explizite NULL-Argumente werden daher per CASE-Ausdruck
  -- auf den Leerstring abgebildet, bevor pg_catalog.btrim Whitespace
  -- am Anfang und Ende entfernt.
  v_name := pg_catalog.btrim(
    case when p_name is null then '' else p_name end
  );
  v_slug := pg_catalog.btrim(
    case when p_slug is null then '' else p_slug end
  );

  -- SQLSTATE 22023 (invalid_parameter_value) fuer leere Pflichtwerte.
  if v_name = '' then
    raise exception 'p_name must not be empty'
      using errcode = '22023';
  end if;
  if v_slug = '' then
    raise exception 'p_slug must not be empty'
      using errcode = '22023';
  end if;

  -- Schritt d) Transaktions-Advisory-Lock auf Namespace + Nutzer-ID.
  -- Der Lock serialisiert konkurrierende Bootstrap-Aufrufe desselben
  -- Nutzers. Die nachfolgende EXISTS-Pruefung sieht damit zuverlaessig
  -- eine Mitgliedschaft, die ein zeitgleicher Vorgaengeraufruf bereits
  -- eingefuegt hat. Auf diese Weise wird das TOCTOU-Fenster zwischen
  -- Existenzpruefung und INSERT geschlossen. Der Lock wird beim COMMIT
  -- oder ROLLBACK der umschliessenden Transaktion automatisch freigegeben.
  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtext('harouda:bootstrap_first_company'),
    pg_catalog.hashtext(v_user_id::text)
  );

  -- Schritt e) Idempotenz-Wache: Erst-Bootstrap nur fuer Nutzer ohne
  -- bestehende Mitgliedschaften. SQLSTATE P0001 ist die projektweit
  -- etablierte Klasse fuer "Operation in aktuellem Zustand nicht erlaubt".
  if exists (
    select 1
    from public.company_members
    where user_id = v_user_id
  ) then
    raise exception 'user already has memberships'
      using errcode = 'P0001';
  end if;

  -- Schritt f) Erst-Company anlegen. created_by stammt ausschliesslich
  -- aus auth.uid(); kein vom Aufrufer gesteuerter Identitaetsparameter.
  insert into public.companies (name, slug, created_by)
  values (v_name, v_slug, v_user_id)
  returning public.companies.id, public.companies.name
    into v_new_id, v_new_name;

  -- Schritt g) Eigentuemer-Mitgliedschaft fest verdrahtet als 'owner'.
  insert into public.company_members (company_id, user_id, role)
  values (v_new_id, v_user_id, 'owner');

  -- Schritt h) Genau eine Ergebniszeile (id, name).
  return query
    select v_new_id::uuid, v_new_name::text;
end;
$$;

revoke execute on function public.bootstrap_first_company(text, text) from public;
revoke execute on function public.bootstrap_first_company(text, text) from anon;
grant  execute on function public.bootstrap_first_company(text, text) to authenticated;

comment on function public.bootstrap_first_company(text, text) is
  'Legt fuer einen authentifizierten Aufrufer ohne bestehende Mitgliedschaft '
  'genau eine Company sowie eine zugehoerige Mitgliedschaft mit der Rolle '
  'owner an und liefert das Ergebnis als einzeilige Tabelle mit den Spalten '
  '(id uuid, name text). Die Identitaet stammt ausschliesslich aus auth.uid(); '
  'es gibt keinen vom Aufrufer steuerbaren Identitaetsparameter. Erwartete '
  'Fehlerklassen: 28000 fehlende Authentifizierung, 22023 leerer Pflichtwert '
  'fuer p_name oder p_slug, P0001 wenn der Aufrufer bereits eine Mitgliedschaft '
  'besitzt. Konkurrierende Aufrufe desselben Nutzers werden ueber einen '
  'Transaktions-Advisory-Lock serialisiert.';

commit;
