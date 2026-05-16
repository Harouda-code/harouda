import { describe, it, expect, beforeAll } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

describe('Migration 0075: belege Mobile-Erweiterungen', () => {
  let sql: string;

  beforeAll(() => {
    const path = resolve(
      process.cwd(),
      'supabase/migrations/0075_belege_mobile_extensions.sql',
    );
    sql = readFileSync(path, 'utf-8');
  });

  describe('Header & Struktur', () => {
    it('enthaelt Migrations-Header mit Zweck und Rechtsgrundlage', () => {
      expect(sql).toMatch(/Migration 0075: belege Mobile-Erweiterungen/);
      expect(sql).toMatch(/Zweck:/);
      expect(sql).toMatch(/Rechtsgrundlage:/);
      expect(sql).toMatch(/GoBD/);
      expect(sql).toMatch(/§ 146 AO/);
      expect(sql).toMatch(/§ 147 AO/);
      expect(sql).toMatch(/BStBK/);
    });

    it('verweist auf strategische Entscheidung E4-a', () => {
      expect(sql).toMatch(/E4-a/);
    });

    it('dokumentiert dass mandant_id Tech-Debt unberuehrt bleibt', () => {
      expect(sql).toMatch(/mandant_id/);
      expect(sql).toMatch(/Tech-Debt|historische Inkonsistenz/);
    });

    it('verweist auf Folge-Migrations 0076 und 0077', () => {
      expect(sql).toMatch(/0076/);
      expect(sql).toMatch(/0077/);
    });

    it('laeuft in einer Transaktion', () => {
      expect(sql).toMatch(/^BEGIN;/m);
      expect(sql).toMatch(/^COMMIT;/m);
    });
  });

  describe('Spalten-Definition', () => {
    it('fuegt Spalte uploaded_via_app als BOOLEAN NOT NULL DEFAULT false hinzu', () => {
      expect(sql).toMatch(
        /ALTER TABLE public\.belege\s+ADD COLUMN uploaded_via_app BOOLEAN NOT NULL DEFAULT false/,
      );
    });

    it('fuegt Spalte hash_sha256 als TEXT (NULL erlaubt) hinzu', () => {
      expect(sql).toMatch(
        /ALTER TABLE public\.belege\s+ADD COLUMN hash_sha256 TEXT;/,
      );
    });
  });

  describe('Constraints', () => {
    it('enthaelt chk_belege_hash_sha256_format (64 lowercase hex)', () => {
      expect(sql).toMatch(/CONSTRAINT chk_belege_hash_sha256_format/);
      const block = sql.match(
        /CONSTRAINT chk_belege_hash_sha256_format[\s\S]*?\);/,
      );
      expect(block?.[0]).toMatch(/'\^\[0-9a-f\]\{64\}\$'/);
      expect(block?.[0]).toMatch(/hash_sha256 IS NULL/);
    });

    it('enthaelt chk_belege_app_upload_requires_hash (Konsistenz)', () => {
      expect(sql).toMatch(/CONSTRAINT chk_belege_app_upload_requires_hash/);
      const block = sql.match(
        /CONSTRAINT chk_belege_app_upload_requires_hash[\s\S]*?\);/,
      );
      expect(block?.[0]).toMatch(/uploaded_via_app = false/);
      expect(block?.[0]).toMatch(/hash_sha256 IS NOT NULL/);
    });
  });

  describe('Index', () => {
    it('erstellt Partial-Index idx_belege_uploaded_via_app (WHERE = true)', () => {
      expect(sql).toMatch(/CREATE INDEX idx_belege_uploaded_via_app/);
      const idxBlock = sql.match(
        /CREATE INDEX idx_belege_uploaded_via_app[\s\S]*?;/,
      );
      expect(idxBlock?.[0]).toMatch(/ON public\.belege \(uploaded_via_app\)/);
      expect(idxBlock?.[0]).toMatch(/WHERE uploaded_via_app = true/);
    });
  });

  describe('Nicht-Eingriff in bestehendes Schema, RLS und Berechtigungen', () => {
    it('aendert RLS von public.belege NICHT', () => {
      expect(sql).not.toMatch(
        /ALTER TABLE public\.belege ENABLE ROW LEVEL SECURITY/,
      );
      expect(sql).not.toMatch(
        /ALTER TABLE public\.belege DISABLE ROW LEVEL SECURITY/,
      );
      expect(sql).not.toMatch(
        /ALTER TABLE public\.belege FORCE ROW LEVEL SECURITY/,
      );
      expect(sql).not.toMatch(
        /ALTER TABLE public\.belege NO FORCE ROW LEVEL SECURITY/,
      );
    });

    it('erstellt KEINE neuen Policies auf public.belege', () => {
      expect(sql).not.toMatch(/CREATE POLICY[\s\S]*ON public\.belege/);
    });

    it('aendert Berechtigungen von public.belege NICHT', () => {
      expect(sql).not.toMatch(/REVOKE[\s\S]*ON public\.belege/);
      expect(sql).not.toMatch(/GRANT[\s\S]*ON public\.belege/);
    });

    it('beruehrt die mandant_id-Spalte NICHT (kein DROP/ALTER/RENAME)', () => {
      expect(sql).not.toMatch(/DROP COLUMN[\s\S]*mandant_id/);
      expect(sql).not.toMatch(/ALTER COLUMN mandant_id/);
      expect(sql).not.toMatch(/RENAME COLUMN mandant_id/);
    });
  });

  describe('Dokumentation', () => {
    it('enthaelt COMMENT ON COLUMN fuer uploaded_via_app', () => {
      expect(sql).toMatch(
        /COMMENT ON COLUMN public\.belege\.uploaded_via_app IS/,
      );
    });

    it('enthaelt COMMENT ON COLUMN fuer hash_sha256', () => {
      expect(sql).toMatch(
        /COMMENT ON COLUMN public\.belege\.hash_sha256 IS/,
      );
    });

    it('verweist im hash_sha256-COMMENT auf GoBD-Integritaet', () => {
      const block = sql.match(
        /COMMENT ON COLUMN public\.belege\.hash_sha256 IS\s*'[\s\S]*?';/,
      );
      expect(block?.[0]).toMatch(/GoBD/);
    });
  });

  describe('Rollback-Dokumentation', () => {
    it('dokumentiert Rollback-Vorgehen fuer beide Spalten', () => {
      expect(sql).toMatch(/Rollback/);
      expect(sql).toMatch(
        /ALTER TABLE public\.belege DROP COLUMN IF EXISTS hash_sha256/,
      );
      expect(sql).toMatch(
        /ALTER TABLE public\.belege DROP COLUMN IF EXISTS uploaded_via_app/,
      );
    });

    it('dokumentiert Rollback fuer Index und beide Constraints', () => {
      expect(sql).toMatch(
        /DROP INDEX IF EXISTS public\.idx_belege_uploaded_via_app/,
      );
      expect(sql).toMatch(
        /DROP CONSTRAINT IF EXISTS chk_belege_app_upload_requires_hash/,
      );
      expect(sql).toMatch(
        /DROP CONSTRAINT IF EXISTS chk_belege_hash_sha256_format/,
      );
    });
  });
});
