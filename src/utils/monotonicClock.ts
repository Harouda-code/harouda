/**
 * Monotonic Clock — liefert ISO-Timestamps, die strikt monoton wachsen.
 *
 * Hintergrund: `new Date().toISOString()` kann bei schnellen aufeinander-
 * folgenden Aufrufen denselben Millisekundenwert liefern. Das bricht
 * deterministische Sortierungen (z.B. die GoBD-Hash-Kette in
 * `journalChain.ts`), wenn der Tie-Breaker — die UUIDv4-`id` — zufällig
 * eine andere Reihenfolge hat als die tatsächliche Insert-Reihenfolge.
 *
 * Diese Funktion garantiert: Jeder Aufruf liefert einen Timestamp, der
 * mindestens 1 ms nach dem vorigen Aufruf liegt.
 *
 * Achtung: Modul-lokaler State. Funktioniert nur innerhalb eines Prozesses.
 * Bei mehreren Tabs/Workern ist Determinismus nicht garantiert — für den
 * GoBD-Hash-Chain-Use-Case (Single-Tab-Buchhalter) ausreichend.
 *
 * Strategischer Hinweis: Mittelfristig sollte uid() auf UUIDv7 oder ULID
 * umgestellt werden, damit der Tie-Breaker selbst zeitlich sortiert ist.
 * Siehe technische Schulden, Punkt "UUIDv7 für Journal-IDs".
 */

let lastIssuedMs = 0;

export function monotonicNowIso(): string {
  const now = Date.now();
  const next = now <= lastIssuedMs ? lastIssuedMs + 1 : now;
  lastIssuedMs = next;
  return new Date(next).toISOString();
}

/** Nur für Tests: Reset des internen Zustands. */
export function __resetMonotonicClockForTests(): void {
  lastIssuedMs = 0;
}
