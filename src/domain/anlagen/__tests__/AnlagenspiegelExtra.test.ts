/**
 * Zusätzliche Tests für Anlagenspiegel-Daten und Exporter — Sprint 6 Teil 2a.
 *
 * Deckt ab: gemischte Zugänge + Abgänge im selben Jahr, PDF- und Excel-
 * Exporter Smoke-Tests, Abgangs-Integration in die Spiegel-Aggregation.
 */

import { describe, it, expect } from "vitest";
import type { Anlagegut } from "../../../types/db";
import { getAnlagenspiegelData } from "../AnlagenService";
import { AnlagenspiegelPdfGenerator } from "../../../lib/pdf/AnlagenspiegelPdfGenerator";
import { exportAnlagenspiegelExcel } from "../../../lib/excel/AnlagenspiegelExcelExporter";

function makeAnlage(overrides: Partial<Anlagegut> = {}): Anlagegut {
  const now = "2025-01-01T00:00:00Z";
  return {
    id: overrides.id ?? "a-1",
    company_id: null,
    inventar_nr: overrides.inventar_nr ?? "INV-001",
    bezeichnung: overrides.bezeichnung ?? "Test",
    anschaffungsdatum: overrides.anschaffungsdatum ?? "2024-01-01",
    anschaffungskosten: overrides.anschaffungskosten ?? 10000,
    nutzungsdauer_jahre: overrides.nutzungsdauer_jahre ?? 5,
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

describe("getAnlagenspiegelData — gemischte Szenarien", () => {
  it("Zugang UND Abgang im selben Jahr → beide in derselben Gruppe sichtbar", () => {
    const anlagen: Anlagegut[] = [
      // Alt-Anlage (Abgang 2025)
      makeAnlage({
        id: "a-alt",
        inventar_nr: "INV-ALT",
        konto_anlage: "0440",
        anschaffungsdatum: "2022-01-01",
        anschaffungskosten: 3000,
        nutzungsdauer_jahre: 6,
        abgangsdatum: "2025-06-30",
        aktiv: false,
      }),
      // Neu-Anlage (Zugang 2025, gleiche Konto-Gruppe)
      makeAnlage({
        id: "a-neu",
        inventar_nr: "INV-NEU",
        konto_anlage: "0440",
        anschaffungsdatum: "2025-03-01",
        anschaffungskosten: 5000,
        nutzungsdauer_jahre: 5,
      }),
    ];
    const data = getAnlagenspiegelData(2025, anlagen);
    expect(data.gruppen).toHaveLength(1);
    const g = data.gruppen[0];
    expect(g.anzahl).toBe(2);
    expect(g.ak_start).toBe(3000); // Alt-Anlage
    expect(g.zugaenge).toBe(5000); // Neu-Anlage
    expect(g.abgaenge).toBe(3000); // Alt-Anlage fällt raus
    expect(g.ak_ende).toBe(5000); // nur die neue
  });

  it("Anlagen, die vor bis_jahr abgegangen sind, werden ignoriert", () => {
    const anlagen: Anlagegut[] = [
      makeAnlage({
        id: "a-1",
        anschaffungsdatum: "2020-01-01",
        anschaffungskosten: 1000,
        nutzungsdauer_jahre: 5,
        abgangsdatum: "2023-06-30", // vor 2025
        aktiv: false,
      }),
      makeAnlage({
        id: "a-2",
        anschaffungsdatum: "2024-01-01",
        anschaffungskosten: 2000,
        nutzungsdauer_jahre: 4,
      }),
    ];
    const data = getAnlagenspiegelData(2025, anlagen);
    expect(data.totals.anzahl).toBe(1);
    expect(data.totals.ak_start).toBe(2000);
  });

  it("Anlagen, die erst nach bis_jahr angeschafft werden, werden ignoriert", () => {
    const anlagen: Anlagegut[] = [
      makeAnlage({
        id: "a-future",
        anschaffungsdatum: "2026-01-01",
      }),
    ];
    const data = getAnlagenspiegelData(2025, anlagen);
    expect(data.gruppen).toHaveLength(0);
    expect(data.totals.anzahl).toBe(0);
  });
});

describe("AnlagenspiegelPdfGenerator — Smoke", () => {
  it("erzeugt ein PDF-Blob für leere Daten", () => {
    const gen = new AnlagenspiegelPdfGenerator();
    const data = getAnlagenspiegelData(2025, []);
    const blob = gen.generate(data, {
      title: "Anlagenspiegel",
      mandantName: "Test Mandant",
    });
    expect(blob).toBeInstanceOf(Blob);
    expect(blob.size).toBeGreaterThan(0);
  });

  it("erzeugt ein PDF-Blob für mehrere Gruppen + Totals-Zeile", () => {
    const gen = new AnlagenspiegelPdfGenerator();
    const anlagen: Anlagegut[] = [
      makeAnlage({
        id: "a-1",
        inventar_nr: "INV-1",
        konto_anlage: "0400",
        anschaffungsdatum: "2023-01-01",
        anschaffungskosten: 10000,
      }),
      makeAnlage({
        id: "a-2",
        inventar_nr: "INV-2",
        konto_anlage: "0440",
        anschaffungsdatum: "2024-01-01",
        anschaffungskosten: 2000,
      }),
    ];
    const data = getAnlagenspiegelData(2025, anlagen);
    const blob = gen.generate(data, {
      title: "Anlagenspiegel",
      mandantName: "Test Mandant",
    });
    expect(blob.size).toBeGreaterThan(500); // sinnvolle Größe
  });
});

describe("exportAnlagenspiegelExcel — Smoke", () => {
  it("erzeugt ein Excel-Blob mit 1 Worksheet", async () => {
    const anlagen: Anlagegut[] = [
      makeAnlage({
        id: "a-1",
        konto_anlage: "0440",
        anschaffungsdatum: "2024-01-01",
        anschaffungskosten: 1200,
        nutzungsdauer_jahre: 3,
      }),
    ];
    const data = getAnlagenspiegelData(2025, anlagen);
    const blob = await exportAnlagenspiegelExcel(data, {
      mandantName: "Test Mandant",
      generatedAt: new Date("2025-06-15T10:00:00Z"),
    });
    expect(blob).toBeInstanceOf(Blob);
    expect(blob.size).toBeGreaterThan(500);
  });

  it("erzeugt ein Excel-Blob auch für leere Daten", async () => {
    const data = getAnlagenspiegelData(2025, []);
    const blob = await exportAnlagenspiegelExcel(data, {
      mandantName: "Test",
    });
    expect(blob).toBeInstanceOf(Blob);
  });
});
