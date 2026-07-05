import type {
  ProfessionalFinding,
  ScoreBreakdown,
  SecurityCategory,
  SecuritySeverity,
} from "./types";
import { severityWeight } from "./types";

function clampScore(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function categoryPenalty(findings: ProfessionalFinding[], categories: SecurityCategory[]) {
  return findings
    .filter((finding) => categories.includes(finding.category))
    .reduce((total, finding) => total + severityWeight(finding.severity), 0);
}

export function riskFromScore(score: number): SecuritySeverity {
  if (score >= 85) return "low";
  if (score >= 65) return "medium";
  if (score >= 40) return "high";
  return "critical";
}

export function calculateScoreBreakdown(findings: ProfessionalFinding[]): ScoreBreakdown {
  const securityPenalty = categoryPenalty(findings, [
    "https_tls",
    "security_headers",
    "cookies",
    "forms",
    "exposure",
    "technology",
  ]);

  const privacyPenalty = categoryPenalty(findings, [
    "privacy",
    "compliance_readiness",
    "cookies",
  ]);

  const trustPenalty = categoryPenalty(findings, [
    "trust_signals",
    "content",
    "availability",
  ]);

  const exposurePenalty = categoryPenalty(findings, [
    "exposure",
    "technology",
    "forms",
  ]);

  const hygienePenalty = categoryPenalty(findings, [
    "https_tls",
    "security_headers",
    "privacy",
    "trust_signals",
    "cookies",
    "technology",
    "exposure",
    "forms",
    "content",
    "availability",
    "compliance_readiness",
    "general",
  ]);

  const security = clampScore(100 - securityPenalty);
  const privacy = clampScore(100 - privacyPenalty);
  const trust = clampScore(100 - trustPenalty);
  const exposure = clampScore(100 - exposurePenalty);
  const technicalHygiene = clampScore(100 - hygienePenalty);

  const overall = clampScore(
    security * 0.35 +
      privacy * 0.15 +
      trust * 0.2 +
      exposure * 0.15 +
      technicalHygiene * 0.15
  );

  return {
    overall,
    security,
    privacy,
    trust,
    exposure,
    technicalHygiene,
  };
}