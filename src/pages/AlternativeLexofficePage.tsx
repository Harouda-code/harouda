import {
  CompetitorComparison,
  type ComparisonRow,
} from "../components/CompetitorComparison";

const ROWS: ComparisonRow[] = [
  {
    feature: "Automatische Belegerkennung (OCR)",
    harouda: "teilweise",
    hint: "Tesseract.js lokal",
    competitor: "ja",
    competitorHint: "Cloud-OCR",
  },
  {
    feature: "PSD2-Onlinebanking",
    harouda: "nein",
    competitor: "ja",
  },
  {
    feature: "Rechnungsvorlagen + Designer",
    harouda: "teilweise",
    hint: "nur XRechnung-XML-Writer",
    competitor: "ja",
  },
  {
    feature: "EÜR + UStVA",
    harouda: "ja",
    competitor: "ja",
  },
  {
    feature: "ELSTER-Direktübertragung",
    harouda: "nein",
    hint: "nur XML-Export",
    competitor: "ja",
  },
  {
    feature: "DATEV-Export",
    harouda: "teilweise",
    hint: "shape-kompatibel",
    competitor: "ja",
  },
  {
    feature: "Lohnabrechnung",
    harouda: "teilweise",
    hint: "Planungs-Tool, keine SV-Meldung",
    competitor: "teilweise",
    competitorHint: "über Zusatzmodul",
  },
  {
    feature: "Audit-Log mit Hash-Kette",
    harouda: "ja",
    competitor: "unbekannt",
  },
  {
    feature: "Mandanten-Management",
    harouda: "ja",
    competitor: "ja",
  },
  {
    feature: "Mobile App",
    harouda: "nein",
    hint: "responsiv im Browser, keine native App",
    competitor: "ja",
  },
  {
    feature: "Lokaler Betrieb ohne Cloud",
    harouda: "ja",
    competitor: "nein",
  },
  {
    feature: "Preis",
    harouda: "ja",
    hint: "Demo kostenlos",
    competitor: "teilweise",
    competitorHint: "Abo ab ca. € 8,90/Monat (Stand 2026)",
  },
];

export default function AlternativeLexofficePage() {
  return (
    <CompetitorComparison
      competitorName="Lexoffice"
      canonicalPath="/lexoffice-vs-harouda"
      metaDescription="Lexoffice im Vergleich zu harouda-app: was beide können, was jeweils fehlt. Ehrliche Matrix ohne Marketing-Versprechen."
      competitorContext="Lexoffice ist Haufe-X360's SaaS-Buchhaltung für Kleinunternehmer:innen und Freiberufler:innen — Fokus auf Einfachheit, Banking-Anbindung und Mobile-App."
      intro={
        "Lexoffice ist auf schnellen Einstieg optimiert — Banking verbunden, " +
        "Beleg fotografieren, fertig. harouda-app ist bewusst anders: lokaler " +
        "Betrieb, Hash-Ketten-Audit, kein Cloud-Zwang, kein Vendor-Lock. " +
        "Wenn Sie keine Mobile-App und kein PSD2-Banking brauchen, könnte " +
        "der Tausch Sinn ergeben."
      }
      rows={ROWS}
      prosHarouda={[
        "Sie wollen Ihre Buchhaltung lokal oder in Ihrer eigenen Supabase-Instanz halten.",
        "Sie legen Wert auf GoBD-orientierte Hash-Ketten statt nur auf Komfort.",
        "Sie haben monatlich weniger als 100 Belege und zahlen ungern für Features, die Sie nicht nutzen.",
        "Sie brauchen einen DATEV-Export für die Steuerberater-Übergabe.",
      ]}
      prosCompetitor={[
        "Sie wollen Beleg-Foto machen, und automatische Erkennung + Buchung ist Ihnen wichtig.",
        "Sie brauchen ELSTER-Direktübertragung ohne Umweg über das Portal.",
        "Sie arbeiten viel mobil und wollen eine native App.",
        "Ihr Banking soll automatisch abgerufen werden (PSD2).",
      ]}
    />
  );
}
