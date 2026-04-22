/**
 * § 267 HGB — Klassifikator für Größenklassen (Kleinst/Klein/Mittel/Groß).
 *
 * Rechtsbasis: § 267 HGB i. V. m. den durch BGBl. I 2024 angepassten
 * Schwellenwerten (Bilanzsumme, Umsatzerlöse, Arbeitnehmer im Jahres-
 * durchschnitt).
 *
 * Regel (§ 267 Abs. 1-3 HGB): eine Größenklasse gilt als erfüllt, wenn
 * mindestens 2 der 3 Kriterien an ZWEI aufeinanderfolgenden Stichtagen
 * unterschritten werden. Dieses Modul klassifiziert nur für EINEN
 * Stichtag — die Mehrperioden-Regel ist Teil des E2-Sprints.
 *
 * Jahresabschluss-E1 / Schritt 2.
 */

/** Schwellenwerte § 267 HGB (Stand 2025 nach BGBl. I 2024 angepasst). */
export const HGB267_SCHWELLENWERTE_2025 = {
  kleinst: {
    bilanzsumme: 450_000,
    umsatzerloese: 900_000,
    arbeitnehmer_durchschnitt: 10,
  },
  klein: {
    bilanzsumme: 7_500_000,
    umsatzerloese: 15_000_000,
    arbeitnehmer_durchschnitt: 50,
  },
  mittel: {
    bilanzsumme: 25_000_000,
    umsatzerloese: 50_000_000,
    arbeitnehmer_durchschnitt: 250,
  },
} as const;

export type Hgb267Kriterium = {
  bilanzsumme: number;
  umsatzerloese: number;
  arbeitnehmer_durchschnitt: number;
};

export type Hgb267Klasse = "kleinst" | "klein" | "mittel" | "gross";

export type Hgb267Klassifikation = {
  klasse: Hgb267Klasse;
  /** Anzahl erfüllter Kriterien (0-3) für die bestimmte Klasse. */
  erfuellte_kriterien: number;
  /** `true`, wenn ≥ 2 von 3 Kriterien erfüllt — § 267-Regel für einen
   *  Stichtag. Für die vollständige Pflicht-Klassifikation braucht es
   *  einen zweiten Stichtag (Mehrperioden-Regel im E2-Sprint). */
  gilt_als_erfuellt: boolean;
  schwellenwerte_verwendet: typeof HGB267_SCHWELLENWERTE_2025;
  /** Menschenlesbare Begründung für Audit-Trail + UI-Anzeige. */
  begruendung: string[];
};

/**
 * Klassifikation für einen Stichtag.
 *
 * Algorithmus:
 *   1. Prüfe Kleinst-Schwellen: wenn ≥ 2 Kriterien ≤ Kleinst-Schwelle
 *      → "kleinst".
 *   2. Sonst prüfe Klein-Schwellen (Kriterium ≤ Klein-Schwelle):
 *      wenn ≥ 2 Kriterien → "klein".
 *   3. Sonst prüfe Mittel-Schwellen: wenn ≥ 2 Kriterien ≤ Mittel
 *      → "mittel".
 *   4. Sonst "gross".
 *
 * `gilt_als_erfuellt` ist `true`, wenn die gefundene Klasse mit
 * ≥ 2 von 3 erfüllten Kriterien unterlegt ist. Für "gross" ist sie
 * definitionsgemäß immer `true` (= kein Schwellenwert-Fallback).
 */
export function classifyHgb267(
  kriterium: Hgb267Kriterium
): Hgb267Klassifikation {
  const begruendung: string[] = [];

  // Kriterium-Checks: wie viele der 3 Werte liegen unter der Schwelle?
  const unterOrGleich = (
    grenzen: { bilanzsumme: number; umsatzerloese: number; arbeitnehmer_durchschnitt: number }
  ) => {
    let count = 0;
    if (kriterium.bilanzsumme <= grenzen.bilanzsumme) count++;
    if (kriterium.umsatzerloese <= grenzen.umsatzerloese) count++;
    if (kriterium.arbeitnehmer_durchschnitt <= grenzen.arbeitnehmer_durchschnitt)
      count++;
    return count;
  };

  const kKleinst = unterOrGleich(HGB267_SCHWELLENWERTE_2025.kleinst);
  if (kKleinst >= 2) {
    begruendung.push(
      `Kleinst-Klassifikation: ${kKleinst}/3 Kriterien unter den Kleinst-Schwellenwerten.`
    );
    return {
      klasse: "kleinst",
      erfuellte_kriterien: kKleinst,
      gilt_als_erfuellt: true,
      schwellenwerte_verwendet: HGB267_SCHWELLENWERTE_2025,
      begruendung,
    };
  }

  const kKlein = unterOrGleich(HGB267_SCHWELLENWERTE_2025.klein);
  if (kKlein >= 2) {
    begruendung.push(
      `Klein-Klassifikation: ${kKlein}/3 Kriterien unter den Klein-Schwellenwerten.`
    );
    return {
      klasse: "klein",
      erfuellte_kriterien: kKlein,
      gilt_als_erfuellt: true,
      schwellenwerte_verwendet: HGB267_SCHWELLENWERTE_2025,
      begruendung,
    };
  }

  const kMittel = unterOrGleich(HGB267_SCHWELLENWERTE_2025.mittel);
  if (kMittel >= 2) {
    begruendung.push(
      `Mittel-Klassifikation: ${kMittel}/3 Kriterien unter den Mittel-Schwellenwerten.`
    );
    return {
      klasse: "mittel",
      erfuellte_kriterien: kMittel,
      gilt_als_erfuellt: true,
      schwellenwerte_verwendet: HGB267_SCHWELLENWERTE_2025,
      begruendung,
    };
  }

  begruendung.push(
    `Groß-Klassifikation: weniger als 2 Kriterien unter den Mittel-Schwellen (${kMittel}/3).`
  );
  return {
    klasse: "gross",
    erfuellte_kriterien: 3 - kMittel, // Anzahl der Kriterien ÜBER Mittel-Schwelle
    gilt_als_erfuellt: true,
    schwellenwerte_verwendet: HGB267_SCHWELLENWERTE_2025,
    begruendung,
  };
}

// ---------------------------------------------------------------------------
// Hilfs-Anbindung an Journal-Daten. NICHT aus `classifyHgb267` selbst
// gerufen — der Page-Layer baut das Kriterium und ruft dann classify.
// ---------------------------------------------------------------------------

import type { Account, JournalEntry } from "../../types/db";
import { buildBalanceSheet } from "./BalanceSheetBuilder";

/**
 * Baut aus Accounts + Entries + Arbeitnehmer-Zahl ein
 * `Hgb267Kriterium`. Bilanzsumme aus `buildBalanceSheet.aktivaSum`,
 * Umsatzerlöse als Summe der 8100-8599-Ertrags-Konten, Arbeitnehmer-
 * Durchschnitt vom Caller (employees-Query ist Page-Logik).
 */
export function computeKriteriumFromJournal(
  accounts: Account[],
  entries: JournalEntry[],
  stichtag: string,
  employeesCount: number
): Hgb267Kriterium {
  const bilanz = buildBalanceSheet(accounts, entries, { stichtag });
  const bilanzsumme = Number(bilanz.aktivaSum);

  // Umsatzerlöse: Konten 8100-8599 (Ertrag-Ranges aus
  // src/domain/accounting/skr03GuvMapping). Lexikografisch-sicher via
  // Number()-Cast + Range-Check.
  const periodStart = `${stichtag.slice(0, 4)}-01-01`;
  const entriesInYear = entries.filter(
    (e) =>
      e.status === "gebucht" && e.datum >= periodStart && e.datum <= stichtag
  );
  const umsatzKonten = new Set<string>();
  for (const a of accounts) {
    if (!a.is_active) continue;
    const n = Number(a.konto_nr);
    if (Number.isFinite(n) && n >= 8100 && n <= 8599) {
      umsatzKonten.add(a.konto_nr);
    }
  }
  let umsatzerloese = 0;
  for (const e of entriesInYear) {
    if (umsatzKonten.has(e.haben_konto)) umsatzerloese += Number(e.betrag);
    if (umsatzKonten.has(e.soll_konto)) umsatzerloese -= Number(e.betrag);
  }
  return {
    bilanzsumme: Number.isFinite(bilanzsumme) ? bilanzsumme : 0,
    umsatzerloese: Math.round(umsatzerloese * 100) / 100,
    arbeitnehmer_durchschnitt: employeesCount,
  };
}
