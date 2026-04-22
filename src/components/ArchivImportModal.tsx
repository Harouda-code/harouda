/**
 * Phase 3 / Schritt 10 — Archiv-Import-Modal für AnlageN.
 *
 * On-Demand-Import der Lohn-Archiv-Daten eines einzelnen Arbeitnehmers
 * ins AnlageN-Formular. Ein-Weg-Schuss, kein Auto-Refresh. Nutzer wählt
 * Mitarbeiter aus Dropdown, bestätigt per Button → Page-Callback
 * `onImport` erhält den `AnlageNVorschlag`.
 */
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { AlertTriangle, Download } from "lucide-react";
import { Modal } from "./ui/Modal";
import { fetchEmployees } from "../api/employees";
import {
  importAnlageNAusArchiv,
  importAnlageVorsorgeAusArchiv,
  type AnlageNVorschlag,
  type AnlageVorsorgeVorschlag,
} from "../domain/est/archivEstImport";

/** Nacht-Modus (2026-04-21) · Schritt 2: variant entscheidet, welcher
 *  Importer gerufen wird und was `onImport` bekommt. Default bleibt
 *  "anlage-n" für Rückwärts-Kompat zu Phase-3-Schritt-10. */
export type ArchivImportVariant = "anlage-n" | "anlage-vorsorge";

export type ArchivImportModalProps =
  | (ArchivImportBaseProps & {
      variant?: "anlage-n";
      onImport: (vorschlag: AnlageNVorschlag) => void;
    })
  | (ArchivImportBaseProps & {
      variant: "anlage-vorsorge";
      onImport: (vorschlag: AnlageVorsorgeVorschlag) => void;
    });

type ArchivImportBaseProps = {
  open: boolean;
  onClose: () => void;
  clientId: string | null;
  jahr: number;
  companyId: string;
};

export function ArchivImportModal(props: ArchivImportModalProps) {
  const {
    open,
    onClose,
    clientId,
    jahr,
    companyId,
    variant = "anlage-n",
    onImport,
  } = props;
  const employeesQ = useQuery({
    queryKey: ["employees", clientId],
    queryFn: () => fetchEmployees(clientId),
    enabled: open,
  });

  const [selectedEmpId, setSelectedEmpId] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);

  const employees = employeesQ.data ?? [];
  const hasEmployees = employees.length > 0;

  async function handleImport() {
    if (!selectedEmpId) {
      toast.error("Bitte einen Mitarbeiter auswählen.");
      return;
    }
    setSubmitting(true);
    try {
      const importer =
        variant === "anlage-vorsorge"
          ? importAnlageVorsorgeAusArchiv
          : importAnlageNAusArchiv;
      const res = await importer({
        employeeId: selectedEmpId,
        jahr,
        clientId,
        companyId,
      });
      if (res.kind === "ok") {
        toast.success(
          `${variant === "anlage-vorsorge" ? "SV-Beiträge" : "Lohndaten"} importiert (${res.vorschlag.abrechnungen_gefunden} ${
            res.vorschlag.abrechnungen_gefunden === 1
              ? "Abrechnung"
              : "Abrechnungen"
          }).`
        );
        // Runtime-Zweig ist bereits durch `variant` + `importer`
        // narrower — der Cast löst die Union-Intersection-Dichotomie
        // auf, die Props-Type strukturell erzwingt.
        const vorschlag = (res as { vorschlag: AnlageNVorschlag | AnlageVorsorgeVorschlag }).vorschlag;
        (onImport as (v: typeof vorschlag) => void)(vorschlag);
        setSelectedEmpId("");
        onClose();
      } else if (res.kind === "empty") {
        toast.error(
          `Keine Lohnabrechnungen für ${res.jahr} gefunden — Mitarbeiter prüfen oder Lohnlauf starten.`
        );
      } else {
        toast.error(`Import fehlgeschlagen: ${res.detail}`);
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={
        variant === "anlage-vorsorge"
          ? "SV-Beiträge aus Gehaltsabrechnung importieren"
          : "Lohndaten aus Gehaltsabrechnung importieren"
      }
      description={`Jahr ${jahr} — wählen Sie den Mitarbeiter aus, dessen Lohn-Archiv in ${
        variant === "anlage-vorsorge" ? "Anlage Vorsorge" : "Anlage N"
      } übernommen werden soll.`}
      size="md"
      footer={
        <>
          <button
            type="button"
            className="btn btn-ghost"
            onClick={onClose}
            disabled={submitting}
          >
            Abbrechen
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleImport}
            disabled={!selectedEmpId || submitting}
            data-testid="archiv-import-submit"
          >
            <Download size={14} style={{ marginRight: 6 }} />
            {submitting ? "Importiere …" : "Importieren"}
          </button>
        </>
      }
    >
      <div
        role="alert"
        style={{
          display: "flex",
          gap: 8,
          padding: "10px 12px",
          background: "var(--ivory-100, #f7f2e4)",
          border: "1px solid var(--gold, #d8b35c)",
          borderRadius: 6,
          marginBottom: 12,
          fontSize: "0.85rem",
        }}
        data-testid="archiv-import-warning"
      >
        <AlertTriangle
          size={18}
          style={{ flexShrink: 0, color: "var(--gold, #a37100)" }}
          aria-hidden
        />
        <span>
          <strong>Achtung:</strong> Anlage N ist die Einkommensteuer einer
          natürlichen Person. Importieren Sie nur dann Lohndaten, wenn der
          ausgewählte Mitarbeiter identisch mit der Person ist, für die Sie
          diese Anlage erstellen (z. B. Gesellschafter-Geschäftsführer).
        </span>
      </div>

      {employeesQ.isLoading ? (
        <p data-testid="archiv-loading">Lade Mitarbeiter …</p>
      ) : !hasEmployees ? (
        <p data-testid="archiv-no-employees">
          Keine Mitarbeiter im Mandanten für Jahr {jahr} gefunden.
        </p>
      ) : (
        <label style={{ display: "block", fontSize: "0.9rem" }}>
          <span style={{ display: "block", marginBottom: 4 }}>
            Mitarbeiter
          </span>
          <select
            value={selectedEmpId}
            onChange={(e) => setSelectedEmpId(e.target.value)}
            style={{ width: "100%" }}
            data-testid="archiv-employee-select"
          >
            <option value="">— bitte auswählen —</option>
            {employees.map((e) => (
              <option key={e.id} value={e.id}>
                {e.personalnummer} · {e.vorname} {e.nachname}
                {e.steuer_id ? ` · IdNr ${e.steuer_id}` : ""}
              </option>
            ))}
          </select>
        </label>
      )}
    </Modal>
  );
}
