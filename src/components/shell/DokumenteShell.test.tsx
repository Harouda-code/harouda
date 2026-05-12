/** @jsxImportSource react */
// DokumenteShell-Smoke-Tests.
//
// Pruefen das Sidebar-Skelett: eine Gruppen-Ueberschrift mit 6 items
// und die Haupt-Content-Sektion mit Outlet-Aufnahmebereich.

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import DokumenteShell from "./DokumenteShell";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

function mount(entry: string = "/belege") {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root: Root = createRoot(container);
  act(() => {
    root.render(
      <MemoryRouter initialEntries={[entry]}>
        <Routes>
          <Route path="/*" element={<DokumenteShell />} />
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

describe("DokumenteShell", () => {
  it("#1 zeigt die eine Gruppen-Ueberschrift", () => {
    const r = mount();
    const titles = Array.from(
      document.querySelectorAll(".dokumente-shell__group-head")
    ).map((el) => el.textContent?.trim());
    expect(titles).toEqual([
      "Dokumente",
    ]);
    r.unmount();
  });

  it("#2 Dokumente hat 6 <li>", () => {
    const r = mount();
    const groups = document.querySelectorAll(
      ".dokumente-shell__sidebar .dokumente-shell__group"
    );
    expect(groups.length).toBe(1);
    const lis = groups[0].querySelectorAll("ul > li");
    expect(lis.length).toBe(6);
    const labels = Array.from(lis).map((li) => li.textContent?.trim());
    expect(labels).toEqual([
      expect.stringContaining("Belege"),
      expect.stringContaining("E-Rechnung (§ 14 UStG)"),
      expect.stringContaining("E-Rechnung (ZUGFeRD)"),
      expect.stringContaining("E-Rechnung-Archiv"),
      expect.stringContaining("Dokument-Scanner"),
      expect.stringContaining("PDF-Werkzeuge"),
    ]);
    r.unmount();
  });

  it("#3 hat die Haupt-Content-Sektion mit Klasse dokumente-shell__main", () => {
    const r = mount();
    const main = document.querySelector(".dokumente-shell__main");
    expect(main).not.toBeNull();
    r.unmount();
  });
});
