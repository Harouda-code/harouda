/**
 * Bescheinigung-PDF-Builder (Sprint 17.5 / Schritt 4).
 *
 * Produziert die BStBK-konforme Bescheinigungs-Seite als pdfmake-
 * Content. Eine Seite, Schwarz-Weiss, pageBreak vorher.
 *
 * HAFTUNGSRISIKO bei Textaenderung — siehe
 * docs/BSTBK-BESCHEINIGUNG-UPDATE-GUIDE.md. Der kern_text kommt aus
 * der readonly Constants-Datei; nur die 6 Whitelist-Placeholders
 * werden ersetzt.
 */

import type { Content } from "pdfmake/interfaces";
import {
  BSTBK_FOOTER_TEXT,
  getBescheinigungsTemplate,
  type BescheinigungsTyp,
} from "../bstbk/bstbkBescheinigungen";
import {
  substitutePlaceholders,
  type BstbkPlaceholderValues,
} from "../bstbk/bstbkPlaceholders";

export type BescheinigungInput = {
  typ: BescheinigungsTyp;
  values: BstbkPlaceholderValues;
  footer_sichtbar: boolean;
};

export type BescheinigungBuildResult = {
  content: Content[];
  missing_values: string[];
  unknown_placeholders_in_template: string[];
};

export function buildBescheinigung(
  input: BescheinigungInput
): BescheinigungBuildResult {
  const tpl = getBescheinigungsTemplate(input.typ);
  const sub = substitutePlaceholders(tpl.kern_text, input.values);

  const content: Content[] = [
    {
      text: tpl.titel,
      alignment: "center",
      bold: true,
      fontSize: 14,
      margin: [0, 0, 0, 20],
      pageBreak: "before",
    },
    {
      text: sub.text,
      fontSize: 11,
      alignment: "justify",
      lineHeight: 1.4,
      margin: [0, 0, 0, 60],
    },
    {
      text: tpl.hinweis_text,
      fontSize: 9,
      italics: true,
      color: "#555",
      margin: [0, 0, 0, 8],
    },
  ];

  if (input.footer_sichtbar) {
    content.push({
      text: BSTBK_FOOTER_TEXT,
      fontSize: 8,
      alignment: "center",
      color: "#888",
      margin: [0, 20, 0, 0],
    });
  }

  return {
    content,
    missing_values: sub.missing_values,
    unknown_placeholders_in_template: sub.unknown_placeholders_in_template,
  };
}
