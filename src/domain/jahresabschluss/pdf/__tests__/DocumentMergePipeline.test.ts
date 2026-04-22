// Jahresabschluss-E3b / Schritt 4 · DocumentMergePipeline-Tests.

import { describe, it, expect } from "vitest";
import {
  buildJahresabschlussDocument,
  tableFromRows,
  type JahresabschlussDocumentInput,
} from "../DocumentMergePipeline";
import type { CoverPageInput } from "../CoverPageBuilder";
import type { JahresabschlussBausteine } from "../../WizardTypes";
import { computeBausteine } from "../../RulesEngine";

function coverGmbH(
  overrides: Partial<CoverPageInput> = {}
): CoverPageInput {
  return {
    firmenname: "Kühn Musterfirma",
    rechtsform: "GmbH",
    hrb_nummer: "HRB 12345",
    hrb_gericht: "München",
    steuernummer: "143/456/78901",
    geschaeftsjahr_von: "01.01.2025",
    geschaeftsjahr_bis: "31.12.2025",
    stichtag: "31.12.2025",
    groessenklasse: "mittel",
    berichtsart: "Jahresabschluss",
    erstellt_am: "23.04.2026",
    ...overrides,
  };
}

function mittelBausteine(): JahresabschlussBausteine {
  return computeBausteine({ rechtsform: "GmbH", groessenklasse: "mittel" });
}

function baseInput(): JahresabschlussDocumentInput {
  return {
    cover: coverGmbH(),
    bausteine: mittelBausteine(),
    bilanz: [tableFromRows(["Position", "EUR"], [["Summe Aktiva", "100.000"]])],
    guv: [tableFromRows(["Pos", "EUR"], [["Jahresüberschuss", "10.000"]])],
    anlagenspiegel: [
      tableFromRows(["AfA", "EUR"], [["Gebäude", "2.000"]]),
    ],
  };
}

describe("DocumentMergePipeline", () => {
  it("#1 GmbH mittel mit allem: Cover + TOC + Bilanz/GuV/Anlagenspiegel/Anhang/Lagebericht/Bescheinigung", () => {
    const doc = buildJahresabschlussDocument(baseInput());
    const json = JSON.stringify(doc);
    expect(doc.pageSize).toBe("A4");
    expect(doc.pageMargins).toEqual([40, 60, 40, 60]);
    expect(json).toContain("JAHRESABSCHLUSS");
    expect(json).toContain("INHALTSVERZEICHNIS");
    expect(json).toContain("Bilanz (§ 266 HGB)");
    expect(json).toContain("Gewinn- und Verlustrechnung");
    expect(json).toContain("Anlagenspiegel");
    expect(json).toContain("Anhang");
    expect(json).toContain("Lagebericht");
    expect(json).toContain("Bescheinigung");
  });

  it("#2 bausteine.anhang=false -> keine Anhang-Section", () => {
    const bausteine: JahresabschlussBausteine = {
      ...mittelBausteine(),
      anhang: false,
    };
    const doc = buildJahresabschlussDocument({
      ...baseInput(),
      bausteine,
    });
    const content = doc.content as Array<unknown>;
    const json = JSON.stringify(content);
    // Anhang-Section-Heading darf nicht erscheinen.
    expect(json).not.toContain("Anhang");
    // Auch keiner der Anhang-Baustein-Titel.
    expect(json).not.toContain("Bilanzierungs- und Bewertungsmethoden");
  });

  it("#3 bausteine.lagebericht=false -> keine Lagebericht-Section", () => {
    const bausteine: JahresabschlussBausteine = {
      ...mittelBausteine(),
      lagebericht: false,
    };
    const doc = buildJahresabschlussDocument({
      ...baseInput(),
      bausteine,
    });
    const json = JSON.stringify(doc.content);
    expect(json).not.toContain("Lagebericht");
    expect(json).not.toContain("Wirtschaftsbericht");
  });

  it("#4 Einzelunternehmen: kein Bilanz/GuV/Anhang/Lagebericht, aber Cover+Bescheinigung", () => {
    const bausteine = computeBausteine({
      rechtsform: "Einzelunternehmen",
      groessenklasse: "klein",
    });
    const doc = buildJahresabschlussDocument({
      cover: coverGmbH({
        rechtsform: "Einzelunternehmen",
        hrb_nummer: null,
        hrb_gericht: null,
        groessenklasse: "klein",
      }),
      bausteine,
      // Keine Bilanz/GuV fuer Einzelunternehmen -> leer OK.
    });
    const json = JSON.stringify(doc.content);
    expect(json).toContain("JAHRESABSCHLUSS");
    expect(json).toContain("INHALTSVERZEICHNIS");
    expect(json).not.toContain("Bilanz (§ 266 HGB)");
    expect(json).not.toContain("Gewinn- und Verlustrechnung");
    expect(json).not.toContain("Lagebericht");
    // Einzel hat nur EUeR+Anlagenspiegel+Bescheinigung.
    expect(json).toContain("Bescheinigung");
  });

  it("#5 Berichtsart=Entwurf: docDefinition.watermark gesetzt", () => {
    const doc = buildJahresabschlussDocument({
      ...baseInput(),
      cover: coverGmbH({ berichtsart: "Entwurf" }),
    });
    expect(doc.watermark).toBeDefined();
    const wm = doc.watermark as { text: string };
    expect(wm.text).toContain("ENTWURF");
  });

  it("#6 Berichtsart=Jahresabschluss: kein watermark", () => {
    const doc = buildJahresabschlussDocument(baseInput());
    expect(doc.watermark).toBeUndefined();
  });

  it("#7 Pagebreak nach Cover (leerer Knoten mit pageBreak='after')", () => {
    const doc = buildJahresabschlussDocument(baseInput());
    const content = doc.content as Array<{ pageBreak?: string }>;
    // Irgendwo im Content gibt es mindestens einen pageBreak.
    const hasBreak = content.some(
      (c) =>
        c &&
        typeof c === "object" &&
        "pageBreak" in c &&
        c.pageBreak === "after"
    );
    expect(hasBreak).toBe(true);
  });

  it("#8 Header + Footer-Funktionen liefern erst ab Seite 3 Content", () => {
    const doc = buildJahresabschlussDocument(baseInput());
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const header = doc.header as (c: number, p: number) => any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const footer = doc.footer as (c: number, p: number) => any;
    expect(header(1, 10)).toBe("");
    expect(header(2, 10)).toBe("");
    const h3 = header(3, 10);
    expect(h3).toBeTruthy();
    expect(JSON.stringify(h3)).toContain("Seite 3 / 10");
    expect(footer(1, 10)).toBe("");
    expect(footer(3, 10)).toBeTruthy();
  });

  it("#9 Anhang-Override: editierter Text ersetzt Default-Template", () => {
    const override = {
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [{ type: "text", text: "EDITIERTER ANHANG TEXT" }],
        },
      ],
    };
    const doc = buildJahresabschlussDocument({
      ...baseInput(),
      anhangTexts: {
        "§-284-bilanzierungs-methoden": override,
      },
    });
    const json = JSON.stringify(doc.content);
    expect(json).toContain("EDITIERTER ANHANG TEXT");
    // Das Default-Template ist in diesem Fall NICHT im Output.
    expect(json).not.toContain("Die Aufstellung des Jahresabschlusses erfolgt");
  });

  it("#10 Mini-Stand-Hinweis pro Anhang-Baustein sichtbar", () => {
    const doc = buildJahresabschlussDocument(baseInput());
    const json = JSON.stringify(doc.content);
    expect(json).toContain("Stand der Vorlage: 2025-04");
  });

  it("#11 Section-Headings haben tocItem-Marker + TOC-Style", () => {
    const doc = buildJahresabschlussDocument(baseInput());
    const content = doc.content as Array<{
      tocItem?: string;
      text?: string;
    }>;
    const withTocItem = content.filter((c) => c && c.tocItem);
    expect(withTocItem.length).toBeGreaterThan(3);
  });
});
