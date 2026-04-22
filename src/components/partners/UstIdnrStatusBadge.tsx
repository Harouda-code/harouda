/**
 * Sprint 19.C · UstIdnrStatusBadge
 *
 * Verbindliche Mapping-Tabelle laut Gate-19.B-Reminder A:
 *
 *   verification_status  | Icon   | Farbe | User-Message
 *   --------------------|--------|-------|-----------------------------------
 *   VALID               | ✅     | grün  | Gültig bei VIES bestätigt
 *   INVALID             | ❌     | rot   | VIES: Nicht gültig
 *   PENDING             | ⏳     | gelb  | Prüfung läuft — bitte später erneut laden
 *   SERVICE_UNAVAILABLE | ⚠️     | grau  | VIES-Dienst zurzeit nicht erreichbar. Erneut versuchen.
 *   ERROR               | ⚠️     | rot   | Technischer Fehler — Details: {error_message}
 *   (null)              | ?      | grau  | Nicht geprüft
 *
 * Bei geworfener Exception aus verifyUstIdnrForPartner() gibt der
 * Aufrufer status=null + error-Prop weiter — die UI-Toast-Meldung
 * dafuer liegt im Call-Site, nicht im Badge.
 */

import type {
  UstIdVerificationSource,
  UstIdVerificationStatus,
} from "../../types/db";

export type UstIdnrStatusBadgeProps = {
  status: UstIdVerificationStatus | null;
  /** ISO-Timestamp der letzten Prüfung (wird als "dd.mm.yyyy" im Tooltip angezeigt). */
  lastCheckedAt?: string | null;
  /** error_message aus `ustid_verifications` (nur relevant bei status=ERROR). */
  errorDetail?: string | null;
  /** Optional testid-Suffix, damit mehrere Badges pro Seite eindeutig adressierbar sind. */
  testIdSuffix?: string;
  /** Sprint 20.A.2: Quelle der Prüfung (BZST/VIES). Rendert ein zusätzliches Icon. */
  source?: UstIdVerificationSource | null;
};

type Mapping = {
  icon: string;
  label: string;
  bg: string;
  fg: string;
  border: string;
  message: (errorDetail?: string | null) => string;
};

const MAPPING: Record<
  "VALID" | "INVALID" | "PENDING" | "SERVICE_UNAVAILABLE" | "ERROR" | "NULL",
  Mapping
> = {
  VALID: {
    icon: "✅",
    label: "Gültig",
    bg: "#e7f5ec",
    fg: "#1e6e3a",
    border: "#56a876",
    message: () => "Gültig bei VIES bestätigt",
  },
  INVALID: {
    icon: "❌",
    label: "Ungültig",
    bg: "#fdecec",
    fg: "#a32020",
    border: "#e67373",
    message: () => "VIES: Nicht gültig",
  },
  PENDING: {
    icon: "⏳",
    label: "Prüfung läuft",
    bg: "#fff6e0",
    fg: "#7a5400",
    border: "#d9b459",
    message: () => "Prüfung läuft — bitte später erneut laden",
  },
  SERVICE_UNAVAILABLE: {
    icon: "⚠️",
    label: "VIES down",
    bg: "#efefef",
    fg: "#555",
    border: "#bbb",
    message: () =>
      "VIES-Dienst zurzeit nicht erreichbar. Erneut versuchen.",
  },
  ERROR: {
    icon: "⚠️",
    label: "Fehler",
    bg: "#fdecec",
    fg: "#a32020",
    border: "#e67373",
    message: (detail) =>
      `Technischer Fehler — Details: ${detail ?? "unbekannt"}`,
  },
  NULL: {
    icon: "?",
    label: "Nicht geprüft",
    bg: "#efefef",
    fg: "#666",
    border: "#bbb",
    message: () => "Nicht geprüft",
  },
};

function formatDate(isoTs: string | null | undefined): string | null {
  if (!isoTs) return null;
  try {
    const d = new Date(isoTs);
    if (Number.isNaN(d.getTime())) return null;
    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const yyyy = d.getFullYear();
    return `${dd}.${mm}.${yyyy}`;
  } catch {
    return null;
  }
}

export function UstIdnrStatusBadge({
  status,
  lastCheckedAt,
  errorDetail,
  testIdSuffix,
  source,
}: UstIdnrStatusBadgeProps) {
  const key = (status ?? "NULL") as keyof typeof MAPPING;
  const map = MAPPING[key];
  const checkedAt = formatDate(lastCheckedAt);
  const message = map.message(errorDetail);
  const tooltip = checkedAt
    ? `${message} · geprüft am ${checkedAt}`
    : message;

  const testId = testIdSuffix
    ? `ustid-status-badge-${testIdSuffix}`
    : "ustid-status-badge";
  const sourceTestId = testIdSuffix
    ? `ustid-source-badge-${testIdSuffix}`
    : "ustid-source-badge";

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
      }}
    >
      <span
        role="status"
        aria-label={message}
        title={tooltip}
        data-testid={testId}
        data-status={status ?? "NULL"}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 4,
          padding: "2px 6px",
          borderRadius: 4,
          border: `1px solid ${map.border}`,
          background: map.bg,
          color: map.fg,
          fontSize: "0.75rem",
          fontWeight: 500,
          whiteSpace: "nowrap",
        }}
      >
        <span aria-hidden="true">{map.icon}</span>
        <span>{map.label}</span>
      </span>
      {source && <SourceBadge source={source} testId={sourceTestId} />}
    </span>
  );
}

function SourceBadge({
  source,
  testId,
}: {
  source: UstIdVerificationSource;
  testId: string;
}) {
  const label =
    source === "BZST" ? "BZSt" : "VIES";
  const tooltip =
    source === "BZST"
      ? "Geprüft via BZSt (DE qualifizierte Bestätigung § 18e UStG)"
      : "Geprüft via VIES (EU-Kommission)";
  // Icons: Shield für BZSt (Behörde, schwer), Globe für VIES (EU-weit)
  const icon = source === "BZST" ? "🛡️" : "🌐";
  return (
    <span
      role="status"
      aria-label={tooltip}
      title={tooltip}
      data-testid={testId}
      data-source={source}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 3,
        padding: "2px 6px",
        borderRadius: 4,
        border: "1px solid #bbb",
        background: "#f4f4f4",
        color: "#333",
        fontSize: "0.7rem",
        fontWeight: 500,
        whiteSpace: "nowrap",
      }}
    >
      <span aria-hidden="true">{icon}</span>
      <span>{label}</span>
    </span>
  );
}
