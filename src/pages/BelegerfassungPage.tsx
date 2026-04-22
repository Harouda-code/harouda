import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Plus,
  Save,
  Trash2,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import {
  BelegValidierungsService,
  type BelegValidationResult,
} from "../domain/belege/BelegValidierungsService";
import type {
  Belegart,
  BelegEntry,
  BelegPosition,
  Zahlungsart,
} from "../domain/belege/types";
import { Money } from "../lib/money/Money";
import { journalRepo } from "../lib/db/journalRepo";
import "./ReportView.css";

const BELEGARTEN: { value: Belegart; label: string }[] = [
  { value: "EINGANGSRECHNUNG", label: "Eingangsrechnung" },
  { value: "AUSGANGSRECHNUNG", label: "Ausgangsrechnung" },
  { value: "KASSENBELEG", label: "Kassenbeleg" },
  { value: "BANKBELEG", label: "Bankbeleg" },
  { value: "SONSTIGES", label: "Sonstiges" },
];

const ZAHLUNGSARTEN: Zahlungsart[] = [
  "UEBERWEISUNG",
  "BAR",
  "EC",
  "KREDITKARTE",
  "LASTSCHRIFT",
  "SONSTIGE",
];

function moneyOrZero(s: string): Money {
  if (!s.trim()) return Money.zero();
  try {
    return new Money(s.replace(",", "."));
  } catch {
    return Money.zero();
  }
}

type EditPosition = {
  konto: string;
  side: "SOLL" | "HABEN";
  betragStr: string;
  text: string;
  ustSatz: string;
};

export default function BelegerfassungPage() {
  const navigate = useNavigate();
  const today = new Date().toISOString().slice(0, 10);
  const [submitting, setSubmitting] = useState(false);
  const [belegart, setBelegart] = useState<Belegart>("EINGANGSRECHNUNG");
  const [belegnummer, setBelegnummer] = useState("");
  const [belegdatum, setBelegdatum] = useState(today);
  const [buchungsdatum, setBuchungsdatum] = useState(today);
  const [leistungsdatum, setLeistungsdatum] = useState("");
  const [beschreibung, setBeschreibung] = useState("");
  const [partnerName, setPartnerName] = useState("");
  const [partnerKonto, setPartnerKonto] = useState("");
  const [partnerUstId, setPartnerUstId] = useState("");
  const [partnerLand, setPartnerLand] = useState("");
  const [istIgLieferung, setIstIg] = useState(false);
  const [istReverseCharge, setIstRC] = useState(false);
  const [nettoStr, setNettoStr] = useState("");
  const [steuerStr, setSteuerStr] = useState("");
  const [bruttoStr, setBruttoStr] = useState("");
  const [zahlungsart, setZahlungsart] = useState<Zahlungsart | "">("");
  const [zahlungsdatum, setZahlungsdatum] = useState("");
  const [skontoStr, setSkontoStr] = useState("");

  const [positionen, setPositionen] = useState<EditPosition[]>([
    { konto: "4100", side: "SOLL", betragStr: "", text: "", ustSatz: "0.19" },
    { konto: "1200", side: "HABEN", betragStr: "", text: "", ustSatz: "" },
  ]);

  const beleg: BelegEntry = useMemo(() => {
    return {
      belegart,
      belegnummer,
      belegdatum,
      buchungsdatum,
      leistungsdatum: leistungsdatum || undefined,
      beschreibung,
      partner: {
        name: partnerName,
        kontoNr: partnerKonto || undefined,
        ustId: partnerUstId || undefined,
        land: partnerLand || undefined,
      },
      positionen: positionen
        .filter((p) => p.betragStr.trim() !== "")
        .map<BelegPosition>((p) => ({
          konto: p.konto,
          side: p.side,
          betrag: moneyOrZero(p.betragStr),
          text: p.text || undefined,
          ustSatz: p.ustSatz ? Number(p.ustSatz) : undefined,
        })),
      netto: nettoStr ? moneyOrZero(nettoStr) : undefined,
      steuerbetrag: steuerStr ? moneyOrZero(steuerStr) : undefined,
      brutto: bruttoStr ? moneyOrZero(bruttoStr) : undefined,
      zahlung:
        zahlungsart || zahlungsdatum || skontoStr
          ? {
              art: (zahlungsart || "UEBERWEISUNG") as Zahlungsart,
              datum: zahlungsdatum || undefined,
              skonto_prozent: skontoStr ? Number(skontoStr) : undefined,
            }
          : undefined,
      istIgLieferung: istIgLieferung || undefined,
      istReverseCharge: istReverseCharge || undefined,
    };
  }, [
    belegart,
    belegnummer,
    belegdatum,
    buchungsdatum,
    leistungsdatum,
    beschreibung,
    partnerName,
    partnerKonto,
    partnerUstId,
    partnerLand,
    positionen,
    nettoStr,
    steuerStr,
    bruttoStr,
    zahlungsart,
    zahlungsdatum,
    skontoStr,
    istIgLieferung,
    istReverseCharge,
  ]);

  const validation: BelegValidationResult = useMemo(() => {
    return new BelegValidierungsService().validate(beleg);
  }, [beleg]);

  function addPosition() {
    setPositionen([
      ...positionen,
      { konto: "", side: "SOLL", betragStr: "", text: "", ustSatz: "" },
    ]);
  }
  function removePosition(i: number) {
    setPositionen(positionen.filter((_, idx) => idx !== i));
  }
  function updatePosition(
    i: number,
    field: keyof EditPosition,
    value: string
  ) {
    setPositionen(
      positionen.map((p, idx) =>
        idx === i ? { ...p, [field]: value as never } : p
      )
    );
  }

  function calcBruttoFromNettoUst() {
    if (!nettoStr.trim() || !steuerStr.trim()) return;
    const n = moneyOrZero(nettoStr);
    const s = moneyOrZero(steuerStr);
    setBruttoStr(n.plus(s).toFixed2());
  }

  async function persistBeleg(status: "GEBUCHT" | "ENTWURF") {
    if (status === "GEBUCHT" && !validation.isValid) {
      toast.error(
        `Validierung fehlgeschlagen: ${validation.errors.length} Fehler`
      );
      return;
    }
    if (!beleg.belegnummer.trim()) {
      toast.error("Belegnummer ist Pflicht.");
      return;
    }
    setSubmitting(true);
    try {
      const { beleg: record, journalEntries } =
        await journalRepo.createJournalFromBeleg(beleg, { status });
      if (status === "GEBUCHT") {
        toast.success(
          `Beleg gebucht · ${journalEntries.length} Journal-Einträge erzeugt · ID ${record.id.slice(0, 8)}…`,
          {
            action: {
              label: "Zur Liste",
              onClick: () => navigate("/buchungen/belege"),
            },
          }
        );
      } else {
        toast.success(
          `Beleg-Entwurf gespeichert · ID ${record.id.slice(0, 8)}…`
        );
      }
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="report">
      <header className="report__head no-print">
        <Link to="/" className="report__back">
          <ArrowLeft size={16} /> Zurück
        </Link>
        <div className="report__head-title">
          <h1>Belegerfassung (§ 14 UStG)</h1>
          <p>
            Rechnung / Beleg erfassen mit Live-Validierung der § 14 UStG
            Pflichtangaben und automatischem Soll = Haben-Check.
          </p>
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
        <CheckCircle2 size={16} color="#1f7a4d" style={{ flexShrink: 0, marginTop: 2 }} />
        <div>
          <strong>Persistenz aktiv.</strong> „Buchen" speichert den Beleg und
          erzeugt die zugehörigen Journal-Einträge (GoBD-Hash-Kette). „Als
          Entwurf" legt ihn ohne Journal-Einträge ab. Validierung nach
          § 14 UStG + Soll = Haben-Check.
        </div>
      </aside>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "2fr 1fr",
          gap: 12,
        }}
      >
        {/* Form */}
        <div>
          <section className="card" style={{ padding: 14, marginBottom: 12 }}>
            <h3 style={{ margin: "0 0 8px", fontSize: "0.95rem" }}>Beleg</h3>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))",
                gap: 8,
              }}
            >
              <label>
                <span>Belegart</span>
                <select
                  value={belegart}
                  onChange={(e) => setBelegart(e.target.value as Belegart)}
                >
                  {BELEGARTEN.map((b) => (
                    <option key={b.value} value={b.value}>
                      {b.label}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span>Belegnummer *</span>
                <input
                  value={belegnummer}
                  onChange={(e) => setBelegnummer(e.target.value)}
                  placeholder="RE-2025-001"
                />
              </label>
              <label>
                <span>Belegdatum *</span>
                <input
                  type="date"
                  value={belegdatum}
                  onChange={(e) => setBelegdatum(e.target.value)}
                />
              </label>
              <label>
                <span>Buchungsdatum</span>
                <input
                  type="date"
                  value={buchungsdatum}
                  onChange={(e) => setBuchungsdatum(e.target.value)}
                />
              </label>
              <label>
                <span>Leistungsdatum</span>
                <input
                  type="date"
                  value={leistungsdatum}
                  onChange={(e) => setLeistungsdatum(e.target.value)}
                />
              </label>
              <label style={{ gridColumn: "1 / -1" }}>
                <span>Beschreibung *</span>
                <input
                  value={beschreibung}
                  onChange={(e) => setBeschreibung(e.target.value)}
                  placeholder="z. B. Beratung Projekt X"
                />
              </label>
            </div>
          </section>

          <section className="card" style={{ padding: 14, marginBottom: 12 }}>
            <h3 style={{ margin: "0 0 8px", fontSize: "0.95rem" }}>
              Geschäftspartner
            </h3>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))",
                gap: 8,
              }}
            >
              <label>
                <span>Name *</span>
                <input
                  value={partnerName}
                  onChange={(e) => setPartnerName(e.target.value)}
                />
              </label>
              <label>
                <span>Debitor/Kreditor-Konto</span>
                <input
                  value={partnerKonto}
                  onChange={(e) => setPartnerKonto(e.target.value)}
                  placeholder="10001"
                />
              </label>
              <label>
                <span>USt-IdNr</span>
                <input
                  value={partnerUstId}
                  onChange={(e) => setPartnerUstId(e.target.value)}
                  placeholder="DE/FR/…"
                />
              </label>
              <label>
                <span>Land</span>
                <input
                  value={partnerLand}
                  onChange={(e) => setPartnerLand(e.target.value)}
                  maxLength={2}
                />
              </label>
              <label style={{ display: "flex", gap: 6, alignItems: "center" }}>
                <input
                  type="checkbox"
                  checked={istIgLieferung}
                  onChange={(e) => setIstIg(e.target.checked)}
                />
                IG-Lieferung (§ 14a UStG)
              </label>
              <label style={{ display: "flex", gap: 6, alignItems: "center" }}>
                <input
                  type="checkbox"
                  checked={istReverseCharge}
                  onChange={(e) => setIstRC(e.target.checked)}
                />
                Reverse Charge (§ 13b UStG)
              </label>
            </div>
          </section>

          <section className="card" style={{ padding: 14, marginBottom: 12 }}>
            <h3 style={{ margin: "0 0 8px", fontSize: "0.95rem" }}>
              Rechnungsbeträge
            </h3>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <label>
                <span>Netto</span>
                <input
                  value={nettoStr}
                  onChange={(e) => setNettoStr(e.target.value)}
                  placeholder="0,00"
                  style={{ width: 110 }}
                />
              </label>
              <label>
                <span>USt-Betrag</span>
                <input
                  value={steuerStr}
                  onChange={(e) => setSteuerStr(e.target.value)}
                  placeholder="0,00"
                  style={{ width: 110 }}
                />
              </label>
              <label>
                <span>Brutto</span>
                <input
                  value={bruttoStr}
                  onChange={(e) => setBruttoStr(e.target.value)}
                  placeholder="0,00"
                  style={{ width: 110 }}
                />
              </label>
              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={calcBruttoFromNettoUst}
              >
                = Netto + USt
              </button>
            </div>
          </section>

          <section className="card" style={{ padding: 14, marginBottom: 12 }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 8,
              }}
            >
              <h3 style={{ margin: 0, fontSize: "0.95rem" }}>
                Buchungspositionen
              </h3>
              <button className="btn btn-outline btn-sm" onClick={addPosition}>
                <Plus size={12} /> Position
              </button>
            </div>
            <table style={{ width: "100%", fontSize: "0.85rem" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid #c3c8d1" }}>
                  <th style={{ textAlign: "left" }}>Konto</th>
                  <th style={{ textAlign: "left" }}>Seite</th>
                  <th style={{ textAlign: "right" }}>Betrag</th>
                  <th style={{ textAlign: "right" }}>USt%</th>
                  <th style={{ textAlign: "left" }}>Text</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {positionen.map((p, i) => (
                  <tr key={i} style={{ borderBottom: "1px solid #eef1f6" }}>
                    <td>
                      <input
                        value={p.konto}
                        onChange={(e) =>
                          updatePosition(i, "konto", e.target.value)
                        }
                        style={{ width: 80 }}
                      />
                    </td>
                    <td>
                      <select
                        value={p.side}
                        onChange={(e) =>
                          updatePosition(i, "side", e.target.value)
                        }
                      >
                        <option value="SOLL">SOLL</option>
                        <option value="HABEN">HABEN</option>
                      </select>
                    </td>
                    <td style={{ textAlign: "right" }}>
                      <input
                        value={p.betragStr}
                        onChange={(e) =>
                          updatePosition(i, "betragStr", e.target.value)
                        }
                        style={{ width: 90, textAlign: "right" }}
                      />
                    </td>
                    <td style={{ textAlign: "right" }}>
                      <input
                        value={p.ustSatz}
                        onChange={(e) =>
                          updatePosition(i, "ustSatz", e.target.value)
                        }
                        style={{ width: 60, textAlign: "right" }}
                      />
                    </td>
                    <td>
                      <input
                        value={p.text}
                        onChange={(e) =>
                          updatePosition(i, "text", e.target.value)
                        }
                      />
                    </td>
                    <td>
                      <button
                        className="btn btn-outline btn-sm"
                        onClick={() => removePosition(i)}
                      >
                        <Trash2 size={12} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div
              style={{
                marginTop: 8,
                fontSize: "0.85rem",
                display: "flex",
                gap: 14,
                color: validation.sollEqualsHaben ? "#1f7a4d" : "#8a2c2c",
              }}
            >
              <span>Soll: {validation.soll.toEuroFormat()}</span>
              <span>Haben: {validation.haben.toEuroFormat()}</span>
              <span>
                {validation.sollEqualsHaben ? (
                  <>
                    <CheckCircle2 size={12} /> Balanced
                  </>
                ) : (
                  <>
                    <XCircle size={12} /> Δ {validation.differenz.toEuroFormat()}
                  </>
                )}
              </span>
            </div>
          </section>

          <section className="card" style={{ padding: 14, marginBottom: 12 }}>
            <h3 style={{ margin: "0 0 8px", fontSize: "0.95rem" }}>
              Zahlung (optional)
            </h3>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <label>
                <span>Art</span>
                <select
                  value={zahlungsart}
                  onChange={(e) =>
                    setZahlungsart(e.target.value as Zahlungsart | "")
                  }
                >
                  <option value="">—</option>
                  {ZAHLUNGSARTEN.map((z) => (
                    <option key={z}>{z}</option>
                  ))}
                </select>
              </label>
              <label>
                <span>Datum</span>
                <input
                  type="date"
                  value={zahlungsdatum}
                  onChange={(e) => setZahlungsdatum(e.target.value)}
                />
              </label>
              <label>
                <span>Skonto %</span>
                <input
                  value={skontoStr}
                  onChange={(e) => setSkontoStr(e.target.value)}
                  placeholder="2"
                  style={{ width: 80 }}
                />
              </label>
            </div>
          </section>
        </div>

        {/* Validation Panel */}
        <aside>
          <section
            className="card"
            style={{
              padding: 14,
              marginBottom: 12,
              borderLeft: `4px solid ${validation.isValid ? "#1f7a4d" : "#8a2c2c"}`,
              background: validation.isValid ? "#eaf5ef" : "#fcefea",
              position: "sticky",
              top: 12,
            }}
          >
            <h3
              style={{
                margin: "0 0 8px",
                fontSize: "0.95rem",
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              {validation.isValid ? (
                <CheckCircle2 size={16} color="#1f7a4d" />
              ) : (
                <AlertTriangle size={16} color="#8a2c2c" />
              )}
              Validierung
            </h3>
            <div style={{ fontSize: "0.85rem" }}>
              <div>
                <strong>{validation.errors.length}</strong> Fehler ·{" "}
                <strong>{validation.warnings.length}</strong> Warnungen
              </div>
              <div>
                Soll = Haben:{" "}
                {validation.sollEqualsHaben ? "✓" : "✗"}
              </div>
              <div>
                Brutto = Netto + USt:{" "}
                {validation.bruttoMatchesNettoPlusUst ? "✓" : "✗"}
              </div>
            </div>
            {validation.errors.length > 0 && (
              <ul
                style={{
                  margin: "8px 0 0 16px",
                  fontSize: "0.82rem",
                  color: "#8a2c2c",
                }}
              >
                {validation.errors.map((e, i) => (
                  <li key={i}>
                    <strong>[{e.code}]</strong> {e.message}
                  </li>
                ))}
              </ul>
            )}
            {validation.warnings.length > 0 && (
              <ul
                style={{
                  margin: "8px 0 0 16px",
                  fontSize: "0.82rem",
                  color: "#c76b3f",
                }}
              >
                {validation.warnings.map((w, i) => (
                  <li key={i}>
                    <strong>[{w.code}]</strong> {w.message}
                  </li>
                ))}
              </ul>
            )}
            <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
              <button
                className="btn btn-primary"
                style={{ flex: 1 }}
                onClick={() => persistBeleg("GEBUCHT")}
                disabled={!validation.isValid || submitting}
              >
                <Save size={14} /> {submitting ? "Buche…" : "Buchen"}
              </button>
              <button
                className="btn btn-outline"
                onClick={() => persistBeleg("ENTWURF")}
                disabled={submitting}
                title="Als Entwurf speichern (ohne Journal-Einträge)"
              >
                Entwurf
              </button>
            </div>
            <Link
              to="/buchungen/belege"
              className="btn btn-outline"
              style={{ marginTop: 6, width: "100%", justifyContent: "center" }}
            >
              Zur Belege-Liste
            </Link>
          </section>
        </aside>
      </div>
    </div>
  );
}
