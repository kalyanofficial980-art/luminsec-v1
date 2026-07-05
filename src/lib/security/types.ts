export type SecuritySeverity = "info" | "low" | "medium" | "high" | "critical";

export type SecurityConfidence = "low" | "medium" | "high";

export type SecurityCategory =
  | "https_tls"
  | "security_headers"
  | "privacy"
  | "trust_signals"
  | "cookies"
  | "technology"
  | "exposure"
  | "forms"
  | "content"
  | "availability"
  | "compliance_readiness"
  | "general";

export type RemediationPriority = "fix_now" | "fix_this_week" | "ask_developer" | "monitor" | "optional";

export type EstimatedEffort = "quick" | "medium" | "advanced";

export type SecurityEvidence = {
  checkedUrl: string;
  observed: string;
  expected?: string;
  source: "http_header" | "html" | "tls" | "redirect" | "cookie" | "public_page" | "scanner";
};

export type ProfessionalFinding = {
  id: string;
  category: SecurityCategory;
  severity: SecuritySeverity;
  confidence: SecurityConfidence;
  title: string;
  whatWeFound: string;
  whyItMatters: string;
  businessImpact: string;
  technicalImpact: string;
  fixSummary: string;
  developerFix: string;
  priority: RemediationPriority;
  estimatedEffort: EstimatedEffort;
  retestInstruction: string;
  evidence: SecurityEvidence[];
};

export type ScoreBreakdown = {
  overall: number;
  security: number;
  privacy: number;
  trust: number;
  exposure: number;
  technicalHygiene: number;
};

export type ProfessionalReportSummary = {
  score: ScoreBreakdown;
  riskLevel: SecuritySeverity;
  executiveSummary: string;
  topRisks: string[];
  fastestFixes: string[];
  ownerActions: string[];
  developerActions: string[];
  scoreExplanation: string[];
  riskReason: string;
  scoreDrivers: string[];
  scoreImprovements: string[];
};

export function severityWeight(severity: SecuritySeverity) {
  if (severity === "critical") return 30;
  if (severity === "high") return 22;
  if (severity === "medium") return 14;
  if (severity === "low") return 7;
  return 2;
}

export function severityLabel(severity: SecuritySeverity) {
  if (severity === "critical") return "Critical";
  if (severity === "high") return "High";
  if (severity === "medium") return "Medium";
  if (severity === "low") return "Low";
  return "Info";
}

export function priorityLabel(priority: RemediationPriority) {
  if (priority === "fix_now") return "Fix now";
  if (priority === "fix_this_week") return "Fix this week";
  if (priority === "ask_developer") return "Ask developer";
  if (priority === "monitor") return "Monitor";
  return "Optional";
}