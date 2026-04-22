/**
 * Phase 3 / Schritt 5b — On-Demand-Import für AnlageN aus dem
 * Lohn-Archiv (`lohnabrechnungen_archiv`).
 *
 * Use-Case: Gesellschafter-Geschäftsführer der eigenen GmbH lässt sich
 * per Button die Brutto-Lohn-Werte seiner vom System berechneten
 * Abrechnungen als Feld-Vorschlag in Anlage N geben. Kein automatischer
 * Pull — Schritt 7 wired den Button; dieses Modul ist reine Aggregation.
 *
 * Abgrenzung zu AnlageG/S-Buildern:
 *   - Quelle: `lohnabrechnungen_archiv`, NICHT `journal_entries`.
 *   - Pro Employee, NICHT pro Mandant-Aggregat.
 *   - Ein-Weg-Schuss, kein Auto-Refresh, kein Journal-Durchgriff.
 *
 * Feld-Mapping — wichtige Abweichung von der naiven Spec-Annahme:
 * die Archiv-Row hat `gesamt_brutto` + `gesamt_netto` als direkte
 * Aggregate, der per-Abzugs-Breakdown liegt aber nur im
 * `abrechnung_json`-Snapshot (Keys `abzuege.lohnsteuer`,
 * `abzuege.solidaritaetszuschlag`, …) als `toFixed2()`-Strings. Das
 * SV-AN-Gesamt ist nicht vorberechnet — wird hier als kv_an +
 * kv_zusatz_an + pv_an + rv_an + av_an summiert. Legacy-Rows ohne
 * `abrechnung_json` liefern 0 für alle Abzugs-Zwischensummen.
 */

import { AbrechnungArchivRepo } from "../../lib/db/lohnRepos";
import type { LohnabrechnungArchivRow } from "./../lohn/types";

export type ArchivEstImportOptions = {
  employeeId: string;
  jahr: number;
  clientId: string | null;
  companyId: string;
};

export type AnlageNVorschlag = {
  bruttoLohn: number;
  lohnsteuer: number;
  soliZuschlag: number;
  kirchensteuer: number;
  sv_an_gesamt: number;
  netto: number;
  /** Anzahl der aggregierten Archiv-Rows (Monate) des Ziel-Jahres. */
  abrechnungen_gefunden: number;
  jahr: number;
  employeeId: string;
};

export type ArchivEstImportResult =
  | { kind: "ok"; vorschlag: AnlageNVorschlag }
  | { kind: "empty"; reason: "no-archiv-rows"; jahr: number }
  | { kind: "error"; reason: "fetch-failed"; detail: string };

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/**
 * Liest einen Abzug-Teilbetrag aus `abrechnung_json.abzuege.<key>`.
 * Das Archiv serialisiert Money als `toFixed2()`-Strings (siehe
 * `serializeAbrechnung` in `lib/db/lohnRepos.ts`). Fehlende oder
 * ungültige Werte ergeben 0 (keine Exception).
 */
function readAbzugFromJson(
  abrechnungJson: Record<string, unknown> | null | undefined,
  key: string
): number {
  if (!abrechnungJson) return 0;
  const abzuege = abrechnungJson.abzuege as
    | Record<string, unknown>
    | undefined;
  if (!abzuege) return 0;
  const raw = abzuege[key];
  if (raw === undefined || raw === null) return 0;
  const n = typeof raw === "number" ? raw : parseFloat(String(raw));
  return Number.isFinite(n) ? n : 0;
}

function svAnGesamtFromJson(
  abrechnungJson: Record<string, unknown> | null | undefined
): number {
  return (
    readAbzugFromJson(abrechnungJson, "kv_an") +
    readAbzugFromJson(abrechnungJson, "kv_zusatz_an") +
    readAbzugFromJson(abrechnungJson, "pv_an") +
    readAbzugFromJson(abrechnungJson, "rv_an") +
    readAbzugFromJson(abrechnungJson, "av_an")
  );
}

export async function importAnlageNAusArchiv(
  options: ArchivEstImportOptions
): Promise<ArchivEstImportResult> {
  const repo = new AbrechnungArchivRepo();
  let rows: LohnabrechnungArchivRow[];
  try {
    rows = await repo.getForEmployee(options.employeeId, options.clientId);
  } catch (err) {
    return {
      kind: "error",
      reason: "fetch-failed",
      detail: err instanceof Error ? err.message : String(err),
    };
  }

  // Jahr-Filter: `abrechnungsmonat` ist `YYYY-MM`.
  const prefix = `${options.jahr}-`;
  const forYear = rows.filter((r) => r.abrechnungsmonat.startsWith(prefix));

  if (forYear.length === 0) {
    return {
      kind: "empty",
      reason: "no-archiv-rows",
      jahr: options.jahr,
    };
  }

  let bruttoLohn = 0;
  let lohnsteuer = 0;
  let soliZuschlag = 0;
  let kirchensteuer = 0;
  let sv_an_gesamt = 0;
  let netto = 0;

  for (const r of forYear) {
    bruttoLohn += r.gesamt_brutto ?? 0;
    netto += r.gesamt_netto ?? 0;
    lohnsteuer += readAbzugFromJson(r.abrechnung_json, "lohnsteuer");
    // Achtung: das Archiv-JSON verwendet `solidaritaetszuschlag`, nicht
    // `soli` wie die Spec-Skizze nannte. Hier auf den tatsächlichen Key
    // zugreifen.
    soliZuschlag += readAbzugFromJson(
      r.abrechnung_json,
      "solidaritaetszuschlag"
    );
    kirchensteuer += readAbzugFromJson(r.abrechnung_json, "kirchensteuer");
    // SV-AN-Gesamt ist im Archiv nicht vorberechnet — Summe aus den
    // fünf Einzelbeträgen kv_an/kv_zusatz_an/pv_an/rv_an/av_an.
    sv_an_gesamt += svAnGesamtFromJson(r.abrechnung_json);
  }

  return {
    kind: "ok",
    vorschlag: {
      bruttoLohn: round2(bruttoLohn),
      lohnsteuer: round2(lohnsteuer),
      soliZuschlag: round2(soliZuschlag),
      kirchensteuer: round2(kirchensteuer),
      sv_an_gesamt: round2(sv_an_gesamt),
      netto: round2(netto),
      abrechnungen_gefunden: forYear.length,
      jahr: options.jahr,
      employeeId: options.employeeId,
    },
  };
}

// ---------------------------------------------------------------------------
// Nacht-Modus (2026-04-21) · Schritt 2 — Anlage Vorsorge Import.
//
// SV-AN-Breakdown: wo AnlageN nur das Gesamt-sv_an_gesamt konsumiert,
// braucht Anlage Vorsorge die fünf Einzelbeträge für den § 10 Abs. 1
// Nr. 2a + Nr. 3 EStG-Abzug. Quelle bleibt derselbe Archiv-Snapshot
// (`abrechnung_json.abzuege.*`) — nur die Aggregation-Granularität
// ändert sich.
// ---------------------------------------------------------------------------

export type AnlageVorsorgeVorschlag = {
  /** § 10 Abs. 1 Nr. 3 EStG — Basis-KV-Beitrag des Arbeitnehmers. */
  kv_an_basis: number;
  /** Zusatzbeitrag (kassenspezifisch, oberhalb des Basis-Satzes). */
  kv_an_zusatz: number;
  /** Pflegeversicherung Arbeitnehmer. */
  pv_an: number;
  /** Rentenversicherung Arbeitnehmer. */
  rv_an: number;
  /** Arbeitslosenversicherung Arbeitnehmer. */
  av_an: number;
  abrechnungen_gefunden: number;
  jahr: number;
  employeeId: string;
};

export type AnlageVorsorgeImportResult =
  | { kind: "ok"; vorschlag: AnlageVorsorgeVorschlag }
  | { kind: "empty"; reason: "no-archiv-rows"; jahr: number }
  | { kind: "error"; reason: "fetch-failed"; detail: string };

export async function importAnlageVorsorgeAusArchiv(
  options: ArchivEstImportOptions
): Promise<AnlageVorsorgeImportResult> {
  const repo = new AbrechnungArchivRepo();
  let rows: LohnabrechnungArchivRow[];
  try {
    rows = await repo.getForEmployee(options.employeeId, options.clientId);
  } catch (err) {
    return {
      kind: "error",
      reason: "fetch-failed",
      detail: err instanceof Error ? err.message : String(err),
    };
  }

  const prefix = `${options.jahr}-`;
  const forYear = rows.filter((r) => r.abrechnungsmonat.startsWith(prefix));
  if (forYear.length === 0) {
    return { kind: "empty", reason: "no-archiv-rows", jahr: options.jahr };
  }

  let kv_an_basis = 0;
  let kv_an_zusatz = 0;
  let pv_an = 0;
  let rv_an = 0;
  let av_an = 0;
  for (const r of forYear) {
    kv_an_basis += readAbzugFromJson(r.abrechnung_json, "kv_an");
    kv_an_zusatz += readAbzugFromJson(r.abrechnung_json, "kv_zusatz_an");
    pv_an += readAbzugFromJson(r.abrechnung_json, "pv_an");
    rv_an += readAbzugFromJson(r.abrechnung_json, "rv_an");
    av_an += readAbzugFromJson(r.abrechnung_json, "av_an");
  }

  return {
    kind: "ok",
    vorschlag: {
      kv_an_basis: round2(kv_an_basis),
      kv_an_zusatz: round2(kv_an_zusatz),
      pv_an: round2(pv_an),
      rv_an: round2(rv_an),
      av_an: round2(av_an),
      abrechnungen_gefunden: forYear.length,
      jahr: options.jahr,
      employeeId: options.employeeId,
    },
  };
}
