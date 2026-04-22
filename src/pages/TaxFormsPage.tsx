import { Link } from "react-router-dom";
import {
  ArrowRight,
  Baby,
  Building,
  Car,
  Coins,
  Download,
  FileText,
  Globe,
  HandHeart,
  HeartPulse,
  Home,
  Landmark,
  PiggyBank,
  Receipt,
  RotateCcw,
  Scale,
  Search,
  Upload,
  User,
  Users,
} from "lucide-react";
import { useMemo, useState, type ChangeEvent, type ComponentType } from "react";
import { toast } from "sonner";
import {
  FORM_CATEGORIES,
  categoryForPath,
  type FormCategoryId,
} from "../lib/steuerFormsCatalog";
import {
  clearAllTaxForms,
  exportTaxFormBackup,
  getFormProgress,
  importTaxFormBackup,
} from "../lib/formProgress";
import "./TaxFormsPage.css";

type FormCard = {
  to: string;
  icon: ComponentType<{ size?: number; strokeWidth?: number }>;
  title: string;
  tag: string;
  mode: "auto" | "calculator" | "input" | "auto-partial";
  description: string;
  bullets: string[];
  disabled?: boolean;
};

const MODE_LABEL: Record<FormCard["mode"], string> = {
  auto: "automatisch",
  calculator: "Rechner",
  input: "Eingabe",
  "auto-partial": "teilautomatisch",
};

const FORMS: FormCard[] = [
  {
    to: "/steuer/ustva",
    icon: Landmark,
    title: "Umsatzsteuer-Voranmeldung",
    tag: "UStVA",
    mode: "auto",
    description:
      "Kennzahlen 81/86/48/66/83 direkt aus dem Journal. ELSTER-XML-Export.",
    bullets: [
      "Automatische Ermittlung aller Kennzahlen",
      "Vorsteuer-Abgleich aus 1571/1576",
      "XML-Export zum Import ins ELSTER-Portal",
    ],
  },
  {
    to: "/steuer/euer",
    icon: FileText,
    title: "Einnahmenüberschussrechnung",
    tag: "EÜR",
    mode: "auto",
    description:
      "Anlage EÜR nach § 4 Abs. 3 EStG, automatisch aus dem Journal über die SKR03→Zeilen-Zuordnung.",
    bullets: [
      "Alle Zeilen der Anlage EÜR (12, 23–47, …)",
      "Pro Zeile: SKR03-Quellkonten drilldown",
      "PDF- und Excel-Export",
    ],
  },
  {
    to: "/steuer/gewerbesteuer",
    icon: Building,
    title: "Gewerbesteuer",
    tag: "GewSt",
    mode: "calculator",
    description:
      "Gewinn → Hinzurechnungen/Kürzungen → Gewerbeertrag × 3,5 % × Hebesatz.",
    bullets: [
      "Gewinn aus der EÜR übernommen oder manuell",
      "Freibetrag 24.500 € für natürliche Personen",
      "Beliebiger Hebesatz der Gemeinde",
    ],
  },
  {
    to: "/steuer/kst",
    icon: Scale,
    title: "Körperschaftsteuer",
    tag: "KSt",
    mode: "calculator",
    description:
      "GmbH, UG, AG: 15 % KSt + 5,5 % Soli + Gewerbesteuer-Schau für die Gesamtbelastung.",
    bullets: [
      "Einkommen nach § 7 KStG",
      "Hinzurechnungen § 8 KStG (nicht abzugsfähig)",
      "Gesamtbelastung KSt + Soli + GewSt",
    ],
  },
  {
    to: "/steuer/anlage-n",
    icon: Receipt,
    title: "Anlage N",
    tag: "Anlage N",
    mode: "input",
    description:
      "Einkünfte aus nichtselbständiger Arbeit mit Entfernungspauschale-Rechner und 2025er SV-Beitragsrechner.",
    bullets: [
      "Bruttolohn, Lohnsteuer, Soli, Kirchensteuer",
      "Werbungskosten + Entfernungspauschale",
      "Optional: Netto-vor-Steuer-Berechnung",
    ],
  },
  {
    to: "/steuer/anlage-s",
    icon: User,
    title: "Anlage S",
    tag: "Anlage S",
    mode: "input",
    description:
      "Einkünfte aus selbständiger (freiberuflicher) Arbeit nach § 18 EStG.",
    bullets: [
      "Strukturierte Erfassung der Betriebseinnahmen",
      "Absetzbare Betriebsausgaben",
      "Entwurf bleibt im Browser gespeichert",
    ],
  },
  {
    to: "/steuer/anlage-g",
    icon: Users,
    title: "Anlage G",
    tag: "Anlage G",
    mode: "input",
    description:
      "Einkünfte aus Gewerbebetrieb nach § 15 EStG. Ergänzt die Gewerbesteuererklärung.",
    bullets: [
      "Umsätze, Wareneinsatz, Fremdleistungen",
      "Betriebsausgaben nach Kategorien",
      "Gewinnermittlung für die Gewerbesteuer",
    ],
  },
  {
    to: "/steuer/anlage-v",
    icon: Home,
    title: "Anlage V",
    tag: "Anlage V",
    mode: "input",
    description:
      "Einkünfte aus Vermietung und Verpachtung nach § 21 EStG — je Objekt erfasst.",
    bullets: [
      "Beliebig viele Mietobjekte",
      "Einnahmen (Miete, Umlagen) + Werbungskosten (Zinsen, AfA, Reparatur, …)",
      "Summen pro Objekt + gesamt",
    ],
  },
  {
    to: "/steuer/anlage-so",
    icon: FileText,
    title: "Anlage SO",
    tag: "Anlage SO",
    mode: "input",
    description:
      "Sonstige Einkünfte nach § 22 EStG: Renten (nicht GRV), Unterhalt, private Veräußerungen.",
    bullets: [
      "Wiederkehrende Bezüge",
      "Leistungen (Freigrenze 256 €)",
      "Private Veräußerungsgeschäfte (§ 23)",
    ],
  },
  {
    to: "/steuer/anlage-aus",
    icon: Globe,
    title: "Anlage AUS",
    tag: "Anlage AUS",
    mode: "input",
    description:
      "Ausländische Einkünfte & Steuern (§§ 2a, 32b, 34c EStG · §§ 7–13, 15 AStG · § 50d). 10 Sektionen · 3-Staaten-Block.",
    bullets: [
      "3 Staaten / Spezial-Investmentfonds (Kz 107–155)",
      "CFC §§ 7–13 AStG + Familienstiftung § 15 AStG",
      "§ 2a Verlustausgleichsbeschränkung · DBA-Progression",
    ],
  },
  {
    to: "/steuer/anlage-kind",
    icon: Baby,
    title: "Anlage Kind",
    tag: "Anlage Kind",
    mode: "calculator",
    description:
      "Kinderfreibetrag, Kinderbetreuungskosten (§ 10 Abs. 1 Nr. 5) und Schulgeld (§ 10 Abs. 1 Nr. 9) — je Kind.",
    bullets: [
      "Kindergeld-Summe nach Monaten",
      "Betreuungskosten mit automatischer Höchstbetrag-Deckelung",
      "Schulgeld 30 %, max. 5.000 €/Kind",
    ],
  },
  {
    to: "/steuer/anlage-vorsorge",
    icon: HeartPulse,
    title: "Anlage Vorsorgeaufwand",
    tag: "Vorsorge",
    mode: "calculator",
    description:
      "Sonderausgabenabzug Versicherungsbeiträge und Altersvorsorge (§ 10 Abs. 1 Nr. 2/3/3a EStG).",
    bullets: [
      "Basisvorsorge mit Rürup-Höchstbetrag (2025: 29.344 €)",
      "Sonstige Vorsorge AN/selbständig getrennt",
      "KV/PV-Basisabsicherung ohne Höchstbetrag",
    ],
  },
  {
    to: "/steuer/anlage-r",
    icon: PiggyBank,
    title: "Anlage R",
    tag: "Anlage R",
    mode: "calculator",
    description:
      "Einkünfte aus Renten (§ 22 EStG). Besteuerungsanteil nach Kohortenprinzip automatisch ermittelt.",
    bullets: [
      "Pro Rente: Rentenbeginn, Art, Jahresbrutto",
      "Besteuerungsanteil 50 %–100 % lt. Rentenbeginn",
      "Werbungskostenpauschale 102 €",
    ],
  },
  {
    to: "/steuer/anlage-kap",
    icon: Coins,
    title: "Anlage KAP",
    tag: "Anlage KAP",
    mode: "calculator",
    description:
      "Einkünfte aus Kapitalvermögen (§ 20 EStG). Abgeltungsteuer 25 % + Soli; Verlusttöpfe Aktien / sonstige.",
    bullets: [
      "Zinsen, Dividenden, Fonds-Ausschüttungen",
      "Aktienverluste nur gegen Aktiengewinne (§ 20 Abs. 6)",
      "Anrechnung KESt + ausl. Quellensteuer",
    ],
  },
  {
    to: "/steuer/anlage-mobility",
    icon: Car,
    title: "Anlage Mobilitätsprämie",
    tag: "Mobilitätsprämie",
    mode: "input",
    description:
      "Antrag auf Festsetzung der Mobilitätsprämie (§§ 101–109 EStG) für Pendler:innen mit Einkommen unter dem Grundfreibetrag.",
    bullets: [
      "Person A + B (Zusammenveranlagung)",
      "Entfernungspauschale + Familienheimfahrten",
      "14 % der erhöhten Pauschale (ab km 21) — festgesetzt durch Finanzamt",
    ],
  },
  {
    to: "/steuer/anlage-v-sonstige",
    icon: Home,
    title: "Anlage V-Sonstige",
    tag: "V-Sonstige",
    mode: "input",
    description:
      "Beteiligungen an Grundstücksgemeinschaften / Immobilienfonds / Bauherrengemeinschaften sowie verschiedene Einkünfte aus V+V (§ 21 EStG).",
    bullets: [
      "Identifikation: Bezeichnung, Finanzamt, Steuernummer",
      "Untervermietung, unbebaute Grundstücke, Sachinbegriffe, Rechte",
      "Summe Kz 852/853 automatisch aus Z. 31–35",
    ],
  },
  {
    to: "/steuer/anlage-v-fewo",
    icon: Home,
    title: "Anlage V-FeWo",
    tag: "V-FeWo",
    mode: "input",
    description:
      "Ergänzung zur Anlage V für Ferienwohnungen / kurzfristige Vermietung. Bis zu 4 Objekte pro Formular.",
    bullets: [
      "Aktenzeichen, Wohnfläche, Lage-Angaben je Objekt",
      "Selbstnutzung · Vermietung · Leerstand (Tage)",
      "Auto-Info: Tage-Summe + Vermietungsanteil",
    ],
  },
  {
    to: "/steuer/anlage-unterhalt",
    icon: HandHeart,
    title: "Anlage Unterhalt",
    tag: "Unterhalt",
    mode: "input",
    description:
      "Unterhaltsleistungen nach § 33a Abs. 1 EStG. Bis zu 2 unterstützte Personen je Formular.",
    bullets: [
      "Section 1–2: eigene Zahlungen + Haushalt",
      "Section 3–4: je Person Einkünfte, Bezüge, KV/PV",
      "Abzug = min(Zahlung, Höchstbetrag − (Einkünfte − 624 €))",
    ],
  },
  {
    to: "/steuer/anlage-u",
    icon: Scale,
    title: "Anlage U",
    tag: "Realsplitting",
    mode: "input",
    description:
      "Realsplitting · Antrag auf Abzug von Unterhalts- und Ausgleichsleistungen als Sonderausgaben (§ 10 Abs. 1a EStG) — mit Empfänger-Zustimmung.",
    bullets: [
      "Abschnitt A: Antragsteller + Z. 1–7",
      "Abschnitt B: Empfänger-Zustimmung (+ EU/EWR)",
      "Höchstbetrag 13.805 € + Basis-KV/PV",
    ],
  },
  {
    to: "/steuer/anlage-rav-bav",
    icon: PiggyBank,
    title: "Anlage R-AV / bAV",
    tag: "R-AV/bAV",
    mode: "input",
    description:
      "Leistungen aus Riester-/Rürup-Verträgen und betrieblicher Altersversorgung. Zwei Rentenströme pro Formular; pro Person ein Formular.",
    bullets: [
      "Z. 4–26 Leistungen (Kz 500-er/550-er)",
      "Z. 27–33 Werbungskosten (nur erstes Formular)",
      "Versorgungsfreibetrag nicht auto-berechnet",
    ],
  },
  {
    to: "/steuer/anlage-n-aus",
    icon: Globe,
    title: "Anlage N-AUS",
    tag: "N-AUS",
    mode: "input",
    description:
      "Ausländische Einkünfte aus nichtselbständiger Arbeit · DBA/ATE/ZÜ-Freistellung · je Staat ein Formular.",
    bullets: [
      "Z. 32–42 Brutto-Aufbereitung + Aufteilung In-/Ausland",
      "Z. 43–47 DBA · Z. 48–52 ATE · Z. 53–56 ZÜ",
      "Auto: Z. 35/38/42/45/47/50/52/59/62",
    ],
  },
  {
    to: "/steuer/anlage-n-dhf",
    icon: Home,
    title: "Anlage N-DHF",
    tag: "N-DHF",
    mode: "input",
    description:
      "Doppelte Haushaltsführung — Mehraufwendungen § 9 Abs. 1 Nr. 5 EStG. Pro Person ein Formular.",
    bullets: [
      "Fahrtkosten · Unterkunft · Verpflegung (Inland/Ausland)",
      "Auto-Calcs: Inland-Verpflegung (14/28 €), Ausland (Tage × Satz)",
      "Warnungen: 1.000 €/Monat-Cap, 3-Monats-Frist",
    ],
  },
  {
    to: "/steuer/anlage-av",
    icon: PiggyBank,
    title: "Anlage AV",
    tag: "Riester",
    mode: "input",
    description:
      "Riester-Verträge · zusätzlicher Sonderausgabenabzug (§ 10a EStG). Gemeinsames Formular für Ehegatten.",
    bullets: [
      "Z. 4–15 Berechnungsgrundlagen (2024er Einnahmen)",
      "Z. 16–25 Opt-out · Z. 26–31 Widerruf Verzicht",
      "Anbieter meldet Beiträge direkt an ZfA",
    ],
  },
  {
    to: "/steuer/anlage-em",
    icon: Home,
    title: "Anlage Energetische Maßnahmen",
    tag: "§ 35c",
    mode: "calculator",
    description:
      "Steuerermäßigung für energetische Gebäudesanierung (§ 35c EStG) · 3-Jahres-Verteilung · Voraussetzung Gebäude ≥ 10 Jahre.",
    bullets: [
      "Z. 12–21 Einzelmaßnahmen · Z. 22 Auto-Summe (Kz 310)",
      "Hybridisierung (Z. 24/25) + Energieberater 50 % (Z. 23)",
      "Info-Calc: 7 % × Z. 22 + 50 % × Z. 23",
    ],
  },
  {
    to: "/steuer/anlage-haa",
    icon: HeartPulse,
    title: "Anlage Haushaltsnahe Aufwendungen",
    tag: "§ 35a",
    mode: "calculator",
    description:
      "Haushaltsnahe Beschäftigung, Dienstleistungen, Handwerker (§ 35a EStG) · 20 % Ermäßigung mit je eigenen Deckeln.",
    bullets: [
      "Minijob 510 € · Dienstleistung 4.000 € · Handwerker 1.200 €",
      "Z. 9 Kz 214 Auto-Summe · 3 Handwerker-Einträge",
      "Aufteilung bei Alleinstehenden + Ehegatten-Haushalt",
    ],
  },
  {
    to: "/steuer/anlage-sonder",
    icon: FileText,
    title: "Anlage Sonderausgaben",
    tag: "§ 10/10b/10c",
    mode: "input",
    description:
      "Sonderausgaben ohne Versicherung/Altersvorsorge · KiSt, Spenden, Berufsausbildung, Versorgungsleistungen, Unterhalt, Versorgungsausgleich.",
    bullets: [
      "Z. 4 KiSt · Z. 5–12 Spenden + Stiftungs-Vermögensstock",
      "Z. 15–21 Renten · Z. 22–28 Dauernde Lasten",
      "Z. 29–36 Unterhalt · Z. 37–41 Versorgungsausgleich",
    ],
  },
  {
    to: "/steuer/anlage-agb",
    icon: HeartPulse,
    title: "Anlage Außergewöhnliche Belastungen",
    tag: "§§ 33/33a/33b",
    mode: "calculator",
    description:
      "Behinderten-/Hinterbliebenen-/Pflege-Pauschbeträge (§ 33b) + konkrete aGB (Krankheit, Pflege, Bestattung, sonstige).",
    bullets: [
      "Auto-Pauschbetrag nach GdB (384–2.840 €) / 7.400 € hilflos",
      "Pflege-P. 600/1.100/1.800 € + Fahrt-P. 900/4.500 €",
      "Zumutbare Belastung wird vom FA abgezogen, nicht hier",
    ],
  },
  {
    to: "/steuer/est-1a",
    icon: Landmark,
    title: "Hauptvordruck ESt 1 A",
    tag: "Hauptvordruck",
    mode: "input",
    description:
      "Master-Deckblatt der Einkommensteuererklärung · Stammdaten, Veranlagungsart, Bankverbindung, Progressionsvorbehalts-Einkünfte.",
    bullets: [
      "Person A/B · IdNr, Adresse, Religion, Familienstand",
      "Veranlagungsart (zusammen / einzeln)",
      "IBAN + Formular-Übersicht mit Anlagen-Links",
    ],
  },
  {
    to: "/steuer/est-1c",
    icon: Globe,
    title: "Hauptvordruck ESt 1 C",
    tag: "beschr. StPfl.",
    mode: "input",
    description:
      "ESt-Erklärung für beschränkt Steuerpflichtige (§ 1 Abs. 4 EStG) · § 49 Einkünfte, § 50 Antragsveranlagung, AStG, DAC6.",
    bullets: [
      "Persönliche Daten + Wohnsitzstaat/Staatsangehörigkeit",
      "§ 50 Abs. 2 Antragsgrundlagen + Progressionsangaben",
      "AStG-Fragen (§§ 2, 5, 7) + Empfangsbevollmächtigter",
    ],
  },
];

function storageKeyForPath(to: string): string {
  const slug = to.replace(/^\/+steuer\/+/, "").replace(/^\/+/, "");
  return `harouda:${slug}`;
}

const ALL_CATEGORIES = Object.values(FORM_CATEGORIES).sort(
  (a, b) => a.order - b.order
);

export default function TaxFormsPage() {
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<
    FormCategoryId | "alle"
  >("alle");
  const [statusFilter, setStatusFilter] = useState<
    "alle" | "neu" | "bearbeitung"
  >("alle");

  const forms = useMemo(() => {
    return FORMS.map((f) => {
      const storageKey = storageKeyForPath(f.to);
      const category = categoryForPath(f.to);
      const progress = getFormProgress(storageKey);
      return { ...f, storageKey, category, progress };
    });
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return forms.filter((f) => {
      if (activeCategory !== "alle" && f.category !== activeCategory)
        return false;
      if (statusFilter === "neu" && f.progress.hasData) return false;
      if (statusFilter === "bearbeitung" && !f.progress.hasData) return false;
      if (!q) return true;
      return (
        f.title.toLowerCase().includes(q) ||
        f.tag.toLowerCase().includes(q) ||
        f.description.toLowerCase().includes(q) ||
        f.bullets.some((b) => b.toLowerCase().includes(q))
      );
    });
  }, [forms, query, activeCategory, statusFilter]);

  const grouped = useMemo(() => {
    const map = new Map<FormCategoryId, typeof filtered>();
    for (const f of filtered) {
      const arr = map.get(f.category) ?? [];
      arr.push(f);
      map.set(f.category, arr);
    }
    return map;
  }, [filtered]);

  const totalMitDaten = forms.filter((f) => f.progress.hasData).length;

  function handleExport() {
    try {
      const json = exportTaxFormBackup();
      const blob = new Blob([json], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `harouda-steuerformulare-${new Date()
        .toISOString()
        .slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Datensicherung als JSON gespeichert.");
    } catch (err) {
      toast.error(`Export fehlgeschlagen: ${(err as Error).message}`);
    }
  }

  function handleImport(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const json = String(reader.result ?? "");
      if (
        !confirm(
          "Bestehende Formular-Daten werden überschrieben, wenn gleiche Schlüssel im Backup enthalten sind. Fortfahren?"
        )
      ) {
        return;
      }
      const result = importTaxFormBackup(json);
      if (result.errors.length > 0) {
        toast.error(
          `Wiederherstellung mit Fehlern: ${result.imported} importiert · ${result.errors.length} Fehler`
        );
      } else {
        toast.success(
          `${result.imported} Formular-Einträge wiederhergestellt. Seite wird neu geladen.`
        );
        setTimeout(() => window.location.reload(), 1200);
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  }

  function handleClearAll() {
    if (
      !confirm(
        `Wirklich ALLE Formular-Entwürfe löschen? (${totalMitDaten} Formular(e) mit Daten)`
      )
    ) {
      return;
    }
    if (
      !confirm(
        "Zweite Bestätigung: Alle Anlage-* und ESt-* localStorage-Einträge werden unwiderruflich entfernt. Wirklich fortfahren?"
      )
    ) {
      return;
    }
    const { cleared } = clearAllTaxForms();
    toast.success(
      `${cleared} Formular-Entwürfe gelöscht. Seite wird neu geladen.`
    );
    setTimeout(() => window.location.reload(), 1200);
  }

  return (
    <div className="tax">
      <header className="tax__head">
        <p className="tax__lead">
          Alle unterstützten Steuerformulare. <strong>automatisch</strong> =
          direkt aus dem Journal ermittelt · <strong>Rechner</strong> = rechnet
          auf Basis von Gewinn/Parametern · <strong>Eingabe</strong> =
          strukturierte Erfassung mit Entwurfsspeicher. Für alle Formulare
          gilt: vor Einreichung durch eine qualifizierte Person prüfen lassen.
        </p>
      </header>

      {/* Bulk actions + Search */}
      <div
        className="card"
        style={{
          display: "flex",
          gap: 12,
          alignItems: "center",
          flexWrap: "wrap",
          padding: "12px 16px",
          marginBottom: 16,
        }}
      >
        <label
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            flex: "1 1 260px",
          }}
        >
          <Search size={16} />
          <input
            type="search"
            placeholder="Suche nach Name, Tag, Beschreibung …"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{ flex: 1, border: "1px solid #dee2ea", padding: "4px 8px" }}
          />
        </label>
        <select
          value={statusFilter}
          onChange={(e) =>
            setStatusFilter(e.target.value as typeof statusFilter)
          }
          style={{ padding: "4px 8px" }}
          aria-label="Status-Filter"
        >
          <option value="alle">Alle Status</option>
          <option value="neu">Nur neu (leer)</option>
          <option value="bearbeitung">In Bearbeitung</option>
        </select>
        <div
          style={{
            color: "var(--muted)",
            fontSize: "0.85rem",
            whiteSpace: "nowrap",
          }}
        >
          <strong>{totalMitDaten}</strong> von {forms.length} Formular(en) mit
          Daten
        </div>
        <button
          type="button"
          className="btn btn-outline"
          onClick={handleExport}
          title="Alle Formular-Daten als JSON herunterladen"
        >
          <Download size={14} />
          Datensicherung
        </button>
        <label className="btn btn-outline" style={{ cursor: "pointer" }}>
          <Upload size={14} />
          Wiederherstellen
          <input
            type="file"
            accept="application/json,.json"
            onChange={handleImport}
            style={{ display: "none" }}
          />
        </label>
        <button
          type="button"
          className="btn btn-outline"
          onClick={handleClearAll}
          title="Alle Formular-Entwürfe unwiderruflich löschen"
          style={{ color: "var(--danger)" }}
        >
          <RotateCcw size={14} />
          Alle zurücksetzen
        </button>
      </div>

      {/* Category chips */}
      <div
        style={{
          display: "flex",
          gap: 6,
          flexWrap: "wrap",
          marginBottom: 16,
        }}
      >
        <button
          type="button"
          className={`btn btn-${activeCategory === "alle" ? "primary" : "ghost"}`}
          onClick={() => setActiveCategory("alle")}
          style={{ padding: "4px 10px", fontSize: "0.85rem" }}
        >
          Alle · {forms.length}
        </button>
        {ALL_CATEGORIES.map((cat) => {
          const count = forms.filter((f) => f.category === cat.id).length;
          if (count === 0) return null;
          const Icon = cat.icon;
          const active = activeCategory === cat.id;
          return (
            <button
              key={cat.id}
              type="button"
              className={`btn btn-${active ? "primary" : "ghost"}`}
              onClick={() => setActiveCategory(cat.id)}
              style={{
                padding: "4px 10px",
                fontSize: "0.85rem",
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
              }}
            >
              <Icon size={14} />
              {cat.label} · {count}
            </button>
          );
        })}
      </div>

      {/* Grouped cards */}
      {ALL_CATEGORIES.map((cat) => {
        const items = grouped.get(cat.id) ?? [];
        if (items.length === 0) return null;
        const Icon = cat.icon;
        const mitDaten = items.filter((f) => f.progress.hasData).length;
        return (
          <section key={cat.id} style={{ marginBottom: 20 }}>
            <header
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "8px 0",
                borderBottom: "2px solid #15233d",
                marginBottom: 12,
              }}
            >
              <Icon size={20} />
              <h2 style={{ margin: 0, fontSize: "1.05rem" }}>
                {cat.label}
              </h2>
              <span
                style={{
                  color: "var(--muted)",
                  fontSize: "0.82rem",
                  marginLeft: "auto",
                }}
              >
                {cat.description}
                {" · "}
                <strong>
                  {mitDaten} / {items.length}
                </strong>{" "}
                ausgefüllt
              </span>
            </header>
            <div className="tax__grid">
              {items.map(
                ({
                  to,
                  icon: Icon2,
                  title,
                  tag,
                  mode,
                  description,
                  bullets,
                  progress,
                }) => (
                  <article key={to} className="card tax__card">
                    <div className="tax__card-head">
                      <span className="tax__icon">
                        <Icon2 size={22} strokeWidth={1.75} />
                      </span>
                      <div className="tax__tags">
                        <span className="tax__tag">{tag}</span>
                        <span className={`tax__mode tax__mode--${mode}`}>
                          {MODE_LABEL[mode]}
                        </span>
                        <span
                          style={{
                            fontSize: "0.7rem",
                            padding: "2px 6px",
                            borderRadius: 3,
                            background: progress.hasData
                              ? "#e5f3ec"
                              : "#f0f2f6",
                            color: progress.hasData ? "#1f7a4d" : "#6a6f7a",
                            fontWeight: 600,
                          }}
                        >
                          {progress.hasData ? "Bearbeitung" : "Neu"}
                        </span>
                      </div>
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
                )
              )}
            </div>
          </section>
        );
      })}

      {filtered.length === 0 && (
        <div
          className="card"
          style={{
            padding: 24,
            textAlign: "center",
            color: "var(--muted)",
          }}
        >
          Keine Formulare passen zum Filter.
        </div>
      )}
    </div>
  );
}
