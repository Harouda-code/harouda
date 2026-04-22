import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { UserProvider } from "./contexts/UserContext";
import { CompanyProvider } from "./contexts/CompanyContext";
// MandantProvider wird seit dem F42-Refactor innerhalb von <App/> (unter
// <Router>) gemountet — siehe src/App.tsx. `useSearchParams` braucht
// den Router-Context, und der wird erst dort verfügbar.
import { SettingsProvider } from "./contexts/SettingsContext";
import { YearProvider } from "./contexts/YearContext";
import { PrivacyProvider } from "./contexts/PrivacyContext";
import {
  CookieConsentProvider,
  hasStoredConsent,
} from "./contexts/CookieConsentContext";
import { CookieConsent } from "./components/privacy/CookieConsent";
import { autoSeedDemoIfNeeded } from "./api/demoSeed";
import { migrateEstFormsV1ToV2 } from "./domain/est/estStorage";
import { DEMO_MODE } from "./api/supabase";
import { installGlobalErrorHandlers } from "./api/appLog";
import { initAnalytics } from "./utils/analyticsOptIn";
import { initSentry } from "./lib/monitoring/sentry";
import { ErrorBoundary } from "./components/ErrorBoundary";
import App from "./App";
import "./index.css";

initSentry();
installGlobalErrorHandlers();

// Analytics NUR, wenn BEIDES erfüllt ist:
//   1. Admin hat einen Analytics-Anbieter hinterlegt (technische Voraussetzung).
//   2. Die:der Nutzer:in hat explizit in den Cookie-Banner eingewilligt
//      (TTDSG § 25 — ohne Einwilligung keine nicht-essentiellen Cookies).
// Bei späterem Akzeptieren läd CookieConsentContext die Skripte nach, ohne
// Reload.
try {
  if (hasStoredConsent("analytics")) {
    const raw = localStorage.getItem("harouda:settings");
    if (raw) {
      const s = JSON.parse(raw) as {
        ga4MeasurementId?: string;
        plausibleDomain?: string;
      };
      initAnalytics({
        ga4MeasurementId: s.ga4MeasurementId,
        plausibleDomain: s.plausibleDomain,
      });
    }
  }
} catch {
  /* ignore */
}

if (DEMO_MODE) {
  void autoSeedDemoIfNeeded();
}

// Multi-Tenancy Phase 1 / Schritt 3b: Einmalige Migration der ESt-Form-
// localStorage-Keys auf das mandant-scoped Schema `harouda:est:<id>:<form>`.
// Wird hier VOR dem App-Render ausgeführt, damit beim ersten Render
// jeder Page bereits das mandant-scoped Schema verfügbar ist. Die
// Funktion ist idempotent (Flag-Check) und sicher, wenn kein
// selectedMandantId existiert (dann no-op, keine Daten verschoben).
// Siehe src/domain/est/estStorage.ts für die Semantik-Details.
try {
  migrateEstFormsV1ToV2();
} catch {
  /* Migration ist best-effort; Fehler darf App-Start nicht blockieren. */
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      refetchOnWindowFocus: false,
    },
  },
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ErrorBoundary level="page" context="root">
      <QueryClientProvider client={queryClient}>
        <UserProvider>
          <CompanyProvider>
            <YearProvider>
              <SettingsProvider>
                <PrivacyProvider>
                  <CookieConsentProvider>
                    <App />
                    <CookieConsent />
                    <Toaster
                      position="top-right"
                      richColors
                      closeButton
                      toastOptions={{
                        style: {
                          fontFamily: "var(--font-sans)",
                          borderRadius: "10px",
                        },
                      }}
                    />
                  </CookieConsentProvider>
                </PrivacyProvider>
              </SettingsProvider>
            </YearProvider>
          </CompanyProvider>
        </UserProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  </StrictMode>
);
