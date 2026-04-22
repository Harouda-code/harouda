import type { ReactElement } from "react";
import { Check, Info, Minus, Scale, X } from "lucide-react";
import PublicShell from "../components/PublicShell";
import "./InfoPages.css";
import "./VergleichPage.css";

type State = "ja" | "nein" | "teilweise" | "unbekannt";

type Row = {
  kategorie: string;
  merkmal: string;
  harouda: State;
  harouda_note?: string;
  datev: State;
  datev_note?: string;
  lexware: State;
  lexware_note?: string;
  sevdesk: State;
  sevdesk_note?: string;
};

// Die Spaltenwerte für DATEV / Lexware / SevDesk beruhen auf Stand April 2026
// öffentlich einsehbarer Produktbeschreibungen der Hersteller. Sie sind
// keine eigene technische Prüfung und können sich jederzeit ändern. Bei
// Unsicherheit setzen wir bewusst „unbekannt".
const ROWS: Row[] = [
  // Buchhaltung
  {
    kategorie: "Buchhaltung",
    merkmal: "Doppelte Buchführung mit SKR03-Kontenplan",
    harouda: "ja",
    harouda_note: "SKR03-Seed enthalten; SKR04 nicht.",
    datev: "ja",
    lexware: "ja",
    sevdesk: "ja",
  },
  {
    kategorie: "Buchhaltung",
    merkmal: "EÜR-Berechnung mit Zeilen-Mapping",
    harouda: "ja",
    harouda_note: "SKR03-Mapping auf Anlage-EÜR-Zeilen dokumentiert.",
    datev: "ja",
    lexware: "ja",
    sevdesk: "ja",
  },
  {
    kategorie: "Buchhaltung",
    merkmal: "GuV / BWA / SuSa",
    harouda: "ja",
    datev: "ja",
    lexware: "ja",
    sevdesk: "teilweise",
    sevdesk_note: "BWA lt. Hersteller erst in höheren Tarifen",
  },
  {
    kategorie: "Buchhaltung",
    merkmal: "Bilanz (§ 266 HGB)",
    harouda: "nein",
    harouda_note: "Nur EÜR, keine Bilanzrechnung.",
    datev: "ja",
    lexware: "ja",
    sevdesk: "teilweise",
  },
  {
    kategorie: "Buchhaltung",
    merkmal: "Lohnbuchhaltung",
    harouda: "nein",
    harouda_note: "Bewusst außerhalb des Umfangs.",
    datev: "ja",
    lexware: "ja",
    sevdesk: "nein",
  },

  // Steuern
  {
    kategorie: "Steuern",
    merkmal: "Ausfüllhilfen: Anlage N / S / G / V / SO / AUS / Kind / Vorsorge / R / KAP",
    harouda: "ja",
    harouda_note: "Oberfläche und Rechenlogik, KEIN Versand an ELSTER.",
    datev: "ja",
    lexware: "teilweise",
    sevdesk: "nein",
  },
  {
    kategorie: "Steuern",
    merkmal: "ELSTER-Abgabe per ERiC",
    harouda: "nein",
    harouda_note: "ERiC-Bibliothek bewusst nicht eingebunden.",
    datev: "ja",
    lexware: "ja",
    sevdesk: "teilweise",
    sevdesk_note: "Direktübertragung je nach Tarif",
  },
  {
    kategorie: "Steuern",
    merkmal: "UStVA-Berechnung inkl. Dauerfristverlängerung",
    harouda: "ja",
    harouda_note: "Vorbereitung + CSV-Export; keine Übertragung.",
    datev: "ja",
    lexware: "ja",
    sevdesk: "ja",
  },
  {
    kategorie: "Steuern",
    merkmal: "Gewerbesteuer-/KSt-Berechnung (Kapitalgesellschaften)",
    harouda: "teilweise",
    harouda_note: "Rechenseiten vorhanden; keine Verprobung gegen FA-Bescheid.",
    datev: "ja",
    lexware: "teilweise",
    sevdesk: "nein",
  },

  // Belege / Rechnungen
  {
    kategorie: "Belege & Rechnungen",
    merkmal: "ZUGFeRD / Factur-X / XRechnung lesen",
    harouda: "ja",
    harouda_note: "CII-Reader für PDF/A-3-Anhang und reine XML.",
    datev: "ja",
    lexware: "ja",
    sevdesk: "ja",
  },
  {
    kategorie: "Belege & Rechnungen",
    merkmal: "XRechnung (CII) erzeugen",
    harouda: "ja",
    harouda_note: "Formular + XML-Writer; keine automatische XSD-Validierung.",
    datev: "ja",
    lexware: "ja",
    sevdesk: "ja",
  },
  {
    kategorie: "Belege & Rechnungen",
    merkmal: "Beleg-OCR mit Positionen-Extraktion",
    harouda: "nein",
    harouda_note: "Keine OCR im aktuellen Build.",
    datev: "ja",
    lexware: "ja",
    sevdesk: "ja",
  },

  // Bank
  {
    kategorie: "Bank",
    merkmal: "Bankimport CAMT.053 / MT940 / CSV",
    harouda: "ja",
    harouda_note: "Parser für alle drei Formate vorhanden.",
    datev: "ja",
    lexware: "ja",
    sevdesk: "ja",
  },
  {
    kategorie: "Bank",
    merkmal: "PSD2-Onlinebanking (FinAPI / Tink)",
    harouda: "nein",
    harouda_note: "Bewusst außerhalb des Umfangs.",
    datev: "ja",
    lexware: "ja",
    sevdesk: "ja",
  },

  // Multi-Mandant / Team
  {
    kategorie: "Mehrnutzer & Mehrmandanten",
    merkmal: "Mehrere Mandanten pro Installation",
    harouda: "ja",
    datev: "ja",
    lexware: "teilweise",
    lexware_note: "je nach Produktlinie",
    sevdesk: "ja",
  },
  {
    kategorie: "Mehrnutzer & Mehrmandanten",
    merkmal: "Rollenkonzept (Owner/Admin/Member/Readonly)",
    harouda: "ja",
    harouda_note: "Via Supabase-RLS (Produktiv) bzw. lokal deaktiviert (Demo).",
    datev: "ja",
    lexware: "ja",
    sevdesk: "ja",
  },

  // Schnittstellen / Export
  {
    kategorie: "Schnittstellen",
    merkmal: "DATEV EXTF v700 Buchungsstapel-Export",
    harouda: "teilweise",
    harouda_note:
      "Shape-kompatibler CSV-Export; keine DATEV-Zertifizierung.",
    datev: "ja",
    datev_note: "nativ",
    lexware: "ja",
    sevdesk: "ja",
  },
  {
    kategorie: "Schnittstellen",
    merkmal: "GDPdU / IDEA-Export inkl. index.xml",
    harouda: "ja",
    datev: "ja",
    lexware: "ja",
    sevdesk: "teilweise",
  },
  {
    kategorie: "Schnittstellen",
    merkmal: "Offene Rest-API / Webhooks",
    harouda: "nein",
    datev: "ja",
    lexware: "teilweise",
    sevdesk: "ja",
  },

  // Compliance / Datenhaltung
  {
    kategorie: "Compliance",
    merkmal: "Audit-Log mit Hash-Kette",
    harouda: "ja",
    harouda_note: "SHA-256 Chain, clientseitig verifiable.",
    datev: "unbekannt",
    datev_note: "nicht öffentlich dokumentiert",
    lexware: "unbekannt",
    sevdesk: "unbekannt",
  },
  {
    kategorie: "Compliance",
    merkmal: "GoBD-Zertifikat eines unabhängigen Prüfers",
    harouda: "nein",
    harouda_note: "Keine Zertifizierung. GoBD-orientiert, nicht -geprüft.",
    datev: "ja",
    lexware: "ja",
    sevdesk: "teilweise",
  },
  {
    kategorie: "Compliance",
    merkmal: "Betrieb on-premise / lokal (ohne Cloud)",
    harouda: "ja",
    harouda_note: "Demo-Build läuft rein im Browser/localStorage.",
    datev: "teilweise",
    datev_note: "DATEV-Rechenzentrum üblich",
    lexware: "teilweise",
    sevdesk: "nein",
  },
];

const HEAD_LABEL: Record<State, string> = {
  ja: "Ja",
  nein: "Nein",
  teilweise: "Teilweise",
  unbekannt: "k. A.",
};

function StateCell({ state, note }: { state: State; note?: string }) {
  let icon: ReactElement;
  let cls = "vergleich__cell";
  if (state === "ja") {
    icon = <Check size={14} />;
    cls += " is-yes";
  } else if (state === "nein") {
    icon = <X size={14} />;
    cls += " is-no";
  } else if (state === "teilweise") {
    icon = <Minus size={14} />;
    cls += " is-partial";
  } else {
    icon = <Info size={14} />;
    cls += " is-unknown";
  }
  return (
    <td className={cls}>
      <div className="vergleich__state">
        {icon} <span>{HEAD_LABEL[state]}</span>
      </div>
      {note && <div className="vergleich__note">{note}</div>}
    </td>
  );
}

export default function VergleichPage() {
  const byKategorie = ROWS.reduce((m, r) => {
    const arr = m.get(r.kategorie) ?? [];
    arr.push(r);
    m.set(r.kategorie, arr);
    return m;
  }, new Map<string, Row[]>());

  return (
    <PublicShell>
      <div className="container info vergleich">
        <header className="info__head">
          <span className="info__eyebrow">
            <Scale size={14} />
            Ehrlicher Vergleich
          </span>
          <h1>harouda-app neben DATEV, Lexware, SevDesk</h1>
          <p>
            Kein Marketing-Vergleich, sondern eine nachprüfbare Gegenüberstellung.
            Jede Zeile ist ein konkretes Merkmal mit vier Spalten.
            <strong> „Ja" für harouda-app</strong> heißt: im aktuellen Build
            vorhanden und nutzbar. „Ja" für einen Wettbewerber beruht auf
            dessen öffentlich zugänglichen Produktbeschreibungen (Stand April
            2026) — wir haben diese Konkurrenzprodukte nicht selbst zertifiziert.
          </p>
        </header>

        <aside className="info__note vergleich__hinweis">
          <div>
            <strong>Was dieser Vergleich NICHT ist:</strong>
            <ul>
              <li>keine Aussage über Preis/Leistung</li>
              <li>keine Empfehlung gegen die Konkurrenzprodukte</li>
              <li>keine Aussage über Stabilität, Skalierbarkeit oder
                  Support-Qualität im laufenden Betrieb</li>
              <li>kein Vergleich von Lohnbuchhaltung, Kassenbuch oder
                  branchenspezifischen Modulen</li>
            </ul>
          </div>
        </aside>

        {Array.from(byKategorie.entries()).map(([kat, rows]) => (
          <section key={kat} className="card vergleich__section">
            <h2>{kat}</h2>
            <div className="vergleich__table-wrap">
              <table className="vergleich__table">
                <thead>
                  <tr>
                    <th style={{ width: "34%" }}>Merkmal</th>
                    <th>harouda-app</th>
                    <th>DATEV</th>
                    <th>Lexware</th>
                    <th>SevDesk</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r, i) => (
                    <tr key={i}>
                      <td className="vergleich__merkmal">{r.merkmal}</td>
                      <StateCell state={r.harouda} note={r.harouda_note} />
                      <StateCell state={r.datev} note={r.datev_note} />
                      <StateCell state={r.lexware} note={r.lexware_note} />
                      <StateCell state={r.sevdesk} note={r.sevdesk_note} />
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        ))}

        <section className="card vergleich__section">
          <h2>Was harouda-app klar NICHT kann</h2>
          <ul className="vergleich__limits">
            <li>
              <strong>Kein ELSTER-Versand.</strong> Alle Steuerformulare sind
              Ausfüllhilfen. Die Abgabe beim Finanzamt erfolgt weiterhin über
              ELSTER-Portal oder ein zertifiziertes Steuerprogramm.
            </li>
            <li>
              <strong>Keine DATEV-Zertifizierung.</strong> Der Buchungsstapel-
              Export ist lediglich shape-kompatibel zum öffentlich
              dokumentierten EXTF-v700-Format.
            </li>
            <li>
              <strong>Keine Lohnbuchhaltung.</strong> Lohn, DEÜV-Meldungen,
              SV-Pflichten, A1-Bescheinigungen sind ausdrücklich nicht Teil
              des Produkts.
            </li>
            <li>
              <strong>Kein PSD2-Onlinebanking.</strong> Umsätze werden über
              CAMT.053-, MT940- oder CSV-Import geladen, nicht per PSD2-API.
            </li>
            <li>
              <strong>Kein Beleg-OCR.</strong> Belege können hochgeladen
              werden, werden aber nicht automatisch auf Positionen oder
              Beträge ausgelesen.
            </li>
            <li>
              <strong>Keine unabhängige GoBD-Prüfung.</strong> Der Audit-Log
              ist tamper-evident (Hash-Kette), aber nicht von einem Prüfer
              zertifiziert.
            </li>
          </ul>
        </section>

        <section className="card vergleich__section">
          <h2>Wofür harouda-app gedacht ist</h2>
          <p>
            Kleine Steuer- und Buchhaltungsprojekte, für die ein vollständig
            lokaler, nachvollziehbarer und minimal-invasiver Betrieb wichtiger
            ist als ein vollständiger Funktionsumfang einer Paket-Suite.
            Ideal als&nbsp;
            <strong>Zweit-Tool</strong> neben einer zertifizierten
            Hauptlösung oder als Lehr-/Lernumgebung für Buchführung,
            EÜR-Kontenmapping und E-Rechnung.
          </p>
        </section>

        <aside className="info__note">
          <strong>Fehler gefunden?</strong> Wenn eine Zeile falsch ist —
          entweder bei harouda-app oder bei einem der Konkurrenzprodukte —
          schreiben Sie uns. Der Vergleich wird nur dann aktualisiert, wenn
          wir den Hinweis gegen eine öffentliche Quelle nachprüfen können.
        </aside>
      </div>
    </PublicShell>
  );
}
