import { describe, it, expect, beforeAll } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

describe('Migration 0072: client_app_users', () => {
  let sql: string;

  beforeAll(() => {
    const path = resolve(
      process.cwd(),
      'supabase/migrations/0072_client_app_users.sql',
    );
    sql = readFileSync(path, 'utf-8');
  });

  describe('Header & Struktur', () => {
    it('enthaelt Migrations-Header mit Zweck und Rechtsgrundlage', () => {
      expect(sql).toMatch(/Migration 0072: client_app_users/);
      expect(sql).toMatch(/Zweck:/);
      expect(sql).toMatch(/Rechtsgrundlage:/);
      expect(sql).toMatch(/§ 30 AO/);
      expect(sql).toMatch(/DSGVO Art\. 5, 25, 32/);
      expect(sql).toMatch(/GoBD/);
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
    it('erstellt Tabelle public.client_app_users', () => {
      expect(sql).toMatch(/CREATE TABLE public\.client_app_users/);
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

    it('definiert role mit CHECK auf hauptkontakt|mitbenutzer', () => {
      expect(sql).toMatch(
        /role\s+TEXT NOT NULL CHECK \(role IN \('hauptkontakt', 'mitbenutzer'\)\)/,
      );
    });

    it('definiert app_permissions als JSONB NOT NULL mit Default version=1', () => {
      expect(sql).toMatch(/app_permissions\s+JSONB NOT NULL DEFAULT/);
      expect(sql).toMatch(/"version":\s*1/);
    });

    it('definiert activated_at und revoked_at als TIMESTAMPTZ', () => {
      expect(sql).toMatch(/activated_at\s+TIMESTAMPTZ/);
      expect(sql).toMatch(/revoked_at\s+TIMESTAMPTZ/);
    });

    it('definiert created_at als TIMESTAMPTZ NOT NULL DEFAULT NOW()', () => {
      expect(sql).toMatch(/created_at\s+TIMESTAMPTZ NOT NULL DEFAULT NOW\(\)/);
    });

    it('enthaelt Konsistenz-Constraint chk_revoked_after_activated', () => {
      expect(sql).toMatch(/CONSTRAINT chk_revoked_after_activated/);
      expect(sql).toMatch(/revoked_at\s*>=\s*activated_at/);
    });
  });

  describe('Indexe', () => {
    it('erstellt eindeutigen Partial-Index fuer aktive Verknuepfungen', () => {
      expect(sql).toMatch(
        /CREATE UNIQUE INDEX idx_client_app_users_active_unique/,
      );
      const uniqueIdxBlock = sql.match(
        /CREATE UNIQUE INDEX idx_client_app_users_active_unique[\s\S]*?;/,
      );
      expect(uniqueIdxBlock?.[0]).toMatch(/WHERE revoked_at IS NULL/);
    });

    it('erstellt Performance-Indexe auf user_id und client_id (active)', () => {
      expect(sql).toMatch(/CREATE INDEX idx_client_app_users_user_id_active/);
      expect(sql).toMatch(/CREATE INDEX idx_client_app_users_client_id_active/);
    });
  });

  describe('Row Level Security', () => {
    it('aktiviert RLS', () => {
      expect(sql).toMatch(
        /ALTER TABLE public\.client_app_users ENABLE ROW LEVEL SECURITY/,
      );
    });

    it('erzwingt RLS (FORCE) — auch fuer Tabellen-Eigentuemer', () => {
      expect(sql).toMatch(
        /ALTER TABLE public\.client_app_users FORCE ROW LEVEL SECURITY/,
      );
    });

    it('enthaelt KEINE Policies (kommen erst in Migration 0076)', () => {
      expect(sql).not.toMatch(/CREATE POLICY/);
    });
  });

  describe('Berechtigungen', () => {
    it('widerruft alle Default-Berechtigungen explizit', () => {
      expect(sql).toMatch(
        /REVOKE ALL ON public\.client_app_users FROM PUBLIC/,
      );
      expect(sql).toMatch(
        /REVOKE ALL ON public\.client_app_users FROM authenticated/,
      );
      expect(sql).toMatch(/REVOKE ALL ON public\.client_app_users FROM anon/);
    });
  });

  describe('Rollback-Dokumentation', () => {
    it('dokumentiert Rollback-Vorgehen', () => {
      expect(sql).toMatch(/Rollback/);
      expect(sql).toMatch(
        /DROP TABLE IF EXISTS public\.client_app_users CASCADE/,
      );
    });
  });
});
