import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Download,
  FileText,
  Loader2,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";
import { fetchAccounts } from "../api/accounts";
import { fetchAllEntries } from "../api/dashboard";
import { useYear } from "../contexts/YearContext";
import { useSettings } from "../contexts/SettingsContext";
import {
  exportZ3Package,
  type Z3ExportResult,
} from "../domain/gdpdu/Gdpdu3Exporter";
import { createZipFromFiles, downloadZip } from "../lib/zip/zipBundler";
import "./ReportView.css";

function downloadBytes(filename: string, bytes: Uint8Array, mime: string) {
  const blob = new Blob([bytes as unknown as BlobPart], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function Z3ExportPage() {
  const { selectedYear } = useYear();
  const { settings } = useSettings();
  const [von, setVon] = useState(`${selectedYear}-01-01`);
  const [bis, setBis] = useState(`${selectedYear}-12-31`);
  const [name, setName] = useState(settings.kanzleiName || "Musterfirma GmbH");
  const [steuernr, setSteuernr] = useState("123/456/78901");
  const [adresse, setAdresse] = useState("Teststr. 1, 12345 Berlin");
  const [includeStammdaten, setIncludeStammdaten] = useState(true);
  const [includeLohn, setIncludeLohn] = useState(false);

  const [result, setResult] = useState<Z3ExportResult | null>(null);
  const [busy, setBusy] = useState(false);

  const entriesQ = useQuery({
    queryKey: ["journal_entries", "all"],
    queryFn: fetchAllEntries,
  });
  const accountsQ = useQuery({
    queryKey: ["accounts", "all-with-inactive"],
    queryFn: fetchAccounts,
  });

  const isLoading = entriesQ.isLoading || accountsQ.isLoading;

  const options = useMemo(() => {
    if (!entriesQ.data || !accountsQ.data) return null;
    return {
      unternehmen: { name, steuernummer: steuernr, adresse },
      zeitraum: { von, bis },
      konten: accountsQ.data,
      buchungen: entriesQ.data,
      includeLohn,
      includeStammdaten,
    };
  }, [
    entriesQ.data,
    accountsQ.data,
    name,
    steuernr,
    adresse,
    von,
    bis,
    includeLohn,
    includeStammdaten,
  ]);

  useEffect(() => {
    if (!options) {
      setResult(null);
      return;
    }
    let cancelled = false;
    (async () => {
      setBusy(true);
      try {
        const r = await exportZ3Package(options);
        if (!cancelled) setResult(r);
      } catch (e) {
        toast.error((e as Error).message);
      } finally {
        if (!cancelled) setBusy(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [options]);

  function handleDownloadAll() {
    if (!result) return;
    for (const [name, bytes] of result.files) {
      const mime = name.endsWith(".XML")
        ? "application/xml;charset=ISO-8859-15"
        : "text/csv;charset=ISO-8859-15";
      downloadBytes(name, bytes, mime);
    }
    toast.success(`${result.files.size} Dateien exportiert.`);
  }

  async function handleDownloadZip() {
    if (!result) return;
    try {
      const blob = await createZipFromFiles(result.files);
      const zeitraumTag = `${von.replace(/-/g, "")}_${bis.replace(/-/g, "")}`;
      const sanitized = name.replace(/[^A-Za-z0-9_-]/g, "_").slice(0, 30);
      const filename = `Z3_Export_${sanitized}_${zeitraumTag}.zip`;
      downloadZip(blob, filename);
      toast.success(`ZIP-Paket exportiert (${Math.round(blob.size / 1024)} KB).`);
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  function handleDownloadFile(filename: string, bytes: Uint8Array) {
    const mime = filename.endsWith(".XML")
      ? "application/xml;charset=ISO-8859-15"
      : "text/csv;charset=ISO-8859-15";
    downloadBytes(filename, bytes, mime);
  }

  return (
    <div className="report">
      <header className="report__head no-print">
        <Link to="/" className="report__back">
          <ArrowLeft size={16} /> Zurück
        </Link>
        <div className="report__head-title">
          <h1>Z3-Datenexport (§ 147 Abs. 6 AO / GDPdU)</h1>
          <p>
            Datenträgerüberlassung für Betriebsprüfung · BMF-Beschreibungs-
            standard · ISO-8859-15 · SHA-256-Manifest zur Integritätssicherung.
          </p>
        </div>
      </header>

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
          <strong>Nachgebildetes Z3-Format.</strong> CSV + INDEX.XML +
          MANIFEST.XML nach BMF-Beschreibungsstandard. Dateien werden einzeln
          geladen (ZIP-Bundle ist eine Folgeiteration). Der Prüfer überprüft
          die Integrität über die SHA-256-Hashes im Manifest.
        </div>
      </aside>

      <section className="card" style={{ padding: 16, marginBottom: 12 }}>
        <h3 style={{ margin: "0 0 10px", fontSize: "0.95rem" }}>Konfiguration</h3>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: 10,
          }}
        >
          <label>
            <span>Firmenname *</span>
            <input value={name} onChange={(e) => setName(e.target.value)} />
          </label>
          <label>
            <span>Steuernummer</span>
            <input value={steuernr} onChange={(e) => setSteuernr(e.target.value)} />
          </label>
          <label style={{ gridColumn: "1 / -1" }}>
            <span>Adresse</span>
            <input value={adresse} onChange={(e) => setAdresse(e.target.value)} />
          </label>
          <label>
            <span>Prüfzeitraum von</span>
            <input type="date" value={von} onChange={(e) => setVon(e.target.value)} />
          </label>
          <label>
            <span>bis</span>
            <input type="date" value={bis} onChange={(e) => setBis(e.target.value)} />
          </label>
          <label style={{ display: "flex", gap: 6, alignItems: "center" }}>
            <input
              type="checkbox"
              checked={includeStammdaten}
              onChange={(e) => setIncludeStammdaten(e.target.checked)}
            />
            Stammdaten inkludieren
          </label>
          <label style={{ display: "flex", gap: 6, alignItems: "center" }}>
            <input
              type="checkbox"
              checked={includeLohn}
              onChange={(e) => setIncludeLohn(e.target.checked)}
            />
            Lohnbuchungen (Placeholder)
          </label>
        </div>
      </section>

      {isLoading || busy ? (
        <div className="journal__state">
          <Loader2 className="journal__state-spin" size={28} /> Erzeuge Z3-Paket …
        </div>
      ) : !result ? null : (
        <>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
              gap: 12,
              marginBottom: 16,
            }}
          >
            <StatCard label="Dateien" value={String(result.files.size)} />
            <StatCard
              label="Gesamt-Größe"
              value={`${Math.round(result.totalSize / 1024)} KB`}
            />
            <StatCard
              label="Zeilen Buchungen"
              value={String(
                result.manifest.files.find((f) => f.name === "BUCHUNGEN.CSV")
                  ?.rowCount ?? 0
              )}
            />
            <StatCard
              label="Integritäts-Hashes"
              value={`${result.manifest.files.length} × SHA-256`}
            />
          </div>

          <section className="card" style={{ padding: 14, marginBottom: 12 }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 8,
              }}
            >
              <h3 style={{ margin: 0, fontSize: "0.95rem" }}>
                Dateien im Z3-Paket
              </h3>
              <div style={{ display: "flex", gap: 8 }}>
                <button className="btn btn-primary" onClick={handleDownloadZip}>
                  <Download size={14} /> Als ZIP herunterladen
                </button>
                <button className="btn btn-outline" onClick={handleDownloadAll}>
                  Einzeldateien
                </button>
              </div>
            </div>
            <table style={{ width: "100%", fontSize: "0.85rem" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid #c3c8d1" }}>
                  <th style={{ textAlign: "left", padding: "4px 0" }}>Datei</th>
                  <th style={{ textAlign: "right" }}>Größe</th>
                  <th style={{ textAlign: "right" }}>Zeilen</th>
                  <th style={{ textAlign: "left", paddingLeft: 10 }}>SHA-256</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {result.manifest.files.map((f) => (
                  <tr key={f.name} style={{ borderBottom: "1px solid #eef1f6" }}>
                    <td style={{ padding: "4px 0" }}>
                      <FileText size={12} /> {f.name}
                    </td>
                    <td
                      style={{
                        textAlign: "right",
                        fontFamily: "var(--font-mono)",
                      }}
                    >
                      {f.sizeBytes} B
                    </td>
                    <td
                      style={{
                        textAlign: "right",
                        fontFamily: "var(--font-mono)",
                      }}
                    >
                      {f.rowCount ?? "—"}
                    </td>
                    <td
                      style={{
                        paddingLeft: 10,
                        fontFamily: "var(--font-mono)",
                        fontSize: "0.72rem",
                        color: "var(--ink-soft)",
                      }}
                      title={f.sha256}
                    >
                      <ShieldCheck size={10} color="#1f7a4d" /> {f.sha256.slice(0, 16)}…
                    </td>
                    <td>
                      <button
                        className="btn btn-outline btn-sm"
                        onClick={() =>
                          handleDownloadFile(f.name, result.files.get(f.name)!)
                        }
                      >
                        <Download size={12} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          <section
            className="card"
            style={{
              padding: 12,
              borderLeft: "4px solid #1f7a4d",
              background: "#eaf5ef",
            }}
          >
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <CheckCircle2 size={18} color="#1f7a4d" />
              <div>
                <strong>Paket bereit zur Übergabe.</strong> Erstellt am{" "}
                {result.manifest.createdAt.slice(0, 19).replace("T", " ")} ·
                Encoding {result.manifest.encoding} · Dezimal {"'"}
                {result.manifest.decimalSymbol}
                {"'"} · Separator {"'"}
                {result.manifest.separator}
                {"'"}
              </div>
            </div>
          </section>
        </>
      )}
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="card" style={{ padding: 12 }}>
      <div style={{ fontSize: "0.78rem", color: "var(--ink-soft)" }}>{label}</div>
      <div
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: "1rem",
          fontWeight: 700,
        }}
      >
        {value}
      </div>
    </div>
  );
}
