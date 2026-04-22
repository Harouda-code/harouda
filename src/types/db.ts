export type Kategorie = "aktiva" | "passiva" | "aufwand" | "ertrag";
export type SKR = "SKR03" | "SKR04";

export type Account = {
  id: string;
  konto_nr: string;
  bezeichnung: string;
  kategorie: Kategorie;
  ust_satz: number | null;
  skr: SKR;
  is_active: boolean;
  created_at?: string;
  /** Seit Migration 0019 auf DB vorhanden, seit Phase 3 in TS geführt.
   *  Tag-Format ab Phase 3 / Schritt 6: `"<anlage-id>:<feld>"`
   *  (z. B. `"anlage-g:umsaetze"`). Mehrere Tags pro Konto möglich. */
  tags?: string[] | null;
  /** Migration 0019 — optional, meist `null`. */
  skr_version?: string | null;
  /** Migration 0019 — default `false`. Konten mit saisonalem
   *  Saldowechsel (Aktiva↔Passiva). */
  is_wechselkonto?: boolean;
};

export type JournalStatus = "gebucht" | "entwurf";

export type JournalEntry = {
  id: string;
  datum: string;
  beleg_nr: string;
  beschreibung: string;
  soll_konto: string;
  haben_konto: string;
  betrag: number;
  ust_satz: number | null;
  status: JournalStatus;
  client_id: string | null;
  skonto_pct: number | null;
  skonto_tage: number | null;
  /** Counterparty name for OPOS / Mahnwesen (optional). */
  gegenseite: string | null;
  /** Due date (ISO YYYY-MM-DD). If null, datum + 14 days is assumed. */
  faelligkeit: string | null;
  version: number;
  created_at?: string;
  updated_at?: string;
  /** GoBD: Lifecycle. "active" = normal, "reversed" = ursprünglicher Beleg wurde storniert,
   *  "reversal" = Storno-Gegenbuchung, "correction" = korrigierte Neu-Buchung. */
  storno_status?: JournalStornoStatus;
  /** Referenziert den Original-Beleg (bei reversal/correction). */
  parent_entry_id?: string | null;
  /** Wurde nach Festschreibe-Datum gesperrt (keine Änderung mehr erlaubt). */
  locked_at?: string | null;
  /** Hash-Kette (GoBD): SHA-256 der kanonischen Buchungsdaten inkl. prev_hash. */
  entry_hash?: string | null;
  /** Vorgänger-Hash in der Kette pro company_id. */
  prev_hash?: string | null;
  /** Optionaler Kostenstellen-Code (Reporting-Dimension, nicht im Hash). */
  kostenstelle?: string | null;
  /** Optionaler Kostenträger-Code (Reporting-Dimension, nicht im Hash). */
  kostentraeger?: string | null;
  /** Gruppiert atomar gebuchte Stapel (Lohn-Läufe, Import-Batches).
   *  Null für Einzel-Buchungen aus `createEntry`. Siehe Migration 0027. */
  batch_id?: string | null;
};

export type CostCenter = {
  id: string;
  company_id: string | null;
  code: string;
  name: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

/** Kostenträger (Cost Carrier) — „Wofür kostet es?". Projekt, Produkt, Auftrag.
 *  Zweite Reporting-Dimension neben CostCenter („Wo kostet es?"). Siehe
 *  Migration 0024. */
export type CostCarrier = {
  id: string;
  company_id: string | null;
  code: string;
  name: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

/** AfA-Methoden nach deutschem Steuerrecht. Teil 1 implementiert nur
 *  'linear' (§ 7 Abs. 1 EStG). Die anderen Werte sind Schema-Platzhalter
 *  für Teil 2 (Sprint 7). */
export type AfaMethode = "linear" | "degressiv" | "gwg_sofort" | "sammelposten";

/** Anlagegut — Stammdatensatz im Anlagenverzeichnis. Migration 0025. */
export type Anlagegut = {
  id: string;
  company_id: string | null;
  /** Mandant-FK (ab Migration 0026). Nullable bis Backfill. */
  client_id?: string | null;
  inventar_nr: string;
  bezeichnung: string;
  anschaffungsdatum: string;
  anschaffungskosten: number;
  nutzungsdauer_jahre: number;
  afa_methode: AfaMethode;
  konto_anlage: string;
  konto_afa: string;
  /** Optional: SKR03-Konto für kumulierte Wertberichtigung (indirekte
   *  Brutto-Methode). null → AfA bucht direkt auf konto_anlage
   *  (direkte Netto-Methode, SKR03-Standard). */
  konto_abschreibung_kumuliert: string | null;
  aktiv: boolean;
  abgangsdatum: string | null;
  abgangserloes: number | null;
  notizen: string | null;
  parent_id: string | null;
  created_at: string;
  updated_at: string;
};

/** Jahres-AfA-Historie pro Anlagegut. Migration 0025. Nicht Teil der
 *  Journal-Hash-Kette — referenziert optional den erzeugten
 *  Journal-Eintrag. */
export type AfaBuchung = {
  id: string;
  anlage_id: string;
  jahr: number;
  afa_betrag: number;
  restbuchwert: number;
  journal_entry_id: string | null;
  created_at: string;
};

export type ReceiptRequestStatus = "open" | "received" | "cancelled";

export type ReceiptRequest = {
  id: string;
  company_id: string | null;
  /** Mandant-FK (ab Migration 0026). */
  client_id?: string | null;
  requested_by: string | null;
  requested_at: string;
  bank_datum: string;
  bank_betrag: number;
  bank_verwendung: string | null;
  bank_gegenseite: string | null;
  bank_iban: string | null;
  recipient_email: string | null;
  recipient_name: string | null;
  notes: string | null;
  status: ReceiptRequestStatus;
  received_at: string | null;
  linked_journal_entry_id: string | null;
};

export type UstIdStatus =
  | "unchecked"
  | "valid"
  | "invalid"
  | "error"
  | "partial";

/** Funktion einer natürlichen Person in einem Mandanten-Unternehmen.
 *  Jahresabschluss-E1 / Schritt 1 / Migration 0030. */
export type Geschaeftsfuehrer = {
  name: string;
  funktion: "geschaeftsfuehrer" | "vorstand" | "prokurist";
  /** ISO-Datum der Bestellung (optional). */
  bestellt_am?: string;
};

export type Client = {
  id: string;
  mandant_nr: string;
  name: string;
  steuernummer: string | null;
  ust_id: string | null;
  iban: string | null;
  ust_id_status: UstIdStatus;
  ust_id_checked_at: string | null;
  last_daten_holen_at: string | null;
  created_at?: string;
  /** Jahresabschluss-E1 (Migration 0030): Rechtsform nach HGB-Taxonomie
   *  6.8. Null für Bestand — Closing-Validator blockt bei NULL. */
  rechtsform?:
    | import("../domain/ebilanz/hgbTaxonomie68").Rechtsform
    | null;
  hrb_nummer?: string | null;
  hrb_gericht?: string | null;
  gezeichnetes_kapital?: number | null;
  /** Liste der Organe (Geschäftsführer/Vorstand/Prokuristen). */
  geschaeftsfuehrer?: Geschaeftsfuehrer[] | null;
  /** MM-DD — Beginn des Wirtschaftsjahres (Default "01-01"). */
  wirtschaftsjahr_beginn?: string;
  /** MM-DD — Ende des Wirtschaftsjahres (Default "12-31"). */
  wirtschaftsjahr_ende?: string;
  // --- Sprint 18 (Migration 0033) — Anschrift (Expand-Phase, NULLABLE).
  anschrift_strasse?: string | null;
  anschrift_hausnummer?: string | null;
  anschrift_plz?: string | null;
  anschrift_ort?: string | null;
  /** ISO 3166-1 alpha-2. DB-Default 'DE'. */
  anschrift_land?: string | null;
};

/** Bank-Reconciliation-Match-Record (Migration 0031, Sprint 16).
 *  GoBD Rz. 45 Bank-Journal-Abgleich-Log. */
export type BankReconMatchStatus =
  | "matched"
  | "ignored"
  | "pending_review"
  | "auto_matched";

export type BankReconciliationMatch = {
  id: string;
  company_id: string | null;
  client_id: string;
  bank_transaction_id: string;
  bank_transaction_fingerprint: string;
  journal_entry_id: string | null;
  match_status: BankReconMatchStatus;
  match_confidence: number | null;
  matched_at: string;
  matched_by_user_id: string | null;
  notiz: string | null;
  created_at: string;
  updated_at: string;
};

export type Document = {
  id: string;
  /** Mandant-FK (ab Migration 0026). Nullable bis Backfill. */
  client_id?: string | null;
  file_name: string;
  file_path: string | null;
  mime_type: string;
  size_bytes: number;
  beleg_nr: string | null;
  ocr_text: string | null;
  journal_entry_id: string | null;
  uploaded_at: string;
};

// --- Sprint 17 Inventur-Typen (Migration 0034) --------------------------
export type InventurSessionStatus = "offen" | "abgeschlossen" | "gebucht";
export type InventurAnlageStatus =
  | "vorhanden"
  | "verlust"
  | "schaden"
  | "nicht_geprueft";

export type InventurSession = {
  id: string;
  company_id: string | null;
  client_id: string;
  stichtag: string; // YYYY-MM-DD
  jahr: number;
  status: InventurSessionStatus;
  anlagen_inventur_abgeschlossen: boolean;
  bestands_inventur_abgeschlossen: boolean;
  notiz: string | null;
  erstellt_von: string | null;
  erstellt_am: string;
  abgeschlossen_am: string | null;
  created_at: string;
  updated_at: string;
};

export type InventurAnlage = {
  id: string;
  session_id: string;
  anlage_id: string;
  status: InventurAnlageStatus;
  notiz: string | null;
  abgangs_buchung_id: string | null;
  geprueft_am: string | null;
  geprueft_von: string | null;
  created_at: string;
  updated_at: string;
};

export type InventurBestand = {
  id: string;
  session_id: string;
  bezeichnung: string;
  vorrat_konto_nr: string;
  anfangsbestand: number;
  endbestand: number;
  niederstwert_aktiv: boolean;
  niederstwert_begruendung: string | null;
  inventurliste_document_id: string | null;
  bestandsveraenderungs_buchung_id: string | null;
  notiz: string | null;
  created_at: string;
  updated_at: string;
};

export type DunningStage = 1 | 2 | 3;

export type DunningRecord = {
  id: string;
  /** Mandant-FK (ab Migration 0026). */
  client_id?: string | null;
  beleg_nr: string;
  stage: DunningStage;
  gegenseite: string;
  issued_at: string;
  /** Offener Betrag zum Zeitpunkt der Mahnung */
  betrag_offen: number;
  /** Mahngebühr */
  fee: number;
  /** Berechnete Verzugszinsen */
  verzugszinsen: number;
  /** Neue Zahlungsfrist, die in der Mahnung angegeben wird */
  faelligkeit_neu: string;
  /** Audit: Ur-Fälligkeit und Überfälligkeits-Tage */
  faelligkeit_alt: string;
  ueberfaellig_tage_bei_mahnung: number;
};

export type AuditAction =
  | "create"
  | "update"
  | "delete"
  | "import"
  | "export"
  | "login"
  | "logout"
  | "signup"
  | "reverse"
  | "correct"
  | "access";

export type AuditEntity =
  | "journal_entry"
  | "account"
  | "client"
  | "document"
  | "settings"
  | "auth"
  | "auditor_session"
  | "verfahrensdoku"
  | "beleg";

export type AuditLogEntry = {
  id: string;
  at: string;
  actor: string | null; // user email
  action: AuditAction;
  entity: AuditEntity;
  entity_id: string | null;
  summary: string;
  before: unknown | null;
  after: unknown | null;
  /** Browser-User-Agent zum Zeitpunkt des Ereignisses (optional). */
  user_agent?: string | null;
  /** SHA-256 of the previous entry's hash (or the all-zero genesis). */
  prev_hash: string;
  /** SHA-256 of (prev_hash || canonical JSON of this row without `hash`). */
  hash: string;
};

export type JournalStornoStatus =
  | "active"
  | "reversed"
  | "reversal"
  | "correction";

export type InvoiceArchiveSource = "zugferd-import" | "upload" | "legacy";
export type InvoiceXmlFormat = "cii" | "ubl" | "xrechnung" | "unknown";

export type InvoiceArchiveEntry = {
  id: string;
  company_id: string | null;
  /** Mandant-FK (ab Migration 0026). */
  client_id?: string | null;
  uploaded_at: string;
  uploader_user_id: string | null;
  original_filename: string;
  mime_type: string;
  size_bytes: number;
  content_sha256: string;
  /** Nur eines der beiden wird gefüllt. */
  content_b64: string | null;
  storage_path: string | null;
  source: InvoiceArchiveSource;
  retention_until: string; // YYYY-MM-DD
  journal_entry_id: string | null;
  notes: string | null;
};

export type InvoiceXmlArchiveEntry = {
  id: string;
  archive_id: string;
  company_id: string | null;
  /** Mandant-FK (ab Migration 0026). */
  client_id?: string | null;
  format: InvoiceXmlFormat;
  profile: string | null;
  invoice_number: string | null;
  issue_date: string | null;
  due_date: string | null;
  supplier_name: string | null;
  supplier_vat_id: string | null;
  buyer_name: string | null;
  currency: string | null;
  net_total: number | null;
  tax_total: number | null;
  grand_total: number | null;
  xml_content: string;
  xml_sha256: string;
  parsed_json: unknown | null;
  created_at: string;
};

export type Steuerklasse = "I" | "II" | "III" | "IV" | "V" | "VI";
export type Beschaeftigungsart =
  | "vollzeit"
  | "teilzeit"
  | "minijob"
  | "midijob"
  | "ausbildung";

export type Employee = {
  id: string;
  company_id: string | null;
  /** Mandant-FK (ab Migration 0026). Nullable bis Backfill. */
  client_id?: string | null;
  personalnummer: string;
  vorname: string;
  nachname: string;
  steuer_id: string | null;
  sv_nummer: string | null;
  steuerklasse: Steuerklasse;
  kinderfreibetraege: number;
  konfession: string | null;
  bundesland: string | null;
  einstellungsdatum: string | null;
  austrittsdatum: string | null;
  beschaeftigungsart: Beschaeftigungsart;
  wochenstunden: number | null;
  bruttogehalt_monat: number | null;
  stundenlohn: number | null;
  krankenkasse: string | null;
  zusatzbeitrag_pct: number | null;
  privat_versichert: boolean;
  pv_kinderlos: boolean;
  pv_kinder_anzahl: number;
  iban: string | null;
  bic: string | null;
  kontoinhaber: string | null;
  notes: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  // --- Sprint 18 (Migration 0032) — SV-Stammdaten (Expand-Phase). ------
  /** ISO 3166-1 alpha-2 (z. B. "DE") oder DEUeV-Schluessel (3-stellig). */
  staatsangehoerigkeit?: string | null;
  geburtsname?: string | null;
  geburtsort?: string | null;
  /** 9-stellig nach BA-Verzeichnis 2010. */
  taetigkeitsschluessel?: string | null;
  /** Standard false (Standardfall = nur eine Beschaeftigung). */
  mehrfachbeschaeftigung?: boolean | null;
  /** 8-stellige Betriebsnummer der Krankenkasse. */
  einzugsstelle_bbnr?: string | null;
  anschrift_strasse?: string | null;
  anschrift_hausnummer?: string | null;
  anschrift_plz?: string | null;
  anschrift_ort?: string | null;
  /** ISO 3166-1 alpha-2. DB-Default 'DE'. */
  anschrift_land?: string | null;
};

export type AdvisorNote = {
  id: string;
  company_id: string | null;
  /** Mandant-FK (ab Migration 0026). */
  client_id?: string | null;
  entity_type: string;
  entity_id: string;
  author_user_id: string | null;
  author_email: string | null;
  body: string;
  created_at: string;
};

export type SupplierPreference = {
  id: string;
  company_id: string | null;
  /** Mandant-FK (ab Migration 0026). */
  client_id?: string | null;
  supplier_key: string;
  display_name: string;
  soll_konto: string | null;
  haben_konto: string | null;
  usage_count: number;
  first_used_at: string;
  last_used_at: string;
};

export type ElsterFormType =
  | "ustva"
  | "ustva-quartal"
  | "euer"
  | "gewst"
  | "kst"
  | "est";

export type ElsterSubmissionStatus =
  | "draft"
  | "exported"
  | "transmitted-manually"
  | "acknowledged"
  | "rejected";

export type ElsterSubmission = {
  id: string;
  company_id: string | null;
  /** Mandant-FK (ab Migration 0026). */
  client_id?: string | null;
  created_by: string | null;
  created_at: string;
  form_type: ElsterFormType | string;
  year: number;
  period: number | null;
  label: string;
  file_sha256: string | null;
  file_bytes: number | null;
  status: ElsterSubmissionStatus;
  transfer_ticket: string | null;
  notes: string | null;
  transmitted_at: string | null;
  acknowledged_at: string | null;
};

export type AppLogLevel = "debug" | "info" | "warn" | "error";

export type AppLogEntry = {
  id: string;
  at: string;
  level: AppLogLevel;
  message: string;
  /** Beliebiger Zusatzkontext (Stack, Feature, URL, ...), JSON-serialisierbar. */
  context: Record<string, unknown> | null;
  user_id: string | null;
  company_id: string | null;
};

// ---------------------------------------------------------------------------
// Sprint 19 — business_partners + ustid_verifications
// ---------------------------------------------------------------------------

export type BusinessPartnerType = "debitor" | "kreditor" | "both";

export type PreferredInvoiceFormat =
  | "pdf"
  | "zugferd"
  | "xrechnung"
  | "peppol";

export type AufbewahrungsKategorie =
  | "ORGANISATIONSUNTERLAGE_10J"
  | "GESCHAEFTSBRIEF_6J"
  | "BUCHUNGSBELEG_8J";

export type UstIdVerificationStatus =
  | "VALID"
  | "INVALID"
  | "PENDING"
  | "SERVICE_UNAVAILABLE"
  | "ERROR";

/** Sprint 20.A.2: welche Behörde den Check ausgestellt hat. */
export type UstIdVerificationSource = "BZST" | "VIES";

export type BusinessPartner = {
  id: string;
  company_id: string;
  client_id: string;
  partner_type: BusinessPartnerType;
  debitor_nummer: number | null;
  kreditor_nummer: number | null;
  name: string;
  legal_name: string | null;
  rechtsform: string | null;
  ust_idnr: string | null;
  steuernummer: string | null;
  finanzamt: string | null;
  hrb: string | null;
  registergericht: string | null;
  anschrift_strasse: string | null;
  anschrift_hausnummer: string | null;
  anschrift_plz: string | null;
  anschrift_ort: string | null;
  anschrift_land_iso: string | null;
  email: string | null;
  telefon: string | null;
  iban: string | null;
  bic: string | null;
  is_public_authority: boolean;
  leitweg_id: string | null;
  preferred_invoice_format: PreferredInvoiceFormat;
  peppol_id: string | null;
  verrechnungs_partner_id: string | null;
  zahlungsziel_tage: number | null;
  skonto_prozent: number | null;
  skonto_tage: number | null;
  standard_erloeskonto: string | null;
  standard_aufwandskonto: string | null;
  is_active: boolean;
  notes: string | null;
  created_at: string;
  created_by: string | null;
  updated_at: string;
  updated_by: string | null;
};

export type BusinessPartnerVersion = {
  version_id: string;
  partner_id: string;
  company_id: string;
  client_id: string;
  version_number: number;
  snapshot: BusinessPartner;
  aufbewahrungs_kategorie: AufbewahrungsKategorie;
  entstehungsjahr: number;
  retention_until: string;
  retention_hold: boolean;
  retention_hold_reason: string | null;
  valid_from: string;
  valid_to: string | null;
  created_at: string;
  created_by: string | null;
  /** Sprint 20.B: Hash-Chain-Felder (Migration 0039). */
  prev_hash?: string | null;
  version_hash?: string;
  server_recorded_at?: string;
};

export type UstIdVerification = {
  id: string;
  company_id: string;
  client_id: string;
  partner_id: string | null;
  requested_ust_idnr: string;
  requester_ust_idnr: string | null;
  /** Base64-kodiert (bytea in DB). */
  raw_http_response: string | null;
  raw_http_response_headers: Record<string, string> | null;
  raw_http_request_url: string;
  vies_valid: boolean | null;
  vies_request_date: string | null;
  vies_request_identifier: string | null;
  vies_trader_name: string | null;
  vies_trader_address: string | null;
  vies_raw_parsed: unknown | null;
  verification_status: UstIdVerificationStatus;
  /** Sprint 20.A.2: 'BZST' | 'VIES'. Default vor 20.A.2 war implizit 'VIES'. */
  verification_source: UstIdVerificationSource;
  error_message: string | null;
  entstehungsjahr: number;
  retention_until: string;
  retention_hold: boolean;
  retention_hold_reason: string | null;
  created_at: string;
  created_by: string | null;
  /** Sprint 20.B: Hash-Chain-Felder (Migration 0039). */
  prev_hash?: string | null;
  verification_hash?: string;
  server_recorded_at?: string;
};

