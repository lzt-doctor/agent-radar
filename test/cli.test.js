import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";

test("CLI prints demo JSON", () => {
  const result = spawnSync(process.execPath, ["./bin/agent-radar.js", "--demo", "--json"], {
    encoding: "utf8"
  });

  assert.equal(result.status, 0);
  const report = JSON.parse(result.stdout);
  assert.equal(report.mode, "demo");
  assert.equal(report.summary.highRiskPairs, 1);
});
