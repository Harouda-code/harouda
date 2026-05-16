import { describe, it, expect, beforeAll } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

describe('Migration 0078: custom_access_token_hook', () => {
  let sql: string;

  beforeAll(() => {
    const path = resolve(
      process.cwd(),
      'supabase/migrations/0078_custom_access_token_hook.sql',
    );
    sql = readFileSync(path, 'utf-8');
  });

  describe('Header & Struktur', () => {
    it('enthaelt Migrations-Header mit Zweck und Rechtsgrundlage', () => {
      expect(sql).toMatch(/Migration 0078: Custom Access Token Hook/);
      expect(sql).toMatch(/Zweck:/);
      expect(sql).toMatch(/Rechtsgrundlage:/);
      expect(sql).toMatch(/§ 30 AO/);
      expect(sql).toMatch(/DSGVO/);
      expect(sql).toMatch(/Art\.\s*5/);
      expect(sql).toMatch(/Art\.\s*25/);
      expect(sql).toMatch(/Art\.\s*32/);
      expect(sql).toMatch(/RFC 9700/);
      expect(sql).toMatch(/BSI/);
    });

    it('verweist auf strategische Entscheidung E8', () => {
      expect(sql).toMatch(/E8/);
    });

    it('dokumentiert die vier Claim-Felder', () => {
      expect(sql).toMatch(/mobile_app_enabled/);
      expect(sql).toMatch(/active_client_ids/);
      expect(sql).toMatch(/has_registered_device/);
      expect(sql).toMatch(/schema_version/);
    });

    it('dokumentiert dass RLS unberuehrt bleibt (alleinige Wahrheitsquelle)', () => {
      expect(sql).toMatch(/RLS/);
      expect(sql).toMatch(/Wahrheitsquelle/);
    });

    it('dokumentiert die noetige Aktivierung im Supabase-Dashboard', () => {
      expect(sql).toMatch(/Aktivierung/);
      expect(sql).toMatch(/Dashboard/);
    });

    it('verweist auf Vorgaenger-Migrations 0057, 0076, 0077 (textuell) und nutzt 0072/0073-Tabellen', () => {
      expect(sql).toMatch(/0057/);
      expect(sql).toMatch(/0076/);
      expect(sql).toMatch(/0077/);
      expect(sql).toMatch(/from public\.client_app_users/i);
      expect(sql).toMatch(/from public\.mobile_registered_devices/i);
    });

    it('laeuft in einer Transaktion', () => {
      expect(sql).toMatch(/^begin;/mi);
      expect(sql).toMatch(/^commit;/mi);
    });
  });

  describe('Funktions-Definition', () => {
    it('erstellt Funktion public.custom_access_token_hook(event jsonb)', () => {
      expect(sql).toMatch(
        /create or replace function public\.custom_access_token_hook\s*\(\s*event jsonb\s*\)/i,
      );
    });

    it('returns jsonb', () => {
      const fnBlock = sql.match(
        /create or replace function public\.custom_access_token_hook[\s\S]*?\$\$;/i,
      );
      expect(fnBlock?.[0]).toMatch(/returns jsonb/i);
    });

    it('verwendet language plpgsql, stable, security definer', () => {
      const fnBlock = sql.match(
        /create or replace function public\.custom_access_token_hook[\s\S]*?\$\$;/i,
      );
      expect(fnBlock?.[0]).toMatch(/language plpgsql/i);
      expect(fnBlock?.[0]).toMatch(/\bstable\b/i);
      expect(fnBlock?.[0]).toMatch(/security definer/i);
    });

    it('setzt search_path = pg_catalog, public (Pattern aus 0057)', () => {
      expect(sql).toMatch(
        /set search_path\s*=\s*pg_catalog,\s*public/i,
      );
    });
  });

  describe('Funktions-Logik', () => {
    it('liest user_id aus event und behandelt NULL defensiv (early return)', () => {
      expect(sql).toMatch(/event ->> 'user_id'/i);
      expect(sql).toMatch(/nullif/i);
      expect(sql).toMatch(/::uuid/i);
      const fnBlock = sql.match(
        /create or replace function public\.custom_access_token_hook[\s\S]*?\$\$;/i,
      );
      expect(fnBlock?.[0]).toMatch(/if\s+uid\s+is\s+null\s+then[\s\S]*?return event/i);
    });

    it('liest aktive client_app_users-Verknuepfungen (revoked_at IS NULL AND activated_at IS NOT NULL)', () => {
      const fnBlock = sql.match(
        /create or replace function public\.custom_access_token_hook[\s\S]*?\$\$;/i,
      );
      expect(fnBlock?.[0]).toMatch(/from public\.client_app_users/i);
      expect(fnBlock?.[0]).toMatch(/revoked_at\s+is\s+null/i);
      expect(fnBlock?.[0]).toMatch(/activated_at\s+is\s+not\s+null/i);
    });

    it('prueft aktives Geraet in mobile_registered_devices (revoked_at IS NULL)', () => {
      const fnBlock = sql.match(
        /create or replace function public\.custom_access_token_hook[\s\S]*?\$\$;/i,
      );
      expect(fnBlock?.[0]).toMatch(/from public\.mobile_registered_devices/i);
    });

    it('verwendet array_agg(distinct client_id) mit coalesce auf leeres uuid[]', () => {
      const fnBlock = sql.match(
        /create or replace function public\.custom_access_token_hook[\s\S]*?\$\$;/i,
      );
      expect(fnBlock?.[0]).toMatch(/array_agg\s*\(\s*distinct\s+client_id\s*\)/i);
      expect(fnBlock?.[0]).toMatch(/coalesce/i);
      expect(fnBlock?.[0]).toMatch(/array\[\]::uuid\[\]/i);
    });

    it('baut harouda_mobile-Sektion mit allen vier Feldern via jsonb_build_object', () => {
      const fnBlock = sql.match(
        /create or replace function public\.custom_access_token_hook[\s\S]*?\$\$;/i,
      );
      expect(fnBlock?.[0]).toMatch(/jsonb_build_object/i);
      // Pruefe alle vier Feld-Literale direkt im Funktions-Block,
      // da nested parens in jsonb_build_object eine balancierte Regex
      // erfordern wuerden (to_jsonb(...) macht non-greedy untauglich).
      expect(fnBlock?.[0]).toMatch(/'schema_version'/);
      expect(fnBlock?.[0]).toMatch(/'mobile_app_enabled'/);
      expect(fnBlock?.[0]).toMatch(/'active_client_ids'/);
      expect(fnBlock?.[0]).toMatch(/'has_registered_device'/);
    });

    it('schreibt harouda_mobile in app_metadata via jsonb_set (eigener Namespace)', () => {
      const fnBlock = sql.match(
        /create or replace function public\.custom_access_token_hook[\s\S]*?\$\$;/i,
      );
      expect(fnBlock?.[0]).toMatch(/jsonb_set/i);
      expect(fnBlock?.[0]).toMatch(/'\{harouda_mobile\}'/);
      expect(fnBlock?.[0]).toMatch(/'\{app_metadata\}'/);
    });

    it('gibt das modifizierte event zurueck', () => {
      const fnBlock = sql.match(
        /create or replace function public\.custom_access_token_hook[\s\S]*?\$\$;/i,
      );
      expect(fnBlock?.[0]).toMatch(/return event;/i);
    });
  });

  describe('Berechtigungen — strenge Begrenzung auf supabase_auth_admin', () => {
    it('REVOKE EXECUTE von public', () => {
      expect(sql).toMatch(
        /revoke execute on function public\.custom_access_token_hook\(jsonb\) from public/i,
      );
    });

    it('REVOKE EXECUTE von anon', () => {
      expect(sql).toMatch(
        /revoke execute on function public\.custom_access_token_hook\(jsonb\) from anon/i,
      );
    });

    it('REVOKE EXECUTE von authenticated', () => {
      expect(sql).toMatch(
        /revoke execute on function public\.custom_access_token_hook\(jsonb\) from authenticated/i,
      );
    });

    it('GRANT EXECUTE ausschliesslich an supabase_auth_admin', () => {
      expect(sql).toMatch(
        /grant execute on function public\.custom_access_token_hook\(jsonb\) to supabase_auth_admin/i,
      );
    });

    it('vergibt KEIN EXECUTE an authenticated/anon/public/service_role', () => {
      expect(sql).not.toMatch(
        /grant execute on function public\.custom_access_token_hook\(jsonb\) to authenticated/i,
      );
      expect(sql).not.toMatch(
        /grant execute on function public\.custom_access_token_hook\(jsonb\) to anon/i,
      );
      expect(sql).not.toMatch(
        /grant execute on function public\.custom_access_token_hook\(jsonb\) to public/i,
      );
      expect(sql).not.toMatch(
        /grant execute on function public\.custom_access_token_hook\(jsonb\) to service_role/i,
      );
    });
  });

  describe('Dokumentation', () => {
    it('enthaelt COMMENT ON FUNCTION', () => {
      expect(sql).toMatch(
        /comment on function public\.custom_access_token_hook\(jsonb\) is/i,
      );
    });

    it('COMMENT verweist auf supabase_auth_admin und Dashboard-Aktivierung', () => {
      const commentBlock = sql.match(
        /comment on function public\.custom_access_token_hook\(jsonb\) is\s*'[\s\S]*?';/i,
      );
      expect(commentBlock?.[0]).toMatch(/supabase_auth_admin/i);
      expect(commentBlock?.[0]).toMatch(/Dashboard/i);
    });
  });

  describe('Nicht-Eingriff', () => {
    it('schreibt KEIN INSERT/UPDATE/DELETE in andere Tabellen', () => {
      const fnBlock = sql.match(
        /create or replace function public\.custom_access_token_hook[\s\S]*?\$\$;/i,
      );
      expect(fnBlock?.[0]).not.toMatch(/\binsert into\b/i);
      expect(fnBlock?.[0]).not.toMatch(/\bupdate\s+public\./i);
      expect(fnBlock?.[0]).not.toMatch(/\bdelete from\b/i);
    });

    it('aendert keine bestehenden Tabellen oder Policies', () => {
      expect(sql).not.toMatch(/alter table/i);
      expect(sql).not.toMatch(/create policy/i);
      expect(sql).not.toMatch(/drop policy/i);
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

    it('Rollback widerruft EXECUTE und droppt die Funktion', () => {
      const rollback = sql.match(/Rollback \(manuell\):[\s\S]*$/);
      expect(rollback?.[0]).toMatch(
        /revoke execute on function public\.custom_access_token_hook\(jsonb\) from supabase_auth_admin/i,
      );
      expect(rollback?.[0]).toMatch(
        /drop function if exists public\.custom_access_token_hook\(jsonb\)/i,
      );
    });

    it('Rollback warnt vor vorheriger Hook-Deaktivierung im Dashboard', () => {
      const rollback = sql.match(/Rollback \(manuell\):[\s\S]*$/);
      expect(rollback?.[0]).toMatch(/Dashboard/i);
    });
  });
});
