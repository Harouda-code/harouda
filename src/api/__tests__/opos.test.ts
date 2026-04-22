/**
 * Unit-Tests für src/api/opos.ts — Derived-OPOS aus dem Buchungsjournal.
 *
 * Sprint 4, Option B (Gap-Closure). Der Derived-Ansatz wird als gegebenes
 * Architektur-Modell geprüft, nicht in Frage gestellt (siehe
 * docs/SPRINT-4-DECISIONS.md).
 *
 * Getestet:
 *   - buildOpenItems: Happy Path, Netting bei Teil- und Voll-Zahlung,
 *     Debitor- vs. Kreditor-Trennung, Beleg-Nr-Gruppierung,
 *     Default-Fälligkeit (datum + 14 Tage)
 *   - Aging-Bucket-Grenzen (taggenau: 30/31, 60/61, 90/91)
 *   - Überfälligkeit vs. Fälligkeit in der Zukunft
 *   - summarizeOpenItems: Summen + Bucket-Verteilung
 *   - isReceivableAccount / isPayableAccount: Konten-Bereich 1400-1499
 *     bzw. 1600-1699
 */

import { describe, it, expect } from "vitest";
import type { Account, JournalEntry } from "../../types/db";
import {
  buildOpenItems,
  isPayableAccount,
  isReceivableAccount,
  summarizeOpenItems,
} from "../opos";

// --- Fixture-Helper --------------------------------------------------------

function makeAccount(
  konto_nr: string,
  kategorie: Account["kategorie"] = "aktiva"
): Account {
  return {
    id: `a-${konto_nr}`,
    konto_nr,
    bezeichnung: `Konto ${konto_nr}`,
    kategorie,
    ust_satz: null,
    skr: "SKR03",
    is_active: true,
  };
}

const ACCOUNTS: Account[] = [
  makeAccount("1000"), // Kasse
  makeAccount("1200"), // Bank
  makeAccount("1400"), // Forderungen aus L+L
  makeAccount("1499"), // Forderungen (obere Grenze)
  makeAccount("1500"), // Nicht-Forderung (außerhalb Bereich)
  makeAccount("1600", "passiva"), // VLL
  makeAccount("1699", "passiva"), // VLL (obere Grenze)
  makeAccount("3400", "aufwand"),
  makeAccount("8400", "ertrag"),
];

let idCounter = 0;
function makeEntry(params: {
  datum: string;
  soll: string;
  haben: string;
  betrag: number;
  beleg_nr?: string;
  beschreibung?: string;
  gegenseite?: string | null;
  faelligkeit?: string | null;
  client_id?: string | null;
}): JournalEntry {
  idCounter++;
  return {
    id: `e-${idCounter}`,
    datum: params.datum,
    beleg_nr: params.beleg_nr ?? `B-${idCounter}`,
    beschreibung: params.beschreibung ?? "Test",
    soll_konto: params.soll,
    haben_konto: params.haben,
    betrag: params.betrag,
    ust_satz: null,
    status: "gebucht",
    client_id: params.client_id ?? null,
    skonto_pct: null,
    skonto_tage: null,
    gegenseite: params.gegenseite ?? null,
    faelligkeit: params.faelligkeit ?? null,
    version: 1,
    kostenstelle: null,
  };
}

// Fixer "Jetzt"-Zeitpunkt für deterministische Überfälligkeits-Berechnung.
const NOW = new Date("2025-06-15T12:00:00Z");

function daysBefore(days: number): string {
  const d = new Date(NOW);
  d.setUTCDate(d.getUTCDate() - days);
  return d.toISOString().slice(0, 10);
}

function daysAfter(days: number): string {
  return daysBefore(-days);
}

// ---------------------------------------------------------------------------

describe("isReceivableAccount / isPayableAccount", () => {
  it("akzeptiert 1400-1499 als Forderungs-Konto", () => {
    expect(isReceivableAccount(makeAccount("1400"))).toBe(true);
    expect(isReceivableAccount(makeAccount("1410"))).toBe(true);
    expect(isReceivableAccount(makeAccount("1499"))).toBe(true);
  });

  it("lehnt Konten außerhalb 1400-1499 als Forderungs-Konto ab", () => {
    expect(isReceivableAccount(makeAccount("1399"))).toBe(false);
    expect(isReceivableAccount(makeAccount("1500"))).toBe(false);
    expect(isReceivableAccount(makeAccount("1600"))).toBe(false);
    expect(isReceivableAccount(undefined)).toBe(false);
  });

  it("akzeptiert 1600-1699 als Verbindlichkeits-Konto", () => {
    expect(isPayableAccount(makeAccount("1600"))).toBe(true);
    expect(isPayableAccount(makeAccount("1650"))).toBe(true);
    expect(isPayableAccount(makeAccount("1699"))).toBe(true);
  });

  it("lehnt Konten außerhalb 1600-1699 als Verbindlichkeits-Konto ab", () => {
    expect(isPayableAccount(makeAccount("1599"))).toBe(false);
    expect(isPayableAccount(makeAccount("1700"))).toBe(false);
    expect(isPayableAccount(makeAccount("1400"))).toBe(false);
    expect(isPayableAccount(undefined)).toBe(false);
  });
});

describe("buildOpenItems — Happy Path", () => {
  it("leere Journal-Liste → keine OpenItems", () => {
    expect(buildOpenItems([], ACCOUNTS, NOW)).toHaveLength(0);
  });

  it("eine offene Forderung erzeugt einen OpenItem kind=forderung", () => {
    const entries = [
      makeEntry({
        datum: daysBefore(10),
        soll: "1400",
        haben: "8400",
        betrag: 1190,
        beleg_nr: "AR-001",
        beschreibung: "Rechnung Kunde Müller",
        gegenseite: "Müller GmbH",
      }),
    ];
    const items = buildOpenItems(entries, ACCOUNTS, NOW);
    expect(items).toHaveLength(1);
    expect(items[0].kind).toBe("forderung");
    expect(items[0].beleg_nr).toBe("AR-001");
    expect(items[0].gegenseite).toBe("Müller GmbH");
    expect(items[0].offen).toBeCloseTo(1190, 5);
    expect(items[0].bezahlt).toBe(0);
  });

  it("vollständig bezahlte Forderung taucht NICHT auf (Netting)", () => {
    const entries = [
      makeEntry({
        datum: daysBefore(20),
        soll: "1400",
        haben: "8400",
        betrag: 500,
        beleg_nr: "AR-002",
      }),
      makeEntry({
        datum: daysBefore(5),
        soll: "1200",
        haben: "1400",
        betrag: 500,
        beleg_nr: "AR-002",
      }),
    ];
    expect(buildOpenItems(entries, ACCOUNTS, NOW)).toHaveLength(0);
  });

  it("teilbezahlte Forderung: offen = Rest (Brutto - Teilzahlung)", () => {
    const entries = [
      makeEntry({
        datum: daysBefore(30),
        soll: "1400",
        haben: "8400",
        betrag: 1000,
        beleg_nr: "AR-003",
      }),
      makeEntry({
        datum: daysBefore(10),
        soll: "1200",
        haben: "1400",
        betrag: 300,
        beleg_nr: "AR-003",
      }),
    ];
    const items = buildOpenItems(entries, ACCOUNTS, NOW);
    expect(items).toHaveLength(1);
    expect(items[0].offen).toBeCloseTo(700, 5);
  });

  it("eine offene Verbindlichkeit erzeugt einen OpenItem kind=verbindlichkeit", () => {
    const entries = [
      makeEntry({
        datum: daysBefore(5),
        soll: "3400",
        haben: "1600",
        betrag: 2380,
        beleg_nr: "ER-001",
        gegenseite: "Lieferant Beta KG",
      }),
    ];
    const items = buildOpenItems(entries, ACCOUNTS, NOW);
    expect(items).toHaveLength(1);
    expect(items[0].kind).toBe("verbindlichkeit");
    expect(items[0].gegenseite).toBe("Lieferant Beta KG");
    expect(items[0].offen).toBeCloseTo(2380, 5);
  });

  it("bezahlte Verbindlichkeit wird durch Zahlung saldiert und verschwindet", () => {
    const entries = [
      makeEntry({
        datum: daysBefore(20),
        soll: "3400",
        haben: "1600",
        betrag: 1000,
        beleg_nr: "ER-002",
      }),
      makeEntry({
        datum: daysBefore(5),
        soll: "1600",
        haben: "1200",
        betrag: 1000,
        beleg_nr: "ER-002",
      }),
    ];
    expect(buildOpenItems(entries, ACCOUNTS, NOW)).toHaveLength(0);
  });

  it("mehrere Belege erzeugen mehrere unabhängige OpenItems", () => {
    const entries = [
      makeEntry({
        datum: daysBefore(10),
        soll: "1400",
        haben: "8400",
        betrag: 100,
        beleg_nr: "AR-A",
      }),
      makeEntry({
        datum: daysBefore(10),
        soll: "1400",
        haben: "8400",
        betrag: 200,
        beleg_nr: "AR-B",
      }),
      makeEntry({
        datum: daysBefore(10),
        soll: "3400",
        haben: "1600",
        betrag: 300,
        beleg_nr: "ER-C",
      }),
    ];
    const items = buildOpenItems(entries, ACCOUNTS, NOW);
    expect(items).toHaveLength(3);
    const belegNrs = items.map((i) => i.beleg_nr).sort();
    expect(belegNrs).toEqual(["AR-A", "AR-B", "ER-C"]);
  });

  it("Forderung und Verbindlichkeit mit gleicher beleg_nr sind getrennte OPOS (unterschiedliche Prefixe)", () => {
    const entries = [
      makeEntry({
        datum: daysBefore(10),
        soll: "1400",
        haben: "8400",
        betrag: 100,
        beleg_nr: "SHARED-NR",
      }),
      makeEntry({
        datum: daysBefore(10),
        soll: "3400",
        haben: "1600",
        betrag: 200,
        beleg_nr: "SHARED-NR",
      }),
    ];
    const items = buildOpenItems(entries, ACCOUNTS, NOW);
    expect(items).toHaveLength(2);
    const kinds = items.map((i) => i.kind).sort();
    expect(kinds).toEqual(["forderung", "verbindlichkeit"]);
  });

  it("Beleg ohne Gegenseite bekommt Platzhalter-Text", () => {
    const items = buildOpenItems(
      [
        makeEntry({
          datum: daysBefore(10),
          soll: "1400",
          haben: "8400",
          betrag: 100,
          beleg_nr: "AR-NO-GS",
          gegenseite: null,
        }),
      ],
      ACCOUNTS,
      NOW
    );
    expect(items).toHaveLength(1);
    expect(items[0].gegenseite).toBe("— ohne Gegenseite —");
  });

  it("Default-Fälligkeit = datum + 14 Tage, wenn faelligkeit null", () => {
    const datum = daysBefore(10); // z. B. 2025-06-05
    const items = buildOpenItems(
      [
        makeEntry({
          datum,
          soll: "1400",
          haben: "8400",
          betrag: 100,
          beleg_nr: "AR-DEF",
          faelligkeit: null,
        }),
      ],
      ACCOUNTS,
      NOW
    );
    const expected = new Date(datum);
    expected.setDate(expected.getDate() + 14);
    expect(items[0].faelligkeit).toBe(expected.toISOString().slice(0, 10));
  });

  it("explizite Fälligkeit wird verwendet (nicht Default)", () => {
    const items = buildOpenItems(
      [
        makeEntry({
          datum: daysBefore(30),
          soll: "1400",
          haben: "8400",
          betrag: 100,
          beleg_nr: "AR-EXPL",
          faelligkeit: "2025-12-31",
        }),
      ],
      ACCOUNTS,
      NOW
    );
    expect(items[0].faelligkeit).toBe("2025-12-31");
  });

  it("Sortierung: überfälligste Zeile steht oben", () => {
    const items = buildOpenItems(
      [
        makeEntry({
          datum: daysBefore(10),
          soll: "1400",
          haben: "8400",
          betrag: 100,
          beleg_nr: "AR-NEU",
          faelligkeit: daysBefore(5),
        }),
        makeEntry({
          datum: daysBefore(100),
          soll: "1400",
          haben: "8400",
          betrag: 200,
          beleg_nr: "AR-ALT",
          faelligkeit: daysBefore(80),
        }),
      ],
      ACCOUNTS,
      NOW
    );
    expect(items[0].beleg_nr).toBe("AR-ALT");
    expect(items[1].beleg_nr).toBe("AR-NEU");
  });
});

describe("buildOpenItems — Aging-Buckets", () => {
  function openItemFaelligkeit(faelligkeit: string, beleg: string) {
    return makeEntry({
      datum: daysBefore(120),
      soll: "1400",
      haben: "8400",
      betrag: 100,
      beleg_nr: beleg,
      faelligkeit,
    });
  }

  it("Fälligkeit heute → bucket 0-30, ueberfaellig_tage=0", () => {
    const items = buildOpenItems(
      [openItemFaelligkeit(daysBefore(0), "B-TODAY")],
      ACCOUNTS,
      NOW
    );
    expect(items[0].bucket).toBe("0-30");
    expect(items[0].ueberfaellig_tage).toBe(0);
  });

  it("Fälligkeit morgen (noch nicht fällig) → bucket 0-30, ueberfaellig_tage negativ", () => {
    const items = buildOpenItems(
      [openItemFaelligkeit(daysAfter(1), "B-TOMORROW")],
      ACCOUNTS,
      NOW
    );
    expect(items[0].bucket).toBe("0-30");
    expect(items[0].ueberfaellig_tage).toBeLessThan(0);
  });

  it("Grenze 30/31: 30 Tage überfällig → 0-30, 31 Tage → 31-60", () => {
    const items30 = buildOpenItems(
      [openItemFaelligkeit(daysBefore(30), "B-30")],
      ACCOUNTS,
      NOW
    );
    expect(items30[0].ueberfaellig_tage).toBe(30);
    expect(items30[0].bucket).toBe("0-30");

    const items31 = buildOpenItems(
      [openItemFaelligkeit(daysBefore(31), "B-31")],
      ACCOUNTS,
      NOW
    );
    expect(items31[0].ueberfaellig_tage).toBe(31);
    expect(items31[0].bucket).toBe("31-60");
  });

  it("Grenze 60/61: 60 Tage → 31-60, 61 Tage → 61-90", () => {
    const items60 = buildOpenItems(
      [openItemFaelligkeit(daysBefore(60), "B-60")],
      ACCOUNTS,
      NOW
    );
    expect(items60[0].ueberfaellig_tage).toBe(60);
    expect(items60[0].bucket).toBe("31-60");

    const items61 = buildOpenItems(
      [openItemFaelligkeit(daysBefore(61), "B-61")],
      ACCOUNTS,
      NOW
    );
    expect(items61[0].ueberfaellig_tage).toBe(61);
    expect(items61[0].bucket).toBe("61-90");
  });

  it("Grenze 90/91: 90 Tage → 61-90, 91 Tage → 91+", () => {
    const items90 = buildOpenItems(
      [openItemFaelligkeit(daysBefore(90), "B-90")],
      ACCOUNTS,
      NOW
    );
    expect(items90[0].ueberfaellig_tage).toBe(90);
    expect(items90[0].bucket).toBe("61-90");

    const items91 = buildOpenItems(
      [openItemFaelligkeit(daysBefore(91), "B-91")],
      ACCOUNTS,
      NOW
    );
    expect(items91[0].ueberfaellig_tage).toBe(91);
    expect(items91[0].bucket).toBe("91+");
  });

  it("sehr alte Forderung (365 Tage) bleibt im Bucket 91+", () => {
    const items = buildOpenItems(
      [openItemFaelligkeit(daysBefore(365), "B-OLD")],
      ACCOUNTS,
      NOW
    );
    expect(items[0].ueberfaellig_tage).toBe(365);
    expect(items[0].bucket).toBe("91+");
  });
});

describe("summarizeOpenItems", () => {
  it("leere Liste: alle Summen null, alle Buckets null", () => {
    const s = summarizeOpenItems([], ACCOUNTS, NOW);
    expect(s.receivables).toHaveLength(0);
    expect(s.payables).toHaveLength(0);
    expect(s.totals.forderung_offen).toBe(0);
    expect(s.totals.forderung_ueberfaellig).toBe(0);
    expect(s.totals.verbindlichkeit_offen).toBe(0);
    expect(s.totals.verbindlichkeit_ueberfaellig).toBe(0);
    expect(s.byBucket["0-30"].forderung).toBe(0);
    expect(s.byBucket["91+"].verbindlichkeit).toBe(0);
  });

  it("forderung_ueberfaellig zählt nur ueberfaellig_tage > 0", () => {
    const s = summarizeOpenItems(
      [
        // gerade fällig → nicht überfällig (ueberfaellig_tage = 0)
        makeEntry({
          datum: daysBefore(14),
          soll: "1400",
          haben: "8400",
          betrag: 100,
          beleg_nr: "AR-DUE",
          faelligkeit: daysBefore(0),
        }),
        // 50 Tage überfällig
        makeEntry({
          datum: daysBefore(80),
          soll: "1400",
          haben: "8400",
          betrag: 500,
          beleg_nr: "AR-OVERDUE",
          faelligkeit: daysBefore(50),
        }),
      ],
      ACCOUNTS,
      NOW
    );
    expect(s.totals.forderung_offen).toBeCloseTo(600, 5);
    expect(s.totals.forderung_ueberfaellig).toBeCloseTo(500, 5);
  });

  it("Summen pro Bucket werden korrekt aggregiert (Forderung und Verbindlichkeit getrennt)", () => {
    const s = summarizeOpenItems(
      [
        // Forderung 15 Tage überfällig → bucket 0-30
        makeEntry({
          datum: daysBefore(30),
          soll: "1400",
          haben: "8400",
          betrag: 100,
          beleg_nr: "AR-1",
          faelligkeit: daysBefore(15),
        }),
        // Forderung 45 Tage überfällig → bucket 31-60
        makeEntry({
          datum: daysBefore(60),
          soll: "1400",
          haben: "8400",
          betrag: 200,
          beleg_nr: "AR-2",
          faelligkeit: daysBefore(45),
        }),
        // Verbindlichkeit 100 Tage überfällig → bucket 91+
        makeEntry({
          datum: daysBefore(120),
          soll: "3400",
          haben: "1600",
          betrag: 300,
          beleg_nr: "ER-1",
          faelligkeit: daysBefore(100),
        }),
      ],
      ACCOUNTS,
      NOW
    );
    expect(s.byBucket["0-30"].forderung).toBeCloseTo(100, 5);
    expect(s.byBucket["31-60"].forderung).toBeCloseTo(200, 5);
    expect(s.byBucket["91+"].verbindlichkeit).toBeCloseTo(300, 5);
    expect(s.byBucket["0-30"].verbindlichkeit).toBe(0);
    expect(s.byBucket["91+"].forderung).toBe(0);
  });

  it("trennt Forderungen und Verbindlichkeiten in separate Arrays", () => {
    const s = summarizeOpenItems(
      [
        makeEntry({
          datum: daysBefore(10),
          soll: "1400",
          haben: "8400",
          betrag: 100,
          beleg_nr: "AR-X",
        }),
        makeEntry({
          datum: daysBefore(10),
          soll: "3400",
          haben: "1600",
          betrag: 200,
          beleg_nr: "ER-X",
        }),
      ],
      ACCOUNTS,
      NOW
    );
    expect(s.receivables).toHaveLength(1);
    expect(s.payables).toHaveLength(1);
    expect(s.receivables[0].kind).toBe("forderung");
    expect(s.payables[0].kind).toBe("verbindlichkeit");
  });
});
