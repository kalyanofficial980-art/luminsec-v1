export type RetestSeverity = "info" | "low" | "medium" | "high" | "critical" | "unknown";

export type RetestFindingInput = {
  id?: unknown;
  category?: unknown;
  severity?: unknown;
  risk_level?: unknown;
  title?: unknown;
  description?: unknown;
  recommendation?: unknown;
  evidence?: unknown;
  root_cause?: unknown;
  created_at?: unknown;
};

export type RetestProofItem = {
  key: string;
  id: string;
  title: string;
  category: string;
  severity: RetestSeverity;
  evidenceSummary: string;
};

export type RetestProofResult = {
  previousFindingCount: number;
  currentFindingCount: number;
  fixedCount: number;
  stillOpenCount: number;
  newCount: number;
  highRiskFixedCount: number;
  highRiskStillOpenCount: number;
  highRiskNewCount: number;
  improvementPercent: number;
  retestProofScore: number;
  statusLabel: string;
  fixed: RetestProofItem[];
  stillOpen: RetestProofItem[];
  newlyDetected: RetestProofItem[];
  notes: string[];
};

function text(value: unknown, fallback = "") {
  const normalized = String(value ?? "").trim();
  return normalized.length > 0 ? normalized : fallback;
}

function normalizeForKey(value: unknown) {
  return text(value)
    .toLowerCase()
    .replace(/https?:\/\/\S+/g, " url ")
    .replace(/[a-f0-9]{8,}/g, " id ")
    .replace(/\d+/g, " n ")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 140);
}

export function normalizeRetestSeverity(value: unknown): RetestSeverity {
  const normalized = text(value).toLowerCase();

  if (normalized.includes("critical")) return "critical";
  if (normalized.includes("high")) return "high";
  if (normalized.includes("medium") || normalized.includes("moderate")) return "medium";
  if (normalized.includes("low")) return "low";
  if (normalized.includes("info")) return "info";

  return "unknown";
}

function severityRank(value: unknown) {
  const severity = normalizeRetestSeverity(value);

  const ranks: Record<RetestSeverity, number> = {
    critical: 5,
    high: 4,
    medium: 3,
    low: 2,
    info: 1,
    unknown: 0,
  };

  return ranks[severity];
}

function isHighRisk(value: unknown) {
  const severity = normalizeRetestSeverity(value);
  return severity === "critical" || severity === "high";
}

function evidenceSummary(value: unknown) {
  const lines = text(value)
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean);

  return lines[0] || "Evidence not stored.";
}

export function retestFindingKey(finding: RetestFindingInput) {
  const explicitRootCause = normalizeForKey(finding.root_cause);

  if (explicitRootCause) {
    return `root:${explicitRootCause}`;
  }

  const category = normalizeForKey(finding.category);
  const title = normalizeForKey(finding.title);
  const descriptionSignal = normalizeForKey(finding.description).slice(0, 80);

  if (category && title) return `${category}:${title}`;
  if (title) return `title:${title}`;
  if (category && descriptionSignal) return `${category}:${descriptionSignal}`;

  return `unknown:${normalizeForKey(finding.id) || "finding"}`;
}

function toProofItem(finding: RetestFindingInput): RetestProofItem {
  return {
    key: retestFindingKey(finding),
    id: text(finding.id, retestFindingKey(finding)),
    title: text(finding.title, "Finding"),
    category: text(finding.category, "general"),
    severity: normalizeRetestSeverity(finding.severity || finding.risk_level),
    evidenceSummary: evidenceSummary(finding.evidence),
  };
}

function buildFindingMap(findings: RetestFindingInput[]) {
  const map = new Map<string, RetestProofItem>();

  for (const finding of findings) {
    const item = toProofItem(finding);
    const existing = map.get(item.key);

    if (!existing || severityRank(item.severity) > severityRank(existing.severity)) {
      map.set(item.key, item);
    }
  }

  return map;
}

function sortBySeverity(items: RetestProofItem[]) {
  return [...items].sort((a, b) => severityRank(b.severity) - severityRank(a.severity) || a.title.localeCompare(b.title));
}

function clampPercent(value: number) {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, Math.round(value)));
}

function statusLabel(input: {
  previousFindingCount: number;
  fixedCount: number;
  stillOpenCount: number;
  newCount: number;
  highRiskNewCount: number;
}) {
  if (input.previousFindingCount === 0) return "Baseline scan only";
  if (input.highRiskNewCount > 0) return "Needs review";
  if (input.fixedCount > 0 && input.stillOpenCount === 0 && input.newCount === 0) return "Improved";
  if (input.fixedCount > input.newCount) return "Improved with remaining work";
  if (input.fixedCount === 0 && input.stillOpenCount > 0) return "No clear improvement";
  return "Mixed retest result";
}

export function calculateRetestProof(input: {
  previousFindings: RetestFindingInput[];
  currentFindings: RetestFindingInput[];
}): RetestProofResult {
  const previousMap = buildFindingMap(Array.isArray(input.previousFindings) ? input.previousFindings : []);
  const currentMap = buildFindingMap(Array.isArray(input.currentFindings) ? input.currentFindings : []);

  const fixed: RetestProofItem[] = [];
  const stillOpen: RetestProofItem[] = [];
  const newlyDetected: RetestProofItem[] = [];

  for (const [key, previousFinding] of previousMap.entries()) {
    if (currentMap.has(key)) {
      stillOpen.push(currentMap.get(key) || previousFinding);
    } else {
      fixed.push(previousFinding);
    }
  }

  for (const [key, currentFinding] of currentMap.entries()) {
    if (!previousMap.has(key)) {
      newlyDetected.push(currentFinding);
    }
  }

  const previousFindingCount = previousMap.size;
  const currentFindingCount = currentMap.size;
  const fixedCount = fixed.length;
  const stillOpenCount = stillOpen.length;
  const newCount = newlyDetected.length;
  const highRiskFixedCount = fixed.filter((finding) => isHighRisk(finding.severity)).length;
  const highRiskStillOpenCount = stillOpen.filter((finding) => isHighRisk(finding.severity)).length;
  const highRiskNewCount = newlyDetected.filter((finding) => isHighRisk(finding.severity)).length;

  const improvementPercent = previousFindingCount > 0
    ? clampPercent((fixedCount / previousFindingCount) * 100)
    : 0;

  const retestProofScore = previousFindingCount > 0
    ? clampPercent(100 - stillOpenCount * 12 - newCount * 8 - highRiskStillOpenCount * 10 - highRiskNewCount * 14 + fixedCount * 5)
    : 0;

  const notes = [
    "Retest proof compares normalized finding root causes between two scans.",
    "A fixed item means it appeared in the previous scan but not in the current scan.",
    "A still-open item means the same normalized issue appears in both scans.",
    "A new item means it appears in the current scan but was not visible in the previous scan.",
    "This is evidence of visible readiness improvement, not legal certification or penetration-test proof.",
  ];

  return {
    previousFindingCount,
    currentFindingCount,
    fixedCount,
    stillOpenCount,
    newCount,
    highRiskFixedCount,
    highRiskStillOpenCount,
    highRiskNewCount,
    improvementPercent,
    retestProofScore,
    statusLabel: statusLabel({
      previousFindingCount,
      fixedCount,
      stillOpenCount,
      newCount,
      highRiskNewCount,
    }),
    fixed: sortBySeverity(fixed),
    stillOpen: sortBySeverity(stillOpen),
    newlyDetected: sortBySeverity(newlyDetected),
    notes,
  };
}