/**
 * Phase 3 / Schritt 9 — AnlageG mit GL-derived Feldern + Drill-down.
 *
 * Struktur: useQuery (accounts + entries) → buildAnlageG →
 * TaxFormBuilder mit `glValues`. Drill-down-State hier, nicht im
 * TaxFormBuilder. Unmapped-Accounts-Panel am Seitenende.
 */
import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMandant } from "../contexts/MandantContext";
import { useYear } from "../contexts/YearContext";
import { fetchAccounts } from "../api/accounts";
import { fetchAllEntries } from "../api/dashboard";
import { buildAnlageG } from "../domain/est/AnlageGBuilder";
import TaxFormBuilder, {
  type FormSpec,
} from "../components/TaxFormBuilder";
import { DrillDownModal } from "../components/DrillDownModal";
import { EntwurfWarningBanner } from "../components/EntwurfWarningBanner";

const SPEC: FormSpec = {
  formId: "anlage-g",
  title: "Anlage G — Einkünfte aus Gewerbebetrieb",
  subtitle:
    "Gewerbliche Einkünfte (§ 15 EStG). Wird in Verbindung mit der Gewerbesteuererklärung genutzt.",
  resultLabel: "Einkünfte aus Gewerbebetrieb",
  backTo: "/steuer",
  sections: [
    {
      title: "Betriebseinnahmen",
      sign: "plus",
      fields: [
        {
          key: "umsaetze",
          label: "Umsätze (netto, 19 % + 7 %)",
          source: "gl-derived",
          glField: "umsaetze",
        },
        {
          key: "umsatzsteuerfrei",
          label: "Steuerfreie Umsätze",
          source: "gl-derived",
          glField: "umsatzsteuerfrei",
        },
        {
          key: "anlagenverkaeufe",
          label: "Erlöse aus Anlagenverkäufen",
          source: "gl-derived",
          glField: "anlagenverkaeufe",
        },
        {
          key: "sonstige_einnahmen",
          label: "Sonstige Betriebseinnahmen",
          source: "gl-derived",
          glField: "sonstige_einnahmen",
        },
      ],
    },
    {
      title: "Wareneinsatz und Fremdleistungen",
      sign: "minus",
      fields: [
        {
          key: "wareneinsatz",
          label: "Wareneinsatz / Wareneinkauf (netto)",
          source: "gl-derived",
          glField: "wareneinsatz",
        },
        {
          key: "fremdleistungen",
          label: "Fremdleistungen / Subunternehmer",
          source: "gl-derived",
          glField: "fremdleistungen",
        },
        { key: "bezugsnebenkosten", label: "Bezugsnebenkosten" },
      ],
    },
    {
      title: "Betriebsausgaben",
      sign: "minus",
      fields: [
        {
          key: "personal",
          label: "Personalkosten",
          source: "gl-derived",
          glField: "personal",
        },
        {
          key: "raum",
          label: "Raumkosten (Miete, Nebenkosten)",
          source: "gl-derived",
          glField: "raum",
        },
        {
          key: "fahrzeug",
          label: "Fahrzeug- und Transportkosten",
          source: "gl-derived",
          glField: "fahrzeug",
        },
        {
          key: "werbung",
          label: "Werbekosten",
          source: "gl-derived",
          glField: "werbung",
        },
        {
          key: "bewirtung",
          label: "Bewirtung (70 % abzugsfähig)",
          source: "gl-derived",
          glField: "bewirtung",
        },
        { key: "reparatur", label: "Reparatur / Instandhaltung" },
        {
          key: "abschreibungen",
          label: "Abschreibungen",
          source: "gl-derived",
          glField: "abschreibungen",
        },
        {
          key: "porto_tel",
          label: "Porto, Telefon, Internet",
          source: "gl-derived",
          glField: "porto_tel",
        },
        {
          key: "beratung",
          label: "Rechts- und Steuerberatung",
          source: "gl-derived",
          glField: "beratung",
        },
        {
          key: "sonstige_ausgaben",
          label: "Sonstige betriebliche Aufwendungen",
          source: "gl-derived",
          glField: "sonstige_ausgaben",
        },
      ],
    },
  ],
};

export default function AnlageGPage() {
  const { selectedMandantId } = useMandant();
  const { selectedYear } = useYear();
  const queryClient = useQueryClient();
  const [drill, setDrill] = useState<{
    fieldKey: string;
    label: string;
    glField: string;
  } | null>(null);
  // Smart-Banner-Sprint: Simulation-Mode. Pro Session, nicht persistiert.
  const [simMode, setSimMode] = useState(false);

  const entriesQ = useQuery({
    queryKey: ["journal_entries", "all", selectedMandantId],
    queryFn: fetchAllEntries,
  });
  const accountsQ = useQuery({
    queryKey: ["accounts", "all-with-inactive"],
    queryFn: fetchAccounts,
  });

  const wirtschaftsjahr = useMemo(
    () => ({
      von: `${selectedYear}-01-01`,
      bis: `${selectedYear}-12-31`,
    }),
    [selectedYear]
  );

  const report = useMemo(() => {
    if (!entriesQ.data || !accountsQ.data) return null;
    return buildAnlageG({
      accounts: accountsQ.data,
      entries: entriesQ.data.filter(
        (e) => selectedMandantId === null || e.client_id === selectedMandantId
      ),
      wirtschaftsjahr,
      includeDraft: simMode,
    });
  }, [entriesQ.data, accountsQ.data, selectedMandantId, wirtschaftsjahr, simMode]);

  // Konto-Liste für den aktuell angeklickten Drill-down.
  const drillKontoNummern = useMemo(() => {
    if (!drill || !report) return [];
    const kn = report.positionen
      .filter((p) => p.feld === drill.glField)
      .map((p) => p.konto_nr);
    return [...new Set(kn)];
  }, [drill, report]);

  return (
    <>
      <TaxFormBuilder
        spec={SPEC}
        glValues={report?.summen ?? {}}
        onDrillDown={setDrill}
        disableExport={simMode}
        aboveForm={
          <EntwurfWarningBanner
            draftCount={report?.draftCount ?? 0}
            simulationMode={simMode}
            onToggleSimulation={() => setSimMode((v) => !v)}
          />
        }
      />

      {report && report.unmappedAccounts.length > 0 && (
        <UnmappedAccountsPanel
          accounts={report.unmappedAccounts}
          accountLookup={accountsQ.data ?? []}
        />
      )}

      <DrillDownModal
        open={drill !== null}
        onClose={() => setDrill(null)}
        fieldLabel={drill?.label ?? ""}
        kontoNummern={drillKontoNummern}
        zeitraumVon={wirtschaftsjahr.von}
        zeitraumBis={wirtschaftsjahr.bis}
        clientId={selectedMandantId}
        onCorrectionCreated={() => {
          void queryClient.invalidateQueries({ queryKey: ["journal_entries"] });
        }}
      />
    </>
  );
}

function UnmappedAccountsPanel({
  accounts,
  accountLookup,
}: {
  accounts: string[];
  accountLookup: { konto_nr: string; bezeichnung: string }[];
}) {
  const [expanded, setExpanded] = useState(false);
  const nameByNr = new Map(
    accountLookup.map((a) => [a.konto_nr, a.bezeichnung])
  );
  return (
    <details
      className="card"
      data-testid="unmapped-panel"
      style={{ margin: "16px 0", padding: "8px 12px" }}
      open={expanded}
      onToggle={(e) => setExpanded((e.target as HTMLDetailsElement).open)}
    >
      <summary
        style={{
          cursor: "pointer",
          fontSize: "0.85rem",
          color: "var(--ink-soft)",
        }}
      >
        Nicht zugeordnete Konten mit Saldo im Zeitraum ({accounts.length})
      </summary>
      <ul style={{ margin: "8px 0 0", fontSize: "0.85rem" }}>
        {accounts.map((nr) => (
          <li key={nr} style={{ fontFamily: "var(--font-mono)" }}>
            {nr}{" "}
            <span
              style={{ color: "var(--ink-soft)", fontFamily: "inherit" }}
            >
              {nameByNr.get(nr) ?? ""}
            </span>
          </li>
        ))}
      </ul>
    </details>
  );
}
