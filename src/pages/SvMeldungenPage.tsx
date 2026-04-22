/**
 * SvMeldungenPage — Sprint 15 / Schritt 6.
 *
 * UI fuer DEUeV-Meldungen-Export (Anmeldung, Abmeldung, Jahresmeldung)
 * + Beitragsnachweis-CSV. Fuer den manuellen Upload im SV-Meldeportal
 * (Nachfolger sv.net seit 2024).
 *
 * MVP-Grenzen (dokumentiert im Warn-Banner):
 *  - Keine ITSG-Trustcenter-Uebermittlung (Zertifikat-frei).
 *  - Pflichtfelder, die im aktuellen Arbeitnehmer-Type fehlen
 *    (Staatsangehoerigkeit, Taetigkeitsschluessel, BBNR der Kasse,
 *    Adresse), werden je Meldung manuell per Prompt abgefragt —
 *    ein persistentes Schema ist Tech-Debt (siehe
 *    docs/DSUV-SCHEMA-UPDATE-GUIDE.md §7).
 */
import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, ArrowLeft, Download } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { MandantRequiredGuard } from "../components/MandantRequiredGuard";
import { useMandant } from "../contexts/MandantContext";
import { useYear } from "../contexts/YearContext";
import { downloadText } from "../utils/exporters";
import { fetchEmployees } from "../api/employees";
import { fetchClients } from "../api/clients";
import {
  buildDsuvXml,
  type DsuvAbsender,
} from "../domain/sv/DsuvXmlBuilder";
import {
  buildBeitragsnachweisCsv,
  type BeitragsgruppeSumme,
} from "../domain/sv/DsuvCsvBuilder";
import {
  buildJahresmeldung,
  MissingSvDataError,
  resolveBuildContext,
} from "../domain/sv/SvMeldungBuilder";
import type {
  ArbeitgeberExtraData,
  DEUeVMeldung,
} from "../domain/sv/dsuvTypes";
import type { LohnabrechnungArchivRow } from "../domain/lohn/types";
import type { Client, Employee } from "../types/db";
import {
  CLIENT_ANSCHRIFT_FIELD_LABELS,
  EMPLOYEE_SV_FIELD_LABELS,
  formatMissingFields,
  isClientAnschriftComplete,
  isEmployeeSvDataComplete,
} from "../domain/employees/svCompleteness";

type AbsenderFormState = {
  betriebsnummer: string;
  name: string;
  ansprechpartner: string;
  email: string;
  strasse: string;
  hausnummer: string;
  plz: string;
  ort: string;
};

const EMPTY_ABSENDER: AbsenderFormState = {
  betriebsnummer: "",
  name: "",
  ansprechpartner: "",
  email: "",
  strasse: "",
  hausnummer: "",
  plz: "",
  ort: "",
};

function absenderStorageKey(mandantId: string): string {
  return `harouda:sv-absender:${mandantId}`;
}

function loadAbsender(mandantId: string): AbsenderFormState {
  const raw = localStorage.getItem(absenderStorageKey(mandantId));
  if (!raw) return { ...EMPTY_ABSENDER };
  try {
    return { ...EMPTY_ABSENDER, ...(JSON.parse(raw) as AbsenderFormState) };
  } catch {
    return { ...EMPTY_ABSENDER };
  }
}

function saveAbsender(mandantId: string, state: AbsenderFormState): void {
  localStorage.setItem(absenderStorageKey(mandantId), JSON.stringify(state));
}

function toDsuvAbsender(s: AbsenderFormState): DsuvAbsender {
  return {
    betriebsnummer: s.betriebsnummer,
    name: s.name,
    ansprechpartner: s.ansprechpartner,
    email: s.email,
  };
}
function toArbeitgeberExtraData(
  s: AbsenderFormState
): ArbeitgeberExtraData {
  return {
    betriebsnummer: s.betriebsnummer,
    name: s.name,
    anschrift: {
      strasse: s.strasse,
      hausnummer: s.hausnummer,
      plz: s.plz,
      ort: s.ort,
    },
  };
}

function SvMeldungenInner() {
  const { selectedMandantId } = useMandant();
  const { selectedYear } = useYear();
  const mandantId = selectedMandantId ?? "";

  const [absender, setAbsender] = useState<AbsenderFormState>(() =>
    mandantId ? loadAbsender(mandantId) : { ...EMPTY_ABSENDER }
  );
  useEffect(() => {
    if (mandantId) setAbsender(loadAbsender(mandantId));
  }, [mandantId]);

  const [pendingMeldungen, setPendingMeldungen] = useState<DEUeVMeldung[]>([]);

  // Employees + Clients aus der DB. Ersetzt den DEMO_EMPLOYEES-Stub aus
  // Sprint 15; Sprint 18 liest jetzt echte Stammdaten (Migration 0032/0033).
  const employeesQ = useQuery({
    queryKey: ["employees", mandantId],
    queryFn: () => fetchEmployees(mandantId || null),
    enabled: !!mandantId,
  });
  const clientsQ = useQuery({
    queryKey: ["clients"],
    queryFn: fetchClients,
    enabled: !!mandantId,
  });
  const activeClient = useMemo<Client | undefined>(
    () => (clientsQ.data ?? []).find((c) => c.id === mandantId),
    [clientsQ.data, mandantId]
  );
  const incompleteEmployees = useMemo(
    () =>
      (employeesQ.data ?? [])
        .filter((e) => e.is_active)
        .map((e) => ({ emp: e, check: isEmployeeSvDataComplete(e) }))
        .filter((x) => !x.check.complete),
    [employeesQ.data]
  );
  const clientAnschriftCheck = useMemo(
    () => (activeClient ? isClientAnschriftComplete(activeClient) : null),
    [activeClient]
  );

  // Beitragsnachweis-Monat.
  const now = new Date();
  const [nachweisMonat, setNachweisMonat] = useState<number>(now.getMonth() + 1);

  const absenderValid =
    absender.betriebsnummer.length === 8 &&
    absender.name.trim().length > 0 &&
    absender.strasse.trim().length > 0 &&
    absender.plz.trim().length > 0 &&
    absender.ort.trim().length > 0;

  function updateAbsenderField<K extends keyof AbsenderFormState>(
    field: K,
    value: string
  ): void {
    const next = { ...absender, [field]: value };
    setAbsender(next);
    if (mandantId) saveAbsender(mandantId, next);
  }

  function handleJahresmeldung(emp: Employee): void {
    if (!absenderValid) {
      toast.error(
        "Bitte zuerst den Absender-Block (Arbeitgeber) vollstaendig ausfuellen."
      );
      return;
    }
    if (!activeClient) {
      toast.error("Mandant nicht geladen.");
      return;
    }
    // Pre-Flight: SV-Stammdaten vollstaendig?
    const empCheck = isEmployeeSvDataComplete(emp);
    if (!empCheck.complete) {
      const labels = formatMissingFields(
        empCheck.missing,
        EMPLOYEE_SV_FIELD_LABELS
      );
      toast.error(
        `Stammdaten unvollständig für ${emp.vorname} ${emp.nachname}: ${labels}. Bitte unter /lohn/arbeitnehmer ergänzen.`
      );
      return;
    }
    try {
      const ctx = resolveBuildContext(emp, activeClient, {
        arbeitgeberOverride: toArbeitgeberExtraData(absender),
      });
      const meldung = buildJahresmeldung({
        arbeitnehmer: ctx.arbeitnehmer,
        extraAn: ctx.extraAn,
        arbeitgeber: ctx.arbeitgeber,
        jahr: selectedYear,
        archivRows: [] as LohnabrechnungArchivRow[],
      });
      setPendingMeldungen((prev) => [...prev, meldung]);
      const overrideSuffix = ctx.overrideUsed
        ? " (mit Absender-Override)"
        : "";
      toast.success(
        `Jahresmeldung für ${emp.vorname} ${emp.nachname} vorbereitet${overrideSuffix}.`
      );
    } catch (err) {
      if (err instanceof MissingSvDataError) {
        toast.error(err.message);
      } else {
        toast.error(
          `Fehler: ${err instanceof Error ? err.message : String(err)}`
        );
      }
    }
  }

  function handleDsuvExport(): void {
    if (pendingMeldungen.length === 0) {
      toast.error("Keine Meldungen vorbereitet.");
      return;
    }
    const r = buildDsuvXml(pendingMeldungen, toDsuvAbsender(absender));
    downloadText(
      r.xml,
      `dsuv_${selectedYear}_${mandantId}.xml`,
      "application/xml;charset=utf-8"
    );
    const warnSuffix = r.warnings.length
      ? ` — Warnungen: ${r.warnings.length}`
      : "";
    toast.success(
      `DSuV-XML exportiert (${r.meldungen_count} Meldungen, Schema ${r.schema_version}${warnSuffix}).`
    );
  }

  function handleBeitragsnachweisCsv(): void {
    if (!absenderValid) {
      toast.error("Absender-Block unvollstaendig.");
      return;
    }
    // Im MVP keine Auto-Aggregation — leere Liste, der Nutzer bekommt
    // nur den CSV-Header + kann die Zeilen im Kassenportal ergaenzen.
    const bg: BeitragsgruppeSumme[] = [];
    const r = buildBeitragsnachweisCsv({
      companyId: "demo",
      mandantId,
      monat: nachweisMonat,
      jahr: selectedYear,
      beitragsgruppen: bg,
    });
    downloadText(
      r.csv,
      `beitragsnachweis_${selectedYear}_${String(nachweisMonat).padStart(2, "0")}_${mandantId}.csv`,
      "text/csv;charset=utf-8"
    );
    toast.success(
      `Beitragsnachweis-CSV exportiert (${r.zeilen_count} Zeilen; Warnungen ${r.warnings.length}).`
    );
  }

  const employeeRows: Employee[] = useMemo(
    () => (employeesQ.data ?? []).filter((e) => e.is_active),
    [employeesQ.data]
  );

  return (
    <div className="report">
      <header className="report__head no-print">
        <Link to="/lohn" className="report__back">
          <ArrowLeft size={16} /> Zurück zu Lohn
        </Link>
        <div className="report__head-title">
          <h1>SV-Meldungen (DEUeV-Export)</h1>
          <p>
            Erzeugt DSuV-konforme Dateien für den manuellen Upload im
            SV-Meldeportal (https://sv-meldeportal.de) bzw. sv.net ·
            KEINE direkte ITSG-Übermittlung · Schema-Stand 2025-04.
          </p>
        </div>
      </header>

      <aside
        className="ustva__disclaimer no-print"
        data-testid="sv-warn-banner"
        style={{
          marginBottom: 12,
          display: "flex",
          gap: 8,
          alignItems: "flex-start",
          background: "rgba(210,120,70,0.08)",
          border: "1px solid rgba(210,120,70,0.3)",
          padding: 12,
          borderRadius: 6,
        }}
      >
        <AlertTriangle size={18} />
        <div>
          <strong>Hinweis:</strong> Dieses Modul erzeugt DSuV-konforme
          Dateien für den <em>manuellen Upload</em> im SV-Meldeportal
          oder sv.net. Es findet keine direkte Übermittlung an die ITSG
          statt. Prüfen Sie die Dateien vor dem Upload auf Vollständigkeit.
        </div>
      </aside>

      {/* Sprint 18: Pre-Flight — fehlende Stammdaten sichtbar machen. */}
      {(incompleteEmployees.length > 0 ||
        (clientAnschriftCheck && !clientAnschriftCheck.complete)) && (
        <aside
          role="note"
          data-testid="sv-preflight-warning"
          data-incomplete-count={incompleteEmployees.length}
          className="ustva__disclaimer"
          style={{
            marginBottom: 12,
            background: "rgba(210, 120, 70, 0.08)",
            border: "1px solid rgba(210, 120, 70, 0.3)",
            padding: 12,
            borderRadius: 6,
            fontSize: "0.86rem",
          }}
        >
          <strong>Pre-Flight-Hinweis:</strong>
          <ul style={{ margin: "6px 0 0 18px" }}>
            {incompleteEmployees.length > 0 && (
              <li>
                <strong>{incompleteEmployees.length}</strong> Arbeitnehmer mit
                unvollständigen SV-Stammdaten —{" "}
                <Link to="/lohn/arbeitnehmer">
                  jetzt in /lohn/arbeitnehmer vervollständigen
                </Link>
                .
              </li>
            )}
            {clientAnschriftCheck && !clientAnschriftCheck.complete && (
              <li>
                Mandant-Anschrift unvollständig: Fehlende Felder{" "}
                <em>
                  {formatMissingFields(
                    clientAnschriftCheck.missing,
                    CLIENT_ANSCHRIFT_FIELD_LABELS
                  )}
                </em>{" "}
                —{" "}
                <Link to="/clients">in /clients ergänzen</Link>.
              </li>
            )}
          </ul>
        </aside>
      )}

      {/* Absender-Block. */}
      <section
        style={{ marginBottom: 20 }}
        data-testid="sv-absender-block"
      >
        <h2>Absender (Arbeitgeber) — Stammdaten</h2>
        <p style={{ color: "var(--muted)", fontSize: "0.85rem" }}>
          Diese Angaben werden pro Mandant in localStorage persistiert
          und in jede Meldung eingetragen.
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          <label>
            <span>Betriebsnummer (8-stellig)</span>
            <input
              type="text"
              value={absender.betriebsnummer}
              onChange={(e) =>
                updateAbsenderField("betriebsnummer", e.target.value)
              }
              data-testid="input-absender-betriebsnummer"
            />
          </label>
          <label>
            <span>Firma</span>
            <input
              type="text"
              value={absender.name}
              onChange={(e) => updateAbsenderField("name", e.target.value)}
              data-testid="input-absender-name"
            />
          </label>
          <label>
            <span>Ansprechpartner</span>
            <input
              type="text"
              value={absender.ansprechpartner}
              onChange={(e) =>
                updateAbsenderField("ansprechpartner", e.target.value)
              }
            />
          </label>
          <label>
            <span>E-Mail</span>
            <input
              type="email"
              value={absender.email}
              onChange={(e) => updateAbsenderField("email", e.target.value)}
            />
          </label>
          <label>
            <span>Straße</span>
            <input
              type="text"
              value={absender.strasse}
              onChange={(e) => updateAbsenderField("strasse", e.target.value)}
            />
          </label>
          <label>
            <span>Hausnummer</span>
            <input
              type="text"
              value={absender.hausnummer}
              onChange={(e) => updateAbsenderField("hausnummer", e.target.value)}
            />
          </label>
          <label>
            <span>PLZ</span>
            <input
              type="text"
              value={absender.plz}
              onChange={(e) => updateAbsenderField("plz", e.target.value)}
            />
          </label>
          <label>
            <span>Ort</span>
            <input
              type="text"
              value={absender.ort}
              onChange={(e) => updateAbsenderField("ort", e.target.value)}
            />
          </label>
        </div>
      </section>

      {/* Jahresmeldungen. */}
      <section style={{ marginBottom: 20 }}>
        <h2>Jahresmeldungen (Abgabegrund 50)</h2>
        <p style={{ color: "var(--muted)", fontSize: "0.85rem" }}>
          Pro Arbeitnehmer eine Jahresmeldung für {selectedYear}
          generieren. Fehlende Pflichtfelder (Staatsangehörigkeit,
          Tätigkeitsschlüssel, BBNR) werden per Dialog abgefragt.
        </p>
        {employeeRows.length === 0 ? (
          <p
            style={{ color: "var(--muted)", fontSize: "0.85rem" }}
            data-testid="sv-no-employees"
          >
            Keine aktiven Arbeitnehmer vorhanden. Bitte zuerst unter
            /lohn/arbeitnehmer anlegen.
          </p>
        ) : (
          <table className="mono">
            <thead>
              <tr>
                <th>SV-Nummer</th>
                <th>Name</th>
                <th>SV-Stammdaten</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {employeeRows.map((e) => {
                const sv = isEmployeeSvDataComplete(e);
                return (
                  <tr key={e.id}>
                    <td>{e.sv_nummer ?? "—"}</td>
                    <td>
                      {e.vorname} {e.nachname}
                    </td>
                    <td>
                      {sv.complete ? (
                        <span data-testid={`sv-row-ok-${e.id}`}>✓</span>
                      ) : (
                        <span
                          data-testid={`sv-row-missing-${e.id}`}
                          style={{ color: "var(--danger, #a33)" }}
                        >
                          {sv.missing.length} fehlen
                        </span>
                      )}
                    </td>
                    <td>
                      <button
                        className="btn btn-outline"
                        onClick={() => handleJahresmeldung(e)}
                        disabled={!sv.complete}
                        data-testid={`btn-jahresmeldung-${e.id}`}
                      >
                        Jahresmeldung {selectedYear}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
        <div style={{ marginTop: 10 }}>
          <span style={{ marginRight: 8 }}>
            Vorbereitet: <strong>{pendingMeldungen.length}</strong>
          </span>
          <button
            className="btn btn-primary"
            onClick={handleDsuvExport}
            disabled={pendingMeldungen.length === 0}
            data-testid="btn-dsuv-export"
          >
            <Download size={16} /> DSuV-XML exportieren
          </button>
        </div>
      </section>

      {/* Beitragsnachweis-CSV. */}
      <section style={{ marginBottom: 20 }}>
        <h2>Beitragsnachweis — CSV (Monat)</h2>
        <p style={{ color: "var(--muted)", fontSize: "0.85rem" }}>
          Convenience-Export für die manuelle Nachbearbeitung im
          Kassenportal. Die CSV enthält im MVP nur Header — Zeilen
          müssen im Kassenportal ergänzt werden, bis die
          Auto-Aggregation aus dem Lohn-Archiv folgt
          (siehe docs/DSUV-SCHEMA-UPDATE-GUIDE.md §7).
        </p>
        <label>
          <span>Monat (1-12)</span>
          <input
            type="number"
            min={1}
            max={12}
            value={nachweisMonat}
            onChange={(e) =>
              setNachweisMonat(Math.max(1, Math.min(12, Number(e.target.value) || 1)))
            }
            data-testid="input-nachweis-monat"
          />
        </label>
        <button
          className="btn btn-outline"
          onClick={handleBeitragsnachweisCsv}
          data-testid="btn-beitragsnachweis-csv"
          style={{ marginLeft: 8 }}
        >
          <Download size={16} /> CSV exportieren
        </button>
      </section>
    </div>
  );
}

export default function SvMeldungenPage() {
  return (
    <MandantRequiredGuard>
      <SvMeldungenInner />
    </MandantRequiredGuard>
  );
}
