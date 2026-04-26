/** @jsxImportSource react */
// SteuernShell-Smoke-Tests.
//
// Pruefen das Sidebar-Skelett: vier Gruppen-Ueberschriften, vier
// vorbereitete <ul>-Container und die Haupt-Content-Sektion mit
// Outlet-Aufnahmebereich.

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import SteuernShell from "./SteuernShell";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

function mount() {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root: Root = createRoot(container);
  act(() => {
    root.render(
      <MemoryRouter initialEntries={["/steuer"]}>
        <Routes>
          <Route path="/steuer" element={<SteuernShell />} />
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

  it("#2 enthaelt vier <ul>-Container in der Sidebar", () => {
    const r = mount();
    const lists = document.querySelectorAll(
      ".steuern-shell__sidebar ul.steuern-shell__group-list"
    );
    expect(lists.length).toBe(4);
    for (const ul of Array.from(lists)) {
      expect(ul.children.length).toBe(0);
    }
    r.unmount();
  });

  it("#3 hat die Haupt-Content-Sektion mit Klasse steuern-shell__main", () => {
    const r = mount();
    const main = document.querySelector(".steuern-shell__main");
    expect(main).not.toBeNull();
    r.unmount();
  });
});
