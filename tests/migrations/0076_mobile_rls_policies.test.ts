import { describe, it, expect, beforeAll } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

describe('Migration 0076: RLS-Policies + is_client_app_user Helper', () => {
  let sql: string;

  beforeAll(() => {
    const path = resolve(
      process.cwd(),
      'supabase/migrations/0076_mobile_rls_policies.sql',
    );
    sql = readFileSync(path, 'utf-8');
  });

  describe('Header & Struktur', () => {
    it('enthaelt Migrations-Header mit Zweck und Rechtsgrundlage', () => {
      expect(sql).toMatch(/Migration 0076: RLS-Policies/);
      expect(sql).toMatch(/Zweck:/);
      expect(sql).toMatch(/Rechtsgrundlage:/);
      expect(sql).toMatch(/§ 30 AO/);
      expect(sql).toMatch(/DSGVO Art\. 5/);
      expect(sql).toMatch(/Art\.\s*25/);
      expect(sql).toMatch(/Art\.\s*32/);
      expect(sql).toMatch(/GoBD/);
    });

    it('dokumentiert FORCE-RLS-Strategie und Defense-in-depth', () => {
      expect(sql).toMatch(/FORCE/);
      expect(sql).toMatch(/Defense-in-depth/);
    });

    it('enthaelt TECHNISCHE NOTIZ zu mandant_id mit Verweis auf 0022 und 0026', () => {
      expect(sql).toMatch(/TECHNISCHE NOTIZ/);
      expect(sql).toMatch(/mandant_id/);
      expect(sql).toMatch(/0022/);
      expect(sql).toMatch(/0026/);
    });

    it('verweist auf Vorgaenger-Migrations 0048, 0057, 0072, 0073, 0075', () => {
      expect(sql).toMatch(/0048/);
      expect(sql).toMatch(/0057/);
      expect(sql).toMatch(/0072/);
      expect(sql).toMatch(/0073/);
      expect(sql).toMatch(/0075/);
    });

    it('verweist auf Folge-Migrations 0077 und 0078', () => {
      expect(sql).toMatch(/0077/);
      expect(sql).toMatch(/0078/);
    });

    it('laeuft in einer Transaktion', () => {
      expect(sql).toMatch(/^begin;/mi);
      expect(sql).toMatch(/^commit;/mi);
    });
  });

  describe('Helper-Funktion is_client_app_user', () => {
    it('erstellt Funktion mit korrekter Signatur', () => {
      expect(sql).toMatch(
        /create or replace function public\.is_client_app_user\(cid uuid\)/i,
      );
      expect(sql).toMatch(/returns boolean/i);
    });

    it('verwendet language sql, stable, security definer', () => {
      const block = sql.match(
        /create or replace function public\.is_client_app_user[\s\S]*?\$\$;/i,
      );
      expect(block?.[0]).toMatch(/language sql/i);
      expect(block?.[0]).toMatch(/\bstable\b/i);
      expect(block?.[0]).toMatch(/security definer/i);
    });

    it('setzt search_path = pg_catalog, public (Pattern aus 0057)', () => {
      expect(sql).toMatch(
        /set search_path\s*=\s*pg_catalog,\s*public/i,
      );
    });

    it('prueft activated_at IS NOT NULL UND revoked_at IS NULL', () => {
      const fnBody = sql.match(
        /create or replace function public\.is_client_app_user[\s\S]*?\$\$;/i,
      );
      expect(fnBody?.[0]).toMatch(/revoked_at\s+is\s+null/i);
      expect(fnBody?.[0]).toMatch(/activated_at\s+is\s+not\s+null/i);
    });

    it('prueft user_id = auth.uid()', () => {
      const fnBody = sql.match(
        /create or replace function public\.is_client_app_user[\s\S]*?\$\$;/i,
      );
      expect(fnBody?.[0]).toMatch(/user_id\s*=\s*auth\.uid\(\)/i);
    });

    it('REVOKE EXECUTE von public und anon, GRANT EXECUTE an authenticated', () => {
      expect(sql).toMatch(
        /revoke execute on function public\.is_client_app_user\(uuid\) from public/i,
      );
      expect(sql).toMatch(
        /revoke execute on function public\.is_client_app_user\(uuid\) from anon/i,
      );
      expect(sql).toMatch(
        /grant execute on function public\.is_client_app_user\(uuid\) to authenticated/i,
      );
    });

    it('enthaelt COMMENT ON FUNCTION mit Verweis auf Migration 0057', () => {
      expect(sql).toMatch(
        /comment on function public\.is_client_app_user\(uuid\) is/i,
      );
      const commentBlock = sql.match(
        /comment on function public\.is_client_app_user\(uuid\) is\s*'[\s\S]*?';/i,
      );
      expect(commentBlock?.[0]).toMatch(/0057/);
    });
  });

  describe('Policies auf public.client_app_users', () => {
    it('erstellt client_app_users_select: user_id = auth.uid() ODER is_company_member', () => {
      expect(sql).toMatch(
        /create policy client_app_users_select on public\.client_app_users/i,
      );
      const block = sql.match(
        /create policy client_app_users_select on public\.client_app_users[\s\S]*?\);[\s\S]*?\);/i,
      );
      expect(block?.[0]).toMatch(/user_id\s*=\s*auth\.uid\(\)/i);
      expect(block?.[0]).toMatch(/public\.is_company_member/i);
    });

    it('erstellt client_app_users_insert nur fuer Kanzlei-Admin', () => {
      const block = sql.match(
        /create policy client_app_users_insert[\s\S]*?\);[\s\S]*?\);/i,
      );
      expect(block?.[0]).toMatch(/with check/i);
      expect(block?.[0]).toMatch(/public\.is_company_admin/i);
      expect(block?.[0]).not.toMatch(/public\.can_write/i);
    });

    it('erstellt client_app_users_update nur fuer Kanzlei-Admin (USING + WITH CHECK)', () => {
      const block = sql.match(
        /create policy client_app_users_update[\s\S]*?with check[\s\S]*?\);[\s\S]*?\);/i,
      );
      expect(block?.[0]).toMatch(/for update using/i);
      expect(block?.[0]).toMatch(/with check/i);
      expect(block?.[0]).toMatch(/public\.is_company_admin/i);
    });

    it('erstellt KEINE DELETE-Policy auf client_app_users', () => {
      expect(sql).not.toMatch(
        /create policy client_app_users_delete/i,
      );
    });

    it('jede Policy hat DROP IF EXISTS davor (idempotent)', () => {
      expect(sql).toMatch(
        /drop policy if exists client_app_users_select on public\.client_app_users/i,
      );
      expect(sql).toMatch(
        /drop policy if exists client_app_users_insert on public\.client_app_users/i,
      );
      expect(sql).toMatch(
        /drop policy if exists client_app_users_update on public\.client_app_users/i,
      );
      expect(sql).toMatch(
        /drop policy if exists client_app_users_delete on public\.client_app_users/i,
      );
    });
  });

  describe('Policies auf public.mobile_registered_devices', () => {
    it('erstellt mobile_registered_devices_select: user_id = auth.uid() ODER is_company_member', () => {
      const block = sql.match(
        /create policy mobile_registered_devices_select on public\.mobile_registered_devices[\s\S]*?\);[\s\S]*?\);/i,
      );
      expect(block?.[0]).toMatch(/user_id\s*=\s*auth\.uid\(\)/i);
      expect(block?.[0]).toMatch(/public\.is_company_member/i);
    });

    it('erstellt mobile_registered_devices_insert: User registriert eigenes Geraet via is_client_app_user(client_id)', () => {
      const block = sql.match(
        /create policy mobile_registered_devices_insert[\s\S]*?\);/i,
      );
      expect(block?.[0]).toMatch(/with check/i);
      expect(block?.[0]).toMatch(/user_id\s*=\s*auth\.uid\(\)/i);
      expect(block?.[0]).toMatch(/public\.is_client_app_user\(client_id\)/i);
    });

    it('erstellt mobile_registered_devices_update fuer User selbst oder Kanzlei-Admin', () => {
      const block = sql.match(
        /create policy mobile_registered_devices_update[\s\S]*?with check[\s\S]*?\);[\s\S]*?\);/i,
      );
      expect(block?.[0]).toMatch(/for update using/i);
      expect(block?.[0]).toMatch(/with check/i);
      expect(block?.[0]).toMatch(/user_id\s*=\s*auth\.uid\(\)/i);
      expect(block?.[0]).toMatch(/public\.is_company_admin/i);
    });

    it('erstellt KEINE DELETE-Policy auf mobile_registered_devices', () => {
      expect(sql).not.toMatch(
        /create policy mobile_registered_devices_delete/i,
      );
    });

    it('jede Policy hat DROP IF EXISTS davor (idempotent)', () => {
      expect(sql).toMatch(
        /drop policy if exists mobile_registered_devices_select on public\.mobile_registered_devices/i,
      );
      expect(sql).toMatch(
        /drop policy if exists mobile_registered_devices_insert on public\.mobile_registered_devices/i,
      );
      expect(sql).toMatch(
        /drop policy if exists mobile_registered_devices_update on public\.mobile_registered_devices/i,
      );
      expect(sql).toMatch(
        /drop policy if exists mobile_registered_devices_delete on public\.mobile_registered_devices/i,
      );
    });
  });

  describe('Erweiterung public.belege — Mobile-Upload-Pfad', () => {
    it('ersetzt belege_select mit Mobile-Pfad via mandant_id (DROP + CREATE)', () => {
      expect(sql).toMatch(
        /drop policy if exists belege_select on public\.belege/i,
      );
      const block = sql.match(
        /create policy belege_select on public\.belege[\s\S]*?\);[\s\S]*?\);/i,
      );
      expect(block?.[0]).toMatch(/public\.is_company_member\(company_id\)/i);
      expect(block?.[0]).toMatch(/uploaded_via_app\s*=\s*true/i);
      expect(block?.[0]).toMatch(/public\.is_client_app_user\(mandant_id\)/i);
    });

    it('belege_select verwendet NICHT client_id (Spalte existiert auf belege nicht)', () => {
      const block = sql.match(
        /create policy belege_select on public\.belege[\s\S]*?\);[\s\S]*?\);/i,
      );
      expect(block?.[0]).not.toMatch(/is_client_app_user\(client_id\)/i);
    });

    it('ersetzt belege_insert mit Mobile-Pfad via mandant_id und Hash-Pflicht', () => {
      expect(sql).toMatch(
        /drop policy if exists belege_insert on public\.belege/i,
      );
      const block = sql.match(
        /create policy belege_insert on public\.belege[\s\S]*?\);[\s\S]*?\);/i,
      );
      expect(block?.[0]).toMatch(/with check/i);
      expect(block?.[0]).toMatch(/public\.can_write\(company_id\)/i);
      expect(block?.[0]).toMatch(/uploaded_via_app\s*=\s*true/i);
      expect(block?.[0]).toMatch(/public\.is_client_app_user\(mandant_id\)/i);
      expect(block?.[0]).toMatch(/hash_sha256\s+is\s+not\s+null/i);
    });

    it('belege_insert verwendet NICHT client_id', () => {
      const block = sql.match(
        /create policy belege_insert on public\.belege[\s\S]*?\);[\s\S]*?\);/i,
      );
      expect(block?.[0]).not.toMatch(/is_client_app_user\(client_id\)/i);
    });
  });

  describe('Nicht-Eingriff: belege_update und belege_delete bleiben unveraendert', () => {
    it('aendert belege_update NICHT (kein DROP, kein CREATE)', () => {
      expect(sql).not.toMatch(
        /drop policy if exists belege_update on public\.belege/i,
      );
      expect(sql).not.toMatch(
        /create policy belege_update on public\.belege/i,
      );
    });

    it('aendert belege_delete NICHT (kein DROP, kein CREATE)', () => {
      expect(sql).not.toMatch(
        /drop policy if exists belege_delete on public\.belege/i,
      );
      expect(sql).not.toMatch(
        /create policy belege_delete on public\.belege/i,
      );
    });

    it('aendert Schema von public.belege NICHT (kein ALTER TABLE belege)', () => {
      expect(sql).not.toMatch(/alter table public\.belege/i);
    });

    it('aendert ENABLE/FORCE RLS auf client_app_users NICHT (Stand aus 0072)', () => {
      expect(sql).not.toMatch(
        /alter table public\.client_app_users[\s\S]{0,80}row level security/i,
      );
    });

    it('aendert ENABLE/FORCE RLS auf mobile_registered_devices NICHT (Stand aus 0073)', () => {
      expect(sql).not.toMatch(
        /alter table public\.mobile_registered_devices[\s\S]{0,80}row level security/i,
      );
    });

    it('aendert die Helper-Funktionen aus 0057 NICHT', () => {
      expect(sql).not.toMatch(
        /create or replace function public\.is_company_member/i,
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

    it('Rollback stellt belege-Policies auf 0048-Stand zurueck', () => {
      const rollback = sql.match(/Rollback \(manuell\):[\s\S]*$/);
      expect(rollback?.[0]).toMatch(
        /create policy belege_select[\s\S]{0,200}is_company_member\(company_id\)/i,
      );
      expect(rollback?.[0]).toMatch(
        /create policy belege_insert[\s\S]{0,200}can_write\(company_id\)/i,
      );
    });

    it('Rollback entfernt is_client_app_user-Funktion', () => {
      const rollback = sql.match(/Rollback \(manuell\):[\s\S]*$/);
      expect(rollback?.[0]).toMatch(
        /drop function if exists public\.is_client_app_user\(uuid\)/i,
      );
    });

    it('Rollback entfernt alle Mobile-Policies', () => {
      const rollback = sql.match(/Rollback \(manuell\):[\s\S]*$/);
      expect(rollback?.[0]).toMatch(/drop policy if exists client_app_users_select/i);
      expect(rollback?.[0]).toMatch(/drop policy if exists client_app_users_insert/i);
      expect(rollback?.[0]).toMatch(/drop policy if exists client_app_users_update/i);
      expect(rollback?.[0]).toMatch(/drop policy if exists mobile_registered_devices_select/i);
      expect(rollback?.[0]).toMatch(/drop policy if exists mobile_registered_devices_insert/i);
      expect(rollback?.[0]).toMatch(/drop policy if exists mobile_registered_devices_update/i);
    });
  });
});
