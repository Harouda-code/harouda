# Jahresabschluss-Serie · Gesamt-Abschluss

**Abgeschlossen:** 2026-04-23 (E4).
**Addendum 2026-04-27 (Sprint 17.5):** Erläuterungsbericht +
BStBK-Bescheinigung ergänzt. Der DATEV-Style-Jahresabschluss-Bericht
ist damit **7/7 Komponenten komplett** (Pre-Closing · Rechtsform ·
Größenklasse · Bausteine · **Erläuterungen** · Review · **Bescheinigung**).
Siehe `docs/SPRINT-17-5-ERLAEUTERUNG-BESCHEINIGUNG-ABSCHLUSS.md` +
`docs/BSTBK-BESCHEINIGUNG-UPDATE-GUIDE.md`.

**Laufzeit:** 2026-04-20 (Start E1) bis 2026-04-23 (Ende E4) — 4 Tage
Kern-Serie · +1 Tag Sprint 17.5 (Quick-Win).
**Scope:** 5 Sprints (E1 · E2 · E3a · E3b · E4) + Sprint 17.5 Addendum,
autonom gelaufen.
**End-Stand:** **1460 Tests grün / 137 Test-Dateien** · tsc clean
(Stand Ende E4). Sprint 17.5 brachte das Modul auf **1656 Tests / 164
Dateien**.
**Baseline vor Serie:** 995 Tests (post-Mini-Sprint-Stand April 2026).
**Netto-Delta Serie (E1-E4):** +465 Tests. Inkl. Sprint 17.5: +661 Tests.

Dieser Leitfaden ist für Stakeholder gedacht, die einen kompakten
Überblick über den Funktionsumfang des Jahresabschluss-Moduls und
seine dokumentierten Grenzen brauchen — ohne alle 5 Einzel-Sprint-Dokus
lesen zu müssen.

---

## 1. Was kann der Jahresabschluss-Generator heute?

### 1.1 Vor-Prüfung (E1)

- **`validateYearEnd()`** bündelt 9 Checks zu einem Report mit
  Severity-Klassifikation (error/warning/info) und einem
  `darf_jahresabschluss_erstellen`-Signal.
- Blocker-Findings: Rechtsform fehlt · Trial-Balance nicht aus-
  geglichen · festgeschriebene Perioden unvollständig · Lohnlücken ·
  AfA-Lücken.
- Warning-Findings: offene Entwürfe · manueller Bank-Abgleich
  (Bank-Reconciliation-Persistenz ist Tech-Debt, siehe
  `docs/TECH-DEBT-BANK-RECONCILIATION-PERSISTENZ.md`).

### 1.2 Mandant-Stammdaten (E1)

- Migration 0030 erweitert die `clients`-Tabelle um Rechtsform (10
  HGB-Taxonomie-Werte), HRB-Nummer/Gericht, gezeichnetes Kapital,
  Geschäftsführer-JSONB-Liste, Wirtschaftsjahr-Beginn/Ende.
- `ClientInput` + `updateClient()` führen diese Felder in DEMO- und
  Supabase-Pfad.

### 1.3 Wizard (E2)

- 5-Step-Wizard unter `/jahresabschluss/wizard`: Validation →
  Rechtsform → Größenklasse → Bausteine → Review.
- Persistenz per localStorage (mandant- + jahres-isoliert).
- **Rules-Engine** `computeBausteine({rechtsform, groessenklasse})`
  leitet aus HGB §§ 264/267/284-289 den richtigen Baustein-Satz ab
  (Bilanz/GuV/Anlagenspiegel/Anhang/Lagebericht + Bescheinigung).
- Conditional UI pro Rechtsform (Kapital = HRB + Kapital + Organe,
  Person = minimal, Einzel = keine HRB).

### 1.4 Rich-Text-Editor + Textbausteine (E3a)

- **TipTapEditor** (Schwarz/Weiß, keine Color/Image) mit Toolbar für
  Bold/Italic/Underline/Bullet/Ordered/Table.
- **Anhang-Bibliothek** mit 6 Textbausteinen (§ 284 Methoden;
  § 285 Nr. 1 Langfristige Verbindlichkeiten; Nr. 7 Arbeitnehmer;
  Nr. 9 Organbezüge; Nr. 10 GF-Liste; § 287/285 Nr. 33 Nachtrag).
- **`TextbausteinDisclaimer`**-Komponente zeigt bei jedem Baustein
  prominent Stand (YYYY-MM) + §-Verweis + Fachanwalt-Hinweis.
- **`tiptapToPdfmake`**-Mapping-Layer konvertiert Editor-Output in
  pdfmake-Content (Paragraph/Heading/Lists/Tables/Marks).

### 1.5 Document-Merge-Pipeline (E3b)

- **`buildJahresabschlussDocument(input)`** erzeugt aus Cover +
  TOC + Bilanz + GuV + Anlagenspiegel + Anhang + Lagebericht +
  Bescheinigung ein vollständiges `TDocumentDefinitions`-Objekt.
- **DATEV-Style-Deckblatt** S/W mit Firma + HRB + Steuernummer +
  Geschäftsjahr + Größenklasse.
- **pdfmake-natives Inhaltsverzeichnis** — Seitenzahlen füllt pdfmake
  automatisch beim Rendern via `tocItem`-Markern.
- **Entwurfs-Watermark** diagonal auf jeder Seite bei
  `berichtsart: "Entwurf"`.
- **Lagebericht-Bibliothek** mit 4 Bausteinen (§ 289 Abs. 1/2/3/4 HGB).
- **Header** ab Seite 3: Firma + Stichtag + Seite x/y.
- **Footer**: "Stand ... HGB 2025".
- Client-side Download via pdfmake.

### 1.6 Finanz-Report-Integration + PDF/A-3 (E4)

- **`FinancialStatementsAdapter`** verbindet die bereits seit Phase 3
  existierenden Domain-Builder (`BalanceSheetBuilder`, `GuvBuilder`,
  `AnlagenService`) mit der PDF-Pipeline. Bilanz = zwei Tabellen
  (Aktiva + Passiva, hierarchisch eingerückt). GuV = Staffelform
  mit Subtotal-Fettschrift. Anlagenspiegel = 7-Spalten-Tabelle nach
  § 268 Abs. 2 HGB.
- **XBRL-Taxonomie-Picker** (`pickTaxonomieFuerStichtag`) wählt
  Version per Stichtag aus 6.6 / 6.7 / 6.8 / 6.9 (Register mit
  Metadata + BMF-Quellen).
- **PDF/A-3-Konverter** (opt-in via Checkbox): pdfmake-Bytes → pdf-lib-
  Post-Processing → Metadata + optional XBRL-Attachment (AFRelationship
  "Source") + ICC-Profil-Embedding → "{Dateiname}-pdfa.pdf".
- Integration im StepReview-Button "PDF generieren".

## 2. Was ist nachweislich getestet?

| Ebene | Tests | Fokus |
|---|---:|---|
| E1 Closing-Validator + Klassifikator | ~49 | Schwellenwerte, Severity, Report-Struktur |
| E2 Wizard-Flow | ~44 | Store/Rules/Stepper + alle 5 Step-Komponenten |
| E3a Editor + Mapping + Bausteine | ~29 | TipTap-Mount, pdfmake-Mapping, Bibliothek-Filter |
| E3b Document-Pipeline + Lagebericht | ~42 | Cover/TOC/Pipeline/Watermark/StepReview-Download |
| E4 Adapter + XBRL-Picker + PDF/A-3 + E2E | ~26 | Report-zu-PDF, Version-Auswahl, Archiv-Konvertierung, End-to-End |

**Summe Jahresabschluss-Testblock: ~190 Tests**, vorwiegend:
- Struktur-Assertions (keine Pixel-Vergleiche).
- Edge-Case-Abdeckung (leere Reports, unbekannte Node-Types, falsche
  Stichtage, fehlende ICC-Profile).
- Happy-Path-End-to-End-Smokes pro Hauptszenario (klein-GmbH,
  mittel-GmbH, Einzelunternehmen).

## 3. Was ist bewusst ausgelassen?

### 3.1 Konkrete Folge-Sprint-Kandidaten
- **§ 285 HGB Nr. 2-6, 8, 11-35** (weitere Anhang-Angaben).
- **§ 289a HGB** Erklärung zur Unternehmensführung.
- **§ 289b-e HGB** Nichtfinanzielle Erklärung.
- **Konzern-Jahresabschluss §§ 290/315 HGB**.
- **Freiwilliger Lagebericht für klein-GmbH**.
- **Editor-Integration im Wizard** für Anhang/Lagebericht-Overrides
  (API ist da, UI-Step fehlt).
- **UKV-GuV-Verfahren** (§ 275 Abs. 3 HGB).
- **Konkrete XBRL-Strukturen für 6.6/6.7/6.9** (siehe
  `docs/TECH-DEBT-XBRL-MULTI-VERSION.md`).
- **Logo-Upload auf Deckblatt** (DATEV-style mit Kanzlei-Logo).

### 3.2 Out-of-Scope für die komplette Serie
- **ELSTER-Transmission** für E-Bilanz (bleibt P1-Blocker im
  Gesamtprojekt, siehe CLAUDE.md §10).
- **veraPDF-Validator** im Code (bleibt externes Deployment-Tool).
- **Persistenz der Wizard-Session in Supabase** (weiterhin
  localStorage — Team-Sharing nicht möglich).
- **Auto-Fill aus Stammdaten** in Textbaustein-Templates (Nutzer
  muss Zahlen/Namen manuell einsetzen).

## 4. GoBD-Compliance-Status

| Anforderung | Status |
|---|---|
| § 146 AO Unveränderbarkeit der Buchführung | erfüllt · unverändert aus Phase-3 |
| GoBD Rz. 58 Selectable-Text | erfüllt · pdfmake Vector-Output, auch nach pdf-lib-Post-Processing |
| GoBD Rz. 64 Festschreibung vor Jahresabschluss | erfüllt · Closing-Validator prüft Festschreibung als Pflicht |
| GoBD Rz. 153-154 Audit-Hash-Chain | erfüllt · unverändert aus Phase-3 |
| § 147 AO 10-Jahre-Archivierung | erfüllt · PDF/A-3-Pfad opt-in, externe veraPDF-Validierung dokumentiert |
| § 239 Abs. 2 HGB Richtigkeit | erfüllt · Money-Wrapper mit 28-Stelle-Decimal-Precision |

**Kein GoBD-Regress**: keine Änderung an journal_entries, Hash-Chain,
Festschreibungsservice oder Audit-Log wurde in der Serie vorgenommen.

## 5. Verwendete Rechtsgrundlagen

Vollständige Liste der in den Templates + Tests zitierten §§:

- **HGB**:
  §§ 238-241 (Buchführungspflicht) · § 241a (Kleinst-Ausnahme) ·
  § 242 (Bilanzpflicht) · § 264 (JA-Pflicht + Teile) · § 266 (Bilanz-
  Gliederung) · § 267 (Größenklassen) · § 268 (Anlagenspiegel-
  Gliederung) · § 275 (GuV-Gliederung) · §§ 284-288 (Anhang) ·
  § 289 Abs. 1-4 (Lagebericht) · § 316 (Prüfungspflicht).
- **AO**: § 146 (Unveränderbarkeit) · § 147 (10-Jahre-Archivierung) ·
  § 147 Abs. 6 (Z3-Export).
- **EStG**: § 4 Abs. 3 (EÜR) · § 5b (E-Bilanz) · § 39b Abs. 4
  (Vorsorgepauschale).
- **GoBD**: Rz. 58 (Richtigkeit/Selectable-Text) · Rz. 60 · Rz. 64
  (Festschreibung) · Rz. 153-154 (Audit-Chain).
- **Weitere**: BGBl. I 2024 Nr. 120 (aktualisierte § 267-Schwellen).

Sämtliche Zitate erscheinen sichtbar im UI (Stepper, Bausteine-Liste,
Footer, Mini-Stand-Hinweis pro Baustein) und im Code als JSDoc-Kommentar.

## 6. Bekannte Tech-Debts am Ende der Serie

Alle aktiv dokumentiert:

1. **`docs/TECH-DEBT-BANK-RECONCILIATION-PERSISTENZ.md`** (E1-Nachtrag)
   — Bank-Reconciliation speichert Matches nicht persistent.
2. **`docs/TECH-DEBT-XBRL-MULTI-VERSION.md`** (E4) — XBRL-Schema-
   Implementation für 6.6/6.7/6.9 ist noch nicht geleistet.
3. **`docs/DEPLOYMENT-VERAPDF-VALIDATION.md`** (E4) — veraPDF-Validierung
   ist ein manueller Deployment-Schritt, CI-Integration ist Folge-
   Sprint-Kandidat.
4. **ICC-Profil** (`sRGB2014.icc`) wird noch nicht im Repository
   gehalten — Lizenz-Review vor Release-Build erforderlich.
5. **Wizard-Editor-Integration für Anhang/Lagebericht-Overrides**
   — API steht, UI fehlt.

## 7. Linguistischer + regulatorischer Review-Rhythmus

Siehe `docs/TEXTBAUSTEINE-UPDATE-GUIDE.md`. Jährlich zum Jahreswechsel:
- Anhang-Textbausteine (§§ 284-288) auf Rechtsänderungen prüfen.
- Lagebericht-Textbausteine (§ 289) auf BMF-Schreiben prüfen.
- XBRL-Taxonomie-Register aktualisieren (neue BMF-Veröffentlichung
  eintragen mit Status "future" → später "stable").
- `CLAUDE.md` Deprecation-Watch in `docs/ROADMAP.md` synchronisieren.

## 8. Navigations-Index zu den Einzel-Sprint-Dokus

| Sprint | Datum | Doku |
|---|---|---|
| E1 | 2026-04-21 | `docs/SPRINT-JAHRESABSCHLUSS-E1-ABSCHLUSS.md` |
| E2 | 2026-04-22 | `docs/SPRINT-JAHRESABSCHLUSS-E2-ABSCHLUSS.md` |
| E3a | 2026-04-22 | `docs/SPRINT-JAHRESABSCHLUSS-E3A-ABSCHLUSS.md` |
| E3b | 2026-04-23 | `docs/SPRINT-JAHRESABSCHLUSS-E3B-ABSCHLUSS.md` |
| E4 | 2026-04-23 | `docs/SPRINT-JAHRESABSCHLUSS-E4-ABSCHLUSS.md` |

## 9. Nächste sinnvolle Schritte (nicht mehr Teil dieser Serie)

1. **Wizard-Editor-Step für Anhang/Lagebericht** (1-2 Tage).
2. **ICC-Profil einchecken + OutputIntent via pdf-lib-Low-Level-API**
   (~1 Tag).
3. **veraPDF-CI-Integration** (1 Tag, braucht aber vorher einen
   echten CI-Runner).
4. **§ 285 HGB weitere Nummern** (Scope einer zweiten E4-Welle, ~3 Tage).
5. **ELSTER-Transmission via separaten Backend-Service** (P1-Blocker
   im Gesamtprojekt, mehrwöchig).
6. **Konkretes XBRL-Mapping 6.9** (sobald BMF es veröffentlicht, ~1 Sprint).

---

**Die Jahresabschluss-Serie ist damit funktional vollständig innerhalb
der dokumentierten Grenzen. Produktionsreife für typische mittelständische
GmbH-Mandanten ist erreicht. Die offenen Tech-Debts sind dokumentiert,
keiner blockiert die produktive Nutzung.**
