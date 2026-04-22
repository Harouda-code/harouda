// Backup / Restore für den aktuellen lokalen Datenbestand.
//
// Exportiert alles, was in localStorage steht (Konten, Buchungen, Mandanten,
// Belege, Audit-Log, Mahnungen, Einstellungen, Anlage-N-Entwurf usw.)
// als JSON-Datei. Restore spielt dasselbe zurück.
//
// Ziel: Ausfallssicherheit für die Demo und als Transportformat zwischen
// Browsern / Geräten. Kein Ersatz für eine produktive Backup-Lösung
// (siehe compliance-roadmap.md).

import { downloadBlob } from "../utils/exporters";
import { store } from "./store";

const LEGACY_KEYS = [
  "harouda:accounts",
  "harouda:entries",
  "harouda:clients",
  "harouda:documents",
  "harouda:docBlobs",
  "harouda:audit",
  "harouda:dunnings",
  "harouda:settings",
  "harouda:anlage-n",
  "harouda:anlage-s",
  "harouda:anlage-g",
  "harouda:anlage-v",
  "harouda:anlage-so",
  "harouda:anlage-aus",
  "harouda:anlage-kind",
  "harouda:anlage-vorsorge",
  "harouda:anlage-r",
  "harouda:anlage-kap",
  "harouda:gewst",
  "harouda:kst",
  "harouda:euer-mapping-overrides",
  "harouda:deadlines-done",
  "harouda:deadlines-options",
  "harouda:selectedMandantId",
  "harouda:selectedYear",
];

export type BackupBundle = {
  version: string;
  createdAt: string;
  source: "harouda-app";
  /** Rohdaten pro localStorage-Schlüssel. Werte sind der serialisierte
   *  JSON-String, wie er in localStorage abgelegt war. */
  data: Record<string, string>;
};

const BUNDLE_VERSION = "1.0";

export function createBackupBundle(): BackupBundle {
  const data: Record<string, string> = {};
  for (const key of LEGACY_KEYS) {
    const v = localStorage.getItem(key);
    if (v !== null) data[key] = v;
  }
  return {
    version: BUNDLE_VERSION,
    createdAt: new Date().toISOString(),
    source: "harouda-app",
    data,
  };
}

export function downloadBackup(): void {
  const bundle = createBackupBundle();
  const json = JSON.stringify(bundle, null, 2);
  const blob = new Blob([json], { type: "application/json;charset=utf-8" });
  const stamp = bundle.createdAt.replace(/[:.]/g, "-").slice(0, 19);
  downloadBlob(blob, `harouda-backup-${stamp}.json`);
}

export type RestoreOptions = {
  /** Bestehende Daten löschen, bevor das Backup eingespielt wird. */
  replaceExisting?: boolean;
};

export type RestoreResult = {
  ok: boolean;
  restored: number;
  skipped: number;
  error?: string;
};

export function restoreFromBundle(
  bundle: unknown,
  options: RestoreOptions = {}
): RestoreResult {
  if (!isBackupBundle(bundle)) {
    return {
      ok: false,
      restored: 0,
      skipped: 0,
      error: "Datei ist kein gültiges harouda-Backup.",
    };
  }

  try {
    if (options.replaceExisting) {
      for (const key of LEGACY_KEYS) localStorage.removeItem(key);
    }
    let restored = 0;
    let skipped = 0;
    for (const [key, value] of Object.entries(bundle.data)) {
      if (!LEGACY_KEYS.includes(key)) {
        skipped++;
        continue;
      }
      localStorage.setItem(key, value);
      restored++;
    }
    return { ok: true, restored, skipped };
  } catch (err) {
    return {
      ok: false,
      restored: 0,
      skipped: 0,
      error: (err as Error).message,
    };
  }
}

function isBackupBundle(x: unknown): x is BackupBundle {
  if (!x || typeof x !== "object") return false;
  const b = x as Record<string, unknown>;
  return (
    typeof b.version === "string" &&
    typeof b.createdAt === "string" &&
    b.source === "harouda-app" &&
    !!b.data &&
    typeof b.data === "object"
  );
}

export async function pickAndRestore(options: RestoreOptions = {}): Promise<
  RestoreResult
> {
  return new Promise((resolve) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "application/json,.json";
    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) {
        resolve({
          ok: false,
          restored: 0,
          skipped: 0,
          error: "Keine Datei ausgewählt.",
        });
        return;
      }
      const reader = new FileReader();
      reader.onerror = () =>
        resolve({
          ok: false,
          restored: 0,
          skipped: 0,
          error: "Datei konnte nicht gelesen werden.",
        });
      reader.onload = () => {
        try {
          const parsed = JSON.parse(reader.result as string);
          resolve(restoreFromBundle(parsed, options));
        } catch {
          resolve({
            ok: false,
            restored: 0,
            skipped: 0,
            error: "JSON konnte nicht geparst werden.",
          });
        }
      };
      reader.readAsText(file);
    };
    input.click();
  });
}

/** Summaries für die UI, damit der Nutzer weiß, was im Paket steckt. */
export function summarizeLocalState(): {
  accounts: number;
  entries: number;
  clients: number;
  documents: number;
  audit: number;
  dunnings: number;
} {
  return {
    accounts: store.getAccounts().length,
    entries: store.getEntries().length,
    clients: store.getClients().length,
    documents: store.getDocuments().length,
    audit: store.getAudit().length,
    dunnings: store.getDunnings().length,
  };
}
