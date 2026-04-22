# Sprint 7.5 Detail-Plan — Musterfirma automatisch ins Demo seeden

Freigabe-Grundlage: `docs/SPRINT-DEMO-PRE-CHECK.md` + User-Freigabe
der Entscheidungs-Matrix 21-30 am 2026-04-20.

Baseline: **951 Tests / 62 Dateien**.

---

## Phase 0 — Zusatz-Befunde zum Pre-Check

Ergänzungen über das hinaus, was der Haupt-Pre-Check bereits
dokumentiert hat.

### 0.1 KST-/KTR-Referenzen in `buchungen.csv` (awk-Grep)

Ausgewertet via `awk -F';' 'NR>1 {print $8"|"$9}' ... | sort -u`:

| KST-Code | Referenziert? | Aktion |
|---|---|---|
| `KST-VERW` | ✓ | muss im Seed verfügbar sein |
| `KST-VERTRIEB` | ✓ | muss verfügbar sein |
| `KST-EINKAUF` | ✓ | muss verfügbar sein |
| `KST-PROD` | **nein** (aber in `kostenstellen.csv` gelistet) | seed trotzdem, für UI-Dropdown-Vollständigkeit |
| `KST-IT` | **nein** (aber in `kostenstellen.csv` gelistet) | seed trotzdem |

| KTR-Code | Referenziert? | Aktion |
|---|---|---|
| `PROJ-2025-WEB` | ✓ | muss verfügbar sein |
| `PROJ-KUNDE-MUELLER` | ✓ | muss verfügbar sein |

**Konsequenz:** Phase 2 seedet **alle 5 KST + alle 2 KTR** aus der
CSV, auch wenn nur 3 KST in den Buchungen referenziert werden.

### 0.2 Eröffnungsbilanz-Konten-Cross-Check

Konten-Paare der ersten 8 buchungen.csv-Zeilen (EB-001..008):

| Beleg | Soll | Haben | SKR03-Seed heute? |
|---|---|---|---|
| EB-001 | 0440 | **9000** | 0440 ✓, **9000 FEHLT** |
| EB-002 | 1200 | **9000** | 1200 ✓, **9000 FEHLT** |
| EB-003 | 1000 | **9000** | 1000 ✓, **9000 FEHLT** |
| EB-004 | 1400 | **9000** | 1400 ✓, **9000 FEHLT** |
| EB-005 | **9000** | 0800 | **9000 FEHLT**, 0800 ✓ (aber falsches Label!) |
| EB-006 | **9000** | **0860** | **9000 FEHLT**, **0860 FEHLT** |
| EB-007 | **9000** | 1600 | **9000 FEHLT**, 1600 ✓ |
| EB-008 | **9000** | 1770 | **9000 FEHLT**, 1770 ✓ |

**Kritischer Befund:** **9000 (Eröffnungsbilanzkonto) und 0860
(Gewinnvortrag) fehlen komplett im `SKR03_SEED`.** Ohne Ergänzung
würden die 8 Eröffnungsbilanz-Buchungen bei `createEntry` vermutlich
nicht validiert (je nach Konten-Existenz-Prüfung), aber zumindest
würde Bilanz-/GuV-Builder sie als „unmappedAccounts" ausweisen.

**Nebenbefund (nicht Sprint-7.5-Scope):** Konto 0800 ist im
SKR03_SEED als „Beteiligungen an verbundenen Unternehmen" (aktiva)
gelabelt, die `firma.json` bezeichnet 0800 als „Gezeichnetes
Kapital". Das ist eine bestehende Label-Inkonsistenz — das
Gezeichnete Kapital sollte fachlich auf 2300 liegen (existiert
unter „Grundkapital / Gezeichnetes Kapital", passiva). Die
buchungen.csv EB-005 bucht mit Beschreibung-Text „Eröffnungsbilanz
Gezeichnetes Kapital" auf **0800**, was dem ursprünglichen
Demo-Design entspricht — Sprint 7.5 respektiert das und
dokumentiert die Inkonsistenz für einen späteren Refactor.

### 0.3 Vite `?raw`-Import-Pattern — **noch nicht im Repo**

Grep `\?raw|import.meta.glob|vite/client` auf `src/` → **0 Treffer**.
Keine `src/vite-env.d.ts`-Datei existiert.

**Konsequenz:** Phase 4 muss eine `src/vite-env.d.ts`-Deklaration
hinzufügen (Standard-Vite-Typen-Einbindung):

```ts
/// <reference types="vite/client" />
```

Damit werden `?raw`-Imports (`import buchungenCsv from '…/buchungen.csv?raw';`)
TypeScript-typisiert. Vite serialisiert den Datei-Inhalt beim
Build als String in das Bundle.

### 0.4 `createAnlagegut`-Signatur (Pflichtfelder)

Aus `src/api/anlagen.ts:20-29`:

```ts
type AnlagegutInput = {
  inventar_nr: string;           // Pflicht, max 20 Zeichen
  bezeichnung: string;           // Pflicht, max 100
  anschaffungsdatum: string;     // Pflicht, ISO YYYY-MM-DD
  anschaffungskosten: number;    // Pflicht, > 0
  nutzungsdauer_jahre: number;   // Pflicht, 1..50 ganzzahlig
  afa_methode: AfaMethode;       // 'linear'/'gwg_sofort'/'sammelposten'
  konto_anlage: string;          // Pflicht
  konto_afa: string;             // Pflicht
  konto_abschreibung_kumuliert?: string | null;
  notizen?: string | null;
}
```

**Datum-Format-Konflikt:** `anlagegueter.csv` nutzt deutsches Format
(`15.05.2022`), `createAnlagegut` verlangt ISO (`2022-05-15`). Der
Seed muss die 8 Datum-Felder konvertieren. Pattern: wiederverwendete
`parseGermanDate` aus `src/domain/journal/csvImport.ts` oder
inline-Helper.

### 0.5 Phase-0-Fazit (ergänzend)

- Seed-Ergänzung um **2 SKR03-Konten** (9000, 0860) nötig, sonst
  brechen Eröffnungsbilanz-Buchungen.
- `vite-env.d.ts` muss **neu angelegt** werden (Vite-Pattern erstes
  Mal im Projekt).
- Datum-Konvertierung DE→ISO für Anlagegüter ist ein **kleiner
  Helper**, keine echte Hürde.
- Der Bestand-Konflikt 0800 (Label vs. Buchung) ist **nicht**
  Sprint-7.5-Scope (dokumentieren, späterer Sprint).

---

## 1. Phasen-Plan

### Phase 1 — Firma-Settings + Mandant Kühn anlegen

**Ziel:** Harouda bleibt Kanzlei (Entscheidung 21 Option B). Kühn
Musterfirma wird als 4. Mandant angelegt und als aktiver Mandant
im Mandant-Switcher vorausgewählt.

**Betroffene Dateien:**
- `src/api/demoSeed.ts` — neue `seedMusterfirmaClient()`-Hilfe
  + Eintrag in `autoSeedDemoIfNeeded()`
- `src/contexts/MandantContext.tsx` — prüfen, ob es einen
  „aktiven Mandant"-State gibt; ggf. auf Kühn-ID voreinstellen

**Code-Skizze (Signaturen, keine Implementation):**
```ts
// demoSeed.ts
async function seedKuehnMusterfirma(): Promise<string /* client_id */> {
  const existing = store.getClients().find(c => c.mandant_nr === "10100");
  if (existing) return existing.id;
  const client = await createClient({
    mandant_nr: "10100",
    name: "Kühn Musterfirma GmbH",
    steuernummer: "66/123/45678",
    ust_id: "DE999888777",
    // ... aus firma.json
  });
  return client.id;
}
```

**Sub-Frage (siehe Matrix unten, Frage 31):** Bestand-Mandanten
Schulz/Meyer/Roth weiterhin seeden oder durch Kühn ersetzen?

**Erwartete Tests:** 0 in dieser Phase (reine Daten-Setups).

**Risiken:**
- Mandant-Switcher-Kontext könnte den erstangelegten Mandanten
  als „selected" verwenden → Reihenfolge: Kühn **zuerst** anlegen,
  dann Bestand-Mandanten.
- Falls ein Test `main.tsx` rendert: autoSeed triggert 4 Mandanten
  statt 3 — niedrige Wahrscheinlichkeit.

**Reversibilität:** trivial — Kühn-Client löschen.

### Phase 2 — Stammdaten-Seed (SKR03-Zusatz + Mitarbeiter + KST + KTR)

**Ziel:** Fehlende SKR03-Konten ergänzen; 3 Mitarbeiter, 5 KST,
2 KTR aus CSVs als hardcoded TypeScript-Objekte seeden.

**Betroffene Dateien:**
- `src/api/skr03.ts` — **zwei neue Konten** ergänzen:
  - `a("0860", "Gewinnvortrag vor Verwendung", "passiva")`
  - `a("9000", "Eröffnungsbilanzkonto", "passiva")` — SKR03-Standard
- `src/api/demoSeed.ts` — neue async Helper:
  - `seedMusterfirmaMitarbeiter(companyId?)`
  - `seedMusterfirmaKostenstellen(companyId?)`
  - `seedMusterfirmaKostentraeger(companyId?)`

**Code-Skizze:**
```ts
const MUSTERFIRMA_MITARBEITER = [
  { personalnummer: "1001", vorname: "Jana", nachname: "Kühn", ... },
  { personalnummer: "1002", vorname: "Tim",  nachname: "Schulz", ... },
  { personalnummer: "1003", vorname: "Anna", nachname: "Fischer", ... },
] as const;

const MUSTERFIRMA_KST = [
  { code: "KST-VERW", name: "Verwaltung", ... },
  // 4 weitere
] as const;
```

**Sub-Frage (Frage 32):** Welcher EmployeeInput-Shape genau? Die
CSV hat Spalten Steuerklasse + Kinderfreibetrag + Krankenkasse +
Sozialversicherungspflicht — muss 1:1 auf `EmployeeInput` gemappt
werden.

**Erwartete Tests:** 2 — „SKR03-Seed enthält 9000 + 0860" +
„Demo-Seed liefert 5 KST/2 KTR".

**Risiken:**
- Bestehende UstvaBuilder-Tests prüfen potenziell, dass 9000
  **nicht** im Mapping ist (um UStVA-Clean-Check). Phase-2-Abschluss:
  `vitest run` mit Fokus auf UStVA-/Bilanz-Tests.
- `createEmployee`-Validierung könnte beim IBAN-Regex-Check
  fehlschlagen (echte Mitarbeiter-CSV hat evtl. keine IBAN — prüfen).

**Reversibilität:** leicht — Konten-Einträge und Helper-Calls
entfernen.

### Phase 3 — Anlagegüter-Seed (8 Anlagen)

**Ziel:** Alle 8 Anlagen aus `anlagegueter.csv` via
`createAnlagegut` programmatisch anlegen.

**Betroffene Dateien:**
- `src/api/demoSeed.ts` — `seedMusterfirmaAnlagen()`

**Code-Skizze:**
```ts
function parseGermanDateToIso(de: string): string {
  // "15.05.2022" → "2022-05-15"; sicherer Wrapper mit Throw bei Invalid
}

const MUSTERFIRMA_ANLAGEN = [
  {
    inventar_nr: "INV-2022-001",
    bezeichnung: "Telefonanlage Kanzlei",
    anschaffungsdatum: parseGermanDateToIso("15.05.2022"),
    anschaffungskosten: 4200,
    nutzungsdauer_jahre: 8,
    afa_methode: "linear" as const,
    konto_anlage: "0440",
    konto_afa: "4830",
    notizen: "Vorlauf Telefonanlage Gauss ComSys",
  },
  // 7 weitere
];

async function seedMusterfirmaAnlagen(): Promise<void> {
  for (const a of MUSTERFIRMA_ANLAGEN) {
    await createAnlagegut(a); // sequentiell, createAnlagegut validiert
  }
}
```

**Erwartete Tests:** 2 — „8 Anlagen seeded" + „AfA-Vorschau
korrekt (Sum-Check über linear/GWG/Sammelposten-Methoden)".

**Risiken:**
- Datum-Parser muss robust sein (kein try/catch-Swallow; bei
  Invalid Throw) — sonst landet ein leerer String in
  `createAnlagegut`, das wirft einen Fehler.

**Reversibilität:** trivial.

### Phase 4 — Journal-Bulk-Seed (52 Einträge via Vite `?raw`)

**Ziel:** Alle 52 Musterfirma-Buchungen aus `buchungen.csv` via
Vite `?raw`-Import + `parseJournalCsv` einmal parsen und
sequentiell via `createEntry` seeden. Alle Einträge bekommen
`client_id = Kühn-ID` aus Phase 1.

**Betroffene Dateien:**
- `src/vite-env.d.ts` — **neu** angelegt mit
  `/// <reference types="vite/client" />`
- `src/api/demoSeed.ts` — `seedMusterfirmaJournal(kuehnClientId)`
- `src/api/dashboard.ts` — **die 15 hardcoded Einträge aus
  `seedDemoData()` entfernen** (Entscheidung 22 Option A).
- `src/pages/DashboardPage.tsx` — Button „Demo-Daten laden" bleibt
  funktional; `seedDemoData` ruft intern die neuen Helper auf.

**Code-Skizze:**
```ts
import buchungenCsv from "../../demo-input/musterfirma-2025/buchungen.csv?raw";
import { parseJournalCsv } from "../domain/journal/csvImport";
import { createEntry } from "./journal";

async function seedMusterfirmaJournal(kuehnClientId: string): Promise<void> {
  const parsed = parseJournalCsv(buchungenCsv);
  if (parsed.errors.length > 0) {
    throw new Error(`Demo-CSV-Parse-Fehler: ${parsed.errors[0].message}`);
  }
  for (const row of parsed.rows) {
    await createEntry({
      datum: row.datum,
      beleg_nr: row.beleg_nr,
      beschreibung: row.beschreibung,
      soll_konto: row.soll_konto,
      haben_konto: row.haben_konto,
      betrag: row.betrag.toNumber(),
      ust_satz: row.ust_satz,
      status: "gebucht",
      client_id: kuehnClientId,
      skonto_pct: row.skonto_pct,
      skonto_tage: row.skonto_tage,
      gegenseite: null, // aus Beschreibung nicht extrahiert
      faelligkeit: null,
      kostenstelle: row.kostenstelle,
      kostentraeger: row.kostentraeger,
    });
  }
}
```

**Erwartete Tests:** 5 — „parseJournalCsv(buchungenCsv) liefert
52 rows ohne errors", „Hash-Kette intakt nach 52 Einträgen",
„alle Einträge haben client_id=KuehnID", „KST-Verteilung
korrekt", „Skonto-Felder auf 3 Einträgen gesetzt".

**Risiken:**
- **Vite-Bundle-Size:** 52-Zeilen-CSV ist ~3 KB, irrelevant.
- **Hash-Kette:** sequentielles `await` ist Pflicht (siehe
  Pre-Check 4.2). Test deckt das ab.
- **Konten-Existenz-Check:** `createEntry` prüft heute KEINE
  Konto-Existenz — wenn 9000/0860 fehlen, passiert nichts Böses
  in Seed, aber Bilanz/GuV zeigen Unmapped. Phase 2 schließt das.
- **CSV-Parse-Fehler:** Fiscal-Year-Check in `parseJournalCsv` ist
  optional (kein `options`-Parameter übergeben → kein Check). Die
  Einträge aus 2022-2024 (EB-Zeilen haben Jahre-Buchungen haben
  alle 2025) sollten passen.

**Reversibilität:** mittel — die 15 Bestand-Einträge müssen aus
`dashboard.ts` gelöscht werden; Revert via Git.

### Phase 5 — AfA-Lauf 2025 bewusst NICHT geseedet (Entscheidung 25 B)

**Ziel:** Keine automatische `commitAfaLauf`-Aufruf im Seed. Die
acht Anlagen sind vorhanden, `planAfaLauf(2025, anlagen)` wird
beim Öffnen von `/anlagen/afa-lauf` live berechnet, User bucht
manuell.

**Betroffene Dateien:** keine.

**Doku:** Im README Schritt 14d wird ergänzt, dass der AfA-Lauf
**nicht** automatisch gebucht wird — User-Pflicht.

**Erwartete Tests:** 0 (Verhalten = Status quo von Sprint 6
Teil 1).

**Risiken:** keine.

**Reversibilität:** trivial (bei Meinungsumschwung: 5 Zeilen Seed
ergänzen).

### Phase 6 — autoSeedDemoIfNeeded Integration + FLAG v2

**Ziel:** `autoSeedDemoIfNeeded()` orchestriert alle Phase-1-bis-4-
Helper. FLAG-Key-Upgrade auf `harouda:demo-seeded-v2` mit
Clear-Logik bei vorhandenem v1.

**Betroffene Dateien:**
- `src/api/demoSeed.ts` — Haupt-Orchestrator

**Code-Skizze:**
```ts
const FLAG_KEY_V2 = "harouda:demo-seeded-v2";
const FLAG_KEY_V1_LEGACY = "harouda:demo-seeded";

export async function autoSeedDemoIfNeeded(): Promise<void> {
  if (localStorage.getItem(FLAG_KEY_V2) === "1") return;

  // v1-Legacy: alten FLAG + alte Daten löschen, sauber neu seeden
  if (localStorage.getItem(FLAG_KEY_V1_LEGACY) === "1") {
    // Daten-Clear: wir löschen nur die Teile, die der alte Seed
    // geschrieben hat — Konten bleiben (die sind bei v1 und v2
    // identisch).
    clearLegacyDemoData();
  }

  try {
    await seedKanzleiHarouda();          // Phase 1 Teil 1: Harouda-Settings
    await seedBestandsMandanten();        // Phase 1 Teil 2: Schulz/Meyer/Roth (Entscheidung 31)
    const kuehnId = await seedKuehnMusterfirma(); // Phase 1 Teil 3

    await seedMusterfirmaKostenstellen();  // Phase 2
    await seedMusterfirmaKostentraeger();
    await seedMusterfirmaMitarbeiter();

    await seedMusterfirmaAnlagen();        // Phase 3

    await seedMusterfirmaJournal(kuehnId); // Phase 4

    localStorage.setItem(FLAG_KEY_V2, "1");
    localStorage.removeItem(FLAG_KEY_V1_LEGACY);
  } catch (err) {
    console.error("Demo seed v2 failed:", err);
  }
}

function clearLegacyDemoData(): void {
  // Nur für User, die den v1-FLAG haben: räume die von v1 erzeugten
  // Journal-Einträge (Beleg-Nr AR-2025-03x..042, ER-2025-007..014)
  // und die 3 Bestand-Mandanten ab, um Dubletten zu vermeiden.
  // Konten + Settings bleiben stehen (identisch zwischen v1 und v2).
}
```

**Sub-Frage (Frage 33):** `clearLegacyDemoData` — welcher Store-
Zustand wird wie granular gelöscht? Konten bleiben? Settings?

**Erwartete Tests:** 3 — „FLAG-v2 setzt nach Seed", „v1→v2-
Migration räumt alte Daten", „mehrfacher autoSeed-Call ist
idempotent".

**Risiken:**
- **Datenschutz-lastige Stores:** nicht betroffen (Demo-Mode hat
  keine DSGVO-kritischen Daten).
- **Test-Setup:** happy-dom-localStorage muss `.clear()` in test
  `beforeEach` aufrufen, sonst könnten Zustände leaken.

**Reversibilität:** mittel — v1-Legacy-Clear ist semi-invasiv.

### Phase 7 — Test-Lauf + Doku

**Betroffene Dateien:**
- `docs/SPRINT-7-5-DECISIONS.md` (neu) — Entscheidungen 21-30 +
  Sub-Entscheidungen aus Matrix unten
- `docs/NEXT-CLAUDE-HANDOFF.md` (update)
- `CLAUDE.md` (Test-Count + neuer Demo-Stand)
- `demo-input/musterfirma-2025/README.md` — Hinweis „automatisch
  geseedet seit Sprint 7.5, manuelle CSV-Import-Route optional"

**Test-Erwartung:** Baseline 951 → **~965** (+14, konservativ).

---

## 2. Entscheidungs-Matrix für Sub-Fragen

Fragen, die während der Implementierung auftauchen **und nicht
autonom entschieden werden sollten**.

| Nr. | Frage | Optionen | Vorschlag | Reversibilität |
|---:|---|---|---|---|
| 31 | Bestand-Mandanten (Schulz/Meyer/Roth) beibehalten oder durch Kühn ersetzen? | A 3 Bestand bleiben + Kühn wird 4. Mandant; B 3 Bestand entfernen, nur Kühn; C 3 Bestand bleiben, aber Kühn wird Default-Selected | **A** — Mandant-Switcher-UI zeigt Auswahl-Möglichkeit, kein Verlust bisheriger Demo-Daten. | leicht |
| 32 | `EmployeeInput`-Pflichtfelder jenseits der CSV — Steuer-ID, IBAN etc. sind nicht in der CSV: hardcoden, null lassen oder leer? | A hardcoden mit fiktiven Werten (bewusst nicht prüfsummenvalid); B Felder `null`/leer lassen; C Minimal-Set mit nur Pflichtfeldern | **C** — nur Pflichtfelder aus `EmployeeInput.validate()` setzen; optionale Felder bleiben undefined. Vermeidet Abmahnungs-Risiko bei falschen Steuer-IDs. | trivial |
| 33 | `clearLegacyDemoData()`-Granularität — welche Stores werden bei v1→v2-Migration geleert? | A nur `entries` + `clients` (v1 hat nur diese); B Voll-Clear (`localStorage.clear()`); C Granular: `entries` + `clients` + `anlagegueter` + `afa_buchungen` + `costCenters` + `costCarriers` + `employees` | **C** — granular, explizit benannt; Schutz vor unbeabsichtigtem Löschen anderer localStorage-Keys (CookieConsent, AppLog etc.). | leicht |
| 34 | `9000`-Konto-Kategorie: `passiva` oder `aktiva`? | A passiva (SKR03-Standard nach DATEV); B aktiva; C ohne Kategorie | **A passiva** — so ist 9000 in `firma.json` gedanklich als Eröffnungsbilanzkonto definiert (obwohl es technisch ein Verrechnungskonto ist, SKR03-Standard ordnet es passiva zu). | trivial |
| 35 | Datum-Konvertierer: inline-Helper im Seed oder Wiederverwendung von `parseGermanDate` aus `csvImport.ts`? | A inline-Helper (duplizierter Code); B Import aus `csvImport.ts` (abhängig von Domain-Modul im API-Layer); C neuer Helper in `src/lib/date/` | **B** — `parseGermanDate` in csvImport ist pure function, der Layer-Crossing ist akzeptabel (ähnlich wie `api/anlagen.ts` bereits `AfaCalculator` importiert). | leicht |
| 36 | Soll der Kühn-Mandant automatisch als „aktiv" im Mandant-Switcher vorausgewählt werden? | A ja (Default nach Seed); B nein (User wählt selbst) | **A** — sonst sieht der Demo-Login leere Tabellen (weil bestehende UI-Seiten möglicherweise auf `selectedMandantId` filtern). | mittel |
| 37 | Fallback bei parseJournalCsv-Fehler im Seed — Throw oder Skip? | A Throw (Demo bleibt leer, Error im Console); B Skip kaputte Zeile, weiter (Seed resilient); C Abort nach erstem Fehler, FLAG-v2 NICHT setzen | **C** — Fehler ist Fehler, User sieht leere Daten und kann manuell nachsteuern; silent-skip würde inkonsistente Demo erzeugen. | leicht |

**Empfehlung für Sprint-7.5-Start:** Fragen 31-37 mit den
Vorschlägen akzeptieren; bei Zweifel beim tatsächlichen
Implementieren in `SPRINT-7-5-FRAGEN.md` dokumentieren.

---

## 3. Scope-Grenzen

- **Hash-Kette unverändert** — sequentielle `createEntry`-Aufrufe
  nutzen die bestehende Logik.
- **Bestehende 951 Tests bleiben grün** — kein Test wird geändert,
  nur neue Tests ergänzt.
- **Keine neue Migration** — nur `src/api/skr03.ts` bekommt 2 neue
  Konten-Einträge (additiv).
- **Keine neuen npm-Dependencies** — Vite bringt `?raw`-Support
  nativ mit.
- **TypeScript strict + Decimal.js durchgängig** — `parseJournalCsv`
  liefert bereits Decimal-Beträge.

**Explizit NICHT in Sprint 7.5:**
- Bank-Transaktions-Entity + MT940-Auto-Import (Entscheidung 24 B)
- Korrektur der 0800-Label-Inkonsistenz (eigener Mini-Sprint)
- SupplierPreference-Seed (Entscheidung 27 B)
- Dreiecksgeschäfte § 25b UStG (Sprint-8-Kandidat g)
- Personenkonten-Umbau (Sprint-8-Kandidat e)
- AfA-Lauf 2025 automatisch buchen (Entscheidung 25 B)

---

## 4. Test-Erwartung

| Phase | Ziel-Tests | Fokus |
|---|---:|---|
| Phase 1 Firma/Mandanten | 1 | Kühn wird als Mandant angelegt |
| Phase 2 Stammdaten | 2 | SKR03 enthält 9000/0860, 5 KST + 2 KTR nach Seed |
| Phase 3 Anlagen | 2 | 8 Anlagen seeded, AfA-Vorschau 2025 für Demo-Bestand |
| Phase 4 Journal | 5 | parseJournalCsv liefert 52 rows, Hash-Kette ok, client_id=Kühn, KST-Verteilung, Skonto-Felder |
| Phase 5 AfA-Lauf | 0 | bewusst keine Umsetzung |
| Phase 6 FLAG-v2 | 3 | v2-FLAG setzt nach Seed, v1→v2-Migration räumt, Idempotenz |
| Phase 7 Doku | 0 | nur Markdown-Updates |
| **Summe** | **~13** | |
| **Gesamt** | **951 → ~964** | konservativ innerhalb 960-975-Range |

---

## 5. Risiko-Übersicht

| Risiko | Wahrscheinlichkeit | Impact | Mitigation |
|---|---|---|---|
| Hash-Kette bricht durch parallele createEntry | niedrig | hoch | sequentielles `await` explizit im Seed-Code + Test |
| Vite `?raw`-Import im Test-Setup (happy-dom) nicht aufgelöst | mittel | mittel | vitest-Config prüfen; ggf. `vi.mock` für CSV-Inhalt |
| v1-FLAG-Legacy-User verlieren Daten | niedrig | mittel | Voll-Clear nur der bekannten v1-Stores (Entscheidung 33 C) |
| Bestehender UI-Code setzt Client-Filter auf erste Mandant-ID | niedrig | mittel | Frage 36 bestimmt Default-Selected; Post-Seed-Verify |
| parseJournalCsv Fiscal-Year-Check lehnt 2022-Daten ab | niedrig | hoch | Seed übergibt keine Fiscal-Year-Options → Check entfällt |
| 0800-Label-Inkonsistenz verwirrt Prüfer | mittel | niedrig | README-Hinweis, kein Code-Fix in 7.5 |
| Test-Laufzeit steigt durch neue Integration-Tests | niedrig | niedrig | ~13 neue Tests, erwarteter Impact < 2s |

---

## 6. Integration mit bestehendem Bestand

- `src/api/demoSeed.ts` wird von 77 auf ~280 Zeilen wachsen (strukturiert
  in Helper-Funktionen).
- `src/api/dashboard.ts` wird von ~408 auf ~240 Zeilen schrumpfen
  (15 hardcoded Einträge entfernt, `seedDemoData` ruft intern die
  neuen Helper auf).
- `src/api/skr03.ts` bekommt 2 neue Konten-Einträge.
- `src/vite-env.d.ts` wird neu angelegt (1 Zeile).

**Bestand, der NICHT berührt wird:**
- Journal-Hash-Kette (`createEntry`, `lastChainHash`, `computeEntryHash`)
- UstvaBuilder / GuvBuilder / Bilanz-Builder / BWA / EÜR
- AnlagenService / AfaCalculator
- BelegValidierungsService
- Alle bestehenden Tests (keine Modifikation)
- Alle Migration-Dateien (0001-0025)

---

## 7. Freigabe

**Status:** Detail-Plan erstellt. Phase-0-Zusatz-Befunde dokumentiert
(zwei SKR03-Konten fehlen: 9000, 0860; Vite `?raw`-Pattern erstmalig
im Projekt; Datum-Format-Konverter für Anlagen-CSV nötig).

**Wartet auf User-Freigabe von Entscheidungen 31-37** in der Matrix.
Vorschläge sind konservativ (C/B/A-Muster folgt Sicherheits- und
YAGNI-Prinzipien).

**Nicht angetastet:** Code, Tests, Seeds, Migrations. Baseline bleibt
**951 / 62 Dateien grün**.

**Nächster Schritt nach Freigabe:** Phase 1 starten (Kühn-Mandant +
Bestand-Mandanten-Reihenfolge via Entscheidung 31), Zwischenstop nach
Phase 2 (SKR03-Konten-Ergänzung + Stammdaten-Seed), dann Phase 3-4
nacheinander.
