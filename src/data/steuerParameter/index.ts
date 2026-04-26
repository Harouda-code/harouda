import { STEUERPARAMETER_2024 } from "./2024";
import { STEUERPARAMETER_2025 } from "./2025";
import { STEUERPARAMETER_2026 } from "./2026";
import type { SteuerParameter } from "./types";

/**
 * Version dieses Steuerparameter-Datensatzes als Ganzes.
 * Erhöht sich, sobald irgendein Jahrgang angepasst wird.
 * Wird in Audit-Logs mitgeschrieben.
 */
export const STEUERPARAMETER_VERSION = "2026.04.18.2";

const ALL: SteuerParameter[] = [
  STEUERPARAMETER_2024,
  STEUERPARAMETER_2025,
  STEUERPARAMETER_2026,
];

const BY_YEAR = new Map<number, SteuerParameter>(
  ALL.map((p) => [p.jahr, p])
);

export function availableSteuerJahre(): number[] {
  return ALL.map((p) => p.jahr).sort((a, b) => b - a);
}

/**
 * Liefert die Parameter für das gewünschte Jahr. Ist das Jahr unbekannt,
 * fällt die Funktion auf den nächstgelegenen verfügbaren Jahrgang zurück.
 */
export function getSteuerParameter(jahr: number): SteuerParameter {
  const exact = BY_YEAR.get(jahr);
  if (exact) return exact;
  const years = ALL.map((p) => p.jahr);
  const nearest = years.reduce((best, y) =>
    Math.abs(y - jahr) < Math.abs(best - jahr) ? y : best
  );
   
  return BY_YEAR.get(nearest)!;
}

export type { SteuerParameter } from "./types";
export { besteuerungsanteil } from "./besteuerungsanteil";
