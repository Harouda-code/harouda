/** @jsxImportSource react */
// Sprint 18 / Schritt 4 · SvDataIncompleteBanner-Tests.

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { SvDataIncompleteBanner } from "../SvDataIncompleteBanner";
import type { Employee } from "../../../types/db";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

function makeEmp(overrides: Partial<Employee> = {}): Employee {
  return {
    id: "e-1",
    company_id: null,
    client_id: "c-1",
    personalnummer: "001",
    vorname: "Max",
    nachname: "Mustermann",
    steuer_id: "12345678901",
    sv_nummer: "12345678A012",
    steuerklasse: "I",
    kinderfreibetraege: 0,
    konfession: null,
    bundesland: "BE",
    einstellungsdatum: "2024-01-01",
    austrittsdatum: null,
    beschaeftigungsart: "vollzeit",
    wochenstunden: 40,
    bruttogehalt_monat: 3000,
    stundenlohn: null,
    krankenkasse: "TK",
    zusatzbeitrag_pct: 2.45,
    privat_versichert: false,
    pv_kinderlos: false,
    pv_kinder_anzahl: 0,
    iban: null,
    bic: null,
    kontoinhaber: null,
    notes: null,
    is_active: true,
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
    staatsangehoerigkeit: "DE",
    taetigkeitsschluessel: "123456789",
    einzugsstelle_bbnr: "01234567",
    anschrift_strasse: "Musterweg",
    anschrift_hausnummer: "1",
    anschrift_plz: "10115",
    anschrift_ort: "Berlin",
    anschrift_land: "DE",
    mehrfachbeschaeftigung: false,
    ...overrides,
  };
}

function mount(employee: Employee) {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root: Root = createRoot(container);
  act(() => {
    root.render(<SvDataIncompleteBanner employee={employee} />);
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

describe("SvDataIncompleteBanner", () => {
  it("#1 Vollstaendiger Employee: rendert NICHTS", () => {
    const r = mount(makeEmp());
    expect(
      document.querySelector('[data-testid="sv-data-incomplete-banner"]')
    ).toBeNull();
    r.unmount();
  });

  it("#2 Employee ohne Taetigkeitsschluessel: Banner mit 1 missing", () => {
    const r = mount(makeEmp({ taetigkeitsschluessel: null }));
    const banner = document.querySelector(
      '[data-testid="sv-data-incomplete-banner"]'
    );
    expect(banner).not.toBeNull();
    expect(banner!.getAttribute("data-missing-count")).toBe("1");
    expect(banner!.textContent).toContain("Tätigkeitsschlüssel");
    r.unmount();
  });

  it("#3 Employee ohne Anschrift: Banner listet alle 4 Anschrift-Labels", () => {
    const r = mount(
      makeEmp({
        anschrift_strasse: null,
        anschrift_hausnummer: null,
        anschrift_plz: null,
        anschrift_ort: null,
      })
    );
    const banner = document.querySelector(
      '[data-testid="sv-data-incomplete-banner"]'
    )!;
    expect(banner.getAttribute("data-missing-count")).toBe("4");
    expect(banner.textContent).toContain("Straße");
    expect(banner.textContent).toContain("Hausnummer");
    expect(banner.textContent).toContain("PLZ");
    expect(banner.textContent).toContain("Ort");
  });

  it("#4 Jump-Link zeigt auf Form-Anchor #sv-stammdaten", () => {
    const r = mount(makeEmp({ sv_nummer: null }));
    const link = document.querySelector<HTMLAnchorElement>(
      '[data-testid="sv-data-jump-link"]'
    );
    expect(link).not.toBeNull();
    expect(link!.getAttribute("href")).toBe("#sv-stammdaten");
    r.unmount();
  });
});
