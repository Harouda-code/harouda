import { useState, type FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight, Eye, EyeOff, Loader2, Sparkles } from "lucide-react";
import { useUser } from "../contexts/UserContext";
import "./LoginPage.css";

type Mode = "signin" | "signup";

const DEMO_EMAIL = "admin@harouda.de";
const DEMO_PASSWORD = "password123";

const CONFIRM_HINT =
  "Supabase verlangt eine E-Mail-Bestaetigung. Deaktivieren Sie " +
  "in Supabase → Authentication → Providers → Email die Option " +
  "'Confirm email' und versuchen Sie es erneut.";

export default function LoginPage() {
  const { signIn, signUp, resetPassword } = useUser();
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo =
    (location.state as { from?: { pathname: string } } | null)?.from
      ?.pathname ?? "/arbeitsplatz";

  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);
  const [resetBusy, setResetBusy] = useState(false);

  async function handleForgotPassword() {
    const target = email.trim();
    if (!target) {
      toast.error("Bitte zuerst die E-Mail-Adresse eintragen.");
      return;
    }
    setResetBusy(true);
    try {
      const { error } = await resetPassword(target);
      if (error) {
        toast.error(error.message);
        return;
      }
      toast.success(
        "Falls ein Konto existiert, wurde eine E-Mail zum Zurücksetzen des Passworts gesendet."
      );
    } finally {
      setResetBusy(false);
    }
  }

  async function handleDemoLogin() {
    if (demoLoading || submitting) return;
    setDemoLoading(true);
    try {
      const first = await signIn(DEMO_EMAIL, DEMO_PASSWORD);
      if (!first.error) {
        toast.success("Demo-Modus aktiv. Willkommen.");
        navigate(redirectTo, { replace: true });
        return;
      }

      const firstMsg = first.error.message.toLowerCase();

      if (firstMsg.includes("confirm")) {
        toast.error(CONFIRM_HINT, { duration: 9000 });
        return;
      }

      if (
        firstMsg.includes("invalid") ||
        firstMsg.includes("credentials") ||
        firstMsg.includes("not found")
      ) {
        const created = await signUp(DEMO_EMAIL, DEMO_PASSWORD);
        if (created.error) {
          toast.error(
            `Demo-Konto konnte nicht angelegt werden: ${created.error.message}`
          );
          return;
        }

        const retry = await signIn(DEMO_EMAIL, DEMO_PASSWORD);
        if (!retry.error) {
          toast.success("Demo-Konto angelegt. Willkommen.");
          navigate(redirectTo, { replace: true });
          return;
        }

        const retryMsg = retry.error.message.toLowerCase();
        if (retryMsg.includes("confirm")) {
          toast.error(CONFIRM_HINT, { duration: 9000 });
          return;
        }
        toast.error(retry.error.message);
        return;
      }

      toast.error(first.error.message);
    } finally {
      setDemoLoading(false);
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (submitting) return;

    setSubmitting(true);
    try {
      const fn = mode === "signin" ? signIn : signUp;
      const { error } = await fn(email.trim(), password);
      if (error) {
        toast.error(error.message);
        return;
      }
      if (mode === "signup") {
        toast.success(
          "Konto angelegt. Bitte bestaetigen Sie Ihre E-Mail-Adresse."
        );
      } else {
        toast.success("Willkommen zurueck.");
        navigate(redirectTo, { replace: true });
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="login">
      <aside className="login__brand-panel" aria-hidden="true">
        <div className="login__brand-panel-inner">
          <Link to="/" className="login__brand">
            <span className="login__brand-mark">H</span>
            <span className="login__brand-name">harouda</span>
          </Link>

          <blockquote className="login__quote">
            <p>
              &bdquo;Eine Kanzlei-Software muss sich anfuehlen wie ein
              erstklassiges Aktenzimmer&nbsp;&mdash; ruhig, geordnet, von
              bleibendem Wert.&ldquo;
            </p>
            <footer>Die harouda-Philosophie</footer>
          </blockquote>

          <ul className="login__brand-bullets">
            <li>Selbst gehostet (Supabase) oder rein lokal (Demo)</li>
            <li>Belegarchiv mit Hash-Ketten-Audit-Log</li>
            <li>ELSTER-Ausfüllhilfen (Abgabe via offizielles Portal)</li>
          </ul>
        </div>
      </aside>

      <main className="login__form-panel">
        <div className="login__form-panel-inner">
          <Link to="/" className="login__back">
            <ArrowLeft size={16} />
            Zurueck zur Startseite
          </Link>

          <header className="login__header">
            <h1>
              {mode === "signin" ? "In Kanzlei anmelden" : "Kanzlei einrichten"}
            </h1>
            <p>
              {mode === "signin"
                ? "Melden Sie sich an, um auf Mandate, Buchhaltung und Auswertungen zuzugreifen."
                : "Erstellen Sie einen Zugang fuer Ihre Kanzlei. Sie erhalten eine Bestaetigungs-E-Mail."}
            </p>
          </header>

          <section className="login__demo" aria-label="Demo-Zugang">
            <div className="login__demo-head">
              <span className="login__demo-badge">
                <Sparkles size={12} />
                Demo
              </span>
              <h2>Sofort testen — ohne Registrierung</h2>
            </div>
            <p className="login__demo-desc">
              Vorkonfiguriertes Konto mit Dashboard, Buchungsjournal und
              USt-Vorschau. Ideal fuer die erste Runde durch die Kanzlei-App.
            </p>
            <dl className="login__demo-creds">
              <div>
                <dt>E-Mail</dt>
                <dd>{DEMO_EMAIL}</dd>
              </div>
              <div>
                <dt>Passwort</dt>
                <dd>{DEMO_PASSWORD}</dd>
              </div>
            </dl>
            <button
              type="button"
              className="btn btn-primary login__demo-btn"
              onClick={handleDemoLogin}
              disabled={demoLoading || submitting}
            >
              {demoLoading ? (
                <>
                  <Loader2 size={18} className="login__spinner" />
                  Demo wird gestartet …
                </>
              ) : (
                <>
                  Als Demo anmelden
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </section>

          <div className="login__divider" role="separator">
            <span>oder mit eigenem Konto</span>
          </div>

          <form className="login__form" onSubmit={handleSubmit} noValidate>
            <label className="login__field">
              <span>E-Mail</span>
              <input
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="kanzlei@beispiel.de"
                disabled={submitting}
              />
            </label>

            <label className="login__field">
              <span>Passwort</span>
              <div className="login__password">
                <input
                  type={showPassword ? "text" : "password"}
                  autoComplete={
                    mode === "signin" ? "current-password" : "new-password"
                  }
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={mode === "signup" ? "Mind. 8 Zeichen" : "********"}
                  disabled={submitting}
                />
                <button
                  type="button"
                  className="login__password-toggle"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={
                    showPassword ? "Passwort verbergen" : "Passwort anzeigen"
                  }
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </label>

            <button
              type="submit"
              className="btn btn-primary login__submit"
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <Loader2 size={18} className="login__spinner" />
                  {mode === "signin" ? "Wird angemeldet …" : "Wird angelegt …"}
                </>
              ) : mode === "signin" ? (
                "Anmelden"
              ) : (
                "Kanzlei anlegen"
              )}
            </button>
          </form>

          {mode === "signin" && (
            <p className="login__switch">
              <button
                type="button"
                className="login__link"
                onClick={handleForgotPassword}
                disabled={resetBusy}
              >
                {resetBusy ? "Sende E-Mail …" : "Passwort vergessen?"}
              </button>
            </p>
          )}

          <p className="login__switch">
            {mode === "signin" ? (
              <>
                Noch kein Zugang?{" "}
                <button
                  type="button"
                  className="login__link"
                  onClick={() => setMode("signup")}
                >
                  Kanzlei einrichten
                </button>
              </>
            ) : (
              <>
                Bereits registriert?{" "}
                <button
                  type="button"
                  className="login__link"
                  onClick={() => setMode("signin")}
                >
                  Anmelden
                </button>
              </>
            )}
          </p>
        </div>
      </main>
    </div>
  );
}
