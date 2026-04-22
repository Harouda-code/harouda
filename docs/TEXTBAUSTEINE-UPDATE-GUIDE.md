# Wartungs-Leitfaden · HGB-Anhang- und Lagebericht-Textbausteine

**Erfasst:** 2026-04-22 · Jahresabschluss-E3a / Schritt 4.
**Erweitert:** 2026-04-23 · Jahresabschluss-E3b / Schritt 3 um
Lagebericht-Bausteine (§ 289 HGB).
**Gilt für:**
- `src/domain/jahresabschluss/anhangTextbausteine.ts` (§§ 284-288 HGB).
- `src/domain/jahresabschluss/lageberichtTextbausteine.ts` (§ 289 HGB).
- alle darauf aufbauenden Module (Document-Merge, PDF-Export).

---

## Warum dieses Dokument existiert

HGB-Rechtslage und BMF-Auslegungen ändern sich laufend (BilMoG, BilRUG,
BMF-Schreiben zu § 285/§ 289 HGB). Ein Jahresabschluss-Template, das
nicht aktiv gepflegt wird, wird **binnen 12 Monaten falsch** und kann
damit kanzleiseitig haftungsrelevant werden (§ 33 StBerG, § 57 Abs. 4
StBerG). Dieses Dokument legt den Update-Prozess fest, damit neue
AI-Sessions oder neue Teammitglieder die Bibliothek nicht aus
Unwissenheit "stale" lassen.

## Aufbau eines Textbausteins

Jeder Eintrag in `ANHANG_TEXTBAUSTEINE[]` folgt dem `Textbaustein`-Typ
(definiert im selben Modul):

| Feld | Zweck |
|---|---|
| `id` | Stabiler Key — wird in `TB_ID_*`-Konstanten re-exportiert und in Tests / Konsumenten referenziert. Nie verändern. |
| `titel` | Menschenlesbare deutsche Überschrift. Wird im UI und als H2 im Dokument verwendet. |
| `paragraph_verweis` | `"§ XXX HGB"` — für Disclaimer + Footer. |
| `version_stand` | `YYYY-MM` — Stand der rechtlichen Grundlage. Muss bei jeder Anpassung aktualisiert werden. |
| `anwendungsbereich` | Array der Größenklassen (`"kleinst"`, `"klein"`, `"mittel"`, `"gross"`), in denen der Baustein Pflicht oder empfohlen ist. |
| `rechtsform_scope` | `"Kapitalgesellschaft"` / `"Personengesellschaft"` / `"alle"`. |
| `tiptap_template` | TipTap-JSON-Dokument, das als initial content im Editor geladen wird. Enthält Platzhalter in eckigen Klammern. |
| `pflicht` | `true` = zwingend erscheinen; `false` = optional / auf-Basis-von-Sachverhalt. |
| `notiz` | Hinweis für den Bearbeiter (wird im Editor über dem Disclaimer angezeigt). |

## Neuen Baustein hinzufügen

1. **Rechtsgrundlage lesen.** Immer das aktuelle HGB (juris / Beck-Online
   / BGBl.) aufrufen, nicht nur Kommentare.
2. **ID-Konstante definieren** — Schema `§-<nr>-<kurzname>`,
   kebab-case, nicht verändern nachdem sie publik ist.
3. **Template im TipTap-JSON-Schema schreiben.** Tipp: im Dev-Server
   mit `TipTapEditor` ausprobieren, `editor.getJSON()` in der Console
   ausgeben, dann hier einfügen.
4. **Platzhalter konsequent markieren:** `[In eckigen Klammern]`.
5. **Test aktualisieren** — `anhangTextbausteine.test.ts`:
   - `ANHANG_TEXTBAUSTEINE.length` anpassen.
   - ID-Konstante in #3 ergänzen.
   - Filter-Tests (#5 und #6) ggf. erweitern.
6. **Code-Kommentar mit Rechtsquelle** oberhalb der Constant-Eintrag:
   Paragraph, Buchstabe, BMF-Datum falls relevant.
7. **`version_stand` auf aktuellen Monat setzen.**

## Bestehenden Baustein aktualisieren

1. **Textänderung:** `tiptap_template` updaten + `version_stand` auf
   aktuellen Monat setzen.
2. **Rechtsgrundlage geändert:** `paragraph_verweis` updaten +
   `version_stand` setzen + Notiz im Code-Kommentar ergänzen
   (Quelle der Änderung, BMF-Schreiben, neue Gesetzesnummer).
3. **Anwendungsbereich geändert:** `anwendungsbereich` / `rechtsform_scope`
   anpassen + Filter-Tests in `anhangTextbausteine.test.ts` updaten.
4. **ID NIE verändern** — sonst bricht jede bereits im Feld verwendete
   User-Session. Wenn ein Baustein grundlegend unterschiedlich wird:
   alter Baustein bleibt, neuer Baustein mit neuer ID + Notiz
   "ersetzt durch <neue-id> ab <datum>".

## Review-Zyklus

**Mindestens 1× jährlich zum Jahreswechsel** (Dez/Jan) vollständige
Bibliothek durchgehen:

- [ ] Alle `version_stand`-Felder prüfen — über 12 Monate alt?
- [ ] BMF-Schreiben-Verzeichnis auf neue Rundschreiben zu
      § 264-289 HGB filtern.
- [ ] Taxonomie-Release der HGB-XBRL-Taxonomie prüfen (siehe
      `docs/ROADMAP.md` Deprecation-Watch).
- [ ] § 285 HGB-Nummern ergänzen (Nr. 2-6, 8, 11-35 — bisher nicht in MVP).
- [ ] § 289 HGB Lagebericht-Bausteine (kommt mit E3b).

Ergebnis des Review-Zyklus: neue oder aktualisierte Bausteine;
`version_stand` aller angefassten Einträge auf aktuellen Monat gesetzt;
`CLAUDE.md` Drift-Notiz aktualisiert.

## Checkliste pro Änderung (Pull-Request-Template)

- [ ] Rechtsquelle zitiert (HGB-§, BGBl.-Fundstelle falls neu).
- [ ] Code-Kommentar oberhalb der Baustein-Konstante mit Stand-Datum.
- [ ] `version_stand` in `YYYY-MM`.
- [ ] Test in `anhangTextbausteine.test.ts` aktualisiert.
- [ ] `tsc --noEmit` clean.
- [ ] `npx vitest run src/domain/jahresabschluss` grün.
- [ ] `TextbausteinDisclaimer` zeigt neuen `version_stand` korrekt.

## Kontakte für Rechtsfragen

- Fachanwalt für Steuerrecht (intern zu benennen).
- Haftungsfragen: StBerG-Team (intern).
- BMF-Interpretation: Verweis auf `bundesfinanzministerium.de`
  → BMF-Schreiben-Suche.

## Lagebericht-Bausteine (§ 289 HGB)

Seit Sprint E3b existiert eine zweite Bibliothek für Lagebericht-
Textbausteine in `src/domain/jahresabschluss/lageberichtTextbausteine.ts`.
Sie folgt denselben Regeln (Typ `Textbaustein`, `version_stand`,
`paragraph_verweis`, `tiptap_template`), aber mit eigenen ID-Konstanten
(`LB_ID_289_*`) und einem erweiterten Filter `getLageberichtFuer()`, der
zusätzlich den Parameter `kapitalmarktorientiert?: boolean` berücksichtigt
(§ 289 Abs. 4 HGB i. V. m. § 264d HGB).

**Aktueller MVP-Inhalt:**
- § 289 Abs. 1 HGB — Wirtschaftsbericht (mittel + groß).
- § 289 Abs. 2 Nr. 1 HGB — Prognose-, Risiko- und Chancenbericht (mittel + groß).
- § 289 Abs. 3 HGB — Nichtfinanzielle Leistungsindikatoren (nur groß).
- § 289 Abs. 4 HGB — IKS / Risikomanagement (nur kapitalmarktorientiert).

**Noch offen** (Folge-Sprint-Kandidaten):
- § 289a HGB — Erklärung zur Unternehmensführung.
- § 289b – § 289e HGB — Nichtfinanzielle Erklärung.
- Konzernlagebericht § 315 HGB.

Review-Cycle und Pflicht-Checks sind identisch zum Anhang-Teil — der
Jahres-Review (Dez/Jan) umfasst beide Bibliotheken.

## Siehe auch

- `docs/SPRINT-JAHRESABSCHLUSS-E3A-ABSCHLUSS.md` — Foundation-Sprint.
- `docs/SPRINT-JAHRESABSCHLUSS-E3B-ABSCHLUSS.md` — Document-Merge-Sprint.
- `docs/COMPLIANCE-GUIDE.md` — Globaler HGB-Compliance-Überblick.
- `docs/ROADMAP.md` — Deprecation-Watch (HGB-Taxonomie 6.9 im April 2026
  fällig).
