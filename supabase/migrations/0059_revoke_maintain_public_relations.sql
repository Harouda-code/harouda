-- migration: 0059_revoke_maintain_public_relations
-- charge: 0061-b-v1
-- schuld: 28.11 / 20-aleph
-- vorgaenger: 0058_company_bootstrap_rpc.sql
--
-- zweck
-- ---------------------------------------------------------------------------
-- entzieht das in PG17 eingefuehrte privileg MAINTAIN von den rollen
-- anon, authenticated und service_role auf allen relationen im schema
-- public. zuvor werden die default privileges unter dem owner postgres
-- so angepasst, dass kuenftige relationen, die unter postgres-ownership
-- entstehen, dieses privileg nicht erneut erben.
--
-- urspruenglich entdeckt in Charge 20 V5-A4/A6 als drift gegenueber dem
-- erwarteten privilegien-set (Lehre 58: aclexplode statt
-- information_schema). der erste befund umfasste 41 anwendungs-
-- tabellen x 4 rollen = 164 grants. Charge 0060 hat die evidenz auf
-- 42 public-relationen ausgeweitet (41 ordinary tables + 1 view
-- public.health_check), ergibt 168 direkte MAINTAIN-rows fuer die vier
-- rollen anon, authenticated, service_role, postgres. Charge 0061-A
-- hat empirisch bestaetigt, dass kein anwendungspfad MAINTAIN unter
-- den drei ziel-rollen (anon, authenticated, service_role) benoetigt:
--   * pg_cron ist nicht installiert
--   * keine materialized views in public
--   * keine public function-bodies enthalten
--     VACUUM/ANALYZE/REINDEX/CLUSTER/LOCK TABLE/REFRESH MATERIALIZED VIEW/
--     MAINTAIN
--   * keine non-aggregate function-bodies referenzieren service_role
--     in MAINTAIN-relevantem kontext
--
-- v1-scope (in-scope)
-- ---------------------------------------------------------------------------
--   * ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public REVOKE
--     MAINTAIN ON TABLES FROM anon, authenticated, service_role.
--   * REVOKE MAINTAIN ON ALL TABLES IN SCHEMA public FROM anon,
--     authenticated, service_role. wirkt auf alle 42 relationen
--     (41 ordinary tables + view public.health_check). die clause
--     ALL TABLES IN SCHEMA public umfasst auch views.
--
-- bewusst nicht in v1 (residual follow-up)
-- ---------------------------------------------------------------------------
-- ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public REVOKE
-- MAINTAIN ON TABLES FROM anon/authenticated/service_role wurde aus dem
-- v1-scope ausgeschlossen, weil eine pre-apply-capability-pruefung (V0)
-- gezeigt hat, dass der aktuell verfuegbare apply-kontext (current_user
-- postgres) nicht fuer die rolle supabase_admin handeln kann. die
-- entsprechenden statements wuerden zur apply-zeit fehlschlagen.
--
-- residuelles risiko: kuenftige public-relationen, die unter dem
-- ownership supabase_admin angelegt werden, koennen MAINTAIN ueber den
-- noch verschmutzten supabase_admin-default-acl-eintrag erneut erben,
-- bis eine spaetere migration unter einem apply-kontext laeuft, der
-- fuer supabase_admin handeln kann. dieser residual ist ein
-- ausstehender follow-up und wird in der nachgelagerten review-/append-
-- phase separat dokumentiert.
--
-- nicht im scope (out-of-scope)
-- ---------------------------------------------------------------------------
--   * MAINTAIN auf der rolle postgres bleibt unveraendert.
--   * mitgliedschaft in pg_maintain bleibt unveraendert.
--   * andere privilegien (SELECT/INSERT/UPDATE/DELETE/TRUNCATE/TRIGGER/
--     REFERENCES/USAGE) bleiben unveraendert.
--   * default-privilege-cleanup fuer TRUNCATE/TRIGGER/REFERENCES bleibt
--     ausserhalb dieses scopes (schuld 19-he, eigene charge).
--   * function-EXECUTE-hardening bleibt ausserhalb (schuld 19-gimel).
--   * RLS-policies bleiben unveraendert.
--   * audit_log-schema bleibt unveraendert.
--   * frontend/applikationsschicht wird nicht beruehrt.
--
-- reihenfolge innerhalb dieser migration
-- ---------------------------------------------------------------------------
-- 1) zuerst default-privilege-cleanup unter owner postgres. damit werden
--    alle relationen, die waehrend der migration unter postgres-ownership
--    entstehen, bereits ohne MAINTAIN geboren.
-- 2) dann object-level REVOKE auf den existierenden 42 relationen. damit
--    werden die historisch eingetragenen grants entfernt.
--
-- idempotenz
-- ---------------------------------------------------------------------------
-- REVOKE auf nicht-existierende privilegien ist in PostgreSQL ein no-op.
-- ALTER DEFAULT PRIVILEGES ... REVOKE auf nicht vorhandene default-acl-
-- eintraege ist ebenfalls ein no-op. mehrfaches anwenden dieser migration
-- ist gefahrlos.

-- 1) default-privileges unter owner postgres (zuerst, siehe reihenfolge)
alter default privileges
  for role postgres
  in schema public
  revoke maintain on tables from anon;

alter default privileges
  for role postgres
  in schema public
  revoke maintain on tables from authenticated;

alter default privileges
  for role postgres
  in schema public
  revoke maintain on tables from service_role;

-- 2) object-level: bestehende MAINTAIN-grants entziehen
revoke maintain on all tables in schema public from anon;
revoke maintain on all tables in schema public from authenticated;
revoke maintain on all tables in schema public from service_role;
