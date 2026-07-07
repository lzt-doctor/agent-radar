# Contributing

Thanks for helping make AgentRadar useful.

## Development

```bash
npm test
node ./bin/agent-radar.js --demo
node ./bin/agent-radar.js --demo --json
node ./bin/agent-radar.js --demo --html
```

The project intentionally has no runtime dependencies. Prefer standard Node.js APIs unless a dependency clearly earns its weight.

## Pull requests

Good pull requests usually include:

- A clear before/after behavior note.
- A test for parser, scoring, or CLI behavior.
- A README update when user-facing behavior changes.

## Design principles

- Read Git state without mutating branches or the worktree.
- Explain risk instead of only emitting a score.
- Keep the default output useful in a terminal.
- Keep machine-readable JSON stable enough for CI.
