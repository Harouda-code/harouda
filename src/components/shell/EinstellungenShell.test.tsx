/** @jsxImportSource react */
// EinstellungenShell-Smoke-Tests.
//
// Pruefen das Sidebar-Skelett: eine Gruppen-Ueberschrift mit 10 items
// und die Haupt-Content-Sektion mit Outlet-Aufnahmebereich.

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import EinstellungenShell from "./EinstellungenShell";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

function mount(entry: string = "/einstellungen") {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root: Root = createRoot(container);
  act(() => {
    root.render(
      <MemoryRouter initialEntries={[entry]}>
        <Routes>
          <Route path="/*" element={<EinstellungenShell />} />
        </Routes>
      </MemoryRouter>
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

beforeEach(() => {
  document.body.innerHTML = "";
});
afterEach(() => {
  document.body.innerHTML = "";
});

describe("EinstellungenShell", () => {
  it("#1 zeigt die eine Gruppen-Ueberschrift", () => {
    const r = mount();
    const titles = Array.from(
      document.querySelectorAll(".einstellungen-shell__group-head")
    ).map((el) => el.textContent?.trim());
    expect(titles).toEqual([
      "Einstellungen",
    ]);
    r.unmount();
  });

  it("#2 Einstellungen hat 10 <li>", () => {
    const r = mount();
    const groups = document.querySelectorAll(
      ".einstellungen-shell__sidebar .einstellungen-shell__group"
    );
    expect(groups.length).toBe(1);
    const lis = groups[0].querySelectorAll("ul > li");
    expect(lis.length).toBe(10);
    const labels = Array.from(lis).map((li) => li.textContent?.trim());
    expect(labels).toEqual([
      expect.stringContaining("Firma & Datenhaltung"),
      expect.stringContaining("Kostenstellen"),
      expect.stringContaining("Kostenträger"),
      expect.stringContaining("Benutzer & Rollen"),
      expect.stringContaining("Verfahrensdokumentation"),
      expect.stringContaining("System-Status"),
      expect.stringContaining("System-Log"),
      expect.stringContaining("Audit-Log"),
      expect.stringContaining("Fristenkalender"),
      expect.stringContaining("Aufbewahrungsfristen"),
    ]);
    r.unmount();
  });

  it("#3 hat die Haupt-Content-Sektion mit Klasse einstellungen-shell__main", () => {
    const r = mount();
    const main = document.querySelector(".einstellungen-shell__main");
    expect(main).not.toBeNull();
    r.unmount();
  });
});
