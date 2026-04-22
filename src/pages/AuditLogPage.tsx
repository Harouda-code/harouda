import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  ArrowLeft,
  CheckCircle2,
  Download,
  FileJson,
  History,
  Loader2,
  Search,
  ShieldAlert,
  ShieldCheck,
} from "lucide-react";
import {
  fetchAuditLog,
  verifyAuditChain,
  type VerifyResult,
} from "../api/audit";
import { fetchAllEntries } from "../api/dashboard";
import {
  verifyJournalChain,
  type JournalChainResult,
} from "../utils/journalChain";
import { useYear } from "../contexts/YearContext";
import type { AuditAction, AuditLogEntry } from "../types/db";
import { downloadText } from "../utils/exporters";
import { log as auditLog } from "../api/audit";
import "./AuditLogPage.css";

const ACTION_LABEL: Record<AuditAction, string> = {
  create: "Angelegt",
  update: "Geändert",
  delete: "Gelöscht",
  import: "Importiert",
  export: "Exportiert",
  login: "Login",
  logout: "Logout",
  signup: "Registriert",
  reverse: "Storniert",
  correct: "Korrigiert",
  access: "Zugriff",
};

const ACTION_CLASS: Record<AuditAction, string> = {
  create: "is-create",
  update: "is-update",
  delete: "is-delete",
  import: "is-import",
  export: "is-export",
  login: "is-auth",
  logout: "is-auth",
  signup: "is-auth",
  reverse: "is-delete",
  correct: "is-update",
  access: "is-import",
};

export default function AuditLogPage() {
  const { inYear, selectedYear } = useYear();
  const logQ = useQuery({
    queryKey: ["audit_log"],
    queryFn: fetchAuditLog,
    refetchOnMount: "always",
  });
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState<"alle" | AuditAction>("alle");
  const [entityFilter, setEntityFilter] = useState<string>("alle");
  const [timelineEntityId, setTimelineEntityId] = useState<string | null>(null);

  const log = logQ.data ?? [];

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return log.filter((e) => {
      if (!inYear(e.at)) return false;
      if (actionFilter !== "alle" && e.action !== actionFilter) return false;
      if (entityFilter !== "alle" && e.entity !== entityFilter) return false;
      if (timelineEntityId && e.entity_id !== timelineEntityId) return false;
      if (!q) return true;
      return (
        e.summary.toLowerCase().includes(q) ||
        (e.actor ?? "").toLowerCase().includes(q) ||
        e.entity.toLowerCase().includes(q) ||
        (e.entity_id ?? "").toLowerCase().includes(q)
      );
    });
  }, [log, search, actionFilter, entityFilter, timelineEntityId, inYear]);

  const entities = useMemo(() => {
    const set = new Set<string>();
    for (const e of log) set.add(e.entity);
    return Array.from(set).sort();
  }, [log]);

  async function handleExportJson() {
    const json = JSON.stringify(filtered, null, 2);
    downloadText(
      json,
      `audit-log_${selectedYear}_${new Date().toISOString().slice(0, 10)}.json`,
      "application/json;charset=utf-8"
    );
    await auditLog({
      action: "export",
      entity: "settings",
      entity_id: null,
      summary: `Audit-Log JSON exportiert (${filtered.length} Einträge, Jahr ${selectedYear})`,
    });
    toast.success(`${filtered.length} Einträge als JSON exportiert.`);
  }

  async function handleExportCsv() {
    const header = [
      "Zeitpunkt",
      "Aktion",
      "Entität",
      "Entität-ID",
      "Beschreibung",
      "Nutzer",
      "UserAgent",
      "Hash",
      "PrevHash",
    ];
    const quote = (s: unknown) => {
      const v = s == null ? "" : String(s);
      const esc = v.replace(/"/g, '""');
      return /[",;\n]/.test(v) ? `"${esc}"` : esc;
    };
    const lines = [header.join(";")];
    for (const e of filtered as AuditLogEntry[]) {
      lines.push(
        [
          new Date(e.at).toISOString(),
          ACTION_LABEL[e.action],
          e.entity,
          e.entity_id ?? "",
          e.summary,
          e.actor ?? "",
          e.user_agent ?? "",
          e.hash,
          e.prev_hash,
        ]
          .map(quote)
          .join(";")
      );
    }
    downloadText(
      "\ufeff" + lines.join("\n"),
      `audit-log_${selectedYear}_${new Date().toISOString().slice(0, 10)}.csv`,
      "text/csv;charset=utf-8"
    );
    await auditLog({
      action: "export",
      entity: "settings",
      entity_id: null,
      summary: `Audit-Log CSV exportiert (${filtered.length} Einträge, Jahr ${selectedYear})`,
    });
    toast.success(`${filtered.length} Einträge als CSV exportiert.`);
  }

  const [expanded, setExpanded] = useState<string | null>(null);
  const [verify, setVerify] = useState<VerifyResult | null>(null);
  const [journalVerify, setJournalVerify] =
    useState<JournalChainResult | null>(null);

  const verifyM = useMutation({
    mutationFn: verifyAuditChain,
    onSuccess: (res) => {
      setVerify(res);
      if (res.ok) toast.success(res.message);
      else toast.error(res.message, { duration: 8000 });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const verifyJournalM = useMutation({
    mutationFn: async () => {
      const entries = await fetchAllEntries();
      return verifyJournalChain(entries);
    },
    onSuccess: (res) => {
      setJournalVerify(res);
      if (res.ok) toast.success(res.message);
      else toast.error(res.message, { duration: 8000 });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  return (
    <div className="audit">
      <header className="audit__head">
        <Link to="/einstellungen" className="report__back">
          <ArrowLeft size={16} />
          Zurück zu Einstellungen
        </Link>
        <div>
          <h1>
            <History size={22} style={{ verticalAlign: "-3px", marginRight: 8 }} />
            Audit-Log
          </h1>
          <p>
            Chronologische Aufzeichnung aller Änderungen an Buchungen, Konten,
            Mandanten und Belegen.
          </p>
        </div>
      </header>

      <div
        className={`card audit__verify ${
          verify ? (verify.ok ? "is-ok" : "is-bad") : ""
        }`}
      >
        <div className="audit__verify-head">
          {verify ? (
            verify.ok ? (
              <ShieldCheck size={18} />
            ) : (
              <ShieldAlert size={18} />
            )
          ) : (
            <History size={18} />
          )}
          <div>
            <strong>Audit-Log-Kette</strong>
            <p>
              {verify
                ? verify.message
                : "Rekonstruiert die SHA-256-Kette des Audit-Logs vom Genesis. Änderungen nach dem Schreiben brechen die Kette."}
            </p>
          </div>
          <button
            type="button"
            className="btn btn-outline"
            onClick={() => verifyM.mutate()}
            disabled={verifyM.isPending}
          >
            {verifyM.isPending ? (
              <>
                <Loader2 size={14} className="login__spinner" />
                Prüfe …
              </>
            ) : (
              <>
                <CheckCircle2 size={14} />
                Audit-Kette prüfen
              </>
            )}
          </button>
        </div>
      </div>

      <div
        className={`card audit__verify ${
          journalVerify ? (journalVerify.ok ? "is-ok" : "is-bad") : ""
        }`}
      >
        <div className="audit__verify-head">
          {journalVerify ? (
            journalVerify.ok ? (
              <ShieldCheck size={18} />
            ) : (
              <ShieldAlert size={18} />
            )
          ) : (
            <History size={18} />
          )}
          <div>
            <strong>Journal-Kette (GoBD)</strong>
            <p>
              {journalVerify
                ? journalVerify.message
                : "Unabhängige SHA-256-Kette auf journal_entries. Immutable Kernfelder (Datum, Beleg-Nr., Soll, Haben, Betrag, Beschreibung, parent_entry_id) — storno_status ist bewusst nicht Teil des Hashes, weil er legitim transitioniert."}
            </p>
          </div>
          <button
            type="button"
            className="btn btn-outline"
            onClick={() => verifyJournalM.mutate()}
            disabled={verifyJournalM.isPending}
          >
            {verifyJournalM.isPending ? (
              <>
                <Loader2 size={14} className="login__spinner" />
                Prüfe …
              </>
            ) : (
              <>
                <CheckCircle2 size={14} />
                Journal-Kette prüfen
              </>
            )}
          </button>
        </div>
      </div>

      <div className="card audit__toolbar">
        <label className="journal__search">
          <Search size={16} />
          <input
            type="search"
            placeholder="Suche (Beschreibung / Nutzer / Entität / ID) …"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </label>
        <select
          className="journal__select"
          value={actionFilter}
          onChange={(e) =>
            setActionFilter(e.target.value as typeof actionFilter)
          }
        >
          <option value="alle">Alle Aktionen</option>
          {(Object.keys(ACTION_LABEL) as AuditAction[]).map((a) => (
            <option key={a} value={a}>
              {ACTION_LABEL[a]}
            </option>
          ))}
        </select>
        <select
          className="journal__select"
          value={entityFilter}
          onChange={(e) => setEntityFilter(e.target.value)}
        >
          <option value="alle">Alle Entitäten</option>
          {entities.map((en) => (
            <option key={en} value={en}>
              {en}
            </option>
          ))}
        </select>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={handleExportCsv}
            title="Aktuell gefilterte Zeilen als CSV exportieren"
          >
            <Download size={14} /> CSV
          </button>
          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={handleExportJson}
            title="Aktuell gefilterte Zeilen als JSON exportieren"
          >
            <FileJson size={14} /> JSON
          </button>
        </div>
        <div className="journal__count">
          <strong>{filtered.length}</strong> von {log.length} Einträgen · Jahr {selectedYear}
        </div>
      </div>

      {timelineEntityId && (
        <div
          className="card audit__toolbar"
          style={{ background: "var(--ivory-100)" }}
        >
          <span>
            <strong>Timeline-Ansicht:</strong> nur Einträge für Entität{" "}
            <code>{timelineEntityId}</code>
          </span>
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={() => setTimelineEntityId(null)}
          >
            Timeline schließen
          </button>
        </div>
      )}

      {logQ.isLoading ? (
        <div className="journal__state">
          <Loader2 className="journal__state-spin" size={28} />
          <p>Lade Audit-Log …</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="card audit__empty">
          <p>Noch keine Einträge.</p>
        </div>
      ) : (
        <ol className="audit__list">
          {filtered.map((e) => {
            const open = expanded === e.id;
            return (
              <li
                key={e.id}
                className={`card audit__item ${ACTION_CLASS[e.action]}`}
              >
                <div
                  className="audit__item-head"
                  onClick={() => setExpanded(open ? null : e.id)}
                >
                  <div>
                    <span className={`audit__badge ${ACTION_CLASS[e.action]}`}>
                      {ACTION_LABEL[e.action]}
                    </span>
                    <span className="audit__entity">{e.entity}</span>
                  </div>
                  <div className="audit__summary">{e.summary}</div>
                  <div className="audit__meta">
                    <span>{e.actor ?? "anonym"}</span>
                    <span className="mono">
                      {new Date(e.at).toLocaleString("de-DE")}
                    </span>
                  </div>
                </div>
                {open && (
                  <div className="audit__diff-wrap">
                    <div className="audit__meta-details">
                      {e.entity_id && (
                        <>
                          <span>
                            <strong>Entitäts-ID:</strong>{" "}
                            <code>{e.entity_id}</code>
                          </span>
                          <button
                            type="button"
                            className="btn btn-ghost btn-sm"
                            onClick={(ev) => {
                              ev.stopPropagation();
                              setTimelineEntityId(e.entity_id);
                            }}
                          >
                            Timeline zeigen
                          </button>
                        </>
                      )}
                      {e.user_agent && (
                        <span title={e.user_agent}>
                          <strong>Browser:</strong>{" "}
                          <code>{e.user_agent.slice(0, 80)}</code>
                        </span>
                      )}
                      <span>
                        <strong>Hash:</strong>{" "}
                        <code>{e.hash.slice(0, 12)}…</code>
                      </span>
                    </div>
                    {(e.before != null || e.after != null) && (
                      <div className="audit__diff">
                        {e.before != null && (
                          <div>
                            <h4>Vorher</h4>
                            <pre>{JSON.stringify(e.before, null, 2)}</pre>
                          </div>
                        )}
                        {e.after != null && (
                          <div>
                            <h4>Nachher</h4>
                            <pre>{JSON.stringify(e.after, null, 2)}</pre>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
