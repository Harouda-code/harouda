import { useMemo } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  BarChart3,
  FileCheck2,
  Landmark,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import PublicShell from "../components/PublicShell";
import { getLandingVariant, resolveLandingVariant } from "../utils/utmVariants";
import "./LandingPage.css";

const FEATURES = [
  {
    icon: Landmark,
    title: "SKR03-Kontenplan & Journal",
    body:
      "Doppelte Buchführung mit Soll/Haben, Mandanten-Switch, Skonto, USt-Automatik. DATEV-kompatibler CSV-Export (EXTF v700) für den Austausch mit Kanzlei-Software.",
  },
  {
    icon: FileCheck2,
    title: "Steuerformulare & ELSTER-XML",
    body:
      "UStVA, EÜR, Anlagen N/S/G/V/SO/AUS/Kind/Vorsorge/R/KAP. XML-Export zum Import ins ELSTER Online Portal — die zertifizierte Direkteinreichung via ERiC ist nicht Teil der Demo.",
  },
  {
    icon: BarChart3,
    title: "Auswertungen aus dem Journal",
    body:
      "GuV, BWA, SuSa mit Periodenfilter, Mandantenfilter und Jahresumschaltung. Alle Berichte als PDF und Excel exportierbar.",
  },
  {
    icon: ShieldCheck,
    title: "Hash-verketteter Audit-Log",
    body:
      "Jede Änderung wird protokolliert und mit SHA-256 an den Vorgänger gekettet. Das macht Manipulation erkennbar — ein GoBD-Testat nach IDW PS 880 ist damit noch nicht erbracht und bleibt Prüferaufgabe.",
  },
];

export default function LandingPage() {
  // UTM-Parameter → Headline/CTA-Variante. Einmal pro Render auflösen;
  // resolveLandingVariant persistiert die Entscheidung für die Session.
  const variant = useMemo(() => {
    const key = resolveLandingVariant();
    return getLandingVariant(key);
  }, []);

  return (
    <PublicShell>
      <section className="landing__hero">
        <div className="container landing__hero-inner">
          <span className="landing__eyebrow">
            <Sparkles size={14} /> {variant.eyebrow}
          </span>

          <h1 className="landing__headline">
            {variant.headlineTop}
            <br />
            <em>{variant.headlineEm}</em>
          </h1>

          <p className="landing__lead">{variant.lead}</p>

          <div className="landing__cta">
            <Link to="/login" className="btn btn-primary btn-lg">
              {variant.primaryCtaLabel}
              <ArrowRight size={18} />
            </Link>
            <Link
              to={
                variant.secondaryCtaLabel.toLowerCase().includes("vergleich")
                  ? "/vergleich"
                  : "/funktionen"
              }
              className="btn btn-outline btn-lg"
            >
              {variant.secondaryCtaLabel}
            </Link>
          </div>

          <ul className="landing__trust" aria-label="Technische Eckdaten">
            <li>
              <strong>SKR03/04</strong>
              <span>DATEV-kompatibler Export</span>
            </li>
            <li>
              <strong>ELSTER-XML</strong>
              <span>UStVA & EÜR</span>
            </li>
            <li>
              <strong>ZUGFeRD</strong>
              <span>E-Rechnungs-Leser</span>
            </li>
            <li>
              <strong>MT940 / CAMT</strong>
              <span>Bank-Datei-Import</span>
            </li>
          </ul>
        </div>
      </section>

      <section className="landing__features">
        <div className="container">
          <div className="landing__section-head">
            <span className="landing__eyebrow landing__eyebrow--dark">
              Leistungsumfang
            </span>
            <h2>Alles, was eine Kanzlei im Alltag braucht.</h2>
            <p>
              Vom Buchungsbeleg bis zur USt-Voranmeldung — in einem System,
              ohne Medienbrüche. Was wir bewusst nicht sind: ein zertifizierter
              ERiC-Client und kein Ersatz für DATEV.
            </p>
          </div>

          <div className="landing__feature-grid">
            {FEATURES.map(({ icon: Icon, title, body }) => (
              <article key={title} className="landing__feature card">
                <div className="landing__feature-icon">
                  <Icon size={22} strokeWidth={1.75} />
                </div>
                <h3>{title}</h3>
                <p>{body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="landing__cta-band">
        <div className="container landing__cta-band-inner">
          <h2>Bereit für eine Probefahrt?</h2>
          <p>
            Die Demo läuft komplett im Browser. Keine Installation, keine
            Kreditkarte, keine Bindung.
          </p>
          <Link to="/login" className="btn btn-primary btn-lg">
            Zur Demo
            <ArrowRight size={18} />
          </Link>
        </div>
      </section>
    </PublicShell>
  );
}
