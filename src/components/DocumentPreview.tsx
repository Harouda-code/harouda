import { useEffect, useMemo } from "react";
import { ChevronLeft, ChevronRight, Link2, X } from "lucide-react";
import type { Document, JournalEntry } from "../types/db";
import { getDocumentUrl, formatFileSize } from "../api/documents";
import "./DocumentPreview.css";

type Props = {
  doc: Document;
  entries: JournalEntry[];
  siblings: Document[];
  onClose: () => void;
  onNavigate: (doc: Document) => void;
};

export default function DocumentPreview({
  doc,
  entries,
  siblings,
  onClose,
  onNavigate,
}: Props) {
  const url = useMemo(() => getDocumentUrl(doc), [doc]);
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
            {url && isImage && <img src={url} alt={doc.file_name} />}
            {url && isPdf && (
              <iframe
                src={url}
                title={doc.file_name}
                style={{ width: "100%", height: "100%", border: 0 }}
              />
            )}
            {!url && (
              <div className="docprev__empty">
                <p>Vorschau nicht verfügbar.</p>
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
