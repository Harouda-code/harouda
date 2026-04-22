import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import {
  Building2,
  CloudUpload,
  Database,
  Download,
  FileSearch,
  History,
  Info,
  Loader2,
  RotateCcw,
  Save,
  ShieldCheck,
  Upload,
} from "lucide-react";
import { useSettings, type Settings } from "../contexts/SettingsContext";
import { useUser } from "../contexts/UserContext";
import { isValidSteuernummer } from "../utils/validators";
import { buildGdpduZip } from "../utils/gdpdu";
import { downloadBlob } from "../utils/exporters";
import {
  downloadBackup,
  pickAndRestore,
  summarizeLocalState,
} from "../api/backup";
import { pushLocalToSupabase } from "../api/supabasePush";
import { DEMO_MODE } from "../api/supabase";
import "./SettingsPage.css";

export default function SettingsPage() {
  const { settings, updateSettings, resetSettings } = useSettings();
  const { idleTimeoutMinutes, setIdleTimeoutMinutes } = useUser();
  const [form, setForm] = useState<Settings>(settings);

  function update<K extends keyof Settings>(key: K, value: Settings[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    updateSettings(form);
    toast.success("Einstellungen gespeichert.");
  }

  const [gdpduBusy, setGdpduBusy] = useState(false);
  const [pushBusy, setPushBusy] = useState(false);
  const [pushResult, setPushResult] = useState<{
    ok: boolean;
    companyId: string | null;
    totalInserted: number;
    totalFailed: number;
    error?: string;
  } | null>(null);
  const local = summarizeLocalState();

  async function handleBackupDownload() {
    try {
      downloadBackup();
      toast.success("Backup heruntergeladen.");
    } catch (err) {
      toast.error(`Backup fehlgeschlagen: ${(err as Error).message}`);
    }
  }

  async function handleRestore() {
    const replace = confirm(
      "Soll das Backup die aktuellen Daten ERSETZEN?\n\n" +
        "• OK = aktuelle Daten löschen und Backup einspielen\n" +
        "• Abbrechen = Backup über die vorhandenen Daten drüberlegen"
    );
    const res = await pickAndRestore({ replaceExisting: replace });
    if (!res.ok) {
      toast.error(res.error ?? "Restore fehlgeschlagen.");
      return;
    }
    toast.success(
      `Backup eingespielt (${res.restored} Einträge). Seite wird neu geladen…`
    );
    setTimeout(() => window.location.reload(), 900);
  }

  async function handleSupabasePush() {
    if (DEMO_MODE) {
      toast.error(
        "Im Demo-Modus deaktiviert. Für die Übernahme einen Produktiv-Build verwenden."
      );
      return;
    }
    if (
      !confirm(
        "Alle lokalen Daten (Konten, Buchungen, Mandanten, Belege, Audit-Log, Mahnungen) in Supabase übernehmen?\n\n" +
          "Voraussetzungen:\n" +
          "• Supabase-Schema (Migrations 0001–0005) eingespielt\n" +
          "• Sie sind eingeloggt\n" +
          `• Es wird ggf. eine neue Firma mit dem Namen „${
            form.kanzleiName || "Meine Kanzlei"
          }" angelegt.`
      )
    ) {
      return;
    }
    setPushBusy(true);
    setPushResult(null);
    try {
      const res = await pushLocalToSupabase({
        companyName: form.kanzleiName || "Meine Kanzlei",
      });
      setPushResult(res);
      if (res.ok) toast.success(`${res.totalInserted} Zeilen übertragen.`);
      else toast.error(res.error ?? `${res.totalFailed} Zeilen fehlgeschlagen.`);
    } catch (err) {
      toast.error(`Übernahme fehlgeschlagen: ${(err as Error).message}`);
    } finally {
      setPushBusy(false);
    }
  }

  async function handleGdpdu() {
    setGdpduBusy(true);
    try {
      const zip = await buildGdpduZip({
        name: form.kanzleiName || "Kanzlei",
        location: [form.kanzleiPlz, form.kanzleiOrt]
          .filter(Boolean)
          .join(" "),
      });
      downloadBlob(
        zip,
        `gdpdu_export_${new Date().toISOString().slice(0, 10)}.zip`
      );
      toast.success("GDPdU-Export heruntergeladen.");
    } catch (err) {
      toast.error(`Export fehlgeschlagen: ${(err as Error).message}`);
    } finally {
      setGdpduBusy(false);
    }
  }

  function handleReset() {
    if (!confirm("Alle Einstellungen zuruecksetzen?")) return;
    resetSettings();
    setForm({
      kanzleiName: "",
      kanzleiStrasse: "",
      kanzleiPlz: "",
      kanzleiOrt: "",
      kanzleiTelefon: "",
      kanzleiEmail: "",
      kanzleiIban: "",
      kanzleiBic: "",
      defaultSteuernummer: "",
      elsterBeraterNr: "",
      kleinunternehmer: false,
      basiszinssatzPct: 2.27,
      verzugszinsenB2B: true,
      mahngebuehrStufe1: 0,
      mahngebuehrStufe2: 5,
      mahngebuehrStufe3: 10,
      stufe1AbTagen: 7,
      stufe2AbTagen: 21,
      stufe3AbTagen: 45,
      gebuchtLockAfterHours: 24,
      lohnKontoPersonalkosten: "4110",
      lohnKontoSvAgAufwand: "4130",
      lohnKontoLstVerb: "1741",
      lohnKontoSvVerb: "1742",
      lohnKontoNettoVerb: "1755",
      ga4MeasurementId: "",
      plausibleDomain: "",
      periodClosedBefore: "",
    });
    toast.info("Einstellungen zurueckgesetzt.");
  }

  return (
    <form className="settings" onSubmit={handleSubmit}>
      <header className="settings__head">
        <p className="settings__lead">
          Kanzlei-Stammdaten, ELSTER-Kennungen und Standard-Werte. Die Daten
          werden lokal im Browser gespeichert und in Exports (ELSTER-XML,
          PDF) vorbefuellt.
        </p>
      </header>

      <section className="card settings__section">
        <header className="settings__section-head">
          <span className="settings__section-icon">
            <Building2 size={18} strokeWidth={1.75} />
          </span>
          <div>
            <h2>Kanzlei-Stammdaten</h2>
            <p>
              Absender-Informationen fuer ELSTER-XML und gedruckte Berichte.
            </p>
          </div>
        </header>

        <div className="form-grid">
          <label className="form-field form-field--wide">
            <span>Kanzlei-Name *</span>
            <input
              value={form.kanzleiName}
              onChange={(e) => update("kanzleiName", e.target.value)}
              placeholder="z. B. Steuerberatung Mustermann GmbH"
            />
          </label>

          <label className="form-field form-field--wide">
            <span>Strasse &amp; Hausnummer</span>
            <input
              value={form.kanzleiStrasse}
              onChange={(e) => update("kanzleiStrasse", e.target.value)}
            />
          </label>

          <label className="form-field">
            <span>PLZ</span>
            <input
              value={form.kanzleiPlz}
              onChange={(e) => update("kanzleiPlz", e.target.value)}
            />
          </label>

          <label className="form-field">
            <span>Ort</span>
            <input
              value={form.kanzleiOrt}
              onChange={(e) => update("kanzleiOrt", e.target.value)}
            />
          </label>

          <label className="form-field">
            <span>Telefon</span>
            <input
              value={form.kanzleiTelefon}
              onChange={(e) => update("kanzleiTelefon", e.target.value)}
            />
          </label>

          <label className="form-field">
            <span>E-Mail</span>
            <input
              type="email"
              value={form.kanzleiEmail}
              onChange={(e) => update("kanzleiEmail", e.target.value)}
            />
          </label>

          <label className="form-field">
            <span>IBAN (Kanzlei-Konto)</span>
            <input
              value={form.kanzleiIban}
              onChange={(e) => update("kanzleiIban", e.target.value)}
              placeholder="DE89 3704 0044 0532 0130 00"
            />
          </label>

          <label className="form-field">
            <span>BIC</span>
            <input
              value={form.kanzleiBic}
              onChange={(e) => update("kanzleiBic", e.target.value)}
              placeholder="COBADEFFXXX"
            />
          </label>
        </div>
      </section>

      <section className="card settings__section">
        <header className="settings__section-head">
          <span className="settings__section-icon">
            <Info size={18} strokeWidth={1.75} />
          </span>
          <div>
            <h2>Mahnwesen</h2>
            <p>
              Schwellenwerte für Mahnstufen, Mahngebühren und Verzugszinsen
              (§§ 286, 288 BGB). Der Basiszinssatz ändert sich halbjährlich
              und muss selbst gepflegt werden.
            </p>
          </div>
        </header>

        <div className="form-grid">
          <label className="form-field">
            <span>Stufe 1 (Zahlungserinnerung) ab … Tagen</span>
            <input
              type="number"
              min="0"
              value={form.stufe1AbTagen}
              onChange={(e) =>
                update("stufe1AbTagen", Number(e.target.value))
              }
            />
          </label>
          <label className="form-field">
            <span>Stufe 2 (1. Mahnung) ab … Tagen</span>
            <input
              type="number"
              min="0"
              value={form.stufe2AbTagen}
              onChange={(e) =>
                update("stufe2AbTagen", Number(e.target.value))
              }
            />
          </label>
          <label className="form-field">
            <span>Stufe 3 (2. Mahnung) ab … Tagen</span>
            <input
              type="number"
              min="0"
              value={form.stufe3AbTagen}
              onChange={(e) =>
                update("stufe3AbTagen", Number(e.target.value))
              }
            />
          </label>

          <label className="form-field">
            <span>Mahngebühr Stufe 1 (€)</span>
            <input
              type="number"
              min="0"
              step="0.01"
              value={form.mahngebuehrStufe1}
              onChange={(e) =>
                update("mahngebuehrStufe1", Number(e.target.value))
              }
            />
          </label>
          <label className="form-field">
            <span>Mahngebühr Stufe 2 (€)</span>
            <input
              type="number"
              min="0"
              step="0.01"
              value={form.mahngebuehrStufe2}
              onChange={(e) =>
                update("mahngebuehrStufe2", Number(e.target.value))
              }
            />
          </label>
          <label className="form-field">
            <span>Mahngebühr Stufe 3 (€)</span>
            <input
              type="number"
              min="0"
              step="0.01"
              value={form.mahngebuehrStufe3}
              onChange={(e) =>
                update("mahngebuehrStufe3", Number(e.target.value))
              }
            />
          </label>

          <label className="form-field">
            <span>Basiszinssatz (%)</span>
            <input
              type="number"
              step="0.01"
              value={form.basiszinssatzPct}
              onChange={(e) =>
                update("basiszinssatzPct", Number(e.target.value))
              }
            />
          </label>

          <label className="form-field kontenplan__toggle--form">
            <input
              type="checkbox"
              checked={form.verzugszinsenB2B}
              onChange={(e) => update("verzugszinsenB2B", e.target.checked)}
            />
            <span>
              B2B-Aufschlag (+9 Prozentpunkte statt +5 bei B2C)
            </span>
          </label>
        </div>
      </section>

      <section className="card settings__section">
        <header className="settings__section-head">
          <span className="settings__section-icon">
            <ShieldCheck size={18} strokeWidth={1.75} />
          </span>
          <div>
            <h2>Steuer- &amp; ELSTER-Kennungen</h2>
            <p>
              Standard-Werte fuer ELSTER-Exports. Bei aktivem Mandanten
              wird dessen Steuernummer bevorzugt.
            </p>
          </div>
        </header>

        <div className="form-grid">
          <label className="form-field">
            <span>Standard-Steuernummer</span>
            <input
              value={form.defaultSteuernummer}
              onChange={(e) =>
                update("defaultSteuernummer", e.target.value)
              }
              placeholder="XX/XXX/XXXXX"
              aria-invalid={
                form.defaultSteuernummer.length > 0 &&
                !isValidSteuernummer(form.defaultSteuernummer)
              }
            />
            {form.defaultSteuernummer.length > 0 &&
              !isValidSteuernummer(form.defaultSteuernummer) && (
                <small
                  style={{ color: "var(--danger)", marginTop: 4 }}
                >
                  Ungültiges Format. Erwartet: „XX/XXX/XXXXX" oder 13-stellig.
                </small>
              )}
          </label>

          <label className="form-field">
            <span>Berater-Nummer (ELSTER)</span>
            <input
              value={form.elsterBeraterNr}
              onChange={(e) => update("elsterBeraterNr", e.target.value)}
              placeholder="7-stellig"
            />
          </label>
        </div>

        <aside className="settings__note">
          <strong>Hinweis zu Umsatzsteuersaetzen:</strong> Die in Deutschland
          geltenden USt-Saetze (0 %, 7 %, 19 %) sind gesetzlich vorgegeben und
          nicht konfigurierbar. Konto-bezogene Saetze verwalten Sie im{" "}
          <a href="/konten">Kontenplan</a>.
        </aside>

        <aside className="settings__note settings__note--warn">
          <strong>ELSTER-Zertifikat:</strong> Die direkte Uebermittlung an
          die Finanzverwaltung erfordert das ERiC-Zertifikat plus
          Transport-Verschluesselung und kann aus dem Browser nicht erfolgen.
          Nutzen Sie die XML-Exports fuer den Import in zertifizierte
          Clients (ELSTER Online Portal, DATEV, Taxpool).
        </aside>
      </section>

      <section className="card settings__section">
        <header className="settings__section-head">
          <span className="settings__section-icon">
            <ShieldCheck size={18} strokeWidth={1.75} />
          </span>
          <div>
            <h2>Sitzung &amp; Sicherheit</h2>
            <p>
              Automatisches Abmelden bei Inaktivität. Gilt lokal für diesen
              Browser. Rate-Limits und IP-Sperren liegen bei Supabase.
            </p>
          </div>
        </header>

        <div className="form-grid">
          <label className="form-field">
            <span>Auto-Logout nach (Minuten Inaktivität)</span>
            <input
              type="number"
              min={5}
              max={1440}
              value={idleTimeoutMinutes}
              onChange={(e) =>
                setIdleTimeoutMinutes(Number(e.target.value) || 480)
              }
            />
            <small style={{ color: "var(--muted)", marginTop: 4 }}>
              Standard: 480 Minuten (8 Stunden). Maximum: 1440 (24 Std.).
            </small>
          </label>
        </div>

        <aside className="settings__note">
          <strong>Was dieser Timer leistet:</strong> Nach der konfigurierten
          Zeit ohne Interaktion wird die Sitzung lokal beendet und ein
          Logout-Ereignis in den Audit-Log geschrieben. <strong>Was er NICHT
          leistet:</strong> er ersetzt keine serverseitige Session-Dauer. Der
          Supabase-Token bleibt technisch so lange gültig, wie im Supabase-Projekt
          konfiguriert — konfigurieren Sie dort zusätzlich eine kurze
          „JWT expiry".
        </aside>

        <div className="form-grid" style={{ marginTop: 16 }}>
          <label className="form-field">
            <span>Auto-Festschreibung gebuchter Einträge (Stunden)</span>
            <input
              type="number"
              min={0}
              max={8760}
              value={form.gebuchtLockAfterHours}
              onChange={(e) =>
                update(
                  "gebuchtLockAfterHours",
                  Math.max(0, Math.min(8760, Number(e.target.value) || 0))
                )
              }
            />
            <small style={{ color: "var(--muted)", marginTop: 4 }}>
              Standard: 24h. 0 = sofort. Nach Ablauf sind Änderungen nur noch
              über Storno möglich (GoBD-orientiert).
            </small>
          </label>
        </div>
      </section>

      <section className="card settings__section">
        <header className="settings__section-head">
          <span className="settings__section-icon">
            <ShieldCheck size={18} strokeWidth={1.75} />
          </span>
          <div>
            <h2>Opt-In Analytics</h2>
            <p>
              Optional: eigenes Analytics-Tool einbinden. harouda-app selbst
              sammelt <strong>keine</strong> Telemetrie. Wenn Sie ein Feld
              ausfüllen, wird das entsprechende Script beim nächsten Neuladen
              geladen.
            </p>
          </div>
        </header>

        <div className="form-grid">
          <label className="form-field">
            <span>Google Analytics 4 — Messung-ID</span>
            <input
              value={form.ga4MeasurementId}
              onChange={(e) =>
                update("ga4MeasurementId", e.target.value.trim())
              }
              placeholder="G-XXXXXXXXXX"
              pattern="G-[A-Z0-9]{5,}"
            />
            <small style={{ color: "var(--muted)", marginTop: 4 }}>
              Format: „G-" + 5+ alphanumerisch. Leer = kein GA4.
            </small>
          </label>
          <label className="form-field">
            <span>Plausible-Domain</span>
            <input
              value={form.plausibleDomain}
              onChange={(e) =>
                update("plausibleDomain", e.target.value.trim())
              }
              placeholder="mein-domain.de"
            />
            <small style={{ color: "var(--muted)", marginTop: 4 }}>
              Nur der Domain-Name, ohne https:// und ohne Pfad.
            </small>
          </label>
        </div>

        <aside className="settings__note settings__note--warn">
          <strong>Datenschutz-Hinweis:</strong> Sie sind für die DSGVO-Konformität
          des gewählten Analytics-Tools selbst verantwortlich (Cookie-Banner,
          AV-Vertrag, Einwilligung). harouda-app injiziert das Script nur —
          wir überwachen, speichern und übertragen nichts selbst.
        </aside>
      </section>

      <section className="card settings__section">
        <header className="settings__section-head">
          <span className="settings__section-icon">
            <ShieldCheck size={18} strokeWidth={1.75} />
          </span>
          <div>
            <h2>Jahresabschluss-Sperre</h2>
            <p>
              Sperrt Buchungen mit Datum ≤ dem angegebenen Tag. Nach dem
              Jahresabschluss setzen, damit keine rückwirkenden Buchungen
              in die abgeschlossene Periode fallen.
            </p>
          </div>
        </header>

        <div className="form-grid">
          <label className="form-field">
            <span>Gesperrt bis einschließlich (Datum)</span>
            <input
              type="date"
              value={form.periodClosedBefore}
              onChange={(e) =>
                update("periodClosedBefore", e.target.value)
              }
            />
            <small style={{ color: "var(--muted)", marginTop: 4 }}>
              Beispiel: Jahresabschluss 2024 abgeschlossen → „2024-12-31".
              Leer = keine Sperre.
            </small>
          </label>
        </div>

        <aside className="settings__note">
          <strong>Wichtig:</strong> Stornobuchungen sind trotzdem möglich,
          wenn sie vom heutigen Datum aus erzeugt werden. Die Sperre
          verhindert nur <em>Direkt-Buchungen</em> mit Alt-Datum.
        </aside>
      </section>

      <section className="card settings__section">
        <header className="settings__section-head">
          <span className="settings__section-icon">
            <Info size={18} strokeWidth={1.75} />
          </span>
          <div>
            <h2>Kleinunternehmer-Regelung (§ 19 UStG)</h2>
            <p>
              Für Unternehmen mit Vorjahresumsatz unter 22.000 € und
              laufendem Jahresumsatz unter 50.000 €.
            </p>
          </div>
        </header>

        <label className="settings__switch">
          <input
            type="checkbox"
            checked={form.kleinunternehmer}
            onChange={(e) => update("kleinunternehmer", e.target.checked)}
          />
          <span>
            <strong>Kleinunternehmer-Regelung anwenden</strong>
            <small>
              Rechnungen ohne ausgewiesene Umsatzsteuer · UStVA nicht erforderlich ·
              Vorsteuerabzug entfällt.
            </small>
          </span>
        </label>

        {form.kleinunternehmer && (
          <aside className="settings__note">
            <strong>Hinweis:</strong> Bei aktiver Kleinunternehmer-Regelung
            sind Rechnungen um den Vermerk zu ergänzen:
            „Gemäß § 19 UStG wird keine Umsatzsteuer ausgewiesen.“
          </aside>
        )}
      </section>

      <section className="card settings__section">
        <header className="settings__section-head">
          <span className="settings__section-icon">
            <Database size={18} strokeWidth={1.75} />
          </span>
          <div>
            <h2>Datenhaltung: Backup &amp; Übernahme nach Supabase</h2>
            <p>
              Aktuell liegen alle Kanzlei-Daten lokal im Browser (
              <strong>{local.accounts}</strong> Konten ·{" "}
              <strong>{local.entries}</strong> Buchungen ·{" "}
              <strong>{local.clients}</strong> Mandanten ·{" "}
              <strong>{local.documents}</strong> Belege ·{" "}
              <strong>{local.audit}</strong> Audit-Einträge ·{" "}
              <strong>{local.dunnings}</strong> Mahnungen). Erstellen Sie
              Backups als JSON-Datei oder übernehmen Sie den Bestand in eine
              produktive Supabase-Datenbank.
            </p>
          </div>
        </header>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button
            type="button"
            className="btn btn-outline"
            onClick={handleBackupDownload}
          >
            <Download size={16} />
            Backup herunterladen (JSON)
          </button>
          <button
            type="button"
            className="btn btn-outline"
            onClick={handleRestore}
          >
            <Upload size={16} />
            Backup einspielen
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleSupabasePush}
            disabled={pushBusy || DEMO_MODE}
            title={
              DEMO_MODE
                ? "Im Demo-Modus deaktiviert"
                : "Einmalige Übernahme der lokalen Daten in die Supabase-Datenbank"
            }
          >
            {pushBusy ? (
              <>
                <Loader2 size={16} className="login__spinner" />
                Übertrage…
              </>
            ) : (
              <>
                <CloudUpload size={16} />
                Nach Supabase übernehmen
              </>
            )}
          </button>
        </div>

        {pushResult && (
          <aside
            className="settings__note"
            style={{
              borderLeftColor: pushResult.ok
                ? "var(--success)"
                : "var(--danger)",
            }}
          >
            <strong>
              {pushResult.ok
                ? `Übernahme erfolgreich — ${pushResult.totalInserted} Zeilen geschrieben.`
                : `Übernahme mit Fehlern — ${pushResult.totalFailed} Zeilen fehlgeschlagen.`}
            </strong>
            {pushResult.companyId && (
              <>
                {" "}
                Firmen-ID: <code>{pushResult.companyId}</code>.
              </>
            )}
            {pushResult.error && (
              <>
                {" "}
                Erster Fehler: {pushResult.error}.
              </>
            )}
          </aside>
        )}

        <aside className="settings__note">
          <strong>Hinweis:</strong> Die Übernahme setzt das
          Supabase-Schema aus <code>supabase/migrations/</code> voraus
          (Dateien 0001 bis 0005 eingespielt). Der Push ist einmalig
          gedacht; nach der Migration sollten Sie die lokalen Daten
          verwerfen oder ein Backup behalten. Die aktiven Schreibwege der
          App (Journal, Belege, etc.) laufen derzeit weiter auf{" "}
          <code>localStorage</code> — ein vollständiges Rewiring der
          API-Layer auf Supabase ist der nächste Schritt.
        </aside>
      </section>

      <section className="card settings__section">
        <header className="settings__section-head">
          <span className="settings__section-icon">
            <History size={18} strokeWidth={1.75} />
          </span>
          <div>
            <h2>Audit-Log</h2>
            <p>
              Chronologische Aufzeichnung aller Änderungen an Buchungen und
              Stammdaten — Grundlage für Nachvollziehbarkeit (Teilaspekt GoBD).
            </p>
          </div>
        </header>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <Link to="/einstellungen/audit" className="btn btn-outline">
            Audit-Log öffnen
          </Link>
          <Link to="/einstellungen/fristen" className="btn btn-outline">
            Fristenkalender
          </Link>
          <Link to="/einstellungen/aufbewahrung" className="btn btn-outline">
            Aufbewahrungsfristen
          </Link>
        </div>
      </section>

      <section className="card settings__section">
        <header className="settings__section-head">
          <span className="settings__section-icon">
            <Info size={18} strokeWidth={1.75} />
          </span>
          <div>
            <h2>Verfahrensdokumentation</h2>
            <p>
              Vorlage für die GoBD-Verfahrensdokumentation liegt im Repo unter
              <code> docs/verfahrensdokumentation.md</code>. Vor produktivem
              Einsatz ausfüllen und von einer qualifizierten Person prüfen
              lassen.
            </p>
          </div>
        </header>
      </section>

      <section className="card settings__section">
        <header className="settings__section-head">
          <span className="settings__section-icon">
            <FileSearch size={18} strokeWidth={1.75} />
          </span>
          <div>
            <h2>Betriebsprüfung (GDPdU/IDEA-Export)</h2>
            <p>
              Erzeugt ein ZIP-Archiv für den Datenzugriff Z3 nach § 147 Abs. 6
              AO: <code>index.xml</code> (Schemabeschreibung) plus CSV-Dateien
              für Journal, Konten, Mandanten, Belege und Audit-Log. Kann im
              IDEA-Prüfsoftware geladen werden.
            </p>
          </div>
        </header>
        <button
          type="button"
          className="btn btn-outline"
          onClick={handleGdpdu}
          disabled={gdpduBusy}
        >
          {gdpduBusy ? (
            <>
              <Loader2 size={14} className="login__spinner" />
              Erzeuge ZIP …
            </>
          ) : (
            <>
              <Download size={14} />
              GDPdU-Export herunterladen
            </>
          )}
        </button>
      </section>

      <footer className="settings__actions">
        <button type="button" className="btn btn-ghost" onClick={handleReset}>
          <RotateCcw size={16} />
          Zuruecksetzen
        </button>
        <button type="submit" className="btn btn-primary">
          <Save size={16} />
          Einstellungen speichern
        </button>
      </footer>
    </form>
  );
}
