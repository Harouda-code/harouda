/**
 * Anlagenspiegel-Excel-Export (HGB § 284) via ExcelJS.
 *
 * Layout: 1 Worksheet „Anlagenspiegel" mit Kopf-Zeilen, Gruppen-Zeilen,
 * Totals-Zeile. Zahlen im deutschen Format (Komma als Dezimaltrenner).
 *
 * Sprint 6 Teil 2a — Exchange-Format für die Weitergabe an Steuerberater
 * oder Prüfer-Software.
 */

import ExcelJS from "exceljs";
import type { AnlagenspiegelData } from "../../domain/anlagen/AnlagenService";

export async function exportAnlagenspiegelExcel(
  data: AnlagenspiegelData,
  meta: {
    mandantName: string;
    generatedAt?: Date;
  }
): Promise<Blob> {
  const wb = new ExcelJS.Workbook();
  wb.creator = "harouda-app";
  wb.created = meta.generatedAt ?? new Date();

  const ws = wb.addWorksheet("Anlagenspiegel");

  // Meta-Kopf
  ws.mergeCells("A1:I1");
  const titleCell = ws.getCell("A1");
  titleCell.value = `Anlagenspiegel ${data.bis_jahr} — ${meta.mandantName}`;
  titleCell.font = { size: 14, bold: true };
  titleCell.alignment = { horizontal: "left" };

  ws.getCell("A2").value = `Stichtag: 31.12.${data.bis_jahr}`;
  ws.getCell("A2").font = { size: 9, italic: true };
  ws.getCell("A3").value = `Erstellt: ${(
    meta.generatedAt ?? new Date()
  ).toLocaleString("de-DE")}`;
  ws.getCell("A3").font = { size: 9, italic: true };

  // Spalten-Kopfzeile
  const headerRowIdx = 5;
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
  const headerRow = ws.getRow(headerRowIdx);
  headers.forEach((h, i) => {
    const cell = headerRow.getCell(i + 1);
    cell.value = h;
    cell.font = { bold: true };
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFE6E6EB" },
    };
    cell.border = {
      top: { style: "thin" },
      bottom: { style: "thin" },
    };
    cell.alignment = { horizontal: i === 0 ? "left" : "right" };
  });

  // Daten-Zeilen
  let r = headerRowIdx + 1;
  for (const g of data.gruppen) {
    const row = ws.getRow(r++);
    row.getCell(1).value = g.konto_anlage;
    row.getCell(2).value = g.anzahl;
    row.getCell(3).value = g.ak_start;
    row.getCell(4).value = g.zugaenge;
    row.getCell(5).value = g.abgaenge;
    row.getCell(6).value = g.ak_ende;
    row.getCell(7).value = g.abschreibungen_kumuliert;
    row.getCell(8).value = g.buchwert_start;
    row.getCell(9).value = g.buchwert_ende;
    for (let i = 3; i <= 9; i++) {
      row.getCell(i).numFmt = '#,##0.00 "€"';
      row.getCell(i).alignment = { horizontal: "right" };
    }
  }

  // Totals-Zeile
  const tRow = ws.getRow(r++);
  tRow.getCell(1).value = "TOTAL";
  tRow.getCell(2).value = data.totals.anzahl;
  tRow.getCell(3).value = data.totals.ak_start;
  tRow.getCell(4).value = data.totals.zugaenge;
  tRow.getCell(5).value = data.totals.abgaenge;
  tRow.getCell(6).value = data.totals.ak_ende;
  tRow.getCell(7).value = data.totals.abschreibungen_kumuliert;
  tRow.getCell(8).value = data.totals.buchwert_start;
  tRow.getCell(9).value = data.totals.buchwert_ende;
  for (let i = 1; i <= 9; i++) {
    const c = tRow.getCell(i);
    c.font = { bold: true };
    c.border = { top: { style: "double" } };
    if (i >= 3) {
      c.numFmt = '#,##0.00 "€"';
      c.alignment = { horizontal: "right" };
    }
  }

  // Spaltenbreiten
  ws.columns = [
    { width: 12 },
    { width: 8 },
    { width: 14 },
    { width: 14 },
    { width: 14 },
    { width: 14 },
    { width: 16 },
    { width: 14 },
    { width: 14 },
  ];

  // Invariante-Hinweis unten
  r += 1;
  const hintCell = ws.getCell(`A${r}`);
  hintCell.value =
    "Invariante: Buchwert 31.12. = AK 31.12. − Abschreibungen kumuliert";
  hintCell.font = { italic: true, size: 9, color: { argb: "FF606060" } };
  ws.mergeCells(`A${r}:I${r}`);

  const buffer = await wb.xlsx.writeBuffer();
  return new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
}
