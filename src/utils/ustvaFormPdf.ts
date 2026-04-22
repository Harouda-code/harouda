import type { jsPDF as JsPdfType } from "jspdf";
import type { UstvaReport } from "../api/reports";

const PAGE_W = 210;
const PAGE_H = 297;
const MARGIN = 15;
const MARGIN_BOTTOM = 22;
const CONTENT_W = PAGE_W - MARGIN * 2;

const euro = new Intl.NumberFormat("de-DE", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

function fmt(n: number): string {
  return euro.format(n);
}

/** A row. value === undefined means the system does not compute this
 *  Kennzahl — rendered as "—" with an asterisk referring to the footnote. */
type Row = {
  kz: string;
  label: string;
  value?: number;
};

export type UstvaFormPdfInput = {
  report: UstvaReport;
  year: number;
  month: number;
  kanzleiName: string;
  kanzleiStrasse: string;
  kanzleiPlzOrt: string;
  steuernummer: string;
  mandantName?: string;
  mandantSteuernummer?: string;
  kleinunternehmer: boolean;
};

const MONTH_NAMES = [
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

const ROW_H = 7;
const SECTION_HEAD_H = 6;

export async function buildUstvaFormPdf(
  input: UstvaFormPdfInput,
  filename: string
): Promise<void> {
  const { default: jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
  const {
    report,
    year,
    month,
    kanzleiName,
    kanzleiStrasse,
    kanzleiPlzOrt,
    steuernummer,
    mandantName,
    mandantSteuernummer,
    kleinunternehmer,
  } = input;

  doc.setFont("helvetica", "normal");
  drawStamp(doc);

  // Title
  let y = MARGIN;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text("Umsatzsteuer-Voranmeldung", MARGIN, y + 6);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(
    `Voranmeldungszeitraum: ${MONTH_NAMES[month - 1]} ${year}`,
    MARGIN,
    y + 11
  );
  y += 15;

  // Header: Unternehmer + Steuernummer
  doc.setLineWidth(0.3);
  doc.rect(MARGIN, y, CONTENT_W, 22);
  doc.setFontSize(7);
  doc.text("Unternehmer / Mandant", MARGIN + 2, y + 3.5);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text(mandantName || kanzleiName, MARGIN + 2, y + 8);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(kanzleiStrasse, MARGIN + 2, y + 13);
  doc.text(kanzleiPlzOrt, MARGIN + 2, y + 17.5);

  const rightX = MARGIN + CONTENT_W / 2;
  doc.line(rightX, y, rightX, y + 22);
  doc.setFontSize(7);
  doc.text("Steuernummer", rightX + 2, y + 3.5);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text(
    mandantSteuernummer?.trim() || steuernummer || "—",
    rightX + 2,
    y + 9
  );
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.text("Finanzamt", rightX + 2, y + 14);
  doc.setFontSize(9);
  doc.text("—", rightX + 2, y + 17.5);
  y += 26;

  if (kleinunternehmer) {
    doc.setFillColor(252, 236, 201);
    doc.rect(MARGIN, y, CONTENT_W, 7, "F");
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.text(
      "Kleinunternehmer nach § 19 UStG aktiv — diese Voranmeldung dient nur zur Kontrolle.",
      MARGIN + 2,
      y + 4.5
    );
    doc.setFont("helvetica", "normal");
    y += 10;
  }

  // Section A: Steuerpflichtige Umsätze
  y = drawSection(doc, y, "A. Lieferungen und sonstige Leistungen", [
    { kz: "81", label: "zu 19 % (Bemessungsgrundlage netto)", value: report.kz81 },
    { kz: "86", label: "zu 7 % (Bemessungsgrundlage netto)", value: report.kz86 },
    { kz: "35", label: "zu anderen Steuersätzen (Bemessungsgrundlage)" },
    { kz: "77", label: "Unentgeltliche Wertabgaben (§ 3 Abs. 1b, 9a UStG)" },
  ]);

  // Section B: Steuerfreie Umsätze
  y = drawSection(doc, y, "B. Steuerfreie Umsätze", [
    { kz: "41", label: "Innergem. Lieferungen an Abnehmer mit USt-IdNr." },
    { kz: "44", label: "Innergem. Lieferungen neuer Fahrzeuge (§ 1b UStG)" },
    { kz: "49", label: "Innergem. Lieferungen an Kleinunternehmer" },
    {
      kz: "43",
      label: "Steuerfreie Umsätze mit Vorsteuerabzug (§ 4 Nr. 2–7 UStG)",
    },
    {
      kz: "48",
      label: "Steuerfreie Umsätze ohne Vorsteuerabzug (§ 4 Nr. 8 ff. UStG)",
      value: report.kz48,
    },
  ]);

  // Section C: Innergemeinschaftliche Erwerbe
  y = drawSection(doc, y, "C. Innergemeinschaftliche Erwerbe", [
    { kz: "89", label: "zu 19 % (Bemessungsgrundlage)" },
    { kz: "93", label: "zu 7 % (Bemessungsgrundlage)" },
    { kz: "91", label: "Steuerfreie i.g. Erwerbe" },
  ]);

  // Section D: §13b Reverse Charge
  y = drawSection(doc, y, "D. Leistungsempfänger als Steuerschuldner (§ 13b UStG)", [
    {
      kz: "46",
      label: "Werklieferungen/sonst. Leistungen ausl. Unternehmer (§ 13b Abs. 1, 2 Nr. 1, 5)",
    },
    { kz: "73", label: "Andere Leistungen nach § 13b Abs. 2 UStG" },
    { kz: "84", label: "Steuer auf § 13b-Leistungen (Summe)" },
  ]);

  // Section E: Umsatzsteuer (computed)
  y = drawSection(doc, y, "E. Umsatzsteuer", [
    { kz: "", label: "Umsatzsteuer aus Umsätzen zu 19 %", value: report.ust19 },
    { kz: "", label: "Umsatzsteuer aus Umsätzen zu 7 %", value: report.ust7 },
    { kz: "", label: "Summe USt aus i.g. Erwerb / § 13b" },
  ]);

  // Section F: Abziehbare Vorsteuer
  y = drawSection(doc, y, "F. Abziehbare Vorsteuerbeträge", [
    {
      kz: "66",
      label: "Vorsteuer aus Rechnungen von anderen Unternehmern (§ 15 Abs. 1 Nr. 1 UStG)",
      value: report.kz66,
    },
    { kz: "61", label: "Vorsteuer aus i.g. Erwerben (§ 15 Abs. 1 Nr. 3)" },
    { kz: "62", label: "Vorsteuer aus § 13b-Leistungen (§ 15 Abs. 1 Nr. 4)" },
    { kz: "63", label: "Einfuhrumsatzsteuer (§ 15 Abs. 1 Nr. 2)" },
  ]);

  // Section G: Berechnung
  y = drawSection(doc, y, "G. Berechnung der zu entrichtenden Umsatzsteuer", [
    { kz: "39", label: "Angerechnete Sondervorauszahlung (§ 48 Abs. 4 UStDV)" },
  ]);

  // Space check for result block
  y = ensureSpace(doc, y, 30);

  // Result block (Kz 83)
  y += 2;
  const resultH = 16;
  doc.setFillColor(15, 40, 85);
  doc.rect(MARGIN, y, CONTENT_W, resultH, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  const resultLabel = report.zahllast >= 0 ? "Zahllast" : "Erstattung";
  doc.text(`Kz. 83 · ${resultLabel}`, MARGIN + 3, y + 9);
  doc.setFontSize(13);
  const amount = `${fmt(Math.abs(report.zahllast))} €`;
  const amountW = doc.getTextWidth(amount);
  doc.text(amount, MARGIN + CONTENT_W - 3 - amountW, y + 10);
  doc.setTextColor(0, 0, 0);
  doc.setFont("helvetica", "normal");
  y += resultH + 4;

  // Signature
  y = ensureSpace(doc, y, 20);
  y += 4;
  doc.setLineWidth(0.2);
  doc.line(MARGIN, y, MARGIN + 65, y);
  doc.line(MARGIN + CONTENT_W - 65, y, MARGIN + CONTENT_W, y);
  doc.setFontSize(7);
  doc.text("Datum, Ort", MARGIN, y + 3);
  doc.text("Unterschrift Unternehmer", MARGIN + CONTENT_W - 65, y + 3);
  y += 10;

  // Footer
  y = ensureSpace(doc, y, 30);
  doc.setFontSize(7);
  doc.setTextColor(110, 110, 110);
  const footerLines = [
    "* Diese Kennzahl wird derzeit nicht automatisch aus dem Journal ermittelt — ggf. manuell ergänzen.",
    "Nachgebildete Darstellung nach BMF-Struktur · NICHT zur amtlichen Einreichung geeignet.",
    "Die amtliche Übermittlung erfolgt ausschließlich elektronisch über ELSTER (ELSTER-XML-Export oder ELSTER Online Portal) gemäß § 18 Abs. 1 UStG.",
    "Dieses Dokument dient der internen Prüfung / Mandantenbesprechung.",
  ];
  for (const line of footerLines) {
    const wrapped = doc.splitTextToSize(line, CONTENT_W);
    doc.text(wrapped, MARGIN, y);
    y += (Array.isArray(wrapped) ? wrapped.length : 1) * 3.2;
  }
  doc.setTextColor(0, 0, 0);

  doc.save(filename);
}

function drawStamp(doc: JsPdfType) {
  doc.saveGraphicsState?.();
  doc.setTextColor(210, 120, 70);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setLineWidth(0.4);
  doc.setDrawColor(210, 120, 70);
  const text = "NACHGEBILDETE DARSTELLUNG";
  const textW = doc.getTextWidth(text);
  const boxW = textW + 6;
  const x = PAGE_W - MARGIN - boxW;
  const y = MARGIN - 4;
  doc.rect(x, y, boxW, 7);
  doc.text(text, x + 3, y + 4.8);
  doc.setTextColor(0, 0, 0);
  doc.setDrawColor(0, 0, 0);
  doc.setFont("helvetica", "normal");
  doc.restoreGraphicsState?.();
}

function ensureSpace(doc: JsPdfType, y: number, need: number): number {
  if (y + need > PAGE_H - MARGIN_BOTTOM) {
    doc.addPage();
    drawStamp(doc);
    return MARGIN;
  }
  return y;
}

function drawSection(
  doc: JsPdfType,
  yIn: number,
  heading: string,
  rows: Row[]
): number {
  const needed = SECTION_HEAD_H + rows.length * ROW_H + 2;
  let y = ensureSpace(doc, yIn, needed);

  // Section heading
  doc.setFillColor(235, 238, 245);
  doc.rect(MARGIN, y, CONTENT_W, SECTION_HEAD_H, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text(heading, MARGIN + 2, y + 4);
  doc.setFont("helvetica", "normal");
  y += SECTION_HEAD_H;

  const kzBoxW = 12;
  const amountColW = 32;
  for (const r of rows) {
    const unsupported = r.value === undefined;

    // Outer row border
    doc.setDrawColor(190, 195, 205);
    doc.rect(MARGIN, y, CONTENT_W, ROW_H);

    // Kz box
    if (r.kz) {
      doc.setFillColor(unsupported ? 248 : 245, unsupported ? 248 : 248, unsupported ? 248 : 253);
      doc.rect(MARGIN, y, kzBoxW, ROW_H, "F");
      doc.rect(MARGIN, y, kzBoxW, ROW_H);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      if (unsupported) doc.setTextColor(140, 140, 140);
      const kzW = doc.getTextWidth(r.kz);
      doc.text(r.kz, MARGIN + (kzBoxW - kzW) / 2, y + 4.8);
      doc.setTextColor(0, 0, 0);
      doc.setFont("helvetica", "normal");
    }

    // Label
    doc.setFontSize(8.5);
    if (unsupported) doc.setTextColor(140, 140, 140);
    const labelX = MARGIN + kzBoxW + 3;
    const labelW = CONTENT_W - kzBoxW - amountColW - 5;
    const wrapped = doc.splitTextToSize(r.label, labelW);
    doc.text(wrapped[0] ?? "", labelX, y + 4.8);
    doc.setTextColor(0, 0, 0);

    // Amount
    doc.setFontSize(9);
    if (unsupported) {
      doc.setTextColor(140, 140, 140);
      const text = "— *";
      const w = doc.getTextWidth(text);
      doc.text(text, MARGIN + CONTENT_W - 2 - w, y + 4.8);
      doc.setTextColor(0, 0, 0);
    } else {
      doc.setFont("helvetica", "bold");
      const text = `${fmt(r.value as number)} €`;
      const w = doc.getTextWidth(text);
      doc.text(text, MARGIN + CONTENT_W - 2 - w, y + 4.8);
      doc.setFont("helvetica", "normal");
    }

    y += ROW_H;
  }
  doc.setDrawColor(0, 0, 0);
  y += 2;
  return y;
}

export function ustvaFormPdfFilename(year: number, month: number): string {
  return `ustva_${year}-${String(month).padStart(2, "0")}_formular.pdf`;
}
