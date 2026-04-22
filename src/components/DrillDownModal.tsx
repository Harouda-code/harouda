/**
 * Phase 3 / Schritt 8 — Drill-down-Modal für Tax-Page-Summen.
 *
 * Öffnet eine Liste der Journal-Entries, aus denen ein GL-derived
 * Summen-Feld einer ESt-Anlage aggregiert wird, plus einen inline
 * "Korrigieren"-Flow, der `correctEntry()` aus `src/api/journal.ts`
 * triggert. Die Komponente bleibt in diesem Schritt ohne Page-Wiring
 * (Schritt 9 bindet sie an AnlageG/S ein).
 */
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Pencil, X } from "lucide-react";
import { Modal } from "./ui/Modal";
import {
  correctEntry,
  fetchEntriesForAccountsInRange,
  type JournalInput,
} from "../api/journal";
import type { JournalEntry } from "../types/db";

export type DrillDownModalProps = {
  open: boolean;
  onClose: () => void;
  /** Für Modal-Titel, z. B. "Umsätze (Anlage G)". */
  fieldLabel: string;
  /** Konto-Nummern der Positionen, die zu dem Feld aggregiert wurden. */
  kontoNummern: string[];
  /** ISO `YYYY-MM-DD`. */
  zeitraumVon: string;
  /** ISO `YYYY-MM-DD`. */
  zeitraumBis: string;
  /** Aktiver Mandant. Null = kanzleiweit (untypisch für ESt-Anlagen). */
  clientId: string | null;
  /** Page-seitiger Callback nach erfolgreicher Korrekturbuchung. */
  onCorrectionCreated?: (result: {
    reversalId: string;
    correctionId: string;
  }) => void;
};

const euro = new Intl.NumberFormat("de-DE", {
  style: "currency",
  currency: "EUR",
});

type CorrectionDraft = {
  datum: string;
  beleg_nr: string;
  beschreibung: string;
  soll_konto: string;
  haben_konto: string;
  betrag: string;
  reason: string;
};

function draftFromEntry(e: JournalEntry): CorrectionDraft {
  return {
    datum: e.datum,
    beleg_nr: e.beleg_nr,
    beschreibung: e.beschreibung,
    soll_konto: e.soll_konto,
    haben_konto: e.haben_konto,
    betrag: String(e.betrag),
    reason: "",
  };
}

function draftToInput(
  draft: CorrectionDraft,
  original: JournalEntry
): JournalInput {
  const parsed = Number(draft.betrag.replace(",", "."));
  return {
    datum: draft.datum,
    beleg_nr: draft.beleg_nr,
    beschreibung: draft.beschreibung,
    soll_konto: draft.soll_konto,
    haben_konto: draft.haben_konto,
    betrag: Number.isFinite(parsed) ? parsed : 0,
    ust_satz: original.ust_satz,
    status: "gebucht",
    client_id: original.client_id,
    skonto_pct: original.skonto_pct,
    skonto_tage: original.skonto_tage,
    gegenseite: original.gegenseite,
    faelligkeit: original.faelligkeit,
  };
}

export function DrillDownModal({
  open,
  onClose,
  fieldLabel,
  kontoNummern,
  zeitraumVon,
  zeitraumBis,
  clientId,
  onCorrectionCreated,
}: DrillDownModalProps) {
  const queryClient = useQueryClient();
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null);
  const [draft, setDraft] = useState<CorrectionDraft | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const queryKey = useMemo(
    () => [
      "drill-down-entries",
      clientId,
      zeitraumVon,
      zeitraumBis,
      [...kontoNummern].sort().join(","),
    ],
    [clientId, zeitraumVon, zeitraumBis, kontoNummern]
  );

  const entriesQ = useQuery({
    queryKey,
    queryFn: () =>
      fetchEntriesForAccountsInRange(
        kontoNummern,
        zeitraumVon,
        zeitraumBis,
        clientId
      ),
    enabled: open,
  });

  const correctM = useMutation({
    mutationFn: async (args: {
      original: JournalEntry;
      input: JournalInput;
      reason: string;
    }) => correctEntry(args.original.id, args.input, args.reason),
    onSuccess: (result) => {
      toast.success("Korrekturbuchung erstellt.");
      onCorrectionCreated?.({
        reversalId: result.reversal.id,
        correctionId: result.correction.id,
      });
      void queryClient.invalidateQueries({ queryKey });
      setEditingEntryId(null);
      setDraft(null);
      setFormError(null);
    },
    onError: (err) => {
      const msg = err instanceof Error ? err.message : String(err);
      setFormError(msg);
      toast.error(`Korrekturbuchung fehlgeschlagen: ${msg}`);
    },
  });

  // Editing-State zurücksetzen, wenn das Modal schließt.
  useEffect(() => {
    if (!open) {
      setEditingEntryId(null);
      setDraft(null);
      setFormError(null);
    }
  }, [open]);

  const entries = entriesQ.data ?? [];
  const summe = useMemo(
    () => entries.reduce((sum, e) => sum + Number(e.betrag), 0),
    [entries]
  );

  function startCorrection(entry: JournalEntry) {
    setEditingEntryId(entry.id);
    setDraft(draftFromEntry(entry));
    setFormError(null);
  }

  function cancelCorrection() {
    setEditingEntryId(null);
    setDraft(null);
    setFormError(null);
  }

  function submitCorrection(entry: JournalEntry) {
    if (!draft) return;
    const reason = draft.reason.trim();
    if (reason.length < 3) {
      setFormError("Grund ist Pflicht (mindestens 3 Zeichen).");
      return;
    }
    if (draft.soll_konto === draft.haben_konto) {
      setFormError("Soll- und Haben-Konto dürfen nicht identisch sein.");
      return;
    }
    const betrag = Number(draft.betrag.replace(",", "."));
    if (!Number.isFinite(betrag) || betrag <= 0) {
      setFormError("Betrag muss eine positive Zahl sein.");
      return;
    }
    correctM.mutate({
      original: entry,
      input: draftToInput(draft, entry),
      reason,
    });
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Drill-down · ${fieldLabel}`}
      description={
        kontoNummern.length > 0
          ? `Konten: ${kontoNummern.join(", ")} · Zeitraum: ${zeitraumVon} bis ${zeitraumBis}`
          : `Zeitraum: ${zeitraumVon} bis ${zeitraumBis}`
      }
      size="lg"
    >
      {entriesQ.isLoading ? (
        <p data-testid="drill-loading">Lade Buchungen …</p>
      ) : entriesQ.error ? (
        <p role="alert" data-testid="drill-error">
          Fehler beim Laden: {(entriesQ.error as Error).message}
        </p>
      ) : entries.length === 0 ? (
        <p data-testid="drill-empty">Keine Buchungen gefunden.</p>
      ) : (
        <div data-testid="drill-table">
          <table style={{ width: "100%", fontSize: "0.85rem" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border)" }}>
                <th style={{ textAlign: "left", padding: "4px 6px" }}>Datum</th>
                <th style={{ textAlign: "left", padding: "4px 6px" }}>Beleg</th>
                <th style={{ textAlign: "left", padding: "4px 6px" }}>
                  Buchungstext
                </th>
                <th style={{ textAlign: "left", padding: "4px 6px" }}>Soll</th>
                <th style={{ textAlign: "left", padding: "4px 6px" }}>Haben</th>
                <th
                  style={{
                    textAlign: "right",
                    padding: "4px 6px",
                    fontFamily: "var(--font-mono)",
                  }}
                >
                  Betrag
                </th>
                <th style={{ width: 40 }} aria-label="Aktionen" />
              </tr>
            </thead>
            <tbody>
              {entries.map((e) => (
                <RowWithOptionalForm
                  key={e.id}
                  entry={e}
                  isEditing={editingEntryId === e.id}
                  draft={draft}
                  formError={editingEntryId === e.id ? formError : null}
                  isSubmitting={correctM.isPending}
                  onStart={() => startCorrection(e)}
                  onCancel={cancelCorrection}
                  onChange={setDraft}
                  onSubmit={() => submitCorrection(e)}
                />
              ))}
              <tr
                style={{
                  borderTop: "2px solid var(--border)",
                  fontWeight: 700,
                }}
                data-testid="drill-sum-row"
              >
                <td colSpan={5} style={{ padding: "6px 6px" }}>
                  Summe ({entries.length}{" "}
                  {entries.length === 1 ? "Buchung" : "Buchungen"})
                </td>
                <td
                  style={{
                    textAlign: "right",
                    padding: "6px 6px",
                    fontFamily: "var(--font-mono)",
                  }}
                  data-testid="drill-sum-value"
                >
                  {euro.format(summe)}
                </td>
                <td />
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </Modal>
  );
}

type RowProps = {
  entry: JournalEntry;
  isEditing: boolean;
  draft: CorrectionDraft | null;
  formError: string | null;
  isSubmitting: boolean;
  onStart: () => void;
  onCancel: () => void;
  onChange: (d: CorrectionDraft) => void;
  onSubmit: () => void;
};

function RowWithOptionalForm({
  entry,
  isEditing,
  draft,
  formError,
  isSubmitting,
  onStart,
  onCancel,
  onChange,
  onSubmit,
}: RowProps) {
  return (
    <>
      <tr
        style={{ borderBottom: "1px solid var(--border-soft, #eef1f6)" }}
        data-testid={`drill-row-${entry.id}`}
      >
        <td style={{ padding: "4px 6px", fontFamily: "var(--font-mono)" }}>
          {entry.datum}
        </td>
        <td style={{ padding: "4px 6px" }}>{entry.beleg_nr}</td>
        <td style={{ padding: "4px 6px" }}>{entry.beschreibung}</td>
        <td style={{ padding: "4px 6px", fontFamily: "var(--font-mono)" }}>
          {entry.soll_konto}
        </td>
        <td style={{ padding: "4px 6px", fontFamily: "var(--font-mono)" }}>
          {entry.haben_konto}
        </td>
        <td
          style={{
            textAlign: "right",
            padding: "4px 6px",
            fontFamily: "var(--font-mono)",
          }}
        >
          {euro.format(Number(entry.betrag))}
        </td>
        <td style={{ textAlign: "right", padding: "4px 6px" }}>
          {!isEditing && (
            <button
              type="button"
              className="btn btn-ghost"
              onClick={onStart}
              title="Korrekturbuchung anlegen"
              aria-label="Korrigieren"
              data-testid={`drill-correct-btn-${entry.id}`}
            >
              <Pencil size={14} />
            </button>
          )}
        </td>
      </tr>
      {isEditing && draft && (
        <tr data-testid={`drill-form-${entry.id}`}>
          <td colSpan={7} style={{ padding: "8px 12px", background: "var(--ivory-100, #f7f8fa)" }}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
                gap: 8,
              }}
            >
              <label>
                <span style={{ fontSize: "0.75rem" }}>Datum</span>
                <input
                  type="date"
                  value={draft.datum}
                  onChange={(e) => onChange({ ...draft, datum: e.target.value })}
                />
              </label>
              <label>
                <span style={{ fontSize: "0.75rem" }}>Belegnummer</span>
                <input
                  value={draft.beleg_nr}
                  onChange={(e) =>
                    onChange({ ...draft, beleg_nr: e.target.value })
                  }
                />
              </label>
              <label style={{ gridColumn: "span 2" }}>
                <span style={{ fontSize: "0.75rem" }}>Buchungstext</span>
                <input
                  value={draft.beschreibung}
                  onChange={(e) =>
                    onChange({ ...draft, beschreibung: e.target.value })
                  }
                />
              </label>
              <label>
                <span style={{ fontSize: "0.75rem" }}>Soll-Konto</span>
                <input
                  value={draft.soll_konto}
                  onChange={(e) =>
                    onChange({ ...draft, soll_konto: e.target.value })
                  }
                />
              </label>
              <label>
                <span style={{ fontSize: "0.75rem" }}>Haben-Konto</span>
                <input
                  value={draft.haben_konto}
                  onChange={(e) =>
                    onChange({ ...draft, haben_konto: e.target.value })
                  }
                />
              </label>
              <label>
                <span style={{ fontSize: "0.75rem" }}>Betrag</span>
                <input
                  value={draft.betrag}
                  onChange={(e) =>
                    onChange({ ...draft, betrag: e.target.value })
                  }
                  inputMode="decimal"
                />
              </label>
            </div>
            <label style={{ display: "block", marginTop: 8 }}>
              <span style={{ fontSize: "0.75rem" }}>
                Grund der Korrektur (Pflicht, mind. 3 Zeichen)
              </span>
              <textarea
                value={draft.reason}
                onChange={(e) =>
                  onChange({ ...draft, reason: e.target.value })
                }
                rows={2}
                style={{ width: "100%", resize: "vertical" }}
                data-testid={`drill-reason-${entry.id}`}
              />
            </label>
            {formError && (
              <p
                role="alert"
                style={{ color: "var(--danger, #a33)", fontSize: "0.8rem", margin: "4px 0" }}
                data-testid={`drill-form-error-${entry.id}`}
              >
                {formError}
              </p>
            )}
            <div
              style={{
                display: "flex",
                gap: 8,
                justifyContent: "flex-end",
                marginTop: 8,
              }}
            >
              <button
                type="button"
                className="btn btn-ghost"
                onClick={onCancel}
                disabled={isSubmitting}
                data-testid={`drill-cancel-btn-${entry.id}`}
              >
                <X size={14} /> Abbrechen
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={onSubmit}
                disabled={isSubmitting}
                data-testid={`drill-submit-btn-${entry.id}`}
              >
                {isSubmitting ? "Speichere …" : "Korrekturbuchung anlegen"}
              </button>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
