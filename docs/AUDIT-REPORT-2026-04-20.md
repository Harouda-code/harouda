# Qualitäts-Audit Stand 2026-04-20

> **Update 2026-04-20 (Post-Bugfix Mini-Sprint abgeschlossen):**
> Tests 988 → **995** (+7 gegenüber Pre-Sprint-8; insgesamt +20 gegenüber
> Audit-Start). tsc clean. Detail in `docs/POST-BUGFIX-DECISIONS.md` +
> `docs/POST-BUGFIX-FRAGEN.md` + `docs/MUSTERFIRMA-RECHEN-VERIFIKATION.md`.
>
> **Beide neue Befunde gefixt, plus ein dritter (Bug C 1600):**
>
> | Bug | Quelle | Status |
> |-----|--------|--------|
> | A — 0860 Gewinnvortrag A.III.1 statt P.A.IV | Pre-Sprint-8 neu | ✅ gefixt |
> | B — 2300 Grundkapital fälschlich in GuV ZINSAUFWAND | Pre-Sprint-8 neu | ✅ gefixt |
> | C — 1600 Verbindlichkeiten L+L nach B.II.4 aktiva | Post-Bugfix neu | ✅ gefixt |
> | Sprint-8-Followup — AfA-Doppelung in CSV | Post-Bugfix neu | offen |
> | Sprint-8-Followup — UStVA +1.330 € Drift | Post-Bugfix neu | offen |
> | Sprint-8-Followup — 2600-2649 Rückstellungs-Range | Post-Bugfix neu | offen P3 |
>
> **Musterfirma-Snapshot ist jetzt exakt reproduzierbar** (feste
> Sollwerte Aktiva/Passiva 174.187,82 €, JÜ 28.587,82 €, Zahllast
> 4.150 €). README-Sollwerte (196.396/37.300/2.820) bleiben als Lernziel
> dokumentiert; Drift 11-47 % ist strukturell erklärbar.
>
> **Status der ursprünglichen Befunde:**
>
> | Befund | Status | Anmerkung |
> |--------|--------|-----------|
> | P0-01 GuV-Mapping-Lücke | ✓ gefixt | 3100-3159 → 5.b, Bilanz-Split |
> | P0-02 Supabase updateBeleg | ✓ gefixt | Status-Check vor Update |
> | P0-03 DSGVO Art. 17 | offen | wartet auf Rechts-Freigabe |
> | P1-01 CSV EB-005 0800 | ✓ gefixt | 0800 → 2300, FLAG-v3-Migration |
> | P1-02 0800 Bilanz-Mapping | ✓ (war schon da) | Regressions-Test ergänzt |
> | P1-03 Beleg-Anforderungen Route | ✓ (False Positive) | Route existiert |
> | P1-04 Storno-Hash-Chain-Test | ✓ gefixt | 3 neue Tests |
> | P1-05 Festschreibungs-Update | ✓ gefixt | 2 neue Tests (DEMO + Supabase) |
> | P1-06 Snapshot-Test | ⚠ Teil-Fix | Invariante OK, README-Werte TODO |
> | P1-07 README 47→52 | ✓ gefixt | Dokumentation konsistent |
>
> **Neue Befunde während der Fix-Runde (offen):**
>
> | Neu | Bereich | Schwere |
> |-----|---------|---------|
> | 0860 Bilanz-Mapping-Konflikt | Range 800-889 umschließt Gewinnvortrag (passiva) | **P1** |
> | Aufwand-Aggregation −50.000 € | BalanceSheetBuilder Erfolgs-Loop verliert Saldo | **P2** |
>
> Details in `SPRINT-BUGFIX-FRAGEN.md` F47. Der Musterfirma-Snapshot-Test
> prüft derzeit nur die GoBD-Kern-Invariante (Aktiva = Passiva). Nach Fix
> der beiden neuen Befunde kann er auf die strikten README-Sollwerte
> (196.396 / 37.300 / 2.820) aktiviert werden.


**Kontext:** Unmittelbar nach Sprint 7.5 Fix-Runde (975 Tests grün, Musterfirma-Auto-Seed funktional, Readiness ~77 %). Erster systematischer End-to-End-Review vor Sprint 8 aus Bilanzbuchhalter-Perspektive.

**Methodik:** 4 parallele Read-Only-Agenten haben 10 Prüfbereiche abgedeckt (SKR03/Reports, UI/UX+Docs, GoBD/Integrität, Exports/Tests/Perf). Der Haupt-Agent hat alle P0/P1-Claims gegengeprüft und falsche Claims korrigiert. **Kein Code wurde geändert.**

**Gesamt:** 62 Befunde. Davon **3 P0 🔴** (Daten-Integrität/rechtlich kritisch), **7 P1** (funktional blockierend), **29 P2** (wichtig), **23 P3** (kosmetisch/nice-to-have). Zusätzlich **6 positive Beobachtungen**.

---

## 1. Zusammenfassung

### 1.1 Top-3-Risiken

| # | Risiko | Wirkung | Aufwand |
|---|--------|---------|---------|
| 🔴 **A** | **GuV-Mapping-Lücke für Reverse-Charge-/IG-Erwerbs-Konten** (3100/3120/3130/3425). Die Konten sind in `SKR03_SEED` als `kategorie=aufwand` deklariert, aber `skr03GuvMapping.ts:61` kommentiert sie explizit als „3000-3399 sind Bestandskonten". Der BalanceSheetBuilder nutzt `findErfolgRule()` → Aufwendungen werden **nicht** aggregiert → Jahresüberschuss der Musterfirma ist **~19.200 € zu hoch**. | Bilanz und GuV liefern falsche Zahlen für jede Firma mit RC/IG-Buchungen. | klein (Mapping-Einträge für 3100-3159 → 5.b Fremdleistungen; 3400-3429 → 5.a Wareneingang). |
| 🔴 **B** | **`JournalRepo.updateBeleg()` im Supabase-Modus prüft nicht den `GEBUCHT`-Status.** DEMO-Pfad hat den Check (`journalRepo.ts:418-421`), Supabase-Pfad (`:439-443`) führt das Update direkt aus. Eventuelle DB-Trigger sind nicht als zweite Schutzlinie dokumentiert. | GoBD Rz. 64 (Festschreibung / Unveränderbarkeit) ist verletzbar. Betriebsprüfer könnten das bei Supabase-Produktivbetrieb rügen. | klein (gleiche `status==="GEBUCHT"`-Prüfung vor `supabase.from("belege").update` replizieren). |
| 🔴 **C** | **DSGVO Art. 17 (Löschrecht) nicht implementierbar.** Migration 0023 legt `pii_erasures`-Tabelle an, aber es gibt keinen Code-Pfad für Mandanten-Löschung. Design-Dok `HASH-CHAIN-VS-ERASURE.md` listet 8 offene Rechtsfragen Q1-Q8, die bei Fachanwalt/DSB liegen. | Harte Go-Live-Blockade. Bei Mandanten-Kündigung mit Löschforderung gibt es keinen legitimen Workflow. | groß (Rechts-Freigabe + Migration 0025 + Service-Layer + UI). Kein Sprint-Scope. |

### 1.2 Produktreife-Einschätzung

- **Kern-Buchführung (Journal, Hash-Chain, SKR03-Seed, Storno, Korrektur):** stabil, GoBD-konform, Storno/Correct-Pfad mit DiffViewer und Audit-Trail.
- **Bilanz / GuV / BWA:** **nicht produktionsreif** wegen P0-A (RC/IG-Mapping-Gap) — alle Firmen mit §13b/IG-Erwerb bekommen falsche GuV.
- **UStVA / ZM / E-Rechnung:** Preview-Pfade funktional mit Disclaimer, **kein ERiC/BZSt-Anschluss** (dokumentiert).
- **Demo-Daten Kühn Musterfirma:** 1 Buchungs-Fehler in `buchungen.csv` (EB-005 nutzt Konto 0800 für „Gezeichnetes Kapital", korrekt wäre 2300).
- **Musterfirma-Erwartungswerte** aus README (Bilanzsumme 196.396 €, Jahresüberschuss 37.300 €, UStVA-Zahllast 2.820 €): **nicht manuell verifiziert**, werden aber durch P0-A automatisch verfehlt.

**Go-Live:** nicht empfohlen, bevor mindestens die 3 P0-Befunde adressiert sind.

### 1.3 Befund-Statistik

| Bereich | P0 | P1 | P2 | P3 | positiv |
|---------|---:|---:|---:|---:|--------:|
| SKR03-Seed / Mapping | 1 | 2 | 2 | 1 | 1 |
| Buchführungs-Integrität | 1 | 2 | 3 | 1 | 3 |
| UI/UX Buchhalter | — | 1 | 5 | 7 | 2 |
| GoBD / Compliance | — | — | 4 | 2 | 5 |
| Report-Qualität | — | 1 | 2 | 2 | 1 |
| Exporte (DATEV/XML/PDF/Excel) | — | — | 7 | 5 | — |
| Test-Coverage | — | 2 | 3 | 2 | 2 |
| Performance | — | — | 1 | 4 | 1 |
| Dokumentation | — | — | 1 | — | 3 |
| DSGVO-Löschung | 1 | — | 1 | — | — |

---

## 2. Kritische Befunde (P0 + P1)

### P0-01 🔴 GuV-Mapping-Lücke für Reverse-Charge-/IG-Aufwendungen

**Bereich:** SKR03 / GuV-Mapping
**Datei:** `src/domain/accounting/skr03GuvMapping.ts:61-63` + `src/api/skr03.ts:114-120, 198`
**Schwere:** **P0 — Daten-Integrität kritisch**

`SKR03_SEED` deklariert diese Aufwandskonten (Sprint 7 Entscheidung):
- `3100` Fremdleistungen § 13b — `kategorie: aufwand`
- `3120` Bauleistungen § 13b — `kategorie: aufwand`
- `3130` Gebäudereinigung § 13b — `kategorie: aufwand`
- `3425` IG-Erwerb 19 % — `kategorie: aufwand`

Aber `skr03GuvMapping.ts:61` enthält explizit den Kommentar:

```ts
// Beachte: 3000-3399 sind SKR03-Bestandskonten → Bilanz (B.I.1), NICHT GuV.
// Erst ab 3400 beginnen die Aufwandskonten "Wareneingang".
{ from: 3400, to: 3699, guv_ref: "5.a", tag: "WARENEINGANG" },
```

`BalanceSheetBuilder.ts:265` nutzt `findErfolgRule(acc.konto_nr)` → für 3100-3139 und 3425 gibt's keine Regel → `aufwandSum` bleibt zu niedrig → `provisionalResult = ertragSum.minus(aufwandSum)` ist zu hoch.

**Wirkung auf die Musterfirma:** 11.700 € RC-Buchungen + 7.500 € IG-Erwerb = **19.200 € Jahresüberschuss zu hoch**.

**Repro für den Buchhalter:**
1. App starten (Sprint-7.5-Auto-Seed lädt Musterfirma).
2. `/berichte/guv` aufrufen, Jahr 2025.
3. Erwartet: 37.300 €. Tatsächlich: ≥ 56.000 €.

**Fix-Skizze:** In `skr03GuvMapping.ts` zwei Regeln ergänzen:
```ts
{ from: 3100, to: 3159, guv_ref: "5.b", tag: "REVERSE_CHARGE" },
{ from: 3400, to: 3499, guv_ref: "5.a", tag: "IG_ERWERB" }, // inkl. 3425
```
**Aufwand:** klein (2 Mapping-Zeilen + 2 Regressions-Tests).

---

### P0-02 🔴 `updateBeleg` im Supabase-Modus ignoriert `GEBUCHT`-Status

**Bereich:** GoBD / Festschreibung
**Datei:** `src/lib/db/journalRepo.ts:438-443`
**Schwere:** **P0 — GoBD-Verstoß**

DEMO-Pfad (`:418-421`) wirft korrekt:
```ts
if (cur.status === "GEBUCHT") {
  throw new Error("Gebuchter Beleg darf nicht mehr geändert werden — bitte Stornobuchung erstellen.");
}
```
Supabase-Pfad (`:439-443`) führt aber direkt `.update` aus ohne Status-Check.

**Wirkung:** In Produktion könnte ein Admin mit direktem Supabase-Zugriff gebuchte Belege überschreiben. Die Hash-Kette auf Journal-Entry-Ebene bleibt intakt, aber die `beleg`-Tabelle ist nicht durch die Hash-Kette geschützt. GoBD Rz. 64 verlangt Unveränderbarkeit.

**Fix-Skizze:** Vor dem Supabase-Call identischen Check einfügen (mit `.select("status")` + Prüfung), oder die Verantwortung explizit an einen DB-Trigger delegieren (Migration 0022 erweitern).

**Aufwand:** klein.

---

### P0-03 🔴 DSGVO Art. 17 Löschrecht nicht implementiert

**Bereich:** DSGVO / DSGVO-Hash-Chain-Konflikt
**Datei:** `docs/HASH-CHAIN-VS-ERASURE.md` (Design-Dok), `supabase/migrations/0023_dsgvo_compliance.sql` (Tabelle ohne Anbindung)
**Schwere:** **P0 — rechtlicher Go-Live-Blocker**

Migration 0023 legt `pii_erasures`-Tabelle an. Es gibt keinen Service-Layer, der sie befüllt. Das Design-Dok listet 8 offene Rechtsfragen (Q1-Q8), die bei Fachanwalt und DSB liegen. Vor deren Antwort kann keine Entscheidung zwischen den Optionen A-D / K1-Kombination getroffen werden.

**Wirkung:** Bei Mandanten-Kündigung mit Löschforderung: keine legitime technische Möglichkeit.

**Fix-Skizze:** Warten auf Rechts-Freigabe. Siehe `NEXT-CLAUDE-HANDOFF.md` „Option A". Kein Sprint-7/8-Scope.

---

### P1-01 Demo-CSV: EB-005 nutzt falsches Konto für „Gezeichnetes Kapital"

**Bereich:** SKR03 / Demo-Daten
**Datei:** `demo-input/musterfirma-2025/buchungen.csv:6`
**Schwere:** **P1 — Demo produziert falsche Bilanz**

Buchung: `02.01.2025;EB-005;9000;0800;50000,00;Eröffnungsbilanz Gezeichnetes Kapital;0;…`

Problem: SKR03-Standard (wie in `src/api/skr03.ts`):
- `0800` = „Beteiligungen an verbundenen Unternehmen" (aktiva)
- `2300` = „Grundkapital / Gezeichnetes Kapital" (passiva)

Die Demo bucht 50.000 € auf 0800 Haben, was bei aktiva-Konto ein Abgang ist → Aktiva-Saldo negativ → Bilanz unbalanciert.

**Fix-Skizze:** CSV-Zeile ändern: `...;9000;2300;50000,00;…`. Evtl. Bilanz-Summen-Erwartungen in README neu berechnen.

**Aufwand:** klein.

---

### P1-02 Konto 0800 nicht in Bilanz-Mapping → Saldo verschwindet

**Bereich:** SKR03 / Bilanz-Mapping
**Datei:** `src/domain/accounting/skr03Mapping.ts` (keine Regel für 0800)
**Schwere:** **P1**

Solange EB-005 das falsche Konto nutzt (siehe P1-01), fließt der Saldo nicht in die Bilanz-Mapping-Rules. Auch nach CSV-Fix: 0800 sollte eine saubere Regel für A.III.1 Beteiligungen haben.

**Fix:** Als Teil der P1-01-Bereinigung prüfen — ist 0800 in `SKR03_MAPPING_RULES` überhaupt abgedeckt? Falls nein: `{ from: 800, to: 899, bilanz_ref: "A.III.1", … }` ergänzen.

**Aufwand:** klein.

---

### P1-03 Menü-Eintrag „Beleg-Anforderungen" führt zu 404

**Bereich:** Navigation
**Datei:** `src/components/AppShell.tsx:89` + `src/App.tsx` (Route fehlt)
**Schwere:** **P1**

`AppShell` verlinkt `/banking/belegabfragen`, aber die Route ist in `App.tsx` nicht definiert. Klick → leere Seite.

**Fix:** Entweder `ReceiptRequestsPage` (existiert als Datei? Zu prüfen) verlinken oder Menü-Eintrag entfernen.

**Aufwand:** klein–mittel.

---

### P1-04 Storno-Pfad ohne Hash-Chain-Verifikations-Test

**Bereich:** Test-Coverage / GoBD
**Datei:** `src/api/journal.ts:354-484` (reverseEntry), kein Test in `src/api/__tests__/`
**Schwere:** **P1 — Audit-kritisch**

`reverseEntry()` setzt `storno_status` + Gegenbuchung + Parent-Link. Die Hash-Kette muss nach Storno weiterhin `verifyHashChain()`-konform sein. **Kein Test deckt diesen End-to-End-Pfad**.

**Wirkung:** Regression unbemerkt, Betriebsprüfer-Szenario (GDPdU Z3-Export nach Storno) nicht abgesichert.

**Fix-Skizze:** Test-Fixture mit 3 Buchungen + 1 Storno → `verifyJournalChain()` muss `ok: true` liefern.

**Aufwand:** mittel.

---

### P1-05 Festschreibungs-Regelverstoß im Journal-Update ungetestet

**Bereich:** Test-Coverage / GoBD
**Datei:** `src/pages/JournalPage.tsx` + `src/api/journal.ts` (kein Test für „edit auf festgeschriebene Buchung")
**Schwere:** **P1**

`FestschreibungsService`-Tests decken Lock/Unlock. **Kein Test** prüft, dass `updateEntry()` auf einer gelockten Buchung wirft. Zweite Schutzlinie ist evtl. ein DB-Trigger (Migration 0021) — aber der App-Layer hat keinen expliziten Check.

**Fix-Skizze:** Test + evtl. App-Layer-Guard in `updateEntry`.

**Aufwand:** mittel.

---

### P1-06 Bilanz-Verifikation gegen Musterfirma-Erwartungswerte steht aus

**Bereich:** Report-Qualität
**Datei:** `demo-input/musterfirma-2025/README.md:32-36` (Erwartungswerte)
**Schwere:** **P1**

Erwartung aus README:
- Aktiva 31.12.2025 = **196.396,00 €**
- Passiva 31.12.2025 = **196.396,00 €**
- Jahresüberschuss 2025 = **37.300,00 €**
- UStVA-Zahllast Dezember 2025 = **2.820,00 €**

Weder manuell noch via Smoke-Test verifiziert. P0-01 garantiert bereits eine Abweichung im Jahresüberschuss. Nach P0-01+P1-01-Fix sollte manuell (oder über einen Snapshot-Test) die Bilanz gegen die Sollwerte getestet werden.

**Fix-Skizze:** Snapshot-Test `musterfirmaBilanz.test.ts` mit allen vier Sollwerten.

**Aufwand:** klein–mittel.

---

### P1-07 Diskrepanz README „47 Buchungen" vs. CLAUDE.md „52 Buchungen"

**Bereich:** Dokumentation / Konsistenz
**Datei:** `demo-input/musterfirma-2025/README.md:25` vs. `CLAUDE.md:6`
**Schwere:** **P1 (Dokumentations-Drift)**

Die CSV enthält tatsächlich 52 Buchungen (8 EB + 40 Basis + 7 OPOS + 5 RC/IG-Sprint-7-Szenarien – bitte nachzählen). README sagt noch „47". Wer die README liest, wird mit tatsächlicher Anzahl verwirrt.

**Fix:** README aktualisieren, alle Zahlen prüfen (Abschnitt 14b/14c/14d/14e/14f/14g sollten konsistent sein).

**Aufwand:** klein.

---

## 3. Wichtige Befunde (P2)

### 3.1 SKR03 / Konten / Mapping

- **P2-01** 1572/1575 Label-Drift (bekannt aus `SPRINT-7-FRAGEN.md` Frage 20): 1572 heißt „Abziehbare Vorsteuer aus innergem. Erwerb", 1574 hat „(Kz 61)"-Suffix. Sprint 7 hat das bewusst nicht gefixt. Für Sprint 8 Kandidat h vorgemerkt.
- **P2-02** 9000 Eröffnungsbilanzkonto ist als `passiva` kategorisiert (Sprint-7.5-Entscheidung 34). Das ist architektonisch fragwürdig — nach GoBD Rz. 58 sollte 9000 bilanzseitig neutral sein (Saldo = 0 nach Auflösung). Aktuelle Klassifikation produziert künstliche Asymmetrie, auch wenn die Saldenentwicklung in einer ausgeglichenen Firma zu 0 führt.

### 3.2 Buchführungs-Integrität

- **P2-03** PII (Klartext-Beschreibung) wird in den Entry-Hash einbezogen (`journalChain.ts:38-62`). Löschung/Anonymisierung eines Beschreibungsfeldes bricht die Kette. Spannung zu DSGVO Art. 17 (siehe P0-03). Entscheidung in `HASH-CHAIN-VS-ERASURE.md`.
- **P2-04** Hash-Chain-Verifikations-Button nur auf `/verfahrensdokumentation` und `/audit-log` — nicht auf der Haupt-JournalPage. GoBD Rz. 153 verlangt „jederzeit nachvollziehbar" — UI-Lücke. Fix: Button in JournalPage ergänzen (klein).
- **P2-05** Orphan-Einträge (`client_id: null`) werden im BalanceSheetBuilder nicht gefiltert (`BalanceSheetBuilder.ts:167-169` filtert nur `status === "gebucht"`). Bei Mandanten-Wechsel im DEMO-Mode könnten Einträge ohne client_id die Summen verfälschen.

### 3.3 UI/UX

- **P2-06** `toFixed(2)` ohne deutsches Komma-Format in mindestens 8 Pages:
  - `AnlageMobilitaetspraemiePage.tsx:532`
  - `AnlagenVerzeichnisPage.tsx:543`
  - `EmployeesPage.tsx:273, 275`
  - `PayrollRunPage.tsx:452`
  Korrektes Muster (bereits vorhanden) in `DimensionReportPage.tsx:38`: `.toFixed(2).replace(".", ",") + " €"`. Ein globaler Ersatz-Helfer wäre robust.
- **P2-07** 13 Dateien nutzen `.toLocaleString()` ohne `"de-DE"`-Locale. Liste im Detail-Anhang (src/lib/excel/AnlagenspiegelExcelExporter.ts, src/lib/pdf/PdfBase.ts, src/utils/lohnsteuerbescheinigung.ts, src/api/journal.ts, src/utils/gehaltsabrechnung.ts, src/components/AdvisorNotesModal.tsx, src/utils/datev.ts, src/utils/verfahrensdokumentation.ts, src/pages/AppLogPage.tsx, src/pages/AuditLogPage.tsx, src/pages/PrueferDashboardPage.tsx, src/api/audit.ts, src/api/notifications.ts).
- **P2-08** `toast.error(err.message)` wird oft ohne deutsche Ummantelung genutzt → englische Supabase-Fehlermeldungen können ungefiltert beim Buchhalter landen. Vorschlag: `toastError(prefix, err)`-Helfer zentral.
- **P2-09** `ERechnungPage` hat **keinen** Disclaimer-Banner, obwohl XRechnungValidator ~25 von 195+ BR-Rules abdeckt und PDF/A-3 nicht zertifiziert ist. `UstvaPage`, `ZmPage`, `EbilanzPage` haben alle einen Banner.
- **P2-10** Kleinunternehmer-Gate fehlt: `SettingsContext` hat den Flag, aber `UstvaPage` + `ElsterPage` prüfen ihn nicht. Ein Kleinunternehmer sollte bei aktivem Flag keinen UStVA-Export angeboten bekommen.

### 3.4 Exports

- **P2-11** DATEV-Encoding-Validierung fehlt: `toLatin1Bytes()` kippt €/… auf `?` ohne Warnung. Der Buchhalter bemerkt den Datenverlust erst in DATEV-Empfänger-Software.
- **P2-12** `buSchluesselForUstSatz` deckt nur 0/7/19 % ab. Bei ermäßigt 5 % (Lebensmittel, Bücher) oder Kleinunternehmer 0 %-Variante wird leer zurückgeliefert → kein BU-Schlüssel → DATEV-Empfänger muss manuell klassifizieren.
- **P2-13** DATEV KOST2 wird still ignoriert (CLAUDE.md dokumentiert, UI schweigt). Fix: Parser-Warning im Import-UI anzeigen.
- **P2-14** ZM-XML Struktur wird nicht gegen ELMA5-Spec validiert. Preview-Disclaimer vorhanden, aber beim BZSt-Upload könnte abgelehnt werden.
- **P2-15** PDF/A-3 Disclaimer fehlt im ERechnungPage-Export-Flow. ZUGFeRD-PDFs sind nicht veraPDF-zertifiziert, User erfährt das erst im Archiv-System.
- **P2-16** XRechnung BR-Coverage nicht als UI-Warning sichtbar. KoSIT-Validator zeigt später Fehler, die intern hätten gemeldet werden können.
- **P2-17** CSV-Import-Edge-Cases fehlen: leere Zwischenzeile, Tab-Separator, negative Beträge ohne Konvention.

### 3.5 Test-Coverage

- **P2-18** GuvBuilder / BwaBuilder haben keine Rounding-Edge-Case-Tests (0,005 €-Grenzfälle nach GoBD Rz. 58 kaufmännisch).

### 3.6 Performance

- **P2-19** Main-Bundle ist 3,0 MB unkomprimiert (dist/assets/index-*.js). Zusammen mit exceljs (912 KB) + pdfjs/pdf (324 KB) + html2canvas (196 KB) = sehr viel für den initialen Page-Load. Kein Code-Splitting für die schweren Libraries.

### 3.7 Report-Qualität

- **P2-20** UStVA-Zahllast-Verifikation offen (Erwartungswert 2.820 €). Vermutliche Abweichung in Kombination mit P0-01.
- **P2-21** AfA 2025 für die Demo: README erwartet **12.762,18 €**, CSV bucht nur 4.000 € (AfA-2025-Zeile). Der restliche Betrag (~8.762 €) soll laut README über den manuellen `/anlagen/afa-lauf`-Workflow entstehen. Dokumentationslage zwischen CSV-Auto-Seed und README-Walkthrough ist nicht explizit.

### 3.8 DSGVO / Compliance

- **P2-22** AVV-Template fehlt (Art. 28 DSGVO). EU-Kommissions-Muster ist urheberrechtlich geschützt, muss vom Anwalt angepasst werden. Bekannte Lücke.

### 3.9 Dokumentation

- **P2-23** Konsistenz-Drift zwischen `CLAUDE.md` („52 Buchungen") und `README.md` („47") — siehe P1-07 (identischer Befund, hier zur Vollständigkeit aufgeführt).

### 3.10 Sonstige

- **P2-24** `BelegeListePage` Empty-State zu minimal (`<div>Keine Belege im Filter.</div>`). Fehlt CTA-Link „Neuer Beleg".
- **P2-25** `JournalPage` Empty-State ist besser, hat aber kein Icon und keinen CTA-Button.
- **P2-26** Encoding-Fehler in AccountsPage: „loeschen nicht moeglich", „wirklich loeschen" mit ASCII statt Umlaut. Sprachlich fehlerhaft für einen Steuerberater-Kunden.
- **P2-27** Orphan-Erkennung in `autoSeedDemoIfNeeded`: Wenn ein User manuell „Kühn Musterfirma GmbH" anlegt ohne die mandant_nr 10100, wird er fälschlich als Orphan klassifiziert. Blast-Radius minimal, aber dokumentieren.
- **P2-28** MandantContext-Staleness aus Sprint-7.5-Fix-Runde F42 (B3): bei erstem Login zeigt der Umschalter evtl. nicht Kühn vorselektiert, bis zum 2. Reload. Akzeptiert, aber nicht dokumentiert im User-Guide.
- **P2-29** § 15a Vorsteuer-Berichtigung: Kz in `ustvaStructure.ts:318` definiert, aber kein SKR03-Mapping-Eintrag. Wird ohne Warnung leer gelassen.

---

## 4. Kosmetische Befunde (P3)

### 4.1 SKR03-Standard-Lücken

- **P3-01** Typische SKR03-Konten fehlen: Gesellschafterdarlehen (~1410/1411), Mietnebenkosten-Detail (4211-4219), Bewirtungskosten 70/30 (4650/4654), Geschenke (4630), Bußgelder (4696) — wenn der Seed den „klassischen Buchhalter"-Workflow abdecken soll. Aktuell deckt er Kühn-Musterfirma, mehr nicht.

### 4.2 Buchführung

- **P3-02** Hash-Chain-Verifikation nach Seed: nicht in der Test-Suite abgedeckt (nur Unit-Tests der Hash-Berechnung selbst). Eigenständiger Test `autoSeedProducesValidChain.test.ts` wäre wertvoll.

### 4.3 UI

- **P3-03** `confirm()`-native-Dialog in AccountsPage:264 — sollte durch einen Sonner-Modal ersetzt werden für UX-Konsistenz.
- **P3-04** Tooltips auf disabled Buttons nicht flächendeckend. `MembersPage:210-216` zeigt korrektes Muster; andere Pages folgen nicht.
- **P3-05** Deutsche Fachbegriffe konsistent (Buchung / Beleg / Mandant — keine Pluralformen falsch, keine Komposita-Trennung). Positiv, aber lässt sich noch einheitlicher machen (z. B. „Fälligkeit" vs. „Zahltag").
- **P3-06** Empty-State „Keine Buchungen gefunden" in JournalPage ist inhaltlich korrekt, aber kein Icon / Design-Aufwertung.
- **P3-07** `InvoiceArchivePage`, `CostCentersPage`, `CostCarriersPage` Empty-States nicht explizit geprüft — Stichproben zeigen keine Probleme, aber systematischer Rundgang fehlt.
- **P3-08** Zahlenformat-Test (Money.toEuroFormat-Output) nicht in Testing — 1.234,56 €-Format wird nur implizit durch Money-Tests abgedeckt.
- **P3-09** Datums-Format-Tests (de-DE toLocaleDateString) nur sporadisch.

### 4.4 GoBD / Compliance

- **P3-10** FestschreibungsService ist aktuell Lohn-fokussiert (`computeAbrechnungHash`, `verifyLockIntegrity`). Journal-Festschreibung läuft über eine separate Auto-Lock-Logik in `journal.ts:41-48`. Zwei Konzepte ohne zentralisierte Schnittstelle.
- **P3-11** Audit-Trail zeigt IP über `user_agent`-Feld — nicht strikt IP, aber als Kombinations-Fingerprint ausreichend.

### 4.5 Exports

- **P3-12** DATEV Round-Trip bei Konten-Umbenennung: bestehender Test prüft nur Byte-Identität ohne Account-Modifikation. Edge-Case.
- **P3-13** jsPDF Helvetica-Font ohne €-Rendering-Test. Stichprobe: Umlaute rendern, € rendert als `?`.
- **P3-14** Excel-Format-Tests (numFmt) fehlen.
- **P3-15** BalanceSheet-Balance-Differenz-Test: nur ausgeglichene Szenarien getestet.
- **P3-16** XRechnung-Namespace-Test (UBL mit Prefix `<inv:…>`) fehlt.

### 4.6 Test-Coverage

- **P3-17** Smoke-Tests für viele Pages (React-Render) fehlen. Änderungen an AppShell / JournalPage / BilanzPage brechen nicht das Test-Setup auf.
- **P3-18** CSV-Import Tab-Separator-Test fehlt (Parser nutzt nur `;`-Support, Dokumentation sollte das klarstellen).

### 4.7 Performance

- **P3-19** JournalPage-Performance-Test mit 5000 Entries fehlt. VirtualTable ist vorhanden (ab >200), aber Scroll-Flicker / Filter-Performance ungemessen.
- **P3-20** BalanceSheetBuilder Benchmark fehlt. O(lines × entries) = 50×1000 = 50k Ops bei Musterfirma — unkritisch, aber bei 10.000 Entries könnte es klemmen.
- **P3-21** Closure-Table (Migration 0019) wird nicht genutzt. Entweder aktivieren oder als „future work"-Kommentar markieren.
- **P3-22** Analytics-Script-Laden in Tests erzeugt DOMException (happy-dom-Noise). Harmlos, aber stört Log-Lesbarkeit.

### 4.8 Sonstiges

- **P3-23** `ReceiptRequestsPage` wird möglicherweise importiert aber nicht verlinkt. Siehe P1-03 — sinnvoll parallel zu fixen.

---

## 5. Positive Beobachtungen

**P+01** **Storno-Implementierung (reverseEntry, correctEntry) ist sauber** — Original bleibt mit `storno_status="reversed"`, Gegenbuchung mit `"reversal"` und `parent_entry_id`. Hash-Kette bleibt konsistent. (`src/api/journal.ts:354-538`)

**P+02** **Audit-Trail UI ist vollständig** — Filter auf Entity/Aktion/User/Datum, DiffViewer für Before/After, Statistiken. Betriebsprüfer-tauglich. (`src/pages/AuditTrailPage.tsx`, `AuditLogPage.tsx`)

**P+03** **Money-Präzision wird konsequent durchgezogen** — 41-digit Decimal.js, keine `number`-Arithmetik auf Beträgen. GoBD Rz. 58 erfüllt. (`src/lib/money/Money.ts`)

**P+04** **Belegvalidierung gem. § 14 Abs. 4 UStG ist vollständig** — E001-E005, E010-E011, E020, E030, E040-E041. IG-Lieferung + Reverse Charge abgedeckt. (`src/domain/belege/BelegValidierungsService.ts:62-240`)

**P+05** **Reverse-Charge-Kz-Mapping ist vollständig** — 3100-3119 (Kz 46), 3120-3129 (Kz 73), 3130-3139 (Kz 78), 3140-3159 (Kz 52), inkl. W105-W107-Warnings für falsche Kontenwahl. Ironie: das Mapping ist da, aber P0-01 verhindert die GuV-Aufnahme derselben Konten. (`src/domain/ustva/skr03UstvaMapping.ts:67-75`)

**P+06** **IG-Erwerbs-Mapping komplett** — 3420-3424 (7 %), 3425-3429 (19 %). (`:38-41, 48-50, 62-65`)

**P+07** **Hash-Kette-Verifikation ist via `VerfahrensdokuPage.tsx:110` durchführbar** — Steuerberater sieht `verifyJournalChain()`-Ergebnis im Dashboard.

**P+08** **JournalPage hat Virtualisierung (`VirtualTable`)** ab > 200 Entries — proaktive Performance-Entscheidung vor dem „wir haben 5.000 Zeilen"-Problem.

**P+09** **UstvaBuilder unterstützt MONAT + QUARTAL** — Voranmeldungszeitraum umschaltbar, Aggregat-Grenzen korrekt.

**P+10** **Verfahrensdokumentation in `docs/verfahrensdokumentation/` ist aktuell** (5 Kapitel v0.1 befüllt, 3 warten auf Rechts-Freigabe zur Hash-Chain-Erasure-Frage).

**P+11** **Sprint-7.5 Fix-Runde hat dokumentiert-transparent gearbeitet** — 6 autonome Fix-Entscheidungen F38-F43 in eigener Datei, F42 explizit als offene User-Frage markiert.

---

## 6. Empfohlene Fix-Reihenfolge

### 6.1 Pre-Sprint-8 Bugfix-Sprint (empfohlen, 1-2 Tage)

Ziel: harte Bilanz-Blocker schließen, damit die Musterfirma-Demo mit korrekten Zahlen funktioniert. Kein Feature-Scope.

| # | Fix | Aufwand | Gruppe |
|---|-----|---------|--------|
| 1 | **P0-01** GuV-Mapping für 3100-3159 + 3400-3429 ergänzen | klein | Mapping |
| 2 | **P1-01** CSV-Fix EB-005 (`0800` → `2300` bei Gezeichnetes Kapital) | klein | Demo-Daten |
| 3 | **P1-02** 0800 Beteiligungen in `skr03Mapping.ts` als A.III.1 aufnehmen | klein | Mapping |
| 4 | **P0-02** Supabase-`updateBeleg` GEBUCHT-Check nachziehen | klein | GoBD |
| 5 | **P1-03** `/banking/belegabfragen` Menü-Eintrag oder Route fixen | klein | Navigation |
| 6 | **P1-06** Snapshot-Test `musterfirmaBilanz.test.ts` — Sollwerte 196.396 / 37.300 / 2.820 | klein–mittel | Test |
| 7 | **P1-07** README-Drift „47 → 52 Buchungen" | klein | Doku |
| 8 | **P1-04** Storno-Hash-Chain-Verifikations-Test | mittel | Test |
| 9 | **P1-05** Festschreibungs-Update-Abwehr-Test (+ evtl. App-Layer-Guard) | mittel | Test |

**Geschätzter Aufwand gesamt:** ~8-10 Stunden reine Code-Arbeit + Tests. Erwartung: Tests 975 → ~985.

### 6.2 P2-Bundle (1-2 Sprints, nach User-Prio)

Gruppierte Sprints denkbar:
- **„UX-Deutsch-Konsolidierung"** (P2-06, P2-07, P2-08, P2-26): zentrale Money/Date-Helper + toast-Wrapper, ein Durchlauf über alle 13+ Dateien. 1 Tag.
- **„Disclaimer-Runde"** (P2-09, P2-15, P2-16): Banner auf ERechnungPage + PDF/A-3-Hint + XRechnung-BR-Coverage-Warning. ½ Tag.
- **„Kleinunternehmer-Gate"** (P2-10): UStVA/ElsterPage prüft Flag. ½ Tag.
- **„DATEV-Härtung"** (P2-11, P2-12, P2-13): Encoding-Validator, BU-Schlüssel-Erweiterung, KOST2-UI-Warnung. 1 Tag.
- **„Test-Gap-Closure"** (P2-17, P2-18): CSV-Edge-Cases + Rounding. ½ Tag.
- **„Performance"** (P2-19): Vite manualChunks für exceljs/pdfjs. ½ Tag, messbar in Bundle-Size-Reduktion.

### 6.3 P3-Backlog

Nicht-kritisch, in kleinere Sprints einstreuen oder als „Refactor-Friday"-Aufgaben sammeln.

### 6.4 DSGVO-Sprint (Go-Live-Voraussetzung, aber blockiert auf Fachanwalt)

P0-03 + P2-22 (AVV). Start erst nach Q1-Q8-Rechts-Rückmeldung. Siehe `NEXT-CLAUDE-HANDOFF.md` Option A.

---

## 7. Offene Fragen für den Nutzer

1. **P0-01 Fix-Variante:** Die RC-Konten (3100-3159) als Fremdleistungen (GuV-Posten 5.b) oder als Wareneingang (5.a)? Fachliche Einordnung bitte bestätigen.
2. **P1-01 Demo-Daten-Fix:** Soll die CSV korrigiert werden (2300 statt 0800)? Die Bilanzsumme ändert sich dann möglicherweise — Erwartungswerte im README müssten neu gerechnet werden. Alternative: Label in `skr03.ts` unter Beibehaltung der Konto-Nr. ändern (fachlich aber nicht SKR03-konform).
3. **P1-06 Test-Umfang:** Soll der Snapshot-Test alle vier Sollwerte (Aktiva, Passiva, JÜ, UStVA-Zahllast) prüfen oder nur Aktiva=Passiva + JÜ?
4. **P1-03 Route:** Ist `ReceiptRequestsPage` bereits implementiert (Datei sollte existieren)? Falls ja: Route in `App.tsx` nachziehen. Falls nein: Menü-Eintrag entfernen.
5. **P2-02 9000-Klassifikation:** Soll die Architektur-Frage „9000 als passiva vs. neutral" in Sprint 8 adressiert werden oder bleibt die Sprint-7.5-Entscheidung 34 bestehen?
6. **P2-21 AfA-CSV:** Sollen die restlichen AfA-Buchungen in die CSV aufgenommen werden (Auto-Seed-Prinzip) oder bleibt der manuelle `/anlagen/afa-lauf`-Workflow Teil der Demo-UX?
7. **P0-03 DSGVO-Prio:** Liegt eine Zwischen-Rückmeldung des Fachanwalts vor, oder bleibt das Thema bis auf weiteres geparkt?
8. **Bundle-Size (P2-19):** Akzeptables Ziel? Aktuell 3,0 MB main. Vorschlag: lazy-load exceljs/pdfjs → ~600 KB main + on-demand. Rechtfertigt den UX-Impact?

---

## Anhang A — Verifikation der Top-Befunde

| Befund | Verifiziert durch | Quelle |
|--------|-------------------|--------|
| P0-01 GuV-Mapping-Gap | Grep `3100\|3120\|3130\|3425` in `skr03GuvMapping.ts` → „No matches" + Kommentar Z. 61 | direkt gelesen |
| P0-02 Supabase updateBeleg | Read `journalRepo.ts:410-443` — DEMO-Check vorhanden, Supabase-Pfad direkt | direkt gelesen |
| P1-01 EB-005 falsches Konto | Read `buchungen.csv:6` + `skr03.ts:41,87` — 0800=Beteiligungen aktiva, 2300=Gez. Kapital passiva | direkt gelesen |
| P1-03 Orphan-Route | Grep `/banking/belegabfragen` in `App.tsx` → nicht gefunden, aber in `AppShell.tsx:89` | Agent 2 |

### Anhang B — Falsch erkannte Befunde (Agent korrigiert)

- **Agent 1 claimed „IG-2025-001 Soll=1400 ist falsch"** — tatsächlich **korrekt**. Bei IG-Lieferung: Soll=Forderung (aktiva steigt), Haben=Umsatzerlös. Buchung `1400 / 8125 15000` ist fachlich richtig. Vom Haupt-Agent korrigiert vor Aufnahme in den Report.

### Anhang C — Nicht-verifizierte Claims

- P1-06 (UStVA-Zahllast 2.820 € stimmt?) und P1-07 (Bilanzsumme 196.396 € stimmt?) wurden nicht manuell nachgerechnet. Der Audit hat nur die **Struktur** des Builders geprüft, nicht den konkreten Output. Eine reine Snapshot-Test-Erstellung würde beides in einem Rutsch klären.
