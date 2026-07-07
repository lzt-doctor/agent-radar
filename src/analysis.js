import path from "node:path";

const DEPENDENCY_FILES = new Set([
  "package.json",
  "package-lock.json",
  "pnpm-lock.yaml",
  "yarn.lock",
  "bun.lockb",
  "Cargo.toml",
  "Cargo.lock",
  "go.mod",
  "go.sum",
  "requirements.txt",
  "pyproject.toml",
  "poetry.lock",
  "Gemfile",
  "Gemfile.lock",
  "composer.json",
  "composer.lock"
]);

const SOURCE_EXTENSIONS = new Set([
  ".js",
  ".jsx",
  ".ts",
  ".tsx",
  ".mjs",
  ".cjs",
  ".py",
  ".go",
  ".rs",
  ".java",
  ".kt",
  ".swift",
  ".rb",
  ".php",
  ".cs",
  ".c",
  ".cc",
  ".cpp",
  ".h",
  ".hpp",
  ".vue",
  ".svelte"
]);

export function analyzeConflictRisks(candidates) {
  const risks = [];

  for (let left = 0; left < candidates.length; left += 1) {
    for (let right = left + 1; right < candidates.length; right += 1) {
      const risk = analyzePair(candidates[left], candidates[right]);
      if (risk.sharedFiles.length > 0) {
        risks.push(risk);
      }
    }
  }

  return risks.sort((a, b) => b.score - a.score || a.pair[0].localeCompare(b.pair[0]));
}

export function summarizeReport(report) {
  const risks = report.risks ?? [];
  const candidates = report.candidates ?? [];
  const uniqueFiles = new Set(candidates.flatMap((candidate) => candidate.changedFiles.map((file) => file.path)));

  return {
    candidateCount: candidates.length,
    changedFileCount: uniqueFiles.size,
    highRiskPairs: risks.filter((risk) => risk.level === "high").length,
    mediumRiskPairs: risks.filter((risk) => risk.level === "medium").length,
    lowRiskPairs: risks.filter((risk) => risk.level === "low").length
  };
}

export function buildReport(scan, options = {}) {
  const risks = analyzeConflictRisks(scan.candidates);
  const report = {
    schemaVersion: "0.1",
    generatedAt: options.generatedAt ?? new Date().toISOString(),
    mode: options.mode ?? "git",
    repository: scan.repository,
    base: scan.base,
    candidates: scan.candidates,
    risks
  };

  report.summary = summarizeReport(report);
  return report;
}

function analyzePair(a, b) {
  const aFiles = new Map(a.changedFiles.map((file) => [file.path, file]));
  const bFiles = new Map(b.changedFiles.map((file) => [file.path, file]));
  const sharedFiles = [...aFiles.keys()].filter((file) => bFiles.has(file)).sort();
  const dependencyFiles = sharedFiles.filter(isDependencyFile);
  const sourceFiles = sharedFiles.filter(isSourceFile);
  const structuralConflicts = [];
  const overlappingHunks = [];

  for (const file of sharedFiles) {
    const left = aFiles.get(file);
    const right = bFiles.get(file);

    if (isStructuralConflict(left.status, right.status)) {
      structuralConflicts.push({
        file,
        leftStatus: left.code,
        rightStatus: right.code
      });
    }

    const overlaps = findRangeOverlaps(a.diffRangesByFile[file] ?? [], b.diffRangesByFile[file] ?? []);
    if (overlaps.length > 0) {
      overlappingHunks.push({
        file,
        overlaps
      });
    }
  }

  const sharedDirectories = countSharedDirectories(a.changedFiles, b.changedFiles);
  const reasons = buildReasons({
    sharedFiles,
    dependencyFiles,
    sourceFiles,
    structuralConflicts,
    overlappingHunks,
    sharedDirectories
  });
  const score = scorePair({
    a,
    b,
    sharedFiles,
    dependencyFiles,
    sourceFiles,
    structuralConflicts,
    overlappingHunks,
    sharedDirectories
  });

  return {
    pair: [a.id, b.id],
    agents: [a.agent.name, b.agent.name],
    score,
    level: riskLevel(score, overlappingHunks.length, structuralConflicts.length),
    sharedFiles,
    dependencyFiles,
    sourceFiles,
    structuralConflicts,
    overlappingHunks,
    reasons,
    recommendation: recommendationFor(score, overlappingHunks, structuralConflicts)
  };
}

function findRangeOverlaps(leftRanges, rightRanges) {
  const overlaps = [];

  for (const left of leftRanges) {
    for (const right of rightRanges) {
      if (rangesOverlap(left, right)) {
        overlaps.push({
          left,
          right
        });
      }
    }
  }

  return overlaps;
}

function rangesOverlap(left, right) {
  if (left.baseLength === 0 && right.baseLength === 0) {
    return left.start === right.start;
  }
  return left.start <= right.end && right.start <= left.end;
}

function isStructuralConflict(leftStatus, rightStatus) {
  if (leftStatus === "A" && rightStatus === "A") {
    return true;
  }
  if (leftStatus === "D" && rightStatus !== "D") {
    return true;
  }
  if (rightStatus === "D" && leftStatus !== "D") {
    return true;
  }
  return false;
}

function isDependencyFile(file) {
  return DEPENDENCY_FILES.has(path.basename(file));
}

function isSourceFile(file) {
  return SOURCE_EXTENSIONS.has(path.extname(file));
}

function countSharedDirectories(leftFiles, rightFiles) {
  const leftDirectories = new Set(leftFiles.map((file) => directoryName(file.path)));
  const rightDirectories = new Set(rightFiles.map((file) => directoryName(file.path)));
  return [...leftDirectories].filter((directory) => rightDirectories.has(directory)).length;
}

function directoryName(file) {
  const directory = path.dirname(file);
  return directory === "." ? "/" : directory;
}

function buildReasons(input) {
  const reasons = [];

  if (input.overlappingHunks.length > 0) {
    reasons.push(`overlapping hunks in ${input.overlappingHunks.length} file(s)`);
  }
  if (input.structuralConflicts.length > 0) {
    reasons.push(`structural add/delete risk in ${input.structuralConflicts.length} file(s)`);
  }
  if (input.dependencyFiles.length > 0) {
    reasons.push(`shared dependency file(s): ${input.dependencyFiles.join(", ")}`);
  }
  if (input.sourceFiles.length > 0) {
    reasons.push(`shared source file(s): ${input.sourceFiles.slice(0, 3).join(", ")}`);
  }
  if (input.sharedDirectories >= 3) {
    reasons.push(`${input.sharedDirectories} shared directories`);
  }
  if (reasons.length === 0 && input.sharedFiles.length > 0) {
    reasons.push(`${input.sharedFiles.length} shared file(s) changed`);
  }

  return reasons;
}

function scorePair(input) {
  let score = 0;
  score += Math.min(25, input.sharedFiles.length * 5);
  score += Math.min(45, input.overlappingHunks.length * 30);
  score += Math.min(35, input.structuralConflicts.length * 25);
  score += input.dependencyFiles.length > 0 ? 20 : 0;
  score += input.sourceFiles.length > 0 ? 15 : 0;
  score += input.sharedDirectories >= 3 ? 10 : 0;
  score += input.a.commitCount + input.b.commitCount >= 10 ? 5 : 0;
  return Math.min(100, score);
}

function riskLevel(score, overlappingHunkCount, structuralConflictCount) {
  if (score >= 70 || overlappingHunkCount > 0 || structuralConflictCount > 0) {
    return "high";
  }
  if (score >= 35) {
    return "medium";
  }
  return "low";
}

function recommendationFor(score, overlappingHunks, structuralConflicts) {
  if (structuralConflicts.length > 0) {
    return "Coordinate ownership before merging; this looks like add/add or delete/modify territory.";
  }
  if (overlappingHunks.length > 0) {
    return "Review the overlapping hunks manually before either branch opens a PR.";
  }
  if (score >= 35) {
    return "Merge one branch first, rebase the other, then rerun AgentRadar.";
  }
  return "Low overlap. Normal review should be enough.";
}
