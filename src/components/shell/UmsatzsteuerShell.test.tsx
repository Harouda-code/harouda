/** @jsxImportSource react */
// UmsatzsteuerShell-Smoke-Tests.
//
// Pruefen das Sidebar-Skelett: ein Zurueck-Button und drei Gruppen
// (Voranmeldungen, Jahreserklaerung, Zusammenfassende Meldung)
// sowie die Haupt-Content-Sektion mit Outlet-Aufnahmebereich.

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter, Route, Routes } from "react-router-dom";

import UmsatzsteuerShell from "./UmsatzsteuerShell";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

function mount(entry: string = "/umsatzsteuer") {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root: Root = createRoot(container);
  act(() => {
    root.render(
      <MemoryRouter initialEntries={[entry]}>
        <Routes>
          <Route path="/*" element={<UmsatzsteuerShell />} />
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

describe("UmsatzsteuerShell", () => {
  it("#1 zeigt den Zurueck-Button zur Mandantenuebersicht", () => {
    const r = mount();
    const backLink = document.querySelector(
      ".umsatzsteuer-shell__back-link"
    );
    expect(backLink).not.toBeNull();
    expect(backLink!.textContent).toContain("Zurueck");
    r.unmount();
  });

  it("#2 zeigt die drei Gruppen-Ueberschriften", () => {
    const r = mount();
    const titles = Array.from(
      document.querySelectorAll(".umsatzsteuer-shell__group-title")
    ).map((el) => el.textContent);
    expect(titles).toEqual([
      "Voranmeldungen",
      "Jahreserklaerung",
      "Zusammenfassende Meldung",
    ]);
    r.unmount();
  });

  it("#3 hat die Haupt-Content-Sektion mit Klasse umsatzsteuer-shell__main", () => {
    const r = mount();
    const main = document.querySelector(".umsatzsteuer-shell__main");
    expect(main).not.toBeNull();
    r.unmount();
  });
});
