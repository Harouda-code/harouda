# Open Question · Anhang-Textbausteine-Autofill

**Erfasst:** 2026-04-27 · Sprint "Jahresabschluss-PDF Real-Builder-Wiring".
**Status:** offen · Entscheidungs-Scope: Product / Steuerberater.

## Kontext

Der Jahresabschluss-Wizard (Sprint 11 / E3a) liefert 6 HGB-Anhang-
Textbausteine (§§ 284–287 HGB) als Default-Templates mit Platzhalter-
Tokens wie:

- `"durchschnittlich [ZAHL EINSETZEN] Arbeitnehmer (§ 285 Nr. 7 HGB)"`
- `"[Name der/s Geschäftsführers/in], Geschäftsführer (§ 285 Nr. 10 HGB)"`
- `"[Hier individuellen Text ergänzen]"`

Die `DocumentMergePipeline` rendert pro Baustein entweder einen
User-`override` (aus TipTap-Editor) ODER den Default-Template-Text
unverändert inkl. Platzhalter-Tokens.

## Beobachtetes Verhalten

Ein User, der im Wizard keine Overrides setzt (z. B. direkt nach Seed-
Datenlauf), sieht im PDF die Templates mit den sichtbaren Platzhaltern.
Der Jahresabschluss-Seed-Test (`scripts/seedJahresabschlussTest.ts`)
liefert Daten, aus denen sich die Platzhalter rein technisch füllen
ließen:

- Anzahl aktiver Mitarbeiter = 2 (aus `employees`-Tabelle).
- Geschäftsführer-Name(n) = aus `clients.geschaeftsfuehrer`-JSONB.
- Gezeichnetes Kapital, HRB, Sitz etc. = aus `clients`-Tabelle.

## Frage

Soll der Wizard diese Werte automatisch in die Anhang-Textbausteine
einsetzen, oder bleibt die manuelle Editor-Eintragung der einzige Pfad?

## Default-Annahme (aktueller Zustand, Sprint 11 E3a)

**Manuelle Editor-Eintragung.** Rechtfertigung aus Sprint-11-Doku:

1. **Haftung.** HGB-§-285-Angaben wie "durchschnittlich beschäftigte
   Arbeitnehmer" haben eine rechtsbindliche Auslegung (z. B.
   Teilzeit-Umrechnung nach BilRUG). Ein naiver `employees.filter(e =>
   e.is_active).length` wäre fachlich falsch (Auszubildende,
   Kopfzahl-vs-Vollzeitäquivalent-Problem).
2. **Pflicht-Verantwortung des Steuerberaters.** Der Anhang ist Teil
   des testierbaren Jahresabschlusses (§ 264 HGB). Das System soll
   keine "automatischen" Angaben einfügen, für die der StB dann
   haftbar ist, ohne sie gesehen zu haben.
3. **Geschäftsführer-Historie.** `clients.geschaeftsfuehrer[]` enthält
   alle Organe inkl. ausgeschiedener — die Anhang-Angabe nach
   § 285 Nr. 10 verlangt aber nur die im Geschäftsjahr bestellten.

## Mögliche Varianten (falls Entscheidung Autofill)

### A) Opt-in Autofill pro Textbaustein

Pro Baustein Button "Default-Vorschlag einfügen" im Editor-Step;
Wizard rechnet Werte, schlägt Text vor, User bestätigt/editiert.

Aufwand: ~1 Sprint. Risiko: mittel (Berechnungs-Logik pro Baustein
+ Auslegungsdiskussion mit StB).

### B) Autofill mit Override-Flag

Wizard setzt Werte automatisch in den Override-Text, markiert jeden
auto-gefüllten Baustein mit "⚠ automatisch — bitte prüfen". Export
blockiert, bis User jeden Baustein mindestens einmal geöffnet hat.

Aufwand: ~1 Sprint. Risiko: hoch (UX-Komplexität, Haftungsfrage).

### C) Status Quo (manuell)

Dokumentations-Update: "Wizard-Step 5 (Erläuterungen) ist der Ort,
an dem der StB die Anhang-Bausteine mit Mandanten-Daten zu befüllen
hat. System füllt nicht automatisch."

Aufwand: 0. Risiko: keiner.

## Review-Dringlichkeit

**Niedrig.** Die Default-Templates sind klar als Platzhalter
erkennbar (UPPERCASE in eckigen Klammern) und rot im PDF-Rendering.
User kann nicht versehentlich einen Anhang mit "[ZAHL EINSETZEN]"
testieren, ohne es zu bemerken.

## Entscheidungs-Stakeholder

- Product (UX-Strategie).
- Steuerberater-Fachbeirat (Haftungsfrage).
- Entwickler (Aufwandsschätzung konkret pro Baustein).

## Betroffene Dateien (falls Umsetzung)

- `src/domain/jahresabschluss/anhangTextbausteine.ts` — Template-Quelle.
- `src/domain/jahresabschluss/pdf/DocumentMergePipeline.ts` — Rendering.
- `src/pages/jahresabschluss/StepErlaeuterungen.tsx` — Editor-UI.
- `src/pages/jahresabschluss/StepBausteine.tsx` — Bausteine-Auswahl.
- Neue Datei `src/domain/jahresabschluss/anhangAutofill.ts` mit den
  Berechnungs-Regeln pro Baustein.

## Siehe auch

- `docs/SPRINT-JAHRESABSCHLUSS-E3A-ABSCHLUSS.md` — Sprint-Design
  manuelle Eintragung begründet.
- `docs/TEXTBAUSTEINE-UPDATE-GUIDE.md` — jährlicher Review-Rhythmus.
- `docs/BSTBK-BESCHEINIGUNG-UPDATE-GUIDE.md` — Bescheinigung (dort
  ist Placeholder-Substitution implementiert, als Referenz für
  möglichen Autofill-Ansatz hier).
