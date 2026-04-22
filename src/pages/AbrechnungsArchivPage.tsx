import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  Lock,
  LockOpen,
  Search,
  ShieldCheck,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import {
  FestschreibungsService,
  InMemoryFestschreibungsStore,
  type LockedRecord,
} from "../domain/gobd/FestschreibungsService";
import { LohnabrechnungsEngine } from "../domain/lohn/LohnabrechnungsEngine";
import type {
  Arbeitnehmer,
  Bundesland,
  LohnArt,
  Lohnbuchung,
  Steuerklasse,
} from "../domain/lohn/types";
import { Money } from "../lib/money/Money";
import { downloadText } from "../utils/exporters";
import "./ReportView.css";

function fmt(s: string | Money): string {
  const m = typeof s === "string" ? new Money(s) : s;
  return m.toEuroFormat();
}

type AbrechnungStatus = "ENTWURF" | "FESTGESCHRIEBEN";

type ArchivRow = {
  id: string;
  record: LockedRecord;
  arbeitnehmerName: string;
  integrityValid: boolean | null; // null = noch nicht verifiziert
};

const DEMO_LA: LohnArt = {
  id: "la-gehalt",
  bezeichnung: "Gehalt",
  typ: "LAUFENDER_BEZUG",
  steuerpflichtig: true,
  svpflichtig: true,
  lst_meldung_feld: "3",
};

function makeAn(
  id: string,
  name: string,
  vorname: string,
  stKl: Steuerklasse = 1
): Arbeitnehmer {
  return {
    id,
    mandant_id: "demo",
    personalNr: id.slice(-3),
    name,
    vorname,
    geburtsdatum: "1990-01-01",
    sv_nummer: "12345678901A",
    steuer_id: "12345678901",
    steuerklasse: stKl,
    kinderfreibetraege: 0,
    kirchensteuerpflichtig: false,
    konfession: "NONE",
    bundesland: "NW" as Bundesland,
    kv_pflicht: true,
    kv_beitragsart: "GESETZLICH",
    kv_zusatzbeitrag: "2.5",
    rv_pflicht: true,
    av_pflicht: true,
    pv_pflicht: true,
    pv_kinderlos_zuschlag: false,
    pv_anzahl_kinder: 0,
    beschaeftigungsart: "VOLLZEIT",
    betriebsnummer: "12345678",
    eintrittsdatum: "2020-01-01",
  };
}

function seedDemoStore(): {
  store: InMemoryFestschreibungsStore;
  anMap: Map<string, Arbeitnehmer>;
} {
  const store = new InMemoryFestschreibungsStore();
  const engine = new LohnabrechnungsEngine();
  const anMap = new Map<string, Arbeitnehmer>();

  const demoData = [
    { id: "an-1", name: "Mustermann", vn: "Max", brutto: "3000", stkl: 1 as Steuerklasse },
    { id: "an-2", name: "Musterfrau", vn: "Anna", brutto: "4500", stkl: 3 as Steuerklasse },
    { id: "an-3", name: "Schmidt", vn: "Peter", brutto: "2800", stkl: 1 as Steuerklasse },
  ];

  for (const d of demoData) {
    const an = makeAn(d.id, d.name, d.vn, d.stkl);
    anMap.set(d.id, an);
    for (const monat of ["2025-01", "2025-02", "2025-03"]) {
      const buchung: Lohnbuchung = {
        id: `b-${d.id}-${monat}`,
        arbeitnehmer_id: an.id,
        abrechnungsmonat: monat,
        lohnart_id: DEMO_LA.id,
        betrag: new Money(d.brutto),
        buchungsdatum: `${monat}-15`,
      };
      const abr = engine.berechneAbrechnung({
        arbeitnehmer: an,
        lohnarten: new Map([[DEMO_LA.id, DEMO_LA]]),
        buchungen: [buchung],
        abrechnungsmonat: monat,
      });
      store.seed(`${d.id}-${monat}`, abr);
    }
  }
  return { store, anMap };
}

export default function AbrechnungsArchivPage() {
  const [{ store, anMap }] = useState(() => seedDemoStore());
  const [service] = useState(() => new FestschreibungsService(store));
  const [rows, setRows] = useState<ArchivRow[]>([]);
  const [filterStatus, setFilterStatus] = useState<AbrechnungStatus | "ALLE">(
    "ALLE"
  );
  const [filterMonat, setFilterMonat] = useState<string>("");
  const [suche, setSuche] = useState("");
  const [busy, setBusy] = useState<string | null>(null);

  async function reload() {
    // In-Memory store gibt es nur über die seeded IDs
    const out: ArchivRow[] = [];
    const ids = Array.from(anMap.keys());
    const monate = ["2025-01", "2025-02", "2025-03"];
    for (const anId of ids) {
      for (const monat of monate) {
        const id = `${anId}-${monat}`;
        const rec = await store.get(id);
        if (!rec) continue;
        const an = anMap.get(anId)!;
        out.push({
          id,
          record: rec,
          arbeitnehmerName: `${an.vorname} ${an.name}`,
          integrityValid: null,
        });
      }
    }
    out.sort((a, b) =>
      a.record.abrechnung.abrechnungsmonat.localeCompare(
        b.record.abrechnung.abrechnungsmonat
      )
    );
    setRows(out);
  }

  useEffect(() => {
    void reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      if (filterStatus === "ENTWURF" && r.record.locked) return false;
      if (filterStatus === "FESTGESCHRIEBEN" && !r.record.locked) return false;
      if (filterMonat && r.record.abrechnung.abrechnungsmonat !== filterMonat)
        return false;
      if (
        suche.trim() &&
        !r.arbeitnehmerName.toLowerCase().includes(suche.toLowerCase())
      )
        return false;
      return true;
    });
  }, [rows, filterStatus, filterMonat, suche]);

  const stats = useMemo(() => {
    let totalBrutto = Money.zero();
    let totalNetto = Money.zero();
    let lockedCount = 0;
    for (const r of filtered) {
      totalBrutto = totalBrutto.plus(r.record.abrechnung.gesamtBrutto);
      totalNetto = totalNetto.plus(r.record.abrechnung.auszahlungsbetrag);
      if (r.record.locked) lockedCount++;
    }
    return {
      count: filtered.length,
      totalBrutto: totalBrutto.toFixed2(),
      totalNetto: totalNetto.toFixed2(),
      festschreibungsQuote:
        filtered.length === 0
          ? 0
          : Math.round((lockedCount / filtered.length) * 100),
    };
  }, [filtered]);

  async function handleLock(rowId: string) {
    try {
      setBusy(rowId);
      await service.lockAbrechnung(rowId, "demo-user", "Monatsabschluss");
      toast.success("Abrechnung festgeschrieben.");
      await reload();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(null);
    }
  }

  async function handleUnlock(rowId: string) {
    const j = prompt("Begründung (GoBD Rz. 66):");
    if (!j || !j.trim()) return;
    try {
      setBusy(rowId);
      await service.unlock(rowId, "demo-user", j);
      toast.info("Abrechnung entsperrt — Audit-Eintrag erstellt.");
      await reload();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(null);
    }
  }

  async function handleVerify(rowId: string) {
    try {
      setBusy(rowId);
      const check = await service.verifyLockIntegrity(rowId);
      setRows((prev) =>
        prev.map((r) =>
          r.id === rowId ? { ...r, integrityValid: check.valid } : r
        )
      );
      if (check.valid) {
        toast.success("Hash-Integrität: OK");
      } else {
        toast.error(check.reason ?? "Integritätsprüfung fehlgeschlagen");
      }
    } finally {
      setBusy(null);
    }
  }

  function handleExportJson(row: ArchivRow) {
    const payload = {
      id: row.id,
      arbeitnehmer: row.arbeitnehmerName,
      record: {
        abrechnung: serializeAbr(row.record.abrechnung),
        locked: row.record.locked,
        locked_at: row.record.locked_at,
        lock_hash: row.record.lock_hash,
        lock_reason: row.record.lock_reason,
        unlock_history: row.record.unlock_history,
      },
    };
    downloadText(
      JSON.stringify(payload, null, 2),
      `abrechnung_${row.id}.json`,
      "application/json"
    );
    toast.success("JSON exportiert.");
  }

  function handleBulkCsv() {
    const lines = [
      [
        "ID",
        "AN",
        "Monat",
        "Brutto",
        "Netto",
        "Status",
        "Hash",
        "Locked_At",
      ].join(";"),
      ...filtered.map((r) =>
        [
          r.id,
          r.arbeitnehmerName,
          r.record.abrechnung.abrechnungsmonat,
          r.record.abrechnung.gesamtBrutto.toFixed2(),
          r.record.abrechnung.auszahlungsbetrag.toFixed2(),
          r.record.locked ? "FESTGESCHRIEBEN" : "ENTWURF",
          r.record.lock_hash ?? "",
          r.record.locked_at ?? "",
        ].join(";")
      ),
    ].join("\r\n");
    downloadText(
      lines,
      `abrechnungsarchiv_${new Date().toISOString().slice(0, 10)}.csv`,
      "text/csv;charset=utf-8"
    );
    toast.success("CSV exportiert.");
  }

  return (
    <div className="report">
      <header className="report__head no-print">
        <Link to="/lohn" className="report__back">
          <ArrowLeft size={16} /> Zurück zu Lohn
        </Link>
        <div className="report__head-title">
          <h1>Abrechnungs-Archiv (GoBD Rz. 64)</h1>
          <p>
            Historie aller berechneten Lohnabrechnungen · SHA-256-Integritäts-
            prüfung · Festschreibung nach § 146 AO · Entsperren nur mit
            Begründung (GoBD Rz. 66).
          </p>
        </div>
        <div className="period">
          <button className="btn btn-outline" onClick={handleBulkCsv}>
            <FileSpreadsheet size={16} /> CSV
          </button>
        </div>
      </header>

      <aside
        className="ustva__disclaimer no-print"
        style={{
          marginBottom: 12,
          display: "flex",
          gap: 8,
          alignItems: "flex-start",
          background: "rgba(210,120,70,0.08)",
          border: "1px solid rgba(210,120,70,0.3)",
          borderLeft: "4px solid #c76b3f",
          padding: "10px 14px",
          borderRadius: "var(--radius)",
          fontSize: "0.88rem",
        }}
      >
        <AlertTriangle size={16} color="#c76b3f" style={{ flexShrink: 0, marginTop: 2 }} />
        <div>
          <strong>Demo-Modus.</strong> In dieser Iteration werden
          Demo-Abrechnungen in-memory erzeugt (3 AN × 3 Monate). Produktive
          Nutzung erfordert Einbindung des <code>AbrechnungArchivRepo</code>
          (Supabase) und Festschreibung via <code>FestschreibungsService</code>
          mit echtem User-ID (<code>locked_by</code>). Die
          Integritäts-Prüfung verwendet SHA-256 über kanonisches JSON
          (implementation: <code>src/lib/crypto/payrollHash.ts</code>).
        </div>
      </aside>

      {/* Filter + Statistik */}
      <section className="card no-print" style={{ padding: 14, marginBottom: 12 }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            gap: 10,
          }}
        >
          <label>
            <span>
              <Search size={12} /> Suche
            </span>
            <input
              type="text"
              value={suche}
              onChange={(e) => setSuche(e.target.value)}
              placeholder="AN-Name…"
            />
          </label>
          <label>
            <span>Monat</span>
            <input
              type="month"
              value={filterMonat}
              onChange={(e) => setFilterMonat(e.target.value)}
            />
          </label>
          <label>
            <span>Status</span>
            <select
              value={filterStatus}
              onChange={(e) =>
                setFilterStatus(e.target.value as AbrechnungStatus | "ALLE")
              }
            >
              <option value="ALLE">Alle</option>
              <option value="ENTWURF">Entwurf</option>
              <option value="FESTGESCHRIEBEN">Festgeschrieben</option>
            </select>
          </label>
        </div>
      </section>

      {/* Stat-Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: 12,
          marginBottom: 16,
        }}
      >
        <StatCard label="Anzahl" value={String(stats.count)} />
        <StatCard label="Summe Brutto" value={fmt(stats.totalBrutto)} />
        <StatCard label="Summe Netto" value={fmt(stats.totalNetto)} />
        <StatCard
          label="Festschreibungs-Quote"
          value={`${stats.festschreibungsQuote} %`}
        />
      </div>

      {/* Tabelle */}
      <section className="card" style={{ padding: 14 }}>
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            fontSize: "0.85rem",
          }}
        >
          <thead>
            <tr style={{ borderBottom: "2px solid #c3c8d1" }}>
              <th style={{ textAlign: "left", padding: "4px 0" }}>Monat</th>
              <th style={{ textAlign: "left", padding: "4px 0" }}>AN</th>
              <th style={{ textAlign: "right", padding: "4px 8px" }}>Brutto</th>
              <th style={{ textAlign: "right", padding: "4px 8px" }}>Netto</th>
              <th style={{ textAlign: "center", padding: "4px 0" }}>Status</th>
              <th style={{ textAlign: "left", padding: "4px 0" }}>Hash</th>
              <th style={{ textAlign: "left", padding: "4px 0" }}>Aktionen</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => (
              <tr
                key={r.id}
                style={{
                  borderBottom: "1px solid #eef1f6",
                  background: r.record.locked ? "#f3f5f8" : undefined,
                }}
              >
                <td style={{ padding: "4px 0" }}>
                  {r.record.abrechnung.abrechnungsmonat}
                </td>
                <td style={{ padding: "4px 0" }}>{r.arbeitnehmerName}</td>
                <td
                  style={{
                    textAlign: "right",
                    padding: "4px 8px",
                    fontFamily: "var(--font-mono)",
                  }}
                >
                  {fmt(r.record.abrechnung.gesamtBrutto)}
                </td>
                <td
                  style={{
                    textAlign: "right",
                    padding: "4px 8px",
                    fontFamily: "var(--font-mono)",
                  }}
                >
                  {fmt(r.record.abrechnung.auszahlungsbetrag)}
                </td>
                <td style={{ textAlign: "center", padding: "4px 0" }}>
                  {r.record.locked ? (
                    <span
                      title="Festgeschrieben"
                      style={{ color: "#1f7a4d", display: "inline-flex", gap: 4, alignItems: "center" }}
                    >
                      <Lock size={14} /> Fixiert
                    </span>
                  ) : (
                    <span style={{ color: "var(--ink-soft)", display: "inline-flex", gap: 4, alignItems: "center" }}>
                      <LockOpen size={14} /> Entwurf
                    </span>
                  )}
                </td>
                <td
                  style={{
                    padding: "4px 0",
                    fontFamily: "var(--font-mono)",
                    fontSize: "0.72rem",
                    color: "var(--ink-soft)",
                  }}
                >
                  {r.record.lock_hash ? (
                    <span title={r.record.lock_hash}>
                      {r.record.lock_hash.slice(0, 10)}…
                      {r.integrityValid === true && (
                        <CheckCircle2 size={12} color="#1f7a4d" style={{ marginLeft: 4 }} />
                      )}
                      {r.integrityValid === false && (
                        <XCircle size={12} color="#8a2c2c" style={{ marginLeft: 4 }} />
                      )}
                    </span>
                  ) : (
                    "—"
                  )}
                </td>
                <td style={{ padding: "4px 0", display: "flex", gap: 4 }}>
                  {!r.record.locked && (
                    <button
                      className="btn btn-outline btn-sm"
                      onClick={() => handleLock(r.id)}
                      disabled={busy === r.id}
                      title="Festschreiben"
                    >
                      <Lock size={12} />
                    </button>
                  )}
                  {r.record.locked && (
                    <>
                      <button
                        className="btn btn-outline btn-sm"
                        onClick={() => handleVerify(r.id)}
                        disabled={busy === r.id}
                        title="Hash-Integrität prüfen"
                      >
                        <ShieldCheck size={12} />
                      </button>
                      <button
                        className="btn btn-outline btn-sm"
                        onClick={() => handleUnlock(r.id)}
                        disabled={busy === r.id}
                        title="Entsperren (mit Begründung)"
                      >
                        <LockOpen size={12} />
                      </button>
                    </>
                  )}
                  <button
                    className="btn btn-outline btn-sm"
                    onClick={() => handleExportJson(r)}
                    title="JSON-Export"
                  >
                    <Download size={12} />
                  </button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td
                  colSpan={7}
                  style={{
                    padding: 20,
                    textAlign: "center",
                    color: "var(--ink-soft)",
                  }}
                >
                  Keine Abrechnungen im Filter.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="card" style={{ padding: 12 }}>
      <div style={{ fontSize: "0.78rem", color: "var(--ink-soft)" }}>{label}</div>
      <div
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: "1rem",
          fontWeight: 700,
        }}
      >
        {value}
      </div>
    </div>
  );
}

function serializeAbr(ab: import("../domain/lohn/types").Lohnabrechnung) {
  return {
    arbeitnehmer_id: ab.arbeitnehmer_id,
    abrechnungsmonat: ab.abrechnungsmonat,
    gesamtBrutto: ab.gesamtBrutto.toFixed2(),
    auszahlungsbetrag: ab.auszahlungsbetrag.toFixed2(),
    abzuege: {
      lohnsteuer: ab.abzuege.lohnsteuer.toFixed2(),
      solidaritaetszuschlag: ab.abzuege.solidaritaetszuschlag.toFixed2(),
      kirchensteuer: ab.abzuege.kirchensteuer.toFixed2(),
      gesamtAbzuege: ab.abzuege.gesamtAbzuege.toFixed2(),
    },
    arbeitgeberKosten: ab.arbeitgeberKosten.gesamt.toFixed2(),
  };
}
