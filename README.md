# AgentRadar

AgentRadar is a zero-dependency CLI that spots AI-agent branch overlap, merge risk, and PR readiness before agents collide.

It is built for teams using Codex, Claude Code, Cursor, Copilot, Devin, Aider, OpenHands, or any workflow where multiple agents can create branches in the same repository.

```bash
npx agent-radar scan --base main --html
```

```text
AgentRadar
repo: /demo/shopflow
base: main
candidates: 3 | changed files: 6 | risks: 1 high, 0 medium, 0 low

Risk Radar
HIGH  90  codex/refactor-auth-session x claude/add-team-roles
    shared: package.json, src/auth/session.ts
    - overlapping hunks in 2 file(s)
    - shared dependency file(s): package.json
    next: Review the overlapping hunks manually before either branch opens a PR.
```

## Why this exists

AI coding agents are getting good at shipping isolated changes. The next problem is coordination: two agents can quietly edit the same auth module, dependency file, route, or generated code before anyone opens a pull request.

AgentRadar gives maintainers a fast pre-PR view:

- Which agent-looking branches are active.
- Which files overlap across branches and the local worktree.
- Whether the overlap is likely harmless, medium-risk, or high-risk.
- What to do next before the merge queue gets noisy.

## Features

- Zero runtime dependencies.
- Scans local Git branches without checking anything out.
- Detects common agent signals in branch names, commit authors, and commit subjects.
- Compares each candidate against a base ref such as `main`.
- Flags shared source files, dependency files, add/add risk, delete/modify risk, and overlapping diff hunks.
- Includes the local worktree as a candidate by default.
- Outputs terminal, JSON, or a static HTML dashboard.
- Supports CI gating with `--fail-on-high`.

## Install

```bash
npm install -g agent-radar
```

For local development:

```bash
git clone https://github.com/lzt-doctor/agent-radar.git
cd agent-radar
npm test
node ./bin/agent-radar.js --demo
```

## Usage

```bash
agent-radar scan
agent-radar scan --base main
agent-radar scan --base origin/main --all-branches
agent-radar scan --json
agent-radar scan --html report.html
agent-radar scan --fail-on-high
```

Run the built-in demo:

```bash
agent-radar --demo
agent-radar --demo --html
```

## How branch detection works

AgentRadar looks for signals such as:

- `codex`
- `claude`
- `cursor`
- `copilot`
- `devin`
- `openhands`
- `aider`
- `sweep`
- `agent`
- `bot`

If your team uses different branch names, run:

```bash
agent-radar scan --all-branches
```

## Risk scoring

AgentRadar is intentionally conservative. It does not need to perform a merge to be useful.

High-risk signals include:

- Two candidates edit the same base hunk.
- Two candidates add the same file.
- One candidate deletes a file while another edits it.
- Multiple candidates touch dependency manifests or lockfiles.

Medium-risk signals include:

- Shared source files without hunk overlap.
- Multiple changed files in the same implementation area.

Low-risk signals include:

- Shared files with no overlapping base hunks and no structural risk.

## CI example

```yaml
name: AgentRadar

on:
  pull_request:
  push:
    branches: [main]

jobs:
  radar:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npx agent-radar scan --base origin/main --all-branches --fail-on-high
```

## Roadmap

- Remote branch scanning.
- GitHub PR comments.
- MCP server mode for coding agents.
- Config file for custom agent naming conventions.
- Ownership hints from CODEOWNERS.
- SARIF output for security-style review surfaces.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).

## License

MIT
