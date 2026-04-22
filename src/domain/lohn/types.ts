/**
 * Typen für Lohnabrechnung. Mandantenfähig (mandant_id), Money-basiert.
 *
 * Die Kernfiguren folgen BMF-Lohnsteuer-Rechtsterminologie; Feldnamen
 * entsprechen soweit möglich den DEÜV-/ELStAM-Bezeichnungen.
 */

import type { Money } from "../../lib/money/Money";

export type Steuerklasse = 1 | 2 | 3 | 4 | 5 | 6;
export type Konfession = "EV" | "RK" | "NONE";
export type Bundesland =
  | "BW"
  | "BY"
  | "BE"
  | "BB"
  | "HB"
  | "HH"
  | "HE"
  | "MV"
  | "NI"
  | "NW"
  | "RP"
  | "SL"
  | "SN"
  | "ST"
  | "SH"
  | "TH";
export type Beschaeftigungsart =
  | "VOLLZEIT"
  | "TEILZEIT"
  | "MINIJOB"
  | "MIDIJOB"
  | "KURZFRISTIG";

export type KvBeitragsart = "GESETZLICH" | "PRIVAT" | "FREIWILLIG_GESETZLICH";

export type Arbeitnehmer = {
  id: string;
  mandant_id: string;
  personalNr: string;
  name: string;
  vorname: string;
  geburtsdatum: string;
  sv_nummer: string;
  steuer_id: string;

  // Steuerliche Merkmale (ELStAM)
  steuerklasse: Steuerklasse;
  faktor?: string;
  kinderfreibetraege: number;
  kirchensteuerpflichtig: boolean;
  konfession: Konfession;
  bundesland: Bundesland;

  // Sozialversicherung
  kv_pflicht: boolean;
  kv_beitragsart: KvBeitragsart;
  /** Kassen-spezifischer Zusatzbeitrag in Prozent (z. B. "2.5"). */
  kv_zusatzbeitrag: string;
  rv_pflicht: boolean;
  av_pflicht: boolean;
  pv_pflicht: boolean;
  /** § 55 Abs. 3 SGB XI — Zuschlag 0,6 % für Kinderlose ab 23 Jahre. */
  pv_kinderlos_zuschlag: boolean;
  /** Für Abschlag ab 2. Kind nach § 55 Abs. 3 SGB XI. */
  pv_anzahl_kinder: number;

  beschaeftigungsart: Beschaeftigungsart;
  betriebsnummer: string;

  eintrittsdatum: string;
  austrittsdatum?: string;
};

export type LohnArtTyp = "LAUFENDER_BEZUG" | "SONSTIGER_BEZUG";

export type LohnArt = {
  id: string;
  bezeichnung: string;
  typ: LohnArtTyp;
  steuerpflichtig: boolean;
  svpflichtig: boolean;
  /** Referenz auf § 3 EStG-Nr., falls steuerfrei. */
  steuerfrei_grund?: string;
  sv_frei_grund?: string;
  /** LStA-Kennzahl-Feld, in dem diese Lohnart gemeldet wird. */
  lst_meldung_feld: string;
};

export type Lohnbuchung = {
  id: string;
  arbeitnehmer_id: string;
  abrechnungsmonat: string; // YYYY-MM
  lohnart_id: string;
  betrag: Money;
  stunden?: number;
  menge?: number;
  beleg?: string;
  buchungsdatum: string;
};

export type SvBeitraegeAn = {
  kv: Money;
  kv_zusatz: Money;
  pv: Money;
  rv: Money;
  av: Money;
  gesamt: Money;
};

export type SvBeitraegeAg = {
  kv: Money;
  kv_zusatz: Money;
  pv: Money;
  rv: Money;
  av: Money;
  u1: Money;
  u2: Money;
  u3: Money;
  gesamt: Money;
};

export type LohnabrechnungAbzuege = {
  lohnsteuer: Money;
  solidaritaetszuschlag: Money;
  kirchensteuer: Money;
  kv_an: Money;
  kv_zusatz_an: Money;
  pv_an: Money;
  rv_an: Money;
  av_an: Money;
  gesamtAbzuege: Money;
};

export type Lohnabrechnung = {
  arbeitnehmer_id: string;
  abrechnungsmonat: string;

  // Brutto
  laufenderBrutto: Money;
  sonstigeBezuege: Money;
  gesamtBrutto: Money;
  svBrutto: Money;

  abzuege: LohnabrechnungAbzuege;

  // Formatierte String-Versionen (für JSON / UI)
  formatted: {
    laufenderBrutto: string;
    sonstigeBezuege: string;
    gesamtBrutto: string;
    auszahlungsbetrag: string;
    gesamtkostenArbeitgeber: string;
  };

  arbeitgeberKosten: SvBeitraegeAg;

  auszahlungsbetrag: Money;
  gesamtkostenArbeitgeber: Money;

  /** Info zur Nachvollziehbarkeit — welches LSt-Verfahren, welche Parameter. */
  _meta: {
    lstMethode: "JAHRESBERECHNUNG_§39b_EStG";
    steuerklasseAngewandt: Steuerklasse;
    kvPflichtig: boolean;
    rvPflichtig: boolean;
    svBemessungKvPv: string;
    svBemessungRvAv: string;
  };
};

/** Archiv-Row einer abgeschlossenen Lohnabrechnung — DEMO-Shape und
 *  DB-Spalten-Äquivalent (lohnabrechnungen_archiv). Aggregatwerte sind
 *  numerisch, weil sie beim Upsert aus `Money.toNumber()` stammen. Der
 *  volle `Lohnabrechnung`-JSON-Snapshot liegt in `abrechnung_json` in
 *  der DB, im DEMO wird er — sofern vorhanden — in `abrechnung_json`
 *  ebenfalls gespeichert. `batch_id` verknüpft den Archiv-Eintrag mit
 *  dem Journal-Batch (Migration 0028). */
export type LohnabrechnungArchivRow = {
  id: string;
  company_id: string | null;
  client_id: string | null;
  employee_id: string;
  abrechnungsmonat: string;
  gesamt_brutto: number;
  gesamt_netto: number;
  gesamt_abzuege: number;
  gesamt_ag_kosten: number;
  batch_id?: string | null;
  locked: boolean;
  created_at: string;
  abrechnung_json?: Record<string, unknown> | null;
};
