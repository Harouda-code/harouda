import Decimal from "decimal.js";

// GoBD Rz. 58: Richtigkeit der Aufzeichnungen. HGB § 239 Abs. 2.
// Banker's Rounding (ROUND_HALF_EVEN) ist handelsrechtlich konform
// und vermeidet den systematischen Bias von HALF_UP bei vielen Buchungen.
Decimal.set({
  precision: 28,
  rounding: Decimal.ROUND_HALF_EVEN,
  toExpNeg: -9,
  toExpPos: 21,
});

export type MoneyInput = Decimal | string | number;

export class Money {
  private readonly value: Decimal;

  constructor(input: MoneyInput) {
    if (typeof input === "number" && !Number.isFinite(input)) {
      throw new Error(`Money: invalid number input ${input}`);
    }
    this.value = new Decimal(input);
  }

  static zero(): Money {
    return new Money(0);
  }

  static fromCents(cents: number | string): Money {
    return new Money(new Decimal(cents).div(100));
  }

  plus(other: Money): Money {
    return new Money(this.value.plus(other.value));
  }

  minus(other: Money): Money {
    return new Money(this.value.minus(other.value));
  }

  times(factor: MoneyInput | Money): Money {
    const raw = factor instanceof Money ? factor.value : factor;
    return new Money(this.value.times(raw));
  }

  div(divisor: MoneyInput | Money): Money {
    const raw = divisor instanceof Money ? divisor.value : divisor;
    return new Money(this.value.div(raw));
  }

  abs(): Money {
    return new Money(this.value.abs());
  }

  neg(): Money {
    return new Money(this.value.neg());
  }

  isZero(): boolean {
    return this.value.isZero();
  }

  isNegative(): boolean {
    // Strikt < 0 (decimal.js behandelt +0 als "positive" — wir wollen strikte Semantik).
    return this.value.isNegative() && !this.value.isZero();
  }

  isPositive(): boolean {
    // Strikt > 0 (decimal.js' isPositive inkludiert 0 — wir wollen strikt).
    return this.value.isPositive() && !this.value.isZero();
  }

  equals(other: Money): boolean {
    return this.value.equals(other.value);
  }

  greaterThan(other: Money): boolean {
    return this.value.gt(other.value);
  }

  lessThan(other: Money): boolean {
    return this.value.lt(other.value);
  }

  toFixed2(): string {
    return this.value.toFixed(2);
  }

  toString(): string {
    return this.value.toString();
  }

  toCents(): string {
    return this.value.times(100).toFixed(0);
  }

  toEuroFormat(): string {
    return new Intl.NumberFormat("de-DE", {
      style: "currency",
      currency: "EUR",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(this.value.toNumber());
  }

  toNumber(): number {
    return this.value.toNumber();
  }

  toJSON(): string {
    return this.toString();
  }
}

export const money = (v: MoneyInput): Money => new Money(v);
export const ZERO = Money.zero();
