-- ════════════════════════════════════════════════════════════════════════════
-- Migration 0076: RLS-Policies fuer Mobile-App-Tabellen + Helper-Funktion
-- ════════════════════════════════════════════════════════════════════════════
--
-- Zweck:
--   1) Neue SECURITY-DEFINER-Helper-Funktion is_client_app_user(cid),
--      Pattern aus Migration 0057.
--   2) RLS-Policies auf client_app_users (Migration 0072) — bislang
--      vollstaendig gesperrt durch ENABLE + FORCE ohne Policies.
--   3) RLS-Policies auf mobile_registered_devices (Migration 0073) —
--      ebenfalls bislang vollstaendig gesperrt.
--   4) Erweiterung der bestehenden Policies belege_select und belege_insert
--      aus Migration 0048 um den Mobile-App-Upload-Pfad (Migration 0075:
--      uploaded_via_app, hash_sha256). belege_update und belege_delete
--      bleiben unveraendert.
--
-- Hintergrund:
--   FORCE-RLS-Strategie auf Mobile-App-Tabellen ist bewusste Defense-in-depth.
--   Im Unterschied zum Hauptprojekt-Pattern (z.B. clients, belege haben nur
--   ENABLE ohne FORCE) wurden die Mobile-App-Bindeglied-Tabellen mit FORCE
--   angelegt, weil sie externe Endgeraete an Mandanten-Daten binden.
--   SECURITY-DEFINER-Helper bleiben funktionsfaehig, da der Tabellen-
--   Eigentuemer in Supabase superuser ist und superuser von FORCE
--   ausgenommen ist (PostgreSQL-Standard).
--
-- ----------------------------------------------------------------------------
-- WICHTIGE TECHNISCHE NOTIZ — public.belege.mandant_id
-- ----------------------------------------------------------------------------
--   Die Mobile-Policy-Erweiterung auf public.belege referenziert die Spalte
--   mandant_id (nicht client_id). Hintergrund:
--
--   - public.belege wurde in 0022 mit der Spalte mandant_id (uuid null,
--     KEIN FK auf public.clients) angelegt.
--   - Migration 0026 (multitenant_client_id) hat public.belege bewusst
--     ausgelassen, weil das Hauptprojekt diese Spalte historisch nutzt
--     und ein Rename ein separates Cleanup-Sprint erfordert.
--   - Diese Migration ist eine MOBILE-APP-Erweiterung — sie greift
--     bewusst NICHT in das Hauptprojekt-Schema ein. Sie verwendet das
--     bestehende mandant_id-Feld unveraendert.
--
--   Sicherheits-Analyse der Verwendung von mandant_id ohne FK:
--   - Die Policy ruft is_client_app_user(mandant_id) auf. Die Helper-
--     Funktion prueft public.client_app_users (Migration 0072), die
--     ihrerseits einen FK client_id REFERENCES public.clients(id) hat.
--   - Wenn is_client_app_user(mandant_id) TRUE zurueckliefert, ist
--     der uebergebene Wert garantiert ein gueltiger public.clients.id
--     (transitive FK-Garantie ueber client_app_users.client_id).
--   - Bei mandant_id IS NULL liefert is_client_app_user(NULL) FALSE,
--     der Mobile-Zweig der Policy faellt aus → kein Bypass.
--
--   Wenn die mandant_id-Spalte spaeter in einem dedizierten Cleanup-
--   Sprint zu client_id umbenannt wird, MUSS diese Migration angepasst
--   werden — oder die Umbenennungs-Migration aktualisiert die Policies
--   im gleichen Zug.
-- ----------------------------------------------------------------------------
--
-- Rechtsgrundlage:
--   - § 30 AO (Steuergeheimnis): strikte Zugriffstrennung Mandant <-> Kanzlei
--   - DSGVO Art. 5 Abs. 1 lit. f (Integritaet und Vertraulichkeit),
--     Art. 25 (Datenschutz durch Technikgestaltung),
--     Art. 32 (Sicherheit der Verarbeitung)
--   - GoBD (BMF 14.07.2025), Rz. 58 ff. (Unveraenderbarkeit) — DELETE
--     auf client_app_users und mobile_registered_devices ist durch
--     Abwesenheit einer DELETE-Policy unterbunden. Soft-Delete via
--     revoked_at ist der einzige Loeschungspfad.
--
-- Design-Entscheidungen:
--   - Helper folgt exakt dem Pattern aus Migration 0057
--     (sql/stable/security definer/set search_path = pg_catalog, public;
--     REVOKE EXECUTE FROM public/anon; GRANT EXECUTE TO authenticated;
--     COMMENT ON FUNCTION).
--   - Policy-Naming: <table>_<operation>, Pattern aus Migration 0048
--     (kein Quoting, keine TO-Klausel — gilt fuer alle Rollen).
--   - KEIN CREATE POLICY ... FOR DELETE auf den beiden neuen Tabellen:
--     Postgres verweigert DELETE ohne passende Policy. Zusaetzlich werden
--     drop policy if exists *_delete-Statements ausgefuehrt, damit ein
--     versehentlich existierender DELETE-Policy-Rest entfernt wuerde.
--   - belege_update und belege_delete bleiben unveraendert (aus 0048):
--     Mobile-User darf weder aendern noch loeschen, nur einreichen.
--   - is_client_app_user verlangt activated_at IS NOT NULL UND
--     revoked_at IS NULL — eine eingerichtete, aber noch nicht aktivierte
--     Verknuepfung gewaehrt keinen Zugriff.
--
-- Folge-Migrations:
--   0077: Storage Bucket + Storage-RLS-Policies fuer Mobile-Uploads
--   0078: Custom Access Token Hook (kann is_client_app_user mitnutzen)
--
-- ════════════════════════════════════════════════════════════════════════════

begin;

-- ============================================================================
-- 1) Helper-Funktion: is_client_app_user(cid uuid)
-- ============================================================================

create or replace function public.is_client_app_user(cid uuid)
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  select exists (
    select 1
    from public.client_app_users
    where client_id = cid
      and user_id = auth.uid()
      and revoked_at is null
      and activated_at is not null
  );
$$;

revoke execute on function public.is_client_app_user(uuid) from public;
revoke execute on function public.is_client_app_user(uuid) from anon;
grant execute on function public.is_client_app_user(uuid) to authenticated;

comment on function public.is_client_app_user(uuid) is
  'Prueft, ob der aktuelle Nutzer eine AKTIVE Mobile-App-Verknuepfung zum gegebenen client_id hat (activated_at IS NOT NULL AND revoked_at IS NULL). Folgt dem SECURITY-DEFINER-Pattern aus Migration 0057.';

-- ============================================================================
-- 2) Policies auf public.client_app_users
-- ============================================================================
-- SELECT: Nutzer sieht eigene Eintraege; Kanzlei-MA der zugehoerigen Kanzlei
--         sieht alle Eintraege ihres Mandanten.
-- INSERT/UPDATE: nur Kanzlei-Admin der zugehoerigen Kanzlei.
-- DELETE: keine Policy → Loeschung verweigert (Soft-Delete via revoked_at).

drop policy if exists client_app_users_select on public.client_app_users;
create policy client_app_users_select on public.client_app_users
  for select using (
    user_id = auth.uid()
    or exists (
      select 1
      from public.clients c
      where c.id = client_app_users.client_id
        and public.is_company_member(c.company_id)
    )
  );

drop policy if exists client_app_users_insert on public.client_app_users;
create policy client_app_users_insert on public.client_app_users
  for insert with check (
    exists (
      select 1
      from public.clients c
      where c.id = client_app_users.client_id
        and public.is_company_admin(c.company_id)
    )
  );

drop policy if exists client_app_users_update on public.client_app_users;
create policy client_app_users_update on public.client_app_users
  for update using (
    exists (
      select 1
      from public.clients c
      where c.id = client_app_users.client_id
        and public.is_company_admin(c.company_id)
    )
  ) with check (
    exists (
      select 1
      from public.clients c
      where c.id = client_app_users.client_id
        and public.is_company_admin(c.company_id)
    )
  );

-- Keine DELETE-Policy: Loeschung unterbunden, Soft-Delete via revoked_at.
drop policy if exists client_app_users_delete on public.client_app_users;

-- ============================================================================
-- 3) Policies auf public.mobile_registered_devices
-- ============================================================================
-- SELECT: Nutzer sieht eigene Geraete; Kanzlei-MA sieht Geraete ihrer Mandanten.
-- INSERT: Nutzer registriert eigenes Geraet — nur fuer client_id, zu dem er
--         aktiv als Mobile-App-User verknuepft ist.
-- UPDATE: Nutzer aktualisiert eigenes Geraet; Kanzlei-Admin kann widerrufen.
-- DELETE: keine Policy → Loeschung verweigert (Soft-Delete via revoked_at).

drop policy if exists mobile_registered_devices_select on public.mobile_registered_devices;
create policy mobile_registered_devices_select on public.mobile_registered_devices
  for select using (
    user_id = auth.uid()
    or exists (
      select 1
      from public.clients c
      where c.id = mobile_registered_devices.client_id
        and public.is_company_member(c.company_id)
    )
  );

drop policy if exists mobile_registered_devices_insert on public.mobile_registered_devices;
create policy mobile_registered_devices_insert on public.mobile_registered_devices
  for insert with check (
    user_id = auth.uid()
    and public.is_client_app_user(client_id)
  );

drop policy if exists mobile_registered_devices_update on public.mobile_registered_devices;
create policy mobile_registered_devices_update on public.mobile_registered_devices
  for update using (
    user_id = auth.uid()
    or exists (
      select 1
      from public.clients c
      where c.id = mobile_registered_devices.client_id
        and public.is_company_admin(c.company_id)
    )
  ) with check (
    user_id = auth.uid()
    or exists (
      select 1
      from public.clients c
      where c.id = mobile_registered_devices.client_id
        and public.is_company_admin(c.company_id)
    )
  );

-- Keine DELETE-Policy: Loeschung unterbunden, Soft-Delete via revoked_at.
drop policy if exists mobile_registered_devices_delete on public.mobile_registered_devices;

-- ============================================================================
-- 4) Erweiterung public.belege — Mobile-Upload-Pfad
-- ============================================================================
-- Ausgangs-Stand aus Migration 0048: belege_select / belege_insert nutzen
-- is_company_member / can_write. Diese Migration erweitert SELECT und INSERT
-- um den Mobile-Pfad. UPDATE und DELETE bleiben unveraendert (Mobile-User
-- darf weder aendern noch loeschen).
--
-- Hinweis: Verwendung von mandant_id (nicht client_id) — siehe ausfuehrliche
-- TECHNISCHE NOTIZ im Header dieser Migration.

drop policy if exists belege_select on public.belege;
create policy belege_select on public.belege
  for select using (
    public.is_company_member(company_id)
    or (
      uploaded_via_app = true
      and public.is_client_app_user(mandant_id)
    )
  );

drop policy if exists belege_insert on public.belege;
create policy belege_insert on public.belege
  for insert with check (
    public.can_write(company_id)
    or (
      uploaded_via_app = true
      and public.is_client_app_user(mandant_id)
      and hash_sha256 is not null
    )
  );

-- belege_update und belege_delete bleiben unveraendert (Stand aus 0048).

commit;

-- ════════════════════════════════════════════════════════════════════════════
-- Rollback (manuell):
--   begin;
--
--   -- belege-Policies auf 0048-Stand zuruecksetzen
--   drop policy if exists belege_select on public.belege;
--   create policy belege_select on public.belege
--     for select using (public.is_company_member(company_id));
--   drop policy if exists belege_insert on public.belege;
--   create policy belege_insert on public.belege
--     for insert with check (public.can_write(company_id));
--
--   -- Mobile-App-Policies entfernen
--   drop policy if exists mobile_registered_devices_update on public.mobile_registered_devices;
--   drop policy if exists mobile_registered_devices_insert on public.mobile_registered_devices;
--   drop policy if exists mobile_registered_devices_select on public.mobile_registered_devices;
--   drop policy if exists client_app_users_update on public.client_app_users;
--   drop policy if exists client_app_users_insert on public.client_app_users;
--   drop policy if exists client_app_users_select on public.client_app_users;
--
--   -- Helper-Funktion entfernen
--   revoke execute on function public.is_client_app_user(uuid) from authenticated;
--   drop function if exists public.is_client_app_user(uuid);
--
--   commit;
-- ════════════════════════════════════════════════════════════════════════════
