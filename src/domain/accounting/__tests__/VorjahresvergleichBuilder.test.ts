import { describe, it, expect } from "vitest";
import type { Account, JournalEntry } from "../../../types/db";
import { buildVorjahresvergleich } from "../VorjahresvergleichBuilder";

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

const OPTS_BASE = {
  stichtagAktuell: "2025-12-31",
  stichtagVorjahr: "2024-12-31",
  periodStartAktuell: "2025-01-01",
  periodStartVorjahr: "2024-01-01",
};

describe("VorjahresvergleichBuilder", () => {
  it("Standard growth: aktuell > vorjahr → positive deltas + UP richtung", () => {
    const accounts = [
      makeAccount("1200", "aktiva"),
      makeAccount("0900", "passiva"),
      makeAccount("8400", "ertrag"),
    ];
    const r = buildVorjahresvergleich({
      accountsAktuell: accounts,
      accountsVorjahr: accounts,
      entriesAktuell: [
        makeEntry("2025-01-01", "1200", "0900", 10000, "EB25"),
        makeEntry("2025-06-01", "1200", "8400", 3000, "UMS25"),
      ],
      entriesVorjahr: [
        makeEntry("2024-01-01", "1200", "0900", 10000, "EB24"),
        makeEntry("2024-06-01", "1200", "8400", 2000, "UMS24"),
      ],
      ...OPTS_BASE,
    });
    // Umsatz Vorjahr 2000 → Aktuell 3000 = +1000 = +50.00%
    const umsatzDelta = r.guvDeltas.find((d) => d.reference_code === "1");
    expect(umsatzDelta).toBeDefined();
    expect(umsatzDelta!.vorjahrAmount).toBe("2000.00");
    expect(umsatzDelta!.aktuellAmount).toBe("3000.00");
    expect(umsatzDelta!.absoluteDelta).toBe("1000.00");
    expect(umsatzDelta!.percentDelta).toBe("50.00");
    expect(umsatzDelta!.richtung).toBe("UP");
  });

  it("Standard decline: aktuell < vorjahr → negative deltas + DOWN", () => {
    const accounts = [
      makeAccount("1200", "aktiva"),
      makeAccount("0900", "passiva"),
      makeAccount("8400", "ertrag"),
    ];
    const r = buildVorjahresvergleich({
      accountsAktuell: accounts,
      accountsVorjahr: accounts,
      entriesAktuell: [
        makeEntry("2025-01-01", "1200", "0900", 10000, "EB25"),
        makeEntry("2025-06-01", "1200", "8400", 500, "UMS25"),
      ],
      entriesVorjahr: [
        makeEntry("2024-01-01", "1200", "0900", 10000, "EB24"),
        makeEntry("2024-06-01", "1200", "8400", 1000, "UMS24"),
      ],
      ...OPTS_BASE,
    });
    const umsatzDelta = r.guvDeltas.find((d) => d.reference_code === "1");
    expect(umsatzDelta!.absoluteDelta).toBe("-500.00");
    expect(umsatzDelta!.percentDelta).toBe("-50.00");
    expect(umsatzDelta!.richtung).toBe("DOWN");
  });

  it("Empty prior year: percentDelta is '—', absolute = full current", () => {
    const accounts = [
      makeAccount("1200", "aktiva"),
      makeAccount("0900", "passiva"),
      makeAccount("8400", "ertrag"),
    ];
    const r = buildVorjahresvergleich({
      accountsAktuell: accounts,
      accountsVorjahr: [],
      entriesAktuell: [
        makeEntry("2025-01-01", "1200", "0900", 5000, "EB"),
        makeEntry("2025-06-01", "1200", "8400", 1000, "UMS"),
      ],
      entriesVorjahr: [],
      ...OPTS_BASE,
    });
    const umsatzDelta = r.guvDeltas.find((d) => d.reference_code === "1");
    expect(umsatzDelta!.vorjahrAmount).toBe("0.00");
    expect(umsatzDelta!.aktuellAmount).toBe("1000.00");
    expect(umsatzDelta!.absoluteDelta).toBe("1000.00");
    expect(umsatzDelta!.percentDelta).toBe("—");
  });

  it("Precision: 1000.00 → 1100.00 = exactly +10.00%", () => {
    const accounts = [
      makeAccount("1200", "aktiva"),
      makeAccount("0900", "passiva"),
      makeAccount("8400", "ertrag"),
    ];
    const r = buildVorjahresvergleich({
      accountsAktuell: accounts,
      accountsVorjahr: accounts,
      entriesAktuell: [
        makeEntry("2025-01-01", "1200", "0900", 0, "EB25"),
        makeEntry("2025-06-01", "1200", "8400", 1100, "UMS25"),
      ],
      entriesVorjahr: [
        makeEntry("2024-01-01", "1200", "0900", 0, "EB24"),
        makeEntry("2024-06-01", "1200", "8400", 1000, "UMS24"),
      ],
      ...OPTS_BASE,
    });
    const umsatzDelta = r.guvDeltas.find((d) => d.reference_code === "1");
    expect(umsatzDelta!.percentDelta).toBe("10.00");
  });

  it("Zero-change lines marked UNCHANGED", () => {
    const accounts = [
      makeAccount("1200", "aktiva"),
      makeAccount("0900", "passiva"),
    ];
    const r = buildVorjahresvergleich({
      accountsAktuell: accounts,
      accountsVorjahr: accounts,
      entriesAktuell: [makeEntry("2025-01-01", "1200", "0900", 5000, "EB25")],
      entriesVorjahr: [makeEntry("2024-01-01", "1200", "0900", 5000, "EB24")],
      ...OPTS_BASE,
    });
    // Umsatz 0 in beiden Jahren → UNCHANGED
    const umsatz = r.guvDeltas.find((d) => d.reference_code === "1");
    expect(umsatz!.richtung).toBe("UNCHANGED");
    expect(umsatz!.absoluteDelta).toBe("0.00");
  });

  it("Jahresergebnis delta propagated in summary", () => {
    const accounts = [
      makeAccount("1200", "aktiva"),
      makeAccount("0900", "passiva"),
      makeAccount("8400", "ertrag"),
    ];
    const r = buildVorjahresvergleich({
      accountsAktuell: accounts,
      accountsVorjahr: accounts,
      entriesAktuell: [
        makeEntry("2025-01-01", "1200", "0900", 10000, "EB25"),
        makeEntry("2025-06-01", "1200", "8400", 3000, "UMS25"),
      ],
      entriesVorjahr: [
        makeEntry("2024-01-01", "1200", "0900", 10000, "EB24"),
        makeEntry("2024-06-01", "1200", "8400", 1000, "UMS24"),
      ],
      ...OPTS_BASE,
    });
    // 3000 - 1000 = 2000
    expect(r.summary.jahresergebnisEntwicklung).toBe("2000.00");
    expect(r.summary.ergebnisImprovement).toBe(true);
    expect(r.summary.umsatzEntwicklung).toBe("2000.00");
  });

  it("counts steigend/fallend/unveraendert", () => {
    const accounts = [
      makeAccount("1200", "aktiva"),
      makeAccount("0900", "passiva"),
      makeAccount("8400", "ertrag"),
      makeAccount("4100", "aufwand"),
    ];
    const r = buildVorjahresvergleich({
      accountsAktuell: accounts,
      accountsVorjahr: accounts,
      entriesAktuell: [
        makeEntry("2025-01-01", "1200", "0900", 10000, "EB25"),
        makeEntry("2025-06-01", "1200", "8400", 3000, "UMS25"),
        makeEntry("2025-07-01", "4100", "1200", 500, "LOHN25"),
      ],
      entriesVorjahr: [
        makeEntry("2024-01-01", "1200", "0900", 10000, "EB24"),
        makeEntry("2024-06-01", "1200", "8400", 1000, "UMS24"),
        makeEntry("2024-07-01", "4100", "1200", 500, "LOHN24"),
      ],
      ...OPTS_BASE,
    });
    // Umsatz stieg (UP), Personal 500==500 (UNCHANGED), mehrere Posten 0==0 (UNCHANGED)
    expect(r.summary.anzahlSteigend).toBeGreaterThan(0);
    expect(r.summary.anzahlUnveraendert).toBeGreaterThan(0);
  });

  it("Account only in Vorjahr (removed in aktuell) appears as DOWN delta", () => {
    const accountsAktuell = [
      makeAccount("1200", "aktiva"),
      makeAccount("0900", "passiva"),
    ];
    const accountsVorjahr = [
      ...accountsAktuell,
      makeAccount("8400", "ertrag"), // nur im Vorjahr
    ];
    const r = buildVorjahresvergleich({
      accountsAktuell,
      accountsVorjahr,
      entriesAktuell: [makeEntry("2025-01-01", "1200", "0900", 5000, "EB25")],
      entriesVorjahr: [
        makeEntry("2024-01-01", "1200", "0900", 5000, "EB24"),
        makeEntry("2024-06-01", "1200", "8400", 1000, "UMS24"),
      ],
      ...OPTS_BASE,
    });
    // Umsatz ist in GuV positionen für beide Jahre — Vorjahr hatte 1000, aktuell 0
    const umsatzDelta = r.guvDeltas.find((d) => d.reference_code === "1");
    expect(umsatzDelta!.vorjahrAmount).toBe("1000.00");
    expect(umsatzDelta!.aktuellAmount).toBe("0.00");
    expect(umsatzDelta!.richtung).toBe("DOWN");
  });

  it("reports include both years' full reports", () => {
    const accounts = [
      makeAccount("1200", "aktiva"),
      makeAccount("0900", "passiva"),
    ];
    const r = buildVorjahresvergleich({
      accountsAktuell: accounts,
      accountsVorjahr: accounts,
      entriesAktuell: [makeEntry("2025-01-01", "1200", "0900", 5000, "E")],
      entriesVorjahr: [makeEntry("2024-01-01", "1200", "0900", 3000, "E")],
      ...OPTS_BASE,
    });
    expect(r.aktuell.bilanz.aktivaSum).toBe("5000.00");
    expect(r.vorjahr.bilanz.aktivaSum).toBe("3000.00");
    expect(r.aktuell.guv.jahresergebnis).toBe("0.00");
    expect(r.vorjahr.guv.jahresergebnis).toBe("0.00");
  });
});
