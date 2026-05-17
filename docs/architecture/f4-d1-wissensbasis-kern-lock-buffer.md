# F4-D1 Wissensbasis-Kern — Architecture Lock Buffer

## Dokumentstatus

- **Charakter:** Lock-Buffer / Persistenzanker, kein V1.0-Artefakt.
- **Quelle:** Gespraechs-Locks und Recovery-Entscheidungen bis Frage 4.B v0.2.1.
- **Scope:** F4-D1 Wissensbasis-Kern, Fragen 1 bis 9.
- **Nicht enthalten:** Implementierung, Migration, Schema, Service, UI, F-Register-Eintrag.

Dieser Lock-Buffer persistiert die in der Konversation gelockten Architektur-Entscheidungen zum F4-D1 Wissensbasis-Kern in der Form, in der sie vor dem Beginn der S6-Final-Konsolidierung als belastbar gelten. Er ersetzt nicht das spaeter zu erstellende V1.0-Artefakt und nicht die Spiegel-Eintragung im F-Register; er dient ausschliesslich der Sicherung der Lock-Wordings. Aus diesem Dokument leiten sich weder Schema, noch Migration, noch Service-, Engine- oder UI-Vorgaben ab.

## 1. Gesamtstatus

| Frage | Thema | Lock-Status |
|---|---|---|
| 1 | Natur der Wissensbasis | (gelockt) — als final nutzbar freigegeben |
| 2 | Verhaeltnis Wissensbasis und Glossary | (gelockt) — als final nutzbar freigegeben |
| 3 | Rule-ID-Schema | (gelockt) — als final nutzbar freigegeben |
| 4.A | Quellenmodell / Quellenhierarchie | (gelockt) — als final nutzbar freigegeben |
| 4.B | Konfliktmodell | v0.2.1 Re-Lock nach Recovery, gelockt in conversation |
| 5 | Temporales Modell der Wissensbasis | v0.2-final |
| 6 | Lifecycle einer Rule-Version | v0.2-final |
| 7 | Approval-Modell | v0.2-final |
| 8 | UI-Scope Phase 1 | v0.2-final |
| 9 | Initial Structural Scope | v0.2-final |

S6-Final-Vorbereitung: 10/10 ready.

Die Repo-Persistierung dieses Dokuments dient nur der Sicherung der Lock-Wordings. Sie ist keine F-Register-Schreibung, kein V1.0-Artefakt und keine Implementation-Spec.

## 2. Frage 1 — Natur der Wissensbasis

### Frage 1 — Natur der Wissensbasis (gelockt)

Wissensbasis ist Haroudas interne, versionierte und quellengebundene Referenzschicht fuer fachliche Regeln, strukturierte Regelparameter, Quellenbezuege und erklaerende Begruendungen. Sie ist keine ausfuehrende Rule-Engine und trifft keine operative Buchungs-, Steuer- oder Loeschentscheidung selbst. Operative Entscheidungen verbleiben in den jeweiligen Domain-Services. Jede Rule benoetigt mindestens eine Quelle; fachlich-rechtliche Rules benoetigen offizielle oder nachvollziehbar abgeleitete Quellen. Aenderungen werden ueber immutable Versionen derselben Rule-Identitaet abgebildet.

**Sub-Entscheidungen:**

- 1.1 hybrid mit strikter Einschraenkung (strukturierte Parameter erlaubt, operative Entscheidung verboten)
- 1.2 Quellen-Pflicht mit drei Quellen-Typen: `official_source`, `internal_policy`, `derived_interpretation`
- 1.3 Versions-Modell: neue immutable Version derselben Rule-ID, FEST-Versionen nicht ueberschreibbar, neue Rule-ID nur bei neuem fachlichen Regelkonzept

## 3. Frage 2 — Verhaeltnis Wissensbasis und Glossary

### Frage 2 — Verhaeltnis Wissensbasis und Glossary (gelockt)

Glossary und Wissensbasis sind zwei komplementaere Schichten mit klar getrennter Verantwortung. Glossary erklaert Begriffe: Definition, Bedeutung, Code-Verwendung und Abgrenzung. Wissensbasis modelliert fachliche Regeln: strukturierte Parameter, Quellen, Gueltigkeit und Versionen. Inhaltliche Beruehrungspunkte sind zulaessig, aber die Autoritaet ist getrennt: Bei begrifflicher Mehrdeutigkeit ist Glossary autoritativ; bei operativen Werten, Schwellen, Fristen, Gueltigkeitszeitraeumen und strukturierten Quellenreferenzen ist Wissensbasis autoritativ. Wissensbasis-Rules muessen relevante Glossary-Begriffe referenzieren, sofern solche Begriffe existieren. Glossary-Eintraege duerfen Wissensbasis-Rules referenzieren, muessen dies aber nicht. Beide Schichten haben getrennten, kompatiblen Lifecycle: Glossary-Aenderungen erfolgen ueber Batch-Approval und Git-History; Wissensbasis-Aenderungen erfolgen ueber neue immutable Versionen derselben Rule-Identitaet. Werte duerfen im Glossary erlaeuternd erscheinen, duerfen aber nicht als operative Source of Truth fuer Services verwendet werden.

**Schluesselbeispiel:** Kleinunternehmer-Schwellenwerte erscheinen im Glossary als erlaeuternde Tabelle, aber die operative Source of Truth fuer Services wird `RULE-...-...-001` in der Wissensbasis sein (Domain/Topic noch nicht festgelegt, siehe Frage 3).

## 4. Frage 3 — Rule-ID-Schema

### Frage 3 — Rule-ID-Schema (gelockt)

Wissensbasis-Rules verwenden stabile fachliche Identitaeten im Format `RULE-<DOMAIN>-<TOPIC>-<NNN>`. Die Rule-ID identifiziert das fachliche Regelkonzept, nicht eine einzelne Version. `DOMAIN` und `TOPIC` sind kontrollierte, kurze fachliche Codes. Sie duerfen nicht aus gemischten Taxonomie-Achsen gebildet werden; insbesondere duerfen Steuerart, Pflichtart und Regelwerk nicht unkontrolliert auf derselben Code-Ebene vermischt werden. Die initiale Liste erlaubter Domain- und Topic-Codes wird erst mit dem konkreten Initial-Rule-Scope in Frage 9 festgelegt. Aenderungen an Inhalt, Quelle, Parametern oder Gueltigkeit werden ueber neue immutable Versionen derselben Rule-ID abgebildet. Nach FEST darf eine Rule-ID nicht umgedeutet, wiederverwendet oder neu nummeriert werden. Lifecycle-Zustaende wie `superseded` oder `revoked` sind keine Bestandteile der ID, sondern werden als Metadaten modelliert.

**Sub-Entscheidungen:**

- 3.1 Format: `RULE-<DOMAIN>-<TOPIC>-<NNN>`
- 3.2 Domain-Codes: Deferred Decision in Frage 9 (nur Governance-Regel jetzt gelockt: keine gemischten Taxonomie-Achsen)
- 3.3 Topic-Codes: Deferred Decision in Frage 9 (nur Governance-Regel jetzt gelockt)
- 3.4 Numbering: 3 Stellen, 001 bis 999 (groesser 999 = Topic falsch geschnitten)
- 3.5 Immutability nach FEST: keine Wiederverwendung, keine Neudeutung, keine Umnummerierung
- 3.6 `superseded` und `revoked` sind Metadaten, keine ID-Bestandteile

**Forward-Link:** Frage 9 traegt zusaetzliche Last (initiale Domain- und Topic-Liste). Erwartet, akzeptiert, dokumentiert.

## 5. Frage 4.A — Quellenmodell / Quellenhierarchie

### Frage 4.A — Quellenhierarchie, Bindungswirkung, Kontextachse (gelockt)

Wissensbasis modelliert Quellen nicht ueber einen linearen Rang, sondern ueber ein mehrachsiges Beschreibungsmodell. Jeder Quelleneintrag traegt mindestens die Achsen `source_axis` (Welt der Quelle), `source_kind` (konkrete Art innerhalb der Achse), `authority_level` (Charakter der Bindung) und `binding_scope` (Reichweite der Bindung). Innerhalb einer konkreten Rule wird jede Quelle zusaetzlich durch `relevance_role` charakterisiert, die ihre Funktion in der Rule beschreibt.

Zulaessige Quellachsen auf Architekturebene sind mindestens `official`, `internal`, `derived` und `literatur`. `official` umfasst rechtliche, verwaltungsbezogene und gerichtliche Quellen. `internal` umfasst bewusst interne Organisations- oder Kanzlei-/Produktentscheidungen ohne eigene rechtliche Autoritaet. `derived` umfasst interne Ableitungen oder Interpretationen aus vorhandenen Quellen. `literatur` umfasst externe Fachliteratur, Kommentare und Fachaufsaetze.

Es existiert kein numerischer `source_rank`; eine arithmetische Konfliktaufloesung ist ausgeschlossen, weil Quellenkonflikte kontextabhaengig sind. Domain-Services treffen keine eigene Auswahl zwischen widerspruechlichen Quellen; sie vollziehen nur das in der jeweils gueltigen, freigegebenen Rule-Version festgelegte Verhalten.

Fuer fachlich-rechtliche oder steuerliche Rules muss eine `official`-Quelle als Grundlage vorhanden sein, bevor eine Rule-Version operativ nutzbar oder FEST gesetzt werden darf. `internal_policy` kann nur fuer rein interne Organisationsregeln Grundlage sein oder strengere interne Vorgaben ergaenzen; sie darf rechtlichen Quellen nicht widersprechen und darf keine rechtliche Autoritaet suggerieren. `derived_interpretation` und `literatur` duerfen in Phase 1 nicht alleinige Grundlage einer operativ nutzbaren oder FEST-setzbaren Rule-Version sein; sie dienen nur als Kontext, Begruendung, Bestaetigung, Abgrenzung oder Hinweis.

Die konkreten zulaessigen Werte je Achse werden gemeinsam mit dem Initial-Rule-Scope in Frage 9 festgelegt; das hier festgelegte Modell ist die strukturelle Grundlage.

**Sub-Entscheidungen:**

- 4.A-Q1: `derived` ist niemals alleinige `grundlage` einer operativ nutzbaren oder FEST-setzbaren Rule-Version (strikte Variante, mit Drei-Rule-Kategorien-Differenzierung: fachlich-rechtlich / rein intern / `derived`-allein-nie)
- 4.A-Q2: `literatur` als eigene Achse, in Phase 1 nicht operativ-authoritativ, nur Kontext, Bestaetigung, Abgrenzung oder Hinweis
- Achsen-Liste auf Architekturebene: `official`, `internal`, `derived`, `literatur` (erweiterbar)
- Felder pro Quelleneintrag: `source_axis`, `source_kind`, `authority_level`, `binding_scope`, plus rule-bezogenes `relevance_role`
- Kein numerischer `source_rank`
- Konkrete Enum-Werte je Achse werden in Frage 9 mit Initial-Rule-Scope festgelegt

**Forward-Link:** Frage 9 traegt zusaetzliche Last (initiale Enum-Werte je Achse). Erwartet, akzeptiert, dokumentiert.

## 6. Frage 4.B — Konfliktmodell v0.2.1 Re-Lock nach Recovery

**Hinweis zur Identitaet dieser Fassung:**

Diese Fassung ist nicht der originale v0.2-corrected-Text aus der S2.5-Konversation. Sie ist ein eigens als v0.2.1 ausgewiesener Re-Lock nach Recovery. Der originale v0.2-corrected-Block konnte trotz gezielter Recovery-Suche nicht als zusammenhaengender Volltext extrahiert werden. Die hier persistierte Fassung uebernimmt die v0.1-Substanz und arbeitet die in S2.5 angenommenen drei Korrekturen sowie die spaeter ergaenzte K1-Differenzierung in K1.a und K1.b ein.

### 4.B-0 — Verortung und Scope

Frage 4.B lockt das Konfliktmodell der Wissensbasis als konzeptionelle Klassifikation strukturell auf. Die Frage entscheidet:

- welche Konstellationen zwischen Quellen einer Rule-Version strukturell keine Konflikte oder Bindungsspannungen im Sinne dieses Modells sind (Pseudokonflikte);
- welche Konflikt- und Bindungsspannungs-Typen das Modell erfasst und nach welchen Sachverhalts-Merkmalen sie unterschieden werden;
- unter welchen Voraussetzungen die strukturelle Konsequenz "operativ nicht nutzbar" greift;
- welche Handlungsspielraeume Domain-Services gegenueber markierten oder strukturfehlerhaften Rule-Versionen nicht haben.

Frage 4.B trifft ausdruecklich keine Aussagen ueber:

- die konkreten Lifecycle-Status einer Rule-Version, deren Reihenfolge oder ihre Uebergaenge (Forward-Link Frage 6);
- die fachlichen Verantwortlichkeiten zur Aufloesung markierter Konflikte oder Bindungsspannungen oder zur Behebung von Strukturfehlern (Forward-Link Frage 7);
- die UI-Darstellung der Markierungen, das Hinweis-Wording oder die visuelle Auspraegung (Forward-Link Frage 8);
- die schemaseitige Form der Markierungen, ihrer Metadata oder ihrer Persistierung (Forward-Link Frage 9).

### 4.B-1 — Pseudokonflikte (keine Konflikte oder Bindungsspannungen im Sinne dieses Modells)

Folgende Konstellationen sind strukturell keine Konflikte oder Bindungsspannungen im Sinne des Konfliktmodells und loesen daher keine Markierung aus:

- **P1 — Koexistenz in unterschiedlichen `source_axis`-Achsen ohne Widerspruch.** Quellen, die unterschiedlichen `source_axis`-Werten aus Frage 4.A angehoeren, koennen dieselbe Rule-Version stuetzen, ohne dass daraus ein Konflikt im Sinne dieses Modells abzuleiten ist. Die Achsen-Trennung aus 4.A bildet diese Konstellation bereits ab.
- **P2 — Mehrebenen-Geltung ohne Widerspruch.** Eine Rule-Version kann mehrere `grundlage`-Quellen auf unterschiedlichen rechtlichen Ebenen tragen, ohne dass diese Quellen einander inhaltlich widersprechen. Die Verknuepfungs-Mechanik aus 4.A bildet dies ueber `relevance_role` ab; ein Konflikt im Sinne dieses Modells liegt nicht vor.
- **P3 — Aktualisierung.** Eine neuere Quelle ersetzt eine aeltere zum selben Sachverhalt. Diese Konstellation wird vom Versionsmodell der Wissensbasis (Frage 1) und vom temporalen Modell (Frage 5) abgebildet und nicht vom Konfliktmodell. Eine Aktualisierung loest keine Markierung aus.

Pseudokonflikte sind kein Anlass fuer eine Markierung und kein Ausloeser fuer eine blockierende Konsequenz im Sinne von 4.B-3.

### 4.B-2 — Konflikt- und Bindungsspannungs-Typen

Das Konfliktmodell unterscheidet die folgenden Typen. Die Aufzaehlung ist abschliessend fuer Phase 1.

Der Sammelbegriff "niedrigerrangige Norm" wird im Wording konsequent vermieden. Die sprachliche Trennung zwischen Rechtsverordnung als Norm mit Rechtsnormqualitaet und Verwaltungsanweisung als verwaltungsinternem Binnenrecht ohne Rechtsnormqualitaet ist durchgaengig zu wahren.

- **K1 — Vertikale Norm- oder Bindungsspannung.** K1 erfasst zwei strukturell getrennte Sub-Konstellationen, die das Konfliktmodell nicht miteinander vermischt:

  - **K1.a — Normenkonflikt mit Rechtsnormqualitaet.** Eine Rechtsverordnung im Sinne von Art. 80 GG widerspricht inhaltlich dem ermaechtigenden formellen Gesetz oder einem hoeherrangigen formellen Gesetz. Die Rechtsverordnung traegt Rechtsnormqualitaet und unterliegt der Normverwerfungskompetenz der Gerichte. K1.a ist strukturell ein Normenkonflikt.
  - **K1.b — Bindungsspannung ohne Rechtsnormqualitaet.** Eine Verwaltungsanweisung steht inhaltlich in Widerspruch zu einem hoeherrangigen formellen Gesetz oder zu einer Rechtsverordnung. Die Verwaltungsanweisung ist verwaltungsinternes Binnenrecht ohne Rechtsnormqualitaet; sie unterliegt nicht der Normverwerfungskompetenz und ist gegenueber Gerichten und Steuerpflichtigen keine Norm im Rechtssinne. K1.b ist daher strukturell kein Normenkonflikt im Sinne von K1.a, sondern eine Bindungsspannung. Die strukturelle Markierung erfolgt dennoch, damit Domain-Services keine eigene Vorrangentscheidung zwischen Verwaltungsanweisung und Gesetz treffen.

  Die Abgrenzung von K1.b gegenueber K4 ist verbindlich: K1.b betrifft die Spannung zwischen Verwaltungsanweisung und formellem Gesetz oder Rechtsverordnung; K4 betrifft die Spannung zwischen Verwaltungsanweisung und hoechstrichterlicher Rechtsprechung des BFH. Beide Konstellationen werden nicht zusammengefasst.

  K1 in beiden Sub-Konstellationen wird sichtbar markiert und loest die strukturelle Wirkung aus 4.B-3 R2 aus.

- **K2 — EU-Recht-Konflikt.** Nationales Recht und eine EU-Richtlinie stehen inhaltlich in Widerspruch. Fuer die fachliche Beurteilung einer moeglichen Direktwirkung sind die folgenden drei Sachverhalts-Merkmale gleichrangig als Rule-Metadata zu erfassen:

  - Umsetzungsstatus der Umsetzungsfrist,
  - Wirkungsrichtung der konkreten Berufung,
  - Eigenschaft der Norm als "unbedingt und hinreichend genau".

  Alle drei Merkmale sind Bestandteil der Rule-Pflege und nicht Bestandteil einer maschinellen Bewertung durch einen Domain-Service. Die fachlich-rechtliche Wuerdigung des Einzelfalls bleibt der fachlich verantwortlichen Person ueberlassen (Forward-Link Frage 7). K2 wird sichtbar markiert und loest die strukturelle Wirkung aus 4.B-3 R2 aus.

- **K3 — Horizontaler Quellenkonflikt.** Mehrere Quellen derselben `source_axis` und vergleichbarer Stufe widersprechen sich inhaltlich ohne formellen Aufhebungsbezug. Beispielsweise koennen zwei BMF-Schreiben unterschiedlichen Datums ohne explizite Aufhebung in Widerspruch stehen. Die Abgrenzung zwischen K3 und P3 (Aktualisierung) ergibt sich aus dem Vorliegen oder Fehlen eines formellen Aufhebungs- oder Ersetzungs-Bezugs und erfolgt durch die fachlich verantwortliche Person. K3 wird sichtbar markiert und loest die strukturelle Wirkung aus 4.B-3 R2 aus.

- **K4 — Konflikt zwischen Verwaltungsanweisung und hoechstrichterlicher Rechtsprechung.** Eine Verwaltungsanweisung weicht von einer hoechstrichterlichen Rechtsprechung des BFH ab. K4 ist von K1.b strukturell zu trennen: K1.b betrifft die Spannung gegenueber Gesetz oder Rechtsverordnung, K4 betrifft die Spannung gegenueber BFH-Rechtsprechung. Folgende Sub-Konstellationen sind als Rule-Metadata zu erfassen, nicht als eigene Konflikttypen:

  - Veroeffentlichungsstatus des BFH-Urteils im BStBl Teil II (veroeffentlicht, nicht veroeffentlicht, unbekannt),
  - Existenz eines formellen Nichtanwendungserlasses zum Urteil (vorhanden, nicht vorhanden).

  Die schemaseitige Form dieser Sub-Granularitaet ist nicht Teil von 4.B (Forward-Link Frage 9). K4 wird sichtbar markiert und loest die strukturelle Wirkung aus 4.B-3 R2 aus.

- **K5 — Konflikt zwischen `internal` und `official`.** Eine Rule, die sich als `grundlage` auf eine `internal`-Quelle stuetzt und gleichzeitig einer einschlaegigen `official`-Quelle widerspricht, ist durch Frage 4.A bereits strukturell ausgeschlossen. Tritt eine derartige Konstellation dennoch auf, ist sie ein Strukturfehler im Sinne von 4.B-3 R3 und nicht ein Konflikt im Sinne des Konfliktmodells.

- **K6 — Uebergangsregelung.** Eine Quelle A regelt Altfaelle bis zu einem Stichtag, eine Quelle B regelt Neufaelle ab demselben Stichtag. Diese Konstellation wird vom temporalen Modell (Frage 5) ueber die fachliche Geltungsperiode beider Rule-Versionen abgebildet und nicht vom Konfliktmodell. Eine Uebergangsregelung wird nicht als Konflikt markiert.

### 4.B-3 — Strukturelle Konsequenz: blockierende Konstellationen

Das Konfliktmodell unterscheidet drei Stufen struktureller Konsequenz fuer Rule-Versionen:

- **R1 — Keine strukturelle Blockierung.** Die in 4.B-1 genannten Pseudokonflikte P1, P2, P3 sowie der in 4.B-2 K6 genannte Uebergangsregelungs-Fall loesen keine strukturelle Blockierung im Sinne dieses Modells aus.
- **R2 — Blockierende Konflikt- oder Bindungsspannungs-Markierung.** Die Konflikt- und Bindungsspannungs-Typen K1 (einschliesslich beider Sub-Konstellationen K1.a und K1.b), K2, K3 und K4 aus 4.B-2 loesen eine strukturelle Markierung aus, die die operative Nutzbarkeit der betroffenen Rule-Version blockiert. Solange diese Markierung besteht, ist die Rule-Version durch das Konfliktmodell als operativ nicht nutzbar gekennzeichnet, auch nicht als Fallback.
- **R3 — Strukturfehler.** Eine Rule-Version traegt einen Strukturfehler im Sinne dieses Modells, wenn eine der folgenden Bedingungen erfuellt ist:

  - die Rule-Version traegt keine `grundlage`-Quelle mit `source_axis = official`, obwohl sie fachlich-rechtliche Wirkung beansprucht;
  - die Rule-Version stuetzt sich als `grundlage` ausschliesslich auf Quellen mit `source_axis = derived` oder `source_axis = literatur`, was durch Frage 4.A strukturell ausgeschlossen ist;
  - eine K5-Konstellation im Sinne von 4.B-2 ist nicht aufgeloest.

  Eine Rule-Version mit Strukturfehler ist durch das Konfliktmodell als operativ nicht nutzbar gekennzeichnet, auch nicht als Fallback. Der Strukturfehler ist von einer Markierung im Sinne von R2 zu unterscheiden: er beruht nicht auf einem Widerspruch zwischen Quellen, sondern auf einer fehlenden oder strukturwidrigen Quellenausstattung der Rule-Version selbst.

Die in R2 und R3 festgestellte strukturelle Wirkung "operativ nicht nutzbar" ist eine Aussage auf Ebene des Konfliktmodells. Sie greift dem Lifecycle-Modell aus Frage 6 nicht vor und bestimmt insbesondere nicht, welcher konkrete Lifecycle-Status die betreffende Rule-Version traegt, ob ein bestimmter Lifecycle-Status nicht angenommen werden darf oder welche Lifecycle-Uebergaenge zulaessig sind. Die konkrete Lifecycle-Behandlung von R2- und R3-Konstellationen ist Aufgabe von Frage 6; die fachliche Verantwortlichkeit fuer ihre Aufloesung ist Aufgabe von Frage 7.

### 4.B-4 — Domain-Service-Grenzen

Domain-Services im Sinne der Wissensbasis-Konsumenten unterliegen gegenueber markierten oder strukturfehlerhaften Rule-Versionen folgenden Grenzen:

- sie waehlen nicht zwischen widerspruechlichen Quellen einer Rule-Version aus, weder im Sinne eines Normenkonflikts (K1.a, K2, K3) noch im Sinne einer Bindungsspannung (K1.b, K4);
- sie wenden eine Rule-Version, die aufgrund einer Markierung K1, K2, K3 oder K4 oder aufgrund eines Strukturfehlers R3 als operativ nicht nutzbar gekennzeichnet ist, nicht operativ an, auch nicht als Fallback;
- sie leiten aus mehreren widerspruchsfreien Quellen einer Rule-Version keine "staerkste" oder "vorrangige" Quelle ab; die fachliche Gewichtung erfolgt ausschliesslich bei der Rule-Pflege durch die fachlich verantwortliche Person;
- sie treffen keine eigene Vorrangentscheidung zwischen Verwaltungsanweisung und Gesetz oder Rechtsverordnung im Sinne von K1.b und keine eigene Vorrangentscheidung zwischen Verwaltungsanweisung und BFH-Rechtsprechung im Sinne von K4;
- sie generieren keine Texte, die rechtlichen Vorrang, Verfassungswidrigkeit, Nichtanwendungs-Wirkung oder gerichtsfeste Konflikt-Aufloesungen behaupten, soweit eine solche Aussage nicht durch eine operativ nutzbare Rule-Version mit ausreichender `official`-Grundlage gedeckt ist.

Die Domain-Service-Grenzen aus 4.B-4 sind eine Konsequenz aus Frage 4.A (kein numerischer `source_rank`, keine arithmetische Konfliktaufloesung) und aus 4.B-3 (strukturelle Blockierungs-Wirkung). Sie nehmen die UI-Form nicht vorweg; deren konkrete Auspraegung ist Gegenstand von Frage 8.

### 4.B-5 — Was bewusst NICHT in 4.B gelockt wird

- Konkrete Lifecycle-Status, ihre Bezeichner und ihre Uebergaenge fuer Rule-Versionen mit Markierung oder Strukturfehler. Insbesondere wird in 4.B nicht festgelegt, welchen Lifecycle-Status eine Rule-Version mit R2-Markierung oder R3-Strukturfehler traegt und welche Uebergaenge zulaessig sind. Forward-Link Frage 6.
- Die fachlichen Verantwortlichkeiten und Workflow-Schritte zur Aufloesung von K1.a-, K1.b-, K2-, K3-, K4-Markierungen und zur Behebung von R3-Strukturfehlern. Forward-Link Frage 7.
- Die UI-Darstellung der Markierungen, ihres Wordings, ihrer visuellen Auspraegung sowie der Hinweis-Hierarchie. Insbesondere wird in 4.B nicht entschieden, ob K1.a und K1.b in der UI unterschiedlich dargestellt werden. Forward-Link Frage 8.
- Die schemaseitige Form der Markierungen, einschliesslich der Frage, ob K1.a und K1.b ueber ein gemeinsames K1-Markierungsfeld mit Sub-Diskriminator oder ueber zwei getrennte Felder modelliert werden, der Metadata-Felder fuer K2 (drei Direktwirkungs-Merkmale) und K4 (BStBl-II-Status, Nichtanwendungserlass-Existenz), die konkrete Persistierung des Strukturfehler-Markers und die Verknuepfung zwischen Markierung und Rule-Version. Forward-Link Frage 9.
- Eine automatische Konfliktaufloesung, eine automatische Bindungsspannungs-Aufloesung, eine automatische Quellen-Vorrangentscheidung, eine automatische rechtliche Wuerdigung im Einzelfall oder eine automatische Bewertung der Direktwirkungs-Merkmale aus K2 oder der Sub-Konstellationen aus K4. Diese sind in Phase 1 ausgeschlossen.
- Eine Vermischung von Konfliktmodell und Temporalmodell: P3 und K6 verbleiben strukturell beim Versions- und Temporalmodell (Frage 1, Frage 5) und nicht beim Konfliktmodell.
- Eine Vermischung von K1.b und K4: die Spannung der Verwaltungsanweisung gegenueber Gesetz oder Rechtsverordnung wird strukturell von der Spannung gegenueber BFH-Rechtsprechung getrennt gehalten.

### 4.B-6 — STOP-Hinweise

- 4.B trifft keine Aussage ueber den konkreten Lifecycle-Pfad einer Rule-Version. Formulierungen wie "Rule-Version kann nicht in einen bestimmten Lifecycle-Status uebergehen" werden in 4.B nicht getroffen; sie waeren ein Vorgriff auf Frage 6.
- 4.B legt keine Approval-Zustaendigkeiten fest; die Aufloesung markierter Konflikte oder Bindungsspannungen und die Bewertung der Behebung von Strukturfehlern sind fachliche Verantwortlichkeiten und Gegenstand von Frage 7.
- 4.B trifft keine Schema-Entscheidung, weder hinsichtlich konkreter Datentypen noch hinsichtlich der Persistierungs-Form von Markierungen oder Metadata, einschliesslich der schemaseitigen Umsetzung der K1.a- und K1.b-Trennung.
- 4.B trifft keine UI-Entscheidung, weder hinsichtlich konkreter Hinweis-Texte noch hinsichtlich ihrer visuellen Auspraegung.
- 4.B verwendet im Wording nicht den Sammelbegriff "niedrigerrangige Norm" fuer die gemeinsame Bezeichnung von Rechtsverordnung und Verwaltungsanweisung. Die sprachliche Trennung zwischen Rechtsverordnung als Norm und Verwaltungsanweisung als verwaltungsinternem Binnenrecht ohne Rechtsnormqualitaet bleibt durchgaengig zu wahren.
- 4.B trifft keine Aussage ueber den Wahrheitsgehalt einer fachlich-rechtlichen Position. Eine Markierung im Sinne von R2 ist eine strukturelle Aussage darueber, dass die Quellenlage zur Rule eine fachliche Pruefung erfordert; sie ist keine rechtliche Vorwegnahme.
- 4.B nimmt keine Aussagen aus Frage 4.A zurueck und keine Aussagen aus Fragen 5 bis 9 vorweg.

### 4.B-7 — Forward-Links

- **Frage 5 (Temporales Modell):** P3 (Aktualisierung) und K6 (Uebergangsregelung) verbleiben strukturell beim temporalen Modell; ihre Abbildung erfolgt ueber die fachliche Geltungsperiode und nicht ueber das Konfliktmodell.
- **Frage 6 (Lifecycle):** konkrete Lifecycle-Behandlung von Rule-Versionen mit K1.a-, K1.b-, K2-, K3-, K4-Markierung sowie von Rule-Versionen mit Strukturfehler R3; konkrete Lifecycle-Status-Bezeichner; Zulaessigkeit oder Unzulaessigkeit einzelner Uebergaenge.
- **Frage 7 (Approval):** fachliche Verantwortlichkeit fuer die Aufloesung markierter Konflikte und Bindungsspannungen K1.a, K1.b, K2, K3, K4 und fuer die Bewertung der Behebung eines Strukturfehlers R3; Approval-Workflow.
- **Frage 8 (UI-Scope Phase 1):** Darstellung der Markierungen und des Strukturfehlers, Wording, Hinweis-Hierarchie, Unterscheidung der beiden Faelle blockierender Rule-Versions-Zustaende (R2 und R3) in der UI, etwaige UI-Differenzierung zwischen Normenkonflikt (K1.a) und Bindungsspannung (K1.b).
- **Frage 9 (Initial Structural Scope):** schemaseitige Form der Markierungs-Mechanik (Baustein B5 aus Frage 9), schemaseitige Umsetzung der K1.a- und K1.b-Trennung, Sub-Granularitaet der K2- und K4-Metadata, Persistierung des Strukturfehler-Markers.
- **Offener Forward-Link R5-2** — Rule-Matching-Semantik bei Mehrdaten-Sachverhalten — bleibt unveraendert offen.

## 7. Fragen 5 bis 9 — v0.2-final aus S7-Close

### 7.1 Frage 5 — Temporales Modell der Wissensbasis (v0.2-final, gelockt in conversation)

#### 5.1 — Grundsaetzliche Entscheidung

Rule-Versionen in der Wissensbasis tragen zwei voneinander unabhaengige zeitliche Achsen:

- Fachliche Gueltigkeit (Sachverhaltszeit): Der Zeitraum, in dem eine Rule-Version nach materiellem Recht auf einen Sachverhalt anwendbar ist. Diese Achse wird hinsichtlich des Sachverhaltsdatums ausgewertet (z. B. Datum eines Geschaeftsvorfalls).
- Systemische Gueltigkeit (Systemzeit): Der Zeitraum, in dem die Rule-Version im System als massgebliche Systemfassung gefuehrt wird, also vom Eintrag in die Wissensbasis bis zur Schliessung oder Ersetzung durch eine spaetere Version.

Quellen werden in Phase 1 zeitlich einfacher gefuehrt: sie tragen genau eine fachliche Geltungsperiode, die die rechtliche Wirkung der Quelle abbildet. Eine separate Verifikations-Spur — wann ein Quelleneintrag zuletzt mit dem aktuellen Stand der jeweiligen offiziellen Quelle abgeglichen wurde — wird begleitend gefuehrt; sie ist nicht Bestandteil der Geltungsperiode der Quelle, sondern eine eigenstaendige Metadaten-Information.

Die strukturelle Form, in der diese zeitlichen Achsen und die Quellen-Verifikations-Spur im Datenbank-Schema realisiert werden, ist nicht Teil dieser Frage (Forward-Link Frage 9).

#### 5.2 — Trennung von Lifecycle und Approval

Die beiden zeitlichen Achsen in 5.1 sind rein zeitliche Aussagen. Sie treffen keine Aussage darueber, ob eine Rule-Version operativ angewendet werden darf. Die operative Nutzbarkeit einer Rule-Version richtet sich nach dem spaeter zu lockenden Lifecycle- bzw. Approval-Modell (Forward-Link Frage 6, Frage 7).

Folgerungen:

- Eine Rule-Version kann systemisch eingetragen und gleichzeitig operativ nicht anwendbar sein. Insbesondere kann der in 4.B-3 vorgesehene Vor-Freigabe-Status fuer Rule-Versionen mit ungeloesten Konflikten von K1, K2, K3 oder K4 vom Lifecycle- bzw. Approval-Modell ausgestaltet werden, ohne die systemische Geltungsperiode zu beeinflussen.
- Eine Rule-Version kann fachlich ueberholt sein, d. h. ihre fachliche Geltungsperiode endet in der Vergangenheit, und dennoch fuer historische Sachverhalte die zutreffende Rule darstellen.

#### 5.3 — Abbildung von P3 (Aktualisierung, aus 4.B-1)

Das in 4.B-1 als P3 klassifizierte Pseudo-Konflikt-Muster — eine neuere Quelle ersetzt eine aeltere — wird im versionierten temporalen Modell und nicht im Konfliktmodell abgebildet. Operativ:

- Die aeltere Rule-Version erhaelt eine abgeschlossene systemische Geltungsperiode.
- Eine neue Rule-Version wird angelegt mit offener systemischer Geltungsperiode und einer fachlichen Geltungsperiode, die die Wirkung der neuen Quelle abbildet.
- Beide Versionen bleiben in der Wissensbasis persistent erhalten; ein Loeschen findet nicht statt.

#### 5.4 — Abbildung von K6 (Uebergangsregelung, aus 4.B-2)

Das in 4.B-2 als K6 klassifizierte Pseudo-Konflikt-Muster — Quelle A fuer Altfaelle, Quelle B fuer Neufaelle — wird ueber die fachliche Gueltigkeit (Sachverhaltszeit) abgebildet und nicht im Konfliktmodell. Operativ:

- Rule-Version A erhaelt eine fachliche Geltungsperiode, die mit dem in der Uebergangsregelung genannten Stichtag endet.
- Rule-Version B erhaelt eine fachliche Geltungsperiode, die ab diesem Stichtag beginnt.
- Beide Versionen koennen systemisch zur selben Zeit gefuehrt sein. Welche von beiden auf einen konkreten Sachverhalt anzuwenden ist, bestimmt das Sachverhaltsdatum.
- Eine Uebergangsregelung wird nicht als Konflikt markiert.

#### 5.5 — Rueckwirkende Aenderungen

Rueckwirkende Rechtsaenderungen werden im Modell aus 5.1 strukturell unterstuetzt, indem der Beginn der fachlichen Geltungsperiode einer Rule-Version vor dem Beginn ihrer systemischen Geltungsperiode liegen darf. Damit wird der Tatbestand abgebildet, dass das System eine neue Rechtswirkung zu einem Zeitpunkt T1 in die Wissensbasis aufnimmt, die fachlich bereits ab einem frueheren Zeitpunkt T0 zu gelten beansprucht.

Die Behandlung bereits in der Wissensbasis existierender Rule-Versionen, die durch eine rueckwirkende Aenderung obsolet werden, ist eine Lifecycle-Frage (Forward-Link Frage 6). Die fachliche Rueckabwicklung bereits ausgefuehrter Buchungen aufgrund rueckwirkender Rechtsaenderung ist eine domain-fachliche Entscheidung ausserhalb der Wissensbasis und wird in Frage 5 nicht behandelt.

#### 5.6 — Audit-Faehigkeit: zwei strukturell getrennte Fragen

Das in 5.1 festgelegte Modell erlaubt die strukturell getrennte Beantwortung zweier Audit-Fragen:

- Frage A — Was wusste oder zeigte das System zum Zeitpunkt T? Antwortbasis: jene Rule-Version, deren systemische Geltungsperiode den Zeitpunkt T umfasst und deren fachliche Geltungsperiode das relevante Sachverhaltsdatum umfasst. Die operative Nutzbarkeit dieser Rule-Version zum Zeitpunkt T ist separat anhand des Lifecycle- bzw. Approval-Modells zu pruefen (Forward-Link Frage 6, Frage 7).
- Frage B — Was gilt nach heutigem Wissensstand rueckwirkend fuer einen Sachverhalt vom Datum D? Antwortbasis: jene Rule-Version, deren systemische Geltungsperiode bis heute offen ist und deren fachliche Geltungsperiode das Datum D umfasst.

Beide Fragen sind separat beantwortbar; ihre Antworten koennen sich unterscheiden. Diese Trennung ist eine notwendige strukturelle Voraussetzung fuer die Nachvollziehbarkeit und spaetere Pruefbarkeit der Wissensbasis. Die UI-Darstellung dieser beiden Audit-Sichten ist nicht Teil von Frage 5 (Forward-Link Frage 8).

#### 5.7 — Was bewusst NICHT in Frage 5 gelockt wird

- Lifecycle-Status-Bezeichnungen, -Uebergaenge und -Berechtigungen sowie die Behandlung obsolet gewordener Rule-Versionen, Forward-Link Frage 6.
- Mechanik zur Markierung einer Quelle als ueberholt und die daraus folgende Wirkung auf abhaengige Rule-Versionen (derived Signal "Quelle veraltet"), Forward-Link Frage 6.
- Approval-Modell und Verantwortlichkeiten fuer das Anlegen, Schliessen und Freigeben von Rule-Versionen, Forward-Link Frage 7.
- UI-Darstellung temporaler Sichten, insbesondere der getrennten Audit-Sichten aus 5.6, sowie der Darstellung mehrfach fachlich gueltiger Rule-Versionen bei K6, Forward-Link Frage 8.
- Saemtliche Implementierungs- und Schema-Entscheidungen zur konkreten technischen Realisierung der beiden zeitlichen Achsen in 5.1, einschliesslich Datentypen, Inklusionskonventionen, Eindeutigkeits- und Ueberlappungs-Bedingungen, Sichten, Indizes, Default-Werte fuer offene Periodenenden, erforderliche Datenbank-Extensions, Migration-Reihenfolge, Forward-Link Frage 9.
- Schema und Granularitaet der Quellen-Geltungsperiode und der in 5.1 vorgesehenen Quellen-Verifikations-Spur ueber die hier festgelegte zeitlich einfache Fuehrung hinaus, Forward-Link Frage 9.
- Rule-Matching-Semantik bei Sachverhalten mit mehreren rechtlich relevanten Daten (z. B. Vertragsdatum, Leistungsdatum, Rechnungsdatum): welches Datum die Sachverhaltszeit im Sinne von 5.1 darstellt, ist nicht in Frage 5 zu entscheiden. Forward-Link R5-2 offen; gegebenenfalls eigener Sub-Sprint zur Rule-Matching-Semantik vor Frage 9.

#### 5.8 — Forward-Links

Aus Frage 5 ergeben sich folgende offene Punkte fuer nachfolgende Fragen:

- Frage 6 (Lifecycle): Status-Modell und -Uebergaenge; Behandlung obsolet gewordener Rule-Versionen; Quellen-Veralterung als derived Signal.
- Frage 7 (Approval): Verantwortlichkeiten fuer Anlegen, Schliessen und Freigeben von Rule-Versionen.
- Frage 8 (UI): Darstellung der beiden Audit-Sichten aus 5.6; Darstellung mehrfach fachlich gueltiger Rule-Versionen bei K6.
- Frage 9 (Initial-Migration-Scope): alle in 5.7 als Implementierungs- und Schema-Entscheidung markierten Punkte.
- Offener Forward-Link R5-2 — Rule-Matching-Semantik bei Mehrdaten-Sachverhalten.

### 7.2 Frage 6 — Lifecycle einer Rule-Version (v0.2-final, gelockt in conversation)

#### 6.1 — Grundsaetzliche Entscheidung

Jede Rule-Version in der Wissensbasis traegt einen Lifecycle-Status. Der Lifecycle-Status ist ein eigenstaendiges Attribut der Rule-Version, getrennt von den beiden zeitlichen Achsen aus Frage 5 (fachliche Gueltigkeit, systemische Gueltigkeit).

Der Lifecycle-Status entscheidet, ob eine Rule-Version operativ angewendet werden darf. Er trifft keine Aussage darueber, fuer welche Sachverhaltsdaten sie inhaltlich anwendbar waere; dies bestimmt die fachliche Geltungsperiode aus Frage 5.

#### 6.2 — Lifecycle-Status

Eine Rule-Version kann genau einen der folgenden sechs konzeptionellen Lifecycle-Status tragen. Die hier verwendeten Bezeichnungen sind Arbeitsnamen; die endgueltige Code-Repraesentation (Enum-Werte, Bezeichner-Konventionen) ist Teil von Frage 9.

- **`draft`** — Rule-Version ist in Erfassung oder Bearbeitung, noch nicht zur Pruefung freigegeben. Operativ nicht nutzbar. Wie mit `draft`-Versionen organisatorisch und persistenzseitig weiter verfahren wird (Verwerfen, Historisieren, Loeschen) ist Workflow- bzw. Schema-Frage und wird in Frage 7 und Frage 9 entschieden.
- **`pending_review`** — Rule-Version ist zur fachlichen Pruefung bzw. Vor-Freigabe vorgelegt und operativ nicht nutzbar. Dieser Status umfasst zwei Faelle, die strukturell denselben Status tragen:

  - Regelfall: eine fachlich erfasste Rule-Version wartet vor ihrer erstmaligen operativen Freigabe oder vor einer erneuten Freigabe nach inhaltlicher Aenderung auf eine fachliche Pruefung. Ein Konflikt im Sinne von 4.B-2 liegt nicht zwingend vor.
  - Konfliktbedingter Fall: ungeloeste Konflikte K1, K2, K3 oder K4 aus 4.B-2 fuehren zwingend zu `pending_review` und blockieren die operative Nutzung auch als Fallback (entspricht 4.B-3 R2).

  In beiden Faellen ist die Rule-Version operativ nicht nutzbar, auch nicht als Fallback. Wer prueft, wer freigibt und welche Uebergaenge zwischen `draft`, `pending_review` und `active` zulaessig sind, ist Approval- und Workflow-Frage (Forward-Link Frage 7).

- **`structural_invalid`** — Rule-Version weist einen Strukturfehler im Sinne von 4.B-3 R3 auf. Insbesondere betroffen:

  - Rule-Version ohne `official`-Quelle als `grundlage`,
  - Rule-Version, die ausschliesslich auf `derived`- oder `literatur`-Quellen gestuetzt ist (Konsequenz aus 4.A),
  - nicht aufgeloeste K5-Konstellation (`internal` versus `official`).

  Operativ nicht nutzbar. Eine Rule-Version in diesem Status kann auch nicht in `pending_review` uebergehen, solange der Strukturfehler besteht (entspricht 4.B-3 R3 "haerter als pending_review"). Der Workflow zur Heilung des Strukturfehlers ist eine Approval- und Workflow-Frage (Forward-Link Frage 7).

- **`active`** — Rule-Version ist operativ nutzbar. Sie kann auf Sachverhalte angewendet werden, deren Sachverhaltsdatum innerhalb der fachlichen Geltungsperiode aus Frage 5 liegt. Eine Rule-Version mit Status `active` und bereits abgelaufener fachlicher Geltungsperiode ist weiterhin operativ nutzbar fuer historische Sachverhalte innerhalb dieser Geltungsperiode; sie ist nicht "veraltet" im Sinne von Lifecycle.
- **`superseded`** — Rule-Version ist im Verlauf der weiteren Pflege derselben Rule-ID durch eine spaetere Rule-Version abgeloest worden (typischerweise infolge einer Aktualisierung im Sinne von P3 aus 4.B-1 oder einer rueckwirkenden Rechtsaenderung im Sinne von 5.5). Eine Rule-Version mit Status `superseded` ist nicht Teil der heutigen fachlichen Antwortmenge fuer Audit-Frage B aus 5.6.

  Welche Rule-Version stattdessen nach heutigem Wissensstand rueckwirkend fuer einen Sachverhalt vom Datum D einschlaegig ist, ergibt sich aus dem temporalen Modell aus Frage 5 in Verbindung mit dem zum heutigen Zeitpunkt operativ zulaessigen Lifecycle-Status. Eine direkte Nachfolger-Beziehung zwischen abloesender und abgeloester Rule-Version wird in Frage 6 nicht modelliert; eine spaetere Modellierung als Schema-Entscheidung bleibt Frage 9 vorbehalten.

- **`revoked`** — Rule-Version wurde als von Anfang an unzutreffend erkannt (z. B. Eintragungsfehler, gerichtlich verworfene Rechtsauffassung). Sie darf weder operativ angewendet noch als inhaltlich gueltige Antwort fuer Audit-Frage B aus 5.6 herangezogen werden.

  Fuer Audit-Frage A aus 5.6 bleibt eine `revoked`-Rule-Version historisch sichtbar und rekonstruierbar: Sie war zu einem frueheren Zeitpunkt T in der Wissensbasis eingetragen und wurde erst spaeter als unzutreffend erkannt. Genau dieser Sachverhalt — Existenz im System zum Zeitpunkt T, spaetere Erkenntnis der Unzutreffendheit — ist Bestandteil der durch Audit-A zu rekonstruierenden Historie.

#### 6.3 — Operative Nutzbarkeit

Operativ nutzbar im Sinne der Domain-Services aus 4.B-4 ist eine Rule-Version ausschliesslich dann, wenn ihr Lifecycle-Status `active` ist. Alle anderen Status (`draft`, `pending_review`, `structural_invalid`, `superseded`, `revoked`) blockieren die operative Nutzung, einschliesslich einer Verwendung als Fallback. Diese Blockade gilt sowohl im Regelfall einer fachlichen Vor-Pruefung als auch im konfliktbedingten Fall des `pending_review`.

Eine Rule-Version mit `active`-Status, deren fachliche Geltungsperiode in der Vergangenheit endet, ist operativ nutzbar fuer Sachverhalte mit Sachverhaltsdatum innerhalb dieser Geltungsperiode. Sie ist nicht operativ nutzbar fuer Sachverhalte ausserhalb dieser Geltungsperiode.

Fuer Audit-Frage A aus 5.6 ist nicht der heutige Lifecycle-Status der Rule-Version massgeblich, sondern derjenige Lifecycle-Status, den die Rule-Version zum historischen Zeitpunkt T trug. Die strukturelle Persistierung des Lifecycle-Verlaufs einer Rule-Version, die diese Rekonstruktion ermoeglicht, ist eine Schema-Frage und bleibt Frage 9 vorbehalten.

#### 6.4 — Verhaeltnis zu Frage 5

Die zeitlichen Achsen aus Frage 5 und der Lifecycle-Status aus Frage 6 sind voneinander unabhaengige Aussagen ueber eine Rule-Version. Die folgenden Konstellationen sind moeglich und konsistent:

- Systemisch eingetragen mit offener Systemzeit, gleichzeitig `pending_review` oder `structural_invalid`: im System gefuehrt, jedoch nicht operativ.
- Fachliche Geltungsperiode endete in der Vergangenheit, gleichzeitig `active`: anwendbar auf historische Sachverhalte innerhalb der fachlichen Geltungsperiode.
- Geschlossene Systemzeit (Nachfolgeversion existiert), gleichzeitig `superseded`: nicht Teil der heutigen Antwortmenge fuer Audit-B, fuer Audit-A historisch zugaenglich.

#### 6.5 — Quellen-Veralterung (Forward-Link aus 5.7)

Wenn eine Quelle ueber die Quellen-Verifikations-Spur aus 5.1 als veraltet gekennzeichnet wird, fuehrt dies bei abhaengigen Rule-Versions nicht zu einem automatischen Lifecycle-Uebergang. Quellen-Veralterung ist ein Hinweis- bzw. Review-Signal und nicht ein eigener Lifecycle-Status.

Das Signal stoesst eine Pruefung durch die fachlich verantwortliche Person an, ersetzt diese aber nicht. Insbesondere darf das Signal die Domain-Services aus 4.B-4 nicht in die Lage versetzen, automatisch Quellen-Vorrang, Rechtslage oder Aktualitaet einer Rule-Version zu entscheiden.

Die konkrete Mechanik und Persistierung dieses Signals — als Attribut der Rule-Version, als separate Relations-Tabelle oder als derived Wert — ist eine Schema-Frage (Forward-Link Frage 9).

#### 6.6 — Rueckwirkende Aenderung (Forward-Link aus 5.5)

Wenn eine rueckwirkende Rechtsaenderung eine neue Rule-Version hervorbringt, deren fachliche Geltungsperiode den Anwendungsbereich einer bereits existierenden Rule-Version rueckwirkend einschraenkt oder beendet, kommt fuer die bestehende Rule-Version der Lifecycle-Uebergang in den Status `superseded` in Betracht. Die historische Sichtbarkeit fuer Audit-Frage A aus 5.6 bleibt durch die Persistenz der Rule-Version in der Wissensbasis strukturell erhalten.

Die zur Rekonstruktion erforderliche Persistierung des Lifecycle-Verlaufs selbst, das heisst die Spur frueherer Status-Werte einer Rule-Version, ist eine Schema-Frage (Forward-Link Frage 9). Wer diesen Uebergang ausloest und nach welchem Workflow er erfolgt, ist eine Approval-Frage (Forward-Link Frage 7).

#### 6.7 — Was bewusst NICHT in Frage 6 gelockt wird

- Verantwortlichkeiten und Berechtigungen fuer Lifecycle-Uebergaenge: welche Rolle darf welchen Uebergang ausloesen, Forward-Link Frage 7.
- Workflow zur fachlichen Vor-Pruefung im Regelfall von `pending_review`, Aufloesung von Konflikten K1 bis K4 im konfliktbedingten Fall von `pending_review`, Heilung von Strukturfehlern in `structural_invalid`, Korrektur von Eintragungsfehlern und Behandlung verworfener `draft`-Versionen, Forward-Link Frage 7.
- Zulaessige Uebergangs-Pfade zwischen Status, insbesondere Rueckkehr-Uebergaenge, Forward-Link Frage 7.
- Behandlung von `draft`-Versionen in Bezug auf Verwerfen, Loeschen, Historisieren, Forward-Link Frage 7 (Workflow-Aspekt) bzw. Frage 9 (Persistenz-Aspekt). Frage 6 trifft hierzu keine Regelung.
- UI-Darstellung der Lifecycle-Status, insbesondere die Unterscheidung von `superseded` und `revoked` in Audit-Sichten sowie die Unterscheidung des Regelfalls von `pending_review` vom konfliktbedingten Fall, Forward-Link Frage 8.
- Endgueltige Code-Repraesentation der Status (Enum-Werte, Bezeichner-Konventionen), Forward-Link Frage 9.
- Strukturelle Persistierung des Lifecycle-Verlaufs einer Rule-Version zur Rekonstruktion vergangener Status-Werte, Forward-Link Frage 9.
- Mechanik und Persistenz des Quellen-Veralterungs-Signals, Forward-Link Frage 9.
- Modellierung einer direkten Nachfolger-Beziehung zwischen abloesender und abgeloester Rule-Version, Forward-Link Frage 9.

#### 6.8 — Forward-Links

- Frage 7 (Approval): Verantwortlichkeiten und Berechtigungen fuer Lifecycle-Uebergaenge, Workflow zur fachlichen Vor-Pruefung im Regelfall von `pending_review`, Workflow zur Konfliktaufloesung im konfliktbedingten Fall, Heilung von Strukturfehlern, Korrektur von Eintragungsfehlern, Behandlung von `draft`-Versionen.
- Frage 8 (UI): Darstellung der Lifecycle-Status, historische Audit-Sichten, Unterscheidung von `superseded` und `revoked`, Unterscheidung der beiden Faelle von `pending_review`.
- Frage 9 (Schema): Code-Repraesentation der Status, strukturelle Persistierung des Lifecycle-Verlaufs, Mechanik des Quellen-Veralterungs-Signals, optionale spaetere Modellierung einer Nachfolger-Beziehung, Persistenz-Aspekte von `draft`-Versionen.

### 7.3 Frage 7 — Approval-Modell fuer Rule-Versionen (v0.2-final, gelockt in conversation)

#### 7.1 — Grundsaetzliche Entscheidung

Das Approval-Modell unterscheidet zwischen Erfassungs- und Workflow-Handlungen einerseits und fachlicher Freigabe-Entscheidung andererseits. Nicht jeder Lifecycle-Statuswechsel im Sinne von Frage 6 ist automatisch eine fachliche Approval-Freigabe im engen Sinn.

Stufe-1-Handlungen — das Anlegen, Bearbeiten und Vorlegen einer Rule-Version — sind Workflow- bzw. Erfassungshandlungen. Sie treffen keine Aussage darueber, ob die Rule-Version inhaltlich richtig oder operativ nutzbar ist.

Stufe-2-Approval — fachliche Freigabe — ist erforderlich fuer Entscheidungen, die die operative Nutzbarkeit einer Rule-Version begruenden, beenden, rueckwirkend in Frage stellen oder einen fachlich blockierenden Sachverhalt aufloesen.

Frage 7 definiert ausschliesslich diese fachlichen Verantwortlichkeitsstufen. Frage 7 entscheidet weder konkrete Anwendungsrollen oder Permissions, noch trifft sie Aussagen ueber UI oder Persistenz.

#### 7.2 — Fachliche Verantwortlichkeitsstufen

Frage 7 unterscheidet zwei fachliche Verantwortlichkeitsstufen:

- **Stufe 1 — Erfassung und Bearbeitung:** das Anlegen einer Rule-Version, das Bearbeiten einer Rule-Version im Status `draft`, das Vorlegen einer Rule-Version aus `draft` in den Status `pending_review` zur fachlichen Pruefung. Stufe 1 verantwortet die Erfassung selbst und die Vorlage zur Pruefung; sie trifft keine Aussage ueber die inhaltliche Richtigkeit der Rule-Version.
- **Stufe 2 — Fachliche Freigabe:** die fachliche Verantwortung fuer Entscheidungen, die operative Nutzbarkeit begruenden, beenden, rueckwirkend in Frage stellen oder fachlich blockierende Sachverhalte aufloesen. Stufe 2 umfasst insbesondere:

  - den Uebergang `pending_review` zu `active` im Regelfall,
  - die fachliche Aufloesung von Konflikten K1, K2, K3, K4 aus 4.B-2,
  - die fachliche Bewertung, ob ein zuvor festgestellter Strukturfehler im Status `structural_invalid` behoben wurde und ob daraus ein weiterer Lifecycle-Schritt mit moeglicher operativer Nutzbarkeit folgen darf,
  - die fachliche Bewertung eines Quellen-Veralterungs-Hinweises aus 6.5 und die daraus folgende Entscheidung ueber den weiteren Lifecycle-Status der betroffenen Rule-Version,
  - den Uebergang `active` zu `superseded`,
  - den Uebergang in `revoked` aus jedem Status.

Stufe 1 und Stufe 2 sind fachliche Verantwortlichkeiten und nicht zwingend einzelne Personen oder Anwendungsrollen. Die Zuordnung der Stufen zu konkreten Anwendungsrollen, Benutzergruppen oder Personen, und die technische Durchsetzung dieser Zuordnung, sind nicht Teil von Frage 7 (Forward-Link Frage 9).

#### 7.3 — Schutzprinzip der Trennung von Erfassung und Freigabe

Fachliche Freigabe im Sinne von Stufe 2 darf nicht mit blosser Erfassung im Sinne von Stufe 1 gleichgesetzt werden. Die Trennung von Erfassungshandlung und fachlicher Freigabe ist ein fachliches Schutz- und Zielprinzip des Approval-Modells. Es soll insbesondere verhindern, dass eine Rule-Version durch ihren Erfasser allein operative Nutzbarkeit erlangt.

Die konkrete personelle Durchsetzung dieses Schutzprinzips, der Umgang mit Konstellationen geringer Personalstaerke (insbesondere Solo-Konstellationen und Zwei-Personen-Konstellationen) sowie etwaige technische Enforcement-Regeln sind Workflow-, UI- bzw. Schema-Fragen und werden nicht in Frage 7 entschieden (Forward-Link Frage 8 und Frage 9).

#### 7.4 — Erhoehte Begruendungspflicht

Stufe-2-Entscheidungen, die historische oder rueckwirkende Wirkung entfalten oder einen fachlich blockierenden Konflikt im Sinne von 4.B-2 aufloesen, unterliegen einer erhoehten fachlichen Begruendungspflicht. Konkret betrifft dies:

- den Uebergang `active` zu `superseded` infolge Aktualisierung im Sinne von P3 aus 4.B-1,
- den Uebergang `active` zu `superseded` infolge rueckwirkender Rechtsaenderung im Sinne von 5.5,
- den Uebergang in `revoked` aus jedem Status,
- die fachliche Aufloesung von Konflikten K1, K2, K3, K4 aus 4.B-2.

Die erhoehte Begruendungspflicht bedeutet, dass die fachlich verantwortliche Stufe-2-Entscheidung von einer inhaltlichen fachlichen Begruendung getragen wird, die die Auswirkung der Entscheidung auf Audit-Frage A und Audit-Frage B aus 5.6 nachvollziehbar macht.

Form, Mindestinhalt, Pflichtfelder und Persistenz dieser Begruendung werden nicht in Frage 7 festgelegt; sie sind UI- und Schema-Fragen (Forward-Link Frage 8 und Frage 9).

#### 7.5 — Grenzen der Domain-Services

Die folgenden Lifecycle-Uebergaenge und Lifecycle-relevanten Entscheidungen erfolgen nicht durch Domain-Services oder durch maschinelle Verfahren ohne Stufe-2-Approval:

- die Aufloesung von Konflikten K1, K2, K3, K4 aus 4.B-2,
- die fachliche Bewertung der Behebung eines Strukturfehlers im Sinne von 4.B-3 R3 oder von 4.A (fehlende `official`-Quelle, ausschliessliche Stuetzung auf `derived`- oder `literatur`-Quellen, ungeloeste K5-Konstellation),
- die fachliche Entscheidung ueber den Vorrang einer Quelle gegenueber einer anderen,
- die fachliche Interpretation einer rueckwirkenden Rechtsaenderung im Hinblick auf bestehende Rule-Versions,
- die Erklaerung einer Rule-Version als `superseded` oder `revoked`,
- die fachliche Bewertung eines Quellen-Veralterungs-Hinweises aus 6.5.

Maschinell aufbereitete Hinweise, Diagnosen und Vorschlaege sind zulaessig, solange sie ausschliesslich vorbereitend wirken und nicht selbst eine Lifecycle-Entscheidung vollziehen. Eine vorbereitende Maschinen-Hinweis-Funktion ersetzt keine Stufe-2-Approval.

Die Auswahl zwischen mehreren fachlich gueltigen Rule-Versions im Fall einer Uebergangsregelung K6 aus 4.B-2 ist keine Konfliktaufloesung; sie wird im operativen Betrieb durch das Sachverhaltsdatum bestimmt (siehe 5.4) und beruehrt das Approval-Modell nicht.

#### 7.6 — Nachvollziehbarkeit der Approval-Entscheidungen

Approval-Entscheidungen, die einen Lifecycle-Uebergang einer Rule-Version vollziehen, muessen spaeter nachvollziehbar dokumentiert werden koennen. Die konkrete Form der Dokumentation, ihre Mindestinhalte und ihre Verknuepfung mit dem Lifecycle-Verlauf aus Frage 6 sind nicht in Frage 7 festgelegt (Forward-Link Frage 9).

#### 7.7 — Praktische Terminalitaet von `superseded` und `revoked`

In Phase 1 werden die Lifecycle-Status `superseded` und `revoked` als praktisch terminal behandelt. Rueckkehr-Uebergaenge aus `superseded` oder `revoked` sind nicht Teil des regulaeren Approval-Workflows.

Sollte sich nachtraeglich erweisen, dass eine zu `superseded` oder `revoked` fuehrende Approval-Entscheidung korrigiert werden muss, ist der Regelweg, dies ueber eine neue Rule-Version derselben Rule-ID abzubilden.

Etwaige Ausnahme- oder Korrekturmechanismen, die ueber den Regelweg hinausgehen, erfordern eine spaetere ausdrueckliche Architekturentscheidung. Diese Entscheidung wird nicht in Frage 7 vorweggenommen.

#### 7.8 — Was bewusst NICHT in Frage 7 gelockt wird

- Konkrete Anwendungsrollen, Benutzergruppen oder Permissions, die Stufe-1- oder Stufe-2-Verantwortung in der Anwendung tragen, Forward-Link Frage 9.
- Technische Enforcement-Regeln zur Durchsetzung des Schutzprinzips aus 7.3, insbesondere die Behandlung von Konstellationen geringer Personalstaerke, Forward-Link Frage 8 und Frage 9.
- UI-Darstellung der Approval-Vorgaenge, insbesondere Formulare zur Erfassung der erhoehten Begruendung aus 7.4, Forward-Link Frage 8.
- Form, Mindestinhalt, Pflichtfelder und Persistenz der fachlichen Begruendung selbst, Forward-Link Frage 8 und Frage 9.
- Schemaseitige Repraesentation des Approval-Verlaufs, seine Mindestfelder und seine Verknuepfung mit dem Lifecycle-Verlauf aus Frage 6, Forward-Link Frage 9.
- Konkrete Vorgehensweise und Workflow zur Behebung eines Strukturfehlers im Status `structural_invalid` (etwa Ergaenzung einer `official`-Quelle, Aufloesung einer K5-Konstellation): Frage 7 lockt nur die fachliche Bewertung des Behebungs-Ergebnisses durch Stufe 2, nicht den Behebungs-Workflow selbst, Forward-Link Frage 8 und Frage 9.
- Mechanik und Persistenz der Quellen-Veralterungs-Hinweise aus 6.5, Forward-Link Frage 9.
- Approval-Anlaesse fuer nicht-inhaltliche Aktualisierungen einer Rule-Version oder einer Quelle (z. B. Korrektur einer URL ohne inhaltliche Aenderung): Frage 7 trifft hierzu keine Regelung; eine spaetere Klaerung bleibt Frage 9 vorbehalten.
- Ausnahme- oder Korrekturmechanismen fuer Rueckkehr-Uebergaenge aus `superseded` oder `revoked`, spaetere ausdrueckliche Architekturentscheidung, nicht Teil von Frage 7.

#### 7.9 — Forward-Links

- Frage 8 (UI): Darstellung der Approval-Vorgaenge, Erfassung der fachlichen Begruendung bei erhoehter Begruendungspflicht, Visualisierung der Stufentrennung, UI-Workflow in Konstellationen mit geringer Personalstaerke, UI-Workflow zur Behebung von Strukturfehlern im Status `structural_invalid` vor der fachlichen Bewertung durch Stufe 2.
- Frage 9 (Schema): Zuordnung der fachlichen Verantwortlichkeitsstufen zu Anwendungsrollen, schemaseitige Repraesentation des Approval-Verlaufs, Form und Persistenz der Begruendung, technische Enforcement-Regeln zum Schutzprinzip aus 7.3, Mechanik und Persistenz der Quellen-Veralterungs-Hinweise, schemaseitige Aspekte der Strukturfehler-Behebung im Status `structural_invalid`, Approval-Anlaesse fuer nicht-inhaltliche Aktualisierungen, spaetere Ausnahme- oder Korrekturmechanismen zu `superseded` und `revoked` (sofern eine spaetere Architekturentscheidung dies vorsieht).
- Offener Forward-Link R5-2 — Rule-Matching-Semantik bei Mehrdaten-Sachverhalten (unveraendert offen).

### 7.4 Frage 8 — UI-Scope Phase 1 fuer die Wissensbasis (v0.2-final, gelockt in conversation)

#### 8.1 — Grundsaetzliche Entscheidung

Frage 8 lockt die UI-Semantik und die UI-bezogenen Darstellungs- und Vermeidungspflichten der Wissensbasis fuer Phase 1. Frage 8 lockt weder konkrete Screens, Layouts, Komponenten, Routen oder UI-Pattern, noch trifft sie Aussagen ueber Schema, Persistenz oder konkrete Anwendungsrollen.

UI ist in Frage 8 als jedes Anwender-sichtbare Darstellungselement zu verstehen, das Inhalte aus der Wissensbasis wiedergibt oder Wissensbasis-bezogene Entscheidungen vermittelt.

#### 8.2 — Zwei UI-Konsumenten-Klassen

Die Wissensbasis bedient in Phase 1 zwei unterscheidbare UI-Konsumenten-Klassen mit unterschiedlichem Anspruch:

- **Pflege-UI:** jede Darstellung, in der eine Rule-Version erfasst, bearbeitet, vorgelegt, fachlich beurteilt oder einem Lifecycle-Uebergang im Sinne von Frage 6 zugefuehrt wird. Die Pflege-UI bedient die fachliche Verantwortlichkeitsstufe im Sinne von Frage 7.
- **Konsum-UI:** jede Darstellung, in der eine Rule-Version oder ihre Wirkung im operativen Buchhaltungs- oder Beratungs-Kontext sichtbar wird, ohne dass aus dieser Darstellung ein Lifecycle-Uebergang ausgeloest wird.

Die in 8.3 bis 8.6 festgelegten Anzeige- und Vermeidungspflichten gelten fuer beide Klassen, soweit nicht ausdruecklich auf eine Klasse beschraenkt.

#### 8.3 — Anzeige-Pflichten

Die UI muss in Phase 1 strukturell in der Lage sein, die folgenden Sachverhalte zu vermitteln. Wie diese Vermittlung konkret gestaltet wird, ist nicht Gegenstand von Frage 8.

- **AP1 — Lifecycle-Status:** Jede angezeigte Rule-Version traegt ihren Lifecycle-Status aus Frage 6.2 sichtbar. Der Lifecycle-Status darf nicht versteckt oder nur optional sichtbar dargestellt werden; er muss in der Anzeige einer Rule-Version verlaesslich erkennbar sein. Die konkrete Darstellungsform bleibt offen.
- **AP2 — Audit-A vs. Audit-B:** Die Pflege-UI muss die beiden in 5.6 unterschiedenen Audit-Fragen strukturell getrennt darstellen koennen ("Was wusste oder zeigte das System zum Zeitpunkt T?" einerseits, "Was gilt nach heutigem Wissensstand rueckwirkend fuer einen Sachverhalt vom Datum D?" andererseits). Die Konsum-UI muss mindestens nachvollziehbar machen, welche Rule-Version bzw. welche Rule-Wirkung fuer einen konkreten Vorgang herangezogen wurde. Weitergehende Audit-Sicht-Wechsel sind in der Konsum-UI nicht zwingend vorzusehen.
- **AP3 — Zwei Faelle von `pending_review`:** Die UI muss unterscheidbar machen, ob `pending_review` aus dem Regelfall einer fachlichen Vor-Pruefung resultiert oder aus einem konfliktbedingten Fall im Sinne von 4.B-2 (K1, K2, K3, K4). Beide Faelle tragen denselben Lifecycle-Status, sind aber im fachlichen Anspruch unterschiedlich.
- **AP4 — `superseded` vs. `revoked`:** In historischen Sichten, insbesondere zur Bedienung von Audit-Frage A aus 5.6, muss die UI zwischen `superseded` und `revoked` strukturell unterscheidbar bleiben. Eine zusammenfassende Darstellung beider Status als blosses "nicht mehr aktuell" ist unzulaessig.
- **AP5 — Quellen-Bezug und Quellen-Veralterungs-Hinweis:** Der Anzeigeanspruch ist nach Konsumenten-Klasse differenziert.

  In der Pflege-UI muessen Quellen-Bezuege einer Rule-Version einschliesslich ihrer `source_axis` aus 4.A unmittelbar sichtbar oder klar zugaenglich sein.

  In der Konsum-UI muessen Quellen-Bezug und Herleitung einer angezeigten Rule-Wirkung nachvollziehbar erreichbar sein. Eine vollstaendige Ausschreibung in jeder Standardansicht ist nicht zwingend; eine erreichbare Vertiefung der Anzeige genuegt.

  Quellen-Veralterungs-Hinweise aus 6.5 muessen dort sichtbar sein, wo sie die Interpretation oder Nutzung einer angezeigten Rule-Wirkung beeinflussen koennten. Sie sind als Hinweis-Signal zu vermitteln und nicht als Lifecycle-Status zu praesentieren.

- **AP6 — Zwei zeitliche Achsen:** Die Pflege-UI muss in der Lage sein, sowohl die fachliche Geltungsperiode als auch die systemische Geltungsperiode einer Rule-Version sichtbar zu machen. Im konstellativen Fall mehrerer fachlich gueltiger Rule-Versions infolge einer Uebergangsregelung K6 (siehe 5.4) muss die UI deren Koexistenz erkennbar darstellen koennen, ohne sie als Konflikt auszuweisen.
- **AP7 — Approval-Stufentrennung und erhoehte Begruendung:** Die Pflege-UI muss die Trennung der fachlichen Verantwortlichkeitsstufen aus Frage 7 sichtbar machen koennen, insbesondere die Unterscheidung von Erfassungs-Handlung und fachlicher Freigabe-Entscheidung. Das Vorliegen einer fachlichen Begruendung im Sinne der erhoehten Begruendungspflicht aus 7.4 muss in den davon betroffenen Lifecycle-Uebergaengen erkennbar sein. Form und Inhalt der Begruendung selbst werden nicht in Frage 8 gelockt.
- **AP8 — Praktische Terminalitaet:** Die UI darf in der Standardansicht keine Aktionen anbieten, die einen Rueckkehr-Uebergang aus `superseded` oder `revoked` als regulaeren Workflow nahelegen. Die praktische Terminalitaet aus 7.7 muss sich in der angebotenen Aktionsmenge widerspiegeln.

#### 8.4 — Vermeidungspflichten

Die UI darf in Phase 1 folgende Behauptungen, Suggestionen oder Darstellungen nicht treffen:

- **VP1 — Keine Rechtsgewissheits-Behauptung:** Die UI behauptet keine Verfassungswidrigkeit, keine Nichtigkeit, keine alleinige Richtigkeit einer Rechtsauffassung und keine externe Rechtsgewissheit. Auch bei operativ nutzbaren Rule-Versionen darf die UI keine abschliessenden rechtlichen Vorrang- oder Gueltigkeitsurteile formulieren.

  Zulaessig ist ausschliesslich eine neutrale Darstellung der intern fachlich freigegebenen Anwendungsgrundlage und ihrer Quellenbezuege.

  Eine UI-Darstellung darf nicht suggerieren, dass Harouda eine gerichtliche, behoerdliche oder externe Rechtsentscheidung ersetzt. Diese Pflicht entspricht und konkretisiert 4.B-4.

- **VP2 — Keine automatische Quellen-Vorrangentscheidung:** Die UI ordnet Quellen nicht automatisch in eine Vorrang-Rangfolge ein und hebt nicht maschinell eine Quelle als "staerker" oder "verbindlicher" hervor. Eine geordnete Anzeige von Quellen entlang der `source_axis` ist zulaessig; eine algorithmische Vorrangbewertung ist unzulaessig. Diese Pflicht entspricht 4.A und 4.B-4.
- **VP3 — Keine GoBD- oder Compliance-Claims:** Die UI etikettiert weder Rule-Versions noch Audit-Sichten mit Begriffen, die eine externe Konformitaets-Zusicherung suggerieren, insbesondere nicht mit Begriffen wie GoBD-konform, revisionssicher oder rechtssicher.
- **VP4 — Sensibler Umgang mit "geprueft" und "freigegeben":** Eine Darstellung einer Rule-Version als fachlich freigegeben ist nur im klaren internen Approval-Kontext zulaessig, wenn der Lifecycle-Status `active` ist und eine Stufe-2-Approval-Entscheidung im Sinne von 7.2 dem Uebergang zugrundeliegt.

  Der Begriff "geprueft" bleibt sensibel; er darf nicht als allgemeiner Legal- oder Compliance-Claim verwendet werden. Die UI unterlaesst Bezeichnungen, die suggerieren, eine Rule-Version sei rechtlich abschliessend geprueft, extern zertifiziert oder rechtssicher.

  Auf Rule-Versions in `draft`, `pending_review`, `structural_invalid`, `superseded` oder `revoked` duerfen "geprueft"- oder "freigegeben"-Bezeichnungen nicht angewendet werden.

- **VP5 — Keine Suggestion operativer Nutzbarkeit fuer blockierte Status:** Die UI legt nicht nahe, dass eine Rule-Version operativ angewendet wird oder werden koennte, wenn ihr Lifecycle-Status nicht `active` ist. Insbesondere bei der Anzeige von Rule-Versionen in `draft`, `pending_review`, `structural_invalid` oder `revoked` darf die UI keine Aktionen anbieten, die diesen Status uebergehen. Rule-Versions in `superseded` duerfen fuer neue, operativ anstehende Sachverhalte nicht als anwendbar dargestellt werden.

#### 8.5 — Hinweis-Hierarchie

Die UI unterscheidet konzeptionell drei voneinander getrennte Informationsarten, die nicht ineinander vermischt werden:

- **Lifecycle-Status-Indikator:** die sachliche Aussage darueber, welchen Lifecycle-Status eine Rule-Version traegt. Dies ist eine Tatsachen-Aussage aus Frage 6 und keine Warnung.
- **Block-Hinweis:** die sachliche Aussage darueber, dass eine Rule-Version mit einem von `active` abweichenden Lifecycle-Status operativ nicht nutzbar ist. Diese Aussage folgt aus 6.3 und ist keine Warnung im klassischen Sinn, sondern eine direkte Konsequenz des Lifecycle-Status.
- **Pruef-Empfehlungs-Hinweis:** ein Hinweis, der eine fachliche Pruefung anregt, ohne selbst eine Entscheidung zu treffen. Insbesondere der Quellen-Veralterungs-Hinweis aus 6.5 gehoert in diese Kategorie. Das UI-Wording solcher Hinweise stellt die Empfehlung in den Vordergrund und vermeidet Formulierungen, die eine bereits getroffene Entscheidung suggerieren.

Die konkrete visuelle Umsetzung dieser drei Informationsarten ist nicht Gegenstand von Frage 8. Frage 8 verlangt die konzeptionelle Trennung, nicht eine bestimmte Darstellungsform.

#### 8.6 — Konfliktbedingter Fall im Wording

Bei der UI-Darstellung des konfliktbedingten Falls von `pending_review` (K1, K2, K3, K4 aus 4.B-2) vermeidet die UI eine inhaltlich-rechtliche Vorwegnahme der noch ausstehenden Stufe-2-Approval-Entscheidung. Insbesondere unterlaesst die UI Formulierungen, die eine bestimmte Konflikt-Aufloesung als naheliegend, gerichtsfest oder selbstverstaendlich darstellen, bevor die fachliche Aufloesung im Sinne von 7.4 erfolgt ist.

#### 8.7 — Verhaeltnis zu Frage 9

Frage 8 lockt keine konkreten Schema-Entscheidungen. Frage 8 formuliert UI-seitige Anforderungen, die Frage 9 bei Schema und Persistenz beruecksichtigen muss. Frage 9 entscheidet, wie diese Anforderungen strukturell unterstuetzt werden.

Insbesondere setzt die Bedienung der folgenden Anzeige-Pflichten voraus, dass Frage 9 die zugehoerige strukturelle Grundlage schafft:

- Die in 8.3 AP2 verlangte Audit-A-Sicht setzt die in 6.3 und 6.6 bereits forward-verlinkte Persistierung des Lifecycle-Verlaufs voraus.
- Die in 8.3 AP7 verlangte Sichtbarkeit der Approval-Stufentrennung setzt die in 7.9 forward-verlinkte Zuordnung der fachlichen Verantwortlichkeitsstufen zu Anwendungsrollen voraus.
- Die in 8.3 AP5 verlangte Anzeige des Quellen-Veralterungs-Hinweises setzt die in 6.5 forward-verlinkte Mechanik dieses Hinweises voraus.

#### 8.8 — Was bewusst NICHT in Frage 8 gelockt wird

- Konkrete Screens, Layouts, Komponenten, Routen oder UI-Pattern.
- Konkrete Wording-Vorgaben fuer Hinweise, Status-Bezeichnungen oder Buttons.
- Konkrete visuelle Auspraegungen der Hinweis-Hierarchie aus 8.5 (Farben, Icons, Position, Modal- versus Inline-Darstellung).
- Konkrete Anwendungsrollen, die Pflege-UI- oder Konsum-UI-Zugang haben, Forward-Link Frage 9.
- Schemaseitige Voraussetzungen, die die in 8.3 verlangten Darstellungen erst ermoeglichen, Forward-Link Frage 9.
- Inhalt und Form der fachlichen Begruendung aus AP7, Forward-Link Frage 9.
- Mechanik und Persistenz des Quellen-Veralterungs-Hinweis-Signals, Forward-Link Frage 9.
- UI-Workflow-Ausgestaltung in Konstellationen mit geringer Personalstaerke im Sinne von 7.3, spaetere Umsetzung in Verbindung mit Frage 9.
- Audit-Sicht-Wechsel-Mechanik in der Konsum-UI ueber den in 8.3 AP2 geforderten Mindest-Anspruch hinaus.

#### 8.9 — Forward-Links

- Frage 9 (Schema): strukturelle Grundlage fuer alle in 8.3 geforderten Anzeigen, insbesondere Lifecycle-Verlauf, Approval-Verlauf, fachliche Begruendung, Quellen-Veralterungs-Hinweis-Mechanik, Zuordnung der Verantwortlichkeitsstufen zu Anwendungsrollen.
- Spaetere Umsetzungs-Sitzungen: konkrete UI-Wording-Vorgaben, visuelle Auspraegung der Hinweis-Hierarchie, konkrete Screens und Komponenten.
- Offener Forward-Link R5-2 — Rule-Matching-Semantik bei Mehrdaten-Sachverhalten (unveraendert offen).

### 7.5 Frage 9 — Initial Structural Scope der Wissensbasis (v0.2-final, gelockt in conversation)

#### 9.1 — Grundsaetzliche Entscheidung

Frage 9 lockt den strukturellen Scope der Wissensbasis fuer Phase 1. Sie legt fest, welche Strukturbausteine eine spaetere Migration grundsaetzlich abbilden muss, welche Strukturbausteine als architektonisch erforderlich anerkannt werden, deren konkrete schemaseitige Realisierung jedoch einer spaeteren Implementation-Entscheidung vorbehalten bleibt, und welche Aspekte ausdruecklich nicht zum Initial-Scope gehoeren.

Frage 9 lockt keine konkrete SQL-Syntax, keine Tabellen-DDL, keine Constraint-Definitionen im Code-Stil, keine Index- oder Extension-Entscheidungen, keine konkreten Datentypen, keine Migration-Reihenfolge, keine Migration-Nummern und keine UI-Implementierung. Diese Entscheidungen werden in spaeteren Implementation-Sitzungen ausserhalb von F4-D1 getroffen.

Frage 9 selbst nimmt keine Aenderung am Repo, an Migrations-Dateien oder am F-Register vor. Die spaetere Konsolidierung in ein V1.0-Artefakt und die F-Register-Eintragung sind Gegenstand einer eigenen spaeteren Sitzung (S6-Final), nicht Bestandteil von Frage 9.

#### 9.2 — Begriff "struktureller Platzhalter"

Wenn Frage 9 einen Strukturbaustein als strukturellen Platzhalter ausweist, bedeutet dies:

- Der Baustein ist architektonisch erforderlich und darf im spaeteren Design nicht uebersehen oder weggelassen werden.
- Seine konkrete schemaseitige Form, seine Felder, Tabellen, Relationen und Datentypen werden in Frage 9 nicht festgelegt.
- Die konkrete Auspraegung wird in einer spaeteren Implementation-Entscheidung getroffen.

Der Begriff "struktureller Platzhalter" gilt insbesondere fuer die in 9.4 ausgewiesenen Bausteine B10 und B11.

#### 9.3 — Initial Structural Scope: Bausteine mit voller struktureller Vorsehung

Folgende Strukturbausteine sind als architektonisch erforderlich gelockt und muessen in der spaeteren Migration strukturell abgebildet werden. Sofern in einem Baustein konkrete Wertemengen, Datentypen oder Formen erwaehnt werden, sind diese als Arbeitsnamen aus den Locks 1 bis 8 zu lesen; die endgueltige schemaseitige Auspraegung bleibt Implementation.

- **B1 — Rule-Identitaet und Rule-Version-Identitaet:** Das in Frage 3 gelockte logische Rule-ID-Schema bleibt verbindlich: Rule-IDs folgen der Form `RULE-<DOMAIN>-<TOPIC>-<NNN>`. Die Rule-ID bezeichnet das fachliche Konzept; sie ist von der Version der Rule klar getrennt. Eine Rule-Version ist eine eigenstaendige Entitaet mit eigenem, von der Rule-ID unterschiedenem Identifier und einer Zugehoerigkeit zu genau einer Rule-ID.

  Nach finaler Festlegung darf eine Rule-ID nicht wiederverwendet, nicht umnummeriert und nicht inhaltlich reinterpretiert werden. Die Stabilitaet einer einmal festgelegten Rule-ID ist Teil der in Frage 3 gelockten ID-Semantik und bleibt durch Frage 9 unangetastet.

  Nicht in Frage 9 final gelockt werden:

  - die konkrete initiale Domain-Code-Wertemenge,
  - die konkrete initiale Topic-Code-Wertemenge,
  - die technische Speicher- und schemaseitige Repraesentationsform des Identifiers (einschliesslich Datentyp, Format-Validierung, interner Hilfsspalten).

  Diese Punkte bleiben spaetere Architektur- bzw. Implementation-Entscheidung und duerfen die in Frage 3 gelockte ID-Semantik nicht verletzen.

- **B2 — Rule-Version-Inhalt:** Eine Rule-Version traegt strukturierten, nicht-ausfuehrenden Inhalt. Dazu gehoeren insbesondere strukturierte Regelparameter, eine fachliche Beschreibung, Quellenbezuege und eine fachliche Begruendung oder Erlaeuterung. Die Wissensbasis enthaelt keine ausfuehrende Rule-Engine und keine Domain-Service-Logik. Die operative Anwendung von Rule-Versions liegt ausserhalb von F4-D1. Die konkrete Form der Persistierung des Rule-Version-Inhalts (relationale Unterstruktur, dokumentartige Persistierung, gemischter Ansatz) bleibt Implementation.
- **B3 — Quellen-Entitaet:** Quellen sind eigenstaendige Entitaeten mit einer Klassifikation entlang der `source_axis` (Arbeitsnamen aus 4.A: `official`, `internal`, `derived`, `literatur`) und einer feineren `source_kind`-Klassifikation. Konkrete Wertemenge der `source_kind` bleibt Implementation; sie ist konsistent mit der in 4.A getroffenen Kategorien-Logik zu waehlen.
- **B4 — Verknuepfung Rule-Version und Quelle:** Jede Rule-Version verfuegt ueber mindestens eine Quellen-Verknuepfung in der Rolle `grundlage`. Eine Rule-Version, die fachlich-rechtliche Wirkung entfaltet, traegt mindestens eine `grundlage`-Quelle mit `source_axis = official`. Quellen-Verknuepfungen koennen unterschiedliche Rollen tragen; die konkrete Wertemenge der Rollen bleibt Implementation.
- **B5 — Konflikt-Markierungs-Mechanik:** Eine Rule-Version kann Konflikt-Markierungen K1, K2, K3, K4 aus 4.B-2 tragen. Diese Markierungen werden strukturell persistiert und sind im Lifecycle-Modell aus 6.2 wirksam (konfliktbedingter Fall von `pending_review`). Die in 4.B-2 deferred Sub-Granularitaeten zu K4 (BStBl-II-Status, Existenz eines Nichtanwendungserlasses) und zu K2 (EU-Direktwirkungs-Merkmale) sind als Metadata strukturell vorzusehen; ihre konkrete schemaseitige Form bleibt Implementation.
- **B6 — Zwei zeitliche Achsen auf Rule-Version:** Jede Rule-Version traegt eine fachliche Geltungsperiode (Sachverhaltszeit) und eine systemische Geltungsperiode (Systemzeit) im Sinne von 5.1. Konkrete Range-Datentypen, Inklusionskonventionen, Default-Werte fuer offene Periodenenden, Eindeutigkeits- und Ueberlappungs-Bedingungen sowie erforderliche Datenbank-Extensions bleiben Implementation. Die Migration muss strukturell in der Lage sein, das Sachverhalts-Datum-bezogene Auswerten fachlicher Geltungsperioden zu unterstuetzen.
- **B7 — Quellen-Geltungsperiode und Quellen-Verifikations-Spur:** Jede Quelle traegt eine fachliche Geltungsperiode mono-temporal im Sinne von 5.1. Zusaetzlich wird eine Quellen-Verifikations-Spur strukturell vorgesehen, deren Form (Attribut, Sub-Entitaet, derived Wert) Implementation bleibt.
- **B8 — Lifecycle-Status und Lifecycle-Verlauf-Persistenz:** Jede Rule-Version traegt einen Lifecycle-Status aus 6.2 (Arbeitsnamen: `draft`, `pending_review`, `structural_invalid`, `active`, `superseded`, `revoked`). Konkrete Code-Repraesentation der Status (Enum-Werte, Bezeichner-Konventionen) bleibt Implementation. Der Lifecycle-Verlauf — die Spur frueherer Status-Werte einer Rule-Version — wird strukturell persistiert, sodass eine Rekonstruktion vergangener Status-Werte fuer Audit-Frage A aus 5.6 moeglich ist. Form der Persistenz bleibt Implementation.
- **B9 — Approval-Verlauf, fachliche Begruendung und Verantwortlichkeitsstufen-Anschluss:** Approval-Entscheidungen, die einen Lifecycle-Uebergang vollziehen, werden persistiert (7.6). Die fachliche Begruendung aus 7.4 wird strukturell persistiert. Der Initial-Scope muss die spaetere Zuordnung der fachlichen Verantwortlichkeitsstufen aus 7.2 zu konkreten Anwendungsrollen strukturell ermoeglichen, ohne diese Zuordnung selbst zu treffen. Konkrete Anwendungsrollen, Permissions, Row-Level-Security-Policies, Policy-Definitionen und technische Enforcement-Regeln bleiben Implementation. Approval-Verlauf und Lifecycle-Verlauf muessen miteinander verknuepfbar sein, sodass die in 8.3 AP2 geforderte Audit-A-Rekonstruktion strukturell moeglich bleibt.

#### 9.4 — Initial Structural Scope: Bausteine mit strukturellem Platzhalter

Folgende Strukturbausteine werden im Sinne von 9.2 als strukturelle Platzhalter im Initial-Scope vorgesehen. Sie sind architektonisch erforderlich; ihre konkrete schemaseitige Realisierung wird in einer spaeteren Implementation-Sitzung entschieden:

- **B10 — Quellen-Veralterungs-Hinweis-Mechanik:** Die in 6.5 beschriebene Hinweis-Mechanik fuer eine als veraltet gekennzeichnete Quelle und ihre Wirkung auf abhaengige Rule-Versions wird strukturell anerkannt. Form (Attribut der Rule-Version, separate Relations-Entitaet, derived Wert) bleibt Implementation.
- **B11 — Glossary und Wissensbasis-Verweis-Mechanik:** Die in Frage 2 gelockte Verweis-Moeglichkeit zwischen Glossary-Entries und Rule-Versions wird strukturell asymmetrisch anerkannt:

  - Verweis von einer Rule-Version auf einen geeigneten Glossary-Eintrag ist verpflichtend, sofern ein einschlaegiger Glossary-Eintrag existiert.
  - Verweis von einem Glossary-Eintrag auf eine Rule-Version ist optional.

  Die konkrete schemaseitige Form beider Verweis-Richtungen bleibt Implementation.

#### 9.5 — Aus dem Initial-Scope herausgenommen

Folgende Aspekte gehoeren ausdruecklich nicht zum Initial-Scope von F4-D1 und werden in spaeteren Architektur- oder Implementation-Entscheidungen behandelt:

- **B12 — Nachfolger-Beziehung zwischen Rule-Versionen:** Die in 6.2 und 7.7 als spaetere Modellierung deferred Nachfolger-Beziehung zwischen abloesender und abgeloester Rule-Version wird im Initial-Scope nicht modelliert. Die in 7.7 vorgesehene Behandlung — Korrektur ueber eine neue Rule-Version derselben Rule-ID — bleibt der einzige Regelweg in Phase 1.
- **R5-2 — Rule-Matching-Semantik bei Mehrdaten-Sachverhalten:** Der in 5.7 und 5.8 offen gehaltene Forward-Link bleibt offen. Der Initial-Scope sieht keine schemaseitigen Felder oder Metadaten vor, die eine bestimmte Rule-Matching-Semantik bei Mehrdaten-Sachverhalten vorwegnehmen. Eine spaetere Architektur-Entscheidung zu R5-2 erfolgt in einem eigenen Sub-Sprint.
- **Ausfuehrende Rule-Engine und Domain-Service-Ausfuehrung:** Der Initial-Scope schafft die Wissensbasis als strukturierte Persistenz- und Pflege-Schicht. Die operative Anwendung von Rule-Versions durch Domain-Services und die konkrete Ausgestaltung einer Rule-Engine sind nicht Teil von F4-D1.
- **Automatische Konfliktaufloesung, automatische Quellen-Vorrangentscheidung, automatische Aktualitaetsbewertung:** alle in 4.B-4, 6.5, 7.5 und 8.4 als ausgeschlossen gelockten maschinellen Entscheidungen bleiben ausgeschlossen.
- **Vollstaendige UI-Implementierung:** Die in Frage 8 gelockten Anzeige- und Vermeidungspflichten werden in spaeteren UI-Implementations-Sitzungen umgesetzt; Initial-Scope schafft nur die strukturelle Voraussetzung.
- **Externe Compliance-Zusicherungen:** Keine GoBD-, DSGVO-, Revisionssicherheits-Zusicherungen werden auf Ebene des Initial-Scope ausgesprochen. Die Wissensbasis ist konsistent mit den internen Architekturprinzipien aus Locks 1 bis 8; externe Zusicherungen sind keine Aussage des Initial-Scope.
- **Konkrete Rollen- und Permission-Implementierung:** Die in 7.9 forward-verlinkte Zuordnung der Verantwortlichkeitsstufen zu Anwendungsrollen wird strukturell ermoeglicht (B9), ihre konkrete technische Umsetzung (Anwendungsrollen, Permissions, Row-Level-Security-Policies, Policy-Definitionen, Enforcement-Regeln) bleibt Implementation.
- **Behandlung von `draft`-Versionen hinsichtlich Verwerfen, Loeschen oder Historisieren:** Frage 9 lockt keine Loesch-, Verwerfungs- oder Historisierungsregel fuer `draft`-Versionen. Der Initial-Scope muss lediglich beruecksichtigen, dass `draft`-Versionen existieren und dass ihre spaetere Behandlung strukturell entscheidbar bleibt. Die konkrete Behandlung bleibt spaetere Workflow- und Persistenz-Entscheidung in Verbindung mit Frage 7 und nachgelagerten Implementation-Sitzungen.
- **Ausnahme- und Korrekturmechanismen fuer Rueckkehr-Uebergaenge aus `superseded` oder `revoked`:** Aus 7.7 deferred zu spaeterer ausdruecklicher Architekturentscheidung, nicht in F4-D1.
- **Mandanten- oder kanzleispezifische Erweiterung der `internal`-Wissensbasis:** Keine Aussage des Initial-Scope; spaetere Architektur-Entscheidung, falls und sobald ein konkreter Bedarf entsteht.

#### 9.6 — Strukturelle Position zu offenen Punkten aus Fragen 6 und 7

Folgende in Frage 6 und Frage 7 offen gelassene Punkte werden in Frage 9 strukturell wie folgt positioniert, ohne dass damit Workflow- oder Loesch-Regeln gelockt werden:

- **Nicht-inhaltliche Aktualisierungen einer Quelle:** Nicht-inhaltliche Aktualisierungen einer Quelle (z. B. die Korrektur einer URL ohne fachliche Aenderung) loesen im Initial-Scope keinen Lifecycle-Uebergang einer abhaengigen Rule-Version aus. Eine Audit-Spur auf Quellen-Ebene ueber solche Aktualisierungen bleibt in der Quellen-Verifikations-Spur (B7) strukturell abbildbar.
- **Verknuepfung Lifecycle-Verlauf und Approval-Verlauf:** Beide Verlaeufe werden strukturell persistiert; ihre konkrete schemaseitige Kopplung (gemeinsame Entitaet, getrennte Entitaeten mit Verweisen, derived Sicht) bleibt Implementation. Die in 8.3 AP2 verlangte Audit-A-Rekonstruktion muss strukturell unterstuetzt bleiben.

#### 9.7 — Mandantenfaehigkeit der Wissensbasis

Die fachlich-rechtliche Wissensbasis wird in Phase 1 mandantenuebergreifend innerhalb der jeweiligen Kanzlei-, Company- beziehungsweise Tenant-Grenze gefuehrt. Sie ist nicht je Mandant separat.

Diese Festlegung ist nicht als eine ueber die Kanzlei-, Company- oder Tenant-Grenze hinausreichende globale Datenfreigabe zu verstehen. Die ueblichen Mandantenfaehigkeits- und Tenantgrenzen aus der Projekt-Architektur bleiben unberuehrt.

Mandanten- oder kanzleispezifische interne Policy-Eintraege im Sinne von `source_axis = internal` und ihre etwaige spaetere Mandanten- oder Kanzlei-Spezifizierung sind keine Aussage des Initial-Scope; sie bleiben einer spaeteren Architektur-Entscheidung vorbehalten.

#### 9.8 — Was bewusst NICHT in Frage 9 gelockt wird

- Konkrete SQL-Syntax, Tabellen-DDL, Constraint-Definitionen, Index-Definitionen, Datenbank-Extensions, Migration-Reihenfolge, Migration-Nummern, Datei-Pfade.
- Konkrete initiale Domain-Code-Wertemenge und konkrete initiale Topic-Code-Wertemenge im Sinne der Frage-3-Rule-ID-Semantik. Diese Wertemengen bleiben nicht final gelockt; sie muessen spaeter unter Beachtung der in Frage 3 gelockten ID-Semantik entschieden werden. Insbesondere duerfen Steuerart, Pflichtart und Regelwerk nicht auf derselben Domain-Ebene vermischt werden.
- Konkrete technische Speicher- und schemaseitige Repraesentationsform des Rule-Identifiers.
- Konkrete Wertemenge der `source_kind` ueber die in 4.A gelockte Kategorien-Logik hinaus.
- Konkrete Code-Repraesentation der Lifecycle-Status (Enum-Werte, Bezeichner-Konventionen).
- Konkrete Form der Konflikt-Markierungen und ihrer Sub-Granularitaet.
- Konkrete Range-Datentypen, Inklusionskonventionen und Default-Werte fuer die zeitlichen Achsen.
- Konkrete Form der Quellen-Verifikations-Spur und des Quellen-Veralterungs-Hinweises.
- Konkrete Form der Glossary- und Wissensbasis-Verweise.
- Konkrete Kopplungs-Form zwischen Lifecycle-Verlauf und Approval-Verlauf.
- Konkrete Anwendungsrollen, Row-Level-Security-Policies, Permission-Strukturen, technische Enforcement-Regeln.
- Konkrete UI-Komponenten, Screens, Wording, visuelle Auspraegungen.
- Loesch-, Verwerfungs- oder Historisierungsregel fuer `draft`-Versionen.
- B12 (Nachfolger-Beziehung zwischen Rule-Versionen).
- R5-2 (Rule-Matching-Semantik bei Mehrdaten-Sachverhalten).
- Ausnahme- und Korrekturmechanismen fuer Rueckkehr-Uebergaenge aus `superseded` oder `revoked`.
- Mandanten- oder kanzleispezifische Erweiterung der `internal`-Wissensbasis.
- S6-Final-Konsolidierung in ein V1.0-Artefakt und F-Register-Eintragung — eigene spaetere Sitzung, nicht Teil von Frage 9.

#### 9.9 — Forward-Links

- Spaetere Implementation-Sitzungen (ausserhalb F4-D1): konkrete schemaseitige Realisierung aller in 9.3 und 9.4 strukturell gelockten Bausteine, einschliesslich SQL-Syntax, Migrations-Reihenfolge, Index- und Extension-Entscheidungen sowie konkreter Wertemengen aller Arbeitsnamen-Enums.
- Spaetere Festlegung der initialen Domain-Code- und Topic-Code-Wertemengen unter Beachtung der in Frage 3 gelockten Rule-ID-Semantik. Diese Festlegung darf Steuerart, Pflichtart und Regelwerk nicht auf derselben Domain-Ebene vermischen.
- Spaetere UI-Implementations-Sitzungen: konkrete Umsetzung der in Frage 8 gelockten Anzeige- und Vermeidungspflichten.
- Spaetere Workflow- und Persistenz-Entscheidungen: Behandlung von `draft`-Versionen, Solo- bzw. Klein-Personalkonstellationen-Enforcement im Sinne von 7.3, Workflow zur Strukturfehler-Behebung im Status `structural_invalid`.
- Spaetere Architektur-Sub-Sprints: R5-2 (Rule-Matching bei Mehrdaten-Sachverhalten), Nachfolger-Beziehung zwischen Rule-Versionen, Ausnahme- und Korrekturmechanismen fuer Rueckkehr-Uebergaenge aus `superseded` oder `revoked`, Mandanten- oder kanzleispezifische Erweiterung der `internal`-Wissensbasis.
- S6-Final: spaetere eigene Sitzung zur Konsolidierung aller F4-D1-Locks (Fragen 1 bis 9) in ein V1.0-Artefakt und zur Spiegel-Eintragung in F-Register Section 3.14. S6-Final ist nicht Teil von Frage 9 und wird gesondert entschieden.
- Offener Forward-Link R5-2 bleibt unveraendert offen.

## 8. Forward-Links

Die folgenden Punkte bleiben aus dem F4-D1-Scope ausdruecklich offen oder herausgenommen und sind nicht Teil dieses Lock-Buffers:

- **R5-2** — Rule-Matching-Semantik bei Mehrdaten-Sachverhalten: Forward-Link unveraendert offen; eigener spaeterer Sub-Sprint.
- **B12** — Nachfolger-Beziehung zwischen Rule-Versionen: aus dem Initial-Scope der Wissensbasis herausgenommen; spaetere ausdrueckliche Architektur-Entscheidung.
- **Ausnahme- und Korrekturmechanismen fuer Rueckkehr-Uebergaenge aus `superseded` oder `revoked`:** spaetere ausdrueckliche Architektur-Entscheidung; nicht Teil dieses Dokuments.
- **Mandanten- oder kanzleispezifische Erweiterung der `internal`-Wissensbasis:** spaetere Architektur-Entscheidung; nicht Teil dieses Dokuments.

## 9. STOP-Hinweise

- Dieser Lock-Buffer darf nicht als Implementation-Spec verstanden werden. Er enthaelt keine Schema-Definitionen, keine SQL-, keine Code-, keine Migration- und keine UI-Vorgaben.
- Frage 9 lockt einen Structural Scope, keine Migration. Aus Frage 9 sind keine Migrations-Reihenfolgen, Datentypen, Index- oder Extension-Entscheidungen ableitbar.
- Aus diesem Dokument darf keine ausfuehrende Rule-Engine abgeleitet werden.
- Aus diesem Dokument darf keine Domain-Service-Ausfuehrung abgeleitet werden.
- Aus diesem Dokument darf keine automatische Konfliktloesung abgeleitet werden.
- Aus diesem Dokument darf keine automatische Quellen-Vorrangentscheidung abgeleitet werden.
- In diesem Dokument findet keine S6-Final-Konsolidierung statt. Die Konsolidierung in ein V1.0-Artefakt und die Spiegel-Eintragung in F-Register Section 3.14 sind Gegenstand einer eigenen spaeteren Sitzung.
- Dieses Dokument ist kein Bestandteil des F-Registers und wird nicht als V1.0-Artefakt gefuehrt.
