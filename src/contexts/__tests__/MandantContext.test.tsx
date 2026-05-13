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

  // --- Cross-Tab-Sync · storage-Event-Handler ---------------------------

  it("Cross-Tab · storage-Event mit STORAGE_KEY aktualisiert Fallback, wenn URL keine mandantId trägt", () => {
    // Ohne URL-mandantId greift der localStorage-Fallback. Wenn ein
    // anderer Tab localStorage schreibt, muss der lokale Tab die neue ID
    // im nächsten Render sehen — ausgelöst durch das `storage`-Event.
    const { stateRef, unmount } = render("/arbeitsplatz");
    expect(stateRef.current).toBeNull();

    // Schritt 1: simulierter Cross-Tab-Write in localStorage.
    localStorage.setItem(STORAGE_KEY, "tab-b-id");

    // Schritt 2: das `storage`-Event aus dem anderen Tab dispatchen.
    act(() => {
      window.dispatchEvent(
        new StorageEvent("storage", {
          key: STORAGE_KEY,
          newValue: "tab-b-id",
          oldValue: null,
          storageArea: localStorage,
        })
      );
    });

    // Der Re-Render hat `readStored()` neu ausgewertet — Fallback aktiv.
    expect(stateRef.current).toBe("tab-b-id");
    unmount();
  });

  it("Cross-Tab · storage-Event überschreibt KEINE vorhandene URL-mandantId (URL-primary unverletzt)", () => {
    // Mit URL-mandantId muss URL gewinnen, auch wenn ein anderer Tab
    // den localStorage-Wert ändert. Der Re-Render läuft, aber die
    // Auflösungs-Reihenfolge bleibt URL > Storage.
    const { stateRef, unmount } = render(
      "/arbeitsplatz?mandantId=url-keeps-winning"
    );
    expect(stateRef.current).toBe("url-keeps-winning");

    localStorage.setItem(STORAGE_KEY, "tab-b-id");
    act(() => {
      window.dispatchEvent(
        new StorageEvent("storage", {
          key: STORAGE_KEY,
          newValue: "tab-b-id",
          oldValue: null,
          storageArea: localStorage,
        })
      );
    });

    expect(stateRef.current).toBe("url-keeps-winning");
    unmount();
  });

  it("Cross-Tab · storage-Event mit fremdem Key wird ignoriert", () => {
    // Keys wie `harouda:arbeitsplatz-tree-expanded` dürfen den
    // MandantContext nicht beeinflussen. Wir prüfen das indirekt: nach
    // dem fremden Event darf weder Re-Render-Spy noch State sich auf
    // einen neuen Mandanten umstellen, obwohl ein fremder localStorage-
    // Key gesetzt wurde (der STORAGE_KEY bleibt leer).
    const { stateRef, unmount } = render("/arbeitsplatz");
    expect(stateRef.current).toBeNull();

    localStorage.setItem(
      "harouda:arbeitsplatz-tree-expanded",
      '{"einkommensteuer":false}'
    );
    // Sentinel: STORAGE_KEY bleibt absichtlich leer; ein versehentliches
    // Re-Read würde immer noch `null` ergeben. Wir prüfen primär, dass
    // der Handler den fremden Key nicht als Trigger akzeptiert.
    act(() => {
      window.dispatchEvent(
        new StorageEvent("storage", {
          key: "harouda:arbeitsplatz-tree-expanded",
          newValue: '{"einkommensteuer":false}',
          oldValue: null,
          storageArea: localStorage,
        })
      );
    });

    // State bleibt null — kein State-Drift durch fremden Key.
    expect(stateRef.current).toBeNull();
    // STORAGE_KEY ist nach wie vor leer.
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
    unmount();
  });

  it("Cross-Tab · storage-Event mit key=null (localStorage.clear() aus anderem Tab) löst Re-Read aus", () => {
    // `localStorage.clear()` in einem anderen Tab feuert ein
    // `storage`-Event mit key=null. Erwartet: der Provider akzeptiert
    // das als Trigger und liest neu — nach Clear ist STORAGE_KEY leer,
    // der State fällt auf null zurück, sofern keine URL-mandantId vorliegt.
    localStorage.setItem(STORAGE_KEY, "vorher-id");
    const { stateRef, unmount } = render("/arbeitsplatz");
    expect(stateRef.current).toBe("vorher-id");

    // Schritt 1: simulierter Clear im anderen Tab.
    localStorage.clear();

    // Schritt 2: Event mit key=null dispatchen (entspricht echtem
    // Browser-Verhalten bei `localStorage.clear()` aus anderem Tab).
    act(() => {
      window.dispatchEvent(
        new StorageEvent("storage", {
          key: null,
          newValue: null,
          oldValue: null,
          storageArea: localStorage,
        })
      );
    });

    expect(stateRef.current).toBeNull();
    unmount();
  });

  it("Cross-Tab · Listener wird auf Unmount entfernt", () => {
    // Cleanup-Schutz: nach Unmount darf ein dispatched storage-Event
    // keinen State mehr ändern (Provider weg, Handler abgemeldet).
    // Der Test ist absichtlich konservativ: er prüft, dass kein Fehler
    // entsteht und stateRef nach Unmount nicht weiter manipuliert wird.
    const { stateRef, unmount } = render("/arbeitsplatz");
    unmount();

    // Nach Unmount darf ein Event-Dispatch nicht in einen abgemeldeten
    // Setter laufen (React würde sonst eine Warnung loggen). Der
    // Listener-Cleanup im useEffect garantiert das.
    expect(() => {
      window.dispatchEvent(
        new StorageEvent("storage", {
          key: STORAGE_KEY,
          newValue: "after-unmount",
          oldValue: null,
          storageArea: localStorage,
        })
      );
    }).not.toThrow();

    // stateRef-Snapshot vor unmount bleibt unverändert (kein Re-Render
    // nach unmount möglich).
    expect(stateRef.current).toBeNull();
  });
});
