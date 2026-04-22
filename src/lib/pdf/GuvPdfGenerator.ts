/**
 * GuV-PDF-Generator (HGB § 275 Abs. 2, GKV).
 *
 * Einzeilige Tabelle mit Nummer, Bezeichnung, Betrag. Zwischensummen +
 * Jahresergebnis hervorgehoben.
 */

import type { GuvReport } from "../../domain/accounting/GuvBuilder";
import { Money } from "../money/Money";
import { PdfReportBase, type PdfReportOptions } from "./PdfBase";

export class GuvPdfGenerator extends PdfReportBase {
  generate(guv: GuvReport, options: PdfReportOptions): Blob {
    this.addHeader({
      ...options,
      title: "Gewinn- und Verlustrechnung",
      subtitle: `§ 275 Abs. 2 HGB (GKV) · Zeitraum ${guv.periodStart} – ${guv.periodEnd}`,
    });

    this.addSection("Posten");
    const rows: (string | number)[][] = [];
    const highlight: number[] = [];
    for (const p of guv.positionen) {
      const isSubtotal = p.isSubtotal || p.isFinalResult;
      rows.push([
        p.reference_code,
        p.name,
        p.hgbParagraph,
        this.formatMoney(p.amountRaw),
      ]);
      if (isSubtotal) highlight.push(rows.length - 1);
    }
    this.addTable(
      ["Nr.", "Bezeichnung", "Fundstelle", "Betrag"],
      rows,
      {
        columnWidths: [20, 80, 50, 30],
        rightAlignColumns: [3],
        highlightRows: highlight,
      }
    );

    this.currentY += 4;
    const jerIsPositive = !new Money(guv.jahresergebnis).isNegative();
    this.addKeyValue(
      "Jahresergebnis (Nr. 17)",
      this.formatMoney(guv.jahresergebnis),
      {
        bold: true,
        color: jerIsPositive ? [31, 122, 77] : [138, 44, 44],
      }
    );

    this.addFooter({
      ...options,
      disclaimer:
        "NACHGEBILDETE DARSTELLUNG · § 275 HGB · Zwischensummen sind nicht in § 275 normiert",
    });

    return this.toBlob();
  }
}
