/**
 * Test-Helper: wartet, bis ein Condition-Callback `true` liefert,
 * oder bricht nach `timeoutMs` mit Error ab.
 *
 * Hintergrund: Tests, die `createRoot` manuell verwenden (statt
 * `@testing-library/react`), haben kein eingebautes `waitFor`. Hardcoded
 * `flush(N)`-Aufrufe sind nicht-deterministisch unter CI-Last - diese
 * Helper-Funktion ersetzt sie durch state-basierte Polling-Logik.
 *
 * Strategie: Macro-Tasks via setTimeout(0), zwischendurch React-Microtasks
 * via Promise.resolve, bis der Predicate `true` wird oder Timeout greift.
 *
 * Anwendung:
 *   await waitForCondition(
 *     () => JSON.parse(localStorage.getItem("xy") ?? "[]").length > 0,
 *     { timeoutMs: 1000, label: "ustid_verifications nicht leer" }
 *   );
 */

export type WaitForConditionOptions = {
  timeoutMs?: number;
  intervalMs?: number;
  label?: string;
};

export async function waitForCondition(
  predicate: () => boolean,
  opts: WaitForConditionOptions = {}
): Promise<void> {
  const timeoutMs = opts.timeoutMs ?? 1000;
  const intervalMs = opts.intervalMs ?? 5;
  const label = opts.label ?? "Bedingung";
  const start = Date.now();

  while (true) {
    // Microtasks abarbeiten (React-Renders, Promise-Chain-Resolution).
    for (let i = 0; i < 10; i++) {
      await Promise.resolve();
    }

    if (predicate()) return;

    if (Date.now() - start >= timeoutMs) {
      throw new Error(
        `waitForCondition: Timeout (${timeoutMs} ms) - ${label} nicht erfuellt.`
      );
    }

    // Macro-Task: erlaubt setTimeout-basierten Code (z.B. Debouncer,
    // simulierte Netzwerk-Latenz) zu laufen.
    await new Promise((r) => setTimeout(r, intervalMs));
  }
}
