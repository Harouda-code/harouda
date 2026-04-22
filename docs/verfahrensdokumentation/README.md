# Verfahrensdokumentation — harouda-app

> Status: STUB | Version: 0.1 | Letztes Update: 2026-04-20

Gliederung nach **AWV-Muster-Verfahrensdokumentation** und
**GoBD-Rz. 151-155** (BMF-Schreiben vom 28.11.2019). Die Pflicht zur
Verfahrensdokumentation ergibt sich aus § 145 AO i.V.m. § 147 AO.

**Dies ist ein Strukturgerüst.** Die einzelnen Kapitel enthalten nur
Überschriften, Zweck-Sätze und `<!-- TODO(verfahrensdoku): ... -->`-
Marker. Die inhaltliche Befüllung muss durch Kanzlei-Leitung,
Steuerberater und Datenschutzbeauftragte:n erfolgen, bevor die
Anwendung produktiv eingesetzt werden kann.

## Kapitelübersicht

| # | Kapitel | Datei | Status | GoBD-Rz. | Verantwortlich |
|---|---|---|---|---|---|
| 1 | Allgemeine Beschreibung | [01-allgemeine-beschreibung.md](01-allgemeine-beschreibung.md) | STUB | Rz. 151 | Kanzlei-Leitung |
| 2 | Anwenderdokumentation | [02-anwenderdokumentation.md](02-anwenderdokumentation.md) | STUB | Rz. 151-152 | Kanzlei + Entwickler |
| 3 | Technische Systemdokumentation | [03-technische-systemdokumentation.md](03-technische-systemdokumentation.md) | STUB | Rz. 153 | Entwickler |
| 4 | Betriebsdokumentation | [04-betriebsdokumentation.md](04-betriebsdokumentation.md) | STUB | Rz. 154-155 | Ops / IT |
| 5 | Datensicherheits- und Datenschutzkonzept | [05-datensicherheits-und-datenschutzkonzept.md](05-datensicherheits-und-datenschutzkonzept.md) | STUB | Rz. 103-105 | DSB + Entwickler |
| 6 | Aufbewahrungs- und Löschkonzept | [06-aufbewahrungs-und-loeschkonzept.md](06-aufbewahrungs-und-loeschkonzept.md) | STUB | Rz. 107-110 | StB + DSB |
| 7 | Prüfpfade und Protokollierung | [07-pruefpfade-und-protokollierung.md](07-pruefpfade-und-protokollierung.md) | STUB | Rz. 153-154 | Entwickler + StB |
| 8 | Internes Kontrollsystem (IKS) | [08-internes-kontrollsystem.md](08-internes-kontrollsystem.md) | STUB | Rz. 100-102 | Kanzlei-Leitung |

## Abhängigkeiten zu offenen Design-Entscheidungen

**Abhängig vom Hash-Chain-vs.-Erasure-Entscheid** (siehe
[`../HASH-CHAIN-VS-ERASURE.md`](../HASH-CHAIN-VS-ERASURE.md), wartet auf
Fachanwalt + DSB):

- Kapitel 5 — Abschnitt Pseudonymisierung / Anonymisierung
- Kapitel 6 — Abschnitt Art.-17-Löschworkflow
- Kapitel 8 — Abschnitt Festschreibungs-Policy (hängt davon ab, wie
  PII-Felder dauerhaft gesichert werden)

**Unabhängig — parallel zur Rechts-Review befüllbar:**

- Kapitel 1 (Allgemeine Beschreibung)
- Kapitel 2 (Anwenderdokumentation)
- Kapitel 3 (Technische Systemdokumentation)
- Kapitel 4 (Betriebsdokumentation)
- Kapitel 7 (Prüfpfade und Protokollierung — Status-quo-Dokumentation
  der bestehenden Hash-Kette; ändert sich erst mit Implementierung)

## Konventionen

- Dateinamen: `NN-slug.md` (Nummer 01-08, Kleinschreibung, Bindestrich-
  getrennt).
- Kopfzeile jeder Datei: `Status: STUB | Version: 0.1 | Letztes Update: YYYY-MM-DD`.
- TODO-Marker: `<!-- TODO(verfahrensdoku): ... -->` — einheitlich, damit
  eine `grep`-basierte Fortschrittsverfolgung möglich bleibt.
- Am Ende jeder Datei: Abschnitt `## Quellen & Referenzen` (anfangs
  leer; wird bei Befüllung mit §§, BMF-Schreiben, interner Verfahrens-
  Ordnung gefüllt).
- Cross-References zu bestehenden Artefakten im Codebase werden als
  relative Pfade angegeben (`../../src/...`, `../BACKUP-STRATEGY.md`, etc.).

## Quellen & Referenzen

<!-- TODO(verfahrensdoku): Gesamtrahmen — AO §§ 145, 146, 147; GoBD Rz. 151-155; AWV-Muster-Verfahrensdokumentation; HGB § 257; DSGVO Art. 5, 17, 32. -->
