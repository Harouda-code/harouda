/** @jsxImportSource react */
//
// F42-Refactor Schritt 2 · MandantContext: URL-primary + localStorage-Fallback.
//
// Die Public-API `{ selectedMandantId, setSelectedMandantId }` soll
// identisch zur Vorgänger-Implementierung bleiben. Diese Tests prüfen
// die Auflösungs-Reihenfolge URL > localStorage > null und verifizieren,
// dass Writes BEIDE Quellen konsistent setzen.
//
// React 19 + happy-dom brauchen `IS_REACT_ACT_ENVIRONMENT=true`, damit
// `act()` State-Updates synchron flusht.

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { act, useEffect } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter, useLocation } from "react-router-dom";
import {
  MandantProvider,
  useMandant,
} from "../MandantContext";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

const STORAGE_KEY = "harouda:selectedMandantId";

type SetterRef = {
  current: ((id: string | null) => void) | null;
};

type StateRef = {
  current: string | null | undefined;
};

type SpyRef = {
  searchChanges: string[];
};

function Probe({
  setterRef,
  stateRef,
  spyRef,
}: {
  setterRef: SetterRef;
  stateRef: StateRef;
  spyRef: SpyRef;
}) {
  const { selectedMandantId, setSelectedMandantId } = useMandant();
  const location = useLocation();

  // Setter + aktueller Wert exposed, damit der Test sie außerhalb von
  // React aufrufen / auslesen kann.
  setterRef.current = setSelectedMandantId;
  stateRef.current = selectedMandantId;

  // Alle Änderungen an location.search protokollieren — so lässt sich
  // später asserieren, dass ein no-op-Setter KEINE URL-Mutation auslöst.
  useEffect(() => {
    spyRef.searchChanges.push(location.search);
  }, [location.search, spyRef]);

  return null;
}

type RenderResult = {
  setterRef: SetterRef;
  stateRef: StateRef;
  spyRef: SpyRef;
  unmount: () => void;
};

function render(initialEntry: string): RenderResult {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root: Root = createRoot(container);
  const setterRef: SetterRef = { current: null };
  const stateRef: StateRef = { current: undefined };
  const spyRef: SpyRef = { searchChanges: [] };
  act(() => {
    root.render(
      <MemoryRouter initialEntries={[initialEntry]}>
        <MandantProvider>
          <Probe
            setterRef={setterRef}
            stateRef={stateRef}
            spyRef={spyRef}
          />
        </MandantProvider>
      </MemoryRouter>
    );
  });
  return {
    setterRef,
    stateRef,
    spyRef,
    unmount: () => {
      act(() => {
        root.unmount();
      });
      container.remove();
    },
  };
}

describe("MandantContext · URL-primary + localStorage-Fallback", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it("liest mandantId aus der URL und ignoriert abweichenden localStorage-Wert", () => {
    localStorage.setItem(STORAGE_KEY, "stored-xyz");

    const { stateRef, unmount } = render("/arbeitsplatz?mandantId=url-abc");

    expect(stateRef.current).toBe("url-abc");
    unmount();
  });

  it("fällt auf localStorage zurück, wenn die URL keinen mandantId trägt", () => {
    localStorage.setItem(STORAGE_KEY, "fallback-xyz");

    const { stateRef, unmount } = render("/arbeitsplatz");

    expect(stateRef.current).toBe("fallback-xyz");
    unmount();
  });

  it("liefert null, wenn weder URL noch localStorage einen Wert halten", () => {
    const { stateRef, unmount } = render("/arbeitsplatz");
    expect(stateRef.current).toBeNull();
    unmount();
  });

  it("setSelectedMandantId('neu') schreibt URL-Query UND localStorage", () => {
    const { setterRef, stateRef, unmount } = render("/arbeitsplatz");
    expect(stateRef.current).toBeNull();

    act(() => {
      setterRef.current!("neu");
    });

    expect(stateRef.current).toBe("neu");
    expect(localStorage.getItem(STORAGE_KEY)).toBe("neu");
    unmount();
  });

  it("setSelectedMandantId(null) entfernt Query-Parameter UND räumt localStorage", () => {
    localStorage.setItem(STORAGE_KEY, "bestand");
    const { setterRef, stateRef, spyRef, unmount } = render(
      "/arbeitsplatz?mandantId=bestand"
    );
    expect(stateRef.current).toBe("bestand");

    act(() => {
      setterRef.current!(null);
    });

    expect(stateRef.current).toBeNull();
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();

    // Der letzte beobachtete search-Wert darf mandantId nicht mehr enthalten.
    const lastSearch = spyRef.searchChanges[spyRef.searchChanges.length - 1];
    expect(lastSearch.includes("mandantId")).toBe(false);
    unmount();
  });

  it("setSelectedMandantId(currentId) ist no-op — kein URL-Write, kein localStorage-Write", () => {
    localStorage.setItem(STORAGE_KEY, "same-id");
    const { setterRef, spyRef, unmount } = render(
      "/arbeitsplatz?mandantId=same-id"
    );

    // Baseline: ein initialer search-Wert wurde im Effekt-Spy aufgezeichnet.
    const baselineCount = spyRef.searchChanges.length;
    const baselineLast =
      spyRef.searchChanges[spyRef.searchChanges.length - 1];
    expect(baselineLast).toContain("mandantId=same-id");

    // localStorage-Detektion: wir überschreiben den Key mit einem Marker
    // und prüfen, dass der Setter ihn NICHT überschreibt.
    localStorage.setItem(STORAGE_KEY, "SENTINEL_DO_NOT_OVERWRITE");

    act(() => {
      setterRef.current!("same-id");
    });

    // URL-Änderung hätte einen neuen Eintrag im Spy erzeugt (location.search
    // wäre neu referenziell identisch oder geändert und der Effekt hätte
    // erneut gefeuert). Bei echter no-op bleibt der Effekt-Counter stabil.
    expect(spyRef.searchChanges.length).toBe(baselineCount);

    // Kein localStorage-Write → Sentinel unverändert.
    expect(localStorage.getItem(STORAGE_KEY)).toBe(
      "SENTINEL_DO_NOT_OVERWRITE"
    );

    unmount();
  });

  it("Integrations-Test: Provider funktioniert innerhalb eines MemoryRouters (useSearchParams verfügbar)", () => {
    // Dieser Test würde schon beim Render werfen, wenn MandantProvider
    // außerhalb eines Routers stünde — useSearchParams ist dann nicht
    // verfügbar. Reicht uns hier als Regression-Kanarie.
    expect(() => {
      const res = render("/arbeitsplatz?mandantId=integration");
      expect(res.stateRef.current).toBe("integration");
      res.unmount();
    }).not.toThrow();
  });
});
