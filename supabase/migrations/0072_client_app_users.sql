-- ════════════════════════════════════════════════════════════════════════════
-- Migration 0072: client_app_users — Mobile-App Mandant-Identifikation
-- ════════════════════════════════════════════════════════════════════════════
--
-- Zweck:
--   Erstellt die Tabelle client_app_users zur Verknüpfung von auth.users
--   (Person) mit clients (Mandant der Kanzlei) für die Mobile-App.
--
-- Hintergrund:
--   Die Mobile-App wird ausschließlich von Mandanten genutzt — nicht von
--   Kanzlei-Mitarbeitern. Diese Personen sind KEINE company_members und
--   benötigen ein eigenes Berechtigungs-Modell mit strikter Trennung.
--   client_app_users dient als Bindeglied zwischen auth.users und clients.
--
-- Rechtsgrundlage:
--   - § 30 AO (Steuergeheimnis): Strikte Trennung Mandant ↔ Kanzlei-MA
--   - DSGVO Art. 5, 25, 32: Datenminimierung, Privacy by Design
--   - GoBD (BMF 14.07.2025), Rz. 58 ff.: Audit-Pflicht für
--     Berechtigungsänderungen
--
-- Design-Entscheidungen:
--   - Mehrfache Verknüpfungen pro Person erlaubt (z.B. GbR mit mehreren
--     Mandanten), aber nur EINE AKTIVE pro (user_id, client_id).
--   - Soft-Delete via revoked_at; harte DELETE in 0076 per RLS unterbunden.
--   - RLS in dieser Migration aktiviert (FORCE) OHNE Policies →
--     Tabelle vollständig gesperrt bis Migration 0076.
--
-- Folge-Migrations:
--   0076: RLS-Policies + Helper-Funktion is_client_app_user(client_id)
--   0078: Custom Access Token Hook nutzt diese Tabelle
--
-- ════════════════════════════════════════════════════════════════════════════

BEGIN;

CREATE TABLE public.client_app_users (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id       UUID NOT NULL REFERENCES public.clients(id) ON DELETE RESTRICT,
  role            TEXT NOT NULL CHECK (role IN ('hauptkontakt', 'mitbenutzer')),
  app_permissions JSONB NOT NULL DEFAULT '{"version": 1}'::jsonb,
  activated_at    TIMESTAMPTZ,
  revoked_at      TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT chk_revoked_after_activated
    CHECK (revoked_at IS NULL OR activated_at IS NULL OR revoked_at >= activated_at)
);

COMMENT ON TABLE public.client_app_users IS
  'Verknüpfung auth.users <-> clients für Mobile-App-Zugriff. Pro (user_id, client_id) nur eine aktive Zeile (revoked_at IS NULL).';

COMMENT ON COLUMN public.client_app_users.role IS
  'hauptkontakt = primaerer Mandanten-Vertreter; mitbenutzer = zusaetzlicher berechtigter Zugang';

COMMENT ON COLUMN public.client_app_users.app_permissions IS
  'JSONB-Konfiguration der App-Berechtigungen. Schema-Version im version-Feld.';

COMMENT ON COLUMN public.client_app_users.activated_at IS
  'Zeitpunkt der Aktivierung durch die Kanzlei. NULL = noch nicht aktiviert.';

COMMENT ON COLUMN public.client_app_users.revoked_at IS
  'Zeitpunkt des Widerrufs. NULL = aktiv. Soft-Delete-Pattern fuer GoBD-Auditspur.';

-- Eindeutigkeit: Nur eine aktive Verknuepfung pro (user_id, client_id)
CREATE UNIQUE INDEX idx_client_app_users_active_unique
  ON public.client_app_users (user_id, client_id)
  WHERE revoked_at IS NULL;

-- Performance-Indexe fuer spaetere RLS-Lookups (Policies in 0076)
CREATE INDEX idx_client_app_users_user_id_active
  ON public.client_app_users (user_id)
  WHERE revoked_at IS NULL;

CREATE INDEX idx_client_app_users_client_id_active
  ON public.client_app_users (client_id)
  WHERE revoked_at IS NULL;

-- RLS aktivieren UND erzwingen (auch fuer Tabellen-Eigentuemer)
-- WICHTIG: KEINE Policies in dieser Migration → Tabelle vollstaendig
--          gesperrt, bis Migration 0076 die Policies hinzufuegt.
ALTER TABLE public.client_app_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_app_users FORCE ROW LEVEL SECURITY;

-- Default-Berechtigungen explizit widerrufen (Pattern wie audit_log)
REVOKE ALL ON public.client_app_users FROM PUBLIC;
REVOKE ALL ON public.client_app_users FROM authenticated;
REVOKE ALL ON public.client_app_users FROM anon;

COMMIT;

-- ════════════════════════════════════════════════════════════════════════════
-- Rollback (manuell):
--   BEGIN;
--   DROP TABLE IF EXISTS public.client_app_users CASCADE;
--   COMMIT;
-- ════════════════════════════════════════════════════════════════════════════
