# Efficiency Playbooks

Use these playbooks only when the task matches the situation. Keep the main workflow lean.

## Debugging

1. Capture the exact failing command, test, stack trace, or user-visible symptom.
2. Reproduce with the smallest command available.
3. Trace from the failure boundary inward: caller, callee, data shape, environment.
4. Change one likely cause at a time.
5. Re-run the original failure command before broad cleanup.

Prefer evidence over speculation. If reproduction is blocked by missing credentials, network, or local services, inspect code paths and state the blocker precisely.

## Code Review

Lead with findings, ordered by severity. Cite file and line. Focus on:

- Behavioral regressions.
- Missing edge cases.
- Security, data loss, or privacy risks.
- Test gaps for changed behavior.
- Mismatches between stated intent and implementation.

Keep summaries brief and secondary. If no issues are found, say so and mention residual risk.

## Frontend Change

1. Identify the existing design system, component library, and routing/data conventions.
2. Implement the real user workflow first, not a marketing shell.
3. Use stable dimensions for toolbars, boards, grids, canvases, cards, and controls.
4. Check mobile and desktop layouts for overflow, overlap, and clipped text.
5. Run the build/tests and visually inspect the changed screen when a local preview is practical.

Use icons for common actions, native controls for common settings, and concise visible text.

## Multi-Agent Or Branch Coordination

1. Inspect `git status --short` and current branch.
2. List active branches or PR refs if available.
3. Compare changed files and dependency manifests before editing shared areas.
4. Use AgentRadar when present:
   - Local package repo: `node ./bin/agent-radar.js scan --base main --all-branches`
   - Installed package: `agent-radar scan --base main --all-branches`
5. If overlap is high-risk, isolate the edit, communicate the collision, and avoid broad refactors.

## Refactor

1. Name the behavior that must remain unchanged.
2. Add or locate a safety test before moving code when risk is meaningful.
3. Move structure first, change behavior second.
4. Keep compatibility shims only when callers need a staged migration.
5. Remove dead code only when references are proven gone.

Prefer several verified small steps over one sweeping patch.
