/**
 * SvDataIncompleteBanner (Sprint 18 / Schritt 4).
 *
 * Warn-Banner oberhalb des Employee-Profils. Erscheint genau dann,
 * wenn Pflicht-SV-Stammdaten fehlen (DEUeV-relevant).
 *
 * Nur-Lesen: keine eigene Save-Action, nur Jump-Link zum Form-Bereich.
 */
import { AlertTriangle } from "lucide-react";
import {
  EMPLOYEE_SV_FIELD_LABELS,
  formatMissingFields,
  isEmployeeSvDataComplete,
} from "../../domain/employees/svCompleteness";
import type { Employee } from "../../types/db";

export function SvDataIncompleteBanner({
  employee,
}: {
  employee: Employee;
}) {
  const check = isEmployeeSvDataComplete(employee);
  if (check.complete) return null;
  const labelList = formatMissingFields(
    check.missing,
    EMPLOYEE_SV_FIELD_LABELS
  );

  return (
    <aside
      role="note"
      data-testid="sv-data-incomplete-banner"
      data-missing-count={check.missing.length}
      className="ustva__disclaimer"
      style={{
        display: "flex",
        gap: 8,
        alignItems: "flex-start",
        background: "rgba(210, 120, 70, 0.08)",
        border: "1px solid rgba(210, 120, 70, 0.3)",
        padding: 12,
        borderRadius: 6,
        marginBottom: 12,
      }}
    >
      <AlertTriangle size={18} style={{ flexShrink: 0, marginTop: 2 }} />
      <div style={{ flex: 1 }}>
        <strong>SV-Stammdaten unvollständig.</strong>{" "}
        <span>
          Fehlende Felder: <em>{labelList}</em>. Ohne diese Daten schlägt die
          Generierung von SV-Meldungen (DEUeV) fehl. Bitte unten im Bereich
          „SV-Stammdaten" ergänzen.
        </span>
        <div style={{ marginTop: 6 }}>
          <a
            href="#sv-stammdaten"
            className="btn btn-outline"
            data-testid="sv-data-jump-link"
          >
            Jetzt ausfüllen →
          </a>
        </div>
      </div>
    </aside>
  );
}
