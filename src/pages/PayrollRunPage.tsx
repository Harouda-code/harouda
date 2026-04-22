import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  AlertTriangle,
  ArrowLeft,
  Banknote,
  Calculator,
  Download,
  FileCheck2,
  FileText,
  Info,
  Landmark,
  Loader2,
} from "lucide-react";
import { fetchEmployees } from "../api/employees";
import { log as auditLog } from "../api/audit";
import { berechneLohnsteuer, monatsLohnsteuer } from "../utils/lohnsteuer";
import { berechneSv, type SvResult } from "../utils/sozialversicherung";
import { downloadBlob, downloadText } from "../utils/exporters";
import {
  buildPayslipPdf,
  payslipFilename,
  type PayslipContext,
} from "../utils/gehaltsabrechnung";
import {
  buildLohnsteuerbescheinigungPdf,
  lohnsteuerbescheinigungFilename,
} from "../utils/lohnsteuerbescheinigung";
import { buildPain001 } from "../utils/sepa";
import {
  buildLohnsteueranmeldungCsv,
  buildLohnsteueranmeldungXml,
  summarizeLohnsteuer,
} from "../utils/lohnsteueranmeldung";
import {
  postPayrollAsJournal,
  buildArchivAbrechnungFromRow,
} from "../utils/payrollPosting";
import { AbrechnungArchivRepo } from "../lib/db/lohnRepos";
import { getActiveCompanyId } from "../api/db";
import { employeeToArbeitnehmer } from "../lib/db/lohnAdapter";
import { useSettings } from "../contexts/SettingsContext";
import { useMandant } from "../contexts/MandantContext";
import { upsertSubmission } from "../api/elsterSubmissions";
import { usePermissions } from "../hooks/usePermissions";
import type { Employee } from "../types/db";
import "./ReportView.css";
import "./TaxCalc.css";
import "./PayrollRunPage.css";

const euro = new Intl.NumberFormat("de-DE", {
  style: "currency",
  currency: "EUR",
});

const MONTHS = [
  "Januar",
  "Februar",
  "März",
  "April",
  "Mai",
  "Juni",
  "Juli",
  "August",
  "September",
  "Oktober",
  "November",
  "Dezember",
];

type PayrollRow = {
  employee: Employee;
  brutto: number;
  lohnsteuer: number;
  soli: number;
  kirchensteuer: number;
  sv_an: number;
  netto: number;
  ag_gesamt: number;
  bruttoKosten: number;
  sv: SvResult;
  warnings: string[];
};

function computeRow(emp: Employee): PayrollRow {
  const warnings: string[] = [];
  const brutto = emp.bruttogehalt_monat ?? 0;
  if (brutto <= 0) {
    warnings.push("Kein Bruttogehalt gesetzt — Zeile wird leer.");
    const emptySv: SvResult = {
      arbeitnehmer: { kv: 0, pv: 0, rv: 0, av: 0, gesamt: 0 },
      arbeitgeber: {
        kv: 0,
        pv: 0,
        rv: 0,
        av: 0,
        u1: 0,
        u2: 0,
        insolvenzgeld: 0,
        gesamt: 0,
      },
      method: "null",
      bemessung_kvpv: 0,
      bemessung_rvav: 0,
    };
    return {
      employee: emp,
      brutto: 0,
      lohnsteuer: 0,
      soli: 0,
      kirchensteuer: 0,
      sv_an: 0,
      netto: 0,
      ag_gesamt: 0,
      bruttoKosten: 0,
      sv: emptySv,
      warnings,
    };
  }

  // Mini-Job: keine Lohnsteuer (pauschaliert durch AG), AN-SV = 0
  if (emp.beschaeftigungsart === "minijob") {
    const sv = berechneSv({
      brutto_monat: brutto,
      beschaeftigungsart: "minijob",
      privat_versichert: emp.privat_versichert,
      pv_kinderlos: emp.pv_kinderlos,
      pv_kinder: emp.pv_kinder_anzahl,
      zusatzbeitrag_pct: (emp.zusatzbeitrag_pct ?? 1.7) / 100,
    });
    warnings.push(
      "Mini-Job: Lohnsteuer pauschaliert (idR 2 % oder nach LStK) — vom AG zu tragen."
    );
    return {
      employee: emp,
      brutto,
      lohnsteuer: 0,
      soli: 0,
      kirchensteuer: 0,
      sv_an: 0,
      netto: brutto,
      ag_gesamt: sv.arbeitgeber.gesamt,
      bruttoKosten: brutto + sv.arbeitgeber.gesamt,
      sv,
      warnings,
    };
  }

  const sv = berechneSv({
    brutto_monat: brutto,
    beschaeftigungsart: emp.beschaeftigungsart,
    privat_versichert: emp.privat_versichert,
    pv_kinderlos: emp.pv_kinderlos,
    pv_kinder: emp.pv_kinder_anzahl,
    zusatzbeitrag_pct: (emp.zusatzbeitrag_pct ?? 1.7) / 100,
  });
  const tax = monatsLohnsteuer(brutto, {
    steuerklasse: emp.steuerklasse,
    kirchensteuerpflichtig: !!emp.konfession,
    bundesland: emp.bundesland,
    kinderfreibetraege: emp.kinderfreibetraege,
  });
  if (tax.method === "klasse_v_approx") {
    warnings.push(
      "Steuerklasse V: stark vereinfachte Approximation — weicht vom BMF-PAP ab."
    );
  }
  if (emp.beschaeftigungsart === "midijob") {
    warnings.push(
      "Midi-Job: Gleitzone aktiv (Bemessung für AN reduziert). Lohnsteuer-Reduktion nicht mehrstufig."
    );
  }

  const netto =
    brutto - tax.lohnsteuer - tax.soli - tax.kirchensteuer - sv.arbeitnehmer.gesamt;

  return {
    employee: emp,
    brutto,
    lohnsteuer: tax.lohnsteuer,
    soli: tax.soli,
    kirchensteuer: tax.kirchensteuer,
    sv_an: sv.arbeitnehmer.gesamt,
    netto: Math.round(netto * 100) / 100,
    ag_gesamt: sv.arbeitgeber.gesamt,
    bruttoKosten: Math.round((brutto + sv.arbeitgeber.gesamt) * 100) / 100,
    sv,
    warnings,
  };
}

export default function PayrollRunPage() {
  const perms = usePermissions();
  const { settings } = useSettings();
  const { selectedMandantId } = useMandant();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [busy, setBusy] = useState<
    "pdf" | "zip" | "sepa" | "lsta" | "gl" | "ytd" | null
  >(null);

  const employeesQ = useQuery({
    queryKey: ["employees", selectedMandantId],
    queryFn: () => fetchEmployees(selectedMandantId),
  });

  const rows = useMemo(() => {
    const emps = (employeesQ.data ?? []).filter((e) => e.is_active);
    return emps.map(computeRow);
  }, [employeesQ.data]);

  const totals = useMemo(() => {
    const z = {
      brutto: 0,
      lohnsteuer: 0,
      soli: 0,
      kirchensteuer: 0,
      sv_an: 0,
      netto: 0,
      ag_gesamt: 0,
      bruttoKosten: 0,
    };
    for (const r of rows) {
      z.brutto += r.brutto;
      z.lohnsteuer += r.lohnsteuer;
      z.soli += r.soli;
      z.kirchensteuer += r.kirchensteuer;
      z.sv_an += r.sv_an;
      z.netto += r.netto;
      z.ag_gesamt += r.ag_gesamt;
      z.bruttoKosten += r.bruttoKosten;
    }
    return z;
  }, [rows]);

  async function handleYearEndCertificates() {
    if (rows.length === 0) {
      toast.error("Keine Mitarbeiter für Jahresbescheinigungen.");
      return;
    }
    setBusy("ytd");
    try {
      const JSZip = (await import("jszip")).default;
      const zip = new JSZip();
      for (const r of rows) {
        if (r.brutto <= 0) continue;
        const tax = monatsLohnsteuer(r.brutto, {
          steuerklasse: r.employee.steuerklasse,
          kirchensteuerpflichtig: !!r.employee.konfession,
          bundesland: r.employee.bundesland,
          kinderfreibetraege: r.employee.kinderfreibetraege,
        });
        const bytes = await buildLohnsteuerbescheinigungPdf({
          company: {
            name: settings.kanzleiName,
            strasse: settings.kanzleiStrasse,
            plz: settings.kanzleiPlz,
            ort: settings.kanzleiOrt,
            steuernummer: settings.defaultSteuernummer,
          },
          employee: r.employee,
          year,
          sampleMonth: {
            monatsBrutto: r.brutto,
            tax,
            sv: r.sv,
          },
          monthsConsidered: 12,
        });
        zip.file(lohnsteuerbescheinigungFilename(r.employee, year), bytes);
      }
      const blob = await zip.generateAsync({ type: "blob" });
      downloadBlob(blob, `Lohnsteuerbescheinigungen_${year}.zip`);
      await auditLog({
        action: "export",
        entity: "settings",
        entity_id: null,
        summary: `Lohnsteuerbescheinigungen ${year} als ZIP exportiert (${rows.length} Mitarbeiter) — Hochrechnung 12 × Monatswert`,
      });
      toast.success(
        `${rows.length} Jahresbescheinigungen erstellt (Hochrechnung × 12).`
      );
    } catch (err) {
      toast.error(
        `Jahresbescheinigungen fehlgeschlagen: ${(err as Error).message}`
      );
    } finally {
      setBusy(null);
    }
  }

  async function handleDownloadAllPayslipsZip() {
    if (rows.length === 0) {
      toast.error("Keine aktiven Mitarbeiter im Lohnlauf.");
      return;
    }
    setBusy("zip");
    try {
      const JSZip = (await import("jszip")).default;
      const zip = new JSZip();
      for (const r of rows) {
        if (r.brutto <= 0) continue;
        const ctx: PayslipContext = {
          company: {
            name: settings.kanzleiName,
            strasse: settings.kanzleiStrasse,
            plz: settings.kanzleiPlz,
            ort: settings.kanzleiOrt,
            email: settings.kanzleiEmail,
            steuernummer: settings.defaultSteuernummer,
          },
          employee: r.employee,
          period: { year, month },
          brutto: r.brutto,
          tax: {
            lohnsteuer: r.lohnsteuer,
            soli: r.soli,
            kirchensteuer: r.kirchensteuer,
          },
          sv: r.sv,
          netto: r.netto,
          notes: r.warnings.length > 0 ? r.warnings : undefined,
        };
        const bytes = await buildPayslipPdf(ctx);
        zip.file(payslipFilename(r.employee, year, month), bytes);
      }
      const blob = await zip.generateAsync({ type: "blob" });
      downloadBlob(
        blob,
        `Abrechnungen_${year}-${String(month).padStart(2, "0")}.zip`
      );
      await auditLog({
        action: "export",
        entity: "settings",
        entity_id: null,
        summary: `Lohn-PDFs (${MONTHS[month - 1]} ${year}) als ZIP exportiert — ${rows.length} Mitarbeiter`,
      });
      toast.success(`${rows.length} Abrechnungen im ZIP.`);
    } catch (err) {
      toast.error(`ZIP-Export fehlgeschlagen: ${(err as Error).message}`);
    } finally {
      setBusy(null);
    }
  }

  async function handleSepa() {
    if (rows.length === 0) {
      toast.error("Keine Mitarbeiter für SEPA-Überweisung.");
      return;
    }
    if (!settings.kanzleiIban) {
      toast.error(
        "Kein Firmen-IBAN in den Einstellungen — SEPA nicht möglich."
      );
      return;
    }
    // Ausführungstag: 25. des Abrechnungsmonats (üblicher Lohntag).
    const execDate = `${year}-${String(month).padStart(2, "0")}-25`;
    const transfers = rows
      .filter((r) => r.netto > 0 && r.employee.iban)
      .map((r, i) => ({
        index: i + 1,
        empfaenger: r.employee.kontoinhaber ?? `${r.employee.vorname} ${r.employee.nachname}`,
        iban: r.employee.iban!,
        bic: r.employee.bic ?? undefined,
        betrag: r.netto,
        verwendungszweck: `Gehalt ${MONTHS[month - 1]} ${year} — PN ${r.employee.personalnummer}`,
      }));
    if (transfers.length === 0) {
      toast.error(
        "Keine Mitarbeiter mit IBAN und Netto > 0 gefunden."
      );
      return;
    }
    setBusy("sepa");
    try {
      const res = buildPain001({
        debtor: {
          name: settings.kanzleiName,
          iban: settings.kanzleiIban,
          bic: settings.kanzleiBic || undefined,
        },
        requestedExecutionDate: execDate,
        transfers,
      });
      const blob = new Blob([res.xml], {
        type: "application/xml;charset=utf-8",
      });
      downloadBlob(blob, res.filename);
      const fatal = res.issues.filter((i) => i.level === "error");
      if (fatal.length > 0) {
        toast.error(
          `SEPA-Datei mit ${fatal.length} Fehler(n) erzeugt — bitte prüfen.`
        );
      } else if (res.issues.length > 0) {
        toast.warning(`SEPA erzeugt mit ${res.issues.length} Warnung(en).`);
      } else {
        toast.success(
          `SEPA erzeugt: ${res.nbOfTxs} Überweisungen, Summe ${res.ctrlSum} €, Ausführung ${res.executionDate}.`
        );
      }
      await auditLog({
        action: "export",
        entity: "settings",
        entity_id: null,
        summary: `SEPA PAIN.001 erzeugt: ${res.nbOfTxs} Zahlungen, Summe ${res.ctrlSum} €, Ausführung ${res.executionDate}${fatal.length ? ` (${fatal.length} Fehler)` : ""}`,
      });
    } catch (err) {
      toast.error(`SEPA-Export fehlgeschlagen: ${(err as Error).message}`);
    } finally {
      setBusy(null);
    }
  }

  async function handleLsta() {
    if (rows.length === 0) {
      toast.error("Keine Daten für die Lohnsteueranmeldung.");
      return;
    }
    setBusy("lsta");
    try {
      const totals = summarizeLohnsteuer(rows, year, month);
      const csv = buildLohnsteueranmeldungCsv(totals);
      const xml = buildLohnsteueranmeldungXml(totals, {
        steuernummer: settings.defaultSteuernummer,
        kanzleiName: settings.kanzleiName,
      });
      const stamp = `${year}-${String(month).padStart(2, "0")}`;
      downloadText(csv, `lohnsteueranmeldung_${stamp}.csv`, "text/csv;charset=utf-8");
      downloadText(
        xml,
        `lohnsteueranmeldung_${stamp}.xml`,
        "application/xml;charset=utf-8"
      );
      // Im Submissions-Tracker verbuchen (wie UStVA/ELSTER)
      try {
        await upsertSubmission(
          {
            form_type: "lohnstanm",
            year,
            period: month,
            label: `Lohnsteueranmeldung ${MONTHS[month - 1]} ${year}`,
            notes:
              totals.warnings.length > 0 ? totals.warnings.join(" | ") : null,
            initialStatus: "exported",
          },
          selectedMandantId
        );
      } catch {
        /* submission tracker opt. */
      }
      if (totals.warnings.length > 0) {
        toast.warning(
          `Lohnsteueranmeldung exportiert mit ${totals.warnings.length} Hinweis(en).`
        );
      } else {
        toast.success(
          `Lohnsteueranmeldung exportiert — Zahllast ${totals.zahllast.toFixed(2)} €.`
        );
      }
    } catch (err) {
      toast.error(
        `Lohnsteueranmeldung fehlgeschlagen: ${(err as Error).message}`
      );
    } finally {
      setBusy(null);
    }
  }

  async function handleGl() {
    if (!perms.canWrite) {
      toast.error("Keine Schreibrechte für Journal-Buchungen.");
      return;
    }
    if (rows.length === 0) {
      toast.error("Keine Zeilen für GL-Buchungen.");
      return;
    }
    if (
      !confirm(
        `Für ${rows.length} Mitarbeiter werden Entwurfs-Buchungen erstellt.\n\n` +
          `Konten:\n` +
          `• Personalkosten: ${settings.lohnKontoPersonalkosten}\n` +
          `• AG-SV-Aufwand: ${settings.lohnKontoSvAgAufwand}\n` +
          `• Lohnsteuer-Verb.: ${settings.lohnKontoLstVerb}\n` +
          `• SV-Verb.: ${settings.lohnKontoSvVerb}\n` +
          `• Netto-Verb.: ${settings.lohnKontoNettoVerb}\n\n` +
          `Änderbar in den Einstellungen. Fortfahren?`
      )
    ) {
      return;
    }
    setBusy("gl");
    try {
      const datum = `${year}-${String(month).padStart(2, "0")}-${String(
        new Date(year, month, 0).getDate()
      ).padStart(2, "0")}`;
      const res = await postPayrollAsJournal(rows, settings, {
        datum,
        periodLabel: `${MONTHS[month - 1]} ${year}`,
        clientId: selectedMandantId,
      });

      // Sekundärer Archiv-Write pro erfolgreich-Journal-gebuchter Row.
      // Fehler hier sind NICHT katastrophal (Journal = Primärquelle,
      // Archiv = Sekundär-Index) — per-Row fangen, am Ende zählen.
      const archivRepo = new AbrechnungArchivRepo();
      const abrechnungsmonat = `${year}-${String(month).padStart(2, "0")}`;
      const companyId = getActiveCompanyId() ?? "";
      let archiveErrors = 0;
      for (const r of res.processedRows) {
        try {
          await archivRepo.save(companyId, selectedMandantId, {
            arbeitnehmer: employeeToArbeitnehmer(r.employee),
            abrechnungsmonat,
            abrechnung: buildArchivAbrechnungFromRow(r, abrechnungsmonat),
            batchId: res.batchId,
          });
        } catch (err) {
          archiveErrors++;
          // eslint-disable-next-line no-console
          console.warn(
            `Archiv-Write fehlgeschlagen für ${r.employee.personalnummer}:`,
            (err as Error).message
          );
        }
      }

      const totalErrors = res.errors.length + archiveErrors;
      if (totalErrors > 0) {
        toast.warning(
          `${res.entriesCreated} Entwürfe erzeugt · ${res.errors.length} Journal-Fehler · ${archiveErrors} Archiv-Fehler.`
        );
      } else {
        toast.success(
          `${res.entriesCreated} Entwurfs-Buchungen im Journal angelegt, ${res.processedRows.length} Archiv-Einträge gespeichert.`
        );
      }
    } catch (err) {
      toast.error(`GL-Buchung fehlgeschlagen: ${(err as Error).message}`);
    } finally {
      setBusy(null);
    }
  }

  async function handleExportCsv() {
    if (rows.length === 0) {
      toast.error("Keine aktiven Mitarbeiter im Lohnlauf.");
      return;
    }
    const header = [
      "Personalnummer",
      "Nachname",
      "Vorname",
      "Beschäftigungsart",
      "Steuerklasse",
      "Brutto",
      "Lohnsteuer",
      "Soli",
      "Kirchensteuer",
      "SV-AN",
      "Netto",
      "SV-AG",
      "Bruttokosten",
      "Hinweise",
    ];
    const quote = (s: unknown) => {
      const v = s == null ? "" : String(s);
      const esc = v.replace(/"/g, '""');
      return /[",;\n]/.test(v) ? `"${esc}"` : esc;
    };
    const lines = [header.join(";")];
    for (const r of rows) {
      lines.push(
        [
          r.employee.personalnummer,
          r.employee.nachname,
          r.employee.vorname,
          r.employee.beschaeftigungsart,
          r.employee.steuerklasse,
          r.brutto.toFixed(2).replace(".", ","),
          r.lohnsteuer.toFixed(2).replace(".", ","),
          r.soli.toFixed(2).replace(".", ","),
          r.kirchensteuer.toFixed(2).replace(".", ","),
          r.sv_an.toFixed(2).replace(".", ","),
          r.netto.toFixed(2).replace(".", ","),
          r.ag_gesamt.toFixed(2).replace(".", ","),
          r.bruttoKosten.toFixed(2).replace(".", ","),
          r.warnings.join(" | "),
        ]
          .map(quote)
          .join(";")
      );
    }
    const csv = "\ufeff" + lines.join("\n");
    downloadText(
      csv,
      `lohnlauf_${year}-${String(month).padStart(2, "0")}.csv`,
      "text/csv;charset=utf-8"
    );
    await auditLog({
      action: "export",
      entity: "settings",
      entity_id: null,
      summary: `Lohnlauf ${MONTHS[month - 1]} ${year} als CSV exportiert (${rows.length} Mitarbeiter, Netto-Summe ${totals.netto.toFixed(2)} €)`,
    });
    toast.success("Lohnlauf-CSV exportiert.");
  }

  if (!perms.canRead) {
    return (
      <div className="report">
        <header className="report__head">
          <h1>Lohn & Gehalt</h1>
        </header>
        <aside className="taxcalc__hint">
          <AlertTriangle size={14} />
          <span>Kein Zugriff.</span>
        </aside>
      </div>
    );
  }

  return (
    <div className="report payrun">
      <header className="report__head">
        <Link to="/personal/mitarbeiter" className="report__back">
          <ArrowLeft size={16} />
          Zurück zur Mitarbeiterliste
        </Link>
        <div className="report__head-title">
          <h1>
            <Calculator
              size={22}
              style={{ verticalAlign: "-3px", marginRight: 8 }}
            />
            Lohn-Vorschau {MONTHS[month - 1]} {year}
          </h1>
          <p>
            Planungs-Kalkulation aller aktiven Mitarbeiter mit 2025er Sätzen.
            <strong> Keine amtliche Lohnabrechnung</strong> — Werte können
            vom BMF-PAP abweichen.
          </p>
        </div>
        <div className="period">
          <label>
            <span>Jahr</span>
            <input
              type="number"
              min="2000"
              max="2100"
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
            />
          </label>
          <label>
            <span>Monat</span>
            <select value={month} onChange={(e) => setMonth(Number(e.target.value))}>
              {MONTHS.map((m, i) => (
                <option key={m} value={i + 1}>
                  {m}
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            className="btn btn-outline"
            onClick={handleExportCsv}
            disabled={busy !== null}
          >
            <Download size={16} />
            CSV
          </button>
        </div>
      </header>

      <section className="card payrun__actionbar">
        <button
          type="button"
          className="btn btn-primary"
          onClick={handleDownloadAllPayslipsZip}
          disabled={busy !== null || rows.length === 0}
        >
          {busy === "zip" ? (
            <Loader2 size={14} className="login__spinner" />
          ) : (
            <FileText size={14} />
          )}
          Abrechnungen verteilen (ZIP)
        </button>
        <button
          type="button"
          className="btn btn-outline"
          onClick={handleSepa}
          disabled={busy !== null || rows.length === 0}
        >
          {busy === "sepa" ? (
            <Loader2 size={14} className="login__spinner" />
          ) : (
            <Banknote size={14} />
          )}
          SEPA erstellen
        </button>
        <button
          type="button"
          className="btn btn-outline"
          onClick={handleLsta}
          disabled={busy !== null || rows.length === 0}
        >
          {busy === "lsta" ? (
            <Loader2 size={14} className="login__spinner" />
          ) : (
            <Landmark size={14} />
          )}
          Lohnsteueranmeldung
        </button>
        <button
          type="button"
          className="btn btn-outline"
          onClick={handleGl}
          disabled={busy !== null || rows.length === 0 || !perms.canWrite}
          title={
            perms.canWrite
              ? "Entwurfs-Buchungen im Journal anlegen"
              : "Schreibrechte erforderlich"
          }
        >
          {busy === "gl" ? (
            <Loader2 size={14} className="login__spinner" />
          ) : (
            <FileCheck2 size={14} />
          )}
          GL-Buchungen erzeugen
        </button>
        <button
          type="button"
          className="btn btn-outline"
          onClick={handleYearEndCertificates}
          disabled={busy !== null || rows.length === 0}
          title="Lohnsteuerbescheinigungen für das gewählte Jahr als ZIP (Hochrechnung 12 × aktueller Monat)"
        >
          {busy === "ytd" ? (
            <Loader2 size={14} className="login__spinner" />
          ) : (
            <FileText size={14} />
          )}
          Jahresbescheinigungen
        </button>
      </section>

      <aside className="taxcalc__hint">
        <AlertTriangle size={14} />
        <span>
          <strong>Honest-Disclaimer:</strong> Lohnsteuer nach § 32a EStG 2025
          (Grundfreibetrag 12.096 €, vereinfachte Tarifzonen) — NICHT der
          amtliche BMF-Programmablaufplan. SV-Sätze Stand 2025
          (KV 14,6 %, PV 3,4 %, RV 18,6 %, AV 2,6 %, BBG KV/PV 66.150 €,
          BBG RV/AV 96.600 €, Mini-Job 556 €). Vor jeder Meldung an die
          SV-Träger mit einem ITSG-zertifizierten Lohnprogramm gegenprüfen.
        </span>
      </aside>

      {employeesQ.isLoading ? (
        <div className="card payrun__empty">
          <Loader2 size={18} className="login__spinner" />
          <span>Lade Mitarbeiter …</span>
        </div>
      ) : rows.length === 0 ? (
        <div className="card payrun__empty">
          <Info size={18} />
          <span>
            Keine aktiven Mitarbeiter. Zunächst unter{" "}
            <Link to="/personal/mitarbeiter">Mitarbeiter-Stammdaten</Link>{" "}
            anlegen.
          </span>
        </div>
      ) : (
        <>
          <section className="card payrun__totals">
            <div>
              <dt>Mitarbeiter</dt>
              <dd>{rows.length}</dd>
            </div>
            <div>
              <dt>Brutto</dt>
              <dd>{euro.format(totals.brutto)}</dd>
            </div>
            <div>
              <dt>Lohnsteuer + Soli + KiSt</dt>
              <dd>
                {euro.format(
                  totals.lohnsteuer + totals.soli + totals.kirchensteuer
                )}
              </dd>
            </div>
            <div>
              <dt>SV-Arbeitnehmer</dt>
              <dd>{euro.format(totals.sv_an)}</dd>
            </div>
            <div>
              <dt>Netto (ausgezahlt)</dt>
              <dd style={{ color: "var(--success)" }}>
                {euro.format(totals.netto)}
              </dd>
            </div>
            <div>
              <dt>AG-SV-Gesamtbetrag</dt>
              <dd>{euro.format(totals.ag_gesamt)}</dd>
            </div>
            <div>
              <dt>Bruttokosten (AG-Perspektive)</dt>
              <dd style={{ color: "var(--navy)" }}>
                {euro.format(totals.bruttoKosten)}
              </dd>
            </div>
          </section>

          <section className="card payrun__list">
            <table>
              <thead>
                <tr>
                  <th>Mitarbeiter</th>
                  <th>St-Kl.</th>
                  <th className="is-num">Brutto</th>
                  <th className="is-num">LSt</th>
                  <th className="is-num">Soli</th>
                  <th className="is-num">KiSt</th>
                  <th className="is-num">SV-AN</th>
                  <th className="is-num">Netto</th>
                  <th className="is-num">SV-AG</th>
                  <th className="is-num">Bruttokosten</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.employee.id}>
                    <td>
                      <strong>
                        {r.employee.nachname}, {r.employee.vorname}
                      </strong>
                      <span className="payrun__sub">
                        {r.employee.personalnummer}
                        {r.employee.beschaeftigungsart !== "vollzeit" &&
                          ` · ${r.employee.beschaeftigungsart}`}
                      </span>
                      {r.warnings.length > 0 && (
                        <span className="payrun__warn">
                          ⚠ {r.warnings.join(" · ")}
                        </span>
                      )}
                    </td>
                    <td>{r.employee.steuerklasse}</td>
                    <td className="is-num mono">{euro.format(r.brutto)}</td>
                    <td className="is-num mono">{euro.format(r.lohnsteuer)}</td>
                    <td className="is-num mono">{euro.format(r.soli)}</td>
                    <td className="is-num mono">
                      {euro.format(r.kirchensteuer)}
                    </td>
                    <td className="is-num mono">{euro.format(r.sv_an)}</td>
                    <td
                      className="is-num mono"
                      style={{ color: "var(--success)", fontWeight: 700 }}
                    >
                      {euro.format(r.netto)}
                    </td>
                    <td className="is-num mono">{euro.format(r.ag_gesamt)}</td>
                    <td className="is-num mono">
                      {euro.format(r.bruttoKosten)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          <section className="card payrun__notes">
            <h3>Was diese Vorschau NICHT leistet</h3>
            <ul>
              <li>
                Kein amtlicher BMF-Programmablaufplan (PAP) — Lohnsteuer kann
                vom tatsächlichen Wert abweichen.
              </li>
              <li>
                Keine elektronische DEÜV-Meldung und keine
                Lohnsteueranmeldung — das sind ITSG-zertifizierte Prozesse.
              </li>
              <li>
                Keine automatische Erstellung von Gehaltsabrechnungs-PDFs
                (derzeit in dieser Session nicht enthalten).
              </li>
              <li>
                Keine Umbuchung auf GL-Konten — manuell oder über einen
                nachgelagerten Buchungsworkflow.
              </li>
              <li>
                Steuerklasse V nutzt eine sehr grobe Näherung; für diese
                Fälle unbedingt das Original-Lohnprogramm verwenden.
              </li>
            </ul>
          </section>
        </>
      )}
    </div>
  );
}
