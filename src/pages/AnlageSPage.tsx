/**
 * Phase 3 / Schritt 9 — AnlageS analog zu AnlageG, § 18 EStG.
 * Scope-Unterschied: `honorare` statt `umsaetze`, `reisen`/`fortbildung`/
 * `versicherung` statt `werbung`/`bewirtung`, ein einziges manuelles Feld
 * (`umsatzsteuerpflichtig` — redundant zu `honorare`).
 */
import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMandant } from "../contexts/MandantContext";
import { useYear } from "../contexts/YearContext";
import { fetchAccounts } from "../api/accounts";
import { fetchAllEntries } from "../api/dashboard";
import { buildAnlageS } from "../domain/est/AnlageSBuilder";
import TaxFormBuilder, {
  type FormSpec,
} from "../components/TaxFormBuilder";
import { DrillDownModal } from "../components/DrillDownModal";
import { EntwurfWarningBanner } from "../components/EntwurfWarningBanner";

const SPEC: FormSpec = {
  formId: "anlage-s",
  title: "Anlage S — Einkünfte aus selbständiger Arbeit",
  subtitle:
    "Freiberufliche und andere selbständige Tätigkeit (§ 18 EStG). Strukturierte Erfassung für den Jahresabschluss.",
  resultLabel: "Einkünfte aus selbständiger Arbeit",
  backTo: "/steuer",
  sections: [
    {
      title: "Betriebseinnahmen",
      sign: "plus",
      fields: [
        {
          key: "honorare",
          label: "Honorare / Vergütungen",
          source: "gl-derived",
          glField: "honorare",
        },
        {
          key: "umsatzsteuerpflichtig",
          label: "Umsatzsteuerpflichtige Einnahmen (netto)",
        },
        {
          key: "umsatzsteuerfrei",
          label: "Umsatzsteuerfreie Einnahmen",
          source: "gl-derived",
          glField: "umsatzsteuerfrei",
        },
        {
          key: "sonstige",
          label: "Sonstige Betriebseinnahmen",
          source: "gl-derived",
          glField: "sonstige",
        },
      ],
    },
    {
      title: "Betriebsausgaben",
      description:
        "Absetzbare Kosten im Zusammenhang mit der selbständigen Tätigkeit (§ 4 Abs. 4 EStG).",
      sign: "minus",
      fields: [
        {
          key: "personal",
          label: "Personalkosten (Löhne, Gehälter, SV)",
          source: "gl-derived",
          glField: "personal",
        },
        {
          key: "raum",
          label: "Raum- und Nebenkosten (Büro, Homeoffice)",
          source: "gl-derived",
          glField: "raum",
        },
        {
          key: "fahrzeug",
          label: "Fahrzeugkosten",
          source: "gl-derived",
          glField: "fahrzeug",
        },
        {
          key: "reisen",
          label: "Reisekosten",
          source: "gl-derived",
          glField: "reisen",
        },
        {
          key: "porto_tel",
          label: "Porto, Telefon, Internet",
          source: "gl-derived",
          glField: "porto_tel",
        },
        {
          key: "fortbildung",
          label: "Fortbildung, Fachliteratur",
          source: "gl-derived",
          glField: "fortbildung",
        },
        {
          key: "versicherung",
          label: "Betriebliche Versicherungen & Beiträge",
          source: "gl-derived",
          glField: "versicherung",
        },
        {
          key: "beratung",
          label: "Rechts- und Steuerberatung",
          source: "gl-derived",
          glField: "beratung",
        },
        {
          key: "abschreibungen",
          label: "Abschreibungen (Anlagevermögen, GWG)",
          source: "gl-derived",
          glField: "abschreibungen",
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

export default function AnlageSPage() {
  const { selectedMandantId } = useMandant();
  const { selectedYear } = useYear();
  const queryClient = useQueryClient();
  const [drill, setDrill] = useState<{
    fieldKey: string;
    label: string;
    glField: string;
  } | null>(null);
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
    return buildAnlageS({
      accounts: accountsQ.data,
      entries: entriesQ.data.filter(
        (e) => selectedMandantId === null || e.client_id === selectedMandantId
      ),
      wirtschaftsjahr,
      includeDraft: simMode,
    });
  }, [entriesQ.data, accountsQ.data, selectedMandantId, wirtschaftsjahr, simMode]);

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
