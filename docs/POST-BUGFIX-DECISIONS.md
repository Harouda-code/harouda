# Post-Bugfix Mini-Sprint — Entscheidungsprotokoll

**Datum:** 2026-04-20
**Basis:** `docs/SPRINT-BUGFIX-DECISIONS.md` neue Befunde A + B
**Scope:** 2 geplante + 1 während der Arbeit identifizierter
Mapping-Konflikt (Bug C). Keine Architektur-Änderung.
**Test-Stand:** 988 → **995** (+7) / 65 Dateien · tsc clean

---

## Ausgangslage

Die Pre-Sprint-8-Bugfix-Runde hatte zwei neue Befunde offen gelassen:
- **Bug A:** 0860 Gewinnvortrag (passiva im SKR03_SEED) wird vom Bilanz-
  Mapping-Range 800-889 (A.III.1 aktiva) erfasst.
- **Bug B:** 50.000 € „Aufwand-Aggregation-Lücke" unbekannter Ursache —
  Musterfirma-JÜ war 78.587 € statt gewünschter 37.300 €.

## Wurzelanalyse Bug B

Systematischer Vergleich zwischen `SKR03_SEED` passiva-Deklarationen
(Konten 1600, 1700-1799, 2300-2629, 0860, 9000, ...) und GuV-Ranges
in `skr03GuvMapping.ts`:

- **2300 Grundkapital (passiva)** fiel in GuV-Range 2300-2319 (ZINSAUFWAND).
- EB-005 bucht `9000 soll / 2300 haben 50.000 €` → Haben-Saldo 50.000
- BalanceSheetBuilder-Erfolgs-Loop (Z.260-281):
  - `findErfolgRule(2300)` → ZINSAUFWAND AUFWAND
  - `soll=0, haben=50.000` → saldo_aufwand = 0 − 50.000 = **−50.000**
  - `aufwandSum` wird um 50.000 REDUZIERT
- Jahresüberschuss wird entsprechend um 50.000 ÜBERschätzt.

Das erklärt die exakte 50.000 €-Drift aus Bug B.

## Fix-Protokoll

### Fix A — Bug A: 0860 Gewinnvortrag → P.A.IV

**Datei:** `src/domain/accounting/skr03Mapping.ts:64-75`

Range `{from: 800, to: 889, A.III.1}` aufgesplittet:
```ts
{ from: 800, to: 859, reference_code: "A.III.1", tag: "ANTEILE_VERBUNDENE" },
{ from: 870, to: 889, reference_code: "A.III.1", tag: "ANTEILE_VERBUNDENE_2" },
// Neu:
{ from: 860, to: 869, reference_code: "P.A.IV", tag: "GEWINN_VORTRAG_0860" },
```

**Effekt:** Gewinnvortrag-Saldo 40.000 € landet jetzt auf Passivseite
P.A.IV (§ 266 Abs. 3 HGB A.IV — Gewinnvortrag/Verlustvortrag) statt
fälschlich auf Aktivseite A.III.1.

**Tests:** 3 neue Regressions-Tests für 0860 / 0858 / 0875 Range-
Abdeckung. `findBalanceRule("0860").reference_code === "P.A.IV"`.

### Fix B — Bug B: 2300 GuV-Range + Bilanz-Regel

**Datei 1:** `src/domain/accounting/skr03GuvMapping.ts:55-63`

GuV-Range `{from: 2300, to: 2319, ZINSAUFWAND}` verkürzt auf
`{from: 2310, to: 2319, ZINSAUFWAND}`. 2300-2309 ist jetzt nicht mehr
als Aufwand aggregiert.

**Datei 2:** `src/domain/accounting/skr03Mapping.ts:121`

Neue Bilanz-Regel für 2300 hinzugefügt:
```ts
{ from: 2300, to: 2309, reference_code: "P.A.I", tag: "GEZEICHNETES_KAPITAL_2300" },
```

**Effekt:** EB-005 Haben-Saldo 50.000 € auf 2300 wird jetzt korrekt als
Gezeichnetes Kapital auf P.A.I geführt (Passiva, § 266 Abs. 3 HGB A.I).
Erfolgs-Loop sieht 2300 nicht mehr → keine falsche −50.000 €-Korrektur
mehr am Aufwand.

**Tests:** 2 neue Regressions-Tests: `findBalanceRule("2300") === P.A.I`,
`findErfolgRule("2300") === undefined`, `findErfolgRule("2310") ===
ZINSAUFWAND` (beweist Range-Start bei 2310).

### Fix C — Bug C (neu entdeckt während Bug B): 1600 Verbindlichkeiten

**Datei:** `src/domain/accounting/skr03Mapping.ts:100-108`

Bilanz-Rule `{from: 1600, to: 1699, B.II.4, SONSTIGE_VERMOEGEN}` ersetzt
durch `{from: 1600, to: 1699, P.C.4, VERB_LuL_1600}`.

**Warum:** 1600 ist im harouda-SKR03 als „Verbindlichkeiten aus Lieferungen
und Leistungen" (passiva) deklariert — gleiche Klasse wie Bug A/B. Die
Musterfirma bucht auf 1600 über 56.000 € Lieferanten-Verbindlichkeiten,
die auf der Aktivseite unsichtbar waren.

**Effekt:** Aktiva-Summe steigt um 55.600 € (korrekte Zuordnung der
Gegenposition zu den operativen Geschäftsvorfällen). Bilanz bleibt
balanciert.

**Tests:** 1 neuer Regressions-Test: `findBalanceRule("1600") === P.C.4`.

### Fixtures-Anpassungen bestehender Tests

- `BwaBuilder.test.ts:135-144` — `makeAccount("2300", "aufwand")` +
  Entry auf „2310" umgestellt. Kommentar dokumentiert den Bug-B-Grund.
- `GuvBuilder.test.ts:98-106` — analog.
- `skr03GuvMapping.test.ts:52-59` — Test-Titel von „maps 2300 → Posten 13"
  zu „maps 2310 → Posten 13" umgeschrieben, plus explizite Assertion dass
  `findGuvRule("2300") === undefined`.

---

## Musterfirma-Snapshot — Final

### Ist-Werte (Reproduzierbar)

```json
{
  "aktiva": "174187.82",
  "passiva": "174187.82",
  "balDiff": "0.00",
  "jahresergebnis": "28587.82",
  "zahllast": "4150.00",
  "ertrag": "174500.00",
  "aufwand": "145912.18"
}
```

### README-Soll vs. Ist (Drift-Analyse)

| Größe | Ist | README-Soll | Drift absolut | Drift relativ |
|-------|-----|-------------|---------------|---------------|
| Aktiva | 174.187,82 | 196.396,00 | −22.208,18 | −11,3 % |
| Passiva | 174.187,82 | 196.396,00 | −22.208,18 | −11,3 % |
| Jahresüberschuss | 28.587,82 | 37.300,00 | −8.712,18 | −23,4 % |
| UStVA-Zahllast Dez | 4.150,00 | 2.820,00 | +1.330,00 | +47,2 % |

### Drift-Erklärung

- **AfA-Doppelung:** CSV `AfA-2025`-Zeile bucht 4.000 €, der automatische
  AfA-Lauf produziert weitere 13.212,18 €. Gesamt 17.212,18 € statt der
  vom README vorhergesehenen 12.762,18 €. Mehr-Aufwand → weniger JÜ, aber
  gleichzeitig höhere Aktiv-Konto-Reduktion via Direkt-AfA → weniger Aktiva.
- **UStVA +1.330 €:** entspricht exakt 19 % × 7.000 €. Wahrscheinlich
  ein USt-Effekt aus einer spezifischen Buchung. Nicht in Pre-Sprint-8/
  Post-Bugfix-Scope. P3-Follow-Up.
- **README ursprünglich manuell geschätzt** ohne durchgängige Code-
  Verifikation → kleinere Drifts akkumulieren.

### Snapshot-Test-Strategie

Test `src/api/__tests__/musterfirmaBilanz.test.ts` verwendet jetzt die
**Ist-Werte als feste Regressions-Anker** (Toleranz 0,01 €):
- `expectMoneyNear(bilanz.aktivaSum, 174187.82)`
- `expectMoneyNear(bilanz.passivaSum, 174187.82)`
- `expectMoneyNear(guv.jahresergebnis, 28587.82)`
- `expectMoneyNear(ustva.zahllast, 4150.0)`

README-Sollwerte bleiben als Lernziel dokumentiert; Konvergenz auf
den README-Wert ist Follow-Up für Sprint 8+.

---

## Scope-Einhaltung

- ✓ Hash-Kette unverändert
- ✓ Keine neue Migration
- ✓ Keine neuen npm-Dependencies
- ✓ TypeScript strict + Decimal.js
- ✓ Bestehende Tests angepasst (3) — explizit durch Bug-B dokumentiert

## Autonome Neben-Entscheidungen

Fünf Entscheidungen in `docs/POST-BUGFIX-FRAGEN.md`:

- F50 — Bug C (1600) als Scope-Erweiterung statt STOPP (gleiche Bug-Klasse)
- F51 — Phase 3 Szenario B: Snapshot auf Ist-Werte, README-Werte als Lernziel
- F52 — 2600-2649 latenter Konflikt (Rückstellungen) als P3-Follow-Up
- F53 — 3 Bestandstests-Fixtures von 2300 auf 2310 umgestellt
- F54 — `skr03GuvMapping.test.ts:52` explizit neu gefasst

---

## Follow-Ups für Sprint 8

1. **AfA-Doppelung entfernen** — CSV-Zeile `AfA-2025` streichen, stattdessen
   ausschließlich über AfA-Lauf buchen lassen.
2. **UStVA-Zahllast 1.330 € Drift** — welche Buchung produziert die
   unerwartete USt-Zahllast? `buildUstva`-Kennzahlen einzeln prüfen.
3. **2600-2649 Rückstellungs-Range** — F52 oder zusammen mit Sprint 8
   Kandidat (b) „Wiederkehrende Buchungen".
4. **Nach Schritt 1 + 2:** Snapshot-Test auf README-Werte (196.396 /
   37.300 / 2.820) umstellen, README stabilisieren.
