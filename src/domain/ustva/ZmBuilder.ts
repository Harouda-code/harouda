/**
 * Zusammenfassende Meldung (ZM) — Builder (§ 18a UStG).
 *
 * Erzeugt eine Liste von Meldungen pro Leistungsempfänger (gruppiert nach
 * USt-IdNr + Land) mit den drei ZM-Kennzahlen (41, 21, 42). Cross-Check
 * gegen UStVA: Summen müssen übereinstimmen (Kz 41 / 21 / 42).
 *
 * Abgabefrist: 25. Tag des Folgemonats (§ 18a Abs. 1 UStG, Dauerfrist möglich).
 * Werktagsverschiebung gemäß § 108 Abs. 3 AO (hier nur Wochenende).
 */

import type { Account, JournalEntry } from "../../types/db";
import { Money } from "../../lib/money/Money";
import { findZmRule } from "./zmStructure";
import { buildUstva } from "./UstvaBuilder";
import {
  validateUstId,
  type UstIdValidation,
} from "../../lib/validation/ustIdValidator";

export type ZmMeldezeitraum = "MONAT" | "QUARTAL";

export type ZmEmpfaengerStammdaten = {
  kontoNr: string;
  ustid: string;
  land: string;
};

export type ZmOptions = {
  accounts: Account[];
  entries: JournalEntry[];
  meldezeitraum: ZmMeldezeitraum;
  monat?: number;
  quartal?: 1 | 2 | 3 | 4;
  jahr: number;
  empfaengerStammdaten: ZmEmpfaengerStammdaten[];
};

export type ZmMeldungEntry = {
  ustid: string;
  land: string;
  ustidValidation: UstIdValidation;
  igLieferungen: string;
  igSonstigeLeistungen: string;
  dreiecksgeschaefte: string;
  gesamtbetrag: string;
};

export type ZmReport = {
  zeitraum: {
    art: ZmMeldezeitraum;
    von: string;
    bis: string;
    bezeichnung: string;
    jahr: number;
    monat?: number;
    quartal?: 1 | 2 | 3 | 4;
  };
  meldungen: ZmMeldungEntry[];
  summen: {
    igLieferungenTotal: string;
    igSonstigeLeistungenTotal: string;
    dreiecksgeschaefteTotal: string;
  };
  ustvaKorrespondenz: {
    ustvaKz41: string;
    zmKz41: string;
    matches41: boolean;
    ustvaKz21: string;
    zmKz21: string;
    matches21: boolean;
    ustvaKz42: string;
    zmKz42: string;
    matches42: boolean;
  };
  abgabefrist: string;
  warnings: string[];
  unzuordenbareBuchungen: {
    buchungId: string;
    datum: string;
    sollKonto: string;
    habenKonto: string;
    betrag: string;
    reason: string;
  }[];
  _internal: {
    totals: {
      igLieferungen: Money;
      igSonstigeLeistungen: Money;
      dreiecksgeschaefte: Money;
    };
  };
};

function monthRange(jahr: number, monat: number): { von: string; bis: string } {
  const mm = String(monat).padStart(2, "0");
  const lastDay = new Date(jahr, monat, 0).getDate();
  return {
    von: `${jahr}-${mm}-01`,
    bis: `${jahr}-${mm}-${String(lastDay).padStart(2, "0")}`,
  };
}
function quarterRange(jahr: number, q: number): { von: string; bis: string } {
  const startM = (q - 1) * 3 + 1;
  const endM = q * 3;
  const mmStart = String(startM).padStart(2, "0");
  const lastDay = new Date(jahr, endM, 0).getDate();
  const mmEnd = String(endM).padStart(2, "0");
  return {
    von: `${jahr}-${mmStart}-01`,
    bis: `${jahr}-${mmEnd}-${String(lastDay).padStart(2, "0")}`,
  };
}

function shiftToNextWeekday(d: Date): Date {
  const out = new Date(d);
  while (out.getDay() === 0 || out.getDay() === 6) {
    out.setDate(out.getDate() + 1);
  }
  return out;
}

/** § 18a Abs. 1: 25. Tag des Folgemonats / -quartals (Werktagsverschiebung). */
function abgabefrist25Folgetag(
  zeitraum: { art: ZmMeldezeitraum; jahr: number; monat?: number; quartal?: 1 | 2 | 3 | 4 }
): Date {
  // Der Folgemonat nach Periodenende.
  const endMonat =
    zeitraum.art === "MONAT"
      ? zeitraum.monat! + 1
      : zeitraum.quartal! * 3 + 1;
  const jahr = zeitraum.jahr + (endMonat > 12 ? 1 : 0);
  const mm = ((endMonat - 1) % 12) + 1;
  const d = new Date(jahr, mm - 1, 25);
  return shiftToNextWeekday(d);
}

function formatGerman(d: Date): string {
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  return `${dd}.${mm}.${d.getFullYear()}`;
}

const MONATE = [
  "Januar",
  "Februar",
  "März",
  "April",
  "Mai",
  "Juni",
  "Juli",
  "August",
  "September",
  "Oktober",
  "November",
  "Dezember",
];

export function buildZm(options: ZmOptions): ZmReport {
  const { accounts, entries, meldezeitraum, jahr, empfaengerStammdaten } = options;

  const zr =
    meldezeitraum === "MONAT"
      ? monthRange(jahr, options.monat!)
      : quarterRange(jahr, options.quartal!);
  const bezeichnung =
    meldezeitraum === "MONAT"
      ? `${MONATE[options.monat! - 1]} ${jahr}`
      : `Q${options.quartal} ${jahr}`;

  const entriesInPeriod = entries.filter(
    (e) => e.status === "gebucht" && e.datum >= zr.von && e.datum <= zr.bis
  );

  // 1) Leistungsempfänger-Konten → USt-IdNr Mapping
  const ustidByKonto = new Map<string, { ustid: string; land: string }>();
  for (const s of empfaengerStammdaten) {
    ustidByKonto.set(s.kontoNr, { ustid: s.ustid, land: s.land });
  }

  // 2) Jede Buchung prüfen: ist Soll- oder Haben-Konto ein ZM-relevantes
  //    Erlöskonto (8125, 8336, 8338)? Wenn ja, wird der Betrag unter der
  //    USt-IdNr des Gegen-Kontos (Debitor) gebucht.
  type Bucket = {
    ustid: string;
    land: string;
    igLieferungen: Money;
    igSonstigeLeistungen: Money;
    dreiecksgeschaefte: Money;
  };
  const byUstid = new Map<string, Bucket>();
  const unzuordenbar: ZmReport["unzuordenbareBuchungen"] = [];

  const getBucket = (ustid: string, land: string): Bucket => {
    const key = `${ustid}|${land}`;
    let b = byUstid.get(key);
    if (!b) {
      b = {
        ustid,
        land,
        igLieferungen: Money.zero(),
        igSonstigeLeistungen: Money.zero(),
        dreiecksgeschaefte: Money.zero(),
      };
      byUstid.set(key, b);
    }
    return b;
  };

  const accSet = new Set(accounts.filter((a) => a.is_active).map((a) => a.konto_nr));

  for (const e of entriesInPeriod) {
    // ZM-Erlöskonto steht typischerweise im Haben (Ertragskonto). Das
    // Gegen-Konto im Soll ist oft der Debitor oder Bank.
    const zmRule =
      findZmRule(e.haben_konto) ?? findZmRule(e.soll_konto);
    if (!zmRule) continue;
    if (!accSet.has(e.haben_konto) && !accSet.has(e.soll_konto)) continue;

    // USt-IdNr entnimmt aus dem NICHT-ZM-Konto (Leistungsempfänger)
    const zmIsOnHaben = findZmRule(e.haben_konto) != null;
    const gegenKonto = zmIsOnHaben ? e.soll_konto : e.haben_konto;
    const lookup = ustidByKonto.get(gegenKonto);

    const betrag = new Money(Number.isFinite(e.betrag) ? e.betrag : 0);

    if (!lookup) {
      unzuordenbar.push({
        buchungId: e.id,
        datum: e.datum,
        sollKonto: e.soll_konto,
        habenKonto: e.haben_konto,
        betrag: betrag.toFixed2(),
        reason: `Keine USt-IdNr für Konto ${gegenKonto} hinterlegt (ZM-Kz ${zmRule.kz}).`,
      });
      continue;
    }

    const bucket = getBucket(lookup.ustid, lookup.land);
    if (zmRule.kz === "41") bucket.igLieferungen = bucket.igLieferungen.plus(betrag);
    else if (zmRule.kz === "21")
      bucket.igSonstigeLeistungen = bucket.igSonstigeLeistungen.plus(betrag);
    else if (zmRule.kz === "42")
      bucket.dreiecksgeschaefte = bucket.dreiecksgeschaefte.plus(betrag);
  }

  // 3) Pro Empfänger: Validierung + View
  const meldungen: ZmMeldungEntry[] = [];
  let totalIgl = Money.zero();
  let totalIgs = Money.zero();
  let totalDg = Money.zero();

  const sortedBuckets = [...byUstid.values()].sort((a, b) =>
    a.ustid.localeCompare(b.ustid)
  );

  for (const b of sortedBuckets) {
    const validation = validateUstId(b.ustid);
    const gesamt = b.igLieferungen.plus(b.igSonstigeLeistungen).plus(b.dreiecksgeschaefte);
    meldungen.push({
      ustid: b.ustid,
      land: b.land,
      ustidValidation: validation,
      igLieferungen: b.igLieferungen.toFixed2(),
      igSonstigeLeistungen: b.igSonstigeLeistungen.toFixed2(),
      dreiecksgeschaefte: b.dreiecksgeschaefte.toFixed2(),
      gesamtbetrag: gesamt.toFixed2(),
    });
    totalIgl = totalIgl.plus(b.igLieferungen);
    totalIgs = totalIgs.plus(b.igSonstigeLeistungen);
    totalDg = totalDg.plus(b.dreiecksgeschaefte);
  }

  // 4) UStVA-Cross-Check
  const ustva = buildUstva({
    accounts,
    entries,
    voranmeldungszeitraum: meldezeitraum,
    monat: options.monat,
    quartal: options.quartal,
    jahr,
    dauerfristverlaengerung: false,
  });
  const ustvaKz41 = ustva._internal.byKz.get("41") ?? Money.zero();
  const ustvaKz21 = ustva._internal.byKz.get("21") ?? Money.zero();
  const ustvaKz42 = ustva._internal.byKz.get("42") ?? Money.zero();

  const warnings: string[] = [];
  if (!totalIgl.equals(ustvaKz41)) {
    warnings.push(
      `ZM Kz 41 (${totalIgl.toFixed2()} €) weicht von UStVA Kz 41 (${ustvaKz41.toFixed2()} €) ab. ` +
        `Mögliche Ursache: fehlende USt-IdNr-Zuordnung (unzuordenbare Buchungen).`
    );
  }
  if (!totalIgs.equals(ustvaKz21)) {
    warnings.push(
      `ZM Kz 21 (${totalIgs.toFixed2()} €) weicht von UStVA Kz 21 (${ustvaKz21.toFixed2()} €) ab.`
    );
  }
  if (!totalDg.equals(ustvaKz42)) {
    warnings.push(
      `ZM Kz 42 (${totalDg.toFixed2()} €) weicht von UStVA Kz 42 (${ustvaKz42.toFixed2()} €) ab.`
    );
  }
  const invalidUstids = meldungen.filter((m) => !m.ustidValidation.isValid);
  if (invalidUstids.length > 0) {
    warnings.push(
      `${invalidUstids.length} USt-IdNr(n) mit ungültigem Format: ${invalidUstids
        .map((m) => m.ustid)
        .join(", ")}`
    );
  }

  const abgabeDate = abgabefrist25Folgetag({
    art: meldezeitraum,
    jahr,
    monat: options.monat,
    quartal: options.quartal,
  });

  return {
    zeitraum: {
      art: meldezeitraum,
      von: zr.von,
      bis: zr.bis,
      bezeichnung,
      jahr,
      monat: options.monat,
      quartal: options.quartal,
    },
    meldungen,
    summen: {
      igLieferungenTotal: totalIgl.toFixed2(),
      igSonstigeLeistungenTotal: totalIgs.toFixed2(),
      dreiecksgeschaefteTotal: totalDg.toFixed2(),
    },
    ustvaKorrespondenz: {
      ustvaKz41: ustvaKz41.toFixed2(),
      zmKz41: totalIgl.toFixed2(),
      matches41: totalIgl.equals(ustvaKz41),
      ustvaKz21: ustvaKz21.toFixed2(),
      zmKz21: totalIgs.toFixed2(),
      matches21: totalIgs.equals(ustvaKz21),
      ustvaKz42: ustvaKz42.toFixed2(),
      zmKz42: totalDg.toFixed2(),
      matches42: totalDg.equals(ustvaKz42),
    },
    abgabefrist: formatGerman(abgabeDate),
    warnings,
    unzuordenbareBuchungen: unzuordenbar,
    _internal: {
      totals: {
        igLieferungen: totalIgl,
        igSonstigeLeistungen: totalIgs,
        dreiecksgeschaefte: totalDg,
      },
    },
  };
}
