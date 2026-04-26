import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  ChevronDown,
  ChevronRight,
  FileSpreadsheet,
  Search,
} from "lucide-react";
import { toast } from "sonner";
import { AuditLogRepo } from "../lib/db/auditLogRepo";
import type {
  AuditLogEntry,
  AuditAction,
  AuditEntity,
} from "../types/db";
import { DiffViewer, type DiffOperation } from "../components/audit/DiffViewer";
import { downloadText } from "../utils/exporters";
import "./ReportView.css";

const ACTIONS: AuditAction[] = [
  "create",
  "update",
  "delete",
  "import",
  "export",
  "login",
  "logout",
  "signup",
  "reverse",
  "correct",
  "access",
];

const ENTITIES: AuditEntity[] = [
  "journal_entry",
  "account",
  "client",
  "document",
  "settings",
  "auth",
  "auditor_session",
  "verfahrensdoku",
];

function mapActionToDiffOperation(action: AuditAction): DiffOperation {
  if (action === "create") return "INSERT";
  if (action === "delete") return "DELETE";
  if (action === "update" || action === "correct" || action === "reverse")
    return "UPDATE";
  return "UNKNOWN";
}

function operationIcon(a: AuditAction) {
  if (a === "create") return { color: "#1f7a4d", label: "INSERT" };
  if (a === "update" || a === "correct") return { color: "#2a5ab4", label: "UPDATE" };
  if (a === "delete" || a === "reverse") return { color: "#8a2c2c", label: "DELETE" };
  return { color: "var(--ink-soft)", label: a.toUpperCase() };
}

type Stats = {
  totalOperations: number;
  byEntity: { entity: string; count: number }[];
  byAction: { action: string; count: number }[];
  byActor: { actor: string; count: number }[];
  sensitiveOperations: number;
  dailyTrend: { date: string; count: number }[];
};

export default function AuditTrailPage() {
  const [repo] = useState(() => new AuditLogRepo());
  const [entries, setEntries] = useState<AuditLogEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [stats, setStats] = useState<Stats | null>(null);

  const [filterEntity, setFilterEntity] = useState<AuditEntity | "">("");
  const [filterAction, setFilterAction] = useState<AuditAction | "">("");
  const [filterActor, setFilterActor] = useState("");
  const [filterFrom, setFilterFrom] = useState("");
  const [filterTo, setFilterTo] = useState("");
  const [filterRecordId, setFilterRecordId] = useState("");

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 50;

  async function runQuery() {
    setLoading(true);
    try {
      const r = await repo.query({
        entity: filterEntity || undefined,
        action: filterAction || undefined,
        actor: filterActor || undefined,
        dateFrom: filterFrom ? `${filterFrom}T00:00:00.000Z` : undefined,
        dateTo: filterTo ? `${filterTo}T23:59:59.999Z` : undefined,
        entityId: filterRecordId || undefined,
        limit: PAGE_SIZE,
        offset: page * PAGE_SIZE,
      });
      setEntries(r.entries);
      setTotal(r.total);
    } finally {
      setLoading(false);
    }
  }

  async function loadStats() {
    const s = await repo.getStatistics(30);
    setStats(s);
  }

  useEffect(() => {
    void runQuery();
    void loadStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  function resetFilters() {
    setFilterEntity("");
    setFilterAction("");
    setFilterActor("");
    setFilterFrom("");
    setFilterTo("");
    setFilterRecordId("");
    setPage(0);
    setTimeout(runQuery, 0);
  }

  function handleCsv() {
    const rows = [
      [
        "Zeitstempel",
        "Aktion",
        "Entity",
        "Entity-ID",
        "Actor",
        "Summary",
        "Hash",
      ],
      ...entries.map((e) => [
        e.at,
        e.action,
        e.entity,
        e.entity_id ?? "",
        e.actor ?? "",
        e.summary,
        e.hash,
      ]),
    ];
    const csv = rows
      .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(";"))
      .join("\r\n");
    downloadText(
      csv,
      `audit_trail_${new Date().toISOString().slice(0, 10)}.csv`,
      "text/csv;charset=utf-8"
    );
    toast.success("Audit-CSV exportiert.");
  }

  const grouped = useMemo(() => {
    const byDay = new Map<string, AuditLogEntry[]>();
    for (const e of entries) {
      const day = e.at.slice(0, 10);
      const list = byDay.get(day) ?? [];
      list.push(e);
      byDay.set(day, list);
    }
    return Array.from(byDay.entries()).sort((a, b) => b[0].localeCompare(a[0]));
  }, [entries]);

  return (
    <div className="report">
      <header className="report__head no-print">
        <Link to="/" className="report__back">
          <ArrowLeft size={16} /> Zurück
        </Link>
        <div className="report__head-title">
          <h1>Audit-Trail (GoBD Rz. 153-154)</h1>
          <p>
            Alle Änderungen an relevanten Datensätzen · Hash-verkettete
            Integritätssicherung · filterbar nach Tabelle, Aktion, Benutzer,
            Zeitraum, Datensatz-ID.
          </p>
        </div>
        <div className="period">
          <button className="btn btn-outline" onClick={handleCsv}>
            <FileSpreadsheet size={16} /> CSV
          </button>
        </div>
      </header>

      {/* Statistics */}
      {stats && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            gap: 12,
            marginBottom: 16,
          }}
        >
          <StatCard label="Vorgänge (30 Tage)" value={String(stats.totalOperations)} />
          <StatCard
            label="Häufigste Entity"
            value={stats.byEntity[0]?.entity ?? "—"}
            hint={stats.byEntity[0] ? `${stats.byEntity[0].count}×` : ""}
          />
          <StatCard
            label="Aktivster Benutzer"
            value={stats.byActor[0]?.actor ?? "—"}
            hint={stats.byActor[0] ? `${stats.byActor[0].count}×` : ""}
          />
          <StatCard
            label="Sensible Vorgänge"
            value={String(stats.sensitiveOperations)}
            warn={stats.sensitiveOperations > 10}
          />
        </div>
      )}

      {/* Filter */}
      <section className="card no-print" style={{ padding: 14, marginBottom: 12 }}>
        <h3 style={{ margin: "0 0 10px", fontSize: "0.95rem" }}>Filter</h3>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
            gap: 8,
          }}
        >
          <label>
            <span>Entity</span>
            <select
              value={filterEntity}
              onChange={(e) => setFilterEntity(e.target.value as AuditEntity | "")}
            >
              <option value="">Alle</option>
              {ENTITIES.map((e) => (
                <option key={e}>{e}</option>
              ))}
            </select>
          </label>
          <label>
            <span>Aktion</span>
            <select
              value={filterAction}
              onChange={(e) => setFilterAction(e.target.value as AuditAction | "")}
            >
              <option value="">Alle</option>
              {ACTIONS.map((a) => (
                <option key={a}>{a}</option>
              ))}
            </select>
          </label>
          <label>
            <span>Benutzer (actor)</span>
            <input
              type="text"
              value={filterActor}
              onChange={(e) => setFilterActor(e.target.value)}
              placeholder="email@…"
            />
          </label>
          <label>
            <span>Von</span>
            <input
              type="date"
              value={filterFrom}
              onChange={(e) => setFilterFrom(e.target.value)}
            />
          </label>
          <label>
            <span>Bis</span>
            <input
              type="date"
              value={filterTo}
              onChange={(e) => setFilterTo(e.target.value)}
            />
          </label>
          <label>
            <span>
              <Search size={12} /> Entity-ID
            </span>
            <input
              type="text"
              value={filterRecordId}
              onChange={(e) => setFilterRecordId(e.target.value)}
              placeholder="UUID …"
            />
          </label>
        </div>
        <div style={{ marginTop: 10, display: "flex", gap: 6 }}>
          <button
            className="btn btn-primary btn-sm"
            onClick={() => {
              setPage(0);
              void runQuery();
            }}
          >
            Anwenden
          </button>
          <button className="btn btn-outline btn-sm" onClick={resetFilters}>
            Zurücksetzen
          </button>
        </div>
      </section>

      {/* Results */}
      <section className="card" style={{ padding: 14 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "baseline",
            marginBottom: 8,
          }}
        >
          <h3 style={{ margin: 0, fontSize: "0.95rem" }}>
            {total} Vorgänge{loading ? " (lade …)" : ""}
          </h3>
          <div style={{ fontSize: "0.85rem", color: "var(--ink-soft)" }}>
            Seite {page + 1} von {Math.max(1, Math.ceil(total / PAGE_SIZE))}
          </div>
        </div>
        {grouped.length === 0 ? (
          <div
            style={{
              padding: 20,
              textAlign: "center",
              color: "var(--ink-soft)",
            }}
          >
            Keine Einträge im Filter.
          </div>
        ) : (
          grouped.map(([day, dayEntries]) => (
            <div key={day} style={{ marginBottom: 12 }}>
              <h4
                style={{
                  margin: "8px 0 4px",
                  fontSize: "0.85rem",
                  color: "var(--ink-soft)",
                  borderBottom: "1px solid #eef1f6",
                  paddingBottom: 4,
                }}
              >
                {day}
              </h4>
              <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                {dayEntries.map((e) => {
                  const icon = operationIcon(e.action);
                  const isOpen = expandedId === e.id;
                  return (
                    <li
                      key={e.id}
                      style={{
                        borderLeft: `3px solid ${icon.color}`,
                        padding: "6px 10px",
                        marginBottom: 2,
                        background: isOpen ? "#f7f8fa" : undefined,
                        cursor: "pointer",
                      }}
                      onClick={() => setExpandedId(isOpen ? null : e.id)}
                    >
                      <div
                        style={{
                          display: "flex",
                          gap: 10,
                          fontSize: "0.85rem",
                          alignItems: "center",
                        }}
                      >
                        {isOpen ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                        <span
                          style={{
                            fontFamily: "var(--font-mono)",
                            color: "var(--ink-soft)",
                            minWidth: 60,
                          }}
                        >
                          {e.at.slice(11, 19)}
                        </span>
                        <strong style={{ color: icon.color, minWidth: 80 }}>
                          {icon.label}
                        </strong>
                        <span style={{ minWidth: 140 }}>{e.entity}</span>
                        <span
                          style={{
                            fontFamily: "var(--font-mono)",
                            fontSize: "0.78rem",
                            color: "var(--ink-soft)",
                          }}
                        >
                          {e.entity_id ? e.entity_id.slice(0, 8) : "—"}
                        </span>
                        <span style={{ color: "var(--ink-soft)" }}>{e.actor ?? "—"}</span>
                        <span style={{ flex: 1 }}>{e.summary}</span>
                      </div>
                      {isOpen && (
                        <div style={{ marginTop: 8 }}>
                          <DiffViewer
                            oldData={e.before as Record<string, unknown> | null}
                            newData={e.after as Record<string, unknown> | null}
                            operation={mapActionToDiffOperation(e.action)}
                          />
                          <div
                            style={{
                              marginTop: 6,
                              fontSize: "0.72rem",
                              color: "var(--ink-soft)",
                              fontFamily: "var(--font-mono)",
                            }}
                            title={e.hash}
                          >
                            Hash: {e.hash.slice(0, 16)}… · prev: {e.prev_hash.slice(0, 10)}…
                          </div>
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          ))
        )}
        {total > PAGE_SIZE && (
          <div style={{ marginTop: 10, display: "flex", gap: 6, justifyContent: "center" }}>
            <button
              className="btn btn-outline btn-sm"
              disabled={page === 0}
              onClick={() => setPage(page - 1)}
            >
              Zurück
            </button>
            <button
              className="btn btn-outline btn-sm"
              disabled={(page + 1) * PAGE_SIZE >= total}
              onClick={() => setPage(page + 1)}
            >
              Weiter
            </button>
          </div>
        )}
      </section>
    </div>
  );
}

function StatCard({
  label,
  value,
  hint,
  warn,
}: {
  label: string;
  value: string;
  hint?: string;
  warn?: boolean;
}) {
  return (
    <div
      className="card"
      style={{
        padding: 12,
        borderLeft: warn ? "4px solid #8a2c2c" : undefined,
      }}
    >
      <div style={{ fontSize: "0.78rem", color: "var(--ink-soft)" }}>{label}</div>
      <div
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: "1rem",
          fontWeight: 700,
          color: warn ? "#8a2c2c" : undefined,
        }}
      >
        {value}
        {hint && (
          <span style={{ marginLeft: 6, fontSize: "0.85rem", color: "var(--ink-soft)" }}>
            {hint}
          </span>
        )}
      </div>
    </div>
  );
}
