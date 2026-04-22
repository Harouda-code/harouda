// Nacht-Modus (2026-04-21) · Schritt 1 — avVertraegeStore-Tests.

import { describe, it, expect, beforeEach } from "vitest";
import {
  loadAvVertraege,
  saveAvVertraege,
  addAvVertrag,
  removeAvVertrag,
  __internals,
} from "../avVertraegeStore";

beforeEach(() => {
  localStorage.clear();
});

describe("avVertraegeStore", () => {
  it("leerer Fallback: loadAvVertraege liefert [] bei fehlendem Eintrag", () => {
    expect(loadAvVertraege("c-A")).toEqual([]);
  });

  it("CRUD: add → load → remove → load", () => {
    const neu = addAvVertrag("c-A", {
      anbieter: "Allianz",
      vertragsnummer: "ALV-12345",
      vertragstyp: "riester",
      ehepartner_referenz: false,
    });
    expect(neu.id).toMatch(/.+/);
    expect(neu.erfasst_am).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    const after = loadAvVertraege("c-A");
    expect(after).toHaveLength(1);
    expect(after[0].anbieter).toBe("Allianz");
    removeAvVertrag("c-A", neu.id);
    expect(loadAvVertraege("c-A")).toEqual([]);
  });

  it("Mandant-Isolation: Vertraege von A nicht bei B sichtbar", () => {
    addAvVertrag("c-A", {
      anbieter: "Allianz",
      vertragsnummer: "A-1",
      vertragstyp: "riester",
      ehepartner_referenz: false,
    });
    addAvVertrag("c-B", {
      anbieter: "ERGO",
      vertragsnummer: "B-1",
      vertragstyp: "ruerup",
      ehepartner_referenz: false,
    });
    const aVertraege = loadAvVertraege("c-A");
    const bVertraege = loadAvVertraege("c-B");
    expect(aVertraege).toHaveLength(1);
    expect(aVertraege[0].anbieter).toBe("Allianz");
    expect(bVertraege).toHaveLength(1);
    expect(bVertraege[0].anbieter).toBe("ERGO");
  });

  it("Jahr-Unabhaengigkeit: Key enthaelt kein Jahr, Daten bleiben konstant", () => {
    addAvVertrag("c-A", {
      anbieter: "Allianz",
      vertragsnummer: "ALV-1",
      vertragstyp: "riester",
      ehepartner_referenz: false,
    });
    // Der Key darf kein Jahr enthalten — nur mandantId.
    expect(__internals.keyFor("c-A")).toBe("harouda:av-vertraege:c-A");
    // Und genau EIN Key liegt im Storage.
    const keys = Object.keys(localStorage).filter((k) =>
      k.startsWith("harouda:av-vertraege:")
    );
    expect(keys).toEqual(["harouda:av-vertraege:c-A"]);
  });

  it("ungueltige MandantId: null wirft", () => {
    expect(() => loadAvVertraege(null)).toThrow(/Mandant/);
    expect(() =>
      addAvVertrag(null, {
        anbieter: "X",
        vertragsnummer: "1",
        vertragstyp: "riester",
        ehepartner_referenz: false,
      })
    ).toThrow(/Mandant/);
    expect(() => saveAvVertraege(null, [])).toThrow(/Mandant/);
    expect(() => removeAvVertrag(null, "id")).toThrow(/Mandant/);
  });

  it("JSON-Parse-Fehler-Safety: korrupter Storage → leere Liste", () => {
    localStorage.setItem("harouda:av-vertraege:c-A", "{not-valid-json");
    expect(loadAvVertraege("c-A")).toEqual([]);
  });

  it("Non-Array-Payload: liefert ebenfalls leere Liste (defensiv)", () => {
    localStorage.setItem(
      "harouda:av-vertraege:c-A",
      JSON.stringify({ foo: "bar" })
    );
    expect(loadAvVertraege("c-A")).toEqual([]);
  });

  it("saveAvVertraege direkt schreibt + load liest zurueck (Roundtrip)", () => {
    saveAvVertraege("c-A", [
      {
        id: "v-1",
        anbieter: "Custom",
        vertragsnummer: "XYZ",
        vertragstyp: "sonstige-av",
        ehepartner_referenz: true,
        erfasst_am: "2024-05-10T10:00:00.000Z",
      },
    ]);
    const loaded = loadAvVertraege("c-A");
    expect(loaded).toHaveLength(1);
    expect(loaded[0].ehepartner_referenz).toBe(true);
    expect(loaded[0].vertragstyp).toBe("sonstige-av");
  });
});
