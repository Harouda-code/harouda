import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  AlertTriangle,
  ArrowLeft,
  FileText,
  FileCheck2,
  Loader2,
} from "lucide-react";
import { fetchAccounts } from "../api/accounts";
import { fetchClients } from "../api/clients";
import { fetchAllEntries } from "../api/dashboard";
import { fetchDocuments } from "../api/documents";
import { fetchAuditLog, log as auditLog, verifyAuditChain } from "../api/audit";
import { fetchInvoiceArchive } from "../api/invoiceArchive";
import { verifyJournalChain } from "../utils/journalChain";
import { useCompany } from "../contexts/CompanyContext";
import { useSettings } from "../contexts/SettingsContext";
import { useUser } from "../contexts/UserContext";
import { usePermissions } from "../hooks/usePermissions";
import { DEMO_MODE } from "../api/supabase";
import {
  applyChangelog,
  buildVerfahrensdokuPdf,
  collectVerfahrensdoku,
  type VerfahrensdokuData,
} from "../utils/verfahrensdokumentation";
import { downloadBlob } from "../utils/exporters";
import "./ReportView.css";
import "./TaxCalc.css";
import "./VerfahrensdokuPage.css";

const PRODUKT_VERSION = "1.0.0-preview";

export default function VerfahrensdokuPage() {
  const perms = usePermissions();
  const { settings } = useSettings();
  const { memberships, activeCompanyId } = useCompany();
  const { user, idleTimeoutMinutes } = useUser();

  const accountsQ = useQuery({
    queryKey: ["accounts", "all-with-inactive"],
    queryFn: fetchAccounts,
  });
  const clientsQ = useQuery({
    queryKey: ["clients", "all"],
    queryFn: fetchClients,
  });
  const entriesQ = useQuery({
    queryKey: ["journal_entries", "all"],
    queryFn: fetchAllEntries,
  });
  // Verfahrensdokumentation ist Kanzlei-weit (GoBD-Nachweis über alles).
  const docsQ = useQuery({
    queryKey: ["documents", "all", null],
    queryFn: () => fetchDocuments(null),
  });
  const auditQ = useQuery({
    queryKey: ["audit_log"],
    queryFn: fetchAuditLog,
  });

  const [ersteller, setErsteller] = useState(() => user?.email ?? "");
  const [erstellerRolle, setErstellerRolle] = useState("Owner / IT-Revision");
  const [zweck, setZweck] = useState(
    "Nachweis der ordnungsmäßigen IT-Unterstützung der Buchführung gegenüber der Finanzverwaltung nach GoBD."
  );
  const [pdfBusy, setPdfBusy] = useState(false);
  const [chainStatus, setChainStatus] = useState<
    "nicht geprüft" | "ok" | "defekt"
  >("nicht geprüft");
  const [journalChainStatus, setJournalChainStatus] = useState<
    "nicht geprüft" | "ok" | "defekt"
  >("nicht geprüft");
  const [chainBusy, setChainBusy] = useState(false);

  const archiveQ = useQuery({
    queryKey: ["invoice_archive", null],
    queryFn: () => fetchInvoiceArchive(null),
  });

  const counts = useMemo(() => {
    const entries = entriesQ.data ?? [];
    return {
      accounts: accountsQ.data?.length ?? 0,
      clients: clientsQ.data?.length ?? 0,
      entries: entries.length,
      stornos: entries.filter((e) => e.storno_status === "reversal").length,
      corrections: entries.filter((e) => e.storno_status === "correction")
        .length,
      documents: docsQ.data?.length ?? 0,
      audit: auditQ.data?.length ?? 0,
      archivedInvoices: archiveQ.data?.length ?? 0,
    };
  }, [
    accountsQ.data,
    clientsQ.data,
    entriesQ.data,
    docsQ.data,
    auditQ.data,
    archiveQ.data,
  ]);

  async function handleVerifyChain() {
    setChainBusy(true);
    try {
      const [audit, journal] = await Promise.all([
        verifyAuditChain(),
        fetchAllEntries().then((e) => verifyJournalChain(e)),
      ]);
      setChainStatus(audit.ok ? "ok" : "defekt");
      setJournalChainStatus(journal.ok ? "ok" : "defekt");
      if (audit.ok && journal.ok) {
        toast.success("Beide Ketten intakt.");
      } else {
        toast.error(
          `Audit: ${audit.ok ? "OK" : "defekt"} · Journal: ${journal.ok ? "OK" : "defekt"}`
        );
      }
    } finally {
      setChainBusy(false);
    }
  }

  async function handleGenerate() {
    if (!perms.canAdmin) {
      toast.error("Nur Admin oder Owner darf die Verfahrensdokumentation erzeugen.");
      return;
    }
    if (!ersteller.trim()) {
      toast.error("Bitte Name der Ersteller:in eintragen.");
      return;
    }
    setPdfBusy(true);
    try {
      const rawData: VerfahrensdokuData = collectVerfahrensdoku({
        settings,
        memberships,
        activeCompanyId,
        idleTimeoutMinutes,
        erstellerName: ersteller.trim(),
        erstellerRolle: erstellerRolle.trim(),
        zweck: zweck.trim(),
        produktVersion: PRODUKT_VERSION,
        isSupabase: !DEMO_MODE,
        counts,
        auditChainStatus: chainStatus,
        journalChainStatus,
      });
      const data = applyChangelog(rawData);
      const bytes = await buildVerfahrensdokuPdf(data);
      const blob = new Blob([new Uint8Array(bytes)], {
        type: "application/pdf",
      });
      const stamp = new Date().toISOString().slice(0, 10);
      const filename = `verfahrensdokumentation_${stamp}.pdf`;
      downloadBlob(blob, filename);
      await auditLog({
        action: "export",
        entity: "verfahrensdoku",
        entity_id: activeCompanyId,
        summary: `Verfahrensdokumentation (PDF) erzeugt — Ersteller: ${ersteller}`,
      });
      toast.success("Verfahrensdokumentation als PDF heruntergeladen.");
    } catch (err) {
      toast.error(`PDF-Erzeugung fehlgeschlagen: ${(err as Error).message}`);
    } finally {
      setPdfBusy(false);
    }
  }

  const loading =
    accountsQ.isLoading ||
    clientsQ.isLoading ||
    entriesQ.isLoading ||
    docsQ.isLoading;

  return (
    <div className="report vdoku">
      <header className="report__head">
        <Link to="/einstellungen" className="report__back">
          <ArrowLeft size={16} />
          Zurück zu Einstellungen
        </Link>
        <div className="report__head-title">
          <h1>
            <FileText
              size={22}
              style={{ verticalAlign: "-3px", marginRight: 8 }}
            />
            Verfahrensdokumentation (Vorlage)
          </h1>
          <p>
            Erzeugt eine PDF-Vorlage mit den IT-technischen Grundlagen der
            Installation — als Entwurf für die interne
            Verfahrensdokumentation nach GoBD.
          </p>
        </div>
      </header>

      <aside className="taxcalc__hint">
        <AlertTriangle size={14} />
        <span>
          <strong>Ehrlicher Hinweis:</strong> Das PDF ist eine automatisch
          zusammengesetzte Vorlage auf Basis der aktuellen Konfiguration.
          Organisatorische Regelungen, Freigabeprozesse und Kontrollschritte
          müssen Sie ergänzen. Ein unabhängig geprüftes GoBD-Testat ist
          damit nicht verbunden.
        </span>
      </aside>

      <section className="card vdoku__section">
        <h2>Angaben für die Erstellung</h2>
        <div className="form-grid">
          <label className="form-field">
            <span>Ersteller:in *</span>
            <input
              value={ersteller}
              onChange={(e) => setErsteller(e.target.value)}
              placeholder="Name, z. B. Max Mustermann"
            />
          </label>
          <label className="form-field">
            <span>Rolle der Ersteller:in</span>
            <input
              value={erstellerRolle}
              onChange={(e) => setErstellerRolle(e.target.value)}
            />
          </label>
          <label className="form-field form-field--wide">
            <span>Zweck</span>
            <textarea
              value={zweck}
              onChange={(e) => setZweck(e.target.value)}
              rows={3}
            />
          </label>
        </div>
      </section>

      <section className="card vdoku__section">
        <h2>Datengrundlage</h2>
        {loading ? (
          <p>
            <Loader2 size={14} className="login__spinner" /> Lade aktuelle
            Kennzahlen …
          </p>
        ) : (
          <ul className="vdoku__counts">
            <li>
              Konten: <strong>{counts.accounts}</strong>
            </li>
            <li>
              Mandanten: <strong>{counts.clients}</strong>
            </li>
            <li>
              Buchungen: <strong>{counts.entries}</strong>
            </li>
            <li>
              Stornos: <strong>{counts.stornos}</strong>
            </li>
            <li>
              Korrekturen: <strong>{counts.corrections}</strong>
            </li>
            <li>
              Belege: <strong>{counts.documents}</strong>
            </li>
            <li>
              Audit-Einträge: <strong>{counts.audit}</strong>
            </li>
            <li>
              E-Rechnungen (Archiv): <strong>{counts.archivedInvoices}</strong>
            </li>
            <li>
              Sitzungs-Timeout:{" "}
              <strong>{idleTimeoutMinutes} Minuten</strong>
            </li>
            <li>
              Speicher-Modus:{" "}
              <strong>{DEMO_MODE ? "Browser (Demo)" : "Supabase"}</strong>
            </li>
          </ul>
        )}
        <div className="vdoku__chain">
          <span>
            Audit:{" "}
            <strong
              style={{
                color:
                  chainStatus === "ok"
                    ? "var(--success)"
                    : chainStatus === "defekt"
                      ? "var(--danger)"
                      : "var(--ink-soft)",
              }}
            >
              {chainStatus}
            </strong>
            {" · "}Journal:{" "}
            <strong
              style={{
                color:
                  journalChainStatus === "ok"
                    ? "var(--success)"
                    : journalChainStatus === "defekt"
                      ? "var(--danger)"
                      : "var(--ink-soft)",
              }}
            >
              {journalChainStatus}
            </strong>
          </span>
          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={handleVerifyChain}
            disabled={chainBusy}
          >
            {chainBusy ? "Prüfe …" : "Beide Ketten jetzt prüfen"}
          </button>
        </div>
      </section>

      <section className="card vdoku__actions">
        <button
          type="button"
          className="btn btn-primary"
          onClick={handleGenerate}
          disabled={pdfBusy || !perms.canAdmin || loading}
        >
          {pdfBusy ? (
            <>
              <Loader2 size={16} className="login__spinner" />
              Erzeuge PDF …
            </>
          ) : (
            <>
              <FileCheck2 size={16} />
              Verfahrensdokumentation erzeugen &amp; herunterladen
            </>
          )}
        </button>
        {!perms.canAdmin && (
          <p className="vdoku__hint">
            Nur Admin oder Owner darf die Verfahrensdokumentation erzeugen.
            Deine Rolle: {perms.role ?? "—"}.
          </p>
        )}
      </section>

      <section className="card vdoku__section">
        <h2>Abschnitte des erzeugten PDFs</h2>
        <ol>
          <li>Unternehmensinformationen</li>
          <li>IT-Systemübersicht (Komponenten, Speicherung, Backup)</li>
          <li>Benutzerrollen und -berechtigungen</li>
          <li>Datenschutz und Sicherheit (DSGVO, Auftragsverarbeitung)</li>
          <li>Aufbewahrungsrichtlinien (§ 147 AO)</li>
          <li>Kennzahlen &amp; Hash-Ketten-Status zum Zeitpunkt der Erzeugung</li>
          <li>Verfahrensabläufe (E-Rechnung, Buchung, Export, Rollenverwaltung)</li>
          <li>Systemprotokollierung (Audit-Log, App-Log, Journal- und Archivketten)</li>
          <li>Änderungsprotokoll gegenüber vorheriger Version</li>
        </ol>
      </section>
    </div>
  );
}
