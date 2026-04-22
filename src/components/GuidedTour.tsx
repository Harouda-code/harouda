import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Sparkles,
  X,
} from "lucide-react";
import "./GuidedTour.css";

type Step = {
  title: string;
  body: string;
  bullets: string[];
  route?: string;
};

const STEPS: Step[] = [
  {
    title: "Willkommen bei harouda-app",
    body:
      "Eine Kapazitäts-Demonstration für eine Kanzlei-Software: Buchhaltung, Belege, OPOS & Mahnwesen, Steuerformulare. Dieser Rundgang zeigt in 7 Schritten die wichtigsten Bereiche. Alle Daten liegen lokal in Ihrem Browser — es wird nichts übertragen.",
    bullets: [
      "React + TypeScript · offline lauffähig",
      "15 Demo-Buchungen + SKR03-Kontenplan bereits vorgeladen",
      "Drei Beispiel-Mandanten (Schulz, Meyer, Roth) eingerichtet",
    ],
  },
  {
    title: "Dashboard",
    body:
      "Startpunkt mit KPIs pro Quartal: Umsatz, Ausgaben, Ergebnis und USt-Vorschau. Oben rechts der globale Geschäftsjahr-Schalter; links die Mandanten-Auswahl. Alle Ansichten filtern entsprechend.",
    bullets: [
      "KPIs rechnen aus dem Buchungsjournal",
      '„Letzte Buchungen" mit Soll/Haben-Drilldown',
      "USt-Zahllast für den laufenden Monat",
    ],
    route: "/dashboard",
  },
  {
    title: "Buchungsjournal",
    body:
      "Doppelte Buchführung mit Soll/Haben, USt, Skonto, Gegenseite, Fälligkeit. Neue Buchungen mit Strg+N. DATEV-CSV-Export (Standard-Buchungsstapel) und Beleg-ZIP.",
    bullets: [
      "Audit-Log mit Versionierung pro Buchung",
      "Eintrag über Gegenseite + Fälligkeit speist OPOS",
      "Tastatur: Strg+N neue Buchung · Esc schließen",
    ],
    route: "/journal",
  },
  {
    title: "Offene Posten & Mahnwesen",
    body:
      "Aus den Buchungen gegen Konten 1400 / 1600 abgeleitet. Aging 0–30/31–60/61–90/>90. Drei der Demo-Forderungen sind bewusst überfällig angelegt — probieren Sie den Mahnwesen-Link.",
    bullets: [
      "Automatische Mahnvorschläge nach Überfälligkeitstagen",
      "Verzugszinsen nach § 288 BGB + Mahngebühren",
      "PDF-Mahnung mit Kanzlei-Header + Bankverbindung",
    ],
    route: "/opos",
  },
  {
    title: "Buchführung: EÜR, Plausi, Mapping",
    body:
      "Die Einnahmenüberschussrechnung wird automatisch aus dem Journal abgeleitet (SKR03 → EÜR-Zeilen). Eigene Zuordnungen, Plausibilitäts-Checks und ELSTER-XML-Export möglich.",
    bullets: [
      "SKR03→EÜR-Zuordnungs-Editor",
      "Plausibilitätsprüfung (USt-Mismatch, Privatkonten, …)",
      "EÜR als PDF, Excel und ELSTER-XML",
    ],
    route: "/buchfuehrung",
  },
  {
    title: "Steuerformulare",
    body:
      "10 strukturierte Formulare: UStVA, EÜR, GewSt, KSt, Anlagen N/S/G/V/SO/AUS/Kind/Vorsorge/R/KAP. Jedes mit Versions-Badge, Hinweis auf Quelle und expliziter Entwurfs-/Bestätigungsstatus.",
    bullets: [
      "Automatisch aus Buchhaltung gespeiste Berechnungen",
      "Jahresversionierte Steuerparameter (2024/2025/2026)",
      "Kein Ersatz für zertifizierte Abgabesoftware",
    ],
    route: "/steuer",
  },
  {
    title: "Transparenz & Grenzen",
    body:
      "Diese App ist eine Kapazitäts-Demonstration. Der Audit-Log ist hash-verkettet; Formulare tragen Versions-Badges; ELSTER-XML-Dateien kennzeichnen sich selbst als eigener Aufbau. Eine echte ERiC-Abgabe, Bank-Anbindung (PSD2), GoBD-Zertifizierung oder DATEV-Zertifizierung sind nicht enthalten — und das ist auch gut so.",
    bullets: [
      "Audit-Log unter Einstellungen → Audit-Log prüfbar",
      "Quellennachweise in der FormMetaBadge jedes Formulars",
      "Verfahrensdokumentation-Vorlage in docs/",
    ],
  },
];

const STORAGE_KEY = "harouda:tour.completed";

export default function GuidedTour({
  autoStart = false,
}: {
  autoStart?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    if (!autoStart) return;
    try {
      if (localStorage.getItem(STORAGE_KEY) === "1") return;
    } catch {
      /* ignore */
    }
    const t = setTimeout(() => setOpen(true), 500);
    return () => clearTimeout(t);
  }, [autoStart]);

  // Expose a global opener so the landing page / a dashboard button can trigger
  useEffect(() => {
    // @ts-expect-error attach to window for manual restart
    window.__harouda_startTour = () => {
      setStep(0);
      setOpen(true);
    };
  }, []);

  function finish() {
    setOpen(false);
    try {
      localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      /* ignore */
    }
  }

  function goNext() {
    if (step >= STEPS.length - 1) {
      finish();
      return;
    }
    const next = step + 1;
    setStep(next);
    const route = STEPS[next].route;
    if (route) navigate(route);
  }

  function goPrev() {
    if (step === 0) return;
    const prev = step - 1;
    setStep(prev);
    const route = STEPS[prev].route;
    if (route) navigate(route);
  }

  if (!open) return null;

  const s = STEPS[step];
  const progress = ((step + 1) / STEPS.length) * 100;

  return (
    <div className="tour__backdrop" role="dialog" aria-modal="true">
      <div className="tour">
        <header className="tour__head">
          <span className="tour__eyebrow">
            <Sparkles size={12} />
            Rundgang · Schritt {step + 1} / {STEPS.length}
          </span>
          <button
            type="button"
            className="tour__close"
            onClick={finish}
            aria-label="Rundgang schließen"
          >
            <X size={18} />
          </button>
        </header>

        <div className="tour__progress">
          <span style={{ width: `${progress}%` }} />
        </div>

        <div className="tour__body">
          <h2>{s.title}</h2>
          <p>{s.body}</p>
          <ul>
            {s.bullets.map((b) => (
              <li key={b}>{b}</li>
            ))}
          </ul>
        </div>

        <footer className="tour__foot">
          <button
            type="button"
            className="btn btn-ghost"
            onClick={finish}
          >
            Überspringen
          </button>
          <div className="tour__nav">
            <button
              type="button"
              className="btn btn-outline"
              onClick={goPrev}
              disabled={step === 0}
            >
              <ArrowLeft size={16} />
              Zurück
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={goNext}
            >
              {step === STEPS.length - 1 ? (
                <>
                  <Check size={16} />
                  Beenden
                </>
              ) : (
                <>
                  Weiter
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
}
