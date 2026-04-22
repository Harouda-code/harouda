/**
 * Gemeinsame PDF-Infrastruktur via jsPDF + jspdf-autotable.
 *
 * Nutzung: Subklassen erben von `PdfReportBase` und rufen `addHeader`,
 * `addSection`, `addTable`, `addFooter` an geeigneten Stellen auf.
 *
 * Layout-Konstanten:
 *   - Format A4 Hochformat (default)
 *   - Ränder 20 mm
 *   - Default-Font Helvetica 10pt
 *   - Deutsche Nummernformate (1.234,56 €)
 *
 * jsPDF exponiert `output('blob')` für Browser-Download.
 */

import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { Money } from "../money/Money";

export type PdfOrientation = "portrait" | "landscape";

export type PdfReportOptions = {
  title: string;
  subtitle?: string;
  mandantName: string;
  mandantAddress?: string;
  reportPeriod?: { von: string; bis: string };
  stichtag?: string;
  generatedAt?: Date;
  generatedBy?: string;
  disclaimer?: string;
};

export class PdfReportBase {
  protected pdf: jsPDF;
  protected currentY = 20;
  protected margins = { left: 20, right: 20, top: 20, bottom: 20 };

  constructor(options: { orientation?: PdfOrientation } = {}) {
    this.pdf = new jsPDF({
      orientation: options.orientation ?? "portrait",
      unit: "mm",
      format: "a4",
    });
    this.pdf.setFont("helvetica");
    this.pdf.setFontSize(10);
  }

  /** Seiten-Header mit Mandant + Titel + Zeitraum/Stichtag. */
  addHeader(options: PdfReportOptions): void {
    const { left, right } = this.margins;
    const width = this.pdf.internal.pageSize.getWidth() - left - right;

    // Titel (rechts, groß)
    this.pdf.setFontSize(16);
    this.pdf.setFont("helvetica", "bold");
    this.pdf.text(options.title, this.pdf.internal.pageSize.getWidth() - right, 20, {
      align: "right",
    });

    if (options.subtitle) {
      this.pdf.setFontSize(10);
      this.pdf.setFont("helvetica", "normal");
      this.pdf.text(
        options.subtitle,
        this.pdf.internal.pageSize.getWidth() - right,
        26,
        { align: "right" }
      );
    }

    // Mandant (links, oben)
    this.pdf.setFontSize(11);
    this.pdf.setFont("helvetica", "bold");
    this.pdf.text(options.mandantName, left, 20);
    if (options.mandantAddress) {
      this.pdf.setFontSize(9);
      this.pdf.setFont("helvetica", "normal");
      this.pdf.text(options.mandantAddress, left, 26);
    }

    // Zeitraum / Stichtag + Generated-At
    this.pdf.setFontSize(8);
    this.pdf.setFont("helvetica", "normal");
    let meta = "";
    if (options.stichtag) meta += `Stichtag: ${options.stichtag}`;
    if (options.reportPeriod) {
      if (meta) meta += " · ";
      meta += `Zeitraum: ${options.reportPeriod.von} – ${options.reportPeriod.bis}`;
    }
    if (meta) this.pdf.text(meta, left, 34);

    const ts = (options.generatedAt ?? new Date()).toLocaleString("de-DE");
    this.pdf.text(
      `Erstellt: ${ts}`,
      this.pdf.internal.pageSize.getWidth() - right,
      34,
      { align: "right" }
    );

    // Trennlinie
    this.pdf.setDrawColor(200, 200, 200);
    this.pdf.line(left, 38, left + width, 38);

    this.currentY = 45;
  }

  addSection(title: string): void {
    if (this.currentY > this.pdf.internal.pageSize.getHeight() - 40) {
      this.pdf.addPage();
      this.currentY = 20;
    }
    this.pdf.setFontSize(12);
    this.pdf.setFont("helvetica", "bold");
    this.pdf.text(title, this.margins.left, this.currentY);
    this.pdf.setDrawColor(100, 100, 100);
    this.pdf.line(
      this.margins.left,
      this.currentY + 1,
      this.margins.left + 40,
      this.currentY + 1
    );
    this.currentY += 6;
    this.pdf.setFontSize(10);
    this.pdf.setFont("helvetica", "normal");
  }

  addKeyValue(
    key: string,
    value: string,
    opts: { bold?: boolean; color?: [number, number, number] } = {}
  ): void {
    if (this.currentY > this.pdf.internal.pageSize.getHeight() - 20) {
      this.pdf.addPage();
      this.currentY = 20;
    }
    if (opts.bold) this.pdf.setFont("helvetica", "bold");
    if (opts.color) this.pdf.setTextColor(...opts.color);
    this.pdf.text(key, this.margins.left, this.currentY);
    this.pdf.text(value, this.pdf.internal.pageSize.getWidth() - this.margins.right, this.currentY, {
      align: "right",
    });
    if (opts.bold) this.pdf.setFont("helvetica", "normal");
    if (opts.color) this.pdf.setTextColor(0, 0, 0);
    this.currentY += 5;
  }

  /** Tabelle via jspdf-autotable. */
  addTable(
    headers: string[],
    rows: (string | number)[][],
    options: {
      columnWidths?: number[];
      highlightRows?: number[];
      rightAlignColumns?: number[];
      headerFill?: [number, number, number];
    } = {}
  ): void {
    const startY = this.currentY;
    const rightAlign = new Set(options.rightAlignColumns ?? []);
    const highlight = new Set(options.highlightRows ?? []);
    autoTable(this.pdf, {
      head: [headers],
      body: rows.map((r) => r.map((c) => String(c))),
      startY,
      margin: { left: this.margins.left, right: this.margins.right },
      styles: { fontSize: 9, cellPadding: 1.5 },
      headStyles: {
        fillColor: options.headerFill ?? [230, 230, 235],
        textColor: [20, 20, 20],
        fontStyle: "bold",
      },
      columnStyles: headers.reduce(
        (acc, _h, i) => {
          const style: Record<string, unknown> = {};
          if (options.columnWidths?.[i]) style.cellWidth = options.columnWidths[i];
          if (rightAlign.has(i)) style.halign = "right";
          acc[i] = style;
          return acc;
        },
        {} as Record<number, Record<string, unknown>>
      ),
      didParseCell(data) {
        if (data.section === "body" && highlight.has(data.row.index)) {
          data.cell.styles.fontStyle = "bold";
          data.cell.styles.fillColor = [245, 245, 248];
        }
      },
    });
    // autoTable setzt pdf.lastAutoTable.finalY
    const lastAutoTable = (this.pdf as unknown as {
      lastAutoTable?: { finalY: number };
    }).lastAutoTable;
    this.currentY = (lastAutoTable?.finalY ?? startY) + 4;
  }

  /** Footer mit Seitenzahlen + Disclaimer. */
  addFooter(options: PdfReportOptions): void {
    const pageCount = this.pdf.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      this.pdf.setPage(i);
      this.pdf.setFontSize(8);
      this.pdf.setFont("helvetica", "normal");
      this.pdf.setTextColor(120, 120, 120);
      const pageHeight = this.pdf.internal.pageSize.getHeight();
      // Disclaimer links
      if (options.disclaimer) {
        this.pdf.text(options.disclaimer, this.margins.left, pageHeight - 10);
      }
      // Seitenzahl rechts
      this.pdf.text(
        `Seite ${i} / ${pageCount}`,
        this.pdf.internal.pageSize.getWidth() - this.margins.right,
        pageHeight - 10,
        { align: "right" }
      );
      this.pdf.setTextColor(0, 0, 0);
    }
  }

  /** Formatiert einen Money-String als "1.234,56 €". */
  formatMoney(m: Money | string): string {
    return typeof m === "string"
      ? new Money(m).toEuroFormat()
      : m.toEuroFormat();
  }

  toBlob(): Blob {
    return this.pdf.output("blob");
  }

  save(filename: string): void {
    this.pdf.save(filename);
  }
}
