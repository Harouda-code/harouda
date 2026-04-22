/**
 * Belegerfassungs-Typen.
 *
 * Ein Beleg ist eine Rechnung, Quittung, Kassenzettel o. ä. und wird in
 * einen oder mehrere Journal-Einträge (Positionen) aufgelöst. Jede
 * Position hat eine SOLL- oder HABEN-Seite.
 */

import type { Money } from "../../lib/money/Money";

export type Belegart =
  | "AUSGANGSRECHNUNG"
  | "EINGANGSRECHNUNG"
  | "KASSENBELEG"
  | "BANKBELEG"
  | "SONSTIGES";

export type Zahlungsart =
  | "UEBERWEISUNG"
  | "BAR"
  | "EC"
  | "KREDITKARTE"
  | "LASTSCHRIFT"
  | "SONSTIGE";

export type BelegPosition = {
  konto: string;
  side: "SOLL" | "HABEN";
  betrag: Money;
  text?: string;
  ustSatz?: number | null; // z. B. 0.19, 0.07, 0
};

export type BelegPartner = {
  /** Debitor- oder Kreditoren-Kontonummer. */
  kontoNr?: string;
  name: string;
  adresse?: string;
  ustId?: string;
  land?: string;
};

export type BelegEntry = {
  belegart: Belegart;
  belegnummer: string;
  belegdatum: string; // YYYY-MM-DD
  buchungsdatum: string;
  leistungsdatum?: string;
  beschreibung: string;
  partner: BelegPartner;

  positionen: BelegPosition[];

  netto?: Money;
  steuerbetrag?: Money;
  brutto?: Money;

  zahlung?: {
    art: Zahlungsart;
    datum?: string;
    betrag?: Money;
    skonto_prozent?: number;
  };

  /** Bei IG-Lieferung: § 14a UStG-Pflicht. */
  istIgLieferung?: boolean;
  /** Bei Reverse Charge § 13b UStG. */
  istReverseCharge?: boolean;
};
