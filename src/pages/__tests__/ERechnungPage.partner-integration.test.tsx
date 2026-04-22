/** @jsxImportSource react */
// Sprint 19.C · ERechnungPage Kunden-Picker-Integration.

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import ERechnungPage from "../ERechnungPage";
import { MandantProvider } from "../../contexts/MandantContext";
import { SettingsProvider } from "../../contexts/SettingsContext";
import type { BusinessPartner } from "../../types/db";
import { createBusinessPartner } from "../../api/businessPartners";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

const CLIENT = "cl-er";
const COMPANY = "co-er";

function seedDebitor(
  over: Partial<BusinessPartner> & { name: string }
): ReturnType<typeof createBusinessPartner> {
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
  return createBusinessPartner({ ...base, ...over });
}

function UrlProbe() {
  const loc = useLocation();
  return (
    <div
      data-testid="url-probe"
      data-pathname={loc.pathname}
      data-search={loc.search}
    />
  );
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
          <MemoryRouter
            initialEntries={[`/buchungen/e-rechnung?mandantId=${CLIENT}`]}
          >
            <MandantProvider>
              <UrlProbe />
              <Routes>
                <Route
                  path="/buchungen/e-rechnung"
                  element={<ERechnungPage />}
                />
                {/* /partners/new-Route existiert ab 19.C nicht mehr
                    (Dialog-based Editor) */}
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

describe("ERechnungPage · Customer-Picker", () => {
  it("#1 Picker wird im Create-Tab gerendert", async () => {
    const r = mount();
    await act(async () => flush());
    expect(
      document.querySelector('[data-testid="debitor-block"]')
    ).not.toBeNull();
    expect(
      document.querySelector('[data-testid="sel-debitor"]')
    ).not.toBeNull();
    act(() => r.unmount());
  });

  it("#2 Default ist 'Freitext' (leere Option selected)", async () => {
    const r = mount();
    await act(async () => flush());
    const sel = document.querySelector<HTMLSelectElement>(
      '[data-testid="sel-debitor"]'
    )!;
    expect(sel.value).toBe("");
    expect(
      document.querySelector('[data-testid="badge-from-stammdaten"]')
    ).toBeNull();
    act(() => r.unmount());
  });

  it("#3 Dropdown listet seeded Debitoren", async () => {
    await seedDebitor({ name: "Alpha AG", anschrift_ort: "Berlin" });
    await seedDebitor({ name: "Beta GmbH", anschrift_ort: "München" });
    const r = mount();
    await act(async () => flush());
    const sel = document.querySelector<HTMLSelectElement>(
      '[data-testid="sel-debitor"]'
    )!;
    const optionTexts = Array.from(sel.options).map((o) => o.textContent ?? "");
    expect(optionTexts.join("|")).toMatch(/Alpha AG/);
    expect(optionTexts.join("|")).toMatch(/Beta GmbH/);
    act(() => r.unmount());
  });

  it("#4 Auswahl eines Debitors zeigt 'Von Stammdaten'-Badge", async () => {
    const p = await seedDebitor({
      name: "Picked",
      anschrift_ort: "Köln",
      anschrift_plz: "50667",
      anschrift_strasse: "Domstr.",
      anschrift_hausnummer: "1",
      ust_idnr: "DE111222333",
    });
    const r = mount();
    await act(async () => flush());
    const sel = document.querySelector<HTMLSelectElement>(
      '[data-testid="sel-debitor"]'
    )!;
    await act(async () => {
      sel.value = p.id;
      sel.dispatchEvent(new Event("change", { bubbles: true }));
      await flush();
    });
    expect(
      document.querySelector('[data-testid="badge-from-stammdaten"]')
    ).not.toBeNull();
    act(() => r.unmount());
  });

  it("#5 Auswahl eines Debitors fuellt Buyer-Felder", async () => {
    const p = await seedDebitor({
      name: "Picked",
      anschrift_ort: "Köln",
      anschrift_plz: "50667",
      anschrift_strasse: "Domstr.",
      anschrift_hausnummer: "1",
      ust_idnr: "DE111222333",
    });
    const r = mount();
    await act(async () => flush());
    const sel = document.querySelector<HTMLSelectElement>(
      '[data-testid="sel-debitor"]'
    )!;
    await act(async () => {
      sel.value = p.id;
      sel.dispatchEvent(new Event("change", { bubbles: true }));
      await flush();
    });
    // buyer-Felder suchen: das "Käufer"-section ist das 2. PartyEditor
    const nameInputs = Array.from(
      document.querySelectorAll<HTMLInputElement>("input")
    );
    const pickedName = nameInputs.find((i) => i.value === "Picked");
    expect(pickedName).toBeTruthy();
    const pickedUstId = nameInputs.find((i) => i.value === "DE111222333");
    expect(pickedUstId).toBeTruthy();
    act(() => r.unmount());
  });

  it("#6 Zurueck auf 'Freitext' entfernt den Badge", async () => {
    const p = await seedDebitor({ name: "Picked" });
    const r = mount();
    await act(async () => flush());
    const sel = document.querySelector<HTMLSelectElement>(
      '[data-testid="sel-debitor"]'
    )!;
    await act(async () => {
      sel.value = p.id;
      sel.dispatchEvent(new Event("change", { bubbles: true }));
      await flush();
    });
    await act(async () => {
      sel.value = "";
      sel.dispatchEvent(new Event("change", { bubbles: true }));
      await flush();
    });
    expect(
      document.querySelector('[data-testid="badge-from-stammdaten"]')
    ).toBeNull();
    act(() => r.unmount());
  });

  it("#7 'Als Debitor speichern'-Button bei Freitext + gefuelltem Name sichtbar", async () => {
    const r = mount();
    await act(async () => flush());
    // Default-Buyer hat Name "Kundenfirma AG" → Button sichtbar
    const btn = document.querySelector(
      '[data-testid="btn-als-debitor-speichern"]'
    );
    expect(btn).not.toBeNull();
    act(() => r.unmount());
  });

  it("#8 'Als Debitor speichern'-Click öffnet PartnerEditor-Dialog (kein Navigate)", async () => {
    const r = mount();
    await act(async () => flush());
    const btn = document.querySelector<HTMLButtonElement>(
      '[data-testid="btn-als-debitor-speichern"]'
    )!;
    await act(async () => {
      btn.click();
      await flush(20);
    });
    // Dialog erscheint, Pfad bleibt auf /buchungen/e-rechnung.
    expect(
      document.querySelector('[data-testid="partner-editor-dialog"]')
    ).not.toBeNull();
    const probe = document.querySelector('[data-testid="url-probe"]')!;
    expect(probe.getAttribute("data-pathname")).toBe(
      "/buchungen/e-rechnung"
    );
    act(() => r.unmount());
  });

  it("#9 Picker blendet 'Als Debitor speichern' wenn Debitor ausgewaehlt", async () => {
    const p = await seedDebitor({ name: "Picked" });
    const r = mount();
    await act(async () => flush());
    const sel = document.querySelector<HTMLSelectElement>(
      '[data-testid="sel-debitor"]'
    )!;
    await act(async () => {
      sel.value = p.id;
      sel.dispatchEvent(new Event("change", { bubbles: true }));
      await flush();
    });
    expect(
      document.querySelector('[data-testid="btn-als-debitor-speichern"]')
    ).toBeNull();
    act(() => r.unmount());
  });

  it("#10 Hinweis 'Legacy-Rechnungen bleiben unveraendert' sichtbar", async () => {
    const r = mount();
    await act(async () => flush());
    expect(document.body.textContent).toMatch(/Legacy-Rechnungen/);
    act(() => r.unmount());
  });

  it("#11 Nur aktive Debitoren werden gelistet (inaktive gefiltert)", async () => {
    await seedDebitor({ name: "Aktiv" });
    const inactive = await seedDebitor({ name: "Inaktiv" });
    // direkt im Store is_active=false setzen
    const raw = JSON.parse(localStorage.getItem("harouda-business-partners")!);
    const idx = raw.findIndex((x: BusinessPartner) => x.id === inactive.id);
    raw[idx].is_active = false;
    localStorage.setItem("harouda-business-partners", JSON.stringify(raw));

    const r = mount();
    await act(async () => flush());
    const sel = document.querySelector<HTMLSelectElement>(
      '[data-testid="sel-debitor"]'
    )!;
    const optionTexts = Array.from(sel.options).map((o) => o.textContent ?? "");
    expect(optionTexts.join("|")).toMatch(/Aktiv/);
    expect(optionTexts.join("|")).not.toMatch(/Inaktiv/);
    act(() => r.unmount());
  });

  it("#12 Kreditoren werden NICHT im Kunden-Picker gelistet", async () => {
    await seedDebitor({ name: "Debitor X" });
    await seedDebitor({
      name: "Kreditor Y",
      partner_type: "kreditor",
    });
    const r = mount();
    await act(async () => flush());
    const sel = document.querySelector<HTMLSelectElement>(
      '[data-testid="sel-debitor"]'
    )!;
    const texts = Array.from(sel.options).map((o) => o.textContent ?? "");
    expect(texts.join("|")).toMatch(/Debitor X/);
    expect(texts.join("|")).not.toMatch(/Kreditor Y/);
    act(() => r.unmount());
  });
});
