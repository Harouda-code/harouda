/**
 * Zusammenfassende Meldung (ZM) — § 18a UStG.
 *
 * Pflichtmeldung für Unternehmer mit grenzüberschreitenden Leistungen
 * innerhalb der EU. Abgabefrist: 25. Tag des Folgemonats / Folgequartals.
 *
 * Kennzahlen (ELMA5-Feld-Namen):
 *   Kz 41 — Innergemeinschaftliche Lieferungen (§ 6a UStG)
 *   Kz 21 — Innergemeinschaftliche sonstige Leistungen (§ 3a Abs. 2 UStG)
 *   Kz 42 — Dreiecksgeschäfte (§ 25b UStG, mittlerer Unternehmer)
 *
 * Pro Leistungsempfänger (identifiziert durch USt-IdNr + Land) wird je
 * Kennzahl EIN Betrag summiert. Negative Beträge sind in der ZM unzulässig;
 * Korrekturen erfordern eine separate Korrekturmeldung.
 */

export type ZmPositionType = "UMSATZ" | "META";

export type ZmPosition = {
  kz: string;
  name: string;
  type: ZmPositionType;
  /** Kennzeichnet die Entsprechung in der UStVA. */
  korrespondiert_ustva?: string;
  /** Rechtsgrundlage. */
  hgb_ref?: string;
};

export const ZM_STRUCTURE: ZmPosition[] = [
  {
    kz: "41",
    name: "Innergemeinschaftliche Lieferungen (§ 6a UStG)",
    type: "UMSATZ",
    korrespondiert_ustva: "41",
    hgb_ref: "§ 18a Abs. 1 UStG",
  },
  {
    kz: "21",
    name: "Innergemeinschaftliche sonstige Leistungen (§ 3a Abs. 2 UStG)",
    type: "UMSATZ",
    korrespondiert_ustva: "21",
    hgb_ref: "§ 18a Abs. 2 UStG",
  },
  {
    kz: "42",
    name: "Dreiecksgeschäfte (§ 25b UStG)",
    type: "UMSATZ",
    korrespondiert_ustva: "42",
    hgb_ref: "§ 18a Abs. 7 UStG",
  },
];

export const ZM_BY_KZ = new Map<string, ZmPosition>(
  ZM_STRUCTURE.map((p) => [p.kz, p])
);

/** SKR03-Konten → ZM-Kennzahl. Korrespondiert 1:1 mit den UStVA-Mappings
 *  für Kz 41, 21, 42 (siehe skr03UstvaMapping.ts).  */
export type ZmMappingRule = {
  // MONEY_SAFE: account number range, not a currency amount.
  from: number;
  // MONEY_SAFE: account number range, not a currency amount.
  to: number;
  kz: "41" | "21" | "42";
  tag: string;
};

export const SKR03_ZM_MAPPING: ZmMappingRule[] = [
  { from: 8125, to: 8125, kz: "41", tag: "IG_LIEFERUNG" },
  { from: 8336, to: 8336, kz: "21", tag: "IG_SONST_LEISTUNG" },
  { from: 8338, to: 8338, kz: "42", tag: "DREIECKSGESCHAEFT" },
];

export function findZmRule(kontoNr: string): ZmMappingRule | undefined {
  // MONEY_SAFE: account number conversion.
  const n = Number(kontoNr);
  if (!Number.isFinite(n)) return undefined;
  return SKR03_ZM_MAPPING.find((r) => n >= r.from && n <= r.to);
}
