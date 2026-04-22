// Multi-Tenancy Phase 2 / Schritt 2 · lohnRepos.ts mit clientId-Pattern.
//
// DEMO-Pfad-Tests (vitest-Env ist DEMO_MODE per Default). Die Repos
// haben im DEMO nur Stub-Verhalten (getForAn → [], create → Dummy,
// save → Dummy-ID); dennoch verifizieren die Tests, dass die neuen
// clientId-Pflichtparameter akzeptiert, nicht verworfen und
// typisiert vom Compiler geprüft werden.
//
// Der Supabase-Pfad (`.eq("client_id", clientId)` bei !== null,
// `client_id` im INSERT-Payload) ist strukturell identisch zu den
// Phase-1-Rot/Gelb-Tests und wird hier nicht gemockt — Supabase-
// Mock-Infrastruktur existiert im Projekt bewusst nicht.

import { describe, it, expect, beforeEach } from "vitest";
import {
  AbrechnungArchivRepo,
  LohnArtRepo,
  LohnbuchungRepo,
} from "../lohnRepos";
import { Money } from "../../money/Money";
import type {
  Arbeitnehmer,
  LohnArt,
  Lohnabrechnung,
  Lohnbuchung,
} from "../../../domain/lohn/types";

const COMPANY = "company-demo";
const A = "client-A";
const B = "client-B";

// --- LohnArtRepo ----------------------------------------------------------

describe("LohnArtRepo · clientId-Pattern (DEMO)", () => {
  const repo = new LohnArtRepo();

  it("getAll akzeptiert clientId als Pflicht-Parameter (Signatur-Check)", async () => {
    // DEMO → demoList(), unabhängig vom clientId. Wichtig: der Compiler
    // erzwingt den zweiten Parameter — Aufruf ohne wäre ein TS-Error.
    const resultForA = await repo.getAll(COMPANY, A);
    const resultForB = await repo.getAll(COMPANY, B);
    const resultKanzleiwide = await repo.getAll(COMPANY, null);
    // Alle drei liefern dieselbe demoList (DEMO-Stub-Verhalten).
    expect(resultForA).toHaveLength(3);
    expect(resultForB).toHaveLength(3);
    expect(resultKanzleiwide).toHaveLength(3);
  });

  it("create gibt ein Objekt mit stabiler ID zurück, clientId-Parameter wird akzeptiert", async () => {
    const input: Omit<LohnArt, "id"> = {
      bezeichnung: "Test-Lohnart",
      typ: "LAUFENDER_BEZUG",
      steuerpflichtig: true,
      svpflichtig: true,
      lst_meldung_feld: "3",
    };
    const la = await repo.create(COMPANY, A, "LA-TEST", input);
    expect(la.id).toBe("demo-la-LA-TEST");
    expect(la.bezeichnung).toBe("Test-Lohnart");
    // Derselbe Code mit anderem Mandanten: ID bleibt demo-stabil (Kein
    // Cache-Effekt in DEMO; Supabase-Pfad würde einen eigenen Row pro
    // Mandant anlegen).
    const la2 = await repo.create(COMPANY, B, "LA-TEST", input);
    expect(la2.id).toBe("demo-la-LA-TEST");
  });

  it("remove akzeptiert clientId (no-op im DEMO)", async () => {
    await expect(repo.remove("some-id", A)).resolves.toBeUndefined();
    await expect(repo.remove("some-id", null)).resolves.toBeUndefined();
  });
});

// --- LohnbuchungRepo ------------------------------------------------------

describe("LohnbuchungRepo · clientId-Pattern (DEMO)", () => {
  const repo = new LohnbuchungRepo();

  it("getForAn akzeptiert clientId (DEMO → leeres Array, Parameter durchgereicht)", async () => {
    const rows = await repo.getForAn("emp-1", "2025-01", A);
    expect(rows).toEqual([]);
    const rowsNull = await repo.getForAn("emp-1", "2025-01", null);
    expect(rowsNull).toEqual([]);
  });

  it("create schreibt alle Input-Felder + gibt Dummy-ID zurück (DEMO), clientId getrennt pro Mandant", async () => {
    const input: Omit<Lohnbuchung, "id"> = {
      arbeitnehmer_id: "emp-1",
      abrechnungsmonat: "2025-01",
      lohnart_id: "la-gehalt",
      betrag: new Money("3000.00"),
      stunden: undefined,
      menge: undefined,
      beleg: undefined,
      buchungsdatum: "2025-01-31",
    };
    const saved = await repo.create(COMPANY, A, input);
    expect(saved.id).toMatch(/^demo-lb-\d+$/);
    expect(saved.arbeitnehmer_id).toBe("emp-1");
    expect(saved.abrechnungsmonat).toBe("2025-01");
    expect(saved.lohnart_id).toBe("la-gehalt");
    expect(saved.betrag.toNumber()).toBe(3000);
    // Zweiter Mandant liefert ebenfalls Dummy-ID — Parameter-Pfad
    // erzwingt die Angabe.
    const saved2 = await repo.create(COMPANY, B, input);
    expect(saved2.id).toMatch(/^demo-lb-\d+$/);
  });

  it("remove akzeptiert clientId (no-op im DEMO)", async () => {
    await expect(repo.remove("lb-id", A)).resolves.toBeUndefined();
    await expect(repo.remove("lb-id", null)).resolves.toBeUndefined();
  });
});

// --- AbrechnungArchivRepo -------------------------------------------------

function dummyArbeitnehmer(id: string): Arbeitnehmer {
  return {
    id,
    personalnummer: `P-${id}`,
    vorname: "Test",
    nachname: "Person",
    steuerklasse: 1,
    kinderfreibetraege: 0,
    privatVersichert: false,
    kvBeitragsart: "GESETZLICH",
    kvZusatzbeitragPct: 1.7,
    pvKinderlos: false,
    pvKinderAnzahl: 0,
    bundesland: "BY",
    konfession: "NONE",
  } as unknown as Arbeitnehmer;
}

function dummyAbrechnung(employeeId: string, monat: string): Lohnabrechnung {
  const ZERO = new Money("0");
  return {
    arbeitnehmer_id: employeeId,
    abrechnungsmonat: monat,
    laufenderBrutto: new Money("3000"),
    sonstigeBezuege: ZERO,
    gesamtBrutto: new Money("3000"),
    svBrutto: new Money("3000"),
    abzuege: {
      lohnsteuer: new Money("300"),
      solidaritaetszuschlag: ZERO,
      kirchensteuer: ZERO,
      kv_an: new Money("219"),
      kv_zusatz_an: new Money("25"),
      pv_an: new Money("51"),
      rv_an: new Money("279"),
      av_an: new Money("39"),
      gesamtAbzuege: new Money("913"),
    },
    arbeitgeberKosten: {
      kv: new Money("219"),
      kv_zusatz: new Money("25"),
      pv: new Money("51"),
      rv: new Money("279"),
      av: new Money("39"),
      u1: ZERO,
      u2: ZERO,
      u3: ZERO,
      gesamt: new Money("613"),
    },
    auszahlungsbetrag: new Money("2087"),
    gesamtkostenArbeitgeber: new Money("3613"),
    formatted: {
      laufenderBrutto: "3.000,00 €",
      sonstigeBezuege: "0,00 €",
      gesamtBrutto: "3.000,00 €",
      auszahlungsbetrag: "2.087,00 €",
      gesamtkostenArbeitgeber: "3.613,00 €",
    },
    _meta: { tarifVersion: "2025", svVersion: "2025" },
  } as unknown as Lohnabrechnung;
}

describe("AbrechnungArchivRepo · clientId-Pattern + erweiterter onConflict-Key (DEMO)", () => {
  const repo = new AbrechnungArchivRepo();

  beforeEach(() => {
    localStorage.clear();
  });

  it("save akzeptiert clientId als Pflicht-Parameter + liefert Dummy-ID-Schema (DEMO)", async () => {
    const arbeitnehmer = dummyArbeitnehmer("emp-1");
    const abrechnung = dummyAbrechnung("emp-1", "2025-03");
    const idA = await repo.save(COMPANY, A, {
      arbeitnehmer,
      abrechnungsmonat: "2025-03",
      abrechnung,
    });
    const idB = await repo.save(COMPANY, B, {
      arbeitnehmer,
      abrechnungsmonat: "2025-03",
      abrechnung,
    });
    // Beide Mandanten bekommen dieselbe DEMO-Dummy-ID (client-agnostisch),
    // aber wichtig: der Signatur-Pfad erzwingt die Angabe von clientId —
    // Aufruf ohne wäre TypeScript-Error.
    expect(idA).toBe("demo-archiv-2025-03-emp-1");
    expect(idB).toBe("demo-archiv-2025-03-emp-1");
  });

  it("lock akzeptiert clientId (no-op im DEMO)", async () => {
    await expect(repo.lock("archiv-id", A)).resolves.toBeUndefined();
    await expect(repo.lock("archiv-id", null)).resolves.toBeUndefined();
  });

  it("getForEmployee akzeptiert clientId, liefert leeres Array im DEMO", async () => {
    // DEMO getForEmployee selbst liest nicht aus dem localStorage-Archiv —
    // sie ist Supabase-only stub. Für DEMO-Archiv-Sicht wird auf
    // `store.getLohnArchiv()` zurückgegriffen (siehe Smoke-Test).
    const rows = await repo.getForEmployee("emp-1", A);
    expect(rows).toEqual([]);
    const rowsNull = await repo.getForEmployee("emp-1", null);
    expect(rowsNull).toEqual([]);
  });

  it("save mit batchId schreibt batch_id in die DEMO-Archiv-Row", async () => {
    const { store } = await import("../../../api/store");
    const arbeitnehmer = dummyArbeitnehmer("emp-batch");
    const abrechnung = dummyAbrechnung("emp-batch", "2025-04");
    const batchId = "00000000-0000-4000-8000-000000000abc";
    const id = await repo.save(COMPANY, A, {
      arbeitnehmer,
      abrechnungsmonat: "2025-04",
      abrechnung,
      batchId,
    });
    expect(id).toBe("demo-archiv-2025-04-emp-batch");
    const archiv = store.getLohnArchiv();
    const row = archiv.find((r) => r.id === id);
    expect(row).toBeDefined();
    expect(row!.batch_id).toBe(batchId);
    expect(row!.client_id).toBe(A);
    expect(row!.employee_id).toBe("emp-batch");
    expect(row!.abrechnungsmonat).toBe("2025-04");
  });

  it("save ohne batchId (Default null) bleibt akzeptiert", async () => {
    const { store } = await import("../../../api/store");
    const arbeitnehmer = dummyArbeitnehmer("emp-nobatch");
    const abrechnung = dummyAbrechnung("emp-nobatch", "2025-05");
    const id = await repo.save(COMPANY, A, {
      arbeitnehmer,
      abrechnungsmonat: "2025-05",
      abrechnung,
    });
    expect(id).toBe("demo-archiv-2025-05-emp-nobatch");
    const row = store.getLohnArchiv().find((r) => r.id === id);
    expect(row).toBeDefined();
    expect(row!.batch_id).toBeNull();
  });
});
