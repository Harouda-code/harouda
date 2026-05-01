-- ============================================================================
-- harouda-app · Fix RLS-Leck cookie_consents (Charge 7, Aufgabe 1)
--
-- Problem (vor diesem Patch):
--   Die in 0023_dsgvo_compliance.sql angelegte SELECT-Policy
--   `cookie_consents_select` verwendet das Praedikat
--       USING (user_id IS NULL OR user_id = auth.uid())
--   Damit kann jeder authentifizierte Nutzer ALLE Consent-Eintraege
--   anonymer Besucher:innen lesen. Das verstoesst gegen:
--     • DSGVO Art. 5 Abs. 1 lit. c (Datenminimierung)
--     • DSGVO Art. 32 (Sicherheit der Verarbeitung)
--
-- Loesung:
--   SELECT-Policy auf strikte Eigentuemerschaft begrenzen:
--       USING (user_id = auth.uid())
--
-- Auswirkungen:
--   • Anonyme Eintraege (user_id IS NULL) sind ueber RLS NICHT mehr lesbar.
--     Das ist beabsichtigt: anonyme Consents sind reine Audit-Eintraege
--     fuer die Nachweispflicht und werden ausschliesslich serverseitig
--     (Service-Role) ausgewertet.
--   • INSERT-Policy bleibt unveraendert (anonyme Inserts weiter erlaubt).
--   • Bestehende Eintraege bleiben unangetastet.
--
-- Rollback:
--   Siehe Notfall-Migration 0043_revert_cookie_consent_rls.sql (vorbereitet,
--   nicht angewendet).
-- ============================================================================

drop policy if exists cookie_consents_select on public.cookie_consents;

create policy cookie_consents_select on public.cookie_consents
  for select using (user_id = auth.uid());
