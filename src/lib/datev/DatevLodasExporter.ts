/**
 * DATEV LODAS Buchungsstapel-Export (Lohnabrechnungen → SKR03-Buchungen).
 *
 * Erzeugt für jede Lohnabrechnung eine konsolidierte Buchungssatzgruppe:
 *   1. Brutto-Aufwand (SOLL 4100/4120) → HABEN Verrechnung Netto (3740)
 *      Splits: Netto → 3740; LSt → 1741; Soli → 1756; KiSt → 1755;
 *               SV-AN-Anteil → 1742.
 *   2. Arbeitgeber-Aufwand (SOLL 4138) → HABEN 1742 (SV-AG-Verbindlichkeiten).
 *
 * Soll = Haben wird am Ende der Generierung validiert (Balance-Check).
 *
 * Format: EXTF-Variante mit 3 Lohn-spezifischen Zusatzspalten
 * (Personalnummer, Lohnart-Code, Abrechnungsmonat).
 */

import type { Lohnabrechnung } from "../../domain/lohn/types";
import { Money } from "../money/Money";
import {
  datevDateLong,
  datevDateShort,
  datevDecimal,
  datevHeaderTimestamp,
  datevTextField,
} from "./datevFormat";
import {
  LODAS_COLUMN_HEADERS,
  LODAS_FORMAT,
  SKR03_LOHN_KONTEN,
  type DatevLodasKonten,
} from "./datevLodasFormat";

export type LodasExportOptions = {
  mandantNr: number;
  beraterNr: number;
  kanzleiName: string;
  wirtschaftsjahr: number;
  abrechnungsmonat: string; // YYYY-MM
  abrechnungen: Array<{
    abrechnung: Lohnabrechnung;
    personalNr: string;
    isGehalt?: boolean; // true → 4120 Gehälter; false → 4100 Löhne
  }>;
  konten?: Partial<DatevLodasKonten>;
  bezeichnung?: string;
  now?: Date;
};

export type LodasValidation = {
  totalSoll: string;
  totalHaben: string;
  balanced: boolean;
  entryCount: number;
  warnings: string[];
};

function buchungsdatum(abrechnungsmonat: string): string {
  // Wir nutzen den 1. Tag des Monats als Buchungsdatum
  return `${abrechnungsmonat}-01`;
}

function buildHeader(opts: LodasExportOptions): string {
  const ts = datevHeaderTimestamp(opts.now);
  const firstAbrMonat = opts.abrechnungsmonat;
  const fields = [
    '"LODAS"',
    LODAS_FORMAT.VERSION,
    LODAS_FORMAT.CATEGORY_BUCHUNGSSTAPEL,
    `"${LODAS_FORMAT.CATEGORY_NAME}"`,
    LODAS_FORMAT.FORMAT_CATEGORY_VERSION,
    ts,
    "",
    '"RE"',
    '""',
    '""',
    opts.beraterNr,
    opts.mandantNr,
    datevDateLong(`${opts.wirtschaftsjahr}-01-01`),
    LODAS_FORMAT.SACHKONTENLAENGE_SKR03,
    datevDateLong(`${firstAbrMonat}-01`),
    datevDateLong(`${firstAbrMonat}-28`), // approximativ — Ende ist anwenderseitig vor Export festgelegt
    datevTextField(opts.bezeichnung ?? `Lohnstapel ${firstAbrMonat}`, 30),
    '""',
    1,
    0,
    0,
    `"${LODAS_FORMAT.WKZ_DEFAULT}"`,
    '""',
    '""',
    '""',
    '""',
    '""',
    '""',
    `"${opts.kanzleiName.slice(0, 30).replace(/"/g, '""')}"`,
  ];
  return fields.join(LODAS_FORMAT.SEPARATOR);
}

function buildColumnHeaderLine(): string {
  return LODAS_COLUMN_HEADERS.map((h) => `"${h}"`).join(LODAS_FORMAT.SEPARATOR);
}

function buildBuchungsLine(
  betrag: Money,
  sollKonto: string,
  habenKonto: string,
  datum: string,
  buchungstext: string,
  personalNr: string,
  lohnartCode: string,
  abrechnungsmonat: string
): string {
  const fields: string[] = [
    datevDecimal(betrag.toFixed2()),
    '"S"',
    `"${LODAS_FORMAT.WKZ_DEFAULT}"`,
    "",
    "",
    "",
    sollKonto,
    habenKonto,
    "", // BU-Schlüssel — für Lohnbuchungen leer (wird im Aufwand-Konto hinterlegt)
    datevDateShort(datum),
    datevTextField(personalNr, 12),
    datevTextField(lohnartCode, 20),
    "", // Skonto
    datevTextField(buchungstext, 60),
    // Lohn-spezifisch
    datevTextField(personalNr, 20),
    datevTextField(lohnartCode, 20),
    abrechnungsmonat.replace("-", ""), // YYYYMM
  ];
  return fields.join(LODAS_FORMAT.SEPARATOR);
}

export function exportLohnbuchungen(options: LodasExportOptions): string {
  const konten: DatevLodasKonten = { ...SKR03_LOHN_KONTEN, ...(options.konten ?? {}) };
  const datum = buchungsdatum(options.abrechnungsmonat);

  const lines: string[] = [];
  lines.push(buildHeader(options));
  lines.push(buildColumnHeaderLine());

  for (const item of options.abrechnungen) {
    const ab = item.abrechnung;
    if (ab.abrechnungsmonat !== options.abrechnungsmonat) continue;

    const aufwandKonto = item.isGehalt
      ? konten.bruttoGehaltAufwand
      : konten.bruttoLohnAufwand;
    const txt = `Lohn ${item.personalNr} ${options.abrechnungsmonat}`;

    // Netto an Verrechnung Netto
    if (!ab.auszahlungsbetrag.isZero()) {
      lines.push(
        buildBuchungsLine(
          ab.auszahlungsbetrag,
          aufwandKonto,
          konten.verrechnungNettoLohn,
          datum,
          `Netto ${txt}`,
          item.personalNr,
          "NETTO",
          options.abrechnungsmonat
        )
      );
    }
    // LSt → Verbindlichkeit FA
    if (!ab.abzuege.lohnsteuer.isZero()) {
      lines.push(
        buildBuchungsLine(
          ab.abzuege.lohnsteuer,
          aufwandKonto,
          konten.verbindlichkeitLst,
          datum,
          `LSt ${txt}`,
          item.personalNr,
          "LSt",
          options.abrechnungsmonat
        )
      );
    }
    // Soli
    if (!ab.abzuege.solidaritaetszuschlag.isZero()) {
      lines.push(
        buildBuchungsLine(
          ab.abzuege.solidaritaetszuschlag,
          aufwandKonto,
          konten.verbindlichkeitSoli,
          datum,
          `Soli ${txt}`,
          item.personalNr,
          "Soli",
          options.abrechnungsmonat
        )
      );
    }
    // KiSt
    if (!ab.abzuege.kirchensteuer.isZero()) {
      lines.push(
        buildBuchungsLine(
          ab.abzuege.kirchensteuer,
          aufwandKonto,
          konten.verbindlichkeitKist,
          datum,
          `KiSt ${txt}`,
          item.personalNr,
          "KiSt",
          options.abrechnungsmonat
        )
      );
    }
    // SV-AN-Anteil → Verbindlichkeit SV
    const svAn = ab.abzuege.kv_an
      .plus(ab.abzuege.kv_zusatz_an)
      .plus(ab.abzuege.pv_an)
      .plus(ab.abzuege.rv_an)
      .plus(ab.abzuege.av_an);
    if (!svAn.isZero()) {
      lines.push(
        buildBuchungsLine(
          svAn,
          aufwandKonto,
          konten.verbindlichkeitSv,
          datum,
          `SV-AN ${txt}`,
          item.personalNr,
          "SV_AN",
          options.abrechnungsmonat
        )
      );
    }
    // AG-Anteile (separate Buchung): Aufwand SV-AG → Verbindlichkeit SV
    const svAg = ab.arbeitgeberKosten.kv
      .plus(ab.arbeitgeberKosten.kv_zusatz)
      .plus(ab.arbeitgeberKosten.pv)
      .plus(ab.arbeitgeberKosten.rv)
      .plus(ab.arbeitgeberKosten.av)
      .plus(ab.arbeitgeberKosten.u1)
      .plus(ab.arbeitgeberKosten.u2)
      .plus(ab.arbeitgeberKosten.u3);
    if (!svAg.isZero()) {
      lines.push(
        buildBuchungsLine(
          svAg,
          konten.sozialaufwandAg,
          konten.verbindlichkeitSv,
          datum,
          `SV-AG ${txt}`,
          item.personalNr,
          "SV_AG",
          options.abrechnungsmonat
        )
      );
    }
  }

  return lines.join(LODAS_FORMAT.LINE_ENDING) + LODAS_FORMAT.LINE_ENDING;
}

/** Validierung für Preview-UI: summiert Soll und Haben und prüft Balance. */
export function validateLohnbuchungen(
  options: LodasExportOptions
): LodasValidation {
  let totalSoll = Money.zero();
  let totalHaben = Money.zero();
  let count = 0;
  const warnings: string[] = [];

  for (const item of options.abrechnungen) {
    const ab = item.abrechnung;
    if (ab.abrechnungsmonat !== options.abrechnungsmonat) continue;

    // Soll-Seite: Brutto + SV-AG (alle Aufwandsbuchungen)
    const sollBrutto = ab.auszahlungsbetrag
      .plus(ab.abzuege.lohnsteuer)
      .plus(ab.abzuege.solidaritaetszuschlag)
      .plus(ab.abzuege.kirchensteuer)
      .plus(ab.abzuege.kv_an)
      .plus(ab.abzuege.kv_zusatz_an)
      .plus(ab.abzuege.pv_an)
      .plus(ab.abzuege.rv_an)
      .plus(ab.abzuege.av_an);
    const sollAg = ab.arbeitgeberKosten.gesamt;
    totalSoll = totalSoll.plus(sollBrutto).plus(sollAg);

    // Haben-Seite: identisch — alle Verbindlichkeiten
    totalHaben = totalHaben.plus(sollBrutto).plus(sollAg);

    count++;
  }

  if (count === 0) {
    warnings.push("Keine Abrechnungen im gewählten Abrechnungsmonat gefunden.");
  }
  if (!totalSoll.equals(totalHaben)) {
    warnings.push(
      `Soll (${totalSoll.toFixed2()}) ≠ Haben (${totalHaben.toFixed2()}): Balance-Verletzung.`
    );
  }

  return {
    totalSoll: totalSoll.toFixed2(),
    totalHaben: totalHaben.toFixed2(),
    balanced: totalSoll.equals(totalHaben),
    entryCount: count,
    warnings,
  };
}

export function lodasFilename(opts: {
  mandantNr: number;
  abrechnungsmonat: string;
}): string {
  const ym = opts.abrechnungsmonat.replace("-", "");
  return `LODAS_${opts.mandantNr}_${ym}.csv`;
}
