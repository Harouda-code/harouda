/** Sehr leichte Fortschrittserkennung auf Basis des localStorage-Keys der
 *  jeweiligen Anlage. Wir können OHNE Schema-Definition pro Formular kein
 *  echtes %-complete berechnen — sinnvoll ist nur "hat Daten / leer".
 *  Für ein echtes Prozent-Tracking müsste jede Anlage eine
 *  `requiredFields`-Liste exportieren, die hier referenziert wird. */

export type FormProgress = {
  hasData: boolean;
  rawSize: number;
  /** Anzahl der Felder mit != default-Wert (grobe Heuristik). */
  filledFields: number;
};

const EMPTY_VALUES = new Set<string>(["", "0", "false", "—"]);

function countNonEmpty(value: unknown): number {
  if (value === null || value === undefined) return 0;
  if (typeof value === "string") {
    return value.trim().length > 0 ? 1 : 0;
  }
  if (typeof value === "number") {
    return value !== 0 ? 1 : 0;
  }
  if (typeof value === "boolean") {
    return value ? 1 : 0;
  }
  if (Array.isArray(value)) {
    return value.reduce<number>((s, v) => s + countNonEmpty(v), 0);
  }
  if (typeof value === "object") {
    return Object.values(value as Record<string, unknown>).reduce<number>(
      (s, v) => s + countNonEmpty(v),
      0
    );
  }
  return 0;
}

export function getFormProgress(storageKey: string): FormProgress {
  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw || EMPTY_VALUES.has(raw) || raw === "{}" || raw === "[]") {
      return { hasData: false, rawSize: 0, filledFields: 0 };
    }
    let filled = 0;
    try {
      const parsed = JSON.parse(raw);
      filled = countNonEmpty(parsed);
    } catch {
      filled = 0;
    }
    return {
      hasData: filled > 0,
      rawSize: raw.length,
      filledFields: filled,
    };
  } catch {
    return { hasData: false, rawSize: 0, filledFields: 0 };
  }
}

/** Collect all localStorage entries that belong to the tax-form suite
 *  (prefix `harouda:anlage-` oder `harouda:est-`). */
export function collectTaxFormStorage(): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key) continue;
    if (key.startsWith("harouda:anlage-") || key.startsWith("harouda:est-")) {
      try {
        out[key] = JSON.parse(localStorage.getItem(key) ?? "null");
      } catch {
        out[key] = localStorage.getItem(key);
      }
    }
  }
  return out;
}

export function exportTaxFormBackup(): string {
  const payload = {
    meta: {
      exportedAt: new Date().toISOString(),
      schema: "harouda.taxforms.v1",
    },
    data: collectTaxFormStorage(),
  };
  return JSON.stringify(payload, null, 2);
}

export type ImportResult = {
  imported: number;
  skipped: number;
  errors: string[];
};

export function importTaxFormBackup(json: string): ImportResult {
  const result: ImportResult = { imported: 0, skipped: 0, errors: [] };
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch (err) {
    result.errors.push(`JSON-Parse fehlgeschlagen: ${(err as Error).message}`);
    return result;
  }
  const wrapper = parsed as { data?: Record<string, unknown> } | Record<string, unknown>;
  const data =
    wrapper && typeof wrapper === "object" && "data" in wrapper
      ? (wrapper as { data: Record<string, unknown> }).data
      : (wrapper as Record<string, unknown>);
  if (!data || typeof data !== "object") {
    result.errors.push("Ungültiges Backup-Format (kein data-Objekt).");
    return result;
  }
  for (const [key, value] of Object.entries(data)) {
    if (
      !(key.startsWith("harouda:anlage-") || key.startsWith("harouda:est-"))
    ) {
      result.skipped++;
      continue;
    }
    try {
      localStorage.setItem(key, JSON.stringify(value));
      result.imported++;
    } catch (err) {
      result.errors.push(`${key}: ${(err as Error).message}`);
    }
  }
  return result;
}

export function clearAllTaxForms(): { cleared: number } {
  const keys: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k && (k.startsWith("harouda:anlage-") || k.startsWith("harouda:est-"))) {
      keys.push(k);
    }
  }
  for (const k of keys) localStorage.removeItem(k);
  return { cleared: keys.length };
}
