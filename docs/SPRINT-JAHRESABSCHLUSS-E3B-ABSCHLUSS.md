# Sprint Jahresabschluss-E3b — Document-Merge-Pipeline + Cover + TOC + Lagebericht + Watermark + Final-Export

**Abgeschlossen:** 2026-04-23 · Autonomer Langlauf · 7 Schritte.
**End-Stand:** **1434 Tests grün / 133 Test-Dateien** · tsc clean.
**Scope:** E3b — schliesst den Rich-Text-Pfad aus E3a zu einem real
generierbaren PDF-Dokument ab. E4 (XBRL + PDF/A-3) folgt separat.

---

## 1. Ziel + Rechtsbasis

**Ziel:** Vollstaendiges PDF-Pipeline vom Wizard-End-State
(Rechtsform + Groessenklasse + Bausteine) zu einem druckfertigen
Jahresabschluss. Inklusive Deckblatt, automatischem Inhaltsverzeichnis,
Anhang- und Lagebericht-Sektionen, Header/Footer, Entwurfs-Watermark und
Client-side Download ueber `pdfMake.createPdf(...).download(...)`.

**Rechtliche Basis:**
- **§ 264 Abs. 1 HGB** — Jahresabschluss-Pflicht + Pflichtangaben auf
  dem Deckblatt.
- **§ 289 HGB** — Inhaltsanforderung Lagebericht (Absaetze 1 bis 4).
- **§ 267 HGB** — Groessenklassen-Zuordnung (Deckblatt-Angabe).
- **GoBD Rz. 58** — Selectable-Text-Anforderung (pdfmake liefert
  Vector-Text, nicht Raster).
- **GoBD-Grundsatz "Unveraenderbarkeit"** — Watermark "ENTWURF" bei
  noch nicht finalisierten Dokumenten verhindert Verwechslungsrisiko.

**Zielgruppe:** Kapitalgesellschaften (GmbH/AG/UG/SE) mittel + gross
erzielen volle Abdeckung. Klein bekommt Anhang aber keinen Lagebericht
(§ 264 Abs. 1 S. 4 HGB). Einzelunternehmen bekommt Cover + Bescheinigung,
EUeR-Builder-Adapter ist Folge-Sprint.

## 2. Schritt-Changelog

| # | Thema | Deliverables | Tests Δ |
|---|---|---|---|
| 1 | **CoverPageBuilder** | `pdf/CoverPageBuilder.ts` · DATEV-Style S/W · 3-Block-Layout (Titel/Firma+HRB/Meta) · Entwurfs-Text-Hinweis | +8 |
| 2 | **TocBuilder** | `pdf/TocBuilder.ts` · `buildToc()` pdfmake-natives TOC · `buildStaticToc()` Fallback-Variante mit Dots | +6 |
| 3 | **Lagebericht-Textbausteine** | `lageberichtTextbausteine.ts` · 4 Bausteine (§ 289 Abs. 1/2 Nr. 1/3/4) · `getLageberichtFuer()`-Filter inkl. `kapitalmarktorientiert` | +8 |
| 4 | **DocumentMergePipeline** | `pdf/DocumentMergePipeline.ts` · Cover→TOC→Bilanz→GuV→AnlSpiegel→Anhang→Lagebericht→Bescheinigung · A4 · Header ab Seite 3 · Footer "Stand ... HGB 2025" · TOC-Linking via `tocItem` | +11 |
| 5 | **Watermark-Infrastruktur** | `pdf/Watermark.ts` · `buildWatermark()` mit S/W-tauglichen Defaults (#999, 0.2, -45°, 72pt bold) · Integration in Pipeline bei `berichtsart==='Entwurf'` | +3 |
| 6 | **StepReview-Integration** | `pages/jahresabschluss/StepReview.tsx` — neuer Button „PDF generieren" + Entwurfs-Checkbox · `buildPdfInputFromWizardState()`-Helper · `pdfDownloadService.ts` mit Dynamic-Import (Lazy-Load + Test-DI) | +6 |
| 7 | **Abschluss + Final-Gate** | Diese Doku · Erweiterung `TEXTBAUSTEINE-UPDATE-GUIDE.md` · vollstaendige tsc + vitest gate | 0 |

**Σ Sprint:** +42 Tests · +6 Test-Files · 1392 → **1434 grün**.

## 3. Neue Dateien

### PDF-Pipeline
- `src/domain/jahresabschluss/pdf/CoverPageBuilder.ts` — Deckblatt.
  Signatur `buildCoverPage(input: CoverPageInput): Content[]`. Layout:
  oberer Drittel Titel + Stichtag + Canvas-Trennstrich; mittlerer
  Drittel Firma + HRB + Steuernummer; unterer Drittel Meta-Block links.
- `src/domain/jahresabschluss/pdf/TocBuilder.ts` — pdfmake-natives TOC
  (`{ toc: { id, title, textStyle, numberStyle } }`) +
  `buildStaticToc()` als Fallback fuer Debug/Test. Konstante
  `TOC_ID = "jahresabschluss-toc"`.
- `src/domain/jahresabschluss/pdf/Watermark.ts` — `buildWatermark(config)`
  mit dezentem #999-Grau, 0.2-Opacity, -45°-Winkel, 72pt bold.
- `src/domain/jahresabschluss/pdf/DocumentMergePipeline.ts` — Hauptfabrik
  `buildJahresabschlussDocument(input): TDocumentDefinitions`. Enthaelt
  `sectionHeading()`-Helper mit `tocItem` + `tocStyle` (pdfmake fuellt
  die TOC automatisch), `miniStandHinweis()` fuer Version-Tag pro
  Baustein, Header-Funktion ab Seite 3, Footer-Funktion mit
  "Stand ... HGB 2025", Entwurfs-Watermark-Integration.
- `src/domain/jahresabschluss/pdf/pdfDownloadService.ts` — Thin-Wrapper
  mit Lazy-Imports von `pdfmake/build/pdfmake` + `pdfmake/build/vfs_fonts`
  (Bundle-Size-Schutz). Signatur `(docDef, fileName) => Promise<void>`.
  Tests injizieren einen Mock ueber den `downloadImpl`-Prop in StepReview.

### Lagebericht-Bibliothek
- `src/domain/jahresabschluss/lageberichtTextbausteine.ts` — 4 Bausteine:
  - `LB_ID_289_1_WIRTSCHAFTSBERICHT` — § 289 Abs. 1 HGB.
  - `LB_ID_289_2_PROGNOSE_RISIKO` — § 289 Abs. 2 Nr. 1 HGB.
  - `LB_ID_289_3_NICHTFINANZIELLE_KPI` — § 289 Abs. 3 HGB (nur gross).
  - `LB_ID_289_4_IKS` — § 289 Abs. 4 HGB (nur kapitalmarktorientiert).
  - `getLageberichtFuer({rechtsform, groessenklasse, kapitalmarktorientiert})`:
    Einzel + Person → `[]`; Kapital klein/kleinst → `[]`; Kapital mittel
    → Abs. 1 + 2; Kapital gross → Abs. 1 + 2 + 3; + Abs. 4 bei
    `kapitalmarktorientiert: true`.

### UI-Integration
- `src/pages/jahresabschluss/StepReview.tsx` — grundlegend ueberarbeitet.
  Neuer Button „PDF generieren" (primary), Entwurfs-Checkbox, `generating`-
  Spinner-State, Dependency-Injection-Prop `downloadImpl` +
  `firmenname`. Public-API `buildPdfInputFromWizardState()` als
  Pure-Function fuer Tests.

### Tests (neu)
- `src/domain/jahresabschluss/pdf/__tests__/CoverPageBuilder.test.ts` —
  8 Tests (alle Felder, Entwurfsart, Einzelunternehmen ohne HRB,
  Kanzlei-Name-Optional, Trennstrich-Canvas).
- `src/domain/jahresabschluss/pdf/__tests__/TocBuilder.test.ts` —
  6 Tests (native TOC-Container, Fallback-Static-TOC, Level-1/2-
  Einrueckung, Seitenzahlen).
- `src/domain/jahresabschluss/__tests__/lageberichtTextbausteine.test.ts`
  — 8 Tests (4-Count, ID-Shape, Uniqueness, Filter pro Kombination,
  Einzel/Person/kleinklasse → leer).
- `src/domain/jahresabschluss/pdf/__tests__/DocumentMergePipeline.test.ts`
  — 11 Tests (Full-GmbH-Flow, Anhang/Lagebericht-Abschaltbar, Einzel-
  Minimal, Watermark bei Entwurf, Pagebreak, Header/Footer ab Seite 3,
  Anhang-Override, Stand-Hinweis, tocItem-Coverage).
- `src/domain/jahresabschluss/pdf/__tests__/Watermark.test.ts` —
  3 Tests (Default-Werte, Overrides, Vollkonfiguration).
- `src/pages/jahresabschluss/__tests__/StepReviewPdf.test.tsx` —
  6 Tests (Input-Builder, Entwurfs-Flag, incomplete-State-Null,
  Generate-Button-Flow, Entwurf-Dateiname, Download-Fehler-Toast).

### Dokumentation
- `docs/SPRINT-JAHRESABSCHLUSS-E3B-ABSCHLUSS.md` (diese Datei).
- `docs/TEXTBAUSTEINE-UPDATE-GUIDE.md` — erweitert um Abschnitt
  „Lagebericht-Bausteine (§ 289 HGB)".

## 4. Architektur-Entscheidungen

1. **DocumentMergePipeline als Pure-Function.** `buildJahresabschluss
   Document(input)` ist eine reine Funktion ohne Side-Effects — der
   eigentliche PDF-Download sitzt im separaten `pdfDownloadService`.
   Ermoeglicht Unit-Tests ohne Canvas/Download-Infrastruktur.
2. **pdfmake-natives TOC** statt manuellem Page-Counting. `tocItem: TOC_ID`
   auf jedem Section-Heading + ein `{ toc: ... }`-Container in der
   Seite 2. pdfmake sammelt Eintraege beim Render automatisch und
   fuellt Seitenzahlen zur Render-Zeit. Deutlich robuster als manuelle
   Seitenverwaltung.
3. **Dynamic-Import fuer pdfmake.** `pdfmake/build/pdfmake` ist ~1.6 MB
   minified. Via Lazy-Import laedt es erst beim ersten PDF-Aufruf, nicht
   im Einstiegsbundle.
4. **Entwurfs-Watermark als `docDefinition.watermark`.** pdfmake rendert
   den Text automatisch auf jeder Seite — keine seitenweise Wiederholung
   im Code noetig.
5. **`downloadImpl`-DI-Prop.** StepReview akzeptiert eine optionale
   Download-Implementierung. Produktion: Default `downloadJahresabschlussPdf`.
   Tests: Mock mit `vi.fn().mockResolvedValue(undefined)`. Das umgeht
   happy-dom's fehlende Canvas-Unterstuetzung sauber.
6. **`buildPdfInputFromWizardState()` als Public-Helper.** Trennt die
   Daten-Aufbereitung von der UI. Tests koennen Input validieren, ohne
   React mounten zu muessen.
7. **Bilanz/GuV/Anlagenspiegel als Platzhalter.** E3b liefert Template-
   Tabellen "[Aus XBuilder einfuegen]". Die vollstaendige Integration
   mit den existierenden Builder-Komponenten (`BalanceSheetBuilder`,
   `GuvBuilder`, Anlagenspiegel-Datenmodell) ist E4-Scope — sonst wuerde
   der Sprint zu gross.
8. **Header/Footer ab Seite 3.** Cover + TOC duerfen nicht mit
   „Seite 1 / N"-Header beklebt werden (optisch stoerend). Die
   header/footer-Funktionen geben `""` zurueck fuer `currentPage <= 2`.
9. **Section-Separator via Canvas-Line** statt `{ divider: true }`
   (pdfmake kennt kein nativem Divider). 0.5pt duenn, #bbb, ergibt einen
   dezenten visuellen Trenner zwischen Anhang-Bausteinen.
10. **`tableFromRows()`-Helper** aus der Pipeline selbst exportiert.
    MVP-Adapter fuer die Tests — der echte Bilanz-Builder wird in E4
    direkt `Content[]` liefern.

## 5. Grenzen + nicht-umgesetzt

1. **Kein XBRL-Export** — Scope E4.
2. **Kein PDF/A-3-Embedding** — Scope E4 (pdf-lib Embedder fuer XBRL).
3. **Kein Logo-Upload** — MVP-Scope-Protection (verschoben auf Folge-
   Sprint, dann gemeinsam mit PDF-Template-System).
4. **Anhang/Lagebericht-Texte sind Default-Templates** — der Wizard
   bietet in E3b keinen Editor-Step fuer Textbaustein-Individualisierung.
   Die Pipeline akzeptiert allerdings `anhangTexts` / `lageberichtTexts`
   als Override-Maps (API ist bereits da), nur die UI fehlt.
5. **Bilanz/GuV/Anlagenspiegel sind Platzhalter-Tabellen** — die
   Verdrahtung mit den echten Builder-Komponenten passiert in E4.
6. **Keine ELSTER-Transmission**.
7. **Keine Schema-Aenderung** — keine neuen Supabase-Migrations.
8. **Bescheinigung ist Standard-Text** — kein freies Textfeld fuer
   individuelle Kanzlei-Bescheinigungs-Wording.
9. **Nur eine Druckschrift (Roboto).** Arial/Helvetica-Austausch waere
   via Custom-Font-VFS nachruestbar, aber das braucht Font-Subsetting-
   Pipeline (verschoben).
10. **Keine Bookmarks/PDF-Outline** — pdfmake unterstuetzt `bookmark`
    pro Content-Node, aber das Wiring gegen die Section-Headings ist
    kein MVP-Requirement gewesen.

## 6. Final-Gate-Ergebnisse

- `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit` → **clean**.
- `npx vitest run` → **1434 / 1434 grün** (133 Test-Dateien, 0 Failures).
- Stderr-Output zur `happy-dom`-Script-Injection aus
  `CookieConsentContext` bleibt Begleitrauschen ohne Test-Failure.
- E3b-Tests isoliert: `npx vitest run src/domain/jahresabschluss/pdf
  src/domain/jahresabschluss/__tests__/lageberichtTextbausteine.test.ts
  src/pages/jahresabschluss/__tests__/StepReviewPdf.test.tsx` → **42 / 42
  grün**.

## 7. Was E4 morgen nutzen kann

- `buildJahresabschlussDocument` liefert ein `TDocumentDefinitions` —
  daraus kann E4 per `pdfMake.createPdf(...).getBuffer(cb)` einen
  Buffer erzeugen und via `pdf-lib` um XBRL-Attachments (AF-Dictionary)
  erweitern, um PDF/A-3 zu erreichen.
- `getAnhangFuer()` + `getLageberichtFuer()` liefern die Baustein-
  Metadaten, die in der XBRL-Taxonomie 6.9 entsprechend verlinkt
  werden muessen.
- `buildPdfInputFromWizardState()` + `pdfDownloadService` bleiben
  unveraendert — E4 klinkt sich nach `buildJahresabschlussDocument`
  ein und vor `downloadImpl`.

## 8. Offene / verschobene Punkte

- Bilanz/GuV/Anlagenspiegel echte Builder-Anbindung (E4 oder Folge-Sprint).
- Anhang/Lagebericht-Editor-Integration in den Wizard (neuer Step
  `anhang` zwischen `bausteine` und `review`). Bereits vorbereitet:
  `anhangTexts`/`lageberichtTexts`-Override-API in der Pipeline.
- Logo-Upload + DATEV-konforme Kanzlei-Kopfzeile.
- § 285 HGB Nr. 2-6, 8, 11-35 Textbausteine (Folge-Sprint).
- § 289a HGB Erklaerung zur Unternehmensfuehrung (Folge-Sprint).
- Konzernlagebericht § 315 HGB (Folge-Sprint).
- Arial/Helvetica als Alternative zu Roboto (Font-Subsetting).
- Persistenz der editierten Anhang/Lagebericht-Texte in Supabase
  (aktuell nur localStorage via wizardStore).

## 9. Keine neuen Open-Questions

`docs/OPEN-QUESTIONS-JAHRESABSCHLUSS-E3B-2026-04-23.md` wurde nicht
geschrieben — der Sprint lief ohne neue Unklarheiten. Die E1-Open-Question
zur Bank-Reconciliation-Persistenz bleibt unveraendert offen.
