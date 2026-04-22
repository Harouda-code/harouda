import { useMemo, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import {
  AlertTriangle,
  ArrowLeft,
  Download,
  FileCode2,
  Info,
  Plus,
  Trash2,
} from "lucide-react";
import { useSettings } from "../contexts/SettingsContext";
import { usePermissions } from "../hooks/usePermissions";
import {
  buildXInvoiceXml,
  summarize,
  type XInvoice,
  type XInvoiceLine,
  type XInvoiceParty,
} from "../utils/xrechnungWriter";
import { downloadText } from "../utils/exporters";
import ReadonlyBanner from "../components/ReadonlyBanner";
import "./ReportView.css";
import "./TaxCalc.css";
import "./XRechnungErstellenPage.css";

const euro = new Intl.NumberFormat("de-DE", {
  style: "currency",
  currency: "EUR",
});

type LineDraft = {
  id: string;
  nr: string;
  beschreibung: string;
  menge: string;
  einheit: string;
  einzelpreis_netto: string;
  ust_satz: string;
  ust_kategorie: "S" | "Z" | "E";
};

function emptyLine(nr: number): LineDraft {
  return {
    id: `${Date.now()}-${nr}-${Math.random().toString(36).slice(2, 8)}`,
    nr: String(nr),
    beschreibung: "",
    menge: "1",
    einheit: "H87",
    einzelpreis_netto: "0",
    ust_satz: "19",
    ust_kategorie: "S",
  };
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function plusDaysIso(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function parseLine(raw: LineDraft): XInvoiceLine {
  return {
    nr: raw.nr,
    beschreibung: raw.beschreibung,
    menge: Number(raw.menge.replace(",", ".")) || 0,
    einheit: raw.einheit || "H87",
    einzelpreis_netto: Number(raw.einzelpreis_netto.replace(",", ".")) || 0,
    ust_satz: Number(raw.ust_satz.replace(",", ".")) || 0,
    ust_kategorie: raw.ust_kategorie,
  };
}

export default function XRechnungErstellenPage() {
  const { settings } = useSettings();
  const perms = usePermissions();

  const [seller, setSeller] = useState<XInvoiceParty>(() => ({
    name: settings.kanzleiName || "",
    anschrift_strasse: settings.kanzleiStrasse || "",
    anschrift_plz: settings.kanzleiPlz || "",
    anschrift_ort: settings.kanzleiOrt || "",
    anschrift_land: "DE",
    steuernummer: settings.defaultSteuernummer || "",
    ust_id: "",
    email: settings.kanzleiEmail || "",
    telefon: settings.kanzleiTelefon || "",
  }));

  const [buyer, setBuyer] = useState<XInvoiceParty>({
    name: "",
    anschrift_strasse: "",
    anschrift_plz: "",
    anschrift_ort: "",
    anschrift_land: "DE",
    ust_id: "",
    steuernummer: "",
    email: "",
    telefon: "",
  });

  const [meta, setMeta] = useState({
    rechnungsnummer: "",
    rechnungsdatum: todayIso(),
    leistungsdatum: "",
    faelligkeitsdatum: plusDaysIso(14),
    waehrung: "EUR",
    kaeufer_referenz: "",
  });

  const [payment, setPayment] = useState({
    iban: settings.kanzleiIban || "",
    bic: settings.kanzleiBic || "",
    kontoinhaber: settings.kanzleiName || "",
    zahlungsbedingungen: "",
  });

  const [lines, setLines] = useState<LineDraft[]>([emptyLine(1)]);

  const parsedLines = useMemo(() => lines.map(parseLine), [lines]);

  const summary = useMemo(() => {
    const inv: XInvoice = {
      rechnungsnummer: meta.rechnungsnummer || "DRAFT",
      rechnungsdatum: meta.rechnungsdatum,
      faelligkeitsdatum: meta.faelligkeitsdatum,
      waehrung: meta.waehrung,
      verkaeufer: seller,
      kaeufer: buyer,
      kaeufer_referenz: meta.kaeufer_referenz || "NA",
      positionen: parsedLines,
    };
    return summarize(inv);
  }, [meta, seller, buyer, parsedLines]);

  function updateLine(id: string, patch: Partial<LineDraft>) {
    setLines((prev) =>
      prev.map((l) => (l.id === id ? { ...l, ...patch } : l))
    );
  }

  function addLine() {
    setLines((prev) => [...prev, emptyLine(prev.length + 1)]);
  }

  function removeLine(id: string) {
    setLines((prev) => {
      const next = prev.filter((l) => l.id !== id);
      return next.length > 0 ? next : [emptyLine(1)];
    });
  }

  function validate(): string | null {
    if (!meta.rechnungsnummer.trim()) return "Rechnungsnummer fehlt.";
    if (!meta.rechnungsdatum) return "Rechnungsdatum fehlt.";
    if (!meta.faelligkeitsdatum) return "Fälligkeitsdatum fehlt.";
    if (!meta.kaeufer_referenz.trim())
      return "Leitweg-ID bzw. Käufer-Referenz ist Pflichtfeld in XRechnung.";
    if (!seller.name.trim()) return "Verkäufer: Name fehlt.";
    if (!buyer.name.trim()) return "Käufer: Name fehlt.";
    if (!buyer.anschrift_ort?.trim()) return "Käufer: Ort fehlt.";
    if (parsedLines.length === 0) return "Mindestens eine Position nötig.";
    for (const l of parsedLines) {
      if (!l.beschreibung.trim())
        return `Position ${l.nr}: Beschreibung fehlt.`;
      if (l.menge <= 0) return `Position ${l.nr}: Menge muss > 0 sein.`;
    }
    if (!seller.ust_id && !seller.steuernummer)
      return "Verkäufer: USt-IdNr. oder Steuernummer angeben.";
    return null;
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!perms.canWrite) {
      toast.error("Keine Schreibrechte.");
      return;
    }
    const err = validate();
    if (err) {
      toast.error(err);
      return;
    }
    const inv: XInvoice = {
      rechnungsnummer: meta.rechnungsnummer.trim(),
      rechnungsdatum: meta.rechnungsdatum,
      leistungsdatum: meta.leistungsdatum || undefined,
      faelligkeitsdatum: meta.faelligkeitsdatum,
      waehrung: meta.waehrung,
      verkaeufer: seller,
      kaeufer: buyer,
      kaeufer_referenz: meta.kaeufer_referenz.trim(),
      positionen: parsedLines,
      iban: payment.iban || undefined,
      bic: payment.bic || undefined,
      kontoinhaber: payment.kontoinhaber || undefined,
      zahlungsbedingungen: payment.zahlungsbedingungen || undefined,
    };
    try {
      const xml = buildXInvoiceXml(inv);
      const filename = `xrechnung_${inv.rechnungsnummer.replace(/[^\w.-]+/g, "_")}.xml`;
      downloadText(xml, filename, "application/xml;charset=utf-8");
      toast.success(`XRechnung erzeugt: ${filename}`);
    } catch (err) {
      toast.error(`Erzeugen fehlgeschlagen: ${(err as Error).message}`);
    }
  }

  const canWrite = perms.canWrite;

  return (
    <form className="report xrechnung-new" onSubmit={handleSubmit}>
      <header className="report__head">
        <Link to="/zugferd" className="report__back">
          <ArrowLeft size={16} />
          Zurück zu E-Rechnung (Import)
        </Link>
        <div className="report__head-title">
          <h1>XRechnung erstellen</h1>
          <p>
            Ausgehende elektronische Rechnung im CII-Profil
            (XRechnung&nbsp;3.0). Pflicht für Rechnungen an öffentliche
            Auftraggeber; ab 2025 auch zwischen Unternehmen im Inland möglich.
          </p>
        </div>
        <div className="period">
          <button
            type="submit"
            className="btn btn-primary"
            disabled={!canWrite}
          >
            <Download size={16} />
            XML erzeugen &amp; herunterladen
          </button>
        </div>
      </header>

      <ReadonlyBanner />

      <aside className="taxcalc__hint">
        <Info size={14} />
        <span>
          Die Datei wird lokal erzeugt und heruntergeladen — nichts wird
          versendet. Für die rechtssichere Abgabe empfehlen wir eine
          XSD-Validierung gegen das offizielle KoSIT-Schema (wird hier
          nicht automatisch durchgeführt).
        </span>
      </aside>

      <section className="card xrechnung-new__section">
        <h2>
          <FileCode2 size={16} /> Rechnungsdaten
        </h2>
        <div className="form-grid">
          <label className="form-field">
            <span>Rechnungsnummer *</span>
            <input
              value={meta.rechnungsnummer}
              onChange={(e) =>
                setMeta({ ...meta, rechnungsnummer: e.target.value })
              }
              placeholder="R-2026-0001"
            />
          </label>
          <label className="form-field">
            <span>Rechnungsdatum *</span>
            <input
              type="date"
              value={meta.rechnungsdatum}
              onChange={(e) =>
                setMeta({ ...meta, rechnungsdatum: e.target.value })
              }
            />
          </label>
          <label className="form-field">
            <span>Leistungsdatum</span>
            <input
              type="date"
              value={meta.leistungsdatum}
              onChange={(e) =>
                setMeta({ ...meta, leistungsdatum: e.target.value })
              }
            />
          </label>
          <label className="form-field">
            <span>Fälligkeitsdatum *</span>
            <input
              type="date"
              value={meta.faelligkeitsdatum}
              onChange={(e) =>
                setMeta({ ...meta, faelligkeitsdatum: e.target.value })
              }
            />
          </label>
          <label className="form-field">
            <span>Währung</span>
            <input
              value={meta.waehrung}
              onChange={(e) =>
                setMeta({
                  ...meta,
                  waehrung: e.target.value.toUpperCase().slice(0, 3),
                })
              }
              maxLength={3}
            />
          </label>
          <label className="form-field form-field--wide">
            <span>Leitweg-ID / Käufer-Referenz *</span>
            <input
              value={meta.kaeufer_referenz}
              onChange={(e) =>
                setMeta({ ...meta, kaeufer_referenz: e.target.value })
              }
              placeholder="z. B. 04011000-1234512345-06 oder Bestell-Nr."
            />
          </label>
        </div>
      </section>

      <div className="xrechnung-new__parties">
        <section className="card xrechnung-new__section">
          <h2>Verkäufer (Absender)</h2>
          <PartyFields party={seller} onChange={setSeller} />
        </section>
        <section className="card xrechnung-new__section">
          <h2>Käufer (Empfänger)</h2>
          <PartyFields party={buyer} onChange={setBuyer} />
        </section>
      </div>

      <section className="card xrechnung-new__section">
        <div className="xrechnung-new__lines-head">
          <h2>Positionen</h2>
          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={addLine}
            disabled={!canWrite}
          >
            <Plus size={14} /> Position hinzufügen
          </button>
        </div>

        <table className="xrechnung-new__lines">
          <thead>
            <tr>
              <th style={{ width: "54px" }}>Nr.</th>
              <th>Beschreibung</th>
              <th style={{ width: "90px" }} className="is-num">
                Menge
              </th>
              <th style={{ width: "80px" }}>Einheit</th>
              <th style={{ width: "130px" }} className="is-num">
                Einzelpreis
              </th>
              <th style={{ width: "80px" }} className="is-num">
                USt %
              </th>
              <th style={{ width: "110px" }}>Kategorie</th>
              <th style={{ width: "120px" }} className="is-num">
                Netto
              </th>
              <th style={{ width: "40px" }} />
            </tr>
          </thead>
          <tbody>
            {lines.map((l, idx) => {
              const menge = Number(l.menge.replace(",", ".")) || 0;
              const preis = Number(l.einzelpreis_netto.replace(",", ".")) || 0;
              return (
                <tr key={l.id}>
                  <td>
                    <input
                      className="xrechnung-new__cell"
                      value={l.nr}
                      onChange={(e) =>
                        updateLine(l.id, { nr: e.target.value })
                      }
                    />
                  </td>
                  <td>
                    <input
                      className="xrechnung-new__cell"
                      value={l.beschreibung}
                      onChange={(e) =>
                        updateLine(l.id, { beschreibung: e.target.value })
                      }
                      placeholder="Leistung bzw. Artikel"
                    />
                  </td>
                  <td className="is-num">
                    <input
                      className="xrechnung-new__cell is-num"
                      value={l.menge}
                      onChange={(e) =>
                        updateLine(l.id, { menge: e.target.value })
                      }
                      inputMode="decimal"
                    />
                  </td>
                  <td>
                    <input
                      className="xrechnung-new__cell"
                      value={l.einheit}
                      onChange={(e) =>
                        updateLine(l.id, { einheit: e.target.value })
                      }
                      title="UN/ECE Rec. 20 Code, z. B. H87=Stück, KGM=kg, HUR=Stunde"
                    />
                  </td>
                  <td className="is-num">
                    <input
                      className="xrechnung-new__cell is-num"
                      value={l.einzelpreis_netto}
                      onChange={(e) =>
                        updateLine(l.id, {
                          einzelpreis_netto: e.target.value,
                        })
                      }
                      inputMode="decimal"
                    />
                  </td>
                  <td className="is-num">
                    <input
                      className="xrechnung-new__cell is-num"
                      value={l.ust_satz}
                      onChange={(e) =>
                        updateLine(l.id, { ust_satz: e.target.value })
                      }
                      inputMode="decimal"
                    />
                  </td>
                  <td>
                    <select
                      className="xrechnung-new__cell"
                      value={l.ust_kategorie}
                      onChange={(e) =>
                        updateLine(l.id, {
                          ust_kategorie: e.target.value as "S" | "Z" | "E",
                        })
                      }
                    >
                      <option value="S">S — Standard</option>
                      <option value="Z">Z — Nullsatz</option>
                      <option value="E">E — Steuerbefreit</option>
                    </select>
                  </td>
                  <td className="is-num">{euro.format(menge * preis)}</td>
                  <td>
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      onClick={() => removeLine(l.id)}
                      title="Position entfernen"
                      disabled={lines.length === 1 && idx === 0}
                    >
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>

      <div className="xrechnung-new__bottom">
        <section className="card xrechnung-new__section">
          <h2>Zahlungsinformation</h2>
          <div className="form-grid">
            <label className="form-field">
              <span>IBAN</span>
              <input
                value={payment.iban}
                onChange={(e) =>
                  setPayment({ ...payment, iban: e.target.value })
                }
                placeholder="DE00 0000 0000 0000 0000 00"
              />
            </label>
            <label className="form-field">
              <span>BIC</span>
              <input
                value={payment.bic}
                onChange={(e) =>
                  setPayment({ ...payment, bic: e.target.value })
                }
              />
            </label>
            <label className="form-field form-field--wide">
              <span>Kontoinhaber</span>
              <input
                value={payment.kontoinhaber}
                onChange={(e) =>
                  setPayment({ ...payment, kontoinhaber: e.target.value })
                }
              />
            </label>
            <label className="form-field form-field--wide">
              <span>Zahlungsbedingungen (Freitext)</span>
              <input
                value={payment.zahlungsbedingungen}
                onChange={(e) =>
                  setPayment({
                    ...payment,
                    zahlungsbedingungen: e.target.value,
                  })
                }
                placeholder="Zahlbar ohne Abzug bis zum Fälligkeitsdatum"
              />
            </label>
          </div>
        </section>

        <section className="card xrechnung-new__section xrechnung-new__summary">
          <h2>Summe</h2>
          <dl className="xrechnung-new__summary-list">
            <div>
              <dt>Netto gesamt</dt>
              <dd>{euro.format(summary.netto_gesamt)}</dd>
            </div>
            {summary.ust_gruppen.map((g) => (
              <div key={`${g.kategorie}-${g.satz}`}>
                <dt>
                  USt {g.satz}&nbsp;% ({g.kategorie})
                </dt>
                <dd>{euro.format(g.ust)}</dd>
              </div>
            ))}
            <div>
              <dt>USt gesamt</dt>
              <dd>{euro.format(summary.ust_gesamt)}</dd>
            </div>
            <div className="xrechnung-new__total">
              <dt>Brutto</dt>
              <dd>{euro.format(summary.brutto_gesamt)}</dd>
            </div>
          </dl>
          {summary.ust_gruppen.some((g) => g.kategorie === "E") && (
            <p className="xrechnung-new__note">
              <AlertTriangle size={12} /> Bei steuerbefreiten Positionen (E)
              muss die Rechnung einen Befreiungsgrund enthalten (z. B.
              § 19 UStG Kleinunternehmer, § 4 Nr. 1a UStG innergemeinschaftlich).
              Dieser Grund wird aktuell nicht in der XML abgebildet.
            </p>
          )}
        </section>
      </div>
    </form>
  );
}

function PartyFields({
  party,
  onChange,
}: {
  party: XInvoiceParty;
  onChange: (next: XInvoiceParty) => void;
}) {
  function set<K extends keyof XInvoiceParty>(key: K, value: XInvoiceParty[K]) {
    onChange({ ...party, [key]: value });
  }
  return (
    <div className="form-grid">
      <label className="form-field form-field--wide">
        <span>Name *</span>
        <input
          value={party.name}
          onChange={(e) => set("name", e.target.value)}
        />
      </label>
      <label className="form-field form-field--wide">
        <span>Straße &amp; Hausnummer</span>
        <input
          value={party.anschrift_strasse ?? ""}
          onChange={(e) => set("anschrift_strasse", e.target.value)}
        />
      </label>
      <label className="form-field">
        <span>PLZ</span>
        <input
          value={party.anschrift_plz ?? ""}
          onChange={(e) => set("anschrift_plz", e.target.value)}
        />
      </label>
      <label className="form-field">
        <span>Ort</span>
        <input
          value={party.anschrift_ort ?? ""}
          onChange={(e) => set("anschrift_ort", e.target.value)}
        />
      </label>
      <label className="form-field">
        <span>Land (ISO-2)</span>
        <input
          value={party.anschrift_land ?? "DE"}
          onChange={(e) =>
            set("anschrift_land", e.target.value.toUpperCase().slice(0, 2))
          }
          maxLength={2}
        />
      </label>
      <label className="form-field">
        <span>USt-IdNr.</span>
        <input
          value={party.ust_id ?? ""}
          onChange={(e) => set("ust_id", e.target.value)}
          placeholder="DE123456789"
        />
      </label>
      <label className="form-field">
        <span>Steuernummer</span>
        <input
          value={party.steuernummer ?? ""}
          onChange={(e) => set("steuernummer", e.target.value)}
        />
      </label>
      <label className="form-field">
        <span>E-Mail</span>
        <input
          type="email"
          value={party.email ?? ""}
          onChange={(e) => set("email", e.target.value)}
        />
      </label>
      <label className="form-field">
        <span>Telefon</span>
        <input
          value={party.telefon ?? ""}
          onChange={(e) => set("telefon", e.target.value)}
        />
      </label>
    </div>
  );
}
