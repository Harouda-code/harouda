/**
 * DSuV-Basis-Types (Sprint 15 / Schritt 2).
 *
 * Datenerfassungs- und -uebermittlungsverordnung (DEUeV) nach
 * §§ 28a/28b SGB IV. Diese Typen bilden die vom SV-Meldeportal
 * (Nachfolger sv.net seit 2024) verlangte Datenstruktur ab — nicht
 * ein 1:1-Mapping gegen das amtliche DSuV-Schema (das waere ein
 * Folge-Sprint und verlangt ITSG-Trustcenter-Zertifikat).
 *
 * Rechtsquellen:
 *  - §§ 28a, 28b SGB IV.
 *  - Gemeinsame Grundsaetze GKV-Spitzenverband + ITSG
 *    (gkv-datenaustausch.de).
 *  - Schluesselverzeichnis BA Taetigkeitsschluessel 2010 (fuer
 *    9-stelligen Taetigkeitsschluessel).
 *
 * SCHEMA-RECHTSFLAGGE: Version-Tag liegt in DSUV_SCHEMA_VERSION
 * (siehe DsuvXmlBuilder.ts). Jaehrlicher Update-Rhythmus:
 * docs/DSUV-SCHEMA-UPDATE-GUIDE.md.
 */

/** Abgabegrund-Schluessel (Auszug der haeufigsten Gruende). */
export type DEUeVAbgabegrund =
  | "10" // Anmeldung wegen Beschaeftigungsaufnahme
  | "11" // Anmeldung wegen Krankenkassenwechsel
  | "12" // Anmeldung wegen Beitragsgruppenwechsel
  | "13" // Anmeldung wegen sonstiger Gruenden
  | "30" // Abmeldung wegen Ende der Beschaeftigung
  | "31" // Abmeldung wegen Krankenkassenwechsel
  | "32" // Abmeldung wegen Beitragsgruppenwechsel
  | "33" // Abmeldung wegen sonstiger Gruenden
  | "40" // Gleichzeitige An- und Abmeldung
  | "50" // Jahresmeldung
  | "51" // Unterbrechungsmeldung
  | "70"; // Stornierung einer Meldung

/** Personengruppenschluessel nach § 28a Abs. 3 Nr. 2 SGB IV. */
export type Personengruppe =
  | "101" // sozialversicherungspflichtig Beschaeftigte
  | "109" // geringfuegig entlohnt Beschaeftigte (Minijob)
  | "110" // kurzfristig Beschaeftigte
  | "190" // Auszubildende
  | "900"; // Praktikant

/** Beitragsgruppenschluessel nach § 28a Abs. 3 Nr. 4 SGB IV
 *  (4-stellig: KV | RV | AV | PV). */
export type Beitragsgruppe = {
  kv: "0" | "1" | "3" | "5" | "6" | "9";
  rv: "0" | "1" | "3" | "5";
  av: "0" | "1" | "2";
  pv: "0" | "1" | "2";
};

/** Default „1-1-1-1" = voll SV-beitragspflichtig. */
export const BG_VOLL_SV_PFLICHTIG: Beitragsgruppe = {
  kv: "1",
  rv: "1",
  av: "1",
  pv: "1",
};

/** Default „6-5-0-0" = Minijob (Pauschalbeitrag 2%). */
export const BG_MINIJOB: Beitragsgruppe = {
  kv: "6",
  rv: "5",
  av: "0",
  pv: "0",
};

export type Anschrift = {
  strasse: string;
  hausnummer: string;
  plz: string;
  ort: string;
};

export type ArbeitnehmerDsuv = {
  sv_nummer: string; // 12 Zeichen
  nachname: string;
  vorname: string;
  geburtsdatum: string; // YYYY-MM-DD
  /** ISO 3166-1 alpha-2 oder DEUeV-Schluesselcode. */
  staatsangehoerigkeit: string;
  anschrift: Anschrift;
  geburtsname?: string;
  geburtsort?: string;
};

export type ArbeitgeberDsuv = {
  /** Betriebsnummer des Arbeitgebers, 8-stellig, vergeben durch die
   *  Bundesagentur fuer Arbeit. */
  betriebsnummer: string;
  name: string;
  anschrift: Anschrift;
};

export type BeschaeftigungDsuv = {
  personengruppe: Personengruppe;
  beitragsgruppe: Beitragsgruppe;
  /** 9-stellig nach Taetigkeitsschluessel-Verzeichnis 2010 der BA. */
  taetigkeitsschluessel: string;
  mehrfachbeschaeftigung: boolean;
};

export type EntgeltDsuv = {
  /** Bruttoentgelt fuer die Rentenversicherung (EUR, 2 NK). */
  brutto_rv: number;
  /** Bruttoentgelt fuer die Krankenversicherung (EUR, 2 NK). */
  brutto_kv: number;
  /** § 20 Abs. 2 SGB IV — Uebergangsbereich / Gleitzone. */
  gleitzone_flag: boolean;
};

/** DEUeV-Meldedatensatz. */
export type DEUeVMeldung = {
  abgabegrund: DEUeVAbgabegrund;
  meldezeitraum_von: string; // YYYY-MM-DD
  meldezeitraum_bis: string; // YYYY-MM-DD
  arbeitnehmer: ArbeitnehmerDsuv;
  arbeitgeber: ArbeitgeberDsuv;
  beschaeftigung: BeschaeftigungDsuv;
  entgelt?: EntgeltDsuv;
  /** 8-stellige BBNR der Krankenkasse als Einzugsstelle. */
  einzugsstelle_bbnr: string;
};

/**
 * Extra-Daten, die NICHT im aktuellen Arbeitnehmer-Type liegen
 * (Sprint 15 Tech-Debt). Der Builder akzeptiert sie als expliziten
 * Parameter — die Persistenz dieser Felder ist Folge-Sprint-Scope.
 */
export type ArbeitnehmerExtraData = {
  staatsangehoerigkeit: string;
  geburtsname?: string;
  geburtsort?: string;
  anschrift: Anschrift;
  taetigkeitsschluessel: string;
  mehrfachbeschaeftigung: boolean;
  einzugsstelle_bbnr: string;
};

export type ArbeitgeberExtraData = {
  betriebsnummer: string;
  name: string;
  anschrift: Anschrift;
};
