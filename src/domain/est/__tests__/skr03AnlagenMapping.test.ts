// Phase 3 / Schritt 4 · Tests für das zentrale SKR03-zu-ESt-Anlagen-Mapping.
//
// Scope: AnlageG + AnlageS. AnlageN ist bewusst NICHT Teil des Mappings
// (archivgetrieben via separates Modul in Schritt 5+).

import { describe, it, expect } from "vitest";
import {
  SKR03_ANLAGEN_MAPPING,
  findAnlagenRules,
  rulesForAnlage,
  type AnlagenMappingRule,
  type AnlageFormId,
} from "../skr03AnlagenMapping";

describe("SKR03_ANLAGEN_MAPPING · Struktur-Invarianten", () => {
  it("ist ein nicht-leeres Array", () => {
    expect(Array.isArray(SKR03_ANLAGEN_MAPPING)).toBe(true);
    expect(SKR03_ANLAGEN_MAPPING.length).toBeGreaterThan(0);
  });

  it("jede Regel hat gültige Konto-Range (Integer, from ≤ to, im SKR03-Fenster)", () => {
    for (const rule of SKR03_ANLAGEN_MAPPING) {
      expect(Number.isInteger(rule.from), `rule tag=${rule.tag} from not int`).toBe(true);
      expect(Number.isInteger(rule.to), `rule tag=${rule.tag} to not int`).toBe(true);
      expect(rule.from, `rule tag=${rule.tag} from < 1000`).toBeGreaterThanOrEqual(1000);
      expect(rule.to, `rule tag=${rule.tag} to > 9999`).toBeLessThanOrEqual(9999);
      expect(rule.from, `rule tag=${rule.tag} from > to`).toBeLessThanOrEqual(rule.to);
    }
  });

  it("anlage-Union enthält ausschließlich anlage-g und anlage-s (kein anlage-n)", () => {
    const anlagen = new Set(SKR03_ANLAGEN_MAPPING.map((r) => r.anlage));
    expect(anlagen.size).toBeLessThanOrEqual(2);
    for (const a of anlagen) {
      expect(a === "anlage-g" || a === "anlage-s", `Unerlaubte anlage: ${a}`).toBe(true);
    }
    // Explizite Negativ-Assertion: AnlageN darf nicht im Mapping auftauchen.
    expect(
      SKR03_ANLAGEN_MAPPING.some((r) => (r.anlage as string) === "anlage-n")
    ).toBe(false);
  });

  it("source-Union ist auf EINNAHME / AUSGABE beschränkt", () => {
    for (const r of SKR03_ANLAGEN_MAPPING) {
      expect(r.source === "EINNAHME" || r.source === "AUSGABE").toBe(true);
    }
  });

  it("aggregation ist ausschließlich 'sum' (kein employee-grouped o. ä.)", () => {
    for (const r of SKR03_ANLAGEN_MAPPING) {
      expect(r.aggregation).toBe("sum");
    }
  });

  it("Range-Disjunktheit innerhalb derselben Anlage — kein Konto matcht zwei Regeln einer Anlage", () => {
    const byAnlage: Record<AnlageFormId, AnlagenMappingRule[]> = {
      "anlage-g": rulesForAnlage("anlage-g"),
      "anlage-s": rulesForAnlage("anlage-s"),
    };
    for (const anlage of Object.keys(byAnlage) as AnlageFormId[]) {
      const rules = byAnlage[anlage];
      for (let i = 0; i < rules.length; i++) {
        for (let j = i + 1; j < rules.length; j++) {
          const a = rules[i];
          const b = rules[j];
          const overlap = a.from <= b.to && b.from <= a.to;
          expect(
            overlap,
            `Range-Overlap in ${anlage}: tag=${a.tag} (${a.from}-${a.to}) <> tag=${b.tag} (${b.from}-${b.to})`
          ).toBe(false);
        }
      }
    }
  });
});

describe("SKR03_ANLAGEN_MAPPING · Feld-Coverage", () => {
  // Die erwarteten Felder spiegeln den `FormSpec.fields[].key` der jeweiligen
  // Page. Nicht jedes Feld braucht eine Regel (einige bleiben bewusst manuell
  // — siehe Kopfkommentar des Mapping-Files); hier geprüft werden nur die
  // primären journal-ableitbaren Felder.

  const G_PRIMARY_FIELDS = [
    "umsaetze",
    "umsatzsteuerfrei",
    "anlagenverkaeufe",
    "sonstige_einnahmen",
    "wareneinsatz",
    "fremdleistungen",
    "personal",
    "raum",
    "fahrzeug",
    "werbung",
    "bewirtung",
    "abschreibungen",
    "porto_tel",
    "beratung",
    "sonstige_ausgaben",
  ];

  const S_PRIMARY_FIELDS = [
    "honorare",
    "umsatzsteuerfrei",
    "sonstige",
    "personal",
    "raum",
    "fahrzeug",
    "reisen",
    "porto_tel",
    "fortbildung",
    "versicherung",
    "beratung",
    "abschreibungen",
    "sonstige_ausgaben",
  ];

  it("AnlageG: jedes primäre Feld hat mindestens eine Mapping-Regel", () => {
    const feldSet = new Set(rulesForAnlage("anlage-g").map((r) => r.feld));
    for (const feld of G_PRIMARY_FIELDS) {
      expect(feldSet.has(feld), `AnlageG-Feld '${feld}' fehlt im Mapping`).toBe(true);
    }
  });

  it("AnlageS: jedes primäre Feld hat mindestens eine Mapping-Regel", () => {
    const feldSet = new Set(rulesForAnlage("anlage-s").map((r) => r.feld));
    for (const feld of S_PRIMARY_FIELDS) {
      expect(feldSet.has(feld), `AnlageS-Feld '${feld}' fehlt im Mapping`).toBe(true);
    }
  });

  it("Absichtlich unmapped: bezugsnebenkosten (G), reparatur (G), umsatzsteuerpflichtig (S)", () => {
    const gFelder = new Set(rulesForAnlage("anlage-g").map((r) => r.feld));
    const sFelder = new Set(rulesForAnlage("anlage-s").map((r) => r.feld));
    expect(gFelder.has("bezugsnebenkosten")).toBe(false);
    expect(gFelder.has("reparatur")).toBe(false);
    expect(sFelder.has("umsatzsteuerpflichtig")).toBe(false);
  });
});

describe("SKR03_ANLAGEN_MAPPING · findAnlagenRules-Lookup", () => {
  it("findAnlagenRules(4110, 'anlage-g') liefert die Personal-Regel", () => {
    const matches = findAnlagenRules("4110", "anlage-g");
    expect(matches).toHaveLength(1);
    expect(matches[0].feld).toBe("personal");
    expect(matches[0].source).toBe("AUSGABE");
  });

  it("findAnlagenRules(8400, 'anlage-g') liefert die umsaetze-Regel", () => {
    const matches = findAnlagenRules("8400", "anlage-g");
    expect(matches).toHaveLength(1);
    expect(matches[0].feld).toBe("umsaetze");
    expect(matches[0].source).toBe("EINNAHME");
  });

  it("findAnlagenRules(8400, 'anlage-s') liefert die honorare-Regel (gleicher Konto, anderes Feld)", () => {
    const matches = findAnlagenRules("8400", "anlage-s");
    expect(matches).toHaveLength(1);
    expect(matches[0].feld).toBe("honorare");
  });

  it("findAnlagenRules: unbekanntes Konto liefert leeres Array", () => {
    const matches = findAnlagenRules("9999", "anlage-g");
    expect(matches).toEqual([]);
  });

  it("findAnlagenRules: Nicht-numerische Konto-Nr liefert leeres Array", () => {
    const matches = findAnlagenRules("abc", "anlage-g");
    expect(matches).toEqual([]);
  });

  it("rulesForAnlage liefert nur Regeln der angegebenen Anlage", () => {
    const g = rulesForAnlage("anlage-g");
    const s = rulesForAnlage("anlage-s");
    expect(g.length).toBeGreaterThan(0);
    expect(s.length).toBeGreaterThan(0);
    expect(g.every((r) => r.anlage === "anlage-g")).toBe(true);
    expect(s.every((r) => r.anlage === "anlage-s")).toBe(true);
  });
});
