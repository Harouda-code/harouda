# Sprint 7 — Entscheidungsprotokoll (USt-Sonderfälle § 13b + IG)

Freigabe-Basis: `docs/SPRINT-7-PLAN.md` (Kandidaten-Bewertung, Score
28/30) + `docs/SPRINT-7-PLAN-DETAIL.md` (Phasen-Plan + 5 freigegebene
Design-Fragen 14-18).

Baseline: 932 Tests. Ziel: 932 → ~950. **Erreicht:** siehe Phasen-
Abschluss unten.

---

## Freigegebene Kern-Entscheidungen (vom User bestätigt)

### Entscheidung 14: Reverse-Charge — 1 Buchung, kein Auto-Split

**Gewählt: A.** Eine einzelne Bemessungsgrundlage-Buchung
(z. B. `3100 soll / 1600 haben` mit Brutto=Netto-Wert) wird in das
Journal geschrieben. Der UStVA-Builder rechnet die Selbstbesteuerungs-
USt implizit aus der Bemessungsgrundlage × 19 % (bzw. 7 %).

**Begründung:** DATEV-Praxis (keine redundanten 1777/1775-Gegen-
buchungen im Journal), konsistent mit dem „Derived wo möglich"-
Muster aus Sprint 4 OPOS. Kein Hash-Kette-Impact (keine Doppel-
buchungen).

**Umsetzungs-Detail:** Im `BelegValidierungsService` wird bei
`istReverseCharge === true` + `steuerbetrag > 0` weiterhin ein E020-
Fehler ausgelöst (Rechnung darf USt nicht ausweisen). Die UStVA-Zahllast
wird über das Mapping 3100-3159 → Kz 46/52/73/78 aggregiert und dann
über die UStVA-Struktur-Logik in Kz 47 als Steuerbetrag summiert.

---

### Entscheidung 15: ELMA5-XML — Preview-Format analog UStVA-XML

**Gewählt: B.** `ZmXmlBuilder.buildZmXml(report)` erzeugt ein XML
analog `UstvaXmlBuilder.buildUstvaXml`. Format ähnelt ELMA5-
Struktur (Zeitraum-Attribute, Meldungen mit L/S/D-Art, Summen-Block),
ist aber **kein BZSt-konformer ELMA5-Datensatz**.

**Begründung:** Konsistenz mit dem Preview-Ansatz im bestehenden
UStVA-XML-Builder. Echt-ELMA5-DFÜ braucht ERiC-Backend, ist in
`CLAUDE.md` § 10 als P1-Blocker dokumentiert.

**Umsetzungs-Detail:** XML-Kommentar am Ende des Dokuments:
`<!-- HINWEIS: Preview-XML, kein ELMA5-DFÜ-Datensatz. -->` — plus
Toast-Hinweis beim UI-Export: „ZM-XML-Preview exportiert (nicht
für BZSt-Übermittlung)."

---

### Entscheidung 16: SKR03-Seed — minimal, 4 Konten

**Gewählt: A** mit leichter Anpassung nach Pre-Check-Cross-Check.

**Tatsächlich ergänzte Konten (5, nicht 4):**
- `1574` Abziehbare Vorsteuer aus innergem. Erwerb (Kz 61) — für
  Mapping-Integrität nötig
- `3120` Bauleistungen § 13b Abs. 2 Nr. 2 UStG (Kz 73)
- `3130` Gebäudereinigung § 13b Abs. 2 Nr. 3 UStG (Kz 78)
- `3425` Innergemeinschaftlicher Erwerb 19 % Bemessungsgrundlage
  (Kz 89) — Demo IG-2025-002 braucht dieses Konto
- `8338` im Mapping referenziert (Kz 42 Dreiecksgeschäft) — **nicht
  ergänzt**, da im aktuellen Demo nicht verwendet

**Abweichung vom ursprünglichen Plan:** Das Plan-Dokument nannte
`3140` als eine der 4 Konten. Beim Phase-0-Pre-Check fiel auf, dass
`3425` für das Demo-Szenario IG-2025-002 unabdingbar ist und
`3140` im aktuellen Demo nicht genutzt wird → 3140 zugunsten 3425
getauscht. Siehe `SPRINT-7-FRAGEN.md` Frage 19 für Details.

**Begründung:** YAGNI — nur Konten ergänzen, die tatsächlich im Demo
oder im Mapping-Cross-Check als zwingend auftauchen.

---

### Entscheidung 17: Belegvalidierung Severity — USt-ID = ERROR, Rest WARNING

**Gewählt: B.** Bestehende `E010` (USt-ID fehlt bei IG-Lieferung)
bleibt ERROR nach § 6a Abs. 1 Nr. 2 UStG. Neue RC-/IG-Kontenwahl-
Warnings `W105`/`W106`/`W107`/`W108` sind alle WARNING.

**Begründung:** USt-ID-Fehlen ist eine gesetzliche Pflicht-Lücke,
die die IG-Lieferung ungültig macht. Kontenwahl-Unstimmigkeiten sind
Plausibilitäts-Hinweise — der Buchhalter kann im Einzelfall
abweichend buchen (z. B. bei gemischten Belegen).

**Tatsächlich implementiert:**
- `W105` RC ohne Aufwandskonto im Range 3100-3159 → falsches Konto
- `W106` RC + 3120-3129 aber Beschreibung ohne „Bau" → Subsumtion prüfen
- `W107` RC + 3130-3139 aber Beschreibung ohne „Reinigung"/„Gebäude"
- `W108` IG-Lieferung ohne Erlöskonto im Range 8120-8199

---

### Entscheidung 18: BelegerfassungPage — Boolean-Checkboxen belassen

**Gewählt: B.** Die bestehenden `istReverseCharge` +
`istIgLieferung`-Checkboxen bleiben. Kein Dropdown für § 13b-
Varianten (Abs. 1, Abs. 2 Nr. 1/2/3/4-11).

**Begründung:** Die UStVA-Kennzahl-Auflösung erfolgt **bereits präzise**
über die Konto-Wahl via `skr03UstvaMapping.ts` (3100 → Kz 46, 3120
→ Kz 73, 3130 → Kz 78, 3140 → Kz 52). Ein zusätzlicher Varianten-
Selektor wäre redundant und würde die UI-Komplexität ohne fachlichen
Zugewinn erhöhen.

**Umsetzungs-Detail:** Die in Phase 2 ergänzten Plausi-Warnings
`W106`/`W107` nutzen die Beschreibung als weiche Prüfung — dadurch
wird der Nutzer auf „Konto ≠ erwartete Subsumtion"-Konstellationen
hingewiesen.

---

## Autonom getroffene Neben-Entscheidungen

Siehe `docs/SPRINT-7-FRAGEN.md` für vollständige Liste:
- **Frage 19:** Demo-Szenario IG-Erwerb auf Konto 3425 statt 3400.
- **Frage 20:** 1572/1574/1575-Mapping-Inkonsistenz bemerkt, nur
  1574 additiv ergänzt (Label-Drift in 1572/1575 für späteren Sprint
  dokumentiert).

---

## Phasen-Abschluss

| Phase | Beschreibung | Tests vorher → nachher |
|---|---|---|
| 1 | SKR03-Seed: +5 Konten | 932 → 932 (keine Test-Änderung) |
| 2 | BelegValidierung RC/IG (W105-W108) | 932 → 939 (+7) |
| 3 | ZmXmlBuilder Preview + UI-Button | 939 → 945 (+6) |
| 4 | Demo-Szenarien (5 Zeilen) + README 14g + DECISIONS | nur Daten |
| 5 | UstvaBuilder-Integration für Kz 41/46/73/78/89/47 | 945 → **951** (+6) |

**Finaler Stand:** **951 / 951 Tests grün** (932 → +19), tsc clean.
Zielbereich 945-960 getroffen. Keine Regression in den bestehenden
932 Tests.

---

## Scope-Grenzen eingehalten

- Hash-Kette unverändert (keine Änderung an `journal_entries` oder
  `audit_log`)
- Keine neue Migration (Sprint 7 ist reine Code-Erweiterung)
- Keine neuen npm-Dependencies
- TypeScript strict + Decimal.js durchgängig (keine neuen
  `number`-Arithmetik an Geld-Stellen)
- Bestehende 932 Tests bleiben grün; neue Tests additiv

---

## Offen für spätere Sprints

- ERiC-/BOP-Direkt-Übermittlung (P1-Blocker, CLAUDE.md § 10)
- Dreiecksgeschäfte-Detail-Logik (Kz 42, Konto 8338)
- 1572/1575-Label-Korrektur (FRAGEN 20)
- OSS / IOSS / MOSS
- Einfuhrumsatzsteuer-Import-Workflow
- Weitere § 13b-Bemessungs-Konten (3140, 3110 als Einzel-Einträge)
