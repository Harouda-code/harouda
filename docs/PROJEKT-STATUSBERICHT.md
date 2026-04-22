# Projekt-Statusbericht — harouda-app

> Stand: 2026-04-20 · Version: 1.0 · Zweck: Externe Review

Konsolidierte Bestandsaufnahme zur Vorlage an eine unabhängige
Review-Instanz. Das Dokument ist so gestaltet, dass eine Person ohne
Code-Zugriff Architektur, Reifegrad, Konformitätsstand, Risiken und
nächste Schritte vollständig beurteilen kann. Alle Fakten sind durch
bestehende Projektdateien belegbar; Lücken werden als solche benannt.

---

## 1. Executive Summary

**harouda-app** ist eine webbasierte Buchführungs- und
Steuererklärungs-Software für deutsche Steuerberatungs-Kanzleien,
ausgeliefert als Single-Page-Anwendung mit PostgreSQL-Backend über
Supabase. Sie umfasst doppelte Buchführung nach SKR03, HGB-Bilanz und
GuV, umsatzsteuerliches Meldewesen, Lohnabrechnung, B2B-E-Rechnung
(XRechnung, ZUGFeRD) sowie einen Z3-Datenexport für die
Betriebsprüfung. Die Anwendung ist **nicht IDW-PS-880-zertifiziert**
und überträgt weder an ELSTER noch an das BZSt direkt.

**Reifegrad:** ca. **75 %** Produktionsreife (Security 67 ·
Performance 70 · Reliability 75 · Compliance 76 · Operational 75),
basierend auf eigener Einschätzung in `CLAUDE.md §3`. **Die
Einschätzung ist nicht durch einen externen Prüfer validiert.**

**Kritischster offener Punkt:** Es existiert **keine produktive,
server-seitige Datensicherung**. Der Client-seitige Mandanten-
Datenexport (DSGVO Art. 20) ist ausdrücklich kein Backup. Vor
Produktivbetrieb sind mindestens Supabase Point-in-Time Recovery,
`pg_dump`-basierte Off-Site-Sicherung in einer DSGVO-konformen Region
sowie ein getestetes Restore-Runbook erforderlich
(`docs/BACKUP-STRATEGY.md`).

**Empfohlener nächster Schritt:** Zuerst die schriftliche Rückmeldung
von Fachanwalt (Steuerrecht) und Datenschutzbeauftragten zu den acht
juristischen Fragen aus `docs/HASH-CHAIN-VS-ERASURE.md` einholen.
Sie entscheidet über den technischen Weg zur Umsetzung von
DSGVO Art. 17 unter Beibehaltung der GoBD-Unveränderbarkeit und
entsperrt drei noch nicht befüllte Kapitel der
Verfahrensdokumentation. Parallel kann der oben genannte
Backup-Ops-Sprint angegangen werden.

---

## 2. Projekt-Eckdaten

### Technologie-Stack (Laufzeit-Kern)

| Kategorie | Produkt | Version |
|---|---|---|
| Sprache | TypeScript (strict) | 5.9 |
| UI-Framework | React | 19 |
| Build-Tool | Vite | 8 |
| Routing | react-router-dom | 7 |
| Backend-as-a-Service | @supabase/supabase-js | 2.103 |
| Server-State-Cache | @tanstack/react-query | 5 |
| Dezimal-Arithmetik | decimal.js | 10.6 |
| PDF | jsPDF + jspdf-autotable + pdf-lib | 4 · 5 · 1.17 |
| Excel | ExcelJS | 4 |
| OCR | tesseract.js | 7 |
| PDF-Text-Extraktion | pdfjs-dist | 4 |
| Fehlerprotokollierung | @sentry/react | 8.50 |
| Icons | lucide-react | 1.8 |
| Toasts | sonner | 2 |

Keine CSS-Library, keine Chart-Library, keine serverseitigen
Laufzeit-Komponenten im Codebase (serverseitige Logik lebt in
Supabase-Migrationen als RLS-Policies, Trigger und PL/pgSQL-Funktionen).

### Codebase-Größe

| Metrik | Wert |
|---|---:|
| TypeScript-/TSX-Dateien | 324 |
| Zeilen Code (TS/TSX gesamt) | 100.752 |
| Top-Level-Module unter `src/` | 13 (`api`, `assets`, `components`, `contexts`, `data`, `design-system`, `domain`, `hooks`, `lib`, `pages`, `styles`, `types`, `utils`) |
| Test-Dateien | 51 |
| Datenbank-Migrationen | 23 (`0001` bis `0023`) |
| Build-Artefakt (dist) | ~6,9 MB unkomprimiert, ~2,4 MB gzipped |

### Testabdeckung

- **Anzahl Tests:** 727, aufgeteilt auf 51 Dateien.
- **Zeilenabdeckung:** 91 %, **Verzweigungsabdeckung:** 77 %,
  **Funktionsabdeckung:** 93 % (laut `CLAUDE.md §3`).

Aufschlüsselung der Test-Dateien nach Schicht:

| Schicht | Verzeichnis | Test-Dateien |
|---|---|---:|
| Domäne (fachliche Kernlogik) | `src/domain/` | 33 |
| Infrastruktur | `src/lib/` | 14 |
| UI-Komponenten | `src/components/` | 4 |
| **Gesamt** | | **51** |

### Repository-Status

- Kein aktives Git-Repository (Arbeitsverzeichnis noch nicht per
  `git init` initialisiert — `CLAUDE.md §12 Note 11`).
- CI-Workflows (`.github/workflows/ci.yml`,
  `deploy-staging.yml`, `deploy-production.yml`) sind vorhanden,
  aber **dormant**, solange kein Git-Repository existiert.
- Husky-Hooks (`.husky/pre-commit`, `.husky/pre-push`) sind ebenfalls
  dormant bis `git init` + `npm run prepare`.
- `package.json` trägt Version `0.0.0`; produktive Versionierung
  beginnt mit `1.0.0` bei erster Produktivfreigabe.

---

## 3. Funktions-Inventar

### Implementierte Features nach Bereich

**Buchhaltung:**

| Feature | Status | Tests | Rechtsbezug |
|---|---|---:|---|
| Kontenplan SKR03 (~150 Konten) | produktiv | 11 | Marktstandard |
| Buchungsjournal (doppelte Buchführung) | produktiv | — | HGB § 239 |
| Buchungs-Hash-Kette (Migration 0010) | produktiv | — | GoBD Rz. 153-154 |
| Festschreibung (GoBD Rz. 64) | produktiv | 11 | GoBD Rz. 64 |
| Auto-Lock nach konfigurierbarem Zeitraum (Migration 0009) | produktiv | — | GoBD Rz. 64 |
| Money-Wrapper (Decimal.js, 41-stellig) | produktiv | 36 | GoBD Rz. 58 |
| SKR03-Single-Source-of-Truth-Mapping | produktiv | 11 | — |

**Belege:**

| Feature | Status | Tests | Rechtsbezug |
|---|---|---:|---|
| Belegerfassung mit Pflichtfeld-Validierung | produktiv | 24 | UStG § 14 Abs. 4 |
| Beleg-Liste (`/buchungen/belege`) | produktiv | — | — |
| OCR für PDF/Bilder (Tesseract, client-seitig) | produktiv | — | — |
| E-Rechnungs-Eingang (XRechnung-Parser) | produktiv | — | EN 16931 |
| Belegerfassung-Persistenz (Migration 0022) | beta (Supabase-Pfad ungeprüft) | 13 | GoBD Rz. 107 ff. |

**Steuer:**

| Feature | Status | Tests | Rechtsbezug |
|---|---|---:|---|
| UStVA XML-Erzeugung | produktiv (ohne Übertragung) | 18 | UStG § 18 |
| ZM CSV-Erzeugung | produktiv (ohne Übertragung) | 13 | UStG § 18a |
| Lohnsteuer-Anmeldung XML | produktiv (ohne Übertragung) | 8 | EStG § 41a |
| EÜR § 4 Abs. 3 | produktiv | 17 | EStG § 4 Abs. 3 |
| E-Bilanz XBRL (HGB-Taxonomie 6.8) | beta (keine XSD-Validierung) | 21 | EStG § 5b |
| ESt-Anlagen (N, S, G, V, SO, AUS, Kind, Vorsorge, R, KAP u. a.) | produktiv | — | EStG |
| Hauptvordrucke ESt 1A, ESt 1C | produktiv | — | EStG |
| Gewerbesteuer, Körperschaftsteuer | produktiv | — | GewStG, KStG |

**Lohn:**

| Feature | Status | Tests | Rechtsbezug |
|---|---|---:|---|
| Lohn-Engine 2025 | produktiv | 19 | EStG §§ 38-42f |
| Vorsorgepauschale (Basis, ohne Sonderfälle) | beta | 12 | EStG § 39b Abs. 4 |
| Lohnabrechnungs-Archiv mit Festschreibung | produktiv | — | GoBD Rz. 64 |
| Payroll-Hash (`computeAbrechnungHash`) | produktiv | — | GoBD Rz. 58, 107 ff. |

**Auswertung und Berichte:**

| Feature | Status | Tests | Rechtsbezug |
|---|---|---:|---|
| Bilanz (HGB § 266, Kontoform) | produktiv | 25 | HGB § 266 |
| GuV (HGB § 275 Abs. 2, GKV) | produktiv | 16 | HGB § 275 Abs. 2 |
| BWA | produktiv | 13 | DATEV-Standard |
| Vorjahresvergleich | produktiv | 9 | HGB § 265 Abs. 2 |
| Summen- und Saldenliste | produktiv | — | — |
| Jahresabschluss-PDF | produktiv | 19 | HGB § 242 |
| Closure Table für Bilanz-Baum (Migration 0019) | produktiv | — | — |

**Admin, Audit, Export:**

| Feature | Status | Tests | Rechtsbezug |
|---|---|---:|---|
| Audit-Log mit Hash-Kette (Migrationen 0002, 0003) | produktiv | 11 | GoBD Rz. 153-154 |
| Z3-Datenexport | produktiv | 16 | AO § 147 Abs. 6 |
| DATEV EXTF 510 Export (nachgebildet) | produktiv | 26 | DATEV-Spezifikation |
| DATEV LODAS Lohn (nachgebildet) | produktiv | 16 | DATEV LODAS |
| Aufbewahrungsfristen-Ansicht (`retention.ts`) | produktiv | 9 | AO § 147 Abs. 3 |
| Mandanten-Datenexport (DSGVO Art. 20) | produktiv | 15 | DSGVO Art. 20 |
| `canDelete`-Helper für DSGVO Art. 17-Prüfung | produktiv | — | DSGVO Art. 17 |

**Datenschutz:**

| Feature | Status | Tests | Rechtsbezug |
|---|---|---:|---|
| Cookie-Consent-Banner | produktiv | 7 | TTDSG § 25 |
| Analytics-Gate (GA4/Plausible nur nach Einwilligung) | produktiv | — | TTDSG § 25 |
| Privacy-Register (`cookie_consents`, `privacy_requests`, `privacy_incidents`, Migration 0023) | produktiv (Supabase-Anbindung User-Feld offen) | — | DSGVO Art. 7, 15, 17, 20, 33 |
| Impressum-Scaffold | Gerüst | — | TMG § 5 |
| Datenschutz-Scaffold | Gerüst | — | DSGVO Art. 13 |
| Screen-Sharing-Blur-Modus (`PrivacyContext`) | produktiv | — | — |

**Integration und Bank:**

| Feature | Status | Tests | Rechtsbezug |
|---|---|---:|---|
| Bank-Import MT940 | produktiv | — | ZKA-MT940 |
| Bank-Import CAMT.053 | produktiv | — | ISO 20022 |
| Bank-Kontenabstimmung | produktiv | — | — |
| ELSTER-XML-Export (UStVA, LStA, E-Bilanz) | produktiv (ohne ERiC) | — | EStG / UStG |

### Ausdrücklich NICHT implementiert

- **ELSTER ERiC-Direktübertragung** (UStVA, LStA, E-Bilanz, EÜR).
  Grund: erfordert native DLL, aus dem Browser nicht möglich; geplant
  als separater Backend-Microservice.
- **BZSt-BOP-ZM-Submission** (erfordert SAML-Token).
- **DEÜV-Meldungen** (An-/Ab-/Jahresmeldungen an Krankenkassen).
- **ELStAM-Abruf** (Arbeitgeber-Service).
- **PEPPOL-Access-Point** für E-Rechnungen.
- **OSS / IOSS** für EU-B2C-Verkäufe.
- **SEPA-Zahlungsauslösung, PSD2-Anbindung**.
- **Kassenführung mit TSE** (KassenSichV).
- **Bilanz nach UKV** (§ 275 Abs. 3 HGB); nur GKV implementiert.
- **Mehrjahresvergleich (3+ Jahre)**; nur Vorjahresvergleich.
- **Weitere Kontenrahmen** (SKR04, SKR49, SKR51).
- **Mobile App / PWA**; Web-App ist responsive bis 375 px.
- **Automatisierte Produktionsbackups** (siehe Abschnitt 10).
- **Vollständige DSGVO-Art.-17-Löschung** hashed Felder (wartet auf
  Rechts-Freigabe, siehe Abschnitt 4 und `HASH-CHAIN-VS-ERASURE.md`).

---

## 4. Rechtlich-Regulatorische Konformität

### GoBD (BMF-Schreiben vom 28.11.2019)

Die sechs Ordnungsmäßigkeits-Grundsätze der GoBD im Abgleich mit dem
aktuellen Stand:

| Grundsatz | Stand | Umsetzung / Grenze |
|---|---|---|
| Nachvollziehbarkeit und Nachprüfbarkeit (Rz. 30 ff.) | überwiegend erfüllt | Audit-Log (Rz. 153-154), Journal-Hash-Kette, Z3-Export; externe Absicherung der Hash-Kette (WORM/SIEM) noch offen |
| Vollständigkeit (Rz. 36 ff.) | erfüllt | CHECK-Constraints auf Enumerationen, Pflichtfeld-Validierung bei Belegerfassung (§ 14 Abs. 4 UStG) |
| Richtigkeit (Rz. 40 ff.) | erfüllt | `Money` auf Decimal.js mit 41-stelliger Präzision (Rz. 58), 36 dedizierte Money-Tests |
| Zeitgerechte Buchung (Rz. 45 ff.) | Anwendersache | Werkzeug unterstützt; fachliche Pflicht liegt bei Kanzlei |
| Ordnung (Rz. 52 ff.) | erfüllt | SKR03-Single-Source-of-Truth, Periodenfilter, Festschreibung |
| Unveränderbarkeit (Rz. 107 ff.) | **tamper-evident, nicht tamper-proof** | Hash-Kette auf `audit_log` (Migration 0003) und `journal_entries` (Migration 0010); der Migration-Kopf von 0003 dokumentiert diese Grenze wörtlich. Zusätzlich DB-Trigger (Migrationen 0006, 0021) als zweiter Ring. Für Produktivbetrieb ist externe Append-Only-Spiegelung erforderlich. |

Weitere spezifische GoBD-Bezüge: Rz. 64 (Festschreibung) erfüllt;
Rz. 99-102 (Buchungstext, IKS) teilweise erfüllt — das Interne
Kontrollsystem ist dokumentiert (Verfahrensdoku Kap. 8 als Stub),
aber nicht operativ ausgerollt; Rz. 103-105 (Datensicherheit) offen
bis Backup-Strategie umgesetzt; Rz. 151-155 (Verfahrensdokumentation)
in Gliederung vorhanden (9 Dateien, fünf von acht Kapiteln v0.1
befüllt).

### DSGVO (Verordnung (EU) 2016/679)

| Artikel | Thema | Stand |
|---|---|---|
| Art. 5 | Grundsätze | Rahmen dokumentiert in Verfahrensdoku Kap. 5 (Stub); operative Umsetzung Kanzlei-Sache |
| Art. 6 | Rechtmäßigkeit | per Verfahren strukturell unterstützt; Rechtsgrundlage pro Datenkategorie in Kanzlei-Doku einzutragen |
| Art. 7 Abs. 1 | Nachweisbarkeit Einwilligung | `cookie_consents` (Migration 0023), 3-Jahres-Retention per TTDSG, lokale Persistenz — Supabase-Pfad offen |
| Art. 12 Abs. 3 | 30-Tage-Antwortfrist | `privacy_requests.deadline` vorgehalten; Bearbeitungs-UI noch nicht umgesetzt |
| Art. 15 | Auskunftsrecht | strukturell abgedeckt über Mandanten-Datenexport; dediziertes Auskunfts-UI offen |
| Art. 15 Abs. 3 | Kopie der Daten | Mandanten-Datenexport (ZIP/JSON, SHA-256-Manifest) |
| Art. 17 | Löschung | **nicht implementiert.** Design-Entscheidung zu vier Optionen (Crypto-Shredding / Tombstone / PII-Split / Merkle-Re-Root) dokumentiert in `HASH-CHAIN-VS-ERASURE.md`; Q1-Q8 an Fachanwalt + DSB offen |
| Art. 20 | Datenübertragbarkeit | Mandanten-Datenexport unter `/admin/datenexport` (Sprint-3); 15 Tests |
| Art. 21 | Widerspruch | nicht spezifisch implementiert; über Löschworkflow abzudecken |
| Art. 22 | Automatisierte Entscheidungsfindung | nicht einschlägig (keine automatisierten Einzelentscheidungen über Betroffene) |
| Art. 28 | Auftragsverarbeitung | **AVV mit Supabase und ggf. Hosting-Provider vor Produktivbetrieb abzuschließen.** Eigenes AVV-Template für Kanzlei↔Mandant-Relationen ist nicht erzeugt; Legal-Review erforderlich |
| Art. 30 | Verzeichnis von Verarbeitungstätigkeiten | Pflicht der Kanzlei; Verfahren liefert Grundlage, Aggregation Kanzlei-Sache |
| Art. 32 Abs. 1 lit. a | Verschlüsselung | in-transit via HTTPS, at-rest per Supabase-Standard; per-PII-Field-Verschlüsselung (Crypto-Shredding) als Option zu entscheiden |
| Art. 32 Abs. 1 lit. b | Vertraulichkeit, Integrität, Verfügbarkeit | RLS-Isolation, Hash-Kette, Backup offen |
| Art. 32 Abs. 1 lit. c | Wiederherstellbarkeit | **offen** — siehe P1 Backup-Blocker |
| Art. 32 Abs. 1 lit. d | Regelmäßige Überprüfung | Ketten-Verifikation im UI (`/einstellungen/audit`); externe Prüfroutine noch nicht etabliert |
| Art. 33 | Meldung an Aufsicht | Register `privacy_incidents` vorhanden; 72-Stunden-Friststeuerung organisatorisch |
| Art. 34 | Benachrichtigung Betroffener | Register vorhanden; Templates offen |
| Art. 44 ff. | Drittstaatenübermittlung | abhängig von Serverstandort-Wahl (Frankfurt für DSGVO empfohlen) |

### HGB

| Norm | Gegenstand | Stand |
|---|---|---|
| § 238 | Buchführungspflicht | Kanzlei-Pflicht; Verfahren bietet Werkzeuge |
| § 239 | Anforderungen an Führung (Vollständigkeit, Richtigkeit, Zeitgerechtigkeit, Ordnung, Unveränderbarkeit) | strukturell unterstützt (siehe GoBD oben) |
| § 242 | Jahresabschluss | Bilanz + GuV + Jahresabschluss-PDF produktiv |
| § 257 | Aufbewahrung | Fristen-Framework in `retention.ts` (2025-konform, 8/10/6 Jahre); Aufbewahrungsmedium hängt an Backup-Strategie |
| § 265 Abs. 2 | Vorjahresvergleich | produktiv, 9 Tests |
| § 266 | Bilanz-Gliederung | produktiv in Kontoform, 25 Tests |
| § 275 Abs. 2 | GuV nach Gesamtkostenverfahren | produktiv, 16 Tests |
| § 275 Abs. 3 | GuV nach Umsatzkostenverfahren (UKV) | nicht implementiert |

### AO

| Norm | Gegenstand | Stand |
|---|---|---|
| § 140 | Buchführungspflicht aus anderen Gesetzen | Anwenderpflicht; Verfahren unterstützt |
| § 141 | Buchführungspflicht bestimmter Steuerpflichtiger | Anwenderpflicht; Verfahren unterstützt |
| § 146 Abs. 4 | Unveränderbarkeit | Hash-Kette + Festschreibung + Trigger (tamper-evident) |
| § 147 Abs. 2 | Ordnungsmäßige Aufbewahrung | Framework vorhanden; Backup-Strategie nicht umgesetzt |
| § 147 Abs. 3 | Aufbewahrungsfristen | `retention.ts` mit 2025-Wachstumschancengesetz-Regeln |
| § 147 Abs. 6 | Datenzugriff Z1/Z2/Z3 | **Z3 produktiv** (nachgebildetes Format), 16 Tests; Z1/Z2 fachlicher Kanzleiprozess |
| § 193 | Außenprüfung | Rolle `tax_auditor`, Prüfer-Dashboard, Z3-Export |
| § 200 | Mitwirkungspflichten | Anwenderpflicht |

### UStG

| Norm | Gegenstand | Stand |
|---|---|---|
| § 14 Abs. 4 | Pflichtangaben Rechnung | produktiv im `BelegValidierungsService`, 24 Tests |
| § 18 | Umsatzsteuer-Voranmeldung | XML-Erzeugung produktiv; ERiC-Übertragung nicht |
| § 18a | Zusammenfassende Meldung | CSV-Aggregation produktiv; BZSt-BOP-Upload nicht |
| § 19 | Kleinunternehmer | Flag in Einstellungen, Hinweistext in UStVA |

### Zertifizierungs- und Zulassungsstand (nicht erreicht)

| Zertifikat / Zulassung | Status |
|---|---|
| IDW PS 880 (Softwareprüfung) | nicht durchgeführt; Verfahrensdokumentation ist Grundlage für eine künftige Beauftragung |
| DATEV-Zertifizierung (EXTF 510, LODAS) | Format ist nachgebildet, nicht zertifiziert; einzelne DATEV-Installationen können Abweichungen ablehnen |
| ELSTER-Zertifizierung (ERiC-Integration) | nicht vorhanden; XML-Erzeugung ohne native Transport-Library |
| IDEA-Testtool-Zertifizierung des Z3-Formats | nicht durchgeführt |
| KoSIT-Vollprüfung für XRechnung (BR-Ruleset) | ~20 von > 200 BR-Regeln, überwiegend strukturell |
| Formale PDF/A-3b-Zertifizierung für ZUGFeRD | nicht erreicht (kein XMP-Metadata-Stream, kein OutputIntent); veraPDF würde ablehnen |
| ITSG-GKV-Zertifizierung für Lohn | nicht durchgeführt; DEÜV-Meldungen fehlen |

---

## 5. Architektur-Übersicht

### Schichten-Modell

| Schicht | Verzeichnis(se) | Zuständigkeit |
|---|---|---|
| Präsentation | `src/pages/`, `src/components/` | React-Komponenten, Routing, lokaler UI-Zustand |
| Anwendung (Services) | `src/domain/*/…Service.ts` | Orchestriert Domain-Logik (z. B. `FestschreibungsService`, `BelegValidierungsService`, `DeadlineService`) |
| Domäne | `src/domain/` | Fachlogik (Bilanz, GuV, UStVA, EÜR, Lohn, E-Rechnung, E-Bilanz, GDPdU, GoBD, Belege, Retention); frei von React- und Supabase-Imports |
| Repository | `src/api/`, `src/lib/db/`, `src/repositories/` | Dual-Mode-Persistenz: `localStorage` im Demo, Supabase im Produktiv-Modus |
| Infrastruktur / Export | `src/lib/pdf/`, `src/lib/zip/`, `src/lib/crypto/`, `src/lib/datev/`, `src/utils/` | PDF-, ZIP-, Krypto-, DATEV-, Export-Primitiven |

Die Reinheit der Domänenschicht ist verifizierbar: ihre Tests laufen
ohne DOM (happy-dom wird nur für Komponenten-Tests benötigt) und ohne
Netzwerk.

### Tragende Architektur-Entscheidungen (nach `docs/ARCHITECTURE.md`)

1. **Money-Wrapper (Decimal.js, 41-stellig).** IEEE-754-Doubles sind
   für Finanzarithmetik ungeeignet; Rundungsfehler wären formale
   Verletzungen von GoBD Rz. 58. Rundung erfolgt ausschließlich an
   definierten Ausgabe-Grenzen.
2. **Closure Table für den Bilanz-Baum (Migration 0019).** Materialisiert
   alle Vorfahr-Nachkomme-Paare der HGB-§-266-Hierarchie. Aggregate
   wie "Summe unter A.I" laufen dadurch in O(n) statt O(h·n) per CTE.
3. **Composite Pattern für `BalanceNode`.** Ein rekursiver Typ; ein
   Konto-Leaf ist ein Knoten ohne Children. Ein Algorithmus statt
   zwei.
4. **SKR03-Single-Source-of-Truth.** Ein Mapping-Modul pro Dimension
   (Bilanz, GuV, UStVA, EÜR); Tests prüfen Vollständigkeit über alle
   Dimensionen. Vermeidet Divergenz zwischen Berichten.
5. **Adapter `Arbeitnehmer ↔ Employee`.** Lohn-Domäne kennt einen
   reichen Fachtyp, die Datenbank hält ein flacheres Schema. Der
   Adapter ist die einzige Stelle, die beide Typen sieht.
6. **Pure-SVG-Charts (keine Chart-Library).** Spart ca. 250 KB Bundle
   und eliminiert transitive Sicherheitsrisiken; Screen- und
   PDF-Rendering verwenden dieselbe SVG-Quelle.
7. **Dual-Mode-Repositories (`DEMO_MODE` vs. Supabase).** Gleiches
   Interface, zwei Implementierungen; Tests laufen per Default im
   Demo-Modus. Kosten: zwei Persistenz-Implementierungen pro
   Ressource.
8. **Separater `FestschreibungsService`.** Hash-Berechnung und
   Sperre-Logik (GoBD Rz. 64) liegen an genau einer Stelle; DB-Trigger
   (Migration 0021) sind die zweite Verifikationslinie.
9. **`happy-dom` statt `jsdom`.** ca. zehnfache Geschwindigkeit der
   Test-Suite; Abweichungen bei Default-Namespace-XML werden mit
   `localName`-Helpern umgangen (XRechnung-Parser).

### Datenbank-Schema-Übersicht

23 Migrationen unter `supabase/migrations/`, gruppiert nach Zweck:

| Gruppe | Beispiel-Tabellen | Migrationen |
|---|---|---|
| Kernbuchführung | `clients`, `accounts`, `journal_entries`, `documents`, `settings` | 0001, 0004, 0010 |
| Audit | `audit_log` (mit Hash-Kette) | 0002, 0003 |
| Festschreibung und Append-Only | Trigger auf `journal_entries`; `lsta_festschreibungen` | 0006, 0009, 0021 |
| Mahnwesen | `dunning_records`, `dunning_levels` | 0005 |
| Rollen | `tax_auditor`-Rolle, RLS-Policies | 0007 |
| Skalierung | Indizes, partielle Indizes | 0008 |
| Operatives | `app_logs`, `invoice_archive`, `elster_submissions`, `supplier_preferences`, `advisor_notes`, `receipt_requests` | 0011, 0012, 0013, 0014, 0015, 0018 |
| Bilanz-Persistenz | `report_lines`, `closure_table` | 0019 |
| Lohn | `employees`, `cost_centers`, `lohnarten`, `lohnbuchungen`, `abrechnungen_archiv` | 0016, 0017, 0020 |
| Belegerfassung | `belege`, `beleg_positionen` | 0022 |
| DSGVO-Register | `cookie_consents`, `privacy_requests`, `privacy_incidents` | 0023 |

### Hash-Ketten-Implementierung — aktueller Stand

- **Audit-Log** (Migration 0003): `prev_hash` und `hash` pro Zeile,
  SHA-256 über `prev_hash || kanonische JSON-Form der Zeile`. Genesis
  = 64×`0`. Verifikation über `verifyAuditChain()` in
  `src/api/audit.ts`.
- **Journal** (Migration 0010): `prev_hash` + `entry_hash`; SHA-256
  über Pipe-Format `prev_hash | datum | beleg_nr | soll_konto |
  haben_konto | betrag (2 Dezimalstellen) | beschreibung |
  parent_entry_id`. Berechnung client-seitig (`src/utils/journalChain.ts`)
  und server-seitig (PL/pgSQL `journal_entries_compute_hash`, als
  `IMMUTABLE` deklariert) **identisch**.
- **Grenze:** tamper-evident, nicht tamper-proof. Der Migration-Kopf
  von 0003 benennt dies wörtlich. Postgres-Superuser könnte die Kette
  inklusive aller Hashes neu schreiben. Externe Absicherung (WORM,
  SIEM, qualifizierter Zeitstempel nach eIDAS) vor Produktivbetrieb
  erforderlich.
- **Offene Design-Frage:** DSGVO Art. 17-Löschung hashed Felder (z. B.
  `journal_entries.beschreibung`). Vier Optionen in
  `docs/HASH-CHAIN-VS-ERASURE.md` (Crypto-Shredding / Tombstone /
  PII-Split / Merkle-Re-Root); Primärempfehlung **K1 = PII-Split +
  Tombstone-Register**, vorbehaltlich Rechts-Review (Q1-Q8).

---

## 6. Mandantenfähigkeit

### Isolationsmodell

- **Firmen-Ebene** (`companies`, Migration 0004) ist der primäre
  Tenant-Schnitt. Row-Level-Security-Policies auf allen fachlichen
  Tabellen filtern nach `company_id`.
- **Mandanten-Ebene** (`clients`) ist eine *zweite* Ebene
  **innerhalb** einer Firma: Steuerberater-Kanzleien führen mehrere
  Mandanten unter einer Firma.
- Benutzer:innen sind Mitglied in einer oder mehreren Firmen mit
  jeweils einer Rolle; der Firmen-Wechsel oben rechts im UI
  aktualisiert alle Daten, Reports, Audits und wird im Audit-Log der
  betreffenden Firma protokolliert.

### Berechtigungs-Matrix (Kurzform)

| Rolle | Sichtbarkeit | Schreiben | Administration |
|---|---|---|---|
| `owner` / `admin` (Kanzlei-Leitung) | alle Daten der Firma | ja | Benutzer, Einstellungen, Festschreibung |
| Kanzlei-Mitarbeiter:in | alle Mandanten der Firma | ja | nein |
| Mandant | nur eigener Mandat | abhängig von Konfiguration | nein |
| `tax_auditor` (Betriebsprüfer:in) | nur lesend, alle Daten der Firma | nein | nein; nur Z3-Export abrufen |

Technische Umsetzung der Policies und die genaue Attribut-Liste
pro Rolle gehören in Verfahrensdoku Kap. 5 (derzeit Stub).

---

## 7. Sicherheit und Datenschutz

### Technische Maßnahmen

- **Verschlüsselung in Transit:** HTTPS/TLS über Supabase-Standard.
- **Verschlüsselung at Rest:** Supabase-Standardverschlüsselung
  (Disk-Level, AES). Per-Feld-Verschlüsselung für PII wäre im
  Rahmen des Crypto-Shredding-Ansatzes aus
  `HASH-CHAIN-VS-ERASURE.md` möglich.
- **Authentifizierung:** Supabase Auth, E-Mail + Passwort; Auto-Logout
  nach Inaktivität via `UserContext`. **2FA ist nicht erzwungen.**
- **Autorisierung:** Row-Level-Security auf allen Nutzerdaten-Tabellen.
- **Integrität:** SHA-256-Hash-Kette auf `audit_log` und
  `journal_entries`, dual berechnet (Client + Server-Trigger).
- **Unveränderbarkeit:** DB-Trigger verhindert UPDATE/DELETE auf
  festgeschriebenen Zeilen (Migrationen 0006, 0021); Audit-Log auf
  Policy-Ebene append-only (`REVOKE UPDATE, DELETE`).
- **PII-Scrubbing:** Sentry-Integration entfernt USt-IdNrn., IBANs,
  Steuernummern aus Events vor dem Versand.

### Organisatorische Maßnahmen

- **Rollentrennung** im Design: Erfasser:in ≠ Festschreiber:in;
  Abrechner:in ≠ Abgeber:in. Operative Durchsetzung liegt bei der
  Kanzlei (Verfahrensdoku Kap. 8, derzeit Stub).
- **Code-Review-Pflicht** für GoBD-relevante Module (Journal, Audit,
  Festschreibung, Hash-Kette, Retention, Export) — Verfahrensdoku
  Kap. 8 Abschnitt 8.7 nach Befüllung.
- **Audit-Log-Verpflichtung** für jede Abweichung vom Regelprozess
  (Notfallzugriff, manuelle DB-Eingriffe, dokumentierte Freigabe-
  Overrides).

### Bekannte Schwachstellen (ehrlich)

| Schwachstelle | Wirkung | Stand |
|---|---|---|
| Hash-Kette tamper-evident, nicht tamper-proof | Postgres-Superuser kann Kette neu schreiben, Bruch bliebe erkennbar, aber nicht verhindert | externe Absicherung (WORM/SIEM) offen |
| Kein erzwungenes 2FA | erhöhtes Risiko bei Passwort-Kompromittierung | zu prüfen vor Produktivgang |
| Kein produktives Backup | Datenverlust bei Supabase-Ausfall, versehentlicher Löschung, Account-Kompromittierung | P1-Blocker |
| Kein zentrales Log-/Alarm-System | Angriffe oder Anomalien werden verzögert erkannt | P2 (Monitoring-Aufbau) |
| Analytics-Skripte laden unter Admin-Kontrolle, aber Admin kann missbräuchlich konfigurieren | theoretisch PII-Leakage an Drittanbieter | organisatorische Absicherung in Kanzlei erforderlich |
| Clientseitige Verifikation der Hash-Kette rechnet serverseitige Werte nach; ein kompromittierter Client könnte falsche Bestätigungen ausgeben | gezielte Täuschung einer Prüfer:in theoretisch möglich | externer Exporter verifiziert das Paket unabhängig (Empfehlung) |
| Kein Rate-Limiting auf Anwendungsebene dokumentiert | Brute-Force-Versuche möglich | Supabase-Standards prüfen, vor Go-Live dokumentieren |

### Sentry-Konfiguration

- **Aktivierung:** nur bei gesetzter Umgebungsvariable
  `VITE_SENTRY_DSN`; ohne DSN ist die Initialisierung ein No-Op.
- **PII-Scrub:** vor Versand werden USt-IdNrn., IBANs und
  Steuernummern aus Fehler-Payloads entfernt.
- **Session Replay:** **nur bei Fehlern**, mit `maskAllText`,
  `maskAllInputs`, `blockAllMedia`. Kein kontinuierliches Recording.
- **Sampling:** 10 % der Traces in Produktion, 100 % in Entwicklung.
- **Aufbewahrung** und **AVV mit Sentry** sind Kanzlei-Sache und vor
  Aktivierung zu klären.

---

## 8. Qualitätssicherung

### Test-Pyramide

- **Unit-Tests (Domäne):** ca. 95 % der 727 Tests, laufen ohne DOM
  und ohne Netzwerk.
- **Integrationstests:** Parser, Builder, Export-Pipelines; mit
  happy-dom als DOM-Implementierung.
- **Komponententests:** 4 Dateien (ErrorBoundary,
  CookieConsent-Banner mit Regressionstest *"rendert ohne Router-
  Vorfahren"*).
- **End-to-End-Tests:** **nicht vorhanden.** Playwright ist als
  Go-Live-Voraussetzung geplant, 10 kritische Journeys sind
  festgelegt (P1-Blocker).

### Coverage-Extremwerte (aus `PROJEKT-INVENTAR.md §2`)

| Voll abgedeckt | Schwachstellen |
|---|---|
| `lib/money/Money.ts` | `lohnRepos.ts` (0 %, Persistenz noch offen) |
| `compliance/DeadlineService.ts` | Chart-Komponenten (~80 %) |
| `belege/BelegValidierungsService.ts` | einzelne Page-Komponenten (~50-70 %) |
| `gobd/FestschreibungsService.ts` | `PdfReportBase` (~70 %) |
| `einvoice/xrechnungStructure.ts` | — |

### TypeScript

- Strict-Modus aktiv (alle `strict*`-Flags).
- CI-Gate: `tsc --noEmit` muss grün sein.
- Lokaler Pre-Push-Hook (`husky`): `tsc --noEmit` + `vitest run`
  (aktiv, sobald Git-Repository initialisiert ist).

### CI-Pipeline (dormant)

Aus `.github/workflows/ci.yml`:

1. Checkout + Setup-Node (Node 20 mit npm-Cache)
2. `npm ci`
3. `npx tsc --noEmit`
4. `npm run lint`
5. `npx vitest run --coverage --reporter=default --reporter=junit`
6. Upload Coverage-Report + Test-Results als Artefakte
7. `npm audit --audit-level=high` (advisory)
8. `npm run build`
9. Bundle-Size-Check (Obergrenze 9.000 KB unkomprimiert, aktueller
   Stand ~6,9 MB)
10. Upload `dist/`-Artefakt (7 Tage Retention)
11. Coverage-Gate (separater Job)

### Linting und Formatierung

- ESLint 9 + typescript-eslint 8.
- Pre-Commit (`husky` + `lint-staged`): `eslint --fix` auf geänderten
  TypeScript-Dateien.
- **Kein Prettier** im Einsatz; Team-Entscheidung über Format-Konvention
  steht aus (`CLAUDE.md §2`).

### Husky-Hooks

- `pre-commit`: `lint-staged` auf geänderten `.ts`/`.tsx`-Dateien.
- `pre-push`: TypeScript-Check + Vitest-Run.
- **Dormant** bis `git init` + `npm run prepare`.

---

## 9. Dokumentation

### Vorhandene Dokumente

| Datei | Zweck |
|---|---|
| `CLAUDE.md` (422 Zeilen) | Kanonischer Kontext für KI-Sitzungen; Tech-Stack, Architektur-Entscheidungen, Feature-Map, bekannte Beschränkungen, Quick-Start |
| `docs/ARCHITECTURE.md` (185 Zeilen) | Neun Architektur-Entscheidungen mit Kontext/Entscheidung/Konsequenzen |
| `docs/PROJEKT-INVENTAR.md` (199 Zeilen) | Feature-Matrix, Test-Statistiken, Compliance-Landschaft, Datenbank-Schema-Übersicht |
| `docs/USER-GUIDE-DE.md` | Kurzes Benutzerhandbuch für Kanzlei-Mitarbeiter:innen; veraltet in Details (Migrationen 0001-0016 genannt, Routen fehlen) |
| `docs/BERATER-LEITFADEN.md` | Multi-Mandats-Workflows für Berater:innen; teilweise veraltet |
| `docs/BENUTZERHANDBUCH.md` | Ausführliches Handbuch (ältere Fassung) |
| `docs/BACKUP-STRATEGY.md` | Begründung, warum produktives Backup server-seitig gelöst werden muss; Liste der sechs Umsetzungs-Maßnahmen; offener P1-Blocker |
| `docs/HASH-CHAIN-VS-ERASURE.md` (604 Zeilen) | Design-Entscheidung DSGVO Art. 17 vs. GoBD-Unveränderbarkeit; vier Optionen, Entscheidungsmatrix, Empfehlung K1 (PII-Split + Tombstone), acht juristische Fragen Q1-Q8 an Fachanwalt + DSB |
| `docs/COMPLIANCE-GUIDE.md` | GoBD/AO/UStG/EStG/HGB-Mapping auf Code |
| `docs/PRODUCTION-READINESS.md` | Selbsteinschätzung Security/Performance/Reliability/Compliance/Operational |
| `docs/ROADMAP.md` | P1/P2/P3-Gaps und Deprecation-Beobachtung |
| `docs/GO-LIVE-CHECKLIST.md` | T-4W → Launch → Post-Launch-Liste |
| `docs/NEXT-CLAUDE-HANDOFF.md` (132 Zeilen) | Handoff-Dokument für KI-Session-Übergabe; aktueller Stand, nächste Aufgabe, Design-Offenstellen |
| `docs/SESSION-2026-04-20-SUMMARY.md` | Session-Zusammenfassung |
| `docs/verfahrensdokumentation/README.md` | Index der acht Verfahrensdoku-Kapitel mit Abhängigkeits-Übersicht |
| `docs/verfahrensdokumentation/01-allgemeine-beschreibung.md` (380 Zeilen, v0.1 BEFÜLLT) | Produkt-Scope, Rechtsrahmen, Rollen, Prozess-Landkarte |
| `docs/verfahrensdokumentation/02-anwenderdokumentation.md` (432 Zeilen, v0.1 BEFÜLLT) | Rollen-Aufgaben, Bedienungskonzept, Kern-Workflows, Fehler-Handling, Schulungsbedarf |
| `docs/verfahrensdokumentation/03-technische-systemdokumentation.md` (396 Zeilen, v0.1 BEFÜLLT) | Schichten, Tech-Stack, Datenhaltung, Schnittstellen, Deployment, Tests, Change-Management |
| `docs/verfahrensdokumentation/04-betriebsdokumentation.md` (441 Zeilen, v0.1 BEFÜLLT) | Umgebungen, Installation, Datensicherung, Change-Management, Monitoring, Notfall, Release |
| `docs/verfahrensdokumentation/05-datensicherheits-und-datenschutzkonzept.md` (71 Zeilen, STUB) | Wartet auf Hash-Chain-Rechts-Freigabe |
| `docs/verfahrensdokumentation/06-aufbewahrungs-und-loeschkonzept.md` (62 Zeilen, STUB) | Wartet auf Hash-Chain-Rechts-Freigabe |
| `docs/verfahrensdokumentation/07-pruefpfade-und-protokollierung.md` (414 Zeilen, v0.1 BEFÜLLT) | Audit-Log, Festschreibung, Hash-Kette inkl. *tamper-evident*-Grenze, Z3-Export, Datenschutz-Protokollierung |
| `docs/verfahrensdokumentation/08-internes-kontrollsystem.md` (64 Zeilen, STUB) | Wartet auf Hash-Chain-Rechts-Freigabe |
| `README.md` | Schnellstart, Demo-Login-Hinweis |

### Dokumenten-Drift

| Artefakt | Drift |
|---|---|
| `USER-GUIDE-DE.md` §6 | Verweist auf das alte singuläre `verfahrensdokumentation.md`; neue gegliederte Fassung unter `docs/verfahrensdokumentation/` |
| `BERATER-LEITFADEN.md` §9 | Nennt Migrationen 0001-0016; Stand heute 0001-0023 |
| `USER-GUIDE-DE.md` gesamter Dokumentstand | Routen `/admin/datenexport`, `/datenschutz`, `/impressum` fehlen |
| Screenshots in Anwender-Dokus | Nicht systematisch überprüft; vor externer Nutzung abgleichen |
| `PROJEKT-INVENTAR.md` Kopfzeile | Sagt 676 Tests / 46 Dateien; Stand heute 727 / 51 |

---

## 10. Offene Punkte — vollständige ehrliche Liste

### P0 — Blocker, sofort zu adressieren

Keine. Alle aktuellen Risiken lassen sich einer P1-Kategorie zuordnen
oder sind Design-Fragen mit dokumentierter Wartelinie.

### P1 — Go-Live-Blocker

| Punkt | Begründung | Geschätzter Aufwand |
|---|---|---|
| **Server-seitige Backup-Strategie** | Client-seitiger Datenexport ist kein Backup; ohne PITR + pg_dump + Off-Site-Kopie sind AO § 147 Abs. 2, GoBD Rz. 103-105 und DSGVO Art. 32 Abs. 1 lit. c nicht erfüllt | 2-3 Tage Ops + 1 Tag Docs (`BACKUP-STRATEGY.md`) |
| **Hash-Chain-vs.-Erasure-Entscheidung** | DSGVO Art. 17 ist ohne getroffene Design-Wahl nicht umsetzbar; drei Verfahrensdoku-Kapitel (5/6/8) sind blockiert | 45 Minuten Entscheidung nach Rechts-Rückmeldung; dann ca. 1 Sprint Implementierung |
| **2FA-Erzwingung** | Brute-Force- und Passwort-Kompromittierungs-Risiko bei steuerlichen Daten inkl. IBAN, USt-IdNr., Steuernummern; DSGVO Art. 32 Abs. 1 lit. b nicht vollständig erfüllt ohne starke Authentifizierung | 2-3 Tage |
| **Playwright-E2E-Tests** | Aktuell keine End-to-End-Absicherung; 10 kritische Journeys definiert | 1-2 Wochen |
| **DSGVO-Paket (Rest)** | AVV mit Supabase und ggf. Hosting-Provider, DPO-Benennungsprüfung, Datenschutzerklärung und Impressum durch Fachanwalt füllen | 1-2 Wochen, davon überwiegend juristisch |

### P2 — Wichtig, parallelisierbar

| Punkt | Begründung | Aufwand |
|---|---|---|
| **ELSTER ERiC-Transmission** (Backend-Microservice) | UStVA, LStA, E-Bilanz müssen heute manuell hochgeladen werden; für Produktivbetrieb akzeptabel, aber für Marktfähigkeit der Kanzlei-Nutzung limitierend | 2-4 Wochen (separater Backend-Dienst, nicht TypeScript allein) |
| **Zentrale Log-/Monitoring-Pipeline** | Ohne Alarm-Mechanismen werden Vorfälle spät erkannt; DSGVO Art. 32 Abs. 1 lit. d verlangt regelmäßige Überprüfung | 3-5 Tage |
| **Externe Absicherung der Hash-Kette** (WORM/SIEM) | GoBD Rz. 107 ff. Unveränderbarkeit ist nur mit externer Spiegelung vollumfänglich | 2-3 Tage Ops |
| **IDW-PS-880-Zertifizierung** | Externe Prüfung der Software-Ordnungsmäßigkeit; Grundlage ist die Verfahrensdokumentation | 4-12 Wochen externe Prüfung + Vorbereitung |
| **XRechnung-BR-Ruleset-Ausbau** | ~20 von > 200 KoSIT-Regeln; für Marktbreite notwendig | 1-2 Wochen |
| **PDF/A-3-Zertifizierbarkeit** | XMP-Stream + OutputIntent fehlen; veraPDF würde ablehnen | 3-5 Tage + externer Prüflauf |
| **DEÜV-Meldungen** | An-/Ab-/Jahresmeldungen für Lohn | 2-4 Wochen |
| **PEPPOL-Access-Point** | Internationaler E-Rechnungs-Versand | 2-3 Wochen |
| **OSS/IOSS für EU-B2C** | Meldepflicht nicht abgedeckt | 1-2 Wochen |
| **10-Jahre-Retention-Automatisierung** | `canDelete`-Helper existiert; Löschjob nicht geplant | 1 Woche |
| **Regression-Test für „Datenschutzerklärung füllen"** | Heute Scaffold-Warnung, kein Test, der nachweist dass vor Produktivgang befüllt wird | 1 Tag (Canary-Test) |

### P3 — Nice-to-have

- Mobile / PWA
- EN-Übersetzung
- ML-basierte Konten-Zuordnung
- Spracheingabe
- Mehrjahresvergleich (3+ Jahre)
- SKR04 / SKR49 / SKR51
- Bilanz nach Umsatzkostenverfahren (§ 275 Abs. 3 HGB)

### Deprecation-Fenster (aus `CLAUDE.md §10`)

- **HGB-Taxonomie 6.9** (April 2026 — aktuell fällig).
- **Lohn-Tarif- und SV-Parameter 2026** (BMF veröffentlicht
  Dezember/Januar).
- **DATEV EXTF 520** (H2/2026).
- **XRechnung 3.1** in Konsultation.

---

## 11. Entwicklungs-Historie

Eine formale Ticket-Historie liegt nicht vor, weil das Repository
noch nicht als Git-Repository initialisiert ist. Die nachfolgende
Übersicht basiert auf `CLAUDE.md §3`, `docs/SESSION-2026-04-20-SUMMARY.md`
und den Migrationen.

### Vor Sprint-1 — Ausgangsstand

- ca. 40 Feature-Module bereits implementiert (Bilanz, GuV, BWA,
  UStVA, ZM, EÜR, E-Bilanz, XRechnung, ZUGFeRD, Lohn, Z3, DATEV,
  GoBD-Festschreibung, Audit-Trail).
- 676 Tests, 46 Test-Dateien (Stand `PROJEKT-INVENTAR.md`).

### Sprint-1 — Produktionsreife-Grundlagen

- CI/CD-Pipelines in `.github/workflows/` (dormant bis Git-Init).
- Error Boundaries auf drei Ebenen (Page / Section / Component).
- Sentry-Integration mit PII-Scrubbing und bedingter Replay-Funktion.
- Husky + lint-staged-Hooks.
- Belegerfassung-Persistenz in Migration 0022.

### Sprint-2 Chunk 1 — DSGVO-Grundlagen

- Migration 0023 mit drei Registern: `cookie_consents`,
  `privacy_requests`, `privacy_incidents`.
- `retention.ts` erweitert um `cookie_consent`-Kategorie (3 Jahre
  nach TTDSG § 25) und `canDelete`-Helper.
- Cookie-Consent-Banner (lokaler Speicher) mit TTDSG-§-25-konformem
  Analytics-Gate; GA4 / Plausible laden nur nach Einwilligung.
- Impressum- und Datenschutz-Scaffold-Seiten mit prominenten
  Rechtsberatung-Warnhinweisen (keine juristische Prosa).
- Ein Anwenderfund korrigiert: `CookieConsent` nutzt ausdrücklich
  kein react-router (Regressionstest), weil er in `main.tsx`
  außerhalb des `BrowserRouter` gemountet ist.

### Sprint-3 — Mandanten-Datenexport

- Pfad `/admin/datenexport` mit dem Service
  `src/domain/export/MandantenDatenExportService.ts`:
  - ZIP mit MANIFEST.json, `tables/*.json`, `DISCLAIMER.txt`.
  - SHA-256 je Tabelle plus Manifest-Hash zur Korruptions-Erkennung.
  - Explizit kein Backup (im UI und im `DISCLAIMER.txt` mehrfach
    benannt).
- `BACKUP-STRATEGY.md` als separates Dokument zur Abgrenzung und zur
  Auflistung der sechs erforderlichen Ops-Maßnahmen für das echte
  Backup-Vorhaben.
- Legacy-JSON-Backup unter `src/api/backup.ts` bleibt im Demo-Modus,
  wird aber nicht mehr erweitert.

### Aktuelle Session (2026-04-20) — Verfahrensdokumentation

- Gliederungs-Gerüst unter `docs/verfahrensdokumentation/` mit neun
  Dateien (`README.md` + 01-08) gemäß GoBD Rz. 151-155 + AWV-Muster.
- Inhaltlich befüllt (v0.1 BEFÜLLT): Kapitel 1 (Allgemeine Beschreibung,
  380 Zeilen), Kapitel 2 (Anwenderdokumentation, 432 Zeilen),
  Kapitel 3 (Technische Systemdokumentation, 396 Zeilen), Kapitel 4
  (Betriebsdokumentation, 441 Zeilen), Kapitel 7 (Prüfpfade und
  Protokollierung, 414 Zeilen).
- Design-Dokument `HASH-CHAIN-VS-ERASURE.md` (604 Zeilen) mit vier
  Optionen, Entscheidungsmatrix, Empfehlung K1 und acht juristischen
  Fragen Q1-Q8 zur externen Prüfung.
- Kapitel 5, 6, 8 bleiben STUB; sie warten auf die Rechts-Freigabe
  der Hash-Chain-Erasure-Design-Entscheidung.

---

## 12. Empfohlene nächste Schritte

### Kurzfristig — nächste zwei Wochen

1. Schriftliche Vorlage der acht juristischen Fragen Q1-Q8 aus
   `HASH-CHAIN-VS-ERASURE.md` an Fachanwalt für Steuerrecht und
   Datenschutzbeauftragte:n.
2. Start des Backup-Ops-Sprints: Supabase-Tier klären, PITR
   aktivieren, S3-Frankfurt-Bucket bereitstellen, AVVs einleiten.
3. Git-Repository initialisieren (`git init`, Remote), damit CI und
   Husky aktiv werden.
4. Doku-Drift beheben: `USER-GUIDE-DE.md` und `BERATER-LEITFADEN.md`
   auf aktuellen Code-Stand aktualisieren, insb. Migrations-Nummern
   und neue Routen.

### Mittelfristig — nächste zwei Monate

1. Umsetzung der gewählten Hash-Chain-Erasure-Option nach Rechts-
   Freigabe (Migration 0024, Schema-Änderung bzw. Crypto-Shredding-
   Infrastruktur, Test-Anpassungen).
2. Verfahrensdoku Kapitel 5, 6, 8 inhaltlich befüllen.
3. Playwright-E2E-Suite mit den 10 kritischen Journeys.
4. Monitoring-Pipeline (zentrales Log-Aggregations-Ziel, Alarm-Regeln,
   Uptime-Monitor, automatische periodische Hash-Ketten-Verifikation).
5. Datenschutzerklärung und Impressum durch Fachanwalt befüllen
   lassen; AVV mit Supabase und Hosting-Provider abschließen.
6. DPO-Benennungsprüfung nach § 38 BDSG.

### Vor Produktiv-Gang — unverzichtbar

Siehe auch `docs/GO-LIVE-CHECKLIST.md`:

1. Alle P1-Blocker aus Abschnitt 10 geschlossen oder mit
   schriftlicher Risikoakzeptanz belegt.
2. Externe Absicherung der Hash-Kette in Betrieb (WORM-Speicher oder
   qualifizierter Zeitstempel an unabhängigen Verwahrer).
3. Restore-Runbook einmalig getestet; Testprotokoll abgelegt.
4. IDW-PS-880-Auftrag erteilt oder dokumentierte Entscheidung gegen
   die Zertifizierung (mit Haftungs-Klausel-Abgleich).
5. Datenschutzerklärung, Impressum, AVV-Template rechtsverbindlich
   befüllt.
6. Schulungsnachweise für alle Anwender:innen.
7. Alle Routen und Pflicht-Workflows aus Verfahrensdoku Kap. 2 gegen
   den tatsächlichen Stand geprüft.

### Langfristig — nach Produktiv-Gang

1. ELSTER-ERiC-Backend-Microservice.
2. DEÜV-Meldungen in Lohn.
3. XRechnung-BR-Ruleset auf KoSIT-Vollprüfungs-Niveau ausbauen.
4. PEPPOL-Access-Point.
5. PDF/A-3-Vollzertifizierbarkeit (XMP, OutputIntent).
6. SKR04 / SKR49 / SKR51.

---

## 13. Risiken und Unsicherheiten

### Technische Risiken

| Risiko | Wirkung | Gegenmaßnahme / Stand |
|---|---|---|
| Hash-Kette wird unbemerkt gebrochen (Postgres-Superuser-Szenario) | Verlust der GoBD-Integritätsnachweisbarkeit | externe Spiegelung (P2), Rollentrennung auf DB-Ebene (P1) |
| Supabase-seitige Funktionen (Trigger, RLS) sind nicht durch lokale Tests abgedeckt | Regressionen erst im Staging sichtbar | integriert Staging-Prozess |
| Clientseitige OCR-Qualität ist nicht deterministisch | manuelle Nacharbeit bei Belegen erforderlich | in Anwenderdoku dokumentiert |
| happy-dom weicht in einzelnen Edge-Cases von Browser-Verhalten ab | ggf. grüne Tests, rotes Produktionsverhalten | für bekannte Fälle (UBL-Namespace-Parser) Workarounds |
| E-Bilanz XBRL ohne XSD-Validierung | Risiko der Ablehnung durch Finanzamt bei Schema-Verstoß | vor Produktivgang XSD-Validierung einbauen oder dokumentierte Risikoakzeptanz |

### Rechtliche Risiken

| Risiko | Wirkung | Gegenmaßnahme / Stand |
|---|---|---|
| DSGVO Art. 17-Löschung nicht umgesetzt | Bußgeldrisiko bei Löschanfragen | Design-Dok + Q1-Q8 an Fachanwalt/DSB offen |
| Keine IDW-PS-880-Zertifizierung | Nachweispflicht ggf. schwer führbar | Verfahrensdokumentation als Grundlage geschaffen |
| Nicht zertifizierte Ausgabeformate (DATEV, ELSTER, PDF/A-3) | Empfänger kann ablehnen | in UI und Docs benannt; Produktivbetrieb mit Toleranzbereich planen |
| AVV mit Supabase und ggf. Hosting-Provider noch nicht abgeschlossen | Auftragsverarbeitung ohne Vertragsgrundlage unzulässig | vor Produktivbetrieb Pflicht |
| Datenschutzerklärung / Impressum sind Scaffolds | Abmahnrisiko nach § 3a UWG | Fachanwalt-Befüllung Pflicht |
| AVV-Muster für Kanzlei↔Mandant fehlt | Auftragsverarbeitungs-Relation unklar dokumentiert | separater Legal-Review |
| TTDSG-§-25-Verstoß bei analytics vor Einwilligung | Bußgeldrisiko | durch Gate in `main.tsx` behoben (Sprint-2 Chunk 1) |
| HGB-Taxonomie 6.8 läuft 04/2026 aus (6.9 kommt) | E-Bilanz-Ablehnung | Deprecation-Fenster aktiv; Update ansteht |

### Operative Risiken

| Risiko | Wirkung | Gegenmaßnahme / Stand |
|---|---|---|
| Kein produktives Backup | Totalverlust bei Supabase-Projekt-Löschung oder Account-Kompromittierung | P1-Blocker, Umsetzung in `BACKUP-STRATEGY.md` skizziert |
| Kein Alarm bei Hash-Ketten-Bruch | verzögerte Reaktion auf Manipulation | P2 Monitoring-Pipeline |
| CI-Pipelines dormant | keine automatische Qualitätsprüfung je PR | Lösung: Git-Init + `npm run prepare` |
| Kein dokumentiertes Runbook für Sicherheitsvorfälle | improvisierte Reaktion bei Incident | Verfahrensdoku Kap. 4 Abschnitt 4.6 als Grobplan; volles Runbook vor Go-Live |
| Schlüssel-Verlust bei Crypto-Shredding (falls gewählt) | unwiederbringlicher Datenverlust | Shamir-Secret-Sharing, Off-Site-Key-Backup als Voraussetzung |
| Belegerfassung-Supabase-Pfad untested | Produktionsfehler bei erster realer Nutzung möglich | Integrationstests vor Go-Live ergänzen (P2) |

### Strategische Risiken

| Risiko | Wirkung | Gegenmaßnahme / Stand |
|---|---|---|
| Alleinentwicklung (Bus-Faktor 1) | Wissens- und Weiterentwicklungs-Ausfall | Dokumentation stark ausgebaut, aber kein zweiter aktiver Entwickler |
| Fehlende Zertifizierungen (IDW, DATEV, ELSTER) | Marktakzeptanz limitiert auf Nischen | bewusst als Positionierung: "Zweit-Tool", nicht DATEV-Ersatz |
| Abhängigkeit von Supabase als einzelnem Backend-Anbieter | Lock-in; Provider-Risiko | Postgres-Standard-Schema, kein proprietäres Feature-Lock-in |
| Frontend-Hosting noch nicht entschieden | Produktivbetrieb nicht startbar | offene TODO in Kap. 1.3 / Kap. 3.5 / Kap. 4.1 |

---

## 14. Externe Abhängigkeiten

### Supabase

- **Funktion:** PostgreSQL, Auth, Objekt-Storage.
- **AVV-Status:** **nicht abgeschlossen** — vor Produktivbetrieb
  verpflichtend (DSGVO Art. 28).
- **Region:** empfohlen Frankfurt (EU) für DSGVO-Drittstaatenfrage
  nach Art. 44 ff. DSGVO; konkrete Wahl steht aus.
- **Tier:** Point-in-Time Recovery erfordert kostenpflichtigen Tier;
  Entscheidung steht im Rahmen des Backup-Ops-Sprints aus.
- **Service-Level:** öffentlich veröffentlichte SLAs von Supabase
  sind Kanzlei-seitig zu prüfen und einzubeziehen.

### Sentry

- **Funktion:** Fehlerprotokollierung, Session Replay bei Fehlern.
- **Konfiguration:** opt-in per DSN; PII-Scrubbing aktiv;
  `maskAllText`, `maskAllInputs`, `blockAllMedia`.
- **DSGVO-Relevanz:** AVV mit Sentry oder eine Entscheidung gegen
  die Aktivierung ist Kanzlei-Sache; ohne DSN läuft die
  Initialisierung als No-Op.
- **Aufbewahrungsdauer** der Sentry-seitigen Daten ist Kanzlei-seitig
  zu klären.

### Analyse-Dienste (optional)

- **GA4** oder **Plausible** — laden ausschließlich, wenn die
  Kanzlei einen der beiden in den Einstellungen konfiguriert **und**
  die:der Nutzer:in im Cookie-Banner einwilligt (TTDSG § 25).
- AVV-/Datenschutz-Verantwortung liegt beim Kanzlei-Betreiber.

### Weitere SaaS-Dienste

- Keine weiteren Laufzeit-Abhängigkeiten. npm-Pakete laufen lokal im
  Browser (OCR, PDF-Parser, PDF-Erzeuger) und erreichen keine
  Drittanbieter über das Netzwerk.

---

## 15. Kosten-Einschätzung bis Produktiv-Gang

Die folgenden Beträge sind Schätzungen auf Basis marktüblicher
Tarife; verbindliche Angebote liegen nicht vor. Alle Beträge
exklusive MwSt.

### Rechtsberatung

| Position | Geschätzter Aufwand | Bemerkung |
|---|---|---|
| Fachanwalt für Steuerrecht — Beantwortung Q1-Q8 aus `HASH-CHAIN-VS-ERASURE.md` | 4-8 h à 250-400 € → 1.000-3.200 € | abhängig von Detailtiefe; die Fragen sind so formuliert, dass keine vertiefte Code-Analyse nötig ist |
| Datenschutzbeauftragte:r — Prüfung DSGVO-Artikel 17-Umsetzung, Review Datenschutzerklärung, AVV-Templates | 8-16 h à 150-250 € → 1.200-4.000 € | extern vergeben oder intern mit bestelltem DSB |
| Fachanwalt für IT-Recht — Datenschutzerklärung und Impressum | pauschal oder 3-6 h → 500-1.500 € | — |
| AVV-Template für Kanzlei↔Mandant | pauschal 500-1.500 € | — |

### IDW-PS-880-Zertifizierung

- **Vorbereitung durch die Kanzlei** (Verfahrensdoku finalisieren,
  Schulungsnachweise, Backup-Runbook-Test): 5-10 Personentage
  intern.
- **Prüfung durch externen Prüfer**: 15.000-40.000 €, abhängig von
  Prüfumfang und -tiefe; Angebote variieren erheblich. Keine
  Pflicht, aber vermarktungsrelevant.

### Hosting und Infrastruktur (jährlich)

| Position | Geschätzung |
|---|---|
| Supabase Pro/Team-Tier mit PITR für 1-2 Produktiv-Projekte | 300-1.500 € pro Jahr pro Projekt |
| S3 Frankfurt für Off-Site-Backup (ca. 100 GB + Traffic) | 100-400 € pro Jahr |
| Statisches Frontend-Hosting (Vercel, Netlify, Hetzner, eigene Infrastruktur) | 0-600 € pro Jahr je nach Anbieter |
| TLS-Zertifikate | inklusive bei o. g. Providern |
| Sentry (optional, Team-Tier) | 300-900 € pro Jahr |

### Weitere Positionen

| Position | Geschätzung |
|---|---|
| Playwright-E2E-Implementierung | 1-2 Personen-Wochen intern |
| Monitoring-Pipeline (Log-Aggregation, Alarm-Regeln) | 3-5 Personentage + ggf. 0-300 € pro Jahr für SaaS-Monitor |
| Schulungsmaterialien intern erstellen | 2-4 Personentage |
| Backup-Ops-Sprint | 2-3 Personentage (Ops) + 1 Tag Docs |
| Frontend-Hosting-Entscheidung + Setup | 2-3 Personentage |

### Gesamt-Spannbreite für externe Kosten bis Produktivbetrieb

- **Ohne IDW-PS-880-Zertifizierung:** ca. **3.000-12.000 €**
  (überwiegend Rechtsberatung + Hosting-Einmalkosten im ersten
  Jahr).
- **Mit IDW-PS-880-Zertifizierung:** zusätzlich **15.000-40.000 €**
  für die externe Prüfung.

Interne Personaltage liegen außerhalb der Schätzung und hängen vom
Stundensatz der Entwicklungs-Ressource ab.

---

## Quellen — für dieses Dokument konsultiert

- `CLAUDE.md` (422 Zeilen)
- `docs/ARCHITECTURE.md`
- `docs/PROJEKT-INVENTAR.md`
- `docs/BACKUP-STRATEGY.md`
- `docs/HASH-CHAIN-VS-ERASURE.md`
- `docs/NEXT-CLAUDE-HANDOFF.md`
- `docs/SESSION-2026-04-20-SUMMARY.md`
- `docs/USER-GUIDE-DE.md`
- `docs/BERATER-LEITFADEN.md`
- `docs/verfahrensdokumentation/README.md` und Kapitel 01 bis 08
- `package.json`
- `.github/workflows/ci.yml`, `dependabot.yml`, Husky-Hook-Dateien
- `supabase/migrations/` (Dateinamen-Liste 0001-0023, insb.
  Migrationen 0002, 0003, 0006, 0009, 0010, 0019, 0020, 0021, 0022,
  0023 einzeln konsultiert)
- `src/lib/monitoring/sentry.ts`
- Eigene Messung: Zeilen-Zählung, Test-Dateien-Verteilung, Migrationen-
  Anzahl (Stand 2026-04-20).

Alle darüber hinausgehenden Zahlen (Coverage 91/77/93 %, Test-Gesamt
727, Bundle 6,9 MB / 2,4 MB gzipped, Readiness 75 %) stammen aus
`CLAUDE.md §3` bzw. `PROJEKT-INVENTAR.md §2`. Finanzschätzungen in
Abschnitt 15 sind marktübliche Richtwerte, **keine Angebote**.
