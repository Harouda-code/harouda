import { useState, type FormEvent } from "react";
import { Mail, MapPin, Phone, Send } from "lucide-react";
import { toast } from "sonner";
import PublicShell from "../components/PublicShell";
import "./InfoPages.css";

export default function KontaktPage() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    thema: "",
    nachricht: "",
  });

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.nachricht.trim()) {
      toast.error("Bitte Name, E-Mail und Nachricht ausfüllen.");
      return;
    }
    toast.info(
      "Demo-Modus: Das Formular hat keinen echten Empfänger. Für echte Kontaktaufnahme siehe Hinweis unten."
    );
  }

  return (
    <PublicShell>
      <div className="container info">
        <header className="info__head">
          <span className="info__eyebrow">
            <Mail size={14} />
            Kontakt
          </span>
          <h1>Schreiben Sie uns</h1>
          <p>
            Fragen zu Funktionen, Architektur, Lizenzierungspfaden oder eine
            konkrete Anfrage zur Zusammenarbeit — wir freuen uns über
            Rückmeldungen.
          </p>
        </header>

        <form className="card info__contact" onSubmit={handleSubmit}>
          <div className="info__contact-form">
            <label>
              Name
              <input
                required
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Ihr Name"
              />
            </label>
            <label>
              E-Mail
              <input
                type="email"
                required
                value={form.email}
                onChange={(e) =>
                  setForm((f) => ({ ...f, email: e.target.value }))
                }
                placeholder="name@beispiel.de"
              />
            </label>
            <label>
              Thema
              <input
                value={form.thema}
                onChange={(e) =>
                  setForm((f) => ({ ...f, thema: e.target.value }))
                }
                placeholder="z. B. Zertifizierungsgespräch"
              />
            </label>
            <label>
              Nachricht
              <textarea
                required
                value={form.nachricht}
                onChange={(e) =>
                  setForm((f) => ({ ...f, nachricht: e.target.value }))
                }
                placeholder="Was möchten Sie besprechen?"
              />
            </label>
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-block"
            style={{ marginTop: 16 }}
          >
            <Send size={16} />
            Nachricht senden
          </button>

          <div className="info__contact-meta">
            <div>
              <strong>E-Mail</strong>
              <span>kontakt@harouda-demo.local</span>
            </div>
            <div>
              <strong>Telefon</strong>
              <span>— (Demo-Paket, keine Hotline)</span>
            </div>
            <div>
              <strong>Anschrift</strong>
              <span>
                Demo-Version
                <br />
                keine operative Adresse
              </span>
            </div>
          </div>
        </form>

        <aside className="info__note">
          <strong>Wichtig:</strong> Das Kontaktformular in dieser Demo hat
          keinen realen Empfänger. E-Mail-Adresse und Anschrift oben sind
          Platzhalter. Für eine echte Gesprächsanbahnung nutzen Sie bitte
          den im Rahmen des Pakets vereinbarten Kanal (siehe
          <code> docs/README-DEMO.md</code>).
        </aside>

        <div
          className="info__grid"
          style={{ marginTop: 36 }}
          aria-label="Kontakt-Alternativen"
        >
          <article className="card info__card">
            <div className="info__card-icon">
              <Mail size={22} strokeWidth={1.75} />
            </div>
            <h3>Für Fachprüfer:innen</h3>
            <p>
              Die Verfahrensdokumentations-Vorlage in{" "}
              <code>docs/verfahrensdokumentation.md</code> ist ein guter
              Einstiegspunkt. Die Compliance-Roadmap listet alle offenen
              Zertifizierungspfade.
            </p>
          </article>
          <article className="card info__card">
            <div className="info__card-icon">
              <Phone size={22} strokeWidth={1.75} />
            </div>
            <h3>Für Technik-Reviewer:innen</h3>
            <p>
              <code>docs/technical-specification.md</code> beschreibt
              Architektur, Stack, Datenmodell und Security-Posture. Alle
              Migrations liegen unter <code>supabase/migrations/</code>.
            </p>
          </article>
          <article className="card info__card">
            <div className="info__card-icon">
              <MapPin size={22} strokeWidth={1.75} />
            </div>
            <h3>Für Behördliche Gespräche</h3>
            <p>
              <code>docs/demo-script.md</code> enthält einen 15-Minuten-
              Gesprächsleitfaden mit vorformulierten Wortlauten und
              vorbereiteten Rückfragen.
            </p>
          </article>
        </div>
      </div>
    </PublicShell>
  );
}
