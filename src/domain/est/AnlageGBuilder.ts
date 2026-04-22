/**
 * AnlageG-Builder — Einkünfte aus Gewerbebetrieb (§ 15 EStG).
 *
 * Baut aus Journal-Entries + Accounts + Wirtschaftsjahr-Range ein
 * Summen-Objekt, dessen Keys den FormSpec-Feld-Keys in AnlageGPage
 * entsprechen. Das zentrale Mapping liegt in
 * `src/domain/est/skr03AnlagenMapping.ts` (Schritt 4). Bewusst schlank
 * gehalten: keine Kz-Normalisierung, keine Kleinunternehmer-Logik,
 * kein 70/30-Bewirtungs-Split — Letzteres passiert im UI-Layer mit
 * dem gelieferten Brutto-Wert.
 *
 * Pattern entspricht `src/domain/euer/EuerBuilder.ts`, arbeitet aber
 * auf `number` statt `Money` (passt zum Page-State der ESt-Forms).
 */

import type { Account, JournalEntry } from "../../types/db";
import {
  filterEntriesInYear,
  computeKontoSaldi,
  resolveFieldForAccount,
} from "./anlagenUtils";

export type AnlageGOptions = {
  accounts: Account[];
  entries: JournalEntry[];
  wirtschaftsjahr: { von: string; bis: string };
  /** Smart-Banner-Sprint: Simulation-Mode. Default `false` = nur
   *  festgeschriebene Buchungen (GoBD-Kern). `true` = Entwürfe
   *  werden auch aggregiert (nur UI-Vorschau, kein Export erlaubt). */
  includeDraft?: boolean;
};

export type AnlageGSummen = Record<string, number>;

export type AnlageGLineView = {
  konto_nr: string;
  konto_name: string;
  feld: string;
  betrag: number;
  soll: number;
  haben: number;
  saldo: number;
};

export type AnlageGReport = {
  summen: AnlageGSummen;
  positionen: AnlageGLineView[];
  /** Konten mit Buchungen im Zeitraum, aber ohne Mapping-Regel in
   *  AnlageG. Konsumenten können das im UI als „nicht automatisch
   *  zugeordnet" anzeigen; Kontext: AnlageG bildet nur § 15-Relevantes
   *  ab, Zinsen/USt-Konten etc. sind erwartungsgemäß ungemappt. */
  unmappedAccounts: string[];
  /** Smart-Banner-Sprint: Anzahl Entwurfs-Einträge im Zeitraum, die
   *  AnlageG-relevante Konten berühren (Soll oder Haben). UNABHÄNGIG
   *  von `includeDraft` — als Signal für den UI-Banner, auch wenn der
   *  Builder aktuell im GoBD-Default läuft. */
  draftCount: number;
};

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export function buildAnlageG(options: AnlageGOptions): AnlageGReport {
  const entriesInYear = filterEntriesInYear(
    options.entries,
    options.wirtschaftsjahr,
    options.includeDraft
  );
  const saldi = computeKontoSaldi(options.accounts, entriesInYear);

  // draftCount: Signal für den UI-Banner — zählt Entwürfe im Zeitraum,
  // die AnlageG-relevante Konten berühren, unabhängig vom Builder-Modus.
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

  const summen: AnlageGSummen = {};
  const positionen: AnlageGLineView[] = [];
  const unmappedAccounts: string[] = [];

  for (const saldo of saldi) {
    // Null-Salden (kein Traffic auf dem Konto) überspringen.
    if (saldo.soll === 0 && saldo.haben === 0) continue;
    // Nicht-numerische Kontonummern (z. B. Dummy-Strings) überspringen.
    if (!Number.isFinite(Number(saldo.konto_nr))) continue;

    // Phase 3 / Schritt 7: Feld-Resolution primär über `account.tags`;
    // Legacy-Konten ohne Tags fallen auf Range-Mapping zurück (mit
    // console.warn).
    const feld = resolveFieldForAccount(saldo.account, "anlage-g");
    if (feld === null) {
      unmappedAccounts.push(saldo.konto_nr);
      continue;
    }

    // Betrags-Sign ergibt sich aus der intrinsischen Konto-Natur.
    // `aktiva`/`passiva` mit Tag sind untypisch (Bilanz-Konten gehören
    // nicht in Einkünfte-Anlagen) — defensiv behandelt wie Aufwand.
    const k = saldo.account.kategorie;
    let betrag: number;
    if (k === "ertrag") {
      betrag = round2(saldo.haben - saldo.soll);
    } else {
      betrag = round2(saldo.soll - saldo.haben);
    }
    // Bewirtung: Brutto-Betrag liefern. 70/30-Split (§ 4 Abs. 5 Nr. 2
    // EStG) gehört nicht in den Builder — die Page wendet die Regel
    // auf dem Summen-Wert an.
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
