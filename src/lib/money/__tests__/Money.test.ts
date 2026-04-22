import { describe, it, expect } from "vitest";
import Decimal from "decimal.js";
import { Money, money, ZERO } from "../Money";
import { sumMoney } from "../sum";

describe("Money", () => {
  describe("Construction", () => {
    it("accepts number input", () => {
      expect(new Money(100).toFixed2()).toBe("100.00");
    });

    it("accepts string input", () => {
      expect(new Money("1234.56").toFixed2()).toBe("1234.56");
    });

    it("accepts Decimal input", () => {
      expect(new Money(new Decimal("42.42")).toFixed2()).toBe("42.42");
    });

    it("rejects NaN", () => {
      expect(() => new Money(NaN)).toThrow(/invalid number input/);
    });

    it("rejects Infinity", () => {
      expect(() => new Money(Infinity)).toThrow(/invalid number input/);
      expect(() => new Money(-Infinity)).toThrow(/invalid number input/);
    });

    it("money() factory returns Money instance", () => {
      expect(money("5").equals(new Money("5"))).toBe(true);
    });

    it("ZERO is the additive identity", () => {
      expect(ZERO.isZero()).toBe(true);
      expect(ZERO.plus(new Money("3.14")).toFixed2()).toBe("3.14");
    });

    it("Money.zero() returns 0", () => {
      expect(Money.zero().toFixed2()).toBe("0.00");
    });

    it("Money.fromCents(100) equals Money(1)", () => {
      expect(Money.fromCents(100).toFixed2()).toBe("1.00");
      expect(Money.fromCents("12345").toFixed2()).toBe("123.45");
    });
  });

  describe("Arithmetic", () => {
    it("plus is correct", () => {
      expect(new Money("1.1").plus(new Money("2.2")).toFixed2()).toBe("3.30");
    });

    it("minus is correct", () => {
      expect(new Money("5").minus(new Money("2.5")).toFixed2()).toBe("2.50");
    });

    it("times is correct with number factor", () => {
      expect(new Money("10").times(1.19).toFixed2()).toBe("11.90");
    });

    it("times is correct with string factor", () => {
      expect(new Money("10").times("1.19").toFixed2()).toBe("11.90");
    });

    it("div handles whole division", () => {
      expect(new Money("10").div(2).toFixed2()).toBe("5.00");
    });

    it("div with repeating decimal rounds to 2dp on toFixed2", () => {
      // 10 / 3 = 3.333... → "3.33" mit ROUND_HALF_EVEN
      expect(new Money("10").div(3).toFixed2()).toBe("3.33");
    });

    it("abs flips negative to positive", () => {
      expect(new Money("-5.50").abs().toFixed2()).toBe("5.50");
    });

    it("neg flips sign", () => {
      expect(new Money("5.50").neg().toFixed2()).toBe("-5.50");
      expect(new Money("-3").neg().toFixed2()).toBe("3.00");
    });
  });

  describe("Immutability", () => {
    it("plus returns new instance, does not mutate", () => {
      const a = new Money("1");
      const b = a.plus(new Money("2"));
      expect(a.toFixed2()).toBe("1.00");
      expect(b.toFixed2()).toBe("3.00");
      expect(a).not.toBe(b);
    });

    it("minus, times, div, abs, neg all return new instance", () => {
      const a = new Money("10");
      expect(a.minus(new Money("1"))).not.toBe(a);
      expect(a.times(2)).not.toBe(a);
      expect(a.div(2)).not.toBe(a);
      expect(a.abs()).not.toBe(a);
      expect(a.neg()).not.toBe(a);
    });
  });

  describe("Comparison", () => {
    it("isZero", () => {
      expect(new Money("0").isZero()).toBe(true);
      expect(new Money("0.00").isZero()).toBe(true);
      expect(new Money("0.001").isZero()).toBe(false);
    });

    it("isNegative / isPositive", () => {
      expect(new Money("-1").isNegative()).toBe(true);
      expect(new Money("-1").isPositive()).toBe(false);
      expect(new Money("1").isPositive()).toBe(true);
      expect(new Money("0").isPositive()).toBe(false);
      expect(new Money("0").isNegative()).toBe(false);
    });

    it("equals", () => {
      expect(new Money("100").equals(new Money("100.00"))).toBe(true);
      expect(new Money("100").equals(new Money("100.01"))).toBe(false);
    });

    it("greaterThan / lessThan", () => {
      const a = new Money("5");
      const b = new Money("3");
      expect(a.greaterThan(b)).toBe(true);
      expect(b.lessThan(a)).toBe(true);
      expect(a.lessThan(b)).toBe(false);
      expect(a.greaterThan(a)).toBe(false);
    });
  });

  describe("Serialization", () => {
    it("toFixed2 always returns 2 decimals", () => {
      expect(new Money(100).toFixed2()).toBe("100.00");
      expect(new Money("0").toFixed2()).toBe("0.00");
      expect(new Money("0.1").toFixed2()).toBe("0.10");
    });

    it("toString returns raw decimal", () => {
      expect(new Money("1.5").toString()).toBe("1.5");
    });

    it("toCents returns integer string", () => {
      expect(new Money("1.23").toCents()).toBe("123");
      expect(new Money("100").toCents()).toBe("10000");
      expect(new Money("0").toCents()).toBe("0");
    });

    it("toEuroFormat returns de-DE currency format", () => {
      const s = new Money("1234.56").toEuroFormat();
      // Normalize: Intl may use narrow no-break space (U+202F) instead of regular space.
      const normalized = s.replace(/[\u00A0\u202F]/g, " ");
      expect(normalized).toMatch(/1\.234,56\s*€/);
    });

    it("toNumber escape hatch returns native number", () => {
      expect(new Money("100").toNumber()).toBe(100);
    });

    it("toJSON returns string (JSON.stringify yields quoted value)", () => {
      const m = new Money("42.42");
      expect(m.toJSON()).toBe("42.42");
      expect(JSON.stringify({ amount: m })).toBe('{"amount":"42.42"}');
    });
  });

  describe("Banker's Rounding (ROUND_HALF_EVEN)", () => {
    // Decimal.toDP(0, ROUND_HALF_EVEN): ties round to even digit.
    it("2.5 rounds to 2 (even) at 0 decimals", () => {
      const r = new Decimal("2.5").toDP(0, Decimal.ROUND_HALF_EVEN).toString();
      expect(r).toBe("2");
    });

    it("3.5 rounds to 4 (even) at 0 decimals", () => {
      const r = new Decimal("3.5").toDP(0, Decimal.ROUND_HALF_EVEN).toString();
      expect(r).toBe("4");
    });

    it("0.125 rounds to 0.12 (even) at 2 decimals", () => {
      // toFixed(2) respects the global rounding config
      expect(new Money("0.125").toFixed2()).toBe("0.12");
    });

    it("0.135 rounds to 0.14 (even) at 2 decimals", () => {
      expect(new Money("0.135").toFixed2()).toBe("0.14");
    });
  });

  describe("sumMoney", () => {
    it("sums an array of Money", () => {
      const sum = sumMoney([
        new Money("1.10"),
        new Money("2.20"),
        new Money("3.30"),
      ]);
      expect(sum.toFixed2()).toBe("6.60");
    });

    it("empty array → zero", () => {
      expect(sumMoney([]).isZero()).toBe(true);
    });

    it("1000 × 0.01 sums to 10.00 exactly (no drift)", () => {
      const arr = Array.from({ length: 1000 }, () => new Money("0.01"));
      expect(sumMoney(arr).toFixed2()).toBe("10.00");
    });
  });
});
