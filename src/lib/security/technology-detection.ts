export type TechnologyConfidence = "low" | "medium" | "high";

export type TechnologySignal = {
  name: string;
  category:
    | "cms"
    | "ecommerce"
    | "framework"
    | "javascript"
    | "hosting"
    | "cdn"
    | "server"
    | "analytics"
    | "payment"
    | "security"
    | "unknown";
  confidence: TechnologyConfidence;
  evidence: string;
  version?: string;
  riskNote?: string;
};

export type TechnologyDetectionResult = {
  technologies: TechnologySignal[];
  summary: {
    cms?: string;
    ecommerce?: string;
    framework?: string;
    hosting?: string;
    cdn?: string;
    server?: string;
    analyticsCount: number;
    paymentCount: number;
    exposedVersions: number;
  };
  raw: {
    generator?: string;
    scriptHosts: string[];
    headerSignals: Record<string, string>;
  };
};

export type TechnologyFinding = {
  id: string;
  title: string;
  description: string;
  category: string;
  severity: "info" | "low" | "medium" | "high" | "critical";
  risk_level: "info" | "low" | "medium" | "high" | "critical";
  evidence: string;
  recommendation: string;
};

function normalize(value: unknown) {
  return String(value ?? "").trim();
}

function lower(value: unknown) {
  return normalize(value).toLowerCase();
}

function getHeader(headers: Headers | null, name: string) {
  return normalize(headers?.get(name));
}

function uniq<T>(values: T[]) {
  return [...new Set(values)];
}

function confidenceLabel(confidence: TechnologyConfidence) {
  if (confidence === "high") return "High confidence";
  if (confidence === "medium") return "Medium confidence";
  return "Low confidence";
}

function addTechnology(items: TechnologySignal[], signal: TechnologySignal) {
  const key = `${signal.name}:${signal.category}:${signal.version || ""}`;

  if (
    items.some(
      (item) =>
        `${item.name}:${item.category}:${item.version || ""}`.toLowerCase() ===
        key.toLowerCase(),
    )
  ) {
    return;
  }

  items.push(signal);
}

function extractGenerator(body: string) {
  const match = body.match(
    /<meta[^>]+name=["']generator["'][^>]+content=["']([^"']+)["'][^>]*>/i,
  );

  return normalize(match?.[1]);
}

function extractVersion(text: string, product: string) {
  const pattern = new RegExp(`${product}\\s*([0-9]+(?:\\.[0-9]+){0,3})`, "i");
  const match = text.match(pattern);

  return normalize(match?.[1]);
}

function extractScriptHosts(body: string, baseUrl: string) {
  const hosts: string[] = [];
  const scriptMatches = body.matchAll(
    /<script\b[^>]*\bsrc=["']([^"']+)["'][^>]*>/gi,
  );

  for (const match of scriptMatches) {
    const src = normalize(match[1]);

    if (!src) {
      continue;
    }

    try {
      const parsed = new URL(src, baseUrl);
      hosts.push(parsed.hostname.toLowerCase());
    } catch {
      continue;
    }
  }

  return uniq(hosts);
}

function hasAny(body: string, patterns: RegExp[]) {
  return patterns.some((pattern) => pattern.test(body));
}

export function detectTechnologySignals(input: {
  url: string;
  finalUrl: string;
  headers: Headers | null;
  body: string;
}): TechnologyDetectionResult {
  const html = normalize(input.body);
  const htmlLower = lower(html);
  const headers = input.headers;
  const generator = extractGenerator(html);
  const generatorLower = lower(generator);
  const scriptHosts = extractScriptHosts(html, input.finalUrl || input.url);

  const server = getHeader(headers, "server");
  const poweredBy = getHeader(headers, "x-powered-by");
  const via = getHeader(headers, "via");
  const cfRay = getHeader(headers, "cf-ray");
  const cfCacheStatus = getHeader(headers, "cf-cache-status");
  const vercelId = getHeader(headers, "x-vercel-id");
  const netlifyId = getHeader(headers, "x-nf-request-id");

  const technologies: TechnologySignal[] = [];

  if (
    generatorLower.includes("wordpress") ||
    htmlLower.includes("/wp-content/") ||
    htmlLower.includes("/wp-includes/") ||
    htmlLower.includes("wp-json")
  ) {
    addTechnology(technologies, {
      name: "WordPress",
      category: "cms",
      confidence: htmlLower.includes("/wp-content/") ? "high" : "medium",
      evidence:
        generator ||
        "Visible WordPress asset/API signal found in homepage HTML.",
      version: extractVersion(generator, "wordpress") || undefined,
      riskNote:
        "Keep WordPress core, themes, and plugins updated. Avoid exposing unnecessary version details.",
    });
  }

  if (
    generatorLower.includes("woocommerce") ||
    htmlLower.includes("woocommerce") ||
    htmlLower.includes("wc-ajax") ||
    htmlLower.includes("wp-content/plugins/woocommerce")
  ) {
    addTechnology(technologies, {
      name: "WooCommerce",
      category: "ecommerce",
      confidence: htmlLower.includes("wp-content/plugins/woocommerce")
        ? "high"
        : "medium",
      evidence: "Visible WooCommerce signal found in homepage HTML.",
      version: extractVersion(generator, "woocommerce") || undefined,
      riskNote:
        "Keep WooCommerce and payment-related plugins updated and review checkout security settings.",
    });
  }

  if (
    htmlLower.includes("cdn.shopify.com") ||
    htmlLower.includes("shopify") ||
    htmlLower.includes("myshopify.com")
  ) {
    addTechnology(technologies, {
      name: "Shopify",
      category: "ecommerce",
      confidence: htmlLower.includes("cdn.shopify.com") ? "high" : "medium",
      evidence: "Visible Shopify asset/domain signal found in homepage HTML.",
      riskNote:
        "Review Shopify app permissions, theme scripts, checkout settings, and privacy disclosures.",
    });
  }

  if (
    htmlLower.includes("/_next/static/") ||
    htmlLower.includes("__next_data__") ||
    htmlLower.includes("next-head-count")
  ) {
    addTechnology(technologies, {
      name: "Next.js",
      category: "framework",
      confidence: "high",
      evidence: "Visible Next.js asset/runtime signal found in homepage HTML.",
      riskNote:
        "Keep Next.js updated and review security headers, caching, and exposed runtime metadata.",
    });
  }

  if (
    htmlLower.includes("data-reactroot") ||
    htmlLower.includes("react-dom") ||
    htmlLower.includes("__react") ||
    htmlLower.includes("/react")
  ) {
    addTechnology(technologies, {
      name: "React",
      category: "javascript",
      confidence: "medium",
      evidence: "Visible React-related signal found in homepage HTML.",
      riskNote:
        "Keep JavaScript dependencies updated and reduce unnecessary third-party scripts.",
    });
  }

  if (vercelId || lower(server).includes("vercel")) {
    addTechnology(technologies, {
      name: "Vercel",
      category: "hosting",
      confidence: vercelId ? "high" : "medium",
      evidence: `Header signal: x-vercel-id=${vercelId || "not visible"}, server=${server || "not visible"}`,
      riskNote:
        "Review deployment environment variables, preview deployment access, and security headers.",
    });
  }

  if (netlifyId || lower(server).includes("netlify")) {
    addTechnology(technologies, {
      name: "Netlify",
      category: "hosting",
      confidence: netlifyId ? "high" : "medium",
      evidence: `Header signal: x-nf-request-id=${netlifyId || "not visible"}, server=${server || "not visible"}`,
      riskNote:
        "Review deployment settings, environment variables, redirects, and security headers.",
    });
  }

  if (
    lower(server).includes("cloudflare") ||
    cfRay ||
    cfCacheStatus ||
    scriptHosts.some((host) => host.includes("cloudflare"))
  ) {
    addTechnology(technologies, {
      name: "Cloudflare",
      category: "cdn",
      confidence: cfRay || cfCacheStatus ? "high" : "medium",
      evidence: `Header signal: server=${server || "not visible"}, cf-ray=${cfRay || "not visible"}, cf-cache-status=${cfCacheStatus || "not visible"}`,
      riskNote:
        "Review CDN security settings, caching rules, WAF options, TLS mode, and origin exposure.",
    });
  }

  if (lower(server).includes("nginx")) {
    addTechnology(technologies, {
      name: "Nginx",
      category: "server",
      confidence: "medium",
      evidence: `Server header: ${server}`,
      version: extractVersion(server, "nginx") || undefined,
      riskNote:
        "Avoid exposing server versions and keep server packages updated.",
    });
  }

  if (lower(server).includes("apache")) {
    addTechnology(technologies, {
      name: "Apache",
      category: "server",
      confidence: "medium",
      evidence: `Server header: ${server}`,
      version: extractVersion(server, "apache") || undefined,
      riskNote:
        "Avoid exposing server versions and keep server packages updated.",
    });
  }

  if (poweredBy) {
    addTechnology(technologies, {
      name: "X-Powered-By disclosure",
      category: "server",
      confidence: "medium",
      evidence: `X-Powered-By header: ${poweredBy}`,
      version: extractVersion(poweredBy, "[a-zA-Z]+") || undefined,
      riskNote:
        "Remove or minimize technology disclosure headers where possible.",
    });
  }

  const analyticsSignals: TechnologySignal[] = [];

  if (
    htmlLower.includes("googletagmanager.com") ||
    htmlLower.includes("google-analytics.com") ||
    htmlLower.includes("gtag/js")
  ) {
    analyticsSignals.push({
      name: "Google Analytics / Tag Manager",
      category: "analytics",
      confidence: "high",
      evidence: "Visible Google analytics/tag manager script signal found.",
      riskNote:
        "Ensure analytics use is disclosed in privacy/cookie notices where required.",
    });
  }

  if (htmlLower.includes("facebook.net") || htmlLower.includes("fbq(")) {
    analyticsSignals.push({
      name: "Meta Pixel",
      category: "analytics",
      confidence: "high",
      evidence: "Visible Meta/Facebook pixel signal found.",
      riskNote:
        "Ensure tracking disclosure and consent handling are appropriate for target markets.",
    });
  }

  if (htmlLower.includes("hotjar.com")) {
    analyticsSignals.push({
      name: "Hotjar",
      category: "analytics",
      confidence: "high",
      evidence: "Visible Hotjar script signal found.",
      riskNote:
        "Review privacy disclosure and session recording/data masking configuration.",
    });
  }

  for (const item of analyticsSignals) {
    addTechnology(technologies, item);
  }

  const paymentSignals: TechnologySignal[] = [];

  if (
    htmlLower.includes("checkout.razorpay.com") ||
    htmlLower.includes("razorpay")
  ) {
    paymentSignals.push({
      name: "Razorpay",
      category: "payment",
      confidence: "high",
      evidence: "Visible Razorpay script/domain signal found.",
      riskNote:
        "Review checkout configuration, webhook handling, and payment privacy disclosures.",
    });
  }

  if (htmlLower.includes("js.stripe.com") || htmlLower.includes("stripe")) {
    paymentSignals.push({
      name: "Stripe",
      category: "payment",
      confidence: htmlLower.includes("js.stripe.com") ? "high" : "medium",
      evidence: "Visible Stripe script/domain signal found.",
      riskNote:
        "Review checkout integration, webhook handling, and payment privacy disclosures.",
    });
  }

  if (
    htmlLower.includes("paypal.com/sdk/js") ||
    htmlLower.includes("paypalobjects.com")
  ) {
    paymentSignals.push({
      name: "PayPal",
      category: "payment",
      confidence: "high",
      evidence: "Visible PayPal script/domain signal found.",
      riskNote: "Review payment integration and privacy disclosures.",
    });
  }

  for (const item of paymentSignals) {
    addTechnology(technologies, item);
  }

  if (generator && !generatorLower.includes("wordpress")) {
    addTechnology(technologies, {
      name: "Generator meta tag",
      category: "server",
      confidence: "medium",
      evidence: `Generator meta tag: ${generator}`,
      version: generator.match(/[0-9]+(?:\.[0-9]+){0,3}/)?.[0],
      riskNote:
        "Avoid exposing unnecessary technology and version details in public HTML.",
    });
  }

  const exposedVersions = technologies.filter((item) => item.version).length;

  const firstByCategory = (category: TechnologySignal["category"]) =>
    technologies.find((item) => item.category === category)?.name;

  return {
    technologies,
    summary: {
      cms: firstByCategory("cms"),
      ecommerce: firstByCategory("ecommerce"),
      framework: firstByCategory("framework"),
      hosting: firstByCategory("hosting"),
      cdn: firstByCategory("cdn"),
      server: firstByCategory("server"),
      analyticsCount: technologies.filter(
        (item) => item.category === "analytics",
      ).length,
      paymentCount: technologies.filter((item) => item.category === "payment")
        .length,
      exposedVersions,
    },
    raw: {
      generator: generator || undefined,
      scriptHosts,
      headerSignals: {
        server,
        poweredBy,
        via,
        cfRay,
        cfCacheStatus,
        vercelId,
        netlifyId,
      },
    },
  };
}

export function technologyFindingsFromSignals(
  detection: TechnologyDetectionResult,
): TechnologyFinding[] {
  const findings: TechnologyFinding[] = [];

  for (const tech of detection.technologies) {
    findings.push({
      id: `technology_detected_${tech.name.toLowerCase().replace(/[^a-z0-9]+/g, "_")}`,
      title: `${tech.name} technology signal detected`,
      category: "technology",
      severity: tech.version ? "low" : "info",
      risk_level: tech.version ? "low" : "info",
      evidence: [
        `Technology: ${tech.name}`,
        `Category: ${tech.category}`,
        `Confidence: ${confidenceLabel(tech.confidence)}`,
        tech.version ? `Visible version: ${tech.version}` : "",
        `Evidence: ${tech.evidence}`,
      ]
        .filter(Boolean)
        .join("\n"),
      description: [
        `What we found: VeyraSec detected a visible ${tech.name} technology signal.`,
        "",
        `Why it matters: Technology fingerprinting helps website owners understand platform-specific maintenance and trust posture.`,
        "",
        `Business impact: Knowing the platform helps prioritize updates, vendor review, privacy disclosures, and third-party script governance.`,
        "",
        `Technical impact: ${tech.riskNote || "Review this technology and keep it maintained."}`,
        "",
        `Confidence: ${confidenceLabel(tech.confidence)}`,
      ].join("\n"),
      recommendation: [
        tech.version ? "Priority: Monitor" : "Priority: Optional",
        "",
        "Estimated effort: Review",
        "",
        `Fix summary: ${tech.riskNote || "Review this detected technology and keep it maintained."}`,
        "",
        `Developer fix: Confirm whether ${tech.name} is expected, remove unnecessary public version disclosure where possible, and keep the platform or integration updated.`,
        "",
        "Retest: Run a new VeyraSec scan after changes and confirm the technology evidence is expected.",
      ].join("\n"),
    });
  }

  if (detection.summary.analyticsCount >= 2) {
    findings.push({
      id: "multiple_tracking_technologies_detected",
      title: "Multiple tracking technologies detected",
      category: "privacy",
      severity: "low",
      risk_level: "low",
      evidence: `Analytics/tracking technologies observed: ${detection.summary.analyticsCount}`,
      description: [
        "What we found: The homepage appears to load multiple analytics or tracking technologies.",
        "",
        "Why it matters: Tracking scripts can affect privacy posture, consent requirements, and customer trust.",
        "",
        "Business impact: Customers may expect clear privacy and cookie disclosures when tracking technologies are used.",
        "",
        "Technical impact: Review third-party script loading and remove unused tracking tools.",
        "",
        "Confidence: Medium confidence",
      ].join("\n"),
      recommendation: [
        "Priority: Fix this week",
        "",
        "Estimated effort: Quick",
        "",
        "Fix summary: Review analytics tools, remove unused trackers, and confirm privacy/cookie disclosure.",
        "",
        "Developer fix: Audit third-party tracking scripts and load only necessary scripts.",
        "",
        "Retest: Run a new VeyraSec scan and confirm only expected tracking technologies remain.",
      ].join("\n"),
    });
  }

  if (detection.summary.paymentCount > 0) {
    findings.push({
      id: "payment_script_detected",
      title: "Payment integration signal detected",
      category: "privacy",
      severity: "info",
      risk_level: "info",
      evidence: `Payment technologies observed: ${detection.summary.paymentCount}`,
      description: [
        "What we found: The homepage appears to reference a payment integration or payment-related script.",
        "",
        "Why it matters: Payment-related pages should have strong HTTPS, privacy disclosures, secure cookies, and clear checkout trust signals.",
        "",
        "Business impact: Checkout trust affects customer confidence and conversion.",
        "",
        "Technical impact: Confirm payment scripts are expected and configured safely.",
        "",
        "Confidence: Medium confidence",
      ].join("\n"),
      recommendation: [
        "Priority: Monitor",
        "",
        "Estimated effort: Review",
        "",
        "Fix summary: Confirm payment integration is expected and review checkout security/privacy settings.",
        "",
        "Developer fix: Confirm the integration uses official payment provider scripts and secure webhook handling.",
        "",
        "Retest: Run a new VeyraSec scan after checkout or payment-script changes.",
      ].join("\n"),
    });
  }

  if (detection.summary.exposedVersions > 0) {
    findings.push({
      id: "visible_technology_version_disclosure",
      title: "Visible technology version disclosure",
      category: "technology",
      severity: "low",
      risk_level: "low",
      evidence: `Technologies with visible version hints: ${detection.summary.exposedVersions}`,
      description: [
        "What we found: One or more visible technology signals include version information.",
        "",
        "Why it matters: Public version disclosure can help attackers or automated tools focus on outdated components.",
        "",
        "Business impact: Reducing unnecessary technical disclosure improves security posture and customer trust.",
        "",
        "Technical impact: Hide non-essential version headers/meta tags and keep the underlying software updated.",
        "",
        "Confidence: Medium confidence",
      ].join("\n"),
      recommendation: [
        "Priority: Fix this week",
        "",
        "Estimated effort: Quick",
        "",
        "Fix summary: Remove unnecessary public version disclosure and confirm the platform is updated.",
        "",
        "Developer fix: Disable generator/version headers or meta tags where possible.",
        "",
        "Retest: Run a new VeyraSec scan and confirm version evidence is no longer visible.",
      ].join("\n"),
    });
  }

  return findings;
}
