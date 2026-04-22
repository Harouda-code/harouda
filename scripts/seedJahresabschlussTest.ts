/**
 * Seed-Script fuer den Jahresabschluss-Wizard-Testlauf.
 *
 * Baut einen vollstaendigen Test-Mandanten "Musterfirma Jahresabschluss
 * GmbH" mit Stammdaten + Journal 2025 + Anlagen + AfA + Lohn + Bank-
 * Reconciliation + Inventur-Session. Das Ergebnis wird als
 * `scripts/seed-jahresabschluss-output.json` + self-contained
 * `scripts/seed-jahresabschluss.html` geschrieben.
 *
 * Warum kein direkter localStorage-Write: das Repo laeuft DEMO-Mode
 * im Browser via Vite. Ein Node-Script (tsx) hat keinen
 * window.localStorage. Loesung: Script shimmt localStorage in
 * einer Map und serialisiert am Ende alle `harouda:*`-Keys. Der User
 * oeffnet dann die generierte HTML-Datei einmal im Browser — sie
 * schreibt die Map in localStorage und redirectet auf den Wizard.
 *
 * Ausfuehrung:
 *   npm run seed:jahresabschluss
 */

import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { randomUUID, createHash } from "node:crypto";

// ──────────────────────────────────────────────────────────────────
// localStorage-Shim (Node → Map)
// ──────────────────────────────────────────────────────────────────

const storageMap = new Map<string, string>();
const storageShim: Storage = {
  get length() {
    return storageMap.size;
  },
  clear: () => storageMap.clear(),
  getItem: (key: string) => storageMap.get(key) ?? null,
  key: (idx: number) => Array.from(storageMap.keys())[idx] ?? null,
  removeItem: (key: string) => {
    storageMap.delete(key);
  },
  setItem: (key: string, value: string) => {
    storageMap.set(key, value);
  },
};
(globalThis as unknown as { localStorage: Storage }).localStorage =
  storageShim;

// crypto.randomUUID ist in Node >= 19 global. Wir stellen sicher,
// dass `crypto`-Objekt ein `randomUUID` hat (store.ts nutzt es).
if (!(globalThis as unknown as { crypto?: Crypto }).crypto) {
  (globalThis as unknown as { crypto: { randomUUID: () => string } }).crypto =
    { randomUUID };
} else if (
  !(globalThis as unknown as { crypto: { randomUUID?: () => string } }).crypto
    .randomUUID
) {
  (globalThis as unknown as { crypto: { randomUUID: () => string } }).crypto.randomUUID =
    randomUUID;
}

// ──────────────────────────────────────────────────────────────────
// Mini-Types (nur was das Script braucht; bewusst dupliziert, damit
// das Script keine src/-Module importieren muss, die Vite-only sind).
// ──────────────────────────────────────────────────────────────────

type SKR = "SKR03";
type Kategorie = "aktiva" | "passiva" | "aufwand" | "ertrag";

type Account = {
  id: string;
  konto_nr: string;
  bezeichnung: string;
  kategorie: Kategorie;
  ust_satz: number | null;
  skr: SKR;
  is_active: boolean;
  tags?: string[] | null;
};

type JournalEntry = {
  id: string;
  datum: string;
  beleg_nr: string;
  beschreibung: string;
  soll_konto: string;
  haben_konto: string;
  betrag: number;
  ust_satz: number | null;
  status: "gebucht" | "entwurf";
  client_id: string | null;
  skonto_pct: number | null;
  skonto_tage: number | null;
  gegenseite: string | null;
  faelligkeit: string | null;
  version: number;
  created_at?: string;
  updated_at?: string;
  entry_hash?: string | null;
  prev_hash?: string | null;
  kostenstelle?: string | null;
  kostentraeger?: string | null;
  batch_id?: string | null;
};

type Client = Record<string, unknown>;
type Employee = Record<string, unknown>;
type Anlagegut = Record<string, unknown>;
type AfaBuchung = Record<string, unknown>;
type BankReconciliationMatch = Record<string, unknown>;
type InventurSession = Record<string, unknown>;
type InventurAnlage = Record<string, unknown>;
type InventurBestand = Record<string, unknown>;
type LohnArchivRow = Record<string, unknown>;

// ──────────────────────────────────────────────────────────────────
// Konstanten
// ──────────────────────────────────────────────────────────────────

// Deterministische UUID — bewusst KEINE randomUUID(), weil sonst:
//   1. jeder Script-Lauf eine neue Mandant-ID erzeugt,
//   2. Browser-Caching der bereits ausgelieferten HTML eine
//      *andere* UUID einbettet als der nächste Script-Lauf in den
//      JSON-Dump schreibt,
//   3. der gemergte Client mit ID X im Wizard nicht auffindbar ist
//      (`clients.find(c => c.id === selectedMandantId)` schlägt fehl
//      bzw. trifft koinzident einen falschen Bestands-Mandanten).
// Hex-valid UUID v4 (Version-Bits 4xxx, Variant-Bits 8xxx); klar
// als Test-/Seed-Datensatz erkennbar.
const MANDANT_ID = "aaaa0000-0000-4000-8000-000000000001";
const JAHR = 2025;
const STICHTAG = `${JAHR}-12-31`;
const NOW = new Date().toISOString();

// Konten-Nummern.
// BILANZ-KONTEN (Aktiva/Passiva) werden NICHT ueber den GuV-Kreis
// bebucht, daher muessen die Konto-Nummern im SKR03_MAPPING_RULES
// Bilanz-Bereich liegen (siehe src/domain/accounting/skr03Mapping.ts).
const K_BANK = "1200";
// Wareneinkauf: Range 3400-3699 → GuV 5.a Materialaufwand.
const K_WARENEINGANG = "3400";
// Personal: 4110 → GuV 6.a Löhne.
const K_PERSONAL = "4110";
// Raumkosten: 4210 → GuV 8 Sonstige betriebliche Aufwendungen.
const K_RAUM = "4210";
const K_FAHRZEUG = "4510";
const K_BUERO = "4910";
const K_BERATUNG = "4950";
// 4130 → GuV 6.b Soziale Aufwendungen (nicht Rückstellung!).
const K_SV_AG = "4130";
// Erlöse: 8400 → GuV 1 Umsatzerlöse.
const K_ERLOESE = "8400";
const K_AFA_BUEROMOEBEL = "4832";
const K_AFA_IT = "4855";
const K_AFA_KFZ = "4830";
// Vorraete: SKR03 Standard fuer Waren-Bestand ist 3970 (Range 3900-3999
// → B.I.3 FERTIGE_ERZEUGNISSE in skr03Mapping) bzw. Hilfsstoffe auf 3200
// (Range 3200-3299 → B.I.1 HILFSSTOFFE). Die vorherige Seed-Wahl 1140/
// 1230 lag in der 1100-1299-Bank-Range und tauchte deshalb faelschlich
// als Bank-Zusatzsaldo auf statt als Vorraete.
const K_WAREN_VORRAT = "3970";
const K_HILFSSTOFFE_VORRAT = "3200";
// EB-Gegenkonto: 0860 Gewinnvortrag (Range 860-869 → P.A.IV). Vorjahres-
// Aktivbestaende, die ohne Zufluss in 2025 da sind, werden gegen 0860
// gebucht — damit ist die EB doppik-korrekt (Aktiva-Stock = Passiva-
// Stock) und die "Gezeichnetes Kapital"-Position bleibt bei exakt
// 25.000 EUR (nur Stammkapital, nicht die Summe der Anfangsbestaende).
const K_GEWINNVORTRAG = "0860";
// Gezeichnetes Kapital (SKR03: 2300 Range 2300-2309 → P.A.I per
// harouda-eigener Bug-B-Erweiterung).
const K_GEZEICHNETES_KAPITAL = "2300";

// ──────────────────────────────────────────────────────────────────
// SKR03-Account-Seed (Teilmenge — nur das, was unser Journal braucht)
// ──────────────────────────────────────────────────────────────────

function makeAccount(
  konto_nr: string,
  bezeichnung: string,
  kategorie: Kategorie,
  ust_satz: number | null = null
): Account {
  return {
    id: `a-${konto_nr}`,
    konto_nr,
    bezeichnung,
    kategorie,
    ust_satz,
    skr: "SKR03",
    is_active: true,
    tags: [],
  };
}

const ACCOUNTS: Account[] = [
  // Aktiva
  makeAccount(K_BANK, "Bank", "aktiva"),
  makeAccount("1000", "Kasse", "aktiva"),
  makeAccount("1400", "Forderungen aus L+L", "aktiva"),
  makeAccount(K_WAREN_VORRAT, "Waren (Bestand)", "aktiva"),
  makeAccount(K_HILFSSTOFFE_VORRAT, "Hilfsstoffe (Bestand)", "aktiva"),
  makeAccount("0420", "Büroausstattung", "aktiva"),
  makeAccount("0440", "Büromaschinen, EDV-Anlagen", "aktiva"),
  makeAccount("0670", "PKW", "aktiva"),
  // Passiva
  makeAccount(K_GEZEICHNETES_KAPITAL, "Gezeichnetes Kapital", "passiva"),
  makeAccount(K_GEWINNVORTRAG, "Gewinnvortrag (Vorjahre)", "passiva"),
  makeAccount("1600", "Verbindlichkeiten aus L+L", "passiva"),
  // Aufwand (Kleinunternehmer-Modus fuer den Seed: keine USt/VSt-
  // Buchungen — saubere Netto-Bilanz, keine Scheinrueckstellung aus
  // SKR03-Range 1770-1779, Aktiva=Passiva ohne Zahllast-Detour).
  makeAccount(K_WARENEINGANG, "Wareneingang", "aufwand"),
  makeAccount(K_PERSONAL, "Löhne und Gehälter", "aufwand"),
  makeAccount(K_SV_AG, "Gesetzliche soziale Aufwendungen", "aufwand"),
  makeAccount(K_RAUM, "Miete", "aufwand"),
  makeAccount(K_FAHRZEUG, "Fahrzeugkosten", "aufwand"),
  makeAccount(K_BUERO, "Bürokosten", "aufwand"),
  makeAccount(K_BERATUNG, "Rechts- und Beratungskosten", "aufwand"),
  makeAccount(K_AFA_BUEROMOEBEL, "AfA Büroausstattung", "aufwand"),
  makeAccount(K_AFA_IT, "AfA Büromaschinen", "aufwand"),
  makeAccount(K_AFA_KFZ, "AfA Kraftfahrzeuge", "aufwand"),
  // Ertrag
  makeAccount(K_ERLOESE, "Umsatzerlöse", "ertrag"),
];

// ──────────────────────────────────────────────────────────────────
// Client / Mandant
// ──────────────────────────────────────────────────────────────────

const CLIENT: Client = {
  id: MANDANT_ID,
  mandant_nr: "99001",
  name: "Musterfirma Jahresabschluss GmbH",
  steuernummer: "66/123/45678",
  ust_id: null,
  iban: "DE89 3704 0044 0532 0130 00",
  ust_id_status: "unchecked",
  ust_id_checked_at: null,
  last_daten_holen_at: null,
  rechtsform: "GmbH",
  hrb_nummer: "HRB 12345",
  hrb_gericht: "Amtsgericht Osnabrueck",
  gezeichnetes_kapital: 25_000,
  geschaeftsfuehrer: [
    {
      name: "Max Mustermann",
      funktion: "geschaeftsfuehrer",
      bestellt_am: "2020-01-15",
    },
  ],
  wirtschaftsjahr_beginn: "01-01",
  wirtschaftsjahr_ende: "12-31",
  anschrift_strasse: "Musterstrasse",
  anschrift_hausnummer: "1",
  anschrift_plz: "49074",
  anschrift_ort: "Osnabrueck",
  anschrift_land: "DE",
};

// ──────────────────────────────────────────────────────────────────
// Journal-Entries 2025
// ──────────────────────────────────────────────────────────────────

// HINWEIS: Das Seed-Script berechnet BEWUSST KEINE Hash-Chain.
// Die App-eigene Canonical-Format-Logik (`src/utils/journalChain.ts`)
// verwendet `prev_hash|datum|beleg_nr|soll_konto|haben_konto|
// betrag.toFixed(2)|beschreibung|parent_entry_id` + SubtleCrypto; das
// im Seed-Script zu replizieren waere fragil (jede App-seitige Format-
// Aenderung muesste hier nachgezogen werden). Stattdessen werden
// entry_hash und prev_hash NICHT gesetzt — `verifyJournalChain` in der
// App ueberspringt Entries ohne entry_hash tolerant
// (`if (!e.entry_hash) continue;`, journalChain.ts:106). Das
// entspricht pre-migration-Altdaten-Semantik und ist fuer Test-/Seed-
// Zwecke voellig ausreichend; sobald der User eine NEUE Buchung via
// `createEntry` anlegt, startet die App eine frische Hash-Kette ab
// `JOURNAL_GENESIS_HASH`.

const journal: JournalEntry[] = [];
let entryId = 1;

function book(
  datum: string,
  soll: string,
  haben: string,
  betrag: number,
  beleg_nr: string,
  beschreibung: string,
  ust_satz: number | null = null
): void {
  const entry: JournalEntry = {
    id: `e-${JAHR}-${String(entryId).padStart(4, "0")}`,
    datum,
    beleg_nr,
    beschreibung,
    soll_konto: soll,
    haben_konto: haben,
    betrag,
    ust_satz,
    status: "gebucht" as const,
    client_id: MANDANT_ID,
    skonto_pct: null,
    skonto_tage: null,
    gegenseite: null,
    faelligkeit: null,
    version: 1,
    created_at: NOW,
    updated_at: NOW,
    kostenstelle: null,
    kostentraeger: null,
    batch_id: null,
    // entry_hash + prev_hash bewusst NICHT gesetzt — siehe Block-Kommentar oben.
  };
  journal.push(entry);
  entryId += 1;
}

// --- Eroeffnungsbilanz 2025 (Januar).
// Doppik-korrekte Gliederung: Stammkapital exakt 25.000 EUR (EB-001);
// alle Aktiv-Anfangsbestaende gegen 0860 Gewinnvortrag gebucht —
// dadurch ergibt Aktiva-Summe der EB = Passiva-Summe der EB (25k + 84k
// = 109k), und die P.A.I-Position im Jahresabschluss zeigt genau
// 25.000 EUR Stammkapital statt der fruehheren Summen-109k.
book(
  "2025-01-01",
  K_BANK,
  K_GEZEICHNETES_KAPITAL,
  25_000,
  "EB-001",
  "Eröffnungsbilanz: Einzahlung Stammkapital"
);
book(
  "2025-01-01",
  K_BANK,
  K_GEWINNVORTRAG,
  25_000,
  "EB-002",
  "Eröffnungsbilanz: zusätzlicher Bank-Saldo aus Vorjahren"
);
book(
  "2025-01-01",
  "0420",
  K_GEWINNVORTRAG,
  8_000,
  "EB-003",
  "Eröffnungsbilanz: Büroausstattung aus Vorjahren"
);
book(
  "2025-01-01",
  "0440",
  K_GEWINNVORTRAG,
  2_500,
  "EB-004",
  "Eröffnungsbilanz: Büromaschinen aus Vorjahren"
);
book(
  "2025-01-01",
  "0670",
  K_GEWINNVORTRAG,
  35_000,
  "EB-005",
  "Eröffnungsbilanz: Firmenwagen aus Vorjahren"
);
book(
  "2025-01-01",
  K_WAREN_VORRAT,
  K_GEWINNVORTRAG,
  12_000,
  "EB-006",
  "Eröffnungsbilanz: Warenbestand aus Vorjahren"
);
book(
  "2025-01-01",
  K_HILFSSTOFFE_VORRAT,
  K_GEWINNVORTRAG,
  1_500,
  "EB-007",
  "Eröffnungsbilanz: Hilfsstoffe aus Vorjahren"
);

// --- Monatsroutine 2025: pro Monat ~12 Buchungen
const monatsErloese = [
  32_000, 30_000, 42_000, 38_000, 35_000, 40_000,
  28_000, 25_000, 45_000, 48_000, 42_000, 50_000,
];
const monatsWareneinsatz = [
  15_000, 14_000, 18_000, 17_000, 16_000, 19_000,
  13_000, 12_000, 20_000, 21_000, 19_000, 22_000,
];

for (let m = 1; m <= 12; m++) {
  const mm = String(m).padStart(2, "0");
  // Kleinunternehmer-Modus: Betraege sind Netto = Rechnungsbetrag; keine
  // getrennte USt/VSt-Buchung. Dadurch entfaellt die Scheinrueckstellung
  // (Konto 1776 wuerde sonst in SKR03-Range 1770-1779 → P.B.2
  // Steuerrueckstellung mappen und mit 86.450 EUR die Bilanz verzerren).
  const netto = monatsErloese[m - 1];

  // Umsatz: Bank Soll / Erlöse Haben
  book(
    `2025-${mm}-15`,
    K_BANK,
    K_ERLOESE,
    netto,
    `UMS-${mm}`,
    `Umsatzerlöse ${mm}/2025`
  );

  // Wareneinkauf
  book(
    `2025-${mm}-10`,
    K_WARENEINGANG,
    K_BANK,
    monatsWareneinsatz[m - 1],
    `WE-${mm}`,
    `Wareneinkauf ${mm}/2025`
  );

  // Miete
  book(
    `2025-${mm}-05`,
    K_RAUM,
    K_BANK,
    2_000,
    `MIETE-${mm}`,
    `Geschäftsmiete ${mm}/2025`
  );

  // Fahrzeugkosten
  book(
    `2025-${mm}-20`,
    K_FAHRZEUG,
    K_BANK,
    800,
    `KFZ-${mm}`,
    `Fahrzeugkosten ${mm}/2025`
  );

  // Bürokosten
  book(
    `2025-${mm}-25`,
    K_BUERO,
    K_BANK,
    500,
    `BUERO-${mm}`,
    `Bürokosten ${mm}/2025`
  );

  // Löhne (Brutto für beide Mitarbeiter: 6000 + 3500 = 9500)
  book(
    `2025-${mm}-28`,
    K_PERSONAL,
    K_BANK,
    9_500,
    `LOHN-${mm}`,
    `Löhne und Gehälter ${mm}/2025`
  );
}

// --- Einmalige Beratung März
book(
  "2025-03-18",
  K_BERATUNG,
  K_BANK,
  12_000,
  "BER-2025-01",
  "Steuerberatung Jahresabschluss 2024"
);

// --- Arbeitgeber-SV-Anteil 2025 (Jahresbuchung, realistisch ~22%
//     des Bruttolohns 114.000 → 25.000 EUR). Eine einzelne
//     Dezember-Buchung hält die Entry-Zahl niedrig.
book(
  STICHTAG,
  K_SV_AG,
  K_BANK,
  30_000,
  "SV-AG-2025",
  "Arbeitgeberanteil Sozialversicherung 2025"
);

// --- AfA-Buchungen Dezember 2025
// Bueromoebel: AK 8000, ND 13 Jahre → 615.38/Jahr
book(
  STICHTAG,
  K_AFA_BUEROMOEBEL,
  "0420",
  615.38,
  "AFA-2025-BUERO",
  "AfA Büroausstattung 2025 (linear, 13 Jahre)"
);
// Laptop: AK 2500, ND 3 Jahre → 833.33/Jahr
book(
  STICHTAG,
  K_AFA_IT,
  "0440",
  833.33,
  "AFA-2025-IT",
  "AfA Laptop 2025 (linear, 3 Jahre)"
);
// Firmenwagen: AK 35000, ND 6 Jahre → 5833.33/Jahr
book(
  STICHTAG,
  K_AFA_KFZ,
  "0670",
  5_833.33,
  "AFA-2025-KFZ",
  "AfA Firmenwagen 2025 (linear, 6 Jahre)"
);

// ──────────────────────────────────────────────────────────────────
// Anlagegueter
// ──────────────────────────────────────────────────────────────────

const ANLAGEGUETER: Anlagegut[] = [
  {
    id: "ag-bueromoebel",
    company_id: null,
    client_id: MANDANT_ID,
    inventar_nr: "A-001",
    bezeichnung: "Büroausstattung (Möbel, Regale)",
    anschaffungsdatum: "2023-03-15",
    anschaffungskosten: 8_000,
    nutzungsdauer_jahre: 13,
    afa_methode: "linear",
    konto_anlage: "0420",
    konto_afa: K_AFA_BUEROMOEBEL,
    konto_abschreibung_kumuliert: null,
    aktiv: true,
    abgangsdatum: null,
    abgangserloes: null,
    notizen: null,
    parent_id: null,
    created_at: "2023-03-15T00:00:00Z",
    updated_at: NOW,
  },
  {
    id: "ag-laptop",
    company_id: null,
    client_id: MANDANT_ID,
    inventar_nr: "A-002",
    bezeichnung: "Laptop / IT-Equipment",
    anschaffungsdatum: "2024-09-01",
    anschaffungskosten: 2_500,
    nutzungsdauer_jahre: 3,
    afa_methode: "linear",
    konto_anlage: "0440",
    konto_afa: K_AFA_IT,
    konto_abschreibung_kumuliert: null,
    aktiv: true,
    abgangsdatum: null,
    abgangserloes: null,
    notizen: null,
    parent_id: null,
    created_at: "2024-09-01T00:00:00Z",
    updated_at: NOW,
  },
  {
    id: "ag-firmenwagen",
    company_id: null,
    client_id: MANDANT_ID,
    inventar_nr: "A-003",
    bezeichnung: "Firmenwagen",
    anschaffungsdatum: "2022-06-01",
    anschaffungskosten: 35_000,
    nutzungsdauer_jahre: 6,
    afa_methode: "linear",
    konto_anlage: "0670",
    konto_afa: K_AFA_KFZ,
    konto_abschreibung_kumuliert: null,
    aktiv: true,
    abgangsdatum: null,
    abgangserloes: null,
    notizen: null,
    parent_id: null,
    created_at: "2022-06-01T00:00:00Z",
    updated_at: NOW,
  },
];

const AFA_BUCHUNGEN: AfaBuchung[] = [
  {
    id: "afa-buero-2025",
    anlage_id: "ag-bueromoebel",
    jahr: 2025,
    afa_betrag: 615.38,
    restbuchwert: 8_000 - 615.38 * 3,
    journal_entry_id: journal.find((j) => j.beleg_nr === "AFA-2025-BUERO")?.id ?? null,
  },
  {
    id: "afa-it-2025",
    anlage_id: "ag-laptop",
    jahr: 2025,
    afa_betrag: 833.33,
    restbuchwert: 2_500 - 833.33 * 1.5,
    journal_entry_id: journal.find((j) => j.beleg_nr === "AFA-2025-IT")?.id ?? null,
  },
  {
    id: "afa-kfz-2025",
    anlage_id: "ag-firmenwagen",
    jahr: 2025,
    afa_betrag: 5_833.33,
    restbuchwert: 35_000 - 5_833.33 * 3.5,
    journal_entry_id: journal.find((j) => j.beleg_nr === "AFA-2025-KFZ")?.id ?? null,
  },
];

// ──────────────────────────────────────────────────────────────────
// Employees + Lohn-Abrechnungen
// ──────────────────────────────────────────────────────────────────

const EMPLOYEES: Employee[] = [
  {
    id: "emp-max",
    company_id: null,
    client_id: MANDANT_ID,
    personalnummer: "001",
    vorname: "Max",
    nachname: "Mustermann",
    steuer_id: "12345678901",
    sv_nummer: "12345678A012",
    steuerklasse: "III",
    kinderfreibetraege: 0,
    konfession: null,
    bundesland: "NI",
    einstellungsdatum: "2020-01-15",
    austrittsdatum: null,
    beschaeftigungsart: "vollzeit",
    wochenstunden: 40,
    bruttogehalt_monat: 6_000,
    stundenlohn: null,
    krankenkasse: "TK",
    zusatzbeitrag_pct: 2.45,
    privat_versichert: false,
    pv_kinderlos: false,
    pv_kinder_anzahl: 2,
    iban: null,
    bic: null,
    kontoinhaber: null,
    notes: null,
    is_active: true,
    created_at: "2020-01-15T00:00:00Z",
    updated_at: NOW,
    staatsangehoerigkeit: "DE",
    geburtsname: "Mustermann",
    geburtsort: "Osnabrueck",
    taetigkeitsschluessel: "82194",
    einzugsstelle_bbnr: "15000100",
    anschrift_strasse: "Musterstrasse",
    anschrift_hausnummer: "1",
    anschrift_plz: "49074",
    anschrift_ort: "Osnabrueck",
    anschrift_land: "DE",
    mehrfachbeschaeftigung: false,
  },
  {
    id: "emp-erika",
    company_id: null,
    client_id: MANDANT_ID,
    personalnummer: "002",
    vorname: "Erika",
    nachname: "Musterfrau",
    steuer_id: "98765432109",
    sv_nummer: "98765432B098",
    steuerklasse: "I",
    kinderfreibetraege: 0,
    konfession: "ev",
    bundesland: "NI",
    einstellungsdatum: "2022-04-01",
    austrittsdatum: null,
    beschaeftigungsart: "vollzeit",
    wochenstunden: 40,
    bruttogehalt_monat: 3_500,
    stundenlohn: null,
    krankenkasse: "TK",
    zusatzbeitrag_pct: 2.45,
    privat_versichert: false,
    pv_kinderlos: true,
    pv_kinder_anzahl: 0,
    iban: null,
    bic: null,
    kontoinhaber: null,
    notes: null,
    is_active: true,
    created_at: "2022-04-01T00:00:00Z",
    updated_at: NOW,
    staatsangehoerigkeit: "DE",
    geburtsname: "Schmidt",
    geburtsort: "Hannover",
    taetigkeitsschluessel: "62113",
    einzugsstelle_bbnr: "15000100",
    anschrift_strasse: "Beispielweg",
    anschrift_hausnummer: "5",
    anschrift_plz: "49074",
    anschrift_ort: "Osnabrueck",
    anschrift_land: "DE",
    mehrfachbeschaeftigung: false,
  },
];

// Lohn-Archiv: 2 Mitarbeiter * 12 Monate = 24 Zeilen
const LOHN_ARCHIV: LohnArchivRow[] = [];
for (const emp of EMPLOYEES as Array<{
  id: string;
  bruttogehalt_monat: number;
  vorname: string;
  nachname: string;
}>) {
  for (let m = 1; m <= 12; m++) {
    const mm = String(m).padStart(2, "0");
    const brutto = emp.bruttogehalt_monat;
    // Grobe Schaetzung: Netto ~ 60%, Abzuege ~ 40%
    const abzuegeTotal = Math.round(brutto * 0.4 * 100) / 100;
    const netto = brutto - abzuegeTotal;
    const agKosten = Math.round(brutto * 0.21 * 100) / 100;
    LOHN_ARCHIV.push({
      id: `archiv-${emp.id}-${JAHR}-${mm}`,
      company_id: null,
      client_id: MANDANT_ID,
      employee_id: emp.id,
      abrechnungsmonat: `${JAHR}-${mm}`,
      gesamt_brutto: brutto,
      gesamt_netto: netto,
      gesamt_abzuege: abzuegeTotal,
      gesamt_ag_kosten: agKosten,
      batch_id: null,
      locked: true,
      created_at: `${JAHR}-${mm}-28T00:00:00Z`,
      abrechnung_json: {
        arbeitnehmer_id: emp.id,
        abrechnungsmonat: `${JAHR}-${mm}`,
        laufenderBrutto: brutto.toFixed(2),
        sonstigeBezuege: "0.00",
        gesamtBrutto: brutto.toFixed(2),
        svBrutto: brutto.toFixed(2),
        abzuege: {
          lohnsteuer: (brutto * 0.15).toFixed(2),
          solidaritaetszuschlag: "0.00",
          kirchensteuer: "0.00",
          kv_an: (brutto * 0.073).toFixed(2),
          kv_zusatz_an: (brutto * 0.012).toFixed(2),
          pv_an: (brutto * 0.01525).toFixed(2),
          rv_an: (brutto * 0.093).toFixed(2),
          av_an: (brutto * 0.0125).toFixed(2),
          gesamtAbzuege: abzuegeTotal.toFixed(2),
        },
        arbeitgeberKosten: {
          kv: (brutto * 0.073).toFixed(2),
          kv_zusatz: (brutto * 0.012).toFixed(2),
          pv: (brutto * 0.017).toFixed(2),
          rv: (brutto * 0.093).toFixed(2),
          av: (brutto * 0.0125).toFixed(2),
          u1: (brutto * 0.014).toFixed(2),
          u2: (brutto * 0.0024).toFixed(2),
          u3: (brutto * 0.0006).toFixed(2),
          gesamt: agKosten.toFixed(2),
        },
        auszahlungsbetrag: netto.toFixed(2),
        gesamtkostenArbeitgeber: (brutto + agKosten).toFixed(2),
        _meta: { seed: true, version: "jahresabschluss-test-2025" },
      },
    });
  }
}

// ──────────────────────────────────────────────────────────────────
// Bank-Reconciliation-Matches: alle Bank-Bewegungen matched
// ──────────────────────────────────────────────────────────────────

const BANK_ENTRIES = journal.filter(
  (j) =>
    (j.soll_konto === K_BANK || j.haben_konto === K_BANK) &&
    !j.beleg_nr.startsWith("EB-")
);

const BANK_MATCHES: BankReconciliationMatch[] = BANK_ENTRIES.map((e) => {
  const canonical = `${e.datum}|${e.betrag.toFixed(2)}|${e.beschreibung.trim().toLowerCase()}|`;
  const fp = createHash("sha256").update(canonical).digest("hex");
  return {
    id: randomUUID(),
    company_id: null,
    client_id: MANDANT_ID,
    bank_transaction_id: randomUUID(),
    bank_transaction_fingerprint: fp,
    journal_entry_id: e.id,
    match_status: "matched",
    match_confidence: 1.0,
    matched_at: `${e.datum}T12:00:00Z`,
    matched_by_user_id: null,
    notiz: "Auto-matched durch Seed-Script",
    created_at: `${e.datum}T12:00:00Z`,
    updated_at: NOW,
  };
});

// ──────────────────────────────────────────────────────────────────
// Inventur-Session 2025 (abgeschlossen)
// ──────────────────────────────────────────────────────────────────

const INVENTUR_SESSION_ID = randomUUID();
const INVENTUR_SESSIONS: InventurSession[] = [
  {
    id: INVENTUR_SESSION_ID,
    company_id: null,
    client_id: MANDANT_ID,
    stichtag: STICHTAG,
    jahr: JAHR,
    status: "abgeschlossen",
    anlagen_inventur_abgeschlossen: true,
    bestands_inventur_abgeschlossen: true,
    notiz: "Auto-generiert durch Seed-Script Jahresabschluss-Test",
    erstellt_von: null,
    erstellt_am: NOW,
    abgeschlossen_am: NOW,
    created_at: NOW,
    updated_at: NOW,
  },
];

const INVENTUR_ANLAGEN: InventurAnlage[] = ANLAGEGUETER.map((a) => ({
  id: randomUUID(),
  session_id: INVENTUR_SESSION_ID,
  anlage_id: (a as { id: string }).id,
  status: "vorhanden",
  notiz: "Körperliche Bestandsaufnahme Seed-Script",
  abgangs_buchung_id: null,
  geprueft_am: NOW,
  geprueft_von: null,
  created_at: NOW,
  updated_at: NOW,
}));

const INVENTUR_BESTAENDE: InventurBestand[] = [
  {
    id: randomUUID(),
    session_id: INVENTUR_SESSION_ID,
    bezeichnung: "Handelswaren (physisch gezählt)",
    vorrat_konto_nr: K_WAREN_VORRAT,
    anfangsbestand: 12_000,
    endbestand: 15_000,
    niederstwert_aktiv: false,
    niederstwert_begruendung: null,
    inventurliste_document_id: null,
    bestandsveraenderungs_buchung_id: null,
    notiz: "Seed-Test-Datensatz",
    created_at: NOW,
    updated_at: NOW,
  },
  {
    id: randomUUID(),
    session_id: INVENTUR_SESSION_ID,
    bezeichnung: "Hilfsstoffe (Verpackung, Büromaterial)",
    vorrat_konto_nr: K_HILFSSTOFFE_VORRAT,
    anfangsbestand: 1_500,
    endbestand: 2_000,
    niederstwert_aktiv: false,
    niederstwert_begruendung: null,
    inventurliste_document_id: null,
    bestandsveraenderungs_buchung_id: null,
    notiz: "Seed-Test-Datensatz",
    created_at: NOW,
    updated_at: NOW,
  },
];

// ──────────────────────────────────────────────────────────────────
// localStorage-Keys befuellen
// ──────────────────────────────────────────────────────────────────

storageShim.setItem("harouda:accounts", JSON.stringify(ACCOUNTS));
storageShim.setItem("harouda:entries", JSON.stringify(journal));
storageShim.setItem("harouda:clients", JSON.stringify([CLIENT]));
storageShim.setItem("harouda:employees", JSON.stringify(EMPLOYEES));
storageShim.setItem("harouda:anlagegueter", JSON.stringify(ANLAGEGUETER));
storageShim.setItem("harouda:afaBuchungen", JSON.stringify(AFA_BUCHUNGEN));
storageShim.setItem("harouda:lohnArchiv", JSON.stringify(LOHN_ARCHIV));
storageShim.setItem(
  "harouda:bankReconMatches",
  JSON.stringify(BANK_MATCHES)
);
storageShim.setItem(
  "harouda:inventurSessions",
  JSON.stringify(INVENTUR_SESSIONS)
);
storageShim.setItem(
  "harouda:inventurAnlagen",
  JSON.stringify(INVENTUR_ANLAGEN)
);
storageShim.setItem(
  "harouda:inventurBestaende",
  JSON.stringify(INVENTUR_BESTAENDE)
);
storageShim.setItem("harouda:selectedMandantId", MANDANT_ID);
storageShim.setItem("harouda:selectedYear", String(JAHR));
// FLAG: verhindert dass autoSeedDemoIfNeeded unsere Daten ueberschreibt.
storageShim.setItem("harouda:demo-seeded-v3", "1");

// ──────────────────────────────────────────────────────────────────
// Kennzahlen berechnen (fuer Console-Zusammenfassung)
// ──────────────────────────────────────────────────────────────────

const jahresUmsatz =
  journal
    .filter((j) => j.haben_konto === K_ERLOESE)
    .reduce((s, j) => s + j.betrag, 0);

const jahresAufwand = journal
  .filter((j) =>
    [K_WARENEINGANG, K_PERSONAL, K_SV_AG, K_RAUM, K_FAHRZEUG, K_BUERO, K_BERATUNG, K_AFA_BUEROMOEBEL, K_AFA_IT, K_AFA_KFZ].includes(j.soll_konto)
  )
  .reduce((s, j) => s + j.betrag, 0);

const jahresErgebnis = jahresUmsatz - jahresAufwand;

// ──────────────────────────────────────────────────────────────────
// Output-Dateien schreiben
// ──────────────────────────────────────────────────────────────────

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 1. JSON-Export (Referenz / Debug / CI-Konsum).
const jsonPath = resolve(__dirname, "seed-jahresabschluss-output.json");
const dump: Record<string, unknown> = {};
for (const [k, v] of storageMap.entries()) {
  try {
    dump[k] = JSON.parse(v);
  } catch {
    dump[k] = v;
  }
}
mkdirSync(dirname(jsonPath), { recursive: true });
writeFileSync(jsonPath, JSON.stringify(dump, null, 2), "utf-8");

// 2. Self-contained HTML-Bootstrap — wird nach `public/` geschrieben.
//    Vite serviert alles unter `public/` auf Root-Ebene, so dass die
//    HTML-Datei unter `http://localhost:5173/seed-jahresabschluss.html`
//    erreichbar ist. Damit teilt sich localStorage same-origin mit der
//    App; ein file://-Lauf wuerde localStorage isolieren und der neue
//    Mandant erschiene nicht im App-Dropdown.
const htmlPath = resolve(
  __dirname,
  "..",
  "public",
  "seed-jahresabschluss.html"
);
const inlineJson = JSON.stringify(
  Object.fromEntries(storageMap.entries()),
  null,
  2
);
const devServerUrl = "http://localhost:5173";
const bootstrapUrl = `${devServerUrl}/seed-jahresabschluss.html`;
// Relative Redirect-URL — weil same-origin funktioniert window.open
// mit Pfad direkt; spart Portannahmen falls Dev-Server auf anderem
// Port laeuft.
const wizardPath = `/jahresabschluss/wizard?mandantId=${MANDANT_ID}&jahr=${JAHR}`;
const wizardUrl = `${devServerUrl}${wizardPath}`;

const html = `<!DOCTYPE html>
<html lang="de">
<head>
<meta charset="utf-8"/>
<title>harouda-app · Seed Jahresabschluss-Wizard-Test</title>
<style>
  body { font-family: system-ui, sans-serif; padding: 24px; max-width: 720px; margin: 0 auto; }
  h1 { font-size: 1.3rem; }
  code { background: #f3f3f3; padding: 2px 6px; border-radius: 3px; font-size: 0.85rem; }
  pre { background: #f7f7f7; padding: 10px; border-radius: 4px; font-size: 0.78rem; overflow: auto; }
  .btn { display: inline-block; padding: 10px 18px; background: #2563eb; color: #fff;
         border: none; border-radius: 4px; cursor: pointer; font-size: 1rem; }
  .btn:hover { background: #1d4ed8; }
  .warn { background: #fff8dc; border: 1px solid #d8b35c; padding: 10px; border-radius: 4px; }
</style>
</head>
<body>
<h1>🌱 Seed Jahresabschluss-Wizard-Test</h1>
<p>
  Mandant <strong>Musterfirma Jahresabschluss GmbH</strong> (ID
  <code>${MANDANT_ID}</code>, Jahr ${JAHR}).
</p>
<p class="warn">
  <strong>Hinweis:</strong> Diese Seite wird vom Vite-Dev-Server
  ausgeliefert (<code>public/seed-jahresabschluss.html</code>) und ist
  daher <strong>same-origin</strong> mit der App — der Button merged
  den Seed in das <em>gleiche</em> <code>localStorage</code>, das die
  App liest. Bestehende Mandanten (z. B. Kuehn Musterfirma) bleiben
  erhalten: Listen werden per ID additiv ergaenzt, Accounts per
  Konto-Nummer. Nur <code>selectedMandantId</code> und
  <code>selectedYear</code> werden hart gesetzt, damit der Wizard
  sofort auf dem neuen Mandanten startet.
</p>
<h2>Zwei Modi</h2>
<p>
  <button class="btn" onclick="seed()">
    [1] Merge — Kuehn bleibt erhalten
  </button>
</p>
<p style="font-size:0.85rem;color:#555;margin-top:-6px;">
  Fuegt Musterfirma neben bestehenden Mandanten ein. Geeignet fuer
  Koexistenz-Tests. <em>Hinweis:</em> AfA-Closing-Validator und andere
  Kontext-Checks koennen Warnings fuer Kuehn-Anlagen ausgeben, solange
  beide Mandanten parallel existieren.
</p>
<p>
  <button class="btn" style="background:#b91c1c;"
          onclick="cleanSlate()">
    [2] Clean-Slate — localStorage leeren + nur Musterfirma seeden
  </button>
</p>
<p style="font-size:0.85rem;color:#555;margin-top:-6px;">
  <strong>Loescht ALLES</strong> in <code>localStorage</code>
  (<code>localStorage.clear()</code>) und schreibt anschliessend NUR
  die Musterfirma-Seed-Daten. Kuehn-Musterfirma wird damit entfernt.
  Setzt <code>harouda:demo-seeded-v3</code>-Flag, damit
  <code>autoSeedDemoIfNeeded</code> Kuehn beim naechsten App-Load
  <em>nicht</em> neu seeded. Sauberster Pfad fuer einen isolierten
  Wizard-Durchlauf.
</p>
<h2>Zusammenfassung</h2>
<ul>
  <li>Journal-Entries: ${journal.length}</li>
  <li>Anlageguter: ${ANLAGEGUETER.length}</li>
  <li>Mitarbeiter: ${EMPLOYEES.length}</li>
  <li>Lohn-Abrechnungen: ${LOHN_ARCHIV.length}</li>
  <li>Bank-Reconciliation-Matches: ${BANK_MATCHES.length}</li>
  <li>Inventur-Bestandspositionen: ${INVENTUR_BESTAENDE.length}</li>
  <li>Jahresumsatz (netto, Konto 8400): <strong>${jahresUmsatz.toFixed(2)} €</strong></li>
  <li>Jahresaufwand: <strong>${jahresAufwand.toFixed(2)} €</strong></li>
  <li>Jahresergebnis (grob): <strong>${jahresErgebnis.toFixed(2)} €</strong></li>
</ul>
<h2>Redirect-Ziel</h2>
<pre>${wizardUrl}</pre>
<script>
// Seed-Daten als JSON-Strings (wie sie in localStorage landen).
const SEED = ${inlineJson};
// Keys, die unveraendert ueberschrieben werden (Scalars / Flags).
const OVERWRITE_KEYS = new Set([
  "harouda:selectedMandantId",
  "harouda:selectedYear",
  "harouda:demo-seeded-v3",
]);
// Keys, deren Listen-Element-Identitaet ueber "konto_nr" laeuft.
const MERGE_BY_KONTO = new Set(["harouda:accounts"]);
// Keys mit Listen-Elementen, die per "id" identifizert werden.
const MERGE_BY_ID = new Set([
  "harouda:entries",
  "harouda:clients",
  "harouda:employees",
  "harouda:anlagegueter",
  "harouda:afaBuchungen",
  "harouda:lohnArchiv",
  "harouda:bankReconMatches",
  "harouda:inventurSessions",
  "harouda:inventurAnlagen",
  "harouda:inventurBestaende",
]);

function mergeList(existing, incoming, idField) {
  const map = new Map();
  for (const row of existing) {
    if (row && row[idField] != null) map.set(String(row[idField]), row);
  }
  // Incoming gewinnt — bei gleicher ID wird Kuehns Datensatz NICHT
  // ueberschrieben, weil unsere IDs frisch generiert sind (MANDANT_ID,
  // emp-max, ag-bueromoebel etc.), und Kuehn hat andere IDs.
  for (const row of incoming) {
    if (row && row[idField] != null) map.set(String(row[idField]), row);
  }
  return Array.from(map.values());
}

function seed() {
  const report = [];
  for (const [k, v] of Object.entries(SEED)) {
    if (OVERWRITE_KEYS.has(k)) {
      localStorage.setItem(k, v);
      report.push(k + ": overwrite");
      continue;
    }
    let incoming;
    try {
      incoming = JSON.parse(v);
    } catch {
      localStorage.setItem(k, v);
      report.push(k + ": raw-overwrite (not JSON)");
      continue;
    }
    if (!Array.isArray(incoming)) {
      localStorage.setItem(k, v);
      report.push(k + ": overwrite (not array)");
      continue;
    }
    const existingRaw = localStorage.getItem(k);
    let existing = [];
    if (existingRaw) {
      try {
        const parsed = JSON.parse(existingRaw);
        if (Array.isArray(parsed)) existing = parsed;
      } catch {
        existing = [];
      }
    }
    const idField = MERGE_BY_KONTO.has(k) ? "konto_nr" : "id";
    if (!MERGE_BY_ID.has(k) && !MERGE_BY_KONTO.has(k)) {
      // Unbekannter Listen-Key: defensiv append, kein ID-basierter Merge.
      localStorage.setItem(k, JSON.stringify([...existing, ...incoming]));
      report.push(k + ": append (" + existing.length + "+" + incoming.length + ")");
      continue;
    }
    const merged = mergeList(existing, incoming, idField);
    localStorage.setItem(k, JSON.stringify(merged));
    report.push(
      k + ": merge by " + idField + " (existing=" +
      existing.length + " + seed=" + incoming.length +
      " → total=" + merged.length + ")"
    );
  }
  alert(
    "Seed gemerged in localStorage.\\n\\n" + report.join("\\n") +
    "\\n\\nWizard wird in neuem Tab geoeffnet."
  );
  // Relative URL reicht — same-origin mit der App.
  window.open(${JSON.stringify(wizardPath)}, "_blank");
}

function cleanSlate() {
  if (
    !confirm(
      "Clean-Slate-Modus: ALLE localStorage-Daten werden geloescht " +
      "(Kuehn Musterfirma + evtl. Wizard-Zwischenstaende + evtl. " +
      "weitere Mandanten). Anschliessend wird NUR Musterfirma " +
      "Jahresabschluss GmbH neu geseedet.\\n\\n" +
      "Fortfahren?"
    )
  ) {
    return;
  }
  localStorage.clear();
  const report = [];
  for (const [k, v] of Object.entries(SEED)) {
    localStorage.setItem(k, v);
    report.push(k);
  }
  alert(
    "Clean-Slate geseedet. " + report.length + " Keys gesetzt:\\n\\n" +
    report.join("\\n") +
    "\\n\\nWizard wird in neuem Tab geoeffnet."
  );
  window.open(${JSON.stringify(wizardPath)}, "_blank");
}
</script>
</body>
</html>
`;
writeFileSync(htmlPath, html, "utf-8");

// ──────────────────────────────────────────────────────────────────
// Console-Bericht
// ──────────────────────────────────────────────────────────────────

const summary = `
============================================================
 🌱 Seed Jahresabschluss-Wizard-Test abgeschlossen.
============================================================

Mandant:
  ID          : ${MANDANT_ID}
  Name        : Musterfirma Jahresabschluss GmbH
  Rechtsform  : GmbH / HRB 12345 / AG Osnabrueck
  Kapital     : 25.000,00 €
  Anschrift   : Musterstrasse 1, 49074 Osnabrueck
  Jahr        : ${JAHR} (Stichtag ${STICHTAG})

Zahlen:
  Journal-Entries          : ${journal.length}
  Anlagegueter             : ${ANLAGEGUETER.length}
  Mitarbeiter              : ${EMPLOYEES.length}
  Lohn-Abrechnungen        : ${LOHN_ARCHIV.length}
  Bank-Recon-Matches       : ${BANK_MATCHES.length}
  Inventur-Bestandspos.    : ${INVENTUR_BESTAENDE.length}
  Jahresumsatz (netto)     : ${jahresUmsatz.toFixed(2)} €
  Jahresaufwand            : ${jahresAufwand.toFixed(2)} €
  Jahresergebnis (grob)    : ${jahresErgebnis.toFixed(2)} €

Output-Dateien:
  ${jsonPath}   (Debug-Dump)
  ${htmlPath}   (wird von Vite unter public/ ausgeliefert)

Naechste Schritte:
  1. Dev-Server starten:  npm run dev
  2. Im Browser oeffnen:  ${bootstrapUrl}
     (same-origin mit der App → localStorage wird geteilt)
  3. Einen der beiden Buttons druecken:
     [1] Merge        — Kuehn bleibt, Musterfirma wird ergaenzt.
                        Fuer Koexistenz-Tests; kann zu
                        Kontext-Warnings fuer Kuehn-Anlagen fuehren.
     [2] Clean-Slate  — localStorage.clear(), dann nur Musterfirma
                        seeden. Saubere Isolations-Umgebung.
     Redirect-Ziel:   ${wizardUrl}

Hinweis zum Hash-Chain: Seed-Entries werden OHNE entry_hash/prev_hash
geschrieben. Der App-Validator \`verifyJournalChain\` ueberspringt
Entries ohne entry_hash tolerant (Legacy-Semantik). Sobald der User
eine neue Buchung via \`createEntry\` anlegt, startet die App eine
frische Hash-Kette ab JOURNAL_GENESIS_HASH.
============================================================
`;

console.log(summary);

