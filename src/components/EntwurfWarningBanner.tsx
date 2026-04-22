/**
 * Smart-Banner-Sprint — Warning-Banner für AnlageG/S bei
 * Entwurfs-Buchungen im Zeitraum.
 *
 * Rechtsbasis: GoBD Rz. 58-60 (Festschreibung Pflicht vor
 * Steuererklärung) · § 146 AO (Unveränderbarkeit).
 *
 * Semantik:
 *   - `draftCount === 0` → `null` (kein Banner).
 *   - Sonst: Banner mit Count + Toggle „Entwürfe einbeziehen" +
 *     Link zum Journal.
 *   - Bei `simulationMode === true`: Banner-Variant wechselt auf
 *     Simulation-Style, Text warnt vor deaktiviertem Export.
 *
 * Keine URL-Persistenz des Simulation-State — pro Session.
 */
import { AlertTriangle } from "lucide-react";
import { Link } from "react-router-dom";

export type EntwurfWarningBannerProps = {
  draftCount: number;
  simulationMode: boolean;
  onToggleSimulation: () => void;
};

export function EntwurfWarningBanner({
  draftCount,
  simulationMode,
  onToggleSimulation,
}: EntwurfWarningBannerProps) {
  if (draftCount === 0) return null;

  // LocalStorage-Hint für JournalPage (nicht erzwungen, rein
  // kooperativ — JournalPage kann ihn beim Mount lesen, muss aber
  // nicht. Spec: dieser Schritt ändert JournalPage nicht).
  const writeJournalHint = () => {
    try {
      localStorage.setItem("harouda:journal:status-filter", "entwurf");
    } catch {
      /* best-effort */
    }
  };

  const bg = simulationMode
    ? "var(--warning-subtle, #fff9e6)"
    : "var(--ivory-100, #f7f2e4)";
  const border = simulationMode
    ? "var(--warning, #c98b0a)"
    : "var(--gold, #d8b35c)";

  return (
    <div
      role="alert"
      className="no-print"
      data-testid="entwurf-warning-banner"
      style={{
        display: "flex",
        gap: 10,
        alignItems: "flex-start",
        padding: "10px 14px",
        margin: "8px 0",
        background: bg,
        border: `1px solid ${border}`,
        borderRadius: 6,
        fontSize: "0.85rem",
      }}
    >
      <AlertTriangle
        size={18}
        style={{ flexShrink: 0, color: "var(--gold, #a37100)", marginTop: 2 }}
        aria-hidden
      />
      <div style={{ flex: 1 }}>
        {simulationMode ? (
          <p style={{ margin: 0 }} data-testid="entwurf-simulation-text">
            <strong>Simulations-Modus aktiv</strong> — PDF-Export deaktiviert.
            Um final zu exportieren: Entwürfe festschreiben.
          </p>
        ) : (
          <p style={{ margin: 0 }} data-testid="entwurf-default-text">
            <strong>{draftCount}</strong>{" "}
            {draftCount === 1 ? "Buchung im Entwurfs-Status betrifft" : "Buchungen im Entwurfs-Status betreffen"}{" "}
            diese Anlage. Die unten angezeigten Werte berücksichtigen sie
            NICHT. Für die finale Steuererklärung müssen Entwürfe
            festgeschrieben werden.
          </p>
        )}
        <div
          style={{
            display: "flex",
            gap: 14,
            alignItems: "center",
            marginTop: 8,
            flexWrap: "wrap",
          }}
        >
          <Link
            to="/journal"
            onClick={writeJournalHint}
            data-testid="entwurf-journal-link"
            style={{ fontSize: "0.82rem" }}
          >
            Zum Journal → Entwürfe anzeigen
          </Link>
          <label
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              fontSize: "0.82rem",
              cursor: "pointer",
            }}
            data-testid="entwurf-toggle-label"
          >
            <input
              type="checkbox"
              checked={simulationMode}
              onChange={onToggleSimulation}
              data-testid="entwurf-toggle"
            />
            Entwürfe einbeziehen (Simulation)
          </label>
        </div>
      </div>
    </div>
  );
}
