import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
} from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  ChevronDown,
  ChevronRight,
  Loader2,
  Pencil,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";
import {
  createAccount,
  deleteAccount,
  fetchAccounts,
  importSkr03Chart,
  updateAccount,
  type AccountInput,
} from "../api/accounts";
import { BookCopy } from "lucide-react";
import { fetchAllEntries } from "../api/dashboard";
import { useYear } from "../contexts/YearContext";
import type { Account, Kategorie, SKR } from "../types/db";
import {
  tagsForKonto,
  allPossibleTags,
} from "../domain/est/tagsForKonto";
import "./AccountsPage.css";

const EMPTY_FORM: AccountInput = {
  konto_nr: "",
  bezeichnung: "",
  kategorie: "aufwand",
  ust_satz: null,
  skr: "SKR03",
  is_active: true,
  tags: [],
};

/** Gruppiert alle möglichen ESt-Anlagen-Tags nach Anlage für die UI. */
function groupTagsByAnlage(): Record<string, { tag: string; feld: string }[]> {
  const groups: Record<string, { tag: string; feld: string }[]> = {};
  for (const tag of allPossibleTags()) {
    const [anlage, feld] = tag.split(":");
    if (!groups[anlage]) groups[anlage] = [];
    groups[anlage].push({ tag, feld });
  }
  return groups;
}

const ANLAGE_LABEL: Record<string, string> = {
  "anlage-g": "Anlage G (Gewerbebetrieb)",
  "anlage-s": "Anlage S (Selbständige Arbeit)",
};

const SECTIONS: Array<{
  key: "bilanz" | "guv";
  label: string;
  hint: string;
  kategorien: Kategorie[];
}> = [
  {
    key: "bilanz",
    label: "Bilanz",
    hint: "Vermoegen und Kapital zum Stichtag",
    kategorien: ["aktiva", "passiva"],
  },
  {
    key: "guv",
    label: "Gewinn- und Verlustrechnung",
    hint: "Aufwendungen und Ertraege der Periode",
    kategorien: ["aufwand", "ertrag"],
  },
];

const KAT_META: Record<
  Kategorie,
  { label: string; hint: string; range: string }
> = {
  aktiva: {
    label: "Aktiva",
    hint: "Anlage- und Umlaufvermoegen",
    range: "0xxx – 1xxx",
  },
  passiva: {
    label: "Passiva",
    hint: "Eigenkapital und Verbindlichkeiten",
    range: "1xxx – 3xxx",
  },
  aufwand: {
    label: "Aufwand",
    hint: "Kosten und Ausgaben",
    range: "4xxx (SKR03) · 6xxx (SKR04)",
  },
  ertrag: {
    label: "Ertrag",
    hint: "Erloese und sonstige Ertraege",
    range: "8xxx (SKR03) · 4xxx (SKR04)",
  },
};

const UST_OPTIONS = [
  { value: "none", label: "—" },
  { value: "0", label: "0 %" },
  { value: "7", label: "7 %" },
  { value: "19", label: "19 %" },
];

type Mode = { kind: "new" } | { kind: "edit"; id: string } | null;

export default function AccountsPage() {
  const qc = useQueryClient();
  const { inYear, selectedYear } = useYear();

  const accountsQ = useQuery({
    queryKey: ["accounts", "all-with-inactive"],
    queryFn: fetchAccounts,
  });
  const entriesQ = useQuery({
    queryKey: ["journal_entries", "all"],
    queryFn: fetchAllEntries,
  });

  const [search, setSearch] = useState("");
  const [skrFilter, setSkrFilter] = useState<"alle" | SKR>("alle");
  const [onlyActive, setOnlyActive] = useState(true);
  const [collapsed, setCollapsed] = useState<Set<Kategorie>>(new Set());
  const [mode, setMode] = useState<Mode>(null);
  const [form, setForm] = useState<AccountInput>(EMPTY_FORM);

  const formRef = useRef<HTMLFormElement>(null);

  const accounts = accountsQ.data ?? [];
  const entries = entriesQ.data ?? [];

  const usageByKonto = useMemo(() => {
    const m = new Map<string, number>();
    for (const e of entries) {
      if (!inYear(e.datum)) continue;
      m.set(e.soll_konto, (m.get(e.soll_konto) ?? 0) + 1);
      m.set(e.haben_konto, (m.get(e.haben_konto) ?? 0) + 1);
    }
    return m;
  }, [entries, inYear]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return accounts.filter((a) => {
      if (onlyActive && !a.is_active) return false;
      if (skrFilter !== "alle" && a.skr !== skrFilter) return false;
      if (!q) return true;
      return (
        a.konto_nr.toLowerCase().includes(q) ||
        a.bezeichnung.toLowerCase().includes(q)
      );
    });
  }, [accounts, search, onlyActive, skrFilter]);

  const byKategorie = useMemo(() => {
    const m = new Map<Kategorie, Account[]>();
    for (const a of filtered) {
      const list = m.get(a.kategorie) ?? [];
      list.push(a);
      m.set(a.kategorie, list);
    }
    return m;
  }, [filtered]);

  const totalShown = filtered.length;
  const totalAll = accounts.length;

  const createM = useMutation({
    mutationFn: createAccount,
    onSuccess: () => {
      toast.success("Konto angelegt.");
      qc.invalidateQueries({ queryKey: ["accounts"] });
      resetForm();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const updateM = useMutation({
    mutationFn: (args: { id: string; patch: Partial<AccountInput> }) =>
      updateAccount(args.id, args.patch),
    onSuccess: () => {
      toast.success("Konto aktualisiert.");
      qc.invalidateQueries({ queryKey: ["accounts"] });
      resetForm();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const deleteM = useMutation({
    mutationFn: deleteAccount,
    onSuccess: () => {
      toast.success("Konto geloescht.");
      qc.invalidateQueries({ queryKey: ["accounts"] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const importM = useMutation({
    mutationFn: importSkr03Chart,
    onSuccess: (res) => {
      if (res.inserted === 0) {
        toast.info(
          `SKR03 war bereits importiert. Keine neuen Konten hinzugefuegt.`
        );
      } else {
        toast.success(
          `SKR03 importiert: ${res.inserted} neue Konten (von ${res.total_skr03} Standard-Konten).`,
          { duration: 6000 }
        );
      }
      qc.invalidateQueries({ queryKey: ["accounts"] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  useEffect(() => {
    if (mode) {
      formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [mode]);

  function resetForm() {
    setForm(EMPTY_FORM);
    setMode(null);
  }

  function startNew() {
    setForm(EMPTY_FORM);
    setMode({ kind: "new" });
  }

  function startEdit(a: Account) {
    setForm({
      konto_nr: a.konto_nr,
      bezeichnung: a.bezeichnung,
      kategorie: a.kategorie,
      ust_satz: a.ust_satz,
      skr: a.skr,
      is_active: a.is_active,
      tags: a.tags ?? [],
    });
    setMode({ kind: "edit", id: a.id });
  }

  function toggleTag(tag: string) {
    setForm((f) => {
      const current = f.tags ?? [];
      const next = current.includes(tag)
        ? current.filter((t) => t !== tag)
        : [...current, tag];
      return { ...f, tags: next.sort() };
    });
  }

  function applyDefaultTagsForKonto(nr: string) {
    // Nur in "new"-Mode: beim Verlassen des Konto-Nr-Feldes die Default-
    // Tags aus dem Range-Mapping vorbefüllen, wenn das User noch keine
    // eigene Auswahl getroffen hat (leeres Tag-Array).
    if (mode?.kind !== "new") return;
    const current = form.tags ?? [];
    if (current.length > 0) return;
    const defaults = tagsForKonto(nr.trim());
    if (defaults.length === 0) return;
    setForm((f) => ({ ...f, tags: defaults }));
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const payload: AccountInput = {
      ...form,
      konto_nr: form.konto_nr.trim(),
      bezeichnung: form.bezeichnung.trim(),
    };
    if (!payload.konto_nr || !payload.bezeichnung) {
      toast.error("Bitte Kontonummer und Bezeichnung eingeben.");
      return;
    }
    if (mode?.kind === "new") {
      createM.mutate(payload);
    } else if (mode?.kind === "edit") {
      const { konto_nr: _ignore, ...patch } = payload;
      void _ignore;
      updateM.mutate({ id: mode.id, patch });
    }
  }

  function handleDelete(a: Account) {
    const usage = usageByKonto.get(a.konto_nr) ?? 0;
    if (usage > 0) {
      toast.error(
        `Konto ${a.konto_nr} ist in ${usage} Buchung${usage === 1 ? "" : "en"} verwendet — loeschen nicht moeglich. Deaktivieren Sie es stattdessen.`,
        { duration: 7000 }
      );
      return;
    }
    if (confirm(`Konto ${a.konto_nr} "${a.bezeichnung}" wirklich loeschen?`)) {
      deleteM.mutate(a.id);
    }
  }

  function toggle(k: Kategorie) {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(k)) next.delete(k);
      else next.add(k);
      return next;
    });
  }

  const isLoading = accountsQ.isLoading;
  const isSubmitting = createM.isPending || updateM.isPending;

  return (
    <div className="kontenplan">
      <header className="kontenplan__toolbar">
        <label className="journal__search">
          <Search size={16} />
          <input
            type="search"
            placeholder="Suche nach Kontonummer oder Bezeichnung …"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </label>

        <select
          className="journal__select"
          value={skrFilter}
          onChange={(e) => setSkrFilter(e.target.value as typeof skrFilter)}
          aria-label="SKR-Filter"
        >
          <option value="alle">Alle SKR</option>
          <option value="SKR03">SKR03</option>
          <option value="SKR04">SKR04</option>
        </select>

        <label className="kontenplan__toggle">
          <input
            type="checkbox"
            checked={onlyActive}
            onChange={(e) => setOnlyActive(e.target.checked)}
          />
          Nur aktive
        </label>

        <div className="kontenplan__count">
          <strong>{totalShown}</strong> von {totalAll} Konten
          {" · "}Buchungen {selectedYear}
        </div>

        <button
          type="button"
          className="btn btn-outline"
          onClick={() => {
            if (
              confirm(
                "Den kompletten SKR03-Kontenrahmen (~170 Standardkonten) importieren? Bestehende Konten bleiben unveraendert."
              )
            ) {
              importM.mutate();
            }
          }}
          disabled={importM.isPending}
          title="Kompletten SKR03-Kontenrahmen importieren"
        >
          {importM.isPending ? (
            <>
              <Loader2 size={16} className="login__spinner" />
              Importiere …
            </>
          ) : (
            <>
              <BookCopy size={16} />
              SKR03 importieren
            </>
          )}
        </button>

        <button type="button" className="btn btn-primary" onClick={startNew}>
          <Plus size={16} />
          Neues Konto
        </button>
      </header>

      {mode && (
        <form ref={formRef} className="card kontenplan__form" onSubmit={handleSubmit}>
          <div className="kontenplan__form-head">
            <h2>
              {mode.kind === "new" ? "Neues Konto anlegen" : "Konto bearbeiten"}
            </h2>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={resetForm}
              aria-label="Schliessen"
              title="Schliessen"
            >
              <X size={18} />
            </button>
          </div>

          <div className="form-grid">
            <label className="form-field">
              <span>Kontonummer *</span>
              <input
                required
                value={form.konto_nr}
                onChange={(e) =>
                  setForm((f) => ({ ...f, konto_nr: e.target.value }))
                }
                onBlur={(e) => applyDefaultTagsForKonto(e.target.value)}
                placeholder="z. B. 1800"
                disabled={mode.kind === "edit"}
                style={
                  mode.kind === "edit"
                    ? { background: "var(--ivory-100)", color: "var(--muted)" }
                    : undefined
                }
              />
            </label>

            <label className="form-field form-field--wide">
              <span>Bezeichnung *</span>
              <input
                required
                value={form.bezeichnung}
                onChange={(e) =>
                  setForm((f) => ({ ...f, bezeichnung: e.target.value }))
                }
                placeholder="z. B. Bank PayPal"
              />
            </label>

            <label className="form-field">
              <span>Kategorie *</span>
              <select
                value={form.kategorie}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    kategorie: e.target.value as Kategorie,
                  }))
                }
              >
                <option value="aktiva">Aktiva (Bilanz)</option>
                <option value="passiva">Passiva (Bilanz)</option>
                <option value="aufwand">Aufwand (GuV)</option>
                <option value="ertrag">Ertrag (GuV)</option>
              </select>
            </label>

            <label className="form-field">
              <span>Kontenrahmen</span>
              <select
                value={form.skr ?? "SKR03"}
                onChange={(e) =>
                  setForm((f) => ({ ...f, skr: e.target.value as SKR }))
                }
              >
                <option value="SKR03">SKR03</option>
                <option value="SKR04">SKR04</option>
              </select>
            </label>

            <label className="form-field">
              <span>Umsatzsteuer-Satz</span>
              <select
                value={
                  form.ust_satz === null || form.ust_satz === undefined
                    ? "none"
                    : String(form.ust_satz)
                }
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    ust_satz:
                      e.target.value === "none" ? null : Number(e.target.value),
                  }))
                }
              >
                {UST_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </label>

            <fieldset
              className="form-field form-field--wide"
              style={{
                border: "1px solid var(--border)",
                borderRadius: 6,
                padding: "8px 12px",
              }}
            >
              <legend style={{ padding: "0 6px", fontSize: "0.8rem" }}>
                Steuerliche Zuordnung (ESt-Anlagen)
              </legend>
              <p
                style={{
                  margin: "0 0 8px",
                  fontSize: "0.75rem",
                  color: "var(--muted)",
                }}
              >
                Diese Zuordnung steuert, in welche Anlage der Saldo fliesst.
                Standard-SKR03-Konten sind automatisch zugeordnet.
              </p>
              {Object.entries(groupTagsByAnlage()).map(([anlage, items]) => (
                <div key={anlage} style={{ marginBottom: 6 }}>
                  <strong style={{ fontSize: "0.78rem" }}>
                    {ANLAGE_LABEL[anlage] ?? anlage}
                  </strong>
                  <div
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: "6px 14px",
                      marginTop: 4,
                    }}
                  >
                    {items.map(({ tag, feld }) => (
                      <label
                        key={tag}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 4,
                          fontSize: "0.78rem",
                          fontWeight: 400,
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={(form.tags ?? []).includes(tag)}
                          onChange={() => toggleTag(tag)}
                        />
                        {feld}
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </fieldset>

            <label className="kontenplan__toggle kontenplan__toggle--form">
              <input
                type="checkbox"
                checked={form.is_active ?? true}
                onChange={(e) =>
                  setForm((f) => ({ ...f, is_active: e.target.checked }))
                }
              />
              Konto aktiv
            </label>
          </div>

          <div className="kontenplan__form-actions">
            <button
              type="button"
              className="btn btn-ghost"
              onClick={resetForm}
            >
              Abbrechen
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={16} className="login__spinner" />
                  Speichere …
                </>
              ) : mode.kind === "new" ? (
                "Konto anlegen"
              ) : (
                "Aenderungen speichern"
              )}
            </button>
          </div>
        </form>
      )}

      {isLoading ? (
        <div className="journal__state">
          <Loader2 className="journal__state-spin" size={28} />
          <p>Lade Kontenplan …</p>
        </div>
      ) : totalShown === 0 ? (
        <div className="card kontenplan__empty">
          <p>Keine Konten gefunden. Leeren Sie die Suche oder legen Sie ein neues Konto an.</p>
        </div>
      ) : (
        <div className="kontenplan__body">
          {SECTIONS.map((section) => {
            const secTotal = section.kategorien.reduce(
              (sum, k) => sum + (byKategorie.get(k)?.length ?? 0),
              0
            );
            if (secTotal === 0) return null;

            return (
              <section key={section.key} className="kontenplan__section">
                <header className="kontenplan__section-head">
                  <div>
                    <h2>{section.label}</h2>
                    <p>{section.hint}</p>
                  </div>
                  <span className="kontenplan__section-count">
                    {secTotal} {secTotal === 1 ? "Konto" : "Konten"}
                  </span>
                </header>

                {section.kategorien.map((kat) => {
                  const kontos = byKategorie.get(kat) ?? [];
                  if (kontos.length === 0) return null;
                  const isCollapsed = collapsed.has(kat);
                  const meta = KAT_META[kat];
                  return (
                    <div key={kat} className="card kontenplan__group">
                      <button
                        type="button"
                        className="kontenplan__group-head"
                        onClick={() => toggle(kat)}
                        aria-expanded={!isCollapsed}
                      >
                        {isCollapsed ? (
                          <ChevronRight size={16} />
                        ) : (
                          <ChevronDown size={16} />
                        )}
                        <div className="kontenplan__group-label">
                          <strong>{meta.label}</strong>
                          <span>{meta.hint}</span>
                        </div>
                        <span className="kontenplan__group-range mono">
                          {meta.range}
                        </span>
                        <span className="kontenplan__group-count">
                          {kontos.length}
                        </span>
                      </button>

                      {!isCollapsed && (
                        <table className="kontenplan__table">
                          <thead>
                            <tr>
                              <th>Nr.</th>
                              <th>Bezeichnung</th>
                              <th>SKR</th>
                              <th>USt</th>
                              <th>Buchungen</th>
                              <th>Status</th>
                              <th></th>
                            </tr>
                          </thead>
                          <tbody>
                            {kontos.map((a) => {
                              const usage = usageByKonto.get(a.konto_nr) ?? 0;
                              return (
                                <tr
                                  key={a.id}
                                  className={
                                    mode?.kind === "edit" && mode.id === a.id
                                      ? "is-editing"
                                      : a.is_active
                                      ? ""
                                      : "is-inactive"
                                  }
                                >
                                  <td className="mono kontenplan__nr">
                                    {a.konto_nr}
                                  </td>
                                  <td>{a.bezeichnung}</td>
                                  <td>
                                    <span className="kontenplan__skr">
                                      {a.skr}
                                    </span>
                                  </td>
                                  <td>
                                    {a.ust_satz === null ||
                                    a.ust_satz === undefined ? (
                                      <span style={{ color: "var(--muted)" }}>
                                        —
                                      </span>
                                    ) : (
                                      <span className="kontenplan__ust">
                                        {a.ust_satz} %
                                      </span>
                                    )}
                                  </td>
                                  <td>
                                    {usage === 0 ? (
                                      <span style={{ color: "var(--muted)" }}>
                                        —
                                      </span>
                                    ) : (
                                      <span className="kontenplan__usage">
                                        {usage}
                                      </span>
                                    )}
                                  </td>
                                  <td>
                                    {a.is_active ? (
                                      <span className="dash__pill is-ok">
                                        aktiv
                                      </span>
                                    ) : (
                                      <span className="dash__pill is-muted">
                                        inaktiv
                                      </span>
                                    )}
                                  </td>
                                  <td className="kontenplan__actions">
                                    <button
                                      type="button"
                                      onClick={() => startEdit(a)}
                                      aria-label="Bearbeiten"
                                      title="Bearbeiten"
                                    >
                                      <Pencil size={14} />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleDelete(a)}
                                      aria-label="Loeschen"
                                      title={
                                        usage > 0
                                          ? `In ${usage} Buchungen verwendet — nicht loeschbar`
                                          : "Loeschen"
                                      }
                                      className={
                                        usage > 0 ? "is-blocked" : ""
                                      }
                                    >
                                      <Trash2 size={14} />
                                    </button>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      )}
                    </div>
                  );
                })}
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
