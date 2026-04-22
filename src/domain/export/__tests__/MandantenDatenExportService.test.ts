// Tests für MandantenDatenExportService.
//
// Prüft:
//   - Serialisierung ist deterministisch (Key-Order-unabhängig)
//   - Hash je Tabelle stimmt mit Datei überein
//   - Manifest-Hash schließt sich selbst AUS (keine zirkuläre Selbst-Referenz)
//   - Leer-Export erzeugt explizite Warnung (nicht stillen Erfolg)
//   - DISCLAIMER.txt enthält alle drei Ehrlichkeits-Hinweise
//   - verifyExportZip erkennt Manipulation an Tabellen und am Manifest
//   - Audit-Log-Flag schließt die Tabelle aus, wenn gesetzt
//   - Purpose-Feld wird übernommen

import { describe, expect, it } from "vitest";
import JSZip from "jszip";
import {
  DISCLAIMERS,
  exportMandantenDaten,
  verifyExportZip,
  type DataSource,
} from "../MandantenDatenExportService";
import { readZipToFiles, createZipFromFiles } from "../../../lib/zip/zipBundler";

const FIXED_NOW = new Date("2026-04-20T10:00:00Z");

function sampleSources(): DataSource[] {
  return [
    {
      tableName: "mandanten",
      rows: [{ id: "m1", name: "Müller GmbH" }],
    },
    {
      tableName: "buchungen",
      rows: [
        { id: "b1", datum: "2026-01-15", betrag: "119.00", beleg_nr: "R-001" },
        { id: "b2", datum: "2026-02-01", betrag: "59.50", beleg_nr: "R-002" },
      ],
    },
    {
      tableName: "audit_log",
      rows: [{ id: "a1", action: "create", entity: "buchung" }],
    },
  ];
}

describe("exportMandantenDaten", () => {
  it("erzeugt Manifest mit korrekter Zeilen- und Tabellen-Zahl", async () => {
    const res = await exportMandantenDaten({
      mandantId: "m1",
      userId: "u1",
      purpose: "DSGVO_ART_20_PORTABILITY",
      sources: sampleSources(),
      now: FIXED_NOW,
    });
    expect(res.manifest.tables).toHaveLength(3);
    const byName = Object.fromEntries(res.manifest.tables.map((t) => [t.name, t]));
    expect(byName.mandanten.rowCount).toBe(1);
    expect(byName.buchungen.rowCount).toBe(2);
    expect(byName.audit_log.rowCount).toBe(1);
    expect(res.warnings).toHaveLength(0);
  });

  it("hashes sind pro Tabelle eindeutig bei unterschiedlichen Inhalten", async () => {
    const res = await exportMandantenDaten({
      mandantId: "m1",
      userId: "u1",
      purpose: "DSGVO_ART_20_PORTABILITY",
      sources: sampleSources(),
      now: FIXED_NOW,
    });
    const hashes = res.manifest.tables.map((t) => t.sha256);
    expect(new Set(hashes).size).toBe(hashes.length);
  });

  it("kanonische Serialisierung: gleiche Daten → gleicher Hash (Key-Order-unabhängig)", async () => {
    const a: DataSource[] = [
      { tableName: "x", rows: [{ a: 1, b: 2, c: 3 }] },
    ];
    const b: DataSource[] = [
      { tableName: "x", rows: [{ c: 3, a: 1, b: 2 }] },
    ];
    const resA = await exportMandantenDaten({
      mandantId: "m", userId: "u", purpose: "USER_ARCHIVE", sources: a, now: FIXED_NOW,
    });
    const resB = await exportMandantenDaten({
      mandantId: "m", userId: "u", purpose: "USER_ARCHIVE", sources: b, now: FIXED_NOW,
    });
    expect(resA.manifest.tables[0].sha256).toBe(resB.manifest.tables[0].sha256);
  });

  it("Manifest-Hash schließt sich SELBST aus (keine zirkuläre Abhängigkeit)", async () => {
    const res = await exportMandantenDaten({
      mandantId: "m", userId: "u", purpose: "USER_ARCHIVE", sources: sampleSources(), now: FIXED_NOW,
    });
    // Wenn der Hash sich selbst einschlösse, würde er sich bei Anzeige
    // verändern. verifyExportZip rechnet ihn OHNE Hash-Feld nach — muss
    // stimmen.
    const verify = await verifyExportZip(res.zip);
    expect(verify.manifestValid).toBe(true);
    expect(verify.tablesValid).toBe(true);
    expect(verify.errors).toHaveLength(0);
  });

  it("leerer Export gibt eine EXPLIZITE Warnung (kein stiller Erfolg)", async () => {
    const res = await exportMandantenDaten({
      mandantId: "m",
      userId: "u",
      purpose: "USER_ARCHIVE",
      sources: [
        { tableName: "mandanten", rows: [] },
        { tableName: "buchungen", rows: [] },
      ],
      now: FIXED_NOW,
    });
    expect(res.warnings.length).toBeGreaterThan(0);
    expect(res.warnings[0]).toContain("Leerer Export");
    expect(res.manifest.tables).toHaveLength(2);
    expect(res.manifest.totalSizeBytes).toBeGreaterThan(0); // "[]"-Bytes
  });

  it("ZIP-Struktur enthält MANIFEST.json + tables/ + DISCLAIMER.txt", async () => {
    const res = await exportMandantenDaten({
      mandantId: "m", userId: "u", purpose: "DSGVO_ART_15_COPY", sources: sampleSources(), now: FIXED_NOW,
    });
    const files = await readZipToFiles(res.zip);
    expect(files.has("MANIFEST.json")).toBe(true);
    expect(files.has("DISCLAIMER.txt")).toBe(true);
    expect(files.has("tables/mandanten.json")).toBe(true);
    expect(files.has("tables/buchungen.json")).toBe(true);
    expect(files.has("tables/audit_log.json")).toBe(true);
  });

  it("DISCLAIMER.txt enthält alle drei Ehrlichkeits-Hinweise", async () => {
    const res = await exportMandantenDaten({
      mandantId: "m", userId: "u", purpose: "USER_ARCHIVE", sources: sampleSources(), now: FIXED_NOW,
    });
    const files = await readZipToFiles(res.zip);
    const disclaimer = new TextDecoder().decode(files.get("DISCLAIMER.txt")!);
    expect(disclaimer).toContain("KEIN BACKUP");
    expect(disclaimer).toContain("HASH-VERLÄSSLICHKEIT");
    expect(disclaimer).toContain("SICHTBARKEIT (RLS)");
    // Hinweis auf BACKUP-STRATEGY.md — macht den Verweis auffindbar.
    expect(disclaimer).toContain("BACKUP-STRATEGY.md");
  });

  it("DISCLAIMERS-Konstante ist exportiert und inhaltlich non-empty", () => {
    expect(DISCLAIMERS.notABackup.length).toBeGreaterThan(30);
    expect(DISCLAIMERS.tamperingNote.length).toBeGreaterThan(30);
    expect(DISCLAIMERS.rlsLimitation.length).toBeGreaterThan(30);
  });

  it("includeAuditLog=false schließt audit_log aus", async () => {
    const res = await exportMandantenDaten({
      mandantId: "m", userId: "u", purpose: "USER_ARCHIVE",
      sources: sampleSources(), includeAuditLog: false, now: FIXED_NOW,
    });
    const names = res.manifest.tables.map((t) => t.name);
    expect(names).not.toContain("audit_log");
    expect(names).toContain("mandanten");
  });

  it("purpose-Feld spiegelt die Auswahl", async () => {
    const res = await exportMandantenDaten({
      mandantId: "m", userId: "u",
      purpose: "DSGVO_ART_20_PORTABILITY",
      sources: sampleSources(), now: FIXED_NOW,
    });
    expect(res.manifest.purpose).toBe("DSGVO_ART_20_PORTABILITY");
  });
});

describe("verifyExportZip", () => {
  it("valides ZIP passes", async () => {
    const res = await exportMandantenDaten({
      mandantId: "m", userId: "u", purpose: "USER_ARCHIVE", sources: sampleSources(), now: FIXED_NOW,
    });
    const v = await verifyExportZip(res.zip);
    expect(v.manifestValid).toBe(true);
    expect(v.tablesValid).toBe(true);
    expect(v.errors).toHaveLength(0);
  });

  it("manipulierte Tabellen-Datei → tablesValid=false mit konkretem Fehler", async () => {
    const res = await exportMandantenDaten({
      mandantId: "m", userId: "u", purpose: "USER_ARCHIVE", sources: sampleSources(), now: FIXED_NOW,
    });

    // ZIP rekonstruieren, eine Tabelle verändern.
    const files = await readZipToFiles(res.zip);
    const enc = new TextEncoder();
    files.set("tables/mandanten.json", enc.encode('[{"id":"m1","name":"Manipuliert"}]'));
    const tampered = await createZipFromFiles(files);

    const v = await verifyExportZip(tampered);
    expect(v.tablesValid).toBe(false);
    expect(v.errors.some((e) => e.includes("mandanten"))).toBe(true);
  });

  it("manipuliertes Manifest → manifestValid=false", async () => {
    const res = await exportMandantenDaten({
      mandantId: "m", userId: "u", purpose: "USER_ARCHIVE", sources: sampleSources(), now: FIXED_NOW,
    });
    const files = await readZipToFiles(res.zip);
    const manifestStr = new TextDecoder().decode(files.get("MANIFEST.json")!);
    const mutated = manifestStr.replace('"mandantId": "m"', '"mandantId": "FAKE"');
    files.set("MANIFEST.json", new TextEncoder().encode(mutated));
    const tampered = await createZipFromFiles(files);

    const v = await verifyExportZip(tampered);
    expect(v.manifestValid).toBe(false);
    expect(v.errors[0]).toMatch(/Manifest-Hash stimmt nicht/);
  });

  it("fehlende Tabellen-Datei → spezifische Fehlermeldung", async () => {
    const res = await exportMandantenDaten({
      mandantId: "m", userId: "u", purpose: "USER_ARCHIVE", sources: sampleSources(), now: FIXED_NOW,
    });
    const files = await readZipToFiles(res.zip);
    files.delete("tables/mandanten.json");
    const broken = await createZipFromFiles(files);

    const v = await verifyExportZip(broken);
    expect(v.tablesValid).toBe(false);
    expect(v.errors.some((e) => e.includes("mandanten") && e.includes("fehlt"))).toBe(true);
  });

  it("ZIP ohne MANIFEST.json → Fehler, kein Crash", async () => {
    const empty = await new JSZip().generateAsync({ type: "blob" });
    const v = await verifyExportZip(empty);
    expect(v.manifestValid).toBe(false);
    expect(v.errors[0]).toContain("MANIFEST.json fehlt");
  });
});
