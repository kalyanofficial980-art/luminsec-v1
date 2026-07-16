export type PrivacyNearFormSeverity =
  "info" | "low" | "medium" | "high" | "critical";

export type PrivacyNearFormFinding = {
  id: string;
  title: string;
  description: string;
  category: string;
  severity: PrivacyNearFormSeverity;
  risk_level: PrivacyNearFormSeverity;
  evidence: string;
  recommendation: string;
  confidence?: "high" | "medium" | "low";
  verification_status?:
    "verified_by_scan" | "likely_signal" | "needs_confirmation" | "not_visible";
  evidence_type?: "html_signal" | "crawler_page" | "scan_quality" | "unknown";
  source_url?: string;
  observed_value?: string;
  expected_value?: string;
  limitation?: string;
  root_cause?: string;
};

type PrivacyNearFormInput = {
  html: string;
  pageUrl?: string;
};

function cleanHtml(value: string) {
  return String(value || "")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/\s+/g, " ")
    .slice(0, 250000);
}

function stripTags(value: string) {
  return value
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function extractFormBlocks(html: string) {
  const cleaned = cleanHtml(html);
  const blocks: Array<{ formHtml: string; nearbyHtml: string }> = [];
  const formRegex = /<form\b[\s\S]*?<\/form>/gi;
  let match: RegExpExecArray | null;

  while ((match = formRegex.exec(cleaned)) !== null && blocks.length < 12) {
    const formHtml = match[0] || "";
    const start = Math.max(0, match.index - 2500);
    const end = Math.min(cleaned.length, match.index + formHtml.length + 2500);

    blocks.push({
      formHtml,
      nearbyHtml: cleaned.slice(start, end),
    });
  }

  if (blocks.length > 0) return blocks;

  const fieldCount = (cleaned.match(/<(input|textarea|select)\b/gi) || [])
    .length;

  if (fieldCount >= 2) {
    return [{ formHtml: cleaned, nearbyHtml: cleaned.slice(0, 8000) }];
  }

  return [];
}

function fieldSignals(formHtml: string) {
  const signals: string[] = [];
  const fieldRegex = /<(input|textarea|select)\b[\s\S]*?>/gi;
  let match: RegExpExecArray | null;

  while ((match = fieldRegex.exec(formHtml)) !== null) {
    const tag = match[0] || "";
    const attrs = Array.from(
      tag.matchAll(
        /\b(type|name|id|placeholder|aria-label|autocomplete)\s*=\s*["']?([^"'\s>]+)/gi,
      ),
    ).map((item) => item[2]);

    signals.push(...attrs);
  }

  return Array.from(new Set(signals.map((item) => item.toLowerCase()))).slice(
    0,
    30,
  );
}

function hasAny(text: string, words: string[]) {
  return words.some((word) => text.includes(word));
}

function dataSignalsForForm(formHtml: string) {
  const signals = fieldSignals(formHtml);
  const text = `${stripTags(formHtml)} ${signals.join(" ")}`.toLowerCase();
  const categories: string[] = [];

  if (hasAny(text, ["name", "fullname", "first-name", "last-name"]))
    categories.push("name");
  if (hasAny(text, ["email", "e-mail"])) categories.push("email");
  if (hasAny(text, ["phone", "mobile", "whatsapp", "telephone"]))
    categories.push("phone/mobile");
  if (
    hasAny(text, ["address", "city", "state", "pincode", "shipping", "billing"])
  )
    categories.push("address/location");
  if (hasAny(text, ["message", "query", "enquiry", "inquiry", "comment"]))
    categories.push("message/enquiry");
  if (
    hasAny(text, ["appointment", "booking", "schedule", "consultation", "slot"])
  )
    categories.push("appointment/booking");
  if (
    hasAny(text, [
      "student",
      "admission",
      "class",
      "course",
      "school",
      "college",
      "parent",
      "guardian",
    ])
  )
    categories.push("student/admission");
  if (
    hasAny(text, [
      "patient",
      "doctor",
      "clinic",
      "hospital",
      "medical",
      "health",
      "symptom",
    ])
  )
    categories.push("patient/health");
  if (hasAny(text, ["age", "dob", "date-of-birth", "birthdate"]))
    categories.push("age/date of birth");
  if (hasAny(text, ["password", "login", "signin", "account", "otp"]))
    categories.push("login/account");
  if (
    hasAny(text, [
      "file",
      "upload",
      "resume",
      "document",
      "attachment",
      "photo",
    ])
  )
    categories.push("file upload/document");
  if (
    hasAny(text, [
      "order",
      "checkout",
      "cart",
      "payment",
      "upi",
      "card",
      "razorpay",
      "stripe",
      "paypal",
    ])
  )
    categories.push("order/payment");

  return Array.from(new Set(categories));
}

function isSensitiveDataSignal(signal: string) {
  return [
    "patient/health",
    "age/date of birth",
    "login/account",
    "file upload/document",
    "order/payment",
  ].includes(signal);
}

function detectPrivacySignals(nearbyHtml: string) {
  const text = stripTags(nearbyHtml);
  const linkText = nearbyHtml.toLowerCase();
  const signals: string[] = [];

  if (
    hasAny(text, [
      "privacy policy",
      "privacy notice",
      "data protection",
      "personal data",
      "personal information",
    ]) ||
    hasAny(linkText, ["privacy-policy", "/privacy", "privacy"])
  ) {
    signals.push("privacy notice/policy");
  }

  if (
    hasAny(text, [
      "i agree",
      "agree to",
      "consent",
      "by submitting",
      "terms and conditions",
      "terms of service",
      "accept",
    ])
  ) {
    signals.push("consent/agreement");
  }

  if (
    hasAny(text, [
      "we use your",
      "used to contact",
      "used for",
      "purpose",
      "to process",
      "to respond",
      "to schedule",
      "to book",
      "to deliver",
    ])
  ) {
    signals.push("purpose/use explanation");
  }

  if (
    hasAny(text, [
      "grievance",
      "complaint",
      "contact us",
      "support",
      "help",
      "email us",
      "data protection officer",
      "dpo",
    ])
  ) {
    signals.push("grievance/contact/support");
  }

  return Array.from(new Set(signals));
}

function analyze(input: PrivacyNearFormInput) {
  const blocks = extractFormBlocks(input.html);
  const result = {
    customerDataFormCount: 0,
    sensitiveFormCount: 0,
    formsMissingPrivacyNotice: 0,
    formsMissingConsentSignal: 0,
    formsMissingPurposeSignal: 0,
    formsMissingGrievanceSignal: 0,
    detectedDataSignals: [] as string[],
    detectedPrivacySignals: [] as string[],
  };

  for (const block of blocks) {
    const dataSignals = dataSignalsForForm(block.formHtml);
    if (dataSignals.length === 0) continue;

    result.customerDataFormCount += 1;
    result.detectedDataSignals.push(...dataSignals);

    if (dataSignals.some(isSensitiveDataSignal)) result.sensitiveFormCount += 1;

    const privacySignals = detectPrivacySignals(block.nearbyHtml);
    result.detectedPrivacySignals.push(...privacySignals);

    if (!privacySignals.includes("privacy notice/policy"))
      result.formsMissingPrivacyNotice += 1;
    if (!privacySignals.includes("consent/agreement"))
      result.formsMissingConsentSignal += 1;
    if (!privacySignals.includes("purpose/use explanation"))
      result.formsMissingPurposeSignal += 1;
    if (!privacySignals.includes("grievance/contact/support"))
      result.formsMissingGrievanceSignal += 1;
  }

  result.detectedDataSignals = Array.from(new Set(result.detectedDataSignals));
  result.detectedPrivacySignals = Array.from(
    new Set(result.detectedPrivacySignals),
  );

  return result;
}

function buildEvidence(
  input: PrivacyNearFormInput,
  result: ReturnType<typeof analyze>,
) {
  return [
    `Source URL: ${input.pageUrl || "unknown"}`,
    `Customer-data forms checked: ${result.customerDataFormCount}`,
    `Higher-risk forms checked: ${result.sensitiveFormCount}`,
    `Detected data signals: ${result.detectedDataSignals.join(", ") || "none"}`,
    `Detected nearby privacy signals: ${result.detectedPrivacySignals.join(", ") || "none"}`,
    `Forms missing nearby privacy notice/policy: ${result.formsMissingPrivacyNotice}`,
    `Forms missing nearby consent/agreement signal: ${result.formsMissingConsentSignal}`,
    `Forms missing nearby purpose/use explanation: ${result.formsMissingPurposeSignal}`,
    `Forms missing nearby grievance/contact/support signal: ${result.formsMissingGrievanceSignal}`,
    "Limitation: Passive HTML evidence only. This does not verify legal compliance, backend handling, or actual consent storage.",
  ].join("\n");
}

function finding(
  id: string,
  title: string,
  severity: PrivacyNearFormSeverity,
  evidence: string,
  recommendation: string,
  description: string,
  input: PrivacyNearFormInput,
): PrivacyNearFormFinding {
  return {
    id,
    title,
    severity,
    risk_level: severity,
    category: "dpdp_readiness",
    evidence,
    recommendation,
    description,
    confidence: "medium",
    verification_status: "likely_signal",
    evidence_type: "html_signal",
    source_url: input.pageUrl,
    observed_value: title,
    expected_value:
      "Customer-data forms should show nearby privacy, consent, purpose, and contact/grievance signals where appropriate.",
    limitation:
      "Passive scan only. This is DPDP readiness evidence, not legal certification.",
    root_cause: "dpdp_privacy_signals_near_customer_forms",
  };
}

export function privacyNearFormFindingsFromScan(
  input: PrivacyNearFormInput,
): PrivacyNearFormFinding[] {
  const result = analyze(input);

  if (result.customerDataFormCount === 0) return [];

  const findings: PrivacyNearFormFinding[] = [];
  const evidence = buildEvidence(input, result);

  if (
    result.formsMissingPrivacyNotice > 0 ||
    result.formsMissingConsentSignal > 0 ||
    result.formsMissingPurposeSignal > 0
  ) {
    findings.push(
      finding(
        "dpdp_privacy_signals_missing_near_forms",
        "Customer-data forms need stronger nearby privacy signals",
        result.sensitiveFormCount > 0 ? "medium" : "low",
        evidence,
        "Place clear privacy notice, consent/agreement wording, and purpose/use explanation near customer-data forms, especially for sensitive or higher-risk forms.",
        "The scan found visible customer-data forms where nearby privacy, consent, or purpose signals appear incomplete.",
        input,
      ),
    );
  }

  if (
    result.formsMissingGrievanceSignal > 0 &&
    result.detectedPrivacySignals.length === 0
  ) {
    findings.push(
      finding(
        "dpdp_contact_or_grievance_signal_missing_near_forms",
        "Customer-data forms do not show nearby contact or grievance signal",
        "info",
        evidence,
        "Add a clear contact/support/grievance path from privacy-related pages or near important customer-data forms.",
        "The scan did not find a visible nearby contact, support, or grievance signal around customer-data forms.",
        input,
      ),
    );
  }

  return findings;
}
