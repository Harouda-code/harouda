// Sprint 17.5 / Schritt 4 · BescheinigungBuilder-Tests.

import { describe, it, expect } from "vitest";
import { buildBescheinigung } from "../BescheinigungBuilder";
import type { BstbkPlaceholderValues } from "../../bstbk/bstbkPlaceholders";

function fullValues(): BstbkPlaceholderValues {
  return {
    MandantenName: "Test GmbH",
    JahresabschlussStichtag: "31.12.2025",
    KanzleiName: "Kanzlei XYZ",
    Ort: "Berlin",
    Datum: "27.04.2026",
    SteuerberaterName: "Maria Musterfrau",
  };
}

describe("buildBescheinigung", () => {
  it("#1 Typ 'ohne_beurteilungen': Titel + Kerntext + Hinweis + Footer im Output", () => {
    const r = buildBescheinigung({
      typ: "ohne_beurteilungen",
      values: fullValues(),
      footer_sichtbar: true,
    });
    const json = JSON.stringify(r.content);
    expect(json).toContain("Erstellung des Jahresabschlusses");
    expect(json).toContain("Test GmbH");
    expect(json).toContain("Berlin");
    expect(json).toContain("Bundessteuerberaterkammer");
    expect(r.missing_values).toEqual([]);
  });

  it("#2 Typ 'mit_plausibilitaet' enthaelt § 317 HGB-Hinweis", () => {
    const r = buildBescheinigung({
      typ: "mit_plausibilitaet",
      values: fullValues(),
      footer_sichtbar: true,
    });
    const json = JSON.stringify(r.content);
    expect(json).toContain("Plausibilitaet");
    expect(json).toContain("§ 317 HGB");
  });

  it("#3 Typ 'mit_umfassender_beurteilung' hat umfassende Beurteilung im Text", () => {
    const r = buildBescheinigung({
      typ: "mit_umfassender_beurteilung",
      values: fullValues(),
      footer_sichtbar: true,
    });
    const json = JSON.stringify(r.content);
    expect(json).toContain("umfassende Beurteilungen");
  });

  it("#4 footer_sichtbar=false: kein BStBK-Footer im Output", () => {
    const r = buildBescheinigung({
      typ: "ohne_beurteilungen",
      values: fullValues(),
      footer_sichtbar: false,
    });
    const json = JSON.stringify(r.content);
    expect(json).not.toContain("Bundessteuerberaterkammer");
  });

  it("#5 pageBreak='before' auf Titel-Element", () => {
    const r = buildBescheinigung({
      typ: "ohne_beurteilungen",
      values: fullValues(),
      footer_sichtbar: true,
    });
    const first = r.content[0] as { pageBreak?: string };
    expect(first.pageBreak).toBe("before");
  });

  it("#6 Fehlende Werte: {{Ort}} bleibt im Output + missing_values listet den Key", () => {
    const v: BstbkPlaceholderValues = { ...fullValues(), Ort: "" };
    const r = buildBescheinigung({
      typ: "ohne_beurteilungen",
      values: v,
      footer_sichtbar: true,
    });
    const json = JSON.stringify(r.content);
    expect(json).toContain("{{Ort}}");
    expect(r.missing_values).toContain("Ort");
  });
});
