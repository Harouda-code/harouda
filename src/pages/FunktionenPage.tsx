import {
  AlertTriangle,
  BadgeCheck,
  BarChart3,
  BookOpen,
  FileText,
  Landmark,
  ListOrdered,
  Receipt,
  ShieldCheck,
  Sparkles,
  Users,
  Wallet,
} from "lucide-react";
import PublicShell from "../components/PublicShell";
import "./InfoPages.css";

const GROUPS = [
  {
    icon: ListOrdered,
    title: "Buchungsjournal",
    body:
      "Doppelte Buchführung mit Soll/Haben. USt-Automatik, Skonto, Gegenseite, Fälligkeit. Audit-Trail je Zeile mit Version und Zeitstempel.",
    items: [
      "SKR03-Kontenplan (~150 Konten)",
      "DATEV-Standard-Buchungsstapel (CSV EXTF v700)",
      "Tastatur: Strg+N neue Buchung, Esc schließen",
    ],
  },
  {
    icon: Wallet,
    title: "Offene Posten & Mahnwesen",
    body:
      "Aus den Buchungen gegen 1400/1600 abgeleitete Forderungen und Verbindlichkeiten. Aging 0–30/31–60/61–90/>90. Dreistufiges Mahnwesen mit Verzugszinsen.",
    items: [
      "Mahnstufen Zahlungserinnerung / 1. / 2. Mahnung",
      "Verzugszinsen nach § 288 BGB (B2B oder B2C)",
      "PDF-Mahnung mit Kanzlei-Header",
    ],
  },
  {
    icon: BookOpen,
    title: "Einnahmenüberschussrechnung",
    body:
      "Die EÜR wird aus dem Journal über eine konfigurierbare SKR03→Zeilen-Zuordnung abgeleitet. Pro Zeile können die Quellkonten aufgeklappt werden.",
    items: [
      "Konten-Zuordnungs-Editor",
      "Plausibilitätsprüfung vor Abgabe",
      "PDF, Excel und ELSTER-XML-Export",
    ],
  },
  {
    icon: Receipt,
    title: "Steuerformulare",
    body:
      "10 Formulare mit jahres-versionierten Parametern: UStVA, GewSt, KSt, EÜR, Anlagen N/S/G/V/SO/AUS/Kind/Vorsorge/R/KAP. Jedes mit Form-Meta-Badge und Quellennachweis.",
    items: [
      "UStVA mit Kz. 81/86/48/66/83",
      "Anlage Kind mit Kindergeld + Betreuungskosten",
      "Anlage KAP mit Abgeltungsteuer & Sparerpauschbetrag",
    ],
  },
  {
    icon: BarChart3,
    title: "Auswertungen",
    body:
      "GuV, BWA, SuSa mit Periodenfilter, Mandantenfilter und Jahresumschaltung. Alle Berichte druckbar und exportierbar.",
    items: [
      "PDF-Export mit Kanzlei-Briefkopf",
      "Excel-Export mit Formeln",
      "Print-Stylesheet mit DEMO-Wasserzeichen",
    ],
  },
  {
    icon: FileText,
    title: "Belege & OCR",
    body:
      "Drag-and-Drop-Upload, Verknüpfung mit Journal-Einträgen, OCR über Tesseract.js (deu+eng) direkt im Browser. PDF-Rasterung mit pdfjs-dist.",
    items: [
      "PDF, JPG, PNG, WebP bis 10 MB",
      "Batch-OCR über mehrere Belege",
      "Aufbewahrungsfrist je Beleg sichtbar",
    ],
  },
  {
    icon: BadgeCheck,
    title: "E-Rechnung (ZUGFeRD / XRechnung)",
    body:
      "Einlesen eingebetteter Cross-Industry-Invoice-XML aus PDF/A-3 oder XRechnung-XML. Parteien, Positionen und Summen werden extrahiert und als Journal-Entwurf vorgeschlagen.",
    items: [
      "Factur-X / ZUGFeRD 1.x / 2.1+ / XRechnung",
      "Kopfdaten: Lieferant, Kunde, Fälligkeit, USt",
      "Positionen mit Einzel-/Nettopreis",
    ],
  },
  {
    icon: Landmark,
    title: "Bankimport",
    body:
      "MT940 (SWIFT) und CAMT.053 (ISO 20022) werden direkt aus der Datei gelesen. Keine PSD2-Anbindung — die Datei exportiert der Mandant selbst aus dem Online-Banking.",
    items: [
      "Aging von Eröffnung/Abschluss-Salden",
      "Automatische Kontenvorschläge",
      'Pro Transaktion „als Buchung anlegen"',
    ],
  },
  {
    icon: Users,
    title: "Mandanten & Mehrjahresansicht",
    body:
      "Beliebig viele Mandanten mit Stammdaten (USt-IdNr., IBAN, Steuernummer). Globaler Jahresfilter wirkt auf Dashboard, Journal, Reports und Formulare.",
    items: [
      "USt-ID-Prüfung via BZSt (Edge Function)",
      "Bank-Metadaten aus BLZ-Datei der Bundesbank",
      "Per-Mandant-Filter auf allen Ansichten",
    ],
  },
  {
    icon: ShieldCheck,
    title: "Audit & Aufbewahrung",
    body:
      "Hash-verketteter Audit-Log erkennt nachträgliche Manipulationen. Aufbewahrungsfristen nach § 147 AO (8 Jahre Buchungsbelege ab 2025) werden pro Beleg berechnet und angezeigt.",
    items: [
      "SHA-256-Kette pro Zeile",
      "Versionsfeld pro Buchung",
      "GDPdU-/IDEA-ZIP-Export für Betriebsprüfung",
    ],
  },
  {
    icon: AlertTriangle,
    title: "Fristenkalender",
    body:
      "UStVA, ZM, ESt-/GewSt-/KSt-Vorauszahlungen und Jahreserklärungen werden kalendarisch vorberechnet. Wochenend-Shift nach § 108 Abs. 3 AO wird angewandt.",
    items: [
      "Monatlich oder quartalsweise UStVA",
      "Optionale Dauerfristverlängerung",
      "Check-off-Status pro Termin",
    ],
  },
  {
    icon: Sparkles,
    title: "Transparenz-Werkzeuge",
    body:
      "Jedes Steuerformular zeigt Version, Veranlagungsjahr, Review-Status und Quellen. ELSTER-XML-Dateien tragen einen Kommentar mit Generator-Fingerprint.",
    items: [
      "Tax-Parameter 2024, 2025, 2026",
      "Per-Jahr-Changelog in docs/",
      "Form-Meta-Badge auf jedem Formular",
    ],
  },
];

export default function FunktionenPage() {
  return (
    <PublicShell>
      <div className="container info">
        <header className="info__head">
          <span className="info__eyebrow">
            <Sparkles size={14} />
            Funktionen
          </span>
          <h1>Was die App heute kann</h1>
          <p>
            Zwölf Module, die zusammenpassen. Alle Angaben aus dem aktuellen
            Build, ohne Marketing-Dekoration. Was bewusst nicht enthalten ist,
            finden Sie unter <a href="/werkzeuge">Werkzeuge</a> und{" "}
            <a href="/ueber-uns">Über uns</a>.
          </p>
        </header>

        <div className="info__grid">
          {GROUPS.map(({ icon: Icon, title, body, items }) => (
            <article key={title} className="card info__card">
              <div className="info__card-icon">
                <Icon size={22} strokeWidth={1.75} />
              </div>
              <h3>{title}</h3>
              <p>{body}</p>
              <ul>
                {items.map((i) => (
                  <li key={i}>{i}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>

        <aside className="info__note">
          <strong>Nicht enthalten (bewusst):</strong> ERiC-Direktabgabe,
          PSD2/Open-Banking, SEPA-Zahlungsausführung, Lohnbuchhaltung,
          DATEV-Online-Konnektor, qualifizierte eIDAS-Signaturen. Der Pfad
          zu diesen Features ist in der{" "}
          <code>docs/compliance-roadmap.md</code> beschrieben.
        </aside>
      </div>
    </PublicShell>
  );
}
