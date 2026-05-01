/** @jsxImportSource react */
// SteuernShell-Smoke-Tests.
//
// Pruefen das Sidebar-Skelett: vier Gruppen-Ueberschriften, der
// erste NavLink fuer UStVA in Voranmeldungen und die Haupt-Content-
// Sektion mit Outlet-Aufnahmebereich.

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import SteuernShell from "./SteuernShell";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

function mount(entry: string = "/steuer") {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root: Root = createRoot(container);
  act(() => {
    root.render(
      <MemoryRouter initialEntries={[entry]}>
        <Routes>
          <Route path="/*" element={<SteuernShell />} />
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

describe("SteuernShell", () => {
  it("#1 zeigt die eine Gruppen-Ueberschrift", () => {
    const r = mount();
    const titles = Array.from(
      document.querySelectorAll(".steuern-shell__group-head")
    ).map((el) => el.textContent?.trim());
    expect(titles).toEqual([
      "Hauptformulare",
    ]);
    r.unmount();
  });

  it("#2 Hauptformulare hat 5 <li>", () => {
    const r = mount();
    // Gruppe ist initial gefaltet — Items werden erst nach Expand
    // gerendert. Also den Header per Klick oeffnen.
    const head = document.querySelector<HTMLButtonElement>(
      ".steuern-shell__group-head"
    )!;
    act(() => head.click());
    const groups = document.querySelectorAll(".steuern-shell__sidebar .steuern-shell__group");
    expect(groups.length).toBe(1);
    const hauptformulareLis = groups[0].querySelectorAll("ul > li");
    expect(hauptformulareLis.length).toBe(5);
    const labels = Array.from(hauptformulareLis).map((li) => li.textContent?.trim());
    expect(labels).toEqual([
      expect.stringContaining("\u00dcbersicht"),
      expect.stringContaining("Gewerbesteuer"),
      expect.stringContaining("K\u00f6rperschaftsteuer"),
      expect.stringContaining("ESt 1A"),
      expect.stringContaining("ESt 1C"),
    ]);
    r.unmount();
  });

  it("#3 hat die Haupt-Content-Sektion mit Klasse steuern-shell__main", () => {
    const r = mount();
    const main = document.querySelector(".steuern-shell__main");
    expect(main).not.toBeNull();
    r.unmount();
  });
});
