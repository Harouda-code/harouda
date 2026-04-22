# Kapitel 6 — Aufbewahrungs- und Löschkonzept

> Status: STUB | Version: 0.1 | Letztes Update: 2026-04-20

## Zweck

Regelt, wie lange welche Daten aufbewahrt werden (§ 147 AO, § 257 HGB,
§ 41 EStG für Lohnunterlagen) und wie nach Fristablauf bzw. bei
DSGVO-Löschanfragen technisch verfahren wird. GoBD Rz. 107-110
verlangt ein schriftliches, praktiziertes Löschkonzept.

**Abhängigkeit:** Abschnitt 6.3 (Art.-17-Löschworkflow) kann erst
finalisiert werden, nachdem die Hash-Chain-vs.-Erasure-Entscheidung
(siehe [`../HASH-CHAIN-VS-ERASURE.md`](../HASH-CHAIN-VS-ERASURE.md))
durch Fachanwalt + DSB bestätigt ist.

## Gliederung

### 6.1 Aufbewahrungsfristen (Deutschland)

<!-- TODO(verfahrensdoku): Tabelle der Kategorien mit Fristen und Rechtsgrundlage: Bücher / Jahresabschlüsse (10 J.), Buchungsbelege (8 J. seit Wachstumschancengesetz 2025), Handelsbriefe (6 J.), sonstige steuerrelevante Unterlagen (6 J.), Cookie-Consents (3 J. TTDSG), Lohnunterlagen (Frist offen — siehe Kapitel 5 + HASH-CHAIN-VS-ERASURE.md Q2). Anker: Ende des Kalenderjahres der Entstehung. -->

### 6.2 Löschung nach Fristablauf

<!-- TODO(verfahrensdoku): Periodischer Job (geplant, noch nicht implementiert) zur Prüfung abgelaufener Retentionen. Kriterium siehe canDelete() in retention.ts. Manuelle Freigabe durch Kanzlei-Leitung oder automatisch — zu definieren. -->

### 6.3 Löschung auf Betroffenen-Antrag (DSGVO Art. 17)

<!-- TODO(verfahrensdoku): HÄNGT AB vom Hash-Chain-Entscheid. Workflow: Antrag → Protokoll in privacy_requests → Prüfung ob innerhalb AO-Frist (dann aufschieben mit Hinweis) oder außerhalb (dann umsetzen). Konkretes technisches Verfahren ergibt sich aus dem gewählten Ansatz (Option A/B/C/D). 30-Tage-Antwort-Frist nach Art. 12 Abs. 3. -->

### 6.4 Archivierungs-Medium

<!-- TODO(verfahrensdoku): Wo liegen archivierte Daten nach Fristablauf vor Löschung? Separate Archiv-Datenbank? Read-only-Tabelle? Verweis auf Backup-Strategy. -->

### 6.5 Dokumentation einzelner Löschvorgänge

<!-- TODO(verfahrensdoku): Jede Löschung mit Zeitpunkt, Betroffenem, Rechtsgrundlage, Durchführer:in festhalten — entweder in audit_log oder in dediziertem pii_erasures-Register (abhängig von Hash-Chain-Entscheid). -->

### 6.6 Sonderfälle

<!-- TODO(verfahrensdoku): Laufende Rechtsstreitigkeit / Betriebsprüfung: Löschung ist ausgesetzt (§ 147 Abs. 3 Satz 3 AO — Aufbewahrung bis Ende der Prüfung / des Rechtsstreits). Wie wird dieser Zustand technisch abgebildet (Mandant-Flag, Hold-Marker)? -->

### 6.7 Löschung von Backup-Kopien

<!-- TODO(verfahrensdoku): Abstimmung mit Backup-Strategie: Löschung in Primär-DB muss sich in Backup-Retention widerspiegeln (z.B. nach 10 Jahren rollt jährliches Backup heraus). Verweis auf BACKUP-STRATEGY.md. -->

## Verweise auf bestehende Artefakte

- [`../../src/data/retention.ts`](../../src/data/retention.ts)
  (Retention-Regeln mit Wachstumschancengesetz-2025-Update, `canDelete()`-
  Helper)
- [`../../src/pages/RetentionPage.tsx`](../../src/pages/RetentionPage.tsx)
  (UI-Ansicht abgelaufener Fristen unter /einstellungen/aufbewahrung)
- [`../HASH-CHAIN-VS-ERASURE.md`](../HASH-CHAIN-VS-ERASURE.md)
  (Q2: Lohnunterlagen-Fristen; Q5: Mandanten-Kündigung während Frist)
- [`../BACKUP-STRATEGY.md`](../BACKUP-STRATEGY.md) (Backup-Retention-
  Abstimmung)
- [`../COMPLIANCE-GUIDE.md`](../COMPLIANCE-GUIDE.md) (GoBD/AO-Mapping)

## Quellen & Referenzen

<!-- TODO(verfahrensdoku): AO § 147 Abs. 3 (Fristen); HGB § 257; § 41 EStG (Lohnunterlagen); Wachstumschancengesetz 2025; DSGVO Art. 5 Abs. 1 lit. e (Speicherbegrenzung), Art. 17; GoBD Rz. 107-110; DSK-Kurzpapier Nr. 11. -->
