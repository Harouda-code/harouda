import { Link } from "react-router-dom";
import {
  ArrowRight,
  BarChart3,
  BookOpenCheck,
  Clock,
  FileText,
  ListTree,
  PieChart,
  Scale,
  TrendingUp,
  Upload,
} from "lucide-react";
import "./ReportsPage.css";

type ReportCard = {
  to: string;
  icon: typeof PieChart;
  tag: string;
  title: string;
  description: string;
  bullets: string[];
};

const PFLICHT: ReportCard[] = [
  {
    to: "/steuer/zm",
    icon: Clock,
    tag: "ZM",
    title: "Zusammenfassende Meldung (§ 18a UStG)",
    description:
      "Meldung grenzüberschreitender EU-Leistungen. Kz 41 / 21 / 42, USt-IdNr-Format-Validierung für ~27 EU-Staaten, Cross-Check gegen UStVA.",
    bullets: [
      "Monatlich oder quartalsweise (§ 18a Abs. 1)",
      "Abgabefrist 25. Tag des Folgemonats mit Wochenend-Rollover",
      "Pro Empfänger-USt-IdNr: Summen-Aggregation",
    ],
  },
  {
    to: "/steuer/euer",
    icon: FileText,
    tag: "EÜR",
    title: "Anlage EÜR (§ 4 Abs. 3 EStG)",
    description:
      "Einnahmen-Überschuss-Rechnung nach BMF-Vordruck 2025. Automatik für Bewirtung 70/30, Geschenke ≤/>50€, § 7g IAB. Kleinunternehmer-Umschalter.",
    bullets: [
      "~50 Kennzahlen, 5 Abschnitte (B–F)",
      "Bewirtung automatisch 70/30 auf Kz 175 + 228",
      "IAB § 7g mit Antrag / Hinzurechnung / Auflösung",
    ],
  },
  {
    to: "/steuer/ustva",
    icon: Clock,
    tag: "UStVA",
    title: "Umsatzsteuer-Voranmeldung (§ 18 UStG)",
    description:
      "BMF-Vordruck 2025 mit allen Kennzahlen (81, 86, 89, 93, 46-78, 66, 62, 67, 65). Monat oder Quartal, mit/ohne Dauerfrist, ELSTER-Shape XML-Preview.",
    bullets: [
      "Monat / Quartal · Dauerfristverlängerung +1 Monat",
      "Abgabefrist mit Wochenend-Rollover (§ 108 AO)",
      "XML-Preview für ERiC-kompatible Struktur",
    ],
  },
  {
    to: "/berichte/bilanz",
    icon: Scale,
    tag: "Bilanz",
    title: "Bilanz (HGB § 266)",
    description:
      "Aktiva-Passiva-Gegenüberstellung zum Stichtag. Nach HGB § 266 / § 267 / § 268, mit Wechselkonten-Reparenting und vorläufigem Jahresergebnis.",
    bullets: [
      "34 Aktiva + 21 Passiva Zeilen (§ 266)",
      "Grössenklasse KLEIN / MITTEL / GROSS (§ 267)",
      "Wechselkonten: Bank mit Negativ-Saldo auf P.C.2",
    ],
  },
  {
    to: "/berichte/guv",
    icon: PieChart,
    tag: "GuV",
    title: "Gewinn- und Verlustrechnung (HGB § 275)",
    description:
      "17 Posten nach Gesamtkostenverfahren (GKV), mit Zwischensummen (Betriebsergebnis, Finanzergebnis, Ergebnis vor/nach Steuern).",
    bullets: [
      "SKR03 → § 275 Posten disjoint gemappt",
      "Bilanz↔GuV Cross-Check (GoBD Rz. 58)",
      "Grössenklasse steuert Detailtiefe",
    ],
  },
  {
    to: "/berichte/jahresabschluss",
    icon: BookOpenCheck,
    tag: "JA",
    title: "Jahresabschluss (HGB § 242 Abs. 2)",
    description:
      "Kombinierte Darstellung von Bilanz und GuV mit automatischer Konsistenz-Prüfung. Zeigt Abweichungen sofort an.",
    bullets: [
      "Banner: Bilanz ≡ GuV ? — sonst detaillierte Fehlerliste",
      "Export der kompletten Abschluss-Daten als JSON",
      "Links zu Einzeldetails",
    ],
  },
];

const EXPORTE: ReportCard[] = [
  {
    to: "/export/datev",
    icon: Upload,
    tag: "DATEV",
    title: "DATEV Buchungsstapel (EXTF 510)",
    description:
      "CSV-Export aller Buchungen im gewählten Zeitraum im DATEV-Format für den Import in Unternehmen online oder Kanzlei-Rechnungswesen.",
    bullets: [
      "ISO-8859-1, Komma-Dezimal, CRLF",
      "Header + Spaltenköpfe + Buchungszeilen",
      "Validierung: Soll = Haben, doppelte Belege, out-of-range",
    ],
  },
];

const ANALYSEN: ReportCard[] = [
  {
    to: "/berichte/vorjahresvergleich",
    icon: TrendingUp,
    tag: "VJV",
    title: "Vorjahresvergleich (§ 265 Abs. 2 HGB)",
    description:
      "Bilanz und GuV aktuelles Jahr vs. Vorjahr mit absoluten und prozentualen Deltas, Trend-Indikatoren und Summary-Cards.",
    bullets: [
      "Tab-Umschaltung Bilanz / GuV / Übersicht",
      "Δ% mit sicherer Division (— bei Vorjahr = 0)",
      "Anzahl gestiegener / gefallener Positionen",
    ],
  },
  {
    to: "/berichte/bwa",
    icon: BarChart3,
    tag: "BWA",
    title: "BWA (DATEV Form 01)",
    description:
      "Monatliche Management-BWA mit Betriebsleistung, Rohertrag, Betriebsergebnis und vorläufigem Ergebnis sowie Kennzahlen (Rohertragsquote u. a.).",
    bullets: [
      "Monatswert + YTD in einer Tabelle",
      "Vergleichsperiode Vormonat / Vorjahr",
      "Kennzahlen: Roherträge, Personalkosten, Umsatzrendite",
    ],
  },
  {
    to: "/berichte/susa",
    icon: ListTree,
    tag: "SuSa",
    title: "Summen- und Saldenliste",
    description:
      "Prüfungstaugliche Aufstellung aller Sachkonten mit Soll-, Haben-Summen und Saldo. Basis fuer Bilanz und Jahresabschluss.",
    bullets: [
      "Alle bewegten Konten im gewählten Zeitraum",
      "Soll- und Haben-Saldo klar getrennt",
      "Kontrollsumme: Soll = Haben",
    ],
  },
];

function ReportGrid({ items }: { items: ReportCard[] }) {
  return (
    <div className="reports__grid">
      {items.map(({ to, icon: Icon, tag, title, description, bullets }) => (
        <article key={to} className="card reports__card">
          <div className="reports__card-head">
            <span className="reports__icon">
              <Icon size={22} strokeWidth={1.75} />
            </span>
            <span className="reports__tag">{tag}</span>
          </div>
          <h2>{title}</h2>
          <p className="reports__desc">{description}</p>
          <ul className="reports__bullets">
            {bullets.map((b) => (
              <li key={b}>{b}</li>
            ))}
          </ul>
          <Link to={to} className="btn btn-primary">
            Bericht öffnen <ArrowRight size={16} />
          </Link>
        </article>
      ))}
    </div>
  );
}

export default function ReportsPage() {
  return (
    <div className="reports">
      <header className="reports__head">
        <p className="reports__lead">
          Finanzauswertungen automatisch aus dem Buchungsjournal — mit
          Money-Präzision (decimal.js) und GoBD-konformer Cross-Check-Logik.
        </p>
      </header>

      <section style={{ marginBottom: 24 }}>
        <h2
          style={{
            fontSize: "0.88rem",
            fontWeight: 700,
            color: "var(--ink-soft)",
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            margin: "0 0 12px",
          }}
        >
          Pflichtberichte
        </h2>
        <ReportGrid items={PFLICHT} />
      </section>

      <section style={{ marginBottom: 24 }}>
        <h2
          style={{
            fontSize: "0.88rem",
            fontWeight: 700,
            color: "var(--ink-soft)",
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            margin: "0 0 12px",
          }}
        >
          Analysen
        </h2>
        <ReportGrid items={ANALYSEN} />
      </section>

      <section>
        <h2
          style={{
            fontSize: "0.88rem",
            fontWeight: 700,
            color: "var(--ink-soft)",
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            margin: "0 0 12px",
          }}
        >
          Exporte
        </h2>
        <ReportGrid items={EXPORTE} />
      </section>
    </div>
  );
}
