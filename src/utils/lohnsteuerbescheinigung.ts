// Lohnsteuerbescheinigung (Jahres-Bescheinigung) als PDF.
//
// Ehrlich:
//   • Die ordnungsgemäße Abgabe der Lohnsteuerbescheinigung erfolgt
//     elektronisch über ELStAM / ELSTER mit eTIN-Kennung. Dieses PDF ist
//     KEINE amtliche Übertragung — es ist ein druckbarer Jahres-Nachweis
//     für den Arbeitnehmer.
//   • Die App persistiert keine historischen Lohnläufe. Wir hochrechnen
//     deshalb von einem Monats-Stichlauf auf 12 Monate (bei konstantem
//     Brutto). Das ist für unterjährige Beschäftigungen ungenau und wird
//     im PDF klar ausgewiesen.
//   • Keine Kinderfreibeträge-Aufstellung, keine elektronische Signatur.

import type { Employee } from "../types/db";
import type { TaxResult } from "./lohnsteuer";
import type { SvResult } from "./sozialversicherung";

export type LohnsteuerbescheinigungContext = {
  company: {
    name: string;
    strasse: string;
    plz: string;
    ort: string;
    steuernummer?: string;
  };
  employee: Employee;
  year: number;
  /** Monats-Stichlauf, auf dessen Basis wir hochrechnen. */
  sampleMonth: {
    monatsBrutto: number;
    tax: TaxResult;
    sv: SvResult;
  };
  /** Berücksichtigte Monate (typisch 12 bei Ganzjahres-Beschäftigung;
   *  kleinerer Wert bei unterjährigem Ein-/Austritt). */
  monthsConsidered: number;
};

function fmt(n: number): string {
  return n.toLocaleString("de-DE", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export async function buildLohnsteuerbescheinigungPdf(
  ctx: LohnsteuerbescheinigungContext
): Promise<Uint8Array> {
  const { default: jsPDF } = await import("jspdf");
  const autoTableMod = await import("jspdf-autotable");
  const autoTable = autoTableMod.default ?? autoTableMod.autoTable;

  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const margin = 40;
  const m = ctx.monthsConsidered;

  const annual = {
    brutto: ctx.sampleMonth.monatsBrutto * m,
    lohnsteuer: ctx.sampleMonth.tax.lohnsteuer * m,
    soli: ctx.sampleMonth.tax.soli * m,
    kirchensteuer: ctx.sampleMonth.tax.kirchensteuer * m,
    svKv: ctx.sampleMonth.sv.arbeitnehmer.kv * m,
    svPv: ctx.sampleMonth.sv.arbeitnehmer.pv * m,
    svRv: ctx.sampleMonth.sv.arbeitnehmer.rv * m,
    svAv: ctx.sampleMonth.sv.arbeitnehmer.av * m,
  };

  // --- Kopfzeile -----------------------------------------------------------
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor("#1e3a8a");
  doc.text("Lohnsteuerbescheinigung", margin, margin + 4);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.setTextColor("#475569");
  doc.text(`für das Kalenderjahr ${ctx.year}`, margin, margin + 22);

  doc.setDrawColor("#f59e0b");
  doc.setLineWidth(1);
  doc.line(margin, margin + 34, pageW - margin, margin + 34);

  // Arbeitgeber
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor("#1e293b");
  doc.text("Arbeitgeber", margin, margin + 54);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor("#374151");
  let y = margin + 68;
  doc.text(ctx.company.name || "—", margin, y);
  y += 11;
  if (ctx.company.strasse) {
    doc.text(ctx.company.strasse, margin, y);
    y += 11;
  }
  if (ctx.company.plz || ctx.company.ort) {
    doc.text(`${ctx.company.plz ?? ""} ${ctx.company.ort ?? ""}`.trim(), margin, y);
    y += 11;
  }
  if (ctx.company.steuernummer) {
    doc.text(`Steuernummer: ${ctx.company.steuernummer}`, margin, y);
    y += 11;
  }

  // Arbeitnehmer (rechts)
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("Arbeitnehmer/in", pageW - margin, margin + 54, { align: "right" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  let ry = margin + 68;
  doc.text(
    `${ctx.employee.vorname} ${ctx.employee.nachname}`,
    pageW - margin,
    ry,
    { align: "right" }
  );
  ry += 11;
  doc.text(`Personal-Nr.: ${ctx.employee.personalnummer}`, pageW - margin, ry, {
    align: "right",
  });
  ry += 11;
  if (ctx.employee.steuer_id) {
    doc.text(`Steuer-ID: ${ctx.employee.steuer_id}`, pageW - margin, ry, {
      align: "right",
    });
    ry += 11;
  }
  if (ctx.employee.sv_nummer) {
    doc.text(`SV-Nummer: ${ctx.employee.sv_nummer}`, pageW - margin, ry, {
      align: "right",
    });
    ry += 11;
  }
  doc.text(
    `Steuerklasse: ${ctx.employee.steuerklasse}`,
    pageW - margin,
    ry,
    { align: "right" }
  );
  ry += 11;
  if (ctx.employee.kinderfreibetraege > 0) {
    doc.text(
      `Kinderfreibeträge: ${ctx.employee.kinderfreibetraege}`,
      pageW - margin,
      ry,
      { align: "right" }
    );
  }

  // --- Summen ----------------------------------------------------------------
  const tableStart = Math.max(y, ry) + 30;
  autoTable(doc, {
    startY: tableStart,
    head: [["Position", `Jahreswert (${m} Monate)`]],
    body: [
      ["Bruttoarbeitslohn", fmt(annual.brutto)],
      ["Einbehaltene Lohnsteuer", fmt(annual.lohnsteuer)],
      ["Solidaritätszuschlag", fmt(annual.soli)],
      ["Kirchensteuer", fmt(annual.kirchensteuer)],
      ["Arbeitnehmer-Anteil Krankenversicherung", fmt(annual.svKv)],
      ["Arbeitnehmer-Anteil Pflegeversicherung", fmt(annual.svPv)],
      ["Arbeitnehmer-Anteil Rentenversicherung", fmt(annual.svRv)],
      ["Arbeitnehmer-Anteil Arbeitslosenversicherung", fmt(annual.svAv)],
    ],
    foot: [
      [
        "Summe Abzüge Arbeitnehmer",
        fmt(
          annual.lohnsteuer +
            annual.soli +
            annual.kirchensteuer +
            annual.svKv +
            annual.svPv +
            annual.svRv +
            annual.svAv
        ),
      ],
    ],
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
      0: { cellWidth: pageW - margin * 2 - 170 },
      1: { cellWidth: 170, halign: "right" },
    },
    margin: { left: margin, right: margin },
  });
  let y2 =
    (doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable
      ?.finalY ?? tableStart;
  y2 += 20;

  // Hinweisbox
  doc.setFillColor("#fef3c7");
  doc.setDrawColor("#f59e0b");
  doc.roundedRect(margin, y2, pageW - margin * 2, 74, 6, 6, "FD");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor("#92400e");
  doc.text("Ehrliche Einordnung", margin + 12, y2 + 16);
  doc.setFont("helvetica", "normal");
  doc.setTextColor("#374151");
  const notice =
    "Diese Bescheinigung ist eine Hochrechnung auf Basis eines einzelnen " +
    "Monats-Lohnlaufs × " + m + " Monate. Die amtliche elektronische " +
    "Lohnsteuerbescheinigung (ELStAM) wird durch ein ITSG-zertifiziertes " +
    "Lohnprogramm direkt an die Finanzverwaltung übertragen und enthält " +
    "eine eTIN. Dieses PDF ersetzt diese Abgabe NICHT — es dient nur als " +
    "Zwischendokument für Arbeitnehmer.";
  const lines = doc.splitTextToSize(notice, pageW - margin * 2 - 24);
  doc.setFontSize(8);
  doc.text(lines, margin + 12, y2 + 30);
  y2 += 90;

  // Unterschriftenzeilen
  doc.setDrawColor("#94a3b8");
  doc.line(margin, y2 + 20, margin + 200, y2 + 20);
  doc.line(pageW - margin - 200, y2 + 20, pageW - margin, y2 + 20);
  doc.setFontSize(8);
  doc.setTextColor("#6b7280");
  doc.text("Ort, Datum", margin, y2 + 32);
  doc.text("Unterschrift Arbeitgeber", pageW - margin - 200, y2 + 32);

  return new Uint8Array(doc.output("arraybuffer"));
}

export function lohnsteuerbescheinigungFilename(
  emp: Employee,
  year: number
): string {
  const safe = emp.nachname.replace(/[^A-Za-z0-9äöüÄÖÜß_-]/g, "_");
  return `Lohnsteuerbescheinigung_${year}_${safe}.pdf`;
}
