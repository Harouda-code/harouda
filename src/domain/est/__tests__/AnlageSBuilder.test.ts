// Phase 3 / Schritt 5 · AnlageSBuilder-Tests.
// Analog AnlageGBuilder.test.ts, fokus auf S-spezifische Feld-Namen
// (honorare, reisen, fortbildung, versicherung, sonstige).

import { describe, it, expect } from "vitest";
import type { Account, JournalEntry } from "../../../types/db";
import { buildAnlageS } from "../AnlageSBuilder";
import { buildAnlageG } from "../AnlageGBuilder";
import { tagsForKonto } from "../tagsForKonto";

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
    tags: tagsForKonto(konto_nr),
  };
}

function makeEntry(
  datum: string,
  soll: string,
  haben: string,
  betrag: number,
  beleg = "B",
  status: JournalEntry["status"] = "gebucht"
): JournalEntry {
  return {
    id: `e-${beleg}-${datum}-${soll}-${haben}`,
    datum,
    beleg_nr: beleg,
    beschreibung: beleg,
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
  };
}

const WJ = { von: "2025-01-01", bis: "2025-12-31" };

const DEFAULT_ACCOUNTS: Account[] = [
  makeAccount("8400", "ertrag", "Honorare 19 %"),
  makeAccount("8300", "ertrag", "Honorare 7 %"),
  makeAccount("8100", "ertrag", "steuerfreie Einnahmen"),
  makeAccount("2700", "ertrag", "Anlagenabgang"),
  makeAccount("8910", "ertrag", "Entnahmen"),
  makeAccount("4110", "aufwand", "Gehälter"),
  makeAccount("4210", "aufwand", "Miete"),
  makeAccount("4500", "aufwand", "Kfz"),
  makeAccount("4660", "aufwand", "Reisekosten"),
  makeAccount("4670", "aufwand", "Fortbildung"),
  makeAccount("4360", "aufwand", "Versicherungen"),
  makeAccount("4920", "aufwand", "Telekom"),
  makeAccount("4950", "aufwand", "Steuerberatung"),
  makeAccount("4800", "aufwand", "AfA"),
  makeAccount("4900", "aufwand", "Sonstiger Aufwand"),
  makeAccount("1200", "aktiva", "Bank"),
  makeAccount("1400", "aktiva", "Forderungen"),
];

describe("AnlageSBuilder · Grundlagen", () => {
  it("#1 Leeres Entry-Set: Report mit leeren summen/positionen", () => {
    const r = buildAnlageS({
      accounts: DEFAULT_ACCOUNTS,
      entries: [],
      wirtschaftsjahr: WJ,
    });
    expect(r.summen).toEqual({});
    expect(r.positionen).toEqual([]);
    expect(r.unmappedAccounts).toEqual([]);
  });

  it("#2 Einzelner Umsatz auf 8400 landet in summen.honorare (nicht umsaetze)", () => {
    const r = buildAnlageS({
      accounts: DEFAULT_ACCOUNTS,
      entries: [makeEntry("2025-03-15", "1200", "8400", 1500)],
      wirtschaftsjahr: WJ,
    });
    expect(r.summen.honorare).toBe(1500);
    expect(r.summen.umsaetze).toBeUndefined();
    expect(r.positionen[0].feld).toBe("honorare");
  });

  it("#3 Mehrere Entries im Honorar-Feld: sum aggregiert", () => {
    const r = buildAnlageS({
      accounts: DEFAULT_ACCOUNTS,
      entries: [
        makeEntry("2025-02-01", "1200", "8400", 2000, "H1"),
        makeEntry("2025-04-01", "1200", "8400", 1500, "H2"),
        makeEntry("2025-06-01", "1200", "8300", 500, "H3"),
      ],
      wirtschaftsjahr: WJ,
    });
    expect(r.summen.honorare).toBe(4000);
  });

  it("#4 Entry außerhalb wirtschaftsjahr wird ignoriert", () => {
    const r = buildAnlageS({
      accounts: DEFAULT_ACCOUNTS,
      entries: [
        makeEntry("2024-12-31", "1200", "8400", 999, "old"),
        makeEntry("2026-01-01", "1200", "8400", 888, "future"),
        makeEntry("2025-07-15", "1200", "8400", 100, "in-range"),
      ],
      wirtschaftsjahr: WJ,
    });
    expect(r.summen.honorare).toBe(100);
  });

  it("#5 Entry mit status != 'gebucht' wird ignoriert", () => {
    const r = buildAnlageS({
      accounts: DEFAULT_ACCOUNTS,
      entries: [
        makeEntry("2025-03-01", "1200", "8400", 1000, "entw", "entwurf"),
        makeEntry("2025-03-02", "1200", "8400", 300, "geb", "gebucht"),
      ],
      wirtschaftsjahr: WJ,
    });
    expect(r.summen.honorare).toBe(300);
  });
});

describe("AnlageSBuilder · Ausgaben-Felder (source=AUSGABE)", () => {
  it("#6a Personal auf 4110: summen.personal korrekt", () => {
    const r = buildAnlageS({
      accounts: DEFAULT_ACCOUNTS,
      entries: [makeEntry("2025-03-01", "4110", "1200", 2500)],
      wirtschaftsjahr: WJ,
    });
    expect(r.summen.personal).toBe(2500);
  });

  it("#6b Reisekosten auf 4660: summen.reisen korrekt", () => {
    const r = buildAnlageS({
      accounts: DEFAULT_ACCOUNTS,
      entries: [makeEntry("2025-04-01", "4660", "1200", 800)],
      wirtschaftsjahr: WJ,
    });
    expect(r.summen.reisen).toBe(800);
  });

  it("#6c Fortbildung auf 4670: summen.fortbildung korrekt", () => {
    const r = buildAnlageS({
      accounts: DEFAULT_ACCOUNTS,
      entries: [
        makeEntry("2025-05-01", "4670", "1200", 500, "buch-1"),
        makeEntry("2025-05-15", "4670", "1200", 250, "buch-2"),
      ],
      wirtschaftsjahr: WJ,
    });
    expect(r.summen.fortbildung).toBe(750);
  });

  it("Versicherung auf 4360: summen.versicherung korrekt", () => {
    const r = buildAnlageS({
      accounts: DEFAULT_ACCOUNTS,
      entries: [makeEntry("2025-03-01", "4360", "1200", 400)],
      wirtschaftsjahr: WJ,
    });
    expect(r.summen.versicherung).toBe(400);
  });
});

describe("AnlageSBuilder · Unmapped + Positionen", () => {
  it("#7 Unmapped-Konto (1400 Forderung): landet in unmappedAccounts", () => {
    const r = buildAnlageS({
      accounts: DEFAULT_ACCOUNTS,
      entries: [makeEntry("2025-03-01", "1400", "8400", 500)],
      wirtschaftsjahr: WJ,
    });
    expect(r.unmappedAccounts).toContain("1400");
    expect(r.summen.honorare).toBe(500);
  });

  it("#8 Positionen-Liste: pro (Konto × Feld) eine LineView mit korrekter feld-Zuordnung", () => {
    const r = buildAnlageS({
      accounts: DEFAULT_ACCOUNTS,
      entries: [
        makeEntry("2025-02-01", "1200", "8400", 1000, "h1"),
        makeEntry("2025-03-01", "4660", "1200", 300, "reise"),
        makeEntry("2025-04-01", "4670", "1200", 200, "fortbildung"),
      ],
      wirtschaftsjahr: WJ,
    });
    expect(r.positionen).toHaveLength(3);
    const felder = r.positionen.map((p) => p.feld).sort();
    expect(felder).toEqual(["fortbildung", "honorare", "reisen"]);
  });
});

describe("AnlageS vs. AnlageG · Delta-Test", () => {
  it("Dasselbe 8400-Entry: landet bei G in summen.umsaetze, bei S in summen.honorare", () => {
    const entries = [makeEntry("2025-06-01", "1200", "8400", 2000)];
    const rG = buildAnlageG({
      accounts: DEFAULT_ACCOUNTS,
      entries,
      wirtschaftsjahr: WJ,
    });
    const rS = buildAnlageS({
      accounts: DEFAULT_ACCOUNTS,
      entries,
      wirtschaftsjahr: WJ,
    });
    expect(rG.summen.umsaetze).toBe(2000);
    expect(rG.summen.honorare).toBeUndefined();
    expect(rS.summen.honorare).toBe(2000);
    expect(rS.summen.umsaetze).toBeUndefined();
  });
});

describe("AnlageSBuilder · Smart-Banner-Sprint (draftCount + includeDraft)", () => {
  it("includeDraft=false (default): Entwurf bleibt aus summen, draftCount zählt", () => {
    const r = buildAnlageS({
      accounts: DEFAULT_ACCOUNTS,
      entries: [
        makeEntry("2025-02-01", "1200", "8400", 2000, "honorar-1"),
        makeEntry("2025-04-15", "1200", "8400", 800, "draft-h", "entwurf"),
      ],
      wirtschaftsjahr: WJ,
    });
    expect(r.summen.honorare).toBe(2000);
    expect(r.draftCount).toBe(1);
  });

  it("includeDraft=true: Entwurf fließt in Honorare, draftCount bleibt", () => {
    const r = buildAnlageS({
      accounts: DEFAULT_ACCOUNTS,
      entries: [
        makeEntry("2025-02-01", "1200", "8400", 2000, "honorar-1"),
        makeEntry("2025-04-15", "1200", "8400", 800, "draft-h", "entwurf"),
      ],
      wirtschaftsjahr: WJ,
      includeDraft: true,
    });
    expect(r.summen.honorare).toBe(2800);
    expect(r.draftCount).toBe(1);
  });
});
