import type { Account, JournalEntry } from "../types/db";
import {
  EUER_ZEILEN,
  loadMappingOverrides,
  mapKontoToEuerZeileWithOverrides,
} from "../data/euerMapping";
import type { PeriodFilter } from "./reports";
import { filterByPeriod } from "./reports";

export type EuerLine = {
  zeile: number;
  label: string;
  section: "einnahmen" | "ausgaben";
  betrag: number;
  /** Belege (Kontonummern), aus denen der Betrag stammt */
  quellen: { konto_nr: string; bezeichnung: string; betrag: number }[];
};

export type EuerReport = {
  period: PeriodFilter;
  lines: EuerLine[];
  summeEinnahmen: number;
  summeAusgaben: number;
  gewinn: number;
};

/**
 * Baut eine Anlage-EÜR aus den Journalbuchungen. Bei Konten mit USt-Satz
 * wird der Brutto-Betrag in Netto (für Zeile 12 / Ausgabenzeilen mit
 * treatAsNet) und USt-Anteil (für Zeile 14 bzw. Zeile 46) zerlegt.
 */
export function buildEuer(
  entries: JournalEntry[],
  accounts: Account[],
  period: PeriodFilter,
  clientId: string | null,
  overrides?: Record<string, number>
): EuerReport {
  const filtered = filterByPeriod(entries, period, clientId);
  const mapping = overrides ?? loadMappingOverrides();
  const accountByNr = new Map(accounts.map((a) => [a.konto_nr, a]));
  const zeileTotals = new Map<number, number>();
  const zeileQuellen = new Map<
    number,
    Map<string, { bezeichnung: string; betrag: number }>
  >();

  function add(
    zeile: number,
    konto_nr: string,
    betrag: number,
    bezeichnung: string
  ) {
    if (betrag === 0) return;
    zeileTotals.set(zeile, (zeileTotals.get(zeile) ?? 0) + betrag);
    let q = zeileQuellen.get(zeile);
    if (!q) {
      q = new Map();
      zeileQuellen.set(zeile, q);
    }
    const prev = q.get(konto_nr);
    q.set(konto_nr, {
      bezeichnung: prev?.bezeichnung ?? bezeichnung,
      betrag: (prev?.betrag ?? 0) + betrag,
    });
  }

  const zeileMap = new Map(EUER_ZEILEN.map((z) => [z.zeile, z]));

  for (const e of filtered) {
    const sollAcc = accountByNr.get(e.soll_konto);
    const habenAcc = accountByNr.get(e.haben_konto);
    const gross = Number(e.betrag);

    // --- Ertragsseite (Haben = Ertrag) ---
    if (habenAcc?.kategorie === "ertrag") {
      const zeile = mapKontoToEuerZeileWithOverrides(habenAcc.konto_nr, mapping);
      if (zeile == null) continue;
      const spec = zeileMap.get(zeile);
      if (spec?.treatAsNet && habenAcc.ust_satz) {
        const rate = habenAcc.ust_satz / 100;
        const net = gross / (1 + rate);
        const ust = gross - net;
        add(zeile, habenAcc.konto_nr, net, habenAcc.bezeichnung);
        add(14, habenAcc.konto_nr, ust, `USt-Anteil ${habenAcc.konto_nr}`);
      } else {
        add(zeile, habenAcc.konto_nr, gross, habenAcc.bezeichnung);
      }
      continue;
    }

    // --- Ausgabenseite (Soll = Aufwand) ---
    if (sollAcc?.kategorie === "aufwand") {
      const zeile = mapKontoToEuerZeileWithOverrides(sollAcc.konto_nr, mapping);
      if (zeile == null) continue;
      const spec = zeileMap.get(zeile);
      if (spec?.treatAsNet && sollAcc.ust_satz) {
        const rate = sollAcc.ust_satz / 100;
        const net = gross / (1 + rate);
        const vorsteuer = gross - net;
        add(zeile, sollAcc.konto_nr, net, sollAcc.bezeichnung);
        add(46, sollAcc.konto_nr, vorsteuer, `Vorsteuer ${sollAcc.konto_nr}`);
      } else {
        add(zeile, sollAcc.konto_nr, gross, sollAcc.bezeichnung);
      }
      continue;
    }

    // --- Spezialfälle: Aktiva mit Vorsteuer (z. B. Anlagenkauf) ---
    if (sollAcc?.kategorie === "aktiva" && sollAcc.ust_satz) {
      const rate = sollAcc.ust_satz / 100;
      const vorsteuer = gross - gross / (1 + rate);
      add(46, sollAcc.konto_nr, vorsteuer, `Vorsteuer ${sollAcc.konto_nr}`);
    }
  }

  const lines: EuerLine[] = EUER_ZEILEN.map((z) => ({
    zeile: z.zeile,
    label: z.label,
    section: z.section,
    betrag: zeileTotals.get(z.zeile) ?? 0,
    quellen: Array.from(zeileQuellen.get(z.zeile)?.entries() ?? []).map(
      ([konto_nr, v]) => ({
        konto_nr,
        bezeichnung: v.bezeichnung,
        betrag: v.betrag,
      })
    ),
  }));

  const summeEinnahmen = lines
    .filter((l) => l.section === "einnahmen")
    .reduce((s, l) => s + l.betrag, 0);
  const summeAusgaben = lines
    .filter((l) => l.section === "ausgaben")
    .reduce((s, l) => s + l.betrag, 0);

  return {
    period,
    lines,
    summeEinnahmen,
    summeAusgaben,
    gewinn: summeEinnahmen - summeAusgaben,
  };
}
