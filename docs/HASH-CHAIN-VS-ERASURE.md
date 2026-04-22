# Hash-Kette vs. DSGVO Art. 17 — Design-Entscheidung

Stand: 2026-04-20 · Autor: Session-Dokumentation · **Noch keine
Code-Implementierung.** Dieses Dokument dient als technischer Vorentwurf
vor Rücksprache mit Fachanwalt für Steuerrecht und Datenschutzbeauftragtem.

Alle Rechtseinschätzungen in diesem Dokument sind vorläufig. Aussagen
in *kursiver* Form mit dem Marker **[Rechts-Review]** sind explizit zur
fachanwaltlichen Prüfung vorgesehen und dürfen nicht ohne Freigabe zur
Implementierungs-Entscheidung herangezogen werden.

---

## 1. Problemstellung

### 1.1 Gesetzeskonflikt

Zwei Regelwerke stellen widersprüchliche Anforderungen an dieselben
Datensätze:

**Seite "Aufbewahrung":**

- **§ 146 Abs. 4 AO** — "Eine Buchung oder eine Aufzeichnung darf nicht
  in einer Weise verändert werden, dass der ursprüngliche Inhalt nicht
  mehr feststellbar ist."
- **§ 147 Abs. 3 AO** — Aufbewahrungsfristen: 10 Jahre für Bücher,
  Jahresabschlüsse, Inventare; 8 Jahre für Buchungsbelege (seit
  Wachstumschancengesetz 2025); 6 Jahre für Handelsbriefe.
- **GoBD-Rz. 107 ff.** (BMF-Schreiben vom 28.11.2019) —
  Unveränderbarkeit als zentrales Ordnungsmäßigkeitsprinzip; Änderungen
  müssen so protokolliert werden, dass der ursprüngliche Inhalt
  feststellbar bleibt.
- **GoBD-Rz. 153-154** — Hash-Verfahren als akzeptierter Nachweis von
  Unveränderbarkeit (sofern der Hash die relevanten Inhalte abdeckt und
  die Kette bei einer Prüfung verifizierbar ist).

**Seite "Löschung":**

- **DSGVO Art. 17 Abs. 1** — Recht auf Löschung bei Wegfall des Zwecks,
  Widerruf der Einwilligung, unrechtmäßiger Verarbeitung, etc.
- **DSGVO Art. 17 Abs. 3 lit. b** — Ausnahme: die Verarbeitung ist zur
  Erfüllung einer rechtlichen Verpflichtung erforderlich. In Deutschland
  wird diese Ausnahme regelmäßig als einschlägig für § 147 AO
  angesehen — solange die Frist läuft.
- **DSK-Kurzpapier Nr. 11** (Konferenz der unabhängigen
  Datenschutzaufsichtsbehörden) — präzisiert: Aufbewahrungspflichten
  aus AO/HGB überlagern das Recht auf Löschung, bis die Frist endet.
  Danach muss aber aktiv gelöscht bzw. anonymisiert werden.

Der Konflikt ist also **nicht** "Aufbewahrungspflicht vs. Löschungsrecht"
im absoluten Sinne, sondern: **während der Frist** schützt die AO vor
Löschung; **nach der Frist** erwartet die DSGVO aktive Umsetzung.

### 1.2 Szenarien im harouda-Kontext

**Szenario A — Mandant fordert Löschung nach 3 Jahren.**
Eine GmbH kündigt den Mandantenvertrag und fordert Löschung aller ihrer
Daten. Buchungen der GmbH stehen noch unter 8-jähriger Aufbewahrung
(§ 147 Abs. 3 AO). *[Rechts-Review: wir nehmen an, dass Art. 17 Abs. 3
lit. b die Löschung während der Frist einwandfrei ausschließt. Zu
bestätigen. Auch offen: Müssen wir den Mandanten auf die Frist + das
Datum, ab dem gelöscht wird, aktiv hinweisen? Art. 12 Abs. 4 DSGVO.]*
Handlung: Anfrage wird protokolliert (Tabelle `privacy_requests`,
Migration 0023), Status `PENDING` mit `deadline = jetzt + 30 Tage`,
Antwort an Betroffene mit Hinweis auf gesetzliche Aufbewahrungspflicht
und konkretem Löschdatum nach Fristablauf.

**Szenario B — Mitarbeiter eines Mandanten fordert Löschung.**
Der betroffene Mitarbeiter erscheint in `employees`,
`lohnabrechnungen_archiv` und über Auftragsverarbeitung ggf. in
`journal_entries` (Lohnbuchungen). Für Lohnabrechnungsunterlagen gilt
regelmäßig eine 6-jährige Aufbewahrungsfrist (Lohnunterlagen i.S.d.
§ 41 EStG/Lohnsteuer-Richtlinien). *[Rechts-Review: 6 vs. 10 Jahre
genau je Dokumenttyp prüfen — die Fristen in `src/data/retention.ts`
sind für Buchhaltungsunterlagen, nicht Personalunterlagen.]* Das
Problem ist hier schwieriger, weil Lohndaten stark personenbezogen
sind — Name, Adresse, Steuer-ID, SV-Nummer, Gehaltshöhe. Eine Lösung,
die nur "Kontonummern" verschlüsselt, greift zu kurz.

**Szenario C — Betriebsprüfung verlangt Unveränderbarkeitsnachweis.**
Ein Betriebsprüfer lädt einen Z3-Datensatz (§ 147 Abs. 6 AO), erwartet
Hash-Kette mit verifizierbaren `prev_hash` / `entry_hash` Übergängen
(`src/utils/journalChain.ts`). Falls wir zwischenzeitlich Daten
anonymisiert oder gelöscht haben, muss das Ergebnis weiterhin:
1) **technisch verifizierbar** sein (Hashes stimmen), und
2) **sachlich nachvollziehbar** sein (welche Buchung wird repräsentiert).
Hier wird die Design-Entscheidung geprüft: wie erkennt der Prüfer, dass
eine nachträgliche Maßnahme die Prüfbarkeit nicht kompromittiert?

### 1.3 Betroffene Tabellen (aktueller Stand)

Alle Pfade relativ zu `D:/harouda-app/`.

| Tabelle | Chain-Mechanismus | Hashed-Felder (PII-Relevanz) | Migration |
|---|---|---|---|
| `audit_log` | `prev_hash` + `entry_hash` über kanonisches JSON | **ganze Zeile** — enthält ggf. Namen in `summary`, E-Mails in `actor` | 0003_audit_hash_chain.sql |
| `journal_entries` | `prev_hash` + `entry_hash` über Pipe-Format | `datum \| beleg_nr \| soll_konto \| haben_konto \| betrag \| `**`beschreibung`**` \| parent_entry_id` — `beschreibung` ist das PII-Risiko (z.B. "Rechnung Müller GmbH, Hans-Meier-Str.") | 0010_journal_hash_chain.sql |
| `lohnabrechnungen_archiv` | Per-Row-Hash via `computeAbrechnungHash` (keine Kette, aber `locked_at`) | kanonisches JSON über **alle** Felder inkl. Name, SV-Nr., Gehalt | 0020_lohn_persistence.sql + 0021_gobd_festschreibung.sql |
| `belege` | Keine Hash-Kette; Immutability-Trigger auf `status='GEBUCHT'` | `belegnummer`, `partner_name`, `partner_ustid`, `partner_adresse` — alles mutabel bis `GEBUCHT` | 0022_belege_persistence.sql |

Wichtige Beobachtung: **`journal_entries.beschreibung` ist das
kritischste Einzelfeld**, weil (a) freitextig, (b) hashed, (c) in der
Praxis häufig PII enthält. Eine Lösung, die dieses Feld nicht adressiert,
löst das Problem nicht.

---

## 2. Vier Optionen

### 2.1 Option A — Crypto-Shredding (PPEK je Betroffenen)

**Technisches Prinzip.** Jedem Betroffenen (Mandant, Mitarbeiter) wird
ein individueller Schlüssel (Per-Person-Encryption-Key, PPEK) in einem
KMS zugeordnet. Alle PII-Felder in Tabellen mit Hash-Kette werden
envelope-verschlüsselt mit dem PPEK geschrieben; Hashes werden über den
**Ciphertext** gebildet. Löschung nach Art. 17 = Zerstörung des PPEK
im KMS; Ciphertext bleibt bestehen, Klartext wird informations-
theoretisch unwiederherstellbar.

**Aufwand.** 3-4 Sprints minimum. Infrastruktur: KMS (Supabase Vault
oder externer Anbieter mit AVV), Key-Derivation-Scheme, Envelope-
Encryption-Layer in jedem Repository, Key-Rotation-Policy,
Schlüssel-Backup + Recovery-Verfahren. Migration existierender Daten:
alle PII-Felder neu verschlüsseln, Hashes neu berechnen — effektiv
Chain-Rebuild, mit entsprechender Rechts-Dokumentation warum die
Neu-Hashes gleichwertig sind.

**GoBD-Konformität (Einschätzung).** Grundsätzlich plausibel, weil die
gespeicherten Bytes unverändert bleiben (hashed bleibt hashed); aber
*[Rechts-Review/StB: Betriebsprüfer erwartet Klartext-Einsicht während
der Aufbewahrungsfrist. Crypto-Shredding DARF erst nach Fristablauf
erfolgen — sonst droht Verstoß gegen § 147 AO. Ist das technisch
garantierbar, bevor das Löschsystem freigegeben wird?]*

**DSGVO-Konformität (Einschätzung).** *[Rechts-Review/DSB: In der
Fach-Literatur wird Crypto-Shredding verbreitet als zulässige Löschung
i.S.v. Art. 17 angesehen, weil Daten "nicht mehr verarbeitbar" sind.
Aufsichtsbehördliche Bestätigung (z.B. BfDI-Handreichung) vor
Produktivgang einholen. Offen: Reicht eine 256-bit AES-GCM-
Schlüssel-Löschung, oder braucht es mehrfache Schlüssel-Überschreibung
mit Audit-Protokoll?]*

**Auswirkung auf bestehende Audit-Log-Architektur.** Gering, solange
Hashes über Ciphertext gebildet werden. Verifikation der Kette bleibt
unverändert. Nachteil: Audit-Log-Einsicht für Admins erfordert KMS-
Zugriff.

**Performance.** AES-GCM im Browser ca. 30-100 MB/s via WebCrypto;
Overhead pro Buchungs-Read ~0.5-1 ms. Bei 10.000 Buchungen pro
Mandant: vernachlässigbar. Kritisch: Bulk-Operationen (Jahresbilanz,
Z3-Export) entschlüsseln Hunderttausende Zeilen — dann relevant.

**Migration-Risiko.** HOCH. Fehler im KMS-Setup (verlorene Schlüssel,
vergessene Replikation) führen zu unwiederbringlichem Datenverlust —
nicht nur für Art. 17-Fälle, sondern für den gesamten Mandanten.
Einmal verlorener PPEK ist nicht wiederherstellbar. Deshalb:
Schlüssel-Backup (Shamir-Secret-Sharing, Off-Site, AVV'd) bevor das
System live geht.

### 2.2 Option B — Tombstone-Löschung mit NULL-Maskierung

**Technisches Prinzip.** Bei Löschanfrage wird keine Zeile verändert.
Stattdessen wird ein Tombstone-Eintrag in ein append-only Protokoll
(`pii_erasures`) geschrieben: *"PII von Mandant/Mitarbeiter X in
Zeilen {a,b,c} erasure-angefordert am Datum Y durch Z"*. In der
Darstellung (Reports, UI, Z3-Export, DATEV-Export) maskiert die
Anwendungsschicht die betroffenen Felder nach Lookup gegen dieses
Protokoll.

**Aufwand.** 1-2 Sprints. Neue Tabelle `pii_erasures`, Lookup-Layer in
allen Ausgabepfaden (Reports, Exporte, API), UI-Maskierung.

**GoBD-Konformität.** Hash-Kette bleibt unberührt (Bytes unverändert).
*[Rechts-Review/StB: Betriebsprüfer sieht maskierte Felder; bei
Nachfrage kann er die Original-Daten angezeigt bekommen. Genügt das
dem Prüfungsanspruch? Wahrscheinlich ja, solange das Maskieren
reversibel ist auf Prüfer-Rolle.]*

**DSGVO-Konformität.** *[Rechts-Review/DSB: **Das ist der kritische
Punkt dieser Option.** Art. 17 verlangt "Löschung", nicht
"Pseudonymisierung" (Art. 4 Nr. 5 ist ein eigenes Konzept). Die Daten
sind weiterhin auf der Platte, in Backups, in Logs. Ein kompromittierter
Admin-Zugang kann sie weiterhin einsehen. **Voraussichtliche
DSB-Einschätzung: NICHT ausreichend für Art. 17, nur für
Art. 21 (Widerspruch) + Pseudonymisierung.** Bestätigung notwendig.]*

**Auswirkung auf bestehende Architektur.** Minimal. Kein Change an
`journal_entries` oder `audit_log`. Alle Ausgabepfade müssen mit dem
Masking-Layer versehen werden (breiter Footprint, aber mechanisch).

**Performance.** Jede Ausgabe ein zusätzlicher Lookup. Cache-bar, aber
Komplexität steigt. Bei 100.000 Buchungen Ausgabe + 1.000 Tombstones
muss die Cross-Reference effizient sein (Index auf `entity_id` + Spalte).

**Migration-Risiko.** Niedrig für die DB. Hoch für den Ausgabepfad-
Check: **jede** existierende Ausgabe (PDF-Generation, DATEV-Export,
Z3-Export, Reports, API-Antworten) muss erweitert werden; vergessene
Pfade leaken Original-PII.

**Einschätzung dieser Option.** Technisch einfach, rechtlich
wahrscheinlich unzureichend. Als **alleinige** Lösung für Art. 17
nicht empfohlen. Als Audit-/Metadaten-Ergänzung zu einer anderen
Option sehr sinnvoll (siehe §3 Kombinationen).

### 2.3 Option C — PII-Split (Split-Schema)

**Technisches Prinzip.** Schema-Refactor: Tabellen mit Hash-Kette
werden in zwei Tabellen aufgeteilt:
- `*_core` — enthält nur Nicht-PII-Felder plus FK; Hash-Kette bleibt
  hier und bildet nur Nicht-PII ab.
- `*_pii` — enthält alle personenbezogenen Freitext-/Stammfelder;
  **nicht** in der Hash-Kette; mutabel/löschbar.

Löschung nach Art. 17 = DELETE aus `*_pii`. `*_core` bleibt unverändert,
Hash-Kette bleibt verifizierbar, die Buchung ist weiterhin als
"Buchung vom Datum X über Betrag Y zwischen Konten S/H" auslesbar,
nur die Freitext-Beschreibung + Partner-Daten fehlen.

Skizze (nur zur Illustration):

```
create table journal_entries_core (
  id uuid primary key,
  datum date not null,
  beleg_nr text not null,
  soll_konto text not null,
  haben_konto text not null,
  betrag numeric(15,2) not null,
  parent_entry_id uuid,
  prev_hash text,
  entry_hash text    -- SHA-256 über Pipe-Format OHNE beschreibung
);

create table journal_entries_pii (
  entry_id uuid primary key references journal_entries_core(id),
  beschreibung text,       -- mutabel/löschbar
  gegenseite text,         -- mutabel/löschbar
  partner_ustid text       -- mutabel/löschbar
);
```

**Aufwand.** 3 Sprints. Schema-Migration für alle 3 hash-behafteten
Tabellen (`audit_log`, `journal_entries`, `lohnabrechnungen_archiv`),
Anpassung aller Repositories + Views + Exporte, Tests migrieren.

**GoBD-Konformität.** Hash-Kette bleibt intakt. *[Rechts-Review/StB:
**Kritische Frage** — fordert § 146 AO, dass die "Buchung" als
**Ganzes** unverändert bleibt, oder ist eine strukturelle Trennung von
Anfang an zulässig? Eine GoBD-konforme Buchung braucht u.a. einen
"Buchungstext, der die Geschäftsvorfälle verständlich macht"
(GoBD-Rz. 99-102). Wenn der Buchungstext in `*_pii` sitzt und nach
Fristablauf gelöscht wird, ist die Buchung dann rückwirkend nicht mehr
GoBD-konform, war sie aber zu Entstehungszeitpunkt? Das ist m.E. die
wichtigste offene Rechtsfrage.]*

**DSGVO-Konformität.** *[Rechts-Review/DSB: Wahrscheinlich die
sauberste Option — echte physische Löschung der PII-Zeile, Hash-Kette
der Nicht-PII bleibt erhalten als eigenständige Aufzeichnung.
Bestätigung einholen.]*

**Auswirkung auf bestehende Architektur.** Hoch — alle Lese- und
Schreibpfade ändern sich. Views können helfen, den JOIN zu verbergen,
aber jede Materialisierung (Report, Export) muss bewusst über PII-
Verfügbarkeit entscheiden.

**Performance.** JOIN auf jeder Auslese der Buchung. Postgres macht
das mit Hash-Join auf PK sehr effizient, aber es ist merklich
komplexer als heute. Indexierung + View-Definition entscheidend.

**Migration-Risiko.** Mittel-Hoch. Schema-Migration berührt Produktiv-
Tabellen. Test-Migration-Strategie: neue Tabellen parallel anlegen,
Daten kopieren (PII in `*_pii`, Rest in `*_core`), Hashes neu
berechnen (nur Nicht-PII), Vergleich alte vs. neue Hashes, dann
Umschaltung. Mindestens zwei Wochen Parallelbetrieb mit Cross-Check.

### 2.4 Option D — Merkle Re-Root nach Löschung

**Technisches Prinzip.** Die lineare Hash-Kette wird durch einen
Merkle-Baum ersetzt. Jede "Epoche" (z.B. Kalendermonat) hat eine
Wurzel; bei Löschung eines Blatts wird die Wurzel für diese Epoche
neu berechnet und die alte Wurzel mit Timestamp in ein Append-Only-
Register abgelegt. Prüfer verifiziert eine Buchung über Pfad-Beweis
zur aktuellen Wurzel; erkennt er eine alte Wurzel in seinem Besitz,
die nicht mehr passt, sieht er im Register, wann und warum re-rooted
wurde.

**Aufwand.** 2-3 Sprints. Migrations-Tool (lineare Kette → Baum),
neue Verifikations-Library (Merkle-Proofs), Anpassung in `journalChain.ts`
und im Prüfer-Workflow (Z3-Export müsste Merkle-Proofs statt Chain-
Positions ausweisen).

**GoBD-Konformität.** *[Rechts-Review/StB: **Hoch-riskant.** Die GoBD
erkennen Hash-Verfahren an; Merkle-Bäume sind formal auch Hash-
Verfahren, aber die Re-Root-Operation IST eine nachträgliche
Veränderung der Aufzeichnung. Ob die begleitende Dokumentation der
alten Wurzel als "Protokollierung der Änderung" akzeptiert wird, ist
unklar. Wahrscheinlich ist eine GoBD-konforme Re-Root-Implementierung
machbar, aber sie braucht aktive Absprache mit einem Prüfer und/oder
IDW-Bestätigung vor Produktivgang.]*

**DSGVO-Konformität.** Gut — erlaubt tatsächliche Löschung und
liefert gleichzeitig ein Audit-Artefakt (der Re-Root-Beweis
dokumentiert Zeitpunkt + Umfang).

**Auswirkung auf bestehende Architektur.** Hoch. `journalChain.ts`
würde komplett neu geschrieben; `journal_entries_compute_hash` wäre
obsolet; der Prüfer-Workflow müsste Merkle-Beweise bauen können.

**Performance.** Mutation (INSERT neuer Buchung) geht von O(1) auf
O(log n) Hash-Updates. Verifikation geht von O(n) linearen Scans auf
O(log n) Merkle-Proof. Netto-Performance ist besser; Komplexität
höher.

**Migration-Risiko.** SEHR HOCH. Einmaliger Umbau der Kernstruktur;
Fehler in der Migration bedeuten verlorene GoBD-Nachweisbarkeit für
alle historischen Daten.

---

## 3. Kombinationsmöglichkeiten

Die Optionen sind nicht orthogonal. Sinnvolle Kombinationen:

**K1 — C + B (PII-Split + Tombstone-Protokoll):** Löschung passiert
physisch in `*_pii`; ein parallel geführtes `pii_erasures`-Register
dokumentiert Zeitpunkt, Anlass, Umfang jeder Löschung für Audit/Prüfer.
Das Tombstone-Register ist Metadaten über die Löschung, nicht die
Löschung selbst. **Wahrscheinlich beste Lösung**, wenn man die
GoBD-Risiko-Frage von Option C (§1.3) positiv beantworten kann.

**K2 — A + C (Crypto-Shredding auf `*_pii`):** Split-Schema plus
Verschlüsselung der PII-Seite. Doppelte Sicherheit: Schlüssel-Destruktion
UND physische Löschung möglich. Extrem teuer, nur angemessen bei
besonders sensiblen Daten (Gesundheitsdaten, Sozialdaten).

**K3 — A + B:** Crypto-Shredding plus Tombstone-Protokoll. Tombstone
dokumentiert "wann wurde welcher Schlüssel destrudiert", das eigentliche
Löschen leistet die Schlüssel-Zerstörung. Technisch kohärent, aber
keine echte Vereinfachung gegenüber A allein.

**K4 — C + D:** Theoretisch möglich, aber unnötig. Split-Schema macht
D überflüssig.

### Empfohlene Kombinationsrichtung

**K1 (C + B)**, sofern die GoBD-Frage zu Option C positiv beschieden
wird. Sonst Rückfallstrategie **A + B**. Begründung in §5.

---

## 4. Entscheidungsmatrix

Bewertung qualitativ: ++ sehr gut / + gut / o neutral / − schlecht /
−− sehr schlecht. *[Rechts-Review-Spalten sind vorläufig, basierend auf
meinem technischen Verständnis + Sekundärliteratur.]*

| Kriterium | A · Crypto-Shred | B · Tombstone | C · PII-Split | D · Merkle |
|---|---|---|---|---|
| GoBD-Konformität *[Rechts-Review/StB]* | + | ++ | + | − |
| DSGVO-Art.17-Konformität *[Rechts-Review/DSB]* | + | −− | ++ | + |
| Implementierungsaufwand | −− (3-4 Sp.) | + (1-2 Sp.) | − (3 Sp.) | − (2-3 Sp.) |
| Performance (Read) | − | o | − | + |
| Performance (Write) | − | ++ | + | o |
| Migration-Risiko | − | + | o | −− |
| Nachvollziehbarkeit für Prüfer | o | ++ | + | − |
| Reversibilität bei Implementierungsfehler | −− | ++ | o | −− |
| Bewährtheit in der Rechtsprechung | o | + | + | − |
| Operative Komplexität (Key-Management) | −− | ++ | + | o |

Kurz-Interpretation:
- B gewinnt fast alle technischen Kriterien, **verliert aber das
  entscheidende rechtliche** (Art. 17).
- C hat das beste DSGVO-Profil und akzeptable GoBD-Aussichten; Aufwand
  beherrschbar.
- A ist stark bei DSGVO, aber sehr riskant operationell (Keys).
- D ist elegant, aber in der GoBD-Welt ungetestet.

---

## 5. Empfehlung

**Primärempfehlung: K1 — Option C (PII-Split) + Option B als
begleitendes Protokoll (`pii_erasures`).**

Begründung:
1. Saubere technische Semantik — physische Löschung der PII-Zeile
   ist eindeutige Erfüllung von Art. 17.
2. Hash-Kette der Buchungs-/Audit-Daten bleibt unangetastet;
   `journal_entries_core` und `audit_log_core` sind weiterhin GoBD-
   konform prüfbar.
3. `pii_erasures` gibt Prüfern und DSB ein gemeinsames Audit-
   Artefakt: was wurde wann warum gelöscht.
4. Aufwand bleibt in einem einzelnen Major-Sprint (3 Wochen effektiv
   mit Migration); keine neue Infrastruktur (KMS).
5. Reversibilität: Fehler in der Migration sind erkennbar, weil
   alte vs. neue Hashes parallel beibehalten werden können während
   des Umbaus.

**Explizit vorbehaltlich:**
- **Fachanwalt für Steuerrecht** bestätigt, dass eine GoBD-konforme
  Buchung den Buchungstext nicht zwingend **dauerhaft** beinhalten
  muss, solange dieser zum Entstehungszeitpunkt vorlag und die
  Aufbewahrungsfrist eingehalten wird. Siehe Frage Q1 in §6.
- **Datenschutzbeauftragte:r** bestätigt, dass das Modell die
  Anforderungen aus Art. 17 + Art. 5 Abs. 1 lit. e (Storage-
  Limitation) erfüllt. Siehe Fragen Q3, Q4.

**Rückfallstrategie** (falls GoBD-Prüfung negativ): Option A
(Crypto-Shredding) + B. Teurer, aber umgeht die "die Buchung als
Ganzes"-Frage, weil der Ciphertext technisch "unverändert" bleibt.

**Abgelehnt:** B als Alleinlösung (nicht Art. 17-konform). D allein
(GoBD-Risiko zu hoch für ein Prototyp-Projekt).

---

## 6. Offene Rechtsfragen

Folgende Fragen müssen vor Implementierung extern beantwortet werden.
Jede Frage ist so formuliert, dass sie ohne Technik-Kontext vom
Fachanwalt bearbeitet werden kann; nötige Hintergründe stehen in
Klammern.

**Q1 [Fachanwalt Steuerrecht / IDW].** Darf eine Buchung im Sinne von
§ 146 Abs. 4 AO in zwei technisch getrennte Datensätze aufgespalten
werden — einen unveränderlichen Rechen-Kern (Datum, Konten, Betrag)
und einen trennbaren Stamm-/Text-Teil (Buchungstext, Gegenpartei) —
sofern die Verbindung zum Entstehungszeitpunkt lückenlos dokumentiert
war? Hintergrund: Wir möchten den Text-Teil nach Fristablauf DSGVO-
konform löschen, ohne die GoBD-Unveränderbarkeit des Rechen-Teils zu
berühren. GoBD-Rz. 99-102 nennen den "Buchungstext" als Bestandteil
der ordnungsgemäßen Buchung — offen ist, ob das eine Struktur-
Forderung ist oder nur eine Inhalts-Forderung zum Entstehungszeitpunkt.

**Q2 [Fachanwalt Steuerrecht].** Wie sind die Aufbewahrungsfristen
für Lohnabrechnungsunterlagen mit den Anforderungen aus § 41 EStG,
§ 41a EStG und der LStDV abzugleichen? Der Codebase-Stand
(`src/data/retention.ts`) enthält 10-/8-/6-Jahres-Regeln für
Buchhaltungsunterlagen; Lohnunterlagen sind nicht explizit gepflegt.
Welche konkreten Fristen gelten für `lohnabrechnungen_archiv` und
`employees`?

**Q3 [Datenschutzbeauftragte:r].** Erfüllt Crypto-Shredding (Zerstörung
des Entschlüsselungsschlüssels bei Erhalt des Ciphertexts) die
Anforderungen von Art. 17 DSGVO? Gibt es eine positive
Aufsichtsbehörden-Äußerung (BfDI, LfDI), die wir als Entscheidungs-
Grundlage heranziehen können? Welche Schlüssel-Destruktions-Verfahren
werden als "wirksam" anerkannt (einmaliges Löschen vs. mehrfaches
Überschreiben vs. HSM-gebundene Schlüssel)?

**Q4 [Datenschutzbeauftragte:r].** Wie ist bei aktiver Löschanfrage
(Art. 17) während laufender AO-Aufbewahrungsfrist mit Art. 12 Abs. 4
DSGVO umzugehen? Unsere Annahme: Ablehnung der sofortigen Löschung
unter Nennung der Rechtsgrundlage (§ 147 AO) und konkretem
Löschdatum nach Fristablauf, plus Hinweis auf Beschwerderecht
(Art. 77). Ist das ausreichend dokumentiert durch die geplante
Tabelle `privacy_requests` (Migration 0023)?

**Q5 [Fachanwalt Steuerrecht].** Bei Mandanten-Kündigung: Darf die
Aufbewahrung aller Buchhaltungsdaten unabhängig von der Kündigung
bis Fristablauf fortgesetzt werden (d.h. greift § 147 AO noch
während der Steuerberater die Daten nicht mehr aktiv verarbeitet,
sondern nur archiviert)? Einschätzung: ja, weil die Pflicht an die
Belege/Aufzeichnungen gebunden ist, nicht an das Mandantenverhältnis.
Bestätigung nötig.

**Q6 [DSB + StB gemeinsam].** Welche minimale Datenmenge muss
einem Betriebsprüfer nach Z3-Export (§ 147 Abs. 6 AO) weiterhin
zugänglich sein, nachdem eine PII-Löschung nach Fristablauf
stattgefunden hat? Reicht ein vollständiger `journal_entries_core`
(Datum, Beleg-Nr., Konten, Betrag, Hash-Kette) ohne `beschreibung`
aus, oder muss die Prüfung den Buchungstext rückwirkend
rekonstruieren können? Hintergrund: Betriebsprüfung findet oft
Jahre nach der Buchung statt, nicht Jahre nach Fristablauf.

**Q7 [DSB].** In welchem Format und mit welcher Aufbewahrungsdauer
muss das `pii_erasures`-Register selbst geführt werden? Das Register
enthält Betroffenen-Identifikatoren und damit selbst wieder PII —
löscht es sich irgendwann selbst, oder fällt es unter Art. 5 Abs. 2
(Rechenschaftspflicht)?

**Q8 [Fachanwalt Steuerrecht / IDW].** Falls Option D (Merkle
Re-Root) technisch verfolgt würde: Gilt eine Re-Root-Operation
mit dokumentiertem Alt-Root als "Veränderung mit protokollierter
Rückverfolgbarkeit" i.S.v. § 146 Abs. 4 Satz 2 AO? Oder ist die
Re-Root als solche bereits die Veränderung, die § 146 verbietet?

---

## 7. Nächste Schritte (technisch, nach Rechtsfreigabe)

Reihenfolge nach angenommener Empfehlung K1 (C + B). Falls
Rückfallstrategie A+B gewählt wird, sind Schritte §7.2-§7.4 anders
strukturiert; §7.5 (Tests) und §7.6 (Rollout) bleiben gleich.

### 7.1 Vorbedingung — rechtliche Freigabe

Nicht vor schriftlicher Stellungnahme zu Q1, Q3, Q4, Q6 beginnen.

### 7.2 Neue Migration 0024

- `journal_entries_pii` (PII-Felder aus `journal_entries`)
- `audit_log_pii` (PII-Felder aus `audit_log` — strukturell, weil
  `audit_log` JSON-basiert ist; evtl. ein dedizierter
  `sensitive_fields jsonb`)
- `lohnabrechnungen_archiv_pii`
- `pii_erasures` (Tombstone-Register)

Schema-Draft unter Berücksichtigung der Antworten aus §6.

### 7.3 Hash-Neu-Berechnung

`journal_entries_compute_hash` muss um `beschreibung` und
`parent_entry_id` gekürzt werden. Alle existierenden Hashes müssen
neu berechnet und als zweite Spalte `entry_hash_v2` parallel
aufgebaut werden. Vergleichsbetrieb: `v2 ≡ v1` mit ausgeblendeten
PII-Feldern für eine Baseline-Validierung.

### 7.4 Repository-Anpassung

Jedes Repo, das heute `journal_entries` schreibt oder liest (`journal.ts`,
`audit.ts`, `auditLogRepo.ts`, `journalRepo.ts`), wird auf das neue
Split-Schema angepasst. Dual-Mode-Semantik (localStorage vs. Supabase)
muss beibehalten werden.

### 7.5 Test-Migrations-Strategie für die bestehenden 727 Tests

- Die reine Logik in `src/domain/` ist überwiegend PII-agnostisch,
  sollte unverändert grün bleiben.
- Tests in `src/lib/db/__tests__/` und API-Layer-Tests müssen für
  Split-Schema angepasst werden — Schätzung 30-50 Tests.
- Neue Tests (~15-20):
  - Löschung aus `*_pii` bricht `entry_hash` nicht
  - `pii_erasures`-Eintrag wird für jede Löschung erzeugt
  - UI-Masking greift auch dann, wenn `*_pii`-Zeile fehlt
  - Z3-Export toleriert fehlende PII-Zeilen (zeigt "Gelöscht
    am YYYY-MM-DD"-Platzhalter)
  - Hash-Kette bleibt über Löschung hinweg verifizierbar
  - `canDelete()` in `src/data/retention.ts` wird bei Art. 17-
    Anfragen korrekt aufgerufen
- Bestehender Regressionstest für `CookieConsent` bleibt unbeeinflusst.

### 7.6 Rollout-Strategie

1. Migration in Staging; Parallel-Betrieb `v1`/`v2` Hashes für 2 Wochen.
2. Z3-Export-Dry-Run mit simulierten Prüfer-Fragen; Feedback eines
   realen StB einholen.
3. DSB-Freigabe der `pii_erasures`-Semantik.
4. Produktion: Migration in Wartungsfenster; eine Woche lang
   doppelter Eintrag in `pii_erasures` + Legacy-NULL-Pfad (aus
   Option B) als Belt-and-Suspenders.
5. Nach 4 Wochen stabilen Betriebs: Legacy-Pfad entfernen,
   `entry_hash_v1` archivieren.

### 7.7 Dokumentations-Artefakte

- Update `docs/COMPLIANCE-GUIDE.md` mit neuer DSGVO-Art.-17-Sektion
- Update `docs/ARCHITECTURE.md` mit "Decision 10: PII-Split"
- Update `CLAUDE.md §10` mit geschlossenem Art.-17-Punkt
- Update `docs/ROADMAP.md` mit tatsächlich geschlossenen P1-Items

---

## 8. Quellen und Verweise

Nicht alle hier genannten Dokumente sind im Projekt vorhanden; sie
sind als Anker für die juristische Recherche genannt.

- **Abgabenordnung (AO)** — insbesondere § 146 Abs. 1-4 (Ordnungs-
  vorschriften), § 147 (Aufbewahrungsfristen, seit 2025 § 147 Abs. 3
  n.F. mit 8-Jahres-Regel).
- **BMF-Schreiben vom 28.11.2019** — "Grundsätze zur ordnungsmäßigen
  Führung und Aufbewahrung von Büchern, Aufzeichnungen und Unterlagen
  in elektronischer Form sowie zum Datenzugriff (GoBD)". Randziffern
  99-102 (Buchungstext), 107 ff. (Unveränderbarkeit), 153-154
  (Hash-Verfahren).
- **DSGVO (Verordnung (EU) 2016/679)** — Art. 5, 12, 17, 21, 77, 83.
- **BDSG-neu (2018)** — Umsetzungsregelungen, insb. § 35 (Löschung).
- **DSK-Kurzpapier Nr. 11** — "Recht auf Löschung / Recht auf
  Vergessenwerden" (Konferenz der unabhängigen
  Datenschutzaufsichtsbehörden des Bundes und der Länder).
- **BfDI-Handreichungen / Orientierungshilfen** — zu
  pseudonymisierender Verarbeitung und Crypto-Shredding. *[konkrete
  Dokumente beim BfDI zu recherchieren]*
- **IDW PS 880** — "Die Prüfung von Softwareprodukten". Relevant für
  Einschätzung, welches Vorgehen "marktüblich prüffähig" ist.
- **§ 41, § 41a EStG + LStDV** — Lohnunterlagen-Aufbewahrung
  (spezifisch zu Q2).
- **Wachstumschancengesetz 2025** — Herkunft der 8-Jahres-Frist
  für Buchungsbelege.
- **Projekt-interne Referenzen:**
  `supabase/migrations/0003_audit_hash_chain.sql`,
  `supabase/migrations/0010_journal_hash_chain.sql`,
  `supabase/migrations/0021_gobd_festschreibung.sql`,
  `src/utils/journalChain.ts`,
  `src/lib/crypto/payrollHash.ts`,
  `src/data/retention.ts`,
  `docs/COMPLIANCE-GUIDE.md`.

---

*Ende des Design-Dokuments. Nächster Schritt: schriftliche Vorlage
Q1-Q8 an Fachanwalt + DSB; Implementierung setzt ein, wenn deren
Antworten die Empfehlung in §5 bestätigen oder modifizieren.*
