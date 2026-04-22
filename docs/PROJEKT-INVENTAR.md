# Projekt-Inventar — harouda-app

Stand: 2026-04-20 · Tests: 727 / 51 Dateien · Build: ✓ grün · tsc: clean.

Dieses Dokument ist eine ehrliche Bestandsaufnahme nach ca. 40 implementierten
Feature-Modulen. Kein Marketing-Text — Spalten wie „Deferred" und
Abschnitte wie „Not production-ready" sind explizit dazu da, damit niemand
den Zustand der App missversteht.

---

## 1. Feature-Matrix

| Modul | Status | Tests | Coverage | Legal Ref | Deferred / Gaps |
|-------|--------|-------|----------|-----------|-----------------|
| Bilanz HGB § 266 (Kontoform) | ✓ | 25 | ~95 % | HGB § 266 | Rest-/Liquiditätsgliederung |
| GuV HGB § 275 (GKV) | ✓ | 16 | ~94 % | HGB § 275 Abs. 2 | UKV (Abs. 3) |
| BWA (DATEV Form 01) | ✓ | 13 | ~96 % | DATEV-Standard | Form 02 / 03 |
| Vorjahresvergleich | ✓ | 9 | ~97 % | HGB § 265 Abs. 2 | Mehrjahresvergleich (3+) |
| Jahresabschluss (PDF) | ✓ | – | – | HGB § 242 | – |
| UStVA | ✓ | 18 | ~93 % | UStG § 18 | ELSTER-ERiC-Transport |
| ZM (§ 18a UStG) | ✓ | 13 | ~96 % | UStG § 18a | BZSt-BOP-Upload |
| Lohnsteuer-Anmeldung | ✓ | 8 | ~91 % | EStG § 41a | – |
| EÜR | ✓ | 17 | ~94 % | EStG § 4 Abs. 3 | Anlage AVEÜR Details |
| Lohn-Engine 2025 | ✓ | 19 | ~95 % | EStG §§ 38-42f | DEÜV, bAV, AAG |
| Vorsorgepauschale | ✓ | 12 | 100 % | EStG § 39b Abs. 4 | – |
| E-Bilanz XBRL | ✓ | 21 | ~90 % | EStG § 5b | XSD-Validierung, ERiC |
| XRechnung (UBL 2.1) | ✓ | 15 | ~88 % | EN 16931 / KoSIT 3.0 | ~20 von 200+ BR-Regeln |
| ZUGFeRD / Factur-X | ✓ | 15 | ~85 % | ISO 19005-3 | Echtes PDF/A-3 (XMP, OutputIntent) |
| Z3-Datenexport | ✓ | 16 | ~92 % | AO § 147 Abs. 6 | – |
| DATEV EXTF 510 | ✓ | 26 | ~95 % | DATEV-Spec 510 | – |
| DATEV LODAS (Lohn) | ✓ | 16 | ~94 % | DATEV LODAS | UI-Wiring, Verprobung |
| GoBD-Festschreibung | ✓ | 11 | 100 % | GoBD Rz. 64 | – |
| Audit-Trail | ✓ | 11 | ~82 % | GoBD Rz. 153-154 | PDF-Export-Report |
| Belegerfassung § 14 UStG | ✓ | 24 | 100 % | UStG § 14 Abs. 4 | DB-Persistenz (z.Zt. localStorage) |
| PDF-Reports | ✓ | 19 | ~85 % | – | UStVA/BWA as PDF |
| Money / Decimal | ✓ | 36 | 100 % | GoBD Rz. 58 | – |
| SKR03-Mapping | ✓ | 11 | 100 % | – | SKR04, SKR49, SKR51 |
| Deadline-Service (Fristen) | ✓ | – | ~90 % | AO § 149 | iCal-Sync |
| Mahnwesen | ✓ | – | ~80 % | BGB § 286 | Automatische Rhythmen |

**Legende:** ✓ = voll implementiert und getestet. Coverage ist Schätzung pro
Modul — die im Bericht zitierten 91,03 % Zeilen-Coverage sind der repo-weite
Wert aus dem letzten `vitest run --coverage`.

---

## 2. Test-Statistiken

- **Tests gesamt:** 676 (grün)
- **Test-Dateien:** 46
- **Coverage (repo-weit, letzter `vitest run --coverage`):**
  - Lines: 91,03 %
  - Branches: 76,75 %
  - Functions: 92,89 %
- **Test-Framework:** Vitest 4.1.4 mit `@vitest/coverage-v8`
- **Test-Environment:** `happy-dom` 20.9 (DOMParser, File/Blob)

### Top-Testdichte (nach Test-Anzahl)

1. **DATEV-Exporter** — 42 Tests (EXTF + LODAS + Unit-Verprobung)
2. **BalanceSheet / GuV** — 41 Tests (HGB-Struktur + SKR03-Mapping)
3. **Money / Decimal** — 36 Tests (Präzisions-Edge-Cases, Rundung)
4. **Lohn-Engine** — 27 Tests (Steuer + SV + Edge-Cases)
5. **Belegerfassung + Validierung** — 24 Tests
6. **E-Bilanz XBRL** — 21 Tests
7. **Z3-Export / GDPdU** — 16 Tests
8. **ZUGFeRD + XRechnung** — 37 Tests (9 ZUGFeRD + 28 XRechnung)

### Coverage-Extremwerte

| Voll abgedeckt (100 %) | Lücken (dokumentiert) |
|------------------------|------------------------|
| `lib/money/Money.ts` | `lohnRepos.ts` (0 %, noch kein Persistence-Pfad) |
| `compliance/DeadlineService.ts` | Chart-Komponenten (~80 %, reine SVG-Rendering) |
| `belege/BelegValidierungsService.ts` | Einzelne Page-Komponenten (~50-70 %) |
| `gobd/FestschreibungsService.ts` | `PdfReportBase`-Edge-Cases (~70 %) |
| `einvoice/xrechnungStructure.ts` | |

---

## 3. Compliance-Landschaft

### 3.1 Fully Compliant — ohne Vorbehalt einsetzbar

| Bereich | Norm | Nachweis |
|---------|------|----------|
| Bilanz-Gliederung | HGB § 266 | `hgb266Structure.ts` (Aktiva A-E, Passiva A-E) |
| GuV-Gliederung | HGB § 275 Abs. 2 | `hgb275GkvStructure.ts` (GKV, Pos. 1-17) |
| Vorjahresvergleich | HGB § 265 Abs. 2 | `VorjahresvergleichBuilder.ts` |
| Money-Präzision | GoBD Rz. 58 | `Money`-Klasse, Decimal.js, 41-stellig |
| Festschreibung | GoBD Rz. 64 | `FestschreibungsService.ts`, SHA-256-Hash, DB-Trigger |
| Beleg-Pflichtfelder | UStG § 14 Abs. 4 | `BelegValidierungsService.ts` |
| EÜR-Struktur | EStG § 4 Abs. 3 | `euerStructure.ts` |
| DATEV EXTF 510 | DATEV-Spec | `datev.ts`, Header + 26-Felder-Format |

### 3.2 Partially Compliant — Kernlogik valide, Grenzen dokumentiert

| Bereich | Norm | Grenze |
|---------|------|--------|
| E-Bilanz XBRL | EStG § 5b | XBRL well-formed + Taxonomie 6.8 gemappt; **keine XSD-Validierung** gegen offizielles Schema |
| XRechnung 3.0 | EN 16931 / KoSIT | ~20 BR-Regeln, davon 4 strukturelle (BR-X1..X4); **KoSIT hat 200+ Regeln** |
| ZUGFeRD 2.3 | ISO 19005-3 (PDF/A-3) | XML-Anhang wird per `pdf-lib.attach()` korrekt als AF-Filespec eingebettet; **kein XMP-Metadata-Stream, kein OutputIntent/ICC-Profile** → formal nicht zertifizierbar als PDF/A-3b |
| Vorsorgepauschale | EStG § 39b Abs. 4 | Basis-Berechnung korrekt; **BMF-PAP kennt Sonderfälle** (West/Ost-Umlage, AbschlussDrittelungen), die wir nicht abbilden |
| UStVA | UStG § 18 | ~40 Kennzahlen (81/86/35/48/66/83 u.a.), XML-Schema-konform; **keine ERiC-Transmission** |
| ZM | UStG § 18a | Quartalsaggregation + CSV-Export; **kein BZSt-BOP-Upload** |
| Z3-Export | AO § 147 Abs. 6 | CSV + INDEX.XML + MANIFEST.XML, SHA-256-Hashes; **nachgebildetes, nicht zertifiziertes Format** |

### 3.3 Not Production-Ready — explizit fehlend

- **ELSTER ERiC-Transmission** (UStVA / LStA / E-Bilanz / EÜR direkt ans FA) — erfordert native DLL, aus Browser nicht möglich.
- **BZSt-BOP-ZM-Submission** — benötigt SAML-Token und Authentifizierung.
- **DEÜV-Meldungen** (An-/Ab-/Jahresmeldung an Krankenkassen).
- **ELStAM-Abruf** (Arbeitgeber-Service, SV-Nr.-Vergleich).
- **PEPPOL-Network-Anbindung** für E-Invoicing.
- **OSS / IOSS** (EU-OneStopShop für EU-B2C-Verkäufe).
- **Echte SEPA-Banking-Anbindung** (CAMT.053 / MT940 / PSD2).
- **Zertifizierung IDW PS 880** (externer Prüfauftrag, keine Code-Frage).

---

## 4. Architektur-Übersicht

### 4.1 Layer-Struktur

```
┌─ UI Layer         pages/*.tsx, components/*.tsx  (React 19)
├─ Service Layer    FestschreibungsService, DeadlineService, etc.
├─ Domain Layer     domain/accounting, domain/lohn, domain/einvoice, … (pure logic)
├─ Repository Layer api/*.ts + src/repositories/*.ts  (Supabase OR localStorage)
└─ Export Layer     utils/exporters, lib/pdf, lib/zip, Gdpdu3Exporter, XRechnungBuilder
```

Die **Domain-Schicht** ist frei von React-Imports und Supabase-Imports —
das ist die Bedingung, unter der Unit-Tests mit 100 % Coverage laufen können.

### 4.2 Tech-Stack

- **TypeScript strict** (alle `strict*`-Flags aktiv)
- **React 19 + Vite 8** (kein Next.js, SPA mit React-Router 7)
- **Supabase** (Auth + Postgres + RLS + Storage)
- **Decimal.js 10.6** für Money (siehe [ARCHITECTURE.md](./ARCHITECTURE.md))
- **jsPDF 4** + **jspdf-autotable** für visuelle Reports
- **pdf-lib 1.17** für PDF/A-3-Einbettung (XRechnung → ZUGFeRD)
- **ExcelJS 4** für XLSX-Exports
- **tesseract.js 7** für OCR (Belegerfassung)
- **pdfjs-dist 4** für PDF-Text-Extraktion
- **Lucide-React 1.8** für Icons
- **Sonner 2** für Toasts
- **TanStack Query 5** für Server-State
- **Keine Chart-Library** — SVG wird manuell gerendert
- **Keine CSS-Library** — handgeschriebene CSS-Variables

### 4.3 Testing

- **Unit-Tests** für die Domain-Schicht (95 % der Tests)
- **Integration-Tests** für Repositories und Parser/Builder
- **Komponenten-Tests** via `renderToStaticMarkup` (kein jsdom-Cluster)
- **Deterministische Fixtures** — keine Netzwerk-/DB-Aufrufe in Tests

---

## 5. Datenbank-Schema

21 Migrations (`0001` bis `0021`):

| Migration | Zweck |
|-----------|-------|
| 0001 | Base: `clients`, `accounts`, `journal_entries`, `documents`, `settings` |
| 0002 | `audit_log` mit Trigger auf allen Write-Ops |
| 0003 | Audit-Hash-Chain (fortlaufende SHA-256 über prev + payload) |
| 0004 | Multi-Tenancy (tenant_id + RLS per tenant) |
| 0005 | Mahnwesen (`dunning_records`, `dunning_levels`) |
| 0006 | GoBD Append-Only (Trigger verbietet UPDATE/DELETE auf festgeschriebenen Zeilen) |
| 0007 | Rolle `tax_auditor` (nur lesender Zugriff für Prüfer) |
| 0008 | Scaling-Vorbereitung (Indexe, partielle Indizes) |
| 0009 | Journal-Auto-Lock (nach n Tagen im selben Monat) |
| 0010 | Journal-Hash-Chain (pro `journal_entries`-Zeile) |
| 0011 | `app_logs` (strukturierte App-Events) |
| 0012 | `invoice_archive` (empfangene E-Rechnungen) |
| 0013 | `elster_submissions` (Tracking der XML-Abgaben) |
| 0014 | `supplier_preferences` (Zahlungsfristen, Skonto) |
| 0015 | `advisor_notes` (Berater-Kommentare je Mandant) |
| 0016 | `employees` (Lohn-Stammdaten) |
| 0017 | `cost_centers` (Kostenstellen-Zuordnung) |
| 0018 | `receipt_requests` (Anforderung fehlender Belege) |
| 0019 | `report_lines`, `closure_table` (HGB-Bilanz-Persistenz) |
| 0020 | `lohnarten`, `lohnbuchungen`, `abrechnungen_archiv` |
| 0021 | `lock_hash`, `lsta_festschreibungen` (GoBD-Festschreibung) |

**Security-Merkmale:**
- RLS (Row-Level Security) aktiv auf allen Nutzerdaten-Tabellen
- Audit-Log-Trigger auf allen Write-Operationen
- Festschreibungs-Trigger auf `journal_entries` verhindert Änderung nach Lock
- `audit_log` selbst ist append-only (kein UPDATE/DELETE möglich)

**Offene DB-Aufgaben:**
- **Storage-Buckets** für Belege / Archive sind in 0001 angelegt, aber die Lifecycle-Rules (10-Jahres-Retention) sind noch nicht automatisiert.
- **Backup/Restore-Flow** ist nicht automatisiert (siehe [ROADMAP.md](./ROADMAP.md)).
