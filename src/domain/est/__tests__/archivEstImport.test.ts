// Phase 3 / Schritt 5b · archivEstImport-Tests.
//
// DEMO-Pfad: importAnlageNAusArchiv liest via AbrechnungArchivRepo.
// getForEmployee, das seit Schritt 5b im DEMO aus
// store.getLohnArchiv() aggregiert. Tests seeden darum direkt in den
// Store, ohne den Repo.save-Pfad zu laufen — entkoppelt die Import-
// Logik von der Serialize-Pipeline.

import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  importAnlageNAusArchiv,
  importAnlageVorsorgeAusArchiv,
} from "../archivEstImport";
import { store } from "../../../api/store";
import * as lohnRepos from "../../../lib/db/lohnRepos";
import type { LohnabrechnungArchivRow } from "../../lohn/types";

const EMPLOYEE = "emp-gf-001";
const CLIENT = "client-kuehn";
const COMPANY = "company-demo";

function makeArchivRow(
  monat: string,
  overrides: Partial<LohnabrechnungArchivRow> = {}
): LohnabrechnungArchivRow {
  return {
    id: `row-${monat}-${EMPLOYEE}`,
    company_id: COMPANY,
    client_id: CLIENT,
    employee_id: EMPLOYEE,
    abrechnungsmonat: monat,
    gesamt_brutto: 5000,
    gesamt_netto: 3200,
    gesamt_abzuege: 1800,
    gesamt_ag_kosten: 950,
    batch_id: null,
    locked: false,
    created_at: `${monat}-28T12:00:00.000Z`,
    abrechnung_json: {
      arbeitnehmer_id: EMPLOYEE,
      abrechnungsmonat: monat,
      abzuege: {
        lohnsteuer: "800.00",
        solidaritaetszuschlag: "44.00",
        kirchensteuer: "72.00",
        kv_an: "410.00",
        kv_zusatz_an: "42.50",
        pv_an: "85.00",
        rv_an: "465.00",
        av_an: "65.00",
        gesamtAbzuege: "1983.50",
      },
    },
    ...overrides,
  };
}

beforeEach(() => {
  localStorage.clear();
});

describe("archivEstImport · importAnlageNAusArchiv", () => {
  it("#1 Happy-Path: 12 Monate aggregieren zu Jahressummen", async () => {
    const months = [
      "2025-01", "2025-02", "2025-03", "2025-04",
      "2025-05", "2025-06", "2025-07", "2025-08",
      "2025-09", "2025-10", "2025-11", "2025-12",
    ];
    store.setLohnArchiv(months.map((m) => makeArchivRow(m)));

    const res = await importAnlageNAusArchiv({
      employeeId: EMPLOYEE,
      jahr: 2025,
      clientId: CLIENT,
      companyId: COMPANY,
    });

    expect(res.kind).toBe("ok");
    if (res.kind !== "ok") return;
    expect(res.vorschlag.abrechnungen_gefunden).toBe(12);
    expect(res.vorschlag.bruttoLohn).toBe(60000);
    expect(res.vorschlag.netto).toBe(38400);
    expect(res.vorschlag.lohnsteuer).toBe(9600); // 800 × 12
    expect(res.vorschlag.soliZuschlag).toBe(528); // 44 × 12
    expect(res.vorschlag.kirchensteuer).toBe(864); // 72 × 12
    // SV-AN: (410 + 42.50 + 85 + 465 + 65) × 12 = 1067.50 × 12 = 12810
    expect(res.vorschlag.sv_an_gesamt).toBe(12810);
    expect(res.vorschlag.jahr).toBe(2025);
    expect(res.vorschlag.employeeId).toBe(EMPLOYEE);
  });

  it("#2 Teil-Jahr: nur 3 Rows (Jan-März) liefert abrechnungen_gefunden=3", async () => {
    store.setLohnArchiv([
      makeArchivRow("2025-01"),
      makeArchivRow("2025-02"),
      makeArchivRow("2025-03"),
    ]);

    const res = await importAnlageNAusArchiv({
      employeeId: EMPLOYEE,
      jahr: 2025,
      clientId: CLIENT,
      companyId: COMPANY,
    });

    expect(res.kind).toBe("ok");
    if (res.kind !== "ok") return;
    expect(res.vorschlag.abrechnungen_gefunden).toBe(3);
    expect(res.vorschlag.bruttoLohn).toBe(15000);
    expect(res.vorschlag.netto).toBe(9600);
  });

  it("#3 Empty: kein Archiv-Row → kind='empty'", async () => {
    store.setLohnArchiv([]);

    const res = await importAnlageNAusArchiv({
      employeeId: EMPLOYEE,
      jahr: 2025,
      clientId: CLIENT,
      companyId: COMPANY,
    });

    expect(res.kind).toBe("empty");
    if (res.kind === "empty") {
      expect(res.reason).toBe("no-archiv-rows");
      expect(res.jahr).toBe(2025);
    }
  });

  it("#4 Wrong-Year-Filter: 2024-Rows werden bei jahr=2025 ignoriert", async () => {
    store.setLohnArchiv([
      makeArchivRow("2024-11"),
      makeArchivRow("2024-12"),
      makeArchivRow("2025-01"),
      makeArchivRow("2026-01"),
    ]);

    const res = await importAnlageNAusArchiv({
      employeeId: EMPLOYEE,
      jahr: 2025,
      clientId: CLIENT,
      companyId: COMPANY,
    });

    expect(res.kind).toBe("ok");
    if (res.kind !== "ok") return;
    // Nur 2025-01 zählt.
    expect(res.vorschlag.abrechnungen_gefunden).toBe(1);
    expect(res.vorschlag.bruttoLohn).toBe(5000);
  });

  it("#5 Error-Propagation: getForEmployee throw → kind='error'", async () => {
    const spy = vi
      .spyOn(lohnRepos.AbrechnungArchivRepo.prototype, "getForEmployee")
      .mockRejectedValue(new Error("Simulierter DB-Ausfall"));

    const res = await importAnlageNAusArchiv({
      employeeId: EMPLOYEE,
      jahr: 2025,
      clientId: CLIENT,
      companyId: COMPANY,
    });

    expect(res.kind).toBe("error");
    if (res.kind === "error") {
      expect(res.reason).toBe("fetch-failed");
      expect(res.detail).toMatch(/DB-Ausfall/);
    }

    spy.mockRestore();
  });

  it("#6 Legacy-Row ohne abrechnung_json: Abzüge bleiben 0, kein Throw", async () => {
    store.setLohnArchiv([
      makeArchivRow("2025-01", { abrechnung_json: null }),
      makeArchivRow("2025-02", { abrechnung_json: undefined }),
      // Row MIT json, damit Test auch Aggregation demonstriert.
      makeArchivRow("2025-03"),
    ]);

    const res = await importAnlageNAusArchiv({
      employeeId: EMPLOYEE,
      jahr: 2025,
      clientId: CLIENT,
      companyId: COMPANY,
    });

    expect(res.kind).toBe("ok");
    if (res.kind !== "ok") return;
    expect(res.vorschlag.abrechnungen_gefunden).toBe(3);
    // Brutto/Netto aus Row-Aggregate-Feldern — legacy OK (3 × 5000 / 3 × 3200).
    expect(res.vorschlag.bruttoLohn).toBe(15000);
    expect(res.vorschlag.netto).toBe(9600);
    // Abzüge nur aus der einen Row MIT json: Jan 0 + Feb 0 + März 800 = 800 etc.
    expect(res.vorschlag.lohnsteuer).toBe(800);
    expect(res.vorschlag.soliZuschlag).toBe(44);
    expect(res.vorschlag.kirchensteuer).toBe(72);
    expect(res.vorschlag.sv_an_gesamt).toBe(1067.5);
  });

  it("#7 Happy-Path: importAnlageVorsorgeAusArchiv liefert 5-Feld-Breakdown", async () => {
    const months = [
      "2025-01", "2025-02", "2025-03", "2025-04",
      "2025-05", "2025-06", "2025-07", "2025-08",
      "2025-09", "2025-10", "2025-11", "2025-12",
    ];
    store.setLohnArchiv(months.map((m) => makeArchivRow(m)));

    const res = await importAnlageVorsorgeAusArchiv({
      employeeId: EMPLOYEE,
      jahr: 2025,
      clientId: CLIENT,
      companyId: COMPANY,
    });
    expect(res.kind).toBe("ok");
    if (res.kind !== "ok") return;
    // Pro Monat aus makeArchivRow: kv_an=410, kv_zusatz_an=42.5,
    // pv_an=85, rv_an=465, av_an=65.
    expect(res.vorschlag.kv_an_basis).toBe(4920); // 410 × 12
    expect(res.vorschlag.kv_an_zusatz).toBe(510); // 42.5 × 12
    expect(res.vorschlag.pv_an).toBe(1020); // 85 × 12
    expect(res.vorschlag.rv_an).toBe(5580); // 465 × 12
    expect(res.vorschlag.av_an).toBe(780); // 65 × 12
    expect(res.vorschlag.abrechnungen_gefunden).toBe(12);
    expect(res.vorschlag.jahr).toBe(2025);
    expect(res.vorschlag.employeeId).toBe(EMPLOYEE);
  });

  it("#8 Vorsorge Teil-Jahr: nur 3 Rows", async () => {
    store.setLohnArchiv([
      makeArchivRow("2025-01"),
      makeArchivRow("2025-02"),
      makeArchivRow("2025-03"),
    ]);
    const res = await importAnlageVorsorgeAusArchiv({
      employeeId: EMPLOYEE,
      jahr: 2025,
      clientId: CLIENT,
      companyId: COMPANY,
    });
    expect(res.kind).toBe("ok");
    if (res.kind !== "ok") return;
    expect(res.vorschlag.abrechnungen_gefunden).toBe(3);
    expect(res.vorschlag.kv_an_basis).toBe(1230); // 410 × 3
  });

  it("#9 Vorsorge Empty: kein Archiv → kind='empty'", async () => {
    store.setLohnArchiv([]);
    const res = await importAnlageVorsorgeAusArchiv({
      employeeId: EMPLOYEE,
      jahr: 2025,
      clientId: CLIENT,
      companyId: COMPANY,
    });
    expect(res.kind).toBe("empty");
  });

  it("#10 Vorsorge Legacy-Row ohne abrechnung_json: alle 5 Werte 0 für diese Row", async () => {
    store.setLohnArchiv([
      makeArchivRow("2025-01", { abrechnung_json: null }),
      makeArchivRow("2025-02"), // normal
    ]);
    const res = await importAnlageVorsorgeAusArchiv({
      employeeId: EMPLOYEE,
      jahr: 2025,
      clientId: CLIENT,
      companyId: COMPANY,
    });
    expect(res.kind).toBe("ok");
    if (res.kind !== "ok") return;
    // Nur 1 Row beiträgt: 410 + 42.5 + 85 + 465 + 65 = 1067.5.
    expect(res.vorschlag.kv_an_basis).toBe(410);
    expect(res.vorschlag.kv_an_zusatz).toBe(42.5);
    expect(res.vorschlag.pv_an).toBe(85);
    expect(res.vorschlag.rv_an).toBe(465);
    expect(res.vorschlag.av_an).toBe(65);
    expect(res.vorschlag.abrechnungen_gefunden).toBe(2);
  });

  it("Bonus: Abzüge mit Legacy-Feld-Namen (soli) werden NICHT gelesen — erwartungskonform", async () => {
    // Falls eine Archiv-Row aus einer älteren Source irrtümlich `soli`
    // statt `solidaritaetszuschlag` trägt, liest der Importer den
    // korrekten Key und findet 0 im falschen Feld — dokumentiert den
    // Serialize-Shape-Vertrag (siehe serializeAbrechnung).
    store.setLohnArchiv([
      makeArchivRow("2025-01", {
        abrechnung_json: {
          abzuege: {
            lohnsteuer: "800.00",
            soli: "44.00", // <- falscher Key
            kirchensteuer: "72.00",
          },
        },
      }),
    ]);

    const res = await importAnlageNAusArchiv({
      employeeId: EMPLOYEE,
      jahr: 2025,
      clientId: CLIENT,
      companyId: COMPANY,
    });

    expect(res.kind).toBe("ok");
    if (res.kind !== "ok") return;
    expect(res.vorschlag.lohnsteuer).toBe(800);
    expect(res.vorschlag.soliZuschlag).toBe(0); // falscher Key → 0
    expect(res.vorschlag.kirchensteuer).toBe(72);
  });
});
