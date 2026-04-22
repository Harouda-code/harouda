// German-specific validators.

/**
 * IBAN validation per ISO 13616 (mod-97).
 * Returns true for syntactically valid IBANs. Does not verify that the
 * account actually exists.
 */
export function isValidIban(raw: string): boolean {
  const iban = raw.replace(/\s+/g, "").toUpperCase();
  if (!/^[A-Z]{2}\d{2}[A-Z0-9]{11,30}$/.test(iban)) return false;
  // Move the first 4 characters to the end and convert letters to digits
  // (A=10, B=11, … Z=35), then mod 97 must equal 1.
  const rearranged = iban.slice(4) + iban.slice(0, 4);
  let converted = "";
  for (const ch of rearranged) {
    if (ch >= "0" && ch <= "9") converted += ch;
    else converted += String(ch.charCodeAt(0) - 55);
  }
  // Compute mod 97 in chunks to stay within safe integer range.
  let rem = 0;
  for (let i = 0; i < converted.length; i += 7) {
    rem = Number(String(rem) + converted.slice(i, i + 7)) % 97;
  }
  return rem === 1;
}

export function formatIban(raw: string): string {
  const clean = raw.replace(/\s+/g, "").toUpperCase();
  return clean.replace(/(.{4})/g, "$1 ").trim();
}

/**
 * German Steuernummer. Accepts either the classic Länder format
 * ("11/123/12345") or the 13-digit Bundeseinheitliche Steuernummer.
 * This only checks shape, not checksum.
 */
export function isValidSteuernummer(raw: string): boolean {
  const s = raw.trim();
  if (!s) return false;
  if (/^\d{13}$/.test(s)) return true;
  // 10 or 11 digit form with slashes
  if (/^\d{2,3}\/\d{3}\/\d{4,5}$/.test(s)) return true;
  // Compact all-digit 10/11-digit Länder form
  if (/^\d{10,11}$/.test(s)) return true;
  return false;
}

/**
 * Convert a classic Länder Steuernummer (e.g. "11/123/12345") to the
 * 13-digit bundeseinheitliche Form (placeholder: prefixes the Länder code
 * to the 11-digit base). The real conversion rules vary by state; this is
 * a best-effort hint for the user.
 */
export function toBundesSteuernummer(
  raw: string,
  bundesland?: string
): string | null {
  const s = raw.replace(/\s+/g, "");
  const m = /^(\d{2,3})\/(\d{3})\/(\d{4,5})$/.exec(s);
  if (!m) return null;
  const [, fa, mid, last] = m;
  const prefix = (bundesland || fa.padStart(4, "0")).slice(0, 4);
  // Bundeseinheitliche form is 13 digits. Padding rules differ per state;
  // this helper produces a 13-digit candidate for display.
  return (prefix + mid + last).padStart(13, "0").slice(0, 13);
}
