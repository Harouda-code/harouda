// Cookie-Consent gem. TTDSG § 25 + DSGVO Art. 7.
//
// Zustandsverwaltung für die Einwilligung zu nicht-essentiellen Cookies.
// Essentielle Technik (Session, Login, Sprache) gilt als berechtigtes
// Interesse nach § 25 Abs. 2 Nr. 2 TTDSG und wird IMMER geladen.
//
// Die tatsächliche Analytics-Integration liegt in main.tsx und in
// utils/analyticsOptIn.ts — dieser Kontext entscheidet nur, OB geladen
// werden darf. Reads aus localStorage erfolgen synchron, damit main.tsx
// die Einwilligung vor App-Start prüfen kann (kein Flash-of-Analytics).
//
// Naming: `CookieConsentContext`, weil `PrivacyContext` bereits für den
// Screen-Sharing-Blur-Modus vergeben ist.

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { initAnalytics, type AnalyticsSettings } from "../utils/analyticsOptIn";

export type ConsentCategory = "essential" | "analytics";

export type CookieConsent = {
  version: string;
  timestamp: string;
  categories: Record<ConsentCategory, boolean>;
};

export const POLICY_VERSION = "1";
export const STORAGE_KEY = "harouda:cookie_consent";
const SETTINGS_KEY = "harouda:settings";

type CookieConsentContextValue = {
  consent: CookieConsent | null;
  hasConsent: (cat: ConsentCategory) => boolean;
  /** Alle nicht-essentiellen Kategorien akzeptieren. */
  acceptAll: () => void;
  /** Nur essentielle Cookies laden. */
  acceptEssentialOnly: () => void;
  /** Einwilligung widerrufen — Banner erscheint beim nächsten Render erneut. */
  withdraw: () => void;
};

const CookieConsentContext = createContext<
  CookieConsentContextValue | undefined
>(undefined);

/** Synchron lesen. Gibt `null` zurück, wenn (noch) keine Einwilligung vorliegt
 * oder die gespeicherte Version nicht der aktuellen Policy entspricht. */
export function readStoredConsent(): CookieConsent | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CookieConsent;
    if (parsed.version !== POLICY_VERSION) return null;
    if (!parsed.categories || typeof parsed.categories.essential !== "boolean") {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

/** Hat der:die Nutzer:in der Kategorie zugestimmt? Für `main.tsx`-Gate
 * vor jedem Script-Injection. Essentielle Kategorie ist immer true. */
export function hasStoredConsent(cat: ConsentCategory): boolean {
  if (cat === "essential") return true;
  const c = readStoredConsent();
  return !!c && c.categories[cat] === true;
}

function writeStoredConsent(consent: CookieConsent): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(consent));
  } catch {
    /* ignore */
  }
}

function clearStoredConsent(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

function loadAnalyticsSettings(): AnalyticsSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return {};
    const s = JSON.parse(raw) as AnalyticsSettings;
    return {
      ga4MeasurementId: s.ga4MeasurementId,
      plausibleDomain: s.plausibleDomain,
    };
  } catch {
    return {};
  }
}

export function CookieConsentProvider({ children }: { children: ReactNode }) {
  const [consent, setConsent] = useState<CookieConsent | null>(() =>
    readStoredConsent()
  );

  const persist = useCallback(
    (categories: Record<ConsentCategory, boolean>) => {
      const next: CookieConsent = {
        version: POLICY_VERSION,
        timestamp: new Date().toISOString(),
        categories,
      };
      writeStoredConsent(next);
      setConsent(next);
    },
    []
  );

  const acceptAll = useCallback(() => {
    persist({ essential: true, analytics: true });
  }, [persist]);

  const acceptEssentialOnly = useCallback(() => {
    persist({ essential: true, analytics: false });
  }, [persist]);

  const withdraw = useCallback(() => {
    clearStoredConsent();
    setConsent(null);
  }, []);

  const hasConsent = useCallback(
    (cat: ConsentCategory): boolean => {
      if (cat === "essential") return true;
      return !!consent && consent.categories[cat] === true;
    },
    [consent]
  );

  // Analytics NACH erteilter Einwilligung nachladen.
  // main.tsx macht den initialen Gate (Page-Load); dieser Effect sorgt
  // dafür, dass ein späteres "Alle akzeptieren" Klicken sofort greift,
  // ohne Reload.
  useEffect(() => {
    if (hasConsent("analytics")) {
      initAnalytics(loadAnalyticsSettings());
    }
  }, [hasConsent]);

  const value = useMemo<CookieConsentContextValue>(
    () => ({ consent, hasConsent, acceptAll, acceptEssentialOnly, withdraw }),
    [consent, hasConsent, acceptAll, acceptEssentialOnly, withdraw]
  );

  return (
    <CookieConsentContext.Provider value={value}>
      {children}
    </CookieConsentContext.Provider>
  );
}

export function useCookieConsent(): CookieConsentContextValue {
  const ctx = useContext(CookieConsentContext);
  if (!ctx) {
    throw new Error(
      "useCookieConsent must be used within CookieConsentProvider"
    );
  }
  return ctx;
}
