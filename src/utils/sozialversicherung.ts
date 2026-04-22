// Sozialversicherungsbeiträge 2025 — PLANUNGSGRADIG.
//
// Für die Übertragung an die Sozialversicherungsträger (DEÜV / DSKV / BKV /
// BeSA) ist eine ITSG-zertifizierte Software erforderlich. Dieses Modul
// erzeugt die mathematischen Beträge, ersetzt aber KEIN zertifiziertes
// Lohnprogramm.
//
// Standardwerte Stand 2025 — bitte jährlich gegen den Bundesanzeiger
// abgleichen:
//
//   Krankenversicherung (GKV): 14,6 % (je 7,3 %)
//                              + Zusatzbeitrag (individuell pro Kasse,
//                                Durchschnitt 2025 ~1,7 %, geteilt)
//   Pflegeversicherung (PV):   3,4 %  Basis (je 1,7 %)
//                              + 0,6 % Kinderlosenzuschlag allein AN
//                              − 0,25 % pro Kind (2.–5.) bei Eltern
//   Rentenversicherung (RV):   18,6 % (je 9,3 %)
//   Arbeitslosen (AV):          2,6 % (je 1,3 %)
//
//   BBG West/Ost 2025 einheitlich:
//     KV/PV:  66.150 €/Jahr = 5.512,50 €/Monat
//     RV/AV:  96.600 €/Jahr = 8.050,00 €/Monat
//
//   Mini-Job (geringfügige Beschäftigung) 2025:
//     Obergrenze   € 556 / Monat — pauschal nur AG-Beiträge
//   Midi-Job (Übergangsbereich) 2025:
//     € 556,01 – € 2.000,00 / Monat — Gleitzone mit reduziertem AN-Anteil

export type SvRates = {
  /** Krankenversicherung: Gesamtbeitragssatz (geteilt). */
  kv: number;
  /** Zusatzbeitrag (individueller Satz pro Krankenkasse, 2025 ~1,7 % im Schnitt). */
  zusatzbeitrag: number;
  /** Pflegeversicherung Basissatz. */
  pv: number;
  /** Zusatz für Kinderlose (23+). */
  pvKinderlos: number;
  /** Reduktion je zusätzlichem Kind ab dem 2. */
  pvKinderAbschlag: number;
  pvKinderMaxAbschlag: number;
  rv: number;
  av: number;
};

export type SvLimits = {
  bbgKvPvMonat: number;
  bbgRvAvMonat: number;
  minijobGrenze: number;
  midijobUntergrenze: number;
  midijobObergrenze: number;
};

export const SV_2025: SvRates = {
  kv: 0.146,
  zusatzbeitrag: 0.017,
  pv: 0.034,
  pvKinderlos: 0.006,
  pvKinderAbschlag: 0.0025,
  pvKinderMaxAbschlag: 0.01,
  rv: 0.186,
  av: 0.026,
};

export const LIMITS_2025: SvLimits = {
  bbgKvPvMonat: 5_512.5,
  bbgRvAvMonat: 8_050,
  minijobGrenze: 556,
  midijobUntergrenze: 556.01,
  midijobObergrenze: 2_000,
};

export type SvInput = {
  /** Monats-Brutto in Euro. */
  brutto_monat: number;
  /** 'vollzeit' | 'teilzeit' | 'minijob' | 'midijob' | 'ausbildung' */
  beschaeftigungsart:
    | "vollzeit"
    | "teilzeit"
    | "minijob"
    | "midijob"
    | "ausbildung";
  /** true = privat versichert → GKV entfällt, AG zahlt Zuschuss nach SGB V. */
  privat_versichert: boolean;
  /** true = kinderlos und ≥ 23 → +0,6 % in der PV (allein AN). */
  pv_kinderlos: boolean;
  /** Anzahl der für die PV-Ermäßigung berücksichtigten Kinder <25. */
  pv_kinder: number;
  /** Individueller Zusatzbeitrag der Krankenkasse (0–0,05 = 0–5 %). */
  zusatzbeitrag_pct?: number;
  /** Optional andere Raten verwenden (Default SV_2025). */
  rates?: SvRates;
  limits?: SvLimits;
};

export type SvResult = {
  /** Beiträge des Arbeitnehmers. */
  arbeitnehmer: {
    kv: number;
    pv: number;
    rv: number;
    av: number;
    gesamt: number;
  };
  /** Beiträge des Arbeitgebers. */
  arbeitgeber: {
    kv: number;
    pv: number;
    rv: number;
    av: number;
    u1: number; // Umlage-U1 (Krankheit), ~1,1 %
    u2: number; // Umlage-U2 (Mutterschaft), ~0,22 %
    insolvenzgeld: number; // ~0,15 %
    gesamt: number;
  };
  /** Kurzbeschreibung der angewendeten Logik. */
  method:
    | "minijob"
    | "midijob"
    | "regulaer"
    | "regulaer_privat_kv"
    | "null";
  /** Basis, auf der die Beiträge berechnet wurden (nach BBG-Deckelung). */
  bemessung_kvpv: number;
  bemessung_rvav: number;
  /** Für den Midi-Job: ermittelter beitragspflichtiger Betrag (Reduzierung). */
  midijob_bemessung?: number;
};

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function pvEffektivAN(input: SvInput, rates: SvRates): number {
  // AN-Anteil = halber Basissatz
  let an = rates.pv / 2;
  if (input.pv_kinderlos) an += rates.pvKinderlos; // voll beim AN
  if (input.pv_kinder >= 2) {
    const abschlag = Math.min(
      rates.pvKinderMaxAbschlag,
      rates.pvKinderAbschlag * (Math.min(input.pv_kinder, 5) - 1)
    );
    an = Math.max(0, an - abschlag);
  }
  return an;
}

function pvAgSatz(rates: SvRates): number {
  return rates.pv / 2;
}

export function berechneSv(input: SvInput): SvResult {
  const rates = input.rates ?? SV_2025;
  const limits = input.limits ?? LIMITS_2025;
  const zb = input.zusatzbeitrag_pct ?? rates.zusatzbeitrag;

  const brutto = Math.max(0, input.brutto_monat);
  if (brutto === 0) {
    return zeroResult();
  }

  // Mini-Job
  if (
    input.beschaeftigungsart === "minijob" ||
    brutto <= limits.minijobGrenze
  ) {
    // AN zahlt idR NICHTS (Befreiung auf Antrag von der RV möglich, default
    // heute aber Pflicht — 3,6 %). Default: AN-Anteil = 0 (Befreiung),
    // AG trägt Pauschalen (ca. 13 % KV + 15 % RV + 2 % pauschale LSt + U1/U2).
    return {
      arbeitnehmer: { kv: 0, pv: 0, rv: 0, av: 0, gesamt: 0 },
      arbeitgeber: {
        kv: round2(brutto * 0.13),
        pv: 0,
        rv: round2(brutto * 0.15),
        av: 0,
        u1: round2(brutto * 0.011),
        u2: round2(brutto * 0.0022),
        insolvenzgeld: round2(brutto * 0.0015),
        gesamt: round2(brutto * (0.13 + 0.15 + 0.011 + 0.0022 + 0.0015)),
      },
      method: "minijob",
      bemessung_kvpv: brutto,
      bemessung_rvav: brutto,
    };
  }

  // Midi-Job (Übergangsbereich) — reduzierte AN-Last
  if (
    input.beschaeftigungsart === "midijob" ||
    (brutto > limits.minijobGrenze && brutto <= limits.midijobObergrenze)
  ) {
    // Vereinfachte Formel gemäß § 20 Abs. 2 SGB IV:
    //   F = (G - U) / (O - U) , wobei U = 556, O = 2000
    //   beitragspflichtig = F * AG-Satz + (1 - F) * (Brutto - (Brutto - F*Brutto))
    // Hier vereinfacht: Gleitzonenfaktor linear, AN-Anteil reduziert,
    // AG-Anteil voll.
    const F =
      (brutto - limits.minijobGrenze) /
      (limits.midijobObergrenze - limits.minijobGrenze);
    const midiBemessung = round2(brutto * F);

    const kvAn = round2(midiBemessung * (rates.kv / 2 + zb / 2));
    const pvAn = round2(midiBemessung * pvEffektivAN(input, rates));
    const rvAn = round2(midiBemessung * (rates.rv / 2));
    const avAn = round2(midiBemessung * (rates.av / 2));

    const kvAg = round2(brutto * (rates.kv / 2 + zb / 2));
    const pvAg = round2(brutto * pvAgSatz(rates));
    const rvAg = round2(brutto * (rates.rv / 2));
    const avAg = round2(brutto * (rates.av / 2));
    const u1 = round2(brutto * 0.011);
    const u2 = round2(brutto * 0.0022);
    const ins = round2(brutto * 0.0015);

    return {
      arbeitnehmer: {
        kv: kvAn,
        pv: pvAn,
        rv: rvAn,
        av: avAn,
        gesamt: round2(kvAn + pvAn + rvAn + avAn),
      },
      arbeitgeber: {
        kv: kvAg,
        pv: pvAg,
        rv: rvAg,
        av: avAg,
        u1,
        u2,
        insolvenzgeld: ins,
        gesamt: round2(kvAg + pvAg + rvAg + avAg + u1 + u2 + ins),
      },
      method: "midijob",
      bemessung_kvpv: brutto,
      bemessung_rvav: brutto,
      midijob_bemessung: midiBemessung,
    };
  }

  // Regulär
  const bemKvPv = Math.min(brutto, limits.bbgKvPvMonat);
  const bemRvAv = Math.min(brutto, limits.bbgRvAvMonat);

  const kvAnSatz = rates.kv / 2 + zb / 2;
  const kvAgSatz = rates.kv / 2 + zb / 2;

  const kvAn = input.privat_versichert ? 0 : round2(bemKvPv * kvAnSatz);
  const pvAn = input.privat_versichert ? 0 : round2(bemKvPv * pvEffektivAN(input, rates));
  const rvAn = round2(bemRvAv * (rates.rv / 2));
  const avAn = round2(bemRvAv * (rates.av / 2));

  const kvAg = input.privat_versichert
    ? round2(Math.min(bemKvPv * kvAgSatz, bemKvPv * (rates.kv / 2))) // Zuschuss gedeckelt
    : round2(bemKvPv * kvAgSatz);
  const pvAg = input.privat_versichert
    ? round2(bemKvPv * pvAgSatz(rates))
    : round2(bemKvPv * pvAgSatz(rates));
  const rvAg = round2(bemRvAv * (rates.rv / 2));
  const avAg = round2(bemRvAv * (rates.av / 2));

  const u1 = round2(brutto * 0.011);
  const u2 = round2(brutto * 0.0022);
  const ins = round2(brutto * 0.0015);

  return {
    arbeitnehmer: {
      kv: kvAn,
      pv: pvAn,
      rv: rvAn,
      av: avAn,
      gesamt: round2(kvAn + pvAn + rvAn + avAn),
    },
    arbeitgeber: {
      kv: kvAg,
      pv: pvAg,
      rv: rvAg,
      av: avAg,
      u1,
      u2,
      insolvenzgeld: ins,
      gesamt: round2(kvAg + pvAg + rvAg + avAg + u1 + u2 + ins),
    },
    method: input.privat_versichert ? "regulaer_privat_kv" : "regulaer",
    bemessung_kvpv: bemKvPv,
    bemessung_rvav: bemRvAv,
  };
}

function zeroResult(): SvResult {
  return {
    arbeitnehmer: { kv: 0, pv: 0, rv: 0, av: 0, gesamt: 0 },
    arbeitgeber: {
      kv: 0,
      pv: 0,
      rv: 0,
      av: 0,
      u1: 0,
      u2: 0,
      insolvenzgeld: 0,
      gesamt: 0,
    },
    method: "null",
    bemessung_kvpv: 0,
    bemessung_rvav: 0,
  };
}
