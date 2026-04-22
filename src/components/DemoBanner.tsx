import { X } from "lucide-react";
import { useEffect, useState } from "react";
import "./DemoBanner.css";

const STORAGE_KEY = "harouda:demoBanner.dismissed";

/**
 * Sichtbarer Hinweis auf die Demo-Version. Bleibt auf allen Seiten oben
 * über dem App-Shell stehen und ist dismissbar. Zusätzlich erscheint
 * auf Druckansichten ein Wasserzeichen via CSS.
 */
export default function DemoBanner() {
  const [visible, setVisible] = useState<boolean>(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) !== "1";
    } catch {
      return true;
    }
  });

  useEffect(() => {
    document.body.classList.add("is-demo");
    return () => {
      document.body.classList.remove("is-demo");
    };
  }, []);

  if (!visible) return null;

  function restartTour() {
    try {
      localStorage.removeItem("harouda:tour.completed");
    } catch {
      /* ignore */
    }
    const fn = (window as unknown as { __harouda_startTour?: () => void })
      .__harouda_startTour;
    if (fn) fn();
  }

  return (
    <div className="demobanner" role="region" aria-label="Demo-Hinweis">
      <strong className="demobanner__badge">DEMO-VERSION</strong>
      <span className="demobanner__text">
        Kapazitäts-Demonstration · nicht zur produktiven Nutzung · alle Daten
        liegen lokal im Browser · keine Verbindung zu Finanzamt, Bank oder
        Supabase.
      </span>
      <button
        type="button"
        className="demobanner__tour"
        onClick={restartTour}
      >
        Rundgang starten
      </button>
      <button
        type="button"
        className="demobanner__close"
        onClick={() => {
          setVisible(false);
          try {
            localStorage.setItem(STORAGE_KEY, "1");
          } catch {
            /* storage full — ignore */
          }
        }}
        aria-label="Hinweis schließen"
      >
        <X size={14} />
      </button>
    </div>
  );
}
