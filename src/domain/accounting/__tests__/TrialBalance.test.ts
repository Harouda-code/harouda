// Jahresabschluss-E1 / Schritt 3 · Trial-Balance-Tests.

import { describe, it, expect } from "vitest";
import { computeTrialBalance } from "../TrialBalance";
import type { JournalEntry } from "../../../types/db";

function makeEntry(
  id: string,
  datum: string,
  betrag: number,
  status: JournalEntry["status"] = "gebucht"
): JournalEntry {
  return {
    id,
    datum,
    beleg_nr: `B-${id}`,
    beschreibung: `Buchung ${id}`,
    soll_konto: "4100",
    haben_konto: "1200",
    betrag,
    ust_satz: null,
    status,
    client_id: null,
    skonto_pct: null,
    skonto_tage: null,
    gegenseite: null,
    faelligkeit: null,
    version: 1,
  };
}

const Z = { von: "2025-01-01", bis: "2025-12-31" };

describe("computeTrialBalance", () => {
  it("10 korrekte Entries: ist_ausgeglichen=true, counts korrekt", () => {
    const entries = Array.from({ length: 10 }, (_, i) =>
      makeEntry(`e${i}`, "2025-03-15", (i + 1) * 100)
    );
    const r = computeTrialBalance(entries, Z);
    // Σ = 100+200+...+1000 = 5500
    expect(r.total_soll).toBe(5500);
    expect(r.total_haben).toBe(5500);
    expect(r.differenz).toBe(0);
    expect(r.ist_ausgeglichen).toBe(true);
    expect(r.entry_count_betrachtet).toBe(10);
    expect(r.entry_count_entwuerfe_ignoriert).toBe(0);
  });

  it("Entwürfe werden NICHT mitgezählt, aber gezählt in entwuerfe_ignoriert", () => {
    const entries = [
      makeEntry("e1", "2025-03-01", 1000),
      makeEntry("e2", "2025-04-01", 500, "entwurf"),
      makeEntry("e3", "2025-05-01", 500, "entwurf"),
    ];
    const r = computeTrialBalance(entries, Z);
    expect(r.total_soll).toBe(1000);
    expect(r.entry_count_betrachtet).toBe(1);
    expect(r.entry_count_entwuerfe_ignoriert).toBe(2);
    expect(r.ist_ausgeglichen).toBe(true);
  });

  it("Leerer Zeitraum-Filter (alle Entries außerhalb): 0/0/true", () => {
    const entries = [
      makeEntry("e1", "2024-01-01", 1000),
      makeEntry("e2", "2026-01-01", 2000),
    ];
    const r = computeTrialBalance(entries, Z);
    expect(r.total_soll).toBe(0);
    expect(r.total_haben).toBe(0);
    expect(r.ist_ausgeglichen).toBe(true);
    expect(r.entry_count_betrachtet).toBe(0);
  });

  it("Künstlich unbalanced (direktes Overwrite eines betrag-Feldes mit NaN): differenz bleibt 0 (NaN-Skip)", () => {
    // Defensive: bei betrag=NaN wird der Entry ignoriert, nicht die
    // Balance verfälscht.
    const entries = [
      makeEntry("e1", "2025-03-01", 100),
      { ...makeEntry("e2", "2025-04-01", 0), betrag: NaN } as JournalEntry,
    ];
    const r = computeTrialBalance(entries, Z);
    expect(r.total_soll).toBe(100);
    expect(r.total_haben).toBe(100);
    expect(r.ist_ausgeglichen).toBe(true);
  });

  it("Rundungs-Toleranz: Cent-Differenz < 0.01 gilt als ausgeglichen", () => {
    const r = computeTrialBalance(
      [makeEntry("e1", "2025-03-01", 1000.005)],
      Z
    );
    // Nach round2 wird 1000.01 sowohl soll als haben zugewiesen → differenz=0
    expect(r.ist_ausgeglichen).toBe(true);
  });

  it("Leeres Entries-Array: 0/0/true", () => {
    const r = computeTrialBalance([], Z);
    expect(r.total_soll).toBe(0);
    expect(r.entry_count_betrachtet).toBe(0);
    expect(r.ist_ausgeglichen).toBe(true);
  });
});
