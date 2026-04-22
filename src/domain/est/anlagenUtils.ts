/**
 * Shared-Helper für die AnlageG/S-Builder.
 *
 * Phase 3 / Schritt 5: `filterEntriesInYear`, `computeKontoSaldi`,
 *                     `valueForSource` (Range-basiert).
 * Phase 3 / Schritt 7: `resolveFieldForAccount` +
 *                      `resolveFieldForAccountDetailed` — Tag-basiertes
 *                      Lookup mit Range-Fallback. Builder lesen jetzt
 *                      Tags, Range-Mapping bleibt als Seed-Quelle +
 *                      Fallback für un-getagte Legacy-Konten erhalten.
 */

import type { Account, JournalEntry } from "../../types/db";
import { Money } from "../../lib/money/Money";
import {
  findAnlagenRules,
  type AnlagenSource,
  type AnlageFormId,
} from "./skr03AnlagenMapping";

export type KontoSaldo = {
  konto_nr: string;
  konto_name: string;
  soll: number;
  haben: number;
  /** soll − haben (raw Accounting-Saldo, Kategorie-neutral). */
  saldo: number;
  /** Phase 3 / Schritt 7: volle Account-Referenz, damit der Builder
   *  `kategorie` (für Betrags-Sign) und `tags` (für Feld-Resolution)
   *  erreicht, ohne einen zweiten Lookup durchzuführen. */
  account: Account;
};

/**
 * Filtert Journal-Einträge auf einen Wirtschaftsjahr-Zeitraum.
 * `YYYY-MM-DD`-Strings sind lexikografisch vergleichbar — kein
 * Date-Parsing nötig.
 *
 * Smart-Banner-Sprint: `includeDraft` (default false) ist der
 * Simulation-Mode-Hebel. GoBD-Default (`false`) liefert ausschließlich
 * festgeschriebene Buchungen; `true` schließt `"entwurf"` ein.
 */
export function filterEntriesInYear(
  entries: JournalEntry[],
  wirtschaftsjahr: { von: string; bis: string },
  includeDraft = false
): JournalEntry[] {
  return entries.filter((e) => {
    if (e.datum < wirtschaftsjahr.von || e.datum > wirtschaftsjahr.bis) {
      return false;
    }
    if (includeDraft) {
      return e.status === "gebucht" || e.status === "entwurf";
    }
    return e.status === "gebucht";
  });
}

export function computeKontoSaldi(
  accounts: Account[],
  entries: JournalEntry[]
): KontoSaldo[] {
  const accByNr = new Map(accounts.map((a) => [a.konto_nr, a]));
  const sums = new Map<string, { soll: Money; haben: Money }>();
  for (const a of accounts) {
    if (!a.is_active) continue;
    sums.set(a.konto_nr, { soll: Money.zero(), haben: Money.zero() });
  }
  for (const e of entries) {
    const betrag = new Money(Number.isFinite(e.betrag) ? e.betrag : 0);
    const sollEntry = sums.get(e.soll_konto);
    if (sollEntry) sollEntry.soll = sollEntry.soll.plus(betrag);
    const habenEntry = sums.get(e.haben_konto);
    if (habenEntry) habenEntry.haben = habenEntry.haben.plus(betrag);
  }
  const result: KontoSaldo[] = [];
  for (const [nr, s] of sums) {
    const account = accByNr.get(nr);
    if (!account) continue;
    const saldo = s.soll.minus(s.haben);
    result.push({
      konto_nr: nr,
      konto_name: account.bezeichnung,
      soll: Number(s.soll.toFixed2()),
      haben: Number(s.haben.toFixed2()),
      saldo: Number(saldo.toFixed2()),
      account,
    });
  }
  return result;
}

/**
 * Legacy-Helper aus Schritt 5 — bleibt erhalten, damit externer Code
 * nicht unvermittelt bricht. Neuer Code sollte die kategorie-basierte
 * Sign-Bestimmung im Builder nutzen.
 */
export function valueForSource(
  source: AnlagenSource,
  soll: number,
  haben: number
): number {
  const raw = source === "EINNAHME" ? haben - soll : soll - haben;
  return Math.round(raw * 100) / 100;
}

// ---------------------------------------------------------------------------
// Phase 3 / Schritt 7 — Tag-basierte Feld-Resolution mit Range-Fallback
// ---------------------------------------------------------------------------

export type FieldResolution = {
  field: string | null;
  source: "tags" | "range-fallback" | "none";
};

/**
 * Detailliertes Lookup: gibt das Ziel-Feld für die Anlage zurück UND die
 * Quelle (Tags vs. Range-Fallback vs. unmapped). Der Builder nutzt heute
 * nur `resolveFieldForAccount`; die Detailinfo ist für einen späteren
 * Audit-Trail im Report-Output vorbereitet (Schritt 8+).
 *
 * Semantik:
 *   • `account.tags` null/undefined        → Range-Fallback, console.warn.
 *   • `account.tags` leer oder ohne Match  → strict `null`.
 *   • `account.tags` mit 1 Match für Anlage → `"tags"`, Feld = Teil nach `:`.
 *   • `account.tags` mit ≥2 Match für Anlage → `"tags"`, erster gewinnt,
 *                                              console.warn.
 */
export function resolveFieldForAccountDetailed(
  account: Account,
  anlage: AnlageFormId
): FieldResolution {
  const tags = account.tags;
  if (tags === null || tags === undefined) {
    const rules = findAnlagenRules(account.konto_nr, anlage);
    if (rules.length === 0) return { field: null, source: "none" };
    // eslint-disable-next-line no-console
    console.warn(
      `[ESt-Anlagen] Konto ${account.konto_nr} (${account.bezeichnung}) ohne tags — Fallback auf Range-Mapping. Bitte Kontenplan migrieren (Migration 0029).`
    );
    return { field: rules[0].feld, source: "range-fallback" };
  }
  const prefix = `${anlage}:`;
  const matches = tags.filter((t) => t.startsWith(prefix));
  if (matches.length === 0) return { field: null, source: "none" };
  if (matches.length > 1) {
    // eslint-disable-next-line no-console
    console.warn(
      `[ESt-Anlagen] Konto ${account.konto_nr} hat mehrere Tags für ${anlage}: ${matches.join(", ")}. Erster gewinnt: "${matches[0]}".`
    );
  }
  const field = matches[0].slice(prefix.length);
  return { field, source: "tags" };
}

export function resolveFieldForAccount(
  account: Account,
  anlage: AnlageFormId
): string | null {
  return resolveFieldForAccountDetailed(account, anlage).field;
}
