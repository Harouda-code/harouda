/**
 * Anlagenspiegel-PDF-Generator nach HGB § 284.
 *
 * Layout: A4 Querformat — 8 Spalten erfordern mehr Breite.
 * Gruppiert nach konto_anlage; Totals-Zeile unten.
 *
 * Sprint 6 Teil 2a.
 */

import { PdfReportBase, type PdfReportOptions } from "./PdfBase";
import type { AnlagenspiegelData } from "../../domain/anlagen/AnlagenService";

export class AnlagenspiegelPdfGenerator extends PdfReportBase {
  constructor() {
    super({ orientation: "landscape" });
  }

  generate(data: AnlagenspiegelData, options: PdfReportOptions): Blob {
    this.addHeader({
      ...options,
      title: "Anlagenspiegel",
      subtitle: `Nachgebildet nach § 284 HGB · Stichtag 31.12.${data.bis_jahr}`,
    });

    if (data.gruppen.length === 0) {
      this.addKeyValue("Keine Anlagen im Bestand", "", { bold: true });
      this.addFooter({
        ...options,
        disclaimer:
          "NACHGEBILDETE DARSTELLUNG · § 284 HGB · ersetzt keine Jahresabschluss-Feststellung",
      });
      return this.toBlob();
    }

    this.addSection("Entwicklung des Anlagevermögens");

    const headers = [
      "Konto",
      "Anz.",
      "AK 01.01.",
      "Zugänge",
      "Abgänge",
      "AK 31.12.",
      "Abschr. kum.",
      "BW 01.01.",
      "BW 31.12.",
    ];

    const rows: (string | number)[][] = data.gruppen.map((g) => [
      g.konto_anlage,
      g.anzahl,
      this.formatMoney(String(g.ak_start)),
      this.formatMoney(String(g.zugaenge)),
      this.formatMoney(String(g.abgaenge)),
      this.formatMoney(String(g.ak_ende)),
      this.formatMoney(String(g.abschreibungen_kumuliert)),
      this.formatMoney(String(g.buchwert_start)),
      this.formatMoney(String(g.buchwert_ende)),
    ]);

    // Totals-Zeile
    const t = data.totals;
    rows.push([
      "TOTAL",
      t.anzahl,
      this.formatMoney(String(t.ak_start)),
      this.formatMoney(String(t.zugaenge)),
      this.formatMoney(String(t.abgaenge)),
      this.formatMoney(String(t.ak_ende)),
      this.formatMoney(String(t.abschreibungen_kumuliert)),
      this.formatMoney(String(t.buchwert_start)),
      this.formatMoney(String(t.buchwert_ende)),
    ]);

    this.addTable(headers, rows, {
      rightAlignColumns: [1, 2, 3, 4, 5, 6, 7, 8],
      highlightRows: [rows.length - 1],
      columnWidths: [18, 12, 32, 28, 28, 32, 32, 32, 32],
    });

    this.currentY += 4;
    this.pdf.setFontSize(8);
    this.pdf.setTextColor(80, 80, 80);
    this.pdf.text(
      "Invariante: Buchwert 31.12. = AK 31.12. − Abschreibungen kumuliert",
      this.margins.left,
      this.currentY
    );
    this.pdf.setTextColor(0, 0, 0);

    this.addFooter({
      ...options,
      disclaimer:
        "NACHGEBILDETE DARSTELLUNG · § 284 HGB · Anlagenspiegel · Sprint 6 Teil 2a",
    });

    return this.toBlob();
  }
}
