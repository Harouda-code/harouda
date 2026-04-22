# harouda-app · Projekt-Gesamtbericht

**Stand:** 2026-04-27 · 1656 Tests grün · 164 Test-Dateien · tsc clean.
**Zweck:** Einmalige, autonome Zusammenfassung für Project-Owner,
Steuerberater, Investor oder Entwickler.

---

## 1. Executive Summary

harouda-app ist eine deutsche Kanzlei-Software (SaaS-fähig) für
Buchhaltung, Lohn, Steuer-Meldungen, Inventur und Jahresabschluss-
Erstellung nach HGB/GoBD. Zielgruppe sind Steuerberater, Kanzlei-
Mitarbeiter und mittelständische GmbH-Mandanten. Das Projekt umfasst
521 TypeScript-Dateien in `src/` (~146 700 Zeilen), 34 Supabase-
Migrationen und 164 Vitest-Testdateien mit 1656 grünen Tests. Der
Reifegrad entspricht einer produktionsreifen Front-End-Lösung mit
dokumentierten Grenzen — insbesondere fehlt die direkte Transmission
an ELSTER/ITSG (manueller Upload), und drei Tech-Debt-Tickets sind
offen (BStBK-Review-Pflicht, XBRL-Multi-Version-Schemas, Employee-
Contract-Phase). TypeScript-Compiler und Tests sind zum Stand-Datum
sauber.

## 2. Stack-Übersicht

- **UI:** React 19 · Vite 8 · TypeScript 5.9 (strict) · react-router v7.
- **State/Daten:** TanStack Query v5 · Supabase (Postgres + RLS +
  Auth + Storage) · Dual-Mode DEMO/localStorage ↔ Supabase.
- **Forms:** react-hook-form v7 (nur wo komplex nötig).
- **Money:** Decimal.js 10.6 via `Money`-Wrapper, Banker's Rounding.
- **PDF:** jsPDF + jspdf-autotable (Reports) · pdfmake 0.3.7
  (Jahresabschluss-Vektortext) · pdf-lib 1.17 (PDF/A-3 +
  ZUGFeRD-Attachment).
- **E-Rechnung:** XRechnung + ZUGFeRD (structural + core BR-Regeln).
- **Rich-Text:** TipTap v3 (Anhang-/Lagebericht-/Erläuterungs-Editor).
- **OCR:** tesseract.js 7 (Dokumenten-Scanner, Demo-Qualität).
- **Tests:** vitest 4.1 + happy-dom 20 + coverage-v8.
- **Monitoring:** @sentry/react 8.50 (PII-scrubbed, opt-in).
- **Lint/Hooks:** husky 9 + lint-staged 15 (dormant bis `git init`).

Architektur-Prinzipien: doppelte Buchführung Soll/Haben, GoBD-Hash-
Chain (SHA-256, prev_hash/entry_hash), Festschreibungs-Service als
zentrale Guard, Mandantenfähigkeit via `company_id` + `client_id`-
RLS (Phase-1-Foundation Migration 0004 · Phase-2-Isolation 0026),
UTC in Datenbank / Europe-Berlin in UI, Pure-Function-Domain-Layer
mit React-unabhängigen Buildern (Bilanz, GuV, Anlagenspiegel,
Jahresabschluss-Pipeline), Dual-Mode-Service-Layer (alle Repos
akzeptieren `shouldUseSupabase()`-Branching).

## 3. Migrationen (34 insgesamt)

| # | Datei | Zweck |
|---|---|---|
| 0001 | `0001_init.sql` | Initialschema: clients, accounts, journal_entries, documents. |
| 0002 | `0002_audit_log.sql` | Zentrales Audit-Log mit Diff-Payload. |
| 0003 | `0003_audit_hash_chain.sql` | SHA-256-Kette über audit_log (GoBD Rz. 153). |
| 0004 | `0004_multitenant.sql` | `company_id`-RLS-Pattern: `is_company_member`, `can_write`, `tg_set_updated_at`. |
| 0005 | `0005_dunning_records.sql` | Mahnwesen-Tabelle. |
| 0006 | `0006_gobd_append_only.sql` | Festschreibungs-Trigger (erste Generation). |
| 0007 | `0007_tax_auditor_role.sql` | Betriebsprüfer-Rolle (Z3-Export). |
| 0008 | `0008_scaling_readiness.sql` | Indizes + Policies für Last-Last-Skalierung. |
| 0009 | `0009_journal_autolock.sql` | Festschreibung nach UStVA-Abgabe. |
| 0010 | `0010_journal_hash_chain.sql` | Hash-Kette im journal_entries (GoBD Rz. 154). |
| 0011 | `0011_app_logs.sql` | Operative Logs. |
| 0012 | `0012_invoice_archive.sql` | Invoice-Archiv + XML-Archiv. |
| 0013 | `0013_elster_submissions.sql` | UStVA/LStA-Einreichungs-Historie (Metadaten). |
| 0014 | `0014_supplier_preferences.sql` | Lieferanten-Stammdaten-Präferenzen. |
| 0015 | `0015_advisor_notes.sql` | Steuerberater-Notizen pro Mandant. |
| 0016 | `0016_employees.sql` | Mitarbeiter-Stammdaten für Lohn. |
| 0017 | `0017_cost_centers.sql` | Kostenstellen (Dimension "wo"). |
| 0018 | `0018_receipt_requests.sql` | Beleg-Nachforderungen. |
| 0019 | `0019_hgb_balance_sheet.sql` | Closure-Table + SKR-Mapping für HGB § 266. |
| 0020 | `0020_lohn_persistence.sql` | Persistenz von Lohnabrechnung + Archiv. |
| 0021 | `0021_gobd_festschreibung.sql` | Festschreibungs-Service zentralisiert. |
| 0022 | `0022_belege_persistence.sql` | Belegerfassung → Supabase. |
| 0023 | `0023_dsgvo_compliance.sql` | DSGVO: cookie_consents, privacy_requests, privacy_incidents. |
| 0024 | `0024_cost_carriers.sql` | Kostenträger (Dimension "wofür"). |
| 0025 | `0025_anlagenbuchhaltung.sql` | Anlagegüter + AfA-Buchungen. |
| 0026 | `0026_multitenant_client_id.sql` | `client_id`-Spalten + RESTRICTIVE-Policy `client_belongs_to_company`. |
| 0027 | `0027_journal_batch.sql` | Atomare Batch-Erzeugung für Lohn/Import. |
| 0028 | `0028_lohn_archiv_batch.sql` | Lohn-Archiv + batch_id-Verknüpfung zum Journal. |
| 0029 | `0029_est_tags_backfill.sql` | SKR03-Tag-Backfill für ESt-Anlagen. |
| 0030 | `0030_client_rechtsform_stammdaten.sql` | Rechtsform, HRB, Geschäftsführer-JSONB, Wirtschaftsjahr. |
| 0031 | `0031_bank_reconciliation_matches.sql` | Bank-Journal-Match-Log mit Fingerprint-Unique. |
| 0032 | `0032_employee_sv_fields_expand.sql` | SV-Pflichtfelder am Employee (nullable, Expand-Phase). |
| 0033 | `0033_client_anschrift_expand.sql` | Arbeitgeber-Anschrift am Client (nullable). |
| 0034 | `0034_inventur_tables.sql` | inventur_sessions + inventur_anlagen + inventur_bestaende. |

## 4. Funktionaler Scope

### 4.1 Buchhaltung (Journal + Konten)
- Doppelte Buchführung mit SKR03-Seed (130+ Konten) · SKR04-Support
  strukturell vorbereitet, kein Seed.
- GoBD-Hash-Chain auf `journal_entries.entry_hash` + `prev_hash`,
  company-weit verkettet.
- Festschreibungs-Service: Verhindert Mutation festgeschriebener
  Perioden. Storno + Korrektur nur über neue Buchungen.
- Atomare Batch-Erstellung (Migration 0027) für Lohn-Läufe und
  CSV-Import.
- Seiten: Belegerfassung, BelegeListe, AuditTrailPage, DatevExport,
  Z3ExportPage.

### 4.2 Belege + E-Rechnung
- Invoice-Archiv (Migration 0012) + XML-Archiv (ZUGFeRD/XRechnung).
- OCR via tesseract.js (Dokument-Scanner-Seite).
- XRechnung-Builder + -Parser + -Validator (Structural + Core-BR-
  Regeln, ~20 von 200+ KoSIT-Regeln).
- ZUGFeRD via pdf-lib: `/AF`-Attachment mit `AFRelationship=Alternative`.

### 4.3 Lohn
- Phase-2-Engine mit Tarif 2025, SV-Parametern 2025, Vorsorgepauschale.
- Lohnabrechnung-Archiv in `lohnabrechnungen_archiv` mit kompletter
  JSON-Serialisierung der Abzüge (kv/rv/av/pv AN + AG).
- LSt-Anmeldung-Builder (14 Kz) + ELSTER-XML-Generator (Sprint 14).
- SV-Meldungen: DSuV-XML + Beitragsnachweis-CSV für SV-Meldeportal
  (Sprint 15). Pflichtfelder Expand-Phase abgeschlossen (Sprint 18).
- Seiten: LohnPage, LohnsteuerAnmeldungPage, SvMeldungenPage,
  AbrechnungsArchivPage, PayrollRunPage, EmployeesPage.

### 4.4 Bank-Reconciliation
- MT940-Parser + CAMT.053-Parser (+ CSV-Fallback).
- Persistenz seit Sprint 16: `bank_reconciliation_matches` mit
  SHA-256-Fingerprint als Unique-Key (keine `bank_transactions`-
  Tabelle nötig, weil Bank-Transaktionen weiter session-only sind).
- Auto-Matcher mit transparentem Confidence-Scoring (exact → ±1 Tag
  → ±3 Tage → ±1 Cent → reasoning-Array).
- ClosingValidation-Integration: Blocker ab > 5% pending-Anteil.

### 4.5 Steuer-Meldungen
- **UStVA + ZM** (Sprint 7 / Phase 3): ELSTER-ähnliches XML +
  ELSTER-Schema-Variante (Sprint 14).
- **LSt-Anmeldung**: ELSTER-XML, Sprint 14.
- **ZM (ELMA5-Style)**: `<ZusammenfassendeMeldung>` für BZSt-BOP.
- **ZM (ELSTER-Style)**: parallel, Sprint 14.
- **SV-Meldungen (DEUeV)**: DSuV-XML + Beitragsnachweis-CSV für
  manuellen Upload im SV-Meldeportal, Sprint 15+18.
- **E-Bilanz XBRL**: HGB-Taxonomie 6.8 produktiv, 6.6/6.7/6.9-
  Infrastruktur (Picker + Register) vorhanden, Schemas offen.
- Alle Generatoren haben `schema_version`-Konstante + UPDATE-GUIDE.
- Direkt-Transmission nicht implementiert (kein ERiC, keine ITSG).

### 4.6 Anlagen + AfA
- Anlagegut-Type (Migration 0025) mit Abgangsdatum/-erlös.
- `AnlagenService`: `planAfaLauf`, `buchtAfaLauf`, `getAnlagenspiegelData`
  (§ 268 Abs. 2 HGB), `planAbgang`, `buchtAbgang`.
- AfA-Methoden: linear, GWG-Sofort, Sammelposten.
- Anlagenspiegel als 7-Spalten-Tabelle im Jahresabschluss.

### 4.7 Inventur-Modul (Sprint 17)
- 3 neue Tabellen: sessions / anlagen / bestaende.
- 3-Tab-Wizard: Anlagen-Inventur (Vorhanden/Verlust/Schaden mit
  Abgangs-Buchungs-Vorschlag) · Bestands-Inventur (manuelle Mengen
  + Niederstwert-Check + Pflicht-Upload der Inventurliste) ·
  Abschluss (Session blocken bis 100%-Coverage).
- Kein hart codiertes Konto: Dropdowns gefiltert nach SKR03/SKR04-
  Ranges für Vorräte, Bestandsveränderung, außerordentliche
  Aufwendungen.
- ClosingValidation-Integration: `INVENTUR_MISSING` (Warn),
  `INVENTUR_UNVOLLSTAENDIG` (Error, blockt), `INVENTUR_241A_ERLEICHTERUNG`
  (Info für Einzelunternehmen unter Schwelle).

### 4.8 Jahresabschluss-Wizard (7/7 Komponenten)
Schritte: Validation → Rechtsform → Größenklasse → Bausteine →
Erläuterungen → Review → Bescheinigung. Komponenten:
- **Deckblatt + TOC** (pdfmake-natives TOC mit Auto-Seitenzahl).
- **Bilanz + GuV + Anlagenspiegel** aus echten Domain-Buildern
  (E4: FinancialStatementsAdapter).
- **Anhang-Textbausteine** (6 MVP-Bausteine zu §§ 284-287 HGB,
  TipTap-editierbar via Override).
- **Lagebericht** (4 Bausteine zu § 289 Abs. 1/2/3/4 HGB).
- **Erläuterungsbericht** (Free-Form TipTap + 4 Phrasen-Chips,
  Sprint 17.5).
- **Bescheinigung** (BStBK-Stand 2023, 3 Typen, Whitelist-
  Placeholder, Readonly-Preview, Sprint 17.5).
- **Entwurfs-Watermark** + **PDF/A-3-Postprocessing** opt-in.

## 5. Sprint-Historie (chronologisch)

| # | Name | Datum | Test-Endstand | Status |
|---|---|---|---|---|
| 1 | Sprint Arbeitsplatz | 2026-04-20 | 1018 / 67 | abgeschlossen |
| 2 | Sprint F42 — MandantContext URL-primary | 2026-04-20 | 1030 / 71 | abgeschlossen |
| 3 | Sprint Arbeitsplatz-Tree-UI | 2026-04-20 | 1038 / 71 | abgeschlossen |
| 4 | Sprint Multi-Tenancy-Foundation (Phase 1) | 2026-04-20 | 1088 / 81 | abgeschlossen |
| 5 | Sprint Multi-Tenancy-Phase-2 | 2026-04-20 | 1126 / 87 | abgeschlossen |
| 6 | Sprint Multi-Tenancy-Phase-3 | 2026-04-20 | 1232 / 100 | abgeschlossen |
| 7 | Sprint Nacht-Modus 2026-04-21 | 2026-04-21 | 1254 / 105 | abgeschlossen |
| 8 | Sprint Smart-Warning-Banner (Entwurf) | 2026-04-21 | 1269 / 106 | abgeschlossen |
| 9 | Jahresabschluss-E1 — Pre-Closing-Validation | 2026-04-21 | 1318 / 114 | abgeschlossen |
| 10 | Jahresabschluss-E2 — Condition-Wizard + Rules | 2026-04-22 | 1363 / 123 | abgeschlossen |
| 11 | Jahresabschluss-E3a — Editor + HGB-Textbausteine | 2026-04-23 | 1392 / 127 | abgeschlossen |
| 12 | Jahresabschluss-E3b — Document-Merge + PDF | 2026-04-23 | 1434 / 133 | abgeschlossen |
| 13 | Jahresabschluss-E4 — Real-Builder + PDF/A-3 + XBRL-Multi | 2026-04-23 | 1460 / 137 | abgeschlossen |
| 14 | Sprint 14 — LSt-Anmeldung + ZM (ELSTER-XML) | 2026-04-24 | 1478 / 140 | abgeschlossen |
| 15 | Sprint 15 — SV-Meldungen DSuV | 2026-04-24 | 1507 / 145 | abgeschlossen |
| 16 | Sprint 16 — Bank-Reconciliation-Persistenz | 2026-04-25 | 1542 / 149 | abgeschlossen |
| 17 | Sprint 18 — Employee-SV-Stammdaten (Expand) | 2026-04-25 | 1569 / 152 | abgeschlossen |
| 18 | Sprint 17 — Inventur-Modul | 2026-04-26 | 1609 / 157 | abgeschlossen |
| 19 | Sprint 17.5 — Erläuterung + BStBK-Bescheinigung | 2026-04-27 | 1656 / 164 | abgeschlossen |
| 20 | (Pre-Sprint-8 Bugfix-Runde, 9 Fixes) | 2026-04-20 | unverändert | abgeschlossen |

Die Netto-Testentwicklung über die Serie: von ~995 (Post-Bugfix-Stand)
auf **1656 Tests** (+661). Migrationen sind von 0001–0034 durchgängig
versioniert.

## 6. GoBD/HGB-Compliance-Status

| Anforderung | Status | Nachweis |
|---|---|---|
| Unveränderbarkeit (§ 146 AO) | erfüllt | `entry_hash`-Kette + Festschreibungs-Service; Reversal/Correction nur über neue Buchungen. |
| Belegprinzip (GoBD Rz. 44) | erfüllt | Belege-Tabelle (0022) mit FK-Link zu Journal; OCR + File-Upload. |
| Vollständigkeit (GoBD Rz. 45) | erfüllt | Bank-Reconciliation-Matches (0031) + ClosingValidation-Threshold 5%; Inventur-Pflicht (§ 240 HGB) als Validator-Gate. |
| Zeitgerechte Erfassung (GoBD Rz. 50) | teilweise | Festschreibungs-Service erzwingt Zeitreihen-Integrität, aber keine automatische 10-Tage-Regel. |
| Nachvollziehbarkeit (GoBD Rz. 153-154) | erfüllt | Audit-Log + Hash-Chain (Migration 0002 + 0003 + 0010). |
| Aufbewahrung 10 Jahre (§ 147 AO) | teilweise | PDF/A-3-Konvertierung opt-in vorhanden (pdf-lib); externe veraPDF-Validierung dokumentiert, CI nicht automatisiert; ICC-Profil als Placeholder. |
| E-Bilanz (§ 5b EStG) | teilweise | XBRL-Builder für HGB-Taxonomie 6.8; ERiC-Transmission fehlt (P1-Blocker). |
| Mandantenfähigkeit | erfüllt | `company_id`-RLS (Migration 0004) + `client_id`-RESTRICTIVE-Policy (0026). Expand-Phase für Arbeitnehmer + Client-Anschrift in Sprint 18. |
| § 240 HGB Inventur | erfüllt | Sprint 17: 3 Tabellen + Wizard + ClosingValidation-Integration. |
| § 242 HGB Jahresabschluss | erfüllt | Wizard 7/7 Komponenten (E1–E4 + Sprint 17.5). |
| DEUeV (§§ 28a/28b SGB IV) | teilweise | DSuV-XML + Beitragsnachweis-CSV für SV-Meldeportal; ITSG-Trustcenter-Übermittlung fehlt. |
| BStBK-Bescheinigung | erfüllt | Sprint 17.5: 3 Typen, readonly Constants (`Object.freeze`), Whitelist-Placeholders, Readonly-Preview, Steuerberater-Sign-off im Update-Guide. |

## 7. Offene Tech-Debts

- **`TECH-DEBT-AV-VERTRAEGE-SUPABASE.md`** — offen · niedrige Priorität.
  AV-Vertrags-Stammdaten (ESt-Anlage AV) werden aktuell in
  localStorage gehalten; Supabase-Migration steht aus. Aufwand ~2–3
  Tage (neue Tabelle + RLS + Service + Backfill).
- **`TECH-DEBT-XBRL-MULTI-VERSION.md`** — offen · Medium.
  HGB-Taxonomie 6.6/6.7/6.9-Infrastruktur vorhanden, konkrete XBRL-
  Struktur-Mappings fehlen. Jede Version ein eigener Sprint
  (~3–5 Tage). Wird P1, sobald historische Stichtage verarbeitet
  werden sollen.
- **`TECH-DEBT-EMPLOYEE-SV-FIELDS-CONTRACT.md`** — offen · niedrige
  Priorität. Contract-Phase (`NOT NULL`-Migration) nach 100%-Backfill.
  Aktivierung erfordert Dashboard-Metric und Steuerberater-Abstimmung.
  Zusätzlich notiert: `geburtsdatum`-Feld fehlt am Employee (DEUeV-
  Pflicht; aktuell als `einstellungsdatum` umgangen).
- **`TECH-DEBT-BANK-RECONCILIATION-PERSISTENZ.md`** — **CLOSED** per
  Sprint 16 (2026-04-25).

## 8. Bewusst ausgelassen (nicht im aktuellen Scope)

- **ERiC-Direkttransmission** (UStVA, LStA, E-Bilanz) — erfordert
  natives C++-DLL-Backend. P1-Blocker im Gesamtprojekt.
- **ITSG-Trustcenter-Anbindung** für DEUeV — erfordert Zertifikat +
  Trustcenter-Contract. Keine Roadmap.
- **BZSt-BOP-ZM-Upload (ELMA5)** — bleibt manueller Portal-Upload.
- **Vollwertige Lagerverwaltung** (Wareneingang, FIFO/LIFO, Artikel-
  Bestände pro Charge). Inventur-Modul (Sprint 17) ersetzt das nicht.
- **Körperschaftsteuererklärung + Gewerbesteuererklärung** — ELSTER-
  XML-Builder dafür nicht vorhanden. Nur Grundgerüst.
- **Bundesanzeiger-Offenlegung** — Upload-Pfad nicht implementiert.
- **Konzern-Jahresabschluss** (§§ 290/315 HGB) — nur
  Einzelabschluss.
- **Digital-Signatur / Stempel** auf PDF — Unterschriften-Feld ist
  Platzhalter-Linie.
- **BWA-Modul** — `BwaBuilder` + `BwaPage` existieren strukturell,
  aber sind nicht Teil der aktuellen Jahresabschluss-Pipeline und
  nicht im Sprint-Fokus seit 2026-04-20.
- **UKV-GuV-Verfahren** (§ 275 Abs. 3 HGB) — GuV-Adapter markiert
  UKV-Input mit Warn-Banner, strukturierte Ausgabe fehlt.
- **ELStAM-Abruf** + **Lohnsteuerbescheinigung-XML** (§ 41b EStG
  jährlich) — Folge-Sprint-Kandidaten.
- **VSNR-Checksummen-Validierung** (SV-Nummer) + DEUeV-
  Schlüsselverzeichnis-Dropdowns — bleiben Freitext.
- **Auto-Inventur-Vorjahresanfangsbestand-Übernahme** — manuell.
- **Krankenkassen-Stammdaten-Modul** mit BBNR + AAG-Erstattungssatz —
  BBNR bleibt am Employee.
- **veraPDF-CI-Pipeline** — externes Kommandozeilen-Tool, nur per
  Deployment-Doku beschrieben.

## 9. Empfohlene nächste Schritte

- **"Production-Minimum für ersten Mandanten":** Steuerberater-Review
  der BStBK-Bescheinigungstexte + ICC-Profil ins Repo + veraPDF-Smoke
  im CI-Lauf + `git init` und echte CI-Provisionierung +
  Staging-Umgebung. ~1 Woche.
- **"Wachstum: mittlere Kanzlei":** AV-Vertrags-Migration + Ebit-
  BWA-Aufwertung + EÜR-Integration im Jahresabschluss-PDF +
  Lohnsteuerbescheinigung-Jahresmeldung + Krankenkassen-BBNR-
  Stammdatenmodul. ~3–5 Wochen.
- **"Enterprise":** ERiC-Bridge-Service (separater Node/Go-Backend) +
  ITSG-Trustcenter-Zertifikat + konkrete XBRL-Taxonomien 6.6/6.7/6.9
  + Multi-User-Permissions + automatisiertes Supabase-PITR-Backup mit
  Restore-Runbook. ~3 Monate.

## 10. Datei-Statistik (verifiziert per `find`/`wc`)

- **TypeScript-Dateien in `src/`:** 521 (`.ts` + `.tsx`).
- **Gesamt-Zeilen in `src/`:** ~146 700.
- **Seiten (`src/pages/*.tsx`):** 107.
- **Routen in `App.tsx`:** 98 `<Route>`-Definitionen.
- **Test-Dateien:** 164.
- **Tests grün:** 1656.
- **Domain-Subdirectories:** 22 (accounting, anlagen, bank, banking,
  belege, compliance, ebilanz, einvoice, elster, employees, est, euer,
  export, gdpdu, gobd, inventur, jahresabschluss, journal, lohn,
  privacy, sv, ustva).
- **API-Service-Dateien:** 33.
- **Supabase-Migrationen:** 34 (0001–0034).
- **Dokumente in `docs/`:** 90 (darunter 42 `SPRINT-*`, 4
  `TECH-DEBT-*`, Rest Guides + historische Pläne).

## 11. Kritische Datei-Lokationen (Quick-Referenz)

### Core / Foundation
- `CLAUDE.md` — Session-Kontext + Architektur-Prinzipien.
- `src/App.tsx` — Route-Registrierung.
- `src/api/db.ts` — Dual-Mode-Branching (`shouldUseSupabase`,
  `requireCompanyId`).
- `src/api/store.ts` — localStorage-Persistenz-Schicht (DEMO-Backend).
- `src/types/db.ts` — alle DB-Typen.

### Buchhaltung
- `src/api/journal.ts` — `createEntry`, GoBD-Hash-Kette.
- `src/lib/crypto/payrollHash.ts` — SHA-256 (wiederverwendet für
  Bank-Fingerprint).
- `src/domain/accounting/BalanceSheetBuilder.ts` + `GuvBuilder.ts` +
  `FinancialStatements.ts`.

### Jahresabschluss-Wizard
- `src/pages/JahresabschlussWizardPage.tsx` — Wizard-Orchestrator.
- `src/pages/jahresabschluss/Step*.tsx` — 7 Steps.
- `src/domain/jahresabschluss/WizardTypes.ts` + `wizardStore.ts`.
- `src/domain/jahresabschluss/pdf/DocumentMergePipeline.ts` —
  `buildJahresabschlussDocument`.
- `src/domain/jahresabschluss/bstbk/bstbkBescheinigungen.ts` +
  `bstbkPlaceholders.ts` — Sprint 17.5 Constants.

### Steuer-Meldungen
- `src/domain/elster/` (Sprint 14) — LStA-XML + ZM-ELSTER-XML +
  `xmlHelpers.ts`.
- `src/domain/sv/` (Sprint 15) — DSuV-Types + Builder + CSV.
- `src/domain/ebilanz/hgbTaxonomie.ts` — XBRL-Multi-Version-Picker.

### Bank + Inventur
- `src/api/bankReconciliationMatches.ts` (Sprint 16) + `src/domain/banking/`.
- `src/api/inventur.ts` + `src/domain/inventur/` (Sprint 17).
- `src/pages/InventurPage.tsx` + `src/pages/BankReconciliationPage.tsx`.

### Lohn
- `src/domain/lohn/LohnabrechnungsEngine.ts` + `LohnsteuerAnmeldungBuilder.ts`.
- `src/lib/db/lohnRepos.ts` — Abrechnungs-Archiv.
- `src/pages/SvMeldungenPage.tsx` + `LohnsteuerAnmeldungPage.tsx`.

### Dokumentation-Top-Referenzen
- `docs/JAHRESABSCHLUSS-SERIE-GESAMT-ABSCHLUSS.md`.
- `docs/BSTBK-BESCHEINIGUNG-UPDATE-GUIDE.md`.
- `docs/TEXTBAUSTEINE-UPDATE-GUIDE.md`.
- `docs/ELSTER-SCHEMA-UPDATE-GUIDE.md`.
- `docs/DSUV-SCHEMA-UPDATE-GUIDE.md`.
- `docs/DEPLOYMENT-VERAPDF-VALIDATION.md`.
- `docs/TECH-DEBT-*.md` (4 Tickets, 1 geschlossen, 3 offen).

---

**Stand 2026-04-27 · 1656 Tests · tsc clean.**
Erstellt durch Claude Code als Momentaufnahme. Bei jedem größeren
Sprint sollte dieser Bericht neu generiert werden.
