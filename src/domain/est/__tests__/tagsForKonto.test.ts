// Phase 3 / Schritt 6 · tagsForKonto-Helper-Tests.

import { describe, it, expect } from "vitest";
import { tagsForKonto, allPossibleTags } from "../tagsForKonto";

describe("tagsForKonto", () => {
  it("4110 (Personal) → G+S personal", () => {
    expect(tagsForKonto("4110")).toEqual([
      "anlage-g:personal",
      "anlage-s:personal",
    ]);
  });

  it("8400 (Umsatz 19%) → G:umsaetze + S:honorare", () => {
    expect(tagsForKonto("8400")).toEqual([
      "anlage-g:umsaetze",
      "anlage-s:honorare",
    ]);
  });

  it("1200 (Bank) → leeres Array (keine ESt-Zuordnung)", () => {
    expect(tagsForKonto("1200")).toEqual([]);
  });

  it("Nicht-numerische Kontonummer → leeres Array", () => {
    expect(tagsForKonto("ABC")).toEqual([]);
    expect(tagsForKonto("")).toEqual([]);
  });

  it("Idempotenz: zweifacher Aufruf liefert identisches Ergebnis", () => {
    const first = tagsForKonto("4210");
    const second = tagsForKonto("4210");
    expect(first).toEqual(second);
    expect(first).toEqual(["anlage-g:raum", "anlage-s:raum"]);
  });

  it("Konto mit G-only-Mapping (4650 Bewirtung)", () => {
    expect(tagsForKonto("4650")).toEqual(["anlage-g:bewirtung"]);
  });

  it("Konto mit S-only-Mapping (4660 Reisekosten)", () => {
    expect(tagsForKonto("4660")).toEqual(["anlage-s:reisen"]);
  });

  it("allPossibleTags: liefert deduplizierte Liste aller Tag-Werte", () => {
    const all = allPossibleTags();
    expect(all.length).toBeGreaterThan(0);
    // Alle starten mit "anlage-g:" oder "anlage-s:".
    for (const t of all) {
      expect(t.startsWith("anlage-g:") || t.startsWith("anlage-s:")).toBe(true);
    }
    // Keine Duplikate.
    expect(new Set(all).size).toBe(all.length);
    // Sortiert aufsteigend.
    const sorted = [...all].sort();
    expect(all).toEqual(sorted);
  });
});
