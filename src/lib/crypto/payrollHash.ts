/**
 * SHA-256-Hash einer Lohnabrechnung für GoBD-Integritätssicherung.
 *
 * Verwendet:
 *   - Kanonische JSON-Serialisierung (Keys alphabetisch sortiert, kein
 *     Whitespace) für reproducible hashes unabhängig von Property-Order.
 *   - Web Crypto API (crypto.subtle.digest) — in Browsern, Node 20+, und
 *     happy-dom (vitest) verfügbar. Async, gibt Promise<string> zurück.
 *
 * Anwendungsfall:
 *   - lockAbrechnung: Hash bei Festschreibung speichern
 *   - verifyLockIntegrity: neu berechnen + vergleichen (Manipulations-Erkennung)
 *   - Betriebsprüfer-Nachweis: Hash-Verlauf dokumentiert Unveränderbarkeit
 *     (§ 146 AO, GoBD Rz. 64).
 */

/** Kanonisiert ein JS-Objekt zu einem deterministischen JSON-String.
 *  - Schlüssel alphabetisch sortiert
 *  - Keine Leerzeichen
 *  - Primitive via JSON.stringify (inkl. String-Escaping)
 *  - Arrays in ihrer Reihenfolge
 *  - undefined wird wie JSON.stringify: übersprungen in Objekten
 */
export function canonicalize(value: unknown): string {
  if (value === null) return "null";
  if (typeof value === "undefined") return "null";
  if (typeof value !== "object") return JSON.stringify(value);
  if (value instanceof Date) return JSON.stringify(value.toISOString());
  if (Array.isArray(value)) {
    return "[" + value.map((v) => canonicalize(v)).join(",") + "]";
  }
  const obj = value as Record<string, unknown>;
  const keys = Object.keys(obj).sort();
  const parts: string[] = [];
  for (const k of keys) {
    const v = obj[k];
    if (typeof v === "undefined") continue;
    parts.push(JSON.stringify(k) + ":" + canonicalize(v));
  }
  return "{" + parts.join(",") + "}";
}

/** Berechnet SHA-256 Hex-Hash. Verwendet globalThis.crypto.subtle (async). */
export async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const subtle = (globalThis as { crypto?: { subtle?: SubtleCrypto } }).crypto?.subtle;
  if (!subtle) {
    throw new Error(
      "crypto.subtle nicht verfügbar — SHA-256-Berechnung nicht möglich (erfordert Browser, Node 20+, oder happy-dom)."
    );
  }
  const buffer = await subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/** Berechnet Hash einer Lohnabrechnung (oder beliebigen Struktur). */
export async function computeAbrechnungHash(
  abrechnung: unknown
): Promise<string> {
  const canonical = canonicalize(abrechnung);
  return await sha256Hex(canonical);
}

/** Verifiziert, ob aktueller Hash einem gespeicherten entspricht. */
export async function verifyAbrechnungHash(
  abrechnung: unknown,
  expectedHash: string
): Promise<boolean> {
  const actual = await computeAbrechnungHash(abrechnung);
  return actual === expectedHash;
}
