/**
 * Composite Pattern für die § 266 HGB Bilanz-Darstellung.
 *
 * LeafNode aggregiert Salden mehrerer Konten.
 * CompositeNode summiert seine Kinder.
 *
 * Präzision: Money (decimal.js, 28 signifikante Stellen, Banker's Rounding).
 * Erfüllt GoBD Rz. 58 (Richtigkeit) und § 239 Abs. 2 HGB (Vollständigkeit,
 * Richtigkeit). Intermediate-Summen driften nicht durch IEEE-754.
 */

import { Money } from "../../lib/money/Money";
import { sumMoney } from "../../lib/money/sum";
import type { BalanceType, NormalSide } from "./hgb266Structure";

export abstract class BalanceNode {
  constructor(
    public readonly referenceCode: string,
    public readonly name: string,
    public readonly balanceType: BalanceType,
    public readonly normalSide: NormalSide,
    public readonly hgbParagraph: string,
    public readonly isVirtual: boolean = false
  ) {}

  abstract getBalance(): Money;
  abstract getAccountNumbers(): string[];
  abstract getChildren(): BalanceNode[];

  /** Iteriert rekursiv alle Nachfahren inklusive self. */
  *iterate(): Generator<BalanceNode, void, unknown> {
    yield this;
    for (const child of this.getChildren()) {
      yield* child.iterate();
    }
  }
}

/** Eintrag eines einzelnen SKR03-Kontos mit akkumuliertem Saldo. */
export type LeafEntry = {
  kontoNr: string;
  bezeichnung: string;
  soll: Money;
  haben: Money;
  /** true = wurde wegen negativen Saldo umgelagert (Wechselkonto) */
  reparented?: boolean;
};

export class LeafNode extends BalanceNode {
  private entries: LeafEntry[] = [];

  addEntry(entry: LeafEntry): void {
    this.entries.push(entry);
  }

  getEntries(): LeafEntry[] {
    return this.entries;
  }

  /** Saldo = soll − haben für Aktiva (Soll-Salden positiv anzeigen),
   *  haben − soll für Passiva. */
  getBalance(): Money {
    let sum = Money.zero();
    for (const e of this.entries) {
      const saldo = e.soll.minus(e.haben);
      if (this.normalSide === "SOLL") sum = sum.plus(saldo);
      else sum = sum.minus(saldo);
    }
    return sum;
  }

  getAccountNumbers(): string[] {
    return this.entries.map((e) => e.kontoNr);
  }

  getChildren(): BalanceNode[] {
    return [];
  }
}

export class CompositeNode extends BalanceNode {
  private children: BalanceNode[] = [];

  addChild(node: BalanceNode): void {
    this.children.push(node);
  }

  getChildren(): BalanceNode[] {
    return this.children;
  }

  getBalance(): Money {
    return sumMoney(this.children.map((c) => c.getBalance()));
  }

  getAccountNumbers(): string[] {
    const result: string[] = [];
    for (const c of this.children) result.push(...c.getAccountNumbers());
    return result;
  }

  /** Findet einen Knoten anhand des Reference-Codes rekursiv. */
  find(referenceCode: string): BalanceNode | undefined {
    for (const n of this.iterate()) {
      if (n.referenceCode === referenceCode) return n;
    }
    return undefined;
  }

  /** Entfernt ein Kind. Gibt true zurück, wenn gefunden. */
  removeChildByRef(referenceCode: string): BalanceNode | undefined {
    for (let i = 0; i < this.children.length; i++) {
      if (this.children[i].referenceCode === referenceCode) {
        const [removed] = this.children.splice(i, 1);
        return removed;
      }
    }
    return undefined;
  }
}

/** Virtueller Leaf für die "Jahresüberschuss (vorläufig)"-Zeile. Trägt
 *  den Betrag direkt, nicht via Konten-Aggregation. */
export class VirtualResultLeaf extends BalanceNode {
  private amount: Money;

  constructor(
    referenceCode: string,
    name: string,
    balanceType: BalanceType,
    normalSide: NormalSide,
    hgbParagraph: string,
    amount: Money
  ) {
    super(referenceCode, name, balanceType, normalSide, hgbParagraph, true);
    this.amount = amount;
  }

  setAmount(m: Money): void {
    this.amount = m;
  }

  getBalance(): Money {
    return this.amount;
  }

  getAccountNumbers(): string[] {
    return [];
  }

  getChildren(): BalanceNode[] {
    return [];
  }
}
