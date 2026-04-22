// Lazy-loaded exporters for PDF and Excel. Heavy deps are only pulled in when
// the user actually triggers an export.

const euro = new Intl.NumberFormat("de-DE", {
  style: "currency",
  currency: "EUR",
});

export type TableRow = (string | number)[];

export type TableSpec = {
  title: string;
  subtitle?: string;
  columns: { header: string; width?: number; alignRight?: boolean }[];
  rows: TableRow[];
  footer?: TableRow;
};

function saveBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export async function exportTableToPdf(
  spec: TableSpec,
  filename: string
): Promise<void> {
  const { default: jsPDF } = await import("jspdf");
  const autoTableMod = await import("jspdf-autotable");
  const autoTable = autoTableMod.default ?? autoTableMod.autoTable;

  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();

  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor("#1e3a8a");
  doc.text(spec.title, 40, 50);

  if (spec.subtitle) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor("#6b7280");
    doc.text(spec.subtitle, 40, 66);
  }

  doc.setDrawColor("#f59e0b");
  doc.setLineWidth(1);
  doc.line(40, 76, pageWidth - 40, 76);

  autoTable(doc, {
    startY: 90,
    head: [spec.columns.map((c) => c.header)],
    body: spec.rows.map((r) => r.map((c) => formatCell(c))),
    foot: spec.footer ? [spec.footer.map((c) => formatCell(c))] : undefined,
    styles: {
      font: "helvetica",
      fontSize: 9,
      cellPadding: 5,
      textColor: "#1e293b",
    },
    headStyles: {
      fillColor: [30, 58, 138],
      textColor: "#fcd34d",
      fontStyle: "bold",
    },
    footStyles: {
      fillColor: [243, 239, 228],
      textColor: "#1e3a8a",
      fontStyle: "bold",
    },
    alternateRowStyles: { fillColor: [250, 248, 243] },
    columnStyles: Object.fromEntries(
      spec.columns.map((c, i) => [
        i,
        { halign: c.alignRight ? "right" : "left" },
      ])
    ),
  });

  doc.save(filename);
}

function formatCell(v: string | number): string {
  if (typeof v === "number") return euro.format(v);
  return v;
}

export async function exportTableToExcel(
  spec: TableSpec,
  filename: string
): Promise<void> {
  const ExcelJS = (await import("exceljs")).default;
  const wb = new ExcelJS.Workbook();
  wb.creator = "harouda-app";
  wb.created = new Date();
  const ws = wb.addWorksheet(spec.title.slice(0, 31), {
    views: [{ state: "frozen", ySplit: 1 }],
  });

  ws.columns = spec.columns.map((c, i) => ({
    header: c.header,
    key: `c${i}`,
    width: c.width ?? 22,
  }));
  ws.getRow(1).font = { bold: true, color: { argb: "FFECD9A5" } };
  ws.getRow(1).fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF0A1F44" },
  };

  for (const r of spec.rows) {
    const row = ws.addRow(r);
    for (let i = 0; i < r.length; i++) {
      const cell = row.getCell(i + 1);
      if (typeof r[i] === "number") {
        cell.numFmt = '#,##0.00 "€";[Red]-#,##0.00 "€"';
        cell.alignment = { horizontal: "right" };
      }
    }
  }

  if (spec.footer) {
    const row = ws.addRow(spec.footer);
    row.font = { bold: true };
    row.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFF3EFE4" },
    };
    for (let i = 0; i < spec.footer.length; i++) {
      const cell = row.getCell(i + 1);
      if (typeof spec.footer[i] === "number") {
        cell.numFmt = '#,##0.00 "€";[Red]-#,##0.00 "€"';
        cell.alignment = { horizontal: "right" };
      }
    }
  }

  const buf = await wb.xlsx.writeBuffer();
  saveBlob(
    new Blob([buf], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    }),
    filename
  );
}

export function downloadBlob(blob: Blob, filename: string) {
  saveBlob(blob, filename);
}

export function downloadText(
  text: string,
  filename: string,
  mime = "text/plain;charset=utf-8"
) {
  saveBlob(new Blob([text], { type: mime }), filename);
}
