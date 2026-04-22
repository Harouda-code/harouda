// Sprint 17.5 / Schritt 3 · Safe-Placeholder-Engine-Tests.

import { describe, it, expect } from "vitest";
import {
  BSTBK_PLACEHOLDERS,
  substitutePlaceholders,
  validatePlaceholderValues,
  type BstbkPlaceholderValues,
} from "../bstbkPlaceholders";

function fullValues(): BstbkPlaceholderValues {
  return {
    MandantenName: "Muster GmbH",
    JahresabschlussStichtag: "31.12.2025",
    KanzleiName: "Kanzlei Mustermann",
    Ort: "Berlin",
    Datum: "27.04.2026",
    SteuerberaterName: "Dr. Maria Musterfrau",
  };
}

const TEMPLATE =
  "Auftragsgemaess haben wir den Jahresabschluss der {{MandantenName}} " +
  "zum {{JahresabschlussStichtag}} erstellt.\n\n" +
  "{{Ort}}, den {{Datum}}\n\n{{KanzleiName}}\n\n" +
  "{{SteuerberaterName}}, Steuerberater";

describe("substitutePlaceholders · Happy-Path", () => {
  it("#1 Alle 6 Werte gesetzt → vollstaendige Ersetzung, keine missing/unknown", () => {
    const r = substitutePlaceholders(TEMPLATE, fullValues());
    expect(r.missing_values).toEqual([]);
    expect(r.unknown_placeholders_in_template).toEqual([]);
    expect(r.text).toContain("Muster GmbH");
    expect(r.text).toContain("31.12.2025");
    expect(r.text).toContain("Berlin");
    expect(r.text).not.toContain("{{");
  });

  it("#2 Mehrfach-Vorkommen desselben Keys: alle ersetzt", () => {
    const tpl = "Hallo {{MandantenName}}, Sie {{MandantenName}}!";
    const r = substitutePlaceholders(tpl, { MandantenName: "Test GmbH" });
    expect(r.text).toBe("Hallo Test GmbH, Sie Test GmbH!");
  });
});

describe("substitutePlaceholders · Missing-Values", () => {
  it("#3 Fehlender Ort → '{{Ort}}' bleibt + missing=['Ort']", () => {
    const v = fullValues();
    // @ts-expect-error intentional incomplete
    delete v.Ort;
    const r = substitutePlaceholders(TEMPLATE, v);
    expect(r.missing_values).toContain("Ort");
    expect(r.text).toContain("{{Ort}}");
    // Andere Keys sind weg.
    expect(r.text).not.toContain("{{MandantenName}}");
  });

  it("#4 Leer-String → als missing behandelt", () => {
    const v = { ...fullValues(), Ort: "   " };
    const r = substitutePlaceholders(TEMPLATE, v);
    expect(r.missing_values).toContain("Ort");
    expect(r.text).toContain("{{Ort}}");
  });

  it("#5 Keine Werte → alle 6 in missing", () => {
    const r = substitutePlaceholders(TEMPLATE, {});
    expect(r.missing_values.length).toBe(BSTBK_PLACEHOLDERS.length);
  });
});

describe("substitutePlaceholders · Unknown + Security", () => {
  it("#6 Unbekannter {{XYZ}} bleibt als-is + in unknown-Liste", () => {
    const tpl = "Hallo {{XYZ}} und {{MandantenName}}.";
    const r = substitutePlaceholders(tpl, {
      MandantenName: "Test",
    });
    expect(r.unknown_placeholders_in_template).toEqual(["XYZ"]);
    expect(r.text).toBe("Hallo {{XYZ}} und Test.");
  });

  it("#7 Control-Chars in Input werden gefiltert", () => {
    const r = substitutePlaceholders("X {{MandantenName}} Y", {
      MandantenName: "A\x00B\x1FC\x7FD",
    });
    expect(r.text).toBe("X ABCD Y");
  });

  it("#8 Injection-Versuch via {{-im-Value-Content}} wird nicht als Placeholder interpretiert (keine Rekursion)", () => {
    const r = substitutePlaceholders("Hallo {{MandantenName}}!", {
      MandantenName: "{{Ort}}",
    });
    // Ein einmaliger Durchlauf: der Wert erscheint literally.
    expect(r.text).toBe("Hallo {{Ort}}!");
    expect(r.missing_values).toEqual([]);
  });
});

describe("validatePlaceholderValues", () => {
  it("#9 Alle 6 non-empty → valid=true, missing=[]", () => {
    const r = validatePlaceholderValues(fullValues());
    expect(r.valid).toBe(true);
    expect(r.missing).toEqual([]);
  });

  it("#10 Ein Feld leer → valid=false, missing listet das Feld", () => {
    const v: Partial<BstbkPlaceholderValues> = { ...fullValues(), Ort: "" };
    const r = validatePlaceholderValues(v);
    expect(r.valid).toBe(false);
    expect(r.missing).toEqual(["Ort"]);
  });

  it("#11 Komplett leeres Objekt → missing enthaelt alle 6 Keys", () => {
    const r = validatePlaceholderValues({});
    expect(r.valid).toBe(false);
    expect(r.missing.length).toBe(BSTBK_PLACEHOLDERS.length);
  });
});
