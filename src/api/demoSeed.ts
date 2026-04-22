// Demo-Seed für DEMO_MODE.
//
// Sprint 7.5: vollständige Musterfirma „Kühn Musterfirma GmbH"
// wird beim ersten Laden der App automatisch in den localStorage-
// Store geladen. Die Seed-Inhalte stammen aus
// `demo-input/musterfirma-2025/` (via Vite `?raw`-Import für die
// Journal-CSV; alle anderen Stammdaten sind als TypeScript-Objekte
// hartkodiert, damit die Ausführung deterministisch bleibt).
//
// Architektur-Entscheidungen (siehe docs/SPRINT-DEMO-PRE-CHECK.md
// + SPRINT-7-5-PLAN-DETAIL.md + SPRINT-7-5-DECISIONS.md):
//   - Entscheidung 21 B: Harouda bleibt Kanzlei, Kühn wird 4.
//     Mandant; seine client_id wird an alle 52 Buchungen verteilt.
//   - Entscheidung 31 A: Schulz/Meyer/Roth bleiben als Bestand-
//     Mandanten erhalten — Kühn kommt additiv dazu.
//   - Entscheidung 36 A: Kühn wird automatisch als aktiver
//     Mandant im MandantContext voreingestellt (sonst leere UI).

import { createAnlagegut } from "./anlagen";
import { createClient } from "./clients";
import { createCostCarrier } from "./costCarriers";
import { createCostCenter } from "./costCenters";
import { seedDemoData } from "./dashboard";
import { createEmployee } from "./employees";
import { createEntry } from "./journal";
import { store } from "./store";
import { parseGermanDate, parseJournalCsv } from "../domain/journal/csvImport";
import type {
  AfaMethode,
  Beschaeftigungsart,
  Steuerklasse,
} from "../types/db";
// Sprint 7.5 Phase 4: Vite `?raw`-Import der Musterfirma-CSV.
// Die Datei liegt außerhalb `public/` und wird zur Build-Zeit via
// Vite-Serialisierung als String ins Bundle geschrieben
// (Entscheidung 23 C). Typen kommen aus `src/vite-env.d.ts`.
import musterfirmaBuchungenCsv from "../../demo-input/musterfirma-2025/buchungen.csv?raw";

/** Sprint 7.5 (Entscheidung 26 B): FLAG-Key bekommt eine v2-Version,
 *  damit Altbestand-Demo-User beim nächsten App-Load automatisch den
 *  Musterfirma-Seed bekommen. Der alte v1-Key wird nach erfolgreicher
 *  Migration entfernt. */
const FLAG_KEY_V3 = "harouda:demo-seeded-v3";
const FLAG_KEY_V2_LEGACY = "harouda:demo-seeded-v2";
const FLAG_KEY_V1_LEGACY = "harouda:demo-seeded";
const SELECTED_MANDANT_KEY = "harouda:selectedMandantId";
const SELECTED_YEAR_KEY = "harouda:selectedYear";
const KUEHN_MANDANT_NR = "10100";
const MUSTERFIRMA_FISCAL_YEAR = "2025";

// --- Mandanten-Seeds -------------------------------------------------------

/**
 * Legt die Kühn Musterfirma GmbH als Mandanten an und gibt die
 * client_id zurück. Idempotent: existiert der Mandant bereits
 * (über mandant_nr), wird die bestehende id zurückgegeben.
 */
async function seedKuehnMusterfirma(): Promise<string> {
  const existing = store
    .getClients()
    .find((c) => c.mandant_nr === KUEHN_MANDANT_NR);
  if (existing) return existing.id;
  const client = await createClient({
    mandant_nr: KUEHN_MANDANT_NR,
    name: "Kühn Musterfirma GmbH",
    steuernummer: "66/123/45678",
    ust_id: "DE999888777",
    iban: "DE00000000000000000099",
  });
  return client.id;
}

/** Drei Bestand-Mandanten (Schulz / Meyer / Roth) wie in früheren
 *  Demo-Versionen. Für Benutzer, die mehrere Mandanten im Switcher
 *  sehen wollen. */
async function seedBestandsMandanten(): Promise<void> {
  const existingNrs = new Set(store.getClients().map((c) => c.mandant_nr));
  const bestand: Parameters<typeof createClient>[0][] = [
    {
      mandant_nr: "10001",
      name: "Schulz Bauunternehmung GmbH",
      steuernummer: "12/345/67890",
      ust_id: "DE123456789",
      iban: "DE89370400440532013000",
    },
    {
      mandant_nr: "10002",
      name: "Meyer Consulting GbR",
      steuernummer: "12/345/67891",
      ust_id: "DE234567890",
    },
    {
      mandant_nr: "10003",
      name: "Roth Metallverarbeitung GmbH",
      steuernummer: "12/345/67892",
      ust_id: "DE345678901",
    },
  ];
  for (const m of bestand) {
    if (!existingNrs.has(m.mandant_nr)) {
      await createClient(m);
    }
  }
}

// --- Stammdaten-Seed: KST / KTR / Mitarbeiter (Sprint 7.5 Phase 2) ---------

/** 5 Kostenstellen aus `demo-input/musterfirma-2025/kostenstellen.csv`.
 *  Alle aktiv, inkl. KST-PROD und KST-IT (nicht in Buchungen
 *  referenziert, aber im Dropdown sichtbar). */
const MUSTERFIRMA_KST: Readonly<
  {
    code: string;
    name: string;
    description: string;
  }[]
> = [
  {
    code: "KST-VERW",
    name: "Verwaltung",
    description: "Geschäftsleitung, Buchhaltung, Empfang",
  },
  {
    code: "KST-VERTRIEB",
    name: "Vertrieb",
    description: "Außendienst und Kundenbetreuung",
  },
  {
    code: "KST-EINKAUF",
    name: "Einkauf",
    description: "Beschaffung und Lieferantenmanagement",
  },
  {
    code: "KST-PROD",
    name: "Produktion",
    description: "Fertigung und Warenausgang",
  },
  {
    code: "KST-IT",
    name: "IT-Services",
    description: "Rechenzentrum, Lizenzen, Support",
  },
];

async function seedMusterfirmaKostenstellen(): Promise<void> {
  const existing = new Set(store.getCostCenters().map((c) => c.code));
  for (const k of MUSTERFIRMA_KST) {
    if (existing.has(k.code)) continue;
    await createCostCenter({
      code: k.code,
      name: k.name,
      description: k.description,
      is_active: true,
    });
  }
}

/** 2 Kostenträger aus `kostentraeger.csv`. */
const MUSTERFIRMA_KTR: Readonly<
  { code: string; name: string; description: string }[]
> = [
  {
    code: "PROJ-2025-WEB",
    name: "Webshop-Relaunch 2025",
    description: "Projekt Webshop-Migration auf neue Plattform",
  },
  {
    code: "PROJ-KUNDE-MUELLER",
    name: "Kunde-Müller-Auftrag",
    description: "Einzelauftrag Firma Müller",
  },
];

async function seedMusterfirmaKostentraeger(): Promise<void> {
  const existing = new Set(store.getCostCarriers().map((c) => c.code));
  for (const k of MUSTERFIRMA_KTR) {
    if (existing.has(k.code)) continue;
    await createCostCarrier({
      code: k.code,
      name: k.name,
      description: k.description,
      is_active: true,
    });
  }
}

/** Mapping CSV-„Beschaeftigung" → `Beschaeftigungsart`-Enum:
 *  „Vollzeit 40h" → vollzeit, „Teilzeit 20h" → teilzeit. */
type MusterfirmaMitarbeiter = {
  personalnummer: string;
  vorname: string;
  nachname: string;
  steuerklasse: Steuerklasse;
  kinderfreibetraege: number;
  beschaeftigungsart: Beschaeftigungsart;
  wochenstunden: number;
  bruttogehalt_monat: number;
  einstellungsdatum: string; // ISO YYYY-MM-DD
  krankenkasse: string;
};

/** 3 Mitarbeiter aus `mitarbeiter.csv`. Gemäß Entscheidung 32 C
 *  werden nur Pflichtfelder gesetzt; Steuer-ID, SV-Nummer, IBAN,
 *  Konto-Daten bleiben null (vermeidet Abmahnungs-Risiko bei
 *  fiktiven, nicht prüfsummen-validen Werten). */
const MUSTERFIRMA_MITARBEITER: Readonly<MusterfirmaMitarbeiter[]> = [
  {
    personalnummer: "1001",
    vorname: "Jana",
    nachname: "Kühn",
    steuerklasse: "III",
    kinderfreibetraege: 1.0,
    beschaeftigungsart: "vollzeit",
    wochenstunden: 40,
    bruttogehalt_monat: 6500,
    einstellungsdatum: "2020-03-01",
    krankenkasse: "Fiktiv-BKK",
  },
  {
    personalnummer: "1002",
    vorname: "Tim",
    nachname: "Schulz",
    steuerklasse: "I",
    kinderfreibetraege: 0.0,
    beschaeftigungsart: "vollzeit",
    wochenstunden: 40,
    bruttogehalt_monat: 3200,
    einstellungsdatum: "2022-04-01",
    krankenkasse: "Fiktiv-BKK",
  },
  {
    personalnummer: "1003",
    vorname: "Anna",
    nachname: "Fischer",
    steuerklasse: "IV",
    kinderfreibetraege: 0.5,
    beschaeftigungsart: "teilzeit",
    wochenstunden: 20,
    bruttogehalt_monat: 1800,
    einstellungsdatum: "2024-09-01",
    krankenkasse: "Fiktiv-AOK",
  },
];

async function seedMusterfirmaMitarbeiter(
  kuehnClientId: string
): Promise<void> {
  const existing = new Set(
    store.getEmployees().map((e) => e.personalnummer)
  );
  for (const m of MUSTERFIRMA_MITARBEITER) {
    if (existing.has(m.personalnummer)) continue;
    await createEmployee({
      personalnummer: m.personalnummer,
      vorname: m.vorname,
      nachname: m.nachname,
      steuer_id: null,
      sv_nummer: null,
      steuerklasse: m.steuerklasse,
      kinderfreibetraege: m.kinderfreibetraege,
      konfession: null,
      bundesland: null,
      einstellungsdatum: m.einstellungsdatum,
      austrittsdatum: null,
      beschaeftigungsart: m.beschaeftigungsart,
      wochenstunden: m.wochenstunden,
      bruttogehalt_monat: m.bruttogehalt_monat,
      stundenlohn: null,
      krankenkasse: m.krankenkasse,
      zusatzbeitrag_pct: null,
      privat_versichert: false,
      pv_kinderlos: false,
      pv_kinder_anzahl: Math.floor(m.kinderfreibetraege),
      iban: null,
      bic: null,
      kontoinhaber: null,
      notes: null,
      is_active: true,
    }, kuehnClientId);
  }
}

// --- Stammdaten-Seed: Anlagegüter (Sprint 7.5 Phase 3) ---------------------

type MusterfirmaAnlage = {
  inventar_nr: string;
  bezeichnung: string;
  /** Deutsch-Datum DD.MM.YYYY — wird intern nach ISO konvertiert
   *  (Entscheidung 35 B: Wiederverwendung von `parseGermanDate`). */
  anschaffungsdatum_de: string;
  anschaffungskosten: number;
  nutzungsdauer_jahre: number;
  afa_methode: AfaMethode;
  konto_anlage: string;
  konto_afa: string;
  notizen: string;
};

/** 8 Anlagen aus `anlagegueter.csv`. */
const MUSTERFIRMA_ANLAGEN: Readonly<MusterfirmaAnlage[]> = [
  {
    inventar_nr: "INV-2022-001",
    bezeichnung: "Telefonanlage Kanzlei",
    anschaffungsdatum_de: "15.05.2022",
    anschaffungskosten: 4200,
    nutzungsdauer_jahre: 8,
    afa_methode: "linear",
    konto_anlage: "0440",
    konto_afa: "4830",
    notizen: "Vorlauf Telefonanlage Gauss ComSys",
  },
  {
    inventar_nr: "INV-2023-001",
    bezeichnung: "Büromöbel Konferenzraum",
    anschaffungsdatum_de: "01.06.2023",
    anschaffungskosten: 8500,
    nutzungsdauer_jahre: 13,
    afa_methode: "linear",
    konto_anlage: "0420",
    konto_afa: "4830",
    notizen: "Sitzgruppe + Regale Kunde Riemann",
  },
  {
    inventar_nr: "INV-2024-001",
    bezeichnung: "PKW Firmenwagen Skoda Octavia",
    anschaffungsdatum_de: "15.03.2024",
    anschaffungskosten: 35000,
    nutzungsdauer_jahre: 6,
    afa_methode: "linear",
    konto_anlage: "0670",
    konto_afa: "4830",
    notizen: "Leasing-Ende, gekauft",
  },
  {
    inventar_nr: "INV-2024-002",
    bezeichnung: "Gabelstapler Linde H16D",
    anschaffungsdatum_de: "01.06.2024",
    anschaffungskosten: 22000,
    nutzungsdauer_jahre: 8,
    afa_methode: "linear",
    konto_anlage: "0300",
    konto_afa: "4830",
    notizen: "Lagerhalle Osnabrück-Ost",
  },
  {
    inventar_nr: "INV-2024-003",
    bezeichnung: "Laptop Geschäftsführung",
    anschaffungsdatum_de: "01.07.2024",
    anschaffungskosten: 1800,
    nutzungsdauer_jahre: 3,
    afa_methode: "linear",
    konto_anlage: "0440",
    konto_afa: "4830",
    notizen: "Dell XPS 15, Austausch alte Generation",
  },
  {
    inventar_nr: "INV-2025-001",
    bezeichnung: "Server-Schrank + USV",
    anschaffungsdatum_de: "02.01.2025",
    anschaffungskosten: 12000,
    nutzungsdauer_jahre: 5,
    afa_methode: "linear",
    konto_anlage: "0440",
    konto_afa: "4830",
    notizen: "IT-Raum, Sprint-Zugang 2025",
  },
  {
    inventar_nr: "INV-2025-002",
    bezeichnung: "Bürostuhl Geschäftsführung",
    anschaffungsdatum_de: "01.04.2025",
    anschaffungskosten: 350,
    nutzungsdauer_jahre: 1,
    afa_methode: "gwg_sofort",
    konto_anlage: "0480",
    konto_afa: "4840",
    notizen: "GWG § 6 Abs. 2 EStG",
  },
  {
    inventar_nr: "INV-2025-003",
    bezeichnung: "Monitor 27 Zoll Dell U2723",
    anschaffungsdatum_de: "01.02.2025",
    anschaffungskosten: 500,
    nutzungsdauer_jahre: 5,
    afa_methode: "sammelposten",
    konto_anlage: "0480",
    konto_afa: "4840",
    notizen: "Sammelposten § 6 Abs. 2a EStG",
  },
];

/**
 * Konvertiert DD.MM.YYYY → ISO YYYY-MM-DD. Wirft bei invalidem
 * Format einen Fehler — kein silent-skip (Entscheidung 37 C:
 * fail-loud). Nutzt `parseGermanDate` aus csvImport für Konsistenz
 * mit dem CSV-Import-Pfad (Entscheidung 35 B).
 */
function deDatumZuIso(de: string): string {
  const iso = parseGermanDate(de);
  if (!iso) {
    throw new Error(`Ungültiges deutsches Datum im Anlagen-Seed: ${de}`);
  }
  return iso;
}

async function seedMusterfirmaAnlagen(
  kuehnClientId: string
): Promise<void> {
  const existingInv = new Set(
    store.getAnlagegueter().map((a) => a.inventar_nr)
  );
  for (const a of MUSTERFIRMA_ANLAGEN) {
    if (existingInv.has(a.inventar_nr)) continue;
    await createAnlagegut({
      inventar_nr: a.inventar_nr,
      bezeichnung: a.bezeichnung,
      anschaffungsdatum: deDatumZuIso(a.anschaffungsdatum_de),
      anschaffungskosten: a.anschaffungskosten,
      nutzungsdauer_jahre: a.nutzungsdauer_jahre,
      afa_methode: a.afa_methode,
      konto_anlage: a.konto_anlage,
      konto_afa: a.konto_afa,
      notizen: a.notizen,
    }, kuehnClientId);
  }
}

// --- Journal-Bulk-Seed (Sprint 7.5 Phase 4) --------------------------------

/**
 * Liest die Musterfirma-CSV via Vite `?raw`-Import (Build-Time-String),
 * parst sie mit dem Journal-CSV-Importer und erzeugt für jede Zeile
 * einen `createEntry`-Aufruf mit `client_id = kuehnClientId`.
 *
 * Wichtig — Hash-Kette (GoBD Rz. 153-154): die Aufrufe MÜSSEN
 * sequentiell (await pro Iteration) erfolgen, weil `createEntry`
 * den vorigen `entry_hash` als `prev_hash` nutzt.
 *
 * Entscheidung 37 C: bei Parser-Fehlern wird geworfen und der
 * FLAG-Key NICHT gesetzt, damit der User die Inkonsistenz sieht.
 */
async function seedMusterfirmaJournal(kuehnClientId: string): Promise<void> {
  if (store.getEntries().length > 0) {
    // Idempotenz: Journal bereits befüllt (z. B. durch seedDemoData-
    // Button-Pfad). Kein Re-Seed.
    return;
  }
  const parsed = parseJournalCsv(musterfirmaBuchungenCsv);
  if (parsed.errors.length > 0) {
    throw new Error(
      `Demo-CSV-Parse-Fehler in buchungen.csv: Zeile ${parsed.errors[0].line}: ${parsed.errors[0].message}`
    );
  }
  for (const row of parsed.rows) {
    await createEntry({
      datum: row.datum,
      beleg_nr: row.beleg_nr,
      beschreibung: row.beschreibung,
      soll_konto: row.soll_konto,
      haben_konto: row.haben_konto,
      betrag: row.betrag.toNumber(),
      ust_satz: row.ust_satz === 0 ? null : row.ust_satz,
      status: "gebucht",
      client_id: kuehnClientId,
      skonto_pct: row.skonto_pct,
      skonto_tage: row.skonto_tage,
      gegenseite: null,
      faelligkeit: null,
      kostenstelle: row.kostenstelle,
      kostentraeger: row.kostentraeger,
    });
  }
}

// --- Settings-Seed ---------------------------------------------------------

function seedKanzleiSettings(): void {
  const settingsKey = "harouda:settings";
  if (localStorage.getItem(settingsKey)) return;
  localStorage.setItem(
    settingsKey,
    JSON.stringify({
      kanzleiName: "Harouda Steuerberatung",
      kanzleiStrasse: "Musterstraße 1",
      kanzleiPlz: "10115",
      kanzleiOrt: "Berlin",
      kanzleiTelefon: "+49 30 1234567",
      kanzleiEmail: "kontakt@harouda-demo.local",
      kanzleiIban: "DE89370400440532013000",
      kanzleiBic: "COBADEFFXXX",
      defaultSteuernummer: "12/345/67890",
      elsterBeraterNr: "1234567",
      kleinunternehmer: false,
      basiszinssatzPct: 2.27,
      verzugszinsenB2B: true,
      mahngebuehrStufe1: 0,
      mahngebuehrStufe2: 5,
      mahngebuehrStufe3: 10,
      stufe1AbTagen: 7,
      stufe2AbTagen: 21,
      stufe3AbTagen: 45,
    })
  );
}

/** Setzt den Kühn-Mandanten als aktiven Eintrag im Mandant-Switcher
 *  (Entscheidung 36 A). Wird nur gesetzt, wenn noch keine Auswahl
 *  existiert — der User überschreibt bewusst seine eigene Wahl nicht. */
function setKuehnAsDefaultMandant(kuehnId: string): void {
  if (!localStorage.getItem(SELECTED_MANDANT_KEY)) {
    localStorage.setItem(SELECTED_MANDANT_KEY, kuehnId);
  }
}

// --- v1-Legacy-Migration (Sprint 7.5 Phase 6) ------------------------------

/**
 * Räumt die durch den v1-Demo-Seed angelegten Stores granular ab
 * (Entscheidung 33 C): entries, clients, anlagegueter, afa_buchungen,
 * costCenters, costCarriers, employees. Konten + Settings + Audit-Log
 * bleiben erhalten (die sind in v1 und v2 identisch oder
 * user-spezifisch).
 *
 * Wird nur aufgerufen, wenn der v1-FLAG gesetzt ist und der v2-FLAG
 * noch nicht — also einmalig beim ersten App-Load nach dem Sprint-7.5-
 * Upgrade.
 */
function clearLegacyDemoData(): void {
  store.setEntries([]);
  store.setClients([]);
  store.setAnlagegueter([]);
  store.setAfaBuchungen([]);
  store.setCostCenters([]);
  store.setCostCarriers([]);
  store.setEmployees([]);
  localStorage.removeItem(SELECTED_MANDANT_KEY);
  // Sprint 7.5 Fix (B2): altes selectedYear entfernen, damit der
  // neue Seed den Musterfirma-Jahrgang 2025 setzen kann.
  localStorage.removeItem(SELECTED_YEAR_KEY);
}

/**
 * Sprint 7.5 Fix (B4): Erkennt pre-7.5-Orphan-State — Store enthält
 * Entries/Clients, aber KEIN Kühn-Mandant und KEIN FLAG. Typischer
 * Fall: alte seedDemoData-Aufrufe mit 15 isoDaysAgo-Buchungen ohne
 * client_id oder frühe Sprint-1..6-Manual-Anlagen, die beim ersten
 * Sprint-7.5-Upgrade-Load sichtbar werden.
 *
 * Wahre User-Daten (= User hat selbst den Kühn-Mandant eingegeben)
 * werden NICHT als Orphans klassifiziert — Heuristik: Kühn-Mandant
 * (mandant_nr === "10100") existiert.
 */
function detectOrphanLegacyState(): boolean {
  const hasData =
    store.getEntries().length > 0 || store.getClients().length > 0;
  if (!hasData) return false;
  const hasKuehn = store
    .getClients()
    .some((c) => c.mandant_nr === KUEHN_MANDANT_NR);
  return !hasKuehn;
}

/**
 * Sprint 7.5 Fix (B2): Schreibt das Musterfirma-Jahr (2025) in den
 * selectedYear-localStorage-Key, damit `YearProvider` beim Init das
 * Filter-Jahr auf den Seed-Datenbestand aligniert. Überschreibt eine
 * abweichende User-Auswahl NICHT — User-Wahl hat Vorrang.
 */
function ensureSelectedYearForMusterfirma(): void {
  if (!localStorage.getItem(SELECTED_YEAR_KEY)) {
    localStorage.setItem(SELECTED_YEAR_KEY, MUSTERFIRMA_FISCAL_YEAR);
  }
}

// --- Haupt-Orchestrator ----------------------------------------------------

export async function autoSeedDemoIfNeeded(): Promise<void> {
  // --- Synchroner Prefix ---------------------------------------------------
  // Läuft in main.tsx VOR createRoot().render(), damit YearProvider das
  // richtige selectedYear auf dem Init-State findet (B2). Entscheidungs-
  // Branching basiert hier noch komplett auf localStorage/store — erst
  // nach diesem Abschnitt beginnt `await`-Arbeit.

  // v3 bereits gesetzt → nichts zu tun.
  if (localStorage.getItem(FLAG_KEY_V3) === "1") return;

  // v2-Legacy-Migration (Audit 2026-04-20 P1-01): CSV EB-005 hatte in
  // der v2-Saat Konto 0800 (Beteiligungen aktiva) statt 2300 (Gezeichnetes
  // Kapital passiva) → unbalancierte Bilanz. Neue v3-Daten verlangen Full-
  // Re-Seed. Analog auch v1-Legacy bereinigen.
  if (
    localStorage.getItem(FLAG_KEY_V2_LEGACY) === "1" ||
    localStorage.getItem(FLAG_KEY_V1_LEGACY) === "1"
  ) {
    clearLegacyDemoData();
  } else if (detectOrphanLegacyState()) {
    // Sprint 7.5 Fix (B4): Orphan-State ohne FLAG — typisch für User,
    // die vor dem Sprint-7.5-Upgrade bereits mit der App gespielt haben.
    // Keine Kühn-Mandant in store.clients → die Daten sind Altbestand,
    // werden wie v1-Legacy behandelt (granulares Clearing + Neu-Seed).
    clearLegacyDemoData();
  } else if (
    store.getEntries().length > 0 ||
    store.getClients().length > 0
  ) {
    // Store enthält Kühn-Mandant → User hat Sprint-7.5-Seed bereits
    // einmal durchlaufen oder manuell Kühn angelegt. Respekt: kein
    // Re-Seed, nur FLAG-v3 setzen (Idempotenz).
    localStorage.setItem(FLAG_KEY_V3, "1");
    ensureSelectedYearForMusterfirma();
    return;
  }

  // Sprint 7.5 Fix (B2): Jahresumschalter synchron auf 2025 setzen,
  // damit die 52 Musterfirma-Buchungen nach dem Seed sichtbar sind.
  // `localStorage` ist persistenter Init-State für `YearProvider`.
  ensureSelectedYearForMusterfirma();

  // --- Asynchrone Seed-Sequenz --------------------------------------------
  try {
    // Kühn ZUERST anlegen, damit seine id der Kandidat für den
    // Default-Selected-Mandanten ist (Entscheidung 36).
    const kuehnId = await seedKuehnMusterfirma();
    // Kühn-ID durch alle Musterfirma-Seed-Aufrufe tunneln, damit
    // Mitarbeiter / Anlagen / Journal demselben Mandanten zugeordnet
    // werden (Migration 0026 Multi-Tenancy-Zuordnung).
    await seedBestandsMandanten();

    // Kontenplan (SKR03) seeden; seedDemoData enthält seit Sprint 7.5
    // keine Journal-Einträge mehr (Entscheidung 22 A — die 15
    // isoDaysAgo-Einträge wurden entfernt).
    await seedDemoData();

    // Sprint 7.5 Phase 2: Stammdaten-Seed für die Musterfirma.
    await seedMusterfirmaKostenstellen();
    await seedMusterfirmaKostentraeger();
    await seedMusterfirmaMitarbeiter(kuehnId);

    // Sprint 7.5 Phase 3: Anlagegüter-Seed (8 Anlagen mit DE→ISO-
    // Datumskonversion).
    await seedMusterfirmaAnlagen(kuehnId);

    // Sprint 7.5 Phase 4: 52 Journal-Einträge aus der Musterfirma-CSV
    // (Vite `?raw`-Import), alle mit client_id=Kühn. Sequentielles
    // await ist Pflicht wegen GoBD-Hash-Kette.
    await seedMusterfirmaJournal(kuehnId);

    seedKanzleiSettings();
    setKuehnAsDefaultMandant(kuehnId);

    // Erfolg — v3-FLAG setzen, ältere Legacy-FLAGs entfernen.
    localStorage.setItem(FLAG_KEY_V3, "1");
    localStorage.removeItem(FLAG_KEY_V2_LEGACY);
    localStorage.removeItem(FLAG_KEY_V1_LEGACY);
  } catch (err) {
    // Sprint 7.5 Fix (B6): fail-loud per Entscheidung 37 C — nach dem
    // console.error-Log wird die Exception weitergereicht, damit das
    // unhandledrejection-Handling in `installGlobalErrorHandlers` sie
    // loggt/anzeigt. v3-FLAG wird bewusst NICHT gesetzt, damit der
    // Seed beim nächsten Reload erneut versucht wird.
    console.error("Demo seed failed:", err);
    throw err;
  }
}
