# Open Questions · Jahresabschluss-E1 2026-04-21

## Frage 1 (Schritt 6) — Bank-Reconciliation-Persistenz — **GELÖST**

**User-Entscheidung (2026-04-21 Nachtrag):** Tech-Debt-Ticket +
Warning-Finding im Validator. Siehe
`docs/TECH-DEBT-BANK-RECONCILIATION-PERSISTENZ.md` und neuen Code
`CLOSING_BANK_RECON_NOT_AUTOMATED` in `validateYearEnd`.

---

## Frage 1 (Original-Kontext)

**Kontext:** `BankReconciliationPage.tsx` (1058 LOC) lädt Kontoauszüge
per Upload (MT940/CAMT.053/CSV), macht lokales Matching gegen offene
Posten im Page-State. **Nichts davon wird persistiert** — weder
Kontoauszug-Zeilen noch Match-Status.

**Frage:** Wie soll `detectBankReconciliationGaps(mandantId, jahr)`
strukturell Gaps erkennen ohne persistierten Abgleichsstand?

**Default-Annahme:** Funktion liefert **leeres Array** (keine bekannten
Gaps). Das ist rein technisch korrekt (nichts zu vergleichen) und lässt
den Closing-Validator nicht aus falscher Warnung warnen. In
Gap-Detection wird erst sinnvoll, wenn ein Folge-Sprint die Statement-
Persistierung ergänzt.

**Review-Dringlichkeit:** niedrig (heutige Funktionalität ist
unverändert; nur die Validator-Signal-Seite ist vorerst „still").

**Betroffene Dateien:**
- `src/domain/banking/BankReconciliationGaps.ts`
- `src/domain/banking/__tests__/BankReconciliationGaps.test.ts`
- `src/domain/accounting/ClosingValidation.ts` (Validator nutzt die
  Funktion)

**Review-Frage für Product/Steuerberater:** Sollte ein persistenter
Reconciliation-State als eigener Sprint vorgezogen werden, bevor die
volle Closing-Pipeline live geht?

## Frage 2 (Schritt 7) — EÜR↔GuV-Cross-Check für Kapitalgesellschaften — **offen, wird in E2 behandelt**

**Kontext:** `EuerGuvCrossCheck` (aus Phase 3) existiert und wird vom
Closing-Validator aufgerufen. Für **Kapitalgesellschaften (GmbH/AG/UG)**
ist EÜR nicht zutreffend — sie erstellen Bilanz + GuV nach HGB § 264.

**Frage:** Soll der Closing-Validator den EÜR↔GuV-Check auch für GmbHs
laufen lassen oder Rechtsform-abhängig überspringen?

**Default-Annahme:** Check wird **unabhängig von Rechtsform ausgeführt**
und bei Abweichung als `WARNING` (nicht `ERROR`) geflagt. Für GmbHs mit
parallelem EÜR-Export (unüblich, aber möglich) bleibt der Check
informativ. Für Einzelunternehmen bleibt er wie heute. Die Rechtsform-
abhängige Suppression ist E2-Scope (Rules-Engine).

**Review-Dringlichkeit:** niedrig.

**Betroffene Dateien:**
- `src/domain/accounting/ClosingValidation.ts`
- Tests dafür
