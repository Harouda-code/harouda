import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Clock,
  Download,
  FileArchive,
  FileSearch,
  Loader2,
  Search,
  ShieldCheck,
  X,
} from "lucide-react";
import {
  fetchInvoiceArchive,
  verifyArchiveIntegrity,
  type IntegrityResult,
} from "../api/invoiceArchive";
import { useMandant } from "../contexts/MandantContext";
import { downloadBlob } from "../utils/exporters";
import { usePermissions } from "../hooks/usePermissions";
import type {
  InvoiceArchiveEntry,
  InvoiceXmlArchiveEntry,
} from "../types/db";
import "./ReportView.css";
import "./TaxCalc.css";
import "./InvoiceArchivePage.css";

const euro = new Intl.NumberFormat("de-DE", {
  style: "currency",
  currency: "EUR",
});

type Row = InvoiceArchiveEntry & { xml: InvoiceXmlArchiveEntry | null };

type PreviewState = {
  row: Row;
} | null;

function daysUntil(iso: string): number {
  const target = new Date(iso + "T00:00:00").getTime();
  return Math.ceil((target - Date.now()) / (1000 * 60 * 60 * 24));
}

function base64ToBlob(base64: string, mime: string): Blob {
  const bin = atob(base64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new Blob([new Uint8Array(bytes)], { type: mime });
}

export default function InvoiceArchivePage() {
  const perms = usePermissions();
  const qc = useQueryClient();
  const { selectedMandantId } = useMandant();
  const [search, setSearch] = useState("");
  const [formatFilter, setFormatFilter] = useState<string>("alle");
  const [sourceFilter, setSourceFilter] = useState<string>("alle");
  const [preview, setPreview] = useState<PreviewState>(null);
  const [integrityById, setIntegrityById] = useState<
    Record<string, IntegrityResult>
  >({});

  const archiveQ = useQuery({
    queryKey: ["invoice_archive", selectedMandantId],
    queryFn: () => fetchInvoiceArchive(selectedMandantId),
    refetchOnMount: "always",
  });

  const rows: Row[] = archiveQ.data ?? [];

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((r) => {
      if (formatFilter !== "alle" && (r.xml?.format ?? "unknown") !== formatFilter)
        return false;
      if (sourceFilter !== "alle" && r.source !== sourceFilter) return false;
      if (!q) return true;
      const hay = [
        r.original_filename,
        r.xml?.supplier_name,
        r.xml?.invoice_number,
        r.xml?.buyer_name,
        r.content_sha256,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }, [rows, search, formatFilter, sourceFilter]);

  const verifyM = useMutation({
    mutationFn: verifyArchiveIntegrity,
    onSuccess: (res, archiveId) => {
      setIntegrityById((prev) => ({ ...prev, [archiveId]: res }));
      if (res.ok) toast.success(res.message);
      else toast.error(res.message);
      qc.invalidateQueries({ queryKey: ["audit_log"] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  function handleDownloadOriginal(row: Row) {
    if (!row.content_b64) {
      toast.error("Keine lokale Kopie verfügbar (Storage-Backend nutzen).");
      return;
    }
    const blob = base64ToBlob(row.content_b64, row.mime_type);
    downloadBlob(blob, row.original_filename);
  }

  function handleDownloadXml(row: Row) {
    if (!row.xml) {
      toast.error("Keine XML-Daten für diesen Eintrag.");
      return;
    }
    const blob = new Blob([row.xml.xml_content], {
      type: "application/xml;charset=utf-8",
    });
    const name = row.xml.invoice_number
      ? `${row.xml.invoice_number}.xml`
      : `rechnung_${row.id.slice(0, 8)}.xml`;
    downloadBlob(blob, name);
  }

  if (!perms.canRead) {
    return (
      <div className="report">
        <header className="report__head">
          <h1>E-Rechnung-Archiv</h1>
        </header>
        <aside className="taxcalc__hint">
          <AlertTriangle size={14} />
          <span>Kein Zugriff — Sie sind keiner Firma zugeordnet.</span>
        </aside>
      </div>
    );
  }

  return (
    <div className="report earchiv">
      <header className="report__head">
        <Link to="/zugferd" className="report__back">
          <ArrowLeft size={16} />
          Zurück zu E-Rechnung-Import
        </Link>
        <div className="report__head-title">
          <h1>
            <FileArchive
              size={22}
              style={{ verticalAlign: "-3px", marginRight: 8 }}
            />
            E-Rechnung-Archiv
          </h1>
          <p>
            Duales Archiv: Original-PDF/XML plus extrahierte CII/UBL-Daten mit
            SHA-256-Prüfsumme. Retention 10 Jahre gemäß § 147 AO. GoBD-orientiert
            — keine eigene Zertifizierung.
          </p>
        </div>
      </header>

      <section className="earchiv__badges">
        <span className="earchiv__badge is-ok">
          <ShieldCheck size={12} /> GoBD-orientiert
        </span>
        <span className="earchiv__badge">
          <Clock size={12} /> 10-Jahres-Retention
        </span>
        <span className="earchiv__badge">
          <FileSearch size={12} /> SHA-256-Integrität
        </span>
      </section>

      <div className="card earchiv__toolbar">
        <label className="journal__search">
          <Search size={16} />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Suche (Dateiname, Lieferant, Rechnungsnr., Hash-Präfix) …"
          />
        </label>
        <select
          className="journal__select"
          value={formatFilter}
          onChange={(e) => setFormatFilter(e.target.value)}
        >
          <option value="alle">Alle Formate</option>
          <option value="cii">CII (ZUGFeRD/Factur-X)</option>
          <option value="ubl">UBL</option>
          <option value="xrechnung">XRechnung</option>
          <option value="unknown">Unbekannt</option>
        </select>
        <select
          className="journal__select"
          value={sourceFilter}
          onChange={(e) => setSourceFilter(e.target.value)}
        >
          <option value="alle">Alle Quellen</option>
          <option value="zugferd-import">ZUGFeRD-Import</option>
          <option value="upload">Direkt-Upload</option>
          <option value="legacy">Nachpflege</option>
        </select>
        <div className="journal__count">
          <strong>{filtered.length}</strong> von {rows.length}
        </div>
      </div>

      {archiveQ.isLoading ? (
        <div className="card earchiv__empty">
          <Loader2 size={22} className="login__spinner" />
          <p>Lade Archiv …</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="card earchiv__empty">
          <p>
            Keine Einträge im Archiv. Importieren Sie eine E-Rechnung unter{" "}
            <Link to="/zugferd">ZUGFeRD / XRechnung</Link>.
          </p>
        </div>
      ) : (
        <table className="earchiv__table">
          <thead>
            <tr>
              <th>Datei</th>
              <th>Lieferant</th>
              <th>Rechnungs-Nr.</th>
              <th>Format</th>
              <th className="is-num">Brutto</th>
              <th>Retention</th>
              <th>Prüfsumme</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => {
              const days = daysUntil(r.retention_until);
              const integrity = integrityById[r.id];
              return (
                <tr key={r.id}>
                  <td>
                    <div className="earchiv__file">
                      <strong>{r.original_filename}</strong>
                      <span className="earchiv__muted">
                        {new Date(r.uploaded_at).toLocaleDateString("de-DE")}{" "}
                        · {r.source}
                      </span>
                    </div>
                  </td>
                  <td>{r.xml?.supplier_name ?? "—"}</td>
                  <td className="mono">{r.xml?.invoice_number ?? "—"}</td>
                  <td>
                    <span className={`earchiv__fmt is-${r.xml?.format ?? "unknown"}`}>
                      {r.xml?.format ?? "—"}
                    </span>
                  </td>
                  <td className="is-num mono">
                    {r.xml?.grand_total != null
                      ? euro.format(Number(r.xml.grand_total))
                      : "—"}
                  </td>
                  <td>
                    <div
                      className={`earchiv__retention ${
                        days > 365 * 5
                          ? "is-far"
                          : days > 90
                            ? "is-mid"
                            : days > 0
                              ? "is-soon"
                              : "is-expired"
                      }`}
                    >
                      {r.retention_until}
                      <span className="earchiv__muted">
                        {days > 0 ? `in ${days} Tagen` : `seit ${-days} Tagen abgelaufen`}
                      </span>
                    </div>
                  </td>
                  <td>
                    <div className="earchiv__sha">
                      <code title={r.content_sha256}>
                        {r.content_sha256.slice(0, 10)}…
                      </code>
                      {integrity && (
                        <span
                          style={{
                            color: integrity.ok
                              ? "var(--success)"
                              : "var(--danger)",
                            fontWeight: 700,
                            fontSize: "0.72rem",
                          }}
                        >
                          {integrity.ok ? "✓ OK" : "✗ BRUCH"}
                        </span>
                      )}
                    </div>
                  </td>
                  <td>
                    <div className="earchiv__actions">
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm"
                        onClick={() => setPreview({ row: r })}
                        title="Vorschau (Rechnung + XML)"
                      >
                        <FileSearch size={14} />
                      </button>
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm"
                        onClick={() => handleDownloadOriginal(r)}
                        title="Original herunterladen"
                        disabled={!r.content_b64}
                      >
                        <Download size={14} />
                      </button>
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm"
                        onClick={() => verifyM.mutate(r.id)}
                        title="Integrität prüfen"
                        disabled={verifyM.isPending}
                      >
                        <CheckCircle2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}

      {preview && (
        <ArchivePreviewModal
          row={preview.row}
          onClose={() => setPreview(null)}
          onDownloadOriginal={() => handleDownloadOriginal(preview.row)}
          onDownloadXml={() => handleDownloadXml(preview.row)}
        />
      )}
    </div>
  );
}

function ArchivePreviewModal({
  row,
  onClose,
  onDownloadOriginal,
  onDownloadXml,
}: {
  row: Row;
  onClose: () => void;
  onDownloadOriginal: () => void;
  onDownloadXml: () => void;
}) {
  const isPdf = row.mime_type === "application/pdf";
  const pdfUrl = useMemo(() => {
    if (!isPdf || !row.content_b64) return null;
    const blob = base64ToBlob(row.content_b64, row.mime_type);
    return URL.createObjectURL(blob);
  }, [row, isPdf]);

  return (
    <div
      className="earchiv__modal-backdrop"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="earchiv__modal"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="earchiv__modal-head">
          <div>
            <h2>{row.original_filename}</h2>
            <p>
              {row.xml?.supplier_name ?? "Lieferant unbekannt"}
              {row.xml?.invoice_number
                ? ` · ${row.xml.invoice_number}`
                : ""}
            </p>
          </div>
          <div className="earchiv__modal-actions">
            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={onDownloadOriginal}
            >
              <Download size={14} /> Original
            </button>
            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={onDownloadXml}
            >
              <Download size={14} /> XML
            </button>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={onClose}
              aria-label="Schließen"
            >
              <X size={16} />
            </button>
          </div>
        </header>
        <div className="earchiv__modal-body">
          <div className="earchiv__preview-pdf">
            <h3>Original</h3>
            {pdfUrl ? (
              <iframe
                src={pdfUrl}
                title="PDF-Vorschau"
                style={{ width: "100%", height: "100%", border: "none" }}
              />
            ) : (
              <div className="earchiv__no-pdf">
                <p>
                  Keine PDF-Vorschau verfügbar (
                  {row.mime_type || "unbekannt"}).
                </p>
                {row.content_b64 && (
                  <button
                    type="button"
                    className="btn btn-outline btn-sm"
                    onClick={onDownloadOriginal}
                  >
                    <Download size={14} /> Original herunterladen
                  </button>
                )}
              </div>
            )}
          </div>
          <div className="earchiv__preview-xml">
            <h3>Extrahierte XML</h3>
            <pre>{row.xml?.xml_content ?? "— keine XML archiviert —"}</pre>
          </div>
        </div>
      </div>
    </div>
  );
}
