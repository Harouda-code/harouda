# 04 · Steuer-Meldungen — Umsatzsteuer, USt-IdNr, UStVA, ZM

**Inhalt:** Alle Begriffe rund um die Umsatzsteuer (USt) — vom Gesetz
(UStG) über Vorsteuer, USt-IdNr, die zwei Bestätigungs-Systeme (BZSt,
VIES), die laufenden Meldungen (UStVA, ZM) bis zu den wichtigsten
Sonderfällen (Kleinunternehmer § 19 UStG, Reverse-Charge § 13b UStG).
Darüber hinaus die Übermittlungs-Infrastruktur (ELSTER, ERiC), die
verfahrensrechtliche Unterscheidung Steueranmeldung/Steuererklärung,
die elektronische Bilanzübermittlung (E-Bilanz, XBRL, Kern-Taxonomie)
sowie die Ertragsteuern Körperschaftsteuer (KSt), Gewerbesteuer (GewSt)
und die Lohnsteuer-Anmeldung (LStA).

Baut auf auf [01-grundlagen.md](./01-grundlagen.md) (HGB, AO, GoBD) und
[02-buchhaltung.md](./02-buchhaltung.md) (Konten, Buchungssatz, Journal).

---

## Inhaltsverzeichnis

1. [UStG — Umsatzsteuergesetz](#1-ustg-umsatzsteuergesetz)
2. [Umsatzsteuer (USt)](#2-umsatzsteuer-ust)
3. [Vorsteuer](#3-vorsteuer)
4. [USt-IdNr — Umsatzsteuer-Identifikationsnummer](#4-ust-idnr-umsatzsteuer-identifikationsnummer)
5. [BZSt — Bundeszentralamt für Steuern](#5-bzst-bundeszentralamt-für-steuern)
6. [VIES — VAT Information Exchange System](#6-vies-vat-information-exchange-system)
7. [UStVA — Umsatzsteuer-Voranmeldung](#7-ustva-umsatzsteuer-voranmeldung)
8. [ZM — Zusammenfassende Meldung](#8-zm-zusammenfassende-meldung)
9. [Kleinunternehmer (§ 19 UStG)](#9-kleinunternehmer-§-19-ustg)
10. [Reverse-Charge-Verfahren (§ 13b UStG)](#10-reverse-charge-verfahren-§-13b-ustg)
11. [ELSTER — Elektronische Steuererklärung](#11-elster--elektronische-steuererklärung)
12. [ERiC — ELSTER Rich Client](#12-eric--elster-rich-client)
13. [Steueranmeldung / Steuererklärung (Gegenüberstellung)](#13-steueranmeldung--steuererklärung-gegenüberstellung)
14. [Steuernummer](#14-steuernummer)
15. [E-Bilanz](#15-e-bilanz)
16. [XBRL](#16-xbrl)
17. [Kern-Taxonomie](#17-kern-taxonomie)
18. [Körperschaftsteuer (KSt)](#18-körperschaftsteuer-kst)
19. [Gewerbesteuer (GewSt)](#19-gewerbesteuer-gewst)
20. [Lohnsteuer-Anmeldung (LStA)](#20-lohnsteuer-anmeldung-lsta)

---

## 1. UStG — Umsatzsteuergesetz

| Feld | Inhalt |
|---|---|
| **Deutsch (primär)** | Umsatzsteuergesetz |
| **Synonyme (DE)** | UStG (Abkürzung, im Code und Text bevorzugt) |
| **Arabisch** | قانون ضريبة القيمة المضافة الألماني (القانون الاتحادي الذي ينظم فرض ضريبة المبيعات — Umsatzsteuer — على توريدات السلع والخدمات في ألمانيا، وآليات الخصم والاسترداد، ويشمل القواعد الخاصة بالتجارة داخل الاتحاد الأوروبي) |
| **Englisch (Code-Kontext)** | — (Eigenname, nicht übersetzt) |
| **Kategorie** | Rechtsbegriff / Gesetz |
| **Status** | FEST |
| **Aufgenommen am** | 2026-04-22, Terminology-Sprint 1 |

**Definition:**
Bundesgesetz, das die Umsatzsteuer (Mehrwertsteuer) auf Warenlieferungen und Dienstleistungen im Inland und den innergemeinschaftlichen Handel in der EU regelt. Umsatzsteuer ist eine **indirekte Steuer** — der Unternehmer zieht sie vom Endkunden ein und führt sie ans Finanzamt ab (nach Abzug der von ihm selbst gezahlten Vorsteuer).

**Rechtsgrundlage:**
- UStG vom 26.11.1979 (BGBl. I S. 1953), geltende Fassung jährlich aktualisiert
- Nationale Umsetzung der **EU-Mehrwertsteuer-Systemrichtlinie 2006/112/EG**
- UStAE (Umsatzsteuer-Anwendungserlass) — Verwaltungsauffassung (bindet die Finanzverwaltung)
- Für dieses Projekt besonders relevant:
  - § 1 UStG — Steuerbare Umsätze
  - § 3a UStG — Ort der sonstigen Leistung
  - § 3c UStG — Fernverkauf (distance selling)
  - § 4 UStG — Steuerbefreiungen (z. B. Ausfuhrlieferungen, innergemeinschaftliche Lieferungen)
  - § 12 UStG — Steuersätze (19 % Regelsatz, 7 % ermäßigt)
  - § 13b UStG — [Reverse-Charge-Verfahren](#10-reverse-charge-verfahren-§-13b-ustg)
  - § 14 UStG — Rechnungspflichtangaben
  - § 15 UStG — [Vorsteuerabzug](#3-vorsteuer)
  - § 18 UStG — Besteuerungsverfahren + [UStVA](#7-ustva-umsatzsteuer-voranmeldung)
  - § 18a UStG — [Zusammenfassende Meldung (ZM)](#8-zm-zusammenfassende-meldung)
  - § 18e UStG — Bestätigungsverfahren [USt-IdNr](#4-ust-idnr-umsatzsteuer-identifikationsnummer)
  - § 19 UStG — [Kleinunternehmer-Regelung](#9-kleinunternehmer-§-19-ustg)

**Verwandte Begriffe:**
- [Umsatzsteuer (USt)](#2-umsatzsteuer-ust) — die vom UStG geregelte Steuer
- [Vorsteuer](#3-vorsteuer) — Gegenstück des Vorsteuerabzugs
- [HGB](./01-grundlagen.md#3-handelsgesetzbuch-hgb) — unabhängiges Rechtsgebiet (Handelsrecht ≠ Steuerrecht)
- [AO](./01-grundlagen.md#2-abgabenordnung-ao) — Verfahrensrecht (UStG regelt das Materielle, AO das Verfahrensrechtliche)

**Verwendung im Code:**
- Häufig in JSDoc und Kommentaren referenziert, z. B. `src/api/ustidVerifications.ts` verweist auf § 18e UStG
- `src/domain/ustva/` — UStVA-Builder nach § 18 UStG
- `src/domain/elster/` — ZM-Builder nach § 18a UStG (Sprint 14)
- Konten-Mapping SKR03/04 für USt-Kategorien orientiert sich strikt am UStG
- Dokumentation: Sprint 20.A.2 Closure verweist explizit auf § 18e UStG-Nachweispflicht

**Nicht verwechseln mit:**
- **EStG (Einkommensteuergesetz)** — besteuert Einkommen natürlicher Personen, nicht Umsätze
- **KStG (Körperschaftsteuergesetz)** — besteuert Gewinne juristischer Personen
- **GewStG (Gewerbesteuergesetz)** — kommunale Zusatzsteuer auf Gewerbeerträge
- **AO** — regelt das "Wie" der Besteuerung generell, nicht das "Was" der USt-Besteuerung

**Anmerkungen / Edge-Cases:**
- UStG-Paragraphen werden im Code IMMER mit führendem § zitiert und nach Möglichkeit mit Absatz (`§ 13b Abs. 2 UStG`).
- Die enge Bindung an EU-Recht bedeutet: nationale Änderungen sind nur innerhalb des von der EU-MwSt-Richtlinie gesteckten Rahmens zulässig. Bei Konflikt gilt EU-Recht vorrangig.

---

## 2. Umsatzsteuer (USt)

| Feld | Inhalt |
|---|---|
| **Deutsch (primär)** | Umsatzsteuer |
| **Synonyme (DE)** | USt (Abkürzung), Mehrwertsteuer / MwSt (umgangssprachlich identisch — siehe „Nicht verwechseln") |
| **Arabisch** | ضريبة القيمة المضافة (الضريبة غير المباشرة التي يُحصِّلها التاجر من العميل النهائي ويُورِّدها لمصلحة الضرائب بعد خصم ضريبة المدخلات — Vorsteuer — التي دفعها هو نفسه على مشترياته) |
| **Englisch (Code-Kontext)** | VAT (Value Added Tax); im Code als `ust`-Präfix |
| **Kategorie** | Fachbegriff / Steuer-Art |
| **Status** | FEST |
| **Aufgenommen am** | 2026-04-22, Terminology-Sprint 1 |

**Definition:**
Indirekte Verbrauchssteuer auf Warenlieferungen und Dienstleistungen, die ein Unternehmer im Rahmen seiner Tätigkeit erbringt. Technisch wird sie auf den Nettopreis aufgeschlagen und vom Kunden gezahlt, aber der Unternehmer schuldet sie dem Finanzamt (minus der von ihm geleisteten [Vorsteuer](#3-vorsteuer)). Wirtschaftlich belastet sie damit den Endverbraucher.

**Steuersätze in Deutschland (Stand 2026):**

| Satz | Prozent | Anwendung (Beispiele) |
|---|---|---|
| Regelsteuersatz | **19 %** | Die meisten Waren und Dienstleistungen |
| Ermäßigter Satz | **7 %** | Lebensmittel, Bücher, ÖPNV, Beherbergung, kulturelle Leistungen |
| Nullsatz | **0 %** | Photovoltaik-Anlagen bis 30 kWp (§ 12 Abs. 3 UStG) |
| Steuerbefreit | — | Ausfuhrlieferungen, ig Lieferungen, Heilbehandlungen, Bildung etc. (§ 4 UStG) |

**Rechtsgrundlage:**
- § 1 UStG — Steuerbarkeit
- § 12 UStG — Steuersätze
- § 13 UStG — Entstehung der Steuer
- § 16 UStG — Steuerberechnung
- § 20 UStG — Ist-Besteuerung (nach vereinnahmten Entgelten) vs. Soll-Besteuerung (nach vereinbarten Entgelten)

**Verwandte Begriffe:**
- [UStG](#1-ustg-umsatzsteuergesetz) — das Gesetz
- [Vorsteuer](#3-vorsteuer) — Gegenposition beim Empfänger
- [UStVA](#7-ustva-umsatzsteuer-voranmeldung) — periodische Anmeldung
- [Kleinunternehmer](#9-kleinunternehmer-§-19-ustg) — Ausnahme von der USt-Pflicht
- [Reverse-Charge](#10-reverse-charge-verfahren-§-13b-ustg) — Sonder-Mechanismus

**Verwendung im Code:**
- SKR03-Konten für USt-Verbindlichkeit: **1770** (19 %), **1775** (7 %), **1776** (andere Sätze)
- Konfiguration pro Mandant: `clients.besteuerungsart` (Soll / Ist — § 20 UStG-Option)
- Steuersatz-Auswahl in Belegerfassung: `src/pages/BelegerfassungPage.tsx` mit Dropdown-Werten 0/7/19
- USt-Berechnung: `Money`-Wrapper, immer Decimal, niemals Float — Rundung nach § 16 Abs. 1 Satz 4 UStG (kaufmännische Rundung auf volle Cent)
- UStVA-Aggregation: `src/domain/ustva/` — ordnet Konten den UStVA-Kennziffern zu

**Nicht verwechseln mit:**
- **Mehrwertsteuer (MwSt)** — in Deutschland **umgangssprachlich gleichbedeutend** mit Umsatzsteuer. Fachlich ist "MwSt" aber ein umfassenderer EU-Begriff, der das gesamte Mehrwertsteuer-Konzept meint. Im Code + Dokumentation nutzen wir **konsequent "USt"**, nicht "MwSt".
- **Verkaufssteuer (Sales Tax, US-Stil)** — einphasig am Endverbrauch, nicht vorsteuerabzugsberechtigt; nicht mit USt vergleichbar
- **Einfuhrumsatzsteuer (EUSt)** — eigene Steuer bei Einfuhr aus Drittländern, technisch separater Vorgang (Zoll-Zuständigkeit)

**Anmerkungen / Edge-Cases:**
- **Nicht steuerbar** ≠ **steuerfrei**: Nicht-steuerbare Umsätze fallen gar nicht in den UStG-Bereich (z. B. Schadensersatz); steuerfreie Umsätze sind steuerbar, aber vom UStG begünstigt (§ 4 UStG).
- Bei steuerfreien Umsätzen **ohne** Optionsmöglichkeit ist der [Vorsteuerabzug](#3-vorsteuer) aus zugehörigen Eingangsleistungen ausgeschlossen (§ 15 Abs. 2 UStG) — wichtige Fehlerquelle.

---

## 3. Vorsteuer

| Feld | Inhalt |
|---|---|
| **Deutsch (primär)** | Vorsteuer |
| **Synonyme (DE)** | Input-USt, abziehbare Umsatzsteuer, Eingangssteuer |
| **Arabisch** | ضريبة المدخلات (ضريبة القيمة المضافة التي يدفعها التاجر على مشترياته ومصروفاته التشغيلية، ويحق له خصمها من الضريبة التي حصَّلها من عملائه — وبذلك يدفع للدولة الفرق فقط) |
| **Englisch (Code-Kontext)** | `input VAT`; im Code als `vorsteuer`-Präfix |
| **Kategorie** | Fachbegriff / Steuer-Position |
| **Status** | FEST |
| **Aufgenommen am** | 2026-04-22, Terminology-Sprint 1 |

**Definition:**
Die Umsatzsteuer, die ein Unternehmer selbst beim Einkauf von Waren und Dienstleistungen an seine Lieferanten zahlt. Unter bestimmten Voraussetzungen darf er diese **vom Finanzamt zurückfordern**, indem er sie von der von ihm selbst geschuldeten USt abzieht. Dieser Mechanismus heißt **Vorsteuerabzug** und ist der Kern des Mehrwertsteuersystems.

**Netto-Zahllast-Formel:**
```
USt-Zahllast = Σ Umsatzsteuer (aus Ausgangsumsätzen)
             − Σ Vorsteuer (aus Eingangsumsätzen)
```

**Voraussetzungen für Vorsteuerabzug (§ 15 UStG):**
- Leistung für das Unternehmen bezogen
- Ordnungsgemäße Rechnung mit allen Pflichtangaben nach § 14 UStG
- Keine Ausschlussgründe nach § 15 Abs. 2 UStG (z. B. bei steuerfreien Ausgangsumsätzen)

**Rechtsgrundlage:**
- § 15 UStG — Vorsteuerabzug
- § 14 UStG — Pflichtangaben der Rechnung (Voraussetzung)
- § 15a UStG — Vorsteuer-Berichtigung bei Nutzungsänderung
- § 14c UStG — unrichtiger / unberechtigter Steuerausweis (Konsequenzen)

**Verwandte Begriffe:**
- [UStG](#1-ustg-umsatzsteuergesetz) — Rechtsrahmen
- [Umsatzsteuer](#2-umsatzsteuer-ust) — Gegenposition
- [UStVA](#7-ustva-umsatzsteuer-voranmeldung) — hier werden beide saldiert
- [Beleg](./02-buchhaltung.md#17-beleg) / Rechnung — Voraussetzung für den Abzug
- [USt-IdNr](#4-ust-idnr-umsatzsteuer-identifikationsnummer) — notwendig für § 15 UStG bei bestimmten Umsätzen

**Verwendung im Code:**
- SKR03-Konten für Vorsteuer: **1570** (19 %), **1571** (7 %), **1572**–**1577** (weitere Kategorien inkl. ig Erwerb)
- Migration `0029_est_tags_backfill.sql` — Tag-Backfill für SKR03-Vorsteuer-Konten, damit UStVA-Mapping korrekt aggregiert
- Vorsteuer-Berechnung in Belegerfassung: bei Eingangsrechnungen wird der USt-Anteil separat auf das entsprechende Vorsteuer-Konto gebucht (Split-Buchung)
- UStVA-Kennziffern 66 (abziehbare Vorsteuer) + 61 (ig Erwerb) + 62 (§ 13b) — alle werden vom UStVA-Builder aus Vorsteuer-Konten gefüttert

**Nicht verwechseln mit:**
- **Umsatzsteuer (Output)** — was der Unternehmer an das Finanzamt schuldet; Vorsteuer ist was er sich holt
- **Lohnsteuer-Vorauszahlung** — völlig anderer Kontext (Lohn, nicht USt)
- **Einfuhrumsatzsteuer** — wird als Vorsteuer behandelt, aber zollrechtlich separat erhoben

**Anmerkungen / Edge-Cases:**
- **Nicht jede bezahlte USt ist abziehbar.** Bei teilweise steuerfreien Umsätzen muss nach § 15 Abs. 4 UStG **aufgeteilt** werden (gemischt-genutzte Eingangsleistungen). harouda-app unterstützt diese Aufteilung strukturell, nicht automatisch.
- **15a-Berichtigung:** Ändert sich die Nutzung eines Anlageguts innerhalb von 5 Jahren (10 bei Immobilien), muss die Vorsteuer anteilig berichtigt werden. Wird in harouda-app manuell durch den Steuerberater gebucht.
- **PKW mit privater Mitnutzung:** Vorsteuerabzug nur für den betrieblichen Anteil — typische Fehlerquelle.

---

## 4. USt-IdNr — Umsatzsteuer-Identifikationsnummer

| Feld | Inhalt |
|---|---|
| **Deutsch (primär)** | Umsatzsteuer-Identifikationsnummer |
| **Synonyme (DE)** | USt-IdNr (Abkürzung), UStId, VAT-ID (englisch, selten im deutschen Text) |
| **Arabisch** | رقم تعريف ضريبة القيمة المضافة (المعرِّف الأوروبي الموحَّد للشركات المسجَّلة في منظومة ضريبة المبيعات الأوروبية؛ يبدأ برمز الدولة — DE لألمانيا — ويُستخدم بشكل إلزامي في التوريدات بين دول الاتحاد الأوروبي لإثبات الوضع الضريبي للطرفين) |
| **Englisch (Code-Kontext)** | `ust_idnr` (Spaltenname), VAT ID (allgemein) |
| **Kategorie** | Rechtsbegriff / Identifikator |
| **Status** | FEST |
| **Aufgenommen am** | 2026-04-22, Terminology-Sprint 1 |

**Definition:**
Eindeutiger Identifier für umsatzsteuerpflichtige Unternehmen innerhalb der Europäischen Union. Wird benötigt für innergemeinschaftliche Lieferungen/Leistungen (B2B-EU) und für die Bestätigungsverfahren beim [BZSt](#5-bzst-bundeszentralamt-für-steuern) bzw. über [VIES](#6-vies-vat-information-exchange-system). In Deutschland auf Antrag vom BZSt vergeben (§ 27a UStG).

**Format:**
```
Ländercode (2 Buchstaben) + nationale Nummer
DE123456789  (Deutschland: immer 9 Ziffern)
ATU12345678  (Österreich: U + 8 Ziffern)
FR12345678901 (Frankreich: 11 Zeichen)
NL123456789B01 (Niederlande: 9 Ziffern + B + 2 Ziffern)
... (EU-weit unterschiedliche Formate)
```

**Rechtsgrundlage:**
- § 27a UStG — Erteilung der USt-IdNr durch BZSt
- § 18a UStG — Verwendung in der [ZM](#8-zm-zusammenfassende-meldung)
- § 18e UStG — **Bestätigungsverfahren**: einfache und qualifizierte Bestätigung (Pflicht zur Prüfung!)
- Art. 214 MwStSystRL (EU) — EU-rechtliche Grundlage

**Pflicht zur Überprüfung:**
Die USt-IdNr des Geschäftspartners **muss** bei jedem neuen B2B-EU-Geschäft und bei **Daueraufträgen periodisch** überprüft werden, sonst droht Aberkennung der Steuerfreiheit der innergemeinschaftlichen Lieferung. In harouda-app ist diese Überprüfung durchgängig tamper-evident mit Hash-Chain protokolliert (Sprint 20.B — siehe [SPRINT-20-ABSCHLUSS.md](../SPRINT-20-ABSCHLUSS.md)).

**Verwandte Begriffe:**
- [BZSt](#5-bzst-bundeszentralamt-für-steuern) — deutsche Bestätigungs-Quelle (§ 18e UStG qualifizierte Bestätigung)
- [VIES](#6-vies-vat-information-exchange-system) — EU-Bestätigungs-Quelle (grenzüberschreitende einfache Bestätigung)
- [Reverse-Charge](#10-reverse-charge-verfahren-§-13b-ustg) — häufig an USt-IdNr geknüpft
- [ZM](#8-zm-zusammenfassende-meldung) — nennt USt-IdNr jedes Empfängers
- [Debitor / Kreditor](./02-buchhaltung.md#9-debitor--kreditor) — Träger der USt-IdNr im Stammdaten-Modell

**Verwendung im Code:**
- Spalte: `business_partners.ust_idnr` (Migration 0035)
- Format-Validierung: `src/domain/partners/ustIdValidation.ts` — `validateUstIdnrFormat(value)`
- Prüfungs-Log (WORM): `public.ustid_verifications` (Migration 0037) + Hash-Chain seit Sprint 20.B (Migration 0039) — siehe [SPRINT-20-ABSCHLUSS.md](../SPRINT-20-ABSCHLUSS.md)
- Quelle-Tracking: `verification_source: 'BZST' | 'VIES'` (Migration 0038, Sprint 20.A.2)
- Router: `src/api/ustIdRouter.ts` — DE-Requester → BZSt, non-DE → VIES, Fallback-Logik
- Edge Functions: `supabase/functions/validate-ustid/` (BZSt) + `verify-ust-idnr/` (VIES)
- UI-Badge: `src/components/partners/UstIdnrStatusBadge.tsx` mit `source`-Prop (🛡️ BZSt / 🌐 VIES)

**Nicht verwechseln mit:**
- **Steuernummer** — deutsche nationale Steuernummer (Format z. B. `12/345/67890`), nicht mit USt-IdNr identisch. Jedes Unternehmen hat **beide** — Steuernummer für allgemeinen Finanzamt-Kontakt, USt-IdNr nur für EU-Geschäfte.
- **Steuer-ID** (für natürliche Personen) — 11-stellige persönliche Steueridentifikationsnummer; kein Unternehmensbezug.
- **Eori-Nummer** — Zollnummer für Zollanmeldungen, nicht USt-IdNr.
- **IBAN** — Bankkontonummer, komplett anderes Thema.

**Anmerkungen / Edge-Cases:**
- Die USt-IdNr eines Kunden/Lieferanten ist **keine Kontakt-Stammdaten-Information**, sondern rechtskritischer Nachweis. Bei Fehlen droht bei ig Lieferungen die Aberkennung der Steuerfreiheit und 19 %-Nachzahlung.
- **Bestätigungsverfahren MUSS dokumentiert sein** (§ 18e UStG + § 17b UStDV). harouda-app erfüllt das durch die WORM-Tabelle + Hash-Chain. Rechtlich abgeschlossen durch Sprint 20.B.

---

## 5. BZSt — Bundeszentralamt für Steuern

| Feld | Inhalt |
|---|---|
| **Deutsch (primär)** | Bundeszentralamt für Steuern |
| **Synonyme (DE)** | BZSt (Abkürzung, im Code und Text bevorzugt) |
| **Arabisch** | المكتب الاتحادي المركزي للضرائب (الجهة الألمانية الاتحادية المسؤولة عن إصدار أرقام USt-IdNr والتأكيد المؤهَّل عليها، وعن إدارة بوابات الإبلاغ الإلكتروني — مثل ELSTER و BOP — التي تخدم كامل الأراضي الألمانية، بدلاً من مكاتب الضرائب المحلية) |
| **Englisch (Code-Kontext)** | `BZST` (String-Literal, als `verification_source`-Wert) |
| **Kategorie** | Institution / Behörde |
| **Status** | FEST |
| **Aufgenommen am** | 2026-04-22, Terminology-Sprint 1 |

**Definition:**
Bundesoberbehörde im Geschäftsbereich des Bundesministeriums der Finanzen mit Sitz in Bonn. Zuständig für zentrale, bundesweite Steuerverwaltungsaufgaben, die nicht einzelnen Finanzämtern zugeordnet sind — insbesondere USt-IdNr-Vergabe, **qualifizierte Bestätigung** von USt-IdNrn nach § 18e UStG, Zusammenfassende Meldung (ZM), Kapitalertragsteuer, Familienkasse etc.

**Für harouda-app relevante Services:**

| Service | URL / Endpoint | Zweck |
|---|---|---|
| `evatrRPC` | `https://evatr.bff-online.de/evatrRPC` | Qualifizierte Bestätigung USt-IdNr (§ 18e UStG) |
| BOP (BZSt-Online-Portal) | `https://www.elster.de/bportal/` | ZM-Übermittlung |
| Formularserver | `https://www.formulare-bfinv.de/` | Formular-Downloads |

**Rechtsgrundlage:**
- § 5 Finanzverwaltungsgesetz (FVG) — Zuständigkeiten
- § 27a UStG — Vergabe der USt-IdNr durch BZSt
- § 18e UStG — Bestätigungsverfahren
- § 18a UStG — ZM an BZSt-BOP

**Verwandte Begriffe:**
- [USt-IdNr](#4-ust-idnr-umsatzsteuer-identifikationsnummer) — das Kern-Feld des BZSt-Services
- [VIES](#6-vies-vat-information-exchange-system) — EU-weite Alternative (nicht deutsch)
- [ZM](#8-zm-zusammenfassende-meldung) — geht an BZSt-BOP
- [ELSTER](#11-elster--elektronische-steuererklärung) — ähnliche Rolle für lokale Finanzämter, aber andere Behörde
- [Verschwiegenheitspflicht](./01-grundlagen.md#10-verschwiegenheitspflicht) — auch gegenüber BZSt (§ 102 AO)

**Verwendung im Code:**
- `supabase/functions/validate-ustid/index.ts` — Edge-Function-Wrapper für BZSt evatrRPC (Sprint 20.A.2 — siehe [SPRINT-20-ABSCHLUSS.md](../SPRINT-20-ABSCHLUSS.md))
- Response-Mapping: BZSt-ErrorCode → harouda-Status:

| ErrorCode | harouda-Status | Bedeutung |
|---|---|---|
| `200` | `VALID` | USt-IdNr ist gültig |
| `201` | `INVALID` | USt-IdNr ist nicht gültig |
| `202` | `INVALID` | USt-IdNr ist nicht registriert |
| `203` | `INVALID` | Erst seit heute gültig |
| `204` | `INVALID` | Früher gültig, zum Abfragezeitpunkt ungültig |
| `215` | `SERVICE_UNAVAILABLE` | Zu viele Fehler in Anfrage |
| `217` | `SERVICE_UNAVAILABLE` | Mitgliedsstaat nicht erreichbar |
| `218` | `SERVICE_UNAVAILABLE` | Qualifizierte Bestätigung z. Zt. nicht möglich |
| `219` | `SERVICE_UNAVAILABLE` | Fehler bei ausländischem Mitgliedsstaat |
| `999` | `ERROR` | Interner BZSt-Fehler |

- Response-Encoding: BZSt liefert **ISO-8859-1** (Latin-1), nicht UTF-8 — wird serverseitig dekodiert
- Persistenz: `ustid_verifications` mit `verification_source='BZST'` + WORM + Hash-Chain
- Automatischer VIES-Fallback bei `SERVICE_UNAVAILABLE`: `src/api/ustIdRouter.ts`

**Nicht verwechseln mit:**
- **Finanzamt** — lokale Behörde (Landesbehörde), zuständig für Besteuerungsverfahren einzelner Steuerpflichtiger; BZSt ist Bundesbehörde für zentrale Aufgaben
- **BStBK** — Bundessteuerberaterkammer (Berufskammer), keine Behörde der Finanzverwaltung
- **BMF** — Bundesministerium der Finanzen (übergeordnete Politikebene); BZSt ist dem BMF nachgeordnet
- **BFinV / Bundesfinanzverwaltung** — übergeordneter organisatorischer Begriff

**Anmerkungen / Edge-Cases:**
- BZSt bietet ausschließlich für **deutsche Anfragende** die qualifizierte Bestätigung (Request-Parameter `UstId_1` muss DE-Nummer sein). Für nicht-deutsche Requester bleibt nur VIES.
- Qualifizierte Bestätigung = BZSt prüft nicht nur die Gültigkeit, sondern auch **Firmenname + Adresse** (wenn mit angefragt). Ergebnis hat höhere Rechtskraft als einfache VIES-Antwort.
- BZSt-Antworten sind rechtlich als **Nachweis des guten Glaubens** wertvoll — wer qualifizierte Bestätigung durchführt, ist bei späterer USt-IdNr-Ungültigkeit geschützt (§ 6a Abs. 4 UStG, BFH-Rechtsprechung).

---

## 6. VIES — VAT Information Exchange System

| Feld | Inhalt |
|---|---|
| **Deutsch (primär)** | VIES |
| **Synonyme (DE)** | MwSt-Informationsaustausch-System (offizielle deutsche Übersetzung, selten verwendet), EU-USt-Bestätigungssystem |
| **Arabisch** | نظام تبادل معلومات ضريبة القيمة المضافة الأوروبي (منصة مركزية تابعة للمفوضية الأوروبية تتيح لأي شركة في الاتحاد الأوروبي التحقق الفوري من صلاحية رقم USt-IdNr لأي شركة أخرى في الاتحاد — تأكيد "بسيط" فقط، أي يؤكِّد الوجود ولا يتحقق من الاسم والعنوان كما يفعل BZSt) |
| **Englisch (Code-Kontext)** | `VIES` (String-Literal, als `verification_source`-Wert) |
| **Kategorie** | Institution / EU-System |
| **Status** | FEST |
| **Aufgenommen am** | 2026-04-22, Terminology-Sprint 1 |

**Definition:**
System der EU-Kommission (DG TAXUD), über das jede Person EU-weit die **Gültigkeit** einer USt-IdNr aus einem anderen EU-Mitgliedsstaat prüfen kann. Liefert nur **einfache Bestätigung** (gültig / ungültig) — keine Namens-/Adressverifikation wie beim deutschen BZSt. VIES ist kein zentrales System, sondern ein Zugriffs-Layer, der Anfragen an die nationalen Steuerverwaltungen weiterleitet.

**Zugriff:**
- Web-UI: https://ec.europa.eu/taxation_customs/vies/
- SOAP-Webservice: `https://ec.europa.eu/taxation_customs/vies/services/checkVatService`

**Rechtsgrundlage:**
- Art. 17 Verordnung (EU) 904/2010 (EU-Amtshilfe-Verordnung)
- § 18e UStG — in Deutschland als eine anerkannte Bestätigungsquelle neben BZSt

**Verwandte Begriffe:**
- [USt-IdNr](#4-ust-idnr-umsatzsteuer-identifikationsnummer) — geprüftes Feld
- [BZSt](#5-bzst-bundeszentralamt-für-steuern) — deutsche Alternative mit qualifizierter Bestätigung
- [UStG](#1-ustg-umsatzsteuergesetz) — materielle Rechtsgrundlage für Prüfpflicht

**Verwendung im Code:**
- `supabase/functions/verify-ust-idnr/index.ts` — Edge-Function-Wrapper für VIES SOAP
- Router-Logik in `src/api/ustIdRouter.ts` (Sprint 20.A.2 — siehe [SPRINT-20-ABSCHLUSS.md](../SPRINT-20-ABSCHLUSS.md)):
  - **Nicht-DE-Requester** → VIES direkt
  - **DE-Requester** → primär [BZSt](#5-bzst-bundeszentralamt-für-steuern), Fallback auf VIES bei `SERVICE_UNAVAILABLE`
- Persistenz: `ustid_verifications` mit `verification_source='VIES'` (Migration 0038)
- UI-Badge: 🌐 VIES in `UstIdnrStatusBadge.tsx` (Sprint 20.A.2)

**Nicht verwechseln mit:**
- **BZSt** — nationaler deutscher Dienst, liefert qualifizierte Bestätigung (mit Namensabgleich); VIES nur einfache Bestätigung
- **MIAS** — alter Name für VIES, manchmal noch in deutschen Texten zu finden; identisches System
- **Intrastat** — EU-Meldeverfahren für Warenströme, nicht für USt-IdNr-Prüfung

**Anmerkungen / Edge-Cases:**
- **VIES ist nur so zuverlässig wie das nationale Register im Empfängerland.** Bei Verzögerungen in der nationalen Datenbank kann eine grundsätzlich gültige USt-IdNr temporär als "ungültig" gemeldet werden. Deshalb wird bei negativen Bestätigungen oft **zeitlich versetzt erneut geprüft** — harouda-app speichert alle Versuche in der WORM-Chain, sodass Historie nachvollziehbar bleibt.
- VIES liefert **keine Namens-Bestätigung bei allen Ländern**. Manche Länder exponieren Firmennamen (z. B. Spanien, Italien), andere nicht (z. B. Deutschland selbst — dort bleibt VIES daher weniger aussagekräftig als BZSt).
- Für deutsche Requester ist **BZSt der rechtlich stärkere Weg** — VIES ist der Fallback, nicht der Primärpfad.

---

## 7. UStVA — Umsatzsteuer-Voranmeldung

| Feld | Inhalt |
|---|---|
| **Deutsch (primär)** | Umsatzsteuer-Voranmeldung |
| **Synonyme (DE)** | UStVA (Abkürzung, im Code bevorzugt), Voranmeldung |
| **Arabisch** | الإقرار المؤقت لضريبة القيمة المضافة (تقرير دوري — شهري أو ربع سنوي — يجب على الشركات الخاضعة لـ USt تقديمه إلكترونياً إلى مصلحة الضرائب عبر منصة ELSTER، يُلخِّص ضريبة المبيعات المحصَّلة وضريبة المدخلات المدفوعة لحساب المبلغ المستحق) |
| **Englisch (Code-Kontext)** | im Code als `ustva`-Präfix; konzeptuell VAT advance return |
| **Kategorie** | Rechtsbegriff / Steuererklärung |
| **Status** | FEST |
| **Aufgenommen am** | 2026-04-22, Terminology-Sprint 1 |

**Definition:**
Monatliche oder quartalsweise Steueranmeldung, mit der Unternehmer dem Finanzamt die im Voranmeldungszeitraum entstandene Umsatzsteuer melden und abführen (bzw. einen Erstattungsanspruch geltend machen). Muss **elektronisch** über ELSTER übermittelt werden. Grundlage für die spätere **Umsatzsteuer-Jahreserklärung**.

**Voranmeldungs-Rhythmus:**

| Zahllast Vorjahr | Rhythmus |
|---|---|
| > 9.000 € | **monatlich** |
| 2.000 € – 9.000 € | **vierteljährlich** |
| ≤ 2.000 € | nur Jahreserklärung |
| Neugründung (erste 2 Jahre) | immer monatlich |

**Abgabefrist:** Der **10. Tag** nach Ende des Voranmeldungszeitraums (§ 18 Abs. 1 UStG). Mit Dauerfristverlängerung + 1 Monat (§ 46 UStDV, bei Sondervorauszahlung).

**Rechtsgrundlage:**
- § 18 Abs. 1, 2 UStG — Voranmeldungs-Pflicht und Rhythmus
- § 18 Abs. 2a UStG — quartalsweise Abgabe
- §§ 46–48 UStDV — Dauerfristverlängerung
- § 152 AO — Verspätungszuschlag
- § 149 Abs. 1 AO — allgemeine Abgabefristen
- UStVA-Kennziffern (Formular + ELSTER-Schema jährlich aktualisiert)

**Verwandte Begriffe:**
- [Umsatzsteuer](#2-umsatzsteuer-ust) / [Vorsteuer](#3-vorsteuer) — die saldierten Positionen
- [ZM](#8-zm-zusammenfassende-meldung) — ergänzende Meldung bei EU-Umsätzen
- [ELSTER](#11-elster--elektronische-steuererklärung) — Übermittlungs-Infrastruktur
- [Festschreibung](./08-technik-architektur.md) — nach UStVA-Abgabe wird die Periode üblicherweise festgeschrieben

**Verwendung im Code:**
- Builder: `src/domain/ustva/UStVaBuilder.ts` (bzw. entsprechender Service in `src/domain/ustva/`)
- ELSTER-XML-Generator: `src/domain/elster/` (Sprint 14)
- Konten-Mapping: SKR03-Konten → UStVA-Kennziffern (z. B. Konto 8400 → Kz. 81, Vorsteuer 1570 → Kz. 66)
- Persistenz der Abgabe: `public.elster_submissions` (Migration `0013_elster_submissions.sql`)
- Auto-Festschreibung: Migration `0009_journal_autolock.sql` — nach UStVA-Abgabe wird die zugehörige Periode im Journal gesperrt
- Pages: `src/pages/UStVAPage.tsx` (bzw. entsprechende Seite)

**Nicht verwechseln mit:**
- **Umsatzsteuer-Jahreserklärung** — jährliche, umfassende Erklärung am Jahresende; die UStVAs werden damit saldiert
- **Körperschaftsteuer-Vorauszahlung / Einkommensteuer-Vorauszahlung** — vierteljährliche Ertragsteuer-Vorauszahlungen, völlig andere Steuerart
- **Lohnsteuer-Anmeldung (LStA)** — analog strukturierte monatliche Anmeldung, aber für Lohnsteuer (siehe `03-lohn-sv.md`)

**Anmerkungen / Edge-Cases:**
- **Nullmeldung pflicht** — auch wenn im Zeitraum keine Umsätze angefallen sind, muss eine Null-UStVA abgegeben werden (außer bei Kleinunternehmer-Regelung).
- **Dauerfristverlängerung** (§ 46 UStDV) ist ein wichtiger Praxis-Baustein — verschiebt die Abgabefrist um 1 Monat gegen Zahlung einer 1/11-Sondervorauszahlung. harouda-app behandelt das über die Frist-Konfiguration pro Mandant.
- **Korrektur-UStVA:** Nachträgliche Änderungen erfolgen über **berichtigte UStVA** (§ 153 AO) mit Hinweis auf die ursprüngliche Abgabe, nicht durch Neuabgabe.

---

## 8. ZM — Zusammenfassende Meldung

| Feld | Inhalt |
|---|---|
| **Deutsch (primär)** | Zusammenfassende Meldung |
| **Synonyme (DE)** | ZM (Abkürzung, im Code und Text bevorzugt) |
| **Arabisch** | الإقرار التجميعي للتوريدات داخل الاتحاد الأوروبي (تقرير إضافي يُقدَّم إلى BZSt — وليس إلى مصلحة الضرائب المحلية — يسرد كل التوريدات والخدمات التي قدَّمتها الشركة إلى عملاء في دول أوروبية أخرى خلال الفترة، مع ذكر رقم USt-IdNr لكل عميل والمبلغ الصافي؛ هدفه تمكين السلطات الأوروبية من المطابقة المتقاطعة ومكافحة الاحتيال الضريبي) |
| **Englisch (Code-Kontext)** | `ZM` / `ZusammenfassendeMeldung`; konzeptuell EC Sales List / Recapitulative Statement |
| **Kategorie** | Rechtsbegriff / Steueranmeldung |
| **Status** | FEST |
| **Aufgenommen am** | 2026-04-22, Terminology-Sprint 1 |

**Definition:**
Zusätzliche, zu [UStVA](#7-ustva-umsatzsteuer-voranmeldung) parallele Meldung an das [BZSt](#5-bzst-bundeszentralamt-für-steuern), in der **alle innergemeinschaftlichen Umsätze** (Warenlieferungen, sonstige Leistungen im Reverse-Charge-Verfahren, dreieckiges Geschäft) mit USt-IdNr des EU-Empfängers und Umsatzwert aufgelistet werden. Dient der EU-weiten Betrugsbekämpfung — die Mitgliedsstaaten gleichen die ZM-Daten untereinander ab.

**Meldungsrhythmus:**

| Konstellation | Rhythmus |
|---|---|
| Warenlieferungen > 50.000 € / Quartal | **monatlich** (folgt UStVA-Monatszeitraum) |
| Warenlieferungen ≤ 50.000 € / Quartal | vierteljährlich |
| Nur sonstige Leistungen | vierteljährlich |

**Abgabefrist:** 25. Tag nach Ende des Meldungszeitraums (§ 18a Abs. 1 UStG) — strenger als UStVA-Frist.

**Rechtsgrundlage:**
- § 18a UStG — Pflicht zur Abgabe
- § 4 Nr. 1 lit. b UStG i. V. m. § 6a UStG — Steuerbefreiung ig Lieferungen (Voraussetzung: korrekte ZM)
- § 17c UStDV — Buchnachweispflicht
- Art. 262 MwStSystRL — EU-Grundlage

**Konsequenzen bei Fehlern:**
Unvollständige oder falsche ZM → **Aberkennung der Steuerfreiheit** der ig Lieferung → 19 %-Nachzahlung (!). Das ist die häufigste und teuerste Fehlerquelle in EU-B2B-Geschäften.

**Verwandte Begriffe:**
- [UStVA](#7-ustva-umsatzsteuer-voranmeldung) — primäre USt-Meldung (ergänzt von ZM)
- [USt-IdNr](#4-ust-idnr-umsatzsteuer-identifikationsnummer) — Pflichtfeld jedes ZM-Eintrags
- [BZSt](#5-bzst-bundeszentralamt-für-steuern) — Empfänger der ZM
- [Reverse-Charge](#10-reverse-charge-verfahren-§-13b-ustg) — beim Empfänger anwendbar
- Dreiecksgeschäft (§ 25b UStG) — spezieller ZM-Meldungstyp

**Verwendung im Code:**
- Builder: `src/domain/ebilanz/` oder `src/domain/elster/` — ZM wird als XML generiert
- Zwei parallele XML-Schemas (Sprint 14):
  - **ELMA5-Style** für BZSt-BOP-Upload (ältere manuelle Variante)
  - **ELSTER-Style** für ELSTER-Direktübertragung
- Persistenz der Abgabe: `elster_submissions` (Migration 0013) — unterscheidet `type='UStVA' | 'ZM' | 'LStA'`
- Validierung: jeder ZM-Datensatz muss eine gültige USt-IdNr haben (zuvor via BZSt/VIES geprüft)

**Nicht verwechseln mit:**
- **UStVA** — inland-basierte USt-Meldung; ZM betrifft nur EU-Geschäfte
- **Intrastat** — statistische Warenstrom-Meldung (nicht steuerlich), anderer Zweck
- **Meldung Drittland-Geschäfte** — Ausfuhr ins Nicht-EU-Ausland geht in die UStVA (Kz. 43), nicht in die ZM

**Anmerkungen / Edge-Cases:**
- **Quick Fixes 2020** (§ 6a UStG-Änderung): seit 2020 ist die korrekte Aufnahme in die ZM **materielle Voraussetzung** für die Steuerfreiheit der ig Lieferung — vor 2020 war sie "nur" formelle Voraussetzung. Fehler sind seitdem nicht mehr nachheilbar.
- **Dreiecksgeschäfte** (A in DE → B in AT → C in IT, aber Ware geht direkt von A nach C): Sonderregel nach § 25b UStG, eigene ZM-Kennzeichnung erforderlich.
- Direkt-Transmission der ZM an BZSt-BOP ist in harouda-app **nicht implementiert** — die XML wird generiert, der Upload erfolgt manuell durch den Steuerberater.

---

## 9. Kleinunternehmer (§ 19 UStG)

| Feld | Inhalt |
|---|---|
| **Deutsch (primär)** | Kleinunternehmer |
| **Synonyme (DE)** | Kleinunternehmer-Regelung, § 19-Unternehmer |
| **Arabisch** | الشركة الصغيرة المعفاة من ضريبة القيمة المضافة (وضع ضريبي خاص للشركات التي لم تتجاوز إيراداتها عتبة معينة في السنة السابقة؛ المُعفى لا يُحصِّل USt من عملائه ولا يحق له خصم Vorsteuer، ما يُبسِّط إجراءاته المحاسبية تبسيطاً كبيراً — لكنه يظل "شركة" بمفهوم القانون ولا تُعفى من قواعد GoBD والإقرار الضريبي السنوي) |
| **Englisch (Code-Kontext)** | `kleinunternehmer` (Flag an `clients`-Tabelle) |
| **Kategorie** | Rechtsbegriff / Steuerstatus |
| **Status** | FEST |
| **Aufgenommen am** | 2026-04-22, Terminology-Sprint 1 |

**Definition:**
Unternehmer, deren Umsatz im Vorjahr eine gesetzliche Schwelle nicht überschritten hat und im laufenden Jahr voraussichtlich nicht überschreiten wird. Sie werden nach § 19 UStG **wie Nicht-Unternehmer** behandelt: Sie dürfen in Rechnungen keine USt ausweisen und haben keinen Vorsteuerabzug. Damit entfällt die UStVA-Pflicht (nur Jahreserklärung bleibt).

**Historische Schwellenwerte (wichtig für Altperioden-Bearbeitung):**

| Zeitraum | Vorjahresumsatz | Laufendes Jahr | Gesetzliche Grundlage |
|---|---|---|---|
| **bis 31.12.2019** | ≤ 17.500 € | ≤ 50.000 € | § 19 Abs. 1 UStG a. F. |
| **01.01.2020 – 31.12.2024** | ≤ 22.000 € | ≤ 50.000 € | JStG 2019 |
| **ab 01.01.2025** | ≤ **25.000 €** | ≤ **100.000 €** | Wachstumschancengesetz + JStG 2024 |

**Wichtige Änderung ab 2025:**
Die Schwellen wurden zum 01.01.2025 signifikant angehoben. Außerdem wurde die Systematik geändert: Bei Überschreiten der 100.000-€-Schwelle im laufenden Jahr verliert der Unternehmer die Kleinunternehmer-Eigenschaft **ab dem Zeitpunkt der Überschreitung** (nicht mehr rückwirkend zum Jahresbeginn). Das entschärft eine alte Praxis-Falle erheblich.

**Hinweis für Altjahre:** Bei Mandanten, für die harouda-app noch Wirtschaftsjahre vor 2025 bearbeitet, gelten die **alten Schwellenwerte** — der Steuerberater muss je nach Jahr den zutreffenden Wert prüfen. harouda-app zeigt die Schwellenwerte nicht automatisch abhängig vom Wirtschaftsjahr (TECH-DEBT-Kandidat).

**Rechtsgrundlage:**
- § 19 UStG — Kleinunternehmer-Regelung (aktuelle Fassung)
- § 19 Abs. 2 UStG — **Verzichtsoption** (Opt-in in die Regelbesteuerung, Bindung 5 Jahre)
- Art. 38 Wachstumschancengesetz vom 27.03.2024 — Anhebung der Schwellen
- UStAE Abschn. 19 — Verwaltungsauffassung

**Verwandte Begriffe:**
- [UStG](#1-ustg-umsatzsteuergesetz) — Rechtsrahmen
- [Umsatzsteuer](#2-umsatzsteuer-ust) — davon befreit
- [Vorsteuer](#3-vorsteuer) — nicht abziehbar (!)
- [UStVA](#7-ustva-umsatzsteuer-voranmeldung) — entfällt

**Verwendung im Code:**
- Flag: `clients.kleinunternehmer: boolean`
- Wenn `true`:
  - UStVA-Generierung wird deaktiviert
  - Rechnungsausstellung darf keine USt ausweisen (UI-Validator)
  - Vorsteuer-Konten werden nicht gemappt
  - ZM entfällt (auch keine ig Lieferungen im steuerlichen Sinn)
- Hinweistext auf Rechnungen: "Gemäß § 19 UStG wird keine Umsatzsteuer ausgewiesen" (Pflichtangabe)
- Der Schwellenwert-Check ist aktuell **nicht automatisiert** — der Steuerberater prüft manuell (TECH-DEBT-Kandidat: automatische Warnung bei Annäherung an 25.000-€-Schwelle, mit jahresabhängigen Werten für Altperioden)

**Nicht verwechseln mit:**
- **Steuerbefreit nach § 4 UStG** — bezieht sich auf bestimmte Leistungsarten (z. B. Heilbehandlungen); Kleinunternehmer-Regelung ist umsatzabhängig
- **Einnahmen-Überschuss-Rechnung (EÜR)** — gewinnermittlungsmethode nach EStG; viele Kleinunternehmer nutzen EÜR, aber die beiden Begriffe sind voneinander unabhängig
- **Freiberufler** — EStG-Begriff für bestimmte Berufsgruppen (§ 18 EStG); Freiberufler KÖNNEN Kleinunternehmer sein, müssen aber nicht

**Anmerkungen / Edge-Cases:**
- **Option zur Regelbesteuerung** (§ 19 Abs. 2 UStG): Kleinunternehmer können freiwillig zur Regelbesteuerung wechseln. Dann 5 Jahre Bindung. Lohnt sich bei hohen Investitionen (Vorsteuerabzug). harouda-app unterstützt den Wechsel durch Änderung des Flags; die 5-Jahres-Bindung muss manuell beachtet werden.
- **Überschreitung der aktuellen Schwellen (ab 2025):** Bei Überschreiten der 25.000-€-Vorjahresschwelle wird der Unternehmer ab 01.01. des Folgejahres regelbesteuert. Bei Überschreiten der 100.000-€-Grenze im laufenden Jahr wird er **ab dem Überschreitungszeitpunkt** regelbesteuert (nicht rückwirkend zum 01.01.).
- **Rechnung mit USt-Ausweis trotz Kleinunternehmer-Status:** → § 14c UStG (unberechtigter Steuerausweis) → der ausgewiesene Betrag wird geschuldet, obwohl keine USt-Pflicht bestand! Typische teure Fehlerquelle.

---

## 10. Reverse-Charge-Verfahren (§ 13b UStG)

| Feld | Inhalt |
|---|---|
| **Deutsch (primär)** | Reverse-Charge-Verfahren |
| **Synonyme (DE)** | Steuerschuldnerschaft des Leistungsempfängers, § 13b-Verfahren, Umkehrung der Steuerschuldnerschaft |
| **Arabisch** | آلية انعكاس التزام الضريبة (آلية خاصة في قانون UStG يُلزَم بموجبها المستقبِل — وليس المورِّد — بدفع ضريبة القيمة المضافة إلى مصلحة الضرائب؛ يُطبَّق تلقائياً في حالات محددة كاستيراد الخدمات من شركة في دولة أوروبية أخرى، أو في بعض قطاعات البناء والنظافة والذهب، وهدفه مكافحة الاحتيال الضريبي وتبسيط المعاملات عبر الحدود) |
| **Englisch (Code-Kontext)** | reverse charge; im Code als `reverse_charge`-Flag bzw. `§13b`-Marker |
| **Kategorie** | Fachbegriff / Steuermechanismus |
| **Status** | FEST |
| **Aufgenommen am** | 2026-04-22, Terminology-Sprint 1 |

**Definition:**
Ausnahme vom Regelfall „Leistender ist Steuerschuldner": Bei bestimmten Umsätzen schuldet der **Leistungsempfänger** die Umsatzsteuer (§ 13b UStG). Der Leistende stellt die Rechnung **netto, ohne USt-Ausweis**, aber mit explizitem Hinweis auf das Reverse-Charge-Verfahren. Der Empfänger bucht auf seiner Seite die USt (Haben 1770) und die identische Vorsteuer (Soll 1571) — netto-neutral, aber aufwandsseitig dokumentiert.

**Wichtigste Anwendungsfälle (§ 13b Abs. 1–5 UStG):**

| Fall | Typische Situation |
|---|---|
| **ig Dienstleistungen** | EU-ausländischer Dienstleister (z. B. Google Ads aus IE an DE-Unternehmen) |
| **Bauleistungen im Inland** | Bauunternehmer beauftragt Subunternehmer (§ 13b Abs. 2 Nr. 4) |
| **Gebäudereinigung** | Reinigungsdienstleister an anderen Unternehmer |
| **Gold-Lieferungen** | Bestimmte Gold-Qualitäten |
| **Mobilfunkgeräte, Tablets, Notebooks** | ab Rechnungswert 5.000 € |
| **Emissionszertifikate** | CO₂-Rechte |
| **Metalle / Schrott** | bestimmte Bleche, Buntmetalle |

**Rechtsfolge:** Der Empfänger muss die USt in seiner [UStVA](#7-ustva-umsatzsteuer-voranmeldung) anmelden (Kennziffern 46/47/52/84 etc. je nach Fall) und im gleichen Zug als [Vorsteuer](#3-vorsteuer) geltend machen (Kz. 67).

**Rechtsgrundlage:**
- § 13b UStG — Leistungsempfänger als Steuerschuldner
- § 14a Abs. 5 UStG — Pflichthinweis in Rechnung: „Steuerschuldnerschaft des Leistungsempfängers"
- UStAE Abschn. 13b — Anwendungsdetails
- Art. 194–199b MwStSystRL — EU-Grundlagen

**Verwandte Begriffe:**
- [UStG](#1-ustg-umsatzsteuergesetz) — Gesetz
- [Umsatzsteuer](#2-umsatzsteuer-ust) / [Vorsteuer](#3-vorsteuer) — beide Seiten bucht der Empfänger
- [UStVA](#7-ustva-umsatzsteuer-voranmeldung) — dort werden die Kennziffern gefüllt
- [USt-IdNr](#4-ust-idnr-umsatzsteuer-identifikationsnummer) — bei EU-Fällen zwingend
- [ZM](#8-zm-zusammenfassende-meldung) — ig Dienstleistungen gehen auch in die ZM

**Verwendung im Code:**
- Konten-Mapping in SKR03 für § 13b:
  - Ausgangsseite: Konto **8338** (Erlöse § 13b), keine USt-Konto
  - Empfängerseite: Haben **1770** (geschuldete USt) + Soll **1571** (Vorsteuer)
- UStVA-Kennziffern 46/47 (ig Erwerb/Leistung) + 52/53 (Bauleistungen) + 84/85 (sonstige § 13b)
- UI-Kennzeichnung: bei Belegerfassung `reverseCharge: boolean` + Pflicht-Dropdown der § 13b-Kategorie
- Rechnungs-Pflichthinweis auf Ausgangsrechnungen wird automatisch ergänzt, wenn § 13b anwendbar

**Nicht verwechseln mit:**
- **Reguläre ig Lieferungen** (§ 6a UStG, Warenlieferungen) — auch steuerfrei auf Lieferantenseite, aber rechtssystematisch andere Norm; Reverse-Charge betrifft primär Dienstleistungen und bestimmte Inlandsfälle
- **Kleinunternehmer-Status** — dort wird gar keine USt ausgewiesen; bei Reverse-Charge wird sie "umgekehrt", nicht ausgelassen
- **Export in Drittländer** — auch steuerfrei, aber § 6 UStG; keine Reverse-Charge-Terminologie

**Anmerkungen / Edge-Cases:**
- **Empfänger schuldet auch bei Irrtum**: Wenn ein deutscher Unternehmer fälschlich USt ausweist (obwohl § 13b gilt), schuldet er die ausgewiesene USt trotzdem nach § 14c UStG — **zusätzlich** zur vom Empfänger geschuldeten § 13b-USt. Doppelbelastung. Rechnungskorrektur zwingend erforderlich.
- **Bauleistungen § 13b Abs. 2 Nr. 4**: Nur zwischen Bauunternehmern. Reiner Architekt oder Hausverwalter löst kein § 13b aus — komplexe Abgrenzungsfrage, die Rechtsprechung ständig präzisiert.
- **Netto-Neutralität gilt nur bei voller Vorsteuerabzugsberechtigung**: Wenn der Empfänger selbst teils steuerfreie Umsätze hat (z. B. Versicherung, Heilberuf), ist § 13b für ihn eine echte Kostenbelastung, da er die geschuldete USt zwar abführt, aber nicht vollständig als Vorsteuer abziehen kann.

---

## 11. ELSTER — Elektronische Steuererklärung

| Feld | Inhalt |
|---|---|
| **Deutsch (primär)** | ELSTER |
| **Synonyme (DE)** | Elektronische Steuererklärung, MeinELSTER (Portal-Frontend) |
| **Arabisch** | البوابة الاتحادية الإلكترونية لتقديم الإقرارات الضريبية (البنية التحتية الرقمية الرسمية التي تديرها إدارات المالية في الولايات الألمانية ويمرّ عبرها وجوباً كل إرسال ضريبي إلكتروني — UStVA, LStA, ZM, KSt, GewSt, E-Bilanz) |
| **Englisch (Code-Kontext)** | ELSTER (Eigenname, nicht übersetzt) |
| **Kategorie** | Institution / Übermittlungs-Infrastruktur |
| **Status** | FEST |
| **Aufgenommen am** | 2026-04-22, Terminology-Sprint 1 |

**Definition:**
Die zentrale, von den 16 Landesfinanzbehörden gemeinsam (unter Federführung des Bayerischen Landesamts für Steuern) betriebene Plattform für die elektronische Übermittlung von Steuerdaten zwischen Steuerpflichtigen und Finanzverwaltung. Seit 2005 verpflichtender Übermittlungsweg für die meisten laufenden Steuermeldungen; seit 2013/2015 auch für E-Bilanz und Körperschaftsteuererklärungen.

**Rechtsgrundlage:**
- § 87a AO — elektronische Kommunikation mit Finanzbehörden
- § 87b AO — Datenübermittlung im Besteuerungsverfahren
- § 18 Abs. 1 Satz 1 UStG — elektronische Pflicht UStVA
- § 41a Abs. 1 EStG — elektronische Pflicht Lohnsteuer-Anmeldung
- § 5b EStG — elektronische Bilanzübermittlung (E-Bilanz)
- Steuerdaten-Übermittlungsverordnung (StDÜV)

**Verwandte Begriffe:**
- [ERiC](#12-eric--elster-rich-client) — technische Bibliothek zur Kommunikation mit ELSTER
- [UStVA](#7-ustva-umsatzsteuer-voranmeldung), [ZM](#8-zm-zusammenfassende-meldung) — via ELSTER übermittelte Voranmeldungen
- [LStA](#20-lohnsteuer-anmeldung-lsta), [E-Bilanz](#15-e-bilanz), [KSt](#18-körperschaftsteuer-kst), [GewSt](#19-gewerbesteuer-gewst) — weitere Pflicht-Übermittlungen
- **ELSTER-Zertifikat / Organisationszertifikat** — Authentifizierungs-Artefakt, definiert in [08-technik-architektur.md](./08-technik-architektur.md) (geplant)

**Verwendung im Code:**
- `src/domain/elster/` — ELSTER-XML-Builder (Sprint 14: ZM-Builder; Sprint 15+ geplant: UStVA-Direktübermittlung)
- Bisher nur **XML-Erzeugung** implementiert; die eigentliche Übertragung via ERiC ist offener Tech-Debt (siehe `XBRL-MULTI-VERSION`, Sprint 22+).

**Nicht verwechseln mit:**
- **MeinELSTER** — nur das Web-Portal; eine von drei Zugangsarten (Portal, ERiC-SDK, proprietäre Software)
- **ElsterFormular** — 2020 eingestellte Desktop-Anwendung, historisch
- **BZSt-Online** — separates Portal des BZSt (USt-IdNr-Bestätigung, OSS/IOSS); nicht Teil von ELSTER
- **Elster-AusfuhrPlus / ATLAS** — Zollsysteme, nicht ELSTER

**Anmerkungen / Edge-Cases:**
- ELSTER ist **föderaler Verbund**, kein einzelner Bundesbehörden-Dienst — bei Rechtsfragen zum Betreiber verweist das Impressum auf das Bayerische Landesamt für Steuern.
- Drei Umgebungen: Produktiv, Basis-Test (für Entwicklung ohne Echtdaten), Vollversionstest (Release-Zertifizierung). Jede harouda-app-Deploymentphase erfordert separate Zertifikate.

---

## 12. ERiC — ELSTER Rich Client

| Feld | Inhalt |
|---|---|
| **Deutsch (primär)** | ERiC |
| **Synonyme (DE)** | ELSTER Rich Client, ERiC-SDK, ERiC-Bibliothek |
| **Arabisch** | المكتبة البرمجية الرسمية للإرسال عبر ELSTER (حزمة تطوير رسمية توفّرها إدارة الضرائب البافارية بلغات C/C++/Java/.NET، وتتولى التحقق من صحة البيانات والتشفير والإرسال الفعلي للإقرارات الضريبية الإلكترونية) |
| **Englisch (Code-Kontext)** | ERiC (Eigenname, nicht übersetzt) |
| **Kategorie** | Software-Bibliothek / Technische Komponente |
| **Status** | FEST |
| **Aufgenommen am** | 2026-04-22, Terminology-Sprint 1 |

**Definition:**
Die offizielle, vom Bayerischen Landesamt für Steuern bereitgestellte Programmbibliothek zur Validierung, Verschlüsselung und Übermittlung von Steuerdaten an ELSTER. Jede Drittsoftware, die direkt an ELSTER sendet (d. h. ohne Umweg über das Web-Portal MeinELSTER), MUSS ERiC einsetzen — eine eigene Re-Implementierung des Übermittlungsprotokolls ist nicht zulässig und wird bei Zertifizierungsprüfung durch die Landesfinanzbehörde abgelehnt.

**Rechtsgrundlage:**
- Keine direkte gesetzliche Norm; implizit über § 87a AO + ELSTER-Nutzungsbedingungen erzwungen
- ERiC-Entwicklerhandbuch (jährlich mehrfach aktualisiert)
- ELSTER-Herstellerverpflichtungen für als "ELSTER-zertifiziert" beworbene Software

**Verwandte Begriffe:**
- [ELSTER](#11-elster--elektronische-steuererklärung) — Gesamtsystem; ERiC ist dessen Client-Seite
- [XBRL](#16-xbrl) / [Kern-Taxonomie](#17-kern-taxonomie) — Validierung der E-Bilanz-Instances erfolgt innerhalb von ERiC
- **ELSTER-Zertifikat** (→ [08-technik-architektur.md](./08-technik-architektur.md)) — ERiC benötigt es für die digitale Signatur der Übertragung

**Verwendung im Code:**
- **Aktuell nicht integriert.** harouda-app erzeugt bisher ELSTER-konformes XML (`src/domain/elster/`), die Übertragung erfolgt per manuellen Upload über MeinELSTER.
- **Geplant ab Sprint 22:** ERiC-Wrapper als Node-Native-Modul oder Supabase-Edge-Function mit C++/Java-Bindings. Die Architektur-Entscheidung (FFI via `node-addon-api` vs. Subprocess-Aufruf eines Java-Helpers) ist Teil des Sprints.

**Nicht verwechseln mit:**
- **ElsterFormular** — abgeschaltete Desktop-Anwendung, nicht ERiC
- **ElsterOnline-Portal / MeinELSTER** — Web-UI, nutzt ERiC intern, ist aber kein SDK
- **ELSTER-Transfer** — reiner Versandkanal zwischen Kanzlei-Software und BZSt für bestimmte Schnittstellen; nicht ERiC

**Anmerkungen / Edge-Cases:**
- **Lizenz:** kostenlos, aber **nicht Open-Source**. Weitergabe der Bibliothek an Dritte ist untersagt — in einem Container-Deployment muss ERiC daher in der Build-Pipeline bezogen werden, nicht im Public-Repository gespiegelt.
- **Bindings:** nur C, C++, Java, .NET. Für Node.js/TypeScript-Projekte erfordert die Integration eine FFI-Brücke.
- **Ablaufdatum pro Version:** jede ERiC-Version hat einen festen Stichtag; nach Ablauf lehnt ELSTER Übermittlungen ab. Update-Zyklus 4–6×/Jahr → automatisierter Update-Prozess ist **Betriebspflicht**, nicht optional.

---

## 13. Steueranmeldung / Steuererklärung (Gegenüberstellung)

| Feld | Inhalt |
|---|---|
| **Deutsch (primär)** | Steueranmeldung / Steuererklärung |
| **Synonyme (DE)** | — (zwei eigenständige Rechtsbegriffe, bewusst gemeinsam dokumentiert) |
| **Arabisch** | الإقرار الذاتي / الإقرار الضريبي (مفهومان متمايزان في القانون الألماني: Steueranmeldung إقرار ذاتي يُعتبر فورَ إرساله قراراً ملزماً تحت تحفظ المراجعة وفق § 168 AO؛ بينما Steuererklärung إقرار عادي لا يصبح ملزماً إلا بعد صدور قرار رسمي Steuerbescheid من مصلحة الضرائب وفق § 167 AO) |
| **Englisch (Code-Kontext)** | `tax_filing` / `tax_return` (über `filing_type`-Enum unterschieden) |
| **Kategorie** | Rechtsbegriff / Verfahrens-Unterscheidung |
| **Status** | FEST |
| **Aufgenommen am** | 2026-04-22, Terminology-Sprint 1 |

**Definition:**

**Steueranmeldung** (§§ 167, 168 AO) — der Steuerpflichtige **berechnet die Steuer selbst** und meldet sie dem Finanzamt. Die Anmeldung steht einer Steuerfestsetzung **unter Vorbehalt der Nachprüfung** gleich, sobald sie beim Finanzamt eingeht; ein Bescheid ergeht nur, wenn das Finanzamt abweicht oder bei Erstattungen die Zustimmung erteilt.

→ Beispiele: [UStVA](#7-ustva-umsatzsteuer-voranmeldung), [ZM](#8-zm-zusammenfassende-meldung), [LStA](#20-lohnsteuer-anmeldung-lsta), Umsatzsteuer-Jahreserklärung (trotz Namens: Anmeldung!).

**Steuererklärung** (§§ 149 ff. AO) — der Steuerpflichtige liefert Daten, das **Finanzamt setzt die Steuer** durch Steuerbescheid fest (§ 155 AO). Bindend wird die Festsetzung **erst mit Zugang des Bescheids**.

→ Beispiele: Einkommensteuer-Erklärung, [KSt-Erklärung](#18-körperschaftsteuer-kst), [GewSt-Erklärung](#19-gewerbesteuer-gewst), Feststellungserklärung.

**Prozess-Konsequenz für harouda-app:**
Anmeldungen erzeugen **sofort** eine Zahlungspflicht zum 10. des Folgemonats (§ 18 Abs. 1 UStG, § 41a Abs. 1 EStG). Erklärungen erzeugen erst bei Bescheid-Eingang eine Fälligkeit. Das Modul `payments` MUSS diese Unterscheidung kennen — falsche Zuordnung führt zu GoBD-relevanten Dokumentations-Lücken und potenziellen Säumniszuschlägen des Mandanten.

**Rechtsgrundlage:**
- § 149 AO — Abgabepflicht von Steuererklärungen
- § 150 AO — Form und Inhalt der Steuererklärungen
- § 155 AO — Steuerfestsetzung durch Bescheid
- § 164 AO — Vorbehalt der Nachprüfung
- § 167 AO — Steueranmeldung als Sonderform
- § 168 AO — **Wirkung der Steueranmeldung: Festsetzung unter Vorbehalt**

**Verwandte Begriffe:**
- [UStVA](#7-ustva-umsatzsteuer-voranmeldung), [ZM](#8-zm-zusammenfassende-meldung), [LStA](#20-lohnsteuer-anmeldung-lsta) — Anmeldungen
- [KSt](#18-körperschaftsteuer-kst), [GewSt](#19-gewerbesteuer-gewst) — Erklärungen
- [ELSTER](#11-elster--elektronische-steuererklärung) — gemeinsamer Übermittlungsweg
- **Steuerbescheid** — ergeht bei Erklärungen regelmäßig, bei Anmeldungen nur bei Abweichung (geplanter Eintrag Batch 3)

**Verwendung im Code:**
- `filing_type`-Enum als Diskriminator in künftiger `filings`-Tabelle: `'anmeldung' | 'erklaerung'`
- **Noch nicht implementiert.** Anmeldungen existieren derzeit in separaten Modulen (`src/domain/ustva/`; geplante `src/domain/lsta/`). Vereinheitlichung ist Bestandteil der Tax-Pipeline-Unification (Sprint 21+).
- `payments`-Modul verzweigt Fälligkeits-Logik auf `filing_type`.

**Nicht verwechseln mit:**
- **Steuerbescheid** — Verwaltungsakt i. S. v. § 155 AO, nur bei Erklärungen Regelergebnis
- **Steuervoranmeldung** (umgangssprachlich) — kein rechtlicher Terminus; gemeint ist i. d. R. die UStVA
- **Festsetzungsverjährung** (§ 169 AO) — andere Rechtsfrage, hier nicht gemeint

**Anmerkungen / Edge-Cases:**
- **Die Umsatzsteuer-Jahreserklärung** (§ 18 Abs. 3 UStG) ist — trotz des Wortbestandteils "Erklärung" — **eine Anmeldung** (BFH v. 15.05.1986, V R 24/81). Im `filing_type`-Enum DARF sie NICHT als `erklaerung` klassifiziert werden. Bei Abbildung im Code Kommentar mit Rechtsprechungsverweis pflichtig.
- **Zustimmungsfiktion nach § 168 AO:** bei unzulässigen Anmeldungen (z. B. Null-Festsetzung ohne Grundlage) kann das Finanzamt die Fiktion verweigern. Juristisch heikel — bei Zweifeln Rücksprache mit Steuerberater.
- Aus Compliance-Perspektive ist die Anmeldung **riskanter** für den Mandanten: ein einmal fehlerhaft übermittelter Wert wird sofort verbindlich und nur via Berichtigung (§ 153 AO) oder Änderung der Steuerfestsetzung korrigierbar.

---

## 14. Steuernummer

| Feld | Inhalt |
|---|---|
| **Deutsch (primär)** | Steuernummer |
| **Synonyme (DE)** | St.-Nr., SteuerNr, Steuer-Nr. |
| **Arabisch** | الرقم الضريبي الأساسي (المُعرِّف الصادر عن مصلحة الضرائب المحلية — Finanzamt — لكل مكلّف داخل منطقتها الإدارية في ألمانيا؛ يختلف تماماً عن USt-IdNr الأوروبي، وقد يتغيّر عند انتقال المكلَّف إلى منطقة مصلحة ضرائب أخرى) |
| **Englisch (Code-Kontext)** | `tax_number` (Datenbank-Feld) |
| **Kategorie** | Datentyp / Rechtsbegriff |
| **Status** | FEST |
| **Aufgenommen am** | 2026-04-22, Terminology-Sprint 1 |

**Definition:**
Die vom örtlich zuständigen Finanzamt vergebene Ordnungsnummer eines Steuerpflichtigen. Primärer Ordnungsschlüssel im Besteuerungsverfahren für [KSt](#18-körperschaftsteuer-kst), [GewSt](#19-gewerbesteuer-gewst), ESt, LSt und allgemeine Aktenführung. **Pro Finanzamt eindeutig, aber nicht deutschlandweit eindeutig** — beim Wechsel des Wohn- oder Betriebssitzes in den Bezirk eines anderen Finanzamts wird eine neue Nummer vergeben, die alte bleibt historisch zugeordnet.

**Format:**
- 10- oder 11-stellig, bundesland-spezifisch strukturiert (z. B. Bayern: `nnn/nnnn/nnnn` = Bezirk / Unterscheidungsnummer / Prüfziffer)
- **Vereinheitlichtes ELSTER-Format** für elektronische Übermittlung: 13 Ziffern ohne Trennzeichen, Bundesland-Präfix + intern aufgefüllte Steuernummer

**Rechtsgrundlage:**
- § 139a AO — Identifikationsmerkmale (definiert TIN-Rahmen; Steuernummer als Altsystem bis Wirtschafts-IdNr flächendeckend eingeführt ist)
- § 8 AO — Wohnsitz-Begriff (bestimmt örtliche Zuständigkeit)
- § 20 AO — Zuständigkeit bei Körperschaften
- AEAO (Anwendungserlass zur AO) zu § 139a

**Verwandte Begriffe:**
- [USt-IdNr](#4-ust-idnr-umsatzsteuer-identifikationsnummer) — separate Nummer nur für innergemeinschaftlichen Warenverkehr, **nicht** die Steuernummer
- **Steuer-Identifikationsnummer (IdNr, Steuer-ID)** — 11-stellige **persönliche** Nummer nach § 139b AO, bundeseinheitlich und lebenslang unverändert; NICHT Steuernummer
- **Wirtschafts-Identifikationsnummer (W-IdNr)** — im Rollout befindlich (§ 139c AO), soll die Steuernummer langfristig ablösen
- **Finanzamt** — ausstellende Behörde (geplanter Eintrag Batch 3)
- [KSt](#18-körperschaftsteuer-kst), [GewSt](#19-gewerbesteuer-gewst), [LStA](#20-lohnsteuer-anmeldung-lsta) — alle Meldungen führen Steuernummer im Header

**Verwendung im Code:**
- `clients.tax_number` — Datenbank-Feld, `VARCHAR(13)`, nullable (ausländische Mandanten ohne DE-Steuernummer)
- Validator `src/domain/validators/taxNumberValidator.ts` (geplant Sprint 21) — muss alle 16 Bundesland-Formate akzeptieren und in ELSTER-13-Stellen-Form transformieren
- ELSTER-XML-Header: `Steuernummer`-Element obligat für alle Anmeldungen und Erklärungen außer ZM (nutzt stattdessen USt-IdNr)

**Nicht verwechseln mit:**
- **USt-IdNr** (§ 27a UStG) — nur innergemeinschaftlich, vom BZSt vergeben, Format `DE` + 9 Ziffern
- **Steuer-IdNr / Steuer-ID** (§ 139b AO) — persönliche 11-stellige Nummer, bundesweit und lebenslang gleich
- **Wirtschafts-IdNr** (§ 139c AO) — kommende einheitliche Unternehmens-Nummer, noch im Aufbau
- **Handelsregister-Nummer (HRB, HRA)** — eigene Registerkennung, kein steuerlicher Identifikator

**Anmerkungen / Edge-Cases:**
- **Umzug eines Mandanten** in einen anderen FA-Bezirk → neue Steuernummer; die alte DARF NICHT gelöscht werden (GoBD-Aufbewahrungspflicht für historische Meldungen → Versionierung im Datenmodell pflichtig).
- **Kleinunternehmer** (§ 19 UStG) ohne USt-IdNr haben die Steuernummer als **einzigen** steuerlichen Identifikator → UI muss sie als Pflichtfeld behandeln.
- **Rollout W-IdNr** (seit 2024): sobald ein Mandant eine W-IdNr erhält, muss harouda-app beide Felder parallel halten. Tech-Debt-Kandidat für Sprint 22.

---

## 15. E-Bilanz

| Feld | Inhalt |
|---|---|
| **Deutsch (primär)** | E-Bilanz |
| **Synonyme (DE)** | elektronische Bilanzübermittlung, § 5b-Bilanz |
| **Arabisch** | الميزانية الإلكترونية الإلزامية (إرسال Bilanz و Gewinn- und Verlustrechnung إلى مصلحة الضرائب بصيغة XBRL بدلاً من الورق، بناءً على § 5b EStG — إلزامي لكل من يمسك دفاتر تجارية منذ السنة المالية 2013) |
| **Englisch (Code-Kontext)** | `e_bilanz` (Modul-Präfix) |
| **Kategorie** | Verfahren / Elektronische Meldung |
| **Status** | FEST |
| **Aufgenommen am** | 2026-04-22, Terminology-Sprint 1 |

**Definition:**
Pflicht zur elektronischen Übermittlung der Bilanz und der Gewinn- und Verlustrechnung (sowie bestimmter Zusatzinformationen) an das Finanzamt in einem standardisierten XBRL-Datensatz. Ersetzt seit dem Wirtschaftsjahr 2013 die papierbasierte Bilanz als Anhang zur Steuererklärung. Gilt für alle bilanzierenden Steuerpflichtigen (Kaufleute nach § 238 HGB, Körperschaften, Personengesellschaften mit Bilanzierung).

**Umfang:**
- Bilanz (Aktiva/Passiva)
- Gewinn- und Verlustrechnung
- Steuerliche Gewinnermittlung (Überleitungsrechnung von Handels- zu Steuerbilanz)
- Kontennachweise (nicht obligat, nur auf Anforderung)

**Rechtsgrundlage:**
- **§ 5b EStG** — elektronische Bilanzübermittlung (Kernvorschrift)
- BMF-Schreiben vom 28.09.2011 zur Erstanwendung; zuletzt BMF vom 02.07.2024 zur aktuellen Taxonomie
- Jährliche Veröffentlichung der Kern-Taxonomie-Version durch das BMF

**Verwandte Begriffe:**
- [XBRL](#16-xbrl) — technisches Übermittlungsformat
- [Kern-Taxonomie](#17-kern-taxonomie) — jährlich aktualisiertes Schema
- [HGB §§ 266, 275, 285](./01-grundlagen.md#3-handelsgesetzbuch-hgb) — Gliederungsvorgaben, die die Taxonomie umsetzt
- [Jahresabschluss](./05-jahresabschluss.md) — Oberbegriff (geplanter Eintrag)
- [ELSTER](#11-elster--elektronische-steuererklärung) — Übermittlungsweg
- **Härtefallregelung** § 5b Abs. 2 EStG — Ausnahme auf Antrag (wirtschaftliche/persönliche Unzumutbarkeit)

**Verwendung im Code:**
- `src/domain/ebilanz/` — **noch nicht implementiert**, Sprint 21+ vorgesehen
- `src/domain/jahresabschluss/` (existiert) — liefert die HGB-Bilanz, die in E-Bilanz-XBRL gemappt wird
- Migration `0019_hgb_balance_sheet.sql` (Closure-Table) — Fundament für Taxonomie-Mapping
- Offener Tech-Debt: `XBRL-MULTI-VERSION` — parallele Unterstützung Taxonomie 6.6/6.7/6.9 erforderlich

**Nicht verwechseln mit:**
- **E-Rechnung** (XRechnung/ZUGFeRD) — ganz anderer Kontext (§ 14 UStG, Rechnungsaustausch), nicht E-Bilanz
- **Offenlegung im Bundesanzeiger** (§ 325 HGB) — handelsrechtliche Publizitätspflicht, läuft separat und nicht über ELSTER
- **EÜR** (Einnahmen-Überschuss-Rechnung, § 4 Abs. 3 EStG) — eigene Anlage für Nicht-Bilanzierer, keine E-Bilanz

**Anmerkungen / Edge-Cases:**
- **Kleinstunternehmen** nach § 267a HGB dürfen reduzierte Gliederungstiefe nutzen — die Renderer-Logik muss dies unterstützen.
- **Erstmalige Abgabe:** Die Eröffnungsbilanz des ersten E-Bilanz-Jahres muss mit dem Abschluss des Vorjahres wertidentisch sein. Automatische Plausibilitätsprüfung = Pflichtfeature.
- **Steuerliche Überleitung:** Abweichungen Handels-/Steuerbilanz lassen sich als "Umgliederung" oder "Wertanpassung" abbilden — die Wahl hat bei späterer Betriebsprüfung Auswirkung. **Bei komplexen Fällen Steuerberater konsultieren**.

---

## 16. XBRL

| Feld | Inhalt |
|---|---|
| **Deutsch (primär)** | XBRL |
| **Synonyme (DE)** | eXtensible Business Reporting Language (ausgeschriebene Form) |
| **Arabisch** | لغة تقارير الأعمال القابلة للامتداد (معيار دولي مفتوح مبني على XML لتبادل البيانات المالية الهيكلية بين المنشآت والجهات الرقابية — تعتمده المالية الألمانية شكلاً وحيداً لإرسال E-Bilanz) |
| **Englisch (Code-Kontext)** | XBRL (Eigenname, nicht übersetzt) |
| **Kategorie** | Datenformat / Technischer Standard |
| **Status** | FEST |
| **Aufgenommen am** | 2026-04-22, Terminology-Sprint 1 |

**Definition:**
Internationaler, XML-basierter Standard zur strukturierten Übermittlung von Geschäftsdaten. Jeder Datenwert (z. B. "Umsatzerlöse 1.250.000 €") wird nicht als Freitext, sondern als semantisch getaggter `fact` mit Verweis auf ein Taxonomie-Konzept übertragen. Dadurch kann die Finanzverwaltung Inhalte maschinell vergleichen, prüfen und aggregieren. Entwickelt und gepflegt vom XBRL International Inc. (Non-Profit-Konsortium).

**Kernkomponenten:**
- **Instance Document** — die konkrete Einreichung (z. B. eine bestimmte E-Bilanz)
- **Taxonomy** — das Begriffs- und Gliederungsschema (für E-Bilanz: Kern-Taxonomie)
- **Linkbases** — definieren Beziehungen zwischen Konzepten (Label, Berechnung, Präsentation, Definition)
- **Extensions** — Verlängerungen der Kern-Taxonomie (Branchentaxonomien: Banken, Versicherungen, Wohnungswirtschaft)

**Rechtsgrundlage:**
- Keine eigene deutsche Rechtsnorm für XBRL als Standard
- Über § 5b EStG + jährliches BMF-Schreiben faktisch als Pflichtformat gesetzt
- XBRL-Spezifikation ist offener Standard des XBRL International Inc.

**Verwandte Begriffe:**
- [E-Bilanz](#15-e-bilanz) — deutscher Hauptanwendungsfall
- [Kern-Taxonomie](#17-kern-taxonomie) — konkretes deutsches XBRL-Schema
- [ERiC](#12-eric--elster-rich-client) — validiert XBRL-Instances clientseitig
- [ELSTER](#11-elster--elektronische-steuererklärung) — Übermittlungsweg

**Verwendung im Code:**
- `src/domain/ebilanz/xbrl/` — **noch nicht implementiert**, Sprint 21+
- **Bibliotheksentscheidung offen:** eigene TypeScript-Implementierung vs. externe Library (`xbrl.js`, Arelle als Subprocess). Architect-Empfehlung: eigene minimale Implementation, da externe Libraries deutsche Taxonomie-Spezifika selten vollständig abdecken und ein Wartungsrisiko darstellen.
- **Zweistufige Validierung** pflichtig: (1) lokale XBRL-Well-Formedness + Schema-Check, (2) finale Validierung durch ERiC vor Übermittlung.

**Nicht verwechseln mit:**
- **XML** — XBRL IST ein XML-Dialekt, aber mit strengen semantischen Zusatzregeln (Contexts, Facts, Linkbases)
- **XRechnung / ZUGFeRD** — elektronische Rechnungsformate (geplanter Eintrag in `06-belege-rechnung.md`); ebenfalls XML, aber Schema-Familie CEN-16931 (UBL/CII), kein XBRL
- **iXBRL** (inline XBRL) — hybride HTML+XBRL-Darstellung; die deutsche Finanzverwaltung akzeptiert für E-Bilanz nur "klassisches" XBRL, kein iXBRL

**Anmerkungen / Edge-Cases:**
- **Dezimalgenauigkeit:** XBRL-Facts haben ein `decimals`-Attribut. Bei Geldbeträgen in Cent immer `decimals="-2"`. **Kritisch:** Float-Repräsentation in JavaScript DARF NIE direkt serialisiert werden — Decimal.js-Werte MÜSSEN als String-Repräsentation in den XBRL-Fact geschrieben werden (projektweite Invariante).
- **Contexts:** jeder Fact verweist auf einen `<xbrli:context>`, der Periode und Entity identifiziert. Wiederverwendung spart Platz, ist aber fehleranfällig → Context-Generator muss deterministisch und deduplizierend sein.
- **Namespaces:** Taxonomie-Versionen nutzen unterschiedliche Namespace-URIs (z. B. `de-gaap-ci-2023-04-30` vs. `de-gaap-ci-2024-04-01`). Multi-Version-Support erfordert dynamische Namespace-Verwaltung.

---

## 17. Kern-Taxonomie

| Feld | Inhalt |
|---|---|
| **Deutsch (primär)** | Kern-Taxonomie |
| **Synonyme (DE)** | Kerntaxonomie (ohne Bindestrich), HGB-Taxonomie, deutsche E-Bilanz-Taxonomie |
| **Arabisch** | التاكسونومي الأساسي للميزانية الإلكترونية (المخطط الرسمي بصيغة XBRL الذي تصدره وزارة المالية الاتحادية سنوياً ويحدّد أسماء ومعاني جميع البنود التي يجب تضمينها في E-Bilanz؛ الإصدار الإلزامي الحالي للسنة المالية 2026 هو 6.9) |
| **Englisch (Code-Kontext)** | `kern_taxonomie` (Modul-Präfix) |
| **Kategorie** | Schema / Standard |
| **Status** | FEST |
| **Aufgenommen am** | 2026-04-22, Terminology-Sprint 1 |

**Definition:**
Die offizielle, vom BMF jährlich (bzw. bei Bedarf häufiger) veröffentlichte XBRL-Taxonomie für die E-Bilanz-Übermittlung in Deutschland. Definiert alle Konzepte, Gliederungshierarchien und Pflichtangaben, die eine elektronisch übermittelte Bilanz/GuV erfüllen muss. Versioniert als `Kerntaxonomie 6.x`; jede Version ist für ein bestimmtes Wirtschaftsjahr (oder einen Satz von Wirtschaftsjahren) verbindlich. Die Veröffentlichung einer neuen Version erfolgt in der Regel Mitte des Jahres vor ihrer Verbindlichkeit.

**Versionshistorie (projektrelevant):**

| Version | Verbindlich für Wirtschaftsjahre ab |
|---|---|
| 6.5 | 2022 |
| 6.6 | 2023 |
| 6.7 | 2024 |
| 6.8 | 2025 |
| 6.9 | 2026 |

*Stichtage und Übergangsfristen sind dem jeweiligen BMF-Schreiben zu entnehmen.*

**Rechtsgrundlage:**
- § 5b Abs. 1 Satz 1 EStG — Pflicht-Datensatz "nach amtlich vorgeschriebenem Datensatz"
- Jährliches BMF-Schreiben zur Veröffentlichung der Taxonomie-Version (zuletzt BMF vom 02.07.2024 zur Taxonomie 6.9)
- Bundessteuerblatt-Publikation der XBRL-Schema-Dateien

**Verwandte Begriffe:**
- [E-Bilanz](#15-e-bilanz) — Anwendung der Kern-Taxonomie
- [XBRL](#16-xbrl) — Trägerformat
- **Branchentaxonomien** — Sondertaxonomien (Banken, Versicherungen, Wohnungswirtschaft, Land-/Forstwirtschaft) — **außerhalb des harouda-app-MVP-Scopes**
- [HGB §§ 266, 275, 285](./01-grundlagen.md#3-handelsgesetzbuch-hgb) — handelsrechtliche Gliederungsvorgaben, die die Taxonomie umsetzt

**Verwendung im Code:**
- `src/domain/ebilanz/taxonomie/` (geplant Sprint 21) — Taxonomie-Loader + Konzept-Mapper
- **Multi-Version-Support (Tech-Debt `XBRL-MULTI-VERSION`):** eine harouda-app-Installation MUSS gleichzeitig Bilanzen nach Taxonomie 6.6 (Altjahre), 6.7 und 6.9 erzeugen können, da verschiedene Mandanten mit unterschiedlichen Wirtschaftsjahren unterschiedlichen Pflichtversionen unterliegen.
- Zuordnungsstrategie: `wirtschaftsjahr_beginn` → `kern_taxonomie_version` via Lookup-Tabelle `kern_taxonomie_versions` (Migration geplant)

**Nicht verwechseln mit:**
- **SKR03 / SKR04** — Kontenrahmen der Buchhaltung (DATEV-Standard), NICHT die Taxonomie. Kontenrahmen-Salden werden auf Taxonomie-Konzepte **gemappt** (1:n, nicht 1:1).
- **US-GAAP-Taxonomie, IFRS-Taxonomie** — internationale Taxonomien, irrelevant für deutsche E-Bilanz
- **Branchentaxonomie** — ergänzt die Kern-Taxonomie, aber nur für spezifische Branchen

**Anmerkungen / Edge-Cases:**
- **GCD-Modul (Global Common Document):** Pflicht-Stammdaten-Kopf jeder Einreichung — Mandantendaten, Finanzamt-Kontext, Wirtschaftsjahr. MUSS VOR dem Fin-Modul (Financial Data) erstellt werden.
- **Mindestumfang-Regeln:** bestimmte Konzepte sind `mustExist="true"`, andere rechnerisch (aus Unterposten aggregierbar). Falsche Einstufung führt zu ERiC-Ablehnung der gesamten Einreichung.
- **Ablauf einer Taxonomie-Version:** nach dem offiziellen Stichtag nimmt ELSTER keine Einreichungen mehr an. Die verwendete Taxonomie-Version MUSS im Audit-Trail jeder Einreichung archiviert werden (GoBD Rz. 107, Unveränderbarkeit der Verfahrensdokumentation).

---

## 18. Körperschaftsteuer (KSt)

| Feld | Inhalt |
|---|---|
| **Deutsch (primär)** | Körperschaftsteuer |
| **Synonyme (DE)** | KSt (Abkürzung, bevorzugt im Code und in UI) |
| **Arabisch** | ضريبة دخل الشركات الرأسمالية (ضريبة اتحادية تُفرض على أرباح الأشخاص الاعتباريين — GmbH, UG, AG, eG, الجمعيات والمؤسسات — بنسبة موحّدة 15٪ + رسم التضامن 5.5٪، وتُقدَّم سنوياً كإقرار Steuererklärung يُنتج عنه قرار رسمي Steuerbescheid من مصلحة الضرائب) |
| **Englisch (Code-Kontext)** | `corporate_income_tax` (Datenbank-Feld), `kst` (Modul-Präfix) |
| **Kategorie** | Steuerart / Rechtsbegriff |
| **Status** | FEST |
| **Aufgenommen am** | 2026-04-22, Terminology-Sprint 1 |

**Definition:**
Bundessteuer auf das Einkommen juristischer Personen (Körperschaften) nach dem Körperschaftsteuergesetz (KStG). Regelsteuersatz: **15 %** auf das zu versteuernde Einkommen (§ 23 Abs. 1 KStG), zuzüglich **5,5 % Solidaritätszuschlag** auf die KSt (effektive Belastung ca. 15,825 %). Betroffen sind insbesondere GmbH, UG, AG, KGaA, eG, SE sowie nicht-steuerbefreite Vereine und Stiftungen.

**Ablauf:**
- **Jahreserklärung (KSt 1 A + Anlagen):** Steuererklärung i. S. v. § 149 AO → Finanzamt setzt per Steuerbescheid fest (keine Anmeldung!)
- **Vorauszahlungen** vierteljährlich (10.03. / 10.06. / 10.09. / 10.12.) auf Grundlage der letzten Festsetzung (§ 31 KStG i. V. m. § 37 EStG)
- **Besteuerungszeitraum:** Kalenderjahr (§ 7 Abs. 3 KStG), abweichendes Wirtschaftsjahr nach § 7 Abs. 4 KStG möglich

**Rechtsgrundlage (KStG als Rahmen in diesem Eintrag integriert):**

Körperschaftsteuergesetz (KStG) vom 31.08.1976, geltende Fassung:
- § 1 KStG — unbeschränkte Steuerpflicht
- § 7 KStG — Grundlage der Besteuerung (zu versteuerndes Einkommen)
- § 8 KStG — Ermittlung des Einkommens (verweist auf EStG)
- § 8b KStG — Beteiligungserträge / Schachtelprivileg (95 %-Freistellung)
- § 23 KStG — Steuersatz 15 %
- § 26 KStG — Anrechnung ausländischer Steuern
- § 31 KStG — Entstehung der Steuer + Vorauszahlungen
- **Solidaritätszuschlaggesetz (SolZG):** 5,5 % auf die KSt

**Verwandte Begriffe:**
- [GewSt](#19-gewerbesteuer-gewst) — parallele Gewerbesteuer; zusammen ergibt sich für Kapitalgesellschaften eine Gesamtbelastung von ca. 30 %
- [E-Bilanz](#15-e-bilanz) — Pflichtanhang der KSt-Erklärung bei bilanzierenden Körperschaften
- [ELSTER](#11-elster--elektronische-steuererklärung) — elektronischer Übermittlungsweg (Formular KSt 1 A)
- [Steuererklärung](#13-steueranmeldung--steuererklärung-gegenüberstellung) — Verfahrensart (KSt ist Erklärung, keine Anmeldung)
- **Einkommensteuer (ESt)** — Pendant für natürliche Personen (geplanter Eintrag Batch 3)

**Verwendung im Code:**
- `src/domain/kst/` — **noch nicht implementiert**, Sprint 23+ vorgesehen
- `clients.legal_form` — Unterscheidungsmerkmal (Kapitalgesellschaft ja/nein → KSt-pflichtig ja/nein)
- `src/domain/tax/burdenCalculator.ts` (geplant) — kombinierter Belastungsrechner KSt + SolZ + GewSt

**Nicht verwechseln mit:**
- **ESt (Einkommensteuer)** — natürliche Personen und Personengesellschaften; völlig andere Tarifsystematik (progressiv)
- **GewSt** — läuft **zusätzlich** auf Gemeindeebene; bei Kapitalgesellschaften NICHT auf KSt anrechenbar (§ 35 EStG gilt nur für natürliche Personen)
- **USt (Umsatzsteuer)** — unabhängig von KSt; andere Steuerart
- **Kapitalertragsteuer (KapESt)** — Abzugsteuer bei Ausschüttung an Gesellschafter, eigene Norm (§ 43 EStG)

**Anmerkungen / Edge-Cases:**
- **Organschaft** (§§ 14–19 KStG): Gewinnabführungsvertrag + finanzielle Eingliederung → Einkommen der Organgesellschaft wird dem Organträger zugerechnet. Architektonisch aufwendig (Mandantengruppen statt Einzelmandant); derzeit außerhalb des Scopes.
- **Verdeckte Gewinnausschüttung (vGA, § 8 Abs. 3 Satz 2 KStG):** GoBD-relevant — jede auffällige Geschäftsbeziehung zum Gesellschafter ist belegpflichtig. Bei Unklarheit **Rücksprache mit Steuerberater**.
- **Mindestbesteuerung** (§ 10d EStG i. V. m. § 8 Abs. 1 KStG): Verlustvortrag nur zu 60 % oberhalb 1 Mio. € — wichtig für Steuerplanungs-UI und Prognoserechner.

---

## 19. Gewerbesteuer (GewSt)

| Feld | Inhalt |
|---|---|
| **Deutsch (primär)** | Gewerbesteuer |
| **Synonyme (DE)** | GewSt (Abkürzung, bevorzugt im Code und in UI) |
| **Arabisch** | الضريبة البلدية على النشاط التجاري (ضريبة محلية تجمعها البلدية — Gemeinde — على أرباح كل نشاط تجاري داخل حدودها الجغرافية؛ تُحتسب بضرب Messbetrag × Hebesatz الذي تحدده كل بلدية على حدة؛ الحد الأدنى القانوني للـ Hebesatz هو 200٪، والممارسون المستقلون — Freiberufler — معفون منها) |
| **Englisch (Code-Kontext)** | `trade_tax` (Datenbank-Feld), `gewst` (Modul-Präfix) |
| **Kategorie** | Steuerart / Rechtsbegriff |
| **Status** | FEST |
| **Aufgenommen am** | 2026-04-22, Terminology-Sprint 1 |

**Definition:**
Kommunale Sachsteuer auf den **Gewerbeertrag** jedes im Inland betriebenen gewerblichen Unternehmens, erhoben durch die Gemeinde, in der sich eine Betriebsstätte befindet. **Freiberuflich Tätige** i. S. v. § 18 EStG sind **nicht** gewerbesteuerpflichtig — zentrale Abgrenzung bei gemischten Tätigkeiten (Abfärbewirkung § 15 Abs. 3 EStG).

**Berechnung (Kernformel):**
```
Gewerbeertrag                    (§ 7 GewStG, nach Hinzurechnungen/Kürzungen §§ 8, 9)
× 3,5 %                          (Steuermesszahl, § 11 Abs. 2 GewStG)
= Gewerbesteuer-Messbetrag
× Hebesatz                       (je Gemeinde)
= festzusetzende Gewerbesteuer
```

**Hebesatz (in diesen Eintrag integriert):**
- Festgelegt durch Satzung der jeweiligen Gemeinde (§ 16 Abs. 1 GewStG)
- **Gesetzlicher Mindest-Hebesatz: 200 %** (§ 16 Abs. 4 Satz 2 GewStG)
- Bandbreite in Deutschland: 200 % (einige "Steueroasen-Gemeinden") bis ca. 580 % (München, Frankfurt a. M., Oberhausen)
- **Mehrere Betriebsstätten** → Zerlegung des Messbetrags nach Lohnsummen (§§ 28 ff. GewStG); jede Gemeinde erhebt mit eigenem Hebesatz auf ihren Zerlegungsanteil

**Rechtsgrundlage (GewStG als Rahmen in diesen Eintrag integriert):**

Gewerbesteuergesetz (GewStG) vom 15.10.2002, geltende Fassung:
- § 2 GewStG — Gegenstand (jeder inländische Gewerbebetrieb)
- § 7 GewStG — Gewerbeertrag
- § 8 GewStG — Hinzurechnungen (u. a. 25 % der Miet- und Pachtzinsen oberhalb des Freibetrags)
- § 9 GewStG — Kürzungen (u. a. 1,2 % des Einheitswerts des Grundbesitzes)
- § 11 GewStG — Steuermesszahl 3,5 % + Freibetrag 24.500 € (natürliche Personen / Personengesellschaften)
- § 16 GewStG — Hebesatz und Mindest-Hebesatz
- §§ 28–34 GewStG — Zerlegung auf mehrere Gemeinden
- **§ 35 EStG** — Anrechnung auf die ESt bei natürlichen Personen (max. 4,0 × Messbetrag); **NICHT bei Kapitalgesellschaften**

**Verwandte Begriffe:**
- [KSt](#18-körperschaftsteuer-kst) — parallele Belastung bei Kapitalgesellschaften
- [E-Bilanz](#15-e-bilanz) — Pflichtanhang der GewSt-Erklärung bei Bilanzierern
- [ELSTER](#11-elster--elektronische-steuererklärung) — elektronischer Übermittlungsweg (GewSt 1 A)
- [Steuererklärung](#13-steueranmeldung--steuererklärung-gegenüberstellung) — Verfahrensart; **Besonderheit:** Messbescheid ergeht vom Finanzamt, der eigentliche GewSt-Bescheid von der Gemeinde
- **Freibetrag 24.500 €** — nur bei natürlichen Personen und Personengesellschaften (§ 11 Abs. 1 Nr. 1 GewStG); **nicht** bei Kapitalgesellschaften

**Verwendung im Code:**
- `src/domain/gewst/` — **noch nicht implementiert**, Sprint 23+
- `clients.gemeinde_id` / Lookup auf `gemeinden.hebesatz` (geplant) — **dynamische Datenquelle zwingend erforderlich**, da Hebesätze sich jährlich ändern
- Datenpflege-Empfehlung: jährlicher CSV-Import aus DIHK-Hebesatz-Statistik oder destatis-Daten

**Nicht verwechseln mit:**
- **KSt** — GewSt läuft **zusätzlich**, nicht anstelle; bei Kapitalgesellschaften keine Anrechnung
- **Grundsteuer** — ebenfalls kommunal, aber auf Grundbesitz, nicht Gewerbeertrag
- **Lohnsummensteuer** — ältere Steuer, 1979 abgeschafft, nicht GewSt
- **GewSt-Messbescheid vs. GewSt-Bescheid** — ersterer vom Finanzamt (setzt den Messbetrag fest), letzterer von der Gemeinde (setzt die konkret zu zahlende Steuer fest)

**Anmerkungen / Edge-Cases:**
- **Abfärbetheorie** (§ 15 Abs. 3 Nr. 1 EStG): eine auch nur geringfügige gewerbliche Teiltätigkeit einer Freiberufler-Sozietät macht die **gesamte** Sozietät gewerbesteuerpflichtig. UI-Warnung bei gemischten Tätigkeitsschlüsseln wichtig; bei Grenzfällen **Steuerberater konsultieren**.
- **Mehrere Betriebsstätten:** Zerlegungsbescheid erforderlich; jede Gemeinde erhält Messbetrag-Anteil entsprechend Lohnsumme. Komplexe Modellierung → im MVP nur Single-Betriebsstätte vorgesehen.
- **Aktualität der Hebesatz-Daten:** ein veralteter Hebesatz führt zu fehlerhaften Prognosen/Vorauszahlungen und potenziell zu Säumniszuschlägen. Datenpflege-Prozess MUSS dokumentiert und mandantenübergreifend reproduzierbar sein (GoBD Rz. 100 ff. zur Stammdatenpflege).

---

## 20. Lohnsteuer-Anmeldung (LStA)

| Feld | Inhalt |
|---|---|
| **Deutsch (primär)** | Lohnsteuer-Anmeldung |
| **Synonyme (DE)** | LStA (Abkürzung, bevorzugt), LSt-Anmeldung |
| **Arabisch** | إقرار ضريبة الأجور الذاتي (إقرار ذاتي يُقدِّمه صاحب العمل شهرياً أو ربع سنوياً أو سنوياً إلى مصلحة الضرائب، يحتسب فيه بنفسه ضرائب الأجور — Lohnsteuer — وضريبة الكنيسة ورسم التضامن المقتطعة من رواتب موظفيه، ويدفعها حتى العاشر من الشهر التالي وفق § 41a EStG) |
| **Englisch (Code-Kontext)** | `lsta` / `wage_tax_filing` (Modul-Präfix) |
| **Kategorie** | Meldung / Steueranmeldung |
| **Status** | FEST |
| **Aufgenommen am** | 2026-04-22, Terminology-Sprint 1 |

**Definition:**
Regelmäßig wiederkehrende **Steueranmeldung** (§ 167 AO) des Arbeitgebers über die einbehaltene Lohnsteuer (LSt), Kirchensteuer (KiSt) und den Solidaritätszuschlag (SolZ) seiner Arbeitnehmer. Der Arbeitgeber berechnet die Beträge selbst auf Grundlage der ELStAM-Daten, meldet sie elektronisch über ELSTER und überweist sie im gleichen Schritt an das Betriebsstätten-Finanzamt.

**Anmeldungszeitraum (§ 41a Abs. 2 EStG):**

| Zeitraum | Bedingung |
|---|---|
| Monatlich | abgeführte LSt im Vorjahr **> 5.000 €** |
| Vierteljährlich | abgeführte LSt **> 1.080 € und ≤ 5.000 €** |
| Jährlich | abgeführte LSt **≤ 1.080 €** |

**Fälligkeit:** jeweils am **10. des Folgemonats** (bzw. 10. des Monats nach Quartalsende / 10. Januar für jährliche Anmeldung). Anmeldung und Zahlung laufen synchron.

**Rechtsgrundlage:**
- § 41a Abs. 1 EStG — elektronische Pflicht-Anmeldung
- § 41a Abs. 2 EStG — Anmeldungszeitraum (Grenzwerte)
- § 38 EStG — Lohnsteuer als Quellensteuer (Arbeitgeberhaftung)
- § 39b EStG — Berechnung der einzubehaltenden LSt
- §§ 167, 168 AO — Wirkung der Steueranmeldung
- **ELStAM-Verfahren** (§§ 39, 39e EStG) — elektronische Lohnsteuer-Abzugsmerkmale

**Verwandte Begriffe:**
- [ELSTER](#11-elster--elektronische-steuererklärung) — verpflichtender Übermittlungsweg
- [Steueranmeldung](#13-steueranmeldung--steuererklärung-gegenüberstellung) — Verfahrensart (LStA ist **Anmeldung**, keine Erklärung)
- [03-lohn-sv.md](./03-lohn-sv.md) (geplant) — Lohn- und Sozialversicherungsbegriffe; LStA ist bewusst HIER statt dort einsortiert, weil sie ihrem Wesen nach eine steuerliche Meldung ist
- **Lohnsteuer-Außenprüfung** (§ 42f EStG) — eigene Prüfungsart, auf LSt begrenzt
- **Lohnsteuerbescheinigung** (§ 41b EStG) — jährliche Einzelmeldung pro Arbeitnehmer, **NICHT** die LStA

**Verwendung im Code:**
- `src/domain/lsta/` — **noch nicht implementiert**, Sprint 22+ geplant
- Integration mit künftigem Payroll-Modul: LStA aggregiert pro Mitarbeiter berechnete LSt/KiSt/SolZ-Beträge
- XML-Schema: identische ELSTER-Pipeline wie UStVA, mit eigenem `LStA`-Wurzelelement

**Nicht verwechseln mit:**
- **Lohnsteuer-Jahresausgleich** (§ 42b EStG) — interner Arbeitgeber-Ausgleich, keine ELSTER-Meldung
- **Lohnsteuerbescheinigung** (§ 41b EStG) — jährliche Meldung **pro Arbeitnehmer** via ELSTER-eTIN-Verfahren, separat
- **Beitragsnachweis zur Sozialversicherung (DEÜV)** — zeitgleicher Prozess, aber **anderer Rechtsrahmen** (Sozialrecht, nicht Steuerrecht) → gehört in `03-lohn-sv.md`
- **ESt-Veranlagung des Arbeitnehmers** — separates Jahresverfahren; die LSt ist nur Vorauszahlung darauf

**Anmerkungen / Edge-Cases:**
- **Dauerfristverlängerung (§ 46 UStDV) gilt nur für UStVA, NICHT für LStA.** UI-Hinweis bei Verwechslungsgefahr pflichtig.
- **Nullmeldung:** solange Mitarbeiter bestehen, ist auch bei 0 € LSt eine Anmeldung abzugeben. Vollständige Abmeldung setzt formelle Einstellung der Lohnzahlung voraus.
- **Mehrere Betriebsstätten:** separate LStA je zuständigem Betriebsstätten-Finanzamt → mehrere ELSTER-Übertragungen pro Periode; das `lsta`-Modul muss Multi-FA-Fähigkeit nativ unterstützen.
- **Wechsel des Anmeldungszeitraums:** erfolgt zum Jahreswechsel automatisch auf Basis des Vorjahres-Volumens. Die Logik MUSS zum Jahreswechsel prüfen und eine Benutzerwarnung auslösen, wenn sich der Rhythmus ändert.
