// Multi-Tenancy Phase 1 / Schritt 3 · Guard für Form-Pages.
//
// ESt-/Gewst-/Kst-Formulare sind per Migration 0026 + Schritt 3
// mandant-scoped im localStorage. Ohne aktiven Mandanten darf die
// Seite NICHT rendern (sonst könnte der Nutzer Daten in einem
// Pseudo-Kontext eingeben, die anschließend nicht mandant-scoped
// persistiert würden).
//
// Der Guard zeigt eine kleine Info-Card mit Rückweg zum Arbeitsplatz.

import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, AlertCircle } from "lucide-react";
import { useMandant } from "../contexts/MandantContext";

export function MandantRequiredGuard({
  children,
}: {
  children: ReactNode;
}): ReactNode {
  const { selectedMandantId } = useMandant();
  if (selectedMandantId) return <>{children}</>;
  return (
    <div
      className="card"
      role="status"
      style={{
        padding: "1.5rem",
        maxWidth: 560,
        margin: "2rem auto",
        display: "flex",
        flexDirection: "column",
        gap: "0.75rem",
      }}
      data-testid="mandant-required-guard"
    >
      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "0.5rem",
          color: "var(--ink-soft, #334155)",
          fontWeight: 600,
        }}
      >
        <AlertCircle size={18} aria-hidden="true" />
        <span>Kein Mandant ausgewählt</span>
      </div>
      <p style={{ margin: 0, color: "var(--ink-soft, #334155)" }}>
        Bitte zuerst einen Mandanten im Arbeitsplatz auswählen. Formular-
        Daten werden pro Mandanten getrennt gespeichert.
      </p>
      <div>
        <Link
          to="/arbeitsplatz"
          className="btn btn-primary"
          data-testid="mandant-required-link"
        >
          <ArrowLeft size={14} aria-hidden="true" />
          <span>Zum Arbeitsplatz</span>
        </Link>
      </div>
    </div>
  );
}
