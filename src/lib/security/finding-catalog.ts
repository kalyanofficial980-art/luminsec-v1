import type {
  EstimatedEffort,
  RemediationPriority,
  SecurityCategory,
  SecurityConfidence,
  SecuritySeverity,
} from "./types";

export type FindingCatalogItem = {
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
};

export const findingCatalog: Record<string, FindingCatalogItem> = {
  missing_hsts: {
    id: "missing_hsts",
    category: "security_headers",
    severity: "medium",
    confidence: "high",
    title: "Missing HTTP Strict Transport Security",
    whatWeFound:
      "The website does not return the Strict-Transport-Security header.",
    whyItMatters:
      "HSTS helps browsers automatically use HTTPS for future visits.",
    businessImpact:
      "Customers may see weaker browser security behavior, which can reduce trust for business websites.",
    technicalImpact:
      "Without HSTS, users may be more exposed to downgrade or insecure connection risks in some network situations.",
    fixSummary:
      "Enable HSTS after confirming HTTPS works correctly across the website.",
    developerFix:
      "Add a Strict-Transport-Security header such as max-age=31536000 after testing HTTPS and redirects carefully.",
    priority: "fix_this_week",
    estimatedEffort: "quick",
    retestInstruction:
      "Run a new scan and confirm the Strict-Transport-Security header is present.",
  },
  missing_csp: {
    id: "missing_csp",
    category: "security_headers",
    severity: "medium",
    confidence: "high",
    title: "Missing Content Security Policy",
    whatWeFound:
      "The website does not return a Content-Security-Policy header.",
    whyItMatters:
      "A Content Security Policy can reduce the impact of certain browser-based script injection risks.",
    businessImpact:
      "A missing CSP can make the website appear less security-ready for customers and partners.",
    technicalImpact:
      "The browser has fewer restrictions on what scripts, frames, and resources can load.",
    fixSummary: "Ask a developer to add and test a safe CSP for the website.",
    developerFix:
      "Start with a report-only CSP, test carefully, then enforce a policy that matches the website resources.",
    priority: "ask_developer",
    estimatedEffort: "medium",
    retestInstruction:
      "Run a new scan and confirm a Content-Security-Policy header is present.",
  },
  missing_x_frame_options: {
    id: "missing_x_frame_options",
    category: "security_headers",
    severity: "low",
    confidence: "high",
    title: "Missing clickjacking protection header",
    whatWeFound:
      "The website does not return X-Frame-Options or an equivalent frame-ancestors CSP rule.",
    whyItMatters:
      "Frame protection helps prevent the website from being embedded in unexpected pages.",
    businessImpact:
      "This is a common security hygiene issue that may reduce confidence in the website.",
    technicalImpact:
      "Some pages may be easier to embed in external frames if no other frame protection exists.",
    fixSummary: "Add X-Frame-Options or a CSP frame-ancestors rule.",
    developerFix:
      "Use X-Frame-Options: SAMEORIGIN or Content-Security-Policy: frame-ancestors 'self' where suitable.",
    priority: "fix_this_week",
    estimatedEffort: "quick",
    retestInstruction:
      "Run a new scan and confirm frame protection is present.",
  },
  missing_privacy_policy: {
    id: "missing_privacy_policy",
    category: "privacy",
    severity: "medium",
    confidence: "medium",
    title: "Privacy policy not clearly visible",
    whatWeFound:
      "The scan could not clearly identify a privacy policy link on the checked page.",
    whyItMatters:
      "Customers expect to know how their information is handled before submitting forms or making purchases.",
    businessImpact:
      "Missing privacy information can reduce customer trust and hurt conversions.",
    technicalImpact:
      "This is mainly a privacy-readiness and customer-trust issue, not an exploit finding.",
    fixSummary:
      "Add a clear privacy policy link in the footer or main navigation.",
    developerFix:
      "Create a privacy policy page and link it from the site footer across all important pages.",
    priority: "fix_this_week",
    estimatedEffort: "quick",
    retestInstruction:
      "Run a new scan and confirm the privacy policy is detected.",
  },
  missing_contact_trust: {
    id: "missing_contact_trust",
    category: "trust_signals",
    severity: "low",
    confidence: "medium",
    title: "Business contact trust signals are weak",
    whatWeFound:
      "The scan could not clearly identify strong contact or business trust signals.",
    whyItMatters:
      "Customers are more likely to trust websites that show clear contact and business information.",
    businessImpact:
      "Weak trust signals can reduce leads, calls, bookings, and purchases.",
    technicalImpact:
      "This is a trust-readiness issue, not a technical vulnerability.",
    fixSummary:
      "Add visible contact details, business name, address or service area, and support information.",
    developerFix:
      "Add contact and business details to the footer, contact page, and important landing pages.",
    priority: "fix_this_week",
    estimatedEffort: "quick",
    retestInstruction: "Run a new scan and confirm trust signals are detected.",
  },
};
