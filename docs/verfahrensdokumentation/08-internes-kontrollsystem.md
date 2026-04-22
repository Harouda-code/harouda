# Kapitel 8 — Internes Kontrollsystem (IKS)

> Status: STUB | Version: 0.1 | Letztes Update: 2026-04-20

## Zweck

Beschreibt die internen Kontrollen, die die Ordnungsmäßigkeit der
Buchführung sicherstellen (GoBD Rz. 100-102). Umfasst Freigabe-
Workflows, 4-Augen-Prinzip, Rollentrennung, Festschreibungs-Policy
und regelmäßige Stichprobenkontrollen.

**Abhängigkeit:** Abschnitt 8.4 (Festschreibungs-Policy) kann erst
finalisiert werden, nachdem die Hash-Chain-vs.-Erasure-Entscheidung
(siehe [`../HASH-CHAIN-VS-ERASURE.md`](../HASH-CHAIN-VS-ERASURE.md))
geklärt ist, weil die Frage "was bleibt in der Kette und was wird
getrennt geführt" die Festschreibungs-Sicherheit direkt betrifft.

## Gliederung

### 8.1 Freigabe-Workflows

<!-- TODO(verfahrensdoku): Welche Vorgänge benötigen Freigabe durch eine zweite Person? Vorschlag: (a) Festschreibung einer Periode, (b) Lohnabrechnungs-Lauf, (c) Stornobuchung nach Festschreibung, (d) UStVA-Abgabe, (e) Datenexport für Dritte. Technische Umsetzung offen (derzeit keine durchgesetzte 4-Augen-Logik in der App). -->

### 8.2 Rollentrennung

<!-- TODO(verfahrensdoku): Inkompatible Rollen-Kombinationen: die Person, die einen Beleg erfasst, sollte ihn nicht auch festschreiben. Die Person, die eine Lohnabrechnung erzeugt, sollte sie nicht allein abgeben. Umsetzung über Rollen-Zuordnung in Kapitel 5.1. -->

### 8.3 Stichprobenkontrollen

<!-- TODO(verfahrensdoku): Regelmäßige interne Prüfungen: Monatliche Stichprobe von 10 % der Festschreibungen; Quartalsweise Verifikation der Hash-Kette über einen Zeitraum; Jährliche Kontrolle der Zugriffsrechte. Protokollierung im Audit-Log oder separatem IKS-Register. -->

### 8.4 Festschreibungs-Policy

<!-- TODO(verfahrensdoku): HÄNGT PARTIELL vom Hash-Chain-Entscheid ab. Regeln: Nach welchem Zeitraum wird automatisch festgeschrieben (Auto-Lock-Konfiguration, Migration 0009)? Wer darf manuell festschreiben? Wer darf entsperren (sollte niemand tun dürfen — Stornobuchung statt Entsperren)? -->

### 8.5 Plausibilitätsprüfungen

<!-- TODO(verfahrensdoku): Existierende Plausi-Checks (src/pages/BuchfuehrungPlausiPage.tsx, BelegValidierungsService): USt-Satz vs. Konto, Bilanz-Gleichung, Saldenliste, OP-Listen-Abgleich. Wie regelmäßig durchgeführt, wer reagiert auf Auffälligkeiten. -->

### 8.6 Abwesenheits- und Vertretungsregelungen

<!-- TODO(verfahrensdoku): Wer vertritt die Kanzlei-Leitung bei Urlaub / Krankheit in Bezug auf Freigaben, Incident-Response, DSGVO-Anfragen? Eskalations-Matrix. -->

### 8.7 Kontrollen bei Systemänderungen

<!-- TODO(verfahrensdoku): Review-Prozess für Code-Änderungen, insbesondere in GoBD-relevanten Modulen (journal, audit, festschreibung, hash-chain). Mindestens zwei unabhängige Reviewer:innen. Migrations-Freigabe separat. -->

### 8.8 Dokumentation von Ausnahmen

<!-- TODO(verfahrensdoku): Jede Abweichung vom regulären Prozess (Notfall-Zugriff, manueller Eingriff in Datenbank, Override einer Freigabe) muss mit Begründung, Datum, Verantwortlicher im Audit-Log festgehalten werden. -->

## Verweise auf bestehende Artefakte

- [`../../src/domain/gobd/FestschreibungsService.ts`](../../src/domain/gobd/FestschreibungsService.ts)
- [`../../src/domain/belege/BelegValidierungsService.ts`](../../src/domain/belege/BelegValidierungsService.ts)
- [`../../src/pages/BuchfuehrungPlausiPage.tsx`](../../src/pages/BuchfuehrungPlausiPage.tsx)
- [`../../supabase/migrations/0009_journal_autolock.sql`](../../supabase/migrations/0009_journal_autolock.sql)
- [`../../supabase/migrations/0021_gobd_festschreibung.sql`](../../supabase/migrations/0021_gobd_festschreibung.sql)
- [`../HASH-CHAIN-VS-ERASURE.md`](../HASH-CHAIN-VS-ERASURE.md) (Einfluss
  auf Abschnitt 8.4)

## Quellen & Referenzen

<!-- TODO(verfahrensdoku): GoBD Rz. 100-102 (Internes Kontrollsystem), Rz. 64 (Festschreibung); IDW PS 261 (Prüferische Würdigung des IKS); DSGVO Art. 32 (Zuverlässigkeit). -->
