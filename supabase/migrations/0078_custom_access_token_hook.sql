-- ════════════════════════════════════════════════════════════════════════════
-- Migration 0078: Custom Access Token Hook fuer Mobile-App-Claims
-- ════════════════════════════════════════════════════════════════════════════
--
-- Zweck:
--   Definiert die SECURITY-DEFINER-Funktion public.custom_access_token_hook,
--   die von Supabase Auth bei jeder Token-Ausstellung aufgerufen wird, um
--   Mobile-App-spezifische Claims in das JWT (Feld app_metadata.harouda_mobile)
--   einzubetten:
--     - mobile_app_enabled (bool): TRUE wenn der Nutzer mindestens eine
--       aktive client_app_users-Verknuepfung hat
--     - active_client_ids (uuid[]): Liste aller client_id, fuer die der
--       Nutzer eine aktive Verknuepfung hat (revoked_at IS NULL AND
--       activated_at IS NOT NULL)
--     - has_registered_device (bool): TRUE wenn der Nutzer mindestens
--       ein aktives Geraet in mobile_registered_devices registriert hat
--     - schema_version (int): aktuell 1, fuer spaetere Erweiterungen
--
--   Der Hook AENDERT KEINE RLS-Logik — er stellt nur Convenience-Claims
--   bereit, damit der Mobile-Client schnell weiss, ob er Mobile-Features
--   aktivieren soll. RLS bleibt die alleinige Wahrheitsquelle fuer
--   Daten-Zugriff (Migrations 0076, 0077).
--
-- Hintergrund:
--   Strategische Entscheidung E8 (OAuth Authorization Code Flow + PKCE +
--   Refresh Token Rotation). Der Custom Access Token Hook ist das von
--   Supabase Auth vorgesehene Erweiterungsmuster fuer JWT-Claims
--   (https://supabase.com/docs/guides/auth/auth-hooks#hook-custom-access-token).
--
-- Rechtsgrundlage:
--   - § 30 AO (Steuergeheimnis): explizite, minimale Claim-Liste
--   - DSGVO Art. 5 Abs. 1 lit. c (Datenminimierung): KEINE PII im Token,
--     nur UUIDs und Boolean-Flags
--   - DSGVO Art. 25 (Privacy by Design)
--   - DSGVO Art. 32 (Sicherheit der Verarbeitung)
--   - IETF RFC 9700 (OAuth 2.0 Security Best Current Practice)
--   - BSI IT-Grundschutz APP.4.3 (Mobile Anwendungen)
--
-- Design-Entscheidungen:
--   - SECURITY DEFINER mit gehaertetem search_path (Pattern aus 0057, 0076).
--   - Funktions-Owner: postgres (Default). EXECUTE wird ausschliesslich an
--     supabase_auth_admin gewaehrt — die einzige Rolle, die Supabase Auth
--     fuer Hook-Aufrufe verwendet. authenticated/anon/public erhalten
--     KEIN EXECUTE-Recht.
--   - Eingangsparameter ist eine JSONB mit Schluessel "user_id" und
--     "claims" (gemaess Supabase Auth Hook Contract). Rueckgabe ist die
--     ggf. erweiterte claims-Struktur.
--   - Defensive Behandlung: wenn user_id fehlt oder NULL ist, wird das
--     Event unveraendert zurueckgegeben (kein Fehler, da der Hook nicht
--     den Auth-Flow blockieren darf).
--   - Schreibt KEINE Daten in andere Tabellen — reiner Lese-Hook.
--   - Audit-Logging des Hook-Aufrufs erfolgt durch Supabase Auth selbst,
--     nicht hier (vermeidet Synchronitaets-Probleme).
--   - JSONB-Pfad: erweitert event -> 'claims' -> 'app_metadata' um den
--     Schluessel 'harouda_mobile' (eigener Namespace, kollidiert nicht
--     mit anderen App-Metadaten).
--
-- Aktivierung (NICHT Teil dieser Migration):
--   Der Hook MUSS im Supabase-Dashboard unter
--   "Authentication → Hooks → Custom Access Token Hook" auf die Funktion
--   public.custom_access_token_hook gesetzt werden. Ohne diese
--   Aktivierung wird der Hook von Supabase Auth nicht aufgerufen.
--   Diese Aktivierung erfolgt operativ, nicht via Migration.
--
-- ════════════════════════════════════════════════════════════════════════════

begin;

create or replace function public.custom_access_token_hook(event jsonb)
returns jsonb
language plpgsql
stable
security definer
set search_path = pg_catalog, public
as $$
declare
  uid                  uuid;
  claims               jsonb;
  app_metadata         jsonb;
  mobile_section       jsonb;
  v_mobile_enabled     boolean;
  v_active_client_ids  uuid[];
  v_has_device         boolean;
begin
  -- Defensive: wenn user_id fehlt, event unveraendert zurueckgeben.
  uid := nullif(event ->> 'user_id', '')::uuid;
  if uid is null then
    return event;
  end if;

  -- Aktive client_app_users-Verknuepfungen ermitteln
  select coalesce(array_agg(distinct client_id), array[]::uuid[])
    into v_active_client_ids
  from public.client_app_users
  where user_id = uid
    and revoked_at is null
    and activated_at is not null;

  v_mobile_enabled := array_length(v_active_client_ids, 1) is not null;

  -- Aktives Geraet vorhanden?
  select exists (
    select 1
    from public.mobile_registered_devices
    where user_id = uid
      and revoked_at is null
  ) into v_has_device;

  -- harouda_mobile-Sektion zusammenstellen
  mobile_section := jsonb_build_object(
    'schema_version', 1,
    'mobile_app_enabled', v_mobile_enabled,
    'active_client_ids', to_jsonb(v_active_client_ids),
    'has_registered_device', v_has_device
  );

  -- claims und app_metadata aus Event lesen (mit Defaults)
  claims := coalesce(event -> 'claims', '{}'::jsonb);
  app_metadata := coalesce(claims -> 'app_metadata', '{}'::jsonb);

  -- harouda_mobile in app_metadata schreiben (eigener Namespace)
  app_metadata := jsonb_set(
    app_metadata,
    '{harouda_mobile}',
    mobile_section,
    true
  );

  -- claims aktualisieren und in Event zurueckschreiben
  claims := jsonb_set(claims, '{app_metadata}', app_metadata, true);
  event := jsonb_set(event, '{claims}', claims, true);

  return event;
end;
$$;

-- Berechtigungen: ausschliesslich supabase_auth_admin darf den Hook aufrufen.
revoke execute on function public.custom_access_token_hook(jsonb) from public;
revoke execute on function public.custom_access_token_hook(jsonb) from anon;
revoke execute on function public.custom_access_token_hook(jsonb) from authenticated;
grant execute on function public.custom_access_token_hook(jsonb) to supabase_auth_admin;

comment on function public.custom_access_token_hook(jsonb) is
  'Custom Access Token Hook fuer Mobile-App-Claims. Wird von Supabase Auth bei jeder Token-Ausstellung aufgerufen und fuegt app_metadata.harouda_mobile (schema_version, mobile_app_enabled, active_client_ids, has_registered_device) in das JWT ein. SECURITY DEFINER, ausfuehrbar nur durch supabase_auth_admin. Aktivierung im Supabase-Dashboard erforderlich.';

commit;

-- ════════════════════════════════════════════════════════════════════════════
-- Rollback (manuell):
--   begin;
--   -- Vor dem Rollback im Supabase-Dashboard den Hook deaktivieren!
--   revoke execute on function public.custom_access_token_hook(jsonb) from supabase_auth_admin;
--   drop function if exists public.custom_access_token_hook(jsonb);
--   commit;
-- ════════════════════════════════════════════════════════════════════════════
