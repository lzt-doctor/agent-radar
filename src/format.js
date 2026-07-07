const LEVEL_LABELS = {
  high: "HIGH",
  medium: "MED",
  low: "LOW"
};

export function formatReport(report, options = {}) {
  const color = Boolean(options.color);
  const lines = [];
  const summary = report.summary;

  lines.push(style("AgentRadar", "bold", color));
  lines.push(`repo: ${report.repository.root}`);
  lines.push(`base: ${report.base}`);
  lines.push(
    `candidates: ${summary.candidateCount} | changed files: ${summary.changedFileCount} | risks: ${summary.highRiskPairs} high, ${summary.mediumRiskPairs} medium, ${summary.lowRiskPairs} low`
  );
  lines.push("");

  if (report.candidates.length === 0) {
    lines.push("No agent-like branches or worktree changes found.");
    lines.push("Tip: rerun with --all-branches if your branch names do not include agent signals.");
    return lines.join("\n");
  }

  lines.push(style("Candidates", "bold", color));
  lines.push(formatCandidates(report.candidates));
  lines.push("");

  lines.push(style("Risk Radar", "bold", color));
  if (report.risks.length === 0) {
    lines.push("No overlapping changed files found. Nice and quiet.");
  } else {
    for (const risk of report.risks.slice(0, options.maxRisks ?? 10)) {
      lines.push(formatRisk(risk, color));
    }
  }

  if (report.risks.length > (options.maxRisks ?? 10)) {
    lines.push(`... ${report.risks.length - (options.maxRisks ?? 10)} more risk pair(s) hidden.`);
  }

  return lines.join("\n");
}

function formatCandidates(candidates) {
  const rows = candidates.map((candidate) => [
    candidate.id,
    candidate.agent.name,
    String(candidate.commitCount),
    String(candidate.changedFiles.length),
    `+${candidate.additions}/-${candidate.deletions}`
  ]);

  return table(["ref", "agent", "commits", "files", "delta"], rows);
}

function formatRisk(risk, color) {
  const label = style(LEVEL_LABELS[risk.level], risk.level, color);
  const files = risk.sharedFiles.slice(0, 4).join(", ");
  const more = risk.sharedFiles.length > 4 ? `, +${risk.sharedFiles.length - 4} more` : "";
  const reasons = risk.reasons.map((reason) => `    - ${reason}`).join("\n");

  return [
    `${label} ${String(risk.score).padStart(3)}  ${risk.pair[0]} x ${risk.pair[1]}`,
    `    shared: ${files}${more}`,
    reasons,
    `    next: ${risk.recommendation}`
  ]
    .filter(Boolean)
    .join("\n");
}

function table(headers, rows) {
  const widths = headers.map((header, index) =>
    Math.max(header.length, ...rows.map((row) => String(row[index]).length))
  );
  const formatRow = (row) => row.map((cell, index) => String(cell).padEnd(widths[index])).join("  ");
  return [formatRow(headers), formatRow(headers.map((header) => "-".repeat(header.length))), ...rows.map(formatRow)].join(
    "\n"
  );
}

function style(text, tone, color) {
  if (!color) {
    return text;
  }

  const codes = {
    bold: ["\u001b[1m", "\u001b[22m"],
    high: ["\u001b[31m", "\u001b[39m"],
    medium: ["\u001b[33m", "\u001b[39m"],
    low: ["\u001b[36m", "\u001b[39m"]
  };

  const code = codes[tone];
  return code ? `${code[0]}${text}${code[1]}` : text;
}
