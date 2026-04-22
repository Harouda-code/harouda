// Impressum-Scaffold gem. § 5 TMG + § 18 MStV.
//
// !!! Dies ist ausdrücklich KEIN fertiges Impressum. Die Struktur dient
// als Platzhalter; das reale Impressum muss der Kanzlei-Betreiber mit
// juristisch geprüften Angaben füllen.
//
// Das Scaffold zeigt die Pflichtabschnitte an — Fehlen oder falsche
// Angaben sind abmahnfähig (§ 5 Abs. 1 TMG i.V.m. § 3a UWG).

import { AlertTriangle } from "lucide-react";
import PublicShell from "../components/PublicShell";
import "./InfoPages.css";

export default function ImpressumPage() {
  return (
    <PublicShell>
      <div className="container info">
        <header className="info__head">
          <span className="info__eyebrow">Rechtliches</span>
          <h1>Impressum</h1>
          <p>Anbieterkennzeichnung nach § 5 TMG und § 18 MStV.</p>
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
            Platzhalter. Ein fehlerhaftes oder fehlendes Impressum ist nach
            § 3a UWG abmahnfähig.
          </div>
        </div>

        <section className="card" style={{ padding: 20, margin: "20px 0" }}>
          <h2>Angaben gemäß § 5 TMG</h2>
          <p style={{ color: "var(--muted)" }}>
            <em>TODO — vollständige Firmen-/Kanzleibezeichnung, Anschrift.</em>
          </p>

          <h2>Vertreten durch</h2>
          <p style={{ color: "var(--muted)" }}>
            <em>TODO — vertretungsberechtigte Person(en).</em>
          </p>

          <h2>Kontakt</h2>
          <p style={{ color: "var(--muted)" }}>
            <em>TODO — Telefon, E-Mail.</em>
          </p>

          <h2>Umsatzsteuer-ID</h2>
          <p style={{ color: "var(--muted)" }}>
            <em>TODO — USt-IdNr. gem. § 27 a UStG.</em>
          </p>

          <h2>Berufsrechtliche Angaben</h2>
          <ul style={{ color: "var(--muted)" }}>
            <li><em>TODO — Berufsbezeichnung (z.B. Steuerberater)</em></li>
            <li><em>TODO — Verliehen in (Bundesland)</em></li>
            <li><em>TODO — Zuständige Kammer (z.B. StBK Berlin)</em></li>
            <li><em>TODO — Berufsrechtliche Regelungen (StBerG, DVStB, BOStB, StBGebV)</em></li>
          </ul>

          <h2>Aufsichtsbehörde</h2>
          <p style={{ color: "var(--muted)" }}>
            <em>TODO — zuständige Steuerberaterkammer.</em>
          </p>

          <h2>Berufshaftpflichtversicherung</h2>
          <p style={{ color: "var(--muted)" }}>
            <em>TODO — Versicherer, Geltungsbereich, Versicherungssumme.</em>
          </p>

          <h2>Verantwortlich für journalistisch-redaktionelle Inhalte (§ 18 Abs. 2 MStV)</h2>
          <p style={{ color: "var(--muted)" }}>
            <em>TODO — falls zutreffend.</em>
          </p>

          <h2>EU-Streitschlichtung</h2>
          <p style={{ color: "var(--muted)" }}>
            <em>TODO — Hinweis auf OS-Plattform der Europäischen Kommission.</em>
          </p>

          <h2>Verbraucherstreitbeilegung</h2>
          <p style={{ color: "var(--muted)" }}>
            <em>TODO — Aussage nach § 36 VSBG (teilnahmebereit ja/nein).</em>
          </p>

          <h2>Haftungsausschluss</h2>
          <p style={{ color: "var(--muted)" }}>
            <em>TODO — Haftung für Inhalte, Links, Urheberrecht.</em>
          </p>
        </section>
      </div>
    </PublicShell>
  );
}
