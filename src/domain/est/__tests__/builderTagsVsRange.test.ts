// Phase 3 / Schritt 7 · Verifikation: Builder lesen Tags, nicht Ranges.
//
// Die 25 AnlageG/S-Builder-Tests aus Schritt 5 funktionieren mit tag-
// befüllten Accounts (via tagsForKonto-Factory). Hier gezielt Fälle, die
// beweisen, dass die Tag-Achse regiert und nicht die Range-Achse.

import { describe, it, expect, beforeEach, vi } from "vitest";
import type { Account, JournalEntry } from "../../../types/db";
import { buildAnlageG } from "../AnlageGBuilder";
import { buildAnlageS } from "../AnlageSBuilder";

function makeEntry(
  datum: string,
  soll: string,
  haben: string,
  betrag: number
): JournalEntry {
  return {
    id: `e-${datum}-${soll}-${haben}`,
    datum,
    beleg_nr: "B",
    beschreibung: "B",
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
  };
}

function makeAccount(
  konto_nr: string,
  kategorie: Account["kategorie"],
  tags: string[] | undefined | null
): Account {
  return {
    id: `id-${konto_nr}`,
    konto_nr,
    bezeichnung: `Konto ${konto_nr}`,
    kategorie,
    ust_satz: null,
    skr: "SKR03",
    is_active: true,
    tags,
  };
}

const WJ = { von: "2025-01-01", bis: "2025-12-31" };
const BANK = makeAccount("1200", "aktiva", []);

describe("Builder · Tag-Read regiert, nicht Range", () => {
  let warnSpy: ReturnType<typeof vi.spyOn>;
  beforeEach(() => {
    vi.restoreAllMocks();
    warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  it("#1 Custom-Konto 9999 ausserhalb Range mit explizitem Tag fliesst in umsaetze", () => {
    // 9999 ist NICHT in 8300-8499 — unter reinem Range-Mapping unmapped.
    // Mit Tag ["anlage-g:umsaetze"] muss der Builder es trotzdem
    // zuordnen.
    const acc = makeAccount("9999", "ertrag", ["anlage-g:umsaetze"]);
    const r = buildAnlageG({
      accounts: [acc, BANK],
      entries: [makeEntry("2025-03-15", "1200", "9999", 1234)],
      wirtschaftsjahr: WJ,
    });
    expect(r.summen.umsaetze).toBe(1234);
    expect(r.unmappedAccounts).not.toContain("9999");
    expect(warnSpy).not.toHaveBeenCalled();
  });

  it("#2 Konto 8400 mit explizit leerem tags-Array fliesst NICHT in umsaetze", () => {
    // 8400 liegt in der Range 8300-8499 — per Range-Mapping wäre es
    // umsaetze. Mit explizit leerem tags-Array: kein Match, strict.
    const acc = makeAccount("8400", "ertrag", []);
    const r = buildAnlageG({
      accounts: [acc, BANK],
      entries: [makeEntry("2025-03-15", "1200", "8400", 1000)],
      wirtschaftsjahr: WJ,
    });
    expect(r.summen.umsaetze).toBeUndefined();
    expect(r.unmappedAccounts).toContain("8400");
    expect(warnSpy).not.toHaveBeenCalled();
  });

  it("#3 Konto 8400 mit tags=undefined → Range-Fallback + Warn", () => {
    const acc = makeAccount("8400", "ertrag", undefined);
    const r = buildAnlageG({
      accounts: [acc, BANK],
      entries: [makeEntry("2025-03-15", "1200", "8400", 2500)],
      wirtschaftsjahr: WJ,
    });
    expect(r.summen.umsaetze).toBe(2500);
    expect(warnSpy).toHaveBeenCalled();
    const firstWarnMsg = String(warnSpy.mock.calls[0]?.[0] ?? "");
    expect(firstWarnMsg).toMatch(/Konto 8400/);
    expect(firstWarnMsg).toMatch(/Fallback auf Range-Mapping/);
    expect(firstWarnMsg).toMatch(/Migration 0029/);
  });

  it("#3b Konto mit tags=null → Fallback analog zu undefined", () => {
    const acc = makeAccount("8400", "ertrag", null);
    const r = buildAnlageG({
      accounts: [acc, BANK],
      entries: [makeEntry("2025-03-15", "1200", "8400", 500)],
      wirtschaftsjahr: WJ,
    });
    expect(r.summen.umsaetze).toBe(500);
    expect(warnSpy).toHaveBeenCalled();
  });

  it("#4 Konto mit G+S-Tags fliesst in BEIDE Anlagen", () => {
    const acc = makeAccount("4110", "aufwand", [
      "anlage-g:personal",
      "anlage-s:personal",
    ]);
    const entries = [makeEntry("2025-03-01", "4110", "1200", 3000)];
    const rG = buildAnlageG({
      accounts: [acc, BANK],
      entries,
      wirtschaftsjahr: WJ,
    });
    const rS = buildAnlageS({
      accounts: [acc, BANK],
      entries,
      wirtschaftsjahr: WJ,
    });
    expect(rG.summen.personal).toBe(3000);
    expect(rS.summen.personal).toBe(3000);
    expect(warnSpy).not.toHaveBeenCalled();
  });

  it("#5 Widersprüchliche Mehrfach-Tags innerhalb einer Anlage → erster gewinnt + Warn", () => {
    // Input-Reihenfolge: umsaetze, personal. Resolver filtert nach
    // Prefix, behält Input-Order → umsaetze gewinnt.
    const acc = makeAccount("4110", "aufwand", [
      "anlage-g:umsaetze",
      "anlage-g:personal",
    ]);
    const r = buildAnlageG({
      accounts: [acc, BANK],
      entries: [makeEntry("2025-03-01", "4110", "1200", 1500)],
      wirtschaftsjahr: WJ,
    });
    // Aufwand-Konto → soll-haben = 1500; wird im ERSTEN Tag-Feld
    // umsaetze aggregiert (auch wenn das fachlich Unsinn ist — der
    // Test zielt auf die „erster gewinnt"-Regel).
    expect(r.summen.umsaetze).toBe(1500);
    expect(r.summen.personal).toBeUndefined();
    expect(warnSpy).toHaveBeenCalled();
    const warnMsg = String(warnSpy.mock.calls[0]?.[0] ?? "");
    expect(warnMsg).toMatch(/mehrere Tags/);
    expect(warnMsg).toMatch(/Erster gewinnt/);
  });

  it("#6 Non-Range-Konto mit S-only-Tag erscheint nur in AnlageS", () => {
    // Beweist, dass Tags-for-Anlage-X wirklich eine Anlage-Achse sind.
    const acc = makeAccount("7777", "aufwand", ["anlage-s:beratung"]);
    const entries = [makeEntry("2025-03-01", "7777", "1200", 800)];
    const rG = buildAnlageG({
      accounts: [acc, BANK],
      entries,
      wirtschaftsjahr: WJ,
    });
    const rS = buildAnlageS({
      accounts: [acc, BANK],
      entries,
      wirtschaftsjahr: WJ,
    });
    expect(rG.summen.beratung).toBeUndefined();
    expect(rG.unmappedAccounts).toContain("7777");
    expect(rS.summen.beratung).toBe(800);
  });
});
