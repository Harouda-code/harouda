/** @jsxImportSource react */
// Multi-Tenancy Phase 1 / Schritt 3 · Guard-Test.

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter } from "react-router-dom";
import { MandantProvider } from "../../contexts/MandantContext";
import { MandantRequiredGuard } from "../MandantRequiredGuard";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

function renderWithMandant(
  initialPath: string,
  child: React.ReactNode
): { container: HTMLDivElement; unmount: () => void } {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root: Root = createRoot(container);
  act(() => {
    root.render(
      <MemoryRouter initialEntries={[initialPath]}>
        <MandantProvider>
          <MandantRequiredGuard>{child}</MandantRequiredGuard>
        </MandantProvider>
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

describe("MandantRequiredGuard", () => {
  beforeEach(() => {
    localStorage.clear();
  });
  afterEach(() => {
    localStorage.clear();
  });

  it("rendert Info-Card + KEINE children, wenn kein Mandant gesetzt ist", () => {
    const { container, unmount } = renderWithMandant(
      "/steuer/gewerbesteuer",
      <div data-testid="protected">Inhalt</div>
    );
    expect(
      container.querySelector('[data-testid="mandant-required-guard"]')
    ).not.toBeNull();
    expect(container.querySelector('[data-testid="protected"]')).toBeNull();
    // Link auf Arbeitsplatz.
    const link = container.querySelector<HTMLAnchorElement>(
      '[data-testid="mandant-required-link"]'
    );
    expect(link?.getAttribute("href")).toBe("/arbeitsplatz");
    unmount();
  });

  it("rendert children, sobald ein Mandant in der URL/Fallback gesetzt ist", () => {
    const { container, unmount } = renderWithMandant(
      "/steuer/gewerbesteuer?mandantId=c-1",
      <div data-testid="protected">Inhalt</div>
    );
    expect(
      container.querySelector('[data-testid="protected"]')
    ).not.toBeNull();
    expect(
      container.querySelector('[data-testid="mandant-required-guard"]')
    ).toBeNull();
    unmount();
  });
});
