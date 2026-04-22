import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  AlertTriangle,
  ArrowLeft,
  FileText,
  Loader2,
  Send,
  Trash2,
} from "lucide-react";
import { fetchAccounts } from "../api/accounts";
import { fetchAllEntries } from "../api/dashboard";
import {
  computeVerzugszinsen,
  createDunning,
  deleteDunning,
  feeFor,
  fetchDunningRecords,
  suggestDunningActions,
} from "../api/mahnwesen";
import { summarizeOpenItems, type OpenItem } from "../api/opos";
import { useMandant } from "../contexts/MandantContext";
import { useSettings } from "../contexts/SettingsContext";
import type { DunningRecord, DunningStage } from "../types/db";
import { buildMahnungPdf } from "../utils/mahnungPdf";
import "./MahnwesenPage.css";

const euro = new Intl.NumberFormat("de-DE", {
  style: "currency",
  currency: "EUR",
});

const STAGE_LABEL: Record<DunningStage, string> = {
  1: "Zahlungserinnerung",
  2: "1. Mahnung",
  3: "2. Mahnung (letzte)",
};

const STAGE_CLASS: Record<DunningStage, string> = {
  1: "is-stage1",
  2: "is-stage2",
  3: "is-stage3",
};

export default function MahnwesenPage() {
  const qc = useQueryClient();
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
  const dunningsQ = useQuery({
    queryKey: ["dunnings", selectedMandantId],
    queryFn: () => fetchDunningRecords(selectedMandantId),
  });

  const opos = useMemo(
    () => summarizeOpenItems(entriesQ.data ?? [], accountsQ.data ?? []),
    [entriesQ.data, accountsQ.data]
  );

  const suggestions = useMemo(() => {
    const filteredItems = selectedMandantId
      ? opos.receivables.filter((i) => i.client_id === selectedMandantId)
      : opos.receivables;
    return suggestDunningActions(
      filteredItems,
      dunningsQ.data ?? [],
      settings
    );
  }, [opos.receivables, selectedMandantId, dunningsQ.data, settings]);

  const createM = useMutation({
    mutationFn: async (args: { item: OpenItem; stage: DunningStage }) => {
      const rec = await createDunning(
        {
          item: args.item,
          stage: args.stage,
          settings,
        },
        selectedMandantId
      );
      await buildMahnungPdf(
        { record: rec, item: args.item, settings },
        `mahnung_stufe${args.stage}_${args.item.beleg_nr}.pdf`
      );
      return rec;
    },
    onSuccess: (rec) => {
      qc.invalidateQueries({ queryKey: ["dunnings"] });
      toast.success(
        `${STAGE_LABEL[rec.stage]} für ${rec.beleg_nr} erstellt. PDF heruntergeladen.`
      );
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const deleteM = useMutation({
    mutationFn: (id: string) => deleteDunning(id, selectedMandantId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["dunnings"] });
      toast.success("Mahnung aus dem Verlauf entfernt.");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const isLoading =
    entriesQ.isLoading || accountsQ.isLoading || dunningsQ.isLoading;
  const dunnings = dunningsQ.data ?? [];

  return (
    <div className="mahn">
      <header className="mahn__head">
        <Link to="/opos" className="report__back">
          <ArrowLeft size={16} />
          Zurück zu den offenen Posten
        </Link>
        <h1>
          <AlertTriangle
            size={22}
            style={{ verticalAlign: "-3px", marginRight: 8 }}
          />
          Mahnwesen
        </h1>
        <p>
          Vorschläge basieren auf den Schwellenwerten in den Einstellungen:
          Stufe 1 ab <strong>{settings.stufe1AbTagen} T.</strong>, Stufe 2 ab{" "}
          <strong>{settings.stufe2AbTagen} T.</strong>, Stufe 3 ab{" "}
          <strong>{settings.stufe3AbTagen} T.</strong> Verzugszinsen:{" "}
          Basiszinssatz {settings.basiszinssatzPct.toFixed(2)} % +{" "}
          {settings.verzugszinsenB2B ? "9" : "5"} Prozentpunkte (
          {settings.verzugszinsenB2B ? "B2B" : "B2C"}).
        </p>
      </header>

      <aside className="mahn__info-note">
        <AlertTriangle size={14} />
        <span>
          Das Mahnwesen arbeitet stets mit dem aktuellen Stand und ignoriert
          den globalen Geschäftsjahr-Filter — eine überfällige Rechnung ist
          unabhängig vom Auswertungsjahr zu mahnen.
        </span>
      </aside>

      {!settings.kanzleiIban && (
        <aside className="mahn__warning">
          <AlertTriangle size={16} />
          <span>
            Für korrekte Mahnungen sollten Sie unter{" "}
            <Link to="/einstellungen">Einstellungen</Link> IBAN und BIC der
            Kanzlei hinterlegen — sonst fehlt die Bankverbindung auf dem PDF.
          </span>
        </aside>
      )}

      <section className="card mahn__section">
        <header className="mahn__section-head">
          <h2>Offene Mahnvorschläge</h2>
          <span className="mahn__count">{suggestions.length}</span>
        </header>
        {isLoading ? (
          <div className="journal__state">
            <Loader2 className="journal__state-spin" size={28} />
            <p>Lade Daten …</p>
          </div>
        ) : suggestions.length === 0 ? (
          <p className="mahn__empty">
            Derzeit keine Forderungen im mahnwürdigen Zustand. 🎉
          </p>
        ) : (
          <table className="mahn__table">
            <thead>
              <tr>
                <th>Beleg-Nr.</th>
                <th>Gegenseite</th>
                <th>Fällig</th>
                <th>Überfällig</th>
                <th className="is-num">Offen</th>
                <th>Letzte Stufe</th>
                <th>Vorschlag</th>
                <th className="is-num">Gebühr</th>
                <th className="is-num">Verzugszinsen</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {suggestions.map(({ item, nextStage, lastStage }) => {
                const fee = feeFor(nextStage, settings);
                const zins = computeVerzugszinsen(
                  item.offen,
                  item.ueberfaellig_tage,
                  settings
                );
                const busy = createM.isPending && createM.variables?.item.beleg_nr === item.beleg_nr;
                return (
                  <tr key={item.beleg_nr}>
                    <td className="mono">{item.beleg_nr}</td>
                    <td>{item.gegenseite}</td>
                    <td className="mono">
                      {new Date(item.faelligkeit).toLocaleDateString("de-DE")}
                    </td>
                    <td>
                      <span className="mahn__overdue">
                        {item.ueberfaellig_tage} T.
                      </span>
                    </td>
                    <td className="is-num mono">{euro.format(item.offen)}</td>
                    <td>
                      {lastStage === 0 ? (
                        <span style={{ color: "var(--muted)" }}>—</span>
                      ) : (
                        <span className={`mahn__stage ${STAGE_CLASS[lastStage]}`}>
                          {STAGE_LABEL[lastStage]}
                        </span>
                      )}
                    </td>
                    <td>
                      <span className={`mahn__stage ${STAGE_CLASS[nextStage]}`}>
                        {STAGE_LABEL[nextStage]}
                      </span>
                    </td>
                    <td className="is-num mono">{euro.format(fee)}</td>
                    <td className="is-num mono">{euro.format(zins)}</td>
                    <td>
                      <button
                        type="button"
                        className="btn btn-primary"
                        onClick={() =>
                          createM.mutate({ item, stage: nextStage })
                        }
                        disabled={busy}
                      >
                        {busy ? (
                          <>
                            <Loader2 size={14} className="login__spinner" />
                            Erstelle …
                          </>
                        ) : (
                          <>
                            <Send size={14} />
                            Mahnung erstellen
                          </>
                        )}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </section>

      <section className="card mahn__section">
        <header className="mahn__section-head">
          <h2>Mahnhistorie</h2>
          <span className="mahn__count">{dunnings.length}</span>
        </header>
        {dunnings.length === 0 ? (
          <p className="mahn__empty">Bisher keine Mahnungen versendet.</p>
        ) : (
          <table className="mahn__table">
            <thead>
              <tr>
                <th>Datum</th>
                <th>Stufe</th>
                <th>Beleg-Nr.</th>
                <th>Gegenseite</th>
                <th>Neue Frist</th>
                <th className="is-num">Betrag</th>
                <th className="is-num">Gebühr</th>
                <th className="is-num">Zinsen</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {dunnings.map((r) => (
                <HistoryRow
                  key={r.id}
                  rec={r}
                  onReprint={() => reprint(r)}
                  onDelete={() => {
                    if (confirm(`Mahnung Stufe ${r.stage} für ${r.beleg_nr} aus dem Verlauf entfernen?`)) {
                      deleteM.mutate(r.id);
                    }
                  }}
                />
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );

  async function reprint(r: DunningRecord) {
    const item = opos.receivables.find((i) => i.beleg_nr === r.beleg_nr);
    if (!item) {
      toast.error(
        "Offener Posten zu dieser Mahnung nicht mehr vorhanden (bezahlt oder gelöscht). Kein Nachdruck möglich."
      );
      return;
    }
    try {
      await buildMahnungPdf(
        { record: r, item, settings },
        `mahnung_nachdruck_${r.beleg_nr}.pdf`
      );
      toast.success("Nachdruck heruntergeladen.");
    } catch (err) {
      toast.error(`Fehler: ${(err as Error).message}`);
    }
  }
}

function HistoryRow({
  rec,
  onReprint,
  onDelete,
}: {
  rec: DunningRecord;
  onReprint: () => void;
  onDelete: () => void;
}) {
  const [busy, setBusy] = useState(false);
  return (
    <tr>
      <td className="mono">
        {new Date(rec.issued_at).toLocaleDateString("de-DE")}
      </td>
      <td>
        <span className={`mahn__stage ${STAGE_CLASS[rec.stage]}`}>
          {STAGE_LABEL[rec.stage]}
        </span>
      </td>
      <td className="mono">{rec.beleg_nr}</td>
      <td>{rec.gegenseite}</td>
      <td className="mono">
        {new Date(rec.faelligkeit_neu).toLocaleDateString("de-DE")}
      </td>
      <td className="is-num mono">{euro.format(rec.betrag_offen)}</td>
      <td className="is-num mono">{euro.format(rec.fee)}</td>
      <td className="is-num mono">{euro.format(rec.verzugszinsen)}</td>
      <td className="mahn__row-actions">
        <button
          type="button"
          onClick={async () => {
            setBusy(true);
            try {
              await onReprint();
            } finally {
              setBusy(false);
            }
          }}
          title="PDF erneut erzeugen"
          disabled={busy}
        >
          {busy ? <Loader2 size={14} className="login__spinner" /> : <FileText size={14} />}
        </button>
        <button type="button" onClick={onDelete} title="Aus Verlauf entfernen">
          <Trash2 size={14} />
        </button>
      </td>
    </tr>
  );
}
