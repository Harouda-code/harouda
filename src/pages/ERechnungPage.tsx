import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertTriangle,
  ArrowLeft,
  BadgeCheck,
  CheckCircle2,
  Download,
  FileText,
  Plus,
  Trash2,
  Upload,
  UserPlus,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { XRechnungBuilder } from "../domain/einvoice/XRechnungBuilder";
import { XRechnungValidator } from "../domain/einvoice/XRechnungValidator";
import { buildZugferd } from "../domain/einvoice/ZugferdBuilder";
import {
  extractZugferdFromPdf,
  readFromXml,
  type ZugferdExtractResult,
} from "../domain/einvoice/ZugferdReader";
import type {
  InvoiceLine,
  InvoiceTypeCode,
  Party,
  VatCategoryCode,
  XRechnungOptions,
} from "../domain/einvoice/types";
import { Money } from "../lib/money/Money";
import { downloadText } from "../utils/exporters";
import { useMandant } from "../contexts/MandantContext";
import {
  DEMO_COMPANY_ID,
  useCompanyId,
} from "../contexts/CompanyContext";
import type { BusinessPartner, UstIdVerificationStatus } from "../types/db";
import { DebitorAuswahl } from "../components/partners/DebitorAuswahl";
import { UstIdnrStatusBadge } from "../components/partners/UstIdnrStatusBadge";
import {
  PartnerEditor,
  type PartnerPrefill,
} from "../components/partners/PartnerEditor";
import { getLatestVerification } from "../api/ustidVerifications";
import { useQuery } from "@tanstack/react-query";
import "./ReportView.css";

type Tab = "erstellen" | "empfangen";

type EditLine = {
  description: string;
  quantityStr: string;
  unitCode: string;
  unitPriceStr: string;
  vatRateStr: string;
  vatCategory: VatCategoryCode;
};

function moneyOrZero(s: string): Money {
  if (!s.trim()) return Money.zero();
  try {
    return new Money(s.replace(",", "."));
  } catch {
    return Money.zero();
  }
}

const DEFAULT_SELLER: Party = {
  name: "Musterfirma GmbH",
  legalName: "Musterfirma GmbH",
  address: {
    street: "Hauptstr. 1",
    city: "Berlin",
    postalZone: "10115",
    countryCode: "DE",
  },
  tax: { companyId: "DE123456789", scheme: "VAT" },
};

const DEFAULT_BUYER: Party = {
  name: "Kundenfirma AG",
  address: {
    street: "Nebenstr. 2",
    city: "München",
    postalZone: "80331",
    countryCode: "DE",
  },
  tax: { companyId: "DE987654321", scheme: "VAT" },
};

export default function ERechnungPage() {
  const [tab, setTab] = useState<Tab>("erstellen");

  // Create-Form state
  const [invNumber, setInvNumber] = useState("RE-2025-001");
  const [issueDate, setIssueDate] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [dueDate, setDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().slice(0, 10);
  });
  const [typeCode, setTypeCode] = useState<InvoiceTypeCode>("380");
  const [buyerRef, setBuyerRef] = useState("");

  const [seller, setSeller] = useState<Party>(DEFAULT_SELLER);
  const [buyer, setBuyer] = useState<Party>(DEFAULT_BUYER);
  const [selectedBusinessPartnerId, setSelectedBusinessPartnerId] = useState<
    string | null
  >(null);

  const [lines, setLines] = useState<EditLine[]>([
    {
      description: "Beratungsleistung",
      quantityStr: "1",
      unitCode: "C62",
      unitPriceStr: "100",
      vatRateStr: "19",
      vatCategory: "S",
    },
  ]);
  const [paymentIban, setPaymentIban] = useState("DE02120300000000202051");
  const [paymentBic, setPaymentBic] = useState("BYLADEM1001");
  const [paymentTerms, setPaymentTerms] = useState("Zahlbar ohne Abzug in 30 Tagen");

  const [format, setFormat] = useState<"XRECHNUNG" | "ZUGFERD">("XRECHNUNG");

  // Compose options
  const options: XRechnungOptions = useMemo(() => {
    const iLines: InvoiceLine[] = lines.map((l, idx) => {
      const qty = moneyOrZero(l.quantityStr);
      const up = moneyOrZero(l.unitPriceStr);
      return {
        lineId: String(idx + 1),
        description: l.description,
        quantity: qty,
        unitCode: l.unitCode || "C62",
        netUnitPrice: up,
        netAmount: qty.times(up),
        vatRate: moneyOrZero(l.vatRateStr),
        vatCategory: l.vatCategory,
      };
    });
    return {
      invoice: {
        invoiceNumber: invNumber,
        issueDate,
        dueDate,
        currency: "EUR",
        type: typeCode,
        lines: iLines,
        buyerReference: buyerRef || undefined,
        paymentMeans: {
          code: "58",
          iban: paymentIban || undefined,
          bic: paymentBic || undefined,
        },
        paymentTerms: paymentTerms || undefined,
      },
      seller,
      buyer,
      profileId: "XRECHNUNG_3_0",
    };
  }, [
    invNumber,
    issueDate,
    dueDate,
    typeCode,
    buyerRef,
    lines,
    paymentIban,
    paymentBic,
    paymentTerms,
    seller,
    buyer,
  ]);

  const validation = useMemo(
    () => new XRechnungValidator().validateOptions(options),
    [options]
  );

  const builtXml = useMemo(() => {
    if (!validation.isValid) return "";
    return new XRechnungBuilder().build(options).xml;
  }, [options, validation.isValid]);

  function addLine() {
    setLines([
      ...lines,
      {
        description: "",
        quantityStr: "1",
        unitCode: "C62",
        unitPriceStr: "",
        vatRateStr: "19",
        vatCategory: "S",
      },
    ]);
  }
  function removeLine(i: number) {
    setLines(lines.filter((_, idx) => idx !== i));
  }
  function updateLine(i: number, field: keyof EditLine, value: string) {
    setLines(
      lines.map((l, idx) => (idx === i ? { ...l, [field]: value as never } : l))
    );
  }

  function handleDownloadXml() {
    if (!validation.isValid || !builtXml) {
      toast.error("Validierung fehlgeschlagen — XRechnung nicht verfügbar.");
      return;
    }
    downloadText(builtXml, `${invNumber}.xml`, "application/xml");
    toast.success("XRechnung exportiert.");
  }

  async function handleDownloadZugferd() {
    if (!validation.isValid) {
      toast.error("Validierung fehlgeschlagen — ZUGFeRD nicht verfügbar.");
      return;
    }
    try {
      const r = await buildZugferd(options);
      const url = URL.createObjectURL(r.pdf);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${invNumber}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("ZUGFeRD-PDF erzeugt.");
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  return (
    <div className="report">
      <header className="report__head no-print">
        <Link to="/" className="report__back">
          <ArrowLeft size={16} /> Zurück
        </Link>
        <div className="report__head-title">
          <h1>E-Rechnung (XRechnung / ZUGFeRD · § 14 UStG)</h1>
          <p>
            B2B-Pflicht seit 01.01.2025: Empfang von E-Rechnungen ist
            verpflichtend. Versand per E-Rechnung wird schrittweise Pflicht
            (Vollzug 2027/2028).
          </p>
        </div>
      </header>

      <div className="no-print" style={{ display: "flex", gap: 4, marginBottom: 12 }}>
        {(["erstellen", "empfangen"] as Tab[]).map((t) => (
          <button
            key={t}
            className={tab === t ? "btn btn-primary" : "btn btn-outline"}
            onClick={() => setTab(t)}
          >
            {t === "erstellen" ? "Erstellen" : "Empfangen"}
          </button>
        ))}
      </div>

      {tab === "erstellen" && (
        <CreateTab
          options={options}
          validation={validation}
          builtXml={builtXml}
          format={format}
          setFormat={setFormat}
          invNumber={invNumber}
          setInvNumber={setInvNumber}
          issueDate={issueDate}
          setIssueDate={setIssueDate}
          dueDate={dueDate}
          setDueDate={setDueDate}
          typeCode={typeCode}
          setTypeCode={setTypeCode}
          buyerRef={buyerRef}
          setBuyerRef={setBuyerRef}
          seller={seller}
          setSeller={setSeller}
          buyer={buyer}
          setBuyer={setBuyer}
          selectedBusinessPartnerId={selectedBusinessPartnerId}
          setSelectedBusinessPartnerId={setSelectedBusinessPartnerId}
          lines={lines}
          addLine={addLine}
          removeLine={removeLine}
          updateLine={updateLine}
          paymentIban={paymentIban}
          setPaymentIban={setPaymentIban}
          paymentBic={paymentBic}
          setPaymentBic={setPaymentBic}
          paymentTerms={paymentTerms}
          setPaymentTerms={setPaymentTerms}
          handleDownloadXml={handleDownloadXml}
          handleDownloadZugferd={handleDownloadZugferd}
        />
      )}

      {tab === "empfangen" && <ReceiveTab />}
    </div>
  );
}

// ---------- Create Tab ----------
function CreateTab(props: {
  options: XRechnungOptions;
  validation: ReturnType<XRechnungValidator["validateOptions"]>;
  builtXml: string;
  format: "XRECHNUNG" | "ZUGFERD";
  setFormat: (f: "XRECHNUNG" | "ZUGFERD") => void;
  invNumber: string;
  setInvNumber: (v: string) => void;
  issueDate: string;
  setIssueDate: (v: string) => void;
  dueDate: string;
  setDueDate: (v: string) => void;
  typeCode: InvoiceTypeCode;
  setTypeCode: (v: InvoiceTypeCode) => void;
  buyerRef: string;
  setBuyerRef: (v: string) => void;
  seller: Party;
  setSeller: (v: Party) => void;
  buyer: Party;
  setBuyer: (v: Party) => void;
  selectedBusinessPartnerId: string | null;
  setSelectedBusinessPartnerId: (id: string | null) => void;
  lines: EditLine[];
  addLine: () => void;
  removeLine: (i: number) => void;
  updateLine: (i: number, field: keyof EditLine, value: string) => void;
  paymentIban: string;
  setPaymentIban: (v: string) => void;
  paymentBic: string;
  setPaymentBic: (v: string) => void;
  paymentTerms: string;
  setPaymentTerms: (v: string) => void;
  handleDownloadXml: () => void;
  handleDownloadZugferd: () => Promise<void>;
}) {
  const {
    options,
    validation,
    builtXml,
    format,
    setFormat,
    invNumber,
    setInvNumber,
    issueDate,
    setIssueDate,
    dueDate,
    setDueDate,
    typeCode,
    setTypeCode,
    buyerRef,
    setBuyerRef,
    seller,
    setSeller,
    buyer,
    setBuyer,
    selectedBusinessPartnerId,
    setSelectedBusinessPartnerId,
    lines,
    addLine,
    removeLine,
    updateLine,
    paymentIban,
    setPaymentIban,
    paymentBic,
    setPaymentBic,
    paymentTerms,
    setPaymentTerms,
    handleDownloadXml,
    handleDownloadZugferd,
  } = props;

  const totalNet = options.invoice.lines.reduce(
    (acc, l) => acc.plus(l.netAmount),
    Money.zero()
  );
  const totalVat = options.invoice.lines.reduce(
    (acc, l) => acc.plus(l.netAmount.times(l.vatRate).div(100)),
    Money.zero()
  );

  return (
    <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 12 }}>
      <div>
        {/* Format + Rechnung */}
        <section className="card" style={{ padding: 14, marginBottom: 12 }}>
          <h3 style={{ margin: "0 0 8px", fontSize: "0.95rem" }}>Format + Kopf</h3>
          <div style={{ display: "flex", gap: 16, marginBottom: 10 }}>
            <label>
              <input
                type="radio"
                checked={format === "XRECHNUNG"}
                onChange={() => setFormat("XRECHNUNG")}
              />{" "}
              XRechnung (reines XML, v. a. Behörden)
            </label>
            <label>
              <input
                type="radio"
                checked={format === "ZUGFERD"}
                onChange={() => setFormat("ZUGFERD")}
              />{" "}
              ZUGFeRD (PDF + embedded XML, B2B)
            </label>
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))",
              gap: 8,
            }}
          >
            <label>
              <span>Rechnungsnummer *</span>
              <input value={invNumber} onChange={(e) => setInvNumber(e.target.value)} />
            </label>
            <label>
              <span>Rechnungsdatum *</span>
              <input
                type="date"
                value={issueDate}
                onChange={(e) => setIssueDate(e.target.value)}
              />
            </label>
            <label>
              <span>Fälligkeit</span>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </label>
            <label>
              <span>Typ</span>
              <select
                value={typeCode}
                onChange={(e) => setTypeCode(e.target.value as InvoiceTypeCode)}
              >
                <option value="380">380 · Handelsrechnung</option>
                <option value="381">381 · Gutschrift</option>
                <option value="384">384 · Korrektur</option>
                <option value="326">326 · Teilrechnung</option>
              </select>
            </label>
            <label>
              <span>Leitweg-ID / Buyer-Ref (B2G)</span>
              <input value={buyerRef} onChange={(e) => setBuyerRef(e.target.value)} />
            </label>
          </div>
        </section>

        <PartyEditor label="Verkäufer" party={seller} setParty={setSeller} />
        <DebitorBlock
          selectedId={selectedBusinessPartnerId}
          onSelect={(id, partner) => {
            setSelectedBusinessPartnerId(id);
            if (partner) {
              setBuyer(businessPartnerToParty(partner));
            }
          }}
          onSavedAsDebitor={(id, partner) => {
            setSelectedBusinessPartnerId(id);
            setBuyer(businessPartnerToParty(partner));
          }}
          currentBuyer={buyer}
        />
        <PartyEditor label="Käufer" party={buyer} setParty={setBuyer} />

        {/* Positionen */}
        <section className="card" style={{ padding: 14, marginBottom: 12 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 8,
            }}
          >
            <h3 style={{ margin: 0, fontSize: "0.95rem" }}>Positionen</h3>
            <button className="btn btn-outline btn-sm" onClick={addLine}>
              <Plus size={12} /> Position
            </button>
          </div>
          <table style={{ width: "100%", fontSize: "0.85rem" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid #c3c8d1" }}>
                <th style={{ textAlign: "left" }}>Bezeichnung</th>
                <th>Menge</th>
                <th>Einheit</th>
                <th>Preis</th>
                <th>USt%</th>
                <th>Kat.</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {lines.map((l, i) => (
                <tr key={i} style={{ borderBottom: "1px solid #eef1f6" }}>
                  <td>
                    <input
                      value={l.description}
                      onChange={(e) => updateLine(i, "description", e.target.value)}
                      style={{ width: "100%" }}
                    />
                  </td>
                  <td>
                    <input
                      value={l.quantityStr}
                      onChange={(e) => updateLine(i, "quantityStr", e.target.value)}
                      style={{ width: 70 }}
                    />
                  </td>
                  <td>
                    <input
                      value={l.unitCode}
                      onChange={(e) => updateLine(i, "unitCode", e.target.value)}
                      style={{ width: 55 }}
                    />
                  </td>
                  <td>
                    <input
                      value={l.unitPriceStr}
                      onChange={(e) => updateLine(i, "unitPriceStr", e.target.value)}
                      style={{ width: 80 }}
                    />
                  </td>
                  <td>
                    <input
                      value={l.vatRateStr}
                      onChange={(e) => updateLine(i, "vatRateStr", e.target.value)}
                      style={{ width: 50 }}
                    />
                  </td>
                  <td>
                    <select
                      value={l.vatCategory}
                      onChange={(e) =>
                        updateLine(i, "vatCategory", e.target.value)
                      }
                    >
                      {["S", "Z", "E", "AE", "K", "G", "O"].map((c) => (
                        <option key={c}>{c}</option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <button
                      className="btn btn-outline btn-sm"
                      onClick={() => removeLine(i)}
                    >
                      <Trash2 size={12} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ marginTop: 8, fontSize: "0.85rem", textAlign: "right" }}>
            Summe Netto: <strong>{totalNet.toEuroFormat()}</strong> · USt:{" "}
            <strong>{totalVat.toEuroFormat()}</strong> · Brutto:{" "}
            <strong>{totalNet.plus(totalVat).toEuroFormat()}</strong>
          </div>
        </section>

        {/* Zahlung */}
        <section className="card" style={{ padding: 14, marginBottom: 12 }}>
          <h3 style={{ margin: "0 0 8px", fontSize: "0.95rem" }}>Zahlung (SEPA)</h3>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <label>
              <span>IBAN</span>
              <input
                value={paymentIban}
                onChange={(e) => setPaymentIban(e.target.value)}
                style={{ width: 220 }}
              />
            </label>
            <label>
              <span>BIC</span>
              <input
                value={paymentBic}
                onChange={(e) => setPaymentBic(e.target.value)}
                style={{ width: 140 }}
              />
            </label>
            <label style={{ flex: 1, minWidth: 200 }}>
              <span>Zahlungsbedingungen</span>
              <input
                value={paymentTerms}
                onChange={(e) => setPaymentTerms(e.target.value)}
              />
            </label>
          </div>
        </section>

        {/* XML Preview */}
        {builtXml && (
          <section className="card" style={{ padding: 14 }}>
            <h3 style={{ margin: "0 0 8px", fontSize: "0.95rem" }}>
              XRechnung-XML Preview (erste 30 Zeilen)
            </h3>
            <pre
              style={{
                padding: 10,
                background: "#f5f5f7",
                fontSize: "0.72rem",
                fontFamily: "var(--font-mono)",
                whiteSpace: "pre",
                overflow: "auto",
                margin: 0,
                maxHeight: 380,
              }}
            >
              {builtXml.split("\n").slice(0, 30).join("\n")}
              {"\n…"}
            </pre>
          </section>
        )}
      </div>

      {/* Right column: validation + actions */}
      <aside>
        <section
          className="card"
          style={{
            padding: 14,
            marginBottom: 12,
            borderLeft: `4px solid ${validation.isValid ? "#1f7a4d" : "#8a2c2c"}`,
            background: validation.isValid ? "#eaf5ef" : "#fcefea",
            position: "sticky",
            top: 12,
          }}
        >
          <h3 style={{ margin: "0 0 8px", fontSize: "0.95rem" }}>
            {validation.isValid ? (
              <CheckCircle2 size={14} color="#1f7a4d" />
            ) : (
              <AlertTriangle size={14} color="#8a2c2c" />
            )}{" "}
            Validierung ({validation.errors.length} Fehler ·{" "}
            {validation.warnings.length} Warnungen)
          </h3>
          {validation.errors.length > 0 && (
            <ul style={{ margin: "6px 0 0 16px", fontSize: "0.82rem", color: "#8a2c2c" }}>
              {validation.errors.map((e, i) => (
                <li key={i}>
                  <strong>[{e.rule}]</strong> {e.message}
                </li>
              ))}
            </ul>
          )}
          {validation.warnings.length > 0 && (
            <ul style={{ margin: "6px 0 0 16px", fontSize: "0.82rem", color: "#c76b3f" }}>
              {validation.warnings.map((w, i) => (
                <li key={i}>
                  <strong>[{w.rule}]</strong> {w.message}
                </li>
              ))}
            </ul>
          )}

          <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 6 }}>
            {format === "XRECHNUNG" ? (
              <button
                className="btn btn-primary"
                onClick={handleDownloadXml}
                disabled={!validation.isValid}
              >
                <Download size={14} /> XRechnung XML
              </button>
            ) : (
              <button
                className="btn btn-primary"
                onClick={handleDownloadZugferd}
                disabled={!validation.isValid}
              >
                <Download size={14} /> ZUGFeRD PDF
              </button>
            )}
          </div>
        </section>
      </aside>
    </div>
  );
}

function PartyEditor({
  label,
  party,
  setParty,
}: {
  label: string;
  party: Party;
  setParty: (p: Party) => void;
}) {
  return (
    <section className="card" style={{ padding: 14, marginBottom: 12 }}>
      <h3 style={{ margin: "0 0 8px", fontSize: "0.95rem" }}>{label}</h3>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
          gap: 8,
        }}
      >
        <label>
          <span>Name *</span>
          <input
            value={party.name}
            onChange={(e) => setParty({ ...party, name: e.target.value })}
          />
        </label>
        <label>
          <span>USt-IdNr / StNr</span>
          <input
            value={party.tax.companyId}
            onChange={(e) =>
              setParty({
                ...party,
                tax: { ...party.tax, companyId: e.target.value },
              })
            }
          />
        </label>
        <label>
          <span>Straße</span>
          <input
            value={party.address.street}
            onChange={(e) =>
              setParty({
                ...party,
                address: { ...party.address, street: e.target.value },
              })
            }
          />
        </label>
        <label>
          <span>PLZ</span>
          <input
            value={party.address.postalZone}
            onChange={(e) =>
              setParty({
                ...party,
                address: { ...party.address, postalZone: e.target.value },
              })
            }
          />
        </label>
        <label>
          <span>Ort</span>
          <input
            value={party.address.city}
            onChange={(e) =>
              setParty({
                ...party,
                address: { ...party.address, city: e.target.value },
              })
            }
          />
        </label>
        <label>
          <span>Land (ISO-2)</span>
          <input
            value={party.address.countryCode}
            onChange={(e) =>
              setParty({
                ...party,
                address: { ...party.address, countryCode: e.target.value.toUpperCase() },
              })
            }
            maxLength={2}
          />
        </label>
      </div>
    </section>
  );
}

// ---------- Debitor-Block (Sprint 19.C.2) ----------

function businessPartnerToParty(p: BusinessPartner): Party {
  return {
    name: p.name,
    legalName: p.legal_name ?? undefined,
    endpointId: p.leitweg_id ?? p.peppol_id ?? undefined,
    endpointScheme: p.leitweg_id ? "0204" : undefined,
    address: {
      street: [p.anschrift_strasse, p.anschrift_hausnummer]
        .filter(Boolean)
        .join(" ")
        .trim(),
      city: p.anschrift_ort ?? "",
      postalZone: p.anschrift_plz ?? "",
      countryCode: p.anschrift_land_iso ?? "DE",
    },
    tax: {
      companyId: p.ust_idnr ?? p.steuernummer ?? "",
      scheme: "VAT",
    },
    contact: p.email || p.telefon
      ? {
          email: p.email ?? undefined,
          phone: p.telefon ?? undefined,
        }
      : undefined,
  };
}

function partyToPrefill(buyer: Party): PartnerPrefill {
  return {
    name: buyer.name,
    legal_name: buyer.legalName,
    ust_idnr: buyer.tax.companyId || undefined,
    anschrift_strasse: buyer.address.street,
    anschrift_plz: buyer.address.postalZone,
    anschrift_ort: buyer.address.city,
    anschrift_land_iso: buyer.address.countryCode,
    email: buyer.contact?.email,
    leitweg_id: buyer.endpointScheme === "0204" ? buyer.endpointId : undefined,
    is_public_authority: buyer.endpointScheme === "0204" && !!buyer.endpointId,
  };
}

function DebitorBlock({
  selectedId,
  onSelect,
  onSavedAsDebitor,
  currentBuyer,
}: {
  selectedId: string | null;
  onSelect: (id: string | null, partner: BusinessPartner | null) => void;
  onSavedAsDebitor: (id: string, partner: BusinessPartner) => void;
  currentBuyer: Party;
}) {
  const { selectedMandantId } = useMandant();
  const companyId = useCompanyId() ?? DEMO_COMPANY_ID;
  const [editorOpen, setEditorOpen] = useState(false);

  const selectedQ = useQuery({
    queryKey: ["business_partner_display", selectedId],
    enabled: !!selectedId,
    queryFn: async () => {
      // Wir suchen den Partner in der bereits gecachten List-Query
      // (die DebitorAuswahl angelegt hat). Falls der nicht da ist,
      // fallback: null.
      if (!selectedId || !selectedMandantId) return null;
      const { listBusinessPartners } = await import("../api/businessPartners");
      const list = await listBusinessPartners({
        clientId: selectedMandantId,
        type: "debitor",
        activeOnly: true,
      });
      return list.find((p) => p.id === selectedId) ?? null;
    },
  });
  const selected = selectedQ.data ?? null;

  const latestQ = useQuery({
    queryKey: [
      "ustid_verification",
      selected?.client_id,
      selected?.ust_idnr,
    ],
    enabled: !!selected?.ust_idnr,
    queryFn: () =>
      selected?.ust_idnr
        ? getLatestVerification(selected.client_id, selected.ust_idnr)
        : Promise.resolve(null),
  });
  const latest = latestQ.data ?? null;
  const viesStatus: UstIdVerificationStatus | null =
    latest?.verification_status ?? null;

  return (
    <section
      className="card"
      style={{ padding: 14, marginBottom: 12 }}
      data-testid="debitor-block"
    >
      <DebitorAuswahl
        clientId={selectedMandantId ?? null}
        value={selectedId}
        onChange={onSelect}
      />
      <div
        style={{
          marginTop: 10,
          display: "flex",
          gap: 10,
          alignItems: "center",
          flexWrap: "wrap",
        }}
      >
        {selected ? (
          <>
            <span
              className="empl__badge is-active"
              data-testid="badge-from-stammdaten"
              title="Käufer-Daten aus Stammdaten geladen"
            >
              <BadgeCheck size={10} style={{ verticalAlign: "-1px" }} />
              Von Stammdaten: {selected.name}
            </span>
            {selected.ust_idnr && (
              <UstIdnrStatusBadge
                status={viesStatus}
                lastCheckedAt={latest?.created_at ?? null}
                errorDetail={latest?.error_message ?? null}
                source={latest?.verification_source ?? null}
                testIdSuffix="debitor-block"
              />
            )}
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => onSelect(null, null)}
              data-testid="btn-reset-freitext"
            >
              Zurücksetzen auf Freitext
            </button>
          </>
        ) : currentBuyer.name.trim() ? (
          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={() => setEditorOpen(true)}
            data-testid="btn-als-debitor-speichern"
          >
            <UserPlus size={12} /> Als Debitor speichern
          </button>
        ) : null}
      </div>
      <p
        style={{
          marginTop: 8,
          marginBottom: 0,
          fontSize: "0.78rem",
          color: "var(--muted, #666)",
        }}
      >
        Legacy-Rechnungen ohne Debitor-Referenz bleiben unverändert — sie
        verweisen weiter auf den partner_*-Snapshot.
      </p>
      {editorOpen && selectedMandantId && (
        <PartnerEditor
          mode="create"
          defaultType="debitor"
          clientId={selectedMandantId}
          companyId={companyId}
          prefill={partyToPrefill(currentBuyer)}
          onSaved={(saved) => {
            onSavedAsDebitor(saved.id, saved);
            setEditorOpen(false);
          }}
          onCancel={() => setEditorOpen(false)}
        />
      )}
    </section>
  );
}

// ---------- Receive Tab ----------
function ReceiveTab() {
  const [result, setResult] = useState<ZugferdExtractResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);

  async function handleFile(file: File) {
    setBusy(true);
    setFileName(file.name);
    try {
      if (file.name.toLowerCase().endsWith(".pdf")) {
        const r = await extractZugferdFromPdf(file);
        setResult(r);
        if (r.parsedInvoice) {
          toast.success(`Eingebettete XML erkannt: ${r.fileName}`);
        } else {
          toast.warning("Kein verwertbares XML gefunden.");
        }
      } else if (
        file.name.toLowerCase().endsWith(".xml") ||
        file.type === "application/xml" ||
        file.type === "text/xml"
      ) {
        const xml = await file.text();
        setResult(readFromXml(xml));
        toast.success("XRechnung geparst.");
      } else {
        toast.error("Bitte PDF oder XML hochladen.");
      }
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <section
        className="card"
        style={{
          padding: 16,
          marginBottom: 12,
          border: "2px dashed #c3c8d1",
          background: "#fafbfc",
          textAlign: "center",
        }}
      >
        <Upload size={28} style={{ marginBottom: 6, color: "var(--ink-soft)" }} />
        <h3 style={{ margin: "4px 0", fontSize: "0.95rem" }}>E-Rechnung hochladen</h3>
        <p style={{ color: "var(--ink-soft)", fontSize: "0.85rem", margin: "4px 0" }}>
          PDF (ZUGFeRD/Factur-X) oder XML (XRechnung). Seit 01.01.2025 sind
          Unternehmen verpflichtet, E-Rechnungen annehmen zu können (§ 14 Abs. 1 UStG).
        </p>
        <input
          type="file"
          accept=".pdf,.xml,application/pdf,application/xml,text/xml"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleFile(f);
          }}
          style={{ marginTop: 8 }}
        />
      </section>

      {busy && (
        <div style={{ textAlign: "center", padding: 20 }}>Extrahiere …</div>
      )}

      {result && !busy && (
        <>
          <section
            className="card"
            style={{
              padding: 14,
              marginBottom: 12,
              borderLeft: `4px solid ${result.parsedInvoice ? "#1f7a4d" : "#8a2c2c"}`,
              background: result.parsedInvoice ? "#eaf5ef" : "#fcefea",
            }}
          >
            <h3 style={{ margin: "0 0 4px", fontSize: "0.95rem" }}>
              {result.parsedInvoice ? (
                <CheckCircle2 size={14} color="#1f7a4d" />
              ) : (
                <XCircle size={14} color="#8a2c2c" />
              )}{" "}
              Extraktion · Datei: {fileName}
            </h3>
            {result.fileName && (
              <div style={{ fontSize: "0.85rem" }}>
                Embedded attachment: <code>{result.fileName}</code>
              </div>
            )}
            {result.warnings.length > 0 && (
              <ul style={{ margin: "6px 0 0 16px", fontSize: "0.82rem", color: "#c76b3f" }}>
                {result.warnings.map((w, i) => (
                  <li key={i}>{w}</li>
                ))}
              </ul>
            )}
          </section>

          {result.parsedInvoice && (
            <>
              <section className="card" style={{ padding: 14, marginBottom: 12 }}>
                <h3 style={{ margin: "0 0 8px", fontSize: "0.95rem" }}>
                  <FileText size={14} /> Rechnungsdaten
                </h3>
                <div style={{ fontSize: "0.88rem", display: "grid", gridTemplateColumns: "140px 1fr", rowGap: 3 }}>
                  <span>Format</span>
                  <span>{result.parsedInvoice.format} {result.parsedInvoice.profile ? `(${result.parsedInvoice.profile})` : ""}</span>
                  <span>Rechnungsnummer</span>
                  <span>
                    <strong>{result.parsedInvoice.invoiceNumber}</strong>
                  </span>
                  <span>Datum</span>
                  <span>{result.parsedInvoice.issueDate}</span>
                  <span>Fälligkeit</span>
                  <span>{result.parsedInvoice.dueDate}</span>
                  <span>Währung</span>
                  <span>{result.parsedInvoice.currency}</span>
                  <span>Verkäufer</span>
                  <span>
                    {result.parsedInvoice.supplier.name} (USt-IdNr:{" "}
                    {result.parsedInvoice.supplier.tax.companyId})
                  </span>
                  <span>Käufer</span>
                  <span>
                    {result.parsedInvoice.customer.name} (USt-IdNr:{" "}
                    {result.parsedInvoice.customer.tax.companyId})
                  </span>
                  <span>Netto</span>
                  <span>{result.parsedInvoice.totalNet.toEuroFormat()}</span>
                  <span>USt</span>
                  <span>{result.parsedInvoice.totalVat.toEuroFormat()}</span>
                  <span>Brutto</span>
                  <span>
                    <strong>{result.parsedInvoice.totalGross.toEuroFormat()}</strong>
                  </span>
                </div>
              </section>

              <section className="card" style={{ padding: 14, marginBottom: 12 }}>
                <h3 style={{ margin: "0 0 8px", fontSize: "0.95rem" }}>
                  Positionen ({result.parsedInvoice.lines.length})
                </h3>
                <table style={{ width: "100%", fontSize: "0.85rem" }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid #c3c8d1" }}>
                      <th style={{ textAlign: "left" }}>Nr.</th>
                      <th style={{ textAlign: "left" }}>Bezeichnung</th>
                      <th style={{ textAlign: "right" }}>Menge</th>
                      <th style={{ textAlign: "right" }}>Preis</th>
                      <th style={{ textAlign: "right" }}>USt%</th>
                      <th style={{ textAlign: "right" }}>Netto</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.parsedInvoice.lines.map((l) => (
                      <tr key={l.lineId} style={{ borderBottom: "1px solid #eef1f6" }}>
                        <td>{l.lineId}</td>
                        <td>{l.description}</td>
                        <td style={{ textAlign: "right", fontFamily: "var(--font-mono)" }}>
                          {l.quantity.toFixed2()} {l.unitCode}
                        </td>
                        <td style={{ textAlign: "right", fontFamily: "var(--font-mono)" }}>
                          {l.netUnitPrice.toEuroFormat()}
                        </td>
                        <td style={{ textAlign: "right", fontFamily: "var(--font-mono)" }}>
                          {l.vatRate.toFixed2()}%
                        </td>
                        <td style={{ textAlign: "right", fontFamily: "var(--font-mono)" }}>
                          {l.netAmount.toEuroFormat()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </section>
            </>
          )}
        </>
      )}
    </div>
  );
}
