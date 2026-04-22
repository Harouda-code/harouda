/**
 * SKR03-Automatik-Konto → UStVA-Kennzahl (BMF-Vordruck 2025).
 *
 * `source` klassifiziert den Aufgabenzusammenhang:
 *   UMSATZ     — Erlöskonten (Klasse 8), Saldo = haben − soll (Ertrag)
 *   AUFWAND    — Aufwands-/Eingangs-Konten, Saldo = soll − haben
 *   VORSTEUER  — Vorsteuer-Konten (1570-er Bereich), Saldo = soll − haben
 *   UST        — Umsatzsteuer-Verbindlichkeits-Konten (1770-er), wird
 *                i. d. R. nicht für die UStVA genutzt (die UStVA berechnet
 *                die USt selbst aus der Bemessungsgrundlage) — der Mapping-
 *                Eintrag ist dennoch hinterlegt, kommt aber nur zum Tragen
 *                wenn `includeUstVerbindlichkeit` aktiv ist (noch nicht umgesetzt).
 *
 * Ranges sind disjunkt. Wo Bereiche im BMF-Vordruck punktuell
 * (Einzelkonto) sind, wird `[X, X]` verwendet.
 */

export type UstvaSource = "UMSATZ" | "AUFWAND" | "VORSTEUER" | "UST";

export type UstvaMappingRule = {
  /** inkl. Untergrenze (SKR03-Kontonummer). */
  // MONEY_SAFE: account number, not a currency amount.
  from: number;
  /** inkl. Obergrenze. */
  // MONEY_SAFE: account number, not a currency amount.
  to: number;
  /** Ziel-Kennzahl in USTVA_STRUCTURE_2025. */
  kz: string;
  /** Tag für Reporting / QA. */
  tag: string;
  source: UstvaSource;
};

export const SKR03_USTVA_MAPPING: UstvaMappingRule[] = [
  // -------- Umsatzerlöse steuerpflichtig --------
  // 7 % (ermäßigt): 8300er, mit Carve-Outs für IG-sonstige Leistungen (8336)
  // und Dreiecksgeschäfte (8338) zur korrekten ZM-Korrespondenz.
  { from: 8300, to: 8335, kz: "86", tag: "UMSATZ_7_A", source: "UMSATZ" },
  { from: 8336, to: 8336, kz: "21", tag: "IG_SONST_LEISTUNGEN", source: "UMSATZ" },
  { from: 8337, to: 8337, kz: "86", tag: "UMSATZ_7_B", source: "UMSATZ" },
  { from: 8338, to: 8338, kz: "42", tag: "DREIECKSGESCHAEFT", source: "UMSATZ" },
  { from: 8339, to: 8399, kz: "86", tag: "UMSATZ_7_C", source: "UMSATZ" },
  // 19 % (Regelsatz): 8400er
  { from: 8400, to: 8499, kz: "81", tag: "UMSATZ_19", source: "UMSATZ" },

  // -------- Steuerfreie Umsätze --------
  // IG Lieferung § 4 Nr. 1b (Kz 41)
  { from: 8125, to: 8125, kz: "41", tag: "IG_LIEF", source: "UMSATZ" },
  // IG Lieferung neuer Fahrzeuge (Kz 44)
  { from: 8150, to: 8150, kz: "44", tag: "IG_LIEF_FAHRZEUG", source: "UMSATZ" },
  // Weitere steuerfreie Umsätze mit Vorsteuerabzug (Kz 43)
  { from: 8120, to: 8124, kz: "43", tag: "STEUERFREI_MIT_VSTAB", source: "UMSATZ" },
  // Steuerfreie Umsätze OHNE Vorsteuerabzug (Kz 48)
  { from: 8100, to: 8119, kz: "48", tag: "STEUERFREI_OHNE", source: "UMSATZ" },
  { from: 8126, to: 8149, kz: "48", tag: "STEUERFREI_OHNE_B", source: "UMSATZ" },
  { from: 8151, to: 8199, kz: "48", tag: "STEUERFREI_OHNE_C", source: "UMSATZ" },

  // Umsätze im Ausland / nicht steuerbar (Kz 60)
  { from: 8500, to: 8599, kz: "60", tag: "UMSATZ_AUSLAND", source: "UMSATZ" },

  // -------- Innergemeinschaftliche Erwerbe (Bemessungsgrundlage) --------
  // 7 % (Kz 93)
  { from: 3420, to: 3424, kz: "93", tag: "IG_ERWERB_7", source: "AUFWAND" },
  // 19 % (Kz 89)
  { from: 3425, to: 3429, kz: "89", tag: "IG_ERWERB_19", source: "AUFWAND" },

  // -------- § 13b Reverse Charge (Bemessungsgrundlage) --------
  // § 13b Abs. 1 / Abs. 2 Nr. 1-5 (Kz 46) — z. B. B2B Dienstleistungen aus EU
  { from: 3100, to: 3119, kz: "46", tag: "REVERSE_13B_1_5", source: "AUFWAND" },
  // § 13b Abs. 2 Nr. 2 Bauleistungen (Kz 73)
  { from: 3120, to: 3129, kz: "73", tag: "REVERSE_13B_BAU", source: "AUFWAND" },
  // § 13b Abs. 2 Nr. 3 Gebäudereinigung (Kz 78)
  { from: 3130, to: 3139, kz: "78", tag: "REVERSE_13B_REINIGUNG", source: "AUFWAND" },
  // § 13b Abs. 2 Nr. 4, 5b, 6-11 (Kz 52)
  { from: 3140, to: 3159, kz: "52", tag: "REVERSE_13B_4_11", source: "AUFWAND" },

  // -------- Vorsteuer-Konten --------
  // Vorsteuer 7 % (1571)
  { from: 1571, to: 1571, kz: "66", tag: "VORSTEUER_7", source: "VORSTEUER" },
  // Vorsteuer IG Erwerb (1574)
  { from: 1574, to: 1574, kz: "61", tag: "VST_IG_ERWERB", source: "VORSTEUER" },
  // Allgemeine Vorsteuer (1572, 1573, 1575)
  { from: 1572, to: 1573, kz: "66", tag: "VORSTEUER_ALLG_A", source: "VORSTEUER" },
  { from: 1575, to: 1575, kz: "66", tag: "VORSTEUER_ALLG_B", source: "VORSTEUER" },
  // Vorsteuer 19 % (1576)
  { from: 1576, to: 1576, kz: "66", tag: "VORSTEUER_19", source: "VORSTEUER" },
  // Vorsteuer § 13b (1577)
  { from: 1577, to: 1577, kz: "67", tag: "VST_13B", source: "VORSTEUER" },
  // EUSt (1588)
  { from: 1588, to: 1588, kz: "62", tag: "EUST", source: "VORSTEUER" },
];

/** Findet die UStVA-Regel für eine SKR03-Kontonummer oder undefined. */
export function findUstvaRule(
  kontoNr: string
): UstvaMappingRule | undefined {
  // MONEY_SAFE: Number() auf Kontonummer, kein Geldwert.
  const n = Number(kontoNr);
  if (!Number.isFinite(n)) return undefined;
  for (const rule of SKR03_USTVA_MAPPING) {
    if (n >= rule.from && n <= rule.to) return rule;
  }
  return undefined;
}
