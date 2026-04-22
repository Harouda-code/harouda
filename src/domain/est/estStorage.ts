// Multi-Tenancy Phase 1 / Schritt 3 · ESt-Form-Storage pro Mandant.
// Multi-Tenancy Phase 3 / Schritt 3 · Erweiterung auf mandant+jahr-Key.
//
// Vor Phase 1: `localStorage["harouda:anlage-n"]` — Kanzlei-global, härteste
// Datenvermischung.
// Phase 1 (V2): `harouda:est:<mandantId>:<form-id>` — pro Mandant getrennt.
// Phase 3 (V3): `harouda:est:<mandantId>:<jahr>:<form-id>` — zusätzlich
// jahr-getrennt. Ein Mandant kann jetzt 2024er und 2025er Anlage N parallel
// halten; bisher überschrieb das letzte Save den Vorjahres-Stand.
//
// Migration V2 → V3: explizit beim ersten User-Save pro (mandantId, formId),
// NICHT beim Page-Load. Grund: ein impliziter Page-Load mit einem beliebigen
// selectedYear würde V2-Daten ins falsche Jahres-Bucket kippen. User-Save
// ist ein klarer Intent-Marker.

const V2_PREFIX = "harouda:est";
const LEGACY_PREFIX_ANLAGE = "harouda:anlage-";
const LEGACY_PREFIX_EST = "harouda:est-";
const LEGACY_KEYS_FIXED = ["harouda:gewst", "harouda:kst"] as const;
const MIGRATION_FLAG = "harouda:est-migrated-v2";
const SELECTED_MANDANT_KEY = "harouda:selectedMandantId";

function assertYear(jahr: number): void {
  if (!Number.isInteger(jahr) || jahr < 2000 || jahr > 2100) {
    throw new Error(
      `ESt-Formular: ungültiges Jahr (${jahr}) — erwartet wird ein Ganzzahl-Jahr zwischen 2000 und 2100.`
    );
  }
}

/**
 * Baut den mandant+jahr-scoped Storage-Key für ein Formular (V3-Schema).
 * Wirft, wenn kein Mandant oder ein ungültiges Jahr übergeben wurde —
 * Form-Pages MÜSSEN den MandantRequiredGuard vor dem Aufruf benutzen und
 * `useYear().selectedYear` durchreichen.
 */
export function buildEstStorageKey(
  formId: string,
  mandantId: string | null,
  jahr: number
): string {
  if (!mandantId) {
    throw new Error(
      "ESt-Formular benötigt einen aktiven Mandanten. Bitte erst im Arbeitsplatz einen Mandanten auswählen."
    );
  }
  assertYear(jahr);
  return `${V2_PREFIX}:${mandantId}:${jahr}:${formId}`;
}

/** Legacy-V2-Key (ohne Jahr) — intern für Migration. */
function buildV2Key(formId: string, mandantId: string): string {
  return `${V2_PREFIX}:${mandantId}:${formId}`;
}

/**
 * Liest das Formular des aktiven Mandanten für das übergebene Jahr aus
 * localStorage. Gibt null zurück, wenn kein Eintrag existiert oder JSON
 * korrupt ist.
 *
 * Transitions-Fallback: Wenn der V3-Key leer ist, wird der V2-Key (ohne
 * Jahr) gelesen — so verlieren User, die ihre Daten noch nicht auf V3
 * migriert haben, ihren Stand nicht beim ersten Laden. Der anschließende
 * `migrateEstFormsV2ToV3` im Save-Pfad fixiert V2 auf das aktuelle Jahr;
 * danach greift der Fallback nicht mehr (V2-Key gelöscht).
 *
 * Nebeneffekt während der Transition: V2-Daten werden in JEDEM Jahr
 * angezeigt, bis der erste Save sie fest einem Jahr zuordnet. Das ist
 * gewollt — Legacy-Daten waren vor V3 ohnehin jahr-agnostisch.
 */
export function readEstForm<T = unknown>(
  formId: string,
  mandantId: string | null,
  jahr: number
): T | null {
  try {
    const key = buildEstStorageKey(formId, mandantId, jahr);
    const raw = localStorage.getItem(key);
    if (raw !== null) return JSON.parse(raw) as T;
    if (mandantId) {
      const v2Raw = localStorage.getItem(buildV2Key(formId, mandantId));
      if (v2Raw !== null) return JSON.parse(v2Raw) as T;
    }
    return null;
  } catch {
    return null;
  }
}

/** Schreibt das Formular des aktiven Mandanten/Jahres nach localStorage. */
export function writeEstForm<T = unknown>(
  formId: string,
  mandantId: string | null,
  jahr: number,
  data: T
): void {
  const key = buildEstStorageKey(formId, mandantId, jahr);
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch {
    /* Quota / Private-Mode — best-effort Persistenz */
  }
}

/** Löscht das Formular des aktiven Mandanten/Jahres aus localStorage. */
export function removeEstForm(
  formId: string,
  mandantId: string | null,
  jahr: number
): void {
  try {
    const key = buildEstStorageKey(formId, mandantId, jahr);
    localStorage.removeItem(key);
  } catch {
    /* ignore */
  }
}

/**
 * Einmalige Migration pro (mandantId, formId) von V2 → V3 — wird vom Caller
 * beim ersten User-Save aufgerufen.
 *
 * Semantik:
 *   • Liest den V2-Key `harouda:est:<mandantId>:<formId>` (ohne Jahr).
 *   • Wenn V2 nicht vorhanden: no-op.
 *   • Wenn V3-Key `harouda:est:<mandantId>:<jahr>:<formId>` bereits existiert:
 *     V2 wird NICHT überschrieben, bleibt für User-Klärung liegen,
 *     console.warn — Konflikt-Fall, passiert wenn dieselbe V2-Datei schon
 *     einmal unter einem anderen Jahr migriert wurde.
 *   • Sonst: V2-Daten unter V3 schreiben, V2-Key löschen.
 *
 * Idempotent: zweiter Aufruf nach erfolgreichem Lauf findet kein V2 mehr
 * und ist no-op. Kein globales Flag — die Migration läuft pro
 * (mandantId, formId), damit ein Formular nicht die Migration für andere
 * Formulare blockiert.
 */
export function migrateEstFormsV2ToV3(
  formId: string,
  mandantId: string | null,
  jahr: number
): { migrated: boolean; reason?: string } {
  if (!mandantId) return { migrated: false, reason: "no-mandant" };
  try {
    assertYear(jahr);
  } catch {
    return { migrated: false, reason: "invalid-year" };
  }
  try {
    const v2Key = buildV2Key(formId, mandantId);
    const v2Raw = localStorage.getItem(v2Key);
    if (v2Raw === null) return { migrated: false, reason: "no-v2-data" };
    const v3Key = buildEstStorageKey(formId, mandantId, jahr);
    if (localStorage.getItem(v3Key) !== null) {
      // eslint-disable-next-line no-console
      console.warn(
        `ESt-Migration V2→V3 übersprungen: V3-Key ${v3Key} existiert bereits. V2-Key ${v2Key} bleibt für User-Klärung erhalten.`
      );
      return { migrated: false, reason: "v3-exists" };
    }
    localStorage.setItem(v3Key, v2Raw);
    localStorage.removeItem(v2Key);
    return { migrated: true };
  } catch {
    return { migrated: false, reason: "localStorage-error" };
  }
}

/**
 * Listet alle relevanten Legacy-Keys (harouda:anlage-*, harouda:est-*,
 * harouda:gewst, harouda:kst) in localStorage — V1-Migration.
 */
function findLegacyKeys(): string[] {
  const keys: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (!k) continue;
    if (k.startsWith(`${V2_PREFIX}:`)) continue;
    if (k.startsWith(LEGACY_PREFIX_ANLAGE)) {
      keys.push(k);
      continue;
    }
    if (k.startsWith(LEGACY_PREFIX_EST)) {
      keys.push(k);
      continue;
    }
    if ((LEGACY_KEYS_FIXED as readonly string[]).includes(k)) {
      keys.push(k);
    }
  }
  return keys;
}

function legacyKeyToFormId(legacyKey: string): string {
  if (legacyKey.startsWith(LEGACY_PREFIX_ANLAGE)) {
    return legacyKey.slice("harouda:".length);
  }
  if (legacyKey.startsWith(LEGACY_PREFIX_EST)) {
    return legacyKey.slice("harouda:".length);
  }
  return legacyKey.slice("harouda:".length);
}

/**
 * Einmalige Migration V1 → V2 (aus Phase 1 Schritt 3). Bleibt unverändert
 * in place — sie zieht Legacy-Schlüssel auf das V2-Schema ohne Jahr um.
 * Die anschließende V2→V3-Migration passiert lazy pro User-Save via
 * `migrateEstFormsV2ToV3`.
 */
export function migrateEstFormsV1ToV2(): {
  migrated: number;
  skipped: boolean;
  reason?: string;
} {
  try {
    if (localStorage.getItem(MIGRATION_FLAG) === "1") {
      return { migrated: 0, skipped: true, reason: "flag-already-set" };
    }
    const mandantId = localStorage.getItem(SELECTED_MANDANT_KEY);
    if (!mandantId || mandantId.length === 0) {
      return { migrated: 0, skipped: true, reason: "no-active-mandant" };
    }

    const legacy = findLegacyKeys();
    let migratedCount = 0;
    for (const lk of legacy) {
      const raw = localStorage.getItem(lk);
      if (raw === null) continue;
      const trimmed = raw.trim();
      if (trimmed.length === 0) {
        localStorage.removeItem(lk);
        continue;
      }
      const formId = legacyKeyToFormId(lk);
      const newKey = `${V2_PREFIX}:${mandantId}:${formId}`;
      if (localStorage.getItem(newKey) === null) {
        localStorage.setItem(newKey, raw);
      }
      localStorage.removeItem(lk);
      migratedCount++;
    }
    localStorage.setItem(MIGRATION_FLAG, "1");
    return { migrated: migratedCount, skipped: false };
  } catch {
    return { migrated: 0, skipped: true, reason: "localStorage-error" };
  }
}

// Re-Exports für Tests.
export const __internals = {
  MIGRATION_FLAG,
  V2_PREFIX,
  LEGACY_PREFIX_ANLAGE,
  LEGACY_PREFIX_EST,
  SELECTED_MANDANT_KEY,
  buildV2Key,
};
