// ============================================================================
// SettingsContext · Cloud-backed via src/api/settings.ts
// (Charge 7, Aufgabe 4)
//
// Speicherung erfolgt jetzt in Supabase (Tabelle public.settings) bzw.
// in localStorage im DEMO-Modus oder bevor der User eingeloggt ist.
//
// Architektur-Prinzipien:
//   • Provider-Level Blocking: Children rendern erst, wenn Settings
//     geladen sind. Verhindert Flicker mit DEFAULTS und schuetzt
//     vor Berechnungen auf unvollstaendigen Daten.
//   • Debounced Save (500ms): updateSettings() aktualisiert React-State
//     sofort fuer responsive UI; saveSettings() zur API wird gebuendelt.
//   • Safe Migration: Bestehende localStorage-Settings werden EINMAL
//     in die DB synchronisiert; localStorage bleibt als Sicherheitsnetz
//     erhalten und wird per Flag markiert.
//   • Unmount-Flush: Pending Saves werden bei Unmount sofort ausgeloest,
//     damit kein Edit verloren geht.
//
// Rechtliche Grundlage:
//   • DSGVO Art. 32 (Sicherheit der Verarbeitung)
//   • DSGVO Art. 17 (Recht auf Loeschung) — via ON DELETE CASCADE in 0044
// ============================================================================

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { DEMO_MODE } from "../api/supabase";
import {
  fetchSettings,
  saveSettings,
  readPendingLocalStorageMigration,
  markLocalStorageMigrationComplete,
  type SettingsPayload,
} from "../api/settings";

export type Settings = {
  kanzleiName: string;
  kanzleiStrasse: string;
  kanzleiPlz: string;
  kanzleiOrt: string;
  kanzleiTelefon: string;
  kanzleiEmail: string;
  kanzleiIban: string;
  kanzleiBic: string;
  defaultSteuernummer: string;
  elsterBeraterNr: string;
  kleinunternehmer: boolean;
  /** Mahnwesen: Basiszinssatz in Prozent (schwankend, halbjaehrlich). */
  basiszinssatzPct: number;
  /** B2B (+9 Prozentpunkte) oder B2C (+5). § 288 BGB. */
  verzugszinsenB2B: boolean;
  /** Mahngebuehr pro Stufe in Euro. */
  mahngebuehrStufe1: number;
  mahngebuehrStufe2: number;
  mahngebuehrStufe3: number;
  /** Minimaler Verzugstage-Schwellenwert pro Stufe. */
  stufe1AbTagen: number;
  stufe2AbTagen: number;
  stufe3AbTagen: number;
  /** Auto-Festschreibung: Stunden nach Buchungszeitpunkt, ab denen
   *  gebuchte Eintraege nur noch ueber Storno geaendert werden koennen.
   *  0 = sofort, Default 24. */
  gebuchtLockAfterHours: number;
  /** GL-Konten fuer Lohn-Buchungen (SKR03-Defaults). */
  lohnKontoPersonalkosten: string;
  lohnKontoSvAgAufwand: string;
  lohnKontoLstVerb: string;
  lohnKontoSvVerb: string;
  lohnKontoNettoVerb: string;
  /** Optional: vom Admin selbst angegebene GA4-Mess-ID ("G-XXXXXXXX"). */
  ga4MeasurementId: string;
  /** Optional: Plausible-Domain (z. B. "mein-domain.de"). Leer = kein Tracking. */
  plausibleDomain: string;
  /** Jahresabschluss-Sperre: Buchungen mit datum <= dieses Datums werden
   *  abgelehnt. Format ISO YYYY-MM-DD. Leer = keine Sperre. */
  periodClosedBefore: string;
};

const DEFAULTS: Settings = {
  kanzleiName: "Harouda Steuerberatung",
  kanzleiStrasse: "Musterstraße 1",
  kanzleiPlz: "12345",
  kanzleiOrt: "Berlin",
  kanzleiTelefon: "",
  kanzleiEmail: "",
  kanzleiIban: "",
  kanzleiBic: "",
  defaultSteuernummer: "",
  elsterBeraterNr: "",
  kleinunternehmer: false,
  basiszinssatzPct: 2.27,
  verzugszinsenB2B: true,
  mahngebuehrStufe1: 0,
  mahngebuehrStufe2: 5,
  mahngebuehrStufe3: 10,
  stufe1AbTagen: 7,
  stufe2AbTagen: 21,
  stufe3AbTagen: 45,
  gebuchtLockAfterHours: 24,
  // SKR03-Defaults. Bei SKR04 bitte im Settings anpassen.
  lohnKontoPersonalkosten: "4110",
  lohnKontoSvAgAufwand: "4130",
  lohnKontoLstVerb: "1741",
  lohnKontoSvVerb: "1742",
  lohnKontoNettoVerb: "1755",
  ga4MeasurementId: "",
  plausibleDomain: "",
  periodClosedBefore: "",
};

type SettingsContextValue = {
  settings: Settings;
  updateSettings: (next: Settings) => void;
  resetSettings: () => void;
};

const SettingsContext = createContext<SettingsContextValue | undefined>(
  undefined
);

const SAVE_DEBOUNCE_MS = 500;

function mergeWithDefaults(
  payload: SettingsPayload | null | undefined
): Settings {
  if (!payload) return DEFAULTS;
  return { ...DEFAULTS, ...(payload as Partial<Settings>) };
}

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(() => {
    // DEMO_MODE: synchroner Initial-State aus localStorage. Das matched
    // das urspruengliche Verhalten und entkoppelt Page-Tests vom Async-
    // Lifecycle des SettingsProvider. In Cloud-Mode bleibt es bei DEFAULTS,
    // bis fetchSettings() den DB-Stand liefert.
    if (DEMO_MODE) {
      try {
        const raw = localStorage.getItem("harouda:settings");
        if (raw) {
          return { ...DEFAULTS, ...(JSON.parse(raw) as Partial<Settings>) };
        }
      } catch {
        // Fall through zu DEFAULTS.
      }
    }
    return DEFAULTS;
  });
  // In DEMO_MODE ist der Initial-State bereits aus localStorage geladen —
  // kein Blocking noetig. In Cloud-Mode warten wir auf fetchSettings().
  const [loading, setLoading] = useState<boolean>(!DEMO_MODE);

  // Debounce-Infrastruktur
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingPayloadRef = useRef<Settings | null>(null);

  /** Fuehrt einen evtl. ausstehenden Save sofort aus (fire-and-forget). */
  function flushPendingSave(): void {
    if (saveTimeoutRef.current !== null) {
      clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = null;
    }
    const payload = pendingPayloadRef.current;
    pendingPayloadRef.current = null;
    if (payload) {
      // Bewusst nicht awaiten — wir akzeptieren fire-and-forget bei Unmount.
      saveSettings(payload).catch((err) => {
         
        console.error("[SettingsContext] flushPendingSave failed:", err);
      });
    }
  }

  // ----- Initial Load + One-Time-Migration --------------------------------
  useEffect(() => {
    let cancelled = false;

    async function load() {
      // Im DEMO-Modus ist der Initial-State synchron aus localStorage
      // gesetzt. Kein async-Load noetig, kein Blocking.
      if (DEMO_MODE) return;
      try {
        // 1) Eventuelle Migration aus localStorage in die DB synchronisieren.
        //    Nur im Cloud-Modus (nicht DEMO) und nur wenn noch nicht erfolgt.
        if (!DEMO_MODE) {
          const pending = readPendingLocalStorageMigration();
          if (pending) {
            try {
              await saveSettings(pending);
              markLocalStorageMigrationComplete();
            } catch (err) {
              // Migration nicht moeglich (z. B. nicht eingeloggt) — wir
              // lassen die Daten in localStorage und versuchen es spaeter.
               
              console.warn(
                "[SettingsContext] Migration aus localStorage zurueckgestellt:",
                err
              );
            }
          }
        }

        // 2) Aktuelle Settings laden.
        const remote = await fetchSettings();
        if (cancelled) return;
        setSettings(mergeWithDefaults(remote));
      } catch (err) {
         
        console.error("[SettingsContext] Initial load failed:", err);
        if (cancelled) return;
        setSettings(DEFAULTS);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, []);

  // ----- Unmount-Flush: pending Save vor Cleanup ausloesen ----------------
  useEffect(() => {
    return () => {
      flushPendingSave();
    };
  }, []);

  // ----- Update / Reset ----------------------------------------------------
  function scheduleSave(next: Settings): void {
    pendingPayloadRef.current = next;
    if (saveTimeoutRef.current !== null) {
      clearTimeout(saveTimeoutRef.current);
    }
    saveTimeoutRef.current = setTimeout(() => {
      saveTimeoutRef.current = null;
      const payload = pendingPayloadRef.current;
      pendingPayloadRef.current = null;
      if (!payload) return;
      saveSettings(payload).catch((err) => {
         
        console.error("[SettingsContext] saveSettings failed:", err);
      });
    }, SAVE_DEBOUNCE_MS);
  }

  function updateSettings(next: Settings): void {
    setSettings(next);
    scheduleSave(next);
  }

  function resetSettings(): void {
    setSettings(DEFAULTS);
    scheduleSave(DEFAULTS);
  }

  const value = useMemo<SettingsContextValue>(
    () => ({
      settings,
      updateSettings,
      resetSettings,
    }),
    [settings]
  );

  // ----- Provider-Level Blocking -------------------------------------------
  if (loading) {
    return (
      <div
        className="flex h-screen items-center justify-center text-muted-foreground"
        role="status"
        aria-live="polite"
      >
        Einstellungen werden geladen...
      </div>
    );
  }

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx)
    throw new Error("useSettings must be used within SettingsProvider");
  return ctx;
}
