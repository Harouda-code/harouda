import { describe, it, expect, beforeAll } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

describe('Migration 0074: clients.app_permissions', () => {
  let sql: string;

  beforeAll(() => {
    const path = resolve(
      process.cwd(),
      'supabase/migrations/0074_clients_app_permissions.sql',
    );
    sql = readFileSync(path, 'utf-8');
  });

  describe('Header & Struktur', () => {
    it('enthaelt Migrations-Header mit Zweck und Rechtsgrundlage', () => {
      expect(sql).toMatch(/Migration 0074: clients\.app_permissions/);
      expect(sql).toMatch(/Zweck:/);
      expect(sql).toMatch(/Rechtsgrundlage:/);
      expect(sql).toMatch(/§ 30 AO/);
      expect(sql).toMatch(/DSGVO Art\. 5/);
      expect(sql).toMatch(/DSGVO Art\. 25/);
      expect(sql).toMatch(/DSGVO Art\. 9/);
      expect(sql).toMatch(/§§ 3, 5 StBerG/);
      expect(sql).toMatch(/GoBD/);
    });

    it('verweist auf strategische Entscheidung E3', () => {
      expect(sql).toMatch(/E3/);
    });

    it('dokumentiert das JSONB-Schema (version 1)', () => {
      expect(sql).toMatch(/version/);
      expect(sql).toMatch(/mobile_app_enabled/);
      expect(sql).toMatch(/beleg_upload_enabled/);
      expect(sql).toMatch(/beleg_status_visible/);
      expect(sql).toMatch(/opos_visible/);
      expect(sql).toMatch(/e_invoice_enabled/);
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

  describe('Spalten-Definition', () => {
    it('fuegt Spalte app_permissions zu public.clients hinzu', () => {
      expect(sql).toMatch(
        /ALTER TABLE public\.clients\s+ADD COLUMN app_permissions JSONB NOT NULL/,
      );
    });

    it('definiert restriktiven Default (version=1, mobile_app_enabled=false)', () => {
      expect(sql).toMatch(/DEFAULT jsonb_build_object\(/);
      const defaultBlock = sql.match(
        /DEFAULT jsonb_build_object\(([\s\S]*?)\)/,
      );
      expect(defaultBlock?.[1]).toMatch(/'version',\s*1/);
      expect(defaultBlock?.[1]).toMatch(/'mobile_app_enabled',\s*false/);
    });
  });

  describe('Constraints', () => {
    it('enthaelt chk_clients_app_permissions_is_object', () => {
      expect(sql).toMatch(
        /CONSTRAINT chk_clients_app_permissions_is_object/,
      );
      expect(sql).toMatch(/jsonb_typeof\(app_permissions\)\s*=\s*'object'/);
    });

    it('enthaelt chk_clients_app_permissions_version (positive Ganzzahl)', () => {
      expect(sql).toMatch(/CONSTRAINT chk_clients_app_permissions_version/);
      expect(sql).toMatch(/'\^\[1-9\]\[0-9\]\*\$'/);
    });

    it('enthaelt chk_clients_app_permissions_mobile_enabled (Pflicht-Boolean)', () => {
      expect(sql).toMatch(
        /CONSTRAINT chk_clients_app_permissions_mobile_enabled/,
      );
      expect(sql).toMatch(/app_permissions \? 'mobile_app_enabled'/);
      expect(sql).toMatch(
        /jsonb_typeof\(app_permissions -> 'mobile_app_enabled'\)\s*=\s*'boolean'/,
      );
    });

    it('enthaelt chk_clients_app_permissions_optional_flags fuer alle vier optionalen Felder', () => {
      expect(sql).toMatch(
        /CONSTRAINT chk_clients_app_permissions_optional_flags/,
      );
      const constraintBlock = sql.match(
        /CONSTRAINT chk_clients_app_permissions_optional_flags[\s\S]*?\);/,
      );
      expect(constraintBlock?.[0]).toMatch(/beleg_upload_enabled/);
      expect(constraintBlock?.[0]).toMatch(/beleg_status_visible/);
      expect(constraintBlock?.[0]).toMatch(/opos_visible/);
      expect(constraintBlock?.[0]).toMatch(/e_invoice_enabled/);
    });
  });

  describe('Nicht-Eingriff in bestehendes RLS und Berechtigungen', () => {
    it('aendert RLS von public.clients NICHT', () => {
      expect(sql).not.toMatch(
        /ALTER TABLE public\.clients ENABLE ROW LEVEL SECURITY/,
      );
      expect(sql).not.toMatch(
        /ALTER TABLE public\.clients DISABLE ROW LEVEL SECURITY/,
      );
      expect(sql).not.toMatch(
        /ALTER TABLE public\.clients FORCE ROW LEVEL SECURITY/,
      );
      expect(sql).not.toMatch(
        /ALTER TABLE public\.clients NO FORCE ROW LEVEL SECURITY/,
      );
    });

    it('erstellt KEINE neuen Policies auf public.clients', () => {
      expect(sql).not.toMatch(/CREATE POLICY[\s\S]*ON public\.clients/);
    });

    it('aendert Berechtigungen von public.clients NICHT', () => {
      expect(sql).not.toMatch(/REVOKE[\s\S]*ON public\.clients/);
      expect(sql).not.toMatch(/GRANT[\s\S]*ON public\.clients/);
    });
  });

  describe('Dokumentation', () => {
    it('enthaelt COMMENT ON COLUMN fuer app_permissions', () => {
      expect(sql).toMatch(
        /COMMENT ON COLUMN public\.clients\.app_permissions IS/,
      );
    });

    it('verweist im COMMENT auf audit_log CDC-Pattern', () => {
      const commentBlock = sql.match(
        /COMMENT ON COLUMN public\.clients\.app_permissions IS\s*'[\s\S]*?';/,
      );
      expect(commentBlock?.[0]).toMatch(/audit_log/);
    });
  });

  describe('Rollback-Dokumentation', () => {
    it('dokumentiert Rollback-Vorgehen', () => {
      expect(sql).toMatch(/Rollback/);
      expect(sql).toMatch(
        /ALTER TABLE public\.clients\s+DROP COLUMN IF EXISTS app_permissions/,
      );
    });

    it('dokumentiert Rollback fuer alle vier Constraints', () => {
      expect(sql).toMatch(/DROP CONSTRAINT IF EXISTS chk_clients_app_permissions_is_object/);
      expect(sql).toMatch(/DROP CONSTRAINT IF EXISTS chk_clients_app_permissions_version/);
      expect(sql).toMatch(/DROP CONSTRAINT IF EXISTS chk_clients_app_permissions_mobile_enabled/);
      expect(sql).toMatch(/DROP CONSTRAINT IF EXISTS chk_clients_app_permissions_optional_flags/);
    });
  });
});
