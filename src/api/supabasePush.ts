// Einmaliger Push der lokalen Daten nach Supabase.
//
// Nutzungs-Kontext:
//   - Supabase-Schema aus supabase/migrations/0001–0005 bereits eingespielt
//   - Nutzer:in ist eingeloggt (reale Supabase-Auth, NICHT Demo-Modus)
//   - Nutzer:in hat eine Firma (companies-Row) und ist company_members-Mitglied
//
// Diese Funktion liest alles aus localStorage, ordnet es der aktiven Firma
// zu und fügt es per insert in die Ziel-Tabellen ein. Dopplungen werden
// nicht erkannt — nur in Erstmigrationen verwenden.

import { DEMO_MODE, supabase } from "./supabase";
import { store } from "./store";

export type PushProgress = {
  table: string;
  inserted: number;
  failed: number;
  error?: string;
};

export type PushResult = {
  ok: boolean;
  companyId: string | null;
  progress: PushProgress[];
  totalInserted: number;
  totalFailed: number;
  error?: string;
};

async function ensureCompany(
  name: string
): Promise<{ id: string } | { error: string }> {
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) return { error: "Nicht eingeloggt." };

  // Erste Firma, in der der Nutzer Mitglied ist
  const { data: memberships, error: memErr } = await supabase
    .from("company_members")
    .select("company_id")
    .eq("user_id", user.user.id)
    .limit(1);

  if (memErr) return { error: memErr.message };
  if (memberships && memberships.length > 0) {
    return { id: memberships[0].company_id };
  }

  // Keine Firma → eine anlegen und als Owner eintragen
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 50) || `kanzlei-${Date.now()}`;

  const { data: newCompany, error: companyErr } = await supabase
    .from("companies")
    .insert({ name, slug, created_by: user.user.id })
    .select("id")
    .single();
  if (companyErr) return { error: companyErr.message };

  const { error: joinErr } = await supabase
    .from("company_members")
    .insert({ company_id: newCompany.id, user_id: user.user.id, role: "owner" });
  if (joinErr) return { error: joinErr.message };

  return { id: newCompany.id };
}

export async function pushLocalToSupabase(opts: {
  companyName?: string;
}): Promise<PushResult> {
  if (DEMO_MODE) {
    return {
      ok: false,
      companyId: null,
      progress: [],
      totalInserted: 0,
      totalFailed: 0,
      error:
        "Im Demo-Modus gibt es kein echtes Supabase. Für die Übernahme einen Produktivbuild ohne VITE_DEMO_MODE verwenden.",
    };
  }

  const comp = await ensureCompany(opts.companyName || "Meine Kanzlei");
  if ("error" in comp) {
    return {
      ok: false,
      companyId: null,
      progress: [],
      totalInserted: 0,
      totalFailed: 0,
      error: comp.error,
    };
  }
  const companyId = comp.id;
  const progress: PushProgress[] = [];

  async function pushBatch<T>(
    table: string,
    rows: T[],
    transform: (r: T) => Record<string, unknown>
  ) {
    if (rows.length === 0) {
      progress.push({ table, inserted: 0, failed: 0 });
      return;
    }
    const mapped = rows.map((r) => ({ ...transform(r), company_id: companyId }));
    // Batchweise einfügen, damit einzelne defekte Zeilen nicht alle stoppen
    let inserted = 0;
    let failed = 0;
    let lastErr: string | undefined;
    const CHUNK = 100;
    for (let i = 0; i < mapped.length; i += CHUNK) {
      const slice = mapped.slice(i, i + CHUNK);
      const { error } = await supabase.from(table).insert(slice);
      if (error) {
        failed += slice.length;
        lastErr = error.message;
      } else {
        inserted += slice.length;
      }
    }
    progress.push({ table, inserted, failed, error: lastErr });
  }

  // 1. Accounts
  await pushBatch("accounts", store.getAccounts(), (a) => ({
    id: a.id,
    konto_nr: a.konto_nr,
    bezeichnung: a.bezeichnung,
    kategorie: a.kategorie,
    ust_satz: a.ust_satz,
    skr: a.skr,
    is_active: a.is_active,
    created_at: a.created_at,
  }));

  // 2. Clients
  await pushBatch("clients", store.getClients(), (c) => ({
    id: c.id,
    mandant_nr: c.mandant_nr,
    name: c.name,
    steuernummer: c.steuernummer,
    created_at: c.created_at,
  }));

  // 3. Journal entries
  await pushBatch("journal_entries", store.getEntries(), (e) => ({
    id: e.id,
    datum: e.datum,
    beleg_nr: e.beleg_nr,
    beschreibung: e.beschreibung,
    soll_konto: e.soll_konto,
    haben_konto: e.haben_konto,
    betrag: e.betrag,
    ust_satz: e.ust_satz,
    status: e.status,
    client_id: e.client_id,
    skonto_pct: e.skonto_pct,
    skonto_tage: e.skonto_tage,
    gegenseite: e.gegenseite,
    faelligkeit: e.faelligkeit,
    version: e.version,
    created_at: e.created_at,
    updated_at: e.updated_at,
  }));

  // 4. Documents (metadata only — Blobs wandern nicht automatisch in Storage)
  await pushBatch("documents", store.getDocuments(), (d) => ({
    id: d.id,
    file_name: d.file_name,
    file_path: d.file_path,
    mime_type: d.mime_type,
    size_bytes: d.size_bytes,
    beleg_nr: d.beleg_nr,
    ocr_text: d.ocr_text,
    journal_entry_id: d.journal_entry_id,
    uploaded_at: d.uploaded_at,
  }));

  // 5. Audit log — Hash-Kette bleibt erhalten, da wir Zeile-für-Zeile
  //    mit prev_hash + hash einfügen
  await pushBatch("audit_log", store.getAudit(), (a) => ({
    id: a.id,
    at: a.at,
    actor: a.actor,
    action: a.action,
    entity: a.entity,
    entity_id: a.entity_id,
    summary: a.summary,
    before: a.before,
    after: a.after,
    prev_hash: a.prev_hash,
    hash: a.hash,
  }));

  // 6. Dunning records
  await pushBatch("dunning_records", store.getDunnings(), (r) => ({
    id: r.id,
    beleg_nr: r.beleg_nr,
    stage: r.stage,
    gegenseite: r.gegenseite,
    issued_at: r.issued_at,
    betrag_offen: r.betrag_offen,
    fee: r.fee,
    verzugszinsen: r.verzugszinsen,
    faelligkeit_alt: r.faelligkeit_alt,
    faelligkeit_neu: r.faelligkeit_neu,
    ueberfaellig_tage_bei_mahnung: r.ueberfaellig_tage_bei_mahnung,
  }));

  const totalInserted = progress.reduce((s, p) => s + p.inserted, 0);
  const totalFailed = progress.reduce((s, p) => s + p.failed, 0);
  const firstErr = progress.find((p) => p.error);
  return {
    ok: totalFailed === 0,
    companyId,
    progress,
    totalInserted,
    totalFailed,
    error: firstErr?.error,
  };
}
