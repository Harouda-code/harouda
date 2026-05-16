import { describe, it, expect, beforeAll } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

describe('Migration 0077: Storage Bucket "mobile-uploads"', () => {
  let sql: string;

  beforeAll(() => {
    const path = resolve(
      process.cwd(),
      'supabase/migrations/0077_mobile_storage_bucket.sql',
    );
    sql = readFileSync(path, 'utf-8');
  });

  describe('Header & Struktur', () => {
    it('enthaelt Migrations-Header mit Zweck und Rechtsgrundlage', () => {
      expect(sql).toMatch(/Migration 0077: Storage Bucket "mobile-uploads"/);
      expect(sql).toMatch(/Zweck:/);
      expect(sql).toMatch(/Rechtsgrundlage:/);
      expect(sql).toMatch(/§ 30 AO/);
      expect(sql).toMatch(/§ 146 AO/);
      expect(sql).toMatch(/§ 147 AO/);
      expect(sql).toMatch(/DSGVO/);
      expect(sql).toMatch(/Art\.\s*5/);
      expect(sql).toMatch(/Art\.\s*25/);
      expect(sql).toMatch(/Art\.\s*32/);
      expect(sql).toMatch(/GoBD/);
      expect(sql).toMatch(/BSI/);
    });

    it('dokumentiert die Pfad-Konvention {company_id}/{client_id}/{beleg_id}/{dateiname}', () => {
      expect(sql).toMatch(/Pfad-Konvention/);
      expect(sql).toMatch(/\{company_id\}/);
      expect(sql).toMatch(/\{client_id\}/);
      expect(sql).toMatch(/\{beleg_id\}/);
      expect(sql).toMatch(/\{dateiname\}/);
    });

    it('verweist auf strategische Entscheidung E4-a', () => {
      expect(sql).toMatch(/E4-a/);
    });

    it('verweist auf Vorgaenger-Migrations 0057 und 0076', () => {
      expect(sql).toMatch(/0057/);
      expect(sql).toMatch(/0076/);
    });

    it('verweist auf Folge-Migration 0078', () => {
      expect(sql).toMatch(/0078/);
    });

    it('laeuft in einer Transaktion', () => {
      expect(sql).toMatch(/^begin;/mi);
      expect(sql).toMatch(/^commit;/mi);
    });
  });

  describe('Bucket-Definition', () => {
    it('legt Bucket "mobile-uploads" in storage.buckets an', () => {
      expect(sql).toMatch(/insert into storage\.buckets/i);
      expect(sql).toMatch(/'mobile-uploads'/);
    });

    it('Bucket ist privat (public = false)', () => {
      const block = sql.match(
        /insert into storage\.buckets[\s\S]*?on conflict[\s\S]*?;/i,
      );
      expect(block?.[0]).toMatch(/false/);
      expect(block?.[0]).not.toMatch(/\btrue\b/);
    });

    it('setzt file_size_limit auf 25 MiB (26214400)', () => {
      expect(sql).toMatch(/26214400/);
    });

    it('beschraenkt allowed_mime_types auf Bild- und PDF-Typen', () => {
      const block = sql.match(
        /insert into storage\.buckets[\s\S]*?on conflict[\s\S]*?;/i,
      );
      expect(block?.[0]).toMatch(/'image\/jpeg'/);
      expect(block?.[0]).toMatch(/'image\/png'/);
      expect(block?.[0]).toMatch(/'image\/heic'/);
      expect(block?.[0]).toMatch(/'image\/heif'/);
      expect(block?.[0]).toMatch(/'application\/pdf'/);
    });

    it('ist idempotent durch ON CONFLICT (id) DO NOTHING', () => {
      expect(sql).toMatch(/on conflict\s*\(id\)\s*do nothing/i);
    });
  });

  describe('SELECT-Policy mobile_uploads_select', () => {
    it('existiert mit DROP IF EXISTS davor', () => {
      expect(sql).toMatch(
        /drop policy if exists mobile_uploads_select on storage\.objects/i,
      );
      expect(sql).toMatch(
        /create policy mobile_uploads_select on storage\.objects/i,
      );
    });

    it('filtert auf bucket_id = mobile-uploads', () => {
      const block = sql.match(
        /create policy mobile_uploads_select on storage\.objects[\s\S]*?\);[\s\S]*?\);/i,
      );
      expect(block?.[0]).toMatch(/bucket_id\s*=\s*'mobile-uploads'/i);
    });

    it('erlaubt Zugriff via is_company_member (erstes Pfad-Segment) ODER is_client_app_user (zweites)', () => {
      const block = sql.match(
        /create policy mobile_uploads_select on storage\.objects[\s\S]*?\);[\s\S]*?\);/i,
      );
      expect(block?.[0]).toMatch(/public\.is_company_member/i);
      expect(block?.[0]).toMatch(/public\.is_client_app_user/i);
      expect(block?.[0]).toMatch(/split_part\(name,\s*'\/',\s*1\)/i);
      expect(block?.[0]).toMatch(/split_part\(name,\s*'\/',\s*2\)/i);
      expect(block?.[0]).toMatch(/::uuid/i);
    });
  });

  describe('INSERT-Policy mobile_uploads_insert', () => {
    it('existiert mit DROP IF EXISTS davor', () => {
      expect(sql).toMatch(
        /drop policy if exists mobile_uploads_insert on storage\.objects/i,
      );
      expect(sql).toMatch(
        /create policy mobile_uploads_insert on storage\.objects/i,
      );
    });

    it('filtert auf bucket_id = mobile-uploads UND is_client_app_user(client_id aus Pfad)', () => {
      const block = sql.match(
        /create policy mobile_uploads_insert on storage\.objects\s+for insert with check\s*\([\s\S]*?\)\s*;/i,
      );
      expect(block?.[0]).toMatch(/with check/i);
      expect(block?.[0]).toMatch(/bucket_id\s*=\s*'mobile-uploads'/i);
      expect(block?.[0]).toMatch(/public\.is_client_app_user/i);
      expect(block?.[0]).toMatch(/split_part\(name,\s*'\/',\s*2\)/i);
      expect(block?.[0]).toMatch(/::uuid/i);
    });

    it('INSERT erlaubt NICHT pauschal via is_company_member (Mobile-Pfad strikt)', () => {
      const block = sql.match(
        /create policy mobile_uploads_insert on storage\.objects\s+for insert with check\s*\([\s\S]*?\)\s*;/i,
      );
      expect(block?.[0]).not.toMatch(/is_company_member/i);
    });
  });

  describe('Keine UPDATE- und DELETE-Policy (Unveraenderbarkeit)', () => {
    it('erstellt KEINE UPDATE-Policy', () => {
      expect(sql).not.toMatch(/create policy mobile_uploads_update/i);
    });

    it('erstellt KEINE DELETE-Policy', () => {
      expect(sql).not.toMatch(/create policy mobile_uploads_delete/i);
    });

    it('enthaelt aber DROP IF EXISTS fuer mobile_uploads_update und _delete (defensive)', () => {
      expect(sql).toMatch(
        /drop policy if exists mobile_uploads_update on storage\.objects/i,
      );
      expect(sql).toMatch(
        /drop policy if exists mobile_uploads_delete on storage\.objects/i,
      );
    });
  });

  describe('Nicht-Eingriff in andere Buckets und Storage-Strukturen', () => {
    it('aendert keine anderen Buckets als mobile-uploads', () => {
      // Verbietet ausschliesslich ausfuehrbare Inserts/Deletes auf andere
      // Buckets — Kommentare im Header (z.B. Rollback-Anleitung) sind
      // erlaubt.
      expect(sql).not.toMatch(
        /insert into storage\.buckets[\s\S]*?values\s*\(\s*'(?!mobile-uploads)/i,
      );
      expect(sql).not.toMatch(
        /^\s*delete from storage\.buckets/im,
      );
    });

    it('erstellt KEINE Policies auf storage.objects fuer fremde Buckets', () => {
      const policyBlocks =
        sql.match(/create policy[\s\S]*?on storage\.objects[\s\S]*?\);/gi) ?? [];
      for (const block of policyBlocks) {
        expect(block).toMatch(/'mobile-uploads'/);
      }
    });

    it('definiert die Helper-Funktionen aus 0057/0076 NICHT neu', () => {
      expect(sql).not.toMatch(
        /create or replace function public\.is_company_member/i,
      );
      expect(sql).not.toMatch(
        /create or replace function public\.is_client_app_user/i,
      );
      expect(sql).not.toMatch(
        /create or replace function public\.can_write/i,
      );
      expect(sql).not.toMatch(
        /create or replace function public\.is_company_admin/i,
      );
    });
  });

  describe('Rollback-Dokumentation', () => {
    it('dokumentiert Rollback-Vorgehen', () => {
      expect(sql).toMatch(/Rollback/);
    });

    it('Rollback entfernt beide Policies', () => {
      const rollback = sql.match(/Rollback \(manuell\):[\s\S]*$/);
      expect(rollback?.[0]).toMatch(
        /drop policy if exists mobile_uploads_select on storage\.objects/i,
      );
      expect(rollback?.[0]).toMatch(
        /drop policy if exists mobile_uploads_insert on storage\.objects/i,
      );
    });

    it('Rollback warnt vor automatischem Loeschen des Buckets (Datenrisiko)', () => {
      const rollback = sql.match(/Rollback \(manuell\):[\s\S]*$/);
      expect(rollback?.[0]).toMatch(/Bucket NICHT automatisch loeschen/i);
    });
  });
});
