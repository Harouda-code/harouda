// Dimensionen-Bericht: Summen pro Kostenstelle und Kostenträger.
//
// Dieser Bericht ist eine reine Leseoperation auf den existierenden
// journal_entries — keine Hash-Kette, keine Festschreibung, keine
// Schema-Änderung. Er aggregiert Soll- und Haben-Salden pro Dimensions-
// Code über einen wählbaren Zeitraum.

import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import Decimal from "decimal.js";
import {
  ArrowLeft,
  Boxes,
  Layers,
  Loader2,
  PiggyBank,
} from "lucide-react";
import { fetchAllEntries } from "../api/dashboard";
import { fetchCostCenters } from "../api/costCenters";
import { fetchCostCarriers } from "../api/costCarriers";
import { useYear } from "../contexts/YearContext";
import type { JournalEntry } from "../types/db";

type Dimension = "kostenstelle" | "kostentraeger";

type DimensionRow = {
  code: string;
  name: string | null;
  entryCount: number;
  sumSoll: Decimal;
  sumHaben: Decimal;
  saldo: Decimal; // Soll - Haben
  isActive: boolean | null;
};

function formatEuro(d: Decimal): string {
  return d.toFixed(2).replace(".", ",") + " €";
}

function isGebuchtActive(e: JournalEntry): boolean {
  return e.status === "gebucht" && e.storno_status !== "reversed";
}

export default function DimensionReportPage() {
  const { selectedYear } = useYear();
  const [dimension, setDimension] = useState<Dimension>("kostenstelle");
  const [von, setVon] = useState(`${selectedYear}-01-01`);
  const [bis, setBis] = useState(`${selectedYear}-12-31`);
  const [includeEmpty, setIncludeEmpty] = useState(false);

  const entriesQ = useQuery({
    queryKey: ["journal_entries", "all"],
    queryFn: fetchAllEntries,
  });
  const kstQ = useQuery({
    queryKey: ["cost_centers"],
    queryFn: fetchCostCenters,
  });
  const ktrQ = useQuery({
    queryKey: ["cost_carriers"],
    queryFn: fetchCostCarriers,
  });

  const loading = entriesQ.isLoading || kstQ.isLoading || ktrQ.isLoading;

  const aggregated: DimensionRow[] = useMemo(() => {
    if (!entriesQ.data) return [];

    const stammByCode = new Map<string, { name: string; isActive: boolean }>();
    if (dimension === "kostenstelle") {
      for (const c of kstQ.data ?? []) {
        stammByCode.set(c.code, { name: c.name, isActive: c.is_active });
      }
    } else {
      for (const c of ktrQ.data ?? []) {
        stammByCode.set(c.code, { name: c.name, isActive: c.is_active });
      }
    }

    const byCode = new Map<string, DimensionRow>();
    // Leere-Dimension-Bucket, damit Buchungen ohne KST/KTR sichtbar bleiben.
    const EMPTY_KEY = "__OHNE__";

    for (const e of entriesQ.data) {
      if (!isGebuchtActive(e)) continue;
      if (e.datum < von || e.datum > bis) continue;

      const rawCode =
        dimension === "kostenstelle" ? e.kostenstelle : e.kostentraeger;
      const code = rawCode ?? EMPTY_KEY;

      if (!includeEmpty && code === EMPTY_KEY) continue;

      const stamm = stammByCode.get(code);
      let row = byCode.get(code);
      if (!row) {
        row = {
          code,
          name:
            code === EMPTY_KEY ? "(ohne Dimension)" : (stamm?.name ?? null),
          entryCount: 0,
          sumSoll: new Decimal(0),
          sumHaben: new Decimal(0),
          saldo: new Decimal(0),
          isActive: code === EMPTY_KEY ? null : (stamm?.isActive ?? null),
        };
        byCode.set(code, row);
      }

      const betrag = new Decimal(Number.isFinite(e.betrag) ? e.betrag : 0);
      row.entryCount += 1;
      row.sumSoll = row.sumSoll.plus(betrag);
      row.sumHaben = row.sumHaben.plus(betrag);
      // Saldo für eine Dimension entspricht hier 0, weil jede Buchung beide
      // Seiten gleichzeitig berührt. Wir zeigen stattdessen Umsatzvolumen
      // (sumSoll = sumHaben) — der Saldo bleibt nur als Feld erhalten.
      row.saldo = row.sumSoll.minus(row.sumHaben);
    }

    const list = Array.from(byCode.values());
    list.sort((a, b) => {
      if (a.code === EMPTY_KEY) return 1;
      if (b.code === EMPTY_KEY) return -1;
      return a.code.localeCompare(b.code);
    });
    return list;
  }, [entriesQ.data, dimension, kstQ.data, ktrQ.data, von, bis, includeEmpty]);

  const totalVolumen = useMemo(
    () => aggregated.reduce((acc, r) => acc.plus(r.sumSoll), new Decimal(0)),
    [aggregated]
  );
  const totalEntries = useMemo(
    () => aggregated.reduce((acc, r) => acc + r.entryCount, 0),
    [aggregated]
  );

  return (
    <div className="container" style={{ padding: "24px 16px" }}>
      <Link
        to="/berichte"
        className="report__back"
        style={{ display: "inline-flex", gap: 6, alignItems: "center" }}
      >
        <ArrowLeft size={16} /> Zurück zu Berichte
      </Link>
      <h1 style={{ marginTop: 12 }}>Dimensionen-Bericht (KST / KTR)</h1>
      <p style={{ color: "var(--muted)" }}>
        Aggregiert Umsatzvolumen pro Kostenstelle oder Kostenträger über
        den gewählten Zeitraum. Berücksichtigt ausschließlich gebuchte,
        nicht stornierte Journal-Einträge. Buchungen ohne Dimension werden
        auf Wunsch als <em>„ohne Dimension"</em>-Zeile separat ausgewiesen.
      </p>

      <section className="card" style={{ padding: 20, marginTop: 20, marginBottom: 20 }}>
        <h2 style={{ marginTop: 0 }}>Filter</h2>
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap", alignItems: "center" }}>
          <fieldset style={{ border: 0, padding: 0, display: "flex", gap: 12 }}>
            <label style={{ display: "flex", gap: 6, alignItems: "center", cursor: "pointer" }}>
              <input
                type="radio"
                name="dimension"
                value="kostenstelle"
                checked={dimension === "kostenstelle"}
                onChange={() => setDimension("kostenstelle")}
              />
              <Layers size={14} /> Kostenstelle
            </label>
            <label style={{ display: "flex", gap: 6, alignItems: "center", cursor: "pointer" }}>
              <input
                type="radio"
                name="dimension"
                value="kostentraeger"
                checked={dimension === "kostentraeger"}
                onChange={() => setDimension("kostentraeger")}
              />
              <Boxes size={14} /> Kostenträger
            </label>
          </fieldset>

          <label style={{ display: "flex", gap: 6, alignItems: "center" }}>
            <span>Von</span>
            <input
              type="date"
              value={von}
              onChange={(e) => setVon(e.target.value)}
            />
          </label>
          <label style={{ display: "flex", gap: 6, alignItems: "center" }}>
            <span>Bis</span>
            <input
              type="date"
              value={bis}
              onChange={(e) => setBis(e.target.value)}
            />
          </label>
          <label style={{ display: "flex", gap: 6, alignItems: "center" }}>
            <input
              type="checkbox"
              checked={includeEmpty}
              onChange={(e) => setIncludeEmpty(e.target.checked)}
            />
            Buchungen ohne {dimension === "kostenstelle" ? "Kostenstelle" : "Kostenträger"} einbeziehen
          </label>
        </div>
      </section>

      {loading ? (
        <p style={{ marginTop: 20 }}>
          <Loader2 size={16} className="spin" /> Lade …
        </p>
      ) : (
        <section className="card" style={{ padding: 20 }}>
          <h2 style={{ marginTop: 0 }}>
            <PiggyBank size={18} style={{ verticalAlign: "-3px", marginRight: 6 }} />
            Ergebnis{" "}
            <small style={{ color: "var(--muted)", fontWeight: 400 }}>
              ({aggregated.length} {dimension === "kostenstelle" ? "Kostenstellen" : "Kostenträger"},{" "}
              {totalEntries} Buchungen, Gesamtvolumen {formatEuro(totalVolumen)})
            </small>
          </h2>
          {aggregated.length === 0 ? (
            <p style={{ color: "var(--muted)" }}>
              Keine Buchungen mit{" "}
              {dimension === "kostenstelle" ? "Kostenstelle" : "Kostenträger"} im
              gewählten Zeitraum. Aktivieren Sie „Buchungen ohne …
              einbeziehen", um Buchungen ohne Dimension zu sehen.
            </p>
          ) : (
            <table className="report__table" style={{ width: "100%" }}>
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Bezeichnung</th>
                  <th style={{ textAlign: "right" }}>Buchungen</th>
                  <th style={{ textAlign: "right" }}>Umsatzvolumen</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {aggregated.map((r) => (
                  <tr key={r.code}>
                    <td className="mono">{r.code === "__OHNE__" ? "—" : r.code}</td>
                    <td>{r.name ?? ""}</td>
                    <td style={{ textAlign: "right" }}>{r.entryCount}</td>
                    <td style={{ textAlign: "right" }}>
                      {formatEuro(r.sumSoll)}
                    </td>
                    <td>
                      {r.isActive === true ? (
                        <span style={{ color: "#1f8434" }}>aktiv</span>
                      ) : r.isActive === false ? (
                        <span style={{ color: "#a62020" }}>inaktiv (Stamm gelöscht/deaktiviert)</span>
                      ) : r.code === "__OHNE__" ? (
                        <span style={{ color: "var(--muted)" }}>—</span>
                      ) : (
                        <span style={{ color: "#a86200" }}>kein Stamm</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      )}
    </div>
  );
}
