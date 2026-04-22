# Wartungs-Leitfaden · BStBK-Bescheinigungstexte

**Erfasst:** 2026-04-27 · Sprint 17.5 / Schritt 8.
**Gilt für:** `src/domain/jahresabschluss/bstbk/bstbkBescheinigungen.ts`
und alle darauf aufbauenden Module (Wizard-Step `StepBescheinigung`,
`BescheinigungBuilder`, PDF-Pipeline-Integration).

---

## Warum dieses Dokument existiert

Die BStBK (Bundessteuerberaterkammer) aktualisiert die Verlautbarung
"Hinweise zur Erstellung von Jahresabschlüssen" in unregelmäßigen
Abständen. Ein Wort-genauer Text, der rechtlich normiert in die
Bescheinigung muss, wird durch die Code-Basis als readonly Konstante
gepflegt — NICHT aus der DB, NICHT vom Nutzer editierbar.

Dieses Dokument legt den Update-Prozess fest, damit neue AI-Sessions
oder neue Teammitglieder die Bescheinigungstexte nicht aus Unwissenheit
„stale" lassen und damit haftungsrechtlich relevante Fehler einbauen.

## Rechtliche Grundlage

- **§ 242 HGB** — Jahresabschluss-Pflicht.
- **§ 57 StBerG** — Steuerberater-Pflichten.
- **BStBK-Verlautbarung "Hinweise zur Erstellung von
  Jahresabschlüssen"** (Stand 2023) — konkrete Bescheinigungs-
  Textbausteine für die drei Typen:
  - Erstellung ohne Beurteilungen.
  - Erstellung mit Plausibilitätsbeurteilungen.
  - Erstellung mit umfassenden Beurteilungen.

## Aktueller Versionsstand

| Typ | Version-Stand | Pfad |
|---|---|---|
| `ohne_beurteilungen` | 2023-04 | `bstbkBescheinigungen.ts` |
| `mit_plausibilitaet` | 2023-04 | `bstbkBescheinigungen.ts` |
| `mit_umfassender_beurteilung` | 2023-04 | `bstbkBescheinigungen.ts` |

Quelle: https://www.bstbk.de/

## Haftungshinweis

> **Die hier verwendeten Kerntexte sind an die BStBK-Verlautbarung
> Stand 2023 angelehnt. Für juristisch rechtssichere Verwendung wird
> Steuerberater-Freigabe pro Release empfohlen.**

Jede Abweichung vom BStBK-Wortlaut oder User-Editierung des Kerntextes
kann zur rechtlichen Ungültigkeit der Bescheinigung führen. Deshalb:

- **`Object.freeze`** auf allen Konstanten.
- **Readonly UI-Preview** (`<textarea disabled readOnly>`).
- **Whitelist-Placeholder-Substitution** (keine freien Variablen-Namen).
- **Control-Char-Filter** auf User-Input-Level.

## Update-Workflow pro neuer BStBK-Version

1. **Neue Verlautbarung von bstbk.de laden** (PDF + offizielle Wortlaute
   pro Bescheinigungstyp).
2. **PR-Review mit Steuerberater-Freigabe** (Pflicht):
   - Die PR muss von einem berufsständisch berechtigten
     Steuerberater oder einer BStBK-nahen Fachkraft gegengelesen werden.
   - Die Wort-genaue Abbildung im TS-Code muss validiert werden.
3. **Update `BSTBK_BESCHEINIGUNGEN` in
   `bstbkBescheinigungen.ts`:**
   - Neue `kern_text`-Strings pro Typ.
   - `version_stand` auf neuen Stand (z. B. `"2026-04"`).
   - `hinweis_text` falls BStBK ihn aktualisiert hat.
4. **Placeholder-Set prüfen**: falls die BStBK neue Variablen einführt
   (z. B. `{{Auftragsart}}`) → Whitelist in `bstbkPlaceholders.ts`
   (`BSTBK_PLACEHOLDERS`) und `BSTBK_PLACEHOLDER_LABELS` erweitern.
5. **Tests aktualisieren**:
   - `bstbkBescheinigungen.test.ts`: Placeholder-Liste + Version-
     Check.
   - `bstbkPlaceholders.test.ts`: neue Whitelist-Entries.
   - `BescheinigungBuilder.test.ts`: § 317 HGB-Erwähnung o. ä.
     angepasst auf neue Textphrasen.
   - `StepBescheinigung.test.tsx`: Auto-Fill-Felder + Preview.
6. **UI-Version-Hinweis** im Wizard:
   der Haftungs-Banner in `StepBescheinigung` bleibt gleich; nur
   `version_stand` in den Konstanten muss upgedated sein.
7. **Changelog-Eintrag** unten in diesem Dokument.

## Review-Zyklus

**Mindestens einmal jährlich im März** (vor dem ersten abschluss-
Stichtag des neuen Jahres):

- [ ] BStBK-Seite auf neue Verlautbarung prüfen.
- [ ] `version_stand`-Felder älter als 18 Monate?
- [ ] PR-Review mit berufsständisch berechtigtem Kontakt planen.

## Pull-Request-Checkliste pro Änderung

- [ ] Original BStBK-Quelle als PDF dem PR beigelegt (privat, nicht
      committet).
- [ ] Version-URL aus bstbk.de zitiert.
- [ ] Steuerberater-Sign-off dokumentiert (z. B. als PR-Kommentar).
- [ ] `version_stand` aktualisiert pro Typ.
- [ ] `npx vitest run src/domain/jahresabschluss/bstbk` grün.
- [ ] `npx tsc --noEmit` clean.
- [ ] Diesen Guide um Changelog-Eintrag ergänzt.

## Changelog

| Datum | Sprint | Änderung |
|---|---|---|
| 2026-04-27 | Sprint 17.5 | Erstmalige Einführung mit 3 Bescheinigungs-Typen, BStBK-Stand 2023. Placeholder-Whitelist mit 6 Keys. |

## Placeholder-Whitelist (bstbkPlaceholders.ts)

Aktuell zulässige Variablen:

1. `MandantenName` — Mandanten-Firma.
2. `JahresabschlussStichtag` — z. B. `31.12.2025`.
3. `KanzleiName` — eigene Kanzlei.
4. `Ort` — Unterschriftsort.
5. `Datum` — Unterschrifts-Datum (wird beim Export auf heute gesetzt).
6. `SteuerberaterName` — unterzeichnender Steuerberater.

**Erweiterung der Whitelist erfordert:**
- Code-Review durch 2 Entwickler.
- Grund-Dokumentation im PR (warum braucht die BStBK-Verlautbarung
  dieses neue Feld?).
- `BSTBK_PLACEHOLDER_LABELS` synchron aktualisiert.
- Alle 3 Template-Kerntexte enthalten die neue Variable oder sind
  dagegen explizit safe (Whitelist ≠ "jeder Text muss sie haben").

## Erläuterungs-Phrasen (Seitenaspekt)

Sprint 17.5 hat zusätzlich vier Standard-Phrasen für den
Erläuterungsbericht eingeführt (`erlaeuterungsPhrasen.ts`). Diese sind
KEINE BStBK-Verlautbarung — sie sind interne Formulierungshilfen im
Editor. Aktualisierungen erfordern keinen Steuerberater-Sign-off, aber
die Versionsangaben (`version_stand`) bleiben konsistent mit den
Bescheinigungen, um Verwechslung zu vermeiden.

## Siehe auch

- `docs/SPRINT-17-5-ERLAEUTERUNG-BESCHEINIGUNG-ABSCHLUSS.md` — Sprint-
  Kontext.
- `docs/TEXTBAUSTEINE-UPDATE-GUIDE.md` — analoger Wartungszyklus für
  Anhang/Lagebericht-Bausteine.
- `docs/JAHRESABSCHLUSS-SERIE-GESAMT-ABSCHLUSS.md` — Übersicht über
  alle Jahresabschluss-Sprints inkl. Sprint 17.5.
- `src/domain/jahresabschluss/bstbk/bstbkBescheinigungen.ts` — die
  Konstanten selbst.
- `src/domain/jahresabschluss/bstbk/bstbkPlaceholders.ts` — das
  Substitution-System.
