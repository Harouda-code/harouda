# Open Questions — Harouda

Dieses Dokument sammelt offene Fragen, bekannte Schwachstellen und
verschobene Untersuchungen, die ausserhalb des aktuellen Scopes liegen.
Jeder Eintrag bekommt:
  - Datum (ISO)
  - Kontext (Phase / Patch / Branch)
  - Symptom
  - Hypothese
  - Vorgeschlagene Untersuchung
  - Status

---

## 2026-04-25 — Flaky Test: PartnerEditor VIES (#14)

**Kontext**
- Branch: `feat/arbeitsplatz-datev-refactor`
- Phase 1, Patch 1.6 (BaseShell-Scaffold)

**Symptom**
- Test-File: `src/components/partners/__tests__/PartnerEditor.test.tsx`
- Test: `PartnerEditor · Edit-Mode + VIES > #14 VIES-Button-Klick → Badge status=VALID`
- Assertion: `expect(badge.getAttribute("data-status")).toBe("VALID")`
- Sporadischer Fehler: `Expected: "VALID", Received: "NULL"`

**Reproduzierbarkeit**
- Im vollständigen Suite-Lauf (1979 Tests, 197 Test-Files parallel)
  einmal in 4 aufeinanderfolgenden Phase-1-Läufen aufgetreten
  (3× grün, 1× rot in Patch 1.6).
- In Isolation: 3/3 grün
  (`npx vitest run … -t "VIES-Button-Klick"`).

**Hypothese**
Race condition zwischen mock-VIES async resolve und React DOM commit
des Badge-Status. Unter Lastdruck (197 Files parallel auf happy-dom)
prüft die Assertion das `data-status`-Attribut, bevor React den State
committet hat.

**Vorgeschlagene Untersuchung (separates Commit, nach Phase 1)**
1. Test-Code lesen, identifizieren ob `await waitFor(...)` oder
   `await findBy*` fehlt.
2. Mock-Strategie für VIES prüfen — synchron vs. asynchron, ggf.
   `vi.runAllTimersAsync()` einsetzen.
3. Falls strukturell flaky: nach Behebung diesen Eintrag schliessen,
   nicht via `vitest --retry` umgehen (das maskiert nur das Symptom).

**Status**
🟡 Offen — verschoben nach Phase-1-Abschluss.
Phase 1 wird ohne Berücksichtigung dieses Tests fortgesetzt.
