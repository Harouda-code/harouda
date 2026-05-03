-- =============================================================================
-- Migration:  0054_grant_authenticated_public_tables.sql
-- Charge:     19 / Phase 2 / Step 3
-- Schuld:     18-bet (GRANT-Repair fuer authenticated + service_role)
-- Datum:      2026-05-03
-- Vorgaenger: 0052 (REVOKE anon dangerous), 0053 (REVOKE authenticated dangerous)
--
-- =============================================================================
-- Zweck:
-- =============================================================================
-- Wiederherstellung der operativen Schreib- und Leserechte fuer die Rolle
-- `authenticated` nach den restriktiven Migrations 0052 und 0053. Privilegien
-- werden pro Tabelle nach RLS-Policy-Bedarf in fuenf Gruppen (A-E) vergeben
-- (Least Privilege, Lehre 44: GRANT und RLS sind orthogonale Schichten).
-- `service_role` erhaelt zusaetzlich Voll-Zugriff auf Tabellen und Sequenzen.
--
-- =============================================================================
-- Source-of-Truth fuer das Gruppe-Mapping:
-- =============================================================================
-- Methodik:        HANDOFF_BATCH_19 Sektion 8.4, Schritte 1-3
-- Inventar-Query:  pg_policies-Abfrage gemaess HANDOFF_BATCH_19 Sektion 8.4
--                  Zeilen 518-527
-- Ausfuehrung:     Pre-Check Phase 6/N am 2026-05-03 (vor dieser Migration)
-- Ergebnis:        134 Policies auf 41 Tabellen im schema public
-- Ableitungs-Regel:
--   - PERMISSIVE-Policies definieren das verfuegbare cmd-Set pro Tabelle.
--   - RESTRICTIVE-Policies fuegen KEINE Privilegien hinzu, sie schraenken nur
--     ein - daher fuer GRANT-Ableitung irrelevant.
--   - Aggregation der PERMISSIVE cmd-Werte (SELECT/INSERT/UPDATE/DELETE/ALL)
--     pro Tabelle ergibt das Privilegien-Set fuer `authenticated`.
--   - `roles = public` in pg_policies ist Supabase-Default und bedeutet
--     "auf GRANT-Schicht delegiert"; tatsaechliche Rollen-Differenzierung
--     erfolgt durch GRANTs (siehe Lehre 44 zur Schicht-Trennung).
--
-- =============================================================================
-- Aus dieser Methodik resultierende Gruppen:
-- =============================================================================
-- Gruppe A (32 Tabellen) - Voll-CRUD: PERMISSIVE-cmd umfasst alle 4 Operationen
--   (entweder `cmd=ALL` oder explizit SELECT+INSERT+UPDATE+DELETE).
-- Gruppe B (1 Tabelle)   - SELECT/INSERT/DELETE: kein UPDATE-Policy.
-- Gruppe C (1 Tabelle)   - SELECT/INSERT/UPDATE: kein DELETE-Policy.
-- Gruppe D (6 Tabellen)  - Append-Only SELECT/INSERT.
-- Gruppe E (1 Tabelle)   - Read-Only SELECT.
-- Summe: 41 Tabellen (= Pre-Check 6/N Inventar). Tabelle `health_check` (42.)
-- ist out-of-scope - hat keine RLS-Policies und behaelt SELECT-only fuer
-- `authenticated` aus frueherer Konfiguration (intentional health-probe).
--
-- =============================================================================
-- Out-of-Scope (explizit):
-- =============================================================================
--   - protect_update-Whitelist erweitern        (Schuld 19-aleph, eigene Charge)
--   - localStorage-Settings -> DB-Side          (Schuld 19-bet, eigene Charge)
--   - Helper-Function-EXECUTE-Hardening         (Schuld 19-gimel, eigene Charge)
--   - ALTER DEFAULT PRIVILEGES-Cleanup          (Schuld 19-he, eigene Charge)
--   - BEFORE-DELETE-Trigger fuer belege/positionen (Schuld 18-aleph, Charge 21)
--   - anon-GRANTs                               (durch 0052 entzogen, bleibt so)
--   - Storage-Schema/Bucket-Privilegien         (separate Domain)
--
-- =============================================================================
-- Idempotenz:
-- =============================================================================
-- GRANT auf bereits gewaehrte Privilegien ist in PostgreSQL ein no-op.
-- Mehrfaches Anwenden dieser Migration ist gefahrlos.
-- =============================================================================


-- =============================================================================
-- Gruppe A -- Voll-CRUD (32 Tabellen)
-- Ableitung: PERMISSIVE cmd-Werte = {SELECT, INSERT, UPDATE, DELETE} oder {ALL}
-- GRANT:     SELECT, INSERT, UPDATE, DELETE
-- =============================================================================
grant select, insert, update, delete on public.account_report_mapping       to authenticated;
grant select, insert, update, delete on public.accounts                     to authenticated;
grant select, insert, update, delete on public.advisor_notes                to authenticated;
grant select, insert, update, delete on public.afa_buchungen                to authenticated;
grant select, insert, update, delete on public.anlagegueter                 to authenticated;
grant select, insert, update, delete on public.bank_reconciliation_matches  to authenticated;
grant select, insert, update, delete on public.beleg_positionen             to authenticated;
grant select, insert, update, delete on public.belege                       to authenticated;
grant select, insert, update, delete on public.business_partners            to authenticated;
grant select, insert, update, delete on public.clients                      to authenticated;
grant select, insert, update, delete on public.companies                    to authenticated;
grant select, insert, update, delete on public.company_members              to authenticated;
grant select, insert, update, delete on public.cost_carriers                to authenticated;
grant select, insert, update, delete on public.cost_centers                 to authenticated;
grant select, insert, update, delete on public.documents                    to authenticated;
grant select, insert, update, delete on public.elster_submissions           to authenticated;
grant select, insert, update, delete on public.employees                    to authenticated;
grant select, insert, update, delete on public.inventur_anlagen             to authenticated;
grant select, insert, update, delete on public.inventur_bestaende           to authenticated;
grant select, insert, update, delete on public.inventur_sessions            to authenticated;
grant select, insert, update, delete on public.invoice_archive              to authenticated;
grant select, insert, update, delete on public.invoice_xml_archive          to authenticated;
grant select, insert, update, delete on public.journal_entries              to authenticated;
grant select, insert, update, delete on public.lohnabrechnungen_archiv      to authenticated;
grant select, insert, update, delete on public.lohnarten                    to authenticated;
grant select, insert, update, delete on public.lohnbuchungen                to authenticated;
grant select, insert, update, delete on public.lsta_festschreibungen        to authenticated;
grant select, insert, update, delete on public.receipt_requests             to authenticated;
grant select, insert, update, delete on public.report_line_closure          to authenticated;
grant select, insert, update, delete on public.report_lines                 to authenticated;
grant select, insert, update, delete on public.settings                     to authenticated;
grant select, insert, update, delete on public.supplier_preferences         to authenticated;


-- =============================================================================
-- Gruppe B -- SELECT, INSERT, DELETE (1 Tabelle)
-- Ableitung: PERMISSIVE cmd-Werte = {SELECT, INSERT, DELETE}, kein UPDATE.
-- =============================================================================
grant select, insert, delete on public.dunning_records to authenticated;


-- =============================================================================
-- Gruppe C -- SELECT, INSERT, UPDATE (1 Tabelle)
-- Ableitung: PERMISSIVE cmd-Werte = {SELECT, INSERT, UPDATE}, kein DELETE.
-- =============================================================================
grant select, insert, update on public.user_profiles to authenticated;


-- =============================================================================
-- Gruppe D -- Append-Only: SELECT, INSERT (6 Tabellen)
-- Ableitung: PERMISSIVE cmd-Werte = {SELECT, INSERT}, kein UPDATE/DELETE.
-- =============================================================================
grant select, insert on public.app_logs            to authenticated;
grant select, insert on public.audit_log           to authenticated;
grant select, insert on public.cookie_consents     to authenticated;
grant select, insert on public.privacy_incidents   to authenticated;
grant select, insert on public.privacy_requests    to authenticated;
grant select, insert on public.ustid_verifications to authenticated;


-- =============================================================================
-- Gruppe E -- Read-Only: SELECT (1 Tabelle)
-- Ableitung: PERMISSIVE cmd-Werte = {SELECT}, kein INSERT/UPDATE/DELETE.
-- =============================================================================
grant select on public.business_partners_versions to authenticated;


-- =============================================================================
-- Sequenzen -- USAGE fuer authenticated (Lehre 52)
-- Ohne diese GRANTs scheitert INSERT auf den zugehoerigen Tabellen mit
-- `permission denied for sequence`. Inventar verifiziert in Pre-Check
-- Phase 4/N am 2026-05-03: genau 2 Sequenzen im schema public, beide bigint.
-- =============================================================================
grant usage on sequence public.account_report_mapping_id_seq to authenticated;
grant usage on sequence public.report_lines_id_seq           to authenticated;


-- =============================================================================
-- service_role -- Voll-Zugriff (Tabellen + Sequenzen)
-- Pre-Check Phase 2/N (2026-05-03): service_role besitzt aktuell auf
-- 42 Tabellen nur REFERENCES, TRIGGER, TRUNCATE -- keine SELECT/INSERT/UPDATE/
-- DELETE. Damit ist `service_role` operativ unfaehig. Diese GRANTs ergaenzen
-- die fehlenden Privilegien fuer alle 42 Tabellen und 2 Sequenzen.
-- =============================================================================
grant all on all tables    in schema public to service_role;
grant all on all sequences in schema public to service_role;


-- =============================================================================
-- Verifikation (NACH Anwendung manuell auszufuehren -- nicht Teil der Migration):
-- =============================================================================
-- -- (V1) authenticated -- Tabellen-GRANTs
-- select grantee, table_name,
--        string_agg(privilege_type, ', ' order by privilege_type) as privs
-- from information_schema.role_table_grants
-- where table_schema = 'public' and grantee = 'authenticated'
-- group by grantee, table_name order by table_name;
-- -- Erwartung: 42 Zeilen
-- --   Gruppe A (32):  privs = 'DELETE, INSERT, SELECT, UPDATE'
-- --   Gruppe B (1):   dunning_records             = 'DELETE, INSERT, SELECT'
-- --   Gruppe C (1):   user_profiles               = 'INSERT, SELECT, UPDATE'
-- --   Gruppe D (6):   app_logs/audit_log/cookie_consents/privacy_incidents/
-- --                   privacy_requests/ustid_verifications
-- --                                               = 'INSERT, SELECT'
-- --   Gruppe E (1):   business_partners_versions  = 'SELECT'
-- --   health_check (1, intentional, unveraendert) = 'SELECT'
--
-- -- (V2) authenticated -- Sequenz-USAGE via PostgreSQL-Built-in
-- select
--   c.relname as sequence_name,
--   has_sequence_privilege('authenticated', 'public.' || c.relname, 'USAGE')  as has_usage,
--   has_sequence_privilege('authenticated', 'public.' || c.relname, 'SELECT') as has_select,
--   has_sequence_privilege('authenticated', 'public.' || c.relname, 'UPDATE') as has_update
-- from pg_class c
-- join pg_namespace n on n.oid = c.relnamespace
-- where n.nspname = 'public' and c.relkind = 'S'
-- order by c.relname;
-- -- Erwartung: 2 Zeilen
-- --   account_report_mapping_id_seq | has_usage=true | has_select=false | has_update=false
-- --   report_lines_id_seq           | has_usage=true | has_select=false | has_update=false
--
-- -- (V3) service_role -- Tabellen-GRANTs (Voll-Zugriff)
-- select grantee, table_name,
--        string_agg(privilege_type, ', ' order by privilege_type) as privs
-- from information_schema.role_table_grants
-- where table_schema = 'public' and grantee = 'service_role'
-- group by grantee, table_name order by table_name;
-- -- Erwartung: 42 Zeilen, jede mit 7 Privilegien:
-- --   'DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE'
--
-- -- (V4) service_role -- Sequenz-Privilegien via PostgreSQL-Built-in
-- select
--   c.relname as sequence_name,
--   has_sequence_privilege('service_role', 'public.' || c.relname, 'USAGE')  as has_usage,
--   has_sequence_privilege('service_role', 'public.' || c.relname, 'SELECT') as has_select,
--   has_sequence_privilege('service_role', 'public.' || c.relname, 'UPDATE') as has_update
-- from pg_class c
-- join pg_namespace n on n.oid = c.relnamespace
-- where n.nspname = 'public' and c.relkind = 'S'
-- order by c.relname;
-- -- Erwartung: 2 Zeilen, beide mit has_usage=true, has_select=true, has_update=true
-- -- (= alle drei Sequenz-Privilegien, da `grant all` USAGE+SELECT+UPDATE umfasst)
-- =============================================================================
