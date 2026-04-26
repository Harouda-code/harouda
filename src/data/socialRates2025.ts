// Legacy-Fassade. Neue Konsumenten sollten direkt gegen
// `getSvSet(jahr)` aus `./svRates.ts` programmieren. Dieser Export ist
// nur übrig, damit ältere Imports (`KRANKENKASSEN_2025`, `calcSv`, …)
// weiterhin kompilieren.

import { getSvSet } from "./svRates";
import type { SvCalcResult } from "./svRates";

export type { SvCalcInput, SvCalcResult } from "./svRates";
export { calcSv } from "./svRates";
export type { Krankenkasse, Rate } from "./svRates";

const DEFAULT = getSvSet(2025);

/** @deprecated Nutzen Sie getSvSet(selectedYear).kvAllgemein */
export const KV_ALLGEMEIN = DEFAULT.kvAllgemein;
/** @deprecated */
export const PV_BASIS = DEFAULT.pvBasis;
/** @deprecated */
export const PV_ZUSCHLAG_KINDERLOS = DEFAULT.pvZuschlagKinderlos;
/** @deprecated */
export const PV_ABSCHLAG_PRO_KIND = DEFAULT.pvAbschlagProKind;
/** @deprecated */
export const RV = DEFAULT.rv;
/** @deprecated */
export const AV = DEFAULT.av;
/** @deprecated */
export const BBG_2025 = {
  kv_pv_monat: DEFAULT.bbgKvPvMonat,
  rv_av_monat_west: DEFAULT.bbgRvAvWestMonat,
  rv_av_monat_ost: DEFAULT.bbgRvAvOstMonat,
};
/** @deprecated Nutzen Sie getSvSet(jahr).krankenkassen */
export const KRANKENKASSEN_2025 = DEFAULT.krankenkassen;

// Wiedergaben, falls ältere Aufrufer die Alias-Namen brauchen
export type { SvCalcInput as SvInput } from "./svRates";
export type SvResult = SvCalcResult;
