// Mandanten-Datenexport nach DSGVO Art. 20 (Recht auf Datenübertragbarkeit)
// und Art. 15 Abs. 3 (Kopie der verarbeiteten Daten).
//
// WICHTIG — was das IST und was es NICHT ist:
//
//   ✓ Ein Moment-Export der Daten, die für den aufrufenden User per
//     Row-Level-Security sichtbar sind, als ZIP mit JSON-Dateien und
//     SHA-256-Integritätsprüfung.
//   ✗ KEIN Disaster-Recovery-Backup. Der Export lebt im Browser, wird
//     clientseitig erzeugt und kann nicht automatisiert wiederhergestellt
//     werden. Für echtes Backup siehe docs/BACKUP-STRATEGY.md.
//   ✗ KEINE kryptographische Signatur. Die SHA-256-Hashes erkennen
//     unbeabsichtigte Korruption; wer die ZIP-Datei verändern kann, kann
//     auch die Hashes neu berechnen.
//
// Reuse:
//   - `canonicalize` + `sha256Hex` aus lib/crypto/payrollHash.ts
//   - `createZipFromFiles` aus lib/zip/zipBundler.ts
//
// Das Modul ist eine reine Funktion: sie bekommt vorher-gefetchte Tabellen-
// Daten als Input und gibt ZIP + Manifest zurück. Das Fetchen selbst (mit
// dual-mode store/Supabase) macht die Page. So bleibt der Service rein,
// deterministisch und einfach testbar.

import { canonicalize, sha256Hex } from "../../lib/crypto/payrollHash";
import { createZipFromFiles, readZipToFiles } from "../../lib/zip/zipBundler";

export type ExportPurpose =
  | "DSGVO_ART_20_PORTABILITY"
  | "DSGVO_ART_15_COPY"
  | "USER_ARCHIVE";

export interface DataSource {
  /** Kanonischer Tabellenname (klein, snake_case). */
  tableName: string;
  /** Datenzeilen, so wie das UI sie bereits geladen hat. */
  rows: unknown[];
}

export interface DatenExportOptions {
  mandantId: string;
  userId: string;
  purpose: ExportPurpose;
  sources: DataSource[];
  /** Audit-Log beifügen? Default: true (volle Transparenz). */
  includeAuditLog?: boolean;
  schemaVersion?: string;
  appVersion?: string;
  /** Für deterministische Tests. */
  now?: Date;
}

export interface TableManifestEntry {
  name: string;
  rowCount: number;
  sizeBytes: number;
  sha256: string;
}

export interface Disclaimers {
  notABackup: string;
  tamperingNote: string;
  rlsLimitation: string;
}

export interface DatenExportManifest {
  id: string;
  createdAt: string;
  createdBy: string;
  mandantId: string;
  purpose: ExportPurpose;
  schemaVersion: string;
  appVersion: string;
  tables: TableManifestEntry[];
  totalSizeBytes: number;
  manifestSha256: string;
  disclaimers: Disclaimers;
}

export interface DatenExportResult {
  manifest: DatenExportManifest;
  zip: Blob;
  warnings: string[];
}

export const DISCLAIMERS: Disclaimers = {
  notABackup:
    "Dieser Export ist KEIN Disaster-Recovery-Backup. Er stellt den Stand der Daten zum Exportzeitpunkt dar und kann nicht automatisch wiederhergestellt werden. Für echtes Disaster Recovery wenden Sie sich an Ihre:n Supabase-Administrator:in (PITR / pg_dump). Siehe docs/BACKUP-STRATEGY.md.",
  tamperingNote:
    "SHA-256-Hashes erkennen NUR unbeabsichtigte Korruption. Wer Zugriff auf diese Datei hat, kann auch die Hashes neu berechnen. Dies ist KEINE kryptographische Signatur.",
  rlsLimitation:
    "Der Export enthält ausschließlich Daten, die für die aufrufende Person per Row-Level-Security sichtbar sind. Tabellen können teilweise oder vollständig fehlen, abhängig von der Rolle.",
};

const UUID_RE = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/;

function newId(): string {
  const g = globalThis as { crypto?: { randomUUID?: () => string } };
  if (g.crypto?.randomUUID) return g.crypto.randomUUID();
  // happy-dom + alte Node-Versionen: einfache Fallback-UUID.
  return "00000000-0000-4000-8000-" + Math.random().toString(16).slice(2, 14).padEnd(12, "0");
}

/** Manifest-Hash über alles AUSSER `manifestSha256` selbst. Verhindert
 *  zirkulären Hash auf sich selbst. */
async function hashManifest(
  m: Omit<DatenExportManifest, "manifestSha256">
): Promise<string> {
  return await sha256Hex(canonicalize(m));
}

const enc = new TextEncoder();

export async function exportMandantenDaten(
  options: DatenExportOptions
): Promise<DatenExportResult> {
  const warnings: string[] = [];
  const now = options.now ?? new Date();

  // Audit-Log ggf. filtern.
  const includeAudit = options.includeAuditLog !== false;
  const sources = includeAudit
    ? options.sources
    : options.sources.filter((s) => s.tableName !== "audit_log");

  // Gesamt-Leer-Check: Wenn alle Quellen leer sind, ist das EIN Warnsignal,
  // nicht ein stiller Erfolg. Explizite Warnung — Nutzer:in soll wissen,
  // dass nichts exportiert wurde.
  const totalRows = sources.reduce((s, src) => s + src.rows.length, 0);
  if (totalRows === 0) {
    warnings.push(
      "Leerer Export: keine einzige Datenzeile gefunden. Prüfen Sie Mandant-Auswahl und Berechtigungen (RLS)."
    );
  }

  // Tabellen serialisieren + hashen.
  const files = new Map<string, Uint8Array>();
  const tableEntries: TableManifestEntry[] = [];

  for (const src of sources) {
    const canonical = canonicalize(src.rows);
    const bytes = enc.encode(canonical);
    const fileName = `tables/${src.tableName}.json`;
    files.set(fileName, bytes);
    tableEntries.push({
      name: src.tableName,
      rowCount: src.rows.length,
      sizeBytes: bytes.length,
      sha256: await sha256Hex(canonical),
    });
  }

  tableEntries.sort((a, b) => a.name.localeCompare(b.name));
  const totalSizeBytes = tableEntries.reduce((s, t) => s + t.sizeBytes, 0);

  // Manifest aufbauen (ohne eigenen Hash).
  const manifestBase: Omit<DatenExportManifest, "manifestSha256"> = {
    id: newId(),
    createdAt: now.toISOString(),
    createdBy: options.userId,
    mandantId: options.mandantId,
    purpose: options.purpose,
    schemaVersion: options.schemaVersion ?? "0023",
    appVersion: options.appVersion ?? "dev",
    tables: tableEntries,
    totalSizeBytes,
    disclaimers: DISCLAIMERS,
  };
  const manifest: DatenExportManifest = {
    ...manifestBase,
    manifestSha256: await hashManifest(manifestBase),
  };

  // MANIFEST.json + DISCLAIMER.txt beifügen.
  files.set(
    "MANIFEST.json",
    enc.encode(JSON.stringify(manifest, null, 2))
  );
  files.set("DISCLAIMER.txt", enc.encode(buildDisclaimerText(manifest)));

  const zip = await createZipFromFiles(files);

  return { manifest, zip, warnings };
}

function buildDisclaimerText(m: DatenExportManifest): string {
  return [
    "harouda-app — Mandanten-Datenexport",
    "====================================",
    "",
    `Erstellt am: ${m.createdAt}`,
    `Mandant:     ${m.mandantId}`,
    `Zweck:       ${m.purpose}`,
    `Export-ID:   ${m.id}`,
    `Schema:      ${m.schemaVersion}`,
    `App:         ${m.appVersion}`,
    "",
    "WICHTIGE HINWEISE",
    "-----------------",
    "",
    "1) KEIN BACKUP",
    `   ${m.disclaimers.notABackup}`,
    "",
    "2) HASH-VERLÄSSLICHKEIT",
    `   ${m.disclaimers.tamperingNote}`,
    "",
    "3) SICHTBARKEIT (RLS)",
    `   ${m.disclaimers.rlsLimitation}`,
    "",
    "INTEGRITÄT PRÜFEN",
    "-----------------",
    "",
    "Laden Sie die ZIP-Datei auf der Seite /admin/datenexport (Sektion",
    `"Integrität prüfen") hoch. Das Tool berechnet die SHA-256-Hashes`,
    "aus MANIFEST.json erneut und meldet Abweichungen.",
    "",
    "ENTHALTENE TABELLEN",
    "-------------------",
    "",
    ...m.tables.map(
      (t) => `  ${t.name.padEnd(32)} ${String(t.rowCount).padStart(8)} Zeilen   ${t.sha256.slice(0, 16)}…`
    ),
    "",
    `  Gesamt: ${m.totalSizeBytes} Bytes über ${m.tables.length} Tabellen`,
    "",
  ].join("\n");
}

// ---------------------------------------------------------------------------
// Verification
// ---------------------------------------------------------------------------

export interface VerifyResult {
  manifestValid: boolean;
  tablesValid: boolean;
  errors: string[];
  warnings: string[];
  manifest?: DatenExportManifest;
}

const dec = new TextDecoder("utf-8");

/**
 * Lädt eine erzeugte Export-ZIP und prüft:
 *   - MANIFEST.json vorhanden + parsebar
 *   - Manifest-Hash (über Manifest ohne Hash-Feld) stimmt
 *   - Jeder Tabellen-Hash stimmt mit der tatsächlichen Datei überein
 *
 * Erkennt ausschließlich Korruption, nicht gezielte Manipulation
 * (siehe DISCLAIMER.txt, Punkt 2).
 */
export async function verifyExportZip(zipBlob: Blob): Promise<VerifyResult> {
  const errors: string[] = [];
  const warnings: string[] = [];

  let files: Map<string, Uint8Array>;
  try {
    files = await readZipToFiles(zipBlob);
  } catch (e) {
    return {
      manifestValid: false,
      tablesValid: false,
      errors: [`ZIP nicht lesbar: ${(e as Error).message}`],
      warnings,
    };
  }

  const manifestBytes = files.get("MANIFEST.json");
  if (!manifestBytes) {
    return {
      manifestValid: false,
      tablesValid: false,
      errors: ["MANIFEST.json fehlt in der ZIP-Datei."],
      warnings,
    };
  }

  let manifest: DatenExportManifest;
  try {
    manifest = JSON.parse(dec.decode(manifestBytes)) as DatenExportManifest;
  } catch (e) {
    return {
      manifestValid: false,
      tablesValid: false,
      errors: [`MANIFEST.json nicht parsebar: ${(e as Error).message}`],
      warnings,
    };
  }

  // Manifest-Integrität.
  const { manifestSha256, ...manifestNoHash } = manifest;
  const recomputedManifestHash = await sha256Hex(canonicalize(manifestNoHash));
  const manifestValid = recomputedManifestHash === manifestSha256;
  if (!manifestValid) {
    errors.push(
      `Manifest-Hash stimmt nicht: erwartet ${manifestSha256}, errechnet ${recomputedManifestHash}`
    );
  }

  // Tabellen-Integrität.
  let tablesValid = true;
  for (const entry of manifest.tables) {
    const fileName = `tables/${entry.name}.json`;
    const bytes = files.get(fileName);
    if (!bytes) {
      tablesValid = false;
      errors.push(`Tabellendatei fehlt: ${fileName}`);
      continue;
    }
    if (bytes.length !== entry.sizeBytes) {
      tablesValid = false;
      errors.push(
        `Größe weicht ab für ${entry.name}: erwartet ${entry.sizeBytes}, gelesen ${bytes.length}`
      );
    }
    const actualHash = await sha256Hex(dec.decode(bytes));
    if (actualHash !== entry.sha256) {
      tablesValid = false;
      errors.push(
        `Hash weicht ab für ${entry.name}: erwartet ${entry.sha256}, errechnet ${actualHash}`
      );
    }
  }

  // Sanity-Warnhinweise (nicht-fatal).
  if (!UUID_RE.test(manifest.id)) {
    warnings.push(`Manifest-ID hat kein UUID-Format: ${manifest.id}`);
  }

  return {
    manifestValid,
    tablesValid,
    errors,
    warnings,
    manifest,
  };
}
