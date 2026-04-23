# 07 · Anlagen & Inventur — Anlagevermögen, AK/HK, AfA, GWG, Teilwert, Inventar, Festwert

**Inhalt:** Alle Begriffe rund um die Bilanzierung und Abschreibung des Anlagevermögens sowie den jährlichen Bestandsnachweis. Die inhaltliche Achse verläuft von der **Einordnung** (was ist Anlagevermögen nach § 247 Abs. 2 HGB — drei Kategorien Sachanlagen, Immaterielle, Finanzanlagen) über die **Erstbewertung** (Anschaffungs- und Herstellungskosten nach § 255 HGB) und die **planmäßige Wertfortschreibung** über die Nutzungsdauer (AfA nach § 7 EStG in Verbindung mit den BMF-AfA-Tabellen) bis zu den zwei zentralen **Vereinfachungsinstrumenten** für geringwertige Gegenstände: **GWG-Sofortabzug** (§ 6 Abs. 2 EStG, 800 € netto) und **Poolabschreibung / Sammelposten** (§ 6 Abs. 2a EStG, 250–1.000 € netto). Ergänzt durch die **außerplanmäßige Abschreibung auf den Teilwert** (§ 6 Abs. 1 EStG i. V. m. § 253 HGB) für dauernde Wertminderungen. Abschließend die drei Dokumentations- und Kontroll-Instrumente: **Anlagenverzeichnis** (laufendes Nebenbuch), **Inventar** (jährliches Bestandsdokument nach § 240 HGB) und **Inventur** (die Aufnahmeprozedur nach § 241 HGB, einschließlich des **Festwert-Verfahrens** nach § 240 Abs. 3 HGB als Inventurvereinfachung).

Baut auf auf [01-grundlagen.md](./01-grundlagen.md) (HGB, AO, GoBD),
[02-buchhaltung.md](./02-buchhaltung.md) (Buchungssatz, Doppelte Buchführung, Konto),
[04-steuer-meldungen.md](./04-steuer-meldungen.md) (E-Bilanz — AV-Ableitung aus Kern-Taxonomie) und
[05-jahresabschluss.md](./05-jahresabschluss.md) (Bilanz, Handelsbilanz, Steuerbilanz,
Maßgeblichkeitsprinzip — deren HB/SB-Überleitung bei AfA und Teilwert besonders relevant ist).

> **Modul-Metadaten**
> **Modul:** 07 · Anlagen & Inventur · **Einträge:** 10 FEST · **Stand:** 2026-04-23
> **Baut auf:** [01-grundlagen.md](./01-grundlagen.md), [02-buchhaltung.md](./02-buchhaltung.md), [04-steuer-meldungen.md](./04-steuer-meldungen.md), [05-jahresabschluss.md](./05-jahresabschluss.md) · **Spätere Module:** 09 referenziert dieses

---

## Inhaltsverzeichnis

1. [Anlagevermögen (§ 247 Abs. 2 HGB)](#1-anlagevermögen--247-abs-2-hgb)
2. [Anschaffungs- und Herstellungskosten (§ 255 HGB)](#2-anschaffungs--und-herstellungskosten--255-hgb)
3. [AfA — Absetzung für Abnutzung (§ 7 EStG)](#3-afa--absetzung-für-abnutzung--7-estg)
4. [Nutzungsdauer + AfA-Tabellen](#4-nutzungsdauer--afa-tabellen)
5. [GWG — Geringwertige Wirtschaftsgüter (§ 6 Abs. 2 EStG)](#5-gwg--geringwertige-wirtschaftsgüter--6-abs-2-estg)
6. [Sammelposten / Poolabschreibung (§ 6 Abs. 2a EStG)](#6-sammelposten--poolabschreibung--6-abs-2a-estg)
7. [Teilwert + Teilwertabschreibung (§ 6 Abs. 1 EStG)](#7-teilwert--teilwertabschreibung--6-abs-1-estg)
8. [Anlagenverzeichnis (§ 140 AO + R 5.4 EStR)](#8-anlagenverzeichnis--140-ao--r-54-estr)
9. [Inventar (§ 240 HGB)](#9-inventar--240-hgb)
10. [Inventur (§ 241 HGB) + Festwert-Verfahren (§ 240 Abs. 3 HGB)](#10-inventur--241-hgb--festwert-verfahren--240-abs-3-hgb)

---

## 1. Anlagevermögen (§ 247 Abs. 2 HGB)

| Feld | Inhalt |
|---|---|
| **Deutsch (primär)** | Anlagevermögen |
| **Synonyme (DE)** | AV (Abkürzung, im Code und UI bevorzugt), langfristiges Betriebsvermögen (umgangssprachlich), Festes Vermögen (veraltet) |
| **Arabisch** | الأصول الثابتة (الفئة العريضة من الأصول التي تخدم نشاط المنشأة بشكل **دائم** وفق § 247 Abs. 2 HGB؛ على النقيض من Umlaufvermögen الذي يتغير باستمرار؛ تُقسَّم إلى ثلاث فئات رئيسية في Bilanz-Gliederung وفق § 266 Abs. 2 HGB: Sachanlagen — الأصول المادية كالعقارات والآلات والتجهيزات؛ Immaterielle Vermögensgegenstände — الأصول غير المادية كحقوق الترخيص والبرمجيات المشتراة والـ Goodwill؛ و Finanzanlagen — الأصول المالية طويلة الأجل كالمشاركات في شركات أخرى والقروض الممنوحة؛ هي القاعدة التي تُحتسب عليها كل آليات AfA و Teilwertabschreibung) |
| **Englisch (Code-Kontext)** | `fixedAssets`, `nonCurrentAssets` (IFRS-näher), `anlagevermoegen` |
| **Kategorie** | Rechtsbegriff / Bilanz-Aktivposten |
| **Status** | FEST |
| **Aufgenommen am** | 2026-04-22, Terminology-Sprint 1 |

### Definition
Gesamtheit derjenigen Vermögensgegenstände, die **dazu bestimmt sind, dem Geschäftsbetrieb dauernd zu dienen** (§ 247 Abs. 2 HGB). Das **Dauerhaftigkeits-Kriterium** ist objektiv-funktional: nicht die physische Lebensdauer entscheidet, sondern die vom Unternehmer vorgesehene **Nutzungsabsicht** am Bilanzstichtag. Abgegrenzt vom Umlaufvermögen, das zum Verbrauch, zur Verarbeitung oder zur Veräußerung bestimmt ist.

**Drei Kategorien nach § 266 Abs. 2 HGB (Bilanz-Gliederung, Position A):**

| Kategorie | § HGB | Typische Bestandteile |
|---|---|---|
| **I. Immaterielle Vermögensgegenstände** | § 266 Abs. 2 A I | Selbst geschaffene gewerbliche Schutzrechte und ähnliche Rechte (Ansatzwahlrecht § 248 Abs. 2 HGB, **SB-Verbot** § 5 Abs. 2 EStG), entgeltlich erworbene Konzessionen/Lizenzen/Software, Geschäfts- oder Firmenwert (Goodwill) |
| **II. Sachanlagen** | § 266 Abs. 2 A II | Grundstücke, Gebäude, technische Anlagen und Maschinen, andere Anlagen / Betriebs- und Geschäftsausstattung, geleistete Anzahlungen und Anlagen im Bau |
| **III. Finanzanlagen** | § 266 Abs. 2 A III | Anteile an verbundenen Unternehmen, Ausleihungen, Beteiligungen, Wertpapiere des Anlagevermögens, Sonstige Ausleihungen |

**Abgrenzung Anlagevermögen ↔ Umlaufvermögen:**

| Aspekt | Anlagevermögen | Umlaufvermögen |
|---|---|---|
| **Nutzungsdauer** | mehr als 1 Jahr + Absicht der dauernden Nutzung | bis zu 1 Jahr oder zum Verkauf bestimmt |
| **Bilanz-Position** | A (§ 266 Abs. 2 HGB) | B (§ 266 Abs. 2 HGB) |
| **Typische Bewertung** | AK/HK abzgl. planmäßiger AfA | Niederstwertprinzip, meist ohne AfA |
| **Teilwertabschreibung** | **Wahlrecht bei dauernder Wertminderung** (HB-Pflicht, SB-Wahl) | **Pflicht** bei jeder Wertminderung (strenges Niederstwertprinzip) |
| **Beispiel** | Produktionsmaschine, Firmen-PKW | Warenbestand, Forderungen |

### Rechtsgrundlage
- **§ 247 Abs. 2 HGB** — Legaldefinition des Anlagevermögens
- **§ 266 Abs. 2 HGB** — Bilanz-Gliederung Aktivseite, Position A
- **§ 253 HGB** — Bewertung (AK/HK als Ausgangsgröße, AfA, Teilwertabschreibung)
- **§ 255 HGB** — Anschaffungs- und Herstellungskosten (siehe #2)
- **§ 5 EStG** — Maßgeblichkeit für die Steuerbilanz
- **§ 6 EStG** — Steuerliche Bewertungsvorschriften
- **§ 7 EStG** — Absetzungen für Abnutzung (AfA, siehe #3)
- **§ 268 Abs. 2 HGB** — Anlagengitter / Anlagenspiegel (Pflichtangabe im Anhang bei KapG)
- **§ 284 Abs. 3 HGB** — Erläuterungen zur Entwicklung des Anlagevermögens im Anhang

**Verwandte Begriffe:**
- [Bilanz](./05-jahresabschluss.md#2-bilanz) — AV steht als Position A auf der Aktivseite
- [Anschaffungs- und Herstellungskosten](#2-anschaffungs--und-herstellungskosten--255-hgb) — Erstbewertung
- [AfA](#3-afa--absetzung-für-abnutzung--7-estg) — planmäßige Wertfortschreibung
- [Teilwert + Teilwertabschreibung](#7-teilwert--teilwertabschreibung--6-abs-1-estg) — außerplanmäßige Abschreibung
- [Anlagenverzeichnis](#8-anlagenverzeichnis--140-ao--r-54-estr) — dokumentierender Nachweis
- [Inventar](#9-inventar--240-hgb) / [Inventur](#10-inventur--241-hgb--festwert-verfahren--240-abs-3-hgb) — körperliche Bestandsfeststellung
- [Kontenrahmen](./02-buchhaltung.md#4-kontenrahmen) — SKR03 Klasse 0, SKR04 Klasse 0

**Verwendung im Code:**
- `src/domain/anlage/` — Domänenbereich Anlagevermögen
- `src/domain/anlage/kategorie.ts`:
  ```ts
  enum AnlageKategorie {
    IMMATERIELL  = 'immateriell',    // § 266 Abs. 2 A I
    SACHANLAGE   = 'sachanlage',      // § 266 Abs. 2 A II
    FINANZANLAGE = 'finanzanlage',    // § 266 Abs. 2 A III
  }
  ```
- Entität `Anlage` mit Pflichtfeldern: `kategorie`, `bezeichnung`, `anschaffungsdatum`, `ak_hk`, `nutzungsdauer_monate`, `afa_methode`, `aktuelle_buchwert_hb`, `aktuelle_buchwert_sb`
- Automatisches Mapping auf SKR03/SKR04-Konten via Kategorie → Kontenbereich
- Abgrenzung zu `Umlaufvermögen`-Entitäten (getrennte Tabellen / Domänen)
- E-Bilanz-Export nutzt AV-Klassifikation direkt (Kern-Taxonomie-Position)

**Nicht verwechseln mit:**
- **Umlaufvermögen** — gegensätzliche Kategorie (zum Verbrauch/Verkauf)
- **Betriebsvermögen** (steuerrechtlicher Oberbegriff, § 4 Abs. 1 EStG) — umfasst AV **und** UV
- **Privatvermögen** — nicht dem Betrieb zugeordnete Gegenstände (v. a. bei Einzelunternehmern relevant: Abgrenzungspflicht)
- **Vorratsvermögen** — Teil des UV (§ 266 Abs. 2 B I HGB), nicht AV
- **Gewillkürtes Betriebsvermögen** — Sonderfall bei Einzelunternehmern: privat nutzbare Gegenstände, die dem Betrieb gewidmet werden (10-50 % betriebliche Nutzung)

**Anmerkungen / Edge-Cases:**
- **Nutzungsabsicht am Bilanzstichtag:** Die Zuordnung AV/UV hängt von der zum Stichtag bestehenden Absicht ab. Ein zum Verkauf bestimmtes Gebäude wechselt vom AV ins UV — Umwidmung ist zu dokumentieren.
- **Geringfügig genutzte Gegenstände:** Bei gemischter Nutzung (betrieblich < 10 %) ist Zuordnung zum Privatvermögen zwingend (BFH-Rechtsprechung); bei > 50 % notwendig Betriebsvermögen; dazwischen Wahlrecht (gewillkürt).
- **Selbst geschaffene immaterielle VG:** Ansatzwahlrecht in der HB seit BilMoG (§ 248 Abs. 2 HGB), aber **Ansatzverbot** in der SB (§ 5 Abs. 2 EStG) für nicht entgeltlich erworbene immaterielle WG → zwangsläufige HB/SB-Abweichung.
- **Firmenwert (Goodwill):** Entgeltlich erworbener GoF ist immaterieller VG (§ 246 Abs. 1 Satz 4 HGB), planmäßig abzuschreiben (typischerweise 5–15 Jahre HB, 15 Jahre SB nach § 7 Abs. 1 Satz 3 EStG). Selbst geschaffener GoF ist nicht ansatzfähig.
- **Anlagen im Bau (§ 266 Abs. 2 A II 5 HGB):** Unfertige Anlagen werden zunächst dort ausgewiesen (keine AfA), bei Fertigstellung in die Ziel-Kategorie umgebucht und erst dann planmäßig abgeschrieben.
- **Bei Zweifelsfällen der AV/UV-Zuordnung** — insbesondere bei Immobilien, Beteiligungen, gewillkürtem Betriebsvermögen — **Rücksprache mit Steuerberater** empfohlen; das Datenmodell soll solche Zuordnungen als explizit dokumentierte Mandantenentscheidung abbilden.

---

## 2. Anschaffungs- und Herstellungskosten (§ 255 HGB)

| Feld | Inhalt |
|---|---|
| **Deutsch (primär)** | Anschaffungskosten / Herstellungskosten |
| **Synonyme (DE)** | AK (Abkürzung für Anschaffungskosten), HK (Abkürzung für Herstellungskosten), AK/HK (gemeinsame Abkürzung, im Code bevorzugt), Erwerbskosten (umgangssprachlich unscharf) |
| **Arabisch** | تكاليف الاقتناء وتكاليف التصنيع (القيمة الأولية التي يُدرَج بها الأصل في الميزانية وفق § 255 HGB؛ Anschaffungskosten — AK — وفق § 255 Abs. 1 HGB = سعر الشراء + التكاليف العَرَضية Anschaffungsnebenkosten كالنقل والتركيب والشهادات والرسوم، ناقصاً خصومات البائع وتخفيضاته؛ Herstellungskosten — HK — وفق § 255 Abs. 2, 3 HGB للأصول المصنوعة ذاتياً، تشمل حدّاً أدنى إلزامياً (مواد وأجور مباشرة، مصاريف تصنيع غير مباشرة مناسبة، إهلاك) وخيارات (إدارة، فوائد تمويل، تكاليف اجتماعية طوعية)؛ AK/HK هما الأساس لحساب AfA و Teilwert) |
| **Englisch (Code-Kontext)** | `acquisitionCost` (AK), `productionCost` (HK), `initialValuation` |
| **Kategorie** | Rechtsbegriff / Bewertungsmaßstab |
| **Status** | FEST |
| **Aufgenommen am** | 2026-04-22, Terminology-Sprint 1 |

### Definition
Zwei gesetzlich definierte Bewertungsmaßstäbe für den **Zugang** eines Vermögensgegenstands:

- **Anschaffungskosten (AK) — § 255 Abs. 1 HGB:** Aufwendungen, die geleistet werden, um einen Vermögensgegenstand **zu erwerben** und ihn in einen betriebsbereiten Zustand zu versetzen, soweit sie dem Vermögensgegenstand **einzeln zugeordnet** werden können. AK sind die Grundlage für Fremdzugänge (Kauf).
- **Herstellungskosten (HK) — § 255 Abs. 2, 3 HGB:** Aufwendungen, die durch den **Verbrauch von Gütern** und die **Inanspruchnahme von Diensten** für die **Herstellung** eines Vermögensgegenstands, seine Erweiterung oder für eine über seinen ursprünglichen Zustand hinausgehende **wesentliche Verbesserung** entstehen. HK sind die Grundlage für Eigenleistungen.

**Bestandteile der Anschaffungskosten (§ 255 Abs. 1 HGB):**

```
  Anschaffungspreis (netto, ohne abziehbare Vorsteuer)
+ Anschaffungsnebenkosten (Transport, Zoll, Montage, Notarkosten, Grunderwerbsteuer etc.)
+ Nachträgliche Anschaffungskosten (Ausbaumaßnahmen, die AK-Charakter haben)
- Anschaffungspreisminderungen (Rabatte, Skonti, Boni, Minderungen)
= Anschaffungskosten
```

**Bestandteile der Herstellungskosten (§ 255 Abs. 2, 3 HGB):**

| Bestandteil | HB | SB | Rechtsgrundlage |
|---|---|---|---|
| **Materialeinzelkosten** (Rohstoffe, direkt zurechenbar) | **Pflicht** | **Pflicht** | § 255 Abs. 2 Satz 2 HGB |
| **Fertigungseinzelkosten** (Löhne der Fertigung, direkt) | **Pflicht** | **Pflicht** | § 255 Abs. 2 Satz 2 HGB |
| **Sonderkosten der Fertigung** (Werkzeuge, Spezialwerkzeuge) | **Pflicht** | **Pflicht** | § 255 Abs. 2 Satz 2 HGB |
| **Angemessene Materialgemeinkosten** | **Pflicht** | **Pflicht** | § 255 Abs. 2 Satz 2 HGB |
| **Angemessene Fertigungsgemeinkosten** | **Pflicht** | **Pflicht** | § 255 Abs. 2 Satz 2 HGB |
| **Wertverzehr des AV** (Abschreibungen, soweit durch Fertigung verursacht) | **Pflicht** | **Pflicht** | § 255 Abs. 2 Satz 2 HGB |
| **Verwaltungsgemeinkosten** (soweit Fertigung betreffend) | **Wahlrecht** | **Wahlrecht** | § 255 Abs. 2 Satz 3 HGB |
| **Freiwillige soziale Leistungen, betriebliche Altersvorsorge** | **Wahlrecht** | **Wahlrecht** | § 255 Abs. 2 Satz 3 HGB |
| **Fremdkapitalzinsen** (zur Finanzierung der Herstellung) | **Wahlrecht** bei langer Herstellungszeit | **Wahlrecht** | § 255 Abs. 3 HGB |
| **Vertriebskosten** | **Verbot** | **Verbot** | § 255 Abs. 2 Satz 4 HGB |
| **Forschungskosten** (≠ Entwicklung) | **Verbot** | **Verbot** | § 255 Abs. 2a Satz 4 HGB |

**Wahlrechte-Stetigkeit:** Die einmal gewählte Methode der HK-Ermittlung ist nach § 252 Abs. 1 Nr. 6 HGB (Methodenstetigkeit) fortzuführen; Änderungen sind im [Anhang](./05-jahresabschluss.md#4-anhang) zu begründen.

### Rechtsgrundlage
- **§ 255 HGB** — Definition AK und HK mit allen Bestandteilen
- **§ 6 Abs. 1 Nr. 1 EStG** — AK/HK als Bewertungsobergrenze in der Steuerbilanz
- **§ 9b EStG** — Behandlung der abziehbaren Vorsteuer (kein Bestandteil der AK/HK)
- **§ 7 Abs. 1 Satz 1 EStG** — AK/HK als Ausgangsbasis der AfA-Berechnung
- **BFH ständige Rechtsprechung** — Abgrenzung Anschaffungsnebenkosten vs. nachträgliche AK
- **R 6.3 EStR** — Verwaltungsauffassung zu HK
- **BMF-Schreiben vom 12.03.2010** (IV C 6 - S 2133/09/10001) — Maßgeblichkeit nach BilMoG einschließlich HK-Konsequenzen

**Verwandte Begriffe:**
- [Anlagevermögen](#1-anlagevermögen--247-abs-2-hgb) — primärer Anwendungsbereich der AK/HK
- [AfA](#3-afa--absetzung-für-abnutzung--7-estg) — AK/HK ist Ausgangswert für die Berechnung
- [Teilwert + Teilwertabschreibung](#7-teilwert--teilwertabschreibung--6-abs-1-estg) — AK/HK ist Obergrenze des Wertansatzes (Wertaufholungsgrenze)
- [GWG](#5-gwg--geringwertige-wirtschaftsgüter--6-abs-2-estg) / [Sammelposten](#6-sammelposten--poolabschreibung--6-abs-2a-estg) — Schwellen werden auf AK/HK **netto** bezogen
- [Vorsteuer](./04-steuer-meldungen.md#3-vorsteuer) — abziehbare Vorsteuer gehört **nicht** zu AK/HK

**Verwendung im Code:**
- `src/domain/anlage/bewertung/` — Bewertungs-Engine
- `src/domain/anlage/bewertung/acquisition.ts` — AK-Berechnung:
  ```ts
  interface AkBerechnung {
    kaufpreis_netto: Decimal;
    anschaffungsnebenkosten: AnschaffungsNebenKosten[];
    preisminderungen: PreisMinderung[];
    nachtraegliche_ak: NachtraeglicheAk[];
  }
  const ak = kaufpreis + nebenkosten.sum() - preisminderungen.sum() + nachtraegliche.sum();
  ```
- `src/domain/anlage/bewertung/production.ts` — HK-Berechnung mit Pflicht-/Wahl-/Verbotsbestandteilen
- **Vorsteuer-Trennung:** Input-Validator prüft, ob Bruttowert mit/ohne abziehbarer Vorsteuer geliefert wird — automatische Aufteilung, **Vorsteuer fließt NICHT in AK/HK** (außer bei nicht-vorsteuerabzugsberechtigtem Unternehmer, siehe § 9b Abs. 1 EStG)
- **Dokumentations-Pflicht:** Jede AK/HK-Berechnung erzeugt einen revisionssicheren Audit-Log mit allen Bestandteilen, zitiertem § und Quellbeleg
- UI: HK-Assistent mit Checkliste der Pflicht-/Wahl-/Verbotsbestandteile; gewählte Wahlrechte werden Mandanten-übergreifend festgeschrieben (Stetigkeit)

**Nicht verwechseln mit:**
- **Kaufpreis** — nur **Teil** der AK; Nebenkosten und Minderungen sind zu berücksichtigen
- **Selbstkosten (Kostenrechnung)** — umfasst auch Vertriebskosten und Verwaltungskosten; HK i. S. v. § 255 HGB sind enger gefasst
- **Fair Value / Marktwert** — IFRS-Begriff, anderer Bewertungsmaßstab; nicht Teil der HGB-AK/HK-Konzeption
- **Erhaltungsaufwand** — sofort abzugsfähige laufende Aufwendungen (keine AK/HK); Abgrenzung zu nachträglichen AK ist steuerlich streitanfällig (R 21.1 EStR)
- **Teilwert** — späterer Bewertungsmaßstab bei Wertminderung, nicht AK/HK selbst

**Anmerkungen / Edge-Cases:**
- **Abgrenzung Erhaltung vs. nachträgliche AK (R 21.1 EStR):** Erhaltungsaufwand = laufender Aufwand (GuV); nachträgliche AK = aktivierungspflichtig, erhöhen Buchwert. Kriterien: Substanzvermehrung, Funktions-/Wesensänderung, Übersteigen des ursprünglichen Zustands. Bei Grenzfällen (v. a. Renovierungen, Anbauten) **Steuerberater konsultieren**.
- **Anschaffungsnaher Aufwand (§ 6 Abs. 1 Nr. 1a EStG):** Bei Gebäuden innerhalb von 3 Jahren nach Anschaffung, wenn > 15 % der AK → zwingend Aktivierung als AK, nicht sofortiger Aufwand. UI-Warnung erforderlich.
- **Fremdkapitalzinsen (§ 255 Abs. 3 HGB):** Wahlrecht, aber nur wenn die Zinsen auf den **Herstellungszeitraum** entfallen und eine **langfristige** Herstellung vorliegt. Die einmal getroffene Entscheidung bindet für identische Sachverhalte.
- **Eigenleistungen bei Eigen-Herstellungen:** Eigener Arbeitszeitanteil des Unternehmers ist **nicht** aktivierbar (kein Kostenansatz bei Eigen-Arbeit des Inhabers). Kalkulatorischer Unternehmerlohn gehört der Kostenrechnung, nicht der HK.
- **Grenzfall Tausch:** Bei Tauschgeschäften gelten AK in Höhe des **gemeinen Werts** des hingegebenen Vermögensgegenstands (§ 6 Abs. 6 EStG).
- **Teilwert-Grenze:** AK/HK sind gleichzeitig die **Obergrenze** jedes späteren Wertansatzes — eine Wertaufholung nach Teilwertabschreibung darf die ursprünglichen AK/HK nicht überschreiten (§ 253 Abs. 5 HGB).

---

## 3. AfA — Absetzung für Abnutzung (§ 7 EStG)

| Feld | Inhalt |
|---|---|
| **Deutsch (primär)** | Absetzung für Abnutzung |
| **Synonyme (DE)** | AfA (Abkürzung, im Code, UI und Alltag bevorzugt — **dominierend**), Abschreibung (HGB-Begriff, § 253 Abs. 3 HGB), planmäßige Abschreibung |
| **Arabisch** | الإهلاك الضريبي المنتظم (الآلية التي يُوزَّع بموجبها AK/HK لأصل ثابت على مدار سنوات Nutzungsdauer بصورة نظامية وفق § 7 EStG؛ الشكل الأساسي المسموح ضريبياً: Lineare AfA وفق § 7 Abs. 1 EStG بتقسيم متساوٍ على العمر الإنتاجي؛ الأنواع الخاصة: Degressive AfA وفق § 7 Abs. 2 EStG (متناقصة، متاحة في فترات تشريعية محددة)، Leistungs-AfA وفق § 7 Abs. 1 Satz 6 EStG (للآلات بوحدات إنتاج)، Gebäude-AfA وفق § 7 Abs. 4, 5 EStG (للعقارات بمعدلات قانونية ثابتة)؛ يبدأ التسجيل من شهر الاقتناء Monatsgenaue Berechnung وفق § 7 Abs. 1 Satz 4 EStG؛ نظيرها في Handelsbilanz هو planmäßige Abschreibung وفق § 253 Abs. 3 HGB) |
| **Englisch (Code-Kontext)** | `depreciation`, `afa` (Fachterminus, im Code als Enum-Präfix) |
| **Kategorie** | Rechtsbegriff / Bewertungsverfahren |
| **Status** | FEST |
| **Aufgenommen am** | 2026-04-22, Terminology-Sprint 1 |

### Definition
Systematische Verteilung der **Anschaffungs- oder Herstellungskosten** eines abnutzbaren Anlagegegenstands auf die **betriebsgewöhnliche Nutzungsdauer**. Begründet im Grundsatz der Periodenabgrenzung (§ 252 Abs. 1 Nr. 5 HGB): Der Werteverzehr soll denjenigen Perioden als Aufwand zugeordnet werden, denen er wirtschaftlich entspricht. Anwendung auf **abnutzbare** Anlagen (Maschinen, Fahrzeuge, Gebäude, Software); **nicht** auf Grundstücke (keine Abnutzung) oder Finanzanlagen.

**AfA-Methoden im deutschen Steuerrecht:**

| Methode | § EStG | Formel / Besonderheit | Aktueller Status (Stand 2026) |
|---|---|---|---|
| **Lineare AfA** | § 7 Abs. 1 Satz 1 | AK/HK ÷ Nutzungsdauer (gleichmäßige jährliche Rate) | **Standard**, immer zulässig |
| **Degressive AfA** | § 7 Abs. 2 | Fester Prozentsatz auf jeweiligen Restbuchwert, max. 2,5 × linearer Satz und max. 25 % p. a. (gemäß letzter Wiedereinführung) | **Befristet**: nur für Anschaffungen in bestimmten Zeiträumen zulässig, z. B. 2020–2022, erneut 01.04.2024–31.12.2024 (Wachstumschancengesetz); aktueller Status vor Anwendung prüfen |
| **Leistungs-AfA** | § 7 Abs. 1 Satz 6 | Rate pro Nutzungseinheit (z. B. Betriebsstunden, gefahrene km); nur bei messbarem Verschleiß | Selten; eher bei Spezialmaschinen |
| **AfA in fallenden Jahresbeträgen** (Gebäude) | § 7 Abs. 5 | Staffel-Sätze für Wohngebäude, historisch wichtig | Nur für Altbauten, zeitlich eingeschränkt |
| **Lineare Gebäude-AfA** | § 7 Abs. 4 | Feste Sätze: 2 % (nach 1924), 2,5 % (vor 1925), 3 % für Wohngebäude seit 01.01.2023 (§ 7 Abs. 4 Nr. 2 EStG) | Standard für Gebäude |

**Berechnungsprinzip — Monatsgenaue AfA (§ 7 Abs. 1 Satz 4 EStG):**

```
AfA-Rate-pro-Monat = AK/HK ÷ (Nutzungsdauer-in-Jahren × 12)
Erstjahr: AfA beginnt mit dem Monat der Anschaffung/Herstellung
Beispiel: Kauf 15. März → AfA für März–Dezember = 10/12 der Jahres-AfA
Letztes Jahr: entsprechend bis zum Monat des Ausscheidens oder Ende der ND
```

**HB vs. SB — Einheit und Abweichung:**

| Aspekt | Handelsbilanz (§ 253 Abs. 3 HGB) | Steuerbilanz (§ 7 EStG) |
|---|---|---|
| **Methode** | Jede vernünftige Abschreibungsmethode erlaubt | Nur gesetzlich vorgesehene Methoden |
| **Nutzungsdauer** | Schätzung nach betrieblicher Erfahrung | AfA-Tabellen des BMF als Leitlinie (nicht bindend, aber faktisch maßgebend) |
| **Monatsgenau?** | nicht zwingend (Halbjahres-Regel möglich) | **zwingend** monatsgenau (§ 7 Abs. 1 Satz 4 EStG) |
| **Degressive AfA** | Zulässig, wenn wirtschaftlich begründet | Nur wenn gesetzlich zugelassen (befristet) |

→ Typische HB/SB-Abweichung: Degressive AfA in HB mögliche, in SB nur bei gesetzlicher Zulassung.

### Rechtsgrundlage
- **§ 7 EStG** — AfA-Grundnorm mit allen Methoden
- **§ 253 Abs. 3 HGB** — Handelsrechtliche planmäßige Abschreibung
- **§ 7a EStG** — Sonderabschreibungen (nicht Gegenstand dieses Eintrags, siehe Batch 2)
- **§ 7g EStG** — Investitionsabzugsbetrag / Sonderabschreibung für kleine Unternehmen (Batch 2)
- **R 7.1 ff. EStR** — Verwaltungsanweisungen zur AfA
- **Allgemeine AfA-Tabelle** — BMF vom 15.12.2000, nachfolgende Ergänzungen (siehe #4)
- **BMF-Schreiben vom 22.02.2022** (IV C 3 - S 2190/21/10002 :025) — ND = 1 Jahr für Computerhardware und Software

**Verwandte Begriffe:**
- [Anlagevermögen](#1-anlagevermögen--247-abs-2-hgb) — Anwendungsbereich
- [Anschaffungs- und Herstellungskosten](#2-anschaffungs--und-herstellungskosten--255-hgb) — Ausgangsbasis
- [Nutzungsdauer + AfA-Tabellen](#4-nutzungsdauer--afa-tabellen) — Dauer der AfA
- [GWG](#5-gwg--geringwertige-wirtschaftsgüter--6-abs-2-estg) — Ausnahme: Sofortabzug statt AfA
- [Sammelposten](#6-sammelposten--poolabschreibung--6-abs-2a-estg) — Ausnahme: Pool-Abschreibung statt Einzel-AfA
- [Teilwertabschreibung](#7-teilwert--teilwertabschreibung--6-abs-1-estg) — außerplanmäßige Ergänzung zur planmäßigen AfA
- [Handelsbilanz](./05-jahresabschluss.md#7-handelsbilanz) / [Steuerbilanz](./05-jahresabschluss.md#8-steuerbilanz) — AfA läuft parallel in beiden

**Verwendung im Code:**
- `src/domain/anlage/afa/` — AfA-Berechnungs-Engine
- `src/domain/anlage/afa/method.ts`:
  ```ts
  enum AfAMethode {
    LINEAR              = 'linear',               // § 7 Abs. 1 Satz 1
    DEGRESSIV           = 'degressiv',            // § 7 Abs. 2 — zeitlich beschränkt!
    LEISTUNG            = 'leistung',             // § 7 Abs. 1 Satz 6
    GEBAEUDE_LINEAR     = 'gebaeude_linear',      // § 7 Abs. 4
    GEBAEUDE_STAFFEL    = 'gebaeude_staffel',     // § 7 Abs. 5 (Altbau)
    GWG_SOFORT          = 'gwg_sofort',           // § 6 Abs. 2 — separater Pfad
    SAMMELPOSTEN        = 'sammelposten_20pct',   // § 6 Abs. 2a — 5-Jahres-Pool
  }
  ```
- Monatsgenaue Berechnung als Default (HB- und SB-tauglich)
- `src/domain/anlage/afa/degressiv-window.ts` — **kritische Konstante**: welche Anschaffungszeiträume erlauben degressive AfA?
  ```ts
  export const DEGRESSIV_ALLOWED_PERIODS = [
    { von: '2020-01-01', bis: '2022-12-31', max_satz: 0.25, faktor: 2.5 },
    { von: '2024-04-01', bis: '2024-12-31', max_satz: 0.20, faktor: 2.0 },
    // historische/künftige Fenster ergänzen
  ];
  ```
- Validierung: Anschaffungsdatum muss in erlaubtem Zeitfenster liegen, sonst Zwang zur linearen AfA
- AfA-Plan als geplante Serie von Aufwandsbuchungen über die ND (automatisch generiert, bei HB/SB-Divergenz separat)
- Überleitungs-Eintrag bei degressiver AfA in HB, linearer in SB (siehe [Maßgeblichkeit](./05-jahresabschluss.md#6-maßgeblichkeitsprinzip--5-abs-1-estg))

**Nicht verwechseln mit:**
- **Außerplanmäßige Abschreibung** — siehe [Teilwertabschreibung](#7-teilwert--teilwertabschreibung--6-abs-1-estg); keine regulär-zeitraumbezogene, sondern ereignisbezogene Wertminderung
- **Wertberichtigung** — bei Forderungen (UV) verwendeter Begriff, nicht AfA
- **Rückstellung** — Passivposten für Ungewisses, siehe [05-jahresabschluss.md](./05-jahresabschluss.md#9-rückstellungen--249-hgb)
- **AbV (Absetzung für Substanzverringerung, § 7 Abs. 6 EStG)** — Spezialfall bei Bodenschätzen, nicht AfA im engeren Sinn
- **Sofortige Betriebsausgabe (GWG)** — trotz ähnlicher Wirkung keine AfA, sondern kategorial andere Behandlung

**Anmerkungen / Edge-Cases:**
- **Degressive AfA — Zeitfenster-Falle:** Die degressive AfA ist **nur in gesetzlich aktivierten Zeitfenstern** zulässig. Anschaffungen außerhalb dieser Fenster zwingen zur linearen Methode. Das Validator-Modul MUSS das Anschaffungsdatum mit dem aktiven Fenster-Katalog abgleichen und fehlerhafte Zuordnungen vor der Abschlussbuchung blocken.
- **Methodenwechsel — BilMoG 2009:** Seit BilMoG ist in der HB die Methode nicht mehr zwingend parallel zur SB zu wählen (§ 252 Abs. 1 Nr. 6 HGB verlangt aber Methodenstetigkeit **innerhalb** der HB).
- **Wechsel degressiv → linear (§ 7 Abs. 3 EStG):** Während der laufenden degressiven AfA ist ein **einmaliger** Wechsel zur linearen AfA zulässig — sinnvoll im letzten Drittel der ND, wenn die lineare Rate (Restbuchwert ÷ Restnutzungsdauer) höher wird als die degressive. **Rückwechsel zur degressiven AfA ist unzulässig**.
- **AfA-Beginn und -Ende:**
  - Beginn: Monat der **Betriebsbereitschaft**, nicht zwingend des Kaufs (wichtig bei langen Lieferzeiten / Montage)
  - Ende: Monat des Ausscheidens oder Ende der ND; Restbuchwert bei vorzeitigem Ausscheiden fließt über Anlagenabgang in die GuV
- **Nutzungsdauer-Kürzung:** Bei nachträglichen Erkenntnissen zu kürzerer ND ist **prospektive** Anpassung der AfA geboten (Restbuchwert ÷ neue Rest-ND); **keine** rückwirkende Korrektur.
- **Computer/Software (Sonderfall ND = 1 Jahr):** Nach BMF-Schreiben 22.02.2022 Wahlrecht zur einjährigen AfA → in Wirkung sofortiger Aufwand im Jahr der Anschaffung. **Nur steuerliches Wahlrecht**, in der HB weiterhin betriebsgewöhnliche (typisch 3 Jahre). → Klassische HB/SB-Abweichung. Siehe #4.
- **Gebrauchte Anlagegüter:** AfA-Basis = AK, ND = **Rest-Nutzungsdauer** (individuelle Schätzung, keine volle Tabellenwerte). Dokumentation der Schätzung in der Mandantenakte zwingend.
- **Bei Sonderkonstellationen (unterbrochene Nutzung, Betriebsaufgabe, gemischte Nutzung) Rücksprache mit Steuerberater** — das Validator-Modul soll nicht-Standardfälle erkennen und markieren.

---

## 4. Nutzungsdauer + AfA-Tabellen

| Feld | Inhalt |
|---|---|
| **Deutsch (primär)** | Nutzungsdauer (AfA-Tabellen) |
| **Synonyme (DE)** | ND (Abkürzung, im Code bevorzugt), betriebsgewöhnliche Nutzungsdauer (vollständig), wirtschaftliche Nutzungsdauer (auslegungsunschärfer), Lebensdauer (umgangssprachlich — zu vermeiden, weil nicht rechtlich definiert) |
| **Arabisch** | العمر الإنتاجي للأصل وجداول الإهلاك الرسمية (المدة بالسنوات التي يُتوقع فيها أن يُستخدَم الأصل الثابت في النشاط التجاري بصورة اقتصادية وفق § 7 Abs. 1 EStG؛ تُقدَّر بناءً على الخبرة التشغيلية للمنشأة، ولكن Finanzverwaltung تُصدِر جداول AfA-Tabellen عبر BMF-Schreiben تُستخدَم كـ Schätzungsgrundlage غير ملزمة قانونياً لكنها ملزمة عملياً؛ الجدول الأساسي هو Allgemeine AfA-Tabelle الصادر في 15.12.2000 مع تحديثات لاحقة، تُضاف إليه جداول قطاعية Branchentabellen — لقطاع الفنادق والمطاعم والبناء والتجارة بالتجزئة إلخ؛ مفهوم Restnutzungsdauer مُدمَج هنا كمتغير ديناميكي يُستخدَم عند الأصول المُستعمَلة المُشتراة أو عند حدوث تغيير جوهري يؤدي لإعادة تقدير ND مثل Teilwertabschreibung) |
| **Englisch (Code-Kontext)** | `usefulLife`, `depreciationPeriodYears`, `afaTable` |
| **Kategorie** | Rechtsbegriff / Berechnungsparameter |
| **Status** | FEST |
| **Aufgenommen am** | 2026-04-22, Terminology-Sprint 1 |

### Definition
Der Zeitraum in Jahren, über den ein abnutzbarer Anlagegegenstand voraussichtlich **wirtschaftlich sinnvoll nutzbar** ist. Maßgeblich ist die **betriebsgewöhnliche** (nicht die technisch-physische) ND. Sie bestimmt direkt den jährlichen AfA-Satz: bei linearer AfA gilt `AfA-Satz = 100 % ÷ ND`.

**Bestimmung der Nutzungsdauer:**

| Reihenfolge | Quelle | Verbindlichkeit |
|---|---|---|
| 1 | Gesetzliche Vorgabe (z. B. Gebäude § 7 Abs. 4 EStG: 33 ⅓ / 40 / 50 Jahre) | **bindend** |
| 2 | BMF-AfA-Tabelle (allgemein oder branchenspezifisch) | **faktisch bindend** (Umkehr der Beweislast: Abweichung muss der Steuerpflichtige begründen) |
| 3 | Individuelle Schätzung der Betriebsgewohnheit | zulässig, wenn konkret begründet |

**AfA-Tabellen des BMF:**

| Tabelle | Geltungsbereich | Stand |
|---|---|---|
| **Allgemeine AfA-Tabelle** (BMF 15.12.2000, IV D 2 - S 1551 - 188/00) | Alle nicht spezifisch abgedeckten Branchen | Basis-Tabelle mit ca. 400 Positionen |
| **Branchentabelle Gastgewerbe** | Hotels, Restaurants | Eigene BMF-Veröffentlichung |
| **Branchentabelle Einzelhandel** | Einzel- und Großhandel | Eigene BMF-Veröffentlichung |
| **Branchentabelle Baugewerbe** | Bau und Ausbau | Eigene BMF-Veröffentlichung |
| Weitere branchenspezifische Tabellen | Druck-, Papier-, Chemie-, Kfz-Gewerbe etc. | Jeweils eigene BMF-Schreiben |

**Typische Nutzungsdauer-Werte (Auszug aus der Allgemeinen AfA-Tabelle):**

| Vermögensgegenstand | ND (Jahre) | AfA-Satz (linear) |
|---|---|---|
| Büromöbel | 13 | 7,69 % |
| PCs, Notebooks (Standardfall alt) | 3 | 33,33 % |
| **PCs, Software (BMF 22.02.2022)** | **1 (Wahlrecht)** | **100 % im Jahr der Anschaffung** |
| Pkw (Anlagevermögen) | 6 | 16,67 % |
| Lkw | 9 | 11,11 % |
| Gabelstapler | 8 | 12,50 % |
| Werkzeuge | 3–5 | 20–33,33 % |
| Büroeinrichtung | 13 | 7,69 % |
| Werbeanlagen | 3–5 | 20–33,33 % |

*Werte zitiert nach Allgemeiner AfA-Tabelle und BMF 22.02.2022; Einzelfall-Prüfung vor Anwendung empfehlenswert.*

**Restnutzungsdauer (in diesen Eintrag integriert):**

Dynamisches Derivat der ND mit zwei Hauptanwendungsfällen:

1. **Gebrauchte Anlagegüter (Erstansatz):** Käufer schätzt individuell die verbleibende Nutzungsdauer unter Berücksichtigung von Alter und Zustand des Gegenstands. AfA-Basis = Kauf-AK, ND = geschätzte Rest-ND.
2. **Laufende Rest-Nutzungsdauer:** `Rest-ND = ursprüngliche ND - bereits abgeschriebene Jahre`. Dient als Divisor bei Wechseln (z. B. von degressiver zu linearer AfA nach § 7 Abs. 3 EStG oder nach Teilwertabschreibung).

Formel bei Teilwertabschreibung:
```
Neue Jahres-AfA = Buchwert nach Teilwertabschreibung ÷ Restnutzungsdauer
```

### Rechtsgrundlage
- **§ 7 Abs. 1 Satz 1 EStG** — „betriebsgewöhnliche Nutzungsdauer"
- **§ 7 Abs. 4 EStG** — Gesetzlich fixierte ND für Gebäude (33 ⅓ / 40 / 50 Jahre je nach Bauart)
- **§ 7 Abs. 4 Nr. 2 EStG (Fassung seit 01.01.2023)** — Erhöhung der Wohngebäude-AfA von 2 % auf 3 %
- **R 7.4 EStR** — Verwaltungsanweisung zur Schätzung der ND
- **BMF-Schreiben vom 15.12.2000** (IV D 2 - S 1551 - 188/00) — Allgemeine AfA-Tabelle
- **BMF-Schreiben vom 22.02.2022** (IV C 3 - S 2190/21/10002 :025) — Computerhardware und Software: ND = 1 Jahr als Wahlrecht
- **BFH-Urteil vom 08.04.2008** (VIII R 64/06) — AfA-Tabellen sind Schätzungsgrundlage, kein Gesetz; Abweichung bei substantiierter Begründung zulässig

**Verwandte Begriffe:**
- [AfA](#3-afa--absetzung-für-abnutzung--7-estg) — nutzt die ND als Divisor
- [Anschaffungs- und Herstellungskosten](#2-anschaffungs--und-herstellungskosten--255-hgb) — Dividende
- [Teilwertabschreibung](#7-teilwert--teilwertabschreibung--6-abs-1-estg) — verändert die weitere AfA-Basis, ND bleibt meist gleich (Rest-ND)
- [Anlagenverzeichnis](#8-anlagenverzeichnis--140-ao--r-54-estr) — ND ist pflichtbestandteil jeder Position
- [Handelsbilanz](./05-jahresabschluss.md#7-handelsbilanz) — in HB freie Schätzung möglich (keine Bindung an BMF-Tabelle)

**Verwendung im Code:**
- `src/domain/anlage/nutzungsdauer/` — ND-Modul
- `src/domain/anlage/nutzungsdauer/afa-tabellen.json` — maschinenlesbare Fassung der Allgemeinen AfA-Tabelle + Branchentabellen
  ```ts
  interface AfaTabellenEintrag {
    position: string;           // z. B. "3.1.5"
    bezeichnung: string;         // z. B. "Personalcomputer"
    nd_jahre: number;            // z. B. 3
    quelle: 'AFA_ALLG_2000' | 'BMF_COMPUTER_2022' | 'BRANCHE_GASTGEWERBE';
    gueltig_ab: string;          // ISO-Datum
    hinweise?: string;
  }
  ```
- Versionierte Pflege: Mandant am Stichtag, nicht Systemdatum, bestimmt die gültige Fassung
- UI-Assistent: Vorschlag der ND basierend auf Klassifikation; Nutzer kann abweichen mit Begründungszwang
- **Computer/Software-Entscheidung:** bei Neuanlage `Computerhardware | Software` Toggle „ND = 1 Jahr anwenden?" (steuerliches Wahlrecht, HB-AfA weiter 3 Jahre) — zwei AfA-Pläne parallel
- Rest-ND-Berechnung automatisch bei Methodenwechsel, Teilwertabschreibung oder nach Buchwert-Reduktion

**Nicht verwechseln mit:**
- **Technische Lebensdauer** — rein physische Verschleißdauer, meist länger als betriebsgewöhnliche ND; nicht relevant für AfA
- **Garantiedauer / Gewährleistungsfrist** — rechtliche Fristen, keine Aussage zur Nutzung
- **Amortisationsdauer** (Investitionsrechnung) — Zeitraum bis zur Rückgewinnung des Kapitaleinsatzes; kein Bilanzbegriff
- **Vertragslaufzeit bei Leasing** — bei Operating-Leasing relevant, aber keine ND des Leasingnehmers
- **Abschreibungsdauer in der IFRS** — sehr ähnlich (IAS 16 „useful life"), aber ohne deutsche BMF-Tabellen-Bindung

**Anmerkungen / Edge-Cases:**
- **BMF-Tabellen sind keine Gesetze:** Sie binden die Finanzverwaltung, aber nicht zwingend den Steuerpflichtigen. Abweichungen sind zulässig, müssen aber **konkret begründet** werden (branchen- oder gegenstandsspezifische Gründe). BFH VIII R 64/06 bestätigt dies. In der Praxis empfiehlt sich dennoch die Tabellen-Orientierung, da Abweichungen Betriebsprüfungs-Auslöser sind.
- **Wohngebäude-AfA-Reform 2023 (§ 7 Abs. 4 Nr. 2 EStG):** Für Wohngebäude, die nach dem 31.12.2022 fertiggestellt wurden, ist die AfA von 2 % auf **3 %** angehoben worden (ND effektiv 33 Jahre statt 50). Ältere Gebäude behalten die 2 %.
- **Sonderfall Computer/Software (BMF 22.02.2022):** Das BMF gewährt ein Wahlrecht zur ND von **einem Jahr** für Computerhardware (inkl. Peripherie) und Software. Dies ist ein rein steuerliches Wahlrecht — in der HB ist **weiterhin** die betriebsgewöhnliche ND (typisch 3 Jahre) maßgebend. → Bei Wahrnehmung: große HB/SB-Abweichung im Anschaffungsjahr und in den Folgejahren. Die Abweichung entfaltet sich erst über mehrere Jahre vollständig.
- **Abweichung muss substantiiert sein:** Ein pauschales „die Maschine hielt länger/kürzer" reicht nicht. Es braucht nachvollziehbare Dokumentation (Wartungsnachweise, Nutzungsintensität, Branchenvergleiche).
- **Aktualisierungen der AfA-Tabellen:** Die Allgemeine AfA-Tabelle ist seit 2000 nicht umfassend revidiert worden; einzelne Positionen werden durch spezialisierte BMF-Schreiben (wie Computer-ND 2022) modernisiert. Das Code-Modul muss die Veröffentlichungs-Hierarchie kennen: speziellere Tabellen überschreiben die allgemeine.
- **Rest-Nutzungsdauer bei gebrauchten Gegenständen** ist eine **Schätzung**, keine Berechnung. Erfahrungswerte: 30–70 % der Original-ND je nach Alter, Zustand, Pflege. Dokumentationspflicht für die Schätzung in der Mandantenakte — bei BP oft Streitpunkt.
- **Bei ungewöhnlichen ND-Schätzungen oder Branchen-Sonderfällen Rücksprache mit Steuerberater.**

---

## 5. GWG — Geringwertige Wirtschaftsgüter (§ 6 Abs. 2 EStG)

| Feld | Inhalt |
|---|---|
| **Deutsch (primär)** | Geringwertige Wirtschaftsgüter |
| **Synonyme (DE)** | GWG (Abkürzung, dominant im Code, UI und Alltag), Sofort-abgeschriebene Wirtschaftsgüter (umschreibend) |
| **Arabisch** | الأصول منخفضة القيمة (الأصول الثابتة المستقلة الاستخدام، المتحركة، القابلة للإهلاك، بصافي AK/HK ≤ 800 يورو؛ تُخصَم بالكامل في سنة الاقتناء وفق § 6 Abs. 2 EStG بدل إهلاكها على Nutzungsdauer؛ عتبة 800 يورو صافي (بدون USt) سارية منذ 01.01.2018 بعد رفعها من 410 يورو؛ اقتراح Wachstumschancengesetz لرفعها إلى 1000 يورو أُسقِط في النسخة النهائية لمارس 2024؛ الأصول > 250 يورو تُقيَّد في GWG-Verzeichnis مستقل وفق § 6 Abs. 2 Satz 4 EStG؛ الخيار بين GWG و Sammelposten حصري للسنة كاملةً) |
| **Englisch (Code-Kontext)** | `gwg`, `lowValueAsset`, `immediateWriteOff` |
| **Kategorie** | Rechtsbegriff / Bewertungsvereinfachung |
| **Status** | FEST |
| **Aufgenommen am** | 2026-04-22, Terminology-Sprint 1 |

### Definition
Abnutzbare, bewegliche Wirtschaftsgüter des Anlagevermögens, die **selbstständig nutzbar** sind und deren **Anschaffungs- oder Herstellungskosten netto 800 €** (ab 01.01.2018) nicht übersteigen. Ein GWG darf im Wirtschaftsjahr der Anschaffung oder Herstellung **in voller Höhe als Betriebsausgabe** abgezogen werden, statt über die Nutzungsdauer planmäßig abgeschrieben zu werden (§ 6 Abs. 2 EStG).

**Tatbestandsmerkmale (§ 6 Abs. 2 Satz 1 EStG):**

| Merkmal | Anforderung |
|---|---|
| Abnutzbar | Ja (Grundstücke und nicht-abnutzbare WG ausgeschlossen) |
| Beweglich | Ja (Gebäude und Gebäudeteile ausgeschlossen) |
| Anlagevermögen | Ja (Umlaufvermögen nicht betroffen) |
| Selbstständig nutzbar | **Zentrales Kriterium** — nicht nur gemeinsam mit anderen Gegenständen nutzbar |
| AK/HK ≤ 800 € netto | Grenze pro Gegenstand, **netto** (ohne abziehbare Vorsteuer) |

**Schwellenwert-Historie:**

| Zeitraum | GWG-Grenze (netto) | Rechtsgrundlage |
|---|---|---|
| Bis 2007 | 410 € (ehemals 800 DM) | § 6 Abs. 2 EStG a. F. |
| 2008–2009 | 150 € + Zwangs-Sammelposten 150–1.000 € | UntStRefG 2008 |
| 2010–2017 | 410 € ODER 150 € + Sammelposten (Wahlrecht) | 2. Bürokratieentlastungsgesetz |
| **Seit 01.01.2018** | **800 €** ODER 250 € + Sammelposten (Wahlrecht) | Zweites Bürokratieentlastungsgesetz 2017 |

**Wachstumschancengesetz — geplante, aber nicht realisierte Erhöhung:**
Der ursprüngliche Regierungsentwurf zum Wachstumschancengesetz sah eine Anhebung der GWG-Grenze von 800 € auf **1.000 €** vor. Im Vermittlungsausschuss und der finalen Gesetzesfassung vom 27.03.2024 (BGBl. 2024 I Nr. 108) wurde diese Erhöhung **aus haushaltspolitischen Gründen fallengelassen**. Die Schwelle verbleibt bei 800 € netto.

**Aufzeichnungspflichten (§ 6 Abs. 2 Satz 4, 5 EStG):**

| AK/HK | Pflicht |
|---|---|
| ≤ 250 € netto | Keine besonderen Aufzeichnungen erforderlich; sofortiger Aufwand |
| > 250 € und ≤ 800 € netto | **Gesondertes, laufend zu führendes Verzeichnis** mit: Tag der Anschaffung, AK/HK; oder entsprechende Daten im Anlagenverzeichnis |

**GWG vs. Sammelposten — Wahlrecht und Einheitlichkeit:**

Jährliche Entscheidung pro Wirtschaftsjahr — für **alle** Gegenstände > 250 € bis ≤ 1.000 € netto einheitlich:

| Variante | Anwendungsbereich | Behandlung |
|---|---|---|
| **GWG-Sofortabzug** | ≤ 800 € netto | Voller Sofortabzug im Anschaffungsjahr |
| **Sammelposten** (siehe #6) | 250 € < AK ≤ 1.000 € netto | Pool, 5 Jahre gleichmäßig abgeschrieben |

**Nicht kombinierbar im selben Wirtschaftsjahr.**

### Rechtsgrundlage
- **§ 6 Abs. 2 EStG** — GWG-Sofortabzug
- **§ 6 Abs. 2 Satz 4 EStG** — Verzeichnis-Pflicht
- **§ 9b Abs. 1 EStG** — Abgrenzung Vorsteuer (netto-Rechnung)
- **R 6.13 EStR** — Verwaltungsanweisung zu GWG
- **BMF-Schreiben vom 22.03.2018** (IV C 6 - S 2137/17/10001) — Einzelfragen zur GWG-Erhöhung auf 800 €
- **Wachstumschancengesetz vom 27.03.2024** (BGBl. 2024 I Nr. 108) — keine Änderung der Grenze trotz Regierungsentwurf
- **Handelsrechtlich:** Keine explizite GWG-Regelung; Sofortabzug über den Grundsatz der Wesentlichkeit nach § 240 HGB begründbar

**Verwandte Begriffe:**
- [AfA](#3-afa--absetzung-für-abnutzung--7-estg) — Normalfall, den der GWG-Sofortabzug ersetzt
- [Sammelposten / Poolabschreibung](#6-sammelposten--poolabschreibung--6-abs-2a-estg) — Alternative zum GWG im überschneidenden Bereich
- [Anschaffungs- und Herstellungskosten](#2-anschaffungs--und-herstellungskosten--255-hgb) — Bemessungsgrundlage (netto)
- [Anlagenverzeichnis](#8-anlagenverzeichnis--140-ao--r-54-estr) — Alternative Dokumentationsquelle für GWG-Verzeichnis
- [Vorsteuer](./04-steuer-meldungen.md#3-vorsteuer) — muss bei Netto-Schwellenwert-Berechnung ausgeklammert werden

**Verwendung im Code:**
- `src/domain/anlage/gwg/` — GWG-Behandlung
- `src/domain/anlage/gwg/classifier.ts`:
  ```ts
  const GWG_GRENZE_NETTO = new Decimal('800.00');     // Stand 01.01.2018
  const GWG_VERZEICHNIS_GRENZE = new Decimal('250.00');
  
  function classifyAsGwg(anlage: Anlage): GwgKlassifikation {
    const ak_netto = anlage.ak_hk_netto;
    if (ak_netto.lte(GWG_VERZEICHNIS_GRENZE)) return 'GWG_OHNE_VERZEICHNIS';
    if (ak_netto.lte(GWG_GRENZE_NETTO)) return 'GWG_MIT_VERZEICHNIS';
    return 'NICHT_GWG';
  }
  ```
- **Mandanten-Entscheidung pro Wirtschaftsjahr:** `gwg_variante: 'GWG_800' | 'SAMMELPOSTEN_250_1000'` — einmal pro WJ festgelegt, dann sperrt das System die andere Variante
- UI: Anlage-Wizard erkennt GWG-Kandidaten automatisch und schlägt Sofortabzug vor (mit Hinweis auf die Jahres-Entscheidung des Mandanten)
- GWG-Verzeichnis: automatisch aus der Anlagen-Tabelle gefiltert, exportierbar als separate Datei für BP-Anforderungen
- Buchungssatz-Template: `Sonstige betriebliche Aufwendungen / GWG-Sofortabschreibung an Technische Anlagen / Bank` (vereinfacht, je SKR-Spezifikation)

**Nicht verwechseln mit:**
- **Sammelposten (§ 6 Abs. 2a EStG)** — alternatives Verfahren für teils denselben Betragsbereich
- **Erhaltungsaufwand** — laufende Instandhaltung (kein AV-Zugang); anderer Rechnungskreis
- **Büromaterial-Aufwand** — Verbrauchsgüter, keine Anlagegüter
- **Software-Kauf ≤ 800 €** — kann GWG sein, aber auch 1-Jahres-Sonder-ND nach BMF 22.02.2022 (meist gleiche wirtschaftliche Wirkung, aber andere Rechtsgrundlage)
- **Nicht-selbstständig nutzbare Teile** — z. B. Bildschirm eines Computers bei Stückpreis ≤ 800 €, aber in Nutzungseinheit mit Rechner → **kein** GWG, sondern Teil eines Gesamtgegenstands

**Anmerkungen / Edge-Cases:**
- **Selbstständige Nutzbarkeit — das zentrale Auslegungsthema:** Ein Einzelgegenstand muss **für sich allein** funktionstüchtig sein. Beispiele:
  - **Selbstständig nutzbar (GWG möglich):** Bürostuhl, eigenständiger Drucker, kleine Werkzeuge, Mobiltelefon
  - **NICHT selbstständig nutzbar (GWG ausgeschlossen):** Monitor ohne zugehörigen Rechner (BFH), Einzelteil einer Maschine, Regalbrett in einem System-Regal, Werkzeugkoffer-Einzelteile
  Der Validator muss bei Anlage-Erfassung den Nutzer auf dieses Kriterium hinweisen und im Zweifel lieber als normales WG erfassen.
- **Netto-Schwelle:** 800 € = Nettobetrag. Bei 19 % USt entspricht das Brutto 952 €. Bei Kleinunternehmern (§ 19 UStG) ohne Vorsteuerabzug ist die Grenze effektiv der Bruttobetrag, weil die USt zu den AK gehört (§ 9b Abs. 1 EStG im Umkehrschluss).
- **Wachstumschancengesetz — FAQ für Mandanten:** Die geplante Erhöhung auf 1.000 € wurde **fallengelassen**. Status 2026: 800 € gilt unverändert. Das Validator-Modul muss historische Grenzen kennen und bei Altjahren (z. B. 2017: 410 €) die damals gültige Schwelle anwenden.
- **Grenzfall Computer/Software:** Ein PC unter 800 € netto kann sowohl als **GWG** (§ 6 Abs. 2 EStG) als auch über die **ND = 1 Jahr** nach BMF 22.02.2022 steuerlich abgeschrieben werden. Praktisch dieselbe wirtschaftliche Wirkung, aber rechtlich andere Buchung. Empfehlung: Bei AK ≤ 800 € → GWG (einfacher); bei AK > 800 € → ND = 1 Jahr.
- **HB-Behandlung:** Handelsrechtlich existiert kein § 6 Abs. 2 EStG. In der HB kann ein GWG entweder einzeln mit planmäßiger AfA abgeschrieben werden oder — analog zum Steuerrecht — unter dem Gesichtspunkt der Wesentlichkeit sofort als Aufwand erfasst werden (§ 240 HGB, Wesentlichkeitsgrundsatz). Die einmal gewählte Methode bindet wegen Stetigkeit (§ 252 Abs. 1 Nr. 6 HGB).
- **Konsequenzen bei falscher Klassifikation:** Zu Unrecht als GWG behandelte Gegenstände (z. B. > 800 € netto) → Korrektur über Bilanzänderung, Nachbelastung der AfA im Folgejahr. Bei BP häufig gefundener Mangel.
- **Bei Zweifeln zur selbstständigen Nutzbarkeit oder bei komplexen Anlagensystemen Rücksprache mit Steuerberater** — die automatische Klassifikation im Code sollte konservativ erfolgen (im Zweifel kein GWG).

---

## 6. Sammelposten / Poolabschreibung (§ 6 Abs. 2a EStG)

| Feld | Inhalt |
|---|---|
| **Deutsch (primär)** | Sammelposten |
| **Synonyme (DE)** | Poolabschreibung (funktional identisch, im Code und UI häufig verwendet), Pool-AfA (verkürzt), Wirtschaftsgüterpool, Jahres-Sammelposten (präziser, weil jeder WJ einen eigenen Pool bildet) |
| **Arabisch** | مجمع الأصول متوسطة القيمة (آلية تبسيط وفق § 6 Abs. 2a EStG: الأصول الثابتة المستقلة الاستخدام والمتحركة بصافي AK/HK بين 250.01 و 1.000 يورو تُجمَّع في Sammelposten سنوي يُهلَك خطياً 20% على 5 سنوات بصرف النظر عن Nutzungsdauer الفردية؛ الحدود سارية منذ 01.01.2010 (سبقها 150–1.000 يورو 2008–2009)، ولم يُغيَّرها Wachstumschancengesetz رغم اقتراح 5.000 يورو؛ الاختيار Sammelposten/GWG-Sofortabzug حصري للسنة في التداخل 250–800 يورو؛ يبقى المجمع طيلة 5 سنوات حتى عند استبعاد عناصر — لا Abgangsbuchung فردية) |
| **Englisch (Code-Kontext)** | `sammelposten`, `poolDepreciation`, `assetPool` |
| **Kategorie** | Rechtsbegriff / Bewertungsvereinfachung |
| **Status** | FEST |
| **Aufgenommen am** | 2026-04-22, Terminology-Sprint 1 |

### Definition
Alternative zum GWG-Sofortabzug für mittelwertige Anlagegüter: Alle abnutzbaren, beweglichen, selbstständig nutzbaren Anlagegegenstände mit AK/HK netto zwischen **250,01 € und 1.000 €** werden in einem **jährlich neu gebildeten Sammelposten** zusammengefasst und als **Gesamtheit** über **fünf Wirtschaftsjahre linear** abgeschrieben (20 % p. a.). Die individuelle Nutzungsdauer und das individuelle Schicksal der Einzelgegenstände treten in den Hintergrund — es existiert **kein Einzelausweis** im Anlagenverzeichnis für Sammelposten-Gegenstände.

**Schwellenwerte und Pool-Bildung:**

| Position | Wert / Regel |
|---|---|
| **Untergrenze** | > 250,00 € netto (AK/HK pro Gegenstand) |
| **Obergrenze** | ≤ 1.000,00 € netto (AK/HK pro Gegenstand) |
| **Pool-Zeitraum** | Wirtschaftsjahr der Anschaffung |
| **Abschreibungsdauer** | 5 Jahre linear, **zwingend** 20 % p. a. |
| **Pool-Eröffnungssaldo** | Summe aller AK/HK der qualifizierenden Gegenstände des WJ |
| **Pool-Bestand** | Bleibt bis Ende der 5-Jahres-Abschreibung als Einheit bestehen |

**Zentrale Besonderheit — kein individueller Abgang:**

Anders als bei einzelaktivierten Anlagegütern ist im Sammelposten das **Einzelschicksal** eines Gegenstands **unerheblich**:

| Ereignis | Wirkung auf Sammelposten |
|---|---|
| Einzelgegenstand wird verkauft | Erlös = Betriebseinnahme; Pool unverändert |
| Einzelgegenstand wird zerstört / entsorgt | Keine außerplanmäßige Abschreibung; Pool unverändert |
| Einzelgegenstand wird ausgesondert | Keine Abgangsbuchung; Pool unverändert |
| Einzelgegenstand wird weiterverkauft nach Ablauf der 5 Jahre | Kein Restbuchwert zu verrechnen (Pool ist vollständig abgeschrieben) |

**Schwellenwert-Historie:**

| Zeitraum | Sammelposten-Bereich | Bemerkung |
|---|---|---|
| 2008–2009 | 150 € < AK ≤ 1.000 € | **Zwangs-Sammelposten** — kein GWG-Wahlrecht |
| **Seit 01.01.2010** | **250 € < AK ≤ 1.000 €** | **Wahlrecht** zur GWG-Variante (800 € Sofort) |

**Wachstumschancengesetz — geplante, aber nicht realisierte Erhöhung:**
Der Regierungsentwurf sah eine Anhebung der Sammelposten-Obergrenze von 1.000 € auf **5.000 €** sowie eine Verkürzung der Abschreibungsdauer auf 3 Jahre vor. Beide Änderungen wurden im Vermittlungsausschuss **fallengelassen** (BGBl. 2024 I Nr. 108 vom 27.03.2024). Die Regelung bleibt bei 250 € / 1.000 € und 5 Jahren.

**Einheitlichkeitsregel — Wahlrecht pro Wirtschaftsjahr:**

Die Entscheidung zwischen GWG und Sammelposten muss **für alle** Anlagegüter zwischen 250 und 800 € netto eines Wirtschaftsjahres **einheitlich** getroffen werden:

| Bereich AK/HK netto | GWG-Variante | Sammelposten-Variante |
|---|---|---|
| ≤ 250 € | Sofortabzug ohne Verzeichnis | Sofortabzug ohne Verzeichnis (identisch) |
| 250,01 € – 800 € | **GWG-Sofortabzug mit Verzeichnis** | **In Sammelposten** |
| 800,01 € – 1.000 € | Normale AfA über ND | **In Sammelposten** |
| > 1.000 € | Normale AfA über ND | Normale AfA über ND |

Der Pool wird nur dann wirksam, wenn der Mandant die Sammelposten-Variante gewählt hat. Wahl der GWG-Variante heißt: Gegenstände 800,01–1.000 € werden einzel-aktiviert und regulär abgeschrieben.

### Rechtsgrundlage
- **§ 6 Abs. 2a EStG** — Poolabschreibung
- **R 6.13 EStR** — Verwaltungsanweisung
- **BMF-Schreiben vom 30.09.2010** (IV C 6 - S 2180/09/10001) — Sammelposten-Behandlung bei Umwandlungen und Betriebsaufgaben
- **Wachstumschancengesetz vom 27.03.2024** (BGBl. 2024 I Nr. 108) — keine Änderung der Grenzen
- **Handelsrechtlich:** Keine Parallelvorschrift; ähnliche Pool-Ansätze über § 240 HGB (Wesentlichkeit) argumentierbar, aber nicht gesetzlich geregelt — typische HB/SB-Abweichung möglich

**Verwandte Begriffe:**
- [GWG](#5-gwg--geringwertige-wirtschaftsgüter--6-abs-2-estg) — konkurrierendes Vereinfachungsverfahren
- [AfA](#3-afa--absetzung-für-abnutzung--7-estg) — normales Verfahren für Anlagegüter > 1.000 €
- [Anschaffungs- und Herstellungskosten](#2-anschaffungs--und-herstellungskosten--255-hgb) — Bemessungsgrundlage netto
- [Anlagenverzeichnis](#8-anlagenverzeichnis--140-ao--r-54-estr) — Sammelposten erscheinen als **Summen-Zeile**, nicht einzeln
- [Handelsbilanz](./05-jahresabschluss.md#7-handelsbilanz) / [Steuerbilanz](./05-jahresabschluss.md#8-steuerbilanz) — in HB oft separate Einzel-AfA, in SB Pool → Überleitung nötig

**Verwendung im Code:**
- `src/domain/anlage/sammelposten/` — Pool-Verwaltung
- `src/domain/anlage/sammelposten/pool.ts`:
  ```ts
  interface SammelPool {
    mandant_id: string;
    wirtschaftsjahr: number;        // z. B. 2026
    startwert: Decimal;              // Summe AK/HK aller Pool-Gegenstände
    afa_pro_jahr: Decimal;           // startwert * 0.20
    beginn: Date;                    // 1. Tag des WJ bzw. Anschaffungs-Monat (monatsgenau optional)
    aktueller_buchwert: Decimal;     // automatisch reduziert
    abschluss_jahr: number;          // wirtschaftsjahr + 4
    gegenstaende: SammelPositionRef[]; // interne Auflistung (NICHT im Anlagenverzeichnis)
  }
  ```
- Für jedes Wirtschaftsjahr entsteht ein **eigener** Pool — in einem Mandanten-Datenbestand laufen mehrere Pools parallel (einer pro WJ der letzten 5 Jahre)
- `gegenstaende` ist **interne Buchhaltung** (für BP-Nachfragen), aber **kein Anlagenverzeichnis-Eintrag** mit AfA-Plan
- Abgangsbuchungen (Verkauf, Entsorgung): betreffen **nur die GuV**, nicht den Pool
- Am Ende des WJ + 4 ist der Pool-Buchwert = 0 und der Pool wird archiviert
- **Mandanten-Entscheidung:** Feld `gwg_sammelposten_wahl_{wj}` mit Enum `GWG_800 | SAMMELPOSTEN`; einmal gesetzt pro WJ, sperrt die Alternative
- UI: Separate Ansicht „Sammelposten-Übersicht" mit allen aktiven Pools und Restlaufzeiten

**Nicht verwechseln mit:**
- **GWG (§ 6 Abs. 2 EStG)** — unterschiedliche Rechtsgrundlage, unterschiedliche Wirkung (Sofortabzug vs. 5-Jahres-Verteilung)
- **Anlagenpool / Pool-Strategie (Management)** — Fachsprache der Betriebswirtschaft, kein Bilanzbegriff
- **Einheitlicher AfA-Plan über gleichartige Güter** — individuelle AfA je Gegenstand, nur gleich konfiguriert; Sammelposten ist echtes Aggregat
- **Abschreibungspool in IFRS** — IFRS kennt kein analoges Vereinfachungsverfahren
- **Sammelwertberichtigung** (bei Forderungen) — bilanzielle Wertminderung im UV, nicht Pool-AfA

**Anmerkungen / Edge-Cases:**
- **Einheitlichkeit — praktische Falle:** Wenn der Mandant im WJ 2026 mindestens einen Gegenstand 250,01–800 € netto als Sammelposten erfasst hat, **können keine** anderen Gegenstände desselben WJ im selben Bereich als GWG behandelt werden. UI-Sperre nach erster Pool-Erstellung im WJ zwingend.
- **Kein Abgangseffekt:** Ein Mandant, der einen Sammelposten-Gegenstand nach 2 Jahren verkauft, darf **nicht** den anteiligen Restbuchwert als Abgang buchen — der Erlös ist voller Betriebsertrag, der Pool läuft weiter. Dies ist wirtschaftlich unvorteilhaft und steht im Kontrast zur Einzel-AfA.
- **HB-Behandlung:** § 6 Abs. 2a EStG ist rein steuerrechtlich. In der HB gibt es keine Parallelvorschrift. Praktisch werden Sammelposten-Gegenstände in der HB meistens entweder:
  1. Einzeln mit ND-konformer AfA bilanziert (klassische HB-Behandlung), oder
  2. Unter Wesentlichkeitsgrundsatz sofort als Aufwand gebucht (vereinfachte HB).
  → HB/SB-Abweichung typisch; Überleitungsrechnung erforderlich.
- **Mandantenwechsel / Umwandlung:** Bei Betriebsaufgabe, Umwandlung, Verschmelzung werden Sammelposten als Einheit übertragen und weitergeführt (BMF 30.09.2010).
- **Monatsgenauigkeit:** § 6 Abs. 2a EStG ist **jahresbasiert**, nicht monatsgenau. Im Anschaffungs-WJ voller 20 %-Abzug, unabhängig vom Monat. Dies unterscheidet sich deutlich von der monatsgenauen regulären AfA (§ 7 Abs. 1 Satz 4 EStG).
- **Wachstumschancengesetz-Falle in Altdokumentation:** Falls Mandanten oder Software älter als März 2024 dokumentieren, ist zu prüfen, ob irrtümlich die Entwurfs-Grenzen (1.000 € / 5.000 € / 3 Jahre) übernommen wurden. Aktueller Stand: 250 / 1.000 / 5 Jahre, unverändert.
- **Bei Betriebsaufgabe oder größeren Umstrukturierungen Rücksprache mit Steuerberater** — Sammelposten-Behandlung ist dort nicht intuitiv.

---

## 7. Teilwert + Teilwertabschreibung (§ 6 Abs. 1 EStG)

| Feld | Inhalt |
|---|---|
| **Deutsch (primär)** | Teilwert / Teilwertabschreibung |
| **Synonyme (DE)** | TW (Abkürzung Teilwert), außerplanmäßige Abschreibung (HGB-Begriff, § 253 Abs. 3 Satz 5 HGB), Abschreibung auf den niedrigeren Teilwert, Abwertung (unscharf, umgangssprachlich) |
| **Arabisch** | القيمة الجزئية والإهلاك الاستثنائي إلى القيمة الجزئية (Teilwert — التعريف الضريبي وفق § 6 Abs. 1 Nr. 1 Satz 3 EStG: المبلغ الذي يدفعه مشترٍ افتراضي للمنشأة بأكملها للأصل الفردي ضمن Going Concern؛ Teilwertabschreibung وفق § 6 Abs. 1 Nr. 1 Satz 2 EStG: خفض القيمة الدفترية إلى Teilwert الأدنى عند voraussichtlich dauernde Wertminderung؛ في Handelsbilanz إلزامية للأصول الثابتة وفق § 253 Abs. 3 Satz 5 HGB، بينما في Steuerbilanz أصبحت خياراً لا إلزاماً بعد BilMoG 2009 — عكس القاعدة العادية حيث HB تسمح و SB تُلزِم؛ Wertaufholungsgebot وفق § 253 Abs. 5 Satz 1 HGB و § 6 Abs. 1 Nr. 1 Satz 4 EStG: رفع القيمة عند زوال أسباب الانخفاض) |
| **Englisch (Code-Kontext)** | `teilwert`, `impairment` (IFRS-nah, aber konzeptuell nicht identisch), `extraordinaryWriteDown` |
| **Kategorie** | Rechtsbegriff / Bewertungsmaßstab + Abschreibungsereignis |
| **Status** | FEST |
| **Aufgenommen am** | 2026-04-22, Terminology-Sprint 1 |

### Definition

**Teilwert (§ 6 Abs. 1 Nr. 1 Satz 3 EStG):**
> Der Betrag, den ein Erwerber des ganzen Betriebs im Rahmen des Gesamtkaufpreises für das einzelne Wirtschaftsgut ansetzen würde, unter der Voraussetzung, dass er den Betrieb fortführt.

Dies ist ein **fiktiver, unternehmensbezogener** Einzelwert — nicht der Marktwert und nicht der Verkehrswert. Er berücksichtigt die Einbettung des Gegenstands in die Betriebsorganisation.

**Teilwertabschreibung (§ 6 Abs. 1 Nr. 1 Satz 2, Nr. 2 Satz 2 EStG):**
> Außerplanmäßige Abschreibung des Buchwerts auf den niedrigeren Teilwert bei **voraussichtlich dauernder** Wertminderung.

**HB / SB — Pflicht- vs. Wahlrecht (gegenläufig zur Normalintuition!):**

Die Abschreibungs-Logik bei dauernder Wertminderung unterscheidet sich nach Bilanz und Art des Vermögens:

| Vermögensart | Handelsbilanz (HGB) | Steuerbilanz (EStG) |
|---|---|---|
| **Anlagevermögen** bei **voraussichtlich dauernder** Wertminderung | **Pflicht** zur Abschreibung (§ 253 Abs. 3 Satz 5 HGB — gemildertes Niederstwertprinzip) | **Wahlrecht** (§ 6 Abs. 1 Nr. 1 Satz 2 EStG, seit BilMoG 2009) |
| **Anlagevermögen** bei vorübergehender Wertminderung | Wahlrecht nur für Finanzanlagen (§ 253 Abs. 3 Satz 6 HGB); sonst **Verbot** | **Verbot** (§ 6 Abs. 1 Nr. 1 Satz 2 EStG — nur bei dauernder) |
| **Umlaufvermögen** bei jeder Wertminderung | **Pflicht** (§ 253 Abs. 4 HGB — strenges Niederstwertprinzip) | **Wahlrecht** bei dauernder Minderung (§ 6 Abs. 1 Nr. 2 Satz 2 EStG) |

**Ausnahme-Muster „HB pflichtig, SB wahlfrei":**
Das ist eine der seltenen Konstellationen, wo die HB **strenger** ist als die SB. Folge in der Praxis: Um HB = SB zu erhalten (Einheitsbilanz-Wunsch), nehmen Mandanten die SB-Abschreibung freiwillig vor. Ohne diese Wahlrechtsausübung entsteht klassische HB/SB-Abweichung mit Überleitungseintrag.

**Voraussetzungen der Teilwertabschreibung:**

1. **Wertminderung** zum Bilanzstichtag (Teilwert < Buchwert)
2. **Voraussichtlich dauernd** — mehr als nur vorübergehend
3. **Nachweis** der Werte (Gutachten, Marktdaten, branchenübliche Anhaltspunkte)
4. **Dokumentation** in der Buchführung / Mandantenakte

**BFH-Leitlinien zur „voraussichtlich dauernden" Wertminderung:**

| Vermögensart | BFH-Richtwert |
|---|---|
| Abnutzbares AV | Wertminderung mindestens während **halber Restnutzungsdauer** |
| Nicht abnutzbares AV (Grundstücke, Beteiligungen) | Wertminderung hält länger als bis zum nächsten Bilanzstichtag |
| Umlaufvermögen / Wertpapiere | BFH I R 89/05 vom 14.03.2006: > 40 % Kursrückgang, oder am Bilanzstichtag UND bei Bilanzaufstellung gleich niedriger Kurs |

**Wertaufholungsgebot:**

| Gegenstand | Rechtsgrundlage | Wirkung |
|---|---|---|
| Alle Vermögensgegenstände (HB) | **§ 253 Abs. 5 Satz 1 HGB** | **Pflicht** zur Zuschreibung, wenn Gründe der Abschreibung entfallen sind — bis zu den AK/HK abzgl. planmäßiger AfA (keine Überschreitung der AK/HK!) |
| Geschäfts- oder Firmenwert | § 253 Abs. 5 Satz 2 HGB | **Verbot** der Wertaufholung (Sonderfall) |
| Steuerbilanz (alle AV + UV) | **§ 6 Abs. 1 Nr. 1 Satz 4, Nr. 2 Satz 3 EStG** | Pflicht zur Zuschreibung |

Wertaufholung wirkt **wie ein negativer Abschreibungsaufwand** — also als Ertrag in der GuV.

### Rechtsgrundlage
- **§ 6 Abs. 1 Nr. 1 Satz 2, 3 EStG** — Teilwert und Teilwertabschreibung beim AV
- **§ 6 Abs. 1 Nr. 2 Satz 2, 3 EStG** — beim UV
- **§ 6 Abs. 1 Nr. 1 Satz 4 EStG** — steuerliches Wertaufholungsgebot
- **§ 253 Abs. 3 Satz 5, 6 HGB** — gemildertes Niederstwertprinzip AV
- **§ 253 Abs. 4 HGB** — strenges Niederstwertprinzip UV
- **§ 253 Abs. 5 HGB** — handelsrechtliches Wertaufholungsgebot (mit Ausnahme Firmenwert)
- **R 6.7 ff. EStR** — Verwaltungsanweisungen zum Teilwert
- **BMF-Schreiben vom 02.09.2016** (IV C 6 - S 2171-b/09/10002 :002) — dauernde Wertminderung bei festverzinslichen Wertpapieren
- **BFH I R 89/05 vom 14.03.2006** — dauernde Wertminderung bei Wertpapieren
- **BFH I R 23/00 vom 27.03.2001** — Teilwertabschreibung im Grundsatz

**Verwandte Begriffe:**
- [Anschaffungs- und Herstellungskosten](#2-anschaffungs--und-herstellungskosten--255-hgb) — Obergrenze der Wertaufholung
- [AfA](#3-afa--absetzung-für-abnutzung--7-estg) — planmäßige Gegenstück; Teilwert ist außerplanmäßig
- [Nutzungsdauer](#4-nutzungsdauer--afa-tabellen) — nach Teilwertabschreibung wird über **Rest-ND** weiterabgeschrieben
- [Handelsbilanz](./05-jahresabschluss.md#7-handelsbilanz) / [Steuerbilanz](./05-jahresabschluss.md#8-steuerbilanz) — parallele Behandlung mit teils umgekehrten Pflicht-/Wahlrechten
- [Maßgeblichkeitsprinzip](./05-jahresabschluss.md#6-maßgeblichkeitsprinzip--5-abs-1-estg) — Teilwertabschreibung ist klassischer Durchbrechungsfall
- [Rückstellungen](./05-jahresabschluss.md#9-rückstellungen--249-hgb) — **nicht verwechseln**: Rückstellungen sind Passivposten, Teilwertabschreibung wirkt aktivseitig

**Verwendung im Code:**
- `src/domain/anlage/teilwert/` — Teilwert- und Wertaufholungs-Engine
- `src/domain/anlage/teilwert/event.ts`:
  ```ts
  interface TeilwertEreignis {
    anlage_id: string;
    stichtag: Date;
    ereignis: 'abschreibung' | 'wertaufholung';
    alter_buchwert_hb: Decimal;
    neuer_buchwert_hb: Decimal;
    alter_buchwert_sb: Decimal;
    neuer_buchwert_sb: Decimal;
    begruendung: string;              // Pflicht-Dokumentation
    nachweise: DocumentRef[];          // Gutachten, Marktdaten
    ist_dauernde_wertminderung: boolean;
    rest_nutzungsdauer_neu: number;
    quelle_paragraph: string;          // z. B. "§ 6 Abs. 1 Nr. 1 Satz 2 EStG"
  }
  ```
- **Event-Sourcing:** jede Teilwert-Aktion ist ein unveränderliches Ereignis mit vollständigem Vorher-Nachher-Stand
- **HB/SB-Divergenz-Handling:**
  ```ts
  // Typischer Fall: HB-Pflicht, SB-Wahl
  // Wenn Mandant SB-Abschreibung NICHT wählt → Überleitungseintrag
  if (hb_abgeschrieben && !sb_abgeschrieben) {
    createUeberleitungsEintrag({
      differenz: alter_buchwert_hb.minus(neuer_buchwert_hb),
      regel: 'TEILWERT_HB_PFLICHT_SB_WAHL',
      paragraph: '§ 253 Abs. 3 Satz 5 HGB / § 6 Abs. 1 Nr. 1 Satz 2 EStG'
    });
  }
  ```
- **Wertaufholungs-Prüfung:** automatisiert am Jahresende; wenn aktuelle Marktdaten oder Teilwert-Schätzung über dem Buchwert liegen UND AK/HK-Grenze noch nicht erreicht → Warnung mit Zuschreibungs-Vorschlag
- **Dokumentationspflicht:** Upload-Feld für Gutachten/Nachweise ist Pflicht bei jeder Teilwert-Aktion; ohne Dokument keine Buchung zulässig
- **AfA-Neuberechnung:** nach Teilwert-Abschreibung: `Neue Jahres-AfA = neuer Buchwert ÷ Rest-ND` (prospektive Anpassung, keine rückwirkende)

**Nicht verwechseln mit:**
- **Planmäßige Abschreibung / AfA** — regelmäßig, zeitraumbezogen; Teilwert ist ereignisbezogen
- **Fair Value (IFRS / IAS 36)** — konzeptuell ähnlich (Impairment), aber formell und rechnerisch anders; Fair Value ist marktorientiert, Teilwert ist betriebsgebunden und inkludiert die Fortführungsprämisse
- **Verkehrswert / Marktwert** — Wertmaßstab im Steuerrecht außerhalb der Bilanzierung (z. B. Erbschaftsteuer); nicht Teilwert
- **Abschreibung auf Forderungen** — Wertberichtigung nach § 253 Abs. 4 HGB, systematisch verwandt, aber eigene Begriffswelt
- **Außerplanmäßige Abschreibung (HGB-Begriff)** — Oberbegriff für Teilwertabschreibung + ähnliche Wertkorrekturen
- **Rückstellung** — Passivposten; Teilwertabschreibung korrigiert aktivseitig

**Anmerkungen / Edge-Cases:**
- **„Voraussichtlich dauernd" — die schwierigste Auslegungsfrage:** BFH und BMF haben Leitlinien aufgestellt, aber jede Einzelentscheidung ist dokumentationsintensiv. Praxistipp: Zum Bilanzstichtag + Bilanzaufstellungs-Zeitpunkt doppelt prüfen (aktuelle Daten einbeziehen = Wertaufhellung).
- **HB-Pflicht / SB-Wahl als Steuer-Gestaltungsfrage:** Mandanten können durch bewusste Nicht-Ausübung der SB-Wahl ihren steuerlichen Gewinn höher halten (Rücklagen-Effekt). Das ist legal, erzeugt aber HB/SB-Divergenz, die das Datenmodell korrekt abbilden muss. Strategie-Entscheidung bleibt beim Mandanten bzw. Steuerberater.
- **Teilwertvermutung (R 6.7 EStR):** Die Finanzverwaltung geht davon aus, dass der Teilwert = AK/HK (bei neuer Anlage) oder = AK/HK abzgl. planmäßiger AfA (bei laufender Anlage) ist. Eine Abweichung nach unten muss der Steuerpflichtige begründen und nachweisen.
- **Wertaufholung — AK/HK als Deckel:** Zuschreibungen dürfen die ursprünglichen AK/HK abzgl. planmäßiger AfA nicht überschreiten. Das System MUSS diese Obergrenze automatisch validieren und Überschreitung blocken.
- **Sonderfall Firmenwert (Goodwill):** § 253 Abs. 5 Satz 2 HGB verbietet Zuschreibungen nach Teilwertabschreibung auf GoF (unwiderrufliche Abschreibung). Steuerlich gilt dagegen das normale Wertaufholungsgebot (§ 6 Abs. 1 Nr. 1 Satz 4 EStG) → dauerhafte HB/SB-Abweichung möglich.
- **Wertminderung bei Grundstücken:** Grundstücke sind nicht abnutzbar → keine AfA. Teilwertabschreibung bleibt das einzige Instrument zur Wertkorrektur (bei dauernder Minderung). Häufig bei nachträglich entdeckten Altlasten, Bebauungsplan-Änderungen etc.
- **BFH-Rechtsprechung ist im Fluss:** Die Auslegung der dauernden Wertminderung wird regelmäßig verfeinert. Aktuelle Entscheidungen (zu Wertpapieren, Beteiligungen, Immobilien) sind zu beobachten.
- **Bei jeder Teilwertabschreibung > Bagatellgrenze Rücksprache mit Steuerberater** empfohlen, insbesondere bei Beteiligungen und Immobilien — die Grenze zwischen dauernder und vorübergehender Wertminderung ist im Einzelfall streitanfällig und bei Betriebsprüfungen häufig ein Schwerpunkt.

---

## 8. Anlagenverzeichnis (§ 140 AO + R 5.4 EStR)

| Feld | Inhalt |
|---|---|
| **Deutsch (primär)** | Anlagenverzeichnis |
| **Synonyme (DE)** | Anlagekartei (klassisch, v. a. in Papierform), Anlagenkartei (variante Schreibweise), Anlagegegenstandsverzeichnis (vollständig), Anlagenbuch (im Nebenbuch-Kontext) |
| **Arabisch** | سجل الأصول الثابتة (السجل التفصيلي المستمر — غير الدوري — الذي يوثِّق لكل أصل ثابت في المنشأة بياناته الكاملة: التاريخ، الوصف، AK/HK، طريقة الإهلاك، Nutzungsdauer، AfA السنوي والـ kumulierte، Buchwert الحالي، تاريخ الخروج عند الاستبعاد؛ يُعتبر Nebenbuch المُكمِّل لـ Hauptbuch، وبه تُمسَّك **كل** Sachanlagen بشكل فردي — باستثناء عناصر Sammelposten التي تُوثَّق إجمالياً؛ ملزِم قانونياً بموجب § 140 AO للمكلفين بمسك Handelsbilanz ولكل المُعَرَّضين لـ § 141 AO، وتفصيلاته في R 5.4 EStR؛ يخضع بالكامل لـ GoBD-Revisionssicherheit بكل أبعاد التعديلات المحظورة والأصلية غير القابلة للحذف؛ هو المصدر الذي يُشتَق منه Anlagenspiegel في الـ Anhang لاحقاً) |
| **Englisch (Code-Kontext)** | `fixedAssetsRegister`, `anlagenverzeichnis`, `assetLedger` |
| **Kategorie** | Rechtsbegriff / Dokumentationsinstrument (Nebenbuch) |
| **Status** | FEST |
| **Aufgenommen am** | 2026-04-22, Terminology-Sprint 1 |

### Definition
Laufend zu führendes **Nebenbuch**, in dem jeder einzelne Gegenstand des Anlagevermögens mit allen bewertungs- und abschreibungsrelevanten Daten dokumentiert wird. Rechtsgrundlage ist die Pflicht zur ordnungsmäßigen Buchführung (§§ 238, 240 HGB + § 140 AO); die inhaltlichen Anforderungen ergeben sich aus R 5.4 EStR. Das Anlagenverzeichnis ist die Grundlage für die AfA-Berechnung, den Anlagenspiegel (§ 284 Abs. 3 HGB) und die Betriebsprüfung.

**Pflicht-Inhalte pro Anlage (R 5.4 EStR):**

| Feld | Pflicht | Hinweis |
|---|---|---|
| Fortlaufende Kennnummer | ✅ | einmalig, lückenlos |
| Bezeichnung / Beschreibung | ✅ | hinreichend konkret |
| Hersteller / Typ / Seriennummer | ✅ (bei eindeutiger Identifikation) | wichtig bei BP |
| Anschaffungs- / Herstellungsdatum | ✅ | Basis für monatsgenaue AfA |
| Anschaffungs- / Herstellungskosten | ✅ | netto, ggf. Vorsteuer-Information separat |
| AfA-Methode | ✅ | linear / degressiv / Leistung / etc. |
| Nutzungsdauer (ND) | ✅ | in Monaten für Präzision |
| Jahres-AfA | ✅ | errechnet |
| Kumulierte AfA | ✅ | laufende Summe |
| Buchwert | ✅ | AK/HK - kumulierte AfA |
| Außerplanmäßige Abschreibungen | bei Vorkommen | Teilwertabschreibung etc. |
| Zugang / Abgang | ✅ | Datum, Beleg, ggf. Veräußerungserlös |
| Standort / Kostenstelle | empfohlen | praktisch wichtig |

**Pflicht zur Führung:**

| Personenkreis | Pflicht zum Anlagenverzeichnis | Rechtsgrundlage |
|---|---|---|
| Kaufmann i. S. v. HGB (Bilanzierender) | ✅ | § 140 AO |
| Steuerpflichtiger nach § 141 AO (originäre Buchführungspflicht) | ✅ | § 141 AO + R 5.4 EStR |
| EÜR-Rechner (§ 4 Abs. 3 EStG) | ✅ (auf Anforderung der Finanzbehörde) | § 146 Abs. 2 AO |
| GWG-Verzeichnis (separat oder integriert) | ✅ ab AK > 250 € | § 6 Abs. 2 Satz 4 EStG |

**Formale Anforderungen (GoBD Rz. 107 ff.):**

- **Zeitgerechtheit:** laufende Fortschreibung, nicht erst am Jahresende
- **Unveränderbarkeit:** Änderungen nur durch nachvollziehbare Korrektur-Einträge, keine Löschung
- **Vollständigkeit:** keine Lücken in Kennnummern-Serien
- **Richtigkeit:** Abgleich mit Inventur und Hauptbuch muss möglich sein
- **Ordnung:** eindeutige Zuordnung zu einem Konto des Hauptbuchs (SKR03/04)
- **Nachprüfbarkeit:** jede Buchung muss innerhalb angemessener Zeit überprüfbar sein

**Abgrenzung zum Anlagenspiegel (§ 284 Abs. 3 HGB):**

| Aspekt | Anlagenverzeichnis | Anlagenspiegel |
|---|---|---|
| Detailgrad | Einzelgegenstand | Aggregation nach Kategorie / Bilanzposition |
| Inhalt | Vollständige Historie jeder Anlage | Jahresbewegung (Zugänge, Abgänge, AfA, Zuschreibungen) je Position |
| Adressat | Interne Dokumentation + Finanzamt / BP | Externe Anhang-Veröffentlichung |
| Rechtsgrundlage | § 140 AO + R 5.4 EStR | § 284 Abs. 3 HGB (nur KapG) |
| Frequenz | laufend | einmal pro GJ im Anhang |

### Rechtsgrundlage
- **§ 140 AO** — Derivative Pflicht zur Buchführung (HGB-Pflichtige)
- **§ 141 AO** — Originäre steuerliche Buchführungspflicht (Umsatz > 600.000 € oder Gewinn > 60.000 €)
- **§ 145 AO** — Allgemeine Anforderungen an die Buchführung
- **§ 146 AO** — Ordnungsvorschriften (zeitgerecht, geordnet, unveränderbar)
- **§ 147 AO** — Aufbewahrungspflicht **10 Jahre**
- **R 5.4 EStR** — Detailvorgaben zum Anlagenverzeichnis
- **§ 6 Abs. 2 Satz 4 EStG** — Sonderpflicht für GWG-Verzeichnis (> 250 € netto)
- **§ 238 ff. HGB** — Handelsrechtliche Buchführungspflicht
- **§ 284 Abs. 3 HGB** — Anlagenspiegel als abgeleitete Darstellung (nur KapG)
- **GoBD Rz. 107 ff.** — Ordnungsmäßigkeit elektronisch geführter Nebenbücher

**Verwandte Begriffe:**
- [Anlagevermögen](#1-anlagevermögen--247-abs-2-hgb) — dokumentierter Gegenstand
- [AK/HK](#2-anschaffungs--und-herstellungskosten--255-hgb) / [AfA](#3-afa--absetzung-für-abnutzung--7-estg) / [Nutzungsdauer](#4-nutzungsdauer--afa-tabellen) — Pflichtfelder
- [GWG](#5-gwg--geringwertige-wirtschaftsgüter--6-abs-2-estg) — separates oder integriertes Verzeichnis
- [Sammelposten](#6-sammelposten--poolabschreibung--6-abs-2a-estg) — **nicht** einzeln im Verzeichnis, sondern als Pool-Summe
- [Inventar](#9-inventar--240-hgb) — AV-Teil des Inventars wird aus dem Anlagenverzeichnis abgeleitet
- [Inventur](#10-inventur--241-hgb--festwert-verfahren--240-abs-3-hgb) — körperliche Bestandsfeststellung gleicht sich mit dem Verzeichnis ab
- [Anhang](./05-jahresabschluss.md#4-anhang) / [Anlagenspiegel](./05-jahresabschluss.md#4-anhang) — abgeleitete Darstellung bei KapG
- [GoBD](./01-grundlagen.md#1-gobd) — Revisionssicherheitsanforderungen

**Verwendung im Code:**
- `src/domain/anlage/verzeichnis/` — Anlagenverzeichnis-Modul
- Datenbankstruktur: jede Anlage = eigene Zeile in Tabelle `anlagen` mit allen Pflicht- und Zusatzfeldern
- **Unveränderlichkeit:** keine `UPDATE`-Statements auf bestehende Anlage-Einträge; alle Änderungen als neue Event-Einträge in `anlage_events` (Event-Sourcing)
- `src/reports/anlagenverzeichnis/` — Druck-/Export-Generator (CSV, PDF, GDPdU-konformer Export)
- Automatische Jahres-Weiterführung: zum 01.01. jedes neuen WJ werden Buchwerte als Startwerte übernommen, AfA-Plan läuft weiter
- Integration mit Buchhaltung:
  - Anschaffungsbuchung → automatisch neuer Anlagen-Eintrag
  - Monats-AfA → automatisch aggregierte Buchung aus Verzeichnis-Daten
  - Abgang → automatische Buchung Restbuchwert auf Anlagenabgang + Verkaufserlös
- GWG-Filter: automatische Bereitstellung als separater Report (§ 6 Abs. 2 Satz 4 EStG)
- **Verknüpfung Sammelposten:** Anlagenverzeichnis enthält **eine** Zeile pro Sammelposten (Pool-Summe), Einzelgegenstände im Pool nur als interne Referenz
- Exportformat für BP / GDPdU: Z3-Datenträgerüberlassung + IDEA/DSAG-kompatibel

**Nicht verwechseln mit:**
- **Anlagenspiegel** (§ 284 Abs. 3 HGB) — aggregierte Darstellung im Anhang; Anlagenverzeichnis ist die detaillierte Grundlage
- **GWG-Verzeichnis** — Teilmenge des Anlagenverzeichnisses (> 250 € netto), kann integriert oder separat geführt werden
- **Inventar** (§ 240 HGB) — Gesamtverzeichnis aller Vermögen und Schulden; Anlagenverzeichnis ist nur der AV-Teil
- **Anlagenkartei** (Papier-Altform) — historischer Begriff; inhaltlich identisch, aber heute elektronisch geführt
- **Hauptbuch** — führt **Sachkonten** (Summen), nicht **Einzelgegenstände**; Anlagenverzeichnis liefert die Detailebene zum Hauptbuch-Konto
- **Inventar-Liste** (operativ) — reine Bestandsliste, oft ohne Bewertung; Anlagenverzeichnis ist die bewertungs-vollständige Form

**Anmerkungen / Edge-Cases:**
- **Sammelposten-Eintrag:** Nur **eine** Zeile pro Sammelposten (Jahres-Pool), nicht pro Einzelgegenstand. Die Einzelzuordnung der im Pool enthaltenen Gegenstände kann intern (z. B. Excel, Datenbank-Tabelle) geführt werden, ist aber **nicht** Bestandteil des formellen Anlagenverzeichnisses. Bei BP-Nachfrage muss die interne Liste aber vorlegbar sein.
- **GWG-Verzeichnis als Teil oder separat:** § 6 Abs. 2 Satz 4 EStG lässt beides zu. Empfohlen: Integration in ein gemeinsames Anlagenverzeichnis mit Filter-/Report-Funktion. So vermeidet man doppelte Pflege.
- **Aufbewahrungsfrist 10 Jahre:** Anlagenverzeichnis und zugrundeliegende Belege (Rechnungen, Abgangsnachweise) sind 10 Jahre aufzubewahren (§ 147 Abs. 1 Nr. 1, 4 AO i. V. m. § 147 Abs. 3 AO). Bei laufenden Gegenständen gilt die Frist für das **letzte Wirtschaftsjahr**, in dem der Gegenstand aktiv war (BFH X R 20/06).
- **Elektronische Archivierung (GoBD):** Bei elektronisch geführtem Verzeichnis muss die Originalform (Datenformat) 10 Jahre lesbar und auswertbar archiviert werden. Screenshot-PDFs reichen **nicht** — maschinenauswertbare Formate (CSV, XML) sind erforderlich.
- **Abstimmung mit Hauptbuch:** Summe der Buchwerte des Anlagenverzeichnisses muss zum Saldo des zugehörigen Hauptbuch-Kontos passen. Abweichungen deuten auf Buchungsfehler hin → automatischer Abstimmungs-Check am Monats- / Jahresende zwingend.
- **Abstimmung mit Inventur:** Die körperliche Inventur muss das Anlagenverzeichnis bestätigen. Abweichungen (Fehlmengen, nicht mehr vorhandene Gegenstände) führen zu Abgangs- oder Teilwert-Buchungen.
- **Altgegenstände / unbekannte Anlagen:** Bei Neueinrichtung einer Buchhaltungssoftware mit Bestandsdaten ist die Überführung aus dem Altsystem kritisch — alle ursprünglichen AK/HK, Anschaffungsdaten, kumulierte AfA müssen nachvollziehbar migriert werden (GoBD-Kontinuität).
- **Bei Migrationen, komplexen Sammelposten-Situationen oder bei BP-Vorbereitung Rücksprache mit Steuerberater** — die Vollständigkeit und Revisionssicherheit des Anlagenverzeichnisses ist ein BP-Schwerpunkt.

---

## 9. Inventar (§ 240 HGB)

| Feld | Inhalt |
|---|---|
| **Deutsch (primär)** | Inventar |
| **Synonyme (DE)** | Bestandsverzeichnis (enger gefasst, nur Sachen), Vermögensverzeichnis (weiter gefasst), Jahresinventar (zur Abgrenzung vom Eröffnungsinventar) |
| **Arabisch** | قائمة الجرد الشاملة (**الوثيقة** الإلزامية التي تُعِدّها كل منشأة كاملة المحاسبة في كل Bilanzstichtag وفي بداية نشاطها — Eröffnungsinventar — وفق § 240 HGB؛ تحتوي على جرد **كامل** لكل عناصر الأصول — Vermögensgegenstände — وكل الديون والالتزامات — Schulden — بوصف كلٍّ منها وكميتها وقيمتها كلٌّ على حدة؛ تختلف عن Inventur — العملية الفعلية للجرد — كما يختلف المستند عن الإجراء؛ تختلف أيضاً عن Bilanz التي هي تجميع مُلخَّص وفق § 266 HGB؛ الـ Inventar أكثر تفصيلاً وأعم، بينما Bilanz أكثر اختصاراً وأكثر هيكلة؛ يخدم كـ Grundlage لـ Bilanz — الجدول الذي يُستخرَج منه) |
| **Englisch (Code-Kontext)** | `inventory` (im HGB-Sinne, nicht IT-Inventory), `assetAndLiabilityList` |
| **Kategorie** | Rechtsbegriff / Dokument |
| **Status** | FEST |
| **Aufgenommen am** | 2026-04-22, Terminology-Sprint 1 |

### Definition
**Schriftliches Dokument**, das die einzelnen Vermögensgegenstände und Schulden eines Kaufmanns zum **Zeitpunkt der Aufstellung** nach **Art, Menge und Wert** vollständig auflistet (§ 240 Abs. 1 HGB). Der Kaufmann ist verpflichtet, ein Inventar aufzustellen:

- **Bei Beginn** seines Handelsgewerbes (**Eröffnungsinventar**, § 240 Abs. 1 HGB)
- **Zum Schluss jedes Geschäftsjahres** (**Jahresinventar**, § 240 Abs. 2 HGB)

Das Inventar ist die **unmittelbare Grundlage** für die Aufstellung der Bilanz und muss innerhalb der für die Bilanz geltenden Frist (3 bzw. 6 Monate nach GJ-Ende — siehe [Jahresabschluss](./05-jahresabschluss.md#1-jahresabschluss)) erstellt sein.

**Inhalt (§ 240 Abs. 1 HGB):**

| Kategorie | Inhalt |
|---|---|
| **Anlagevermögen** | jeder Gegenstand einzeln mit Bezeichnung, Menge (typ. 1), Wert; alternativ Verweis aufs [Anlagenverzeichnis](#8-anlagenverzeichnis--140-ao--r-54-estr) |
| **Umlaufvermögen — Vorräte** | Rohstoffe, Hilfs- und Betriebsstoffe, unfertige und fertige Erzeugnisse, Waren — je Artikelgruppe oder Einzelbestand |
| **Umlaufvermögen — Forderungen** | einzeln oder gruppiert nach Debitor, mit Betrag und ggf. Wertberichtigung |
| **Umlaufvermögen — liquide Mittel** | Kassenbestand, Bankguthaben (kontobezogen) |
| **Schulden** | Verbindlichkeiten, Darlehen, Rückstellungen (siehe [Rückstellungen](./05-jahresabschluss.md#9-rückstellungen--249-hgb)) |

**Abgrenzung Inventar — Inventur — Bilanz:**

| Begriff | Natur | Frequenz | Detailgrad |
|---|---|---|---|
| **Inventur** | **Vorgang** / Tätigkeit der körperlichen Bestandsaufnahme | am / um den Bilanzstichtag | Je Einzelgegenstand |
| **Inventar** | **Dokument** — Ergebnis der Inventur | zum Bilanzstichtag (und Eröffnung) | Je Einzelgegenstand, tabellarisch |
| **Bilanz** | **Strukturierte Zusammenfassung** nach § 266 HGB | zum Bilanzstichtag | Aggregiert nach Gliederungspositionen |

**Vereinfachungsverfahren (§ 241 HGB — Inventur-Erleichterungen):**

Obwohl das **Inventar** grundsätzlich lückenlos ist, lassen die **Inventur-Vereinfachungen** nach § 241 HGB Abstriche vom Prinzip der jährlichen Voll-Aufnahme zu. Diese werden in [Inventur](#10-inventur--241-hgb--festwert-verfahren--240-abs-3-hgb) behandelt.

### Rechtsgrundlage
- **§ 240 Abs. 1 HGB** — Eröffnungsinventar
- **§ 240 Abs. 2 HGB** — Jahresinventar zum GJ-Ende
- **§ 240 Abs. 3 HGB** — **Festwert-Verfahren** (siehe integrierte Behandlung in [Inventur](#10-inventur--241-hgb--festwert-verfahren--240-abs-3-hgb))
- **§ 240 Abs. 4 HGB** — **Gruppenbewertung** (z. B. für Vorräte: Durchschnittsmethode, Fifo, Lifo nach § 256 HGB)
- **§ 241 HGB** — Inventur-Vereinfachungsverfahren
- **§§ 238, 239 HGB** — Buchführungsgrundlage
- **§ 246 Abs. 1 HGB** — Vollständigkeitsgebot
- **§ 147 AO** — **10 Jahre Aufbewahrungspflicht**

**Verwandte Begriffe:**
- [Inventur](#10-inventur--241-hgb--festwert-verfahren--240-abs-3-hgb) — die Tätigkeit, die zum Inventar führt
- [Bilanz](./05-jahresabschluss.md#2-bilanz) — die aus dem Inventar abgeleitete strukturierte Aufstellung
- [Anlagenverzeichnis](#8-anlagenverzeichnis--140-ao--r-54-estr) — Teildokument für das Anlagevermögen
- [Jahresabschluss](./05-jahresabschluss.md#1-jahresabschluss) — Inventar steht am Anfang der JA-Erstellung
- [GoBD](./01-grundlagen.md#1-gobd) — Aufbewahrungs- und Unveränderbarkeits-Anforderungen
- [Eröffnungsbilanz / Schlussbilanz](./02-buchhaltung.md#13-eröffnungsbilanz--schlussbilanz) — Schlussbilanz folgt dem Schluss-Inventar

**Verwendung im Code:**
- `src/domain/inventar/` — Inventar-Dokument-Generator
- **Kein separates Datenschema** — das Inventar ist eine **strukturierte Ableitung** aus:
  - [Anlagenverzeichnis](#8-anlagenverzeichnis--140-ao--r-54-estr) (AV)
  - Vorratsbuchhaltung / Lagerbuchführung (UV-Vorräte)
  - Debitorenbuchhaltung (Forderungen)
  - Kontensalden Klasse 1 (Kasse, Bank)
  - Kreditorenbuchhaltung + Rückstellungen (Schulden)
- `src/reports/inventar/` — Jahresinventar-Generator:
  ```ts
  function generateJahresinventar(mandant_id: string, stichtag: Date): InventarDokument {
    return {
      kopf: { mandant, stichtag, erstellt_am: new Date() },
      anlagevermoegen:   getAnlagenverzeichnisSnapshot(mandant_id, stichtag),
      vorraete:          getVorratsbestandSnapshot(mandant_id, stichtag),
      forderungen:       getForderungenSnapshot(mandant_id, stichtag),
      liquide_mittel:    getKassenBankSnapshot(mandant_id, stichtag),
      schulden:          getSchuldenSnapshot(mandant_id, stichtag),
      bilanzsumme:       calculateBalance(/*...*/)
    };
  }
  ```
- Export: PDF (menschenlesbar) + strukturiertes XML/JSON (GoBD / BP-konform)
- Signatur / Zeitstempel: nach Fertigstellung revisionssicher signiert, nicht mehr änderbar
- Archivierung: 10 Jahre mit Beleg-Verknüpfung (§ 147 AO)

**Nicht verwechseln mit:**
- **Inventur** — der Vorgang, nicht das Dokument
- **Bilanz** — Aggregation, nicht Auflistung
- **Lagerbestandsliste** / **Warenbestandsliste** — eng, nur UV-Vorräte
- **Inventarliste** (IT-Sprachgebrauch) — Geräteverzeichnis, nicht § 240 HGB-Inventar
- **Anlagenverzeichnis** — nur der AV-Teil
- **Vermögensaufstellung** (§ 5 BewG) — steuerlich bei Schenkung / Erbschaft, andere Zielsetzung

**Anmerkungen / Edge-Cases:**
- **„Schriftlich" bedeutet nicht „Papier":** Elektronische Inventare sind zulässig, wenn sie GoBD-konform archiviert sind (§ 147 Abs. 2 AO). Signaturverfahren mit Zeitstempel empfohlen, nicht zwingend.
- **Stichtag = Ende des GJ:** Beim Rumpfwirtschaftsjahr entsprechend der gewählte Zwischenstichtag (z. B. bei Gründung mitten im Jahr).
- **Eröffnungsinventar bei Neugründung:** Zum Tag der Geschäftsaufnahme (bei Kaufleuten) oder der erstmaligen Buchführungspflicht (§ 141 AO) ist ein vollständiges Eröffnungsinventar zu erstellen. Bewertung der eingebrachten Gegenstände mit gemeinem Wert / Teilwert.
- **Verbindung zur Inventur:** Das Inventar ist nur dann richtig, wenn die zugrundeliegende Inventur ordnungsmäßig durchgeführt wurde. Bei Vereinfachungsverfahren (§ 241 HGB) muss die Ableitung der Stichtags-Werte nachvollziehbar sein.
- **Aufbewahrung 10 Jahre:** Frist beginnt mit Ende des Kalenderjahres der Inventar-Erstellung (§ 147 Abs. 3 AO). Für Inventare zum 31.12.2025 daher Aufbewahrung bis 31.12.2035.
- **Wertaufstellung vs. Wertberechnung:** Im Inventar sind die **einzeln bewerteten** Vermögensgegenstände aufzuführen. Die Bewertungsgrundlagen (§§ 252 ff. HGB, §§ 6, 7 EStG) werden für jeden Posten angewandt.
- **GoBD und elektronisches Inventar:** Das Datenformat muss 10 Jahre lesbar und auswertbar bleiben. Format-Migrationen (z. B. CSV → Parquet) sind zulässig, sofern die inhaltliche Integrität revisionssicher nachweisbar bleibt.

---

## 10. Inventur (§ 241 HGB) + Festwert-Verfahren (§ 240 Abs. 3 HGB)

| Feld | Inhalt |
|---|---|
| **Deutsch (primär)** | Inventur |
| **Synonyme (DE)** | Bestandsaufnahme (umschreibend), körperliche Bestandsaufnahme (präzise), Jahresinventur (zur Abgrenzung von Eröffnung/Zwischen), Stichtagsinventur (klassische Form) |
| **Arabisch** | عملية الجرد الفعلي (الإجراء الميداني لإحصاء وتقييم Vermögen و Schulden لإعداد Inventar وفق § 241 HGB؛ الأشكال: Vollinventur التقليدية بتاريخ القطع Stichtag، Stichprobeninventur بالأساليب الإحصائية وفق § 241 Nr. 1 HGB، Permanente Inventur القائمة على الدفاتر مع فحص دوري وفق § 241 Nr. 2 HGB، Verlegte Inventur بانزياح ±10 أيام عن تاريخ القطع وفق § 241 Nr. 3 HGB؛ Festwert-Verfahren وفق § 240 Abs. 3 HGB: تبسيط للأصول الثابتة والمواد الخام قليلة التغير في القيمة والكمية والتركيب — قيمة ثابتة في Bilanz مع Vollinventur دورية كل 3 سنوات كحد أقصى وفق R 5.4 Abs. 3 EStR) |
| **Englisch (Code-Kontext)** | `stockTake`, `physicalInventory`, `inventoryProcedure` |
| **Kategorie** | Rechtsbegriff / Verfahren |
| **Status** | FEST |
| **Aufgenommen am** | 2026-04-22, Terminology-Sprint 1 |

### Definition
**Vorgang** der körperlichen — bei unkörperlichen Gegenständen buchmäßigen — Bestandsaufnahme aller Vermögensgegenstände und Schulden. Die Inventur ist die Voraussetzung für die Erstellung des [Inventars](#9-inventar--240-hgb) und mittelbar für die [Bilanz](./05-jahresabschluss.md#2-bilanz). § 241 HGB lässt **vier** Vereinfachungsverfahren zur klassischen Stichtagsinventur zu, die den praktischen Aufwand drastisch reduzieren können.

**Inventur-Formen:**

| Form | § HGB | Kernmerkmal |
|---|---|---|
| **Stichtags-(Voll-)Inventur** | (Grundform, § 240 HGB) | Vollständige körperliche Aufnahme am Bilanzstichtag oder innerhalb von ± 10 Tagen |
| **Stichprobeninventur** | § 241 Nr. 1 HGB | Anerkannte mathematisch-statistische Methoden (z. B. geschichtete Stichprobe); Aufwandsreduktion bei großen Beständen |
| **Permanente Inventur** | § 241 Nr. 2 HGB | Buchmäßige Fortschreibung + unterjährige körperliche Überprüfungen; keine Stichtagsinventur mehr nötig, aber **Lagerbuchführung** zwingend |
| **Zeitnahe Inventur (vor-/nachgelagert)** | § 241 Nr. 3 HGB | Vollständige Aufnahme innerhalb von **3 Monaten vor** bis **2 Monaten nach** dem Bilanzstichtag, mit **Wertfortschreibung** zum Stichtag |
| **Festwert-Verfahren** | **§ 240 Abs. 3 HGB** (integriert unten) | Fester Wertansatz in der Bilanz, körperliche Inventur nur alle 3 Jahre |

**Voraussetzungen der einzelnen Verfahren:**

| Verfahren | Voraussetzung |
|---|---|
| Stichprobeninventur | Anerkannte statistische Methoden; ausreichender Stichprobenumfang; Fehlergrenze ≤ 1 % des Gesamtwerts; Dokumentation der Methodenwahl |
| Permanente Inventur | Geordnete Lagerbuchführung mit Zu- und Abgängen; körperliche Überprüfung aller Positionen mindestens einmal pro WJ |
| Zeitnahe Inventur | Aufnahme-Zeitraum innerhalb `[-3 Monate, +2 Monate]` um Stichtag; nachvollziehbare Wertfortschreibung zum Stichtag; Ausschluss von unregelmäßig stark schwankenden Beständen (z. B. Saisonware) |

**Festwert-Verfahren (§ 240 Abs. 3 HGB) — integriert:**

Für Gegenstände des Sachanlagevermögens sowie Roh-, Hilfs- und Betriebsstoffe kann ein **Festwert** in der Bilanz angesetzt werden, wenn **alle folgenden** Voraussetzungen **kumulativ** erfüllt sind:

| Voraussetzung | Anforderung |
|---|---|
| **Regelmäßige Ersatzbeschaffung** | Laufende Erneuerung der abgängigen Stücke |
| **Geringe Größenänderung** | Bestand bleibt in Menge nahezu konstant |
| **Geringe Wertänderung** | Einzelwerte bleiben betraglich stabil |
| **Geringe Zusammensetzungsänderung** | Zusammensetzung des Bestands bleibt qualitativ konstant |
| **Untergeordnete Bedeutung** | Der Festwert-Bestand ist im Verhältnis zum Gesamtvermögen nicht wesentlich |

**Folgen der Festwert-Anwendung:**

- Der Festwert bleibt **über Jahre** gleich in der Bilanz stehen
- Ersatzbeschaffungen werden **sofort als Aufwand** gebucht (keine Aktivierung)
- Erlöse aus Abgängen werden **sofort als Ertrag** gebucht
- Keine jährliche Einzelbewertung mehr

**Pflicht zur körperlichen Vollinventur bei Festwert-Verfahren (R 5.4 Abs. 3 EStR):**

**In der Regel alle 3 Jahre**, spätestens alle 5 Jahre, ist eine körperliche Vollinventur durchzuführen. Ergibt sich dabei eine Wertabweichung von **mehr als 10 %** gegenüber dem Festwert (BFH-Richtwert), ist der Festwert anzupassen.

**Typische Anwendungsfälle des Festwert-Verfahrens:**

| Bereich | Beispiele |
|---|---|
| Sachanlagen | Werkzeuge, Gerüste, Prüfmittel im Baugewerbe, Hotel-Porzellan und -Besteck, Lehrmittel in Schulen, Norm-Teile in der Produktion |
| Roh-/Hilfsstoffe | Kleineisenwaren, Schrauben und Muttern, Standardverbrauchsmaterialien |

### Rechtsgrundlage
- **§ 240 Abs. 3 HGB** — Festwert-Verfahren
- **§ 240 Abs. 4 HGB** — Gruppenbewertung (verwandt, aber eigenständig)
- **§ 241 Nr. 1 HGB** — Stichprobeninventur
- **§ 241 Nr. 2 HGB** — Permanente Inventur
- **§ 241 Nr. 3 HGB** — Zeitnahe Inventur mit Wertfortschreibung
- **§ 241a HGB** — Erleichterungen für Einzelkaufleute mit geringem Geschäftsumfang
- **R 5.4 Abs. 3 EStR** — Verwaltungsauffassung zum Festwert-Verfahren (3-Jahres-Vollinventur)
- **§ 256 HGB** — Bewertungsvereinfachung für gleichartige Vorräte (Fifo, Lifo, Durchschnittsmethode) — verwandtes Thema
- **GoBD Rz. 107 ff.** — Anforderungen an elektronisch durchgeführte Inventuren
- **IDW RS HFA 3** — Institut der Wirtschaftsprüfer, Stellungnahme zu Vereinfachungsverfahren

**Verwandte Begriffe:**
- [Inventar](#9-inventar--240-hgb) — das Ergebnis-Dokument
- [Bilanz](./05-jahresabschluss.md#2-bilanz) — mittelbarer Zweck der Inventur
- [Anlagevermögen](#1-anlagevermögen--247-abs-2-hgb) / [Anlagenverzeichnis](#8-anlagenverzeichnis--140-ao--r-54-estr) — Inventurabgleich mit AV
- [Jahresabschluss](./05-jahresabschluss.md#1-jahresabschluss) — JA-Prozess-Vorstufe
- [GoBD](./01-grundlagen.md#1-gobd) — Ordnungsmäßigkeitsanforderungen

**Verwendung im Code:**
- `src/domain/inventur/` — Inventur-Workflow-Modul
- `src/domain/inventur/verfahren.ts`:
  ```ts
  enum InventurVerfahren {
    STICHTAG_VOLL       = 'stichtag_voll',          // Grundform
    STICHPROBE          = 'stichprobe',             // § 241 Nr. 1
    PERMANENT           = 'permanent',              // § 241 Nr. 2
    ZEITNAH             = 'zeitnah_verlegt',        // § 241 Nr. 3
    FESTWERT            = 'festwert',               // § 240 Abs. 3
  }
  ```
- Mandanten-Stammdaten: pro Warengruppe / pro Anlage-Kategorie das gewählte Inventurverfahren, einschließlich Festwert-Konfigurationen
- `src/domain/inventur/festwert/` — Festwert-spezifisches Untermodul:
  ```ts
  interface FestwertAnsatz {
    kategorie: string;                  // z. B. "Hotel-Porzellan"
    festwert_aktuell: Decimal;
    festgestellt_am: Date;
    naechste_vollinventur_pflicht: Date; // + 3 Jahre
    voraussetzungen_geprueft: {
      regelmaessige_ersatzbeschaffung: boolean;
      groessen_konstanz: boolean;
      wert_konstanz: boolean;
      zusammensetzungs_konstanz: boolean;
      untergeordnete_bedeutung: boolean;
    };
    mandanten_dokumentation: DocumentRef;
  }
  ```
- **Automatische Erinnerung:** bei Annäherung der 3-Jahres-Frist Warnung im Mandanten-Dashboard
- **Abweichungs-Check:** nach Vollinventur automatisch Wertdifferenz berechnen; > 10 % → Pflicht-Anpassung des Festwerts + Umbuchung
- **Zeitnahe Inventur — Datums-Validator:** Aufnahme muss zwischen `bilanzstichtag - 3 Monate` und `bilanzstichtag + 2 Monate` liegen; Fortschreibungs-Logik für den Zeitraum zwischen Aufnahme und Stichtag
- **Permanente Inventur — Lagerbuchführungs-Integration:** Pflicht-Check, dass Lagerbewegungen (Zu-/Abgang, Umlagerung) vollständig erfasst sind; mindestens eine körperliche Überprüfung pro Position im WJ
- **Stichproben-Statistik:** Validierung der mathematisch-statistischen Methode (z. B. geschichtete Zufallsstichprobe) und des Stichprobenumfangs mit Qualitätsreport
- GoBD-konforme Aufzeichnung aller Inventur-Ereignisse mit Zeitstempel, Aufnahmeleiter, Zählliste-Hash

**Nicht verwechseln mit:**
- **Inventar** — das **Dokument** als Ergebnis, nicht die Tätigkeit
- **Lagerbestands-Kontrolle / Cycle Count** — operative Überprüfung; kann Baustein einer permanenten Inventur sein, ist aber nicht identisch
- **Anlagenerfassung** — Erfassung bei Neuzugang, nicht Stichtags-Inventur
- **Technische Sicherheitsüberprüfung** (TÜV, DGUV) — keine Bilanz-Inventur
- **Physical Inventory (IFRS)** — vergleichbares Konzept, aber ohne deutsche HGB-Vereinfachungsparagraphen

**Anmerkungen / Edge-Cases:**
- **Festwert-Voraussetzungen sind kumulativ:** Alle fünf Kriterien müssen **gleichzeitig** erfüllt sein. Fällt auch nur eines weg (z. B. Preissprung bei Stahl → Wertkonstanz nicht mehr gegeben), ist der Festwert aufzulösen und zur Einzelbewertung zurückzukehren. Das System MUSS die Voraussetzungen jährlich abfragen und bei Verneinung automatisch warnen.
- **3-Jahres-Frist verpflichtend:** R 5.4 Abs. 3 EStR fordert spätestens alle 3 Jahre eine Vollinventur. Das Validator-Modul MUSS einen Countdown pro Festwert-Kategorie führen und die Pflicht rechtzeitig ankündigen (typisch: Warnung ab 6 Monaten vor Fälligkeit).
- **10 %-Abweichungs-Grenze:** Ergibt die Vollinventur eine Wertabweichung > 10 %, ist eine Festwert-Anpassung zwingend. Die Differenz wird als Ertrag (Wertaufwärts-Korrektur) oder Aufwand (Wertabwärts-Korrektur) in der GuV gebucht. Bei kleineren Abweichungen besteht Wahlrecht.
- **Permanente Inventur — Praxis:** Voraussetzung ist eine vollständig gepflegte Lagerbuchführung. Ein Fehlen oder eine Lücke in der Lagerbuchhaltung entzieht dem Verfahren die Grundlage — Rückfall auf Stichtags-Vollinventur zwingend.
- **Zeitnahe Inventur — Grenzfälle:** Bei hochpreisigen oder unregelmäßig schwankenden Positionen (z. B. Edelmetalle, Saisonware) ist das Verfahren unzulässig. Das Code-Modul sollte Warenarten mit Volatilitäts-Flag kennzeichnen, um falsche Methodenwahl zu vermeiden.
- **Kombinierbarkeit der Verfahren:** Unterschiedliche Verfahren für unterschiedliche Warengruppen sind zulässig (z. B. Festwert für Werkzeuge, zeitnahe Inventur für Lagerware, Stichtagsinventur für Edelmetalle). Das Mandantenprofil muss solche Kombinationen unterstützen.
- **Buchungen während der Inventur:** Während der körperlichen Aufnahme muss der Bestand gegen Zu- und Abgänge **gesperrt** sein oder bewegungsbezogen protokolliert werden (GoBD Rz. 110). Keine nachträgliche „stille Korrektur".
- **Aufbewahrung Inventur-Unterlagen:** Zählzettel, Protokolle, Abweichungs-Reports sind 10 Jahre aufzubewahren (§ 147 AO).
- **Bei erstmaliger Einrichtung eines Festwert-Verfahrens oder bei Unklarheit über die Zulässigkeit der Vereinfachungsmethoden Rücksprache mit Steuerberater oder Wirtschaftsprüfer** — eine falsche Methodenwahl führt zu BP-Beanstandungen und ggf. Nachforderungen.

---

> **Modul-Footer**
> **Nächstes Modul:** [08 · Technik & Architektur](./08-technik-architektur.md) · **Übersicht:** [INDEX.md](./INDEX.md)
> **Terminology-Sprint 1 · Modul 07 · Stand 2026-04-23**
