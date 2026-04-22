/**
 * SKR03-Kontenrahmen → § 266 HGB Berichtszeilen.
 *
 * Der harouda-app verwendet SKR03 als Standard (siehe src/types/db.ts).
 * Für SKR04 würde eine zweite Mapping-Tabelle mit anderen Kontenbereichen
 * ergänzt — hier aus Scope-Gründen nur SKR03.
 *
 * Das Mapping ist bereichs-basiert: ein Konto fällt auf die § 266-Zeile
 * wenn seine `konto_nr` im Bereich liegt. Overrides per Konto-Tag oder
 * explizitem Mapping (→ account_report_mapping-Tabelle in der DB) gehen
 * vor — in diesem in-memory-Setup ist nur der Bereichsabgleich umgesetzt.
 *
 * Vereinfachte SKR03-Grobgliederung:
 *   0000–0099  Eröffnungsbilanz / Kapital (historisch selten direkt bebucht)
 *   0100–0299  Immaterielle VG + Grundstücke (Aktiva)
 *   0300–0799  Technische Anlagen / Sachanlagen (Aktiva)
 *   0800–0899  Finanzanlagen (Aktiva)
 *   0900–0999  Gezeichnetes Kapital, Rücklagen (Passiva)
 *   1000–1099  Kasse (Aktiva · Wechselkonto)
 *   1100–1299  Bank (Aktiva · Wechselkonto)
 *   1300–1399  Finanzumlauf / Kurzfristige Kapitalanlagen (Aktiva)
 *   1400–1499  Forderungen aus L+L (Aktiva)
 *   1500–1599  Sonstige Vermögensgegenstände / RAP aktiv
 *   1600–1699  Sonstige Vermögen
 *   1700–1799  Kurzfristige Verbindlichkeiten (Passiva)
 *   1800–1899  Verbindlichkeiten aus L+L (Passiva)
 *   1900–1999  RAP passiv + Rückstellungen (Passiva)
 *   2000–2199  Ausserordentliche Erträge (Erfolgskonto · Ertrag)
 *   3000–3999  Wareneingang (Aufwand)
 *   4000–4999  Betriebliche Aufwendungen (Aufwand)
 *   5000–6999  (reserviert)
 *   7000–7099  Bestandskonten
 *   8000–8999  Umsatzerlöse (Ertrag)
 *   9000–9999  Vortrags-/Abschluss-/Statistikkonten
 *
 * Diese Grob-Tabelle ist eine pragmatische Näherung — für produktive
 * Abschlüsse muss je Konto individuell geprüft und ggf. per MANUAL-Mapping
 * überschrieben werden.
 */

export type MappingRule = {
  /** inkl. Untergrenze (SKR03-Kontonummer, kein Geldwert) */
  // MONEY_SAFE: SKR03 account number range bracket (integer), not a currency amount.
  from: number;
  /** inkl. Obergrenze (SKR03-Kontonummer, kein Geldwert) */
  // MONEY_SAFE: SKR03 account number range bracket (integer), not a currency amount.
  to: number;
  /** Referenz-Code der § 266-Zeile (siehe hgb266Structure.ts) */
  reference_code: string;
  /** Tag für die Qualifizierung (z. B. für Wechselkonten-Detection) */
  tag: string;
  /** true = Konto kann das Vorzeichen wechseln und auf die Passiv-Seite rutschen */
  wechselkonto?: boolean;
  /** Fallback-Reference-Code wenn Wechselkonto negativ wird */
  wechsel_ref?: string;
};

export const SKR03_MAPPING_RULES: MappingRule[] = [
  // Anlagevermögen
  { from: 100, to: 199, reference_code: "A.I.2", tag: "IMMATERIELLE_VG" },
  { from: 200, to: 299, reference_code: "A.II.1", tag: "GRUNDSTUECKE_BAUTEN" },
  { from: 300, to: 399, reference_code: "A.II.2", tag: "TECHNISCHE_ANLAGEN" },
  { from: 400, to: 799, reference_code: "A.II.3", tag: "BGA_SONSTIGE_ANLAGEN" },
  // Post-Bugfix 2026-04-20 Bug A: 0860-0869 (Gewinnvortrag) ist in
  // SKR03_SEED als passiva deklariert (Sprint-7.5-Ergänzung) und gehört
  // nach § 266 Abs. 3 HGB A.IV in das Eigenkapital. Range 800-889 wurde
  // deshalb um diese Lücke aufgesplittet, damit 0860 nicht fälschlich
  // nach A.III.1 Aktiva gemappt wird.
  { from: 800, to: 859, reference_code: "A.III.1", tag: "ANTEILE_VERBUNDENE" },
  { from: 870, to: 889, reference_code: "A.III.1", tag: "ANTEILE_VERBUNDENE_2" },
  { from: 890, to: 899, reference_code: "A.III.3", tag: "BETEILIGUNGEN" },

  // Eigenkapital / Passiva aus Klasse 0
  { from: 860, to: 869, reference_code: "P.A.IV", tag: "GEWINN_VORTRAG_0860" },
  { from: 900, to: 929, reference_code: "P.A.I", tag: "GEZEICHNETES_KAPITAL" },
  { from: 930, to: 959, reference_code: "P.A.II", tag: "KAPITALRUECKLAGE" },
  { from: 960, to: 979, reference_code: "P.A.III", tag: "GEWINNRUECKLAGEN" },
  { from: 980, to: 999, reference_code: "P.A.IV", tag: "GEWINN_VERLUSTVORTRAG" },

  // Finanz- und Privatkonten (Aktiva)
  {
    from: 1000,
    to: 1099,
    reference_code: "B.IV",
    tag: "KASSE",
    wechselkonto: false,
  },
  {
    from: 1100,
    to: 1299,
    reference_code: "B.IV",
    tag: "BANK",
    wechselkonto: true,
    wechsel_ref: "P.C.2",
  },
  { from: 1300, to: 1399, reference_code: "B.III", tag: "WERTPAPIERE_KURZ" },
  { from: 1400, to: 1499, reference_code: "B.II.1", tag: "FORDERUNGEN_LuL" },
  { from: 1500, to: 1549, reference_code: "C", tag: "RAP_AKTIV" },
  { from: 1550, to: 1599, reference_code: "D", tag: "LATENTE_STEUERN_AKTIV" },
  // Post-Bugfix 2026-04-20 Bug C: Konto 1600 ist im harouda-SKR03 als
  // „Verbindlichkeiten aus Lieferungen und Leistungen" (passiva)
  // deklariert (`skr03.ts:67`) — Standard-SKR03 belegt 1600 mit
  // Geldtransit/Sonstige Forderungen. Wir folgen dem Projekt und mappen
  // nach P.C.4, damit EB-007 und operative Lieferanten-Buchungen auf
  // der Passivseite landen. Standard-P.C.4 kommt aus 1800-1899 und
  // bleibt parallel gültig; beide Ranges zeigen auf denselben
  // Bilanz-Knoten.
  { from: 1600, to: 1699, reference_code: "P.C.4", tag: "VERB_LuL_1600" },

  // Passiva in Klasse 1
  {
    from: 1700,
    to: 1719,
    reference_code: "P.C.2",
    tag: "VERB_KREDITINSTITUTE",
  },
  {
    from: 1720,
    to: 1769,
    reference_code: "P.C.8",
    tag: "SONSTIGE_VERBINDLICHKEITEN",
  },
  { from: 1770, to: 1779, reference_code: "P.B.2", tag: "STEUERRUECKSTELLUNG" },
  { from: 1780, to: 1799, reference_code: "P.B.3", tag: "RUECKSTELLUNGEN" },
  { from: 1800, to: 1899, reference_code: "P.C.4", tag: "VERB_LuL" },
  { from: 1900, to: 1949, reference_code: "P.D", tag: "RAP_PASSIV" },
  { from: 1950, to: 1999, reference_code: "P.E", tag: "LATENTE_STEUERN_PASSIV" },

  // Post-Bugfix 2026-04-20 Bug B: 2300 Grundkapital (passiva) — harouda-
  // spezifische SKR03-Variante. Die parallele GuV-Range ZINSAUFWAND
  // wurde entsprechend auf 2310-2319 verkürzt (siehe skr03GuvMapping.ts).
  { from: 2300, to: 2309, reference_code: "P.A.I", tag: "GEZEICHNETES_KAPITAL_2300" },

  // Bestandskonten (Aktiva · Vorräte)
  // Audit 2026-04-20 P0-01: 3100-3159 wurde aus dem Rohstoff-Bereich
  // herausgesplittet — diese Konten führen Sprint-7 Reverse-Charge-
  // Bemessungsgrundlagen (§ 13b UStG) und laufen über GuV 5.b, nicht Bilanz.
  // Range siehe skr03GuvMapping.ts. 3000-3099 und 3160-3199 bleiben B.I.1.
  { from: 3000, to: 3099, reference_code: "B.I.1", tag: "ROHSTOFFE" },
  { from: 3160, to: 3199, reference_code: "B.I.1", tag: "ROHSTOFFE_SONSTIGE" },
  { from: 3200, to: 3299, reference_code: "B.I.1", tag: "HILFSSTOFFE" },
  { from: 3900, to: 3999, reference_code: "B.I.3", tag: "FERTIGE_ERZEUGNISSE" },
  { from: 7000, to: 7099, reference_code: "B.I.2", tag: "UNFERTIGE_LEISTUNGEN" },

  // Erfolgskonten — werden separat zum GuV-Ergebnis aggregiert
  // (Mapping auf "ERFOLG_*" Tags, keine Bilanz-Referenz — siehe BalanceSheetBuilder)
];

export type EfolgsRule = {
  // MONEY_SAFE: account number range brackets (integers), not currency amounts.
  from: number;
  to: number;
  kind: "ERTRAG" | "AUFWAND";
  tag: string;
};

// SKR03_ERFOLG_RULES werden aus SKR03_GUV_MAPPING abgeleitet (Single Source
// of Truth). Dadurch bleibt Bilanz.provisionalResult ↔ GuV.jahresergebnis
// konsistent (GoBD Rz. 58, § 266/§ 275 HGB). Vorher hart-kodierte Lücken
// (z. B. fehlende 7600er Steuerkonten) sind behoben.
import { SKR03_GUV_MAPPING } from "./skr03GuvMapping";
import { HGB_275_GKV_BY_REF } from "./hgb275GkvStructure";

export const SKR03_ERFOLG_RULES: EfolgsRule[] = SKR03_GUV_MAPPING.map((r) => {
  const guvLine = HGB_275_GKV_BY_REF.get(r.guv_ref);
  // Erträge sind in HGB_275 als normal_side=HABEN erfasst (Posten 1-4, 9-11);
  // Aufwände als normal_side=SOLL (Posten 5-8, 12-14, 16). Ergebnis-/Subtotal-
  // Zeilen (15, 17, BETRIEBSERG, ...) sind keine Posten-Regeln.
  const kind: EfolgsRule["kind"] =
    guvLine?.normal_side === "HABEN" ? "ERTRAG" : "AUFWAND";
  return {
    from: r.from,
    to: r.to,
    kind,
    tag: r.tag,
  };
});

/** Match konto_nr (String, evtl. mit führender 0) gegen Regeln.
 *  Gibt die erste passende Regel zurück oder undefined. */
export function findBalanceRule(
  kontoNr: string
): MappingRule | undefined {
  // MONEY_SAFE: Number() on a numeric account code, not on a money amount.
  const n = Number(kontoNr);
  if (!Number.isFinite(n)) return undefined;
  for (const rule of SKR03_MAPPING_RULES) {
    if (n >= rule.from && n <= rule.to) return rule;
  }
  return undefined;
}

export function findErfolgRule(kontoNr: string): EfolgsRule | undefined {
  // MONEY_SAFE: Number() on a numeric account code, not on a money amount.
  const n = Number(kontoNr);
  if (!Number.isFinite(n)) return undefined;
  for (const rule of SKR03_ERFOLG_RULES) {
    if (n >= rule.from && n <= rule.to) return rule;
  }
  return undefined;
}
