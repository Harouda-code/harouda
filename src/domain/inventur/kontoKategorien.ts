/**
 * Konto-Kategorien fuer das Inventur-Modul (Sprint 17 / Schritt 3).
 *
 * Zentrale Range-Definitionen pro SKR-Kontenrahmen fuer:
 *   - Vorraete-Konten (Bestands-Inventur-Dropdown).
 *   - Bestandsveraenderungs-Konten (Delta-Buchungs-Dropdown).
 *   - Aufwands-Konten fuer Anlagen-Abgang (ausserordentlicher
 *     Aufwand bei Verlust/Schaden).
 *
 * WICHTIG: Kein hart codiertes Konto. Die Helper liefern nur die
 * KANDIDATEN — der Buchhalter waehlt aus der Dropdown das konkrete
 * Unter-Konto (Rohstoffe vs. Handelswaren vs. Fertigerzeugnisse).
 * Siehe UI-Hinweis in der InventurPage.
 */
import type { Account } from "../../types/db";

export type Kontenrahmen = "SKR03" | "SKR04";

type Range = { start: string; end: string; label: string };

/**
 * Vorraete-Konten-Ranges.
 *
 * SKR04: 1000-1199 Vorraete inkl. Waren.
 * SKR03: Waren-/Vorraete-Konten aus Klasse 3 + Bestands-Konto-Bereich
 * aus Klasse 0 (0980 = Bestandsvorrat). Die Konkretion je Mandant
 * (Rohstoffe, Hilfsstoffe, Handelswaren) ergibt sich aus dem
 * tatsaechlich angelegten SKR-Seed.
 */
export const VORRAT_KONTO_RANGES: Record<Kontenrahmen, Range[]> = {
  SKR04: [
    { start: "1000", end: "1099", label: "Vorraete (Roh/Hilfs/Betriebsstoffe)" },
    { start: "1100", end: "1199", label: "Waren" },
  ],
  SKR03: [
    { start: "0980", end: "0999", label: "Vorraete (Bilanz-Aktiv)" },
    { start: "3000", end: "3999", label: "Wareneingang / Material (historisch Vorraete)" },
  ],
};

/**
 * Bestandsveraenderungs-Konten.
 *
 * SKR04: 4800-4899 Fertigerzeugnis-Bestandsveraenderung,
 *        5100-5199 Roh-/Hilfs-/Betriebsstoff-Veraenderung.
 * SKR03: 8980-8999 und 3960-3999 (historisch).
 */
export const BESTANDSVERAENDERUNG_KONTO_RANGES: Record<
  Kontenrahmen,
  Range[]
> = {
  SKR04: [
    { start: "4800", end: "4899", label: "Bestandsveraenderung Erzeugnisse" },
    { start: "5100", end: "5199", label: "Bestandsveraenderung Roh-/Hilfs-/Betriebsstoffe" },
  ],
  SKR03: [
    { start: "3960", end: "3999", label: "Bestandsveraenderungen Waren" },
    { start: "8980", end: "8999", label: "Bestandsveraenderungen (historisch)" },
  ],
};

/**
 * Ausserordentlicher Aufwand / sonstige betriebliche Aufwendungen —
 * Zielkonto fuer Abgangs-Buchung bei Verlust/Schaden.
 *
 * SKR04: 6900-6999 sonstige betr. Aufwendungen
 *        6500-6599 ausserordentliche Aufwendungen
 * SKR03: 4960-4999 sonstige betr. Aufwendungen
 *        2400-2499 ausserordentliche Aufwendungen
 */
export const AUSSERORDENTLICHER_AUFWAND_RANGES: Record<
  Kontenrahmen,
  Range[]
> = {
  SKR04: [
    { start: "6500", end: "6599", label: "Ausserordentliche Aufwendungen" },
    { start: "6900", end: "6999", label: "Sonstige betr. Aufwendungen" },
  ],
  SKR03: [
    { start: "2400", end: "2499", label: "Ausserordentliche Aufwendungen" },
    { start: "4960", end: "4999", label: "Sonstige betr. Aufwendungen" },
  ],
};

function isInRange(kontoNr: string, ranges: Range[]): boolean {
  // Lexikographischer Vergleich ist sicher, da beide Strings
  // ausschliesslich aus Ziffern bestehen und gleiche Laenge haben
  // (4 Stellen im SKR03/04-Mainstream). Bei abweichenden Laengen ist
  // der Vergleich immer noch deterministisch — eine 3-stellige
  // Kontonummer (etwa "980") waere out-of-range in allen hier
  // definierten 4-stelligen Ranges.
  for (const r of ranges) {
    if (kontoNr >= r.start && kontoNr <= r.end) return true;
  }
  return false;
}

function filterByRanges(
  accounts: Account[],
  kontenrahmen: Kontenrahmen,
  ranges: Record<Kontenrahmen, Range[]>
): Account[] {
  const set = ranges[kontenrahmen];
  return accounts
    .filter((a) => a.is_active)
    .filter((a) => a.skr === kontenrahmen)
    .filter((a) => isInRange(a.konto_nr, set));
}

export function filterVorratAccounts(
  accounts: Account[],
  kontenrahmen: Kontenrahmen
): Account[] {
  return filterByRanges(accounts, kontenrahmen, VORRAT_KONTO_RANGES);
}

export function filterBestandsveraenderungAccounts(
  accounts: Account[],
  kontenrahmen: Kontenrahmen
): Account[] {
  return filterByRanges(
    accounts,
    kontenrahmen,
    BESTANDSVERAENDERUNG_KONTO_RANGES
  );
}

export function filterAusserordentlicherAufwandAccounts(
  accounts: Account[],
  kontenrahmen: Kontenrahmen
): Account[] {
  return filterByRanges(
    accounts,
    kontenrahmen,
    AUSSERORDENTLICHER_AUFWAND_RANGES
  );
}

/**
 * Heuristik: welcher Kontenrahmen ist fuer diesen Mandanten/Account-
 * Satz dominant? Default SKR03, weil das Demo-Seed SKR03 ist. Wenn
 * SKR04-Accounts ueberwiegen, wird SKR04 zurueckgegeben + warning.
 */
export function detectDominantKontenrahmen(
  accounts: Account[]
): { kontenrahmen: Kontenrahmen; warning?: string } {
  const active = accounts.filter((a) => a.is_active);
  const skr03 = active.filter((a) => a.skr === "SKR03").length;
  const skr04 = active.filter((a) => a.skr === "SKR04").length;
  if (skr03 === 0 && skr04 === 0) {
    return {
      kontenrahmen: "SKR03",
      warning: "Keine aktiven Accounts — SKR03 als Default.",
    };
  }
  if (skr04 > skr03) return { kontenrahmen: "SKR04" };
  if (skr03 > skr04) return { kontenrahmen: "SKR03" };
  // Mix: konservativ SKR03.
  return {
    kontenrahmen: "SKR03",
    warning: `Gleiche Anzahl SKR03 (${skr03}) und SKR04 (${skr04}) — SKR03 als Default.`,
  };
}
