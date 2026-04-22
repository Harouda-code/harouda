import {
  CompetitorComparison,
  type ComparisonRow,
} from "../components/CompetitorComparison";

const ROWS: ComparisonRow[] = [
  {
    feature: "Rechnungsstellung (Ausgangsrechnungen)",
    harouda: "teilweise",
    hint: "XRechnung-Writer; kein Rechnungs-Designer",
    competitor: "ja",
    competitorHint: "Vollständiger Rechnungs-Editor",
  },
  {
    feature: "XRechnung & ZUGFeRD lesen",
    harouda: "ja",
    competitor: "ja",
  },
  {
    feature: "Automatische Belegerkennung (OCR)",
    harouda: "teilweise",
    hint: "Tesseract.js lokal",
    competitor: "ja",
    competitorHint: "Cloud-OCR integriert",
  },
  {
    feature: "Online-Banking per PSD2",
    harouda: "nein",
    hint: "CAMT.053/MT940/CSV-Import",
    competitor: "ja",
  },
  {
    feature: "SKR03/SKR04-Kontenplan",
    harouda: "ja",
    hint: "SKR03 enthalten, SKR04 konfigurierbar",
    competitor: "ja",
  },
  {
    feature: "EÜR / USt-Voranmeldung",
    harouda: "ja",
    hint: "XML-Export, kein ERiC",
    competitor: "ja",
    competitorHint: "mit Direktabgabe",
  },
  {
    feature: "DATEV-Export",
    harouda: "teilweise",
    hint: "shape-kompatible EXTF-CSV",
    competitor: "ja",
  },
  {
    feature: "Kassenbuch mit TSE",
    harouda: "nein",
    competitor: "ja",
  },
  {
    feature: "Audit-Log mit Hash-Kette",
    harouda: "ja",
    competitor: "unbekannt",
  },
  {
    feature: "Lokaler Betrieb ohne Cloud",
    harouda: "ja",
    hint: "DEMO_MODE läuft komplett im Browser",
    competitor: "nein",
    competitorHint: "SaaS-only",
  },
  {
    feature: "API & Integrationen",
    harouda: "nein",
    hint: "keine öffentliche API",
    competitor: "ja",
    competitorHint: "REST-API mit Webhooks",
  },
  {
    feature: "Preis",
    harouda: "ja",
    hint: "Demo kostenlos",
    competitor: "teilweise",
    competitorHint: "Abo ab ca. € 14/Monat",
  },
];

export default function AlternativeSevdeskPage() {
  return (
    <CompetitorComparison
      competitorName="SevDesk"
      canonicalPath="/sevdesk-alternative"
      metaDescription="SevDesk-Alternative mit lokalem Betrieb, Hash-verkettetem Audit-Log und transparenten Grenzen. Ehrlicher Feature-Vergleich."
      competitorContext="SevDesk ist eine SaaS-Buchhaltungs- und Rechnungslösung für KMU und Selbständige — Online-Banking-Integration, Rechnungs-Designer, Mobile-App."
      intro={
        "Wer ein vollständig cloudbasiertes Rundum-Paket mit Online-Banking " +
        "und OCR-Service sucht, ist bei SevDesk gut aufgehoben. harouda-app " +
        "geht in die entgegengesetzte Richtung: lokaler, transparenter, " +
        "mit Open-Source-Code und ohne dauerhafte Cloud-Abhängigkeit. Dafür " +
        "müssen Sie auf Shop-Connectoren, PSD2-Banking und Mobile-App " +
        "verzichten."
      }
      rows={ROWS}
      prosHarouda={[
        "Sie Daten lieber on-premise oder im eigenen Supabase-Projekt halten.",
        "Sie Hash-verkettete Audit-Logs als Compliance-Hebel brauchen.",
        "Sie SevDesk zu teuer finden oder nur einen Teil der Features nutzen.",
        "Sie ein Zweit-Tool für einen Steuerberater-Client suchen.",
      ]}
      prosCompetitor={[
        "Sie PSD2-Onlinebanking und automatischen Kontoabgleich erwarten.",
        "Sie einen eigenständigen Rechnungs-Designer und Mobile-App brauchen.",
        "Sie Shop-System-Anbindungen (WooCommerce, Shopify) automatisieren wollen.",
        "Sie eine kassierende TSE-Kasse betreiben.",
      ]}
    />
  );
}
