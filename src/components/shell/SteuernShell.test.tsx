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
  it("#1 zeigt die drei Gruppen-Ueberschriften", () => {
    const r = mount();
    const titles = Array.from(
      document.querySelectorAll(".steuern-shell__group-title")
    ).map((el) => el.textContent);
    expect(titles).toEqual([
      "Hauptformulare",
      "ESt-Anlagen",
      "Jahresabschluss",
    ]);
    r.unmount();
  });

  it("#2 Hauptformulare hat 6 <li>, ESt-Anlagen ist leer, Jahresabschluss ist leer", () => {
    const r = mount();
    const groups = document.querySelectorAll(".steuern-shell__sidebar .steuern-shell__group");
    expect(groups.length).toBe(3);
    // Hauptformulare (erste Gruppe): genau 6 <li>.
    const hauptformulareLis = groups[0].querySelectorAll("ul > li");
    expect(hauptformulareLis.length).toBe(6);
    // ESt-Anlagen (zweite Gruppe): <ul> ohne Kinder.
    const estAnlagenUl = groups[1].querySelector("ul");
    expect(estAnlagenUl).not.toBeNull();
    expect(estAnlagenUl!.children.length).toBe(0);
    // Jahresabschluss (dritte Gruppe): <ul> ohne Kinder.
    const jahresabschlussUl = groups[2].querySelector("ul");
    expect(jahresabschlussUl).not.toBeNull();
    expect(jahresabschlussUl!.children.length).toBe(0);
    r.unmount();
  });

  it("#3 hat die Haupt-Content-Sektion mit Klasse steuern-shell__main", () => {
    const r = mount();
    const main = document.querySelector(".steuern-shell__main");
    expect(main).not.toBeNull();
    r.unmount();
  });
});
