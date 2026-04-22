// PDF-Gehaltsabrechnung (Lohn- und Gehaltsabrechnung).
//
// Erzeugt eine kompakte Abrechnung auf einer DIN-A4-Seite. Die Darstellung
// orientiert sich an der üblichen deutschen Struktur, ist aber KEIN von
// einer Kammer/DATEV vorgegebenes Layout.
//
// Einschränkungen (ehrlich):
//   • Keine YTD-Historie: die App persistiert keine früheren Abrechnungen;
//     für YTD-Werte müsste pro Monat eine Snapshot-Tabelle gepflegt werden.
//   • Keine QR-Code-Signatur: nicht rechtlich gefordert.
//   • Keine digitale Signatur: würde externe PKI erfordern.
//   • Zulagen/Überstunden werden aktuell nicht einzeln erfasst — wenn das
//     Bruttogehalt sie bereits enthält, erscheint nur "Grundgehalt".

import type { Employee } from "../types/db";
import type { SvResult } from "./sozialversicherung";

export type PayslipContext = {
  company: {
    name: string;
    strasse: string;
    plz: string;
    ort: string;
    email?: string;
    steuernummer?: string;
  };
  employee: Employee;
  period: {
    year: number;
    month: number; // 1..12
  };
  brutto: number;
  tax: {
    lohnsteuer: number;
    soli: number;
    kirchensteuer: number;
  };
  sv: SvResult;
  netto: number;
  /** Hinweis-Texte, die im Fußbereich gelistet werden. */
  notes?: string[];
};

const MONATE = [
  "Januar",
  "Februar",
  "März",
  "April",
  "Mai",
  "Juni",
  "Juli",
  "August",
  "September",
  "Oktober",
  "November",
  "Dezember",
];

function fmt(n: number): string {
  return n.toLocaleString("de-DE", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function fmtZahl(n: number): string {
  return n.toLocaleString("de-DE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export async function buildPayslipPdf(
  ctx: PayslipContext
): Promise<Uint8Array> {
  const { default: jsPDF } = await import("jspdf");
  const autoTableMod = await import("jspdf-autotable");
  const autoTable = autoTableMod.default ?? autoTableMod.autoTable;

  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 40;

  // --- Kopfbereich: Firma + Abrechnungszeitraum --------------------------
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor("#1e3a8a");
  doc.text(ctx.company.name, margin, margin);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor("#475569");
  const addrLines = [
    ctx.company.strasse,
    `${ctx.company.plz} ${ctx.company.ort}`.trim(),
  ].filter(Boolean);
  addrLines.forEach((line, i) => {
    doc.text(line, margin, margin + 14 + i * 11);
  });
  if (ctx.company.steuernummer) {
    doc.text(
      `Steuer-Nr.: ${ctx.company.steuernummer}`,
      margin,
      margin + 14 + addrLines.length * 11
    );
  }

  // Rechtsbündiger Abrechnungs-Header
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor("#1e3a8a");
  doc.text("Gehaltsabrechnung", pageW - margin, margin + 2, { align: "right" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor("#374151");
  doc.text(
    `${MONATE[ctx.period.month - 1]} ${ctx.period.year}`,
    pageW - margin,
    margin + 18,
    { align: "right" }
  );
  doc.setFontSize(8);
  doc.setTextColor("#94a3b8");
  doc.text(
    `Erstellt: ${new Date().toLocaleString("de-DE")}`,
    pageW - margin,
    margin + 32,
    { align: "right" }
  );

  // Trennlinie
  doc.setDrawColor("#f59e0b");
  doc.setLineWidth(0.8);
  doc.line(margin, margin + 60, pageW - margin, margin + 60);

  // --- Mitarbeiter-Block --------------------------------------------------
  let y = margin + 78;
  const emp = ctx.employee;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor("#1e293b");
  doc.text("Mitarbeiter/in", margin, y);
  y += 14;

  const empRows: [string, string][] = [
    ["Name", `${emp.vorname} ${emp.nachname}`],
    ["Personalnummer", emp.personalnummer],
    ["Steuerklasse", emp.steuerklasse],
    [
      "Kinderfreibeträge",
      emp.kinderfreibetraege > 0 ? String(emp.kinderfreibetraege) : "—",
    ],
    ["Konfession", emp.konfession ?? "—"],
    ["Bundesland", emp.bundesland ?? "—"],
    ["Beschäftigungsart", emp.beschaeftigungsart],
    ["Krankenversicherung", emp.privat_versichert ? "privat" : (emp.krankenkasse ?? "—")],
    ["Steuer-ID", emp.steuer_id ?? "—"],
    ["SV-Nummer", emp.sv_nummer ?? "—"],
  ];

  autoTable(doc, {
    startY: y,
    body: empRows,
    theme: "plain",
    styles: { font: "helvetica", fontSize: 9, cellPadding: 2, textColor: "#1f2937" },
    columnStyles: {
      0: { cellWidth: 150, fontStyle: "bold", textColor: "#64748b" },
      1: { cellWidth: pageW - margin * 2 - 150 },
    },
    margin: { left: margin, right: margin },
  });
  y = (doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? y;
  y += 16;

  // --- Bezüge -------------------------------------------------------------
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor("#1e293b");
  doc.text("Bezüge", margin, y);
  y += 4;

  autoTable(doc, {
    startY: y + 4,
    head: [["Bezeichnung", "Betrag"]],
    body: [["Grundgehalt / Lohn", fmt(ctx.brutto)]],
    foot: [["Bruttoentgelt", fmt(ctx.brutto)]],
    theme: "grid",
    styles: { font: "helvetica", fontSize: 9, cellPadding: 5 },
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
    columnStyles: {
      0: { cellWidth: pageW - margin * 2 - 130 },
      1: { cellWidth: 130, halign: "right" },
    },
    margin: { left: margin, right: margin },
  });
  y = (doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? y;
  y += 14;

  // --- Abzüge Arbeitnehmer ------------------------------------------------
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("Abzüge (Arbeitnehmer)", margin, y);
  y += 4;

  const abzuegeRows: [string, string][] = [
    ["Lohnsteuer", fmt(ctx.tax.lohnsteuer)],
    ["Solidaritätszuschlag", fmt(ctx.tax.soli)],
    ["Kirchensteuer", fmt(ctx.tax.kirchensteuer)],
    ["Krankenversicherung", fmt(ctx.sv.arbeitnehmer.kv)],
    ["Pflegeversicherung", fmt(ctx.sv.arbeitnehmer.pv)],
    ["Rentenversicherung", fmt(ctx.sv.arbeitnehmer.rv)],
    ["Arbeitslosenversicherung", fmt(ctx.sv.arbeitnehmer.av)],
  ];
  const abzuegeSum =
    ctx.tax.lohnsteuer +
    ctx.tax.soli +
    ctx.tax.kirchensteuer +
    ctx.sv.arbeitnehmer.gesamt;

  autoTable(doc, {
    startY: y + 4,
    head: [["Bezeichnung", "Betrag"]],
    body: abzuegeRows,
    foot: [["Summe Abzüge", fmt(abzuegeSum)]],
    theme: "grid",
    styles: { font: "helvetica", fontSize: 9, cellPadding: 5 },
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
    columnStyles: {
      0: { cellWidth: pageW - margin * 2 - 130 },
      1: { cellWidth: 130, halign: "right" },
    },
    margin: { left: margin, right: margin },
  });
  y = (doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? y;
  y += 16;

  // --- Auszahlungsbetrag (hervorgehoben) ---------------------------------
  doc.setFillColor("#1e3a8a");
  doc.roundedRect(margin, y, pageW - margin * 2, 42, 4, 4, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor("#fcd34d");
  doc.text("Auszahlungsbetrag (Netto)", margin + 14, y + 18);
  doc.setFontSize(18);
  doc.setTextColor("#ffffff");
  doc.text(fmt(ctx.netto), pageW - margin - 14, y + 26, { align: "right" });
  y += 56;

  // --- Arbeitgeber-Anteile (Info) ----------------------------------------
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor("#1e293b");
  doc.text("Arbeitgeber-Anteile (Info)", margin, y);
  y += 4;

  const agRows: [string, string][] = [
    ["KV-Arbeitgeberanteil", fmt(ctx.sv.arbeitgeber.kv)],
    ["PV-Arbeitgeberanteil", fmt(ctx.sv.arbeitgeber.pv)],
    ["RV-Arbeitgeberanteil", fmt(ctx.sv.arbeitgeber.rv)],
    ["AV-Arbeitgeberanteil", fmt(ctx.sv.arbeitgeber.av)],
    ["Umlage U1 (Krankheit)", fmt(ctx.sv.arbeitgeber.u1)],
    ["Umlage U2 (Mutterschaft)", fmt(ctx.sv.arbeitgeber.u2)],
    ["Insolvenzgeld", fmt(ctx.sv.arbeitgeber.insolvenzgeld)],
  ];
  const bruttoKosten = ctx.brutto + ctx.sv.arbeitgeber.gesamt;

  autoTable(doc, {
    startY: y + 4,
    body: agRows,
    foot: [
      ["Summe Arbeitgeber-SV", fmt(ctx.sv.arbeitgeber.gesamt)],
      ["Bruttokosten (AG-Perspektive)", fmt(bruttoKosten)],
    ],
    theme: "grid",
    styles: { font: "helvetica", fontSize: 8.5, cellPadding: 4 },
    footStyles: {
      fillColor: [250, 248, 243],
      textColor: "#1e3a8a",
      fontStyle: "bold",
    },
    columnStyles: {
      0: { cellWidth: pageW - margin * 2 - 120 },
      1: { cellWidth: 120, halign: "right" },
    },
    margin: { left: margin, right: margin },
  });
  y = (doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? y;
  y += 14;

  // --- Hinweise ----------------------------------------------------------
  if (ctx.notes && ctx.notes.length > 0) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor("#92400e");
    doc.text("Hinweise", margin, y);
    y += 12;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor("#475569");
    for (const n of ctx.notes) {
      const lines = doc.splitTextToSize(`• ${n}`, pageW - margin * 2);
      doc.text(lines, margin, y);
      y += lines.length * 10;
    }
    y += 4;
  }

  // --- Fußzeile -----------------------------------------------------------
  const footerY = pageH - 24;
  doc.setDrawColor("#e2e8f0");
  doc.setLineWidth(0.5);
  doc.line(margin, footerY - 8, pageW - margin, footerY - 8);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor("#94a3b8");
  doc.text(
    "Planungsgrad — keine amtliche Lohnabrechnung. Werte können vom BMF-PAP abweichen.",
    margin,
    footerY
  );
  doc.text(
    `Bruttoentgelt ${fmtZahl(ctx.brutto)} · Nettoauszahlung ${fmtZahl(ctx.netto)}`,
    pageW - margin,
    footerY,
    { align: "right" }
  );

  return new Uint8Array(doc.output("arraybuffer"));
}

export function payslipFilename(emp: Employee, year: number, month: number): string {
  const stamp = `${year}-${String(month).padStart(2, "0")}`;
  const safeLast = emp.nachname.replace(/[^A-Za-z0-9äöüÄÖÜß_-]/g, "_");
  return `Abrechnung_${stamp}_${safeLast}.pdf`;
}
