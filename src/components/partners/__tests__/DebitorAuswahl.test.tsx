/** @jsxImportSource react */
// Sprint 19.C · DebitorAuswahl-Tests.

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { DebitorAuswahl } from "../DebitorAuswahl";
import { createBusinessPartner } from "../../../api/businessPartners";
import type { BusinessPartner } from "../../../types/db";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

const CLIENT = "cl-da";

async function seed(
  over: Partial<BusinessPartner> & { name: string }
): ReturnType<typeof createBusinessPartner> {
  const base: Parameters<typeof createBusinessPartner>[0] = {
    company_id: "c",
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

function mount(props: Parameters<typeof DebitorAuswahl>[0]): {
  unmount: () => void;
} {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root: Root = createRoot(container);
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0, staleTime: 0 } },
  });
  act(() => {
    root.render(
      <QueryClientProvider client={qc}>
        <DebitorAuswahl {...props} />
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

describe("DebitorAuswahl", () => {
  it("#1 Freitext-Option ist immer als erster Eintrag vorhanden", async () => {
    const r = mount({ clientId: CLIENT, value: null, onChange: () => {} });
    await act(async () => flush());
    const sel = document.querySelector<HTMLSelectElement>(
      '[data-testid="sel-debitor"]'
    )!;
    expect(sel.options.length).toBeGreaterThanOrEqual(1);
    expect(sel.options[0].value).toBe("");
    expect(sel.options[0].textContent).toMatch(/Freitext/);
    r.unmount();
  });

  it("#2 Seeded-Debitoren erscheinen in der Liste", async () => {
    await seed({ name: "Alpha AG", anschrift_ort: "Berlin" });
    await seed({ name: "Beta GmbH", anschrift_ort: "München" });
    const r = mount({ clientId: CLIENT, value: null, onChange: () => {} });
    await act(async () => flush());
    const sel = document.querySelector<HTMLSelectElement>(
      '[data-testid="sel-debitor"]'
    )!;
    const texts = Array.from(sel.options).map((o) => o.textContent ?? "");
    expect(texts.join("|")).toMatch(/Alpha AG/);
    expect(texts.join("|")).toMatch(/Beta GmbH/);
    r.unmount();
  });

  it("#3 Suche filtert die Optionen", async () => {
    await seed({ name: "Alpha AG" });
    await seed({ name: "Beta GmbH" });
    const r = mount({ clientId: CLIENT, value: null, onChange: () => {} });
    await act(async () => flush());
    const search = document.querySelector<HTMLInputElement>(
      '[data-testid="inp-debitor-search"]'
    )!;
    await act(async () => {
      typeInto(search, "Alpha");
      await flush();
    });
    const sel = document.querySelector<HTMLSelectElement>(
      '[data-testid="sel-debitor"]'
    )!;
    const texts = Array.from(sel.options).map((o) => o.textContent ?? "");
    // Freitext + Alpha, aber nicht Beta
    expect(texts.some((t) => t.includes("Alpha"))).toBe(true);
    expect(texts.some((t) => t.includes("Beta"))).toBe(false);
    r.unmount();
  });

  it("#4 onChange liefert (partnerId, partner) bei Auswahl", async () => {
    const p = await seed({ name: "Picked" });
    const spy = vi.fn();
    const r = mount({ clientId: CLIENT, value: null, onChange: spy });
    await act(async () => flush());
    const sel = document.querySelector<HTMLSelectElement>(
      '[data-testid="sel-debitor"]'
    )!;
    await act(async () => {
      sel.value = p.id;
      sel.dispatchEvent(new Event("change", { bubbles: true }));
      await flush();
    });
    expect(spy).toHaveBeenCalledWith(p.id, expect.objectContaining({ id: p.id, name: "Picked" }));
    r.unmount();
  });

  it("#5 clientId=null: Select ist disabled", async () => {
    const r = mount({ clientId: null, value: null, onChange: () => {} });
    await act(async () => flush());
    const sel = document.querySelector<HTMLSelectElement>(
      '[data-testid="sel-debitor"]'
    )!;
    expect(sel.disabled).toBe(true);
    r.unmount();
  });

  it("#6 Zurueck auf Freitext: onChange(null, null)", async () => {
    const p = await seed({ name: "P" });
    const spy = vi.fn();
    const r = mount({ clientId: CLIENT, value: p.id, onChange: spy });
    await act(async () => flush());
    const sel = document.querySelector<HTMLSelectElement>(
      '[data-testid="sel-debitor"]'
    )!;
    await act(async () => {
      sel.value = "";
      sel.dispatchEvent(new Event("change", { bubbles: true }));
      await flush();
    });
    expect(spy).toHaveBeenCalledWith(null, null);
    r.unmount();
  });
});
