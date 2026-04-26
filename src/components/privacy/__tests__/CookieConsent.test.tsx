/** @jsxImportSource react */
//
// Tests für Cookie-Consent-Banner + analytics-Gate.
//
// Der entscheidende Test ist `no analytics scripts injected without
// consent` — genau das ist die TTDSG-§-25-Pflicht, die bisher verletzt
// war. Ohne diesen Test könnte das Banner kosmetisch bleiben.
//
// WICHTIG: Der Wrapper `wrap()` mountet den Banner OHNE Router. In der
// Produktion hängt <CookieConsent /> in main.tsx als Geschwister von
// <App /> (global sichtbar, bevor Routen gematcht werden). Deshalb darf
// der Banner KEINE react-router-Primitive verwenden; diese Tests würden
// sonst bei der Destrukturierung des Router-Contexts crashen.

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { CookieConsent } from "../CookieConsent";
import {
  CookieConsentProvider,
  hasStoredConsent,
  readStoredConsent,
  STORAGE_KEY,
  POLICY_VERSION,
} from "../../../contexts/CookieConsentContext";

function render(ui: React.ReactElement): {
  container: HTMLDivElement;
  root: Root;
  unmount: () => void;
} {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);
  act(() => {
    root.render(ui);
  });
  return {
    container,
    root,
    unmount: () => {
      act(() => {
        root.unmount();
      });
      container.remove();
    },
  };
}

// Bewusst OHNE <MemoryRouter> — siehe Header-Kommentar.
function wrap(ui: React.ReactElement) {
  return <CookieConsentProvider>{ui}</CookieConsentProvider>;
}

describe("CookieConsent banner", () => {
  beforeEach(() => {
    localStorage.clear();
    // Entfernt evtl. in vorherigen Tests injizierte Analytics-Scripts.
    document
      .querySelectorAll('script[src*="googletagmanager.com"]')
      .forEach((s) => s.remove());
    document
      .querySelectorAll('script[src*="plausible.io"]')
      .forEach((s) => s.remove());
    document
      .querySelectorAll('script[data-harouda="ga4-init"]')
      .forEach((s) => s.remove());
  });

  afterEach(() => {
    localStorage.clear();
  });

  it("zeigt das Banner, wenn keine Einwilligung gespeichert ist", () => {
    const { container, unmount } = render(wrap(<CookieConsent />));
    expect(container.querySelector('[role="dialog"]')).not.toBeNull();
    expect(container.textContent).toContain("TTDSG");
    unmount();
  });

  // REGRESSION: Der Banner wird in main.tsx als Geschwister von <App />
  // gemountet, NICHT innerhalb des BrowserRouter. Jede Nutzung von
  // react-router-Primitiven (<Link>, useNavigate …) würde hier den Context
  // destrukturieren wollen und crashen:
  //   "Cannot destructure property 'basename' of useContext(...) as it is null"
  // Dieser Test stellt sicher, dass der Banner auch ohne jegliche Router-
  // Vorfahren-Komponente rendert und interaktiv bleibt.
  it("rendert ohne Router-Vorfahren (main.tsx-Einbindung simuliert) und bleibt bedienbar", () => {
    // Kein MemoryRouter, kein BrowserRouter — nur der Provider.
    const { container, unmount } = render(
      <CookieConsentProvider>
        <CookieConsent />
      </CookieConsentProvider>
    );
    expect(container.querySelector('[role="dialog"]')).not.toBeNull();

    // Footer-Links sind reine <a>-Tags, KEIN <Link>.
    const links = container.querySelectorAll("a");
    expect(links.length).toBe(2);
    expect(links[0].getAttribute("href")).toBe("/datenschutz");
    expect(links[1].getAttribute("href")).toBe("/impressum");

    // Essentielle-Button bleibt klickbar.
    const btn = container.querySelector<HTMLButtonElement>(
      '[data-testid="cookie-consent-essential-only"]'
    );
    act(() => {
      btn!.click();
    });
    expect(container.querySelector('[role="dialog"]')).toBeNull();
    unmount();
  });

  it("verbirgt das Banner nach 'Alle akzeptieren' und speichert Einwilligung", () => {
    const { container, unmount } = render(wrap(<CookieConsent />));
    const btn = container.querySelector<HTMLButtonElement>(
      '[data-testid="cookie-consent-accept-all"]'
    );
    expect(btn).not.toBeNull();
    act(() => {
      btn!.click();
    });
    expect(container.querySelector('[role="dialog"]')).toBeNull();

    const stored = readStoredConsent();
    expect(stored).not.toBeNull();
    expect(stored?.categories.analytics).toBe(true);
    expect(stored?.version).toBe(POLICY_VERSION);
    unmount();
  });

  it("verbirgt das Banner nach 'Nur essentielle' und speichert analytics=false", () => {
    const { container, unmount } = render(wrap(<CookieConsent />));
    const btn = container.querySelector<HTMLButtonElement>(
      '[data-testid="cookie-consent-essential-only"]'
    );
    act(() => {
      btn!.click();
    });
    expect(container.querySelector('[role="dialog"]')).toBeNull();

    const stored = readStoredConsent();
    expect(stored?.categories.essential).toBe(true);
    expect(stored?.categories.analytics).toBe(false);
    unmount();
  });

  it("erscheint erneut nach Versions-Bump (alte Policy ungültig)", () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        version: "OLD-0",
        timestamp: new Date().toISOString(),
        categories: { essential: true, analytics: true },
      })
    );
    expect(hasStoredConsent("analytics")).toBe(false);
    const { container, unmount } = render(wrap(<CookieConsent />));
    expect(container.querySelector('[role="dialog"]')).not.toBeNull();
    unmount();
  });

  it("hasStoredConsent('essential') ist immer true (§ 25 Abs. 2 Nr. 2 TTDSG)", () => {
    expect(hasStoredConsent("essential")).toBe(true);
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        version: POLICY_VERSION,
        timestamp: new Date().toISOString(),
        categories: { essential: true, analytics: false },
      })
    );
    expect(hasStoredConsent("essential")).toBe(true);
    expect(hasStoredConsent("analytics")).toBe(false);
  });

  it("injiziert KEINE Analyse-Scripts, solange keine Analytics-Einwilligung vorliegt (TTDSG § 25)", async () => {
    // Kanzlei-Betreiber hat Plausible konfiguriert …
    localStorage.setItem(
      "harouda:settings",
      JSON.stringify({ plausibleDomain: "beispiel.de" })
    );

    // … Nutzer:in gibt NUR essentielle frei.
    const { unmount } = render(wrap(<CookieConsent />));
    const btn = document.querySelector<HTMLButtonElement>(
      '[data-testid="cookie-consent-essential-only"]'
    );
    act(() => {
      btn!.click();
    });

    // Kurz warten, bis React-Effekte gelaufen sind.
    await act(async () => {
      await Promise.resolve();
    });

    const plausible = document.querySelector('script[src*="plausible.io"]');
    const gtag = document.querySelector(
      'script[src*="googletagmanager.com"]'
    );
    expect(plausible).toBeNull();
    expect(gtag).toBeNull();
    unmount();
  });

  it("injiziert Plausible-Script NACH Analytics-Einwilligung", async () => {
    localStorage.setItem(
      "harouda:settings",
      JSON.stringify({ plausibleDomain: "beispiel.de" })
    );

    const { unmount } = render(wrap(<CookieConsent />));
    const btn = document.querySelector<HTMLButtonElement>(
      '[data-testid="cookie-consent-accept-all"]'
    );
    act(() => {
      btn!.click();
    });
    await act(async () => {
      await Promise.resolve();
    });

    const plausible = document.querySelector('script[src*="plausible.io"]');
    expect(plausible).not.toBeNull();
    unmount();
  });
});
