import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

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
  /** Mahnwesen: Basiszinssatz in Prozent (schwankend, halbjährlich). */
  basiszinssatzPct: number;
  /** B2B (+9 Prozentpunkte) oder B2C (+5). § 288 BGB. */
  verzugszinsenB2B: boolean;
  /** Mahngebühr pro Stufe in Euro. */
  mahngebuehrStufe1: number;
  mahngebuehrStufe2: number;
  mahngebuehrStufe3: number;
  /** Minimaler Verzugstage-Schwellenwert pro Stufe. */
  stufe1AbTagen: number;
  stufe2AbTagen: number;
  stufe3AbTagen: number;
  /** Auto-Festschreibung: Stunden nach Buchungszeitpunkt, ab denen
   *  gebuchte Einträge nur noch über Storno geändert werden können.
   *  0 = sofort, Default 24. */
  gebuchtLockAfterHours: number;
  /** GL-Konten für Lohn-Buchungen (SKR03-Defaults). */
  lohnKontoPersonalkosten: string;
  lohnKontoSvAgAufwand: string;
  lohnKontoLstVerb: string;
  lohnKontoSvVerb: string;
  lohnKontoNettoVerb: string;
  /** Optional: vom Admin selbst angegebene GA4-Mess-ID ("G-XXXXXXXX").
   *  Wird beim Start injiziert. Leer = kein Tracking. */
  ga4MeasurementId: string;
  /** Optional: Plausible-Domain (z. B. "mein-domain.de"). Leer = kein Tracking. */
  plausibleDomain: string;
  /** Jahresabschluss-Sperre: Buchungen mit datum ≤ dieses Datums werden
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
  basiszinssatzPct: 2.27, // Stand 1.1.2025, prüfen
  verzugszinsenB2B: true,
  mahngebuehrStufe1: 0,
  mahngebuehrStufe2: 5,
  mahngebuehrStufe3: 10,
  stufe1AbTagen: 7,
  stufe2AbTagen: 21,
  stufe3AbTagen: 45,
  gebuchtLockAfterHours: 24,
  // SKR03-Defaults. Bei SKR04 bitte im Settings anpassen.
  lohnKontoPersonalkosten: "4110", // Gehälter
  lohnKontoSvAgAufwand: "4130", // Gesetzl. soz. Aufwendungen
  lohnKontoLstVerb: "1741", // Verbindl. aus Lohn- und Kirchensteuer
  lohnKontoSvVerb: "1742", // Verbindl. aus SV
  lohnKontoNettoVerb: "1755", // Verbindl. aus Lohn und Gehalt
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

const STORAGE_KEY = "harouda:settings";

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return DEFAULTS;
      return { ...DEFAULTS, ...(JSON.parse(raw) as Partial<Settings>) };
    } catch {
      return DEFAULTS;
    }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  }, [settings]);

  const value = useMemo<SettingsContextValue>(
    () => ({
      settings,
      updateSettings: (next) => setSettings(next),
      resetSettings: () => setSettings(DEFAULTS),
    }),
    [settings]
  );

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
