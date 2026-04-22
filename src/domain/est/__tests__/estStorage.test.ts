// Multi-Tenancy Phase 1 / Schritt 3 · estStorage-Helper-Tests.
// Phase 3 / Schritt 3 · Year-Scope (V3) ergänzt.

import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  buildEstStorageKey,
  migrateEstFormsV1ToV2,
  migrateEstFormsV2ToV3,
  readEstForm,
  removeEstForm,
  writeEstForm,
} from "../estStorage";

const SELECTED = "harouda:selectedMandantId";
const FLAG = "harouda:est-migrated-v2";

describe("estStorage · buildEstStorageKey (V3)", () => {
  beforeEach(() => localStorage.clear());

  it("erzeugt den V3-Key in der Form 'harouda:est:<mandantId>:<jahr>:<formId>'", () => {
    expect(buildEstStorageKey("anlage-n", "c-kuehn", 2025)).toBe(
      "harouda:est:c-kuehn:2025:anlage-n"
    );
  });

  it("wirft, wenn kein Mandant übergeben wird (null)", () => {
    expect(() => buildEstStorageKey("anlage-n", null, 2025)).toThrow(
      /Mandant/
    );
  });

  it("wirft, wenn Mandant leerer String ist", () => {
    expect(() => buildEstStorageKey("anlage-n", "", 2025)).toThrow(/Mandant/);
  });

  it("wirft, wenn Jahr ungültig (< 2000)", () => {
    expect(() => buildEstStorageKey("anlage-n", "c-1", 1999)).toThrow(
      /Jahr/
    );
  });

  it("wirft, wenn Jahr ungültig (> 2100)", () => {
    expect(() => buildEstStorageKey("anlage-n", "c-1", 2101)).toThrow(
      /Jahr/
    );
  });

  it("wirft, wenn Jahr keine Ganzzahl", () => {
    expect(() => buildEstStorageKey("anlage-n", "c-1", 2025.5)).toThrow(
      /Jahr/
    );
  });
});

describe("estStorage · read/write/remove (V3)", () => {
  beforeEach(() => localStorage.clear());

  it("readEstForm gibt null zurück, wenn kein Eintrag existiert", () => {
    expect(readEstForm("anlage-n", "c-1", 2025)).toBeNull();
  });

  it("writeEstForm + readEstForm Roundtrip (jahr-scoped)", () => {
    writeEstForm("anlage-n", "c-1", 2025, { bruttoLohn: 42000 });
    expect(
      readEstForm<{ bruttoLohn: number }>("anlage-n", "c-1", 2025)
    ).toEqual({ bruttoLohn: 42000 });
  });

  it("readEstForm gibt null bei korruptem JSON", () => {
    localStorage.setItem(
      "harouda:est:c-1:2025:anlage-n",
      "{not-valid-json"
    );
    expect(readEstForm("anlage-n", "c-1", 2025)).toBeNull();
  });

  it("removeEstForm entfernt den V3-Key", () => {
    writeEstForm("anlage-n", "c-1", 2025, { bruttoLohn: 1 });
    removeEstForm("anlage-n", "c-1", 2025);
    expect(readEstForm("anlage-n", "c-1", 2025)).toBeNull();
  });

  it("Mandant-Trennung: derselbe formId+jahr unter zwei Mandanten getrennt", () => {
    writeEstForm("anlage-n", "c-A", 2025, { bruttoLohn: 100 });
    writeEstForm("anlage-n", "c-B", 2025, { bruttoLohn: 200 });
    expect(
      readEstForm<{ bruttoLohn: number }>("anlage-n", "c-A", 2025)
    ).toEqual({ bruttoLohn: 100 });
    expect(
      readEstForm<{ bruttoLohn: number }>("anlage-n", "c-B", 2025)
    ).toEqual({ bruttoLohn: 200 });
  });

  it("Jahr-Trennung: derselbe mandantId+formId unter zwei Jahren getrennt", () => {
    writeEstForm("anlage-n", "c-A", 2024, { bruttoLohn: 40000 });
    writeEstForm("anlage-n", "c-A", 2025, { bruttoLohn: 45000 });
    expect(
      readEstForm<{ bruttoLohn: number }>("anlage-n", "c-A", 2024)
    ).toEqual({ bruttoLohn: 40000 });
    expect(
      readEstForm<{ bruttoLohn: number }>("anlage-n", "c-A", 2025)
    ).toEqual({ bruttoLohn: 45000 });
  });

  it("2×2-Isolation: (A,2024) (A,2025) (B,2024) (B,2025) sind 4 getrennte Slots", () => {
    writeEstForm("anlage-n", "c-A", 2024, { v: "A-2024" });
    writeEstForm("anlage-n", "c-A", 2025, { v: "A-2025" });
    writeEstForm("anlage-n", "c-B", 2024, { v: "B-2024" });
    writeEstForm("anlage-n", "c-B", 2025, { v: "B-2025" });
    expect(readEstForm<{ v: string }>("anlage-n", "c-A", 2024)).toEqual({
      v: "A-2024",
    });
    expect(readEstForm<{ v: string }>("anlage-n", "c-A", 2025)).toEqual({
      v: "A-2025",
    });
    expect(readEstForm<{ v: string }>("anlage-n", "c-B", 2024)).toEqual({
      v: "B-2024",
    });
    expect(readEstForm<{ v: string }>("anlage-n", "c-B", 2025)).toEqual({
      v: "B-2025",
    });
  });

  it("V2-Fallback: readEstForm liefert V2-Daten, wenn V3-Key noch leer ist", () => {
    // Legacy: vor der Phase-3-Migration geschriebener V2-Key.
    localStorage.setItem(
      "harouda:est:c-1:anlage-n",
      JSON.stringify({ legacyBrutto: 40000 })
    );
    // V3-Key für 2025 existiert noch nicht → Fallback greift.
    expect(
      readEstForm<{ legacyBrutto: number }>("anlage-n", "c-1", 2025)
    ).toEqual({ legacyBrutto: 40000 });
  });

  it("V2-Fallback: V3 hat Vorrang vor V2, wenn beide existieren", () => {
    localStorage.setItem(
      "harouda:est:c-1:anlage-n",
      JSON.stringify({ legacy: true })
    );
    writeEstForm("anlage-n", "c-1", 2025, { v3: true });
    expect(readEstForm("anlage-n", "c-1", 2025)).toEqual({ v3: true });
  });
});

describe("estStorage · migrateEstFormsV2ToV3", () => {
  beforeEach(() => localStorage.clear());

  it("no-op, wenn V2-Key nicht existiert", () => {
    const res = migrateEstFormsV2ToV3("anlage-n", "c-1", 2025);
    expect(res.migrated).toBe(false);
    expect(res.reason).toBe("no-v2-data");
  });

  it("no-op bei mandantId=null", () => {
    localStorage.setItem(
      "harouda:est:c-1:anlage-n",
      JSON.stringify({ x: 1 })
    );
    const res = migrateEstFormsV2ToV3("anlage-n", null, 2025);
    expect(res.migrated).toBe(false);
    expect(res.reason).toBe("no-mandant");
  });

  it("no-op bei ungültigem Jahr", () => {
    const res = migrateEstFormsV2ToV3("anlage-n", "c-1", 1999);
    expect(res.migrated).toBe(false);
    expect(res.reason).toBe("invalid-year");
  });

  it("kopiert V2 → V3, löscht V2-Key (Happy-Path)", () => {
    localStorage.setItem(
      "harouda:est:c-1:anlage-n",
      JSON.stringify({ bruttoLohn: 40000 })
    );
    const res = migrateEstFormsV2ToV3("anlage-n", "c-1", 2025);
    expect(res.migrated).toBe(true);
    expect(localStorage.getItem("harouda:est:c-1:anlage-n")).toBeNull();
    expect(
      JSON.parse(localStorage.getItem("harouda:est:c-1:2025:anlage-n")!)
    ).toEqual({ bruttoLohn: 40000 });
  });

  it("idempotent: zweiter Aufruf nach erfolgreicher Migration ist no-op", () => {
    localStorage.setItem(
      "harouda:est:c-1:anlage-n",
      JSON.stringify({ bruttoLohn: 40000 })
    );
    const res1 = migrateEstFormsV2ToV3("anlage-n", "c-1", 2025);
    const res2 = migrateEstFormsV2ToV3("anlage-n", "c-1", 2025);
    expect(res1.migrated).toBe(true);
    expect(res2.migrated).toBe(false);
    expect(res2.reason).toBe("no-v2-data");
  });

  it("Konflikt: V3 existiert bereits → V2 bleibt erhalten, warn loggt", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    try {
      localStorage.setItem(
        "harouda:est:c-1:anlage-n",
        JSON.stringify({ v2: true })
      );
      writeEstForm("anlage-n", "c-1", 2025, { v3: true });
      const res = migrateEstFormsV2ToV3("anlage-n", "c-1", 2025);
      expect(res.migrated).toBe(false);
      expect(res.reason).toBe("v3-exists");
      // V2 BLEIBT für User-Klärung.
      expect(localStorage.getItem("harouda:est:c-1:anlage-n")).not.toBeNull();
      // V3 NICHT überschrieben.
      expect(readEstForm("anlage-n", "c-1", 2025)).toEqual({ v3: true });
      expect(warnSpy).toHaveBeenCalled();
    } finally {
      warnSpy.mockRestore();
    }
  });

  it("Migration läuft pro (mandantId, formId), nicht global", () => {
    // anlage-n für c-1 wurde migriert, anlage-g für c-1 soll weiter
    // migrierbar sein (kein globales Flag blockiert).
    localStorage.setItem(
      "harouda:est:c-1:anlage-n",
      JSON.stringify({ formN: true })
    );
    localStorage.setItem(
      "harouda:est:c-1:anlage-g",
      JSON.stringify({ formG: true })
    );
    const resN = migrateEstFormsV2ToV3("anlage-n", "c-1", 2025);
    const resG = migrateEstFormsV2ToV3("anlage-g", "c-1", 2025);
    expect(resN.migrated).toBe(true);
    expect(resG.migrated).toBe(true);
    expect(
      JSON.parse(localStorage.getItem("harouda:est:c-1:2025:anlage-n")!)
    ).toEqual({ formN: true });
    expect(
      JSON.parse(localStorage.getItem("harouda:est:c-1:2025:anlage-g")!)
    ).toEqual({ formG: true });
  });
});

describe("estStorage · migrateEstFormsV1ToV2 (Phase-1-Migration, unverändert)", () => {
  beforeEach(() => localStorage.clear());

  it("ist no-op, wenn das Flag bereits gesetzt ist", () => {
    localStorage.setItem(FLAG, "1");
    localStorage.setItem("harouda:anlage-n", JSON.stringify({ x: 1 }));
    const res = migrateEstFormsV1ToV2();
    expect(res.skipped).toBe(true);
    expect(res.reason).toBe("flag-already-set");
    expect(localStorage.getItem("harouda:anlage-n")).not.toBeNull();
  });

  it("ist no-op, wenn kein selectedMandantId gesetzt ist (Daten-Safety)", () => {
    localStorage.setItem("harouda:anlage-n", JSON.stringify({ x: 1 }));
    const res = migrateEstFormsV1ToV2();
    expect(res.skipped).toBe(true);
    expect(res.reason).toBe("no-active-mandant");
    expect(localStorage.getItem("harouda:anlage-n")).not.toBeNull();
    expect(localStorage.getItem(FLAG)).toBeNull();
  });

  it("zieht harouda:anlage-* / harouda:est-* / harouda:gewst / harouda:kst korrekt um", () => {
    localStorage.setItem(SELECTED, "c-kuehn");
    localStorage.setItem(
      "harouda:anlage-n",
      JSON.stringify({ bruttoLohn: 42 })
    );
    localStorage.setItem("harouda:est-1a", JSON.stringify({ mantel: "X" }));
    localStorage.setItem("harouda:gewst", JSON.stringify({ hebesatz: 400 }));
    localStorage.setItem("harouda:kst", JSON.stringify({ satz: 15 }));

    const res = migrateEstFormsV1ToV2();
    expect(res.skipped).toBe(false);
    expect(res.migrated).toBe(4);

    expect(localStorage.getItem("harouda:anlage-n")).toBeNull();
    expect(localStorage.getItem("harouda:est-1a")).toBeNull();
    expect(localStorage.getItem("harouda:gewst")).toBeNull();
    expect(localStorage.getItem("harouda:kst")).toBeNull();

    expect(
      localStorage.getItem("harouda:est:c-kuehn:anlage-n")
    ).toBe(JSON.stringify({ bruttoLohn: 42 }));
    expect(localStorage.getItem("harouda:est:c-kuehn:est-1a")).toBe(
      JSON.stringify({ mantel: "X" })
    );
    expect(localStorage.getItem("harouda:est:c-kuehn:gewst")).toBe(
      JSON.stringify({ hebesatz: 400 })
    );
    expect(localStorage.getItem("harouda:est:c-kuehn:kst")).toBe(
      JSON.stringify({ satz: 15 })
    );

    expect(localStorage.getItem(FLAG)).toBe("1");
  });

  it("überschreibt existierende V2-Keys NICHT (Data-Safety)", () => {
    localStorage.setItem(SELECTED, "c-1");
    localStorage.setItem("harouda:anlage-n", JSON.stringify({ alt: true }));
    localStorage.setItem(
      "harouda:est:c-1:anlage-n",
      JSON.stringify({ neu: true })
    );

    migrateEstFormsV1ToV2();

    expect(
      JSON.parse(localStorage.getItem("harouda:est:c-1:anlage-n")!)
    ).toEqual({ neu: true });
    expect(localStorage.getItem("harouda:anlage-n")).toBeNull();
  });

  it("V2-Keys (`harouda:est:…`) werden NICHT als Legacy missinterpretiert", () => {
    localStorage.setItem(SELECTED, "c-1");
    localStorage.setItem(
      "harouda:est:c-2:anlage-n",
      JSON.stringify({ fremd: true })
    );
    const res = migrateEstFormsV1ToV2();
    expect(res.migrated).toBe(0);
    expect(
      localStorage.getItem("harouda:est:c-2:anlage-n")
    ).not.toBeNull();
  });
});
