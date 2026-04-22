import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  Info,
  Loader2,
  RotateCcw,
  Save,
  Search,
} from "lucide-react";
import { toast } from "sonner";
import { fetchAccounts } from "../api/accounts";
import { fetchAllEntries } from "../api/dashboard";
import {
  clearMappingOverrides,
  EUER_ZEILEN,
  loadMappingOverrides,
  mapKontoToEuerZeile,
  saveMappingOverrides,
} from "../data/euerMapping";
import { useYear } from "../contexts/YearContext";
import type { Account } from "../types/db";
import "./ReportView.css";
import "./TaxCalc.css";

const ZEILE_LABEL = new Map(
  EUER_ZEILEN.map((z) => [z.zeile, `Zeile ${z.zeile} · ${z.label}`])
);

export default function BuchfuehrungMappingPage() {
  const { inYear, selectedYear } = useYear();
  const entriesQ = useQuery({
    queryKey: ["journal_entries", "all"],
    queryFn: fetchAllEntries,
  });
  const accountsQ = useQuery({
    queryKey: ["accounts", "all-with-inactive"],
    queryFn: fetchAccounts,
  });

  const [overrides, setOverrides] =
    useState<Record<string, number>>(loadMappingOverrides);
  const [search, setSearch] = useState("");

  useEffect(() => {
    saveMappingOverrides(overrides);
  }, [overrides]);

  const accounts = accountsQ.data ?? [];
  const entries = entriesQ.data ?? [];

  const usedAccounts = useMemo(() => {
    const usage = new Map<string, number>();
    for (const e of entries) {
      if (!inYear(e.datum)) continue;
      usage.set(e.soll_konto, (usage.get(e.soll_konto) ?? 0) + 1);
      usage.set(e.haben_konto, (usage.get(e.haben_konto) ?? 0) + 1);
    }
    return usage;
  }, [entries, inYear]);

  const rows = useMemo(() => {
    const filteredAccounts = accounts
      .filter((a) => a.kategorie === "aufwand" || a.kategorie === "ertrag")
      .filter((a) => {
        const q = search.trim().toLowerCase();
        if (!q) return true;
        return (
          a.konto_nr.toLowerCase().includes(q) ||
          a.bezeichnung.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => a.konto_nr.localeCompare(b.konto_nr));
    return filteredAccounts.map((a) => ({
      account: a,
      defaultZeile: mapKontoToEuerZeile(a.konto_nr),
      override: overrides[a.konto_nr] ?? null,
      usage: usedAccounts.get(a.konto_nr) ?? 0,
    }));
  }, [accounts, search, overrides, usedAccounts]);

  function setOverride(konto: string, zeile: number | null) {
    setOverrides((o) => {
      const next = { ...o };
      if (zeile === null) delete next[konto];
      else next[konto] = zeile;
      return next;
    });
  }

  function resetAll() {
    if (!confirm("Alle Zuordnungs-Überschreibungen zurücksetzen?")) return;
    clearMappingOverrides();
    setOverrides({});
    toast.info("Zuordnung auf Standard zurückgesetzt.");
  }

  function save() {
    saveMappingOverrides(overrides);
    toast.success(
      `${Object.keys(overrides).length} Überschreibungen gespeichert.`
    );
  }

  return (
    <div className="report taxcalc">
      <header className="report__head no-print">
        <Link to="/buchfuehrung" className="report__back">
          <ArrowLeft size={16} />
          Zurück zur Buchführung
        </Link>
        <div className="report__head-title">
          <h1>Konten-Zuordnung</h1>
          <p>
            SKR03-Konten den Zeilen der Anlage EÜR zuordnen. Die
            Standardzuordnung (siehe <code>src/data/euerMapping.ts</code>) wird
            hier für einzelne Konten überschrieben. Änderungen werden
            ausschließlich im Browser gespeichert.
          </p>
        </div>
        <div className="period">
          <button type="button" className="btn btn-ghost" onClick={resetAll}>
            <RotateCcw size={16} />
            Standard wiederherstellen
          </button>
          <button type="button" className="btn btn-primary" onClick={save}>
            <Save size={16} />
            Speichern
          </button>
        </div>
      </header>

      <aside className="taxcalc__hint">
        <Info size={14} />
        <span>
          Hier gelistet: nur Erfolgskonten (Aufwand + Ertrag). Bestands- und
          Privatkonten (Aktiva/Passiva) sind für die EÜR nicht relevant und
          werden ausgeblendet. Nutzungszähler bezieht sich auf das
          Geschäftsjahr <strong>{selectedYear}</strong>.
        </span>
      </aside>

      <header className="card kontenplan__toolbar">
        <label className="journal__search">
          <Search size={16} />
          <input
            type="search"
            placeholder="Suche nach Kontonummer oder Bezeichnung …"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </label>
        <div className="kontenplan__count">
          <strong>{rows.length}</strong> Konten · {Object.keys(overrides).length}{" "}
          Überschreibung(en)
        </div>
      </header>

      {entriesQ.isLoading || accountsQ.isLoading ? (
        <div className="journal__state">
          <Loader2 className="journal__state-spin" size={28} />
          <p>Lade Konten …</p>
        </div>
      ) : rows.length === 0 ? (
        <div className="card kontenplan__empty">
          <p>Keine Konten passend zu dieser Suche.</p>
        </div>
      ) : (
        <div className="card">
          <table className="kontenplan__table">
            <thead>
              <tr>
                <th>Konto</th>
                <th>Bezeichnung</th>
                <th>Kategorie</th>
                <th>Nutzung</th>
                <th>Standard-Zeile</th>
                <th>Überschreibung</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ account, defaultZeile, override, usage }) => (
                <Row
                  key={account.konto_nr}
                  account={account}
                  defaultZeile={defaultZeile}
                  override={override}
                  usage={usage}
                  onChange={(z) => setOverride(account.konto_nr, z)}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function Row({
  account,
  defaultZeile,
  override,
  usage,
  onChange,
}: {
  account: Account;
  defaultZeile: number | null;
  override: number | null;
  usage: number;
  onChange: (z: number | null) => void;
}) {
  const effective = override ?? defaultZeile;
  return (
    <tr>
      <td className="mono kontenplan__nr">{account.konto_nr}</td>
      <td>{account.bezeichnung}</td>
      <td style={{ textTransform: "capitalize" }}>{account.kategorie}</td>
      <td>
        {usage === 0 ? (
          <span style={{ color: "var(--muted)" }}>—</span>
        ) : (
          <span className="kontenplan__usage">{usage}</span>
        )}
      </td>
      <td>
        {defaultZeile === null ? (
          <span style={{ color: "var(--warning)" }}>— (nicht zugeordnet)</span>
        ) : (
          <span className="mono">
            {ZEILE_LABEL.get(defaultZeile) ?? `Zeile ${defaultZeile}`}
          </span>
        )}
      </td>
      <td>
        <select
          value={override ?? ""}
          onChange={(e) => {
            const v = e.target.value;
            onChange(v ? Number(v) : null);
          }}
          aria-label={`Zeile für Konto ${account.konto_nr}`}
          style={{
            padding: "6px 8px",
            borderRadius: "6px",
            border: "1px solid var(--border-strong)",
            background:
              effective === null ? "rgba(217, 119, 6,0.1)" : "var(--surface)",
            minWidth: 320,
          }}
        >
          <option value="">— Standard übernehmen —</option>
          {EUER_ZEILEN.map((z) => (
            <option key={z.zeile} value={z.zeile}>
              Zeile {z.zeile} — {z.label}
            </option>
          ))}
        </select>
      </td>
    </tr>
  );
}
