import { useRef, useState, type ChangeEvent, type DragEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  AlertTriangle,
  ArrowLeft,
  FileUp,
  Info,
  Loader2,
  ScanLine,
  Sparkles,
} from "lucide-react";
import {
  runOcrForFileDetailed,
  isOcrSupported,
  type OcrPage,
} from "../utils/ocr";
import { OcrOverlay } from "../components/OcrOverlay";
import {
  extractInvoiceFields,
  type ExtractedInvoice,
  type ExtractedField,
  type FieldConfidence,
} from "../utils/invoiceFields";
import { usePermissions } from "../hooks/usePermissions";
import "./ReportView.css";
import "./TaxCalc.css";
import "./DocumentScannerPage.css";

const CONFIDENCE_COLOR: Record<FieldConfidence, string> = {
  high: "var(--success)",
  medium: "var(--gold-700)",
  low: "var(--danger)",
};

const CONFIDENCE_LABEL: Record<FieldConfidence, string> = {
  high: "hoch",
  medium: "mittel",
  low: "niedrig",
};

type Editable<T> = {
  value: T | null;
  confidence: FieldConfidence;
  reason: string;
  edited: boolean;
};

type EditableState = {
  rechnungsnummer: Editable<string>;
  rechnungsdatum: Editable<string>;
  faelligkeit: Editable<string>;
  ustIdNr: Editable<string>;
  netto: Editable<number>;
  brutto: Editable<number>;
  ustSatz: Editable<number>;
  lieferant: Editable<string>;
};

function toEditable<T>(f: ExtractedField<T>): Editable<T> {
  return { ...f, edited: false };
}

function fromExtraction(inv: ExtractedInvoice): EditableState {
  return {
    rechnungsnummer: toEditable(inv.rechnungsnummer),
    rechnungsdatum: toEditable(inv.rechnungsdatum),
    faelligkeit: toEditable(inv.faelligkeit),
    ustIdNr: toEditable(inv.ustIdNr),
    netto: toEditable(inv.netto),
    brutto: toEditable(inv.brutto),
    ustSatz: toEditable(inv.ustSatz),
    lieferant: toEditable(inv.lieferant),
  };
}

export default function DocumentScannerPage() {
  const perms = usePermissions();
  const navigate = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState<string>("");
  const [rawText, setRawText] = useState<string>("");
  const [ocrPages, setOcrPages] = useState<OcrPage[]>([]);
  const [fields, setFields] = useState<EditableState | null>(null);
  const [dragging, setDragging] = useState(false);

  async function handleFile(file: File) {
    if (!isOcrSupported(file.type)) {
      toast.error(
        "Nicht unterstütztes Format — bitte PDF oder JPG/PNG/WEBP wählen."
      );
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error(`Datei ist größer als 10 MB (${(file.size / 1024 / 1024).toFixed(1)} MB).`);
      return;
    }
    setBusy(true);
    setFields(null);
    setRawText("");
    setOcrPages([]);
    try {
      setProgress("OCR lädt (Tesseract.js + deutsche Sprachdaten ~15 MB, einmalig)…");
      const result = await runOcrForFileDetailed(file);
      setProgress("Extrahiere Felder…");
      const extracted = extractInvoiceFields(result.text);
      setRawText(result.text);
      setOcrPages(result.pages);
      setFields(fromExtraction(extracted));
      toast.success(
        `OCR abgeschlossen — ${result.pages.reduce(
          (s, p) => s + p.words.length,
          0
        )} Wörter erkannt.`
      );
    } catch (err) {
      toast.error(`OCR fehlgeschlagen: ${(err as Error).message}`);
    } finally {
      setBusy(false);
      setProgress("");
    }
  }

  function onUploadChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (file) void handleFile(file);
  }

  function onDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) void handleFile(file);
  }

  function updateField<K extends keyof EditableState>(
    key: K,
    value: EditableState[K]["value"]
  ) {
    setFields((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        [key]: { ...prev[key], value, edited: true, confidence: "high" },
      };
    });
  }

  function handleCreateBooking() {
    if (!fields) return;
    if (!perms.canWrite) {
      toast.error("Keine Schreibrechte.");
      return;
    }
    const betrag = fields.brutto.value ?? fields.netto.value;
    if (!betrag) {
      toast.error("Kein Betrag erkannt — bitte manuell eintragen.");
      return;
    }
    // Die Felder werden über localStorage an die Journal-Seite übergeben.
    const prefill = {
      datum: fields.rechnungsdatum.value ?? new Date().toISOString().slice(0, 10),
      beleg_nr: fields.rechnungsnummer.value ?? "",
      beschreibung: [fields.lieferant.value, "— OCR-Import"]
        .filter(Boolean)
        .join(" ")
        .slice(0, 140),
      betrag,
      ust_satz: fields.ustSatz.value ?? 19,
      faelligkeit: fields.faelligkeit.value,
      gegenseite: fields.lieferant.value,
    };
    try {
      localStorage.setItem("harouda:journalPrefill", JSON.stringify(prefill));
    } catch {
      /* ignore */
    }
    navigate("/journal");
    toast.info(
      "Die extrahierten Werte stehen beim nächsten 'Neue Buchung' im Journal zur Verfügung."
    );
  }

  if (!perms.canRead) {
    return (
      <div className="report">
        <header className="report__head">
          <h1>Dokument-Scanner</h1>
        </header>
        <aside className="taxcalc__hint">
          <AlertTriangle size={14} />
          <span>Kein Zugriff.</span>
        </aside>
      </div>
    );
  }

  return (
    <div className="report docscan">
      <header className="report__head">
        <Link to="/belege" className="report__back">
          <ArrowLeft size={16} />
          Zurück zu Belegen
        </Link>
        <div className="report__head-title">
          <h1>
            <ScanLine
              size={22}
              style={{ verticalAlign: "-3px", marginRight: 8 }}
            />
            Dokument-Scanner (OCR)
          </h1>
          <p>
            Lokale Texterkennung mit Tesseract.js (Deutsch + Englisch).
            Regelbasierte Extraktion deutscher Rechnungs-Felder, keine
            KI-API-Aufrufe.
          </p>
        </div>
      </header>

      <aside className="taxcalc__hint">
        <Info size={14} />
        <span>
          <strong>Ehrliche Grenzen:</strong> OCR-Qualität hängt vom Scan ab —
          schräge Fotos, niedrige Auflösung oder mehrspaltige Layouts führen zu
          Fehlern. Jedes erkannte Feld zeigt seine Konfidenz; bei „niedrig"
          bitte manuell prüfen.
        </span>
      </aside>

      <section
        className={`card docscan__drop ${dragging ? "is-dragging" : ""}`}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
      >
        <FileUp size={42} strokeWidth={1.4} />
        <p>
          Datei hierher ziehen oder{" "}
          <button
            type="button"
            className="docscan__link"
            onClick={() => fileRef.current?.click()}
            disabled={busy}
          >
            auswählen
          </button>
        </p>
        <p className="docscan__hint">PDF, JPG, PNG, WEBP · max. 10 MB</p>
        <input
          ref={fileRef}
          type="file"
          accept=".pdf,.jpg,.jpeg,.png,.webp"
          onChange={onUploadChange}
          style={{ display: "none" }}
        />
      </section>

      {busy && (
        <section className="card docscan__status">
          <Loader2 size={18} className="login__spinner" />
          <span>{progress || "Arbeite …"}</span>
        </section>
      )}

      {fields && !busy && (
        <>
          <section className="card docscan__fields">
            <h2>Erkannte Felder</h2>
            <div className="form-grid">
              <FieldRow
                label="Lieferant"
                field={fields.lieferant}
                onChange={(v) => updateField("lieferant", v)}
              />
              <FieldRow
                label="USt-IdNr."
                field={fields.ustIdNr}
                onChange={(v) => updateField("ustIdNr", v)}
              />
              <FieldRow
                label="Rechnungsnummer"
                field={fields.rechnungsnummer}
                onChange={(v) => updateField("rechnungsnummer", v)}
              />
              <FieldRow
                label="Rechnungsdatum"
                field={fields.rechnungsdatum}
                type="date"
                onChange={(v) => updateField("rechnungsdatum", v)}
              />
              <FieldRow
                label="Fälligkeitsdatum"
                field={fields.faelligkeit}
                type="date"
                onChange={(v) => updateField("faelligkeit", v)}
              />
              <FieldRow
                label="USt-Satz (%)"
                field={fields.ustSatz}
                type="number"
                onChange={(v) =>
                  updateField("ustSatz", v === "" ? null : Number(v))
                }
              />
              <FieldRow
                label="Netto (€)"
                field={fields.netto}
                type="number"
                onChange={(v) =>
                  updateField("netto", v === "" ? null : Number(v))
                }
              />
              <FieldRow
                label="Brutto (€)"
                field={fields.brutto}
                type="number"
                onChange={(v) =>
                  updateField("brutto", v === "" ? null : Number(v))
                }
              />
            </div>
          </section>

          <section className="card docscan__actions">
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleCreateBooking}
              disabled={!perms.canWrite}
            >
              <Sparkles size={16} />
              Werte ins Journal übernehmen
            </button>
          </section>

          {ocrPages.length > 0 && (
            <section>
              <OcrOverlay pages={ocrPages} />
            </section>
          )}

          <section className="card docscan__raw">
            <h2>OCR-Rohtext (Kontrolle)</h2>
            <pre>{rawText.slice(0, 5000)}</pre>
          </section>
        </>
      )}
    </div>
  );
}

function FieldRow<T extends string | number>({
  label,
  field,
  type = "text",
  onChange,
}: {
  label: string;
  field: Editable<T>;
  type?: "text" | "number" | "date";
  onChange: (value: string) => void;
}) {
  const val = field.value === null || field.value === undefined ? "" : String(field.value);
  return (
    <label className="form-field">
      <span>
        {label}
        <em
          className="docscan__conf"
          style={{ color: CONFIDENCE_COLOR[field.confidence] }}
          title={field.reason}
        >
          {field.edited ? "manuell" : CONFIDENCE_LABEL[field.confidence]}
        </em>
      </span>
      <input
        type={type}
        value={val}
        onChange={(e) => onChange(e.target.value)}
      />
      <small className="docscan__reason" title={field.reason}>
        {field.reason}
      </small>
    </label>
  );
}
