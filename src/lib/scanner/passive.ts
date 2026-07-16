export type PassiveFindingSeverity = "high" | "medium" | "low" | "info";
export type PassiveFindingCategory = "security" | "privacy" | "trust";

export type ScoreDeduction = {
  category: PassiveFindingCategory;
  severity: PassiveFindingSeverity;
  title: string;
  points: number;
  reason: string;
};

export type PassiveFinding = {
  category: PassiveFindingCategory;
  severity: PassiveFindingSeverity;
  title: string;
  description: string;
  recommendation: string;
  evidence?: string;
  scoreImpact?: number;
};

export type ScoreBreakdown = {
  startingScore: number;
  securityDeductions: ScoreDeduction[];
  privacyDeductions: ScoreDeduction[];
  trustDeductions: ScoreDeduction[];
  securityScore: number;
  privacyScore: number;
  trustScore: number;
  overallScore: number;
  topReasons: string[];
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

  overall_score: number;
  security_score: number;
  privacy_score: number;
  trust_score: number;
  risk_level: "low" | "medium" | "high";
};

const USER_AGENT =
  "VeyraSec-V2-Passive-Readiness-Checker/2.1 (+safe passive website trust report)";

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

function pushFinding(findings: PassiveFinding[], finding: PassiveFinding) {
  const duplicate = findings.some(
    (item) =>
      item.title === finding.title && item.category === finding.category,
  );

  if (!duplicate) {
    findings.push(finding);
  }
}

function categoryWeight(
  category: PassiveFindingCategory,
  severity: PassiveFindingSeverity,
) {
  if (severity === "info") return 0;

  const weights: Record<
    PassiveFindingCategory,
    Record<Exclude<PassiveFindingSeverity, "info">, number>
  > = {
    security: {
      high: 24,
      medium: 13,
      low: 6,
    },
    privacy: {
      high: 20,
      medium: 12,
      low: 6,
    },
    trust: {
      high: 18,
      medium: 10,
      low: 5,
    },
  };

  return weights[category][severity];
}

function getScoreReason(finding: PassiveFinding) {
  const prefix =
    finding.category === "security"
      ? "Security"
      : finding.category === "privacy"
        ? "Privacy"
        : "Trust";

  return `${prefix}: ${finding.title}`;
}

function buildScoreBreakdown(findings: PassiveFinding[]): ScoreBreakdown {
  const deductions: ScoreDeduction[] = findings
    .filter((finding) => finding.severity !== "info")
    .map((finding) => {
      const points = categoryWeight(finding.category, finding.severity);

      finding.scoreImpact = points;

      return {
        category: finding.category,
        severity: finding.severity,
        title: finding.title,
        points,
        reason: getScoreReason(finding),
      };
    });

  const securityDeductions = deductions.filter(
    (item) => item.category === "security",
  );
  const privacyDeductions = deductions.filter(
    (item) => item.category === "privacy",
  );
  const trustDeductions = deductions.filter(
    (item) => item.category === "trust",
  );

  function categoryScore(categoryDeductions: ScoreDeduction[]) {
    const totalDeduction = categoryDeductions.reduce(
      (total, item) => total + item.points,
      0,
    );
    return Math.max(0, Math.min(100, 100 - totalDeduction));
  }

  const securityScore = categoryScore(securityDeductions);
  const privacyScore = categoryScore(privacyDeductions);
  const trustScore = categoryScore(trustDeductions);

  const overallScore = Math.round(
    securityScore * 0.45 + privacyScore * 0.25 + trustScore * 0.3,
  );

  const topReasons = [...deductions]
    .sort((a, b) => b.points - a.points)
    .slice(0, 5)
    .map((item) => `${item.reason} (-${item.points})`);

  return {
    startingScore: 100,
    securityDeductions,
    privacyDeductions,
    trustDeductions,
    securityScore,
    privacyScore,
    trustScore,
    overallScore,
    topReasons,
  };
}

function calculateRiskLevel(score: number): "low" | "medium" | "high" {
  if (score >= 80) return "low";
  if (score >= 60) return "medium";
  return "high";
}

function countSeverity(
  findings: PassiveFinding[],
  severity: PassiveFindingSeverity,
) {
  return findings.filter((finding) => finding.severity === severity).length;
}

function buildSummary(args: {
  finalUrl: string;
  scoreBreakdown: ScoreBreakdown;
  findings: PassiveFinding[];
}) {
  const high = countSeverity(args.findings, "high");
  const medium = countSeverity(args.findings, "medium");
  const low = countSeverity(args.findings, "low");

  const topReasonText =
    args.scoreBreakdown.topReasons.length > 0
      ? `Main score reasons: ${args.scoreBreakdown.topReasons.join("; ")}.`
      : "No major public readiness issues were detected by the passive checks.";

  return `VeyraSec reviewed ${args.finalUrl} using safe passive checks. Overall readiness is ${args.scoreBreakdown.overallScore}/100 with Security ${args.scoreBreakdown.securityScore}/100, Privacy ${args.scoreBreakdown.privacyScore}/100, and Trust ${args.scoreBreakdown.trustScore}/100. The scan found ${args.findings.length} finding(s): ${high} high, ${medium} medium, and ${low} low. ${topReasonText} This is a basic passive website trust report, not a full audit, legal advice, or penetration test.`;
}

function bodyHasLinkLike(body: string, patterns: RegExp[]) {
  return patterns.some((pattern) => pattern.test(body));
}

function looksLikeHtml(response: Response, body: string) {
  const contentType = headerValue(
    response.headers,
    "content-type",
  ).toLowerCase();
  return (
    contentType.includes("text/html") ||
    /<html|<!doctype html|<body/i.test(body)
  );
}

function analyzeSecurityHeaders(
  headers: Headers,
  findings: PassiveFinding[],
  finalUrl: string,
) {
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
        "Enable HSTS after confirming all pages and subdomains are ready for HTTPS.",
      evidence: "Missing Strict-Transport-Security",
    });
  }

  if (!csp) {
    pushFinding(findings, {
      category: "security",
      severity: "medium",
      title: "Content Security Policy is missing",
      description:
        "A Content-Security-Policy header was not visible. CSP helps reduce browser-side injection risk.",
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
        "The response did not clearly show X-Content-Type-Options: nosniff.",
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
        "Add Referrer-Policy: strict-origin-when-cross-origin or a stricter policy.",
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
      recommendation: "Hide unnecessary server version details where possible.",
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

function analyzeCookies(
  headers: Headers,
  findings: PassiveFinding[],
  finalUrl: string,
) {
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
        "The response sets cookies, but the Secure flag was not clearly visible.",
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

function analyzeHtmlSignals(
  body: string,
  findings: PassiveFinding[],
  finalUrl: string,
) {
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

  if (
    finalUrl.startsWith("https://") &&
    /(?:src|href)=["']http:\/\//i.test(body)
  ) {
    pushFinding(findings, {
      category: "security",
      severity: "medium",
      title: "Possible mixed content signal found",
      description:
        "The HTTPS page appears to reference at least one HTTP resource in src or href attributes.",
      recommendation:
        "Change HTTP resource links to HTTPS and verify the browser does not load insecure content.",
      evidence: "HTTP resource reference found in HTML",
    });
  }
}

async function checkPublicFile(origin: string, path: string) {
  try {
    const response = await fetchWithTimeout(`${origin}${path}`, {
      method: "GET",
    });

    return {
      ok: response.ok,
      status: response.status,
    };
  } catch {
    return { ok: false, status: undefined };
  }
}

async function analyzeRobotsAndSitemap(
  origin: string,
  findings: PassiveFinding[],
) {
  const robots = await checkPublicFile(origin, "/robots.txt");

  if (!robots.ok) {
    pushFinding(findings, {
      category: "trust",
      severity: "low",
      title: "robots.txt was not found",
      description:
        "A public robots.txt file was not found or did not return a successful response.",
      recommendation:
        "Add a robots.txt file to guide search engines and reference the sitemap if available.",
      evidence: robots.status
        ? `robots.txt status ${robots.status}`
        : "robots.txt unavailable",
    });
  }

  const sitemap = await checkPublicFile(origin, "/sitemap.xml");
  const sitemapIndex = sitemap.ok
    ? sitemap
    : await checkPublicFile(origin, "/sitemap_index.xml");

  if (!sitemapIndex.ok) {
    pushFinding(findings, {
      category: "trust",
      severity: "low",
      title: "Sitemap was not found",
      description:
        "A public sitemap.xml or sitemap_index.xml file was not found.",
      recommendation:
        "Add a sitemap to help search engines discover important public pages.",
      evidence: sitemap.status
        ? `sitemap status ${sitemap.status}`
        : "sitemap unavailable",
    });
  }
}

function buildFailureResult(
  targetUrl: string,
  message: string,
): PassiveScanResult {
  const findings: PassiveFinding[] = [
    {
      category: "trust",
      severity: "high",
      title: "Website could not be reached",
      description:
        "VeyraSec could not complete the safe passive request for this website.",
      recommendation:
        "Confirm the URL is correct, the website is online, and the server allows normal browser-style requests.",
      evidence: message,
    },
  ];

  const scoreBreakdown = buildScoreBreakdown(findings);
  const riskLevel = calculateRiskLevel(scoreBreakdown.overallScore);

  return {
    targetUrl,
    websiteUrl: targetUrl,
    finalUrl: targetUrl,
    checkedAt: new Date().toISOString(),
    overallScore: scoreBreakdown.overallScore,
    securityScore: scoreBreakdown.securityScore,
    privacyScore: scoreBreakdown.privacyScore,
    trustScore: scoreBreakdown.trustScore,
    riskLevel,
    summary:
      "VeyraSec V2 could not reach the website using safe passive checks. Confirm the URL and try again.",
    findings,
    raw: {
      status: "failed",
      errorMessage: message,
      targetUrl,
      scoreBreakdown,
      scannerVersion: "V2.1",
    },
    overall_score: scoreBreakdown.overallScore,
    security_score: scoreBreakdown.securityScore,
    privacy_score: scoreBreakdown.privacyScore,
    trust_score: scoreBreakdown.trustScore,
    risk_level: riskLevel,
  };
}

export async function runPassiveScan(
  inputUrl: string,
): Promise<PassiveScanResult> {
  let targetUrl: string;

  try {
    targetUrl = normalizeTargetUrl(inputUrl);
  } catch (error) {
    return buildFailureResult(
      inputUrl,
      error instanceof Error ? error.message : "Invalid URL",
    );
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
          "Ask the developer or hosting provider to review website availability and response status.",
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
        evidence:
          headerValue(response.headers, "content-type") ||
          "Unknown content type",
      });
    }

    await analyzeRobotsAndSitemap(origin, findings);

    const scoreBreakdown = buildScoreBreakdown(findings);
    const riskLevel = calculateRiskLevel(scoreBreakdown.overallScore);

    const summary = buildSummary({
      finalUrl,
      scoreBreakdown,
      findings,
    });

    const checkedAt = new Date().toISOString();

    return {
      targetUrl,
      websiteUrl: targetUrl,
      finalUrl,
      checkedAt,
      overallScore: scoreBreakdown.overallScore,
      securityScore: scoreBreakdown.securityScore,
      privacyScore: scoreBreakdown.privacyScore,
      trustScore: scoreBreakdown.trustScore,
      riskLevel,
      summary,
      findings,
      raw: {
        status: "completed",
        targetUrl,
        finalUrl,
        httpStatus: response.status,
        redirected: response.redirected,
        scannerVersion: "V2.1",
        checkedAt,
        scoreBreakdown,
        scoreReasons: scoreBreakdown.topReasons,
        severityCounts: {
          high: countSeverity(findings, "high"),
          medium: countSeverity(findings, "medium"),
          low: countSeverity(findings, "low"),
          info: countSeverity(findings, "info"),
        },
      },
      overall_score: scoreBreakdown.overallScore,
      security_score: scoreBreakdown.securityScore,
      privacy_score: scoreBreakdown.privacyScore,
      trust_score: scoreBreakdown.trustScore,
      risk_level: riskLevel,
    };
  } catch (error) {
    return buildFailureResult(
      targetUrl,
      error instanceof Error ? error.message : "Unknown fetch error",
    );
  }
}

export const runPassiveWebsiteScan = runPassiveScan;
export const scanWebsitePassively = runPassiveScan;
export const createPassiveScanReport = runPassiveScan;


