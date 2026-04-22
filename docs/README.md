# Dokumentation — harouda-app

Drei Dokumente in Deutsch, auf den aktuellen Stand der App abgestimmt:

| Dokument | Zielgruppe | Umfang |
|---|---|---|
| [BENUTZERHANDBUCH.md](BENUTZERHANDBUCH.md) | Endanwender:innen (Buchhalter:innen, Unternehmer:innen) | 16 Kapitel, ca. 4.000 Wörter |
| [BERATER-LEITFADEN.md](BERATER-LEITFADEN.md) | Steuerberater:innen, externe Prüfer:innen | 9 Kapitel, ca. 2.000 Wörter |
| [ENTWICKLERHANDBUCH.md](ENTWICKLERHANDBUCH.md) | Entwickler:innen und Betreiber:innen | 11 Kapitel, ca. 3.500 Wörter |

---

## Was in diesen Dokumenten steht

- **Konkrete Routen** (z. B. `/journal`, `/personal/abrechnung`) statt
  allgemeiner Feature-Namen
- **Reale Migrations- und Modulverweise** (Dateien + Zeilen stimmen)
- **Ehrliche Grenzen** in jedem Abschnitt — was die App nicht tut und
  warum
- **Deutsche Business-Sprache**, konsistent mit der UI

## Was in diesen Dokumenten NICHT steht

- **Screenshots** — nicht enthalten. Platzhalter `[SCREENSHOT: …]` kann
  bei Bedarf gesetzt werden; die Bilder müssen aus der laufenden App
  manuell erstellt werden, damit sie aktuell bleiben.
- **Fachliche Steuerberatung** — die Dokumente erklären das Tool, nicht
  das deutsche Steuerrecht. Gesetzesverweise (§ 147 AO, § 32a EStG, …)
  sind als Orientierung, nicht als Erlass-Ersatz gemeint.
- **CE-Credits / Zertifizierungs-Anerkennung** — nicht Teil dieses
  Projekts.
- **Video-Tutorials oder interaktive Trainings** — der Code enthält
  eine einfache GuidedTour-Komponente; aufgebaute Trainings-Suite
  existiert nicht.

## Aktualität

Stand: April 2026 (Sections 1–7 + Payroll-Completion).
Bei Code-Änderungen bitte das jeweilige Dokument mit anpassen.
Änderungen am Datenmodell betreffen typischerweise **alle drei**:

- Neue UI-Felder → BENUTZERHANDBUCH
- Neue Rollen-/Mandats-Workflows → BERATER-LEITFADEN
- Schema/Module → ENTWICKLERHANDBUCH

## Noch nicht dokumentiert (offene Punkte)

- Der `GuidedTour`-Flow (`components/GuidedTour.tsx`) ist im Benutzer-
  handbuch nur am Rand erwähnt.
- Einzelne Steuer-Formulare (Anlage N, KAP etc.) sind als Liste erwähnt,
  aber nicht tief erklärt — die UIs sind selbstbeschreibend, und die
  tatsächliche Abgabe läuft extern über ELSTER.
- Kein API-Referenz-Dokument (TypeDoc-Generierung wurde ausgelassen).
  Bei Bedarf: `npx typedoc src/api --out docs/api`.
