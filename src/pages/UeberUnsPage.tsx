import {
  BookOpen,
  Code2,
  Compass,
  Scale,
  ShieldCheck,
  Users,
} from "lucide-react";
import PublicShell from "../components/PublicShell";
import "./InfoPages.css";

const VALUES = [
  {
    icon: Compass,
    title: "Ehrlich über Grenzen",
    body:
      "Wir sagen klar, was die App heute kann und wo Zertifizierungen, Bank-Lizenzen oder ERiC-Integrationen fehlen. Keine verdeckten Claims, keine simulierten Testate.",
  },
  {
    icon: ShieldCheck,
    title: "Datenhoheit bei Ihnen",
    body:
      "Im Demo-Modus laufen alle Berechnungen im Browser. In der produktiven Variante liegt die Datenbank bei Supabase in einer EU-Region mit Row Level Security pro Mandant.",
  },
  {
    icon: BookOpen,
    title: "Offene Dokumentation",
    body:
      "Tax-Parameter, EÜR-Zuordnungen und Format-Spezifikationen liegen offen im Repository. Prüfen ist ausdrücklich erwünscht; Pull-Requests mit korrigierten Werten willkommen.",
  },
  {
    icon: Code2,
    title: "Moderne Technik ohne Lock-in",
    body:
      "React + TypeScript + Vite auf dem Client, Supabase im Backend, quelloffene Bibliotheken durchgängig. Kein proprietäres SDK zwischen Ihnen und Ihren Daten.",
  },
];

export default function UeberUnsPage() {
  return (
    <PublicShell>
      <div className="container info">
        <header className="info__head">
          <span className="info__eyebrow">
            <Users size={14} />
            Über uns
          </span>
          <h1>Eine Werkbank für die digitale Kanzlei</h1>
          <p>
            harouda-app ist eine Referenz-Implementierung einer Kanzlei-
            Software für Steuerberater:innen. Sie zeigt in einer zusammen-
            hängenden Oberfläche, wie Journal, Offene Posten, Mahnwesen,
            Anlage EÜR, UStVA und Belegverwaltung ineinandergreifen — ohne
            Werbe-Claims, ohne Zertifikate, die wir nicht haben.
          </p>
        </header>

        <div className="info__grid">
          {VALUES.map(({ icon: Icon, title, body }) => (
            <article key={title} className="card info__card">
              <div className="info__card-icon">
                <Icon size={22} strokeWidth={1.75} />
              </div>
              <h3>{title}</h3>
              <p>{body}</p>
            </article>
          ))}
        </div>

        <aside className="info__note">
          <strong>Positionierung:</strong> harouda-app ist bewusst{" "}
          <em>kein</em> DATEV-Ersatz und <em>keine</em> zertifizierte
          ELSTER-Abgabesoftware. Die App ist als Kapazitäts-Demonstration
          und als Basis für Lizenzierungsgespräche mit Zertifizierungs-
          stellen und Behörden gedacht.{" "}
          <a href="/werkzeuge">
            Werkzeuge ansehen
          </a>{" "}
          oder{" "}
          <a href="/kontakt">Kontakt aufnehmen</a>.
        </aside>

        <section
          className="info__grid"
          style={{ marginTop: 48 }}
          aria-label="Projekt-Kennzahlen"
        >
          <article className="card info__card">
            <div className="info__card-icon">
              <Scale size={22} strokeWidth={1.75} />
            </div>
            <h3>Rechtlicher Rahmen</h3>
            <ul>
              <li>§ 4 Abs. 3 EStG — EÜR</li>
              <li>§§ 147, 150 AO — Aufbewahrung & Abgabe</li>
              <li>§ 288 BGB — Verzugszinsen</li>
              <li>§ 14 UStG — E-Rechnung ab 2025</li>
              <li>GoBD-Schreiben BMF 28.11.2019</li>
            </ul>
          </article>
          <article className="card info__card">
            <div className="info__card-icon">
              <Code2 size={22} strokeWidth={1.75} />
            </div>
            <h3>Offene Technologie</h3>
            <ul>
              <li>React 19, TypeScript, Vite</li>
              <li>Supabase (Auth, Postgres, Storage)</li>
              <li>SKR03-Kontenplan (~150 Konten)</li>
              <li>Tesseract.js + pdfjs-dist für OCR</li>
              <li>Alle Pakete MIT / Apache / ISC</li>
            </ul>
          </article>
          <article className="card info__card">
            <div className="info__card-icon">
              <ShieldCheck size={22} strokeWidth={1.75} />
            </div>
            <h3>Audit-Spur</h3>
            <ul>
              <li>Hash-verketteter Log (SHA-256)</li>
              <li>Version pro Buchung</li>
              <li>GDPdU-/IDEA-Export</li>
              <li>Form-Meta-Badges mit Versionspin</li>
              <li>Verfahrensdokumentations-Vorlage</li>
            </ul>
          </article>
        </section>
      </div>
    </PublicShell>
  );
}
