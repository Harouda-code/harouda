// Cookie-Banner gem. TTDSG § 25.
//
// Erscheint, solange keine gültige Einwilligung gespeichert ist. Die
// Einwilligung wird in CookieConsentContext verwaltet. Bis eine Wahl
// getroffen wird, lädt main.tsx KEINE Analyse-Dienste — das ist die
// materielle Anforderung von § 25 TTDSG.

import { Cookie } from "lucide-react";
import { useCookieConsent } from "../../contexts/CookieConsentContext";
import "./CookieConsent.css";

// Der Banner wird in main.tsx GLOBAL eingehängt — als Geschwisterknoten von
// <App />, nicht innerhalb des <BrowserRouter>. Wir dürfen hier deshalb KEINE
// react-router-Primitive (<Link>, useNavigate …) verwenden: sie würden die
// Router-Context-Destrukturierung auslösen und zur Laufzeit crashen.
// Einfache <a>-Links sind bewusst gewählt — ein Full-Reload beim seltenen
// Klick auf "Datenschutz" / "Impressum" aus dem Einwilligungs-Banner ist
// unkritisch (Banner verschwindet ohnehin nach der Einwilligung).

export function CookieConsent() {
  const { consent, acceptAll, acceptEssentialOnly } = useCookieConsent();

  if (consent) return null;

  return (
    <div
      className="cookie-consent"
      role="dialog"
      aria-label="Cookie-Einwilligung"
      aria-modal="false"
    >
      <div className="cookie-consent__panel">
        <div className="cookie-consent__head">
          <Cookie size={20} aria-hidden="true" />
          <strong>Cookies &amp; Analyse-Dienste</strong>
        </div>

        <p className="cookie-consent__body">
          Diese Anwendung benötigt technisch notwendige Cookies für Login,
          Sitzung und Sprache (berechtigtes Interesse nach § 25 Abs. 2 Nr. 2
          TTDSG). Darüber hinaus kann der Kanzlei-Betreiber optionale
          Analyse-Dienste (Google Analytics 4, Plausible) einbinden.
        </p>

        <p className="cookie-consent__body cookie-consent__body--emph">
          Ohne Ihre Einwilligung werden <strong>keine</strong> Analyse-Dienste
          geladen (TTDSG § 25).
        </p>

        <div className="cookie-consent__actions">
          <button
            type="button"
            className="btn btn-primary"
            onClick={acceptAll}
            data-testid="cookie-consent-accept-all"
          >
            Alle akzeptieren
          </button>
          <button
            type="button"
            className="btn btn-ghost"
            onClick={acceptEssentialOnly}
            data-testid="cookie-consent-essential-only"
          >
            Nur essentielle
          </button>
        </div>

        <p className="cookie-consent__footer">
          <a href="/datenschutz">Datenschutzerklärung</a>
          <span aria-hidden="true"> · </span>
          <a href="/impressum">Impressum</a>
        </p>
      </div>
    </div>
  );
}
