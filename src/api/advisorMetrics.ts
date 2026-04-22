// Multi-Firmen-Übersicht für Berater:innen, die in mehreren Firmen Mitglied sind.
//
// Für jede Firma werden Schlüsselkennzahlen aggregiert:
//   • Offene Forderungen (Summe + Anzahl überfällig)
//   • Offene Verbindlichkeiten (Summe)
//   • Entwurf-Buchungen (die noch festgeschrieben werden sollten)
//   • Jüngste Aktivität (letzte Buchung)
//
// Im DEMO_MODE gibt es nur eine Pseudo-Firma, die Daten kommen aus dem
// localStorage-Store. Im Supabase-Modus läuft je Firma eine Query, die durch
// RLS auf die Mitgliedschaft des aktuellen Users beschränkt ist.

import type { CompanyMembership } from "../contexts/CompanyContext";
import type { Account, JournalEntry } from "../types/db";
import { buildOpenItems } from "./opos";
import { store } from "./store";
import { DEMO_MODE, supabase } from "./supabase";

export type CompanyHealth = {
  companyId: string;
  companyName: string;
  role: string;

  journalCount: number;
  draftCount: number;
  lastEntryAt: string | null;

  accountCount: number;
  clientCount: number;

  openReceivablesSum: number;
  overdueReceivablesCount: number;
  overdueReceivablesSum: number;
  openPayablesSum: number;

  error?: string;
};

async function fetchCompanyRaw(
  companyId: string
): Promise<{ entries: JournalEntry[]; accounts: Account[]; clients: number }> {
  if (DEMO_MODE) {
    return {
      entries: store.getEntries(),
      accounts: store.getAccounts(),
      clients: store.getClients().length,
    };
  }
  const [entriesRes, accountsRes, clientsRes] = await Promise.all([
    supabase
      .from("journal_entries")
      .select("*")
      .eq("company_id", companyId),
    supabase.from("accounts").select("*").eq("company_id", companyId),
    supabase
      .from("clients")
      .select("id", { count: "exact", head: true })
      .eq("company_id", companyId),
  ]);
  if (entriesRes.error) throw new Error(entriesRes.error.message);
  if (accountsRes.error) throw new Error(accountsRes.error.message);
  return {
    entries: (entriesRes.data ?? []) as JournalEntry[],
    accounts: (accountsRes.data ?? []) as Account[],
    clients: clientsRes.count ?? 0,
  };
}

export async function fetchCompanyHealth(
  membership: CompanyMembership
): Promise<CompanyHealth> {
  const base: CompanyHealth = {
    companyId: membership.companyId,
    companyName: membership.companyName,
    role: membership.role,
    journalCount: 0,
    draftCount: 0,
    lastEntryAt: null,
    accountCount: 0,
    clientCount: 0,
    openReceivablesSum: 0,
    overdueReceivablesCount: 0,
    overdueReceivablesSum: 0,
    openPayablesSum: 0,
  };

  try {
    const { entries, accounts, clients } = await fetchCompanyRaw(
      membership.companyId
    );
    base.journalCount = entries.length;
    base.draftCount = entries.filter((e) => e.status === "entwurf").length;
    base.accountCount = accounts.length;
    base.clientCount = clients;

    const lastEntry = entries
      .slice()
      .sort((a, b) => (b.created_at ?? b.datum).localeCompare(a.created_at ?? a.datum))[0];
    base.lastEntryAt = lastEntry?.created_at ?? lastEntry?.datum ?? null;

    const openItems = buildOpenItems(entries, accounts);
    const receivables = openItems.filter((i) => i.kind === "forderung");
    const overdue = receivables.filter((i) => i.ueberfaellig_tage > 0);
    base.openReceivablesSum = receivables.reduce((s, r) => s + r.offen, 0);
    base.overdueReceivablesCount = overdue.length;
    base.overdueReceivablesSum = overdue.reduce((s, r) => s + r.offen, 0);
    base.openPayablesSum = openItems
      .filter((i) => i.kind === "verbindlichkeit")
      .reduce((s, p) => s + p.offen, 0);
  } catch (err) {
    base.error = (err as Error).message;
  }

  return base;
}

export async function fetchAllMembershipHealth(
  memberships: CompanyMembership[]
): Promise<CompanyHealth[]> {
  return Promise.all(memberships.map((m) => fetchCompanyHealth(m)));
}
