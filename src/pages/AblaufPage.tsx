import { Workflow } from "lucide-react";
import PublicShell from "../components/PublicShell";
import "./InfoPages.css";

const STEPS = [
  {
    title: "Mandant anlegen",
    body:
      "Unter Stammdaten → Mandanten wird das Unternehmen mit Mandantennummer, Name, Steuernummer, optional USt-IdNr. und IBAN angelegt. Die USt-IdNr. lässt sich später gegen den BZSt-evatr-Dienst prüfen.",
  },
  {
    title: "Kontenplan importieren oder übernehmen",
    body:
      'Einmalig „SKR03 importieren" im Kontenplan klicken. Rund 150 Standardkonten stehen dann zur Verfügung. Eigene Konten können ergänzt, deaktiviert oder gelöscht werden, solange keine Buchung daran hängt.',
  },
  {
    title: "Buchungen erfassen",
    body:
      "Im Journal entsteht jede Buchung mit Datum, Beleg-Nr., Soll- und Haben-Konto, Betrag, USt-Satz und optional Skonto sowie Gegenseite und Fälligkeit. Strg+N öffnet das Formular; Esc schließt. Audit-Einträge werden automatisch mit SHA-256-Hash an die Kette gehängt.",
  },
  {
    title: "Belege zuordnen",
    body:
      "Belege werden unter Dokumente drag-and-drop hochgeladen. Über die Journal-Seite können sie direkt an einzelne Buchungen geheftet werden. Für PDF-/Bild-Belege läuft OCR mit deu+eng direkt im Browser.",
  },
  {
    title: "Bankauszug einspielen",
    body:
      'Aus dem Online-Banking als MT940- oder CAMT.053-Datei exportieren, im Bankimport hochladen, Vorschläge prüfen und „Alle offenen übernehmen" — pro Zeile kann das Soll/Haben-Konto überschrieben werden.',
  },
  {
    title: "Monatsabschluss prüfen",
    body:
      "Über Buchführung → Plausibilitätsprüfung werden häufige Fallstricke erkannt: nicht zugeordnete Erfolgskonten, Privatbuchungen in der EÜR, USt-Mismatch zwischen Umsatz und vereinnahmter Steuer.",
  },
  {
    title: "UStVA abgeben",
    body:
      "Unter Steuerformulare → UStVA wird die Voranmeldung mit den Kennzahlen 81, 86, 48, 66 und 83 generiert. Der ELSTER-XML-Export kann ins ELSTER Online Portal geladen werden — eine direkte ERiC-Einreichung ist nicht Teil der Demo.",
  },
  {
    title: "Jahresabschluss & EÜR",
    body:
      "Am Jahresende zeigt die Anlage EÜR jede Zeile mit Drilldown auf die Quellkonten. Der ZIP-GDPdU-Export steht für Betriebsprüfungen bereit, inklusive Audit-Log als CSV.",
  },
  {
    title: "Mahnwesen laufen lassen",
    body:
      "Aus den offenen Posten schlägt Mahnwesen automatisch die passende Stufe vor (Zahlungserinnerung, 1. Mahnung, 2. Mahnung) mit Verzugszinsen nach § 288 BGB und Mahngebühren laut Einstellungen.",
  },
  {
    title: "Archivieren",
    body:
      "Die Aufbewahrungsfristen-Übersicht zeigt je Beleg und je Buchung, wann die Frist nach § 147 AO endet (8 Jahre für Buchungsbelege ab 2025). Gelöscht wird manuell — dokumentiert im Audit-Log.",
  },
];

export default function AblaufPage() {
  return (
    <PublicShell>
      <div className="container info">
        <header className="info__head">
          <span className="info__eyebrow">
            <Workflow size={14} />
            Ablauf
          </span>
          <h1>Der Jahreslauf einer Mandantenbuchhaltung</h1>
          <p>
            Zehn Schritte von der Mandanten-Anlage bis zur Archivierung.
            Jeder Schritt referenziert einen realen Bereich der App — keine
            hypothetischen Workflows, keine verdeckten Annahmen.
          </p>
        </header>

        <ol className="info__steps">
          {STEPS.map((s) => (
            <li key={s.title} className="card info__step">
              <div>
                <h3>{s.title}</h3>
                <p>{s.body}</p>
              </div>
            </li>
          ))}
        </ol>

        <aside className="info__note">
          <strong>Zeitbezug:</strong> Der globale Geschäftsjahr-Schalter in
          der Kopfzeile ändert die Sicht auf Buchungen, Reports und
          Formulare; er wirkt nicht auf „aktuell-offen"-Ansichten wie
          Offene Posten oder Mahnwesen — dort zählt der echte Tag.
        </aside>
      </div>
    </PublicShell>
  );
}
