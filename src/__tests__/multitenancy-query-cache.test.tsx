/** @jsxImportSource react */
//
// Multi-Tenancy Phase 1 / Schritt 4 · Query-Cache-Regression.
//
// Prüft die F42-kritische Invariante: Beim Mandant-Wechsel zeigen
// Mandant-spezifische Queries die Daten des NEUEN Mandanten, nicht
// die stale-gecachten Daten des Vor-Mandanten. Test exerziert das
// Cache-Verhalten direkt (statt eine ganze Page zu mounten) und bleibt
// dadurch robust gegen Page-Refactors.

import { describe, it, expect, beforeEach, vi } from "vitest";
import { act, useEffect, useState } from "react";
import { createRoot, type Root } from "react-dom/client";
import {
  QueryClient,
  QueryClientProvider,
  useQuery,
} from "@tanstack/react-query";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

function makeQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
        staleTime: 0,
        refetchOnWindowFocus: false,
      },
    },
  });
}

async function waitForCount(
  container: HTMLElement,
  testId: string,
  expected: string
): Promise<void> {
  await vi.waitFor(
    () => {
      const el = container.querySelector(`[data-testid="${testId}"]`);
      if (!el || el.getAttribute("data-count") !== expected) {
        throw new Error(
          `waiting for ${testId} data-count=${expected}, got ${el?.getAttribute(
            "data-count"
          )}`
        );
      }
    },
    { timeout: 2000, interval: 15 }
  );
}

describe("Multi-Tenancy · Query-Cache beim Mandant-Switch (F42-Regression)", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("Mandant-Switch löst neue Query aus — keine Cache-Vermischung", async () => {
    // Stub-Daten pro Mandant.
    const ROWS: Record<string, string[]> = {
      "c-A": ["Journal A1", "Journal A2", "Journal A3"],
      "c-B": ["Journal B1"],
    };
    const calls: string[] = [];

    type Row = { id: string; label: string; client_id: string };
    async function fetchFor(clientId: string | null): Promise<Row[]> {
      calls.push(`fetch:${clientId ?? "null"}`);
      if (!clientId) return [];
      return ROWS[clientId].map((label, i) => ({
        id: `${clientId}-${i}`,
        label,
        client_id: clientId,
      }));
    }

    function Probe({ clientId }: { clientId: string }) {
      // Simuliert das Pattern aus allen fixedten Pages aus Schritt 4:
      //   queryKey: ["journal_entries", "all", selectedMandantId]
      const q = useQuery({
        queryKey: ["journal_entries", "all", clientId],
        queryFn: () => fetchFor(clientId),
      });
      return (
        <div data-testid="rows" data-count={q.data?.length ?? 0}>
          {(q.data ?? []).map((r) => (
            <span key={r.id} data-testid={`row-${r.id}`}>
              {r.label}
            </span>
          ))}
        </div>
      );
    }

    function App() {
      const [mandantId, setMandantId] = useState("c-A");
      useEffect(() => {
        // Expose für Test-Trigger.
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (globalThis as any).__switchTo = setMandantId;
      }, []);
      return <Probe clientId={mandantId} />;
    }

    const qc = makeQueryClient();
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root: Root = createRoot(container);

    act(() => {
      root.render(
        <QueryClientProvider client={qc}>
          <App />
        </QueryClientProvider>
      );
    });
    await waitForCount(container, "rows", "3");

    // Nach Mount: 3 Zeilen für Mandant A.
    expect(container.querySelector('[data-testid="row-c-A-0"]')).not.toBeNull();
    expect(container.querySelector('[data-testid="row-c-B-0"]')).toBeNull();
    expect(calls).toEqual(["fetch:c-A"]);

    // Mandant-Switch: A → B.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    act(() => (globalThis as any).__switchTo("c-B"));
    await waitForCount(container, "rows", "1");

    // Jetzt sollte B's Daten zu sehen sein — und ein frischer fetch
    // für B ist erfolgt, weil der Cache-Key (mit clientId) neu ist.
    expect(container.querySelector('[data-testid="row-c-B-0"]')).not.toBeNull();
    // Keine A-Zeilen mehr sichtbar.
    expect(container.querySelector('[data-testid="row-c-A-0"]')).toBeNull();
    expect(container.querySelector('[data-testid="row-c-A-1"]')).toBeNull();
    expect(container.querySelector('[data-testid="row-c-A-2"]')).toBeNull();

    // fetchFor wurde zweimal aufgerufen: einmal pro Mandant.
    expect(calls).toEqual(["fetch:c-A", "fetch:c-B"]);

    // Zurück zu A: der Cache-Key für A existiert bereits → ggf. stale-
    // refetch. Test toleriert beides: wichtig ist, dass A's Daten
    // zurückkehren, nicht mit B verschmiert.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    act(() => (globalThis as any).__switchTo("c-A"));
    await waitForCount(container, "rows", "3");

    expect(container.querySelector('[data-testid="row-c-A-2"]')).not.toBeNull();
    expect(container.querySelector('[data-testid="row-c-B-0"]')).toBeNull();

    act(() => root.unmount());
    container.remove();
  });

  it("null-Suffix (Kanzlei-weit) ist eine eigene Cache-Entry — kein Leak in mandant-spezifische Keys", async () => {
    // Szenario: UniversalSearchModal holt mit clientId=null, JournalPage
    // mit clientId="c-1". Die zwei Queries müssen verschiedene Cache-
    // Entries haben.
    const calls: string[] = [];
    async function fetchFor(clientId: string | null): Promise<string[]> {
      calls.push(`fetch:${clientId ?? "null"}`);
      if (clientId === null) return ["kanzlei-A-1", "kanzlei-A-2", "kanzlei-B-1"];
      if (clientId === "c-1") return ["mandant-1-A", "mandant-1-B"];
      return [];
    }

    function Probe({ id }: { id: string; clientId: string | null }) {
       
      const q = useQuery({
        queryKey: ["journal_entries", "all", null],
        queryFn: () => fetchFor(null),
      });
      return (
        <div data-testid={id} data-count={q.data?.length ?? 0}>
          {(q.data ?? []).join(",")}
        </div>
      );
    }

    function Probe2() {
      const q = useQuery({
        queryKey: ["journal_entries", "all", "c-1"],
        queryFn: () => fetchFor("c-1"),
      });
      return (
        <div data-testid="mandant-query" data-count={q.data?.length ?? 0}>
          {(q.data ?? []).join(",")}
        </div>
      );
    }

    const qc = makeQueryClient();
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root: Root = createRoot(container);
    act(() => {
      root.render(
        <QueryClientProvider client={qc}>
          <Probe id="kanzlei-query" clientId={null} />
          <Probe2 />
        </QueryClientProvider>
      );
    });
    await waitForCount(container, "kanzlei-query", "3");
    await waitForCount(container, "mandant-query", "2");

    // Beide Queries wurden unabhängig voneinander gefeuert.
    expect(calls.sort()).toEqual(["fetch:c-1", "fetch:null"]);

    const kanzlei = container.querySelector('[data-testid="kanzlei-query"]');
    const mandant = container.querySelector('[data-testid="mandant-query"]');
    expect(kanzlei?.getAttribute("data-count")).toBe("3");
    expect(mandant?.getAttribute("data-count")).toBe("2");

    act(() => root.unmount());
    container.remove();
  });
});
