import { useRef, useState, type ChangeEvent } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  BadgeCheck,
  Check,
  FileInput,
  FilePlus2,
  Landmark,
  Loader2,
} from "lucide-react";
import { fetchAccounts } from "../api/accounts";
import { createEntry } from "../api/journal";
import { archiveInvoice, DuplicateInvoiceError } from "../api/invoiceArchive";
import { extractInvoiceXml, readZugferd, type ZugferdInvoice } from "../utils/zugferd";
import { useMandant } from "../contexts/MandantContext";
import "./ZugferdPage.css";

const euro = new Intl.NumberFormat("de-DE", {
  style: "currency",
  currency: "EUR",
});

export default function ZugferdPage() {
  const qc = useQueryClient();
  const { selectedMandantId } = useMandant();
  const fileRef = useRef<HTMLInputElement>(null);
  const [invoice, setInvoice] = useState<ZugferdInvoice | null>(null);
  const [archiveId, setArchiveId] = useState<string | null>(null);
  const [parsing, setParsing] = useState(false);

  const [draft, setDraft] = useState({
    soll: "4930",
    haben: "1600",
  });

  const accountsQ = useQuery({
    queryKey: ["accounts", "all-with-inactive"],
    queryFn: fetchAccounts,
  });
  const accountOptions = (accountsQ.data ?? [])
    .filter((a) => a.is_active)
    .sort((a, b) => a.konto_nr.localeCompare(b.konto_nr));

  async function handleFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setParsing(true);
    setArchiveId(null);
    try {
      const parsed = await readZugferd(file);
      setInvoice(parsed);
      toast.success(
        `Rechnung ${parsed.invoiceNumber} gelesen (${parsed.profile}).`
      );

      // Direkt ins Archiv legen — unabhängig davon, ob später gebucht wird.
      try {
        const xml = parsed.rawXml || (await extractInvoiceXml(file));
        const res = await archiveInvoice(
          {
            file,
            xml,
            parsed,
            source: "zugferd-import",
          },
          selectedMandantId
        );
        setArchiveId(res.archive.id);
        toast.info(
          `Archiviert (SHA-256 ${res.archive.content_sha256.slice(0, 10)}…, Retention bis ${res.archive.retention_until}).`
        );
      } catch (archErr) {
        if (archErr instanceof DuplicateInvoiceError) {
          // Duplikat: Nutzer:in fragen, ob trotzdem erneut archivieren.
          const existing = archErr.existing;
          const proceed = confirm(
            `Diese Rechnung wurde bereits archiviert:\n\n` +
              `"${existing.original_filename}" am ${new Date(
                existing.uploaded_at
              ).toLocaleDateString("de-DE")}\n` +
              `SHA-256: ${existing.content_sha256.slice(0, 20)}…\n\n` +
              `Erneut archivieren? (Nicht empfohlen — nur wenn bewusst.)`
          );
          if (proceed) {
            try {
              const xml = parsed.rawXml || (await extractInvoiceXml(file));
              const res2 = await archiveInvoice(
                {
                  file,
                  xml,
                  parsed,
                  source: "zugferd-import",
                  allowDuplicate: true,
                },
                selectedMandantId
              );
              setArchiveId(res2.archive.id);
              toast.warning(
                `Duplikat archiviert (SHA-256 ${res2.archive.content_sha256.slice(0, 10)}…).`
              );
            } catch (retryErr) {
              toast.error(
                `Archivierung fehlgeschlagen: ${(retryErr as Error).message}`
              );
            }
          } else {
            setArchiveId(existing.id);
            toast.info("Bestehende Archiv-Zeile wird genutzt.");
          }
        } else {
          console.warn("Archivierung fehlgeschlagen:", archErr);
          toast.warning(
            `Archivierung fehlgeschlagen: ${(archErr as Error).message}`
          );
        }
      }
    } catch (err) {
      toast.error(`Import fehlgeschlagen: ${(err as Error).message}`);
    } finally {
      setParsing(false);
    }
  }

  const postM = useMutation({
    mutationFn: async () => {
      if (!invoice) throw new Error("Keine Rechnung geladen.");
      const ust = invoice.lines[0]?.taxPct ?? null;
      await createEntry({
        datum: invoice.issueDate || new Date().toISOString().slice(0, 10),
        beleg_nr: invoice.invoiceNumber || `ZUG-${Date.now()}`,
        beschreibung:
          `${invoice.seller.name || "Lieferant"} — ${invoice.lines[0]?.description ?? "Rechnung"}`.slice(0, 140),
        soll_konto: draft.soll,
        haben_konto: draft.haben,
        betrag: invoice.grandTotal || invoice.netTotal + invoice.taxTotal,
        ust_satz: ust,
        status: "gebucht",
        client_id: selectedMandantId,
        skonto_pct: null,
        skonto_tage: null,
        gegenseite: invoice.seller.name || null,
        faelligkeit: invoice.dueDate,
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["journal_entries"] });
      toast.success("Buchung aus ZUGFeRD angelegt.");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  return (
    <div className="zugferd">
      <header className="zugferd__head">
        <div>
          <h1>
            <BadgeCheck
              size={22}
              style={{ verticalAlign: "-3px", marginRight: 8 }}
            />
            ZUGFeRD / Factur-X / XRechnung
          </h1>
          <p>
            E-Rechnung einlesen: PDF/A-3 mit eingebetteter Factur-X-XML,
            ZUGFeRD-Anhang oder reine XRechnung-XML-Datei. Seit 2025 für B2B
            in Deutschland Pflicht (§ 14 UStG).
          </p>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <input
            ref={fileRef}
            type="file"
            accept=".pdf,.xml"
            onChange={handleFile}
            style={{ display: "none" }}
          />
          <Link to="/e-rechnung/erstellen" className="btn btn-outline">
            <FilePlus2 size={16} />
            XRechnung erstellen
          </Link>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => fileRef.current?.click()}
            disabled={parsing}
          >
            {parsing ? (
              <>
                <Loader2 size={16} className="login__spinner" />
                Lese …
              </>
            ) : (
              <>
                <FileInput size={16} />
                Datei wählen
              </>
            )}
          </button>
        </div>
      </header>

      {!invoice && (
        <div className="card zugferd__empty">
          <div className="docs__empty-icon">
            <Landmark size={28} strokeWidth={1.5} />
          </div>
          <h2>Noch keine Rechnung geladen</h2>
          <p>
            Laden Sie eine ZUGFeRD/Factur-X-PDF oder eine XRechnung-XML-Datei
            hoch. Die eingebettete CII/UBL-XML wird extrahiert und in eine
            Buchungsvorlage umgewandelt.
          </p>
        </div>
      )}

      {invoice && (
        <>
          {archiveId && (
            <div
              className="card zugferd__section"
              style={{
                borderLeft: "4px solid var(--success)",
                background: "rgba(5, 150, 105, 0.06)",
              }}
            >
              <strong>Ins Archiv übernommen.</strong>{" "}
              <span>
                Retention 10 Jahre · SHA-256-Prüfsumme gespeichert ·{" "}
                <Link to="/e-rechnung/archiv" style={{ color: "var(--navy)" }}>
                  Im Archiv ansehen →
                </Link>
              </span>
            </div>
          )}
          <section className="card zugferd__section">
            <h2>Kopfdaten</h2>
            <dl className="zugferd__kv">
              <div>
                <dt>Rechnungsnummer</dt>
                <dd className="mono">{invoice.invoiceNumber}</dd>
              </div>
              <div>
                <dt>Rechnungsdatum</dt>
                <dd className="mono">
                  {invoice.issueDate
                    ? new Date(invoice.issueDate).toLocaleDateString("de-DE")
                    : "—"}
                </dd>
              </div>
              <div>
                <dt>Fälligkeit</dt>
                <dd className="mono">
                  {invoice.dueDate
                    ? new Date(invoice.dueDate).toLocaleDateString("de-DE")
                    : "—"}
                </dd>
              </div>
              <div>
                <dt>Profil</dt>
                <dd>{invoice.profile}</dd>
              </div>
              <div>
                <dt>Währung</dt>
                <dd>{invoice.currency}</dd>
              </div>
            </dl>
          </section>

          <section className="card zugferd__section">
            <div className="zugferd__parties">
              <div>
                <h3>Lieferant (Seller)</h3>
                <p>
                  <strong>{invoice.seller.name}</strong>
                  {invoice.seller.vatId && (
                    <span className="mono">
                      {" "}
                      · USt-IdNr. {invoice.seller.vatId}
                    </span>
                  )}
                </p>
                {invoice.seller.address && (
                  <p className="zugferd__addr">{invoice.seller.address}</p>
                )}
              </div>
              <div>
                <h3>Kunde (Buyer)</h3>
                <p>
                  <strong>{invoice.buyer.name}</strong>
                  {invoice.buyer.vatId && (
                    <span className="mono">
                      {" "}
                      · USt-IdNr. {invoice.buyer.vatId}
                    </span>
                  )}
                </p>
                {invoice.buyer.address && (
                  <p className="zugferd__addr">{invoice.buyer.address}</p>
                )}
              </div>
            </div>
          </section>

          <section className="card zugferd__section">
            <h2>Positionen</h2>
            <table className="zugferd__lines">
              <thead>
                <tr>
                  <th>Beschreibung</th>
                  <th className="is-num">Menge</th>
                  <th className="is-num">Einzelpreis</th>
                  <th className="is-num">USt</th>
                  <th className="is-num">Nettobetrag</th>
                </tr>
              </thead>
              <tbody>
                {invoice.lines.map((l, i) => {
                  const ustCompliant =
                    l.taxPct == null || [0, 7, 19].includes(l.taxPct);
                  return (
                    <tr key={i}>
                      <td>{l.description}</td>
                      <td className="is-num mono">
                        {l.quantity} {l.unit ?? ""}
                      </td>
                      <td className="is-num mono">
                        {euro.format(l.unitPrice)}
                      </td>
                      <td className="is-num mono">
                        {l.taxPct != null ? (
                          <span
                            style={{
                              color: ustCompliant
                                ? "var(--ink)"
                                : "var(--danger)",
                              fontWeight: ustCompliant ? 400 : 700,
                            }}
                            title={
                              ustCompliant
                                ? "Deutscher USt-Satz (0/7/19 %)"
                                : "Nicht-deutscher USt-Satz — bitte prüfen"
                            }
                          >
                            {l.taxPct} %
                            {!ustCompliant && " ⚠"}
                          </span>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="is-num mono">
                        {euro.format(l.netAmount)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={4}>
                    <strong>Netto</strong>
                  </td>
                  <td className="is-num mono">
                    {euro.format(invoice.netTotal)}
                  </td>
                </tr>
                <tr>
                  <td colSpan={4}>
                    <strong>USt</strong>
                  </td>
                  <td className="is-num mono">
                    {euro.format(invoice.taxTotal)}
                  </td>
                </tr>
                <tr className="zugferd__total">
                  <td colSpan={4}>
                    <strong>Gesamtbetrag</strong>
                  </td>
                  <td className="is-num mono">
                    {euro.format(invoice.grandTotal)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </section>

          <section className="card zugferd__section">
            <h2>Als Buchung anlegen</h2>
            <div className="form-grid">
              <label className="form-field">
                <span>Soll-Konto</span>
                <select
                  value={draft.soll}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, soll: e.target.value }))
                  }
                >
                  {accountOptions.map((a) => (
                    <option key={a.konto_nr} value={a.konto_nr}>
                      {a.konto_nr} {a.bezeichnung}
                    </option>
                  ))}
                </select>
              </label>
              <label className="form-field">
                <span>Haben-Konto</span>
                <select
                  value={draft.haben}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, haben: e.target.value }))
                  }
                >
                  {accountOptions.map((a) => (
                    <option key={a.konto_nr} value={a.konto_nr}>
                      {a.konto_nr} {a.bezeichnung}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => postM.mutate()}
              disabled={postM.isPending}
            >
              {postM.isPending ? (
                <>
                  <Loader2 size={16} className="login__spinner" />
                  Buche …
                </>
              ) : (
                <>
                  <Check size={16} />
                  Buchung anlegen ({euro.format(invoice.grandTotal)})
                </>
              )}
            </button>
          </section>
        </>
      )}
    </div>
  );
}
