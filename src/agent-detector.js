const AGENT_PATTERNS = [
  { name: "codex", regex: /\bcodex\b|openai-codex|gpt-?5/i },
  { name: "claude-code", regex: /claude|anthropic/i },
  { name: "cursor", regex: /\bcursor\b/i },
  { name: "copilot", regex: /copilot|github-copilot/i },
  { name: "devin", regex: /\bdevin\b|cognition/i },
  { name: "openhands", regex: /openhands|open-hands/i },
  { name: "aider", regex: /\baider\b/i },
  { name: "sweep", regex: /\bsweep\b/i },
  { name: "factory", regex: /\bfactory\b|droid/i },
  { name: "automation-bot", regex: /dependabot|renovate|github-actions|\[bot\]/i },
  { name: "generic-agent", regex: /\bagent\b|\bai\b|llm|bot/i }
];

export function detectAgent(input = {}) {
  const fields = [
    ["branch", input.branch],
    ["author", input.author],
    ["subject", input.subject]
  ].filter(([, value]) => Boolean(value));

  const signals = [];
  for (const [field, value] of fields) {
    for (const pattern of AGENT_PATTERNS) {
      if (pattern.regex.test(value)) {
        signals.push({ field, value, match: pattern.name });
      }
    }
  }

  if (signals.length === 0) {
    return {
      name: "unknown",
      confidence: "low",
      signals: []
    };
  }

  const firstStrongSignal = signals.find((signal) => signal.match !== "generic-agent");
  const chosen = firstStrongSignal ?? signals[0];

  return {
    name: chosen.match,
    confidence: firstStrongSignal ? "high" : "medium",
    signals
  };
}

export function isAgentLike(agent) {
  return agent && agent.name !== "unknown";
}
