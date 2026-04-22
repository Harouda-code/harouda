import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Activity,
  AlertCircle,
  ArrowLeft,
  Check,
  Database,
  Loader2,
  Server,
  Timer,
} from "lucide-react";
import { DEMO_MODE, supabase } from "../api/supabase";
import { useCompany } from "../contexts/CompanyContext";
import { useUser } from "../contexts/UserContext";
import { usePermissions } from "../hooks/usePermissions";
import { verifyAuditChain, type VerifyResult } from "../api/audit";
import "./ReportView.css";
import "./TaxCalc.css";
import "./SystemStatusPage.css";

type PingResult = {
  ok: boolean;
  latencyMs: number | null;
  message: string;
};

type CountResult = {
  accounts: number | null;
  clients: number | null;
  entries: number | null;
  auditEntries: number | null;
};

export default function SystemStatusPage() {
  const perms = usePermissions();
  const { user, session, sessionExpiresInSec, idleTimeoutMinutes } = useUser();
  const { activeCompanyId, memberships } = useCompany();

  const [ping, setPing] = useState<PingResult | null>(null);
  const [counts, setCounts] = useState<CountResult>({
    accounts: null,
    clients: null,
    entries: null,
    auditEntries: null,
  });
  const [chain, setChain] = useState<VerifyResult | null>(null);
  const [busy, setBusy] = useState(false);

  const doPing = useCallback(async (): Promise<PingResult> => {
    if (DEMO_MODE) {
      return {
        ok: true,
        latencyMs: 0,
        message: "Demo-Modus — keine Netzwerkanfrage.",
      };
    }
    const t0 = performance.now();
    try {
      const { error } = await supabase
        .from("health_check")
        .select("server_time")
        .limit(1);
      const dt = Math.round(performance.now() - t0);
      if (error) {
        // Fallback auf companies-Tabelle, falls die View (Migration 0008) noch
        // nicht eingespielt wurde.
        const { error: e2 } = await supabase
          .from("companies")
          .select("id")
          .limit(1);
        if (e2) return { ok: false, latencyMs: null, message: e2.message };
        return {
          ok: true,
          latencyMs: Math.round(performance.now() - t0),
          message: "Fallback-Ping (companies) — health_check-View fehlt noch.",
        };
      }
      return { ok: true, latencyMs: dt, message: "OK" };
    } catch (err) {
      return {
        ok: false,
        latencyMs: null,
        message: (err as Error).message,
      };
    }
  }, []);

  const doCounts = useCallback(async (): Promise<CountResult> => {
    if (DEMO_MODE || !activeCompanyId) {
      return {
        accounts: null,
        clients: null,
        entries: null,
        auditEntries: null,
      };
    }
    async function count(table: string): Promise<number | null> {
      const { count, error } = await supabase
        .from(table)
        .select("id", { count: "exact", head: true })
        .eq("company_id", activeCompanyId);
      if (error) return null;
      return count ?? null;
    }
    const [accounts, clients, entries, auditEntries] = await Promise.all([
      count("accounts"),
      count("clients"),
      count("journal_entries"),
      count("audit_log"),
    ]);
    return { accounts, clients, entries, auditEntries };
  }, [activeCompanyId]);

  const runChecks = useCallback(async () => {
    setBusy(true);
    try {
      const [p, c, r] = await Promise.all([
        doPing(),
        doCounts(),
        verifyAuditChain(),
      ]);
      setPing(p);
      setCounts(c);
      setChain(r);
    } finally {
      setBusy(false);
    }
  }, [doPing, doCounts]);

  useEffect(() => {
    void runChecks();
  }, [runChecks]);

  if (!perms.canAdmin) {
    return (
      <div className="report">
        <header className="report__head">
          <Link to="/einstellungen" className="report__back">
            <ArrowLeft size={16} />
            Zurück zu Einstellungen
          </Link>
          <div className="report__head-title">
            <h1>System-Status</h1>
          </div>
        </header>
        <aside className="taxcalc__hint">
          <AlertCircle size={14} />
          <span>
            Diese Seite ist Admins und Ownern vorbehalten. Ihre Rolle:{" "}
            <strong>{perms.role ?? "keine"}</strong>.
          </span>
        </aside>
      </div>
    );
  }

  const activeCompany = memberships.find(
    (m) => m.companyId === activeCompanyId
  );

  return (
    <div className="report sysstatus">
      <header className="report__head">
        <Link to="/einstellungen" className="report__back">
          <ArrowLeft size={16} />
          Zurück zu Einstellungen
        </Link>
        <div className="report__head-title">
          <h1>
            <Activity
              size={22}
              style={{ verticalAlign: "-3px", marginRight: 8 }}
            />
            System-Status
          </h1>
          <p>
            Live-Checks gegen Supabase, Zählung der Haupttabellen und
            Integritätsprüfung des Audit-Logs.
          </p>
        </div>
        <div className="period">
          <button
            type="button"
            className="btn btn-primary"
            onClick={runChecks}
            disabled={busy}
          >
            {busy ? (
              <>
                <Loader2 size={16} className="login__spinner" />
                Prüfe …
              </>
            ) : (
              "Alle Checks erneut ausführen"
            )}
          </button>
        </div>
      </header>

      <aside className="taxcalc__hint">
        <Server size={14} />
        <span>
          <strong>Scope-Hinweis:</strong> Diese Seite prüft, was aus dem Browser
          prüfbar ist. Tarif-Entscheidungen (PITR, Read Replicas),
          Backup-Konfiguration und Supavisor-Pooling gehören in das
          Supabase-Dashboard. Siehe Migration <code>0008_scaling_readiness.sql</code>.
        </span>
      </aside>

      <section className="sysstatus__grid">
        <StatusCard
          icon={<Server size={16} />}
          title="Supabase API"
          ok={ping?.ok ?? null}
          main={
            ping
              ? ping.latencyMs !== null
                ? `${ping.latencyMs} ms`
                : "Fehler"
              : "Läuft …"
          }
          sub={ping?.message ?? ""}
        />
        <StatusCard
          icon={<Timer size={16} />}
          title="Sitzung"
          ok={!!session}
          main={
            sessionExpiresInSec !== null
              ? `${Math.floor(sessionExpiresInSec / 60)} min verbleibend`
              : "aktiv"
          }
          sub={`Auto-Logout nach ${idleTimeoutMinutes} min Inaktivität`}
        />
        <StatusCard
          icon={<Database size={16} />}
          title="Datenbestand"
          ok={counts.entries !== null || DEMO_MODE}
          main={
            counts.entries !== null
              ? `${counts.entries} Buchungen`
              : DEMO_MODE
                ? "Demo (lokal)"
                : "—"
          }
          sub={
            counts.accounts !== null
              ? `${counts.accounts} Konten · ${counts.clients ?? 0} Mandanten · ${
                  counts.auditEntries ?? 0
                } Audit-Zeilen`
              : "Zählt live gegen company_id"
          }
        />
        <StatusCard
          icon={<Check size={16} />}
          title="Audit-Kette"
          ok={chain ? chain.ok : null}
          main={
            chain
              ? chain.ok
                ? `${chain.total} Einträge · intakt`
                : `bricht bei #${(chain.firstBreakAt ?? 0) + 1}`
              : "Prüfung läuft …"
          }
          sub={chain?.message ?? "SHA-256-Rekonstruktion vom Genesis"}
        />
      </section>

      <section className="card sysstatus__context">
        <h2>Kontext</h2>
        <dl>
          <div>
            <dt>Betriebsmodus</dt>
            <dd>{DEMO_MODE ? "Demo (localStorage)" : "Produktiv (Supabase)"}</dd>
          </div>
          <div>
            <dt>Aktive Firma</dt>
            <dd>
              {activeCompany?.companyName ?? "—"}{" "}
              <code>{activeCompanyId ?? "—"}</code>
            </dd>
          </div>
          <div>
            <dt>Nutzer:in</dt>
            <dd>
              {user?.email ?? "—"} · Rolle: <strong>{perms.role ?? "—"}</strong>
            </dd>
          </div>
          <div>
            <dt>Client</dt>
            <dd>
              <code>
                {typeof navigator !== "undefined"
                  ? navigator.userAgent.slice(0, 100)
                  : "—"}
              </code>
            </dd>
          </div>
        </dl>
      </section>

      <section className="card sysstatus__ops">
        <h2>Dashboard-Einstellungen (manuell)</h2>
        <ul>
          <li>
            <strong>Pooling:</strong> Supavisor Transaction-Mode auf Port 6543
            für Schreib-intensive Workloads.
          </li>
          <li>
            <strong>PITR:</strong> ab Pro-Tarif. Für Kanzleien mit
            Produktivdaten dringend aktivieren.
          </li>
          <li>
            <strong>Backup:</strong> Täglicher Snapshot automatisch; JSON-Backup
            zusätzlich über Einstellungen → Datenhaltung.
          </li>
          <li>
            <strong>Failover:</strong> von Supabase pro Region bereitgestellt.
            Read Replicas nur ab Enterprise.
          </li>
          <li>
            <strong>Partitionierung:</strong> journal_entries nach company_id
            erst ab ~10 Mio. Zeilen pro Tabelle sinnvoll.
          </li>
        </ul>
      </section>
    </div>
  );
}

function StatusCard({
  icon,
  title,
  ok,
  main,
  sub,
}: {
  icon: React.ReactNode;
  title: string;
  ok: boolean | null;
  main: string;
  sub: string;
}) {
  const state =
    ok === null ? "is-loading" : ok ? "is-ok" : "is-bad";
  return (
    <div className={`card sysstatus__card ${state}`}>
      <div className="sysstatus__card-head">
        {icon}
        <span>{title}</span>
      </div>
      <div className="sysstatus__card-main">{main}</div>
      <div className="sysstatus__card-sub">{sub}</div>
    </div>
  );
}
