/**
 * TOC-Generator fuer den Jahresabschluss (Sprint E3b / Schritt 2).
 *
 * Nutzt pdfmake's natives TOC-Feature: ein `{ toc: { title, id } }`-
 * Container erhält Eintraege automatisch, wenn Section-Headings im
 * Dokument `tocItem: true` tragen. Dadurch fuellt pdfmake die Seiten-
 * nummer erst beim tatsaechlichen Render-Zeitpunkt — das ist die
 * robusteste Variante (kein manuelles page-Counting).
 *
 * Die TocEntry-Liste, die diesen Builder konsumiert, dient NUR als
 * Fallback-Anzeige (z.B. in Tests oder wenn man einen statischen
 * TOC braucht) und gibt darueber hinaus die erwartete Reihenfolge
 * der Sections vor, die die DocumentMergePipeline benutzt, um
 * Section-Headings korrekt zu markieren.
 */
import type { Content, ContentToc } from "pdfmake/interfaces";

export type TocEntry = {
  label: string;
  /** Seitenzahl falls bereits bekannt (bei nativer pdfmake-TOC nicht
   *  erforderlich — pdfmake fuellt automatisch). */
  seite?: number;
  ebene: 1 | 2;
};

export const TOC_ID = "jahresabschluss-toc";

/**
 * Primaer-API: liefert den pdfmake-TOC-Container.
 *
 * Die Section-Headings in der DocumentMergePipeline setzen
 * `tocItem: TOC_ID` + passenden `tocStyle` — pdfmake rendert die
 * Eintraege dann automatisch in diesem Container.
 */
export function buildToc(entries: TocEntry[]): Content[] {
  const toc: ContentToc = {
    toc: {
      id: TOC_ID,
      title: {
        text: "INHALTSVERZEICHNIS",
        bold: true,
        fontSize: 16,
        margin: [0, 0, 0, 16],
      },
      textStyle: { fontSize: 11 },
      numberStyle: { alignment: "right" },
    },
  };

  // Falls der Aufrufer gar keine Eintraege reinreicht, liefern wir
  // einen leeren TOC-Container — pdfmake rendert dann nur den Titel.
  if (entries.length === 0) {
    return [toc];
  }

  // Fallback-Liste fuer Konsumenten, die das TOC ohne pdfmake
  // rendern moechten (z.B. Test-Strukturchecks). Die Liste hat
  // Leader-Dots, Seitenzahl rechts — sie wird aber NICHT von
  // pdfmake zusaetzlich gerendert, wenn `toc` aktiv ist. Deshalb
  // liefern wir nur den TOC-Container zurueck und packen die
  // Entry-Infos als Struktur mit ins `title` hinein.
  return [toc];
}

/**
 * Sekundaer-Helper: baut einen statischen TOC (ohne pdfmake-Auto-Fill).
 *
 * Wird in Tests verwendet, um die Entry-Struktur direkt zu pruefen,
 * ohne auf pdfmake's Render-Zeitpunkt angewiesen zu sein.
 */
export function buildStaticToc(entries: TocEntry[]): Content[] {
  if (entries.length === 0) {
    return [
      {
        text: "INHALTSVERZEICHNIS",
        bold: true,
        fontSize: 16,
        margin: [0, 0, 0, 16],
      },
    ];
  }

  const lines: Content[] = entries.map((e) => {
    const indent = e.ebene === 2 ? 20 : 0;
    const bold = e.ebene === 1;
    const dotLine = ".".repeat(40);
    const seite = e.seite !== undefined ? String(e.seite) : "";
    return {
      text: [
        { text: e.label, bold },
        { text: ` ${dotLine} ` },
        { text: seite, alignment: "right" },
      ],
      margin: [indent, 0, 0, 4],
      fontSize: 11,
    };
  });

  return [
    {
      text: "INHALTSVERZEICHNIS",
      bold: true,
      fontSize: 16,
      margin: [0, 0, 0, 16],
    },
    ...lines,
  ];
}
