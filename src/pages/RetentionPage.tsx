import { useMemo } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Archive, ArrowLeft, Clock, Loader2 } from "lucide-react";
import { fetchAllEntries } from "../api/dashboard";
import { fetchDocuments } from "../api/documents";
import {
  retentionStatus,
  RETENTION_RULES,
  ruleFor,
  type RetentionCategory,
  type RetentionStatus,
} from "../data/retention";
import "./RetentionPage.css";

type Item = {
  id: string;
  title: string;
  subtitle: string;
  category: RetentionCategory;
  createdAt: string;
};

const STATUS_LABEL: Record<RetentionStatus, string> = {
  expired: "Frist abgelaufen",
  "due-30d": "< 30 Tage",
  "due-90d": "< 90 Tage",
  "due-1y": "< 1 Jahr",
  ok: "OK",
};

const STATUS_CLASS: Record<RetentionStatus, string> = {
  expired: "is-expired",
  "due-30d": "is-red",
  "due-90d": "is-amber",
  "due-1y": "is-yellow",
  ok: "is-ok",
};

export default function RetentionPage() {
  const entriesQ = useQuery({
    queryKey: ["journal_entries", "all"],
    queryFn: fetchAllEntries,
  });
  // Retention-Sicht ist Kanzlei-weit (alle Aufbewahrungsfristen). clientId=null.
  const docsQ = useQuery({
    queryKey: ["documents", "all", null],
    queryFn: () => fetchDocuments(null),
  });

  const items: Item[] = useMemo(() => {
    const list: Item[] = [];
    for (const e of entriesQ.data ?? []) {
      list.push({
        id: `entry_${e.id}`,
        title: `Buchung ${e.beleg_nr}`,
        subtitle: e.beschreibung,
        category: "buchungsbeleg",
        createdAt: e.datum,
      });
    }
    for (const d of docsQ.data ?? []) {
      list.push({
        id: `doc_${d.id}`,
        title: d.file_name,
        subtitle: `Beleg · ${d.mime_type}`,
        category: "buchungsbeleg",
        createdAt: d.uploaded_at,
      });
    }
    return list;
  }, [entriesQ.data, docsQ.data]);

  const withStatus = useMemo(
    () =>
      items
        .map((i) => ({
          ...i,
          ...retentionStatus(i.createdAt, i.category),
        }))
        .sort((a, b) => a.ends.getTime() - b.ends.getTime()),
    [items]
  );

  const buckets = useMemo(() => {
    const b: Record<RetentionStatus, typeof withStatus> = {
      expired: [],
      "due-30d": [],
      "due-90d": [],
      "due-1y": [],
      ok: [],
    };
    for (const it of withStatus) b[it.status].push(it);
    return b;
  }, [withStatus]);

  const isLoading = entriesQ.isLoading || docsQ.isLoading;

  return (
    <div className="retention">
      <header className="retention__head">
        <Link to="/einstellungen" className="report__back">
          <ArrowLeft size={16} />
          Zurück zu Einstellungen
        </Link>
        <h1>
          <Archive size={22} style={{ verticalAlign: "-3px", marginRight: 8 }} />
          Aufbewahrungsfristen
        </h1>
        <p>
          Nach § 147 AO. Diese Ansicht zeigt, wann Fristen für vorhandene
          Buchungen und Belege ablaufen. Sie löscht nichts automatisch.
        </p>
      </header>

      <section className="card retention__rules">
        <h2>Fristen im Überblick (Stand 2025)</h2>
        <table className="report__table">
          <thead>
            <tr>
              <th>Kategorie</th>
              <th>Frist</th>
              <th>Grundlage</th>
              <th>Beispiele</th>
            </tr>
          </thead>
          <tbody>
            {RETENTION_RULES.map((r) => (
              <tr key={r.category}>
                <td>
                  <strong>{r.label}</strong>
                </td>
                <td className="mono">{r.years} Jahre</td>
                <td>{r.legalBasis}</td>
                <td style={{ color: "var(--muted)", fontSize: "0.86rem" }}>
                  {r.examples}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {isLoading ? (
        <div className="journal__state">
          <Loader2 className="journal__state-spin" size={28} />
          <p>Lade Daten …</p>
        </div>
      ) : (
        <>
          {(["expired", "due-30d", "due-90d", "due-1y", "ok"] as RetentionStatus[]).map(
            (s) => {
              const list = buckets[s];
              if (list.length === 0) return null;
              return (
                <section key={s} className={`card retention__group ${STATUS_CLASS[s]}`}>
                  <header>
                    <h2>
                      <Clock size={16} style={{ marginRight: 6, verticalAlign: "-2px" }} />
                      {STATUS_LABEL[s]}
                    </h2>
                    <span className="retention__count">{list.length}</span>
                  </header>
                  <table className="report__table">
                    <thead>
                      <tr>
                        <th>Objekt</th>
                        <th>Kategorie</th>
                        <th>Entstanden</th>
                        <th>Frist endet</th>
                        <th className="is-num">Tage</th>
                      </tr>
                    </thead>
                    <tbody>
                      {list.slice(0, 200).map((it) => (
                        <tr key={it.id}>
                          <td>
                            <strong>{it.title}</strong>
                            <div
                              style={{
                                fontSize: "0.82rem",
                                color: "var(--muted)",
                              }}
                            >
                              {it.subtitle}
                            </div>
                          </td>
                          <td>{ruleFor(it.category).label}</td>
                          <td className="mono">
                            {new Date(it.createdAt).toLocaleDateString("de-DE")}
                          </td>
                          <td className="mono">
                            {it.ends.toLocaleDateString("de-DE")}
                          </td>
                          <td className="is-num mono">
                            {it.status === "expired"
                              ? `${Math.abs(it.daysLeft)} überfällig`
                              : it.daysLeft}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {list.length > 200 && (
                    <p
                      style={{
                        padding: "8px 12px 0",
                        color: "var(--muted)",
                        fontSize: "0.82rem",
                      }}
                    >
                      … und {list.length - 200} weitere.
                    </p>
                  )}
                </section>
              );
            }
          )}
        </>
      )}
    </div>
  );
}
