# Tech-Debt · HGB-Taxonomie Multi-Version (E-Bilanz)

**Erfasst:** 2026-04-23 · Jahresabschluss-E4 / Schritt 2.
**Status:** Open · **Priority:** Medium (wird P1 sobald der erste
Stichtag 2023 oder 2024 durch das System laufen soll).

## GoBD-/§ 5b EStG-Relevanz

§ 5b EStG verlangt, dass die E-Bilanz im Format der zum jeweiligen
Stichtag geltenden BMF-Taxonomie uebermittelt wird. Fuer Bilanzstichtag
2023 → HGB-Taxonomie 6.6; 2024 → 6.7; 2025 → 6.8; ab 2026 → 6.9
(sobald BMF freigegeben). Ein Upload mit falscher Taxonomie-Version
kann von der Finanzverwaltung abgelehnt werden.

## Aktueller Stand (E4)

**Implementiert (Infrastruktur):**
- `src/domain/ebilanz/hgbTaxonomie.ts` — Register + Picker + Metadata.
- `pickTaxonomieFuerStichtag()` liefert die richtige Version pro Stichtag.
- 4 Versionen registriert: 6.6 (deprecated), 6.7 (deprecated),
  6.8 (stable), 6.9 (future).
- 6.9 `status === "future"` blockiert automatischen Einsatz bis BMF
  eine neue Taxonomie veroeffentlicht → wird dann auf `"stable"`
  umgestellt.

**NICHT implementiert (Schema-Mapping):**
- Die konkreten XBRL-Strukturmodule fuer 6.6, 6.7 und 6.9 existieren
  nicht. `EbilanzXbrlBuilder` verwendet weiterhin die 6.8-Struktur
  aus `hgbTaxonomie68.ts` fuer alle Versionen.
- Foliengleich: Ein 2023-Stichtag wird heute auch per 6.8-Struktur
  exportiert + Version-Tag 6.6. Das ist XBRL-formal fehlerhaft.

## Beschreibung der offenen Arbeit

Pro Version ist ein eigener Sprint (je ~3-5 Tage) erforderlich. Inhalt:

1. **Taxonomie-Download** von BMF-Portal
   (https://esteuer.bundesfinanzministerium.de/estaxo/taxonomien).
2. **Diff gegen 6.8** berechnen:
   - Feld-Umbenennungen (`de-gaap-ci:*` → neue Namespaces).
   - Neu eingefuehrte Pflichtpositionen.
   - Entfallene Felder.
   - Aenderungen an context-/unit-Definitionen.
3. **Neues Strukturmodul** `hgbTaxonomie66.ts` / `...67.ts` / `...69.ts`
   mit jeweils eigener `BILANZ_XBRL_MAP`, `GUV_XBRL_MAP`,
   `EBILANZ_NAMESPACES` pro Version.
4. **Version-Switch** im `EbilanzXbrlBuilder`:
   aktuell klassenbasiert hardcoded auf 6.8. Umstellung auf Strategy-
   Pattern: die Version kommt aus `pickTaxonomieFuerStichtag(stichtag)`
   oder als expliziter Parameter durch den Aufrufer.
5. **Tests** pro Version:
   - Smoke: XML fuer einen bekannten Dummy-Datensatz generieren.
   - Namespaces + Versions-Tag im Header pruefen.
   - Neue Pflichtfelder → Validator meldet sie bei Absenz.

## Vorschlag

Ein eigener Folge-Sprint pro Version (nicht parallel, weil jede
Version eigene Edge-Cases mitbringt). Reihenfolge nach Geschaefts-
dringlichkeit:

1. **6.9** (erwartet April 2026) — prophylaktisch, damit der erste
   2026-Stichtag (meist 31.12.2026) produktionsreif ist.
2. **6.7** (bei Bedarf) — nur wenn Mandanten mit 2024-Stichtag
   onboarded werden.
3. **6.6** (bei Bedarf) — nur wenn historische 2023-Nachreichungen
   anfallen.

## Aufwand-Schaetzung

- 6.9: ~1 Sprint (4-5 Stunden) — inkl. Schema-Diff + Integration.
- 6.6 / 6.7: je ~1 Sprint (3 Stunden) — Bestandsarbeit, Diff bereits
  historisch bekannt, BMF-Docs verfuegbar.

## Wartungs-Checklist (jaehrlich, Januar)

- [ ] Auf `bundesfinanzministerium.de` nach neuer Taxonomie-Version suchen.
- [ ] `HGB_TAXONOMIE_VERSIONEN` um den neuen Eintrag erweitern
      (initial `status: "future"`).
- [ ] Ankuendigung in `docs/ROADMAP.md` (Deprecation-Watch).
- [ ] BMF-Freigabe der Taxonomie abwarten → `status: "stable"` setzen.
- [ ] Folge-Sprint fuer echte Strukturumsetzung einplanen.

## Referenzen

- `src/domain/ebilanz/hgbTaxonomie.ts` — Register + Picker.
- `src/domain/ebilanz/hgbTaxonomie68.ts` — aktuelle Struktur 6.8.
- `src/domain/ebilanz/EbilanzXbrlBuilder.ts` — Consumer-Klasse.
- `src/domain/ebilanz/__tests__/hgbTaxonomie.test.ts` — Tests fuer den
  Picker.
