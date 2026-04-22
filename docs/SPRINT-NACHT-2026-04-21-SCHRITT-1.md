# Nacht-Modus 2026-04-21 · Schritt 1 — AnlageAV Stammdaten-Store

**Status:** abgeschlossen · 0 offene Fragen.

## Deliverables

| Datei | Art | LOC |
|---|---|---:|
| `src/domain/est/avVertraegeStore.ts` | neu — CRUD + Mandant-Isolation | 92 |
| `src/domain/est/__tests__/avVertraegeStore.test.ts` | neu · 8 Tests | 108 |
| `src/pages/AnlageAVPage.tsx` | erweitert — Stammdaten-Sektion + Modal | +160 |
| `src/pages/__tests__/AnlageAVPage.integration.test.tsx` | neu · 2 Tests | 170 |
| `docs/TECH-DEBT-AV-VERTRAEGE-SUPABASE.md` | neu — Folge-Migration skizziert | 78 |

## Kernpunkte

- Key-Schema `harouda:av-vertraege:<mandantId>` — **jahr-unabhängig**, weil Verträge über Jahre stabil sind.
- `addAvVertrag` / `removeAvVertrag` / `loadAvVertraege` / `saveAvVertraege` · null-mandantId wirft · JSON-Parse-Fehler → leeres Array.
- AnlageAVPage: neue „AV-Verträge (Stammdaten)"-Sektion oben, bestehende BMF-Kz-Struktur unverändert.
- Stammdaten-Store ist **additiv** — nicht ersatz für die inline-`optout_v1/v2`-Vertragsnummern in PersonData (BMF-Kz-gebunden).

## Test-Count-Delta

`1232 → 1242` (+10), 102 Files (+2), tsc clean.

## Rechtsbasis

§ 10 Abs. 1 Nr. 2 + 3a EStG (Basisvorsorge, Riester/Rürup). Datenübermittlung durch Anbieter nach § 22a EStG — die Stammdaten hier sind nur die User-Referenz, kein VaSt-Abruf.
