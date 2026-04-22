# Architektur-Entscheidungen

Warum die App so aufgebaut ist, wie sie aufgebaut ist. Jede Entscheidung
ist in einem Abschnitt mit **Kontext** (warum diese Frage überhaupt
entstanden ist), **Entscheidung** und **Konsequenzen** (was wir dafür und
was wir dagegen in Kauf nehmen) dokumentiert.

---

## 1. Decimal.js + Money-Wrapper statt Number

**Kontext.** JavaScript `number` ist IEEE 754 Double. `0.1 + 0.2 = 0.30000000000000004`.
Bei Finanzdaten mit 10+ Milliarden Buchungen pro Jahr summieren sich
Rundungsfehler. GoBD Rz. 58 fordert „Unveränderbarkeit" und
„Richtigkeit" — ein Rundungsfehler ist formal eine Verletzung.

**Entscheidung.** Wrapper-Klasse `Money` (`src/lib/money/Money.ts`)
kapselt `Decimal.js` mit 41-stelliger Präzision. Alle Werte im Domain-Layer
(Bilanz, GuV, Lohn, UStVA, …) laufen als `Money`, nie als `number`. Rundung
erfolgt explizit an definierten Grenzen (`toFixed2()`, `toEuroFormat()`).

**Konsequenzen.**
- (+) Exakt auf den Cent, keine kumulativen Fehler.
- (+) 36 dedizierte Money-Tests sichern jede Operation ab.
- (-) Serialisierung erfordert `.toString()` bzw. `new Money(str)` beim
  Lesen aus der DB — das lebt in den Repository-Mappern.
- (-) `Money.plus()` statt `a + b` macht Arithmetik wortreicher.

---

## 2. Closure Table statt rekursiver CTE für Bilanz-Baum

**Kontext.** HGB § 266 ist ein Baum mit 5 Ebenen (A → A.I → A.I.1 →
A.I.1.a → Konto). Queries wie „Summe aller Konten unter A.I" auf Postgres
mit rekursiver CTE sind **O(h·n)** pro Query und skalieren schlecht bei
vielen gleichzeitigen Berichten.

**Entscheidung.** **Closure Table** `closure_table(ancestor, descendant, depth)`
materialisiert alle Vorfahr-Nachkomme-Paare. Migration `0019` legt sie an.
Query wird zu `WHERE ancestor = 'A.I'` → **O(n)** mit Index-Scan.

**Konsequenzen.**
- (+) Bilanz-Rendering ist konstant schnell, auch bei 10.000 Konten.
- (+) Einfache Aggregate („alles unter A" = ein `JOIN`).
- (-) Einfüge-/Lösch-Operationen auf dem Baum sind teurer
  (O(h²) statt O(1)) — aber der Kontenplan ändert sich sehr selten.
- (-) Redundante Datenhaltung (klassischer Platz-für-Zeit-Trade).

---

## 3. Composite Pattern für den BalanceNode-Baum im Speicher

**Kontext.** Für PDF- und Screen-Rendering brauchen wir den Bilanz-Baum
im Speicher, nicht nur die flache Liste aus der DB. Ein rekursiver Typ
ohne Muster führt zu hunderten `if node.children` Stellen.

**Entscheidung.** `BalanceNode` in `domain/accounting/BalanceNode.ts` ist
ein Composite: jeder Knoten trägt `children?: BalanceNode[]` und
`sum(): Money` aggregiert rekursiv. Keine separate Leaf-Klasse — ein
Konto-Leaf ist einfach ein Knoten ohne Children.

**Konsequenzen.**
- (+) Ein Algorithmus („walk + aggregate") statt zwei.
- (+) Testbar ohne DB — der Builder nimmt `Account[] + JournalEntry[]`
  und liefert einen Baum.
- (-) Kleine Inkonsequenz: Summen-Knoten und Konto-Knoten teilen sich
  einen Typ, was Typ-Enge auf der Leaf-Ebene verhindert.

---

## 4. SKR03-Single-Source-of-Truth in `skr03Mapping.ts`

**Kontext.** Dasselbe SKR03-Konto taucht in Bilanz, GuV, BWA, EÜR, UStVA,
XRechnung und E-Bilanz auf — mit potenziell sieben unterschiedlichen
Zuordnungen. Wenn diese Mappings in den sieben Builder-Dateien dupliziert
leben, divergieren sie garantiert.

**Entscheidung.** **Ein** Mapping-Modul pro Dimension:
`skr03Mapping.ts` (Bilanz), `skr03GuvMapping.ts`, `skr03UstvaMapping.ts`,
`skr03EuerMapping.ts`. Jeder Builder **importiert** aus genau einem
Mapping. Tests prüfen: „Jedes SKR03-Konto hat eine Bilanz- UND eine
GuV-Zuordnung ODER ist bewusst ausgeschlossen".

**Konsequenzen.**
- (+) Ein Ort, um SKR04 nachzurüsten.
- (+) 11 Mapping-Tests fangen versehentliche Lücken.
- (-) Initial-Setup dauert länger, weil man mehrere Dimensionen
  gleichzeitig pflegen muss.

---

## 5. Adapter `Arbeitnehmer ↔ Employee`

**Kontext.** Die Lohn-Engine rechnet mit einem domänenreichen
`Arbeitnehmer`-Typ (Steuerklasse, Kinderfreibeträge, SV-Klassen …). Die
DB-Tabelle `employees` (Migration 0016) speichert aber ein flacheres
Postgres-freundliches Schema. Ein 1:1-Mapping würde entweder die
Domain-Logik mit DB-Spalten verschmutzen oder die DB mit nested JSONs
unlesbar machen.

**Entscheidung.** `EmployeeAdapter` übersetzt in beide Richtungen.
Domain-Schicht kennt nur `Arbeitnehmer`; Repository-Schicht kennt nur
`Employee`. Der Adapter ist die einzige Stelle, die beide Typen sieht.

**Konsequenzen.**
- (+) DB-Migrationen ändern nur `Employee`, Domain-Logik bleibt stabil.
- (+) Lohn-Engine testbar ohne DB (Fixtures sind pure `Arbeitnehmer`-Objekte).
- (-) Doppelte Typdefinitionen — bei neuen Feldern muss man an beide denken.

---

## 6. Pure-SVG-Charts statt Recharts / Victory

**Kontext.** Recharts + deps bringt ~800 KB gzip in den Bundle. Die App
hat drei Chart-Typen (Bar, Line, Donut). Viel Infrastruktur für wenige
Visualisierungen.

**Entscheidung.** Eigene SVG-Komponenten in `components/charts/`. Keine
Animations-Library; keine Legend-Engine; keine Tooltip-Engine außer
nativem `<title>`.

**Konsequenzen.**
- (+) Bundle-Size ~250 KB kleiner.
- (+) Kein transitiver Security-Issue über Chart-Library.
- (+) Druck-PDF sieht identisch zum Bildschirm aus — nativer SVG-Export.
- (-) Für einen vierten Chart-Typ müssen wir ihn selbst schreiben.

---

## 7. Dual-Mode-Repositories (`DEMO_MODE` vs. Supabase)

**Kontext.** Die App soll zwei Zielgruppen bedienen: (a) Kanzleien mit
Supabase-Konto in Produktion, (b) Demo-/Trial-Nutzer ohne Backend. Bei
letzterer Variante fließt nichts in externe Systeme.

**Entscheidung.** `api/supabase.ts` exportiert `DEMO_MODE`-Flag. Repos
(`api/accounts.ts`, `api/journal.ts`, …) verzweigen: im Demo-Mode gegen
`localStorage`-basierten `store`, sonst gegen Supabase. Die Aufrufer
(React-Query-Hooks) sehen immer dasselbe Interface.

**Konsequenzen.**
- (+) Marketing-Demo auf `/landing` läuft offline.
- (+) Einheitliche Tests, die Repositories als Behavior beschreiben.
- (-) **Zwei Persistenz-Implementierungen** pro Ressource — bei neuen
  Feldern muss man beide nachziehen.
- (-) Belegerfassungs-Persistenz läuft aktuell nur im localStorage-Modus
  (siehe [ROADMAP.md](./ROADMAP.md) P2).

---

## 8. Separater `FestschreibungsService`

**Kontext.** GoBD Rz. 64 verlangt, dass festgeschriebene Buchungen nicht
mehr änderbar sind — technisch via Hash-Chain und DB-Trigger. Wenn diese
Logik verteilt in Repos, UI-Handlern und Triggers lebt, kann man sie
nicht mehr auditieren.

**Entscheidung.** `domain/gobd/FestschreibungsService.ts` ist die einzige
Stelle, die Hashes berechnet und Sperren setzt. UI ruft nur
`service.lock(monthRange)` auf. DB-Trigger (Migration 0021) sind der
zweite Verteidigungsring.

**Konsequenzen.**
- (+) Eine auditierbare Datei mit 100 % Test-Coverage.
- (+) Audit-Ready: der Prüfer sieht genau, wo die Logik sitzt.
- (-) UI muss via Service aufrufen — direkte DB-Writes würden den
  Integritätsmechanismus umgehen. Code-Review muss darauf achten.

---

## 9. `happy-dom` statt jsdom für Tests

**Kontext.** Component-Tests und XML-Parsing-Tests brauchen eine
DOM-Implementierung. jsdom ist die klassische Wahl, aber mit ~200 ms
Setup-Overhead pro Suite.

**Entscheidung.** `happy-dom` 20.9. ~10× schneller, kompatibel zum
nötigen Subset (`DOMParser`, `Blob`, `File`, `URL.createObjectURL`).

**Konsequenzen.**
- (+) 46 Test-Files laufen in ~24 s (statt ~2 min).
- (-) Einige Edge-Cases werden anders gehandhabt — siehe die
  XRechnungParser-Historie: `querySelector` auf Default-Namespace-XML
  funktioniert anders als in Browser, deshalb die `localName`-Helper.
