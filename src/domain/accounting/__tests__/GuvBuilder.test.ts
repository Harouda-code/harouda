import { describe, it, expect } from "vitest";
import type { Account, JournalEntry } from "../../../types/db";
import { buildGuv } from "../GuvBuilder";

function makeAccount(
  konto_nr: string,
  kategorie: Account["kategorie"],
  bezeichnung = `Konto ${konto_nr}`
): Account {
  return {
    id: `id-${konto_nr}`,
    konto_nr,
    bezeichnung,
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
  beleg = "B1",
  status: JournalEntry["status"] = "gebucht"
): JournalEntry {
  return {
    id: `e-${beleg}-${soll}-${haben}`,
    datum,
    beleg_nr: beleg,
    beschreibung: `Buchung ${beleg}`,
    soll_konto: soll,
    haben_konto: haben,
    betrag,
    ust_satz: null,
    status,
    client_id: null,
    skonto_pct: null,
    skonto_tage: null,
    gegenseite: null,
    faelligkeit: null,
    version: 1,
    kostenstelle: null,
  };
}

const PERIOD = { periodStart: "2025-01-01", stichtag: "2025-12-31" };

describe("GuvBuilder (HGB § 275 GKV)", () => {
  it("empty GuV: all zero, jahresergebnis = 0", () => {
    const r = buildGuv([], [], PERIOD);
    expect(r.jahresergebnis).toBe("0.00");
    expect(r.umsatzerloese).toBe("0.00");
    expect(r.betriebsergebnis).toBe("0.00");
    expect(r.finanzergebnis).toBe("0.00");
    expect(r.unmappedAccounts).toEqual([]);
  });

  it("simple profit: Umsatz 10000 - Personalaufwand 4000 = 6000", () => {
    const accounts = [
      makeAccount("1200", "aktiva", "Bank"),
      makeAccount("8400", "ertrag", "Umsatzerlöse 19 %"),
      makeAccount("4100", "aufwand", "Löhne"),
    ];
    const entries = [
      makeEntry("2025-03-01", "1200", "8400", 10000, "UMS"),
      makeEntry("2025-04-01", "4100", "1200", 4000, "LOHN"),
    ];
    const r = buildGuv(accounts, entries, PERIOD);
    expect(r.umsatzerloese).toBe("10000.00");
    expect(r.personalaufwand).toBe("4000.00");
    expect(r.betriebsergebnis).toBe("6000.00");
    expect(r.jahresergebnis).toBe("6000.00");
  });

  it("simple loss: Umsatz 5000 - Aufwände 7000 = -2000", () => {
    const accounts = [
      makeAccount("1200", "aktiva", "Bank"),
      makeAccount("8400", "ertrag"),
      makeAccount("4200", "aufwand", "Miete"),
    ];
    const entries = [
      makeEntry("2025-03-01", "1200", "8400", 5000, "UMS"),
      makeEntry("2025-04-01", "4200", "1200", 7000, "MIETE"),
    ];
    const r = buildGuv(accounts, entries, PERIOD);
    expect(r.jahresergebnis).toBe("-2000.00");
  });

  it("full structure: Betriebs-, Finanz-, Steuer-Ergebnis cascade", () => {
    const accounts = [
      makeAccount("1200", "aktiva", "Bank"),
      makeAccount("8400", "ertrag", "Umsatz"), //  → Posten 1
      makeAccount("4200", "aufwand", "Miete"), //  → Posten 8
      makeAccount("2650", "ertrag", "Zinsertrag"), // → Posten 11
      makeAccount("2310", "aufwand", "Zinsaufwand"), // → Posten 13 (2300 ist Grundkapital per Post-Bugfix Bug B)
      makeAccount("7600", "aufwand", "KSt"), //    → Posten 14
      makeAccount("7700", "aufwand", "So. Steuern"), // → Posten 16
    ];
    const entries = [
      makeEntry("2025-03-01", "1200", "8400", 10000, "UMS"),
      makeEntry("2025-04-01", "4200", "1200", 5000, "MIETE"), // Betriebs = +5000
      makeEntry("2025-05-01", "1200", "2650", 100, "ZINS+"),
      makeEntry("2025-05-15", "2310", "1200", 600, "ZINS-"), // Finanz = -500
      makeEntry("2025-06-01", "7600", "1200", 1000, "KST"), // -> 14
      makeEntry("2025-07-01", "7700", "1200", 200, "STEUER"), // -> 16
    ];
    const r = buildGuv(accounts, entries, PERIOD);
    expect(r.betriebsergebnis).toBe("5000.00");
    expect(r.finanzergebnis).toBe("-500.00");
    expect(r.ergebnisVorSteuern).toBe("4500.00");
    expect(r.steuernEinkommenErtrag).toBe("1000.00");
    expect(r.ergebnisNachSteuern).toBe("3500.00");
    expect(r.sonstigeSteuern).toBe("200.00");
    expect(r.jahresergebnis).toBe("3300.00");
  });

  it("period filtering: bookings outside [periodStart, stichtag] excluded", () => {
    const accounts = [
      makeAccount("1200", "aktiva"),
      makeAccount("8400", "ertrag"),
    ];
    const entries = [
      makeEntry("2024-12-15", "1200", "8400", 1000, "VJ"), // Vorjahr
      makeEntry("2025-06-15", "1200", "8400", 5000, "CY"), // in period
      makeEntry("2026-01-05", "1200", "8400", 2000, "FJ"), // Folgejahr
    ];
    const r = buildGuv(accounts, entries, PERIOD);
    expect(r.umsatzerloese).toBe("5000.00");
  });

  it("unmapped account does not influence Jahresergebnis", () => {
    const accounts = [
      makeAccount("1200", "aktiva"),
      makeAccount("8400", "ertrag"),
      makeAccount("9999", "ertrag", "Nicht zugeordnet"),
    ];
    const entries = [
      makeEntry("2025-03-01", "1200", "8400", 1000, "UMS"),
      // 9999 is not in GuV mapping, so no booking contributes
    ];
    const r = buildGuv(accounts, entries, PERIOD);
    expect(r.jahresergebnis).toBe("1000.00");
  });

  it("sizeClass KLEIN collapses sub-posten (5.a, 5.b, 6.a, 6.b, 7.a, 7.b hidden)", () => {
    const accounts = [
      makeAccount("1200", "aktiva"),
      makeAccount("4100", "aufwand", "Löhne"), // → 6.a
      makeAccount("4130", "aufwand", "Sozialabg."), // → 6.b
    ];
    const entries = [
      makeEntry("2025-01-02", "4100", "1200", 3000, "LOHN"),
      makeEntry("2025-01-02", "4130", "1200", 600, "SOZ"),
    ];
    const r = buildGuv(accounts, entries, { ...PERIOD, sizeClass: "KLEIN" });
    // Posten 6 should roll up 6.a + 6.b = 3000 + 600 = 3600
    expect(r.personalaufwand).toBe("3600.00");
    // Sub-posten should not appear in flat positionen
    const refs = r.positionen.map((p) => p.reference_code);
    expect(refs).not.toContain("6.a");
    expect(refs).not.toContain("6.b");
    expect(refs).toContain("6");
  });

  it("sizeClass GROSS shows all sub-posten", () => {
    const accounts = [
      makeAccount("1200", "aktiva"),
      makeAccount("4100", "aufwand", "Löhne"),
      makeAccount("4130", "aufwand", "Sozialabg."),
    ];
    const entries = [
      makeEntry("2025-01-02", "4100", "1200", 3000, "LOHN"),
      makeEntry("2025-01-02", "4130", "1200", 600, "SOZ"),
    ];
    const r = buildGuv(accounts, entries, { ...PERIOD, sizeClass: "GROSS" });
    const refs = r.positionen.map((p) => p.reference_code);
    expect(refs).toContain("6.a");
    expect(refs).toContain("6.b");
  });

  it("Money precision: 10000 × 0.01€ Umsatz aggregates to exactly 100.00", () => {
    const accounts = [
      makeAccount("1200", "aktiva"),
      makeAccount("8400", "ertrag"),
    ];
    const entries = Array.from({ length: 10000 }, (_, i) =>
      makeEntry("2025-01-01", "1200", "8400", 0.01, `E${i}`)
    );
    const r = buildGuv(accounts, entries, PERIOD);
    expect(r.umsatzerloese).toBe("100.00");
    expect(r.jahresergebnis).toBe("100.00");
  });

  it("handles multiple accounts per GuV-position (aggregation)", () => {
    const accounts = [
      makeAccount("1200", "aktiva"),
      makeAccount("4100", "aufwand", "Lohn"), // 6.a
      makeAccount("4120", "aufwand", "Gehalt"), // 6.a
      makeAccount("4190", "aufwand", "Aushilfe"), // 6.a
    ];
    const entries = [
      makeEntry("2025-02-01", "4100", "1200", 2000, "L"),
      makeEntry("2025-02-01", "4120", "1200", 3000, "G"),
      makeEntry("2025-02-01", "4190", "1200", 500, "A"),
    ];
    const r = buildGuv(accounts, entries, PERIOD);
    expect(r.personalaufwand).toBe("5500.00");
  });

  it("Erträge (HABEN-accounts) contribute positively to betriebsergebnis", () => {
    const accounts = [
      makeAccount("1200", "aktiva"),
      makeAccount("2700", "ertrag", "Sonst. Ertrag"), // Posten 4
    ];
    const entries = [makeEntry("2025-03-01", "1200", "2700", 1500, "SONSTE")];
    const r = buildGuv(accounts, entries, PERIOD);
    expect(r.sonstigeBetrieblicheErtraege).toBe("1500.00");
    expect(r.betriebsergebnis).toBe("1500.00");
  });

  it("Aufwände (SOLL-accounts) reduce subtotal", () => {
    const accounts = [
      makeAccount("1200", "aktiva"),
      makeAccount("8400", "ertrag"),
      makeAccount("4200", "aufwand", "Raumkosten"), // Posten 8
    ];
    const entries = [
      makeEntry("2025-03-01", "1200", "8400", 1000, "UMS"),
      makeEntry("2025-03-15", "4200", "1200", 400, "MIETE"),
    ];
    const r = buildGuv(accounts, entries, PERIOD);
    expect(r.sonstigeBetrieblicheAufwendungen).toBe("400.00");
    expect(r.betriebsergebnis).toBe("600.00");
  });

  it("entries with status=entwurf are excluded", () => {
    const accounts = [
      makeAccount("1200", "aktiva"),
      makeAccount("8400", "ertrag"),
    ];
    const entries = [
      makeEntry("2025-03-01", "1200", "8400", 1000, "UMS"),
      makeEntry("2025-03-02", "1200", "8400", 500, "DRAFT", "entwurf"),
    ];
    const r = buildGuv(accounts, entries, PERIOD);
    expect(r.umsatzerloese).toBe("1000.00");
  });

  it("UKV is rejected (not implemented)", () => {
    expect(() =>
      buildGuv([], [], { ...PERIOD, verfahren: "UKV" })
    ).toThrow(/UKV/);
  });

  it("positionen array includes subtotals and final with isSubtotal/isFinalResult flags", () => {
    const r = buildGuv([], [], PERIOD);
    const betriebs = r.positionen.find((p) => p.reference_code === "BETRIEBSERG");
    const jahres = r.positionen.find((p) => p.reference_code === "17");
    expect(betriebs?.isSubtotal).toBe(true);
    expect(jahres?.isFinalResult).toBe(true);
  });

  // ------------------------------------------------------------------
  // BilRUG 2015: Anlagenabgang-Buchgewinn/-verlust laufen in die
  // „Sonstigen" Posten 4 / 8, weil das „Außerordentliche Ergebnis" aus
  // HGB § 275 n.F. entfernt wurde. Zuvor war Konto 2800 ohne GuV-
  // Mapping — die Tests unten verhindern Regression.
  // ------------------------------------------------------------------
  it("GuV zeigt Anlagenabgang-Buchverlust unter Posten 8 nach BilRUG 2015", () => {
    // Szenario: Anlage 0440 hatte AK 4.000, nach AfA-Historie RBW 1.500.
    // Abgang mit Erlös 1.000 (Verlust 500). Die Abgangs-Buchungen:
    //   1200 soll / 0440 haben 1000  (Erlös bis RBW)
    //   2800 soll / 0440 haben  500  (Buchverlust)
    // Erwartet in der GuV: Posten 8 = 500, Posten 4 = 0.
    const accounts = [
      makeAccount("1200", "aktiva", "Bank"),
      makeAccount("0440", "aktiva", "Büromaschinen"),
      makeAccount("2800", "aufwand", "Sonstige neutrale Aufwendungen"),
    ];
    const entries = [
      makeEntry("2025-06-30", "1200", "0440", 1000, "ABG-EL"),
      makeEntry("2025-06-30", "2800", "0440", 500, "ABG-VL"),
    ];
    const r = buildGuv(accounts, entries, PERIOD);
    expect(r.sonstigeBetrieblicheAufwendungen).toBe("500.00");
    expect(r.sonstigeBetrieblicheErtraege).toBe("0.00");
    expect(r.unmappedAccounts.find((a) => a.kontoNr === "2800")).toBeUndefined();
  });

  it("GuV zeigt Anlagenabgang-Buchgewinn unter Posten 4 nach BilRUG 2015", () => {
    // Szenario: Anlage 0440 hatte AK 4.000, nach AfA-Historie RBW 1.500.
    // Abgang mit Erlös 2.000 (Gewinn 500). Die Abgangs-Buchungen:
    //   1200 soll / 0440 haben 1500  (Erlös bis RBW)
    //   1200 soll / 2700 haben  500  (Buchgewinn)
    // Erwartet in der GuV: Posten 4 = 500, Posten 8 = 0.
    const accounts = [
      makeAccount("1200", "aktiva", "Bank"),
      makeAccount("0440", "aktiva", "Büromaschinen"),
      makeAccount("2700", "ertrag", "Sonstige neutrale Erträge"),
    ];
    const entries = [
      makeEntry("2025-06-30", "1200", "0440", 1500, "ABG-EL"),
      makeEntry("2025-06-30", "1200", "2700", 500, "ABG-GW"),
    ];
    const r = buildGuv(accounts, entries, PERIOD);
    expect(r.sonstigeBetrieblicheErtraege).toBe("500.00");
    expect(r.sonstigeBetrieblicheAufwendungen).toBe("0.00");
  });
});
