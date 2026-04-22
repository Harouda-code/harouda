# Sprint Jahresabschluss-E3a — Foundation + Editor + Converter + HGB-Textbausteine

**Abgeschlossen:** 2026-04-23 · Autonomer Langlauf · 6 Schritte.
**End-Stand:** **1392 Tests grün / 127 Test-Dateien** · tsc clean.
**Scope:** E3a von mindestens 2 PDF-Bausteinen des Jahresabschluss-Sprints
(heute Foundation · morgen E3b Document-Merge + Cover + TOC +
Final-PDF-Export + Lagebericht).

---

## 1. Ziel + Rechtsbasis

**Ziel:** Rich-Text-Editor + Mapping-Layer + eine konservative
HGB-Textbaustein-Bibliothek als Fundament für die PDF-Generation
des Jahresabschlusses. E3a liefert bewusst KEIN Final-PDF — das ist
Scope E3b.

**Rechtliche Basis:**
- **§§ 284-288 HGB** — Anhang-Pflichtangaben (Teil-Abdeckung über 6
  MVP-Bausteine).
- **§ 264 Abs. 1 HGB** — Jahresabschluss-Pflicht Kapitalgesellschaft.
- **§ 267 Abs. 5 HGB** — Durchschnittsberechnung Arbeitnehmer (zitiert
  in § 285-7-Baustein).
- **§ 286 Abs. 4 HGB** — Schutzklausel für § 285-Nr. 9 (zitiert im
  Organbezüge-Baustein).
- **GoBD Rz. 58/60** — Selectable-Text-Anforderung für PDF-Archive
  (pdfmake liefert Vector-Text, nicht Raster → Compliance-konform).

**Zielgruppe:** Kapitalgesellschaften (GmbH / AG / UG / SE) — E3a
liefert keine Personen-/Einzelunternehmen-Bausteine; deren Pflichten
sind enger und werden bei Bedarf in einem späteren Sprint aufgebaut.

## 2. Schritt-Changelog

| # | Thema | Deliverables | Tests Δ |
|---|---|---|---|
| 1 | **Package-Install + tsc-Smoke** | `@tiptap/react` 3.22.4 + StarterKit + Tables + Underline · `pdfmake` 0.3.7 · `@types/pdfmake` 0.3.2 · alle stabile Releases, keine Pre-Releases | 0 |
| 2 | **TipTapEditor-Komponente** | `src/components/jahresabschluss/TipTapEditor.tsx` · Toolbar mit 6 Buttons (Bold/Italic/Underline/Bullet/Ordered/Table) · Min 300 / Max 600 px · A11y `role="textbox"` + `aria-multiline` | +6 |
| 3 | **Mapping-Layer (TipTap → pdfmake)** | `src/domain/jahresabschluss/tiptapToPdfmake.ts` · defensive Fallback bei unbekannten Node-Types · Marks bold/italics/decoration · Heading-Margins H1-H3 · Table mit "auto"-Widths · leere Table-Rows mit Console-Warn übersprungen | +12 |
| 4 | **Anhang-Textbaustein-Bibliothek** | `src/domain/jahresabschluss/anhangTextbausteine.ts` · 6 Bausteine mit Version-Tag + §-Verweis + JSON-Templates · `getBausteineFuer()`-Filter · `TextbausteinDisclaimer.tsx` Warnbanner · `docs/TEXTBAUSTEINE-UPDATE-GUIDE.md` Wartungsleitfaden | +8 |
| 5 | **Integration-Smoke Editor → Converter** | `editorToPdf.smoke.test.tsx` · E2E-Verifikation Template-JSON → pdfmake-Content pro Baustein | +3 |
| 6 | **Abschluss + Final-Gate** | Diese Doku · tsc clean · vitest grün | 0 |

**Σ Sprint:** +29 Tests · +5 Test-Files · 1363 → **1392 grün**.

## 3. Neue Dateien

### Dependencies (package.json)
- `@tiptap/react` ^3.22.4 · `@tiptap/pm` · `@tiptap/starter-kit`
- `@tiptap/extension-table` · `-table-row` · `-table-cell` ·
  `-table-header` · `@tiptap/extension-underline`
- `pdfmake` ^0.3.7 · `@types/pdfmake` ^0.3.2 (devDep)

### Components
- `src/components/jahresabschluss/TipTapEditor.tsx` — Headless-Editor
  mit statischer Toolbar, schwarz/weiss, kein Color-Picker, kein
  Image-Upload. Toolbar-Buttons senden TipTap-Chain-Commands. Props:
  `content`, `onChange`, `readOnly`, `placeholder`. `immediatelyRender:
  false` für happy-dom-Kompatibilität.
- `src/components/jahresabschluss/TextbausteinDisclaimer.tsx` — gelber
  Warnbanner mit Scale-Icon. Props `versionStand` + `paragraphVerweis`.
  Wird in E3b über jedem Editor-Render geschichtet.

### Domain-Layer
- `src/domain/jahresabschluss/tiptapToPdfmake.ts` — Mapping-Layer.
  Rekursive `mapChildren`/`mapNode`-Implementierung. Defensiv: leere
  Doc → `[]`, unbekannter Node-Type → Console-Warn + Plain-Text-
  Fallback. Marks: `bold` → `bold: true` · `italic` → `italics: true`
  · `underline` → `decoration: "underline"`.
- `src/domain/jahresabschluss/anhangTextbausteine.ts` — 6 MVP-Bausteine:
  - `TB_ID_284_METHODEN` — § 284 HGB Bilanzierungsmethoden.
  - `TB_ID_285_1_LANGFRISTIGE_VERB` — § 285 Nr. 1 mit Tabelle.
  - `TB_ID_285_7_ARBEITNEHMER` — § 285 Nr. 7 Arbeitnehmer-Durchschnitt.
  - `TB_ID_285_9_ORGANBEZUEGE` — § 285 Nr. 9 + § 286 Abs. 4 Schutzklausel.
  - `TB_ID_285_10_ORGANE` — § 285 Nr. 10 GF-Namen.
  - `TB_ID_287_NACHTRAG` — § 285 Nr. 33 Nachtragsbericht (mit
    konservativer §-Referenz-Notiz im Code-Kommentar).
  - `getBausteineFuer({rechtsform, groessenklasse})`-Helper filtert
    nach Anwendungsbereich und Rechtsform-Scope.

### Tests (neu)
- `src/components/jahresabschluss/__tests__/TipTapEditor.test.tsx` —
  6 Tests (Mount, Toolbar-Präsenz, readOnly-Disable, Insert-Table,
  Bold-Toggle, null-Content-Init).
- `src/domain/jahresabschluss/__tests__/tiptapToPdfmake.test.ts` —
  12 Tests (Paragraph, Marks, Bold+Italic-Kombi, H1-H3, Bullet, Ordered,
  Table, Nested-List, Unknown-Node-Warn, Empty-Doc, Leere-Table-Row,
  HardBreak).
- `src/domain/jahresabschluss/__tests__/anhangTextbausteine.test.ts` —
  8 Tests (6-Bausteine-Count, Feld-Shape, ID-Uniqueness, Template-
  doc-Validität, Filter klein/mittel/Einzel/Person).
- `src/domain/jahresabschluss/__tests__/editorToPdf.smoke.test.tsx` —
  3 Tests (§ 284 → Heading+Paragraph, § 285 Nr. 1 → Table-Struktur, alle
  6 Bausteine → non-empty pdfmake-Output).

### Dokumentation
- `docs/TEXTBAUSTEINE-UPDATE-GUIDE.md` — Wartungsleitfaden:
  Baustein-Struktur erklärt, Prozess zum Hinzufügen/Ändern,
  Review-Zyklus (mind. jährlich zum Jahreswechsel), Pull-Request-
  Checkliste, Kontakte.

## 4. Architektur-Entscheidungen

1. **TipTap statt Lexical / Quill.** Headless, React-native, ProseMirror-
   Backend. Gute TypeScript-Typen, aktive Maintenance, JSON-Schema
   serialisierbar (passt zu localStorage-Persistenz aus E2).
2. **pdfmake statt jsPDF / html2pdf.** Selectable-Vector-Text nach GoBD
   Rz. 58 gefordert. Deklarative JSON-Definition passt 1:1 zum Mapping-
   Output. jsPDF ist bereits für andere PDF-Artefakte (Bilanz-Reports)
   im Repo — pdfmake parallel ist akzeptabel, weil der Scope sich nicht
   überschneidet (pdfmake nur für Jahresabschluss-Dokumente, jsPDF für
   Report-Kacheln).
3. **Mapping-Layer als eigenes Modul statt Editor-interner Export.**
   Erlaubt E3b, den Converter als Pure-Function in der Document-Merge-
   Routine einzusetzen, ohne den Editor zu mounten. Trennt UI von
   Datentransformation sauber.
4. **6 Bausteine als MVP statt kompletter § 285-Katalog.** Scope-
   Honesty (Prompt-Regel). Die Bibliothek muss perfekt gewartet sein,
   bevor sie wächst — sonst ist eine veraltete Vorlage schlimmer als
   gar keine (Haftung für Kanzlei).
5. **Disclaimer als separate Komponente statt Editor-interner
   Wrapper.** E3b kann die Komponente über jedem Editor-Render
   schichten; falls die Wording-Anforderung in einem Folge-Sprint
   ändert, greift die Änderung zentral.
6. **Defensive Fallbacks im Mapping.** Unbekannte Node-Types erzeugen
   `console.warn` + Plain-Text. Grund: User könnte ein altes TipTap-
   Schema in localStorage haben; das darf den PDF-Export nicht
   komplett brechen.
7. **`immediatelyRender: false` im `useEditor()`-Call.** TipTap 3
   würde sonst in SSR oder happy-dom beim ersten Render Probleme
   machen. Erzeugt einen kurzen Loading-State im Client — akzeptabel.
8. **Versions-Pin bewusst nicht gesetzt.** alle installierten
   TipTap-Packages auf `^3.22.4` — stabile Release-Linie, keine
   Pre-Releases. Upgrade-Pfad offen für Breaking-Change-Cycles.

## 5. Grenzen + nicht-umgesetzt

1. **Kein Document-Merge** — mehrere Editor-Outputs → ein Dokument ist
   Scope E3b.
2. **Kein Cover / TOC / Watermark** — Scope E3b.
3. **Kein Final-PDF-Export** — Scope E3b (`pdfMake.createPdf(...)`).
4. **Kein PDF/A-3** — Scope E4 (pdf-lib-Embedder für XBRL).
5. **Kein XBRL-Touch** — Scope E4.
6. **Kein Lagebericht-Baustein (§ 289 HGB)** — Scope E3b.
7. **§ 285 HGB-Nummern 2-6, 8, 11-35** — bewusst nicht im MVP. Code
   ist strukturell offen (neue Einträge ins Array + Test erweitern).
8. **Keine Personengesellschaft-/Einzelunternehmen-Bausteine** — alle
   6 MVP-Templates sind Kapitalgesellschafts-scoped. Filter liefert
   für `Einzel` leere Liste, für `Personengesellschaft` heute leer
   (keine Kapital-only-Bausteine matchen); ein späterer Sprint
   ergänzt ggf. spezifische OHG/GbR-Bausteine.
9. **Kein Auto-Fill aus Wizard-Daten** — im Editor steht `[ZAHL
   EINSETZEN]`. E3b fügt den Auto-Fill-Hook (z. B. GF-Liste aus
   WizardState → § 285 Nr. 10 Template).
10. **Keine Wizard-Integration** — Editor ist in diesem Sprint
    Standalone-Komponente. E3b verdrahtet sie mit einem neuen
    Wizard-Step (vermutlich StepAnhang).
11. **Image-Upload, Color-Picker, Font-Family-Switch bewusst nicht
    implementiert.** Druckqualität in Schwarz-Weiss ist GoBD-
    kompatibler und reduziert die PDF-Grösse signifikant.
12. **Keine Real-Time-Validation im Editor.** Platzhalter-Texte
    `[…]` werden nicht hervorgehoben; die PDF-Generation warnt
    erst in E3b.

## 6. Final-Gate-Ergebnisse

- `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit` → **clean**.
- `npx vitest run` → **1392 / 1392 grün** (127 Test-Dateien).
- Die frühere `journalStorno.test.ts`-Flake vom E2-Ende war in diesem
  Run grün. Stderr-Output zur `happy-dom`-Script-Injection aus
  `CookieConsentContext` ist Begleitrauschen, kein Failure.
- E3a-Tests isoliert (`npx vitest run src/components/jahresabschluss
  src/domain/jahresabschluss/__tests__/tiptapToPdfmake.test.ts
  src/domain/jahresabschluss/__tests__/anhangTextbausteine.test.ts
  src/domain/jahresabschluss/__tests__/editorToPdf.smoke.test.tsx`) →
  29 / 29 grün.

## 7. Was E3b morgen nutzen wird

- `TipTapEditor` als Rich-Text-Eingabe für einen neuen **StepAnhang**
  (nach StepBausteine, vor StepReview). Pro ausgewähltem Baustein:
  Disclaimer + Editor + Save-in-WizardState.
- `tiptapToPdfmake` als Input-Pipeline für den **Document-Merge**.
  Reihenfolge der Bausteine folgt der `ANHANG_TEXTBAUSTEINE`-Array-
  Reihenfolge (stabil durch ID-Konstanten).
- `getBausteineFuer()` als Auto-Vorauswahl im StepAnhang — default-
  gefüllt mit den für die konkrete Rechtsform + Klasse passenden
  Bausteinen.
- `ANHANG_TEXTBAUSTEINE` als Quelle der Default-Templates.
- `TextbausteinDisclaimer` wird über jeden Editor geschichtet.

## 8. Offene / verschobene Punkte

- § 285 HGB Nr. 2-6, 8, 11-35 als Folge-Sprint-Kandidaten.
- § 289 HGB Lagebericht-Bausteine (Scope E3b).
- Personengesellschaft-spezifische Anhang-Bausteine (eng beschränkt
  nach § 264a HGB); separater Sprint.
- Jährlicher Review-Zyklus für alle Bausteine zum Jahreswechsel —
  siehe `docs/TEXTBAUSTEINE-UPDATE-GUIDE.md`.
- Auto-Fill aus Wizard-Daten (GF-Liste, Arbeitnehmer-Zahl) — E3b.

## 9. Keine neuen Open-Questions

Es wurde kein `docs/OPEN-QUESTIONS-JAHRESABSCHLUSS-E3A-2026-04-23.md`
geschrieben, weil der Sprint ohne Unklarheiten durchlief. Die
vorhandenen Open-Questions aus E1 (Bank-Reconciliation-Persistenz)
bleiben weiterhin gültig und sind nicht durch E3a berührt.
