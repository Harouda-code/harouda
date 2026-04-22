# Sprint Arbeitsplatz-Tree-UI — Abschluss (3 Schritte)

**Abgeschlossen:** 2026-04-20 · Autonomer Nacht-Modus.
**End-Stand:** 1038 Tests grün / 71 Test-Dateien · tsc clean · Smoke + A11y verifiziert.

---

## 1. Ziel

Die rechte Spalte der `ArbeitsplatzPage` (Post-Login-Einstieg) zeigte
bisher **5 flache Launcher-Links** unter drei Kategorie-Überschriften
(Rechnungswesen, Steuern, Personalwirtschaft). Dieser Sprint baut die
Spalte zu einer **Baum-Struktur mit 5 Modulen** aus, jedes mit einem
Haupt-Link + einklappbaren Sub-Items.

## 2. UI-Prinzip „Hidden if missing"

Sub-Items werden **nur gerendert**, wenn die Ziel-Route existiert und
inhaltlich real ist (Status `VORHANDEN` oder `TEILWEISE` aus Schritt-1-
Bestandsaufnahme). Keine „disabled"-States, keine „Bald verfügbar"-
Platzhalter, keine ausgegrauten Einträge.

### Aus dem Tree **rausgefallen** (FEHLT im Projekt):

| Modul | Sub-Item | Status |
|---|---|---|
| Einkommensteuer | Steuerberechnung / Bescheidprüfung | FEHLT |
| Umsatzsteuer | Dauerfristverlängerung (eigener Workflow) | TEILWEISE — als Toggle in UstvaPage integriert, daher nicht als Sub-Item |
| Umsatzsteuer | Umsatzsteuererklärung (Jahres-UStE) | FEHLT |
| Umsatzsteuer | Umsatzsteuerverprobung | FEHLT |
| Lohn | Beitragsnachweise (Krankenkassen) | FEHLT |
| Lohn | DEÜV-Meldungen / Sofortmeldungen | FEHLT — CLAUDE.md §7 explizit „nicht produktionsreif" |
| Lohn | Fehlzeiten / eAU-Abruf | FEHLT |
| Lohn | Buchungsbeleg-Übergabe Lohn → FIBU | FEHLT — PayrollRun + Lohn haben keinen `createEntry`-Call; `Lohnbuchung`-Typ nur für PDF-Archiv |

Anlagen 2.3 („Zugänge / Abgänge") ist **bewusst ohne „Umbuchungen"** im
Label gerendert, weil Umbuchungen im AnlagenVerzeichnisPage nicht
existieren (TEILWEISE-Fix: Label verkürzt).

## 3. Accordion-Pattern — Herkunft

Das Accordion-Muster ist ein **Inline-Nachbau** aus
`components/AppShell.tsx:235-253, 303-379`:

- `GROUPS[]`-Array → hier `TREE_MODULES[]` (5 Module).
- `expanded: Record<string, boolean>`-State → identisches Muster.
- `toggleGroup(id)` → hier `toggleModule(id)`.
- `ChevronDown` (expanded) / `ChevronRight` (collapsed) → identische
  lucide-react-Icons.
- `localStorage`-Persistenz via `EXPAND_STORAGE_KEY` → hier eigener
  Key `harouda:arbeitsplatz-tree-expanded` (nicht geteilt mit dem
  AppShell-Nav-Key `harouda:nav-expanded`, siehe §5).

**Tech-Debt-Notiz:** Der Arbeitsplatz-Tree und die AppShell-Sidebar-
Nav nutzen das identische Accordion-Muster, implementieren es aber
beide inline. Eine Extraktion in einen gemeinsamen
`<Accordion>`/`useAccordion`-Baustein ist P3 — kein Blocker, aber
ein legitimer Cleanup-Kandidat, sobald eine dritte Stelle das
Muster braucht.

## 4. Visueller Polish-Pass (Schritt 3)

- **Sublist-Indent auf AppShell-Muster angeglichen:**
  `margin: 2px 0 6px 18px; padding: 0 0 0 8px` (vorher 14px + 24px);
  Sub-Link-Padding `6px 10px 6px 16px` (vorher `6px 10px`) — damit
  fluchten Sub-Text-Positionen (18+8+16 = 42px) dicht unter dem
  Modul-Text (ca. 38px), sichtbare 4px-Hierarchie-Stufe statt
  übertrieben tiefem Einzug.
- **Chevron-Tap-Target gesichert:** `min-height: 32px` explizit auf
  `.arbeitsplatz__tree-chevron-btn` (vorher ergab sich die Höhe nur
  über flex `align-items: stretch`). Touch-konform auch auf Desktop.
- **Vertikale Hierarchie-Linie** (`border-left: 1px solid var(--border)`)
  auf der Sublist erhalten — dient als visuelle Klammer für die
  Sub-Items.
- **Hover-Konvention:** Modul-Header, Chevron-Button und Sub-Link
  nutzen **alle den gleichen `var(--ivory-100)`-Tint**. Die visuelle
  Hierarchie zwischen Haupt-Link und Sub-Link entsteht über
  `font-weight` (600 vs. 400) und die Sublist-Einrückung — nicht
  über abgestufte Hover-Farben. Das deckt sich mit AppShell-Sidebar
  (dort ebenfalls annähernd identische Hover-Level zwischen
  group-head und nav-item: `rgba(255,255,255,0.04)` vs. `0.05`).
- **Modul-Gap** bleibt bei `gap: 4px` auf `.arbeitsplatz__tree`,
  identisch zu AppShell-`.shell__nav { gap: 4px }`.

## 5. localStorage

- **Key:** `harouda:arbeitsplatz-tree-expanded` — eigener Scope,
  **nicht geteilt** mit dem AppShell-Nav-Key `harouda:nav-expanded`
  (damit beide Akkordeons unabhängig kollabierbar bleiben).
- **Format:** `Record<string, boolean>`, z. B.
  `{"rechnungswesen": true, "einkommensteuer": false}`.
- **Default-Verhalten:** fehlender Key → alle 5 Module expanded.
  `JSON.parse`-Fehler + Write-Fehler werden im `try/catch`
  geschluckt (best-effort).

## 6. Accessibility

- `aria-expanded={true|false}` auf dem Chevron-Button spiegelt den
  tatsächlichen State (per Test abgedeckt).
- `aria-controls="arbeitsplatz-tree-sublist-<id>"` verknüpft
  Chevron mit der Sublist-id.
- `aria-label="<Modul-Name> einklappen|ausklappen"` liefert Screen-
  Readern eine kontextbezogene Beschreibung.
- Modul-Header (Haupt-Link) und Chevron sind **separate
  fokussierbare Elemente** — die Tab-Reihenfolge innerhalb eines
  Moduls ist deterministisch: Haupt-Link → Chevron-Toggle →
  Sub-Links (per Test abgedeckt).
- Fokus-Indikator durchgängig über `var(--gold)` als
  `outline: 2px solid` mit `outline-offset: 2px`.

## 7. Scrollbar-Verhalten rechte Spalte — Ist-Zustand

Die rechte Spalte scrollt derzeit **als Gesamt-Einheit**. Weder der
`.arbeitsplatz__mandant-card` (Mandant-Header-Kachel) noch die
einzelnen `.arbeitsplatz__tree-module`-Header sind `position: sticky`.
Bei Überlauf (langer Tree) verschiebt sich also auch die Mandant-Card
mit nach oben aus dem Sichtbereich.

**Nicht in diesem Sprint geändert** (spec-konform: „aktueller Zustand
dokumentieren, nicht ändern, außer offensichtlich defekt") — die
aktuelle Modul-/Sub-Item-Zahl (5 Module, max 8 Sub-Items in
Einkommensteuer) füllt 30 %-Spalte auf üblichen Desktop-Höhen ≥ 800 px
nicht vollständig aus. Erst wenn künftige FEHLT-Sub-Items gebaut und
eingefügt werden (siehe §9), könnte ein `position: sticky` auf
Mandant-Card lohnen.

## 8. Test-Count-Trajectory

| Schritt | Test-Dateien | Tests | Δ |
|---|---:|---:|---:|
| Baseline (vor Tree-Sprint) | 71 | 1030 | — |
| Schritt 1 (Ist-Aufnahme) | 71 | 1030 | 0 |
| Schritt 2 (Tree-Struktur + 6 neue Tests) | 71 | 1036 | +6 |
| **Schritt 3 (Polish + A11y + Smoke-Erweiterung)** | **71** | **1038** | **+2** |

**Netto Tree-Sprint:** +8 Tests, +1 Doku-Datei. Die Smoke-Datei
`ArbeitsplatzPage.smoke.test.tsx` hat den bestehenden Musterfirma-Flow
um 4 zusätzliche Assertions pro bestehendem `it` erweitert (Default-
Expanded, Sub-Link-href + 2 Negativ-Assertions) — **ohne** neuen
`it`-Block, deswegen Test-Count-Zuwachs in dieser Datei nur via die
beiden neuen A11y-Tests in `ArbeitsplatzPage.test.tsx` (28 → 30).

## 9. Offene Folge-Sprints

### FEHLT-Sub-Items-Kandidaten (7 Stück — Sprint-Pool)

Jede dieser Lücken ist ein legitimer Folge-Sprint-Kandidat. Sobald
eine Page gebaut ist, wandert das Sub-Item in den Tree:

1. **Steuerberechnung / Bescheidprüfung** (ESt) — keine Verprobung
   gegen Finanzamtsbescheid heute.
2. **Umsatzsteuererklärung (Jahres-UStE)** — nur UStVA + ZM vorhanden,
   keine Jahreserklärung.
3. **Umsatzsteuerverprobung** — kein Tool, das UStVA-Summen gegen
   GuV-Umsatzerlöse abgleicht.
4. **Beitragsnachweise (Krankenkassen)** — keine Stammdaten-Pflege
   + Nachweisgenerierung.
5. **DEÜV-Meldungen / Sofortmeldungen** — CLAUDE.md §7 explizit als
   „nicht produktionsreif" gelistet.
6. **Fehlzeiten / eAU-Abruf** — keine Krankschreibungs-Integration
   (GKV-ITSG-Schnittstelle).
7. **Lohn → FIBU-Buchungsbeleg-Übergabe** — der kritische Datenfluss-
   Gap: Lohnruns erzeugen heute **keine** Journal-Einträge, nur PDF-
   Archiv. Siehe Schritt-1-Bestandsaufnahme Teil 2 A.

### Datenfluss-Sprints (aus Right-Column-Analyse Schritt 1)

- **B1:** Lohn → FIBU-Buchungsstapel (deckungsgleich mit Punkt 7
  oben).
- **B2:** UStE (Jahreserklärung) als Journal-Aggregat (deckungsgleich
  mit Punkt 2).
- **B3:** ESt-Steuerberechnung als Aggregat über EÜR + Anlagen
  (deckungsgleich mit Punkt 1).
- **B4:** Domain-Event-System / Event-Bus (aktuell: keines — Module
  sind direkt über API-Funktionen gekoppelt, Tanstack-Query-
  `invalidateQueries` ist der einzige Cross-Module-Sync).

### Tech-Debt (P3)

- **Shared-Accordion-Extraktion:** AppShell-Sidebar + Arbeitsplatz-
  Tree implementieren dasselbe Muster inline (`expanded`-State +
  `toggleModule` + localStorage). Extraktion lohnt sich, sobald
  eine dritte Stelle das Muster braucht.
- **`position: sticky`** auf Mandant-Card, falls die rechte Spalte
  nach künftigen Erweiterungen über die Viewport-Höhe hinauswächst
  (siehe §7).

## 10. Verifikations-Gate am Sprint-Ende

```bash
cd D:/harouda-app
NODE_OPTIONS=--max-old-space-size=4096 npx tsc --noEmit   # clean (Exit 0)
npx vitest run                                             # 1038 / 72 grün
```

## 11. Kernspuren im Code

- `src/pages/ArbeitsplatzPage.tsx` — `TREE_MODULES[]` + `LauncherActive`
  mit Accordion-State + Persistenz
- `src/pages/ArbeitsplatzPage.css` — `.arbeitsplatz__tree*`-BEM-Blöcke,
  AppShell-Indent-Muster, `min-height: 32px` Chevron
- `src/pages/__tests__/ArbeitsplatzPage.test.tsx` — 8 Tree-spezifische
  Tests (6 aus Schritt 2 + 2 A11y aus Schritt 3)
- `src/pages/__tests__/ArbeitsplatzPage.smoke.test.tsx` — End-to-End-
  Kühn-Flow inkl. Tree-Default-Expanded + Sub-Link-href + Negativ-
  Assertion auf FEHLT-Labels
- `docs/SPRINT-ARBEITSPLATZ-TREE-ABSCHLUSS.md` (dieses Dokument)
