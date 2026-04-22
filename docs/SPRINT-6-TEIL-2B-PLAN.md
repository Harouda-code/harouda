# Sprint 6 Teil 2b — Plan (rückwirkend)

> **Hinweis zum Entstehungs-Zeitpunkt:**
> Dieser Plan wurde **nach** der Implementierung rückwirkend
> erstellt, um die Design-Struktur und die Rechtslage-Recherche
> festzuhalten. Die Baseline in diesem Dokument (910 Tests, vor
> Teil 2b) entspricht der Ausgangslage der Implementierungs-
> Session; der aktuelle Repo-Stand ist 932 Tests (Teil 2b
> umgesetzt). Kein Code-Rückbau — dieser Plan dient als
> Design-Freeze und Review-Grundlage für zukünftige Sprints.

---

## 1. Pre-Check (Baseline 910 Tests, vor Teil-2b-Start)

Grep-Ergebnisse für die 4 Bereiche:

| Bereich | Vorher vorhanden? | Fundstellen |
|---|---|---|
| GWG (`gwg`, `GWG`) | **nein** — nur Enum-Platzhalter + disabled Dropdown | `src/types/db.ts` (AfaMethode), `src/pages/AnlagenVerzeichnisPage.tsx` (Zeile ~461 disabled) |
| Sammelposten | **nein** — nur Enum-Platzhalter + disabled Dropdown | dito, Zeile ~464 |
| Degressiv (`degressiv`) | **nein** — nur Enum-Platzhalter + disabled Dropdown | dito, Zeile ~458 |
| Indirekte Brutto-Methode (`konto_abschreibung_kumuliert`) | **Schema + laufende AfA vorhanden**, Abgang explizit per `throw` geblockt | Migration 0025 (Schema), `AnlagenService.planAfaLauf` (nutzt für AfA-Haben-Konto), `AnlagenService.planAbgang:443-446` (blockiert) |

Betroffene Dateien für Teil 2b (vorgesehene Bearbeitungs-Fläche):

- `src/types/db.ts` — `AfaMethode`-Enum bleibt; Erweiterungen nicht nötig.
- `src/domain/anlagen/AfaCalculator.ts` — **Additiv**: zwei neue
  Funktionen + zwei neue Input-Typen. Bestehende `berechneLineareAfa`
  bleibt unverändert.
- `src/domain/anlagen/AnlagenService.ts` — `planAfaLauf` bekommt
  switch-case-Dispatch; `getAnlagenspiegelData` wird methoden-neutral
  gemacht (Helper `afaFuerJahr`); `planAbgang` erhält Sammelposten-
  Block + Unblock für indirekte Methode + `aufloesung_kum`-Rolle.
- `src/api/anlagen.ts` — `validate()` akzeptiert `gwg_sofort` +
  `sammelposten` als zulässige Methoden; Sammelposten-AK-Bereich
  wird hart geprüft.
- `src/pages/AnlagenVerzeichnisPage.tsx` — Dropdown-Optionen
  aktivieren, ND-Feld konditional disablen, methoden-spezifische
  Hinweis-Boxen mit Grenzwert-Warnungen, Live-Vorschau dispatched
  je Methode.
- Neu: `src/domain/anlagen/__tests__/GwgSammelposten.test.ts` (~18 Tests).
- Update: `src/domain/anlagen/__tests__/Abgang.test.ts` — alter
  „indirekte Methode → Fehler"-Test wird auf neue Logik umgeschrieben;
  +3 Indirekt-Tests + 1 GWG-Abgang-Test.
- Demo: `demo-input/musterfirma-2025/anlagegueter.csv` (+2 Zeilen).
- Docs: `docs/SPRINT-6-DECISIONS.md` Nachtrag; README-Abschnitt 14f.

Fazit Pre-Check: **kein Bereich > 70 %**. Echter Neubau für 3 Methoden
+ Abgangs-Erweiterung. Kein STOPP.

---

## 2. Rechtslage — Stand April 2026 (mit Paragraph-Zitaten)

### 2.1 GWG-Sofortabschreibung (§ 6 Abs. 2 EStG)

- **Grenze:** Anschaffungs-/Herstellungskosten ≤ **800 € netto** (ohne
  abzugsfähige Vorsteuer) pro selbständig nutzungsfähigem beweglichem
  Wirtschaftsgut des Anlagevermögens. Grundlage:
  > § 6 Abs. 2 S. 1 EStG: „Die Anschaffungs- oder Herstellungskosten
  > von abnutzbaren beweglichen Wirtschaftsgütern des Anlagevermögens
  > […] können im Wirtschaftsjahr der Anschaffung, Herstellung oder
  > Einlage des Wirtschaftsguts […] in voller Höhe als
  > Betriebsausgaben abgezogen werden, wenn die Anschaffungs- oder
  > Herstellungskosten […] für das einzelne Wirtschaftsgut 800 Euro
  > nicht übersteigen."

- **Historische Grenzen:** 410 € bis 31.12.2017; 800 € seit 1.1.2018.
  Altbestand kann noch nach alter Grenze abgeschrieben werden.
- **Buchungs-Semantik:** Voller AK-Betrag als Sofortaufwand im
  Anschaffungsjahr; Restbuchwert 0 am Jahresende; in Folgejahren
  keine AfA mehr.
- **Keine Änderung** der 800-€-Grenze bekannt für 2025/2026.

### 2.2 Sammelposten-Poolabschreibung (§ 6 Abs. 2a EStG)

- **Grenzen:** AK **> 250 € und ≤ 1.000 € netto**. Grundlage:
  > § 6 Abs. 2a S. 1 EStG: „Abweichend von Absatz 1 Nr. 1 können
  > […] die Aufwendungen für die Anschaffung oder Herstellung von
  > abnutzbaren beweglichen Wirtschaftsgütern des Anlagevermögens,
  > deren jeweilige Anschaffungs- oder Herstellungskosten 250 Euro,
  > aber nicht 1.000 Euro übersteigen, im Wirtschaftsjahr der
  > Anschaffung, Herstellung oder Einlage in einen Sammelposten
  > eingestellt werden […]"

- **Wahlrecht:** Pro Wirtschaftsjahr muss die Buchführung für **alle
  Wirtschaftsgüter** in der AK-Bandbreite 250,01 € – 800,00 €
  einheitlich entweder GWG oder Sammelposten wählen (§ 6 Abs. 2a
  S. 5 EStG). Für AK 800,01 € – 1.000 € ist nur Sammelposten
  zulässig.
- **AfA:** Linear über 5 Jahre, d. h. 20 % p. a. Grundlage:
  > § 6 Abs. 2a S. 2 EStG: „Der Sammelposten ist im Wirtschaftsjahr
  > der Bildung und den folgenden vier Wirtschaftsjahren mit jeweils
  > einem Fünftel gewinnmindernd aufzulösen."

- **Keine Monatsanteile:** Volle Jahresrate auch im Anschaffungsjahr.
- **Einzelabgänge bleiben unberücksichtigt:**
  > § 6 Abs. 2a S. 3 EStG: „Scheidet ein Wirtschaftsgut im Sinne des
  > Satzes 1 aus dem Betriebsvermögen aus, wird der Sammelposten
  > nicht vermindert."

  Das heißt: wenn eine einzelne Anlage aus dem Pool abgeht (Verkauf,
  Verschrottung), wird das **nicht** im Pool nachvollzogen — der
  Pool läuft unverändert in der 5-Jahres-Kadenz weiter.

### 2.3 Degressive AfA (§ 7 Abs. 2 EStG)

**Status April 2026: ausgelaufen** für Neuanschaffungen ab 1.1.2025.

Historische Aktivierungen:
- **1.1.2020 – 31.12.2022** (Zweites Corona-Steuerhilfegesetz,
  Wachstumsbeschleunigungsgesetz): 2,5-fach-lineare AfA,
  max. 25 % p. a.
- **1.4.2024 – 31.12.2024** (Wachstumschancengesetz 2024): 2-fach-
  lineare AfA, max. 20 % p. a.

Für Anschaffungen ab 1.1.2025: **nicht zulässig**. Grundlage:

> § 7 Abs. 2 S. 1 EStG (aktuell gültige Fassung): „Bei […]
> beweglichen Wirtschaftsgütern des Anlagevermögens, die nach dem
> 31. März 2024 und vor dem 1. Januar 2025 angeschafft oder
> hergestellt worden sind, kann der Steuerpflichtige statt der
> Absetzung für Abnutzung in gleichen Jahresbeträgen […] die
> Absetzung für Abnutzung in fallenden Jahresbeträgen bemessen."

Die Formulierung „nach dem 31. März 2024 und vor dem 1. Januar 2025"
ist zeitlich hart abgegrenzt — nach aktuellem Gesetzesstand keine
degressive AfA für Neuanschaffungen ab 1.1.2025.

**Bestandsanlagen:** Wirtschaftsgüter mit bereits begonnener
degressiver AfA (vor 1.1.2025 angeschafft) laufen weiter bis
Methodenwechsel (§ 7 Abs. 3 EStG: automatischer Wechsel auf lineare
AfA, wenn diese in einem Jahr höher wäre).

**Unsicherheit (flag):** Eine Wiedereinführung durch künftige
Konjunkturgesetze ist nicht ausgeschlossen. Quelle für laufende
Aktualisierung: `docs/ROADMAP.md` Deprecation-Watch.

### 2.4 Indirekte Brutto-Methode beim Abgang

Keine spezifische EStG-/HGB-Regelung — folgt dem allgemeinen
Buchungs-Prinzip des § 253 HGB und der HGB-§-284-Darstellung:

- **Direkte Netto-Methode:** AfA bucht Soll AfA-Aufwand / Haben
  Anlage-Konto → Anlage-Konto sinkt direkt auf Restbuchwert. SKR03-
  Standard, DATEV-Default.
- **Indirekte Brutto-Methode:** AfA bucht Soll AfA-Aufwand / Haben
  **Wertberichtigungs-Konto** (z. B. 0480 in firmen-eigener
  Konvention) → Anlage-Konto bleibt auf AK, kumulierte AfA separat.
  Erforderlich für vollständige HGB-§-284-Brutto-Darstellung.
- **Beim Abgang (indirekt):** Wertberichtigungs-Konto muss
  komplett auf Anlage-Konto aufgelöst werden, danach folgt der
  Abgang wie bei direkter Methode (Erlös-Ausbuchung + Gewinn/
  Verlust + USt).

---

## 3. Phasen-Plan

### Phase 1 — GWG Sofortabschreibung

**Ziel:** Sofortabschreibung für bewegliche GWG im Anschaffungsjahr.

**Betroffene Dateien:**
- `AfaCalculator.ts` +`berechneGwgAfa(input: AfaGwgInput): AfaLinearResult`
- `AnlagenService.ts` — `planAfaLauf` switch-case für `gwg_sofort`;
  `getAnlagenspiegelData` methoden-neutral
- `api/anlagen.ts` — `validate()` akzeptiert `gwg_sofort`
- `AnlagenVerzeichnisPage.tsx` — Dropdown enablen, ND lock = 1,
  Hinweis-Box mit AK-Warnung bei > 800 €
- `GwgSammelposten.test.ts` (neu)

**Erwartete Tests:** ~7
- 500 € Anschaffung Juli 2025 → 500 € AfA 2025, 0 € 2026
- 800 € an der Grenze → voll im Anschaffungsjahr
- Jahr vor Anschaffung → 0 / RBW = AK
- 850 € (über Grenze) → Calculator lässt durchrechnen (UI warnt),
  verifiziert dass keine harte Calculator-Grenze existiert
- AK ≤ 0 → Fehler
- planAfaLauf dispatch: GWG-Anlage in Anschaffungsjahr, keine in
  Folgejahren

**Risiken:**
- **Design-Entscheidung:** Calculator prüft **keine harte 800-€-
  Grenze**, damit Altbestand aus Vor-2018-Rechtslage (410 €-Grenze)
  abbildbar bleibt. UI liefert die Warnung.
- Alternative wäre harte Grenze + separates `gwg_alt`-Feld —
  verworfen wegen Komplexität.

**Reversibilität:** trivial.

---

### Phase 2 — Sammelposten-Poolabschreibung

**Ziel:** § 6 Abs. 2a EStG — Pool-AfA linear 5 Jahre, volle
Jahresrate im Erstjahr, keine Monatsanteile.

**Betroffene Dateien:**
- `AfaCalculator.ts` +`berechneSammelpostenAfa` mit harter Grenz-
  validierung (> 250 €, ≤ 1.000 €)
- `AnlagenService.ts` — Dispatch + `planAbgang`-Block für
  Sammelposten-Einzelabgänge (§ 6 Abs. 2a S. 3 EStG)
- `api/anlagen.ts` — `validate()` akzeptiert `sammelposten` + prüft
  AK-Bereich (zusätzliche Prüfung im Repo, nicht nur im Calculator,
  für UI-Sofort-Feedback beim Anlegen)
- `AnlagenVerzeichnisPage.tsx` — ND lock = 5, Hinweis-Box mit AK-
  Bereich-Warnung + Hinweis auf Einzelabgangs-Block
- Tests in `GwgSammelposten.test.ts`

**Erwartete Tests:** ~9
- 500 € Kauf 15.11. → 5 × 100 € (volle Jahresrate trotz spätem Kauf)
- 1.000 € Obergrenze → 5 × 200 €
- AK = 250,00 € → Fehler (muss > 250)
- AK = 1.001 € → Fehler (muss ≤ 1.000)
- Volle Jahresrate im Anschaffungsjahr
- Jahr N+5 und später → 0
- Restbuchwert pro Jahr
- planAfaLauf dispatch
- Anlagenspiegel-Aggregation nach 2 Jahren

**Risiken:**
- **Pool-Wahlrecht** (§ 6 Abs. 2a S. 5 EStG: entweder alle
  Wirtschaftsgüter zwischen 250-800 € als GWG ODER als Sammelposten)
  wird **nicht** systemweit erzwungen — Buchhalter-Verantwortung.
  Dokumentiert in README 14f und DECISIONS.
- **Einzelabgangs-Block** könnte überraschen — Fehlermeldung muss
  expliziten § 6 Abs. 2a S. 3 EStG-Hinweis + Escape-Hatch nennen
  (manuell buchen + Anlage löschen).

**Reversibilität:** trivial.

---

### Phase 3 — Degressive AfA: **NEIN-Entscheidung**

**Ziel:** Keine Calculator-Implementation. Dropdown-Option bleibt
disabled mit Klartext-Hinweis.

**Begründung (dokumentiert als Entscheidung 12):**
- Rechtslage April 2026: § 7 Abs. 2 EStG für Neuanschaffungen ab
  1.1.2025 ausgelaufen (siehe Abschnitt 2.3).
- Kanzlei-Nutzer mit Bestandsanlagen (vor 2025 angeschafft + noch
  laufende degressive AfA) sind Einzelfälle — können Buchungen
  manuell via JournalPage erfassen.
- Implementation würde ~150 Zeilen (`berechneDegressiveAfa` +
  Methodenwechsel-Logik § 7 Abs. 3 EStG) + ~8 Tests + UI-Ergänzungen
  erfordern.
- **Spec-Empfehlung bei Unklarheit:** NEIN / Platzhalter (zitiert
  aus Sprint-Auftrag).

**Risiken:**
- Nutzer mit Bestandsanlagen sehen nur einen Disabled-Dropdown-
  Eintrag. Mitigiert durch Hinweistext „§ 7 Abs. 2 EStG ausgelaufen
  31.12.2024 — für Bestandsanlagen bitte einzeln buchen".

**Reversibilität:** leicht — Wiederaufnahme in Zukunfts-Sprint, wenn
Gesetzgeber die Methode erneut einführt oder User echten Bedarf
meldet. Kein Bestandscode blockiert.

**Tests:** 0.

---

### Phase 4 — Indirekte Brutto-Methode beim Abgang

**Ziel:** Unblock der bisher geworfenen Fehlermeldung; saubere
Auflösung der kumulierten Wertberichtigung.

**Betroffene Dateien:**
- `AnlagenService.ts`:
  - `AbgangLineRolle` erweitert um `aufloesung_kum`
  - `planAbgang` Guard-throw entfernt, stattdessen:
    - Teil-AfA-Zeile bucht gegen `konto_abschreibung_kumuliert` (statt
      `konto_anlage`), wenn gesetzt
    - **Neue Auflösungs-Zeile:** `konto_abschreibung_kumuliert` soll /
      `konto_anlage` haben, Betrag = kumulierte AfA (AK − RBW)
    - Rest (Erlös / Gewinn / Verlust / USt) unverändert
- `Abgang.test.ts`:
  - Alter Test „indirekte Methode → Fehler" wird auf neue Logik
    umgeschrieben (legitime Behavior-Änderung per Sprint-Auftrag)
  - +3 Integrations-Tests für Indirekt-Methode

**Erwartete Tests:** 4 (inkl. 1 rewrite)
- Indirekte Methode mit Gewinn → alle 5 Zeilen + Soll/Haben-Check
  + Sum-Check auf 0440 Haben-Summe = AK
- Indirekte Methode mit Verlust → Verlust-Zeile bucht gegen 0440
  (Anlage-Konto), NICHT gegen Wertberichtigung
- Direkte Methode ohne `konto_abschreibung_kumuliert` → keine
  Auflösungs-Zeile (Regression)
- GWG-Abgang (Ergänzung aus Phase 1) → Teil-AfA 0, RBW 0

**Risiken:**
- **Bestehender Test modifiziert.** Per Spec-Auftrag explizit
  erlaubt: „legitime Spec-Änderung, kein Heimlich-Modifizieren".
  Dokumentiert als Entscheidung 13.
- **Buchungs-Symmetrie:** Nach Abgang müssen die Saldi auf
  `konto_abschreibung_kumuliert` und `konto_anlage` beide 0 sein.
  Test verifiziert 0440-Haben-Summe = 2.400 € = AK.

**Reversibilität:** mittel — Guard-throw zurück + Test zurück.

---

### Phase 5 — Demo + Dokumentation

**Betroffene Dateien:**
- `demo-input/musterfirma-2025/anlagegueter.csv` +2 Zeilen:
  - INV-2025-002 GWG Bürostuhl 350 € (01.04.2025)
  - INV-2025-003 Sammelposten Monitor 500 € (01.02.2025)
- `demo-input/musterfirma-2025/README.md` — neuer Schritt 14f mit
  Methoden-Tabelle + Buchungs-Schema für indirekte Methode
- `docs/SPRINT-6-DECISIONS.md` — Nachtrag mit 4 Entscheidungen
  (10-13)
- `docs/NEXT-CLAUDE-HANDOFF.md` — Last completed + Next Task Sprint 7

**Tests:** 0 (nur Doku + Demo).

---

## 4. Entscheidungs-Matrix

| Nr. | Entscheidung | Gewählt | Begründung | Reversibilität |
|---:|---|---|---|---|
| 10 | GWG-Calculator mit harter 800-€-Grenze? | **NEIN** — nur UI-Warnung | Altbestand-Kompatibilität (Vor-2018-Rechtslage 410 €) | leicht |
| 11 | Sammelposten mit harten Grenz-Fehlern? | **JA** (> 250 €, ≤ 1.000 €) | § 6 Abs. 2a S. 1 EStG ist eindeutig | leicht |
| 12 | Degressive AfA implementieren? | **NEIN** — Disabled-Platzhalter | § 7 Abs. 2 EStG ausgelaufen 31.12.2024; Spec-Fallback bei Unklarheit | leicht |
| 13 | Indirekte Methode Abgang: neue `aufloesung_kum`-Rolle? | **JA** (zusätzliche Zeile) | symmetrisch zur laufenden AfA, Buchungs-klar | mittel |

---

## 5. Scope-Grenzen

- **Hash-Kette unverändert** — weder journal_entries noch audit_log
  werden geändert.
- **Bestehende 910 Tests bleiben grün** — Ausnahme: 1 Abgang-Test
  wird per Sprint-Auftrag auf neue Logik umgeschrieben (Rewrite,
  nicht Deaktivierung; der Ersatz-Test verifiziert die neue
  Indirekt-Methode-Logik).
- **Migration:** Keine neue Migration, Schema 0025 reicht.
- **Keine neuen npm-Dependencies.**
- **TypeScript strict + Decimal.js durchgängig.**
- **Nicht in Scope:**
  - Degressive AfA (Phase 3 NEIN)
  - Teilabgänge via `parent_id` → Sprint 7
  - CSV-Import für Anlagenverzeichnis → Sprint 7
  - Kombinierter Jahresabschluss-PDF-Generator → Sprint 7
  - Sonder-AfA / Investitionszulagen → nicht in Sprint 6

---

## 6. Integration mit Teil 1 + 2a

Teil 2b ist **additiv**; Teil 1 + 2a bleiben unverändert:

- Migration 0025 (Teil 1) — kein neues Feld, kein neuer Constraint.
- `berechneLineareAfa` (Teil 1) — bleibt, wird von linearen Anlagen
  weiter genutzt.
- `planAfaLauf` (Teil 1) — bekommt switch-case, `linear` bleibt
  Default-Pfad.
- `getAnlagenspiegelData` (Teil 1) — wird methoden-neutral via
  Helper `afaFuerJahr`, Verhalten für linear-Anlagen unverändert.
- `planAbgang` (Teil 2a) — Guard-throw für indirekte Methode wird
  durch positive Logik ersetzt; Sammelposten-Anlagen werfen jetzt
  anstelle keinen-throw einen neuen, expliziteren Fehler mit
  EStG-Zitat.
- `AnlagenspiegelPage.tsx` (Teil 2a) — unverändert, nutzt weiter
  `getAnlagenspiegelData` und profitiert automatisch von GWG/
  Sammelposten-Anlagen.
- `AnlagenVerzeichnisPage.tsx` (Teil 1/2a) — minimal-invasiv:
  3 disabled-Optionen werden enabled bzw. bleiben disabled mit
  geändertem Hinweistext; ND-Feld wird konditional disabled;
  methoden-spezifische Hinweis-Boxen erscheinen je Auswahl; Live-
  Vorschau dispatched je Methode. **Kein bestehender Code-Pfad
  umgebaut.**

Tests aus Teil 1 + 2a bleiben alle grün (Verifikation durch
`npx vitest run` auf vollem Suite).

---

## 7. Test-Erwartung

| Phase | Ziel-Tests | Anmerkung |
|---|---:|---|
| Phase 1 GWG | ~7 | 5 Calculator + 2 Service-Dispatch |
| Phase 2 Sammelposten | ~9 | 7 Calculator + 2 Service-Dispatch + 0-1 Anlagenspiegel |
| Phase 3 Degressiv | 0 | keine Implementation |
| Phase 4 Indirekt Abgang | 4 | 3 neu + 1 Rewrite |
| **Summe** | **~20** | konservative Schätzung |
| **Gesamt-Erwartung** | **910 → ~930** | tatsächlich erreicht: 932 |

---

## 8. Rückblick nach Umsetzung (nachgetragen)

Tatsächlich erreichter Umfang (Stand: Implementierungs-Session):

- **22 neue Tests** (910 → 932; leichte Übererfüllung durch
  zusätzliche Anlagenspiegel-Aggregations-Tests und feinere
  Grenzwert-Checks).
- **4 Entscheidungen** final in `SPRINT-6-DECISIONS.md` dokumentiert
  (10-13, exakt wie in der Entscheidungs-Matrix geplant).
- **Keine Regression** in den 910 Ausgangs-Tests. Der eine
  umgeschriebene Abgang-Test wurde durch den Spec-Auftrag explizit
  legitimiert und durch einen semantisch reichhaltigeren Test
  ersetzt (verifiziert jetzt die `aufloesung_kum`-Logik statt der
  weggefallenen Throw-Bedingung).
- **Scope-Grenzen eingehalten:** kein neuer npm-Dep, keine
  Migration, Hash-Kette unberührt.
- **BilRUG-2015-Fix** (Mapping-Lücke 2800 + Seed-Labels) wurde
  **zwischen Teil 2a und Teil 2b** als separater Fix eingeschoben,
  nicht Teil dieses Plans. Dokumentiert in
  `SPRINT-6-DECISIONS.md` Entscheidung 9.

---

## 9. Freigabe

Status: **Genehmigt rückwirkend am 2026-04-20.**

Grundlage: Review der vollständigen Plan-Dokumentation durch
Projekt-Stakeholder.

Abweichungen vom Plan: 22 statt 20 Tests (+10 % Overshoot,
dokumentiert in Abschnitt 8).

Review-Punkte (abgehakt):

- **Pre-Check sauber dokumentiert** — 3 von 4 Bereichen Greenfield,
  1 Bereich (indirekte Methode) durch Guard-throw explizit
  vorbereitet aber blockiert. Neubau-Entscheidung korrekt.
- **Rechtslage-Recherche präzise** — § 6 Abs. 2 EStG (GWG 800 €),
  § 6 Abs. 2a EStG inkl. S. 3 (Pool-Einzelabgang-Block), § 7 Abs. 2
  EStG ausgelaufen 31.12.2024 nach Wachstumschancengesetz 2024,
  § 253 HGB / § 284 HGB für Brutto-Darstellung — alle korrekt.
- **Entscheidungen 10-13 nachvollziehbar** — Nr. 10 GWG ohne harte
  Grenze (Altbestand Vor-2018), Nr. 11 Sammelposten harte Grenzen
  (§ 6 Abs. 2a S. 1 EStG eindeutig), Nr. 12 Degressiv NEIN (Spec-
  Fallback bei Rechtsunklarheit), Nr. 13 `aufloesung_kum`-Rolle
  (symmetrisch zur laufenden AfA).
- **Test-Umfang** 22 statt 20 akzeptabler Overshoot.
- **BilRUG-2015-Fix** zwischen Teil 2a und Teil 2b korrekt als
  separater Eintrag in `SPRINT-6-DECISIONS.md` (Entscheidung 9)
  dokumentiert, nicht in diesem Plan vermischt.
