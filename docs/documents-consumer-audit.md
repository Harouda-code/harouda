# Documents-API · Konsumenten-Audit

**Stand:** 02.05.2026
**Branch:** `chore/documents-consumer-audit`
**Bezug:** PR 2 (`feat/documents-async-api`), Charge 8.5
**Basis-Commit:** `main` @ `9e2ed42`

---

## 1 — Ziel

Vollstaendige Erfassung aller Konsumenten der Documents-API als Bruecke zwischen:

- **PR 2** (`feat/documents-async-api`) — Cloud-API ist live, Feature-Flag `VITE_USE_SUPABASE_STORAGE` ist OFF.
- **PR 4..N** — Konsumenten-Refactor.
- **PR N+1** (`feat/documents-storage-go-live`) — Cutover des Feature-Flags.

Dieses Dokument liefert die Datengrundlage fuer die Planung der Folge-PRs. Es enthaelt **keine Code-Aenderungen**.

---

## 2 — Methodik

Der Audit basiert auf reproduzierbaren `Select-String`-Suchen ueber `src/`, gefolgt von Quellcode-Analyse jedes Treffers.

### 2.1 — Sucheinstieg: alle Importe

```powershell
Get-ChildItem -Path src -Recurse -Include *.ts,*.tsx,*.js,*.jsx |
  Select-String -Pattern 'from ["''].*api/documents["'']'
```

**Hinweis zur Methodik:** Das Pattern `api/documents` erfasst keine Importe aus `src/api/__tests__/` (diese verwenden relative Pfade ohne `api/`-Praefix, z. B. `from "../documents"` oder `from "../documentsCloud"`). Eine zweite Suche mit dem Pattern `from ["'].*documents(Cloud)?["']` auf `*.test.ts(x)` wurde ergaenzend ausgefuehrt (siehe Anhang Abschnitt 10, Befehl 5), um Test-Konsumenten vollstaendig zu erfassen. Diese Doppelsuche ist fester Bestandteil der Methodik und sollte bei kuenftigen Audits dieser API beibehalten werden.

### 2.2 — Funktionsspezifische Suchen

Pro exportierter Funktion aus `src/api/documents.ts` wurde eine separate `Select-String`-Suche durchgefuehrt. Vollstaendige Liste der Befehle: siehe Anhang (Abschnitt 10).

### 2.3 — Klassifikation

Jeder Aufruf wurde im Quellkontext gelesen und nach folgenden Kriterien klassifiziert:

- Synchron oder asynchron?
- Innerhalb von JSX direkt aufgerufen?
- Eingebettet in `useMutation` / `useQuery` / `try/catch`?
- Verhalten im Cloud-Modus (Flag ON)?

---

## 3 — Konsumenten-Uebersicht

### 3.1 — Produktive Konsumenten

| Datei | Funktion(en) | Aufrufe | Hoechstes Risiko |
|-------|--------------|---------|------------------|
| `src/components/DocumentPreview.tsx` | `getDocumentUrl`, `formatFileSize` | 2 | **KRITISCH** |
| `src/pages/DocumentsPage.tsx` | `fetchDocuments`, `uploadDocument`, `updateDocumentOcr` (×2), `downloadDocumentAsFile`, `formatFileSize` (×2) | 7 | **HOCH** |
| `src/pages/InventurPage.tsx` | `uploadDocument` | 1 | MITTEL |
| `src/pages/DatenExportPage.tsx` | `fetchDocuments` | 1 | MITTEL |
| `src/pages/RetentionPage.tsx` | `fetchDocuments` | 1 | MITTEL |
| `src/pages/VerfahrensdokuPage.tsx` | `fetchDocuments` | 1 | MITTEL |

### 3.2 — Test-Konsumenten

| Datei | Funktion(en) | Anmerkung |
|-------|--------------|-----------|
| `src/__tests__/multitenancy-cross-module.smoke.test.tsx` | `fetchDocuments`, `uploadDocument` | Importiert aus `../api/documents` (oeffentliche API). Kein Refactor-Ziel — Tests werden nach API-Aenderung angepasst. |
| `src/api/__tests__/documentsCloud.test.ts` | mehrere Cloud-Funktionen | Bereits in PR 2 etabliert. **Importiert aus `../documentsCloud` direkt — nicht aus der oeffentlichen `documents`-API.** Unit-Test der Cloud-Implementierung, kein API-Konsument im engeren Sinne. Kein Refactor-Ziel. |
| `src/api/__tests__/gelb-gruppe.mandant.test.ts` | `fetchDocuments`, `uploadDocument` | Importiert aus `../documents` (relative Form der oeffentlichen API). Mandanten-Smoke-Tests. |

### 3.3 — Ungenutzte Exports (interner Befund)

Folgende Exports sind in `src/api/documents.ts` deklariert, haben aber **keinen** produktiven Konsumenten:

| Export | Status | Empfehlung |
|--------|--------|-----------|
| `deleteDocument` | exportiert, ungenutzt | UI-Verknuepfung in PR 4..N pruefen oder als technische Schuld dokumentieren. |
| `getDocumentSignedUrl` | exportiert, ungenutzt | Erwartet — wird in PR 4 erstmals genutzt. |
| `readPendingDocumentsLocalStorageMigration` | exportiert, ungenutzt | Erwartet — Aufruf in PR N+1 (`feat/documents-storage-go-live`). |
| `migrateOneDocumentToCloud` | exportiert, ungenutzt | Erwartet — Aufruf in PR N+1. |
| `markDocumentsLocalStorageMigrationComplete` | exportiert, ungenutzt | Erwartet — Aufruf in PR N+1. |

---

## 4 — Detaillierte Aufruf-Tabelle

| # | Datei | Zeile | Funktion | Sync/Async | Kontext | Cloud-Verhalten | Risiko |
|---|-------|-------|----------|------------|---------|-----------------|--------|
| 1 | `DocumentPreview.tsx` | 22 | `getDocumentUrl` | sync | `useMemo` in JSX | Liefert `null` + `console.warn`. UI zeigt "Vorschau nicht verfuegbar." | **KRITISCH** |
| 2 | `DocumentPreview.tsx` | 60 | `formatFileSize` | sync | JSX-Anzeige | Identisch in beiden Modi (reine Funktion). | NIEDRIG |
| 3 | `DocumentsPage.tsx` | 45 | `fetchDocuments` | async | `useQuery.queryFn` | Beide Modi geben `Document[]` zurueck. | MITTEL |
| 4 | `DocumentsPage.tsx` | 105 | `uploadDocument` | async | `useMutation.mutationFn` mit `onError` | Beide Modi geben `Document` zurueck. | MITTEL |
| 5 | `DocumentsPage.tsx` | 122 | `updateDocumentOcr` | async | `try/catch`, `toast` | Beide Modi geben `void` zurueck. | MITTEL |
| 6 | `DocumentsPage.tsx` | 162 | `downloadDocumentAsFile` | async | innerhalb sequentieller Batch-Schleife | Cloud erzwingt `Signed-URL`-Aufruf pro Iteration. Performance-Risiko. | **HOCH** |
| 7 | `DocumentsPage.tsx` | 164 | `updateDocumentOcr` | async | innerhalb der Batch-Schleife, `try/catch` | Funktional unproblematisch. | MITTEL |
| 8 | `DocumentsPage.tsx` | 311, 388 | `formatFileSize` | sync | JSX-Anzeige | Identisch in beiden Modi. | NIEDRIG |
| 9 | `InventurPage.tsx` | 639 | `uploadDocument` | async | `await` in Handler | Beide Modi identisch. | MITTEL |
| 10 | `DatenExportPage.tsx` | 79 | `fetchDocuments` | async | `useQuery.queryFn` | Identisch zu #3. | MITTEL |
| 11 | `RetentionPage.tsx` | 48 | `fetchDocuments` | async | `useQuery.queryFn` | Identisch zu #3. | MITTEL |
| 12 | `VerfahrensdokuPage.tsx` | 58 | `fetchDocuments` | async | `useQuery.queryFn` | Identisch zu #3. | MITTEL |

---

## 5 — Risiko-Klassifikation

### KRITISCH

> Aufruf bricht das Feature beim Cloud-Cutover. Nicht durch Wrapper allein loesbar — das aufrufende Modul muss umgebaut werden.

**Kriterium:** Synchroner Aufruf einer URL-erzeugenden Funktion in JSX, deren Cloud-Pfad inhaerent asynchron ist.

**Treffer:** 1 (`DocumentPreview.tsx:22`).

**Konsequenz:** Im Cloud-Modus verschwindet die Dokumenten-Vorschau ohne Crash. Das ist eine **stille Feature-Regression** — gefaehrlicher als ein Crash, weil sie in manuellen Smoke-Tests uebersehen werden kann.

### HOCH

> Aufruf funktioniert technisch, hat aber Performance- oder UX-Risiken im Cloud-Modus.

**Kriterium:** Async-Aufruf in Schleifen oder mit signifikantem Latenz-Unterschied zwischen Modi.

**Treffer:** 1 (`DocumentsPage.tsx:162` — `downloadDocumentAsFile` in Batch-OCR-Schleife).

**Konsequenz:** Im Cloud-Modus wird pro Iteration ein `getSignedUrl`-Roundtrip ausgeloest. Bei 100 Belegen sind das 100 zusaetzliche HTTP-Requests. Akzeptabel fuer den ersten Cutover, aber als technische Schuld zu vermerken.

### MITTEL

> Aufruf ist in beiden Modi identisch funktional. Existierende Fehlerbehandlung deckt Cloud-spezifische Faelle ab.

**Kriterium:** Async-Aufruf eingebettet in `useMutation` / `useQuery` / `try/catch`.

**Treffer:** 7 Aufrufe.

**Konsequenz:** Kein Refactor noetig, sofern die existierende Fehlerbehandlung als ausreichend bewertet wird.

### NIEDRIG

> Reiner Pure-Function-Aufruf. Verhalten ist Modus-unabhaengig.

**Kriterium:** Kein I/O, keine Modus-Verzweigung in der Funktion.

**Treffer:** 3 Aufrufe (alle `formatFileSize`).

**Konsequenz:** Kein Refactor.

---

## 6 — Hauptbefunde

### 6.1 — Blast Radius ist sehr begrenzt

`getDocumentUrl` — die einzige problematische synchrone Funktion — wird ausschliesslich in `DocumentPreview.tsx` aufgerufen. Alle anderen Konsumenten nutzen die async-API durchgaengig.

**Implikation:** PR 4 kann ein chirurgischer Eingriff in genau eine Datei (plus optional ein Wrapper in `documents.ts`) sein.

### 6.2 — Bestehende Fehlerbehandlung ist robust

`DocumentsPage.tsx` zeigt durchgaengig:

- `useMutation` mit `onError`-Handler und `toast.error`.
- `try/catch/finally` mit `toast.error` und State-Cleanup.
- `useQuery` mit React-Query-Standard-Fehlerbehandlung.

**Implikation:** Ein dediziertes "Error-Handling-PR" ist vermutlich nicht erforderlich.

### 6.3 — Migrations-Pfad ist vorbereitet, aber nicht aktiv

`readPendingDocumentsLocalStorageMigration`, `migrateOneDocumentToCloud`, `markDocumentsLocalStorageMigrationComplete` sind exportiert, aber haben keinen Aufrufer. Das ist beabsichtigt (PR 2 hat sie eingefuehrt). Sie werden in PR N+1 (`feat/documents-storage-go-live`) verkabelt.

### 6.4 — Pfad-Konvention ist konsistent

Alle Konsumenten uebergeben `selectedMandantId` (oder `null`) als `clientId`. Die in PR 2 etablierte Konvention `{company_id}/{document_id}.{ext}` wird durch keinen Konsumenten verletzt.

### 6.5 — Vorschau-Aufruf ist auf einen Code-Pfad gebuendelt

`DocumentPreview` wird nur aus `DocumentsPage.tsx` instanziiert (`{preview && <DocumentPreview ... />}` am Ende der Datei). Es gibt keinen weiteren Einstiegspunkt. Das vereinfacht PR 4 weiter.

---

## 7 — Vorgeschlagene Folge-PRs

### PR 4 — `refactor/documents-preview-async` (KRITISCH, empfohlen)

**Scope:**

1. Neuen Wrapper `getAnyDocumentUrl(doc): Promise<string | null>` in `src/api/documents.ts` einfuehren.
2. `DocumentPreview.tsx` umstellen: `useMemo` → `useState` + `useEffect` + Loading/Error-States.
3. UI-States: `loading`, `error`, `loaded`, `notAvailable`.

**Akzeptanzkriterien:**

- Vorschau funktioniert im Legacy-Modus (Flag OFF) wie bisher.
- Vorschau funktioniert im Cloud-Modus (Flag ON) ueber Signed URL.
- Loading-Spinner sichtbar waehrend URL-Aufloesung.
- Fehler-Anzeige bei abgelaufenem oder nicht erreichbarem URL.
- Cleanup des `useEffect` bei Doc-Wechsel verhindert Race Conditions.

**Aufwand:** niedrig bis mittel.

### PR 5 — `refactor/documents-batch-ocr-cloud` (HOCH, optional)

**Scope:** Optimierung der Batch-OCR-Schleife in `DocumentsPage.tsx` fuer den Cloud-Modus.

**Optionen:**

- (a) Status quo akzeptieren — N Roundtrips bei N Belegen.
- (b) Bulk-Signed-URL-API einfuehren (eine HTTP-Anfrage fuer N URLs).

**Empfehlung:** Entscheidung **nach** Live-Beobachtung verschieben. Wenn die Batch-Performance in der Praxis akzeptabel ist, entfaellt PR 5.

**Aufwand:** mittel bis hoch (falls (b) gewaehlt).

### PR N+1 — `feat/documents-storage-go-live`

**Scope:**

1. Migrations-UI: Banner im Documents-Bereich, das `localStorage`-Belege erkennt und schrittweise in die Cloud migriert.
2. Aufruf von `migrateOneDocumentToCloud` pro Beleg.
3. Aufruf von `markDocumentsLocalStorageMigrationComplete` nach erfolgreichem Abschluss.
4. **Aktivierung** des Feature-Flags `VITE_USE_SUPABASE_STORAGE=true` in der `.env`.

**Voraussetzung:** PR 4 muss gemerged sein. Optional: PR 5 abgeschlossen.

**Akzeptanzkriterien:**

- Bestehende `localStorage`-Daten werden nicht verloren.
- Migration ist resumable (bei Browser-Reload).
- Migration ist transparent fuer den Nutzer (Fortschrittsanzeige, Fehlerbehandlung).
- Nach Abschluss zeigen alle Konsumenten Cloud-Daten.

**Aufwand:** mittel bis hoch.

---

## 8 — Migrations-Plan (Reihenfolge)

| Reihenfolge | PR | Branch | Status |
|-------------|----|--------|--------|
| 1 | PR 3 | `chore/documents-consumer-audit` | dieser PR |
| 2 | PR 4 | `refactor/documents-preview-async` | nach PR 3 |
| 3 | (optional) PR 5 | `refactor/documents-batch-ocr-cloud` | nach Live-Beobachtung |
| 4 | PR N+1 | `feat/documents-storage-go-live` | nach PR 4 (+ optional PR 5) |

**Begruendung:** PR 4 ist Voraussetzung fuer N+1. PR 5 ist Optimierung — nicht blockierend.

---

## 9 — Offene architektonische Fragen

Diese Fragen werden zur Diskussion gestellt und sollten **vor** dem Beginn von PR 4 entschieden werden.

### 9.1 — Wrapper `getAnyDocumentUrl`

**Frage:** Wird ein einheitlicher Wrapper `getAnyDocumentUrl(doc): Promise<string | null>` in `src/api/documents.ts` eingefuehrt, der intern auf den Feature-Flag prueft?

**Vorgeschlagene Antwort: Ja.**

**Begruendung:**

- **Abstraktion:** Konsumenten muessen nicht wissen, ob Legacy oder Cloud aktiv ist.
- **Konsistenz mit PR 2:** Der Wrapper ist der einzige Ort, der `VITE_USE_SUPABASE_STORAGE` kennt.
- **DRY-Prinzip:** Zukuenftige Konsumenten brauchen keine eigene Verzweigung.
- **Test-Standard etabliert:** `vi.mock` + `vi.hoisted()` aus PR 2 deckt diesen Fall ab.

**Vorgeschlagene Schnittstelle (Skizze, nicht zu implementieren in PR 3):**

```typescript
export async function getAnyDocumentUrl(
  doc: Document
): Promise {
  if (import.meta.env.VITE_USE_SUPABASE_STORAGE === "true") {
    return getDocumentSignedUrl(doc, 3600); // 1h TTL
  }
  return getDocumentUrlLegacy(doc); // synchron, im Promise gewickelt
}
```

**Asymmetrie:** Die Legacy-Variante bleibt synchron im Legacy-Modul; der Wrapper macht sie async, um eine einheitliche Aufrufstelle zu bieten.

**Konsequenz fuer `getDocumentUrl`:** Wird **nicht** entfernt in PR 4, sondern als Deprecation-Path stehen gelassen (mit `@deprecated`-JSDoc). Entfernung in einem spaeteren Cleanup-PR.

### 9.2 — Signed-URL-Lifecycle

**Frage:** Wie geht `DocumentPreview` mit einem abgelaufenen Signed URL um (TTL = 1 Stunde)?

**Optionen:**

- (a) **Initial-Load only:** URL beim Oeffnen einmal holen. Nach 1h zeigt das `<iframe>` einen Fehler.
- (b) **Refetch on demand:** Bei Fehler im `<iframe>`/`<img>` einen neuen URL anfordern.
- (c) **Periodischer Refresh:** Alle 50 Minuten neu holen, solange das Modal offen ist.

**Vorgeschlagene Antwort: (a) fuer PR 4, (b) als technische Schuld dokumentieren.**

**Begruendung:**

- Realistisches Nutzungs-Szenario: Modal wird selten laenger als 1h offen gelassen.
- (a) ist deutlich einfacher zu implementieren.
- Erweiterung auf (b) ist nachtraeglich moeglich ohne API-Bruch.

### 9.3 — PR 5 separieren oder in PR 4 integrieren?

**Frage:** Sollte die Optimierung der Batch-OCR-Schleife (HOCH-Risiko) Teil von PR 4 werden?

**Vorgeschlagene Antwort: Nein, separieren.**

**Begruendung:**

- **Atomare PRs sind ZWINGEND** (Lehre aus Charge 8.5).
- PR 4 hat ein klares, eng definiertes Ziel: KRITISCH-Fall loesen.
- Batch-OCR-Optimierung ist eine Performance-Frage, kein Korrektheits-Problem.
- Live-Daten aus dem Cutover (PR N+1) liefern bessere Entscheidungsgrundlage als Spekulation.

---

## 10 — Anhang: Verwendete Diagnose-Befehle

```powershell
# 1 — Alle Importe (Sucheinstieg)
Get-ChildItem -Path src -Recurse -Include *.ts,*.tsx,*.js,*.jsx |
  Select-String -Pattern 'from ["''].*api/documents["'']'

# 2 — Funktionsspezifische Suchen
Get-ChildItem -Path src -Recurse -Include *.ts,*.tsx,*.js,*.jsx |
  Select-String -Pattern 'getDocumentUrl'

Get-ChildItem -Path src -Recurse -Include *.ts,*.tsx,*.js,*.jsx |
  Select-String -Pattern 'getDocumentSignedUrl'

Get-ChildItem -Path src -Recurse -Include *.ts,*.tsx,*.js,*.jsx |
  Select-String -Pattern 'uploadDocument'

Get-ChildItem -Path src -Recurse -Include *.ts,*.tsx,*.js,*.jsx |
  Select-String -Pattern 'updateDocumentOcr'

Get-ChildItem -Path src -Recurse -Include *.ts,*.tsx,*.js,*.jsx |
  Select-String -Pattern 'deleteDocument'

Get-ChildItem -Path src -Recurse -Include *.ts,*.tsx,*.js,*.jsx |
  Select-String -Pattern 'downloadDocumentAsFile'

Get-ChildItem -Path src -Recurse -Include *.ts,*.tsx,*.js,*.jsx |
  Select-String -Pattern 'fetchDocuments'

Get-ChildItem -Path src -Recurse -Include *.ts,*.tsx,*.js,*.jsx |
  Select-String -Pattern 'formatFileSize'

# 3 — Migrations-Funktionen
Get-ChildItem -Path src -Recurse -Include *.ts,*.tsx,*.js,*.jsx |
  Select-String -Pattern 'readPendingDocumentsLocalStorageMigration|migrateOneDocumentToCloud|markDocumentsLocalStorageMigrationComplete'

# 4 — Public-API-Exports
Get-ChildItem -Path src/api/documents.ts |
  Select-String -Pattern '^export'

# 5 — Test-Konsumenten mit relativem Pfad (Ergaenzung zur Sucheinstieg)
# Schliesst die "blinde Stelle" des Patterns aus 2.1: Test-Dateien in
# src/api/__tests__/ verwenden relative Importe ohne "api/"-Praefix.
Get-ChildItem -Path src -Recurse -Include *.test.ts,*.test.tsx |
  Select-String -Pattern 'from ["''].*documents(Cloud)?["'']'
```

---

## 11 — Compliance-Hinweis

Dieser Audit ist ein technisches Planungs-Dokument. Die in den Folge-PRs umgesetzten Aenderungen betreffen die Ablage von Belegen — und damit Anforderungen aus:

- **§ 257 HGB** (Aufbewahrungspflichten)
- **§§ 146, 147 AO** (Ordnungsmaessigkeit der Buchfuehrung)
- **GoBD Rz. 100 ff.** (Unveraenderbarkeit, Datensicherheit)
- **DSGVO Art. 32** (Sicherheit der Verarbeitung)

Vor Aktivierung des Feature-Flags `VITE_USE_SUPABASE_STORAGE` (PR N+1) ist eine **Ruecksprache mit dem zustaendigen Fachanwalt oder Steuerberater** ueber die GoBD-Konformitaet der Storage-Konfiguration zu empfehlen.

---

**Ende des Audit-Dokuments.**

*Erstellt im Branch `chore/documents-consumer-audit`. Naechster Schritt: PR 4.*
