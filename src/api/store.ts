import type {
  Account,
  AdvisorNote,
  AfaBuchung,
  Anlagegut,
  AppLogEntry,
  AuditLogEntry,
  BankReconciliationMatch,
  BusinessPartner,
  BusinessPartnerVersion,
  Client,
  CostCarrier,
  CostCenter,
  Document,
  DunningRecord,
  ElsterSubmission,
  Employee,
  InventurAnlage,
  InventurBestand,
  InventurSession,
  InvoiceArchiveEntry,
  InvoiceXmlArchiveEntry,
  JournalEntry,
  ReceiptRequest,
  SupplierPreference,
  UstIdVerification,
} from "../types/db";
import type { LohnabrechnungArchivRow } from "../domain/lohn/types";

const K_ACCOUNTS = "harouda:accounts";
const K_ENTRIES = "harouda:entries";
const K_CLIENTS = "harouda:clients";
const K_DOCUMENTS = "harouda:documents";
const K_DOC_BLOBS = "harouda:docBlobs";
const K_AUDIT = "harouda:audit";
const K_APP_LOG = "harouda:appLog";
const K_INVOICE_ARCHIVE = "harouda:invoiceArchive";
const K_INVOICE_XML_ARCHIVE = "harouda:invoiceXmlArchive";
const K_ELSTER_SUBS = "harouda:elsterSubmissions";
const K_SUPPLIER_PREFS = "harouda:supplierPrefs";
const K_ADVISOR_NOTES = "harouda:advisorNotes";
const K_EMPLOYEES = "harouda:employees";
const K_COST_CENTERS = "harouda:costCenters";
const K_COST_CARRIERS = "harouda:costCarriers";
const K_ANLAGEGUETER = "harouda:anlagegueter";
const K_AFA_BUCHUNGEN = "harouda:afaBuchungen";
const K_RECEIPT_REQUESTS = "harouda:receiptRequests";
const K_DUNNINGS = "harouda:dunnings";
const K_LOHN_ARCHIV = "harouda:lohnArchiv";
const K_BANK_RECON_MATCHES = "harouda:bankReconMatches";
const K_INVENTUR_SESSIONS = "harouda:inventurSessions";
const K_INVENTUR_ANLAGEN = "harouda:inventurAnlagen";
const K_INVENTUR_BESTAENDE = "harouda:inventurBestaende";
const K_BUSINESS_PARTNERS = "harouda-business-partners";
const K_BUSINESS_PARTNERS_VERSIONS = "harouda-business-partners-versions";
const K_USTID_VERIFICATIONS = "harouda-ustid-verifications";
const AUDIT_MAX = 2000; // keep last 2000 entries
const APP_LOG_MAX = 500; // weniger kritisch — nur jüngste Einträge

function read<T>(key: string): T[] {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T[]) : [];
  } catch {
    return [];
  }
}

function write<T>(key: string, value: T[]) {
  localStorage.setItem(key, JSON.stringify(value));
}

export const store = {
  getAccounts: () => read<Account>(K_ACCOUNTS),
  setAccounts: (v: Account[]) => write(K_ACCOUNTS, v),

  getEntries: () => read<JournalEntry>(K_ENTRIES),
  setEntries: (v: JournalEntry[]) => write(K_ENTRIES, v),

  getClients: () => read<Client>(K_CLIENTS),
  setClients: (v: Client[]) => write(K_CLIENTS, v),

  getDocuments: () => read<Document>(K_DOCUMENTS),
  setDocuments: (v: Document[]) => write(K_DOCUMENTS, v),

  getAudit: () => read<AuditLogEntry>(K_AUDIT),
  appendAudit: (entry: AuditLogEntry) => {
    const cur = read<AuditLogEntry>(K_AUDIT);
    const next = [entry, ...cur].slice(0, AUDIT_MAX);
    write(K_AUDIT, next);
  },

  getAppLog: () => read<AppLogEntry>(K_APP_LOG),
  appendAppLog: (entry: AppLogEntry) => {
    const cur = read<AppLogEntry>(K_APP_LOG);
    const next = [entry, ...cur].slice(0, APP_LOG_MAX);
    write(K_APP_LOG, next);
  },
  clearAppLog: () => write(K_APP_LOG, []),

  getInvoiceArchive: () => read<InvoiceArchiveEntry>(K_INVOICE_ARCHIVE),
  setInvoiceArchive: (v: InvoiceArchiveEntry[]) =>
    write(K_INVOICE_ARCHIVE, v),
  getInvoiceXmlArchive: () =>
    read<InvoiceXmlArchiveEntry>(K_INVOICE_XML_ARCHIVE),
  setInvoiceXmlArchive: (v: InvoiceXmlArchiveEntry[]) =>
    write(K_INVOICE_XML_ARCHIVE, v),

  getElsterSubmissions: () => read<ElsterSubmission>(K_ELSTER_SUBS),
  setElsterSubmissions: (v: ElsterSubmission[]) => write(K_ELSTER_SUBS, v),

  getSupplierPrefs: () => read<SupplierPreference>(K_SUPPLIER_PREFS),
  setSupplierPrefs: (v: SupplierPreference[]) => write(K_SUPPLIER_PREFS, v),

  getAdvisorNotes: () => read<AdvisorNote>(K_ADVISOR_NOTES),
  setAdvisorNotes: (v: AdvisorNote[]) => write(K_ADVISOR_NOTES, v),

  getEmployees: () => read<Employee>(K_EMPLOYEES),
  setEmployees: (v: Employee[]) => write(K_EMPLOYEES, v),

  getCostCenters: () => read<CostCenter>(K_COST_CENTERS),
  setCostCenters: (v: CostCenter[]) => write(K_COST_CENTERS, v),

  getCostCarriers: () => read<CostCarrier>(K_COST_CARRIERS),
  setCostCarriers: (v: CostCarrier[]) => write(K_COST_CARRIERS, v),

  getAnlagegueter: () => read<Anlagegut>(K_ANLAGEGUETER),
  setAnlagegueter: (v: Anlagegut[]) => write(K_ANLAGEGUETER, v),

  getAfaBuchungen: () => read<AfaBuchung>(K_AFA_BUCHUNGEN),
  setAfaBuchungen: (v: AfaBuchung[]) => write(K_AFA_BUCHUNGEN, v),

  getReceiptRequests: () => read<ReceiptRequest>(K_RECEIPT_REQUESTS),
  setReceiptRequests: (v: ReceiptRequest[]) =>
    write(K_RECEIPT_REQUESTS, v),

  getDunnings: () => read<DunningRecord>(K_DUNNINGS),
  setDunnings: (v: DunningRecord[]) => write(K_DUNNINGS, v),
  appendDunning: (r: DunningRecord) => {
    const cur = read<DunningRecord>(K_DUNNINGS);
    write(K_DUNNINGS, [r, ...cur]);
  },

  getLohnArchiv: () => read<LohnabrechnungArchivRow>(K_LOHN_ARCHIV),
  setLohnArchiv: (v: LohnabrechnungArchivRow[]) => write(K_LOHN_ARCHIV, v),

  getBlob: (id: string): string | null => {
    try {
      const raw = localStorage.getItem(K_DOC_BLOBS);
      const map = raw ? (JSON.parse(raw) as Record<string, string>) : {};
      return map[id] ?? null;
    } catch {
      return null;
    }
  },
  setBlob: (id: string, dataUrl: string) => {
    try {
      const raw = localStorage.getItem(K_DOC_BLOBS);
      const map = raw ? (JSON.parse(raw) as Record<string, string>) : {};
      map[id] = dataUrl;
      localStorage.setItem(K_DOC_BLOBS, JSON.stringify(map));
    } catch {
      /* storage full — skip */
    }
  },
  getBankReconMatches: () =>
    read<BankReconciliationMatch>(K_BANK_RECON_MATCHES),
  setBankReconMatches: (v: BankReconciliationMatch[]) =>
    write(K_BANK_RECON_MATCHES, v),

  getInventurSessions: () => read<InventurSession>(K_INVENTUR_SESSIONS),
  setInventurSessions: (v: InventurSession[]) =>
    write(K_INVENTUR_SESSIONS, v),
  getInventurAnlagen: () => read<InventurAnlage>(K_INVENTUR_ANLAGEN),
  setInventurAnlagen: (v: InventurAnlage[]) => write(K_INVENTUR_ANLAGEN, v),
  getInventurBestaende: () => read<InventurBestand>(K_INVENTUR_BESTAENDE),
  setInventurBestaende: (v: InventurBestand[]) =>
    write(K_INVENTUR_BESTAENDE, v),

  getBusinessPartners: () => read<BusinessPartner>(K_BUSINESS_PARTNERS),
  setBusinessPartners: (v: BusinessPartner[]) =>
    write(K_BUSINESS_PARTNERS, v),
  getBusinessPartnersVersions: () =>
    read<BusinessPartnerVersion>(K_BUSINESS_PARTNERS_VERSIONS),
  setBusinessPartnersVersions: (v: BusinessPartnerVersion[]) =>
    write(K_BUSINESS_PARTNERS_VERSIONS, v),
  getUstIdVerifications: () =>
    read<UstIdVerification>(K_USTID_VERIFICATIONS),
  setUstIdVerifications: (v: UstIdVerification[]) =>
    write(K_USTID_VERIFICATIONS, v),

  deleteBlob: (id: string) => {
    try {
      const raw = localStorage.getItem(K_DOC_BLOBS);
      const map = raw ? (JSON.parse(raw) as Record<string, string>) : {};
      delete map[id];
      localStorage.setItem(K_DOC_BLOBS, JSON.stringify(map));
    } catch {
      /* ignore */
    }
  },
};

export function uid(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}
