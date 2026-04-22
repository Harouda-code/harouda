import { Link } from "react-router-dom";
import type { ComponentType } from "react";
import {
  ArrowRight,
  BookOpen,
  CalendarCheck,
  FileBarChart,
  ListChecks,
  ShieldCheck,
} from "lucide-react";
import "./TaxFormsPage.css";

type Card = {
  to: string;
  icon: ComponentType<{ size?: number; strokeWidth?: number }>;
  title: string;
  tag: string;
  description: string;
  bullets: string[];
};

const CARDS: Card[] = [
  {
    to: "/buchfuehrung/uebersicht",
    icon: CalendarCheck,
    title: "Jahresübersicht",
    tag: "Monatsvergleich",
    description:
      "Einnahmen, Ausgaben und Gewinn pro Monat für das gewählte Geschäftsjahr — Basis für EÜR und Steuererklärungen.",
    bullets: [
      "Monatliche Einnahmen / Ausgaben / Gewinn",
      "Drilldown zu einzelnen Buchungen",
      "Excel/PDF-Export",
    ],
  },
  {
    to: "/steuer/euer",
    icon: FileBarChart,
    title: "EÜR vorbereiten",
    tag: "Anlage EÜR",
    description:
      "Einnahmenüberschussrechnung nach § 4 Abs. 3 EStG — automatisch aus dem Buchungsjournal mit SKR03→EÜR-Zuordnung.",
    bullets: [
      "Alle Zeilen der Anlage EÜR (12, 23–47)",
      "Drilldown pro Konto",
      "PDF + Excel + ELSTER-XML-Export",
    ],
  },
  {
    to: "/buchfuehrung/zuordnung",
    icon: ListChecks,
    title: "Konten zuordnen",
    tag: "Mapping",
    description:
      "SKR03-Konten den EÜR-Zeilen zuordnen. Standardzuordnung wird durch eigene Regeln überschrieben — nützlich für Sonderkonten oder eigenen Wareneinkaufsfluss.",
    bullets: [
      "Überschreibungen pro Konto",
      "Standard-Mapping als Fallback",
      "Änderungen bleiben lokal gespeichert",
    ],
  },
  {
    to: "/buchfuehrung/plausi",
    icon: ShieldCheck,
    title: "Plausibilitätsprüfung",
    tag: "Validierung",
    description:
      "Automatische Prüfungen vor der Einreichung: nicht zugeordnete Konten, Privatentnahmen in EÜR, Mismatches zwischen Umsatz und USt.",
    bullets: [
      "Konten ohne EÜR-Zuordnung",
      "Privatkonten, die fälschlich in EÜR fließen",
      "USt-Plausibilität (Kz 81 ↔ Kz 14)",
    ],
  },
];

export default function BuchfuehrungIndexPage() {
  return (
    <div className="tax">
      <header className="tax__head">
        <h1
          style={{
            margin: "0 0 6px",
            fontSize: "clamp(1.5rem, 2vw + 0.6rem, 2rem)",
          }}
        >
          <BookOpen
            size={22}
            style={{ verticalAlign: "-3px", marginRight: 8 }}
          />
          Buchführung
        </h1>
        <p className="tax__lead">
          Zentrale Werkzeuge rund um Journal, Kontenplan und die
          Einnahmenüberschussrechnung. Das Journal bleibt die Datenquelle;
          hier werden die Daten geprüft, zugeordnet und für das Finanzamt
          aufbereitet.
        </p>
      </header>

      <div className="tax__grid">
        {CARDS.map(({ to, icon: Icon, title, tag, description, bullets }) => (
          <article key={to} className="card tax__card">
            <div className="tax__card-head">
              <span className="tax__icon">
                <Icon size={22} strokeWidth={1.75} />
              </span>
              <span className="tax__tag">{tag}</span>
            </div>
            <h2>{title}</h2>
            <p className="tax__desc">{description}</p>
            <ul className="tax__bullets">
              {bullets.map((b) => (
                <li key={b}>{b}</li>
              ))}
            </ul>
            <Link to={to} className="btn btn-primary">
              Öffnen <ArrowRight size={16} />
            </Link>
          </article>
        ))}
      </div>
    </div>
  );
}
