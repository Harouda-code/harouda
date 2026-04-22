/**
 * Tests für DatevExtfImporter — Unit + Round-Trip.
 *
 * Der Round-Trip-Block ist der wichtigste Validierungsgate: er exportiert
 * Muster-Daten, importiert sie zurück und vergleicht semantisch. Ein
 * zusätzlicher Test re-exportiert die importierten Daten und prüft
 * Byte-Identität (modulo Timestamp im Header).
 */

import { describe, expect, it } from "vitest";
import Decimal from "decimal.js";
import type { Account, JournalEntry } from "../../../types/db";
import { exportBuchungsstapel } from "../DatevExporter";
import { parseDatevExtf } from "../DatevExtfImporter";
import {
  datevDateLongToIso,
  datevDateShortToIso,
  fromLatin1Bytes,
  parseDatevDecimal,
  toLatin1Bytes,
  ustSatzForBuSchluessel,
} from "../datevFormat";

// --- Fixtures ---------------------------------------------------------------

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

const FIXED_NOW = new Date("2026-04-20T10:00:00Z");

// --- datevFormat-Helper-Tests ----------------------------------------------

describe("fromLatin1Bytes (inverse zu toLatin1Bytes)", () => {
  it("ASCII-Roundtrip ist exakt", () => {
    const s = "Hello World 123;abc";
    const bytes = toLatin1Bytes(s);
    expect(fromLatin1Bytes(bytes)).toBe(s);
  });

  it("Latin-1-Umlaute im Roundtrip erhalten", () => {
    const s = "Müller Größe straße";
    const bytes = toLatin1Bytes(s);
    expect(fromLatin1Bytes(bytes)).toBe(s);
  });

  it("Zeichen außerhalb Latin-1 werden beim Export auf '?' gekippt (bekannte Begrenzung)", () => {
    const s = "Preis 100€";
    const bytes = toLatin1Bytes(s);
    expect(fromLatin1Bytes(bytes)).toBe("Preis 100?"); // € geht verloren
  });
});

describe("ustSatzForBuSchluessel", () => {
  it("mappt Standard-Schlüssel auf Ganzzahl-Prozent", () => {
    expect(ustSatzForBuSchluessel("1")).toBe(0);
    expect(ustSatzForBuSchluessel("2")).toBe(7);
    expect(ustSatzForBuSchluessel("3")).toBe(19);
    expect(ustSatzForBuSchluessel("8")).toBe(7);
    expect(ustSatzForBuSchluessel("9")).toBe(19);
  });

  it("leer oder unbekannt wird differenziert behandelt", () => {
    expect(ustSatzForBuSchluessel("")).toBe(0);
    expect(ustSatzForBuSchluessel("   ")).toBe(0);
    expect(ustSatzForBuSchluessel("42")).toBeNull();
    expect(ustSatzForBuSchluessel("abc")).toBeNull();
  });
});

describe("datevDateShortToIso / datevDateLongToIso", () => {
  it("TTMM + Wirtschaftsjahr → ISO", () => {
    expect(datevDateShortToIso("1501", 2025)).toBe("2025-01-15");
    expect(datevDateShortToIso("3112", 2025)).toBe("2025-12-31");
  });

  it("Ungültige TTMM-Datumsangaben werden abgelehnt", () => {
    expect(datevDateShortToIso("3102", 2025)).toBeNull(); // Feb 31
    expect(datevDateShortToIso("0013", 2025)).toBeNull();
    expect(datevDateShortToIso("abcd", 2025)).toBeNull();
    expect(datevDateShortToIso("151", 2025)).toBeNull(); // falsche Länge
  });

  it("YYYYMMDD → ISO", () => {
    expect(datevDateLongToIso("20250102")).toBe("2025-01-02");
    expect(datevDateLongToIso("20251231")).toBe("2025-12-31");
    expect(datevDateLongToIso("20250231")).toBeNull(); // Feb 31
  });
});

describe("parseDatevDecimal", () => {
  it("parst DATEV-Dezimalformat", () => {
    expect(parseDatevDecimal("1234,56")!.toString()).toBe("1234.56");
    expect(parseDatevDecimal("0,10")!.toString()).toBe("0.1");
    expect(parseDatevDecimal("42")!.toString()).toBe("42");
  });

  it("lehnt Tausenderpunkte im DATEV-Format ab (striktere Regex als csvImport)", () => {
    // DATEV-Zeilen haben keine Tausendertrennung
    expect(parseDatevDecimal("1.234,56")).toBeNull();
    expect(parseDatevDecimal("1234.56")).toBeNull(); // US-Format
    expect(parseDatevDecimal("abc")).toBeNull();
    expect(parseDatevDecimal("")).toBeNull();
  });
});

// --- Header-Validierung ----------------------------------------------------

describe("parseDatevExtf — Header", () => {
  it("leere Datei → Fehler", () => {
    const res = parseDatevExtf("");
    expect(res.header).toBeNull();
    expect(res.errors[0].message).toContain("leer");
  });

  it("Fehlender EXTF-Marker → Fehler mit Klartext", () => {
    const res = parseDatevExtf(`"XYZ";510;21;\r\n`);
    expect(res.header).toBeNull();
    expect(res.errors.some((e) => e.field === "format")).toBe(true);
  });

  it("EXTF mit abweichender Version → Warnung, Parser läuft weiter", () => {
    // Minimaler 17-Felder-Header (alle Pflichtfelder) + abweichende Version
    const header = [
      `"EXTF"`,
      `700`, // abweichende Version
      `21`,
      `"Buchungsstapel"`,
      `7`,
      `20260420100000000`,
      ``,
      `"RE"`,
      `""`,
      `""`,
      `1`,
      `1`,
      `20250101`,
      `4`,
      `20250101`,
      `20251231`,
      `"Test"`,
    ].join(";");
    const res = parseDatevExtf(header + "\r\n");
    expect(res.header).not.toBeNull();
    expect(res.warnings.some((w) => w.field === "version")).toBe(true);
  });

  it("Mandant-Mismatch → Warnung, wenn expectedMandantNr gesetzt", () => {
    // Export mit Mandant 100, Import erwartet 999
    const csv = exportBuchungsstapel({
      mandantNr: 100,
      beraterNr: 1,
      kanzleiName: "Kanzlei",
      wirtschaftsjahr: 2025,
      zeitraum: { von: "2025-01-01", bis: "2025-12-31" },
      entries: [],
      accounts: [],
      now: FIXED_NOW,
    });
    const res = parseDatevExtf(csv, { expectedMandantNr: 999 });
    expect(res.warnings.some((w) => w.field === "mandant_nr")).toBe(true);
  });
});

// --- Buchungszeilen --------------------------------------------------------

describe("parseDatevExtf — Buchungszeilen", () => {
  it("parst eine einzelne Buchungszeile aus eigenem Export korrekt", () => {
    // Der Exporter leitet BU-Schlüssel aus SOLL-Konto.ust_satz ab.
    // Für BU=3 (19 %) muss das SOLL-Konto die USt-Rate tragen — in
    // SKR03-Praxis typisch bei Wareneingang 3400.
    const accounts = [
      makeAccount("1200", "aktiva"),
      makeAccount("3400", "aufwand", 0.19), // SOLL trägt die 19 %
    ];
    const entries = [
      makeEntry("2025-03-15", "3400", "1200", 1190.00, "R-001", "Testumsatz"),
    ];
    const csv = exportBuchungsstapel({
      mandantNr: 42,
      beraterNr: 99,
      kanzleiName: "Kanzlei Demo",
      wirtschaftsjahr: 2025,
      zeitraum: { von: "2025-01-01", bis: "2025-12-31" },
      entries,
      accounts,
      now: FIXED_NOW,
    });
    const res = parseDatevExtf(csv);
    expect(res.errors).toHaveLength(0);
    expect(res.rows).toHaveLength(1);
    const r = res.rows[0];
    expect(r.datum).toBe("2025-03-15");
    expect(r.beleg_nr).toBe("R-001");
    expect(r.soll_konto).toBe("3400");
    expect(r.haben_konto).toBe("1200");
    expect(r.betrag.toNumber()).toBe(1190);
    expect(r.ust_satz).toBe(19); // BU "3" → 19
    expect(r.beschreibung).toBe("Testumsatz");
    expect(r.kostenstelle).toBeNull();
  });

  it("H-Kennzeichen dreht Konto und Gegenkonto", () => {
    // Synthetische Zeile mit S/H="H"
    const header = [
      `"EXTF"`, 510, 21, `"Buchungsstapel"`, 7, `20260420100000000`,
      ``, `"RE"`, `""`, `""`, 1, 1, `20250101`, 4, `20250101`, `20251231`,
      `"Test"`,
    ].join(";");
    const colHeader = `"Umsatz";"S/H";"WKZ";"";"";"";"";"";"";"";"";"";"";""`;
    const line = `500,00;"H";"EUR";;;;1200;4210;;1503;"R-X";"";;"Test"`;
    const csv = [header, colHeader, line].join("\r\n") + "\r\n";
    const res = parseDatevExtf(csv);
    expect(res.rows).toHaveLength(1);
    expect(res.rows[0].soll_konto).toBe("4210"); // Feld 7=1200 war Haben → umgedreht
    expect(res.rows[0].haben_konto).toBe("1200");
  });

  it("Kostenstelle 1 wird übernommen, KOST2 erzeugt Warnung", () => {
    const header = [
      `"EXTF"`, 510, 21, `"Buchungsstapel"`, 7, `20260420100000000`,
      ``, `"RE"`, `""`, `""`, 1, 1, `20250101`, 4, `20250101`, `20251231`,
      `"Test"`,
    ].join(";");
    const colHeader = `"Umsatz";"S/H";"WKZ";"";"";"";"";"";"";"";"";"";"";""`;
    // 38 Spalten: Position 36 = KOST1, 37 = KOST2
    const cells = new Array(38).fill("");
    cells[0] = "100,00";
    cells[1] = '"S"';
    cells[2] = '"EUR"';
    cells[6] = "1200";
    cells[7] = "4210";
    cells[8] = "";
    cells[9] = "1503";
    cells[10] = '"R-KST"';
    cells[11] = '""';
    cells[12] = "";
    cells[13] = '"Test"';
    cells[36] = '"KST-VERTRIEB"';
    cells[37] = '"KST-PROJEKT-A"';
    const line = cells.join(";");
    const csv = [header, colHeader, line].join("\r\n") + "\r\n";
    const res = parseDatevExtf(csv);
    expect(res.rows).toHaveLength(1);
    expect(res.rows[0].kostenstelle).toBe("KST-VERTRIEB");
    expect(res.warnings.some((w) => w.field === "kostenstelle")).toBe(true);
  });

  it("Fehlertoleranz: ungültige Zeile wird übersprungen, Rest importiert", () => {
    const accounts = [
      makeAccount("1200", "aktiva"),
      makeAccount("8400", "ertrag", 0.19),
    ];
    const entries = [
      makeEntry("2025-03-15", "1200", "8400", 100.0, "R-OK1", "Ok 1"),
      makeEntry("2025-03-16", "1200", "8400", 200.0, "R-OK2", "Ok 2"),
    ];
    const csv = exportBuchungsstapel({
      mandantNr: 1, beraterNr: 1, kanzleiName: "K", wirtschaftsjahr: 2025,
      zeitraum: { von: "2025-01-01", bis: "2025-12-31" },
      entries, accounts, now: FIXED_NOW,
    });
    // Manipulation: eine fehlerhafte Zeile dazwischen einfügen
    const lines = csv.split("\r\n");
    lines.splice(3, 0, `invalid;;;;;;;;;;;;;`);
    const manipulated = lines.join("\r\n");

    const res = parseDatevExtf(manipulated);
    expect(res.errors.length).toBeGreaterThan(0);
    expect(res.rows).toHaveLength(2); // beide OK-Zeilen durchgekommen
  });

  it("Belegfeld 1 (beleg_nr) darf nicht leer sein", () => {
    const header = [
      `"EXTF"`, 510, 21, `"Buchungsstapel"`, 7, `20260420100000000`,
      ``, `"RE"`, `""`, `""`, 1, 1, `20250101`, 4, `20250101`, `20251231`,
      `"Test"`,
    ].join(";");
    const colHeader = `"Umsatz";"S/H";"WKZ";"";"";"";"";"";"";"";"";"";"";""`;
    const line = `100,00;"S";"EUR";;;;1200;4210;;1503;"";"";;"Test"`;
    const csv = [header, colHeader, line].join("\r\n") + "\r\n";
    const res = parseDatevExtf(csv);
    expect(res.rows).toHaveLength(0);
    expect(res.errors.some((e) => e.field === "belegfeld_1")).toBe(true);
  });
});

// --- Bytes-Input + Encoding ------------------------------------------------

describe("parseDatevExtf — Bytes-Input", () => {
  it("akzeptiert Uint8Array (ISO-8859-1) und dekodiert korrekt", () => {
    const accounts = [
      makeAccount("1200", "aktiva"),
      makeAccount("8400", "ertrag", 0.19),
    ];
    const entries = [
      makeEntry("2025-03-15", "1200", "8400", 500.0, "R-BYT", "Müller Rechnung"),
    ];
    const csv = exportBuchungsstapel({
      mandantNr: 1, beraterNr: 1, kanzleiName: "Kanzlei", wirtschaftsjahr: 2025,
      zeitraum: { von: "2025-01-01", bis: "2025-12-31" },
      entries, accounts, now: FIXED_NOW,
    });
    const bytes = toLatin1Bytes(csv);
    const res = parseDatevExtf(bytes);
    expect(res.errors).toHaveLength(0);
    expect(res.rows).toHaveLength(1);
    expect(res.rows[0].beschreibung).toBe("Müller Rechnung");
  });
});

// --- Round-Trip (Hauptvalidierung) -----------------------------------------

describe("Round-Trip Export → Import", () => {
  const accounts = [
    makeAccount("1200", "aktiva"),
    makeAccount("1400", "aktiva"),
    makeAccount("3400", "aufwand", 0.19),
    makeAccount("4120", "aufwand"),
    makeAccount("8300", "ertrag", 0.07),
    makeAccount("8400", "ertrag", 0.19),
  ];
  const entries: JournalEntry[] = [
    makeEntry("2025-01-15", "1400", "8400", 1190.0, "AR-001", "Rechnung A"),
    makeEntry("2025-03-20", "3400", "1200", 500.0, "ER-001", "Wareneingang"),
    makeEntry("2025-05-10", "1200", "8300", 214.0, "AR-002", "Rechnung B 7%"),
    makeEntry("2025-09-30", "4120", "1200", 15000.0, "LG-Q3", "Gehälter Q3"),
  ];

  it("semantischer Round-Trip: parsed rows entsprechen den Eingabe-Entries", () => {
    const csv = exportBuchungsstapel({
      mandantNr: 42, beraterNr: 99, kanzleiName: "K",
      wirtschaftsjahr: 2025,
      zeitraum: { von: "2025-01-01", bis: "2025-12-31" },
      entries, accounts, now: FIXED_NOW,
    });
    const res = parseDatevExtf(csv);
    expect(res.errors).toHaveLength(0);
    expect(res.rows).toHaveLength(entries.length);

    for (let i = 0; i < entries.length; i++) {
      const orig = entries[i];
      const parsed = res.rows[i];
      expect(parsed.datum).toBe(orig.datum);
      expect(parsed.beleg_nr).toBe(orig.beleg_nr);
      expect(parsed.soll_konto).toBe(orig.soll_konto);
      expect(parsed.haben_konto).toBe(orig.haben_konto);
      expect(parsed.betrag.toNumber()).toBe(orig.betrag);
      expect(parsed.beschreibung).toBe(orig.beschreibung);
    }
  });

  it("Byte-Identität: Export → Import → Re-Export produziert identische Bytes (gleicher Timestamp)", () => {
    const csv1 = exportBuchungsstapel({
      mandantNr: 42, beraterNr: 99, kanzleiName: "K",
      wirtschaftsjahr: 2025,
      zeitraum: { von: "2025-01-01", bis: "2025-12-31" },
      entries, accounts, now: FIXED_NOW,
    });

    const res = parseDatevExtf(csv1);
    expect(res.errors).toHaveLength(0);

    // Re-Konstruiere JournalEntries aus den geparsten Zeilen
    const reconstructed: JournalEntry[] = res.rows.map((r, i) => ({
      ...entries[i], // id/version/status etc. behalten
      datum: r.datum,
      beleg_nr: r.beleg_nr,
      soll_konto: r.soll_konto,
      haben_konto: r.haben_konto,
      betrag: r.betrag.toNumber(),
      beschreibung: r.beschreibung,
    }));

    const csv2 = exportBuchungsstapel({
      mandantNr: 42, beraterNr: 99, kanzleiName: "K",
      wirtschaftsjahr: 2025,
      zeitraum: { von: "2025-01-01", bis: "2025-12-31" },
      entries: reconstructed,
      accounts,
      now: FIXED_NOW, // gleicher Timestamp
    });

    expect(csv2).toBe(csv1);
  });

  it("Decimal-Präzision bleibt über Round-Trip erhalten", () => {
    // Beträge, die in JS-number Drift erzeugen würden
    const tricky: JournalEntry[] = [
      makeEntry("2025-06-01", "1200", "8400", 0.1, "P-01", "Zehntel"),
      makeEntry("2025-06-01", "1200", "8400", 0.2, "P-02", "Zwei Zehntel"),
      makeEntry("2025-06-01", "1200", "8400", 0.3, "P-03", "Drei Zehntel"),
    ];
    const csv = exportBuchungsstapel({
      mandantNr: 1, beraterNr: 1, kanzleiName: "K", wirtschaftsjahr: 2025,
      zeitraum: { von: "2025-01-01", bis: "2025-12-31" },
      entries: tricky, accounts: [makeAccount("1200", "aktiva"), makeAccount("8400", "ertrag", 0.19)],
      now: FIXED_NOW,
    });
    const res = parseDatevExtf(csv);
    expect(res.rows).toHaveLength(3);

    const sum = res.rows.reduce((acc, r) => acc.plus(r.betrag), new Decimal(0));
    expect(sum.toString()).toBe("0.6"); // keine Float-Drift
  });
});
