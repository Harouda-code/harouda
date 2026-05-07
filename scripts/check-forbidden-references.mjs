#!/usr/bin/env node
// scripts/check-forbidden-references.mjs
//
// Forbidden Reference Quality Gate V1
//
// Walks repository content and reports findings against a set of
// neutral, encoded patterns. Findings are categorized by neutral
// category names. Restricted vocabulary is never echoed; matched
// substrings are redacted in all output channels.
//
// Usage:
//   node scripts/check-forbidden-references.mjs           # scan; exit 1 on BLOCKED
//   node scripts/check-forbidden-references.mjs --json    # JSON output mode
//   node scripts/check-forbidden-references.mjs --update-baseline
//   node scripts/check-forbidden-references.mjs --help

import { readFileSync, writeFileSync, readdirSync, statSync } from "node:fs";
import { createHash } from "node:crypto";
import { join, sep, relative } from "node:path";
import { fileURLToPath } from "node:url";

// ----------------------- Resolve paths --------------------------------------

const SCRIPT_DIR = fileURLToPath(new URL(".", import.meta.url));
const REPO_ROOT_DEFAULT = join(SCRIPT_DIR, "..");

// ----------------------- Argument parsing -----------------------------------

const argv = process.argv.slice(2);
const argSet = new Set(argv);
const FLAG_JSON = argSet.has("--json");
const FLAG_UPDATE = argSet.has("--update-baseline");
const FLAG_HELP = argSet.has("--help") || argSet.has("-h");

let ROOT_OVERRIDE = null;
for (let i = 0; i < argv.length; i++) {
  if (argv[i] === "--root" && argv[i + 1]) {
    ROOT_OVERRIDE = argv[i + 1];
    i++;
  }
}
const SCAN_ROOT = ROOT_OVERRIDE ? ROOT_OVERRIDE : REPO_ROOT_DEFAULT;

// Data and baseline files: when --root override is in effect (test mode),
// look under <root>/scripts/ so isolated test workspaces can use their own
// fixtures. Otherwise use the canonical files next to the scanner.
const DATA_FILE = ROOT_OVERRIDE
  ? join(ROOT_OVERRIDE, "scripts", "forbidden-references.data.json")
  : join(SCRIPT_DIR, "forbidden-references.data.json");
const BASELINE_FILE = ROOT_OVERRIDE
  ? join(ROOT_OVERRIDE, "scripts", "forbidden-references.baseline.json")
  : join(SCRIPT_DIR, "forbidden-references.baseline.json");

if (FLAG_HELP) {
  process.stdout.write([
    "Usage: node scripts/check-forbidden-references.mjs [--json] [--update-baseline] [--help]",
    "",
    "Forbidden Reference Quality Gate V1.",
    "Walks scoped repository paths and reports findings against neutral,",
    "encoded patterns. Output is redacted: matched substrings never echoed.",
    "",
    "Flags:",
    "  --json              emit machine-readable JSON",
    "  --update-baseline   regenerate baseline file from current scan",
    "  --root <path>       override repo root (test-only)",
    "  --help, -h          this message",
    "",
    "Exit codes: 0 = no BLOCKED; 1 = at least one BLOCKED; 2 = scanner error",
  ].join("\n") + "\n");
  process.exit(0);
}

// ----------------------- Configuration --------------------------------------

const SCOPED_PATHS = [
  "docs",
  "src",
  "supabase",
  "scripts",
  "public",
  "package.json",
  ".github/workflows",
];

// Excluded paths (relative-posix, against SCAN_ROOT) and excluded directory names
const EXCLUDED_RELATIVE = new Set([
  "scripts/forbidden-references.data.json",
  "scripts/forbidden-references.baseline.json",
]);

const EXCLUDED_NAMES = new Set([
  "node_modules",
  "dist",
  "coverage",
  ".git",
  "demo-package",
]);

const BINARY_EXTENSIONS = new Set([
  ".png", ".jpg", ".jpeg", ".gif", ".pdf", ".zip", ".gz", ".tar",
  ".ico", ".woff", ".woff2", ".ttf", ".otf", ".mp4", ".webp",
]);

const VALID_CATEGORIES = new Set([
  "superseded_reference",
  "forbidden_public_claim",
  "project_forbidden_term",
  "disallowed_language_context",
  "risky_positioning_language",
]);

// ----------------------- Helpers --------------------------------------------

function toPosix(p) {
  return p.split(sep).join("/");
}

function relPosix(p) {
  return toPosix(relative(SCAN_ROOT, p));
}

/**
 * Convert any byte buffer to LF-normalized UTF-8 string.
 * Strips a leading BOM if present. Replaces CRLF and lone CR with LF.
 */
function normalizeContent(buffer) {
  let s = buffer.toString("utf8");
  if (s.charCodeAt(0) === 0xfeff) s = s.slice(1);
  return s.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
}

/**
 * Strip trailing spaces and tabs from a single line (deterministic
 * normalization for context hashing).
 */
function rtrim(line) {
  return line.replace(/[ \t]+$/g, "");
}

/**
 * Compute SHA-256 of a 5-line window (line index ± 2), with empty
 * padding outside file boundaries.
 */
function contextHash(lines, lineIdx) {
  const window = [];
  for (let i = lineIdx - 2; i <= lineIdx + 2; i++) {
    if (i < 0 || i >= lines.length) {
      window.push("");
    } else {
      window.push(rtrim(lines[i]));
    }
  }
  const bytes = Buffer.from(window.join("\n"), "utf8");
  return createHash("sha256").update(bytes).digest("hex");
}

// ----------------------- File walk ------------------------------------------

function* walk(absDir) {
  let entries;
  try {
    entries = readdirSync(absDir, { withFileTypes: true });
  } catch {
    return;
  }
  // Sort entries so traversal is deterministic
  entries.sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0));
  for (const entry of entries) {
    if (EXCLUDED_NAMES.has(entry.name)) continue;
    const full = join(absDir, entry.name);
    const rel = relPosix(full);
    if (EXCLUDED_RELATIVE.has(rel)) continue;
    if (entry.isDirectory()) {
      yield* walk(full);
    } else if (entry.isFile()) {
      const idx = entry.name.lastIndexOf(".");
      const ext = idx >= 0 ? entry.name.slice(idx).toLowerCase() : "";
      if (BINARY_EXTENSIONS.has(ext)) continue;
      yield full;
    }
  }
}

function* iterScopedFiles() {
  for (const sp of SCOPED_PATHS) {
    const full = join(SCAN_ROOT, sp);
    let st;
    try {
      st = statSync(full);
    } catch {
      continue;
    }
    if (st.isDirectory()) {
      yield* walk(full);
    } else if (st.isFile()) {
      const rel = relPosix(full);
      if (EXCLUDED_RELATIVE.has(rel)) continue;
      yield full;
    }
  }
}

// ----------------------- Pattern loading ------------------------------------

function fail(msg) {
  process.stderr.write(`scanner-error: ${msg}\n`);
  process.exit(2);
}

function loadPatterns() {
  let raw;
  try {
    raw = readFileSync(DATA_FILE, "utf8");
  } catch (err) {
    fail(`cannot read pattern data file: ${err.message}`);
  }
  let data;
  try {
    data = JSON.parse(raw);
  } catch (err) {
    fail(`pattern data file is not valid JSON: ${err.message}`);
  }
  if (!data || typeof data !== "object" || data.version !== 1 ||
      !data.categories || typeof data.categories !== "object") {
    fail("pattern data file shape invalid (expected version=1, categories object)");
  }
  const decoded = {};
  for (const [category, list] of Object.entries(data.categories)) {
    if (!VALID_CATEGORIES.has(category)) {
      fail(`invalid category in data file: ${category}`);
    }
    if (!Array.isArray(list)) {
      fail(`category ${category} is not an array`);
    }
    decoded[category] = [];
    for (const b64 of list) {
      if (typeof b64 !== "string" || b64.length === 0) {
        fail(`empty or non-string pattern in category ${category}`);
      }
      let str;
      try {
        str = Buffer.from(b64, "base64").toString("utf8");
      } catch (err) {
        fail(`cannot decode pattern in category ${category}: ${err.message}`);
      }
      if (!str || str.length === 0) {
        fail(`empty decoded pattern in category ${category}`);
      }
      decoded[category].push(str.toLowerCase());
    }
  }
  return decoded;
}

// ----------------------- Allow-marker detection -----------------------------

const ALLOW_MARKER_RE = /forbidden-ref-allow:\s*([a-z_]+)\s+reason="([^"]*)"/i;

function findAllowMarker(lines, lineIdx, category) {
  // V1: only the same line OR the immediately-preceding line.
  const candidates = [];
  if (lineIdx >= 0 && lineIdx < lines.length) candidates.push(lines[lineIdx]);
  if (lineIdx - 1 >= 0) candidates.push(lines[lineIdx - 1]);
  for (const ln of candidates) {
    const m = ALLOW_MARKER_RE.exec(ln);
    if (!m) continue;
    if (m[1].toLowerCase() !== category) continue;
    if (!m[2] || m[2].trim() === "") continue;
    return { reason: m[2] };
  }
  return null;
}

// ----------------------- Baseline I/O ---------------------------------------

function loadBaseline() {
  let raw;
  try {
    raw = readFileSync(BASELINE_FILE, "utf8");
  } catch {
    return { version: 1, entries: [] };
  }
  let data;
  try {
    data = JSON.parse(raw);
  } catch (err) {
    fail(`baseline file is not valid JSON: ${err.message}`);
  }
  if (!data || data.version !== 1 || !Array.isArray(data.entries)) {
    fail("baseline file shape invalid (expected version=1, entries array)");
  }
  for (const e of data.entries) {
    if (!e || typeof e !== "object" ||
        typeof e.category !== "string" ||
        typeof e.file_path_hash !== "string" ||
        typeof e.file_path_redacted !== "string" ||
        typeof e.line_number !== "number" ||
        typeof e.context_hash !== "string") {
      fail("baseline entry shape invalid (need category, file_path_hash, file_path_redacted, line_number, context_hash)");
    }
    if (!VALID_CATEGORIES.has(e.category)) {
      fail(`baseline entry has invalid category: ${e.category}`);
    }
  }
  return data;
}

function serializeBaseline(entries) {
  // Stable sort by (category, file_path_hash, line_number, context_hash).
  // Note: sort key uses file_path_hash (deterministic across OS) rather than
  // the redacted path (which is for human readability only).
  const sorted = [...entries].sort((a, b) => {
    if (a.category !== b.category) return a.category < b.category ? -1 : 1;
    if (a.file_path_hash !== b.file_path_hash) return a.file_path_hash < b.file_path_hash ? -1 : 1;
    if (a.line_number !== b.line_number) return a.line_number - b.line_number;
    if (a.context_hash !== b.context_hash) return a.context_hash < b.context_hash ? -1 : 1;
    return 0;
  });
  const ordered = sorted.map((e) => ({
    category: e.category,
    file_path_hash: e.file_path_hash,
    file_path_redacted: e.file_path_redacted,
    line_number: e.line_number,
    context_hash: e.context_hash,
  }));
  const obj = { version: 1, entries: ordered };
  return JSON.stringify(obj, null, 2) + "\n";
}

function writeBaseline(entries) {
  writeFileSync(BASELINE_FILE, serializeBaseline(entries), "utf8");
}

// ----------------------- Scan -----------------------------------------------

function pathHash(relPath) {
  // SHA-256 of the LF-normalized UTF-8 bytes of the POSIX-form relative
  // path. Deterministic across Windows/Linux because path normalization
  // to forward-slash POSIX form happens before this hash.
  return createHash("sha256").update(Buffer.from(relPath, "utf8")).digest("hex");
}

function buildBaselineIndices(baseline) {
  // Keys use file_path_hash so the in-memory index never depends on the
  // raw path. The baseline file itself stores only file_path_hash and
  // file_path_redacted; raw paths exist only transiently in scanner memory.
  const exact = new Set();
  const byLine = new Map();
  const byHash = new Map();
  for (const e of baseline.entries) {
    const exactKey = `${e.category} ${e.file_path_hash} ${e.line_number} ${e.context_hash}`;
    const lineKey = `${e.category} ${e.file_path_hash} ${e.line_number}`;
    const hashKey = `${e.category} ${e.file_path_hash} ${e.context_hash}`;
    exact.add(exactKey);
    byLine.set(lineKey, e);
    byHash.set(hashKey, e);
  }
  return { exact, byLine, byHash };
}

function maskMatch(line, lowerLine, pattern) {
  const idx = lowerLine.indexOf(pattern);
  if (idx === -1) return line;
  return line.slice(0, idx) + "***" + line.slice(idx + pattern.length);
}

/**
 * Mask EVERY occurrence of EVERY pattern (across all categories) in a string.
 * Used for output redaction so file paths and surrounding context lines
 * never leak restricted vocabulary in stdout/JSON.
 */
function maskAll(str, allPatterns) {
  if (!str) return str;
  let result = str;
  let lower = result.toLowerCase();
  for (const p of allPatterns) {
    if (p.length === 0) continue;
    let idx = lower.indexOf(p);
    while (idx !== -1) {
      result = result.slice(0, idx) + "***" + result.slice(idx + p.length);
      lower = result.toLowerCase();
      idx = lower.indexOf(p);
    }
  }
  return result;
}

function flattenAllPatterns(patternsByCategory) {
  const out = [];
  for (const list of Object.values(patternsByCategory)) {
    for (const p of list) out.push(p);
  }
  return out;
}

/**
 * Defense-in-depth: replace every character in Unicode script blocks that
 * the project disallows for repo-visible output with '*'. Applied as a
 * final pass on every output line so surrounding restricted script content
 * cannot leak even if not present as an explicit pattern.
 *
 * Covered ranges (declared via ASCII-only \uXXXX escapes so this source
 * file itself contains zero literal disallowed-script characters):
 *   - Arabic                       U+0600 - U+06FF
 *   - Arabic Supplement            U+0750 - U+077F
 *   - Arabic Extended-A            U+08A0 - U+08FF
 *   - Arabic Presentation Forms-A  U+FB50 - U+FDFF
 *   - Arabic Presentation Forms-B  U+FE70 - U+FEFF
 */
const DISALLOWED_SCRIPT_RE = new RegExp(
  "[\\u0600-\\u06FF\\u0750-\\u077F\\u08A0-\\u08FF\\uFB50-\\uFDFF\\uFE70-\\uFEFF]",
  "g"
);

function redactDisallowedScripts(str) {
  if (!str) return str;
  return str.replace(DISALLOWED_SCRIPT_RE, "*");
}

/** Apply both pattern-aware masking and disallowed-script redaction. */
function fullyRedact(str, allPatterns) {
  return redactDisallowedScripts(maskAll(str, allPatterns));
}

function scan(patternsByCategory, baseline) {
  const indices = buildBaselineIndices(baseline);
  const allPatterns = flattenAllPatterns(patternsByCategory);
  const findings = [];

  for (const absPath of iterScopedFiles()) {
    let buf;
    try {
      buf = readFileSync(absPath);
    } catch {
      continue;
    }
    // Heuristic: NUL byte in first 8 KB => likely binary; skip
    if (buf.subarray(0, Math.min(buf.length, 8192)).includes(0)) continue;

    let content;
    try {
      content = normalizeContent(buf);
    } catch {
      continue;
    }
    const lines = content.split("\n");
    const lowerLines = lines.map((l) => l.toLowerCase());
    const fileRel = relPosix(absPath);

    for (const [category, patterns] of Object.entries(patternsByCategory)) {
      for (const pattern of patterns) {
        if (pattern.length === 0) continue;
        for (let i = 0; i < lowerLines.length; i++) {
          if (!lowerLines[i].includes(pattern)) continue;
          const lineNumber = i + 1;
          const ch = contextHash(lines, i);
          const fpHash = pathHash(fileRel);
          const fpRedacted = fullyRedact(fileRel, allPatterns);
          const exactKey = `${category} ${fpHash} ${lineNumber} ${ch}`;
          const lineKey = `${category} ${fpHash} ${lineNumber}`;
          const hashKey = `${category} ${fpHash} ${ch}`;

          let status;
          let detail = "";
          if (indices.exact.has(exactKey)) {
            status = "BASELINE_ALLOWED";
          } else if (indices.byLine.has(lineKey)) {
            status = "BLOCKED";
            detail = "context changed";
          } else if (indices.byHash.has(hashKey)) {
            status = "BLOCKED";
            detail = "line moved";
          } else {
            status = "BLOCKED";
            detail = "new finding";
          }
          if (status === "BLOCKED") {
            const marker = findAllowMarker(lines, i, category);
            if (marker) {
              status = "ALLOW_MARKED";
              detail = `allow marker reason="${marker.reason}"`;
            }
          }

          // Build redacted 3-line context window. Apply BOTH pattern-aware
          // masking AND disallowed-script Unicode-block redaction so neither
          // an extra unlisted Latin restricted vocabulary nor any additional
          // Arabic characters in surrounding context leak via stdout/JSON.
          const ctx = [];
          const lo = Math.max(0, i - 1);
          const hi = Math.min(lines.length - 1, i + 1);
          for (let j = lo; j <= hi; j++) {
            const masked = fullyRedact(lines[j], allPatterns);
            ctx.push(`${j + 1}: ${masked}`);
          }

          findings.push({
            category,
            file_path_hash: fpHash,
            file_path_redacted: fpRedacted,
            line_number: lineNumber,
            context_hash: ch,
            status,
            detail,
            redacted_context: ctx.join("\n"),
          });
        }
      }
    }
  }

  return findings;
}

// ----------------------- Output ---------------------------------------------

function summarize(findings) {
  return {
    blocked: findings.filter((f) => f.status === "BLOCKED"),
    baselineAllowed: findings.filter((f) => f.status === "BASELINE_ALLOWED"),
    allowMarked: findings.filter((f) => f.status === "ALLOW_MARKED"),
  };
}

function emitText(findings) {
  const { blocked, baselineAllowed, allowMarked } = summarize(findings);
  const out = [];
  out.push("Forbidden Reference Quality Gate V1 — Scan Result");
  out.push("================================================");
  out.push(`BLOCKED:           ${blocked.length}`);
  out.push(`BASELINE_ALLOWED:  ${baselineAllowed.length}`);
  out.push(`ALLOW_MARKED:      ${allowMarked.length}`);
  out.push("");
  if (blocked.length > 0) {
    out.push("--- BLOCKED findings (must remediate before merge) ---");
    for (const f of blocked) {
      out.push(`[${f.status}] [${f.detail}] category=${f.category} ${f.file_path_redacted}:${f.line_number}`);
      out.push("  redacted-context:");
      for (const cl of f.redacted_context.split("\n")) {
        out.push(`    ${cl}`);
      }
    }
    out.push("");
  }
  if (allowMarked.length > 0) {
    out.push("--- ALLOW_MARKED findings (in-line markers; auditable) ---");
    for (const f of allowMarked) {
      out.push(`[${f.status}] [${f.detail}] category=${f.category} ${f.file_path_redacted}:${f.line_number}`);
    }
    out.push("");
  }
  if (baselineAllowed.length > 0) {
    // Per-category counts only for the baseline section to keep output compact
    const byCat = new Map();
    for (const f of baselineAllowed) {
      byCat.set(f.category, (byCat.get(f.category) ?? 0) + 1);
    }
    out.push("--- BASELINE_ALLOWED counts by category ---");
    for (const [cat, n] of [...byCat.entries()].sort()) {
      out.push(`  ${cat}: ${n}`);
    }
    out.push("");
  }
  process.stdout.write(out.join("\n") + "\n");
}

function emitJson(findings) {
  const { blocked, baselineAllowed, allowMarked } = summarize(findings);
  const obj = {
    version: 1,
    summary: {
      blocked: blocked.length,
      baseline_allowed: baselineAllowed.length,
      allow_marked: allowMarked.length,
    },
    findings: findings.map((f) => ({
      category: f.category,
      file_path_hash: f.file_path_hash,
      file_path_redacted: f.file_path_redacted,
      line_number: f.line_number,
      context_hash: f.context_hash,
      status: f.status,
      detail: f.detail,
      redacted_context: f.redacted_context,
    })),
  };
  process.stdout.write(JSON.stringify(obj, null, 2) + "\n");
}

// ----------------------- Main -----------------------------------------------

function main() {
  const patterns = loadPatterns();

  if (FLAG_UPDATE) {
    const findings = scan(patterns, { version: 1, entries: [] });
    const dedupe = new Map();
    for (const f of findings) {
      if (f.status === "ALLOW_MARKED") continue;
      const key = `${f.category} ${f.file_path_hash} ${f.line_number} ${f.context_hash}`;
      if (!dedupe.has(key)) {
        dedupe.set(key, {
          category: f.category,
          file_path_hash: f.file_path_hash,
          file_path_redacted: f.file_path_redacted,
          line_number: f.line_number,
          context_hash: f.context_hash,
        });
      }
    }
    const entries = [...dedupe.values()];
    writeBaseline(entries);
    process.stdout.write(`Baseline updated: ${entries.length} entries\n`);
    process.exit(0);
  }

  const baseline = loadBaseline();
  const findings = scan(patterns, baseline);
  if (FLAG_JSON) {
    emitJson(findings);
  } else {
    emitText(findings);
  }
  const blockedCount = findings.filter((f) => f.status === "BLOCKED").length;
  process.exit(blockedCount > 0 ? 1 : 0);
}

main();
