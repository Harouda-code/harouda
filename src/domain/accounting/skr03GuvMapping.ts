/**
 * SKR03-Kontenbereich → HGB § 275 Abs. 2 Nr. N.
 *
 * Ranges sind disjoint (non-overlapping). Wo der Prompt überlappende
 * Bereiche vorgab (z. B. 4100-4199 vs. 4130-4139), wurden die engeren
 * Regeln extrahiert und die breiteren auf die Lücken reduziert.
 *
 * Der Auflöser (`findGuvRule`) gibt die erste passende Regel zurück —
 * auch bei non-overlapping Ranges genügt linear-scan bei ~40 Regeln.
 */

export type GuvMappingRule = {
  /** inkl. Untergrenze (SKR03-Kontonummer, ganzzahlig) */
  // MONEY_SAFE: SKR03 account number range bracket (integer), not a currency amount.
  from: number;
  /** inkl. Obergrenze (SKR03-Kontonummer, ganzzahlig) */
  // MONEY_SAFE: SKR03 account number range bracket (integer), not a currency amount.
  to: number;
  /** Reference-Code einer Zeile in HGB_275_GKV_STRUCTURE. */
  guv_ref: string;
  /** Qualifizierendes Tag */
  tag: string;
};

export const SKR03_GUV_MAPPING: GuvMappingRule[] = [
  // -------- Umsatzerlöse (Posten 1) --------
  { from: 8100, to: 8199, guv_ref: "1", tag: "UMSATZERLOESE_REGELSATZ" },
  { from: 8200, to: 8299, guv_ref: "1", tag: "UMSATZERLOESE_ERMAESSIGT" },
  { from: 8300, to: 8399, guv_ref: "1", tag: "UMSATZERLOESE_STEUERFREI" },
  { from: 8400, to: 8499, guv_ref: "1", tag: "UMSATZERLOESE_19" },
  { from: 8500, to: 8799, guv_ref: "1", tag: "UMSATZERLOESE_SONSTIGE" },

  // -------- Aktivierte Eigenleistungen (Posten 3) --------
  { from: 8900, to: 8929, guv_ref: "3", tag: "AKTIVIERTE_EIGENLEISTUNG" },

  // -------- Bestandsveränderungen (Posten 2) --------
  { from: 8980, to: 8989, guv_ref: "2", tag: "BESTANDSVERAENDERUNG_FERTIG" },
  { from: 8990, to: 8999, guv_ref: "2", tag: "BESTANDSVERAENDERUNG_UNFERTIG" },

  // -------- Sonstige betriebliche Erträge (Posten 4) --------
  { from: 2700, to: 2799, guv_ref: "4", tag: "SONSTIGE_BETRIEBLICHE_ERTRAEGE" },

  // -------- Sonstige betriebliche Aufwendungen (Posten 8) Teil 0 --------
  // Sonstige betriebliche Aufwendungen (§ 275 Abs. 2 Nr. 8 HGB n.F.) —
  // dazu gehören auch Buchverluste aus Anlagenabgang nach BilRUG 2015
  // (die Position „Außerordentliche Aufwendungen" wurde 2015 gestrichen).
  { from: 2800, to: 2899, guv_ref: "8", tag: "SONSTIGE_BETRIEBLICHE_AUFWENDUNGEN_NEUTRAL" },

  // -------- Finanzerträge (9 / 10 / 11) --------
  { from: 2600, to: 2649, guv_ref: "9", tag: "BETEILIGUNGSERTRAEGE" },
  { from: 2650, to: 2659, guv_ref: "11", tag: "ZINSERTRAEGE" },
  { from: 2660, to: 2699, guv_ref: "10", tag: "ERTRAEGE_WERTPAPIERE" },

  // -------- Finanzaufwendungen (12 / 13) --------
  // Post-Bugfix 2026-04-20 Bug B: Konto 2300 ist im harouda-SKR03 als
  // „Grundkapital / Gezeichnetes Kapital" (passiva) deklariert
  // (`skr03.ts:87`, explizite Entscheidung). Die Standard-SKR03-
  // Interpretation als „Zinsaufwand" gilt hier nicht. Range daher auf
  // 2310-2319 verkürzt — 2300-2309 ist im Bilanz-Mapping als P.A.I
  // Gezeichnetes Kapital geführt.
  { from: 2310, to: 2319, guv_ref: "13", tag: "ZINSAUFWAND" },
  { from: 2320, to: 2329, guv_ref: "13", tag: "ZINSEN_LANGFRIST" },
  { from: 2330, to: 2399, guv_ref: "13", tag: "ZINSAUFWAND_SONSTIGE" },
  { from: 4890, to: 4899, guv_ref: "12", tag: "AFA_FINANZANLAGEN" },

  // -------- Materialaufwand 5.a (Wareneingang / bezogene Waren) --------
  // SKR03-Konten 3000-3099 und 3160-3299 bleiben Bestand (B.I.1) — sie sind
  // Inventur-Konten für Roh-/Hilfs-/Betriebsstoffe. Ab 3400 greifen die
  // Wareneingangs-Aufwandskonten (inkl. IG-Erwerb 3420-3429, § 1a UStG).
  { from: 3400, to: 3699, guv_ref: "5.a", tag: "WARENEINGANG" },

  // -------- Materialaufwand 5.b (bezogene Leistungen) --------
  // 3100-3159: Sprint-7 Reverse-Charge-Bemessungsgrundlagen (§ 13b UStG —
  // Fremdleistungen/Bauleistungen/Gebäudereinigung). Audit 2026-04-20 P0-01:
  // sie waren vorher weder in Bilanz- noch in GuV-Aggregation (Saldo fiel aus
  // der Summe). Jetzt als 5.b Fremdleistungen geführt; 3000-3199 Bilanz-Rule
  // entsprechend in skr03Mapping.ts aufgesplittet, damit Konten nicht
  // doppelt zählen.
  { from: 3100, to: 3159, guv_ref: "5.b", tag: "REVERSE_CHARGE" },
  { from: 3700, to: 3799, guv_ref: "5.b", tag: "FREMDLEISTUNGEN" },

  // -------- Personalaufwand 6.a (Löhne/Gehälter) --------
  { from: 4100, to: 4119, guv_ref: "6.a", tag: "LOEHNE" },
  { from: 4120, to: 4129, guv_ref: "6.a", tag: "GEHAELTER" },
  // -------- Personalaufwand 6.b (Sozialaufwendungen) --------
  { from: 4130, to: 4139, guv_ref: "6.b", tag: "SOZIALE_ABGABEN" },
  // -------- Personalaufwand 6.a (Fortsetzung) --------
  { from: 4140, to: 4159, guv_ref: "6.a", tag: "LOEHNE_SONSTIGE" },
  // -------- Personalaufwand 6.b (Altersversorgung) --------
  { from: 4160, to: 4169, guv_ref: "6.b", tag: "ALTERSVORSORGE" },
  // -------- Personalaufwand 6.a (vermögenswirksame Leistungen etc.) --------
  { from: 4170, to: 4179, guv_ref: "6.a", tag: "VERM_LEISTUNGEN" },
  // -------- Personalaufwand 6.b (freiwillige Sozialleistungen) --------
  { from: 4180, to: 4189, guv_ref: "6.b", tag: "FREIWILLIGE_SOZIALLEISTUNGEN" },
  // -------- Personalaufwand 6.a (Aushilfslöhne) --------
  { from: 4190, to: 4199, guv_ref: "6.a", tag: "AUSHILFSLOEHNE" },

  // -------- Sonstige betriebliche Aufwendungen (Posten 8) Teil 1 --------
  { from: 4200, to: 4299, guv_ref: "8", tag: "RAUMKOSTEN" },
  // -------- betriebliche Steuern (Posten 8) / Grundsteuer / KFZ-Steuer (Posten 16) --------
  { from: 4300, to: 4319, guv_ref: "8", tag: "BETRIEBLICHE_STEUERN" },
  { from: 4320, to: 4329, guv_ref: "16", tag: "GRUNDSTEUER" },
  { from: 4330, to: 4379, guv_ref: "8", tag: "BETRIEBLICHE_STEUERN_SONST" },
  { from: 4380, to: 4389, guv_ref: "16", tag: "KFZ_STEUER" },
  { from: 4390, to: 4399, guv_ref: "8", tag: "VERSICHERUNGEN_BEITRAEGE" },
  { from: 4400, to: 4499, guv_ref: "8", tag: "BETRIEBLICHE_AUFWAND_SONST" },
  { from: 4500, to: 4599, guv_ref: "8", tag: "KFZ_KOSTEN" },
  { from: 4600, to: 4699, guv_ref: "8", tag: "WERBE_REISEKOSTEN" },
  { from: 4700, to: 4799, guv_ref: "8", tag: "KOSTEN_WARENABGABE" },

  // -------- Abschreibungen (Posten 7.a / 7.b) --------
  { from: 4800, to: 4829, guv_ref: "7.a", tag: "AFA_SACHANLAGEN" },
  { from: 4830, to: 4839, guv_ref: "7.a", tag: "AFA_IMMATERIELL" },
  { from: 4840, to: 4849, guv_ref: "7.a", tag: "AFA_GWG" },
  { from: 4850, to: 4869, guv_ref: "7.a", tag: "AFA_SONSTIGE_AV" },
  { from: 4870, to: 4879, guv_ref: "7.b", tag: "AFA_UV_AUSSERGEWOEHNLICH" },
  { from: 4880, to: 4889, guv_ref: "7.a", tag: "AFA_ABGANG" },

  // -------- Sonstige betriebliche Aufwendungen (Posten 8) Teil 2 --------
  { from: 4900, to: 4989, guv_ref: "8", tag: "SONSTIGER_BETRIEBSAUFWAND" },

  // -------- Steuern vom Einkommen (Posten 14) --------
  { from: 7600, to: 7609, guv_ref: "14", tag: "KOERPERSCHAFTSTEUER" },
  { from: 7610, to: 7619, guv_ref: "14", tag: "GEWERBESTEUER" },
  { from: 7620, to: 7699, guv_ref: "14", tag: "ERTRAGSTEUER_SONST" },

  // -------- Sonstige Steuern (Posten 16) --------
  { from: 7700, to: 7799, guv_ref: "16", tag: "SONSTIGE_STEUERN" },
];

/** Findet die GuV-Regel für eine Konto-Nummer (String; führende Nullen erlaubt).
 *  Gibt `undefined` zurück, wenn das Konto in keine Range fällt. */
export function findGuvRule(kontoNr: string): GuvMappingRule | undefined {
  // MONEY_SAFE: Number() auf Kontonummer (integer), kein Geldwert.
  const n = Number(kontoNr);
  if (!Number.isFinite(n)) return undefined;
  for (const rule of SKR03_GUV_MAPPING) {
    if (n >= rule.from && n <= rule.to) return rule;
  }
  return undefined;
}
