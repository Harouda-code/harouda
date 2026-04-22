import { describe, it, expect } from "vitest";
import { exportZ3Package } from "../Gdpdu3Exporter";
import type { Account, JournalEntry } from "../../../types/db";

function makeAccount(
  konto_nr: string,
  kategorie: Account["kategorie"]
): Account {
  return {
    id: `id-${konto_nr}`,
    konto_nr,
    bezeichnung: `Konto ${konto_nr}`,
    kategorie,
    ust_satz: null,
    skr: "SKR03",
    is_active: true,
  };
}
function makeEntry(
  datum: string,
  soll: string,
  haben: string,
  betrag: number,
  beleg = "B1"
): JournalEntry {
  return {
    id: `e-${datum}-${beleg}`,
    datum,
    beleg_nr: beleg,
    beschreibung: `Test ${beleg}`,
    soll_konto: soll,
    haben_konto: haben,
    betrag,
    ust_satz: null,
    status: "gebucht",
    client_id: null,
    skonto_pct: null,
    skonto_tage: null,
    gegenseite: null,
    faelligkeit: null,
    version: 1,
    kostenstelle: null,
  };
}

function decode(bytes: Uint8Array): string {
  return new TextDecoder("latin1").decode(bytes);
}

const UNT = {
  name: "Test AG",
  steuernummer: "123/456/78901",
  adresse: "Musterstr. 1, 12345 Berlin",
};

describe("Gdpdu3Exporter (Z3-Export)", () => {
  const baseOptions = {
    unternehmen: UNT,
    zeitraum: { von: "2025-01-01", bis: "2025-12-31" },
    konten: [makeAccount("1200", "aktiva"), makeAccount("8400", "ertrag")],
    buchungen: [
      makeEntry("2025-03-15", "1200", "8400", 1000, "RE001"),
      makeEntry("2025-06-01", "1200", "8400", 2500, "RE002"),
    ],
    now: new Date("2025-12-31T23:00:00Z"),
  };

  it("produziert alle Pflicht-Dateien im Paket", async () => {
    const r = await exportZ3Package(baseOptions);
    const names = Array.from(r.files.keys()).sort();
    expect(names).toContain("INDEX.XML");
    expect(names).toContain("KONTEN.CSV");
    expect(names).toContain("BUCHUNGEN.CSV");
    expect(names).toContain("BELEGE.CSV");
    expect(names).toContain("STAMMDATEN.CSV");
    expect(names).toContain("MANIFEST.XML");
  });

  it("INDEX.XML ist well-formed XML", async () => {
    const r = await exportZ3Package(baseOptions);
    const xml = decode(r.files.get("INDEX.XML")!);
    expect(xml).toMatch(/^<\?xml version="1\.0" encoding="ISO-8859-15"\?>/);
    expect(xml).toContain("<DataSet");
    expect(xml).toContain("</DataSet>");
    expect(xml).toContain("urn:bundesministerium-der-finanzen:gdpdu");
  });

  it("INDEX.XML listet alle CSV-Dateien als Table-Einträge", async () => {
    const r = await exportZ3Package(baseOptions);
    const xml = decode(r.files.get("INDEX.XML")!);
    expect(xml).toContain("<URL>KONTEN.CSV</URL>");
    expect(xml).toContain("<URL>BUCHUNGEN.CSV</URL>");
    expect(xml).toContain("<URL>BELEGE.CSV</URL>");
    expect(xml).toContain("<URL>STAMMDATEN.CSV</URL>");
  });

  it("CSV mit Semikolon-Separator und Komma-Dezimal", async () => {
    const r = await exportZ3Package(baseOptions);
    const csv = decode(r.files.get("BUCHUNGEN.CSV")!);
    expect(csv).toContain(";");
    expect(csv).toContain("1000,00");
    expect(csv).not.toMatch(/[;"]1000\.00[;"]/);
  });

  it("Datum im DD.MM.YYYY-Format", async () => {
    const r = await exportZ3Package(baseOptions);
    const csv = decode(r.files.get("BUCHUNGEN.CSV")!);
    expect(csv).toContain("15.03.2025");
    expect(csv).toContain("01.06.2025");
  });

  it("CSV Header-Zeile enthält alle Pflichtfelder", async () => {
    const r = await exportZ3Package(baseOptions);
    const csv = decode(r.files.get("BUCHUNGEN.CSV")!);
    const header = csv.split("\r\n")[0];
    for (const field of [
      "ID",
      "Belegdatum",
      "Beleg-Nr",
      "Soll-Konto",
      "Haben-Konto",
      "Betrag",
    ]) {
      expect(header).toContain(`"${field}"`);
    }
  });

  it("Zeitraumfilter: Buchungen außerhalb werden ausgeschlossen", async () => {
    const entries = [
      makeEntry("2024-12-15", "1200", "8400", 100, "VJ"),
      makeEntry("2025-06-01", "1200", "8400", 200, "CY"),
      makeEntry("2026-01-05", "1200", "8400", 300, "FJ"),
    ];
    const r = await exportZ3Package({
      ...baseOptions,
      buchungen: entries,
    });
    const csv = decode(r.files.get("BUCHUNGEN.CSV")!);
    expect(csv).toContain("CY");
    expect(csv).not.toContain("VJ");
    expect(csv).not.toContain("FJ");
  });

  it("MANIFEST.XML enthält SHA-256 für jede Datei", async () => {
    const r = await exportZ3Package(baseOptions);
    const manifest = decode(r.files.get("MANIFEST.XML")!);
    expect(manifest).toContain("<SHA256>");
    // Mindestens 64-char hex in SHA-Tags
    expect(manifest).toMatch(/<SHA256>[0-9a-f]{64}<\/SHA256>/);
  });

  it("Manifest-Objekt matcht Dateigrößen + Hash-Format", async () => {
    const r = await exportZ3Package(baseOptions);
    expect(r.manifest.files.length).toBeGreaterThanOrEqual(5);
    for (const f of r.manifest.files) {
      expect(f.sizeBytes).toBeGreaterThan(0);
      expect(f.sha256).toMatch(/^[0-9a-f]{64}$/);
    }
  });

  it("STAMMDATEN.CSV enthält Unternehmen + Zeitraum", async () => {
    const r = await exportZ3Package(baseOptions);
    const csv = decode(r.files.get("STAMMDATEN.CSV")!);
    expect(csv).toContain("Test AG");
    expect(csv).toContain("123/456/78901");
    expect(csv).toContain("01.01.2025");
    expect(csv).toContain("31.12.2025");
  });

  it("BELEGE.CSV deduziert Belegnummern", async () => {
    const entries = [
      makeEntry("2025-01-01", "1200", "8400", 100, "R1"),
      makeEntry("2025-01-02", "1200", "8400", 200, "R2"),
      // Gleiche Belegnummer = 1 Zeile in Belege
      makeEntry("2025-01-03", "1200", "8400", 300, "R1"),
    ];
    const r = await exportZ3Package({ ...baseOptions, buchungen: entries });
    const csv = decode(r.files.get("BELEGE.CSV")!);
    const lines = csv.split("\r\n").filter((l) => l.length > 0);
    // 1 Header + 2 unique Belege
    expect(lines.length).toBe(3);
  });

  it("includeLohn=true fügt LOHN.CSV mit Header hinzu", async () => {
    const r = await exportZ3Package({ ...baseOptions, includeLohn: true });
    expect(r.files.has("LOHN.CSV")).toBe(true);
    const csv = decode(r.files.get("LOHN.CSV")!);
    expect(csv).toContain('"PersonalNr"');
    expect(csv).toContain('"Brutto"');
  });

  it("includeLohn=false (default) → keine LOHN.CSV", async () => {
    const r = await exportZ3Package(baseOptions);
    expect(r.files.has("LOHN.CSV")).toBe(false);
  });

  it("CSV mit Doppelanführungszeichen wird korrekt escaped", async () => {
    const entries = [
      {
        ...makeEntry("2025-01-01", "1200", "8400", 100, 'R"1'),
        beschreibung: 'Rechnung "Nr. 42"',
      },
    ];
    const r = await exportZ3Package({ ...baseOptions, buchungen: entries });
    const csv = decode(r.files.get("BUCHUNGEN.CSV")!);
    expect(csv).toContain('"Rechnung ""Nr. 42"""');
  });

  it("Encoding ISO-8859-15 im Manifest dokumentiert", async () => {
    const r = await exportZ3Package(baseOptions);
    expect(r.manifest.encoding).toBe("ISO-8859-15");
    expect(r.manifest.separator).toBe(";");
    expect(r.manifest.decimalSymbol).toBe(",");
  });
});
