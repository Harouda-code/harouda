// Sprint 16 / Schritt 3 · bankTransactionFingerprint-Tests.

import { describe, it, expect } from "vitest";
import {
  bankTxFingerprint,
  canonicalizeBankTx,
} from "../bankTransactionFingerprint";

describe("bankTransactionFingerprint", () => {
  it("#1 Determinismus: gleicher Input → gleicher Output", async () => {
    const input = {
      datum: "2025-06-15",
      betrag: 123.45,
      vwz: "Rechnung 2025-0042",
      iban_gegenkonto: "DE89370400440532013000",
    };
    const a = await bankTxFingerprint(input);
    const b = await bankTxFingerprint({ ...input });
    expect(a).toBe(b);
    // SHA-256 hex hat 64 Zeichen.
    expect(a).toMatch(/^[0-9a-f]{64}$/);
  });

  it("#2 betrag-Normierung: 100 vs 100.00 vs 100.000 → gleicher Fingerprint", async () => {
    const base = {
      datum: "2025-01-01",
      vwz: "x",
      iban_gegenkonto: "DE00",
    };
    const a = await bankTxFingerprint({ ...base, betrag: 100 });
    const b = await bankTxFingerprint({ ...base, betrag: 100.0 });
    const c = await bankTxFingerprint({ ...base, betrag: 100.001 });
    expect(a).toBe(b);
    // 100.001 wird auf 100.00 gerundet → gleich.
    expect(a).toBe(c);
  });

  it("#3 vwz-Normierung: Whitespace + Groß/Klein + Tabs → gleicher Fingerprint", async () => {
    const base = {
      datum: "2025-01-01",
      betrag: 50,
      iban_gegenkonto: "DE00",
    };
    const a = await bankTxFingerprint({ ...base, vwz: "Miete Januar" });
    const b = await bankTxFingerprint({ ...base, vwz: "  miete    januar  " });
    const c = await bankTxFingerprint({ ...base, vwz: "MIETE\tJANUAR" });
    expect(a).toBe(b);
    expect(a).toBe(c);
  });

  it("#4 iban-Normierung: Whitespace + Groß/Klein → gleicher Fingerprint", async () => {
    const base = {
      datum: "2025-01-01",
      betrag: 50,
      vwz: "x",
    };
    const a = await bankTxFingerprint({
      ...base,
      iban_gegenkonto: "DE89 3704 0044 0532 0130 00",
    });
    const b = await bankTxFingerprint({
      ...base,
      iban_gegenkonto: "de89370400440532013000",
    });
    expect(a).toBe(b);
  });

  it("#5 Unterschiedliche Felder → unterschiedlicher Fingerprint", async () => {
    const base = {
      datum: "2025-01-01",
      betrag: 50,
      vwz: "x",
      iban_gegenkonto: "DE00",
    };
    const a = await bankTxFingerprint(base);
    const b = await bankTxFingerprint({ ...base, betrag: 51 });
    const c = await bankTxFingerprint({ ...base, datum: "2025-01-02" });
    const d = await bankTxFingerprint({ ...base, vwz: "y" });
    expect(a).not.toBe(b);
    expect(a).not.toBe(c);
    expect(a).not.toBe(d);
  });

  it("#6 canonicalizeBankTx: liefert Pipe-separierten String", () => {
    expect(
      canonicalizeBankTx({
        datum: "2025-01-01",
        betrag: 42.5,
        vwz: "Test",
        iban_gegenkonto: "DE89",
      })
    ).toBe("2025-01-01|42.50|test|DE89");
  });
});
