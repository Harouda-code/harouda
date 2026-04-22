# harouda-app — Demo-Paket für behördliche Gespräche

**Kapazitäts-Demonstration** einer Kanzlei-Software für Steuerberater:innen.
**Nicht zur produktiven Nutzung.** Nicht zertifiziert. Kein Ersatz für DATEV,
Lexoffice, WISO oder ELSTER-Clients. Das vorliegende Paket ist für Gespräche
mit Zertifizierungsstellen, Behörden und potenziellen Lizenzgebern gedacht.

---

## Paket-Inhalt

```
harouda-app-demo-YYYY-MM-DD.zip
├── dist/                              # gebauter statischer Build (HashRouter, relative Pfade)
├── README-DEMO.md                     # dieses Dokument
├── serve-windows.bat                  # Mini-Server (Windows)
├── serve-unix.sh                      # Mini-Server (Linux/macOS)
└── docs/
    ├── technical-specification.md     # Architektur, Stack, Datenmodell, Security
    ├── compliance-roadmap.md          # Lizenz-/Zertifizierungspfade (6 Bereiche)
    ├── demo-script.md                 # 15-Minuten-Gesprächsleitfaden
    ├── screenshots-guide.md           # Checkliste + Playwright-Anleitung
    ├── capture-screenshots.mjs        # Optional: Playwright-Automation
    ├── steuer-parameter-changelog.md  # Jahresweise Steuer-Werte mit Quellen
    └── verfahrensdokumentation.md     # GoBD-Vorlage zum Ausfüllen
```

---

## Schnelltest der Demo

**Variante 1 — Doppelklick**:
1. ZIP entpacken.
2. `dist/index.html` doppelklicken.

**Variante 2 — Lokaler HTTP-Server**:
```bash
# Windows
serve-windows.bat

# Linux / macOS
./serve-unix.sh
```

Die App öffnet sich dann unter http://localhost:8080. Login-Daten sind im
Demo-Modus beliebig (Vorschlag: `demo@harouda.local` / `password123`) oder
einfach „Als Demo anmelden" klicken.

Beim ersten Start erscheint ein **7-stufiger Rundgang**, der die wichtigsten
Module zeigt. Er lässt sich jederzeit über die gelbe Schaltfläche
„Rundgang starten" im Demo-Banner oben wiederaufrufen.

---

## Dokumenten-Leitfaden

Für eine Lizenzierungs- / Zertifizierungsdiskussion werden folgende
Dokumente in dieser Reihenfolge empfohlen:

1. **`docs/demo-script.md`** — 15-Minuten-Leitfaden für die Live-Vorführung.
   Enthält Wortlaute für die kritischen Abschnitte.
2. **`docs/compliance-roadmap.md`** — Kern-Dokument für die Gesprächs-
   substanz. Listet alle sechs Compliance-Bereiche (GoBD, ELSTER/ERiC,
   DATEV, PSD2, DSGVO, ISO/C5) mit aktuellem Stand, Gap und Lizenzpfad
   inkl. Zeit- und Kostenschätzungen.
3. **`docs/technical-specification.md`** — Architektur und Stack für
   technische Prüfer:innen der Beschaffungsstelle.
4. **`docs/screenshots-guide.md`** — Falls Screenshots für Slides benötigt
   werden.
5. **`docs/verfahrensdokumentation.md`** — GoBD-Vorlage. Wird im Rahmen
   der Compliance-Diskussion referenziert.
6. **`docs/steuer-parameter-changelog.md`** — Jahresweise Steuer-Werte
   mit Quellennachweis (§§ EStG, BMF-Schreiben).

---

## Besonderheiten des Demo-Builds

- **Kein Supabase-Backend nötig**. Authentifizierung wird im Browser
  simuliert. Alle Daten liegen im `localStorage`.
- **Auto-Seed**: 3 Mandanten, 15 Buchungen, SKR03-Kontenplan, Kanzlei-
  Stammdaten werden beim ersten Start automatisch angelegt.
- **Demo-Banner** oben weist dauerhaft auf den Demo-Status hin. Schließbar.
- **Druckansichten** tragen ein diagonales „DEMO"-Wasserzeichen.
- **Sichtbare Form-Meta-Badges** auf allen Steuerformularen dokumentieren
  Version, Veranlagungsjahr, letzte Prüfung und Quellennachweis.
- **Hash-verketteter Audit-Log** prüfbar unter
  *Einstellungen → Audit-Log → Kette prüfen*.

---

## Was diese Demo **nicht** ist

Bewusst und explizit nicht enthalten — das ist für jede produktive
Verwendung zu ergänzen:

- **Keine ERiC-/ELSTER-Abgabe**. Die XML-Exports sind am öffentlichen
  Schema orientiert, aber nicht durch die Finanzverwaltung autorisiert.
- **Keine DATEV-Zertifizierung**. CSV/ATCH-Exports nach öffentlicher
  Spezifikation, aber nicht lizenziert.
- **Kein GoBD-Testat nach IDW PS 880**. Die Vorlage zur
  Verfahrensdokumentation liegt bei; der Prüfungsprozess selbst ist
  extern.
- **Keine Bank-Anbindung** (PSD2 / Open Banking). Nur Datei-Import
  (MT940, CAMT.053).
- **Keine rechtliche Prüfung der Tax-Parameter**. Sätze und Freibeträge
  stammen aus öffentlichen BMF-Veröffentlichungen; vor produktivem
  Einsatz von qualifizierter Person verifizieren.

Der Zeit- und Kostenrahmen für diese Erweiterungen steht in
`docs/compliance-roadmap.md`.

---

## Demo zurücksetzen

Falls die Demo in den Auslieferungszustand zurückversetzt werden soll:

1. Browser-Developer-Tools öffnen (F12).
2. Im Console-Tab `localStorage.clear()` eingeben.
3. Seite neu laden.

Beim nächsten Start werden Demo-Daten und Rundgang frisch gesetzt.

---

## Technische Kurzfassung

- Frontend: React 19, TypeScript, Vite
- Routing: HashRouter (Demo-Build), BrowserRouter (Produktionsbuild)
- Persistenz: localStorage (Demo), Supabase Postgres mit RLS
  (Produktionsbuild)
- Bundle: ~1,3 MB komprimiert
- Browser: aktuelle Chrome, Firefox, Edge, Safari 16+

Weitere Details: `docs/technical-specification.md`.
