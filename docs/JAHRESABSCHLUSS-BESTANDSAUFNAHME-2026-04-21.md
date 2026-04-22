# Jahresabschlussbericht — Bestandsaufnahme 2026-04-21

**Status:** Doku-Sprint · keine Code-Änderung · 1269/1269 Tests grün.
**Zweck:** Fakten-Grundlage für den geplanten Folge-Sprint
(Jahresabschluss-Wizard + Rules-Engine + Dynamic Documents + Export-
Pipeline).

---

## TEIL 1 — Bilanz + GuV: Ist-Zustand

### Bilanz

| Aspekt | Befund |
|---|---|
| Page | `src/pages/BilanzPage.tsx` (515 LOC) |
| Builder | `src/domain/accounting/BalanceSheetBuilder.ts` (354 LOC) — journal-driven: `buildBalanceSheet(accounts, entries, {stichtag, sizeClass})` |
| Strukturdefinition | `src/domain/accounting/hgb266Structure.ts` (625 LOC) — `HGB_266_REPORT_LINES`, `SizeClass = "KLEIN" \| "MITTEL" \| "GROSS" \| "ALL"` |
| SKR03-Mapping | `src/domain/accounting/skr03Mapping.ts` (201 LOC) |
| PDF-Generator | `src/lib/pdf/BilanzPdfGenerator.ts` (102 LOC) |
| Edit-Pfade | **Keine** — reine Read-only-Darstellung aus Journal. Grep auf `input type`, `editable`, `useMandant`, `selectedMandantId` → 0 Treffer. |

### GuV (§ 275 HGB)

| Aspekt | Befund |
|---|---|
| Page | `src/pages/GuvPage.tsx` (475 LOC) |
| Builder | `src/domain/accounting/GuvBuilder.ts` (343 LOC) — `buildGuv(accounts, entries, {periodStart, stichtag, sizeClass, verfahren})` |
| Strukturdefinition | `src/domain/accounting/hgb275GkvStructure.ts` (351 LOC) |
| SKR03-Mapping | `src/domain/accounting/skr03GuvMapping.ts` (141 LOC) |
| PDF-Generator | `src/lib/pdf/GuvPdfGenerator.ts` (62 LOC) |
| Verfahren | Nur GKV implementiert — UKV wirft: `GuvBuilder.ts:156` — `"Verfahren 'UKV' noch nicht implementiert"` |
| Entry-Filter | `entries.filter(e => e.status === "gebucht" && e.datum ∈ [periodStart, stichtag])` — konsistent mit Phase-3-Pattern |

### Gemeinsamer Jahresabschluss-Builder

`src/domain/accounting/FinancialStatements.ts` (101 LOC) — kombiniert
Bilanz + GuV mit **GoBD-Cross-Check** (Bilanz-provisional-result ==
GuV-Jahresergebnis, cent-tolerant).

### Read-only-Status + Lücke zu Phase-3-Pattern

- **Bilanz + GuV sind heute vollständig read-only.** Keine Form-Felder.
- Phase-3-Pattern (`gl-derived`-Felder mit Drill-down + `correctEntry`)
  ist NICHT auf Bilanz/GuV gespiegelt — Bilanz/GuV zeigen Zellen, nicht
  Inputs.
- **Lücke zu Phase-3-Muster:** keine Drill-down-Modal-Integration auf
  Bilanz/GuV-Zeilen. Der Nutzer kann NICHT von „Umsatzerlöse 250.000"
  zu den einzelnen 8400er-Entries klicken.
- **Stichtag-Handling:** `useYear().selectedYear` → default
  `${year}-12-31`; User kann via Date-Picker (Zeile 39) ändern.
  Konsistent mit Phase-1-YearContext.

## TEIL 2 — Anlagenspiegel

| Aspekt | Befund |
|---|---|
| Page | `src/pages/AnlagenspiegelPage.tsx` (281 LOC) |
| Verzeichnis | `src/pages/AnlagenVerzeichnisPage.tsx` (Stammdaten) |
| AfA-Berechnung | `src/domain/anlagen/AnlagenService.ts` (766 LOC) — `planAfaLauf` + `commitAfaLauf` |
| Datenquelle | `anlagegueter`-Tabelle (Migration 0025) + `afa_buchungen` — Phase-2-Schritt-5-Pattern |
| PDF-Export | `src/lib/pdf/AnlagenspiegelPdfGenerator.ts` (99 LOC) |
| Excel-Export | `src/lib/excel/AnlagenspiegelExcelExporter.ts` (136 LOC) |
| AfA-Methoden implementiert | `linear`, `degressiv`, `gwg_sofort`, `sammelposten` — `AfaMethode` in `types/db.ts`. Grep auf `linear|degressiv|sammelposten` in `AnlagenService.ts` zeigt alle 4 Methoden behandelt |
| Journal-Einbindung | Ja — `commitAfaLauf` schreibt Journal-Entries pro Anlage (`AfA linear {bezeichnung} ({inventar_nr})` als `beleg_nr`, siehe Z. 145) |
| Zugang/Abgang | Tests in `src/domain/anlagen/__tests__/Abgang.test.ts`, `AnlagenspiegelExtra.test.ts`, `AnlagenService.test.ts`, `GwgSammelposten.test.ts` |
| Validierungs-Routine | **Unklar** — kein dedizierter `validateAnlagenspiegel`-Grep-Treffer. Zugänge/Abgänge laufen über `createAnlageWithOpening`/`buchtAbgang`/`markAnlageAbgegangen`, aber kein zentraler Check „alle Zugänge haben AfA-Setup". |

## TEIL 3 — Anhang-Bausteine

| Aspekt | Befund |
|---|---|
| Standard-Textblöcke (§ 284-288 HGB) | **Keine.** Grep auf `§ 284|§ 285|§ 286|§ 287|§ 288` in Domain-Code: 0 Treffer für Anhang-Texte. `hgb266Structure.ts` referenziert §§ 264-277 (Bilanz + GuV), aber keine Anhang-Strukturen. |
| Lagebericht | **Nicht vorhanden.** Grep ohne Treffer. |
| Bescheinigung/Eigenerklärung | Platzhalter `"NACHGEBILDETE DARSTELLUNG"` im `BmfForm`-Stamp (Z. 13) — nur für BMF-Forms, keine Jahresabschluss-Bescheinigung. |
| Parametrisierbare Platzhalter (Unternehmensname, GJ, Rechtsform) | **Nicht vorhanden** als Textblock-System. |
| I18n | Deutsch monolingual. Kein i18n-Framework in `package.json`. |

## TEIL 4 — Pre-Closing-Validation

| Aspekt | Befund |
|---|---|
| Consistency-Checks Bilanz↔GuV | `src/domain/accounting/FinancialStatements.ts` — `crossCheck.matches` (Jahresergebnis-Equality, cent-tolerant) |
| EÜR↔GuV-Cross-Check | `src/domain/accounting/EuerGuvCrossCheck.ts` (176 LOC) |
| Hash-Chain-Integrität | `src/utils/journalChain.ts` — `verifyJournalChain()` |
| Festschreibungs-Service | `src/domain/gobd/FestschreibungsService.ts` + Tests |
| Period-Lock | `src/api/journal.ts` — `assertPeriodNotClosed()` (Z. 67) + `readPeriodClosedBefore()` (Z. 50-65) — liest `settings.periodClosedBefore` aus localStorage |
| Draft-Count-Signal | `src/api/advisorMetrics.ts` — `draftCount` für Dashboard; auch als Banner in `AnlageG/SBuilder.draftCount` (Smart-Banner-Sprint) |
| Bank-Reconciliation | `src/pages/BankReconciliationPage.tsx` (1058 LOC) — Page existiert · 59 `Match`-Treffer. Grep `ge-/nicht-abgeglichen`: wird im UI behandelt, aber **keine separate Validierungs-API** `fetchBankReconciliationGaps()` |
| Zentraler Closing-Validator | **Kein** Modul `closing`, `ClosingValidation`, `preClosing`, `plausibility`, `Plausibilitaet` — alle Greps = 0 |
| Unbalanced-Journal-Check (Soll=Haben pro Eintrag) | Implizit in `createEntry` (Zeile in `api/journal.ts` validiert `betrag > 0` + `soll_konto !== haben_konto`) — **kein Aggregat-Check** über den Gesamtzeitraum |
| Nicht-gebuchte Abschreibungen | `planAfaLauf` / `commitAfaLauf` existieren; **kein zentraler Check** „welche Anlagen haben für Jahr X noch keinen AfA-Eintrag" |
| Nicht-gebuchte Lohnläufe | Ähnlich: `postPayrollAsJournal` existiert; **kein zentraler Check** „welche Monate ohne Lohnlauf" |

**Fehlende strukturelle Closing-Checks** (nicht-erschöpfend):
- Aggregat-Trial-Balance (Σ Soll = Σ Haben über gesamten Zeitraum)
- Bankkonto-Saldo-Abgleich mit Kontoauszug-Ende
- Abstimmungs-Summen Debitoren/Kreditoren-Offene-Posten ↔ Bilanz
- Saldoverschleppung Vorjahr-Bilanz → Eröffnungsbilanz
- „Alle AfA-fälligen Anlagen haben Buchung im Zeitraum"
- „Keine offenen Entwürfe mit datum ≤ Stichtag"
- USt-Abstimmung Umsatz-Konten ↔ UStVA-Export
- Personen-Konten-Check (1200er/1400er-Salden plausibel)

## TEIL 5 — Wizard-Pattern

| Aspekt | Befund |
|---|---|
| Existierendes Wizard/Stepper | **Kein** Treffer für `Stepper`, `Wizard`, `currentStep`, `multiStep`, `steps:` in `src/` |
| Mehrstufige Flows | Keine. `MandantAnlageModal` ist 1-Step, `PayrollRunPage` ist ein Flow aber kein Step-Wizard, BankReconciliationPage hat tabs aber kein Wizard-Framework |
| UI-Bausteine in `src/components/ui/` | `Button.tsx`, `DataTable.tsx`, `Modal.tsx`, `Skeleton.tsx`, `VirtualTable.tsx` — **kein Stepper**. Keine Progress-Komponente. |
| Form-Library | **Keine** — kein `react-hook-form`, `formik`, `react-final-form` in `package.json` |
| Routing-Pattern für Multi-Step | Nicht etabliert. `useSearchParams` existiert in 5 Files (`main.tsx`, `ArbeitsplatzPage.tsx`, `MandantContext.tsx` + Tests) — URL-State-Pattern aus F42-Refactor, aber nicht auf Multi-Step-Flows ausgerichtet |

## TEIL 6 — PDF-Generierung

| Aspekt | Befund |
|---|---|
| Haupt-Tool | `jspdf` 4.2.1 + `jspdf-autotable` 5.0.7 (`package.json` Z. 26-27) · zusätzlich `pdf-lib` 1.17.1 für PDF/A-3-Embed (ZUGFeRD) |
| Basis-Klasse | `src/lib/pdf/PdfBase.ts` (zentral) — `PdfReportBase` mit A4, Ränder 20mm, Helvetica 10pt, DE-Nummernformat |
| Konsumenten (Features mit PDF) | `BilanzPdfGenerator.ts`, `GuvPdfGenerator.ts`, `AnlagenspiegelPdfGenerator.ts`, `GehaltsbescheinigungGenerator.ts` (alle unter `src/lib/pdf/`); plus `src/utils/*`: `exporters.ts` (TaxFormBuilder), `gehaltsabrechnung.ts`, `lohnsteuerbescheinigung.ts`, `mahnungPdf.ts`, `ustvaFormPdf.ts`, `verfahrensdokumentation.ts` |
| Zentralisierung | **Teilweise** — `PdfBase.ts` existiert, aber viele `src/utils/*PdfFoo.ts` nutzen direkt jsPDF ohne via Base. Duplikation ist vorhanden. |
| Deutsch + DIN 5008 | A4 ✓, Ränder 20mm ✓, Helvetica ✓. DIN-5008-Brief-Konventionen (Rechtsrand, Lochmarken) **nicht explizit** erwähnt. |
| Watermark / Entwurfskennzeichnung | Nur `BmfForm`-Stamp `"NACHGEBILDETE DARSTELLUNG"` (Component-Prop, kein PDF-Overlay). **Kein PDF-Level-Watermark** für Entwurfsstatus in `PdfBase.ts`. |

## TEIL 7 — XBRL / E-Bilanz

| Aspekt | Befund |
|---|---|
| XBRL-Builder | `src/domain/ebilanz/EbilanzXbrlBuilder.ts` (265 LOC) — `§ 5b EStG, HGB-Taxonomie 6.8` |
| Validator | `src/domain/ebilanz/EbilanzValidator.ts` (172 LOC) — `validateEbilanz()` mit Severity `ERROR`/`WARNING` |
| Taxonomie-Version | **HGB-Taxonomie 6.8 (2025-04-01)** — `src/domain/ebilanz/hgbTaxonomie68.ts` (138 LOC) |
| Page | `src/pages/EbilanzPage.tsx` (332 LOC) |
| GCD-Stammdaten-Block | `EbilanzUnternehmen`-Type (`EbilanzValidator.ts:22-30`): `name, steuernummer, strasse, plz, ort, rechtsform, groessenklasse`. **Nicht aus Client-Stammdaten gespeist** — User muss Daten manuell in EbilanzPage eingeben |
| Rechtsform-Union | `Rechtsform = "Einzelunternehmen" \| "GbR" \| "PartG" \| "OHG" \| "KG" \| "GmbH" \| "AG" \| "UG" \| "SE" \| "SonstigerRechtsform"` (`hgbTaxonomie68.ts:24-34`) |
| Größenklasse-Union | `Groessenklasse = "kleinst" \| "klein" \| "mittel" \| "gross"` (`hgbTaxonomie68.ts:36`). **ABWEICHEND** von `hgb266Structure.ts::SizeClass = "KLEIN" \| "MITTEL" \| "GROSS" \| "ALL"` — zwei verschiedene Enumerationen |
| ELSTER-Übertragung | Nicht für E-Bilanz. `src/utils/elster.ts` + `src/pages/ElsterPage.tsx` bedienen UStVA/EÜR/ESt (XML-Export, keine Transmission) |

## TEIL 8 — Rechtsform + Größenklasse — Mandant-Stammdaten

| Aspekt | Befund |
|---|---|
| `Client`-Type heute | `src/types/db.ts:165-176` · `{id, mandant_nr, name, steuernummer, ust_id, iban, ust_id_status, ust_id_checked_at, last_daten_holen_at, created_at}` |
| **Rechtsform-Feld im Client-Type** | **NICHT VORHANDEN.** Grep `rechtsform\|legal_form` in `types/db.ts` → 0 Treffer |
| Größenklasse | Nicht im Client. `SizeClass` ist ein Runtime-Option-Parameter für Builder. `Groessenklasse` ist ein separates Enum für EbilanzUnternehmen. |
| HRB-Nummer, Gezeichnetes Kapital, Organe | Nicht im Client-Type. ArbeitsplatzPage-Tabelle zeigt Spalte „Rechtsform" (Z. 474) — unklar, woher der Wert kommt; evtl. nur UI-Placeholder |
| Kapitalgesellschaft-spezifische Felder | Nicht modelliert |
| Mehrperioden-Vergleich | **Ja, strukturell vorhanden:** `src/domain/accounting/VorjahresvergleichBuilder.ts` (211 LOC) · `src/pages/VorjahresvergleichPage.tsx` (501 LOC). Baut aus Journal-Entries ein Vorjahres-Delta |

## TEIL 9 — Rich-Text-Editor

| Aspekt | Befund |
|---|---|
| WYSIWYG-Libraries | **Keine.** Grep auf `tiptap\|quill\|lexical\|slate\|prosemirror` in `src/`: nur CSS-Treffer (z. B. in `BankReconciliationPage.css` — vermutlich ein `overflow-x: hidden`- oder ähnlicher Kontext, keine Import-Statements) |
| `contenteditable` | Kein Treffer in `src/` (nur in CSS-Dateien als Selektor/Dokumentation) |
| Textareas | Viele (e. g. `DrillDownModal.tsx` hat `<textarea>` für Korrekturgrund) — plain HTML, kein Markdown-Support |
| PDF-Export-kompatibles Text-Format | Nicht vorhanden. jsPDF rendert plain strings via `doc.text()` oder `autoTable`. Kein HTML-zu-PDF-Pipeline. |

## TEIL 10 — Abhängigkeiten zu offenen Tech-Debts

| Offener Punkt (Quelle) | Berührung mit Jahresabschluss-Sprint |
|---|---|
| **Phase-1-Backfill `client_id`** (Phase-1-Abschluss §13) | Muss NICHT vor Jahresabschluss erfolgen. Neue Entries seit Phase 1 tragen `client_id`; Alt-Entries (vor Migration 0026) haben `client_id=NULL`. Jahresabschluss pro Mandant filtert `e.client_id === selectedMandantId` — Altbestand fällt raus, das ist gewollt. |
| **AnlageV / Kap / Sonder / AgB verschoben** (Phase-3-Abschluss §6) | Tangiert **nicht** den HGB-Jahresabschluss. Das sind private ESt-Anlagen, nicht betriebliche Steuererklärung. |
| **Hash-Chain-Concurrency-Härtung** (Phase-2 Schritt 3) | Nicht-blocker. Single-User-Jahresabschluss-Flow ist race-frei. |
| **AV-Verträge Supabase-Migration** (`TECH-DEBT-AV-VERTRAEGE-SUPABASE.md`) | Nicht-relevant. Private AV-Daten, kein HGB-Abschluss. |
| **DB-UNIQUE-Constraint auf `lohnabrechnungen_archiv`** (Phase-2 Schritt 2 offen) | Nicht-blocker. Betrifft Archiv-Upsert-Kollisionen, nicht Abschluss-Pipeline. |
| **UKV (§ 275 Abs. 3 HGB)** (CLAUDE.md §10 P3) | Wenn Jahresabschluss-Sprint UKV benötigt: `GuvBuilder.ts:156` wirft. Vorher muss UKV-Verfahren implementiert werden. Für GmbH-Default (GKV) kein Blocker. |
| **EuerGuvCrossCheck** existiert bereits | Wiederverwendbar als Baustein für Pre-Closing-Validation-Engine. |
| **`draftCount`-Signal aus Smart-Banner-Sprint** | Wiederverwendbar für Pre-Closing-Gate („keine Entwürfe mehr offen"). |
| **`periodClosedBefore` in Settings** | Existiert, aber nur Runtime-Schutz; kein Closing-Lifecycle-State (wer hat wann abgeschlossen, Audit-Trail dazu). |

## TEIL 11 — Lücken-Zusammenfassung (Epic-Mapping)

Legende: ✅ exists · 🟡 partial · ❌ missing

### E1 — Pre-Closing-Validation-Engine

| Baustein | Status | Heutiger Pfad | Notiz |
|---|---|---|---|
| Hash-Chain-Verifikation | ✅ | `src/utils/journalChain.ts` | `verifyJournalChain()` produktionsreif |
| Bilanz↔GuV-Cross-Check | ✅ | `src/domain/accounting/FinancialStatements.ts` | cent-tolerant, gut getestet |
| EÜR↔GuV-Cross-Check | ✅ | `src/domain/accounting/EuerGuvCrossCheck.ts` | wiederverwendbar |
| Draft-Count-Signal | ✅ | `src/api/advisorMetrics.ts` + `AnlageG/SBuilder.draftCount` | pro Mandant + pro Anlage |
| Bank-Reconciliation-Gaps | 🟡 | `src/pages/BankReconciliationPage.tsx` | Page + UI existieren, aber kein Headless-`fetchReconciliationGaps()`-API |
| Nicht-gebuchte AfA-Detektion | ❌ | — | `AnlagenService` kann AfA planen, aber kein „welche Anlagen im Jahr X ohne Buchung"-Check |
| Nicht-gebuchte Lohnläufe | ❌ | — | `postPayrollAsJournal` existiert; kein Aggregat-Check über Monate |
| Unbalanced-Trial-Balance | ❌ | — | kein Σ-Soll-vs-Σ-Haben-Aggregat-Test |
| Period-Lock-State | 🟡 | `src/api/journal.ts::readPeriodClosedBefore` | Runtime-Schutz via Settings; kein Lifecycle-State + Audit |
| Zentraler Closing-Validator | ❌ | — | muss neu gebaut werden (sammelt alle obigen Signale in eine Response) |

### E2 — Condition-Wizard + Rules-Engine

| Baustein | Status | Heutiger Pfad | Notiz |
|---|---|---|---|
| Rechtsform-Enum | ✅ | `src/domain/ebilanz/hgbTaxonomie68.ts::Rechtsform` | 10 Werte, HGB-Taxonomie-6.8-konform |
| Größenklasse-Enum | 🟡 | 2 konkurrierende Enums (`SizeClass`, `Groessenklasse`) | Harmonisierung nötig |
| § 267 HGB-Berechnung (Bilanzsumme/Umsatz/MA) | ❌ | — | Bilanzsumme existiert (`BalanceSheetReport.aktivaSum`), Umsatz aus GuV, Mitarbeiterzahl aus `employees`-Tabelle — aber kein Aggregat-Klassifikator |
| Rechtsform im Mandant-Stammdatensatz | ❌ | — | `Client`-Type hat keinen Rechtsform-Slot |
| HRB / Gezeichnetes Kapital / Organe | ❌ | — | Nicht modelliert |
| Anhang-Pflicht-Rules | ❌ | — | Kein Rules-Engine-Framework |
| Lagebericht-Pflicht-Rules | ❌ | — | Kein Rules-Engine-Framework |
| Taxonomie-Version-Auswahl | 🟡 | `hgbTaxonomie68.ts` hart codiert auf 6.8 | Mehrversions-Support fehlt |
| Wizard-/Stepper-Pattern | ❌ | — | Komplett neu |
| Form-Library | ❌ | — | Keine |

### E3 — Dynamic-Document-Generation

| Baustein | Status | Heutiger Pfad | Notiz |
|---|---|---|---|
| Bilanz-Rendering | ✅ | `BilanzPage.tsx` + `BilanzPdfGenerator.ts` | Read-only, HGB § 266, size-class-aware |
| GuV-Rendering | ✅ | `GuvPage.tsx` + `GuvPdfGenerator.ts` | GKV-only, UKV offen |
| Anlagenspiegel | ✅ | `AnlagenspiegelPage.tsx` + `AnlagenspiegelPdfGenerator.ts` + Excel | vollständig |
| Vorjahresvergleich | ✅ | `VorjahresvergleichBuilder.ts` + Page | vollständig |
| Deckblatt-Template | ❌ | — | Kein Cover-Page-Template |
| Inhaltsverzeichnis-Generator | ❌ | — | jsPDF hat kein nativer TOC; müsste aus Dokumentenstruktur abgeleitet werden |
| Anhang-Text-Bausteine (§ 284-288) | ❌ | — | Keine Sammlung vorhanden |
| Lagebericht-Bausteine | ❌ | — | Nicht vorhanden |
| Bescheinigung/Siegel | 🟡 | `BmfForm::stamp` | nur UI-Watermark, nicht PDF-Siegel/Bescheinigungstext |
| Rich-Text-Custom-Blocks | ❌ | — | Keine WYSIWYG/Markdown-Infrastruktur |
| Platzhalter-System (Template-Engine) | ❌ | — | Keine Template-Engine |
| Konsolidierte Dokumenten-Pipeline (Deckblatt→TOC→Bilanz→GuV→…→Bescheinigung in einem PDF) | ❌ | — | Einzel-PDFs existieren, kein Merge-Pipeline |

### E4 — Export-Pipeline

| Baustein | Status | Heutiger Pfad | Notiz |
|---|---|---|---|
| PDF-Rendering-Basis | ✅ | `src/lib/pdf/PdfBase.ts` | jsPDF + autotable, A4, DE-Locale |
| PDF pro Feature | ✅ | `src/lib/pdf/*`, `src/utils/*PdfFoo.ts` | Duplikation teilweise, Zentralisierung unvollständig |
| XBRL-Builder (E-Bilanz) | ✅ | `src/domain/ebilanz/EbilanzXbrlBuilder.ts` | HGB-Taxonomie 6.8 |
| XBRL-Validator | ✅ | `src/domain/ebilanz/EbilanzValidator.ts` | Validation-Severities |
| GCD-Stammdaten-Pipeline | 🟡 | `EbilanzUnternehmen`-Type lokal in `EbilanzPage` | Stamm-Pipeline aus `Client`-Type fehlt (weil `Client` die Felder nicht hat) |
| Mehrversions-Taxonomie | ❌ | — | Hart-kodiert auf 6.8 |
| ELSTER-Transmission für E-Bilanz | ❌ | — | UStVA/EÜR-Muster in `src/utils/elster.ts`, aber keine E-Bilanz-Adaption (Bestands-CLAUDE.md §10 nennt das P1) |
| PDF/A-3 (langzeitarchiv) | 🟡 | `pdf-lib` 1.17 + `ZugferdBuilder.ts` | Nur für Ausgangs-Rechnungen (ZUGFeRD); nicht für Jahresabschluss-Dokumente |
| PDF-Watermark „Entwurf" | ❌ | — | Smart-Banner-Sprint-Altlast: Simulation-Mode disabled den Button, aber kein PDF-Overlay, wenn Export doch via Browser-Druck läuft |
| Dokumentenarchivierung nach Export | ❌ | — | Keine `signed-off-year-end-report`-Persistenz |

---

## Gesamt-Luecken-Schaetzung (Schwerpunkte für Folge-Sprint)

1. **Wizard/Stepper-Framework** — komplett neu (inkl. Step-Navigation, Form-Validierung, State-Persistenz).
2. **Mandant-Stammdaten-Erweiterung** — `Client`-Type um Rechtsform, Größenklasse (berechnet), HRB, Gezeichnetes Kapital, Organe. DB-Migration nötig.
3. **Rules-Engine** für Anhang-/Lagebericht-Pflichten abhängig von Rechtsform × Größenklasse × § 267 HGB.
4. **Anhang-Text-Baustein-Bibliothek** — Rechtstexte nach §§ 284-288 HGB + parametrisierte Platzhalter.
5. **Rich-Text/Markdown-Editor** — Technologie-Entscheidung offen (TipTap/Lexical/kein-Editor-via-Textarea).
6. **Template-Engine** für Platzhalter-Substitution in Textblöcken.
7. **Dokumenten-Merge-Pipeline** — Deckblatt + TOC + Bilanz + GuV + Anlagenspiegel + Anhang + Lagebericht + Bescheinigung als einziges PDF mit konsistentem Layout.
8. **Pre-Closing-Validation-Engine** — aggregiert bestehende Checks (Hash, Cross-Check, Draft-Count, Bank-Reconciliation-Gap, AfA-Lücken, Lohn-Lücken, Trial-Balance) in ein einziges `validateYearEnd(mandantId, jahr)` mit Severity-Klassifikation.
9. **XBRL-Taxonomie-Versions-Support** — Mehrversions-Handling für HGB-Taxonomie 6.6/6.7/6.8/6.9.
10. **PDF-Watermark-Infrastruktur** — Entwurf-Overlay in `PdfBase.ts` für nicht-final Exporte.

## Bestehende Bausteine (griffbereit)

- **Journal-driven Builder-Pattern** (Phase 3) als Template für neue Reports.
- **`PdfReportBase`** als zentraler PDF-Baukasten.
- **`FinancialStatements::crossCheck`** als Vorbild für größere Validator-Pipeline.
- **`VorjahresvergleichBuilder`** als Muster für Mehrperioden-Struktur.
- **`EbilanzValidator`** als Muster für Severity-Validation-Framework.
- **`HGB_266_REPORT_LINES`** und `HGB_275_GKV_STRUCTURE` als strukturierte Taxonomien.
- **`useYear` + `selectedMandantId`** als Scope-Primitives.
- **`DrillDownModal` + `correctEntry`** als Muster für editierbare Read-only-Ansichten via Korrekturpfad (wenn Jahresabschluss Drill-down bekommen soll).
- **`SettingsContext::periodClosedBefore`** als Basis für Closing-Lifecycle-State.

---

**Verifikations-Gate:** tsc clean · `1269 Tests grün / 106 Files` · keine Code-Änderung während dieses Sprints. Diese Doku ist der einzige Output.
