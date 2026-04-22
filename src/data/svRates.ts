// Sozialversicherungsrechner, jahresabhängig.
// Liest Werte aus `steuerParameter/{jahr}.ts` und rechnet Beiträge.

import { getSteuerParameter } from "./steuerParameter";
import type {
  Krankenkasse,
  SteuerParameter,
  SvRate,
  SvRegion,
} from "./steuerParameter/types";

export type { Krankenkasse, SvRate as Rate } from "./steuerParameter/types";

export type SvSet = {
  jahr: number;
  kvAllgemein: SvRate;
  pvBasis: SvRate;
  pvZuschlagKinderlos: number;
  pvAbschlagProKind: number;
  rv: SvRate;
  av: SvRate;
  bbgKvPvMonat: number;
  bbgRvAvWestMonat: number;
  bbgRvAvOstMonat: number;
  krankenkassen: Krankenkasse[];
};

export function getSvSet(jahr: number): SvSet {
  const p: SteuerParameter = getSteuerParameter(jahr);
  return {
    jahr: p.jahr,
    kvAllgemein: p.sv.kv_allgemein,
    pvBasis: p.sv.pv_basis,
    pvZuschlagKinderlos: p.sv.pv_zuschlag_kinderlos_pct,
    pvAbschlagProKind: p.sv.pv_abschlag_pro_kind_pct,
    rv: p.sv.rv,
    av: p.sv.av,
    bbgKvPvMonat: p.sv.bbg_kv_pv_monat,
    bbgRvAvWestMonat: p.sv.bbg_rv_av_west_monat,
    bbgRvAvOstMonat: p.sv.bbg_rv_av_ost_monat,
    krankenkassen: p.sv.krankenkassen,
  };
}

export type SvCalcInput = {
  bruttoMonat: number;
  zusatzbeitragPct: number;
  kinderlos: boolean;
  anzahlKinder: number;
  region: SvRegion;
  jahr?: number;
};

export type SvCalcResult = {
  jahr: number;
  bemessungKv: number;
  bemessungRv: number;
  kv_an: number;
  kv_ag: number;
  pv_an: number;
  pv_ag: number;
  rv_an: number;
  rv_ag: number;
  av_an: number;
  av_ag: number;
  summe_an: number;
  summe_ag: number;
  netto_vor_steuer: number;
};

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export function calcSv(input: SvCalcInput): SvCalcResult {
  const set = getSvSet(input.jahr ?? new Date().getFullYear());

  const bemessungKv = Math.min(input.bruttoMonat, set.bbgKvPvMonat);
  const bemessungRv = Math.min(
    input.bruttoMonat,
    input.region === "ost" ? set.bbgRvAvOstMonat : set.bbgRvAvWestMonat
  );

  const kv_an =
    (bemessungKv * (set.kvAllgemein.arbeitnehmer + input.zusatzbeitragPct / 2)) /
    100;
  const kv_ag =
    (bemessungKv * (set.kvAllgemein.arbeitgeber + input.zusatzbeitragPct / 2)) /
    100;

  let anPvPct = set.pvBasis.arbeitnehmer;
  const agPvPct = set.pvBasis.arbeitgeber;
  if (input.kinderlos) anPvPct += set.pvZuschlagKinderlos;
  else if (input.anzahlKinder >= 2) {
    const abzugKinder = Math.min(input.anzahlKinder, 5) - 1;
    anPvPct = Math.max(0, anPvPct - abzugKinder * set.pvAbschlagProKind);
  }
  const pv_an = (bemessungKv * anPvPct) / 100;
  const pv_ag = (bemessungKv * agPvPct) / 100;

  const rv_an = (bemessungRv * set.rv.arbeitnehmer) / 100;
  const rv_ag = (bemessungRv * set.rv.arbeitgeber) / 100;
  const av_an = (bemessungRv * set.av.arbeitnehmer) / 100;
  const av_ag = (bemessungRv * set.av.arbeitgeber) / 100;

  const summe_an = kv_an + pv_an + rv_an + av_an;
  const summe_ag = kv_ag + pv_ag + rv_ag + av_ag;

  return {
    jahr: set.jahr,
    bemessungKv,
    bemessungRv,
    kv_an: round2(kv_an),
    kv_ag: round2(kv_ag),
    pv_an: round2(pv_an),
    pv_ag: round2(pv_ag),
    rv_an: round2(rv_an),
    rv_ag: round2(rv_ag),
    av_an: round2(av_an),
    av_ag: round2(av_ag),
    summe_an: round2(summe_an),
    summe_ag: round2(summe_ag),
    netto_vor_steuer: round2(input.bruttoMonat - summe_an),
  };
}
