/**
 * AnlagenService — orchestriert Anlagegut-Stammdaten, AfA-Berechnung,
 * AfA-Lauf-Planung und Anlagenspiegel-Aggregation.
 *
 * Sprint 6 Teil 1. Design-Prinzipien:
 *
 *  - `planAfaLauf` und `getAnlagenspiegelData` sind **pure functions**
 *    (Eingabe: Anlagegut-Liste, Rückgabe: strukturiertes Ergebnis ohne
 *    I/O). Das erlaubt vollständige Testabdeckung ohne localStorage-
 *    oder Supabase-Setup.
 *
 *  - `createAnlageWithOpening` und `commitAfaLauf` sind die einzigen
 *    impure Pfade; sie rufen Repo-Funktionen und `createEntry` auf.
 *
 *  - AfA-Buchungen folgen der direkten Netto-Methode (SKR03-Standard):
 *    Soll AfA-Aufwandskonto (z. B. 4830) / Haben Anlage-Konto (z. B.
 *    0440). Wenn `konto_abschreibung_kumuliert` am Anlagegut gesetzt
 *    ist, bucht die AfA stattdessen auf dieses Konto (indirekte Brutto-
 *    Methode) — SKR03 3-Dim-Konvention für Betriebe mit expliziter
 *    HGB-§-284-Brutto-Darstellung.
 *
 *  - Anlagenspiegel HGB § 284: strukturiertes Daten-Objekt. UI, PDF-
 *    Ausgabe und Bilanz-Anhang-Integration kommen in Teil 2.
 */

import Decimal from "decimal.js";
import type { Anlagegut, JournalEntry } from "../../types/db";
import {
  berechneLineareAfa,
  berechneGwgAfa,
  berechneSammelpostenAfa,
  type AfaLinearResult,
} from "./AfaCalculator";
import {
  createAnlagegut,
  patchAnlageRaw,
  saveAfaBuchung,
  type AnlagegutInput,
} from "../../api/anlagen";
import { createEntry, type JournalInput } from "../../api/journal";

// --- Planung eines AfA-Laufs ------------------------------------------------

export type AfaLaufPlanLine = {
  anlage: Anlagegut;
  jahr: number;
  afa_betrag: number;
  restbuchwert: number;
  /** Vorbereiteter Journal-Eintrag. Wird erst auf Bestätigung gebucht. */
  journal_input: JournalInput;
};

export type AfaLaufWarning = {
  anlage: Anlagegut;
  reason: string;
};

export type AfaLaufPlan = {
  jahr: number;
  lines: AfaLaufPlanLine[];
  warnings: AfaLaufWarning[];
  summe: number;
};

export function planAfaLauf(
  jahr: number,
  gueter: Anlagegut[]
): AfaLaufPlan {
  const lines: AfaLaufPlanLine[] = [];
  const warnings: AfaLaufWarning[] = [];
  let summe = new Decimal(0);

  for (const anlage of gueter) {
    if (!anlage.aktiv) {
      // inaktive/abgegangene Anlagen grundsätzlich überspringen
      continue;
    }

    const ak_dec = new Decimal(anlage.anschaffungskosten);
    const kaufdatum = new Date(anlage.anschaffungsdatum + "T00:00:00Z");
    const abgangObj = anlage.abgangsdatum
      ? new Date(anlage.abgangsdatum + "T00:00:00Z")
      : null;

    let result: AfaLinearResult;
    try {
      switch (anlage.afa_methode) {
        case "linear":
          result = berechneLineareAfa({
            anschaffungskosten: ak_dec,
            nutzungsdauer_jahre: anlage.nutzungsdauer_jahre,
            anschaffungsdatum: kaufdatum,
            jahr,
            abgangsdatum: abgangObj,
          });
          break;
        case "gwg_sofort":
          result = berechneGwgAfa({
            anschaffungskosten: ak_dec,
            anschaffungsdatum: kaufdatum,
            jahr,
          });
          break;
        case "sammelposten":
          result = berechneSammelpostenAfa({
            anschaffungskosten: ak_dec,
            anschaffungsdatum: kaufdatum,
            jahr,
          });
          break;
        default:
          warnings.push({
            anlage,
            reason: `AfA-Methode '${anlage.afa_methode}' ist nicht implementiert — übersprungen.`,
          });
          continue;
      }
    } catch (err) {
      warnings.push({
        anlage,
        reason: `Berechnung fehlgeschlagen: ${(err as Error).message}`,
      });
      continue;
    }

    if (result.afa_betrag.lte(0)) {
      continue; // keine AfA-Wirkung im Jahr (vor Anschaffung oder nach Ende)
    }

    const haben_konto =
      anlage.konto_abschreibung_kumuliert || anlage.konto_anlage;

    const betrag = result.afa_betrag.toNumber();
    summe = summe.plus(result.afa_betrag);

    lines.push({
      anlage,
      jahr,
      afa_betrag: betrag,
      restbuchwert: result.restbuchwert.toNumber(),
      journal_input: {
        datum: `${jahr}-12-31`,
        beleg_nr: `AfA-${jahr}-${anlage.inventar_nr}`.slice(0, 50),
        beschreibung:
          `AfA linear ${anlage.bezeichnung} (${anlage.inventar_nr})`.slice(
            0,
            140
          ),
        soll_konto: anlage.konto_afa,
        haben_konto,
        betrag,
        ust_satz: null,
        status: "gebucht",
        client_id: null,
        skonto_pct: null,
        skonto_tage: null,
        gegenseite: null,
        faelligkeit: null,
        kostenstelle: null,
        kostentraeger: null,
      },
    });
  }

  return { jahr, lines, warnings, summe: summe.toNumber() };
}

// --- Anlagenspiegel-Daten (HGB § 284) --------------------------------------

export type AnlagenspiegelGruppe = {
  /** Gruppierungs-Schlüssel = Bestandskonto (z. B. '0440'). */
  konto_anlage: string;
  /** Aggregierte Anlagegut-Bezeichnungen (max. 3 sichtbar, Rest als
   *  "… und N weitere" — nur für UI-Labels, nicht für Berechnungen).
   *  Optional: Alt-Fixtures ohne das Feld zeigen nur die Konto-Nummer. */
  bezeichnungen?: string[];
  anzahl: number;
  /** Anschaffungskosten-Summe zu Beginn des Jahres bis_jahr. */
  ak_start: number;
  /** Zugänge im Laufe von bis_jahr. */
  zugaenge: number;
  /** Abgänge im Laufe von bis_jahr (AK-Wert zum Abgangszeitpunkt). */
  abgaenge: number;
  /** Anschaffungskosten zum Ende von bis_jahr. */
  ak_ende: number;
  /** Kumulierte AfA zum Ende von bis_jahr. */
  abschreibungen_kumuliert: number;
  /** Buchwert zu Beginn des Jahres (AK-Start – kum. AfA bis Ende Vorjahr). */
  buchwert_start: number;
  /** Buchwert zum Ende des Jahres (AK-Ende – kum. AfA bis Ende bis_jahr). */
  buchwert_ende: number;
};

export type AnlagenspiegelData = {
  bis_jahr: number;
  gruppen: AnlagenspiegelGruppe[];
  totals: AnlagenspiegelGruppe;
};

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function emptyGruppe(konto: string): AnlagenspiegelGruppe {
  return {
    konto_anlage: konto,
    bezeichnungen: [],
    anzahl: 0,
    ak_start: 0,
    zugaenge: 0,
    abgaenge: 0,
    ak_ende: 0,
    abschreibungen_kumuliert: 0,
    buchwert_start: 0,
    buchwert_ende: 0,
  };
}

/**
 * Aggregiert pro Bestandskonto die HGB-§-284-Werte für das Jahr `bis_jahr`.
 *
 * Invariante (pro Gruppe): `buchwert_start + zugaenge − abgaenge − afa_im_jahr == buchwert_ende`,
 * wobei `afa_im_jahr = abschreibungen_kumuliert − (AK_start − buchwert_start)`.
 * Kurz: `buchwert_ende = ak_ende − abschreibungen_kumuliert`.
 */
export function getAnlagenspiegelData(
  bis_jahr: number,
  gueter: Anlagegut[]
): AnlagenspiegelData {
  const byKonto = new Map<string, AnlagenspiegelGruppe>();

  for (const anlage of gueter) {
    const anschaffJahr = Number(anlage.anschaffungsdatum.slice(0, 4));
    const abgangJahr = anlage.abgangsdatum
      ? Number(anlage.abgangsdatum.slice(0, 4))
      : null;

    if (anschaffJahr > bis_jahr) continue; // noch nicht im Zeitraum
    if (abgangJahr !== null && abgangJahr < bis_jahr) continue; // vor Zeitraum abgegangen

    let gruppe = byKonto.get(anlage.konto_anlage);
    if (!gruppe) {
      gruppe = emptyGruppe(anlage.konto_anlage);
      byKonto.set(anlage.konto_anlage, gruppe);
    }
    gruppe.anzahl++;
    if (!gruppe.bezeichnungen) gruppe.bezeichnungen = [];
    gruppe.bezeichnungen.push(anlage.bezeichnung);

    const ak = anlage.anschaffungskosten;
    const ak_dec = new Decimal(ak);
    const kaufdatum = new Date(anlage.anschaffungsdatum + "T00:00:00Z");

    // AK-Start: AK wenn angeschafft vor bis_jahr; 0 wenn in bis_jahr.
    if (anschaffJahr < bis_jahr) {
      gruppe.ak_start += ak;
    } else {
      gruppe.zugaenge += ak;
    }

    // Abgang im bis_jahr → aus AK-Stock heraus.
    if (abgangJahr === bis_jahr) {
      gruppe.abgaenge += ak;
    }

    // AK-Ende: AK, wenn am Ende des Jahres noch aktiv.
    if (abgangJahr === null || abgangJahr > bis_jahr) {
      gruppe.ak_ende += ak;
    }

    const abgangsdatumObj = anlage.abgangsdatum
      ? new Date(anlage.abgangsdatum + "T00:00:00Z")
      : null;

    // AfA pro Jahr je Methode. `afaFuerJahr` kapselt die methoden-
    // spezifische Berechnung und wird für Kumulativ-Summen je einmal pro
    // Jahr aufgerufen.
    const afaFuerJahr = (j: number): Decimal => {
      try {
        switch (anlage.afa_methode) {
          case "linear":
            return berechneLineareAfa({
              anschaffungskosten: ak_dec,
              nutzungsdauer_jahre: anlage.nutzungsdauer_jahre,
              anschaffungsdatum: kaufdatum,
              jahr: j,
              abgangsdatum: abgangsdatumObj,
            }).afa_betrag;
          case "gwg_sofort":
            return berechneGwgAfa({
              anschaffungskosten: ak_dec,
              anschaffungsdatum: kaufdatum,
              jahr: j,
            }).afa_betrag;
          case "sammelposten":
            return berechneSammelpostenAfa({
              anschaffungskosten: ak_dec,
              anschaffungsdatum: kaufdatum,
              jahr: j,
            }).afa_betrag;
          default:
            return new Decimal(0);
        }
      } catch {
        return new Decimal(0);
      }
    };

    // Kumulierte AfA bis Ende bis_jahr (inkl. Jahres-AfA, ggf. nur bis Abgang).
    let kumBisJahr = new Decimal(0);
    for (let j = anschaffJahr; j <= bis_jahr; j++) {
      kumBisJahr = kumBisJahr.plus(afaFuerJahr(j));
    }
    gruppe.abschreibungen_kumuliert += kumBisJahr.toNumber();

    // Kumulierte AfA bis Ende Vorjahr (bis_jahr − 1).
    let kumBisVorjahr = new Decimal(0);
    for (let j = anschaffJahr; j < bis_jahr; j++) {
      kumBisVorjahr = kumBisVorjahr.plus(afaFuerJahr(j));
    }

    // Buchwert-Start: nur für Anlagen, die bereits vor bis_jahr aktiv waren.
    if (anschaffJahr < bis_jahr) {
      gruppe.buchwert_start += ak_dec.sub(kumBisVorjahr).toNumber();
    }

    // Buchwert-Ende: für am Ende noch aktive Anlagen.
    if (abgangJahr === null || abgangJahr > bis_jahr) {
      gruppe.buchwert_ende += ak_dec.sub(kumBisJahr).toNumber();
    }
  }

  // Runden + sortieren.
  const gruppen = [...byKonto.values()]
    .map((g) => ({
      ...g,
      ak_start: round2(g.ak_start),
      zugaenge: round2(g.zugaenge),
      abgaenge: round2(g.abgaenge),
      ak_ende: round2(g.ak_ende),
      abschreibungen_kumuliert: round2(g.abschreibungen_kumuliert),
      buchwert_start: round2(g.buchwert_start),
      buchwert_ende: round2(g.buchwert_ende),
    }))
    .sort((a, b) => a.konto_anlage.localeCompare(b.konto_anlage));

  const totals = emptyGruppe("TOTAL");
  for (const g of gruppen) {
    totals.anzahl += g.anzahl;
    totals.ak_start += g.ak_start;
    totals.zugaenge += g.zugaenge;
    totals.abgaenge += g.abgaenge;
    totals.ak_ende += g.ak_ende;
    totals.abschreibungen_kumuliert += g.abschreibungen_kumuliert;
    totals.buchwert_start += g.buchwert_start;
    totals.buchwert_ende += g.buchwert_ende;
  }
  totals.ak_start = round2(totals.ak_start);
  totals.zugaenge = round2(totals.zugaenge);
  totals.abgaenge = round2(totals.abgaenge);
  totals.ak_ende = round2(totals.ak_ende);
  totals.abschreibungen_kumuliert = round2(totals.abschreibungen_kumuliert);
  totals.buchwert_start = round2(totals.buchwert_start);
  totals.buchwert_ende = round2(totals.buchwert_ende);

  return { bis_jahr, gruppen, totals };
}

// --- Impure Pfade ----------------------------------------------------------

export type CreateAnlageOpeningOptions = {
  /** Gegenkonto der Eröffnungsbuchung (z. B. '1200' Bank oder '1600'
   *  Verbindlichkeit). Wenn null/undefined: keine Buchung wird erzeugt
   *  (nur Stammdaten). */
  gegenkonto?: string | null;
  /** Buchungsdatum abweichend vom Anschaffungsdatum. Default:
   *  Anschaffungsdatum. */
  datum?: string;
};

/**
 * Legt eine Anlage an und erzeugt — wenn `opts.gegenkonto` gesetzt ist —
 * die Eröffnungs-/Anschaffungsbuchung Soll Anlage-Konto / Haben Gegenkonto.
 */
export async function createAnlageWithOpening(
  input: AnlagegutInput,
  opts: CreateAnlageOpeningOptions = {},
  clientId: string | null
): Promise<{ anlage: Anlagegut; journal: JournalEntry | null }> {
  const anlage = await createAnlagegut(input, clientId);
  if (!opts.gegenkonto) {
    return { anlage, journal: null };
  }
  const journal = await createEntry({
    datum: opts.datum || input.anschaffungsdatum,
    beleg_nr: `ANL-${anlage.inventar_nr}`.slice(0, 40),
    beschreibung: `Anschaffungsbuchung ${anlage.bezeichnung}`.slice(0, 140),
    soll_konto: input.konto_anlage,
    haben_konto: opts.gegenkonto,
    betrag: input.anschaffungskosten,
    ust_satz: null,
    status: "gebucht",
    client_id: null,
    skonto_pct: null,
    skonto_tage: null,
    gegenseite: null,
    faelligkeit: null,
  });
  return { anlage, journal };
}

/**
 * Bucht einen zuvor geplanten AfA-Lauf: pro Plan-Line wird ein Journal-
 * Eintrag erzeugt und ein `afa_buchungen`-Eintrag gespeichert, der auf
 * die Journal-Zeile verweist. Bereits existierende `afa_buchungen`-
 * Einträge für (Anlage, Jahr) werden per Upsert aktualisiert.
 */
export async function commitAfaLauf(
  plan: AfaLaufPlan
): Promise<{ createdJournal: number }> {
  let created = 0;
  for (const line of plan.lines) {
    const entry = await createEntry(line.journal_input);
    await saveAfaBuchung({
      anlage_id: line.anlage.id,
      jahr: line.jahr,
      afa_betrag: line.afa_betrag,
      restbuchwert: line.restbuchwert,
      journal_entry_id: entry.id,
    });
    created++;
  }
  return { createdJournal: created };
}

// --- Abgangs-Workflow -----------------------------------------------------

export type AbgangInput = {
  anlage_id: string;
  abgangsdatum: string; // ISO YYYY-MM-DD
  /** Erlös aus dem Abgang. Bei Verschrottung: 0. **Brutto**-Betrag,
   *  die USt-Herauslösung erfolgt im Service. */
  erloes_brutto: number;
  /** USt-Satz auf den Erlös (0 / 7 / 19). Anlageverkäufe sind i.d.R.
   *  steuerpflichtig (§ 1 UStG); bei Verschrottung 0. */
  ust_satz: number;
  notizen?: string | null;
};

export type AbgangLineRolle =
  | "teil_afa"
  | "aufloesung_kum"
  | "erloes"
  | "gewinn"
  | "verlust"
  | "ust";

export type AbgangPlanLine = {
  rolle: AbgangLineRolle;
  soll_konto: string;
  haben_konto: string;
  betrag: number;
  beschreibung: string;
};

export type AbgangPlan = {
  anlage: Anlagegut;
  abgangsdatum: string;
  teil_afa_betrag: number;
  restbuchwert_am_abgang: number;
  erloes_brutto: number;
  erloes_netto: number;
  erloes_ust: number;
  /** Positiv = Gewinn, negativ = Verlust. 0 = neutral. */
  gewinn_verlust: number;
  ist_verschrottung: boolean;
  lines: AbgangPlanLine[];
};

/**
 * Berechnet den Abgangs-Plan (Teil-AfA + Ausbuchung + Gewinn/Verlust +
 * USt) ohne Buchung. Pure function — für UI-Vorschau geeignet.
 *
 * Unterstützt in Teil 2a nur die **direkte Netto-Methode** (kein
 * `konto_abschreibung_kumuliert` gesetzt). Bei indirekter Methode
 * wirft die Funktion einen Fehler.
 */
export function planAbgang(
  anlage: Anlagegut,
  input: Omit<AbgangInput, "anlage_id">
): AbgangPlan {
  if (!anlage.aktiv) {
    throw new Error(
      `Anlage ${anlage.inventar_nr} ist bereits abgegangen (aktiv=false).`
    );
  }
  if (anlage.abgangsdatum !== null) {
    throw new Error(
      `Anlage ${anlage.inventar_nr} hat bereits ein Abgangsdatum ${anlage.abgangsdatum}.`
    );
  }
  if (anlage.afa_methode === "sammelposten") {
    // § 6 Abs. 2a Satz 3 EStG: Pool-Mitglieder werden nicht einzeln
    // ausgebucht — der Sammelposten läuft in der 5-Jahres-Kadenz weiter.
    throw new Error(
      `Sammelposten-Mitglieder (${anlage.inventar_nr}) können nicht einzeln abgegangen werden ` +
        `(§ 6 Abs. 2a Satz 3 EStG). Der Pool läuft linear weiter. ` +
        `Wird die Anlage tatsächlich aus dem Bestand entfernt: bitte manuell verbuchen und dann ` +
        `die Anlage löschen.`
    );
  }
  if (anlage.afa_methode !== "linear" && anlage.afa_methode !== "gwg_sofort") {
    throw new Error(
      `Abgang für AfA-Methode '${anlage.afa_methode}' ist nicht automatisiert.`
    );
  }
  // Indirekte Brutto-Methode: wird in Phase 4 unten behandelt, das
  // Guard-throw existiert nicht mehr. Stattdessen ergänzt der Plan-Code
  // eine zusätzliche Auflösungs-Buchung.
  if (input.abgangsdatum < anlage.anschaffungsdatum) {
    throw new Error(
      `Abgangsdatum ${input.abgangsdatum} liegt vor dem Anschaffungsdatum ${anlage.anschaffungsdatum}.`
    );
  }
  if (![0, 7, 19].includes(input.ust_satz)) {
    throw new Error(`USt-Satz muss 0, 7 oder 19 sein, erhalten ${input.ust_satz}.`);
  }
  if (input.erloes_brutto < 0) {
    throw new Error(`Erlös darf nicht negativ sein, erhalten ${input.erloes_brutto}.`);
  }

  const abgangsdatumObj = new Date(input.abgangsdatum + "T00:00:00Z");
  const jahr = abgangsdatumObj.getUTCFullYear();
  const ak_dec = new Decimal(anlage.anschaffungskosten);

  // Teil-AfA + Restbuchwert je nach Methode.
  let teilAfa: Decimal;
  let restbuchwert: Decimal;
  if (anlage.afa_methode === "gwg_sofort") {
    // GWG ist bereits voll abgeschrieben (Sofort-AfA im Anschaffungsjahr).
    // Restbuchwert = 0; keine Teil-AfA mehr fällig.
    teilAfa = new Decimal(0);
    restbuchwert = new Decimal(0);
  } else {
    // linear (inkl. Standard- und Indirekt-Brutto-Varianten)
    const afaRes = berechneLineareAfa({
      anschaffungskosten: ak_dec,
      nutzungsdauer_jahre: anlage.nutzungsdauer_jahre,
      anschaffungsdatum: new Date(anlage.anschaffungsdatum + "T00:00:00Z"),
      jahr,
      abgangsdatum: abgangsdatumObj,
    });
    teilAfa = afaRes.afa_betrag.toDecimalPlaces(2);
    restbuchwert = afaRes.restbuchwert.toDecimalPlaces(2);
  }

  // Indirekte Brutto-Methode: das Anlage-Konto steht noch auf AK, die
  // kumulierte AfA lebt auf einem separaten Wertberichtigungs-Konto.
  const istIndirekt = anlage.konto_abschreibung_kumuliert !== null;
  const afaHabenKonto = istIndirekt
    ? (anlage.konto_abschreibung_kumuliert as string)
    : anlage.konto_anlage;
  // „Wert, der in Ausbuchungs-Rechnung vom Anlage-Konto herunterzubuchen ist":
  // bei direkter Methode = Restbuchwert, bei indirekter = AK (die
  // kumulierte AfA wird separat aufgelöst).
  const auszubuchenderAnlageSaldo = istIndirekt ? ak_dec : restbuchwert;
  const kumulierteAfa = ak_dec.sub(restbuchwert);

  // Erlös Netto/USt splitten.
  const bruttoDec = new Decimal(input.erloes_brutto);
  let nettoDec: Decimal;
  let ustDec: Decimal;
  if (input.ust_satz === 0) {
    nettoDec = bruttoDec;
    ustDec = new Decimal(0);
  } else {
    // Netto = Brutto / (1 + ust/100)
    nettoDec = bruttoDec
      .div(new Decimal(1).plus(new Decimal(input.ust_satz).div(100)))
      .toDecimalPlaces(2);
    ustDec = bruttoDec.sub(nettoDec);
  }

  const gewinnVerlust = nettoDec.sub(restbuchwert);
  const istVerschrottung = bruttoDec.eq(0);

  const ustKonto = input.ust_satz === 7 ? "1771" : "1776";

  const lines: AbgangPlanLine[] = [];

  // 1) Teil-AfA (wenn > 0) — bei indirekter Methode läuft sie gegen das
  //    Wertberichtigungs-Konto, sonst gegen das Anlage-Konto direkt.
  if (teilAfa.gt(0)) {
    lines.push({
      rolle: "teil_afa",
      soll_konto: anlage.konto_afa,
      haben_konto: afaHabenKonto,
      betrag: teilAfa.toNumber(),
      beschreibung: `Teil-AfA bis Abgangsmonat ${anlage.bezeichnung} (${anlage.inventar_nr})`.slice(
        0,
        140
      ),
    });
  }

  // 1b) Indirekte Methode: kumulierte AfA auflösen — das Wert-
  //     berichtigungs-Konto wird komplett ausgebucht, das Anlage-Konto
  //     verliert entsprechend (AK → RBW).
  if (istIndirekt && kumulierteAfa.gt(0)) {
    lines.push({
      rolle: "aufloesung_kum",
      soll_konto: anlage.konto_abschreibung_kumuliert as string,
      haben_konto: anlage.konto_anlage,
      betrag: kumulierteAfa.toNumber(),
      beschreibung: `Auflösung kumulierte Wertberichtigung ${anlage.bezeichnung} (${anlage.inventar_nr})`.slice(
        0,
        140
      ),
    });
  }

  if (istVerschrottung) {
    // 2) Verschrottung: 2800 soll / konto_anlage haben (RBW als Aufwand).
    //    Bei indirekter Methode wurde der AK-Teil des Anlage-Kontos schon
    //    durch die Auflösungs-Buchung reduziert; es verbleibt der RBW.
    if (restbuchwert.gt(0)) {
      lines.push({
        rolle: "verlust",
        soll_konto: "2800",
        haben_konto: anlage.konto_anlage,
        betrag: restbuchwert.toNumber(),
        beschreibung: `Verschrottung Restbuchwert ${anlage.bezeichnung} (${anlage.inventar_nr})`.slice(
          0,
          140
        ),
      });
    }
  } else {
    // 2) Bank-Erlös ausbuchen Anlage — Höhe = min(erloes_netto, restbuchwert)
    const ausbuchHoehe = Decimal.min(nettoDec, restbuchwert);
    if (ausbuchHoehe.gt(0)) {
      lines.push({
        rolle: "erloes",
        soll_konto: "1200",
        haben_konto: anlage.konto_anlage,
        betrag: ausbuchHoehe.toNumber(),
        beschreibung: `Verkauf (Erlös netto) ${anlage.bezeichnung} (${anlage.inventar_nr})`.slice(
          0,
          140
        ),
      });
    }

    if (gewinnVerlust.gt(0)) {
      // Gewinn: Bank zusätzlicher Eingang / Außerordentliche Erträge 2700
      lines.push({
        rolle: "gewinn",
        soll_konto: "1200",
        haben_konto: "2700",
        betrag: gewinnVerlust.toNumber(),
        beschreibung: `Buchgewinn Anlagenabgang ${anlage.inventar_nr}`.slice(0, 140),
      });
    } else if (gewinnVerlust.lt(0)) {
      // Verlust: Restbuchwert - Netto als Aufwand 2800
      lines.push({
        rolle: "verlust",
        soll_konto: "2800",
        haben_konto: anlage.konto_anlage,
        betrag: gewinnVerlust.neg().toNumber(),
        beschreibung: `Buchverlust Anlagenabgang ${anlage.inventar_nr}`.slice(0, 140),
      });
    }

    // USt-Buchung (wenn ust_satz > 0)
    if (ustDec.gt(0)) {
      lines.push({
        rolle: "ust",
        soll_konto: "1200",
        haben_konto: ustKonto,
        betrag: ustDec.toNumber(),
        beschreibung: `USt ${input.ust_satz} % Verkauf ${anlage.inventar_nr}`.slice(0, 140),
      });
    }
  }

  return {
    anlage,
    abgangsdatum: input.abgangsdatum,
    teil_afa_betrag: teilAfa.toNumber(),
    restbuchwert_am_abgang: restbuchwert.toNumber(),
    erloes_brutto: bruttoDec.toNumber(),
    erloes_netto: nettoDec.toNumber(),
    erloes_ust: ustDec.toNumber(),
    gewinn_verlust: gewinnVerlust.toNumber(),
    ist_verschrottung: istVerschrottung,
    lines,
  };
}

/**
 * Führt den Abgangs-Plan durch: erzeugt die Journal-Einträge, notiert
 * die Teil-AfA in `afa_buchungen` und deaktiviert die Anlage
 * (`aktiv = false`, `abgangsdatum`, `abgangserloes`).
 */
export async function buchtAbgang(
  plan: AbgangPlan,
  clientId: string | null
): Promise<{ journalEntries: JournalEntry[] }> {
  const entries: JournalEntry[] = [];
  for (const line of plan.lines) {
    const entry = await createEntry({
      datum: plan.abgangsdatum,
      beleg_nr: `ABG-${plan.anlage.inventar_nr}`.slice(0, 40),
      beschreibung: line.beschreibung,
      soll_konto: line.soll_konto,
      haben_konto: line.haben_konto,
      betrag: line.betrag,
      ust_satz: null,
      status: "gebucht",
      client_id: null,
      skonto_pct: null,
      skonto_tage: null,
      gegenseite: null,
      faelligkeit: null,
    });
    entries.push(entry);

    // Teil-AfA zusätzlich in afa_buchungen dokumentieren (idempotent
    // via Upsert pro (Anlage, Jahr)).
    if (line.rolle === "teil_afa") {
      const jahr = Number(plan.abgangsdatum.slice(0, 4));
      await saveAfaBuchung({
        anlage_id: plan.anlage.id,
        jahr,
        afa_betrag: plan.teil_afa_betrag,
        restbuchwert: plan.restbuchwert_am_abgang,
        journal_entry_id: entry.id,
      });
    }
  }

  // Anlage deaktivieren + Abgangsdatum/Erlös speichern.
  // Hinweis: updateAnlagegut akzeptiert AnlagegutInput-Patches; für
  // aktiv/abgangsdatum/abgangserloes muss der Repo erweitert werden.
  // Wir patchen über direkten Store-Zugriff via repo-Methode.
  await markAnlageAbgegangen(
    plan.anlage.id,
    plan.abgangsdatum,
    plan.erloes_brutto,
    clientId
  );

  return { journalEntries: entries };
}

/** Intern: setzt aktiv=false + abgangsdatum + abgangserloes. */
async function markAnlageAbgegangen(
  id: string,
  abgangsdatum: string,
  erloes_brutto: number,
  clientId: string | null
): Promise<void> {
  await patchAnlageRaw(
    id,
    {
      aktiv: false,
      abgangsdatum,
      abgangserloes: erloes_brutto,
    },
    clientId
  );
}

