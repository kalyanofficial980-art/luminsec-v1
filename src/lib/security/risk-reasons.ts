import type {
  ProfessionalFinding,
  ScoreBreakdown,
  SecurityCategory,
  SecuritySeverity,
} from "./types";

const severityRank: Record<SecuritySeverity, number> = {
  critical: 5,
  high: 4,
  medium: 3,
  low: 2,
  info: 1,
};

function categoryLabel(category: SecurityCategory) {
  return category.replaceAll("_", " ");
}

function topFindings(findings: ProfessionalFinding[], limit = 5) {
  return [...findings]
    .sort((a, b) => severityRank[b.severity] - severityRank[a.severity])
    .slice(0, limit);
}

function categoryCounts(findings: ProfessionalFinding[]) {
  const counts = new Map<SecurityCategory, number>();

  for (const finding of findings) {
    counts.set(finding.category, (counts.get(finding.category) ?? 0) + 1);
  }

  return [...counts.entries()].sort((a, b) => b[1] - a[1]);
}

function weakestScore(score: ScoreBreakdown) {
  const entries = [
    ["Security", score.security],
    ["Privacy", score.privacy],
    ["Trust", score.trust],
    ["Exposure", score.exposure],
    ["Technical hygiene", score.technicalHygiene],
  ] as const;

  return [...entries].sort((a, b) => a[1] - b[1])[0];
}

function strongestScore(score: ScoreBreakdown) {
  const entries = [
    ["Security", score.security],
    ["Privacy", score.privacy],
    ["Trust", score.trust],
    ["Exposure", score.exposure],
    ["Technical hygiene", score.technicalHygiene],
  ] as const;

  return [...entries].sort((a, b) => b[1] - a[1])[0];
}

export function buildRiskReason(
  score: ScoreBreakdown,
  riskLevel: SecuritySeverity,
  findings: ProfessionalFinding[],
) {
  const [weakestLabel, weakestValue] = weakestScore(score);
  const majorFindings = topFindings(findings, 3);
  const riskName =
    riskLevel === "critical"
      ? "Critical"
      : riskLevel === "high"
        ? "High"
        : riskLevel === "medium"
          ? "Medium"
          : riskLevel === "low"
            ? "Low"
            : "Review";

  if (findings.length === 0) {
    return `Risk is ${riskName} because the passive scan did not store visible findings, and the overall score is ${score.overall}/100.`;
  }

  const topTitles = majorFindings.map((finding) => finding.title).join(", ");

  return `Risk is ${riskName} because the overall score is ${score.overall}/100, the weakest area is ${weakestLabel} at ${weakestValue}/100, and the top visible issue${majorFindings.length === 1 ? " is" : "s are"}: ${topTitles}.`;
}

export function buildScoreExplanation(
  score: ScoreBreakdown,
  findings: ProfessionalFinding[],
) {
  const [weakestLabel, weakestValue] = weakestScore(score);
  const [strongestLabel, strongestValue] = strongestScore(score);
  const categories = categoryCounts(findings).slice(0, 3);

  const lines = [
    `Overall score is ${score.overall}/100 based on visible website security posture signals.`,
    `${weakestLabel} is the weakest area at ${weakestValue}/100 and should be improved first.`,
    `${strongestLabel} is the strongest area at ${strongestValue}/100.`,
  ];

  if (categories.length > 0) {
    lines.push(
      `Most findings are related to ${categories
        .map(([category, count]) => `${categoryLabel(category)} (${count})`)
        .join(", ")}.`,
    );
  }

  return lines;
}

export function buildScoreDrivers(findings: ProfessionalFinding[]) {
  const majorFindings = topFindings(findings, 5);

  if (majorFindings.length === 0) {
    return ["No major visible findings were stored for this scan."];
  }

  return majorFindings.map((finding) => {
    return `${finding.title} reduced the score because it affects ${categoryLabel(
      finding.category,
    )} with ${finding.severity} severity.`;
  });
}

export function buildScoreImprovements(findings: ProfessionalFinding[]) {
  const majorFindings = topFindings(findings, 5);

  if (majorFindings.length === 0) {
    return ["Run periodic scans and keep core website trust signals healthy."];
  }

  return majorFindings.map((finding) => {
    return `${finding.fixSummary} Retest after the fix to confirm score improvement.`;
  });
}


