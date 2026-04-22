# Sprint 17.5 — Erläuterungsbericht + BStBK-Bescheinigung (Quick-Win)

**Abgeschlossen:** 2026-04-27 · Autonomer Langlauf · 8 Schritte.
**End-Stand:** **1656 Tests grün / 164 Test-Dateien** · tsc clean.
**Scope:** Zwei letzte Jahresabschluss-Bausteine (Erläuterungsbericht
+ Bescheinigung), die dem DATEV-Style-Gesamt-Dokument fehlten.
Quick-Win nach Sprint 17.

---

## 1. Ziel + Rechtsbasis

**Ziel:** Den Jahresabschluss-Bericht um zwei bis dato fehlende
Komponenten ergänzen:
1. **Erläuterungsbericht** — freiwillig nach § 264 Abs. 2 Satz 2 HGB.
   Ein TipTap-Editor + 4 Click-to-Insert-Phrasen-Chips.
2. **Bescheinigung** — rechtlich normiert nach BStBK-Verlautbarung
   (Stand 2023). 3 Bescheinigungs-Typen, readonly Kerntext,
   Whitelist-Placeholder-Substitution, Readonly-Preview.

**Rechtliche Basis:**
- **§ 242 HGB** — Jahresabschluss-Pflicht.
- **§ 264 Abs. 2 Satz 2 HGB** — freiwillige Erläuterungen.
- **§ 57 StBerG** — Steuerberater-Pflichten.
- **BStBK-Verlautbarung "Hinweise zur Erstellung von
  Jahresabschlüssen"** (Stand 2023).

## 2. Schritt-Changelog

| # | Thema | Deliverables | Tests Δ |
|---|---|---|---|
| 1 | **Erläuterungs-Phrasen-Bibliothek** | `erlaeuterungsPhrasen.ts` mit 4 Phrasen (Umsatzentwicklung, Ergebnissituation, Besondere Ereignisse, Ausblick) · `Object.freeze` pro Phrase + Liste · `as const` · `getErlaeuterungsPhraseById` | +5 |
| 2 | **BStBK-Constants (SÄULE 1)** | `bstbk/bstbkBescheinigungen.ts` mit 3 `BescheinigungsTemplate`-Records · readonly via `Object.freeze` auf Root + jedem Template · `BSTBK_FOOTER_TEXT` als zentrale Konstante · `getBescheinigungsTemplate(typ)` typsicher | +6 |
| 3 | **Safe-Placeholder-Engine (SÄULE 2)** | `bstbk/bstbkPlaceholders.ts` mit 6er-Whitelist · `substitutePlaceholders(template, values)` → `{text, missing_values, unknown_placeholders_in_template}` · Control-Char-Filter · einmaliger Durchlauf (keine Rekursion) · `validatePlaceholderValues` · `BSTBK_PLACEHOLDER_LABELS` für UI | +11 |
| 4 | **BescheinigungBuilder** | `pdf/BescheinigungBuilder.ts` liefert `Content[]` für pdfmake (Titel zentriert fett, Kerntext justify, Spacer für Unterschrift, Hinweis-Text kursiv grau, optional Footer-Zeile mit BSTBK_FOOTER_TEXT) · `pageBreak: "before"` auf Titel | +6 |
| 5 | **Pipeline-Integration** | `DocumentMergePipeline`: neue Felder `erlaeuterungen_text?: JSONContent` + `bescheinigungInput?: BescheinigungInput` · Render-Reihenfolge: Cover → TOC → Bilanz → GuV → Anlagenspiegel → **Erläuterungen** → Anhang → Lagebericht → **Bescheinigung** · Backwards-Compat mit altem `bescheinigung: Content[]` | +7 |
| 6 | **StepErlaeuterungen + WizardState** | Neuer Step zwischen "Bausteine" und "Review" · EIN TipTap-Editor (nicht 5 separate) · 4 Phrasen-Chips mit Click-to-Insert · Wordcount · Checkbox "aktivieren" · Persistiert in `wizardState.data.erlaeuterungen` · Stepper-Def + Switch in WizardPage aktualisiert · StepBausteine advance auf "erlaeuterungen" | +5 |
| 7 | **StepBescheinigung (SÄULE 3+4)** | Neuer Last-Step nach "Review" · Dropdown 3 Typen · 4 editierbare Felder + 2 readonly-Info · Auto-Fill aus Client (once-only via useRef-Guard) · `<textarea disabled readOnly>`-Preview · Live-Update bei Input · Footer-Toggle · Haftungs-Banner rot · Save-Block bei fehlenden Pflichtfeldern · StepReview `buildPdfInputFromWizardState` liest erlaeuterungen + bescheinigung; advance auf "bescheinigung" | +7 |
| 8 | **Dokus + Final-Gate** | `BSTBK-BESCHEINIGUNG-UPDATE-GUIDE.md` · diese Abschluss-Doku · Serie-Addendum · tsc clean + vitest grün | 0 |

**Σ Sprint:** +47 Tests · +7 Test-Files · 1609 → **1656 grün**.

## 3. Neue / geänderte Dateien

### Domain-Layer (readonly Konstanten)
- `src/domain/jahresabschluss/erlaeuterungsPhrasen.ts` — 4 Phrasen,
  `Object.freeze` + `as const`.
- `src/domain/jahresabschluss/bstbk/bstbkBescheinigungen.ts` — 3
  Templates + `BSTBK_FOOTER_TEXT` + `getBescheinigungsTemplate`.
- `src/domain/jahresabschluss/bstbk/bstbkPlaceholders.ts` — Whitelist
  mit 6 Keys + `substitutePlaceholders` + `validatePlaceholderValues`
  + `BSTBK_PLACEHOLDER_LABELS`.

### PDF-Pipeline
- `src/domain/jahresabschluss/pdf/BescheinigungBuilder.ts` — liefert
  `Content[]` für pdfmake; Haftungs-Kommentar im File.
- `src/domain/jahresabschluss/pdf/DocumentMergePipeline.ts` — zwei neue
  Input-Felder + Erläuterungs-Section nach Anlagenspiegel + BStBK-
  Bescheinigung-Prio vor dem alten Legacy-Content-Pfad.

### UI / Wizard
- `src/pages/jahresabschluss/StepErlaeuterungen.tsx` — Free-Form-
  Editor + Phrasen-Chips + Wordcount.
- `src/pages/jahresabschluss/StepBescheinigung.tsx` — Readonly-
  Preview + Auto-Fill + Validator-Gate + Haftungs-Banner.
- `src/domain/jahresabschluss/WizardTypes.ts` — `WizardStep` erweitert
  um `"erlaeuterungen"` und `"bescheinigung"` · neue Data-Types
  `WizardErlaeuterungenData` + `WizardBescheinigungData`.
- `src/pages/JahresabschlussWizardPage.tsx` — Step-Definitionen auf 7
  Einträge erweitert + Switch-Cases für die zwei neuen Steps.
- `src/pages/jahresabschluss/StepBausteine.tsx` — `onAdvance("review")` →
  `onAdvance("erlaeuterungen")`.
- `src/pages/jahresabschluss/StepReview.tsx` — `buildPdfInputFromWizardState`
  liest `erlaeuterungen_text` + produziert `bescheinigungInput` via
  `sprint17_5BescheinigungInput`-Helper · `handleFinalize` advancet
  auf `"bescheinigung"`.

### Tests (neu)
- `src/domain/jahresabschluss/__tests__/erlaeuterungsPhrasen.test.ts` (+5).
- `src/domain/jahresabschluss/bstbk/__tests__/bstbkBescheinigungen.test.ts` (+6).
- `src/domain/jahresabschluss/bstbk/__tests__/bstbkPlaceholders.test.ts` (+11).
- `src/domain/jahresabschluss/pdf/__tests__/BescheinigungBuilder.test.ts` (+6).
- `src/domain/jahresabschluss/pdf/__tests__/DocumentMergePipelineSprint17_5.test.ts` (+7).
- `src/pages/jahresabschluss/__tests__/StepErlaeuterungen.test.tsx` (+5).
- `src/pages/jahresabschluss/__tests__/StepBescheinigung.test.tsx` (+7).

### Tests (modifiziert)
- `src/pages/jahresabschluss/__tests__/StepBausteine.test.tsx` — Assertion
  auf `"erlaeuterungen"` statt `"review"`.

### Dokumentation
- `docs/BSTBK-BESCHEINIGUNG-UPDATE-GUIDE.md` — Wartungs-Leitfaden für
  BStBK-Text-Updates mit Steuerberater-PR-Pflicht + jährlicher Review-
  Cycle + PR-Checkliste.
- `docs/SPRINT-17-5-ERLAEUTERUNG-BESCHEINIGUNG-ABSCHLUSS.md` (diese
  Datei).
- `docs/JAHRESABSCHLUSS-SERIE-GESAMT-ABSCHLUSS.md` — Addendum 2026-04-27
  (7/7 Komponenten komplett).

## 4. Architektur-Entscheidungen

1. **Object.freeze + `as const` + `readonly`-Felder.** Dreifache
   Schutzschicht gegen Mutation: TypeScript-Typen, Runtime-Freeze, und
   `as const` für Literal-Inferenz. Tests prüfen `Object.isFrozen`.
2. **Whitelist-Placeholder-Substitution statt Template-Literal-
   Interpolation.** Der `template.replace(regex, resolver)`-Flow
   akzeptiert nur vordefinierte Keys. Unbekannte `{{XYZ}}` bleiben
   als-is — das ist anti-Injection. Leere Werte bleiben ebenfalls
   als-is: `silent-fail` wäre schlimmer als sichtbares `{{VAR}}`.
3. **Control-Char-Filter nur auf Eingabe-Werten, nicht auf Template.**
   Der Template-Kerntext ist vertrauenswürdig (readonly Konstante).
   Nur die User-Inputs werden ge-"sanitized" — das schützt vor
   CRLF-Injection, Zeichensatz-Attacken, etc.
4. **Einmaliger Durchlauf (keine Rekursion).** Wenn ein User-Wert
   zufällig `{{Ort}}` enthält, wird das nicht als weitere
   Substitution interpretiert. Macht das Verhalten vorhersehbar.
5. **`<textarea disabled readOnly>`-DOM-Element** statt CSS-Trick.
   Der Browser selbst verhindert Eingabe — auch bei Keyboard-Fokus.
   Die Tests verifizieren beide Attribute.
6. **EIN TipTap-Editor + 4 Chips statt 5 separate Editoren.** User-
   Story-Vorgabe: Free-Form statt strukturiert. Chips sind
   Click-to-Insert-Phrasen als Paragraph am Ende des Dokuments.
7. **Auto-Fill mit Once-Only-Guard.** Ein `useRef<string | null>`
   verfolgt, ob für den aktuellen Client schon auto-gefüllt wurde.
   Ohne den Guard springt der Ort-Wert zurück auf `client.anschrift_ort`,
   sobald der User ihn leert.
8. **`sprint17_5BescheinigungInput`-Helper in StepReview.tsx.**
   Abstrahiert die Konvertierung `WizardState → DocumentMergePipeline-
   Input`. Datum wird beim Export auf heute gesetzt (nicht aus State
   gelesen) — das verhindert Date-Fraud wenn der User die Seite
   nachträglich öffnet.
9. **Backwards-Compat mit altem `bescheinigung: Content[]`.**
   `bescheinigungInput` hat Prio. Wenn beides gesetzt ist, gewinnt
   `bescheinigungInput`. Dokumentiert im Pipeline-Test #7.
10. **Haftungs-Banner in rot + explizite Warnung im Save-Toast.**
    "Bei Produktiv-Nutzung bitte Aktualität der BStBK-Texte durch
    Steuerberater prüfen lassen." — macht dem User bewusst, dass die
    App den Stand 2023 hält und nicht auto-aktualisiert wird.

## 5. Grenzen + bewusst verschoben

1. **Keine editierbaren Kerntexte in UI.** Hartes Design-Prinzip —
   Änderungen erfordern PR mit Steuerberater-Sign-off.
2. **Keine DB-Persistenz der Kerntexte.** Nur Code-Konstanten.
3. **Kein Digital-Signatur-Modul.** Unterschrift bleibt Platzhalter-
   Linie im PDF.
4. **Kein Stempel-Upload.** Keine Bild-Einbettung im Bescheinigungs-
   PDF.
5. **Keine BWA-Integration im Erläuterungsbericht.** Der Editor ist
   reiner Freitext — BWA-Kennzahlen müsste der User manuell eingeben
   oder aus einer anderen Seite kopieren.
6. **Keine Datum-Editierbarkeit.** Die Bescheinigung datiert immer
   „heute" beim PDF-Export. Verhindert Date-Fraud.
7. **Placeholder-Whitelist bleibt bei 6 Keys.** Erweiterung nur mit
   Code-Review + BStBK-Grund (siehe UPDATE-GUIDE §Placeholder-Whitelist).
8. **Keine Änderung an PDF/A-3-Pipeline.** Die Bescheinigung wird wie
   jede andere Section in das docDefinition eingebettet.
9. **`wizardState.bescheinigung.values.Datum`** wird NICHT aus dem
   Wizard-State gelesen — der Export-Pfad setzt ihn immer auf heute.
   Das ist eine vereinfachende Annahme; komplexe Nachdatierungs-Fälle
   (z. B. signatur-pflichtige PDFs nach Büroschluss) sind Folge-
   Sprint-Thema.

## 6. Final-Gate-Ergebnisse

- `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit` → **clean**.
- `npx vitest run` → **1656 / 1656 gruen** (164 Test-Dateien).
- Sprint-17.5-Tests isoliert: `npx vitest run
  src/domain/jahresabschluss/__tests__/erlaeuterungsPhrasen.test.ts
  src/domain/jahresabschluss/bstbk
  src/domain/jahresabschluss/pdf/__tests__/BescheinigungBuilder.test.ts
  src/domain/jahresabschluss/pdf/__tests__/DocumentMergePipelineSprint17_5.test.ts
  src/pages/jahresabschluss/__tests__/StepErlaeuterungen.test.tsx
  src/pages/jahresabschluss/__tests__/StepBescheinigung.test.tsx`
  → **47 / 47 grün**.
- Wizard-Regression: alle 44 Wizard-bezogenen Tests grün nach
  Reihenfolge-Änderung (`bausteine → erlaeuterungen → review →
  bescheinigung`).
- Stderr-Output aus `CookieConsentContext` bleibt Begleitrauschen.

## 7. Keine neuen Open-Questions

Der Sprint lief sauber ohne neue Unklarheiten. Die 4-Säulen-Vorgabe
der User-Story ist 1:1 umgesetzt:

1. ✅ Constants-File mit readonly BStBK-Texten (Object.freeze + `as const`).
2. ✅ Safe-Placeholders (Whitelist mit 6 Keys, Control-Char-Filter).
3. ✅ Readonly-Preview (`<textarea disabled readOnly>`).
4. ✅ Footer "Gemäß den Hinweisen der Bundessteuerberaterkammer …"
   als zentrale Konstante, optional per Checkbox.

## 8. Cross-Referenzen

- `docs/BSTBK-BESCHEINIGUNG-UPDATE-GUIDE.md` — jährlicher Wartungs-
  Cycle + PR-Checkliste.
- `docs/TEXTBAUSTEINE-UPDATE-GUIDE.md` — analoger Zyklus für Anhang/
  Lagebericht-Bausteine (Sprint E3a/E3b).
- `docs/JAHRESABSCHLUSS-SERIE-GESAMT-ABSCHLUSS.md` — Sprint-Serie-
  Übersicht mit Sprint-17.5-Addendum.
- `src/pages/JahresabschlussWizardPage.tsx` — orchestriert die 7
  Wizard-Schritte.

---

**Der Jahresabschluss-Wizard ist damit 7/7 Komponenten komplett:
Pre-Closing-Prüfung · Rechtsform · Größenklasse · Bausteine ·
Erläuterungen (neu) · Review · Bescheinigung (neu). Der DATEV-
Style-Bericht ist inhaltlich vollständig.**
