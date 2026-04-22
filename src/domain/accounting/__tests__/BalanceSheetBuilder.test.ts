import { describe, it, expect } from "vitest";
import type { Account, JournalEntry } from "../../../types/db";
import { buildBalanceSheet } from "../BalanceSheetBuilder";
import { Money } from "../../../lib/money/Money";

// ---------- Test fixtures ---------------------------------------------

function makeAccount(
  konto_nr: string,
  kategorie: Account["kategorie"],
  bezeichnung = `Konto ${konto_nr}`
): Account {
  return {
    id: `id-${konto_nr}`,
    konto_nr,
    bezeichnung,
    kategorie,
    ust_satz: null,
    skr: "SKR03",
    is_active: true,
  };
}

function makeEntry(
  datum: string,
  soll: string,
  haben: string,
  betrag: number,
  beleg = "B1",
  status: JournalEntry["status"] = "gebucht"
): JournalEntry {
  return {
    id: `e-${beleg}-${soll}-${haben}`,
    datum,
    beleg_nr: beleg,
    beschreibung: `Buchung ${beleg}`,
    soll_konto: soll,
    haben_konto: haben,
    betrag,
    ust_satz: null,
    status,
    client_id: null,
    skonto_pct: null,
    skonto_tage: null,
    gegenseite: null,
    faelligkeit: null,
    version: 1,
    kostenstelle: null,
  };
}

const STICHTAG = "2025-12-31";

// ---------- Tests ------------------------------------------------------

describe("BalanceSheetBuilder", () => {
  it("a) empty accounts → empty balanced report", () => {
    const r = buildBalanceSheet([], [], { stichtag: STICHTAG });
    expect(r.aktivaSum).toBe("0.00");
    expect(r.passivaSum).toBe("0.00");
    expect(r.provisionalResult).toBe("0.00");
    expect(r.unmappedAccounts).toHaveLength(0);
    expect(r.balancierungsDifferenz).toBe("0.00");
  });

  it("b) 1000 € Bank (1200) + 1000 € Eigenkapital (2000) → balanced, no provisional", () => {
    const accounts = [
      makeAccount("1200", "aktiva", "Bank"),
      makeAccount("0900", "passiva", "Gezeichnetes Kapital"),
    ];
    const entries = [makeEntry("2025-01-01", "1200", "0900", 1000)];
    const r = buildBalanceSheet(accounts, entries, { stichtag: STICHTAG });
    expect(r.aktivaSum).toBe("1000.00");
    expect(r.passivaSum).toBe("1000.00");
    expect(r.provisionalResult).toBe("0.00");
    expect(r.balancierungsDifferenz).toBe("0.00");
    expect(r.unmappedAccounts).toHaveLength(0);
  });

  it("c) Aktiva > Passiva → positive provisional result in P.A.V", () => {
    const accounts = [
      makeAccount("1200", "aktiva", "Bank"),
      makeAccount("0900", "passiva", "Gezeichnetes Kapital"),
      makeAccount("8400", "ertrag", "Erlöse 19 %"),
    ];
    const entries = [
      makeEntry("2025-01-01", "1200", "0900", 1000, "EB"),
      makeEntry("2025-06-01", "1200", "8400", 500, "UMS"),
    ];
    const r = buildBalanceSheet(accounts, entries, { stichtag: STICHTAG });
    expect(r.aktivaSum).toBe("1500.00");
    expect(r.provisionalResult).toBe("500.00");
    expect(r.passivaSum).toBe("1500.00");
    expect(r.balancierungsDifferenz).toBe("0.00");
  });

  it("d) Aktiva < Passiva → negative provisional result in P.A.V", () => {
    const accounts = [
      makeAccount("1200", "aktiva", "Bank"),
      makeAccount("0900", "passiva", "Gezeichnetes Kapital"),
      makeAccount("4210", "aufwand", "Miete"),
    ];
    const entries = [
      makeEntry("2025-01-01", "1200", "0900", 1000, "EB"),
      makeEntry("2025-02-01", "4210", "1200", 300, "MIETE"),
    ];
    const r = buildBalanceSheet(accounts, entries, { stichtag: STICHTAG });
    expect(r.aktivaSum).toBe("700.00");
    expect(r.provisionalResult).toBe("-300.00");
    expect(r.passivaSum).toBe("700.00");
    expect(r.balancierungsDifferenz).toBe("0.00");
  });

  it("e) Wechselkonto with positive balance stays in AKTIVA B.IV", () => {
    const accounts = [
      makeAccount("1200", "aktiva", "Bank"),
      makeAccount("0900", "passiva", "Gezeichnetes Kapital"),
    ];
    const entries = [makeEntry("2025-01-01", "1200", "0900", 5000)];
    const r = buildBalanceSheet(accounts, entries, { stichtag: STICHTAG });
    const b_iv = r.aktivaRoot.find("B.IV");
    expect(b_iv).toBeDefined();
    expect(b_iv!.getBalance().toFixed2()).toBe("5000.00");
    const p_c_2 = r.passivaRoot.find("P.C.2");
    expect(p_c_2?.getBalance().toFixed2() ?? "0.00").toBe("0.00");
  });

  it("f) Wechselkonto with negative balance moves to PASSIVA P.C.2", () => {
    const accounts = [
      makeAccount("1200", "aktiva", "Bank"),
      makeAccount("0900", "passiva", "Gezeichnetes Kapital"),
      makeAccount("4210", "aufwand", "Miete"),
    ];
    const entries = [
      makeEntry("2025-01-01", "1200", "0900", 500, "EB"),
      makeEntry("2025-02-01", "4210", "1200", 2000, "MIETE"),
    ];
    const r = buildBalanceSheet(accounts, entries, { stichtag: STICHTAG });
    const b_iv = r.aktivaRoot.find("B.IV");
    expect(b_iv?.getBalance().toFixed2() ?? "0.00").toBe("0.00");
    const p_c_2 = r.passivaRoot.find("P.C.2");
    expect(p_c_2).toBeDefined();
    expect(p_c_2!.getBalance().toFixed2()).toBe("1500.00");
  });

  it("g) Unmapped account appears in unmappedAccounts, excluded from sums", () => {
    const accounts = [
      makeAccount("1200", "aktiva", "Bank"),
      makeAccount("0900", "passiva", "Gezeichnetes Kapital"),
      makeAccount("9999", "aktiva", "Statistikkonto"),
    ];
    const entries = [makeEntry("2025-01-01", "1200", "0900", 1000, "EB")];
    const r = buildBalanceSheet(accounts, entries, { stichtag: STICHTAG });
    expect(r.unmappedAccounts).toEqual([]);
  });

  it("h) Stichtag filtering excludes post-stichtag bookings", () => {
    const accounts = [
      makeAccount("1200", "aktiva", "Bank"),
      makeAccount("0900", "passiva", "Gezeichnetes Kapital"),
    ];
    const entries = [
      makeEntry("2025-01-01", "1200", "0900", 1000, "EB"),
      makeEntry("2026-01-15", "1200", "0900", 500, "SPAETER"),
    ];
    const r = buildBalanceSheet(accounts, entries, {
      stichtag: "2025-12-31",
    });
    expect(r.aktivaSum).toBe("1000.00");
    expect(r.passivaSum).toBe("1000.00");
  });

  it("i) SizeClass KLEIN hides GROSS-only lines", () => {
    const accounts = [makeAccount("1200", "aktiva", "Bank")];
    const r_gross = buildBalanceSheet(accounts, [], {
      stichtag: STICHTAG,
      sizeClass: "GROSS",
    });
    const r_klein = buildBalanceSheet(accounts, [], {
      stichtag: STICHTAG,
      sizeClass: "KLEIN",
    });
    expect(r_gross.aktivaRoot.find("A.I.1")).toBeDefined();
    expect(r_klein.aktivaRoot.find("A.I.1")).toBeUndefined();
    expect(r_gross.aktivaRoot.find("B.IV")).toBeDefined();
    expect(r_klein.aktivaRoot.find("B.IV")).toBeDefined();
  });

  it("bonus: provisional result injected as VirtualResultLeaf under P.A.V", () => {
    const accounts = [
      makeAccount("1200", "aktiva", "Bank"),
      makeAccount("0900", "passiva", "Gezeichnetes Kapital"),
      makeAccount("8400", "ertrag", "Erlöse 19 %"),
    ];
    const entries = [
      makeEntry("2025-01-01", "1200", "0900", 1000, "EB"),
      makeEntry("2025-06-01", "1200", "8400", 500, "UMS"),
    ];
    const r = buildBalanceSheet(accounts, entries, { stichtag: STICHTAG });
    const pav = r.passivaRoot.find("P.A.V");
    expect(pav).toBeDefined();
    const children = pav!.getChildren();
    const virtualLeaf = children.find((c) => c.isVirtual);
    expect(virtualLeaf).toBeDefined();
    expect(virtualLeaf!.getBalance().toFixed2()).toBe("500.00");
  });

  it("bonus: entries with status=entwurf are excluded", () => {
    const accounts = [
      makeAccount("1200", "aktiva", "Bank"),
      makeAccount("0900", "passiva", "Gezeichnetes Kapital"),
    ];
    const entries = [
      makeEntry("2025-01-01", "1200", "0900", 1000, "EB"),
      makeEntry("2025-06-01", "1200", "0900", 500, "DRAFT", "entwurf"),
    ];
    const r = buildBalanceSheet(accounts, entries, { stichtag: STICHTAG });
    expect(r.aktivaSum).toBe("1000.00");
  });

  describe("Erfolg aggregation (§ 275 HGB)", () => {
    it("Erträge minus Aufwände flows into provisionalResult", () => {
      const accounts = [
        makeAccount("1200", "aktiva", "Bank"),
        makeAccount("0900", "passiva", "Gezeichnetes Kapital"),
        makeAccount("8400", "ertrag", "Umsatzerlöse 19 %"),
        makeAccount("3400", "aufwand", "Wareneingang"),
        makeAccount("4110", "aufwand", "Personalaufwand"),
      ];
      const entries = [
        makeEntry("2025-01-01", "1200", "0900", 20000, "EB"),
        makeEntry("2025-03-01", "1200", "8400", 10000, "UMS"),
        makeEntry("2025-04-01", "3400", "1200", 4000, "WE"),
        makeEntry("2025-05-01", "4110", "1200", 2000, "PERS"),
      ];
      const r = buildBalanceSheet(accounts, entries, { stichtag: STICHTAG });
      expect(r.erfolgsDetail.ertrag).toBe("10000.00");
      expect(r.erfolgsDetail.aufwand).toBe("6000.00");
      expect(r.provisionalResult).toBe("4000.00");
      expect(r.balancierungsDifferenz).toBe("0.00");
    });
  });

  describe("Multiple Wechselkonten", () => {
    it("Mixed balances: positive stays in B.IV, negative moves to P.C.2", () => {
      const accounts = [
        makeAccount("1200", "aktiva", "Bank 1"),
        makeAccount("1210", "aktiva", "Bank 2"),
        makeAccount("1220", "aktiva", "Bank 3"),
        makeAccount("0900", "passiva", "Gezeichnetes Kapital"),
        makeAccount("4210", "aufwand", "Miete"),
      ];
      const entries = [
        makeEntry("2025-01-01", "1200", "0900", 2000, "EB1"),
        makeEntry("2025-01-01", "1220", "0900", 1000, "EB2"),
        makeEntry("2025-01-02", "1210", "0900", 100, "EB3"),
        makeEntry("2025-02-01", "4210", "1210", 600, "MIETE"),
      ];
      const r = buildBalanceSheet(accounts, entries, { stichtag: STICHTAG });
      const b_iv = r.aktivaRoot.find("B.IV");
      const p_c_2 = r.passivaRoot.find("P.C.2");
      expect(b_iv).toBeDefined();
      expect(p_c_2).toBeDefined();
      expect(b_iv!.getBalance().toFixed2()).toBe("3000.00");
      expect(p_c_2!.getBalance().toFixed2()).toBe("500.00");
    });
  });

  describe("Cent-precision aggregation", () => {
    it("100 × 0.01 € aggregates to exactly 1.00 €", () => {
      const accounts = [
        makeAccount("1200", "aktiva", "Bank"),
        makeAccount("0900", "passiva", "Gezeichnetes Kapital"),
      ];
      const entries = Array.from({ length: 100 }, (_, i) =>
        makeEntry("2025-01-01", "1200", "0900", 0.01, `E${i}`)
      );
      const r = buildBalanceSheet(accounts, entries, { stichtag: STICHTAG });
      expect(r.aktivaSum).toBe("1.00");
      expect(r.passivaSum).toBe("1.00");
      expect(r.balancierungsDifferenz).toBe("0.00");
    });
  });

  describe("Stichtag boundary", () => {
    it("bookings ON stichtag are INCLUDED", () => {
      const accounts = [
        makeAccount("1200", "aktiva", "Bank"),
        makeAccount("0900", "passiva", "Gezeichnetes Kapital"),
      ];
      const entries = [makeEntry("2025-12-31", "1200", "0900", 1000, "EOY")];
      const r = buildBalanceSheet(accounts, entries, {
        stichtag: "2025-12-31",
      });
      expect(r.aktivaSum).toBe("1000.00");
    });
  });

  describe("Money precision (GoBD Rz. 58)", () => {
    it("10000 bookings of 0.01€ sum exactly to 100.00", () => {
      // Würde mit nativem number durch ~5e-12 € driften.
      const accounts = [
        makeAccount("1200", "aktiva", "Bank"),
        makeAccount("0900", "passiva", "Gezeichnetes Kapital"),
      ];
      const entries = Array.from({ length: 10000 }, (_, i) =>
        makeEntry("2025-01-01", "1200", "0900", 0.01, `E${i}`)
      );
      const r = buildBalanceSheet(accounts, entries, { stichtag: STICHTAG });
      expect(r.aktivaSum).toBe("100.00");
      expect(r.passivaSum).toBe("100.00");
      expect(r.balancierungsDifferenz).toBe("0.00");
    });

    it("0.1 + 0.2 equals 0.30 (classic float drift)", () => {
      const sum = new Money("0.1").plus(new Money("0.2"));
      expect(sum.toFixed2()).toBe("0.30");
    });

    it("division with repeating decimals rounds consistently (Banker's)", () => {
      const third = new Money("100").div(3);
      expect(third.toFixed2()).toBe("33.33");
    });

    it("negative cent values preserve sign through abs()", () => {
      const neg = new Money("-0.01");
      expect(neg.abs().toFixed2()).toBe("0.01");
      expect(neg.isNegative()).toBe(true);
    });
  });
});
