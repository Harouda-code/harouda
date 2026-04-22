// Sprint 17.5 / Schritt 2 · BStBK-Bescheinigungen-Constants-Tests.

import { describe, it, expect } from "vitest";
import {
  BSTBK_BESCHEINIGUNGEN,
  BSTBK_FOOTER_TEXT,
  getBescheinigungsTemplate,
  type BescheinigungsTyp,
} from "../bstbkBescheinigungen";

const EXPECTED_PLACEHOLDERS = [
  "MandantenName",
  "JahresabschlussStichtag",
  "KanzleiName",
  "Ort",
  "Datum",
  "SteuerberaterName",
];

describe("BStBK-Bescheinigungen · Constants", () => {
  it("#1 Drei Typen existieren mit allen Pflichtfeldern", () => {
    const typen: BescheinigungsTyp[] = [
      "ohne_beurteilungen",
      "mit_plausibilitaet",
      "mit_umfassender_beurteilung",
    ];
    for (const t of typen) {
      const tpl = BSTBK_BESCHEINIGUNGEN[t];
      expect(tpl.typ).toBe(t);
      expect(tpl.titel.length).toBeGreaterThan(20);
      expect(tpl.kern_text.length).toBeGreaterThan(100);
      expect(tpl.hinweis_text.length).toBeGreaterThan(10);
      expect(tpl.version_stand).toBe("2023-04");
      expect(tpl.quelle_url).toContain("bstbk.de");
    }
  });

  it("#2 Object.freeze verhindert Mutation des Root-Objekts", () => {
    expect(Object.isFrozen(BSTBK_BESCHEINIGUNGEN)).toBe(true);
    expect(Object.isFrozen(BSTBK_BESCHEINIGUNGEN.ohne_beurteilungen)).toBe(
      true
    );
    expect(() => {
      "use strict";
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (BSTBK_BESCHEINIGUNGEN as any).ohne_beurteilungen = null;
    }).toThrow();
  });

  it("#3 Kern-Text enthaelt alle 6 Placeholders (pro Typ)", () => {
    for (const t of Object.keys(BSTBK_BESCHEINIGUNGEN) as BescheinigungsTyp[]) {
      const kern = BSTBK_BESCHEINIGUNGEN[t].kern_text;
      for (const ph of EXPECTED_PLACEHOLDERS) {
        expect(kern).toContain(`{{${ph}}}`);
      }
    }
  });

  it("#4 BSTBK_FOOTER_TEXT enthaelt den vollstaendigen BStBK-Verweis", () => {
    expect(BSTBK_FOOTER_TEXT).toContain("Bundessteuerberaterkammer");
    expect(BSTBK_FOOTER_TEXT).toContain("Jahresabschl");
  });

  it("#5 getBescheinigungsTemplate: Happy-Path + Fehler", () => {
    expect(getBescheinigungsTemplate("ohne_beurteilungen").typ).toBe(
      "ohne_beurteilungen"
    );
    expect(() =>
      getBescheinigungsTemplate(
        "not-a-typ" as unknown as BescheinigungsTyp
      )
    ).toThrow();
  });

  it("#6 'mit_plausibilitaet' erwaehnt § 317 HGB-Nicht-Pruefung", () => {
    expect(
      BSTBK_BESCHEINIGUNGEN.mit_plausibilitaet.kern_text
    ).toContain("§ 317 HGB");
  });
});
