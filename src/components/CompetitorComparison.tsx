import { useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Check, Info, Minus, Scale, X } from "lucide-react";
import PublicShell from "../components/PublicShell";
import "../pages/InfoPages.css";
import "../pages/VergleichPage.css";
import "./CompetitorComparison.css";

export type ComparisonState = "ja" | "nein" | "teilweise" | "unbekannt";

export type ComparisonRow = {
  feature: string;
  /** harouda-app. */
  harouda: ComparisonState;
  hint?: string;
  /** Wert beim jeweiligen Mitbewerber. */
  competitor: ComparisonState;
  competitorHint?: string;
};

export type CompetitorComparisonProps = {
  /** Name des Mitbewerbers (reine Textreferenz, keine Logos). */
  competitorName: string;
  /** Kurze Einordnung, wer der Mitbewerber für Dritte ist. */
  competitorContext: string;
  /** Ehrliche Positionsbestimmung — was wir können, wo sie stärker sind. */
  intro: string;
  /** Vergleichszeilen. */
  rows: ComparisonRow[];
  /** Section "Wofür harouda-app die bessere Wahl ist". */
  prosHarouda: string[];
  /** Section "Wofür Sie lieber bei [Mitbewerber] bleiben". */
  prosCompetitor: string[];
  /** HTML-Pfad, z. B. "/alternative-zu-datev". */
  canonicalPath: string;
  /** Meta-Description (SEO). */
  metaDescription: string;
};

const STATE_LABEL: Record<ComparisonState, string> = {
  ja: "Ja",
  nein: "Nein",
  teilweise: "Teilweise",
  unbekannt: "k. A.",
};

function StateCell({ state, hint }: { state: ComparisonState; hint?: string }) {
  const cls =
    state === "ja"
      ? "is-yes"
      : state === "nein"
        ? "is-no"
        : state === "teilweise"
          ? "is-partial"
          : "is-unknown";
  const icon =
    state === "ja" ? (
      <Check size={13} />
    ) : state === "nein" ? (
      <X size={13} />
    ) : state === "teilweise" ? (
      <Minus size={13} />
    ) : (
      <Info size={13} />
    );
  return (
    <td className={`vergleich__cell ${cls}`}>
      <div className="vergleich__state">
        {icon}
        <span>{STATE_LABEL[state]}</span>
      </div>
      {hint && <div className="vergleich__note">{hint}</div>}
    </td>
  );
}

export function CompetitorComparison(props: CompetitorComparisonProps) {
  // JSON-LD + Titel-Metadaten beim Mount setzen.
  useEffect(() => {
    const previousTitle = document.title;
    document.title = `harouda-app im Vergleich zu ${props.competitorName}`;
    const meta =
      document.querySelector('meta[name="description"]') ??
      (() => {
        const m = document.createElement("meta");
        m.setAttribute("name", "description");
        document.head.appendChild(m);
        return m;
      })();
    const previousDesc = meta.getAttribute("content");
    meta.setAttribute("content", props.metaDescription);

    // JSON-LD
    const ld = {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      name: "harouda-app",
      applicationCategory: "FinanceApplication",
      operatingSystem: "Web Browser",
      description:
        "Buchhaltungs- und Steuer-Vorbereitungs-Software für deutsche " +
        "Kanzleien und KMU. EÜR, UStVA-Vorbereitung, E-Rechnung " +
        "(ZUGFeRD/XRechnung), DATEV-EXTF-Export.",
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "EUR",
        availability: "https://schema.org/InStock",
      },
    };
    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.text = JSON.stringify(ld);
    document.head.appendChild(script);

    // Canonical
    const canonical =
      document.querySelector('link[rel="canonical"]') ??
      (() => {
        const c = document.createElement("link");
        c.setAttribute("rel", "canonical");
        document.head.appendChild(c);
        return c;
      })();
    const previousCanonical = canonical.getAttribute("href");
    canonical.setAttribute(
      "href",
      typeof window !== "undefined"
        ? window.location.origin + props.canonicalPath
        : props.canonicalPath
    );

    return () => {
      document.title = previousTitle;
      if (previousDesc !== null) meta.setAttribute("content", previousDesc);
      script.remove();
      if (previousCanonical !== null)
        canonical.setAttribute("href", previousCanonical);
    };
  }, [props.competitorName, props.metaDescription, props.canonicalPath]);

  return (
    <PublicShell>
      <div className="container info competitor">
        <header className="info__head">
          <span className="info__eyebrow">
            <Scale size={14} />
            Alternative zu {props.competitorName}
          </span>
          <h1>harouda-app vs. {props.competitorName}</h1>
          <p>{props.competitorContext}</p>
        </header>

        <section className="card competitor__intro">
          <h2>Unsere ehrliche Einordnung</h2>
          <p>{props.intro}</p>
          <p>
            <strong>Kein Bashing.</strong> Die Vergleichstabelle zeigt
            Fakten aus öffentlichen Produktbeschreibungen (Stand April 2026).
            Wenn etwas falsch ist: schreiben Sie uns, wir korrigieren das.
          </p>
        </section>

        <section className="card competitor__table-section">
          <h2>Vergleichsmatrix</h2>
          <div className="vergleich__table-wrap">
            <table className="vergleich__table">
              <thead>
                <tr>
                  <th style={{ width: "40%" }}>Merkmal</th>
                  <th>harouda-app</th>
                  <th>{props.competitorName}</th>
                </tr>
              </thead>
              <tbody>
                {props.rows.map((r, i) => (
                  <tr key={i}>
                    <td className="vergleich__merkmal">{r.feature}</td>
                    <StateCell state={r.harouda} hint={r.hint} />
                    <StateCell
                      state={r.competitor}
                      hint={r.competitorHint}
                    />
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <div className="competitor__pros">
          <section className="card competitor__pros-box">
            <h2>harouda-app ist die bessere Wahl, wenn …</h2>
            <ul>
              {props.prosHarouda.map((p, i) => (
                <li key={i}>{p}</li>
              ))}
            </ul>
            <Link to="/login" className="btn btn-primary">
              Kostenlos testen <ArrowRight size={14} />
            </Link>
          </section>

          <section className="card competitor__pros-box competitor__pros-box--alt">
            <h2>Sie sollten lieber bei {props.competitorName} bleiben, wenn …</h2>
            <ul>
              {props.prosCompetitor.map((p, i) => (
                <li key={i}>{p}</li>
              ))}
            </ul>
          </section>
        </div>

        <aside className="info__note competitor__legal">
          <strong>Hinweis zur vergleichenden Werbung (§ 6 UWG):</strong>
          {" "}Dieser Vergleich enthält objektiv überprüfbare Aussagen auf Basis
          öffentlich zugänglicher Produktbeschreibungen. {props.competitorName}{" "}
          ist eine geschützte Marke des jeweiligen Inhabers; hier wird
          lediglich in rein nomineller Weise darauf Bezug genommen. Keine
          Absicht zur Rufausbeutung, keine Verunglimpfung. Quellenhinweise
          auf Wunsch.
        </aside>
      </div>
    </PublicShell>
  );
}
