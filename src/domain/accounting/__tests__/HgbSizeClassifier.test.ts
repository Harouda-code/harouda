// Jahresabschluss-E1 / Schritt 2 · HgbSizeClassifier-Tests.

import { describe, it, expect } from "vitest";
import {
  classifyHgb267,
  HGB267_SCHWELLENWERTE_2025,
} from "../HgbSizeClassifier";

describe("classifyHgb267 · § 267 HGB Größenklassen-Klassifikator", () => {
  it("kleinst: alle 3 unter Kleinst-Schwellen", () => {
    const r = classifyHgb267({
      bilanzsumme: 100_000,
      umsatzerloese: 200_000,
      arbeitnehmer_durchschnitt: 3,
    });
    expect(r.klasse).toBe("kleinst");
    expect(r.erfuellte_kriterien).toBe(3);
    expect(r.gilt_als_erfuellt).toBe(true);
    expect(r.begruendung[0]).toMatch(/Kleinst/);
  });

  it("klein: alle 3 zwischen kleinst und klein", () => {
    const r = classifyHgb267({
      bilanzsumme: 3_000_000,
      umsatzerloese: 8_000_000,
      arbeitnehmer_durchschnitt: 25,
    });
    expect(r.klasse).toBe("klein");
    expect(r.erfuellte_kriterien).toBe(3);
    expect(r.begruendung[0]).toMatch(/Klein/);
  });

  it("mittel: alle 3 zwischen klein und mittel", () => {
    const r = classifyHgb267({
      bilanzsumme: 15_000_000,
      umsatzerloese: 30_000_000,
      arbeitnehmer_durchschnitt: 150,
    });
    expect(r.klasse).toBe("mittel");
    expect(r.erfuellte_kriterien).toBe(3);
  });

  it("gross: alle 3 über mittel", () => {
    const r = classifyHgb267({
      bilanzsumme: 50_000_000,
      umsatzerloese: 100_000_000,
      arbeitnehmer_durchschnitt: 500,
    });
    expect(r.klasse).toBe("gross");
    expect(r.begruendung[0]).toMatch(/Groß/);
  });

  it("mixed: 2 aus 3 = klein → Klassifikation klein", () => {
    // Bilanzsumme + Arbeitnehmer unter Klein-Schwelle; Umsatz darüber.
    const r = classifyHgb267({
      bilanzsumme: 5_000_000,
      umsatzerloese: 20_000_000,
      arbeitnehmer_durchschnitt: 40,
    });
    expect(r.klasse).toBe("klein");
    expect(r.erfuellte_kriterien).toBe(2);
    expect(r.gilt_als_erfuellt).toBe(true);
  });

  it("edge: genau auf der Klein-Schwelle (≤-Semantik)", () => {
    const r = classifyHgb267({
      bilanzsumme: HGB267_SCHWELLENWERTE_2025.klein.bilanzsumme,
      umsatzerloese: HGB267_SCHWELLENWERTE_2025.klein.umsatzerloese,
      arbeitnehmer_durchschnitt:
        HGB267_SCHWELLENWERTE_2025.klein.arbeitnehmer_durchschnitt,
    });
    expect(r.klasse).toBe("klein");
  });

  it("0-Werte: klasse = kleinst", () => {
    const r = classifyHgb267({
      bilanzsumme: 0,
      umsatzerloese: 0,
      arbeitnehmer_durchschnitt: 0,
    });
    expect(r.klasse).toBe("kleinst");
    expect(r.erfuellte_kriterien).toBe(3);
  });

  it("negative Bilanzsumme (bilanzielle Überschuldung): wirft NICHT, klassifiziert als kleinst", () => {
    const r = classifyHgb267({
      bilanzsumme: -50_000,
      umsatzerloese: 100_000,
      arbeitnehmer_durchschnitt: 2,
    });
    expect(r.klasse).toBe("kleinst");
    expect(r.erfuellte_kriterien).toBe(3);
  });

  it("Mittel-Klassifikation mit gemischten Kriterien (2/3)", () => {
    const r = classifyHgb267({
      bilanzsumme: 20_000_000,
      umsatzerloese: 60_000_000, // ÜBER mittel
      arbeitnehmer_durchschnitt: 200,
    });
    expect(r.klasse).toBe("mittel");
    expect(r.erfuellte_kriterien).toBe(2);
  });
});
