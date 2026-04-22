/** @jsxImportSource react */
// Sprint 19.C · KreditorenPage-Smoke (uses shared PartnerListPage).

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import KreditorenPage from "../KreditorenPage";
import { MandantProvider } from "../../contexts/MandantContext";
import { SettingsProvider } from "../../contexts/SettingsContext";
import type { BusinessPartner } from "../../types/db";
import { createBusinessPartner } from "../../api/businessPartners";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

const CLIENT = "cl-krd";
const COMPANY = "co-2";

function newPartner(
  over: Partial<BusinessPartner> & { name: string }
): Parameters<typeof createBusinessPartner>[0] {
  const base: Parameters<typeof createBusinessPartner>[0] = {
    company_id: COMPANY,
    client_id: CLIENT,
    partner_type: "kreditor",
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
          <MemoryRouter initialEntries={[`/kreditoren?mandantId=${CLIENT}`]}>
            <MandantProvider>
              <Routes>
                <Route path="/kreditoren" element={<KreditorenPage />} />
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

describe("KreditorenPage · Smoke", () => {
  it("#1 Header zeigt 'Kreditoren'", async () => {
    const r = mount();
    await act(async () => flush());
    expect(document.body.textContent).toContain("Kreditoren");
    act(() => r.unmount());
  });

  it("#2 'Neuer Kreditor' statt 'Neuer Debitor'", async () => {
    const r = mount();
    await act(async () => flush());
    const btn = document.querySelector('[data-testid="btn-partner-new"]');
    expect(btn?.textContent).toMatch(/Neuer Kreditor/);
    act(() => r.unmount());
  });

  it("#3 Kreditor wird aufgelistet, Debitor nicht", async () => {
    await createBusinessPartner(
      newPartner({ name: "Lieferant", partner_type: "kreditor" })
    );
    await createBusinessPartner(
      newPartner({ name: "Kunde", partner_type: "debitor" })
    );
    const r = mount();
    await act(async () => flush());
    expect(document.body.textContent).toContain("Lieferant");
    expect(document.body.textContent).not.toContain("Kunde");
    act(() => r.unmount());
  });

  it("#4 Kreditor-Nummer wird in Spalte angezeigt", async () => {
    await createBusinessPartner(
      newPartner({ name: "Lx", partner_type: "kreditor" })
    );
    const r = mount();
    await act(async () => flush());
    expect(document.body.textContent).toContain("70000");
    act(() => r.unmount());
  });

  it("#5 Typ=both erscheint in Kreditoren-Liste", async () => {
    await createBusinessPartner(
      newPartner({ name: "Bidir", partner_type: "both" })
    );
    const r = mount();
    await act(async () => flush());
    expect(document.body.textContent).toContain("Bidir");
    act(() => r.unmount());
  });

  it("#6 Suche filtert ueber Kreditor-Nummer", async () => {
    await createBusinessPartner(
      newPartner({ name: "A", partner_type: "kreditor" })
    );
    await createBusinessPartner(
      newPartner({ name: "B", partner_type: "kreditor" })
    );
    const r = mount();
    await act(async () => flush());
    const search = document.querySelector<HTMLInputElement>(
      '[data-testid="inp-search"]'
    )!;
    await act(async () => {
      typeInto(search, "70001");
      await flush();
    });
    const rows = document.querySelectorAll(
      '[data-testid="partners-table"] tbody tr'
    );
    expect(rows.length).toBe(1);
    act(() => r.unmount());
  });
});
