/** @jsxImportSource react */
// Sprint 19.C · DuplicateWarningBanner-Tests (Reminder B).

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { DuplicateWarningBanner } from "../DuplicateWarningBanner";
import type { BusinessPartner } from "../../../types/db";
import type {
  DuplicateCheckResult,
  DuplicateSoftWarning,
} from "../../../domain/partners/duplicateCheck";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

function partner(
  over: Partial<BusinessPartner> & { id: string; name: string }
): BusinessPartner {
  const defaults: BusinessPartner = {
    id: over.id,
    company_id: "c",
    client_id: "cl",
    partner_type: "debitor",
    debitor_nummer: 10000,
    kreditor_nummer: null,
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
    anschrift_land_iso: null,
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
    created_at: "2026-01-01T00:00:00Z",
    created_by: null,
    updated_at: "2026-01-01T00:00:00Z",
    updated_by: null,
  };
  return { ...defaults, ...over };
}

function warn(
  similarPartnerId: string,
  distance: number
): DuplicateSoftWarning {
  return {
    field: "name_plz",
    similarPartnerId,
    distance,
    message: `Name ähnelt (Distanz ${distance})`,
  };
}

type Hooks = {
  onOpenPartner: ReturnType<typeof vi.fn<(id: string) => void>>;
  onAbort: ReturnType<typeof vi.fn<() => void>>;
  onIgnoreAndSave: ReturnType<typeof vi.fn<() => void>>;
};

function mount(
  result: DuplicateCheckResult | null,
  partners: BusinessPartner[]
): Hooks & {
  container: HTMLElement;
  unmount: () => void;
} {
  const hooks: Hooks = {
    onOpenPartner: vi.fn<(id: string) => void>(),
    onAbort: vi.fn<() => void>(),
    onIgnoreAndSave: vi.fn<() => void>(),
  };
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root: Root = createRoot(container);
  act(() => {
    root.render(
      <DuplicateWarningBanner
        result={result}
        partners={partners}
        onOpenPartner={hooks.onOpenPartner}
        onAbort={hooks.onAbort}
        onIgnoreAndSave={hooks.onIgnoreAndSave}
      />
    );
  });
  return {
    ...hooks,
    container,
    unmount: () => {
      act(() => root.unmount());
      container.remove();
    },
  };
}

beforeEach(() => {
  document.body.innerHTML = "";
});
afterEach(() => {
  vi.restoreAllMocks();
  document.body.innerHTML = "";
});

describe("DuplicateWarningBanner", () => {
  it("#1 Null-Result: nichts gerendert", () => {
    const r = mount(null, []);
    expect(
      document.querySelector('[data-testid="duplicate-warning-banner"]')
    ).toBeNull();
    r.unmount();
  });

  it("#2 Leere softWarnings: nichts gerendert", () => {
    const r = mount({ hardBlocks: [], softWarnings: [] }, []);
    expect(
      document.querySelector('[data-testid="duplicate-warning-banner"]')
    ).toBeNull();
    r.unmount();
  });

  it("#3 Ein soft-Warning: Name + Distanz + Nummer + 'Datensatz öffnen'-Button", () => {
    const ex = partner({
      id: "A",
      name: "Mustermann GmbH",
      debitor_nummer: 12345,
      anschrift_plz: "10115",
    });
    const r = mount(
      { hardBlocks: [], softWarnings: [warn("A", 2)] },
      [ex]
    );
    const banner = document.querySelector(
      '[data-testid="duplicate-warning-banner"]'
    )!;
    expect(banner.textContent).toMatch(/Mustermann GmbH/);
    expect(banner.textContent).toMatch(/D 12345/);
    expect(banner.textContent).toMatch(/Distanz 2/);
    expect(banner.textContent).toMatch(/10115/);
    expect(
      banner.querySelector('[data-testid="btn-open-similar-A"]')
    ).not.toBeNull();
    r.unmount();
  });

  it("#4 Drei soft-Warnings: drei Listeneintraege", () => {
    const ps = [
      partner({ id: "A", name: "A GmbH", anschrift_plz: "10115" }),
      partner({ id: "B", name: "B GmbH", anschrift_plz: "10115" }),
      partner({ id: "C", name: "C GmbH", anschrift_plz: "10115" }),
    ];
    const r = mount(
      {
        hardBlocks: [],
        softWarnings: [warn("A", 1), warn("B", 2), warn("C", 3)],
      },
      ps
    );
    const items = document.querySelectorAll(
      '[data-testid^="duplicate-warning-item-"]'
    );
    expect(items.length).toBe(3);
    r.unmount();
  });

  it("#5 onOpenPartner wird mit der richtigen ID gerufen", () => {
    const ex = partner({ id: "X42", name: "X GmbH", anschrift_plz: "10115" });
    const r = mount(
      { hardBlocks: [], softWarnings: [warn("X42", 1)] },
      [ex]
    );
    const btn = document.querySelector<HTMLButtonElement>(
      '[data-testid="btn-open-similar-X42"]'
    )!;
    act(() => {
      btn.click();
    });
    expect(r.onOpenPartner).toHaveBeenCalledWith("X42");
    r.unmount();
  });

  it("#6 'Abbrechen und prüfen' loest onAbort aus", () => {
    const ex = partner({ id: "A", name: "A", anschrift_plz: "10115" });
    const r = mount(
      { hardBlocks: [], softWarnings: [warn("A", 1)] },
      [ex]
    );
    const btn = document.querySelector<HTMLButtonElement>(
      '[data-testid="btn-dup-abort"]'
    )!;
    act(() => {
      btn.click();
    });
    expect(r.onAbort).toHaveBeenCalledOnce();
    r.unmount();
  });

  it("#7 'Ignorieren und trotzdem speichern' öffnet Confirm-Dialog, Ja-Klick triggert onIgnoreAndSave", () => {
    const ex = partner({ id: "A", name: "A", anschrift_plz: "10115" });
    const r = mount(
      { hardBlocks: [], softWarnings: [warn("A", 1)] },
      [ex]
    );
    // Vorher: kein Dialog
    expect(
      document.querySelector('[data-testid="dup-confirm-dialog"]')
    ).toBeNull();
    const ignoreBtn = document.querySelector<HTMLButtonElement>(
      '[data-testid="btn-dup-ignore"]'
    )!;
    act(() => {
      ignoreBtn.click();
    });
    expect(
      document.querySelector('[data-testid="dup-confirm-dialog"]')
    ).not.toBeNull();
    // Noch nicht ausgeloest
    expect(r.onIgnoreAndSave).not.toHaveBeenCalled();
    const okBtn = document.querySelector<HTMLButtonElement>(
      '[data-testid="btn-dup-confirm-ok"]'
    )!;
    act(() => {
      okBtn.click();
    });
    expect(r.onIgnoreAndSave).toHaveBeenCalledOnce();
    // Dialog wird geschlossen
    expect(
      document.querySelector('[data-testid="dup-confirm-dialog"]')
    ).toBeNull();
    r.unmount();
  });

  it("#8 Confirm-Dialog-Cancel schließt ohne onIgnoreAndSave", () => {
    const ex = partner({ id: "A", name: "A", anschrift_plz: "10115" });
    const r = mount(
      { hardBlocks: [], softWarnings: [warn("A", 1)] },
      [ex]
    );
    act(() => {
      document
        .querySelector<HTMLButtonElement>('[data-testid="btn-dup-ignore"]')!
        .click();
    });
    act(() => {
      document
        .querySelector<HTMLButtonElement>(
          '[data-testid="btn-dup-confirm-cancel"]'
        )!
        .click();
    });
    expect(r.onIgnoreAndSave).not.toHaveBeenCalled();
    expect(
      document.querySelector('[data-testid="dup-confirm-dialog"]')
    ).toBeNull();
    r.unmount();
  });
});
