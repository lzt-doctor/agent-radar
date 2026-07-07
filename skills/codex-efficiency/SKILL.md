---
name: codex-efficiency
description: Improve Codex coding-task efficiency with a lean operating loop for repo exploration, scoped planning, parallel reads, edits, verification, user updates, and handoff. Use when the user asks Codex to work faster, be more efficient, reduce wasted context, coordinate agent work, handle implementation/debugging/review tasks with tighter feedback loops, or improve the way Codex collaborates in a codebase.
---

# Codex Efficiency

## Core Loop

Use this skill to make Codex execution tighter without making it brittle.

1. Restate the immediate objective in one sentence if the request is broad.
2. Inspect the repo shape before proposing implementation details.
3. Read only the files needed for the next decision; batch independent reads.
4. Make a short plan only when the task has multiple moving parts.
5. Edit in the smallest coherent units that can be verified.
6. Run the narrowest meaningful checks first, then broaden only if risk warrants it.
7. Summarize results with changed files, verification, and any remaining risk.

## Exploration

Prefer `rg` and `rg --files` for discovery. Batch independent reads with parallel tool calls when available. Start with:

- `git status --short` to avoid overwriting user work.
- `rg --files` or targeted path listing to map the project.
- The nearest tests, package/build config, and the code directly named by the user.
- Existing helpers, conventions, and local abstractions before inventing new ones.

Stop exploring once the next edit is clear. Save broad architecture tours for tasks that actually need them.

## Planning

Create a plan when the work touches multiple files, unknown tests, external services, migrations, or user-visible behavior. Keep the plan action-oriented and update it as work completes.

Skip formal planning for one-command answers, tiny edits, or direct explanations. In those cases, act and report the result.

## Editing

Follow the codebase's current style. Prefer local patterns over new abstractions. Avoid unrelated cleanup, formatting churn, and dependency changes unless they are necessary for the requested outcome.

Before editing, identify the smallest behavioral surface that solves the request. After editing, re-read the changed area or inspect the diff before testing.

## Verification

Choose checks by risk:

- Tiny text/config change: run a formatter or no test only if justified.
- Local function/module change: run the closest unit tests.
- Cross-module behavior: run the relevant suite plus at least one integration path when available.
- Frontend UI change: run tests/build and inspect the rendered result when practical.
- Git/agent coordination work: inspect branches, diffs, and overlap with tools such as AgentRadar when available.

If a check fails, determine whether it is caused by the change before changing more code. Report any check that could not be run.

## Communication

Keep working updates short: what is being inspected, what was learned, and what will happen next. Use longer explanations only when they unblock a decision.

Final responses should include:

- What changed.
- Where it changed.
- What was verified.
- What remains uncertain, if anything.

Avoid dumping raw logs unless the user asked for command output.

## Optional Playbooks

Read `references/playbooks.md` when the task is one of these:

- Debugging an unclear failure.
- Performing a code review.
- Building or changing frontend UI.
- Coordinating multiple agents or branches.
- Refactoring across several modules.
