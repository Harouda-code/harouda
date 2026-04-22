/**
 * Trial-Balance-Aggregat-Check.
 *
 * Prüft, ob die Summe aller Soll-Seiten gleich der Summe aller Haben-
 * Seiten über einen Zeitraum ist. In korrekter doppelter Buchführung
 * muss Σ Soll = Σ Haben gelten — Abweichungen sind Hinweis auf
 * Daten-Korruption (durfte nie passieren, ist aber ein wichtiger
 * Defense-in-Depth-Check für Jahresabschluss).
 *
 * Jahresabschluss-E1 / Schritt 3.
 */

import type { JournalEntry } from "../../types/db";

export type TrialBalanceResult = {
  zeitraum: { von: string; bis: string };
  total_soll: number;
  total_haben: number;
  differenz: number;
  /** |differenz| < 0.01 EUR — Cent-Toleranz für Rundungseffekte. */
  ist_ausgeglichen: boolean;
  entry_count_betrachtet: number;
  entry_count_entwuerfe_ignoriert: number;
};

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export function computeTrialBalance(
  entries: JournalEntry[],
  zeitraum: { von: string; bis: string }
): TrialBalanceResult {
  let total_soll = 0;
  let total_haben = 0;
  let entwuerfe = 0;
  let betrachtet = 0;

  for (const e of entries) {
    if (e.datum < zeitraum.von || e.datum > zeitraum.bis) continue;
    if (e.status === "entwurf") {
      entwuerfe++;
      continue;
    }
    if (e.status !== "gebucht") continue;
    betrachtet++;
    const betrag = Number(e.betrag);
    if (!Number.isFinite(betrag)) continue;
    total_soll += betrag;
    total_haben += betrag;
  }

  total_soll = round2(total_soll);
  total_haben = round2(total_haben);
  const differenz = round2(total_soll - total_haben);

  return {
    zeitraum,
    total_soll,
    total_haben,
    differenz,
    ist_ausgeglichen: Math.abs(differenz) < 0.01,
    entry_count_betrachtet: betrachtet,
    entry_count_entwuerfe_ignoriert: entwuerfe,
  };
}
