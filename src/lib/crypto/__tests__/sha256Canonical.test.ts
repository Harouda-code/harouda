// Sprint 20.B.1 · sha256Canonical Tests
//
// Deckt den Payload-Kontrakt ab, der byte-identisch mit DB-Migration 0039
// (canonical_jsonb, canonical_ts) sein muss. Jede Änderung an diesen
// Tests ist rechtlich relevant — sie sind der Schutz vor stiller
// Chain-Divergenz.

import { describe, it, expect } from "vitest";
import {
  GENESIS_HASH,
  canonicalJson,
  computeChainHash,
  formatUtcTimestamp,
  sha256Hex,
} from "../sha256Canonical";

describe("canonicalJson · Struktur", () => {
  it("#1 flache Keys werden alphabetisch sortiert", () => {
    const out = canonicalJson({ b: 2, a: 1, c: 3 });
    expect(out).toBe('{"a":1,"b":2,"c":3}');
  });

  it("#2 verschachtelte Objekte werden rekursiv sortiert", () => {
    const out = canonicalJson({ outer: { z: 1, a: 2 }, alpha: 0 });
    expect(out).toBe('{"alpha":0,"outer":{"a":2,"z":1}}');
  });

  it("#3 Array-Reihenfolge bleibt erhalten (NICHT sortiert)", () => {
    const out = canonicalJson({ arr: [3, 1, 2], items: ["b", "a"] });
    expect(out).toBe('{"arr":[3,1,2],"items":["b","a"]}');
  });

  it("#4 Unicode + Sonderzeichen werden korrekt escaped", () => {
    const out = canonicalJson({ name: "Müller", emoji: "🛡️", quote: 'say"hi' });
    // JSON.stringify escapes korrekt: " → \", emojis literal, umlaute literal
    expect(out).toContain('"emoji":"🛡️"');
    expect(out).toContain('"name":"Müller"');
    expect(out).toContain('"quote":"say\\"hi"');
    // Reihenfolge: emoji, name, quote (alphabetisch)
    expect(out).toBe(
      '{"emoji":"🛡️","name":"Müller","quote":"say\\"hi"}'
    );
  });
});

describe("canonicalJson · null + undefined", () => {
  it("#5 undefined als Top-Level wirft", () => {
    expect(() => canonicalJson(undefined)).toThrow(/undefined/);
  });

  it("#6 undefined in Objekt-Value wirft", () => {
    expect(() => canonicalJson({ foo: undefined, bar: 1 })).toThrow(/undefined/);
  });

  it("#7 null bleibt als 'null' im Output (nicht weggelassen)", () => {
    expect(canonicalJson(null)).toBe("null");
    expect(canonicalJson({ a: null, b: 2 })).toBe('{"a":null,"b":2}');
  });

  it("#8 null in Arrays bleibt erhalten", () => {
    expect(canonicalJson([1, null, 3])).toBe("[1,null,3]");
  });
});

describe("canonicalJson · Zahlen", () => {
  it("#9 Integer + Float via Number.toString", () => {
    expect(canonicalJson({ i: 42, f: 3.14 })).toBe('{"f":3.14,"i":42}');
  });

  it("#10 NaN wirft (nicht-finit)", () => {
    expect(() => canonicalJson(NaN)).toThrow(/nicht-finite/);
  });

  it("#11 Infinity wirft", () => {
    expect(() => canonicalJson(Infinity)).toThrow(/nicht-finite/);
  });
});

describe("sha256Hex · Testvektor", () => {
  it("#12 SHA-256('abc') → ba7816bf... (NIST-Testvektor)", async () => {
    const h = await sha256Hex("abc");
    expect(h).toBe(
      "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad"
    );
  });

  it("#13 SHA-256('') → e3b0c442... (leerer String)", async () => {
    const h = await sha256Hex("");
    expect(h).toBe(
      "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
    );
  });

  it("#14 Output ist immer 64 Zeichen lowercase-hex", async () => {
    const h = await sha256Hex("beliebiger input");
    expect(h).toMatch(/^[0-9a-f]{64}$/);
  });
});

describe("computeChainHash · Genesis + Determinismus", () => {
  it("#15 Genesis: prev=null → Hash inkludiert 64×'0'-Anker", async () => {
    const h1 = await computeChainHash(null, { a: 1 });
    const manual = await sha256Hex(GENESIS_HASH + "|" + '{"a":1}');
    expect(h1).toBe(manual);
  });

  it("#16 Determinismus: identischer Input → identischer Hash", async () => {
    const a = await computeChainHash("prev-x", { b: 2, a: 1 });
    const b = await computeChainHash("prev-x", { a: 1, b: 2 });
    expect(a).toBe(b);
  });

  it("#17 prev-Unterschied → Hash-Unterschied", async () => {
    const a = await computeChainHash("prev-1", { a: 1 });
    const b = await computeChainHash("prev-2", { a: 1 });
    expect(a).not.toBe(b);
  });
});

describe("formatUtcTimestamp", () => {
  it("#18 Unix-Epoch → 1970-01-01T00:00:00.000000Z", () => {
    expect(formatUtcTimestamp(new Date(0))).toBe(
      "1970-01-01T00:00:00.000000Z"
    );
  });

  it("#19 Mikrosekunden-Padding: ms 789 → .789000Z", () => {
    // 2026-04-22T10:15:30.789Z
    const d = new Date(Date.UTC(2026, 3, 22, 10, 15, 30, 789));
    expect(formatUtcTimestamp(d)).toBe("2026-04-22T10:15:30.789000Z");
  });

  it("#20 Einzeldigit-Komponenten zweistellig gepaddet", () => {
    const d = new Date(Date.UTC(2026, 0, 1, 0, 0, 1, 5));
    expect(formatUtcTimestamp(d)).toBe("2026-01-01T00:00:01.005000Z");
  });

  it("#21 ungültiges Date wirft", () => {
    expect(() => formatUtcTimestamp(new Date("invalid"))).toThrow(
      /ungültiges Date/
    );
  });
});
