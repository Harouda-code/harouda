// CSV-Import für Journal-Buchungen — UI.
//
// Workflow:
//   1. Datei auswählen (oder Drag&Drop)
//   2. Parser läuft sofort; Fehler + Warnungen + Vorschau der ersten 10 Zeilen
//   3. Zusätzliche Konto-Existenz-Prüfung gegen den SKR03-Kontenplan
//   4. Import-Button (disabled, solange Errors vorhanden)
//   5. Jede Zeile wird über den bestehenden `createEntry` gebucht — GoBD-
//      Hash-Kette und per-Entry-Audit-Log bleiben identisch zur manuellen
//      Erfassung. Zusätzlich wird NACH dem Batch ein einzelner Audit-Eintrag
//      mit action=import und Zeilenanzahl erzeugt (Nachvollziehbarkeit).

import { useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Download,
  FileUp,
  Loader2,
  ShieldAlert,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { fetchAccounts } from "../api/accounts";
import { createEntry } from "../api/journal";
import { log as auditLog } from "../api/audit";
import { useYear } from "../contexts/YearContext";
import {
  buildSampleCsv,
  EXPECTED_HEADER,
  EXPECTED_HEADER_WITH_KOSTENSTELLE,
  parseJournalCsv,
  type ParsedRow,
  type ParseIssue,
} from "../domain/journal/csvImport";
import {
  DATEV_EXTF_IMPORTER_INFO,
  parseDatevExtf,
  type ExtfHeaderMeta,
} from "../lib/datev/DatevExtfImporter";

type ImportFormat = "csv" | "datev-extf";

type AccountError = ParseIssue;

type RunResult = {
  ok: number;
  failed: number;
  messages: string[];
  finishedAt: string;
};

export default function JournalCsvImportPage() {
  const accountsQ = useQuery({
    queryKey: ["accounts", "for-import"],
    queryFn: fetchAccounts,
  });
  const { selectedYear } = useYear();

  // Fiscal-Year-Optionen für den Parser: aktuelles + vorheriges
  // Geschäftsjahr (Annahme: Kalenderjahr = Geschäftsjahr, SKR03-Standard).
  const fiscalYearOptions = useMemo(
    () => ({
      currentFiscalYear: {
        von: `${selectedYear}-01-01`,
        bis: `${selectedYear}-12-31`,
      },
      previousFiscalYear: {
        von: `${selectedYear - 1}-01-01`,
        bis: `${selectedYear - 1}-12-31`,
      },
    }),
    [selectedYear]
  );

  const [format, setFormat] = useState<ImportFormat>("csv");
  const [fileName, setFileName] = useState<string | null>(null);
  const [rawText, setRawText] = useState<string | null>(null);
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [errors, setErrors] = useState<ParseIssue[]>([]);
  const [warnings, setWarnings] = useState<ParseIssue[]>([]);
  const [extfHeader, setExtfHeader] = useState<ExtfHeaderMeta | null>(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<RunResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const accountNrs = useMemo(() => {
    return new Set((accountsQ.data ?? []).map((a) => a.konto_nr));
  }, [accountsQ.data]);

  /** Prüft, ob alle Soll-/Haben-Konten im aktiven Kontenplan existieren. */
  const accountErrors: AccountError[] = useMemo(() => {
    if (!accountsQ.data || rows.length === 0) return [];
    const out: AccountError[] = [];
    for (const row of rows) {
      if (!accountNrs.has(row.soll_konto)) {
        out.push({
          line: row.line,
          field: "soll_konto",
          message: `Konto ${row.soll_konto} existiert nicht im Kontenplan`,
        });
      }
      if (!accountNrs.has(row.haben_konto)) {
        out.push({
          line: row.line,
          field: "haben_konto",
          message: `Konto ${row.haben_konto} existiert nicht im Kontenplan`,
        });
      }
    }
    return out;
  }, [rows, accountNrs, accountsQ.data]);

  const totalErrors = errors.length + accountErrors.length;
  const canImport =
    totalErrors === 0 && rows.length > 0 && !busy && !accountsQ.isLoading;

  async function handleFile(file: File) {
    setResult(null);
    setFileName(file.name);
    setExtfHeader(null);
    try {
      if (format === "datev-extf") {
        // DATEV EXTF 510 liegt in ISO-8859-1 vor → als Bytes lesen und
        // mit fromLatin1Bytes dekodieren (intern im Parser).
        const buffer = await file.arrayBuffer();
        const bytes = new Uint8Array(buffer);
        setRawText(null);
        const parsed = parseDatevExtf(bytes);
        setRows(parsed.rows);
        setErrors(parsed.errors);
        setWarnings(parsed.warnings);
        setExtfHeader(parsed.header);
      } else {
        const text = await file.text();
        setRawText(text);
        const parsed = parseJournalCsv(text, fiscalYearOptions);
        setRows(parsed.rows);
        setErrors(parsed.errors);
        setWarnings(parsed.warnings);
      }
    } catch (e) {
      setRawText(null);
      setRows([]);
      setErrors([{ line: 0, message: `Datei konnte nicht gelesen werden: ${(e as Error).message}` }]);
      setWarnings([]);
    }
  }

  function handleFormatChange(next: ImportFormat) {
    setFormat(next);
    // Input zurücksetzen, damit die Wahl auf den nächsten Upload wirkt
    setFileName(null);
    setRawText(null);
    setRows([]);
    setErrors([]);
    setWarnings([]);
    setExtfHeader(null);
    setResult(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleImport() {
    if (!canImport) return;
    setBusy(true);
    setResult(null);
    const messages: string[] = [];
    let ok = 0;
    let failed = 0;
    for (const row of rows) {
      try {
        // Decimal → number an der createEntry-Grenze; JournalEntry-Typ
        // verlangt JavaScript-number. Die Parser-interne Präzision ist
        // zu diesem Zeitpunkt bereits gewahrt (Decimal-Arithmetik).
        await createEntry({
          datum: row.datum,
          beleg_nr: row.beleg_nr,
          beschreibung: row.beschreibung,
          soll_konto: row.soll_konto,
          haben_konto: row.haben_konto,
          betrag: row.betrag.toNumber(),
          ust_satz: row.ust_satz || null,
          status: "gebucht",
          client_id: null,
          skonto_pct: row.skonto_pct,
          skonto_tage: row.skonto_tage,
          gegenseite: null,
          faelligkeit: null,
          kostenstelle: row.kostenstelle,
          kostentraeger: row.kostentraeger,
        });
        ok++;
      } catch (e) {
        failed++;
        messages.push(
          `Zeile ${row.line} (${row.beleg_nr}): ${(e as Error).message}`
        );
      }
    }

    // Batch-Audit-Eintrag (GoBD-Nachvollziehbarkeit).
    try {
      await auditLog({
        action: "import",
        entity: "journal_entry",
        entity_id: null,
        summary: `CSV-Import: ${ok} von ${rows.length} Buchungen importiert${failed > 0 ? `, ${failed} fehlgeschlagen` : ""} (Datei: ${fileName ?? "unbenannt"})`,
      });
    } catch (e) {
      messages.push(`Audit-Log für Batch-Import fehlgeschlagen: ${(e as Error).message}`);
    }

    const finishedAt = new Date().toISOString();
    setResult({ ok, failed, messages, finishedAt });
    setBusy(false);
    if (failed === 0) {
      toast.success(`${ok} Buchungen erfolgreich importiert`);
    } else {
      toast.warning(`Import abgeschlossen: ${ok} ok, ${failed} Fehler`);
    }
  }

  function handleDownloadSample() {
    const blob = new Blob([buildSampleCsv()], {
      type: "text/csv;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "muster-buchungen.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  function reset() {
    setFileName(null);
    setRawText(null);
    setRows([]);
    setErrors([]);
    setWarnings([]);
    setResult(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  const preview = rows.slice(0, 10);

  return (
    <div className="container" style={{ padding: "24px 16px" }}>
      <Link
        to="/journal"
        className="report__back"
        style={{ display: "inline-flex", gap: 6, alignItems: "center" }}
      >
        <ArrowLeft size={16} /> Zurück zum Journal
      </Link>
      <h1 style={{ marginTop: 12 }}>Buchungen aus CSV importieren</h1>

      <section className="card" style={{ padding: 20, marginBottom: 20 }}>
        <h2 style={{ marginTop: 0 }}>1. Format wählen</h2>
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 12 }}>
          <label style={{ display: "flex", gap: 6, alignItems: "center", cursor: "pointer" }}>
            <input
              type="radio"
              name="import-format"
              value="csv"
              checked={format === "csv"}
              onChange={() => handleFormatChange("csv")}
            />
            <span>Einfaches CSV (UTF-8, Semikolon, Komma-Dezimal)</span>
          </label>
          <label style={{ display: "flex", gap: 6, alignItems: "center", cursor: "pointer" }}>
            <input
              type="radio"
              name="import-format"
              value="datev-extf"
              checked={format === "datev-extf"}
              onChange={() => handleFormatChange("datev-extf")}
            />
            <span>DATEV EXTF 510 (ISO-8859-1 / Windows-1252)</span>
          </label>
        </div>

        {format === "csv" ? (
          <>
            <p style={{ color: "var(--muted)", fontSize: "0.9rem" }}>
              Semikolon-getrennt, UTF-8, deutsche Zahlen (1.234,56) und
              Datum (DD.MM.YYYY). Kopfzeile (Pflicht) — eine der beiden
              Varianten:
            </p>
            <pre
              style={{
                background: "#f6f6f6",
                padding: "8px 10px",
                borderRadius: 6,
                fontSize: "0.82rem",
                overflowX: "auto",
                marginBottom: 4,
              }}
            >
              {EXPECTED_HEADER.join(";")}
            </pre>
            <pre
              style={{
                background: "#f6f6f6",
                padding: "8px 10px",
                borderRadius: 6,
                fontSize: "0.82rem",
                overflowX: "auto",
              }}
            >
              {EXPECTED_HEADER_WITH_KOSTENSTELLE.join(";")}
            </pre>
            <p style={{ fontSize: "0.88rem", color: "var(--muted)" }}>
              Zulässige USt-Sätze: 0, 7, 19. Kostenstelle ist optional (8.
              Spalte leer lassen, wenn nicht benötigt). Beschreibungen über
              60 Zeichen werden als Warnung markiert (GoBD verlangt
              „aussagefähig", keine harte Grenze; 60 Zeichen ist
              DATEV-EXTF-510-Konvention). Das Buchungsdatum muss im{" "}
              <strong>aktuellen ({selectedYear})</strong> oder{" "}
              <strong>vorherigen ({selectedYear - 1})</strong>{" "}
              Geschäftsjahr liegen. Beträge werden intern als Decimal
              verarbeitet (GoBD Rz. 58) — keine Rundungsverluste beim Parsen.
            </p>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={handleDownloadSample}
            >
              <Download size={16} /> Muster-CSV herunterladen
            </button>
          </>
        ) : (
          <>
            <p style={{ color: "var(--muted)", fontSize: "0.9rem" }}>
              DATEV Buchungsstapel (EXTF-Format, Version{" "}
              {DATEV_EXTF_IMPORTER_INFO.supportedVersion}, Kategorie{" "}
              {DATEV_EXTF_IMPORTER_INFO.supportedCategory}).
              Kodierung: {DATEV_EXTF_IMPORTER_INFO.encoding}. Trennzeichen:{" "}
              {DATEV_EXTF_IMPORTER_INFO.separator}. Beträge in Cent bzw.
              mit Dezimalkomma (z. B. <code>1234,56</code>), Datum TTMM in
              der Buchungszeile + Wirtschaftsjahr aus dem Header-Block.
            </p>
            <p style={{ fontSize: "0.88rem", color: "var(--muted)" }}>
              Der Parser akzeptiert nur Dateien, deren Header-Feld 1 den
              Wert <code>EXTF</code> trägt. Abweichende Format-Versionen
              (≠ 510) werden als Warnung gemeldet, aber weiterverarbeitet.
              Mandanten-Nummer im Header wird gegen die aktive Firma
              verglichen (Warnung bei Mismatch, keine Sperre). Konto und
              Gegenkonto werden anhand des Soll-/Haben-Kennzeichens korrekt
              in die App-Darstellung übernommen.
            </p>
          </>
        )}
      </section>

      {format === "datev-extf" && extfHeader && (
        <section className="card" style={{ padding: 20, marginBottom: 20 }}>
          <h2 style={{ marginTop: 0 }}>EXTF-Header</h2>
          <table className="report__table" style={{ width: "100%", fontSize: "0.85rem" }}>
            <tbody>
              <tr><td>Format</td><td>{extfHeader.format}</td></tr>
              <tr><td>Version</td><td>{extfHeader.version}</td></tr>
              <tr><td>Kategorie</td><td>{extfHeader.category}</td></tr>
              <tr><td>Berater-Nr.</td><td>{extfHeader.beraterNr}</td></tr>
              <tr><td>Mandant-Nr.</td><td>{extfHeader.mandantNr}</td></tr>
              <tr><td>WJ-Beginn</td><td>{extfHeader.wirtschaftsjahrBeginn}</td></tr>
              <tr><td>Zeitraum</td><td>{extfHeader.zeitraum.von} – {extfHeader.zeitraum.bis}</td></tr>
              <tr><td>Bezeichnung</td><td>{extfHeader.bezeichnung}</td></tr>
            </tbody>
          </table>
        </section>
      )}

      <section className="card" style={{ padding: 20, marginBottom: 20 }}>
        <h2 style={{ marginTop: 0 }}>2. Datei auswählen</h2>
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,text/csv"
          data-testid="csv-file-input"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void handleFile(f);
          }}
        />
        {fileName && (
          <p style={{ marginTop: 8, fontSize: "0.88rem" }}>
            Geladen: <code>{fileName}</code> · {rawText?.length ?? 0} Zeichen ·
            {rows.length} gültige Datenzeilen · {errors.length + accountErrors.length} Fehler ·
            {warnings.length} Warnungen
            <button
              type="button"
              className="btn btn-ghost"
              style={{ marginLeft: 12 }}
              onClick={reset}
            >
              Zurücksetzen
            </button>
          </p>
        )}
      </section>

      {(errors.length > 0 || accountErrors.length > 0) && (
        <section
          className="card"
          style={{ padding: 20, marginBottom: 20, borderLeft: "4px solid #a62020" }}
        >
          <h2 style={{ marginTop: 0, color: "#a62020" }}>
            <XCircle size={18} style={{ verticalAlign: "-3px" }} /> Fehler ({errors.length + accountErrors.length})
          </h2>
          <ul style={{ fontSize: "0.88rem", maxHeight: 240, overflow: "auto" }}>
            {errors.map((e, i) => (
              <li key={`e-${i}`}>
                Zeile {e.line}
                {e.field ? ` · Feld ${e.field}` : ""}: {e.message}
              </li>
            ))}
            {accountErrors.map((e, i) => (
              <li key={`a-${i}`}>
                Zeile {e.line} · Feld {e.field}: {e.message}
              </li>
            ))}
          </ul>
        </section>
      )}

      {warnings.length > 0 && (
        <section
          className="card"
          style={{ padding: 20, marginBottom: 20, borderLeft: "4px solid #c49a05" }}
        >
          <h2 style={{ marginTop: 0, color: "#7a5c05" }}>
            <AlertTriangle size={18} style={{ verticalAlign: "-3px" }} /> Warnungen ({warnings.length})
          </h2>
          <ul style={{ fontSize: "0.88rem", maxHeight: 160, overflow: "auto" }}>
            {warnings.map((w, i) => (
              <li key={`w-${i}`}>
                Zeile {w.line}
                {w.field ? ` · Feld ${w.field}` : ""}: {w.message}
              </li>
            ))}
          </ul>
          <p style={{ fontSize: "0.82rem", color: "var(--muted)" }}>
            Warnungen blockieren den Import nicht.
          </p>
        </section>
      )}

      {rows.length > 0 && (
        <section className="card" style={{ padding: 20, marginBottom: 20 }}>
          <h2 style={{ marginTop: 0 }}>3. Vorschau (erste {preview.length} von {rows.length})</h2>
          <div style={{ overflowX: "auto" }}>
            <table className="report__table" style={{ width: "100%", fontSize: "0.85rem" }}>
              <thead>
                <tr>
                  <th>Zeile</th>
                  <th>Datum</th>
                  <th>Beleg-Nr.</th>
                  <th>Soll</th>
                  <th>Haben</th>
                  <th style={{ textAlign: "right" }}>Betrag</th>
                  <th>USt%</th>
                  <th>Beschreibung</th>
                  <th>KST</th>
                  <th>KTR</th>
                </tr>
              </thead>
              <tbody>
                {preview.map((r) => (
                  <tr key={r.line}>
                    <td>{r.line}</td>
                    <td>{r.datum}</td>
                    <td>{r.beleg_nr}</td>
                    <td>{r.soll_konto}</td>
                    <td>{r.haben_konto}</td>
                    <td style={{ textAlign: "right" }}>
                      {r.betrag.toFixed(2).replace(".", ",")}
                    </td>
                    <td>{r.ust_satz}</td>
                    <td>{r.beschreibung}</td>
                    <td>
                      {r.kostenstelle ?? <span style={{ color: "var(--muted)" }}>–</span>}
                    </td>
                    <td>
                      {r.kostentraeger ?? <span style={{ color: "var(--muted)" }}>–</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <section className="card" style={{ padding: 20, marginBottom: 20 }}>
        <h2 style={{ marginTop: 0 }}>4. Import ausführen</h2>
        <p style={{ color: "var(--muted)", fontSize: "0.88rem" }}>
          <ShieldAlert size={16} style={{ verticalAlign: "-2px" }} /> Jede
          Buchung läuft durch den bestehenden FestschreibungsService, inklusive
          Hash-Ketten-Fortschreibung und Einzel-Audit-Log. Zusätzlich wird
          ein Batch-Eintrag (<code>action=import</code>) mit der
          Zeilenanzahl erzeugt.
        </p>
        <button
          type="button"
          className="btn btn-primary"
          onClick={handleImport}
          disabled={!canImport}
          data-testid="csv-import-run"
        >
          {busy ? (
            <Loader2 size={16} className="spin" />
          ) : (
            <FileUp size={16} />
          )}
          {busy ? `Importiere …` : `Import starten (${rows.length} Zeilen)`}
        </button>
      </section>

      {result && (
        <section
          className="card"
          style={{
            padding: 20,
            borderLeft: `4px solid ${result.failed === 0 ? "#1f8434" : "#c49a05"}`,
          }}
        >
          <h2 style={{ marginTop: 0 }}>
            {result.failed === 0 ? (
              <CheckCircle2 size={18} style={{ verticalAlign: "-3px", color: "#1f8434" }} />
            ) : (
              <AlertTriangle size={18} style={{ verticalAlign: "-3px", color: "#c49a05" }} />
            )}{" "}
            Import abgeschlossen
          </h2>
          <p>
            <strong>{result.ok}</strong> von <strong>{rows.length}</strong>{" "}
            Buchungen erfolgreich importiert
            {result.failed > 0 && (
              <> · <strong>{result.failed}</strong> fehlgeschlagen</>
            )}
          </p>
          {result.messages.length > 0 && (
            <ul style={{ color: "#a62020", fontSize: "0.88rem" }}>
              {result.messages.map((m, i) => <li key={i}>{m}</li>)}
            </ul>
          )}
          <p>
            <Link to="/journal">Zurück zum Journal →</Link>
          </p>
        </section>
      )}
    </div>
  );
}
