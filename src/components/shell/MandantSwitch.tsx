// src/components/shell/MandantSwitch.tsx
//
// Mandanten-Auswahl im AppShell-Topbar.
// Aus AppShell.tsx extrahiert (Phase 1, Schritt b/1).
//
// Reine Praesentations-Komponente: alle Daten kommen ueber Props.
// Persistenz und URL-Sync uebernimmt der Aufrufer
// (typischerweise via useMandant() aus MandantContext).

import { Building2 } from "lucide-react";

export type MandantOption = {
  id: string;
  mandant_nr: string;
  name: string;
};

export type MandantSwitchProps = {
  active: MandantOption | null;
  clients: MandantOption[];
  onChange: (id: string | null) => void;
};

export function MandantSwitch({ active, clients, onChange }: MandantSwitchProps) {
  return (
    <label className="shell__mandantpill" title="Aktiver Mandant">
      <Building2 size={14} />
      <select
        value={active?.id ?? ""}
        onChange={(e) => onChange(e.target.value || null)}
        aria-label="Mandant wählen"
      >
        <option value="">Alle Mandanten</option>
        {clients.map((c) => (
          <option key={c.id} value={c.id}>
            {c.mandant_nr} · {c.name}
          </option>
        ))}
      </select>
    </label>
  );
}
