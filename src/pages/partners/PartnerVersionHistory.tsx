/**
 * Sprint 19.C.1 · Versions-Historie eines business_partners.
 *
 * Zeigt alle Snapshots aus business_partners_versions (Migration 0035) +
 * ein Feld-fuer-Feld-Diff zwischen der aktuellen Row und der gewaehlten
 * Version. Kein komplexer Diff-Algorithmus — flache Objekt-Diff.
 */

import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, History } from "lucide-react";
import {
  getBusinessPartner,
  getBusinessPartnerVersions,
} from "../../api/businessPartners";
import type { BusinessPartner } from "../../types/db";
import "../ReportView.css";

const IGNORED_FIELDS: ReadonlySet<keyof BusinessPartner> = new Set([
  "id",
  "created_at",
  "updated_at",
  "created_by",
  "updated_by",
]);

type DiffRow = {
  field: keyof BusinessPartner;
  before: unknown;
  after: unknown;
};

function diffPartners(
  snapshot: BusinessPartner,
  current: BusinessPartner
): DiffRow[] {
  const out: DiffRow[] = [];
  const keys = Object.keys(current) as (keyof BusinessPartner)[];
  for (const k of keys) {
    if (IGNORED_FIELDS.has(k)) continue;
    const a = snapshot[k];
    const b = current[k];
    if (JSON.stringify(a) !== JSON.stringify(b)) {
      out.push({ field: k, before: a, after: b });
    }
  }
  return out;
}

export default function PartnerVersionHistory() {
  const { id } = useParams<{ id: string }>();
  const [selected, setSelected] = useState<string | null>(null);

  const currentQ = useQuery({
    queryKey: ["business_partner", id],
    enabled: !!id,
    queryFn: () => (id ? getBusinessPartner(id) : Promise.resolve(null)),
  });
  const versionsQ = useQuery({
    queryKey: ["business_partner_versions", id],
    enabled: !!id,
    queryFn: () =>
      id ? getBusinessPartnerVersions(id) : Promise.resolve([]),
  });

  const versions = versionsQ.data ?? [];
  const current = currentQ.data ?? null;

  const selectedVersion = useMemo(
    () => versions.find((v) => v.version_id === selected) ?? null,
    [versions, selected]
  );
  const diff =
    selectedVersion && current
      ? diffPartners(selectedVersion.snapshot, current)
      : [];

  if (!id) {
    return <div className="report">Keine Partner-ID.</div>;
  }

  return (
    <div className="report">
      <header className="report__head">
        <Link to={`/partners/${id}`} className="report__back">
          <ArrowLeft size={16} />
          Zurück zum Partner
        </Link>
        <div className="report__head-title">
          <h1>
            <History
              size={22}
              style={{ verticalAlign: "-3px", marginRight: 8 }}
            />
            Versions-Historie
            {current ? ` — ${current.name}` : ""}
          </h1>
          <p>
            Jeder Eintrag ist ein unveränderlicher Snapshot
            (§ 147 AO, 10 J Retention). Auswahl links zeigt das Diff zur
            aktuellen Row rechts.
          </p>
        </div>
      </header>

      {versions.length === 0 ? (
        <section className="card" style={{ padding: 16 }}>
          <p>
            Keine Versionen vorhanden — der Partner wurde noch nicht
            geändert.
          </p>
        </section>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "320px 1fr",
            gap: 12,
          }}
        >
          <section className="card" style={{ padding: 0 }}>
            <ul
              style={{ listStyle: "none", margin: 0, padding: 0 }}
              data-testid="version-list"
            >
              {versions.map((v) => (
                <li key={v.version_id}>
                  <button
                    type="button"
                    className={`shell__nav-item${
                      selected === v.version_id ? " is-active" : ""
                    }`}
                    style={{
                      display: "block",
                      width: "100%",
                      textAlign: "left",
                      padding: "10px 12px",
                      background:
                        selected === v.version_id
                          ? "var(--navy-50, #eef)"
                          : "transparent",
                      border: "none",
                      borderBottom: "1px solid var(--border, #eee)",
                      cursor: "pointer",
                    }}
                    data-testid={`version-btn-${v.version_number}`}
                    onClick={() => setSelected(v.version_id)}
                  >
                    <strong>v{v.version_number}</strong>
                    <div style={{ fontSize: "0.8rem", color: "var(--muted)" }}>
                      gültig bis{" "}
                      {(v.valid_to ?? v.created_at).slice(0, 16).replace("T", " ")}
                    </div>
                    <div
                      style={{
                        fontSize: "0.75rem",
                        color: "var(--muted)",
                        marginTop: 2,
                      }}
                    >
                      Retention bis {v.retention_until}
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          </section>

          <section className="card" style={{ padding: 16 }}>
            {!selectedVersion && (
              <p>
                Links eine Version wählen, um das Diff gegen die aktuelle
                Row zu sehen.
              </p>
            )}
            {selectedVersion && (
              <>
                <h2 style={{ marginTop: 0 }}>
                  Diff: v{selectedVersion.version_number} → aktuell
                </h2>
                {diff.length === 0 ? (
                  <p>
                    Keine Feld-Unterschiede zwischen dieser Version und der
                    aktuellen Row.
                  </p>
                ) : (
                  <table data-testid="diff-table">
                    <thead>
                      <tr>
                        <th>Feld</th>
                        <th>Vorher (Snapshot)</th>
                        <th>Jetzt</th>
                      </tr>
                    </thead>
                    <tbody>
                      {diff.map((d) => (
                        <tr key={d.field as string}>
                          <td className="mono">{d.field as string}</td>
                          <td>{renderValue(d.before)}</td>
                          <td>{renderValue(d.after)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </>
            )}
          </section>
        </div>
      )}
    </div>
  );
}

function renderValue(v: unknown): string {
  if (v == null) return "—";
  if (typeof v === "boolean") return v ? "ja" : "nein";
  if (typeof v === "object") return JSON.stringify(v);
  return String(v);
}
