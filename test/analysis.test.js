import test from "node:test";
import assert from "node:assert/strict";
import { createDemoReport } from "../src/demo.js";

test("demo report surfaces the intended high-risk auth overlap", () => {
  const report = createDemoReport();
  const topRisk = report.risks[0];

  assert.equal(report.summary.candidateCount, 3);
  assert.equal(topRisk.level, "high");
  assert.deepEqual(topRisk.pair, ["codex/refactor-auth-session", "claude/add-team-roles"]);
  assert.ok(topRisk.sharedFiles.includes("src/auth/session.ts"));
  assert.ok(topRisk.dependencyFiles.includes("package.json"));
  assert.ok(topRisk.overlappingHunks.length > 0);
});
