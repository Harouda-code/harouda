/** @jsxImportSource react */
// BerichteShell-Smoke-Tests.
//
// Pruefen das Sidebar-Skelett: eine Gruppen-Ueberschrift mit 8 items
// und die Haupt-Content-Sektion mit Outlet-Aufnahmebereich.

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import BerichteShell from "./BerichteShell";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

function mount(entry: string = "/berichte/bilanz") {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root: Root = createRoot(container);
  act(() => {
    root.render(
      <MemoryRouter initialEntries={[entry]}>
        <Routes>
          <Route path="/*" element={<BerichteShell />} />
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

describe("BerichteShell", () => {
  it("#1 zeigt die eine Gruppen-Ueberschrift", () => {
    const r = mount();
    const titles = Array.from(
      document.querySelectorAll(".berichte-shell__group-head")
    ).map((el) => el.textContent?.trim());
    expect(titles).toEqual([
      "Berichte",
    ]);
    r.unmount();
  });

  it("#2 Berichte hat 8 <li>", () => {
    const r = mount();
    const groups = document.querySelectorAll(
      ".berichte-shell__sidebar .berichte-shell__group"
    );
    expect(groups.length).toBe(1);
    const lis = groups[0].querySelectorAll("ul > li");
    expect(lis.length).toBe(8);
    const labels = Array.from(lis).map((li) => li.textContent?.trim());
    expect(labels).toEqual([
      expect.stringContaining("Bilanz"),
      expect.stringContaining("GuV"),
      expect.stringContaining("BWA"),
      expect.stringContaining("Jahresabschluss"),
      expect.stringContaining("Vorjahresvergleich"),
      expect.stringContaining("SuSa"),
      expect.stringContaining("Dimensionen"),
      expect.stringContaining("Anlagenspiegel"),
    ]);
    r.unmount();
  });

  it("#3 hat die Haupt-Content-Sektion mit Klasse berichte-shell__main", () => {
    const r = mount();
    const main = document.querySelector(".berichte-shell__main");
    expect(main).not.toBeNull();
    r.unmount();
  });
});
