/**
 * Sprint 19.C · DuplicateWarningBanner
 *
 * Umsetzung von Gate-19.B-Reminder B:
 *
 * (1) Sichtbar direkt ueber dem Speichern-Button.
 * (2) Pro softWarning:
 *     - Name des aehnlichen Partners + Nummer
 *     - Begruendung (z. B. "Levenshtein-Distanz 2, gleiche PLZ 49082")
 *     - Button "Vorhandenen Datensatz öffnen"
 * (3) Zwei Buttons unten:
 *     - "Abbrechen und prüfen" (Primary)
 *     - "Ignorieren und trotzdem speichern" (Secondary, mit Confirm-Dialog)
 * (4) Override persistiert NICHTS Zusaetzliches (Audit-Trail ist Sprint 20+).
 *
 * Hard-Blocks rendert diese Komponente NICHT — die sind Save-Blocker und
 * gehoeren als rote Fehlermeldung neben den Save-Button (im Editor-Callsite).
 */

import { useMemo, useState } from "react";
import type { BusinessPartner } from "../../types/db";
import type {
  DuplicateCheckResult,
  DuplicateSoftWarning,
} from "../../domain/partners/duplicateCheck";

export type DuplicateWarningBannerProps = {
  result: DuplicateCheckResult | null;
  /** Nachschlage-Liste fuer Name+Nummer-Anzeige pro Warning. */
  partners: BusinessPartner[];
  onOpenPartner: (partnerId: string) => void;
  onAbort: () => void;
  onIgnoreAndSave: () => void;
};

function describeReason(w: DuplicateSoftWarning, plz: string | null): string {
  const plzTail = plz ? `, gleiche PLZ ${plz}` : "";
  return `Name ähnelt (Levenshtein-Distanz ${w.distance})${plzTail}`;
}

function displayNameWithNumber(p: BusinessPartner): string {
  const parts: string[] = [];
  if (p.debitor_nummer != null) parts.push(`D ${p.debitor_nummer}`);
  if (p.kreditor_nummer != null) parts.push(`K ${p.kreditor_nummer}`);
  const numTag = parts.length > 0 ? ` (${parts.join(" / ")})` : "";
  return `${p.name}${numTag}`;
}

export function DuplicateWarningBanner({
  result,
  partners,
  onOpenPartner,
  onAbort,
  onIgnoreAndSave,
}: DuplicateWarningBannerProps) {
  const [confirmOpen, setConfirmOpen] = useState(false);

  const partnerById = useMemo(() => {
    const m = new Map<string, BusinessPartner>();
    for (const p of partners) m.set(p.id, p);
    return m;
  }, [partners]);

  if (!result) return null;
  const soft = result.softWarnings;
  if (soft.length === 0) return null;

  return (
    <aside
      data-testid="duplicate-warning-banner"
      style={{
        border: "1px solid #d9b459",
        borderLeft: "4px solid #d9b459",
        background: "#fff8e1",
        padding: 12,
        borderRadius: 6,
        marginBottom: 12,
      }}
    >
      <header style={{ marginBottom: 6 }}>
        <strong>Mögliche Duplikate — bitte prüfen</strong>
      </header>
      <ul
        style={{ margin: "6px 0 10px 18px", padding: 0 }}
        data-testid="duplicate-warning-list"
      >
        {soft.map((w) => {
          const existing = partnerById.get(w.similarPartnerId);
          const name = existing
            ? displayNameWithNumber(existing)
            : `Partner ${w.similarPartnerId}`;
          const plz = existing?.anschrift_plz ?? null;
          return (
            <li
              key={w.similarPartnerId}
              style={{ marginBottom: 6 }}
              data-testid={`duplicate-warning-item-${w.similarPartnerId}`}
            >
              <div>
                <strong>{name}</strong>
              </div>
              <div
                style={{
                  fontSize: "0.82rem",
                  color: "#555",
                  margin: "2px 0",
                }}
              >
                {describeReason(w, plz)}
              </div>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => onOpenPartner(w.similarPartnerId)}
                data-testid={`btn-open-similar-${w.similarPartnerId}`}
              >
                Vorhandenen Datensatz öffnen
              </button>
            </li>
          );
        })}
      </ul>
      <div style={{ display: "flex", gap: 8 }}>
        <button
          type="button"
          className="btn btn-primary btn-sm"
          onClick={onAbort}
          data-testid="btn-dup-abort"
        >
          Abbrechen und prüfen
        </button>
        <button
          type="button"
          className="btn btn-outline btn-sm"
          onClick={() => setConfirmOpen(true)}
          data-testid="btn-dup-ignore"
        >
          Ignorieren und trotzdem speichern
        </button>
      </div>
      {confirmOpen && (
        <div
          role="dialog"
          aria-modal="true"
          data-testid="dup-confirm-dialog"
          style={{
            marginTop: 10,
            padding: 10,
            border: "1px solid #ccc",
            background: "#fff",
            borderRadius: 4,
          }}
        >
          <p style={{ marginTop: 0 }}>
            Sind Sie sicher, dass es sich um einen anderen Partner handelt?
            Ein späterer Merge ist nur mit Admin-Rechten und im
            Audit-Log nachvollziehbar möglich.
          </p>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={() => setConfirmOpen(false)}
              data-testid="btn-dup-confirm-cancel"
            >
              Zurück
            </button>
            <button
              type="button"
              className="btn btn-danger btn-sm"
              onClick={() => {
                setConfirmOpen(false);
                onIgnoreAndSave();
              }}
              data-testid="btn-dup-confirm-ok"
            >
              Ja, als neuen Partner speichern
            </button>
          </div>
        </div>
      )}
    </aside>
  );
}
