// Sprint 17.5 / Schritt 1 · Erlaeuterungs-Phrasen-Tests.

import { describe, it, expect } from "vitest";
import {
  ERLAEUTERUNGS_PHRASEN,
  getErlaeuterungsPhraseById,
  getErlaeuterungsPhrasen,
} from "../erlaeuterungsPhrasen";

describe("ERLAEUTERUNGS_PHRASEN", () => {
  it("#1 Liste enthaelt exakt 4 Phrasen mit eindeutigen IDs", () => {
    expect(ERLAEUTERUNGS_PHRASEN).toHaveLength(4);
    const ids = ERLAEUTERUNGS_PHRASEN.map((p) => p.id);
    expect(new Set(ids).size).toBe(4);
    expect(ids).toEqual([
      "umsatzerloese_entwicklung",
      "ergebnissituation",
      "besondere_ereignisse",
      "ausblick",
    ]);
  });

  it("#2 Jede Phrase hat id/label/text/version_stand non-empty", () => {
    for (const p of ERLAEUTERUNGS_PHRASEN) {
      expect(p.id).toMatch(/^[a-z_]+$/);
      expect(p.label.length).toBeGreaterThan(2);
      expect(p.text.length).toBeGreaterThan(20);
      expect(p.version_stand).toMatch(/^\d{4}-\d{2}$/);
    }
  });

  it("#3 Object.freeze verhindert Mutation (Laufzeit-Check)", () => {
    // Array selbst ist frozen.
    expect(Object.isFrozen(ERLAEUTERUNGS_PHRASEN)).toBe(true);
    // Erstes Element ist frozen.
    expect(Object.isFrozen(ERLAEUTERUNGS_PHRASEN[0])).toBe(true);
    // Mutations-Versuch in non-strict-Mode ist silent no-op —
    // wir testen direkt das Freeze-Flag.
    const first = ERLAEUTERUNGS_PHRASEN[0] as unknown as Record<string, unknown>;
    expect(() => {
      "use strict";
      first.label = "HACKED";
    }).toThrow();
  });

  it("#4 getErlaeuterungsPhrasen liefert die gleiche Referenz", () => {
    expect(getErlaeuterungsPhrasen()).toBe(ERLAEUTERUNGS_PHRASEN);
  });

  it("#5 getErlaeuterungsPhraseById: Treffer + Miss", () => {
    const hit = getErlaeuterungsPhraseById("ausblick");
    expect(hit).toBeDefined();
    expect(hit!.label).toBe("Ausblick");
    expect(getErlaeuterungsPhraseById("not-exist")).toBeUndefined();
  });
});
