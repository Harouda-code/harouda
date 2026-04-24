import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Building2,
  Check,
  CheckCircle2,
  Database,
  Landmark,
  Loader2,
  Plus,
  Search,
  ShieldAlert,
  XCircle,
} from "lucide-react";
import {
  fetchClients,
  setUstIdResult,
  updateClient,
} from "../api/clients";
import { fetchAllEntries } from "../api/dashboard";
import { checkUstId } from "../api/ustid";
import { useMandant } from "../contexts/MandantContext";
import { useSettings } from "../contexts/SettingsContext";
import { lookupBank } from "../data/blz";
import { formatIban, isValidIban } from "../utils/validators";
import type { Client } from "../types/db";
import "./ClientsPage.css";

function UstIdBadge({ status }: { status: Client["ust_id_status"] }) {
  switch (status) {
    case "valid":
      return (
        <span className="clients__ustid-badge is-valid" title="Gültig laut BZSt">
          <CheckCircle2 size={12} />
          gültig
        </span>
      );
    case "invalid":
      return (
        <span className="clients__ustid-badge is-invalid" title="Ungültig laut BZSt">
          <XCircle size={12} />
          ungültig
        </span>
      );
    case "error":
      return (
        <span className="clients__ustid-badge is-error" title="Prüfung fehlgeschlagen">
          <ShieldAlert size={12} />
          Fehler
        </span>
      );
    case "partial":
      return (
        <span className="clients__ustid-badge is-partial" title="Teilweise Bestätigung">
          teilweise
        </span>
      );
    default:
      return (
        <span className="clients__ustid-badge is-unchecked" title="Noch nicht geprüft">
          ungeprüft
        </span>
      );
  }
}

export default function ClientsPage() {
  const qc = useQueryClient();
  const { selectedMandantId, setSelectedMandantId } = useMandant();
  const { settings } = useSettings();

  const clientsQ = useQuery({
    queryKey: ["clients", "all"],
    queryFn: fetchClients,
  });
  const entriesQ = useQuery({
    queryKey: ["journal_entries", "all", selectedMandantId],
    queryFn: fetchAllEntries,
  });

  const [search, setSearch] = useState("");
  // TODO: Phase 4.B — restore with new Wizard flow
  // const [modalOpen, setModalOpen] = useState(false);

  const clients = clientsQ.data ?? [];
  const entries = entriesQ.data ?? [];

  const usage = useMemo(() => {
    const m = new Map<string, number>();
    for (const e of entries) {
      if (!e.client_id) continue;
      m.set(e.client_id, (m.get(e.client_id) ?? 0) + 1);
    }
    return m;
  }, [entries]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return clients;
    return clients.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.mandant_nr.toLowerCase().includes(q) ||
        (c.steuernummer ?? "").toLowerCase().includes(q)
    );
  }, [clients, search]);

  const datenHolenM = useMutation({
    mutationFn: async (client: Client) => {
      const results: string[] = [];

      // 1. Bank-Lookup (offline, BLZ-Table)
      if (client.iban) {
        if (!isValidIban(client.iban)) {
          results.push(`⚠️ IBAN ist syntaktisch ungültig.`);
        } else {
          const bank = lookupBank(client.iban);
          if (bank) {
            results.push(
              `🏦 ${bank.name}${bank.bic ? ` · BIC ${bank.bic}` : ""}`
            );
          } else {
            results.push("🏦 Bank konnte nicht identifiziert werden.");
          }
        }
      }

      // 2. USt-ID Validierung (benötigt eigene USt-IdNr. in den Einstellungen
      //    und die Edge Function)
      if (client.ust_id) {
        const own = settings.defaultSteuernummer; // fallback — ideally a separate USt-IdNr.
        const ownUst = own && own.toUpperCase().startsWith("DE") ? own : "";
        if (!ownUst) {
          await setUstIdResult(client.id, "unchecked");
          results.push(
            "⚠️ USt-ID-Validierung benötigt eine eigene USt-IdNr. in den Einstellungen."
          );
        } else {
          try {
            const res = await checkUstId({
              ownUstId: ownUst,
              partnerUstId: client.ust_id,
              firmenname: client.name,
            });
            await setUstIdResult(client.id, res.status);
            results.push(`USt-ID: ${res.message}`);
          } catch (err) {
            await setUstIdResult(client.id, "error");
            results.push(`USt-ID-Prüfung fehlgeschlagen: ${(err as Error).message}`);
          }
        }
      }

      await updateClient(client.id, {
        last_daten_holen_at: new Date().toISOString(),
      });
      return results;
    },
    onSuccess: (lines) => {
      qc.invalidateQueries({ queryKey: ["clients"] });
      if (lines.length === 0) {
        toast.info("Keine USt-ID oder IBAN am Mandanten hinterlegt.");
      } else {
        toast.success(lines.join(" · "), { duration: 8000 });
      }
    },
    onError: (err: Error) => toast.error(err.message),
  });

  return (
    <div className="clients">
      <header className="clients__toolbar card">
        <label className="journal__search">
          <Search size={16} />
          <input
            type="search"
            placeholder="Suche nach Nr., Name oder Steuernummer …"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </label>

        <div className="journal__count">
          <strong>{filtered.length}</strong> von {clients.length} Mandanten
        </div>

        <button
          type="button"
          className="btn btn-primary"
          onClick={() => { /* TODO: Phase 4.B — restore with new Wizard flow */ }}
        >
          <Plus size={16} />
          Neuer Mandant
        </button>
      </header>

      {/* TODO: Phase 4.B — restore with new Wizard flow
      <MandantAnlageModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreated={() => setModalOpen(false)}
      />
      */}

      {clientsQ.isLoading ? (
        <div className="journal__state">
          <Loader2 className="journal__state-spin" size={28} />
          <p>Lade Mandanten …</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="card clients__empty">
          <div className="clients__empty-icon">
            <Building2 size={28} strokeWidth={1.5} />
          </div>
          <h2>
            {clients.length === 0
              ? "Noch keine Mandanten"
              : "Keine Treffer"}
          </h2>
          <p>
            {clients.length === 0
              ? "Legen Sie Ihren ersten Mandanten an, um Buchungen mandantenbezogen zu führen."
              : "Keine Mandanten entsprechen Ihrer Suche."}
          </p>
        </div>
      ) : (
        <div className="clients__grid">
          {filtered.map((c) => {
            const active = selectedMandantId === c.id;
            const count = usage.get(c.id) ?? 0;
            const bank =
              c.iban && isValidIban(c.iban) ? lookupBank(c.iban) : null;
            const isRefreshing =
              datenHolenM.isPending && datenHolenM.variables?.id === c.id;
            return (
              <article
                key={c.id}
                className={`card clients__card${active ? " is-active" : ""}`}
              >
                <div className="clients__card-head">
                  <span className="clients__card-nr mono">{c.mandant_nr}</span>
                  {active && (
                    <span className="clients__active-pill">
                      <Check size={12} />
                      Aktiv
                    </span>
                  )}
                </div>
                <h3>{c.name}</h3>

                <dl className="clients__card-fields">
                  {c.steuernummer && (
                    <div>
                      <dt>St-Nr.</dt>
                      <dd className="mono">{c.steuernummer}</dd>
                    </div>
                  )}
                  {c.ust_id && (
                    <div>
                      <dt>USt-IdNr.</dt>
                      <dd className="mono">
                        {c.ust_id}
                        <UstIdBadge status={c.ust_id_status} />
                      </dd>
                    </div>
                  )}
                  {c.iban && (
                    <div>
                      <dt>IBAN</dt>
                      <dd className="mono">{formatIban(c.iban)}</dd>
                    </div>
                  )}
                  {bank && (
                    <div>
                      <dt>Bank</dt>
                      <dd>
                        <Landmark size={12} style={{ marginRight: 4, verticalAlign: "-2px" }} />
                        {bank.name}
                      </dd>
                    </div>
                  )}
                </dl>

                <p className="clients__card-usage">
                  {count} {count === 1 ? "Buchung" : "Buchungen"}
                  {c.last_daten_holen_at && (
                    <>
                      {" · "}
                      <span title={c.last_daten_holen_at}>
                        Zuletzt abgefragt{" "}
                        {new Date(c.last_daten_holen_at).toLocaleDateString(
                          "de-DE"
                        )}
                      </span>
                    </>
                  )}
                </p>

                <div className="clients__card-actions">
                  <button
                    type="button"
                    className={`btn ${active ? "btn-outline" : "btn-primary"}`}
                    onClick={() =>
                      setSelectedMandantId(active ? null : c.id)
                    }
                  >
                    {active ? "Filter entfernen" : "Als aktiv wählen"}
                  </button>
                  <button
                    type="button"
                    className="btn btn-outline"
                    onClick={() => datenHolenM.mutate(c)}
                    disabled={isRefreshing || (!c.ust_id && !c.iban)}
                    title={
                      !c.ust_id && !c.iban
                        ? "Benötigt hinterlegte USt-ID oder IBAN"
                        : "USt-ID beim BZSt prüfen + Bank-Lookup"
                    }
                  >
                    {isRefreshing ? (
                      <>
                        <Loader2 size={14} className="login__spinner" />
                        Hole Daten …
                      </>
                    ) : (
                      <>
                        <Database size={14} />
                        Daten holen
                      </>
                    )}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
