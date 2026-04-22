/**
 * Audit 2026-04-20 P1-06 + Post-Bugfix Bugs A/B/C: End-to-End-Snapshot-
 * Test für die Musterfirma Kühn GmbH.
 *
 * Testet den kompletten Pfad:
 *   autoSeedDemoIfNeeded() → planAfaLauf() + commitAfaLauf()
 *   → buildBalanceSheet() + buildGuv() + buildUstva()
 *
 * **Soll-Werte entsprechen dem ist-reproduzierbaren Ergebnis nach:**
 *   - P0-01 GuV-Mapping für RC-Konten 3100-3159
 *   - P1-01 CSV-Fix EB-005 (0800 → 2300)
 *   - Post-Bugfix Bug A: 0860 Gewinnvortrag → P.A.IV
 *   - Post-Bugfix Bug B: 2300 Grundkapital → P.A.I (GuV-Range auf 2310+)
 *   - Post-Bugfix Bug C: 1600 Verbindlichkeiten L+L → P.C.4
 *
 * **Abweichung zu `demo-input/musterfirma-2025/README.md`:** Der README-
 * Walkthrough nennt Sollwerte (Aktiva 196.396, Passiva 196.396, JÜ
 * 37.300, Zahllast 2.820), die vom ursprünglichen Author **manuell
 * geschätzt** wurden, ohne alle Mapping-Konflikte vorauszusehen. Die
 * tatsächlich reproduzierbaren Werte sind in `docs/POST-BUGFIX-FRAGEN.md`
 * (Phase 3 Szenario B) dokumentiert und hier als feste Testwerte
 * verankert. Der README wurde parallel mit einer „Ist-Wert"-Tabelle
 * ergänzt, die README-Sollwerte bleiben als Lernziel dokumentiert.
 *
 * Toleranz 0,01 € (Decimal-Rundung).
 */

import { describe, it, expect, beforeEach } from "vitest";
import { autoSeedDemoIfNeeded } from "../demoSeed";
import { store } from "../store";
import { buildBalanceSheet } from "../../domain/accounting/BalanceSheetBuilder";
import { buildGuv } from "../../domain/accounting/GuvBuilder";
import { buildUstva } from "../../domain/ustva/UstvaBuilder";
import { planAfaLauf, commitAfaLauf } from "../../domain/anlagen/AnlagenService";
import { Money } from "../../lib/money/Money";

const TOL_CENTS = 1; // 0,01 €

function expectMoneyNear(actual: string, expected: number): void {
  const a = new Money(actual);
  const e = new Money(expected);
  const diffCents = Math.abs(Number(a.minus(e).toCents()));
  expect(
    diffCents,
    `Abweichung ${diffCents}¢ zwischen ${actual} und ${expected}`
  ).toBeLessThanOrEqual(TOL_CENTS);
}

describe("Musterfirma Kühn GmbH — Bilanz-Snapshot 31.12.2025", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("Auto-Seed + AfA-Lauf produziert reproduzierbare Kennzahlen (Ist-Werte)", async () => {
    await autoSeedDemoIfNeeded();
    const plan = planAfaLauf(2025, store.getAnlagegueter());
    if (plan.lines.length > 0) {
      await commitAfaLauf(plan);
    }

    const accounts = store.getAccounts();
    const entries = store.getEntries();

    const bilanz = buildBalanceSheet(accounts, entries, {
      stichtag: "2025-12-31",
    });
    const guv = buildGuv(accounts, entries, {
      periodStart: "2025-01-01",
      stichtag: "2025-12-31",
    });
    const ustva = buildUstva({
      accounts,
      entries,
      jahr: 2025,
      voranmeldungszeitraum: "MONAT",
      monat: 12,
      dauerfristverlaengerung: false,
    });

    // --- GoBD-Kern-Invariante: Bilanz balanciert ---
    expectMoneyNear(bilanz.balancierungsDifferenz, 0);

    // --- Reproduzierbare Ist-Werte (Regressions-Anker) ---
    // Abweichung zu README in docs/POST-BUGFIX-FRAGEN.md dokumentiert.
    expectMoneyNear(bilanz.aktivaSum, 174187.82);
    expectMoneyNear(bilanz.passivaSum, 174187.82);
    expectMoneyNear(guv.jahresergebnis, 28587.82);
    expectMoneyNear(ustva.zahllast, 4150.0);
  });
});
