/**
 * Baut aus Konten + Journal-Daten einen Bilanzbaum nach HGB § 266 auf.
 *
 * Verantwortlichkeiten:
 *   1. Skelett aus HGB_266_REPORT_LINES instantiieren (CompositeNodes)
 *   2. Konten via SKR03_MAPPING_RULES auf LeafNodes setzen
 *   3. Journal-Buchungen bis zum Stichtag aggregieren
 *   4. Wechselkonten (Bank) mit negativem Saldo auf Passiva umlagern
 *   5. Vorläufigen Jahresüberschuss aus Erfolgskonten berechnen
 *      und in Passiva · A.V (Jahresüberschuss vorläufig) injizieren
 *   6. Summen neu berechnen
 *
 * Alle Geldwerte durchlaufen die Money-Klasse (decimal.js) — kein float,
 * kein round2. Externe Schnittstelle liefert Strings (toFixed2) für UI
 * und JSON, _internal behält Money für weitere Berechnung.
 */

import type { Account, JournalEntry } from "../../types/db";
import { Money } from "../../lib/money/Money";
import {
  HGB_266_REPORT_LINES,
  visibleForSizeClass,
  type ReportLineDef,
  type SizeClass,
} from "./hgb266Structure";
import {
  findBalanceRule,
  findErfolgRule,
  type MappingRule,
} from "./skr03Mapping";
import {
  BalanceNode,
  CompositeNode,
  LeafNode,
  VirtualResultLeaf,
  type LeafEntry,
} from "./BalanceNode";

export type BalanceSheetOptions = {
  sizeClass?: SizeClass;
  /** Stichtag ISO YYYY-MM-DD (inkl.). Default: Jahresende des aktuellen Jahres. */
  stichtag?: string;
};

export type BalanceSheetReport = {
  stichtag: string;
  sizeClass: SizeClass;
  aktivaRoot: CompositeNode;
  passivaRoot: CompositeNode;
  /** Anzeigewerte als toFixed2()-Strings (UI + JSON). */
  aktivaSum: string;
  passivaSum: string;
  /** Differenz VOR Injektion des vorläufigen Ergebnisses — sollte exakt
   *  dem vorläufigen Ergebnis entsprechen. */
  balancierungsDifferenz: string;
  /** Vorläufiger Jahresüberschuss (positiv) oder Jahresfehlbetrag (negativ). */
  provisionalResult: string;
  erfolgsDetail: {
    ertrag: string;
    aufwand: string;
  };
  /** Konten ohne SKR03-Mapping (zur Qualitätskontrolle). */
  unmappedAccounts: { kontoNr: string; bezeichnung: string; saldo: string }[];
  /** Volle Money-Präzision für downstream-Rechnung (z. B. Konsolidierung). */
  _internal: {
    aktivaSum: Money;
    passivaSum: Money;
    provisionalResult: Money;
    balancierungsDifferenz: Money;
  };
  metadata: {
    generatedAt: string;
    skrVersion: "SKR03";
    reportStandard: "§ 266 HGB";
  };
};

/** Liest einen Journal-Eintrag auf ein Konto und gibt (soll, haben) zurück. */
function bookedOn(
  kontoNr: string,
  e: JournalEntry
): { soll: Money; haben: Money } {
  // MONEY_SAFE ingress: JournalEntry.betrag kommt derzeit als number durch.
  // Wir wrappen hier sofort in Money. Für zukünftige Supabase-Schema-Fixes
  // auf numeric(15,2)-string siehe TODO in src/api/ (Phase 4 Audit).
  const betrag = new Money(Number.isFinite(e.betrag) ? e.betrag : 0);
  if (e.soll_konto === kontoNr) return { soll: betrag, haben: Money.zero() };
  if (e.haben_konto === kontoNr) return { soll: Money.zero(), haben: betrag };
  return { soll: Money.zero(), haben: Money.zero() };
}

export function buildBalanceSheet(
  accounts: Account[],
  entries: JournalEntry[],
  options: BalanceSheetOptions = {}
): BalanceSheetReport {
  const stichtag =
    options.stichtag ?? `${new Date().getFullYear()}-12-31`;
  const sizeClass: SizeClass = options.sizeClass ?? "ALL";

  const entriesUpToStichtag = entries.filter(
    (e) => e.status === "gebucht" && e.datum <= stichtag
  );

  // 1) Bau das Skelett: alle CompositeNodes, auch Leaf-Position-Stubs
  const nodesByRef = new Map<string, CompositeNode>();
  const orderedRoots: CompositeNode[] = [];

  // Sortiere Definitionen: parents vor children (oberste Ebene zuerst)
  const lines = [...HGB_266_REPORT_LINES].sort((a, b) => {
    const depthA = (a.reference_code.match(/\./g)?.length ?? 0) + 0;
    const depthB = (b.reference_code.match(/\./g)?.length ?? 0) + 0;
    if (depthA !== depthB) return depthA - depthB;
    return a.sort_order - b.sort_order;
  });

  for (const def of lines) {
    if (!visibleForSizeClass(def, sizeClass)) continue;
    const node = new CompositeNode(
      def.reference_code,
      def.name_de,
      def.balance_type,
      def.normal_side,
      def.hgb_paragraph,
      def.is_virtual ?? false
    );
    nodesByRef.set(def.reference_code, node);
    if (!def.parent) {
      orderedRoots.push(node);
    } else {
      const parent = nodesByRef.get(def.parent);
      if (parent) parent.addChild(node);
    }
  }

  // Wurzeln nach balance_type trennen
  const aktivaRoot = new CompositeNode(
    "_AKTIVA_ROOT",
    "Summe Aktiva",
    "AKTIVA",
    "SOLL",
    "§ 266 Abs. 2 HGB"
  );
  const passivaRoot = new CompositeNode(
    "_PASSIVA_ROOT",
    "Summe Passiva",
    "PASSIVA",
    "HABEN",
    "§ 266 Abs. 3 HGB"
  );
  for (const r of orderedRoots) {
    if (r.balanceType === "AKTIVA") aktivaRoot.addChild(r);
    else passivaRoot.addChild(r);
  }

  // 2) Konten je Mapping-Regel einem Leaf-Behälter zuordnen.
  const leafByRef = new Map<string, LeafNode>();

  function ensureLeafFor(
    refCode: string,
    def: ReportLineDef | null
  ): LeafNode | null {
    const parent = nodesByRef.get(refCode);
    if (!parent) return null;
    let leaf = leafByRef.get(refCode);
    if (!leaf) {
      const leafName = def?.short_label ?? def?.name_de ?? parent.name;
      leaf = new LeafNode(
        `${refCode}:leaf`,
        leafName,
        parent.balanceType,
        parent.normalSide,
        def?.hgb_paragraph ?? parent.hgbParagraph
      );
      parent.addChild(leaf);
      leafByRef.set(refCode, leaf);
    }
    return leaf;
  }

  const refDefByCode = new Map<string, ReportLineDef>(
    HGB_266_REPORT_LINES.map((l) => [l.reference_code, l])
  );

  // Sammle Konten-Salden zur Erkennung unmapped + für Wechselkonten
  const kontoSaldoMap = new Map<
    string,
    {
      account: Account;
      soll: Money;
      haben: Money;
      rule: MappingRule | undefined;
    }
  >();

  for (const acc of accounts) {
    if (!acc.is_active) continue;
    const balRule = findBalanceRule(acc.konto_nr);
    if (balRule) {
      kontoSaldoMap.set(acc.konto_nr, {
        account: acc,
        soll: Money.zero(),
        haben: Money.zero(),
        rule: balRule,
      });
    }
  }

  // Journal-Aggregation je bilanzrelevantem Konto
  for (const e of entriesUpToStichtag) {
    for (const [kontoNr, state] of kontoSaldoMap) {
      const b = bookedOn(kontoNr, e);
      if (!b.soll.isZero()) state.soll = state.soll.plus(b.soll);
      if (!b.haben.isZero()) state.haben = state.haben.plus(b.haben);
    }
  }

  // Wechselkonten: wenn Saldo auf der "falschen" Seite ist, umlagern.
  const unmappedAccounts: BalanceSheetReport["unmappedAccounts"] = [];

  for (const [kontoNr, state] of kontoSaldoMap) {
    const rule = state.rule!;
    const saldoSoll = state.soll.minus(state.haben); // + = Soll-Saldo
    let targetRef = rule.reference_code;
    let reparented = false;
    if (rule.wechselkonto && rule.wechsel_ref && saldoSoll.isNegative()) {
      targetRef = rule.wechsel_ref;
      reparented = true;
    }

    const targetDef = refDefByCode.get(targetRef) ?? null;
    let finalLeaf = ensureLeafFor(targetRef, targetDef);
    if (!finalLeaf && targetDef?.parent) {
      finalLeaf = ensureLeafFor(
        targetDef.parent,
        refDefByCode.get(targetDef.parent) ?? null
      );
    }

    if (!finalLeaf) {
      unmappedAccounts.push({
        kontoNr,
        bezeichnung: state.account.bezeichnung,
        saldo: saldoSoll.toFixed2(),
      });
      continue;
    }

    const entry: LeafEntry = {
      kontoNr,
      bezeichnung: state.account.bezeichnung,
      soll: state.soll,
      haben: state.haben,
      reparented,
    };
    finalLeaf.addEntry(entry);
  }

  // 3) Erfolgskonten zum vorläufigen Ergebnis aggregieren
  let ertragSum = Money.zero();
  let aufwandSum = Money.zero();

  for (const acc of accounts) {
    if (!acc.is_active) continue;
    const rule = findErfolgRule(acc.konto_nr);
    if (!rule) continue;
    let soll = Money.zero();
    let haben = Money.zero();
    for (const e of entriesUpToStichtag) {
      const b = bookedOn(acc.konto_nr, e);
      soll = soll.plus(b.soll);
      haben = haben.plus(b.haben);
    }
    if (rule.kind === "ERTRAG") {
      ertragSum = ertragSum.plus(haben.minus(soll));
    } else {
      aufwandSum = aufwandSum.plus(soll.minus(haben));
    }
  }

  const provisionalResult = ertragSum.minus(aufwandSum);

  // 4) Virtuellen "Jahresüberschuss (vorläufig)"-Knoten in P.A.V hinterlegen
  const pav = nodesByRef.get("P.A.V");
  if (pav) {
    const virtualLeaf = new VirtualResultLeaf(
      "P.A.V:virtual",
      "Jahresüberschuss / Jahresfehlbetrag (vorläufig)",
      "PASSIVA",
      "HABEN",
      "§ 266 Abs. 3 A.V · § 268 Abs. 1 HGB",
      provisionalResult
    );
    pav.addChild(virtualLeaf);
  }

  // 5) Summen berechnen
  const aktivaSumM = aktivaRoot.getBalance();
  const passivaSumM = passivaRoot.getBalance();
  const balancierungsDifferenzM = aktivaSumM.minus(passivaSumM);

  return {
    stichtag,
    sizeClass,
    aktivaRoot,
    passivaRoot,
    aktivaSum: aktivaSumM.toFixed2(),
    passivaSum: passivaSumM.toFixed2(),
    balancierungsDifferenz: balancierungsDifferenzM.toFixed2(),
    provisionalResult: provisionalResult.toFixed2(),
    erfolgsDetail: {
      ertrag: ertragSum.toFixed2(),
      aufwand: aufwandSum.toFixed2(),
    },
    unmappedAccounts,
    _internal: {
      aktivaSum: aktivaSumM,
      passivaSum: passivaSumM,
      provisionalResult,
      balancierungsDifferenz: balancierungsDifferenzM,
    },
    metadata: {
      generatedAt: new Date().toISOString(),
      skrVersion: "SKR03",
      reportStandard: "§ 266 HGB",
    },
  };
}

/** Hilfsfunktion für UI: flacht den Baum auf eine Liste mit Tiefenangabe. */
export type FlatRow = {
  depth: number;
  node: BalanceNode;
  balance: Money;
  isLeafEntry: boolean;
  entries?: LeafEntry[];
};

export function flattenForRender(root: CompositeNode): FlatRow[] {
  const out: FlatRow[] = [];
  function walk(node: BalanceNode, depth: number) {
    const isLeaf = node instanceof LeafNode || node instanceof VirtualResultLeaf;
    out.push({
      depth,
      node,
      balance: node.getBalance(),
      isLeafEntry: isLeaf,
      entries: node instanceof LeafNode ? node.getEntries() : undefined,
    });
    for (const c of node.getChildren()) walk(c, depth + 1);
  }
  walk(root, 0);
  return out;
}
