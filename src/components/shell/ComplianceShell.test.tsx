/** @jsxImportSource react */
// ComplianceShell-Smoke-Tests.
//
// Pruefen das Sidebar-Skelett: eine Gruppen-Ueberschrift mit 5 items
// und die Haupt-Content-Sektion mit Outlet-Aufnahmebereich.

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import ComplianceShell from "./ComplianceShell";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

function mount(entry: string = "/kanzlei-dashboard") {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root: Root = createRoot(container);
  act(() => {
    root.render(
      <MemoryRouter initialEntries={[entry]}>
        <Routes>
          <Route path="/*" element={<ComplianceShell />} />
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

describe("ComplianceShell", () => {
  it("#1 zeigt die eine Gruppen-Ueberschrift", () => {
    const r = mount();
    const titles = Array.from(
      document.querySelectorAll(".compliance-shell__group-head")
    ).map((el) => el.textContent?.trim());
    expect(titles).toEqual([
      "Compliance & Export",
    ]);
    r.unmount();
  });

  it("#2 Compliance & Export hat 5 <li>", () => {
    const r = mount();
    const groups = document.querySelectorAll(
      ".compliance-shell__sidebar .compliance-shell__group"
    );
    expect(groups.length).toBe(1);
    const lis = groups[0].querySelectorAll("ul > li");
    expect(lis.length).toBe(5);
    const labels = Array.from(lis).map((li) => li.textContent?.trim());
    expect(labels).toEqual([
      expect.stringContaining("Kanzlei-Dashboard"),
      expect.stringContaining("Audit-Trail"),
      expect.stringContaining("Z3-Datenexport"),
      expect.stringContaining("Datenexport"),
      expect.stringContaining("DATEV-Export"),
    ]);
    r.unmount();
  });

  it("#3 hat die Haupt-Content-Sektion mit Klasse compliance-shell__main", () => {
    const r = mount();
    const main = document.querySelector(".compliance-shell__main");
    expect(main).not.toBeNull();
    r.unmount();
  });
});
