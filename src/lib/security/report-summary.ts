import type {
  ProfessionalFinding,
  ProfessionalReportSummary,
} from "./types";
import { calculateScoreBreakdown, riskFromScore } from "./scoring";
import {
  buildRiskReason,
  buildScoreDrivers,
  buildScoreExplanation,
  buildScoreImprovements,
} from "./risk-reasons";

function firstItems(values: string[], limit: number) {
  return values.filter(Boolean).slice(0, limit);
}

export function buildProfessionalReportSummary(
  findings: ProfessionalFinding[]
): ProfessionalReportSummary {
  const score = calculateScoreBreakdown(findings);
  const riskLevel = riskFromScore(score.overall);

  const topFindings = [...findings].sort((a, b) => {
    const order = { critical: 5, high: 4, medium: 3, low: 2, info: 1 };
    return order[b.severity] - order[a.severity];
  });

  const topRisks = firstItems(
    topFindings.map((finding) => finding.title),
    3
  );

  const fastestFixes = firstItems(
    topFindings
      .filter((finding) => finding.estimatedEffort === "quick")
      .map((finding) => finding.fixSummary),
    3
  );

  const ownerActions = firstItems(
    topFindings
      .filter((finding) =>
        ["privacy", "trust_signals", "content"].includes(finding.category)
      )
      .map((finding) => finding.fixSummary),
    3
  );

  const developerActions = firstItems(
    topFindings
      .filter((finding) =>
        ["https_tls", "security_headers", "cookies", "technology", "forms", "exposure"].includes(finding.category)
      )
      .map((finding) => finding.developerFix),
    3
  );

  const riskReason = buildRiskReason(score, riskLevel, findings);
  const scoreExplanation = buildScoreExplanation(score, findings);
  const scoreDrivers = buildScoreDrivers(findings);
  const scoreImprovements = buildScoreImprovements(findings);

  const executiveSummary =
    findings.length === 0
      ? "No major visible website security posture issues were detected in this passive review."
      : `VeyraSec found ${findings.length} visible website security posture item${findings.length === 1 ? "" : "s"} to review. ${riskReason}`;

  return {
    score,
    riskLevel,
    executiveSummary,
    topRisks,
    fastestFixes,
    ownerActions,
    developerActions,
    scoreExplanation,
    riskReason,
    scoreDrivers,
    scoreImprovements,
  };
}