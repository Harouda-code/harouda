// Aktiver Mandant — URL-primary, localStorage-Fallback.
//
// F42-Refactor (Sprint-Schritt 2 von 6): der aktive Mandant wird nicht
// mehr in React-State gehalten, sondern direkt aus der URL-Query
// `?mandantId=<id>` abgeleitet. `localStorage["harouda:selectedMandantId"]`
// dient als Fallback für
//   (a) den ersten Render nach Login, bevor die URL eine Query trägt,
//   (b) die Wiederherstellung der letzten Session (Demo-Seed,
//       api/backup.ts), und
//   (c) Seiten, die aktuell keinen Router-Wechsel mitgeben (die restlichen
//       16 Read-only-Konsumenten sollen unverändert weiterlaufen).
//
// Konsistenz-Regel: Wenn URL und localStorage unterschiedliche Werte
// halten, GEWINNT die URL beim Lesen. localStorage wird erst beim
// nächsten `setSelectedMandantId`-Write synchronisiert — kein proaktiver
// Sync im Render, um Render-Side-Effects zu vermeiden.
//
// Public-API ist identisch zum State+localStorage-Vorgänger; sämtliche
// Konsumenten (AppShell, 16 Read-only-Pages, ClientsPage) bleiben in
// diesem Schritt unverändert.

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useSearchParams } from "react-router-dom";

const STORAGE_KEY = "harouda:selectedMandantId";
const QUERY_KEY = "mandantId";

type MandantContextValue = {
  selectedMandantId: string | null;
  setSelectedMandantId: (id: string | null) => void;
};

const MandantContext = createContext<MandantContextValue | undefined>(
  undefined
);

function readStored(): string | null {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    return v && v.length > 0 ? v : null;
  } catch {
    return null;
  }
}

export function MandantProvider({ children }: { children: ReactNode }) {
  // useSearchParams setzt voraus, dass dieser Provider INNERHALB eines
  // React-Router-Routers gemountet ist. Seit dem F42-Refactor wird
  // `<MandantProvider>` daher in `App.tsx` unterhalb von `<Router>`
  // montiert (nicht mehr in `main.tsx`).
  const [searchParams, setSearchParams] = useSearchParams();

  // Cross-Tab-Sync: ein `storage`-Event aus einem anderen Tab triggert
  // einen Re-Render dieses Providers, sodass `readStored()` unten den
  // neuen Wert sieht. Der Counter selbst hat keine semantische Bedeutung
  // — er dient ausschließlich als Re-Render-Auslöser. URL-primary bleibt
  // unverletzt: die Auflösungs-Reihenfolge unten liest weiter zuerst die
  // URL und fällt erst dann auf den Storage-Wert zurück. Der Handler
  // schreibt weder URL noch localStorage; unbekannte IDs werden hier
  // nicht validiert (das übernimmt nachgelagert die Page-Whitelist).
  const [, setStorageVersion] = useState(0);
  useEffect(() => {
    function onStorage(e: StorageEvent) {
      // STORAGE_KEY-Treffer ODER `null`-Key (=`localStorage.clear()` aus
      // anderem Tab) lösen einen Re-Render aus. Fremde Keys werden
      // ignoriert, damit andere Bereiche (z. B. `harouda:arbeitsplatz-
      // tree-expanded`) keinen unnötigen Re-Render erzwingen.
      if (e.key === STORAGE_KEY || e.key === null) {
        setStorageVersion((v) => v + 1);
      }
    }
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  const urlId = searchParams.get(QUERY_KEY);
  // localStorage wird pro Render frisch gelesen. Das ist bewusst: die
  // Fallback-Quelle ist eine "last-known"-Krücke, keine reaktive Source.
  // Zwischen-Renders während derselben Benutzer-Session ändert sich der
  // Wert nur durch setSelectedMandantId hier oder durch den Demo-Seed
  // einmalig beim App-Start — beides vor dem Mount der Konsumenten.
  // Seit dem Cross-Tab-Sync-Patch wird `readStored()` außerdem nach
  // jedem qualifizierten `storage`-Event neu ausgewertet (s. useEffect
  // oben).
  const storedId = readStored();

  const selectedMandantId: string | null =
    urlId && urlId.length > 0 ? urlId : storedId;

  const setSelectedMandantId = useCallback(
    (id: string | null) => {
      // No-op bei identischem Wert (Spec-Regel: kein setSearchParams,
      // kein localStorage-Write). "Identisch" bezieht sich auf den
      // tatsächlich aktiven Wert, den `useMandant` nach außen liefert.
      if (selectedMandantId === id) return;

      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          if (id) next.set(QUERY_KEY, id);
          else next.delete(QUERY_KEY);
          return next;
        },
        { replace: true }
      );

      try {
        if (id) localStorage.setItem(STORAGE_KEY, id);
        else localStorage.removeItem(STORAGE_KEY);
      } catch {
        /* ignore — Fallback-Persistenz ist best-effort */
      }
    },
    [selectedMandantId, setSearchParams]
  );

  const value = useMemo<MandantContextValue>(
    () => ({ selectedMandantId, setSelectedMandantId }),
    [selectedMandantId, setSelectedMandantId]
  );

  return (
    <MandantContext.Provider value={value}>{children}</MandantContext.Provider>
  );
}

export function useMandant() {
  const ctx = useContext(MandantContext);
  if (!ctx) throw new Error("useMandant must be used within MandantProvider");
  return ctx;
}
