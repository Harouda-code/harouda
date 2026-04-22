import {
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import {
  BookmarkPlus,
  FileArchive,
  FileSpreadsheet,
  FileUp,
  Loader2,
  MessageSquare,
  Pencil,
  Plus,
  RotateCcw,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { fetchAccounts } from "../api/accounts";
import { fetchClients } from "../api/clients";
import {
  createEntry,
  deleteEntry,
  fetchEntries,
  reverseEntry,
  updateEntry,
  type JournalInput,
} from "../api/journal";
import { useMandant } from "../contexts/MandantContext";
import { useSettings } from "../contexts/SettingsContext";
import { useYear } from "../contexts/YearContext";
import { usePermissions } from "../hooks/usePermissions";
import ReadonlyBanner from "../components/ReadonlyBanner";
import { VirtualTable } from "../components/ui/VirtualTable";
import "../components/ui/VirtualTable.css";
import {
  buildAtchZip,
  buildDatevCsv,
  validateExtfEntries,
} from "../utils/datev";
import { downloadBlob, downloadText } from "../utils/exporters";
import {
  keywordHintsFor,
  suggestAccountsByDescription,
} from "../utils/accountNormalization";
import {
  fetchSupplierPreferences,
  findSupplierPreference,
} from "../api/supplierPreferences";
import { fetchNoteCountsByEntity } from "../api/advisorNotes";
import { AdvisorNotesModal } from "../components/AdvisorNotesModal";
import {
  EditableCombobox,
  type ComboboxOption,
} from "../components/EditableCombobox";
import { fetchCostCenters } from "../api/costCenters";
import { fetchCostCarriers } from "../api/costCarriers";
import {
  applyTemplate,
  deleteTemplate,
  loadTemplates,
  saveTemplate,
  type JournalTemplate,
} from "../api/journalTemplates";
import { useCompanyId } from "../contexts/CompanyContext";
import type { JournalEntry } from "../types/db";
import "./JournalPage.css";

const euro = new Intl.NumberFormat("de-DE", {
  style: "currency",
  currency: "EUR",
});

const today = () => new Date().toISOString().slice(0, 10);

const EMPTY_FORM: JournalInput = {
  datum: today(),
  beleg_nr: "",
  beschreibung: "",
  soll_konto: "",
  haben_konto: "",
  betrag: 0,
  ust_satz: null,
  status: "gebucht",
  client_id: null,
  skonto_pct: null,
  skonto_tage: null,
  gegenseite: null,
  faelligkeit: null,
  kostenstelle: null,
  kostentraeger: null,
};

type Mode = { kind: "new" } | { kind: "edit"; id: string } | null;

export default function JournalPage() {
  const qc = useQueryClient();
  const { selectedMandantId } = useMandant();
  const { settings } = useSettings();
  const { inYear, selectedYear } = useYear();
  const { canWrite } = usePermissions();
  const companyId = useCompanyId();

  const entriesQ = useQuery({
    queryKey: ["journal_entries", "all", selectedMandantId],
    queryFn: fetchEntries,
  });
  const accountsQ = useQuery({
    queryKey: ["accounts", "all-with-inactive"],
    queryFn: fetchAccounts,
  });
  const clientsQ = useQuery({
    queryKey: ["clients", "all"],
    queryFn: fetchClients,
  });
  const supplierPrefsQ = useQuery({
    queryKey: ["supplier_preferences", selectedMandantId],
    queryFn: () => fetchSupplierPreferences(selectedMandantId),
  });
  const noteCountsQ = useQuery({
    queryKey: ["advisor_notes_counts", "journal_entry", selectedMandantId],
    queryFn: () =>
      fetchNoteCountsByEntity("journal_entry", selectedMandantId),
  });
  const costCentersQ = useQuery({
    queryKey: ["cost_centers"],
    queryFn: fetchCostCenters,
  });
  const costCarriersQ = useQuery({
    queryKey: ["cost_carriers"],
    queryFn: fetchCostCarriers,
  });

  const [notesFor, setNotesFor] = useState<JournalEntry | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"alle" | "gebucht" | "entwurf">(
    "alle"
  );
  const [mode, setMode] = useState<Mode>(null);
  const [form, setForm] = useState<JournalInput>(EMPTY_FORM);
  const [templates, setTemplates] = useState<JournalTemplate[]>(() =>
    loadTemplates(companyId)
  );

  useEffect(() => {
    setTemplates(loadTemplates(companyId));
  }, [companyId]);

  const entries = entriesQ.data ?? [];
  const accounts = accountsQ.data ?? [];
  const clients = clientsQ.data ?? [];
  const accountByNr = useMemo(
    () => new Map(accounts.map((a) => [a.konto_nr, a])),
    [accounts]
  );
  const clientById = useMemo(
    () => new Map(clients.map((c) => [c.id, c])),
    [clients]
  );

  const gegenseiteOptions = useMemo<ComboboxOption[]>(() => {
    const out: ComboboxOption[] = [];
    const seen = new Set<string>();
    for (const p of supplierPrefsQ.data ?? []) {
      const key = p.display_name.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      out.push({
        id: `pref:${p.id}`,
        label: p.display_name,
        hint: `${p.usage_count}× · zuletzt ${new Date(p.last_used_at).toLocaleDateString("de-DE")}`,
      });
    }
    for (const c of clients) {
      const key = c.name.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      out.push({
        id: `client:${c.id}`,
        label: c.name,
        hint: `Mandant ${c.mandant_nr}`,
      });
    }
    return out;
  }, [supplierPrefsQ.data, clients]);

  const filtered = useMemo(() => {
    let list = entries.filter((e) => inYear(e.datum));
    if (selectedMandantId) {
      list = list.filter((e) => e.client_id === selectedMandantId);
    }
    if (statusFilter !== "alle") {
      list = list.filter((e) => e.status === statusFilter);
    }
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (e) =>
          e.beleg_nr.toLowerCase().includes(q) ||
          e.beschreibung.toLowerCase().includes(q) ||
          e.soll_konto.includes(q) ||
          e.haben_konto.includes(q)
      );
    }
    return list;
  }, [entries, search, statusFilter, selectedMandantId, inYear]);

  const createM = useMutation({
    mutationFn: (input: JournalInput) => createEntry(input),
    onSuccess: () => {
      toast.success("Buchung angelegt.");
      qc.invalidateQueries({ queryKey: ["journal_entries"] });
      resetForm();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const updateM = useMutation({
    mutationFn: (args: { id: string; patch: Partial<JournalInput> }) =>
      updateEntry(args.id, args.patch),
    onSuccess: () => {
      toast.success("Buchung aktualisiert.");
      qc.invalidateQueries({ queryKey: ["journal_entries"] });
      resetForm();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const deleteM = useMutation({
    mutationFn: (args: { id: string; original: JournalEntry }) =>
      deleteEntry(args.id).then(() => args.original),
    onSuccess: (original) => {
      qc.invalidateQueries({ queryKey: ["journal_entries"] });
      // Toast mit Rückgängig-Option: legt denselben Eintrag als Entwurf
      // wieder an. Keine Historie vom Storno-Workflow nötig, weil nur
      // Entwürfe gelöscht werden dürfen (siehe handleDelete).
      toast.success(`Entwurf ${original.beleg_nr} gelöscht.`, {
        duration: 8000,
        action: {
          label: "Rückgängig",
          onClick: () => {
            createM.mutate({
              datum: original.datum,
              beleg_nr: original.beleg_nr,
              beschreibung: original.beschreibung,
              soll_konto: original.soll_konto,
              haben_konto: original.haben_konto,
              betrag: Number(original.betrag),
              ust_satz: original.ust_satz,
              status: "entwurf",
              client_id: original.client_id,
              skonto_pct: original.skonto_pct,
              skonto_tage: original.skonto_tage,
              gegenseite: original.gegenseite,
              faelligkeit: original.faelligkeit,
              kostenstelle: original.kostenstelle ?? null,
              kostentraeger: original.kostentraeger ?? null,
            });
          },
        },
      });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const reverseM = useMutation({
    mutationFn: (args: { id: string; reason: string }) =>
      reverseEntry(args.id, args.reason),
    onSuccess: () => {
      toast.success("Stornobuchung erstellt.");
      qc.invalidateQueries({ queryKey: ["journal_entries"] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  function defaultDatumForYear(): string {
    const nowY = new Date().getFullYear();
    if (selectedYear === nowY) return today();
    // Past/future year: default to Dec 31 of that year.
    return `${selectedYear}-12-31`;
  }

  function resetForm() {
    setForm({
      ...EMPTY_FORM,
      datum: defaultDatumForYear(),
      client_id: selectedMandantId,
    });
    setMode(null);
  }

  function startNew() {
    setForm({
      ...EMPTY_FORM,
      datum: defaultDatumForYear(),
      client_id: selectedMandantId,
    });
    setMode({ kind: "new" });
  }

  function applyTemplateById(id: string) {
    const tpl = templates.find((t) => t.id === id);
    if (!tpl) return;
    setForm(applyTemplate(tpl, defaultDatumForYear()));
    setMode({ kind: "new" });
    toast.success(`Vorlage "${tpl.name}" übernommen — bitte prüfen & speichern.`);
  }

  function handleSaveTemplate() {
    const name = prompt("Name der Vorlage (z. B. Miete Büro):");
    if (name === null) return;
    try {
      const tpl = saveTemplate(companyId, name, form);
      setTemplates(loadTemplates(companyId));
      toast.success(`Vorlage "${tpl.name}" gespeichert.`);
    } catch (err) {
      toast.error((err as Error).message);
    }
  }

  function handleDeleteTemplate(id: string, name: string) {
    if (!confirm(`Vorlage "${name}" wirklich löschen?`)) return;
    deleteTemplate(companyId, id);
    setTemplates(loadTemplates(companyId));
    toast.success(`Vorlage "${name}" gelöscht.`);
  }

  function startEdit(e: JournalEntry) {
    setForm({
      datum: e.datum,
      beleg_nr: e.beleg_nr,
      beschreibung: e.beschreibung,
      soll_konto: e.soll_konto,
      haben_konto: e.haben_konto,
      betrag: e.betrag,
      ust_satz: e.ust_satz,
      status: e.status,
      client_id: e.client_id,
      skonto_pct: e.skonto_pct,
      skonto_tage: e.skonto_tage,
      gegenseite: e.gegenseite,
      faelligkeit: e.faelligkeit,
      kostenstelle: e.kostenstelle ?? null,
      kostentraeger: e.kostentraeger ?? null,
    });
    setMode({ kind: "edit", id: e.id });
  }

  function handleSubmit(ev: FormEvent) {
    ev.preventDefault();
    const payload: JournalInput = {
      ...form,
      beleg_nr: form.beleg_nr.trim(),
      beschreibung: form.beschreibung.trim(),
      betrag: Number(form.betrag),
    };
    if (!payload.beleg_nr || !payload.beschreibung) {
      toast.error("Beleg-Nr. und Beschreibung sind Pflichtfelder.");
      return;
    }
    if (!payload.soll_konto || !payload.haben_konto) {
      toast.error("Bitte Soll- und Haben-Konto auswählen.");
      return;
    }
    if (mode?.kind === "new") createM.mutate(payload);
    else if (mode?.kind === "edit")
      updateM.mutate({ id: mode.id, patch: payload });
  }

  function handleDelete(e: JournalEntry) {
    if (e.status === "gebucht") {
      toast.error(
        "Festgeschriebene Buchungen können nicht gelöscht werden — bitte stornieren."
      );
      return;
    }
    if (confirm(`Entwurf ${e.beleg_nr} wirklich löschen?`))
      deleteM.mutate({ id: e.id, original: e });
  }

  function handleReverse(e: JournalEntry) {
    const reason = prompt(
      `Stornogrund für Beleg ${e.beleg_nr} (Pflichtangabe, wird im Audit-Log gespeichert):`
    );
    if (reason === null) return;
    const trimmed = reason.trim();
    if (trimmed.length < 3) {
      toast.error("Stornogrund ist Pflicht (mindestens 3 Zeichen).");
      return;
    }
    reverseM.mutate({ id: e.id, reason: trimmed });
  }

  function handleDatevCsv() {
    if (filtered.length === 0) {
      toast.info("Keine Buchungen zum Exportieren.");
      return;
    }
    const dates = filtered.map((e) => e.datum).sort();
    const beraterNr = settings.elsterBeraterNr || "0000000";
    const mandantNr =
      (selectedMandantId &&
        clients.find((c) => c.id === selectedMandantId)?.mandant_nr) ||
      "10000";
    const csv = buildDatevCsv(filtered, {
      beraterNr,
      mandantNr,
      wirtschaftsjahrBeginn: `${new Date(dates[0]).getFullYear()}-01-01`,
      datumVon: dates[0],
      datumBis: dates[dates.length - 1],
      bezeichnung: `Export ${new Date().toISOString().slice(0, 10)}`,
    });
    downloadText(
      csv,
      `buchungsstapel_${dates[0]}_${dates[dates.length - 1]}.csv`,
      "text/csv;charset=utf-8"
    );
    toast.success("DATEV-CSV exportiert.");
  }

  async function handleAtch() {
    if (filtered.length === 0) {
      toast.info("Keine Buchungen zum Exportieren.");
      return;
    }
    try {
      const blob = await buildAtchZip(filtered, accounts);
      downloadBlob(blob, `belegarchiv_${new Date().toISOString().slice(0, 10)}.zip`);
      toast.success("Beleg-Archiv als ZIP exportiert.");
    } catch (err) {
      toast.error(`Export fehlgeschlagen: ${(err as Error).message}`);
    }
  }

  const isLoading = entriesQ.isLoading || accountsQ.isLoading;
  const isSubmitting = createM.isPending || updateM.isPending;

  useEffect(() => {
    function onKey(ev: KeyboardEvent) {
      const typingInField =
        ev.target instanceof HTMLInputElement ||
        ev.target instanceof HTMLTextAreaElement ||
        ev.target instanceof HTMLSelectElement;

      if (ev.key === "Escape" && mode) {
        ev.preventDefault();
        resetForm();
      } else if ((ev.ctrlKey || ev.metaKey) && ev.key.toLowerCase() === "n") {
        if (!typingInField) {
          ev.preventDefault();
          startNew();
        }
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  const accountOptions = useMemo(
    () =>
      accounts
        .filter((a) => a.is_active)
        .sort((a, b) => a.konto_nr.localeCompare(b.konto_nr)),
    [accounts]
  );

  return (
    <div className="journal">
      <ReadonlyBanner />
      <header className="journal__toolbar card">
        <label className="journal__search">
          <Search size={16} />
          <input
            type="search"
            placeholder="Suche nach Beleg-Nr., Beschreibung oder Konto …"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </label>

        <select
          className="journal__select"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
          aria-label="Status-Filter"
        >
          <option value="alle">Alle Status</option>
          <option value="gebucht">Gebucht</option>
          <option value="entwurf">Entwurf</option>
        </select>

        <div className="journal__count">
          <strong>{filtered.length}</strong> von {entries.length} Buchungen
          {" · "}Jahr <strong>{selectedYear}</strong>
        </div>

        {templates.length > 0 && (
          <select
            className="journal__select"
            value=""
            onChange={(e) => {
              const v = e.target.value;
              if (v.startsWith("del:")) {
                const id = v.slice(4);
                const t = templates.find((x) => x.id === id);
                if (t) handleDeleteTemplate(t.id, t.name);
              } else if (v) {
                applyTemplateById(v);
              }
              e.target.value = "";
            }}
            aria-label="Vorlage anwenden"
            disabled={!canWrite}
            title="Gespeicherte Vorlage übernehmen"
          >
            <option value="">Vorlage …</option>
            <optgroup label="Übernehmen">
              {templates.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </optgroup>
            <optgroup label="Löschen">
              {templates.map((t) => (
                <option key={`del-${t.id}`} value={`del:${t.id}`}>
                  ✕ {t.name}
                </option>
              ))}
            </optgroup>
          </select>
        )}

        <button
          type="button"
          className="btn btn-outline"
          onClick={handleDatevCsv}
          title="DATEV Standard-Buchungsstapel (CSV)"
        >
          <FileSpreadsheet size={16} />
          DATEV-CSV
        </button>

        <button
          type="button"
          className="btn btn-outline"
          onClick={handleAtch}
          title="Belege + document.xml als ZIP"
        >
          <FileArchive size={16} />
          Beleg-ZIP
        </button>

        <Link
          to="/journal/import"
          className="btn btn-outline"
          title={
            canWrite
              ? "Buchungen aus CSV importieren"
              : "Nur-Lesen-Zugriff — kein Import möglich"
          }
          aria-disabled={!canWrite}
          onClick={(e) => {
            if (!canWrite) e.preventDefault();
          }}
          style={!canWrite ? { pointerEvents: "none", opacity: 0.5 } : undefined}
        >
          <FileUp size={16} />
          CSV-Import
        </Link>

        <button
          type="button"
          className="btn btn-primary"
          onClick={startNew}
          disabled={!canWrite}
          title={
            canWrite
              ? "Neue Buchung (Strg+N)"
              : "Nur-Lesen-Zugriff — keine neuen Buchungen möglich"
          }
        >
          <Plus size={16} />
          Neue Buchung
        </button>
      </header>

      {mode && (
        <form className="card journal__form" onSubmit={handleSubmit}>
          <div className="journal__form-head">
            <h2>
              {mode.kind === "new" ? "Neue Buchung anlegen" : "Buchung bearbeiten"}
            </h2>
            <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
              <button
                type="button"
                className="btn btn-ghost"
                onClick={handleSaveTemplate}
                disabled={
                  !canWrite ||
                  !form.soll_konto ||
                  !form.haben_konto ||
                  !form.beschreibung.trim()
                }
                title="Aktuelle Buchung als wiederverwendbare Vorlage speichern (Datum wird nicht gespeichert)"
              >
                <BookmarkPlus size={16} />
                Als Vorlage speichern
              </button>
              <button
                type="button"
                className="btn btn-ghost"
                onClick={resetForm}
                aria-label="Schließen"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          <div className="form-grid">
            <label className="form-field">
              <span>Datum *</span>
              <input
                type="date"
                required
                value={form.datum}
                onChange={(e) => setForm((f) => ({ ...f, datum: e.target.value }))}
              />
            </label>

            <label className="form-field">
              <span>Beleg-Nr. *</span>
              <input
                required
                value={form.beleg_nr}
                onChange={(e) =>
                  setForm((f) => ({ ...f, beleg_nr: e.target.value }))
                }
                placeholder="ER-2025-001"
                maxLength={80}
              />
              <FieldLengthHint
                value={form.beleg_nr}
                max={36}
                label="DATEV Belegfeld1"
              />
            </label>

            <label className="form-field form-field--wide">
              <span>Beschreibung *</span>
              <input
                required
                value={form.beschreibung}
                onChange={(e) =>
                  setForm((f) => ({ ...f, beschreibung: e.target.value }))
                }
                placeholder="Miete Büro April 2025"
                maxLength={200}
              />
              <FieldLengthHint
                value={form.beschreibung}
                max={60}
                label="DATEV Buchungstext"
              />
              <KontoSuggestions
                description={form.beschreibung}
                gegenseite={form.gegenseite ?? ""}
                accounts={accounts}
                supplierPrefs={supplierPrefsQ.data ?? []}
                onPickSoll={(nr) =>
                  setForm((f) => ({ ...f, soll_konto: nr }))
                }
                onPickHaben={(nr) =>
                  setForm((f) => ({ ...f, haben_konto: nr }))
                }
                onApplyPair={(soll, haben) =>
                  setForm((f) => ({
                    ...f,
                    soll_konto: soll ?? f.soll_konto,
                    haben_konto: haben ?? f.haben_konto,
                  }))
                }
              />
            </label>

            <label className="form-field">
              <span>Soll-Konto *</span>
              <select
                required
                value={form.soll_konto}
                onChange={(e) =>
                  setForm((f) => ({ ...f, soll_konto: e.target.value }))
                }
              >
                <option value="">— wählen —</option>
                {accountOptions.map((a) => (
                  <option key={a.konto_nr} value={a.konto_nr}>
                    {a.konto_nr} {a.bezeichnung}
                  </option>
                ))}
              </select>
            </label>

            <label className="form-field">
              <span>Haben-Konto *</span>
              <select
                required
                value={form.haben_konto}
                onChange={(e) =>
                  setForm((f) => ({ ...f, haben_konto: e.target.value }))
                }
              >
                <option value="">— wählen —</option>
                {accountOptions.map((a) => (
                  <option key={a.konto_nr} value={a.konto_nr}>
                    {a.konto_nr} {a.bezeichnung}
                  </option>
                ))}
              </select>
            </label>

            <label className="form-field">
              <span>Betrag (Brutto) *</span>
              <input
                type="number"
                step="0.01"
                min="0"
                required
                value={form.betrag}
                onChange={(e) =>
                  setForm((f) => ({ ...f, betrag: Number(e.target.value) }))
                }
              />
            </label>

            <label className="form-field">
              <span>USt-Satz</span>
              <select
                value={form.ust_satz ?? "none"}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    ust_satz:
                      e.target.value === "none" ? null : Number(e.target.value),
                  }))
                }
              >
                <option value="none">—</option>
                <option value="0">0 %</option>
                <option value="7">7 %</option>
                <option value="19">19 %</option>
              </select>
            </label>

            <label className="form-field">
              <span>Status</span>
              <select
                value={form.status}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    status: e.target.value as JournalEntry["status"],
                  }))
                }
              >
                <option value="gebucht">Gebucht</option>
                <option value="entwurf">Entwurf</option>
              </select>
            </label>

            <label className="form-field">
              <span>
                Gegenseite{" "}
                <small style={{ color: "var(--muted)" }}>
                  (für OPOS &amp; Mahnwesen)
                </small>
              </span>
              <EditableCombobox
                value={form.gegenseite ?? ""}
                options={gegenseiteOptions}
                onChange={(v) =>
                  setForm((f) => ({ ...f, gegenseite: v || null }))
                }
                onSelectOption={(opt) => {
                  // Wenn es ein gespeicherter Lieferant ist, übernimm gleich
                  // dessen zuletzt genutzte Konten in den Formular-State.
                  const pref = (supplierPrefsQ.data ?? []).find(
                    (p) => p.id === opt.id
                  );
                  if (pref) {
                    setForm((f) => ({
                      ...f,
                      gegenseite: opt.label,
                      soll_konto: pref.soll_konto ?? f.soll_konto,
                      haben_konto: pref.haben_konto ?? f.haben_konto,
                    }));
                  } else {
                    setForm((f) => ({ ...f, gegenseite: opt.label }));
                  }
                }}
                placeholder="z. B. Meyer GmbH"
              />
            </label>

            <label className="form-field">
              <span>
                Kostenstelle{" "}
                <small style={{ color: "var(--muted)" }}>(optional)</small>
              </span>
              <select
                value={form.kostenstelle ?? ""}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    kostenstelle: e.target.value || null,
                  }))
                }
              >
                <option value="">— ohne —</option>
                {(costCentersQ.data ?? [])
                  .filter((c) => c.is_active)
                  .map((c) => (
                    <option key={c.id} value={c.code}>
                      {c.code} — {c.name}
                    </option>
                  ))}
              </select>
            </label>

            <label className="form-field">
              <span>
                Kostenträger{" "}
                <small style={{ color: "var(--muted)" }}>(optional)</small>
              </span>
              <select
                value={form.kostentraeger ?? ""}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    kostentraeger: e.target.value || null,
                  }))
                }
              >
                <option value="">— ohne —</option>
                {(costCarriersQ.data ?? [])
                  .filter((c) => c.is_active)
                  .map((c) => (
                    <option key={c.id} value={c.code}>
                      {c.code} — {c.name}
                    </option>
                  ))}
              </select>
            </label>

            <label className="form-field">
              <span>
                Fälligkeit{" "}
                <small style={{ color: "var(--muted)" }}>
                  (leer = Datum + 14 T.)
                </small>
              </span>
              <input
                type="date"
                value={form.faelligkeit ?? ""}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    faelligkeit: e.target.value || null,
                  }))
                }
              />
            </label>

            <label className="form-field">
              <span>Skonto %</span>
              <input
                type="number"
                step="0.01"
                min="0"
                max="100"
                value={form.skonto_pct ?? ""}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    skonto_pct: e.target.value ? Number(e.target.value) : null,
                  }))
                }
                placeholder="z. B. 2"
              />
            </label>

            <label className="form-field">
              <span>Skonto-Frist (Tage)</span>
              <input
                type="number"
                min="0"
                value={form.skonto_tage ?? ""}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    skonto_tage: e.target.value ? Number(e.target.value) : null,
                  }))
                }
                placeholder="z. B. 14"
              />
            </label>

            <label className="form-field form-field--wide">
              <span>Mandant</span>
              <select
                value={form.client_id ?? ""}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    client_id: e.target.value || null,
                  }))
                }
              >
                <option value="">— Kein Mandant —</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.mandant_nr} · {c.name}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="journal__form-actions">
            <button type="button" className="btn btn-ghost" onClick={resetForm}>
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
                "Buchung anlegen"
              ) : (
                "Änderungen speichern"
              )}
            </button>
          </div>
        </form>
      )}

      <DatevValidationBanner
        entries={filtered}
        accounts={accounts}
      />

      {isLoading ? (
        <div className="journal__state">
          <Loader2 className="journal__state-spin" size={28} />
          <p>Lade Buchungen …</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="card journal__empty">
          <p>
            Keine Buchungen gefunden. Legen Sie Ihre erste Buchung an oder
            passen Sie die Filter an.
          </p>
        </div>
      ) : filtered.length > 200 ? (
        <VirtualTable
          rows={filtered}
          rowHeight={60}
          viewportHeight={640}
          className="journal__virtual"
          header={
            <thead>
              <tr>
                <th>Datum</th>
                <th>Beleg</th>
                <th>Beschreibung</th>
                <th>Soll</th>
                <th>Haben</th>
                <th>Mandant</th>
                <th>USt</th>
                <th>Status</th>
                <th className="is-num">Betrag</th>
                <th></th>
              </tr>
            </thead>
          }
          renderRow={(e) => {
            const sollBez =
              accountByNr.get(e.soll_konto)?.bezeichnung ?? "";
            const habenBez =
              accountByNr.get(e.haben_konto)?.bezeichnung ?? "";
            const client = e.client_id ? clientById.get(e.client_id) : null;
            return (
              <tr
                key={e.id}
                className={
                  mode?.kind === "edit" && mode.id === e.id ? "is-editing" : ""
                }
                style={{ height: 60 }}
              >
                <td className="mono">
                  {new Date(e.datum).toLocaleDateString("de-DE")}
                </td>
                <td className="mono">{e.beleg_nr}</td>
                <td>{e.beschreibung}</td>
                <td>
                  <span className="mono">{e.soll_konto}</span>
                  <span className="journal__cell-sub">{sollBez}</span>
                </td>
                <td>
                  <span className="mono">{e.haben_konto}</span>
                  <span className="journal__cell-sub">{habenBez}</span>
                </td>
                <td>
                  {client ? (
                    `${client.mandant_nr}`
                  ) : (
                    <span className="journal__cell-muted">—</span>
                  )}
                </td>
                <td>
                  {e.ust_satz === null ? (
                    <span className="journal__cell-muted">—</span>
                  ) : (
                    `${e.ust_satz} %`
                  )}
                </td>
                <td>
                  <JournalStatusCell entry={e} />
                </td>
                <td className="is-num mono">
                  {euro.format(Number(e.betrag))}
                </td>
                <td className="journal__row-actions">
                  <JournalRowActions
                    entry={e}
                    canWrite={canWrite}
                    noteCount={noteCountsQ.data?.get(e.id) ?? 0}
                    onEdit={() => startEdit(e)}
                    onDelete={() => handleDelete(e)}
                    onReverse={() => handleReverse(e)}
                    onNotes={() => setNotesFor(e)}
                  />
                </td>
              </tr>
            );
          }}
        />
      ) : (
        <div className="card journal__tablewrap">
          <table className="journal__table">
            <thead>
              <tr>
                <th>Datum</th>
                <th>Beleg</th>
                <th>Beschreibung</th>
                <th>Soll</th>
                <th>Haben</th>
                <th>Mandant</th>
                <th>USt</th>
                <th>Status</th>
                <th className="is-num">Betrag</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((e) => {
                const sollBez =
                  accountByNr.get(e.soll_konto)?.bezeichnung ?? "";
                const habenBez =
                  accountByNr.get(e.haben_konto)?.bezeichnung ?? "";
                const client = e.client_id ? clientById.get(e.client_id) : null;
                return (
                  <tr
                    key={e.id}
                    className={
                      mode?.kind === "edit" && mode.id === e.id
                        ? "is-editing"
                        : ""
                    }
                  >
                    <td className="mono">
                      {new Date(e.datum).toLocaleDateString("de-DE")}
                    </td>
                    <td className="mono">{e.beleg_nr}</td>
                    <td>{e.beschreibung}</td>
                    <td>
                      <span className="mono">{e.soll_konto}</span>
                      <span className="journal__cell-sub">{sollBez}</span>
                    </td>
                    <td>
                      <span className="mono">{e.haben_konto}</span>
                      <span className="journal__cell-sub">{habenBez}</span>
                    </td>
                    <td>{client ? `${client.mandant_nr}` : <span className="journal__cell-muted">—</span>}</td>
                    <td>
                      {e.ust_satz === null ? (
                        <span className="journal__cell-muted">—</span>
                      ) : (
                        `${e.ust_satz} %`
                      )}
                    </td>
                    <td>
                      <JournalStatusCell entry={e} />
                    </td>
                    <td className="is-num mono">{euro.format(Number(e.betrag))}</td>
                    <td className="journal__row-actions">
                      <JournalRowActions
                        entry={e}
                        canWrite={canWrite}
                        noteCount={noteCountsQ.data?.get(e.id) ?? 0}
                        onEdit={() => startEdit(e)}
                        onDelete={() => handleDelete(e)}
                        onReverse={() => handleReverse(e)}
                        onNotes={() => setNotesFor(e)}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {notesFor && (
        <AdvisorNotesModal
          entityType="journal_entry"
          entityId={notesFor.id}
          label={`Beleg ${notesFor.beleg_nr} — ${notesFor.beschreibung}`}
          onClose={() => setNotesFor(null)}
        />
      )}
    </div>
  );
}

function KontoSuggestions({
  description,
  gegenseite,
  accounts,
  supplierPrefs,
  onPickSoll,
  onPickHaben,
  onApplyPair,
}: {
  description: string;
  gegenseite: string;
  accounts: import("../types/db").Account[];
  supplierPrefs: import("../types/db").SupplierPreference[];
  onPickSoll: (nr: string) => void;
  onPickHaben: (nr: string) => void;
  onApplyPair: (soll: string | null, haben: string | null) => void;
}) {
  const trimmed = description.trim();
  const counterparty = gegenseite.trim();
  if (trimmed.length < 3 && counterparty.length < 3) return null;

  const byKonto = new Map(accounts.map((a) => [a.konto_nr, a]));
  const fromChart = suggestAccountsByDescription(
    counterparty ? `${counterparty} ${trimmed}` : trimmed,
    accounts
  );
  const hasSkr03 = accounts.some((a) => a.skr === "SKR03");
  const keyword = hasSkr03
    ? keywordHintsFor(counterparty ? `${counterparty} ${trimmed}` : trimmed, "SKR03")
    : [];
  const keywordSuggestions = keyword.filter(
    (k) =>
      !fromChart.some((acc) => acc.konto_nr === k.konto_nr) &&
      byKonto.has(k.konto_nr)
  );

  // Supplier-Preference-Lookup: exakte oder Substring-Treffer bekommen Vorrang.
  const supplierMatch =
    findSupplierPreference(counterparty || trimmed, supplierPrefs);

  if (
    !supplierMatch &&
    fromChart.length === 0 &&
    keywordSuggestions.length === 0
  )
    return null;

  return (
    <div className="journal__suggestions">
      <span className="journal__suggestions-lbl">Vorschlag:</span>
      {supplierMatch && (
        <div
          key="supplier-pref"
          className="journal__suggest-chip"
          style={{
            background: "rgba(5,150,105,0.1)",
            borderColor: "rgba(5,150,105,0.5)",
          }}
          title={`Zuletzt genutzt für „${supplierMatch.pref.display_name}" (${supplierMatch.pref.usage_count}×, zuletzt ${new Date(
            supplierMatch.pref.last_used_at
          ).toLocaleDateString("de-DE")})`}
        >
          <code>{supplierMatch.pref.soll_konto ?? "—"}</code>/
          <code>{supplierMatch.pref.haben_konto ?? "—"}</code>{" "}
          {supplierMatch.matchKind === "exact"
            ? "Exakter Lieferant"
            : "Ähnlicher Lieferant"}{" "}
          <span style={{ color: "var(--muted)", fontSize: "0.72rem" }}>
            ({supplierMatch.pref.usage_count}×)
          </span>
          <button
            type="button"
            onClick={() =>
              onApplyPair(
                supplierMatch.pref.soll_konto,
                supplierMatch.pref.haben_konto
              )
            }
            title="Beide Konten übernehmen"
          >
            Übernehmen
          </button>
        </div>
      )}
      {fromChart.map((a) => (
        <div key={`c-${a.konto_nr}`} className="journal__suggest-chip">
          <code>{a.konto_nr}</code> {a.bezeichnung}
          <button
            type="button"
            onClick={() => onPickSoll(a.konto_nr)}
            title="Als Soll-Konto übernehmen"
          >
            Soll
          </button>
          <button
            type="button"
            onClick={() => onPickHaben(a.konto_nr)}
            title="Als Haben-Konto übernehmen"
          >
            Haben
          </button>
        </div>
      ))}
      {keywordSuggestions.map((k) => (
        <div key={`k-${k.konto_nr}`} className="journal__suggest-chip">
          <code>{k.konto_nr}</code> {k.label.replace(/\([^)]*\)\s*$/, "")}
          <button
            type="button"
            onClick={() => onPickSoll(k.konto_nr)}
            title="Als Soll-Konto übernehmen"
          >
            Soll
          </button>
          <button
            type="button"
            onClick={() => onPickHaben(k.konto_nr)}
            title="Als Haben-Konto übernehmen"
          >
            Haben
          </button>
        </div>
      ))}
    </div>
  );
}

function DatevValidationBanner({
  entries,
  accounts,
}: {
  entries: JournalEntry[];
  accounts: import("../types/db").Account[];
}) {
  const [open, setOpen] = useState(false);
  const report = useMemo(
    () => validateExtfEntries(entries, accounts),
    [entries, accounts]
  );
  const { errors, warnings } = report;
  const total = errors.length + warnings.length;
  if (total === 0 || entries.length === 0) return null;

  return (
    <div
      className="journal__datev-banner"
      style={{
        margin: "0 0 10px",
        padding: "8px 12px",
        borderRadius: 8,
        background:
          errors.length > 0
            ? "rgba(220, 38, 38, 0.08)"
            : "rgba(245, 158, 11, 0.1)",
        borderLeft: `3px solid ${
          errors.length > 0 ? "var(--danger)" : "var(--gold-700)"
        }`,
        fontSize: "0.86rem",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          cursor: "pointer",
        }}
        onClick={() => setOpen((v) => !v)}
      >
        <strong
          style={{
            color:
              errors.length > 0 ? "var(--danger)" : "var(--gold-700)",
          }}
        >
          DATEV-Validierung:
        </strong>
        <span>
          {errors.length > 0 && `${errors.length} Fehler`}
          {errors.length > 0 && warnings.length > 0 && " · "}
          {warnings.length > 0 && `${warnings.length} Warnungen`}
        </span>
        <span style={{ marginLeft: "auto", color: "var(--muted)" }}>
          {open ? "▾ zuklappen" : "▸ Details"}
        </span>
      </div>
      {open && (
        <ul
          style={{
            margin: "8px 0 0",
            paddingLeft: 20,
            maxHeight: 240,
            overflowY: "auto",
            fontSize: "0.82rem",
          }}
        >
          {[...errors, ...warnings].slice(0, 50).map((iss, i) => (
            <li
              key={i}
              style={{
                color:
                  iss.severity === "error"
                    ? "var(--danger)"
                    : "var(--gold-700)",
              }}
            >
              <code>#{iss.rowIndex + 1}</code> {iss.belegNr} — {iss.field}:{" "}
              {iss.message}
              {iss.hint && (
                <em style={{ color: "var(--muted)", marginLeft: 4 }}>
                  {iss.hint}
                </em>
              )}
            </li>
          ))}
          {total > 50 && (
            <li style={{ color: "var(--muted)" }}>
              … und {total - 50} weitere
            </li>
          )}
        </ul>
      )}
    </div>
  );
}

function FieldLengthHint({
  value,
  max,
  label,
}: {
  value: string;
  max: number;
  label: string;
}) {
  const len = value.length;
  if (len === 0) return null;
  const over = len > max;
  const warn = !over && len >= max - 5;
  const color = over
    ? "var(--danger)"
    : warn
      ? "var(--gold-700)"
      : "var(--muted)";
  return (
    <small
      style={{
        color,
        fontSize: "0.72rem",
        marginTop: 3,
        display: "block",
        fontWeight: over ? 700 : 400,
      }}
    >
      {len} / {max} · {label}
      {over &&
        ` — wird beim DATEV-Export auf ${max} Zeichen gekürzt.`}
    </small>
  );
}

function JournalStatusCell({ entry }: { entry: JournalEntry }) {
  const storno = entry.storno_status ?? "active";
  if (storno === "reversed") {
    return (
      <span
        className="dash__pill is-pending"
        style={{ textDecoration: "line-through" }}
        title="Diese Buchung wurde storniert"
      >
        storniert
      </span>
    );
  }
  if (storno === "reversal") {
    return (
      <span className="dash__pill is-muted" title="Stornobuchung (Gegenbuchung)">
        Storno
      </span>
    );
  }
  if (storno === "correction") {
    return (
      <span className="dash__pill is-ok" title="Korrekturbuchung">
        Korrektur
      </span>
    );
  }
  return (
    <span
      className={`dash__pill is-${entry.status === "gebucht" ? "ok" : "pending"}`}
    >
      {entry.status}
    </span>
  );
}

function JournalRowActions({
  entry,
  canWrite,
  noteCount,
  onEdit,
  onDelete,
  onReverse,
  onNotes,
}: {
  entry: JournalEntry;
  canWrite: boolean;
  noteCount: number;
  onEdit: () => void;
  onDelete: () => void;
  onReverse: () => void;
  onNotes: () => void;
}) {
  const storno = entry.storno_status ?? "active";
  const alreadyInactive = storno !== "active";
  const isGebucht = entry.status === "gebucht";

  const notesBtn = (
    <button
      type="button"
      onClick={onNotes}
      aria-label="Beraternotizen"
      title={
        noteCount > 0 ? `${noteCount} Notiz(en) ansehen` : "Notiz hinzufügen"
      }
      style={{ position: "relative" }}
    >
      <MessageSquare size={14} />
      {noteCount > 0 && (
        <span
          style={{
            position: "absolute",
            top: -4,
            right: -4,
            background: "var(--gold)",
            color: "var(--navy-900)",
            fontSize: "0.62rem",
            fontWeight: 700,
            padding: "1px 5px",
            borderRadius: "999px",
            lineHeight: 1,
          }}
        >
          {noteCount}
        </span>
      )}
    </button>
  );

  if (alreadyInactive) {
    // Bereits storniert/Gegenbuchung/Korrektur — nur Notizen erlaubt
    return notesBtn;
  }

  if (isGebucht) {
    return (
      <>
        {notesBtn}
        <button
          type="button"
          onClick={onReverse}
          disabled={!canWrite}
          aria-label="Stornieren"
          title={
            canWrite
              ? "Stornobuchung erstellen (Pflicht bei festgeschriebenen Buchungen)"
              : "Nur-Lesen"
          }
        >
          <RotateCcw size={14} />
        </button>
      </>
    );
  }

  return (
    <>
      {notesBtn}
      <button
        type="button"
        onClick={onEdit}
        disabled={!canWrite}
        aria-label="Bearbeiten"
        title={canWrite ? "Bearbeiten" : "Nur-Lesen"}
      >
        <Pencil size={14} />
      </button>
      <button
        type="button"
        onClick={onDelete}
        disabled={!canWrite}
        aria-label="Löschen"
        title={canWrite ? "Entwurf löschen" : "Nur-Lesen"}
      >
        <Trash2 size={14} />
      </button>
    </>
  );
}
