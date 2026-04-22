/**
 * AnlageS-Builder — Einkünfte aus selbständiger Arbeit (§ 18 EStG).
 *
 * Strukturell identisch zu AnlageGBuilder; unterschiedlich ist nur der
 * Anlagen-Filter (`"anlage-s"`) und damit die gemappten Feld-Keys
 * (`honorare` statt `umsaetze`, `reisen`/`fortbildung`/`versicherung`
 * statt `werbung`/`bewirtung` etc.) gemäss
 * `src/domain/est/skr03AnlagenMapping.ts`.
 *
 * Duplikation zu AnlageGBuilder bewusst akzeptiert — eine generische
 * `buildAnlage(anlage, options)`-Abstraktion wäre in Phase 3 ein
 * Vorgriff; Konsolidierung ist Folge-Aufgabe, wenn mehr als 2 Anlagen
 * journal-angeschlossen werden.
 */

import type { Account, JournalEntry } from "../../types/db";
import {
  filterEntriesInYear,
  computeKontoSaldi,
  resolveFieldForAccount,
} from "./anlagenUtils";

export type AnlageSOptions = {
  accounts: Account[];
  entries: JournalEntry[];
  wirtschaftsjahr: { von: string; bis: string };
  /** Smart-Banner-Sprint: Simulation-Mode (analog AnlageG). */
  includeDraft?: boolean;
};

export type AnlageSSummen = Record<string, number>;

export type AnlageSLineView = {
  konto_nr: string;
  konto_name: string;
  feld: string;
  betrag: number;
  soll: number;
  haben: number;
  saldo: number;
};

export type AnlageSReport = {
  summen: AnlageSSummen;
  positionen: AnlageSLineView[];
  unmappedAccounts: string[];
  /** Smart-Banner-Sprint: Entwurfs-Count-Signal für den UI-Banner. */
  draftCount: number;
};

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export function buildAnlageS(options: AnlageSOptions): AnlageSReport {
  const entriesInYear = filterEntriesInYear(
    options.entries,
    options.wirtschaftsjahr,
    options.includeDraft
  );
  const saldi = computeKontoSaldi(options.accounts, entriesInYear);

  const anlageAccounts = new Set<string>();
  for (const a of options.accounts) {
    if (!a.is_active) continue;
    anlageAccounts.add(a.konto_nr);
  }
  const draftCount = options.entries.filter(
    (e) =>
      e.status === "entwurf" &&
      e.datum >= options.wirtschaftsjahr.von &&
      e.datum <= options.wirtschaftsjahr.bis &&
      (anlageAccounts.has(e.soll_konto) || anlageAccounts.has(e.haben_konto))
  ).length;

  const summen: AnlageSSummen = {};
  const positionen: AnlageSLineView[] = [];
  const unmappedAccounts: string[] = [];

  for (const saldo of saldi) {
    if (saldo.soll === 0 && saldo.haben === 0) continue;
    if (!Number.isFinite(Number(saldo.konto_nr))) continue;

    // Phase 3 / Schritt 7: Tag-basierte Feld-Resolution + Fallback.
    const feld = resolveFieldForAccount(saldo.account, "anlage-s");
    if (feld === null) {
      unmappedAccounts.push(saldo.konto_nr);
      continue;
    }

    const k = saldo.account.kategorie;
    let betrag: number;
    if (k === "ertrag") {
      betrag = round2(saldo.haben - saldo.soll);
    } else {
      betrag = round2(saldo.soll - saldo.haben);
    }
    summen[feld] = round2((summen[feld] ?? 0) + betrag);
    positionen.push({
      konto_nr: saldo.konto_nr,
      konto_name: saldo.konto_name,
      feld,
      betrag,
      soll: saldo.soll,
      haben: saldo.haben,
      saldo: saldo.saldo,
    });
  }

  return { summen, positionen, unmappedAccounts, draftCount };
}
