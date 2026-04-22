/** @jsxImportSource react */
// Sprint 19.C · UstIdnrStatusBadge-Tests (Reminder-A-Mapping).

import { describe, it, expect, afterEach } from "vitest";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { UstIdnrStatusBadge } from "../UstIdnrStatusBadge";
import type { UstIdVerificationStatus } from "../../../types/db";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

function mount(
  status: UstIdVerificationStatus | null,
  lastCheckedAt?: string | null,
  errorDetail?: string | null
) {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root: Root = createRoot(container);
  act(() => {
    root.render(
      <UstIdnrStatusBadge
        status={status}
        lastCheckedAt={lastCheckedAt}
        errorDetail={errorDetail}
      />
    );
  });
  return {
    el: container.querySelector<HTMLElement>(
      '[data-testid="ustid-status-badge"]'
    )!,
    unmount: () => {
      act(() => root.unmount());
      container.remove();
    },
  };
}

afterEach(() => {
  document.body.innerHTML = "";
});

describe("UstIdnrStatusBadge · Mapping-Tabelle", () => {
  it("#1 VALID: ✅ + 'Gültig' + grün + Message 'Gültig bei VIES bestätigt'", () => {
    const r = mount("VALID");
    expect(r.el.getAttribute("data-status")).toBe("VALID");
    expect(r.el.textContent).toContain("Gültig");
    expect(r.el.getAttribute("aria-label")).toBe("Gültig bei VIES bestätigt");
    r.unmount();
  });

  it("#2 INVALID: ❌ + 'Ungültig' + rot + 'VIES: Nicht gültig'", () => {
    const r = mount("INVALID");
    expect(r.el.getAttribute("data-status")).toBe("INVALID");
    expect(r.el.textContent).toContain("Ungültig");
    expect(r.el.getAttribute("aria-label")).toBe("VIES: Nicht gültig");
    r.unmount();
  });

  it("#3 PENDING: ⏳ + 'Prüfung läuft' + gelb", () => {
    const r = mount("PENDING");
    expect(r.el.textContent).toContain("Prüfung läuft");
    expect(r.el.getAttribute("aria-label")).toBe(
      "Prüfung läuft — bitte später erneut laden"
    );
    r.unmount();
  });

  it("#4 SERVICE_UNAVAILABLE: ⚠️ + 'VIES down' + grau", () => {
    const r = mount("SERVICE_UNAVAILABLE");
    expect(r.el.textContent).toContain("VIES down");
    expect(r.el.getAttribute("aria-label")).toBe(
      "VIES-Dienst zurzeit nicht erreichbar. Erneut versuchen."
    );
    r.unmount();
  });

  it("#5 ERROR: ⚠️ + 'Fehler' + rot + error_message im Tooltip", () => {
    const r = mount("ERROR", null, "SOAP timeout");
    expect(r.el.textContent).toContain("Fehler");
    expect(r.el.getAttribute("aria-label")).toBe(
      "Technischer Fehler — Details: SOAP timeout"
    );
    r.unmount();
  });

  it("#6 ERROR ohne errorDetail: Fallback 'unbekannt'", () => {
    const r = mount("ERROR");
    expect(r.el.getAttribute("aria-label")).toBe(
      "Technischer Fehler — Details: unbekannt"
    );
    r.unmount();
  });

  it("#7 null: neutraler 'Nicht geprüft'-Badge (grau)", () => {
    const r = mount(null);
    expect(r.el.getAttribute("data-status")).toBe("NULL");
    expect(r.el.textContent).toContain("Nicht geprüft");
    expect(r.el.getAttribute("aria-label")).toBe("Nicht geprüft");
    r.unmount();
  });

  it("#8 lastCheckedAt wird als dd.mm.yyyy im Tooltip angehaengt", () => {
    const r = mount("VALID", "2026-04-22T10:15:00Z");
    expect(r.el.getAttribute("title")).toMatch(/22\.04\.2026/);
    r.unmount();
  });

  it("#9 ungültiger lastCheckedAt wird ignoriert", () => {
    const r = mount("VALID", "not-a-date");
    expect(r.el.getAttribute("title")).toBe("Gültig bei VIES bestätigt");
    r.unmount();
  });
});
