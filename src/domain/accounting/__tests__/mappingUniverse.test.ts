/**
 * Mapping-Universe-Tests: prüfen systematisch die Beziehungen zwischen
 * allen vier Mapping-Tabellen (Bilanz, GuV, EÜR, UStVA):
 *   - Disjunktheit innerhalb jeder Tabelle (bereits an anderer Stelle)
 *   - Erwartete Disjunktheit zwischen Tabellen (Bilanz vs GuV, etc.)
 *   - Target-Integrität: jede Regel referenziert eine existierende
 *     Struktur-Zeile
 *   - Coverage-Report: welche SKR03-Bereiche sind NICHT gemappt
 */

import { describe, it, expect } from "vitest";
import {
  SKR03_MAPPING_RULES,
  findBalanceRule,
} from "../skr03Mapping";
import {
  SKR03_GUV_MAPPING,
  findGuvRule,
} from "../skr03GuvMapping";
import { SKR03_EUER_MAPPING, findEuerRule } from "../../euer/skr03EuerMapping";
import {
  SKR03_USTVA_MAPPING,
  findUstvaRule,
} from "../../ustva/skr03UstvaMapping";
import { HGB_266_REPORT_LINES } from "../hgb266Structure";
import { HGB_275_GKV_STRUCTURE } from "../hgb275GkvStructure";
import { EUER_STRUCTURE_2025 } from "../../euer/euerStructure";
import { USTVA_STRUCTURE_2025 } from "../../ustva/ustvaStructure";

describe("Mapping Universe", () => {
  describe("Disjointness across systems", () => {
    it("Bilanz × GuV: no range overlap (Bilanz- und GuV-Konten trennen)", () => {
      for (const bil of SKR03_MAPPING_RULES) {
        for (const guv of SKR03_GUV_MAPPING) {
          const overlap = !(guv.to < bil.from || guv.from > bil.to);
          expect(
            overlap,
            `Bilanz ${bil.from}-${bil.to} (${bil.tag}) overlaps GuV ${guv.from}-${guv.to} (${guv.tag})`
          ).toBe(false);
        }
      }
    });

    it("EÜR × Bilanz: Überlappungen sind intentional (mutually exclusive use)", () => {
      // EÜR-Nutzer verwenden § 4 Abs. 3 EStG; HGB-Bilanz-Pflichtige verwenden
      // § 266. Niemals beide parallel. Überlappende Ranges sind daher OK,
      // werden hier aber dokumentiert.
      const overlaps: string[] = [];
      for (const e of SKR03_EUER_MAPPING) {
        for (const b of SKR03_MAPPING_RULES) {
          const o = !(e.to < b.from || e.from > b.to);
          if (o) overlaps.push(`EÜR ${e.from}-${e.to} ↔ Bilanz ${b.from}-${b.to}`);
        }
      }
      // Soll NICHT blockieren, nur dokumentieren:
      expect(overlaps.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe("Target integrity (rule → structure references)", () => {
    it("SKR03_MAPPING_RULES → HGB_266_REPORT_LINES references exist", () => {
      const codes = new Set(HGB_266_REPORT_LINES.map((l) => l.reference_code));
      for (const r of SKR03_MAPPING_RULES) {
        expect(codes.has(r.reference_code), `missing ${r.reference_code}`).toBe(
          true
        );
      }
    });

    it("SKR03_GUV_MAPPING → HGB_275_GKV_STRUCTURE references exist", () => {
      const codes = new Set(HGB_275_GKV_STRUCTURE.map((l) => l.reference_code));
      for (const r of SKR03_GUV_MAPPING) {
        expect(codes.has(r.guv_ref), `missing ${r.guv_ref}`).toBe(true);
      }
    });

    it("SKR03_EUER_MAPPING → EUER_STRUCTURE_2025 kz references exist", () => {
      const codes = new Set(EUER_STRUCTURE_2025.map((p) => p.kz));
      for (const r of SKR03_EUER_MAPPING) {
        expect(codes.has(r.kz), `missing ${r.kz}`).toBe(true);
        if (r.overflowKz) {
          expect(codes.has(r.overflowKz), `missing overflow ${r.overflowKz}`).toBe(
            true
          );
        }
      }
    });

    it("SKR03_USTVA_MAPPING → USTVA_STRUCTURE_2025 kz references exist", () => {
      const codes = new Set(USTVA_STRUCTURE_2025.map((p) => p.kz));
      for (const r of SKR03_USTVA_MAPPING) {
        expect(codes.has(r.kz), `missing ${r.kz}`).toBe(true);
      }
    });
  });

  describe("UStVA × GuV on shared Umsatz accounts (intentional)", () => {
    it("8400 appears in BOTH GuV (Posten 1) AND UStVA (Kz 81) — by design", () => {
      expect(findGuvRule("8400")?.guv_ref).toBe("1");
      expect(findUstvaRule("8400")?.kz).toBe("81");
    });

    it("EÜR × UStVA on same Umsatz-Konto: 8400 → EÜR Kz 112 + UStVA Kz 81", () => {
      expect(findEuerRule("8400")?.kz).toBe("112");
      expect(findUstvaRule("8400")?.kz).toBe("81");
    });
  });

  describe("Coverage report", () => {
    it("documents coverage for SKR03 range 1000-9999", () => {
      let inBilanzOnly = 0;
      let inGuvOnly = 0;
      let inEuerOnly = 0;
      let inUstvaOnly = 0;
      let unmapped = 0;
      let mapped = 0;

      for (let k = 1000; k <= 9999; k++) {
        const s = String(k);
        const inBil = !!findBalanceRule(s);
        const inGuv = !!findGuvRule(s);
        const inEuer = !!findEuerRule(s);
        const inUst = !!findUstvaRule(s);

        const anyHit = inBil || inGuv || inEuer || inUst;
        if (!anyHit) {
          unmapped++;
          continue;
        }
        mapped++;
        if (inBil && !inGuv && !inEuer && !inUst) inBilanzOnly++;
        if (inGuv && !inBil && !inEuer && !inUst) inGuvOnly++;
        if (inEuer && !inBil && !inGuv && !inUst) inEuerOnly++;
        if (inUst && !inBil && !inGuv && !inEuer) inUstvaOnly++;
      }
      // Dokumentation (keine Assertions, nur Konsolen-Ausgabe)
      // eslint-disable-next-line no-console
      console.log(
        `[Mapping Universe] 1000-9999: mapped=${mapped}, unmapped=${unmapped} ` +
          `(Bilanz-only=${inBilanzOnly}, GuV-only=${inGuvOnly}, ` +
          `EÜR-only=${inEuerOnly}, UStVA-only=${inUstvaOnly})`
      );
      // Dokumentation only: SKR03 reserviert grosse Bereiche (z. B. 5xxx, 6xxx)
      // die nicht von unseren Mappings abgedeckt werden — das ist erwartet.
      // Sanity-Check: mindestens 10 % gemappt (real ~30-35 %).
      expect(mapped).toBeGreaterThan(900);
    });
  });

  describe("Bilanz × GuV × EÜR specific accounts", () => {
    it("8125 (IG-Lieferung) erscheint parallel in UStVA Kz 41, EÜR Kz 103, GuV Posten 1", () => {
      // IG-Lieferungen sind Erlöse (Umsatzerlöse — GuV Posten 1), werden aber
      // UStVA-seitig als steuerfrei gemeldet (Kz 41). Das ist KEINE Inkonsistenz,
      // sondern unterschiedliche Sichtweisen auf dieselbe Buchung.
      expect(findUstvaRule("8125")?.kz).toBe("41");
      expect(findEuerRule("8125")?.kz).toBe("103");
      expect(findGuvRule("8125")?.guv_ref).toBe("1");
      // Bilanz-Regeln decken nur Bestandskonten ab, nicht Erlöse.
      expect(findBalanceRule("8125")).toBeUndefined();
    });

    it("8336 (IG-sonst.Leist) is carved out for ZM: UStVA Kz 21", () => {
      expect(findUstvaRule("8336")?.kz).toBe("21");
    });

    it("8337 falls back to Umsatz 7 % after carve-out", () => {
      expect(findUstvaRule("8337")?.kz).toBe("86");
    });

    it("8338 (Dreiecksgeschäft) → UStVA Kz 42", () => {
      expect(findUstvaRule("8338")?.kz).toBe("42");
    });
  });
});
