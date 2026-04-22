import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Download,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { fetchAccounts } from "../api/accounts";
import { fetchAllEntries } from "../api/dashboard";
import { useSettings } from "../contexts/SettingsContext";
import { useYear } from "../contexts/YearContext";
import {
  exportBuchungsstapel,
  validateBuchungsstapel,
  datevFilename,
} from "../lib/datev/DatevExporter";
import { toLatin1Bytes } from "../lib/datev/datevFormat";
import { Money } from "../lib/money/Money";
import "./ReportView.css";

function fmt(s: string): string {
  return new Money(s).toEuroFormat();
}

function downloadLatin1(filename: string, csv: string) {
  const bytes = toLatin1Bytes(csv);
  // TS lib-dom marks Uint8Array<ArrayBufferLike> as non-BlobPart in strict mode
  // due to SharedArrayBuffer ambiguity. Our buffer is a real ArrayBuffer.
  const blob = new Blob([bytes as unknown as BlobPart], {
    type: "text/csv;charset=ISO-8859-1",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function DatevExportPage() {
  const { selectedYear } = useYear();
  const { settings } = useSettings();
  const [mandantNr, setMandantNr] = useState<number>(10000);
  const [beraterNr, setBeraterNr] = useState<number>(99999);
  const [von, setVon] = useState(`${selectedYear}-01-01`);
  const [bis, setBis] = useState(`${selectedYear}-12-31`);
  const [kontoFilter, setKontoFilter] = useState<string>("");

  const entriesQ = useQuery({
    queryKey: ["journal_entries", "all"],
    queryFn: fetchAllEntries,
  });
  const accountsQ = useQuery({
    queryKey: ["accounts", "all-with-inactive"],
    queryFn: fetchAccounts,
  });

  const options = useMemo(() => {
    if (!entriesQ.data || !accountsQ.data) return null;
    const kontoList = kontoFilter
      .split(/[\s,;]+/)
      .map((s) => s.trim())
      .filter(Boolean);
    return {
      mandantNr,
      beraterNr,
      kanzleiName: settings.kanzleiName,
      wirtschaftsjahr: selectedYear,
      zeitraum: { von, bis },
      entries: entriesQ.data,
      accounts: accountsQ.data,
      kontoFilter: kontoList.length > 0 ? kontoList : undefined,
    };
  }, [
    entriesQ.data,
    accountsQ.data,
    mandantNr,
    beraterNr,
    settings.kanzleiName,
    selectedYear,
    von,
    bis,
    kontoFilter,
  ]);

  const validation = useMemo(
    () => (options ? validateBuchungsstapel(options) : null),
    [options]
  );

  const previewCsv = useMemo(() => {
    if (!options) return null;
    const full = exportBuchungsstapel(options);
    const lines = full.split("\r\n");
    return lines.slice(0, 12).join("\r\n");
  }, [options]);

  const isLoading = entriesQ.isLoading || accountsQ.isLoading;

  function handleDownload() {
    if (!options) return;
    const csv = exportBuchungsstapel(options);
    const filename = datevFilename(options);
    downloadLatin1(filename, csv);
    toast.success(`DATEV-Stapel exportiert: ${filename}`);
  }

  return (
    <div className="report">
      <header className="report__head no-print">
        <Link to="/berichte" className="report__back">
          <ArrowLeft size={16} /> Zurück
        </Link>
        <div className="report__head-title">
          <h1>DATEV Buchungsstapel-Export (EXTF 510)</h1>
          <p>
            Erstellt einen DATEV-kompatiblen CSV-Stapel zur Übernahme in
            DATEV Unternehmen online oder Kanzlei-Rechnungswesen. Format:
            EXTF 510 / Kategorie 21 (Buchungsstapel), ISO-8859-1,
            Komma-Dezimal, Semikolon-Separator.
          </p>
        </div>
      </header>

      <section className="card" style={{ padding: 16, marginBottom: 16 }}>
        <h3 style={{ margin: "0 0 10px", fontSize: "0.95rem" }}>
          Export-Konfiguration
        </h3>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            gap: 12,
          }}
        >
          <label>
            <span>Mandant-Nr.</span>
            <input
              type="number"
              value={mandantNr}
              onChange={(e) => setMandantNr(Number(e.target.value))}
            />
          </label>
          <label>
            <span>Berater-Nr.</span>
            <input
              type="number"
              value={beraterNr}
              onChange={(e) => setBeraterNr(Number(e.target.value))}
            />
          </label>
          <label>
            <span>Zeitraum von</span>
            <input
              type="date"
              value={von}
              onChange={(e) => setVon(e.target.value)}
            />
          </label>
          <label>
            <span>bis</span>
            <input
              type="date"
              value={bis}
              onChange={(e) => setBis(e.target.value)}
            />
          </label>
          <label style={{ gridColumn: "1 / -1" }}>
            <span>
              Konto-Filter (optional, komma-separiert) — z. B.{" "}
              <code>1200, 8400</code>
            </span>
            <input
              type="text"
              value={kontoFilter}
              onChange={(e) => setKontoFilter(e.target.value)}
              placeholder="alle Konten exportieren"
            />
          </label>
        </div>
      </section>

      <aside
        className="ustva__disclaimer no-print"
        style={{
          marginBottom: 12,
          display: "flex",
          gap: 8,
          alignItems: "flex-start",
          background: "rgba(210,120,70,0.08)",
          border: "1px solid rgba(210,120,70,0.3)",
          borderLeft: "4px solid #c76b3f",
          padding: "10px 14px",
          borderRadius: "var(--radius)",
          fontSize: "0.88rem",
        }}
      >
        <AlertTriangle size={16} color="#c76b3f" style={{ flexShrink: 0, marginTop: 2 }} />
        <div>
          <strong>Nachgebildetes DATEV-Format.</strong> Die erzeugte Datei wird
          ISO-8859-1 kodiert und folgt der EXTF-510-Spezifikation (Kategorie 21
          Buchungsstapel). Vor produktivem Import bitte Kompatibilität im
          Zielsystem prüfen — insbesondere Berater-/Mandantennummern,
          Sachkontenlänge und Wirtschaftsjahr-Einstellung.
        </div>
      </aside>

      {isLoading || !validation ? (
        <div className="journal__state">
          <Loader2 className="journal__state-spin" size={28} /> Lade Daten …
        </div>
      ) : (
        <>
          <section
            className="card"
            style={{
              padding: 14,
              marginBottom: 12,
              borderLeft: `4px solid ${validation.balanced ? "#1f7a4d" : "#8a2c2c"}`,
              background: validation.balanced ? "#eaf5ef" : "#fcefea",
            }}
          >
            <h3
              style={{
                margin: "0 0 8px",
                fontSize: "0.95rem",
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              {validation.balanced ? (
                <CheckCircle2 size={18} color="#1f7a4d" />
              ) : (
                <AlertTriangle size={18} color="#8a2c2c" />
              )}
              Validierung
            </h3>
            <table style={{ fontSize: "0.88rem" }}>
              <tbody>
                <tr>
                  <td style={{ padding: "2px 16px 2px 0" }}>Buchungen gesamt</td>
                  <td style={{ fontFamily: "var(--font-mono)", fontWeight: 700 }}>
                    {validation.entryCount}
                  </td>
                </tr>
                <tr>
                  <td style={{ padding: "2px 16px 2px 0" }}>
                    Summe Beträge (Soll = Haben je Buchung)
                  </td>
                  <td style={{ fontFamily: "var(--font-mono)" }}>
                    {fmt(validation.totalSoll)}
                  </td>
                </tr>
                <tr>
                  <td style={{ padding: "2px 16px 2px 0" }}>Außerhalb Zeitraum</td>
                  <td
                    style={{
                      fontFamily: "var(--font-mono)",
                      color: validation.outOfRange > 0 ? "#c76b3f" : undefined,
                    }}
                  >
                    {validation.outOfRange}
                  </td>
                </tr>
                <tr>
                  <td style={{ padding: "2px 16px 2px 0" }}>Unbekannte Konten</td>
                  <td
                    style={{
                      fontFamily: "var(--font-mono)",
                      color: validation.unknownKonten > 0 ? "#8a2c2c" : undefined,
                    }}
                  >
                    {validation.unknownKonten}
                  </td>
                </tr>
                <tr>
                  <td style={{ padding: "2px 16px 2px 0" }}>Doppelte Belegnummern</td>
                  <td
                    style={{
                      fontFamily: "var(--font-mono)",
                      color: validation.duplicateBelege > 0 ? "#c76b3f" : undefined,
                    }}
                  >
                    {validation.duplicateBelege}
                  </td>
                </tr>
              </tbody>
            </table>
            {validation.warnings.length > 0 && (
              <ul style={{ margin: "8px 0 0 20px", fontSize: "0.85rem", color: "#8a2c2c" }}>
                {validation.warnings.map((w, i) => (
                  <li key={i}>{w}</li>
                ))}
              </ul>
            )}
          </section>

          <section className="card" style={{ padding: 14, marginBottom: 12 }}>
            <h3 style={{ margin: "0 0 8px", fontSize: "0.95rem" }}>
              Vorschau (erste 12 Zeilen)
            </h3>
            <pre
              style={{
                padding: 10,
                background: "#f5f5f7",
                fontSize: "0.72rem",
                fontFamily: "var(--font-mono)",
                whiteSpace: "pre",
                overflow: "auto",
                margin: 0,
                maxHeight: 320,
              }}
            >
              {previewCsv}
            </pre>
          </section>

          <button
            type="button"
            className="btn btn-primary"
            onClick={handleDownload}
            style={{ marginTop: 12 }}
          >
            <Download size={16} /> DATEV-CSV herunterladen (ISO-8859-1)
          </button>
        </>
      )}
    </div>
  );
}
