-- migration: 0055_revoke_anon_authenticated_sequence_update.sql
-- charge:    19, phase 2, step 4
-- schuld:    19-zayin
-- vorgaenger: 0054_grant_authenticated_public_tables.sql

-- ---------------------------------------------------------------------------
-- zweck
-- ---------------------------------------------------------------------------
-- entzieht das UPDATE-privileg auf alle sequenzen des schemas public von
-- den rollen anon und authenticated. die betroffenen privilegien sind
-- pre-existing (nicht durch 0054 verursacht). entdeckt in der post-apply
-- verifikation v2 zu 0054 via acl-diagnostik (pg_class.relacl +
-- aclexplode) -- information_schema.role_usage_grants war als alleinige
-- quelle unzureichend (lehre 58).

-- ---------------------------------------------------------------------------
-- scope (in-scope)
-- ---------------------------------------------------------------------------
--   * REVOKE UPDATE on all sequences in schema public from anon,
--     authenticated.
--   * wirkt zum migration-zeitpunkt auf:
--       public.account_report_mapping_id_seq
--       public.report_lines_id_seq

-- ---------------------------------------------------------------------------
-- nicht im scope (out-of-scope)
-- ---------------------------------------------------------------------------
--   * USAGE fuer authenticated auf sequenzen (bleibt, intendiert per 0054).
--   * ALL fuer service_role auf sequenzen (bleibt, intendiert per 0054).
--   * tabellen-grants jeglicher art.
--   * RLS-policy-aenderungen.
--   * helper-function-EXECUTE-hardening (schuld 19-gimel).
--   * ALTER DEFAULT PRIVILEGES-cleanup (schuld 19-he).
--   * storage-schema-/bucket-privilegien.
--   * triggers.

-- ---------------------------------------------------------------------------
-- idempotenz
-- ---------------------------------------------------------------------------
-- REVOKE auf nicht-existierende privilegien ist in PostgreSQL ein no-op.
-- mehrfaches anwenden ist gefahrlos.

-- ---------------------------------------------------------------------------
-- aktiver befehl (genau einer)
-- ---------------------------------------------------------------------------

revoke update on all sequences in schema public from anon, authenticated;

-- ---------------------------------------------------------------------------
-- post-apply verifikation v1-v4 (manuell im supabase sql editor ausfuehren)
-- ---------------------------------------------------------------------------

-- (V1) authenticated behaelt USAGE auf beide sequenzen
-- select has_sequence_privilege('authenticated', 'public.account_report_mapping_id_seq', 'USAGE');
-- erwartet: true
-- select has_sequence_privilege('authenticated', 'public.report_lines_id_seq', 'USAGE');
-- erwartet: true

-- (V2) authenticated hat KEIN UPDATE mehr auf beide sequenzen
-- select has_sequence_privilege('authenticated', 'public.account_report_mapping_id_seq', 'UPDATE');
-- erwartet: false
-- select has_sequence_privilege('authenticated', 'public.report_lines_id_seq', 'UPDATE');
-- erwartet: false

-- (V3) anon hat KEIN UPDATE mehr auf beide sequenzen
-- select has_sequence_privilege('anon', 'public.account_report_mapping_id_seq', 'UPDATE');
-- erwartet: false
-- select has_sequence_privilege('anon', 'public.report_lines_id_seq', 'UPDATE');
-- erwartet: false

-- (V4) service_role behaelt USAGE + SELECT + UPDATE auf beide sequenzen
-- select
--   has_sequence_privilege('service_role', 'public.account_report_mapping_id_seq', 'USAGE')  as arm_usage,
--   has_sequence_privilege('service_role', 'public.account_report_mapping_id_seq', 'SELECT') as arm_select,
--   has_sequence_privilege('service_role', 'public.account_report_mapping_id_seq', 'UPDATE') as arm_update,
--   has_sequence_privilege('service_role', 'public.report_lines_id_seq', 'USAGE')            as rl_usage,
--   has_sequence_privilege('service_role', 'public.report_lines_id_seq', 'SELECT')           as rl_select,
--   has_sequence_privilege('service_role', 'public.report_lines_id_seq', 'UPDATE')           as rl_update;
-- erwartet: alle sechs spalten = true

-- ende migration 0055
