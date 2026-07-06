export type BrowserRenderingMode = "disabled" | "manual_review_only" | "controlled_scan";

export type BrowserRenderingEvidenceTarget =
  | "js_rendered_forms"
  | "privacy_links"
  | "consent_banner"
  | "payment_widgets"
  | "tracking_pixels"
  | "login_or_account_forms"
  | "dynamic_customer_data_fields"
  | "dynamic_security_headers_observation";

export type BrowserRenderingSafetyRule = {
  id: string;
  rule: string;
  reason: string;
};

export type BrowserRenderingLimit = {
  id: string;
  value: string | number | boolean;
  reason: string;
};

export type BrowserRenderingPlannedFinding = {
  target: BrowserRenderingEvidenceTarget;
  purpose: string;
  confidence: "high" | "medium" | "low";
  verification_status: "verified_by_scan" | "likely_signal" | "needs_confirmation";
  limitation: string;
};

export const A12_BROWSER_RENDERING_ENGINE_PLAN = {
  name: "A12 Browser Rendering Engine",
  currentMode: "disabled" as BrowserRenderingMode,
  installPlaywrightNow: false,
  reason:
    "This planning foundation avoids adding Playwright runtime weight before the passive scanner and report pipeline are ready.",
  featureFlag: "VEYRASEC_BROWSER_RENDERING_ENABLED",
  recommendedDefault: "manual_review_only" as BrowserRenderingMode,
  safetyRules: [
    {
      id: "same_domain_only",
      rule: "Render only the scanned website origin and same-domain pages already discovered by the safe crawler.",
      reason: "Prevents broad crawling and keeps the scan scoped.",
    },
    {
      id: "get_only_navigation",
      rule: "Use browser navigation only. Do not submit forms, click destructive buttons, bypass login, or trigger workflows.",
      reason: "Maintains passive, non-invasive scan behavior.",
    },
    {
      id: "no_auth_bypass",
      rule: "Do not attempt login, OTP, password reset, account creation, or protected-page bypass.",
      reason: "Avoids unsafe behavior and authorization risk.",
    },
    {
      id: "no_payload_injection",
      rule: "Do not inject XSS, SQLi, SSRF, command, path traversal, brute force, or exploit payloads.",
      reason: "VeyraSec is a readiness scanner, not an offensive testing tool.",
    },
    {
      id: "no_form_submission",
      rule: "Do not submit contact, payment, appointment, login, file upload, or customer-data forms.",
      reason: "Avoids sending data to client systems.",
    },
    {
      id: "no_hidden_path_guessing",
      rule: "Do not guess admin paths, hidden paths, backup files, debug routes, or sensitive endpoints.",
      reason: "Keeps browser rendering aligned with safe crawler scope.",
    },
    {
      id: "no_sensitive_storage",
      rule: "Do not store screenshots containing personal data unless a future manual-review workflow explicitly approves it.",
      reason: "Reduces privacy and DPDP risk.",
    },
  ] satisfies BrowserRenderingSafetyRule[],
  limits: [
    {
      id: "max_pages",
      value: 3,
      reason: "Low memory and predictable scan time for 8GB laptops and serverless environments.",
    },
    {
      id: "page_timeout_ms",
      value: 10000,
      reason: "Avoids hanging scans on slow or broken websites.",
    },
    {
      id: "total_timeout_ms",
      value: 30000,
      reason: "Keeps scan duration suitable for SaaS usage.",
    },
    {
      id: "block_heavy_assets",
      value: true,
      reason: "Block video, audio, large fonts, and unnecessary media to reduce memory usage.",
    },
    {
      id: "screenshots_default",
      value: false,
      reason: "Avoid privacy risk and storage cost until manual review workflow exists.",
    },
  ] satisfies BrowserRenderingLimit[],
  plannedEvidenceTargets: [
    {
      target: "js_rendered_forms",
      purpose: "Detect customer-data forms loaded after JavaScript execution.",
      confidence: "high",
      verification_status: "verified_by_scan",
      limitation: "Does not submit forms or verify backend storage.",
    },
    {
      target: "privacy_links",
      purpose: "Detect privacy policy, terms, contact, and grievance links visible after rendering.",
      confidence: "medium",
      verification_status: "verified_by_scan",
      limitation: "Does not verify legal sufficiency of the policy content.",
    },
    {
      target: "consent_banner",
      purpose: "Detect cookie/privacy consent banners or consent wording.",
      confidence: "medium",
      verification_status: "likely_signal",
      limitation: "Does not verify consent logging or legal validity.",
    },
    {
      target: "payment_widgets",
      purpose: "Detect visible payment providers such as Razorpay, Stripe, PayPal, and checkout widgets.",
      confidence: "medium",
      verification_status: "likely_signal",
      limitation: "Does not test payment flow or transaction security.",
    },
    {
      target: "tracking_pixels",
      purpose: "Detect rendered analytics, marketing, and tracking scripts.",
      confidence: "medium",
      verification_status: "likely_signal",
      limitation: "Does not classify every data-sharing purpose.",
    },
    {
      target: "login_or_account_forms",
      purpose: "Detect login/account fields that are rendered dynamically.",
      confidence: "high",
      verification_status: "verified_by_scan",
      limitation: "Does not attempt authentication.",
    },
    {
      target: "dynamic_customer_data_fields",
      purpose: "Detect fields added by JavaScript such as phone, appointment, patient, student, order, or upload fields.",
      confidence: "high",
      verification_status: "verified_by_scan",
      limitation: "Only visible rendered DOM is checked.",
    },
  ] satisfies BrowserRenderingPlannedFinding[],
  implementationStages: [
    "A12.1 planning foundation only",
    "A12.2 add optional feature flag and environment guard",
    "A12.3 install Playwright only when needed",
    "A12.4 render one page with strict limits",
    "A12.5 extract DOM evidence only",
    "A12.6 integrate with customer-data and DPDP signal engines",
    "A12.7 add paid-report manual review queue before screenshots",
  ],
} as const;

export function browserRenderingIsPlannedButDisabled() {
  return A12_BROWSER_RENDERING_ENGINE_PLAN.currentMode === "disabled";
}