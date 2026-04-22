import type { JournalInput } from "./journal";

export type JournalTemplate = {
  id: string;
  name: string;
  createdAt: string;
  /** Template body — the datum is deliberately NOT persisted; consumer sets it
   *  to the current date (or next booking date) when applying. */
  body: Omit<JournalInput, "datum">;
};

const STORAGE_KEY_PREFIX = "harouda:journalTemplates:";

function storageKey(companyId: string | null): string {
  return `${STORAGE_KEY_PREFIX}${companyId ?? "demo"}`;
}

export function loadTemplates(companyId: string | null): JournalTemplate[] {
  try {
    const raw = localStorage.getItem(storageKey(companyId));
    if (!raw) return [];
    const parsed = JSON.parse(raw) as JournalTemplate[];
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (t) => t && typeof t.id === "string" && typeof t.name === "string"
    );
  } catch {
    return [];
  }
}

function writeTemplates(companyId: string | null, list: JournalTemplate[]) {
  localStorage.setItem(storageKey(companyId), JSON.stringify(list));
}

export function saveTemplate(
  companyId: string | null,
  name: string,
  input: JournalInput
): JournalTemplate {
  const trimmed = name.trim();
  if (trimmed.length === 0) throw new Error("Vorlagenname ist Pflicht.");
  if (trimmed.length > 80)
    throw new Error("Vorlagenname darf max. 80 Zeichen lang sein.");
  const list = loadTemplates(companyId);
  if (list.some((t) => t.name.toLowerCase() === trimmed.toLowerCase())) {
    throw new Error(`Vorlage "${trimmed}" existiert bereits.`);
  }
  const { datum: _datum, ...body } = input;
  void _datum;
  const tpl: JournalTemplate = {
    id: crypto.randomUUID(),
    name: trimmed,
    createdAt: new Date().toISOString(),
    body,
  };
  writeTemplates(companyId, [...list, tpl]);
  return tpl;
}

export function deleteTemplate(companyId: string | null, id: string): void {
  const list = loadTemplates(companyId);
  writeTemplates(
    companyId,
    list.filter((t) => t.id !== id)
  );
}

export function applyTemplate(
  tpl: JournalTemplate,
  datum: string
): JournalInput {
  return { ...tpl.body, datum };
}
