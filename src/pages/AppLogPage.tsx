import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  AlertTriangle,
  ArrowLeft,
  Bug,
  Eraser,
  Search,
  Terminal,
} from "lucide-react";
import { fetchAppLog, logApp } from "../api/appLog";
import { store } from "../api/store";
import { DEMO_MODE } from "../api/supabase";
import { usePermissions } from "../hooks/usePermissions";
import type { AppLogLevel } from "../types/db";
import "./ReportView.css";
import "./TaxCalc.css";
import "./AppLogPage.css";

const LEVEL_CLASS: Record<AppLogLevel, string> = {
  debug: "is-debug",
  info: "is-info",
  warn: "is-warn",
  error: "is-error",
};

export default function AppLogPage() {
  const perms = usePermissions();
  const [search, setSearch] = useState("");
  const [levelFilter, setLevelFilter] = useState<AppLogLevel | "alle">("alle");
  const logQ = useQuery({
    queryKey: ["app_log"],
    queryFn: fetchAppLog,
    refetchOnMount: "always",
  });

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (logQ.data ?? []).filter((e) => {
      if (levelFilter !== "alle" && e.level !== levelFilter) return false;
      if (!q) return true;
      return (
        e.message.toLowerCase().includes(q) ||
        JSON.stringify(e.context ?? {})
          .toLowerCase()
          .includes(q)
      );
    });
  }, [logQ.data, search, levelFilter]);

  async function writeTestEntry() {
    await logApp("info", "Test-Eintrag aus App-Log-Viewer", {
      feature: "AppLogPage",
      source: "manual",
    });
    logQ.refetch();
    toast.success("Test-Eintrag geschrieben.");
  }

  function clearLocal() {
    if (!DEMO_MODE) {
      toast.error(
        "Löschen ist im Produktiv-Betrieb nur serverseitig (Admin-SQL) möglich."
      );
      return;
    }
    if (!confirm("Lokalen App-Log (nur Browser) leeren?")) return;
    store.clearAppLog();
    logQ.refetch();
    toast.success("Lokaler App-Log geleert.");
  }

  if (!perms.canAdmin) {
    return (
      <div className="report">
        <header className="report__head">
          <Link to="/einstellungen" className="report__back">
            <ArrowLeft size={16} />
            Zurück zu Einstellungen
          </Link>
          <div className="report__head-title">
            <h1>System-Log</h1>
          </div>
        </header>
        <aside className="taxcalc__hint">
          <AlertTriangle size={14} />
          <span>
            Diese Seite ist Admins und Ownern vorbehalten. Der App-Log enthält
            technische Diagnose-Daten, keine Buchungen.
          </span>
        </aside>
      </div>
    );
  }

  return (
    <div className="report applog">
      <header className="report__head">
        <Link to="/einstellungen" className="report__back">
          <ArrowLeft size={16} />
          Zurück zu Einstellungen
        </Link>
        <div className="report__head-title">
          <h1>
            <Terminal
              size={22}
              style={{ verticalAlign: "-3px", marginRight: 8 }}
            />
            System-Log
          </h1>
          <p>
            Technische Ereignisse (Fehler, Diagnose) — <strong>getrennt</strong>{" "}
            vom finanziell relevanten Audit-Log. Keine Hash-Kette, Rotation
            durch Admin möglich.
          </p>
        </div>
      </header>

      <div className="card applog__toolbar">
        <label className="journal__search">
          <Search size={16} />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Suche in Meldung oder Kontext …"
          />
        </label>
        <select
          className="journal__select"
          value={levelFilter}
          onChange={(e) =>
            setLevelFilter(e.target.value as AppLogLevel | "alle")
          }
        >
          <option value="alle">Alle Level</option>
          <option value="debug">Nur Debug</option>
          <option value="info">Nur Info</option>
          <option value="warn">Nur Warnungen</option>
          <option value="error">Nur Fehler</option>
        </select>
        <div style={{ display: "flex", gap: 6 }}>
          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={writeTestEntry}
          >
            <Bug size={14} /> Test-Eintrag
          </button>
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={clearLocal}
            title={
              DEMO_MODE
                ? "Lokalen Log leeren"
                : "Nur im Demo-Modus verfügbar — produktiv via SQL"
            }
          >
            <Eraser size={14} /> Leeren
          </button>
        </div>
        <div className="journal__count">
          <strong>{filtered.length}</strong> von{" "}
          {(logQ.data ?? []).length} Einträgen
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="card applog__empty">
          <p>Keine Einträge — System-Log ist leer oder stark gefiltert.</p>
        </div>
      ) : (
        <ol className="applog__list">
          {filtered.map((e) => (
            <li
              key={e.id}
              className={`card applog__item ${LEVEL_CLASS[e.level]}`}
            >
              <div className="applog__item-head">
                <span className={`applog__badge ${LEVEL_CLASS[e.level]}`}>
                  {e.level}
                </span>
                <span className="applog__message">{e.message}</span>
                <span className="mono applog__ts">
                  {new Date(e.at).toLocaleString("de-DE")}
                </span>
              </div>
              {e.context && Object.keys(e.context).length > 0 && (
                <pre className="applog__context">
                  {JSON.stringify(e.context, null, 2)}
                </pre>
              )}
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
