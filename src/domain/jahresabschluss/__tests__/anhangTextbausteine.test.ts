// Jahresabschluss-E3a / Schritt 4 · AnhangTextbausteine-Tests.

import { describe, it, expect } from "vitest";
import {
  ANHANG_TEXTBAUSTEINE,
  getBausteineFuer,
  TB_ID_284_METHODEN,
  TB_ID_285_1_LANGFRISTIGE_VERB,
  TB_ID_285_7_ARBEITNEHMER,
  TB_ID_285_9_ORGANBEZUEGE,
  TB_ID_285_10_ORGANE,
  TB_ID_287_NACHTRAG,
} from "../anhangTextbausteine";

describe("AnhangTextbausteine (MVP-Bibliothek)", () => {
  it("#1 Es gibt genau 6 Bausteine (MVP-Scope)", () => {
    expect(ANHANG_TEXTBAUSTEINE).toHaveLength(6);
  });

  it("#2 Jeder Baustein hat id, titel, paragraph_verweis, version_stand (YYYY-MM)", () => {
    for (const b of ANHANG_TEXTBAUSTEINE) {
      expect(b.id).toMatch(/^[§\-\w]+$/);
      expect(b.titel.length).toBeGreaterThan(5);
      expect(b.paragraph_verweis).toMatch(/^§\s+\d+/);
      expect(b.version_stand).toMatch(/^\d{4}-\d{2}$/);
    }
  });

  it("#3 IDs sind eindeutig", () => {
    const ids = ANHANG_TEXTBAUSTEINE.map((b) => b.id);
    expect(new Set(ids).size).toBe(ids.length);
    // Alle 6 ID-Konstanten sind tatsächlich in der Bibliothek.
    expect(ids).toContain(TB_ID_284_METHODEN);
    expect(ids).toContain(TB_ID_285_1_LANGFRISTIGE_VERB);
    expect(ids).toContain(TB_ID_285_7_ARBEITNEHMER);
    expect(ids).toContain(TB_ID_285_9_ORGANBEZUEGE);
    expect(ids).toContain(TB_ID_285_10_ORGANE);
    expect(ids).toContain(TB_ID_287_NACHTRAG);
  });

  it("#4 Jeder tiptap_template ist ein valider 'doc'-JSONContent mit Kindern", () => {
    for (const b of ANHANG_TEXTBAUSTEINE) {
      expect(b.tiptap_template.type).toBe("doc");
      expect(Array.isArray(b.tiptap_template.content)).toBe(true);
      expect(b.tiptap_template.content!.length).toBeGreaterThan(0);
    }
  });

  it("#5 Filter 'Kapital + klein' liefert § 284 + § 285-7 + § 285-10, NICHT § 285-1 / § 285-9 / § 287", () => {
    const out = getBausteineFuer({
      rechtsform: "Kapitalgesellschaft",
      groessenklasse: "klein",
    });
    const ids = out.map((b) => b.id);
    expect(ids).toContain(TB_ID_284_METHODEN);
    expect(ids).toContain(TB_ID_285_7_ARBEITNEHMER);
    expect(ids).toContain(TB_ID_285_10_ORGANE);
    expect(ids).not.toContain(TB_ID_285_1_LANGFRISTIGE_VERB);
    expect(ids).not.toContain(TB_ID_285_9_ORGANBEZUEGE);
    expect(ids).not.toContain(TB_ID_287_NACHTRAG);
  });

  it("#6 Filter 'Kapital + mittel' liefert ALLE 6 Bausteine", () => {
    const out = getBausteineFuer({
      rechtsform: "Kapitalgesellschaft",
      groessenklasse: "mittel",
    });
    expect(out).toHaveLength(6);
  });

  it("#7 Filter 'Einzel' liefert leere Liste (keine Anhang-Pflicht)", () => {
    const out = getBausteineFuer({
      rechtsform: "Einzel",
      groessenklasse: "klein",
    });
    expect(out).toEqual([]);
  });

  it("#8 Filter 'Personen + mittel' liefert KEINE Kapital-scoped-Bausteine", () => {
    const out = getBausteineFuer({
      rechtsform: "Personengesellschaft",
      groessenklasse: "mittel",
    });
    // Alle 6 Bausteine sind aktuell 'Kapitalgesellschaft'-only -> leer.
    expect(out).toHaveLength(0);
  });
});
