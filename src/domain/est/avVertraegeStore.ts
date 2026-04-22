/**
 * Nacht-Modus-Sprint (2026-04-21) · Schritt 1 — AV-Vertraege Stammdaten-
 * Store fuer AnlageAV.
 *
 * Im Unterschied zum `estStorage`-Modul (jahr-scoped):
 *   • Vertraege sind Stammdaten, stabil über Jahre — Key ist jahr-unabhängig.
 *   • Key-Schema: `harouda:av-vertraege:<mandantId>`.
 *   • Kein Bezug zu Journal-Entries — 100% Manual-Input.
 *   • Rechtliche Basis: § 10 Abs. 1 Nr. 2 + Nr. 3a EStG; Bescheinigungen
 *     gem. § 22a EStG.
 *   • Zukunfts-Ready für VaSt-eDaten-Bescheinigungsabruf — der Shape
 *     bleibt dann identisch, nur die `erfasst_am`-Quelle wechselt.
 *
 * Pattern analog zu `estStorage`: mandantId-null-Safety, JSON-Parse-Try/
 * catch mit Empty-Array-Fallback, localStorage-Atomicity.
 *
 * Migration nach Supabase: siehe `docs/TECH-DEBT-AV-VERTRAEGE-SUPABASE.md`.
 */

const KEY_PREFIX = "harouda:av-vertraege";

export type AvVertragsTyp = "riester" | "ruerup" | "sonstige-av";

export type AvVertragStammdaten = {
  id: string;
  anbieter: string;
  vertragsnummer: string;
  vertragstyp: AvVertragsTyp;
  /** Referenz auf Ehepartner bei Zusammenveranlagung (true = Vertrag
   *  gehört dem Ehepartner). */
  ehepartner_referenz: boolean;
  /** ISO-Datum der ersten Erfassung (stabil über Updates). */
  erfasst_am: string;
};

function keyFor(mandantId: string): string {
  return `${KEY_PREFIX}:${mandantId}`;
}

function assertMandant(mandantId: string | null): asserts mandantId is string {
  if (!mandantId) {
    throw new Error(
      "AV-Vertraege benötigen einen aktiven Mandanten. Bitte erst im Arbeitsplatz einen Mandanten auswählen."
    );
  }
}

export function loadAvVertraege(
  mandantId: string | null
): AvVertragStammdaten[] {
  assertMandant(mandantId);
  try {
    const raw = localStorage.getItem(keyFor(mandantId));
    if (raw === null) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed as AvVertragStammdaten[];
  } catch {
    return [];
  }
}

export function saveAvVertraege(
  mandantId: string | null,
  vertraege: AvVertragStammdaten[]
): void {
  assertMandant(mandantId);
  try {
    localStorage.setItem(keyFor(mandantId), JSON.stringify(vertraege));
  } catch {
    /* Quota / Private-Mode — best-effort */
  }
}

export type NewAvVertragInput = Omit<AvVertragStammdaten, "id" | "erfasst_am">;

export function addAvVertrag(
  mandantId: string | null,
  input: NewAvVertragInput
): AvVertragStammdaten {
  assertMandant(mandantId);
  const neu: AvVertragStammdaten = {
    id:
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `av-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    erfasst_am: new Date().toISOString(),
    ...input,
  };
  const current = loadAvVertraege(mandantId);
  saveAvVertraege(mandantId, [...current, neu]);
  return neu;
}

export function removeAvVertrag(
  mandantId: string | null,
  id: string
): void {
  assertMandant(mandantId);
  const current = loadAvVertraege(mandantId);
  saveAvVertraege(
    mandantId,
    current.filter((v) => v.id !== id)
  );
}

export const __internals = { KEY_PREFIX, keyFor };
