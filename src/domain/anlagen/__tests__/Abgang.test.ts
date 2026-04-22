/**
 * Abgangs-Workflow Tests — Sprint 6 Teil 2a.
 *
 * Testet `planAbgang` (pure) für alle Szenarien + `buchtAbgang` im
 * DEMO-Modus (localStorage). Deckt ab:
 *   - Verschrottung (Erlös 0)
 *   - Verkauf mit Gewinn / Verlust / neutral
 *   - USt-Split 19 % / 7 % / 0 %
 *   - Teil-AfA bis Abgangsmonat
 *   - Input-Validierung (aktiv, Anschaffungsdatum, ust_satz)
 *   - buchtAbgang erzeugt Journal + setzt Anlage inaktiv
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import type { Anlagegut } from "../../../types/db";
import { store } from "../../../api/store";
import {
  planAbgang,
  buchtAbgang,
  createAnlageWithOpening,
} from "../AnlagenService";

function makeAnlage(overrides: Partial<Anlagegut> = {}): Anlagegut {
  const now = "2025-01-01T00:00:00Z";
  return {
    id: overrides.id ?? "a-1",
    company_id: null,
    inventar_nr: overrides.inventar_nr ?? "INV-001",
    bezeichnung: overrides.bezeichnung ?? "Test-Anlage",
    anschaffungsdatum: overrides.anschaffungsdatum ?? "2022-01-01",
    anschaffungskosten: overrides.anschaffungskosten ?? 4000,
    nutzungsdauer_jahre: overrides.nutzungsdauer_jahre ?? 8,
    afa_methode: overrides.afa_methode ?? "linear",
    konto_anlage: overrides.konto_anlage ?? "0440",
    konto_afa: overrides.konto_afa ?? "4830",
    konto_abschreibung_kumuliert:
      overrides.konto_abschreibung_kumuliert ?? null,
    aktiv: overrides.aktiv ?? true,
    abgangsdatum: overrides.abgangsdatum ?? null,
    abgangserloes: overrides.abgangserloes ?? null,
    notizen: overrides.notizen ?? null,
    parent_id: overrides.parent_id ?? null,
    created_at: now,
    updated_at: now,
  };
}

beforeEach(() => {
  localStorage.clear();
  vi.restoreAllMocks();
});

// --- planAbgang: Szenarien ------------------------------------------------

describe("planAbgang — Verschrottung (Erlös 0)", () => {
  it("erzeugt Teil-AfA + Verlust-Ausbuchung Restbuchwert auf 2800", () => {
    // AK 4000, ND 8, Kauf 01.01.2022, Abgang 30.06.2025:
    // Monats-AfA = 4000/8/12 = 41,67 (gerundet auf 2 Stellen)
    // 2022-2024 = 36 Monate * 41,67 ~ 1500 (Rest-Korrektur im Calculator)
    // 2025 Jan-Jun = 6 Monate Teil-AfA = 250
    // RBW = 4000 - (36 volle + 6 Teil) = 4000 - genau 1750 (wir überprüfen Service-Output direkt)
    const anlage = makeAnlage({
      anschaffungskosten: 4000,
      nutzungsdauer_jahre: 8,
      anschaffungsdatum: "2022-01-01",
    });
    const plan = planAbgang(anlage, {
      abgangsdatum: "2025-06-30",
      erloes_brutto: 0,
      ust_satz: 0,
    });
    expect(plan.ist_verschrottung).toBe(true);
    expect(plan.erloes_netto).toBe(0);
    expect(plan.erloes_ust).toBe(0);
    // Teil-AfA 2025 Jan-Jun (6 Monate)
    expect(plan.teil_afa_betrag).toBeCloseTo(250, 2);
    // RBW = AK - kumulierte AfA inkl. Teil-AfA
    expect(plan.restbuchwert_am_abgang).toBeCloseTo(2250, 2);
    // 2 Zeilen: Teil-AfA + Verlust-Ausbuchung
    expect(plan.lines).toHaveLength(2);
    expect(plan.lines[0].rolle).toBe("teil_afa");
    expect(plan.lines[1]).toMatchObject({
      rolle: "verlust",
      soll_konto: "2800",
      haben_konto: "0440",
      betrag: 2250,
    });
  });
});

describe("planAbgang — Verkauf mit Gewinn (Erlös > RBW)", () => {
  it("Teil-AfA + Bank-Erlös + Gewinn-Buchung auf 2700 + USt 19 %", () => {
    // Anlage mit RBW 1500 am Abgang (manipuliert via AK/ND/Kauf).
    // Wir wählen AK 8000, ND 4, Kauf 01.01.2020, Abgang 31.12.2023 (letztes Jahr).
    // Monats-AfA = 8000/4/12 = 166,67
    // 2020-2022 = 36 * 166,67 = 6000 (abgerundet, Calculator runded pro Jahr)
    // 2023 (letztes volles Jahr) = 8000 - summe 2020-2022 = 2000 → RBW Ende 2023 = 0
    // Aber Abgang vor Jahresende zählt als Teil-AfA.
    // Lass uns einfachere Zahlen: AK 4000, ND 4, Kauf 2021-01-01, Abgang 2023-12-31.
    // 2021: 1000; 2022: 1000; 2023 Jan-Dez (als Abgangs-Jahr Calculator): 12 Monate *
    // 83,33 = 1000 (bis inkl. Dez). RBW = 4000 - 3000 = 1000 vor Abgangs-AfA.
    // Abgang 2023-12-31: kumuliert = 3000 (2021+2022) + 1000 (2023) = 4000, RBW = 0
    // Das ist nicht ideal. Wir nehmen daher einen manuellen Abgang mitten im Jahr.
    //
    // AK 2400, ND 6, Kauf 01.01.2020. Monats-AfA = 2400/6/12 = 33,33.
    // Jahres-AfA = 400. Bis Ende 2024: 5*400 = 2000. RBW Anfang 2025 = 400.
    // Abgang 30.06.2025: 6 Monate Teil-AfA = 200. RBW nach Teil-AfA = 200.
    //
    // Erlös brutto 238 (= 200 netto + 38 USt 19 %).
    // Gewinn = netto 200 - RBW 200 = 0 → neutral, nicht Gewinn.
    //
    // Besser: AK 2400, ND 10, Kauf 01.01.2020, Abgang 30.06.2025.
    // Monats-AfA = 20, Jahres-AfA 240. Bis Ende 2024: 5*240 = 1200. RBW = 1200.
    // Abgang 30.06.2025 Teil-AfA: 6 * 20 = 120. RBW nach Teil-AfA = 1080.
    // Erlös brutto 1428 = 1200 netto + 228 USt. Gewinn = 1200 - 1080 = 120.
    const anlage = makeAnlage({
      anschaffungskosten: 2400,
      nutzungsdauer_jahre: 10,
      anschaffungsdatum: "2020-01-01",
    });
    const plan = planAbgang(anlage, {
      abgangsdatum: "2025-06-30",
      erloes_brutto: 1428,
      ust_satz: 19,
    });
    expect(plan.ist_verschrottung).toBe(false);
    expect(plan.teil_afa_betrag).toBeCloseTo(120, 2);
    expect(plan.restbuchwert_am_abgang).toBeCloseTo(1080, 2);
    expect(plan.erloes_netto).toBeCloseTo(1200, 2);
    expect(plan.erloes_ust).toBeCloseTo(228, 2);
    expect(plan.gewinn_verlust).toBeCloseTo(120, 2);

    // 4 Zeilen: Teil-AfA + Erlös-Ausbuchung (in Höhe RBW) + Gewinn + USt
    expect(plan.lines).toHaveLength(4);
    expect(plan.lines[0].rolle).toBe("teil_afa");
    expect(plan.lines[1]).toMatchObject({
      rolle: "erloes",
      soll_konto: "1200",
      haben_konto: "0440",
      betrag: 1080,
    });
    expect(plan.lines[2]).toMatchObject({
      rolle: "gewinn",
      soll_konto: "1200",
      haben_konto: "2700",
      betrag: 120,
    });
    expect(plan.lines[3]).toMatchObject({
      rolle: "ust",
      soll_konto: "1200",
      haben_konto: "1776",
      betrag: 228,
    });
  });
});

describe("planAbgang — Verkauf mit Verlust (Erlös < RBW)", () => {
  it("Teil-AfA + Erlös-Ausbuchung + Verlust-Buchung auf 2800", () => {
    // AK 2400, ND 10, Kauf 01.01.2020, Abgang 30.06.2025. RBW = 1080.
    // Erlös brutto 952 (= 800 netto + 152 USt). Netto 800 < 1080 → Verlust 280.
    const anlage = makeAnlage({
      anschaffungskosten: 2400,
      nutzungsdauer_jahre: 10,
      anschaffungsdatum: "2020-01-01",
    });
    const plan = planAbgang(anlage, {
      abgangsdatum: "2025-06-30",
      erloes_brutto: 952,
      ust_satz: 19,
    });
    expect(plan.erloes_netto).toBeCloseTo(800, 2);
    expect(plan.gewinn_verlust).toBeCloseTo(-280, 2);
    // 4 Zeilen: Teil-AfA + Erlös (netto) + Verlust-Ausbuchung + USt
    expect(plan.lines).toHaveLength(4);
    expect(plan.lines[1]).toMatchObject({
      rolle: "erloes",
      soll_konto: "1200",
      haben_konto: "0440",
      betrag: 800,
    });
    expect(plan.lines[2]).toMatchObject({
      rolle: "verlust",
      soll_konto: "2800",
      haben_konto: "0440",
      betrag: 280,
    });
  });
});

describe("planAbgang — Neutraler Abgang (Erlös = RBW, netto)", () => {
  it("erzeugt nur Erlös-Zeile (Bank/0440) + ggf. USt, keine Gewinn/Verlust-Zeile", () => {
    // RBW = 1080 am 30.06.2025 (siehe oben). Erlös brutto 1285,20 = 1080 netto + 205,20 USt.
    const anlage = makeAnlage({
      anschaffungskosten: 2400,
      nutzungsdauer_jahre: 10,
      anschaffungsdatum: "2020-01-01",
    });
    const plan = planAbgang(anlage, {
      abgangsdatum: "2025-06-30",
      erloes_brutto: 1285.2,
      ust_satz: 19,
    });
    expect(plan.gewinn_verlust).toBeCloseTo(0, 2);
    expect(
      plan.lines.some((l) => l.rolle === "gewinn" || l.rolle === "verlust")
    ).toBe(false);
    // Zeilen: teil_afa + erloes + ust = 3
    expect(plan.lines).toHaveLength(3);
  });
});

describe("planAbgang — USt-Sätze", () => {
  it("7 % USt nutzt Konto 1771", () => {
    const anlage = makeAnlage({
      anschaffungskosten: 2400,
      nutzungsdauer_jahre: 10,
      anschaffungsdatum: "2020-01-01",
    });
    const plan = planAbgang(anlage, {
      abgangsdatum: "2025-06-30",
      erloes_brutto: 107,
      ust_satz: 7,
    });
    const ust = plan.lines.find((l) => l.rolle === "ust");
    expect(ust).toBeDefined();
    expect(ust!.haben_konto).toBe("1771");
  });

  it("0 % USt → keine USt-Zeile", () => {
    const anlage = makeAnlage({
      anschaffungskosten: 2400,
      nutzungsdauer_jahre: 10,
      anschaffungsdatum: "2020-01-01",
    });
    const plan = planAbgang(anlage, {
      abgangsdatum: "2025-06-30",
      erloes_brutto: 500,
      ust_satz: 0,
    });
    expect(plan.lines.some((l) => l.rolle === "ust")).toBe(false);
    expect(plan.erloes_netto).toBe(500);
    expect(plan.erloes_ust).toBe(0);
  });
});

describe("planAbgang — Abgang im Anschaffungsjahr", () => {
  it("Kauf und Verkauf im selben Jahr → Teil-AfA nur für Besitz-Monate", () => {
    // Kauf März 2025, Verkauf August 2025 → 6 Monate AfA (Mär-Aug).
    // AK 6000, ND 5 → Monats-AfA = 100. Teil-AfA = 6 * 100 = 600. RBW = 5400.
    const anlage = makeAnlage({
      anschaffungskosten: 6000,
      nutzungsdauer_jahre: 5,
      anschaffungsdatum: "2025-03-15",
    });
    const plan = planAbgang(anlage, {
      abgangsdatum: "2025-08-31",
      erloes_brutto: 0,
      ust_satz: 0,
    });
    expect(plan.teil_afa_betrag).toBeCloseTo(600, 2);
    expect(plan.restbuchwert_am_abgang).toBeCloseTo(5400, 2);
    expect(plan.ist_verschrottung).toBe(true);
    // Teil-AfA + Verlust (RBW)
    expect(plan.lines).toHaveLength(2);
  });
});

describe("planAbgang — Input-Validierung", () => {
  it("inaktive Anlage → Fehler", () => {
    const anlage = makeAnlage({ aktiv: false });
    expect(() =>
      planAbgang(anlage, {
        abgangsdatum: "2025-06-30",
        erloes_brutto: 100,
        ust_satz: 19,
      })
    ).toThrow(/bereits abgegangen/);
  });

  it("Anlage mit bestehendem Abgangsdatum → Fehler", () => {
    const anlage = makeAnlage({ abgangsdatum: "2024-12-31" });
    expect(() =>
      planAbgang(anlage, {
        abgangsdatum: "2025-06-30",
        erloes_brutto: 100,
        ust_satz: 19,
      })
    ).toThrow(/Abgangsdatum/);
  });

  it("Abgangsdatum vor Anschaffung → Fehler", () => {
    const anlage = makeAnlage({ anschaffungsdatum: "2023-01-01" });
    expect(() =>
      planAbgang(anlage, {
        abgangsdatum: "2022-06-30",
        erloes_brutto: 0,
        ust_satz: 0,
      })
    ).toThrow(/liegt vor/);
  });

  it("Indirekte Brutto-Methode: Abgang erzeugt zusätzliche Auflösungs-Zeile für kumulierte AfA (Sprint 6 Teil 2b)", () => {
    // AK 2400, ND 10, Kauf 01.01.2020 → Monats-AfA 20, Jahres-AfA 240.
    // Indirekte Methode bucht AfA auf 0480 (kum). Abgang 30.06.2025:
    // Teil-AfA 120 (6 Mon) → läuft jetzt auf 0480, nicht auf 0440.
    // Kumulierte AfA gesamt = 5×240 + 120 = 1320. Auflösungs-Zeile
    // bucht 0480 soll / 0440 haben 1320, dann bleibt 0440 mit RBW 1080
    // zum Erlös-/Gewinn-/Verlust-Ausgleich.
    const anlage = makeAnlage({
      konto_anlage: "0440",
      konto_afa: "4830",
      konto_abschreibung_kumuliert: "0480",
      anschaffungskosten: 2400,
      nutzungsdauer_jahre: 10,
      anschaffungsdatum: "2020-01-01",
    });
    const plan = planAbgang(anlage, {
      abgangsdatum: "2025-06-30",
      erloes_brutto: 1428,
      ust_satz: 19,
    });
    expect(plan.teil_afa_betrag).toBeCloseTo(120, 2);
    expect(plan.restbuchwert_am_abgang).toBeCloseTo(1080, 2);

    // Teil-AfA-Zeile: Haben = 0480 (Wertberichtigung), nicht 0440
    const teilAfa = plan.lines.find((l) => l.rolle === "teil_afa");
    expect(teilAfa?.haben_konto).toBe("0480");

    // Neue Auflösungs-Zeile
    const aufloesung = plan.lines.find((l) => l.rolle === "aufloesung_kum");
    expect(aufloesung).toBeDefined();
    expect(aufloesung!.soll_konto).toBe("0480");
    expect(aufloesung!.haben_konto).toBe("0440");
    // Kumulierte AfA vor Abgang = 2400 - 1080 = 1320 (inkl. Teil-AfA)
    expect(aufloesung!.betrag).toBeCloseTo(1320, 2);
  });

  it("Ungültiger USt-Satz → Fehler", () => {
    const anlage = makeAnlage();
    expect(() =>
      planAbgang(anlage, {
        abgangsdatum: "2025-06-30",
        erloes_brutto: 100,
        ust_satz: 16 as unknown as number,
      })
    ).toThrow(/USt-Satz/);
  });

  it("GWG-Abgang: Teil-AfA 0, RBW 0 — nur Erlös + ggf. Gewinn + USt", () => {
    const anlage = makeAnlage({
      afa_methode: "gwg_sofort",
      konto_anlage: "0480",
      konto_afa: "4840",
      anschaffungsdatum: "2024-04-01",
      anschaffungskosten: 450,
      nutzungsdauer_jahre: 1,
    });
    // Verkauf 2025 für 119 € brutto (100 netto, 19 € USt). RBW ist 0,
    // also reiner Gewinn von 100 € auf 2700.
    const plan = planAbgang(anlage, {
      abgangsdatum: "2025-06-30",
      erloes_brutto: 119,
      ust_satz: 19,
    });
    expect(plan.teil_afa_betrag).toBe(0);
    expect(plan.restbuchwert_am_abgang).toBe(0);
    expect(plan.erloes_netto).toBeCloseTo(100, 2);
    expect(plan.gewinn_verlust).toBeCloseTo(100, 2);
    // Keine Teil-AfA-Zeile, keine Erlös-bis-RBW-Zeile (RBW=0),
    // nur Gewinn + USt
    expect(plan.lines.some((l) => l.rolle === "teil_afa")).toBe(false);
    expect(plan.lines.some((l) => l.rolle === "gewinn")).toBe(true);
    expect(plan.lines.some((l) => l.rolle === "ust")).toBe(true);
  });
});

// --- Phase 4 Integration: Indirekte Methode mit Gewinn + Verlust ---------

describe("planAbgang — Indirekte Brutto-Methode (Phase 4)", () => {
  it("Indirekte Methode mit Gewinn: kumulierte AfA wird auf Wertberichtigungs-Konto aufgelöst", () => {
    // AK 2400, ND 10, Kauf 01.01.2020, konto_anlage=0440, kum=0480.
    // Abgang 30.06.2025 für 1.428 € brutto (netto 1200, USt 228).
    // RBW = 1080, Gewinn = 120.
    const anlage = makeAnlage({
      konto_anlage: "0440",
      konto_afa: "4830",
      konto_abschreibung_kumuliert: "0480",
      anschaffungskosten: 2400,
      nutzungsdauer_jahre: 10,
      anschaffungsdatum: "2020-01-01",
    });
    const plan = planAbgang(anlage, {
      abgangsdatum: "2025-06-30",
      erloes_brutto: 1428,
      ust_satz: 19,
    });

    // Ordnung der Zeilen: teil_afa, aufloesung_kum, erloes, gewinn, ust
    const rollen = plan.lines.map((l) => l.rolle);
    expect(rollen).toEqual([
      "teil_afa",
      "aufloesung_kum",
      "erloes",
      "gewinn",
      "ust",
    ]);

    // Soll/Haben-Check jeder Zeile
    const byRolle = Object.fromEntries(plan.lines.map((l) => [l.rolle, l]));
    expect(byRolle.teil_afa).toMatchObject({
      soll_konto: "4830",
      haben_konto: "0480", // Wertberichtigung, nicht Anlage-Konto
      betrag: 120,
    });
    expect(byRolle.aufloesung_kum).toMatchObject({
      soll_konto: "0480",
      haben_konto: "0440",
      betrag: 1320,
    });
    expect(byRolle.erloes).toMatchObject({
      soll_konto: "1200",
      haben_konto: "0440",
      betrag: 1080,
    });
    expect(byRolle.gewinn).toMatchObject({
      soll_konto: "1200",
      haben_konto: "2700",
      betrag: 120,
    });
    expect(byRolle.ust).toMatchObject({
      soll_konto: "1200",
      haben_konto: "1776",
    });

    // Sum-Check: Saldo-Änderung 0440 = -AK (1320 + 1080 = 2400 Haben)
    const sumHaben0440 = plan.lines
      .filter((l) => l.haben_konto === "0440")
      .reduce((s, l) => s + l.betrag, 0);
    expect(sumHaben0440).toBeCloseTo(2400, 2);

    // Saldo-Änderung 0480 = 0 (1320 soll, 120 haben = 1200 Netto? Nein:
    // Teil-AfA buchte +120 auf haben, Auflösung bucht -1320 auf soll.
    // Gesamtveränderung am Konto = haben(120) − soll(1320) = −1200.
    // Kombiniert mit den bestehenden Vorjahr-Afa-Buchungen (5*240=1200
    // Haben) ergibt sich Endsaldo 0.)
    const sollKum = plan.lines
      .filter((l) => l.soll_konto === "0480")
      .reduce((s, l) => s + l.betrag, 0);
    const habenKum = plan.lines
      .filter((l) => l.haben_konto === "0480")
      .reduce((s, l) => s + l.betrag, 0);
    expect(sollKum - habenKum).toBeCloseTo(1200, 2); // entspricht Vorjahr-AfA
  });

  it("Indirekte Methode mit Verlust: Verlust-Zeile bucht gegen konto_anlage, nicht Wertberichtigung", () => {
    // AK 2400, ND 10, Kauf 01.01.2020, indirekte Methode. Abgang
    // 30.06.2025 für 952 € brutto (800 netto). RBW 1080, Verlust 280.
    const anlage = makeAnlage({
      konto_anlage: "0440",
      konto_abschreibung_kumuliert: "0480",
      anschaffungskosten: 2400,
      nutzungsdauer_jahre: 10,
      anschaffungsdatum: "2020-01-01",
    });
    const plan = planAbgang(anlage, {
      abgangsdatum: "2025-06-30",
      erloes_brutto: 952,
      ust_satz: 19,
    });
    const verlust = plan.lines.find((l) => l.rolle === "verlust");
    expect(verlust).toBeDefined();
    expect(verlust!.soll_konto).toBe("2800");
    expect(verlust!.haben_konto).toBe("0440");
    expect(verlust!.betrag).toBeCloseTo(280, 2);

    // Auflösungs-Zeile verbleibt konstant (kum AfA = AK − RBW = 1320)
    const aufloesung = plan.lines.find((l) => l.rolle === "aufloesung_kum");
    expect(aufloesung!.betrag).toBeCloseTo(1320, 2);
  });

  it("Direkte Methode: keine Auflösungs-Zeile (Regression-Check)", () => {
    const anlage = makeAnlage({
      konto_anlage: "0440",
      konto_abschreibung_kumuliert: null, // direkte Methode
      anschaffungskosten: 2400,
      nutzungsdauer_jahre: 10,
      anschaffungsdatum: "2020-01-01",
    });
    const plan = planAbgang(anlage, {
      abgangsdatum: "2025-06-30",
      erloes_brutto: 1428,
      ust_satz: 19,
    });
    expect(plan.lines.some((l) => l.rolle === "aufloesung_kum")).toBe(false);
    // Teil-AfA bucht gegen konto_anlage (direkt)
    const teilAfa = plan.lines.find((l) => l.rolle === "teil_afa");
    expect(teilAfa?.haben_konto).toBe("0440");
  });
});

// --- buchtAbgang: Integration --------------------------------------------

describe("buchtAbgang — DEMO-Mode Integration", () => {
  it("erzeugt Journal-Einträge + afa_buchungen-Eintrag + deaktiviert Anlage", async () => {
    const { anlage } = await createAnlageWithOpening(
      {
        inventar_nr: "INV-INT-001",
        bezeichnung: "Abgangs-Test-Gerät",
        anschaffungsdatum: "2020-01-01",
        anschaffungskosten: 2400,
        nutzungsdauer_jahre: 10,
        afa_methode: "linear",
        konto_anlage: "0440",
        konto_afa: "4830",
      },
      {},
      null
    );
    const plan = planAbgang(anlage, {
      abgangsdatum: "2025-06-30",
      erloes_brutto: 1428,
      ust_satz: 19,
    });
    const res = await buchtAbgang(plan, null);
    expect(res.journalEntries.length).toBe(4);

    // afa_buchungen: Teil-AfA 2025 dokumentiert
    const afaBuchungen = store.getAfaBuchungen();
    expect(afaBuchungen).toHaveLength(1);
    expect(afaBuchungen[0].jahr).toBe(2025);
    expect(afaBuchungen[0].afa_betrag).toBeCloseTo(120, 2);

    // Anlage aktiv=false + abgangsdatum + abgangserloes gesetzt
    const updated = store.getAnlagegueter().find((a) => a.id === anlage.id)!;
    expect(updated.aktiv).toBe(false);
    expect(updated.abgangsdatum).toBe("2025-06-30");
    expect(updated.abgangserloes).toBe(1428);
  });
});
