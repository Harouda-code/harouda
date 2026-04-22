/**
 * Audit 2026-04-20 P1-04: Storno + Korrektur müssen die Hash-Kette
 * intakt halten. Betriebsprüfer-Szenario: Z3-Export nach Storno darf
 * `verifyJournalChain()` nicht als „kaputt" melden.
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  createEntry,
  reverseEntry,
  correctEntry,
  updateEntry,
} from "../journal";
import { store } from "../store";
import { verifyJournalChain } from "../../utils/journalChain";

beforeEach(() => {
  localStorage.clear();
});

describe("P1-04: Storno + Korrektur Hash-Chain-Verifikation", () => {
  it("3 Buchungen + 1 reverseEntry → verifyJournalChain ist ok", async () => {
    const tick = () => new Promise((r) => setTimeout(r, 2));
    await createEntry({
      datum: "2025-03-01",
      beleg_nr: "RE-001",
      soll_konto: "4100",
      haben_konto: "1200",
      betrag: 100,
      beschreibung: "Miete",
      ust_satz: 0,
      status: "gebucht",
      skonto_pct: null,
      skonto_tage: null,
      client_id: null,
      gegenseite: null,
      faelligkeit: null,
    });
    await tick();
    const second = await createEntry({
      datum: "2025-03-02",
      beleg_nr: "RE-002",
      soll_konto: "4100",
      haben_konto: "1200",
      betrag: 50,
      beschreibung: "Telefon",
      ust_satz: 0,
      status: "gebucht",
      skonto_pct: null,
      skonto_tage: null,
      client_id: null,
      gegenseite: null,
      faelligkeit: null,
    });
    await tick();
    await createEntry({
      datum: "2025-03-03",
      beleg_nr: "RE-003",
      soll_konto: "4100",
      haben_konto: "1200",
      betrag: 25,
      beschreibung: "Porto",
      ust_satz: 0,
      status: "gebucht",
      skonto_pct: null,
      skonto_tage: null,
      client_id: null,
      gegenseite: null,
      faelligkeit: null,
    });
    await tick();

    // Storno auf zweiten Eintrag
    await reverseEntry(second.id, "Doppelbuchung");

    const result = await verifyJournalChain(store.getEntries());
    expect(result.ok).toBe(true);
    expect(result.total).toBe(4); // 3 original + 1 reversal
    expect(result.firstBreakIndex).toBeNull();
  });

  it("3 Buchungen + correctEntry → verifyJournalChain ist ok", async () => {
    // Mini-Delay zwischen createEntry-Aufrufen, damit `created_at`
    // monoton wächst und `sortForChain` deterministisch sortiert
    // (Hash-Kette hängt an created_at-Reihenfolge).
    const tick = () => new Promise((r) => setTimeout(r, 2));
    await createEntry({
      datum: "2025-03-01",
      beleg_nr: "RE-001",
      soll_konto: "4100",
      haben_konto: "1200",
      betrag: 100,
      beschreibung: "Miete",
      ust_satz: 0,
      status: "gebucht",
      skonto_pct: null,
      skonto_tage: null,
      client_id: null,
      gegenseite: null,
      faelligkeit: null,
    });
    await tick();
    const target = await createEntry({
      datum: "2025-03-02",
      beleg_nr: "RE-002",
      soll_konto: "4100",
      haben_konto: "1200",
      betrag: 50,
      beschreibung: "Telefon falsch",
      ust_satz: 0,
      status: "gebucht",
      skonto_pct: null,
      skonto_tage: null,
      client_id: null,
      gegenseite: null,
      faelligkeit: null,
    });
    await tick();
    await createEntry({
      datum: "2025-03-03",
      beleg_nr: "RE-003",
      soll_konto: "4100",
      haben_konto: "1200",
      betrag: 25,
      beschreibung: "Porto",
      ust_satz: 0,
      status: "gebucht",
      skonto_pct: null,
      skonto_tage: null,
      client_id: null,
      gegenseite: null,
      faelligkeit: null,
    });
    await tick();

    // correctEntry = Storno + Korrektur-Neubuchung in einem Schritt
    await correctEntry(
      target.id,
      {
        datum: "2025-03-02",
        beleg_nr: "RE-002",
        soll_konto: "4100",
        haben_konto: "1200",
        betrag: 55,
        beschreibung: "Telefon korrigiert",
        ust_satz: 0,
        status: "gebucht",
        skonto_pct: null,
        skonto_tage: null,
        client_id: null,
        gegenseite: null,
        faelligkeit: null,
      },
      "Betragsfehler"
    );

    const result = await verifyJournalChain(store.getEntries());
    expect(result.ok).toBe(true);
    expect(result.total).toBe(5); // 3 original + 1 reversal + 1 correction
    expect(result.firstBreakIndex).toBeNull();
  });

  it("P1-05: updateEntry auf festgeschriebene Buchung wirft im DEMO-Pfad", async () => {
    const entry = await createEntry({
      datum: "2025-03-01",
      beleg_nr: "RE-001",
      soll_konto: "4100",
      haben_konto: "1200",
      betrag: 100,
      beschreibung: "Miete",
      ust_satz: 0,
      status: "gebucht",
      skonto_pct: null,
      skonto_tage: null,
      client_id: null,
      gegenseite: null,
      faelligkeit: null,
    });
    expect(entry.status).toBe("gebucht");

    await expect(
      updateEntry(entry.id, { beschreibung: "Geändert" })
    ).rejects.toThrow(/nicht geändert/);
  });

  it("P1-05: updateEntry auf festgeschriebene Buchung wirft im Supabase-Pfad", async () => {
    const db = await import("../db");
    const supa = await import("../supabase");
    const useSupaSpy = vi
      .spyOn(db, "shouldUseSupabase")
      .mockReturnValue(true);
    vi.spyOn(db, "requireCompanyId").mockReturnValue("demo-co");

    // Mock supabase.from("journal_entries").select().eq().eq().single()
    // liefert eine GEBUCHT-Buchung → assertMutable muss werfen, bevor
    // update aufgerufen wird.
    const singleMock = vi.fn().mockResolvedValue({
      data: {
        id: "e1",
        beleg_nr: "RE-002",
        status: "gebucht",
        storno_status: "active",
        locked_at: null,
        version: 1,
      },
      error: null,
    });
    const eq2Mock = vi.fn().mockReturnValue({ single: singleMock });
    const eq1Mock = vi.fn().mockReturnValue({ eq: eq2Mock });
    const selectMock = vi.fn().mockReturnValue({ eq: eq1Mock });
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

    await expect(
      updateEntry("e1", { beschreibung: "illegal" })
    ).rejects.toThrow(/nicht geändert/);

    // Supabase-update-Chain darf NICHT aufgerufen werden
    expect(updateMock).not.toHaveBeenCalled();

    useSupaSpy.mockRestore();
    fromMock.mockRestore();
  });

  it("doppelter Storno auf denselben Eintrag wird abgelehnt", async () => {
    const entry = await createEntry({
      datum: "2025-03-01",
      beleg_nr: "RE-001",
      soll_konto: "4100",
      haben_konto: "1200",
      betrag: 100,
      beschreibung: "Miete",
      ust_satz: 0,
      status: "gebucht",
      skonto_pct: null,
      skonto_tage: null,
      client_id: null,
      gegenseite: null,
      faelligkeit: null,
    });
    const tick = () => new Promise((r) => setTimeout(r, 2));
    await tick();
    await reverseEntry(entry.id, "Erster Storno");
    await expect(
      reverseEntry(entry.id, "Zweiter Storno")
    ).rejects.toThrow(/bereits storniert/);

    // Hash-Kette trotzdem gültig (nur 1 Reversal hinzugefügt)
    const result = await verifyJournalChain(store.getEntries());
    expect(result.ok).toBe(true);
  });
});
