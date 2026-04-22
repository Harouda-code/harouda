// Sprint 16 / Schritt 4 · BankAutoMatcher-Tests.

import { describe, it, expect } from "vitest";
import { findMatchCandidates } from "../BankAutoMatcher";

const BANK = [
  { id: "b-1", datum: "2025-06-15", betrag: 100.0, vwz: "Rechnung 2025-42" },
  { id: "b-2", datum: "2025-06-15", betrag: 500.0, vwz: "Miete Juni" },
];

describe("BankAutoMatcher · findMatchCandidates", () => {
  it("#1 Exact-Match (Betrag + Datum) → confidence 1.00, reasoning enthält beide Regeln", () => {
    const r = findMatchCandidates({
      bankTransactions: [BANK[0]],
      journalEntries: [
        { id: "je-1", datum: "2025-06-15", betrag: 100.0 },
      ],
    });
    expect(r[0].matches).toHaveLength(1);
    expect(r[0].matches[0].confidence).toBe(1.0);
    expect(r[0].matches[0].reasoning).toContain("Betrag exakt");
    expect(r[0].matches[0].reasoning).toContain("Datum exakt");
  });

  it("#2 Datum ±1 Tag → confidence 0.90", () => {
    const r = findMatchCandidates({
      bankTransactions: [BANK[0]],
      journalEntries: [
        { id: "je-2", datum: "2025-06-14", betrag: 100.0 },
      ],
    });
    expect(r[0].matches[0].confidence).toBe(0.9);
    expect(r[0].matches[0].reasoning).toContain("Datum ±1 Tag");
  });

  it("#3 Datum ±3 Tage → confidence 0.75", () => {
    const r = findMatchCandidates({
      bankTransactions: [BANK[0]],
      journalEntries: [
        { id: "je-3", datum: "2025-06-12", betrag: 100.0 },
      ],
    });
    expect(r[0].matches[0].confidence).toBe(0.75);
  });

  it("#4 Datum > 3 Tage (default tolerance): kein Kandidat", () => {
    const r = findMatchCandidates({
      bankTransactions: [BANK[0]],
      journalEntries: [
        { id: "je-x", datum: "2025-06-01", betrag: 100.0 },
      ],
    });
    expect(r[0].matches).toEqual([]);
  });

  it("#5 Betrag ±1 Cent + Datum exakt → 0.60", () => {
    const r = findMatchCandidates({
      bankTransactions: [BANK[0]],
      journalEntries: [
        { id: "je-c", datum: "2025-06-15", betrag: 99.99 },
      ],
    });
    expect(r[0].matches[0].confidence).toBe(0.6);
    expect(r[0].matches[0].reasoning).toContain("Betrag ±1 Cent");
  });

  it("#6 VWZ enthaelt Belegnr → +0.10 Boost", () => {
    const r = findMatchCandidates({
      bankTransactions: [BANK[0]],
      journalEntries: [
        {
          id: "je-b",
          datum: "2025-06-14", // 0.90 ohne Boost
          betrag: 100.0,
          belegnr: "2025-42",
        },
      ],
    });
    // 0.90 + 0.10 = 1.00
    expect(r[0].matches[0].confidence).toBe(1.0);
    expect(r[0].matches[0].reasoning.some((s) => s.includes("Belegnr"))).toBe(true);
  });

  it("#7 Mehrere Candidates pro Bank-Tx: sortiert nach confidence desc", () => {
    const r = findMatchCandidates({
      bankTransactions: [BANK[0]],
      journalEntries: [
        { id: "je-far", datum: "2025-06-12", betrag: 100.0 }, // 0.75
        { id: "je-close", datum: "2025-06-14", betrag: 100.0 }, // 0.90
        { id: "je-exact", datum: "2025-06-15", betrag: 100.0 }, // 1.00
      ],
    });
    expect(r[0].matches).toHaveLength(3);
    expect(r[0].matches[0].journal_entry_id).toBe("je-exact");
    expect(r[0].matches[1].journal_entry_id).toBe("je-close");
    expect(r[0].matches[2].journal_entry_id).toBe("je-far");
  });

  it("#8 Kein passender JE → leeres matches-Array", () => {
    const r = findMatchCandidates({
      bankTransactions: [BANK[0]],
      journalEntries: [
        { id: "je-wrong", datum: "2025-06-15", betrag: 999.0 },
      ],
    });
    expect(r[0].matches).toEqual([]);
  });

  it("#9 Fingerprint-Map wird durchgereicht", () => {
    const r = findMatchCandidates({
      bankTransactions: [BANK[0]],
      journalEntries: [
        { id: "je-1", datum: "2025-06-15", betrag: 100.0 },
      ],
      fingerprints: { "b-1": "fp-hash-1" },
    });
    expect(r[0].bank_transaction_fingerprint).toBe("fp-hash-1");
  });

  it("#10 VWZ-Boost cappt bei 1.00 (exakter Match + Boost bleibt 1.00)", () => {
    const r = findMatchCandidates({
      bankTransactions: [BANK[0]],
      journalEntries: [
        {
          id: "je-boost",
          datum: "2025-06-15",
          betrag: 100.0,
          belegnr: "2025-42",
        },
      ],
    });
    expect(r[0].matches[0].confidence).toBe(1.0);
  });
});
