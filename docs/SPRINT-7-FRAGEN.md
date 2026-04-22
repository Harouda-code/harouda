# Sprint 7 — Autonom getroffene Entscheidungen (Nacht-Modus)

Datei wird während der Implementierung ergänzt. Format pro Frage:
Kontext · Optionen · Entscheidung · Begründung · Reversibilität.

---

## Frage 19: Demo-Szenario IG-Erwerb auf Konto 3425 statt 3400

**Kontext (Phase 1-Pre-Check-Nachbesserung):** Der ursprüngliche
Detail-Plan (`SPRINT-7-PLAN-DETAIL.md` Phase 4) sah das Szenario
IG-2025-002 auf Konto **3400** vor. Beim Mapping-Cross-Check fiel
auf, dass 3400 in `skr03UstvaMapping.ts` NICHT auf Kz 89 mapped —
3400 ist normales Wareneingangs-Konto mit 19 % Vorsteuer. Der
IG-Erwerb 19 % landet nach Mapping auf Range **3425-3429** (Kz 89
„IG-Erwerb Bemessungsgrundlage 19 %").

**Optionen:**
- A) Demo-Szenario IG-2025-002 auf 3425 buchen, 3425 ins Seed
  ergänzen (statt 3140)
- B) Demo-Szenario auf 3400 belassen, aber im UStVA-Report fehlt
  Kz 89 (kein Mapping-Treffer)
- C) Mapping ändern: 3400 auch auf Kz 89 routen

**Entscheidung:** **A** — Demo-CSV nutzt 3425, Seed ergänzt um 3425
statt 3140.

**Begründung:** Frage 16 (Seed minimal) bestimmt, nur demo-
referenzierte Konten zu ergänzen. 3140 war im Plan aufgelistet,
kommt aber im tatsächlichen Demo nicht vor — 3425 ist dagegen
für die IG-Erwerb-Demo unabdingbar. Mapping-Korrektur (Option C)
würde bestehende Tests berühren und ist nicht Sprint-7-Scope.

**Reversibilität:** trivial. Ein späterer Sprint kann 3140 oder
weitere 3140er-Konten ergänzen, ohne Bestand zu berühren.

---

## Frage 20: 1572 / 1574 / 1575 — Mapping-Inkonsistenz bemerkt, nicht behoben

**Kontext:** Beim Cross-Check zwischen Seed und Mapping:

- Seed Zeile 64: `1572 "Abziehbare Vorsteuer aus innergem. Erwerb"`
  mit ust_satz 19
- Seed Zeile 65: `1575 "Abziehbare Vorsteuer aus Reverse-Charge"`
  mit ust_satz 19
- Mapping Zeile 81: `1574 → Kz 61 (VST_IG_ERWERB)`
- Mapping Zeile 83: `1572-1573 → Kz 66 (VORSTEUER_ALLG_A)`
- Mapping Zeile 84: `1575 → Kz 66 (VORSTEUER_ALLG_B)`

Die **Seed-Bezeichnung von 1572** („Abziehbare Vorsteuer aus
innergem. Erwerb") stimmt inhaltlich mit 1574 (Kz 61, IG-Erwerb)
überein, aber das Mapping-Ziel von 1572 ist Kz 66 (allgemeine
Vorsteuer). Und 1575 heißt „aus Reverse-Charge", mapped aber auch
auf Kz 66 — nicht auf Kz 67 (wo 1577 hingehört).

**Optionen:**
- A) 1574 neu ergänzen wie vom Mapping erwartet; 1572/1575 Label-
  Inkonsistenzen als Bestand lassen (dokumentieren, späterer Sprint)
- B) 1572 umbenennen auf eine andere Bezeichnung (z. B.
  „Abziehbare Vorsteuer 16 %"), 1574 ergänzen
- C) Mapping ändern: 1572 → Kz 61 routen, 1574 nicht nötig

**Entscheidung:** **A** — Nur 1574 ergänzen, 1572/1575-Label-Drift
dokumentieren und in späterem Sprint lösen.

**Begründung:** Sprint-7-Scope-Grenze „bestehende 932 Tests bleiben
grün". Umbenennung/Remapping bestehender Konten könnte
UstvaBuilder-Tests brechen, die ggf. die Seed-Bezeichnungen oder
das aktuelle Mapping implizit prüfen. Die Pflege-Last eines
schmalen Additiv-Schritts ist niedriger als ein Mapping-Refactor.

**Reversibilität:** leicht (1574 entfernen). Für den Refactor
(Umbenennen 1572) braucht ein späterer Sprint ein dediziertes
Pre-Check + Tests.
