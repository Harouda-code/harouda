import { describe, it, expect, beforeAll } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

describe('Migration 0073: mobile_registered_devices', () => {
  let sql: string;

  beforeAll(() => {
    const path = resolve(
      process.cwd(),
      'supabase/migrations/0073_mobile_registered_devices.sql',
    );
    sql = readFileSync(path, 'utf-8');
  });

  describe('Header & Struktur', () => {
    it('enthaelt Migrations-Header mit Zweck und Rechtsgrundlage', () => {
      expect(sql).toMatch(/Migration 0073: mobile_registered_devices/);
      expect(sql).toMatch(/Zweck:/);
      expect(sql).toMatch(/Rechtsgrundlage:/);
      expect(sql).toMatch(/DSGVO Art\. 32/);
      expect(sql).toMatch(/§ 30 AO/);
      expect(sql).toMatch(/GoBD/);
    });

    it('verweist auf strategische Entscheidungen E7 und E8', () => {
      expect(sql).toMatch(/E7/);
      expect(sql).toMatch(/E8/);
    });

    it('verweist auf BSI und RFC 9700', () => {
      expect(sql).toMatch(/BSI TR-02102-1/);
      expect(sql).toMatch(/RFC 9700/);
    });

    it('verweist auf Folge-Migrations 0076 und 0078', () => {
      expect(sql).toMatch(/0076/);
      expect(sql).toMatch(/0078/);
    });

    it('laeuft in einer Transaktion', () => {
      expect(sql).toMatch(/^BEGIN;/m);
      expect(sql).toMatch(/^COMMIT;/m);
    });
  });

  describe('Tabellen-Definition', () => {
    it('erstellt Tabelle public.mobile_registered_devices', () => {
      expect(sql).toMatch(/CREATE TABLE public\.mobile_registered_devices/);
    });

    it('definiert id als UUID PRIMARY KEY mit gen_random_uuid()', () => {
      expect(sql).toMatch(/id\s+UUID PRIMARY KEY DEFAULT gen_random_uuid\(\)/);
    });

    it('definiert user_id als FK auf auth.users mit ON DELETE CASCADE', () => {
      expect(sql).toMatch(
        /user_id\s+UUID NOT NULL REFERENCES auth\.users\(id\) ON DELETE CASCADE/,
      );
    });

    it('definiert client_id als FK auf clients mit ON DELETE RESTRICT', () => {
      expect(sql).toMatch(
        /client_id\s+UUID NOT NULL REFERENCES public\.clients\(id\) ON DELETE RESTRICT/,
      );
    });

    it('definiert device_public_key als TEXT NOT NULL', () => {
      expect(sql).toMatch(/device_public_key\s+TEXT NOT NULL/);
    });

    it('definiert platform mit CHECK auf ios|android', () => {
      expect(sql).toMatch(
        /platform\s+TEXT NOT NULL CHECK \(platform IN \('ios', 'android'\)\)/,
      );
    });

    it('definiert device_label, app_version, os_version als optionale TEXT-Felder', () => {
      expect(sql).toMatch(/device_label\s+TEXT/);
      expect(sql).toMatch(/app_version\s+TEXT/);
      expect(sql).toMatch(/os_version\s+TEXT/);
    });

    it('definiert registered_at als TIMESTAMPTZ NOT NULL DEFAULT NOW()', () => {
      expect(sql).toMatch(
        /registered_at\s+TIMESTAMPTZ NOT NULL DEFAULT NOW\(\)/,
      );
    });

    it('definiert last_seen_at, revoked_at als TIMESTAMPTZ (optional)', () => {
      expect(sql).toMatch(/last_seen_at\s+TIMESTAMPTZ/);
      expect(sql).toMatch(/revoked_at\s+TIMESTAMPTZ/);
    });

    it('definiert revoked_reason als TEXT (optional)', () => {
      expect(sql).toMatch(/revoked_reason\s+TEXT/);
    });
  });

  describe('Constraints', () => {
    it('enthaelt chk_revoked_reason_values mit den vier erlaubten Werten', () => {
      expect(sql).toMatch(/CONSTRAINT chk_revoked_reason_values/);
      expect(sql).toMatch(/'user_request'/);
      expect(sql).toMatch(/'admin_revocation'/);
      expect(sql).toMatch(/'suspicious_activity'/);
      expect(sql).toMatch(/'reuse_detected'/);
    });

    it('enthaelt chk_revoked_consistency (revoked_at <-> revoked_reason)', () => {
      expect(sql).toMatch(/CONSTRAINT chk_revoked_consistency/);
    });

    it('enthaelt chk_last_seen_after_registered', () => {
      expect(sql).toMatch(/CONSTRAINT chk_last_seen_after_registered/);
      expect(sql).toMatch(/last_seen_at\s*>=\s*registered_at/);
    });

    it('enthaelt chk_device_public_key_not_empty', () => {
      expect(sql).toMatch(/CONSTRAINT chk_device_public_key_not_empty/);
      expect(sql).toMatch(/length\(device_public_key\)\s*>\s*0/);
    });
  });

  describe('Indexe', () => {
    it('erstellt eindeutigen Partial-Index fuer aktive Registrierungen', () => {
      expect(sql).toMatch(
        /CREATE UNIQUE INDEX idx_mobile_registered_devices_active_unique/,
      );
      const uniqueIdxBlock = sql.match(
        /CREATE UNIQUE INDEX idx_mobile_registered_devices_active_unique[\s\S]*?;/,
      );
      expect(uniqueIdxBlock?.[0]).toMatch(/WHERE revoked_at IS NULL/);
    });

    it('erstellt Performance-Indexe auf user_id und client_id (active)', () => {
      expect(sql).toMatch(
        /CREATE INDEX idx_mobile_registered_devices_user_id_active/,
      );
      expect(sql).toMatch(
        /CREATE INDEX idx_mobile_registered_devices_client_id_active/,
      );
    });
  });

  describe('Row Level Security', () => {
    it('aktiviert RLS', () => {
      expect(sql).toMatch(
        /ALTER TABLE public\.mobile_registered_devices ENABLE ROW LEVEL SECURITY/,
      );
    });

    it('erzwingt RLS (FORCE) — auch fuer Tabellen-Eigentuemer', () => {
      expect(sql).toMatch(
        /ALTER TABLE public\.mobile_registered_devices FORCE ROW LEVEL SECURITY/,
      );
    });

    it('enthaelt KEINE Policies (kommen erst in Migration 0076)', () => {
      expect(sql).not.toMatch(/CREATE POLICY/);
    });
  });

  describe('Berechtigungen', () => {
    it('widerruft alle Default-Berechtigungen explizit', () => {
      expect(sql).toMatch(
        /REVOKE ALL ON public\.mobile_registered_devices FROM PUBLIC/,
      );
      expect(sql).toMatch(
        /REVOKE ALL ON public\.mobile_registered_devices FROM authenticated/,
      );
      expect(sql).toMatch(
        /REVOKE ALL ON public\.mobile_registered_devices FROM anon/,
      );
    });
  });

  describe('Rollback-Dokumentation', () => {
    it('dokumentiert Rollback-Vorgehen', () => {
      expect(sql).toMatch(/Rollback/);
      expect(sql).toMatch(
        /DROP TABLE IF EXISTS public\.mobile_registered_devices CASCADE/,
      );
    });
  });
});
