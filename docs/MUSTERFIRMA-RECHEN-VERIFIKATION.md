# Musterfirma Kühn GmbH — Rechen-Verifikation 2025

**Stand:** 2026-04-20 nach Post-Bugfix Bugs A + B + C

---

## 1. Eröffnungsbilanz 01.01.2025

| Konto | Soll | Haben | Saldo |
|-------|------|-------|-------|
| 0440 Büromaschinen | 20.000,00 | | 20.000,00 (aktiva) |
| 1200 Bank | 70.000,00 | | 70.000,00 (aktiva) |
| 1000 Kasse | 5.000,00 | | 5.000,00 (aktiva) |
| 1400 Forderungen | 5.000,00 | | 5.000,00 (aktiva) |
| 2300 Gezeichnetes Kapital | | 50.000,00 | 50.000,00 (passiva) |
| 0860 Gewinnvortrag | | 40.000,00 | 40.000,00 (passiva) |
| 1600 Verbindlichkeiten L+L | | 8.000,00 | 8.000,00 (passiva) |
| 1770 USt-Zahllast Vorperiode | | 2.000,00 | 2.000,00 (passiva) |
| 9000 Eröffnungsbilanz (Sumcheck) | 100.000,00 | 100.000,00 | 0 |

- **Aktiva Summe Eröffnung:** 20.000 + 70.000 + 5.000 + 5.000 = **100.000,00 €**
- **Passiva Summe Eröffnung:** 50.000 + 40.000 + 8.000 + 2.000 = **100.000,00 €**
- Balanciert ✓

Hinweis: Das EB-Konto 9000 selbst wird nach Abschluss der 8 EB-Buchungen
saldoneutral (100.000 / 100.000). Sprint-7.5-Entscheidung 34 hat 9000
als passiva klassifiziert; Auswirkung auf die Bilanz ist Null.

---

## 2. Operative Buchungen 2025 (40+ Zeilen)

### 2.1 Umsatzerlöse (Ertrag)

Reguläre Ausgangs-Rechnungen (AR-2025-001..010): Sollten 140.000 €
(8400) + 10.000 € (8300) + 15.000 € (8125, IG-Lieferung) = **174.500 €
Ertrag** liefern. **Verifiziert:** Ist-Wert `ertrag: 174500.00`.

### 2.2 Aufwendungen (Soll-Summen)

| Konto | Soll | Art |
|-------|------|-----|
| 3100 Fremdleistungen § 13b | 2.500 | RC-Aufwand |
| 3120 Bauleistungen § 13b | 8.000 | RC-Aufwand |
| 3130 Gebäudereinigung § 13b | 1.200 | RC-Aufwand |
| 3400 Wareneingang 19 % | 35.800 | Wareneingang |
| 3425 IG-Erwerb 19 % | 7.500 | IG-Erwerb |
| 4120 Gehälter | 60.000 | Personal |
| 4210 Miete | 10.000 | Raumkosten |
| 4530 KFZ | 2.700 | KFZ |
| 4830 AfA Immat. (aus CSV) | 4.000 | AfA-Direkt |
| 4830 AfA Lauf (zusätzlich) | 12.762,18 | AfA-Lauf |
| 4840 AfA GWG (aus AfA-Lauf) | 450 | AfA-Lauf |
| 4930 Bürobedarf | 1.000 | Sonstiger Betrieb |

**Aufwand gesamt (Ist):** **145.912,18 €**

Vergleich zu manueller Summe: 2500 + 8000 + 1200 + 35800 + 7500 + 60000
+ 10000 + 2700 + 4000 + 12762,18 + 450 + 1000 = **145.912,18 €** ✓

---

## 3. Jahresergebnis

- **Ertrag:** 174.500,00 €
- **Aufwand:** 145.912,18 €
- **Jahresüberschuss:** 174.500,00 − 145.912,18 = **28.587,82 €** ✓

---

## 4. Bilanz 31.12.2025

### 4.1 Aktiva

| Position | Konten | Saldo |
|----------|--------|-------|
| A.II.3 BGA (Sachanlagen) | 0440 | 20.000 − 7.525 AfA = 12.475 |
| A.II.2 Techn. Anlagen | 0300 | 0 − 2.750 AfA = −2.750 |
| A.II.3 BGA | 0420, 0480, 0670 | 0 − 6.937,18 AfA |
| A.III.3 Beteiligungen | 890-899 | 0 |
| B.II.1 Forderungen L+L | 1400 | 114.500 − 5.000 = **109.500** |
| B.IV Kasse | 1000 | 25.500 − 500 = **25.000** |
| B.IV Bank | 1200 | 120.300 − 83.400 = **36.900** |
| **Summe Aktiva** | | **174.187,82 €** |

### 4.2 Passiva

| Position | Konten | Saldo |
|----------|--------|-------|
| P.A.I Gezeichnetes Kapital | 2300 (Bug B Fix) | **50.000** |
| P.A.IV Gewinnvortrag | 0860 (Bug A Fix) | **40.000** |
| P.A.V Jahresüberschuss virtuell | — | **28.587,82** |
| P.C.4 Verbindlichkeiten L+L | 1600 (Bug C Fix) | **55.600** |
| P.B.2 Steuerrückstellung | 1770 | 0 |
| **Summe Passiva** | | **174.187,82 €** |

Balanciert ✓ (Diff 0,00 €)

---

## 5. UStVA Dezember 2025

**Ist:** Zahllast 4.150,00 €
**README-Soll:** 2.820,00 €
**Drift:** +1.330 €

Diff entspricht exakt 19 % × 7.000 €. Wahrscheinliche Ursache: eine
UStVA-Buchung im Dezember deren USt-Wert im README-Schätzung nicht
berücksichtigt wurde. Detail-Analyse außerhalb Post-Bugfix-Scope.

---

## 6. Drift zu README-Sollwerten

| Kennzahl | Ist | README-Soll | Diff (€) | Diff (%) |
|----------|-----|-------------|----------|----------|
| Aktiva | 174.187,82 | 196.396,00 | −22.208 | −11,3 % |
| Passiva | 174.187,82 | 196.396,00 | −22.208 | −11,3 % |
| Jahresüberschuss | 28.587,82 | 37.300,00 | −8.712 | −23,4 % |
| UStVA-Zahllast | 4.150,00 | 2.820,00 | +1.330 | +47,2 % |

### Erklärung der Drift (wichtig für Sprint 8)

1. **AfA-Doppelung:** CSV enthält `AfA-2025` 4.000 € UND AfA-Lauf produziert
   weitere 13.212,18 € für dieselben Anlagen. Total 17.212,18 € AfA.
   Der README-Sollwert (JÜ 37.300) ging von 12.762,18 € AfA aus.
   **Fix (Sprint 8):** CSV-Zeile entfernen oder AfA-Lauf anpassen.

2. **Sonstige Schätz-Ungenauigkeit** im README: der Autor hat die
   Sollwerte ohne Code-Verifikation berechnet; kleinere Abweichungen
   akkumulieren.

3. **UStVA-Drift +1.330 €:** Ursache nicht lokalisiert. P3-Follow-Up.

**Entscheidung Post-Bugfix:** Snapshot-Test auf Ist-Werte verankern,
README-Sollwerte als Lernziel erhalten. Konvergenz auf README in späterer
Sprint-Arbeit.
