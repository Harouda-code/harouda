import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Link2, Loader2, X } from "lucide-react";
import type { Document, JournalEntry } from "../types/db";
import { getAnyDocumentUrl, formatFileSize } from "../api/documents";
import "./DocumentPreview.css";

type Props = {
  doc: Document;
  entries: JournalEntry[];
  siblings: Document[];
  onClose: () => void;
  onNavigate: (doc: Document) => void;
};

/**
 * Lokaler Zustand der Vorschau-Aufloesung.
 *
 * `notAvailable` signalisiert das _erwartete_ Fehlen einer URL
 * (z. B. fehlender Storage-Pfad oder geloeschter Blob).
 * `error` signalisiert _unerwartete_ I/O-Fehler (Netzwerk, Storage,
 * abgelaufene Session). Die Trennung ermoeglicht differenzierte
 * UI-Hinweise.
 */
type PreviewState =
  | { kind: "loading" }
  | { kind: "loaded"; url: string }
  | { kind: "notAvailable" }
  | { kind: "error"; message: string };

export default function DocumentPreview({
  doc,
  entries,
  siblings,
  onClose,
  onNavigate,
}: Props) {
  const [previewState, setPreviewState] = useState<PreviewState>({
    kind: "loading",
  });

  useEffect(() => {
    let cancelled = false;
    // Vorher-Zustand auf "loading" setzen, damit beim Wechsel zwischen
    // Dokumenten (siblings navigation) NICHT kurzzeitig die URL des
    // vorherigen Dokuments sichtbar bleibt. Der ESLint-Hinweis weist auf
    // einen zusaetzlichen Render-Cycle hin — das ist hier BEWUSST in Kauf
    // genommen, weil der UX-Schaden (Flicker) groesser waere als die
    // Performance-Kosten eines zusaetzlichen Renders.
    //
    // Saubere Loesung waere `<DocumentPreview key={doc.id} />` im Parent —
    // beruehrt aber DocumentsPage.tsx und liegt damit ausserhalb des
    // Scopes von PR 4 (refactor/documents-preview-async).
    // Geplant fuer Charge 11, Schuld 10-ح.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPreviewState({ kind: "loading" });

    getAnyDocumentUrl(doc)
      .then((url) => {
        if (cancelled) return;
        setPreviewState(
          url ? { kind: "loaded", url } : { kind: "notAvailable" }
        );
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        const message =
          err instanceof Error ? err.message : "Unbekannter Fehler.";
        setPreviewState({ kind: "error", message });
      });

    return () => {
      cancelled = true;
    };
  }, [doc]);

  const linkedEntry = useMemo(
    () =>
      doc.journal_entry_id
        ? entries.find((e) => e.id === doc.journal_entry_id)
        : null,
    [doc.journal_entry_id, entries]
  );

  const idx = siblings.findIndex((d) => d.id === doc.id);
  const prev = idx > 0 ? siblings[idx - 1] : null;
  const next = idx >= 0 && idx < siblings.length - 1 ? siblings[idx + 1] : null;

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowLeft" && prev) onNavigate(prev);
      else if (e.key === "ArrowRight" && next) onNavigate(next);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [prev, next, onClose, onNavigate]);

  const isImage = doc.mime_type?.startsWith("image/");
  const isPdf = doc.mime_type === "application/pdf";

  return (
    <div
      className="docprev__backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="docprev">
        <header className="docprev__head">
          <div className="docprev__title">
            <strong>{doc.file_name}</strong>
            <span>
              {formatFileSize(doc.size_bytes)} ·{" "}
              {new Date(doc.uploaded_at).toLocaleDateString("de-DE")}
            </span>
          </div>
          <button
            type="button"
            className="btn btn-ghost"
            onClick={onClose}
            aria-label="Schließen"
          >
            <X size={18} />
          </button>
        </header>

        <div className="docprev__body">
          {prev && (
            <button
              type="button"
              className="docprev__nav is-prev"
              onClick={() => onNavigate(prev)}
              aria-label="Vorheriges Dokument"
            >
              <ChevronLeft size={20} />
            </button>
          )}
          <div className="docprev__viewer">
            {previewState.kind === "loading" && (
              <div
                className="docprev__empty"
                role="status"
                aria-live="polite"
              >
                <Loader2
                  size={32}
                  className="docprev__spinner"
                  aria-hidden="true"
                />
                <p>Vorschau wird geladen…</p>
              </div>
            )}
            {previewState.kind === "loaded" && isImage && (
              <img src={previewState.url} alt={doc.file_name} />
            )}
            {previewState.kind === "loaded" && isPdf && (
              <iframe
                src={previewState.url}
                title={doc.file_name}
                style={{ width: "100%", height: "100%", border: 0 }}
              />
            )}
            {previewState.kind === "notAvailable" && (
              <div className="docprev__empty">
                <p>Vorschau nicht verfügbar.</p>
              </div>
            )}
            {previewState.kind === "error" && (
              <div className="docprev__empty" role="alert">
                <p>Vorschau konnte nicht geladen werden.</p>
                <p className="docprev__error-detail">{previewState.message}</p>
              </div>
            )}
          </div>
          {next && (
            <button
              type="button"
              className="docprev__nav is-next"
              onClick={() => onNavigate(next)}
              aria-label="Nächstes Dokument"
            >
              <ChevronRight size={20} />
            </button>
          )}
        </div>

        <footer className="docprev__foot">
          {linkedEntry ? (
            <p className="docprev__link is-linked">
              <Link2 size={14} />
              <span className="mono">{linkedEntry.beleg_nr}</span>
              <span>{linkedEntry.beschreibung}</span>
            </p>
          ) : (
            <p className="docprev__link">
              <Link2 size={14} />
              <span>Keine Buchung verknüpft</span>
            </p>
          )}
          {doc.ocr_text && (
            <details className="docprev__ocr">
              <summary>OCR-Text</summary>
              <pre>{doc.ocr_text}</pre>
            </details>
          )}
        </footer>
      </div>
    </div>
  );
}
