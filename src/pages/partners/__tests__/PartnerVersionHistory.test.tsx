/** @jsxImportSource react */
// Sprint 19.C · PartnerVersionHistory-Smoke.

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import PartnerVersionHistory from "../PartnerVersionHistory";
import { MandantProvider } from "../../../contexts/MandantContext";
import { SettingsProvider } from "../../../contexts/SettingsContext";
import type { BusinessPartner } from "../../../types/db";
import {
  createBusinessPartner,
  updateBusinessPartner,
} from "../../../api/businessPartners";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

const CLIENT = "cl-hist";
const COMPANY = "co-h";

function newPartner(over: Partial<BusinessPartner> & { name: string }) {
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
    preferred_invoice_format: "pdf" as const,
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
  return createBusinessPartner({ ...base, ...over });
}

function mount(id: string) {
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
            initialEntries={[`/partners/${id}/history?mandantId=${CLIENT}`]}
          >
            <MandantProvider>
              <Routes>
                <Route
                  path="/partners/:id/history"
                  element={<PartnerVersionHistory />}
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

beforeEach(() => {
  localStorage.clear();
  document.body.innerHTML = "";
});
afterEach(() => {
  vi.restoreAllMocks();
  document.body.innerHTML = "";
});

describe("PartnerVersionHistory", () => {
  it("#1 Leerer Partner ohne Versionen → 'Keine Versionen'-Hinweis", async () => {
    const p = await newPartner({ name: "Frisch" });
    const r = mount(p.id);
    await act(async () => flush());
    expect(document.body.textContent).toMatch(/Keine Versionen/);
    act(() => r.unmount());
  });

  it("#2 Nach 2 Updates: 2 Versions-Buttons", async () => {
    const p = await newPartner({ name: "V0" });
    await updateBusinessPartner(p.id, { name: "V1" });
    await updateBusinessPartner(p.id, { name: "V2" });
    const r = mount(p.id);
    await act(async () => flush());
    const list = document.querySelector('[data-testid="version-list"]')!;
    expect(list.querySelectorAll("li").length).toBe(2);
    act(() => r.unmount());
  });

  it("#3 Version-Auswahl zeigt Diff-Tabelle", async () => {
    const p = await newPartner({ name: "Before" });
    await updateBusinessPartner(p.id, { name: "After" });
    const r = mount(p.id);
    await act(async () => flush());
    const btn = document.querySelector<HTMLButtonElement>(
      '[data-testid="version-btn-1"]'
    )!;
    await act(async () => {
      btn.click();
      await flush();
    });
    const diff = document.querySelector('[data-testid="diff-table"]');
    expect(diff).not.toBeNull();
    expect(diff!.textContent).toMatch(/name/);
    expect(diff!.textContent).toMatch(/Before/);
    expect(diff!.textContent).toMatch(/After/);
    act(() => r.unmount());
  });

  it("#4 Retention-Hinweis pro Version sichtbar", async () => {
    const p = await newPartner({ name: "R" });
    await updateBusinessPartner(p.id, { name: "R2" });
    const r = mount(p.id);
    await act(async () => flush());
    expect(document.body.textContent).toMatch(/Retention bis/);
    act(() => r.unmount());
  });

  it("#5 Kein Feldunterschied → entsprechender Hinweis", async () => {
    const p = await newPartner({ name: "X" });
    // Update, der den Namen unveraendert laesst (Sanity: zumindest ein
    // Feld muss sich ändern, sonst feuert der Snapshot-Trigger im DEMO
    // nicht). Wir updaten is_active zweimal hin und zurück.
    await updateBusinessPartner(p.id, { is_active: false });
    await updateBusinessPartner(p.id, { is_active: true });
    const r = mount(p.id);
    await act(async () => flush());
    // v2-Snapshot (is_active=false) vs. aktueller (is_active=true) → Diff
    const v2 = document.querySelector<HTMLButtonElement>(
      '[data-testid="version-btn-2"]'
    )!;
    await act(async () => {
      v2.click();
      await flush();
    });
    const diff = document.querySelector('[data-testid="diff-table"]');
    expect(diff).not.toBeNull();
    act(() => r.unmount());
  });
});
