import { useMemo, useRef, useState } from "react";
import { PDFDocument } from "pdf-lib";
import { toast } from "sonner";
import {
  ChevronDown,
  ChevronUp,
  FilePlus2,
  Files,
  Loader2,
  Trash2,
} from "lucide-react";
import { downloadBlob } from "../utils/exporters";

type Entry = {
  id: string;
  file: File;
  pageCount: number;
};

const MAX_TOTAL_BYTES = 200 * 1024 * 1024;

export default function PdfToolsPage() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [busy, setBusy] = useState<"add" | "merge" | null>(null);
  const [outName, setOutName] = useState("zusammengefuegt.pdf");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const totalBytes = useMemo(
    () => entries.reduce((s, e) => s + e.file.size, 0),
    [entries]
  );
  const totalPages = useMemo(
    () => entries.reduce((s, e) => s + e.pageCount, 0),
    [entries]
  );

  async function addFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setBusy("add");
    try {
      const next: Entry[] = [];
      for (const file of Array.from(files)) {
        if (!/\.pdf$/i.test(file.name)) {
          toast.error(`${file.name}: keine PDF-Datei.`);
          continue;
        }
        if (totalBytes + file.size > MAX_TOTAL_BYTES) {
          toast.error(
            `Gesamtgröße über ${Math.round(MAX_TOTAL_BYTES / 1024 / 1024)} MB — ${file.name} übersprungen.`
          );
          continue;
        }
        try {
          const bytes = await file.arrayBuffer();
          const pdf = await PDFDocument.load(bytes, { ignoreEncryption: true });
          next.push({
            id: crypto.randomUUID(),
            file,
            pageCount: pdf.getPageCount(),
          });
        } catch (err) {
          toast.error(
            `${file.name} konnte nicht gelesen werden: ${(err as Error).message}`
          );
        }
      }
      if (next.length > 0) {
        setEntries((prev) => [...prev, ...next]);
        toast.success(`${next.length} PDF(s) hinzugefügt.`);
      }
    } finally {
      setBusy(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  function move(id: string, dir: -1 | 1) {
    setEntries((prev) => {
      const idx = prev.findIndex((e) => e.id === id);
      if (idx < 0) return prev;
      const newIdx = idx + dir;
      if (newIdx < 0 || newIdx >= prev.length) return prev;
      const copy = [...prev];
      [copy[idx], copy[newIdx]] = [copy[newIdx], copy[idx]];
      return copy;
    });
  }

  function remove(id: string) {
    setEntries((prev) => prev.filter((e) => e.id !== id));
  }

  async function handleMerge() {
    if (entries.length < 2) {
      toast.error("Mindestens zwei PDFs zum Zusammenfügen wählen.");
      return;
    }
    setBusy("merge");
    try {
      const out = await PDFDocument.create();
      out.setTitle(outName.replace(/\.pdf$/i, ""));
      out.setProducer("harouda-app PDF-Werkzeuge");
      out.setCreator("harouda-app");
      out.setCreationDate(new Date());
      for (const e of entries) {
        const bytes = await e.file.arrayBuffer();
        const src = await PDFDocument.load(bytes, { ignoreEncryption: true });
        const pages = await out.copyPages(src, src.getPageIndices());
        for (const p of pages) out.addPage(p);
      }
      const merged = await out.save();
      const name = outName.trim().endsWith(".pdf")
        ? outName.trim()
        : `${outName.trim() || "zusammengefuegt"}.pdf`;
      const buf = new ArrayBuffer(merged.byteLength);
      new Uint8Array(buf).set(merged);
      downloadBlob(new Blob([buf], { type: "application/pdf" }), name);
      toast.success(
        `${entries.length} PDFs zu ${name} zusammengefügt (${totalPages} Seiten).`
      );
    } catch (err) {
      toast.error(`Zusammenführen fehlgeschlagen: ${(err as Error).message}`);
    } finally {
      setBusy(null);
    }
  }

  function formatSize(n: number) {
    if (n < 1024) return `${n} B`;
    if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
    return `${(n / 1024 / 1024).toFixed(1)} MB`;
  }

  return (
    <div className="page">
      <header className="page__head">
        <h1>
          <Files size={22} /> PDF-Werkzeuge
        </h1>
        <p className="text-muted">
          Mehrere PDF-Dateien lokal im Browser zusammenfügen — ohne Upload.
          Reihenfolge per Pfeile anpassen.
        </p>
      </header>

      <section className="card">
        <div
          style={{
            display: "flex",
            gap: "0.75rem",
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="application/pdf,.pdf"
            multiple
            onChange={(e) => void addFiles(e.target.files)}
            style={{ display: "none" }}
          />
          <button
            type="button"
            className="btn btn-outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={busy !== null}
          >
            {busy === "add" ? (
              <Loader2 size={16} className="login__spinner" />
            ) : (
              <FilePlus2 size={16} />
            )}
            PDFs hinzufügen
          </button>

          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              flex: "1 1 240px",
            }}
          >
            <span className="text-muted">Dateiname:</span>
            <input
              type="text"
              value={outName}
              onChange={(e) => setOutName(e.target.value)}
              style={{ flex: 1 }}
            />
          </label>

          <button
            type="button"
            className="btn btn-primary"
            onClick={handleMerge}
            disabled={busy !== null || entries.length < 2}
            title={
              entries.length < 2
                ? "Mindestens zwei PDFs nötig"
                : "PDFs in Reihenfolge zusammenfügen"
            }
          >
            {busy === "merge" ? (
              <Loader2 size={16} className="login__spinner" />
            ) : (
              <Files size={16} />
            )}
            Zusammenfügen ({entries.length})
          </button>
        </div>

        <div style={{ marginTop: "0.75rem" }} className="text-muted">
          {entries.length === 0
            ? "Noch keine Dateien gewählt."
            : `${entries.length} Datei(en) · ${totalPages} Seiten · ${formatSize(totalBytes)}`}
        </div>
      </section>

      {entries.length > 0 && (
        <section className="card" style={{ marginTop: "1rem" }}>
          <table className="table">
            <thead>
              <tr>
                <th style={{ width: "2rem" }}>#</th>
                <th>Datei</th>
                <th style={{ textAlign: "right" }}>Seiten</th>
                <th style={{ textAlign: "right" }}>Größe</th>
                <th style={{ width: "10rem" }}>Reihenfolge</th>
                <th style={{ width: "3rem" }}></th>
              </tr>
            </thead>
            <tbody>
              {entries.map((e, i) => (
                <tr key={e.id}>
                  <td>{i + 1}</td>
                  <td>{e.file.name}</td>
                  <td style={{ textAlign: "right" }}>{e.pageCount}</td>
                  <td style={{ textAlign: "right" }}>{formatSize(e.file.size)}</td>
                  <td>
                    <button
                      type="button"
                      className="btn btn-ghost"
                      onClick={() => move(e.id, -1)}
                      disabled={i === 0 || busy !== null}
                      aria-label="Nach oben"
                    >
                      <ChevronUp size={14} />
                    </button>
                    <button
                      type="button"
                      className="btn btn-ghost"
                      onClick={() => move(e.id, 1)}
                      disabled={i === entries.length - 1 || busy !== null}
                      aria-label="Nach unten"
                    >
                      <ChevronDown size={14} />
                    </button>
                  </td>
                  <td>
                    <button
                      type="button"
                      className="btn btn-ghost"
                      onClick={() => remove(e.id)}
                      disabled={busy !== null}
                      aria-label="Entfernen"
                    >
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      <section className="card" style={{ marginTop: "1rem" }}>
        <p className="text-muted" style={{ margin: 0 }}>
          <strong>Hinweis:</strong> Dateien werden lokal im Browser verarbeitet
          und verlassen diesen Rechner nicht. Verschlüsselte PDFs werden
          entschlüsselt verarbeitet, sofern kein Passwort nötig ist — passwort-
          geschützte Dateien werden nicht unterstützt.
        </p>
      </section>
    </div>
  );
}
