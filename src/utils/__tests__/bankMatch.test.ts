/**
 * Unit-Tests für src/utils/bankMatch.ts — Fuzzy-Matching Bank ↔ OPOS.
 *
 * Sprint 5, Option B (Gap-Closure). Der bestehende Scored-Candidates-
 * Ansatz (Jaccard-Tokens statt Levenshtein, Score 0..1 statt 0-100,
 * 4 Konfidenz-Stufen) wird als gegebenes Design geprüft (siehe
 * docs/SPRINT-5-DECISIONS.md). Die Spec-Abweichungen sind bewusst
 * akzeptiert.
 *
 * Getestet:
 *   - Score-Grenzen: exact / high / medium / low / kein Match
 *   - Beleg-Nr-Erkennung im Verwendungszweck (Normalize-Substring)
 *   - Betrags-Toleranzen (±0,01 € / ±0,05 € / darüber)
 *   - Richtungs-Plausibilität (H↔Forderung, S↔Verbindlichkeit)
 *   - Namens-Fuzzy via Jaccard-Token-Overlap
 *   - topMatches: Sortierung, Limit, Score-Filter > 0.2
 */

import { describe, it, expect } from "vitest";
import { scoreMatch, topMatches } from "../bankMatch";
import type { BankTx } from "../mt940";
import type { OpenItem } from "../../api/opos";

// --- Fixture-Helper --------------------------------------------------------

function makeTx(overrides: Partial<BankTx> = {}): BankTx {
  return {
    datum: "2025-03-15",
    valuta: "2025-03-15",
    betrag: 100,
    typ: "H",
    waehrung: "EUR",
    verwendungszweck: "",
    gegenseite_name: null,
    gegenseite_iban: null,
    gegenseite_bic: null,
    raw_86: "",
    reference: null,
    ...overrides,
  };
}

function makeItem(overrides: Partial<OpenItem> = {}): OpenItem {
  return {
    beleg_nr: "AR-2025-001",
    kind: "forderung",
    gegenseite: "Test GmbH",
    beschreibung: "Testrechnung",
    datum: "2025-03-01",
    faelligkeit: "2025-03-15",
    betrag: 100,
    bezahlt: 0,
    offen: 100,
    ueberfaellig_tage: 0,
    bucket: "0-30",
    entry_ids: ["e-1"],
    client_id: null,
    ...overrides,
  };
}

// --- 1) Score-Grenzen -----------------------------------------------------

describe("scoreMatch — Konfidenz-Stufen", () => {
  it("exact: Betrag + Beleg-Nr + Name + Richtung → confidence exact, Score 1.0", () => {
    const tx = makeTx({
      betrag: 100,
      typ: "H",
      verwendungszweck: "Zahlung AR-2025-001",
      gegenseite_name: "Meyer GmbH",
    });
    const item = makeItem({
      beleg_nr: "AR-2025-001",
      kind: "forderung",
      gegenseite: "Meyer GmbH",
      offen: 100,
    });
    const r = scoreMatch(tx, item);
    expect(r.confidence).toBe("exact");
    expect(r.score).toBeCloseTo(1.0, 2);
  });

  it("high: Betrag + Name aber ohne Beleg-Nr → confidence high", () => {
    const tx = makeTx({
      betrag: 100,
      typ: "H",
      verwendungszweck: "Überweisung März",
      gegenseite_name: "Meyer GmbH",
    });
    const item = makeItem({
      beleg_nr: "AR-2025-001",
      gegenseite: "Meyer GmbH",
      offen: 100,
    });
    const r = scoreMatch(tx, item);
    expect(r.confidence).toBe("high");
    // 0.5 (Betrag exakt) + 0.15 (Name Jaccard == 1.0) = 0.65
    expect(r.score).toBeCloseTo(0.65, 2);
  });

  it("medium: Betrag exakt, ohne Beleg-Nr und ohne Name-Match → medium", () => {
    const tx = makeTx({
      betrag: 100,
      typ: "H",
      verwendungszweck: "Barüberweisung",
      gegenseite_name: null,
    });
    const item = makeItem({ offen: 100, gegenseite: "— ohne —" });
    const r = scoreMatch(tx, item);
    expect(r.confidence).toBe("medium");
    expect(r.score).toBeCloseTo(0.5, 2);
  });

  it("low: Betrag nur nah (±0,05 €), kein Beleg, kein Name → low", () => {
    const tx = makeTx({
      betrag: 100.04,
      typ: "H",
      verwendungszweck: "Irgendwas",
      gegenseite_name: null,
    });
    const item = makeItem({ offen: 100.0, gegenseite: "— ohne —" });
    const r = scoreMatch(tx, item);
    expect(r.confidence).toBe("low");
    // 0.3 (closeAmount) — kein sameAmount, also keine "medium"-Stufe
    expect(r.score).toBeCloseTo(0.3, 2);
  });

  it("kein Match: Betrag weit daneben, kein Beleg, kein Name → Score 0, low", () => {
    const tx = makeTx({
      betrag: 50,
      typ: "H",
      verwendungszweck: "Sonstiges",
      gegenseite_name: null,
    });
    const item = makeItem({ offen: 250, gegenseite: "— ohne —" });
    const r = scoreMatch(tx, item);
    expect(r.confidence).toBe("low");
    expect(r.score).toBe(0);
  });
});

// --- 2) Beleg-Nr-Erkennung im Verwendungszweck -----------------------------

describe("scoreMatch — Beleg-Nr in Verwendungszweck", () => {
  it("Rg. 042 Kunde → erkennt Beleg-Nr 042", () => {
    const tx = makeTx({
      betrag: 100,
      verwendungszweck: "Rg. 042 Kunde",
    });
    const item = makeItem({ beleg_nr: "042", offen: 100 });
    const r = scoreMatch(tx, item);
    expect(r.reasons.some((s) => s.includes("Beleg-Nr."))).toBe(true);
    // 0.5 (Betrag) + 0.35 (Beleg) = 0.85
    expect(r.score).toBeCloseTo(0.85, 2);
  });

  it("Zahlung Rechnung 2025-042 → erkennt Beleg-Nr 2025-042 (Sonderzeichen ignoriert)", () => {
    const tx = makeTx({
      betrag: 500,
      verwendungszweck: "Zahlung Rechnung 2025-042",
    });
    const item = makeItem({ beleg_nr: "2025-042", offen: 500 });
    const r = scoreMatch(tx, item);
    expect(r.reasons.some((s) => s.includes("Beleg-Nr."))).toBe(true);
    expect(r.confidence).toBe("exact");
  });

  it("ER-2025-006 Beta KG → erkennt ER-2025-006 auch bei Bindestrichen", () => {
    const tx = makeTx({
      betrag: 800,
      typ: "S",
      verwendungszweck: "ER-2025-006 Beta KG",
    });
    const item = makeItem({
      beleg_nr: "ER-2025-006",
      kind: "verbindlichkeit",
      offen: 800,
    });
    const r = scoreMatch(tx, item);
    expect(r.reasons.some((s) => s.includes("Beleg-Nr."))).toBe(true);
    expect(r.confidence).toBe("exact");
  });

  it("Verwendungszweck enthält Beleg-Nr nicht → kein Beleg-Bonus", () => {
    const tx = makeTx({
      betrag: 100,
      verwendungszweck: "Januar-Überweisung",
    });
    const item = makeItem({ beleg_nr: "AR-2025-001", offen: 100 });
    const r = scoreMatch(tx, item);
    expect(r.reasons.some((s) => s.includes("Beleg-Nr."))).toBe(false);
  });

  it("Sehr kurze Beleg-Nr (< 3 Zeichen nach Normalize) → kein Beleg-Match (Fehlerschutz)", () => {
    const tx = makeTx({
      betrag: 100,
      verwendungszweck: "Ab Januar bezahlt",
    });
    const item = makeItem({ beleg_nr: "AB", offen: 100 });
    const r = scoreMatch(tx, item);
    // "AB" normalisiert auf "ab" → Länge 2, < 3 → Schutz greift
    expect(r.reasons.some((s) => s.includes("Beleg-Nr."))).toBe(false);
  });
});

// --- 3) Betrags-Toleranzen -------------------------------------------------

describe("scoreMatch — Betrags-Toleranzen", () => {
  it("Differenz = 0 → sameAmount (+0.5 Score-Bonus)", () => {
    const tx = makeTx({ betrag: 100 });
    const item = makeItem({ offen: 100 });
    const r = scoreMatch(tx, item);
    expect(r.reasons.some((s) => s.includes("Betrag exakt"))).toBe(true);
    expect(r.score).toBeGreaterThanOrEqual(0.5);
  });

  it("Differenz 0,04 € → closeAmount (+0.3 Bonus, aber kein exact)", () => {
    const tx = makeTx({ betrag: 100.04 });
    const item = makeItem({ offen: 100.0 });
    const r = scoreMatch(tx, item);
    expect(r.reasons.some((s) => s.includes("Betrag nah"))).toBe(true);
    expect(r.reasons.some((s) => s.includes("Betrag exakt"))).toBe(false);
  });

  it("Differenz 10 € → weder sameAmount noch closeAmount (kein Betrags-Bonus)", () => {
    const tx = makeTx({ betrag: 110 });
    const item = makeItem({ offen: 100 });
    const r = scoreMatch(tx, item);
    expect(r.reasons.some((s) => s.includes("Betrag"))).toBe(false);
    expect(r.score).toBe(0);
  });
});

// --- 4) Richtungs-Plausibilität --------------------------------------------

describe("scoreMatch — Richtungs-Check", () => {
  it("Haben-Bewegung + Forderung → dirMatch (keine Strafe)", () => {
    const tx = makeTx({ betrag: 100, typ: "H" });
    const item = makeItem({ kind: "forderung", offen: 100 });
    const r = scoreMatch(tx, item);
    expect(
      r.reasons.some((s) => s.includes("Richtung passt nicht"))
    ).toBe(false);
    expect(r.confidence).not.toBe("low");
  });

  it("Soll-Bewegung + Verbindlichkeit → dirMatch (keine Strafe)", () => {
    const tx = makeTx({ betrag: 500, typ: "S" });
    const item = makeItem({ kind: "verbindlichkeit", offen: 500 });
    const r = scoreMatch(tx, item);
    expect(
      r.reasons.some((s) => s.includes("Richtung passt nicht"))
    ).toBe(false);
  });

  it("Haben-Bewegung + Verbindlichkeit → Strafe -0.4, Confidence low", () => {
    const tx = makeTx({ betrag: 100, typ: "H" });
    const item = makeItem({ kind: "verbindlichkeit", offen: 100 });
    const r = scoreMatch(tx, item);
    expect(
      r.reasons.some((s) => s.includes("Richtung passt nicht"))
    ).toBe(true);
    // 0.5 (Betrag) - 0.4 (Richtung) = 0.1 → low
    expect(r.score).toBeCloseTo(0.1, 2);
    expect(r.confidence).toBe("low");
  });
});

// --- 5) Namens-Fuzzy via Jaccard -------------------------------------------

describe("scoreMatch — Namens-Fuzzy (Jaccard-Token-Overlap)", () => {
  it("Identischer Name → Jaccard 1.0 → +0.15 Bonus", () => {
    const tx = makeTx({
      betrag: 100,
      gegenseite_name: "Meyer GmbH",
    });
    const item = makeItem({ gegenseite: "Meyer GmbH", offen: 100 });
    const r = scoreMatch(tx, item);
    expect(
      r.reasons.some((s) => s.includes("Gegenseiten-Name stimmt"))
    ).toBe(true);
  });

  it("Teil-Overlap (Maier vs Meyer Tippfehler, GmbH gemeinsam) → kleiner Bonus", () => {
    const tx = makeTx({
      betrag: 100,
      gegenseite_name: "Maier GmbH",
    });
    const item = makeItem({ gegenseite: "Meyer GmbH", offen: 100 });
    const r = scoreMatch(tx, item);
    // {"maier","gmbh"} vs {"meyer","gmbh"}: inter=1, union=3 → Jaccard ≈ 0.33
    expect(
      r.reasons.some((s) => s.includes("Gegenseiten-Name teilweise"))
    ).toBe(true);
  });

  it("Völlig anderer Name → kein Namens-Bonus", () => {
    const tx = makeTx({
      betrag: 100,
      gegenseite_name: "Schmidt Handels AG",
    });
    const item = makeItem({ gegenseite: "Meyer GmbH", offen: 100 });
    const r = scoreMatch(tx, item);
    expect(
      r.reasons.some((s) => s.toLowerCase().includes("gegenseiten-name"))
    ).toBe(false);
  });
});

// --- 6) topMatches: Sortierung, Limit, Filter ------------------------------

describe("topMatches", () => {
  it("5 Kandidaten → default limit=3, absteigend nach Score sortiert", () => {
    const tx = makeTx({
      betrag: 100,
      verwendungszweck: "Zahlung AR-2025-001",
      gegenseite_name: "Meyer GmbH",
    });
    const items = [
      // A: exact — Score 1.0
      makeItem({
        beleg_nr: "AR-2025-001",
        gegenseite: "Meyer GmbH",
        offen: 100,
      }),
      // B: medium — nur Betrag
      makeItem({
        beleg_nr: "AR-2025-777",
        gegenseite: "X",
        offen: 100,
      }),
      // C: low closeAmount
      makeItem({
        beleg_nr: "AR-2025-333",
        gegenseite: "Y",
        offen: 100.04,
      }),
      // D: high — Betrag + Name
      makeItem({
        beleg_nr: "AR-2025-444",
        gegenseite: "Meyer GmbH",
        offen: 100,
      }),
      // E: kein Match
      makeItem({
        beleg_nr: "AR-2025-555",
        gegenseite: "Z",
        offen: 999,
      }),
    ];
    const top = topMatches(tx, items, 3);
    expect(top.length).toBe(3);
    // Absteigend sortiert: A > D > B (C und E unter Score-Filter)
    expect(top[0].openItem.beleg_nr).toBe("AR-2025-001");
    expect(top[1].openItem.beleg_nr).toBe("AR-2025-444");
    expect(top[0].score).toBeGreaterThanOrEqual(top[1].score);
    expect(top[1].score).toBeGreaterThanOrEqual(top[2].score);
  });

  it("limit=1 → nur ein Kandidat zurück", () => {
    const tx = makeTx({
      betrag: 100,
      verwendungszweck: "Zahlung AR-2025-001",
    });
    const items = [
      makeItem({ beleg_nr: "AR-2025-001", offen: 100 }),
      makeItem({ beleg_nr: "AR-2025-002", offen: 100 }),
      makeItem({ beleg_nr: "AR-2025-003", offen: 100 }),
    ];
    const top = topMatches(tx, items, 1);
    expect(top.length).toBe(1);
    expect(top[0].openItem.beleg_nr).toBe("AR-2025-001");
  });

  it("Score-Filter > 0.2 greift → Kandidaten mit Score ≤ 0.2 werden aussortiert", () => {
    const tx = makeTx({
      betrag: 100,
      typ: "H",
      verwendungszweck: "Irgendwas",
      gegenseite_name: null,
    });
    const items = [
      // Alle drei: Haben + Verbindlichkeit → Richtungs-Strafe -0.4
      // Betrag exakt +0.5 → 0.1 → unter Filter
      makeItem({
        beleg_nr: "V-1",
        kind: "verbindlichkeit",
        offen: 100,
        gegenseite: "—",
      }),
      makeItem({
        beleg_nr: "V-2",
        kind: "verbindlichkeit",
        offen: 100,
        gegenseite: "—",
      }),
      // Exact match → durchkommt
      makeItem({
        beleg_nr: "F-1",
        kind: "forderung",
        offen: 100,
        gegenseite: "—",
      }),
    ];
    const top = topMatches(tx, items, 3);
    expect(top.length).toBe(1);
    expect(top[0].openItem.beleg_nr).toBe("F-1");
  });
});
