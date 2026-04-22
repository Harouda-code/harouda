/**
 * HGB-Anhang-Textbausteine — MVP-Bibliothek (Jahresabschluss-E3a / Schritt 4).
 *
 * GoBD-RECHTSFLAGGE: HGB-Rechtslage und BMF-Auslegungen aendern sich
 * staendig. Jeder Baustein hier traegt ein `version_stand`-Feld
 * (YYYY-MM) und einen §-Verweis. Alle Templates sind bewusst
 * KONSERVATIV + PLATZHALTER-HAFT formuliert — der User muss sie im
 * Editor individualisieren, und die UI zeigt permanent einen
 * Disclaimer (siehe TextbausteinDisclaimer.tsx).
 *
 * Quellen + Stand:
 *  - HGB i. d. F. vom 22.12.2023 (BGBl. I 2023 Nr. 412).
 *  - BMF-Schreiben zu § 285 HGB unveraendert seit 2019.
 *  - Groessenklassen-Schwellen aktualisiert per BGBl. I 2024 Nr. 120.
 *
 * Scope E3a: nur 6 Pflicht-Kern-Bausteine. Weitere § 285-Nummern
 * (Nr. 2-6, 8, 11-35) sind Folge-Sprint-Kandidaten.
 */
import type { JSONContent } from "@tiptap/react";

export type Groessenklasse = "kleinst" | "klein" | "mittel" | "gross";
export type RechtsformScope =
  | "Kapitalgesellschaft"
  | "Personengesellschaft"
  | "alle";

export type Textbaustein = {
  id: string;
  titel: string;
  paragraph_verweis: string;
  /** Format: YYYY-MM. */
  version_stand: string;
  anwendungsbereich: Groessenklasse[];
  rechtsform_scope: RechtsformScope[];
  tiptap_template: JSONContent;
  pflicht: boolean;
  notiz?: string;
};

/** ID-Konstanten (fuer Tests + E3b-Konsumenten). */
export const TB_ID_284_METHODEN = "§-284-bilanzierungs-methoden";
export const TB_ID_285_1_LANGFRISTIGE_VERB = "§-285-1-verbindlichkeiten-5j";
export const TB_ID_285_7_ARBEITNEHMER = "§-285-7-arbeitnehmer-durchschnitt";
export const TB_ID_285_9_ORGANBEZUEGE = "§-285-9-organbezuege";
export const TB_ID_285_10_ORGANE = "§-285-10-organbestaende";
export const TB_ID_287_NACHTRAG = "§-287-nachtragsbericht";

/** Helper: einfacher Paragraph mit Text. */
function p(text: string): JSONContent {
  return { type: "paragraph", content: [{ type: "text", text }] };
}
/** Helper: H2-Heading. */
function h2(text: string): JSONContent {
  return {
    type: "heading",
    attrs: { level: 2 },
    content: [{ type: "text", text }],
  };
}

export const ANHANG_TEXTBAUSTEINE: Textbaustein[] = [
  // 1. § 284 HGB — Bilanzierungsmethoden.
  //    Quelle: § 284 Abs. 1 HGB. BMF-Interpretation konstant seit 2015.
  {
    id: TB_ID_284_METHODEN,
    titel: "Allgemeine Angaben zu Bilanzierungs- und Bewertungsmethoden",
    paragraph_verweis: "§ 284 HGB",
    version_stand: "2025-04",
    anwendungsbereich: ["klein", "mittel", "gross"],
    rechtsform_scope: ["Kapitalgesellschaft"],
    pflicht: true,
    notiz:
      "Bitte konkret benennen, welche Bewertungsmethoden angewendet wurden (z.B. Anschaffungskostenprinzip, lineare AfA, strenges Niederstwertprinzip).",
    tiptap_template: {
      type: "doc",
      content: [
        h2("Bilanzierungs- und Bewertungsmethoden"),
        p(
          "Die Aufstellung des Jahresabschlusses erfolgt nach den Vorschriften des Handelsgesetzbuchs (§§ 242 ff. HGB) unter Beachtung der ergänzenden Bestimmungen für Kapitalgesellschaften (§§ 264 ff. HGB)."
        ),
        p(
          "[Hier individuellen Text ergänzen — insbesondere zu den angewendeten Bilanzierungs- und Bewertungsmethoden, AfA-Verfahren, Bewertungsvereinfachungen und etwaigen Änderungen gegenüber dem Vorjahr.]"
        ),
      ],
    },
  },

  // 2. § 285 Nr. 1 HGB — Verbindlichkeiten mit Restlaufzeit > 5 Jahre.
  //    Quelle: § 285 Nr. 1 Buchst. a) HGB.
  {
    id: TB_ID_285_1_LANGFRISTIGE_VERB,
    titel: "Verbindlichkeiten mit Restlaufzeit > 5 Jahre",
    paragraph_verweis: "§ 285 Nr. 1 HGB",
    version_stand: "2025-04",
    anwendungsbereich: ["mittel", "gross"],
    rechtsform_scope: ["Kapitalgesellschaft"],
    pflicht: true,
    notiz:
      "Pflicht für mittel-/großgroße Kapitalgesellschaften. Tabelle ersetzen durch tatsächliche Restlaufzeit-Analyse aus dem Anlagenspiegel / Kreditorenbuch.",
    tiptap_template: {
      type: "doc",
      content: [
        h2("Verbindlichkeiten mit einer Restlaufzeit von mehr als 5 Jahren"),
        p(
          "Die nachstehende Tabelle zeigt die Verbindlichkeiten, deren Restlaufzeit zum Bilanzstichtag mehr als 5 Jahre beträgt (§ 285 Nr. 1 Buchstabe a) HGB)."
        ),
        {
          type: "table",
          content: [
            {
              type: "tableRow",
              content: [
                {
                  type: "tableHeader",
                  content: [p("Verbindlichkeitsart")],
                },
                {
                  type: "tableHeader",
                  content: [p("Betrag (€)")],
                },
                {
                  type: "tableHeader",
                  content: [p("Sicherheit")],
                },
              ],
            },
            {
              type: "tableRow",
              content: [
                { type: "tableCell", content: [p("[z. B. Bankdarlehen]")] },
                { type: "tableCell", content: [p("[Betrag einsetzen]")] },
                { type: "tableCell", content: [p("[z. B. Grundschuld]")] },
              ],
            },
          ],
        },
        p(
          "[Ggf. weitere Erläuterungen zu einzelnen langfristigen Verbindlichkeiten.]"
        ),
      ],
    },
  },

  // 3. § 285 Nr. 7 HGB — Durchschnittliche Arbeitnehmer-Zahl.
  //    Quelle: § 285 Nr. 7 HGB. Durchschnitt i. S. d. § 267 Abs. 5 HGB.
  {
    id: TB_ID_285_7_ARBEITNEHMER,
    titel: "Durchschnittliche Zahl der Arbeitnehmer",
    paragraph_verweis: "§ 285 Nr. 7 HGB",
    version_stand: "2025-04",
    anwendungsbereich: ["kleinst", "klein", "mittel", "gross"],
    rechtsform_scope: ["Kapitalgesellschaft"],
    pflicht: true,
    notiz:
      "Pflicht für alle Kapitalgesellschaften. Durchschnittsberechnung gemäß § 267 Abs. 5 HGB (vier Stichtagswerte, geteilt durch vier).",
    tiptap_template: {
      type: "doc",
      content: [
        h2("Durchschnittliche Zahl der Arbeitnehmer"),
        p(
          "Die Gesellschaft beschäftigte im Berichtsjahr durchschnittlich [ZAHL EINSETZEN] Arbeitnehmer (Vorjahr: [ZAHL EINSETZEN]). Die Durchschnittsberechnung erfolgte gemäß § 267 Abs. 5 HGB anhand der Stichtagswerte der vier Quartalsenden."
        ),
      ],
    },
  },

  // 4. § 285 Nr. 9 HGB — Organbezuege.
  //    Quelle: § 285 Nr. 9 Buchst. a) HGB; § 286 Abs. 4 HGB
  //    (Schutzklausel bei kleinen GmbHs).
  {
    id: TB_ID_285_9_ORGANBEZUEGE,
    titel: "Gesamtbezüge der Geschäftsführung / des Vorstands",
    paragraph_verweis: "§ 285 Nr. 9 HGB",
    version_stand: "2025-04",
    anwendungsbereich: ["mittel", "gross"],
    rechtsform_scope: ["Kapitalgesellschaft"],
    pflicht: false,
    notiz:
      "Grundsätzliche Angabepflicht nach § 285 Nr. 9 HGB; § 286 Abs. 4 HGB erlaubt Befreiung, wenn sich aus der Angabe die Bezüge eines einzelnen Mitglieds ermitteln lassen (typisch bei kleinen/mittleren GmbH). Entscheidung dokumentieren!",
    tiptap_template: {
      type: "doc",
      content: [
        h2("Gesamtbezüge der Geschäftsführung"),
        p(
          "[Variante A: Offenlegung] — Die Gesamtbezüge der Geschäftsführung für das Geschäftsjahr beliefen sich auf [BETRAG] € (Vorjahr: [BETRAG] €)."
        ),
        p(
          "[Variante B: Schutzklausel § 286 Abs. 4 HGB] — Von der Angabe der Gesamtbezüge wird gemäß § 286 Abs. 4 HGB abgesehen, da sich aus der Angabe die Bezüge einer einzelnen Person bestimmen ließen."
        ),
        p(
          "[Nicht benötigte Variante bitte löschen — Entscheidung im Management-Letter dokumentieren.]"
        ),
      ],
    },
  },

  // 5. § 285 Nr. 10 HGB — Organbestände (GF-Namen).
  //    Quelle: § 285 Nr. 10 HGB.
  {
    id: TB_ID_285_10_ORGANE,
    titel: "Mitglieder der Geschäftsführung",
    paragraph_verweis: "§ 285 Nr. 10 HGB",
    version_stand: "2025-04",
    anwendungsbereich: ["klein", "mittel", "gross"],
    rechtsform_scope: ["Kapitalgesellschaft"],
    pflicht: true,
    notiz:
      "Pflicht für alle GmbH. Liste kann vom Wizard aus den Stammdaten (Geschäftsführer-Array) automatisch befüllt werden.",
    tiptap_template: {
      type: "doc",
      content: [
        h2("Mitglieder der Geschäftsführung"),
        p("Im Berichtsjahr waren folgende Personen als Geschäftsführer bestellt:"),
        {
          type: "bulletList",
          content: [
            {
              type: "listItem",
              content: [p("[Name der/s Geschäftsführers/in], Geschäftsführer"),],
            },
          ],
        },
        p(
          "[Weitere Organe ggf. ergänzen. Bei Bestellung / Abberufung im Laufe des Jahres: Zeitraum angeben.]"
        ),
      ],
    },
  },

  // 6. § 287 HGB — Nachtragsbericht.
  //    Quelle: § 289 Abs. 2 Nr. 1 HGB i. V. m. § 285 Nr. 33 HGB (BilRUG).
  //    Achtung: Rechtsgrundlage uneinheitlich zitiert — konservative
  //    Formulierung mit Platzhalter, finale Referenz nach fachlicher
  //    Pruefung.
  {
    id: TB_ID_287_NACHTRAG,
    titel: "Nachtragsbericht — Ereignisse nach dem Bilanzstichtag",
    paragraph_verweis: "§ 285 Nr. 33 HGB",
    version_stand: "2025-04",
    anwendungsbereich: ["mittel", "gross"],
    rechtsform_scope: ["Kapitalgesellschaft"],
    pflicht: false,
    notiz:
      "Nur Pflicht, wenn wesentliche Ereignisse nach dem Bilanzstichtag vorliegen. Bei 'Fehlanzeige' kurzer Standard-Satz ausreichend.",
    tiptap_template: {
      type: "doc",
      content: [
        h2("Ereignisse nach dem Bilanzstichtag"),
        p(
          "Nach Schluss des Geschäftsjahres sind keine Vorgänge von besonderer Bedeutung eingetreten, die einen Einfluss auf die Vermögens-, Finanz- oder Ertragslage der Gesellschaft haben."
        ),
        p(
          "[Bei relevanten Ereignissen: Sachverhalt, wirtschaftliche Auswirkung und ggf. Zeitraum angeben.]"
        ),
      ],
    },
  },
];

export type BausteinFilter = {
  rechtsform: "Kapitalgesellschaft" | "Personengesellschaft" | "Einzel";
  groessenklasse: Groessenklasse;
};

/**
 * Filtere die Bibliothek nach Rechtsform + Groessenklasse.
 * Einzelunternehmen: keine Anhang-Pflicht — leere Liste.
 */
export function getBausteineFuer(filter: BausteinFilter): Textbaustein[] {
  if (filter.rechtsform === "Einzel") return [];
  const rfScopeMatch = (b: Textbaustein): boolean =>
    b.rechtsform_scope.includes("alle") ||
    b.rechtsform_scope.includes(filter.rechtsform as RechtsformScope);
  return ANHANG_TEXTBAUSTEINE.filter(
    (b) =>
      rfScopeMatch(b) && b.anwendungsbereich.includes(filter.groessenklasse)
  );
}
