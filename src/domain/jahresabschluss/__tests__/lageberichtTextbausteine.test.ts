// Jahresabschluss-E3b / Schritt 3 · LageberichtTextbausteine-Tests.

import { describe, it, expect } from "vitest";
import {
  LAGEBERICHT_TEXTBAUSTEINE,
  getLageberichtFuer,
  LB_ID_289_1_WIRTSCHAFTSBERICHT,
  LB_ID_289_2_PROGNOSE_RISIKO,
  LB_ID_289_3_NICHTFINANZIELLE_KPI,
  LB_ID_289_4_IKS,
} from "../lageberichtTextbausteine";

describe("LageberichtTextbausteine (MVP-Bibliothek § 289 HGB)", () => {
  it("#1 Es gibt genau 4 Bausteine (MVP-Scope)", () => {
    expect(LAGEBERICHT_TEXTBAUSTEINE).toHaveLength(4);
  });

  it("#2 Jeder Baustein hat id/titel/version_stand/paragraph_verweis in § 289-Form", () => {
    for (const b of LAGEBERICHT_TEXTBAUSTEINE) {
      expect(b.id).toMatch(/^§-289/);
      expect(b.titel.length).toBeGreaterThan(5);
      expect(b.paragraph_verweis).toMatch(/^§\s+289/);
      expect(b.version_stand).toMatch(/^\d{4}-\d{2}$/);
      expect(b.tiptap_template.type).toBe("doc");
    }
  });

  it("#3 IDs sind eindeutig + alle 4 Konstanten in der Bibliothek", () => {
    const ids = LAGEBERICHT_TEXTBAUSTEINE.map((b) => b.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids).toContain(LB_ID_289_1_WIRTSCHAFTSBERICHT);
    expect(ids).toContain(LB_ID_289_2_PROGNOSE_RISIKO);
    expect(ids).toContain(LB_ID_289_3_NICHTFINANZIELLE_KPI);
    expect(ids).toContain(LB_ID_289_4_IKS);
  });

  it("#4 Filter 'Kapital + mittel' -> Abs. 1 + Abs. 2 (nicht Abs. 3, nicht Abs. 4 ohne kapitalmarktorientiert)", () => {
    const out = getLageberichtFuer({
      rechtsform: "Kapitalgesellschaft",
      groessenklasse: "mittel",
    });
    const ids = out.map((b) => b.id);
    expect(ids).toContain(LB_ID_289_1_WIRTSCHAFTSBERICHT);
    expect(ids).toContain(LB_ID_289_2_PROGNOSE_RISIKO);
    expect(ids).not.toContain(LB_ID_289_3_NICHTFINANZIELLE_KPI);
    expect(ids).not.toContain(LB_ID_289_4_IKS);
  });

  it("#5 Filter 'Kapital + gross' -> Abs. 1 + Abs. 2 + Abs. 3 (Abs. 4 erst bei kapitalmarktorientiert)", () => {
    const out = getLageberichtFuer({
      rechtsform: "Kapitalgesellschaft",
      groessenklasse: "gross",
    });
    const ids = out.map((b) => b.id);
    expect(ids).toContain(LB_ID_289_1_WIRTSCHAFTSBERICHT);
    expect(ids).toContain(LB_ID_289_2_PROGNOSE_RISIKO);
    expect(ids).toContain(LB_ID_289_3_NICHTFINANZIELLE_KPI);
    expect(ids).not.toContain(LB_ID_289_4_IKS);
  });

  it("#6 Filter 'Kapital + gross + kapitalmarktorientiert' -> alle 4 Bausteine", () => {
    const out = getLageberichtFuer({
      rechtsform: "Kapitalgesellschaft",
      groessenklasse: "gross",
      kapitalmarktorientiert: true,
    });
    expect(out).toHaveLength(4);
  });

  it("#7 Filter 'Kapital + klein' -> leere Liste (§ 264 Abs. 1 S. 4 HGB befreit)", () => {
    const out = getLageberichtFuer({
      rechtsform: "Kapitalgesellschaft",
      groessenklasse: "klein",
    });
    expect(out).toEqual([]);
  });

  it("#8 Filter 'Einzel' / 'Personen' -> leer (keine Lagebericht-Pflicht)", () => {
    expect(
      getLageberichtFuer({ rechtsform: "Einzel", groessenklasse: "gross" })
    ).toEqual([]);
    expect(
      getLageberichtFuer({
        rechtsform: "Personengesellschaft",
        groessenklasse: "gross",
      })
    ).toEqual([]);
  });
});
