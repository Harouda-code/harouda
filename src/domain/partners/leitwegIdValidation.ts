/**
 * Leitweg-ID Format-Validator (XRechnung 3.0 / BR-DE-1).
 *
 * Sprint 19.B. Regex laut Spec: 2-12 Ziffern, "-",
 * 1-30 A-Z0-9-Zeichen, "-", 2 Ziffern Pruefziffer.
 * Kein Checksum-Algorithmus publiziert (KoSIT hat nur das
 * Strukturmuster veroeffentlicht), daher Format-only.
 */

export type LeitwegIdValidationResult = {
  valid: boolean;
  error?: string;
};

const LEITWEG_RX = /^[0-9]{2,12}-[A-Z0-9]{1,30}-[0-9]{2}$/;

export function validateLeitwegId(id: string): LeitwegIdValidationResult {
  if (!id) {
    return { valid: false, error: "Leitweg-ID ist leer." };
  }
  const cleaned = id.trim().toUpperCase();
  if (!LEITWEG_RX.test(cleaned)) {
    return {
      valid: false,
      error:
        "Format ungültig. Erwartet: <Grobadressierung 2–12 Ziffern>-<Feinadressierung bis 30 Zeichen A-Z/0-9>-<Prüfziffer 2 Ziffern>.",
    };
  }
  return { valid: true };
}
