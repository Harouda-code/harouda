import { describe, it, expect } from "vitest";
import type { Account, JournalEntry } from "../../../types/db";
import { buildBwa } from "../BwaBuilder";

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
  beleg = "B"
): JournalEntry {
  return {
    id: `e-${beleg}-${datum}-${soll}-${haben}`,
    datum,
    beleg_nr: beleg,
    beschreibung: beleg,
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

describe("BwaBuilder (DATEV Form 01)", () => {
  it("simple BWA: Umsatz 50000, Personalkosten 30000 → Betriebsergebnis 20000", () => {
    const accounts = [
      makeAccount("1200", "aktiva"),
      makeAccount("8400", "ertrag"),
      makeAccount("4100", "aufwand"),
    ];
    const entries = [
      makeEntry("2025-10-15", "1200", "8400", 50000, "UMS"),
      makeEntry("2025-10-20", "4100", "1200", 30000, "LOHN"),
    ];
    const r = buildBwa({
      accounts,
      entries,
      monat: 10,
      jahr: 2025,
    });
    // YTD = Monat in diesem Fall (nur Oktober-Daten)
    expect(r.betriebsleistung).toBe("50000.00");
    expect(r.betriebsergebnis).toBe("20000.00");
    expect(r.vorlaeufigesErgebnis).toBe("20000.00");
  });

  it("Monatswert vs Jahreswert correctly separated", () => {
    const accounts = [
      makeAccount("1200", "aktiva"),
      makeAccount("8400", "ertrag"),
    ];
    const entries = [
      makeEntry("2025-01-15", "1200", "8400", 10000, "JAN"),
      makeEntry("2025-05-15", "1200", "8400", 20000, "MAI"),
      makeEntry("2025-10-15", "1200", "8400", 30000, "OKT"),
      makeEntry("2025-11-15", "1200", "8400", 99999, "NOV"),  // nach Okt-Ende
    ];
    const r = buildBwa({
      accounts,
      entries,
      monat: 10,
      jahr: 2025,
    });
    const umsatz = r.positionen.find((p) => p.code === "1")!;
    expect(umsatz.monatsWert).toBe("30000.00"); // nur Oktober
    expect(umsatz.jahresWert).toBe("60000.00"); // Jan+Mai+Okt, nicht Nov
  });

  it("Rohertragsquote = Rohertrag / Betriebsleistung * 100", () => {
    const accounts = [
      makeAccount("1200", "aktiva"),
      makeAccount("8400", "ertrag"),
      makeAccount("3400", "aufwand"), // Wareneingang → BWA 4
    ];
    const entries = [
      makeEntry("2025-10-15", "1200", "8400", 10000, "UMS"),
      makeEntry("2025-10-20", "3400", "1200", 4000, "WARE"),
    ];
    const r = buildBwa({
      accounts,
      entries,
      monat: 10,
      jahr: 2025,
    });
    // Rohertrag = 10000 - 4000 = 6000; Betriebsleistung = 10000
    // Quote = 60.00%
    expect(r.rohertrag).toBe("6000.00");
    expect(r.betriebsleistung).toBe("10000.00");
    expect(r.kennzahlen.rohertragsQuote).toBe("60.00");
  });

  it("Division by zero: Kennzahlen zeigen '—' wenn Umsatz = 0", () => {
    const r = buildBwa({
      accounts: [],
      entries: [],
      monat: 10,
      jahr: 2025,
    });
    expect(r.kennzahlen.rohertragsQuote).toBe("—");
    expect(r.kennzahlen.personalkostenQuote).toBe("—");
    expect(r.kennzahlen.umsatzrendite).toBe("—");
  });

  it("Subtotals cascade correctly (BL → RE → BRE → BE → EVS → VE)", () => {
    const accounts = [
      makeAccount("1200", "aktiva"),
      makeAccount("8400", "ertrag"), // Umsatz → BWA 1
      makeAccount("3400", "aufwand"), // Waren → BWA 4
      makeAccount("2700", "ertrag"), // Sonst. betr. Ertrag → GuV 4 → BWA 6
      makeAccount("4100", "aufwand"), // Personalkosten → BWA 10
      makeAccount("4200", "aufwand"), // Raumkosten → BWA 11
      makeAccount("2310", "aufwand"), // Zinsaufwand → BWA 30 (2300 ist Grundkapital, siehe Post-Bugfix Bug B)
      makeAccount("7600", "aufwand"), // KSt → BWA 40
    ];
    const entries = [
      makeEntry("2025-10-01", "1200", "8400", 10000, "UMS"),
      makeEntry("2025-10-02", "3400", "1200", 3000, "WARE"),
      makeEntry("2025-10-03", "1200", "2700", 500, "SONST_ERTRAG"),
      makeEntry("2025-10-04", "4100", "1200", 2000, "LOHN"),
      makeEntry("2025-10-05", "4200", "1200", 800, "MIETE"),
      makeEntry("2025-10-06", "2310", "1200", 200, "ZINS"),
      makeEntry("2025-10-07", "7600", "1200", 300, "KST"),
    ];
    const r = buildBwa({
      accounts,
      entries,
      monat: 10,
      jahr: 2025,
    });
    // BL = 10000
    expect(r.betriebsleistung).toBe("10000.00");
    // RE = BL - Mat(3000) = 7000
    expect(r.rohertrag).toBe("7000.00");
    // BRE = RE + 6(500) = 7500
    const bre = r.positionen.find((p) => p.code === "BRE")!;
    expect(bre.jahresWert).toBe("7500.00");
    // GK = 10(2000) + 11(800) = 2800 (rest 0)
    const gk = r.positionen.find((p) => p.code === "GK")!;
    expect(gk.jahresWert).toBe("2800.00");
    // BE = BRE - GK = 4700
    expect(r.betriebsergebnis).toBe("4700.00");
    // EVS = BE + 32(0) - 30(200) = 4500
    expect(r.ergebnisVorSteuern).toBe("4500.00");
    // VE = EVS - 40(300) = 4200
    expect(r.vorlaeufigesErgebnis).toBe("4200.00");
  });

  it("Personalkosten-Quote with precision", () => {
    const accounts = [
      makeAccount("1200", "aktiva"),
      makeAccount("8400", "ertrag"),
      makeAccount("4100", "aufwand"),
    ];
    const entries = [
      makeEntry("2025-10-01", "1200", "8400", 10000, "UMS"),
      makeEntry("2025-10-02", "4100", "1200", 2500, "LOHN"),
    ];
    const r = buildBwa({
      accounts,
      entries,
      monat: 10,
      jahr: 2025,
    });
    // 2500 / 10000 = 25.00%
    expect(r.kennzahlen.personalkostenQuote).toBe("25.00");
  });

  it("Vergleichsperiode VORJAHR: shifts range by 1 year", () => {
    const accounts = [
      makeAccount("1200", "aktiva"),
      makeAccount("8400", "ertrag"),
    ];
    const entries = [
      makeEntry("2024-10-15", "1200", "8400", 5000, "VJ"),
      makeEntry("2025-10-15", "1200", "8400", 8000, "AKT"),
    ];
    const r = buildBwa({
      accounts,
      entries,
      monat: 10,
      jahr: 2025,
      vergleichsperiode: "VORJAHR",
    });
    const umsatz = r.positionen.find((p) => p.code === "1")!;
    expect(umsatz.monatsWert).toBe("8000.00");
    expect(umsatz.vergleichWert).toBe("5000.00"); // Oktober-Vorjahr
  });

  it("Vergleichsperiode VORMONAT: shifts to previous month", () => {
    const accounts = [
      makeAccount("1200", "aktiva"),
      makeAccount("8400", "ertrag"),
    ];
    const entries = [
      makeEntry("2025-09-15", "1200", "8400", 5000, "SEP"),
      makeEntry("2025-10-15", "1200", "8400", 8000, "OKT"),
    ];
    const r = buildBwa({
      accounts,
      entries,
      monat: 10,
      jahr: 2025,
      vergleichsperiode: "VORMONAT",
    });
    const umsatz = r.positionen.find((p) => p.code === "1")!;
    expect(umsatz.monatsWert).toBe("8000.00");
    expect(umsatz.vergleichWert).toBe("5000.00");
  });

  it("Vergleichsperiode VORMONAT with monat=1 wraps to Dezember Vorjahr", () => {
    const accounts = [
      makeAccount("1200", "aktiva"),
      makeAccount("8400", "ertrag"),
    ];
    const entries = [
      makeEntry("2024-12-15", "1200", "8400", 3000, "DEZ24"),
      makeEntry("2025-01-10", "1200", "8400", 1500, "JAN25"),
    ];
    const r = buildBwa({
      accounts,
      entries,
      monat: 1,
      jahr: 2025,
      vergleichsperiode: "VORMONAT",
    });
    const umsatz = r.positionen.find((p) => p.code === "1")!;
    expect(umsatz.monatsWert).toBe("1500.00");
    expect(umsatz.vergleichWert).toBe("3000.00");
  });

  it("invalid month throws", () => {
    expect(() =>
      buildBwa({ accounts: [], entries: [], monat: 0, jahr: 2025 })
    ).toThrow(/ungültiger Monat/);
    expect(() =>
      buildBwa({ accounts: [], entries: [], monat: 13, jahr: 2025 })
    ).toThrow(/ungültiger Monat/);
  });

  it("bezeichnung is locale-aware German month name", () => {
    const r = buildBwa({ accounts: [], entries: [], monat: 10, jahr: 2025 });
    expect(r.bezeichnung).toBe("Oktober 2025");
  });

  it("empty data: all values 0, final result 0", () => {
    const r = buildBwa({ accounts: [], entries: [], monat: 6, jahr: 2025 });
    expect(r.vorlaeufigesErgebnis).toBe("0.00");
    expect(r.positionen.find((p) => p.code === "VE")!.isFinalResult).toBe(true);
  });

  it("Money precision: 1000 × 0.01 Umsatz in one month = 10.00", () => {
    const accounts = [
      makeAccount("1200", "aktiva"),
      makeAccount("8400", "ertrag"),
    ];
    const entries = Array.from({ length: 1000 }, (_, i) =>
      makeEntry("2025-10-01", "1200", "8400", 0.01, `E${i}`)
    );
    const r = buildBwa({
      accounts,
      entries,
      monat: 10,
      jahr: 2025,
    });
    expect(r.positionen.find((p) => p.code === "1")!.monatsWert).toBe("10.00");
  });
});
