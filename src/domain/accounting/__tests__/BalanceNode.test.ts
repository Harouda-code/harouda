import { describe, it, expect } from "vitest";
import {
  LeafNode,
  CompositeNode,
  VirtualResultLeaf,
  type LeafEntry,
} from "../BalanceNode";
import { Money } from "../../../lib/money/Money";

const M = (v: string | number) => new Money(v);

describe("BalanceNode", () => {
  describe("LeafNode", () => {
    it("aggregates Soll - Haben for AKTIVA (normalSide=SOLL)", () => {
      const leaf = new LeafNode(
        "B.IV:leaf",
        "Bank",
        "AKTIVA",
        "SOLL",
        "§ 266 Abs. 2 B.IV"
      );
      leaf.addEntry({
        kontoNr: "1200",
        bezeichnung: "Bank",
        soll: M("5000"),
        haben: M("1500"),
      });
      expect(leaf.getBalance().toFixed2()).toBe("3500.00");
    });

    it("aggregates Haben - Soll for PASSIVA (normalSide=HABEN)", () => {
      const leaf = new LeafNode(
        "P.C.4:leaf",
        "Verb. LuL",
        "PASSIVA",
        "HABEN",
        "§ 266 Abs. 3 C.4"
      );
      leaf.addEntry({
        kontoNr: "1800",
        bezeichnung: "Verb. LuL",
        soll: M("500"),
        haben: M("3000"),
      });
      expect(leaf.getBalance().toFixed2()).toBe("2500.00");
    });

    it("sums multiple entries correctly", () => {
      const leaf = new LeafNode(
        "B.IV:leaf",
        "Banken",
        "AKTIVA",
        "SOLL",
        "§ 266 Abs. 2 B.IV"
      );
      const entries: LeafEntry[] = [
        { kontoNr: "1200", bezeichnung: "Bank 1", soll: M("1000"), haben: M("0") },
        { kontoNr: "1210", bezeichnung: "Bank 2", soll: M("2000"), haben: M("500") },
      ];
      entries.forEach((e) => leaf.addEntry(e));
      // (1000 - 0) + (2000 - 500) = 2500
      expect(leaf.getBalance().toFixed2()).toBe("2500.00");
      expect(leaf.getAccountNumbers()).toEqual(["1200", "1210"]);
      expect(leaf.getChildren()).toEqual([]);
    });

    it("returns 0 for empty leaf", () => {
      const leaf = new LeafNode(
        "X:leaf",
        "Empty",
        "AKTIVA",
        "SOLL",
        "§ test"
      );
      expect(leaf.getBalance().isZero()).toBe(true);
    });
  });

  describe("CompositeNode", () => {
    it("sums child balances", () => {
      const parent = new CompositeNode(
        "A",
        "Anlagevermögen",
        "AKTIVA",
        "SOLL",
        "§ 266 Abs. 2 A"
      );
      const c1 = new LeafNode("A.I:leaf", "IVG", "AKTIVA", "SOLL", "§ 266 A.I");
      c1.addEntry({ kontoNr: "0100", bezeichnung: "IVG", soll: M("100"), haben: M("0") });
      const c2 = new LeafNode("A.II:leaf", "Sach", "AKTIVA", "SOLL", "§ 266 A.II");
      c2.addEntry({ kontoNr: "0200", bezeichnung: "Sach", soll: M("200"), haben: M("0") });
      parent.addChild(c1);
      parent.addChild(c2);
      expect(parent.getBalance().toFixed2()).toBe("300.00");
    });

    it("find() locates nested node by reference code", () => {
      const root = new CompositeNode("A", "Anlage", "AKTIVA", "SOLL", "§");
      const child = new CompositeNode("A.I", "IVG", "AKTIVA", "SOLL", "§");
      const grandchild = new LeafNode(
        "A.I.1:leaf",
        "Software",
        "AKTIVA",
        "SOLL",
        "§"
      );
      child.addChild(grandchild);
      root.addChild(child);
      expect(root.find("A.I")).toBe(child);
      expect(root.find("A.I.1:leaf")).toBe(grandchild);
      expect(root.find("nonexistent")).toBeUndefined();
    });

    it("removeChildByRef() removes and returns the child", () => {
      const root = new CompositeNode("A", "Anlage", "AKTIVA", "SOLL", "§");
      const child = new CompositeNode("A.I", "IVG", "AKTIVA", "SOLL", "§");
      root.addChild(child);
      const removed = root.removeChildByRef("A.I");
      expect(removed).toBe(child);
      expect(root.getChildren()).toEqual([]);
      expect(root.removeChildByRef("A.I")).toBeUndefined();
    });

    it("getAccountNumbers flattens through children", () => {
      const root = new CompositeNode("A", "Anlage", "AKTIVA", "SOLL", "§");
      const child = new LeafNode("A:leaf", "VG", "AKTIVA", "SOLL", "§");
      child.addEntry({ kontoNr: "0100", bezeichnung: "IVG", soll: M("10"), haben: M("0") });
      child.addEntry({ kontoNr: "0200", bezeichnung: "Sach", soll: M("20"), haben: M("0") });
      root.addChild(child);
      expect(root.getAccountNumbers()).toEqual(["0100", "0200"]);
    });
  });

  describe("VirtualResultLeaf", () => {
    it("returns the injected value as-is (no aggregation)", () => {
      const leaf = new VirtualResultLeaf(
        "P.A.V:virtual",
        "Jahresüberschuss vorl.",
        "PASSIVA",
        "HABEN",
        "§ 266 Abs. 3 A.V · § 268 Abs. 1",
        M("4200")
      );
      expect(leaf.getBalance().toFixed2()).toBe("4200.00");
      expect(leaf.isVirtual).toBe(true);
    });

    it("setAmount updates the balance", () => {
      const leaf = new VirtualResultLeaf(
        "P.A.V:virtual",
        "Jahresüberschuss",
        "PASSIVA",
        "HABEN",
        "§",
        M("0")
      );
      leaf.setAmount(M("1234.57"));
      expect(leaf.getBalance().toFixed2()).toBe("1234.57");
    });

    it("has no children and no account numbers", () => {
      const leaf = new VirtualResultLeaf(
        "P.A.V:virtual",
        "Virtual",
        "PASSIVA",
        "HABEN",
        "§",
        M("100")
      );
      expect(leaf.getChildren()).toEqual([]);
      expect(leaf.getAccountNumbers()).toEqual([]);
    });
  });

  describe("Money arithmetic via LeafNode (GoBD Rz. 58 precision)", () => {
    it("10 × 0.1 sums to exactly 1.00 (no float drift)", () => {
      const leaf = new LeafNode("X:leaf", "Drift", "AKTIVA", "SOLL", "§");
      for (let i = 0; i < 10; i++) {
        leaf.addEntry({
          kontoNr: `K${i}`,
          bezeichnung: "drift",
          soll: M("0.1"),
          haben: M("0"),
        });
      }
      expect(leaf.getBalance().toFixed2()).toBe("1.00");
    });

    it("0.1 + 0.2 equals 0.30 exactly", () => {
      const leaf = new LeafNode("X:leaf", "Drift", "AKTIVA", "SOLL", "§");
      leaf.addEntry({ kontoNr: "1", bezeichnung: "", soll: M("0.1"), haben: M("0") });
      leaf.addEntry({ kontoNr: "2", bezeichnung: "", soll: M("0.2"), haben: M("0") });
      expect(leaf.getBalance().toFixed2()).toBe("0.30");
    });
  });
});
