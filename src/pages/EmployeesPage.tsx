import { useMemo, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  AlertTriangle,
  ArrowLeft,
  Pencil,
  Plus,
  Trash2,
  UserRound,
  X,
} from "lucide-react";
import {
  createEmployee,
  deleteEmployee,
  fetchEmployees,
  updateEmployee,
  type EmployeeInput,
} from "../api/employees";
import { useMandant } from "../contexts/MandantContext";
import { SvDataIncompleteBanner } from "../components/employees/SvDataIncompleteBanner";
import {
  isEmployeeSvDataComplete,
} from "../domain/employees/svCompleteness";
import { usePermissions } from "../hooks/usePermissions";
import type {
  Beschaeftigungsart,
  Employee,
  Steuerklasse,
} from "../types/db";
import "./ReportView.css";
import "./TaxCalc.css";
import "./EmployeesPage.css";

const EMPTY: EmployeeInput = {
  personalnummer: "",
  vorname: "",
  nachname: "",
  steuer_id: null,
  sv_nummer: null,
  steuerklasse: "I",
  kinderfreibetraege: 0,
  konfession: null,
  bundesland: "Berlin",
  einstellungsdatum: new Date().toISOString().slice(0, 10),
  austrittsdatum: null,
  beschaeftigungsart: "vollzeit",
  wochenstunden: 40,
  bruttogehalt_monat: 3500,
  stundenlohn: null,
  krankenkasse: null,
  zusatzbeitrag_pct: 1.7,
  privat_versichert: false,
  pv_kinderlos: false,
  pv_kinder_anzahl: 0,
  iban: null,
  bic: null,
  kontoinhaber: null,
  notes: null,
  is_active: true,
};

export default function EmployeesPage() {
  const perms = usePermissions();
  const qc = useQueryClient();
  const { selectedMandantId } = useMandant();
  const [editing, setEditing] = useState<Employee | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<EmployeeInput>(EMPTY);

  const employeesQ = useQuery({
    queryKey: ["employees", selectedMandantId],
    queryFn: () => fetchEmployees(selectedMandantId),
  });

  const createM = useMutation({
    mutationFn: (input: EmployeeInput) => createEmployee(input, selectedMandantId),
    onSuccess: () => {
      toast.success("Mitarbeiter angelegt.");
      qc.invalidateQueries({ queryKey: ["employees"] });
      setCreating(false);
      setForm(EMPTY);
    },
    onError: (err: Error) => toast.error(err.message),
  });
  const updateM = useMutation({
    mutationFn: (args: { id: string; patch: Partial<EmployeeInput> }) =>
      updateEmployee(args.id, args.patch, selectedMandantId),
    onSuccess: () => {
      toast.success("Mitarbeiter aktualisiert.");
      qc.invalidateQueries({ queryKey: ["employees"] });
      setEditing(null);
    },
    onError: (err: Error) => toast.error(err.message),
  });
  const deleteM = useMutation({
    mutationFn: (id: string) => deleteEmployee(id, selectedMandantId),
    onSuccess: () => {
      toast.success("Mitarbeiter entfernt.");
      qc.invalidateQueries({ queryKey: ["employees"] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const rows = employeesQ.data ?? [];
  const active = useMemo(() => rows.filter((e) => e.is_active).length, [rows]);

  function startCreate() {
    setForm(EMPTY);
    setCreating(true);
    setEditing(null);
  }

  function startEdit(emp: Employee) {
    const { id: _id, company_id: _c, created_at: _ca, updated_at: _ua, ...rest } = emp;
    void _id;
    void _c;
    void _ca;
    void _ua;
    setForm(rest);
    setEditing(emp);
    setCreating(false);
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (editing) {
      updateM.mutate({ id: editing.id, patch: form });
    } else {
      createM.mutate(form);
    }
  }

  function handleDelete(emp: Employee) {
    if (
      confirm(
        `Mitarbeiter ${emp.personalnummer} (${emp.vorname} ${emp.nachname}) wirklich entfernen?`
      )
    ) {
      deleteM.mutate(emp.id);
    }
  }

  if (!perms.canRead) {
    return (
      <div className="report">
        <header className="report__head">
          <h1>Mitarbeiter</h1>
        </header>
        <aside className="taxcalc__hint">
          <AlertTriangle size={14} />
          <span>Kein Zugriff.</span>
        </aside>
      </div>
    );
  }

  return (
    <div className="report empl">
      <header className="report__head">
        <Link to="/dashboard" className="report__back">
          <ArrowLeft size={16} />
          Zurück zum Dashboard
        </Link>
        <div className="report__head-title">
          <h1>
            <UserRound
              size={22}
              style={{ verticalAlign: "-3px", marginRight: 8 }}
            />
            Mitarbeiter-Stammdaten
          </h1>
          <p>
            Pflege der für die Lohn-Vorbereitung nötigen Daten. Diese App ist
            <strong> keine zertifizierte Lohnsoftware</strong> — SV-Meldungen
            erfolgen über ein ITSG-zertifiziertes Programm.
          </p>
        </div>
        <div className="period">
          <button
            type="button"
            className="btn btn-primary"
            onClick={startCreate}
            disabled={!perms.canAdmin}
          >
            <Plus size={16} /> Mitarbeiter anlegen
          </button>
        </div>
      </header>

      <aside className="taxcalc__hint">
        <AlertTriangle size={14} />
        <span>
          <strong>Datenschutz-Hinweis:</strong> Steuer-ID und
          Sozialversicherungsnummer sind besonders sensibel. Zugriff ist
          auf Owner/Admin beschränkt; Änderungen werden im Audit-Log
          protokolliert.
        </span>
      </aside>

      <section className="card empl__summary">
        <div>
          <dt>Mitarbeiter gesamt</dt>
          <dd>{rows.length}</dd>
        </div>
        <div>
          <dt>Aktiv</dt>
          <dd>{active}</dd>
        </div>
        <div>
          <dt>Ausgetreten</dt>
          <dd>{rows.length - active}</dd>
        </div>
      </section>

      {(creating || editing) && (
        <section className="card empl__form">
          <header>
            <h2>
              {editing
                ? `Mitarbeiter bearbeiten: ${editing.personalnummer}`
                : "Neuer Mitarbeiter"}
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
          {editing && (
            <SvDataIncompleteBanner employee={editing} />
          )}
          <EmployeeForm
            form={form}
            onChange={setForm}
            onSubmit={handleSubmit}
            busy={createM.isPending || updateM.isPending}
            isEdit={!!editing}
          />
        </section>
      )}

      <section className="card empl__list">
        {rows.length === 0 ? (
          <p className="empl__empty">
            Noch keine Mitarbeiter angelegt. „Mitarbeiter anlegen" klicken,
            um die Stammdaten zu erfassen.
          </p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Pers-Nr.</th>
                <th>Name</th>
                <th>St-Klasse</th>
                <th>Beschäftigung</th>
                <th className="is-num">Brutto / Monat</th>
                <th>Krankenkasse</th>
                <th>Status</th>
                <th>SV-Stammdaten</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((e) => {
                const sv = isEmployeeSvDataComplete(e);
                return (
                <tr key={e.id} className={e.is_active ? "" : "is-inactive"}>
                  <td className="mono">{e.personalnummer}</td>
                  <td>
                    <strong>
                      {e.nachname}, {e.vorname}
                    </strong>
                  </td>
                  <td>{e.steuerklasse}</td>
                  <td>{e.beschaeftigungsart}</td>
                  <td className="is-num mono">
                    {e.bruttogehalt_monat != null
                      ? `${e.bruttogehalt_monat.toFixed(2)} €`
                      : e.stundenlohn != null
                        ? `${e.stundenlohn.toFixed(2)} €/Std.`
                        : "—"}
                  </td>
                  <td>
                    {e.privat_versichert ? "privat" : e.krankenkasse ?? "—"}
                  </td>
                  <td>
                    {e.is_active ? (
                      <span className="empl__badge is-active">aktiv</span>
                    ) : (
                      <span className="empl__badge">ausgetreten</span>
                    )}
                  </td>
                  <td>
                    {sv.complete ? (
                      <span
                        className="empl__badge is-active"
                        data-testid={`sv-badge-ok-${e.id}`}
                        title="Alle SV-Pflichtfelder gesetzt"
                      >
                        vollständig
                      </span>
                    ) : (
                      <span
                        className="empl__badge"
                        data-testid={`sv-badge-missing-${e.id}`}
                        data-missing-count={sv.missing.length}
                        title={`${sv.missing.length} Pflichtfeld(er) fehlen`}
                        style={{ background: "rgba(210, 120, 70, 0.2)" }}
                      >
                        unvollständig ({sv.missing.length})
                      </span>
                    )}
                  </td>
                  <td>
                    <div className="empl__actions">
                      <button
                        type="button"
                        onClick={() => startEdit(e)}
                        title="Bearbeiten"
                        disabled={!perms.canAdmin}
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(e)}
                        title="Entfernen"
                        disabled={!perms.canAdmin}
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

function EmployeeForm({
  form,
  onChange,
  onSubmit,
  busy,
  isEdit,
}: {
  form: EmployeeInput;
  onChange: (next: EmployeeInput) => void;
  onSubmit: (e: FormEvent) => void;
  busy: boolean;
  isEdit: boolean;
}) {
  function set<K extends keyof EmployeeInput>(key: K, value: EmployeeInput[K]) {
    onChange({ ...form, [key]: value });
  }
  return (
    <form className="form-grid" onSubmit={onSubmit}>
      <label className="form-field">
        <span>Personalnummer *</span>
        <input
          value={form.personalnummer}
          onChange={(e) => set("personalnummer", e.target.value)}
          required
        />
      </label>
      <label className="form-field">
        <span>Beschäftigungsart *</span>
        <select
          value={form.beschaeftigungsart}
          onChange={(e) =>
            set("beschaeftigungsart", e.target.value as Beschaeftigungsart)
          }
        >
          <option value="vollzeit">Vollzeit</option>
          <option value="teilzeit">Teilzeit</option>
          <option value="minijob">Mini-Job (≤ € 556)</option>
          <option value="midijob">Midi-Job (€ 556,01–2.000)</option>
          <option value="ausbildung">Ausbildung</option>
        </select>
      </label>

      <label className="form-field">
        <span>Vorname *</span>
        <input
          value={form.vorname}
          onChange={(e) => set("vorname", e.target.value)}
          required
        />
      </label>
      <label className="form-field">
        <span>Nachname *</span>
        <input
          value={form.nachname}
          onChange={(e) => set("nachname", e.target.value)}
          required
        />
      </label>

      <label className="form-field">
        <span>Steuer-ID (11 Ziffern)</span>
        <input
          value={form.steuer_id ?? ""}
          onChange={(e) => set("steuer_id", e.target.value || null)}
          pattern="[0-9]{11}"
          maxLength={11}
        />
      </label>
      <label className="form-field">
        <span>Sozialversicherungsnummer</span>
        <input
          value={form.sv_nummer ?? ""}
          onChange={(e) => set("sv_nummer", e.target.value || null)}
          placeholder="z. B. 15 100893 M 031"
        />
      </label>

      <label className="form-field">
        <span>Steuerklasse</span>
        <select
          value={form.steuerklasse}
          onChange={(e) => set("steuerklasse", e.target.value as Steuerklasse)}
        >
          {["I", "II", "III", "IV", "V", "VI"].map((k) => (
            <option key={k} value={k}>
              {k}
            </option>
          ))}
        </select>
      </label>
      <label className="form-field">
        <span>Kinderfreibeträge (halbe)</span>
        <input
          type="number"
          min={0}
          max={10}
          step={0.5}
          value={form.kinderfreibetraege}
          onChange={(e) =>
            set("kinderfreibetraege", Number(e.target.value) || 0)
          }
        />
      </label>

      <label className="form-field">
        <span>Konfession (leer = keine KiSt)</span>
        <input
          value={form.konfession ?? ""}
          onChange={(e) => set("konfession", e.target.value || null)}
          placeholder="ev, rk, …"
        />
      </label>
      <label className="form-field">
        <span>Bundesland (für KiSt-Satz)</span>
        <input
          value={form.bundesland ?? ""}
          onChange={(e) => set("bundesland", e.target.value || null)}
        />
      </label>

      <label className="form-field">
        <span>Bruttogehalt / Monat (€)</span>
        <input
          type="number"
          step="0.01"
          value={form.bruttogehalt_monat ?? ""}
          onChange={(e) =>
            set(
              "bruttogehalt_monat",
              e.target.value === "" ? null : Number(e.target.value)
            )
          }
        />
      </label>
      <label className="form-field">
        <span>Wochenstunden</span>
        <input
          type="number"
          step="0.5"
          value={form.wochenstunden ?? ""}
          onChange={(e) =>
            set(
              "wochenstunden",
              e.target.value === "" ? null : Number(e.target.value)
            )
          }
        />
      </label>

      <label className="form-field">
        <span>Einstellungsdatum</span>
        <input
          type="date"
          value={form.einstellungsdatum ?? ""}
          onChange={(e) => set("einstellungsdatum", e.target.value || null)}
        />
      </label>
      <label className="form-field">
        <span>Austrittsdatum</span>
        <input
          type="date"
          value={form.austrittsdatum ?? ""}
          onChange={(e) => set("austrittsdatum", e.target.value || null)}
        />
      </label>

      <label className="form-field">
        <span>Krankenkasse</span>
        <input
          value={form.krankenkasse ?? ""}
          onChange={(e) => set("krankenkasse", e.target.value || null)}
          placeholder="z. B. AOK Bayern, TK, Barmer"
          disabled={form.privat_versichert}
        />
      </label>
      <label className="form-field">
        <span>Zusatzbeitrag %</span>
        <input
          type="number"
          step="0.01"
          value={form.zusatzbeitrag_pct ?? ""}
          onChange={(e) =>
            set(
              "zusatzbeitrag_pct",
              e.target.value === "" ? null : Number(e.target.value)
            )
          }
          disabled={form.privat_versichert}
        />
      </label>

      <label className="form-field">
        <span>Privat versichert</span>
        <input
          type="checkbox"
          checked={form.privat_versichert}
          onChange={(e) => set("privat_versichert", e.target.checked)}
        />
      </label>
      <label className="form-field">
        <span>Kinderlos & 23+ (PV-Zuschlag)</span>
        <input
          type="checkbox"
          checked={form.pv_kinderlos}
          onChange={(e) => set("pv_kinderlos", e.target.checked)}
        />
      </label>

      <label className="form-field">
        <span>Berücksichtigte Kinder PV</span>
        <input
          type="number"
          min={0}
          max={10}
          value={form.pv_kinder_anzahl}
          onChange={(e) =>
            set("pv_kinder_anzahl", Math.max(0, Number(e.target.value) || 0))
          }
        />
      </label>
      <label className="form-field">
        <span>Aktiv</span>
        <input
          type="checkbox"
          checked={form.is_active}
          onChange={(e) => set("is_active", e.target.checked)}
        />
      </label>

      <label className="form-field form-field--wide">
        <span>IBAN (für SEPA-Überweisung)</span>
        <input
          value={form.iban ?? ""}
          onChange={(e) => set("iban", e.target.value || null)}
        />
      </label>
      <label className="form-field">
        <span>BIC</span>
        <input
          value={form.bic ?? ""}
          onChange={(e) => set("bic", e.target.value || null)}
        />
      </label>
      <label className="form-field">
        <span>Kontoinhaber (abweichend)</span>
        <input
          value={form.kontoinhaber ?? ""}
          onChange={(e) => set("kontoinhaber", e.target.value || null)}
        />
      </label>

      {/* SV-Stammdaten-Section (Sprint 18 / Migration 0032). */}
      <div
        id="sv-stammdaten"
        className="form-field form-field--wide"
        data-testid="form-section-sv-stammdaten"
      >
        <h3 style={{ margin: "12px 0 4px" }}>SV-Stammdaten (DEUeV)</h3>
        <p style={{ color: "var(--muted)", fontSize: "0.82rem" }}>
          Pflichtfelder für SV-Meldungen nach § 28a SGB IV. Leere Felder
          verhindern die Generierung von DEUeV-Datensätzen.
        </p>
      </div>
      <label className="form-field">
        <span>Staatsangehörigkeit (ISO, z. B. DE)</span>
        <input
          value={form.staatsangehoerigkeit ?? ""}
          onChange={(e) =>
            set("staatsangehoerigkeit", e.target.value || null)
          }
          data-testid="input-staatsangehoerigkeit"
        />
      </label>
      <label className="form-field">
        <span>Tätigkeitsschlüssel (9-stellig)</span>
        <input
          value={form.taetigkeitsschluessel ?? ""}
          pattern="[0-9]{9}"
          onChange={(e) =>
            set("taetigkeitsschluessel", e.target.value || null)
          }
          data-testid="input-taetigkeitsschluessel"
        />
      </label>
      <label className="form-field">
        <span>Einzugsstelle BBNR (8-stellig)</span>
        <input
          value={form.einzugsstelle_bbnr ?? ""}
          pattern="[0-9]{8}"
          onChange={(e) =>
            set("einzugsstelle_bbnr", e.target.value || null)
          }
          data-testid="input-einzugsstelle-bbnr"
        />
      </label>
      <label className="form-field">
        <span>Geburtsname (optional)</span>
        <input
          value={form.geburtsname ?? ""}
          onChange={(e) => set("geburtsname", e.target.value || null)}
        />
      </label>
      <label className="form-field">
        <span>Geburtsort (optional)</span>
        <input
          value={form.geburtsort ?? ""}
          onChange={(e) => set("geburtsort", e.target.value || null)}
        />
      </label>
      <label className="form-field">
        <span>Mehrfachbeschäftigung</span>
        <input
          type="checkbox"
          checked={form.mehrfachbeschaeftigung ?? false}
          onChange={(e) =>
            set("mehrfachbeschaeftigung", e.target.checked)
          }
        />
      </label>

      <div
        className="form-field form-field--wide"
        data-testid="form-section-anschrift"
      >
        <h3 style={{ margin: "12px 0 4px" }}>Anschrift</h3>
      </div>
      <label className="form-field">
        <span>Straße</span>
        <input
          value={form.anschrift_strasse ?? ""}
          onChange={(e) =>
            set("anschrift_strasse", e.target.value || null)
          }
          data-testid="input-anschrift-strasse"
        />
      </label>
      <label className="form-field">
        <span>Hausnummer</span>
        <input
          value={form.anschrift_hausnummer ?? ""}
          onChange={(e) =>
            set("anschrift_hausnummer", e.target.value || null)
          }
        />
      </label>
      <label className="form-field">
        <span>PLZ</span>
        <input
          value={form.anschrift_plz ?? ""}
          pattern="[0-9]{4,5}"
          onChange={(e) => set("anschrift_plz", e.target.value || null)}
          data-testid="input-anschrift-plz"
        />
      </label>
      <label className="form-field">
        <span>Ort</span>
        <input
          value={form.anschrift_ort ?? ""}
          onChange={(e) => set("anschrift_ort", e.target.value || null)}
        />
      </label>

      <label className="form-field form-field--wide">
        <span>Notizen</span>
        <textarea
          value={form.notes ?? ""}
          onChange={(e) => set("notes", e.target.value || null)}
          rows={2}
        />
      </label>

      <div className="form-field form-field--wide empl__form-actions">
        <button type="submit" className="btn btn-primary" disabled={busy}>
          {isEdit ? "Speichern" : "Anlegen"}
        </button>
      </div>
    </form>
  );
}
