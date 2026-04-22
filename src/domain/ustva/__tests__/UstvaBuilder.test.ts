import { describe, it, expect } from "vitest";
import type { Account, JournalEntry } from "../../../types/db";
import { buildUstva } from "../UstvaBuilder";
import { Money } from "../../../lib/money/Money";

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

// Helpers
function kzWert(r: ReturnType<typeof buildUstva>, kz: string): string {
  return r.kennzahlen.find((k) => k.kz === kz)!.wert;
}

describe("UstvaBuilder (§ 18 UStG)", () => {
  it("empty UStVA: all zeros, no zahllast", () => {
    const r = buildUstva({
      accounts: [],
      entries: [],
      voranmeldungszeitraum: "MONAT",
      monat: 10,
      jahr: 2025,
      dauerfristverlaengerung: false,
    });
    expect(r.summeUmsatzsteuer).toBe("0.00");
    expect(r.summeVorsteuer).toBe("0.00");
    expect(r.zahllast).toBe("0.00");
    expect(r.erstattung).toBe("0.00");
    expect(r.isZahllast).toBe(false);
    expect(r.isErstattung).toBe(false);
  });

  it("simple 19% Umsatz 10000 netto → 1900 UST → Zahllast 1900", () => {
    const accounts = [
      makeAccount("1200", "aktiva"),
      makeAccount("8400", "ertrag"), // → Kz 81
    ];
    const entries = [
      makeEntry("2025-10-15", "1200", "8400", 10000, "UMS"),
    ];
    const r = buildUstva({
      accounts,
      entries,
      voranmeldungszeitraum: "MONAT",
      monat: 10,
      jahr: 2025,
      dauerfristverlaengerung: false,
    });
    expect(kzWert(r, "81")).toBe("10000.00");
    expect(kzWert(r, "81_STEUER")).toBe("1900.00");
    expect(r.summeUmsatzsteuer).toBe("1900.00");
    expect(r.summeVorsteuer).toBe("0.00");
    expect(r.zahllast).toBe("1900.00");
    expect(r.isZahllast).toBe(true);
  });

  it("simple 7% Umsatz 1000 netto → 70 UST", () => {
    const accounts = [
      makeAccount("1200", "aktiva"),
      makeAccount("8300", "ertrag"), // → Kz 86
    ];
    const entries = [makeEntry("2025-10-15", "1200", "8300", 1000, "U7")];
    const r = buildUstva({
      accounts,
      entries,
      voranmeldungszeitraum: "MONAT",
      monat: 10,
      jahr: 2025,
      dauerfristverlaengerung: false,
    });
    expect(kzWert(r, "86")).toBe("1000.00");
    expect(kzWert(r, "86_STEUER")).toBe("70.00");
    expect(r.zahllast).toBe("70.00");
  });

  it("Vorsteuer 19%: 950 EUR → Erstattung 950", () => {
    const accounts = [
      makeAccount("1200", "aktiva"),
      makeAccount("1576", "aktiva"), // Vorsteuer 19% → Kz 66
    ];
    const entries = [
      // Vorsteuer-Buchung: 1576 Soll 950 an 1200 Haben 950
      makeEntry("2025-10-15", "1576", "1200", 950, "VST"),
    ];
    const r = buildUstva({
      accounts,
      entries,
      voranmeldungszeitraum: "MONAT",
      monat: 10,
      jahr: 2025,
      dauerfristverlaengerung: false,
    });
    expect(kzWert(r, "66")).toBe("950.00");
    expect(r.summeVorsteuer).toBe("950.00");
    expect(r.isErstattung).toBe(true);
    expect(r.erstattung).toBe("950.00");
    expect(r.zahllast).toBe("0.00");
  });

  it("Umsatz + Vorsteuer → Zahllast korrekt (1900 − 950 = 950)", () => {
    const accounts = [
      makeAccount("1200", "aktiva"),
      makeAccount("8400", "ertrag"),
      makeAccount("1576", "aktiva"),
    ];
    const entries = [
      makeEntry("2025-10-10", "1200", "8400", 10000, "UMS"),
      makeEntry("2025-10-20", "1576", "1200", 950, "VST"),
    ];
    const r = buildUstva({
      accounts,
      entries,
      voranmeldungszeitraum: "MONAT",
      monat: 10,
      jahr: 2025,
      dauerfristverlaengerung: false,
    });
    expect(r.summeUmsatzsteuer).toBe("1900.00");
    expect(r.summeVorsteuer).toBe("950.00");
    expect(r.zahllast).toBe("950.00");
    expect(r.isZahllast).toBe(true);
  });

  it("IG Erwerb 19%: 1000 netto → Steuer 190 in UST_SUMME", () => {
    const accounts = [
      makeAccount("1200", "aktiva"),
      makeAccount("3425", "aufwand"), // IG Erwerb 19% → Kz 89
    ];
    const entries = [
      makeEntry("2025-10-10", "3425", "1200", 1000, "IGE"),
    ];
    const r = buildUstva({
      accounts,
      entries,
      voranmeldungszeitraum: "MONAT",
      monat: 10,
      jahr: 2025,
      dauerfristverlaengerung: false,
    });
    expect(kzWert(r, "89")).toBe("1000.00");
    expect(kzWert(r, "89_STEUER")).toBe("190.00");
    // Ohne Vorsteuer-Gegenbuchung erscheint hier nur die UST (190 Zahllast)
    expect(r.summeUmsatzsteuer).toBe("190.00");
  });

  it("§ 13b Bauleistung (Kz 73) aggregiert in Kz 47", () => {
    const accounts = [
      makeAccount("1200", "aktiva"),
      makeAccount("3120", "aufwand"), // → Kz 73 (Bauleistung)
    ];
    const entries = [makeEntry("2025-10-10", "3120", "1200", 2000, "BAU")];
    const r = buildUstva({
      accounts,
      entries,
      voranmeldungszeitraum: "MONAT",
      monat: 10,
      jahr: 2025,
      dauerfristverlaengerung: false,
    });
    expect(kzWert(r, "73")).toBe("2000.00");
    // Kz 47 = 2000 × 0.19 = 380
    expect(kzWert(r, "47")).toBe("380.00");
    expect(r.summeUmsatzsteuer).toBe("380.00");
  });

  it("Innergemeinsch. Lieferung Kz 41 (steuerfrei)", () => {
    const accounts = [
      makeAccount("1200", "aktiva"),
      makeAccount("8125", "ertrag"), // → Kz 41
    ];
    const entries = [makeEntry("2025-10-10", "1200", "8125", 5000, "IGL")];
    const r = buildUstva({
      accounts,
      entries,
      voranmeldungszeitraum: "MONAT",
      monat: 10,
      jahr: 2025,
      dauerfristverlaengerung: false,
    });
    expect(kzWert(r, "41")).toBe("5000.00");
    // Steuerfrei → keine UST
    expect(r.summeUmsatzsteuer).toBe("0.00");
  });

  it("MONAT Oktober 2025 includes only Oct bookings", () => {
    const accounts = [
      makeAccount("1200", "aktiva"),
      makeAccount("8400", "ertrag"),
    ];
    const entries = [
      makeEntry("2025-09-30", "1200", "8400", 5000, "SEP"),
      makeEntry("2025-10-15", "1200", "8400", 10000, "OKT"),
      makeEntry("2025-11-01", "1200", "8400", 7000, "NOV"),
    ];
    const r = buildUstva({
      accounts,
      entries,
      voranmeldungszeitraum: "MONAT",
      monat: 10,
      jahr: 2025,
      dauerfristverlaengerung: false,
    });
    expect(kzWert(r, "81")).toBe("10000.00");
  });

  it("QUARTAL Q3 2025 includes Jul/Aug/Sep bookings", () => {
    const accounts = [
      makeAccount("1200", "aktiva"),
      makeAccount("8400", "ertrag"),
    ];
    const entries = [
      makeEntry("2025-06-30", "1200", "8400", 1000, "JUN"), // außerhalb
      makeEntry("2025-07-15", "1200", "8400", 2000, "JUL"),
      makeEntry("2025-08-15", "1200", "8400", 3000, "AUG"),
      makeEntry("2025-09-15", "1200", "8400", 4000, "SEP"),
      makeEntry("2025-10-01", "1200", "8400", 9000, "OKT"), // außerhalb
    ];
    const r = buildUstva({
      accounts,
      entries,
      voranmeldungszeitraum: "QUARTAL",
      quartal: 3,
      jahr: 2025,
      dauerfristverlaengerung: false,
    });
    expect(kzWert(r, "81")).toBe("9000.00");
  });

  it("Dauerfrist shifts abgabefrist by 1 month", () => {
    const withoutDF = buildUstva({
      accounts: [],
      entries: [],
      voranmeldungszeitraum: "MONAT",
      monat: 10,
      jahr: 2025,
      dauerfristverlaengerung: false,
    });
    const withDF = buildUstva({
      accounts: [],
      entries: [],
      voranmeldungszeitraum: "MONAT",
      monat: 10,
      jahr: 2025,
      dauerfristverlaengerung: true,
    });
    expect(withoutDF.abgabefrist).toBe("10.11.2025");
    expect(withDF.abgabefrist).toBe("10.12.2025");
    expect(withDF.dauerfrist.active).toBe(true);
  });

  it("Sondervorauszahlung wird in Dezember bei Dauerfrist gegengerechnet", () => {
    const accounts = [
      makeAccount("1200", "aktiva"),
      makeAccount("8400", "ertrag"),
    ];
    const entries = [makeEntry("2025-12-15", "1200", "8400", 10000, "UMS")];
    // Ohne Sondervorauszahlung: Zahllast = 1900
    // Mit SVZ 500: Zahllast = 1400
    const r = buildUstva({
      accounts,
      entries,
      voranmeldungszeitraum: "MONAT",
      monat: 12,
      jahr: 2025,
      dauerfristverlaengerung: true,
      sondervorauszahlung: new Money("500"),
    });
    expect(r.zahllast).toBe("1400.00");
  });

  it("Money precision: 1000.00 × 19 % = exact 190.00", () => {
    const accounts = [
      makeAccount("1200", "aktiva"),
      makeAccount("8400", "ertrag"),
    ];
    const entries = [makeEntry("2025-10-15", "1200", "8400", 1000, "UMS")];
    const r = buildUstva({
      accounts,
      entries,
      voranmeldungszeitraum: "MONAT",
      monat: 10,
      jahr: 2025,
      dauerfristverlaengerung: false,
    });
    expect(kzWert(r, "81_STEUER")).toBe("190.00");
  });

  it("cross-check: UST_SUMME = Σ aller Steuerbeträge", () => {
    const accounts = [
      makeAccount("1200", "aktiva"),
      makeAccount("8400", "ertrag"),   // Kz 81 → 81_STEUER
      makeAccount("8300", "ertrag"),   // Kz 86 → 86_STEUER
      makeAccount("3425", "aufwand"),  // Kz 89 → 89_STEUER
      makeAccount("3120", "aufwand"),  // Kz 73 → 47 (aggregate)
    ];
    const entries = [
      makeEntry("2025-10-01", "1200", "8400", 10000, "U19"),
      makeEntry("2025-10-02", "1200", "8300", 2000, "U7"),
      makeEntry("2025-10-03", "3425", "1200", 1000, "IGE"),
      makeEntry("2025-10-04", "3120", "1200", 500, "BAU"),
    ];
    const r = buildUstva({
      accounts,
      entries,
      voranmeldungszeitraum: "MONAT",
      monat: 10,
      jahr: 2025,
      dauerfristverlaengerung: false,
    });
    // 81: 10000 → 1900; 86: 2000 → 140; 89: 1000 → 190; 47: 500 × 19% = 95
    // Summe = 1900 + 140 + 190 + 95 = 2325
    expect(r.summeUmsatzsteuer).toBe("2325.00");
  });

  it("cross-check: VST_SUMME = Σ aller Vorsteuerbeträge", () => {
    const accounts = [
      makeAccount("1200", "aktiva"),
      makeAccount("1576", "aktiva"), // Kz 66
      makeAccount("1574", "aktiva"), // Kz 61
      makeAccount("1588", "aktiva"), // Kz 62
    ];
    const entries = [
      makeEntry("2025-10-01", "1576", "1200", 100, "V1"),
      makeEntry("2025-10-02", "1574", "1200", 50, "V2"),
      makeEntry("2025-10-03", "1588", "1200", 25, "V3"),
    ];
    const r = buildUstva({
      accounts,
      entries,
      voranmeldungszeitraum: "MONAT",
      monat: 10,
      jahr: 2025,
      dauerfristverlaengerung: false,
    });
    expect(kzWert(r, "66")).toBe("100.00");
    expect(kzWert(r, "61")).toBe("50.00");
    expect(kzWert(r, "62")).toBe("25.00");
    expect(r.summeVorsteuer).toBe("175.00");
  });

  it("draft bookings (status=entwurf) are excluded", () => {
    const accounts = [
      makeAccount("1200", "aktiva"),
      makeAccount("8400", "ertrag"),
    ];
    const entries = [
      makeEntry("2025-10-10", "1200", "8400", 5000, "UMS"),
      {
        ...makeEntry("2025-10-20", "1200", "8400", 3000, "DRAFT"),
        status: "entwurf" as const,
      },
    ];
    const r = buildUstva({
      accounts,
      entries,
      voranmeldungszeitraum: "MONAT",
      monat: 10,
      jahr: 2025,
      dauerfristverlaengerung: false,
    });
    expect(kzWert(r, "81")).toBe("5000.00");
  });

  it("zeitraum bezeichnung is Deutsch formatted", () => {
    const mo = buildUstva({
      accounts: [],
      entries: [],
      voranmeldungszeitraum: "MONAT",
      monat: 3,
      jahr: 2025,
      dauerfristverlaengerung: false,
    });
    expect(mo.zeitraum.bezeichnung).toBe("März 2025");

    const q = buildUstva({
      accounts: [],
      entries: [],
      voranmeldungszeitraum: "QUARTAL",
      quartal: 2,
      jahr: 2025,
      dauerfristverlaengerung: false,
    });
    expect(q.zeitraum.bezeichnung).toBe("Q2 2025");
  });

  it("Sample task: Oktober 2025 — 10000€ Umsatz 19% + 5000€ VSt 19%", () => {
    const accounts = [
      makeAccount("1200", "aktiva"),
      makeAccount("8400", "ertrag"),
      makeAccount("1576", "aktiva"),
    ];
    const entries = [
      makeEntry("2025-10-10", "1200", "8400", 10000, "UMS"),
      makeEntry("2025-10-20", "1576", "1200", 950, "VST"),
    ];
    const r = buildUstva({
      accounts,
      entries,
      voranmeldungszeitraum: "MONAT",
      monat: 10,
      jahr: 2025,
      dauerfristverlaengerung: false,
    });
    expect(kzWert(r, "81")).toBe("10000.00");
    expect(kzWert(r, "81_STEUER")).toBe("1900.00");
    expect(kzWert(r, "66")).toBe("950.00");
    expect(r.zahllast).toBe("950.00");
    expect(r.abgabefrist).toBe("10.11.2025");
  });

  // ----------------------------------------------------------------
  // Sprint 7: Demo-Szenarien RC + IG (integriert gegen Musterfirma-
  // Demo-CSV). Prüfen dass die 5 neuen Demo-Buchungen korrekt auf
  // Kz 46/73/78/47/41/89 landen.
  // ----------------------------------------------------------------
  describe("Sprint 7 — Musterfirma-Demo RC + IG", () => {
    it("RC-2025-001 (3100/1600, 2500) → Kz 46 Bemessungsgrundlage + Kz 47 Steuer-Anteil", () => {
      const accounts = [
        makeAccount("1600", "passiva"),
        makeAccount("3100", "aufwand"),
      ];
      const entries = [
        makeEntry("2025-03-15", "3100", "1600", 2500, "RC-2025-001"),
      ];
      const r = buildUstva({
        accounts,
        entries,
        voranmeldungszeitraum: "MONAT",
        monat: 3,
        jahr: 2025,
        dauerfristverlaengerung: false,
      });
      expect(kzWert(r, "46")).toBe("2500.00");
      // Steuer-Aggregat 47 = 2500 × 0.19 = 475,00
      const kz47 = r.kennzahlen.find((k) => k.kz === "47");
      expect(kz47?.wert).toBe("475.00");
    });

    it("RC-2025-002 (3120/1600, 8000) → Kz 73 Bauleistung + Kz 47 Steuer", () => {
      const accounts = [
        makeAccount("1600", "passiva"),
        makeAccount("3120", "aufwand"),
      ];
      const entries = [
        makeEntry("2025-03-15", "3120", "1600", 8000, "RC-2025-002"),
      ];
      const r = buildUstva({
        accounts,
        entries,
        voranmeldungszeitraum: "MONAT",
        monat: 3,
        jahr: 2025,
        dauerfristverlaengerung: false,
      });
      expect(kzWert(r, "73")).toBe("8000.00");
      // 47 = 8000 × 0.19 = 1520,00
      expect(r.kennzahlen.find((k) => k.kz === "47")?.wert).toBe("1520.00");
    });

    it("RC-2025-003 (3130/1600, 1200) → Kz 78 Gebäudereinigung", () => {
      const accounts = [
        makeAccount("1600", "passiva"),
        makeAccount("3130", "aufwand"),
      ];
      const entries = [
        makeEntry("2025-03-15", "3130", "1600", 1200, "RC-2025-003"),
      ];
      const r = buildUstva({
        accounts,
        entries,
        voranmeldungszeitraum: "MONAT",
        monat: 3,
        jahr: 2025,
        dauerfristverlaengerung: false,
      });
      expect(kzWert(r, "78")).toBe("1200.00");
    });

    it("IG-2025-001 (1400/8125, 15000) → Kz 41 IG-Lieferung steuerfrei", () => {
      const accounts = [
        makeAccount("1400", "aktiva"),
        makeAccount("8125", "ertrag"),
      ];
      const entries = [
        makeEntry("2025-03-15", "1400", "8125", 15000, "IG-2025-001"),
      ];
      const r = buildUstva({
        accounts,
        entries,
        voranmeldungszeitraum: "MONAT",
        monat: 3,
        jahr: 2025,
        dauerfristverlaengerung: false,
      });
      expect(kzWert(r, "41")).toBe("15000.00");
    });

    it("IG-2025-002 (3425/1600, 7500) → Kz 89 IG-Erwerb 19 % Bemessungsgrundlage + Steuer", () => {
      const accounts = [
        makeAccount("1600", "passiva"),
        makeAccount("3425", "aufwand"),
      ];
      const entries = [
        makeEntry("2025-03-15", "3425", "1600", 7500, "IG-2025-002"),
      ];
      const r = buildUstva({
        accounts,
        entries,
        voranmeldungszeitraum: "MONAT",
        monat: 3,
        jahr: 2025,
        dauerfristverlaengerung: false,
      });
      expect(kzWert(r, "89")).toBe("7500.00");
      // 89_STEUER = 7500 × 0.19 = 1425,00
      const kz89Steuer = r.kennzahlen.find((k) => k.kz === "89_STEUER");
      expect(kz89Steuer?.wert).toBe("1425.00");
    });

    it("alle 5 Sprint-7-Demo-Szenarien zusammen → saubere Kz-Aggregation", () => {
      const accounts = [
        makeAccount("1400", "aktiva"),
        makeAccount("1600", "passiva"),
        makeAccount("3100", "aufwand"),
        makeAccount("3120", "aufwand"),
        makeAccount("3130", "aufwand"),
        makeAccount("3425", "aufwand"),
        makeAccount("8125", "ertrag"),
      ];
      const entries = [
        makeEntry("2025-03-15", "3100", "1600", 2500, "RC-2025-001"),
        makeEntry("2025-03-15", "3120", "1600", 8000, "RC-2025-002"),
        makeEntry("2025-03-15", "3130", "1600", 1200, "RC-2025-003"),
        makeEntry("2025-03-15", "1400", "8125", 15000, "IG-2025-001"),
        makeEntry("2025-03-15", "3425", "1600", 7500, "IG-2025-002"),
      ];
      const r = buildUstva({
        accounts,
        entries,
        voranmeldungszeitraum: "MONAT",
        monat: 3,
        jahr: 2025,
        dauerfristverlaengerung: false,
      });
      expect(kzWert(r, "41")).toBe("15000.00"); // IG-Lieferung
      expect(kzWert(r, "46")).toBe("2500.00"); // § 13b Abs. 1
      expect(kzWert(r, "73")).toBe("8000.00"); // Bauleistung
      expect(kzWert(r, "78")).toBe("1200.00"); // Gebäudereinigung
      expect(kzWert(r, "89")).toBe("7500.00"); // IG-Erwerb 19 %
      // Aggregierte § 13b-Steuer Kz 47 = (2500 + 8000 + 1200) × 0,19 = 2223
      expect(r.kennzahlen.find((k) => k.kz === "47")?.wert).toBe("2223.00");
    });
  });
});
