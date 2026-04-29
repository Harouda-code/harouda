/** @jsxImportSource react */
// JahresabschlussShell-Smoke-Tests.
//
// Pruefen das Sidebar-Skelett: drei Gruppen
// (Bilanzierung, Offenlegung, Pruefung) sowie die Haupt-Content-
// Sektion mit Outlet-Aufnahmebereich.

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter, Route, Routes } from "react-router-dom";

import JahresabschlussShell from "./JahresabschlussShell";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

function mount(entry: string = "/jahresabschluss") {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root: Root = createRoot(container);
  act(() => {
    root.render(
      <MemoryRouter initialEntries={[entry]}>
        <Routes>
          <Route path="/*" element={<JahresabschlussShell />} />
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

describe("JahresabschlussShell", () => {
  it("#2 zeigt die drei Gruppen-Ueberschriften", () => {
    const r = mount();
    const titles = Array.from(
      document.querySelectorAll(".jahresabschluss-shell__group-title")
    ).map((el) => el.textContent);
    expect(titles).toEqual([
      "Bilanzierung",
      "Offenlegung",
      "Pruefung",
    ]);
    r.unmount();
  });

  it("#3 hat die Haupt-Content-Sektion mit Klasse jahresabschluss-shell__main", () => {
    const r = mount();
    const main = document.querySelector(".jahresabschluss-shell__main");
    expect(main).not.toBeNull();
    r.unmount();
  });
});
