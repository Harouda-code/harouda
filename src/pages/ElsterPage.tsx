import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Download,
  ExternalLink,
  FileKey2,
  Info,
  Landmark,
  ShieldAlert,
  ShieldCheck,
} from "lucide-react";
import { fetchAccounts } from "../api/accounts";
import { fetchAllEntries } from "../api/dashboard";
import { buildUstva, filterByPeriod } from "../api/reports";
import {
  fetchSubmissions,
  setSubmissionStatus,
  upsertSubmission,
} from "../api/elsterSubmissions";
import { useMandant } from "../contexts/MandantContext";
import { useSettings } from "../contexts/SettingsContext";
import { useUser } from "../contexts/UserContext";
import { usePermissions } from "../hooks/usePermissions";
import { buildUstvaXml, downloadXml } from "../utils/elster";
import { checkUstvaPlausi } from "../utils/elsterPlausi";
import type { ElsterSubmissionStatus } from "../types/db";
import "./ReportView.css";
import "./TaxCalc.css";
import "./ElsterPage.css";

const euro = new Intl.NumberFormat("de-DE", {
  style: "currency",
  currency: "EUR",
});

const MONTHS = [
  "Januar",
  "Februar",
  "März",
  "April",
  "Mai",
  "Juni",
  "Juli",
  "August",
  "September",
  "Oktober",
  "November",
  "Dezember",
];

const STATUS_LABEL: Record<ElsterSubmissionStatus, string> = {
  draft: "Entwurf",
  exported: "XML exportiert",
  "transmitted-manually": "Manuell übertragen",
  acknowledged: "Vom Finanzamt bestätigt",
  rejected: "Abgelehnt",
};

const STATUS_COLOR: Record<ElsterSubmissionStatus, string> = {
  draft: "var(--muted)",
  exported: "var(--navy)",
  "transmitted-manually": "var(--gold-700)",
  acknowledged: "var(--success)",
  rejected: "var(--danger)",
};

function monthRange(year: number, month: number) {
  const start = new Date(year, month - 1, 1).toISOString().slice(0, 10);
  const end = new Date(year, month, 0).toISOString().slice(0, 10);
  return { start, end };
}

async function sha256Hex(text: string): Promise<string> {
  const bytes = new TextEncoder().encode(text);
  const copy = new Uint8Array(bytes.length);
  copy.set(bytes);
  const digest = await crypto.subtle.digest("SHA-256", copy.buffer);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export default function ElsterPage() {
  const perms = usePermissions();
  const qc = useQueryClient();
  const { settings } = useSettings();
  const { selectedMandantId } = useMandant();
  const { user } = useUser();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);

  const entriesQ = useQuery({
    queryKey: ["journal_entries", "all", selectedMandantId],
    queryFn: fetchAllEntries,
  });
  const accountsQ = useQuery({
    queryKey: ["accounts", "all-with-inactive"],
    queryFn: fetchAccounts,
  });
  const submissionsQ = useQuery({
    queryKey: ["elster_submissions", selectedMandantId],
    queryFn: () => fetchSubmissions(selectedMandantId),
  });

  const period = monthRange(year, month);
  const filtered = useMemo(
    () => filterByPeriod(entriesQ.data ?? [], period, selectedMandantId),
    [entriesQ.data, period, selectedMandantId]
  );
  const report = useMemo(
    () => buildUstva(filtered, accountsQ.data ?? []),
    [filtered, accountsQ.data]
  );

  const plausi = useMemo(
    () =>
      checkUstvaPlausi({
        year,
        month,
        period,
        entries: filtered,
        report,
        settings: {
          steuernummer: settings.defaultSteuernummer,
          beraterNr: settings.elsterBeraterNr,
          kanzleiName: settings.kanzleiName,
          kleinunternehmer: settings.kleinunternehmer,
        },
      }),
    [year, month, period, filtered, report, settings]
  );

  const exportM = useMutation({
    mutationFn: async () => {
      const xml = buildUstvaXml(report, {
        steuernummer: settings.defaultSteuernummer,
        beraterNr: settings.elsterBeraterNr,
        kanzleiName: settings.kanzleiName,
        year,
        month,
      });
      const sha = await sha256Hex(xml);
      downloadXml(
        xml,
        `ustva_${year}-${String(month).padStart(2, "0")}.xml`
      );
      return upsertSubmission(
        {
          form_type: "ustva",
          year,
          period: month,
          label: `UStVA ${MONTHS[month - 1]} ${year}`,
          file_sha256: sha,
          file_bytes: new Blob([xml]).size,
          initialStatus: "exported",
        },
        selectedMandantId
      );
    },
    onSuccess: () => {
      toast.success("XML erzeugt und im Register abgelegt.");
      qc.invalidateQueries({ queryKey: ["elster_submissions"] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const statusM = useMutation({
    mutationFn: (
      input: Parameters<typeof setSubmissionStatus>[0]
    ) => setSubmissionStatus(input, selectedMandantId),
    onSuccess: () => {
      toast.success("Status aktualisiert.");
      qc.invalidateQueries({ queryKey: ["elster_submissions"] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  if (!perms.canRead) {
    return (
      <div className="report">
        <header className="report__head">
          <h1>ELSTER-Übertragung</h1>
        </header>
        <aside className="taxcalc__hint">
          <AlertTriangle size={14} />
          <span>Kein Zugriff — Sie sind keiner Firma zugeordnet.</span>
        </aside>
      </div>
    );
  }

  const canExport = perms.canWrite && plausi.ok;

  return (
    <div className="report elster">
      <header className="report__head">
        <Link to="/steuer" className="report__back">
          <ArrowLeft size={16} />
          Zurück zu Steuerformularen
        </Link>
        <div className="report__head-title">
          <h1>
            <Landmark
              size={22}
              style={{ verticalAlign: "-3px", marginRight: 8 }}
            />
            ELSTER-Übertragung
          </h1>
          <p>
            UStVA vorbereiten, validieren und als XML exportieren. Die
            eigentliche Abgabe erfolgt über das offizielle ElsterOnline-Portal
            oder einen zertifizierten Desktop-Client.
          </p>
        </div>
      </header>

      <aside className="elster__disclaimer">
        <ShieldAlert size={16} />
        <div>
          <strong>Ehrlich über die Grenzen:</strong> Direkte ERiC-Übertragung
          ist aus dem Browser heraus nicht möglich — dafür wäre ein
          serverseitiger Dienst mit lizenzierter ERiC-Bibliothek, OpenJDK und
          Zugriff auf Ihre{" "}
          <code>*_sig.pfx</code> / <code>*_enc.pfx</code>-Zertifikate nötig.
          Diese App erzeugt nur das XML. Upload{" "}
          <a
            href="https://www.elster.de/eportal/login"
            target="_blank"
            rel="noreferrer"
          >
            beim ElsterOnline-Portal <ExternalLink size={12} />
          </a>{" "}
          oder über DATEV/Taxpool/WISO.
        </div>
      </aside>

      <section className="card elster__section elster__cert">
        <h2>
          <FileKey2 size={16} /> Zertifikat-Status
        </h2>
        <CertStatus settings={settings} />
      </section>

      <section className="card elster__section">
        <h2>Periode wählen</h2>
        <div className="elster__period">
          <label>
            <span>Jahr</span>
            <input
              type="number"
              min="2000"
              max="2100"
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
            />
          </label>
          <label>
            <span>Monat</span>
            <select
              value={month}
              onChange={(e) => setMonth(Number(e.target.value))}
            >
              {MONTHS.map((m, i) => (
                <option key={m} value={i + 1}>
                  {m}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="elster__kpis">
          <div>
            <dt>Umsätze 19 %</dt>
            <dd>{euro.format(report.kz81)}</dd>
          </div>
          <div>
            <dt>Umsätze 7 %</dt>
            <dd>{euro.format(report.kz86)}</dd>
          </div>
          <div>
            <dt>Vorsteuer</dt>
            <dd>{euro.format(report.kz66)}</dd>
          </div>
          <div>
            <dt>Zahllast / Erstattung</dt>
            <dd
              style={{
                color:
                  report.zahllast >= 0 ? "var(--navy)" : "var(--success)",
              }}
            >
              {euro.format(Math.abs(report.zahllast))}
              {" "}
              {report.zahllast >= 0 ? "(Zahllast)" : "(Erstattung)"}
            </dd>
          </div>
        </div>
      </section>

      <section
        className={`card elster__section elster__plausi ${
          plausi.ok ? "is-ok" : "is-block"
        }`}
      >
        <h2>
          {plausi.ok ? (
            <>
              <CheckCircle2 size={16} style={{ color: "var(--success)" }} />
              Plausibilität OK
            </>
          ) : (
            <>
              <ShieldAlert size={16} style={{ color: "var(--danger)" }} />
              Plausibilität: {plausi.blockers} Fehler, {plausi.warnings}{" "}
              Warnungen
            </>
          )}
        </h2>
        {plausi.issues.length === 0 ? (
          <p>Keine Auffälligkeiten.</p>
        ) : (
          <ul className="elster__issues">
            {plausi.issues.map((i, idx) => (
              <li key={idx} className={`is-${i.severity}`}>
                <strong>{i.code}</strong> — {i.message}
                {i.hint && <em>{i.hint}</em>}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="card elster__actions">
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => exportM.mutate()}
          disabled={!canExport || exportM.isPending}
        >
          <Download size={16} />
          {exportM.isPending
            ? "Erzeuge …"
            : plausi.ok
              ? "ELSTER-XML exportieren & im Register verbuchen"
              : "Erst Plausi-Fehler beheben"}
        </button>
        {!perms.canWrite && (
          <p className="elster__hint">
            Als Nur-Lese-Nutzer:in können Sie nicht exportieren.
          </p>
        )}
      </section>

      <section className="card elster__section">
        <h2>Abgabe-Register</h2>
        {submissionsQ.data && submissionsQ.data.length > 0 ? (
          <table className="elster__table">
            <thead>
              <tr>
                <th>Formular / Periode</th>
                <th>Status</th>
                <th>Ticket</th>
                <th>Exportiert am</th>
                <th>Aktion</th>
              </tr>
            </thead>
            <tbody>
              {submissionsQ.data.map((s) => (
                <tr key={s.id}>
                  <td>
                    <strong>{s.label}</strong>
                    {s.file_sha256 && (
                      <span className="elster__sha">
                        SHA-256 {s.file_sha256.slice(0, 10)}…
                      </span>
                    )}
                  </td>
                  <td>
                    <span
                      className="elster__badge"
                      style={{
                        color: STATUS_COLOR[s.status],
                        borderColor: STATUS_COLOR[s.status],
                      }}
                    >
                      {STATUS_LABEL[s.status]}
                    </span>
                  </td>
                  <td className="mono">{s.transfer_ticket ?? "—"}</td>
                  <td className="mono">
                    {new Date(s.created_at).toLocaleDateString("de-DE")}
                  </td>
                  <td>
                    <StatusActions
                      currentStatus={s.status}
                      onChange={(status, ticket) =>
                        statusM.mutate({
                          id: s.id,
                          status,
                          transfer_ticket: ticket,
                        })
                      }
                      disabled={!perms.canManage || statusM.isPending}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p>
            Noch keine Abgaben verbucht. Nach dem ersten Export erscheint hier
            ein Eintrag, dessen Status Sie nach Upload ins ElsterOnline-Portal
            manuell aktualisieren.
          </p>
        )}
        {user && (
          <p className="elster__hint">
            Aktualisierungen laufen im Audit-Log mit Ihrer Nutzer-Kennung.
          </p>
        )}
      </section>
    </div>
  );
}

function CertStatus({
  settings,
}: {
  settings: {
    defaultSteuernummer: string;
    elsterBeraterNr: string;
  };
}) {
  const stnrOk = settings.defaultSteuernummer.trim().length > 0;
  const beraterOk = settings.elsterBeraterNr.trim().length > 0;
  return (
    <>
      <ul className="elster__cert-list">
        <li className={stnrOk ? "is-ok" : "is-miss"}>
          <strong>Standard-Steuernummer:</strong>{" "}
          {stnrOk ? settings.defaultSteuernummer : "nicht gesetzt"}
        </li>
        <li className={beraterOk ? "is-ok" : "is-miss"}>
          <strong>Berater-Nummer:</strong>{" "}
          {beraterOk ? settings.elsterBeraterNr : "nicht gesetzt"}
        </li>
      </ul>
      <aside className="elster__cert-hint">
        <Info size={14} />
        <div>
          <p>
            <strong>Über Ihre Zertifikate:</strong> ELSTER nutzt zwei separate
            Zertifikate, üblicherweise als PFX-Dateien mit Namenssuffix:
          </p>
          <ul>
            <li>
              <code>*_sig.pfx</code> — Signatur (Identität des Absenders)
            </li>
            <li>
              <code>*_enc.pfx</code> — Verschlüsselung (Nutzdaten-Transport)
            </li>
          </ul>
          <p>
            Diese Dateien gehören <strong>nicht</strong> in diese App. Sie
            werden vom ElsterOnline-Portal erzeugt und lokal auf Ihrem Gerät
            bzw. in einer Smartcard abgelegt. Upload/Abgabe erfolgt direkt
            im Portal oder über ein zertifiziertes Programm.
          </p>
        </div>
      </aside>
    </>
  );
}

function StatusActions({
  currentStatus,
  onChange,
  disabled,
}: {
  currentStatus: ElsterSubmissionStatus;
  onChange: (status: ElsterSubmissionStatus, ticket: string | null) => void;
  disabled: boolean;
}) {
  const [ticket, setTicket] = useState("");
  const next = nextStatus(currentStatus);
  if (!next) {
    return <span className="elster__hint">— abgeschlossen —</span>;
  }
  const isAck = next === "acknowledged";
  return (
    <div className="elster__status-row">
      {isAck && (
        <input
          value={ticket}
          onChange={(e) => setTicket(e.target.value)}
          placeholder="Transfer-Ticket"
          className="elster__ticket-input"
        />
      )}
      <button
        type="button"
        className="btn btn-outline btn-sm"
        disabled={disabled || (isAck && !ticket.trim())}
        onClick={() => onChange(next, ticket.trim() || null)}
      >
        → {STATUS_LABEL[next]}
      </button>
    </div>
  );
}

function nextStatus(
  s: ElsterSubmissionStatus
): ElsterSubmissionStatus | null {
  if (s === "draft") return "exported";
  if (s === "exported") return "transmitted-manually";
  if (s === "transmitted-manually") return "acknowledged";
  return null;
}
