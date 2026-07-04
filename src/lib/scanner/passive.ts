import { normalizeWebsiteUrl } from "@/lib/utils/url";

type Severity = "critical" | "high" | "medium" | "low" | "info";

export type PassiveFinding = {
  category: string;
  severity: Severity;
  title: string;
  description: string;
  recommendation: string;
  evidence?: Record<string, unknown>;
};

type HeaderCheck = {
  header: string;
  label: string;
  severity: Severity;
  recommendation: string;
};

const SECURITY_HEADERS: HeaderCheck[] = [
  {
    header: "strict-transport-security",
    label: "HTTP Strict Transport Security header is missing",
    severity: "medium",
    recommendation:
      "Ask the developer to add a suitable Strict-Transport-Security header for HTTPS protection.",
  },
  {
    header: "content-security-policy",
    label: "Content Security Policy header is missing",
    severity: "medium",
    recommendation:
      "Ask the developer to add a Content-Security-Policy header to reduce browser-side attack risk.",
  },
  {
    header: "x-frame-options",
    label: "X-Frame-Options header is missing",
    severity: "low",
    recommendation:
      "Add X-Frame-Options or a frame-ancestors CSP rule to reduce clickjacking risk.",
  },
  {
    header: "x-content-type-options",
    label: "X-Content-Type-Options header is missing",
    severity: "low",
    recommendation:
      "Add X-Content-Type-Options: nosniff to reduce MIME-sniffing risks.",
  },
  {
    header: "referrer-policy",
    label: "Referrer-Policy header is missing",
    severity: "low",
    recommendation:
      "Add a Referrer-Policy header such as strict-origin-when-cross-origin.",
  },
  {
    header: "permissions-policy",
    label: "Permissions-Policy header is missing",
    severity: "info",
    recommendation:
      "Add a Permissions-Policy header to limit browser features like camera, microphone, and geolocation.",
  },
];

function hasText(html: string, patterns: RegExp[]) {
  return patterns.some((pattern) => pattern.test(html));
}

async function fetchText(url: string, timeoutMs = 8000) {
  const response = await fetch(url, {
    method: "GET",
    redirect: "follow",
    signal: AbortSignal.timeout(timeoutMs),
    headers: {
      "User-Agent": "VeyraSec-V1 Passive-Readiness-Check",
      Accept: "text/html,text/plain,application/xhtml+xml",
    },
  });

  const text = await response.text();

  return {
    ok: response.ok,
    status: response.status,
    finalUrl: response.url,
    headers: response.headers,
    text,
  };
}

async function resourceExists(url: string) {
  try {
    const response = await fetch(url, {
      method: "GET",
      redirect: "follow",
      signal: AbortSignal.timeout(5000),
      headers: {
        "User-Agent": "VeyraSec-V1 Passive-Readiness-Check",
        Accept: "text/plain,text/xml,application/xml,text/html",
      },
    });

    return response.ok;
  } catch {
    return false;
  }
}

function calculateRiskLevel(score: number) {
  if (score >= 80) return "good";
  if (score >= 60) return "needs_improvement";
  if (score >= 40) return "risky";
  return "high_risk";
}

function clampScore(score: number) {
  return Math.max(0, Math.min(100, Math.round(score)));
}

export async function runPassiveScan(inputUrl: string) {
  const normalized = normalizeWebsiteUrl(inputUrl);
  const homepage = await fetchText(normalized.url);
  const html = homepage.text;

  const findings: PassiveFinding[] = [];

  let securityScore = 100;
  let privacyScore = 100;
  let trustScore = 100;

  const pageUrl = new URL(homepage.finalUrl || normalized.url);
  const origin = pageUrl.origin;

  const usesHttps = pageUrl.protocol === "https:";

  if (!usesHttps) {
    securityScore -= 25;
    findings.push({
      category: "security",
      severity: "high",
      title: "Website is not using HTTPS",
      description:
        "The final website URL is not using HTTPS. This can reduce customer trust and expose data in transit.",
      recommendation:
        "Enable HTTPS using a valid SSL/TLS certificate and redirect HTTP traffic to HTTPS.",
      evidence: {
        finalUrl: homepage.finalUrl,
      },
    });
  }

  if (!homepage.ok) {
    trustScore -= 20;
    findings.push({
      category: "trust",
      severity: "medium",
      title: "Homepage returned an unsuccessful status code",
      description:
        "The homepage did not return a normal successful response during the passive check.",
      recommendation:
        "Ask the website developer or hosting provider to check the homepage response status.",
      evidence: {
        status: homepage.status,
        finalUrl: homepage.finalUrl,
      },
    });
  }

  for (const check of SECURITY_HEADERS) {
    const value = homepage.headers.get(check.header);

    if (!value) {
      if (check.severity === "medium") securityScore -= 10;
      if (check.severity === "low") securityScore -= 6;
      if (check.severity === "info") securityScore -= 2;

      findings.push({
        category: "security_headers",
        severity: check.severity,
        title: check.label,
        description:
          "This passive check did not find the header in the homepage HTTP response.",
        recommendation: check.recommendation,
        evidence: {
          header: check.header,
          present: false,
        },
      });
    }
  }

  const hasPrivacyPolicy = hasText(html, [
    /privacy\s*policy/i,
    /privacy-policy/i,
    /privacy_policy/i,
    /privacy/i,
  ]);

  if (!hasPrivacyPolicy) {
    privacyScore -= 25;
    findings.push({
      category: "privacy",
      severity: "medium",
      title: "Privacy policy link or text was not clearly detected",
      description:
        "The homepage did not clearly show a privacy policy reference during this passive check.",
      recommendation:
        "Add a clear Privacy Policy link in the footer or near forms that collect personal data.",
      evidence: {
        detected: false,
      },
    });
  }

  const hasTerms = hasText(html, [
    /terms\s*of\s*service/i,
    /terms\s*&\s*conditions/i,
    /terms\s*and\s*conditions/i,
    /\/terms/i,
  ]);

  if (!hasTerms) {
    trustScore -= 8;
    findings.push({
      category: "trust",
      severity: "low",
      title: "Terms page was not clearly detected",
      description:
        "The homepage did not clearly show terms or conditions during this passive check.",
      recommendation:
        "Add a clear Terms or Terms & Conditions link if the website offers services, payments, or lead collection.",
      evidence: {
        detected: false,
      },
    });
  }

  const hasForm = /<form[\s\S]*?>[\s\S]*?<\/form>/i.test(html);
  const formCollectsPersonalData =
    /name=["']?(email|phone|mobile|name|full_name|message|contact)/i.test(html) ||
    /type=["']?(email|tel)/i.test(html);

  if (hasForm && formCollectsPersonalData && !hasPrivacyPolicy) {
    privacyScore -= 20;
    findings.push({
      category: "forms",
      severity: "high",
      title: "Contact form may collect personal data without visible privacy context",
      description:
        "A form appears to collect personal data, but a clear privacy policy reference was not detected on the homepage.",
      recommendation:
        "Add privacy wording near forms and link to a clear Privacy Policy explaining how submitted data is used.",
      evidence: {
        hasForm,
        formCollectsPersonalData,
      },
    });
  } else if (hasForm) {
    findings.push({
      category: "forms",
      severity: "info",
      title: "Contact form detected",
      description:
        "A form was detected. This is normal, but the business should ensure privacy wording is clear.",
      recommendation:
        "Review the form and make sure users understand how their data will be used.",
      evidence: {
        hasForm,
      },
    });
  }

  const hasCookieSignal = hasText(html, [/cookie/i, /consent/i, /gdpr/i]);

  if (!hasCookieSignal) {
    privacyScore -= 5;
    findings.push({
      category: "privacy",
      severity: "info",
      title: "Cookie or consent wording was not detected",
      description:
        "The homepage did not show obvious cookie or consent wording during this passive check.",
      recommendation:
        "If the website uses tracking, analytics, or advertising cookies, review whether a cookie notice is needed.",
      evidence: {
        detected: false,
      },
    });
  }

  const robotsExists = await resourceExists(`${origin}/robots.txt`);
  const sitemapExists = await resourceExists(`${origin}/sitemap.xml`);

  if (!robotsExists) {
    trustScore -= 4;
    findings.push({
      category: "trust",
      severity: "info",
      title: "robots.txt was not found",
      description:
        "robots.txt was not found at the standard location. This is not always a security issue.",
      recommendation:
        "Add a basic robots.txt file if the website needs crawler guidance.",
      evidence: {
        url: `${origin}/robots.txt`,
      },
    });
  }

  if (!sitemapExists) {
    trustScore -= 4;
    findings.push({
      category: "trust",
      severity: "info",
      title: "sitemap.xml was not found",
      description:
        "sitemap.xml was not found at the standard location. This can affect discoverability and website hygiene.",
      recommendation:
        "Add a sitemap.xml file if the website has multiple public pages.",
      evidence: {
        url: `${origin}/sitemap.xml`,
      },
    });
  }

  securityScore = clampScore(securityScore);
  privacyScore = clampScore(privacyScore);
  trustScore = clampScore(trustScore);

  const overallScore = clampScore((securityScore + privacyScore + trustScore) / 3);
  const riskLevel = calculateRiskLevel(overallScore);

  const summary =
    overallScore >= 80
      ? "This website shows a good basic security and privacy readiness posture based on passive checks."
      : overallScore >= 60
        ? "This website is usable but has several security, privacy, or trust improvements to address."
        : overallScore >= 40
          ? "This website has multiple readiness gaps that should be reviewed by the owner or developer."
          : "This website has significant basic readiness gaps based on passive checks.";

  return {
    url: normalized.url,
    domain: normalized.domain,
    overallScore,
    securityScore,
    privacyScore,
    trustScore,
    riskLevel,
    summary,
    findings,
    raw: {
      requestedUrl: inputUrl,
      normalizedUrl: normalized.url,
      finalUrl: homepage.finalUrl,
      status: homepage.status,
      robotsExists,
      sitemapExists,
      checkedAt: new Date().toISOString(),
      passiveOnly: true,
    },
  };
}
