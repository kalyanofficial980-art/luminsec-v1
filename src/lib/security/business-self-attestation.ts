export type SelfAttestationSeverity =
  "info" | "low" | "medium" | "high" | "critical";

export type SelfAttestationCategory =
  | "customer_data"
  | "dpdp_readiness"
  | "cert_in_readiness"
  | "access_control"
  | "vendor_risk"
  | "incident_readiness"
  | "data_retention";

export type SelfAttestationAnswerValue =
  "yes" | "partial" | "no" | "unknown" | "not_applicable";

export type BusinessSelfAttestationQuestion = {
  id: string;
  category: SelfAttestationCategory;
  label: string;
  helpText: string;
  weight: number;
  required: boolean;
  allowNotApplicable?: boolean;
  riskWhenNo: SelfAttestationSeverity;
  evidenceExpectation: string;
};

export type BusinessSelfAttestationAnswer = {
  questionId: string;
  value: SelfAttestationAnswerValue | boolean | string;
  note?: string;
  evidenceUrl?: string;
  updatedAt?: string;
};

export type BusinessSelfAttestationInput = {
  businessName?: string;
  websiteUrl?: string;
  answeredBy?: string;
  answers:
    | BusinessSelfAttestationAnswer[]
    | Record<string, SelfAttestationAnswerValue | boolean | string>;
};

export type BusinessSelfAttestationFinding = {
  id: string;
  title: string;
  description: string;
  category: SelfAttestationCategory;
  severity: SelfAttestationSeverity;
  risk_level: SelfAttestationSeverity;
  evidence: string;
  recommendation: string;
  confidence: "medium" | "low";
  verification_status: "needs_confirmation" | "likely_signal";
  evidence_type: "self_attestation";
  source_url?: string;
  observed_value: string;
  expected_value: string;
  limitation: string;
  root_cause: string;
};

export type BusinessSelfAttestationScore = {
  overall: number;
  categories: Record<SelfAttestationCategory, number>;
  answeredRequired: number;
  totalRequired: number;
  missingRequiredQuestionIds: string[];
  findings: BusinessSelfAttestationFinding[];
};

export const BUSINESS_SELF_ATTESTATION_QUESTIONS: BusinessSelfAttestationQuestion[] =
  [
    {
      id: "data_inventory_exists",
      category: "customer_data",
      label: "Customer-data inventory exists",
      helpText:
        "Business knows what personal/customer data is collected through website, forms, payments, bookings, and support.",
      weight: 10,
      required: true,
      riskWhenNo: "medium",
      evidenceExpectation: "List of collected fields and collection points.",
    },
    {
      id: "privacy_notice_available",
      category: "dpdp_readiness",
      label: "Privacy notice is available",
      helpText:
        "Website has a privacy notice/policy explaining what data is collected and why.",
      weight: 10,
      required: true,
      riskWhenNo: "medium",
      evidenceExpectation: "Privacy policy URL or page reference.",
    },
    {
      id: "purpose_explained",
      category: "dpdp_readiness",
      label: "Purpose of data collection is explained",
      helpText:
        "Customers can understand why their data is collected before or around data collection points.",
      weight: 8,
      required: true,
      riskWhenNo: "medium",
      evidenceExpectation: "Purpose wording near forms or privacy notice.",
    },
    {
      id: "consent_or_notice_flow",
      category: "dpdp_readiness",
      label: "Consent or notice flow exists where needed",
      helpText:
        "Important forms, marketing, tracking, or sensitive collection have clear notice/consent wording.",
      weight: 8,
      required: true,
      riskWhenNo: "medium",
      evidenceExpectation: "Consent text, checkbox, or notice process.",
    },
    {
      id: "grievance_contact_available",
      category: "dpdp_readiness",
      label: "Privacy/grievance contact is available",
      helpText:
        "Customers have a clear contact path for privacy, correction, deletion, or complaint requests.",
      weight: 8,
      required: true,
      riskWhenNo: "medium",
      evidenceExpectation:
        "Email, contact page, grievance contact, or support path.",
    },
    {
      id: "retention_policy_defined",
      category: "data_retention",
      label: "Data retention rules are defined",
      helpText:
        "Business knows how long customer data is retained and when it is deleted.",
      weight: 7,
      required: true,
      riskWhenNo: "medium",
      evidenceExpectation: "Retention note or deletion rule.",
    },
    {
      id: "customer_request_process",
      category: "dpdp_readiness",
      label: "Customer data request process exists",
      helpText:
        "Business can handle customer requests for correction, access, deletion, or withdrawal where applicable.",
      weight: 7,
      required: true,
      riskWhenNo: "medium",
      evidenceExpectation: "Internal process or support workflow.",
    },
    {
      id: "admin_access_limited",
      category: "access_control",
      label: "Admin access is limited",
      helpText:
        "Only required staff can access customer data, admin dashboards, CRM, billing, or orders.",
      weight: 8,
      required: true,
      riskWhenNo: "high",
      evidenceExpectation: "Admin list or access-control rule.",
    },
    {
      id: "mfa_for_admins",
      category: "access_control",
      label: "MFA is enabled for admin accounts",
      helpText:
        "Admin email, hosting, database, payment, CRM, and CMS accounts use MFA where possible.",
      weight: 8,
      required: true,
      riskWhenNo: "high",
      evidenceExpectation: "MFA status for admin systems.",
    },
    {
      id: "vendor_processor_list",
      category: "vendor_risk",
      label: "Vendor/processor list exists",
      helpText:
        "Business knows third parties receiving customer data, such as hosting, analytics, payments, CRM, email, or WhatsApp tools.",
      weight: 7,
      required: true,
      riskWhenNo: "medium",
      evidenceExpectation: "List of vendors and purpose.",
    },
    {
      id: "incident_response_owner",
      category: "incident_readiness",
      label: "Incident response owner is assigned",
      helpText:
        "Business knows who handles suspected data leaks, website compromise, or security incidents.",
      weight: 8,
      required: true,
      riskWhenNo: "high",
      evidenceExpectation: "Owner name/role and escalation contact.",
    },
    {
      id: "incident_reporting_process",
      category: "cert_in_readiness",
      label: "Incident reporting process exists",
      helpText:
        "Business has a basic process for identifying, recording, escalating, and reporting security incidents where required.",
      weight: 8,
      required: true,
      riskWhenNo: "high",
      evidenceExpectation: "Incident checklist or reporting SOP.",
    },
    {
      id: "logs_available",
      category: "cert_in_readiness",
      label: "Security/application logs are available",
      helpText:
        "Business can access hosting, application, auth, payment, or admin activity logs for investigation.",
      weight: 7,
      required: true,
      riskWhenNo: "medium",
      evidenceExpectation: "Log sources and retention location.",
    },
    {
      id: "backup_and_restore_process",
      category: "incident_readiness",
      label: "Backup and restore process exists",
      helpText:
        "Business can recover website, database, orders, or CRM data after failure or compromise.",
      weight: 7,
      required: true,
      riskWhenNo: "medium",
      evidenceExpectation: "Backup frequency and restore owner.",
    },
  ];

const CATEGORY_ORDER: SelfAttestationCategory[] = [
  "customer_data",
  "dpdp_readiness",
  "cert_in_readiness",
  "access_control",
  "vendor_risk",
  "incident_readiness",
  "data_retention",
];

function normalizeAnswer(
  value: unknown,
  allowNotApplicable?: boolean,
): SelfAttestationAnswerValue {
  if (typeof value === "boolean") return value ? "yes" : "no";

  const normalized = String(value || "")
    .trim()
    .toLowerCase();

  if (["yes", "y", "true", "done", "available"].includes(normalized))
    return "yes";
  if (
    ["partial", "partly", "in_progress", "progress", "some"].includes(
      normalized,
    )
  )
    return "partial";
  if (["no", "n", "false", "missing", "not_done"].includes(normalized))
    return "no";
  if (["unknown", "not sure", "na", ""].includes(normalized)) return "unknown";
  if (
    allowNotApplicable &&
    ["not_applicable", "not applicable", "n/a"].includes(normalized)
  )
    return "not_applicable";

  return "unknown";
}

function answerScore(
  value: SelfAttestationAnswerValue,
  allowNotApplicable?: boolean,
) {
  if (value === "yes") return 1;
  if (value === "partial") return 0.5;
  if (value === "not_applicable" && allowNotApplicable) return 1;
  return 0;
}

function severityForAnswer(
  question: BusinessSelfAttestationQuestion,
  value: SelfAttestationAnswerValue,
): SelfAttestationSeverity {
  if (value === "partial")
    return question.riskWhenNo === "high" ? "medium" : "low";
  if (value === "unknown") return "low";
  if (value === "not_applicable") return "info";
  return question.riskWhenNo;
}

function normalizeAnswers(input: BusinessSelfAttestationInput) {
  const map = new Map<string, BusinessSelfAttestationAnswer>();

  if (Array.isArray(input.answers)) {
    for (const answer of input.answers) {
      if (answer?.questionId) map.set(answer.questionId, answer);
    }

    return map;
  }

  for (const [questionId, value] of Object.entries(input.answers || {})) {
    map.set(questionId, { questionId, value });
  }

  return map;
}

function evidenceForQuestion(
  input: BusinessSelfAttestationInput,
  question: BusinessSelfAttestationQuestion,
  answerValue: SelfAttestationAnswerValue,
  answer?: BusinessSelfAttestationAnswer,
) {
  return [
    `Business: ${input.businessName || "not provided"}`,
    `Website: ${input.websiteUrl || "not provided"}`,
    `Question: ${question.label}`,
    `Self-attested answer: ${answerValue}`,
    answer?.note ? `Business note: ${answer.note}` : "",
    answer?.evidenceUrl ? `Evidence URL/reference: ${answer.evidenceUrl}` : "",
    answer?.updatedAt ? `Answer updated at: ${answer.updatedAt}` : "",
    `Expected evidence: ${question.evidenceExpectation}`,
    "Limitation: This is business self-attestation. It requires review or evidence upload before being treated as verified.",
  ]
    .filter(Boolean)
    .join("\n");
}

function findingForQuestion(
  input: BusinessSelfAttestationInput,
  question: BusinessSelfAttestationQuestion,
  answerValue: SelfAttestationAnswerValue,
  answer?: BusinessSelfAttestationAnswer,
): BusinessSelfAttestationFinding {
  return {
    id: `self_attestation_${question.id}_${answerValue}`,
    title: `Business self-attestation gap: ${question.label}`,
    description: question.helpText,
    category: question.category,
    severity: severityForAnswer(question, answerValue),
    risk_level: severityForAnswer(question, answerValue),
    evidence: evidenceForQuestion(input, question, answerValue, answer),
    recommendation: `Prepare or improve evidence for: ${question.evidenceExpectation}`,
    confidence: answerValue === "unknown" ? "low" : "medium",
    verification_status: "needs_confirmation",
    evidence_type: "self_attestation",
    source_url: input.websiteUrl,
    observed_value: answerValue,
    expected_value: "yes",
    limitation:
      "Self-attested answer only. Manual review is required for verified paid reports.",
    root_cause: `self_attestation_${question.category}`,
  };
}

function emptyCategoryTotals() {
  const totals: Record<
    SelfAttestationCategory,
    { earned: number; possible: number }
  > = {
    customer_data: { earned: 0, possible: 0 },
    dpdp_readiness: { earned: 0, possible: 0 },
    cert_in_readiness: { earned: 0, possible: 0 },
    access_control: { earned: 0, possible: 0 },
    vendor_risk: { earned: 0, possible: 0 },
    incident_readiness: { earned: 0, possible: 0 },
    data_retention: { earned: 0, possible: 0 },
  };

  return totals;
}

function percent(earned: number, possible: number) {
  if (possible <= 0) return 100;
  return Math.max(0, Math.min(100, Math.round((earned / possible) * 100)));
}

export function evaluateBusinessSelfAttestation(
  input: BusinessSelfAttestationInput,
): BusinessSelfAttestationScore {
  const answers = normalizeAnswers(input);
  const categoryTotals = emptyCategoryTotals();
  const findings: BusinessSelfAttestationFinding[] = [];
  const missingRequiredQuestionIds: string[] = [];

  let totalEarned = 0;
  let totalPossible = 0;
  let answeredRequired = 0;
  let totalRequired = 0;

  for (const question of BUSINESS_SELF_ATTESTATION_QUESTIONS) {
    const answer = answers.get(question.id);
    const normalizedValue = normalizeAnswer(
      answer?.value,
      question.allowNotApplicable,
    );
    const score = answerScore(normalizedValue, question.allowNotApplicable);
    const earned = score * question.weight;

    totalPossible += question.weight;
    totalEarned += earned;

    categoryTotals[question.category].possible += question.weight;
    categoryTotals[question.category].earned += earned;

    if (question.required) {
      totalRequired += 1;

      if (!answer || normalizedValue === "unknown") {
        missingRequiredQuestionIds.push(question.id);
      } else {
        answeredRequired += 1;
      }
    }

    if (
      normalizedValue === "partial" ||
      normalizedValue === "no" ||
      normalizedValue === "unknown"
    ) {
      findings.push(
        findingForQuestion(input, question, normalizedValue, answer),
      );
    }
  }

  const categories = CATEGORY_ORDER.reduce(
    (acc, category) => {
      acc[category] = percent(
        categoryTotals[category].earned,
        categoryTotals[category].possible,
      );
      return acc;
    },
    {} as Record<SelfAttestationCategory, number>,
  );

  return {
    overall: percent(totalEarned, totalPossible),
    categories,
    answeredRequired,
    totalRequired,
    missingRequiredQuestionIds,
    findings,
  };
}

export function businessSelfAttestationQuestionnaire() {
  return BUSINESS_SELF_ATTESTATION_QUESTIONS;
}

export function businessSelfAttestationIsComplete(
  input: BusinessSelfAttestationInput,
) {
  return (
    evaluateBusinessSelfAttestation(input).missingRequiredQuestionIds.length ===
    0
  );
}
