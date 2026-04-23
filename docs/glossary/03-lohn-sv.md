# 03 · Lohn & Sozialversicherung — Lohnabrechnung (Brutto → Steuern → SV → Netto)

**Inhalt:** Grundbegriffe der deutschen Lohnabrechnung (Lohnsteuer,
Kirchensteuer, Solidaritätszuschlag) und die vier Zweige der gesetzlichen
Sozialversicherung (Kranken-, Renten-, Arbeitslosen-, Pflegeversicherung).
Die Reihenfolge der Einträge folgt dem tatsächlichen Ablauf einer
Lohnabrechnung: von **Bruttolohn** (1) → Steuerabzüge (2–4) →
SV-Abzüge (5–9) → **Nettolohn** (10).

Baut auf auf [01-grundlagen.md](./01-grundlagen.md) (AO, HGB) und
[04-steuer-meldungen.md](./04-steuer-meldungen.md) (insb. [LStA](./04-steuer-meldungen.md#20-lohnsteuer-anmeldung-lsta) und
[Steueranmeldung](./04-steuer-meldungen.md#13-steueranmeldung--steuererklärung-gegenüberstellung)).

**Ausgeklammert (künftige Erweiterungen):** Entgeltersatzleistungen
(Krankengeld, Elterngeld, Mutterschaftsgeld), Pfändungstabelle und
Lohnpfändung (§ 850 ff. ZPO), Betriebliche Altersvorsorge (bAV).

> **Modul-Metadaten**
> **Modul:** 03 · Lohn & SV · **Einträge:** 20 FEST · **Stand:** 2026-04-23
> **Baut auf:** [01-grundlagen.md](./01-grundlagen.md), [04-steuer-meldungen.md](./04-steuer-meldungen.md) · **Spätere Module:** —

---

## Inhaltsverzeichnis

1. [Bruttolohn](#1-bruttolohn)
2. [Lohnsteuer (LSt)](#2-lohnsteuer-lst)
3. [Kirchensteuer (KiSt)](#3-kirchensteuer-kist)
4. [Solidaritätszuschlag (SolZ)](#4-solidaritätszuschlag-solz)
5. [Sozialversicherung (SV)](#5-sozialversicherung-sv)
6. [Krankenversicherung (KV)](#6-krankenversicherung-kv)
7. [Rentenversicherung (RV)](#7-rentenversicherung-rv)
8. [Arbeitslosenversicherung (ALV)](#8-arbeitslosenversicherung-alv)
9. [Pflegeversicherung (PV)](#9-pflegeversicherung-pv)
10. [Nettolohn](#10-nettolohn)
11. [ELStAM — Elektronische Lohnsteuer-Abzugsmerkmale](#11-elstam--elektronische-lohnsteuer-abzugsmerkmale)
12. [DEÜV-Meldeverfahren](#12-deüv-meldeverfahren)
13. [Beitragsbemessungsgrenze (BBG)](#13-beitragsbemessungsgrenze-bbg)
14. [Jahresarbeitsentgeltgrenze (JAEG)](#14-jahresarbeitsentgeltgrenze-jaeg)
15. [Minijob / geringfügige Beschäftigung](#15-minijob--geringfügige-beschäftigung)
16. [Midijob / Übergangsbereich](#16-midijob--übergangsbereich)
17. [Pauschsteuer (§§ 40–40b EStG)](#17-pauschsteuer--40--40b-estg)
18. [Umlageverfahren (U1, U2, U3)](#18-umlageverfahren-u1-u2-u3)
19. [Versicherungsnummer (VSNR)](#19-versicherungsnummer-vsnr)
20. [Lohnabrechnung / Entgeltabrechnung](#20-lohnabrechnung--entgeltabrechnung)

---

## 1. Bruttolohn

| Feld | Inhalt |
|---|---|
| **Deutsch (primär)** | Bruttolohn |
| **Synonyme (DE)** | Bruttoarbeitsentgelt, Bruttogehalt, Bruttoverdienst |
| **Arabisch** | الراتب الإجمالي (المبلغ الكامل المستحق للموظّف قبل أي اقتطاعات ضريبية أو تأمينية؛ يشمل الراتب الأساسي — Grundlohn — بالإضافة إلى البدلات والمكافآت والمزايا العينية — Sachbezüge — ويمثّل الأساس الذي تُحسَب منه كل الضرائب والاشتراكات في قسيمة الراتب — Lohnabrechnung) |
| **Englisch (Code-Kontext)** | `gross_wage` / `gross_salary` |
| **Kategorie** | Datentyp / Lohn-Bestandteil |
| **Status** | FEST |
| **Aufgenommen am** | 2026-04-22, Terminology-Sprint 1 |

### Definition
Der vom Arbeitgeber geschuldete Gesamt-Geldwert der Arbeitsleistung **vor jeglichen Abzügen** für Steuern oder Sozialversicherung. Umfasst neben dem vertraglichen Grundlohn alle Zulagen, Zuschläge, Sachbezüge und Einmalzahlungen, soweit sie arbeitsrechtlich geschuldet oder freiwillig gewährt werden. Bildet die **Bemessungsgrundlage** für nahezu alle nachfolgenden Abzüge.

**Typische Bestandteile:**
- Grundlohn / Grundgehalt (tariflich oder vertraglich)
- Zuschläge für Sonn-, Feiertags- und Nachtarbeit (SFN-Zuschläge, § 3b EStG — teilweise steuer- und SV-frei)
- Sachbezüge / geldwerte Vorteile (Dienstwagen § 8 Abs. 2 EStG, freie Verpflegung, Jobticket)
- Vermögenswirksame Leistungen (VWL)
- Einmalzahlungen (Weihnachtsgeld, Urlaubsgeld, 13. Monatsgehalt, Bonus)
- Überstundenvergütung, Prämien, Provisionen

### Rechtsgrundlage
- § 611a BGB — Arbeitsvertrag (Grundlage der Zahlungspflicht)
- § 14 SGB IV — Arbeitsentgelt (SV-rechtliche Definition)
- § 19 EStG — Einkünfte aus nichtselbständiger Arbeit
- § 2 Abs. 1 LStDV — Arbeitslohn (steuerrechtliche Konkretisierung)
- § 3b EStG — Steuerfreiheit bestimmter Zuschläge (Nacht 25 %, Sonntag 50 %, Feiertag 125 %)
- § 8 Abs. 2 EStG — Bewertung geldwerter Vorteile

**Verwandte Begriffe:**
- [Nettolohn](#10-nettolohn) — Ergebnis nach allen Abzügen (Gegenpol)
- [Lohnsteuer (LSt)](#2-lohnsteuer-lst) — erste Abzugsart auf Brutto-Basis
- [Sozialversicherung (SV)](#5-sozialversicherung-sv) — zweite Abzugsart
- **Steuerbrutto vs. SV-Brutto** — in der Praxis oft **nicht identisch**, da bestimmte Lohnbestandteile nur einer der beiden Abgaben unterliegen (z. B. Direktversicherung bis 4 % BBG RV ist steuer- UND SV-frei, darüber hinaus nur steuerfrei)
- [§ 14 SGB IV — Arbeitsentgelt](#5-sozialversicherung-sv) — SV-rechtliche Basis

**Verwendung im Code:**
- `payroll_entries.gross_wage` — Pflichtfeld jeder Lohnabrechnungszeile (`NUMERIC(10,2)`, nie Float)
- `src/domain/payroll/grossWage/` (geplant Sprint 22+) — Aggregator aller Lohnbestandteile
- Tabelle `wage_components` — einzelne Komponenten mit `component_type` (`GRUNDLOHN | SFN_ZUSCHLAG | SACHBEZUG | VWL | EINMALZAHLUNG | ...`) und `is_tax_relevant`, `is_sv_relevant` als separate Flags
- **Invariante:** Steuerbrutto und SV-Brutto MÜSSEN getrennt berechnet werden — jede Naive-Implementierung "ein Brutto für beides" ist ein Bug

**Nicht verwechseln mit:**
- **Nettolohn** — Auszahlungsbetrag, nicht Brutto
- **Gesamtkosten des Arbeitgebers** — umfasst zusätzlich **Arbeitgeberanteil SV** (ca. +20 % auf Brutto); kein Lohn i. S. d. § 14 SGB IV, sondern "Lohnnebenkosten"
- **Arbeitslohn-Begriff § 19 EStG vs. Arbeitsentgelt § 14 SGB IV** — die beiden Definitionen decken sich weitgehend, aber nicht vollständig (z. B. bei steuerfreien Zuschlägen oder beitragsfreien Sachbezügen) → **Ursache der Trennung Steuerbrutto/SV-Brutto**

**Anmerkungen / Edge-Cases:**
- **SFN-Zuschläge (§ 3b EStG):** Nur steuerfrei bei **tatsächlicher Arbeit zu begünstigter Zeit**; pauschale Zulagen ohne konkrete Zuordnung sind voll steuerpflichtig. Dokumentation der Arbeitszeiten ist GoBD-relevant (BMF-Schreiben zu § 3b regelmäßig aktualisiert).
- **Sachbezüge-Grenze § 8 Abs. 2 S. 11 EStG:** Bagatell-Sachbezüge bis 50 €/Monat (Stand 2022+) sind steuer- und SV-frei — aber nur wenn **zusätzlich zum ohnehin geschuldeten Lohn** gewährt (Zusätzlichkeitserfordernis).
- **13. Monatsgehalt als Einmalzahlung** wird im Zuflussmonat voll besteuert (§ 11 EStG), aber SV-rechtlich auf das laufende Jahr umgelegt (Märzklausel § 23a SGB IV, falls Brutto dadurch über BBG steigen würde).
- **Pfändung (§ 850 ff. ZPO):** Angriffsgröße ist das **Nettolohn**, nicht Brutto — aber für die Berechnung wird Brutto benötigt, um den pfändungsrelevanten Netto korrekt zu ermitteln.

---

## 2. Lohnsteuer (LSt)

| Feld | Inhalt |
|---|---|
| **Deutsch (primär)** | Lohnsteuer |
| **Synonyme (DE)** | LSt (Abkürzung, bevorzugt), Einkommensteuer-Vorauszahlung des Arbeitnehmers |
| **Arabisch** | ضريبة الأجور المقتطعة من المصدر (شكل خاص من ضريبة الدخل — Einkommensteuer — يقتطعها صاحب العمل مباشرةً من الراتب الإجمالي لكل موظّف ويحوّلها إلى مصلحة الضرائب شهرياً؛ تُصفَّى نهائياً في إقرار الضريبة السنوي للموظف — Einkommensteuer-Veranlagung) |
| **Englisch (Code-Kontext)** | `wage_tax` / `lst` (Modul-Präfix) |
| **Kategorie** | Steuerabzug / Quellensteuer |
| **Status** | FEST |
| **Aufgenommen am** | 2026-04-22, Terminology-Sprint 1 |

### Definition
Eine **Sonderform der Einkommensteuer** (§ 38 EStG), die der Arbeitgeber für jeden Arbeitnehmer berechnet, vom Bruttolohn **einbehält** (Quellensteuer) und an das Betriebsstätten-Finanzamt abführt. Rechtlich bleibt Schuldner der LSt der Arbeitnehmer (§ 38 Abs. 2 EStG), doch der Arbeitgeber **haftet** für korrekte Einbehaltung und Abführung (§ 42d EStG). Die LSt ist eine **Vorauszahlung auf die Einkommensteuer** — die endgültige Steuerlast ergibt sich erst bei der Jahres-Einkommensteuer-Veranlagung (§ 46 EStG).

**Berechnungsgrundlage:**
- **Steuerbrutto** (laufender Arbeitslohn, siehe [Bruttolohn](#1-bruttolohn) — Abgrenzung zum SV-Brutto beachten)
- **Lohnsteuerklasse I–VI** (§ 38b EStG) — bestimmt Freibeträge und Tarif
- **ELStAM** (elektronische Lohnsteuer-Abzugsmerkmale, §§ 39, 39e EStG — eigener Eintrag in Batch 2)
- Amtliche **Lohnsteuertabelle** (Tages-, Wochen-, Monats-, Jahresbasis) oder **programmierter Algorithmus** nach § 39b Abs. 6 EStG

### Rechtsgrundlage
- § 38 EStG — Pflicht zur Einbehaltung
- § 38a EStG — Höhe der Lohnsteuer
- § 38b EStG — Steuerklassen I–VI
- § 39b EStG — Berechnung und Einbehaltung
- § 39f EStG — Faktorverfahren bei Ehegatten (Alternative zu Steuerklassenkombination III/V)
- § 41a EStG — Anmeldung und Abführung (→ [LStA](./04-steuer-meldungen.md#20-lohnsteuer-anmeldung-lsta))
- § 42d EStG — Haftung des Arbeitgebers
- § 46 EStG — Pflicht- und Antragsveranlagung

**Verwandte Begriffe:**
- [LStA](./04-steuer-meldungen.md#20-lohnsteuer-anmeldung-lsta) — monatliche/quartalsweise/jährliche Meldung der einbehaltenen LSt
- [Kirchensteuer (KiSt)](#3-kirchensteuer-kist) — wird **auf die LSt** aufgesetzt (KiSt-Basis = LSt)
- [Solidaritätszuschlag (SolZ)](#4-solidaritätszuschlag-solz) — wird ebenfalls **auf die LSt** aufgesetzt
- [Steueranmeldung](./04-steuer-meldungen.md#13-steueranmeldung--steuererklärung-gegenüberstellung) — die LStA ist Anmeldung (keine Erklärung!)
- **Einkommensteuer (ESt)** — übergeordneter Rahmen; LSt ist deren Vorauszahlungsform

**Verwendung im Code:**
- `payroll_entries.lst_amount` — Pflichtfeld (`NUMERIC(10,2)`)
- `src/domain/payroll/taxes/lohnsteuer/` (geplant Sprint 22+)
- **Kernalgorithmus:** § 39b Abs. 6 EStG-Algorithmus ODER amtliche Lohnsteuertabellen via CSV-Import. Empfehlung: **algorithmische Implementierung** — der amtliche Algorithmus ist als Pseudocode im BMF-Schreiben zur Lohnsteuer-Programmierung jährlich veröffentlicht.
- **Mandanten-Lookups:** `employees.steuerklasse` (`CHAR(1)` für I–VI), `employees.faktor` (für § 39f), ELStAM-Stammdaten
- **Invariante:** LSt-Berechnung MUSS deterministisch und reproduzierbar sein (GoBD Rz. 103) — jede Berechnung ist mit Algorithmus-Version zu archivieren

**Nicht verwechseln mit:**
- **Einkommensteuer (ESt)** — finale Veranlagungssteuer; LSt ist nur Vorauszahlung darauf
- **Kapitalertragsteuer (KapESt)** — ebenfalls Quellensteuer, aber auf Kapitaleinkünfte (§ 43 EStG), nicht auf Arbeitslohn
- **Abgeltungsteuer** — Pauschalsatz für Kapitaleinkünfte (25 %), hat nichts mit Arbeitslohn zu tun
- **Pauschsteuer nach §§ 40–40b EStG** — alternative Pauschal-Versteuerung des Arbeitgebers (z. B. Minijob 2 %, kurzfristige Beschäftigung 25 %) — eigene Systematik, **kein Abzug vom Arbeitnehmer** → Eintrag in Batch 2

**Anmerkungen / Edge-Cases:**
- **Steuerklassenkombination III/V bei Ehegatten** führt oft zu **monatlicher Übersteuerung** des Partners mit Klasse V; das **Faktorverfahren** (§ 39f EStG) verteilt die Last gerechter, wird aber selten genutzt, weil weniger bekannt.
- **Steuerklasse VI** wird angewendet, wenn der Arbeitnehmer ein weiteres Arbeitsverhältnis hat oder ELStAM-Daten fehlen — höchster Tarif, keine Freibeträge. UI-Warnung bei Klasse VI sinnvoll.
- **Elektronischer Abzug nach ELStAM:** Arbeitgeber MUSS die Merkmale vor Beginn des Arbeitsverhältnisses abrufen; manuelle Pflege ist nur in Ausnahmefällen (§ 39e Abs. 8 EStG) zulässig.
- **Jahresausgleich durch Arbeitgeber (§ 42b EStG):** Freiwillig; gleicht zu viel einbehaltene LSt bei Arbeitnehmern mit durchgehendem Arbeitsverhältnis aus. Nicht mit ESt-Veranlagung verwechseln.

---

## 3. Kirchensteuer (KiSt)

| Feld | Inhalt |
|---|---|
| **Deutsch (primär)** | Kirchensteuer |
| **Synonyme (DE)** | KiSt (Abkürzung, bevorzugt) |
| **Arabisch** | ضريبة الكنيسة (ضريبة إضافية تُقتطع مع ضريبة الأجور من أعضاء الطوائف الدينية المعترف بها رسمياً في ألمانيا — كاثوليك، بروتستانت، وطوائف صغرى — تُحسَب كنسبة من مبلغ ضريبة الأجور نفسه لا من الراتب الإجمالي؛ النسبة إما 8٪ في بافاريا وبادن-فورتمبيرغ أو 9٪ في باقي الولايات) |
| **Englisch (Code-Kontext)** | `church_tax` / `kist` (Modul-Präfix) |
| **Kategorie** | Steuerabzug / Zuschlagsteuer |
| **Status** | FEST |
| **Aufgenommen am** | 2026-04-22, Terminology-Sprint 1 |

### Definition
Eine **Zuschlagsteuer zur Lohnsteuer** (nicht zum Bruttolohn!), die der Arbeitgeber nur einbehält, wenn der Arbeitnehmer einer der vertraglich anerkannten Religionsgemeinschaften angehört. Wird gemeinsam mit der LSt einbehalten und abgeführt, über die LStA gemeldet. Die Einnahmen fließen an die jeweilige Religionsgemeinschaft, nicht an den Fiskus — der Staat fungiert nur als **Einzug-Dienstleister**.

**Hebesätze:**
| Bundesland | Hebesatz |
|---|---|
| Bayern, Baden-Württemberg | **8 %** der LSt |
| Alle anderen 14 Bundesländer | **9 %** der LSt |

### Rechtsgrundlage
- Kirchensteuergesetze der **einzelnen Bundesländer** (KiStG BY, KiStG NRW, etc.) — keine bundeseinheitliche Regelung, nur Rahmen durch **Grundgesetz Art. 140 GG i. V. m. Art. 137 Abs. 6 WRV**
- § 51a EStG — Besonderheiten bei Kapitalerträgen (nicht lohn-relevant)
- Bundeseinheitliche Regeln für Kappungsgrenze (2,75 % bis 4 % des zvE, je Bundesland)
- § 39e EStG — ELStAM übermittelt Konfession verschlüsselt

**Verwandte Begriffe:**
- [Lohnsteuer (LSt)](#2-lohnsteuer-lst) — Bemessungsgrundlage (KiSt ist % der LSt, nicht des Bruttolohns!)
- [LStA](./04-steuer-meldungen.md#20-lohnsteuer-anmeldung-lsta) — gemeinsame Meldung mit LSt und SolZ
- **Kirchenaustritt** — bewirkt Ende der KiSt-Pflicht ab dem Folgemonat (je Bundesland leicht unterschiedlich)
- **Konfessionslos / besondere Konfessionen** — keine KiSt

**Verwendung im Code:**
- `employees.religion_code` — `CHAR(2)`: `ev` (evangelisch), `rk` (römisch-katholisch), `ak` (altkatholisch), `is` (israelitisch), `vd` (konfessionslos/verschiedene) und weitere seltene Codes
- `payroll_entries.kist_amount` — Pflichtfeld (`NUMERIC(10,2)`)
- `src/domain/payroll/taxes/kirchensteuer/` (geplant Sprint 22+)
- **Konfigurations-Tabelle** `kirchensteuer_saetze` (Bundesland → Hebesatz) — notwendig, da Hebesatz vom Arbeitsort des Arbeitnehmers abhängt, nicht vom Firmensitz
- **Kappungs-Regel** muss jährlich gegen jeweiliges Landes-KiStG verifiziert werden

**Nicht verwechseln mit:**
- **Freiwillige Spende an die Kirche** — steuerliche Sonderausgabe nach § 10b EStG, keine KiSt
- **Besondere Kirchgelder** (z. B. bei konfessionsverschiedenen Ehen) — werden NICHT über Lohnsteuer einbehalten, sondern per ESt-Veranlagung erhoben
- **Kultussteuer / Kultusabgabe** (z. B. jüdische Gemeinden) — manche Gemeinden erheben keine KiSt, sondern eine gesonderte Kultusabgabe; Details je Landesregelung

**Anmerkungen / Edge-Cases:**
- **Konfessionsverschiedene Ehen:** bei Zusammenveranlagung wird die Bemessungsgrundlage anteilig zwischen den Konfessionen aufgeteilt (Halbteilungsgrundsatz). In der laufenden LSt wird das **nicht** berücksichtigt — erst in der ESt-Veranlagung.
- **Unterjähriger Kirchenaustritt:** Ende der Pflicht ab dem 1. des Folgemonats (in manchen Bundesländern erst ab Folgemonat nach Monatsfrist). ELStAM aktualisiert Konfession nach Meldung an das Einwohnermeldeamt.
- **Arbeitnehmer mit Wohnsitz ohne KiSt-Pflicht, aber Arbeitsort mit KiSt-Pflicht:** i. d. R. gilt das Wohnsitzprinzip — ELStAM liefert korrekten Code.
- **Kappungsgrenze:** macht die reine "9 % der LSt"-Formel bei sehr hohen Einkommen falsch. Im Rahmen der laufenden LSt wird die Kappung i. d. R. **nicht** angewandt — Korrektur via ESt-Veranlagung. → Dokumentation im UI, um Missverständnisse zu vermeiden.

---

## 4. Solidaritätszuschlag (SolZ)

| Feld | Inhalt |
|---|---|
| **Deutsch (primär)** | Solidaritätszuschlag |
| **Synonyme (DE)** | SolZ (Abkürzung, bevorzugt), Soli |
| **Arabisch** | رسم التضامن (ضريبة إضافية فُرضت عام 1991 لتمويل إعادة توحيد ألمانيا الشرقية مع الغربية؛ تُحسَب بنسبة 5.5٪ من ضريبة الأجور — لا من الراتب الإجمالي — ومنذ عام 2021 أُلغيت فعلياً لحوالي 90٪ من دافعي الضرائب بسبب رفع حدّ الإعفاء — Freigrenze — بشكل كبير) |
| **Englisch (Code-Kontext)** | `solidarity_surcharge` / `solz` (Modul-Präfix) |
| **Kategorie** | Steuerabzug / Zuschlagsteuer |
| **Status** | FEST |
| **Aufgenommen am** | 2026-04-22, Terminology-Sprint 1 |

### Definition
Eine Ergänzungsabgabe zur Einkommen-, Lohn-, Körperschaft- und Kapitalertragsteuer, 1991 zur Finanzierung der deutschen Wiedervereinigung eingeführt. Der **Regelsatz beträgt 5,5 % der Bemessungsgrundlage** (bei Arbeitnehmern: der Lohnsteuer). Seit dem Gesetz zur Rückführung des Solidaritätszuschlags 1995 (in Kraft 01.01.2021) ist der Zuschlag für etwa 90 % der Lohn- und Einkommensteuerzahler **faktisch abgeschafft** — durch drastisch erhöhte Freigrenzen und eine gleitende Milderungszone.

**Drei-Zonen-Modell (Stand 2025/2026):**

| Zone | Jahres-LSt-Betrag (Alleinstehende) | SolZ-Berechnung |
|---|---|---|
| **Nullzone** | bis ca. 19.950 € LSt | **0 €** SolZ (Freigrenze § 3 Abs. 3 SolZG) |
| **Milderungszone** | ca. 19.950 € bis ca. 33.900 € LSt | Gleitender Übergang, max. **11,9 %** der LSt über der Freigrenze (§ 4 S. 2 SolZG) |
| **Regelzone** | über ca. 33.900 € LSt | Voll **5,5 %** der gesamten LSt |

Die Grenzwerte sind **jährlich indexiert** und werden durch das BMF per Verordnung angepasst. Bei Ehegatten-Zusammenveranlagung verdoppeln sich die Grenzwerte.

### Rechtsgrundlage
- **Solidaritätszuschlaggesetz (SolZG 1995)** — Rahmengesetz
- § 1 SolZG — Erhebung
- § 3 SolZG — Bemessungsgrundlage + **Freigrenze**
- § 4 SolZG — **Zuschlagssatz** (5,5 %) und **Milderungszone**-Formel
- Gesetz zur Rückführung des Solidaritätszuschlags 1995 vom 10.12.2019 — Grundlage der Freigrenzen-Erhöhung ab 2021

**Verwandte Begriffe:**
- [Lohnsteuer (LSt)](#2-lohnsteuer-lst) — Bemessungsgrundlage
- [Kirchensteuer (KiSt)](#3-kirchensteuer-kist) — andere Zuschlagsteuer, aber auf gleicher Basis (LSt)
- [LStA](./04-steuer-meldungen.md#20-lohnsteuer-anmeldung-lsta) — gemeinsame Meldung mit LSt und KiSt
- [KSt](./04-steuer-meldungen.md#18-körperschaftsteuer-kst) — SolZ fällt **auch** auf KSt an (dort ohne Freigrenze!)

**Verwendung im Code:**
- `payroll_entries.solz_amount` — Pflichtfeld (`NUMERIC(10,2)`)
- `src/domain/payroll/taxes/solz/` (geplant Sprint 22+)
- **Kritisch:** der Algorithmus MUSS das Drei-Zonen-Modell vollständig implementieren — naive Multiplikation `LSt × 0.055` ist bei >90 % der Arbeitnehmer FALSCH und führt zu Überzahlung.
- **Freigrenze/Milderungszone-Werte** müssen als jährlich zu aktualisierende Konfiguration gepflegt werden (analog zu [Hebesatz](./04-steuer-meldungen.md#19-gewerbesteuer-gewst))
- Stichwort: Lohnsteuer-Programmierung BMF-Schreiben beinhaltet auch Algorithmus für SolZ-Zuschlag

**Nicht verwechseln mit:**
- **Solidaritätsbeitrag** — kein Rechtsbegriff in Deutschland; Verwechslungsgefahr mit ausländischen Steuern
- **Kirchensteuer** — andere Zuschlagsteuer, aber personen-abhängig; SolZ ist konfessions-unabhängig
- **SolZ auf Kapitalerträge** — separate Erhebung durch die Bank als Abgeltungsteuer-Bestandteil; nicht lohn-relevant
- **SolZ auf Körperschaftsteuer** (bei [KSt](./04-steuer-meldungen.md#18-körperschaftsteuer-kst)) — **ohne Freigrenze/Milderungszone!** → volle 5,5 % auf KSt ab dem ersten Euro; bei Lohnsteuer grundlegend andere Logik.

**Anmerkungen / Edge-Cases:**
- **Die Abschaffung für 90 %** bedeutet **nicht** die Abschaffung der Berechnung im Payroll-Modul. Die Berechnung muss weiterhin durchgeführt werden, um feststellen zu können, ob der Arbeitnehmer in der Null-, Milderungs- oder Regelzone liegt. Ergebnis ist oft 0 €, der Rechenweg bleibt aber Pflicht.
- **Verfassungsrechtliche Debatte:** Seit 2021 läuft Verfahren vor dem BVerfG (Az. 2 BvR 1505/20) zur Frage, ob die teilweise Abschaffung die Erhebung für die verbleibenden 10 % verfassungswidrig macht. **Ergebnis offen** — bei Änderung muss der gesamte SolZ-Berechnungscode überprüft werden. **Bei Rechtsänderung: Rücksprache mit Steuerberater bzw. Fachanwalt.**
- **Milderungszone-Formel** ist nichtlinear und wird in der Regel in Tabellenform durch die amtlichen Lohnsteuertabellen abgebildet. Bei programmierter Implementierung MUSS gegen die amtliche Tabelle getestet werden (Regressionstests pro Jahr pflichtig).

---

## 5. Sozialversicherung (SV)

| Feld | Inhalt |
|---|---|
| **Deutsch (primär)** | Sozialversicherung |
| **Synonyme (DE)** | SV (Abkürzung, bevorzugt), gesetzliche Sozialversicherung, GSV |
| **Arabisch** | التأمين الاجتماعي الإلزامي (المظلة القانونية لنظام الحماية الاجتماعية — SGB IV — وتضم خمسة فروع: الصحي KV والتقاعدي RV والبطالة ALV والرعاية PV وإصابات العمل UV؛ الاشتراكات إلزامية فوق حد أدنى وتُقسَّم مناصفةً — paritätisch — بين صاحب العمل والموظف، عدا UV الذي يتحمّله وحده) |
| **Englisch (Code-Kontext)** | `social_insurance` / `sv` (Modul-Präfix) |
| **Kategorie** | Oberbegriff / Gesetzlicher Rahmen |
| **Status** | FEST |
| **Aufgenommen am** | 2026-04-22, Terminology-Sprint 1 |

### Definition
Die gesetzliche Sozialversicherung in Deutschland ist ein **umlagefinanziertes Pflichtversicherungssystem** für abhängig Beschäftigte. Der allgemeine Rahmen (Begriffe, Beitragspflicht, Meldeverfahren) ist im **Sozialgesetzbuch Viertes Buch (SGB IV)** kodifiziert und wird durch die Sondergesetze der einzelnen Zweige (SGB V, VI, III, XI, VII) konkretisiert. Die **vier lohn-relevanten Zweige**, bei denen der Arbeitnehmer einen Anteil zahlt, sind: Kranken-, Renten-, Arbeitslosen- und Pflegeversicherung. Die **Unfallversicherung (SGB VII)** trägt der Arbeitgeber allein — sie ist außerhalb des Scopes dieses Eintrags.

**Strukturprinzipien:**
- **Pflichtversicherung** (§ 2 SGB IV) für Arbeitnehmer ab bestimmtem Entgelt (oberhalb Minijob-Grenze, unterhalb JAEG für KV/PV — freiwillig darüber)
- **Paritätische Finanzierung** — Arbeitgeber und Arbeitnehmer tragen je die Hälfte (mit Ausnahmen: Zusatzbeitrag KV, Kinderlosen-Zuschlag PV, Sachsen-Besonderheit PV)
- **Beitragsbemessungsgrenze (BBG)** — Obergrenze, bis zu der Beiträge berechnet werden (zwei Stufen: KV/PV-BBG niedriger, RV/ALV-BBG höher)
- **Arbeitgeberzuschuss** bei freiwillig oder privat versicherten Arbeitnehmern (§ 257 SGB V)
- **Einzug** erfolgt **zentral über die Krankenkasse** des Arbeitnehmers als sogenannte "Einzugsstelle" (§ 28h SGB IV) — der Arbeitgeber meldet alle SV-Beiträge an die Krankenkasse, die sie an die anderen Zweige weiterleitet

### Rechtsgrundlage
- **SGB IV** — allgemeiner Teil (Arbeitsentgelt § 14, Beschäftigung § 7, Meldeverfahren §§ 28a ff.)
- **SGB V** — Krankenversicherung (→ [KV](#6-krankenversicherung-kv))
- **SGB VI** — Rentenversicherung (→ [RV](#7-rentenversicherung-rv))
- **SGB III** — Arbeitsförderung inkl. Arbeitslosenversicherung (→ [ALV](#8-arbeitslosenversicherung-alv))
- **SGB XI** — Pflegeversicherung (→ [PV](#9-pflegeversicherung-pv))
- **SGB VII** — Unfallversicherung (nur Arbeitgeber-Beitrag, nicht in Payroll-Brutto-Netto-Rechnung)

**Verwandte Begriffe:**
- [KV](#6-krankenversicherung-kv), [RV](#7-rentenversicherung-rv), [ALV](#8-arbeitslosenversicherung-alv), [PV](#9-pflegeversicherung-pv) — die vier lohn-relevanten Zweige
- **Beitragsbemessungsgrenze (BBG)** — (geplanter Eintrag Batch 2)
- **Jahresarbeitsentgeltgrenze (JAEG)** — (geplanter Eintrag Batch 2)
- **DEÜV-Meldeverfahren** — (geplanter Eintrag Batch 2)
- **Versicherungsnummer (VSNR)** — 12-stellige lebenslange Kennung der Rentenversicherung, zugleich SV-Kennung
- **Minijob / Midijob** — Sonderfälle reduzierter SV-Pflicht (geplant Batch 2)

**Verwendung im Code:**
- `src/domain/payroll/sv/` (geplant Sprint 22+) — gemeinsamer Namespace für alle vier Zweige
- `employees.sv_number` — Versicherungsnummer (`CHAR(12)`, Format validiert: Geburtsdatum + Namensinitiale + Seriennummer + Geschlecht + Prüfziffer)
- `employees.krankenkasse_id` — Verweis auf `krankenkassen` (FK) — die gewählte Einzugsstelle
- Zentrale Konfigurationstabelle `beitragssaetze_jahr` mit Spalten `jahr`, `kv_allgemein`, `kv_ermaessigt`, `rv_satz`, `alv_satz`, `pv_basis`, `pv_kinderlos_zuschlag`, `bbg_kv_pv_monat`, `bbg_rv_alv_monat_west`, `bbg_rv_alv_monat_ost`
- **Kritische Invariante:** Die SV-Berechnung MUSS gegen die **SV-Brutto-Basis** erfolgen, nicht gegen das Steuer-Brutto (siehe [Bruttolohn](#1-bruttolohn) — Abgrenzung)

**Nicht verwechseln mit:**
- **Private Versicherung (PKV, private RV)** — rechtlich andere Systematik; betrifft nur Besserverdiener über JAEG (KV) oder freiwillig Versicherte
- **Betriebliche Altersvorsorge (bAV)** — zusätzliche Vorsorge, teilweise sozialabgabenfrei bis 4 % BBG RV (§ 1 Abs. 1 Nr. 9 SvEV)
- **Zusatzversorgung des öffentlichen Dienstes (VBL, ZVK)** — eigene Systematik, außerhalb der gesetzlichen SV
- **Steuerliche Vorsorgeaufwendungen (§ 10 EStG)** — ESt-Sonderausgabenabzug, nicht SV

**Anmerkungen / Edge-Cases:**
- **Geringfügige Beschäftigung (Minijob):** pauschaler AG-Beitrag zur KV (13 %) und RV (15 %); Arbeitnehmer kann auf RV-Pflicht verzichten. Keine KV-Pflicht für Arbeitnehmer. → eigener Eintrag in Batch 2.
- **Übergangsbereich (Midijob, 520,01–2.000 €):** reduzierte Beitragslast für Arbeitnehmer, volle Last beim Arbeitgeber (§ 20 Abs. 2 SGB IV). Komplexe Formel.
- **SV-Brutto vs. Steuer-Brutto:** Bei bestimmten Lohnbestandteilen (z. B. Sachbezüge unter 50 €-Grenze) weichen die Bemessungsgrundlagen ab. Falsche Annahme "SV-Brutto = Steuer-Brutto" ist einer der häufigsten Fehler in Eigenbau-Payroll-Systemen.
- **Sozialversicherungsausweis** wurde 2011 abgeschafft; die Versicherungsnummer selbst bleibt bestehen und wird über ELStAM-Verfahren elektronisch übermittelt.
- **Verjährung:** SV-Beitragsansprüche verjähren in 4 Jahren (§ 25 Abs. 1 SGB IV); bei vorsätzlichem Vorenthalten in 30 Jahren → **GoBD-relevante Archivierungspflicht der Berechnungsgrundlagen**.

---

## 6. Krankenversicherung (KV)

| Feld | Inhalt |
|---|---|
| **Deutsch (primär)** | Krankenversicherung (gesetzliche) |
| **Synonyme (DE)** | GKV, KV (Abkürzung, bevorzugt in Payroll-Kontext) |
| **Arabisch** | التأمين الصحي الإلزامي (الفرع الأكبر والأكثر تعقيداً من التأمينات الاجتماعية في ألمانيا — SGB V — يموّل التأمين الطبي للموظفين وأفراد أسرهم عبر صناديق صحية تنافسية — Krankenkassen — كل منها يحدد اشتراكاً إضافياً خاصاً — Zusatzbeitrag — يُدفع بالإضافة إلى الاشتراك العام البالغ 14.6٪) |
| **Englisch (Code-Kontext)** | `health_insurance` / `kv` (Modul-Präfix) |
| **Kategorie** | SV-Zweig |
| **Status** | FEST |
| **Aufgenommen am** | 2026-04-22, Terminology-Sprint 1 |

### Definition
Der größte und organisatorisch komplexeste Zweig der gesetzlichen Sozialversicherung. Träger sind die **gesetzlichen Krankenkassen** (GKV) — rund 95 Pflichtkassen, die miteinander konkurrieren und je einen **individuellen Zusatzbeitragssatz** erheben. Der Arbeitnehmer hat **freie Kassenwahl** (§ 173 SGB V). Die KV fungiert zugleich als **zentrale Einzugsstelle** für alle vier SV-Zweige (§ 28h SGB IV).

**Beitragssystematik (Stand 2025/2026, jährlich gegen Rechengrößenverordnung zu verifizieren):**

| Komponente | Satz | Paritätisch? | Rechtsgrundlage |
|---|---|---|---|
| Allgemeiner Beitragssatz | **14,6 %** | Ja (je 7,3 % AG/AN) | § 241 SGB V |
| Ermäßigter Beitragssatz | **14,0 %** | Ja (je 7,0 %) | § 243 SGB V |
| Zusatzbeitragssatz | **individuell je Kasse** (Durchschnitt BMG-Prognose) | Ja (paritätisch seit 2019) | § 242 SGB V |

- **Beitragsbemessungsgrenze KV (BBG):** jährlich angepasst, Eintrag in Batch 2
- **Jahresarbeitsentgeltgrenze (JAEG):** Grenze zur Versicherungsfreiheit / Wechsel in PKV; jährlich angepasst, Eintrag in Batch 2

### Rechtsgrundlage
- **SGB V** — Kernkodifikation
- § 5 SGB V — Versicherungspflicht
- § 6 SGB V — Versicherungsfreiheit (JAEG-Überschreitung)
- § 173 SGB V — Krankenkassenwahl
- § 223 SGB V — Beitragspflichtiges Einkommen
- § 241 SGB V — Allgemeiner Beitragssatz
- § 242 SGB V — **Zusatzbeitragssatz** (kassenindividuell)
- § 243 SGB V — Ermäßigter Beitragssatz (für Arbeitnehmer ohne Krankengeldanspruch)
- § 257 SGB V — Arbeitgeberzuschuss bei PKV-Versicherten

**Verwandte Begriffe:**
- [Sozialversicherung (SV)](#5-sozialversicherung-sv) — Oberbegriff
- [Pflegeversicherung (PV)](#9-pflegeversicherung-pv) — läuft organisatorisch mit KV-Kasse mit
- **Krankenkasse** — konkreter Versicherungsträger (TK, Barmer, AOK-Gruppen, Betriebskrankenkassen, Innungskassen ...)
- **Zusatzbeitrag** — kassenindividueller Aufschlag; häufigste Ursache für Kassenwechsel
- **Jahresarbeitsentgeltgrenze (JAEG)** — (geplant Batch 2); darüber freiwillige GKV oder Wechsel in PKV
- **Krankengeld** — Entgeltersatzleistung (geplant Batch 2); nur bei allgemeinem Beitragssatz einbezogen

**Verwendung im Code:**
- `employees.krankenkasse_id` — FK auf Tabelle `krankenkassen`
- **Tabelle `krankenkassen`** (Stammdaten): `id`, `name`, `betriebsnummer` (8-stellig, vom AG für Meldeverfahren), `zusatzbeitragssatz`, `ermaessigter_zusatzbeitrag`, `gueltig_ab`, `gueltig_bis`
- **Datenquelle:** GKV-Spitzenverband publiziert die Kassenliste regelmäßig; Zusatzbeiträge werden von jeder Kasse selbst gemeldet. Aktualisierung ist **laufender Betriebsaufwand**, nicht einmalige Stammdatenpflege.
- `payroll_entries.kv_an_amount`, `kv_ag_amount` — getrennte Erfassung AN- und AG-Anteil
- `src/domain/payroll/sv/kv/` (geplant Sprint 22+)

**Nicht verwechseln mit:**
- **PKV (Private Krankenversicherung)** — alternatives System oberhalb JAEG; keine GKV-Beiträge, sondern AG-Zuschuss nach § 257 SGB V (maximal halber GKV-Höchstbeitrag)
- **Zusatzversicherung (GKV-Zusatzpolice, Wahltarife)** — private Aufstockung innerhalb der GKV; kein Einfluss auf Lohnsteuer/SV
- **KV in RV/KSK/LSV** — Sondersysteme (Studenten-KV, Künstlersozialkasse, Landwirtschaftliche Sozialversicherung), nicht regulär im Lohn-Kontext
- **KiSt (Kirchensteuer)** — zufällig ähnliche Abkürzung, völlig anderer Kontext

**Anmerkungen / Edge-Cases:**
- **Zusatzbeitrag-Änderung unterjährig:** Kassen können ihren Zusatzbeitrag gesetzlich nur zum Jahreswechsel anpassen (§ 242 Abs. 1 S. 2 SGB V) — Einzelausnahmen bei finanzieller Schieflage. Payroll-Modul muss Änderungen trotzdem zeitpunktgenau anwenden können (effective_date pro Kasse).
- **Kassenwechsel des Arbeitnehmers:** Bindungsfrist 12 Monate (§ 175 Abs. 4 SGB V), Sonderkündigungsrecht bei Zusatzbeitragserhöhung. Arbeitgeber muss auf Wunsch des Arbeitnehmers jederzeit Wechsel ermöglichen.
- **Höchstzuschuss bei PKV:** § 257 Abs. 2 SGB V — AG-Zuschuss ist maximal die Hälfte des Beitrags, aber höchstens die Hälfte des durchschnittlichen GKV-Höchstbeitrags. Jahresaktualisierung.
- **Ermäßigter Beitrag:** nur für Arbeitnehmer OHNE Anspruch auf Krankengeld (z. B. kurzzeitig Beschäftigte, nebenbei selbstständige mit Hauptbeschäftigung). Ausnahmefall; UI-Default MUSS "allgemeiner Satz" sein.

---

## 7. Rentenversicherung (RV)

| Feld | Inhalt |
|---|---|
| **Deutsch (primär)** | Rentenversicherung |
| **Synonyme (DE)** | GRV, gesetzliche Rentenversicherung, RV (Abkürzung, bevorzugt in Payroll-Kontext) |
| **Arabisch** | التأمين التقاعدي الإلزامي (الفرع الثاني من حيث الحجم في التأمين الاجتماعي الألماني — SGB VI — ممول باشتراكات إلزامية بنسبة 18.6٪ تُقسَم مناصفةً بين صاحب العمل والموظف، ويديره صندوق التأمين الفدرالي Deutsche Rentenversicherung Bund ويمنح ثلاثة أنواع من المعاشات: الشيخوخة والعجز والوفاة لذوي المتوفى) |
| **Englisch (Code-Kontext)** | `pension_insurance` / `rv` (Modul-Präfix) |
| **Kategorie** | SV-Zweig |
| **Status** | FEST |
| **Aufgenommen am** | 2026-04-22, Terminology-Sprint 1 |

### Definition
Der älteste (1889, Bismarck) und zweitgrößte Zweig der deutschen Sozialversicherung. Finanziert im **Umlageverfahren**: die Beiträge der aktiven Versicherten finanzieren die aktuellen Renten. Trägerorganisationen sind die **Deutsche Rentenversicherung Bund (DRV Bund)** auf Bundesebene sowie regionale Träger (DRV Nord, Mitteldeutschland, etc.). Die Versicherungsnummer (VSNR) wird von der RV vergeben und gilt gleichzeitig als zentrale Kennung für die gesamte SV.

**Beitragssystematik:**

| Komponente | Satz | Paritätisch? | Bemerkung |
|---|---|---|---|
| Regelbeitragssatz | **18,6 %** | Ja (je 9,3 %) | Stabil seit 2018, § 158 SGB VI |
| Beitragsbemessungsgrenze (BBG) | **regional unterschiedlich** | — | **West** und **Ost** — bis 2024 verschieden, ab 2025 weitgehend harmonisiert |

**Leistungsarten (§§ 33 ff. SGB VI):**
- **Regelaltersrente** — ab Regelaltersgrenze (67 Jahre für ab 1964 Geborene)
- **Erwerbsminderungsrente** — bei voller oder teilweiser Erwerbsminderung
- **Hinterbliebenenrente** — Witwen-, Witwer-, Waisenrente
- Leistungen zur Teilhabe (Reha)

### Rechtsgrundlage
- **SGB VI** — Kernkodifikation
- § 1 SGB VI — Versicherungspflicht (Arbeitnehmer, bestimmte Selbstständige)
- § 7 SGB VI — freiwillige Versicherung
- § 157 SGB VI — Beitragsbemessungsgrenze
- § 158 SGB VI — Beitragssatz (aktuell 18,6 %)
- § 159 SGB VI — Bezugsgröße
- §§ 191 ff. SGB VI — Versicherungsnummer
- § 196 SGB VI — Vergabe der Versicherungsnummer

**Verwandte Begriffe:**
- [Sozialversicherung (SV)](#5-sozialversicherung-sv) — Oberbegriff
- [ALV](#8-arbeitslosenversicherung-alv) — teilt sich die BBG mit RV (nicht mit KV/PV!)
- **Versicherungsnummer (VSNR)** — zentrale SV-Kennung; Aufbau: 2-stelliger Bereichs-Code + 6-stelliges Geburtsdatum + 1 Namensinitiale + 2-stellige Seriennummer (+ Geschlecht in erster Stelle) + 1 Prüfziffer = **12 Zeichen**
- **Deutsche Rentenversicherung Bund** — Bundesträger
- **Rentenpunkte / Entgeltpunkte** — Rentenanwartschaft auf Basis des durchschnittlichen Einkommens im Verhältnis zum Durchschnittsentgelt (geplant ggf. eigener Eintrag in späterer Batch)

**Verwendung im Code:**
- `employees.sv_number` — 12-stellig, identisch zur RV-Versicherungsnummer, zugleich SV-Kennung
- `payroll_entries.rv_an_amount`, `rv_ag_amount` — getrennte Erfassung
- `src/domain/payroll/sv/rv/` (geplant Sprint 22+)
- **Validator** `src/domain/validators/versicherungsnummerValidator.ts` (geplant) — Prüfziffer-Algorithmus: Modulo-10 mit Gewichtung
- BBG-Lookup aus `beitragssaetze_jahr`-Tabelle (Eintrag Batch 2)

**Nicht verwechseln mit:**
- **Betriebliche Altersvorsorge (bAV)** — zusätzliche, nicht gesetzliche Vorsorge; kann über Entgeltumwandlung SV- und steuerfrei sein (§ 1a BetrAVG, § 3 Nr. 63 EStG)
- **Riester-Rente / Rürup-Rente** — private geförderte Altersvorsorge, außerhalb SGB VI
- **Zusatzversorgung des öffentlichen Dienstes (VBL)** — Pflicht für Beamte im öD, eigene Systematik
- **Knappschaftliche Rentenversicherung** — Sonderform für Bergbau-Beschäftigte (SGB VI Teil 4); eigene Trägerorganisation (Deutsche Rentenversicherung Knappschaft-Bahn-See)

**Anmerkungen / Edge-Cases:**
- **Ost-/West-Harmonisierung:** Bis einschließlich 2024 gab es separate BBG-Werte für alte und neue Bundesländer; ab 2025 weitgehend einheitlich, mit Übergangsregelungen bis spätestens 2025 nach §§ 228a, 255a SGB VI. **Stand jährlich verifizieren**, bis finaler Abschluss der Harmonisierung vollzogen ist.
- **Befreiung von der RV-Pflicht (§ 6 SGB VI):** Bestimmte Berufsgruppen mit eigenem Versorgungswerk (Ärzte, Anwälte, Steuerberater, Architekten) können sich befreien lassen. Bei solchen Mandanten fällt **keine** RV an — aber nur wenn Befreiung **dokumentiert** vorliegt. UI-Warnung pflichtig.
- **Minijob-Regelfall:** Minijobber sind in der RV pflichtversichert mit Arbeitnehmer-Eigenbeitrag (Aufstockung auf 18,6 %) — können aber **auf Antrag** auf RV-Pflicht verzichten (Befreiungsantrag § 6 Abs. 1b SGB VI). Details in Batch 2.
- **Vorausberechnung der Altersrente:** Die DRV schickt ab dem 27. Lebensjahr jährliche Renteninformation. Die **Rentenanwartschaft** ist keine Buchungsgröße im Payroll-Modul, sondern Daten der DRV selbst.
- **Beitragserstattung (§ 210 SGB VI):** Möglich bei Ausländern, die Deutschland dauerhaft verlassen, unter bestimmten Voraussetzungen. Sehr selten in der Payroll-Praxis.

---

## 8. Arbeitslosenversicherung (ALV)

| Feld | Inhalt |
|---|---|
| **Deutsch (primär)** | Arbeitslosenversicherung |
| **Synonyme (DE)** | ALV (Abkürzung, bevorzugt), AV, AlV |
| **Arabisch** | التأمين ضد البطالة (فرع من فروع التأمين الاجتماعي الألماني — SGB III — يديره مكتب العمل الاتحادي Bundesagentur für Arbeit ويموّل إعانة البطالة النوع الأول Arbeitslosengeld I بدلاً عن الأجر للمشتركين الذين فقدوا وظائفهم؛ نسبة اشتراكه 2.6٪ مُقسَّمة مناصفةً بين صاحب العمل والموظف) |
| **Englisch (Code-Kontext)** | `unemployment_insurance` / `alv` (Modul-Präfix) |
| **Kategorie** | SV-Zweig |
| **Status** | FEST |
| **Aufgenommen am** | 2026-04-22, Terminology-Sprint 1 |

### Definition
Gesetzliche Pflichtversicherung gegen das Risiko der Arbeitslosigkeit. Finanziert **Arbeitslosengeld I (ALG I)** — eine einkommensbezogene Versicherungsleistung nach Beschäftigungsverlust. Trägerorganisation ist die **Bundesagentur für Arbeit (BA)** mit Sitz in Nürnberg. Gesetzlich geregelt im **SGB III** (Arbeitsförderung), das neben der ALV auch die aktive Arbeitsmarktpolitik (Weiterbildung, Umschulung, Kurzarbeitergeld) umfasst.

**Beitragssystematik (Stand 2025/2026, gegen aktuelle Rechengrößenverordnung zu prüfen):**

| Komponente | Satz | Paritätisch? |
|---|---|---|
| Beitragssatz | **2,6 %** | Ja (je 1,3 % AG/AN) |
| BBG | **identisch mit RV** | — |

Der Satz wurde in den letzten Jahren mehrfach verändert (2023 auf 2,6 % nach temporärer Senkung) und kann durch Gesetzesänderung erneut angepasst werden.

**Kernleistungen:**
- **Arbeitslosengeld I (ALG I)** — ca. 60 % (67 % mit Kindern) des durchschnittlichen Netto-Entgelts der letzten 12 Monate, für 6–24 Monate je Anwartschaft
- **Kurzarbeitergeld (KUG)** — bei konjunkturellem Arbeitsausfall (§ 95 ff. SGB III), AG beantragt für Belegschaft
- **Förderung beruflicher Weiterbildung**
- **Gründungszuschuss** (selten, Ermessensleistung)

### Rechtsgrundlage
- **SGB III** — Kernkodifikation
- § 24 SGB III — Versicherungspflicht (Arbeitnehmer, Auszubildende etc.)
- § 341 SGB III — Beitragssatz (aktuell 2,6 %)
- § 342 SGB III — Beitragspflichtige Einnahmen
- § 343 SGB III — Aufteilung der Beitragslast
- §§ 136 ff. SGB III — ALG I Anspruch und Höhe
- §§ 95 ff. SGB III — Kurzarbeitergeld

**Verwandte Begriffe:**
- [Sozialversicherung (SV)](#5-sozialversicherung-sv) — Oberbegriff
- [RV](#7-rentenversicherung-rv) — gleiche Beitragsbemessungsgrenze (BBG), oft gemeinsam abgerechnet
- **Bundesagentur für Arbeit (BA)** — Träger
- **Arbeitslosengeld II / Bürgergeld** — **KEINE** Versicherungsleistung, sondern steuerfinanzierte Fürsorgeleistung (SGB II) → nicht ALV-Bestandteil!
- **Kurzarbeitergeld (KUG)** — aus ALV-Mitteln finanziert; Kernfunktion der ALV
- **Winterausfallgeld / Saisonkurzarbeitergeld** — branchenspezifische Sonderformen

**Verwendung im Code:**
- `payroll_entries.alv_an_amount`, `alv_ag_amount`
- `src/domain/payroll/sv/alv/` (geplant Sprint 22+) — oft nur dünne Implementierung, da Berechnung gleich strukturiert wie RV (gleiche BBG, linear)
- BBG-Lookup gemeinsam mit RV aus `beitragssaetze_jahr`
- **KUG-Berechnung** liegt außerhalb des Brutto-Netto-Rechners; eigene Pipeline (zukünftiges Modul `src/domain/payroll/kug/`)

**Nicht verwechseln mit:**
- **Bürgergeld (ehemals ALG II, SGB II)** — steuerfinanzierte Grundsicherung, NICHT Versicherungsleistung und NICHT über ALV finanziert
- **Sozialhilfe (SGB XII)** — ebenfalls steuerfinanziert, für nicht Erwerbsfähige
- **Insolvenzgeld** — bei Insolvenz des Arbeitgebers (§§ 165 ff. SGB III), aus ALV-Insolvenzgeld-Umlage finanziert — **eigener Umlagebeitrag (U3) des Arbeitgebers**, nicht Teil des regulären ALV-Beitrags

**Anmerkungen / Edge-Cases:**
- **Insolvenzgeld-Umlage (U3, § 358 SGB III):** Arbeitgeber allein, 0,06–0,09 % des Bruttoentgelts (variabel). Läuft **technisch** über dieselbe Lohn-Pipeline, ist aber **rechtlich** kein ALV-Beitrag. In der Lohnabrechnung separat auszuweisen.
- **U1 (Krankheits-Umlage, § 7 AAG) und U2 (Mutterschafts-Umlage)** — beide ebenfalls Arbeitgeber-only, über die jeweilige Krankenkasse, nicht BA → gehören zur KV-Pipeline, nicht ALV, aber werden oft in einem Atemzug mit U3 genannt.
- **Versicherungsfreie Beschäftigung:** Bestimmte Konstellationen sind von ALV-Pflicht befreit (z. B. Studenten unter 20 Wochenstunden, Rentner). Details Batch 2.
- **Saisonale Beschäftigung:** ALV-Pflicht kann auch bei sehr kurzer Beschäftigungsdauer entstehen (anders als Minijob-Regel!). Rechtsprechung ständig im Fluss; bei Grenzfällen **Rücksprache mit Steuerberater oder Fachanwalt für Sozialrecht**.

---

## 9. Pflegeversicherung (PV)

| Feld | Inhalt |
|---|---|
| **Deutsch (primär)** | Pflegeversicherung (soziale) |
| **Synonyme (DE)** | SPV, soziale Pflegeversicherung, PV (Abkürzung, bevorzugt in Payroll-Kontext) |
| **Arabisch** | التأمين الإلزامي لرعاية المحتاجين (أحدث فروع التأمين الاجتماعي الألماني — SGB XI — أُدخل عام 1995 لتمويل رعاية المسنّين وذوي الإعاقات المحتاجين؛ الاشتراك أعقد فروع SV لأنه يتغيّر بحسب حالة الإنجاب — كيف Kinderlose Zuschlag — وعدد الأطفال وعمر الموظف، كما أن ولاية ساكسونيا تمتلك استثناءً خاصاً في توزيع الاشتراك بين صاحب العمل والموظف) |
| **Englisch (Code-Kontext)** | `care_insurance` / `pv` (Modul-Präfix) |
| **Kategorie** | SV-Zweig |
| **Status** | FEST |
| **Aufgenommen am** | 2026-04-22, Terminology-Sprint 1 |

### Definition
Jüngster Zweig der gesetzlichen Sozialversicherung (eingeführt 1995). Finanziert Leistungen zur Grundpflege, hauswirtschaftlichen Versorgung und Betreuung bei Pflegebedürftigkeit. Wird **organisatorisch an die Krankenkassen angedockt** (jede KV-Kasse hat eine zugehörige Pflegekasse, § 46 SGB XI). Die PV ist aufgrund der **kinderzahl-abhängigen Beitragsdifferenzierung** und der **Sachsen-Besonderheit** die **rechnerisch komplexeste** der vier Lohn-SV-Zweige.

**Beitragssystematik (Stand 2024/2025 nach PUEG vom Juli 2023, jährlich gegen Rechengrößenverordnung zu prüfen):**

| Versicherten-Status | AN-Anteil | AG-Anteil | Gesamt |
|---|---|---|---|
| Mit mindestens 1 Kind (<25 Jahre, laufend beitragsentlastend ab 2. Kind) | 1,7 % | 1,7 % | **3,4 %** Grundsatz |
| Ab 2. Kind: zusätzliche Entlastung | –0,25 % je Kind 2–5 (nur AN, max. –1,0 %) | unverändert 1,7 % | variabel, AN-Anteil sinkt |
| **Kinderlos** ab Vollendung 23. LJ | 1,7 % + **0,6 % Zuschlag** = **2,3 %** | 1,7 % | **4,0 %** |
| **Sachsen-Sonderregel** (alle Versicherten unabhängig von Kinderzahl) | +0,5 % | –0,5 % | Summe unverändert, Verteilung asymmetrisch |

**BBG:** identisch zur [KV](#6-krankenversicherung-kv) (nicht zu RV/ALV!).

### Rechtsgrundlage
- **SGB XI** — Kernkodifikation
- § 1 SGB XI — Grundsatz, Systematik
- § 20 SGB XI — Versicherungspflicht (folgt der KV-Pflicht)
- § 55 SGB XI — Beitragssatz (Grundsatz 3,4 % nach PUEG, paritätisch)
- § 55 Abs. 3 SGB XI — **Zuschlag für Kinderlose**
- § 55 Abs. 3a SGB XI — **Abschlag für Mehrkindfamilien**
- § 58 Abs. 3 SGB XI — **Sachsen-Sonderregel** (historisch: Buß- und Bettag als Feiertag)
- **PUEG** (Pflegeunterstützungs- und -entlastungsgesetz, in Kraft 01.07.2023) — führte die aktuelle differenzierte Systematik ein

**Verwandte Begriffe:**
- [Sozialversicherung (SV)](#5-sozialversicherung-sv) — Oberbegriff
- [Krankenversicherung (KV)](#6-krankenversicherung-kv) — organisatorisch gekoppelt; gleiche BBG, gleiche Kasse
- **Pflegekasse** — rechtlich eigenständig, organisatorisch Teil der Krankenkasse
- **Pflegegrad 1–5** — Einstufung bei Leistungsbezug (Leistungsseite, irrelevant für Beitragsberechnung)
- **Pflegeunterstützungs- und -entlastungsgesetz (PUEG)** — Reformgesetz 2023, Grundlage des aktuellen Berechnungsmodells
- **Kinderberücksichtigungsgesetz** — vorheriges Modell, ab 01.07.2023 durch PUEG ersetzt

**Verwendung im Code:**
- `employees.number_of_children` — Anzahl der relevanten Kinder unter 25 Jahren (muss mit Alter prüfbar sein; Datensatz `employee_children` mit Geburtsdaten empfohlen)
- `employees.kinderlos` — abgeleitet; `true` wenn Alter ≥ 23 UND `number_of_children = 0`
- `employees.bundesland` — muss bekannt sein, um Sachsen-Sonderregel anzuwenden
- `payroll_entries.pv_an_amount`, `pv_ag_amount` — getrennte Erfassung
- `src/domain/payroll/sv/pv/` (geplant Sprint 22+) — **muss erheblich komplexer sein als andere SV-Module**
- **Invariante:** Beitrag ändert sich **zeitpunktgenau** mit
  - 23. Geburtstag (Kinderlos-Zuschlag setzt ein)
  - Geburt jedes Kindes (entlastet)
  - 25. Geburtstag jedes Kindes (entfällt aus Entlastung)
  → Event-basierte Re-Evaluation der PV-Beiträge pflichtig. Naive Einstellung beim Hire-Time ist fehlerhaft.

**Nicht verwechseln mit:**
- **Private Pflegeversicherung (PPV)** — Pflicht für PKV-Versicherte; parallele, aber getrennte Versicherung
- **Pflege-Bahr** (staatlich geförderte private Zusatz-Pflege) — freiwillige Ergänzung, kein SV-Bestandteil
- **Berufsunfähigkeitsversicherung** — private Absicherung gegen Berufsunfähigkeit, nicht PV
- **Unfallversicherung (SGB VII)** — separater SV-Zweig, deckt Arbeitsunfälle ab, nicht Pflegebedürftigkeit

**Anmerkungen / Edge-Cases:**
- **Nachweis der Elterneigenschaft (§ 55 Abs. 3c SGB XI):** Arbeitgeber muss Kinder-Anzahl beim Arbeitnehmer erheben und beim BMF-elektronischen Verfahren (DaBPV) abgleichen (Einführung stufenweise; Übergangsfrist läuft). Bis zur vollständigen Umsetzung des digitalen Verfahrens **muss die Kinderzahl manuell dokumentiert sein** (Geburtsurkunde, Familienstammbuch). GoBD-Archivierung.
- **Entlastung nur während der Kindheit:** Die Entlastung für Mehrkindfamilien gilt nur, solange das jeweilige Kind unter 25 Jahren ist. Danach fällt der Rabatt wieder weg.
- **Sachsen-Regel hat juristischen Hintergrund:** Der Freistaat Sachsen behielt 1994 den Buß- und Bettag als gesetzlichen Feiertag — als "Ausgleich" tragen Arbeitnehmer dort einen höheren PV-Anteil. Wichtig: Regel gilt am **Arbeitsort** des Arbeitnehmers, nicht am Firmensitz (vgl. Kirchensteuer-Logik).
- **Beitragssatz-Historie:** Vor PUEG (bis 30.06.2023) lag der Grundsatz bei 3,05 %. Seit 01.07.2023 bei 3,4 %. Payroll-Systeme, die Altbestände nachberechnen, **müssen versionierte Beitragssätze** unterstützen — pro Berechnungszeitpunkt.
- **Bei komplexen Familienkonstellationen** (Stiefkinder, adoptierte Kinder, Pflegekinder) ist die Berücksichtigung im PV-Beitrag **rechtsprechungsabhängig** — bei Unsicherheit **Rücksprache mit Steuerberater/Fachanwalt**.

---

## 10. Nettolohn

| Feld | Inhalt |
|---|---|
| **Deutsch (primär)** | Nettolohn |
| **Synonyme (DE)** | Nettoarbeitsentgelt, Nettogehalt, Auszahlungsbetrag |
| **Arabisch** | الراتب الصافي (المبلغ المتبقي بعد اقتطاع جميع الضرائب والاشتراكات الإلزامية من الراتب الإجمالي Bruttolohn وهو المبلغ الفعلي الذي يُحوَّل إلى حساب الموظف البنكي شهرياً وفق § 107 GewO؛ يُعدّ الأساس القانوني لحسابات الحجز على الراتب Pfändung وفق §§ 850 ff. ZPO) |
| **Englisch (Code-Kontext)** | `net_wage` / `payout_amount` |
| **Kategorie** | Datentyp / Lohn-Ergebnis |
| **Status** | FEST |
| **Aufgenommen am** | 2026-04-22, Terminology-Sprint 1 |

### Definition
Der Betrag, der dem Arbeitnehmer nach Abzug aller **gesetzlich vorgeschriebenen** Abgaben (Lohnsteuer, Kirchensteuer, Solidaritätszuschlag, Arbeitnehmer-Anteile an KV, RV, ALV, PV) sowie ggf. Dritt-Abzügen (Lohnpfändung, freiwillige Direktversicherung, AG-Darlehen) zur Auszahlung verbleibt. Ist der **rechtlich geschuldete Auszahlungsbetrag** (§ 614 BGB i. V. m. § 107 GewO) und die **Bemessungsgrundlage für Pfändungen** (§ 850 ff. ZPO).

**Berechnungsformel (vereinfacht):**
```
Bruttolohn                       (#1)
– Lohnsteuer (LSt)               (#2)
– Kirchensteuer (KiSt)           (#3, wenn Konfession vorhanden)
– Solidaritätszuschlag (SolZ)    (#4, oft 0 in Null-/Milderungszone)
– KV-Arbeitnehmer-Anteil          (#6)
– RV-Arbeitnehmer-Anteil          (#7)
– ALV-Arbeitnehmer-Anteil         (#8)
– PV-Arbeitnehmer-Anteil          (#9, ggf. +Kinderlos-Zuschlag)
= Nettolohn                      (#10)
– ggf. Pfändung, Vorschüsse, Sachbezüge-Verrechnung
= Auszahlungsbetrag auf Bankkonto
```

### Rechtsgrundlage
- **§ 611a BGB** — Arbeitsvertrag und Entgeltpflicht
- **§ 614 BGB** — Fälligkeit (i. d. R. nach geleisteter Arbeit)
- **§ 107 GewO** — Entgeltzahlung; bargeldlos per Überweisung (Sachbezüge max. teilweise)
- **§ 108 GewO** — Abrechnungspflicht (monatliche Lohnabrechnung in Textform)
- **§§ 850–850i ZPO** — Pfändungsfreigrenzen; die jeweilige Pfändungstabelle wird jährlich im Bundesgesetzblatt aktualisiert
- **§ 36 SGB I** — Handlungsfähigkeit ab 15 Jahren in SV-Angelegenheiten

**Verwandte Begriffe:**
- [Bruttolohn](#1-bruttolohn) — Ausgangsgröße (Gegenpol)
- [LSt](#2-lohnsteuer-lst), [KiSt](#3-kirchensteuer-kist), [SolZ](#4-solidaritätszuschlag-solz) — Steuerabzüge
- [KV](#6-krankenversicherung-kv), [RV](#7-rentenversicherung-rv), [ALV](#8-arbeitslosenversicherung-alv), [PV](#9-pflegeversicherung-pv) — SV-Abzüge
- **Pfändungsfreibetrag / Pfändungsfreigrenze** — gesetzlich geschützter Mindest-Nettolohn bei Pfändung (eigener Eintrag in späterer Batch)
- **Entgeltabrechnung / Lohnabrechnung** — monatliche Pflicht-Dokumentation nach § 108 GewO (möglicher Eintrag Batch 2 oder späterer Batch)

**Verwendung im Code:**
- `payroll_entries.net_wage` — **berechnetes Feld** (`NUMERIC(10,2)`, GENERATED STORED empfohlen, damit DB-Konsistenz garantiert)
- `payroll_entries.payout_amount` — nach Pfändungen/Dritt-Abzügen; kann abweichen
- `src/domain/payroll/netWage/` (geplant Sprint 22+) — orchestriert die 9 vorherigen Module
- **Audit-Log:** jede Nettolohn-Berechnung muss mit allen Einzelwerten (9 Bestandteile) und den verwendeten Beitragssätzen/Steuerklassen/Rechengrößen archiviert werden — **GoBD Rz. 103 Nachvollziehbarkeit + Unveränderbarkeit**
- **Invariante:** Nettolohn darf **niemals** als Eingabe in die Berechnung verwendet werden — immer nur als Ergebnis. Rückwärtsrechnung ("Nettolohn-Zielvereinbarung") erfordert separaten Iterationsalgorithmus und ist ein architektonischer Sonderfall.

**Nicht verwechseln mit:**
- **Zahlbetrag / Auszahlungsbetrag** — weicht vom Nettolohn ab, wenn Pfändungen, Vorschüsse oder Sachbezugs-Verrechnungen vorliegen
- **Steuerpflichtiges Einkommen (zvE)** — Jahresbegriff der ESt-Veranlagung, nicht monatlicher Nettolohn
- **Bruttojahresgehalt / Jahreseinkommen** — Jahresbetrachtung, meist Brutto
- **Gesamtaufwand Arbeitgeber** — Bruttolohn + AG-Anteile SV + U1/U2/U3-Umlagen; ca. 120 % des Brutto; NICHT Nettolohn

**Anmerkungen / Edge-Cases:**
- **Nettolohn-Vereinbarung im Arbeitsvertrag:** Selten, aber zulässig. Arbeitgeber trägt dann das Risiko steigender Abgaben — faktisch wird jeder Anstieg der Steuern/SV zur AG-Last. **Payroll-Modul muss "Netto-Ziel"-Mandanten unterstützen** via iterative Aufrollrechnung (Ziel-Netto rückwärts lösen). Nicht-trivialer Algorithmus.
- **Pfändungstabelle:** Jährliche Aktualisierung (Mitte des Jahres im BGBl. veröffentlicht) — **weitere jährliche Konfiguration** neben SV-Beitragssätzen und Lohnsteuertabelle.
- **Geringfügige Beschäftigung:** Nettolohn = Bruttolohn (keine AN-Abzüge, außer ggf. opt-in zur RV). Sonderfall, der die Regelberechnung **umgeht**; UI muss Minijob-Flag sauber behandeln → Batch 2.
- **Auszahlung nicht nur in Euro:** Zulässig sind Sachbezüge bis zu 50 % des Arbeitsentgelts (§ 107 Abs. 2 GewO). Die "übrigen" 50 % MÜSSEN bar/bargeldlos ausgezahlt werden — relevant für Startups mit Aktien-/Optionsvergütung.
- **Lohnabrechnungspflicht § 108 GewO:** Der Arbeitgeber MUSS dem Arbeitnehmer bei jeder Zahlung eine Abrechnung aushändigen, die mindestens Brutto, alle Abzüge, Netto und den Abrechnungszeitraum enthält — **nicht nur Nettolohn-Anzeige**. Die Abrechnung ist ein **eigenständiges Dokument** und Teil der Beleg-Aufbewahrungspflicht (GoBD).


---

## 11. ELStAM — Elektronische Lohnsteuer-Abzugsmerkmale

| Feld | Inhalt |
|---|---|
| **Deutsch (primär)** | ELStAM — Elektronische Lohnsteuer-Abzugsmerkmale |
| **Synonyme (DE)** | ELStAM-Verfahren |
| **Arabisch** | السجل الإلكتروني لبيانات ضريبة الأجور (نظام اتحادي يديره BZSt، حلّ محلّ بطاقة الضريبة الورقية منذ 2013؛ يحتوي لكل موظّف فئته الضريبية ومعاملاته — Faktor — وديانته وعدد أطفاله وإعفاءاته؛ صاحب العمل ملزم بسحب البيانات قبل أول راتب ومراقبة التعديلات شهرياً) |
| **Englisch (Code-Kontext)** | `elstam` (Modul-Präfix) |
| **Kategorie** | Verfahren / Steuer-Infrastruktur |
| **Status** | FEST |
| **Aufgenommen am** | 2026-04-22, Terminology-Sprint 1 |

### Definition
Das zentrale elektronische Datenbank-System des Bundes, in dem für jeden Arbeitnehmer die für die Lohnsteuer relevanten persönlichen Merkmale (Steuerklasse, Faktor, Kinderfreibeträge, Konfession, persönliche Freibeträge, Hinzurechnungsbeträge) hinterlegt sind. Seit 2013 Pflicht-Ersatz der papierbasierten Lohnsteuerkarte. Der Arbeitgeber MUSS die Merkmale seiner Arbeitnehmer **vor dem ersten Lohnabzug** elektronisch abrufen und auf **monatliche Änderungsmitteilungen** reagieren.

**Lifecycle des ELStAM-Abrufs:**
- **Anmeldung** (bei Beginn des Arbeitsverhältnisses) — AG meldet Steuer-ID + Geburtsdatum + AG-Angaben
- **Abruf der ELStAM-Merkmale** — BZSt liefert Ausgangsdaten zurück
- **Monatliche Änderungsliste** — AG erhält automatisch Delta-Updates (Heirat, Kind, Kirchenaustritt, Wohnsitzwechsel)
- **Abmeldung** (bei Ende des Arbeitsverhältnisses) — AG meldet Austrittsdatum

### Rechtsgrundlage
- § 39 EStG — Lohnsteuer-Abzugsmerkmale
- § 39e EStG — **Kernvorschrift: elektronische Bereitstellung**
- § 39b EStG — Berechnung der LSt auf Basis der ELStAM-Daten
- § 41b EStG — Lohnsteuerbescheinigung (Output-Seite)
- BMF-Schreiben zum ELStAM-Verfahren (regelmäßig aktualisiert)
- Kopplung mit Steuer-Identifikationsnummer nach § 139b AO

**Verwandte Begriffe:**
- [Lohnsteuer (LSt)](#2-lohnsteuer-lst) — deren Berechnung die ELStAM-Daten vollständig bestimmt
- [Kirchensteuer (KiSt)](#3-kirchensteuer-kist) — Konfessions-Code stammt aus ELStAM
- [LStA](./04-steuer-meldungen.md#20-lohnsteuer-anmeldung-lsta) — die Meldung der einbehaltenen LSt, komplementär zu ELStAM
- [ELSTER](./04-steuer-meldungen.md#11-elster--elektronische-steuererklärung) — Übermittlungsweg (ELStAM-Abruf läuft technisch via ELSTER-Protokolle)
- **Steuer-Identifikationsnummer (IdNr)** — 11-stelliger Schlüssel zum ELStAM-Datensatz (§ 139b AO) — nicht zu verwechseln mit [Steuernummer](./04-steuer-meldungen.md#14-steuernummer)

**Verwendung im Code:**
- `src/domain/payroll/elstam/` (geplant Sprint 22+) — ELStAM-Client-Modul
- **Implementierungs-Optionen:** (a) eigenständiger HTTP-Client gegen ELSTER-Infrastruktur, (b) Nutzung einer Drittanbieter-Bibliothek, (c) Manuelle Eingabe als Fallback bis Voll-Integration. Empfehlung Architect: beginnen mit (c), dann (a) ab Sprint 23.
- `employees.elstam_last_sync` — Zeitpunkt der letzten erfolgreichen Delta-Abfrage
- `elstam_merkmale` — Versionierte Tabelle der empfangenen Merkmale, `gueltig_ab`/`gueltig_bis` (nicht nur aktueller Stand, sondern auch Historie — wegen unterjähriger Änderungen wie Heirat/Kirchenaustritt)
- **GoBD-relevant:** jede LSt-Berechnung MUSS mit den **zu diesem Zeitpunkt gültigen** ELStAM-Merkmalen archiviert werden

**Nicht verwechseln mit:**
- **Lohnsteuerkarte (Papier)** — seit 2013 abgeschafft; historisches Verfahren
- **Lohnsteuerbescheinigung** (§ 41b EStG) — Output des Arbeitgebers an das Finanzamt am Jahresende (Einzelmeldung pro AN), nicht ELStAM
- **ELSTER** — übergeordnete Plattform; ELStAM ist ein Teilverfahren, das technisch über ELSTER-Schnittstellen läuft
- **DEÜV-Meldeverfahren** — gleicher Idee-Typ, aber für SV; ELStAM ist Steuer-only

**Anmerkungen / Edge-Cases:**
- **Falsche Steuerklasse bei Fehlabruf:** Wenn der AG die ELStAM-Daten nicht rechtzeitig abruft, wird automatisch **Steuerklasse VI** angewendet (höchster Satz, keine Freibeträge) — teure Fehlerquelle. UI muss bei Neueinstellung zwingend den ELStAM-Abruf anstoßen bzw. blockieren.
- **Persönliche Freibeträge (§ 39a EStG):** Werden nicht automatisch vom BZSt, sondern vom Arbeitnehmer beim Finanzamt beantragt und dort in ELStAM eingespeist. Änderungen jederzeit möglich, erfordern keine AG-Aktion.
- **Mehrfachbeschäftigung:** Zweites (drittes…) Arbeitsverhältnis bekommt automatisch Steuerklasse VI. Der AN kann einen **Freibetrag** auf das Nebenarbeitsverhältnis beantragen, um die hohe Steuerlast zu mildern — aktiver Vorgang, nicht Default.
- **Auslandspendler / Grenzgänger:** Unterliegen Sonderregeln (DBA). ELStAM greift nur bei unbeschränkter Steuerpflicht (§ 1 Abs. 1 EStG) — beschränkt Steuerpflichtige haben separates Verfahren.
- **Datenschutz:** ELStAM-Abruf ist personenbezogene Datenverarbeitung nach DSGVO; AG-Zugriff ist durch § 39e EStG gesetzlich legitimiert, muss aber im Verarbeitungsverzeichnis dokumentiert sein.

---

## 12. DEÜV-Meldeverfahren

| Feld | Inhalt |
|---|---|
| **Deutsch (primär)** | DEÜV-Meldeverfahren |
| **Synonyme (DE)** | DEÜV, Datenerfassungs- und -übermittlungsverordnung, SV-Meldeverfahren |
| **Arabisch** | نظام الإبلاغ الإلكتروني الإلزامي للتأمينات الاجتماعية (المقابل التأميني لـ ELStAM من حيث البنية التحتية: نظام رقمي يديره GKV-Spitzenverband وتُقدَّم عبره كل إبلاغات صاحب العمل إلى الصناديق الصحية — الصناديق Einzugsstelle بدورها تُحوّل البيانات إلى التأمين التقاعدي والبطالة — ويشمل إبلاغات الالتحاق والخروج والإبلاغات السنوية وأحداث الاستثناء كالمرض الممتد) |
| **Englisch (Code-Kontext)** | `deuev` (Modul-Präfix) |
| **Kategorie** | Verfahren / SV-Infrastruktur |
| **Status** | FEST |
| **Aufgenommen am** | 2026-04-22, Terminology-Sprint 1 |

### Definition
Das gesetzlich vorgeschriebene **elektronische Melde- und Übermittlungsverfahren** zwischen Arbeitgebern und den Sozialversicherungsträgern. Basis ist die **Datenerfassungs- und -übermittlungsverordnung (DEÜV)**. Der Arbeitgeber meldet jede versicherungsrelevante Veränderung (Beginn, Ende, Unterbrechung, Jahresmeldung, Änderung) an die **Einzugsstelle** (= Krankenkasse des Arbeitnehmers, § 28h SGB IV), die die Daten wiederum an DRV, BA und ggf. Unfallversicherungsträger weiterleitet.

**Meldungsgrund-Codes (Auswahl):**

| Code | Anlass |
|---|---|
| **10** | Anmeldung (Beschäftigungsbeginn) |
| **30** | Abmeldung (Beschäftigungsende) |
| **50** | Jahresmeldung (zum Jahresende für alle AN) |
| **51** | Unterbrechungsmeldung (ohne Entgelt ≥ 1 Monat) |
| **54** | Sofortmeldung (§ 28a Abs. 4 SGB IV — ausgewählte Branchen, am ersten Arbeitstag) |
| **70** | Änderung Beitragsgruppe |

### Rechtsgrundlage
- **DEÜV** (Datenerfassungs- und -übermittlungsverordnung) — Kernverordnung
- § 28a SGB IV — **Meldepflicht des Arbeitgebers**
- § 28b SGB IV — gemeinsame Grundsätze Gesamtsozialversicherungsbeitrag
- § 28h SGB IV — Einzugsstelle (Krankenkasse)
- § 28p SGB IV — Prüfrechte der DRV
- Gemeinsame Grundsätze der Spitzenorganisationen der SV

**Verwandte Begriffe:**
- [Sozialversicherung (SV)](#5-sozialversicherung-sv) — die DEÜV-Meldungen bedienen alle vier Zweige
- [Versicherungsnummer (VSNR)](#19-versicherungsnummer-vsnr) — Pflichtfeld jeder DEÜV-Meldung
- [KV](#6-krankenversicherung-kv) — als Einzugsstelle Empfängerin aller Meldungen
- **Betriebsnummer (BBNR)** — 8-stellige ID des Arbeitgebers, Pflichtfeld in jeder Meldung; vom AG bei der BA zu beantragen → eigenständiger Eintrag in späterer Batch
- **sv.net** — von GKV-Spitzenverband betriebenes Online-Portal für kleinere AG, Alternative zu Lohnsoftware
- **A1-Bescheinigung** — DEÜV-Spezialform für EU-Entsendungen (§ 106 SGB IV)

**Verwendung im Code:**
- `src/domain/payroll/deuev/` (geplant Sprint 22+) — Melde-Engine
- **Technisches Format:** proprietäres XML-Format des GKV-Spitzenverbandes, dokumentiert im "Gemeinsamen Grundsätze"-Katalog
- **Integrationspfad-Entscheidung:** (a) Direktanbindung an GKV-Kommunikationsserver via ext. Library, (b) Manueller Export mit Upload via sv.net — empfohlen (b) für MVP, (a) ab Sprint 24+
- `employees.betriebsnummer` — FK auf `unternehmen.betriebsnummer` (bei Multi-Betriebsstätten-Mandanten ggf. pro Betriebsstätte)
- `deuev_meldungen` — Versionierte Log-Tabelle aller ausgehenden Meldungen (Meldungsgrund, Zeitstempel, Empfangsbestätigung); **GoBD-archivierungspflichtig**

**Nicht verwechseln mit:**
- **ELStAM-Verfahren** (#11) — analoge Idee, aber Steuer statt SV; völlig separate Schnittstelle
- **Lohnsteuerbescheinigung** (§ 41b EStG) — Jahres-Einzelmeldung an Finanzamt, steuerseitig
- **Beitragsnachweis** — monatliche Summen-Abrechnung an die Einzugsstelle, ist ein zusätzliches Verfahren **neben** DEÜV (nicht dasselbe — Beitragsnachweis summiert Beiträge, DEÜV meldet personenbezogene Daten)
- **ZfA-Meldung** — Zentrale Zulagenstelle für Altersvermögen, separates Verfahren für Riester-Förderung

**Anmerkungen / Edge-Cases:**
- **Sofortmeldepflicht (§ 28a Abs. 4 SGB IV):** In bestimmten Branchen (Baugewerbe, Gaststätten, Speditionen, Schaustellerei, Gebäudereinigung, Forstwirtschaft, Messebau, Fleischwirtschaft, Zeitarbeit) MUSS die Anmeldung **am Tag des Arbeitsbeginns** erfolgen, nicht erst mit der Regelfrist. Verstöße = Ordnungswidrigkeit mit hohem Bußgeld. UI-Warnung bei Branchenzuordnung pflichtig.
- **Doppelte Meldungen:** Bei Kassenwechsel des AN ist eine **Ummeldung (Code 32/12)** durch beide Kassen zu veranlassen — komplexer Ablauf, bei Fehler drohen SV-Lücken.
- **Entgeltmeldung bei unterjährigem Austritt:** Spezielle Jahresmeldung zum Austrittsdatum (Code 30), nicht zu verwechseln mit regulärer Jahresmeldung (Code 50).
- **Verjährung:** SV-Beiträge verjähren nach 4 Jahren regulär, bei vorsätzlicher Hinterziehung nach 30 Jahren (§ 25 SGB IV) — DEÜV-Meldungen müssen entsprechend lange archiviert werden.
- **Datenschutz:** DEÜV-Daten enthalten Gesundheits- bzw. sensible Arbeitnehmerdaten. Übermittlung ist durch SGB IV legitimiert, interner Umgang durch DSGVO Art. 9 gesichert.

---

## 13. Beitragsbemessungsgrenze (BBG)

| Feld | Inhalt |
|---|---|
| **Deutsch (primär)** | Beitragsbemessungsgrenze |
| **Synonyme (DE)** | BBG (Abkürzung, bevorzugt), Beitragsbemessungsgrenze der SV |
| **Arabisch** | الحد الأقصى لاحتساب اشتراكات التأمين الاجتماعي (مبلغ سنوي/شهري يُحدَّد بقرار حكومي كل عام — Rechengrößenverordnung — تُحسَب فوقه الاشتراكات على الراتب فقط حتى هذا السقف ولا تُفرض على الجزء الزائد منه؛ هناك قيمتان مختلفتان في ألمانيا: BBG للتأمين الصحي والرعاية — أدنى — و BBG للتأمين التقاعدي والبطالة — أعلى) |
| **Englisch (Code-Kontext)** | `bbg` / `contribution_assessment_ceiling` |
| **Kategorie** | Datentyp / Rechengröße |
| **Status** | FEST |
| **Aufgenommen am** | 2026-04-22, Terminology-Sprint 1 |

### Definition
Die **gesetzliche Obergrenze** des Arbeitsentgelts, bis zu der Beiträge zur gesetzlichen Sozialversicherung erhoben werden. Entgelt-Bestandteile **oberhalb** der BBG bleiben beitragsfrei. Die BBG wird **jährlich** durch die **Sozialversicherungs-Rechengrößenverordnung** (BMAS-Verordnung auf Basis § 17 SGB IV) angepasst, orientiert an der Entwicklung der Bruttolöhne und -gehälter.

**Zwei Grenzen, zwei Bereiche:**

| BBG-Typ | Betrifft | Höhe (typ.) |
|---|---|---|
| **BBG KV/PV** | Krankenversicherung, Pflegeversicherung | niedriger |
| **BBG RV/ALV** | Rentenversicherung, Arbeitslosenversicherung | höher |

Zusätzlich bisher (bis 2024 / Übergang 2025):
- **BBG West** vs. **BBG Ost** — Harmonisierung weitgehend abgeschlossen, vereinzelte Übergangswerte bis spätestens 2025

**Monatswerte** sind 1/12 des Jahreswertes (nicht genau, sondern gerundet nach Verordnung).

### Rechtsgrundlage
- **§ 17 SGB IV** — Ermächtigung zur jährlichen Rechengrößenverordnung
- **§ 6 Abs. 1 Nr. 1 SGB V** — JAEG-Bezug (zu unterscheiden, siehe [JAEG](#14-jahresarbeitsentgeltgrenze-jaeg))
- § 157 SGB VI — BBG RV
- § 341 Abs. 4 SGB III — BBG ALV (verweist auf RV)
- § 223 SGB V — Beitragspflichtiges Einkommen KV
- § 55 SGB XI — Beitragsbemessung PV (verweist auf KV)
- **Sozialversicherungs-Rechengrößenverordnung** — jährlich, BGBl.

**Verwandte Begriffe:**
- [Sozialversicherung (SV)](#5-sozialversicherung-sv) — Oberbegriff
- [KV](#6-krankenversicherung-kv), [PV](#9-pflegeversicherung-pv) — BBG KV/PV betrifft diese Zweige
- [RV](#7-rentenversicherung-rv), [ALV](#8-arbeitslosenversicherung-alv) — BBG RV/ALV betrifft diese Zweige
- [JAEG](#14-jahresarbeitsentgeltgrenze-jaeg) — **völlig andere Größe**! BBG begrenzt Beitragshöhe, JAEG Versicherungspflicht
- **Bezugsgröße (§ 18 SGB IV)** — ableitende Größe; viele Freigrenzen und Schwellen sind Prozentsätze der Bezugsgröße (z. B. Geringverdienergrenze, Mindestbeitrag bei freiwilliger Versicherung)

**Verwendung im Code:**
- **Zentrale Konfigurations-Tabelle** `bbg_werte_jahr` (Teil der `beitragssaetze_jahr`-Familie):
  - `jahr` (int)
  - `bbg_kv_pv_monat` (NUMERIC)
  - `bbg_kv_pv_jahr` (NUMERIC)
  - `bbg_rv_alv_monat_west` (NUMERIC)
  - `bbg_rv_alv_monat_ost` (NUMERIC) — nullable ab vollständiger Harmonisierung
  - `bbg_rv_alv_jahr_west` (NUMERIC)
  - `bbg_rv_alv_jahr_ost` (NUMERIC) — nullable
  - `gueltig_ab` / `gueltig_bis` (DATE) — unterjährige Wechsel möglich
- **Pflege-Prozess:** jährlicher CSV-Import aus amtlicher Rechengrößenverordnung (analog zu [Hebesatz](./04-steuer-meldungen.md#19-gewerbesteuer-gewst))
- `src/domain/payroll/sv/bbg/` — Lookup-Helper
- **Kernalgorithmus bei SV-Berechnung:** `pflichtiges_entgelt = min(brutto_sv, bbg)` — MUSS gegen die korrekte BBG (West/Ost, KV/PV vs. RV/ALV, zum Abrechnungszeitpunkt gültige Fassung) geprüft werden
- **Invariante:** Jahres-Brutto-Überschreitung der BBG MUSS **monatsweise** abgerechnet werden — die **Märzklausel (§ 23a SGB IV)** bei Einmalzahlungen ist ein Sonderfall und verdient einen eigenen Subalgorithmus

**Nicht verwechseln mit:**
- **Jahresarbeitsentgeltgrenze (JAEG)** — **völlig unterschiedliche Funktion**! JAEG entscheidet über Versicherungspflicht (KV-Grenze), BBG begrenzt nur die Beitragshöhe. Siehe [#14](#14-jahresarbeitsentgeltgrenze-jaeg).
- **Mindestbeitragsbemessungsgrundlage** (freiwillig Versicherte, Selbstständige) — gilt als Untergrenze, nicht Obergrenze
- **Beitragsfreibetrag** (z. B. für Direktversicherung nach § 1 Abs. 1 SvEV) — völlig anderer Mechanismus (lohnbestandteil-spezifisch, nicht entgelt-summarisch)
- **Pfändungsfreigrenze** (§ 850c ZPO) — schützt Nettolohn, nicht BBG-Logik

**Anmerkungen / Edge-Cases:**
- **Mehrfachbeschäftigung:** Bei mehreren Arbeitsverhältnissen gilt die BBG **zusammengerechnet für alle Beschäftigungen**. Einzelner AG kann nicht feststellen, ob AN bereits in anderem AV die BBG ausschöpft — **Erstattung überzahlter Beiträge** (§ 26 SGB IV) erfolgt auf Antrag über die Einzugsstelle.
- **Jahresüberschreitung durch Einmalzahlung:** Wenn die Sonderzahlung (z. B. Weihnachtsgeld) das Jahres-BBG-Limit überschreiten würde, greift die **Märzklausel** (§ 23a Abs. 2 SGB IV) — der überschreitende Teil wird dem Vorjahr zugerechnet, wenn die Zahlung im ersten Quartal erfolgt. Komplexer Sonderfall.
- **Unterjährige Änderung der BBG:** In seltenen Fällen (z. B. PUEG 2023) wurde die Rechengrößen-Systematik **mitten im Jahr** angepasst. Datenmodell MUSS dies via `gueltig_ab`/`gueltig_bis` unterstützen — blosser `year int` ist architektonisch unzureichend (wurde in Batch 1 bei [PV](#9-pflegeversicherung-pv) bereits etabliert).
- **Grenzwerte 2025:** Die Ost/West-Harmonisierung wird 2025 weitgehend abgeschlossen; der Code MUSS aber Rückwärts-Berechnungen für Jahre bis einschließlich 2024 unterstützen — eine pauschale Streichung der Ost-Werte ist falsch.

---

## 14. Jahresarbeitsentgeltgrenze (JAEG)

| Feld | Inhalt |
|---|---|
| **Deutsch (primär)** | Jahresarbeitsentgeltgrenze |
| **Synonyme (DE)** | JAEG (Abkürzung, bevorzugt), Versicherungspflichtgrenze |
| **Arabisch** | حد الدخل السنوي لإلزامية التأمين الصحي (الحد السنوي الذي يُعفي الموظّفين الذين يتجاوزون دخلهم عنه من إلزامية التأمين الصحي العام — GKV — ويمنحهم خيار الانتقال إلى التأمين الصحي الخاص — PKV — أو البقاء طوعياً في العام؛ يختلف تماماً عن BBG الذي يحدد فقط حدّ احتساب الاشتراك، لا حدّ الإلزامية) |
| **Englisch (Code-Kontext)** | `jaeg` / `compulsory_insurance_threshold` |
| **Kategorie** | Datentyp / Rechengröße / Schwellenwert |
| **Status** | FEST |
| **Aufgenommen am** | 2026-04-22, Terminology-Sprint 1 |

### Definition
Die Einkommensschwelle, oberhalb derer ein Arbeitnehmer **nicht mehr der gesetzlichen Krankenversicherungspflicht unterliegt** (§ 6 Abs. 1 Nr. 1 SGB V). Wer JAEG in drei aufeinanderfolgenden Kalenderjahren überschreitet, **wird versicherungsfrei** und kann wählen: freiwillige GKV-Mitgliedschaft oder Wechsel in die **Private Krankenversicherung (PKV)**. Die JAEG wird jährlich ebenfalls über die **Sozialversicherungs-Rechengrößenverordnung** angepasst und liegt traditionell etwas über der BBG KV/PV.

**Zwei JAEG-Werte:**

| Typ | Betroffene Personengruppe |
|---|---|
| **Allgemeine JAEG** | Alle Arbeitnehmer, die **nach** 2002 versicherungspflichtig wurden |
| **Besondere JAEG** | Arbeitnehmer, die am 31.12.2002 bereits in PKV versichert und versicherungsfrei waren (Bestandsschutz nach § 6 Abs. 7 SGB V) — liegt niedriger |

### Rechtsgrundlage
- § 6 Abs. 1 Nr. 1 SGB V — allgemeine JAEG (Versicherungsfreiheit)
- § 6 Abs. 6 SGB V — jährliche Anpassung durch BMAS-Verordnung
- § 6 Abs. 7 SGB V — **besondere JAEG** (Bestandsschutz)
- § 17 SGB IV — Ermächtigung für Rechengrößenverordnung
- § 223 SGB V — Abgrenzung zur BBG (beide in derselben Verordnung festgelegt)

**Verwandte Begriffe:**
- [Krankenversicherung (KV)](#6-krankenversicherung-kv) — JAEG betrifft **ausschließlich** KV-Pflicht (NICHT RV/ALV/PV!)
- [Pflegeversicherung (PV)](#9-pflegeversicherung-pv) — PV folgt der KV-Entscheidung (wer GKV, PKV → PPV)
- [BBG](#13-beitragsbemessungsgrenze-bbg) — **nicht verwechseln**: BBG = Beitragshöhe-Deckel, JAEG = Pflicht-Schwelle
- **Private Krankenversicherung (PKV)** — Alternative, möglich erst nach JAEG-Überschreitung + Drei-Jahres-Regel
- **Arbeitgeberzuschuss zur PKV** — § 257 SGB V, max. halber durchschnittlicher GKV-Höchstbeitrag

**Verwendung im Code:**
- Teil derselben Konfigurations-Familie wie BBG: `jaeg_werte_jahr`-Tabelle mit
  - `jahr`
  - `jaeg_allgemein_jahr`
  - `jaeg_besondere_jahr` (Bestandsschutz vor 2003)
  - `gueltig_ab` / `gueltig_bis`
- `src/domain/payroll/sv/jaeg/` (geplant Sprint 22+) — Pflicht-Prüfung
- **Drei-Jahres-Regel-Algorithmus:** Prüfung der JAEG-Überschreitung in **drei aufeinanderfolgenden Vollen Kalenderjahren** — nicht rollierend, sondern Kalenderjahr-genau
- `employees.kv_status` — Enum `pflichtversichert | freiwillig_gkv | pkv` mit History-Versionierung
- `employees.pkv_bestandsschutz_2002` (boolean) — bestimmt, welche JAEG anzuwenden ist
- **Invariante:** JAEG-Prüfung erfolgt **jährlich zum Jahreswechsel** (nicht monatlich) — Batch-Job im Payroll-Modul

**Nicht verwechseln mit:**
- **BBG** — BBG begrenzt Beitragshöhe für **pflichtversicherte** AN; JAEG entscheidet über die **Pflicht selbst**
- **Geringfügigkeitsgrenze** (Minijob, 556 €) — Untergrenze der SV-Pflicht, nicht Obergrenze
- **Beitragsbemessungsgrundlage für freiwillig Versicherte** — eigenes Kapitel, Mindest-/Höchstwerte unabhängig von JAEG
- **Einkommensteuer-Freigrenzen / -Freibeträge** — steuerrechtlich, völlig unabhängig

**Anmerkungen / Edge-Cases:**
- **Wechsel PKV → GKV schwierig:** Ein einmal in die PKV gewechselter AN kann nur in engen Ausnahmefällen zurück (z. B. Unterschreiten der JAEG unter Alter 55). Eine **irreversible Entscheidung** für viele — die Software sollte entsprechende Warnhinweise geben, wenn AG einen PKV-Wechsel dokumentiert.
- **Drei-Jahres-Voraussicht:** Der AG muss die JAEG-Überschreitung für das **Folgejahr prognostizieren**, wenn das regelmäßige Arbeitsentgelt absehbar die Grenze überschreitet. Nicht alle Fälle sind eindeutig — bei Grenzfällen **Rücksprache Steuerberater / Lohnbüro**.
- **Besondere JAEG (Bestandsschutz 2002):** wird seltener — nur noch Arbeitnehmer, die zum 31.12.2002 bereits PKV-versichert **und** versicherungsfrei waren. In der Praxis eine kleine, aber aktive Gruppe. Payroll-Modul muss BEIDE Werte verfügbar halten.
- **Veränderung der Regelung möglich:** Die JAEG und ihre Drei-Jahres-Systematik sind immer wieder Gegenstand politischer Debatte. **Bei Gesetzesänderung** muss der Prüfungsalgorithmus angepasst werden — eigentumsrechtlich heikel, daher werden Übergangsregelungen meist lange laufen.

---

## 15. Minijob / geringfügige Beschäftigung

| Feld | Inhalt |
|---|---|
| **Deutsch (primär)** | Minijob |
| **Synonyme (DE)** | Geringfügige Beschäftigung, 556-Euro-Job (historisch auch: 538-Euro-Job [2024], 520-Euro-Job [Q4 2022–2023], 450-Euro-Job [2013–2022], 400-Euro-Job [2003–2012] — je nach Mindestlohn-Niveau) |
| **Arabisch** | العمل بأجر ضئيل (عمل محدود قانوناً بسقف دخل شهري مرتبط بالحد الأدنى للأجور — حالياً 556 يورو — أو بفترة قصوى 3 أشهر / 70 يوم عمل سنوياً؛ معفى من اشتراكات الموظّف في الصحي والبطالة، ويدفع صاحب العمل رسوماً مقطوعة إلى Minijob-Zentrale) |
| **Englisch (Code-Kontext)** | `minijob` / `marginal_employment` |
| **Kategorie** | Beschäftigungsart / Sonderfall |
| **Status** | FEST |
| **Aufgenommen am** | 2026-04-22, Terminology-Sprint 1 |

### Definition
Eine geringfügige Beschäftigung im Sinne des § 8 SGB IV mit besonderer sozialversicherungs- und steuerrechtlicher Behandlung. Zwei Formen:

**(1) Geringfügig entlohnte Beschäftigung** (§ 8 Abs. 1 Nr. 1 SGB IV):
Monatslohn bis zur **Geringfügigkeitsgrenze**, die seit 01.10.2022 **dynamisch an den gesetzlichen Mindestlohn gekoppelt** ist (Formel: 130 × gesetzlicher Mindestlohn / 3). Stand 2025/2026: **556 €** monatlich (jährlich gegen Mindestlohnentwicklung zu prüfen).

**(2) Kurzfristige Beschäftigung** (§ 8 Abs. 1 Nr. 2 SGB IV):
Beschäftigung, die von vornherein auf maximal **3 Monate oder 70 Arbeitstage** im Kalenderjahr befristet ist — **unabhängig von der Höhe des Entgelts**.

**Beitrags- und Steuersystematik (Minijob im Privathaushalt abweichend — siehe Edge-Cases):**

| Komponente | Bei (1) geringfügig entlohnt | Bei (2) kurzfristig |
|---|---|---|
| AG-Pauschale KV | **13 %** | 0 % |
| AG-Pauschale RV | **15 %** | 0 % |
| AG-Umlagen U1, U2, U3 | Pflicht (über Minijob-Zentrale) | Pflicht |
| AN-Beitrag RV | 3,6 % (Aufstockung, **Befreiung auf Antrag** möglich nach § 6 Abs. 1b SGB VI) | 0 % |
| AN-Beitrag sonstige SV | 0 % | 0 % |
| Lohnsteuer | **Pauschsteuer 2 %** (inkl. KiSt + SolZ) ODER individuell nach ELStAM | Pauschsteuer 25 % oder individuell |
| Einzugsstelle | **Minijob-Zentrale** (DRV Knappschaft-Bahn-See) | je nach Fall |

### Rechtsgrundlage
- **§ 8 SGB IV** — Begriff der geringfügigen Beschäftigung (Kernvorschrift)
- § 8a SGB IV — Minijob im Privathaushalt
- § 14 SGB IV — Zusammenrechnung bei Mehrfachbeschäftigung
- § 249b SGB V — AG-Pauschalbeitrag KV
- § 172 SGB VI — AG-Pauschalbeitrag RV
- § 6 Abs. 1b SGB VI — **Befreiung des AN** von der RV-Pflicht
- § 40a EStG — Pauschsteuer 2 % (einheitliche Pauschsteuer für Minijob)
- § 40a Abs. 1/3 EStG — Pauschsteuer 25 % (kurzfristige Beschäftigung)

**Verwandte Begriffe:**
- [Midijob / Übergangsbereich](#16-midijob--übergangsbereich) — **direkt angrenzend** bei Entgelt 556,01 €–2.000 €
- [Pauschsteuer (§§ 40–40b EStG)](#17-pauschsteuer--40--40b-estg) — separater Eintrag, detailliert die Pauschsteuer-Systematik
- [Umlageverfahren (U1, U2, U3)](#18-umlageverfahren-u1-u2-u3) — bei Minijob zwingend über Minijob-Zentrale
- [Lohnsteuer (LSt)](#2-lohnsteuer-lst) — alternativ zur Pauschsteuer individuelle Versteuerung möglich
- **Minijob-Zentrale** — Deutsche Rentenversicherung Knappschaft-Bahn-See (DRV KBS), Sitz Essen — Einzugsstelle für alle Minijobs
- **Mindestlohn (MiLoG)** — Kopplung seit 01.10.2022, macht die Grenze dynamisch
- **Übungsleiterfreibetrag (§ 3 Nr. 26 EStG)** — 3.000 €/Jahr, separat vom Minijob

**Verwendung im Code:**
- `employees.employment_type` — Enum: `regular | minijob_monthly | minijob_shortterm | midijob | pauschal_30_40_40b`
- `src/domain/payroll/special/minijob/` (geplant Sprint 22+) — komplett separate Berechnungs-Pipeline, NICHT Variante der Regelberechnung
- **Kritischer UI-Check:** bei Überschreiten der Geringfügigkeitsgrenze → automatischer Wechsel zum Midijob; bei gelegentlichem Überschreiten (max 2 Monate/Jahr, § 8 Abs. 1 Nr. 1 SGB IV) → unschädlich
- `employees.rv_befreiung_minijob` (boolean) — Befreiungsantrag des AN nach § 6 Abs. 1b SGB VI
- **Geringfügigkeitsgrenze** in `beitragssaetze_jahr` als `geringfuegigkeitsgrenze_monat` (NUMERIC) — an Mindestlohn gekoppelt, wird bei jeder Mindestlohn-Anpassung mit aktualisiert (kann unterjährig wechseln)

**Nicht verwechseln mit:**
- **Midijob** — Einkommen 556,01 €–2.000 €, völlig andere Logik (siehe [#16](#16-midijob--übergangsbereich))
- **Nebenjob oberhalb Minijob-Grenze** — regulär versicherungspflichtig, voll beitragspflichtig
- **Freiberufliche Nebentätigkeit / Selbstständigkeit** — kein Arbeitnehmerverhältnis, keine Lohnabrechnung
- **Midijob vs. kurzfristiger Minijob:** Entscheidend ist die **Vorabvereinbarung** über die Dauer (≤ 3 Monate/70 Tage). Nachträglich entscheiden lassen geht nicht.
- **Übungsleitertätigkeit, Ehrenamt** — eigenständige steuerliche Freibeträge, keine Minijob-Systematik

**Anmerkungen / Edge-Cases:**
- **Mehrere Minijobs beim gleichen AG:** Werden zusammengerechnet und behandelt wie ein einzelner Job (§ 8 Abs. 2 SGB IV). Überschreiten zusammen die Grenze → automatisch keine Minijobs mehr.
- **Minijob + reguläre Hauptbeschäftigung:** 1 Minijob bleibt geringfügig; **ab dem zweiten Minijob** neben Hauptbeschäftigung wird jeder weitere in die Zusammenrechnung mit der Hauptbeschäftigung aufgenommen → verlorener Minijob-Status, volle SV-Pflicht.
- **Gelegentliches Überschreiten:** Bis zu **zwei Monate im Kalenderjahr** darf das Entgelt die Grenze überschreiten, ohne Statusverlust (§ 8 Abs. 1 Nr. 1 S. 3 SGB IV) — "unvorhersehbar", nicht strukturell.
- **RV-Befreiung des AN:** Führt zwar zu höherer Netto-Auszahlung, aber AN verzichtet auf Rentenanwartschaft und kann kein Riester mehr bekommen. Warnhinweis im UI pflichtig.
- **Minijob im Privathaushalt (§ 8a SGB IV):** Reduzierte AG-Pauschalen (KV 5 %, RV 5 %, kein Umlage U3), privater Haushalt als AG. Trigger für UI: "Mandant = Privatperson" vs. "Mandant = Unternehmen".
- **Dynamische Grenze:** Jede Erhöhung des Mindestlohns (typ. Mitte/Ende des Jahres) verschiebt die Geringfügigkeitsgrenze — **unterjähriger Wechsel** in den Rechengrößen pflichtig. Mandanten müssen proaktiv informiert werden.

---

## 16. Midijob / Übergangsbereich

| Feld | Inhalt |
|---|---|
| **Deutsch (primär)** | Midijob |
| **Synonyme (DE)** | Übergangsbereich, Gleitzone (historisch bis 2019), Entgeltbereich § 20 Abs. 2 SGB IV |
| **Arabisch** | العمل في منطقة الاشتراك المخفّض (نظام بيني بين Minijob والعمل الكامل، للأجور بين 556.01 و 2000 يورو شهرياً؛ يُخفَّض اشتراك الموظّف في التأمينات الاجتماعية بصيغة انزلاقية متصاعدة حتى الحد الأقصى، بينما يتحمّل صاحب العمل النسبة الكاملة) |
| **Englisch (Code-Kontext)** | `midijob` / `transition_range` |
| **Kategorie** | Beschäftigungsart / Sonderfall |
| **Status** | FEST |
| **Aufgenommen am** | 2026-04-22, Terminology-Sprint 1 |

### Definition
Ein Beschäftigungsverhältnis mit regelmäßigem Monatsentgelt **oberhalb der Geringfügigkeitsgrenze** ([Minijob](#15-minijob--geringfügige-beschäftigung)) und **unterhalb der oberen Grenze des Übergangsbereichs** (ab 01.01.2023: **2.000 €**). Im Übergangsbereich zahlt der Arbeitnehmer **reduzierte SV-Beiträge** nach einer speziellen Formel, während der Arbeitgeber den **vollen regulären AG-Anteil** leistet. Ziel: sanfter Übergang von Minijob zur Vollbeschäftigung, ohne den Arbeitnehmer mit einem Sprung in die volle Beitragslast zu konfrontieren.

**Berechnung (§ 20 Abs. 2a SGB IV, vereinfacht):**
Der Übergangsbereich definiert eine **fiktive reduzierte Beitragsbemessungsgrundlage** für den AN-Anteil:

```
F = (Geringfügigkeitsgrenze × Gesamtbeitragssatz) / (Obergrenze × Gesamtbeitragssatz − Geringfügigkeitsgrenze × Gesamtbeitragssatz / 2)
reduzierte_an_bemessung = F × Arbeitsentgelt + (Obergrenze / (Obergrenze − Geringfügigkeitsgrenze) − Geringfügigkeitsgrenze / (Obergrenze − Geringfügigkeitsgrenze) × F) × (Arbeitsentgelt − Geringfügigkeitsgrenze)
```

Die Formel ist **nicht-trivial** und in § 20 Abs. 2a SGB IV direkt kodifiziert. Einmal am Bereichs-Untergrenze gleich dem Minijob-Niveau, am Bereichs-Obergrenze gleich dem vollen Entgelt — dazwischen **linear** gleitend (nach Reform 2022 linearisiert).

**AG-Anteil:** unverändert **voll** auf das reale Arbeitsentgelt (keine Reduktion!).

### Rechtsgrundlage
- **§ 20 Abs. 2 SGB IV** — Definition Übergangsbereich
- **§ 20 Abs. 2a SGB IV** — Berechnungsformel für reduzierte AN-Bemessung
- § 163 Abs. 10 SGB VI — rentenrechtliche Gleichstellung (AN-Entgeltpunkte werden trotz reduzierter Beiträge voll berechnet)
- **Reform 2022:** Grenze von 1.300 € → 1.600 € (Juli 2022) → 2.000 € (Januar 2023); Kennwechsel von "Gleitzone" zu "Übergangsbereich"
- Gemeinsame Grundsätze der Spitzenorganisationen zur Berechnung im Übergangsbereich (präzise Formel-Dokumentation)

**Verwandte Begriffe:**
- [Minijob](#15-minijob--geringfügige-beschäftigung) — direkte Untergrenze
- [Bruttolohn](#1-bruttolohn) — reguläre Basis, die im Midijob teilweise durch "fiktive Bemessung" ersetzt wird
- [BBG](#13-beitragsbemessungsgrenze-bbg) — Obergrenze des Übergangsbereichs liegt weit unter jeder BBG (irrelevant)
- [Alle SV-Zweige](#5-sozialversicherung-sv) — die reduzierte Bemessung gilt für ALLE vier Zweige gleichzeitig
- **Gleitzone** — Vorgänger-Begriff bis 30.06.2019; rechtssystematisch überholt
- **Rentenrechtliche Gleichstellung** — gesetzliche Schutzmaßnahme: trotz reduzierter Beiträge werden volle Entgeltpunkte gutgeschrieben (§ 163 Abs. 10 SGB VI)

**Verwendung im Code:**
- `src/domain/payroll/special/midijob/` (geplant Sprint 22+) — eigenständiges Modul, **separate Formel-Implementierung**
- **Kernalgorithmus:** die Formel nach § 20 Abs. 2a SGB IV **exakt** kodieren; Testvektoren aus Gemeinsamer Grundsätze-Katalog als Regression-Suite
- **Input-Validierung:** wenn Monatsentgelt ≤ Geringfügigkeitsgrenze → Minijob-Pipeline; wenn > 2.000 € → Regelberechnung; nur dazwischen Midijob-Logik
- `beitragssaetze_jahr.uebergangsbereich_obergrenze` (aktuell 2.000 €, kann sich ändern)
- **Kritisch:** die Reduktion gilt **nur für AN-Anteil** — AG-Pipeline MUSS parallel voll laufen, nicht mit reduzierter Bemessung. Das ist einer der häufigsten Bugs in selbstgebauten Midijob-Algorithmen.
- **Invariante:** Bei Einmalzahlungen gilt eine **Sonderregelung** (Einmalzahlung wird zur Laufzahl addiert für die Prüfung der Obergrenze — bei Überschreitung keine Midijob-Behandlung mehr)

**Nicht verwechseln mit:**
- **Minijob** — unterhalb der Geringfügigkeitsgrenze; völlig andere Systematik (Pauschalabgaben AG vs. reduzierter AN-Beitrag)
- **Werkstudent (§ 6 Abs. 1 Nr. 3 SGB V)** — eigenständige Beschäftigungsart; nur Renten-, keine KV/PV/ALV-Pflicht
- **Altersteilzeit** — Sonderform für Rentennahe, nicht mit Midijob verwandt
- **Teilzeitbeschäftigung oberhalb 2.000 €** — regulär versicherungspflichtig, **volle** SV-Beiträge AN-seitig (und AG-seitig)

**Anmerkungen / Edge-Cases:**
- **Formel-Komplexität:** die genaue § 20 Abs. 2a-Formel hat sich über die Jahre geändert. Vor 2022 war sie deutlich komplexer und weniger linear. Für Altbestände **muss die jahres-gültige Formel-Version angewandt werden** — Versionierung im Code pflichtig.
- **Opt-Out zur Gleitzone (vor 2022):** AN konnte in die volle Beitragspflicht wechseln, um höhere Rentenansprüche zu bekommen. Seit Reform 2022 überflüssig — Rentenansprüche werden ohnehin voll gutgeschrieben.
- **Einmalzahlung im Grenzbereich:** Weihnachtsgeld oder Urlaubsgeld kann das Monatsentgelt über 2.000 € heben; dann gilt für diesen Monat die volle Beitragspflicht (nicht Midijob). UI-Prognose-Warnung bei Annäherung an Obergrenze sinnvoll.
- **Mehrfachbeschäftigung:** Das **gesamte beitragspflichtige Entgelt aus allen Beschäftigungen** muss im Übergangsbereich liegen. Wenn zusammen > 2.000 €, keine Midijob-Behandlung mehr — komplexer Mehrfach-AG-Fall; in der Praxis oft fehlerhaft berechnet.
- **AG-Kosten-Transparenz:** Mandanten sind oft überrascht, dass **AG im Midijob nichts spart** — der AG-Anteil bleibt voll. Dokumentations-Hinweis im UI sinnvoll.

---

## 17. Pauschsteuer (§§ 40–40b EStG)

| Feld | Inhalt |
|---|---|
| **Deutsch (primär)** | Pauschsteuer |
| **Synonyme (DE)** | Pauschalierte Lohnsteuer, Pauschalversteuerung, LSt-Pauschalierung |
| **Arabisch** | الضريبة الجزافية على الأجور (بديل للاحتساب الفردي وفق ELStAM: يدفع صاحب العمل نسبة ثابتة — 2٪ أو 15٪ أو 20٪ أو 25٪ حسب الحالة — بدلاً من ضريبة أجور كل موظف؛ تُستخدم في Minijob وحفلات الشركات والمزايا العينية وتأمين المدخرات، ويتحمّلها صاحب العمل وحده) |
| **Englisch (Code-Kontext)** | `pauschsteuer` / `flat_rate_wage_tax` |
| **Kategorie** | Steuerabzug / Sonderform der LSt |
| **Status** | FEST |
| **Aufgenommen am** | 2026-04-22, Terminology-Sprint 1 |

### Definition
Eine **vom Arbeitgeber übernommene pauschalierte Lohnsteuer**, die alternativ zur regulären individuellen LSt-Berechnung nach ELStAM angewandt wird. Wirtschaftlich trägt sie der Arbeitgeber (nicht der Arbeitnehmer), wodurch der entsprechende Lohnbestandteil für den AN **steuerfrei** bleibt. Die Pauschsteuer wird direkt vom AG an das Finanzamt abgeführt und über die LStA gemeldet. Drei Hauptvarianten in §§ 40–40b EStG.

**Überblick (vereinfacht):**

| § | Satz | Typischer Anwendungsfall |
|---|---|---|
| **§ 40 Abs. 1 EStG** | 25 % oder individuell (antragspflichtig beim FA) | Sammelsteueranmeldungen, besondere Anlässe |
| **§ 40 Abs. 2 EStG** | **25 %** | Betriebsveranstaltungen > 110 € Freibetrag, Mahlzeitengestellung, Erholungsbeihilfen |
| **§ 40 Abs. 2 S. 2 EStG** | **15 %** | Fahrkostenzuschüsse zwischen Wohnung und Arbeitsstätte |
| **§ 40a Abs. 1 EStG** | **25 %** | Kurzfristige Beschäftigung |
| **§ 40a Abs. 2 EStG** | **2 %** einheitliche Pauschsteuer | **Minijob** (inkl. LSt + SolZ + KiSt) |
| **§ 40a Abs. 2a EStG** | **20 %** | Minijob ohne RV-Pauschale |
| **§ 40b EStG** | **20 %** | Direktversicherung, Pensionskassen (Altfälle bis 2004) |

Die Pauschalierung ist **optional** (Wahlrecht des AG) in allen Fällen außer § 40a Abs. 2 (Minijob mit 2 % — faktisch Regelfall, aber rechtlich ebenfalls wählbar).

### Rechtsgrundlage
- **§ 40 EStG** — Pauschalierung in besonderen Fällen
- **§ 40a EStG** — Pauschalierung bei Teilzeit-/Aushilfskräften (Minijob + kurzfristige Beschäftigung)
- **§ 40b EStG** — Pauschalierung bei Direktversicherungen (rückwirkend auf 2004 und früher abgeschlossene Verträge)
- § 41a Abs. 1 EStG — Pflicht zur Abführung in der LStA
- § 40 Abs. 3 EStG — Pauschsteuer ist **AG-Schuld** (Rechtsgrundlage für "AG trägt")

**Verwandte Begriffe:**
- [Lohnsteuer (LSt)](#2-lohnsteuer-lst) — reguläre, individuelle LSt; Pauschsteuer ist Alternative
- [Minijob](#15-minijob--geringfügige-beschäftigung) — Haupt-Anwendungsfall der 2 %-Pauschsteuer
- [LStA](./04-steuer-meldungen.md#20-lohnsteuer-anmeldung-lsta) — Pauschsteuer wird **gemeinsam** mit regulärer LSt über LStA gemeldet (aber in separatem Feld)
- [Bruttolohn](#1-bruttolohn) — pauschalversteuerte Lohnbestandteile sind für AN netto, für AG brutto + Pauschsteuer
- **Betriebsveranstaltung (§ 19 Abs. 1 Nr. 1a EStG)** — Freibetrag 110 €/Veranstaltung, darüber ist Pauschalierung nach § 40 Abs. 2 EStG möglich
- **Fahrkostenzuschuss / Job-Ticket** — typischer § 40 Abs. 2 S. 2-Fall (15 %)

**Verwendung im Code:**
- `payroll_entries.pauschsteuer_amount` — getrennt von `lst_amount` ausgewiesen
- `src/domain/payroll/taxes/pauschsteuer/` (geplant Sprint 22+) — eigenes Modul, **nicht** in regulärer LSt-Pipeline
- `wage_components.pauschal_rule` — Enum-Feld: `none | §40(1) | §40(2) | §40(2s2) | §40a(1) | §40a(2) | §40a(2a) | §40b`
- **Algorithmus-Logik:** basierend auf `pauschal_rule` des jeweiligen Lohnbestandteils wird die Pauschsteuer mit dem Pauschsatz berechnet und SEPARAT vom LSt-Brutto gehalten
- **Meldung:** Pauschsteuer-Beträge gehen in Position 22a (LStA) — separat von Position 22 (regulärer LSt)
- **Invariante:** Ein Lohnbestandteil MUSS eindeutig entweder regulär versteuert ODER pauschalversteuert werden — nicht beides. UI-Radio-Button-Logik.

**Nicht verwechseln mit:**
- **Reguläre LSt** — individuell nach ELStAM; AN trägt; abgerechnet über Klassenalgorithmus
- **SV-freier Lohnbestandteil** — z. B. Direktversicherung bis 4 % BBG RV (§ 3 Nr. 63 EStG); ist **steuer**-frei für AN und AG, nicht **pauschal**-versteuert
- **Steuerfreibetrag nach § 3 EStG** — echte Steuerfreiheit (nicht nur Übernahme durch AG); kein Pauschsatz
- **Besteuerung durch AN-Jahresveranlagung** — Pauschalversteuerung schließt AN-Veranlagung für diese Bestandteile aus; Einnahmen bleiben **außerhalb** des zvE des AN

**Anmerkungen / Edge-Cases:**
- **SV-Behandlung pauschalversteuerter Lohnbestandteile:** Variiert je Norm. § 40a(2) Minijob → SV-frei für AN; § 40(2) Betriebsveranstaltung → SV-frei (§ 1 Abs. 1 Nr. 3 SvEV); § 40 Abs. 2 S. 2 Fahrkosten → **SV-pflichtig, aber steuerfrei** (Abweichung!). Eine Pauschsteuer bedeutet NICHT automatisch SV-Freiheit — muss pro Vorschrift entschieden werden.
- **Rückwirkende Pauschalierung:** Teilweise möglich (§ 40 Abs. 2 S. 1 Nr. 2 EStG) — z. B. nachträgliche Pauschalierung einer Betriebsveranstaltung bei nachträglicher Entdeckung. Steuerberater-Domäne.
- **Nettolohn-Wirkung:** Der AN erhält den Lohnbestandteil **brutto = netto** (soweit pauschalversteuert und SV-frei). In der Lohnabrechnung trotzdem auszuweisen.
- **AN-Erstattung der Pauschsteuer verboten:** Zwischen AG und AN darf KEINE Rückerstattung der Pauschsteuer vereinbart werden — das würde die Pauschalierung faktisch durch reguläre AN-Besteuerung ersetzen und wäre ein verdeckter Fortsbestand (§ 40 Abs. 3 S. 2 EStG).
- **§ 40b EStG (Direktversicherung-Altfälle):** Gilt nur für Verträge, die vor dem 01.01.2005 abgeschlossen wurden. Neuverträge laufen über § 3 Nr. 63 EStG (andere Systematik).

---

## 18. Umlageverfahren (U1, U2, U3)

| Feld | Inhalt |
|---|---|
| **Deutsch (primär)** | Umlageverfahren (U1, U2, U3) |
| **Synonyme (DE)** | Lohnfortzahlungsumlagen, Arbeitgeberumlagen |
| **Arabisch** | أنظمة المساهمات على صاحب العمل (ثلاثة رسوم يدفعها صاحب العمل وحده عبر قنوات الراتب: U1 لتعويض مرض موظفي الشركات الصغيرة، و U2 لحماية الأمومة لجميع الشركات، و U3 لإعسار صاحب العمل الذي تديره وكالة العمل الاتحادية) |
| **Englisch (Code-Kontext)** | `umlage` / `umlagen_u1_u2_u3` |
| **Kategorie** | AG-Zusatzbeitrag / Lohnneben-Kosten |
| **Status** | FEST |
| **Aufgenommen am** | 2026-04-22, Terminology-Sprint 1 |

### Definition
Drei gesetzlich verpflichtende **Umlagen des Arbeitgebers** zu Ausgleichsfonds, die zwar technisch über die Lohnabrechnung laufen (und über die KV-Einzugsstelle abgerechnet werden), aber **ausschließlich vom Arbeitgeber getragen** werden. Sie sind **kein Arbeitsentgelt-Abzug** beim Arbeitnehmer, erscheinen aber als **AG-Lohnnebenkosten** und sind zwingend in der Gesamtaufwandsbetrachtung (Gesamtkosten AG) zu berücksichtigen.

**Überblick:**

| Umlage | Zweck | AG-Pflicht | Typischer Satz |
|---|---|---|---|
| **U1** | Erstattung der Lohnfortzahlung im Krankheitsfall (nach EFZG) | **Nur Betriebe bis 30 regelmäßig beschäftigte AN** (§ 3 AAG) | **0,9–4,0 %** (je Krankenkasse und gewählter Erstattungsstufe) |
| **U2** | Erstattung bei Mutterschaftsleistungen (Mutterschaftsgeld, Beschäftigungsverbot) | **Alle Betriebe**, unabhängig von Größe | **0,2–0,8 %** (je Kasse) |
| **U3** | Finanzierung des Insolvenzgeldes der BA | **Alle Betriebe** | **0,06–0,09 %** (bundeseinheitlich, jährlich durch BMAS festgelegt) |

**Einzugsstellen:**
- **U1, U2:** Krankenkasse des Arbeitnehmers (nicht Minijob-Zentrale!). Bei Minijobs: Minijob-Zentrale.
- **U3:** ebenfalls Krankenkasse als technische Einzugsstelle; Empfänger ist aber die BA (Bundesagentur für Arbeit).

### Rechtsgrundlage
- **Aufwendungsausgleichsgesetz (AAG)** vom 22.12.2005 — Grundlage U1 und U2
- § 1 AAG — Geltungsbereich (U1-Pflicht bei ≤ 30 AN)
- § 7 AAG — Durchführung und Umlagetragung
- **§ 358 SGB III** — Insolvenzgeld-Umlage U3
- § 359 SGB III — Umlage-Verfahren
- Umlagesatz-Verordnung des BMAS (jährlich, für U3)

**Verwandte Begriffe:**
- [Sozialversicherung (SV)](#5-sozialversicherung-sv) — Umlagen laufen **neben** den SV-Beiträgen, sind aber kein Teil davon
- [Krankenversicherung (KV)](#6-krankenversicherung-kv) — Kassen als Einzugsstellen für U1, U2
- [Arbeitslosenversicherung (ALV)](#8-arbeitslosenversicherung-alv) — U3 fließt an die BA, technisch über KV
- [Minijob](#15-minijob--geringfügige-beschäftigung) — Umlagen bei Minijob über Minijob-Zentrale
- **Lohnfortzahlungsgesetz (EFZG)** — materielles Recht, AAG regelt nur Finanzierung
- **Insolvenzgeld (§§ 165 ff. SGB III)** — Leistung, die durch U3 finanziert wird

**Verwendung im Code:**
- `src/domain/payroll/umlagen/` (geplant Sprint 22+) — **eigenständige Pipeline**, NICHT Teil der AN-SV-Berechnung
- `payroll_entries.u1_amount`, `u2_amount`, `u3_amount` — getrennte AG-Felder (kein AN-Pendant!)
- `unternehmen.anzahl_regelmaessig_beschaeftigte` — bestimmt U1-Pflicht (Schwellenwert 30 gemäß AAG)
- `unternehmen.u1_erstattungsstufe` — Arbeitgeber wählt Erstattungssatz (40 %, 60 %, 80 %), davon hängt Umlagesatz ab
- `krankenkassen.u1_saetze`, `u2_saetze` — kassenindividuell, Teil des Krankenkassen-Stammdatensatzes
- `beitragssaetze_jahr.u3_satz` — bundeseinheitlich, jährlich aktualisiert
- **Invariante:** Umlagen erscheinen in der `kosten_ag`-Aufsummierung, aber **nicht** im `nettolohn`-Abzugsblock. Falsche Zuordnung = Lohnabrechnungsbug.
- **Meldung:** Umlagen werden über den **Beitragsnachweis** an die Einzugsstelle gemeldet, NICHT über DEÜV-Meldungen

**Nicht verwechseln mit:**
- **SV-Beiträge** — paritätisch AG/AN; Umlagen sind AG-only
- **Lohnfortzahlung** selbst — materiell vom AG an den AN gezahlt (EFZG); U1 ist nur die **Finanzierung der Erstattung** durch Ausgleichsfonds
- **Mutterschaftsgeld** — wird von der Kasse gezahlt, nicht vom AG; U2 finanziert diese Fonds-Leistung
- **Insolvenzgeld** — Leistung der BA an AN bei AG-Insolvenz; U3 ist die Finanzierung aus AG-Umlagen

**Anmerkungen / Edge-Cases:**
- **30-AN-Schwelle U1-Pflicht:** Die Zählung folgt speziellen Regeln — Teilzeitkräfte werden anteilig gezählt (§ 3 Abs. 1 S. 2 AAG), Auszubildende werden nicht mitgezählt. **Schwellenüberschreitung** unterjährig: die Pflicht endet mit Jahreswechsel, nicht sofort.
- **U1-Erstattungsstufen:** AG kann wählen zwischen niedrigem Umlagesatz + niedriger Erstattung (40–60 %) oder höherem Satz + voller Erstattung (80 %). Wirtschaftliche Abwägung, bei Kleinbetrieben relevant.
- **U3-Änderungen:** Der Satz wird mehrfach jährlich angepasst (zuletzt fiel er 2023 → 0,06 %, könnte 2026 erneut ändern). Jährlicher Abgleich mit BMAS-Verordnung pflichtig.
- **Minijob-Umlagen:** Minijob-Zentrale erhebt Pauschsätze (U1 und U2 fest, U3 analog). Bei Privathaushalts-Minijob (§ 8a SGB IV) reduzierte Sätze.
- **Freistellungsphasen / Elternzeit:** Kein Entgelt → keine Umlagen in dem Monat; bei anteiligem Entgelt anteilige Umlagen.
- **AG-Kosten-Hochrechnung:** Umlagen sind klein (unter 1 % kumuliert), aber obligat; ihre Auslassung in Angeboten oder Kostenkalkulationen führt zu systematisch zu niedrigen AG-Kostenschätzungen von 0,5–1,5 %.

---

## 19. Versicherungsnummer (VSNR)

| Feld | Inhalt |
|---|---|
| **Deutsch (primär)** | Versicherungsnummer |
| **Synonyme (DE)** | VSNR (Abkürzung, bevorzugt), Rentenversicherungsnummer, RV-Nummer, SV-Nummer (umgangssprachlich) |
| **Arabisch** | الرقم التأميني للموظف (معرّف إلزامي من 12 خانة يُصدره Deutsche Rentenversicherung مع بدء أول عمل ويُرافق الموظف مدى الحياة؛ يُستخدم في إبلاغات DEÜV و ELStAM؛ بنيته: منطقة الإصدار + تاريخ الميلاد + حرف اسم العائلة + تسلسل + رمز الجنس + خانة تحقّق) |
| **Englisch (Code-Kontext)** | `sv_number` (Datenbank-Feld), `vsnr` |
| **Kategorie** | Datentyp / Identifier |
| **Status** | FEST |
| **Aufgenommen am** | 2026-04-22, Terminology-Sprint 1 |

### Definition
Die vom Deutschen Rentenversicherungsträger (meist DRV Bund oder DRV Regional) vergebene, **lebenslang gültige 12-stellige Identifikationsnummer** eines gesetzlich Sozialversicherten. Primäres Identifikationsmerkmal in allen SV-bezogenen Verfahren: DEÜV-Meldungen, Beitragsnachweise, ELStAM-Verknüpfung (in Verbindung mit IdNr), Rentenauskünfte. Die VSNR bleibt **unverändert bei Namenswechsel, Umzug oder Wechsel der Krankenkasse**.

**Struktur (12 Zeichen, Bereichs-Format nach § 147 SGB VI):**

```
Position 1–2    Bereichsnummer (Regional-Code der Vergabestelle)
Position 3–8    Geburtsdatum im Format TTMMJJ
Position 9      Anfangsbuchstabe des Geburtsnamens (A–Z)
Position 10–11  Seriennummer (00–49 männlich, 50–99 weiblich)
Position 12     Prüfziffer (mod-10-Algorithmus mit gewichteter Summe)
```

**Beispiel:** `15 220475 M 03 4` → Bereich 15, geboren 22.04.1975, Name beginnt mit M, männlich (03), Prüfziffer 4

### Rechtsgrundlage
- **§ 147 SGB VI** — Versicherungsnummer, Vergabe, Struktur
- §§ 18f–18h SGB IV — allgemeine Regelungen
- § 196 SGB VI — Zuständigkeit für Vergabe (DRV)
- **Versicherungsnummernverordnung (VNV)** — detaillierte Aufbau-Regeln und Prüfziffer-Algorithmus

**Verwandte Begriffe:**
- [Rentenversicherung (RV)](#7-rentenversicherung-rv) — Ausstellerin der VSNR
- [Sozialversicherung (SV)](#5-sozialversicherung-sv) — die VSNR ist zentrale Kennung für alle vier Zweige
- [DEÜV-Meldeverfahren](#12-deüv-meldeverfahren) — jede Meldung MUSS VSNR enthalten
- [ELStAM](#11-elstam--elektronische-lohnsteuer-abzugsmerkmale) — nutzt parallel die **Steuer-IdNr** (§ 139b AO), **nicht** die VSNR. Achtung: zwei separate 11- bzw. 12-stellige Nummern.
- **Steuer-Identifikationsnummer (IdNr)** — 11-stellig, persönlich, für Steuer-Verfahren (§ 139b AO) — NICHT die VSNR
- **Betriebsnummer (BBNR)** — 8-stellig, Arbeitgeber-Kennung; Gegenpol zur VSNR auf AG-Seite

**Verwendung im Code:**
- `employees.sv_number` — `CHAR(12)`, Pflichtfeld (NULLABLE nur für AN ohne deutsche Vergabe — sehr seltener Sonderfall)
- `src/domain/validators/versicherungsnummerValidator.ts` (geplant Sprint 22+) — **Prüfziffer-Validierung** (mod-10 mit Gewichtung 2-1-2-5-7-1-2-1-2-1-2-1 oder ähnlich laut VNV)
- **Validation-Logik mehrstufig:**
  1. Länge = 12, alle Ziffern außer Position 9 (Buchstabe)
  2. Geburtsdatum Position 3–8 ist valides Datum
  3. Seriennummer Position 10–11 konsistent mit `employees.gender`
  4. Prüfziffer = berechnete Prüfziffer nach VNV-Algorithmus
- **Fehlerfall:** AN ohne VSNR → Beim ersten Arbeitsverhältnis in Deutschland vergibt die DRV automatisch eine Nummer nach Antrag des AG (DEÜV-Anmeldung ohne VSNR, DRV erstellt neue Nummer und meldet sie zurück). UI-Workflow für diesen Fall pflichtig.
- **GoBD:** VSNR ist personenbezogenes Ordnungskriterium aller SV-Akten → Archivierungspflicht für die gesamte Beschäftigungsdauer + Nachlauf

**Nicht verwechseln mit:**
- **Steuer-IdNr (IdNr)** — 11-stellig, separat, für Steuerrecht (§ 139b AO); wird in ELStAM verwendet, nicht die VSNR
- **Steuernummer** — 10/11/13-stellig, vom Finanzamt, für Unternehmen/Betrieb; siehe [04-steuer-meldungen.md #14](./04-steuer-meldungen.md#14-steuernummer)
- **Krankenversichertennummer (KVNR)** — 10-stellig, von der Krankenkasse auf der Gesundheitskarte (eGK); seit 2015 bundeseinheitlich nach § 290 SGB V, NICHT VSNR
- **Wirtschafts-IdNr (W-IdNr)** — im Aufbau (§ 139c AO), für Unternehmen
- **Betriebsnummer (BBNR)** — 8-stellig, für Arbeitgeber

**Anmerkungen / Edge-Cases:**
- **VSNR-Anzahl pro Person:** Eine Person erhält eine einzige VSNR **lebenslang**. Wechsel der Vergabestelle (Umzug) oder Kassenwechsel ändern sie NICHT. Doppelvergabe ist Fehler der DRV → Korrektur via Versicherungsnummern-Korrekturverfahren.
- **Namensänderung:** Position 9 (Geburtsnamen-Initiale) bleibt auch bei Heirat unverändert — der **Geburtsname** zählt, nicht der aktuelle Name.
- **Vor 2005 vergebene Nummern:** Haben teilweise abweichende Strukturelemente (insb. andere Seriennummer-Logik). Der Validator muss tolerante sein ("old-style VSNR" akzeptieren).
- **Geschlechts-Kodierung (Pos. 10–11):** 00–49 = männlich, 50–99 = weiblich. **Problematisch bei nichtbinären AN** — die DRV arbeitet an Anpassungen; aktuelle Software muss entweder die binäre Vorgabe respektieren oder eine Übergangs-Lösung dokumentieren.
- **VSNR für ausländische AN:** Bei erstmaliger Beschäftigung in Deutschland wird eine VSNR auf Basis der DEÜV-Anmeldung vergeben, auch wenn der AN kein deutsches Geburtsland hat. Bereichsnummer reflektiert die DRV-Vergabestelle, nicht die Herkunft.
- **Pseudonymisierung für Analyse-Zwecke:** Die VSNR darf bei interner Analytik nicht als Join-Key exponiert werden (personenbezogenes Merkmal nach DSGVO Art. 4 Nr. 5). Pseudonymisierung via separaten `employee_hash` empfohlen.

---

## 20. Lohnabrechnung / Entgeltabrechnung

| Feld | Inhalt |
|---|---|
| **Deutsch (primär)** | Lohnabrechnung / Entgeltabrechnung |
| **Synonyme (DE)** | Gehaltsabrechnung, Lohnzettel (umgangssprachlich, österr.), Verdienstabrechnung |
| **Arabisch** | قسيمة الراتب الشهرية الرسمية (الوثيقة الإلزامية التي يُسلّمها صاحب العمل للموظّف مع كل دفع راتب وفق § 108 GewO، وتُبيّن تفصيلياً كل مكوّنات الأجر الإجمالي والاقتطاعات الضريبية والتأمينية والمبلغ الصافي المحوَّل؛ تمثّل المُخرَج النهائي لعملية احتساب الراتب وتُحفَظ إلزامياً لدى صاحب العمل لمدة ست سنوات وفق § 147 AO) |
| **Englisch (Code-Kontext)** | `payslip` / `wage_statement` / `abrechnung` |
| **Kategorie** | Dokument / Output-Artefakt |
| **Status** | FEST |
| **Aufgenommen am** | 2026-04-22, Terminology-Sprint 1 |

### Definition
Das gesetzlich vorgeschriebene **Dokument**, mit dem der Arbeitgeber dem Arbeitnehmer bei jeder Lohnzahlung die **vollständige Zusammensetzung des Arbeitsentgelts** nachweist. Pflicht nach **§ 108 GewO** (Gewerbeordnung). Gleichzeitig ist die Abrechnung ein **buchhalterischer Beleg** i. S. d. GoBD — unveränderlich zu archivieren und jederzeit reproduzierbar. Die Abrechnung ist der **End-Output** der gesamten Payroll-Pipeline: sie aggregiert Ergebnisse aller in diesem Dokument dokumentierten Einzelberechnungen.

**Pflichtinhalte nach § 108 Abs. 1 GewO + Entgeltbescheinigungsverordnung (EBV):**

1. **Angaben zum AG** — Name, Anschrift, Betriebsnummer
2. **Angaben zum AN** — Name, Anschrift, Geburtsdatum, VSNR, Steuer-IdNr, Steuerklasse, Konfession, Kinderfreibeträge, Krankenkasse
3. **Abrechnungszeitraum**
4. **Bruttoanteile nach Art** (Grundlohn, Zulagen, Zuschläge, Sachbezüge, Einmalzahlungen)
5. **Steuerabzüge** (LSt, KiSt, SolZ) — je einzeln
6. **Sozialversicherungs-Abzüge** (KV, RV, ALV, PV) — je einzeln
7. **Nettolohn + Auszahlungsbetrag** (bei Pfändung unterschiedlich)
8. **Arbeitszeit-Angaben** (Arbeitsstunden, SV-Tage)
9. **Summen laufend und aufgelaufen** (Jahr-bis-dato-Werte)
10. **AG-Beiträge zur Information** (obligat seit EBV 2013)

**Form:**
- **Textform nach § 126b BGB** genügt — d. h. auch elektronisch per E-Mail oder als PDF-Download im Mitarbeiter-Portal
- Eine **Unterzeichnung** ist nicht erforderlich (keine Schriftform)
- Die Ausgabe **monatlich** mit der Zahlung ist Regelfall

### Rechtsgrundlage
- **§ 108 GewO** — Abrechnung des Arbeitsentgelts (Kernvorschrift)
- **Entgeltbescheinigungsverordnung (EBV)** vom 19.12.2012 — Detailinhalte
- § 126b BGB — Textform
- § 147 AO i. V. m. § 257 HGB — **Aufbewahrungsfrist 6 Jahre** für AG
- GoBD Rz. 36–53 — Beleg-Eigenschaft und Unveränderbarkeit
- § 8 AAG — Erleichterte Abrechnungsform bei haushaltsnahen Beschäftigungen

**Verwandte Begriffe:**
- [Bruttolohn](#1-bruttolohn), [Nettolohn](#10-nettolohn) — Kopf- und Fußzeile der Abrechnung
- [LSt](#2-lohnsteuer-lst), [KiSt](#3-kirchensteuer-kist), [SolZ](#4-solidaritätszuschlag-solz) — Steuerblock
- [KV](#6-krankenversicherung-kv), [RV](#7-rentenversicherung-rv), [ALV](#8-arbeitslosenversicherung-alv), [PV](#9-pflegeversicherung-pv) — SV-Block
- [Umlagen U1/U2/U3](#18-umlageverfahren-u1-u2-u3) — separater AG-Block (informatorisch)
- **Lohnsteuerbescheinigung (§ 41b EStG)** — Jahres-Output an das Finanzamt, **nicht** die Monatsabrechnung
- [LStA](./04-steuer-meldungen.md#20-lohnsteuer-anmeldung-lsta) — parallele Monatsmeldung an das Finanzamt
- [Beleg](./02-buchhaltung.md#17-beleg) — die Lohnabrechnung IST ein Beleg i. S. d. GoBD
- **DATEV Lohn und Gehalt** — führende kommerzielle Lohnsoftware, Benchmark für Output-Formate
- **Pfändungsprotokoll** — separates Dokument bei Lohnpfändung, ergänzend zur Abrechnung

**Verwendung im Code:**
- `src/domain/payroll/abrechnung/` (geplant Sprint 22+) — **Output-Generator**, letztes Glied der Pipeline
- **Generierungs-Pipeline:**
  1. `payroll_entries` (alle Einzelberechnungen) → zusammengeführt
  2. `src/domain/payroll/abrechnung/builder/` → strukturiertes `AbrechnungDto`
  3. `src/domain/payroll/abrechnung/renderer/` → PDF-Generator (empfohlen: eigene Template-Engine, kein OSS-Tool mit Bindungen)
- **Template-Struktur:** empfehlenswert jährlich versionierte Templates (Änderungen der Pflichtinhalte durch BMAS möglich)
- **Ausgabeformate:**
  - PDF/A-3 (archivrobust, GoBD-konform)
  - elektronische Bereitstellung via Mitarbeiter-Portal oder E-Mail
  - Druck-Ausgabe auf Anforderung
- `abrechnungen` — Log-Tabelle mit Metadaten jeder erstellten Abrechnung (`mandant`, `employee`, `zeitraum`, `erstellt_am`, `pdf_hash`, `versand_status`)
- **Hash-Chain-Integration:** jede finalisierte Abrechnung ist Eingabe in das projektweite Audit-Hash-System ([08-technik-architektur.md](./08-technik-architektur.md) geplant)
- **Invariante:** Eine einmal finalisierte Abrechnung darf **nicht mehr geändert** werden (Unveränderbarkeit GoBD Rz. 107). Korrekturen erfolgen nur durch **Storno + Neuerstellung**, beide Versionen bleiben im Archiv.

**Nicht verwechseln mit:**
- **Lohnsteuerbescheinigung (§ 41b EStG)** — **Jahres**-Dokument an das Finanzamt via ELStAM-eTIN-Verfahren, einmal pro Jahr und AN; nicht die Monatsabrechnung
- **Arbeitsvertrag** — individualrechtliche Grundlage, ändert sich selten; die Abrechnung führt ihn monatlich aus
- **Beitragsnachweis** — Summen-Abrechnung an die Krankenkasse (Einzugsstelle), kein Dokument für den AN
- **Entgeltbescheinigung für Behörden** — z. B. für Wohngeld, Bürgergeld, Unterhalt; ähnlich, aber eigene Standardisierung (EBV)
- **Bescheinigung nach § 312 SGB III** — Ausweisung des zuletzt erhaltenen Entgelts bei Arbeitslosigkeit

**Anmerkungen / Edge-Cases:**
- **Elektronische Ausgabe:** Seit 2014 ausdrücklich zulässig (§ 108 Abs. 1 S. 2 GewO); eine Klarstellung 2023 hat Details zur Form präzisiert. Zustimmung des AN zur elektronischen Ausgabe ist **nicht mehr erforderlich**, aber Zugriffsmöglichkeit muss gewährleistet sein (Mitarbeiter-Portal, Download-Option, ausdruckfähig).
- **Haushaltshilfe-Sonderform (§ 8a SGB IV):** Vereinfachtes Haushaltsscheck-Verfahren mit eigener Abrechnungsform durch die Minijob-Zentrale; § 108 GewO-Pflicht ist stark reduziert.
- **Abrechnung bei Nullauszahlung:** Auch wenn kein Nettolohn auszuzahlen ist (z. B. Krankheit, Elternzeit, vollständiger Pfändung), MUSS eine Abrechnung erstellt werden, um SV-Zeiten und Beitragsabgaben zu dokumentieren.
- **Nachträgliche Korrekturen:** Storno der Originalabrechnung + Neuberechnung; beide Versionen sind archivpflichtig. Bei SV-Korrekturen zudem DEÜV-Nachmeldung über entsprechende Meldungsgründe notwendig.
- **Aufbewahrungsfrist des AN:** 4 Jahre (für ESt-Zwecke) bis 10 Jahre (bei Kapitalanlagen oder Verlustvorträgen). Der AG bewahrt regulär 6 Jahre auf, bei steuerrelevanten Belegen (Lohnkonten) 10 Jahre (§ 147 Abs. 3 AO).
- **Mehrsprachigkeit:** Gesetzlich nicht vorgeschrieben, aber praktisch relevant bei internationalen Belegschaften. Deutsches Original bleibt rechtsverbindlich; Übersetzungen können informatorisch beigelegt werden.
- **GoBD-Reproduzierbarkeit:** Die Abrechnung MUSS jederzeit aus den archivierten Einzelwerten **byte-genau** reproduzierbar sein (gleiche Werte, gleiches Template). Das bedeutet: Template-Versionen müssen archiviert werden, nicht nur die Output-PDFs.

---

> **Modul-Footer**
> **Nächstes Modul:** [04 · Steuer-Meldungen](./04-steuer-meldungen.md) · **Übersicht:** [INDEX.md](./INDEX.md)
> **Terminology-Sprint 1 · Modul 03 · Stand 2026-04-23**
