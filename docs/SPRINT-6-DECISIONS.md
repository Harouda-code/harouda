# Sprint 6 Teil 1 — Entscheidungsprotokoll (Anlagenverzeichnis + lineare AfA)

Nach Phase-1-Bestandsaufnahme: **echter Neubau**. Im Gegensatz zu
Sprints 3–5 waren keine versteckten Bestandsteile vorhanden — nur
SKR03-Konten für Anlagenvermögen und AfA-Aufwand, sowie eine einzelne
hand-gerollte AfA-Buchung im Demo. Kein `AfaCalculator`, kein
`AnlagenService`, keine `anlagegueter`-Tabelle, keine UI.

---

## Entscheidung 0: Scope-Split Teil 1 ↔ Teil 2

**Kontext:** Der ursprüngliche Sprint-6-Spec enthielt ~4× den Umfang
bisheriger Sprints (Migration + Domain + 4 UI-Seiten + Integration +
30-40 Tests + Demo). Realistisch in einer Session lieferbar wäre
nicht alles.

**Gewählt (nach User-Rückfrage):** Reduzierter Teil-1-Scope PLUS
`getAnlagenspiegelData()` als reine Daten-Quelle (ohne UI).

**In Teil 1:**
- Migration 0025 (anlagegueter + afa_buchungen)
- Types + Repo + AfaCalculator + AnlagenService
- UI: Anlageverzeichnis + AfA-Lauf
- ~35 Tests (Calculator + Service)
- Demo-CSV + README-Abschnitt
- `getAnlagenspiegelData()` als Service-Methode + 1 Aggregation-Test

**Cut auf Teil 2 (Sprint 7):**
- Anlagenspiegel-UI `/berichte/anlagenspiegel` + PDF/Excel-Export
- Jahresabschluss-PDF-Erweiterung (Anlagenspiegel als Seite)
- Abgangs-Workflow (Verkauf/Verschrottung mit Erlös-Buchung)
- Excel-like Live-AfA-Vorschau im Anlage-Formular
- Degressive AfA, GWG (§ 6 Abs. 2 EStG), Sammelposten (§ 6 Abs. 2a)
- Sonder-AfA

**Ergebnis:** 35 Tests, 2 UI-Routen + Service-API, Migration 0025
(53 Zeilen), 888 Tests grün (853 → +35).

---

## Entscheidung 1: Direkte Netto-Methode als SKR03-Default, Brutto-Methode optional pro Anlage

**Kontext:** User-Frage im Sprint-Spec:

> „Konto 0480 'Abschreibungen kumuliert' getrennt vom Anlage-Konto
> ODER direkte Bestandsminderung — das ist eine SKR03-Design-
> Entscheidung."

Beide Methoden sind HGB-/steuerrechtlich zulässig:

- **Direkte Methode (Netto):** AfA 4830 soll / 0440 haben → das
  Anlage-Konto sinkt direkt auf den Restbuchwert. Kumulierte AfA ist
  nicht auf einem eigenen Konto, sondern ergibt sich aus
  `AK − Saldo` bzw. aus der afa_buchungen-Historie.
- **Indirekte Methode (Brutto):** AfA 4830 soll / 0480 (Wert-
  berichtigung) haben → Anlage-Konto bleibt auf AK, kumulierte AfA
  separat. Erforderlich, wenn HGB-§-284-Anlagenspiegel in Brutto-
  Darstellung geführt wird.

**Gewählt:** Direkte Netto-Methode als Default (SKR03-Konvention,
DATEV-Standard, auch für kleine Kanzleien die einfachere Wahl).

Indirekte Brutto-Methode ist **pro Anlage konfigurierbar** via
`konto_abschreibung_kumuliert`-Feld (nullable) im Schema — wenn
gesetzt, bucht die AfA gegen dieses Konto statt gegen
`konto_anlage`.

**Begründung:**
- SKR03 kennt explizit `0480` als „Geringwertige Wirtschaftsgüter
  (GWG)" — **nicht** als „kumulierte AfA". Wer Brutto will, verwendet
  ein Firmen-eigenes Wertberichtigungs-Konto.
- Die direkte Methode vereinfacht die Belegabgleichs- und Bilanz-
  Auswertung: Konto-Saldo ≡ Restbuchwert.
- Der Anlagenspiegel (§ 284 HGB) lässt sich aus der afa_buchungen-
  Historie auch bei direkter Methode exakt rekonstruieren — die
  Brutto-Darstellung ist kein Schema-, sondern ein Reporting-
  Problem.

**Auswirkung:** Migration 0025 hat `konto_abschreibung_kumuliert
text null`. AfaCalculator + Service sind methoden-neutral:
`haben_konto = konto_abschreibung_kumuliert || konto_anlage`.

**Reversibilität:** Trivial — Default bleibt direkt; wer Brutto-
Methode nachrüsten will, setzt das Feld einfach.

---

## Entscheidung 2: AfA monatsgenau (keine Halbjahres-Regel)

**Kontext:** § 7 Abs. 1 S. 4 EStG (in der Fassung seit 2004) verlangt
eine **monatsgenaue pro-rata-temporis-Berechnung** für
Anschaffungen/Herstellungen von beweglichen Wirtschaftsgütern.
Die bis 2003 alternativ zulässige Halbjahres-/Ganzjahresregel (volle
Jahres-AfA bei Kauf im 1. Halbjahr, halbe bei Kauf im 2. Halbjahr)
ist **abgeschafft**.

**Gewählt:** Monatsgenaue Berechnung ab Anschaffungsmonat.

**Begründung:**
- Spec-Vorgabe explizit: „Halbjahresregel bis 2003 NICHT anwenden".
- Konsistent mit dem geltenden Steuerrecht seit 20 Jahren.
- Beispiel: Kauf 15.03. → 10 AfA-Monate im Erstjahr (März–Dez).

**Implementierung:** `erstjahr_monate = 13 − anschaffungs_monat` im
Calculator, also März = 10, April = 9, ..., Dezember = 1.

---

## Entscheidung 3: Rundungs-Drift-Korrektur im letzten AfA-Jahr

**Kontext:** Bei rundungs-anfälligen Konstellationen (z. B. AK 10.000
/ ND 3 / Kauf April = Monats-AfA 277,77...) driftet die Summe der
gerundeten Jahres-AfA pro Jahr von der kumulierten Monats-AfA ab:

- 2025 (9 Monate): 277,77 × 9 = 2.500,00 (exakt)
- 2026 (12): 3.333,33 (gerundet von 3.333,33…)
- 2027 (12): 3.333,33
- 2028 (3): **830,33 → 833,34** (nicht 833,33 per Monats-Rechnung)

Die Rundungs-Konvention entscheidet, ob die Summe exakt AK = 10.000,00
oder AK − 0,01 oder AK + 0,01 beträgt.

**Gewählt:** Im regulären letzten AfA-Jahr wird `AfA = AK − Summe der
bereits gebuchten Jahres-AfA-Beträge` berechnet, jedes vorherige Jahr
einzeln auf 2 Stellen gerundet. Damit beträgt die Summe **exakt AK**,
ohne Restpenny.

**Begründung:**
- Steuerrechtlich stabiler: Restbuchwert am Nutzungsdauer-Ende ist
  genau 0 (oder 1 € bei Erinnerungswert-Option).
- Betriebsprüfung-konform: keine Rundungs-Residuen, die Diskussionen
  auslösen.

**Auswirkung:** `berechneLineareAfa` im letzten Jahr iteriert intern
über Vorjahre, summiert die Rundung-je-Jahr-Beträge. Der Test
`Drift-Korrektur bei rundungs-anfälligen Konstellationen` deckt das
ab.

---

## Entscheidung 4: 1 €-Erinnerungswert optional, Default aus

**Kontext:** Im deutschen Rechnungswesen verbreitet, dass abgeschriebene
aber weiter genutzte Anlagen mit 1 € Erinnerungswert im Bestand
bleiben. Die tatsächliche Ausbuchung folgt erst bei Verkauf /
Verschrottung.

**Gewählt:** `erinnerungswert: boolean` als optionaler Parameter
am Calculator. Default: `false` (Restbuchwert = 0 am Ende der ND).

**Begründung:**
- Das Sprint-Spec-Beispiel rechnet mit 0 am Ende (2030 = 333,33).
- Wer den 1 €-Erinnerungswert will, setzt den Parameter explizit.
- Auto-Aktivierung wäre riskant: viele Kanzleien führen vollständig
  abschreibende Anlagen ohne Erinnerungswert, und die Anlage wird
  direkt beim Nutzungs-Ende ausgebucht.

**Auswirkung:** Parameter-Flag im Calculator. UI-Formular enthält es
(noch) nicht — kann in Teil 2 ergänzt werden, falls gewünscht.

---

## Entscheidung 5: `planAfaLauf` + `commitAfaLauf` statt Auto-Lauf

**Kontext:** Spec forderte „User muss explizit bestätigen (keine
Auto-Buchung)".

**Gewählt:** Zwei getrennte Funktionen:
- `planAfaLauf(jahr, gueter): AfaLaufPlan` — pure, liefert Plan-
  Zeilen + Warnungen + Summen. Keine I/O.
- `commitAfaLauf(plan): Promise<{createdJournal}>` — bucht den
  Plan (oder ein Subset davon).

**UI-Workflow:** Jahr wählen → Plan-Tabelle anzeigen → „Erzeugen"-
Button mit `confirm()`-Dialog.

**Begründung:**
- GoBD-Nachvollziehbarkeit: Audit-Log zeigt „AfA-Lauf 2025 bestätigt:
  6 Buchungen" als ein klar zuordenbarer Akt.
- Idempotenz: `commitAfaLauf` nutzt `saveAfaBuchung` mit Upsert —
  erneuter Lauf aktualisiert bestehende afa_buchungen-Einträge,
  erzeugt aber **keine Doppel-Journal-Einträge**, weil die UI-
  Vorfilterung `schonGebucht` anzeigt und nur die noch offenen Lines
  in `commit` weiterleitet.
- Korrigierbarkeit: Solange der Journal-Eintrag nicht festgeschrieben
  ist, kann die AfA pro Anlage korrigiert werden (über Storno +
  Neu-Lauf, analog zu allen anderen Buchungen).

---

## Entscheidung 6: Demo-Anlagen manuell via UI, kein CSV-Import-Endpunkt

**Kontext:** `anlagegueter.csv` im Demo-Paket ist eine Referenz-
Tabelle. Sollte sie per CSV-Import direkt in die App übertragbar sein
(analog `buchungen.csv`)?

**Gewählt:** **Nein in Teil 1.** CSV ist Dokumentation, Nutzer legt
manuell über die Verzeichnis-UI an.

**Begründung:**
- Ein CSV-Anlagen-Import würde eigene Validierung (inv_nr
  Uniqueness, Konten-Existenz, Nutzungsdauer-Range) erfordern, die
  über `createAnlagegut`-Validate hinaus CSV-spezifisch sein müsste.
- Das Anlagenverzeichnis ist typischerweise ein einmaliges Setup
  oder langsam wachsend — manuelle Erfassung ist akzeptabel.
- In Teil 2 oder einem späteren Sprint kann ein CSV-Import leicht
  ergänzt werden (Pattern: ähnlich `JournalCsvImportPage`).

**Auswirkung:** `anlagegueter.csv` dokumentiert Inventar-Nr / Felder
/ erwartete AfA-Werte. Die Spalten entsprechen der UI-Form.

---

## Entscheidung 7: Anlagenspiegel-Daten als Pure-Service-Aggregator, UI erst in Teil 2

**Kontext:** User-Zusatz: `getAnlagenspiegelData()` als reine
Daten-Quelle implementieren, ohne UI.

**Gewählt:** Pure function im Service, mit klar strukturiertem
`AnlagenspiegelData`-Typ:

```
gruppen: AnlagenspiegelGruppe[]   // je konto_anlage
totals:  AnlagenspiegelGruppe     // aggregiert
```

Pro Gruppe: `ak_start`, `zugaenge`, `abgaenge`, `ak_ende`,
`abschreibungen_kumuliert`, `buchwert_start`, `buchwert_ende`.

**Invariante (per Test abgesichert):**

```
buchwert_ende == ak_ende − abschreibungen_kumuliert
```

**Begründung:**
- HGB § 284 Anlagenspiegel verlangt genau diese Zeilen-Struktur
  (pro Anlagengruppe).
- Ohne UI zu liefern spart ~400 Zeilen Page-Code + PDF-Hook + Excel-
  Export; die Daten sind trotzdem verfügbar und die Kern-Rechen-
  Invariante ist getestet.
- In Teil 2 wird die UI bauen: sie ruft `getAnlagenspiegelData(jahr,
  gueter)` und rendert Tabelle + PDF/Excel-Export, ohne neue Domain-
  Logik zu benötigen.

**Auswirkung:** Service-Methode + Typ exportiert, 1 dedizierter Test
(`Invariante buchwert_ende == ak_ende − abschreibungen_kumuliert`).

---

## Phasen-Abschluss

1. Migration 0025 (106 Zeilen, 2 Tabellen + RLS-Policies)
2. Types in `src/types/db.ts` (+60 Zeilen)
3. `src/api/anlagen.ts` (Repo, 240 Zeilen, Dual-Mode)
4. `src/domain/anlagen/AfaCalculator.ts` (pure, 220 Zeilen)
5. `src/domain/anlagen/AnlagenService.ts` (300 Zeilen)
6. **21 AfaCalculator-Tests grün** (Stop 1)
7. **14 AnlagenService-Tests grün** (Stop 2)
8. UI `AnlagenVerzeichnisPage.tsx` + `AfaLaufPage.tsx` (+ Routes + AppShell-Menü)
9. Demo-CSV `anlagegueter.csv` + README-Abschnitt 14d
10. SPRINT-6-DECISIONS.md + NEXT-CLAUDE-HANDOFF.md + CLAUDE.md

- tsc clean
- **888 Tests grün** (853 → +35)
- Keine bestehende Buchungs-, Audit- oder Hash-Kette-Logik berührt
- Keine neuen npm-Dependencies

Spec-Abweichungen bzw. bewusst in Teil 2 verschoben:
- Anlagenspiegel-UI, Jahresabschluss-PDF-Integration
- Abgangs-Workflow mit Erlös-Buchung
- Excel-like Live-AfA-Vorschau im Formular
- Degressiv / GWG / Sammelposten
- CSV-Import für Anlagenverzeichnis

---

# Teil 2a Nachtrag — Anlagenspiegel + Abgang + Live-Vorschau

Teil 2a baut auf der Teil-1-Grundlage auf (Migration 0025, Calculator,
Service mit `getAnlagenspiegelData`). Keine Schema-Änderung; keine
neue Migration.

**Autonome Entscheidungen:** Siehe
[`SPRINT-6-TEIL-2A-FRAGEN.md`](./SPRINT-6-TEIL-2A-FRAGEN.md) mit 7
dokumentierten Fragen, die im Nacht-Modus selbstständig entschieden
wurden (Jahresabschluss-PDF-Variante B, USt bei Abgang Option C, Split
in 2-4 Buchungen, SKR03-Konten 2700/2800, Scroll-Container für Live-
Vorschau, natürliche Zeit-Reihenfolge in Anlagenspiegel-Tabelle,
Inline-Formular statt Modal).

**Teil-2a-Deliverables:**

1. **Anlagenspiegel-UI** `/berichte/anlagenspiegel` mit Tabelle
   pro Konto-Gruppe + Totals + PDF (A4 Querformat) + Excel (XLSX).
2. **AnlagenspiegelPdfGenerator** (`src/lib/pdf/`) — 9 Spalten im
   HGB-§-284-Layout, DIN-konforme Meta-Zeile, Totals hervorgehoben.
3. **AnlagenspiegelExcelExporter** (`src/lib/excel/`) via ExcelJS
   (bereits in package.json, aber bisher ungenutzt) — erste Nutzung
   der Excel-Dependency im Projekt.
4. **Jahresabschluss-Integration** in `JahresabschlussPage.tsx`:
   Summary-Sektion + Link + JSON-Export erweitert. Kein kombinierter
   Jahresabschluss-PDF-Generator (siehe Frage 1 in FRAGEN.md).
5. **Abgangs-Workflow:**
   - `planAbgang(anlage, input)` pure function in `AnlagenService.ts`
   - `buchtAbgang(plan)` erzeugt 2-4 Journal-Einträge + afa_buchungen
     + `patchAnlageRaw`-Aufruf (aktiv=false + abgangsdatum +
     abgangserloes).
   - UI-Abgangs-Button + Inline-Formular + Live-Plan-Vorschau in
     `AnlagenVerzeichnisPage.tsx`.
   - SKR03-Konten 2700 (Außerordentliche Erträge) für Gewinn, 2800
     (Außerordentliche Aufwendungen) für Verlust/Verschrottung. USt-
     Split auf 1776 (19 %) / 1771 (7 %).
   - Beschränkung: nur direkte Netto-Methode, nur lineare AfA-
     Methode. Brutto-Methode bzw. nicht-lineare Anlagen werfen
     explizite Fehler.
6. **Live-AfA-Vorschau** im Neu-Anlage-Formular: scrollbare Tabelle
   Jahr / AfA / Kumuliert / Restbuchwert über gesamte ND, sobald
   AK > 0 + ND 1..50 + gültiges Datum. Live-Neuberechnung bei jeder
   Feld-Änderung via `useMemo`.
7. **Repo-Erweiterung:** `patchAnlageRaw` für Abgangs-Felder
   (`aktiv`, `abgangsdatum`, `abgangserloes`), die `updateAnlagegut`
   nicht zulässt.
8. **20 neue Tests** (888 → 908 grün):
   - 13 Abgang-Tests: Verschrottung, Gewinn, Verlust, neutral,
     USt 19 %/7 %/0 %, Abgang im Anschaffungsjahr, 5 Validierungs-
     Fehler, DEMO-Integration.
   - 7 Anlagenspiegel-Extra-Tests: Zugang+Abgang gleiche Gruppe,
     Ignore vor-Zeitraum-Abgang, Ignore nach-Zeitraum-Zugang,
     PDF-Smoke (leer + befüllt), Excel-Smoke (leer + befüllt).

**Scope-Grenzen eingehalten:**
- Hash-Kette unverändert.
- Bestehende 888 Tests bleiben grün (nur Additionen).
- Keine neuen npm-Dependencies (ExcelJS war bereits in package.json).
- Keine Migration (0025-Felder reichten).

**Bewusst in Teil 2b (Sprint 7) verschoben:**
- Degressive AfA (§ 7 Abs. 2 EStG)
- GWG-Sofortaufwand (§ 6 Abs. 2 EStG)
- Sammelposten (§ 6 Abs. 2a EStG)
- Kombinierter Jahresabschluss-PDF-Generator mit Anlagenspiegel-Seite
- Abgang bei indirekter Brutto-Methode
- CSV-Import für Anlagenverzeichnis
- Teilabgänge (parent_id)

---

## Entscheidung 9: BilRUG-2015-Korrektur 2700/2800 (Nachtrag vor Teil 2b)

**Kontext:** Bei der Review von Entscheidung 4 (SKR03-Konten 2700/2800
für Anlagenabgang-Gewinn/-Verlust) fielen zwei Probleme auf:

1. **Echter Bug — Mapping-Lücke:** Konto 2800 hatte in
   `src/domain/accounting/skr03GuvMapping.ts` keinen Range-Eintrag.
   `findGuvRule("2800")` lieferte `undefined`. Ein Buchverlust aus
   Anlagenabgang (gebucht via `2800 soll / 0xxx haben` durch
   `planAbgang`) wäre in der GuV **nicht erschienen** — die Bilanz
   wäre korrekt reduziert gewesen, das GuV-Ergebnis aber um den
   Buchverlust zu hoch.

2. **Seed-Bezeichnungen veraltet:** 2700 und 2800 hießen im Seed
   „Außerordentliche Erträge/Aufwendungen" — diese GuV-Position wurde
   durch **BilRUG 2015** aus HGB § 275 n. F. entfernt. Beträge auf
   diesen Konten fließen heute in Posten 4 „Sonstige betriebliche
   Erträge" bzw. Posten 8 „Sonstige betriebliche Aufwendungen".

**Gewählt (Option A — minimal-invasiv):**

1. Neue Mapping-Regel in `skr03GuvMapping.ts`:
   ```
   { from: 2800, to: 2899, guv_ref: "8",
     tag: "SONSTIGE_BETRIEBLICHE_AUFWENDUNGEN_NEUTRAL" }
   ```
2. SKR03-Seed-Labels umbenannt:
   - 2700: „Außerordentliche Erträge" → „Sonstige neutrale Erträge"
   - 2800: „Außerordentliche Aufwendungen" → „Sonstige neutrale
     Aufwendungen"
3. 2 neue Regressions-Tests in `GuvBuilder.test.ts`:
   - „GuV zeigt Anlagenabgang-Buchverlust unter Posten 8 nach
     BilRUG 2015" — 2800-Verlustbuchung → Posten 8 = 500, Posten 4 = 0
   - „GuV zeigt Anlagenabgang-Buchgewinn unter Posten 4 nach
     BilRUG 2015" — 2700-Gewinnbuchung → Posten 4 = 500, Posten 8 = 0

**Begründung für Option A:** Ein minimaler Schritt reparierte sowohl
den Mapping-Bug (fachliche Korrektheit) als auch die veralteten
Labels (Benutzer-Klarheit), ohne Tests aus Teil 2a umzuschreiben. Die
Abgangs-Demo-Szenarien aus README 14e bleiben unverändert und
buchhalterisch korrekt, weil der Abgangs-Service weiterhin 2700/2800
nutzt — nur die GuV-Position, in der diese Beträge landen, ist jetzt
korrekt n.F.

**Nicht umgesetzt (Option B / C):** DATEV-spezifische Konten 2310
„Anlagenverkauf Buchgewinne" und 2315 „Anlagenverkauf Buchverluste"
sind **nicht** im Seed ergänzt worden. Wer langfristig die DATEV-
puristische Variante möchte, kann sie in einem späteren Sprint
ergänzen — das ist ein reiner Additions-Pfad, der den jetzigen
2700/2800-Pfad nicht bricht.

**Auswirkung:** +1 Mapping-Regel, 2 Seed-Label-Änderungen, +2 Tests.
Bestehende 908 Tests unverändert grün. Test-Count 908 → 910. Keine
Schema-Änderung.

**Reversibilität:** trivial. Zurückdrehen der Mapping-Regel + der
Labels wäre ein Drei-Zeiler-Revert; die Regressions-Tests würden
dann rot und den Bug erneut anzeigen (der Test ist also Schutz für
die Zukunft).

**Betroffene Tests, die weiterhin grün bleiben:**

- `GuvBuilder.test.ts:216-222` — nutzt 2700 als „Sonst. Ertrag" →
  Posten 4. Mapping unverändert.
- `BwaBuilder.test.ts:132-141` — nutzt 2700 als „sonst. betr. Ertrag"
  → BWA Zeile 6 (aus GuV Posten 4).
- Alle anderen 56 Testdateien — keine referenzieren die umbenannten
  Seed-Labels von 2700/2800 direkt.

---

# Teil 2b Nachtrag — GWG + Sammelposten + Indirekte Brutto-Methode

Teil 2b baut auf Teil 1 + 2a auf. Migration 0025 reicht weiterhin.
Kein Schema-Update, keine neuen npm-Deps.

## Entscheidung 10: GWG-Calculator ohne harte 800-€-Grenze

**Kontext:** § 6 Abs. 2 EStG erlaubt Sofortabschreibung für
Geringwertige Wirtschaftsgüter mit AK ≤ 800 € netto. Vor 2018 lag die
Grenze bei 410 €. Altbestände können noch auf den alten Grenzwerten
laufen.

**Gewählt:** Der Calculator `berechneGwgAfa` prüft die 800-€-Grenze
**nicht**. Die UI zeigt eine Warnung bei Überschreitung, verweigert
aber nicht die Anlage. So können Bestandsdatensätze aus alter
Rechtslage abgebildet werden; die Verantwortung für die aktuelle
steuerliche Zulässigkeit trägt der Buchhalter.

**Reversibilität:** leicht. Eine harte Grenze kann jederzeit ergänzt
werden, bricht aber Altbestand.

## Entscheidung 11: Sammelposten mit harten Grenzen + Pool-Schutz

**Kontext:** § 6 Abs. 2a EStG bildet Wirtschaftsgüter mit AK > 250 €
und ≤ 1.000 € netto in einem Pool ab. Satz 3 schreibt fest, dass
Abgänge aus dem Pool nicht einzeln verbucht werden.

**Gewählt:**
1. `berechneSammelpostenAfa` wirft einen Fehler bei AK ≤ 250 € oder
   AK > 1.000 € (harte Grenzen, Gesetzestext ist eindeutig).
2. `planAbgang` blockiert mit klarer Fehlermeldung, wenn die Anlage
   `afa_methode === "sammelposten"` hat. Der Benutzer muss dann
   manuell buchen + die Anlage löschen.
3. **Volle Jahresrate im Anschaffungsjahr** (keine Monatsanteile,
   anders als bei linearer AfA). Das ist die gesetzliche Vorgabe des
   Pool-Modells.

**Reversibilität:** leicht — hartkodierte 5-Jahres-Kadenz + Grenzen
stehen klar im Code.

## Entscheidung 12: Degressive AfA — NEIN (§ 7 Abs. 2 EStG ausgelaufen)

**Kontext:** Degressive AfA nach § 7 Abs. 2 EStG war zeitlich
befristet zulässig (2020-2022 Corona, 2024 Wachstumschancengesetz).
Für Anschaffungen ab 1.1.2025 nicht mehr zulässig. Bestandsanlagen
mit begonnener degressiver AfA laufen weiter bis Methodenwechsel.

**Spec-Anleitung:** „Bei Unsicherheit: fragen statt autonom
entscheiden." Klare Entscheidung stattdessen per Spec-Fallback:

> WENN NEIN (Empfehlung bei Unklarheit): Degressive AfA als
> Platzhalter im Dropdown (disabled). Hinweis: „Degressive AfA
> aktuell nicht verfügbar, für Bestandsanlagen bitte einzeln buchen"

**Gewählt:** **NEIN.** Degressiv bleibt als disabled Option in der
UI mit dem expliziten Hinweistext. Kein Calculator, keine Tests.

**Begründung:**
- Keine Neuanschaffungen ab 2025 betroffen.
- Bestandsanlagen (wenige Fälle) können manuell via JournalPage
  gebucht werden.
- Implementation wäre ~150 Zeilen + 8 Tests ohne praktischen Nutzen
  für 2025+-Workflows.

**Reversibilität:** leicht. Wenn der Gesetzgeber die degressive AfA
erneut einführt, kann `berechneDegressiveAfa` in einem Zukunfts-
Sprint ergänzt werden, ohne existierenden Code zu ändern.

## Entscheidung 13: Indirekte Brutto-Methode-Abgang mit Auflösungs-Zeile

**Kontext:** Teil 2a hatte Indirekte Methode (per
`konto_abschreibung_kumuliert`) für laufende AfA unterstützt, aber
den Abgang blockiert. Teil 2b öffnet den Abgang.

**Gewählt:** Der Abgangs-Plan enthält bei indirekter Methode **eine
zusätzliche `aufloesung_kum`-Zeile**:

```
Soll  Haben  Betrag
────────────────────────────────────────────
4830  0480   teil_afa  ← Teil-AfA bucht auf Wertberichtigung
0480  0440   kum_afa   ← Auflösungs-Zeile (neu)
1200  0440   min(netto, RBW) ← Erlös
1200  2700   netto-RBW ← Gewinn (falls netto > RBW)
ODER
2800  0440   RBW-netto ← Verlust (falls netto < RBW)
1200  1776   ust       ← USt (falls > 0)
```

Nach dem Abgang: Saldo auf Wertberichtigungs-Konto = 0, Saldo auf
Anlage-Konto = 0. Alle Netto-Veränderungen entsprechen AK.

**Begründung:** Buchungs-symmetrisch zur laufenden AfA (gegen 0480
statt direkt gegen 0440). Der User kann die Buchungen einzeln an
Konto-Saldi nachvollziehen — jede Zeile hat eine saubere semantische
Rolle (`teil_afa`, `aufloesung_kum`, `erloes`, `gewinn`/`verlust`,
`ust`).

**Reversibilität:** mittel. Der alte Guard-throw ist entfernt; sollte
man ihn zurück wollen, ist das ein Zwei-Zeiler plus Test-Update.

## Teil-2b-Deliverables

- **AfaCalculator erweitert** um `berechneGwgAfa` + `berechneSammelpostenAfa`.
- **AnlagenService.planAfaLauf** mit Methoden-Dispatch (switch-case).
- **AnlagenService.getAnlagenspiegelData** nutzt methoden-neutralen
  Helper `afaFuerJahr`.
- **AnlagenService.planAbgang** öffnet indirekte Methode + blockiert
  Sammelposten + GWG-Pfad ohne Teil-AfA.
- **Repo-Validation** erweitert um `sammelposten`-AK-Bereich.
- **UI**: ND-Feld konditional disabled, method-spezifische Hinweis-
  Boxen mit Grenzwert-Warnungen, Live-Vorschau dispatched je Methode.
- **22 neue Tests** (910 → 932):
  - 18 GWG/Sammelposten-Tests (`GwgSammelposten.test.ts`)
  - 4 neue Abgangs-Tests (1 alter „indirekt-Error" umgeschrieben auf
    neue Logik; 3 Phase-4-Integrations-Tests für indirekte
    Methode mit Gewinn / Verlust / direkte-Regression; 1 GWG-Abgang)
- **Demo-CSV** erweitert um 2 Zeilen (INV-2025-002 GWG, INV-2025-003
  Sammelposten).
- **README Schritt 14f** dokumentiert alle drei Methoden.

## Scope-Grenzen weiterhin eingehalten

- Hash-Kette unverändert
- Keine Migration
- Keine neuen npm-Deps
- TypeScript strict + Decimal.js durchgängig
- 932 Tests grün (910 → +22)

## Offen für späteren Sprint

- Degressive AfA (falls Gesetzgeber erneut einführt)
- CSV-Import für Anlagenverzeichnis
- Teilabgänge via `parent_id`
- Kombinierter Jahresabschluss-PDF-Generator
- GWG-Sammelerfassung (mehrere GWG-Zeilen in einer Demo-Importzeile)
