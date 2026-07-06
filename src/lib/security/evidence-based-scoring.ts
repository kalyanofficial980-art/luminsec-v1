export type EvidenceBasedSeverity = "info" | "low" | "medium" | "high" | "critical";

export type EvidenceBasedConfidence = "high" | "medium" | "low";

export type EvidenceBasedVerificationStatus =
  | "manual_reviewed"
  | "verified_by_scan"
  | "likely_signal"
  | "needs_confirmation"
  | "not_visible";

export type EvidenceBasedEvidenceType =
  | "manual_review"
  | "response_header"
  | "set_cookie"
  | "html_signal"
  | "crawler_page"
  | "well_known_file"
  | "technology_signal"
  | "known_risk_advisory"
  | "http_probe"
  | "self_attestation"
  | "scan_quality"
  | "unknown";

export type EvidenceScorableFinding = {
  id?: string;
  title?: string;
  category?: string;
  severity?: EvidenceBasedSeverity | string;
  risk_level?: EvidenceBasedSeverity | string;
  confidence?: EvidenceBasedConfidence | string;
  verification_status?: EvidenceBasedVerificationStatus | string;
  evidence_type?: EvidenceBasedEvidenceType | string;
  evidence?: string;
  source_url?: string;
  root_cause?: string;
  manual_review_status?: "approved" | "rejected" | "pending" | string;
};

export type EvidenceScoreCategory =
  | "website_security"
  | "customer_data_security"
  | "dpdp_readiness"
  | "cert_in_readiness"
  | "domain_trust"
  | "business_attestation"
  | "scan_quality";

export type EvidenceQualityBand =
  | "manual_review_grade"
  | "verified_scan_grade"
  | "mixed_evidence_grade"
  | "advisory_grade"
  | "insufficient_evidence";

export type EvidenceBasedScoringResult = {
  overall: number;
  qualityBand: EvidenceQualityBand;
  confidenceLabel: string;
  categoryScores: Record<EvidenceScoreCategory, number>;
  evidenceCounts: {
    total: number;
    manualReviewed: number;
    verifiedByScan: number;
    likelySignals: number;
    needsConfirmation: number;
    notVisible: number;
    selfAttestation: number;
    highConfidence: number;
    mediumConfidence: number;
    lowConfidence: number;
  };
  penaltySummary: {
    rawPenalty: number;
    evidenceAdjustedPenalty: number;
    reductionFromWeakEvidence: number;
  };
  topEvidenceStrengths: string[];
  topEvidenceLimitations: string[];
  scoringNotes: string[];
};

const CATEGORY_LIST: EvidenceScoreCategory[] = [
  "website_security",
  "customer_data_security",
  "dpdp_readiness",
  "cert_in_readiness",
  "domain_trust",
  "business_attestation",
  "scan_quality",
];

function text(value: unknown) {
  return String(value || "").trim().toLowerCase();
}

function clampScore(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function normalizeSeverity(value: unknown): EvidenceBasedSeverity {
  const normalized = text(value);

  if (normalized === "critical") return "critical";
  if (normalized === "high") return "high";
  if (normalized === "medium") return "medium";
  if (normalized === "low") return "low";
  return "info";
}

function severityPenalty(severity: EvidenceBasedSeverity) {
  const penalties: Record<EvidenceBasedSeverity, number> = {
    critical: 26,
    high: 18,
    medium: 10,
    low: 5,
    info: 1.5,
  };

  return penalties[severity];
}

function normalizeConfidence(value: unknown): EvidenceBasedConfidence {
  const normalized = text(value);

  if (normalized === "high") return "high";
  if (normalized === "medium") return "medium";
  return "low";
}

function normalizeVerificationStatus(value: unknown, manualReviewStatus?: unknown): EvidenceBasedVerificationStatus {
  if (text(manualReviewStatus) === "approved") return "manual_reviewed";

  const normalized = text(value);

  if (normalized === "manual_reviewed") return "manual_reviewed";
  if (normalized === "verified_by_scan") return "verified_by_scan";
  if (normalized === "likely_signal") return "likely_signal";
  if (normalized === "needs_confirmation") return "needs_confirmation";
  if (normalized === "not_visible") return "not_visible";

  return "needs_confirmation";
}

function normalizeEvidenceType(value: unknown): EvidenceBasedEvidenceType {
  const normalized = text(value);

  const allowed: EvidenceBasedEvidenceType[] = [
    "manual_review",
    "response_header",
    "set_cookie",
    "html_signal",
    "crawler_page",
    "well_known_file",
    "technology_signal",
    "known_risk_advisory",
    "http_probe",
    "self_attestation",
    "scan_quality",
    "unknown",
  ];

  return allowed.includes(normalized as EvidenceBasedEvidenceType)
    ? (normalized as EvidenceBasedEvidenceType)
    : "unknown";
}

function categoryForFinding(finding: EvidenceScorableFinding): EvidenceScoreCategory {
  const category = text(finding.category);
  const rootCause = text(finding.root_cause);
  const id = text(finding.id);
  const title = text(finding.title);

  const joined = `${category} ${rootCause} ${id} ${title}`;

  if (joined.includes("dpdp") || joined.includes("privacy") || joined.includes("consent")) {
    return "dpdp_readiness";
  }

  if (joined.includes("cert_in") || joined.includes("incident") || joined.includes("log")) {
    return "cert_in_readiness";
  }

  if (joined.includes("customer_data") || joined.includes("form") || joined.includes("cookie")) {
    return "customer_data_security";
  }

  if (joined.includes("dns") || joined.includes("tls") || joined.includes("certificate") || joined.includes("domain")) {
    return "domain_trust";
  }

  if (joined.includes("self_attestation") || joined.includes("vendor") || joined.includes("retention") || joined.includes("access_control")) {
    return "business_attestation";
  }

  if (joined.includes("scan_quality") || joined.includes("quality")) {
    return "scan_quality";
  }

  return "website_security";
}

function evidenceMultiplier(
  verificationStatus: EvidenceBasedVerificationStatus,
  confidence: EvidenceBasedConfidence,
  evidenceType: EvidenceBasedEvidenceType
) {
  if (verificationStatus === "manual_reviewed") return 1;

  if (verificationStatus === "verified_by_scan") {
    if (confidence === "high") return 0.95;
    if (confidence === "medium") return 0.82;
    return 0.65;
  }

  if (evidenceType === "self_attestation") {
    if (confidence === "high") return 0.72;
    if (confidence === "medium") return 0.6;
    return 0.45;
  }

  if (verificationStatus === "likely_signal") {
    if (confidence === "high") return 0.62;
    if (confidence === "medium") return 0.5;
    return 0.38;
  }

  if (verificationStatus === "needs_confirmation") {
    if (confidence === "high") return 0.45;
    if (confidence === "medium") return 0.32;
    return 0.22;
  }

  if (verificationStatus === "not_visible") {
    return 0.12;
  }

  return 0.3;
}

function categoryWeight(category: EvidenceScoreCategory) {
  const weights: Record<EvidenceScoreCategory, number> = {
    website_security: 1,
    customer_data_security: 1.25,
    dpdp_readiness: 1.2,
    cert_in_readiness: 1,
    domain_trust: 0.95,
    business_attestation: 0.85,
    scan_quality: 0.7,
  };

  return weights[category];
}

function qualityBand(counts: EvidenceBasedScoringResult["evidenceCounts"]): EvidenceQualityBand {
  if (counts.total === 0) return "insufficient_evidence";

  const manualRatio = counts.manualReviewed / counts.total;
  const verifiedRatio = (counts.manualReviewed + counts.verifiedByScan) / counts.total;
  const weakRatio = (counts.likelySignals + counts.needsConfirmation + counts.notVisible) / counts.total;

  if (manualRatio >= 0.6) return "manual_review_grade";
  if (verifiedRatio >= 0.7) return "verified_scan_grade";
  if (weakRatio <= 0.5) return "mixed_evidence_grade";
  if (counts.likelySignals > 0 || counts.needsConfirmation > 0) return "advisory_grade";

  return "insufficient_evidence";
}

function confidenceLabel(band: EvidenceQualityBand) {
  const labels: Record<EvidenceQualityBand, string> = {
    manual_review_grade: "Manual-review grade evidence",
    verified_scan_grade: "Verified scan evidence",
    mixed_evidence_grade: "Mixed verified and advisory evidence",
    advisory_grade: "Advisory evidence only",
    insufficient_evidence: "Insufficient evidence",
  };

  return labels[band];
}

function initializeCategoryPenalties() {
  return CATEGORY_LIST.reduce((acc, category) => {
    acc[category] = 0;
    return acc;
  }, {} as Record<EvidenceScoreCategory, number>);
}

export function calculateEvidenceBasedScoring(findings: EvidenceScorableFinding[]): EvidenceBasedScoringResult {
  const safeFindings = Array.isArray(findings) ? findings : [];

  const counts: EvidenceBasedScoringResult["evidenceCounts"] = {
    total: safeFindings.length,
    manualReviewed: 0,
    verifiedByScan: 0,
    likelySignals: 0,
    needsConfirmation: 0,
    notVisible: 0,
    selfAttestation: 0,
    highConfidence: 0,
    mediumConfidence: 0,
    lowConfidence: 0,
  };

  const categoryPenalties = initializeCategoryPenalties();

  let rawPenalty = 0;
  let evidenceAdjustedPenalty = 0;

  for (const finding of safeFindings) {
    const severity = normalizeSeverity(finding.severity || finding.risk_level);
    const confidence = normalizeConfidence(finding.confidence);
    const verificationStatus = normalizeVerificationStatus(finding.verification_status, finding.manual_review_status);
    const evidenceType = normalizeEvidenceType(finding.evidence_type);
    const category = categoryForFinding(finding);

    if (verificationStatus === "manual_reviewed") counts.manualReviewed += 1;
    if (verificationStatus === "verified_by_scan") counts.verifiedByScan += 1;
    if (verificationStatus === "likely_signal") counts.likelySignals += 1;
    if (verificationStatus === "needs_confirmation") counts.needsConfirmation += 1;
    if (verificationStatus === "not_visible") counts.notVisible += 1;

    if (evidenceType === "self_attestation") counts.selfAttestation += 1;

    if (confidence === "high") counts.highConfidence += 1;
    if (confidence === "medium") counts.mediumConfidence += 1;
    if (confidence === "low") counts.lowConfidence += 1;

    const basePenalty = severityPenalty(severity);
    const multiplier = evidenceMultiplier(verificationStatus, confidence, evidenceType);
    const weightedPenalty = basePenalty * multiplier * categoryWeight(category);

    rawPenalty += basePenalty;
    evidenceAdjustedPenalty += weightedPenalty;
    categoryPenalties[category] += weightedPenalty;
  }

  const categoryScores = CATEGORY_LIST.reduce((acc, category) => {
    acc[category] = clampScore(100 - categoryPenalties[category]);
    return acc;
  }, {} as Record<EvidenceScoreCategory, number>);

  const overall = clampScore(
    CATEGORY_LIST.reduce((sum, category) => sum + categoryScores[category], 0) / CATEGORY_LIST.length
  );

  const band = qualityBand(counts);

  const topEvidenceStrengths: string[] = [];
  const topEvidenceLimitations: string[] = [];
  const scoringNotes: string[] = [];

  if (counts.manualReviewed > 0) topEvidenceStrengths.push("Manual-reviewed findings carry the highest evidence confidence.");
  if (counts.verifiedByScan > 0) topEvidenceStrengths.push("Verified scan evidence is weighted strongly.");
  if (counts.selfAttestation > 0) topEvidenceStrengths.push("Business self-attestation is included but treated as medium-confidence evidence.");

  if (counts.needsConfirmation > 0) topEvidenceLimitations.push("Some findings need business confirmation or manual review.");
  if (counts.likelySignals > 0) topEvidenceLimitations.push("Likely-signal findings are not treated as fully verified.");
  if (counts.notVisible > 0) topEvidenceLimitations.push("Not-visible items do not automatically fail the business; they create light evidence gaps.");

  scoringNotes.push("Evidence-based scoring reduces penalties for weak or unverified signals.");
  scoringNotes.push("Verified scan evidence is stronger than advisory evidence.");
  scoringNotes.push("Self-attestation improves readiness context but does not replace manual review.");
  scoringNotes.push("This score is readiness evidence, not legal certification or penetration-test proof.");

  return {
    overall,
    qualityBand: band,
    confidenceLabel: confidenceLabel(band),
    categoryScores,
    evidenceCounts: counts,
    penaltySummary: {
      rawPenalty: Math.round(rawPenalty),
      evidenceAdjustedPenalty: Math.round(evidenceAdjustedPenalty),
      reductionFromWeakEvidence: Math.max(0, Math.round(rawPenalty - evidenceAdjustedPenalty)),
    },
    topEvidenceStrengths,
    topEvidenceLimitations,
    scoringNotes,
  };
}

export function attachEvidenceBasedScoring<T extends object>(
  reportLike: T,
  findings: EvidenceScorableFinding[]
): T & { evidence_based_scoring: EvidenceBasedScoringResult } {
  return {
    ...reportLike,
    evidence_based_scoring: calculateEvidenceBasedScoring(findings),
  };
}