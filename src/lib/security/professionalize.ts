import { findingCatalog, type FindingCatalogItem } from "./finding-catalog";
import type {
  EstimatedEffort,
  ProfessionalFinding,
  RemediationPriority,
  SecurityCategory,
  SecurityConfidence,
  SecurityEvidence,
  SecuritySeverity,
} from "./types";
import { priorityLabel } from "./types";

type LegacyFinding = {
  category?: unknown;
  severity?: unknown;
  title?: unknown;
  description?: unknown;
  recommendation?: unknown;
  evidence?: unknown;
};

type ProfessionalizeInput = {
  checkedUrl: string;
  findings: LegacyFinding[];
};

type DatabaseFindingInput = {
  userId: string;
  websiteId: string;
  scanResultId: string;
  finding: ProfessionalFinding;
};

function text(value: unknown, fallback = "") {
  const raw = String(value ?? "").trim();
  return raw.length > 0 ? raw : fallback;
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 80);
}

function normalizeSeverity(value: unknown): SecuritySeverity {
  const raw = String(value ?? "").toLowerCase();

  if (raw.includes("critical")) return "critical";
  if (raw.includes("high")) return "high";
  if (raw.includes("medium") || raw.includes("moderate")) return "medium";
  if (raw.includes("low")) return "low";

  return "info";
}

function normalizeCategory(
  value: unknown,
  title: string,
  description: string,
): SecurityCategory {
  const raw = `${String(value ?? "")} ${title} ${description}`.toLowerCase();

  if (
    raw.includes("hsts") ||
    raw.includes("csp") ||
    raw.includes("header") ||
    raw.includes("frame")
  ) {
    return "security_headers";
  }

  if (raw.includes("privacy") || raw.includes("cookie policy")) {
    return "privacy";
  }

  if (raw.includes("cookie")) {
    return "cookies";
  }

  if (raw.includes("tls") || raw.includes("ssl") || raw.includes("https")) {
    return "https_tls";
  }

  if (
    raw.includes("wordpress") ||
    raw.includes("shopify") ||
    raw.includes("technology") ||
    raw.includes("cms")
  ) {
    return "technology";
  }

  if (
    raw.includes("contact") ||
    raw.includes("trust") ||
    raw.includes("business")
  ) {
    return "trust_signals";
  }

  if (raw.includes("form") || raw.includes("login")) {
    return "forms";
  }

  if (
    raw.includes("exposed") ||
    raw.includes("debug") ||
    raw.includes("stack trace")
  ) {
    return "exposure";
  }

  return "general";
}

function inferCatalogItem(
  title: string,
  description: string,
): FindingCatalogItem | null {
  const raw = `${title} ${description}`.toLowerCase();

  if (raw.includes("strict-transport-security") || raw.includes("hsts")) {
    return findingCatalog.missing_hsts;
  }

  if (raw.includes("content-security-policy") || raw.includes("csp")) {
    return findingCatalog.missing_csp;
  }

  if (
    raw.includes("x-frame-options") ||
    raw.includes("clickjacking") ||
    raw.includes("frame protection")
  ) {
    return findingCatalog.missing_x_frame_options;
  }

  if (raw.includes("privacy policy")) {
    return findingCatalog.missing_privacy_policy;
  }

  if (
    raw.includes("contact") ||
    raw.includes("business trust") ||
    raw.includes("trust signal")
  ) {
    return findingCatalog.missing_contact_trust;
  }

  return null;
}

function confidenceFromFinding(
  severity: SecuritySeverity,
  hasEvidence: boolean,
): SecurityConfidence {
  if (hasEvidence) return "high";
  if (severity === "critical" || severity === "high") return "medium";
  return "medium";
}

function priorityFromSeverity(severity: SecuritySeverity): RemediationPriority {
  if (severity === "critical" || severity === "high") return "fix_now";
  if (severity === "medium") return "fix_this_week";
  if (severity === "low") return "monitor";
  return "optional";
}

function effortFromCategory(category: SecurityCategory): EstimatedEffort {
  if (
    category === "security_headers" ||
    category === "https_tls" ||
    category === "technology"
  ) {
    return "medium";
  }

  if (category === "exposure" || category === "forms") {
    return "advanced";
  }

  return "quick";
}

function buildEvidence(
  checkedUrl: string,
  legacy: LegacyFinding,
  title: string,
): SecurityEvidence[] {
  const observed = text(
    legacy.evidence,
    `Scanner observed this issue while reviewing ${checkedUrl}.`,
  );

  return [
    {
      checkedUrl,
      observed,
      expected: `The website should not show the issue: ${title}.`,
      source: "scanner",
    },
  ];
}

function genericFinding(
  checkedUrl: string,
  legacy: LegacyFinding,
): ProfessionalFinding {
  const title = text(legacy.title, "Website security posture item");
  const description = text(
    legacy.description,
    "VeyraSec detected a visible website security posture item that should be reviewed.",
  );
  const recommendation = text(
    legacy.recommendation,
    "Review this item and ask your developer to fix it if it applies to your website.",
  );
  const severity = normalizeSeverity(legacy.severity);
  const category = normalizeCategory(legacy.category, title, description);
  const evidence = buildEvidence(checkedUrl, legacy, title);
  const priority = priorityFromSeverity(severity);
  const estimatedEffort = effortFromCategory(category);

  return {
    id: slugify(title) || "general_finding",
    category,
    severity,
    confidence: confidenceFromFinding(severity, evidence.length > 0),
    title,
    whatWeFound: description,
    whyItMatters:
      "This visible signal can affect website security posture, customer trust, or technical hygiene.",
    businessImpact:
      "If ignored, this may reduce customer confidence or make the website look less security-ready.",
    technicalImpact:
      "The technical impact depends on the website setup and should be reviewed by the website owner or developer.",
    fixSummary: recommendation,
    developerFix: recommendation,
    priority,
    estimatedEffort,
    retestInstruction:
      "Run a new VeyraSec scan after applying the fix and confirm this finding no longer appears.",
    evidence,
  };
}

function catalogFinding(
  checkedUrl: string,
  legacy: LegacyFinding,
  catalogItem: FindingCatalogItem,
): ProfessionalFinding {
  const evidence = buildEvidence(checkedUrl, legacy, catalogItem.title);

  return {
    ...catalogItem,
    confidence: confidenceFromFinding(
      catalogItem.severity,
      evidence.length > 0,
    ),
    evidence,
  };
}

export function professionalizeLegacyFindings(
  input: ProfessionalizeInput,
): ProfessionalFinding[] {
  return input.findings.map((legacy, index) => {
    const title = text(legacy.title, `Finding ${index + 1}`);
    const description = text(legacy.description);
    const catalogItem = inferCatalogItem(title, description);

    if (catalogItem) {
      return catalogFinding(input.checkedUrl, legacy, catalogItem);
    }

    return genericFinding(input.checkedUrl, legacy);
  });
}

function evidenceToText(finding: ProfessionalFinding) {
  return finding.evidence
    .map((item, index) => {
      return [
        `Evidence ${index + 1}:`,
        `Checked URL: ${item.checkedUrl}`,
        `Observed: ${item.observed}`,
        item.expected ? `Expected: ${item.expected}` : "",
        `Source: ${item.source}`,
      ]
        .filter(Boolean)
        .join("\n");
    })
    .join("\n\n");
}

function descriptionToText(finding: ProfessionalFinding) {
  return [
    `What we found: ${finding.whatWeFound}`,
    `Why it matters: ${finding.whyItMatters}`,
    `Business impact: ${finding.businessImpact}`,
    `Technical impact: ${finding.technicalImpact}`,
    `Confidence: ${finding.confidence}`,
  ].join("\n\n");
}

function recommendationToText(finding: ProfessionalFinding) {
  return [
    `Priority: ${priorityLabel(finding.priority)}`,
    `Estimated effort: ${finding.estimatedEffort}`,
    `Fix summary: ${finding.fixSummary}`,
    `Developer fix: ${finding.developerFix}`,
    `Retest: ${finding.retestInstruction}`,
  ].join("\n\n");
}

export function professionalFindingToDatabaseFinding(
  input: DatabaseFindingInput,
) {
  const finding = input.finding;

  return {
    user_id: input.userId,
    website_id: input.websiteId,
    scan_result_id: input.scanResultId,
    scan_id: input.scanResultId,
    category: finding.category,
    severity: finding.severity,
    title: finding.title,
    description: descriptionToText(finding),
    recommendation: recommendationToText(finding),
    evidence: evidenceToText(finding),
  };
}


