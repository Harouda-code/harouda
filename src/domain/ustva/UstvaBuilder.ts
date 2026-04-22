/**
 * UStVA-Builder (§ 18 UStG, BMF-Vordruck 2025).
 *
 * Aggregiert Journal-Buchungen innerhalb [periodStart, periodEnd] und
 * berechnet alle Kennzahlen nach USTVA_STRUCTURE_2025:
 *
 *   - UMSATZ_NETTO / IG_ERWERB / REVERSE_CHARGE: aus Journal per
 *     SKR03_USTVA_MAPPING (Kz 81, 86, 89, 93, 46, 52, 73, 78 …)
 *   - STEUERBETRAG / STEUERBETRAG_AGGREGAT: auto-computed als
 *     Bemessungsgrundlage × steuersatz (Money-Präzision)
 *   - VORSTEUER*: aus Journal-Vorsteuer-Konten (1570-er Bereich)
 *   - SUBTOTAL: Σ components
 *   - FINAL_RESULT Kz 65: UST_SUMME − VST_SUMME
 *
 * Vorzeichen-Konvention: alle Werte sind positiv (Bemessungsgrundlage,
 * Steuerbeträge, Vorsteuer). Nur Kz 65 (Zahllast/Erstattung) ist vorzeichen-
 * behaftet: positiv = Zahlung ans FA, negativ = Erstattung vom FA.
 */

import type { Account, JournalEntry } from "../../types/db";
import { Money } from "../../lib/money/Money";
import {
  USTVA_STRUCTURE_2025,
  USTVA_BY_KZ,
  type UstvaPosition,
} from "./ustvaStructure";
import {
  findUstvaRule,
  type UstvaSource,
} from "./skr03UstvaMapping";
import {
  calculateUstvaAbgabefrist,
  formatGermanDate,
  formatIso,
  periodEnd,
  periodStart,
  periodeLabel,
  type Periode,
} from "../../lib/date/abgabefristCalculator";

export type UstvaOptions = {
  accounts: Account[];
  entries: JournalEntry[];
  voranmeldungszeitraum: "MONAT" | "QUARTAL";
  monat?: number;
  quartal?: 1 | 2 | 3 | 4;
  jahr: number;
  dauerfristverlaengerung: boolean;
  /** Sondervorauszahlung (1/11 der Vorjahres-Zahllast), nur relevant bei
   *  Jahres-Last-Voranmeldung (Dezember / Q4) wenn Dauerfrist aktiv. */
  sondervorauszahlung?: Money;
};

export type KennzahlView = {
  kz: string;
  name: string;
  type: UstvaPosition["type"];
  section: UstvaPosition["section"];
  wert: string;
  wertRaw: Money;
  isCalculated: boolean;
  computation?: string;
  hgb?: string;
  /** Konten die zu dieser Kennzahl beitragen (für Transparenz / Debug). */
  kontenBeitraege: {
    kontoNr: string;
    bezeichnung: string;
    betrag: string;
  }[];
};

export type UstvaReport = {
  zeitraum: {
    von: string;
    bis: string;
    bezeichnung: string;
    art: "MONAT" | "QUARTAL";
    jahr: number;
    monat?: number;
    quartal?: 1 | 2 | 3 | 4;
  };

  kennzahlen: KennzahlView[];

  summeUmsatzsteuer: string;
  summeVorsteuer: string;
  zahllast: string; // positiv = Zahlung ans FA
  erstattung: string; // positiv = Erstattung vom FA

  isZahllast: boolean;
  isErstattung: boolean;

  dauerfrist: {
    active: boolean;
    sondervorauszahlung?: string;
  };

  abgabefrist: string; // DD.MM.YYYY
  abgabefristIso: string; // YYYY-MM-DD
  tageBisAbgabe: number;

  unmappedAccounts: {
    kontoNr: string;
    bezeichnung: string;
    saldo: string;
    reason: string;
  }[];

  _internal: {
    summeUmsatzsteuer: Money;
    summeVorsteuer: Money;
    zahllast: Money;
    abgabefristDate: Date;
    byKz: Map<string, Money>;
  };

  metadata: {
    generatedAt: string;
    formular: "BMF UStVA 2025 (nachgebildet)";
  };
};

/** Aggregiert Journal-Buchungen je Konto in Periode. */
function accountSaldo(
  kontoNr: string,
  entriesInPeriod: JournalEntry[]
): { soll: Money; haben: Money } {
  let soll = Money.zero();
  let haben = Money.zero();
  for (const e of entriesInPeriod) {
    const betrag = new Money(Number.isFinite(e.betrag) ? e.betrag : 0);
    if (e.soll_konto === kontoNr) soll = soll.plus(betrag);
    if (e.haben_konto === kontoNr) haben = haben.plus(betrag);
  }
  return { soll, haben };
}

/** Bestimmt die Bemessungsgrundlage für ein Konto aus source. */
function valueForSource(
  source: UstvaSource,
  saldo: { soll: Money; haben: Money }
): Money {
  switch (source) {
    case "UMSATZ":
      return saldo.haben.minus(saldo.soll);
    case "AUFWAND":
    case "VORSTEUER":
      return saldo.soll.minus(saldo.haben);
    case "UST":
      // Haben-Saldo (Verbindlichkeit)
      return saldo.haben.minus(saldo.soll);
  }
}

export function buildUstva(options: UstvaOptions): UstvaReport {
  // ---- Periode auflösen ----
  const periode: Periode = {
    jahr: options.jahr,
    art: options.voranmeldungszeitraum,
    monat: options.monat,
    quartal: options.quartal,
  };
  const vonIso = periodStart(periode);
  const bisIso = periodEnd(periode);
  const bezeichnung = periodeLabel(periode);

  const entriesInPeriod = options.entries.filter(
    (e) =>
      e.status === "gebucht" && e.datum >= vonIso && e.datum <= bisIso
  );

  // ---- Rohwerte pro Kz aus Journal-Mapping ----
  const byKz = new Map<string, Money>();
  for (const def of USTVA_STRUCTURE_2025) {
    byKz.set(def.kz, Money.zero());
  }
  const kontenBeitraegeByKz = new Map<string, KennzahlView["kontenBeitraege"]>();
  const unmappedAccounts: UstvaReport["unmappedAccounts"] = [];

  for (const acc of options.accounts) {
    if (!acc.is_active) continue;
    const rule = findUstvaRule(acc.konto_nr);
    if (!rule) continue;
    const saldo = accountSaldo(acc.konto_nr, entriesInPeriod);
    const wert = valueForSource(rule.source, saldo);
    if (wert.isZero()) continue;

    const targetKz = USTVA_BY_KZ.get(rule.kz);
    if (!targetKz) {
      unmappedAccounts.push({
        kontoNr: acc.konto_nr,
        bezeichnung: acc.bezeichnung,
        saldo: wert.toFixed2(),
        reason: `Kz ${rule.kz} in USTVA_STRUCTURE_2025 nicht gefunden`,
      });
      continue;
    }
    byKz.set(rule.kz, (byKz.get(rule.kz) ?? Money.zero()).plus(wert));
    const list = kontenBeitraegeByKz.get(rule.kz) ?? [];
    list.push({
      kontoNr: acc.konto_nr,
      bezeichnung: acc.bezeichnung,
      betrag: wert.toFixed2(),
    });
    kontenBeitraegeByKz.set(rule.kz, list);
  }

  // ---- Auto-Berechnung: STEUERBETRAG, STEUERBETRAG_AGGREGAT ----
  for (const def of USTVA_STRUCTURE_2025) {
    if (def.type === "STEUERBETRAG" && def.from_kz && def.steuersatz != null) {
      const base = byKz.get(def.from_kz) ?? Money.zero();
      byKz.set(def.kz, base.times(def.steuersatz));
    } else if (
      def.type === "STEUERBETRAG_AGGREGAT" &&
      def.from_kzs &&
      def.steuersatz != null
    ) {
      let sum = Money.zero();
      for (const k of def.from_kzs) sum = sum.plus(byKz.get(k) ?? Money.zero());
      byKz.set(def.kz, sum.times(def.steuersatz));
    }
  }

  // ---- SUBTOTAL (UST_SUMME, VST_SUMME) ----
  for (const def of USTVA_STRUCTURE_2025) {
    if (def.type !== "SUBTOTAL") continue;
    let sum = Money.zero();
    for (const c of def.components ?? []) {
      sum = sum.plus(byKz.get(c) ?? Money.zero());
    }
    byKz.set(def.kz, sum);
  }

  // ---- FINAL RESULT Kz 65 ----
  const ustSumme = byKz.get("UST_SUMME") ?? Money.zero();
  const vstSumme = byKz.get("VST_SUMME") ?? Money.zero();
  let zahllast = ustSumme.minus(vstSumme);

  // Sondervorauszahlung bei Dauerfrist im Dezember / Q4 gegenrechnen
  if (
    options.dauerfristverlaengerung &&
    options.sondervorauszahlung &&
    ((periode.art === "MONAT" && periode.monat === 12) ||
      (periode.art === "QUARTAL" && periode.quartal === 4))
  ) {
    zahllast = zahllast.minus(options.sondervorauszahlung);
  }
  byKz.set("65", zahllast);

  // ---- Abgabefrist ----
  const abgabeDate = calculateUstvaAbgabefrist(
    periode,
    options.dauerfristverlaengerung
  );
  const abgabefrist = formatGermanDate(abgabeDate);
  const abgabefristIso = formatIso(abgabeDate);
  const tageBisAbgabe = Math.round(
    (abgabeDate.getTime() - new Date().setHours(0, 0, 0, 0)) /
      (1000 * 60 * 60 * 24)
  );

  // ---- UI-View ----
  const kennzahlen: KennzahlView[] = USTVA_STRUCTURE_2025.map((def) => {
    const raw = byKz.get(def.kz) ?? Money.zero();
    const isCalc =
      def.type === "STEUERBETRAG" ||
      def.type === "STEUERBETRAG_AGGREGAT" ||
      def.type === "SUBTOTAL" ||
      def.type === "FINAL_RESULT";
    return {
      kz: def.kz,
      name: def.name,
      type: def.type,
      section: def.section,
      wert: raw.toFixed2(),
      wertRaw: raw,
      isCalculated: isCalc,
      computation: def.computation,
      hgb: def.hgb_paragraph,
      kontenBeitraege: kontenBeitraegeByKz.get(def.kz) ?? [],
    };
  });

  const erstattung = zahllast.isNegative() ? zahllast.neg() : Money.zero();
  const zahllastPositive = zahllast.isPositive() ? zahllast : Money.zero();

  return {
    zeitraum: {
      von: vonIso,
      bis: bisIso,
      bezeichnung,
      art: periode.art,
      jahr: periode.jahr,
      monat: periode.monat,
      quartal: periode.quartal,
    },
    kennzahlen,
    summeUmsatzsteuer: ustSumme.toFixed2(),
    summeVorsteuer: vstSumme.toFixed2(),
    zahllast: zahllastPositive.toFixed2(),
    erstattung: erstattung.toFixed2(),
    isZahllast: zahllast.isPositive(),
    isErstattung: zahllast.isNegative(),
    dauerfrist: {
      active: options.dauerfristverlaengerung,
      sondervorauszahlung: options.sondervorauszahlung?.toFixed2(),
    },
    abgabefrist,
    abgabefristIso,
    tageBisAbgabe,
    unmappedAccounts,
    _internal: {
      summeUmsatzsteuer: ustSumme,
      summeVorsteuer: vstSumme,
      zahllast,
      abgabefristDate: abgabeDate,
      byKz,
    },
    metadata: {
      generatedAt: new Date().toISOString(),
      formular: "BMF UStVA 2025 (nachgebildet)",
    },
  };
}
