/** @jsxImportSource react */
//
// Multi-Tenancy-Foundation · Schritt 5 · ESt-Form-localStorage-Isolation.
//
// Sechs Pflicht-Assertions aus der Sprint-Spec:
// 1. write(anlage-n, A, {felderA}) isoliert von
// 2. write(anlage-n, B, {felderB}); read liefert korrekt für A
// 3. read liefert korrekt für B
// 4. write(anlage-g, A, {g}) beeinflusst anlage-n/A nicht
// 5. removeEstForm(anlage-n, A) lässt anlage-n/B unberührt
// (eine Assertion pro Punkt, + Cross-check)

import { describe, it, expect, beforeEach } from "vitest";
import {
  readEstForm,
  removeEstForm,
  writeEstForm,
} from "../domain/est/estStorage";

const A = "c-A";
const B = "c-B";

describe("Multi-Tenancy · ESt-Form-localStorage-Isolation (Smoke)", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("6-Punkte-Pflicht-Isolation zwischen Mandant A und B", () => {
    // (1) + (2) Setup + Cross-read von anlage-n/A
    writeEstForm("anlage-n", A, 2025, { felderA: "wert A" });
    writeEstForm("anlage-n", B, 2025, { felderB: "wert B" });
    expect(readEstForm<{ felderA: string }>("anlage-n", A, 2025)).toEqual({
      felderA: "wert A",
    });

    // (3) Cross-read von anlage-n/B — NICHT A's Daten
    expect(readEstForm<{ felderB: string }>("anlage-n", B, 2025)).toEqual({
      felderB: "wert B",
    });
    // Typ-Safety-Check: A's Key hat kein `felderB` und umgekehrt.
    expect(
      (readEstForm<{ felderB?: string }>("anlage-n", A, 2025))?.felderB
    ).toBeUndefined();

    // (4) Write auf anderes Form (anlage-g) für A ändert anlage-n/A NICHT
    writeEstForm("anlage-g", A, 2025, { g: "wert" });
    expect(readEstForm<{ felderA: string }>("anlage-n", A, 2025)).toEqual({
      felderA: "wert A",
    });
    expect(readEstForm<{ g: string }>("anlage-g", A, 2025)).toEqual({
      g: "wert",
    });

    // (5) removeEstForm(anlage-n, A) lässt anlage-n/B UNBERÜHRT
    removeEstForm("anlage-n", A, 2025);
    expect(readEstForm("anlage-n", A, 2025)).toBeNull();
    expect(readEstForm<{ felderB: string }>("anlage-n", B, 2025)).toEqual({
      felderB: "wert B",
    });
    // A's andere Forms ebenfalls unberührt.
    expect(readEstForm<{ g: string }>("anlage-g", A, 2025)).toEqual({
      g: "wert",
    });

    // (6) Explizit: 2 Mandanten × 2 Forms = 4 unabhängige Storage-Slots
    //     nach dem remove bleibt anlage-n/A leer, anlage-n/B + anlage-g/A
    //     intakt. Zähle localStorage-Keys mit dem V2-Prefix.
    let v2Keys = 0;
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith("harouda:est:")) v2Keys++;
    }
    expect(v2Keys).toBe(2); // anlage-n/B + anlage-g/A
  });
});
