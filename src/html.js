import fs from "node:fs";
import path from "node:path";

export function writeHtmlReport(report, outputPath) {
  const resolved = path.resolve(outputPath);
  fs.mkdirSync(path.dirname(resolved), { recursive: true });
  fs.writeFileSync(resolved, renderHtmlReport(report), "utf8");
  return resolved;
}

export function renderHtmlReport(report) {
  const high = report.summary.highRiskPairs;
  const medium = report.summary.mediumRiskPairs;
  const low = report.summary.lowRiskPairs;

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>AgentRadar Report</title>
  <style>
    :root {
      color-scheme: light;
      --ink: #17202a;
      --muted: #5b6673;
      --line: #d8dee6;
      --panel: #ffffff;
      --page: #f6f7f9;
      --green: #117a4d;
      --amber: #a16005;
      --red: #b42318;
      --blue: #2458a6;
    }

    * {
      box-sizing: border-box;
    }

    body {
      margin: 0;
      background: var(--page);
      color: var(--ink);
      font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      line-height: 1.45;
    }

    main {
      width: min(1180px, calc(100vw - 32px));
      margin: 0 auto;
      padding: 32px 0 48px;
    }

    header {
      display: grid;
      grid-template-columns: 1fr auto;
      gap: 24px;
      align-items: end;
      padding: 24px 0;
      border-bottom: 1px solid var(--line);
    }

    h1 {
      margin: 0;
      font-size: 34px;
      letter-spacing: 0;
    }

    h2 {
      margin: 32px 0 12px;
      font-size: 18px;
      letter-spacing: 0;
    }

    p {
      margin: 6px 0 0;
      color: var(--muted);
    }

    .summary {
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: 12px;
      margin: 20px 0 8px;
    }

    .metric,
    .risk,
    .candidate {
      background: var(--panel);
      border: 1px solid var(--line);
      border-radius: 8px;
      padding: 16px;
    }

    .metric strong {
      display: block;
      font-size: 28px;
    }

    .metric span,
    .meta,
    .files {
      color: var(--muted);
      font-size: 13px;
    }

    .grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 12px;
    }

    .risk {
      display: grid;
      gap: 8px;
      border-left: 5px solid var(--line);
    }

    .risk.high {
      border-left-color: var(--red);
    }

    .risk.medium {
      border-left-color: var(--amber);
    }

    .risk.low {
      border-left-color: var(--blue);
    }

    .risk-title,
    .candidate-title {
      display: flex;
      justify-content: space-between;
      gap: 12px;
      align-items: baseline;
      font-weight: 700;
    }

    .badge {
      display: inline-flex;
      align-items: center;
      min-height: 24px;
      padding: 2px 8px;
      border-radius: 999px;
      color: #fff;
      font-size: 12px;
      font-weight: 700;
    }

    .badge.high {
      background: var(--red);
    }

    .badge.medium {
      background: var(--amber);
    }

    .badge.low {
      background: var(--blue);
    }

    .badge.agent {
      background: var(--green);
    }

    ul {
      margin: 4px 0 0;
      padding-left: 18px;
    }

    code {
      padding: 2px 5px;
      border-radius: 4px;
      background: #eef1f5;
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace;
      font-size: 12px;
    }

    @media (max-width: 760px) {
      main {
        width: min(100vw - 20px, 720px);
        padding-top: 18px;
      }

      header,
      .summary,
      .grid {
        grid-template-columns: 1fr;
      }

      h1 {
        font-size: 28px;
      }
    }
  </style>
</head>
<body>
  <main>
    <header>
      <div>
        <h1>AgentRadar</h1>
        <p>${escapeHtml(report.repository.root)} against <code>${escapeHtml(report.base)}</code></p>
      </div>
      <p>${escapeHtml(report.generatedAt)}</p>
    </header>

    <section class="summary" aria-label="Summary">
      ${metric("Candidates", report.summary.candidateCount)}
      ${metric("Changed files", report.summary.changedFileCount)}
      ${metric("High risk", high)}
      ${metric("Medium/low", medium + low)}
    </section>

    <section>
      <h2>Risk Radar</h2>
      <div class="grid">
        ${
          report.risks.length === 0
            ? '<div class="risk"><strong>No overlapping changed files found.</strong><p>Normal review should be enough.</p></div>'
            : report.risks.map(renderRisk).join("")
        }
      </div>
    </section>

    <section>
      <h2>Candidates</h2>
      <div class="grid">
        ${report.candidates.map(renderCandidate).join("")}
      </div>
    </section>
  </main>
</body>
</html>`;
}

function metric(label, value) {
  return `<div class="metric"><strong>${escapeHtml(String(value))}</strong><span>${escapeHtml(label)}</span></div>`;
}

function renderRisk(risk) {
  return `<article class="risk ${risk.level}">
    <div class="risk-title">
      <span>${escapeHtml(risk.pair[0])} x ${escapeHtml(risk.pair[1])}</span>
      <span class="badge ${risk.level}">${escapeHtml(risk.level.toUpperCase())} ${risk.score}</span>
    </div>
    <div class="files">${escapeHtml(risk.sharedFiles.join(", "))}</div>
    <ul>${risk.reasons.map((reason) => `<li>${escapeHtml(reason)}</li>`).join("")}</ul>
    <p>${escapeHtml(risk.recommendation)}</p>
  </article>`;
}

function renderCandidate(candidate) {
  return `<article class="candidate">
    <div class="candidate-title">
      <span>${escapeHtml(candidate.id)}</span>
      <span class="badge agent">${escapeHtml(candidate.agent.name)}</span>
    </div>
    <p class="meta">${candidate.commitCount} commit(s), ${candidate.changedFiles.length} file(s), +${candidate.additions}/-${candidate.deletions}</p>
    <p class="files">${escapeHtml(candidate.changedFiles.slice(0, 6).map((file) => file.path).join(", "))}</p>
  </article>`;
}

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
