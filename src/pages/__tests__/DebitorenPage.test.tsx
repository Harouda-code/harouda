/** @jsxImportSource react */
// Sprint 19.C · DebitorenPage-Smoke-Tests.

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import DebitorenPage from "../DebitorenPage";
import { MandantProvider } from "../../contexts/MandantContext";
import { SettingsProvider } from "../../contexts/SettingsContext";
import type { BusinessPartner } from "../../types/db";
import { createBusinessPartner } from "../../api/businessPartners";
import { logVerification } from "../../api/ustidVerifications";
import { waitForCondition } from "../../test/waitForCondition";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

const CLIENT = "cl-dbt";
const COMPANY = "co-1";

function newPartner(over: Partial<BusinessPartner> & { name: string }): Parameters<typeof createBusinessPartner>[0] {
  const base: Parameters<typeof createBusinessPartner>[0] = {
    company_id: COMPANY,
    client_id: CLIENT,
    partner_type: "debitor",
    name: over.name,
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
  };
  return { ...base, ...over };
}

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
          <MemoryRouter initialEntries={[`/debitoren?mandantId=${CLIENT}`]}>
            <MandantProvider>
              <Routes>
                <Route path="/debitoren" element={<DebitorenPage />} />
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

async function flush(times = 15) {
  for (let i = 0; i < times; i++) await Promise.resolve();
  await new Promise((r) => setTimeout(r, 0));
}

// React 19 trackt `value` via native Setter. Direktes `input.value = ...`
// loest keinen React-Change aus — diesen Helper nutzt den React-Pfad.
function typeInto(input: HTMLInputElement, value: string) {
  const setter = Object.getOwnPropertyDescriptor(
    HTMLInputElement.prototype,
    "value"
  )!.set!;
  setter.call(input, value);
  input.dispatchEvent(new Event("input", { bubbles: true }));
}

beforeEach(() => {
  localStorage.clear();
  document.body.innerHTML = "";
});
afterEach(() => {
  vi.restoreAllMocks();
  document.body.innerHTML = "";
});

describe("DebitorenPage · Smoke", () => {
  it("#1 ohne Daten: Empty-Hinweis + 'Neuer Debitor'-Button sichtbar", async () => {
    const r = mount();
    await act(async () => flush());
    expect(
      document.querySelector('[data-testid="btn-partner-new"]')
    ).not.toBeNull();
    expect(document.body.textContent).toContain("Keine debitoren");
    act(() => r.unmount());
  });

  it("#2 mit seed: Tabelle zeigt 2 Debitoren + Treffer-Count", async () => {
    await createBusinessPartner(newPartner({ name: "Alpha GmbH" }));
    await createBusinessPartner(newPartner({ name: "Beta KG" }));
    const r = mount();
    await act(async () => flush());
    const rows = document.querySelectorAll(
      '[data-testid="partners-table"] tbody tr'
    );
    expect(rows.length).toBe(2);
    expect(
      document.querySelector('[data-testid="row-count"]')?.textContent
    ).toContain("2");
    act(() => r.unmount());
  });

  it("#3 Kreditor wird von Debitoren-Liste gefiltert (nicht angezeigt)", async () => {
    await createBusinessPartner(
      newPartner({ name: "Debitor X" })
    );
    await createBusinessPartner(
      newPartner({ name: "Kreditor Y", partner_type: "kreditor" })
    );
    const r = mount();
    await act(async () => flush());
    const rows = document.querySelectorAll(
      '[data-testid="partners-table"] tbody tr'
    );
    expect(rows.length).toBe(1);
    expect(document.body.textContent).toContain("Debitor X");
    expect(document.body.textContent).not.toContain("Kreditor Y");
    act(() => r.unmount());
  });

  it("#4 Typ=both erscheint ebenfalls in Debitoren-Liste", async () => {
    await createBusinessPartner(
      newPartner({ name: "Bilateral", partner_type: "both" })
    );
    const r = mount();
    await act(async () => flush());
    expect(document.body.textContent).toContain("Bilateral");
    act(() => r.unmount());
  });

  it("#5 Suche filtert nach Name-Teilstring", async () => {
    await createBusinessPartner(newPartner({ name: "Alpha GmbH" }));
    await createBusinessPartner(newPartner({ name: "Beta KG" }));
    const r = mount();
    await act(async () => flush());
    const search = document.querySelector<HTMLInputElement>(
      '[data-testid="inp-search"]'
    )!;
    await act(async () => {
      typeInto(search, "Alpha");
      await flush();
    });
    const rows = document.querySelectorAll(
      '[data-testid="partners-table"] tbody tr'
    );
    expect(rows.length).toBe(1);
    act(() => r.unmount());
  });

  it("#6 activeOnly-Toggle blendet inaktive ein/aus", async () => {
    const p = await createBusinessPartner(newPartner({ name: "Inaktiver" }));
    // Nach direkter Deaktivierung im Store
    const raw = JSON.parse(localStorage.getItem("harouda-business-partners")!);
    const idx = raw.findIndex(
      (x: BusinessPartner) => x.id === p.id
    );
    raw[idx].is_active = false;
    localStorage.setItem("harouda-business-partners", JSON.stringify(raw));

    const r = mount();
    await act(async () => flush());
    // Standard: nur aktive → 0 Treffer
    expect(
      document.querySelector('[data-testid="row-count"]')!.textContent
    ).toContain("0");
    // Toggle aus → inaktiver wird sichtbar
    const chk = document.querySelector<HTMLInputElement>(
      '[data-testid="chk-active-only"]'
    )!;
    await act(async () => {
      chk.click();
      await flush();
    });
    expect(
      document.querySelector('[data-testid="row-count"]')!.textContent
    ).toContain("1");
    act(() => r.unmount());
  });

  it("#7 USt-IdNr-Badge: ungeprueft wenn kein Log existiert", async () => {
    await createBusinessPartner(
      newPartner({ name: "X", ust_idnr: "DE111222333" })
    );
    const r = mount();
    await act(async () => flush());
    expect(
      document.querySelector('[data-status="NULL"]')
    ).not.toBeNull();
    act(() => r.unmount());
  });

  it("#8 USt-IdNr-Badge: geprueft wenn letzter Log VALID", async () => {
    const p = await createBusinessPartner(
      newPartner({ name: "X", ust_idnr: "DE111222333" })
    );
    await logVerification({
      company_id: COMPANY,
      client_id: CLIENT,
      partner_id: p.id,
      requested_ust_idnr: "DE111222333",
      requester_ust_idnr: null,
      raw_http_response: null,
      raw_http_response_headers: null,
      raw_http_request_url: "demo://",
      vies_valid: true,
      vies_request_date: "2026-04-01",
      vies_request_identifier: null,
      vies_trader_name: null,
      vies_trader_address: null,
      vies_raw_parsed: null,
      verification_status: "VALID",
      error_message: null,
      retention_hold: false,
      retention_hold_reason: null,
      created_by: null,
    });
    const r = mount();
    // Zwei geschachtelte useQuery-Zyklen: erst Partner-Liste, dann pro Row
    // die latest-Verification. Explizit zweimal flushen + kleines
    // Makro-Timeout, um beide React-Query-Commits abzuwarten.
    await act(async () => flush(30));
    await act(async () => {
      await new Promise((r) => setTimeout(r, 20));
      await flush(30);
    });
    expect(
      document.querySelector('[data-status="VALID"]')
    ).not.toBeNull();
    act(() => r.unmount());
  });

  it("#9 VIES-Button ruft verifyUstIdnrForPartner (DEMO liefert VALID)", async () => {
    const p = await createBusinessPartner(
      newPartner({ name: "V", ust_idnr: "DE123456789" })
    );
    const r = mount();
    await act(async () => flush());
    const btn = document.querySelector<HTMLButtonElement>(
      `[data-testid="btn-verify-${p.id}"]`
    )!;
    await act(async () => {
      btn.click();
    });
    // VIES-Verifikation lÃ¤uft async ueber routedVerifyUstIdnr +
    // logVerification. Wir warten state-basiert, bis der Eintrag im
    // localStorage erscheint - kein hartes flush(N), das auf CI unter
    // Last unzuverlaessig ist.
    await waitForCondition(
      () =>
        JSON.parse(
          localStorage.getItem("harouda-ustid-verifications") ?? "[]"
        ).length > 0,
      { timeoutMs: 2000, label: "ustid_verifications-Eintrag erscheint" }
    );
    const raw = JSON.parse(
      localStorage.getItem("harouda-ustid-verifications") ?? "[]"
    );
    expect(raw.length).toBeGreaterThan(0);
    expect(raw[0].verification_status).toBe("VALID");
    act(() => r.unmount());
  });

  it("#10 Ohne ausgewaehlten Mandanten: Hinweis + keine Tabelle", async () => {
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);
    const qc = new QueryClient({
      defaultOptions: { queries: { retry: false, gcTime: 0, staleTime: 0 } },
    });
    act(() => {
      root.render(
        <QueryClientProvider client={qc}>
          <SettingsProvider>
            <MemoryRouter initialEntries={["/debitoren"]}>
              <MandantProvider>
                <Routes>
                  <Route path="/debitoren" element={<DebitorenPage />} />
                </Routes>
              </MandantProvider>
            </MemoryRouter>
          </SettingsProvider>
        </QueryClientProvider>
      );
    });
    await act(async () => flush());
    expect(document.body.textContent).toMatch(/Mandant.+wählen/i);
    expect(
      document.querySelector('[data-testid="partners-table"]')
    ).toBeNull();
    act(() => root.unmount());
    container.remove();
  });
});
