import { useMemo } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  AlertTriangle,
  ArrowLeft,
  Check,
  Clock,
  Copy,
  Info,
  Mail,
  MailOpen,
  Receipt,
  Trash2,
} from "lucide-react";
import {
  buildMailtoUrl,
  buildReceiptRequestDraft,
  deleteReceiptRequest,
  fetchReceiptRequests,
  updateReceiptRequestStatus,
} from "../api/receiptRequests";
import { useSettings } from "../contexts/SettingsContext";
import { useMandant } from "../contexts/MandantContext";
import { useUser } from "../contexts/UserContext";
import { usePermissions } from "../hooks/usePermissions";
import type { ReceiptRequest, ReceiptRequestStatus } from "../types/db";
import "./ReportView.css";
import "./TaxCalc.css";
import "./ReceiptRequestsPage.css";

const euro = new Intl.NumberFormat("de-DE", {
  style: "currency",
  currency: "EUR",
});

const STATUS_LABEL: Record<ReceiptRequestStatus, string> = {
  open: "Offen",
  received: "Erhalten",
  cancelled: "Storniert",
};

const STATUS_COLOR: Record<ReceiptRequestStatus, string> = {
  open: "var(--gold-700)",
  received: "var(--success)",
  cancelled: "var(--muted)",
};

function daysSince(iso: string): number {
  return Math.floor(
    (Date.now() - new Date(iso).getTime()) / (1000 * 60 * 60 * 24)
  );
}

export default function ReceiptRequestsPage() {
  const perms = usePermissions();
  const qc = useQueryClient();
  const { settings } = useSettings();
  const { user } = useUser();
  const { selectedMandantId } = useMandant();

  const q = useQuery({
    queryKey: ["receipt_requests", selectedMandantId],
    queryFn: () => fetchReceiptRequests(selectedMandantId),
  });

  const statusM = useMutation({
    mutationFn: (args: { id: string; status: ReceiptRequestStatus }) =>
      updateReceiptRequestStatus(args.id, args.status, null, selectedMandantId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["receipt_requests"] });
      toast.success("Status aktualisiert.");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const deleteM = useMutation({
    mutationFn: (id: string) => deleteReceiptRequest(id, selectedMandantId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["receipt_requests"] });
      toast.success("Anforderung gelöscht.");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const rows = q.data ?? [];
  const counts = useMemo(() => {
    let open = 0;
    let overdue = 0;
    let received = 0;
    let cancelled = 0;
    for (const r of rows) {
      if (r.status === "open") {
        open++;
        if (daysSince(r.requested_at) > 7) overdue++;
      } else if (r.status === "received") received++;
      else if (r.status === "cancelled") cancelled++;
    }
    return { open, overdue, received, cancelled };
  }, [rows]);

  function composeDraftAndOpen(r: ReceiptRequest) {
    const { subject, body } = buildReceiptRequestDraft(
      {
        bank_datum: r.bank_datum,
        bank_betrag: Number(r.bank_betrag),
        bank_verwendung: r.bank_verwendung,
        bank_gegenseite: r.bank_gegenseite,
        bank_iban: r.bank_iban,
        recipient_name: r.recipient_name,
      },
      {
        kanzleiName: settings.kanzleiName,
        replyEmail: user?.email ?? settings.kanzleiEmail,
      }
    );
    if (r.recipient_email) {
      const url = buildMailtoUrl(r.recipient_email, subject, body);
      window.location.href = url;
    } else {
      // Kein Adressat — Text in die Zwischenablage
      const full = `Betreff: ${subject}\n\n${body}`;
      navigator.clipboard
        .writeText(full)
        .then(() => toast.success("E-Mail-Entwurf in Zwischenablage kopiert."))
        .catch(() => toast.error("Kopieren fehlgeschlagen."));
    }
  }

  if (!perms.canRead) {
    return (
      <div className="report">
        <header className="report__head">
          <h1>Beleg-Anforderungen</h1>
        </header>
        <aside className="taxcalc__hint">
          <AlertTriangle size={14} />
          <span>Kein Zugriff.</span>
        </aside>
      </div>
    );
  }

  return (
    <div className="report rcpt">
      <header className="report__head">
        <Link to="/banking/reconciliation" className="report__back">
          <ArrowLeft size={16} />
          Zurück zur Bank-Abstimmung
        </Link>
        <div className="report__head-title">
          <h1>
            <Receipt
              size={22}
              style={{ verticalAlign: "-3px", marginRight: 8 }}
            />
            Beleg-Anforderungen
          </h1>
          <p>
            Tracker für fehlende Belege zu Bank-Zahlungen. Der E-Mail-Versand
            läuft über Ihr Standard-Mailprogramm (<code>mailto:</code>) —
            die App versendet <strong>nicht</strong> automatisch.
          </p>
        </div>
      </header>

      <aside className="taxcalc__hint">
        <Info size={14} />
        <span>
          <strong>Scope:</strong> kein automatischer Mail-Versand, kein
          Kundenportal, keine automatische Zuordnung zu eingereichten Belegen.
          Status-Übergang auf „Erhalten" erfolgt manuell, sobald Sie den Beleg
          erhalten haben.
        </span>
      </aside>

      <section className="rcpt__kpis">
        <KpiCard label="Offen" value={counts.open} color="var(--gold-700)" />
        <KpiCard
          label="Davon > 7 Tage"
          value={counts.overdue}
          color={counts.overdue > 0 ? "var(--danger)" : "var(--muted)"}
        />
        <KpiCard
          label="Erhalten"
          value={counts.received}
          color="var(--success)"
        />
        <KpiCard label="Storniert" value={counts.cancelled} color="var(--muted)" />
      </section>

      {rows.length === 0 ? (
        <div className="card rcpt__empty">
          <p>
            Keine Beleg-Anforderungen angelegt. Fehlende Belege markieren Sie
            auf der <Link to="/banking/reconciliation">Bank-Abstimmung</Link>
            mit „Beleg anfordern".
          </p>
        </div>
      ) : (
        <section className="card rcpt__list">
          <table>
            <thead>
              <tr>
                <th>Angefordert</th>
                <th>Bankzahlung</th>
                <th>Empfänger</th>
                <th>Status</th>
                <th>Aktion</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const age = daysSince(r.requested_at);
                const isOverdue = r.status === "open" && age > 7;
                return (
                  <tr
                    key={r.id}
                    className={isOverdue ? "is-overdue" : undefined}
                  >
                    <td>
                      <div className="mono">
                        {new Date(r.requested_at).toLocaleDateString("de-DE")}
                      </div>
                      <div className="rcpt__muted">
                        {age === 0
                          ? "heute"
                          : age === 1
                            ? "gestern"
                            : `vor ${age} Tagen`}
                      </div>
                    </td>
                    <td>
                      <div>
                        <strong>{euro.format(Number(r.bank_betrag))}</strong>{" "}
                        am{" "}
                        <span className="mono">
                          {new Date(r.bank_datum).toLocaleDateString("de-DE")}
                        </span>
                      </div>
                      {r.bank_gegenseite && (
                        <div className="rcpt__muted">
                          an {r.bank_gegenseite}
                        </div>
                      )}
                      {r.bank_verwendung && (
                        <div className="rcpt__muted">
                          „{r.bank_verwendung.slice(0, 80)}"
                        </div>
                      )}
                    </td>
                    <td>
                      {r.recipient_name && (
                        <div>{r.recipient_name}</div>
                      )}
                      {r.recipient_email ? (
                        <div className="mono rcpt__muted">
                          {r.recipient_email}
                        </div>
                      ) : (
                        <div className="rcpt__muted">kein E-Mail-Kontakt</div>
                      )}
                    </td>
                    <td>
                      <span
                        className="rcpt__badge"
                        style={{
                          color: STATUS_COLOR[r.status],
                          borderColor: STATUS_COLOR[r.status],
                        }}
                      >
                        {STATUS_LABEL[r.status]}
                      </span>
                    </td>
                    <td>
                      <div className="rcpt__actions">
                        <button
                          type="button"
                          className="btn btn-outline btn-sm"
                          onClick={() => composeDraftAndOpen(r)}
                          title={
                            r.recipient_email
                              ? "E-Mail-Entwurf öffnen"
                              : "Entwurf kopieren"
                          }
                        >
                          {r.recipient_email ? (
                            <Mail size={14} />
                          ) : (
                            <Copy size={14} />
                          )}
                        </button>
                        {r.status === "open" && (
                          <>
                            <button
                              type="button"
                              className="btn btn-primary btn-sm"
                              onClick={() =>
                                statusM.mutate({
                                  id: r.id,
                                  status: "received",
                                })
                              }
                              disabled={!perms.canWrite}
                              title="Als erhalten markieren"
                            >
                              <Check size={14} />
                            </button>
                            <button
                              type="button"
                              className="btn btn-ghost btn-sm"
                              onClick={() =>
                                statusM.mutate({
                                  id: r.id,
                                  status: "cancelled",
                                })
                              }
                              disabled={!perms.canWrite}
                              title="Stornieren"
                            >
                              <Clock size={14} />
                            </button>
                          </>
                        )}
                        {r.status !== "open" && perms.canManage && (
                          <button
                            type="button"
                            className="btn btn-ghost btn-sm"
                            onClick={() =>
                              statusM.mutate({ id: r.id, status: "open" })
                            }
                            title="Erneut öffnen"
                          >
                            <MailOpen size={14} />
                          </button>
                        )}
                        {perms.canManage && (
                          <button
                            type="button"
                            className="btn btn-ghost btn-sm"
                            onClick={() => {
                              if (confirm("Anforderung löschen?"))
                                deleteM.mutate(r.id);
                            }}
                            title="Löschen"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </section>
      )}
    </div>
  );
}

function KpiCard({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div className="card rcpt__kpi">
      <span className="rcpt__kpi-label">{label}</span>
      <span className="rcpt__kpi-value" style={{ color }}>
        {value}
      </span>
    </div>
  );
}
