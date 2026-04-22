import { describe, it, expect } from "vitest";
import {
  canonicalize,
  computeAbrechnungHash,
  sha256Hex,
  verifyAbrechnungHash,
} from "../payrollHash";

describe("canonicalize", () => {
  it("gleicher Input → gleicher String (deterministisch)", () => {
    const a = { z: 1, a: 2, m: 3 };
    const b = { a: 2, m: 3, z: 1 };
    expect(canonicalize(a)).toBe(canonicalize(b));
  });

  it("key-sortiert: a vor z", () => {
    expect(canonicalize({ z: 1, a: 2 })).toBe('{"a":2,"z":1}');
  });

  it("verschachtelte Objekte werden rekursiv sortiert", () => {
    const input = { outer: { z: 1, a: 2 } };
    expect(canonicalize(input)).toBe('{"outer":{"a":2,"z":1}}');
  });

  it("Arrays behalten Reihenfolge", () => {
    expect(canonicalize([3, 1, 2])).toBe("[3,1,2]");
  });

  it("Primitive: string, number, boolean, null", () => {
    expect(canonicalize("test")).toBe('"test"');
    expect(canonicalize(42)).toBe("42");
    expect(canonicalize(true)).toBe("true");
    expect(canonicalize(null)).toBe("null");
  });

  it("undefined-Felder werden übersprungen (wie JSON.stringify)", () => {
    expect(canonicalize({ a: 1, b: undefined, c: 3 })).toBe('{"a":1,"c":3}');
  });

  it("Date als ISO-String (für reproducibility)", () => {
    const d = new Date("2025-01-15T10:00:00Z");
    expect(canonicalize(d)).toBe('"2025-01-15T10:00:00.000Z"');
  });

  it("String mit Sonderzeichen wird korrekt escaped", () => {
    expect(canonicalize('Hello "World"')).toBe('"Hello \\"World\\""');
  });
});

describe("sha256Hex", () => {
  it("gibt 64-stelligen Hex-String zurück", async () => {
    const h = await sha256Hex("test");
    expect(h).toHaveLength(64);
    expect(h).toMatch(/^[0-9a-f]{64}$/);
  });

  it("SHA-256 von 'abc' ist bekannter Wert", async () => {
    // NIST-Testvektor
    const h = await sha256Hex("abc");
    expect(h).toBe("ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad");
  });

  it("Leerer String produziert bekannten Hash", async () => {
    const h = await sha256Hex("");
    expect(h).toBe("e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855");
  });
});

describe("computeAbrechnungHash", () => {
  it("Reproduzierbar: gleiche Abrechnung → gleicher Hash", async () => {
    const abr = {
      arbeitnehmer_id: "an-1",
      abrechnungsmonat: "2025-01",
      gesamtBrutto: "3000.00",
      auszahlungsbetrag: "2100.00",
    };
    const h1 = await computeAbrechnungHash(abr);
    const h2 = await computeAbrechnungHash(abr);
    expect(h1).toBe(h2);
  });

  it("Property-Order-unabhängig: {a,b,c} == {c,b,a}", async () => {
    const a = { x: 1, y: 2, z: 3 };
    const b = { z: 3, y: 2, x: 1 };
    expect(await computeAbrechnungHash(a)).toBe(await computeAbrechnungHash(b));
  });

  it("Feld-Änderung → anderer Hash", async () => {
    const a = { brutto: "3000.00" };
    const b = { brutto: "3000.01" };
    expect(await computeAbrechnungHash(a)).not.toBe(
      await computeAbrechnungHash(b)
    );
  });

  it("Money-Precision im Hash erhalten (3000.00 != 3000.0)", async () => {
    const a = { betrag: "3000.00" };
    const b = { betrag: "3000.0" };
    expect(await computeAbrechnungHash(a)).not.toBe(
      await computeAbrechnungHash(b)
    );
  });

  it("Leeres Objekt produziert stabilen Hash", async () => {
    const h = await computeAbrechnungHash({});
    expect(h).toHaveLength(64);
    // Hash von "{}" ist konstant
    expect(h).toBe(await computeAbrechnungHash({}));
  });

  it("Performance: 100 Hash-Berechnungen < 1000 ms", async () => {
    const abr = { id: "a", brutto: "3000" };
    const start = Date.now();
    for (let i = 0; i < 100; i++) {
      await computeAbrechnungHash({ ...abr, id: `a${i}` });
    }
    const elapsed = Date.now() - start;
    expect(elapsed).toBeLessThan(1000);
  });
});

describe("verifyAbrechnungHash", () => {
  it("Korrekter Hash → true", async () => {
    const abr = { brutto: "3000.00" };
    const h = await computeAbrechnungHash(abr);
    expect(await verifyAbrechnungHash(abr, h)).toBe(true);
  });

  it("Falscher Hash → false", async () => {
    const abr = { brutto: "3000.00" };
    expect(await verifyAbrechnungHash(abr, "0".repeat(64))).toBe(false);
  });

  it("Manipuliertes Objekt → false", async () => {
    const original = { brutto: "3000.00" };
    const h = await computeAbrechnungHash(original);
    const tampered = { brutto: "3000.01" };
    expect(await verifyAbrechnungHash(tampered, h)).toBe(false);
  });
});
