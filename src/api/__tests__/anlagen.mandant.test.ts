// Multi-Tenancy Phase 1 / Schritt 2a · anlagen.ts mit client_id-Filter.
//
// DEMO-Pfad-Tests (vitest-Env ist DEMO_MODE per Default).

import { describe, it, expect, beforeEach, vi } from "vitest";
import { createAnlagegut, fetchAnlagegueter } from "../anlagen";
import { store } from "../store";
import type { Anlagegut, AfaMethode } from "../../types/db";

type AnlagegutInputShape = Parameters<typeof createAnlagegut>[0];

function baseInput(inventar_nr: string): AnlagegutInputShape {
  return {
    inventar_nr,
    bezeichnung: `Testgerät ${inventar_nr}`,
    anschaffungsdatum: "2025-01-15",
    anschaffungskosten: 1200,
    nutzungsdauer_jahre: 5,
    afa_methode: "linear" as AfaMethode,
    konto_anlage: "0440",
    konto_afa: "4830",
  };
}

describe("anlagen · client_id-Filter", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("fetchAnlagegueter(clientId='X') liefert nur Anlagen des Mandanten (DEMO)", async () => {
    await createAnlagegut(baseInput("INV-A1"), "client-A");
    await createAnlagegut(baseInput("INV-B1"), "client-B");
    await createAnlagegut(baseInput("INV-A2"), "client-A");

    const onlyA = await fetchAnlagegueter("client-A");
    expect(onlyA).toHaveLength(2);
    expect(onlyA.every((a) => a.client_id === "client-A")).toBe(true);
    expect(onlyA.map((a) => a.inventar_nr).sort()).toEqual([
      "INV-A1",
      "INV-A2",
    ]);

    const onlyB = await fetchAnlagegueter("client-B");
    expect(onlyB).toHaveLength(1);
    expect(onlyB[0].inventar_nr).toBe("INV-B1");

    // clientId=null ist Kanzlei-Übersicht — alle Anlagen.
    const all = await fetchAnlagegueter(null);
    expect(all).toHaveLength(3);
  });

  it("createAnlagegut(input, clientId='X') schreibt client_id='X' in die Row (DEMO)", async () => {
    const anlage = await createAnlagegut(baseInput("INV-010"), "client-kuehn");
    expect(anlage.client_id).toBe("client-kuehn");

    const rows = store.getAnlagegueter();
    expect(rows).toHaveLength(1);
    expect(rows[0].client_id).toBe("client-kuehn");
    expect(rows[0].inventar_nr).toBe("INV-010");
  });

  it("Legacy-Row ohne client_id wird unfiltriert mitgeliefert + Console-Warn (DEMO)", async () => {
    const legacy: Anlagegut = {
      id: "legacy-anlage-1",
      company_id: null,
      inventar_nr: "LEGACY-001",
      bezeichnung: "Altbestand",
      anschaffungsdatum: "2022-06-01",
      anschaffungskosten: 5000,
      nutzungsdauer_jahre: 5,
      afa_methode: "linear",
      konto_anlage: "0440",
      konto_afa: "4830",
      konto_abschreibung_kumuliert: null,
      aktiv: true,
      abgangsdatum: null,
      abgangserloes: null,
      notizen: null,
      parent_id: null,
      created_at: "2022-06-01T00:00:00Z",
      updated_at: "2022-06-01T00:00:00Z",
    };
    // client_id explizit entfernen → simuliert Altbestand VOR Migration 0026.
    delete (legacy as Partial<Anlagegut>).client_id;
    store.setAnlagegueter([legacy]);

    const warnSpy = vi
      .spyOn(console, "warn")
      .mockImplementation(() => {});
    const rows = await fetchAnlagegueter("client-X");
    expect(rows).toHaveLength(1);
    expect(rows[0].id).toBe("legacy-anlage-1");
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining("legacy-row without client_id")
    );
    warnSpy.mockRestore();
  });
});
