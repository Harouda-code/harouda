import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  AlertTriangle,
  ArrowLeft,
  Building2,
  Download,
  FileSpreadsheet,
  Info,
  Loader2,
} from "lucide-react";
import { fetchAnlagegueter } from "../api/anlagen";
import { getAnlagenspiegelData } from "../domain/anlagen/AnlagenService";
import { AnlagenspiegelPdfGenerator } from "../lib/pdf/AnlagenspiegelPdfGenerator";
import { exportAnlagenspiegelExcel } from "../lib/excel/AnlagenspiegelExcelExporter";
import { useMandant } from "../contexts/MandantContext";
import { useSettings } from "../contexts/SettingsContext";
import { useYear } from "../contexts/YearContext";
import { usePermissions } from "../hooks/usePermissions";
import "./ReportView.css";
import "./TaxCalc.css";
import "./CostCentersPage.css";

const euro = new Intl.NumberFormat("de-DE", {
  style: "currency",
  currency: "EUR",
});

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export default function AnlagenspiegelPage() {
  const perms = usePermissions();
  const { selectedYear } = useYear();
  const { settings } = useSettings();
  const { selectedMandantId } = useMandant();
  const [jahr, setJahr] = useState<number>(selectedYear);
  const [pdfBusy, setPdfBusy] = useState(false);
  const [xlsBusy, setXlsBusy] = useState(false);

  const anlagenQ = useQuery({
    queryKey: ["anlagegueter", selectedMandantId],
    queryFn: () => fetchAnlagegueter(selectedMandantId),
  });

  const data = useMemo(() => {
    if (!anlagenQ.data) return null;
    return getAnlagenspiegelData(jahr, anlagenQ.data);
  }, [anlagenQ.data, jahr]);

  const mandantAddress = [
    settings.kanzleiStrasse,
    `${settings.kanzleiPlz ?? ""} ${settings.kanzleiOrt ?? ""}`.trim(),
  ]
    .filter(Boolean)
    .join(", ");

  function handlePdf() {
    if (!data) return;
    setPdfBusy(true);
    try {
      const gen = new AnlagenspiegelPdfGenerator();
      const blob = gen.generate(data, {
        title: "Anlagenspiegel",
        mandantName: settings.kanzleiName || "Mandant",
        mandantAddress,
        stichtag: `31.12.${jahr}`,
      });
      downloadBlob(blob, `anlagenspiegel_${jahr}.pdf`);
      toast.success("Anlagenspiegel-PDF erzeugt.");
    } catch (err) {
      toast.error(`PDF-Export fehlgeschlagen: ${(err as Error).message}`);
    } finally {
      setPdfBusy(false);
    }
  }

  async function handleExcel() {
    if (!data) return;
    setXlsBusy(true);
    try {
      const blob = await exportAnlagenspiegelExcel(data, {
        mandantName: settings.kanzleiName || "Mandant",
      });
      downloadBlob(blob, `anlagenspiegel_${jahr}.xlsx`);
      toast.success("Anlagenspiegel-Excel erzeugt.");
    } catch (err) {
      toast.error(`Excel-Export fehlgeschlagen: ${(err as Error).message}`);
    } finally {
      setXlsBusy(false);
    }
  }

  if (!perms.canRead) {
    return (
      <div className="report">
        <header className="report__head">
          <h1>Anlagenspiegel</h1>
        </header>
        <aside className="taxcalc__hint">
          <AlertTriangle size={14} />
          <span>Kein Zugriff.</span>
        </aside>
      </div>
    );
  }

  return (
    <div className="report kst">
      <header className="report__head">
        <Link to="/berichte" className="report__back">
          <ArrowLeft size={16} />
          Zurück zu Berichten
        </Link>
        <div className="report__head-title">
          <h1>
            <Building2
              size={22}
              style={{ verticalAlign: "-3px", marginRight: 8 }}
            />
            Anlagenspiegel {jahr}
          </h1>
          <p>
            Nachgebildet nach § 284 HGB: Entwicklung des Anlagevermögens pro
            Bestandskonto. Nutzt die linearen AfA-Werte aus dem
            Anlagenverzeichnis.
          </p>
        </div>
        <div className="period">
          <label>
            Jahr:{" "}
            <input
              type="number"
              min={2000}
              max={2100}
              value={jahr}
              onChange={(e) => setJahr(Number(e.target.value))}
              style={{ width: 80 }}
            />
          </label>
          <button
            type="button"
            className="btn btn-outline"
            onClick={handlePdf}
            disabled={!data || pdfBusy}
          >
            {pdfBusy ? (
              <Loader2 size={16} className="login__spinner" />
            ) : (
              <Download size={16} />
            )}{" "}
            PDF
          </button>
          <button
            type="button"
            className="btn btn-outline"
            onClick={handleExcel}
            disabled={!data || xlsBusy}
          >
            {xlsBusy ? (
              <Loader2 size={16} className="login__spinner" />
            ) : (
              <FileSpreadsheet size={16} />
            )}{" "}
            Excel
          </button>
        </div>
      </header>

      <aside className="taxcalc__hint">
        <Info size={14} />
        <span>
          Invariante: <strong>Buchwert 31.12. = AK 31.12. − Abschreibungen
          kumuliert</strong>. Wird pro Gruppe vom Service gewährleistet
          (`getAnlagenspiegelData`).
        </span>
      </aside>

      {anlagenQ.isLoading ? (
        <p className="kst__empty">Lade Anlagen …</p>
      ) : !data || data.gruppen.length === 0 ? (
        <section className="card kst__list">
          <p className="kst__empty">
            Keine Anlagen für {jahr} im Bestand. Anlagen können unter{" "}
            <Link to="/anlagen/verzeichnis">Anlagenverzeichnis</Link>{" "}
            erfasst werden.
          </p>
        </section>
      ) : (
        <section className="card kst__list">
          <table>
            <thead>
              <tr>
                <th>Konto</th>
                <th style={{ textAlign: "right" }}>Anz.</th>
                <th style={{ textAlign: "right" }}>AK 01.01.</th>
                <th style={{ textAlign: "right" }}>Zugänge</th>
                <th style={{ textAlign: "right" }}>Abgänge</th>
                <th style={{ textAlign: "right" }}>AK 31.12.</th>
                <th style={{ textAlign: "right" }}>Abschr. kum.</th>
                <th style={{ textAlign: "right" }}>BW 01.01.</th>
                <th style={{ textAlign: "right" }}>BW 31.12.</th>
              </tr>
            </thead>
            <tbody>
              {data.gruppen.map((g) => (
                <tr key={g.konto_anlage}>
                  <td className="mono">{g.konto_anlage}</td>
                  <td className="mono" style={{ textAlign: "right" }}>
                    {g.anzahl}
                  </td>
                  <td className="mono" style={{ textAlign: "right" }}>
                    {euro.format(g.ak_start)}
                  </td>
                  <td className="mono" style={{ textAlign: "right" }}>
                    {euro.format(g.zugaenge)}
                  </td>
                  <td className="mono" style={{ textAlign: "right" }}>
                    {euro.format(g.abgaenge)}
                  </td>
                  <td className="mono" style={{ textAlign: "right" }}>
                    {euro.format(g.ak_ende)}
                  </td>
                  <td className="mono" style={{ textAlign: "right" }}>
                    {euro.format(g.abschreibungen_kumuliert)}
                  </td>
                  <td className="mono" style={{ textAlign: "right" }}>
                    {euro.format(g.buchwert_start)}
                  </td>
                  <td className="mono" style={{ textAlign: "right" }}>
                    {euro.format(g.buchwert_ende)}
                  </td>
                </tr>
              ))}
              <tr
                style={{
                  fontWeight: 700,
                  borderTop: "2px solid var(--border)",
                }}
              >
                <td className="mono">TOTAL</td>
                <td className="mono" style={{ textAlign: "right" }}>
                  {data.totals.anzahl}
                </td>
                <td className="mono" style={{ textAlign: "right" }}>
                  {euro.format(data.totals.ak_start)}
                </td>
                <td className="mono" style={{ textAlign: "right" }}>
                  {euro.format(data.totals.zugaenge)}
                </td>
                <td className="mono" style={{ textAlign: "right" }}>
                  {euro.format(data.totals.abgaenge)}
                </td>
                <td className="mono" style={{ textAlign: "right" }}>
                  {euro.format(data.totals.ak_ende)}
                </td>
                <td className="mono" style={{ textAlign: "right" }}>
                  {euro.format(data.totals.abschreibungen_kumuliert)}
                </td>
                <td className="mono" style={{ textAlign: "right" }}>
                  {euro.format(data.totals.buchwert_start)}
                </td>
                <td className="mono" style={{ textAlign: "right" }}>
                  {euro.format(data.totals.buchwert_ende)}
                </td>
              </tr>
            </tbody>
          </table>
        </section>
      )}
    </div>
  );
}
