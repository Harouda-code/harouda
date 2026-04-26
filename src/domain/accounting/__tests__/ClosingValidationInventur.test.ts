// Sprint 17 / Schritt 7 · ClosingValidation-Inventur-Integration.

import { describe, it, expect, beforeEach } from "vitest";
import { validateYearEnd } from "../ClosingValidation";
import { createClient } from "../../../api/clients";
import { createSession, updateSession } from "../../../api/inventur";
import { store } from "../../../api/store";
import type { Account } from "../../../types/db";

const COMPANY = "company-demo";

beforeEach(() => {
  localStorage.clear();
  // minimale Accounts + Client.
  const accs: Account[] = [
    {
      id: "a-1200",
      konto_nr: "1200",
      bezeichnung: "Bank",
      kategorie: "aktiva",
      ust_satz: null,
      skr: "SKR03",
      is_active: true,
    },
  ];
  store.setAccounts(accs);
});

async function seedClient(
  rechtsform: "GmbH" | "Einzelunternehmen" = "GmbH"
): Promise<void> {
  await createClient({
    mandant_nr: "90000",
    name: "Test GmbH",
    rechtsform,
  });
  // Client-ID aus Store ziehen und als Parameter-Wert nehmen.
}

async function getClientId(): Promise<string> {
  return store.getClients()[0].id;
}

describe("ClosingValidation · Inventur-Integration (Sprint 17)", () => {
  it("#1 Keine Session → CLOSING_INVENTUR_MISSING Warn (nicht blockend)", async () => {
    await seedClient("GmbH");
    const clientId = await getClientId();
    const report = await validateYearEnd({
      mandantId: clientId,
      companyId: COMPANY,
      jahr: 2025,
      stichtag: "2025-12-31",
      employeesCount: 0,
    });
    const f = report.findings.find(
      (x) => x.code === "CLOSING_INVENTUR_MISSING"
    );
    expect(f).toBeDefined();
    expect(f!.severity).toBe("warning");
    expect(f!.message_de).toContain("§ 240 HGB");
    // Nicht blockend.
    expect(report.darf_jahresabschluss_erstellen).toBe(true);
  });

  it("#2 Offene Session → CLOSING_INVENTUR_UNVOLLSTAENDIG Error (blockt)", async () => {
    await seedClient("GmbH");
    const clientId = await getClientId();
    await createSession({
      client_id: clientId,
      jahr: 2025,
      stichtag: "2025-12-31",
    });
    const report = await validateYearEnd({
      mandantId: clientId,
      companyId: COMPANY,
      jahr: 2025,
      stichtag: "2025-12-31",
      employeesCount: 0,
    });
    const f = report.findings.find(
      (x) => x.code === "CLOSING_INVENTUR_UNVOLLSTAENDIG"
    );
    expect(f).toBeDefined();
    expect(f!.severity).toBe("error");
    expect(report.darf_jahresabschluss_erstellen).toBe(false);
  });

  it("#3 Abgeschlossene Session → keine Inventur-Finding", async () => {
    await seedClient("GmbH");
    const clientId = await getClientId();
    const sess = await createSession({
      client_id: clientId,
      jahr: 2025,
      stichtag: "2025-12-31",
    });
    await updateSession(sess.id, {
      status: "abgeschlossen",
      anlagen_inventur_abgeschlossen: true,
      bestands_inventur_abgeschlossen: true,
    });
    const report = await validateYearEnd({
      mandantId: clientId,
      companyId: COMPANY,
      jahr: 2025,
      stichtag: "2025-12-31",
      employeesCount: 0,
    });
    const inv = report.findings.filter((f) =>
      f.code.startsWith("CLOSING_INVENTUR")
    );
    expect(inv).toEqual([]);
  });

  it("#4 Gebuchte Session → ebenfalls keine Finding", async () => {
    await seedClient("GmbH");
    const clientId = await getClientId();
    const sess = await createSession({
      client_id: clientId,
      jahr: 2025,
      stichtag: "2025-12-31",
    });
    await updateSession(sess.id, {
      status: "gebucht",
      anlagen_inventur_abgeschlossen: true,
      bestands_inventur_abgeschlossen: true,
    });
    const report = await validateYearEnd({
      mandantId: clientId,
      companyId: COMPANY,
      jahr: 2025,
      stichtag: "2025-12-31",
      employeesCount: 0,
    });
    const f = report.findings.find((x) =>
      x.code.startsWith("CLOSING_INVENTUR")
    );
    expect(f).toBeUndefined();
  });

  it("#5 Anlagen_done=true, Bestaende_done=false → weiterhin UNVOLLSTAENDIG Error", async () => {
    await seedClient("GmbH");
    const clientId = await getClientId();
    const sess = await createSession({
      client_id: clientId,
      jahr: 2025,
      stichtag: "2025-12-31",
    });
    await updateSession(sess.id, {
      anlagen_inventur_abgeschlossen: true,
      // bestands_inventur_abgeschlossen bleibt false
    });
    const report = await validateYearEnd({
      mandantId: clientId,
      companyId: COMPANY,
      jahr: 2025,
      stichtag: "2025-12-31",
      employeesCount: 0,
    });
    const f = report.findings.find(
      (x) => x.code === "CLOSING_INVENTUR_UNVOLLSTAENDIG"
    );
    expect(f).toBeDefined();
    expect(f!.severity).toBe("error");
  });
});
