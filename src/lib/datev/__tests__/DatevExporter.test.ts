import { describe, it, expect } from "vitest";
import type { Account, JournalEntry } from "../../../types/db";
import {
  exportBuchungsstapel,
  validateBuchungsstapel,
  datevFilename,
} from "../DatevExporter";
import {
  DATEV_COLUMN_HEADERS,
  datevDateShort,
  datevDateLong,
  datevDecimal,
  datevTextField,
  buSchluesselForUstSatz,
  toLatin1Bytes,
} from "../datevFormat";

function makeAccount(
  konto_nr: string,
  kategorie: Account["kategorie"],
  ust_satz: number | null = null
): Account {
  return {
    id: `id-${konto_nr}`,
    konto_nr,
    bezeichnung: `Konto ${konto_nr}`,
    kategorie,
    ust_satz,
    skr: "SKR03",
    is_active: true,
  };
}
function makeEntry(
  datum: string,
  soll: string,
  haben: string,
  betrag: number,
  beleg = "B1",
  beschreibung = "Test"
): JournalEntry {
  return {
    id: `e-${beleg}`,
    datum,
    beleg_nr: beleg,
    beschreibung,
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

describe("datevFormat helpers", () => {
  it("datevDecimal: '1234.56' → '1234,56'", () => {
    expect(datevDecimal("1234.56")).toBe("1234,56");
  });
  it("datevDecimal: negative wird unsigned (Vorzeichen über S/H)", () => {
    expect(datevDecimal("-500.00")).toBe("500,00");
  });
  it("datevDateShort: '2025-10-15' → '1510'", () => {
    expect(datevDateShort("2025-10-15")).toBe("1510");
  });
  it("datevDateShort: wirft bei ungültigem Datum", () => {
    expect(() => datevDateShort("2025-1-1")).toThrow();
  });
  it("datevDateLong: '2025-10-15' → '20251015'", () => {
    expect(datevDateLong("2025-10-15")).toBe("20251015");
  });
  it("datevTextField: escape + truncate auf maxLen", () => {
    expect(datevTextField('Hallo "Welt"', 60)).toBe('"Hallo ""Welt"""');
    expect(datevTextField("x".repeat(100), 10)).toBe(`"${"x".repeat(10)}"`);
  });
  it("datevTextField: null → '\"\"'", () => {
    expect(datevTextField(null, 10)).toBe('""');
  });
  it("buSchluesselForUstSatz: 19 % → '3', 7 % → '2', 0 → '1', null → ''", () => {
    expect(buSchluesselForUstSatz(0.19)).toBe("3");
    expect(buSchluesselForUstSatz(0.07)).toBe("2");
    expect(buSchluesselForUstSatz(0)).toBe("1");
    expect(buSchluesselForUstSatz(null)).toBe("");
  });
  it("toLatin1Bytes: ASCII unverändert, Ümlaut als 0xFC", () => {
    const b = toLatin1Bytes("Müller");
    expect(b[0]).toBe(0x4d);
    expect(b[1]).toBe(0xfc); // ü in Latin-1
    expect(b[2]).toBe(0x6c);
  });
});

describe("DatevExporter", () => {
  const baseOptions = {
    mandantNr: 12345,
    beraterNr: 99999,
    kanzleiName: "Kanzlei Müller",
    wirtschaftsjahr: 2025,
    zeitraum: { von: "2025-01-01", bis: "2025-12-31" },
    now: new Date("2025-10-15T14:30:00Z"),
  };

  it("Header starts with EXTF 510 21 Buchungsstapel", () => {
    const csv = exportBuchungsstapel({
      ...baseOptions,
      accounts: [],
      entries: [],
    });
    const firstLine = csv.split("\r\n")[0];
    expect(firstLine).toMatch(/^"EXTF";510;21;"Buchungsstapel"/);
  });

  it("Header contains Berater-Nr and Mandant-Nr", () => {
    const csv = exportBuchungsstapel({
      ...baseOptions,
      accounts: [],
      entries: [],
    });
    const firstLine = csv.split("\r\n")[0];
    expect(firstLine).toMatch(/;99999;12345;/);
  });

  it("Column header row matches German BMF spec", () => {
    const csv = exportBuchungsstapel({
      ...baseOptions,
      accounts: [],
      entries: [],
    });
    const rows = csv.split("\r\n");
    const header = rows[1];
    for (const h of DATEV_COLUMN_HEADERS) {
      expect(header).toContain(`"${h}"`);
    }
  });

  it("Simple Bank an Umsatz produces correct DATEV line", () => {
    const accounts = [
      makeAccount("1200", "aktiva"),
      makeAccount("8400", "ertrag", 0.19),
    ];
    const entries = [
      makeEntry("2025-10-15", "1200", "8400", 1190, "RE1"),
    ];
    const csv = exportBuchungsstapel({
      ...baseOptions,
      accounts,
      entries,
    });
    const lines = csv.split("\r\n");
    // Zeile 2 ist column header, Zeile 3 = erste Buchung
    const booking = lines[2];
    // Spalten: 1190,00; S; EUR; ; ; ; 1200; 8400; (BU from 1200 ust_satz=null → ""); 1510; "RE1"; ""; ; "Test"
    expect(booking).toContain("1190,00");
    expect(booking).toContain('"S"');
    expect(booking).toContain('"EUR"');
    expect(booking).toContain(";1200;8400;");
    expect(booking).toContain(";1510;"); // Belegdatum
    expect(booking).toContain('"RE1"');
    expect(booking).toContain('"Test"');
  });

  it("Multiple entries produce multiple lines", () => {
    const accounts = [
      makeAccount("1200", "aktiva"),
      makeAccount("8400", "ertrag"),
    ];
    const entries = [
      makeEntry("2025-03-01", "1200", "8400", 1000, "R1"),
      makeEntry("2025-04-01", "1200", "8400", 2000, "R2"),
      makeEntry("2025-05-01", "1200", "8400", 3000, "R3"),
    ];
    const csv = exportBuchungsstapel({
      ...baseOptions,
      accounts,
      entries,
    });
    // Header + Column header + 3 data lines + trailing CRLF → split produces 6 parts (last = "")
    const parts = csv.split("\r\n");
    expect(parts.length).toBe(6);
    expect(parts[5]).toBe("");
  });

  it("Empty dataset: only header + column row + trailing CRLF", () => {
    const csv = exportBuchungsstapel({
      ...baseOptions,
      accounts: [],
      entries: [],
    });
    const parts = csv.split("\r\n");
    expect(parts.length).toBe(3); // header, colheader, "" after trailing \r\n
    expect(parts[2]).toBe("");
  });

  it("CRLF line endings throughout", () => {
    const accounts = [
      makeAccount("1200", "aktiva"),
      makeAccount("8400", "ertrag"),
    ];
    const entries = [makeEntry("2025-03-01", "1200", "8400", 100, "R")];
    const csv = exportBuchungsstapel({
      ...baseOptions,
      accounts,
      entries,
    });
    // Keine nackten \n vorhanden (außer als Teil von \r\n)
    expect(csv.replace(/\r\n/g, "")).not.toMatch(/\n/);
  });

  it("Decimal comma throughout (no period in numbers)", () => {
    const accounts = [
      makeAccount("1200", "aktiva"),
      makeAccount("8400", "ertrag"),
    ];
    const entries = [makeEntry("2025-03-01", "1200", "8400", 1234.56, "R")];
    const csv = exportBuchungsstapel({
      ...baseOptions,
      accounts,
      entries,
    });
    const booking = csv.split("\r\n")[2];
    expect(booking).toContain("1234,56");
    expect(booking).not.toContain("1234.56");
  });

  it("BU-Schlüssel = 3 when Soll-Konto ust_satz = 0.19", () => {
    const accounts = [
      makeAccount("1200", "aktiva", 0.19),
      makeAccount("8400", "ertrag"),
    ];
    const entries = [makeEntry("2025-03-01", "1200", "8400", 119, "R")];
    const csv = exportBuchungsstapel({
      ...baseOptions,
      accounts,
      entries,
    });
    const booking = csv.split("\r\n")[2];
    // BU-Schlüssel ist Feld 9: nach 8400;3;
    expect(booking).toMatch(/;8400;3;/);
  });

  it("Belegnummer > 12 chars is truncated", () => {
    const accounts = [
      makeAccount("1200", "aktiva"),
      makeAccount("8400", "ertrag"),
    ];
    const entries = [
      makeEntry("2025-03-01", "1200", "8400", 100, "ABCDEFGHIJKLMNOP"),
    ];
    const csv = exportBuchungsstapel({
      ...baseOptions,
      accounts,
      entries,
    });
    const booking = csv.split("\r\n")[2];
    expect(booking).toContain('"ABCDEFGHIJKL"');
    expect(booking).not.toContain('"ABCDEFGHIJKLM"');
  });

  it("Buchungstext > 60 chars is truncated", () => {
    const accounts = [
      makeAccount("1200", "aktiva"),
      makeAccount("8400", "ertrag"),
    ];
    const longText = "x".repeat(80);
    const entries = [makeEntry("2025-03-01", "1200", "8400", 100, "R", longText)];
    const csv = exportBuchungsstapel({
      ...baseOptions,
      accounts,
      entries,
    });
    const booking = csv.split("\r\n")[2];
    expect(booking).toContain(`"${"x".repeat(60)}"`);
    expect(booking).not.toContain(`"${"x".repeat(61)}"`);
  });

  it("Quotes in Buchungstext are escaped (doubled)", () => {
    const accounts = [
      makeAccount("1200", "aktiva"),
      makeAccount("8400", "ertrag"),
    ];
    const entries = [
      makeEntry("2025-03-01", "1200", "8400", 100, "R", 'Rechnung "Nr. 42"'),
    ];
    const csv = exportBuchungsstapel({
      ...baseOptions,
      accounts,
      entries,
    });
    const booking = csv.split("\r\n")[2];
    expect(booking).toContain('"Rechnung ""Nr. 42"""');
  });

  it("entwurf-Buchungen werden ausgeschlossen", () => {
    const accounts = [
      makeAccount("1200", "aktiva"),
      makeAccount("8400", "ertrag"),
    ];
    const entries: JournalEntry[] = [
      makeEntry("2025-03-01", "1200", "8400", 100, "R1"),
      { ...makeEntry("2025-04-01", "1200", "8400", 200, "R2"), status: "entwurf" },
    ];
    const csv = exportBuchungsstapel({
      ...baseOptions,
      accounts,
      entries,
    });
    const parts = csv.split("\r\n");
    expect(parts.length).toBe(4); // header + colheader + 1 booking + trailing ""
  });

  it("kontoFilter beschränkt Export", () => {
    const accounts = [
      makeAccount("1200", "aktiva"),
      makeAccount("8400", "ertrag"),
      makeAccount("4100", "aufwand"),
    ];
    const entries = [
      makeEntry("2025-03-01", "1200", "8400", 100, "R1"),
      makeEntry("2025-04-01", "4100", "1200", 200, "R2"),
    ];
    const csv = exportBuchungsstapel({
      ...baseOptions,
      accounts,
      entries,
      kontoFilter: ["8400"],
    });
    const parts = csv.split("\r\n");
    // nur Buchung 1 (enthält 8400) exportiert
    expect(parts.length).toBe(4);
    expect(parts[2]).toContain("R1");
  });

  it("out-of-range entries are excluded", () => {
    const accounts = [
      makeAccount("1200", "aktiva"),
      makeAccount("8400", "ertrag"),
    ];
    const entries = [
      makeEntry("2024-06-01", "1200", "8400", 100, "VJ"),
      makeEntry("2025-06-01", "1200", "8400", 200, "CY"),
    ];
    const csv = exportBuchungsstapel({
      ...baseOptions,
      accounts,
      entries,
    });
    const parts = csv.split("\r\n");
    expect(parts.length).toBe(4); // nur 2025-Buchung
    expect(parts[2]).toContain("CY");
  });

  it("validateBuchungsstapel: balanced + warnings for duplicates", () => {
    const accounts = [
      makeAccount("1200", "aktiva"),
      makeAccount("8400", "ertrag"),
    ];
    const entries = [
      makeEntry("2025-03-01", "1200", "8400", 100, "DUP"),
      makeEntry("2025-04-01", "1200", "8400", 200, "DUP"),
    ];
    const v = validateBuchungsstapel({
      ...baseOptions,
      accounts,
      entries,
    });
    expect(v.entryCount).toBe(2);
    expect(v.totalSoll).toBe("300.00");
    expect(v.totalHaben).toBe("300.00");
    expect(v.balanced).toBe(true);
    expect(v.duplicateBelege).toBe(1);
    expect(v.warnings.some((w) => w.includes("Belegnummer"))).toBe(true);
  });

  it("datevFilename matches DTVF_<MandantNr>_YYYYMMDD_YYYYMMDD.csv", () => {
    const f = datevFilename({
      mandantNr: 12345,
      zeitraum: { von: "2025-01-01", bis: "2025-12-31" },
    });
    expect(f).toBe("DTVF_12345_20250101_20251231.csv");
  });
});
