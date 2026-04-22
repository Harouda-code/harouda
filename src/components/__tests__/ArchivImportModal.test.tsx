/** @jsxImportSource react */
// Phase 3 / Schritt 10 · ArchivImportModal-Tests.

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ArchivImportModal } from "../ArchivImportModal";
import { store } from "../../api/store";
import * as archivImport from "../../domain/est/archivEstImport";
import type { Employee } from "../../types/db";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

type EmpSeed = Partial<Employee> & { id: string; personalnummer: string; vorname: string; nachname: string };

function seedEmployees(list: EmpSeed[]) {
  store.setEmployees(
    list.map((e) => ({
      id: e.id,
      company_id: "company-demo",
      client_id: "client-kuehn",
      personalnummer: e.personalnummer,
      vorname: e.vorname,
      nachname: e.nachname,
      steuer_id: e.steuer_id ?? null,
      sv_nummer: null,
      steuerklasse: "I",
      kinderfreibetraege: 0,
      konfession: null,
      bundesland: null,
      einstellungsdatum: null,
      austrittsdatum: null,
      beschaeftigungsart: "vollzeit",
      wochenstunden: null,
      bruttogehalt_monat: null,
      stundenlohn: null,
      krankenkasse: null,
      zusatzbeitrag_pct: null,
      privat_versichert: false,
      pv_kinderlos: false,
      pv_kinder_anzahl: 0,
      iban: null,
      bic: null,
      kontoinhaber: null,
      notes: null,
      is_active: true,
      created_at: "2024-01-01T00:00:00Z",
      updated_at: "2024-01-01T00:00:00Z",
    }))
  );
}

type RenderResult = {
  container: HTMLDivElement;
  unmount: () => void;
};

function renderModal(
  props: Parameters<typeof ArchivImportModal>[0]
): RenderResult {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root: Root = createRoot(container);
  const client = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0, staleTime: 0, refetchOnWindowFocus: false },
      mutations: { retry: false },
    },
  });
  act(() => {
    root.render(
      <QueryClientProvider client={client}>
        <ArchivImportModal {...props} />
      </QueryClientProvider>
    );
  });
  return {
    container,
    unmount: () => {
      act(() => root.unmount());
      container.remove();
    },
  };
}

async function flush(times = 6) {
  for (let i = 0; i < times; i++) {
    await Promise.resolve();
  }
  await new Promise((r) => setTimeout(r, 0));
}

const BASE_PROPS = {
  open: true,
  onClose: () => {},
  clientId: "client-kuehn",
  jahr: 2025,
  companyId: "company-demo",
  onImport: () => {},
};

beforeEach(() => {
  localStorage.clear();
});
afterEach(() => {
  vi.restoreAllMocks();
});

describe("ArchivImportModal", () => {
  it("#1 0 Mitarbeiter: Meldung statt Dropdown", async () => {
    store.setEmployees([]);
    const r = renderModal(BASE_PROPS);
    await act(async () => {
      await flush();
    });
    expect(
      document.querySelector('[data-testid="archiv-no-employees"]')
    ).not.toBeNull();
    expect(
      document.querySelector('[data-testid="archiv-employee-select"]')
    ).toBeNull();
    r.unmount();
  });

  it("#2 N Mitarbeiter: Dropdown mit N Einträgen", async () => {
    seedEmployees([
      { id: "e1", personalnummer: "P001", vorname: "Anna", nachname: "Müller" },
      { id: "e2", personalnummer: "P002", vorname: "Bert", nachname: "Schmidt" },
      { id: "e3", personalnummer: "P003", vorname: "Clara", nachname: "Kühn" },
    ]);
    const r = renderModal(BASE_PROPS);
    await act(async () => {
      await flush();
    });
    const select = document.querySelector<HTMLSelectElement>(
      '[data-testid="archiv-employee-select"]'
    );
    expect(select).not.toBeNull();
    // 1 Default-Option (— bitte auswählen —) + 3 MA = 4 Optionen.
    expect(select!.querySelectorAll("option")).toHaveLength(4);
    r.unmount();
  });

  it("#3 Happy-Path: Auswahl + Import → onImport-Callback + Modal-close", async () => {
    seedEmployees([
      { id: "e1", personalnummer: "P001", vorname: "Anna", nachname: "Müller" },
    ]);
    const okVorschlag = {
      bruttoLohn: 60000,
      lohnsteuer: 8000,
      soliZuschlag: 440,
      kirchensteuer: 720,
      sv_an_gesamt: 12000,
      netto: 38840,
      abrechnungen_gefunden: 12,
      jahr: 2025,
      employeeId: "e1",
    };
    const importSpy = vi
      .spyOn(archivImport, "importAnlageNAusArchiv")
      .mockResolvedValue({ kind: "ok", vorschlag: okVorschlag });
    const onImport = vi.fn();
    const onClose = vi.fn();

    const r = renderModal({ ...BASE_PROPS, onImport, onClose });
    await act(async () => {
      await flush();
    });
    // Mitarbeiter wählen
    const select = document.querySelector<HTMLSelectElement>(
      '[data-testid="archiv-employee-select"]'
    )!;
    act(() => {
      const setter = Object.getOwnPropertyDescriptor(
        HTMLSelectElement.prototype,
        "value"
      )?.set;
      setter?.call(select, "e1");
      select.dispatchEvent(new Event("change", { bubbles: true }));
    });
    await act(async () => {
      await flush();
    });
    // Submit
    act(() =>
      document
        .querySelector<HTMLButtonElement>('[data-testid="archiv-import-submit"]')!
        .click()
    );
    await act(async () => {
      await flush(8);
    });
    expect(importSpy).toHaveBeenCalledTimes(1);
    expect(importSpy.mock.calls[0][0]).toEqual({
      employeeId: "e1",
      jahr: 2025,
      clientId: "client-kuehn",
      companyId: "company-demo",
    });
    expect(onImport).toHaveBeenCalledWith(okVorschlag);
    expect(onClose).toHaveBeenCalled();
    r.unmount();
  });

  it("#4 Empty-Archiv: Toast-Error, Modal bleibt offen, onImport NICHT gerufen", async () => {
    seedEmployees([
      { id: "e1", personalnummer: "P001", vorname: "Anna", nachname: "Müller" },
    ]);
    vi.spyOn(archivImport, "importAnlageNAusArchiv").mockResolvedValue({
      kind: "empty",
      reason: "no-archiv-rows",
      jahr: 2025,
    });
    const onImport = vi.fn();
    const onClose = vi.fn();

    const r = renderModal({ ...BASE_PROPS, onImport, onClose });
    await act(async () => {
      await flush();
    });
    const select = document.querySelector<HTMLSelectElement>(
      '[data-testid="archiv-employee-select"]'
    )!;
    act(() => {
      const setter = Object.getOwnPropertyDescriptor(
        HTMLSelectElement.prototype,
        "value"
      )?.set;
      setter?.call(select, "e1");
      select.dispatchEvent(new Event("change", { bubbles: true }));
    });
    await act(async () => {
      await flush();
    });
    act(() =>
      document
        .querySelector<HTMLButtonElement>('[data-testid="archiv-import-submit"]')!
        .click()
    );
    await act(async () => {
      await flush(8);
    });
    expect(onImport).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
    // Modal sollte noch gerendert sein (Dropdown sichtbar).
    expect(
      document.querySelector('[data-testid="archiv-employee-select"]')
    ).not.toBeNull();
    r.unmount();
  });

  it("Warning-Banner ist immer sichtbar", async () => {
    seedEmployees([]);
    const r = renderModal(BASE_PROPS);
    await act(async () => {
      await flush();
    });
    const warn = document.querySelector('[data-testid="archiv-import-warning"]');
    expect(warn).not.toBeNull();
    expect(warn?.textContent).toMatch(/natürlichen Person/);
    expect(warn?.textContent).toMatch(/Gesellschafter-Geschäftsführer/);
    r.unmount();
  });

  // ---------------------------------------------------------------------
  // Nacht-Modus (2026-04-21) · Schritt 2 — Variant "anlage-vorsorge"
  // ---------------------------------------------------------------------

  it("Variant anlage-vorsorge: ruft importAnlageVorsorgeAusArchiv statt AnlageN", async () => {
    seedEmployees([
      { id: "e1", personalnummer: "P001", vorname: "Anna", nachname: "Müller" },
    ]);
    const vorsorgeVorschlag = {
      kv_an_basis: 4920,
      kv_an_zusatz: 510,
      pv_an: 1020,
      rv_an: 5580,
      av_an: 780,
      abrechnungen_gefunden: 12,
      jahr: 2025,
      employeeId: "e1",
    };
    const vorsorgeSpy = vi
      .spyOn(archivImport, "importAnlageVorsorgeAusArchiv")
      .mockResolvedValue({ kind: "ok", vorschlag: vorsorgeVorschlag });
    const anlageNSpy = vi.spyOn(archivImport, "importAnlageNAusArchiv");
    const onImport = vi.fn();

    const r = renderModal({
      ...BASE_PROPS,
      variant: "anlage-vorsorge",
      onImport,
    });
    await act(async () => {
      await flush();
    });
    const select = document.querySelector<HTMLSelectElement>(
      '[data-testid="archiv-employee-select"]'
    )!;
    act(() => {
      const setter = Object.getOwnPropertyDescriptor(
        HTMLSelectElement.prototype,
        "value"
      )?.set;
      setter?.call(select, "e1");
      select.dispatchEvent(new Event("change", { bubbles: true }));
    });
    await act(async () => {
      await flush();
    });
    act(() =>
      document
        .querySelector<HTMLButtonElement>(
          '[data-testid="archiv-import-submit"]'
        )!
        .click()
    );
    await act(async () => {
      await flush(8);
    });
    expect(vorsorgeSpy).toHaveBeenCalledTimes(1);
    expect(anlageNSpy).not.toHaveBeenCalled();
    expect(onImport).toHaveBeenCalledWith(vorsorgeVorschlag);
    r.unmount();
  });

  it("Variant-Titel: 'SV-Beiträge' statt 'Lohndaten'", async () => {
    seedEmployees([]);
    const r = renderModal({
      ...BASE_PROPS,
      variant: "anlage-vorsorge",
      onImport: () => {},
    });
    await act(async () => {
      await flush();
    });
    // Modal-Title steht im Modal-Header (h2 oder entsprechend).
    const header = Array.from(document.querySelectorAll("h2, h3")).find((el) =>
      el.textContent?.includes("SV-Beiträge")
    );
    expect(header).toBeDefined();
    // Und der alte Anlage-N-Titel ist NICHT sichtbar.
    const headers = document.querySelectorAll("h2, h3");
    const hasAnlageNTitle = Array.from(headers).some((h) =>
      h.textContent?.includes("Lohndaten aus Gehaltsabrechnung")
    );
    expect(hasAnlageNTitle).toBe(false);
    r.unmount();
  });
});

