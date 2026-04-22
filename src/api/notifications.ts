// Abgeleitete Benachrichtigungen aus dem lokalen Datenbestand.
// Es gibt keinen separaten Notifications-Datenspeicher — was hier
// angezeigt wird, ergibt sich live aus OPOS / Fristen / Aufbewahrung.
// Dadurch sind alle Einträge immer aktuell und nie „stale".

import { store } from "./store";
import { summarizeOpenItems } from "./opos";
import {
  DEFAULT_DEADLINE_OPTIONS,
  generateDeadlines,
  loadDoneIds,
} from "../data/deadlines";
import { retentionStatus } from "../data/retention";

export type NotificationSeverity = "info" | "warn" | "error";

export type Notification = {
  id: string;
  title: string;
  detail: string;
  severity: NotificationSeverity;
  to: string;
};

export function deriveNotifications(): Notification[] {
  const out: Notification[] = [];

  // 1) Überfällige Forderungen
  const accounts = store.getAccounts();
  const entries = store.getEntries();
  if (accounts.length > 0 && entries.length > 0) {
    const opos = summarizeOpenItems(entries, accounts);
    const overdue = opos.receivables.filter((i) => i.ueberfaellig_tage > 0);
    if (overdue.length > 0) {
      const sum = overdue.reduce((s, i) => s + i.offen, 0);
      out.push({
        id: "opos-overdue",
        title: `${overdue.length} überfällige Forderung${overdue.length === 1 ? "" : "en"}`,
        detail: `Offen: ${sum.toLocaleString("de-DE", {
          style: "currency",
          currency: "EUR",
        })}`,
        severity: "warn",
        to: "/mahnwesen",
      });
    }
  }

  // 2) Fristen in <= 7 Tagen (auf Basis der Default-Optionen)
  try {
    const now = new Date();
    const horizon = new Date(now);
    horizon.setDate(horizon.getDate() + 7);
    const deadlines = generateDeadlines(now, horizon, DEFAULT_DEADLINE_OPTIONS);
    const done = loadDoneIds();
    const pending = deadlines.filter((d) => !done.has(d.id));
    if (pending.length > 0) {
      out.push({
        id: "deadlines-soon",
        title: `${pending.length} Frist${pending.length === 1 ? "" : "en"} in den nächsten 7 Tagen`,
        detail: pending[0].titel,
        severity: pending.length > 3 ? "error" : "warn",
        to: "/einstellungen/fristen",
      });
    }
  } catch {
    /* Fristenberechnung ist optional — Fehler leise übergehen */
  }

  // 3) Aufbewahrungsfristen — Belege abgelaufen oder < 30 Tage
  const docs = store.getDocuments();
  if (docs.length > 0) {
    let expired = 0;
    let expiringSoon = 0;
    for (const d of docs) {
      const st = retentionStatus(d.uploaded_at, "buchungsbeleg");
      if (st.status === "expired") expired++;
      else if (st.status === "due-30d") expiringSoon++;
    }
    if (expired > 0) {
      out.push({
        id: "retention-expired",
        title: `${expired} Beleg${expired === 1 ? "" : "e"} — Aufbewahrungsfrist abgelaufen`,
        detail: "Überprüfung und Archiv-Löschung möglich.",
        severity: "info",
        to: "/einstellungen/aufbewahrung",
      });
    }
    if (expiringSoon > 0) {
      out.push({
        id: "retention-soon",
        title: `${expiringSoon} Beleg${expiringSoon === 1 ? "" : "e"} — Frist endet binnen 30 Tagen`,
        detail: "Prüfen, ob Löschung dokumentiert werden soll.",
        severity: "info",
        to: "/einstellungen/aufbewahrung",
      });
    }
  }

  return out;
}
