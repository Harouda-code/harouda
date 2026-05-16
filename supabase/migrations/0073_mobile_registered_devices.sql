-- ════════════════════════════════════════════════════════════════════════════
-- Migration 0073: mobile_registered_devices — Geraete-Bindung fuer Mobile-App
-- ════════════════════════════════════════════════════════════════════════════
--
-- Zweck:
--   Erstellt die Tabelle mobile_registered_devices zur kryptographischen
--   Bindung physischer Endgeraete an die Verknuepfung (auth.users, clients).
--   Jedes Geraet hinterlegt einen oeffentlichen Schluessel, dessen privater
--   Gegenpart im Hardware-Schluesselspeicher des Geraets (Secure Enclave /
--   StrongBox / TEE) verbleibt und das Geraet niemals verlaesst.
--
-- Hintergrund:
--   Strategische Entscheidung E7 (Multi-Channel-Bootstrapping mit kryptogra-
--   phischer Geraete-Bindung) und E8 (OAuth Authorization Code Flow + PKCE
--   + Refresh Token Rotation mit Reuse Detection; ein aktives Geraet pro
--   Mandanten-Kontext). Die Tabelle ist Grundlage fuer Token-Ausstellung,
--   Reuse-Detection und Geraete-Widerruf.
--
-- Rechtsgrundlage:
--   - DSGVO Art. 32 (Sicherheit der Verarbeitung; Stand der Technik)
--   - § 30 AO (Steuergeheimnis): Pseudonymisierung des Zugangs ueber
--     Geraete-Public-Keys statt direkter Authentifizierung mit Klartext-
--     Geheimnissen
--   - GoBD (BMF 14.07.2025), Rz. 58 ff.: Audit-Pflicht fuer Geraete-
--     Registrierungen und -Widerrufe
--   - BSI TR-02102-1 (Version 2026-01): Kryptographische Verfahren
--   - BSI IT-Grundschutz CON.8 (Software-Entwicklung), APP.4.3 (Mobile
--     Anwendungen)
--   - IETF RFC 9700 (BCP 240, Januar 2025): OAuth 2.0 Security Best
--     Current Practice
--
-- Design-Entscheidungen:
--   - device_public_key als TEXT (base64- oder hex-kodiert); Format-
--     Validierung in der Anwendungsschicht, da formatabhaengig vom
--     Schluessel-Algorithmus (ED25519 / P-256). Schema-Constraint nur
--     auf Nicht-Leere.
--   - revoked_reason zwingend gesetzt, sobald revoked_at gesetzt ist —
--     keine stillen Widerrufe ohne Grund (Audit-Anforderung).
--   - revoked_reason 'reuse_detected' deckt RFC 9700, § 4.14 ab
--     (Refresh-Token-Reuse-Detection).
--   - Genau eine aktive Geraete-Registrierung pro (user_id, client_id) —
--     Geraete-Wechsel erfordert Widerruf des vorherigen Eintrags.
--   - RLS in dieser Migration aktiviert (FORCE) OHNE Policies →
--     Tabelle vollstaendig gesperrt bis Migration 0076.
--
-- Folge-Migrations:
--   0076: RLS-Policies (Lese-/Schreibrechte fuer registriertes Geraet)
--   0078: Custom Access Token Hook prueft aktive Registrierung
--
-- ════════════════════════════════════════════════════════════════════════════

BEGIN;

CREATE TABLE public.mobile_registered_devices (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id         UUID NOT NULL REFERENCES public.clients(id) ON DELETE RESTRICT,
  device_public_key TEXT NOT NULL,
  platform          TEXT NOT NULL CHECK (platform IN ('ios', 'android')),
  device_label      TEXT,
  app_version       TEXT,
  os_version        TEXT,
  registered_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_seen_at      TIMESTAMPTZ,
  revoked_at        TIMESTAMPTZ,
  revoked_reason    TEXT,

  CONSTRAINT chk_revoked_reason_values CHECK (
    revoked_reason IS NULL OR revoked_reason IN (
      'user_request',
      'admin_revocation',
      'suspicious_activity',
      'reuse_detected'
    )
  ),

  CONSTRAINT chk_revoked_consistency CHECK (
    (revoked_at IS NULL AND revoked_reason IS NULL) OR
    (revoked_at IS NOT NULL AND revoked_reason IS NOT NULL)
  ),

  CONSTRAINT chk_last_seen_after_registered CHECK (
    last_seen_at IS NULL OR last_seen_at >= registered_at
  ),

  CONSTRAINT chk_device_public_key_not_empty CHECK (
    length(device_public_key) > 0
  )
);

COMMENT ON TABLE public.mobile_registered_devices IS
  'Kryptographisch gebundene Endgeraete-Registrierungen fuer Mobile-App. Pro (user_id, client_id) nur eine aktive Zeile (revoked_at IS NULL).';

COMMENT ON COLUMN public.mobile_registered_devices.device_public_key IS
  'Oeffentlicher Schluessel aus Hardware-Schluesselspeicher (Secure Enclave / StrongBox / TEE). Privater Gegenpart verlaesst das Geraet nie. Format-Validierung in der Anwendungsschicht.';

COMMENT ON COLUMN public.mobile_registered_devices.platform IS
  'ios | android — relevant fuer Hardware-Schluesselspeicher-Strategie und Plattform-spezifische Sicherheits-Pruefungen.';

COMMENT ON COLUMN public.mobile_registered_devices.device_label IS
  'Vom Nutzer vergebener oder vom System abgeleiteter Geraete-Name (z.B. Modellbezeichnung). Nur Anzeige, keine Sicherheitsrelevanz.';

COMMENT ON COLUMN public.mobile_registered_devices.last_seen_at IS
  'Zeitpunkt der letzten erfolgreichen Token-Operation des Geraets. Dient der Inaktivitaets-Erkennung.';

COMMENT ON COLUMN public.mobile_registered_devices.revoked_at IS
  'Zeitpunkt des Widerrufs. NULL = aktiv. Soft-Delete-Pattern fuer GoBD-Auditspur.';

COMMENT ON COLUMN public.mobile_registered_devices.revoked_reason IS
  'Grund des Widerrufs: user_request (Nutzer-initiiert) | admin_revocation (Kanzlei-initiiert) | suspicious_activity (Heuristik) | reuse_detected (Refresh-Token-Reuse gemaess RFC 9700, § 4.14).';

-- Genau eine aktive Geraete-Registrierung pro (Person, Mandant)
CREATE UNIQUE INDEX idx_mobile_registered_devices_active_unique
  ON public.mobile_registered_devices (user_id, client_id)
  WHERE revoked_at IS NULL;

-- Performance-Indexe fuer spaetere RLS-Lookups (Policies in 0076)
CREATE INDEX idx_mobile_registered_devices_user_id_active
  ON public.mobile_registered_devices (user_id)
  WHERE revoked_at IS NULL;

CREATE INDEX idx_mobile_registered_devices_client_id_active
  ON public.mobile_registered_devices (client_id)
  WHERE revoked_at IS NULL;

-- RLS aktivieren UND erzwingen (auch fuer Tabellen-Eigentuemer)
-- WICHTIG: KEINE Policies in dieser Migration → Tabelle vollstaendig
--          gesperrt, bis Migration 0076 die Policies hinzufuegt.
ALTER TABLE public.mobile_registered_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mobile_registered_devices FORCE ROW LEVEL SECURITY;

-- Default-Berechtigungen explizit widerrufen (Pattern wie audit_log und 0072)
REVOKE ALL ON public.mobile_registered_devices FROM PUBLIC;
REVOKE ALL ON public.mobile_registered_devices FROM authenticated;
REVOKE ALL ON public.mobile_registered_devices FROM anon;

COMMIT;

-- ════════════════════════════════════════════════════════════════════════════
-- Rollback (manuell):
--   BEGIN;
--   DROP TABLE IF EXISTS public.mobile_registered_devices CASCADE;
--   COMMIT;
-- ════════════════════════════════════════════════════════════════════════════
