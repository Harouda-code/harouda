/**
 * DATEV-Standard-BWA (Form 01) — Betriebswirtschaftliche Auswertung.
 *
 * Diese BWA ist KEIN normierter Bestandteil des HGB-Jahresabschlusses,
 * sondern ein von der DATEV etablierter Management-Bericht. Zeilen ziehen
 * ihre Werte entweder:
 *   - aus SKR03-Konten-Ranges (präzise, Defaultpfad), oder
 *   - aus aggregierten GuV-Posten (`guv_refs`, Fallback wenn keine Range).
 *
 * Wenn beide Felder vorhanden sind: SKR03-Ranges gewinnen. Das vermeidet
 * Doppelzählung und spiegelt die DATEV-Praxis (Kontenauswahl pro BWA-Posten).
 *
 * SUBTOTAL-Zeilen werden nicht aggregiert sondern errechnet (siehe
 * BwaBuilder). Die Struktur listet die Komponenten in `components`.
 */

export type BwaDirection = "POSITIVE" | "NEGATIVE" | "SUBTOTAL";

export type BwaLineDef = {
  code: string;
  name: string;
  direction: BwaDirection;
  /** SKR03-Kontobereiche [from, to] inklusive. */
  skr03_ranges?: Array<[number, number]>;
  /** Fallback: referenziert HGB_275_GKV_STRUCTURE reference_codes. */
  guv_refs?: string[];
  /** Nur für SUBTOTAL: Codes der Vorgänger-Zeilen die zusammenzufassen sind. */
  components?: string[];
  /** Formel als Dokumentation / UI-Tooltip. */
  computation?: string;
  /** Jahresergebnis der BWA. */
  is_final_result?: boolean;
};

export const BWA_STRUCTURE: BwaLineDef[] = [
  // ---------------- Erlöse ----------------
  { code: "1", name: "Umsatzerlöse", direction: "POSITIVE", guv_refs: ["1"] },
  {
    code: "2",
    name: "Bestandsveränderungen",
    direction: "POSITIVE",
    guv_refs: ["2"],
  },
  {
    code: "3",
    name: "Aktivierte Eigenleistungen",
    direction: "POSITIVE",
    guv_refs: ["3"],
  },
  {
    code: "BL",
    name: "Betriebsleistung",
    direction: "SUBTOTAL",
    components: ["1", "2", "3"],
    computation: "1 + 2 + 3",
  },

  // ---------------- Materialaufwand ----------------
  {
    code: "4",
    name: "Mat./Wareneinkauf",
    direction: "NEGATIVE",
    skr03_ranges: [[3400, 3699]],
  },
  {
    code: "5",
    name: "Fremdleistungen",
    direction: "NEGATIVE",
    skr03_ranges: [[3700, 3799]],
  },
  {
    code: "RE",
    name: "Rohertrag",
    direction: "SUBTOTAL",
    components: ["BL", "-4", "-5"],
    computation: "BL − (4 + 5)",
  },

  // ---------------- Sonstige betr. Erträge ----------------
  { code: "6", name: "So. betr. Erlöse", direction: "POSITIVE", guv_refs: ["4"] },
  {
    code: "BRE",
    name: "Betriebl. Rohertrag",
    direction: "SUBTOTAL",
    components: ["RE", "6"],
    computation: "RE + 6",
  },

  // ---------------- Kostenarten ----------------
  { code: "10", name: "Personalkosten", direction: "NEGATIVE", guv_refs: ["6"] },
  {
    code: "11",
    name: "Raumkosten",
    direction: "NEGATIVE",
    skr03_ranges: [[4200, 4299]],
  },
  {
    code: "12",
    name: "Betriebliche Steuern",
    direction: "NEGATIVE",
    skr03_ranges: [
      [4300, 4319],
      [4330, 4379],
    ],
  },
  {
    code: "13",
    name: "Versicherungen/Beiträge",
    direction: "NEGATIVE",
    skr03_ranges: [[4390, 4399]],
  },
  {
    code: "14",
    name: "Besondere Kosten",
    direction: "NEGATIVE",
    skr03_ranges: [[4400, 4499]],
  },
  {
    code: "15",
    name: "Kfz-Kosten (ohne St.)",
    direction: "NEGATIVE",
    skr03_ranges: [[4500, 4599]],
  },
  {
    code: "16",
    name: "Werbe-/Reisekosten",
    direction: "NEGATIVE",
    skr03_ranges: [[4600, 4699]],
  },
  {
    code: "17",
    name: "Kosten Warenabgabe",
    direction: "NEGATIVE",
    skr03_ranges: [[4700, 4799]],
  },
  {
    code: "18",
    name: "Abschreibungen",
    direction: "NEGATIVE",
    guv_refs: ["7"],
  },
  {
    code: "19",
    name: "Reparatur/Instandh.",
    direction: "NEGATIVE",
    skr03_ranges: [[4800, 4809]],
  },
  {
    code: "20",
    name: "Sonstige Kosten",
    direction: "NEGATIVE",
    skr03_ranges: [[4900, 4989]],
  },

  // ---------------- Gesamtkosten ----------------
  {
    code: "GK",
    name: "Gesamtkosten",
    direction: "SUBTOTAL",
    components: ["10", "11", "12", "13", "14", "15", "16", "17", "18", "19", "20"],
    computation: "Σ (10 … 20)",
  },

  // ---------------- Betriebsergebnis ----------------
  {
    code: "BE",
    name: "Betriebsergebnis",
    direction: "SUBTOTAL",
    components: ["BRE", "-GK"],
    computation: "BRE − GK",
  },

  // ---------------- Neutrales Ergebnis ----------------
  { code: "30", name: "Zinsaufwand", direction: "NEGATIVE", guv_refs: ["13"] },
  { code: "32", name: "Zinserträge", direction: "POSITIVE", guv_refs: ["11"] },

  {
    code: "EVS",
    name: "Ergebnis vor Steuern",
    direction: "SUBTOTAL",
    components: ["BE", "32", "-30"],
    computation: "BE + 32 − 30",
  },

  // ---------------- Steuern + vorläufiges Ergebnis ----------------
  {
    code: "40",
    name: "Steuern Einkommen u. Ertrag",
    direction: "NEGATIVE",
    guv_refs: ["14"],
  },
  {
    code: "VE",
    name: "Vorläufiges Ergebnis",
    direction: "SUBTOTAL",
    components: ["EVS", "-40"],
    computation: "EVS − 40",
    is_final_result: true,
  },
];

export const BWA_BY_CODE = new Map<string, BwaLineDef>(
  BWA_STRUCTURE.map((l) => [l.code, l])
);
