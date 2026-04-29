// src/components/shell/SidebarShell.test.tsx
//
// Tests fuer die wiederverwendbare SidebarShell-Komponente.

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { createRoot, type Root } from "react-dom/client";
import { act } from "react";
import { MemoryRouter, Routes, Route } from "react-router-dom";

import SidebarShell, {
  type SidebarNavGroup,
} from "./SidebarShell";

let container: HTMLDivElement;

beforeEach(() => {
  container = document.createElement("div");
  document.body.appendChild(container);
});

afterEach(() => {
  document.body.removeChild(container);
});

const GROUPS: SidebarNavGroup[] = [
  {
    id: "g1",
    title: "Gruppe 1",
    items: [
      { to: "/test/a", label: "A" },
      { to: "/test/b", label: "B" },
    ],
  },
  {
    id: "g2",
    title: "Gruppe 2",
    items: [],
  },
];

function mount(withBackLink: boolean): Root {
  const root = createRoot(container);
  act(() => {
    root.render(
      <MemoryRouter initialEntries={["/test"]}>
        <Routes>
          <Route
            path="/test"
            element={
              <SidebarShell
                bemBlock="test-shell"
                ariaLabel="Test-Navigation"
                groups={GROUPS}
                backLink={
                  withBackLink
                    ? { to: "/back", label: "← Zurueck" }
                    : undefined
                }
              />
            }
          />
        </Routes>
      </MemoryRouter>,
    );
  });
  return root;
}

describe("SidebarShell", () => {
  it("#1 rendert alle Gruppen-Titel", () => {
    const r = mount(false);
    const titles = Array.from(
      document.querySelectorAll(".test-shell__group-title"),
    ).map((el) => el.textContent);
    expect(titles).toEqual(["Gruppe 1", "Gruppe 2"]);
    r.unmount();
  });

  it("#2 rendert NavLinks fuer Items", () => {
    const r = mount(false);
    const links = document.querySelectorAll(".test-shell__link");
    expect(links.length).toBe(2);
    expect(links[0].textContent).toBe("A");
    expect(links[1].textContent).toBe("B");
    r.unmount();
  });

  it("#3 leere Gruppe hat <ul> ohne Kinder", () => {
    const r = mount(false);
    const groups = document.querySelectorAll(".test-shell__group");
    expect(groups.length).toBe(2);
    const emptyUl = groups[1].querySelector("ul");
    expect(emptyUl).not.toBeNull();
    expect(emptyUl!.children.length).toBe(0);
    r.unmount();
  });

  it("#4 ohne backLink kein Zurueck-Link", () => {
    const r = mount(false);
    const back = document.querySelector(".test-shell__back-link");
    expect(back).toBeNull();
    r.unmount();
  });

  it("#5 mit backLink wird Zurueck-Link gerendert", () => {
    const r = mount(true);
    const back = document.querySelector(".test-shell__back-link");
    expect(back).not.toBeNull();
    expect(back!.textContent).toBe("← Zurueck");
    expect(back!.getAttribute("href")).toBe("/back");
    r.unmount();
  });

  it("#6 aside hat aria-label", () => {
    const r = mount(false);
    const aside = document.querySelector(".test-shell__sidebar");
    expect(aside).not.toBeNull();
    expect(aside!.getAttribute("aria-label")).toBe("Test-Navigation");
    r.unmount();
  });

  it("#7 main-Section ist vorhanden", () => {
    const r = mount(false);
    const main = document.querySelector(".test-shell__main");
    expect(main).not.toBeNull();
    r.unmount();
  });
});
