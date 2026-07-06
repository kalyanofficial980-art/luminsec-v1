import { enrichPassiveFinding, rootCauseForFinding } from "./accuracy-foundation";

type Severity = "info" | "low" | "medium" | "high" | "critical";
type Confidence = "high" | "medium" | "low";

type GuardableFinding = {
  id: string;
  title: string;
  description: string;
  category: string;
  severity: Severity;
  risk_level: Severity;
  evidence: string;
  recommendation: string;
  confidence?: Confidence;
  verification_status?: string;
  evidence_type?: string;
  source_url?: string;
  observed_value?: string;
  expected_value?: string;
  limitation?: string;
  root_cause?: string;
  original_severity?: Severity;
  guard_notes?: string[];
  false_positive_guard_applied?: boolean;
  duplicate_count?: number;
  merged_evidence_samples?: string[];
};

const SEVERITY_RANK: Record<Severity, number> = {
  info: 0,
  low: 1,
  medium: 2,
  high: 3,
  critical: 4,
};

const CONFIDENCE_RANK: Record<Confidence, number> = {
  low: 0,
  medium: 1,
  high: 2,
};

const ROOT_CAUSE_TITLES: Record<string, string> = {
  https_transport: "HTTPS transport needs hardening",
  content_security_policy: "Content Security Policy needs review",
  clickjacking_headers: "Clickjacking protection needs review",
  content_type_header: "Content type protection needs review",
  referrer_policy: "Referrer privacy policy needs review",
  permissions_policy: "Browser permissions policy needs review",
  security_txt: "Security contact file needs review",
  privacy_policy: "Privacy policy signal needs review",
  contact_grievance: "Contact or grievance signal needs review",
  consent_purpose: "Consent and purpose signal needs review",
  data_request_deletion: "Data request process needs review",
  breach_readiness: "Breach readiness needs confirmation",
  cert_incident_reporting: "Incident reporting readiness needs confirmation",
  log_retention: "Log retention readiness needs confirmation",
  security_contact: "Security contact readiness needs confirmation",
  backup_restore: "Backup and recovery readiness needs confirmation",
  forms_customer_data: "Customer-data collection points need review",
  password_fields: "Password or login fields need review",
  cookie_security: "Cookie security needs hardening",
  payment_scripts: "Payment script usage needs review",
  tracking_scripts: "Tracking script usage needs review",
  third_party_scripts: "Third-party scripts need review",
  mixed_content: "Mixed content needs fixing",
  technology_review: "Technology exposure needs review",
  page_metadata: "Public page metadata needs review",
  public_page_error: "Public page availability needs review",
};

function lower(value: unknown) {
  return String(value || "").toLowerCase();
}

function normalizedSeverity(value: unknown): Severity {
  const clean = lower(value);

  if (clean === "critical") return "critical";
  if (clean === "high") return "high";
  if (clean === "medium") return "medium";
  if (clean === "low") return "low";

  return "info";
}

function normalizedConfidence(value: unknown): Confidence {
  const clean = lower(value);

  if (clean === "high") return "high";
  if (clean === "low") return "low";

  return "medium";
}

function evidenceSample(finding: GuardableFinding) {
  const value = String(finding.observed_value || finding.evidence || finding.description || finding.title || "")
    .replace(/\s+/g, " ")
    .trim();

  return value.length > 220 ? `${value.slice(0, 220)}...` : value;
}

function hasCustomerDataCollectionSignal(findings: GuardableFinding[]) {
  return findings.some((finding) => {
    const haystack = lower(
      `${finding.id} ${finding.title} ${finding.category} ${finding.description} ${finding.evidence} ${finding.root_cause}`
    );

    return /form|lead|booking|appointment|checkout|payment|razorpay|stripe|paypal|password|login|cookie|tracking|analytics|tag manager|customer data|student|patient|phone|email/.test(
      haystack
    );
  });
}

function addGuardNote<T extends GuardableFinding>(finding: T, note: string): T {
  const notes = Array.isArray(finding.guard_notes) ? finding.guard_notes : [];

  if (notes.includes(note)) {
    return finding;
  }

  return {
    ...finding,
    guard_notes: [...notes, note],
    false_positive_guard_applied: true,
  };
}

function capSeverity<T extends GuardableFinding>(finding: T, maxSeverity: Severity, note: string): T {
  const currentSeverity = normalizedSeverity(finding.severity);

  if (SEVERITY_RANK[currentSeverity] <= SEVERITY_RANK[maxSeverity]) {
    return addGuardNote(finding, note);
  }

  return {
    ...finding,
    original_severity: finding.original_severity || currentSeverity,
    severity: maxSeverity,
    risk_level: maxSeverity,
    guard_notes: [...(finding.guard_notes || []), note],
    false_positive_guard_applied: true,
  };
}

function applySingleFindingGuard<T extends GuardableFinding>(
  finding: T,
  context: { hasCustomerDataSignal: boolean }
): T {
  let guarded = {
    ...finding,
    severity: normalizedSeverity(finding.severity),
    risk_level: normalizedSeverity(finding.risk_level || finding.severity),
    confidence: normalizedConfidence(finding.confidence),
    root_cause: finding.root_cause || rootCauseForFinding(finding),
  } as T;

  const haystack = lower(
    `${guarded.id} ${guarded.title} ${guarded.category} ${guarded.description} ${guarded.evidence} ${guarded.recommendation} ${guarded.evidence_type} ${guarded.verification_status}`
  );

  if (guarded.verification_status === "needs_confirmation") {
    guarded = capSeverity(
      guarded,
      "low",
      "Needs-confirmation items are not treated as verified failures until business/developer confirmation."
    );
  }

  if (guarded.confidence === "low") {
    guarded = capSeverity(
      guarded,
      "low",
      "Low-confidence signals are capped to reduce false-positive risk."
    );
  }

  if (guarded.evidence_type === "technology_signal") {
    guarded = capSeverity(
      guarded,
      "low",
      "Technology detection is advisory and should not be treated as a confirmed vulnerability."
    );
  }

  if (guarded.evidence_type === "known_risk_advisory" || /known risk|advisory|potential|review recommended/.test(haystack)) {
    guarded = capSeverity(
      guarded,
      "low",
      "Known-risk intelligence is advisory unless manually confirmed with stronger evidence."
    );
  }

  if (/missing_robots_txt|missing_sitemap_xml/.test(guarded.id)) {
    guarded = capSeverity(
      guarded,
      "info",
      "robots.txt and sitemap.xml are hygiene signals, not direct security failures."
    );
  }

  if (/missing_contact_trust/.test(guarded.id)) {
    guarded = capSeverity(
      guarded,
      "info",
      "Missing contact signal is a trust issue, not a direct technical vulnerability."
    );
  }

  if (/missing_privacy_policy/.test(guarded.id) && !context.hasCustomerDataSignal) {
    guarded = capSeverity(
      guarded,
      "low",
      "Privacy-policy absence is less severe when no customer-data collection signal was observed."
    );
  }

  if (/high_external_script_count/.test(guarded.id)) {
    guarded = capSeverity(
      guarded,
      "low",
      "High script count is an attack-surface signal, not a confirmed vulnerability."
    );
  }

  return guarded;
}

function betterFinding<T extends GuardableFinding>(current: T, candidate: T) {
  const severityDiff =
    SEVERITY_RANK[normalizedSeverity(candidate.severity)] -
    SEVERITY_RANK[normalizedSeverity(current.severity)];

  if (severityDiff > 0) return candidate;
  if (severityDiff < 0) return current;

  const confidenceDiff =
    CONFIDENCE_RANK[normalizedConfidence(candidate.confidence)] -
    CONFIDENCE_RANK[normalizedConfidence(current.confidence)];

  if (confidenceDiff > 0) return candidate;

  return current;
}

function mergeRootCauseDuplicates<T extends GuardableFinding>(findings: T[]) {
  const groups = new Map<string, T>();

  for (const finding of findings) {
    const rootCause = finding.root_cause || rootCauseForFinding(finding);
    const key = `${rootCause}`;
    const sample = evidenceSample(finding);

    const existing = groups.get(key);

    if (!existing) {
      groups.set(key, {
        ...finding,
        root_cause: rootCause,
        title: ROOT_CAUSE_TITLES[rootCause] || finding.title,
        duplicate_count: 1,
        merged_evidence_samples: sample ? [sample] : [],
      });
      continue;
    }

    const winner = betterFinding(existing, finding);
    const loser = winner === existing ? finding : existing;

    const mergedSamples = [
      ...(existing.merged_evidence_samples || []),
      ...(finding.merged_evidence_samples || []),
      sample,
      evidenceSample(loser),
    ]
      .filter(Boolean)
      .filter((value, index, array) => array.indexOf(value) === index)
      .slice(0, 5);

    const mergedNotes = [
      ...(existing.guard_notes || []),
      ...(finding.guard_notes || []),
      "Multiple raw findings were grouped into one root-cause item to reduce duplicate report noise.",
    ].filter((value, index, array) => array.indexOf(value) === index);

    groups.set(key, {
      ...winner,
      root_cause: rootCause,
      title: ROOT_CAUSE_TITLES[rootCause] || winner.title,
      duplicate_count: (existing.duplicate_count || 1) + 1,
      merged_evidence_samples: mergedSamples,
      guard_notes: mergedNotes,
      false_positive_guard_applied: true,
    });
  }

  return [...groups.values()];
}

export function applyFalsePositiveGuard<T extends GuardableFinding>(findings: T[]): T[] {
  const safeFindings = Array.isArray(findings) ? findings : [];
  const enrichedFindings = safeFindings.map((finding) => enrichPassiveFinding(finding) as T);
  const context = {
    hasCustomerDataSignal: hasCustomerDataCollectionSignal(enrichedFindings),
  };

  const guardedFindings = enrichedFindings.map((finding) => applySingleFindingGuard(finding, context));

  return mergeRootCauseDuplicates(guardedFindings).sort((a, b) => {
    const severityDiff = SEVERITY_RANK[normalizedSeverity(b.severity)] - SEVERITY_RANK[normalizedSeverity(a.severity)];

    if (severityDiff !== 0) {
      return severityDiff;
    }

    return CONFIDENCE_RANK[normalizedConfidence(b.confidence)] - CONFIDENCE_RANK[normalizedConfidence(a.confidence)];
  });
}