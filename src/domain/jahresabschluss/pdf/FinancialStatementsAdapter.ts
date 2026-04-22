/**
 * Financial-Statements-Adapter (Sprint E4 / Schritt 1).
 *
 * Bruecke zwischen den existierenden Domain-Buildern
 * (BalanceSheetBuilder, GuvBuilder, AnlagenService) und dem pdfmake-
 * Content-Format, das DocumentMergePipeline erwartet.
 *
 * Kein Rechnen in diesem Modul — alle Zahlen kommen aus den
 * upstream Reports (Money.toEuroFormat() bzw. number.toFixed(2)).
 * Pure-View-Layer.
 */
import type { Content } from "pdfmake/interfaces";
import type {
  BalanceNode,
  CompositeNode,
} from "../../accounting/BalanceNode";
import type { BalanceSheetReport } from "../../accounting/BalanceSheetBuilder";
import type { GuvReport, GuvLineView } from "../../accounting/GuvBuilder";
import type { AnlagenspiegelData } from "../../anlagen/AnlagenService";
import { Money } from "../../../lib/money/Money";

/** Formatiert einen toFixed2-String als "1.234,56 €". */
function eur(s: string): string {
  if (s === "" || s === "—") return "—";
  return new Money(s).toEuroFormat();
}

/** Formatiert eine number als "1.234,56 €". */
function eurNum(n: number): string {
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);
}

// ─────────────────────────────────────────────────────────────
// Bilanz (§ 266 HGB)
// ─────────────────────────────────────────────────────────────

type BalanceRow = {
  referenceCode: string;
  name: string;
  saldo: string;
  depth: number;
  isSummary: boolean;
};

function flattenBalanceTree(
  root: CompositeNode,
  out: BalanceRow[] = [],
  depth = 0
): BalanceRow[] {
  // Root selbst kommt nicht in die Liste — nur seine Kinder.
  for (const child of root.getChildren()) {
    visitBalanceNode(child, out, depth);
  }
  return out;
}

function visitBalanceNode(
  node: BalanceNode,
  out: BalanceRow[],
  depth: number
): void {
  const children = node.getChildren();
  const saldo = node.getBalance().toEuroFormat();
  const isSummary = children.length > 0;
  out.push({
    referenceCode: node.referenceCode,
    name: node.name,
    saldo,
    depth,
    isSummary,
  });
  for (const c of children) {
    visitBalanceNode(c, out, depth + 1);
  }
  // Leaf-Entries (einzelne Konten-Salden) werden bewusst NICHT
  // eingeblendet — der User will eine § 266-Grob-Bilanz, nicht die
  // Konten-Saldenliste.
}

function rowsToPdfmakeTable(rows: BalanceRow[], title: string): Content {
  const body: Content[][] = [
    [
      { text: title, bold: true, fillColor: "#eee" },
      { text: "EUR", alignment: "right", bold: true, fillColor: "#eee" },
    ],
  ];
  for (const row of rows) {
    const indent = 6 * row.depth;
    const bold = row.isSummary && row.depth <= 1;
    body.push([
      {
        text: `${row.referenceCode} ${row.name}`,
        bold,
        margin: [indent, 0, 0, 0],
      },
      {
        text: row.saldo,
        alignment: "right",
        bold,
      },
    ]);
  }
  return {
    table: {
      headerRows: 1,
      widths: ["*", "auto"],
      body,
    },
    margin: [0, 0, 0, 12],
    layout: "lightHorizontalLines",
  };
}

export function bilanzToPdfmakeContent(
  report: BalanceSheetReport
): Content[] {
  if (!report) return [];
  const aktivaRows = flattenBalanceTree(report.aktivaRoot);
  const passivaRows = flattenBalanceTree(report.passivaRoot);

  const aktivaTable = rowsToPdfmakeTable(aktivaRows, "Aktiva");
  const passivaTable = rowsToPdfmakeTable(passivaRows, "Passiva");

  // Summenzeilen unterhalb der Tabelle (ausserhalb, damit das Layout
  // nicht durch pdfmake-row-Styling gestoert wird).
  const aktivaSum: Content = {
    columns: [
      { text: "Summe Aktiva", bold: true, width: "*" },
      {
        text: eur(report.aktivaSum),
        bold: true,
        alignment: "right",
        width: "auto",
      },
    ],
    margin: [0, 0, 0, 16],
  };
  const passivaSum: Content = {
    columns: [
      { text: "Summe Passiva", bold: true, width: "*" },
      {
        text: eur(report.passivaSum),
        bold: true,
        alignment: "right",
        width: "auto",
      },
    ],
    margin: [0, 0, 0, 4],
  };

  const footnote: Content[] = [];
  if (report.balancierungsDifferenz && report.balancierungsDifferenz !== "0.00") {
    footnote.push({
      text:
        `Balancierungsdifferenz: ${eur(report.balancierungsDifferenz)} ` +
        "(entspricht dem vorläufigen Ergebnis vor Vortrag).",
      fontSize: 8,
      color: "#666",
      margin: [0, 4, 0, 8],
    });
  }

  return [
    { text: `Stichtag: ${report.stichtag}`, fontSize: 9, color: "#555", margin: [0, 0, 0, 6] },
    aktivaTable,
    aktivaSum,
    passivaTable,
    passivaSum,
    ...footnote,
  ];
}

// ─────────────────────────────────────────────────────────────
// GuV (§ 275 HGB)
// ─────────────────────────────────────────────────────────────

export function guvToPdfmakeContent(report: GuvReport): Content[] {
  if (!report) return [];

  // UKV derzeit nicht unterstuetzt — klarer Hinweis statt falscher
  // Ausgabe.
  if (report.verfahren === "UKV") {
    return [
      {
        text:
          "GuV nach Umsatzkostenverfahren (UKV, § 275 Abs. 3 HGB) " +
          "ist in dieser Version noch nicht implementiert.",
        color: "#a33",
        bold: true,
        margin: [0, 0, 0, 8],
      },
      {
        text:
          "Fallback: Die Posten werden als Strukturliste ohne " +
          "UKV-Gliederung ausgegeben. Bitte manuell prüfen.",
        fontSize: 9,
        color: "#555",
        margin: [0, 0, 0, 12],
      },
      guvRenderPositions(report.positionen),
    ];
  }

  return [
    {
      text: `Geschäftsjahr: ${report.periodStart} – ${report.periodEnd}`,
      fontSize: 9,
      color: "#555",
      margin: [0, 0, 0, 6],
    },
    guvRenderPositions(report.positionen),
    {
      columns: [
        { text: "Jahresergebnis", bold: true, width: "*" },
        {
          text: eur(report.jahresergebnis),
          bold: true,
          alignment: "right",
          width: "auto",
          decoration: "underline",
          decorationStyle: "double",
        },
      ],
      margin: [0, 8, 0, 0],
    },
  ];
}

function guvRenderPositions(positionen: GuvLineView[]): Content {
  const body: Content[][] = [
    [
      { text: "Position", bold: true, fillColor: "#eee" },
      { text: "EUR", alignment: "right", bold: true, fillColor: "#eee" },
    ],
  ];
  for (const line of positionen) {
    const indent = 6 * line.depth;
    const isBold = line.isSubtotal || line.isFinalResult;
    body.push([
      {
        text: `${line.reference_code}  ${line.name}`,
        bold: isBold,
        margin: [indent, 0, 0, 0],
        ...(line.isFinalResult
          ? { decoration: "underline", decorationStyle: "double" }
          : {}),
      },
      {
        text: eur(line.amount),
        alignment: "right",
        bold: isBold,
      },
    ]);
  }
  return {
    table: {
      headerRows: 1,
      widths: ["*", "auto"],
      body,
    },
    layout: "lightHorizontalLines",
    margin: [0, 0, 0, 8],
  };
}

// ─────────────────────────────────────────────────────────────
// Anlagenspiegel (§ 284 HGB / § 268 Abs. 2 HGB)
// ─────────────────────────────────────────────────────────────

function formatAnlagenGruppeLabel(
  konto: string,
  bezeichnungen: string[] | undefined
): string {
  if (!bezeichnungen || bezeichnungen.length === 0) return konto;
  const visible = bezeichnungen.slice(0, 3).join(", ");
  const rest = bezeichnungen.length - 3;
  const suffix = rest > 0 ? ` · und ${rest} weitere` : "";
  return `${konto} · ${visible}${suffix}`;
}

export function anlagenspiegelToPdfmakeContent(
  data: AnlagenspiegelData
): Content[] {
  if (!data) return [];

  const head: Content[] = [
    { text: "Anlage", bold: true, fillColor: "#eee" },
    { text: "AK 01.01.", alignment: "right", bold: true, fillColor: "#eee" },
    { text: "Zugänge", alignment: "right", bold: true, fillColor: "#eee" },
    { text: "Abgänge", alignment: "right", bold: true, fillColor: "#eee" },
    { text: "AK 31.12.", alignment: "right", bold: true, fillColor: "#eee" },
    { text: "AfA kum.", alignment: "right", bold: true, fillColor: "#eee" },
    {
      text: "Buchwert 31.12.",
      alignment: "right",
      bold: true,
      fillColor: "#eee",
    },
  ];

  const body: Content[][] = [head];
  for (const g of data.gruppen) {
    // Konto-Nummer + max. 3 Bezeichnungen, Rest als "… und N weitere".
    const bezLabel = formatAnlagenGruppeLabel(g.konto_anlage, g.bezeichnungen);
    body.push([
      { text: bezLabel } as Content,
      { text: eurNum(g.ak_start), alignment: "right" } as Content,
      { text: eurNum(g.zugaenge), alignment: "right" } as Content,
      { text: eurNum(g.abgaenge), alignment: "right" } as Content,
      { text: eurNum(g.ak_ende), alignment: "right" } as Content,
      { text: eurNum(g.abschreibungen_kumuliert), alignment: "right" } as Content,
      { text: eurNum(g.buchwert_ende), alignment: "right" } as Content,
    ]);
  }
  // Summenzeile.
  const t = data.totals;
  body.push([
    { text: "Summe", bold: true, fillColor: "#f6f6f6" } as Content,
    { text: eurNum(t.ak_start), alignment: "right", bold: true, fillColor: "#f6f6f6" } as Content,
    { text: eurNum(t.zugaenge), alignment: "right", bold: true, fillColor: "#f6f6f6" } as Content,
    { text: eurNum(t.abgaenge), alignment: "right", bold: true, fillColor: "#f6f6f6" } as Content,
    { text: eurNum(t.ak_ende), alignment: "right", bold: true, fillColor: "#f6f6f6" } as Content,
    { text: eurNum(t.abschreibungen_kumuliert), alignment: "right", bold: true, fillColor: "#f6f6f6" } as Content,
    { text: eurNum(t.buchwert_ende), alignment: "right", bold: true, fillColor: "#f6f6f6" } as Content,
  ]);

  return [
    {
      text: `Anlagenspiegel zum 31.12.${data.bis_jahr}`,
      fontSize: 9,
      color: "#555",
      margin: [0, 0, 0, 6],
    },
    {
      table: {
        headerRows: 1,
        widths: ["auto", "*", "*", "*", "*", "*", "*"],
        body,
      },
      layout: "lightHorizontalLines",
      margin: [0, 0, 0, 12],
    },
  ];
}
