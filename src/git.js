import path from "node:path";
import { runGit } from "./process.js";
import { detectAgent, isAgentLike } from "./agent-detector.js";

export class GitScanError extends Error {
  constructor(message, details = {}) {
    super(message);
    this.name = "GitScanError";
    this.details = details;
  }
}

export function isGitRepository(cwd) {
  const result = runGit(["rev-parse", "--is-inside-work-tree"], { cwd });
  return result.ok && result.stdout.trim() === "true";
}

export function getRepositoryRoot(cwd) {
  const result = runGit(["rev-parse", "--show-toplevel"], { cwd });
  if (!result.ok) {
    throw new GitScanError("Unable to locate Git repository root.", result);
  }
  return result.stdout.trim();
}

export function getCurrentBranch(cwd) {
  const branch = runGit(["symbolic-ref", "--quiet", "--short", "HEAD"], { cwd });
  if (branch.ok && branch.stdout.trim()) {
    return branch.stdout.trim();
  }

  const revision = runGit(["rev-parse", "--short", "HEAD"], { cwd });
  return revision.ok ? revision.stdout.trim() : "detached";
}

export function branchExists(cwd, branch) {
  if (!branch) {
    return false;
  }
  return runGit(["rev-parse", "--verify", "--quiet", branch], { cwd }).ok;
}

export function chooseBaseBranch(cwd, preferredBase) {
  if (preferredBase) {
    if (!branchExists(cwd, preferredBase)) {
      throw new GitScanError(`Base ref "${preferredBase}" does not exist.`);
    }
    return preferredBase;
  }

  for (const candidate of ["main", "master", "develop"]) {
    if (branchExists(cwd, candidate)) {
      return candidate;
    }
  }

  return getCurrentBranch(cwd);
}

export function listLocalBranches(cwd) {
  const format = "%(refname:short)%09%(committerdate:iso8601)%09%(authorname)%09%(subject)";
  const result = runGit(["for-each-ref", "--sort=-committerdate", `--format=${format}`, "refs/heads"], { cwd });
  if (!result.ok) {
    throw new GitScanError("Unable to list local branches.", result);
  }

  return result.stdout
    .trim()
    .split("\n")
    .filter(Boolean)
    .map((line) => {
      const [name, lastCommitAt = "", author = "", subject = ""] = line.split("\t");
      return { name, lastCommitAt, author, subject };
    });
}

export function parseNameStatus(stdout) {
  return stdout
    .trim()
    .split("\n")
    .filter(Boolean)
    .map((line) => {
      const parts = line.split("\t");
      const code = parts[0];
      const status = code[0];

      if (status === "R" || status === "C") {
        return {
          status,
          code,
          previousPath: parts[1],
          path: parts[2]
        };
      }

      return {
        status,
        code,
        path: parts[1]
      };
    })
    .filter((entry) => Boolean(entry.path));
}

export function parseNumstat(stdout) {
  return stdout
    .trim()
    .split("\n")
    .filter(Boolean)
    .reduce(
      (totals, line) => {
        const [additions, deletions] = line.split("\t");
        totals.additions += additions === "-" ? 0 : Number(additions);
        totals.deletions += deletions === "-" ? 0 : Number(deletions);
        return totals;
      },
      { additions: 0, deletions: 0 }
    );
}

export function parseDiffRanges(stdout) {
  const ranges = [];
  const hunkRegex = /^@@ -(\d+)(?:,(\d+))? \+(\d+)(?:,(\d+))? @@/;

  for (const line of stdout.split("\n")) {
    const match = line.match(hunkRegex);
    if (!match) {
      continue;
    }

    const baseStart = Number(match[1]);
    const baseLength = match[2] === undefined ? 1 : Number(match[2]);
    const newStart = Number(match[3]);
    const newLength = match[4] === undefined ? 1 : Number(match[4]);
    const end = baseLength === 0 ? baseStart : baseStart + baseLength - 1;

    ranges.push({
      start: baseStart,
      end,
      baseLength,
      newStart,
      newLength
    });
  }

  return ranges;
}

function getChangedFiles(cwd, base, ref) {
  const result = runGit(["diff", "--name-status", "--find-renames", `${base}...${ref}`], { cwd });
  if (!result.ok) {
    throw new GitScanError(`Unable to diff ${base}...${ref}.`, result);
  }
  return parseNameStatus(result.stdout);
}

function getWorktreeFiles(cwd) {
  const unstaged = runGit(["diff", "--name-status", "--find-renames"], { cwd });
  const staged = runGit(["diff", "--cached", "--name-status", "--find-renames"], { cwd });
  const files = [...parseNameStatus(unstaged.stdout), ...parseNameStatus(staged.stdout)];
  return uniqueFiles(files);
}

function uniqueFiles(files) {
  const byPath = new Map();
  for (const file of files) {
    const previous = byPath.get(file.path);
    byPath.set(file.path, previous ? { ...previous, code: `${previous.code}+${file.code}` } : file);
  }
  return [...byPath.values()].sort((a, b) => a.path.localeCompare(b.path));
}

function getBranchStats(cwd, base, ref) {
  const stats = runGit(["diff", "--numstat", `${base}...${ref}`], { cwd });
  const commits = runGit(["rev-list", "--count", `${base}..${ref}`], { cwd });

  return {
    ...parseNumstat(stats.stdout),
    commitCount: commits.ok ? Number(commits.stdout.trim()) : 0
  };
}

function getWorktreeStats(cwd) {
  const unstaged = runGit(["diff", "--numstat"], { cwd });
  const staged = runGit(["diff", "--cached", "--numstat"], { cwd });
  const unstagedStats = parseNumstat(unstaged.stdout);
  const stagedStats = parseNumstat(staged.stdout);

  return {
    additions: unstagedStats.additions + stagedStats.additions,
    deletions: unstagedStats.deletions + stagedStats.deletions,
    commitCount: 0
  };
}

function getDiffRanges(cwd, base, ref, file) {
  const args =
    ref === "WORKTREE"
      ? ["diff", "--unified=0", "--no-color", "--no-ext-diff", "--", file]
      : ["diff", "--unified=0", "--no-color", "--no-ext-diff", `${base}...${ref}`, "--", file];
  const result = runGit(args, { cwd });
  return result.ok ? parseDiffRanges(result.stdout) : [];
}

function getDiffRangesByFile(cwd, base, ref, changedFiles, maxRangeFiles) {
  const ranges = {};
  for (const file of changedFiles.slice(0, maxRangeFiles)) {
    ranges[file.path] = getDiffRanges(cwd, base, ref, file.path);
  }
  return ranges;
}

function buildBranchCandidate(cwd, base, branch, options) {
  const changedFiles = getChangedFiles(cwd, base, branch.name);
  const stats = getBranchStats(cwd, base, branch.name);
  const agent = detectAgent({
    branch: branch.name,
    author: branch.author,
    subject: branch.subject
  });

  return {
    id: branch.name,
    kind: "branch",
    agent,
    author: branch.author,
    subject: branch.subject,
    lastCommitAt: branch.lastCommitAt,
    commitCount: stats.commitCount,
    additions: stats.additions,
    deletions: stats.deletions,
    changedFiles,
    diffRangesByFile: getDiffRangesByFile(cwd, base, branch.name, changedFiles, options.maxRangeFiles)
  };
}

function buildWorktreeCandidate(cwd, base, options) {
  const changedFiles = getWorktreeFiles(cwd);
  const stats = getWorktreeStats(cwd);

  return {
    id: "working-tree",
    kind: "worktree",
    agent: {
      name: "local-worktree",
      confidence: "high",
      signals: [{ field: "worktree", value: "uncommitted changes", match: "local-worktree" }]
    },
    author: "",
    subject: "Uncommitted local changes",
    lastCommitAt: "",
    commitCount: stats.commitCount,
    additions: stats.additions,
    deletions: stats.deletions,
    changedFiles,
    diffRangesByFile: getDiffRangesByFile(cwd, base, "WORKTREE", changedFiles, options.maxRangeFiles)
  };
}

export function scanRepository(options = {}) {
  const cwd = path.resolve(options.cwd ?? process.cwd());
  if (!isGitRepository(cwd)) {
    throw new GitScanError("AgentRadar needs to run inside a Git repository.");
  }

  const root = getRepositoryRoot(cwd);
  const currentBranch = getCurrentBranch(root);
  const base = chooseBaseBranch(root, options.base);
  const maxBranches = options.maxBranches ?? 24;
  const maxRangeFiles = options.maxRangeFiles ?? 200;
  const includeAllBranches = Boolean(options.includeAllBranches);
  const includeWorktree = options.includeWorktree !== false;

  const branches = listLocalBranches(root).filter((branch) => branch.name !== base);
  const branchCandidates = [];

  for (const branch of branches) {
    const agent = detectAgent({
      branch: branch.name,
      author: branch.author,
      subject: branch.subject
    });

    if (!includeAllBranches && !isAgentLike(agent)) {
      continue;
    }

    const candidate = buildBranchCandidate(root, base, branch, { maxRangeFiles });
    if (candidate.changedFiles.length > 0 || candidate.commitCount > 0) {
      branchCandidates.push(candidate);
    }

    if (branchCandidates.length >= maxBranches) {
      break;
    }
  }

  const candidates = [...branchCandidates];
  if (includeWorktree) {
    const worktree = buildWorktreeCandidate(root, base, { maxRangeFiles });
    if (worktree.changedFiles.length > 0) {
      candidates.unshift(worktree);
    }
  }

  return {
    repository: {
      root,
      currentBranch
    },
    base,
    candidates
  };
}
