import type {
  TechnologyDetectionResult,
  TechnologySignal,
} from "./technology-detection";

export type KnownRiskFinding = {
  id: string;
  title: string;
  description: string;
  category: string;
  severity: "info" | "low" | "medium" | "high" | "critical";
  risk_level: "info" | "low" | "medium" | "high" | "critical";
  evidence: string;
  recommendation: string;
};

type RiskRule = {
  match: (technology: TechnologySignal) => boolean;
  id: string;
  title: string;
  severity: KnownRiskFinding["severity"];
  category: string;
  riskCategory: string;
  whyItMatters: string;
  businessImpact: string;
  technicalImpact: string;
  fixSummary: string;
  developerFix: string;
  retest: string;
};

function slug(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
}

function confidenceText(value: TechnologySignal["confidence"]) {
  if (value === "high") return "High confidence";
  if (value === "medium") return "Medium confidence";
  return "Low confidence";
}

function evidenceForTechnology(technology: TechnologySignal, riskCategory: string) {
  return [
    `Technology: ${technology.name}`,
    `Category: ${technology.category}`,
    `Confidence: ${confidenceText(technology.confidence)}`,
    technology.version ? `Visible version: ${technology.version}` : "",
    `Known-risk category: ${riskCategory}`,
    `Evidence: ${technology.evidence}`,
  ]
    .filter(Boolean)
    .join("\n");
}

function makeFinding(rule: RiskRule, technology: TechnologySignal): KnownRiskFinding {
  return {
    id: `known_risk_${rule.id}_${slug(technology.name)}`,
    title: `${technology.name}: ${rule.title}`,
    category: rule.category,
    severity: rule.severity,
    risk_level: rule.severity,
    evidence: evidenceForTechnology(technology, rule.riskCategory),
    description: [
      `What we found: VeyraSec detected ${technology.name} and mapped it to a known-risk review category.`,
      "",
      `Why it matters: ${rule.whyItMatters}`,
      "",
      `Business impact: ${rule.businessImpact}`,
      "",
      `Technical impact: ${rule.technicalImpact}`,
      "",
      `Confidence: ${confidenceText(technology.confidence)}`,
      "",
      "Safety note: This is passive intelligence based on visible public signals. It is not a confirmed vulnerability, exploit result, or CVE confirmation.",
    ].join("\n"),
    recommendation: [
      rule.severity === "medium" ? "Priority: Fix this week" : "Priority: Monitor",
      "",
      "Estimated effort: Review",
      "",
      `Fix summary: ${rule.fixSummary}`,
      "",
      `Developer fix: ${rule.developerFix}`,
      "",
      `Retest: ${rule.retest}`,
    ].join("\n"),
  };
}

const rules: RiskRule[] = [
  {
    id: "wordpress_maintenance_review",
    match: (technology) => technology.name.toLowerCase() === "wordpress",
    title: "CMS maintenance review recommended",
    severity: "medium",
    category: "technology",
    riskCategory: "CMS core/theme/plugin maintenance",
    whyItMatters:
      "WordPress security depends heavily on keeping core, themes, plugins, admin access, and backups maintained.",
    businessImpact:
      "A poorly maintained CMS can damage customer trust, uptime, SEO, and business continuity.",
    technicalImpact:
      "Review core updates, plugin inventory, theme maintenance, admin users, backups, and security headers.",
    fixSummary:
      "Review WordPress maintenance status, remove unused plugins/themes, and confirm update and backup process.",
    developerFix:
      "Check WordPress core/theme/plugin versions in the admin panel, update safely in staging, remove unused plugins, and verify backups.",
    retest:
      "Run VeyraSec again after updates and confirm no unnecessary version or plugin signals remain visible.",
  },
  {
    id: "woocommerce_checkout_review",
    match: (technology) => technology.name.toLowerCase() === "woocommerce",
    title: "eCommerce checkout security review recommended",
    severity: "medium",
    category: "privacy",
    riskCategory: "eCommerce checkout and customer data handling",
    whyItMatters:
      "WooCommerce sites often process customer data, carts, checkout flows, account pages, payment integrations, and order emails.",
    businessImpact:
      "Checkout trust and privacy clarity directly affect conversion, support load, and customer confidence.",
    technicalImpact:
      "Review checkout HTTPS, secure cookies, payment plugins, privacy disclosures, and plugin maintenance.",
    fixSummary:
      "Review WooCommerce checkout security, payment plugins, privacy policy, and cookie/session configuration.",
    developerFix:
      "Verify checkout pages use HTTPS, session cookies use Secure/HttpOnly/SameSite where appropriate, and payment plugins are current.",
    retest:
      "Run VeyraSec again after checkout or plugin changes and verify security/privacy findings improve.",
  },
  {
    id: "shopify_app_theme_review",
    match: (technology) => technology.name.toLowerCase() === "shopify",
    title: "Shopify app and theme review recommended",
    severity: "low",
    category: "technology",
    riskCategory: "Hosted commerce app/theme governance",
    whyItMatters:
      "Shopify risk usually comes from third-party apps, theme scripts, tracking pixels, and privacy disclosures.",
    businessImpact:
      "Unnecessary apps and tracking scripts can reduce trust, increase privacy complexity, and slow the storefront.",
    technicalImpact:
      "Review app permissions, theme custom code, checkout settings, analytics tags, and privacy/cookie disclosure.",
    fixSummary:
      "Review Shopify apps, theme scripts, checkout settings, and tracking/privacy disclosure.",
    developerFix:
      "Remove unused Shopify apps, audit theme scripts, and verify privacy/cookie notices match actual tracking behavior.",
    retest:
      "Run VeyraSec again after app/theme cleanup and confirm fewer unnecessary script/tracking findings.",
  },
  {
    id: "nextjs_runtime_review",
    match: (technology) => technology.name.toLowerCase() === "next.js",
    title: "framework security hygiene review recommended",
    severity: "low",
    category: "technology",
    riskCategory: "Frontend/server framework maintenance",
    whyItMatters:
      "Next.js applications should be kept updated and reviewed for headers, caching, environment variable exposure, and deployment settings.",
    businessImpact:
      "Strong framework hygiene helps protect customer trust and reduces avoidable production incidents.",
    technicalImpact:
      "Review Next.js version currency, security headers, middleware, caching behavior, and exposed runtime metadata.",
    fixSummary:
      "Keep Next.js updated and review deployment, headers, caching, and environment variable handling.",
    developerFix:
      "Check package updates, verify no secrets are exposed to the client, and enforce security headers at app/CDN level.",
    retest:
      "Run VeyraSec again after framework/deployment updates and confirm score and header findings improve.",
  },
  {
    id: "cdn_security_configuration_review",
    match: (technology) => technology.name.toLowerCase() === "cloudflare",
    title: "CDN security configuration review recommended",
    severity: "low",
    category: "exposure",
    riskCategory: "CDN/TLS/WAF configuration",
    whyItMatters:
      "CDN configuration affects TLS mode, caching behavior, bot controls, WAF rules, and origin protection.",
    businessImpact:
      "Good CDN configuration improves availability, trust, and protection against common internet noise.",
    technicalImpact:
      "Review TLS mode, DNS records, origin exposure, cache rules, WAF settings, and security headers.",
    fixSummary:
      "Review CDN TLS, caching, WAF, and origin protection settings.",
    developerFix:
      "Confirm TLS mode is strict, origin is not unnecessarily exposed, and security headers are consistently applied.",
    retest:
      "Run VeyraSec again after CDN setting changes and confirm HTTPS/header findings improve.",
  },
  {
    id: "hosting_deployment_review",
    match: (technology) =>
      ["vercel", "netlify"].includes(technology.name.toLowerCase()),
    title: "deployment platform review recommended",
    severity: "low",
    category: "exposure",
    riskCategory: "Deployment environment and preview exposure",
    whyItMatters:
      "Modern deployment platforms require careful environment variable, preview deployment, redirect, and header configuration.",
    businessImpact:
      "Deployment mistakes can cause downtime, data exposure, confusing previews, or customer trust issues.",
    technicalImpact:
      "Review environment variables, preview deployments, redirects, build settings, and security headers.",
    fixSummary:
      "Review deployment platform settings, environment variables, preview access, and security headers.",
    developerFix:
      "Confirm secrets are server-only, preview URLs are controlled, and security headers are applied in production.",
    retest:
      "Run VeyraSec again after deployment setting changes and confirm production-only posture is healthy.",
  },
  {
    id: "server_disclosure_review",
    match: (technology) =>
      ["nginx", "apache", "x-powered-by disclosure", "generator meta tag"].includes(
        technology.name.toLowerCase()
      ),
    title: "technology disclosure review recommended",
    severity: "low",
    category: "technology",
    riskCategory: "Public technology disclosure",
    whyItMatters:
      "Public server, framework, or generator details can help automated tools fingerprint the website.",
    businessImpact:
      "Reducing unnecessary technology disclosure improves professional security posture and customer confidence.",
    technicalImpact:
      "Remove unnecessary version headers/meta tags where possible and keep the underlying platform updated.",
    fixSummary:
      "Reduce unnecessary public technology/version disclosure.",
    developerFix:
      "Disable or minimize Server, X-Powered-By, and generator/version metadata where supported by the platform.",
    retest:
      "Run VeyraSec again and confirm unnecessary technology/version evidence is no longer visible.",
  },
  {
    id: "analytics_privacy_review",
    match: (technology) => technology.category === "analytics",
    title: "tracking and privacy review recommended",
    severity: "low",
    category: "privacy",
    riskCategory: "Tracking, analytics, and privacy disclosure",
    whyItMatters:
      "Analytics and tracking tools can affect privacy posture, consent requirements, and user trust.",
    businessImpact:
      "Clear privacy/cookie disclosures reduce trust friction and support customer expectations.",
    technicalImpact:
      "Review tracking scripts, privacy policy, cookie notices, data retention, and consent behavior where applicable.",
    fixSummary:
      "Review analytics/tracking tools and confirm privacy/cookie disclosure matches actual tracking behavior.",
    developerFix:
      "Remove unused trackers, document remaining tools, and ensure privacy/cookie notices are accurate.",
    retest:
      "Run VeyraSec again after tracking cleanup and confirm only expected tracking scripts remain.",
  },
  {
    id: "payment_integration_review",
    match: (technology) => technology.category === "payment",
    title: "payment integration review recommended",
    severity: "medium",
    category: "privacy",
    riskCategory: "Payment integration and checkout trust",
    whyItMatters:
      "Payment integrations should use official scripts, secure checkout configuration, strong HTTPS, and clear privacy disclosures.",
    businessImpact:
      "Checkout trust affects conversions, refunds, support load, and brand confidence.",
    technicalImpact:
      "Review official payment script usage, webhook handling, checkout URLs, privacy disclosures, and cookie/session settings.",
    fixSummary:
      "Review payment integration, checkout security, webhook handling, and privacy disclosure.",
    developerFix:
      "Confirm official payment provider scripts, secure webhook verification, HTTPS checkout, and no unnecessary custom payment handling.",
    retest:
      "Run VeyraSec again after checkout/payment changes and verify payment-related posture findings improve.",
  },
];

export function knownRiskFindingsFromTechnology(
  detection: TechnologyDetectionResult
): KnownRiskFinding[] {
  const findings: KnownRiskFinding[] = [];
  const seen = new Set<string>();

  for (const technology of detection.technologies) {
    for (const rule of rules) {
      if (!rule.match(technology)) {
        continue;
      }

      const generated = makeFinding(rule, technology);

      if (seen.has(generated.id)) {
        continue;
      }

      seen.add(generated.id);
      findings.push(generated);
    }
  }

  if (detection.summary.exposedVersions > 0) {
    findings.push({
      id: "known_risk_visible_version_review",
      title: "Visible version information should be reviewed",
      category: "technology",
      severity: "medium",
      risk_level: "medium",
      evidence: `Visible version-bearing technology signals: ${detection.summary.exposedVersions}`,
      description: [
        "What we found: One or more detected technologies appear to expose version-like information.",
        "",
        "Why it matters: Public version hints can help attackers or automated tools focus on known-risk components.",
        "",
        "Business impact: Reducing unnecessary version exposure improves customer trust and professional security posture.",
        "",
        "Technical impact: Confirm the component is up to date and hide non-essential version disclosure where possible.",
        "",
        "Confidence: Medium confidence",
        "",
        "Safety note: This is passive intelligence. VeyraSec is not claiming a confirmed CVE or exploitable vulnerability from this signal alone.",
      ].join("\n"),
      recommendation: [
        "Priority: Fix this week",
        "",
        "Estimated effort: Quick",
        "",
        "Fix summary: Review visible version disclosures, confirm components are current, and remove unnecessary version metadata.",
        "",
        "Developer fix: Check server headers, generator meta tags, CMS settings, framework headers, and public HTML for version exposure.",
        "",
        "Retest: Run a new VeyraSec scan and confirm version evidence is reduced or expected.",
      ].join("\n"),
    });
  }

  if (
    detection.summary.cms &&
    detection.summary.analyticsCount > 0 &&
    detection.summary.paymentCount > 0
  ) {
    findings.push({
      id: "known_risk_complex_customer_data_stack",
      title: "Customer-data stack should be reviewed",
      category: "privacy",
      severity: "medium",
      risk_level: "medium",
      evidence: [
        `CMS: ${detection.summary.cms}`,
        `Analytics/tracking technologies: ${detection.summary.analyticsCount}`,
        `Payment technologies: ${detection.summary.paymentCount}`,
      ].join("\n"),
      description: [
        "What we found: The website appears to combine CMS, tracking, and payment-related signals.",
        "",
        "Why it matters: More customer-data touchpoints usually require stronger privacy, cookie, checkout, and third-party script governance.",
        "",
        "Business impact: Customers expect clear trust signals when websites collect data, track behavior, or support payments.",
        "",
        "Technical impact: Review privacy policy, cookie behavior, payment scripts, third-party vendors, and checkout security together.",
        "",
        "Confidence: Medium confidence",
      ].join("\n"),
      recommendation: [
        "Priority: Fix this week",
        "",
        "Estimated effort: Review",
        "",
        "Fix summary: Review customer-data touchpoints, privacy disclosures, payment scripts, and tracking scripts together.",
        "",
        "Developer fix: Audit scripts and integrations that process customer data. Remove unused vendors and confirm secure configuration.",
        "",
        "Retest: Run VeyraSec after cleanup and confirm privacy/payment/tracking findings improve.",
      ].join("\n"),
    });
  }

  return findings;
}