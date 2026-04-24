/**
 * Generic form payload sanitization.
 *
 * Converts empty strings "" to null for all fields in a form payload.
 * This is required because PostgreSQL treats "" as a real text value,
 * and CHECK constraints with regex patterns will reject zero-length strings.
 *
 * Usage: const cleaned = sanitizeFormPayload(rawFormData);
 *
 * Notes:
 * - Leaves non-string values untouched (numbers, booleans, arrays, null, undefined).
 * - Leaves non-empty strings untouched.
 * - Leaves whitespace-only strings untouched unless trimToNull option is used.
 * - Shallow: does not recurse into nested objects (form payloads are flat).
 */

export interface SanitizeOptions {
  /** If true, strings containing only whitespace are also converted to null. Default: false. */
  trimToNull?: boolean;
}

export function sanitizeFormPayload<T extends Record<string, unknown>>(
  payload: T,
  options: SanitizeOptions = {}
): T {
  const { trimToNull = false } = options;
  const result: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(payload)) {
    if (typeof value === "string") {
      if (value === "" || (trimToNull && value.trim() === "")) {
        result[key] = null;
      } else {
        result[key] = value;
      }
    } else {
      result[key] = value;
    }
  }

  return result as T;
}
