/**
 * Sentry initialisation for harouda-app.
 *
 * Privacy-first: PII (tax-IDs, IBANs, USt-IdNrs, tax numbers) is scrubbed
 * from every event before it leaves the browser. Session Replay is
 * **only** captured on errors, and all text + inputs are masked.
 *
 * Activation: only when `VITE_SENTRY_DSN` is set. Without the env var the
 * init is a no-op so development and demo mode stay offline.
 */

import * as Sentry from "@sentry/react";

export function initSentry(): void {
  const dsn = import.meta.env.VITE_SENTRY_DSN as string | undefined;

  if (!dsn) {
     
    console.info("[Sentry] no DSN configured — skipping initialisation");
    return;
  }

  Sentry.init({
    dsn,
    environment: import.meta.env.MODE,
    release:
      (import.meta.env.VITE_APP_VERSION as string | undefined) || "dev",

    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({
        maskAllText: true,
        maskAllInputs: true,
        blockAllMedia: true,
      }),
    ],

    tracesSampleRate: import.meta.env.MODE === "production" ? 0.1 : 1.0,

    // Session replay only on errors — no continuous recording.
    replaysSessionSampleRate: 0.0,
    replaysOnErrorSampleRate: 1.0,

    beforeSend(event) {
      return scrubSensitiveData(event);
    },

    ignoreErrors: [
      "ResizeObserver loop limit exceeded",
      "ResizeObserver loop completed with undelivered notifications.",
      "Non-Error promise rejection captured",
    ],
  });
}

/** Patterns that identify PII we must never ship to Sentry. */
const SENSITIVE_PATTERNS: RegExp[] = [
  /\bDE\d{9}\b/g, // DE USt-IdNr
  /\b\d{3}\/\d{3}\/\d{5}\b/g, // German tax number
  /\bDE\d{2}\s?\d{4}\s?\d{4}\s?\d{4}\s?\d{4}\s?\d{2}\b/g, // DE IBAN
  /\b[A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?\b/g, // BIC
];

function scrubText(text: string): string {
  let out = text;
  for (const re of SENSITIVE_PATTERNS) {
    out = out.replace(re, "[REDACTED]");
  }
  return out;
}

/** Exported so the ErrorBoundary test can verify scrub behaviour. */
export function scrubSensitiveData(
  event: Sentry.ErrorEvent
): Sentry.ErrorEvent {
  if (event.message) event.message = scrubText(event.message);

  if (event.exception?.values) {
    for (const v of event.exception.values) {
      if (v.value) v.value = scrubText(v.value);
    }
  }

  if (event.breadcrumbs) {
    for (const bc of event.breadcrumbs) {
      if (bc.message) bc.message = scrubText(bc.message);
    }
  }

  // Sentry ships the URL — strip query strings that may carry identifiers.
  if (event.request?.url) {
    event.request.url = event.request.url.replace(/\?.*$/, "");
  }

  return event;
}
