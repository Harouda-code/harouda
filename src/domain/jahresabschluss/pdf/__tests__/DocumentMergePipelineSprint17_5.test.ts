// Sprint 17.5 / Schritt 5 · Pipeline-Integration (Erlaeuterungen + BStBK).

import { describe, it, expect } from "vitest";
import { buildJahresabschlussDocument } from "../DocumentMergePipeline";
import type { CoverPageInput } from "../CoverPageBuilder";
import type { JahresabschlussBausteine } from "../../WizardTypes";
import { computeBausteine } from "../../RulesEngine";
import type { JSONContent } from "@tiptap/react";
import type { BstbkPlaceholderValues } from "../../bstbk/bstbkPlaceholders";

function cover(
  overrides: Partial<CoverPageInput> = {}
): CoverPageInput {
  return {
    firmenname: "Muster GmbH",
    rechtsform: "GmbH",
    hrb_nummer: "HRB 1",
    hrb_gericht: "Berlin",
    steuernummer: "000",
    geschaeftsjahr_von: "01.01.2025",
    geschaeftsjahr_bis: "31.12.2025",
    stichtag: "31.12.2025",
    groessenklasse: "klein",
    berichtsart: "Jahresabschluss",
    erstellt_am: "27.04.2026",
    ...overrides,
  };
}

function bausteine(): JahresabschlussBausteine {
  return computeBausteine({ rechtsform: "GmbH", groessenklasse: "klein" });
}

const BSTBK_VALUES: BstbkPlaceholderValues = {
  MandantenName: "Muster GmbH",
  JahresabschlussStichtag: "31.12.2025",
  KanzleiName: "Kanzlei Mustermann",
  Ort: "Berlin",
  Datum: "27.04.2026",
  SteuerberaterName: "Dr. Musterfrau",
};

describe("DocumentMergePipeline · Sprint 17.5 Erlaeuterungen", () => {
  it("#1 Ohne erlaeuterungen_text: keine Erlaeuterungs-Section im Output", () => {
    const doc = buildJahresabschlussDocument({
      cover: cover(),
      bausteine: bausteine(),
    });
    const json = JSON.stringify(doc.content);
    expect(json).not.toContain("Erläuterungsbericht");
  });

  it("#2 Leerer erlaeuterungen_text (doc ohne content): keine Section", () => {
    const emptyDoc: JSONContent = { type: "doc", content: [] };
    const doc = buildJahresabschlussDocument({
      cover: cover(),
      bausteine: bausteine(),
      erlaeuterungen_text: emptyDoc,
    });
    const json = JSON.stringify(doc.content);
    expect(json).not.toContain("Erläuterungsbericht");
  });

  it("#3 Non-empty erlaeuterungen_text: Section + Text im Output", () => {
    const tiptap: JSONContent = {
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [
            { type: "text", text: "Umsatzrueckgang 5% durch Marktlage." },
          ],
        },
      ],
    };
    const doc = buildJahresabschlussDocument({
      cover: cover(),
      bausteine: bausteine(),
      erlaeuterungen_text: tiptap,
    });
    const json = JSON.stringify(doc.content);
    expect(json).toContain("Erläuterungsbericht");
    expect(json).toContain("Umsatzrueckgang");
  });
});

describe("DocumentMergePipeline · Sprint 17.5 Bescheinigung (BStBK)", () => {
  it("#4 bescheinigungInput gesetzt: BStBK-Kerntext erscheint (Titel zentriert + Footer)", () => {
    const doc = buildJahresabschlussDocument({
      cover: cover(),
      bausteine: bausteine(),
      bescheinigungInput: {
        typ: "ohne_beurteilungen",
        values: BSTBK_VALUES,
        footer_sichtbar: true,
      },
    });
    const json = JSON.stringify(doc.content);
    expect(json).toContain("Bescheinigung ueber die Erstellung");
    expect(json).toContain("Muster GmbH");
    expect(json).toContain("Bundessteuerberaterkammer");
  });

  it("#5 bescheinigungInput mit footer_sichtbar=false: kein BStBK-Footer", () => {
    const doc = buildJahresabschlussDocument({
      cover: cover(),
      bausteine: bausteine(),
      bescheinigungInput: {
        typ: "mit_plausibilitaet",
        values: BSTBK_VALUES,
        footer_sichtbar: false,
      },
    });
    const json = JSON.stringify(doc.content);
    expect(json).toContain("Plausibilitaet");
    expect(json).not.toContain("Bundessteuerberaterkammer");
  });

  it("#6 Backwards-Compat: altes bescheinigung (Content[]) funktioniert weiterhin", () => {
    const doc = buildJahresabschlussDocument({
      cover: cover(),
      bausteine: bausteine(),
      bescheinigung: [
        { text: "LEGACY-BESCHEINIGUNGSTEXT", margin: [0, 0, 0, 12] },
      ],
    });
    const json = JSON.stringify(doc.content);
    expect(json).toContain("LEGACY-BESCHEINIGUNGSTEXT");
  });

  it("#7 bescheinigungInput hat Prio vor altem bescheinigung-Content", () => {
    const doc = buildJahresabschlussDocument({
      cover: cover(),
      bausteine: bausteine(),
      bescheinigung: [{ text: "LEGACY", margin: [0, 0, 0, 0] }],
      bescheinigungInput: {
        typ: "ohne_beurteilungen",
        values: BSTBK_VALUES,
        footer_sichtbar: true,
      },
    });
    const json = JSON.stringify(doc.content);
    expect(json).not.toContain("LEGACY");
    expect(json).toContain("Muster GmbH");
  });
});
