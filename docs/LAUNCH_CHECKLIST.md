# Launch Checklist

Use this when publishing AgentRadar publicly.

## Repository

- Add a short terminal GIF or screenshot to the README.
- Create the first release tag: `v0.1.0`.
- Enable GitHub Discussions.
- Add topics: `ai-agents`, `agentic-coding`, `codex`, `claude-code`, `cursor`, `developer-tools`, `git`, `merge-conflicts`, `mcp`.

## Package

- Confirm the npm package name is available.
- Run `npm test`.
- Run `npm pack --dry-run`.
- Publish with `npm publish --access public`.

## Launch copy

Short version:

> I built AgentRadar: a zero-dependency CLI that spots AI-agent branch overlap before Codex, Claude Code, Cursor, and Copilot collide in your repo.

Long version:

> AI coding agents are great at isolated tasks, but multiple agents can quietly edit the same files before anyone opens a PR. AgentRadar scans local branches and the worktree, detects agent-looking refs, flags overlapping hunks, dependency-file overlap, add/add risk, and delete/modify risk, then prints a terminal, JSON, or HTML report.

## Places to share

- Hacker News Show HN.
- Reddit r/programming.
- X / LinkedIn with a short demo clip.
- V2EX.
- Product Hunt after the README has a GIF.
- Relevant AI coding-agent Discord or Slack communities.
