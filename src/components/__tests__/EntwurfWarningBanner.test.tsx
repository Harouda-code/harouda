/** @jsxImportSource react */
// Smart-Banner-Sprint · EntwurfWarningBanner-Tests.

import { describe, it, expect, beforeEach, vi } from "vitest";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter } from "react-router-dom";
import { EntwurfWarningBanner } from "../EntwurfWarningBanner";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

type RenderResult = { container: HTMLDivElement; unmount: () => void };

function render(
  props: Parameters<typeof EntwurfWarningBanner>[0]
): RenderResult {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root: Root = createRoot(container);
  act(() => {
    root.render(
      <MemoryRouter>
        <EntwurfWarningBanner {...props} />
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
  localStorage.clear();
});

describe("EntwurfWarningBanner", () => {
  it("#1 draftCount=0 rendert null (kein DOM-Output)", () => {
    const r = render({
      draftCount: 0,
      simulationMode: false,
      onToggleSimulation: () => {},
    });
    expect(
      document.querySelector('[data-testid="entwurf-warning-banner"]')
    ).toBeNull();
    r.unmount();
  });

  it("#2 draftCount=5 rendert Banner + Count + Default-Text", () => {
    const r = render({
      draftCount: 5,
      simulationMode: false,
      onToggleSimulation: () => {},
    });
    const banner = document.querySelector(
      '[data-testid="entwurf-warning-banner"]'
    );
    expect(banner).not.toBeNull();
    const defaultText = document.querySelector(
      '[data-testid="entwurf-default-text"]'
    );
    expect(defaultText?.textContent).toContain("5");
    expect(defaultText?.textContent).toMatch(/Entwurfs-Status/);
    // Simulation-Text ist in diesem State NICHT sichtbar.
    expect(
      document.querySelector('[data-testid="entwurf-simulation-text"]')
    ).toBeNull();
    r.unmount();
  });

  it("#3 Toggle-Klick feuert onToggleSimulation", () => {
    const onToggle = vi.fn();
    const r = render({
      draftCount: 3,
      simulationMode: false,
      onToggleSimulation: onToggle,
    });
    const toggle = document.querySelector<HTMLInputElement>(
      '[data-testid="entwurf-toggle"]'
    )!;
    act(() => toggle.click());
    expect(onToggle).toHaveBeenCalledTimes(1);
    r.unmount();
  });

  it("#4 simulationMode=true zeigt Export-deaktiviert-Text", () => {
    const r = render({
      draftCount: 2,
      simulationMode: true,
      onToggleSimulation: () => {},
    });
    const simText = document.querySelector(
      '[data-testid="entwurf-simulation-text"]'
    );
    expect(simText).not.toBeNull();
    expect(simText?.textContent).toMatch(/PDF-Export deaktiviert/);
    expect(simText?.textContent).toMatch(/festschreiben/i);
    // Default-Text nicht mehr sichtbar.
    expect(
      document.querySelector('[data-testid="entwurf-default-text"]')
    ).toBeNull();
    // Toggle ist checked.
    const toggle = document.querySelector<HTMLInputElement>(
      '[data-testid="entwurf-toggle"]'
    );
    expect(toggle?.checked).toBe(true);
    r.unmount();
  });

  it("Journal-Link setzt localStorage-Hint für JournalPage", () => {
    const r = render({
      draftCount: 1,
      simulationMode: false,
      onToggleSimulation: () => {},
    });
    const link = document.querySelector<HTMLAnchorElement>(
      '[data-testid="entwurf-journal-link"]'
    )!;
    act(() => link.click());
    expect(localStorage.getItem("harouda:journal:status-filter")).toBe(
      "entwurf"
    );
    r.unmount();
  });

  it("Singular-/Plural-Text: draftCount=1 nutzt 'Buchung', >1 'Buchungen'", () => {
    const r1 = render({
      draftCount: 1,
      simulationMode: false,
      onToggleSimulation: () => {},
    });
    expect(
      document.querySelector('[data-testid="entwurf-default-text"]')
        ?.textContent
    ).toMatch(/1.*Buchung im Entwurfs-Status betrifft/);
    r1.unmount();
    const r2 = render({
      draftCount: 2,
      simulationMode: false,
      onToggleSimulation: () => {},
    });
    expect(
      document.querySelector('[data-testid="entwurf-default-text"]')
        ?.textContent
    ).toMatch(/2.*Buchungen im Entwurfs-Status betreffen/);
    r2.unmount();
  });
});
