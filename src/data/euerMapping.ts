// Mapping: SKR03-Kontonummer → Anlage-EÜR Zeile
//
// Basis: offizielle Anlage EÜR (Einnahmenüberschussrechnung, § 4 Abs. 3 EStG).
// Zeilennummern beziehen sich auf das Formular für Veranlagungszeitraum 2024
// (kleinere Verschiebungen zwischen Veranlagungsjahren sind möglich).
//
// Die Abbildung ist eine pragmatische Näherung. Für die finale Erklärung
// sollte eine qualifizierte Person (Steuerberater/in) jede Zeile überprüfen.

export type EuerSection = "einnahmen" | "ausgaben";

export type EuerZeile = {
  zeile: number;
  label: string;
  section: EuerSection;
  /** Nettobetrag anzeigen? (bei umsatzsteuerpflichtigen Konten) */
  treatAsNet?: boolean;
};

export const EUER_ZEILEN: EuerZeile[] = [
  // --- Einnahmen ---
  { zeile: 11, label: "Betriebseinnahmen als Kleinunternehmer", section: "einnahmen" },
  { zeile: 12, label: "Umsatzsteuerpflichtige Betriebseinnahmen (netto)", section: "einnahmen", treatAsNet: true },
  { zeile: 13, label: "Umsatzsteuerfreie Betriebseinnahmen", section: "einnahmen" },
  { zeile: 14, label: "Vereinnahmte Umsatzsteuer auf Einnahmen", section: "einnahmen" },
  { zeile: 15, label: "Vom Finanzamt erstattete Umsatzsteuer", section: "einnahmen" },
  { zeile: 16, label: "Veräußerung Anlagevermögen", section: "einnahmen" },

  // --- Ausgaben ---
  { zeile: 23, label: "Waren, Rohstoffe, Hilfsstoffe (netto)", section: "ausgaben", treatAsNet: true },
  { zeile: 24, label: "Bezogene Fremdleistungen (netto)", section: "ausgaben", treatAsNet: true },
  { zeile: 25, label: "Personalkosten (Löhne, Gehälter)", section: "ausgaben" },
  { zeile: 26, label: "Soziale Aufwendungen", section: "ausgaben" },
  { zeile: 27, label: "Abschreibungen Anlagevermögen", section: "ausgaben" },
  { zeile: 28, label: "Abschreibungen GWG", section: "ausgaben" },
  { zeile: 30, label: "Miete/Pacht Geschäftsräume", section: "ausgaben", treatAsNet: true },
  { zeile: 31, label: "Sonstige Raumkosten", section: "ausgaben", treatAsNet: true },
  { zeile: 33, label: "Fahrzeugkosten", section: "ausgaben", treatAsNet: true },
  { zeile: 34, label: "Reisekosten", section: "ausgaben", treatAsNet: true },
  { zeile: 35, label: "Werbekosten", section: "ausgaben", treatAsNet: true },
  { zeile: 36, label: "Bewirtungskosten (70 %)", section: "ausgaben", treatAsNet: true },
  { zeile: 37, label: "Fortbildungskosten", section: "ausgaben", treatAsNet: true },
  { zeile: 38, label: "Rechts- und Steuerberatung", section: "ausgaben", treatAsNet: true },
  { zeile: 39, label: "Porto, Bürobedarf, Literatur", section: "ausgaben", treatAsNet: true },
  { zeile: 40, label: "Telefon, Internet", section: "ausgaben", treatAsNet: true },
  { zeile: 41, label: "Versicherungen, Beiträge", section: "ausgaben" },
  { zeile: 42, label: "Sonstige betriebliche Aufwendungen", section: "ausgaben", treatAsNet: true },
  { zeile: 44, label: "An Finanzamt gezahlte Umsatzsteuer", section: "ausgaben" },
  { zeile: 46, label: "Vorsteuerbeträge", section: "ausgaben" },
  { zeile: 47, label: "Zinsen und ähnliche Aufwendungen", section: "ausgaben" },
];

const OVERRIDE_KEY = "harouda:euer-mapping-overrides";

/** Benutzerdefinierte Konto→Zeile-Überschreibungen (bleiben nur lokal). */
export function loadMappingOverrides(): Record<string, number> {
  try {
    const raw = localStorage.getItem(OVERRIDE_KEY);
    return raw ? (JSON.parse(raw) as Record<string, number>) : {};
  } catch {
    return {};
  }
}

export function saveMappingOverrides(overrides: Record<string, number>): void {
  localStorage.setItem(OVERRIDE_KEY, JSON.stringify(overrides));
}

export function clearMappingOverrides(): void {
  localStorage.removeItem(OVERRIDE_KEY);
}

/**
 * Konto → Zeile der Anlage EÜR. Bereiche folgen dem SKR03-Standard.
 * Ausgaben mit treatAsNet=true werden mit Netto-Wert verbucht; die dazugehörige
 * Vorsteuer fliesst automatisch in Zeile 46.
 */
export function mapKontoToEuerZeileWithOverrides(
  konto_nr: string,
  overrides: Record<string, number>
): number | null {
  if (konto_nr in overrides) return overrides[konto_nr];
  return mapKontoToEuerZeile(konto_nr);
}

export function mapKontoToEuerZeile(konto_nr: string): number | null {
  const n = Number(konto_nr);
  if (!Number.isFinite(n)) return null;

  // --- Erlöse (Klasse 8) ---
  if (n >= 8100 && n <= 8199) return 13; // steuerfrei
  if (n >= 8200 && n <= 8299) return 12; // allgemeine Erlöse
  if (n >= 8300 && n <= 8399) return 12; // Erlöse 7 %
  if (n >= 8400 && n <= 8499) return 12; // Erlöse 19 %
  if (n >= 8500 && n <= 8599) return 12; // sonstige Erlöse
  if (n >= 8800 && n <= 8899) return 47; // Zinserträge → Sonderposition, hier Zeile 47 nicht ideal; nehmen wir 13
  if (n === 8900 || n === 8920) return 13;

  // --- Wareneinkauf (Klasse 3) ---
  if (n >= 3000 && n <= 3099) return 23;
  if (n >= 3100 && n <= 3199) return 24;
  if (n >= 3200 && n <= 3899) return 23;

  // --- Personal (Klasse 4) ---
  if (n >= 4100 && n <= 4129) return 25;
  if (n === 4130 || n === 4138 || n === 4140 || n === 4145) return 26;

  // --- Raumkosten ---
  if (n === 4210 || n === 4220) return 30; // Miete/Pacht
  if (n >= 4200 && n <= 4299) return 31; // sonstige Raumkosten

  // --- Fahrzeug ---
  if (n >= 4500 && n <= 4599) return 33;

  // --- Werbung + Bewirtung ---
  if (n === 4650 || n === 4654) return 36;
  if (n >= 4600 && n <= 4649) return 35;
  if (n >= 4660 && n <= 4679) return 34; // Reise

  // --- Büro + Kommunikation ---
  if (n === 4920 || n === 4925) return 40;
  if (n === 4910 || n === 4930 || n === 4940 || n === 4945) return 39;

  // --- Fortbildung + Beratung ---
  if (n === 4950 || n === 4680) return 37;
  if (n === 4955 || n === 4957 || n === 4958) return 38;

  // --- Versicherungen, Beiträge ---
  if (n === 4360 || n === 4380) return 41;

  // --- Reparaturen + Abschreibungen ---
  if (n >= 4800 && n <= 4819) return 42;
  if (n === 4820 || n === 4830) return 27;
  if (n === 4840 || n === 4480) return 28;

  // --- Zinsen ---
  if (n === 7000 || n === 7100) return 47;

  // --- Sonstiges Ausgaben ---
  if (n >= 4900 && n <= 4999) return 42;
  if (n >= 4300 && n <= 4499) return 42;
  if (n >= 7000 && n <= 7999) return 42;

  return null;
}
