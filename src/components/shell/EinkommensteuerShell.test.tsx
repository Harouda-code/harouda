/** @jsxImportSource react */
// EinkommensteuerShell-Smoke-Tests.
//
// Pruefen das Sidebar-Skelett: acht Gruppen
// (Hauptformulare, Persoenlich & Familie, Sonderausgaben &
// Aussergewoehnliche Belastungen, Nichtselbststaendige Arbeit,
// Selbststaendige & Gewerbliche Einkuenfte, Kapital, Vermietung,
// Sonstige & Internationales) sowie die Haupt-Content-Sektion
// mit Outlet-Aufnahmebereich und die Vollzaehligkeit der
// 25 Navigationslinks (2 Hauptformulare + 23 Anlagen).
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import EinkommensteuerShell from "./EinkommensteuerShell";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

function mount(entry: string = "/einkommensteuer") {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root: Root = createRoot(container);
  act(() => {
    root.render(
      <MemoryRouter initialEntries={[entry]}>
        <Routes>
          <Route path="/*" element={<EinkommensteuerShell />} />
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

describe("EinkommensteuerShell", () => {
  it("#1 zeigt die acht Gruppen-Ueberschriften in korrekter Reihenfolge", () => {
    const r = mount();
    const titles = Array.from(
      document.querySelectorAll(".einkommensteuer-shell__group-head")
    ).map((el) => el.textContent?.trim());
    expect(titles).toEqual([
      "Hauptformulare",
      "Persoenlich & Familie",
      "Sonderausgaben & Aussergewoehnliche Belastungen",
      "Nichtselbststaendige Arbeit",
      "Selbststaendige & Gewerbliche Einkuenfte",
      "Kapital",
      "Vermietung",
      "Sonstige & Internationales",
    ]);
    r.unmount();
  });

  it("#2 hat die Haupt-Content-Sektion mit Klasse einkommensteuer-shell__main", () => {
    const r = mount();
    const main = document.querySelector(".einkommensteuer-shell__main");
    expect(main).not.toBeNull();
    r.unmount();
  });

  it("#3 enthaelt 25 Navigationslinks (2 Hauptformulare + 23 Anlagen)", () => {
    const r = mount();
    // Alle Gruppen sind initial gefaltet — alle 8 Header per Klick
    // expandieren, damit die NavLinks im DOM erscheinen.
    const heads = Array.from(
      document.querySelectorAll<HTMLButtonElement>(
        ".einkommensteuer-shell__group-head"
      )
    );
    act(() => {
      heads.forEach((h) => h.click());
    });
    const links = document.querySelectorAll(".einkommensteuer-shell__link");
    expect(links.length).toBe(25);
    r.unmount();
  });
});
