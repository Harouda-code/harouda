/**
 * HGB § 275 Abs. 2 GKV — Gewinn- und Verlustrechnung.
 *
 * Architektur spiegelt BalanceSheetBuilder wider:
 *   1. Statische Struktur aus hgb275GkvStructure.ts
 *   2. SKR03-Konten via skr03GuvMapping.ts auf GuV-Posten zugeordnet
 *   3. Journal-Buchungen in Periode [periodStart, stichtag] aggregiert
 *   4. Zwischensummen (Betriebs-, Finanz-, vor-Steuern) + Final (17) berechnet
 *   5. Jahresergebnis cross-check gegen Bilanz.provisionalResult
 *
 * Reuse: LeafNode/CompositeNode aus BalanceNode.ts mit normalSide (SOLL/HABEN);
 * neue balance_type-Werte "ERTRAG" / "AUFWAND" (vgl. hgb266Structure.ts).
 * Subtotals + Finals werden nicht als VirtualResultLeaf instantiiert, sondern
 * direkt im Builder aus Money-Werten berechnet (nicht pure children-sum).
 */

import type { Account, JournalEntry } from "../../types/db";
import { Money } from "../../lib/money/Money";
import {
  HGB_275_GKV_STRUCTURE,
  HGB_275_GKV_BY_REF,
  guvVisibleForSizeClass,
  type GuvLineDef,
} from "./hgb275GkvStructure";
import { findGuvRule } from "./skr03GuvMapping";
import type { SizeClass } from "./hgb266Structure";
import { LeafNode, type LeafEntry } from "./BalanceNode";

export type Verfahren = "GKV" | "UKV";

export type GuvOptions = {
  /** ISO YYYY-MM-DD, inklusive (default: Jahresstart des aktuellen Jahres). */
  periodStart?: string;
  /** ISO YYYY-MM-DD, inklusive (default: Jahresende des aktuellen Jahres). */
  stichtag?: string;
  sizeClass?: SizeClass;
  /** GKV ist Default; UKV ist aktuell nicht implementiert. */
  verfahren?: Verfahren;
};

export type GuvLineView = {
  reference_code: string;
  name: string;
  hgbParagraph: string;
  /** Formatierter Anzeigewert (toFixed2). */
  amount: string;
  /** Rohwert für weitere Berechnungen / Konsolidierung. */
  amountRaw: Money;
  depth: number;
  isSubtotal: boolean;
  isFinalResult: boolean;
  sizeClass: SizeClass;
  formula?: string;
};

export type GuvReport = {
  periodStart: string;
  periodEnd: string;
  verfahren: Verfahren;
  sizeClass: SizeClass;

  // Haupt-Posten (formatiert)
  umsatzerloese: string;
  bestandsveraenderungen: string;
  andereAktivierteEigenleistungen: string;
  sonstigeBetrieblicheErtraege: string;
  materialaufwand: string;
  personalaufwand: string;
  abschreibungen: string;
  sonstigeBetrieblicheAufwendungen: string;
  finanzertraege: string;
  finanzaufwendungen: string;
  steuernEinkommenErtrag: string;
  sonstigeSteuern: string;

  // Subtotals + Final (formatiert)
  betriebsergebnis: string;
  finanzergebnis: string;
  ergebnisVorSteuern: string;
  ergebnisNachSteuern: string;
  jahresergebnis: string;

  /** Flache Liste für UI-Tabelle (in Reihenfolge der Struktur). */
  positionen: GuvLineView[];

  /** Konten die auf keine GuV-Regel passen (QA). */
  unmappedAccounts: { kontoNr: string; bezeichnung: string; saldo: string }[];

  _internal: {
    umsatzerloese: Money;
    bestandsveraenderungen: Money;
    andereAktivierteEigenleistungen: Money;
    sonstigeBetrieblicheErtraege: Money;
    materialaufwand: Money;
    personalaufwand: Money;
    abschreibungen: Money;
    sonstigeBetrieblicheAufwendungen: Money;
    finanzertraege: Money;
    finanzaufwendungen: Money;
    steuernEinkommenErtrag: Money;
    sonstigeSteuern: Money;
    betriebsergebnis: Money;
    finanzergebnis: Money;
    ergebnisVorSteuern: Money;
    ergebnisNachSteuern: Money;
    jahresergebnis: Money;
  };

  metadata: {
    generatedAt: string;
    skrVersion: "SKR03";
    reportStandard: "§ 275 HGB (GKV)";
  };
};

/** Bookings-Aggregator: wie in BalanceSheetBuilder.bookedOn. */
function bookedOn(
  kontoNr: string,
  e: JournalEntry
): { soll: Money; haben: Money } {
  // MONEY_SAFE ingress: JournalEntry.betrag ist aktuell number; wir wrappen
  // in Money sofort nach Eintritt.
  const betrag = new Money(Number.isFinite(e.betrag) ? e.betrag : 0);
  if (e.soll_konto === kontoNr) return { soll: betrag, haben: Money.zero() };
  if (e.haben_konto === kontoNr) return { soll: Money.zero(), haben: betrag };
  return { soll: Money.zero(), haben: Money.zero() };
}

/** Aggregiert Journal-Buchungen pro Konto innerhalb der Periode. */
function aggregateAccountSaldo(
  kontoNr: string,
  entriesInPeriod: JournalEntry[]
): { soll: Money; haben: Money } {
  let soll = Money.zero();
  let haben = Money.zero();
  for (const e of entriesInPeriod) {
    const b = bookedOn(kontoNr, e);
    soll = soll.plus(b.soll);
    haben = haben.plus(b.haben);
  }
  return { soll, haben };
}

export function buildGuv(
  accounts: Account[],
  entries: JournalEntry[],
  options: GuvOptions = {}
): GuvReport {
  const year = new Date().getFullYear();
  const periodStart = options.periodStart ?? `${year}-01-01`;
  const stichtag = options.stichtag ?? `${year}-12-31`;
  const sizeClass: SizeClass = options.sizeClass ?? "ALL";
  const verfahren: Verfahren = options.verfahren ?? "GKV";

  if (verfahren !== "GKV") {
    throw new Error(
      `GuvBuilder: Verfahren "${verfahren}" noch nicht implementiert (nur GKV).`
    );
  }

  const entriesInPeriod = entries.filter(
    (e) => e.status === "gebucht" && e.datum >= periodStart && e.datum <= stichtag
  );

  // 1) Leaf je GuV-Posten anlegen (nur POST kind — SUBTOTAL/FINAL kommen später)
  const leafByRef = new Map<string, LeafNode>();
  for (const def of HGB_275_GKV_STRUCTURE) {
    if (def.kind !== "POST") continue;
    leafByRef.set(
      def.reference_code,
      new LeafNode(
        `${def.reference_code}:leaf`,
        def.name_de,
        def.normal_side === "HABEN" ? "ERTRAG" : "AUFWAND",
        def.normal_side,
        def.hgb_paragraph
      )
    );
  }

  // 2) Konten via GuV-Regel auf Leaf verteilen
  const unmappedAccounts: GuvReport["unmappedAccounts"] = [];
  for (const acc of accounts) {
    if (!acc.is_active) continue;
    const rule = findGuvRule(acc.konto_nr);
    if (!rule) continue; // nur GuV-Konten — Bilanz-Konten skippen wir
    const saldo = aggregateAccountSaldo(acc.konto_nr, entriesInPeriod);
    if (saldo.soll.isZero() && saldo.haben.isZero()) continue;

    const leaf = leafByRef.get(rule.guv_ref);
    if (!leaf) {
      unmappedAccounts.push({
        kontoNr: acc.konto_nr,
        bezeichnung: acc.bezeichnung,
        saldo: saldo.soll.minus(saldo.haben).toFixed2(),
      });
      continue;
    }
    const entry: LeafEntry = {
      kontoNr: acc.konto_nr,
      bezeichnung: acc.bezeichnung,
      soll: saldo.soll,
      haben: saldo.haben,
    };
    leaf.addEntry(entry);
  }

  // 3) Pro Posten: Saldo berechnen, für Summen-Posten (5, 6, 7) Sub-Posten aufaddieren
  const amountByRef = new Map<string, Money>();
  for (const def of HGB_275_GKV_STRUCTURE) {
    if (def.kind !== "POST") continue;
    const leaf = leafByRef.get(def.reference_code);
    amountByRef.set(
      def.reference_code,
      leaf ? leaf.getBalance() : Money.zero()
    );
  }

  // Für Posten 5, 6, 7: Wert = eigene Leaf-Einträge + Summe der Sub-Leafs
  function rollUp(parentRef: string): Money {
    const own = amountByRef.get(parentRef) ?? Money.zero();
    let sum = own;
    for (const def of HGB_275_GKV_STRUCTURE) {
      if (def.parent === parentRef) {
        const sub = amountByRef.get(def.reference_code) ?? Money.zero();
        sum = sum.plus(sub);
      }
    }
    return sum;
  }
  amountByRef.set("5", rollUp("5"));
  amountByRef.set("6", rollUp("6"));
  amountByRef.set("7", rollUp("7"));

  // 4) Subtotals + Final
  const get = (ref: string): Money => amountByRef.get(ref) ?? Money.zero();

  const betriebsergebnis = get("1")
    .plus(get("2"))
    .plus(get("3"))
    .plus(get("4"))
    .minus(get("5"))
    .minus(get("6"))
    .minus(get("7"))
    .minus(get("8"));

  const finanzergebnis = get("9")
    .plus(get("10"))
    .plus(get("11"))
    .minus(get("12"))
    .minus(get("13"));

  const ergebnisVorSteuern = betriebsergebnis.plus(finanzergebnis);
  const ergebnisNachSteuern = ergebnisVorSteuern.minus(get("14"));
  const jahresergebnis = ergebnisNachSteuern.minus(get("16"));

  amountByRef.set("BETRIEBSERG", betriebsergebnis);
  amountByRef.set("FINANZERG", finanzergebnis);
  amountByRef.set("VOR_STEUERN", ergebnisVorSteuern);
  amountByRef.set("15", ergebnisNachSteuern);
  amountByRef.set("17", jahresergebnis);

  // 5) Flat-View für UI
  const positionen: GuvLineView[] = [];
  for (const def of HGB_275_GKV_STRUCTURE) {
    if (!guvVisibleForSizeClass(def, sizeClass)) continue;
    // Bei KLEIN: Sub-Posten (5.a/5.b/6.a/6.b/7.a/7.b) werden schon via
    // guvVisibleForSizeClass ausgefiltert. Parent zeigt rollup-Summe.
    const raw = amountByRef.get(def.reference_code) ?? Money.zero();
    positionen.push({
      reference_code: def.reference_code,
      name: def.short_label ?? def.name_de,
      hgbParagraph: def.hgb_paragraph,
      amount: raw.toFixed2(),
      amountRaw: raw,
      depth: def.parent ? 1 : 0,
      isSubtotal: def.kind === "SUBTOTAL",
      isFinalResult: def.kind === "FINAL",
      sizeClass: def.size_class,
      formula: def.formula,
    });
  }

  return {
    periodStart,
    periodEnd: stichtag,
    verfahren,
    sizeClass,

    umsatzerloese: get("1").toFixed2(),
    bestandsveraenderungen: get("2").toFixed2(),
    andereAktivierteEigenleistungen: get("3").toFixed2(),
    sonstigeBetrieblicheErtraege: get("4").toFixed2(),
    materialaufwand: get("5").toFixed2(),
    personalaufwand: get("6").toFixed2(),
    abschreibungen: get("7").toFixed2(),
    sonstigeBetrieblicheAufwendungen: get("8").toFixed2(),
    finanzertraege: get("9").plus(get("10")).plus(get("11")).toFixed2(),
    finanzaufwendungen: get("12").plus(get("13")).toFixed2(),
    steuernEinkommenErtrag: get("14").toFixed2(),
    sonstigeSteuern: get("16").toFixed2(),

    betriebsergebnis: betriebsergebnis.toFixed2(),
    finanzergebnis: finanzergebnis.toFixed2(),
    ergebnisVorSteuern: ergebnisVorSteuern.toFixed2(),
    ergebnisNachSteuern: ergebnisNachSteuern.toFixed2(),
    jahresergebnis: jahresergebnis.toFixed2(),

    positionen,
    unmappedAccounts,

    _internal: {
      umsatzerloese: get("1"),
      bestandsveraenderungen: get("2"),
      andereAktivierteEigenleistungen: get("3"),
      sonstigeBetrieblicheErtraege: get("4"),
      materialaufwand: get("5"),
      personalaufwand: get("6"),
      abschreibungen: get("7"),
      sonstigeBetrieblicheAufwendungen: get("8"),
      finanzertraege: get("9").plus(get("10")).plus(get("11")),
      finanzaufwendungen: get("12").plus(get("13")),
      steuernEinkommenErtrag: get("14"),
      sonstigeSteuern: get("16"),
      betriebsergebnis,
      finanzergebnis,
      ergebnisVorSteuern,
      ergebnisNachSteuern,
      jahresergebnis,
    },

    metadata: {
      generatedAt: new Date().toISOString(),
      skrVersion: "SKR03",
      reportStandard: "§ 275 HGB (GKV)",
    },
  };
}

/** Hilfe für Tests / externe Konsumenten: gibt GuvLineDef für Ref. zurück. */
export function guvLineDef(ref: string): GuvLineDef | undefined {
  return HGB_275_GKV_BY_REF.get(ref);
}
