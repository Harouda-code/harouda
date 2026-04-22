/**
 * BStBK-Bescheinigungstexte — readonly Konstanten (Sprint 17.5 / Schritt 2).
 *
 * Quelle: BStBK-Verlautbarung "Hinweise zur Erstellung von
 * Jahresabschluessen" (Stand 2023).
 *
 * WICHTIG — Rechtlich normiert:
 *   - NICHT durch Nutzer editierbar.
 *   - NICHT aus DB geladen.
 *   - Aenderungen erfordern Steuerberater-Freigabe.
 *
 * HAFTUNGSRISIKO bei Textaenderung — siehe
 * docs/BSTBK-BESCHEINIGUNG-UPDATE-GUIDE.md.
 *
 * Rechtsbasis:
 *   § 242 HGB — Jahresabschluss-Pflicht.
 *   § 57 StBerG — Steuerberater-Pflichten.
 *   BStBK-Verlautbarung 2023 — Bescheinigungs-Typen.
 */

export type BescheinigungsTyp =
  | "ohne_beurteilungen"
  | "mit_plausibilitaet"
  | "mit_umfassender_beurteilung";

export type BescheinigungsTemplate = {
  readonly typ: BescheinigungsTyp;
  readonly titel: string;
  readonly kern_text: string;
  readonly hinweis_text: string;
  readonly version_stand: string;
  readonly quelle_url: string;
};

const KERN_OHNE_BEURT =
  "Auftragsgemaess haben wir den vorstehenden Jahresabschluss der " +
  "{{MandantenName}} zum {{JahresabschlussStichtag}} auf Grundlage der " +
  "uns vorgelegten Unterlagen und der erteilten Auskuenfte erstellt. " +
  "Eine Pruefung oder eine Beurteilung der Plausibilitaet der Angaben " +
  "wurde auftragsgemaess NICHT vorgenommen. Die Verantwortung fuer die " +
  "Vollstaendigkeit und Richtigkeit der Buchfuehrung, der uns zur " +
  "Verfuegung gestellten Unterlagen sowie der erteilten Auskuenfte " +
  "traegt die Geschaeftsfuehrung der {{MandantenName}}.\n\n" +
  "{{Ort}}, den {{Datum}}\n\n" +
  "{{KanzleiName}}\n\n" +
  "{{SteuerberaterName}}, Steuerberater";

const KERN_MIT_PLAUS =
  "Auftragsgemaess haben wir den vorstehenden Jahresabschluss der " +
  "{{MandantenName}} zum {{JahresabschlussStichtag}} auf Grundlage der " +
  "uns vorgelegten Unterlagen und der erteilten Auskuenfte erstellt. " +
  "Wir haben die Unterlagen und Auskuenfte auf ihre Plausibilitaet hin " +
  "beurteilt. Eine Pruefung im Sinne von § 317 HGB wurde auftragsgemaess " +
  "NICHT vorgenommen. Nach unseren Plausibilitaetsbeurteilungen sind " +
  "uns keine Sachverhalte bekannt geworden, die zu einer wesentlichen " +
  "Aenderung des vorstehenden Jahresabschlusses fuehren wuerden.\n\n" +
  "{{Ort}}, den {{Datum}}\n\n" +
  "{{KanzleiName}}\n\n" +
  "{{SteuerberaterName}}, Steuerberater";

const KERN_MIT_UMFASSEND =
  "Auftragsgemaess haben wir den vorstehenden Jahresabschluss der " +
  "{{MandantenName}} zum {{JahresabschlussStichtag}} auf Grundlage der " +
  "uns vorgelegten Unterlagen und der erteilten Auskuenfte erstellt. " +
  "Wir haben umfassende Beurteilungen durchgefuehrt; diese beinhalten " +
  "analytische Untersuchungen, Einzelfall-Beurteilungen und eine " +
  "Ueberpruefung der internen Datenkonsistenz. Eine Pruefung im Sinne " +
  "von § 317 HGB wurde auftragsgemaess NICHT vorgenommen. Nach den " +
  "umfassenden Beurteilungen sind uns keine Sachverhalte bekannt " +
  "geworden, die zu einer wesentlichen Aenderung des vorstehenden " +
  "Jahresabschlusses fuehren wuerden.\n\n" +
  "{{Ort}}, den {{Datum}}\n\n" +
  "{{KanzleiName}}\n\n" +
  "{{SteuerberaterName}}, Steuerberater";

const HINWEIS_TEXT =
  "Bei Verwendung im Rechtsverkehr ist auf Art und Umfang des erteilten Auftrags hinzuweisen.";

const VERSION_STAND = "2023-04";
const QUELLE_URL = "https://www.bstbk.de/";

export const BSTBK_BESCHEINIGUNGEN: Readonly<
  Record<BescheinigungsTyp, BescheinigungsTemplate>
> = Object.freeze({
  ohne_beurteilungen: Object.freeze({
    typ: "ohne_beurteilungen" as const,
    titel:
      "Bescheinigung ueber die Erstellung des Jahresabschlusses",
    kern_text: KERN_OHNE_BEURT,
    hinweis_text: HINWEIS_TEXT,
    version_stand: VERSION_STAND,
    quelle_url: QUELLE_URL,
  }),
  mit_plausibilitaet: Object.freeze({
    typ: "mit_plausibilitaet" as const,
    titel:
      "Bescheinigung ueber die Erstellung des Jahresabschlusses mit Plausibilitaetsbeurteilungen",
    kern_text: KERN_MIT_PLAUS,
    hinweis_text: HINWEIS_TEXT,
    version_stand: VERSION_STAND,
    quelle_url: QUELLE_URL,
  }),
  mit_umfassender_beurteilung: Object.freeze({
    typ: "mit_umfassender_beurteilung" as const,
    titel:
      "Bescheinigung ueber die Erstellung des Jahresabschlusses mit umfassenden Beurteilungen",
    kern_text: KERN_MIT_UMFASSEND,
    hinweis_text: HINWEIS_TEXT,
    version_stand: VERSION_STAND,
    quelle_url: QUELLE_URL,
  }),
});

export const BSTBK_FOOTER_TEXT =
  "Gemäß den Hinweisen der Bundessteuerberaterkammer zur Erstellung von Jahresabschlüssen";

/** Typsicherer Getter, wirft bei unbekanntem Typ. */
export function getBescheinigungsTemplate(
  typ: BescheinigungsTyp
): BescheinigungsTemplate {
  const t = BSTBK_BESCHEINIGUNGEN[typ];
  if (!t) {
    throw new Error(`Unbekannter Bescheinigungs-Typ: ${typ}`);
  }
  return t;
}
