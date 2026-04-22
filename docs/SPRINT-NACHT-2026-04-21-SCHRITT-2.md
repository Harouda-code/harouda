# Nacht-Modus 2026-04-21 · Schritt 2 — Anlage Vorsorge SV-AN-Breakdown

**Status:** abgeschlossen · 1 offene Frage (KV-Zusatzbeitrag-Mapping).

## Deliverables

| Datei | Art |
|---|---|
| `src/domain/est/archivEstImport.ts` | +85 Zeilen — `AnlageVorsorgeVorschlag` + `importAnlageVorsorgeAusArchiv` |
| `src/components/ArchivImportModal.tsx` | variant-Prop + diskriminiertes Props-Union |
| `src/pages/AnlageVorsorgePage.tsx` | +70 Zeilen — Import-Button + Banner + 5-Feld-Mapping |
| `src/domain/est/__tests__/archivEstImport.test.ts` | +4 Tests (#7-#10) |
| `src/components/__tests__/ArchivImportModal.test.tsx` | +2 Tests (variant) |
| `src/pages/__tests__/AnlageVorsorgePage.integration.test.tsx` | neu · 2 Tests |

## Feld-Mapping Vorschlag → Page-State

| Vorschlag-Feld | Page-State-Feld | Rechenweg | Kz |
|---|---|---|---|
| `kv_an_basis` + `kv_an_zusatz` | `z11_kv_an` | Summe (inkl. Zusatzbeitrag) | 320/420 |
| `pv_an` | `z13_pv_an` | 1:1 | 323/423 |
| `rv_an` | `z4_an_anteil` | 1:1 | — (Z. 4) |
| `av_an` | `z43_av_an` | 1:1 | 370/470 |

## Test-Count-Delta

`1242 → 1250` (+8), 103 Files (+1), tsc clean.

## Offene Frage (dokumentiert in OPEN-QUESTIONS)

KV-Zusatzbeitrag wird zum `z11_kv_an` zusammengerechnet, obwohl manche
Nutzer einen separaten Slot bevorzugen könnten. Default-Annahme: Summe,
semantisch konform mit „AN-Beitrag zur gesetzlichen KV inkl.
Zusatzbeitrag".
