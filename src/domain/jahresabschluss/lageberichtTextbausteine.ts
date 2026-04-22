/**
 * HGB-Lagebericht-Textbausteine — MVP-Bibliothek (Jahresabschluss-E3b / Schritt 3).
 *
 * GoBD-RECHTSFLAGGE: Analog zur Anhang-Bibliothek traegt jeder
 * Baustein ein `version_stand`-Feld (YYYY-MM) und einen §-Verweis.
 * Templates sind konservativ + Platzhalter-haft — der User
 * individualisiert sie im Editor. `TextbausteinDisclaimer` wird
 * in der UI oberhalb jedes Editors gezeigt.
 *
 * Quellen + Stand:
 *  - HGB i. d. F. vom 22.12.2023 (BGBl. I 2023 Nr. 412).
 *  - § 289 HGB § 289a HGB (Erklaerung zur Unternehmensfuehrung,
 *    kapitalmarktorientiert) bewusst NICHT im MVP.
 *  - § 289b/c/d/e HGB (nichtfinanzielle Erklaerung) — NICHT im MVP.
 *
 * Scope E3b: 4 Kern-Bausteine zu § 289 HGB (Abs. 1, 2 Nr. 1, 3, 4).
 */
import type { JSONContent } from "@tiptap/react";
import type {
  Groessenklasse,
  RechtsformScope,
  Textbaustein,
} from "./anhangTextbausteine";

/** ID-Konstanten (fuer Tests + Konsumenten). */
export const LB_ID_289_1_WIRTSCHAFTSBERICHT = "§-289-1-wirtschaftsbericht";
export const LB_ID_289_2_PROGNOSE_RISIKO =
  "§-289-2-prognose-risiko-chancen";
export const LB_ID_289_3_NICHTFINANZIELLE_KPI =
  "§-289-3-nichtfinanzielle-kpi";
export const LB_ID_289_4_IKS = "§-289-4-iks-risikomanagement";

function p(text: string): JSONContent {
  return { type: "paragraph", content: [{ type: "text", text }] };
}
function h2(text: string): JSONContent {
  return {
    type: "heading",
    attrs: { level: 2 },
    content: [{ type: "text", text }],
  };
}

export const LAGEBERICHT_TEXTBAUSTEINE: Textbaustein[] = [
  // 1. § 289 Abs. 1 HGB — Wirtschaftsbericht.
  //    Quelle: § 289 Abs. 1 HGB. Inhalt: Geschaeftsverlauf +
  //    wirtschaftliche Lage. Rahmenbedingungen sind üblich als
  //    Einleitungsabschnitt.
  {
    id: LB_ID_289_1_WIRTSCHAFTSBERICHT,
    titel: "Wirtschaftsbericht (Geschäftsverlauf und Lage)",
    paragraph_verweis: "§ 289 Abs. 1 HGB",
    version_stand: "2025-04",
    anwendungsbereich: ["mittel", "gross"],
    rechtsform_scope: ["Kapitalgesellschaft"],
    pflicht: true,
    notiz:
      "Pflicht für mittel-/großgroße Kapitalgesellschaften. Angaben zu Geschäftsverlauf, wirtschaftlicher Lage sowie wesentlichen Rahmenbedingungen sind erforderlich.",
    tiptap_template: {
      type: "doc",
      content: [
        h2("1. Wirtschaftsbericht"),
        h2("1.1 Rahmenbedingungen"),
        p(
          "[Hier gesamtwirtschaftliche und branchenspezifische Rahmenbedingungen des Berichtsjahres skizzieren, soweit sie den Geschäftsverlauf beeinflusst haben.]"
        ),
        h2("1.2 Geschäftsverlauf"),
        p(
          "[Umsatz-, Auftrags- und Investitionsentwicklung im Berichtsjahr darstellen; wesentliche Veränderungen gegenüber dem Vorjahr erläutern.]"
        ),
        h2("1.3 Lage der Gesellschaft"),
        p(
          "[Vermögens-, Finanz- und Ertragslage zum Bilanzstichtag beschreiben und dabei die bedeutenden Kennzahlen nennen.]"
        ),
      ],
    },
  },

  // 2. § 289 Abs. 2 Nr. 1 HGB — Prognose-/Risiko-/Chancenbericht.
  //    Quelle: § 289 Abs. 2 Nr. 1 HGB. Erwartete Entwicklung mit
  //    wesentlichen Chancen + Risiken.
  {
    id: LB_ID_289_2_PROGNOSE_RISIKO,
    titel: "Prognose-, Risiko- und Chancenbericht",
    paragraph_verweis: "§ 289 Abs. 2 Nr. 1 HGB",
    version_stand: "2025-04",
    anwendungsbereich: ["mittel", "gross"],
    rechtsform_scope: ["Kapitalgesellschaft"],
    pflicht: true,
    notiz:
      "Angaben zur voraussichtlichen Entwicklung mit den wesentlichen Chancen und Risiken (Mindest-Horizont: ein Jahr).",
    tiptap_template: {
      type: "doc",
      content: [
        h2("2. Prognose-, Risiko- und Chancenbericht"),
        p(
          "[Für das folgende Geschäftsjahr erwartete Entwicklung inklusive Prognose zur Umsatz- und Ertragsentwicklung darstellen.]"
        ),
        p(
          "[Wesentliche Risiken identifizieren (z. B. Marktrisiken, Lieferketten, Finanzierungsrisiken) und entsprechende Gegenmaßnahmen nennen.]"
        ),
        p(
          "[Chancen darstellen, soweit sie wesentlich und konkret genug für eine Berichterstattung sind.]"
        ),
      ],
    },
  },

  // 3. § 289 Abs. 3 HGB — Nichtfinanzielle Leistungsindikatoren.
  //    Quelle: § 289 Abs. 3 HGB. Pflicht nur fuer grosse
  //    Kapitalgesellschaften.
  {
    id: LB_ID_289_3_NICHTFINANZIELLE_KPI,
    titel: "Nichtfinanzielle Leistungsindikatoren",
    paragraph_verweis: "§ 289 Abs. 3 HGB",
    version_stand: "2025-04",
    anwendungsbereich: ["gross"],
    rechtsform_scope: ["Kapitalgesellschaft"],
    pflicht: true,
    notiz:
      "Pflicht nur für große Kapitalgesellschaften. Mindestens nichtfinanzielle Leistungsindikatoren (Arbeitnehmer-, Umwelt-Belange), soweit für das Verständnis der Geschäftsentwicklung erforderlich.",
    tiptap_template: {
      type: "doc",
      content: [
        h2("3. Nichtfinanzielle Leistungsindikatoren"),
        p(
          "[Angaben zu nichtfinanziellen Leistungsindikatoren, insbesondere zu Arbeitnehmer- und Umweltbelangen, soweit für das Verständnis des Geschäftsverlaufs und der Lage erforderlich.]"
        ),
        p(
          "[Beispielsweise: Fluktuationsrate, Weiterbildungsstunden je Mitarbeiter, CO2-Fußabdruck pro Produkt, Arbeitsunfälle.]"
        ),
      ],
    },
  },

  // 4. § 289 Abs. 4 HGB — Internes Kontroll- und Risikomanagement.
  //    Quelle: § 289 Abs. 4 HGB. Pflicht fuer kapitalmarkt-
  //    orientierte Gesellschaften i. S. d. § 264d HGB.
  {
    id: LB_ID_289_4_IKS,
    titel: "Internes Kontroll- und Risikomanagement-System (IKS)",
    paragraph_verweis: "§ 289 Abs. 4 HGB",
    version_stand: "2025-04",
    anwendungsbereich: ["mittel", "gross"],
    rechtsform_scope: ["Kapitalgesellschaft"],
    pflicht: false,
    notiz:
      "Pflicht für kapitalmarktorientierte Gesellschaften i. S. d. § 264d HGB. Wesentliche Merkmale des internen Kontroll- und Risikomanagement-Systems bezogen auf den Rechnungslegungsprozess.",
    tiptap_template: {
      type: "doc",
      content: [
        h2("4. Internes Kontroll- und Risikomanagement-System"),
        p(
          "[Wesentliche Merkmale des internen Kontroll- und Risikomanagement-Systems (IKS) in Bezug auf den Rechnungslegungsprozess beschreiben.]"
        ),
        p(
          "[Beispielsweise: Vier-Augen-Prinzip bei Buchungen, periodische Jour-Fixe Finanzbuchhaltung/Geschäftsleitung, IT-Zugriffskontrollen, unabhängige interne Revision.]"
        ),
      ],
    },
  },
];

export type LageberichtFilter = {
  rechtsform: "Kapitalgesellschaft" | "Personengesellschaft" | "Einzel";
  groessenklasse: Groessenklasse;
  kapitalmarktorientiert?: boolean;
};

/**
 * Lagebericht-Pflicht bestimmt nach § 264 Abs. 1 HGB (i. V. m. § 267):
 *   - Einzelunternehmen / Personengesellschaft → kein Lagebericht.
 *   - Kleinst-/kleine Kapitalgesellschaft → befreit (§ 264 Abs. 1
 *     Satz 4 HGB).
 *   - Mittlere/grosse Kapitalgesellschaft → Pflicht.
 *
 * Bausteine-Filter:
 *   - § 289 Abs. 1 + § 289 Abs. 2 Nr. 1 → mittel + gross.
 *   - § 289 Abs. 3 → nur gross.
 *   - § 289 Abs. 4 → nur wenn kapitalmarktorientiert=true.
 */
export function getLageberichtFuer(
  filter: LageberichtFilter
): Textbaustein[] {
  if (filter.rechtsform !== "Kapitalgesellschaft") return [];
  const size = filter.groessenklasse;
  if (size === "kleinst" || size === "klein") return [];
  const rfScopeMatch = (b: Textbaustein): boolean =>
    b.rechtsform_scope.includes("alle") ||
    b.rechtsform_scope.includes(filter.rechtsform as RechtsformScope);
  return LAGEBERICHT_TEXTBAUSTEINE.filter((b) => {
    if (!rfScopeMatch(b)) return false;
    if (!b.anwendungsbereich.includes(size)) return false;
    if (b.id === LB_ID_289_4_IKS && !filter.kapitalmarktorientiert) {
      return false;
    }
    return true;
  });
}
