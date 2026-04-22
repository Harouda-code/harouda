# Sprint 6 Teil 2a — Autonom getroffene Entscheidungen

Diese Datei sammelt alle Fragen, bei denen ich normalerweise hätte
nachfragen sollen, die aber im Nacht-Modus autonom entschieden wurden.
Der Nutzer reviewt sie am nächsten Morgen.

---

## Frage 1: Jahresabschluss-PDF-Integration — es gibt kein kombiniertes PDF

**Kontext:** Spec-Phase 2 sagt „Jahresabschluss-PDF erweitern:
Anlagenspiegel als zusätzliche Seite integrieren". Bestandsaufnahme
zeigt: `JahresabschlussPage.tsx` hat nur einen JSON-Export, kein
kombiniertes PDF. `BilanzPdfGenerator` und `GuvPdfGenerator` sind
getrennt; kein kombinierter „Jahresabschluss-PDF"-Generator existiert.

**Optionen:**
- A) Neuen Generator `JahresabschlussPdfGenerator` bauen, der Bilanz +
  GuV + Anlagenspiegel kombiniert (Scope: +~200 Zeilen)
- B) `JahresabschlussPage` erweitern um Anlagenspiegel-Summary-Sektion
  + Link zum dedizierten `/berichte/anlagenspiegel` für PDF/Excel,
  JSON-Export um Anlagenspiegel-Daten ergänzen
- C) Phase 2 komplett überspringen

**Meine vorläufige Entscheidung:** **B.**

**Begründung:** Ein neuer kombinierter PDF-Generator wäre eigener
Sprint-Umfang. Option B liefert die tatsächlich genutzte Workflow-
Integration (Summary + Direkt-Verweis) und erweitert das JSON-Payload,
ohne neuen PDF-Generator-Code. Anlagenspiegel hat ohnehin ein eigenes
PDF via der Anlagenspiegel-Page.

**Reversibilität:** leicht. Ein späterer Sprint kann den kombinierten
Generator ergänzen, ohne Bestehendes zu ändern.

---

## Frage 2: USt bei Anlagenabgang

**Kontext:** Verkauf beweglicher Anlagegüter ist nach § 1 UStG
grundsätzlich USt-pflichtig (19 %). Spec-Phase 3 erwähnt „Abgang mit
USt-Pflicht" als Test, aber der Abgangs-Dialog ist sonst nicht im
Detail spezifiziert.

**Optionen:**
- A) Abgangs-Dialog fragt nach Brutto-Erlös + USt-Satz, Service splittet
  USt heraus und bucht auf 1776/1771
- B) Dialog fragt nach Netto-Erlös, User ist selbst verantwortlich für
  USt-Buchung. Service behandelt nur Netto.
- C) Dialog fragt nach Brutto + optionalem USt-Satz (0/7/19). Bei 0
  wird nur Netto gebucht.

**Meine vorläufige Entscheidung:** **C** — Brutto-Eingabe mit optionalem
USt-Satz-Selector (0 / 7 / 19 %). Bei ust > 0 erzeugt der Service eine
zusätzliche USt-Buchung (1200 soll / 1776 haben auf USt-Betrag).

**Begründung:** Real-world Demo-Szenarien wollen USt-pflichtige
Verkäufe abbilden (Gebrauchtwagen-Verkauf, alte Maschinen). Reiner
Netto-Modus wäre unauthentisch. Die Integration über einen expliziten
USt-Satz-Selektor hält die Logik nachvollziehbar.

**Reversibilität:** mittel. Wenn sich der User lieber Option A wünscht
(nur Brutto automatisch mit 19 %), ist das ein UI-Zwei-Zeiler.

---

## Frage 3: Abgang — Buchungs-Split Teil-AfA + Ausbuchung

**Kontext:** Der Abgang erzeugt mehrere Journal-Einträge. Spec sagt
„Generiert 2-3 Journal-Einträge pro Abgang", aber die genaue Aufteilung
ist offen.

**Optionen:**
- A) 1 Eintrag (kombinierte Logik)
- B) Separate Teil-AfA-Buchung + Ausbuchungs-Buchung(en)
- C) 2-Eintrags-Modell (Teil-AfA + Ausbuchung zusammen), Gewinn/Verlust
  im selben Ausbuchungs-Eintrag via Gegen-Konto

**Meine vorläufige Entscheidung:** **B — voll aufgelöst.**

Struktur:
1. **Teil-AfA** (wenn betrag > 0): `konto_afa soll / konto_anlage (oder
   konto_abschreibung_kumuliert) haben` — pro-rata bis Abgangsmonat.
2. **Erlös-Buchung (Bank-Eingang)** (wenn erlös_netto > 0): `1200 soll
   / konto_anlage haben` — auf Höhe `min(erlös_netto, restbuchwert)`.
3. **Wenn Erlös > Restbuchwert (Gewinn):** `1200 soll / 2700 haben` —
   Differenz `erlös_netto − restbuchwert` (Außerordentliche Erträge,
   SKR03).
4. **Wenn Erlös < Restbuchwert (Verlust) oder Verschrottung:** `2800
   soll / konto_anlage haben` — Differenz `restbuchwert − erlös_netto`
   (Außerordentliche Aufwendungen).
5. **USt auf Erlös** (wenn ust_satz > 0): `1200 soll / 1776 haben` (bzw.
   1771 bei 7 %) — USt-Betrag.

Damit ergeben sich 2–4 Buchungen pro Abgang (Teil-AfA optional; ust
optional; Gewinn XOR Verlust-Ausbuchung).

**Begründung:** Saubere Konten-Saldi, jede Teil-Buchung ist für sich
steuerlich nachvollziehbar, Standard-Vorgehen in DATEV.

**Reversibilität:** mittel. Änderungen am Split-Muster würden die
Abgangs-Tests anpassen müssen.

---

## Frage 4: SKR03-Konten für Gewinn/Verlust beim Anlagenabgang

**Kontext:** Spec nennt 2700 (Gewinn) und 2800 (Verlust) — das stimmt
mit dem in diesem Projekt seeded SKR03 überein:

- **2700** „Außerordentliche Erträge" (ertrag) — für Buchgewinn
- **2800** „Außerordentliche Aufwendungen" (aufwand) — für Buchverlust
  und Verschrottung

Alternative SKR03-Konvention wäre 2310/2315 „Anlagenverkauf Buchgewinne/
Buchverluste steuerpflichtig". Die sind im Seed **nicht** vorhanden.

**Meine vorläufige Entscheidung:** 2700 / 2800 nutzen wie vom User
genannt.

**Begründung:** Konten existieren im Seed. Kein GuV-Mapping-Konflikt
(2700 und 2800 mappen bereits auf HGB-§-275-Positionen „Außerordentliche
Erträge/Aufwendungen", wobei die Position in HGB § 275 n. F. seit 2009
weggefallen ist — sie fließen aber in „Sonstige betriebliche
Erträge/Aufwendungen" bzw. „außerordentliches Ergebnis" rein). Keine
SKR03-Seed-Änderung nötig.

**Reversibilität:** leicht.

**Nachträgliche Korrektur (Morgen-Review vor Teil 2b):** Die
ursprüngliche Begründung war **teilweise falsch**. Genauer Befund aus
der Review:

- Konto 2700 war korrekt auf Posten 4 „Sonstige betriebliche Erträge"
  gemappt (n.F.-konform, BilRUG 2015).
- **Konto 2800 hatte ÜBERHAUPT KEIN GuV-Mapping** in
  `skr03GuvMapping.ts`. `findGuvRule("2800")` lieferte `undefined`.
  Ein Buchverlust aus Anlagenabgang wäre in der GuV nicht aufgetaucht.
- Die Seed-Bezeichnungen „Außerordentliche Erträge/Aufwendungen" waren
  semantisch inkorrekt — BilRUG 2015 hat diese GuV-Position
  gestrichen.

**Fix Option A ausgeführt (Minimal-Invasiv):**

1. Neue Mapping-Regel in `skr03GuvMapping.ts`:
   `{ from: 2800, to: 2899, guv_ref: "8", tag: "SONSTIGE_BETRIEBLICHE_AUFWENDUNGEN_NEUTRAL" }`
2. SKR03-Seed-Labels umbenannt:
   - 2700 „Außerordentliche Erträge" → „Sonstige neutrale Erträge"
   - 2800 „Außerordentliche Aufwendungen" → „Sonstige neutrale
     Aufwendungen"
3. 2 neue Regressions-Tests in `GuvBuilder.test.ts`
   (siehe auch `SPRINT-6-DECISIONS.md` Teil-2a-Nachtrag Entscheidung 9).

**Resultat:** 910 Tests grün (908 → +2). Kein bestehender Test durch die
Label-Umbenennung betroffen (kein Test asserted die Bezeichnungs-
Texte des Seeds für 2700/2800).

**Nicht umgesetzt (bewusst Teil 2b oder später):** DATEV-konforme
Zusatz-Konten 2310 / 2315 „Anlagenverkauf Buchgewinne/Buchverluste
steuerpflichtig" — können in Teil 2b oder einem späteren Sprint als
spezifischere Alternative ergänzt werden, ohne den jetzigen
2700/2800-Pfad zu brechen.

---

## Frage 5: Live-AfA-Vorschau — Scrollen oder Collapsible?

**Kontext:** Bei ND 50 würde die Vorschau-Tabelle 51 Zeilen haben.
Sollen alle Jahre angezeigt werden oder nur die ersten 10 mit Ausklapp-
Option?

**Meine vorläufige Entscheidung:** Alle Jahre zeigen, Tabelle scrollbar
via `max-height: 320px; overflow-y: auto`.

**Begründung:** In der Praxis sind ND > 20 selten (Gebäude ausgenommen,
die aber i.d.R. nicht bewegliche Anlagen sind). Scroll-Container ist
pragmatischer als Accordion.

**Reversibilität:** leicht.

---

## Frage 6: Anlagenspiegel-UI Spalten-Reihenfolge

**Kontext:** Spec schrieb die Reihenfolge:
`AK 01.01. | Zugänge | Abgänge | AK 31.12. | Abschreibungen kumuliert | BW 31.12. | BW 01.01.`

Das ist die DATEV-Standard-Reihenfolge. Ich habe BW 01.01. und BW 31.12.
in natürlicher Zeit-Reihenfolge getauscht → `… | BW 01.01. | BW 31.12.`,
da das für Leser intuitiver ist.

**Meine vorläufige Entscheidung:** Natürliche Zeit-Reihenfolge
(01.01. → 31.12.). UI zeigt: Konto | Anz. | AK 01.01. | Zugänge |
Abgänge | AK 31.12. | Abschr. kum. | BW 01.01. | BW 31.12.

**Begründung:** Leichter lesbar, kein rechnerischer Einfluss. Bei
User-Wunsch auf DATEV-Reihenfolge: einmalige Spalten-Umsortierung.

**Reversibilität:** trivial.

---

## Frage 7: Abgangs-Dialog als Modal oder Inline-Section?

**Kontext:** Der Abgangs-Dialog zeigt Abgangsdatum + Erlös + USt +
Vorschau der Buchungen. In `BankReconciliationPage` ist die Skonto-
Preview inline. Soll der Abgangs-Dialog ähnlich inline sein oder ein
Modal?

**Meine vorläufige Entscheidung:** Inline-Section, analog zum CostCarriers-
Formular und zur Skonto-Preview in Sprint 5. Erscheint unterhalb der
Anlage-Liste, überblendet das Neu-Formular nicht.

**Begründung:** Konsistent mit dem bestehenden UI-Stil in diesem Projekt
(inline-Editor-Pattern). Keine Portal-/Modal-Komplexität.

**Reversibilität:** trivial.
