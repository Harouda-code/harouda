// Jahresabschluss-E4 / Schritt 2 · HGB-Taxonomie-Multi-Version-Tests.

import { describe, it, expect, vi, afterEach } from "vitest";
import {
  HGB_TAXONOMIE_VERSIONEN,
  pickTaxonomieFuerStichtag,
  getTaxonomieMetadata,
} from "../hgbTaxonomie";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("HGB-Taxonomie-Multi-Version", () => {
  it("#1 HGB_TAXONOMIE_VERSIONEN hat 4 Eintraege 6.6/6.7/6.8/6.9", () => {
    expect(Object.keys(HGB_TAXONOMIE_VERSIONEN).sort()).toEqual([
      "6.6",
      "6.7",
      "6.8",
      "6.9",
    ]);
    for (const v of Object.values(HGB_TAXONOMIE_VERSIONEN)) {
      expect(v.version).toMatch(/^6\.\d$/);
      expect(v.veroeffentlicht).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(v.gueltig_ab_stichtag).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(["stable", "deprecated", "future"]).toContain(v.status);
    }
  });

  it("#2 Stichtag 2023-06-30 -> 6.6", () => {
    expect(pickTaxonomieFuerStichtag("2023-06-30")).toBe("6.6");
  });

  it("#3 Stichtag 2024-12-31 -> 6.7", () => {
    expect(pickTaxonomieFuerStichtag("2024-12-31")).toBe("6.7");
  });

  it("#4 Stichtag 2025-12-31 -> 6.8", () => {
    expect(pickTaxonomieFuerStichtag("2025-12-31")).toBe("6.8");
  });

  it("#5 Stichtag 2026-06-30 -> 6.8 + console.warn (6.9 noch future)", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    expect(pickTaxonomieFuerStichtag("2026-06-30")).toBe("6.8");
    expect(warn).toHaveBeenCalled();
    expect(warn.mock.calls[0][0]).toContain("6.9");
  });

  it("#6 Stichtag 2020-12-31 (vor Support) -> 6.8 + console.warn", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    expect(pickTaxonomieFuerStichtag("2020-12-31")).toBe("6.8");
    expect(warn).toHaveBeenCalled();
  });

  it("#7 getTaxonomieMetadata: liefert vollstaendige Metadata mit BMF-Quelle", () => {
    const m = getTaxonomieMetadata("6.8");
    expect(m.version).toBe("6.8");
    expect(m.status).toBe("stable");
    expect(m.bmf_quelle_url).toContain("bundesfinanzministerium.de");
  });

  it("#8 Ungueltiger Stichtag -> 6.8 + console.warn", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    expect(pickTaxonomieFuerStichtag("not-a-date")).toBe("6.8");
    expect(warn).toHaveBeenCalled();
  });
});
