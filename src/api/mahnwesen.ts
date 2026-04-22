import type { DunningRecord, DunningStage } from "../types/db";
import type { Settings } from "../contexts/SettingsContext";
import type { OpenItem } from "./opos";
import { log } from "./audit";
import { store, uid } from "./store";
import { shouldUseSupabase, requireCompanyId } from "./db";
import { supabase } from "./supabase";

/**
 * Mahnwesen-Logik.
 *
 * Die Stufen:
 *   1  Zahlungserinnerung (freundlich, oft ohne Gebühr)
 *   2  1. Mahnung (mit Mahngebühr)
 *   3  2. und letzte Mahnung (höhere Gebühr, Ankündigung gerichtliches Mahnverfahren)
 *
 * Verzugszinsen nach § 288 BGB:
 *   - B2B:  9 Prozentpunkte über dem Basiszinssatz
 *   - B2C:  5 Prozentpunkte über dem Basiszinssatz
 *
 * Der Basiszinssatz ändert sich halbjährlich (Deutsche Bundesbank). Er
 * wird deshalb aus den Settings gelesen — kein hartkodierter Wert.
 */

export async function fetchDunningRecords(
  clientId: string | null
): Promise<DunningRecord[]> {
  if (!shouldUseSupabase()) {
    const all = store.getDunnings();
    if (clientId === null) {
      return all.sort((a, b) => b.issued_at.localeCompare(a.issued_at));
    }
    let legacyWarned = false;
    const filtered: DunningRecord[] = [];
    for (const r of all) {
      if ((r as DunningRecord).client_id === undefined) {
        if (!legacyWarned) {
          console.warn(
            "dunning_records: legacy-row without client_id, returned unfiltered."
          );
          legacyWarned = true;
        }
        filtered.push(r);
        continue;
      }
      if (r.client_id === clientId) filtered.push(r);
    }
    return filtered.sort((a, b) => b.issued_at.localeCompare(a.issued_at));
  }
  const companyId = requireCompanyId();
  let q = supabase
    .from("dunning_records")
    .select("*")
    .eq("company_id", companyId);
  if (clientId !== null) q = q.eq("client_id", clientId);
  const { data, error } = await q.order("issued_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as DunningRecord[];
}

/**
 * Welche Stufe wäre als nächstes fällig? Wenn schon Stufe 3 gemahnt wurde,
 * gibt es kein automatisches "Stufe 4" — der Fall ist reif für einen
 * gerichtlichen Mahnbescheid.
 */
export function nextStageFor(
  item: OpenItem,
  existing: DunningRecord[],
  settings: Settings
): DunningStage | null {
  const rec = existing
    .filter((r) => r.beleg_nr === item.beleg_nr)
    .sort((a, b) => b.stage - a.stage)[0];
  const highest: number = rec?.stage ?? 0;

  if (item.ueberfaellig_tage < 0) return null;

  const { stufe1AbTagen, stufe2AbTagen, stufe3AbTagen } = settings;

  if (highest >= 3) return null;
  if (highest === 2 && item.ueberfaellig_tage >= stufe3AbTagen) return 3;
  if (highest === 1 && item.ueberfaellig_tage >= stufe2AbTagen) return 2;
  if (highest === 0) {
    if (item.ueberfaellig_tage >= stufe3AbTagen) return 3;
    if (item.ueberfaellig_tage >= stufe2AbTagen) return 2;
    if (item.ueberfaellig_tage >= stufe1AbTagen) return 1;
    return null;
  }
  // highest === 2 but threshold for 3 not yet reached → no new
  return null;
}

export function feeFor(stage: DunningStage, settings: Settings): number {
  switch (stage) {
    case 1:
      return settings.mahngebuehrStufe1;
    case 2:
      return settings.mahngebuehrStufe2;
    case 3:
      return settings.mahngebuehrStufe3;
  }
}

/**
 * Rechnet Verzugszinsen (taggenau) nach § 288 BGB aus.
 * zinssatz = basiszinssatz + 5 (B2C) bzw. 9 (B2B) Prozentpunkte
 */
export function computeVerzugszinsen(
  betrag: number,
  ueberfaelligTage: number,
  settings: Settings
): number {
  if (ueberfaelligTage <= 0 || betrag <= 0) return 0;
  const aufschlag = settings.verzugszinsenB2B ? 9 : 5;
  const satz = settings.basiszinssatzPct + aufschlag;
  // Zinsen für überfällige Tage: betrag * satz/100 * tage/365
  const interest = (betrag * (satz / 100) * ueberfaelligTage) / 365;
  return Math.round(interest * 100) / 100;
}

export type CreateDunningInput = {
  item: OpenItem;
  stage: DunningStage;
  settings: Settings;
  /** Neue Zahlungsfrist in Tagen ab heute (Default 10). */
  frist_tage?: number;
};

export async function createDunning(
  input: CreateDunningInput,
  clientId: string | null
): Promise<DunningRecord> {
  const fee = feeFor(input.stage, input.settings);
  const verzugszinsen = computeVerzugszinsen(
    input.item.offen,
    Math.max(0, input.item.ueberfaellig_tage),
    input.settings
  );
  const fristTage = input.frist_tage ?? 10;
  const fristNeu = new Date();
  fristNeu.setDate(fristNeu.getDate() + fristTage);
  const record: DunningRecord = {
    id: uid(),
    client_id: clientId,
    beleg_nr: input.item.beleg_nr,
    stage: input.stage,
    gegenseite: input.item.gegenseite,
    issued_at: new Date().toISOString(),
    betrag_offen: input.item.offen,
    fee,
    verzugszinsen,
    faelligkeit_neu: fristNeu.toISOString().slice(0, 10),
    faelligkeit_alt: input.item.faelligkeit,
    ueberfaellig_tage_bei_mahnung: Math.max(0, input.item.ueberfaellig_tage),
  };

  if (!shouldUseSupabase()) {
    store.appendDunning(record);
    void log({
      action: "create",
      entity: "journal_entry",
      entity_id: null,
      summary: `Mahnung Stufe ${input.stage} für Beleg ${input.item.beleg_nr} (${input.item.gegenseite})`,
      after: record,
    });
    return record;
  }

  const companyId = requireCompanyId();
  const { data, error } = await supabase
    .from("dunning_records")
    .insert({
      beleg_nr: record.beleg_nr,
      stage: record.stage,
      gegenseite: record.gegenseite,
      issued_at: record.issued_at,
      betrag_offen: record.betrag_offen,
      fee: record.fee,
      verzugszinsen: record.verzugszinsen,
      faelligkeit_alt: record.faelligkeit_alt,
      faelligkeit_neu: record.faelligkeit_neu,
      ueberfaellig_tage_bei_mahnung: record.ueberfaellig_tage_bei_mahnung,
      company_id: companyId,
      client_id: clientId,
    })
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  const saved = data as DunningRecord;
  void log({
    action: "create",
    entity: "journal_entry",
    entity_id: null,
    summary: `Mahnung Stufe ${input.stage} für Beleg ${input.item.beleg_nr} (${input.item.gegenseite})`,
    after: saved,
  });
  return saved;
}

export async function deleteDunning(
  id: string,
  clientId: string | null
): Promise<void> {
  if (!shouldUseSupabase()) {
    const existing = store.getDunnings();
    const target = existing.find((r) => r.id === id);
    if (
      target &&
      clientId !== null &&
      target.client_id !== undefined &&
      target.client_id !== clientId
    ) {
      throw new Error("Mahnung gehört nicht zum aktiven Mandanten.");
    }
    store.setDunnings(existing.filter((r) => r.id !== id));
    return;
  }
  const companyId = requireCompanyId();
  let dQ = supabase
    .from("dunning_records")
    .delete()
    .eq("id", id)
    .eq("company_id", companyId);
  if (clientId !== null) dQ = dQ.eq("client_id", clientId);
  const { error } = await dQ;
  if (error) throw new Error(error.message);
}

/** Für eine Liste offener Posten: Vorschläge für nächste Mahnstufe. */
export function suggestDunningActions(
  items: OpenItem[],
  existing: DunningRecord[],
  settings: Settings
): Array<{
  item: OpenItem;
  nextStage: DunningStage;
  lastStage: DunningStage | 0;
}> {
  const out: Array<{
    item: OpenItem;
    nextStage: DunningStage;
    lastStage: DunningStage | 0;
  }> = [];
  for (const item of items) {
    if (item.kind !== "forderung") continue;
    const next = nextStageFor(item, existing, settings);
    if (next == null) continue;
    const last = existing
      .filter((r) => r.beleg_nr === item.beleg_nr)
      .sort((a, b) => b.stage - a.stage)[0];
    out.push({
      item,
      nextStage: next,
      lastStage: last?.stage ?? 0,
    });
  }
  return out;
}
