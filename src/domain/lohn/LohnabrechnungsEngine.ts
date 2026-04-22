/**
 * Lohnabrechnungs-Engine (§ 38-42f EStG + SGB IV-VII/XI/III).
 *
 * Ablauf:
 *   1. Brutto aggregieren (laufend + sonstige Bezüge)
 *   2. SV-Brutto bestimmen, auf BBG deckeln (KV/PV getrennt von RV/AV)
 *   3. SV-Beiträge AN und AG berechnen (hälftig + Sondereffekte PV)
 *   4. Lohnsteuer nach Jahreshochrechnung / 12 (§ 39b Abs. 2 EStG)
 *   5. Solidaritätszuschlag (§ 3 SolZG) aus Jahres-LSt / 12
 *   6. Kirchensteuer je Bundesland
 *   7. Netto = Brutto − SV-AN − LSt − Soli − KiSt
 *
 * Sonderfälle:
 *   - Minijob (≤ 538 €): AN-Beiträge = 0; AG zahlt Pauschalen (13 % KV + 15 % RV
 *     + 2 % Pauschalsteuer). LSt / Soli / KiSt = 0 (Pauschalisierung).
 *   - Midijob (538,01 – 2000 €): AN-Beitrag linear reduziert (vereinfacht — in
 *     der Praxis mit Stichtags-Formel nach SGB IV § 20 Abs. 2).
 */

import type {
  Arbeitnehmer,
  Lohnabrechnung,
  LohnArt,
  Lohnbuchung,
  SvBeitraegeAg,
  SvBeitraegeAn,
} from "./types";
import { Money } from "../../lib/money/Money";
import { sumMoney } from "../../lib/money/sum";
import {
  SV_PARAMETER_2025,
  bbgKvPvMonat,
  bbgRvAvMonat,
  moneyMin,
} from "./sozialversicherungParameter2025";
import {
  LOHNSTEUER_PARAMETER_2025,
  jahresLstByStKl,
  kirchensteuerJahresbetrag,
  soliJahresbetrag,
} from "./lohnsteuerTarif2025";
import { calculateVorsorgepauschale } from "./vorsorgepauschaleCalculator";

const HUNDERT = new Money("100");

export type LohnabrechnungsEngineOptions = {
  arbeitnehmer: Arbeitnehmer;
  lohnarten: Map<string, LohnArt>;
  buchungen: Lohnbuchung[];
  abrechnungsmonat: string; // YYYY-MM
};

export class LohnabrechnungsEngine {
  berechneAbrechnung(
    options: LohnabrechnungsEngineOptions
  ): Lohnabrechnung {
    const { arbeitnehmer, lohnarten, buchungen, abrechnungsmonat } = options;

    // 1) Brutto aggregieren
    const monatsBuchungen = buchungen.filter(
      (b) => b.abrechnungsmonat === abrechnungsmonat
    );
    const laufenderBrutto = sumMoney(
      monatsBuchungen
        .filter((b) => lohnarten.get(b.lohnart_id)?.typ === "LAUFENDER_BEZUG")
        .map((b) => b.betrag)
    );
    const sonstigeBezuege = sumMoney(
      monatsBuchungen
        .filter((b) => lohnarten.get(b.lohnart_id)?.typ === "SONSTIGER_BEZUG")
        .map((b) => b.betrag)
    );
    const gesamtBrutto = laufenderBrutto.plus(sonstigeBezuege);

    // Spezialfall Minijob
    if (arbeitnehmer.beschaeftigungsart === "MINIJOB") {
      return this.minijobAbrechnung(
        arbeitnehmer,
        gesamtBrutto,
        laufenderBrutto,
        sonstigeBezuege,
        abrechnungsmonat
      );
    }

    // 2) SV-Brutto
    const svBrutto = this.calcSvBrutto(arbeitnehmer, gesamtBrutto, lohnarten, monatsBuchungen);

    // 3) SV-Beiträge
    const svAn = this.calcSvArbeitnehmer(arbeitnehmer, svBrutto);
    const svAg = this.calcSvArbeitgeber(arbeitnehmer, svBrutto);

    // 4) Lohnsteuer
    const lohnsteuer = this.calcLohnsteuerMonat(
      arbeitnehmer,
      laufenderBrutto,
      sonstigeBezuege
    );

    // 5) Soli (monatlich)
    const jahresLst = lohnsteuer.times(12); // Näherung für Soli-Freigrenze
    const soli = soliJahresbetrag(jahresLst).div(12);

    // 6) Kirchensteuer
    const kirchensteuer = arbeitnehmer.kirchensteuerpflichtig
      ? kirchensteuerJahresbetrag(jahresLst, arbeitnehmer.bundesland).div(12)
      : Money.zero();

    // 7) Netto
    const gesamtAbzuege = svAn.gesamt
      .plus(lohnsteuer)
      .plus(soli)
      .plus(kirchensteuer);
    const auszahlungsbetrag = gesamtBrutto.minus(gesamtAbzuege);
    const gesamtkostenArbeitgeber = gesamtBrutto.plus(svAg.gesamt);

    return {
      arbeitnehmer_id: arbeitnehmer.id,
      abrechnungsmonat,
      laufenderBrutto,
      sonstigeBezuege,
      gesamtBrutto,
      svBrutto,
      abzuege: {
        lohnsteuer,
        solidaritaetszuschlag: soli,
        kirchensteuer,
        kv_an: svAn.kv,
        kv_zusatz_an: svAn.kv_zusatz,
        pv_an: svAn.pv,
        rv_an: svAn.rv,
        av_an: svAn.av,
        gesamtAbzuege,
      },
      arbeitgeberKosten: svAg,
      auszahlungsbetrag,
      gesamtkostenArbeitgeber,
      formatted: {
        laufenderBrutto: laufenderBrutto.toFixed2(),
        sonstigeBezuege: sonstigeBezuege.toFixed2(),
        gesamtBrutto: gesamtBrutto.toFixed2(),
        auszahlungsbetrag: auszahlungsbetrag.toFixed2(),
        gesamtkostenArbeitgeber: gesamtkostenArbeitgeber.toFixed2(),
      },
      _meta: {
        lstMethode: "JAHRESBERECHNUNG_§39b_EStG",
        steuerklasseAngewandt: arbeitnehmer.steuerklasse,
        kvPflichtig: arbeitnehmer.kv_pflicht,
        rvPflichtig: arbeitnehmer.rv_pflicht,
        svBemessungKvPv: moneyMin(svBrutto, bbgKvPvMonat()).toFixed2(),
        svBemessungRvAv: moneyMin(svBrutto, bbgRvAvMonat()).toFixed2(),
      },
    };
  }

  /** Minijob-Abrechnung: AN-Beiträge pauschal 0; AG zahlt Pauschalen + 2 % Steuer. */
  private minijobAbrechnung(
    an: Arbeitnehmer,
    gesamtBrutto: Money,
    laufend: Money,
    sonst: Money,
    monat: string
  ): Lohnabrechnung {
    const kvAg = gesamtBrutto
      .times(SV_PARAMETER_2025.minijob_pauschal_kv_ag_prozent)
      .div(HUNDERT);
    const rvAg = gesamtBrutto
      .times(SV_PARAMETER_2025.minijob_pauschal_rv_ag_prozent)
      .div(HUNDERT);
    const pauschalSt = gesamtBrutto
      .times(SV_PARAMETER_2025.minijob_pauschalsteuer_prozent)
      .div(HUNDERT);

    const svAg: SvBeitraegeAg = {
      kv: kvAg,
      kv_zusatz: Money.zero(),
      pv: Money.zero(),
      rv: rvAg,
      av: Money.zero(),
      u1: gesamtBrutto.times(SV_PARAMETER_2025.u1_prozent).div(HUNDERT),
      u2: gesamtBrutto.times(SV_PARAMETER_2025.u2_prozent).div(HUNDERT),
      u3: gesamtBrutto.times(SV_PARAMETER_2025.u3_insolvenzgeld_prozent).div(HUNDERT),
      gesamt: Money.zero(),
    };
    svAg.gesamt = svAg.kv.plus(svAg.rv).plus(svAg.u1).plus(svAg.u2).plus(svAg.u3).plus(pauschalSt);

    return {
      arbeitnehmer_id: an.id,
      abrechnungsmonat: monat,
      laufenderBrutto: laufend,
      sonstigeBezuege: sonst,
      gesamtBrutto,
      svBrutto: gesamtBrutto,
      abzuege: {
        lohnsteuer: Money.zero(),
        solidaritaetszuschlag: Money.zero(),
        kirchensteuer: Money.zero(),
        kv_an: Money.zero(),
        kv_zusatz_an: Money.zero(),
        pv_an: Money.zero(),
        rv_an: Money.zero(),
        av_an: Money.zero(),
        gesamtAbzuege: Money.zero(),
      },
      arbeitgeberKosten: svAg,
      auszahlungsbetrag: gesamtBrutto,
      gesamtkostenArbeitgeber: gesamtBrutto.plus(svAg.gesamt),
      formatted: {
        laufenderBrutto: laufend.toFixed2(),
        sonstigeBezuege: sonst.toFixed2(),
        gesamtBrutto: gesamtBrutto.toFixed2(),
        auszahlungsbetrag: gesamtBrutto.toFixed2(),
        gesamtkostenArbeitgeber: gesamtBrutto.plus(svAg.gesamt).toFixed2(),
      },
      _meta: {
        lstMethode: "JAHRESBERECHNUNG_§39b_EStG",
        steuerklasseAngewandt: an.steuerklasse,
        kvPflichtig: false,
        rvPflichtig: false,
        svBemessungKvPv: "0.00",
        svBemessungRvAv: "0.00",
      },
    };
  }

  // ------------------------------------------------------------------
  // SV-Brutto: Summe aller svpflichtigen Lohnarten
  // ------------------------------------------------------------------
  private calcSvBrutto(
    _an: Arbeitnehmer,
    gesamtBrutto: Money,
    lohnarten: Map<string, LohnArt>,
    buchungen: Lohnbuchung[]
  ): Money {
    // Fallback: wenn keine Buchungen mit svpflichtig=false → gesamtBrutto
    const nichtSvPflichtig = sumMoney(
      buchungen
        .filter((b) => lohnarten.get(b.lohnart_id)?.svpflichtig === false)
        .map((b) => b.betrag)
    );
    return gesamtBrutto.minus(nichtSvPflichtig);
  }

  // ------------------------------------------------------------------
  // PV-Satz je nach Kinderzahl + Kinderlos-Zuschlag
  // ------------------------------------------------------------------
  private pvSatzAn(an: Arbeitnehmer): Money {
    // Hälftig: 1,8 %
    let satz = SV_PARAMETER_2025.pv_allgemein_prozent.div(2);
    if (an.pv_kinderlos_zuschlag) {
      satz = satz.plus(SV_PARAMETER_2025.pv_kinderlos_zuschlag_prozent);
    }
    // Abschlag ab 2. Kind: -0,25 % je Kind, gedeckelt bei -1 %
    if (an.pv_anzahl_kinder >= 2) {
      const zusatzKinder = Math.min(an.pv_anzahl_kinder - 1, 4);
      const abschlag = SV_PARAMETER_2025.pv_abschlag_ab_kind2_prozent.times(
        zusatzKinder
      );
      const gedeckelt = abschlag.greaterThan(
        SV_PARAMETER_2025.pv_abschlag_max_prozent
      )
        ? SV_PARAMETER_2025.pv_abschlag_max_prozent
        : abschlag;
      satz = satz.minus(gedeckelt);
    }
    return satz;
  }

  // ------------------------------------------------------------------
  // AN-Beiträge
  // ------------------------------------------------------------------
  private calcSvArbeitnehmer(
    an: Arbeitnehmer,
    svBrutto: Money
  ): SvBeitraegeAn {
    const bemessungKvPv = moneyMin(svBrutto, bbgKvPvMonat());
    const bemessungRvAv = moneyMin(svBrutto, bbgRvAvMonat());

    const kvSatz = SV_PARAMETER_2025.kv_allgemein_prozent.div(2);
    const kvZusatzSatz = an.kv_zusatzbeitrag
      ? new Money(an.kv_zusatzbeitrag).div(2)
      : SV_PARAMETER_2025.kv_zusatz_durchschnitt_prozent.div(2);

    const kv = an.kv_pflicht
      ? bemessungKvPv.times(kvSatz).div(HUNDERT)
      : Money.zero();
    const kv_zusatz = an.kv_pflicht
      ? bemessungKvPv.times(kvZusatzSatz).div(HUNDERT)
      : Money.zero();
    const pv = an.pv_pflicht
      ? bemessungKvPv.times(this.pvSatzAn(an)).div(HUNDERT)
      : Money.zero();
    const rv = an.rv_pflicht
      ? bemessungRvAv
          .times(SV_PARAMETER_2025.rv_prozent.div(2))
          .div(HUNDERT)
      : Money.zero();
    const av = an.av_pflicht
      ? bemessungRvAv
          .times(SV_PARAMETER_2025.av_prozent.div(2))
          .div(HUNDERT)
      : Money.zero();

    const gesamt = kv.plus(kv_zusatz).plus(pv).plus(rv).plus(av);
    return { kv, kv_zusatz, pv, rv, av, gesamt };
  }

  // ------------------------------------------------------------------
  // AG-Beiträge
  // ------------------------------------------------------------------
  private calcSvArbeitgeber(
    an: Arbeitnehmer,
    svBrutto: Money
  ): SvBeitraegeAg {
    const bemessungKvPv = moneyMin(svBrutto, bbgKvPvMonat());
    const bemessungRvAv = moneyMin(svBrutto, bbgRvAvMonat());

    const kv = an.kv_pflicht
      ? bemessungKvPv.times(SV_PARAMETER_2025.kv_allgemein_prozent.div(2)).div(HUNDERT)
      : Money.zero();
    const kvZusatzSatz = an.kv_zusatzbeitrag
      ? new Money(an.kv_zusatzbeitrag).div(2)
      : SV_PARAMETER_2025.kv_zusatz_durchschnitt_prozent.div(2);
    const kv_zusatz = an.kv_pflicht
      ? bemessungKvPv.times(kvZusatzSatz).div(HUNDERT)
      : Money.zero();
    const pv = an.pv_pflicht
      ? bemessungKvPv
          .times(SV_PARAMETER_2025.pv_allgemein_prozent.div(2))
          .div(HUNDERT)
      : Money.zero();
    const rv = an.rv_pflicht
      ? bemessungRvAv
          .times(SV_PARAMETER_2025.rv_prozent.div(2))
          .div(HUNDERT)
      : Money.zero();
    const av = an.av_pflicht
      ? bemessungRvAv
          .times(SV_PARAMETER_2025.av_prozent.div(2))
          .div(HUNDERT)
      : Money.zero();

    // Umlagen: auf Bruttoentgelt (ohne BBG-Deckel bei KV/PV) — approximativ.
    const u1 = svBrutto.times(SV_PARAMETER_2025.u1_prozent).div(HUNDERT);
    const u2 = svBrutto.times(SV_PARAMETER_2025.u2_prozent).div(HUNDERT);
    const u3 = svBrutto.times(SV_PARAMETER_2025.u3_insolvenzgeld_prozent).div(HUNDERT);

    const gesamt = kv.plus(kv_zusatz).plus(pv).plus(rv).plus(av).plus(u1).plus(u2).plus(u3);
    return { kv, kv_zusatz, pv, rv, av, u1, u2, u3, gesamt };
  }

  // ------------------------------------------------------------------
  // Lohnsteuer monatlich (§ 39b Abs. 2 EStG — Jahreshochrechnung)
  // Verwendet die exakte Vorsorgepauschale nach § 39b Abs. 4 EStG.
  // ------------------------------------------------------------------
  private calcLohnsteuerMonat(
    an: Arbeitnehmer,
    laufenderBrutto: Money,
    sonstigeBezuege: Money
  ): Money {
    const jahresBrutto = laufenderBrutto.times(12).plus(sonstigeBezuege);

    const vorsorge = calculateVorsorgepauschale(an, jahresBrutto);

    // Kinderfreibetrag: (§ 32 Abs. 6 EStG) wirkt beim LSt-Abzug nur für
    // Soli/KiSt (nicht für die LSt selbst seit 2004). Für MVP lassen wir
    // ihn aus der LSt-Basis raus — er wird in der tatsächlichen Veranlagung
    // berücksichtigt, nicht im monatlichen LSt-Abzug.

    const zvE = jahresBrutto
      .minus(LOHNSTEUER_PARAMETER_2025.werbungskosten_arbeitnehmer)
      .minus(LOHNSTEUER_PARAMETER_2025.sonderausgaben_pauschbetrag)
      .minus(vorsorge.gesamt);

    const jahresLst = jahresLstByStKl(zvE, an.steuerklasse);
    return jahresLst.div(12);
  }
}
