# Kapitel 3 — Technische Systemdokumentation

> Status: v0.1 BEFÜLLT | Version: 0.1 | Letztes Update: 2026-04-20

## Zweck dieses Kapitels

Technische Darstellung der Systemlandschaft auf einer Ebene, die eine:n
Softwareprüfer:in nach IDW PS 880 in die Lage versetzt, die Struktur
der Anwendung, die Zuordnung von Verantwortlichkeiten zwischen den
Schichten, die Datenhaltung und die extern wirksamen Schnittstellen
nachzuvollziehen. Implementierungs-Details einzelner Funktionen sind
nicht Gegenstand dieses Kapitels. Cross-Referenzen zu anderen Kapiteln
ersetzen bewusst Wiederholungen.

---

## 3.1 Systemarchitektur

### Schichtenmodell

Das System ist als klassisches Fünf-Schichten-Modell strukturiert:

| Schicht | Verzeichnis(se) | Zuständigkeit |
|---|---|---|
| **Präsentation** | `src/pages/`, `src/components/` | React-Komponenten, Routing, UI-Zustand (lokal). Keine Geschäftslogik. |
| **Anwendung / Services** | `src/domain/*/…Service.ts` (z. B. `FestschreibungsService`, `BelegValidierungsService`, `DeadlineService`) | Orchestriert Domain-Logik zu konkreten Use-Cases. Hält keine React-Abhängigkeiten. |
| **Domäne** | `src/domain/` | Fachlogik nach Bereichen (Bilanz, GuV, UStVA, EÜR, Lohn, E-Rechnung, E-Bilanz, GDPdU, GoBD). Frei von React- und Supabase-Imports — verifizierbar über die Ordnerstruktur und Test-Läufe ohne DOM. |
| **Repository** | `src/api/`, `src/lib/db/`, `src/repositories/` | Dual-mode Persistenz: Browser-`localStorage` im Demonstrations-Modus, PostgreSQL über Supabase im Produktiv-Modus. Einheitliches Interface für beide Fälle. |
| **Export / Infrastruktur** | `src/lib/pdf/`, `src/lib/zip/`, `src/lib/crypto/`, `src/lib/datev/`, `src/utils/exporters.ts`, `src/utils/journalChain.ts` | Formatkonvertierung (PDF, ZIP, CSV, XBRL, UBL-XML), Kryptografie (SHA-256 in der Hash-Kette), DATEV-Formatierung. |

### Tragende Architektur-Entscheidungen

Die für Ordnungsmäßigkeit und Prüfbarkeit zentralen Entscheidungen sind
im Dokument [`../ARCHITECTURE.md`](../ARCHITECTURE.md) (9 Einträge) mit
Kontext, Entscheidung und Konsequenzen hinterlegt. Kurz-Verweise auf
die für die Verfahrensdokumentation relevantesten:

- **Decimal-basiertes Geldformat (`Money`-Wrapper).** Arithmetik auf
  Geldbeträgen läuft ausschließlich über `Money` auf Basis von
  Decimal.js mit 41-stelliger Präzision. `number`-Arithmetik auf
  Beträgen ist in der Code-Review ausgeschlossen. Rechtliche Grundlage:
  GoBD Rz. 58 (Richtigkeit).
- **Dual-Mode-Repositories** (`DEMO_MODE` vs. Supabase). Ein und
  dasselbe Interface wird wahlweise gegen `localStorage` oder gegen
  Supabase bedient. Produktivbetrieb verwendet ausschließlich den
  Supabase-Pfad. Im Demo-Modus verlässt kein Datum den Browser.
- **Separater `FestschreibungsService`.** Die Festschreibungs-Logik
  nach GoBD Rz. 64 ist in einer einzigen Datei gebündelt. Die
  DB-Trigger der Migrationen 0006, 0009 und 0021 sind der zweite
  Verteidigungsring auf Datenbank-Ebene.
- **Closure Table für den HGB-Bilanzbaum** (Migration 0019) statt
  rekursiver Common Table Expression — aus Gründen der Antwortzeit
  für Berichts-Aggregate.
- **Pure-SVG-Charts** (keine Chart-Library) — aus Gründen des
  Bundle-Umfangs und des identischen Screen/PDF-Renderings; siehe
  `src/components/charts/`.

### Reinheit der Domänenschicht

Die Domänenschicht ist eine verifizierbare Invariante: sie importiert
weder `react` noch `@supabase/supabase-js` noch Browser-APIs. Tests
der Domänenschicht laufen ohne DOM und ohne Netzwerk. Der Zustand
dieser Invariante wird im Code-Review gewahrt (siehe Kap. 8,
Abschnitt 8.7).

---

## 3.2 Technologie-Stack

Die folgende Aufstellung listet ausschließlich die in `package.json`
deklarierten und im Build verwendeten Abhängigkeiten. Versionen
entsprechen dem Stand 2026-04-20.

### Laufzeit-Abhängigkeiten

| Komponente | Produkt | Version | Lizenz | Zweck im Verfahren |
|---|---|---|---|---|
| Sprache | TypeScript | 5.9 (strict) | Apache-2.0 | Typsicherheit im gesamten Codebase |
| UI-Framework | React | 19 | MIT | Komponenten-Rendering, Client-Rendering |
| Build-Tool | Vite | 8 | MIT | Entwicklung + Produktions-Build |
| Routing | react-router-dom | 7 | MIT | SPA-Navigation |
| Backend-as-a-Service | @supabase/supabase-js | 2.103 | MIT | Authentifizierung, Postgres-Client, Storage |
| Server-State | @tanstack/react-query | 5 | MIT | Cache + Fetch-Koordination |
| Dezimal-Arithmetik | decimal.js | 10.6 | MIT | Geld-Präzision (GoBD Rz. 58) |
| PDF-Ausgabe | jsPDF | 4 | MIT | PDF-Reports (Bilanz, GuV, UStVA …) |
| PDF-Tabellen | jspdf-autotable | 5 | MIT | Tabellenlayout in PDF |
| PDF-Manipulation | pdf-lib | 1.17 | MIT | XML-Einbettung in PDF/A-3 (ZUGFeRD) |
| Excel-Export | ExcelJS | 4 | MIT | XLSX-Ausgaben |
| ZIP | jszip | 3 (transitiv via ExcelJS) | MIT | Z3- und E-Rechnungs-Pakete |
| OCR | tesseract.js | 7 | Apache-2.0 | Belegerfassung |
| PDF-Text-Extraktion | pdfjs-dist | 4 | Apache-2.0 | Lesen eingehender PDFs |
| Fehlerprotokollierung | @sentry/react | 8.50 | MIT | Fehler-Kanalisierung, opt-in via DSN |
| Icons | lucide-react | 1.8 | ISC | UI-Symbole |
| Toast-Benachrichtigungen | sonner | 2 | MIT | Kurze Nutzerhinweise |

### Entwicklungs- und Testabhängigkeiten

| Komponente | Produkt | Version | Lizenz | Zweck |
|---|---|---|---|---|
| Test-Runner | vitest | 4.1 | MIT | Unit- und Integrations-Tests |
| DOM-Implementierung | happy-dom | 20 | MIT | Test-DOM (~10× schneller als jsdom) |
| Coverage | @vitest/coverage-v8 | 4.1 | MIT | Testabdeckungs-Metriken |
| Linting | eslint + typescript-eslint | 9.x / 8.x | MIT | statische Codeprüfung |
| Git-Hooks | husky + lint-staged | 9.x / 15.x | MIT | pre-commit-Prüfungen (dormant, solange kein Git-Repo initialisiert) |

### Ausdrücklich nicht verwendet

- Keine CSS-Framework-Abhängigkeit (kein Tailwind, Bootstrap,
  Material UI). Styles sind als CSS-Variablen und klassenbasierte
  Stylesheets abgelegt.
- Keine Chart-Library (keine Recharts, Victory, D3). Begründung in
  `../ARCHITECTURE.md` §6.
- Keine Animations-Library.
- Keine serverseitigen Laufzeit-Komponenten im Projekt-Codebase. Die
  serverseitige Logik (Trigger, RLS-Policies) lebt in
  `supabase/migrations/` und wird über Supabase ausgeführt.

<!-- TODO(verfahrensdoku): Lizenz-Angaben pro Bibliothek mit `npm ls --long` bzw. `license-checker` verifizieren und als Anhang hinterlegen, bevor die Verfahrensdokumentation extern freigegeben wird. -->

---

## 3.3 Datenhaltung

### Datenbank-System

- **PostgreSQL** in der von Supabase verwalteten Variante.
- Serverseitige Komponenten: Row-Level-Security-Policies,
  DB-Trigger (Hash-Kette, Festschreibung, Immutability),
  Authentifizierung über Supabase Auth, Objekt-Speicher (Supabase
  Storage).
- Alle Zeitstempel werden als `timestamptz` in UTC gespeichert;
  die Darstellung im UI erfolgt in Europe/Berlin.

<!-- TODO(verfahrensdoku): Exakte Postgres-Major-Version aus dem Supabase-Projekt ablesen und eintragen; hängt vom Tier-Stand ab und ist für IDW-PS-880-Prüfung zu verifizieren. -->

### Schema-Übersicht

Das Schema wächst durch nummerierte Migrationen (`supabase/migrations/
0001-0023`). Alte Migrationen werden nicht verändert — jede Schema-
Änderung ist eine neue Datei. Detail-Strukturen sind in den Migrations-
Dateien dokumentiert; hier nur die fachliche Gruppierung.

Legende der Spalte **GoBD-Relevanz**:

- **unveränderlich** — in einer Hash-Kette gesichert (prev_hash /
  entry_hash) oder mit Per-Row-Hash versehen; nachträgliche Änderung
  erkennbar (GoBD Rz. 107 ff., Rz. 153-154).
- **revisionssicher** — Trigger verhindert UPDATE/DELETE auf
  festgeschriebenen Zeilen (GoBD Rz. 64).
- **transient** — operativ; keine GoBD-Retentions-Anforderung.

| Gruppe | Tabellen | Migrationen | GoBD-Relevanz |
|---|---|---|---|
| Kernbuchführung | `clients`, `accounts`, `journal_entries`, `documents`, `settings` | 0001, 0004, 0010 | **unveränderlich** (journal_entries), **revisionssicher** (accounts nach Nutzung) |
| Belegerfassung | `belege`, `beleg_positionen` | 0022 | **revisionssicher** (ab Status `GEBUCHT`) |
| Audit | `audit_log` (mit Hash-Kette) | 0002, 0003 | **unveränderlich**, append-only per RLS + Trigger |
| Festschreibung | `lock_hash`, `lsta_festschreibungen` | 0006, 0009, 0021 | **unveränderlich** + **revisionssicher** |
| HGB-Bilanz-Persistenz | `report_lines`, `closure_table` | 0019 | transient (Materialisierung eines Stichtags) |
| Steuer-Übertragung | `elster_submissions` | 0013 | transient (Tracking-Register) |
| Lohn | `employees`, `cost_centers`, `lohnarten`, `lohnbuchungen`, `abrechnungen_archiv` | 0016, 0017, 0020 | **unveränderlich** (Archiv-Abrechnungen mit Per-Row-Hash) |
| E-Rechnung-Eingang | `invoice_archive` | 0012 | transient / revisionssicher je nach Prozessschritt |
| Mahnwesen | `dunning_records`, `dunning_levels` | 0005 | transient |
| Operative Hilfstabellen | `app_logs`, `advisor_notes`, `supplier_preferences`, `receipt_requests` | 0011, 0014, 0015, 0018 | transient |
| DSGVO-Register | `cookie_consents`, `privacy_requests`, `privacy_incidents` | 0023 | transient (mit eigenen Retention-Fristen, siehe Kap. 6) |
| Mehrmandantenfähigkeit | (keine eigene Tabelle — `mandant_id` als UUID-Spalte in den fachlichen Tabellen) | 0004 (Policies) | — |

Die konkrete Anzahl der Tabellen, Indizes, Trigger und
RLS-Policies ist dem Verzeichnis `supabase/migrations/` zu
entnehmen; sie wird hier nicht dupliziert, damit die
Verfahrensdokumentation nicht bei jeder Migration aktualisiert
werden muss.

### Mehrmandantenfähigkeit

- Jede fachliche Tabelle trägt eine `mandant_id` bzw. `company_id`.
- Row-Level-Security-Policies erzwingen die Isolation zwischen den
  Mandanten auf Datenbank-Ebene; die App-Schicht verlässt sich nicht
  auf clientseitige Filter.
- Die konkreten Rollen und Policies sind in Kapitel 5 (Abschnitt 5.1)
  beschrieben.

### Geldbeträge

- Typ in der Domänenschicht: `Money` (Wrapper um `decimal.js` mit
  41-stelliger Präzision, `src/lib/money/Money.ts`).
- Speicherung in Postgres: `numeric(15,2)` für Betragsspalten.
- Serialisierung in Export-Formaten: je nach Zielformat
  (DE-Dezimalkomma für DATEV/ELSTER, Punkt-Dezimal für XBRL/UBL).
- Rundung ausschließlich an definierten Ausgabe-Grenzen; innerhalb
  der Domäne wird nicht gerundet. Rechtliche Grundlage: GoBD Rz. 58.

### Zeitzonen

- Datenbank: `timestamptz` in UTC.
- Anwendung (UI): Darstellung in Europe/Berlin (CET/CEST).
- Export-Formate mit Datum ohne Zeitkomponente (DATEV, ELSTER, Z3):
  DD.MM.YYYY bzw. ISO-8601-Datum gemäß jeweiliger Formatvorgabe.

---

## 3.4 Schnittstellen (technische Sicht)

Dieser Abschnitt ergänzt Kapitel 1, Abschnitt 1.3 um die technische
Realisierung. Alle Schnittstellen sind Datei-basiert; es gibt keine
offenen Programmierschnittstellen (HTTP-APIs, Webhooks) des Systems
nach außen.

| Schnittstelle | Protokoll | Format | Richtung | Authentifizierung | Fehlerbehandlung |
|---|---|---|---|---|---|
| DATEV EXTF 510 | Download-Datei | CSV (ISO-8859-15, Semikolon, CRLF) | Export | — (Dateiübergabe) | Vor dem Export Plausi-Prüfung; Fehler → UI-Toast, kein Teil-Export |
| ELSTER-XML (UStVA / LStA / E-Bilanz) | Download-Datei | XML nach jeweiligem ELSTER-Schema | Export | — (Upload erfolgt manuell im ELSTER-Portal) | Schema-konforme Erzeugung; **keine** ERiC-Validierung im Verfahren |
| ZM-CSV | Download-Datei | CSV | Export | — | Quartalsaggregation vor Export |
| XRechnung (UBL 2.1) | Download-Datei | XML | Export + Import | — | Export: strukturelle Mindest-BR-Regeln (≈ 20 der > 200 KoSIT-Regeln); Import: Parser-Fehler werden zurück an UI gereicht |
| ZUGFeRD / Factur-X | Download-Datei | PDF mit eingebettetem UBL-XML-Anhang | Export | — | XML-Anhang gemäß ISO 19005-3 `/AF`; XMP-Metadata-Stream nicht erzeugt — formale PDF/A-3-Zertifizierung nicht möglich (siehe Kap. 7) |
| Z3 / GDPdU (AO § 147 Abs. 6) | Download-Datei | ZIP mit INDEX.XML, CSVs, MANIFEST.XML | Export | — | SHA-256 je Datei im MANIFEST.XML; ZIP selbst ist nicht signiert |
| Mandanten-Datenexport (DSGVO Art. 20) | Download-Datei | ZIP mit MANIFEST.json, JSON je Tabelle, DISCLAIMER.txt | Export | — (RLS-Begrenzung) | SHA-256 je Tabelle + Manifest; Integritätsprüfung über separaten Upload-Endpunkt im UI (siehe Kap. 7 Abschnitt 7.8) |
| MT940 (Bank-Kontoauszug) | Upload-Datei | ZKA-MT940 | Import | — | Parser-Fehler → UI-Toast; keine Teil-Übernahme |
| CAMT.053 | Upload-Datei | XML (ISO 20022) | Import | — | Parser-Fehler wie oben |
| Belege (Eingang) | Upload-Datei | PDF, Bild | Import | — | OCR via `tesseract.js` lokal im Browser; Fehler in der Erkennung sind manuell zu korrigieren |

Keine dieser Schnittstellen verwendet eine Maschine-zu-Maschine-
Übertragung. Die Integration in DATEV- oder ELSTER-Systeme erfolgt
durch die Kanzlei außerhalb des Verfahrens (siehe Kap. 1 Abschnitt
1.3).

---

## 3.5 Deployment-Architektur

### Aktueller Zustand (Entwicklung)

- **Frontend** wird lokal über `vite` auf Port 5173 bereitgestellt.
- **Backend** ist wahlweise ein Supabase-Projekt der nutzenden
  Kanzlei oder der Demo-Modus ohne Backend.
- **Build-Artefakt** wird über `npm run build` erzeugt: statisches
  `dist/`-Verzeichnis, ca. 6,9 MB unkomprimiert, ca. 2,4 MB gzipped
  (Stand 2026-04-20).
- **Datenbank-Migrationen** werden über Supabase CLI oder den
  SQL-Editor des Supabase-Projekts ausgeführt.

### Zustand der CI/CD-Automatisierung

- Workflows im Verzeichnis `.github/workflows/` (ci.yml,
  deploy-staging.yml, deploy-production.yml) sind definiert, aber
  solange das Arbeitsverzeichnis nicht als Git-Repository
  initialisiert ist, laufen sie nicht. Dependabot-Konfiguration ist
  ebenfalls vorhanden aber dormant. Dies ist in
  [`../../CLAUDE.md`](../../CLAUDE.md) §12 (Notes 10-11) dokumentiert.
- Die Aktivierung der Workflows ist Bestandteil der
  Go-Live-Vorbereitung (siehe [`../GO-LIVE-CHECKLIST.md`](../GO-LIVE-CHECKLIST.md)).

### Geplanter Produktiv-Zustand

Der finale Hosting-Provider für das Frontend ist nicht festgelegt
(siehe TODO in Kap. 1, Abschnitt 1.3). Die Wahl wird durch die
Kanzlei-IT getroffen und in diesem Abschnitt nach Festlegung
eingetragen. Anforderungen an den gewählten Provider werden in
Kapitel 4 (Betriebsdokumentation) und Kapitel 5 (Datensicherheit)
definiert.

<!-- TODO(verfahrensdoku): Nach Produktiv-Entscheidung der Kanzlei ergänzen: Hosting-Provider, Serverstandort (DSGVO-relevant, Art. 44 ff.), Deployment-Pipeline, Monitoring-Integration. -->

### Abhängigkeiten von Fremdanbietern

- **Supabase** als verwaltete Plattform für Postgres, Auth und
  Storage. Ein AVV nach Art. 28 DSGVO ist vor Produktivbetrieb
  abzuschließen (siehe Kap. 5 Abschnitt 5.7).
- **Sentry** (optional, nur bei gesetzter DSN) für
  Fehlerprotokollierung mit PII-Scrubbing. Ohne DSN läuft der
  Initialisierungsaufruf als No-Op.
- **Analytics** (Google Analytics 4 oder Plausible, nur bei
  Kanzlei-Konfiguration **und** Nutzer-Einwilligung nach TTDSG § 25,
  siehe Kap. 5 Abschnitt 5.6).
- Keine weiteren Drittanbieter-Integrationen in der Laufzeit.

---

## 3.6 Testabdeckung und Qualitätssicherung

### Stand per 2026-04-20

- **727 automatisierte Tests** über **51 Test-Dateien**.
- **Zeilenabdeckung** 91 %, **Verzweigungsabdeckung** 77 %,
  **Funktionsabdeckung** 93 % (gemessen über `@vitest/coverage-v8`
  am repoweiten Lauf).

### Verteilung der Test-Dateien

| Schicht | Testdateien | Fokus |
|---|---:|---|
| Domänenschicht (`src/domain/`) | 33 | Kernlogik — Bilanz, GuV, UStVA, EÜR, Lohn, E-Bilanz, E-Rechnung, Belegvalidierung, Festschreibung, GDPdU, Retention, Export |
| Infrastruktur (`src/lib/`) | 14 | Geldrechnung, Kryptografie (SHA-256 / Hash-Kette), PDF, ZIP, DATEV-Formatierung, DB-Adapter, Validierung, Datum |
| Komponenten (`src/components/`) | 4 | UI-Grenzfälle, insbesondere `ErrorBoundary` und das Cookie-Consent-Banner |

### Test-Pyramide

- **Unit-Tests:** Anteil ≈ 95 %. Decken Domänenlogik isoliert ab;
  laufen ohne DOM und ohne Netzwerk.
- **Integrationstests:** Parser und Builder (XRechnung-Parser,
  DATEV-Export, ZUGFeRD-Einbettung, Z3-Paket, Mandanten-Datenexport);
  laufen mit `happy-dom` als DOM-Implementierung.
- **Komponententests:** 4 Dateien — nur dort, wo das Verhalten ohne
  DOM nicht sinnvoll prüfbar ist (`ErrorBoundary`, `CookieConsent`).
- **End-to-End-Tests:** **nicht vorhanden.** Playwright ist als
  Pflichtbestandteil in der Go-Live-Vorbereitung hinterlegt; 10
  kritische Journeys sind festgelegt, aber noch nicht implementiert
  (P1-Blocker, siehe [`../../CLAUDE.md`](../../CLAUDE.md) §10).

### Bewusst nicht abgedeckt

- **Supabase-seitige Integration** (RLS-Durchsetzung, DB-Trigger im
  Live-Schema). Der Supabase-Pfad der Repositories kompiliert; die
  Verhaltensprüfung gegen ein echtes Supabase-Projekt ist erst im
  Staging möglich.
- **Manuelle UI-Journeys** — ersetzt durch die kommenden E2E-Tests.
- **Nicht-deterministische Abhängigkeiten** (OCR-Genauigkeit,
  Netzwerkfehler gegen Supabase, Drittanbieter-APIs) werden in Unit-
  Tests nicht gegen echte Ziele, sondern gegen Fixtures geprüft.

### Continuous-Integration-Gate

Die Kette `tsc --noEmit → eslint → vitest run → vite build` ist der
lokale und CI-Gatekeeper. Sie läuft bei jedem Commit, sofern die
Husky-Hooks aktiv sind (dormant-Zustand siehe Abschnitt 3.5).

---

## 3.7 Versionierung und Change-Management

Dieser Abschnitt benennt nur die Leitplanken; der operative Prozess
wird in Kapitel 4 (Betriebsdokumentation, Abschnitt 4.4) ausgeführt.

- **Code-Versionierung:** Git. Änderungen werden in Pull Requests
  begutachtet; der Code-Review-Umfang und die Freigabe-Kette sind in
  Kapitel 8 (Abschnitt 8.7) festgelegt.
- **Schema-Versionierung:** aufsteigend nummerierte Migrationen
  (`0001_*.sql` … `0023_*.sql`). Alte Migrationen werden nicht
  verändert — jede Schema-Änderung ist eine neue Datei. Diese Regel
  ist in [`../../CLAUDE.md`](../../CLAUDE.md) §13 ("Common mistakes")
  ausdrücklich festgehalten.
- **Release-Versionierung und Release-Notes:** siehe Kapitel 4
  Abschnitt 4.7.
- **Abhängigkeits-Aktualisierung:** Dependabot-Konfiguration liegt
  vor; Wochenfrequenz für npm, Monatsfrequenz für GitHub-Actions.
  Aktivierung mit Git-Init (siehe 3.5).

Verweise zum vertiefenden Lesen:

- [`../ARCHITECTURE.md`](../ARCHITECTURE.md) — 9 Architektur-
  Entscheidungen mit Kontext/Entscheidung/Konsequenzen.
- [`../BACKUP-STRATEGY.md`](../BACKUP-STRATEGY.md) — offene Ops-Arbeit
  zur Datensicherung (Kap. 4 Abschnitt 4.1).
- [`../HASH-CHAIN-VS-ERASURE.md`](../HASH-CHAIN-VS-ERASURE.md) —
  Design-Entscheidung zur DSGVO-Art.-17-Löschung im Spannungsfeld zu
  § 146 Abs. 4 AO und GoBD Rz. 107 ff.

---

## Quellen & Referenzen

- Handelsgesetzbuch (HGB): § 257 (Aufbewahrungsformate der
  Handelsbücher und -unterlagen, einschließlich Bildträger- und
  Datenträger-Wiedergabe).
- Abgabenordnung (AO): § 146 Abs. 4 (Unveränderbarkeit der
  Buchführung, siehe Kap. 7 zur technischen Umsetzung), § 147 Abs. 6
  (Datenzugriff der Außenprüfung, Z3-Format in Abschnitt 3.4).
- BMF-Schreiben zu den GoBD vom 28.11.2019 (IV A 4 - S 0316/19/10003
  :001): Rz. 58 (Geldbetrag-Präzision, Abschnitt 3.3), Rz. 64
  (Festschreibung, Abschnitte 3.1 und 3.3), Rz. 107 ff.
  (Unveränderbarkeit, Hash-Kette in Abschnitt 3.3), Rz. 153-154
  (Hash-Verfahren als anerkannter Integritätsnachweis).
- Verordnung (EU) 2016/679 (DSGVO): Art. 28 (Auftragsverarbeitung,
  relevant für Supabase-AVV, Abschnitt 3.5), Art. 32 (technische
  und organisatorische Maßnahmen, Details in Kapitel 5), Art. 44 ff.
  (Drittstaatenübermittlung, relevant für Serverstandort-Wahl,
  Abschnitt 3.5).
- ISO 20022 — CAMT.053-Kontoauszugsformat (Abschnitt 3.4).
- ISO 19005-3 — PDF/A-3 (Abschnitt 3.4; Grenzen der Zertifizierbarkeit
  siehe Kap. 7).
- EN 16931 — europäische Norm für elektronische Rechnungen
  (Abschnitt 3.4; KoSIT-BR-Regeln siehe Kap. 7).
- BMF-Beschreibungsstandard zum Z3-Datenträgerformat (Abschnitt 3.4).

### Interne Projekt-Referenzen

- [`../../CLAUDE.md`](../../CLAUDE.md) §2 (Tech Stack), §4
  (Architectural Decisions), §5 (Repository Structure), §12 (Known
  Limitations).
- [`../ARCHITECTURE.md`](../ARCHITECTURE.md).
- [`../PROJEKT-INVENTAR.md`](../PROJEKT-INVENTAR.md) §4 (Architektur-
  Übersicht), §5 (Datenbank-Schema).
- [`../../supabase/migrations/`](../../supabase/migrations/).
- [`../../package.json`](../../package.json).
- [`../../src/lib/money/Money.ts`](../../src/lib/money/Money.ts),
  [`../../src/lib/crypto/payrollHash.ts`](../../src/lib/crypto/payrollHash.ts),
  [`../../src/utils/journalChain.ts`](../../src/utils/journalChain.ts).
