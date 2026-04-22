/**
 * SKR03 → Anlage EÜR 2025 Mapping.
 *
 * Pro Regel:
 *   from/to      — Kontonummer-Range (inklusiv, ganzzahlig)
 *   kz           — Ziel-Kennzahl in EUER_STRUCTURE_2025
 *   tag          — Qualifikation für QA
 *   source       — Vorzeichenrichtung des Saldos:
 *                   EINNAHME  = Haben − Soll (Ertragskonto)
 *                   AUSGABE   = Soll − Haben (Aufwandskonto)
 *                   UST       = Haben − Soll (Verbindlichkeit)
 *                   VORSTEUER = Soll − Haben (Aktiva)
 *   splitPercent — optional: Prozentanteil, der nach `kz` fließt.
 *                   Rest geht nach `overflowKz` (Bewirtung 70/30).
 *
 * Ranges sind disjunkt. KleinunternehmerInnen: Kz 112 wird post-hoc auf
 * Kz 111 umgelabelt (siehe EuerBuilder).
 */

export type EuerSource = "EINNAHME" | "AUSGABE" | "UST" | "VORSTEUER";

export type EuerMappingRule = {
  // MONEY_SAFE: account number range, not a currency amount.
  from: number;
  // MONEY_SAFE: account number range, not a currency amount.
  to: number;
  kz: string;
  tag: string;
  source: EuerSource;
  /** Prozentanteil (0-100) für Aufsplittung auf zwei Kz (z. B. Bewirtung 70/30). */
  splitPercent?: number;
  /** Ziel-Kz für den Rest-Anteil. */
  overflowKz?: string;
};

export const SKR03_EUER_MAPPING: EuerMappingRule[] = [
  // -------- Betriebseinnahmen (Klasse 8) --------
  { from: 8100, to: 8119, kz: "103", tag: "EINNAHME_STEUERFREI", source: "EINNAHME" },
  { from: 8120, to: 8124, kz: "103", tag: "EINNAHME_STEUERFREI_MIT_VST", source: "EINNAHME" },
  { from: 8125, to: 8125, kz: "103", tag: "IG_LIEFERUNG", source: "EINNAHME" },
  { from: 8126, to: 8199, kz: "103", tag: "EINNAHME_STEUERFREI_B", source: "EINNAHME" },
  { from: 8300, to: 8399, kz: "112", tag: "EINNAHME_NETTO_7", source: "EINNAHME" },
  { from: 8400, to: 8499, kz: "112", tag: "EINNAHME_NETTO_19", source: "EINNAHME" },
  { from: 8500, to: 8599, kz: "103", tag: "EINNAHME_AUSLAND", source: "EINNAHME" },

  // -------- Sonstige Betriebseinnahmen / Entnahmen --------
  { from: 2700, to: 2749, kz: "102", tag: "ANLAGENVERKAUF", source: "EINNAHME" },
  { from: 8910, to: 8919, kz: "105", tag: "ENTNAHME_SACH", source: "EINNAHME" },
  { from: 8920, to: 8920, kz: "105", tag: "ENTNAHME_NUTZUNG", source: "EINNAHME" },
  { from: 8921, to: 8921, kz: "104", tag: "PRIVATE_KFZ_1PROZENT", source: "EINNAHME" },
  { from: 8924, to: 8924, kz: "104", tag: "PRIVATE_KFZ_FAHRTENBUCH", source: "EINNAHME" },
  { from: 8930, to: 8939, kz: "105", tag: "ENTNAHME_SONSTIG", source: "EINNAHME" },

  // -------- USt vereinnahmt / erstattet --------
  { from: 1771, to: 1771, kz: "140", tag: "UST_7", source: "UST" },
  { from: 1776, to: 1776, kz: "140", tag: "UST_19", source: "UST" },

  // -------- Wareneingang / Material (Klasse 3, 3400+) --------
  { from: 3400, to: 3699, kz: "100", tag: "WARENEINGANG", source: "AUSGABE" },

  // -------- Fremdleistungen --------
  { from: 3700, to: 3799, kz: "110", tag: "FREMDLEISTUNG", source: "AUSGABE" },

  // -------- Personalaufwand (Klasse 4, 4100-er) --------
  { from: 4100, to: 4129, kz: "120", tag: "LOEHNE_GEHAELTER", source: "AUSGABE" },
  { from: 4130, to: 4139, kz: "120", tag: "SOZ_ABGABEN", source: "AUSGABE" },
  { from: 4140, to: 4159, kz: "120", tag: "LOEHNE_SONST", source: "AUSGABE" },
  { from: 4160, to: 4169, kz: "120", tag: "ALTERSVORSORGE", source: "AUSGABE" },
  { from: 4170, to: 4179, kz: "120", tag: "VERM_WIRKSAM", source: "AUSGABE" },
  { from: 4180, to: 4189, kz: "120", tag: "FREIW_SOZIALLEIST", source: "AUSGABE" },
  { from: 4190, to: 4199, kz: "120", tag: "AUSHILFSLOEHNE", source: "AUSGABE" },

  // -------- Raumkosten --------
  { from: 4210, to: 4219, kz: "130", tag: "MIETE", source: "AUSGABE" },
  { from: 4220, to: 4229, kz: "130", tag: "PACHT", source: "AUSGABE" },
  { from: 4230, to: 4249, kz: "131", tag: "NEBENKOSTEN_RAUM", source: "AUSGABE" },
  { from: 4250, to: 4259, kz: "132", tag: "ARBEITSZIMMER", source: "AUSGABE" },
  { from: 4260, to: 4299, kz: "131", tag: "RAUMKOSTEN_SONSTIGE", source: "AUSGABE" },

  // -------- Betriebliche Steuern & Versicherungen --------
  { from: 4360, to: 4369, kz: "165", tag: "VERSICHERUNG", source: "AUSGABE" },
  { from: 4380, to: 4389, kz: "165", tag: "KFZ_STEUER_UND_BEITRAEGE", source: "AUSGABE" },
  { from: 4390, to: 4399, kz: "165", tag: "BEITRAEGE_VERSICHERUNGEN", source: "AUSGABE" },

  // -------- Kfz --------
  { from: 4500, to: 4569, kz: "180", tag: "KFZ_BETRIEB", source: "AUSGABE" },
  { from: 4570, to: 4579, kz: "164", tag: "LEASING_KFZ", source: "AUSGABE" },
  { from: 4580, to: 4599, kz: "180", tag: "KFZ_SONST", source: "AUSGABE" },

  // -------- Werbung & Repräsentation --------
  { from: 4600, to: 4629, kz: "166", tag: "WERBUNG", source: "AUSGABE" },
  // Geschenke abziehbar ≤ 50 € (gebucht auf 4630-4635)
  { from: 4630, to: 4635, kz: "170", tag: "GESCHENKE_ABZUGSFAEHIG", source: "AUSGABE" },
  // Geschenke > 50 € (gebucht auf 4636-4639) → nicht abziehbar
  { from: 4636, to: 4639, kz: "228", tag: "GESCHENKE_NICHT_ABZUG", source: "AUSGABE" },
  // Bewirtung 70/30-Split
  {
    from: 4650,
    to: 4655,
    kz: "175",
    tag: "BEWIRTUNG",
    source: "AUSGABE",
    splitPercent: 70,
    overflowKz: "228",
  },
  { from: 4660, to: 4669, kz: "161", tag: "REISEKOSTEN", source: "AUSGABE" },
  { from: 4670, to: 4671, kz: "162", tag: "FORTBILDUNG", source: "AUSGABE" },
  { from: 4672, to: 4672, kz: "181", tag: "ENTFERNUNGSPAUSCHALE", source: "AUSGABE" },
  { from: 4673, to: 4679, kz: "162", tag: "FORTBILDUNG_SONST", source: "AUSGABE" },

  // -------- Abschreibungen (Klasse 4, 48xx) --------
  { from: 4800, to: 4819, kz: "171", tag: "AFA_BEWEGLICH", source: "AUSGABE" },
  { from: 4820, to: 4829, kz: "172", tag: "AFA_UNBEWEGLICH", source: "AUSGABE" },
  { from: 4830, to: 4839, kz: "173", tag: "AFA_IMMATERIELL", source: "AUSGABE" },
  { from: 4840, to: 4849, kz: "171", tag: "AFA_GWG", source: "AUSGABE" },
  { from: 4850, to: 4859, kz: "174", tag: "SONDER_AFA_7G", source: "AUSGABE" },
  { from: 4860, to: 4889, kz: "171", tag: "AFA_SONST", source: "AUSGABE" },

  // -------- Sonstige Aufwände --------
  { from: 4900, to: 4919, kz: "183_SO", tag: "SONST_AUFWAND_A", source: "AUSGABE" },
  { from: 4920, to: 4929, kz: "160", tag: "TELEKOM", source: "AUSGABE" },
  { from: 4930, to: 4949, kz: "183_SO", tag: "SONST_AUFWAND_B", source: "AUSGABE" },
  { from: 4950, to: 4959, kz: "163", tag: "STEUERBERATUNG", source: "AUSGABE" },
  { from: 4960, to: 4989, kz: "183_SO", tag: "SONST_AUFWAND_C", source: "AUSGABE" },

  // -------- Zinsaufwand --------
  { from: 2300, to: 2399, kz: "234", tag: "ZINSAUFWAND", source: "AUSGABE" },

  // -------- UStVA-Zahllast (SKR03: 1789/1790-Bereich / eigenes Konto) --------
  { from: 1789, to: 1789, kz: "184", tag: "USTVA_ZAHLLAST", source: "VORSTEUER" },

  // -------- Vorsteuer --------
  { from: 1571, to: 1571, kz: "185", tag: "VORSTEUER_7", source: "VORSTEUER" },
  { from: 1572, to: 1575, kz: "185", tag: "VORSTEUER_ALLG", source: "VORSTEUER" },
  { from: 1576, to: 1577, kz: "185", tag: "VORSTEUER_19_OR_13B", source: "VORSTEUER" },
  { from: 1588, to: 1588, kz: "185", tag: "VORSTEUER_EUST", source: "VORSTEUER" },
];

/** Findet die EÜR-Regel für eine SKR03-Kontonummer oder undefined. */
export function findEuerRule(kontoNr: string): EuerMappingRule | undefined {
  // MONEY_SAFE: Number() auf Kontonummer, kein Geldwert.
  const n = Number(kontoNr);
  if (!Number.isFinite(n)) return undefined;
  for (const rule of SKR03_EUER_MAPPING) {
    if (n >= rule.from && n <= rule.to) return rule;
  }
  return undefined;
}
