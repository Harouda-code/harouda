/**
 * Tests für den Sprint-7.5-Demo-Seed der Musterfirma.
 *
 * Der Seed-Pfad ruft mehrere `create*`-APIs seriell auf und legt
 * seine Ergebnisse in `localStorage` ab (DEMO-Mode). Die Tests hier
 * validieren, dass nach einem `autoSeedDemoIfNeeded()`-Lauf:
 *
 *   - Entscheidungen 21 B / 31 A: Harouda als Kanzlei-Settings,
 *     4 Mandanten im Store (3 Bestand + Kühn), Kühn als Default-
 *     Selected.
 *   - Entscheidung 34 A: SKR03-Konten 9000 und 0860 existieren.
 *   - Phase 2: 5 KST, 2 KTR, 3 Mitarbeiter seeded.
 *   - Phase 3: 8 Anlagen seeded mit konvertiertem DE-ISO-Datum.
 *   - Phase 4: 52 Journal-Einträge mit client_id=Kühn, Hash-Kette
 *     intakt, Skonto-Felder auf Zielbuchungen.
 *   - Phase 6: FLAG-v2 setzt nach Seed, v1→v2-Migration räumt
 *     Legacy-Stores.
 *
 * Tests nutzen den Default-DEMO-Pfad (`shouldUseSupabase()` ist
 * false weil kein Auth-Context im vitest-Setup).
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { SKR03_SEED } from "../skr03";
import { store } from "../store";

beforeEach(() => {
  localStorage.clear();
  vi.restoreAllMocks();
});

// --- SKR03-Seed-Ergänzungen (Sprint 7.5 Phase 2) -------------------------

describe("SKR03_SEED — Sprint-7.5-Ergänzungen für Eröffnungsbilanz", () => {
  it("enthält Konto 9000 Eröffnungsbilanzkonto (passiva) für EB-Buchungen", () => {
    const k9000 = SKR03_SEED.find((a) => a.konto_nr === "9000");
    expect(k9000).toBeDefined();
    expect(k9000!.kategorie).toBe("passiva");
    expect(k9000!.bezeichnung).toMatch(/Eröffnungsbilanz/i);
  });

  it("enthält Konto 0860 Gewinnvortrag (passiva) für EB-006", () => {
    const k0860 = SKR03_SEED.find((a) => a.konto_nr === "0860");
    expect(k0860).toBeDefined();
    expect(k0860!.kategorie).toBe("passiva");
    expect(k0860!.bezeichnung).toMatch(/Gewinnvortrag/i);
  });
});

// --- Haupt-Orchestrator autoSeedDemoIfNeeded -----------------------------

describe("autoSeedDemoIfNeeded — Mandanten + Stammdaten", () => {
  it("legt Kühn Musterfirma + 3 Bestand-Mandanten an, setzt Kühn als Default-Selected", async () => {
    const { autoSeedDemoIfNeeded } = await import("../demoSeed");
    await autoSeedDemoIfNeeded();

    const clients = store.getClients();
    expect(clients.length).toBeGreaterThanOrEqual(4);

    const kuehn = clients.find((c) => c.mandant_nr === "10100");
    expect(kuehn).toBeDefined();
    expect(kuehn!.name).toBe("Kühn Musterfirma GmbH");
    expect(kuehn!.ust_id).toBe("DE999888777");

    const schulz = clients.find((c) => c.mandant_nr === "10001");
    expect(schulz?.name).toMatch(/Schulz/);

    // Default-Selected (Entscheidung 36 A)
    expect(localStorage.getItem("harouda:selectedMandantId")).toBe(kuehn!.id);
  });

  it("ist idempotent: zweiter Aufruf fügt keine Dubletten hinzu", async () => {
    const { autoSeedDemoIfNeeded } = await import("../demoSeed");
    await autoSeedDemoIfNeeded();
    const clientsAfter1 = store.getClients().length;
    await autoSeedDemoIfNeeded();
    const clientsAfter2 = store.getClients().length;
    expect(clientsAfter2).toBe(clientsAfter1);
  });
});

describe("autoSeedDemoIfNeeded — Kostenstellen / Kostenträger / Mitarbeiter", () => {
  it("seedet 5 Kostenstellen (Entscheidung 16 / Phase 2)", async () => {
    const { autoSeedDemoIfNeeded } = await import("../demoSeed");
    await autoSeedDemoIfNeeded();

    const codes = store
      .getCostCenters()
      .map((c) => c.code)
      .sort();
    expect(codes).toEqual([
      "KST-EINKAUF",
      "KST-IT",
      "KST-PROD",
      "KST-VERTRIEB",
      "KST-VERW",
    ]);
  });

  it("seedet 2 Kostenträger mit passenden Codes", async () => {
    const { autoSeedDemoIfNeeded } = await import("../demoSeed");
    await autoSeedDemoIfNeeded();

    const codes = store
      .getCostCarriers()
      .map((c) => c.code)
      .sort();
    expect(codes).toEqual(["PROJ-2025-WEB", "PROJ-KUNDE-MUELLER"]);
  });

  it("seedet 3 Mitarbeiter mit Pflichtfeldern, optionale Felder sind null (Entscheidung 32 C)", async () => {
    const { autoSeedDemoIfNeeded } = await import("../demoSeed");
    await autoSeedDemoIfNeeded();

    const emp = store.getEmployees();
    expect(emp).toHaveLength(3);

    const jana = emp.find((e) => e.personalnummer === "1001")!;
    expect(jana.vorname).toBe("Jana");
    expect(jana.nachname).toBe("Kühn");
    expect(jana.steuerklasse).toBe("III");
    expect(jana.beschaeftigungsart).toBe("vollzeit");
    expect(jana.bruttogehalt_monat).toBe(6500);
    // Optionale Felder bleiben null (Entscheidung 32 C)
    expect(jana.steuer_id).toBeNull();
    expect(jana.iban).toBeNull();
    expect(jana.sv_nummer).toBeNull();
  });
});

// --- Phase 3: Anlagegüter-Seed -------------------------------------------

describe("autoSeedDemoIfNeeded — 8 Anlagen (Phase 3)", () => {
  it("seedet alle 8 Anlagen mit DE→ISO-Datumskonversion", async () => {
    const { autoSeedDemoIfNeeded } = await import("../demoSeed");
    await autoSeedDemoIfNeeded();

    const anlagen = store.getAnlagegueter();
    expect(anlagen).toHaveLength(8);

    const inv = anlagen.find((a) => a.inventar_nr === "INV-2022-001")!;
    expect(inv).toBeDefined();
    // DE „15.05.2022" → ISO „2022-05-15"
    expect(inv.anschaffungsdatum).toBe("2022-05-15");
    expect(inv.anschaffungskosten).toBe(4200);
    expect(inv.nutzungsdauer_jahre).toBe(8);
    expect(inv.afa_methode).toBe("linear");
    expect(inv.konto_anlage).toBe("0440");
  });

  it("seedet GWG + Sammelposten Anlagen mit korrekter Methode", async () => {
    const { autoSeedDemoIfNeeded } = await import("../demoSeed");
    await autoSeedDemoIfNeeded();

    const anlagen = store.getAnlagegueter();
    const gwg = anlagen.find((a) => a.inventar_nr === "INV-2025-002");
    expect(gwg?.afa_methode).toBe("gwg_sofort");
    expect(gwg?.anschaffungskosten).toBe(350);

    const sp = anlagen.find((a) => a.inventar_nr === "INV-2025-003");
    expect(sp?.afa_methode).toBe("sammelposten");
    expect(sp?.anschaffungskosten).toBe(500);
  });
});

// --- Phase 4: Journal-Bulk-Seed ------------------------------------------

describe("autoSeedDemoIfNeeded — 52 Journal-Einträge aus buchungen.csv (Phase 4)", () => {
  it("seedet 52 Einträge, alle mit client_id=Kühn (Entscheidung 21 B)", async () => {
    const { autoSeedDemoIfNeeded } = await import("../demoSeed");
    await autoSeedDemoIfNeeded();

    const entries = store.getEntries();
    // 52 Musterfirma-Einträge aus buchungen.csv, die ehemaligen 15
    // hardcoded Einträge sind per Entscheidung 22 A entfernt.
    expect(entries).toHaveLength(52);

    const kuehn = store.getClients().find((c) => c.mandant_nr === "10100")!;
    const kuehnId = kuehn.id;
    const withKuehnId = entries.filter((e) => e.client_id === kuehnId);
    expect(withKuehnId.length).toBe(52);
  });

  it("Hash-Kette intakt: jeder Eintrag hat einen Hash, keine zwei haben denselben prev_hash (Sprint 7.5 Phase 4)", async () => {
    const { autoSeedDemoIfNeeded } = await import("../demoSeed");
    await autoSeedDemoIfNeeded();

    const entries = store
      .getEntries()
      .slice()
      .sort(
        (a, b) => (a.created_at ?? "").localeCompare(b.created_at ?? "")
      );
    // Alle haben entry_hash + prev_hash gesetzt
    const withHash = entries.filter(
      (e) => e.entry_hash && e.prev_hash !== undefined
    );
    expect(withHash.length).toBe(entries.length);

    // Kette: kein prev_hash taucht zweimal auf (sonst Split-Brain)
    const prevHashes = entries.map((e) => e.prev_hash);
    const uniquePrev = new Set(prevHashes);
    expect(uniquePrev.size).toBe(prevHashes.length);
  });

  it("KST-/KTR-Codes kommen korrekt aus der CSV", async () => {
    const { autoSeedDemoIfNeeded } = await import("../demoSeed");
    await autoSeedDemoIfNeeded();

    const entries = store.getEntries();
    const withKst = entries.filter(
      (e) => e.kostenstelle && e.kostenstelle.length > 0
    );
    // Die Mehrheit der Buchungen hat KST (nicht die EB-Zeilen, keine
    // zahlungs-nur-Zeilen). Mindestens 15 sollten ein KST haben.
    expect(withKst.length).toBeGreaterThan(15);

    const withKtr = entries.filter((e) => e.kostentraeger);
    // PROJ-2025-WEB oder PROJ-KUNDE-MUELLER werden in mehreren Zeilen
    // referenziert (mindestens 4).
    expect(withKtr.length).toBeGreaterThanOrEqual(4);
  });

  it("Sprint-7-Sonderfälle RC/IG aus der Demo-CSV sind vorhanden", async () => {
    const { autoSeedDemoIfNeeded } = await import("../demoSeed");
    await autoSeedDemoIfNeeded();

    const belegNrs = new Set(store.getEntries().map((e) => e.beleg_nr));
    expect(belegNrs.has("RC-2025-001")).toBe(true);
    expect(belegNrs.has("RC-2025-002")).toBe(true);
    expect(belegNrs.has("RC-2025-003")).toBe(true);
    expect(belegNrs.has("IG-2025-001")).toBe(true);
    expect(belegNrs.has("IG-2025-002")).toBe(true);
  });

  it("Sprint-5-Skonto-Felder werden korrekt auf die CSV-Zeilen gesetzt", async () => {
    const { autoSeedDemoIfNeeded } = await import("../demoSeed");
    await autoSeedDemoIfNeeded();

    // AR-2025-001 (Gauss GmbH) hat in der CSV skonto_pct=2, skonto_tage=14
    const ar001 = store
      .getEntries()
      .find((e) => e.beleg_nr === "AR-2025-001");
    expect(ar001?.skonto_pct).toBe(2);
    expect(ar001?.skonto_tage).toBe(14);

    // ER-2025-003 (Beta KG) hat skonto_pct=2, skonto_tage=14
    const er003 = store
      .getEntries()
      .find((e) => e.beleg_nr === "ER-2025-003");
    expect(er003?.skonto_pct).toBe(2);
    expect(er003?.skonto_tage).toBe(14);
  });
});

// --- Phase 6: FLAG-v3 + v1/v2-Legacy-Migration ---------------------------

describe("autoSeedDemoIfNeeded — FLAG-v3 Idempotenz (Phase 6 / Audit P1-01)", () => {
  it("setzt FLAG harouda:demo-seeded-v3 nach erfolgreichem Seed (Audit 2026-04-20)", async () => {
    const { autoSeedDemoIfNeeded } = await import("../demoSeed");
    expect(localStorage.getItem("harouda:demo-seeded-v3")).toBeNull();
    await autoSeedDemoIfNeeded();
    expect(localStorage.getItem("harouda:demo-seeded-v3")).toBe("1");
  });

  it("v1-Legacy-Migration: räumt alte Daten granular und seedet Musterfirma (Entscheidung 33 C)", async () => {
    const { autoSeedDemoIfNeeded } = await import("../demoSeed");

    // Simuliere v1-Zustand: FLAG gesetzt + leerer Store
    localStorage.setItem("harouda:demo-seeded", "1");

    await autoSeedDemoIfNeeded();

    // v1-FLAG entfernt, v3-FLAG gesetzt
    expect(localStorage.getItem("harouda:demo-seeded")).toBeNull();
    expect(localStorage.getItem("harouda:demo-seeded-v3")).toBe("1");
    expect(store.getEntries().length).toBe(52);
    expect(store.getAnlagegueter().length).toBe(8);
    expect(store.getCostCenters().length).toBe(5);
  });

  it("P1-01 Audit: v2-Legacy-Migration — alter v2-Seed mit fehlerhaftem EB-005 wird ersetzt", async () => {
    const { autoSeedDemoIfNeeded } = await import("../demoSeed");

    // Simuliere v2-Zustand (Sprint 7.5 Pre-Audit): FLAG-v2 gesetzt,
    // aber Daten enthalten 0800-statt-2300-EB-005-Fehler.
    localStorage.setItem("harouda:demo-seeded-v2", "1");

    await autoSeedDemoIfNeeded();

    // v2-FLAG entfernt, v3-FLAG gesetzt
    expect(localStorage.getItem("harouda:demo-seeded-v2")).toBeNull();
    expect(localStorage.getItem("harouda:demo-seeded-v3")).toBe("1");
    // Neuer Seed mit korrekter CSV → 2300 in einem Entry (EB-005)
    const entries = store.getEntries();
    const eb005 = entries.find((e) => e.beleg_nr === "EB-005");
    expect(eb005).toBeDefined();
    expect(eb005!.haben_konto).toBe("2300");
  });

  it("respektiert vorhandene Sprint-7.5-User-Daten wenn Kühn schon im Store ist", async () => {
    const { autoSeedDemoIfNeeded } = await import("../demoSeed");

    // User hat Sprint-7.5-Seed bereits durchlaufen (Kühn vorhanden)
    // und danach manuell einen weiteren Mandanten ergänzt — ohne
    // dass FLAG-v2 (warum auch immer) noch gesetzt wäre.
    const { createClient } = await import("../clients");
    await createClient({ mandant_nr: "10100", name: "Kühn Musterfirma GmbH" });
    await createClient({ mandant_nr: "99999", name: "Eigener Mandant" });

    await autoSeedDemoIfNeeded();

    // FLAG-v2 gesetzt, aber kein Re-Seed (Respekt-Branch, B4-Fix).
    expect(localStorage.getItem("harouda:demo-seeded-v3")).toBe("1");
    const clients = store.getClients();
    expect(clients).toHaveLength(2);
    expect(store.getEntries()).toHaveLength(0);
  });

  it("B4-Fix: Orphan-State ohne FLAG und ohne Kühn → Clearing + Neu-Seed", async () => {
    const { autoSeedDemoIfNeeded } = await import("../demoSeed");
    const { createClient } = await import("../clients");

    // Pre-7.5-Zustand: User hat einen fremden Mandanten + Journal-
    // Einträge (z. B. aus altem seedDemoData-isoDaysAgo-Array), aber
    // KEINEN Kühn-Mandanten. Kein FLAG gesetzt (typischer Altbestand).
    await createClient({ mandant_nr: "88888", name: "Alt-Demo-Mandant" });
    store.setEntries([
      // Ein plausibel-aussehender Pre-7.5-Eintrag (hash-chain unwichtig
      // für den Orphan-Detector, der nur length prüft)
      {
        id: "pre-7-5-entry-1",
        belegnummer: "DEMO-2024-001",
        datum: "2024-12-15",
        soll_konto: "1200",
        haben_konto: "3400",
        betrag: 100,
        buchungstext: "Alter Demo-Eintrag",
        ust_satz: 0,
        beleg_url: null,
        client_id: null,
        kostenstelle: null,
        kostentraeger: null,
        skonto_pct: null,
        skonto_tage: null,
        festgeschrieben: false,
        festgeschrieben_am: null,
        prev_hash: null,
        entry_hash: "x",
        created_at: "2024-12-15T00:00:00Z",
        updated_at: "2024-12-15T00:00:00Z",
        version: 1,
      } as never,
    ]);

    await autoSeedDemoIfNeeded();

    // Orphan → granulares Clearing, dann voller Musterfirma-Seed.
    expect(localStorage.getItem("harouda:demo-seeded-v3")).toBe("1");
    const clients = store.getClients();
    // 4 Sprint-7.5-Mandanten (Kühn + 3 Bestand); der Alt-Demo-Mandant ist weg
    expect(clients.length).toBe(4);
    expect(clients.some((c) => c.mandant_nr === "10100")).toBe(true);
    expect(clients.some((c) => c.mandant_nr === "88888")).toBe(false);
    expect(store.getEntries().length).toBe(52);
  });

  it("B2-Fix: selectedYear wird beim fresh Seed auf 2025 gesetzt", async () => {
    const { autoSeedDemoIfNeeded } = await import("../demoSeed");
    expect(localStorage.getItem("harouda:selectedYear")).toBeNull();

    await autoSeedDemoIfNeeded();

    expect(localStorage.getItem("harouda:selectedYear")).toBe("2025");
  });

  it("B2-Fix: respektiert User-gesetztes selectedYear", async () => {
    localStorage.setItem("harouda:selectedYear", "2030");
    const { autoSeedDemoIfNeeded } = await import("../demoSeed");

    await autoSeedDemoIfNeeded();

    // User-Wahl bleibt unverändert
    expect(localStorage.getItem("harouda:selectedYear")).toBe("2030");
  });

  it("B6-Fix: fail-loud — Exception wird weitergereicht wenn Seed scheitert", async () => {
    const clients = await import("../clients");
    const spy = vi
      .spyOn(clients, "createClient")
      .mockRejectedValueOnce(new Error("boom"));
    const { autoSeedDemoIfNeeded } = await import("../demoSeed");

    await expect(autoSeedDemoIfNeeded()).rejects.toThrow("boom");

    // FLAG-v2 bleibt NICHT gesetzt → nächster Load versucht erneut
    expect(localStorage.getItem("harouda:demo-seeded-v3")).toBeNull();
    spy.mockRestore();
  });

  it("Idempotenz: zweiter autoSeed-Call produziert keine Duplikate", async () => {
    const { autoSeedDemoIfNeeded } = await import("../demoSeed");

    await autoSeedDemoIfNeeded();
    const entryCountFirst = store.getEntries().length;
    const clientCountFirst = store.getClients().length;
    const anlagenCountFirst = store.getAnlagegueter().length;

    await autoSeedDemoIfNeeded();

    expect(store.getEntries().length).toBe(entryCountFirst);
    expect(store.getClients().length).toBe(clientCountFirst);
    expect(store.getAnlagegueter().length).toBe(anlagenCountFirst);
  });
});

// ==========================================================================
// Sprint 7.5 Fixes (B1, B5): DEMO_MODE + Permissions
// ==========================================================================

describe("Sprint 7.5 Fixes — DEMO_MODE + Permissions", () => {
  it("B1-Fix: DEMO_MODE ist in Dev/Test standardmäßig TRUE", async () => {
    // vitest setzt import.meta.env.DEV === true; VITE_DEMO_MODE ist im
    // CI-Kontext unset → DEMO_MODE muss auf true stehen
    const { DEMO_MODE } = await import("../supabase");
    expect(DEMO_MODE).toBe(true);
  });

  it("B5-Fix: canWrite = true für DEMO_MODE-Owner-Rolle", async () => {
    const { computePermissions } = await import("../../hooks/usePermissions");
    // DEMO_MODE liefert in CompanyContext hartcodiert role="owner"
    const perms = computePermissions("owner");
    expect(perms.canWrite).toBe(true);
    expect(perms.canManage).toBe(true);
    expect(perms.canAdmin).toBe(true);
    expect(perms.canOwn).toBe(true);
  });
});
