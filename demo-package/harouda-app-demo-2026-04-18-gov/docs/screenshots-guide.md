# Screenshots für das Präsentations-Dossier

Zwei Optionen: manuelle Aufnahme (15 min Aufwand) oder automatisiert mit
Playwright (~5 min nach Setup).

---

## Option A — Manuell

**Vorbereitung**:
1. Demo-Build auf http://localhost:8080 starten (`serve-windows.bat`
   oder `serve-unix.sh`).
2. Browser auf 1440 × 900 (Standard-Laptop-Auflösung) einstellen.
3. Als Demo einloggen, Rundgang überspringen.
4. Demo-Banner nicht schließen — er soll auf jedem Screenshot sichtbar
   sein.

**Aufnahmeliste** — je Screen ein PNG:

| # | Route                                 | Framing-Hinweis                                                |
|---|---------------------------------------|-----------------------------------------------------------------|
| 01 | `/dashboard`                          | KPIs + „Letzte Buchungen" sichtbar                              |
| 02 | `/journal`                            | Tabelle mit mind. 10 Einträgen                                  |
| 03 | `/journal` Formular (Strg+N)          | Gefülltes „Neue Buchung"-Formular                                |
| 04 | `/konten`                             | Kontenplan mit eingeklappten Sektionen                          |
| 05 | `/mandanten`                          | Drei Demo-Mandanten als Karten                                  |
| 06 | `/opos` — Tab „Debitoren"             | Aging-Tabelle mit überfälligen Einträgen sichtbar                |
| 07 | `/mahnwesen`                          | Mahnvorschläge für die drei Demo-Debitoren                      |
| 08 | `/mahnwesen` (nach Mahnungs-Erstellung)| Mahnhistorie mit einem Eintrag                                   |
| 09 | `/berichte`                           | GuV / BWA / SuSa Kacheln                                         |
| 10 | `/berichte/guv`                       | GuV mit Zahlen                                                  |
| 11 | `/steuer`                             | 10 Formular-Kacheln mit Badge-Modi                              |
| 12 | `/steuer/ustva`                       | UStVA mit Zahlen, FormMetaBadge oben sichtbar                    |
| 13 | `/steuer/euer`                        | EÜR mit expandierten Quell-Konten                                |
| 14 | `/steuer/anlage-n`                    | Anlage N mit ausgefülltem SV-Rechner                             |
| 15 | `/buchfuehrung`                       | Vier Kacheln des Buchführung-Hubs                                |
| 16 | `/buchfuehrung/plausi`                | KPIs + Liste mit grün/orangen Checks                             |
| 17 | `/einstellungen/audit`                | Audit-Log mit „Kette prüfen"-Bestätigung grün                    |
| 18 | `/einstellungen/fristen`              | Fristenkalender mit Buckets                                     |
| 19 | `/belege`                             | Grid mit mind. 2 Demo-Belegen (falls vorhanden)                 |
| 20 | `/zugferd`                            | Leere Ansicht mit Upload-Aufforderung                            |

**Werkzeug-Empfehlung**:
- Windows: **Snipping Tool** (Win+Shift+S) → Fenster-Ausschnitt
- macOS: **Cmd+Shift+4** → Fensterbereich
- Linux: **Flameshot** oder GNOME Screenshot

**Wichtig**: Vor jeder Aufnahme das Browser-Tab mit F11 in den Vollbild-
Modus bringen. Die URL-Leiste verdeckt sonst das Framing der
Präsentations-Slides.

---

## Option B — Automatisiert mit Playwright

**Voraussetzung**: Node.js 18+ installiert.

**Setup** (einmalig):

```bash
cd demo-package
npm init -y
npm install -D playwright
npx playwright install chromium
```

**Script**: `docs/capture-screenshots.mjs` (im ZIP enthalten) verwenden.

```bash
# Vorher den Demo-Build auf einem Port starten:
npx --yes serve -s harouda-app-demo-2026-04-18/dist -l 8080 &

# Dann Screenshots erzeugen:
node docs/capture-screenshots.mjs
```

Das Script fährt alle 20 Routen ab, seedet Demo-Daten (falls nicht schon
da), überspringt den Tour-Modal und speichert PNGs in `screenshots/`.

Das Script ist bewusst linear gehalten (keine Retries, kein komplexer
Error-Recovery). Bei Fehlern einzelne Schritte kommentieren oder Timeouts
erhöhen.
