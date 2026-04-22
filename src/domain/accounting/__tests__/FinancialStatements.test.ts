import { describe, it, expect } from "vitest";
import type { Account, JournalEntry } from "../../../types/db";
import { buildJahresabschluss } from "../FinancialStatements";

function makeAccount(
  konto_nr: string,
  kategorie: Account["kategorie"]
): Account {
  return {
    id: `id-${konto_nr}`,
    konto_nr,
    bezeichnung: `Konto ${konto_nr}`,
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
  beleg = "B1"
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
    status: "gebucht",
    client_id: null,
    skonto_pct: null,
    skonto_tage: null,
    gegenseite: null,
    faelligkeit: null,
    version: 1,
    kostenstelle: null,
  };
}

const OPTS = { periodStart: "2025-01-01", stichtag: "2025-12-31" } as const;

describe("FinancialStatements cross-check", () => {
  it("Bilanz.provisionalResult === GuV.jahresergebnis for common accounts", () => {
    // Use accounts both mappings agree on: 8400 (Ertrag), 4100 (Lohn), 3400 (Waren).
    const accounts = [
      makeAccount("1200", "aktiva"),
      makeAccount("0900", "passiva"),
      makeAccount("8400", "ertrag"),
      makeAccount("4100", "aufwand"),
      makeAccount("3400", "aufwand"),
    ];
    const entries = [
      makeEntry("2025-01-01", "1200", "0900", 10000, "EB"),
      makeEntry("2025-03-01", "1200", "8400", 8000, "UMS"),
      makeEntry("2025-04-01", "4100", "1200", 2000, "LOHN"),
      makeEntry("2025-05-01", "3400", "1200", 1500, "WAREN"),
    ];
    const r = buildJahresabschluss(accounts, entries, OPTS);
    // Beide sollten 8000 - 2000 - 1500 = 4500 zeigen
    expect(r.crossCheck.bilanzProvisionalResult).toBe("4500.00");
    expect(r.crossCheck.guvJahresergebnis).toBe("4500.00");
    expect(r.crossCheck.matches).toBe(true);
    expect(r.crossCheck.withinCentTolerance).toBe(true);
    expect(r.isConsistent).toBe(true);
    expect(r.inconsistencies).toEqual([]);
  });

  it("matches with KSt/GewSt/Finanzerträge accounts (previously broken by gap)", () => {
    // 7600 KSt, 7610 GewSt, 2600 Beteiligungsertrag waren früher nur in der
    // GuV-Mapping; nach Derivation der SKR03_ERFOLG_RULES aus SKR03_GUV_MAPPING
    // sind sie auch in Bilanz.provisionalResult berücksichtigt → Cross-Check
    // matcht exakt (GoBD Rz. 58).
    const accounts = [
      makeAccount("1200", "aktiva"),
      makeAccount("0900", "passiva"),
      makeAccount("8400", "ertrag"),
      makeAccount("2600", "ertrag"),
      makeAccount("7600", "aufwand"),
      makeAccount("7610", "aufwand"),
    ];
    const entries = [
      makeEntry("2025-01-01", "1200", "0900", 10000, "EB"),
      makeEntry("2025-03-01", "1200", "8400", 5000, "UMS"),
      makeEntry("2025-03-02", "1200", "2600", 800, "BET"),
      makeEntry("2025-06-01", "7600", "1200", 1000, "KST"),
      makeEntry("2025-06-02", "7610", "1200", 300, "GEWSTeuer"),
    ];
    const r = buildJahresabschluss(accounts, entries, OPTS);
    // 5000 + 800 - 1000 - 300 = 4500
    expect(r.crossCheck.bilanzProvisionalResult).toBe("4500.00");
    expect(r.crossCheck.guvJahresergebnis).toBe("4500.00");
    expect(r.crossCheck.matches).toBe(true);
    expect(r.crossCheck.withinCentTolerance).toBe(true);
    expect(r.isConsistent).toBe(true);
    expect(r.inconsistencies).toEqual([]);
  });

  it("empty data → fully consistent (0 vs 0)", () => {
    const r = buildJahresabschluss([], [], OPTS);
    expect(r.crossCheck.matches).toBe(true);
    expect(r.isConsistent).toBe(true);
    expect(r.bilanz.aktivaSum).toBe("0.00");
    expect(r.guv.jahresergebnis).toBe("0.00");
  });

  it("returns both reports with correct period and sizeClass", () => {
    const r = buildJahresabschluss([], [], { ...OPTS, sizeClass: "KLEIN" });
    expect(r.bilanz.stichtag).toBe("2025-12-31");
    expect(r.bilanz.sizeClass).toBe("KLEIN");
    expect(r.guv.periodStart).toBe("2025-01-01");
    expect(r.guv.periodEnd).toBe("2025-12-31");
    expect(r.guv.sizeClass).toBe("KLEIN");
  });
});
