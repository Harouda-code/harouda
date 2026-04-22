import { describe, it, expect } from "vitest";
import type { Account, JournalEntry } from "../../../types/db";
import { buildEuer } from "../EuerBuilder";
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

const WJ = { von: "2025-01-01", bis: "2025-12-31" };

function kzWert(r: ReturnType<typeof buildEuer>, kz: string): string {
  return r.positionen.find((p) => p.kz === kz)!.wert;
}

describe("EuerBuilder (Anlage EÜR 2025)", () => {
  it("empty EÜR: alle Nullen", () => {
    const r = buildEuer({
      accounts: [],
      entries: [],
      wirtschaftsjahr: WJ,
      istKleinunternehmer: false,
    });
    expect(r.summen.betriebseinnahmen).toBe("0.00");
    expect(r.summen.betriebsausgaben).toBe("0.00");
    expect(r.summen.steuerlicherGewinn).toBe("0.00");
    expect(r.positionen.length).toBeGreaterThan(0);
  });

  it("einfacher Gewinn: Einnahmen 10000 − Ausgaben 4000 = 6000", () => {
    const accounts = [
      makeAccount("1200", "aktiva"),
      makeAccount("8400", "ertrag"),
      makeAccount("4100", "aufwand"),
    ];
    const entries = [
      makeEntry("2025-03-01", "1200", "8400", 10000, "UMS"),
      makeEntry("2025-04-01", "4100", "1200", 4000, "LOHN"),
    ];
    const r = buildEuer({
      accounts,
      entries,
      wirtschaftsjahr: WJ,
      istKleinunternehmer: false,
    });
    expect(r.summen.betriebseinnahmen).toBe("10000.00");
    expect(r.summen.betriebsausgaben).toBe("4000.00");
    expect(r.summen.vorlaeufigerGewinn).toBe("6000.00");
    expect(r.summen.steuerlicherGewinn).toBe("6000.00");
  });

  it("einfacher Verlust: Einnahmen 3000 − Ausgaben 5000 = −2000", () => {
    const accounts = [
      makeAccount("1200", "aktiva"),
      makeAccount("8400", "ertrag"),
      makeAccount("4100", "aufwand"),
    ];
    const entries = [
      makeEntry("2025-03-01", "1200", "8400", 3000, "UMS"),
      makeEntry("2025-04-01", "4100", "1200", 5000, "LOHN"),
    ];
    const r = buildEuer({
      accounts,
      entries,
      wirtschaftsjahr: WJ,
      istKleinunternehmer: false,
    });
    expect(r.summen.steuerlicherGewinn).toBe("-2000.00");
  });

  it("Kleinunternehmer: Kz 111 statt Kz 112", () => {
    const accounts = [
      makeAccount("1200", "aktiva"),
      makeAccount("8400", "ertrag"),
    ];
    const entries = [makeEntry("2025-03-01", "1200", "8400", 5000, "UMS")];
    const r = buildEuer({
      accounts,
      entries,
      wirtschaftsjahr: WJ,
      istKleinunternehmer: true,
    });
    expect(kzWert(r, "111")).toBe("5000.00");
    expect(kzWert(r, "112")).toBe("0.00");
    // Kz 140 (USt) entfällt bei Kleinunternehmer
    expect(kzWert(r, "140")).toBe("0.00");
  });

  it("Bewirtung BMF-Brutto: 1000 € → Kz 175 voll, Kz 228 nur 30 %", () => {
    // BMF-Konvention: Kz 175 = vollständiger Bewirtungsbetrag (1000); davon
    // werden 30 % (300) in Kz 228 als nicht abziehbar ausgewiesen; in Kz 219
    // wird Kz 228 zum vorläufigen Gewinn addiert → per Saldo nur 70 %
    // abziehbar. Das vermeidet Doppelzählung gegenüber dem Netto-Ansatz.
    const accounts = [
      makeAccount("1200", "aktiva"),
      makeAccount("4650", "aufwand"),
    ];
    const entries = [makeEntry("2025-03-01", "4650", "1200", 1000, "BEW")];
    const r = buildEuer({
      accounts,
      entries,
      wirtschaftsjahr: WJ,
      istKleinunternehmer: false,
    });
    expect(kzWert(r, "175")).toBe("1000.00");
    expect(kzWert(r, "228")).toBe("300.00");
    expect(r.bewirtung.gesamt).toBe("1000.00");
    expect(r.bewirtung.abzugsfaehig).toBe("700.00");
    expect(r.bewirtung.nichtAbzugsfaehig).toBe("300.00");
  });

  it("Geschenke: 45 € → Kz 170, 80 € → Kz 228", () => {
    const accounts = [
      makeAccount("1200", "aktiva"),
      makeAccount("4630", "aufwand"), // Geschenke ≤ 50
      makeAccount("4636", "aufwand"), // Geschenke > 50
    ];
    const entries = [
      makeEntry("2025-03-01", "4630", "1200", 45, "G45"),
      makeEntry("2025-04-01", "4636", "1200", 80, "G80"),
    ];
    const r = buildEuer({
      accounts,
      entries,
      wirtschaftsjahr: WJ,
      istKleinunternehmer: false,
    });
    expect(kzWert(r, "170")).toBe("45.00");
    expect(kzWert(r, "228")).toBe("80.00");
    expect(r.geschenke.bisGrenze).toBe("45.00");
    expect(r.geschenke.ueberGrenze).toBe("80.00");
  });

  it("AfA correctly split: beweglich/unbeweglich/immateriell/Sonder-7g", () => {
    const accounts = [
      makeAccount("1200", "aktiva"),
      makeAccount("4800", "aufwand"), // Kz 171 AfA beweglich
      makeAccount("4820", "aufwand"), // Kz 172 AfA unbeweglich
      makeAccount("4830", "aufwand"), // Kz 173 AfA immateriell
      makeAccount("4850", "aufwand"), // Kz 174 Sonder-AfA § 7g
    ];
    const entries = [
      makeEntry("2025-12-31", "4800", "1200", 1000, "A1"),
      makeEntry("2025-12-31", "4820", "1200", 2000, "A2"),
      makeEntry("2025-12-31", "4830", "1200", 300, "A3"),
      makeEntry("2025-12-31", "4850", "1200", 500, "A4"),
    ];
    const r = buildEuer({
      accounts,
      entries,
      wirtschaftsjahr: WJ,
      istKleinunternehmer: false,
    });
    expect(kzWert(r, "171")).toBe("1000.00");
    expect(kzWert(r, "172")).toBe("2000.00");
    expect(kzWert(r, "173")).toBe("300.00");
    expect(kzWert(r, "174")).toBe("500.00");
  });

  it("IAB § 7g beantragt: Kz 270 erscheint, beeinflusst Gewinn nicht direkt", () => {
    const r = buildEuer({
      accounts: [],
      entries: [],
      wirtschaftsjahr: WJ,
      istKleinunternehmer: false,
      iabBeantragt: new Money("5000"),
    });
    expect(kzWert(r, "270")).toBe("5000.00");
    expect(r.investitionsabzug?.beantragt).toBe("5000.00");
  });

  it("IAB Auflösung Kz 210 erhöht steuerlichen Gewinn", () => {
    const accounts = [
      makeAccount("1200", "aktiva"),
      makeAccount("8400", "ertrag"),
    ];
    const entries = [makeEntry("2025-03-01", "1200", "8400", 10000, "UMS")];
    const r = buildEuer({
      accounts,
      entries,
      wirtschaftsjahr: WJ,
      istKleinunternehmer: false,
      iabAufloesung: new Money("2000"),
    });
    // Vorläufig 10000, +2000 Auflösung → 12000
    expect(r.summen.vorlaeufigerGewinn).toBe("10000.00");
    expect(r.summen.steuerlicherGewinn).toBe("12000.00");
  });

  it("Hinzurechnung § 7g Abs. 1 (Kz 206) erhöht steuerlichen Gewinn", () => {
    const r = buildEuer({
      accounts: [],
      entries: [],
      wirtschaftsjahr: WJ,
      istKleinunternehmer: false,
      iabHinzurechnung: new Money("3000"),
    });
    expect(kzWert(r, "206")).toBe("3000.00");
    expect(r.summen.steuerlicherGewinn).toBe("3000.00");
  });

  it("USt-Zahllast (1789) fließt in Kz 184", () => {
    const accounts = [
      makeAccount("1789", "passiva"),
      makeAccount("1200", "aktiva"),
    ];
    const entries = [makeEntry("2025-11-10", "1789", "1200", 1000, "UST")];
    const r = buildEuer({
      accounts,
      entries,
      wirtschaftsjahr: WJ,
      istKleinunternehmer: false,
    });
    expect(kzWert(r, "184")).toBe("1000.00");
  });

  it("Vorsteuer (1576) fließt in Kz 185", () => {
    const accounts = [
      makeAccount("1576", "aktiva"),
      makeAccount("1200", "aktiva"),
    ];
    const entries = [makeEntry("2025-03-01", "1576", "1200", 190, "VST")];
    const r = buildEuer({
      accounts,
      entries,
      wirtschaftsjahr: WJ,
      istKleinunternehmer: false,
    });
    expect(kzWert(r, "185")).toBe("190.00");
  });

  it("Cross-check: Σ Einnahmen − Σ Ausgaben = vorläufiger Gewinn", () => {
    const accounts = [
      makeAccount("1200", "aktiva"),
      makeAccount("8400", "ertrag"),
      makeAccount("4100", "aufwand"),
      makeAccount("4210", "aufwand"),
    ];
    const entries = [
      makeEntry("2025-03-01", "1200", "8400", 10000, "U"),
      makeEntry("2025-04-01", "4100", "1200", 2000, "L"),
      makeEntry("2025-05-01", "4210", "1200", 1500, "M"),
    ];
    const r = buildEuer({
      accounts,
      entries,
      wirtschaftsjahr: WJ,
      istKleinunternehmer: false,
    });
    const einnahmen = new Money(r.summen.betriebseinnahmen);
    const ausgaben = new Money(r.summen.betriebsausgaben);
    const gewinn = new Money(r.summen.vorlaeufigerGewinn);
    expect(einnahmen.minus(ausgaben).equals(gewinn)).toBe(true);
    expect(r.summen.vorlaeufigerGewinn).toBe("6500.00");
  });

  it("Money precision Bewirtung: 10000 → Kz 175 = 10000, Kz 228 = 3000 exact", () => {
    const accounts = [
      makeAccount("1200", "aktiva"),
      makeAccount("4650", "aufwand"),
    ];
    const entries = [makeEntry("2025-03-01", "4650", "1200", 10000, "B")];
    const r = buildEuer({
      accounts,
      entries,
      wirtschaftsjahr: WJ,
      istKleinunternehmer: false,
    });
    expect(kzWert(r, "175")).toBe("10000.00");
    expect(kzWert(r, "228")).toBe("3000.00");
  });

  it("Wirtschaftsjahr-Filter: nur Buchungen im Zeitraum", () => {
    const accounts = [
      makeAccount("1200", "aktiva"),
      makeAccount("8400", "ertrag"),
    ];
    const entries = [
      makeEntry("2024-12-15", "1200", "8400", 1000, "VJ"),
      makeEntry("2025-06-15", "1200", "8400", 5000, "CY"),
      makeEntry("2026-01-05", "1200", "8400", 2000, "FJ"),
    ];
    const r = buildEuer({
      accounts,
      entries,
      wirtschaftsjahr: WJ,
      istKleinunternehmer: false,
    });
    expect(kzWert(r, "112")).toBe("5000.00");
  });

  it("entwurf-Buchungen sind ausgeschlossen", () => {
    const accounts = [
      makeAccount("1200", "aktiva"),
      makeAccount("8400", "ertrag"),
    ];
    const entries: JournalEntry[] = [
      makeEntry("2025-03-01", "1200", "8400", 5000, "G"),
      {
        ...makeEntry("2025-04-01", "1200", "8400", 3000, "D"),
        status: "entwurf",
      },
    ];
    const r = buildEuer({
      accounts,
      entries,
      wirtschaftsjahr: WJ,
      istKleinunternehmer: false,
    });
    expect(kzWert(r, "112")).toBe("5000.00");
  });

  it("Sample BMF 2025: 50000 Einnahmen + Ausgaben inkl. Bewirtung 1000", () => {
    const accounts = [
      makeAccount("1200", "aktiva"),
      makeAccount("8400", "ertrag"),
      makeAccount("4100", "aufwand"),
      makeAccount("4210", "aufwand"),
      makeAccount("4650", "aufwand"),
      makeAccount("3400", "aufwand"),
    ];
    const entries = [
      makeEntry("2025-03-01", "1200", "8400", 50000, "UMS"),
      makeEntry("2025-04-01", "4100", "1200", 10000, "LOHN"),
      makeEntry("2025-05-01", "4210", "1200", 5000, "MIETE"),
      makeEntry("2025-06-01", "4650", "1200", 1000, "BEW"),
      makeEntry("2025-07-01", "3400", "1200", 4000, "WAR"),
    ];
    const r = buildEuer({
      accounts,
      entries,
      wirtschaftsjahr: WJ,
      istKleinunternehmer: false,
    });
    expect(r.summen.betriebseinnahmen).toBe("50000.00");
    // Ausgaben = 10000 + 5000 + 1000 + 4000 = 20000 (Kz 175 voll, BMF-Brutto)
    expect(r.summen.betriebsausgaben).toBe("20000.00");
    expect(r.summen.vorlaeufigerGewinn).toBe("30000.00");
    // Kz 228 = 300 → steuerlich 30000 + 300 = 30300
    expect(r.summen.steuerlicherGewinn).toBe("30300.00");
  });
});
