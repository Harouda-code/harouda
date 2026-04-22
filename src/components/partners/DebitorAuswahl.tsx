/**
 * Sprint 19.C · DebitorAuswahl
 *
 * Dropdown/Combobox zur Auswahl eines bestehenden Debitors aus den
 * Stammdaten. Erste Option: "— Freitext (kein Stammdaten-Verweis) —",
 * value=null.
 *
 * Spec (19.C.2):
 * - Reiche Partner via Suche (fuzzy, einfache includes-Matches).
 * - Zeige "Debitor-Nr · Name" + ggf. Ort.
 * - onChange liefert (partnerId: string | null).
 *
 * Bewusst kein Combobox-Accessibility-Framework — wir nutzen
 * ein natives `<select>` mit eingebauter Suche, wobei fuer die
 * Suchbarkeit zusaetzlich ein Text-Input daneben lebt, der die
 * Options per clientId + Suchstring filtert.
 */

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { listBusinessPartners } from "../../api/businessPartners";
import type { BusinessPartner } from "../../types/db";

export type DebitorAuswahlProps = {
  clientId: string | null;
  value: string | null;
  onChange: (partnerId: string | null, partner: BusinessPartner | null) => void;
  /** Wenn true, werden auch Kreditoren-Partner ('both') gezeigt, aber nicht reine Kreditoren. */
  includeBoth?: boolean;
  label?: string;
  disabled?: boolean;
};

export function DebitorAuswahl({
  clientId,
  value,
  onChange,
  includeBoth = true,
  label = "Kunde auswählen",
  disabled = false,
}: DebitorAuswahlProps) {
  const [search, setSearch] = useState("");

  const partnersQ = useQuery({
    queryKey: [
      "business_partners",
      "debitor",
      clientId,
      "active",
      includeBoth,
    ],
    enabled: !!clientId,
    queryFn: () =>
      clientId
        ? listBusinessPartners({
            clientId,
            type: "debitor",
            activeOnly: true,
          })
        : Promise.resolve([]),
  });
  const all = partnersQ.data ?? [];

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return all;
    return all.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        String(p.debitor_nummer ?? "").includes(q) ||
        (p.anschrift_ort ?? "").toLowerCase().includes(q)
    );
  }, [all, search]);

  return (
    <div
      data-testid="debitor-auswahl"
      style={{
        display: "flex",
        gap: 8,
        flexWrap: "wrap",
        alignItems: "center",
      }}
    >
      <label style={{ flex: 1, minWidth: 240 }}>
        <span style={{ display: "block", fontSize: "0.82rem" }}>{label}</span>
        <select
          value={value ?? ""}
          disabled={disabled || !clientId}
          onChange={(e) => {
            const id = e.target.value || null;
            const partner = id ? all.find((p) => p.id === id) ?? null : null;
            onChange(id, partner);
          }}
          data-testid="sel-debitor"
          style={{ width: "100%", padding: "4px 6px" }}
        >
          <option value="">— Freitext (kein Stammdaten-Verweis) —</option>
          {filtered.map((p) => (
            <option key={p.id} value={p.id}>
              {p.debitor_nummer ?? "—"} · {p.name}
              {p.anschrift_ort ? ` · ${p.anschrift_ort}` : ""}
            </option>
          ))}
        </select>
      </label>
      <label style={{ minWidth: 180 }}>
        <span style={{ display: "block", fontSize: "0.82rem" }}>Suche</span>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Name / Nr. / Ort"
          data-testid="inp-debitor-search"
          disabled={disabled || !clientId}
          style={{ width: "100%", padding: "4px 6px" }}
        />
      </label>
    </div>
  );
}
