import { Wrench } from "lucide-react";
import PublicShell from "../components/PublicShell";
import "./InfoPages.css";

const CATEGORIES = [
  {
    title: "Im- und Export",
    items: [
      { name: "DATEV-Standard-Buchungsstapel (CSV EXTF v700)", status: "real" },
      { name: "DATEV-ATCH-ähnliches Beleg-ZIP mit document.xml", status: "real" },
      { name: "GDPdU/IDEA-Export mit index.xml + CSV", status: "real" },
      { name: "ELSTER-XML: UStVA", status: "real" },
      { name: "ELSTER-XML: EÜR", status: "real" },
      { name: "ERiC-Direktabgabe (ELSTER)", status: "nicht enthalten" },
    ],
  },
  {
    title: "E-Rechnung",
    items: [
      { name: "ZUGFeRD / Factur-X 1.x und 2.1+", status: "real" },
      { name: "XRechnung (CII und UBL)", status: "real" },
      { name: "Eingebettete CII-XML aus PDF/A-3 extrahieren", status: "real" },
      { name: "Ausgehende E-Rechnung erzeugen", status: "nicht enthalten" },
    ],
  },
  {
    title: "Bank-Datenaustausch",
    items: [
      { name: "MT940 (SWIFT)", status: "real" },
      { name: "CAMT.053 (ISO 20022 XML)", status: "real" },
      { name: "IBAN mod-97-Validierung", status: "real" },
      { name: "BLZ-/BIC-Lookup aus Bundesbank-Teilmenge", status: "real" },
      { name: "Open Banking / PSD2 / Aggregator", status: "nicht enthalten" },
    ],
  },
  {
    title: "Beleg- und Texterkennung",
    items: [
      { name: "OCR für Bilder (tesseract.js, deu+eng)", status: "real" },
      { name: "OCR für PDFs (pdfjs-dist-Rasterung)", status: "real" },
      { name: "Batch-OCR für mehrere Belege", status: "real" },
      { name: "Strukturierte Feldextraktion aus OCR", status: "nicht enthalten" },
    ],
  },
  {
    title: "Prüfungen & Audit",
    items: [
      { name: "Hash-verketteter Audit-Log (SHA-256)", status: "real" },
      { name: "Integritätsprüfung der Kette im UI", status: "real" },
      { name: "Plausibilitätsprüfung für EÜR-Vorbereitung", status: "real" },
      { name: "WORM-Speicher für Audit-Log", status: "nicht enthalten" },
      { name: "Qualifizierte elektronische Signatur (eIDAS)", status: "nicht enthalten" },
    ],
  },
  {
    title: "USt-ID-Prüfung",
    items: [
      { name: "BZSt evatr via Supabase Edge Function", status: "real" },
      { name: "Einzelabfrage und qualifizierte Abfrage", status: "real" },
    ],
  },
  {
    title: "Dokumente & Exports",
    items: [
      { name: "PDF-Berichte mit Kanzlei-Briefkopf", status: "real" },
      { name: "Excel-Export (exceljs)", status: "real" },
      { name: "Mahn-PDFs mit Bankverbindung", status: "real" },
      { name: "Print-Stylesheet mit DEMO-Wasserzeichen", status: "real" },
    ],
  },
];

export default function WerkzeugePage() {
  return (
    <PublicShell>
      <div className="container info">
        <header className="info__head">
          <span className="info__eyebrow">
            <Wrench size={14} />
            Werkzeuge
          </span>
          <h1>Formate, Schnittstellen, Werkzeuge</h1>
          <p>
            Was die App liest, schreibt und exportiert — und was bewusst
            außerhalb des Umfangs bleibt. Grüne Markierungen sind im Build
            vorhanden und testbar; graue Markierungen stehen im aktuellen
            Stand nicht bereit.
          </p>
        </header>

        <div className="werkzeuge__cats">
          {CATEGORIES.map((cat) => (
            <article key={cat.title} className="card werkzeuge__cat">
              <h3>{cat.title}</h3>
              <ul>
                {cat.items.map((it) => (
                  <li
                    key={it.name}
                    className={`werkzeuge__row is-${it.status.replace(/\s+/g, "-")}`}
                  >
                    <span>{it.name}</span>
                    <span className="werkzeuge__status">{it.status}</span>
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>

        <aside className="info__note">
          <strong>Format-Herkunft:</strong> Die DATEV-, ZUGFeRD-, CAMT-,
          MT940-, GDPdU- und ELSTER-Formate sind jeweils aus öffentlich
          dokumentierten Spezifikationen implementiert. Für produktive
          Verwendung gegenüber DATEV, Finanzverwaltung oder Bankenaggregatoren
          gilt der Lizenzierungspfad in{" "}
          <code>docs/compliance-roadmap.md</code>.
        </aside>
      </div>

      <style>{`
        .werkzeuge__cats {
          display: grid;
          gap: 18px;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
        }
        .werkzeuge__cat {
          padding: 20px 22px;
        }
        .werkzeuge__cat h3 {
          margin: 0 0 12px;
          font-family: var(--font-sans);
          font-size: 1.05rem;
          font-weight: 700;
          color: var(--navy);
        }
        .werkzeuge__cat ul {
          list-style: none;
          margin: 0;
          padding: 0;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .werkzeuge__row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 10px;
          padding: 8px 10px;
          border-radius: var(--radius-sm);
          background: var(--ivory-100);
          font-size: 0.88rem;
        }
        .werkzeuge__row.is-real {
          background: rgba(5, 150, 105, 0.08);
          color: var(--ink);
        }
        .werkzeuge__row.is-nicht-enthalten {
          opacity: 0.7;
          color: var(--muted);
        }
        .werkzeuge__status {
          font-size: 0.7rem;
          font-weight: 700;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          padding: 2px 10px;
          border-radius: 999px;
          background: var(--ivory-200);
          color: var(--muted);
        }
        .werkzeuge__row.is-real .werkzeuge__status {
          background: rgba(5, 150, 105, 0.16);
          color: var(--success);
        }
        .werkzeuge__row.is-nicht-enthalten .werkzeuge__status {
          background: var(--ivory-200);
          color: var(--muted);
        }
      `}</style>
    </PublicShell>
  );
}
