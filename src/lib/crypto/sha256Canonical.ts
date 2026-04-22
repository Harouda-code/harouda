/**
 * Sprint 20.B.1 · Canonical-JSON-SHA-256-Helper für neue Hash-Chains.
 *
 * ACHTUNG: NICHT verwenden für Journal, Audit, Payroll, Invoice-Archive —
 * die haben eigene Helpers (pipe-delimited bzw. alt-canonical). Die
 * Konsolidierung der vier bestehenden Implementierungen ist TECH-DEBT LOW
 * (Sprint 21+).
 *
 * Zweck: byte-identische Hash-Berechnung zwischen Client und DB-Trigger
 * für `business_partners_versions` und `ustid_verifications`.
 *
 * Normalisierungs-Regeln (MÜSSEN identisch mit DB `canonical_jsonb()` sein):
 *   • Key-Sort: alphabetisch, case-sensitive
 *   • Whitespace: keines
 *   • null bleibt `null` (nicht weggelassen)
 *   • undefined WIRFT (sicherer Default statt Silent-Drop)
 *   • Strings: JSON-String-Escaping (JSON.stringify für korrekte
 *     Unicode/Escape-Semantik)
 *   • Zahlen: Number.toString(), keine Rundung. NaN/Infinity wirft.
 *   • Arrays: Reihenfolge bleibt erhalten, Elemente rekursiv canonical.
 *   • Objekte: Keys alphabetisch sortiert, Werte rekursiv canonical.
 *
 * Timestamps im Payload (siehe `formatUtcTimestamp`): YYYY-MM-DDTHH:MM:SS.ffffffZ
 * mit 6 Mikrosekunden-Ziffern in UTC.
 */

/** Rekursive canonical-JSON-Serialisierung. Wirft bei `undefined`. */
export function canonicalJson(value: unknown): string {
  if (value === undefined) {
    throw new Error(
      "canonicalJson: undefined ist nicht zulässig (use null oder omit)"
    );
  }
  if (value === null) return "null";

  const t = typeof value;

  if (t === "string") {
    // JSON.stringify kapselt korrektes Escaping (Unicode, Quotes, Control-Chars).
    return JSON.stringify(value as string);
  }

  if (t === "number") {
    const n = value as number;
    if (!Number.isFinite(n)) {
      throw new Error(
        `canonicalJson: nicht-finite Zahl (${n}) ist nicht zulässig`
      );
    }
    return n.toString();
  }

  if (t === "boolean") {
    return (value as boolean) ? "true" : "false";
  }

  if (Array.isArray(value)) {
    const parts = value.map((v) => canonicalJson(v));
    return "[" + parts.join(",") + "]";
  }

  if (t === "object") {
    const obj = value as Record<string, unknown>;
    const keys = Object.keys(obj).sort();
    const parts: string[] = [];
    for (const k of keys) {
      parts.push(JSON.stringify(k) + ":" + canonicalJson(obj[k]));
    }
    return "{" + parts.join(",") + "}";
  }

  throw new Error(`canonicalJson: unsupported type ${t}`);
}

/** SHA-256 hex (lowercase, 64 chars). Läuft in Browser + Node 20+ + happy-dom. */
export async function sha256Hex(input: string): Promise<string> {
  const bytes = new TextEncoder().encode(input);
  const subtle = (
    globalThis as { crypto?: { subtle?: SubtleCrypto } }
  ).crypto?.subtle;
  if (!subtle) {
    throw new Error(
      "crypto.subtle nicht verfügbar — SHA-256-Berechnung erfordert Browser, Node 20+ oder happy-dom."
    );
  }
  const digest = await subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export const GENESIS_HASH = "0".repeat(64);

/**
 * Chain-Hash für BPV/UV-Zeilen. Genesis: prev=null → 64×'0' als Prev-Anker.
 * Format: `<prev>|<canonicalJson(payload)>` → SHA-256 → hex.
 * Muss byte-identisch mit DB-Trigger sein (Migration 0039).
 */
export async function computeChainHash(
  prev: string | null,
  payload: unknown
): Promise<string> {
  const prevNormalized = prev ?? GENESIS_HASH;
  const canonical = prevNormalized + "|" + canonicalJson(payload);
  return sha256Hex(canonical);
}

/**
 * Formatiert einen Date-Wert als `YYYY-MM-DDTHH:MM:SS.ffffffZ` (UTC,
 * 6 Mikrosekunden-Ziffern).
 *
 * HINWEIS: JS `Date` hat nur Millisekunden-Präzision. Die letzten drei
 * Stellen werden mit `'000'` gepaddet. Wenn der Aufrufer echte
 * Mikrosekunden braucht (z. B. aus einem `timestamptz` mit µs-Auflösung),
 * muss er den String direkt übergeben — der Payload-Kontrakt verlangt
 * den String, nicht das Date.
 */
export function formatUtcTimestamp(d: Date): string {
  if (!(d instanceof Date) || Number.isNaN(d.getTime())) {
    throw new Error("formatUtcTimestamp: ungültiges Date-Objekt");
  }
  const yyyy = d.getUTCFullYear().toString().padStart(4, "0");
  const MM = (d.getUTCMonth() + 1).toString().padStart(2, "0");
  const dd = d.getUTCDate().toString().padStart(2, "0");
  const hh = d.getUTCHours().toString().padStart(2, "0");
  const mm = d.getUTCMinutes().toString().padStart(2, "0");
  const ss = d.getUTCSeconds().toString().padStart(2, "0");
  const ms = d.getUTCMilliseconds().toString().padStart(3, "0");
  // JS Date → ms-Präzision; µs-Anteil ist immer 000.
  const us = ms + "000";
  return `${yyyy}-${MM}-${dd}T${hh}:${mm}:${ss}.${us}Z`;
}
