/**
 * E-Bilanz XBRL-Builder (§ 5b EStG, HGB-Taxonomie 6.8).
 *
 * Erzeugt eine XBRL-Instance (de-gaap-ci 2025-04-01) mit:
 *   - XML-Header + Namespace-Deklarationen
 *   - Context `InstantReporting` (Bilanz-Stichtag)
 *   - Context `DurationReporting` (GuV-Periode)
 *   - Unit `EUR` (iso4217:EUR)
 *   - Dokumenteninformationen (de-gcd:genInfo.*)
 *   - Stammdaten Unternehmen (de-gcd:genInfo.company.*)
 *   - Bilanz-Facts (gemäß BILANZ_XBRL_MAP)
 *   - GuV-Facts (gemäß GUV_XBRL_MAP)
 *
 * Geltungsbereich:
 *   - Decimal-Format: Punkt (nicht Komma) — ISO-konform
 *   - decimals="INF" für Money-Werte (wir geben immer 2 Nachkommastellen aus)
 *   - Zero-Werte werden weggelassen (außer Pflichtfeldern)
 *   - XML ist well-formed aber NICHT gegen offizielle XSDs validiert — das
 *     erfordert einen XSD-Parser gegen die BMF-Taxonomie-Dateien (out of scope).
 */

import type { Money } from "../../lib/money/Money";
import { flattenForRender } from "../accounting/BalanceSheetBuilder";
import {
  bilanzElement,
  EBILANZ_NAMESPACES,
  guvElement,
} from "./hgbTaxonomie68";
import {
  validateEbilanz,
  type EbilanzInput,
  type ValidationResult,
} from "./EbilanzValidator";

const CONTEXT_INSTANT = "CurrentPeriodInstant";
const CONTEXT_DURATION = "CurrentPeriodDuration";
const UNIT_EUR = "EUR";

export type EbilanzBuildResult = {
  xml: string;
  validation: ValidationResult;
};

export class EbilanzXbrlBuilder {
  /**
   * Baut die XBRL-Instance. Gibt validation zurück — bei Errors ist das XML
   * trotzdem verfügbar (für Debug/Preview), sollte aber NICHT übermittelt werden.
   */
  build(input: EbilanzInput): EbilanzBuildResult {
    const validation = validateEbilanz(input);

    const sections: string[] = [];
    sections.push(this.buildContexts(input));
    sections.push(this.buildUnit());
    sections.push(this.buildDokumentinfo(input));
    sections.push(this.buildStammdaten(input));
    sections.push(this.buildBilanzFacts(input));
    sections.push(this.buildGuvFacts(input));

    const xml = this.buildEnvelope(sections.join("\n"));
    return { xml, validation };
  }

  // ---------- Envelope ----------
  private buildEnvelope(body: string): string {
    const nsDecls = Object.entries(EBILANZ_NAMESPACES)
      .map(([prefix, uri]) =>
        prefix === "xbrli" ? `xmlns="${uri}"` : `xmlns:${prefix}="${uri}"`
      )
      .join("\n    ");
    return `<?xml version="1.0" encoding="UTF-8"?>
<xbrli:xbrl
    ${nsDecls}>
${body}
</xbrli:xbrl>
`;
  }

  // ---------- Context ----------
  private buildContexts(input: EbilanzInput): string {
    const stichtag = input.wirtschaftsjahr.bis;
    const von = input.wirtschaftsjahr.von;
    // Identifier-Schema ist durch BMF festgelegt; wir nutzen die Steuernummer
    // über ein generisches Schema.
    const scheme = "http://www.esteuer.de/ebilanz/taxid";
    const ident = this.xmlEscape(input.unternehmen.steuernummer || "UNKNOWN");
    return `
  <xbrli:context id="${CONTEXT_INSTANT}">
    <xbrli:entity>
      <xbrli:identifier scheme="${scheme}">${ident}</xbrli:identifier>
    </xbrli:entity>
    <xbrli:period>
      <xbrli:instant>${stichtag}</xbrli:instant>
    </xbrli:period>
  </xbrli:context>
  <xbrli:context id="${CONTEXT_DURATION}">
    <xbrli:entity>
      <xbrli:identifier scheme="${scheme}">${ident}</xbrli:identifier>
    </xbrli:entity>
    <xbrli:period>
      <xbrli:startDate>${von}</xbrli:startDate>
      <xbrli:endDate>${stichtag}</xbrli:endDate>
    </xbrli:period>
  </xbrli:context>`;
  }

  // ---------- Unit ----------
  private buildUnit(): string {
    return `
  <xbrli:unit id="${UNIT_EUR}">
    <xbrli:measure>iso4217:EUR</xbrli:measure>
  </xbrli:unit>`;
  }

  // ---------- Dokumenteninformationen ----------
  private buildDokumentinfo(input: EbilanzInput): string {
    const docId = `harouda-app-${input.wirtschaftsjahr.bis}-${Date.now()}`;
    const creationDate = new Date().toISOString().slice(0, 10);
    const parts = [
      this.textFact(
        "de-gcd:genInfo.doc.id",
        docId,
        CONTEXT_DURATION
      ),
      this.textFact(
        "de-gcd:genInfo.doc.creationDate",
        creationDate,
        CONTEXT_DURATION
      ),
      this.textFact(
        "de-gcd:genInfo.doc.status",
        input.status,
        CONTEXT_DURATION
      ),
      this.textFact(
        "de-gcd:genInfo.report.id",
        docId + "-report",
        CONTEXT_DURATION
      ),
      this.textFact(
        "de-gcd:genInfo.report.period.fiscalYearBegin",
        input.wirtschaftsjahr.von,
        CONTEXT_DURATION
      ),
      this.textFact(
        "de-gcd:genInfo.report.period.fiscalYearEnd",
        input.wirtschaftsjahr.bis,
        CONTEXT_DURATION
      ),
      this.textFact(
        "de-gcd:genInfo.report.currency",
        "EUR",
        CONTEXT_DURATION
      ),
      this.textFact(
        "de-gcd:genInfo.report.roundingPrecision",
        "one",
        CONTEXT_DURATION
      ),
      this.textFact(
        "de-gcd:genInfo.report.orientation.rechtsform",
        input.unternehmen.rechtsform,
        CONTEXT_DURATION
      ),
      this.textFact(
        "de-gcd:genInfo.report.orientation.size",
        input.unternehmen.groessenklasse,
        CONTEXT_DURATION
      ),
    ];
    return parts.join("\n");
  }

  // ---------- Stammdaten Unternehmen ----------
  private buildStammdaten(input: EbilanzInput): string {
    const u = input.unternehmen;
    const parts = [
      this.textFact(
        "de-gcd:genInfo.company.id.taxNumber",
        u.steuernummer,
        CONTEXT_DURATION
      ),
      this.textFact("de-gcd:genInfo.company.name", u.name, CONTEXT_DURATION),
      this.textFact(
        "de-gcd:genInfo.company.address.street",
        u.strasse,
        CONTEXT_DURATION
      ),
      this.textFact(
        "de-gcd:genInfo.company.address.zip",
        u.plz,
        CONTEXT_DURATION
      ),
      this.textFact(
        "de-gcd:genInfo.company.address.city",
        u.ort,
        CONTEXT_DURATION
      ),
    ];
    return parts.filter((p) => p.trim() !== "").join("\n");
  }

  // ---------- Bilanz-Facts ----------
  private buildBilanzFacts(input: EbilanzInput): string {
    const lines: string[] = [];
    const rows = [
      ...flattenForRender(input.bilanz.aktivaRoot).slice(1),
      ...flattenForRender(input.bilanz.passivaRoot).slice(1),
    ];
    const seen = new Set<string>();
    for (const row of rows) {
      if (row.isLeafEntry) continue; // Leaf-Buckets haben redundante Refs (:leaf)
      const element = bilanzElement(row.node.referenceCode);
      if (!element) continue;
      if (seen.has(element)) continue;
      seen.add(element);
      const bal = row.balance;
      if (bal.isZero()) continue;
      lines.push(this.moneyFact(element, bal, CONTEXT_INSTANT));
    }
    return lines.join("\n");
  }

  // ---------- GuV-Facts ----------
  private buildGuvFacts(input: EbilanzInput): string {
    const lines: string[] = [];
    const seen = new Set<string>();
    for (const p of input.guv.positionen) {
      const element = guvElement(p.reference_code);
      if (!element) continue;
      if (seen.has(element)) continue;
      seen.add(element);
      if (p.amountRaw.isZero()) continue;
      lines.push(this.moneyFact(element, p.amountRaw, CONTEXT_DURATION));
    }
    return lines.join("\n");
  }

  // ---------- Fact-Helpers ----------
  private moneyFact(
    element: string,
    value: Money,
    contextRef: string
  ): string {
    return `  <${element} contextRef="${contextRef}" unitRef="${UNIT_EUR}" decimals="2">${value.toFixed2()}</${element}>`;
  }

  private textFact(
    element: string,
    value: string | null | undefined,
    contextRef: string
  ): string {
    if (!value || !value.trim()) return "";
    return `  <${element} contextRef="${contextRef}">${this.xmlEscape(value)}</${element}>`;
  }

  private xmlEscape(s: string): string {
    return s
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&apos;");
  }
}
