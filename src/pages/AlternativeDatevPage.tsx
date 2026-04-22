import {
  CompetitorComparison,
  type ComparisonRow,
} from "../components/CompetitorComparison";

const ROWS: ComparisonRow[] = [
  {
    feature: "EXTF-Buchungsstapel (CSV)",
    harouda: "teilweise",
    hint: "shape-kompatibel, nicht zertifiziert",
    competitor: "ja",
    competitorHint: "nativ + zertifiziert",
  },
  {
    feature: "DATEV-Zertifikat",
    harouda: "nein",
    hint: "nicht lizenziert",
    competitor: "ja",
    competitorHint: "Hersteller selbst",
  },
  {
    feature: "ELSTER-Direktabgabe (ERiC)",
    harouda: "nein",
    hint: "nur XML-Export zum manuellen Upload",
    competitor: "ja",
    competitorHint: "integriert in Desktop-Clients",
  },
  {
    feature: "Lohnbuchhaltung mit DEÜV",
    harouda: "nein",
    hint: "bewusst außerhalb des Umfangs",
    competitor: "ja",
    competitorHint: "DATEV Lodas / Lohn und Gehalt",
  },
  {
    feature: "Rechnungswesen / Kontenplan SKR03",
    harouda: "ja",
    competitor: "ja",
  },
  {
    feature: "EÜR-Erstellung",
    harouda: "ja",
    competitor: "ja",
  },
  {
    feature: "Bilanz (HGB)",
    harouda: "nein",
    hint: "nur EÜR",
    competitor: "ja",
  },
  {
    feature: "ZUGFeRD / XRechnung lesen",
    harouda: "ja",
    competitor: "ja",
  },
  {
    feature: "XRechnung erzeugen",
    harouda: "ja",
    competitor: "ja",
  },
  {
    feature: "Beleg-OCR in Enterprise-Qualität",
    harouda: "teilweise",
    hint: "Tesseract.js-basiert, lokal im Browser",
    competitor: "ja",
    competitorHint: "DATEV Unternehmen online",
  },
  {
    feature: "Mandanten-Verwaltung",
    harouda: "ja",
    competitor: "ja",
  },
  {
    feature: "Audit-Log mit Hash-Kette",
    harouda: "ja",
    hint: "GoBD-orientiert, nicht zertifiziert",
    competitor: "unbekannt",
    competitorHint: "nicht öffentlich dokumentiert",
  },
  {
    feature: "Betriebsmodus: rein lokal / Browser",
    harouda: "ja",
    hint: "DEMO_MODE ohne Cloud",
    competitor: "nein",
    competitorHint: "DATEV-Cloud oder Desktop",
  },
  {
    feature: "Preis",
    harouda: "ja",
    hint: "Demo kostenlos",
    competitor: "teilweise",
    competitorHint: "lizenzpflichtig, je nach Modul",
  },
];

export default function AlternativeDatevPage() {
  return (
    <CompetitorComparison
      competitorName="DATEV"
      canonicalPath="/alternative-zu-datev"
      metaDescription="harouda-app als DATEV-Alternative: ehrlicher Funktionsvergleich, keine Schönfärberei. Was DATEV besser kann, was harouda-app einfacher macht."
      competitorContext="DATEV eG ist Marktführer für Kanzlei- und Unternehmenssoftware in Deutschland — seit 1966, genossenschaftlich organisiert, tief integriert mit der Finanzverwaltung."
      intro={
        "harouda-app ist kein Ersatz für eine DATEV-Vollinstallation in einer " +
        "großen Kanzlei. Was es aber kann: kleinen Teams einen sauberen, " +
        "lokalen Buchhaltungs-Workflow bieten, der sich per DATEV-EXTF-CSV " +
        "für die Weiterverarbeitung in Ihrer Haupt-DATEV-Installation " +
        "übergeben lässt. Keine Zertifizierung, keine ERiC-Direkteinreichung, " +
        "keine Lohnbuchhaltung."
      }
      rows={ROWS}
      prosHarouda={[
        "Sie nur wenige hundert Buchungen pro Jahr haben und keine DATEV-Lizenz rechtfertigen wollen.",
        "Sie einen lokalen, browserbasierten Workflow ohne Cloud-Zwang bevorzugen.",
        "Sie transparente Open-Source-Implementierung mit Hash-Ketten-Audit-Log wollen.",
        "Sie als Steuerberater:in ein Zweit-Tool für Klient:innen suchen, die selbst buchen.",
      ]}
      prosCompetitor={[
        "Sie bereits mit DATEV Unternehmen online oder Kanzlei-Rechnungswesen arbeiten.",
        "Sie Lohnbuchhaltung inkl. DEÜV-Meldungen brauchen.",
        "Sie ELSTER-Direktabgabe via ERiC benötigen (wir liefern nur XML-Export).",
        "Sie Bilanzierung nach HGB / § 266 HGB betreiben.",
      ]}
    />
  );
}
