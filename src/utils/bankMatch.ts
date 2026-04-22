// Matching Bank-Transaktion ↔ offene Posten (OPOS).
//
// Einfaches scored-candidates-Verfahren ohne ML:
//   • exact:  Betrag exakt und Beleg-Nr. in Verwendungszweck gefunden
//   • high:   Betrag exakt und Fuzzy-Match auf Gegenseiten-Name
//   • medium: Betrag exakt oder innerhalb 0,01 €, ohne Name-Match
//   • low:    alles andere
//
// Die Fuzzy-Namen-Prüfung ist bewusst simpel: wir zerlegen beide Namen in
// Tokens (Wörter ≥ 3 Buchstaben, lowercase) und messen Overlap.

import type { BankTx } from "./mt940";
import type { OpenItem } from "../api/opos";

export type MatchConfidence = "exact" | "high" | "medium" | "low";

export type BankMatchCandidate = {
  openItem: OpenItem;
  confidence: MatchConfidence;
  score: number; // 0..1
  reasons: string[];
};

function normalize(s: string): string {
  return s.toLowerCase().normalize("NFKD").replace(/[^a-z0-9äöüß]/g, "");
}

function tokenize(s: string): Set<string> {
  return new Set(
    s
      .toLowerCase()
      .split(/[^a-zäöüß0-9]+/)
      .filter((t) => t.length >= 3)
  );
}

function jaccard(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 || b.size === 0) return 0;
  let inter = 0;
  for (const t of a) if (b.has(t)) inter++;
  return inter / (a.size + b.size - inter);
}

export function scoreMatch(
  tx: BankTx,
  item: OpenItem
): BankMatchCandidate {
  const reasons: string[] = [];
  let score = 0;

  const amtDiff = Math.abs(Number(tx.betrag) - item.offen);
  const sameAmount = amtDiff < 0.01;
  const closeAmount = amtDiff < 0.05;

  if (sameAmount) {
    score += 0.5;
    reasons.push("Betrag exakt (±0,01 €).");
  } else if (closeAmount) {
    score += 0.3;
    reasons.push(`Betrag nah (Differenz ${amtDiff.toFixed(2)} €).`);
  }

  // Beleg-Nr. im Verwendungszweck?
  const zweckNorm = normalize(tx.verwendungszweck);
  const belegNorm = normalize(item.beleg_nr);
  const belegMatch = belegNorm.length >= 3 && zweckNorm.includes(belegNorm);
  if (belegMatch) {
    score += 0.35;
    reasons.push(`Beleg-Nr. „${item.beleg_nr}" im Verwendungszweck.`);
  }

  // Name-Match (Fuzzy)
  let nameScore = 0;
  if (tx.gegenseite_name && item.gegenseite) {
    const txTokens = tokenize(tx.gegenseite_name);
    const opTokens = tokenize(item.gegenseite);
    nameScore = jaccard(txTokens, opTokens);
    if (nameScore >= 0.5) {
      score += 0.15;
      reasons.push(
        `Gegenseiten-Name stimmt weitgehend überein (Jaccard ${nameScore.toFixed(
          2
        )}).`
      );
    } else if (nameScore > 0) {
      score += 0.05;
      reasons.push(
        `Gegenseiten-Name teilweise ähnlich (Jaccard ${nameScore.toFixed(2)}).`
      );
    }
  }

  // Richtungs-Plausibilität: Eingang (H) passt zu Forderung; Ausgang (S) zu Verbindlichkeit
  const dirMatch =
    (tx.typ === "H" && item.kind === "forderung") ||
    (tx.typ === "S" && item.kind === "verbindlichkeit");
  if (!dirMatch) {
    score = Math.max(0, score - 0.4);
    reasons.push(
      `Richtung passt nicht (Bank ${tx.typ === "H" ? "Eingang" : "Ausgang"}, OPOS ${
        item.kind
      }).`
    );
  }

  let confidence: MatchConfidence = "low";
  if (sameAmount && belegMatch && dirMatch) confidence = "exact";
  else if (sameAmount && nameScore >= 0.5 && dirMatch) confidence = "high";
  else if (sameAmount && dirMatch) confidence = "medium";
  else confidence = "low";

  return {
    openItem: item,
    confidence,
    score: Math.max(0, Math.min(1, score)),
    reasons,
  };
}

export function topMatches(
  tx: BankTx,
  items: OpenItem[],
  limit = 3
): BankMatchCandidate[] {
  const scored = items.map((it) => scoreMatch(tx, it));
  scored.sort((a, b) => b.score - a.score);
  return scored.filter((c) => c.score > 0.2).slice(0, limit);
}
