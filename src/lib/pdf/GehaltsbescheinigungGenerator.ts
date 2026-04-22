/**
 * Gehaltsbescheinigung nach § 108 GewO.
 *
 * Pflichtbestandteile:
 *   1. Arbeitgeber-Block
 *   2. Arbeitnehmer-Block (Name, PersonalNr, StKl, SV-Nr, IdNr)
 *   3. Abrechnungsmonat
 *   4. Bruttobezüge (Auflistung)
 *   5. Abzüge (LSt, Soli, KiSt, SV-AN je Zweig)
 *   6. Netto-Auszahlungsbetrag
 *   7. Optional: Arbeitgeber-Kosten (Information)
 *   8. Unterschriften-Zeile
 *   9. Footer mit Hash (Integrität) + Erstellungszeitpunkt
 */

import type { Arbeitnehmer, Lohnabrechnung } from "../../domain/lohn/types";
import { Money } from "../money/Money";
import { computeAbrechnungHash } from "../crypto/payrollHash";
import { PdfReportBase, type PdfReportOptions } from "./PdfBase";

export type GehaltsbescheinigungOptions = PdfReportOptions & {
  arbeitnehmer: Arbeitnehmer;
  abrechnung: Lohnabrechnung;
  showArbeitgeberKosten?: boolean;
};

export class GehaltsbescheinigungGenerator extends PdfReportBase {
  async generate(options: GehaltsbescheinigungOptions): Promise<Blob> {
    const { arbeitnehmer: an, abrechnung: ab } = options;

    this.addHeader({
      ...options,
      title: "Gehaltsbescheinigung",
      subtitle: `§ 108 GewO · Abrechnungsmonat ${ab.abrechnungsmonat}`,
    });

    // Arbeitnehmer-Block
    this.addSection("Arbeitnehmer");
    this.addKeyValue("Name", `${an.vorname} ${an.name}`);
    this.addKeyValue("Personal-Nr.", an.personalNr);
    this.addKeyValue("Geburtsdatum", an.geburtsdatum);
    this.addKeyValue("SV-Nummer", an.sv_nummer || "—");
    this.addKeyValue("Steuer-ID", an.steuer_id || "—");
    this.addKeyValue("Steuerklasse", String(an.steuerklasse));
    if (an.kirchensteuerpflichtig) {
      this.addKeyValue("Konfession", an.konfession);
    }
    this.addKeyValue("Beschäftigungsart", an.beschaeftigungsart);
    this.addKeyValue("Bundesland", an.bundesland);

    // Bruttobezüge
    this.addSection("Bruttobezüge");
    this.addKeyValue("Laufender Brutto", this.formatMoney(ab.laufenderBrutto));
    if (!ab.sonstigeBezuege.isZero()) {
      this.addKeyValue(
        "Sonstige Bezüge",
        this.formatMoney(ab.sonstigeBezuege)
      );
    }
    this.addKeyValue("Gesamtbrutto", this.formatMoney(ab.gesamtBrutto), {
      bold: true,
    });

    // Abzüge
    this.addSection("Abzüge (Arbeitnehmer)");
    this.addKeyValue("Lohnsteuer", this.formatMoney(ab.abzuege.lohnsteuer));
    if (!ab.abzuege.solidaritaetszuschlag.isZero()) {
      this.addKeyValue(
        "Solidaritätszuschlag",
        this.formatMoney(ab.abzuege.solidaritaetszuschlag)
      );
    }
    if (!ab.abzuege.kirchensteuer.isZero()) {
      this.addKeyValue(
        `Kirchensteuer (${an.konfession})`,
        this.formatMoney(ab.abzuege.kirchensteuer)
      );
    }
    this.addKeyValue("KV-Beitrag (AN)", this.formatMoney(ab.abzuege.kv_an));
    if (!ab.abzuege.kv_zusatz_an.isZero()) {
      this.addKeyValue(
        "KV-Zusatzbeitrag (AN)",
        this.formatMoney(ab.abzuege.kv_zusatz_an)
      );
    }
    this.addKeyValue("PV-Beitrag (AN)", this.formatMoney(ab.abzuege.pv_an));
    this.addKeyValue("RV-Beitrag (AN)", this.formatMoney(ab.abzuege.rv_an));
    this.addKeyValue("AV-Beitrag (AN)", this.formatMoney(ab.abzuege.av_an));
    this.addKeyValue(
      "Summe Abzüge",
      this.formatMoney(ab.abzuege.gesamtAbzuege),
      { bold: true }
    );

    // Netto (prominent)
    this.currentY += 3;
    const netto = ab.auszahlungsbetrag;
    const nettoColor: [number, number, number] = netto.isNegative()
      ? [138, 44, 44]
      : [31, 122, 77];
    this.pdf.setFontSize(14);
    this.pdf.setFont("helvetica", "bold");
    this.pdf.setTextColor(...nettoColor);
    this.pdf.text(
      `Auszahlungsbetrag: ${netto.toEuroFormat()}`,
      this.pdf.internal.pageSize.getWidth() - this.margins.right,
      this.currentY + 4,
      { align: "right" }
    );
    this.pdf.setTextColor(0, 0, 0);
    this.pdf.setFontSize(10);
    this.pdf.setFont("helvetica", "normal");
    this.currentY += 10;

    // Optional AG-Kosten
    if (options.showArbeitgeberKosten) {
      this.addSection("Arbeitgeber-Kosten (nicht Teil des Bruttos)");
      this.addKeyValue(
        "KV-AG + Zusatz",
        this.formatMoney(ab.arbeitgeberKosten.kv.plus(ab.arbeitgeberKosten.kv_zusatz))
      );
      this.addKeyValue("PV-AG", this.formatMoney(ab.arbeitgeberKosten.pv));
      this.addKeyValue("RV-AG", this.formatMoney(ab.arbeitgeberKosten.rv));
      this.addKeyValue("AV-AG", this.formatMoney(ab.arbeitgeberKosten.av));
      this.addKeyValue(
        "Umlagen (U1/U2/U3)",
        this.formatMoney(
          ab.arbeitgeberKosten.u1
            .plus(ab.arbeitgeberKosten.u2)
            .plus(ab.arbeitgeberKosten.u3)
        )
      );
      this.addKeyValue(
        "Gesamtkosten Arbeitgeber",
        this.formatMoney(ab.gesamtkostenArbeitgeber),
        { bold: true }
      );
    }

    // Unterschriften
    this.currentY += 15;
    const width =
      this.pdf.internal.pageSize.getWidth() -
      this.margins.left -
      this.margins.right;
    const halfW = width / 2 - 10;
    this.pdf.setDrawColor(100, 100, 100);
    this.pdf.line(
      this.margins.left,
      this.currentY,
      this.margins.left + halfW,
      this.currentY
    );
    this.pdf.line(
      this.margins.left + halfW + 20,
      this.currentY,
      this.margins.left + halfW + 20 + halfW,
      this.currentY
    );
    this.pdf.setFontSize(8);
    this.pdf.setTextColor(100, 100, 100);
    this.pdf.text(
      "Unterschrift Arbeitgeber",
      this.margins.left,
      this.currentY + 5
    );
    this.pdf.text(
      "Unterschrift Arbeitnehmer",
      this.margins.left + halfW + 20,
      this.currentY + 5
    );
    this.pdf.setTextColor(0, 0, 0);
    this.pdf.setFontSize(10);

    // Integrität-Hash im Footer
    const hash = await computeAbrechnungHash({
      an: an.id,
      monat: ab.abrechnungsmonat,
      brutto: ab.gesamtBrutto.toFixed2(),
      netto: ab.auszahlungsbetrag.toFixed2(),
    });
    this.addFooter({
      ...options,
      disclaimer: `§ 108 GewO · Integrity-Hash ${hash.slice(0, 16)}…`,
    });

    return this.toBlob();
  }
}
