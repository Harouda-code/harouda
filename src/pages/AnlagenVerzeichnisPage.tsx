import { useMemo, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  AlertTriangle,
  ArrowLeft,
  BadgeCheck,
  Building2,
  Check,
  LogOut,
  Pencil,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import Decimal from "decimal.js";
import {
  createAnlagegut,
  deleteAnlagegut,
  fetchAnlagegueter,
  updateAnlagegut,
  type AnlagegutInput,
} from "../api/anlagen";
import { fetchAccounts } from "../api/accounts";
import {
  berechneLineareAfa,
  berechneGwgAfa,
  berechneSammelpostenAfa,
} from "../domain/anlagen/AfaCalculator";
import {
  planAbgang,
  buchtAbgang,
  type AbgangPlan,
} from "../domain/anlagen/AnlagenService";
import { useMandant } from "../contexts/MandantContext";
import { usePermissions } from "../hooks/usePermissions";
import type { Anlagegut } from "../types/db";
import "./ReportView.css";
import "./TaxCalc.css";
import "./CostCentersPage.css";

const EMPTY: AnlagegutInput = {
  inventar_nr: "",
  bezeichnung: "",
  anschaffungsdatum: new Date().toISOString().slice(0, 10),
  anschaffungskosten: 0,
  nutzungsdauer_jahre: 5,
  afa_methode: "linear",
  konto_anlage: "",
  konto_afa: "4830",
  konto_abschreibung_kumuliert: null,
  notizen: "",
};

const euro = new Intl.NumberFormat("de-DE", {
  style: "currency",
  currency: "EUR",
});

type AbgangFormState = {
  abgangsdatum: string;
  erloes_brutto: number;
  ust_satz: number;
  notizen: string;
};

const EMPTY_ABGANG: AbgangFormState = {
  abgangsdatum: new Date().toISOString().slice(0, 10),
  erloes_brutto: 0,
  ust_satz: 19,
  notizen: "",
};

export default function AnlagenVerzeichnisPage() {
  const perms = usePermissions();
  const qc = useQueryClient();
  const { selectedMandantId } = useMandant();
  const [editing, setEditing] = useState<Anlagegut | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<AnlagegutInput>(EMPTY);
  const [abgangFor, setAbgangFor] = useState<Anlagegut | null>(null);
  const [abgangForm, setAbgangForm] = useState<AbgangFormState>(EMPTY_ABGANG);

  const q = useQuery({
    queryKey: ["anlagegueter", selectedMandantId],
    queryFn: () => fetchAnlagegueter(selectedMandantId),
  });
  const accountsQ = useQuery({
    queryKey: ["accounts", "for-anlagen"],
    queryFn: fetchAccounts,
  });

  const createM = useMutation({
    mutationFn: (input: AnlagegutInput) =>
      createAnlagegut(input, selectedMandantId),
    onSuccess: () => {
      toast.success("Anlage angelegt.");
      qc.invalidateQueries({ queryKey: ["anlagegueter"] });
      setCreating(false);
      setForm(EMPTY);
    },
    onError: (err: Error) => toast.error(err.message),
  });
  const updateM = useMutation({
    mutationFn: (args: { id: string; patch: Partial<AnlagegutInput> }) =>
      updateAnlagegut(args.id, args.patch, selectedMandantId),
    onSuccess: () => {
      toast.success("Anlage aktualisiert.");
      qc.invalidateQueries({ queryKey: ["anlagegueter"] });
      setEditing(null);
    },
    onError: (err: Error) => toast.error(err.message),
  });
  const deleteM = useMutation({
    mutationFn: (id: string) => deleteAnlagegut(id, selectedMandantId),
    onSuccess: () => {
      toast.success("Anlage entfernt.");
      qc.invalidateQueries({ queryKey: ["anlagegueter"] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const abgangM = useMutation({
    mutationFn: (plan: AbgangPlan) => buchtAbgang(plan, selectedMandantId),
    onSuccess: (res) => {
      toast.success(
        `Abgang gebucht — ${res.journalEntries.length} Journal-Einträge erzeugt.`
      );
      qc.invalidateQueries({ queryKey: ["anlagegueter"] });
      qc.invalidateQueries({ queryKey: ["journal_entries"] });
      qc.invalidateQueries({ queryKey: ["afa_buchungen"] });
      setAbgangFor(null);
      setAbgangForm(EMPTY_ABGANG);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const abgangPlan = useMemo<AbgangPlan | null>(() => {
    if (!abgangFor) return null;
    try {
      return planAbgang(abgangFor, {
        abgangsdatum: abgangForm.abgangsdatum,
        erloes_brutto: abgangForm.erloes_brutto,
        ust_satz: abgangForm.ust_satz,
      });
    } catch {
      return null;
    }
  }, [abgangFor, abgangForm]);

  const rows = q.data ?? [];
  const heuteJahr = new Date().getFullYear();

  const summary = useMemo(() => {
    let aktiv = 0;
    let akSumme = 0;
    let rbwSumme = 0;
    for (const a of rows) {
      if (!a.aktiv) continue;
      aktiv++;
      akSumme += a.anschaffungskosten;
      if (a.afa_methode === "linear") {
        try {
          const r = berechneLineareAfa({
            anschaffungskosten: new Decimal(a.anschaffungskosten),
            nutzungsdauer_jahre: a.nutzungsdauer_jahre,
            anschaffungsdatum: new Date(a.anschaffungsdatum + "T00:00:00Z"),
            jahr: heuteJahr,
          });
          rbwSumme += r.restbuchwert.toNumber();
        } catch {
          /* ignore per-row */
        }
      } else {
        rbwSumme += a.anschaffungskosten; // Platzhalter bis Teil 2
      }
    }
    return { aktiv, akSumme, rbwSumme };
  }, [rows, heuteJahr]);

  // Live-AfA-Vorschau basierend auf den aktuellen Form-Werten.
  const livePreview = useMemo<
    | {
        jahr: number;
        afa_betrag: number;
        kumuliert: number;
        restbuchwert: number;
      }[]
    | null
  >(() => {
    if (!(creating || editing)) return null;
    if (!(form.anschaffungskosten > 0)) return null;
    if (!form.anschaffungsdatum.match(/^\d{4}-\d{2}-\d{2}$/)) return null;
    try {
      const ak = new Decimal(form.anschaffungskosten);
      const kaufDate = new Date(form.anschaffungsdatum + "T00:00:00Z");
      const startJahr = kaufDate.getUTCFullYear();

      // Endjahr je Methode.
      let endJahr: number;
      if (form.afa_methode === "gwg_sofort") {
        endJahr = startJahr; // nur 1 Zeile
      } else if (form.afa_methode === "sammelposten") {
        endJahr = startJahr + 4; // 5 Jahre fix
      } else if (form.afa_methode === "linear") {
        if (
          !Number.isInteger(form.nutzungsdauer_jahre) ||
          form.nutzungsdauer_jahre < 1 ||
          form.nutzungsdauer_jahre > 50
        )
          return null;
        const monat = kaufDate.getUTCMonth() + 1;
        const hatRestjahr = monat !== 1;
        endJahr =
          startJahr + form.nutzungsdauer_jahre - (hatRestjahr ? 0 : 1);
      } else {
        return null; // degressiv nicht unterstützt
      }

      // Eingabe-Validierung pro Methode (ohne Throw in Calculator)
      if (form.afa_methode === "sammelposten") {
        if (ak.lte(250) || ak.gt(1000)) return null;
      }

      const result: {
        jahr: number;
        afa_betrag: number;
        kumuliert: number;
        restbuchwert: number;
      }[] = [];
      let kumuliert = new Decimal(0);
      for (let j = startJahr; j <= endJahr; j++) {
        let r;
        if (form.afa_methode === "gwg_sofort") {
          r = berechneGwgAfa({
            anschaffungskosten: ak,
            anschaffungsdatum: kaufDate,
            jahr: j,
          });
        } else if (form.afa_methode === "sammelposten") {
          r = berechneSammelpostenAfa({
            anschaffungskosten: ak,
            anschaffungsdatum: kaufDate,
            jahr: j,
          });
        } else {
          r = berechneLineareAfa({
            anschaffungskosten: ak,
            nutzungsdauer_jahre: form.nutzungsdauer_jahre,
            anschaffungsdatum: kaufDate,
            jahr: j,
          });
        }
        kumuliert = kumuliert.plus(r.afa_betrag);
        result.push({
          jahr: j,
          afa_betrag: r.afa_betrag.toNumber(),
          kumuliert: kumuliert.toNumber(),
          restbuchwert: r.restbuchwert.toNumber(),
        });
      }
      return result;
    } catch {
      return null;
    }
  }, [
    creating,
    editing,
    form.afa_methode,
    form.anschaffungskosten,
    form.nutzungsdauer_jahre,
    form.anschaffungsdatum,
  ]);

  // Bestandskonten für Dropdown (0xxx-Bereich).
  const bestandskontenOptions = useMemo(() => {
    const accs = accountsQ.data ?? [];
    return accs
      .filter((a) => {
        const n = Number(a.konto_nr);
        return Number.isFinite(n) && n >= 100 && n <= 999;
      })
      .sort((a, b) => a.konto_nr.localeCompare(b.konto_nr));
  }, [accountsQ.data]);

  function startEdit(a: Anlagegut) {
    setForm({
      inventar_nr: a.inventar_nr,
      bezeichnung: a.bezeichnung,
      anschaffungsdatum: a.anschaffungsdatum,
      anschaffungskosten: a.anschaffungskosten,
      nutzungsdauer_jahre: a.nutzungsdauer_jahre,
      afa_methode: a.afa_methode,
      konto_anlage: a.konto_anlage,
      konto_afa: a.konto_afa,
      konto_abschreibung_kumuliert: a.konto_abschreibung_kumuliert,
      notizen: a.notizen ?? "",
    });
    setEditing(a);
    setCreating(false);
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (editing) updateM.mutate({ id: editing.id, patch: form });
    else createM.mutate(form);
  }

  function aktuelleAfaVorschau(a: Anlagegut): {
    betrag: number;
    restbuchwert: number;
  } {
    if (a.afa_methode !== "linear") {
      return { betrag: 0, restbuchwert: a.anschaffungskosten };
    }
    try {
      const r = berechneLineareAfa({
        anschaffungskosten: new Decimal(a.anschaffungskosten),
        nutzungsdauer_jahre: a.nutzungsdauer_jahre,
        anschaffungsdatum: new Date(a.anschaffungsdatum + "T00:00:00Z"),
        jahr: heuteJahr,
      });
      return {
        betrag: r.afa_betrag.toNumber(),
        restbuchwert: r.restbuchwert.toNumber(),
      };
    } catch {
      return { betrag: 0, restbuchwert: 0 };
    }
  }

  if (!perms.canRead) {
    return (
      <div className="report">
        <header className="report__head">
          <h1>Anlagenverzeichnis</h1>
        </header>
        <aside className="taxcalc__hint">
          <AlertTriangle size={14} />
          <span>Kein Zugriff.</span>
        </aside>
      </div>
    );
  }

  return (
    <div className="report kst">
      <header className="report__head">
        <Link to="/einstellungen" className="report__back">
          <ArrowLeft size={16} />
          Zurück zu Einstellungen
        </Link>
        <div className="report__head-title">
          <h1>
            <Building2
              size={22}
              style={{ verticalAlign: "-3px", marginRight: 8 }}
            />
            Anlagenverzeichnis
          </h1>
          <p>
            Anlagegüter nach § 253 HGB mit linearer AfA (§ 7 Abs. 1 EStG).
            Aktueller Bestand: {summary.aktiv} aktive Anlage
            {summary.aktiv === 1 ? "" : "n"} · AK-Summe{" "}
            {euro.format(summary.akSumme)} · Buchwert {euro.format(summary.rbwSumme)}{" "}
            zum {heuteJahr}.
          </p>
        </div>
        <div className="period">
          <Link to="/anlagen/afa-lauf" className="btn btn-outline">
            AfA-Lauf
          </Link>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => {
              setForm(EMPTY);
              setCreating(true);
              setEditing(null);
            }}
            disabled={!perms.canWrite}
          >
            <Plus size={16} /> Neue Anlage
          </button>
        </div>
      </header>

      <aside className="taxcalc__hint">
        <BadgeCheck size={14} />
        <span>
          Stammdaten sind <strong>nicht</strong> Teil der Journal-Hash-Kette
          (Migration 0025). AfA-Buchungen selbst laufen durch das Journal und
          unterliegen der Hash-Kette + Festschreibung.
        </span>
      </aside>

      {(creating || editing) && (
        <section className="card kst__form">
          <header>
            <h2>
              {editing
                ? `Bearbeiten: ${editing.inventar_nr}`
                : "Neue Anlage"}
            </h2>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => {
                setCreating(false);
                setEditing(null);
              }}
            >
              <X size={14} />
            </button>
          </header>
          <form className="form-grid" onSubmit={handleSubmit}>
            <label className="form-field">
              <span>Inventar-Nr *</span>
              <input
                value={form.inventar_nr}
                onChange={(e) =>
                  setForm({ ...form, inventar_nr: e.target.value })
                }
                placeholder="z. B. INV-2025-001"
                maxLength={20}
                required
              />
            </label>
            <label className="form-field form-field--wide">
              <span>Bezeichnung *</span>
              <input
                value={form.bezeichnung}
                onChange={(e) =>
                  setForm({ ...form, bezeichnung: e.target.value })
                }
                maxLength={100}
                required
              />
            </label>
            <label className="form-field">
              <span>Anschaffungsdatum *</span>
              <input
                type="date"
                value={form.anschaffungsdatum}
                onChange={(e) =>
                  setForm({ ...form, anschaffungsdatum: e.target.value })
                }
                required
              />
            </label>
            <label className="form-field">
              <span>Anschaffungskosten (€) *</span>
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={form.anschaffungskosten || ""}
                onChange={(e) =>
                  setForm({
                    ...form,
                    anschaffungskosten: Number(e.target.value),
                  })
                }
                required
              />
            </label>
            <label className="form-field">
              <span>
                Nutzungsdauer (Jahre) *
                {form.afa_methode === "gwg_sofort"
                  ? " — fest 1 (GWG)"
                  : form.afa_methode === "sammelposten"
                    ? " — fest 5 (Sammelposten)"
                    : ""}
              </span>
              <input
                type="number"
                min="1"
                max="50"
                step="1"
                value={form.nutzungsdauer_jahre}
                onChange={(e) =>
                  setForm({
                    ...form,
                    nutzungsdauer_jahre: Number(e.target.value),
                  })
                }
                disabled={
                  form.afa_methode === "gwg_sofort" ||
                  form.afa_methode === "sammelposten"
                }
                required
              />
            </label>
            <label className="form-field">
              <span>AfA-Methode *</span>
              <select
                value={form.afa_methode}
                onChange={(e) => {
                  const methode = e.target
                    .value as AnlagegutInput["afa_methode"];
                  // ND auto-setzen je Methode
                  const nd =
                    methode === "gwg_sofort"
                      ? 1
                      : methode === "sammelposten"
                        ? 5
                        : form.nutzungsdauer_jahre || 5;
                  setForm({
                    ...form,
                    afa_methode: methode,
                    nutzungsdauer_jahre: nd,
                  });
                }}
              >
                <option value="linear">Linear (§ 7 Abs. 1 EStG)</option>
                <option value="gwg_sofort">
                  GWG Sofort (§ 6 Abs. 2 EStG, ≤ 800 € netto)
                </option>
                <option value="sammelposten">
                  Sammelposten (§ 6 Abs. 2a EStG, 250 - 1.000 € netto, 5 J.)
                </option>
                <option value="degressiv" disabled>
                  Degressiv — aktuell nicht verfügbar (§ 7 Abs. 2 EStG
                  ausgelaufen 31.12.2024)
                </option>
              </select>
            </label>
            {form.afa_methode === "gwg_sofort" && (
              <div
                className="form-field form-field--wide"
                style={{
                  fontSize: "0.82rem",
                  color: "var(--muted)",
                  padding: "4px 0",
                }}
              >
                <strong>GWG § 6 Abs. 2 EStG:</strong> Sofortabschreibung im
                Anschaffungsjahr, max. 800 € netto. Üblich: Anlage-Konto
                0480, AfA-Konto 4840.
                {form.anschaffungskosten > 800 && (
                  <>
                    {" "}
                    <strong style={{ color: "var(--warning, #b88a00)" }}>
                      Hinweis: AK {form.anschaffungskosten.toFixed(2)} €
                      überschreitet die GWG-Grenze — prüfen Sie Netto/Brutto-
                      Eingabe.
                    </strong>
                  </>
                )}
              </div>
            )}
            {form.afa_methode === "sammelposten" && (
              <div
                className="form-field form-field--wide"
                style={{
                  fontSize: "0.82rem",
                  color: "var(--muted)",
                  padding: "4px 0",
                }}
              >
                <strong>Sammelposten § 6 Abs. 2a EStG:</strong> Pool-AfA
                linear über 5 Jahre, volle Jahresrate im Anschaffungsjahr
                (keine Monatsanteile). AK muss {">"} 250 € und ≤ 1.000 €
                netto liegen. <strong>Einzel-Abgänge</strong> aus dem Pool
                sind nach Satz 3 nicht zulässig — der Pool läuft in der
                5-Jahres-Kadenz weiter.
                {(form.anschaffungskosten <= 250 ||
                  form.anschaffungskosten > 1000) && (
                  <>
                    {" "}
                    <strong style={{ color: "var(--danger, #8a2c2c)" }}>
                      AK {form.anschaffungskosten.toFixed(2)} € liegt außerhalb
                      des Sammelposten-Bereichs.
                    </strong>
                  </>
                )}
              </div>
            )}
            <label className="form-field">
              <span>Anlage-Konto (Bestand) *</span>
              <select
                value={form.konto_anlage}
                onChange={(e) =>
                  setForm({ ...form, konto_anlage: e.target.value })
                }
                required
              >
                <option value="">— wählen —</option>
                {bestandskontenOptions.map((a) => (
                  <option key={a.id} value={a.konto_nr}>
                    {a.konto_nr} — {a.bezeichnung}
                  </option>
                ))}
              </select>
            </label>
            <label className="form-field">
              <span>AfA-Aufwandskonto *</span>
              <input
                value={form.konto_afa}
                onChange={(e) =>
                  setForm({ ...form, konto_afa: e.target.value })
                }
                placeholder="z. B. 4830"
                required
              />
            </label>
            <label className="form-field">
              <span>Konto kumulierte AfA (optional)</span>
              <input
                value={form.konto_abschreibung_kumuliert ?? ""}
                onChange={(e) =>
                  setForm({
                    ...form,
                    konto_abschreibung_kumuliert: e.target.value || null,
                  })
                }
                placeholder="leer → direkte Netto-Methode"
              />
            </label>
            <label className="form-field form-field--wide">
              <span>Notizen</span>
              <input
                value={form.notizen ?? ""}
                onChange={(e) => setForm({ ...form, notizen: e.target.value })}
              />
            </label>
            {livePreview && livePreview.length > 0 && (
              <div className="form-field form-field--wide">
                <span style={{ fontWeight: 600, marginBottom: 6 }}>
                  Live-AfA-Vorschau (lineare AfA, monatsgenau)
                </span>
                <div
                  style={{
                    maxHeight: 320,
                    overflowY: "auto",
                    border: "1px solid var(--border)",
                    borderRadius: 4,
                  }}
                >
                  <table style={{ width: "100%", fontSize: "0.85rem" }}>
                    <thead
                      style={{
                        position: "sticky",
                        top: 0,
                        background: "var(--surface)",
                      }}
                    >
                      <tr>
                        <th>Jahr</th>
                        <th style={{ textAlign: "right" }}>AfA</th>
                        <th style={{ textAlign: "right" }}>Kumuliert</th>
                        <th style={{ textAlign: "right" }}>Restbuchwert</th>
                      </tr>
                    </thead>
                    <tbody>
                      {livePreview.map((r) => (
                        <tr key={r.jahr}>
                          <td className="mono">{r.jahr}</td>
                          <td
                            className="mono"
                            style={{ textAlign: "right" }}
                          >
                            {euro.format(r.afa_betrag)}
                          </td>
                          <td
                            className="mono"
                            style={{ textAlign: "right" }}
                          >
                            {euro.format(r.kumuliert)}
                          </td>
                          <td
                            className="mono"
                            style={{ textAlign: "right" }}
                          >
                            {euro.format(r.restbuchwert)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            <div className="form-field form-field--wide kst__form-actions">
              <button
                type="submit"
                className="btn btn-primary"
                disabled={createM.isPending || updateM.isPending}
              >
                {editing ? "Speichern" : "Anlegen"}
              </button>
            </div>
          </form>
        </section>
      )}

      {abgangFor && (
        <section
          className="card kst__form"
          style={{ borderLeft: "4px solid var(--gold-700, #b88a00)" }}
        >
          <header>
            <h2>
              Abgang buchen: {abgangFor.inventar_nr} — {abgangFor.bezeichnung}
            </h2>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => {
                setAbgangFor(null);
                setAbgangForm(EMPTY_ABGANG);
              }}
            >
              <X size={14} />
            </button>
          </header>
          <div className="form-grid">
            <label className="form-field">
              <span>Abgangsdatum *</span>
              <input
                type="date"
                value={abgangForm.abgangsdatum}
                min={abgangFor.anschaffungsdatum}
                onChange={(e) =>
                  setAbgangForm({ ...abgangForm, abgangsdatum: e.target.value })
                }
              />
            </label>
            <label className="form-field">
              <span>Erlös brutto (€) — 0 = Verschrottung</span>
              <input
                type="number"
                step="0.01"
                min="0"
                value={abgangForm.erloes_brutto || ""}
                onChange={(e) =>
                  setAbgangForm({
                    ...abgangForm,
                    erloes_brutto: Number(e.target.value) || 0,
                  })
                }
              />
            </label>
            <label className="form-field">
              <span>USt-Satz</span>
              <select
                value={abgangForm.ust_satz}
                onChange={(e) =>
                  setAbgangForm({
                    ...abgangForm,
                    ust_satz: Number(e.target.value),
                  })
                }
              >
                <option value={0}>0 % (steuerfrei/Verschrottung)</option>
                <option value={7}>7 %</option>
                <option value={19}>19 % (Regel-Verkauf)</option>
              </select>
            </label>
            <label className="form-field form-field--wide">
              <span>Notizen (optional)</span>
              <input
                value={abgangForm.notizen}
                onChange={(e) =>
                  setAbgangForm({ ...abgangForm, notizen: e.target.value })
                }
                placeholder="z. B. Verkauf an Händler XY"
              />
            </label>
          </div>

          {abgangPlan && (
            <section style={{ marginTop: 12 }}>
              <h3 style={{ margin: "0 0 6px", fontSize: "0.95rem" }}>
                Buchungs-Vorschau ({abgangPlan.lines.length} Zeile
                {abgangPlan.lines.length === 1 ? "" : "n"})
              </h3>
              <p className="reconc__muted" style={{ margin: "0 0 6px" }}>
                {abgangPlan.ist_verschrottung
                  ? `Verschrottung — Restbuchwert ${euro.format(
                      abgangPlan.restbuchwert_am_abgang
                    )} wird als Aufwand (2800) ausgebucht.`
                  : abgangPlan.gewinn_verlust > 0
                    ? `Buchgewinn ${euro.format(
                        abgangPlan.gewinn_verlust
                      )} auf Konto 2700 (Außerordentliche Erträge).`
                    : abgangPlan.gewinn_verlust < 0
                      ? `Buchverlust ${euro.format(
                          -abgangPlan.gewinn_verlust
                        )} auf Konto 2800 (Außerordentliche Aufwendungen).`
                      : "Neutraler Abgang — Erlös entspricht Restbuchwert."}
                {" · Teil-AfA bis Abgangsmonat: "}
                {euro.format(abgangPlan.teil_afa_betrag)}
                {" · RBW am Abgang: "}
                {euro.format(abgangPlan.restbuchwert_am_abgang)}
              </p>
              <table>
                <thead>
                  <tr>
                    <th>Rolle</th>
                    <th>Soll</th>
                    <th>Haben</th>
                    <th style={{ textAlign: "right" }}>Betrag</th>
                    <th>Beschreibung</th>
                  </tr>
                </thead>
                <tbody>
                  {abgangPlan.lines.map((line, i) => (
                    <tr key={i}>
                      <td>{line.rolle}</td>
                      <td className="mono">{line.soll_konto}</td>
                      <td className="mono">{line.haben_konto}</td>
                      <td
                        className="mono"
                        style={{ textAlign: "right" }}
                      >
                        {euro.format(line.betrag)}
                      </td>
                      <td>{line.beschreibung}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          )}

          <div className="form-field form-field--wide kst__form-actions">
            <button
              type="button"
              className="btn btn-primary"
              disabled={
                !abgangPlan ||
                !perms.canWrite ||
                abgangM.isPending ||
                abgangPlan.lines.length === 0
              }
              onClick={() => {
                if (!abgangPlan) return;
                if (
                  confirm(
                    `Abgang für ${abgangFor.inventar_nr} mit ${abgangPlan.lines.length} ` +
                      `Buchung${abgangPlan.lines.length === 1 ? "" : "en"} bestätigen?`
                  )
                ) {
                  abgangM.mutate(abgangPlan);
                }
              }}
            >
              <Check size={14} /> Abgang buchen ({abgangPlan?.lines.length ?? 0} Zeilen)
            </button>
            <button
              type="button"
              className="btn btn-outline"
              onClick={() => {
                setAbgangFor(null);
                setAbgangForm(EMPTY_ABGANG);
              }}
            >
              Abbrechen
            </button>
          </div>
        </section>
      )}

      <section className="card kst__list">
        {rows.length === 0 ? (
          <p className="kst__empty">
            Noch keine Anlagen. „Neue Anlage" klicken, um zu beginnen.
          </p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Inventar-Nr</th>
                <th>Bezeichnung</th>
                <th>Kauf</th>
                <th style={{ textAlign: "right" }}>AK</th>
                <th style={{ textAlign: "right" }}>ND</th>
                <th>Anlage-Konto</th>
                <th style={{ textAlign: "right" }}>AfA {heuteJahr}</th>
                <th style={{ textAlign: "right" }}>Restbuchwert</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((a) => {
                const preview = aktuelleAfaVorschau(a);
                return (
                  <tr key={a.id} className={a.aktiv ? "" : "is-inactive"}>
                    <td className="mono">{a.inventar_nr}</td>
                    <td>
                      <strong>{a.bezeichnung}</strong>
                    </td>
                    <td className="mono">
                      {new Date(a.anschaffungsdatum).toLocaleDateString("de-DE")}
                    </td>
                    <td className="mono" style={{ textAlign: "right" }}>
                      {euro.format(a.anschaffungskosten)}
                    </td>
                    <td className="mono" style={{ textAlign: "right" }}>
                      {a.nutzungsdauer_jahre} J.
                    </td>
                    <td className="mono">{a.konto_anlage}</td>
                    <td className="mono" style={{ textAlign: "right" }}>
                      {euro.format(preview.betrag)}
                    </td>
                    <td className="mono" style={{ textAlign: "right" }}>
                      {euro.format(preview.restbuchwert)}
                    </td>
                    <td>
                      {a.aktiv ? (
                        <span className="kst__badge is-active">aktiv</span>
                      ) : (
                        <span className="kst__badge">Abgang</span>
                      )}
                    </td>
                    <td>
                      <div className="kst__actions">
                        <button
                          type="button"
                          onClick={() => startEdit(a)}
                          title="Bearbeiten"
                          disabled={!perms.canWrite || !a.aktiv}
                        >
                          <Pencil size={14} />
                        </button>
                        {a.aktiv && (
                          <button
                            type="button"
                            onClick={() => {
                              setAbgangFor(a);
                              setAbgangForm({
                                ...EMPTY_ABGANG,
                                abgangsdatum: new Date()
                                  .toISOString()
                                  .slice(0, 10),
                              });
                              setCreating(false);
                              setEditing(null);
                            }}
                            title="Abgang buchen"
                            disabled={!perms.canWrite}
                          >
                            <LogOut size={14} />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            if (
                              confirm(
                                `Anlage ${a.inventar_nr} (${a.bezeichnung}) löschen?\n` +
                                  "Die zugehörigen AfA-Buchungen in afa_buchungen werden mit entfernt."
                              )
                            ) {
                              deleteM.mutate(a.id);
                            }
                          }}
                          title="Entfernen"
                          disabled={!perms.canWrite}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
