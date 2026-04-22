# CLAUDE.md — harouda-app Project Context

Kanonischer Kontext für AI-Sessions auf harouda-app. Vor jedem Eingriff
top-to-bottom lesen — spart ~20 Min Re-Exploration pro Session.

**Letzte Aktualisierung:** 2026-04-27 · **1659 Tests grün / 165 Test-Dateien** ·
tsc clean · 34 Migrations · 521 TS-Dateien / ~146 700 LOC in `src/`.

Wahrheitsquelle für Gesamtzustand:
[`docs/PROJEKT-GESAMTBERICHT-2026-04-27.md`](./docs/PROJEKT-GESAMTBERICHT-2026-04-27.md).
Diese Datei ist die Kurzfassung plus die laufend-gültigen Arbeitsregeln.

---

## 1. Project Overview

**harouda-app** ist eine deutsche SaaS für Steuerberater: Belegerfassung →
Journal → Bilanz/GuV → Jahresabschluss → Steuer-Meldungen → Lohn →
B2B-E-Rechnung → Inventur. Zugeschnitten auf HGB / AO / EStG / UStG / GoBD /
DEUeV.

Users: Steuerberater (Vollzugriff), Kanzlei-Mitarbeiter (Tageserfassung),
Mandanten (optional Self-Service), Betriebsprüfer (Z3-Read-only).

Non-goals: kein DATEV-Ersatz für Großkanzleien · nicht IDW PS 880
zertifiziert · keine PSD2 / SEPA-Origination · keine ERiC/ITSG-Direkt-
Transmission (manueller Portal-Upload bleibt).

---

## 2. Tech Stack

- **TypeScript 5.9 strict** · **React 19** · **Vite 8** · **react-router v7**
- **Supabase** (Postgres + RLS + Auth + Storage) · Dual-Mode DEMO ↔ Supabase
- **TanStack Query v5** für Server-State · **react-hook-form v7**
- **Decimal.js 10.6** in `Money`-Wrapper (GoBD Rz. 58, Banker's Rounding)
- **pdfmake 0.3.7** (Jahresabschluss-Vektortext + TOC) · **jsPDF 4 + autotable**
  (Reports) · **pdf-lib 1.17** (PDF/A-3 + ZUGFeRD-Attachment)
- **TipTap v3** (Anhang- / Lagebericht- / Erläuterungs-Editor, S/W-only)
- **ExcelJS 4** · **tesseract.js 7** (OCR-Demo) · **pdfjs-dist 4**
- **Lucide icons** · **Sonner** toasts · keine CSS-Framework- und keine
  Chart-Lib-Dependency (pure SVG)
- **Vitest 4.1 + happy-dom 20 + coverage-v8**
- **@sentry/react 8.50** (PII-scrubbed, opt-in via DSN env)
- **husky 9 + lint-staged 15** (dormant bis `git init` + `npm run prepare`)

Kein Prettier (Team-Entscheidung offen).

---

## 3. Current Status

- **Tests:** 1659 passing, 165 files, 0 failing (vitest 4.1, happy-dom 20).
  Bericht-Stand 2026-04-27 meldete 1656/164; +3/+1 seit Bericht-Erstellung.
- **tsc:** clean (`tsc --noEmit` mit 8 GB heap).
- **Migrations:** 34 (0001–0034, durchgängig versioniert).
- **Files:** 521 `.ts`/`.tsx` in `src/`, ~146 700 LOC, 107 Pages,
  98 Routen in `App.tsx`, 22 Domain-Subdirectories, 33 API-Service-Dateien,
  90 Dateien in `docs/`.
- **Produktionsreife:** Front-End-Seite reif für erste Kanzlei; Blocker-Liste
  siehe §10.
- **Tech-Debt offen:** 3 Tickets (siehe §10.2). 1 Ticket geschlossen
  (Bank-Reconciliation-Persistenz, Sprint 16).

---

## 4. Architectural Decisions

Langform in [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md).

- **Money / Decimal.** Jeder Currency-Flow über `Money` (28-stellige
  Decimal.js, Banker's Rounding). Kein `number` auf Beträgen. Explizites
  Runden an Render-Boundaries.
- **Composite Pattern für BalanceNode.** HGB §266-Baum ist ein rekursiver
  Type; Blatt = Node ohne Kinder. Ein Algorithmus, nicht zwei.
- **Closure Table für Tree-Queries.** Migration 0019 materialisiert
  Ancestor-Descendant-Pairs → "Summe unter A.I" in O(n) statt O(h·n) CTE.
- **SKR03 SSoT-Mapping.** Ein Modul pro Dimension (Bilanz, GuV, UStVA, EÜR).
  Jeder Builder importiert daraus; Tests erzwingen Vollständigkeit.
- **Dual-Mode Repositories.** `api/supabase.ts` exportiert `DEMO_MODE`.
  Jedes Repo verzweigt über `shouldUseSupabase()` → localStorage `store`
  oder Supabase. Tests laufen DEMO implizit (keine aktive Company).
- **Pure-SVG Charts.** Kein recharts — spart ~250 KB, PDF-Export trivial.
- **`FestschreibungsService`.** GoBD Rz. 64 zentralisiert; DB-Trigger aus
  Migrationen 0006/0021 sind zweite Verifikationslinie.
- **Adapter `Arbeitnehmer ↔ Employee`.** Lohn-Domain ist reich; DB hat
  flacheren `Employee`. `lohnAdapter.ts` ist der einzige Ort, der beide sieht.
- **Expand-and-Contract für Stammdaten-Migrationen.** Sprint 18: neue
  Pflichtfelder zuerst NULLABLE (0032/0033), NOT-NULL-Contract-Migration
  wartet auf 100%-Backfill (Tech-Debt Phase 2, siehe §10.2).
- **Jahresabschluss = pure Domain-Builder + pdfmake-Adapter.** Keine
  React-Deps im Builder-Layer. `FinancialStatementsAdapter` verbindet
  Domain-Output (BalanceSheetBuilder / GuvBuilder / AnlagenService) mit
  der PDF-Pipeline.

---

## 5. Repository Structure

> **Hinweis:** `.github/` und `.husky/` sind **dormant** bis das
> Working-Directory als git-Repo initialisiert ist (`git init` +
> `npm run prepare`). Dateien existieren, aber keine Hooks feuern und
> keine CI läuft.

```
harouda-app/
├── .github/workflows/         # ci.yml, deploy-*.yml (dormant)
├── .github/dependabot.yml     # weekly npm + monthly actions (dormant)
├── .husky/                    # pre-commit (lint-staged), pre-push (dormant)
├── docs/                      # 90 Dateien (42 SPRINT-*, 4 TECH-DEBT-*,
│                              # Guides, historische Pläne, Updates)
├── supabase/migrations/       # 0001 .. 0034 (34 Migrationen)
└── src/
    ├── api/                   # Dual-Mode-Repos: supabase.ts, store.ts, db.ts,
    │                          # journal.ts, accounts.ts, clients.ts, audit.ts,
    │                          # bankReconciliationMatches.ts, inventur.ts, …
    ├── assets/                # Statische Medien
    ├── components/            # AppShell, ErrorBoundary, RequireAuth,
    │                          # banking/ (BankReconPersistenceBanner),
    │                          # charts/ (pure SVG), audit/ (DiffViewer)
    ├── contexts/              # UserContext, MandantContext, YearContext,
    │                          # CookieConsentContext, …
    ├── data/                  # Statische Referenzdaten
    ├── design-system/         # Design-Tokens
    ├── domain/                # ← Pure Logik, kein React, kein Supabase
    │   ├── accounting/        # Bilanz, GuV, BWA, Vorjahresvergleich,
    │   │                      # ClosingValidation, FinancialStatements
    │   ├── anlagen/           # AfA, Anlagenspiegel (§ 268 Abs. 2 HGB)
    │   ├── banking/           # MT940, CAMT.053, Auto-Matcher, Fingerprint
    │   ├── belege/            # BelegValidierungsService
    │   ├── compliance/        # DeadlineService
    │   ├── ebilanz/           # XBRL + HGB-Taxonomie 6.8 + Multi-Version-Picker
    │   ├── einvoice/          # XRechnung + ZUGFeRD (Builder/Parser/Validator)
    │   ├── elster/            # LStA-XML + ZM-ELSTER-XML (Sprint 14)
    │   ├── employees/         # svCompleteness (Dashboard-Metric + Badges)
    │   ├── est/               # EStE-Anlagen (G/AV/Vorsorge/…) + avVertraegeStore
    │   ├── euer/              # EÜR § 4 Abs. 3 EStG
    │   ├── gdpdu/             # Z3-Export § 147 Abs. 6 AO
    │   ├── gobd/              # FestschreibungsService (Rz. 64)
    │   ├── inventur/          # Inventur-Wizard, ClosingValidation-Hooks
    │   ├── jahresabschluss/   # WizardTypes, Store, Rules, Pipeline, BStBK, PDF
    │   ├── journal/           # Journal-Helpers
    │   ├── lohn/              # Tarif 2025, SV-Params, Vorsorgepauschale
    │   ├── privacy/           # DSGVO-Pfade
    │   ├── sv/                # DSuV-XML + Beitragsnachweis-CSV (Sprint 15)
    │   └── ustva/             # UStVA + ZM
    ├── hooks/                 # Custom React-Hooks
    ├── lib/
    │   ├── crypto/            # payrollHash, journalChain
    │   ├── date/              # Date-Helpers
    │   ├── datev/             # EXTF + LODAS Format-Utils
    │   ├── db/                # journalRepo.ts, auditLogRepo, lohnRepos, lohnAdapter
    │   ├── money/             # Money + Decimal.js-Wrapper
    │   ├── monitoring/        # sentry.ts mit PII-Scrub
    │   ├── pdf/               # PdfReportBase, Table-Helpers
    │   ├── validation/        # Shared Validators
    │   └── zip/               # Zip-Bundling (Z3, DATEV-ATCH)
    ├── pages/                 # 107 Route-Endpoints
    ├── repositories/          # Specialist Repos (AuditRepo, EmployeeRepo)
    ├── styles/                # Globale CSS-Variablen
    ├── types/db.ts            # Alle DB-Schema-Types
    ├── utils/                 # datev, elster, exporters, ocr, validators
    ├── App.tsx                # 98 <Route>-Definitionen
    └── main.tsx               # initSentry → createRoot
```

---

## 6. Main Features with File Locations

| Feature | Page | Domain-Modul / Service |
|---|---|---|
| Belegerfassung | `BelegerfassungPage.tsx` | `belege/BelegValidierungsService.ts` + `lib/db/journalRepo.ts` |
| Belege-Liste | `BelegeListePage.tsx` | reuses journalRepo |
| Bilanz (HGB § 266) | `BilanzPage.tsx` | `accounting/BalanceSheetBuilder.ts` |
| GuV (HGB § 275 GKV) | `GuvPage.tsx` | `accounting/GuvBuilder.ts` |
| BWA (strukturell, nicht Wizard-Teil) | `BwaPage.tsx` | `accounting/BwaBuilder.ts` |
| Vorjahresvergleich | `VorjahresvergleichPage.tsx` | `accounting/VorjahresvergleichBuilder.ts` |
| **Jahresabschluss-Wizard (7/7 Steps)** | `JahresabschlussWizardPage.tsx` + `pages/jahresabschluss/Step*.tsx` | `domain/jahresabschluss/{WizardTypes, wizardStore, rules, pdf/DocumentMergePipeline, bstbk}` |
| **Anlagenbuchhaltung + AfA** | `AnlagenPage.tsx` | `domain/anlagen/AnlagenService.ts` (Migration 0025) |
| **Inventur-Wizard (Sprint 17)** | `InventurPage.tsx` | `api/inventur.ts` + `domain/inventur/` (Migration 0034) |
| **Bank-Reconciliation** | `BankReconciliationPage.tsx` | `domain/banking/{BankAutoMatcher,bankTransactionFingerprint,BankReconciliationGaps}` + `api/bankReconciliationMatches.ts` (Migration 0031) |
| UStVA | `UstvaPage.tsx` | `ustva/UstvaBuilder.ts` + `UstvaXmlBuilder.ts` |
| ZM (ELMA5 + ELSTER) | `ZmPage.tsx` | `ustva/ZmBuilder.ts` + `domain/elster/` |
| EÜR | `EuerPage.tsx` | `euer/EuerBuilder.ts` |
| E-Bilanz XBRL | `EbilanzPage.tsx` | `ebilanz/EbilanzXbrlBuilder.ts` + `hgbTaxonomie.ts` (Multi-Version-Picker) |
| XRechnung + ZUGFeRD | `ERechnungPage.tsx` | `einvoice/*` |
| Lohnabrechnung | `LohnPage.tsx`, `PayrollRunPage.tsx` | `lohn/LohnabrechnungsEngine.ts` |
| Vorsorgepauschale | (in Lohn) | `lohn/vorsorgepauschaleCalculator.ts` |
| **LSt-Anmeldung (ELSTER-XML)** | `LohnsteuerAnmeldungPage.tsx` | `lohn/LohnsteuerAnmeldungBuilder.ts` + `domain/elster/` (Sprint 14) |
| **SV-Meldungen DSuV + Beitragsnachweis** | `SvMeldungenPage.tsx` | `domain/sv/` (Sprint 15) |
| Abrechnungs-Archiv | `AbrechnungsArchivPage.tsx` | `lib/db/lohnRepos.ts` |
| Employees | `EmployeesPage.tsx` | `domain/employees/svCompleteness.ts` (Expand-Phase 0032) |
| Z3-Datenexport | `Z3ExportPage.tsx` | `gdpdu/Gdpdu3Exporter.ts` |
| DATEV EXTF | `DatevExportPage.tsx` | `utils/datev.ts` + `lib/datev/` |
| GoBD Festschreibung | Admin-Flow | `gobd/FestschreibungsService.ts` |
| Audit-Trail | `AuditTrailPage.tsx`, `AuditLogPage.tsx` | `api/audit.ts` + `lib/db/auditLogRepo.ts` |
| Deadlines | `DeadlinesPage.tsx` | `compliance/DeadlineService.ts` |
| Mahnwesen | `MahnwesenPage.tsx` | `api/mahnwesen.ts` |
| ELSTER-XML-Export (generisch) | `ElsterPage.tsx` | `utils/elster.ts` |
| OCR / Scanner | `DocumentScannerPage.tsx` | `utils/ocr.ts` |
| Bank-Import | `BankImportPage.tsx` | MT940 / CAMT-Parser |
| Arbeitsplatz-Tree / Mandant-Context | — | `contexts/MandantContext.tsx` (URL-primary seit F42) |
| `/admin/datenexport` (DSGVO Art. 20) | `DatenexportPage.tsx` | client-side export, **kein** server-side Backup |

---

## 7. Sprint-Historie (20 Sprints seit April 2026)

Quelle: §5 in `docs/PROJEKT-GESAMTBERICHT-2026-04-27.md`.

| # | Name | Datum | Test-Endstand |
|---|---|---|---|
| 0 | Pre-Sprint-8 Bugfix-Runde (9 Fixes) | 2026-04-20 | 995 |
| 1 | Sprint Arbeitsplatz | 2026-04-20 | 1018 / 67 |
| 2 | Sprint F42 — MandantContext URL-primary | 2026-04-20 | 1030 / 71 |
| 3 | Sprint Arbeitsplatz-Tree-UI | 2026-04-20 | 1038 / 71 |
| 4 | Multi-Tenancy Foundation (Phase 1) | 2026-04-20 | 1088 / 81 |
| 5 | Multi-Tenancy Phase 2 | 2026-04-20 | 1126 / 87 |
| 6 | Multi-Tenancy Phase 3 (`client_id` RESTRICTIVE) | 2026-04-20 | 1232 / 100 |
| 7 | Nacht-Modus 2026-04-21 | 2026-04-21 | 1254 / 105 |
| 8 | Smart-Warning-Banner (Entwurf) | 2026-04-21 | 1269 / 106 |
| 9 | Jahresabschluss-E1 — Pre-Closing-Validation | 2026-04-21 | 1318 / 114 |
| 10 | Jahresabschluss-E2 — Condition-Wizard + Rules | 2026-04-22 | 1363 / 123 |
| 11 | Jahresabschluss-E3a — Editor + HGB-Textbausteine | 2026-04-23 | 1392 / 127 |
| 12 | Jahresabschluss-E3b — Document-Merge + PDF | 2026-04-23 | 1434 / 133 |
| 13 | Jahresabschluss-E4 — Real-Builder + PDF/A-3 + XBRL-Multi | 2026-04-23 | 1460 / 137 |
| 14 | LSt-Anmeldung + ZM (ELSTER-XML) | 2026-04-24 | 1478 / 140 |
| 15 | SV-Meldungen DSuV | 2026-04-24 | 1507 / 145 |
| 16 | Bank-Reconciliation-Persistenz (schließt Tech-Debt) | 2026-04-25 | 1542 / 149 |
| 17 | Employee-SV-Stammdaten (Expand-Phase) | 2026-04-25 | 1569 / 152 |
| 18 | Inventur-Modul (§ 240 HGB) | 2026-04-26 | 1609 / 157 |
| 19 | Sprint 17.5 — Erläuterungsbericht + BStBK-Bescheinigung | 2026-04-27 | 1656 / 164 |

Netto-Testwachstum seit Bugfix-Runde: +664 (aktueller vitest-Lauf 1659/165).

---

## 8. Compliance-Status

Langform in [`docs/COMPLIANCE-GUIDE.md`](./docs/COMPLIANCE-GUIDE.md). Matrix
aus Bericht §6:

| Anforderung | Status | Nachweis |
|---|---|---|
| § 146 AO Unveränderbarkeit | erfüllt | `entry_hash`-Kette + FestschreibungsService; Reversal nur über neue Buchungen |
| GoBD Rz. 44 Belegprinzip | erfüllt | Belege-Tabelle (0022) + FK-Link zum Journal + OCR |
| GoBD Rz. 45 Vollständigkeit | erfüllt | Bank-Recon-Matches (0031) + ClosingValidation 5%-Threshold + Inventur-Gate (0034) |
| GoBD Rz. 50 Zeitgerechtigkeit | teilweise | Festschreibungs-Service erzwingt Zeitreihen-Integrität, keine Auto-10-Tage-Regel |
| GoBD Rz. 153-154 Audit-Chain | erfüllt | Audit-Log + Hash-Chain (0002/0003/0010) |
| § 147 AO 10-J-Archivierung | teilweise | PDF/A-3 opt-in, externe veraPDF-Validierung dokumentiert, ICC-Profil als Placeholder |
| § 5b EStG E-Bilanz | teilweise | XBRL für HGB-Taxonomie 6.8 produktiv; 6.6/6.7/6.9-Infrastruktur vorhanden, Schemas offen (Tech-Debt §10.2); ERiC-Transmission fehlt (P1) |
| Mandantenfähigkeit | erfüllt | `company_id`-RLS (0004) + `client_id`-RESTRICTIVE (0026); Expand-Phase für Employee/Client in Sprint 18 |
| § 240 HGB Inventur | erfüllt | Sprint 17: 3 Tabellen + Wizard + ClosingValidation-Integration |
| § 242 HGB Jahresabschluss | erfüllt | Wizard 7/7 Komponenten (E1–E4 + Sprint 17.5) |
| DEUeV (§§ 28a/28b SGB IV) | teilweise | DSuV-XML + Beitragsnachweis-CSV für Portal-Upload; ITSG-Trustcenter fehlt |
| BStBK-Bescheinigung | erfüllt | Sprint 17.5: 3 Typen, `Object.freeze`-Constants, Whitelist-Placeholders, Readonly-Preview, Update-Guide |

**Nicht produktionsreif (bewusst ausgelassen):** ERiC-Direkttransmission ·
ITSG-Trustcenter · BZSt-BOP-ZM-Upload · Vollwertige Lagerverwaltung ·
KSt-/GewSt-Erklärung (nur Grundgerüst) · Bundesanzeiger-Offenlegung ·
Konzern-JA (§§ 290/315) · Digital-Signatur auf PDF · UKV-GuV (§ 275 Abs. 3) ·
ELStAM-Abruf · § 41b EStG Lohnsteuerbescheinigung-XML · VSNR-Checksum ·
Krankenkassen-Stammdaten-Modul · Auto-Inventur-Vorjahres-AB-Übernahme ·
veraPDF-CI-Pipeline · BWA nicht Teil der JA-Pipeline.

---

## 9. Common Commands

Aus `D:/harouda-app` (bash / Windows Git-Bash):

```bash
npm install
npm run dev                                  # Vite-Dev auf :5173
npm run lint
NODE_OPTIONS=--max-old-space-size=8192 npx vitest run         # 1659 Tests, ~100 s
npm run test:watch
npm run test:ui                              # Vitest-UI auf :51204
npm run test:coverage                        # v8-HTML in coverage/
NODE_OPTIONS=--max-old-space-size=4096 npx tsc --noEmit       # Standalone Type-Check
NODE_OPTIONS=--max-old-space-size=8192 npm run build          # tsc -b && vite build
```

Einzeldatei: `npx vitest run src/lib/db/__tests__/journalRepo.test.ts`.

CI-Äquivalent lokal:
`npx tsc --noEmit && npm run lint && npx vitest run --coverage && npm run build`.

---

## 10. Offene Arbeit

### 10.1 P1 — Go-Live-Blocker (außerhalb TypeScript-Scope)

1. **ELSTER-ERiC-Transmission** (UStVA / LStA / E-Bilanz) — separates
   C++-DLL-Backend als Microservice. Keine aktive Sprint-Planung.
2. **ITSG-Trustcenter-Anbindung** für DEUeV — Zertifikat + Contract.
3. **BZSt-BOP-ZM-Upload** — bleibt manueller Portal-Upload.
4. **Playwright-E2E** (10 kritische Journeys) — 1–2 Wochen.
5. **Server-side Backup** (Supabase PITR + `pg_dump` Edge-Function + S3
   Frankfurt + Restore-Runbook). Siehe
   [`docs/BACKUP-STRATEGY.md`](./docs/BACKUP-STRATEGY.md). Der
   `/admin/datenexport`-Pfad (DSGVO Art. 20) **schließt diesen Blocker nicht**.
6. **DSGVO-Paket** — Teilweise erledigt (TTDSG-Gate, Cookie-Consent,
   Impressum/Datenschutz-Scaffolds, Migration 0023). Offen:
   Hash-Chain-vs-Anonymization-Design für Art. 17, Supabase-Auth-Wiring für
   `privacy_requests`/`cookie_consents`, User Privacy Dashboard, Admin
   Privacy Page (Art. 30/32), AVV-Template, Breach-Notification (Art. 33/34).

### 10.2 Tech-Debts (3 offen, 1 geschlossen)

Alle in `docs/TECH-DEBT-*.md`.

1. **`TECH-DEBT-AV-VERTRAEGE-SUPABASE.md`** — offen · **Low**. AV-Vertrags-
   Stammdaten liegen in localStorage (`harouda:av-vertraege:<mandantId>`),
   Migration nach Supabase-Tabelle `av_vertraege` steht aus. Aufwand ~halber
   Sprinttag. Trigger: Cross-Device-Anforderung oder breiterer Stammdaten-
   Migration-Sprint.
2. **`TECH-DEBT-XBRL-MULTI-VERSION.md`** — offen · **Medium** (wird P1 bei
   erstem 2023-/2024-Stichtag). Infrastruktur + Picker vorhanden; konkrete
   XBRL-Struktur-Module für HGB-Taxonomie 6.6 / 6.7 / 6.9 fehlen.
   Aktueller Export nutzt 6.8-Struktur + Version-Tag 6.x → formal fehlerhaft
   bei historischen Stichtagen. Je Version ~3–5 Tage.
3. **`TECH-DEBT-EMPLOYEE-SV-FIELDS-CONTRACT.md`** — offen · **Low** (wartet
   auf 100 %-Backfill). Contract-Phase (NOT-NULL-Migration für 7 Employee-
   SV-Felder + 4 Client-Anschrift-Felder) erfordert Dashboard-Metric
   `sv_stammdaten_incomplete_count` + Steuerberater-Review. Nebenfund:
   `geburtsdatum`-Feld fehlt am Employee (DEUeV-Pflicht, aktuell umgangen
   via `einstellungsdatum`).
4. **`TECH-DEBT-BANK-RECONCILIATION-PERSISTENZ.md`** — **CLOSED** Sprint 16
   (2026-04-25) via Migration 0031 + Fingerprint-Service + AutoMatcher +
   Persistence-Banner.

### 10.3 Open-Questions (alle gelöst, zur Referenz)

- **`OPEN-QUESTIONS-NACHT-2026-04-21.md`** — beide Fragen gelöst.
  Frage 1 (AnlageVorsorge KV-Import-Semantik): Default `kv_an_basis +
  kv_an_zusatz` → `z11_kv_an`, User-bestätigt. Frage 2 (Entwurfs-Buchungen
  in Anlage G): Strikte `"gebucht"`-Filterung + Simulation-Toggle via
  Smart-Banner-Sprint.
- **`OPEN-QUESTIONS-JAHRESABSCHLUSS-E1-2026-04-21.md`** — beide Fragen
  gelöst/weitergereicht. Frage 1 (Bank-Recon-Gaps): Warning-Finding +
  Tech-Debt-Ticket (jetzt geschlossen durch Sprint 16). Frage 2 (EÜR↔GuV-
  Cross-Check für Kapitalgesellschaften): in E2-Rules-Engine behandelt.

### 10.4 Deprecation-Watch (handeln vor Release)

- **HGB-Taxonomie 6.9** (April 2026 — **akut fällig**, siehe Tech-Debt §10.2).
- **Lohn-Tarif + SV 2026** — BMF-Release Dez/Jan; vor Januar-Payroll:
  `lohnsteuerTarif2026.ts` + `sozialversicherungParameter2026.ts`.
- **DATEV EXTF 520** — H2/2026.
- **XRechnung 3.1** — in Konsultation.

### 10.5 Folge-Sprint-Kandidaten (nicht Tech-Debt, nicht Blocker)

Lohnsteuerbescheinigung-XML (§ 41b EStG) · Krankenkassen-Stammdatenmodul
(BBNR + Zusatzbeitrag + AAG) · VSNR-Checksum + DEUeV-Schlüsselverzeichnis-
Dropdowns · § 285 HGB weitere Nummern (2–6, 8, 11–35) · § 289a–e HGB
(Nichtfinanzielle Erklärung + Unternehmensführung) · Konzern-JA (§§ 290/315) ·
Wizard-Editor-Step für Anhang/Lagebericht-Overrides · Logo-Upload auf
Deckblatt · UKV-GuV-Verfahren · ICC-Profil einchecken + OutputIntent via
pdf-lib-Low-Level-API · veraPDF-CI-Integration · BWA-Aufwertung + Einbindung
in JA-Pipeline · EÜR-Integration im JA-PDF · ELStAM-Abruf · Mehrjahres-
vergleich (3+) · SKR04 / SKR49-Seed · OSS/IOSS · PEPPOL-Access-Point ·
10-J-Retention-Auto-Enforcement · Mobile/PWA.

---

## 11. Working-Style-Guidelines

**Sprache.** User-facing-Strings deutsch (Kanzlei). Code + Identifier
englisch. Legal-Reference-Kommentare deutsch neben dem Paragraph-Zitat.
Beispiel: `// § 14 Abs. 4 UStG — Pflichtangaben`.

**Legal-References inline.** Wenn UI oder Code eine Regel kodiert, §-Zitat
dazu. `<h1>UStVA (§ 18 UStG)</h1>`. Bei Änderung Statute → `docs/ROADMAP.md`
Deprecation-Watch pflegen.

**GoBD first.** Wer Journal, Audit oder Retention anfasst:
1. Hash-Chain bewahren (`prev_hash`/`entry_hash`). Nie in-place updaten;
   immer neuer Chain-Eintrag.
2. Nie `FestschreibungsService` umgehen — Service-Methode ergänzen, nicht
   Direkt-Write.
3. RLS-Policies sind zweite Verifikationslinie — App-Layer reicht nicht.

**Honest Disclosure.** Bei teilkonformen Features (XRechnung BR, PDF/A-3
XMP, E-Bilanz XBRL-Multi-Version): JSDoc am Modul + Eintrag in
`docs/COMPLIANCE-GUIDE.md` + UI-Disclaimer (oranger `.disclaimer`-Strich).
Nie Zertifizierung behaupten, die nicht existiert.

**Money-Disziplin.** Jeder Geldwert der Domain über `Money`. `number` nur
für Counts, Raten (0.19 USt), Tage.

**Dual-Mode.** Neue Repo-Methoden decken beide Pfade ab (localStorage +
Supabase). Gate: `shouldUseSupabase()`. Tests laufen DEMO per Default.

**Tests co-located.** `__tests__/` im Modul-Verzeichnis. Nie `tests/` auf
Top-Level. Naming: `XYZ.test.ts(x)`.

**Keine verfrühten Abstraktionen.** Drei ähnliche Zeilen > Zwei-Call-Helper.
Abstraktion bei Call-Site 4, nicht früher.

**UI-Patterns.** Disclaimer-Banner: orange Border-Left via
`ustva__disclaimer`. Stat-Cards: `.card` + Mono-Font für Zahlen. Modals
inline (kein Portal), Backdrop-Click dismissed.

**Mandantenfähigkeit.** `company_id` (Org) + `client_id` (Mandant innerhalb
Org). RESTRICTIVE-Policy `client_belongs_to_company` erzwingt
Cross-Company-Konsistenz. MandantContext ist **URL-primary** seit Sprint F42.

**Expand-and-Contract für Stammdaten-Migrationen.** Neue Pflichtfelder
zuerst NULLABLE, Contract-Migration erst nach verifiziertem 100 %-Backfill.
Completeness-Helpers in `domain/employees/svCompleteness.ts`-Pattern
wiederverwenden.

---

## 12. Known Limitations

Explizit, damit keine Session auf falsche Annahme handelt:

1. **PDF/A-3 (ZUGFeRD) nicht formal zertifiziert.** Attachment via `/AF`
   korrekt; alle konformen Reader parsen. Kein XMP-Stream, kein
   OutputIntent, ICC-Profil als Placeholder — veraPDF würde failen.
   Externe Post-Prozessierung für Langzeit-Archiv nötig.
2. **XRechnung-Validator ~20 von 200+ BR-Regeln.** Core-Felder, Struktur,
   Currency, Country, VAT-Category-Basics. KoSIT-Public-Validator vor
   produktivem Rechnungsverkehr nutzen.
3. **ELSTER-Transmission nicht implementiert.** XML wird erzeugt; Nutzer
   uploadet manuell im Portal. Separater Backend-Service geplant (P1).
4. **Vorsorgepauschale vereinfacht** vs. voll BMF-PAP (West/Ost-Splits,
   Drittel-Klauseln weggelassen).
5. **Belegerfassung-Supabase-Pfad noch unverifiziert im Staging.**
   Migration 0022 + `journalRepo` auf DEMO getestet; Supabase-Branch
   kompiliert, erste Verifikation im Staging.
6. **Audit-Chain tamper-evident, nicht WORM.** Direkter DB-Admin kann
   Chain brechen; Chain detektiert es. Für WORM → Append-only-Mirror.
7. **OCR-Qualität varies.** Tesseract für Druck gut; Handschrift → manuell.
8. **Z3-Export-Format "nachgebildet"**, nicht IDEA-Testtool-zertifiziert.
9. **happy-dom + UBL Default-Namespace.** `querySelector` verhält sich nicht
   wie im Browser. XRechnung-Parser nutzt `localName`-Helpers
   (`childByName`, `descendantsByName`). Nicht zu `querySelector`
   regressen.
10. **CI-Workflows gegen echtes GitHub ungetestet.** Beim ersten Live-PR
    evtl. Secret-/Vars-Fixup nötig.
11. **Husky-Hooks inaktiv** bis `git init` + `npm run prepare`.
    Working-Dir ist noch kein Git-Repo.
12. **Sentry opt-in.** Kein DSN → `initSentry()` ist No-op. Kein PII
    verlässt Browser ohne konfigurierten DSN.
13. **Analytics Consent-gated (TTDSG § 25).** GA4 / Plausible laden NUR
    wenn Admin konfiguriert hat UND User `analytics`-Consent im Banner
    erteilt hat. Gate in `main.tsx` + `CookieConsentContext`.
14. **`CookieConsent` nutzt kein react-router.** Banner wird in `main.tsx`
    als Sibling von `<App />` außerhalb `<BrowserRouter>` gemountet. Footer
    nutzt plain `<a>`, nicht `<Link>`. Invariante im File-Header dokumentiert
    + Regression-Test vorhanden.
15. **Datenschutzerklärung + Impressum sind Scaffolds.** TODO-Placeholder +
    rotes "nicht rechtsverbindlich"-Banner. MUSS vor Produktion von Fach-
    anwalt IT-Recht befüllt werden; fehlerhafte Angaben abmahnfähig
    (§ 3a UWG / Art. 83 DSGVO).
16. **`/admin/datenexport` ist Export, kein Backup.** Client-side DSGVO-
    Art.-20-Portability — SHA-256-Manifest detektiert Korruption, NICHT
    Tampering (kein Signing-Key). Kein Restore, keine Automation, keine
    Off-Site-Kopie. P1-Backup-Blocker (§10.1.5) ist serverseitige Arbeit.
17. **Zwei "Backup"-UIs koexistieren.** Legacy `src/api/backup.ts` →
    localStorage-only JSON-Export in `SettingsPage` (DEMO only, unsafe
    restore). `/admin/datenexport` ist ehrlich-benannter Successor.
    Legacy nicht erweitern.
18. **DEMO_MODE-Heuristik.** `api/supabase.ts` berechnet `DEMO_MODE`
    dynamisch: `VITE_DEMO_MODE=1` → true, `=0` → false, unset →
    `import.meta.env.DEV`. `npm run dev` und `vitest` laufen per Default
    DEMO; `vite build` erzeugt Production-Bundle mit DEMO_MODE=false.
    Tests, die DEMO_MODE=false brauchen, müssen via
    `vi.mock("../api/supabase", ...)` überschreiben. Referenz:
    `src/lib/db/__tests__/auditLogRepo.test.ts`.
19. **XBRL-Multi-Version: Export mit 6.8-Struktur für alle Stichtage.** Der
    Picker wählt die richtige Versions-Tag-Nummer, aber der Builder nutzt
    durchgängig das 6.8-Strukturmodul (siehe Tech-Debt §10.2). Formal
    fehlerhaft für 2023-/2024-Stichtage — nicht produktionsreif für
    historische Nachmeldungen.
20. **BStBK-Bescheinigung readonly + Whitelist-Placeholders.** Constants
    via `Object.freeze`. Änderung erfordert Steuerberater-Sign-off im
    `BSTBK-BESCHEINIGUNG-UPDATE-GUIDE.md`.
21. **Wizard-Session nur localStorage.** Kein Team-Sharing, kein Cross-
    Device. Folge-Sprint-Kandidat.
22. **BWA nicht Teil der JA-Pipeline.** `BwaBuilder` + `BwaPage` existieren
    strukturell, aber ohne Sprint-Fokus seit 2026-04-20.

---

## 13. Quick-Start für neue AI-Session

1. **Diese Datei vollständig lesen.** §10 für Offenes anskimmen.
2. **Verification-Gate** vor Code-Änderung, damit Baseline bekannt:
   ```bash
   cd D:/harouda-app
   NODE_OPTIONS=--max-old-space-size=4096 npx tsc --noEmit
   NODE_OPTIONS=--max-old-space-size=8192 npx vitest run
   ```
3. **DEMO-Login für UI-Checks:** `npm run dev` → `/login` → "Demo"-Button
   (`admin@harouda.de` / `password123`). DEMO-Mode ist im Dev-Server per
   Default aktiv (ohne `.env.local`-Edit); `autoSeedDemoIfNeeded()` lädt
   Kühn Musterfirma GmbH (4 Mandanten, 5 KST, 2 KTR, 3 Mitarbeiter,
   8 Anlagen, 52 festdatierte 2025-Journalbuchungen) aus
   `demo-input/musterfirma-2025/`. Flag-Key `harouda:demo-seeded-v3`
   verhindert Re-Seed; v1/v2-Legacy werden migriert. Opt-out:
   `VITE_DEMO_MODE=0` in `.env.local`.
4. **Relevantes Modul lokalisieren** via §5 (Tree) + §6 (Feature-Map) —
   nicht blind greppen.
5. **§11 Style-Regeln befolgen.** Deutsch-UI, GoBD-Disziplin, Dual-Mode,
   Honest Disclosure.
6. **Tests co-located**, laufen mit `npx vitest run <file-pattern>`.
7. **Bei Änderung Statute-tracking-Modul** (Lohn, UStVA, HGB-Mappings):
   `docs/COMPLIANCE-GUIDE.md` + Deprecation-Watch §10.4 nachziehen.
8. **Bei neuer Feature-Page** beide Stellen: `App.tsx`-Route UND
   `AppShell.tsx`-Menü. Sonst orphaned.
9. **Bei neuer Dependency:** Rationale in PR + `npm audit`.
10. **Honest-Disclosure-Disziplin.** Wenn Feature Spec nicht voll
    implementiert → UI-`⚠️`-Disclaimer.

**Common Mistakes (vermeiden):**
- `number` für Geld → immer `Money`.
- `querySelector` auf UBL-XML → nur `localName`-Helpers.
- Direkt in `journal_entries` schreiben → bricht Hash-Chain. Nutze
  `FestschreibungsService` / `journalRepo`.
- Volle PDF/A-3 / XRechnung-Compliance behaupten → es ist partial.
- Alte Migration editieren → immer neue nummerierte Migration.
- AppShell-Menü vergessen → Route unsichtbar.
- XBRL-Export für 2023/2024-Stichtag ohne Tech-Debt-Hinweis → formal
  fehlerhafte Abgabe (siehe §10.2).

Task-Liste (`TaskList`) checken, falls vorige Session Pendings hinterlassen
hat. Ansonsten auf User-Anweisung warten.
