import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  AlertCircle,
  ArrowRight,
  FileSpreadsheet,
  FileText,
  Info,
  Loader2,
  Search,
  Wallet,
} from "lucide-react";
import { toast } from "sonner";
import { fetchAccounts } from "../api/accounts";
import { fetchAllEntries } from "../api/dashboard";
import {
  summarizeOpenItems,
  type AgingBucket,
  type OpenItem,
  type OposSummary,
} from "../api/opos";
import { useMandant } from "../contexts/MandantContext";
import { useSettings } from "../contexts/SettingsContext";
import { exportTableToExcel, exportTableToPdf, type TableRow } from "../utils/exporters";
import "./OposPage.css";

const euro = new Intl.NumberFormat("de-DE", {
  style: "currency",
  currency: "EUR",
});

const BUCKETS: AgingBucket[] = ["0-30", "31-60", "61-90", "91+"];
const BUCKET_LABEL: Record<AgingBucket, string> = {
  "0-30": "0–30 Tage",
  "31-60": "31–60 Tage",
  "61-90": "61–90 Tage",
  "91+": "über 90 Tage",
};

type TabKind = "forderung" | "verbindlichkeit";

export default function OposPage() {
  const { selectedMandantId } = useMandant();
  const { settings } = useSettings();
  const entriesQ = useQuery({
    queryKey: ["journal_entries", "all", selectedMandantId],
    queryFn: fetchAllEntries,
  });
  const accountsQ = useQuery({
    queryKey: ["accounts", "all-with-inactive"],
    queryFn: fetchAccounts,
  });

  const [tab, setTab] = useState<TabKind>("forderung");
  const [search, setSearch] = useState("");
  const [bucketFilter, setBucketFilter] = useState<"alle" | AgingBucket>("alle");
  const [overdueOnly, setOverdueOnly] = useState(false);

  const summary: OposSummary = useMemo(
    () => summarizeOpenItems(entriesQ.data ?? [], accountsQ.data ?? []),
    [entriesQ.data, accountsQ.data]
  );

  const rawList = tab === "forderung" ? summary.receivables : summary.payables;

  const filtered = useMemo(() => {
    let list = rawList;
    if (selectedMandantId)
      list = list.filter((i) => i.client_id === selectedMandantId);
    if (bucketFilter !== "alle")
      list = list.filter((i) => i.bucket === bucketFilter);
    if (overdueOnly) list = list.filter((i) => i.ueberfaellig_tage > 0);
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (i) =>
          i.beleg_nr.toLowerCase().includes(q) ||
          i.gegenseite.toLowerCase().includes(q) ||
          i.beschreibung.toLowerCase().includes(q)
      );
    }
    return list;
  }, [rawList, selectedMandantId, bucketFilter, overdueOnly, search]);

  const perCounterparty = useMemo(() => {
    const m = new Map<string, { total: number; count: number }>();
    for (const i of filtered) {
      const prev = m.get(i.gegenseite) ?? { total: 0, count: 0 };
      prev.total += i.offen;
      prev.count += 1;
      m.set(i.gegenseite, prev);
    }
    return Array.from(m.entries())
      .map(([gegenseite, v]) => ({ gegenseite, ...v }))
      .sort((a, b) => b.total - a.total);
  }, [filtered]);

  const isLoading = entriesQ.isLoading || accountsQ.isLoading;

  async function handleExport(format: "pdf" | "xlsx") {
    const rows: TableRow[] = filtered.map((i) => [
      i.beleg_nr,
      new Date(i.datum).toLocaleDateString("de-DE"),
      new Date(i.faelligkeit).toLocaleDateString("de-DE"),
      i.gegenseite,
      i.beschreibung,
      i.ueberfaellig_tage > 0 ? `${i.ueberfaellig_tage} T.` : "noch nicht fällig",
      i.offen,
    ]);
    const title =
      tab === "forderung"
        ? "Offene Forderungen (Debitoren)"
        : "Offene Verbindlichkeiten (Kreditoren)";
    const spec = {
      title,
      subtitle: `${settings.kanzleiName} · Stand ${new Date().toLocaleDateString("de-DE")}`,
      columns: [
        { header: "Beleg-Nr.", width: 14 },
        { header: "Datum", width: 12 },
        { header: "Fällig", width: 12 },
        { header: "Gegenseite", width: 28 },
        { header: "Beschreibung", width: 28 },
        { header: "Überfällig", width: 14 },
        { header: "Offen", width: 14, alignRight: true },
      ],
      rows,
      footer: [
        "Summe",
        "",
        "",
        "",
        "",
        "",
        filtered.reduce((s, i) => s + i.offen, 0),
      ] as TableRow,
    };
    const base = `opos_${tab}_${new Date().toISOString().slice(0, 10)}`;
    try {
      if (format === "pdf") await exportTableToPdf(spec, `${base}.pdf`);
      else await exportTableToExcel(spec, `${base}.xlsx`);
      toast.success(`${format.toUpperCase()} exportiert.`);
    } catch (err) {
      toast.error(`Export fehlgeschlagen: ${(err as Error).message}`);
    }
  }

  const totalOffen = filtered.reduce((s, i) => s + i.offen, 0);
  const totalOverdue = filtered
    .filter((i) => i.ueberfaellig_tage > 0)
    .reduce((s, i) => s + i.offen, 0);

  return (
    <div className="opos">
      <header className="opos__head">
        <div>
          <h1>Offene Posten</h1>
          <p>
            Aus dem Buchungsjournal abgeleitete Forderungen (Konten 1400–1499)
            und Verbindlichkeiten (1600–1699), gruppiert nach Beleg-Nummer.
          </p>
        </div>
      </header>

      <aside className="opos__note">
        <Info size={14} />
        <span>
          <strong>Hinweis:</strong> Offene Posten beziehen sich stets auf den
          aktuellen Stand (<em>heute</em>) und sind daher <strong>nicht</strong>{" "}
          an das globale Geschäftsjahr gebunden — eine Rechnung, die 2024
          gestellt und bis heute nicht bezahlt wurde, bleibt offen. Für einen
          Jahres-Snapshot („OPOS zum 31.12.2024") ist eine separate As-of-Abfrage
          nötig.
        </span>
      </aside>

      <section className="opos__kpis">
        <article className="card opos__kpi">
          <span className="opos__kpi-label">Offene Forderungen</span>
          <strong>{euro.format(summary.totals.forderung_offen)}</strong>
          <span className="opos__kpi-sub" style={{ color: "var(--danger)" }}>
            davon überfällig{" "}
            {euro.format(summary.totals.forderung_ueberfaellig)}
          </span>
        </article>
        <article className="card opos__kpi">
          <span className="opos__kpi-label">Offene Verbindlichkeiten</span>
          <strong>{euro.format(summary.totals.verbindlichkeit_offen)}</strong>
          <span className="opos__kpi-sub" style={{ color: "var(--warning)" }}>
            davon überfällig{" "}
            {euro.format(summary.totals.verbindlichkeit_ueberfaellig)}
          </span>
        </article>
        <article className="card opos__kpi">
          <span className="opos__kpi-label">Saldo (F − V)</span>
          <strong>
            {euro.format(
              summary.totals.forderung_offen -
                summary.totals.verbindlichkeit_offen
            )}
          </strong>
          <span className="opos__kpi-sub">
            Netto-Position auf offene Posten
          </span>
        </article>
      </section>

      <section className="card opos__agings">
        <h2>Altersstruktur</h2>
        <table className="report__table">
          <thead>
            <tr>
              <th>Bucket</th>
              <th className="is-num">Forderungen</th>
              <th className="is-num">Verbindlichkeiten</th>
            </tr>
          </thead>
          <tbody>
            {BUCKETS.map((b) => (
              <tr key={b}>
                <td>{BUCKET_LABEL[b]}</td>
                <td className="is-num mono">
                  {euro.format(summary.byBucket[b].forderung)}
                </td>
                <td className="is-num mono">
                  {euro.format(summary.byBucket[b].verbindlichkeit)}
                </td>
              </tr>
            ))}
            <tr className="is-result">
              <td>
                <strong>Summe</strong>
              </td>
              <td className="is-num mono">
                {euro.format(summary.totals.forderung_offen)}
              </td>
              <td className="is-num mono">
                {euro.format(summary.totals.verbindlichkeit_offen)}
              </td>
            </tr>
          </tbody>
        </table>
      </section>

      <div className="opos__tabs">
        <button
          type="button"
          className={`opos__tab${tab === "forderung" ? " is-active" : ""}`}
          onClick={() => setTab("forderung")}
        >
          Debitoren (Forderungen)
        </button>
        <button
          type="button"
          className={`opos__tab${tab === "verbindlichkeit" ? " is-active" : ""}`}
          onClick={() => setTab("verbindlichkeit")}
        >
          Kreditoren (Verbindlichkeiten)
        </button>
      </div>

      <header className="card opos__toolbar">
        <label className="journal__search">
          <Search size={16} />
          <input
            type="search"
            placeholder="Suche nach Beleg, Gegenseite, Beschreibung …"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </label>
        <select
          className="journal__select"
          value={bucketFilter}
          onChange={(e) =>
            setBucketFilter(e.target.value as typeof bucketFilter)
          }
        >
          <option value="alle">Alle Buckets</option>
          {BUCKETS.map((b) => (
            <option key={b} value={b}>
              {BUCKET_LABEL[b]}
            </option>
          ))}
        </select>
        <label className="kontenplan__toggle">
          <input
            type="checkbox"
            checked={overdueOnly}
            onChange={(e) => setOverdueOnly(e.target.checked)}
          />
          Nur überfällig
        </label>
        <div className="journal__count">
          <strong>{filtered.length}</strong> Posten ·{" "}
          {euro.format(totalOffen)}{" "}
          {totalOverdue > 0 && (
            <span style={{ color: "var(--danger)" }}>
              · davon {euro.format(totalOverdue)} überfällig
            </span>
          )}
        </div>
        <button
          type="button"
          className="btn btn-outline"
          onClick={() => handleExport("pdf")}
        >
          <FileText size={16} />
          PDF
        </button>
        <button
          type="button"
          className="btn btn-outline"
          onClick={() => handleExport("xlsx")}
        >
          <FileSpreadsheet size={16} />
          Excel
        </button>
        {tab === "forderung" && summary.totals.forderung_ueberfaellig > 0 && (
          <Link to="/mahnwesen" className="btn btn-primary">
            <AlertCircle size={16} />
            Mahnwesen öffnen
            <ArrowRight size={14} />
          </Link>
        )}
      </header>

      {isLoading ? (
        <div className="journal__state">
          <Loader2 className="journal__state-spin" size={28} />
          <p>Lade Daten …</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="card opos__empty">
          <Wallet size={32} strokeWidth={1.25} />
          <p>Keine offenen Posten in dieser Ansicht.</p>
        </div>
      ) : (
        <>
          <div className="card opos__tablewrap">
            <table className="opos__table">
              <thead>
                <tr>
                  <th>Beleg-Nr.</th>
                  <th>Datum</th>
                  <th>Fällig</th>
                  <th>Gegenseite</th>
                  <th>Beschreibung</th>
                  <th>Bucket</th>
                  <th className="is-num">Offen</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((i) => (
                  <Row key={`${i.kind}:${i.beleg_nr}`} i={i} />
                ))}
              </tbody>
            </table>
          </div>

          {perCounterparty.length > 1 && (
            <section className="card opos__agings">
              <h2>Top-Positionen nach Gegenseite</h2>
              <table className="report__table">
                <thead>
                  <tr>
                    <th>Gegenseite</th>
                    <th className="is-num">Anzahl</th>
                    <th className="is-num">Offener Betrag</th>
                  </tr>
                </thead>
                <tbody>
                  {perCounterparty.slice(0, 10).map((c) => (
                    <tr key={c.gegenseite}>
                      <td>{c.gegenseite}</td>
                      <td className="is-num mono">{c.count}</td>
                      <td className="is-num mono">{euro.format(c.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          )}
        </>
      )}
    </div>
  );
}

function Row({ i }: { i: OpenItem }) {
  const overdue = i.ueberfaellig_tage > 0;
  return (
    <tr className={overdue ? "is-overdue" : ""}>
      <td className="mono">{i.beleg_nr}</td>
      <td className="mono">
        {new Date(i.datum).toLocaleDateString("de-DE")}
      </td>
      <td className="mono">
        {new Date(i.faelligkeit).toLocaleDateString("de-DE")}
        {overdue && (
          <span className="opos__overdue">{i.ueberfaellig_tage} T. überfällig</span>
        )}
      </td>
      <td>{i.gegenseite}</td>
      <td className="opos__desc">{i.beschreibung}</td>
      <td>
        <span className={`opos__bucket is-${i.bucket.replace("+", "plus")}`}>
          {BUCKET_LABEL[i.bucket]}
        </span>
      </td>
      <td className="is-num mono">{euro.format(i.offen)}</td>
    </tr>
  );
}
