// src/components/shell/PrivacyToggle.tsx
//
// Privacy-Modus-Schalter im AppShell-Topbar.
// Aus AppShell.tsx extrahiert (Phase 1, Schritt b/5).
//
// Schaltet die zentrale Privacy-Maskierung ueber usePrivacy()
// um (DSGVO-Hilfsfunktion fuer Bildschirmpraesentationen,
// Screenshots, Schulterblick-Schutz). Tastenkuerzel:
// Strg+Umschalt+P (wird zentral in AppShell behandelt).

import { Eye, EyeOff } from "lucide-react";
import { usePrivacy } from "../../contexts/PrivacyContext";

export function PrivacyToggle() {
  const { isPrivate, toggle } = usePrivacy();
  return (
    <button
      type="button"
      className="shell__dd-trigger"
      onClick={toggle}
      aria-pressed={isPrivate}
      title={
        isPrivate
          ? "Privacy-Modus deaktivieren (Strg+Umschalt+P)"
          : "Privacy-Modus aktivieren (Strg+Umschalt+P)"
      }
      aria-label={
        isPrivate ? "Privacy-Modus deaktivieren" : "Privacy-Modus aktivieren"
      }
      style={
        isPrivate
          ? {
              background: "var(--gold)",
              color: "var(--navy-900)",
              borderColor: "var(--gold)",
            }
          : undefined
      }
    >
      {isPrivate ? <EyeOff size={16} /> : <Eye size={16} />}
    </button>
  );
}
