# User-Story-Archiv · Sprint 17.5

**Titel:** "Implementierung Erläuterungsbericht & rechtssichere
Bescheinigung (Jahresabschluss)"
**Erfasst:** 2026-04-27
**Status:** ✅ Umgesetzt — siehe
[`SPRINT-17-5-ERLAEUTERUNG-BESCHEINIGUNG-ABSCHLUSS.md`](./SPRINT-17-5-ERLAEUTERUNG-BESCHEINIGUNG-ABSCHLUSS.md).

---

## Zentrale User-Entscheidungen (bestätigt)

### Teil 1 · Erläuterungsbericht

- **EIN** Rich-Text-Editor (TipTap, free-form) — NICHT 5 separate Editoren.
- 4 Click-to-Insert-Phrasen als Chips/Buttons.
- Wizard-Step zwischen "Bausteine" und "Review".
- Rechtsbasis: § 264 Abs. 2 Satz 2 HGB (freiwillig).

### Teil 2 · Bescheinigung

- Neuer Wizard-Step **NACH** dem Review-Step (letzter Step).
- Dropdown für 3 Typen (ohne Beurteilungen · mit Plausibilität ·
  mit umfassender Beurteilung).
- Readonly-Preview via `<textarea disabled readOnly>`.
- 6 Placeholders inkl. `{{SteuerberaterName}}`.

### 4 Säulen der Bescheinigungs-Umsetzung

1. **Constants-File** mit readonly BStBK-Texten
   (`Object.freeze` + `readonly` + `as const`).
2. **Safe-Placeholders** — Whitelist-Substitution mit exakt 6 Keys.
3. **UI Readonly-Preview** — `<textarea disabled readOnly>`-DOM.
4. **Footer** "Gemäß den Hinweisen der Bundessteuerberaterkammer …"
   als zentrale Konstante, optional per Checkbox.

### Haftungs-relevanz

BStBK-Texte sind rechtlich normiert. Änderungen erfordern:
- Steuerberater-Sign-off im PR.
- `version_stand`-Update pro Typ.
- Jährlichen Review-Cycle (siehe
  [`BSTBK-BESCHEINIGUNG-UPDATE-GUIDE.md`](./BSTBK-BESCHEINIGUNG-UPDATE-GUIDE.md)).

## Rechtliche Basis (zitiert)

- **§ 242 HGB** — Jahresabschluss-Pflicht.
- **§ 264 Abs. 2 Satz 2 HGB** — freiwillige Erläuterungen.
- **§ 57 StBerG** — Steuerberater-Pflichten.
- **BStBK-Verlautbarung "Hinweise zur Erstellung von
  Jahresabschlüssen"** (Stand 2023).

## Nicht-Tun-Liste (bewusst ausgelassen)

- Keine editierbaren Kerntexte in UI.
- Keine DB-Persistenz der Kerntexte.
- Kein Digital-Signatur-Modul.
- Kein Stempel-Upload.
- Keine BWA-Integration.
- Keine Änderung an PDF/A-3-Pipeline.
- Keine Erweiterung der Placeholder-Whitelist ohne Code-Review.
- KEINE 5 separaten Erläuterungs-Editoren (EIN Editor + Phrasen-Chips).

---

**Für die vollständige Umsetzungs-Dokumentation siehe
[`SPRINT-17-5-ERLAEUTERUNG-BESCHEINIGUNG-ABSCHLUSS.md`](./SPRINT-17-5-ERLAEUTERUNG-BESCHEINIGUNG-ABSCHLUSS.md).**
