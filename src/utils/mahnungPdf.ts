import type { DunningRecord, DunningStage } from "../types/db";
import type { Settings } from "../contexts/SettingsContext";
import type { OpenItem } from "../api/opos";

const euro = new Intl.NumberFormat("de-DE", {
  style: "currency",
  currency: "EUR",
});

const TITLES: Record<DunningStage, string> = {
  1: "Zahlungserinnerung",
  2: "1. Mahnung",
  3: "2. Mahnung — letzte Mahnung vor Einleitung des gerichtlichen Mahnverfahrens",
};

function stageLead(stage: DunningStage, gegenseite: string): string {
  if (stage === 1) {
    return (
      `Sehr geehrte Damen und Herren bei ${gegenseite},\n\n` +
      `wir möchten Sie daran erinnern, dass die unten aufgeführte Rechnung ` +
      `noch offen ist. Möglicherweise hat sich Ihre Zahlung mit diesem ` +
      `Schreiben überschnitten — in diesem Fall betrachten Sie dieses ` +
      `Schreiben bitte als gegenstandslos.\n\n` +
      `Sollte die Zahlung noch nicht veranlasst worden sein, bitten wir ` +
      `Sie, den offenen Betrag bis zum unten angegebenen Datum zu begleichen.`
    );
  }
  if (stage === 2) {
    return (
      `Sehr geehrte Damen und Herren bei ${gegenseite},\n\n` +
      `trotz unserer Zahlungserinnerung haben wir für die unten ` +
      `aufgeführte Rechnung bis heute keinen Zahlungseingang feststellen ` +
      `können. Wir bitten Sie hiermit, den offenen Betrag einschließlich ` +
      `der Mahnkosten und Verzugszinsen bis zum unten angegebenen Datum ` +
      `zu zahlen.`
    );
  }
  return (
    `Sehr geehrte Damen und Herren bei ${gegenseite},\n\n` +
    `unsere vorangegangenen Mahnungen sind unbeantwortet geblieben. Wir ` +
    `fordern Sie hiermit letztmalig auf, den offenen Betrag zuzüglich ` +
    `Mahnkosten und Verzugszinsen bis zum unten angegebenen Datum zu ` +
    `zahlen.\n\n` +
    `Sollte bis dahin kein Zahlungseingang bei uns zu verzeichnen sein, ` +
    `werden wir ohne weitere Ankündigung das gerichtliche Mahnverfahren ` +
    `einleiten (§ 688 ff. ZPO). Die dadurch entstehenden zusätzlichen ` +
    `Kosten haben Sie zu tragen.`
  );
}

function stageLegalNote(stage: DunningStage, settings: Settings): string {
  const aufschlag = settings.verzugszinsenB2B ? 9 : 5;
  const satz = settings.basiszinssatzPct + aufschlag;
  const basis = settings.basiszinssatzPct;
  const b2b = settings.verzugszinsenB2B ? "B2B" : "B2C";
  if (stage === 1) {
    return `Sie befinden sich mit der Zahlung in Verzug (§ 286 BGB). Eine weitere Mahnung wird mit Mahngebühren und Verzugszinsen verbunden sein.`;
  }
  return (
    `Verzugszinsen nach § 288 BGB (${b2b}): Basiszinssatz ${basis.toFixed(2)} % + ${aufschlag} Prozentpunkte = ${satz.toFixed(2)} % p. a.`
  );
}

export type MahnungPdfInput = {
  record: DunningRecord;
  item: OpenItem;
  settings: Settings;
  anschrift?: string; // optional: multi-line address text
};

export async function buildMahnungPdf(
  input: MahnungPdfInput,
  filename: string
): Promise<void> {
  const { default: jsPDF } = await import("jspdf");
  const autoTableMod = await import("jspdf-autotable");
  const autoTable = autoTableMod.default ?? autoTableMod.autoTable;

  const { record, item, settings } = input;
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const W = doc.internal.pageSize.getWidth();
  const left = 56;
  const right = W - 56;

  // === Kanzlei-Header ===
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor("#1e3a8a");
  doc.text(settings.kanzleiName || "Kanzlei", left, 56);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor("#334155");
  const addrLines = [
    settings.kanzleiStrasse,
    [settings.kanzleiPlz, settings.kanzleiOrt].filter(Boolean).join(" "),
    settings.kanzleiTelefon && `Tel.: ${settings.kanzleiTelefon}`,
    settings.kanzleiEmail,
    settings.defaultSteuernummer && `St.-Nr.: ${settings.defaultSteuernummer}`,
  ].filter(Boolean) as string[];
  addrLines.forEach((l, i) => doc.text(l, left, 72 + i * 12));

  // Golden rule line
  doc.setDrawColor("#f59e0b");
  doc.setLineWidth(0.8);
  doc.line(left, 134, right, 134);

  // === Adressfeld ===
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor("#1e3a8a");
  doc.text(record.gegenseite, left, 170);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor("#334155");
  if (input.anschrift) {
    input.anschrift.split("\n").forEach((l, i) =>
      doc.text(l, left, 186 + i * 12)
    );
  } else {
    doc.text("[Anschrift einfügen]", left, 186);
  }

  // Datum rechts
  doc.setTextColor("#1e293b");
  doc.text(
    `${settings.kanzleiOrt ? settings.kanzleiOrt + ", " : ""}${new Date(record.issued_at).toLocaleDateString("de-DE")}`,
    right,
    170,
    { align: "right" }
  );

  // === Titel ===
  let y = 260;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor("#1e3a8a");
  doc.text(TITLES[record.stage], left, y, { maxWidth: right - left });
  y += 20;
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor("#334155");
  doc.text(
    `Unsere Zeichen: ${record.beleg_nr} · ausgestellt am ${new Date(record.issued_at).toLocaleDateString("de-DE")}`,
    left,
    y
  );
  y += 24;

  // === Anrede + Lead ===
  doc.setFontSize(10);
  doc.setTextColor("#1e293b");
  const lead = stageLead(record.stage, record.gegenseite);
  const leadLines = doc.splitTextToSize(lead, right - left);
  doc.text(leadLines, left, y);
  y += leadLines.length * 13 + 10;

  // === Tabelle mit offener Position + Gebühren ===
  const rows: (string | number)[][] = [
    [
      item.beleg_nr,
      new Date(item.datum).toLocaleDateString("de-DE"),
      new Date(record.faelligkeit_alt).toLocaleDateString("de-DE"),
      `${record.ueberfaellig_tage_bei_mahnung} T.`,
      euro.format(item.offen),
    ],
  ];
  autoTable(doc, {
    startY: y,
    head: [["Beleg-Nr.", "Datum", "Fällig", "Überfällig", "Offener Betrag"]],
    body: rows,
    styles: { font: "helvetica", fontSize: 9, cellPadding: 6, textColor: "#1e293b" },
    headStyles: { fillColor: [30, 58, 138], textColor: "#fcd34d", fontStyle: "bold" },
    columnStyles: { 4: { halign: "right" } },
    margin: { left, right: 56 },
  });

  const finalY1 =
    // @ts-expect-error autoTable augments the doc instance
    (doc.lastAutoTable?.finalY as number | undefined) ?? y + 40;

  // === Summenblock ===
  const fees: [string, number][] = [
    ["Offener Rechnungsbetrag", item.offen],
    ["Mahngebühr", record.fee],
    ["Verzugszinsen", record.verzugszinsen],
  ];
  const summe = item.offen + record.fee + record.verzugszinsen;

  let sy = finalY1 + 16;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  fees.forEach(([label, amount]) => {
    doc.setTextColor("#334155");
    doc.text(label, right - 180, sy, { align: "right" });
    doc.setTextColor("#1e293b");
    doc.text(euro.format(amount), right, sy, { align: "right" });
    sy += 14;
  });
  doc.setDrawColor("#1e3a8a");
  doc.line(right - 200, sy, right, sy);
  sy += 14;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor("#1e3a8a");
  doc.text("Zu zahlender Gesamtbetrag", right - 180, sy, { align: "right" });
  doc.text(euro.format(summe), right, sy, { align: "right" });
  sy += 22;

  // === Zahlungsaufforderung ===
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor("#1e293b");
  const dueLine =
    `Bitte zahlen Sie den Gesamtbetrag bis spätestens ${new Date(record.faelligkeit_neu).toLocaleDateString("de-DE")} auf das unten angegebene Konto.`;
  const dueLines = doc.splitTextToSize(dueLine, right - left);
  doc.text(dueLines, left, sy);
  sy += dueLines.length * 13 + 10;

  // === Rechtlicher Hinweis ===
  const legal = stageLegalNote(record.stage, settings);
  const legalLines = doc.splitTextToSize(legal, right - left);
  doc.setFontSize(9);
  doc.setTextColor("#334155");
  doc.text(legalLines, left, sy);
  sy += legalLines.length * 12 + 12;

  // === Zahlungsangaben / Kanzlei-Konto ===
  doc.setDrawColor("#f59e0b");
  doc.setLineWidth(0.6);
  doc.line(left, sy, right, sy);
  sy += 16;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor("#1e3a8a");
  doc.text("Bankverbindung", left, sy);
  sy += 14;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor("#1e293b");
  if (settings.kanzleiIban) {
    doc.text(`IBAN: ${settings.kanzleiIban}`, left, sy);
    sy += 12;
  } else {
    doc.text("IBAN: [bitte in den Einstellungen hinterlegen]", left, sy);
    sy += 12;
  }
  if (settings.kanzleiBic) {
    doc.text(`BIC: ${settings.kanzleiBic}`, left, sy);
    sy += 12;
  }
  doc.text(`Verwendungszweck: ${record.beleg_nr}`, left, sy);
  sy += 24;

  // === Schlussformel ===
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor("#1e293b");
  doc.text("Mit freundlichen Grüßen", left, sy);
  sy += 30;
  doc.text(settings.kanzleiName || "Kanzlei", left, sy);

  doc.save(filename);
}
