import { Component, type ErrorInfo, type ReactNode } from "react";
import * as Sentry from "@sentry/react";

export type ErrorBoundaryLevel = "page" | "section" | "component";

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  level: ErrorBoundaryLevel;
  context?: string;
  onReset?: () => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  eventId: string | null;
}

export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = {
    hasError: false,
    error: null,
    errorInfo: null,
    eventId: null,
  };

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    const eventId = Sentry.captureException(error, {
      tags: {
        boundary: this.props.level,
        context: this.props.context ?? "unknown",
      },
      contexts: {
        react: { componentStack: errorInfo.componentStack ?? "" },
      },
    });
    this.setState({ errorInfo, eventId });

    if (this.props.level === "page") {
       
      console.error(
        `[ErrorBoundary] page-level error in ${this.props.context ?? "unknown"}:`,
        error
      );
    }
  }

  reset = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      eventId: null,
    });
    this.props.onReset?.();
  };

  private renderFallback(): ReactNode {
    if (this.props.fallback) return this.props.fallback;

    const { error, eventId } = this.state;
    const level = this.props.level;

    return (
      <div
        role="alert"
        className={`error-boundary error-boundary--${level}`}
        style={{
          padding: level === "page" ? "32px" : "16px",
          margin: level === "page" ? "24px auto" : "8px 0",
          maxWidth: level === "page" ? 640 : undefined,
          border: "1px solid #c76b3f",
          borderLeft: "4px solid #c76b3f",
          borderRadius: "var(--radius, 8px)",
          background: "rgba(210,120,70,0.06)",
          fontFamily: "var(--font-sans)",
        }}
      >
        <h2 style={{ margin: "0 0 8px", fontSize: "1.05rem" }}>
          Ein Fehler ist aufgetreten
        </h2>
        <p style={{ margin: "0 0 12px", fontSize: "0.9rem" }}>
          Die Anwendung konnte diesen Bereich nicht wie erwartet darstellen.
          Wir wurden automatisch informiert.
        </p>

        {eventId && (
          <p style={{ fontSize: "0.85rem", margin: "0 0 12px" }}>
            Fehler-ID:{" "}
            <code
              style={{
                fontFamily: "var(--font-mono, monospace)",
                background: "#fff",
                padding: "2px 6px",
                borderRadius: 4,
              }}
            >
              {eventId}
            </code>
            <br />
            <small>Bitte bei Rückfragen an den Support weitergeben.</small>
          </p>
        )}

        <details style={{ margin: "12px 0", fontSize: "0.82rem" }}>
          <summary style={{ cursor: "pointer" }}>Technische Details</summary>
          <pre
            style={{
              marginTop: 8,
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
              background: "#fff",
              padding: 8,
              borderRadius: 4,
              fontSize: "0.78rem",
            }}
          >
            {error?.message ?? "Unbekannter Fehler"}
          </pre>
          {error?.stack && (
            <pre
              style={{
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
                background: "#fff",
                padding: 8,
                borderRadius: 4,
                fontSize: "0.72rem",
                color: "#666",
              }}
            >
              {error.stack}
            </pre>
          )}
        </details>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button
            className="btn btn-primary"
            onClick={this.reset}
            type="button"
          >
            Erneut versuchen
          </button>
          {level === "page" && (
            <button
              className="btn btn-outline"
              onClick={() => {
                window.location.href = "/";
              }}
              type="button"
            >
              Zur Startseite
            </button>
          )}
          {eventId && (
            <button
              className="btn btn-outline"
              onClick={() => Sentry.showReportDialog({ eventId })}
              type="button"
            >
              Fehler melden
            </button>
          )}
        </div>
      </div>
    );
  }

  render(): ReactNode {
    if (this.state.hasError) return this.renderFallback();
    return this.props.children;
  }
}
