-- ============================================================================
-- harouda-app · NOTFALL-ROLLBACK fuer 0044_user_settings.sql
--
-- WARNUNG:
--   Nur anwenden, wenn 0044 nachweislich produktive Funktionalitaet
--   bricht. Diese Migration LOESCHT die settings-Tabelle samt aller
--   Daten unwiderruflich. Vor Anwendung:
--     • Backup der settings-Tabelle erstellen
--     • Ruecksprache mit DPO und Engineering-Lead
--     • Schriftliche Freigabe
--
-- Wirkung:
--   Loescht Tabelle public.settings inkl. Indizes, Policies und Trigger.
--   localStorage-Fallback im SettingsContext muss zuvor wieder aktiviert
--   werden, sonst verlieren Nutzer ihre Einstellungen.
-- ============================================================================

drop trigger if exists settings_updated_at on public.settings;
drop function if exists public.settings_set_updated_at();

drop policy if exists settings_select on public.settings;
drop policy if exists settings_insert on public.settings;
drop policy if exists settings_update on public.settings;
drop policy if exists settings_delete on public.settings;

drop table if exists public.settings;
