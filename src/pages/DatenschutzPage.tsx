// Datenschutzerklärung-Scaffold gem. Art. 13/14 DSGVO.
//
// !!! Dies ist KEINE fertige Datenschutzerklärung. Die Struktur dient als
// Platzhalter; die reale Erklärung muss der Kanzlei-Betreiber durch einen
// Fachanwalt für IT-Recht oder Datenschutzbeauftragten erstellen/prüfen
// lassen. Eine fehlerhafte oder fehlende Erklärung ist nach DSGVO Art. 83
// bußgeldbewehrt.

import { AlertTriangle } from "lucide-react";
import PublicShell from "../components/PublicShell";
import "./InfoPages.css";

export default function DatenschutzPage() {
  return (
    <PublicShell>
      <div className="container info">
        <header className="info__head">
          <span className="info__eyebrow">Rechtliches</span>
          <h1>Datenschutzerklärung</h1>
          <p>Informationen nach Art. 13, 14 und 21 DSGVO.</p>
        </header>

        <div
          role="alert"
          style={{
            borderLeft: "4px solid #c0392b",
            background: "#fdecea",
            color: "#78281f",
            padding: "14px 16px",
            borderRadius: 8,
            margin: "20px 0",
            display: "flex",
            gap: 10,
            alignItems: "flex-start",
          }}
        >
          <AlertTriangle size={20} style={{ flexShrink: 0, marginTop: 2 }} />
          <div>
            <strong style={{ display: "block", marginBottom: 4 }}>
              Platzhalter — nicht rechtsverbindlich
            </strong>
            Dieses Dokument muss von einer qualifizierten Fachperson
            (Fachanwalt für IT-Recht oder Datenschutzbeauftragten) erstellt
            oder geprüft werden. Die hier vorhandene Struktur dient nur als
            Platzhalter. Eine fehlerhafte oder fehlende Datenschutzerklärung
            ist nach Art. 83 DSGVO bußgeldbewehrt.
          </div>
        </div>

        <section className="card" style={{ padding: 20, margin: "20px 0" }}>
          <h2>1. Verantwortliche Stelle (Art. 4 Nr. 7 DSGVO)</h2>
          <p style={{ color: "var(--muted)" }}>
            <em>TODO — Name, Anschrift, Kontaktdaten des Verantwortlichen.</em>
          </p>

          <h2>2. Datenschutzbeauftragter (Art. 37 DSGVO)</h2>
          <p style={{ color: "var(--muted)" }}>
            <em>
              TODO — Kontaktdaten des DSB, falls Benennungspflicht besteht
              (&gt; 20 MA, besondere Kategorien, § 38 BDSG).
            </em>
          </p>

          <h2>3. Art, Umfang und Zweck der Verarbeitung</h2>
          <p style={{ color: "var(--muted)" }}>
            <em>
              TODO — Welche Daten werden zu welchem Zweck verarbeitet (Login,
              Mandantenverwaltung, Buchhaltung, Lohnabrechnung, OCR usw.).
            </em>
          </p>

          <h2>4. Rechtsgrundlage (Art. 6 DSGVO)</h2>
          <p style={{ color: "var(--muted)" }}>
            <em>
              TODO — Art. 6 Abs. 1 lit. b (Vertrag), lit. c (gesetzliche
              Pflicht, z.B. § 147 AO), lit. f (berechtigtes Interesse).
            </em>
          </p>

          <h2>5. Empfänger und Auftragsverarbeiter (Art. 28 DSGVO)</h2>
          <p style={{ color: "var(--muted)" }}>
            <em>
              TODO — Auflistung eingesetzter Dienstleister (z.B. Supabase
              für Hosting/DB, Sentry für Error-Tracking, ggf. GA4/Plausible),
              mit Standort und abgeschlossenem AVV.
            </em>
          </p>

          <h2>6. Drittlandübermittlung (Art. 44 ff. DSGVO)</h2>
          <p style={{ color: "var(--muted)" }}>
            <em>
              TODO — Übermittlung außerhalb EU/EWR, Rechtsgrundlage
              (Angemessenheitsbeschluss / SCC / BCR).
            </em>
          </p>

          <h2>7. Speicherdauer</h2>
          <p style={{ color: "var(--muted)" }}>
            <em>
              TODO — Aufbewahrungsfristen nach § 147 AO (8-10 Jahre),
              § 257 HGB, Löschkonzept für nicht-retentionspflichtige Daten.
            </em>
          </p>

          <h2>8. Betroffenenrechte (Art. 15-21 DSGVO)</h2>
          <p style={{ color: "var(--muted)" }}>
            <em>
              TODO — Auskunft, Berichtigung, Löschung, Einschränkung,
              Datenübertragbarkeit, Widerspruch. Hinweise wie diese
              ausgeübt werden können.
            </em>
          </p>

          <h2>9. Widerrufsrecht bei Einwilligungen (Art. 7 Abs. 3 DSGVO)</h2>
          <p style={{ color: "var(--muted)" }}>
            <em>TODO — Cookie-Einwilligung jederzeit widerrufbar.</em>
          </p>

          <h2>10. Beschwerderecht bei der Aufsichtsbehörde (Art. 77 DSGVO)</h2>
          <p style={{ color: "var(--muted)" }}>
            <em>
              TODO — zuständige Landes-Datenschutzbehörde nennen.
            </em>
          </p>

          <h2>11. Cookies und Tracking (TTDSG § 25)</h2>
          <p style={{ color: "var(--muted)" }}>
            <em>
              TODO — technisch notwendige Cookies (Session, Login),
              optionale Analyse-Cookies (nur nach Einwilligung). Die
              Einwilligung kann im Cookie-Banner erteilt oder widerrufen
              werden.
            </em>
          </p>

          <h2>12. Server-Logs</h2>
          <p style={{ color: "var(--muted)" }}>
            <em>
              TODO — vom Host-Provider automatisch erfasste Zugriffsdaten,
              Rechtsgrundlage Art. 6 Abs. 1 lit. f DSGVO.
            </em>
          </p>

          <h2>13. Hosting</h2>
          <p style={{ color: "var(--muted)" }}>
            <em>TODO — Host-Provider, Serverstandort, abgeschlossener AVV.</em>
          </p>

          <h2>14. Automatisierte Entscheidungsfindung</h2>
          <p style={{ color: "var(--muted)" }}>
            <em>
              TODO — Aussage, ob eine automatisierte Entscheidungsfindung
              i.S.d. Art. 22 DSGVO stattfindet.
            </em>
          </p>

          <h2>15. Stand der Erklärung</h2>
          <p style={{ color: "var(--muted)" }}>
            <em>TODO — Versionsdatum der Erklärung.</em>
          </p>
        </section>
      </div>
    </PublicShell>
  );
}
