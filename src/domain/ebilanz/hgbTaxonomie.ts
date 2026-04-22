/**
 * HGB-Taxonomie Multi-Version-Orchestrator (Jahresabschluss-E4 / Schritt 2).
 *
 * GoBD-RECHTSFLAGGE: Die HGB-XBRL-Taxonomie wird jaehrlich (typisch April)
 * vom BMF aktualisiert. Jeder Stichtag muss mit der zum jeweiligen Zeitpunkt
 * guelltigen Taxonomie ausgegeben werden, sonst ist die E-Bilanz nach
 * § 5b EStG nicht konform.
 *
 * Dieser Orchestrator:
 *   1. haelt ein Register aller bekannten Versionen inkl. Metadata.
 *   2. mappt einen Bilanz-Stichtag auf die passende Version.
 *   3. warnt bei Future-Stichtagen (jenseits der aktuellen Taxonomie).
 *
 * ACHTUNG: Infrastruktur ist vorhanden — die konkrete strukturelle
 * XBRL-Unterstuetzung liegt aktuell NUR in hgbTaxonomie68.ts (Version 6.8).
 * 6.6/6.7 werden als Version-Tag ausgewaehlt, aber die XBRL-Ausgabe ist die
 * 6.8-Struktur. 6.9 ist ein Platzhalter fuer 2026-Upgrades.
 * Siehe docs/TECH-DEBT-XBRL-MULTI-VERSION.md.
 */

export type HgbTaxonomieVersion =
  | "6.6" // historisch (2023-04-01)
  | "6.7" // historisch (2024-04-01)
  | "6.8" // aktueller Stand (2025-04-01)
  | "6.9"; // erwartet (2026-04-01)

export type TaxonomieMetadata = {
  version: HgbTaxonomieVersion;
  /** ISO-Datum der BMF-Veroeffentlichung. */
  veroeffentlicht: string;
  /** ISO-Datum, ab dem die Version fuer Stichtage zu verwenden ist. */
  gueltig_ab_stichtag: string;
  status: "stable" | "deprecated" | "future";
  bmf_quelle_url?: string;
};

/**
 * Register aller bekannten Taxonomie-Versionen.
 *
 * Quellen:
 *  - https://esteuer.bundesfinanzministerium.de/estaxo/taxonomien
 *  - https://www.esteuer.de (BMF-Downloads)
 */
export const HGB_TAXONOMIE_VERSIONEN: Record<
  HgbTaxonomieVersion,
  TaxonomieMetadata
> = {
  "6.6": {
    version: "6.6",
    veroeffentlicht: "2023-04-01",
    gueltig_ab_stichtag: "2023-01-01",
    status: "deprecated",
    bmf_quelle_url:
      "https://esteuer.bundesfinanzministerium.de/estaxo/taxonomien",
  },
  "6.7": {
    version: "6.7",
    veroeffentlicht: "2024-04-01",
    gueltig_ab_stichtag: "2024-01-01",
    status: "deprecated",
    bmf_quelle_url:
      "https://esteuer.bundesfinanzministerium.de/estaxo/taxonomien",
  },
  "6.8": {
    version: "6.8",
    veroeffentlicht: "2025-04-01",
    gueltig_ab_stichtag: "2025-01-01",
    status: "stable",
    bmf_quelle_url:
      "https://esteuer.bundesfinanzministerium.de/estaxo/taxonomien",
  },
  "6.9": {
    version: "6.9",
    veroeffentlicht: "2026-04-01",
    gueltig_ab_stichtag: "2026-01-01",
    status: "future",
    bmf_quelle_url:
      "https://esteuer.bundesfinanzministerium.de/estaxo/taxonomien",
  },
};

/**
 * Mappt einen Bilanz-Stichtag auf die rechtlich passende Taxonomie-Version.
 *
 * Regeln:
 *  - Stichtag 2023-* → 6.6
 *  - Stichtag 2024-* → 6.7
 *  - Stichtag 2025-* → 6.8
 *  - Stichtag >= 2026-01-01: nur 6.9 nutzen, wenn Status === "stable".
 *    Solange 6.9 noch "future" ist (BMF hat noch nicht freigegeben),
 *    Fallback 6.8 + console.warn.
 *  - Stichtage < 2023: console.warn + Fallback 6.8 (wir unterstuetzen
 *    keine aelteren Taxonomien als 6.6).
 */
export function pickTaxonomieFuerStichtag(
  stichtag: string
): HgbTaxonomieVersion {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(stichtag);
  if (!m) {
    // eslint-disable-next-line no-console
    console.warn(
      `[hgbTaxonomie] Ungueltiger Stichtag "${stichtag}" — Fallback auf 6.8.`
    );
    return "6.8";
  }
  const jahr = Number(m[1]);

  if (jahr <= 2022) {
    // eslint-disable-next-line no-console
    console.warn(
      `[hgbTaxonomie] Stichtag ${stichtag} liegt vor dem Support-Start ` +
        `(2023). Fallback auf 6.8 — Ausgabe ist nicht rechtssicher.`
    );
    return "6.8";
  }
  if (jahr === 2023) return "6.6";
  if (jahr === 2024) return "6.7";
  if (jahr === 2025) return "6.8";

  // jahr >= 2026
  const v69 = HGB_TAXONOMIE_VERSIONEN["6.9"];
  if (v69.status === "stable") return "6.9";
  // eslint-disable-next-line no-console
  console.warn(
    `[hgbTaxonomie] Stichtag ${stichtag} erwartet 6.9, Version aber noch ` +
      `nicht als stable markiert (Status="${v69.status}"). Fallback auf 6.8.`
  );
  return "6.8";
}

/**
 * Liefert vollstaendige Metadata fuer eine Version — praktisch, wenn im
 * PDF-Footer oder in der Exporter-Meta der BMF-Quellen-Link
 * mit ausgegeben werden soll.
 */
export function getTaxonomieMetadata(
  version: HgbTaxonomieVersion
): TaxonomieMetadata {
  return HGB_TAXONOMIE_VERSIONEN[version];
}
