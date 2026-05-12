/** @jsxImportSource react */
// PersonalShell-Smoke-Tests.
//
// Pruefen das Sidebar-Skelett: eine Gruppen-Ueberschrift mit 2 items
// und die Haupt-Content-Sektion mit Outlet-Aufnahmebereich.

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import PersonalShell from "./PersonalShell";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

function mount(entry: string = "/personal/mitarbeiter") {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root: Root = createRoot(container);
  act(() => {
    root.render(
      <MemoryRouter initialEntries={[entry]}>
        <Routes>
          <Route path="/*" element={<PersonalShell />} />
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

describe("PersonalShell", () => {
  it("#1 zeigt die eine Gruppen-Ueberschrift", () => {
    const r = mount();
    const titles = Array.from(
      document.querySelectorAll(".personal-shell__group-head")
    ).map((el) => el.textContent?.trim());
    expect(titles).toEqual([
      "Personal",
    ]);
    r.unmount();
  });

  it("#2 Personal hat 2 <li>", () => {
    const r = mount();
    const groups = document.querySelectorAll(
      ".personal-shell__sidebar .personal-shell__group"
    );
    expect(groups.length).toBe(1);
    const lis = groups[0].querySelectorAll("ul > li");
    expect(lis.length).toBe(2);
    const labels = Array.from(lis).map((li) => li.textContent?.trim());
    expect(labels).toEqual([
      expect.stringContaining("Mitarbeiter"),
      expect.stringContaining("Lohn-Vorschau"),
    ]);
    r.unmount();
  });

  it("#3 hat die Haupt-Content-Sektion mit Klasse personal-shell__main", () => {
    const r = mount();
    const main = document.querySelector(".personal-shell__main");
    expect(main).not.toBeNull();
    r.unmount();
  });
});
