/** @jsxImportSource react */
// LohnShell-Smoke-Tests.
//
// Pruefen das Sidebar-Skelett: eine Gruppen-Ueberschrift mit 3 items
// und die Haupt-Content-Sektion mit Outlet-Aufnahmebereich.

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import LohnShell from "./LohnShell";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

function mount(entry: string = "/lohn") {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root: Root = createRoot(container);
  act(() => {
    root.render(
      <MemoryRouter initialEntries={[entry]}>
        <Routes>
          <Route path="/*" element={<LohnShell />} />
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

describe("LohnShell", () => {
  it("#1 zeigt die eine Gruppen-Ueberschrift", () => {
    const r = mount();
    const titles = Array.from(
      document.querySelectorAll(".lohn-shell__group-head")
    ).map((el) => el.textContent?.trim());
    expect(titles).toEqual([
      "Lohn & Gehalt",
    ]);
    r.unmount();
  });

  it("#2 Lohn & Gehalt hat 3 <li>", () => {
    const r = mount();
    const groups = document.querySelectorAll(
      ".lohn-shell__sidebar .lohn-shell__group"
    );
    expect(groups.length).toBe(1);
    const lis = groups[0].querySelectorAll("ul > li");
    expect(lis.length).toBe(3);
    const labels = Array.from(lis).map((li) => li.textContent?.trim());
    expect(labels).toEqual([
      expect.stringContaining("Kalkulator"),
      expect.stringContaining("Lohnsteuer-Anmeldung"),
      expect.stringContaining("Abrechnungs-Archiv"),
    ]);
    r.unmount();
  });

  it("#3 hat die Haupt-Content-Sektion mit Klasse lohn-shell__main", () => {
    const r = mount();
    const main = document.querySelector(".lohn-shell__main");
    expect(main).not.toBeNull();
    r.unmount();
  });
});
