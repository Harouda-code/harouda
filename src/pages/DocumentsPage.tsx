import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
} from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  FileText,
  Image as ImageIcon,
  Link2,
  Loader2,
  ScanText,
  Search,
  Upload,
  Zap,
} from "lucide-react";
import {
  downloadDocumentAsFile,
  fetchDocuments,
  formatFileSize,
  updateDocumentOcr,
  uploadDocument,
} from "../api/documents";
import { fetchAllEntries } from "../api/dashboard";
import { isOcrSupported, runOcrForFile } from "../utils/ocr";
import DocumentPreview from "../components/DocumentPreview";
import { useMandant } from "../contexts/MandantContext";
import { useYear } from "../contexts/YearContext";
import type { Document } from "../types/db";
import "./DocumentsPage.css";

type LinkFilter = "alle" | "verknuepft" | "unverknuepft";

export default function DocumentsPage() {
  const qc = useQueryClient();
  const { selectedMandantId } = useMandant();
  const { inYear, selectedYear } = useYear();

  const docsQ = useQuery({
    queryKey: ["documents", "all", selectedMandantId],
    queryFn: () => fetchDocuments(selectedMandantId),
  });
  const entriesQ = useQuery({
    queryKey: ["journal_entries", "all", selectedMandantId],
    queryFn: fetchAllEntries,
  });

  const [search, setSearch] = useState("");
  const [linkFilter, setLinkFilter] = useState<LinkFilter>("alle");
  const [preview, setPreview] = useState<Document | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [ocrInProgress, setOcrInProgress] = useState<Set<string>>(new Set());
  const [batchState, setBatchState] = useState<{
    current: number;
    total: number;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const entries = entriesQ.data ?? [];
  const docs = docsQ.data ?? [];

  const entryById = useMemo(
    () => new Map(entries.map((e) => [e.id, e])),
    [entries]
  );

  const filtered = useMemo(() => {
    let list = docs.filter((d) => inYear(d.uploaded_at));

    // Global Mandant filter: keep docs linked to that Mandant plus
    // unlinked docs (considered "unassigned" and visible regardless).
    if (selectedMandantId) {
      list = list.filter((d) => {
        if (!d.journal_entry_id) return true;
        const entry = entryById.get(d.journal_entry_id);
        return entry?.client_id === selectedMandantId;
      });
    }

    if (linkFilter === "verknuepft")
      list = list.filter((d) => d.journal_entry_id !== null);
    else if (linkFilter === "unverknuepft")
      list = list.filter((d) => d.journal_entry_id === null);

    const q = search.trim().toLowerCase();
    if (q)
      list = list.filter(
        (d) =>
          d.file_name.toLowerCase().includes(q) ||
          d.beleg_nr?.toLowerCase().includes(q) ||
          (d.journal_entry_id &&
            entryById.get(d.journal_entry_id)?.beleg_nr
              .toLowerCase()
              .includes(q))
      );
    return list;
  }, [docs, search, linkFilter, entryById, selectedMandantId, inYear]);

  const uploadM = useMutation({
    mutationFn: (file: File) => uploadDocument(file, selectedMandantId),
    onSuccess: (doc, file) => {
      toast.success(`Beleg "${doc.file_name}" hochgeladen.`);
      qc.invalidateQueries({ queryKey: ["documents"] });
      if (isOcrSupported(doc.mime_type)) runOcrFor(doc, file);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  async function runOcrFor(doc: Document, file: File) {
    setOcrInProgress((s) => {
      const n = new Set(s);
      n.add(doc.id);
      return n;
    });
    try {
      const text = await runOcrForFile(file);
      await updateDocumentOcr(doc.id, text, selectedMandantId);
      qc.invalidateQueries({ queryKey: ["documents"] });
    } catch (err) {
      console.error("OCR failed:", err);
      toast.error(`OCR fehlgeschlagen: ${(err as Error).message}`);
    } finally {
      setOcrInProgress((s) => {
        const n = new Set(s);
        n.delete(doc.id);
        return n;
      });
    }
  }

  async function handleBatchOcr() {
    const pending = docs.filter(
      (d) => !d.ocr_text && isOcrSupported(d.mime_type) && d.file_path
    );
    if (pending.length === 0) {
      toast.info("Keine Belege ohne OCR gefunden.");
      return;
    }
    if (
      !confirm(
        `OCR fuer ${pending.length} Beleg${
          pending.length === 1 ? "" : "e"
        } durchfuehren? Dies kann einige Minuten dauern.`
      )
    ) {
      return;
    }

    setBatchState({ current: 0, total: pending.length });
    let success = 0;
    let failed = 0;

    for (let i = 0; i < pending.length; i++) {
      const d = pending[i];
      setBatchState({ current: i + 1, total: pending.length });
      try {
        const file = await downloadDocumentAsFile(d);
        const text = await runOcrForFile(file);
        await updateDocumentOcr(d.id, text, selectedMandantId);
        success++;
      } catch (err) {
        console.error(`Batch-OCR for ${d.file_name} failed:`, err);
        failed++;
      }
    }

    setBatchState(null);
    qc.invalidateQueries({ queryKey: ["documents"] });
    if (failed === 0) {
      toast.success(
        `Batch-OCR abgeschlossen: ${success} Beleg${
          success === 1 ? "" : "e"
        } verarbeitet.`
      );
    } else {
      toast.warning(
        `Batch-OCR abgeschlossen: ${success} erfolgreich, ${failed} fehlgeschlagen.`,
        { duration: 8000 }
      );
    }
  }

  const ocrPendingCount = useMemo(
    () =>
      docs.filter(
        (d) => !d.ocr_text && isOcrSupported(d.mime_type) && d.file_path
      ).length,
    [docs]
  );

  useEffect(() => {
    // Keep preview prop in sync when documents refresh
    if (preview) {
      const updated = docs.find((d) => d.id === preview.id);
      if (!updated) setPreview(null);
      else if (updated !== preview) setPreview(updated);
    }
  }, [docs, preview]);

  function handleFiles(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return;
    const files = Array.from(fileList);
    files.forEach((f) => uploadM.mutate(f));
  }

  function handleFileInput(e: ChangeEvent<HTMLInputElement>) {
    handleFiles(e.target.files);
    e.target.value = "";
  }

  function handleDragEnter(e: DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }

  function handleDragLeave(e: DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (e.currentTarget === e.target) setIsDragging(false);
  }

  function handleDragOver(e: DragEvent) {
    e.preventDefault();
    e.stopPropagation();
  }

  function handleDrop(e: DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  }

  const totalSize = docs.reduce((s, d) => s + (d.size_bytes ?? 0), 0);
  const isLoading = docsQ.isLoading || entriesQ.isLoading;

  return (
    <div className="docs">
      <section
        className={`docs__drop${isDragging ? " is-dragging" : ""}${
          uploadM.isPending ? " is-uploading" : ""
        }`}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="application/pdf,image/jpeg,image/png,image/webp"
          onChange={handleFileInput}
          style={{ display: "none" }}
        />
        <div className="docs__drop-icon">
          {uploadM.isPending ? (
            <Loader2 size={28} className="login__spinner" />
          ) : (
            <Upload size={28} strokeWidth={1.5} />
          )}
        </div>
        <h2>
          {uploadM.isPending
            ? "Beleg wird hochgeladen …"
            : "Beleg hochladen"}
        </h2>
        <p>
          Ziehen Sie eine Datei hierher oder{" "}
          <button
            type="button"
            className="docs__drop-link"
            onClick={() => fileInputRef.current?.click()}
          >
            waehlen Sie eine Datei
          </button>
          .<br />
          Erlaubt: PDF, JPG, PNG, WebP &middot; max. 10 MB
        </p>
      </section>

      <div className="docs__toolbar">
        <label className="journal__search">
          <Search size={16} />
          <input
            type="search"
            placeholder="Suche nach Dateiname oder Beleg-Nr …"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </label>

        <select
          className="journal__select"
          value={linkFilter}
          onChange={(e) => setLinkFilter(e.target.value as LinkFilter)}
        >
          <option value="alle">Alle Belege</option>
          <option value="verknuepft">Verknuepft</option>
          <option value="unverknuepft">Ohne Verknuepfung</option>
        </select>

        <div className="journal__count">
          <strong>{filtered.length}</strong> von {docs.length} Belegen ·{" "}
          {formatFileSize(totalSize)} gesamt · Jahr {selectedYear}
        </div>

        {ocrPendingCount > 0 && !batchState && (
          <button
            type="button"
            className="btn btn-outline"
            onClick={handleBatchOcr}
            title={`OCR fuer ${ocrPendingCount} Beleg(e) ohne Texterkennung`}
          >
            <Zap size={16} />
            Batch-OCR ({ocrPendingCount})
          </button>
        )}

        {batchState && (
          <div className="docs__batch" aria-live="polite">
            <Loader2 size={14} className="login__spinner" />
            <span>
              OCR {batchState.current} / {batchState.total}
            </span>
            <div className="docs__batch-bar">
              <span
                style={{
                  width: `${(batchState.current / batchState.total) * 100}%`,
                }}
              />
            </div>
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="journal__state">
          <Loader2 className="journal__state-spin" size={28} />
          <p>Lade Belege …</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="card docs__empty">
          <div className="docs__empty-icon">
            <FileText size={28} strokeWidth={1.5} />
          </div>
          <h2>
            {docs.length === 0
              ? "Noch keine Belege"
              : "Keine Treffer"}
          </h2>
          <p>
            {docs.length === 0
              ? "Laden Sie Ihren ersten Beleg oben hoch. PDF und Bilddateien werden unterstuetzt."
              : "Kein Beleg entspricht Suche oder Filter."}
          </p>
        </div>
      ) : (
        <div className="docs__grid">
          {filtered.map((d) => {
            const entry = d.journal_entry_id
              ? entryById.get(d.journal_entry_id)
              : undefined;
            const isImage = d.mime_type?.startsWith("image/");
            return (
              <button
                key={d.id}
                type="button"
                className="card docs__card"
                onClick={() => setPreview(d)}
              >
                <div className="docs__thumb">
                  {isImage ? (
                    <ImageIcon size={32} strokeWidth={1.25} />
                  ) : (
                    <FileText size={32} strokeWidth={1.25} />
                  )}
                </div>
                <div className="docs__meta">
                  <h3 title={d.file_name}>{d.file_name}</h3>
                  <p className="docs__meta-row">
                    <span>{formatFileSize(d.size_bytes)}</span>
                    <span aria-hidden>·</span>
                    <span>
                      {new Date(d.uploaded_at).toLocaleDateString("de-DE")}
                    </span>
                    {ocrInProgress.has(d.id) ? (
                      <span className="docs__ocr-badge">
                        <Loader2 size={10} className="login__spinner" />
                        OCR …
                      </span>
                    ) : d.ocr_text ? (
                      <span
                        className="docs__ocr-badge is-done"
                        title="OCR-Text verfuegbar"
                      >
                        <ScanText size={10} />
                        OCR
                      </span>
                    ) : null}
                  </p>
                  {entry ? (
                    <p className="docs__link is-linked">
                      <Link2 size={12} />
                      <span className="mono">{entry.beleg_nr}</span>
                      <span className="docs__link-desc">
                        {entry.beschreibung}
                      </span>
                    </p>
                  ) : (
                    <p className="docs__link">
                      <Link2 size={12} />
                      <span>Keine Buchung verknuepft</span>
                    </p>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}

      {preview && (
        <DocumentPreview
          doc={preview}
          entries={entries}
          onClose={() => setPreview(null)}
          siblings={filtered}
          onNavigate={(d) => setPreview(d)}
        />
      )}
    </div>
  );
}
