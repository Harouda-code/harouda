import { describe, it, expect } from "vitest";
import type { Account, JournalEntry } from "../../../types/db";
import { buildZm } from "../ZmBuilder";

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
    id: `e-${datum}-${beleg}-${soll}-${haben}`,
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

describe("ZmBuilder (§ 18a UStG)", () => {
  it("empty period → empty report", () => {
    const r = buildZm({
      accounts: [],
      entries: [],
      meldezeitraum: "QUARTAL",
      quartal: 3,
      jahr: 2025,
      empfaengerStammdaten: [],
    });
    expect(r.meldungen).toEqual([]);
    expect(r.summen.igLieferungenTotal).toBe("0.00");
    expect(r.zeitraum.bezeichnung).toBe("Q3 2025");
  });

  it("IG-Lieferung an einen EU-Kunden (Kz 41)", () => {
    const accounts = [
      makeAccount("10001", "aktiva"), // Debitor FR
      makeAccount("8125", "ertrag"), // IG-Lieferung
    ];
    const entries = [makeEntry("2025-09-15", "10001", "8125", 5000, "IGL")];
    const r = buildZm({
      accounts,
      entries,
      meldezeitraum: "QUARTAL",
      quartal: 3,
      jahr: 2025,
      empfaengerStammdaten: [
        { kontoNr: "10001", ustid: "FR12345678901", land: "FR" },
      ],
    });
    expect(r.meldungen.length).toBe(1);
    expect(r.meldungen[0].ustid).toBe("FR12345678901");
    expect(r.meldungen[0].land).toBe("FR");
    expect(r.meldungen[0].igLieferungen).toBe("5000.00");
    expect(r.meldungen[0].gesamtbetrag).toBe("5000.00");
    expect(r.meldungen[0].ustidValidation.isValid).toBe(true);
    expect(r.summen.igLieferungenTotal).toBe("5000.00");
  });

  it("IG-sonstige Leistung an EU-Kunden (Kz 21)", () => {
    const accounts = [
      makeAccount("10002", "aktiva"),
      makeAccount("8336", "ertrag"),
    ];
    const entries = [makeEntry("2025-09-15", "10002", "8336", 2000, "IGS")];
    const r = buildZm({
      accounts,
      entries,
      meldezeitraum: "QUARTAL",
      quartal: 3,
      jahr: 2025,
      empfaengerStammdaten: [
        { kontoNr: "10002", ustid: "NL123456789B01", land: "NL" },
      ],
    });
    expect(r.meldungen.length).toBe(1);
    expect(r.meldungen[0].igSonstigeLeistungen).toBe("2000.00");
    expect(r.summen.igSonstigeLeistungenTotal).toBe("2000.00");
  });

  it("Dreiecksgeschäft (Kz 42)", () => {
    const accounts = [
      makeAccount("10003", "aktiva"),
      makeAccount("8338", "ertrag"),
    ];
    const entries = [makeEntry("2025-09-15", "10003", "8338", 3000, "DG")];
    const r = buildZm({
      accounts,
      entries,
      meldezeitraum: "QUARTAL",
      quartal: 3,
      jahr: 2025,
      empfaengerStammdaten: [
        { kontoNr: "10003", ustid: "ATU12345678", land: "AT" },
      ],
    });
    expect(r.meldungen[0].dreiecksgeschaefte).toBe("3000.00");
    expect(r.summen.dreiecksgeschaefteTotal).toBe("3000.00");
  });

  it("Aggregiert mehrere Buchungen pro USt-IdNr", () => {
    const accounts = [
      makeAccount("10001", "aktiva"),
      makeAccount("8125", "ertrag"),
      makeAccount("8336", "ertrag"),
    ];
    const entries = [
      makeEntry("2025-07-01", "10001", "8125", 1000, "A"),
      makeEntry("2025-08-01", "10001", "8125", 2000, "B"),
      makeEntry("2025-09-01", "10001", "8336", 500, "C"),
    ];
    const r = buildZm({
      accounts,
      entries,
      meldezeitraum: "QUARTAL",
      quartal: 3,
      jahr: 2025,
      empfaengerStammdaten: [
        { kontoNr: "10001", ustid: "FR12345678901", land: "FR" },
      ],
    });
    expect(r.meldungen.length).toBe(1);
    expect(r.meldungen[0].igLieferungen).toBe("3000.00");
    expect(r.meldungen[0].igSonstigeLeistungen).toBe("500.00");
    expect(r.meldungen[0].gesamtbetrag).toBe("3500.00");
  });

  it("Buchung ohne USt-IdNr → unzuordenbar + warning", () => {
    const accounts = [
      makeAccount("10001", "aktiva"),
      makeAccount("8125", "ertrag"),
    ];
    const entries = [makeEntry("2025-09-15", "10001", "8125", 5000, "IGL")];
    const r = buildZm({
      accounts,
      entries,
      meldezeitraum: "QUARTAL",
      quartal: 3,
      jahr: 2025,
      empfaengerStammdaten: [], // leer
    });
    expect(r.meldungen.length).toBe(0);
    expect(r.unzuordenbareBuchungen.length).toBe(1);
    expect(r.unzuordenbareBuchungen[0].reason).toMatch(/Keine USt-IdNr/);
  });

  it("Ungültige USt-IdNr → validation-Flag + warning", () => {
    const accounts = [
      makeAccount("10001", "aktiva"),
      makeAccount("8125", "ertrag"),
    ];
    const entries = [makeEntry("2025-09-15", "10001", "8125", 5000, "IGL")];
    const r = buildZm({
      accounts,
      entries,
      meldezeitraum: "QUARTAL",
      quartal: 3,
      jahr: 2025,
      empfaengerStammdaten: [
        { kontoNr: "10001", ustid: "BOGUS123", land: "XX" },
      ],
    });
    expect(r.meldungen[0].ustidValidation.isValid).toBe(false);
    expect(r.warnings.some((w) => w.includes("USt-IdNr"))).toBe(true);
  });

  it("Cross-check mit UStVA: Kz 41-Summen müssen matchen", () => {
    const accounts = [
      makeAccount("10001", "aktiva"),
      makeAccount("8125", "ertrag"),
    ];
    const entries = [makeEntry("2025-09-15", "10001", "8125", 5000, "IGL")];
    const r = buildZm({
      accounts,
      entries,
      meldezeitraum: "QUARTAL",
      quartal: 3,
      jahr: 2025,
      empfaengerStammdaten: [
        { kontoNr: "10001", ustid: "FR12345678901", land: "FR" },
      ],
    });
    expect(r.ustvaKorrespondenz.zmKz41).toBe("5000.00");
    expect(r.ustvaKorrespondenz.ustvaKz41).toBe("5000.00");
    expect(r.ustvaKorrespondenz.matches41).toBe(true);
  });

  it("Cross-check mismatch bei fehlender USt-IdNr-Zuordnung", () => {
    const accounts = [
      makeAccount("10001", "aktiva"),
      makeAccount("8125", "ertrag"),
    ];
    const entries = [makeEntry("2025-09-15", "10001", "8125", 5000, "IGL")];
    const r = buildZm({
      accounts,
      entries,
      meldezeitraum: "QUARTAL",
      quartal: 3,
      jahr: 2025,
      empfaengerStammdaten: [], // fehlt → unzuordenbar
    });
    expect(r.ustvaKorrespondenz.ustvaKz41).toBe("5000.00");
    expect(r.ustvaKorrespondenz.zmKz41).toBe("0.00");
    expect(r.ustvaKorrespondenz.matches41).toBe(false);
    expect(r.warnings.some((w) => w.includes("weicht"))).toBe(true);
  });

  it("Zwei EU-Kunden in einem Quartal", () => {
    const accounts = [
      makeAccount("10001", "aktiva"), // FR
      makeAccount("10002", "aktiva"), // IT
      makeAccount("8125", "ertrag"),
    ];
    const entries = [
      makeEntry("2025-07-15", "10001", "8125", 3000, "FR1"),
      makeEntry("2025-08-15", "10002", "8125", 5000, "IT1"),
      makeEntry("2025-09-15", "10001", "8125", 2000, "FR2"),
    ];
    const r = buildZm({
      accounts,
      entries,
      meldezeitraum: "QUARTAL",
      quartal: 3,
      jahr: 2025,
      empfaengerStammdaten: [
        { kontoNr: "10001", ustid: "FR12345678901", land: "FR" },
        { kontoNr: "10002", ustid: "IT12345678901", land: "IT" },
      ],
    });
    expect(r.meldungen.length).toBe(2);
    const fr = r.meldungen.find((m) => m.ustid.startsWith("FR"));
    const it = r.meldungen.find((m) => m.ustid.startsWith("IT"));
    expect(fr!.igLieferungen).toBe("5000.00");
    expect(it!.igLieferungen).toBe("5000.00");
    expect(r.summen.igLieferungenTotal).toBe("10000.00");
  });

  it("Abgabefrist: 25. Tag Folgemonat nach Quartalsende (Q3 2025 → 25.10.2025)", () => {
    const r = buildZm({
      accounts: [],
      entries: [],
      meldezeitraum: "QUARTAL",
      quartal: 3,
      jahr: 2025,
      empfaengerStammdaten: [],
    });
    // 25.10.2025 = Samstag → Montag 27.10.2025
    expect(r.abgabefrist).toBe("27.10.2025");
  });

  it("Abgabefrist MONAT: Oktober 2025 → 25.11.2025 (Dienstag)", () => {
    const r = buildZm({
      accounts: [],
      entries: [],
      meldezeitraum: "MONAT",
      monat: 10,
      jahr: 2025,
      empfaengerStammdaten: [],
    });
    expect(r.abgabefrist).toBe("25.11.2025");
  });

  it("Periode Q3 2025 schließt September-Buchung ein, Oktober aus", () => {
    const accounts = [
      makeAccount("10001", "aktiva"),
      makeAccount("8125", "ertrag"),
    ];
    const entries = [
      makeEntry("2025-09-30", "10001", "8125", 1000, "SEP"),
      makeEntry("2025-10-01", "10001", "8125", 2000, "OKT"),
    ];
    const r = buildZm({
      accounts,
      entries,
      meldezeitraum: "QUARTAL",
      quartal: 3,
      jahr: 2025,
      empfaengerStammdaten: [
        { kontoNr: "10001", ustid: "FR12345678901", land: "FR" },
      ],
    });
    expect(r.summen.igLieferungenTotal).toBe("1000.00");
  });
});
