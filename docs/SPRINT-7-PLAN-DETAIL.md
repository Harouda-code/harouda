# Sprint 7 Detail-Plan — USt-Sonderfälle § 13b + IG-Lieferungen

Freigabe-Grundlage: `docs/SPRINT-7-PLAN.md` — Empfehlung (d) USt-
Sonderfälle (Gap-Closure), Score 28/30, freigegeben am 2026-04-20.

Baseline: **932 Tests / 61 Dateien**.

---

## Phase 0 — Detaillierter Pre-Check (abgeschlossen)

Tatsächliche Grep-Ergebnisse gegen den aktuellen Baum:

### 0.1 SKR03-Seed-Status

| Konto | Rolle | Status | Referenziert in Mapping? |
|---|---|---|---|
| `1574` | Vorsteuer IG-Erwerb (Kz 61) | **FEHLT** im Seed | `skr03UstvaMapping.ts` Zeile 81 referenziert 1574 |
| `1577` | Abziehbare Vorsteuer § 13b (Kz 67) | ✓ gesetzt mit ust_satz=19 | `skr03UstvaMapping.ts` Zeile 87 |
| `3100` | Fremdleistungen (Kz 46 Bemessungsgrundlage) | ✓ gesetzt | `skr03UstvaMapping.ts` Zeile 69 |
| `3110-3119` | Leistungen § 13b Abs. 1 | **keine Einträge** im Seed | Mapping-Range 3100-3119 → Kz 46 |
| `3120-3129` | Bauleistungen § 13b Abs. 2 Nr. 2 (Kz 73) | **FEHLT** im Seed | Mapping-Range 3120-3129 → Kz 73 |
| `3130-3139` | Gebäudereinigung § 13b Abs. 2 Nr. 3 (Kz 78) | **FEHLT** im Seed | Mapping-Range 3130-3139 → Kz 78 |
| `3140-3159` | § 13b Abs. 2 Nr. 4/5b/6-11 (Kz 52) | **FEHLT** im Seed | Mapping-Range 3140-3159 → Kz 52 |
| `8125` | Steuerfreie EG-Lieferung (Kz 41) | ✓ gesetzt mit ust_satz=0 | `skr03UstvaMapping.ts` Zeile 48 |
| `8336` | Erlöse EU 7 % | ✓ gesetzt | `skr03UstvaMapping.ts` Zeile 39 |
| `8338` | Dreiecksgeschäft (Kz 42) | **FEHLT** im Seed | `skr03UstvaMapping.ts` Zeile 41 |

**Fazit:** Minimum 4 Konten müssen ergänzt werden (1574, 3120, 3130,
8338). Weitere Einzel-Einträge im 3140-Bereich sind Demo-abhängig.

### 0.2 BelegerfassungPage UI-Status

Tatsächliche Code-Stellen:

- `istReverseCharge: boolean` State (Zeile 76) — reine Boolean-Kennzeichnung
- `istIgLieferung: boolean` State (Zeile 73) — für IG-Lieferungen
- Zwei Checkboxen nebeneinander (Zeilen 373-387): „IG-Lieferung (§ 14a
  UStG)" + „Reverse Charge (§ 13b UStG)"
- Field wird an `BelegEntry` durchgereicht (Zeile 124): `istReverseCharge:
  istReverseCharge || undefined`
- **Kein fein-granularer Selektor** für die 5 § 13b-Varianten (Abs. 1,
  Abs. 2 Nr. 1/2/3/4-11)

Die Kennzahlen-Auflösung (Kz 46/52/73/78) erfolgt implizit über das
gewählte **Aufwands-Konto** (3100 → Kz 46, 3120 → Kz 73 etc.) via
`skr03UstvaMapping.ts`. Die Boolean-Checkbox ist für den
Validierungs-Pfad (`BelegValidierungsService`) relevant, nicht für die
UStVA-Kennzahl.

### 0.3 UstvaXmlBuilder-Status

`src/domain/ustva/UstvaXmlBuilder.ts` produziert bereits ELSTER-Schema-
ähnliches XML. Kommentar Zeile 2-7: „UStVA XML Preview (ELSTER-Schema-
ähnlich) — die tatsächliche Übertragung an das Finanzamt erfolgt via
ERiC-Client der BZSt — nicht Teil dieses Projekts."

**Keine Änderung nötig** für UStVA-XML — die Kennzahlen 46/47/52/73/
78/67 werden über das generische Kennzahl-Iteration-Pattern automatisch
ausgegeben, sobald Buchungen auf den Bemessungsgrundlage-Konten
landen.

### 0.4 ZmBuilder-Status

`src/domain/ustva/ZmBuilder.ts` (Zeilen 1-60) erzeugt nur `ZmReport`-
Struct mit aggregierten Meldungen pro Empfänger. **Kein XML-Export,
kein ELMA5-Format.** Die Page `ZmPage.tsx` nutzt den Report für
CSV-Darstellung.

**Das ist die konkrete ELMA5-Lücke.**

### 0.5 Demo-CSV-Szenarien

`demo-input/musterfirma-2025/buchungen.csv` enthält **null** Reverse-
Charge- oder IG-Szenarien. Bestandszeilen nutzen nur reguläre Inland-
Konten (3400 Wareneingang, 8400 Erlöse 19 %, 8300 Erlöse 7 %).

**Demo muss um 4-6 Szenarien erweitert werden.**

### 0.6 Pre-Check-Fazit

~80 % der Infrastruktur steht. **Kein > 90 %-Fall — Sprint ist
sinnvoll, kein STOPP.** Konkrete Lücken:

1. 4-6 SKR03-Konten fehlen im Seed
2. ZmBuilder hat keinen ELMA5-XML-Export
3. Demo-CSV hat keine Reverse-Charge-/IG-Szenarien
4. BelegValidierungsService macht vermutlich keine Reverse-Charge-
   Validierung (muss in Phase 2 geprüft werden)

---

## 1. Phasen-Plan

### Phase 1 — SKR03-Seed ergänzen

**Ziel:** Die fehlenden Konten für § 13b + IG-Erwerb + Dreiecks-
geschäft im Seed aufnehmen.

**Betroffene Dateien:**
- `src/api/skr03.ts` — 4-8 neue Konten-Einträge

**Zu ergänzende Konten (minimaler Satz):**

| Konto-Nr | Bezeichnung | Kategorie | ust_satz |
|---|---|---|---|
| `1574` | Abziehbare Vorsteuer aus innergemeinschaftlichen Erwerben | aktiva | 19 |
| `3120` | Bauleistungen § 13b Abs. 2 Nr. 2 UStG | aufwand | 19 |
| `3130` | Gebäudereinigung § 13b Abs. 2 Nr. 3 UStG | aufwand | 19 |
| `3140` | Leistungen § 13b Abs. 2 Nr. 4/5b/6-11 UStG | aufwand | 19 |
| `8338` | Innergemeinschaftliches Dreiecksgeschäft § 25b UStG | ertrag | 0 |

**Optional (falls Demo braucht):**
- `3110` Leistungen § 13b Abs. 1 UStG
- `1588` Einfuhrumsatzsteuer (falls nicht schon da)

**Tests:** 0 (reine Daten-Seed-Erweiterung, keine Logik-Änderung).
Bestehende UstvaBuilder-Tests überprüfen, dass das Mapping weiter-
hin funktioniert.

**Risiken:**
- **Konto-Nummern-Kollision:** sehr gering, der 3xxx- und 8xxx-
  Bereich ist SKR03-standardisiert, die ergänzten Nummern folgen
  der DATEV-Konvention.
- **Mapping-Regressionen:** existierende Ranges bleiben; neue
  Konten passen in vorhandene Ranges (3120-3129 → Kz 73 etc.).

**Reversibilität:** trivial — Entfernen der neuen Konten-Einträge.

### Phase 2 — BelegValidierungsService für Reverse-Charge

**Ziel:** Validierungs-Regeln für Reverse-Charge-Belege ergänzen.

**Betroffene Dateien:**
- `src/domain/belege/BelegValidierungsService.ts` — neue Regel-Fälle
- `src/domain/belege/types.ts` — prüfen ob `istReverseCharge` schon
  im Type

**Zu implementierende Validierungen:**
1. Bei `istReverseCharge === true`: Leistungs-Empfänger hat USt-ID
   (EU-Reverse-Charge) oder Leistungs-Empfänger ist Unternehmer
   (Inland-Bauleistung).
2. Bei `istReverseCharge === true` UND Konto `3120-3129`: Warnung
   wenn Bezeichnung nicht „Bauleistung" enthält.
3. Bei `istIgLieferung === true`: Kunden-USt-ID ist Pflicht (§ 6a
   Abs. 1 Nr. 2 UStG).
4. Bei `istIgLieferung === true` UND Konto nicht in 8120-8199:
   Warnung (falsches Erlöskonto).

**Tests:** ~5 (je ein positiver + je 1-2 negative Fälle pro Regel).

**Offene Design-Frage 1:** Siehe Entscheidungs-Matrix weiter unten.

**Risiken:**
- `BelegValidierungsService.test.ts` hat ~15-20 bestehende Tests —
  neue Regeln dürfen diese nicht rot machen. Mitigation: neue Regeln
  als eigene Regel-Codes (W10x-Serie o. ä.) mit `severity: WARNING`,
  nicht ERROR.

**Reversibilität:** leicht — Entfernen der neuen Regeln.

### Phase 3 — ZM-Export ELMA5-XML

**Ziel:** ELMA5-konformes XML erzeugen für die ZM-Abgabe nach § 18a
UStG.

**Betroffene Dateien:**
- `src/domain/ustva/ZmXmlBuilder.ts` (neu)
- `src/domain/ustva/__tests__/ZmXmlBuilder.test.ts` (neu)
- `src/pages/ZmPage.tsx` — „XML exportieren"-Button ergänzen

**ELMA5-Format-Referenz:** BZSt-Handbuch „Datenübermittlung ZM ELMA5
— technische Spezifikation". Kernstruktur:
- Header-Record (Unternehmen USt-ID, Meldezeitraum)
- Detail-Record pro Empfänger (USt-ID, Ländercode, Betrag, ZM-Art
  L/S/D für Lieferung/sonstige Leistung/Dreiecksgeschäft)
- Summen-Record

**Offene Design-Frage 2:** Siehe Entscheidungs-Matrix — ELMA5-XML
nach DFÜ-Format (CSV-artig mit Fester-Position-Felder) oder
XBRL-ähnliches XML (wie UstvaXmlBuilder)?

**Tests:** ~5 (Header-Struktur, 3 Empfänger-Records mit L/S/D,
Summen-Check, Null-Empfänger-Edge-Case, malformed-Input-Edge).

**Risiken:**
- **Rechts-Risiko:** ELMA5 ist das offizielle BZSt-Format — unsere
  Erzeugung muss die Spezifikation halten, sonst wird die ZM vom BZSt
  abgelehnt. **Mitigation:** wie bei UStVA-XML als „Preview"-Format
  kennzeichnen, tatsächliche Übermittlung bleibt via ERiC/BOP
  manuell.

**Reversibilität:** trivial — neuer Builder, keine bestehende Logik
berührt.

### Phase 4 — Demo-Szenarien + Dokumentation

**Ziel:** 4-6 Reverse-Charge- und IG-Szenarien in die Musterfirma
einbauen.

**Betroffene Dateien:**
- `demo-input/musterfirma-2025/buchungen.csv` — +4-6 Zeilen
- `demo-input/musterfirma-2025/README.md` — neuer Schritt 14g
  („USt-Sonderfälle")
- `docs/SPRINT-7-DECISIONS.md` (neu)

**Geplante Szenarien:**

| Beleg-Nr | Datum | Soll | Haben | Betrag | Szenario |
|---|---|---|---|---:|---|
| RC-2025-001 | 15.03.2025 | 3100 | 1600 | 2.500,00 | EU-B2B-Dienstleistung (Softwarelizenz IE) → Kz 46 |
| RC-2025-002 | 12.05.2025 | 3120 | 1600 | 8.000,00 | Bauleistung zwischen Baubetrieben → Kz 73 |
| RC-2025-003 | 20.07.2025 | 3130 | 1600 | 1.200,00 | Gebäudereinigung → Kz 78 |
| IG-2025-001 | 15.06.2025 | 1400 | 8125 | 15.000,00 | IG-Lieferung an EU-Kunden FR → Kz 41 |
| IG-2025-002 | 22.09.2025 | 3400 | 1600 | 7.500,00 | IG-Erwerb aus EU → Kz 89 (Bemessungsgrundlage) |

**Erwartete UStVA-Summen für Demo 2025:**
- Kz 41 (IG-Lieferungen): 15.000 €
- Kz 46 (§ 13b Abs. 1 B.-Grundlage): 2.500 €
- Kz 73 (§ 13b Nr. 2 Bau): 8.000 €
- Kz 78 (§ 13b Nr. 3 Reinigung): 1.200 €
- Kz 47 (§ 13b Steuer): (2.500 + 8.000 + 1.200) × 19 % = 2.223 €
- Kz 89 (IG-Erwerb B.-Grundlage): 7.500 €

**Tests:** ~3 (Integrations-Tests gegen Demo-CSV: UStVA-Summen stimmen).

**Risiken:**
- **Demo-Konsistenz:** Bilanz + GuV müssen weiterhin balancieren.
  Die Gegenseite bei RC-Einkauf bleibt 1600 (Verbindlichkeiten), das
  ändert nichts an der Bilanz-Summe.

**Reversibilität:** trivial — Entfernen der 4-6 Zeilen.

### Phase 5 — Tests + Verifikation

**Betroffene Dateien:**
- `src/domain/ustva/__tests__/UstvaBuilder.test.ts` — +3-5 Tests
  für die neuen Szenarien
- `src/domain/ustva/__tests__/ZmXmlBuilder.test.ts` (neu, aus
  Phase 3)
- `src/domain/belege/__tests__/BelegValidierungsService.test.ts` —
  +5 Tests (aus Phase 2)
- Integration-Tests gegen Demo-CSV +3

**Erwartung:** 932 → **~950** (+18).

**Risiken:**
- **Regression in bestehenden 15 UstvaBuilder-Tests** — Mitigation:
  jede neue Test-Datei läuft isoliert, keine Shared-State.

---

## 2. Entscheidungs-Matrix für offene Design-Fragen

Diese Fragen werden **nicht autonom** entschieden — sie sind zur
Freigabe beim Sprint-Start oder nach Phase 2 vorgesehen.

| Nr. | Frage | Optionen | Vorschlag | Reversibilität |
|---:|---|---|---|---|
| 14 | Reverse-Charge: automatisch 2 Buchungen generieren (Selbstbesteuerung) oder nur 1 zusammengefasst? | **A**: 1 Buchung 3100/1600 + Validator erzeugt „fiktive" 1577/1774-Gegenbuchung beim UStVA-Lauf · **B**: 2 Buchungen physisch im Journal (3100/1600 Bemessung + 1577/1774 Steuer) · **C**: optional konfigurierbar pro Firma | **A** — weniger Redundanz, näher an DATEV-Praxis; UStVA-Builder rechnet USt aus Bemessungsgrundlage mal 19 % | mittel — Umschaltung auf B würde bestehende Journal-Einträge migrieren |
| 15 | ELMA5-XML-Format — voll spec-konform oder Preview? | **A**: DFÜ-Format spec-konform (fixed-width Fields nach BZSt-Handbuch) · **B**: XML-Preview analog UstvaXmlBuilder, „nicht für Echt-Übermittlung" · **C**: beides exportieren | **B** — konsistent mit existierendem UStVA-XML-Ansatz; Echt-ELMA5 ist ERiC-Backend-Aufgabe (P1-Blocker in CLAUDE.md § 10) | leicht |
| 16 | SKR03-Seed-Umfang — minimal (4 Konten) oder erweitert (8-10 Konten)? | **A**: Minimal — nur Konten die im Demo referenziert werden · **B**: Erweitert — alle SKR03-Standard-§-13b-Konten plus EUSt 1588 · **C**: Vollständig — 3100-3159 alle Einzel-Einträge | **A** — Minimal, YAGNI. Weitere Konten kann ein Kanzlei-Admin manuell ergänzen. | trivial |
| 17 | BelegValidierungsService-Severity für RC-Verstöße | **A**: alle neuen RC-Regeln als WARNING · **B**: USt-ID-fehlend = ERROR, Rest WARNING · **C**: alle als ERROR | **B** — USt-ID ist gesetzliche Pflicht (§ 6a UStG); ohne die ist die IG-Lieferung ungültig. Rest WARNING. | leicht |
| 18 | BelegerfassungPage — fein-granularer § 13b-Selektor oder Boolean-Checkbox belassen? | **A**: Dropdown „Reverse-Charge-Variante": Abs. 1, Abs. 2 Nr. 1, Nr. 2 Bau, Nr. 3 Reinigung, Nr. 4/5b/6-11 · **B**: Boolean-Checkbox wie bisher; Kennzahl-Auflösung über Konto · **C**: Boolean + Info-Hinweis auf Konto-Auswahl | **B** — Konto-basierte Auflösung ist präzise und DATEV-konform; UI-Komplexität vermeiden | trivial |

**Empfehlung für Sprint-Start:** Fragen 14, 15, 17, 18 mit den
Vorschlägen akzeptieren; Frage 16 (Seed-Umfang) bei Demo-Szenarien-
Design fixieren.

---

## 3. Scope-Grenzen

- **Hash-Kette unverändert**
- **Bestehende 932 Tests bleiben grün**
- **Keine neue Migration** — nur SKR03-Seed-Erweiterung
- **Keine neuen npm-Dependencies**
- **TypeScript strict + Decimal.js durchgängig**

**Explizit NICHT in Sprint 7:**
- ERiC-Backend-Direktübermittlung (P1 Blocker aus CLAUDE.md § 10)
- Dreiecksgeschäfte § 25b UStG mit Kz 42-Detail-Logik (Konto 8338
  wird geseedet, aber komplexe Dreiecks-Validierung separater Sprint)
- OSS / IOSS / MOSS (Fernverkauf an Endverbraucher)
- Steuerberater-Bestätigungs-Verfahren MIAS
- Einfuhrumsatzsteuer (§ 21 UStG) über EUSt-Konto 1588 — falls
  Demo-bedarf: Konto 1588 ist bereits im Seed (zu verifizieren),
  aber keine Import-/Zoll-Logik
- Kleinunternehmer-Sonderregelung (§ 19 UStG) — Kleinunternehmer-
  Flag existiert bereits in Settings

---

## 4. Test-Erwartung

| Phase | Ziel-Tests | Kommentar |
|---|---:|---|
| Phase 1 Seed | 0 | reine Daten-Ergänzung |
| Phase 2 Belegvalidierung | ~5 | neue RC-/IG-Validierungen |
| Phase 3 ZM-XML | ~5 | Header + 3 Record-Arten + Edge-Case |
| Phase 4 Demo | ~3 | Integrations-Tests gegen CSV |
| Phase 5 UStVA | ~5 | neue Mapping-Fälle für Kz 46/52/73/78/89 |
| **Summe** | **~18** | konservative Schätzung |
| **Gesamt** | **932 → ~950** | Floor, kein Overshoot antizipiert |

---

## 5. Risiko-Übersicht

| Risiko | Wahrscheinlichkeit | Impact | Mitigation |
|---|---|---|---|
| UstvaBuilder-Tests rot nach Seed-Ergänzung | niedrig | mittel | neue Konten folgen bestehenden Mapping-Ranges; Sanity-Tests in Phase 1-Abschluss |
| ELMA5-Format-Spezifikation nicht vollständig im Repo | mittel | mittel | Als „Preview"-Format deklarieren (Frage 15, Vorschlag B) |
| Belegvalidierungs-Regeln brechen bestehende Tests | niedrig | hoch | Neue Regeln ausschließlich als WARNING + neue Regel-Codes; keine Umdefinition bestehender Regeln |
| Demo-CSV-Erweiterung verschiebt Bilanz-Summen | niedrig | niedrig | Alle neuen Szenarien buchen symmetrisch auf 1600/1400, kein Effekt auf Bilanz-Ergebnis |
| § 13b-Abgrenzung rechtlich unklar bei Grenzfällen | niedrig | mittel | Validator ist WARNING-only, Buchhalter-Verantwortung |

---

## 6. Plan zur Freigabe bereit

**Status:** Plan erstellt, Phase-0-Pre-Check abgeschlossen mit
konkreten Befunden. Wartet auf User-Freigabe + Entscheidung zu den
5 offenen Design-Fragen (14-18) in der Matrix oben.

**Nicht angetastet:** Code, Tests, alle anderen Dokumente.

**Nächster Schritt nach Freigabe:** Phase 1 starten (SKR03-Seed
ergänzen + Verifikation via `npx vitest run`), dann sequenziell
Phasen 2-5.
