// scripts/__tests__/check-forbidden-references.test.mjs
//
// Tests for the Forbidden Reference Quality Gate V1 scanner.
//
// Restricted vocabulary is never present as plaintext in this file.
// Test fixtures use base64-encoded patterns that are decoded at runtime.
// Test names use only neutral category names and abstract scenario labels.

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  mkdtempSync,
  mkdirSync,
  writeFileSync,
  readFileSync,
  rmSync,
  existsSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join, sep, resolve } from "node:path";
import { execFileSync, spawnSync } from "node:child_process";
import { createHash } from "node:crypto";

/** Mirror the scanner's pathHash() for seeding baselines in tests. */
function pathHashOf(relPath) {
  return createHash("sha256").update(Buffer.from(relPath, "utf8")).digest("hex");
}

// Resolve scanner path relative to the test runner's cwd (vitest sets it
// to the repo root). Avoids the .mjs transform's non-file URL scheme issue.
const SCANNER = resolve(process.cwd(), "scripts", "check-forbidden-references.mjs");

// ----- Encoded test fixtures -----------------------------------------------

// A neutral, low-collision test pattern that does not exist in the
// production data file. Encoded so this test source contains no
// plaintext restricted vocabulary.
//   Decoded: "xyzzy_test_pattern_alpha"
const TEST_PATTERN_BASE64 = "eHl6enlfdGVzdF9wYXR0ZXJuX2FscGhh";

// Decode helper. Used by tests to build fixture files; never echoes
// the decoded value into test names or assertion messages.
function decode(b64) {
  return Buffer.from(b64, "base64").toString("utf8");
}

const TEST_PATTERN = decode(TEST_PATTERN_BASE64);
const TEST_CATEGORY = "project_forbidden_term";

// ----- Temp workspace helpers ----------------------------------------------

let tmpRoot;

function setupWorkspace() {
  tmpRoot = mkdtempSync(join(tmpdir(), "frqg-v1-test-"));
  // Create the scoped paths the scanner expects to walk
  mkdirSync(join(tmpRoot, "docs"), { recursive: true });
  mkdirSync(join(tmpRoot, "src"), { recursive: true });
  mkdirSync(join(tmpRoot, "supabase"), { recursive: true });
  mkdirSync(join(tmpRoot, "scripts"), { recursive: true });
  mkdirSync(join(tmpRoot, "public"), { recursive: true });
  mkdirSync(join(tmpRoot, ".github", "workflows"), { recursive: true });
}

function cleanupWorkspace() {
  if (tmpRoot && existsSync(tmpRoot)) {
    rmSync(tmpRoot, { recursive: true, force: true });
  }
  tmpRoot = undefined;
}

function writeFixture(relPath, content) {
  const full = join(tmpRoot, relPath);
  const dir = full.split(sep).slice(0, -1).join(sep);
  mkdirSync(dir, { recursive: true });
  writeFileSync(full, content, "utf8");
}

function writeTestDataFile(decodedPatternByCategory) {
  // Write a data.json into the temp root's scripts/ that mirrors the
  // production data file shape. Encoded patterns only.
  const data = { version: 1, categories: {} };
  for (const [cat, plaintexts] of Object.entries(decodedPatternByCategory)) {
    data.categories[cat] = plaintexts.map((p) =>
      Buffer.from(p, "utf8").toString("base64")
    );
  }
  writeFileSync(
    join(tmpRoot, "scripts", "forbidden-references.data.json"),
    JSON.stringify(data, null, 2) + "\n",
    "utf8"
  );
}

function writeTestBaseline(entries) {
  const data = {
    version: 1,
    entries: entries.map((e) => ({
      category: e.category,
      file_path_hash: e.file_path_hash,
      file_path_redacted: e.file_path_redacted,
      line_number: e.line_number,
      context_hash: e.context_hash,
    })),
  };
  writeFileSync(
    join(tmpRoot, "scripts", "forbidden-references.baseline.json"),
    JSON.stringify(data, null, 2) + "\n",
    "utf8"
  );
}

function runScanner(extraArgs = []) {
  const args = [SCANNER, "--root", tmpRoot, ...extraArgs];
  const res = spawnSync(process.execPath, args, {
    encoding: "utf8",
    env: { ...process.env, NO_COLOR: "1" },
  });
  return {
    status: res.status,
    stdout: res.stdout ?? "",
    stderr: res.stderr ?? "",
  };
}

// ---------------------------------------------------------------------------

describe("Forbidden Reference Quality Gate V1 — scanner", () => {
  beforeEach(() => {
    setupWorkspace();
  });
  afterEach(() => {
    cleanupWorkspace();
  });

  it("detects an encoded test pattern in a fixture file (positive case)", () => {
    writeTestDataFile({ [TEST_CATEGORY]: [TEST_PATTERN] });
    writeFixture("docs/sample.md", `Some prose ${TEST_PATTERN} drin.\n`);
    const r = runScanner(["--json"]);
    expect(r.status).toBe(1);
    const obj = JSON.parse(r.stdout);
    expect(obj.summary.blocked).toBe(1);
    expect(obj.findings[0].category).toBe(TEST_CATEGORY);
    expect(obj.findings[0].status).toBe("BLOCKED");
    expect(obj.findings[0].detail).toBe("new finding");
  });

  it("does not flag a clean fixture file (negative case)", () => {
    writeTestDataFile({ [TEST_CATEGORY]: [TEST_PATTERN] });
    writeFixture("docs/clean.md", "Nur sauberer Inhalt.\n");
    const r = runScanner(["--json"]);
    expect(r.status).toBe(0);
    const obj = JSON.parse(r.stdout);
    expect(obj.summary.blocked).toBe(0);
  });

  it("inline allow-marker on the same line suppresses to ALLOW_MARKED", () => {
    writeTestDataFile({ [TEST_CATEGORY]: [TEST_PATTERN] });
    writeFixture(
      "docs/marker-same.md",
      `Inhalt ${TEST_PATTERN} <!-- forbidden-ref-allow: ${TEST_CATEGORY} reason="test reason" -->\n`
    );
    const r = runScanner(["--json"]);
    expect(r.status).toBe(0);
    const obj = JSON.parse(r.stdout);
    expect(obj.summary.allow_marked).toBe(1);
    expect(obj.summary.blocked).toBe(0);
  });

  it("inline allow-marker on the immediately preceding line suppresses to ALLOW_MARKED", () => {
    writeTestDataFile({ [TEST_CATEGORY]: [TEST_PATTERN] });
    writeFixture(
      "docs/marker-prev.md",
      `<!-- forbidden-ref-allow: ${TEST_CATEGORY} reason="prev line reason" -->\nInhalt ${TEST_PATTERN}\n`
    );
    const r = runScanner(["--json"]);
    expect(r.status).toBe(0);
    const obj = JSON.parse(r.stdout);
    expect(obj.summary.allow_marked).toBe(1);
  });

  it("inline allow-marker two lines before is not honored", () => {
    writeTestDataFile({ [TEST_CATEGORY]: [TEST_PATTERN] });
    writeFixture(
      "docs/marker-far.md",
      `<!-- forbidden-ref-allow: ${TEST_CATEGORY} reason="too far" -->\nFiller line\nInhalt ${TEST_PATTERN}\n`
    );
    const r = runScanner(["--json"]);
    expect(r.status).toBe(1);
    const obj = JSON.parse(r.stdout);
    expect(obj.summary.blocked).toBe(1);
    expect(obj.summary.allow_marked).toBe(0);
  });

  it("inline allow-marker with mismatched category is not honored", () => {
    writeTestDataFile({ [TEST_CATEGORY]: [TEST_PATTERN] });
    writeFixture(
      "docs/marker-mismatch.md",
      `Inhalt ${TEST_PATTERN} <!-- forbidden-ref-allow: superseded_reference reason="wrong category" -->\n`
    );
    const r = runScanner(["--json"]);
    expect(r.status).toBe(1);
    const obj = JSON.parse(r.stdout);
    expect(obj.summary.blocked).toBe(1);
  });

  it("baseline entry suppresses to BASELINE_ALLOWED", () => {
    writeTestDataFile({ [TEST_CATEGORY]: [TEST_PATTERN] });
    writeFixture("docs/sample.md", `Some prose ${TEST_PATTERN} drin.\n`);
    // First, capture the expected context_hash by running scan once
    // and reading the JSON
    const r1 = runScanner(["--json"]);
    expect(r1.status).toBe(1);
    const f = JSON.parse(r1.stdout).findings[0];
    writeTestBaseline([
      {
        category: TEST_CATEGORY,
        file_path_hash: pathHashOf("docs/sample.md"),
        file_path_redacted: "docs/sample.md",
        line_number: f.line_number,
        context_hash: f.context_hash,
      },
    ]);
    const r2 = runScanner(["--json"]);
    expect(r2.status).toBe(0);
    const obj = JSON.parse(r2.stdout);
    expect(obj.summary.baseline_allowed).toBe(1);
    expect(obj.summary.blocked).toBe(0);
  });

  it("context-hash mismatch re-blocks a baseline entry", () => {
    writeTestDataFile({ [TEST_CATEGORY]: [TEST_PATTERN] });
    writeFixture("docs/sample.md", `Some prose ${TEST_PATTERN} drin.\n`);
    writeTestBaseline([
      {
        category: TEST_CATEGORY,
        file_path_hash: pathHashOf("docs/sample.md"),
        file_path_redacted: "docs/sample.md",
        line_number: 1,
        context_hash: "0".repeat(64),
      },
    ]);
    const r = runScanner(["--json"]);
    expect(r.status).toBe(1);
    const obj = JSON.parse(r.stdout);
    expect(obj.summary.blocked).toBe(1);
    expect(obj.findings[0].detail).toBe("context changed");
  });

  it("line-move re-blocks a baseline entry", () => {
    writeTestDataFile({ [TEST_CATEGORY]: [TEST_PATTERN] });
    writeFixture(
      "docs/moved.md",
      `Filler 1\nFiller 2\nFiller 3\nFiller 4\nFiller 5\n${TEST_PATTERN}\n`
    );
    // First scan to get the actual context_hash at line 6
    const r1 = runScanner(["--json"]);
    expect(r1.status).toBe(1);
    const f = JSON.parse(r1.stdout).findings[0];
    // Seed baseline at line 1 with the same context_hash
    writeTestBaseline([
      {
        category: TEST_CATEGORY,
        file_path_hash: pathHashOf("docs/moved.md"),
        file_path_redacted: "docs/moved.md",
        line_number: 1,
        context_hash: f.context_hash,
      },
    ]);
    const r2 = runScanner(["--json"]);
    expect(r2.status).toBe(1);
    const obj = JSON.parse(r2.stdout);
    expect(obj.findings[0].detail).toBe("line moved");
  });

  it("excluded directory (node_modules) is not scanned", () => {
    writeTestDataFile({ [TEST_CATEGORY]: [TEST_PATTERN] });
    mkdirSync(join(tmpRoot, "src", "node_modules"), { recursive: true });
    writeFixture("src/node_modules/pkg/index.js", `${TEST_PATTERN}\n`);
    const r = runScanner(["--json"]);
    expect(r.status).toBe(0);
    expect(JSON.parse(r.stdout).summary.blocked).toBe(0);
  });

  it("CRLF and LF produce identical context_hash and identical baseline", () => {
    writeTestDataFile({ [TEST_CATEGORY]: [TEST_PATTERN] });
    writeFixture("docs/lf.md", `prefix\n${TEST_PATTERN}\nsuffix\n`);
    const r1 = runScanner(["--json"]);
    const hash1 = JSON.parse(r1.stdout).findings[0].context_hash;

    cleanupWorkspace();
    setupWorkspace();
    writeTestDataFile({ [TEST_CATEGORY]: [TEST_PATTERN] });
    writeFixture("docs/lf.md", `prefix\r\n${TEST_PATTERN}\r\nsuffix\r\n`);
    const r2 = runScanner(["--json"]);
    const hash2 = JSON.parse(r2.stdout).findings[0].context_hash;

    expect(hash1).toBe(hash2);
  });

  it("non-ASCII (Umlaut) characters in surrounding context produce deterministic context_hash across runs", () => {
    writeTestDataFile({ [TEST_CATEGORY]: [TEST_PATTERN] });
    writeFixture(
      "docs/umlaut.md",
      `prefix mit Ä Ö Ü ß\n${TEST_PATTERN}\nsuffix mit ä ö ü\n`
    );
    const r1 = runScanner(["--json"]);
    const r2 = runScanner(["--json"]);
    const hash1 = JSON.parse(r1.stdout).findings[0].context_hash;
    const hash2 = JSON.parse(r2.stdout).findings[0].context_hash;
    expect(hash1).toBe(hash2);
  });

  it("JSON output mode produces parseable JSON with the documented schema", () => {
    writeTestDataFile({ [TEST_CATEGORY]: [TEST_PATTERN] });
    writeFixture("docs/sample.md", `${TEST_PATTERN}\n`);
    const r = runScanner(["--json"]);
    expect(r.status).toBe(1);
    const obj = JSON.parse(r.stdout);
    expect(obj.version).toBe(1);
    expect(obj).toHaveProperty("summary");
    expect(obj.summary).toHaveProperty("blocked");
    expect(obj.summary).toHaveProperty("baseline_allowed");
    expect(obj.summary).toHaveProperty("allow_marked");
    expect(obj).toHaveProperty("findings");
    const f = obj.findings[0];
    for (const k of [
      "category",
      "file_path_hash",
      "file_path_redacted",
      "line_number",
      "context_hash",
      "status",
      "detail",
      "redacted_context",
    ]) {
      expect(f).toHaveProperty(k);
    }
    expect(f).not.toHaveProperty("file_path");
  });

  it("--update-baseline writes a deterministic baseline (byte-identical across runs)", () => {
    writeTestDataFile({ [TEST_CATEGORY]: [TEST_PATTERN] });
    writeFixture("docs/a.md", `${TEST_PATTERN} a\n`);
    writeFixture("docs/b.md", `${TEST_PATTERN} b\n`);
    runScanner(["--update-baseline"]);
    const snap1 = readFileSync(
      join(tmpRoot, "scripts", "forbidden-references.baseline.json")
    );
    runScanner(["--update-baseline"]);
    const snap2 = readFileSync(
      join(tmpRoot, "scripts", "forbidden-references.baseline.json")
    );
    expect(snap1.equals(snap2)).toBe(true);
  });

  it("scanner stdout never contains decoded restricted vocabulary or disallowed-script characters", () => {
    writeTestDataFile({ [TEST_CATEGORY]: [TEST_PATTERN] });
    writeFixture(
      "docs/leak.md",
      `Match ${TEST_PATTERN} surrounded by extra ${TEST_PATTERN} tokens\n`
    );
    const r = runScanner();
    expect(r.status).toBe(1);
    // Decoded test pattern must NOT appear in stdout
    expect(r.stdout).not.toContain(TEST_PATTERN);
    // Disallowed Unicode block (Arabic) must NOT appear in stdout
    const disallowedScriptRe = new RegExp("[\\u0600-\\u06FF]", "");
    expect(disallowedScriptRe.test(r.stdout)).toBe(false);
  });

  it("scanner refuses malformed pattern data file with non-zero exit and clear error", () => {
    writeFileSync(
      join(tmpRoot, "scripts", "forbidden-references.data.json"),
      "{not valid json",
      "utf8"
    );
    const r = runScanner();
    expect(r.status).toBe(2);
    expect(r.stderr).toMatch(/scanner-error/);
  });

  it("scanner refuses malformed baseline file with non-zero exit and clear error", () => {
    writeTestDataFile({ [TEST_CATEGORY]: [TEST_PATTERN] });
    writeFileSync(
      join(tmpRoot, "scripts", "forbidden-references.baseline.json"),
      JSON.stringify({ version: 999 }) + "\n",
      "utf8"
    );
    const r = runScanner();
    expect(r.status).toBe(2);
    expect(r.stderr).toMatch(/scanner-error/);
  });
});
