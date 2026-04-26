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
  it("#1 zeigt die vier Gruppen-Ueberschriften", () => {
    const r = mount();
    const titles = Array.from(
      document.querySelectorAll(".steuern-shell__group-title")
    ).map((el) => el.textContent);
    expect(titles).toEqual([
      "Voranmeldungen",
      "Hauptformulare",
      "ESt-Anlagen",
      "Jahresabschluss",
    ]);
    r.unmount();
  });

  it("#2 Voranmeldungen hat 2 <li>, die uebrigen Gruppen sind leer", () => {
    const r = mount();
    const groups = document.querySelectorAll(".steuern-shell__sidebar .steuern-shell__group");
    expect(groups.length).toBe(4);

    // Voranmeldungen (erste Gruppe): genau 2 <li>.
    const voranmeldungenLis = groups[0].querySelectorAll("ul > li");
    expect(voranmeldungenLis.length).toBe(2);

    // Andere drei Gruppen: <ul> ohne Kinder.
    for (let i = 1; i < 4; i++) {
      const ul = groups[i].querySelector("ul");
      expect(ul).not.toBeNull();
      expect(ul!.children.length).toBe(0);
    }
    r.unmount();
  });

  it("#3 hat die Haupt-Content-Sektion mit Klasse steuern-shell__main", () => {
    const r = mount();
    const main = document.querySelector(".steuern-shell__main");
    expect(main).not.toBeNull();
    r.unmount();
  });

  it("#4 zeigt NavLink fuer UStVA in Voranmeldungen", () => {
    const r = mount("/steuern/ustva");
    const link = Array.from(
      document.querySelectorAll<HTMLAnchorElement>(".steuern-shell__sidebar a")
    ).find((a) => a.textContent === "Umsatzsteuer-Voranmeldung");
    expect(link).toBeDefined();
    expect(link!.getAttribute("href")).toBe("/steuern/ustva");
    expect(link!.className).toContain("steuern-shell__link--active");
    r.unmount();
  });

  it("#5 zeigt NavLink fuer ZM in Voranmeldungen", () => {
    const r = mount("/steuern/zm");
    const link = Array.from(
      document.querySelectorAll<HTMLAnchorElement>(".steuern-shell__sidebar a")
    ).find((a) => a.textContent === "Zusammenfassende Meldung");
    expect(link).toBeDefined();
    expect(link!.getAttribute("href")).toBe("/steuern/zm");
    expect(link!.className).toContain("steuern-shell__link--active");
    r.unmount();
  });
});
