# Steuerparameter — Changelog

Versionskontrolle für alle steuerrechtlichen Werte, die in den Rechnern
(GewSt, KSt, UStVA, EÜR, Anlage N, SV-Beiträge) verwendet werden.

**Wichtig**: Diese Werte sind *kein* offizieller amtlicher Datenbestand. Sie
sind aus öffentlich zugänglichen Gesetzen, BMF-Schreiben, Sozialversicherungs-
Rechengrößen-Verordnungen und den Bekanntmachungen des BZSt abgeleitet. Vor
produktivem Einsatz vergleichen Sie die Werte mit der jeweils aktuellen
amtlichen Veröffentlichung.

Dateien:
- `src/data/steuerParameter/2024.ts` — Veranlagungsjahr 2024
- `src/data/steuerParameter/2025.ts` — Veranlagungsjahr 2025
- `src/data/steuerParameter/2026.ts` — Veranlagungsjahr 2026 (vorläufig)
- `STEUERPARAMETER_VERSION` — aktuelle Paket-Version, wird in Audit-Logs und
  UStVA-XML mitgeschrieben

---

## Änderungen 2024 → 2025

| Parameter | 2024 | 2025 | Quelle |
|---|---|---|---|
| Grundfreibetrag | 11.604 € | 12.096 € | § 32a EStG i. d. F. Inflationsausgleichsgesetz |
| Soli-Freigrenze (Single) | 18.130 € | 19.950 € | § 3 SolzG, angepasst an Grundfreibetrag |
| Kleinunternehmer-Grenze Vorjahr | 22.000 € | 25.000 € | § 19 UStG i. d. F. Wachstumschancengesetz (ab 1.1.2025) |
| Kleinunternehmer-Grenze laufend | 50.000 € | 100.000 € | § 19 UStG i. d. F. Wachstumschancengesetz |
| Kinderfreibetrag je Elternteil | 4.656 € | 4.800 € | § 32 Abs. 6 EStG |
| PV-Basis AN-Anteil | 1,7 % | 1,8 % | GKV-Finanzstabilisierungsgesetz, PV-Anhebung |
| PV-Basis AG-Anteil | 1,7 % | 1,8 % | — |
| BBG KV/PV monatlich | 5.175 € | 5.512,50 € | Sozialversicherungs-Rechengrößen-VO 2025 |
| BBG RV/AV West | 7.550 € | 8.050 € | — |
| BBG RV/AV Ost | 7.450 € | 8.050 € (bundeseinheitlich) | Rentenangleichung vollzogen |

### Unverändert

| Parameter | Wert | Quelle |
|---|---|---|
| Arbeitnehmer-Pauschbetrag | 1.230 € | § 9a Nr. 1a EStG |
| Werbungskostenpauschale KAP | 1.000 € | § 20 Abs. 9 EStG |
| Entfernungspauschale 1–20 km | 0,30 €/km | § 9 Abs. 1 Nr. 4 EStG |
| Entfernungspauschale ab 21. km | 0,38 €/km | § 9 Abs. 1 Nr. 4 EStG (befristet bis VZ 2026) |
| USt-Regelsatz | 19 % | § 12 Abs. 1 UStG |
| USt-ermäßigter Satz | 7 % | § 12 Abs. 2 UStG |
| GewSt-Messzahl | 3,5 % | § 11 Abs. 2 GewStG |
| GewSt-Freibetrag natürliche Personen | 24.500 € | § 11 Abs. 1 Nr. 1 GewStG |
| KSt-Satz | 15 % | § 23 Abs. 1 KStG |
| Soli-Satz | 5,5 % | § 4 SolzG |
| KV-Allgemein (ohne Zusatzbeitrag) | 14,6 % | § 241 SGB V |
| RV | 18,6 % | § 158 SGB VI |
| AV | 2,6 % | § 341 Abs. 2 SGB III |
| PV-Zuschlag kinderlos | 0,6 % | § 55 Abs. 3 SGB XI |
| PV-Abschlag je Kind (2.–5.) | 0,25 % | § 55 Abs. 3a SGB XI |

### Krankenkassen-Zusatzbeiträge

Durchschnittssatz 2025: **2,5 %** (Vorjahr: 1,7 %). Die App führt für jeden
Jahrgang eine repräsentative Kassenliste mit deren aktuellem Zusatzbeitrag
(siehe `sv.krankenkassen` im jeweiligen Jahr).

---

## Änderungen 2025 → 2026 (vorläufig)

| Parameter | 2025 | 2026 (Entwurf) | Quelle |
|---|---|---|---|
| Grundfreibetrag | 12.096 € | 12.348 € | Entwurf Inflationsausgleichsgesetz |
| Soli-Freigrenze | 19.950 € | ~20.350 € | Anpassung an Grundfreibetrag |
| BBG KV/PV monatlich | 5.512,50 € | ~5.700 € | Schätzung SV-Rechengrößen-VO 2026 |
| BBG RV/AV | 8.050 € | ~8.300 € | Schätzung |
| Entfernungspauschale ab 21. km | 0,38 €/km | 0,38 €/km (letztes Jahr) | befristet bis VZ 2026, danach gesetzgeberische Entscheidung offen |

> ⚠️ **2026er Werte sind vorläufig.** Die endgültigen Zahlen werden i. d. R.
> erst im 4. Quartal 2025 veröffentlicht. Aktualisieren Sie
> `src/data/steuerParameter/2026.ts` und setzen Sie `reviewStatus` auf
> `"bestaetigt"`, sobald die finalen Sätze vorliegen.

---

## Review-Prozess

1. **Quartalsweise** (spätestens zum Veröffentlichungstermin der
   SV-Rechengrößen-VO im Q4): Abgleich aller Werte mit den amtlichen
   Bekanntmachungen.
2. **Bei BMF-Schreiben**: ad-hoc-Anpassung mit Erhöhung von
   `STEUERPARAMETER_VERSION`.
3. **Änderungen** werden hier ergänzt, inkl. Datum, Quelle und Diff.

| Datum | Paket-Version | Änderungen |
|---|---|---|
| 2026-04-18 | `2026.04.18` | Initiale Veröffentlichung mit Jahrgängen 2024, 2025 (bestätigt) und 2026 (vorläufig). |

---

## Verwendungsstellen im Code

Beim Wechsel auf einen neuen Jahrgang überprüfen, dass folgende Stellen den
Jahres-Parameter-Zugriff nutzen (keine hartkodierten Werte mehr!):

- `src/pages/GewerbesteuerPage.tsx` (MESSZAHL, FREIBETRAG_NAT)
- `src/pages/KoerperschaftsteuerPage.tsx` (KST_SATZ, SOLI_SATZ, GEWST_MESSZAHL)
- `src/pages/AnlageNPage.tsx` (entfernungspauschale, Krankenkassen-Liste)
- `src/data/svRates.ts` (BBG, Beiträge)
- `src/utils/elster.ts` (Produkt/Formular/Parameter-Versionen im UStVA-XML)

Grep nach „hardcoded" oder nach konkreten Zahlen (z. B. `24500`, `11604`,
`14.6`) in `src/` sollte nach einem Jahrgangs-Update keine Treffer außerhalb
von `src/data/steuerParameter/` finden.
