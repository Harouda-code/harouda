/**
 * Deckblatt-Generator fuer den Jahresabschluss (Sprint E3b / Schritt 1).
 *
 * Layout: DATEV-Style, klassisch Schwarz-Weiss, kein Logo-Upload.
 * Font bleibt der pdfmake-Default (Roboto); Arial/Helvetica waere
 * spaeter via Custom-Fonts-VFS nachruestbar (siehe
 * TEXTBAUSTEINE-UPDATE-GUIDE, Abschnitt "Schriftart-Austausch").
 *
 * Rechtsbasis: § 264 Abs. 1 HGB — Pflichtangaben auf dem Jahresabschluss-
 * Deckblatt (Firma, Rechtsform, Geschaeftsjahr, Stichtag, Erstellungsdatum).
 */
import type { Content } from "pdfmake/interfaces";
import type { Rechtsform } from "../../ebilanz/hgbTaxonomie68";

export type CoverBerichtsart = "Jahresabschluss" | "Entwurf";

export type CoverPageInput = {
  firmenname: string;
  rechtsform: Rechtsform;
  hrb_nummer?: string | null;
  hrb_gericht?: string | null;
  steuernummer?: string | null;
  /** "DD.MM.YYYY" — nicht ISO. */
  geschaeftsjahr_von: string;
  geschaeftsjahr_bis: string;
  stichtag: string;
  groessenklasse: "kleinst" | "klein" | "mittel" | "gross";
  berichtsart: CoverBerichtsart;
  /** "DD.MM.YYYY". */
  erstellt_am: string;
  kanzlei_name?: string;
};

/**
 * Erzeugt den Deckblatt-Content als Array pdfmake-Nodes. Die
 * Document-Merge-Pipeline platziert danach einen Pagebreak.
 *
 * Hinweis zum Watermark: der diagonal laufende „ENTWURF"-Text wird
 * nicht hier gerendert, sondern als docDefinition.watermark-Property
 * von der Pipeline gesetzt (pdfmake rendert Watermark seitenweise
 * automatisch). Siehe Watermark.ts und DocumentMergePipeline.ts.
 */
export function buildCoverPage(input: CoverPageInput): Content[] {
  // Rechtsform nur dann als Suffix anhaengen, wenn sie nicht bereits im
  // Firmennamen enthalten ist — verhindert "… GmbH GmbH" bei Mandanten,
  // deren name-Feld die Rechtsform schon traegt (gaengigste Eingabe).
  // Vergleich case-insensitive auf Wortgrenze, damit z. B. "Müller KG"
  // nicht mit der Rechtsform "AG" kollidiert.
  const rechtsformRegex = new RegExp(
    `\\b${input.rechtsform.replace(/[.*+?^${}()|[\\]\\\\]/g, "\\$&")}\\b`,
    "i"
  );
  const firmennameAlreadyHasRechtsform = rechtsformRegex.test(input.firmenname);
  const firmennameDisplay = firmennameAlreadyHasRechtsform
    ? input.firmenname
    : `${input.firmenname} ${input.rechtsform}`;

  const content: Content[] = [
    // Oberer Drittel — Titel.
    {
      text: "JAHRESABSCHLUSS",
      alignment: "center",
      bold: true,
      fontSize: 24,
      margin: [0, 100, 0, 8],
    },
    {
      text: `zum ${input.stichtag}`,
      alignment: "center",
      fontSize: 14,
      margin: [0, 0, 0, 12],
    },
    // Trennstrich — Canvas-Line.
    {
      canvas: [
        {
          type: "line",
          x1: 60,
          y1: 0,
          x2: 475,
          y2: 0,
          lineWidth: 2,
        },
      ],
      margin: [0, 0, 0, 60],
    },

    // Mittlerer Drittel — Firma + HRB + Steuernummer.
    {
      text: firmennameDisplay,
      alignment: "center",
      bold: true,
      fontSize: 20,
      margin: [0, 0, 0, 10],
    },
  ];

  if (input.hrb_nummer) {
    const hrbText = input.hrb_gericht
      ? `${input.hrb_nummer} (${input.hrb_gericht})`
      : input.hrb_nummer;
    content.push({
      text: hrbText,
      alignment: "center",
      fontSize: 12,
      margin: [0, 0, 0, 6],
    });
  }
  if (input.steuernummer) {
    content.push({
      text: `Steuernummer: ${input.steuernummer}`,
      alignment: "center",
      fontSize: 12,
      margin: [0, 0, 0, 60],
    });
  } else {
    // Abstand konstant halten auch ohne Steuernummer.
    content.push({ text: "", margin: [0, 0, 0, 60] });
  }

  // Unterer Drittel — links-buendiger Meta-Block.
  const metaEntries: string[] = [
    `Geschäftsjahr: ${input.geschaeftsjahr_von} – ${input.geschaeftsjahr_bis}`,
    `Größenklasse: ${input.groessenklasse} (§ 267 HGB)`,
    `Erstellt am: ${input.erstellt_am}`,
  ];
  if (input.kanzlei_name) {
    metaEntries.push(`Kanzlei: ${input.kanzlei_name}`);
  }
  for (const line of metaEntries) {
    content.push({
      text: line,
      alignment: "left",
      fontSize: 11,
      margin: [40, 0, 40, 4],
    });
  }

  // Hinweis bei Entwurf — ein zusaetzlicher Satz auf dem Deckblatt,
  // unabhaengig vom diagonalen Watermark.
  if (input.berichtsart === "Entwurf") {
    content.push({
      text:
        "[ENTWURF] — Dokument noch nicht finalisiert. " +
        "Nicht zur Veroeffentlichung bestimmt.",
      alignment: "center",
      bold: true,
      fontSize: 11,
      color: "#555",
      margin: [0, 40, 0, 0],
    });
  }

  return content;
}
