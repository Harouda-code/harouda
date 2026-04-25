// src/components/shell/YearSwitch.tsx
//
// Geschäftsjahr-Auswahl im AppShell-Topbar.
// Aus AppShell.tsx extrahiert (Phase 1, Schritt b/2).
//
// Reine Präsentations-Komponente: aktives Jahr und Liste verfügbarer
// Jahre kommen über Props. Persistenz übernimmt der Aufrufer
// (typischerweise via useYear() aus YearContext).

import { Calendar } from "lucide-react";

export type YearSwitchProps = {
  year: number;
  years: number[];
  onChange: (y: number) => void;
};

export function YearSwitch({ year, years, onChange }: YearSwitchProps) {
  return (
    <label className="shell__year" title="Geschäftsjahr wechseln">
      <Calendar size={14} />
      <span className="shell__year-label">Geschäftsjahr</span>
      <select
        value={year}
        onChange={(e) => onChange(Number(e.target.value))}
        aria-label="Geschäftsjahr wählen"
      >
        {years.map((y) => (
          <option key={y} value={y}>
            {y}
          </option>
        ))}
      </select>
    </label>
  );
}
