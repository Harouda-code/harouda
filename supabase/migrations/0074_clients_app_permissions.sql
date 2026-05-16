-- ════════════════════════════════════════════════════════════════════════════
-- Migration 0074: clients.app_permissions — Permission-Matrix auf Mandant-Ebene
-- ════════════════════════════════════════════════════════════════════════════
--
-- Zweck:
--   Erweitert die bestehende Tabelle public.clients um eine JSONB-Spalte
--   app_permissions zur Mandant-spezifischen Steuerung der Mobile-App-
--   Berechtigungen. Default ist restriktiv (mobile_app_enabled = false);
--   die Kanzlei aktiviert Features explizit pro Mandant.
--
-- Hintergrund:
--   Strategische Entscheidung E3 (Beschraenkung der Finanzansicht in der
--   Mobile-App): KEIN BWA, KEINE Saldenliste, KEINE Lohndaten (Art. 9 DSGVO),
--   KEIN UStVA-Status, KEINE Steuerberatung (§§ 3, 5 StBerG). Die konkreten
--   Feature-Flags werden auf zwei Ebenen gehalten:
--     - clients.app_permissions: Mandant-Default (diese Migration)
--     - client_app_users.app_permissions: Person-spezifische Uebersteuerung
--   Die Anwendungsschicht kombiniert beide Ebenen (User-Override ueber
--   Mandant-Default), niemals umgekehrt.
--
-- Rechtsgrundlage:
--   - § 30 AO (Steuergeheimnis): Restrictiver Default, explizite
--     Freischaltung pro Mandant
--   - DSGVO Art. 5 Abs. 1 lit. c (Datenminimierung)
--   - DSGVO Art. 25 (Datenschutz durch Technikgestaltung; Privacy by
--     Default)
--   - DSGVO Art. 9 (besondere Kategorien — Lohndaten ausgeschlossen)
--   - §§ 3, 5 StBerG (Steuerberatung als Vorbehaltsaufgabe — kein
--     Beratungs-Feature in Mobile-App)
--   - GoBD (BMF 14.07.2025), Rz. 58 ff.: Aenderungen an Permissions
--     werden ueber audit_log (CDC-Pattern, bestehend seit 0002/0003)
--     automatisch erfasst — keine zusaetzlichen Trigger noetig.
--
-- Schema des JSONB-Objekts (version 1):
--   {
--     "version": 1,                  // Pflicht, Integer
--     "mobile_app_enabled": bool,    // Pflicht, default false
--     "beleg_upload_enabled": bool,  // optional, default false
--     "beleg_status_visible": bool,  // optional, default false
--     "opos_visible": bool,          // optional, default false
--     "e_invoice_enabled": bool      // optional, default false
--   }
--
-- Design-Entscheidungen:
--   - JSONB statt einzelner BOOLEAN-Spalten: erlaubt Feature-Erweiterung
--     ohne Schema-Migration, mit Versionierung des Schemas.
--   - NOT NULL mit DEFAULT: Postgres >= 11 erfordert keinen Table-Rewrite
--     fuer NOT NULL + DEFAULT (effiziente Implementierung).
--   - Restriktiver Default: nicht-explizite Mandanten haben keinen
--     Mobile-App-Zugriff. Privacy by Default.
--   - Validierung als CHECK-Constraint (Struktur + Pflichtfelder).
--     Detailliertere Validierung (z.B. unbekannte Felder) in der
--     Anwendungsschicht.
--   - Diese Migration AeNDERT WEDER RLS NOCH BERECHTIGUNGEN von
--     public.clients — beide bleiben unveraendert wie aus Vor-Migrations.
--
-- Folge-Migrations:
--   0076: RLS-Policies auf belege/Storage referenzieren app_permissions
--   0078: Custom Access Token Hook prueft mobile_app_enabled
--
-- ════════════════════════════════════════════════════════════════════════════

BEGIN;

ALTER TABLE public.clients
  ADD COLUMN app_permissions JSONB NOT NULL DEFAULT jsonb_build_object(
    'version', 1,
    'mobile_app_enabled', false
  );

-- Struktur-Validierung: muss JSON-Objekt sein (kein Array, kein Primitive)
ALTER TABLE public.clients
  ADD CONSTRAINT chk_clients_app_permissions_is_object
  CHECK (jsonb_typeof(app_permissions) = 'object');

-- Pflichtfeld version: muss existieren und positive Ganzzahl sein
ALTER TABLE public.clients
  ADD CONSTRAINT chk_clients_app_permissions_version
  CHECK (
    (app_permissions ->> 'version') IS NOT NULL
    AND (app_permissions ->> 'version') ~ '^[1-9][0-9]*$'
  );

-- Pflichtfeld mobile_app_enabled: muss existieren und Boolean sein
ALTER TABLE public.clients
  ADD CONSTRAINT chk_clients_app_permissions_mobile_enabled
  CHECK (
    app_permissions ? 'mobile_app_enabled'
    AND jsonb_typeof(app_permissions -> 'mobile_app_enabled') = 'boolean'
  );

-- Optionale Feature-Flags: wenn gesetzt, muss Boolean sein
ALTER TABLE public.clients
  ADD CONSTRAINT chk_clients_app_permissions_optional_flags
  CHECK (
    (app_permissions -> 'beleg_upload_enabled' IS NULL
      OR jsonb_typeof(app_permissions -> 'beleg_upload_enabled') = 'boolean')
    AND (app_permissions -> 'beleg_status_visible' IS NULL
      OR jsonb_typeof(app_permissions -> 'beleg_status_visible') = 'boolean')
    AND (app_permissions -> 'opos_visible' IS NULL
      OR jsonb_typeof(app_permissions -> 'opos_visible') = 'boolean')
    AND (app_permissions -> 'e_invoice_enabled' IS NULL
      OR jsonb_typeof(app_permissions -> 'e_invoice_enabled') = 'boolean')
  );

COMMENT ON COLUMN public.clients.app_permissions IS
  'Mobile-App Permission-Matrix auf Mandant-Ebene. Schema-Version im version-Feld. Restriktiver Default (mobile_app_enabled=false). Aenderungen werden ueber audit_log CDC-Pattern erfasst.';

COMMIT;

-- ════════════════════════════════════════════════════════════════════════════
-- Rollback (manuell):
--   BEGIN;
--   ALTER TABLE public.clients
--     DROP CONSTRAINT IF EXISTS chk_clients_app_permissions_optional_flags;
--   ALTER TABLE public.clients
--     DROP CONSTRAINT IF EXISTS chk_clients_app_permissions_mobile_enabled;
--   ALTER TABLE public.clients
--     DROP CONSTRAINT IF EXISTS chk_clients_app_permissions_version;
--   ALTER TABLE public.clients
--     DROP CONSTRAINT IF EXISTS chk_clients_app_permissions_is_object;
--   ALTER TABLE public.clients DROP COLUMN IF EXISTS app_permissions;
--   COMMIT;
-- ════════════════════════════════════════════════════════════════════════════
