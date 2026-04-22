/**
 * Zentrales Mapping SKR03-Konto-Range → ESt-Anlagen-Feld.
 *
 * Scope Phase 3 / Schritt 4 (bewusst eng):
 *   • AnlageG (Einkünfte aus Gewerbebetrieb, § 15 EStG)
 *   • AnlageS (Einkünfte aus selbständiger Arbeit, § 18 EStG)
 *
 * AnlageN ist absichtlich NICHT enthalten. Anlage N ist die Einkommen-
 * steuer einer natürlichen Person (typischerweise nicht der Kanzlei-
 * Mandant-Firma). Nur im Sonderfall Gesellschafter-Geschäftsführer ist
 * ein Daten-Transfer aus der Kanzlei-Buchhaltung sinnvoll — und dann
 * archiv-getrieben, nicht journal-getrieben, via separates Modul
 * `archivEstImport.ts` (Phase 3 / Schritt 5+). Kein automatisches
 * Journal-Pull pro Mandant.
 *
 * Strukturmuster analog `src/domain/euer/skr03EuerMapping.ts`:
 *   from/to     — Kontonummer-Range (inklusiv, ganzzahlig)
 *   anlage      — "anlage-g" | "anlage-s"
 *   feld        — FormSpec-`fields[].key` der jeweiligen Page (AnlageGPage
 *                  bzw. AnlageSPage)
 *   source      — Vorzeichenrichtung des Saldos:
 *                   EINNAHME = Haben − Soll (Ertragskonto)
 *                   AUSGABE  = Soll − Haben (Aufwandskonto)
 *   aggregation — "sum" (einzige unterstützte Aggregation in Phase 3)
 *   tag         — Qualifikations-Label für QA/Tests
 *
 * Ranges sind INNERHALB derselben Anlage disjunkt. Zwischen verschiedenen
 * Anlagen dürfen dieselben Ranges auf unterschiedliche Felder zeigen
 * (z. B. 8300-8499 → `umsaetze` in G, → `honorare` in S).
 *
 * Nicht jedes FormSpec-Feld hat eine Regel — Felder ohne SKR03-Konten-
 * Quelle (z. B. `bezugsnebenkosten`, `umsatzsteuerpflichtig` in S, wo
 * redundant zu `honorare`) bleiben manuell im Formular und bekommen
 * im späteren UI-Override-Pattern kein Auto-Wert-Badge.
 */

export type AnlageFormId = "anlage-g" | "anlage-s";

export type AnlagenSource = "EINNAHME" | "AUSGABE";

export type AnlagenFieldAggregation = "sum";

export type AnlagenMappingRule = {
  // MONEY_SAFE: Konto-Range, kein Geldwert.
  from: number;
  to: number;
  anlage: AnlageFormId;
  feld: string;
  source: AnlagenSource;
  aggregation: AnlagenFieldAggregation;
  tag: string;
};

export const SKR03_ANLAGEN_MAPPING: AnlagenMappingRule[] = [
  // =========================================================================
  // AnlageG — Einkünfte aus Gewerbebetrieb (§ 15 EStG)
  // =========================================================================

  // -------- Betriebseinnahmen --------
  { from: 8300, to: 8499, anlage: "anlage-g", feld: "umsaetze", source: "EINNAHME", aggregation: "sum", tag: "G_UMSATZ_STEUERPFLICHTIG" },
  { from: 8100, to: 8199, anlage: "anlage-g", feld: "umsatzsteuerfrei", source: "EINNAHME", aggregation: "sum", tag: "G_UMSATZ_STFREI_INL" },
  { from: 8500, to: 8599, anlage: "anlage-g", feld: "umsatzsteuerfrei", source: "EINNAHME", aggregation: "sum", tag: "G_UMSATZ_AUSLAND" },
  { from: 2700, to: 2749, anlage: "anlage-g", feld: "anlagenverkaeufe", source: "EINNAHME", aggregation: "sum", tag: "G_ANLAGENVERKAUF" },
  { from: 8910, to: 8939, anlage: "anlage-g", feld: "sonstige_einnahmen", source: "EINNAHME", aggregation: "sum", tag: "G_ENTNAHMEN_SONST" },

  // -------- Wareneinsatz und Fremdleistungen --------
  { from: 3400, to: 3699, anlage: "anlage-g", feld: "wareneinsatz", source: "AUSGABE", aggregation: "sum", tag: "G_WARENEINGANG" },
  { from: 3700, to: 3799, anlage: "anlage-g", feld: "fremdleistungen", source: "AUSGABE", aggregation: "sum", tag: "G_FREMDLEISTUNG" },
  // `bezugsnebenkosten` bewusst ohne Range — kein eindeutiges SKR03-Konto;
  // bleibt manuelles Feld.

  // -------- Betriebsausgaben --------
  { from: 4100, to: 4199, anlage: "anlage-g", feld: "personal", source: "AUSGABE", aggregation: "sum", tag: "G_PERSONAL_INKL_SV" },
  { from: 4210, to: 4299, anlage: "anlage-g", feld: "raum", source: "AUSGABE", aggregation: "sum", tag: "G_RAUMKOSTEN" },
  { from: 4500, to: 4599, anlage: "anlage-g", feld: "fahrzeug", source: "AUSGABE", aggregation: "sum", tag: "G_KFZ" },
  { from: 4600, to: 4629, anlage: "anlage-g", feld: "werbung", source: "AUSGABE", aggregation: "sum", tag: "G_WERBUNG" },
  // Bewirtung: vollständiger Betrag im Feld; 70/30-Split ist EStG-Logik,
  // die das Formular (bzw. der User) beachtet, kein Mapping-Issue.
  { from: 4650, to: 4655, anlage: "anlage-g", feld: "bewirtung", source: "AUSGABE", aggregation: "sum", tag: "G_BEWIRTUNG" },
  // `reparatur` bewusst ohne Range — überschneidet strukturell mit
  // Abschreibungen (4800er) und Raumkosten; bleibt manuell.
  { from: 4800, to: 4889, anlage: "anlage-g", feld: "abschreibungen", source: "AUSGABE", aggregation: "sum", tag: "G_AFA" },
  { from: 4910, to: 4929, anlage: "anlage-g", feld: "porto_tel", source: "AUSGABE", aggregation: "sum", tag: "G_PORTO_TELEKOM" },
  { from: 4950, to: 4959, anlage: "anlage-g", feld: "beratung", source: "AUSGABE", aggregation: "sum", tag: "G_STEUERBERATUNG" },
  { from: 4900, to: 4909, anlage: "anlage-g", feld: "sonstige_ausgaben", source: "AUSGABE", aggregation: "sum", tag: "G_SONST_AUFWAND_A" },
  { from: 4930, to: 4949, anlage: "anlage-g", feld: "sonstige_ausgaben", source: "AUSGABE", aggregation: "sum", tag: "G_SONST_AUFWAND_B" },
  { from: 4960, to: 4989, anlage: "anlage-g", feld: "sonstige_ausgaben", source: "AUSGABE", aggregation: "sum", tag: "G_SONST_AUFWAND_C" },

  // =========================================================================
  // AnlageS — Einkünfte aus selbständiger Arbeit (§ 18 EStG)
  // =========================================================================

  // -------- Betriebseinnahmen --------
  // `honorare` ist das primäre Umsatzfeld; identische Konten-Range wie G.
  { from: 8300, to: 8499, anlage: "anlage-s", feld: "honorare", source: "EINNAHME", aggregation: "sum", tag: "S_HONORARE" },
  // `umsatzsteuerpflichtig` bewusst ohne Range — redundant zu `honorare`
  // (dieselben Konten im Journal), bleibt manuell falls User differenziert.
  { from: 8100, to: 8199, anlage: "anlage-s", feld: "umsatzsteuerfrei", source: "EINNAHME", aggregation: "sum", tag: "S_STFREI_INL" },
  { from: 8500, to: 8599, anlage: "anlage-s", feld: "umsatzsteuerfrei", source: "EINNAHME", aggregation: "sum", tag: "S_STFREI_AUSLAND" },
  { from: 8910, to: 8939, anlage: "anlage-s", feld: "sonstige", source: "EINNAHME", aggregation: "sum", tag: "S_ENTNAHMEN_SONST" },
  { from: 2700, to: 2749, anlage: "anlage-s", feld: "sonstige", source: "EINNAHME", aggregation: "sum", tag: "S_ANLAGENVERKAUF" },

  // -------- Betriebsausgaben --------
  { from: 4100, to: 4199, anlage: "anlage-s", feld: "personal", source: "AUSGABE", aggregation: "sum", tag: "S_PERSONAL_INKL_SV" },
  { from: 4210, to: 4299, anlage: "anlage-s", feld: "raum", source: "AUSGABE", aggregation: "sum", tag: "S_RAUMKOSTEN" },
  { from: 4500, to: 4599, anlage: "anlage-s", feld: "fahrzeug", source: "AUSGABE", aggregation: "sum", tag: "S_KFZ" },
  { from: 4660, to: 4669, anlage: "anlage-s", feld: "reisen", source: "AUSGABE", aggregation: "sum", tag: "S_REISEKOSTEN" },
  { from: 4910, to: 4929, anlage: "anlage-s", feld: "porto_tel", source: "AUSGABE", aggregation: "sum", tag: "S_PORTO_TELEKOM" },
  { from: 4670, to: 4679, anlage: "anlage-s", feld: "fortbildung", source: "AUSGABE", aggregation: "sum", tag: "S_FORTBILDUNG" },
  { from: 4360, to: 4399, anlage: "anlage-s", feld: "versicherung", source: "AUSGABE", aggregation: "sum", tag: "S_VERSICHERUNG_BEITRAG" },
  { from: 4950, to: 4959, anlage: "anlage-s", feld: "beratung", source: "AUSGABE", aggregation: "sum", tag: "S_STEUERBERATUNG" },
  { from: 4800, to: 4889, anlage: "anlage-s", feld: "abschreibungen", source: "AUSGABE", aggregation: "sum", tag: "S_AFA" },
  { from: 4900, to: 4909, anlage: "anlage-s", feld: "sonstige_ausgaben", source: "AUSGABE", aggregation: "sum", tag: "S_SONST_AUFWAND_A" },
  { from: 4930, to: 4949, anlage: "anlage-s", feld: "sonstige_ausgaben", source: "AUSGABE", aggregation: "sum", tag: "S_SONST_AUFWAND_B" },
  { from: 4960, to: 4989, anlage: "anlage-s", feld: "sonstige_ausgaben", source: "AUSGABE", aggregation: "sum", tag: "S_SONST_AUFWAND_C" },
];

/**
 * Findet alle Anlagen-Mapping-Regeln für eine SKR03-Kontonummer in einer
 * bestimmten Anlage. Da `bezugsnebenkosten`, `umsatzsteuerpflichtig`, etc.
 * bewusst ohne Regel bleiben, kann das Array leer sein.
 *
 * In der Regel matcht höchstens eine Range pro (konto, anlage) — aber
 * der Rückgabe-Typ ist Array, falls in Zukunft Mehrfach-Zuordnungen nötig
 * werden (z. B. ein Konto auf zwei Felder splitten).
 */
export function findAnlagenRules(
  kontoNr: string,
  anlage: AnlageFormId
): AnlagenMappingRule[] {
  const n = Number(kontoNr);
  if (!Number.isFinite(n)) return [];
  return SKR03_ANLAGEN_MAPPING.filter(
    (r) => r.anlage === anlage && n >= r.from && n <= r.to
  );
}

/**
 * Liefert alle Regeln für eine Anlage. Nützlich für Feld-Coverage-Tests
 * und Builder-Vorbereitung (Schritt 5).
 */
export function rulesForAnlage(anlage: AnlageFormId): AnlagenMappingRule[] {
  return SKR03_ANLAGEN_MAPPING.filter((r) => r.anlage === anlage);
}
