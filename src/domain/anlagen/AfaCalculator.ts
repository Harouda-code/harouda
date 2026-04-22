/**
 * AfaCalculator — pure Rechen-Logik für Absetzung für Abnutzung.
 *
 * Sprint 6 Teil 1: nur **lineare AfA nach § 7 Abs. 1 EStG**, pro-rata-
 * temporis **monatsgenau** (seit der Abschaffung der Halbjahres-Regel
 * 2004, § 7 Abs. 1 S. 4 EStG n. F.).
 *
 * Konventionen:
 *   - Anschaffungsmonat wird voll mitgerechnet (12 - monat + 1 = 13 - monat
 *     AfA-Monate im Erstjahr).
 *   - Jahres-AfA = Anschaffungskosten / Nutzungsdauer.
 *   - Monats-AfA = Jahres-AfA / 12, als Decimal mit voller Präzision;
 *     Rundung auf 2 Nachkommastellen erfolgt erst beim Aufsummieren auf
 *     Jahres-Beträge.
 *   - Bei Kauf mitten im Jahr verteilt sich die Nutzungsdauer über
 *     (ND + 1) Kalender-Jahre: Erstjahr (teilweise) + ND-1 volle Jahre +
 *     Restjahr (Komplement-Monate). Bei Kauf im Januar bleiben es ND
 *     Kalender-Jahre.
 *   - Im letzten AfA-Jahr wird `AK - bisher kumulierte AfA` abgeschrieben,
 *     damit Rundungs-Residuen nicht stehen bleiben (exakte Nullstellung
 *     bzw. 1 € bei Erinnerungswert).
 *   - Optionaler 1 €-Erinnerungswert: Branchenübliche Konvention, damit
 *     abgeschriebene aber noch genutzte Anlagen im Bestand sichtbar
 *     bleiben. Default **false** — die Spec-Beispiele rechnen mit 0.
 *   - Abgang im AfA-Jahr: AfA wird **nur bis Abgangsmonat (inkl.)**
 *     berechnet; die Ausbuchung des Restbuchwerts passiert im Abgangs-
 *     Workflow (Teil 2, Sprint 7) und ist hier NICHT enthalten.
 *
 * Decimal.js sorgt für präzise Arithmetik über die gesamte Nutzungsdauer
 * (GoBD Rz. 58); Rundung auf zwei Stellen geschieht erst am Schluss.
 */

import Decimal from "decimal.js";

export type AfaLinearInput = {
  /** Anschaffungs- bzw. Herstellungskosten (netto, Brutto bei Kleinunternehmer). */
  anschaffungskosten: Decimal;
  /** Betriebsgewöhnliche Nutzungsdauer in ganzen Jahren (1..50). */
  nutzungsdauer_jahre: number;
  /** Anschaffungsdatum (JS-Date, Zeitzone irrelevant — wir nutzen
   *  UTC-Getter für Jahr/Monat). */
  anschaffungsdatum: Date;
  /** Kalender-Jahr, für das AfA-Betrag + Restbuchwert ermittelt werden. */
  jahr: number;
  /** Wenn true: letztes AfA-Jahr lässt 1 € als Erinnerungswert stehen. */
  erinnerungswert?: boolean;
  /** Abgangsdatum (Verkauf/Verschrottung). Wenn gesetzt und Abgang im
   *  angefragten Jahr: AfA nur bis Abgangsmonat. */
  abgangsdatum?: Date | null;
};

export type AfaLinearResult = {
  /** Im Jahr anfallender AfA-Betrag (≥ 0, auf 2 Nachkommastellen gerundet). */
  afa_betrag: Decimal;
  /** Restbuchwert nach Abschluss dieses Jahres. */
  restbuchwert: Decimal;
  /** True, wenn `jahr` = Anschaffungsjahr. */
  ist_erstes_jahr: boolean;
  /** True, wenn `jahr` = reguläres letztes AfA-Jahr (ohne Abgang). */
  ist_letztes_jahr: boolean;
  /** Wie viele Monate in `jahr` abgeschrieben werden (0..12). */
  abgeschrieben_monate: number;
};

/**
 * Berechnet für ein bestimmtes Kalender-Jahr den linearen AfA-Betrag und
 * den Restbuchwert nach Abschluss des Jahres.
 *
 * Der Calculator ist **zustandslos**: er rekonstruiert kumulierte AfA
 * aus (Anschaffungskosten, Nutzungsdauer, Anschaffungsdatum). Keine
 * Historie muss übergeben werden. Das vereinfacht Tests erheblich und
 * verhindert Inkonsistenzen zwischen DB und Berechnung.
 */
export function berechneLineareAfa(input: AfaLinearInput): AfaLinearResult {
  const {
    anschaffungskosten: ak,
    nutzungsdauer_jahre: nd,
    anschaffungsdatum,
    jahr,
    erinnerungswert = false,
    abgangsdatum = null,
  } = input;

  if (nd < 1 || nd > 50 || !Number.isInteger(nd)) {
    throw new Error(`Nutzungsdauer muss ganzzahlig 1..50 sein, erhalten: ${nd}`);
  }
  if (!ak.gt(0)) {
    throw new Error(`Anschaffungskosten müssen positiv sein, erhalten: ${ak.toString()}`);
  }

  const anschaffungs_jahr = anschaffungsdatum.getUTCFullYear();
  const anschaffungs_monat = anschaffungsdatum.getUTCMonth() + 1; // 1..12
  const erstjahr_monate = 13 - anschaffungs_monat; // 1..12
  const hat_restjahr = erstjahr_monate < 12;
  const regulaeres_letztes_jahr = hat_restjahr
    ? anschaffungs_jahr + nd
    : anschaffungs_jahr + nd - 1;

  const monats_afa = ak.div(nd).div(12);

  // Vor-Anschaffungsjahr → keine AfA, Restbuchwert = AK.
  if (jahr < anschaffungs_jahr) {
    return {
      afa_betrag: new Decimal(0),
      restbuchwert: ak,
      ist_erstes_jahr: false,
      ist_letztes_jahr: false,
      abgeschrieben_monate: 0,
    };
  }

  // Nach dem regulären Ende → vollständig abgeschrieben.
  if (jahr > regulaeres_letztes_jahr) {
    const rbw_final = erinnerungswert ? new Decimal(1) : new Decimal(0);
    return {
      afa_betrag: new Decimal(0),
      restbuchwert: rbw_final,
      ist_erstes_jahr: false,
      ist_letztes_jahr: false,
      abgeschrieben_monate: 0,
    };
  }

  const ist_erstes_jahr = jahr === anschaffungs_jahr;
  const ist_regulaeres_letztes_jahr = jahr === regulaeres_letztes_jahr;

  // Abgangs-Jahr-Sonderfall: AfA nur bis Abgangsmonat, Restbuchwert zeigt
  // den Wert im Moment des Abgangs (die Ausbuchung auf 0 passiert im
  // Abgangs-Workflow in Teil 2).
  if (abgangsdatum && abgangsdatum.getUTCFullYear() === jahr) {
    const abgangs_monat = abgangsdatum.getUTCMonth() + 1;
    const monate_in_jahr = ist_erstes_jahr
      ? Math.max(0, abgangs_monat - anschaffungs_monat + 1)
      : Math.max(0, abgangs_monat);
    const afa_betrag = monats_afa.mul(monate_in_jahr).toDecimalPlaces(2);
    const monate_bis_abgang = ist_erstes_jahr
      ? monate_in_jahr
      : erstjahr_monate + 12 * (jahr - anschaffungs_jahr - 1) + monate_in_jahr;
    const kumuliert = monats_afa.mul(monate_bis_abgang).toDecimalPlaces(2);
    const restbuchwert = ak.sub(kumuliert);
    return {
      afa_betrag,
      restbuchwert,
      ist_erstes_jahr,
      ist_letztes_jahr: false,
      abgeschrieben_monate: monate_in_jahr,
    };
  }

  // Reguläre Wirk-Monate pro Jahr.
  let abgeschrieben_monate: number;
  if (ist_erstes_jahr) {
    abgeschrieben_monate = erstjahr_monate;
  } else if (ist_regulaeres_letztes_jahr && hat_restjahr) {
    abgeschrieben_monate = 12 - erstjahr_monate;
  } else {
    abgeschrieben_monate = 12;
  }

  // Hilfsfunktion: AfA-Betrag für ein bestimmtes Jahr (je einzeln auf
  // 2 Stellen gerundet, wie er auch gebucht würde). Wichtig für den
  // Sumcheck: Summe aller Jahres-AfA == AK exakt.
  const jahresAfaBetrag = (jahr_inner: number): Decimal => {
    const monate =
      jahr_inner === anschaffungs_jahr
        ? erstjahr_monate
        : jahr_inner === regulaeres_letztes_jahr && hat_restjahr
          ? 12 - erstjahr_monate
          : 12;
    return monats_afa.mul(monate).toDecimalPlaces(2);
  };

  // AfA-Betrag.
  let afa_betrag: Decimal;
  if (ist_regulaeres_letztes_jahr) {
    // Rest = AK minus Summe der bisher gebuchten Jahres-AfA (jedes Jahr
    // einzeln gerundet — wie sie tatsächlich im Journal stehen). Damit
    // Rundungs-Drift über mehrere Jahre sauber aufgefangen wird und
    // `Summe aller Jahres-AfA == AK` exakt gilt.
    let summe_vorjahre = new Decimal(0);
    for (let j = anschaffungs_jahr; j < jahr; j++) {
      summe_vorjahre = summe_vorjahre.plus(jahresAfaBetrag(j));
    }
    afa_betrag = ak.sub(summe_vorjahre);
    if (erinnerungswert) {
      afa_betrag = afa_betrag.sub(1);
    }
  } else {
    afa_betrag = monats_afa.mul(abgeschrieben_monate).toDecimalPlaces(2);
  }

  // Restbuchwert nach dem Jahr: AK minus Summe der AfA bis Jahresende
  // (wieder jedes Jahr einzeln gerundet, konsistent mit den Buchungen).
  let restbuchwert: Decimal;
  if (ist_regulaeres_letztes_jahr) {
    restbuchwert = erinnerungswert ? new Decimal(1) : new Decimal(0);
  } else {
    let summe_bis_jahr = new Decimal(0);
    for (let j = anschaffungs_jahr; j <= jahr; j++) {
      summe_bis_jahr = summe_bis_jahr.plus(jahresAfaBetrag(j));
    }
    restbuchwert = ak.sub(summe_bis_jahr);
  }

  return {
    afa_betrag,
    restbuchwert,
    ist_erstes_jahr,
    ist_letztes_jahr: ist_regulaeres_letztes_jahr,
    abgeschrieben_monate,
  };
}

// ---------------------------------------------------------------------------
// GWG — Sofortabschreibung nach § 6 Abs. 2 EStG
// ---------------------------------------------------------------------------
//
// Geringwertige Wirtschaftsgüter (AK ≤ 800 € netto) werden im Jahr der
// Anschaffung voll abgeschrieben. Der Calculator prüft die 800-€-Grenze
// **nicht** — das ist Aufgabe der UI (Warnung bei Überschreitung), damit
// Bestandsanlagen aus alter Rechtslage (z. B. 410 € vor 2018) auch noch
// nachträglich als GWG abgebildet werden können.
//
// Rückgabewert: AfaLinearResult (selbe Struktur wie lineare AfA, damit
// downstream code einheitlich aggregieren kann).
// ---------------------------------------------------------------------------

export type AfaGwgInput = {
  anschaffungskosten: Decimal;
  anschaffungsdatum: Date;
  jahr: number;
};

export function berechneGwgAfa(input: AfaGwgInput): AfaLinearResult {
  const { anschaffungskosten: ak, anschaffungsdatum, jahr } = input;
  if (!ak.gt(0)) {
    throw new Error(
      `Anschaffungskosten müssen positiv sein, erhalten: ${ak.toString()}`
    );
  }
  const anschaffungs_jahr = anschaffungsdatum.getUTCFullYear();
  const anschaffungs_monat = anschaffungsdatum.getUTCMonth() + 1;

  if (jahr < anschaffungs_jahr) {
    return {
      afa_betrag: new Decimal(0),
      restbuchwert: ak,
      ist_erstes_jahr: false,
      ist_letztes_jahr: false,
      abgeschrieben_monate: 0,
    };
  }
  if (jahr === anschaffungs_jahr) {
    return {
      afa_betrag: ak.toDecimalPlaces(2),
      restbuchwert: new Decimal(0),
      ist_erstes_jahr: true,
      ist_letztes_jahr: true,
      abgeschrieben_monate: 13 - anschaffungs_monat,
    };
  }
  // Jahr nach Anschaffungsjahr → bereits voll abgeschrieben.
  return {
    afa_betrag: new Decimal(0),
    restbuchwert: new Decimal(0),
    ist_erstes_jahr: false,
    ist_letztes_jahr: false,
    abgeschrieben_monate: 0,
  };
}

// ---------------------------------------------------------------------------
// Sammelposten (Poolabschreibung) nach § 6 Abs. 2a EStG
// ---------------------------------------------------------------------------
//
// Für Anlagen zwischen > 250 € und ≤ 1.000 € netto (nach UStG-Splittung)
// kann der Betrieb einen jährlichen Sammelposten bilden und über **5
// Jahre linear** abschreiben. Besonderheiten:
//
//  - **Volle Jahresrate im Anschaffungsjahr** (keine Monatsanteile!).
//  - Zu- bzw. Abgänge im Pool werden nicht einzeln gebucht (der Pool
//    läuft in der fixen 5-Jahres-Kadenz weiter, § 6 Abs. 2a Satz 3 EStG).
//    Diese Regel durchsetzt AnlagenService beim Abgang — der Calculator
//    selbst ist methoden-neutral.
//  - AK-Grenzen werden im Calculator **geprüft** (Fehler bei ≤ 250 €
//    oder > 1000 €), weil diese fachlich harte Grenzen sind, im
//    Gegensatz zur 800-€-GWG-Grenze, die nur historisch-kontextuell ist.
// ---------------------------------------------------------------------------

export type AfaSammelpostenInput = {
  anschaffungskosten: Decimal;
  anschaffungsdatum: Date;
  jahr: number;
};

const SAMMELPOSTEN_MIN = new Decimal("250.00");
const SAMMELPOSTEN_MAX = new Decimal("1000.00");
const SAMMELPOSTEN_ND_JAHRE = 5;

export function berechneSammelpostenAfa(
  input: AfaSammelpostenInput
): AfaLinearResult {
  const { anschaffungskosten: ak, anschaffungsdatum, jahr } = input;
  if (!ak.gt(SAMMELPOSTEN_MIN)) {
    throw new Error(
      `Sammelposten-AK muss > 250,00 € sein, erhalten: ${ak.toString()} €. ` +
        `Für AK ≤ 250 € kommt die GWG-Sofortabschreibung (§ 6 Abs. 2 EStG) in Frage.`
    );
  }
  if (ak.gt(SAMMELPOSTEN_MAX)) {
    throw new Error(
      `Sammelposten-AK muss ≤ 1.000,00 € sein, erhalten: ${ak.toString()} €. ` +
        `Für höhere AK bitte lineare oder degressive AfA wählen.`
    );
  }

  const anschaffungs_jahr = anschaffungsdatum.getUTCFullYear();
  const letztes_jahr = anschaffungs_jahr + SAMMELPOSTEN_ND_JAHRE - 1;

  if (jahr < anschaffungs_jahr) {
    return {
      afa_betrag: new Decimal(0),
      restbuchwert: ak,
      ist_erstes_jahr: false,
      ist_letztes_jahr: false,
      abgeschrieben_monate: 0,
    };
  }
  if (jahr > letztes_jahr) {
    return {
      afa_betrag: new Decimal(0),
      restbuchwert: new Decimal(0),
      ist_erstes_jahr: false,
      ist_letztes_jahr: false,
      abgeschrieben_monate: 0,
    };
  }

  const jahresrate = ak.div(SAMMELPOSTEN_ND_JAHRE).toDecimalPlaces(2);
  const ist_erstes_jahr = jahr === anschaffungs_jahr;
  const ist_letztes_jahr = jahr === letztes_jahr;

  let afa_betrag: Decimal;
  if (ist_letztes_jahr) {
    // Rest = AK - Summe der N-1 bereits gebuchten Jahres-Raten. Fängt
    // Rundungs-Drift ab (analog zur linearen AfA im letzten Jahr).
    const summe_vorher = jahresrate.mul(SAMMELPOSTEN_ND_JAHRE - 1);
    afa_betrag = ak.sub(summe_vorher);
  } else {
    afa_betrag = jahresrate;
  }

  const jahre_abgeschrieben = jahr - anschaffungs_jahr + 1;
  const restbuchwert = ist_letztes_jahr
    ? new Decimal(0)
    : ak.sub(jahresrate.mul(jahre_abgeschrieben));

  return {
    afa_betrag,
    restbuchwert,
    ist_erstes_jahr,
    ist_letztes_jahr,
    // Volle Jahresrate unabhängig vom Monat — keine Monatsanteile.
    abgeschrieben_monate: 12,
  };
}

/**
 * Hilfsfunktion: summiert die AfA-Beträge über alle Jahre von
 * Anschaffung bis regulärem Ende. Nützlich für Selbst-Tests
 * (Sumcheck == Anschaffungskosten) und für den Anlagenspiegel-Aggregator.
 */
export function summiereLineareAfa(
  anschaffungskosten: Decimal,
  nutzungsdauer_jahre: number,
  anschaffungsdatum: Date,
  bis_jahr: number,
  erinnerungswert = false
): Decimal {
  let summe = new Decimal(0);
  const startJahr = anschaffungsdatum.getUTCFullYear();
  for (let j = startJahr; j <= bis_jahr; j++) {
    const r = berechneLineareAfa({
      anschaffungskosten,
      nutzungsdauer_jahre,
      anschaffungsdatum,
      jahr: j,
      erinnerungswert,
    });
    summe = summe.plus(r.afa_betrag);
  }
  return summe;
}
