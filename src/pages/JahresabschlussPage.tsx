import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Download,
  Loader2,
  Printer,
} from "lucide-react";
import { toast } from "sonner";
import { fetchAccounts } from "../api/accounts";
import { fetchAllEntries } from "../api/dashboard";
import { fetchAnlagegueter } from "../api/anlagen";
import { useMandant } from "../contexts/MandantContext";
import { useYear } from "../contexts/YearContext";
import { useSettings } from "../contexts/SettingsContext";
import { buildJahresabschluss } from "../domain/accounting/FinancialStatements";
import { getAnlagenspiegelData } from "../domain/anlagen/AnlagenService";
import type { SizeClass } from "../domain/accounting/hgb266Structure";
import { Money } from "../lib/money/Money";
import { downloadText } from "../utils/exporters";
import "./ReportView.css";

function formatString(s: string): string {
  return new Money(s).toEuroFormat();
}

export default function JahresabschlussPage() {
  const { selectedYear } = useYear();
  const { settings } = useSettings();
  const { selectedMandantId } = useMandant();
  const [periodStart, setPeriodStart] = useState(`${selectedYear}-01-01`);
  const [stichtag, setStichtag] = useState(`${selectedYear}-12-31`);
  const [sizeClass, setSizeClass] = useState<SizeClass>("ALL");

  const entriesQ = useQuery({
    queryKey: ["journal_entries", "all", selectedMandantId],
    queryFn: fetchAllEntries,
  });
  const accountsQ = useQuery({
    queryKey: ["accounts", "all-with-inactive"],
    queryFn: fetchAccounts,
  });
  const anlagenQ = useQuery({
    queryKey: ["anlagegueter", selectedMandantId],
    queryFn: () => fetchAnlagegueter(selectedMandantId),
  });

  const r = useMemo(() => {
    if (!entriesQ.data || !accountsQ.data) return null;
    return buildJahresabschluss(accountsQ.data, entriesQ.data, {
      periodStart,
      stichtag,
      sizeClass,
      verfahren: "GKV",
    });
  }, [accountsQ.data, entriesQ.data, periodStart, stichtag, sizeClass]);

  const anlagenspiegel = useMemo(() => {
    if (!anlagenQ.data || anlagenQ.data.length === 0) return null;
    const jahr = Number(stichtag.slice(0, 4));
    if (!Number.isFinite(jahr)) return null;
    return getAnlagenspiegelData(jahr, anlagenQ.data);
  }, [anlagenQ.data, stichtag]);

  const isLoading = entriesQ.isLoading || accountsQ.isLoading;

  function handleJson() {
    if (!r) return;
    const payload = {
      meta: {
        generatedAt: new Date().toISOString(),
        kanzlei: settings.kanzleiName,
        periodStart,
        stichtag,
        sizeClass,
        verfahren: r.guv.verfahren,
      },
      crossCheck: r.crossCheck,
      inconsistencies: r.inconsistencies,
      bilanz: {
        summary: {
          aktivaSum: r.bilanz.aktivaSum,
          passivaSum: r.bilanz.passivaSum,
          provisionalResult: r.bilanz.provisionalResult,
          balancierungsDifferenz: r.bilanz.balancierungsDifferenz,
        },
        unmappedAccounts: r.bilanz.unmappedAccounts,
      },
      guv: {
        summary: {
          umsatzerloese: r.guv.umsatzerloese,
          betriebsergebnis: r.guv.betriebsergebnis,
          finanzergebnis: r.guv.finanzergebnis,
          ergebnisVorSteuern: r.guv.ergebnisVorSteuern,
          ergebnisNachSteuern: r.guv.ergebnisNachSteuern,
          jahresergebnis: r.guv.jahresergebnis,
        },
        positionen: r.guv.positionen.map((p) => ({
          reference_code: p.reference_code,
          name: p.name,
          hgbParagraph: p.hgbParagraph,
          amount: p.amount,
          isSubtotal: p.isSubtotal,
          isFinalResult: p.isFinalResult,
        })),
        unmappedAccounts: r.guv.unmappedAccounts,
      },
      anlagenspiegel: anlagenspiegel
        ? {
            bis_jahr: anlagenspiegel.bis_jahr,
            gruppen: anlagenspiegel.gruppen,
            totals: anlagenspiegel.totals,
          }
        : null,
    };
    downloadText(
      JSON.stringify(payload, null, 2),
      `jahresabschluss_${periodStart}_${stichtag}.json`,
      "application/json"
    );
    toast.success("Jahresabschluss-JSON exportiert.");
  }

  return (
    <div className="report">
      <header className="report__head no-print">
        <Link to="/berichte" className="report__back">
          <ArrowLeft size={16} />
          Zurück zu Berichten
        </Link>
        <div className="report__head-title">
          <h1>Jahresabschluss (HGB § 242 Abs. 2)</h1>
          <p>
            Bilanz (§ 266) + GuV (§ 275) in einer Ansicht mit GoBD-Konsistenz-
            Prüfung. Nachgebildete Darstellung — ersetzt keine geprüfte
            Jahresabschluss-Feststellung.
          </p>
        </div>
        <div className="period">
          <label>
            <span>von</span>
            <input type="date" value={periodStart} onChange={(e) => setPeriodStart(e.target.value)} />
          </label>
          <label>
            <span>bis</span>
            <input type="date" value={stichtag} onChange={(e) => setStichtag(e.target.value)} />
          </label>
          <label>
            <span>Grössenklasse</span>
            <select
              value={sizeClass}
              onChange={(e) => setSizeClass(e.target.value as SizeClass)}
            >
              <option value="ALL">Alle Zeilen</option>
              <option value="KLEIN">Klein (§ 267 Abs. 1)</option>
              <option value="MITTEL">Mittel (§ 267 Abs. 2)</option>
              <option value="GROSS">Gross (§ 267 Abs. 3)</option>
            </select>
          </label>
          <button type="button" className="btn btn-outline" onClick={() => window.print()}>
            <Printer size={16} /> Drucken
          </button>
          <button type="button" className="btn btn-outline" onClick={handleJson}>
            <Download size={16} /> JSON
          </button>
        </div>
      </header>

      {isLoading || !r ? (
        <div className="journal__state">
          <Loader2 className="journal__state-spin" size={28} />
          <p>Lade Jahresabschluss …</p>
        </div>
      ) : (
        <>
          {/* Consistency banner at top */}
          <section
            className="card"
            style={{
              padding: 14,
              marginBottom: 16,
              background: r.isConsistent ? "#eaf5ef" : "#fcefea",
              borderLeft: `4px solid ${r.isConsistent ? "#1f7a4d" : "#8a2c2c"}`,
            }}
          >
            <h3
              style={{
                margin: 0,
                fontSize: "1rem",
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              {r.isConsistent ? (
                <>
                  <CheckCircle2 size={18} color="#1f7a4d" />
                  Jahresabschluss konsistent (Bilanz ≡ GuV, GoBD Rz. 58)
                </>
              ) : (
                <>
                  <AlertTriangle size={18} color="#8a2c2c" />
                  Inkonsistenzen erkannt ({r.inconsistencies.length})
                </>
              )}
            </h3>
            {!r.isConsistent && (
              <ul
                style={{
                  margin: "8px 0 0 20px",
                  fontSize: "0.85rem",
                  color: "#8a2c2c",
                }}
              >
                {r.inconsistencies.map((msg, i) => (
                  <li key={i}>{msg}</li>
                ))}
              </ul>
            )}
          </section>

          {/* Two-column summary: Bilanz | GuV */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 24,
              marginBottom: 16,
            }}
          >
            <section className="card" style={{ padding: 16 }}>
              <h2
                style={{
                  margin: "0 0 10px",
                  padding: "6px 10px",
                  background: "#eef1f6",
                  borderLeft: "4px solid #15233d",
                  fontSize: "0.95rem",
                }}
              >
                Bilanz (§ 266 HGB)
              </h2>
              <dl style={{ fontSize: "0.88rem", margin: 0 }}>
                <Row label="Summe Aktiva" value={r.bilanz.aktivaSum} />
                <Row label="Summe Passiva" value={r.bilanz.passivaSum} />
                <Row label="Vorläufiges Ergebnis" value={r.bilanz.provisionalResult} />
                <Row
                  label="Bilanzierungsdifferenz"
                  value={r.bilanz.balancierungsDifferenz}
                />
              </dl>
              <Link
                to="/berichte/bilanz"
                style={{ fontSize: "0.85rem", marginTop: 8, display: "inline-block" }}
              >
                → Detailansicht öffnen
              </Link>
            </section>

            <section className="card" style={{ padding: 16 }}>
              <h2
                style={{
                  margin: "0 0 10px",
                  padding: "6px 10px",
                  background: "#f5ece4",
                  borderLeft: "4px solid #c76b3f",
                  fontSize: "0.95rem",
                }}
              >
                GuV (§ 275 HGB, GKV)
              </h2>
              <dl style={{ fontSize: "0.88rem", margin: 0 }}>
                <Row label="Umsatzerlöse (Nr. 1)" value={r.guv.umsatzerloese} />
                <Row label="Betriebsergebnis" value={r.guv.betriebsergebnis} />
                <Row label="Finanzergebnis" value={r.guv.finanzergebnis} />
                <Row label="Ergebnis vor Steuern" value={r.guv.ergebnisVorSteuern} />
                <Row label="Ergebnis nach Steuern (Nr. 15)" value={r.guv.ergebnisNachSteuern} />
                <Row
                  label="Jahresergebnis (Nr. 17)"
                  value={r.guv.jahresergebnis}
                  bold
                />
              </dl>
              <Link
                to="/berichte/guv"
                style={{ fontSize: "0.85rem", marginTop: 8, display: "inline-block" }}
              >
                → Detailansicht öffnen
              </Link>
            </section>
          </div>

          {anlagenspiegel && anlagenspiegel.gruppen.length > 0 && (
            <section className="card" style={{ padding: 16, marginBottom: 16 }}>
              <h2
                style={{
                  margin: "0 0 10px",
                  padding: "6px 10px",
                  background: "#efefe4",
                  borderLeft: "4px solid #6b7a3c",
                  fontSize: "0.95rem",
                }}
              >
                Anlagenspiegel (§ 284 HGB) — Stichtag 31.12.{anlagenspiegel.bis_jahr}
              </h2>
              <dl style={{ fontSize: "0.88rem", margin: 0 }}>
                <Row
                  label={`Anlagen-Anzahl (${anlagenspiegel.gruppen.length} Gruppen)`}
                  value={String(anlagenspiegel.totals.anzahl)}
                />
                <Row
                  label="AK zum 01.01."
                  value={anlagenspiegel.totals.ak_start.toFixed(2)}
                />
                <Row
                  label="Zugänge im Jahr"
                  value={anlagenspiegel.totals.zugaenge.toFixed(2)}
                />
                <Row
                  label="Abgänge im Jahr"
                  value={anlagenspiegel.totals.abgaenge.toFixed(2)}
                />
                <Row
                  label="AK zum 31.12."
                  value={anlagenspiegel.totals.ak_ende.toFixed(2)}
                />
                <Row
                  label="Abschreibungen kumuliert"
                  value={anlagenspiegel.totals.abschreibungen_kumuliert.toFixed(2)}
                />
                <Row
                  label="Buchwert 31.12."
                  value={anlagenspiegel.totals.buchwert_ende.toFixed(2)}
                  bold
                />
              </dl>
              <Link
                to="/berichte/anlagenspiegel"
                style={{ fontSize: "0.85rem", marginTop: 8, display: "inline-block" }}
              >
                → Anlagenspiegel-Detailansicht (mit PDF/Excel-Export)
              </Link>
            </section>
          )}
        </>
      )}
    </div>
  );
}

function Row({
  label,
  value,
  bold,
}: {
  label: string;
  value: string;
  bold?: boolean;
}) {
  const m = new Money(value);
  const color = m.isNegative() ? "#8a2c2c" : m.isPositive() ? "#1f7a4d" : undefined;
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        padding: "3px 0",
        borderBottom: "1px dashed #eef1f6",
        fontWeight: bold ? 700 : 400,
      }}
    >
      <dt style={{ margin: 0 }}>{label}</dt>
      <dd
        style={{
          margin: 0,
          fontFamily: "var(--font-mono)",
          color: bold ? color : undefined,
        }}
      >
        {m.toEuroFormat()}
      </dd>
    </div>
  );
}
