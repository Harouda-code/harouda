# Open Questions · Nacht-Modus 2026-04-21

**Status:** beide Fragen GELÖST durch Smart-Banner-Sprint (2026-04-21).

Transparente Liste der Stellen, an denen eine defensive Default-Annahme
gewählt wurde, weil die Spec keine explizite Antwort enthielt.

## Frage 1 (Schritt 2) — GELÖST (User-Bestätigung Default korrekt)

**Kontext:** `importAnlageVorsorgeAusArchiv` liefert `kv_an_basis`
(§ 249-Beitragssatz) und `kv_an_zusatz` (kassenspezifischer Zusatz)
getrennt. Die AnlageVorsorge-Page hat nur **ein** Feld `z11_kv_an`
(Kz 320) für den AN-Beitrag zur gesetzlichen Krankenversicherung.

**Frage:** Sollen die beiden Werte beim Import zusammengerechnet werden,
oder soll ein sekundäres Feld (`z12_kv_an_ohne_kg`, Kz 322) den
Zusatzbeitrag aufnehmen?

**Default-Annahme:** Summe `kv_an_basis + kv_an_zusatz` → `z11_kv_an`.
Semantik: „Beitrag zur gesetzl. KV (inkl. kassenspezifischer Zusatz)".
Das entspricht dem Steuerbescheinigungs-Wert, den ein Arbeitnehmer in
der Regel selbst in Anlage Vorsorge einträgt. Kz 322 bleibt unbefüllt
und user-editierbar.

**Review-Dringlichkeit:** niedrig.

**Betroffene Dateien:**
- `src/pages/AnlageVorsorgePage.tsx` (handleVorsorgeImport)
- `src/pages/__tests__/AnlageVorsorgePage.integration.test.tsx` (Test #2)

**Review-Frage für Steuerberater:** Sollte der Zusatzbeitrag in Anlage
Vorsorge explizit getrennt erscheinen, z. B. via Kz 322 „ohne
Krankengeld-Anspruch"? Im Default ist das Kz-322-Feld für gesetzlich
KV-pflichtige AN typischerweise 0, weil der Krankengeldanspruch
besteht.

## Frage 2 (Schritt 4) — GELÖST (Smart-Banner-Sprint)

**Lösung:** Strikte `"gebucht"`-Filterung bleibt Default; neuer Simulation-Mode via UI-Toggle (`includeDraft`-Parameter im Builder) + GoBD-Safety-Lock auf PDF-Export. Details siehe `docs/SPRINT-SMART-BANNER-ENTWURF-ABSCHLUSS.md`.

## Frage 2 (Schritt 4) — Original-Kontext

**Kontext:** `postPayrollAsJournal` schreibt Lohn-Entries als
`status="entwurf"` (Phase-2-Design: Admin-Freigabe als separater
Festschreibungs-Schritt). `buildAnlageG` filtert hingegen auf
`status === "gebucht"` — Entwürfe fließen damit **nicht** in die
Anlage G ein.

**Frage:** Ist das erwünscht? Ein User, der einen Lohn-Lauf gestartet
hat, sieht die Werte nicht sofort in Anlage G — erst nach der
Admin-Freigabe (Festschreibung). Das ist GoBD-konform (nur
festgeschriebene Buchungen in Steuererklärung), könnte aber im
Prozess-Fluss als „verloren" wirken.

**Default-Annahme:** Strikte Filterung auf `"gebucht"` bleibt. Cross-
Module-Test simuliert die Admin-Freigabe explizit via
`store.setEntries(... status: "gebucht" ...)`.

**Review-Dringlichkeit:** mittel (UX + GoBD-Konformität beides
betroffen).

**Betroffene Dateien:**
- `src/domain/est/anlagenUtils.ts` (filterEntriesInYear — `status === "gebucht"`)
- `src/utils/payrollPosting.ts` (schreibt als "entwurf")
- `src/__tests__/cross-module-lohn-to-anlage-g.smoke.test.tsx` (simuliert Übergang)

**Review-Frage für Steuerberater:** Soll Anlage G auch Entwürfe
anzeigen (mit Warn-Badge), oder strikt nur Festgeschriebenes?
