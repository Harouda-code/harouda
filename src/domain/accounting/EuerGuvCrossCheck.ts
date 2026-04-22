/**
 * EÜR ↔ GuV Cross-Check.
 *
 * Zweck: Ein Unternehmen nutzt entweder § 4 Abs. 3 EStG (EÜR) ODER das
 * HGB-Kaufmann-Regime mit GuV — nicht beides gleichzeitig. Bei Migrations-
 * oder Vergleichsszenarien kann eine Steuerberatung jedoch auf dieselben
 * Journaldaten beide Rechenwege anwenden und die Ergebnisse gegenüberstellen.
 *
 * Erwartete systematische Abweichungen (keine Fehler):
 *   - Bewirtung 30 % (§ 4 Abs. 5 Nr. 2 EStG): EÜR zählt 30 % als Kz 228
 *     (Add-back in Kz 219), GuV zieht den vollen Betrag als Aufwand ab.
 *     → EÜR steuerlicher Gewinn = GuV Jahresergebnis + 30 % der Bewirtung.
 *   - Geschenke > 50 € (§ 4 Abs. 5 Nr. 1 EStG): gleiche Logik über SKR03
 *     4636-4639 → Kz 228.
 *   - Zufluss- vs. Periodisierungsprinzip: Timing-Differenzen zwischen
 *     Zahlungs- und Leistungszeitpunkt. Wir dokumentieren den Delta ohne
 *     ihn aufzuschlüsseln (erfordert Rechnungs-/Zahlungs-Metadaten).
 *   - AfA-Methoden können abweichen (beide Regime zulassen verschiedene).
 *
 * Die Summe aller Kz 228 + IAB-Korrekturen bildet den erklärbaren Delta.
 * Alles darüber hinaus wird als "unexpectedDifference" gemeldet.
 */

import type { Account, JournalEntry } from "../../types/db";
import { Money } from "../../lib/money/Money";
import type { SizeClass } from "./hgb266Structure";
import { buildGuv, type GuvReport } from "./GuvBuilder";
import { buildEuer, type EuerReport } from "../euer/EuerBuilder";

export type EuerGuvCrossCheckOptions = {
  accounts: Account[];
  entries: JournalEntry[];
  wirtschaftsjahr: { von: string; bis: string };
  sizeClass?: SizeClass;
};

export type ExpectedDifferenceKategorie = "BEWIRTUNG" | "GESCHENKE" | "IAB" | "TIMING";

export type ExpectedDifference = {
  kategorie: ExpectedDifferenceKategorie;
  beschreibung: string;
  betrag: string;
  richtung: "EUER_HOEHER" | "GUV_HOEHER";
};

export type EuerGuvCrossCheckReport = {
  euer: EuerReport;
  guv: GuvReport;

  steuerlicherGewinnEuer: string;
  jahresergebnisGuv: string;
  nettoVergleich: string; // EÜR − GuV

  bekannteUnterschiede: ExpectedDifference[];
  /** Nicht erklärbarer Rest (nach Abzug der bekannten Unterschiede). */
  unexpectedDifference: string;
  hasUnexpectedDifference: boolean;

  warnings: string[];

  _internal: {
    euerGewinn: Money;
    guvErgebnis: Money;
    bruttoDelta: Money;
    erklaerbarerDelta: Money;
    unerklaerbarerRest: Money;
  };
};

/** Toleranz für "unerklärbarer Rest": ≥ 0,01 € → gemeldet. */
const EPSILON = new Money("0.01");

export function buildEuerGuvCrossCheck(
  options: EuerGuvCrossCheckOptions
): EuerGuvCrossCheckReport {
  const sizeClass: SizeClass = options.sizeClass ?? "ALL";

  const guv = buildGuv(options.accounts, options.entries, {
    periodStart: options.wirtschaftsjahr.von,
    stichtag: options.wirtschaftsjahr.bis,
    sizeClass,
    verfahren: "GKV",
  });

  const euer = buildEuer({
    accounts: options.accounts,
    entries: options.entries,
    wirtschaftsjahr: options.wirtschaftsjahr,
    istKleinunternehmer: false,
  });

  const euerGewinn = euer._internal.steuerlicherGewinn;
  const guvErgebnis = guv._internal.jahresergebnis;
  const bruttoDelta = euerGewinn.minus(guvErgebnis); // positiv = EÜR höher

  const bekannteUnterschiede: ExpectedDifference[] = [];
  let erklaerbarerDelta = Money.zero();

  // Bewirtung: 30 % nicht abziehbar → Kz 228-Anteil
  const bewirtungNichtAbz = new Money(euer.bewirtung.nichtAbzugsfaehig);
  if (bewirtungNichtAbz.isPositive()) {
    bekannteUnterschiede.push({
      kategorie: "BEWIRTUNG",
      beschreibung:
        "Bewirtung 30 % nicht abziehbar (§ 4 Abs. 5 Nr. 2 EStG): EÜR addiert in Kz 228 zurück, GuV zieht voll als Aufwand ab.",
      betrag: bewirtungNichtAbz.toFixed2(),
      richtung: "EUER_HOEHER",
    });
    erklaerbarerDelta = erklaerbarerDelta.plus(bewirtungNichtAbz);
  }

  // Geschenke > 50 €: Buchungen auf SKR03 4636-4639 erscheinen in Kz 228
  // (separate Konten, nicht splitPercent). Nettoeffekt ähnlich wie Bewirtung.
  const geschenkeUeber = new Money(euer.geschenke.ueberGrenze);
  if (geschenkeUeber.isPositive()) {
    bekannteUnterschiede.push({
      kategorie: "GESCHENKE",
      beschreibung:
        "Geschenke > 50 € (§ 4 Abs. 5 Nr. 1 EStG): EÜR verbucht in Kz 228 als nicht abziehbar.",
      betrag: geschenkeUeber.toFixed2(),
      richtung: "EUER_HOEHER",
    });
    erklaerbarerDelta = erklaerbarerDelta.plus(geschenkeUeber);
  }

  // IAB § 7g: Hinzurechnung (Kz 206) und Auflösung (Kz 210) sind EÜR-spezifisch
  const iabKorrektur = (euer._internal.byKz.get("206") ?? Money.zero()).plus(
    euer._internal.byKz.get("210") ?? Money.zero()
  );
  if (iabKorrektur.isPositive()) {
    bekannteUnterschiede.push({
      kategorie: "IAB",
      beschreibung:
        "§ 7g EStG Hinzurechnung / Auflösung IAB: EÜR-spezifische Korrekturen in Kz 206/210.",
      betrag: iabKorrektur.toFixed2(),
      richtung: "EUER_HOEHER",
    });
    erklaerbarerDelta = erklaerbarerDelta.plus(iabKorrektur);
  }

  const unerklaerbarerRest = bruttoDelta.minus(erklaerbarerDelta);
  const hasUnexpected = unerklaerbarerRest.abs().greaterThan(EPSILON);

  const warnings: string[] = [];
  if (hasUnexpected) {
    warnings.push(
      `Unerklärbare Differenz ${unerklaerbarerRest.toFixed2()} € zwischen EÜR (${euerGewinn.toFixed2()}) und GuV (${guvErgebnis.toFixed2()}). ` +
        `Mögliche Ursachen: Zufluss-Abfluss-Prinzip vs. Periodisierung, unterschiedliche AfA-Methoden, ` +
        `weitere nicht-abziehbare BA (§ 4 Abs. 5b EStG), oder Konten die in nur einem Mapping-System auftauchen.`
    );
  }
  if (bekannteUnterschiede.length > 0 && !hasUnexpected) {
    warnings.push(
      `Delta von ${bruttoDelta.toFixed2()} € ist durch ${bekannteUnterschiede.length} bekannte Ursache(n) vollständig erklärt.`
    );
  }

  return {
    euer,
    guv,
    steuerlicherGewinnEuer: euerGewinn.toFixed2(),
    jahresergebnisGuv: guvErgebnis.toFixed2(),
    nettoVergleich: bruttoDelta.toFixed2(),
    bekannteUnterschiede,
    unexpectedDifference: unerklaerbarerRest.toFixed2(),
    hasUnexpectedDifference: hasUnexpected,
    warnings,
    _internal: {
      euerGewinn,
      guvErgebnis,
      bruttoDelta,
      erklaerbarerDelta,
      unerklaerbarerRest,
    },
  };
}
