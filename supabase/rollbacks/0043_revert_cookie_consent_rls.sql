-- ============================================================================
-- harouda-app · NOTFALL-ROLLBACK fuer 0042_fix_cookie_consent_rls.sql
--
-- WARNUNG:
--   Diese Migration ist als Notfall-Rollback dokumentiert und sollte
--   ausschliesslich angewendet werden, wenn 0042 nachweislich produktive
--   Funktionalitaet bricht. Sie stellt die unsichere Policy aus 0023
--   wieder her und re-oeffnet das DSGVO-Leck.
--
--   ANWENDEN NUR NACH:
--     • Ruecksprache mit Datenschutzbeauftragtem
--     • Dokumentation des Vorfalls im Incident-Register
--     • Schriftlicher Freigabe
--
-- Wirkung:
--   Setzt die SELECT-Policy `cookie_consents_select` auf den urspruenglichen,
--   zu permissiven Stand zurueck:
--       USING (user_id IS NULL OR user_id = auth.uid())
-- ============================================================================

drop policy if exists cookie_consents_select on public.cookie_consents;

create policy cookie_consents_select on public.cookie_consents
  for select using (user_id is null or user_id = auth.uid());
