// Jahresabschluss-E1 / Schritt 1 · Migration-0030-Struktur-Check.

import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const MIGRATION_PATH = join(
  process.cwd(),
  "supabase",
  "migrations",
  "0030_client_rechtsform_stammdaten.sql"
);

describe("Migration 0030 · Struktur-Contract", () => {
  const rawSql = readFileSync(MIGRATION_PATH, "utf-8").toLowerCase();
  const sql = rawSql
    .split("\n")
    .filter((line) => !line.trimStart().startsWith("--"))
    .join("\n");

  it("existiert und ist nicht leer", () => {
    expect(sql.length).toBeGreaterThan(200);
  });

  it("hat 7 ADD COLUMN-Statements (rechtsform, hrb_nummer, hrb_gericht, gezeichnetes_kapital, geschaeftsfuehrer, wirtschaftsjahr_beginn/ende)", () => {
    const cols = [
      "rechtsform",
      "hrb_nummer",
      "hrb_gericht",
      "gezeichnetes_kapital",
      "geschaeftsfuehrer",
      "wirtschaftsjahr_beginn",
      "wirtschaftsjahr_ende",
    ];
    for (const col of cols) {
      const pattern = new RegExp(
        `add column if not exists ${col}`,
        "i"
      );
      expect(sql).toMatch(pattern);
    }
    const total = (sql.match(/add column if not exists/g) ?? []).length;
    expect(total).toBe(7);
  });

  it("hat CHECK-Constraint auf rechtsform mit den 10 HGB-Rechtsformen", () => {
    expect(sql).toMatch(/check\s*\(/);
    // Alle 10 Rechtsformen müssen im SQL erscheinen.
    const rechtsformen = [
      "einzelunternehmen",
      "gbr",
      "partg",
      "ohg",
      "kg",
      "gmbh",
      "ag",
      "ug",
      "se",
      "sonstigerrechtsform",
    ];
    for (const rf of rechtsformen) {
      expect(sql).toMatch(new RegExp(`'${rf}'`, "i"));
    }
  });

  it("geschaeftsfuehrer hat JSONB-Default '[]'", () => {
    expect(sql).toMatch(
      /geschaeftsfuehrer jsonb\s+default\s+'\[\]'::jsonb/
    );
  });

  it("wirtschaftsjahr_beginn/_ende haben MM-DD-Default", () => {
    expect(sql).toMatch(/wirtschaftsjahr_beginn text\s+default\s+'01-01'/);
    expect(sql).toMatch(/wirtschaftsjahr_ende text\s+default\s+'12-31'/);
  });

  it("enthält keine destruktiven Statements (DROP / RENAME)", () => {
    expect(sql).not.toMatch(/drop column/);
    expect(sql).not.toMatch(/drop table/);
    expect(sql).not.toMatch(/rename column/);
    expect(sql).not.toMatch(/alter column .* drop/);
  });

  it("enthält keine RLS-Policy-Statements (kein neuer Sicherheits-Vektor)", () => {
    expect(sql).not.toMatch(/create policy/);
    expect(sql).not.toMatch(/alter policy/);
    expect(sql).not.toMatch(/drop policy/);
  });

  it("ist idempotent: jeder ADD COLUMN nutzt IF NOT EXISTS", () => {
    const adds = (sql.match(/add column /g) ?? []).length;
    const idempotentAdds = (sql.match(/add column if not exists/g) ?? [])
      .length;
    expect(idempotentAdds).toBe(adds);
  });
});
