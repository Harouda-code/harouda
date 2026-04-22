/**
 * Bilanz-PDF-Generator (HGB § 266).
 *
 * Erzeugt eine zweispaltige Darstellung (AKTIVA links, PASSIVA rechts) mit
 * hierarchischen Einrückungen und Zwischensummen-Hervorhebung. Am Ende
 * Bilanzierungs-Check (Aktiva = Passiva).
 */

import type { BalanceSheetReport } from "../../domain/accounting/BalanceSheetBuilder";
import { flattenForRender } from "../../domain/accounting/BalanceSheetBuilder";
import { Money } from "../money/Money";
import { PdfReportBase, type PdfReportOptions } from "./PdfBase";

export class BilanzPdfGenerator extends PdfReportBase {
  generate(
    bilanz: BalanceSheetReport,
    options: PdfReportOptions
  ): Blob {
    this.addHeader({
      ...options,
      title: "Bilanz",
      subtitle: `Nachgebildet nach § 266 HGB · Stichtag ${bilanz.stichtag}`,
    });

    // AKTIVA
    this.addSection("AKTIVA");
    const aktivaRows: (string | number)[][] = [];
    const aktivaHighlight: number[] = [];
    const aktivaRowsAll = flattenForRender(bilanz.aktivaRoot).slice(1);
    aktivaRowsAll.forEach((row, idx) => {
      if (row.isLeafEntry) return; // Leaf-Buckets nicht zeigen (redundant)
      const indent = "  ".repeat(row.depth);
      aktivaRows.push([
        row.node.referenceCode,
        indent + row.node.name,
        row.balance.isZero() ? "" : this.formatMoney(row.balance),
      ]);
      if (row.depth <= 1) aktivaHighlight.push(aktivaRows.length - 1);
    });
    this.addTable(["Ref", "Bezeichnung", "Betrag"], aktivaRows, {
      columnWidths: [25, 110, 35],
      rightAlignColumns: [2],
      highlightRows: aktivaHighlight,
    });
    this.addKeyValue("Summe Aktiva", this.formatMoney(bilanz.aktivaSum), {
      bold: true,
    });

    // Page-break für PASSIVA
    this.pdf.addPage();
    this.currentY = 20;

    // PASSIVA
    this.addSection("PASSIVA");
    const passivaRows: (string | number)[][] = [];
    const passivaHighlight: number[] = [];
    const passivaRowsAll = flattenForRender(bilanz.passivaRoot).slice(1);
    passivaRowsAll.forEach((row) => {
      if (row.isLeafEntry) return;
      const indent = "  ".repeat(row.depth);
      passivaRows.push([
        row.node.referenceCode,
        indent + row.node.name,
        row.balance.isZero() ? "" : this.formatMoney(row.balance),
      ]);
      if (row.depth <= 1) passivaHighlight.push(passivaRows.length - 1);
    });
    this.addTable(["Ref", "Bezeichnung", "Betrag"], passivaRows, {
      columnWidths: [25, 110, 35],
      rightAlignColumns: [2],
      highlightRows: passivaHighlight,
    });
    this.addKeyValue("Summe Passiva", this.formatMoney(bilanz.passivaSum), {
      bold: true,
    });

    // Bilanz-Check
    this.currentY += 4;
    const diff = new Money(bilanz.balancierungsDifferenz);
    const balanceOk = diff.abs().lessThan(new Money("0.01"));
    this.addKeyValue(
      "Bilanzierungsdifferenz (Aktiva − Passiva)",
      this.formatMoney(bilanz.balancierungsDifferenz),
      {
        bold: true,
        color: balanceOk ? [31, 122, 77] : [138, 44, 44],
      }
    );
    this.addKeyValue(
      "Vorläufiges Jahresergebnis",
      this.formatMoney(bilanz.provisionalResult)
    );

    this.addFooter({
      ...options,
      disclaimer:
        "NACHGEBILDETE DARSTELLUNG · § 266 HGB · ersetzt keine Jahresabschluss-Feststellung",
    });

    return this.toBlob();
  }
}
