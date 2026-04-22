/** @jsxImportSource react */
// Sprint 20.A.2 · UstIdnrStatusBadge · source-Prop (BZSt/VIES).

import { describe, it, expect, afterEach } from "vitest";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { UstIdnrStatusBadge } from "../UstIdnrStatusBadge";
import type { UstIdVerificationSource } from "../../../types/db";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

function mount(source: UstIdVerificationSource | null | undefined) {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root: Root = createRoot(container);
  act(() => {
    root.render(
      <UstIdnrStatusBadge
        status="VALID"
        source={source}
        testIdSuffix="t1"
      />
    );
  });
  return {
    sourceBadge: container.querySelector<HTMLElement>(
      '[data-testid="ustid-source-badge-t1"]'
    ),
    statusBadge: container.querySelector<HTMLElement>(
      '[data-testid="ustid-status-badge-t1"]'
    ),
    unmount: () => {
      act(() => root.unmount());
      container.remove();
    },
  };
}

afterEach(() => {
  document.body.innerHTML = "";
});

describe("UstIdnrStatusBadge · source-Prop", () => {
  it("#1 source=BZST rendert Zusatz-Badge mit 'BZSt'-Label", () => {
    const r = mount("BZST");
    expect(r.sourceBadge).not.toBeNull();
    expect(r.sourceBadge!.getAttribute("data-source")).toBe("BZST");
    expect(r.sourceBadge!.textContent).toContain("BZSt");
    r.unmount();
  });

  it("#2 source=BZST hat Tooltip 'DE qualifizierte Bestätigung § 18e UStG'", () => {
    const r = mount("BZST");
    expect(r.sourceBadge!.getAttribute("title")).toMatch(
      /BZSt|qualifizierte Bestätigung|§ 18e UStG/
    );
    r.unmount();
  });

  it("#3 source=VIES rendert Zusatz-Badge mit 'VIES'-Label", () => {
    const r = mount("VIES");
    expect(r.sourceBadge).not.toBeNull();
    expect(r.sourceBadge!.getAttribute("data-source")).toBe("VIES");
    expect(r.sourceBadge!.textContent).toContain("VIES");
    r.unmount();
  });

  it("#4 source=VIES hat Tooltip 'EU-Kommission'", () => {
    const r = mount("VIES");
    expect(r.sourceBadge!.getAttribute("title")).toMatch(/EU-Kommission/);
    r.unmount();
  });

  it("#5 source=null rendert KEINEN Zusatz-Badge", () => {
    const r = mount(null);
    expect(r.sourceBadge).toBeNull();
    // Status-Badge ist aber weiterhin da
    expect(r.statusBadge).not.toBeNull();
    r.unmount();
  });

  it("#6 source=undefined (prop weggelassen) rendert KEINEN Zusatz-Badge", () => {
    const r = mount(undefined);
    expect(r.sourceBadge).toBeNull();
    r.unmount();
  });
});
