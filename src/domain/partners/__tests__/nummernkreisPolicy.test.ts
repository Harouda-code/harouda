// Sprint 19.B · nummernkreisPolicy-Tests.

import { describe, it, expect } from "vitest";
import {
  DEBITOR_RANGE,
  KREDITOR_RANGE,
  validateNummernkreis,
  validateTypeAndNummern,
} from "../nummernkreisPolicy";

describe("Nummernkreis-Konstanten", () => {
  it("#1 DEBITOR_RANGE = 10000..69999", () => {
    expect(DEBITOR_RANGE).toEqual({ start: 10000, end: 69999 });
  });

  it("#2 KREDITOR_RANGE = 70000..99999", () => {
    expect(KREDITOR_RANGE).toEqual({ start: 70000, end: 99999 });
  });
});

describe("validateNummernkreis", () => {
  it("#3 Debitor im Bereich ist valid", () => {
    expect(validateNummernkreis("debitor", 10000).valid).toBe(true);
    expect(validateNummernkreis("debitor", 69999).valid).toBe(true);
  });

  it("#4 Debitor oberhalb → invalid", () => {
    expect(validateNummernkreis("debitor", 70000).valid).toBe(false);
  });

  it("#5 Kreditor im Bereich ist valid", () => {
    expect(validateNummernkreis("kreditor", 70000).valid).toBe(true);
    expect(validateNummernkreis("kreditor", 99999).valid).toBe(true);
  });

  it("#6 Kreditor unterhalb → invalid", () => {
    expect(validateNummernkreis("kreditor", 69999).valid).toBe(false);
  });

  it("#7 Nicht-integer → invalid", () => {
    expect(validateNummernkreis("debitor", 10000.5).valid).toBe(false);
  });
});

describe("validateTypeAndNummern", () => {
  it("#8 Typ=debitor braucht debitor_nummer", () => {
    expect(validateTypeAndNummern("debitor", null, null).valid).toBe(false);
    expect(validateTypeAndNummern("debitor", 10000, null).valid).toBe(true);
  });

  it("#9 Typ=kreditor braucht kreditor_nummer", () => {
    expect(validateTypeAndNummern("kreditor", null, null).valid).toBe(false);
    expect(validateTypeAndNummern("kreditor", null, 70000).valid).toBe(true);
  });

  it("#10 Typ=both braucht beide Nummern", () => {
    expect(validateTypeAndNummern("both", 10000, null).valid).toBe(false);
    expect(validateTypeAndNummern("both", null, 70000).valid).toBe(false);
    expect(validateTypeAndNummern("both", 10000, 70000).valid).toBe(true);
  });

  it("#11 Typ=debitor + debitor-Nummer out-of-range → invalid", () => {
    expect(validateTypeAndNummern("debitor", 80000, null).valid).toBe(false);
  });
});
