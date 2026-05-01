// src/components/shell/SidebarShell.test.tsx
//
// Tests fuer die wiederverwendbare SidebarShell-Komponente.
//
// Geprueft wird:
//  - Gruppen-Header werden gerendert (als <button>).
//  - Items sind initial gefaltet (nicht im DOM).
//  - Klick auf Header expandiert die Gruppe.
//  - Auto-Expand bei aktiver Route.
//  - aria-expanded auf den Headern.
//  - storageKey-Persistenz via localStorage.
//  - backLink (mit/ohne) und ARIA-Attribute.

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { createRoot, type Root } from "react-dom/client";
import { act } from "react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import SidebarShell, {
  type SidebarNavGroup,
} from "./SidebarShell";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

let container: HTMLDivElement;

beforeEach(() => {
  localStorage.clear();
  container = document.createElement("div");
  document.body.appendChild(container);
});

afterEach(() => {
  document.body.removeChild(container);
  localStorage.clear();
});

const GROUPS: SidebarNavGroup[] = [
  {
    id: "g1",
    label: "Gruppe 1",
    items: [
      { to: "/test/a", label: "A" },
      { to: "/test/b", label: "B" },
    ],
  },
  {
    id: "g2",
    label: "Gruppe 2",
    items: [],
  },
];

type MountOpts = {
  withBackLink?: boolean;
  storageKey?: string;
  initialEntry?: string;
};

function mount(opts: MountOpts = {}): Root {
  const { withBackLink = false, storageKey, initialEntry = "/test" } = opts;
  const root = createRoot(container);
  act(() => {
    root.render(
      <MemoryRouter initialEntries={[initialEntry]}>
        <Routes>
          <Route
            path="/*"
            element={
              <SidebarShell
                bemBlock="test-shell"
                ariaLabel="Test-Navigation"
                groups={GROUPS}
                storageKey={storageKey}
                backLink={
                  withBackLink
                    ? { to: "/back", label: "Zurueck" }
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
  it("#1 rendert alle Gruppen-Header", () => {
    const r = mount();
    const heads = Array.from(
      document.querySelectorAll(".test-shell__group-head"),
    ).map((el) => el.textContent?.trim());
    expect(heads).toEqual(["Gruppe 1", "Gruppe 2"]);
    act(() => r.unmount());
  });

  it("#2 Items sind initial gefaltet (nicht im DOM)", () => {
    const r = mount();
    const links = document.querySelectorAll(".test-shell__link");
    expect(links.length).toBe(0);
    const lists = document.querySelectorAll(".test-shell__group-list");
    expect(lists.length).toBe(0);
    act(() => r.unmount());
  });

  it("#3 Klick auf Header expandiert die Gruppe", () => {
    const r = mount();
    const head = document.querySelector(
      ".test-shell__group-head",
    ) as HTMLButtonElement | null;
    expect(head).not.toBeNull();
    act(() => {
      head!.click();
    });
    const links = document.querySelectorAll(".test-shell__link");
    expect(links.length).toBe(2);
    expect(links[0].textContent).toBe("A");
    expect(links[1].textContent).toBe("B");
    act(() => r.unmount());
  });

  it("#4 Klick auf bereits offene Gruppe faltet sie wieder", () => {
    const r = mount();
    const head = document.querySelector(
      ".test-shell__group-head",
    ) as HTMLButtonElement;
    act(() => head.click());
    expect(document.querySelectorAll(".test-shell__link").length).toBe(2);
    act(() => head.click());
    expect(document.querySelectorAll(".test-shell__link").length).toBe(0);
    act(() => r.unmount());
  });

  it("#5 aria-expanded reflektiert Faltzustand", () => {
    const r = mount();
    const head = document.querySelector(
      ".test-shell__group-head",
    ) as HTMLButtonElement;
    expect(head.getAttribute("aria-expanded")).toBe("false");
    act(() => head.click());
    expect(head.getAttribute("aria-expanded")).toBe("true");
    act(() => r.unmount());
  });

  it("#6 Auto-Expand bei aktiver Route", () => {
    const r = mount({ initialEntry: "/test/a" });
    const links = document.querySelectorAll(".test-shell__link");
    expect(links.length).toBe(2);
    act(() => r.unmount());
  });

  it("#7 ohne backLink kein Zurueck-Link", () => {
    const r = mount();
    const back = document.querySelector(".test-shell__back-link");
    expect(back).toBeNull();
    act(() => r.unmount());
  });

  it("#8 mit backLink wird Zurueck-Link gerendert", () => {
    const r = mount({ withBackLink: true });
    const back = document.querySelector(".test-shell__back-link");
    expect(back).not.toBeNull();
    expect(back!.textContent).toBe("Zurueck");
    expect(back!.getAttribute("href")).toBe("/back");
    act(() => r.unmount());
  });

  it("#9 aside hat aria-label", () => {
    const r = mount();
    const aside = document.querySelector(".test-shell__sidebar");
    expect(aside).not.toBeNull();
    expect(aside!.getAttribute("aria-label")).toBe("Test-Navigation");
    act(() => r.unmount());
  });

  it("#10 main-Section ist vorhanden", () => {
    const r = mount();
    const main = document.querySelector(".test-shell__main");
    expect(main).not.toBeNull();
    act(() => r.unmount());
  });

  it("#11 storageKey persistiert offene Gruppen", () => {
    const KEY = "test:sidebar:expanded";
    const r1 = mount({ storageKey: KEY });
    const head = document.querySelector(
      ".test-shell__group-head",
    ) as HTMLButtonElement;
    act(() => head.click());
    const stored = localStorage.getItem(KEY);
    expect(stored).not.toBeNull();
    const parsed = JSON.parse(stored!) as unknown;
    expect(parsed).toEqual(["g1"]);
    act(() => r1.unmount());

    // Neuer Mount: Gruppe muss aus localStorage offen sein.
    const r2 = mount({ storageKey: KEY });
    const links = document.querySelectorAll(".test-shell__link");
    expect(links.length).toBe(2);
    act(() => r2.unmount());
  });

  it("#12 ohne storageKey keine Persistenz", () => {
    const r = mount();
    const head = document.querySelector(
      ".test-shell__group-head",
    ) as HTMLButtonElement;
    act(() => head.click());
    // Es darf KEIN localStorage-Eintrag mit unserem Praefix entstehen.
    let foundKey = false;
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.includes("test")) foundKey = true;
    }
    expect(foundKey).toBe(false);
    act(() => r.unmount());
  });

  it("#13 korrupter localStorage-Eintrag wird ignoriert", () => {
    const KEY = "test:sidebar:corrupt";
    localStorage.setItem(KEY, "{not valid json");
    const r = mount({ storageKey: KEY });
    // Komponente rendert ohne Crash; alle Gruppen gefaltet.
    const links = document.querySelectorAll(".test-shell__link");
    expect(links.length).toBe(0);
    act(() => r.unmount());
  });
});
