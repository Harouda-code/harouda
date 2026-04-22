// Metadaten pro Steuerformular in harouda-app.
//
// Ehrliche Positionierung: Die Formulare in dieser App sind **eigener
// Aufbau anhand öffentlicher BMF/ELSTER-Dokumentation**. Sie sind keine
// zertifizierte Abgabeform. Der Badge auf jeder Formular-Seite macht das
// Nutzer:innen explizit sichtbar.

export type FormId =
  | "ustva"
  | "euer"
  | "gewst"
  | "kst"
  | "anlage-n"
  | "anlage-s"
  | "anlage-g"
  | "anlage-v"
  | "anlage-so"
  | "anlage-aus"
  | "anlage-kind"
  | "anlage-vorsorge"
  | "anlage-r"
  | "anlage-kap"
  | "anlage-mobility"
  | "anlage-v-sonstige"
  | "anlage-v-fewo"
  | "anlage-unterhalt"
  | "anlage-u"
  | "anlage-rav-bav"
  | "anlage-n-aus"
  | "anlage-n-dhf"
  | "anlage-av"
  | "anlage-em"
  | "anlage-haa"
  | "anlage-sonder"
  | "anlage-agb"
  | "est-1a"
  | "est-1c";

export type FormReviewStatus = "vorlaeufig" | "bestaetigt" | "final";

export type FormMeta = {
  id: FormId;
  title: string;
  /** Formular-Version (SemVer-artig; wird bei jeder Anpassung erhöht). */
  version: string;
  /** Veranlagungsjahr, auf das diese Formular-Ausprägung ausgerichtet ist. */
  veranlagungsjahr: number;
  /** ISO-Datum der letzten internen Prüfung. */
  lastReviewed: string;
  /** Status der Prüfung. */
  reviewStatus: FormReviewStatus;
  /** Quellennachweis — OFFIZIELLE Primärquelle (BMF/ELSTER), nicht diese App. */
  sources: { label: string; url: string }[];
  /** Rechtlicher Haftungsausschluss — muss auf dem Formular sichtbar sein. */
  disclaimer: string;
};

const DEFAULT_DISCLAIMER =
  "Dieses Formular ist ein eigener Aufbau anhand öffentlicher BMF- und ELSTER-Dokumentation. " +
  "Es ist keine zertifizierte Abgabeform. Vor Einreichung beim Finanzamt " +
  "durch eine qualifizierte Person (Steuerberater:in) prüfen lassen.";

const ELSTER_PORTAL = {
  label: "ELSTER — offizielles Portal der Finanzverwaltung",
  url: "https://www.elster.de",
};
const BMF = {
  label: "Bundesministerium der Finanzen",
  url: "https://www.bundesfinanzministerium.de",
};
const BZST = {
  label: "Bundeszentralamt für Steuern",
  url: "https://www.bzst.de",
};

export const FORM_META: Record<FormId, FormMeta> = {
  ustva: {
    id: "ustva",
    title: "Umsatzsteuer-Voranmeldung",
    version: "2026.04-01",
    veranlagungsjahr: 2025,
    lastReviewed: "2026-04-18",
    reviewStatus: "bestaetigt",
    sources: [ELSTER_PORTAL, BZST],
    disclaimer:
      DEFAULT_DISCLAIMER +
      " Die generierte XML-Datei kann ins ELSTER Online Portal importiert " +
      "werden; eine direkte ERiC-Submission aus dem Browser ist nicht möglich.",
  },
  euer: {
    id: "euer",
    title: "Einnahmenüberschussrechnung (Anlage EÜR)",
    version: "2026.04-01",
    veranlagungsjahr: 2024,
    lastReviewed: "2026-04-18",
    reviewStatus: "bestaetigt",
    sources: [ELSTER_PORTAL, BMF],
    disclaimer:
      DEFAULT_DISCLAIMER +
      " Die Zuordnung SKR03 → EÜR-Zeile ist eine pragmatische Näherung; " +
      "vor dem Abschluss jede Zeile fachlich überprüfen.",
  },
  gewst: {
    id: "gewst",
    title: "Gewerbesteuer",
    version: "2026.04-01",
    veranlagungsjahr: 2025,
    lastReviewed: "2026-04-18",
    reviewStatus: "bestaetigt",
    sources: [ELSTER_PORTAL],
    disclaimer: DEFAULT_DISCLAIMER,
  },
  kst: {
    id: "kst",
    title: "Körperschaftsteuer",
    version: "2026.04-01",
    veranlagungsjahr: 2025,
    lastReviewed: "2026-04-18",
    reviewStatus: "bestaetigt",
    sources: [ELSTER_PORTAL],
    disclaimer: DEFAULT_DISCLAIMER,
  },
  "anlage-n": {
    id: "anlage-n",
    title: "Anlage N — Einkünfte aus nichtselbständiger Arbeit",
    version: "2026.04-01",
    veranlagungsjahr: 2024,
    lastReviewed: "2026-04-18",
    reviewStatus: "bestaetigt",
    sources: [ELSTER_PORTAL],
    disclaimer: DEFAULT_DISCLAIMER,
  },
  "anlage-s": {
    id: "anlage-s",
    title: "Anlage S — Einkünfte aus selbständiger Arbeit",
    version: "2026.04-01",
    veranlagungsjahr: 2024,
    lastReviewed: "2026-04-18",
    reviewStatus: "bestaetigt",
    sources: [ELSTER_PORTAL],
    disclaimer: DEFAULT_DISCLAIMER,
  },
  "anlage-g": {
    id: "anlage-g",
    title: "Anlage G — Einkünfte aus Gewerbebetrieb",
    version: "2026.04-01",
    veranlagungsjahr: 2024,
    lastReviewed: "2026-04-18",
    reviewStatus: "bestaetigt",
    sources: [ELSTER_PORTAL],
    disclaimer: DEFAULT_DISCLAIMER,
  },
  "anlage-v": {
    id: "anlage-v",
    title: "Anlage V — Einkünfte aus Vermietung und Verpachtung",
    version: "2026.04-01",
    veranlagungsjahr: 2024,
    lastReviewed: "2026-04-18",
    reviewStatus: "bestaetigt",
    sources: [ELSTER_PORTAL],
    disclaimer: DEFAULT_DISCLAIMER,
  },
  "anlage-so": {
    id: "anlage-so",
    title: "Anlage SO — Sonstige Einkünfte",
    version: "2026.04-01",
    veranlagungsjahr: 2024,
    lastReviewed: "2026-04-18",
    reviewStatus: "bestaetigt",
    sources: [ELSTER_PORTAL],
    disclaimer: DEFAULT_DISCLAIMER,
  },
  "anlage-aus": {
    id: "anlage-aus",
    title: "Anlage AUS — Ausländische Einkünfte",
    version: "2026.04-01",
    veranlagungsjahr: 2024,
    lastReviewed: "2026-04-18",
    reviewStatus: "bestaetigt",
    sources: [ELSTER_PORTAL],
    disclaimer: DEFAULT_DISCLAIMER,
  },
  "anlage-kind": {
    id: "anlage-kind",
    title: "Anlage Kind — Kinderfreibetrag, Kinderbetreuung, Schulgeld",
    version: "2026.04-01",
    veranlagungsjahr: 2024,
    lastReviewed: "2026-04-18",
    reviewStatus: "bestaetigt",
    sources: [ELSTER_PORTAL, BMF],
    disclaimer:
      DEFAULT_DISCLAIMER +
      " Die Günstigerprüfung Kindergeld vs. Kinderfreibetrag ist nicht " +
      "automatisch umgesetzt — sie erfordert die volle Einkommensteuerberechnung.",
  },
  "anlage-vorsorge": {
    id: "anlage-vorsorge",
    title: "Anlage Vorsorgeaufwand — Versicherungsbeiträge & Altersvorsorge",
    version: "2026.04-01",
    veranlagungsjahr: 2024,
    lastReviewed: "2026-04-18",
    reviewStatus: "bestaetigt",
    sources: [ELSTER_PORTAL],
    disclaimer:
      DEFAULT_DISCLAIMER +
      " Höchstbetragsberechnung nach § 10 Abs. 3 + Abs. 4 EStG ist umgesetzt, " +
      "ersetzt aber keine individuelle Prüfung (z. B. Günstigerprüfung " +
      "mit Altregelung § 10 Abs. 4a EStG).",
  },
  "anlage-r": {
    id: "anlage-r",
    title: "Anlage R — Renten und andere Leistungen",
    version: "2026.04-01",
    veranlagungsjahr: 2024,
    lastReviewed: "2026-04-18",
    reviewStatus: "bestaetigt",
    sources: [ELSTER_PORTAL],
    disclaimer:
      DEFAULT_DISCLAIMER +
      " Besteuerungsanteil nach Kohortenprinzip (§ 22 EStG) ist umgesetzt; " +
      "Sonderfälle (Erwerbsminderung, Hinterbliebenenrente mit eigenem " +
      "Kohortensatz) erfordern manuelle Prüfung.",
  },
  "anlage-kap": {
    id: "anlage-kap",
    title: "Anlage KAP — Einkünfte aus Kapitalvermögen",
    version: "2026.04-01",
    veranlagungsjahr: 2024,
    lastReviewed: "2026-04-18",
    reviewStatus: "bestaetigt",
    sources: [ELSTER_PORTAL, BZST],
    disclaimer:
      DEFAULT_DISCLAIMER +
      " Günstigerprüfung (tariflicher Steuersatz statt 25 % Abgeltungsteuer) " +
      "nicht automatisch; Verlusttöpfe (Aktien vs. sonstige) sind " +
      "vereinfacht dargestellt.",
  },
  "anlage-mobility": {
    id: "anlage-mobility",
    title: "Anlage Mobilitätsprämie — Antrag §§ 101–109 EStG",
    version: "2026.04-01",
    veranlagungsjahr: 2025,
    lastReviewed: "2026-04-19",
    reviewStatus: "vorlaeufig",
    sources: [ELSTER_PORTAL, BMF],
    disclaimer:
      DEFAULT_DISCLAIMER +
      " Die Prämienhöhe wird vom Finanzamt festgesetzt (§ 105 EStG) und ist " +
      "vom Gesamteinkommen abhängig. Diese Seite erfasst nur die Antragsdaten.",
  },
  "anlage-v-sonstige": {
    id: "anlage-v-sonstige",
    title: "Anlage V-Sonstige — Beteiligungen & verschiedene Einkünfte V+V",
    version: "2026.04-01",
    veranlagungsjahr: 2025,
    lastReviewed: "2026-04-19",
    reviewStatus: "vorlaeufig",
    sources: [ELSTER_PORTAL, BMF],
    disclaimer:
      DEFAULT_DISCLAIMER +
      " Anteile an Einkünften aus Grundstücksgemeinschaften / Immobilienfonds " +
      "werden per Feststellungsbescheid zugewiesen — diese Seite erfasst " +
      "nur die Identifikationsangaben und die verschiedenen Einkünfte.",
  },
  "anlage-v-fewo": {
    id: "anlage-v-fewo",
    title: "Anlage V-FeWo — Ferienwohnung / kurzfristige Vermietung",
    version: "2026.04-01",
    veranlagungsjahr: 2025,
    lastReviewed: "2026-04-19",
    reviewStatus: "vorlaeufig",
    sources: [ELSTER_PORTAL, BMF],
    disclaimer:
      DEFAULT_DISCLAIMER +
      " Die Aufteilung der Werbungskosten auf Selbstnutzungs- und " +
      "Vermietungstage folgt der BFH-Rechtsprechung (IX R 9/08 ua.) — die " +
      "exakte Zuordnung ist nicht automatisiert und muss fachlich geprüft " +
      "werden.",
  },
  "anlage-unterhalt": {
    id: "anlage-unterhalt",
    title: "Anlage Unterhalt — Unterhaltsleistungen § 33a Abs. 1 EStG",
    version: "2026.04-01",
    veranlagungsjahr: 2025,
    lastReviewed: "2026-04-19",
    reviewStatus: "vorlaeufig",
    sources: [ELSTER_PORTAL, BMF],
    disclaimer:
      DEFAULT_DISCLAIMER +
      " Der Höchstbetrag nach § 33a Abs. 1 EStG (Grundfreibetrag) wird " +
      "um die eigenen Einkünfte der unterstützten Person gekürzt (Anrechnungs-" +
      "freibetrag 624 €). Auslandseinkünfte und Ländergruppeneinteilung sind " +
      "nicht automatisch umgesetzt.",
  },
  "anlage-u": {
    id: "anlage-u",
    title: "Anlage U — Realsplitting / Ausgleichsleistungen § 10 Abs. 1a EStG",
    version: "2026.04-01",
    veranlagungsjahr: 2025,
    lastReviewed: "2026-04-19",
    reviewStatus: "vorlaeufig",
    sources: [ELSTER_PORTAL, BMF],
    disclaimer:
      DEFAULT_DISCLAIMER +
      " Die Anlage U ist ein zweiseitiger Antrag: Abschnitt A (Antragsteller) " +
      "und Abschnitt B (Empfänger-Zustimmung). Die Zustimmung ist bindend — " +
      "der Empfänger versteuert die Leistung als sonstige Einkünfte (§ 22 " +
      "Nr. 1a EStG, WK-Pauschale 102 €). Höchstbetrag Realsplitting: 13.805 € " +
      "(+ Basis-KV/PV). Die Zustimmungserklärung wird dem Finanzamt des " +
      "Empfängers im Original eingereicht.",
  },
  "anlage-rav-bav": {
    id: "anlage-rav-bav",
    title: "Anlage R-AV/bAV — Riester/Rürup/betriebliche Altersversorgung",
    version: "2026.04-01",
    veranlagungsjahr: 2025,
    lastReviewed: "2026-04-19",
    reviewStatus: "vorlaeufig",
    sources: [ELSTER_PORTAL, BMF],
    disclaimer:
      DEFAULT_DISCLAIMER +
      " Pro Person ein Formular; zwei Rentenströme je Formular. " +
      "Der Versorgungsfreibetrag nach § 19 Abs. 2 EStG (Kohortensatz) wird " +
      "NICHT automatisch berechnet. Komplexe Fälle: schädliche Verwendung, " +
      "Wohnförderkonto, Kleinbetragsrente, Auflösungsbeträge — fachliche " +
      "Prüfung erforderlich.",
  },
  "anlage-n-aus": {
    id: "anlage-n-aus",
    title: "Anlage N-AUS — Ausländische Einkünfte aus nichtselbständiger Arbeit",
    version: "2026.04-01",
    veranlagungsjahr: 2025,
    lastReviewed: "2026-04-19",
    reviewStatus: "vorlaeufig",
    sources: [ELSTER_PORTAL, BMF],
    disclaimer:
      DEFAULT_DISCLAIMER +
      " Je ausländischem Staat ein separates Formular. Die Aufteilung " +
      "Z. 45 (verbleibender Arbeitslohn × Auslandsarbeitstage / Arbeitstage gesamt) " +
      "folgt der 183-Tage-/Kassenstaat-Prüfung des jeweiligen DBA — die " +
      "Anwendbarkeit des DBA/ATE/ZÜ wird hier NICHT geprüft.",
  },
  "anlage-n-dhf": {
    id: "anlage-n-dhf",
    title: "Anlage N-DHF — Doppelte Haushaltsführung",
    version: "2026.04-01",
    veranlagungsjahr: 2025,
    lastReviewed: "2026-04-19",
    reviewStatus: "vorlaeufig",
    sources: [ELSTER_PORTAL, BMF],
    disclaimer:
      DEFAULT_DISCLAIMER +
      " Beachten Sie die 3-Monatsfrist für Verpflegungsmehraufwendungen " +
      "(§ 9 Abs. 4a Satz 6 EStG) und den Höchstbetrag Unterkunftskosten " +
      "1.000 €/Monat im Inland (§ 9 Abs. 1 Nr. 5 Satz 4). Pauschbeträge für " +
      "Auslands-Verpflegung sind nach Land unterschiedlich — im BMF- " +
      "Schreiben nachzuschlagen.",
  },
  "anlage-av": {
    id: "anlage-av",
    title: "Anlage AV — Altersvorsorgebeiträge (Riester-Verträge)",
    version: "2026.04-01",
    veranlagungsjahr: 2025,
    lastReviewed: "2026-04-19",
    reviewStatus: "vorlaeufig",
    sources: [ELSTER_PORTAL, BMF],
    disclaimer:
      DEFAULT_DISCLAIMER +
      " Nur ausfüllen, wenn Sie den zusätzlichen Sonderausgabenabzug nach " +
      "§ 10a EStG geltend machen wollen. Die Beiträge selbst werden vom " +
      "Anbieter direkt an die Zentrale Zulagenstelle (ZfA) übermittelt. Die " +
      "Günstigerprüfung Zulage vs. Sonderausgabenabzug erfolgt im Bescheid — " +
      "sie wird hier NICHT automatisch berechnet.",
  },
  "anlage-em": {
    id: "anlage-em",
    title: "Anlage Energetische Maßnahmen — § 35c EStG",
    version: "2026.04-01",
    veranlagungsjahr: 2025,
    lastReviewed: "2026-04-19",
    reviewStatus: "vorlaeufig",
    sources: [ELSTER_PORTAL, BMF],
    disclaimer:
      DEFAULT_DISCLAIMER +
      " Die Steuerermäßigung wird auf 3 Jahre verteilt (7 % / 7 % / 6 %, " +
      "max. je Jahr 14.000 / 14.000 / 12.000 €). Gebäude muss bei Beginn " +
      "mindestens 10 Jahre alt sein. Bescheinigungspflicht des ausführenden " +
      "Fachunternehmens oder einer Person mit Ausstellungsberechtigung " +
      "nach § 88 GEG.",
  },
  "anlage-haa": {
    id: "anlage-haa",
    title: "Anlage Haushaltsnahe Aufwendungen — § 35a EStG",
    version: "2026.04-01",
    veranlagungsjahr: 2025,
    lastReviewed: "2026-04-19",
    reviewStatus: "vorlaeufig",
    sources: [ELSTER_PORTAL, BMF],
    disclaimer:
      DEFAULT_DISCLAIMER +
      " § 35a EStG: Minijob 20 % (max. 510 €), sozialvers. Beschäftigung / " +
      "Dienstleistungen 20 % (max. 4.000 €), Handwerkerleistungen 20 % " +
      "(max. 1.200 €). Voraussetzung: Rechnung + unbare Zahlung (§ 35a " +
      "Abs. 5 Satz 3). Bei KfW/BAFA/§ 35c nicht absetzbar.",
  },
  "anlage-sonder": {
    id: "anlage-sonder",
    title: "Anlage Sonderausgaben — § 10/10b/10c EStG (ohne Versicherung/Altersvorsorge)",
    version: "2026.04-01",
    veranlagungsjahr: 2025,
    lastReviewed: "2026-04-19",
    reviewStatus: "vorlaeufig",
    sources: [ELSTER_PORTAL, BMF],
    disclaimer:
      DEFAULT_DISCLAIMER +
      " Kirchensteuer (Z. 4): NICHT erfassen, soweit sie als Zuschlag zur " +
      "Abgeltungsteuer einbehalten wurde. Spenden: Zuwendungsbestätigung " +
      "erforderlich (außer Kleinbetrag < 300 €). Versorgungsleistungen/" +
      "Dauernde Lasten nur für vor dem 1.1.2008 abgeschlossene Verträge " +
      "bzw. § 10 Abs. 1a EStG.",
  },
  "anlage-agb": {
    id: "anlage-agb",
    title: "Anlage Außergewöhnliche Belastungen — §§ 33, 33a, 33b EStG",
    version: "2026.04-01",
    veranlagungsjahr: 2025,
    lastReviewed: "2026-04-19",
    reviewStatus: "vorlaeufig",
    sources: [ELSTER_PORTAL, BMF],
    disclaimer:
      DEFAULT_DISCLAIMER +
      " Behinderten-Pauschbetrag gestaffelt nach GdB (2021er-Reform) · Hilflos/" +
      "Blind 7.400 € · Pflege-Pauschbetrag nach Pflegegrad (600/1.100/1.800 €) · " +
      "Fahrtkostenpauschale 900/4.500 €. Die zumutbare Belastung nach § 33 Abs. 3 " +
      "EStG wird hier NICHT automatisch vom Gesamtbetrag abgezogen — das erfolgt " +
      "im Steuerbescheid auf Basis des Gesamtbetrags der Einkünfte.",
  },
  "est-1a": {
    id: "est-1a",
    title: "Hauptvordruck ESt 1 A — Einkommensteuererklärung",
    version: "2026.04-01",
    veranlagungsjahr: 2025,
    lastReviewed: "2026-04-19",
    reviewStatus: "vorlaeufig",
    sources: [ELSTER_PORTAL, BMF],
    disclaimer:
      DEFAULT_DISCLAIMER +
      " Zentrales Deckblatt der ESt-Erklärung · verweist auf alle Anlagen. " +
      "Die tatsächliche Steuerberechnung (zu versteuerndes Einkommen, Tarif, " +
      "Kirchensteuer, Soli) findet NICHT hier statt — das übernimmt das " +
      "Finanzamt bzw. ELSTER aus den aggregierten Anlagen-Daten.",
  },
  "est-1c": {
    id: "est-1c",
    title: "Hauptvordruck ESt 1 C — beschränkt steuerpflichtige Personen",
    version: "2026.04-01",
    veranlagungsjahr: 2025,
    lastReviewed: "2026-04-19",
    reviewStatus: "vorlaeufig",
    sources: [ELSTER_PORTAL, BMF, BZST],
    disclaimer:
      DEFAULT_DISCLAIMER +
      " Nur für Personen OHNE inländischen Wohnsitz / gewöhnlichen Aufenthalt, " +
      "die in Deutschland nur mit bestimmten Einkünften (§ 49 EStG) steuer- " +
      "pflichtig sind. Antragsveranlagung nach § 50 Abs. 2 EStG erfordert " +
      "EU/EWR/CH-Ansässigkeit oder inl. öffentliche Kasse. DAC6-Meldepflicht " +
      "(Z. 67–69) und AStG-Fragen (Z. 70–81) beachten.",
  },
};

export function getFormMeta(id: FormId): FormMeta {
  return FORM_META[id];
}
