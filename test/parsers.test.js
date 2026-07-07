import test from "node:test";
import assert from "node:assert/strict";
import { detectAgent } from "../src/agent-detector.js";
import { parseDiffRanges, parseNameStatus, parseNumstat } from "../src/git.js";

test("detectAgent recognizes common AI coding branch names", () => {
  assert.equal(detectAgent({ branch: "codex/fix-checkout" }).name, "codex");
  assert.equal(detectAgent({ branch: "claude/add-tests" }).name, "claude-code");
  assert.equal(detectAgent({ branch: "cursor/ui-polish" }).name, "cursor");
});

test("parseNameStatus handles modify, add, delete, and rename entries", () => {
  const files = parseNameStatus("M\tsrc/app.ts\nA\tdocs/guide.md\nD\told.js\nR100\tsrc/a.ts\tsrc/b.ts\n");

  assert.deepEqual(files, [
    { status: "M", code: "M", path: "src/app.ts" },
    { status: "A", code: "A", path: "docs/guide.md" },
    { status: "D", code: "D", path: "old.js" },
    { status: "R", code: "R100", previousPath: "src/a.ts", path: "src/b.ts" }
  ]);
});

test("parseNumstat totals text files and ignores binary markers", () => {
  assert.deepEqual(parseNumstat("10\t2\tsrc/app.ts\n-\t-\timage.png\n3\t1\tREADME.md\n"), {
    additions: 13,
    deletions: 3
  });
});

test("parseDiffRanges reads zero-context hunk ranges", () => {
  const ranges = parseDiffRanges("@@ -42,8 +42,12 @@\n-old\n+new\n@@ -100,0 +105,4 @@\n+extra\n");

  assert.deepEqual(ranges, [
    { start: 42, end: 49, baseLength: 8, newStart: 42, newLength: 12 },
    { start: 100, end: 100, baseLength: 0, newStart: 105, newLength: 4 }
  ]);
});
