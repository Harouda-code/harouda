/** @jsxImportSource react */
// Phase 3 / Schritt 8 · DrillDownModal-Tests.
//
// DEMO-basiert. Seeded store.getEntries(), rendert das Modal im
// QueryClient-Kontext und verifiziert Tabelle, leere-Zustand, Filter-
// Isolation und Korrekturbuchung-Flow (inkl. Validierung).

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { DrillDownModal } from "../DrillDownModal";
import { store } from "../../api/store";
import * as journalApi from "../../api/journal";
import type { JournalEntry } from "../../types/db";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

function makeEntry(
  id: string,
  datum: string,
  soll: string,
  haben: string,
  betrag: number,
  clientId: string | null = "client-A",
  beleg = `B-${id}`
): JournalEntry {
  return {
    id,
    datum,
    beleg_nr: beleg,
    beschreibung: `Buchung ${id}`,
    soll_konto: soll,
    haben_konto: haben,
    betrag,
    ust_satz: null,
    status: "gebucht",
    client_id: clientId,
    skonto_pct: null,
    skonto_tage: null,
    gegenseite: null,
    faelligkeit: null,
    version: 1,
  };
}

type RenderResult = {
  container: HTMLDivElement;
  unmount: () => void;
  client: QueryClient;
};

function renderModal(
  props: Parameters<typeof DrillDownModal>[0]
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
        <DrillDownModal {...props} />
      </QueryClientProvider>
    );
  });
  return {
    container,
    client,
    unmount: () => {
      act(() => root.unmount());
      container.remove();
    },
  };
}

async function flush(times = 4) {
  for (let i = 0; i < times; i++) {
    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    await Promise.resolve();
  }
  await new Promise((r) => setTimeout(r, 0));
}

beforeEach(() => {
  localStorage.clear();
});
afterEach(() => {
  vi.restoreAllMocks();
});

const BASE_PROPS = {
  open: true,
  onClose: () => {},
  fieldLabel: "Umsätze (Anlage G)",
  kontoNummern: ["8400"],
  zeitraumVon: "2025-01-01",
  zeitraumBis: "2025-12-31",
  clientId: "client-A",
};

describe("DrillDownModal", () => {
  it("#1 open=false: rendert nichts im Body", () => {
    const r = renderModal({ ...BASE_PROPS, open: false });
    expect(r.container.querySelector('[data-testid="drill-empty"]')).toBeNull();
    expect(r.container.querySelector('[data-testid="drill-table"]')).toBeNull();
    r.unmount();
  });

  it("#2 open=true, 0 Entries: zeigt 'Keine Buchungen gefunden.'", async () => {
    store.setEntries([]);
    const r = renderModal(BASE_PROPS);
    await act(async () => {
      await flush();
    });
    expect(
      document.querySelector('[data-testid="drill-empty"]')?.textContent
    ).toContain("Keine Buchungen gefunden");
    r.unmount();
  });

  it("#3 3 Entries: Tabelle + Summen-Zeile", async () => {
    store.setEntries([
      makeEntry("e1", "2025-02-15", "1200", "8400", 1000),
      makeEntry("e2", "2025-05-20", "1200", "8400", 2500),
      makeEntry("e3", "2025-10-01", "1200", "8400", 500),
    ]);
    const r = renderModal(BASE_PROPS);
    await act(async () => {
      await flush();
    });
    expect(document.querySelector('[data-testid="drill-table"]')).not.toBeNull();
    expect(document.querySelectorAll('[data-testid^="drill-row-"]')).toHaveLength(3);
    const sum = document.querySelector('[data-testid="drill-sum-value"]');
    expect(sum?.textContent).toMatch(/4\.000,00/);
    r.unmount();
  });

  it("#4 Filter: falsche client_id oder falsches Datum filtern raus", async () => {
    store.setEntries([
      makeEntry("good", "2025-03-01", "1200", "8400", 500, "client-A"),
      makeEntry("wrong-client", "2025-03-01", "1200", "8400", 9999, "client-B"),
      makeEntry("old", "2024-12-31", "1200", "8400", 100, "client-A"),
      makeEntry("future", "2026-01-01", "1200", "8400", 200, "client-A"),
    ]);
    const r = renderModal(BASE_PROPS);
    await act(async () => {
      await flush();
    });
    const rows = document.querySelectorAll('[data-testid^="drill-row-"]');
    expect(rows).toHaveLength(1);
    expect(rows[0].getAttribute("data-testid")).toBe("drill-row-good");
    r.unmount();
  });

  it("#5 Klick auf 'Korrigieren': Formular mit Pre-filled-Values erscheint", async () => {
    store.setEntries([makeEntry("e1", "2025-03-15", "1200", "8400", 1234)]);
    const r = renderModal(BASE_PROPS);
    await act(async () => {
      await flush();
    });
    const btn = document.querySelector<HTMLButtonElement>(
      '[data-testid="drill-correct-btn-e1"]'
    );
    expect(btn).not.toBeNull();
    act(() => btn!.click());
    // Form expandiert.
    const form = document.querySelector('[data-testid="drill-form-e1"]');
    expect(form).not.toBeNull();
    // Pre-filled: Datum, Beleg, Soll/Haben.
    const inputs = form!.querySelectorAll<HTMLInputElement>("input");
    const datumInput = Array.from(inputs).find((i) => i.type === "date");
    expect(datumInput?.value).toBe("2025-03-15");
    const textInputs = Array.from(inputs).filter((i) => i.type !== "date");
    const values = textInputs.map((i) => i.value);
    expect(values).toEqual(expect.arrayContaining(["B-e1", "1200", "8400", "1234"]));
    r.unmount();
  });

  it("#6 Submit mit leerer reason: correctEntry wird NICHT aufgerufen, Fehler im Form", async () => {
    store.setEntries([makeEntry("e1", "2025-03-15", "1200", "8400", 1000)]);
    const correctSpy = vi.spyOn(journalApi, "correctEntry");
    const r = renderModal(BASE_PROPS);
    await act(async () => {
      await flush();
    });
    act(() =>
      document.querySelector<HTMLButtonElement>(
        '[data-testid="drill-correct-btn-e1"]'
      )!.click()
    );
    // Grund leer lassen, direkt submit.
    act(() =>
      document.querySelector<HTMLButtonElement>(
        '[data-testid="drill-submit-btn-e1"]'
      )!.click()
    );
    await act(async () => {
      await flush();
    });
    expect(correctSpy).not.toHaveBeenCalled();
    const err = document.querySelector('[data-testid="drill-form-error-e1"]');
    expect(err?.textContent).toMatch(/Grund/);
    r.unmount();
  });

  it("#7 Happy-Path Submit: correctEntry aufgerufen, Callback feuert", async () => {
    store.setEntries([makeEntry("e1", "2025-03-15", "1200", "8400", 1000)]);
    const correctSpy = vi
      .spyOn(journalApi, "correctEntry")
      .mockResolvedValue({
        reversal: {
          ...makeEntry("rev-1", "2025-03-15", "8400", "1200", 1000),
          storno_status: "reversal",
        },
        correction: {
          ...makeEntry("cor-1", "2025-03-15", "1200", "8400", 1500),
          storno_status: "correction",
        },
      });
    const callback = vi.fn();
    const r = renderModal({
      ...BASE_PROPS,
      onCorrectionCreated: callback,
    });
    await act(async () => {
      await flush();
    });
    act(() =>
      document.querySelector<HTMLButtonElement>(
        '[data-testid="drill-correct-btn-e1"]'
      )!.click()
    );
    // Reason eingeben.
    const reasonArea = document.querySelector<HTMLTextAreaElement>(
      '[data-testid="drill-reason-e1"]'
    );
    expect(reasonArea).not.toBeNull();
    act(() => {
      const desc = Object.getOwnPropertyDescriptor(
        HTMLTextAreaElement.prototype,
        "value"
      );
      desc?.set?.call(reasonArea!, "Betrag war falsch");
      reasonArea!.dispatchEvent(new Event("input", { bubbles: true }));
    });
    await act(async () => {
      await flush();
    });
    act(() =>
      document.querySelector<HTMLButtonElement>(
        '[data-testid="drill-submit-btn-e1"]'
      )!.click()
    );
    await act(async () => {
      await flush(6);
    });
    expect(correctSpy).toHaveBeenCalledTimes(1);
    expect(correctSpy.mock.calls[0][0]).toBe("e1");
    expect(correctSpy.mock.calls[0][2]).toBe("Betrag war falsch");
    expect(callback).toHaveBeenCalledWith({
      reversalId: "rev-1",
      correctionId: "cor-1",
    });
    r.unmount();
  });
});
