/**
 * Document-Merge-Pipeline fuer den Jahresabschluss (Sprint E3b / Schritt 4).
 *
 * Baut aus Cover + Sections + Anhang + Lagebericht + Bescheinigung
 * ein pdfmake-TDocumentDefinitions-Objekt zusammen, das in der
 * StepReview-Komponente per `pdfMake.createPdf(...)` in ein PDF-Blob
 * umgesetzt wird.
 *
 * HAFTUNGSHINWEIS: Dieses Dokument ist eine Vorlage-basierte Ausgabe.
 * Rechtliche Verantwortung fuer Inhalt, Vollstaendigkeit und
 * gesetzliche Aktualitaet liegt beim Nutzer. Siehe
 * TEXTBAUSTEINE-UPDATE-GUIDE.md fuer Wartung.
 */
import type {
  Content,
  ContentTable,
  TDocumentDefinitions,
} from "pdfmake/interfaces";
import type { JSONContent } from "@tiptap/react";
import type { JahresabschlussBausteine } from "../WizardTypes";
import {
  buildCoverPage,
  type CoverPageInput,
} from "./CoverPageBuilder";
import { buildToc, TOC_ID } from "./TocBuilder";
import { tiptapToPdfmake } from "../tiptapToPdfmake";
import {
  ANHANG_TEXTBAUSTEINE,
  getBausteineFuer as getAnhangFuer,
  type Textbaustein,
  type Groessenklasse,
} from "../anhangTextbausteine";
import {
  LAGEBERICHT_TEXTBAUSTEINE,
  getLageberichtFuer,
} from "../lageberichtTextbausteine";
import { buildWatermark } from "./Watermark";
import {
  buildBescheinigung,
  type BescheinigungInput,
} from "./BescheinigungBuilder";
import type { BalanceSheetReport } from "../../accounting/BalanceSheetBuilder";
import type { GuvReport } from "../../accounting/GuvBuilder";
import type { AnlagenspiegelData } from "../../anlagen/AnlagenService";
import {
  bilanzToPdfmakeContent,
  guvToPdfmakeContent,
  anlagenspiegelToPdfmakeContent,
} from "./FinancialStatementsAdapter";

export type JahresabschlussDocumentInput = {
  cover: CoverPageInput;
  bausteine: JahresabschlussBausteine;
  /** Vor-gerenderte Content-Blocks (Platzhalter-Pfad, bleibt aus
   *  Backwards-Kompatibilitaet). */
  bilanz?: Content[];
  guv?: Content[];
  anlagenspiegel?: Content[];
  /** Echte Report-Objekte der Domain-Builder. Wenn gesetzt,
   *  ueberschreibt die Pipeline die entsprechenden Platzhalter via
   *  FinancialStatementsAdapter. */
  bilanzReport?: BalanceSheetReport;
  guvReport?: GuvReport;
  anlagenspiegelReport?: AnlagenspiegelData;
  /** Map baustein-id → editiertes TipTap-JSON.
   *  Fehlt eine ID, verwendet die Pipeline das Default-Template. */
  anhangTexts?: Record<string, JSONContent>;
  lageberichtTexts?: Record<string, JSONContent>;
  /** Alt-Pfad — Platzhalter-Content fuer die Bescheinigung.
   *  Sprint 17.5: von `bescheinigungInput` abgeloest (BStBK-konform). */
  bescheinigung?: Content[];
  /** Sprint 17.5 — Erlaeuterungsbericht (free-form TipTap-JSON).
   *  Wird nach GuV/Anlagenspiegel vor Anhang gerendert, wenn non-empty. */
  erlaeuterungen_text?: JSONContent;
  /** Sprint 17.5 — BStBK-Bescheinigung mit Whitelist-Placeholder-
   *  Substitution. Hat Prio vor `bescheinigung`-Content. */
  bescheinigungInput?: BescheinigungInput;
  /** Nur fuer Lagebericht-Filter (§ 289 Abs. 4 HGB) relevant. */
  kapitalmarktorientiert?: boolean;
};

/** Section-Heading mit TOC-Hook und automatischem Pagebreak davor. */
function sectionHeading(label: string, ebene: 1 | 2 = 1): Content {
  return {
    text: label,
    bold: ebene === 1,
    fontSize: ebene === 1 ? 16 : 13,
    margin: ebene === 1 ? [0, 0, 0, 12] : [0, 8, 0, 6],
    pageBreak: ebene === 1 ? "before" : undefined,
    tocItem: TOC_ID,
    tocStyle: ebene === 1 ? { bold: true } : { italics: true },
    tocMargin: ebene === 1 ? [0, 4, 0, 0] : [16, 0, 0, 0],
  };
}

function miniStandHinweis(versionStand: string): Content {
  return {
    text: `Stand der Vorlage: ${versionStand}`,
    alignment: "right",
    fontSize: 8,
    color: "#666",
    margin: [0, 6, 0, 6],
  };
}

function sectionSeparator(): Content {
  return {
    canvas: [
      {
        type: "line",
        x1: 0,
        y1: 0,
        x2: 515,
        y2: 0,
        lineWidth: 0.5,
        lineColor: "#bbb",
      },
    ],
    margin: [0, 6, 0, 14],
  };
}

/** Konvertiert Rechtsform aus Wizard in den Filter-Typ fuer die
 *  Textbaustein-Bibliotheken. */
function toFilterRechtsform(
  rechtsform: CoverPageInput["rechtsform"]
): "Kapitalgesellschaft" | "Personengesellschaft" | "Einzel" {
  if (rechtsform === "Einzelunternehmen") return "Einzel";
  if (
    rechtsform === "GbR" ||
    rechtsform === "PartG" ||
    rechtsform === "OHG" ||
    rechtsform === "KG"
  ) {
    return "Personengesellschaft";
  }
  return "Kapitalgesellschaft";
}

function renderBausteinBlock(
  baustein: Textbaustein,
  override: JSONContent | undefined
): Content[] {
  const title = `${baustein.titel} (${baustein.paragraph_verweis})`;
  const body = tiptapToPdfmake(override ?? baustein.tiptap_template);
  return [
    sectionHeading(title, 2),
    ...body,
    miniStandHinweis(baustein.version_stand),
    sectionSeparator(),
  ];
}

/** Lookup-Helper mit Fallback auf das komplette Array. */
function findBaustein(
  library: Textbaustein[],
  id: string
): Textbaustein | undefined {
  return library.find((b) => b.id === id);
}

/**
 * Haupt-Einstieg: produziert das vollstaendige pdfmake-Dokument-
 * Definitionen-Objekt. KEIN Download — dieser Schritt gehoert
 * in den UI-Layer (StepReview).
 */
export function buildJahresabschlussDocument(
  input: JahresabschlussDocumentInput
): TDocumentDefinitions {
  const content: Content[] = [];

  // 1. Cover (Seite 1).
  content.push(...buildCoverPage(input.cover));
  content.push({ text: "", pageBreak: "after" });

  // 2. TOC (Seite 2). pdfmake fuellt Eintraege auto aus Sections.
  content.push(...buildToc([]));
  // Keine manuellen tocItems — pdfmake sammelt sie beim Render.

  // 3. Bilanz. Report-Pfad hat Prio vor Platzhalter-Content.
  if (input.bausteine.bilanz) {
    const bilanzContent = input.bilanzReport
      ? bilanzToPdfmakeContent(input.bilanzReport)
      : input.bilanz ?? [];
    if (bilanzContent.length > 0) {
      content.push(sectionHeading("Bilanz (§ 266 HGB)"));
      content.push(...bilanzContent);
    }
  }

  // 4. GuV.
  if (input.bausteine.guv) {
    const guvContent = input.guvReport
      ? guvToPdfmakeContent(input.guvReport)
      : input.guv ?? [];
    if (guvContent.length > 0) {
      content.push(sectionHeading("Gewinn- und Verlustrechnung (§ 275 HGB)"));
      content.push(...guvContent);
    }
  }

  // 5. Anlagenspiegel.
  if (input.bausteine.anlagenspiegel) {
    const spiegelContent = input.anlagenspiegelReport
      ? anlagenspiegelToPdfmakeContent(input.anlagenspiegelReport)
      : input.anlagenspiegel ?? [];
    if (spiegelContent.length > 0) {
      content.push(sectionHeading("Anlagenspiegel"));
      content.push(...spiegelContent);
    }
  }

  // 5b. Sprint 17.5 — Erlaeuterungsbericht (free-form). Nach GuV/
  // Anlagenspiegel, vor Anhang. Nur wenn erlaeuterungen_text gesetzt
  // UND non-empty (leerer Editor → skip).
  if (input.erlaeuterungen_text) {
    const erlaeuterungenContent = tiptapToPdfmake(input.erlaeuterungen_text);
    if (erlaeuterungenContent.length > 0) {
      content.push(sectionHeading("Erläuterungsbericht"));
      content.push(...erlaeuterungenContent);
    }
  }

  // 6. Anhang — nur wenn aktiviert.
  if (input.bausteine.anhang) {
    content.push(sectionHeading("Anhang"));
    const filterRf = toFilterRechtsform(input.cover.rechtsform);
    const selected = getAnhangFuer({
      rechtsform: filterRf,
      groessenklasse: input.cover.groessenklasse as Groessenklasse,
    });
    for (const baustein of selected) {
      const override = input.anhangTexts?.[baustein.id];
      content.push(
        ...renderBausteinBlock(
          findBaustein(ANHANG_TEXTBAUSTEINE, baustein.id) ?? baustein,
          override
        )
      );
    }
  }

  // 7. Lagebericht — nur wenn aktiviert.
  if (input.bausteine.lagebericht) {
    content.push(sectionHeading("Lagebericht"));
    const selected = getLageberichtFuer({
      rechtsform: toFilterRechtsform(input.cover.rechtsform),
      groessenklasse: input.cover.groessenklasse as Groessenklasse,
      kapitalmarktorientiert: input.kapitalmarktorientiert ?? false,
    });
    for (const baustein of selected) {
      const override = input.lageberichtTexts?.[baustein.id];
      content.push(
        ...renderBausteinBlock(
          findBaustein(LAGEBERICHT_TEXTBAUSTEINE, baustein.id) ?? baustein,
          override
        )
      );
    }
  }

  // 8. Bescheinigung. Sprint 17.5: bescheinigungInput (BStBK-Daten) hat
  // Prio vor dem alten Platzhalter-Content-Pfad.
  if (input.bausteine.bescheinigung) {
    if (input.bescheinigungInput) {
      // Kein separates Section-Heading — der BescheinigungBuilder
      // setzt pageBreak + zentrierten Titel selbst.
      const r = buildBescheinigung(input.bescheinigungInput);
      content.push(...r.content);
    } else if (input.bescheinigung && input.bescheinigung.length > 0) {
      content.push(sectionHeading("Bescheinigung"));
      content.push(...input.bescheinigung);
    } else {
      content.push(sectionHeading("Bescheinigung"));
      content.push({
        text:
          "Die vorstehende Erstellung des Jahresabschlusses erfolgte unter " +
          "Beachtung der handelsrechtlichen Vorschriften auf der Grundlage " +
          "der von der Geschäftsführung vorgelegten Belege und Angaben.",
        margin: [0, 0, 0, 12],
      });
      content.push({
        text: [
          "Ort, Datum: ",
          "_____________________________________________",
        ],
        margin: [0, 24, 0, 24],
      });
      content.push({
        text: "Unterschrift: ___________________________________________",
        margin: [0, 8, 0, 0],
      });
    }
  }

  // 9. Footer-Hinweis am Dokumentende (NICHT docDefinition.footer,
  //    damit er nur einmal erscheint).
  content.push({
    text: `Vorlagen nach HGB 2025 — Stand der Erstellung: ${input.cover.erstellt_am}.`,
    alignment: "center",
    fontSize: 8,
    color: "#555",
    margin: [0, 24, 0, 0],
  });

  // --- Header / Footer dynamisch ---
  const firma = `${input.cover.firmenname} ${input.cover.rechtsform}`;
  const stichtag = input.cover.stichtag;

  const docDef: TDocumentDefinitions = {
    pageSize: "A4",
    pageMargins: [40, 60, 40, 60],
    content,
    defaultStyle: {
      fontSize: 10,
    },
    header: (currentPage, pageCount) => {
      // Header erst ab Seite 3 (nach Cover + TOC).
      if (currentPage <= 2) return "";
      return {
        columns: [
          {
            text: `${firma} — Jahresabschluss zum ${stichtag}`,
            alignment: "left",
            fontSize: 8,
            color: "#666",
          },
          {
            text: `Seite ${currentPage} / ${pageCount}`,
            alignment: "right",
            fontSize: 8,
            color: "#666",
          },
        ],
        margin: [40, 20, 40, 0],
      };
    },
    footer: (currentPage) => {
      if (currentPage <= 2) return "";
      return {
        text: `Stand ${input.cover.erstellt_am} — Vorlagen nach HGB 2025`,
        alignment: "center",
        fontSize: 8,
        color: "#888",
        margin: [40, 0, 40, 20],
      };
    },
  };

  // Entwurfs-Watermark (diagonal, auf jeder Seite).
  if (input.cover.berichtsart === "Entwurf") {
    docDef.watermark = buildWatermark({
      text: "ENTWURF – Nicht zur Veröffentlichung",
    });
  }

  return docDef;
}

/** Helper: baut einen einfachen pdfmake-Content-Block aus einer
 *  Bilanz-Tabelle (body-Rows als string[]). Nur als Adapter fuer
 *  Tests gedacht — der produktive Builder aus BilanzPdfGenerator
 *  liefert reichere Strukturen. */
export function tableFromRows(header: string[], rows: string[][]): ContentTable {
  return {
    table: {
      headerRows: 1,
      widths: header.map(() => "auto" as const),
      body: [header, ...rows],
    },
    margin: [0, 0, 0, 12],
  };
}
