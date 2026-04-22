// Sprint 15 / Schritt 5 · DsuvCsvBuilder-Tests.

import { describe, it, expect } from "vitest";
import {
  buildBeitragsnachweisCsv,
  type BeitragsgruppeSumme,
} from "../DsuvCsvBuilder";

function fullBg(
  overrides: Partial<BeitragsgruppeSumme> = {}
): BeitragsgruppeSumme {
  return {
    einzugsstelle_bbnr: "01234567",
    bg_kv: "1",
    bg_rv: "1",
    bg_av: "1",
    bg_pv: "1",
    beitragspflichtiges_entgelt: 3000,
    kv_betrag: 440.4,
    rv_betrag: 558,
    av_betrag: 78,
    pv_betrag: 102,
    ...overrides,
  };
}

describe("DsuvCsvBuilder · Beitragsnachweis", () => {
  it("#1 Leere Beitragsgruppen-Liste: CSV nur Header + warning", () => {
    const r = buildBeitragsnachweisCsv({
      companyId: "c-1",
      mandantId: "m-1",
      monat: 5,
      jahr: 2025,
      beitragsgruppen: [],
    });
    expect(r.zeilen_count).toBe(0);
    const lines = r.csv.split("\r\n");
    expect(lines.length).toBe(1);
    expect(lines[0]).toContain("Monat");
    expect(lines[0]).toContain("EinzugsstelleBBNR");
    expect(r.warnings.join("|")).toContain("nur Header");
  });

  it("#2 Monats-Aggregation mit 2 AN-Gruppen: Gesamt-Summen korrekt", () => {
    const bg1 = fullBg({
      einzugsstelle_bbnr: "01234567",
      beitragspflichtiges_entgelt: 3000,
      kv_betrag: 440.4,
      rv_betrag: 558,
    });
    const bg2 = fullBg({
      einzugsstelle_bbnr: "07654321",
      beitragspflichtiges_entgelt: 2500,
      kv_betrag: 367,
      rv_betrag: 465,
    });
    const r = buildBeitragsnachweisCsv({
      companyId: "c-1",
      mandantId: "m-1",
      monat: 3,
      jahr: 2025,
      beitragsgruppen: [bg1, bg2],
    });
    expect(r.zeilen_count).toBe(2);
    expect(r.gesamt_betraege.kv).toBe(807.4);
    expect(r.gesamt_betraege.rv).toBe(1023);
    expect(r.csv).toContain("03;2025");
    // Deutsches Komma-Format fuer Betraege.
    expect(r.csv).toContain("3000,00");
    expect(r.csv).toContain("440,40");
  });

  it("#3 Ungueltige BBNR (!== 8 Zeichen): warning + Zeile trotzdem in CSV", () => {
    const bg = fullBg({ einzugsstelle_bbnr: "123" });
    const r = buildBeitragsnachweisCsv({
      companyId: "c-1",
      mandantId: "m-1",
      monat: 5,
      jahr: 2025,
      beitragsgruppen: [bg],
    });
    expect(r.warnings.join("|")).toContain("BBNR");
    expect(r.zeilen_count).toBe(1);
    expect(r.csv.split("\r\n")).toHaveLength(2);
  });

  it("#4 Monat ausserhalb 1-12: warning", () => {
    const r = buildBeitragsnachweisCsv({
      companyId: "c-1",
      mandantId: "m-1",
      monat: 13,
      jahr: 2025,
      beitragsgruppen: [],
    });
    expect(r.warnings.join("|")).toContain("ausserhalb");
  });
});
