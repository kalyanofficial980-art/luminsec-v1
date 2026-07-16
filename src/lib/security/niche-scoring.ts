export type NicheModuleKey =
  | "customer_data_security"
  | "dpdp_readiness"
  | "cert_in_readiness"
  | "website_trust_security";

export type NicheFindingInput = {
  id?: string | null;
  title?: string | null;
  category?: string | null;
  severity?: string | null;
  description?: string | null;
  recommendation?: string | null;
  evidence?: string | null;
};

export type NicheScoreModule = {
  key: NicheModuleKey;
  label: string;
  shortLabel: string;
  maxWeight: number;
  score: number;
  penalty: number;
  findingCount: number;
  highPriorityCount: number;
  explanation: string;
};

export type DeduplicatedFindingGroup = {
  module?: string;
  id: string;
  securityModule: NicheModuleKey;
  title: string;
  severity: "info" | "low" | "medium" | "high" | "critical";
  confidence: "low" | "medium" | "high";
  findingCount: number;
  penalty: number;
  evidenceSamples: string[];
  recommendation: string;
  businessImpact: string;
  developerAction: string;
};

export type NicheScoringResult = {
  overallScore: number;
  customerDataSecurityScore: number;
  dpdpReadinessScore: number;
  certInReadinessScore: number;
  websiteTrustScore: number;
  modules: NicheScoreModule[];
  groupedFindings: DeduplicatedFindingGroup[];
  topFixes: DeduplicatedFindingGroup[];
  summary: {
    totalRawFindings: number;
    groupedFindingCount: number;
    criticalOrHighGroups: number;
    mediumGroups: number;
    lowOrInfoGroups: number;
    scoreExplanation: string[];
    customerMessage: string;
  };
};

const MODULE_WEIGHTS: Record<NicheModuleKey, number> = {
  customer_data_security: 35,
  dpdp_readiness: 30,
  cert_in_readiness: 20,
  website_trust_security: 15,
};

const MODULE_LABELS: Record<
  NicheModuleKey,
  { label: string; shortLabel: string; explanation: string }
> = {
  customer_data_security: {
    label: "Customer Data Security",
    shortLabel: "Customer Data",
    explanation:
      "Checks visible safeguards around forms, cookies, tracking, payments, password fields, HTTPS, and third-party scripts.",
  },
  dpdp_readiness: {
    label: "DPDP Readiness",
    shortLabel: "DPDP",
    explanation:
      "Checks visible privacy, purpose, contact, grievance, data request, vendor, and breach-readiness signals.",
  },
  cert_in_readiness: {
    label: "CERT-In Readiness",
    shortLabel: "CERT-In",
    explanation:
      "Checks basic incident-readiness signals such as security contact, log readiness, reporting readiness, backup, and audit notes.",
  },
  website_trust_security: {
    label: "Website Trust",
    shortLabel: "Website Trust",
    explanation:
      "Checks visible website trust signals such as HTTPS, security headers, security.txt, mixed content, and public page hygiene.",
  },
};

function text(value: unknown) {
  return String(value ?? "").trim();
}

function lower(value: unknown) {
  return text(value).toLowerCase();
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function normalizedSeverity(
  value: unknown,
): DeduplicatedFindingGroup["severity"] {
  const raw = lower(value);

  if (raw.includes("critical")) return "critical";
  if (raw.includes("high")) return "high";
  if (raw.includes("medium")) return "medium";
  if (raw.includes("low")) return "low";
  if (raw.includes("info")) return "info";

  return "low";
}

function severityPenalty(severity: DeduplicatedFindingGroup["severity"]) {
  if (severity === "critical") return 18;
  if (severity === "high") return 14;
  if (severity === "medium") return 8;
  if (severity === "low") return 4;
  return 1;
}

function severityRank(severity: DeduplicatedFindingGroup["severity"]) {
  if (severity === "critical") return 5;
  if (severity === "high") return 4;
  if (severity === "medium") return 3;
  if (severity === "low") return 2;
  return 1;
}

function highestSeverity(
  a: DeduplicatedFindingGroup["severity"],
  b: DeduplicatedFindingGroup["severity"],
) {
  return severityRank(b) > severityRank(a) ? b : a;
}

function confidenceForFinding(
  finding: NicheFindingInput,
): DeduplicatedFindingGroup["confidence"] {
  const haystack = [
    finding.title,
    finding.category,
    finding.description,
    finding.recommendation,
    finding.evidence,
  ]
    .map(lower)
    .join(" ");

  if (
    haystack.includes("missing") ||
    haystack.includes("not found") ||
    haystack.includes("detected") ||
    haystack.includes("header") ||
    haystack.includes("cookie") ||
    haystack.includes("password field") ||
    haystack.includes("form")
  ) {
    return "high";
  }

  if (
    haystack.includes("review") ||
    haystack.includes("potential") ||
    haystack.includes("known-risk") ||
    haystack.includes("technology")
  ) {
    return "medium";
  }

  return "medium";
}

function confidenceMultiplier(
  confidence: DeduplicatedFindingGroup["confidence"],
) {
  if (confidence === "high") return 1;
  if (confidence === "medium") return 0.65;
  return 0.35;
}

function classifyModule(finding: NicheFindingInput): NicheModuleKey {
  const haystack = [
    finding.title,
    finding.category,
    finding.description,
    finding.recommendation,
    finding.evidence,
  ]
    .map(lower)
    .join(" ");

  if (
    /cert|incident|log retention|180 day|180-day|six hour|6 hour|6-hour|time sync|ntp|backup|restore|security contact|incident owner|audit log/.test(
      haystack,
    )
  ) {
    return "cert_in_readiness";
  }

  if (
    /dpdp|privacy policy|privacy|consent|purpose|grievance|data deletion|data request|processor|vendor disclosure|breach notification|personal data/.test(
      haystack,
    )
  ) {
    return "dpdp_readiness";
  }

  if (
    /form|password field|cookie|payment|razorpay|stripe|paypal|tracking|analytics|tag manager|meta pixel|hotjar|third-party|third party|customer data|checkout/.test(
      haystack,
    )
  ) {
    return "customer_data_security";
  }

  return "website_trust_security";
}

function classifyRootCause(finding: NicheFindingInput) {
  const explicitRootCause = text(
    (finding as { root_cause?: unknown }).root_cause,
  );

  if (explicitRootCause) {
    return explicitRootCause;
  }

  const haystack = [
    finding.title,
    finding.category,
    finding.description,
    finding.recommendation,
    finding.evidence,
  ]
    .map(lower)
    .join(" ");

  const rules: Array<[string, RegExp]> = [
    [
      "https_transport",
      /https|http to https|redirect|hsts|strict-transport-security/,
    ],
    ["content_security_policy", /\bcsp\b|content-security-policy/],
    ["clickjacking_headers", /x-frame-options|frame-ancestors|clickjack/],
    ["content_type_header", /x-content-type-options|nosniff/],
    ["referrer_policy", /referrer-policy/],
    ["permissions_policy", /permissions-policy/],
    ["security_txt", /security\.txt/],
    ["privacy_policy", /privacy policy|privacy signal|privacy link/],
    ["contact_grievance", /contact|support|grievance/],
    ["consent_purpose", /consent|purpose/],
    [
      "data_request_deletion",
      /data deletion|data request|delete data|access request/,
    ],
    ["breach_readiness", /breach|notification/],
    [
      "cert_incident_reporting",
      /cert|incident reporting|6 hour|6-hour|six hour/,
    ],
    ["log_retention", /log retention|180 day|180-day|logs/],
    ["security_contact", /security contact|incident contact/],
    ["backup_restore", /backup|restore|recovery/],
    ["forms_customer_data", /form|lead|appointment|booking/],
    ["password_fields", /password field|login/],
    ["cookie_security", /cookie|secure flag|httponly|samesite/],
    ["payment_scripts", /payment|razorpay|stripe|paypal|checkout/],
    ["tracking_scripts", /tracking|analytics|tag manager|meta pixel|hotjar/],
    [
      "third_party_scripts",
      /third-party|third party|external script|script count/,
    ],
    ["mixed_content", /mixed content|http asset|insecure asset/],
    [
      "technology_review",
      /wordpress|woocommerce|shopify|next\.js|react|vercel|netlify|cloudflare|nginx|apache|technology|x-powered-by|generator/,
    ],
    ["page_metadata", /title tag|meta description|page title/],
    ["public_page_error", /page error|broken link|404|availability/],
  ];

  for (const [key, pattern] of rules) {
    if (pattern.test(haystack)) {
      return key;
    }
  }

  return lower(finding.category) || "general_review";
}

function firstNonEmpty(...values: Array<unknown>) {
  for (const value of values) {
    const raw = text(value);
    if (raw) return raw;
  }

  return "";
}

function shortEvidence(value: unknown) {
  const raw = text(value).replace(/\s+/g, " ");
  return raw.length > 180 ? `${raw.slice(0, 180)}...` : raw;
}

function recommendationForGroup(
  securityModule: NicheModuleKey,
  title: string,
  fallback: string,
) {
  const cleanFallback = text(fallback);

  if (cleanFallback.length > 0) {
    return cleanFallback.length > 360
      ? `${cleanFallback.slice(0, 360)}...`
      : cleanFallback;
  }

  if (securityModule === "customer_data_security") {
    return "Review customer-data collection points, ensure HTTPS, add clear privacy context, and verify cookies, forms, tracking scripts, and payment scripts.";
  }

  if (securityModule === "dpdp_readiness") {
    return "Add visible DPDP readiness signals such as privacy policy, consent/purpose language, grievance contact, data request process, and breach-readiness process.";
  }

  if (securityModule === "cert_in_readiness") {
    return "Define incident owner, security contact, log retention process, reporting readiness, backup/recovery process, and audit evidence.";
  }

  return `Review and fix: ${title}`;
}

function businessImpactForModule(securityModule: NicheModuleKey) {
  if (securityModule === "customer_data_security") {
    return "Customer trust may be reduced if forms, cookies, tracking, payment scripts, or password fields are not clearly protected.";
  }

  if (securityModule === "dpdp_readiness") {
    return "DPDP readiness may be weak if privacy, purpose, grievance, data request, and breach-readiness signals are unclear.";
  }

  if (securityModule === "cert_in_readiness") {
    return "Incident readiness may be weak if the business cannot quickly identify, log, escalate, and report cyber incidents.";
  }

  return "Website trust may be reduced if visible security headers, HTTPS posture, public hygiene, or technology signals are weak.";
}

function developerActionForModule(securityModule: NicheModuleKey) {
  if (securityModule === "customer_data_security") {
    return "Ask your developer to review forms, cookies, third-party scripts, payment/tracking scripts, HTTPS, and privacy link placement.";
  }

  if (securityModule === "dpdp_readiness") {
    return "Add visible privacy, consent/purpose, grievance/contact, data request, and breach-readiness pages or sections.";
  }

  if (securityModule === "cert_in_readiness") {
    return "Document incident contact, log retention, backup/recovery, reporting workflow, and audit evidence.";
  }

  return "Ask your developer to apply the recommended website security or trust configuration and retest.";
}

function groupFindings(findings: NicheFindingInput[]) {
  const groups = new Map<string, DeduplicatedFindingGroup>();

  for (const finding of findings) {
    const securityModule = classifyModule(finding);
    const rootCause = classifyRootCause(finding);
    const groupId = `${securityModule}:${rootCause}`;
    const severity = normalizedSeverity(finding.severity);
    const confidence = confidenceForFinding(finding);
    const basePenalty =
      severityPenalty(severity) * confidenceMultiplier(confidence);
    const evidence = shortEvidence(
      firstNonEmpty(finding.evidence, finding.description, finding.title),
    );
    const title = firstNonEmpty(finding.title, rootCause.replace(/_/g, " "));
    const recommendation = recommendationForGroup(
      securityModule,
      title,
      finding.recommendation || "",
    );

    const existing = groups.get(groupId);

    if (!existing) {
      groups.set(groupId, {
        id: groupId,
        securityModule,
        title,
        severity,
        confidence,
        findingCount: 1,
        penalty: basePenalty,
        evidenceSamples: evidence ? [evidence] : [],
        recommendation,
        businessImpact: businessImpactForModule(securityModule),
        developerAction: developerActionForModule(securityModule),
      });
      continue;
    }

    existing.findingCount += 1;
    existing.severity = highestSeverity(existing.severity, severity);

    if (
      confidenceMultiplier(confidence) >
      confidenceMultiplier(existing.confidence)
    ) {
      existing.confidence = confidence;
    }

    existing.penalty =
      Math.max(existing.penalty, basePenalty) + Math.min(2, basePenalty * 0.15);

    if (
      evidence &&
      existing.evidenceSamples.length < 3 &&
      !existing.evidenceSamples.includes(evidence)
    ) {
      existing.evidenceSamples.push(evidence);
    }
  }

  return [...groups.values()].map((group) => ({
    ...group,
    penalty: Math.round(group.penalty * 10) / 10,
  }));
}

function moduleScore(
  key: NicheModuleKey,
  groupedFindings: DeduplicatedFindingGroup[],
): NicheScoreModule {
  const moduleWeight = MODULE_WEIGHTS[key];
  const moduleFindings = groupedFindings.filter(
    (finding) => finding.securityModule === key,
  );

  const rawPenalty = moduleFindings.reduce(
    (sum, finding) => sum + finding.penalty,
    0,
  );
  const cappedPenalty = clamp(rawPenalty, 0, moduleWeight);
  const score = Math.round(100 - (cappedPenalty / moduleWeight) * 100);
  const labels = MODULE_LABELS[key];

  return {
    key,
    label: labels.label,
    shortLabel: labels.shortLabel,
    maxWeight: moduleWeight,
    score: clamp(score, 0, 100),
    penalty: Math.round(cappedPenalty * 10) / 10,
    findingCount: moduleFindings.length,
    highPriorityCount: moduleFindings.filter(
      (finding) =>
        finding.severity === "critical" || finding.severity === "high",
    ).length,
    explanation: labels.explanation,
  };
}

function prioritySort(
  a: DeduplicatedFindingGroup,
  b: DeduplicatedFindingGroup,
) {
  const severityDiff = severityRank(b.severity) - severityRank(a.severity);

  if (severityDiff !== 0) {
    return severityDiff;
  }

  return b.penalty - a.penalty;
}

function customerMessage(overallScore: number) {
  if (overallScore >= 85) {
    return "This website shows strong visible readiness signals. Continue monitoring and retest after changes.";
  }

  if (overallScore >= 70) {
    return "This website is usable, but some readiness gaps should be fixed before using it as a strong customer-data trust signal.";
  }

  if (overallScore >= 50) {
    return "This website needs focused improvements before it should be considered customer-data ready.";
  }

  return "This website has major visible readiness gaps. Fix the top-priority items before using it as a customer-data trust signal.";
}

export function calculateNicheScoring(
  findings: NicheFindingInput[],
): NicheScoringResult {
  const safeFindings = Array.isArray(findings) ? findings : [];
  const groupedFindings = groupFindings(safeFindings).sort(prioritySort);

  const modules: NicheScoreModule[] = [
    moduleScore("customer_data_security", groupedFindings),
    moduleScore("dpdp_readiness", groupedFindings),
    moduleScore("cert_in_readiness", groupedFindings),
    moduleScore("website_trust_security", groupedFindings),
  ];

  const weightedPenalty = modules.reduce(
    (sum, securityModule) => sum + securityModule.penalty,
    0,
  );
  const overallScore = clamp(Math.round(100 - weightedPenalty), 0, 100);

  const scores = {
    customer_data_security: 100,
    dpdp_readiness: 100,
    cert_in_readiness: 100,
    website_trust_security: 100,
  };

  for (const securityModule of modules) {
    scores[securityModule.key] = securityModule.score;
  }

  const topFixes = groupedFindings.slice(0, 5);

  return {
    overallScore,
    customerDataSecurityScore: scores.customer_data_security,
    dpdpReadinessScore: scores.dpdp_readiness,
    certInReadinessScore: scores.cert_in_readiness,
    websiteTrustScore: scores.website_trust_security,
    modules,
    groupedFindings,
    topFixes,
    summary: {
      totalRawFindings: safeFindings.length,
      groupedFindingCount: groupedFindings.length,
      criticalOrHighGroups: groupedFindings.filter(
        (finding) =>
          finding.severity === "critical" || finding.severity === "high",
      ).length,
      mediumGroups: groupedFindings.filter(
        (finding) => finding.severity === "medium",
      ).length,
      lowOrInfoGroups: groupedFindings.filter(
        (finding) => finding.severity === "low" || finding.severity === "info",
      ).length,
      scoreExplanation: modules.map(
        (securityModule) =>
          `${securityModule.shortLabel}: ${securityModule.score}/100 with ${securityModule.findingCount} grouped item${
            securityModule.findingCount === 1 ? "" : "s"
          }.`,
      ),
      customerMessage: customerMessage(overallScore),
    },
  };
}




