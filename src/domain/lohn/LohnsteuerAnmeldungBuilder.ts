/**
 * Lohnsteuer-Anmeldung (§ 41a EStG) — BMF-Formular 2025.
 *
 * Aggregiert monatliche Lohnabrechnungen zu einer Meldung (Monat / Quartal /
 * Jahr). Ergibt die 14 Standard-Kennzahlen (Kz 10, 41, 42, 43, 44, 47, 48, 49,
 * 61, 62, 71, 72, 73, 74) sowie die Gesamt-Zahllast an das Finanzamt.
 *
 * Abgabefrist: 10. Tag des Folgemonats / -quartals / -jahres mit Werktags-
 * Verschiebung (§ 108 Abs. 3 AO).
 */

import { Money } from "../../lib/money/Money";
import { sumMoney } from "../../lib/money/sum";
import type { Arbeitnehmer, Lohnabrechnung } from "./types";
import {
  calculateUstvaAbgabefrist,
  formatGermanDate,
  formatIso,
  periodeLabel,
  type Periode,
} from "../../lib/date/abgabefristCalculator";

export type LStAZeitraum = "MONAT" | "QUARTAL" | "JAHR";

export type LohnsteuerAnmeldungOptions = {
  arbeitnehmer: Arbeitnehmer[];
  abrechnungen: Lohnabrechnung[];
  zeitraum: LStAZeitraum;
  monat?: number;
  quartal?: 1 | 2 | 3 | 4;
  jahr: number;
  betriebsnummer: string;
};

export type LStAKennzahlen = {
  /** Anzahl AN mit Abrechnung im Zeitraum. */
  "10": string;
  /** Laufender Arbeitslohn (steuerpflichtig). */
  "41": string;
  /** Einbehaltene Lohnsteuer — laufend. */
  "42": string;
  /** Einbehaltene Lohnsteuer — sonstige Bezüge. */
  "43": string;
  /** LSt bei mehrjähriger Tätigkeit (§ 34 EStG). */
  "44": string;
  /** Pauschale Lohnsteuer (Minijob 2 %). */
  "47": string;
  /** Pauschalsteuer 25 % (kurzfristige Beschäftigung). */
  "48": string;
  /** Pauschalsteuer 20 % (Aushilfskräfte in der Land-/Forstwirtschaft). */
  "49": string;
  /** Solidaritätszuschlag (laufend + sonstige). */
  "61": string;
  /** Solidaritätszuschlag pauschal. */
  "62": string;
  /** Kirchensteuer evangelisch. */
  "71": string;
  /** Kirchensteuer römisch-katholisch. */
  "72": string;
  /** Kirchensteuer pauschal evangelisch. */
  "73": string;
  /** Kirchensteuer pauschal rk. */
  "74": string;
};

export type LohnsteuerAnmeldungReport = {
  zeitraum: {
    von: string;
    bis: string;
    bezeichnung: string;
    art: LStAZeitraum;
    jahr: number;
    monat?: number;
    quartal?: 1 | 2 | 3 | 4;
  };
  betriebsnummer: string;
  kennzahlen: LStAKennzahlen;
  summeZahllast: string;
  abgabefrist: string;
  abgabefristIso: string;
  _internal: {
    lohnsteuer: Money;
    soli: Money;
    kirchensteuer_ev: Money;
    kirchensteuer_rk: Money;
    summe: Money;
  };
  metadata: {
    generatedAt: string;
    formular: "BMF LStA 2025 (nachgebildet)";
    arbeitnehmerCount: number;
  };
};

function zeitraumDates(options: LohnsteuerAnmeldungOptions): {
  von: string;
  bis: string;
  periode: Periode;
} {
  if (options.zeitraum === "MONAT") {
    if (!options.monat) throw new Error("monat erforderlich");
    const mm = String(options.monat).padStart(2, "0");
    const lastDay = new Date(options.jahr, options.monat, 0).getDate();
    return {
      von: `${options.jahr}-${mm}-01`,
      bis: `${options.jahr}-${mm}-${String(lastDay).padStart(2, "0")}`,
      periode: { art: "MONAT", jahr: options.jahr, monat: options.monat },
    };
  }
  if (options.zeitraum === "QUARTAL") {
    if (!options.quartal) throw new Error("quartal erforderlich");
    const startM = (options.quartal - 1) * 3 + 1;
    const endM = options.quartal * 3;
    const mmStart = String(startM).padStart(2, "0");
    const lastDay = new Date(options.jahr, endM, 0).getDate();
    const mmEnd = String(endM).padStart(2, "0");
    return {
      von: `${options.jahr}-${mmStart}-01`,
      bis: `${options.jahr}-${mmEnd}-${String(lastDay).padStart(2, "0")}`,
      periode: { art: "QUARTAL", jahr: options.jahr, quartal: options.quartal },
    };
  }
  // JAHR
  return {
    von: `${options.jahr}-01-01`,
    bis: `${options.jahr}-12-31`,
    // Als Quartal-4 approximieren (periodEnd: 31.12.)
    periode: { art: "QUARTAL", jahr: options.jahr, quartal: 4 },
  };
}

/** Monatsteil YYYY-MM → prüft, ob der Monat innerhalb [von, bis] liegt.
 *  Vergleich per YYYY-MM-Prefix (Monat liegt vollständig im Zeitraum, wenn
 *  von ≤ erster Tag des Monats UND letzter Tag des Monats ≤ bis). */
function monatInZeitraum(
  abrechnungsmonat: string,
  von: string,
  bis: string
): boolean {
  return abrechnungsmonat >= von.slice(0, 7) && abrechnungsmonat <= bis.slice(0, 7);
}

export function buildLohnsteuerAnmeldung(
  options: LohnsteuerAnmeldungOptions
): LohnsteuerAnmeldungReport {
  const { arbeitnehmer, abrechnungen, betriebsnummer } = options;
  const { von, bis, periode } = zeitraumDates(options);

  const anById = new Map(arbeitnehmer.map((a) => [a.id, a]));

  const relevant = abrechnungen.filter((a) =>
    monatInZeitraum(a.abrechnungsmonat, von, bis)
  );

  // Aggregation
  let laufenderLohn = Money.zero();
  let lstLaufend = Money.zero();
  let lstSonstig = Money.zero();
  let lstPauschal2 = Money.zero(); // Minijob
  let soliLaufend = Money.zero();
  let kistEv = Money.zero();
  let kistRk = Money.zero();

  const anIdsInPeriod = new Set<string>();

  for (const a of relevant) {
    anIdsInPeriod.add(a.arbeitnehmer_id);
    laufenderLohn = laufenderLohn.plus(a.laufenderBrutto);

    const isMinijob =
      anById.get(a.arbeitnehmer_id)?.beschaeftigungsart === "MINIJOB";
    if (isMinijob) {
      // Pauschalsteuer (2 %) wird in _internal nicht explizit gehalten, ist
      // aber Teil von arbeitgeberKosten.gesamt. Wir rekonstruieren aus dem
      // 2 %-Anteil auf Brutto:
      lstPauschal2 = lstPauschal2.plus(a.gesamtBrutto.times("2").div(100));
    } else {
      // LSt: Aufteilung laufend vs sonstig approximativ nach Verhältnis Brutto
      const total = a.laufenderBrutto.plus(a.sonstigeBezuege);
      if (!total.isZero() && !a.sonstigeBezuege.isZero()) {
        const sonstAnteil = a.sonstigeBezuege.div(total);
        const lstSonstigTeil = a.abzuege.lohnsteuer.times(sonstAnteil);
        lstSonstig = lstSonstig.plus(lstSonstigTeil);
        lstLaufend = lstLaufend.plus(a.abzuege.lohnsteuer.minus(lstSonstigTeil));
      } else {
        lstLaufend = lstLaufend.plus(a.abzuege.lohnsteuer);
      }
      soliLaufend = soliLaufend.plus(a.abzuege.solidaritaetszuschlag);

      const konf = anById.get(a.arbeitnehmer_id)?.konfession;
      if (konf === "EV") kistEv = kistEv.plus(a.abzuege.kirchensteuer);
      else if (konf === "RK") kistRk = kistRk.plus(a.abzuege.kirchensteuer);
    }
  }

  const zahllast = lstLaufend
    .plus(lstSonstig)
    .plus(lstPauschal2)
    .plus(soliLaufend)
    .plus(kistEv)
    .plus(kistRk);

  const abgabe = calculateUstvaAbgabefrist(periode, false);
  const bezeichnung =
    options.zeitraum === "JAHR"
      ? `Jahr ${options.jahr}`
      : periodeLabel(periode);

  return {
    zeitraum: {
      von,
      bis,
      bezeichnung,
      art: options.zeitraum,
      jahr: options.jahr,
      monat: options.monat,
      quartal: options.quartal,
    },
    betriebsnummer,
    kennzahlen: {
      "10": String(anIdsInPeriod.size),
      "41": laufenderLohn.toFixed2(),
      "42": lstLaufend.toFixed2(),
      "43": lstSonstig.toFixed2(),
      "44": "0.00",
      "47": lstPauschal2.toFixed2(),
      "48": "0.00",
      "49": "0.00",
      "61": soliLaufend.toFixed2(),
      "62": "0.00",
      "71": kistEv.toFixed2(),
      "72": kistRk.toFixed2(),
      "73": "0.00",
      "74": "0.00",
    },
    summeZahllast: zahllast.toFixed2(),
    abgabefrist: formatGermanDate(abgabe),
    abgabefristIso: formatIso(abgabe),
    _internal: {
      lohnsteuer: lstLaufend.plus(lstSonstig).plus(lstPauschal2),
      soli: soliLaufend,
      kirchensteuer_ev: kistEv,
      kirchensteuer_rk: kistRk,
      summe: zahllast,
    },
    metadata: {
      generatedAt: new Date().toISOString(),
      formular: "BMF LStA 2025 (nachgebildet)",
      arbeitnehmerCount: anIdsInPeriod.size,
    },
  };
}

// Hilfsfunktion für LohnsteuerAnmeldungPage — aggregiert Summe pro Kennzahl
// aus mehreren Abrechnungen.
export function sumLst(abs: Lohnabrechnung[]): Money {
  return sumMoney(abs.map((a) => a.abzuege.lohnsteuer));
}
