import fs from "node:fs";
import path from "node:path";
import { scanRepository, GitScanError } from "./git.js";
import { buildReport } from "./analysis.js";
import { createDemoReport } from "./demo.js";
import { formatReport } from "./format.js";
import { writeHtmlReport } from "./html.js";

export function runCli(argv, io) {
  try {
    const command = parseCommand(argv);

    if (command.help) {
      io.stdout.write(helpText());
      io.exit(0);
      return;
    }

    if (command.version) {
      io.stdout.write(`${readVersion()}\n`);
      io.exit(0);
      return;
    }

    const report = command.demo
      ? createDemoReport()
      : buildReport(
          scanRepository({
            cwd: command.cwd,
            base: command.base,
            includeAllBranches: command.allBranches,
            includeWorktree: command.worktree,
            maxBranches: command.maxBranches
          })
        );

    if (command.html) {
      const outputPath = writeHtmlReport(report, command.html);
      if (!command.json) {
        io.stdout.write(`HTML report written to ${outputPath}\n\n`);
      }
    }

    if (command.json) {
      io.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
      io.exit(0);
      return;
    }

    io.stdout.write(`${formatReport(report, { color: io.stdout.isTTY })}\n`);
    io.exit(hasBlockingRisk(report) && command.failOnHigh ? 2 : 0);
  } catch (error) {
    if (error instanceof GitScanError) {
      io.stderr.write(`AgentRadar: ${error.message}\n`);
      io.stderr.write("Run `agent-radar --demo` for a sample report, or run inside a Git repository.\n");
      io.exit(1);
      return;
    }

    io.stderr.write(`AgentRadar: ${error.message}\n`);
    io.stderr.write("Run `agent-radar --help` for usage.\n");
    io.exit(1);
  }
}

function parseCommand(argv) {
  const args = [...argv];
  const command = {
    cwd: process.cwd(),
    base: undefined,
    json: false,
    html: undefined,
    demo: false,
    help: false,
    version: false,
    allBranches: false,
    worktree: true,
    maxBranches: 24,
    failOnHigh: false
  };

  const first = args[0];
  if (first === "scan") {
    args.shift();
  } else if (first === "demo") {
    command.demo = true;
    args.shift();
  }

  while (args.length > 0) {
    const arg = args.shift();

    switch (arg) {
      case "-h":
      case "--help":
        command.help = true;
        break;
      case "-v":
      case "--version":
        command.version = true;
        break;
      case "--demo":
        command.demo = true;
        break;
      case "--json":
        command.json = true;
        break;
      case "--html": {
        const next = args[0];
        command.html = next && !next.startsWith("--") ? args.shift() : "agent-radar-report.html";
        break;
      }
      case "--base":
        command.base = args.shift();
        break;
      case "--all-branches":
        command.allBranches = true;
        break;
      case "--no-worktree":
        command.worktree = false;
        break;
      case "--max-branches":
        command.maxBranches = Number(args.shift());
        break;
      case "--fail-on-high":
        command.failOnHigh = true;
        break;
      default:
        if (arg?.startsWith("--base=")) {
          command.base = arg.slice("--base=".length);
        } else if (arg?.startsWith("--html=")) {
          command.html = arg.slice("--html=".length);
        } else if (arg?.startsWith("--max-branches=")) {
          command.maxBranches = Number(arg.slice("--max-branches=".length));
        } else if (!arg?.startsWith("-")) {
          command.cwd = path.resolve(arg);
        } else {
          throw new Error(`Unknown option: ${arg}`);
        }
    }
  }

  if (!Number.isFinite(command.maxBranches) || command.maxBranches < 1) {
    throw new Error("--max-branches must be a positive number.");
  }

  return command;
}

function hasBlockingRisk(report) {
  return report.summary.highRiskPairs > 0;
}

function readVersion() {
  const packagePath = new URL("../package.json", import.meta.url);
  return JSON.parse(fs.readFileSync(packagePath, "utf8")).version;
}

function helpText() {
  return `AgentRadar

Usage:
  agent-radar scan [repo] [options]
  agent-radar demo [options]

Options:
  --base <ref>          Base branch or ref to compare against. Defaults to main, master, develop, then current branch.
  --all-branches        Include non-agent-looking branches too.
  --no-worktree         Ignore uncommitted local changes.
  --max-branches <n>    Limit branch candidates. Default: 24.
  --json                Print the full machine-readable report.
  --html [file]         Write a static HTML dashboard. Default: agent-radar-report.html.
  --fail-on-high        Exit with code 2 if high-risk overlap is found.
  --demo                Run with built-in demo data.
  -v, --version         Print version.
  -h, --help            Show help.

Examples:
  agent-radar --demo
  agent-radar scan --base main --html
  agent-radar scan ../my-repo --all-branches --json
`;
}
