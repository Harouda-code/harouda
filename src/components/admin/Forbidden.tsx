/** Sprint 20.C.3 · 403-Display für Admin-Only-Seiten. */

import { Link } from "react-router-dom";
import { ShieldOff } from "lucide-react";

export function Forbidden({
  reason,
}: {
  reason?: string;
}) {
  return (
    <div
      className="report"
      data-testid="forbidden"
      role="alert"
    >
      <header className="report__head">
        <div className="report__head-title">
          <h1>
            <ShieldOff
              size={22}
              style={{ verticalAlign: "-3px", marginRight: 8 }}
            />
            Zugriff verweigert (403)
          </h1>
          <p>
            {reason ??
              "Diese Seite steht nur Rollen owner, admin und tax_auditor zur Verfügung."}
          </p>
        </div>
      </header>
      <section className="card" style={{ padding: 16 }}>
        <p>
          Bitte kontaktieren Sie den Inhaber oder einen Administrator der
          Kanzlei, falls Sie diese Seite benötigen.
        </p>
        <Link to="/arbeitsplatz" className="btn btn-primary">
          Zurück zum Arbeitsplatz
        </Link>
      </section>
    </div>
  );
}
