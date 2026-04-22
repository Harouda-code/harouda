/**
 * Sprint 19.C · Shared Debitoren/Kreditoren-Listen-View.
 *
 * Spec-Kernpunkte:
 *   • "Neuer Debitor" / "Neuer Kreditor" öffnet PartnerEditor-Dialog
 *     (keine eigene Route — state bleibt clean).
 *   • Zeilen-Kontextmenü: Öffnen / USt-IdNr prüfen / Deaktivieren.
 *   • UstIdnrStatusBadge pro Zeile (VIES-Mapping-Tabelle).
 *   • Zwei-Schichten-Fehlerbehandlung VIES:
 *       (a) try/catch um verifyUstIdnrForPartner → Auth/Netzwerk
 *       (b) switch(verification_status) → VALID/INVALID/PENDING/…
 */

import { Link } from "react-router-dom";
import { useMemo, useState } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  AlertTriangle,
  ArrowLeft,
  BadgeCheck,
  History,
  Pencil,
  Plus,
} from "lucide-react";
import {
  listBusinessPartners,
  deactivateBusinessPartner,
  verifyUstIdnrForPartner,
} from "../../api/businessPartners";
import { getLatestVerification } from "../../api/ustidVerifications";
import { useMandant } from "../../contexts/MandantContext";
import {
  DEMO_COMPANY_ID,
  useCompanyId,
} from "../../contexts/CompanyContext";
import type {
  BusinessPartner,
  BusinessPartnerType,
  UstIdVerificationStatus,
} from "../../types/db";
import { UstIdnrStatusBadge } from "../../components/partners/UstIdnrStatusBadge";
import { PartnerEditor } from "../../components/partners/PartnerEditor";
import "../ReportView.css";

type Mode = "debitor" | "kreditor";

const LABELS: Record<
  Mode,
  {
    title: string;
    singular: string;
    newBtn: string;
    nummerLabel: string;
    getNummer: (p: BusinessPartner) => number | null;
    defaultType: BusinessPartnerType;
  }
> = {
  debitor: {
    title: "Debitoren",
    singular: "Debitor",
    newBtn: "Neuer Debitor",
    nummerLabel: "Debitor-Nr.",
    getNummer: (p) => p.debitor_nummer,
    defaultType: "debitor",
  },
  kreditor: {
    title: "Kreditoren",
    singular: "Kreditor",
    newBtn: "Neuer Kreditor",
    nummerLabel: "Kreditor-Nr.",
    getNummer: (p) => p.kreditor_nummer,
    defaultType: "kreditor",
  },
};

type EditorState =
  | { open: false }
  | { open: true; mode: "create" }
  | { open: true; mode: "edit"; partnerId: string };

export function PartnerListPage({ mode }: { mode: Mode }) {
  const { selectedMandantId } = useMandant();
  const companyId = useCompanyId() ?? DEMO_COMPANY_ID;
  const qc = useQueryClient();
  const labels = LABELS[mode];

  const [activeOnly, setActiveOnly] = useState<boolean>(true);
  const [search, setSearch] = useState("");
  const [verifyingId, setVerifyingId] = useState<string | null>(null);
  const [editor, setEditor] = useState<EditorState>({ open: false });

  const partnersQ = useQuery({
    queryKey: ["business_partners", mode, selectedMandantId, activeOnly],
    queryFn: () =>
      selectedMandantId
        ? listBusinessPartners({
            clientId: selectedMandantId,
            type: mode,
            activeOnly,
          })
        : Promise.resolve([]),
  });

  const deactivateM = useMutation({
    mutationFn: (id: string) => deactivateBusinessPartner(id),
    onSuccess: () => {
      toast.success("Partner deaktiviert.");
      qc.invalidateQueries({ queryKey: ["business_partners"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    const all = partnersQ.data ?? [];
    if (!q) return all;
    return all.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.ust_idnr ?? "").toLowerCase().includes(q) ||
        String(labels.getNummer(p) ?? "").includes(q)
    );
  }, [partnersQ.data, search, labels]);

  async function handleVerify(partner: BusinessPartner) {
    if (!partner.ust_idnr) {
      toast.error("Kein USt-IdNr hinterlegt.");
      return;
    }
    setVerifyingId(partner.id);
    try {
      const v = await verifyUstIdnrForPartner(partner.id);
      switch (v.verification_status) {
        case "VALID":
          toast.success("Gültig bei VIES bestätigt");
          break;
        case "INVALID":
          toast.error("VIES: Nicht gültig");
          break;
        case "PENDING":
          toast.info("Prüfung läuft — bitte später erneut laden");
          break;
        case "SERVICE_UNAVAILABLE":
          toast.error(
            "VIES-Dienst zurzeit nicht erreichbar. Erneut versuchen."
          );
          break;
        case "ERROR":
          toast.error(
            `Technischer Fehler — Details: ${v.error_message ?? "unbekannt"}`
          );
          break;
      }
      qc.invalidateQueries({ queryKey: ["ustid_verification"] });
      qc.invalidateQueries({ queryKey: ["business_partners"] });
    } catch (err) {
      toast.error(
        `Verifikation konnte nicht gestartet werden: ${(err as Error).message}`
      );
    } finally {
      setVerifyingId(null);
    }
  }

  if (!selectedMandantId) {
    return (
      <div className="report">
        <header className="report__head">
          <h1>{labels.title}</h1>
        </header>
        <aside className="taxcalc__hint">
          <AlertTriangle size={14} />
          <span>
            Bitte oben zuerst einen Mandanten wählen — {labels.title} werden
            pro Mandant getrennt geführt.
          </span>
        </aside>
      </div>
    );
  }

  return (
    <div className="report">
      <header className="report__head">
        <Link to="/arbeitsplatz" className="report__back">
          <ArrowLeft size={16} />
          Zurück zum Arbeitsplatz
        </Link>
        <div className="report__head-title">
          <h1>{labels.title}</h1>
          <p>
            Stammdaten für {labels.title.toLowerCase()} — Nummern, USt-IdNr,
            Anschrift, Zahlungsbedingungen. Änderungen erzeugen einen neuen
            Snapshot (§ 147 AO 10 J Retention).
          </p>
        </div>
        <div className="period">
          <button
            type="button"
            className="btn btn-primary"
            data-testid="btn-partner-new"
            onClick={() => setEditor({ open: true, mode: "create" })}
          >
            <Plus size={16} /> {labels.newBtn}
          </button>
        </div>
      </header>

      <section className="card" style={{ padding: 12 }}>
        <div
          style={{
            display: "flex",
            gap: 12,
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          <label style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <input
              type="checkbox"
              checked={activeOnly}
              onChange={(e) => setActiveOnly(e.target.checked)}
              data-testid="chk-active-only"
            />
            Nur aktive
          </label>
          <input
            type="text"
            placeholder="Suche (Name, USt-IdNr, Nummer) …"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            data-testid="inp-search"
            style={{
              flex: 1,
              minWidth: 220,
              padding: "6px 10px",
              border: "1px solid var(--border, #ccc)",
              borderRadius: 6,
            }}
          />
          <span
            style={{
              fontSize: "0.85rem",
              color: "var(--muted, #666)",
            }}
            data-testid="row-count"
          >
            {rows.length} Treffer
          </span>
        </div>
      </section>

      <section className="card">
        {rows.length === 0 ? (
          <p style={{ padding: 16 }}>
            Keine {labels.title.toLowerCase()} gefunden. „{labels.newBtn}"
            klicken, um anzulegen.
          </p>
        ) : (
          <table data-testid="partners-table">
            <thead>
              <tr>
                <th>{labels.nummerLabel}</th>
                <th>Name</th>
                <th>USt-IdNr</th>
                <th>Ort</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((p) => (
                <PartnerRow
                  key={p.id}
                  p={p}
                  nummer={labels.getNummer(p)}
                  onVerify={() => handleVerify(p)}
                  onEdit={() =>
                    setEditor({ open: true, mode: "edit", partnerId: p.id })
                  }
                  onDeactivate={() => {
                    if (
                      confirm(
                        `${labels.singular} „${p.name}" wirklich deaktivieren?`
                      )
                    ) {
                      deactivateM.mutate(p.id);
                    }
                  }}
                  isVerifying={verifyingId === p.id}
                />
              ))}
            </tbody>
          </table>
        )}
      </section>

      {editor.open && (
        <PartnerEditor
          mode={editor.mode}
          partnerId={editor.mode === "edit" ? editor.partnerId : undefined}
          defaultType={labels.defaultType}
          clientId={selectedMandantId}
          companyId={companyId}
          onSaved={() => {
            qc.invalidateQueries({ queryKey: ["business_partners"] });
            setEditor({ open: false });
          }}
          onCancel={() => setEditor({ open: false })}
        />
      )}
    </div>
  );
}

function PartnerRow({
  p,
  nummer,
  onVerify,
  onEdit,
  onDeactivate,
  isVerifying,
}: {
  p: BusinessPartner;
  nummer: number | null;
  onVerify: () => void;
  onEdit: () => void;
  onDeactivate: () => void;
  isVerifying: boolean;
}) {
  const latestQ = useQuery({
    queryKey: ["ustid_verification", p.client_id, p.ust_idnr],
    queryFn: () =>
      p.ust_idnr
        ? getLatestVerification(p.client_id, p.ust_idnr)
        : Promise.resolve(null),
    enabled: !!p.ust_idnr,
  });
  const latest = latestQ.data ?? null;
  const status: UstIdVerificationStatus | null =
    latest?.verification_status ?? null;

  return (
    <tr
      className={p.is_active ? "" : "is-inactive"}
      data-testid={`row-${p.id}`}
    >
      <td className="mono">{nummer ?? "—"}</td>
      <td>
        <strong>{p.name}</strong>
      </td>
      <td className="mono">
        {p.ust_idnr ? (
          <span
            style={{
              display: "inline-flex",
              gap: 6,
              alignItems: "center",
              flexWrap: "wrap",
            }}
          >
            {p.ust_idnr}
            <UstIdnrStatusBadge
              status={status}
              lastCheckedAt={latest?.created_at ?? null}
              errorDetail={latest?.error_message ?? null}
              source={latest?.verification_source ?? null}
              testIdSuffix={`row-${p.id}`}
            />
          </span>
        ) : (
          <span style={{ color: "var(--muted)" }}>—</span>
        )}
      </td>
      <td>{p.anschrift_ort ?? "—"}</td>
      <td>
        {p.is_active ? (
          <span className="empl__badge is-active">aktiv</span>
        ) : (
          <span className="empl__badge">inaktiv</span>
        )}
      </td>
      <td style={{ whiteSpace: "nowrap" }}>
        <button
          type="button"
          className="btn btn-ghost btn-sm"
          onClick={onEdit}
          data-testid={`btn-edit-${p.id}`}
          title="Öffnen"
        >
          <Pencil size={12} /> Öffnen
        </button>{" "}
        {p.ust_idnr && (
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={onVerify}
            disabled={isVerifying}
            data-testid={`btn-verify-${p.id}`}
            title="USt-IdNr via VIES prüfen"
          >
            <BadgeCheck size={12} />{" "}
            {isVerifying ? "Prüfe …" : "USt-IdNr prüfen"}
          </button>
        )}{" "}
        <Link
          to={`/partners/${p.id}/history`}
          className="btn btn-ghost btn-sm"
          data-testid={`lnk-history-${p.id}`}
          title="Versions-Historie"
        >
          <History size={12} /> Versionen
        </Link>{" "}
        {p.is_active && (
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={onDeactivate}
            data-testid={`btn-deactivate-${p.id}`}
          >
            Deaktivieren
          </button>
        )}
      </td>
    </tr>
  );
}
