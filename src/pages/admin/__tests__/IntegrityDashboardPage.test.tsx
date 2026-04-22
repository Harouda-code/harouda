/** @jsxImportSource react */
// Sprint 20.C.3 · IntegrityDashboardPage Tests.
//
// Die Role-Gates + UI werden gegen einen gemockten CompanyContext
// gefahren, damit jede Rolle (owner/admin/tax_auditor/member/readonly/
// null) in isolation prüfbar ist. MandantContext bleibt echt (URL-basiert).

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import IntegrityDashboardPage from "../IntegrityDashboardPage";
import { MandantProvider } from "../../../contexts/MandantContext";
import { SettingsProvider } from "../../../contexts/SettingsContext";
import type { CompanyRole } from "../../../contexts/CompanyContext";
import type { BusinessPartner } from "../../../types/db";
import {
  createBusinessPartner,
  updateBusinessPartner,
} from "../../../api/businessPartners";
import { logVerification } from "../../../api/ustidVerifications";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

// Mutable mock state für useCompany (setze role in beforeEach pro Test).
let MOCK_ROLE: CompanyRole | null = "owner";
const MOCK_COMPANY_ID = "co-integrity-test";

vi.mock("../../../contexts/CompanyContext", async () => {
  const actual = await vi.importActual<
    typeof import("../../../contexts/CompanyContext")
  >("../../../contexts/CompanyContext");
  return {
    ...actual,
    useCompany: () => ({
      activeCompanyId: MOCK_COMPANY_ID,
      activeRole: MOCK_ROLE,
      memberships: [
        {
          companyId: MOCK_COMPANY_ID,
          companyName: "Test-Kanzlei",
          role: MOCK_ROLE ?? "readonly",
        },
      ],
      loading: false,
      setActiveCompanyId: () => {},
      reload: async () => {},
    }),
    useCompanyId: () => MOCK_COMPANY_ID,
  };
});

// downloadText im Export spionieren, nicht tatsächlich Files erzeugen.
vi.mock("../../../utils/exporters", async () => {
  const actual = await vi.importActual<
    typeof import("../../../utils/exporters")
  >("../../../utils/exporters");
  return {
    ...actual,
    downloadText: vi.fn(),
  };
});

const CLIENT = "cl-integrity-ui";

function mount() {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root: Root = createRoot(container);
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0, staleTime: 0 } },
  });
  act(() => {
    root.render(
      <QueryClientProvider client={qc}>
        <SettingsProvider>
          <MemoryRouter
            initialEntries={[`/admin/integrity?mandantId=${CLIENT}`]}
          >
            <MandantProvider>
              <Routes>
                <Route
                  path="/admin/integrity"
                  element={<IntegrityDashboardPage />}
                />
              </Routes>
            </MandantProvider>
          </MemoryRouter>
        </SettingsProvider>
      </QueryClientProvider>
    );
  });
  return {
    unmount: () => {
      act(() => root.unmount());
      container.remove();
    },
  };
}

async function flush(times = 20) {
  for (let i = 0; i < times; i++) await Promise.resolve();
  await new Promise((r) => setTimeout(r, 0));
}

async function seedBpvWithUpdate(): Promise<string> {
  const p = await createBusinessPartner({
    company_id: MOCK_COMPANY_ID,
    client_id: CLIENT,
    partner_type: "debitor",
    name: "Alpha GmbH",
    legal_name: null,
    rechtsform: null,
    ust_idnr: null,
    steuernummer: null,
    finanzamt: null,
    hrb: null,
    registergericht: null,
    anschrift_strasse: null,
    anschrift_hausnummer: null,
    anschrift_plz: null,
    anschrift_ort: null,
    anschrift_land_iso: "DE",
    email: null,
    telefon: null,
    iban: null,
    bic: null,
    is_public_authority: false,
    leitweg_id: null,
    preferred_invoice_format: "pdf",
    peppol_id: null,
    verrechnungs_partner_id: null,
    zahlungsziel_tage: null,
    skonto_prozent: null,
    skonto_tage: null,
    standard_erloeskonto: null,
    standard_aufwandskonto: null,
    is_active: true,
    notes: null,
  });
  await updateBusinessPartner(p.id, { name: "Alpha AG" });
  return p.id;
}

async function tamperBpv(): Promise<void> {
  const raw =
    localStorage.getItem("harouda-business-partners-versions") ?? "[]";
  const rows = JSON.parse(raw) as Array<{ snapshot: BusinessPartner }>;
  rows[0].snapshot = { ...rows[0].snapshot, name: "TAMPERED" };
  localStorage.setItem(
    "harouda-business-partners-versions",
    JSON.stringify(rows)
  );
}

beforeEach(() => {
  localStorage.clear();
  document.body.innerHTML = "";
  MOCK_ROLE = "owner";
});
afterEach(() => {
  vi.restoreAllMocks();
  document.body.innerHTML = "";
});

describe("IntegrityDashboardPage · Role-Gate", () => {
  it("#1 role='owner' → Dashboard, Button sichtbar, kein Forbidden", async () => {
    MOCK_ROLE = "owner";
    const r = mount();
    await act(async () => flush());
    expect(
      document.querySelector('[data-testid="integrity-dashboard"]')
    ).not.toBeNull();
    expect(
      document.querySelector('[data-testid="btn-run-integrity"]')
    ).not.toBeNull();
    expect(document.querySelector('[data-testid="forbidden"]')).toBeNull();
    r.unmount();
  });

  it("#2 role='member' → Forbidden, kein Dashboard", async () => {
    MOCK_ROLE = "member";
    const r = mount();
    await act(async () => flush());
    expect(document.querySelector('[data-testid="forbidden"]')).not.toBeNull();
    expect(
      document.querySelector('[data-testid="integrity-dashboard"]')
    ).toBeNull();
    r.unmount();
  });

  it("#3 role=null → Forbidden", async () => {
    MOCK_ROLE = null;
    const r = mount();
    await act(async () => flush());
    expect(document.querySelector('[data-testid="forbidden"]')).not.toBeNull();
    r.unmount();
  });

  it("#4 role='tax_auditor' → Dashboard erlaubt", async () => {
    MOCK_ROLE = "tax_auditor";
    const r = mount();
    await act(async () => flush());
    expect(
      document.querySelector('[data-testid="integrity-dashboard"]')
    ).not.toBeNull();
    r.unmount();
  });
});

describe("IntegrityDashboardPage · Prüfung + Ergebnis", () => {
  it("#5 Button-Klick füllt Ergebnis-Tabelle mit 4 Chains", async () => {
    MOCK_ROLE = "owner";
    const r = mount();
    await act(async () => flush());
    const btn = document.querySelector<HTMLButtonElement>(
      '[data-testid="btn-run-integrity"]'
    )!;
    await act(async () => {
      btn.click();
      await flush(25);
    });
    const table = document.querySelector('[data-testid="integrity-table"]');
    expect(table).not.toBeNull();
    expect(
      document.querySelector('[data-testid="row-chain-journal"]')
    ).not.toBeNull();
    expect(
      document.querySelector('[data-testid="row-chain-audit"]')
    ).not.toBeNull();
    expect(
      document.querySelector('[data-testid="row-chain-bpv"]')
    ).not.toBeNull();
    expect(
      document.querySelector('[data-testid="row-chain-uv"]')
    ).not.toBeNull();
    r.unmount();
  });

  it("#6 Alle Ketten leer → grünes 'Alle intakt'-Banner", async () => {
    MOCK_ROLE = "admin";
    const r = mount();
    await act(async () => flush());
    await act(async () => {
      document
        .querySelector<HTMLButtonElement>('[data-testid="btn-run-integrity"]')!
        .click();
      await flush(25);
    });
    expect(
      document.querySelector('[data-testid="banner-all-ok"]')
    ).not.toBeNull();
    expect(document.querySelector('[data-testid="banner-broken"]')).toBeNull();
    r.unmount();
  });

  it("#7 BPV-Chain getampered → rotes Banner + reason 'hash_mismatch'", async () => {
    MOCK_ROLE = "owner";
    await seedBpvWithUpdate();
    await tamperBpv();
    const r = mount();
    await act(async () => flush());
    await act(async () => {
      document
        .querySelector<HTMLButtonElement>('[data-testid="btn-run-integrity"]')!
        .click();
      await flush(25);
    });
    expect(document.querySelector('[data-testid="banner-broken"]')).not.toBeNull();
    expect(
      document.querySelector('[data-testid="badge-broken-bpv"]')
    ).not.toBeNull();
    const reasonCell = document.querySelector('[data-testid="reason-bpv"]');
    expect(reasonCell?.textContent).toMatch(/hash_mismatch/);
    r.unmount();
  });

  it("#8 JSON-Export-Button triggert downloadText mit Report-Inhalt", async () => {
    MOCK_ROLE = "owner";
    await logVerification({
      company_id: MOCK_COMPANY_ID,
      client_id: CLIENT,
      partner_id: null,
      requested_ust_idnr: "DE123",
      requester_ust_idnr: null,
      raw_http_response: null,
      raw_http_response_headers: null,
      raw_http_request_url: "demo://",
      vies_valid: null,
      vies_request_date: null,
      vies_request_identifier: null,
      vies_trader_name: null,
      vies_trader_address: null,
      vies_raw_parsed: null,
      verification_status: "VALID",
      verification_source: "BZST",
      error_message: null,
      retention_hold: false,
      retention_hold_reason: null,
      created_by: null,
    });
    const exporters = await import("../../../utils/exporters");
    const r = mount();
    await act(async () => flush());
    await act(async () => {
      document
        .querySelector<HTMLButtonElement>('[data-testid="btn-run-integrity"]')!
        .click();
      await flush(25);
    });
    await act(async () => {
      document
        .querySelector<HTMLButtonElement>('[data-testid="btn-export-json"]')!
        .click();
      await flush();
    });
    expect(exporters.downloadText).toHaveBeenCalledTimes(1);
    const [text, fname, mime] = (
      exporters.downloadText as unknown as { mock: { calls: unknown[][] } }
    ).mock.calls[0];
    expect(typeof text).toBe("string");
    expect((text as string).length).toBeGreaterThan(20);
    expect(String(fname)).toMatch(/^integrity-report-.*\.json$/);
    expect(mime).toBe("application/json");
    // Der heruntergeladene Inhalt ist valides JSON und enthält die 4 Chains.
    const parsed = JSON.parse(text as string);
    expect(parsed.clientId).toBe(CLIENT);
    expect(parsed.chains).toHaveLength(4);
    r.unmount();
  });
});
