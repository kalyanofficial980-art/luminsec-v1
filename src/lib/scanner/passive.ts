export type PassiveFindingSeverity = "high" | "medium" | "low" | "info";
export type PassiveFindingCategory = "security" | "privacy" | "trust";

export type PassiveFinding = {
  category: PassiveFindingCategory;
  severity: PassiveFindingSeverity;
  title: string;
  description: string;
  recommendation: string;
  evidence?: string;
};

export type PassiveScanResult = {
  targetUrl: string;
  websiteUrl: string;
  finalUrl: string;
  checkedAt: string;
  overallScore: number;
  securityScore: number;
  privacyScore: number;
  trustScore: number;
  riskLevel: "low" | "medium" | "high";
  summary: string;
  findings: PassiveFinding[];
  raw: Record<string, unknown>;

  // Backward-compatible snake_case fields if older actions need them.
  overall_score: number;
  security_score: number;
  privacy_score: number;
  trust_score: number;
  risk_level: "low" | "medium" | "high";
};

const USER_AGENT =
  "VeyraSec-V2-Passive-Readiness-Checker/2.0 (+safe passive website trust report)";

const FETCH_TIMEOUT_MS = 10000;
const MAX_BODY_CHARS = 200000;

function normalizeTargetUrl(input: string) {
  const raw = input.trim();

  if (!raw) {
    throw new Error("Website URL is required");
  }

  const withScheme = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
  const url = new URL(withScheme);

  if (!["http:", "https:"].includes(url.protocol)) {
    throw new Error("Only HTTP and HTTPS websites are supported");
  }

  url.hash = "";

  return url.toString();
}

async function fetchWithTimeout(url: string, init?: RequestInit) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    return await fetch(url, {
      ...init,
      redirect: "follow",
      cache: "no-store",
      signal: controller.signal,
      headers: {
        "User-Agent": USER_AGENT,
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,text/plain;q=0.8,*/*;q=0.7",
        ...(init?.headers ?? {}),
      },
    });
  } finally {
    clearTimeout(timeout);
  }
}

function headerValue(headers: Headers, key: string) {
  return headers.get(key) || "";
}

function hasHeader(headers: Headers, key: string) {
  return Boolean(headerValue(headers, key));
}

function pushFinding(findings: PassiveFinding[], finding: PassiveFinding) {
  const duplicate = findings.some(
    (item) => item.title === finding.title && item.category === finding.category
  );

  if (!duplicate) {
    findings.push(finding);
  }
}

function severityPenalty(severity: PassiveFindingSeverity) {
  switch (severity) {
    case "high":
      return 18;
    case "medium":
      return 10;
    case "low":
      return 5;
    case "info":
      return 0;
  }
}

function calculateCategoryScore(
  findings: PassiveFinding[],
  category: PassiveFindingCategory
) {
  const penalty = findings
    .filter((finding) => finding.category === category)
    .reduce((total, finding) => total + severityPenalty(finding.severity), 0);

  return Math.max(0, Math.min(100, 100 - penalty));
}

function calculateRiskLevel(score: number): "low" | "medium" | "high" {
  if (score >= 80) return "low";
  if (score >= 60) return "medium";
  return "high";
}

function countSeverity(findings: PassiveFinding[], severity: PassiveFindingSeverity) {
  return findings.filter((finding) => finding.severity === severity).length;
}

function buildSummary(result: {
  finalUrl: string;
  overallScore: number;
  securityScore: number;
  privacyScore: number;
  trustScore: number;
  findings: PassiveFinding[];
}) {
  const high = countSeverity(result.findings, "high");
  const medium = countSeverity(result.findings, "medium");
  const low = countSeverity(result.findings, "low");

  if (result.findings.length === 0) {
    return `VeyraSec V2 passive scan found strong public trust signals for ${result.finalUrl}. The website still needs periodic review because this is not a full audit or penetration test.`;
  }

  return `VeyraSec V2 passive scan reviewed ${result.finalUrl} and found ${result.findings.length} improvement area(s): ${high} high, ${medium} medium, and ${low} low. Current scores are Security ${result.securityScore}/100, Privacy ${result.privacyScore}/100, Trust ${result.trustScore}/100. This is a safe passive readiness report, not a full audit or penetration test.`;
}

function bodyHasLinkLike(body: string, patterns: RegExp[]) {
  return patterns.some((pattern) => pattern.test(body));
}

function looksLikeHtml(response: Response, body: string) {
  const contentType = headerValue(response.headers, "content-type").toLowerCase();
  return contentType.includes("text/html") || /<html|<!doctype html|<body/i.test(body);
}

function analyzeSecurityHeaders(headers: Headers, findings: PassiveFinding[], finalUrl: string) {
  const isHttps = finalUrl.startsWith("https://");
  const csp = headerValue(headers, "content-security-policy");
  const frameOptions = headerValue(headers, "x-frame-options");
  const xContentType = headerValue(headers, "x-content-type-options");
  const referrerPolicy = headerValue(headers, "referrer-policy");
  const permissionsPolicy = headerValue(headers, "permissions-policy");
  const hsts = headerValue(headers, "strict-transport-security");

  if (isHttps && !hsts) {
    pushFinding(findings, {
      category: "security",
      severity: "medium",
      title: "HSTS header is missing",
      description:
        "The website uses HTTPS but did not return a Strict-Transport-Security header in the public response.",
      recommendation:
        "Ask the developer or hosting provider to enable HSTS after confirming the website is fully ready for HTTPS.",
      evidence: "Missing Strict-Transport-Security",
    });
  }

  if (!csp) {
    pushFinding(findings, {
      category: "security",
      severity: "medium",
      title: "Content Security Policy is missing",
      description:
        "A Content-Security-Policy header was not visible in the public response. CSP helps reduce browser-side injection risk.",
      recommendation:
        "Add a carefully tested Content-Security-Policy header. Start with report-only mode if needed.",
      evidence: "Missing Content-Security-Policy",
    });
  }

  if (!frameOptions && !/frame-ancestors/i.test(csp)) {
    pushFinding(findings, {
      category: "security",
      severity: "medium",
      title: "Clickjacking protection is missing",
      description:
        "The response did not show X-Frame-Options or CSP frame-ancestors protection.",
      recommendation:
        "Add X-Frame-Options: DENY or SAMEORIGIN, or use CSP frame-ancestors.",
      evidence: "Missing X-Frame-Options and CSP frame-ancestors",
    });
  }

  if (!xContentType || !/nosniff/i.test(xContentType)) {
    pushFinding(findings, {
      category: "security",
      severity: "low",
      title: "X-Content-Type-Options nosniff is missing",
      description:
        "The public response did not clearly show X-Content-Type-Options: nosniff.",
      recommendation:
        "Add X-Content-Type-Options: nosniff to reduce MIME sniffing risk.",
      evidence: xContentType || "Missing X-Content-Type-Options",
    });
  }

  if (!referrerPolicy) {
    pushFinding(findings, {
      category: "privacy",
      severity: "low",
      title: "Referrer Policy is missing",
      description:
        "The website did not return a Referrer-Policy header. This can leak unnecessary URL information to other websites.",
      recommendation:
        "Add Referrer-Policy: strict-origin-when-cross-origin or a stricter policy based on business needs.",
      evidence: "Missing Referrer-Policy",
    });
  }

  if (!permissionsPolicy) {
    pushFinding(findings, {
      category: "privacy",
      severity: "low",
      title: "Permissions Policy is missing",
      description:
        "The website did not return a Permissions-Policy header to limit browser features such as camera, microphone, or geolocation.",
      recommendation:
        "Add a Permissions-Policy header that disables unused sensitive browser features.",
      evidence: "Missing Permissions-Policy",
    });
  }
}

function analyzeExposureHeaders(headers: Headers, findings: PassiveFinding[]) {
  const server = headerValue(headers, "server");
  const poweredBy = headerValue(headers, "x-powered-by");

  if (server) {
    pushFinding(findings, {
      category: "trust",
      severity: "low",
      title: "Server technology is exposed",
      description:
        "The public response exposes a Server header. This is common, but reducing version details can lower information exposure.",
      recommendation:
        "Ask the hosting provider or developer to hide unnecessary server version details where possible.",
      evidence: `Server: ${server}`,
    });
  }

  if (poweredBy) {
    pushFinding(findings, {
      category: "security",
      severity: "low",
      title: "X-Powered-By header is exposed",
      description:
        "The website exposes an X-Powered-By header. This can reveal framework or platform details.",
      recommendation:
        "Disable X-Powered-By or similar technology disclosure headers.",
      evidence: `X-Powered-By: ${poweredBy}`,
    });
  }
}

function analyzeCookies(headers: Headers, findings: PassiveFinding[], finalUrl: string) {
  const setCookie = headerValue(headers, "set-cookie");

  if (!setCookie) {
    return;
  }

  const lower = setCookie.toLowerCase();
  const isHttps = finalUrl.startsWith("https://");

  if (isHttps && !lower.includes("secure")) {
    pushFinding(findings, {
      category: "security",
      severity: "medium",
      title: "Cookie Secure flag may be missing",
      description:
        "The response sets cookies, but the Secure flag was not clearly visible in the Set-Cookie header.",
      recommendation:
        "Ensure sensitive cookies use the Secure flag so they are sent only over HTTPS.",
      evidence: "Set-Cookie without visible Secure flag",
    });
  }

  if (!lower.includes("httponly")) {
    pushFinding(findings, {
      category: "security",
      severity: "medium",
      title: "Cookie HttpOnly flag may be missing",
      description:
        "The response sets cookies, but the HttpOnly flag was not clearly visible.",
      recommendation:
        "Set HttpOnly on session or sensitive cookies to reduce client-side script access.",
      evidence: "Set-Cookie without visible HttpOnly flag",
    });
  }

  if (!lower.includes("samesite")) {
    pushFinding(findings, {
      category: "privacy",
      severity: "low",
      title: "Cookie SameSite attribute may be missing",
      description:
        "The response sets cookies, but SameSite was not clearly visible.",
      recommendation:
        "Use SameSite=Lax or SameSite=Strict for cookies where appropriate.",
      evidence: "Set-Cookie without visible SameSite attribute",
    });
  }
}

function analyzeHtmlSignals(body: string, findings: PassiveFinding[], finalUrl: string) {
  const lowerBody = body.toLowerCase();

  const hasPrivacy = bodyHasLinkLike(lowerBody, [
    /privacy-policy/,
    /privacy policy/,
    /href=["'][^"']*privacy/i,
    />\s*privacy\s*</i,
  ]);

  const hasTerms = bodyHasLinkLike(lowerBody, [
    /terms-of-service/,
    /terms and conditions/,
    /terms of service/,
    /href=["'][^"']*terms/i,
    />\s*terms\s*</i,
  ]);

  const hasContact = bodyHasLinkLike(lowerBody, [
    /contact us/,
    /href=["'][^"']*contact/i,
    />\s*contact\s*</i,
    /mailto:/i,
    /tel:/i,
  ]);

  if (!hasPrivacy) {
    pushFinding(findings, {
      category: "privacy",
      severity: "medium",
      title: "Privacy policy link was not clearly found",
      description:
        "The homepage HTML did not clearly show a privacy policy link or privacy policy text.",
      recommendation:
        "Add a visible privacy policy link in the website footer or main navigation.",
      evidence: "No clear privacy policy signal in homepage HTML",
    });
  }

  if (!hasTerms) {
    pushFinding(findings, {
      category: "trust",
      severity: "low",
      title: "Terms link was not clearly found",
      description:
        "The homepage HTML did not clearly show terms, terms of service, or terms and conditions.",
      recommendation:
        "Add a clear terms link if the website sells services, collects leads, or has user interactions.",
      evidence: "No clear terms signal in homepage HTML",
    });
  }

  if (!hasContact) {
    pushFinding(findings, {
      category: "trust",
      severity: "medium",
      title: "Contact signal was not clearly found",
      description:
        "The homepage HTML did not clearly show a contact link, email link, phone link, or contact wording.",
      recommendation:
        "Add a visible contact page, email, phone number, or contact form for customer trust.",
      evidence: "No clear contact signal in homepage HTML",
    });
  }

  if (finalUrl.startsWith("https://") && /(?:src|href)=["']http:\/\//i.test(body)) {
    pushFinding(findings, {
      category: "security",
      severity: "medium",
      title: "Possible mixed content signal found",
      description:
        "The HTTPS page appears to reference at least one HTTP resource in src or href attributes.",
      recommendation:
        "Change HTTP resource links to HTTPS where possible and verify the browser does not load insecure content.",
      evidence: "HTTP resource reference found in HTML",
    });
  }
}

async function checkPublicFile(
  origin: string,
  path: string
): Promise<{ ok: boolean; status?: number }> {
  try {
    const response = await fetchWithTimeout(`${origin}${path}`, {
      method: "GET",
    });

    return {
      ok: response.ok,
      status: response.status,
    };
  } catch {
    return { ok: false };
  }
}

async function analyzeRobotsAndSitemap(origin: string, findings: PassiveFinding[]) {
  const robots = await checkPublicFile(origin, "/robots.txt");

  if (!robots.ok) {
    pushFinding(findings, {
      category: "trust",
      severity: "low",
      title: "robots.txt was not found",
      description:
        "A public robots.txt file was not found or did not return a successful response.",
      recommendation:
        "Add a robots.txt file to guide search engine crawlers and reference the sitemap if available.",
      evidence: robots.status ? `robots.txt status ${robots.status}` : "robots.txt unavailable",
    });
  }

  const sitemap = await checkPublicFile(origin, "/sitemap.xml");
  const sitemapIndex = sitemap.ok ? sitemap : await checkPublicFile(origin, "/sitemap_index.xml");

  if (!sitemapIndex.ok) {
    pushFinding(findings, {
      category: "trust",
      severity: "low",
      title: "Sitemap was not found",
      description:
        "A public sitemap.xml or sitemap_index.xml file was not found.",
      recommendation:
        "Add a sitemap to help search engines discover important public pages.",
      evidence: sitemap.status ? `sitemap status ${sitemap.status}` : "sitemap unavailable",
    });
  }
}

async function buildFailureResult(targetUrl: string, message: string): Promise<PassiveScanResult> {
  const finding: PassiveFinding = {
    category: "trust",
    severity: "high",
    title: "Website could not be reached",
    description:
      "VeyraSec could not complete the safe passive request for this website.",
    recommendation:
      "Confirm the URL is correct, the website is online, and the server allows normal browser-style requests.",
    evidence: message,
  };

  const findings = [finding];
  const securityScore = calculateCategoryScore(findings, "security");
  const privacyScore = calculateCategoryScore(findings, "privacy");
  const trustScore = calculateCategoryScore(findings, "trust");
  const overallScore = Math.round(
    securityScore * 0.45 + privacyScore * 0.25 + trustScore * 0.3
  );
  const riskLevel = calculateRiskLevel(overallScore);

  return {
    targetUrl,
    websiteUrl: targetUrl,
    finalUrl: targetUrl,
    checkedAt: new Date().toISOString(),
    overallScore,
    securityScore,
    privacyScore,
    trustScore,
    riskLevel,
    summary:
      "VeyraSec V2 could not reach the website using safe passive checks. Confirm the URL and try again.",
    findings,
    raw: {
      status: "failed",
      errorMessage: message,
      targetUrl,
      scannerVersion: "V2",
    },
    overall_score: overallScore,
    security_score: securityScore,
    privacy_score: privacyScore,
    trust_score: trustScore,
    risk_level: riskLevel,
  };
}

export async function runPassiveScan(inputUrl: string): Promise<PassiveScanResult> {
  let targetUrl: string;

  try {
    targetUrl = normalizeTargetUrl(inputUrl);
  } catch (error) {
    return buildFailureResult(inputUrl, error instanceof Error ? error.message : "Invalid URL");
  }

  const findings: PassiveFinding[] = [];

  try {
    const response = await fetchWithTimeout(targetUrl, {
      method: "GET",
    });

    const finalUrl = response.url || targetUrl;
    const finalUrlObject = new URL(finalUrl);
    const origin = finalUrlObject.origin;

    if (!finalUrl.startsWith("https://")) {
      pushFinding(findings, {
        category: "security",
        severity: "high",
        title: "Website is not using HTTPS",
        description:
          "The final website URL did not use HTTPS. Visitors may not get encrypted transport protection.",
        recommendation:
          "Enable HTTPS with a valid TLS certificate and redirect HTTP traffic to HTTPS.",
        evidence: finalUrl,
      });
    }

    if (!response.ok) {
      pushFinding(findings, {
        category: "trust",
        severity: response.status >= 500 ? "high" : "medium",
        title: "Website returned an unsuccessful status",
        description:
          "The public homepage response did not return a normal successful HTTP status.",
        recommendation:
          "Ask the developer or hosting provider to review the website response status and availability.",
        evidence: `HTTP ${response.status}`,
      });
    }

    if (response.redirected && finalUrl !== targetUrl) {
      pushFinding(findings, {
        category: "trust",
        severity: "info",
        title: "Website redirected to final URL",
        description:
          "The website redirected from the submitted URL to a final destination. This is normal if configured intentionally.",
        recommendation:
          "Confirm the final URL is the correct canonical website address.",
        evidence: `${targetUrl} -> ${finalUrl}`,
      });
    }

    analyzeSecurityHeaders(response.headers, findings, finalUrl);
    analyzeExposureHeaders(response.headers, findings);
    analyzeCookies(response.headers, findings, finalUrl);

    let body = "";

    try {
      body = (await response.text()).slice(0, MAX_BODY_CHARS);
    } catch {
      body = "";
    }

    if (body && looksLikeHtml(response, body)) {
      analyzeHtmlSignals(body, findings, finalUrl);
    } else {
      pushFinding(findings, {
        category: "trust",
        severity: "low",
        title: "Homepage HTML was not clearly readable",
        description:
          "The public response did not look like normal readable HTML, so page trust signals were limited.",
        recommendation:
          "Confirm the homepage serves standard HTML for normal visitors and search engines.",
        evidence: headerValue(response.headers, "content-type") || "Unknown content type",
      });
    }

    await analyzeRobotsAndSitemap(origin, findings);

    const securityScore = calculateCategoryScore(findings, "security");
    const privacyScore = calculateCategoryScore(findings, "privacy");
    const trustScore = calculateCategoryScore(findings, "trust");
    const overallScore = Math.round(
      securityScore * 0.45 + privacyScore * 0.25 + trustScore * 0.3
    );
    const riskLevel = calculateRiskLevel(overallScore);

    const resultBase = {
      finalUrl,
      overallScore,
      securityScore,
      privacyScore,
      trustScore,
      findings,
    };

    return {
      targetUrl,
      websiteUrl: targetUrl,
      finalUrl,
      checkedAt: new Date().toISOString(),
      overallScore,
      securityScore,
      privacyScore,
      trustScore,
      riskLevel,
      summary: buildSummary(resultBase),
      findings,
      raw: {
        status: "completed",
        targetUrl,
        finalUrl,
        httpStatus: response.status,
        redirected: response.redirected,
        scannerVersion: "V2",
        checkedAt: new Date().toISOString(),
      },
      overall_score: overallScore,
      security_score: securityScore,
      privacy_score: privacyScore,
      trust_score: trustScore,
      risk_level: riskLevel,
    };
  } catch (error) {
    return buildFailureResult(
      targetUrl,
      error instanceof Error ? error.message : "Unknown fetch error"
    );
  }
}

// Aliases keep older imports working if previous code used another name.
export const runPassiveWebsiteScan = runPassiveScan;
export const scanWebsitePassively = runPassiveScan;
export const createPassiveScanReport = runPassiveScan;