# Sprint 4 — Entscheidungsprotokoll (OPOS-Grundgerüst, Option B)

Nach Phase-1-Bestandsaufnahme wurde **Option B: Gap-Closure im
Derived-Modell** gewählt. Keine Architektur-Änderung, keine Migration,
kein Umbau der 10+ OPOS-Consumer.

---

## Entscheidung 1: Derived-OPOS-Modell behalten

**Kontext:** Spec wollte persistierte `offene_posten`-Tabelle mit
explizitem Status-Feld und separater Zahlungs-Tabelle. Bestandscode
(`src/api/opos.ts`, 245 Zeilen) leitet OPOS zur Laufzeit aus
`journal_entries` ab — Netting pro `beleg_nr`, keine eigene Persistenz.

**Optionen:**
- A) Spec-Modell (Materialized): Migration 0025 + 2 neue Tabellen +
  Trigger bei Journal-Insert + Refactor aller 10+ Consumer.
- B) Derived bleibt, nur Lücken schließen: Tests + Demo + Doku.
- C) Mischmodell: beide parallel mit Synchronisierung.

**Gewählt:** B.

**Begründung:**
- **GoBD-Sauberkeit:** Derived kann nicht zwischen OP-Tabelle und
  Journal driften — eine OP-Tabelle müsste per Trigger synchron
  gehalten werden, Trigger-Bugs könnten unbemerkt Drift erzeugen.
- **Blast-Radius:** 10+ Dateien nutzen `buildOpenItems` /
  `summarizeOpenItems` / `OpenItem`-Type. Refactor auf Materialized
  würde Dashboard, Advisor-Metrics, Notifications,
  Bank-Reconciliation und Mahnwesen gleichzeitig berühren — hohes
  Regressionsrisiko für die 788 bestehenden Tests.
- **Fachlicher Mehrwert unklar:** Spec-Modell bietet expliziten
  Status und separate Zahlungs-Historie — beides ist im Derived-Modell
  implizit aus dem Journal ableitbar. Performance-Argumente
  (>100.000 Buchungen) werden später adressiert, falls sie auftreten.

**Auswirkung:** Keine Migration, keine Schema-Änderung. Alle
bestehenden OPOS-Consumer unverändert. Sprint-Scope reduziert sich
auf Tests (Bestand-Code absichern) + Demo + Doku.

**Reversibilität:** Trivial in dieser Sprint-Session — kein Code
geschrieben, der den Architektur-Wechsel verbaut. Ein späteres
Materialized-Refactor bleibt möglich und würde von den in diesem
Sprint geschriebenen Unit-Tests als Verhaltens-Kontrakt profitieren.

---

## Entscheidung 2: Verzugszinsen-Prozentpunkte — Spec korrigieren, nicht Code

**Kontext:** Sprint-4-Spec nennt „8 Prozentpunkte über Basiszinssatz
für B2B" für § 288 BGB. Der Bestandscode in `src/api/mahnwesen.ts`
verwendet **9 Prozentpunkte** und kommentiert *„zinssatz = basiszinssatz
+ 5 (B2C) bzw. 9 (B2B) Prozentpunkte"*.

**Faktische Lage:** Seit dem **29.07.2014** beträgt der
Verzugszins-Aufschlag für Entgeltforderungen zwischen Unternehmen
**neun (9)** Prozentpunkte über dem Basiszinssatz (§ 288 Abs. 2 BGB
n. F., umgesetzt durch das „Gesetz zur Bekämpfung von
Zahlungsverzug im Geschäftsverkehr"). Davor waren es 8. Die Spec-
Formulierung ist somit veraltet.

**Gewählt:** **Code bleibt bei 9 Prozentpunkten.** Keine Code-Änderung.
Die Spec-Text-Korrektur wird hier dokumentiert, damit sie bei künftigen
Sprint-Iterationen nicht wiederaufgenommen wird.

**Auswirkung:** Keine Code-Änderung. Dokumentarischer Hinweis hier und
im Handoff.

**Reversibilität:** trivial (nur Text).

---

## Entscheidung 3: Personenkonten-Modell vertagt

**Kontext:** Spec-Punkt 1c erwähnt die Möglichkeit einer
`contacts`-Tabelle mit `typ='debitor'/'kreditor'`. Aktuell nutzt der
Code **Sammelkonten** (1400 für alle Debitoren, 1600 für alle
Kreditoren) plus `gegenseite`-Freitext-Feld. Das ist bewusste
Architektur-Entscheidung laut `docs/BERATER-LEITFADEN.md` („Zweit-Tool
neben DATEV, nicht DATEV-Ersatz").

**Konsequenz ohne Personenkonten:** Die Altersstruktur kann aktuell
pro **Beleg-Nr.** und pro **Gegenseiten-Freitext** gruppieren — aber
nicht pro offiziellem Debitor/Kreditor-Objekt. Für professionelle
Mandanten mit vielen Kunden wäre das eine Einschränkung; für kleine
Kanzleien ist es akzeptabel.

**Gewählt:** **Personenkonten NICHT in Sprint 4 einführen.**

**Begründung:**
- Personenkonten würden ein eigenes Schema (`contacts` oder
  `personenkonten`), eine UI für deren Pflege und eine Integration in
  Belegerfassung verlangen — das ist ein **eigener Sprint**-Umfang
  (~2-3 Phasen).
- Das Sprint-4-Ziel („OPOS-Grundgerüst") ist durch das Derived-Modell
  auf Beleg-Nr-Ebene erfüllt; Personenkonten sind eine spätere
  Erweiterung, keine Voraussetzung.

**Auswirkung:** Keine Code-Änderung. Vermerk im
`NEXT-CLAUDE-HANDOFF.md` unter den offenen Sprint-Kandidaten.

**Reversibilität:** Trivial — ein späterer Sprint kann
Personenkonten einführen, ohne das Derived-OPOS-Modell zu berühren
(sie würden orthogonal als Detaildimension neben `gegenseite` liegen).

---

## Entscheidung 4: Keine neue Route `/opos/altersstruktur`

**Kontext:** Spec wünschte optional eine eigene Route für die
Altersstruktur. Bestandscode hat die Altersstruktur-Sektion **bereits
als Scroll-Sektion** auf `/opos` (Überschrift *„Altersstruktur"*,
`OposPage.tsx` Zeile 208-209).

**Gewählt:** Scroll-Sektion bleibt. **Keine neue Route.**

**Begründung:** Eine separate Route würde den gleichen Datenfluss
(Journal → Builder → Buckets) auf einer eigenen Seite duplizieren,
ohne Mehrwert. Der Scroll-Anker liefert denselben Deep-Link-Nutzen;
eine explizite Anker-Navigation (`/opos#altersstruktur`) ist Browser-
Standard, kein Code-Eingriff.

**Auswirkung:** Keine Code-Änderung. In der README-Demo-Beschreibung
wird die Altersstruktur-Sektion explizit erwähnt.

**Reversibilität:** Trivial — eine Route ist jederzeit nachrüstbar,
wenn sich Bedarf zeigt.

---

## Entscheidung 5: UI-Schnell-Filter „Überfällig" bereits vorhanden — keine Änderung

**Kontext:** Spec-Wunsch „Schnell-Filter ‚Überfällig (>30 Tage)'".
Bestandscode hat in `OposPage.tsx` bereits den `overdueOnly`-Filter
(Zeile 58, 73) — Checkbox „Nur überfällig", die `ueberfaellig_tage > 0`
filtert.

**Abweichung von der Spec:** Spec sagt „>30 Tage", Code filtert „>0
Tage". Beide Semantiken haben Fürsprecher:
- „>0 Tage" = **strikt überfällig** (fällig war gestern, heute oder
  früher). Default im Bestandscode.
- „>30 Tage" = **deutlich überfällig** (gängige Praxis für
  Mahnvorstufe).

**Gewählt:** Bestand bleibt („>0 Tage"). Die Bucket-Filter (0-30,
31-60, 61-90, 91+) decken die „>30 Tage"-Bedingung explizit ab, indem
der Buchhalter den Bucket 31-60 oder höher auswählen kann.

**Begründung:** Zwei verschiedene „Überfällig"-Interpretationen in
einer UI wären verwirrend. Kombinierbarkeit mit Bucket-Filter bietet
bereits die gewünschte Differenzierung.

**Auswirkung:** Keine Code-Änderung.

**Reversibilität:** Trivial.

---

## Entscheidung 6: OPOS-Demo-Szenarien im bestehenden CSV-Format

**Kontext:** Demo-Daten brauchten 7 OPOS-Szenarien (offen, bezahlt,
teilbezahlt, überfällig, getrennt Debitor/Kreditor).

**Gewählt:** Ergänzung der bestehenden `buchungen.csv` um 7 neue
Journal-Einträge (40 → 47). Keine neue Demo-Datei. Fälligkeitsdatum
wird per Default-Fallback (`datum + 14 Tage`) abgeleitet — keine
Erweiterung des CSV-Headers um eine `faelligkeit`-Spalte.

**Begründung:** Rückwärtskompatibilität zu allen drei Header-Varianten
(7/8/9 Spalten) bleibt gewahrt. Sprint-Fokus bleibt auf OPOS-Tests,
nicht auf CSV-Format-Erweiterung. Eine `faelligkeit`-Spalte wäre ein
eigener Sprint-Kandidat für einen späteren Iterationsschritt.

**Auswirkung:** `buchungen.csv` wächst von 40 auf 47 Zeilen. Neue
Szenarien: AR-2025-008 (bezahlt), AR-2025-009 (teilbezahlt),
AR-2025-010 (überfällig), ER-2025-006 (bezahlt) — jeweils via Paar
Rechnung + Zahlungs-Buchung mit identischer Beleg-Nr.

**Reversibilität:** Trivial — 7 Zeilen aus CSV entfernen reicht.

---

## Phasen-Abschluss

A (Pre-Check) → B (26 Unit-Tests) → C (Demo-CSV + README) → D (Doku +
Handoff) durchlaufen. tsc clean, vitest grün, Gesamt-Test 788 → **814**
(+26). Keine bestehende Test-Datei modifiziert. Keine Migration.
Keine neue Route.

Alle Dokumentationseinträge (Zinsen-Prozentpunkte, Personenkonten,
Altersstruktur-Route, Überfällig-Filter) sind Aktenvermerke für
zukünftige Sprints — sie verhindern, dass spätere Auftraggeber die
gleichen Entscheidungen erneut aufwerfen müssen.
