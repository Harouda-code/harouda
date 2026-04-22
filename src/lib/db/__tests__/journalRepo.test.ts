import { describe, it, expect, beforeEach, vi } from "vitest";
import { JournalRepo, positionsToJournalPairs } from "../journalRepo";
import { Money } from "../../money/Money";
import type { BelegEntry, BelegPosition } from "../../../domain/belege/types";
import { store } from "../../../api/store";

// DEMO_MODE-Pfad wird in api/supabase über Env geschaltet. Für die Tests
// reicht uns der localStorage-Zweig, da wir via `shouldUseSupabase()` fallen
// — kein aktives Company-ID → localStorage.

function makeBeleg(
  overrides: Partial<BelegEntry> = {},
  positionen: BelegPosition[] = [
    {
      konto: "4100",
      side: "SOLL",
      betrag: new Money("100"),
      text: "Miete",
      ustSatz: 0.19,
    },
    {
      konto: "1200",
      side: "HABEN",
      betrag: new Money("100"),
      ustSatz: null,
    },
  ]
): BelegEntry {
  return {
    belegart: "EINGANGSRECHNUNG",
    belegnummer: "RE-2025-001",
    belegdatum: "2025-03-15",
    buchungsdatum: "2025-03-15",
    beschreibung: "Test-Beleg",
    partner: {
      name: "Lieferant GmbH",
      ustId: "DE123456789",
    },
    positionen,
    netto: new Money("100"),
    steuerbetrag: new Money("19"),
    brutto: new Money("119"),
    ...overrides,
  };
}

beforeEach(() => {
  localStorage.clear();
  // audit.log geht über supabase/store — wir stummschalten Nebeneffekte.
  vi.restoreAllMocks();
});

describe("positionsToJournalPairs", () => {
  it("1 SOLL + 1 HABEN → 1 Journal-Paar", () => {
    const p = positionsToJournalPairs([
      { konto: "4100", side: "SOLL", betrag: new Money("100") },
      { konto: "1200", side: "HABEN", betrag: new Money("100") },
    ]);
    expect(p).toHaveLength(1);
    expect(p[0].soll_konto).toBe("4100");
    expect(p[0].haben_konto).toBe("1200");
    expect(p[0].betrag.equals(new Money("100"))).toBe(true);
  });

  it("1 SOLL + N HABEN → N Paare mit gleichem Soll", () => {
    const p = positionsToJournalPairs([
      { konto: "4100", side: "SOLL", betrag: new Money("119") },
      { konto: "1200", side: "HABEN", betrag: new Money("100") },
      { konto: "1776", side: "HABEN", betrag: new Money("19") },
    ]);
    expect(p).toHaveLength(2);
    expect(p[0].soll_konto).toBe("4100");
    expect(p[0].haben_konto).toBe("1200");
    expect(p[1].soll_konto).toBe("4100");
    expect(p[1].haben_konto).toBe("1776");
  });

  it("nur SOLL → Fehler (Haben fehlt)", () => {
    expect(() =>
      positionsToJournalPairs([
        { konto: "4100", side: "SOLL", betrag: new Money("100") },
      ])
    ).toThrow(/Soll- und eine Haben/);
  });

  it("2 SOLL + 3 HABEN → Fehler (nicht eindeutig paarbar)", () => {
    expect(() =>
      positionsToJournalPairs([
        { konto: "4100", side: "SOLL", betrag: new Money("50") },
        { konto: "4110", side: "SOLL", betrag: new Money("50") },
        { konto: "1200", side: "HABEN", betrag: new Money("30") },
        { konto: "1201", side: "HABEN", betrag: new Money("30") },
        { konto: "1202", side: "HABEN", betrag: new Money("40") },
      ])
    ).toThrow(/nicht eindeutig paarbar/);
  });
});

describe("JournalRepo (DEMO/localStorage)", () => {
  it("createJournalFromBeleg mit Status=GEBUCHT erzeugt Journal-Einträge", async () => {
    const repo = new JournalRepo();
    const { beleg, journalEntries } = await repo.createJournalFromBeleg(
      makeBeleg()
    );

    expect(journalEntries).toHaveLength(1);
    expect(journalEntries[0].soll_konto).toBe("4100");
    expect(journalEntries[0].haben_konto).toBe("1200");
    expect(journalEntries[0].betrag).toBe(100);
    expect(beleg.status).toBe("GEBUCHT");
    expect(beleg.journal_entry_ids).toHaveLength(1);
    expect(beleg.journal_entry_ids[0]).toBe(journalEntries[0].id);

    const stored = store.getEntries();
    expect(stored.some((e) => e.id === journalEntries[0].id)).toBe(true);
  });

  it("createJournalFromBeleg mit Status=ENTWURF erzeugt KEINE Journal-Einträge", async () => {
    const repo = new JournalRepo();
    const { beleg, journalEntries } = await repo.createJournalFromBeleg(
      makeBeleg(),
      { status: "ENTWURF" }
    );
    expect(journalEntries).toHaveLength(0);
    expect(beleg.status).toBe("ENTWURF");
    expect(beleg.journal_entry_ids).toHaveLength(0);
    expect(store.getEntries()).toHaveLength(0);
  });

  it("getBelege liefert sortierte Liste + Filter-Parameter wirken", async () => {
    const repo = new JournalRepo();
    await repo.createJournalFromBeleg(
      makeBeleg({ belegnummer: "RE-2025-A", belegdatum: "2025-01-15" }),
      { status: "ENTWURF" }
    );
    await repo.createJournalFromBeleg(
      makeBeleg({ belegnummer: "RE-2025-B", belegdatum: "2025-06-15" }),
      { status: "GEBUCHT" }
    );

    const all = await repo.getBelege();
    expect(all.total).toBe(2);

    const gebucht = await repo.getBelege({ status: "GEBUCHT" });
    expect(gebucht.total).toBe(1);
    expect(gebucht.belege[0].belegnummer).toBe("RE-2025-B");

    const q2 = await repo.getBelege({ von: "2025-05-01" });
    expect(q2.total).toBe(1);
    expect(q2.belege[0].belegnummer).toBe("RE-2025-B");
  });

  it("getBeleg liefert Einzelbeleg inkl. Positionen", async () => {
    const repo = new JournalRepo();
    const created = await repo.createJournalFromBeleg(makeBeleg());
    const fetched = await repo.getBeleg(created.beleg.id);
    expect(fetched?.id).toBe(created.beleg.id);
    expect(fetched?.positionen.length).toBe(2);
    expect(fetched?.positionen[0].soll_haben).toBe("S");
    expect(fetched?.positionen[1].soll_haben).toBe("H");
  });

  it("updateBeleg auf GEBUCHT → wirft GoBD-Fehler", async () => {
    const repo = new JournalRepo();
    const { beleg } = await repo.createJournalFromBeleg(makeBeleg());
    await expect(
      repo.updateBeleg(beleg.id, { beschreibung: "Geändert" })
    ).rejects.toThrow(/nicht mehr geändert/);
  });

  it("updateBeleg auf ENTWURF → überschreibt Felder", async () => {
    const repo = new JournalRepo();
    const { beleg } = await repo.createJournalFromBeleg(makeBeleg(), {
      status: "ENTWURF",
    });
    await repo.updateBeleg(beleg.id, { beschreibung: "Neuer Text" });
    const updated = await repo.getBeleg(beleg.id);
    expect(updated?.beschreibung).toBe("Neuer Text");
  });

  it("Audit P0-02: updateBeleg Supabase-Pfad prüft GEBUCHT-Status vor Update", async () => {
    const db = await import("../../../api/db");
    const supa = await import("../../../api/supabase");
    const useSupaSpy = vi
      .spyOn(db, "shouldUseSupabase")
      .mockReturnValue(true);

    // Mock supabase.from(...).select(...).eq(...).single() → liefert GEBUCHT
    const singleMock = vi
      .fn()
      .mockResolvedValue({ data: { status: "GEBUCHT" }, error: null });
    const eqMock = vi.fn().mockReturnValue({ single: singleMock });
    const selectMock = vi.fn().mockReturnValue({ eq: eqMock });
    const updateMock = vi.fn();
    const fromMock = vi
      .spyOn(supa.supabase, "from")
      .mockImplementation(
        () =>
          ({
            select: selectMock,
            update: updateMock,
          }) as never
      );

    const repo = new JournalRepo();
    await expect(
      repo.updateBeleg("any-id", { beschreibung: "illegal" })
    ).rejects.toThrow(/nicht mehr geändert/);

    // supabase.from("belege").update(...) darf NICHT aufgerufen worden sein
    expect(updateMock).not.toHaveBeenCalled();

    useSupaSpy.mockRestore();
    fromMock.mockRestore();
  });

  it("stornoBeleg erzeugt Gegenbuchung und markiert als STORNIERT", async () => {
    const repo = new JournalRepo();
    const { beleg } = await repo.createJournalFromBeleg(makeBeleg());
    const before = store.getEntries().length;

    await repo.stornoBeleg(beleg.id, "Test-Storno");

    const after = await repo.getBeleg(beleg.id);
    expect(after?.status).toBe("STORNIERT");
    expect(after?.storno_grund).toBe("Test-Storno");
    expect(after?.storniert_am).toBeTruthy();

    // Gegenbuchung entstand (Anzahl Journal-Einträge gewachsen).
    expect(store.getEntries().length).toBeGreaterThan(before);
  });

  it("stornoBeleg ohne Grund → Fehler", async () => {
    const repo = new JournalRepo();
    const { beleg } = await repo.createJournalFromBeleg(makeBeleg());
    await expect(repo.stornoBeleg(beleg.id, "")).rejects.toThrow(
      /Stornogrund/
    );
  });

  it("Multi-Position-Beleg (1 SOLL + 2 HABEN) → 2 Journal-Einträge", async () => {
    const repo = new JournalRepo();
    const { journalEntries } = await repo.createJournalFromBeleg(
      makeBeleg({}, [
        { konto: "4100", side: "SOLL", betrag: new Money("119") },
        { konto: "1200", side: "HABEN", betrag: new Money("100") },
        { konto: "1776", side: "HABEN", betrag: new Money("19") },
      ])
    );
    expect(journalEntries).toHaveLength(2);
    expect(journalEntries[0].haben_konto).toBe("1200");
    expect(journalEntries[1].haben_konto).toBe("1776");
  });
});
