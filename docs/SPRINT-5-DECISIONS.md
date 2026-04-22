# Sprint 5 — Entscheidungsprotokoll (Ausziffern + Fuzzy-Matching + Skonto-Automatik, Option B)

Nach Phase-1-Bestandsaufnahme wurde **Option B: Gap-Closure im
bestehenden Bank-Reconciliation-Modul** gewählt. Kein Neuaufbau des
Fuzzy-Matchers, keine Schema-Änderung, keine Route-Verschiebung.

Bestandscode war zu ~70-80 % vorhanden:

- `src/utils/bankMatch.ts` — 128 Zeilen mit Scored-Candidates,
  4 Konfidenz-Stufen, Jaccard-Namen-Fuzzy, Beleg-Suche im
  Verwendungszweck, Richtungs-Plausibilität, `topMatches()`.
- `src/pages/BankReconciliationPage.tsx` — 890 Zeilen Split-Screen-UI
  an Route `/banking/reconciliation` mit Filter, Keyboard-Shortcuts,
  Beleg-Anforderung-Workflow.
- `BankImportPage.tsx` + MT940/CAMT-Parser.
- `journal_entries.skonto_pct` + `.skonto_tage` als Schema-Felder.
- `BelegValidierungsService` warnt bei Skonto > 5 %.

Die echten Lücken waren drei:

1. **Keine Unit-Tests für `bankMatch.ts`** (0 Testdateien).
2. **Keine Skonto-Automatik** beim Zahlungsabgleich (nur 1-Zeilen-
   Buchung, keine automatische Splittung in Zahlung + Skonto-Netto +
   USt-Korrektur).
3. Keine Demo-Bank-Datei, um das End-to-End-Erlebnis zu zeigen.

Ergebnis: +39 neue Tests (22 bankMatch + 11 skontoCalculator + 6 CSV-
Skonto), 814 → **853 Tests grün**. Ein neues pure-domain-Modul
`src/domain/bank/skontoCalculator.ts` und eine minimale UI-Ergänzung
in `BankReconciliationPage.tsx`. Demo-MT940 mit 7 Szenarien.

---

## Entscheidung 1: Derived-Fuzzy-Matcher behalten — keine Umstrukturierung

**Kontext:** Spec wünschte einen `FuzzyMatcher`-Class mit Levenshtein-
Distance, Konfidenz-Score 0-100 und Regex-Extraktion der Beleg-Nr.
Bestandscode verwendet Jaccard-Token-Overlap, Score 0..1, und
Normalize-Substring-Suche.

**Optionen:**
- A) Spec-konformer Umbau: `FuzzyMatcher`-Klasse mit Levenshtein
  + Score 0-100 + Regex-Extraktion + Refactor von
  `BankReconciliationPage` auf neue API.
- B) Bestand behalten, nur Lücken schließen (Tests + Skonto +
  Demo).
- C) Parallel beide: alte API für BankReconciliationPage, neue
  Klasse für zukünftige Nutzer.

**Gewählt:** B.

**Begründung:**
- **Funktionale Äquivalenz:** Jaccard-Token-Overlap ist für kurze
  Gegenseiten-Namen (2-5 Wörter) in der Qualität mit Levenshtein
  vergleichbar. Levenshtein wäre besser bei Zeichen-Tippfehlern, aber
  bei Bank-Verwendungszwecken dominieren Abkürzungen und
  Wortumstellungen, die Jaccard besser erfasst.
- **Risiko-Minimierung:** Ein Umbau der Match-Logik hätte
  Regressionen in den bisherigen (ungetesteten) Match-Entscheidungen
  erzeugen können, ohne Gewinn — das Feature lief seit Monaten ohne
  Beschwerden.
- **Score-Scale:** 0..1 ist in der UI bereits konsistent
  („[exakt · 1.00]"-Anzeige). 0-100 wäre ein reiner Formatwechsel
  ohne semantischen Gewinn.
- **Beleg-„Regex":** Der existierende `normalize`-Ansatz
  (Kleinschreibung + Sonderzeichen-Strip + `includes`) ist effektiv
  identisch zu einem Regex-Match für die praktisch vorkommenden
  Beleg-Nr-Formate (AR-2025-001, R-2025/042, ER 2025 006). Kein
  Regex-Engine nötig.

**Auswirkung:** `src/utils/bankMatch.ts` unverändert, nur mit 22
Unit-Tests abgesichert.

**Reversibilität:** Trivial — die Tests fixieren die Verhaltens-
Kontrakte; ein späterer Levenshtein-Refactor kann die Tests übernehmen
und muss lediglich dieselben Ergebnisse produzieren.

---

## Entscheidung 2: Skonto-Automatik als getrenntes pure-domain-Modul

**Kontext:** Die Skonto-Splittung (Zahlung + Skonto-Netto +
USt-Korrektur) ist eine reine Rechenlogik. Spec forderte Integration
in `BankReconciliationPage.tsx`.

**Optionen:**
- A) Skonto-Logik direkt in `BankReconciliationPage.tsx`
  (~100 LOC).
- B) Separates Domain-Modul `src/domain/bank/skontoCalculator.ts`
  mit pure-functions, Page nutzt es nur.
- C) Skonto-Logik in `src/utils/bankMatch.ts` (Matcher erweitert).

**Gewählt:** B.

**Begründung:**
- **Testbarkeit:** Pure functions ohne React/Supabase/MSW lassen
  sich direkt in vitest prüfen. 11 Skonto-Tests laufen in < 20 ms.
- **GoBD-Dokumentations-Nähe:** Der Calculator kann ohne UI-Kontext
  fachlich geprüft werden — wichtig für spätere Betriebsprüfer-
  Nachvollziehbarkeit (SKR03-Konten-Mapping, Frist-Prüfung,
  Rundungs-Schwelle).
- **Trennung:** Der Matcher bleibt reiner Matcher. Der Calculator
  bleibt reiner Calculator. Kein Über-das-Knie-Brechen einer
  Zuständigkeit.

**Auswirkung:** Neue Datei `src/domain/bank/skontoCalculator.ts`
(~190 Zeilen), neue Testdatei (~280 Zeilen, 11 Tests).
`BankReconciliationPage` erhält nur Helper `findSkontoPlanFor` +
Mutation `postSkontoM` + Preview-Section + Button (~80 Zeilen).

**Reversibilität:** Trivial.

---

## Entscheidung 3: Kein Auto-Buchen — Skonto nur auf explizite User-Bestätigung

**Kontext:** Spec forderte „User muss explizit bestätigen (kein
Auto-Buchen)". Technisch wäre eine stille automatische Buchung
möglich.

**Gewählt:** Vollständig manuelles Aufrufen des Skonto-Buchungs-
Flows: Button *"Mit Skonto buchen (N Zeilen)"* wird nur neben dem
Standard-Button angezeigt, wenn der Calculator `applicable: true`
zurückgibt. Der Nutzer entscheidet pro Bank-Zeile, ob die
Skonto-Splittung oder eine einfache 1-Zeilen-Buchung erzeugt wird.

**Begründung:**
- **GoBD-Transparenz:** Jeder Buchungsakt geht auf eine
  nachvollziehbare Nutzer-Aktion zurück. Der Audit-Log verknüpft den
  Buchungs-Klick mit der erzeugten 2-3-Zeilen-Gruppe.
- **Praxis-Sicherheit:** Skonto-Entscheidungen sind gelegentlich
  strittig (Frist überschritten, Rechnungs-Skontosatz nicht
  vereinbart, kulante Akzeptanz trotz Frist-Überschreitung).
  Auto-Buchen würde diese Randfälle erzwingen.
- **UI-Signal:** Die Preview-Tabelle zeigt dem Buchhalter die
  Zahlen, bevor er bucht — er kann auf einen Blick sehen, welches
  Skonto-Konto (8730/8731/3730/3736) und welches USt-Konto (1776/
  1771/1576/1571) verwendet wird.

**Auswirkung:** Preview-Section oberhalb der Action-Buttons,
Skonto-Button nur bei `applicable === true`. Code in
`BankReconciliationPage.tsx` Lines 732-782 (ungefähre Position nach
Edit).

**Reversibilität:** Trivial.

---

## Entscheidung 4: SKR03-Skonto-Konten — Bestandsnutzung plus drei Ergänzungen

**Kontext:** Spec nannte 8730 (gewährte Skonti 7 %), 8736 (gewährte
Skonti 19 %), 3730 (erhaltene Skonti 7 %), 3736 (erhaltene Skonti
19 %). Bestandscode in `src/api/skr03.ts` hatte nur `8730` (mit
`ust_satz = 19`) als einzigen Skonto-Konto-Eintrag.

**Gewählt:** Minimale Schemasicherung:
- `8730` bleibt als „Gewährte Skonti 19 %" (Label präzisiert, USt
  unverändert) — kein Breaking Change für eventuell bereits gebuchte
  Daten.
- **Neu ergänzt:** `8731` (Gewährte Skonti 7 %), `3730` (Erhaltene
  Skonti 7 %), `3736` (Erhaltene Skonti 19 %).
- Calculator mapping:
  - 7 % Forderung → `8731`
  - 19 % Forderung → `8730`
  - 7 % Verbindlichkeit → `3730`
  - 19 % Verbindlichkeit → `3736`
  - USt 19 % (Ausgangs) → `1776` / (Eingangs Vorsteuer) → `1576`
  - USt 7 % (Ausgangs) → `1771` / (Eingangs Vorsteuer) → `1571`

**Abweichung von der Spec:** Spec nannte `8736` für gewährte Skonti
19 %. Bestandscode nutzt `8730` für diese Rolle. **Code bleibt bei
`8730`**, damit keine existierenden 8730-Buchungen inkonsistent
werden. Der kalkulatorische Unterschied ist null.

**Begründung:** DATEV-SKR03-Doku kennt beide Nummerierungs-
Konventionen (Standard vs. regionale Varianten). Die Korrekturen an
der Spec sind dokumentiert; die 8730/8731-Wahl in diesem Code ist
stabil.

**Auswirkung:** 3 neue Zeilen in `src/api/skr03.ts` (8731, 3730,
3736). Bestehende 8730-Row wurde im Label präzisiert (19 %).

**Reversibilität:** Trivial — Entfernen der 3 neuen Zeilen rückgängig.

---

## Entscheidung 5: CSV-Import um optionale Skonto-Spalten erweitert (11-Spalten-Variante)

**Kontext:** Ohne Skonto-Metadaten am Rechnungsbeleg kann die
Skonto-Automatik nicht anspringen. Die Musterfirma-Demo-CSV hatte
keine Skonto-Felder. Drei Optionen standen zur Wahl:

- A) Nur über BelegerfassungPage/JournalPage manuell setzen, Demo
  benötigt einen manuellen Zwischenschritt.
- B) CSV-Import um 2 optionale Spalten erweitern (10. skonto_pct,
  11. skonto_tage), parallele Rückwärtskompatibilität zu 7/8/9
  Spalten.
- C) Zusätzliches seeding-Skript für skonto-behaftete Demo-Einträge.

**Gewählt:** B.

**Begründung:**
- **Bestehende Header-Varianten** (7/8/9) folgen bereits demselben
  Muster: optional hinzugefügte Dimensionen ohne Breaking Change.
  Die 11-Variante ist eine natürliche Fortsetzung.
- **End-to-End-Demo** ist ein wesentlicher Sprint-Wert. Ohne
  Skonto-Metadaten auf dem Rechnungs-Beleg wäre der Skonto-Button
  im Demo-MT940 unsichtbar — der Nutzer hätte die Automatik nur
  hypothetisch erlebt.
- **Scope-Kosten sind klein:** csvImport.ts +~40 Zeilen,
  JournalCsvImportPage +2 Zeilen, 6 neue CSV-Tests.

**Auswirkung:**
- `ParsedRow` um `skonto_pct: number | null` und `skonto_tage:
  number | null` ergänzt.
- `EXPECTED_HEADER_WITH_SKONTO` neu exportiert (11 Spalten).
- Header-Detection akzeptiert jetzt 7/8/9/11 Spalten. 10 bleibt
  bewusst nicht definiert (Einzelspalten-Ergänzung unlogisch).
- Validierung: `skonto_pct` > 0 und ≤ 100 (deutsches Zahlenformat),
  `skonto_tage` positive Ganzzahl. Beide zusammen gesetzt oder beide
  leer; Inkonsistenz-Fall → Warning, beide auf null.
- DATEV-EXTF-Importer (`DatevExtfImporter.ts`) liefert weiterhin
  `skonto_pct: null, skonto_tage: null` — DATEV 510 hat keine
  analogen Felder, die Unterstützung bleibt CSV-exklusiv.

**Reversibilität:** Trivial — 11-Variante entfernen, Tests
zurücksetzen, keine vorhandenen Buchungen sind betroffen.

---

## Entscheidung 6: Demo-Bankauszug als MT940 statt CSV

**Kontext:** Spec forderte `demo-input/musterfirma-2025/bankauszug.
csv`, gemeint als Bank-Bewegungs-Datei. Problem: Bestandscode hat
**keinen CSV-Bank-Parser**. `parseBankFile()` dispatched auf MT940
(Text) oder CAMT (XML); CSV würde stillschweigend als MT940
geparst und leer liefern.

**Gewählt:** MT940-Format (`bankauszug.mt940`).

**Begründung:**
- MT940 ist das Standardformat der Deutschen Kreditwirtschaft für
  Kontoauszüge; jede deutsche Bank liefert es. Für eine realistische
  Demo passend.
- Ein neuer CSV-Bank-Parser wäre ein eigener Scope-Punkt mit
  Format-Festlegung (welche Spalten? Semikolon oder Komma?) und
  6-10 neuen Tests — sprengt Sprint 5.
- Der MT940-Demo-Auszug zeigt **alle 7 Szenarien** (exact, skonto,
  kein Match, Direktbuchung) identisch zu dem, was ein CSV geliefert
  hätte.

**Abweichung von der Spec:** Datei heißt `bankauszug.mt940` statt
`bankauszug.csv`. Dokumentarischer Hinweis in der Musterfirma-
README; für einen zukünftigen Sprint bleibt „CSV-Bank-Parser"
als optionaler Kandidat.

**Auswirkung:** `demo-input/musterfirma-2025/bankauszug.mt940` (27
Zeilen, 7 Transaktionen, Eröffnungs- und Schlussbestand konsistent).
README-Abschnitt 14c dokumentiert das erwartete Matcher-/Skonto-
Verhalten pro Zeile.

**Reversibilität:** Trivial.

---

## Entscheidung 7: UI-Integration minimalinvasiv

**Kontext:** Spec erlaubte „kleine UI-Ergänzung, keine
Umstrukturierung" an `BankReconciliationPage.tsx` (890 Zeilen).

**Gewählt:**
1. Import + Helper `findSkontoPlanFor` (pure function außerhalb der
   Komponente).
2. Zusätzliche Mutation `postSkontoM` — erzeugt 2-3 Journal-Einträge
   mit identischer Beleg-Nr über `createEntry` in sequenzieller
   Reihenfolge (Zahlung → Skonto-Netto → USt-Korrektur).
3. `useMemo`-basierte Ableitung `activeSkontoPlan` für die aktive
   Zeile.
4. In `ActiveRowPanel`: neue Preview-Section `.reconc__skonto`
   (Header + Summen-Zeile + 3-spaltige Vorschau-Tabelle) und neuer
   Button *"Mit Skonto buchen (N Zeilen)"* neben dem bestehenden
   *„Buchen"*-Button.
5. Im Standardfall (`skontoPlan.applicable === false`) bleibt die
   Oberfläche unverändert. Der Button und die Preview erscheinen nur
   konditional.

**Begründung:** Nutzer ohne Skonto-Szenarien sehen keine UI-Änderung.
Nutzer mit Skonto-Szenarien erhalten den zusätzlichen Pfad ohne dass
der Standard-Pfad verändert wird.

**Auswirkung:** `BankReconciliationPage.tsx` wächst von 890 auf
~980 Zeilen. Alle bestehenden 3 Buttons (Buchen, Überspringen, Beleg
anfordern) funktionieren unverändert. CSS erhält minimalen Zuwachs
(`.reconc__skonto` + `.reconc__skonto-table`).

**Reversibilität:** Trivial — Hunks rückgängig ergibt den Sprint-4-
Stand.

---

## Phasen-Abschluss

A (Pre-Check) → B1 (22 bankMatch-Tests) → B2 (11 skontoCalculator-
Tests + Integration) → B3 (Demo-MT940 + CSV-Erweiterung + 6 CSV-
Skonto-Tests) → B4 (Doku + Handoff) durchlaufen.

- tsc clean (nach einem einmaligen DatevExtfImporter-Fix für die neuen
  Pflichtfelder in `ParsedRow`).
- vitest 56 Dateien, **853 Tests grün** (814 → +39).
- Keine bestehende Buchungs-, Audit- oder Hash-Kette-Logik berührt.
- Keine neuen npm-Dependencies.

Die bewussten Abweichungen von der Spec (Jaccard statt Levenshtein,
Score 0..1 statt 0-100, `/banking/reconciliation` statt
`/bank/ausziffern`, `8730`/`8731` statt `8730`/`8736`,
`bankauszug.mt940` statt `.csv`) sind in den Entscheidungen 1, 4 und
6 oben dokumentiert und waren bereits in der Sprint-5-Abstimmung vom
User explizit bestätigt.
