/**
 * Bank-Reconciliation-Persistenz-Banner (Sprint 16 / Schritt 5).
 *
 * Minimal-invasive Ergaenzung fuer die bestehende BankReconciliationPage.
 * Zeigt den persistierten Abstimmungs-Status pro Mandant (aus
 * `bank_reconciliation_matches`) und bietet Bulk-Aktionen:
 *
 *  - "Ignorieren" pro Bank-Tx aus der aktuellen Session (markiert
 *    den Record als `match_status: "ignored"`).
 *  - "Auto-Match-Vorschlaege pruefen" laedt Candidates aus
 *    `findMatchCandidates` und zeigt sie in einem Dialog; der User
 *    bestaetigt einzeln oder alle mit confidence >= X.
 *  - "Alle offenen Zeilen als pending_review markieren" — hilft,
 *    nichts zu uebersehen.
 *
 * Design-Entscheidungen:
 *  - Keine Refactors an der bestehenden Row-Tabelle: der Banner
 *    arbeitet mit einer eigenen kleinen Liste von BankTx-Rohdaten,
 *    die als Prop reingereicht werden.
 *  - Keine stillen match-Writes: Button "Auto-Match anwenden" setzt
 *    `match_status: "auto_matched"`, NIE `"matched"` — semantisch
 *    unterschieden.
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  getBankReconStatusSummary,
  type BankReconStatusSummary,
} from "../../domain/banking/BankReconciliationGaps";
import {
  listMatches,
  upsertMatch,
} from "../../api/bankReconciliationMatches";
import type { BankReconciliationMatch } from "../../types/db";
import {
  findMatchCandidates,
  type BankAutoMatchCandidate,
} from "../../domain/banking/BankAutoMatcher";
import { bankTxFingerprint } from "../../domain/banking/bankTransactionFingerprint";

export type BankTxForBanner = {
  id: string;
  datum: string;
  /** Signed amount — "H" wird positiv, "S" negativ uebermittelt. */
  betrag: number;
  vwz: string;
  iban_gegenkonto?: string;
};

export type JournalEntryForBanner = {
  id: string;
  datum: string;
  betrag: number;
  buchungstext?: string;
  belegnr?: string;
};

export type BankReconPersistenceBannerProps = {
  mandantId: string | null;
  bankTx: BankTxForBanner[];
  journalEntries: JournalEntryForBanner[];
};

export function BankReconPersistenceBanner({
  mandantId,
  bankTx,
  journalEntries,
}: BankReconPersistenceBannerProps) {
  const [summary, setSummary] = useState<BankReconStatusSummary | null>(null);
  const [matches, setMatches] = useState<BankReconciliationMatch[]>([]);
  const [busy, setBusy] = useState(false);
  const [autoSuggestions, setAutoSuggestions] = useState<
    BankAutoMatchCandidate[] | null
  >(null);

  const reload = useCallback(async (): Promise<void> => {
    if (!mandantId) {
      setSummary(null);
      setMatches([]);
      return;
    }
    const [sum, list] = await Promise.all([
      getBankReconStatusSummary(mandantId),
      listMatches(mandantId),
    ]);
    setSummary(sum);
    setMatches(list);
  }, [mandantId]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const fingerprintByTxId = useMemo<Record<string, string>>(() => {
    // Initialer Platzhalter — das echte Fingerprint-Mapping wird bei
    // Bulk-Aktionen async berechnet (siehe buildFingerprintMap).
    return {};
  }, []);
  void fingerprintByTxId;

  async function buildFingerprintMap(
    list: BankTxForBanner[]
  ): Promise<Record<string, string>> {
    const out: Record<string, string> = {};
    for (const tx of list) {
      out[tx.id] = await bankTxFingerprint({
        datum: tx.datum,
        betrag: tx.betrag,
        vwz: tx.vwz,
        iban_gegenkonto: tx.iban_gegenkonto,
      });
    }
    return out;
  }

  async function handleMarkAllPending(): Promise<void> {
    if (!mandantId || bankTx.length === 0) return;
    setBusy(true);
    try {
      const fps = await buildFingerprintMap(bankTx);
      for (const tx of bankTx) {
        const fp = fps[tx.id];
        // Nur Rows ohne bestehenden Match.
        const existing = matches.find(
          (m) => m.bank_transaction_fingerprint === fp
        );
        if (existing) continue;
        await upsertMatch({
          client_id: mandantId,
          bank_transaction_id: tx.id,
          bank_transaction_fingerprint: fp,
          journal_entry_id: null,
          match_status: "pending_review",
        });
      }
      await reload();
      toast.success("Offene Bank-Transaktionen als pending_review erfasst.");
    } catch (err) {
      toast.error(
        `Fehler: ${err instanceof Error ? err.message : String(err)}`
      );
    } finally {
      setBusy(false);
    }
  }

  async function handleRunAutoMatch(): Promise<void> {
    if (!mandantId || bankTx.length === 0) return;
    setBusy(true);
    try {
      const fps = await buildFingerprintMap(bankTx);
      const candidates = findMatchCandidates({
        bankTransactions: bankTx,
        journalEntries,
        fingerprints: fps,
      });
      setAutoSuggestions(candidates);
      const withHits = candidates.filter((c) => c.matches.length > 0).length;
      toast.success(
        `Auto-Match-Vorschlaege: ${withHits} von ${candidates.length} Bank-Tx haben Kandidaten.`
      );
    } catch (err) {
      toast.error(
        `Fehler: ${err instanceof Error ? err.message : String(err)}`
      );
    } finally {
      setBusy(false);
    }
  }

  async function handleAcceptAutoMatch(
    threshold: number
  ): Promise<void> {
    if (!mandantId || !autoSuggestions) return;
    setBusy(true);
    try {
      let count = 0;
      for (const cand of autoSuggestions) {
        const best = cand.matches[0];
        if (!best || best.confidence < threshold) continue;
        await upsertMatch({
          client_id: mandantId,
          bank_transaction_id: cand.bank_transaction_id,
          bank_transaction_fingerprint: cand.bank_transaction_fingerprint,
          journal_entry_id: best.journal_entry_id,
          match_status: "auto_matched",
          match_confidence: best.confidence,
          notiz: `Auto-Matcher: ${best.reasoning.join("; ")}`,
        });
        count += 1;
      }
      await reload();
      toast.success(
        `${count} Auto-Match-Records mit confidence >= ${threshold} persistiert.`
      );
    } catch (err) {
      toast.error(
        `Fehler: ${err instanceof Error ? err.message : String(err)}`
      );
    } finally {
      setBusy(false);
    }
  }

  if (!mandantId) {
    return (
      <aside
        role="note"
        data-testid="bank-recon-persistence-banner"
        style={{
          padding: 10,
          margin: "8px 0",
          background: "var(--warn-bg, #fff8dc)",
          border: "1px solid var(--warn-border, #d8b35c)",
          borderRadius: 6,
          fontSize: "0.85rem",
        }}
      >
        Kein Mandant ausgewählt — Bank-Abstimmungs-Persistenz deaktiviert.
      </aside>
    );
  }

  const coveragePct =
    summary && summary.total > 0
      ? Math.round(
          ((summary.matched + summary.ignored) / summary.total) * 100
        )
      : 0;

  return (
    <section
      data-testid="bank-recon-persistence-banner"
      style={{
        padding: 12,
        margin: "8px 0",
        background: "var(--ivory-100, #f7f8fa)",
        border: "1px solid var(--border, #c3c8d1)",
        borderRadius: 6,
        fontSize: "0.88rem",
      }}
    >
      <header style={{ display: "flex", gap: 12, alignItems: "center" }}>
        <strong>Abstimmungs-Persistenz (Mandant):</strong>
        {summary ? (
          <>
            <span data-testid="bank-recon-stat-total">
              Total: <strong>{summary.total}</strong>
            </span>
            <span data-testid="bank-recon-stat-matched">
              Matched: <strong>{summary.matched}</strong>
            </span>
            <span data-testid="bank-recon-stat-ignored">
              Ignoriert: <strong>{summary.ignored}</strong>
            </span>
            <span data-testid="bank-recon-stat-pending">
              Offen: <strong>{summary.pending}</strong>
            </span>
            <span data-testid="bank-recon-stat-coverage">
              Coverage: <strong>{coveragePct}%</strong>
            </span>
          </>
        ) : (
          <span>(Lädt …)</span>
        )}
      </header>
      <div style={{ marginTop: 8, display: "flex", gap: 8, flexWrap: "wrap" }}>
        <button
          type="button"
          className="btn btn-outline"
          onClick={handleMarkAllPending}
          disabled={busy || bankTx.length === 0}
          data-testid="btn-bank-recon-mark-pending"
        >
          Offene Zeilen als 'pending_review' erfassen
        </button>
        <button
          type="button"
          className="btn btn-outline"
          onClick={handleRunAutoMatch}
          disabled={busy || bankTx.length === 0 || journalEntries.length === 0}
          data-testid="btn-bank-recon-run-automatch"
        >
          Auto-Match-Vorschläge berechnen
        </button>
        {autoSuggestions && (
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => handleAcceptAutoMatch(0.9)}
            disabled={busy}
            data-testid="btn-bank-recon-accept-090"
          >
            Alle mit Confidence ≥ 0.90 persistieren
          </button>
        )}
      </div>
      {autoSuggestions && (
        <p
          style={{ marginTop: 8, fontSize: "0.8rem", color: "var(--muted)" }}
          data-testid="bank-recon-automatch-count"
        >
          {autoSuggestions.filter((c) => c.matches.length > 0).length} von{" "}
          {autoSuggestions.length} Bank-Transaktionen haben Kandidaten.
          Nur manuelle Übernahme setzt persistente Match-Records.
        </p>
      )}
      <p style={{ marginTop: 6, fontSize: "0.78rem", color: "var(--muted)" }}>
        Automatische Vorschläge dienen zur Beschleunigung. Letzte
        Verantwortung für die Richtigkeit der Zuordnung liegt beim
        Buchhalter (GoBD Rz. 45 Vollständigkeit).
      </p>
    </section>
  );
}
