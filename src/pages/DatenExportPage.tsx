// Mandanten-Datenexport (DSGVO Art. 20 / Art. 15 Abs. 3).
//
// NICHT ein Backup. Siehe docs/BACKUP-STRATEGY.md. Die Seite trägt die
// Ehrlichkeit im Namen, im Banner und im Manifest der erzeugten ZIP.

import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Download,
  FileSearch,
  Loader2,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { fetchAccounts } from "../api/accounts";
import { fetchAllEntries } from "../api/dashboard";
import { fetchClients } from "../api/clients";
import { fetchDocuments } from "../api/documents";
import { fetchAuditLog } from "../api/audit";
import { useMandant } from "../contexts/MandantContext";
import { useUser } from "../contexts/UserContext";
import {
  exportMandantenDaten,
  verifyExportZip,
  type DataSource,
  type DatenExportResult,
  type ExportPurpose,
  type VerifyResult,
} from "../domain/export/MandantenDatenExportService";
import { downloadZip } from "../lib/zip/zipBundler";

const PURPOSES: Array<{ value: ExportPurpose; label: string; hint: string }> = [
  {
    value: "DSGVO_ART_20_PORTABILITY",
    label: "DSGVO Art. 20 — Datenübertragbarkeit",
    hint: "Export zur Übertragung an einen anderen Anbieter. Maschinenlesbar.",
  },
  {
    value: "DSGVO_ART_15_COPY",
    label: "DSGVO Art. 15 Abs. 3 — Kopie der verarbeiteten Daten",
    hint: "Auskunft an die betroffene Person in strukturierter Form.",
  },
  {
    value: "USER_ARCHIVE",
    label: "Eigene Archivierung",
    hint: "Kein rechtlicher Zweck. Lokale Kopie für eigene Zwecke.",
  },
];

export default function DatenExportPage() {
  const { selectedMandantId } = useMandant();
  const { session } = useUser();
  const mandantId = selectedMandantId ?? "all-mandanten";
  const userId = session?.user?.email ?? "unknown";

  const [purpose, setPurpose] = useState<ExportPurpose>("DSGVO_ART_20_PORTABILITY");
  const [includeAudit, setIncludeAudit] = useState(true);
  const [result, setResult] = useState<DatenExportResult | null>(null);
  const [busy, setBusy] = useState(false);

  const [verifying, setVerifying] = useState(false);
  const [verifyResult, setVerifyResult] = useState<VerifyResult | null>(null);

  // Datenquellen laden — alle über bestehende dual-mode Repositories.
  // Jede Quelle liefert nur das, was RLS dem aufrufenden User erlaubt.
  const konten = useQuery({ queryKey: ["accounts", "all-with-inactive"], queryFn: fetchAccounts });
  const buchungen = useQuery({
    queryKey: ["journal_entries", "all", selectedMandantId],
    queryFn: fetchAllEntries,
  });
  const mandanten = useQuery({ queryKey: ["clients", "all"], queryFn: fetchClients });
  // DSGVO-Export läuft über den gewählten Mandanten (oder Kanzlei-weit mit null).
  const belege = useQuery({
    queryKey: ["documents", "all", selectedMandantId],
    queryFn: () => fetchDocuments(selectedMandantId),
  });
  const audit = useQuery({ queryKey: ["audit_log", "all"], queryFn: fetchAuditLog });

  const loading =
    konten.isLoading ||
    buchungen.isLoading ||
    mandanten.isLoading ||
    belege.isLoading ||
    audit.isLoading;

  const counts = useMemo(
    () => ({
      konten: konten.data?.length ?? 0,
      buchungen: buchungen.data?.length ?? 0,
      mandanten: mandanten.data?.length ?? 0,
      belege: belege.data?.length ?? 0,
      audit_log: audit.data?.length ?? 0,
    }),
    [konten.data, buchungen.data, mandanten.data, belege.data, audit.data]
  );

  async function handleExport() {
    if (loading) return;
    setBusy(true);
    setResult(null);
    try {
      const sources: DataSource[] = [
        { tableName: "mandanten", rows: mandanten.data ?? [] },
        { tableName: "konten", rows: konten.data ?? [] },
        { tableName: "buchungen", rows: buchungen.data ?? [] },
        { tableName: "belege", rows: belege.data ?? [] },
        { tableName: "audit_log", rows: audit.data ?? [] },
      ];
      const res = await exportMandantenDaten({
        mandantId,
        userId,
        purpose,
        sources,
        includeAuditLog: includeAudit,
      });
      setResult(res);
      const stamp = res.manifest.createdAt.replace(/[:.]/g, "-").slice(0, 19);
      downloadZip(res.zip, `harouda-datenexport-${stamp}.zip`);
      if (res.warnings.length > 0) {
        toast.warning(res.warnings[0]);
      } else {
        toast.success("Export erstellt und heruntergeladen.");
      }
    } catch (err) {
      toast.error(`Export fehlgeschlagen: ${(err as Error).message}`);
    } finally {
      setBusy(false);
    }
  }

  async function handleVerify(file: File) {
    setVerifying(true);
    setVerifyResult(null);
    try {
      const result = await verifyExportZip(file);
      setVerifyResult(result);
    } catch (err) {
      setVerifyResult({
        manifestValid: false,
        tablesValid: false,
        errors: [(err as Error).message],
        warnings: [],
      });
    } finally {
      setVerifying(false);
    }
  }

  return (
    <div className="container" style={{ padding: "24px 16px" }}>
      <Link to="/einstellungen" className="report__back" style={{ display: "inline-flex", gap: 6, alignItems: "center" }}>
        <ArrowLeft size={16} /> Zurück zu Einstellungen
      </Link>

      <h1 style={{ marginTop: 12 }}>Mandanten-Datenexport (DSGVO Art. 20)</h1>

      {/* Nicht-dismissierbares Warnbanner. */}
      <div
        role="alert"
        style={{
          borderLeft: "4px solid #c49a05",
          background: "#fff7e0",
          color: "#5b4200",
          padding: "14px 16px",
          borderRadius: 8,
          margin: "16px 0 24px",
          display: "flex",
          gap: 10,
          alignItems: "flex-start",
        }}
      >
        <AlertTriangle size={22} style={{ flexShrink: 0, marginTop: 2 }} aria-hidden="true" />
        <div>
          <strong style={{ display: "block", marginBottom: 4 }}>
            Dies ist KEIN Datensicherungs-Backup.
          </strong>
          Der Export dient der Datenübertragbarkeit nach DSGVO Art. 20 und
          stellt einen Moment-Stand Ihrer Daten dar. Für echtes Disaster
          Recovery kontaktieren Sie bitte Ihre:n Supabase-Administrator:in
          (PITR / pg_dump). Details: <code>docs/BACKUP-STRATEGY.md</code>.
        </div>
      </div>

      <section className="card" style={{ padding: 20, marginBottom: 20 }}>
        <h2 style={{ marginTop: 0 }}>Zweck</h2>
        <div style={{ display: "grid", gap: 8 }}>
          {PURPOSES.map((p) => (
            <label key={p.value} style={{ display: "flex", gap: 10, alignItems: "flex-start", cursor: "pointer" }}>
              <input
                type="radio"
                name="purpose"
                value={p.value}
                checked={purpose === p.value}
                onChange={() => setPurpose(p.value)}
                style={{ marginTop: 4 }}
              />
              <span>
                <strong>{p.label}</strong>
                <br />
                <small style={{ color: "var(--muted)" }}>{p.hint}</small>
              </span>
            </label>
          ))}
        </div>

        <h2>Umfang</h2>
        <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <input
            type="checkbox"
            checked={includeAudit}
            onChange={(e) => setIncludeAudit(e.target.checked)}
          />
          Audit-Log einschließen (empfohlen für volle Transparenz)
        </label>

        <div style={{ marginTop: 16, color: "var(--muted)", fontSize: "0.88rem" }}>
          Enthaltene Tabellen (jeweils nur so viel, wie Ihre Rolle sieht):
          <ul style={{ margin: "6px 0 0 0", paddingLeft: 20 }}>
            <li>mandanten ({counts.mandanten})</li>
            <li>konten ({counts.konten})</li>
            <li>buchungen ({counts.buchungen})</li>
            <li>belege ({counts.belege})</li>
            {includeAudit && <li>audit_log ({counts.audit_log})</li>}
          </ul>
        </div>

        <div style={{ marginTop: 16 }}>
          <button
            type="button"
            className="btn btn-primary"
            disabled={busy || loading}
            onClick={handleExport}
          >
            {busy ? <Loader2 size={16} className="spin" /> : <Download size={16} />}
            {busy ? "Erstelle Export …" : "ZIP erstellen und herunterladen"}
          </button>
        </div>
      </section>

      {result && (
        <section className="card" style={{ padding: 20, marginBottom: 20 }}>
          <h2 style={{ marginTop: 0 }}>Letztes Export-Ergebnis</h2>
          <p style={{ color: "var(--muted)", fontSize: "0.9rem" }}>
            Export-ID: <code>{result.manifest.id}</code><br />
            Erstellt: <code>{result.manifest.createdAt}</code><br />
            Gesamt-Größe: <code>{result.manifest.totalSizeBytes}</code> Bytes
          </p>
          <table className="report__table" style={{ width: "100%", marginTop: 8 }}>
            <thead>
              <tr>
                <th style={{ textAlign: "left" }}>Tabelle</th>
                <th style={{ textAlign: "right" }}>Zeilen</th>
                <th style={{ textAlign: "right" }}>Bytes</th>
                <th style={{ textAlign: "left" }}>SHA-256 (kurz)</th>
              </tr>
            </thead>
            <tbody>
              {result.manifest.tables.map((t) => (
                <tr key={t.name}>
                  <td>{t.name}</td>
                  <td style={{ textAlign: "right" }}>{t.rowCount}</td>
                  <td style={{ textAlign: "right" }}>{t.sizeBytes}</td>
                  <td><code>{t.sha256.slice(0, 16)}…</code></td>
                </tr>
              ))}
            </tbody>
          </table>
          {result.warnings.length > 0 && (
            <p role="alert" style={{ color: "#a86200", marginTop: 12 }}>
              ⚠ {result.warnings.join(" · ")}
            </p>
          )}
        </section>
      )}

      <section className="card" style={{ padding: 20 }}>
        <h2 style={{ marginTop: 0 }}>
          <FileSearch size={18} style={{ verticalAlign: "-3px", marginRight: 6 }} />
          Integrität prüfen
        </h2>
        <p style={{ color: "var(--muted)" }}>
          Laden Sie eine zuvor erzeugte Export-ZIP hoch. Die Hashes in
          MANIFEST.json werden neu berechnet und mit den Tabellen verglichen.
          Erkennt <strong>unbeabsichtigte Korruption</strong>, nicht gezielte
          Manipulation (siehe DISCLAIMER.txt im ZIP).
        </p>
        <input
          type="file"
          accept=".zip,application/zip"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void handleVerify(f);
          }}
        />

        {verifying && (
          <p style={{ marginTop: 12 }}>
            <Loader2 size={16} className="spin" /> Prüfe …
          </p>
        )}

        {verifyResult && !verifying && (
          <div style={{ marginTop: 12 }}>
            {verifyResult.manifestValid && verifyResult.tablesValid ? (
              <p style={{ color: "#1f8434", fontWeight: 600 }}>
                <CheckCircle2 size={18} style={{ verticalAlign: "-3px" }} /> Integrität OK —
                Manifest und alle Tabellen stimmen überein.
              </p>
            ) : (
              <p style={{ color: "#a62020", fontWeight: 600 }}>
                <XCircle size={18} style={{ verticalAlign: "-3px" }} /> Integrität fehlgeschlagen
              </p>
            )}
            {verifyResult.errors.length > 0 && (
              <ul style={{ color: "#a62020", marginTop: 8 }}>
                {verifyResult.errors.map((e, i) => <li key={i}>{e}</li>)}
              </ul>
            )}
            {verifyResult.warnings.length > 0 && (
              <ul style={{ color: "#a86200", marginTop: 8 }}>
                {verifyResult.warnings.map((w, i) => <li key={i}>{w}</li>)}
              </ul>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
