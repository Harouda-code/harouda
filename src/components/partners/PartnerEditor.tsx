/**
 * Sprint 19.C · PartnerEditor als Dialog-Komponente.
 *
 * Spec: Props { mode: 'create' | 'edit'; partnerId?: string;
 *               defaultType: BusinessPartnerType;
 *               onSaved: (p: BusinessPartner) => void;
 *               onCancel: () => void;
 *               prefill?: PartnerPrefill }
 *
 * Konstruiert ein modales Overlay; der Aufrufer gibt die Mount-Kontrolle
 * via {open ? <PartnerEditor .../> : null}.
 *
 * Validierung:
 *  - USt-IdNr, IBAN, Leitweg-ID on-blur via Domain-Validatoren
 *  - Leitweg-ID Pflicht wenn is_public_authority=true
 *  - Live-Duplicate-Check (500 ms-Debounce) via checkDuplicatesForInput
 *  - Hard-Blocks: rote Fehlerzeile direkt am Save-Button (nicht Banner!)
 *  - Soft-Warnings: DuplicateWarningBanner mit Override-Button
 *
 * Partner-Type-Switch (Spec 19.C.1/Test #11):
 *  - Wechsel auf 'debitor' → kreditor_nummer auf null (ungueltig)
 *  - Wechsel auf 'kreditor' → debitor_nummer auf null
 *  - Wechsel auf 'both' → beide behalten
 */

import {
  type FormEvent,
  type PropsWithChildren,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { BadgeCheck, X } from "lucide-react";
import {
  checkDuplicatesForInput,
  createBusinessPartner,
  DuplicatePartnerError,
  getBusinessPartner,
  listBusinessPartners,
  updateBusinessPartner,
  verifyUstIdnrForPartner,
} from "../../api/businessPartners";
import { getVerificationsForPartner } from "../../api/ustidVerifications";
import { validateUstIdnrFormat } from "../../domain/partners/ustIdValidation";
import { validateIban } from "../../domain/partners/ibanValidation";
import { validateLeitwegId } from "../../domain/partners/leitwegIdValidation";
import type {
  BusinessPartner,
  BusinessPartnerType,
  PreferredInvoiceFormat,
  UstIdVerificationSource,
  UstIdVerificationStatus,
} from "../../types/db";
import type { DuplicateCheckResult } from "../../domain/partners/duplicateCheck";
import { UstIdnrStatusBadge } from "./UstIdnrStatusBadge";
import { DuplicateWarningBanner } from "./DuplicateWarningBanner";

export type PartnerPrefill = Partial<{
  name: string;
  legal_name: string;
  ust_idnr: string;
  anschrift_strasse: string;
  anschrift_hausnummer: string;
  anschrift_plz: string;
  anschrift_ort: string;
  anschrift_land_iso: string;
  email: string;
  iban: string;
  bic: string;
  leitweg_id: string;
  is_public_authority: boolean;
}>;

export type PartnerEditorProps = {
  mode: "create" | "edit";
  partnerId?: string;
  defaultType: BusinessPartnerType;
  clientId: string;
  companyId: string;
  prefill?: PartnerPrefill;
  onSaved: (p: BusinessPartner) => void;
  onCancel: () => void;
};

type EditorForm = {
  partner_type: BusinessPartnerType;
  name: string;
  legal_name: string;
  rechtsform: string;
  ust_idnr: string;
  steuernummer: string;
  finanzamt: string;
  hrb: string;
  registergericht: string;
  anschrift_strasse: string;
  anschrift_hausnummer: string;
  anschrift_plz: string;
  anschrift_ort: string;
  anschrift_land_iso: string;
  email: string;
  telefon: string;
  iban: string;
  bic: string;
  is_public_authority: boolean;
  leitweg_id: string;
  preferred_invoice_format: PreferredInvoiceFormat;
  peppol_id: string;
  zahlungsziel_tage: string;
  skonto_prozent: string;
  skonto_tage: string;
  standard_erloeskonto: string;
  standard_aufwandskonto: string;
  is_active: boolean;
  notes: string;
};

function emptyForm(defaultType: BusinessPartnerType): EditorForm {
  return {
    partner_type: defaultType,
    name: "",
    legal_name: "",
    rechtsform: "",
    ust_idnr: "",
    steuernummer: "",
    finanzamt: "",
    hrb: "",
    registergericht: "",
    anschrift_strasse: "",
    anschrift_hausnummer: "",
    anschrift_plz: "",
    anschrift_ort: "",
    anschrift_land_iso: "DE",
    email: "",
    telefon: "",
    iban: "",
    bic: "",
    is_public_authority: false,
    leitweg_id: "",
    preferred_invoice_format: "pdf",
    peppol_id: "",
    zahlungsziel_tage: "",
    skonto_prozent: "",
    skonto_tage: "",
    standard_erloeskonto: "",
    standard_aufwandskonto: "",
    is_active: true,
    notes: "",
  };
}

function applyPrefill(base: EditorForm, p?: PartnerPrefill): EditorForm {
  if (!p) return base;
  return {
    ...base,
    name: p.name ?? base.name,
    legal_name: p.legal_name ?? base.legal_name,
    ust_idnr: p.ust_idnr ?? base.ust_idnr,
    anschrift_strasse: p.anschrift_strasse ?? base.anschrift_strasse,
    anschrift_hausnummer: p.anschrift_hausnummer ?? base.anschrift_hausnummer,
    anschrift_plz: p.anschrift_plz ?? base.anschrift_plz,
    anschrift_ort: p.anschrift_ort ?? base.anschrift_ort,
    anschrift_land_iso: p.anschrift_land_iso ?? base.anschrift_land_iso,
    email: p.email ?? base.email,
    iban: p.iban ?? base.iban,
    bic: p.bic ?? base.bic,
    leitweg_id: p.leitweg_id ?? base.leitweg_id,
    is_public_authority: p.is_public_authority ?? base.is_public_authority,
  };
}

function partnerToForm(p: BusinessPartner): EditorForm {
  return {
    partner_type: p.partner_type,
    name: p.name,
    legal_name: p.legal_name ?? "",
    rechtsform: p.rechtsform ?? "",
    ust_idnr: p.ust_idnr ?? "",
    steuernummer: p.steuernummer ?? "",
    finanzamt: p.finanzamt ?? "",
    hrb: p.hrb ?? "",
    registergericht: p.registergericht ?? "",
    anschrift_strasse: p.anschrift_strasse ?? "",
    anschrift_hausnummer: p.anschrift_hausnummer ?? "",
    anschrift_plz: p.anschrift_plz ?? "",
    anschrift_ort: p.anschrift_ort ?? "",
    anschrift_land_iso: p.anschrift_land_iso ?? "DE",
    email: p.email ?? "",
    telefon: p.telefon ?? "",
    iban: p.iban ?? "",
    bic: p.bic ?? "",
    is_public_authority: p.is_public_authority,
    leitweg_id: p.leitweg_id ?? "",
    preferred_invoice_format: p.preferred_invoice_format,
    peppol_id: p.peppol_id ?? "",
    zahlungsziel_tage:
      p.zahlungsziel_tage != null ? String(p.zahlungsziel_tage) : "",
    skonto_prozent: p.skonto_prozent != null ? String(p.skonto_prozent) : "",
    skonto_tage: p.skonto_tage != null ? String(p.skonto_tage) : "",
    standard_erloeskonto: p.standard_erloeskonto ?? "",
    standard_aufwandskonto: p.standard_aufwandskonto ?? "",
    is_active: p.is_active,
    notes: p.notes ?? "",
  };
}

type PartnerPayload = Parameters<typeof createBusinessPartner>[0];

function toApi(form: EditorForm, clientId: string, companyId: string): PartnerPayload {
  const toNum = (s: string): number | null => {
    const t = s.trim();
    if (!t) return null;
    const n = Number(t);
    return Number.isFinite(n) ? n : null;
  };
  return {
    company_id: companyId,
    client_id: clientId,
    partner_type: form.partner_type,
    name: form.name.trim(),
    legal_name: form.legal_name.trim() || null,
    rechtsform: form.rechtsform.trim() || null,
    ust_idnr: form.ust_idnr.trim() || null,
    steuernummer: form.steuernummer.trim() || null,
    finanzamt: form.finanzamt.trim() || null,
    hrb: form.hrb.trim() || null,
    registergericht: form.registergericht.trim() || null,
    anschrift_strasse: form.anschrift_strasse.trim() || null,
    anschrift_hausnummer: form.anschrift_hausnummer.trim() || null,
    anschrift_plz: form.anschrift_plz.trim() || null,
    anschrift_ort: form.anschrift_ort.trim() || null,
    anschrift_land_iso: form.anschrift_land_iso.trim().toUpperCase() || null,
    email: form.email.trim() || null,
    telefon: form.telefon.trim() || null,
    iban: form.iban.replace(/\s+/g, "").toUpperCase() || null,
    bic: form.bic.trim().toUpperCase() || null,
    is_public_authority: form.is_public_authority,
    leitweg_id: form.leitweg_id.trim() || null,
    preferred_invoice_format: form.preferred_invoice_format,
    peppol_id: form.peppol_id.trim() || null,
    verrechnungs_partner_id: null,
    zahlungsziel_tage: toNum(form.zahlungsziel_tage),
    skonto_prozent: toNum(form.skonto_prozent),
    skonto_tage: toNum(form.skonto_tage),
    standard_erloeskonto: form.standard_erloeskonto.trim() || null,
    standard_aufwandskonto: form.standard_aufwandskonto.trim() || null,
    is_active: form.is_active,
    notes: form.notes.trim() || null,
  };
}

export function PartnerEditor({
  mode,
  partnerId,
  defaultType,
  clientId,
  companyId,
  prefill,
  onSaved,
  onCancel,
}: PartnerEditorProps) {
  const [form, setForm] = useState<EditorForm>(() =>
    applyPrefill(emptyForm(defaultType), prefill)
  );
  const [loaded, setLoaded] = useState<BusinessPartner | null>(null);
  const [ustFormat, setUstFormat] = useState<string | null>(null);
  const [ibanError, setIbanError] = useState<string | null>(null);
  const [leitwegError, setLeitwegError] = useState<string | null>(null);
  const [duplicates, setDuplicates] = useState<DuplicateCheckResult | null>(
    null
  );
  const [hardError, setHardError] = useState<string | null>(null);
  const [ignoreSoftWarnings, setIgnoreSoftWarnings] = useState(false);
  const [saving, setSaving] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [lastVerifyStatus, setLastVerifyStatus] =
    useState<UstIdVerificationStatus | null>(null);
  const [lastVerifyDetail, setLastVerifyDetail] = useState<string | null>(null);
  const [lastVerifySource, setLastVerifySource] =
    useState<UstIdVerificationSource | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Edit-Mode: Partner laden
  useQuery({
    queryKey: ["business_partner", partnerId],
    enabled: mode === "edit" && !!partnerId,
    queryFn: async () => {
      if (!partnerId) return null;
      const p = await getBusinessPartner(partnerId);
      if (p) {
        setForm(partnerToForm(p));
        setLoaded(p);
      }
      return p;
    },
  });

  // Partner-Liste fuer DuplicateWarningBanner-Auswahl (Name + Nr. Display)
  const partnersQ = useQuery({
    queryKey: ["business_partners", "all_active", clientId],
    queryFn: () =>
      listBusinessPartners({ clientId, activeOnly: false }),
  });
  const allPartners = partnersQ.data ?? [];

  // Verifikations-Historie (Edit-Mode)
  const verificationsQ = useQuery({
    queryKey: ["ustid_verifications_partner", partnerId],
    enabled: mode === "edit" && !!partnerId,
    queryFn: () =>
      partnerId ? getVerificationsForPartner(partnerId) : Promise.resolve([]),
  });
  const latestVerification =
    verificationsQ.data && verificationsQ.data.length > 0
      ? verificationsQ.data[0]
      : null;
  const badgeStatus: UstIdVerificationStatus | null =
    lastVerifyStatus ?? latestVerification?.verification_status ?? null;
  const badgeDetail =
    lastVerifyDetail ?? latestVerification?.error_message ?? null;
  const badgeAt = latestVerification?.created_at ?? null;
  const badgeSource: UstIdVerificationSource | null =
    lastVerifySource ?? latestVerification?.verification_source ?? null;

  // Live-Duplicate-Check (500 ms)
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      try {
        const input = toApi(form, clientId, companyId);
        const r = await checkDuplicatesForInput({
          ...input,
          excludePartnerId: loaded?.id,
        });
        setDuplicates(r);
      } catch {
        setDuplicates(null);
      }
    }, 500);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [form, clientId, companyId, loaded?.id]);

  // Reset Override bei Form-Aenderung
  useEffect(() => {
    setIgnoreSoftWarnings(false);
  }, [form]);

  function set<K extends keyof EditorForm>(k: K, v: EditorForm[K]) {
    setForm((f) => {
      const next = { ...f, [k]: v };
      // Partner-Type-Switch: ungueltige Nummer-Felder clearen.
      // Hier kein direktes Clear in Form (Nummern werden erst bei
      // createBusinessPartner durch next_*_nummer neu vergeben);
      // Status-Toast informiert den User.
      return next;
    });
    if (k === "partner_type") {
      const t = v as BusinessPartnerType;
      if (t === "debitor") {
        toast.info("Typ 'Debitor' — Kreditor-Nummer wird beim Speichern ignoriert.");
      } else if (t === "kreditor") {
        toast.info("Typ 'Kreditor' — Debitor-Nummer wird beim Speichern ignoriert.");
      }
    }
  }

  function onUstBlur() {
    const t = form.ust_idnr.trim();
    if (!t) {
      setUstFormat(null);
      return;
    }
    const r = validateUstIdnrFormat(t);
    setUstFormat(r.valid ? null : r.error ?? "Format ungültig");
  }

  function onIbanBlur() {
    const t = form.iban.trim();
    if (!t) {
      setIbanError(null);
      return;
    }
    const r = validateIban(t);
    setIbanError(r.valid ? null : r.error ?? "IBAN ungültig");
  }

  function onLeitwegBlur() {
    const t = form.leitweg_id.trim();
    if (!t) {
      setLeitwegError(null);
      return;
    }
    const r = validateLeitwegId(t);
    setLeitwegError(r.valid ? null : r.error ?? "Leitweg-ID ungültig");
  }

  const saveDisabled = useMemo(() => {
    if (!form.name.trim()) return true;
    if (form.is_public_authority && !form.leitweg_id.trim()) return true;
    if (ustFormat || ibanError || leitwegError) return true;
    return false;
  }, [form, ustFormat, ibanError, leitwegError]);

  const hasSoftWarnings = (duplicates?.softWarnings.length ?? 0) > 0;
  const blockedBySoftWarnings = hasSoftWarnings && !ignoreSoftWarnings;

  async function doSave() {
    setSaving(true);
    setHardError(null);
    try {
      const payload = toApi(form, clientId, companyId);
      const saved =
        mode === "create"
          ? await createBusinessPartner(payload)
          : await updateBusinessPartner(partnerId!, payload);
      toast.success(
        mode === "create" ? "Partner angelegt." : "Partner aktualisiert."
      );
      onSaved(saved);
    } catch (err) {
      if (err instanceof DuplicatePartnerError) {
        const msgs = err.result.hardBlocks
          .map((b) => b.message)
          .join(" · ");
        setHardError(msgs || "Duplikat-Konflikt");
      } else {
        setHardError((err as Error).message);
      }
    } finally {
      setSaving(false);
    }
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    await doSave();
  }

  async function handleVerify() {
    if (!loaded) {
      toast.error("Partner muss erst gespeichert werden.");
      return;
    }
    setVerifying(true);
    setLastVerifyStatus(null);
    setLastVerifyDetail(null);
    setLastVerifySource(null);
    try {
      const v = await verifyUstIdnrForPartner(loaded.id);
      setLastVerifyStatus(v.verification_status);
      setLastVerifyDetail(v.error_message ?? null);
      setLastVerifySource(v.verification_source ?? null);
      // Schicht (b): verification_status auswerten
      switch (v.verification_status) {
        case "VALID":
          toast.success("Gültig bei VIES bestätigt");
          break;
        case "INVALID":
          toast.error("VIES: Nicht gültig");
          break;
        case "PENDING":
          toast.info(
            "Prüfung läuft — bitte später erneut laden"
          );
          break;
        case "SERVICE_UNAVAILABLE":
          toast.error(
            "VIES-Dienst zurzeit nicht erreichbar. Erneut versuchen."
          );
          break;
        case "ERROR":
          toast.error(
            `Technischer Fehler — Details: ${v.error_message ?? "unbekannt"}`
          );
          break;
      }
      verificationsQ.refetch();
    } catch (err) {
      // Schicht (a): Exception
      toast.error(
        `Verifikation konnte nicht gestartet werden: ${(err as Error).message}`
      );
    } finally {
      setVerifying(false);
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="partner-editor-title"
      data-testid="partner-editor-dialog"
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.35)",
        display: "flex",
        justifyContent: "center",
        alignItems: "flex-start",
        padding: 40,
        zIndex: 1000,
        overflowY: "auto",
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onCancel();
      }}
    >
      <form
        onSubmit={onSubmit}
        data-testid="partner-form"
        style={{
          background: "var(--surface, #fff)",
          borderRadius: 8,
          maxWidth: 900,
          width: "100%",
          boxShadow: "0 10px 40px rgba(0,0,0,0.3)",
          padding: 20,
          display: "flex",
          flexDirection: "column",
          gap: 12,
        }}
      >
        <header
          style={{ display: "flex", alignItems: "center", gap: 8 }}
        >
          <h2 id="partner-editor-title" style={{ margin: 0, flex: 1 }}>
            {mode === "create" ? "Neuer Partner" : `Partner bearbeiten: ${form.name}`}
          </h2>
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={onCancel}
            data-testid="btn-cancel"
            aria-label="Abbrechen"
          >
            <X size={16} />
          </button>
        </header>

        <Section title="Identität">
          <Field label="Typ" required>
            <select
              value={form.partner_type}
              onChange={(e) =>
                set("partner_type", e.target.value as BusinessPartnerType)
              }
              data-testid="sel-partner-type"
            >
              <option value="debitor">Debitor (Kunde)</option>
              <option value="kreditor">Kreditor (Lieferant)</option>
              <option value="both">Beide (bilateral)</option>
            </select>
          </Field>
          <Field label="Name" required>
            <input
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              data-testid="inp-name"
              required
            />
          </Field>
          <Field label="Rechtsname">
            <input
              value={form.legal_name}
              onChange={(e) => set("legal_name", e.target.value)}
            />
          </Field>
          <Field label="Rechtsform">
            <input
              value={form.rechtsform}
              onChange={(e) => set("rechtsform", e.target.value)}
              placeholder="GmbH, AG, e. K., …"
            />
          </Field>
        </Section>

        <Section title="Steuer">
          <Field
            label="USt-IdNr"
            hint="Strukturcheck on-blur · VIES-Prüfung via Button"
            error={ustFormat}
          >
            <input
              value={form.ust_idnr}
              onChange={(e) => set("ust_idnr", e.target.value)}
              onBlur={onUstBlur}
              placeholder="DE123456789"
              data-testid="inp-ust-idnr"
            />
          </Field>
          <Field label="Steuernummer">
            <input
              value={form.steuernummer}
              onChange={(e) => set("steuernummer", e.target.value)}
            />
          </Field>
          <Field label="Finanzamt">
            <input
              value={form.finanzamt}
              onChange={(e) => set("finanzamt", e.target.value)}
            />
          </Field>
          <Field label="HRB">
            <input
              value={form.hrb}
              onChange={(e) => set("hrb", e.target.value)}
              placeholder="HRB 12345"
            />
          </Field>
          <Field label="Registergericht">
            <input
              value={form.registergericht}
              onChange={(e) => set("registergericht", e.target.value)}
            />
          </Field>
          {mode === "edit" && loaded?.ust_idnr && (
            <div style={{ gridColumn: "1 / -1" }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  flexWrap: "wrap",
                }}
              >
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={handleVerify}
                  disabled={verifying || !!ustFormat}
                  data-testid="btn-vies-verify"
                >
                  <BadgeCheck size={14} />
                  {verifying ? " Prüfe …" : " USt-IdNr via VIES prüfen"}
                </button>
                <UstIdnrStatusBadge
                  status={badgeStatus}
                  lastCheckedAt={badgeAt}
                  errorDetail={badgeDetail}
                  source={badgeSource}
                  testIdSuffix="editor"
                />
              </div>
              <VerificationHistory
                entries={(verificationsQ.data ?? []).slice(0, 5)}
              />
            </div>
          )}
        </Section>

        <Section title="Anschrift">
          <Field label="Straße">
            <input
              value={form.anschrift_strasse}
              onChange={(e) => set("anschrift_strasse", e.target.value)}
            />
          </Field>
          <Field label="Hausnummer">
            <input
              value={form.anschrift_hausnummer}
              onChange={(e) => set("anschrift_hausnummer", e.target.value)}
            />
          </Field>
          <Field label="PLZ">
            <input
              value={form.anschrift_plz}
              onChange={(e) => set("anschrift_plz", e.target.value)}
              data-testid="inp-plz"
            />
          </Field>
          <Field label="Ort">
            <input
              value={form.anschrift_ort}
              onChange={(e) => set("anschrift_ort", e.target.value)}
            />
          </Field>
          <Field label="Land (ISO)">
            <input
              value={form.anschrift_land_iso}
              onChange={(e) =>
                set("anschrift_land_iso", e.target.value.toUpperCase())
              }
              maxLength={2}
            />
          </Field>
        </Section>

        <Section title="Bank">
          <Field label="IBAN" error={ibanError}>
            <input
              value={form.iban}
              onChange={(e) => set("iban", e.target.value)}
              onBlur={onIbanBlur}
              placeholder="DE89 3704 0044 0532 0130 00"
              data-testid="inp-iban"
            />
          </Field>
          <Field label="BIC">
            <input
              value={form.bic}
              onChange={(e) => set("bic", e.target.value.toUpperCase())}
              placeholder="COBADEFFXXX"
            />
          </Field>
        </Section>

        <Section title="E-Rechnung">
          <Field label="Bevorzugtes Format">
            <select
              value={form.preferred_invoice_format}
              onChange={(e) =>
                set(
                  "preferred_invoice_format",
                  e.target.value as PreferredInvoiceFormat
                )
              }
            >
              <option value="pdf">PDF</option>
              <option value="zugferd">ZUGFeRD</option>
              <option value="xrechnung">XRechnung</option>
              <option value="peppol">PEPPOL</option>
            </select>
          </Field>
          <Field label="Öffentlicher Auftraggeber (B2G)">
            <label
              style={{ display: "flex", alignItems: "center", gap: 6 }}
            >
              <input
                type="checkbox"
                checked={form.is_public_authority}
                onChange={(e) => set("is_public_authority", e.target.checked)}
                data-testid="chk-public"
              />
              ja — Leitweg-ID erforderlich
            </label>
          </Field>
          <Field
            label="Leitweg-ID"
            hint={
              form.is_public_authority ? "Pflicht bei B2G-Kunden" : undefined
            }
            error={leitwegError}
          >
            <input
              value={form.leitweg_id}
              onChange={(e) =>
                set("leitweg_id", e.target.value.toUpperCase())
              }
              onBlur={onLeitwegBlur}
              data-testid="inp-leitweg"
              placeholder="991-01001-43"
            />
          </Field>
          <Field label="PEPPOL-ID">
            <input
              value={form.peppol_id}
              onChange={(e) => set("peppol_id", e.target.value)}
            />
          </Field>
        </Section>

        <Section title="Zahlung">
          <Field label="Zahlungsziel (Tage)">
            <input
              type="number"
              min={0}
              max={365}
              value={form.zahlungsziel_tage}
              onChange={(e) => set("zahlungsziel_tage", e.target.value)}
            />
          </Field>
          <Field label="Skonto %">
            <input
              type="number"
              step="0.01"
              min={0}
              max={99.99}
              value={form.skonto_prozent}
              onChange={(e) => set("skonto_prozent", e.target.value)}
            />
          </Field>
          <Field label="Skonto-Tage">
            <input
              type="number"
              min={0}
              max={90}
              value={form.skonto_tage}
              onChange={(e) => set("skonto_tage", e.target.value)}
            />
          </Field>
        </Section>

        <Section title="Konten">
          <Field label="Standard-Erlöskonto">
            <input
              value={form.standard_erloeskonto}
              onChange={(e) => set("standard_erloeskonto", e.target.value)}
              placeholder="8400"
            />
          </Field>
          <Field label="Standard-Aufwandskonto">
            <input
              value={form.standard_aufwandskonto}
              onChange={(e) => set("standard_aufwandskonto", e.target.value)}
            />
          </Field>
          <Field label="Status">
            <label
              style={{ display: "flex", alignItems: "center", gap: 6 }}
            >
              <input
                type="checkbox"
                checked={form.is_active}
                onChange={(e) => set("is_active", e.target.checked)}
              />
              aktiv
            </label>
          </Field>
          <Field label="Notizen">
            <textarea
              value={form.notes}
              onChange={(e) => set("notes", e.target.value)}
              rows={3}
            />
          </Field>
        </Section>

        {/* Soft-Warnings: direkt ueber den Save-Buttons */}
        <DuplicateWarningBanner
          result={duplicates}
          partners={allPartners}
          onOpenPartner={(id) => {
            toast.info(`Hinweis: Partner ${id} separat öffnen.`);
          }}
          onAbort={onCancel}
          onIgnoreAndSave={() => {
            setIgnoreSoftWarnings(true);
            void doSave();
          }}
        />

        {hardError && (
          <div
            data-testid="hard-block-error"
            role="alert"
            style={{
              padding: 10,
              border: "1px solid #e67373",
              borderLeft: "4px solid #a32020",
              background: "#fdecec",
              color: "#a32020",
              borderRadius: 4,
            }}
          >
            <strong>Speichern blockiert:</strong> {hardError}
          </div>
        )}

        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <button
            type="button"
            className="btn btn-ghost"
            onClick={onCancel}
            data-testid="btn-dialog-cancel"
          >
            Abbrechen
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={saveDisabled || saving || blockedBySoftWarnings}
            data-testid="btn-save"
          >
            {saving
              ? "Speichere …"
              : mode === "create"
                ? "Anlegen"
                : "Speichern"}
          </button>
        </div>
      </form>
    </div>
  );
}

function VerificationHistory({
  entries,
}: {
  entries: Awaited<ReturnType<typeof getVerificationsForPartner>>;
}) {
  if (entries.length === 0) return null;
  return (
    <div
      style={{ marginTop: 8, fontSize: "0.85rem" }}
      data-testid="verification-history"
    >
      <strong>Letzte Prüfungen:</strong>
      <ul style={{ margin: "4px 0 0 20px" }}>
        {entries.map((v) => (
          <li key={v.id}>
            {v.created_at.slice(0, 16).replace("T", " ")} —{" "}
            <span className="mono">{v.verification_status}</span>
            {v.vies_trader_name ? ` · ${v.vies_trader_name}` : ""}
          </li>
        ))}
      </ul>
    </div>
  );
}

function Section({ title, children }: PropsWithChildren<{ title: string }>) {
  return (
    <section
      className="card"
      style={{ padding: 12 }}
    >
      <h3 style={{ fontSize: "0.9rem", margin: "0 0 8px" }}>{title}</h3>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: 10,
        }}
      >
        {children}
      </div>
    </section>
  );
}

function Field({
  label,
  children,
  hint,
  error,
  required,
}: PropsWithChildren<{
  label: string;
  hint?: string;
  error?: string | null;
  required?: boolean;
}>) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <span style={{ fontSize: "0.82rem", color: "var(--muted, #555)" }}>
        {label}
        {required ? " *" : ""}
      </span>
      {children}
      {hint && !error && (
        <small style={{ color: "var(--muted)" }}>{hint}</small>
      )}
      {error && (
        <small style={{ color: "#a32020" }}>{error}</small>
      )}
    </label>
  );
}
