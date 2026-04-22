import { describe, it, expect } from "vitest";
import type { Account, JournalEntry } from "../../../types/db";
import { buildEuerGuvCrossCheck } from "../EuerGuvCrossCheck";

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

const WJ = { von: "2025-01-01", bis: "2025-12-31" };

describe("EuerGuvCrossCheck", () => {
  it("Simple scenario: both results match exactly", () => {
    // Nur Umsatz + Lohn → keine BA-Korrekturen nötig
    const accounts = [
      makeAccount("1200", "aktiva"),
      makeAccount("0900", "passiva"),
      makeAccount("8400", "ertrag"),
      makeAccount("4100", "aufwand"),
    ];
    const entries = [
      makeEntry("2025-01-01", "1200", "0900", 10000, "EB"),
      makeEntry("2025-03-01", "1200", "8400", 8000, "UMS"),
      makeEntry("2025-04-01", "4100", "1200", 2000, "LOHN"),
    ];
    const r = buildEuerGuvCrossCheck({
      accounts,
      entries,
      wirtschaftsjahr: WJ,
    });
    expect(r.steuerlicherGewinnEuer).toBe("6000.00");
    expect(r.jahresergebnisGuv).toBe("6000.00");
    expect(r.nettoVergleich).toBe("0.00");
    expect(r.hasUnexpectedDifference).toBe(false);
    expect(r.bekannteUnterschiede).toEqual([]);
  });

  it("Bewirtung scenario: EÜR exactly 30% higher than GuV, categorized as BEWIRTUNG", () => {
    // 1000 € Bewirtung → EÜR steuerlich = GuV + 300
    const accounts = [
      makeAccount("1200", "aktiva"),
      makeAccount("0900", "passiva"),
      makeAccount("8400", "ertrag"),
      makeAccount("4650", "aufwand"),
    ];
    const entries = [
      makeEntry("2025-01-01", "1200", "0900", 5000, "EB"),
      makeEntry("2025-03-01", "1200", "8400", 10000, "UMS"),
      makeEntry("2025-06-01", "4650", "1200", 1000, "BEW"),
    ];
    const r = buildEuerGuvCrossCheck({
      accounts,
      entries,
      wirtschaftsjahr: WJ,
    });
    // GuV: 10000 - 1000 = 9000
    expect(r.jahresergebnisGuv).toBe("9000.00");
    // EÜR: 10000 - 1000 + 300 = 9300
    expect(r.steuerlicherGewinnEuer).toBe("9300.00");
    expect(r.nettoVergleich).toBe("300.00");

    const bewirtung = r.bekannteUnterschiede.find(
      (d) => d.kategorie === "BEWIRTUNG"
    );
    expect(bewirtung).toBeDefined();
    expect(bewirtung!.betrag).toBe("300.00");
    expect(bewirtung!.richtung).toBe("EUER_HOEHER");
    expect(r.hasUnexpectedDifference).toBe(false);
  });

  it("Geschenke > 50 €: EÜR higher, categorized as GESCHENKE", () => {
    const accounts = [
      makeAccount("1200", "aktiva"),
      makeAccount("8400", "ertrag"),
      makeAccount("4636", "aufwand"), // > 50 € Geschenk
    ];
    const entries = [
      makeEntry("2025-03-01", "1200", "8400", 5000, "UMS"),
      makeEntry("2025-04-01", "4636", "1200", 80, "GESCHENK"),
    ];
    const r = buildEuerGuvCrossCheck({
      accounts,
      entries,
      wirtschaftsjahr: WJ,
    });
    // GuV: 5000 - 80 = 4920
    expect(r.jahresergebnisGuv).toBe("4920.00");
    // EÜR: 4636 nur in Kz 228 (nicht in Kz 199) → vorläufig = 5000 − 0 = 5000;
    //      +80 Kz 228 → steuerlich = 5080
    // Delta = 160  (80 weil GuV zieht ab, 80 weil EÜR addiert)
    expect(r.steuerlicherGewinnEuer).toBe("5080.00");
    expect(r.nettoVergleich).toBe("160.00");

    const geschenke = r.bekannteUnterschiede.find(
      (d) => d.kategorie === "GESCHENKE"
    );
    expect(geschenke).toBeDefined();
    expect(geschenke!.betrag).toBe("80.00");
    // Der erklaerbare Delta ist nur 80 € (Kz 228), aber der Brutto-Delta 160 €
    // → 80 € unerklärbarer Rest (Timing: EÜR ignoriert 4636 als Aufwand,
    //   GuV zieht ihn ab). Dies ist per Definition der Unterschied zwischen
    //   "nicht abziehbar" und "voll abziehbar".
    // Wir erwarten das als unexpectedDifference != 0.
    expect(r.hasUnexpectedDifference).toBe(true);
  });

  it("Both zero: no difference, no warnings about unexpected", () => {
    const r = buildEuerGuvCrossCheck({
      accounts: [],
      entries: [],
      wirtschaftsjahr: WJ,
    });
    expect(r.nettoVergleich).toBe("0.00");
    expect(r.hasUnexpectedDifference).toBe(false);
    expect(r.bekannteUnterschiede).toEqual([]);
  });

  it("IAB adjustment (Kz 206 manually set, not derivable from journal)", () => {
    // Der EuerGuvCrossCheck fixiert istKleinunternehmer=false und übergibt
    // keine IAB-Parameter; Kz 206 bleibt 0. Der Test dokumentiert dieses
    // Verhalten — IAB-Vergleiche sind derzeit nur im Stand-alone EuerBuilder
    // möglich.
    const r = buildEuerGuvCrossCheck({
      accounts: [],
      entries: [],
      wirtschaftsjahr: WJ,
    });
    expect(r.bekannteUnterschiede.find((d) => d.kategorie === "IAB")).toBeUndefined();
  });

  it("Large unexpected gap triggers warning", () => {
    // Wir konstruieren eine Differenz, die NICHT durch Bewirtung/Geschenke
    // abgedeckt ist: ein IG-Erwerb-Konto (2600 Ertrag) — GuV zählt es, EÜR
    // auch. Das sollte eigentlich matchen.
    // Für den Testzweck: Ein Konto, das NUR in GuV drin ist (2600), aber
    // NICHT im EÜR-Mapping → EÜR sieht nichts, GuV sieht alles.
    const accounts = [
      makeAccount("1200", "aktiva"),
      makeAccount("2600", "ertrag"), // in GuV als Beteiligungsertrag; nicht in EÜR-Mapping
    ];
    const entries = [makeEntry("2025-03-01", "1200", "2600", 5000, "BET")];
    const r = buildEuerGuvCrossCheck({
      accounts,
      entries,
      wirtschaftsjahr: WJ,
    });
    // GuV: +5000; EÜR: 0
    expect(r.jahresergebnisGuv).toBe("5000.00");
    expect(r.steuerlicherGewinnEuer).toBe("0.00");
    expect(r.nettoVergleich).toBe("-5000.00");
    expect(r.hasUnexpectedDifference).toBe(true);
    expect(r.warnings.some((w) => w.includes("Unerklärbare"))).toBe(true);
  });

  it("Report contains both full EÜR and GuV reports as sub-structures", () => {
    const accounts = [
      makeAccount("1200", "aktiva"),
      makeAccount("8400", "ertrag"),
    ];
    const entries = [makeEntry("2025-03-01", "1200", "8400", 5000, "UMS")];
    const r = buildEuerGuvCrossCheck({
      accounts,
      entries,
      wirtschaftsjahr: WJ,
    });
    expect(r.euer.summen.betriebseinnahmen).toBe("5000.00");
    expect(r.guv.umsatzerloese).toBe("5000.00");
  });
});
