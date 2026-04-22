# Sprint Smart-Warning-Banner (Entwurf-Erkennung + Simulation-Mode)

**Abgeschlossen:** 2026-04-21 · Autonomer Nacht-Lauf · 4 Schritte + Abschluss.
**End-Stand:** **1269 Tests grün / 106 Test-Dateien** · tsc clean.

Closes OPEN-QUESTIONS-NACHT-2026-04-21 Frage #2 (Entwurf-vs-Gebucht-Filterung in AnlageG) mit dokumentierter GoBD-konformer Lösung.

---

## 1. Ziel + Rechtsbasis

**Rechtliche Basis:**
- **GoBD Rz. 58-60** — Festschreibung vor Steuererklärung ist Pflicht.
- **§ 146 AO** — Unveränderbarkeit festgeschriebener Buchungen.

**Zielbild:**
- `status="gebucht"`-Filter bleibt **Hauptregel** (GoBD-Kern).
- UI-Banner signalisiert dem User, wenn Entwürfe im Zeitraum existieren, die die AnlageG/S betreffen würden.
- **Simulation-Mode** via Toggle erlaubt eine Vorschau-Rechnung inkl. Entwürfen, aber **PDF-Export ist dann deaktiviert** (Safety-Lock).
- Keine URL-Persistenz des Simulation-State — rein pro Session. Ein User-Refresh startet den Default-Modus (nur gebucht).

## 2. Schritt-Changelog

| # | Thema | Kern-Deliverables | Tests Δ |
|---|---|---|---|
| 1 | **Builder-Erweiterung** | `filterEntriesInYear(entries, wj, includeDraft = false)` · `AnlageGOptions/SOptions.includeDraft?: boolean` · `AnlageGReport/SReport.draftCount: number` | +5 |
| 2 | **TaxFormBuilder-Props** | `aboveForm?: ReactNode` + `disableExport?: boolean` | 0 |
| 3 | **`EntwurfWarningBanner`-Komponente** | Neue Komponente · 6 Tests · lokaler `localStorage`-Hint für JournalPage | +6 |
| 4 | **Page-Integration G + S** | `simMode`-State pro Session · `includeDraft`-Pass-Through · Banner + Export-Lock · je 2 neue Integration-Tests | +4 |
| 5 | **Abschluss + Full-Gate** | Dieses Dokument · OPEN-QUESTIONS geschlossen | 0 |

## 3. Bewusste Design-Entscheidungen

- **Default = `"gebucht"` bleibt** — GoBD-Kern. `includeDraft` ist additiv-optional, default `false`.
- **`draftCount` unabhängig vom Modus** — der Count zählt immer, auch im GoBD-Default-Modus, damit der Banner auch dann erscheint, wenn der User gerade keine Simulation laufen hat. Signal: „Du hast unfinalisierte Arbeit".
- **Simulation-Mode ist pro Session** — kein `localStorage`, keine URL-Query, kein Backend-State. Ein User-Refresh zwingt zurück zum GoBD-Default. Safety by default.
- **PDF-Export-Safety-Lock** — `disableExport` disabled den Button strukturell (HTML `disabled` + `title`-Tooltip „PDF-Export deaktiviert: Simulation-Modus aktiv"). Es gibt keinen Pfad, aus Simulations-Werten einen PDF-Export zu erzeugen. GoBD-Rz-58-60-konform.
- **`aboveForm` statt Portal/Children** — schlankste Integration in TaxFormBuilder. Anvendung nur durch AnlageG/S, keine Breaking Changes für bestehende 1-Liner (AnlageGPage/SPage explizit, andere TaxFormBuilder-Konsumenten unverändert — keine existieren heute außer G/S).
- **`localStorage`-Hint für JournalPage kooperativ** — der Banner-Link schreibt `harouda:journal:status-filter = "entwurf"`. JournalPage liest diesen Hint **nicht** in diesem Sprint (Spec explizit: keine Page-Änderung). Ein Folge-Sprint kann ihn nutzen, oder den Hint ignorieren.

## 4. Feld-Mapping / API-Contract

```ts
// Builder-Option (neu)
export type AnlageGOptions = {
  accounts: Account[];
  entries: JournalEntry[];
  wirtschaftsjahr: { von: string; bis: string };
  includeDraft?: boolean; // default false
};

// Report (neu: draftCount)
export type AnlageGReport = {
  summen: AnlageGSummen;
  positionen: AnlageGLineView[];
  unmappedAccounts: string[];
  draftCount: number; // unabhängig von includeDraft
};

// TaxFormBuilder (neu: aboveForm + disableExport)
export type TaxFormBuilderProps = {
  spec: FormSpec;
  glValues?: Record<string, number>;
  onDrillDown?: (...) => void;
  aboveForm?: ReactNode;
  disableExport?: boolean;
};

// Banner-Props
export type EntwurfWarningBannerProps = {
  draftCount: number;
  simulationMode: boolean;
  onToggleSimulation: () => void;
};
```

## 5. Test-Count-Trajectory

| Punkt | Tests | Δ | Files |
|---|---:|---:|---:|
| Pre-Sprint (Nacht-Modus-Ende) | 1254 | — | 105 |
| Schritt 1 (Builder) | 1259 | +5 | 105 |
| Schritt 2 (TaxFormBuilder) | 1259 | 0 | 105 |
| Schritt 3 (Banner) | 1265 | +6 | 106 |
| Schritt 4 (Pages) | 1269 | +4 | 106 |
| Schritt 5 (Abschluss) | **1269** | 0 | 106 |
| **Σ Sprint** | **+15** | | **+1** |

**Gesamt-Session-Trajectory:** `995 → 1269` (+274).

## 6. Deliverables

### Neue Dateien

- `src/components/EntwurfWarningBanner.tsx` (115 LOC)
- `src/components/__tests__/EntwurfWarningBanner.test.tsx` (6 Tests)
- `docs/SPRINT-SMART-BANNER-ENTWURF-ABSCHLUSS.md` (dieses Dokument)

### Geänderte Dateien

- `src/domain/est/anlagenUtils.ts` — `filterEntriesInYear` um `includeDraft` erweitert
- `src/domain/est/AnlageGBuilder.ts` — `includeDraft` + `draftCount`
- `src/domain/est/AnlageSBuilder.ts` — analog G
- `src/components/TaxFormBuilder.tsx` — `aboveForm` + `disableExport`
- `src/pages/AnlageGPage.tsx` — `simMode`-State + Banner + Export-Lock
- `src/pages/AnlageSPage.tsx` — analog G
- `src/domain/est/__tests__/AnlageGBuilder.test.ts` — 3 neue Tests
- `src/domain/est/__tests__/AnlageSBuilder.test.ts` — 2 neue Tests
- `src/pages/__tests__/AnlageGPage.integration.test.tsx` — 2 neue Tests
- `src/pages/__tests__/AnlageSPage.integration.test.tsx` — 2 neue Tests
- `docs/OPEN-QUESTIONS-NACHT-2026-04-21.md` — Frage #2 gelöst

## 7. Nicht geändert (per Spec)

- **JournalPage** — der Banner-Link schreibt `localStorage`-Hint, aber JournalPage konsumiert ihn nicht.
- **Andere Anlagen** (N, V, Kap, AV, Vorsorge, Mobilität, AgB) — unverändert.
- **Elster-Integration** — existiert für G/S nicht, kein Touch.
- **Migrations / Schema** — keine.

## 8. Offene Folgefragen

| Punkt | Begründung |
|---|---|
| **JournalPage konsumiert den `localStorage`-Filter-Hint** | Nice-to-Have. Wenn der User über den Banner-Link zum Journal wechselt, sollte die Page automatisch auf `status=entwurf` filtern. Eigener Mini-Sprint. |
| **URL-Query-Param-Konvention `/journal?status=entwurf`** | Alternative/Additiv zum localStorage-Hint. Ermöglicht Deep-Linking. |
| **Simulation-Mode-Banner auf anderen Anlagen** | Wenn weitere Anlagen journal-driven werden (z. B. AnlageV nach Objekt-Konvention), brauchen sie dasselbe Pattern. Komponente ist wiederverwendbar. |
| **Export-Warnung auch im PDF-Footer** | Nice-to-Have: wenn der User trotz Button-Disable z. B. per Browser-Druck exportiert, sollte ein Header/Footer "NICHT AMTLICH — SIMULATION" sichtbar sein. |

## 9. Sprint-Signatur

| Feld | Wert |
|---|---|
| **Datum** | 2026-04-21 |
| **Pre-Sprint-Count** | 1254 |
| **End-Test-Count** | **1269** (0 failed, 0 skipped) |
| **Δ** | +15 Tests, +1 File |
| **End-tsc-Status** | clean (Exit 0, 8192 MB) |
| **Schritt-Berichte** | integriert in diesem Dokument (kein separater Schritt-Bericht-Split) |
| **Abschluss-Doku** | `docs/SPRINT-SMART-BANNER-ENTWURF-ABSCHLUSS.md` (dieses Dokument) |
| **OPEN-QUESTIONS-Status** | Frage #2 GELÖST, Frage #1 GELÖST (User-Bestätigung) |
