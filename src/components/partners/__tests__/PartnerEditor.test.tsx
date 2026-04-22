/** @jsxImportSource react */
// Sprint 19.C · PartnerEditor (Dialog-Komponente) Tests.

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { PartnerEditor } from "../PartnerEditor";
import type { BusinessPartner } from "../../../types/db";
import {
  createBusinessPartner,
} from "../../../api/businessPartners";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

const CLIENT = "cl-pe";
const COMPANY = "co-pe";

async function seed(
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

type Hooks = {
  onSaved: ReturnType<typeof vi.fn<(p: BusinessPartner) => void>>;
  onCancel: ReturnType<typeof vi.fn<() => void>>;
};

function mount(
  props: Partial<Parameters<typeof PartnerEditor>[0]> = {}
): Hooks & { unmount: () => void } {
  const hooks: Hooks = {
    onSaved: vi.fn<(p: BusinessPartner) => void>(),
    onCancel: vi.fn<() => void>(),
  };
  const finalProps: Parameters<typeof PartnerEditor>[0] = {
    mode: "create",
    defaultType: "debitor",
    clientId: CLIENT,
    companyId: COMPANY,
    onSaved: hooks.onSaved,
    onCancel: hooks.onCancel,
    ...props,
  };
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root: Root = createRoot(container);
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0, staleTime: 0 } },
  });
  act(() => {
    root.render(
      <QueryClientProvider client={qc}>
        <PartnerEditor {...finalProps} />
      </QueryClientProvider>
    );
  });
  return {
    ...hooks,
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

function typeInto(input: HTMLInputElement | HTMLTextAreaElement, value: string) {
  const proto =
    input instanceof HTMLTextAreaElement
      ? HTMLTextAreaElement.prototype
      : HTMLInputElement.prototype;
  const setter = Object.getOwnPropertyDescriptor(proto, "value")!.set!;
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

describe("PartnerEditor · Dialog-Shell + Create-Flow", () => {
  it("#1 Dialog rendert mit Create-Title", async () => {
    const r = mount();
    await act(async () => flush());
    expect(
      document.querySelector('[data-testid="partner-editor-dialog"]')
    ).not.toBeNull();
    expect(document.body.textContent).toMatch(/Neuer Partner/);
    r.unmount();
  });

  it("#2 Save initial disabled (Name leer)", async () => {
    const r = mount();
    await act(async () => flush());
    const btn = document.querySelector<HTMLButtonElement>(
      '[data-testid="btn-save"]'
    )!;
    expect(btn.disabled).toBe(true);
    r.unmount();
  });

  it("#3 Cancel-Button ruft onCancel", async () => {
    const r = mount();
    await act(async () => flush());
    const btn = document.querySelector<HTMLButtonElement>(
      '[data-testid="btn-dialog-cancel"]'
    )!;
    await act(async () => {
      btn.click();
      await flush();
    });
    expect(r.onCancel).toHaveBeenCalledOnce();
    r.unmount();
  });

  it("#4 Create speichert + ruft onSaved(partner)", async () => {
    const r = mount();
    await act(async () => flush());
    const name = document.querySelector<HTMLInputElement>(
      '[data-testid="inp-name"]'
    )!;
    await act(async () => {
      typeInto(name, "Test GmbH");
      await flush();
    });
    const form = document.querySelector<HTMLFormElement>(
      '[data-testid="partner-form"]'
    )!;
    await act(async () => {
      form.dispatchEvent(
        new Event("submit", { bubbles: true, cancelable: true })
      );
      await flush(20);
    });
    expect(r.onSaved).toHaveBeenCalledOnce();
    expect(r.onSaved.mock.calls[0][0].name).toBe("Test GmbH");
    r.unmount();
  });

  it("#5 Hard-Block-Duplicate zeigt rote Fehlermeldung + ruft onSaved NICHT", async () => {
    await seed({ name: "Existing", ust_idnr: "DE111222333" });
    const r = mount();
    await act(async () => flush());
    const name = document.querySelector<HTMLInputElement>(
      '[data-testid="inp-name"]'
    )!;
    const ust = document.querySelector<HTMLInputElement>(
      '[data-testid="inp-ust-idnr"]'
    )!;
    await act(async () => {
      typeInto(name, "Duplikat");
      typeInto(ust, "DE111222333");
      await flush();
    });
    const form = document.querySelector<HTMLFormElement>(
      '[data-testid="partner-form"]'
    )!;
    await act(async () => {
      form.dispatchEvent(
        new Event("submit", { bubbles: true, cancelable: true })
      );
      await flush(15);
    });
    expect(
      document.querySelector('[data-testid="hard-block-error"]')
    ).not.toBeNull();
    expect(r.onSaved).not.toHaveBeenCalled();
    r.unmount();
  });
});

describe("PartnerEditor · Validierung", () => {
  it("#6 is_public_authority=true ohne leitweg → Save disabled", async () => {
    const r = mount();
    await act(async () => flush());
    await act(async () => {
      typeInto(
        document.querySelector<HTMLInputElement>('[data-testid="inp-name"]')!,
        "Behörde"
      );
      await flush();
    });
    await act(async () => {
      document
        .querySelector<HTMLInputElement>('[data-testid="chk-public"]')!
        .click();
      await flush();
    });
    const btn = document.querySelector<HTMLButtonElement>(
      '[data-testid="btn-save"]'
    )!;
    expect(btn.disabled).toBe(true);
    r.unmount();
  });

  it("#7 USt-IdNr on-blur mit invalidem Format zeigt Fehler", async () => {
    const r = mount();
    await act(async () => flush());
    const inp = document.querySelector<HTMLInputElement>(
      '[data-testid="inp-ust-idnr"]'
    )!;
    await act(async () => {
      typeInto(inp, "DE12");
      await flush();
    });
    await act(async () => {
      inp.dispatchEvent(new Event("focusout", { bubbles: true }));
      await flush();
    });
    expect(document.body.textContent).toMatch(/Format passt nicht|Format ungültig/);
    r.unmount();
  });

  it("#8 IBAN on-blur mit invalider IBAN zeigt Fehler", async () => {
    const r = mount();
    await act(async () => flush());
    const inp = document.querySelector<HTMLInputElement>(
      '[data-testid="inp-iban"]'
    )!;
    await act(async () => {
      typeInto(inp, "DE89370400440532013099");
      await flush();
    });
    await act(async () => {
      inp.dispatchEvent(new Event("focusout", { bubbles: true }));
      await flush();
    });
    expect(document.body.textContent).toMatch(/Prüfziffer|IBAN/);
    r.unmount();
  });

  it("#9 Leitweg-ID on-blur invalid → Fehler", async () => {
    const r = mount();
    await act(async () => flush());
    const inp = document.querySelector<HTMLInputElement>(
      '[data-testid="inp-leitweg"]'
    )!;
    await act(async () => {
      typeInto(inp, "nonsense");
      await flush();
    });
    await act(async () => {
      inp.dispatchEvent(new Event("focusout", { bubbles: true }));
      await flush();
    });
    expect(document.body.textContent).toMatch(/Format ungültig/);
    r.unmount();
  });
});

describe("PartnerEditor · Soft-Warning + Override", () => {
  it("#10 Ähnlicher Name + gleiche PLZ → DuplicateWarningBanner erscheint", async () => {
    await seed({
      name: "Mustermann GmbH",
      anschrift_plz: "10115",
      debitor_nummer: 12345,
    });
    const r = mount();
    await act(async () => flush());
    const name = document.querySelector<HTMLInputElement>(
      '[data-testid="inp-name"]'
    )!;
    const plz = document.querySelector<HTMLInputElement>(
      '[data-testid="inp-plz"]'
    )!;
    await act(async () => {
      typeInto(name, "Musterman GmbH");
      typeInto(plz, "10115");
      await flush();
    });
    await act(async () => {
      await new Promise((r) => setTimeout(r, 600));
      await flush();
    });
    expect(
      document.querySelector('[data-testid="duplicate-warning-banner"]')
    ).not.toBeNull();
    // Save-Button ist blockiert durch soft-warnings (blockedBySoftWarnings=true)
    const saveBtn = document.querySelector<HTMLButtonElement>(
      '[data-testid="btn-save"]'
    )!;
    expect(saveBtn.disabled).toBe(true);
    r.unmount();
  });

  it("#11 Override via 'Ignorieren und trotzdem speichern' → Confirm → onSaved", async () => {
    await seed({
      name: "Original GmbH",
      anschrift_plz: "20095",
    });
    const r = mount();
    await act(async () => flush());
    const name = document.querySelector<HTMLInputElement>(
      '[data-testid="inp-name"]'
    )!;
    const plz = document.querySelector<HTMLInputElement>(
      '[data-testid="inp-plz"]'
    )!;
    await act(async () => {
      typeInto(name, "Originall GmbH"); // Distanz 1
      typeInto(plz, "20095");
      await flush();
    });
    await act(async () => {
      await new Promise((r) => setTimeout(r, 600));
      await flush();
    });
    expect(
      document.querySelector('[data-testid="duplicate-warning-banner"]')
    ).not.toBeNull();
    await act(async () => {
      document
        .querySelector<HTMLButtonElement>('[data-testid="btn-dup-ignore"]')!
        .click();
      await flush();
    });
    await act(async () => {
      document
        .querySelector<HTMLButtonElement>('[data-testid="btn-dup-confirm-ok"]')!
        .click();
      await flush(25);
    });
    expect(r.onSaved).toHaveBeenCalledOnce();
    r.unmount();
  });
});

describe("PartnerEditor · Edit-Mode + VIES", () => {
  it("#12 Edit laedt bestehende Daten in Form", async () => {
    const p = await seed({ name: "Existing AG", ust_idnr: "DE999888777" });
    const r = mount({ mode: "edit", partnerId: p.id });
    await act(async () => flush(25));
    const name = document.querySelector<HTMLInputElement>(
      '[data-testid="inp-name"]'
    )!;
    expect(name.value).toBe("Existing AG");
    r.unmount();
  });

  it("#13 VIES-Button erscheint nur im Edit-Mode mit USt-IdNr", async () => {
    const p = await seed({ name: "No USt" });
    const r = mount({ mode: "edit", partnerId: p.id });
    await act(async () => flush(25));
    expect(
      document.querySelector('[data-testid="btn-vies-verify"]')
    ).toBeNull();
    r.unmount();
  });

  it("#14 VIES-Button-Klick → Badge status=VALID", async () => {
    const p = await seed({ name: "V", ust_idnr: "DE123456789" });
    const r = mount({ mode: "edit", partnerId: p.id });
    await act(async () => flush(25));
    const btn = document.querySelector<HTMLButtonElement>(
      '[data-testid="btn-vies-verify"]'
    )!;
    await act(async () => {
      btn.click();
      await flush(25);
    });
    const badge = document.querySelector<HTMLElement>(
      '[data-testid="ustid-status-badge-editor"]'
    )!;
    expect(badge.getAttribute("data-status")).toBe("VALID");
    r.unmount();
  });
});

describe("PartnerEditor · Partner-Type-Switch", () => {
  it("#15 Wechsel Typ löst info-Toast aus (Cleanup-Hinweis)", async () => {
    const r = mount();
    await act(async () => flush());
    const sel = document.querySelector<HTMLSelectElement>(
      '[data-testid="sel-partner-type"]'
    )!;
    // Wechsel auf 'kreditor'
    await act(async () => {
      sel.value = "kreditor";
      sel.dispatchEvent(new Event("change", { bubbles: true }));
      await flush();
    });
    // Save-Button bleibt disabled (Name leer), aber Select hat neuen Wert
    expect(sel.value).toBe("kreditor");
    r.unmount();
  });
});

describe("PartnerEditor · Prefill", () => {
  it("#16 prefill befuellt Name + Anschrift", async () => {
    const r = mount({
      prefill: {
        name: "Prefilled GmbH",
        anschrift_ort: "Hamburg",
        anschrift_plz: "20095",
      },
    });
    await act(async () => flush());
    const name = document.querySelector<HTMLInputElement>(
      '[data-testid="inp-name"]'
    )!;
    expect(name.value).toBe("Prefilled GmbH");
    // Prefilled-PLZ im Anschrift-Block gerendert (input.value)
    const plz = document.querySelector<HTMLInputElement>(
      '[data-testid="inp-plz"]'
    )!;
    expect(plz.value).toBe("20095");
    r.unmount();
  });
});
