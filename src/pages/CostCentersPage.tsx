import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  AlertTriangle,
  ArrowLeft,
  BadgeCheck,
  Layers,
  Pencil,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import {
  createCostCenter,
  deleteCostCenter,
  fetchCostCenters,
  updateCostCenter,
  type CostCenterInput,
} from "../api/costCenters";
import { usePermissions } from "../hooks/usePermissions";
import type { CostCenter } from "../types/db";
import "./ReportView.css";
import "./TaxCalc.css";
import "./CostCentersPage.css";

const EMPTY: CostCenterInput = {
  code: "",
  name: "",
  description: "",
  is_active: true,
};

export default function CostCentersPage() {
  const perms = usePermissions();
  const qc = useQueryClient();
  const [editing, setEditing] = useState<CostCenter | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<CostCenterInput>(EMPTY);

  const q = useQuery({
    queryKey: ["cost_centers"],
    queryFn: fetchCostCenters,
  });

  const createM = useMutation({
    mutationFn: createCostCenter,
    onSuccess: () => {
      toast.success("Kostenstelle angelegt.");
      qc.invalidateQueries({ queryKey: ["cost_centers"] });
      setCreating(false);
      setForm(EMPTY);
    },
    onError: (err: Error) => toast.error(err.message),
  });
  const updateM = useMutation({
    mutationFn: (args: { id: string; patch: Partial<CostCenterInput> }) =>
      updateCostCenter(args.id, args.patch),
    onSuccess: () => {
      toast.success("Kostenstelle aktualisiert.");
      qc.invalidateQueries({ queryKey: ["cost_centers"] });
      setEditing(null);
    },
    onError: (err: Error) => toast.error(err.message),
  });
  const deleteM = useMutation({
    mutationFn: deleteCostCenter,
    onSuccess: () => {
      toast.success("Kostenstelle entfernt.");
      qc.invalidateQueries({ queryKey: ["cost_centers"] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const rows = q.data ?? [];

  function startEdit(c: CostCenter) {
    setForm({
      code: c.code,
      name: c.name,
      description: c.description ?? "",
      is_active: c.is_active,
    });
    setEditing(c);
    setCreating(false);
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (editing) updateM.mutate({ id: editing.id, patch: form });
    else createM.mutate(form);
  }

  if (!perms.canRead) {
    return (
      <div className="report">
        <header className="report__head">
          <h1>Kostenstellen</h1>
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
            <Layers
              size={22}
              style={{ verticalAlign: "-3px", marginRight: 8 }}
            />
            Kostenstellen
          </h1>
          <p>
            Einfache Reporting-Dimension für Buchungen.
            <strong> Eine Kostenstelle pro Buchung</strong> — Mehrfach-
            Allokation (Splits) ist nicht enthalten.
          </p>
        </div>
        <div className="period">
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
            <Plus size={16} /> Neue Kostenstelle
          </button>
        </div>
      </header>

      <aside className="taxcalc__hint">
        <BadgeCheck size={14} />
        <span>
          Kostenstellen sind <strong>nicht</strong> Teil der Journal-Hash-Kette
          — sie dürfen nachträglich korrigiert werden, ohne die GoBD-Kette
          zu brechen.
        </span>
      </aside>

      {(creating || editing) && (
        <section className="card kst__form">
          <header>
            <h2>{editing ? `Bearbeiten: ${editing.code}` : "Neue Kostenstelle"}</h2>
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
              <span>Code *</span>
              <input
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value })}
                placeholder="z. B. 100, ABT-A, VERTRIEB"
                maxLength={40}
                required
              />
            </label>
            <label className="form-field">
              <span>Bezeichnung *</span>
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </label>
            <label className="form-field form-field--wide">
              <span>Beschreibung</span>
              <input
                value={form.description ?? ""}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
              />
            </label>
            <label className="form-field">
              <span>Aktiv</span>
              <input
                type="checkbox"
                checked={form.is_active ?? true}
                onChange={(e) =>
                  setForm({ ...form, is_active: e.target.checked })
                }
              />
            </label>
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

      <section className="card kst__list">
        {rows.length === 0 ? (
          <p className="kst__empty">
            Noch keine Kostenstellen. Klicken Sie „Neue Kostenstelle".
          </p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Code</th>
                <th>Bezeichnung</th>
                <th>Beschreibung</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((c) => (
                <tr key={c.id} className={c.is_active ? "" : "is-inactive"}>
                  <td className="mono">{c.code}</td>
                  <td>
                    <strong>{c.name}</strong>
                  </td>
                  <td>{c.description ?? ""}</td>
                  <td>
                    {c.is_active ? (
                      <span className="kst__badge is-active">aktiv</span>
                    ) : (
                      <span className="kst__badge">inaktiv</span>
                    )}
                  </td>
                  <td>
                    <div className="kst__actions">
                      <button
                        type="button"
                        onClick={() => startEdit(c)}
                        title="Bearbeiten"
                        disabled={!perms.canWrite}
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (confirm(`Kostenstelle ${c.code} entfernen?`)) {
                            deleteM.mutate(c.id);
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
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
