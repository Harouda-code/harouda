import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  AlertTriangle,
  Database,
  Download,
  Eye,
  FileDown,
  FileSearch,
  History,
  ShieldCheck,
} from "lucide-react";
import { fetchAccounts } from "../api/accounts";
import { fetchAllEntries } from "../api/dashboard";
import { fetchClients } from "../api/clients";
import { fetchAuditLog, log as auditLog } from "../api/audit";
import { useCompany } from "../contexts/CompanyContext";
import { useSettings } from "../contexts/SettingsContext";
import { usePermissions } from "../hooks/usePermissions";
import { buildGdpduZip } from "../utils/gdpdu";
import { downloadBlob } from "../utils/exporters";
import "./ReportView.css";
import "./TaxCalc.css";
import "./PrueferDashboardPage.css";

const euro = new Intl.NumberFormat("de-DE", {
  style: "currency",
  currency: "EUR",
});

export default function PrueferDashboardPage() {
  const perms = usePermissions();
  const { activeCompanyId, memberships } = useCompany();
  const { settings } = useSettings();
  const entriesQ = useQuery({
    queryKey: ["journal_entries", "all"],
    queryFn: fetchAllEntries,
  });
  const accountsQ = useQuery({
    queryKey: ["accounts", "all-with-inactive"],
    queryFn: fetchAccounts,
  });
  const clientsQ = useQuery({
    queryKey: ["clients", "all"],
    queryFn: fetchClients,
  });
  const auditQ = useQuery({
    queryKey: ["audit_log"],
    queryFn: fetchAuditLog,
  });

  const [exportBusy, setExportBusy] = useState(false);
  const [sessionLogged, setSessionLogged] = useState(false);

  // Zugriff auf das Prüfer-Dashboard protokollieren — einmal pro Seitenbesuch.
  useMemo(() => {
    if (sessionLogged) return;
    if (!perms.canAudit) return;
    void auditLog({
      action: "access",
      entity: "auditor_session",
      entity_id: activeCompanyId,
      summary: `Prüfer-Dashboard geöffnet (Rolle: ${perms.role ?? "unbekannt"})`,
    });
    setSessionLogged(true);
  }, [perms.canAudit, perms.role, activeCompanyId, sessionLogged]);

  const activeCompany = useMemo(
    () => memberships.find((m) => m.companyId === activeCompanyId) ?? null,
    [memberships, activeCompanyId]
  );

  const entries = entriesQ.data ?? [];
  const accounts = accountsQ.data ?? [];
  const clients = clientsQ.data ?? [];
  const auditLogRows = auditQ.data ?? [];

  const totals = useMemo(() => {
    const activeEntries = entries.filter(
      (e) => (e.storno_status ?? "active") === "active"
    );
    const reversals = entries.filter((e) => e.storno_status === "reversal");
    const corrections = entries.filter(
      (e) => e.storno_status === "correction"
    );
    return {
      count: entries.length,
      active: activeEntries.length,
      reversals: reversals.length,
      corrections: corrections.length,
      sum: activeEntries.reduce((s, e) => s + Number(e.betrag), 0),
    };
  }, [entries]);

  async function handleGdpduExport() {
    if (!perms.canAudit) return;
    setExportBusy(true);
    try {
      const zip = await buildGdpduZip({
        name: activeCompany?.companyName ?? settings.kanzleiName ?? "Unternehmen",
        location: [settings.kanzleiPlz, settings.kanzleiOrt]
          .filter(Boolean)
          .join(" "),
      });
      const stamp = new Date().toISOString().slice(0, 10);
      downloadBlob(zip, `gdpdu_pruefer_${stamp}.zip`);
      await auditLog({
        action: "export",
        entity: "auditor_session",
        entity_id: activeCompanyId,
        summary: `GDPdU/IDEA-Export durch Prüfer:in erzeugt`,
      });
      toast.success("GDPdU-Paket heruntergeladen.");
    } catch (err) {
      toast.error(`Export fehlgeschlagen: ${(err as Error).message}`);
    } finally {
      setExportBusy(false);
    }
  }

  if (!perms.canAudit) {
    return (
      <div className="report">
        <header className="report__head">
          <div className="report__head-title">
            <h1>Prüfer-Dashboard</h1>
          </div>
        </header>
        <aside className="taxcalc__hint">
          <ShieldCheck size={14} />
          <span>
            Zugriff verweigert — diese Seite ist Admins, Ownern und
            Betriebsprüfer:innen vorbehalten. Ihre aktuelle Rolle:{" "}
            <strong>{perms.role ?? "keine"}</strong>.
          </span>
        </aside>
      </div>
    );
  }

  return (
    <div className="report pruefer">
      <header className="report__head">
        <div className="report__head-title">
          <h1>
            <Eye size={22} style={{ verticalAlign: "-3px", marginRight: 8 }} />
            Prüfer-Dashboard
          </h1>
          <p>
            Read-only-Sicht für externe Betriebsprüfer:innen. Alle Zugriffe
            und Exporte werden im Audit-Log protokolliert.
          </p>
        </div>
      </header>

      <aside className="taxcalc__hint">
        <AlertTriangle size={14} />
        <span>
          <strong>Hinweise zur Absicherung:</strong> Die eigentliche
          IP-Beschränkung und die zeitliche Begrenzung des Zugangs müssen
          serverseitig in Supabase (RLS-Policies bzw. API-Gateway)
          umgesetzt werden — die App zeigt hier nur die Rolle und
          protokolliert Zugriffe. Siehe SQL-Migrationen und Auditor-Admin-Guide.
        </span>
      </aside>

      <section className="pruefer__kpis">
        <div className="card pruefer__kpi">
          <div className="pruefer__kpi-head">
            <Database size={16} /> Unternehmen
          </div>
          <div className="pruefer__kpi-value">
            {activeCompany?.companyName ?? settings.kanzleiName ?? "—"}
          </div>
          <dl className="pruefer__kpi-sub">
            <div>
              <dt>Sitz</dt>
              <dd>
                {settings.kanzleiPlz} {settings.kanzleiOrt}
              </dd>
            </div>
            <div>
              <dt>Steuernummer</dt>
              <dd>{settings.defaultSteuernummer || "—"}</dd>
            </div>
          </dl>
        </div>

        <div className="card pruefer__kpi">
          <div className="pruefer__kpi-head">
            <FileSearch size={16} /> Journal
          </div>
          <div className="pruefer__kpi-value">{totals.count} Buchungen</div>
          <dl className="pruefer__kpi-sub">
            <div>
              <dt>aktiv</dt>
              <dd>{totals.active}</dd>
            </div>
            <div>
              <dt>Stornos</dt>
              <dd>{totals.reversals}</dd>
            </div>
            <div>
              <dt>Korrekturen</dt>
              <dd>{totals.corrections}</dd>
            </div>
            <div>
              <dt>Summe aktiv</dt>
              <dd>{euro.format(totals.sum)}</dd>
            </div>
          </dl>
        </div>

        <div className="card pruefer__kpi">
          <div className="pruefer__kpi-head">
            <Database size={16} /> Stammdaten
          </div>
          <div className="pruefer__kpi-value">{clients.length} Mandanten</div>
          <dl className="pruefer__kpi-sub">
            <div>
              <dt>Konten</dt>
              <dd>{accounts.length}</dd>
            </div>
            <div>
              <dt>aktive Konten</dt>
              <dd>{accounts.filter((a) => a.is_active).length}</dd>
            </div>
          </dl>
        </div>

        <div className="card pruefer__kpi">
          <div className="pruefer__kpi-head">
            <History size={16} /> Audit-Log
          </div>
          <div className="pruefer__kpi-value">{auditLogRows.length}</div>
          <dl className="pruefer__kpi-sub">
            <div>
              <dt>Zugriff</dt>
              <dd>
                <Link to="/einstellungen/audit">Vollständig anzeigen →</Link>
              </dd>
            </div>
          </dl>
        </div>
      </section>

      <section className="card pruefer__section">
        <div className="pruefer__section-head">
          <h2>Datenexport (GDPdU / IDEA)</h2>
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleGdpduExport}
            disabled={exportBusy}
          >
            <FileDown size={16} />
            {exportBusy ? "Erstelle ZIP …" : "GDPdU/IDEA ZIP herunterladen"}
          </button>
        </div>
        <p>
          Kompletter Datenabzug im idaten-kompatiblen Format mit{" "}
          <code>index.xml</code>, Kontenplan, Journal und Stammdaten.
          Konform zur bundeseinheitlichen GoBD-Datenträgerüberlassung
          (Z3-Zugriff). Der Export wird im Audit-Log vermerkt.
        </p>
      </section>

      <section className="card pruefer__section">
        <h2>Zugriffe &amp; Navigation</h2>
        <ul className="pruefer__nav">
          <li>
            <Link to="/journal">
              <FileSearch size={14} /> Journal (vollständig, inkl. Stornos und Korrekturen)
            </Link>
          </li>
          <li>
            <Link to="/konten">
              <Database size={14} /> Kontenplan (SKR03)
            </Link>
          </li>
          <li>
            <Link to="/berichte/susa">
              <FileSearch size={14} /> Summen- &amp; Saldenliste
            </Link>
          </li>
          <li>
            <Link to="/berichte/guv">
              <FileSearch size={14} /> Gewinn- und Verlustrechnung
            </Link>
          </li>
          <li>
            <Link to="/belege">
              <Database size={14} /> Beleg-Archiv
            </Link>
          </li>
          <li>
            <Link to="/einstellungen/audit">
              <History size={14} /> Audit-Log mit Hash-Kette
            </Link>
          </li>
        </ul>
        {perms.isAuditor && (
          <aside className="taxcalc__hint">
            <ShieldCheck size={14} />
            <span>
              Als Betriebsprüfer:in haben Sie nur Lese-Zugriff; sämtliche
              Schaltflächen für Änderungen sind deaktiviert. Anlegen neuer
              Buchungen, Storno, Mahnungen und Einstellungs-Änderungen sind
              gesperrt.
            </span>
          </aside>
        )}
      </section>

      <section className="card pruefer__section">
        <h2>Download-Historie dieser Prüfersitzung</h2>
        <AuditorSessionLog />
      </section>
    </div>
  );
}

function AuditorSessionLog() {
  const auditQ = useQuery({
    queryKey: ["audit_log"],
    queryFn: fetchAuditLog,
  });
  const rows = (auditQ.data ?? []).filter(
    (r) =>
      r.entity === "auditor_session" ||
      (r.action === "export" && r.entity === "settings")
  );
  if (rows.length === 0) {
    return <p>Noch keine protokollierten Prüfer-Zugriffe in dieser Firma.</p>;
  }
  return (
    <ul className="pruefer__sessions">
      {rows.slice(0, 10).map((r) => (
        <li key={r.id}>
          <span className="mono">
            {new Date(r.at).toLocaleString("de-DE")}
          </span>
          <span>
            <strong>{r.action}</strong> — {r.summary}
          </span>
          <span className="pruefer__actor">
            {r.actor ?? "anonym"}
            {r.user_agent ? ` · ${r.user_agent.slice(0, 40)}…` : ""}
          </span>
        </li>
      ))}
    </ul>
  );
}
