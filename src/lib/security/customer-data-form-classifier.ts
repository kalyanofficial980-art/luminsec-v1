export type CustomerDataFormSeverity = "info" | "low" | "medium" | "high" | "critical";

export type CustomerDataFormFinding = {
  id: string;
  title: string;
  description: string;
  category: string;
  severity: CustomerDataFormSeverity;
  risk_level: CustomerDataFormSeverity;
  evidence: string;
  recommendation: string;
  confidence?: "high" | "medium" | "low";
  verification_status?: "verified_by_scan" | "likely_signal" | "needs_confirmation" | "not_visible";
  evidence_type?: "html_signal" | "crawler_page" | "scan_quality" | "unknown";
  source_url?: string;
  observed_value?: string;
  expected_value?: string;
  limitation?: string;
  root_cause?: string;
};

type CustomerDataFormInput = {
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
  return value.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().toLowerCase();
}

function extractForms(html: string) {
  const cleaned = cleanHtml(html);
  const forms = cleaned.match(/<form\b[\s\S]*?<\/form>/gi) || [];

  if (forms.length > 0) return forms.slice(0, 12);

  const fieldCount = (cleaned.match(/<(input|textarea|select)\b/gi) || []).length;
  return fieldCount >= 2 ? [cleaned] : [];
}

function fieldSignals(formHtml: string) {
  const signals: string[] = [];
  const fieldRegex = /<(input|textarea|select)\b[\s\S]*?>/gi;
  let match: RegExpExecArray | null;

  while ((match = fieldRegex.exec(formHtml)) !== null) {
    const tag = match[0] || "";
    const attrs = Array.from(
      tag.matchAll(/\b(type|name|id|placeholder|aria-label|autocomplete)\s*=\s*["']?([^"'\s>]+)/gi)
    ).map((item) => item[2]);

    signals.push(...attrs);
  }

  return Array.from(new Set(signals.map((item) => item.toLowerCase()))).slice(0, 30);
}

function hasAny(text: string, words: string[]) {
  return words.some((word) => text.includes(word));
}

function classifyForm(formHtml: string) {
  const signals = fieldSignals(formHtml);
  const text = `${stripTags(formHtml)} ${signals.join(" ")}`.toLowerCase();

  const categories: string[] = [];

  if (hasAny(text, ["name", "fullname", "first-name", "last-name"])) categories.push("name");
  if (hasAny(text, ["email", "e-mail"])) categories.push("email");
  if (hasAny(text, ["phone", "mobile", "whatsapp", "telephone"])) categories.push("phone/mobile");
  if (hasAny(text, ["address", "city", "state", "pincode", "shipping", "billing"])) categories.push("address/location");
  if (hasAny(text, ["message", "query", "enquiry", "inquiry", "comment"])) categories.push("message/enquiry");
  if (hasAny(text, ["appointment", "booking", "schedule", "consultation", "slot"])) categories.push("appointment/booking");
  if (hasAny(text, ["student", "admission", "class", "course", "school", "college", "parent", "guardian"])) categories.push("student/admission");
  if (hasAny(text, ["patient", "doctor", "clinic", "hospital", "medical", "health", "symptom"])) categories.push("patient/health");
  if (hasAny(text, ["age", "dob", "date-of-birth", "birthdate"])) categories.push("age/date of birth");
  if (hasAny(text, ["password", "login", "signin", "account", "otp"])) categories.push("login/account");
  if (hasAny(text, ["file", "upload", "resume", "document", "attachment", "photo"])) categories.push("file upload/document");
  if (hasAny(text, ["order", "checkout", "cart", "payment", "upi", "card", "razorpay", "stripe", "paypal"])) categories.push("order/payment");

  const uniqueCategories = Array.from(new Set(categories));

  if (uniqueCategories.length === 0) return null;

  const sensitive = uniqueCategories.some((category) =>
    ["patient/health", "age/date of birth", "login/account", "file upload/document", "order/payment"].includes(category)
  );

  return {
    categories: uniqueCategories,
    signals,
    sensitive,
  };
}

function buildEvidence(input: CustomerDataFormInput, forms: Array<{ categories: string[]; signals: string[]; sensitive: boolean }>) {
  const categories = Array.from(new Set(forms.flatMap((form) => form.categories)));
  const signals = Array.from(new Set(forms.flatMap((form) => form.signals))).slice(0, 16);

  return [
    `Source URL: ${input.pageUrl || "unknown"}`,
    `Detected customer-data forms: ${forms.length}`,
    `Detected data categories: ${categories.join(", ")}`,
    signals.length > 0 ? `Visible field signals: ${signals.join(", ")}` : "",
    "Limitation: Passive HTML evidence only. It does not submit forms or verify backend storage.",
  ]
    .filter(Boolean)
    .join("\n");
}

function finding(
  id: string,
  title: string,
  severity: CustomerDataFormSeverity,
  evidence: string,
  recommendation: string,
  description: string,
  input: CustomerDataFormInput
): CustomerDataFormFinding {
  return {
    id,
    title,
    severity,
    risk_level: severity,
    category: "customer_data",
    evidence,
    recommendation,
    description,
    confidence: "high",
    verification_status: "verified_by_scan",
    evidence_type: "html_signal",
    source_url: input.pageUrl,
    observed_value: title,
    expected_value: "Customer-data collection should be clearly identified and protected.",
    limitation: "Passive scan only. Form submission and backend handling are not tested.",
    root_cause: "customer_data_form_visibility",
  };
}

export function customerDataFormFindingsFromScan(input: CustomerDataFormInput): CustomerDataFormFinding[] {
  const forms = extractForms(input.html)
    .map(classifyForm)
    .filter((form): form is { categories: string[]; signals: string[]; sensitive: boolean } => Boolean(form));

  if (forms.length === 0) return [];

  const findings: CustomerDataFormFinding[] = [];
  const sensitiveForms = forms.filter((form) => form.sensitive);

  findings.push(
    finding(
      "customer_data_forms_detected",
      "Customer-data collection forms detected",
      "info",
      buildEvidence(input, forms),
      "Keep an inventory of customer data collected by each form and map it to privacy notice, consent, retention, and access-control requirements.",
      "The scan found visible website forms that appear to collect customer or user data.",
      input
    )
  );

  if (sensitiveForms.length > 0) {
    findings.push(
      finding(
        "sensitive_customer_data_forms_detected",
        "Sensitive or higher-risk customer-data form detected",
        "low",
        buildEvidence(input, sensitiveForms),
        "Review these forms for privacy notice, consent, secure transmission, access control, and retention requirements.",
        "The scan found visible form signals related to health, payment/order, account/login, age/date of birth, or file-upload data.",
        input
      )
    );
  }

  return findings;
}