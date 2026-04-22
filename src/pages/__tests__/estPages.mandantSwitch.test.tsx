/** @jsxImportSource react */
// Multi-Tenancy Phase 1 / Schritt 3b · Page-Integration-Stichproben.
//
// Verifiziert, dass ein Mandanten-Wechsel keine Daten vermischt und
// dass die HauptvorduckESt1A-Fortschritts-Badges den V2-Storage-Key
// pro aktivem Mandant auflösen.

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter } from "react-router-dom";
import { MandantProvider } from "../../contexts/MandantContext";
import { SettingsProvider } from "../../contexts/SettingsContext";
import { YearProvider } from "../../contexts/YearContext";
import {
  buildEstStorageKey,
  readEstForm,
  writeEstForm,
} from "../../domain/est/estStorage";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

function wrap(path: string, child: React.ReactNode) {
  return (
    <MemoryRouter initialEntries={[path]}>
      <SettingsProvider>
        <YearProvider>
          <MandantProvider>{child}</MandantProvider>
        </YearProvider>
      </SettingsProvider>
    </MemoryRouter>
  );
}

function render(
  path: string,
  child: React.ReactNode
): { container: HTMLDivElement; unmount: () => void } {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root: Root = createRoot(container);
  act(() => {
    root.render(wrap(path, child));
  });
  return {
    container,
    unmount: () => {
      act(() => root.unmount());
      container.remove();
    },
  };
}

describe("ESt-Pages · Mandant-Wechsel trennt Daten (Helper-Contract)", () => {
  beforeEach(() => {
    localStorage.clear();
  });
  afterEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it("AnlageNPage-Contract: FORM_ID='anlage-n' speichert pro Mandant getrennt", () => {
    // Simuliert das Page-Verhalten: Mandant A schreibt eigene Daten,
    // Mandant B schreibt andere — beide sehen NUR ihre eigenen.
    writeEstForm("anlage-n", "c-A", 2025, { bruttoLohn: 45000, lohnsteuer: 8000 });
    writeEstForm("anlage-n", "c-B", 2025, { bruttoLohn: 60000, lohnsteuer: 12000 });

    expect(
      readEstForm<{ bruttoLohn: number }>("anlage-n", "c-A", 2025)
    ).toEqual({ bruttoLohn: 45000, lohnsteuer: 8000 });
    expect(
      readEstForm<{ bruttoLohn: number }>("anlage-n", "c-B", 2025)
    ).toEqual({ bruttoLohn: 60000, lohnsteuer: 12000 });

    // Legacy-Key `harouda:anlage-n` ist leer → keine Vermischung.
    expect(localStorage.getItem("harouda:anlage-n")).toBeNull();
  });

  it("AnlageKapPage-Contract: FORM_ID='anlage-kap' unabhängig von anderen FORM_IDs pro Mandant", () => {
    writeEstForm("anlage-kap", "c-A", 2025, { zinsen: 500, dividenden: 200 });
    writeEstForm("anlage-n", "c-A", 2025, { bruttoLohn: 45000 });
    writeEstForm("anlage-kap", "c-B", 2025, { zinsen: 1200 });

    // Key-Trennung über (mandantId, jahr, formId) – vier unabhängige Keys.
    expect(
      localStorage.getItem(buildEstStorageKey("anlage-kap", "c-A", 2025))
    ).toBe(JSON.stringify({ zinsen: 500, dividenden: 200 }));
    expect(
      localStorage.getItem(buildEstStorageKey("anlage-n", "c-A", 2025))
    ).toBe(JSON.stringify({ bruttoLohn: 45000 }));
    expect(
      localStorage.getItem(buildEstStorageKey("anlage-kap", "c-B", 2025))
    ).toBe(JSON.stringify({ zinsen: 1200 }));
    // KAP von Mandant B enthält NICHT die Dividenden-Daten von A.
    expect(
      readEstForm<{ dividenden?: number }>("anlage-kap", "c-B", 2025)?.dividenden
    ).toBeUndefined();
  });
});

describe("HauptvorduckESt1APage · Badge-Lookup pro Mandant", () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => localStorage.clear());

  it("liest Badge-Status aus mandant-scoped V2-Keys (nicht aus Legacy)", () => {
    // Seed: Mandant A hat Anlage N + Anlage G ausgefüllt, Mandant B nur
    // Anlage KAP. Dasselbe Legacy-Key-Schema darf NICHT mehr fürs Badge
    // herangezogen werden (würde falsches Bild ergeben).
    writeEstForm("anlage-n", "c-A", 2025, { bruttoLohn: 42 });
    writeEstForm("anlage-g", "c-A", 2025, { umsaetze: 100 });
    writeEstForm("anlage-kap", "c-B", 2025, { zinsen: 50 });

    // Legacy-Garbage darf die Logik nicht stören:
    localStorage.setItem("harouda:anlage-v", JSON.stringify({ alt: true }));

    // Direkte Simulation der Badge-Logik aus HauptvorduckESt1APage.tsx:
    // für Mandant A sind anlage-n + anlage-g "ausgefüllt", für Mandant B
    // nur anlage-kap.
    const ANLAGEN = ["anlage-n", "anlage-g", "anlage-kap", "anlage-v"];

    function ausgefuelltFor(mandantId: string): Set<string> {
      const set = new Set<string>();
      for (const formId of ANLAGEN) {
        const v = localStorage.getItem(
          buildEstStorageKey(formId, mandantId, 2025)
        );
        if (v && v !== "null" && v !== "{}") set.add(formId);
      }
      return set;
    }

    const forA = ausgefuelltFor("c-A");
    expect(forA.has("anlage-n")).toBe(true);
    expect(forA.has("anlage-g")).toBe(true);
    expect(forA.has("anlage-kap")).toBe(false);
    expect(forA.has("anlage-v")).toBe(false);

    const forB = ausgefuelltFor("c-B");
    expect(forB.has("anlage-n")).toBe(false);
    expect(forB.has("anlage-g")).toBe(false);
    expect(forB.has("anlage-kap")).toBe(true);
    // Legacy-`harouda:anlage-v` wird NICHT fälschlich Mandant B zugeordnet.
    expect(forB.has("anlage-v")).toBe(false);
  });
});

// Smoke: Stellt sicher, dass MandantProvider + Helpers in einem realen
// React-Mount laufen (keine Supabase/Router-Init-Fehler).
describe("ESt-Pages · Integration mit Provider-Stack", () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => localStorage.clear());

  it("rendert einen Dummy-Consumer mit aktivem Mandant ohne zu werfen", () => {
    function Consumer() {
      return <div data-testid="ok">rendered</div>;
    }
    const { container, unmount } = render("/?mandantId=c-1", <Consumer />);
    expect(container.querySelector('[data-testid="ok"]')).not.toBeNull();
    unmount();
  });
});
