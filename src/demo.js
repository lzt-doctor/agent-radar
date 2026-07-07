import { buildReport } from "./analysis.js";

export function createDemoReport() {
  return buildReport(
    {
      repository: {
        root: "/demo/shopflow",
        currentBranch: "main"
      },
      base: "main",
      candidates: [
        {
          id: "codex/refactor-auth-session",
          kind: "branch",
          agent: {
            name: "codex",
            confidence: "high",
            signals: [{ field: "branch", value: "codex/refactor-auth-session", match: "codex" }]
          },
          author: "codex",
          subject: "Refactor session handling",
          lastCommitAt: "2026-07-07 09:41:00 +0000",
          commitCount: 5,
          additions: 340,
          deletions: 118,
          changedFiles: [
            { status: "M", code: "M", path: "package.json" },
            { status: "M", code: "M", path: "src/auth/session.ts" },
            { status: "M", code: "M", path: "src/api/login.ts" }
          ],
          diffRangesByFile: {
            "package.json": [{ start: 24, end: 31, baseLength: 8, newStart: 24, newLength: 10 }],
            "src/auth/session.ts": [
              { start: 42, end: 68, baseLength: 27, newStart: 42, newLength: 39 },
              { start: 120, end: 137, baseLength: 18, newStart: 132, newLength: 22 }
            ],
            "src/api/login.ts": [{ start: 18, end: 34, baseLength: 17, newStart: 18, newLength: 21 }]
          }
        },
        {
          id: "claude/add-team-roles",
          kind: "branch",
          agent: {
            name: "claude-code",
            confidence: "high",
            signals: [{ field: "branch", value: "claude/add-team-roles", match: "claude-code" }]
          },
          author: "claude",
          subject: "Add team role guards",
          lastCommitAt: "2026-07-07 10:09:00 +0000",
          commitCount: 4,
          additions: 212,
          deletions: 44,
          changedFiles: [
            { status: "M", code: "M", path: "package.json" },
            { status: "M", code: "M", path: "src/auth/session.ts" },
            { status: "A", code: "A", path: "docs/roles.md" }
          ],
          diffRangesByFile: {
            "package.json": [{ start: 28, end: 32, baseLength: 5, newStart: 28, newLength: 7 }],
            "src/auth/session.ts": [
              { start: 55, end: 73, baseLength: 19, newStart: 55, newLength: 28 },
              { start: 190, end: 190, baseLength: 0, newStart: 205, newLength: 12 }
            ],
            "docs/roles.md": [{ start: 0, end: 0, baseLength: 0, newStart: 1, newLength: 44 }]
          }
        },
        {
          id: "cursor/dashboard-polish",
          kind: "branch",
          agent: {
            name: "cursor",
            confidence: "high",
            signals: [{ field: "branch", value: "cursor/dashboard-polish", match: "cursor" }]
          },
          author: "cursor",
          subject: "Polish dashboard empty states",
          lastCommitAt: "2026-07-07 08:52:00 +0000",
          commitCount: 2,
          additions: 96,
          deletions: 21,
          changedFiles: [
            { status: "M", code: "M", path: "src/ui/Dashboard.tsx" },
            { status: "M", code: "M", path: "src/ui/theme.css" }
          ],
          diffRangesByFile: {
            "src/ui/Dashboard.tsx": [{ start: 88, end: 116, baseLength: 29, newStart: 88, newLength: 36 }],
            "src/ui/theme.css": [{ start: 14, end: 31, baseLength: 18, newStart: 14, newLength: 25 }]
          }
        }
      ]
    },
    {
      mode: "demo",
      generatedAt: "2026-07-07T00:00:00.000Z"
    }
  );
}
