import {
  detectTechnologySignals,
  technologyFindingsFromSignals,
} from "./technology-detection";
import { knownRiskFindingsFromTechnology } from "./known-risk-intelligence";
import { runSafeSameDomainCrawler } from "./safe-crawler";

export type PassiveCheckSeverity = "info" | "low" | "medium" | "high" | "critical";

export type PassiveCheckFinding = {
  id: string;
  title: string;
  description: string;
  category: string;
  severity: PassiveCheckSeverity;
  risk_level: PassiveCheckSeverity;
  evidence: string;
  recommendation: string;
};

export type AdvancedPassiveScanResult = {
  checkedUrl: string;
  normalizedUrl: string;
  host: string;
  findings: PassiveCheckFinding[];
  raw: {
    checkedAt: string;
    requests: {
      target: string;
      httpProbe?: string;
      securityTxt?: string;
      robotsTxt?: string;
      sitemapXml?: string;
    };
    signals: Record<string, unknown>;
  };
};

type FetchResult = {
  ok: boolean;
  url: string;
  status: number | null;
  redirected: boolean;
  finalUrl: string;
  headers: Headers | null;
  body: string;
  error?: string;
};

const USER_AGENT = "VeyraSec-Passive-Check/1.0 (+passive-security-posture)";

function normalizeInputUrl(input: string) {
  const trimmed = String(input || "").trim();

  if (!trimmed) {
    throw new Error("Website URL is required.");
  }

  const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  const url = new URL(withProtocol);

  url.hash = "";

  return url;
}

function sameOriginUrl(base: URL, path: string) {
  return new URL(path, `${base.protocol}//${base.host}`).toString();
}

function finding(
  id: string,
  title: string,
  severity: PassiveCheckSeverity,
  category: string,
  evidence: string,
  recommendation: string,
  description?: string
): PassiveCheckFinding {
  return {
    id,
    title,
    severity,
    risk_level: severity,
    category,
    evidence,
    recommendation,
    description:
      description ||
      `${title}. This passive check reviews visible public website security posture signals only.`,
  };
}

function headerValue(headers: Headers | null, name: string) {
  return headers?.get(name) || "";
}

function hasHeader(headers: Headers | null, name: string) {
  return headerValue(headers, name).trim().length > 0;
}

function hasText(body: string, patterns: RegExp[]) {
  return patterns.some((pattern) => pattern.test(body));
}

function getSetCookieHeader(headers: Headers | null) {
  if (!headers) {
    return "";
  }

  const maybeHeaders = headers as Headers & {
    getSetCookie?: () => string[];
  };

  if (typeof maybeHeaders.getSetCookie === "function") {
    return maybeHeaders.getSetCookie().join("\n");
  }

  return headers.get("set-cookie") || "";
}

async function fetchWithTimeout(url: string, options?: RequestInit, timeoutMs = 8000): Promise<FetchResult> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        "user-agent": USER_AGENT,
        accept: "text/html, text/plain, */*",
        ...(options?.headers || {}),
      },
      redirect: "follow",
      signal: controller.signal,
    });

    let body = "";

    const contentType = response.headers.get("content-type") || "";

    if (
      contentType.includes("text/") ||
      contentType.includes("html") ||
      contentType.includes("json") ||
      contentType.length === 0
    ) {
      body = await response.text();
      body = body.slice(0, 250000);
    }

    return {
      ok: response.ok,
      url,
      status: response.status,
      redirected: response.redirected,
      finalUrl: response.url,
      headers: response.headers,
      body,
    };
  } catch (error) {
    return {
      ok: false,
      url,
      status: null,
      redirected: false,
      finalUrl: url,
      headers: null,
      body: "",
      error: error instanceof Error ? error.message : "Request failed",
    };
  } finally {
    clearTimeout(timer);
  }
}

function checkHttps(url: URL, result: FetchResult, findings: PassiveCheckFinding[]) {
  if (url.protocol !== "https:") {
    findings.push(
      finding(
        "site_not_https",
        "Website URL is not using HTTPS",
        "high",
        "https_tls",
        `Checked URL: ${url.toString()}`,
        "Use HTTPS as the default public website URL.",
        "The checked website URL does not start with HTTPS. HTTPS protects traffic integrity and customer trust."
      )
    );
  }

  if (url.protocol === "https:" && result.ok) {
    return;
  }

  if (url.protocol === "https:" && !result.ok) {
    findings.push(
      finding(
        "https_unavailable",
        "HTTPS page could not be reached successfully",
        "high",
        "https_tls",
        `Checked URL: ${url.toString()}\nStatus: ${result.status ?? "no status"}\nError: ${result.error || "none"}`,
        "Ask your hosting provider or developer to verify TLS certificate, DNS, and HTTPS configuration.",
        "The HTTPS version of the website did not respond successfully during this passive check."
      )
    );
  }
}

function checkHttpRedirect(url: URL, result: FetchResult, findings: PassiveCheckFinding[]) {
  const finalUrl = result.finalUrl || "";
  const redirectedToHttps = finalUrl.toLowerCase().startsWith("https://");

  if (!result.ok && !result.redirected) {
    findings.push(
      finding(
        "http_probe_failed",
        "HTTP redirect check could not confirm HTTPS upgrade",
        "low",
        "https_tls",
        `HTTP probe: ${result.url}\nStatus: ${result.status ?? "no status"}\nError: ${result.error || "none"}`,
        "Confirm that HTTP requests redirect to HTTPS.",
        "VeyraSec could not confirm that the HTTP version upgrades visitors to HTTPS."
      )
    );

    return;
  }

  if (!redirectedToHttps) {
    findings.push(
      finding(
        "missing_http_to_https_redirect",
        "HTTP does not clearly redirect to HTTPS",
        "medium",
        "https_tls",
        `HTTP probe: ${result.url}\nFinal URL: ${finalUrl}\nStatus: ${result.status ?? "no status"}`,
        "Configure the website or CDN to redirect all HTTP traffic to HTTPS.",
        "Visitors using an HTTP link may not be automatically upgraded to HTTPS."
      )
    );
  }
}

function checkSecurityHeaders(result: FetchResult, findings: PassiveCheckFinding[]) {
  const headers = result.headers;

  if (!hasHeader(headers, "strict-transport-security")) {
    findings.push(
      finding(
        "missing_hsts",
        "Missing Strict-Transport-Security header",
        "medium",
        "security_headers",
        `Header checked: Strict-Transport-Security\nResult: missing`,
        "Add an HSTS header after confirming HTTPS is stable across the site.",
        "The website does not advertise HSTS, which helps browsers enforce HTTPS for future visits."
      )
    );
  }

  if (!hasHeader(headers, "content-security-policy")) {
    findings.push(
      finding(
        "missing_csp",
        "Missing Content-Security-Policy header",
        "medium",
        "security_headers",
        `Header checked: Content-Security-Policy\nResult: missing`,
        "Add a Content-Security-Policy appropriate for your website and test it carefully before enforcing.",
        "A Content-Security-Policy can reduce the impact of injected or unexpected scripts when configured correctly."
      )
    );
  }

  if (!hasHeader(headers, "x-frame-options") && !headerValue(headers, "content-security-policy").toLowerCase().includes("frame-ancestors")) {
    findings.push(
      finding(
        "missing_x_frame_options",
        "Missing clickjacking protection header",
        "medium",
        "security_headers",
        `Headers checked: X-Frame-Options and CSP frame-ancestors\nResult: missing`,
        "Add X-Frame-Options or CSP frame-ancestors to control where the site can be framed.",
        "The website does not show a visible frame protection policy in response headers."
      )
    );
  }

  if (!hasHeader(headers, "x-content-type-options")) {
    findings.push(
      finding(
        "missing_x_content_type_options",
        "Missing X-Content-Type-Options header",
        "low",
        "security_headers",
        `Header checked: X-Content-Type-Options\nResult: missing`,
        "Add X-Content-Type-Options: nosniff.",
        "The website does not send a visible nosniff header."
      )
    );
  }

  if (!hasHeader(headers, "referrer-policy")) {
    findings.push(
      finding(
        "missing_referrer_policy",
        "Missing Referrer-Policy header",
        "low",
        "privacy",
        `Header checked: Referrer-Policy\nResult: missing`,
        "Add a Referrer-Policy header such as strict-origin-when-cross-origin.",
        "The website does not declare a visible referrer policy, which can affect privacy posture."
      )
    );
  }

  if (!hasHeader(headers, "permissions-policy")) {
    findings.push(
      finding(
        "missing_permissions_policy",
        "Missing Permissions-Policy header",
        "low",
        "privacy",
        `Header checked: Permissions-Policy\nResult: missing`,
        "Add a Permissions-Policy header to limit browser features that the site does not need.",
        "The website does not declare a visible browser permissions policy."
      )
    );
  }
}

function checkCookies(result: FetchResult, findings: PassiveCheckFinding[]) {
  const setCookie = getSetCookieHeader(result.headers);

  if (!setCookie) {
    return;
  }

  const lower = setCookie.toLowerCase();

  if (!lower.includes("secure")) {
    findings.push(
      finding(
        "cookie_missing_secure",
        "Cookie without visible Secure attribute",
        "medium",
        "cookies",
        `Set-Cookie observed without clear Secure attribute:\n${setCookie.slice(0, 1200)}`,
        "Set Secure on cookies that should only be sent over HTTPS.",
        "At least one visible cookie does not clearly include the Secure attribute."
      )
    );
  }

  if (!lower.includes("httponly")) {
    findings.push(
      finding(
        "cookie_missing_httponly",
        "Cookie without visible HttpOnly attribute",
        "medium",
        "cookies",
        `Set-Cookie observed without clear HttpOnly attribute:\n${setCookie.slice(0, 1200)}`,
        "Set HttpOnly on session or sensitive cookies where JavaScript access is not required.",
        "At least one visible cookie does not clearly include the HttpOnly attribute."
      )
    );
  }

  if (!lower.includes("samesite")) {
    findings.push(
      finding(
        "cookie_missing_samesite",
        "Cookie without visible SameSite attribute",
        "low",
        "cookies",
        `Set-Cookie observed without clear SameSite attribute:\n${setCookie.slice(0, 1200)}`,
        "Set SameSite=Lax or SameSite=Strict where appropriate for your website.",
        "At least one visible cookie does not clearly include a SameSite attribute."
      )
    );
  }
}

function checkContentSignals(url: URL, result: FetchResult, findings: PassiveCheckFinding[]) {
  const body = result.body || "";
  const lowerBody = body.toLowerCase();

  if (!body) {
    findings.push(
      finding(
        "homepage_body_unavailable",
        "Homepage body could not be reviewed",
        "low",
        "availability",
        `Checked URL: ${url.toString()}\nStatus: ${result.status ?? "no status"}`,
        "Confirm the homepage returns readable HTML to public visitors.",
        "The passive scanner could not review the homepage body for trust and privacy signals."
      )
    );

    return;
  }

  const hasPrivacy = hasText(lowerBody, [
    /privacy\s*policy/i,
    /\/privacy/i,
    /data\s*protection/i,
  ]);

  if (!hasPrivacy) {
    findings.push(
      finding(
        "missing_privacy_policy",
        "Privacy policy signal not found on homepage",
        "medium",
        "privacy",
        `Homepage reviewed: ${url.toString()}\nSignal searched: privacy policy link/text`,
        "Add a clearly visible privacy policy link, especially if the website collects personal data.",
        "The homepage does not show an obvious privacy policy signal in visible HTML."
      )
    );
  }

  const hasContact = hasText(lowerBody, [
    /contact/i,
    /support/i,
    /mailto:/i,
    /tel:/i,
    /whatsapp/i,
  ]);

  if (!hasContact) {
    findings.push(
      finding(
        "missing_contact_trust",
        "Contact or support signal not found on homepage",
        "low",
        "trust_signals",
        `Homepage reviewed: ${url.toString()}\nSignal searched: contact/support/mail/phone`,
        "Add a clear contact, support, or business identity signal for visitors.",
        "The homepage does not show an obvious contact or support trust signal in visible HTML."
      )
    );
  }

  if (url.protocol === "https:" && /src=["']http:\/\//i.test(body)) {
    findings.push(
      finding(
        "mixed_content_script_or_asset",
        "Possible mixed content reference found",
        "medium",
        "content",
        `Homepage reviewed: ${url.toString()}\nSignal: HTML contains src=\"http://...\"`,
        "Update HTTP asset references to HTTPS or remove the insecure asset.",
        "The HTTPS page appears to reference at least one HTTP asset in visible HTML."
      )
    );
  }

  const externalScriptCount = (body.match(/<script\b[^>]*\bsrc=/gi) || []).length;

  if (externalScriptCount >= 20) {
    findings.push(
      finding(
        "high_external_script_count",
        "High script count observed on homepage",
        "low",
        "technology",
        `Homepage reviewed: ${url.toString()}\nScript tags with src observed: ${externalScriptCount}`,
        "Review third-party scripts and remove unused scripts to reduce attack surface and improve performance.",
        "The homepage loads a high number of script references, which can increase dependency and supply-chain exposure."
      )
    );
  }
}

function checkWellKnownFile(
  id: string,
  title: string,
  category: string,
  url: string,
  result: FetchResult,
  findings: PassiveCheckFinding[],
  recommendation: string,
  description: string
) {
  if (!result.ok || !result.body.trim()) {
    findings.push(
      finding(
        id,
        title,
        "low",
        category,
        `Checked: ${url}\nStatus: ${result.status ?? "no status"}\nError: ${result.error || "none"}`,
        recommendation,
        description
      )
    );
  }
}

export async function runAdvancedPassiveSecurityChecks(inputUrl: string): Promise<AdvancedPassiveScanResult> {
  const normalized = normalizeInputUrl(inputUrl);
  const findings: PassiveCheckFinding[] = [];

  const targetResult = await fetchWithTimeout(normalized.toString());

  const httpUrl = new URL(normalized.toString());
  httpUrl.protocol = "http:";

  const httpResult = await fetchWithTimeout(httpUrl.toString(), {}, 8000);

  const securityTxtUrl = sameOriginUrl(normalized, "/.well-known/security.txt");
  const robotsTxtUrl = sameOriginUrl(normalized, "/robots.txt");
  const sitemapXmlUrl = sameOriginUrl(normalized, "/sitemap.xml");

  const [securityTxtResult, robotsTxtResult, sitemapXmlResult] = await Promise.all([
    fetchWithTimeout(securityTxtUrl, {}, 6000),
    fetchWithTimeout(robotsTxtUrl, {}, 6000),
    fetchWithTimeout(sitemapXmlUrl, {}, 6000),
  ]);

  const technologyDetection = detectTechnologySignals({
    url: normalized.toString(),
    finalUrl: targetResult.finalUrl,
    headers: targetResult.headers,
    body: targetResult.body,
  });

  findings.push(...technologyFindingsFromSignals(technologyDetection));
  findings.push(...knownRiskFindingsFromTechnology(technologyDetection));

  const safeCrawlerResult = await runSafeSameDomainCrawler(normalized.toString(), {
    maxPages: 6,
  });

  findings.push(...safeCrawlerResult.findings);

  checkHttps(normalized, targetResult, findings);
  checkHttpRedirect(normalized, httpResult, findings);
  checkSecurityHeaders(targetResult, findings);
  checkCookies(targetResult, findings);
  checkContentSignals(normalized, targetResult, findings);

  checkWellKnownFile(
    "missing_security_txt",
    "security.txt file not found",
    "trust_signals",
    securityTxtUrl,
    securityTxtResult,
    findings,
    "Consider publishing /.well-known/security.txt with a security contact and disclosure policy.",
    "A security.txt file helps security researchers and responsible reporters find the right contact path."
  );

  checkWellKnownFile(
    "missing_robots_txt",
    "robots.txt file not found",
    "content",
    robotsTxtUrl,
    robotsTxtResult,
    findings,
    "Add a robots.txt file if the website needs crawler guidance.",
    "robots.txt is not a security control, but it is a useful public website hygiene signal."
  );

  checkWellKnownFile(
    "missing_sitemap_xml",
    "sitemap.xml file not found",
    "content",
    sitemapXmlUrl,
    sitemapXmlResult,
    findings,
    "Add sitemap.xml if search engines and site discovery should be guided.",
    "sitemap.xml is not a security control, but it helps public site discoverability and content hygiene."
  );

  return {
    checkedUrl: inputUrl,
    normalizedUrl: normalized.toString(),
    host: normalized.host,
    findings,
    raw: {
      checkedAt: new Date().toISOString(),
      requests: {
        target: normalized.toString(),
        httpProbe: httpUrl.toString(),
        securityTxt: securityTxtUrl,
        robotsTxt: robotsTxtUrl,
        sitemapXml: sitemapXmlUrl,
      },
      signals: {
        targetStatus: targetResult.status,
        targetFinalUrl: targetResult.finalUrl,
        httpStatus: httpResult.status,
        httpFinalUrl: httpResult.finalUrl,
        hasHsts: hasHeader(targetResult.headers, "strict-transport-security"),
        hasCsp: hasHeader(targetResult.headers, "content-security-policy"),
        hasXFrameOptions: hasHeader(targetResult.headers, "x-frame-options"),
        hasXContentTypeOptions: hasHeader(targetResult.headers, "x-content-type-options"),
        hasReferrerPolicy: hasHeader(targetResult.headers, "referrer-policy"),
        hasPermissionsPolicy: hasHeader(targetResult.headers, "permissions-policy"),
        hasCookies: Boolean(getSetCookieHeader(targetResult.headers)),
        securityTxtStatus: securityTxtResult.status,
        robotsTxtStatus: robotsTxtResult.status,
        sitemapXmlStatus: sitemapXmlResult.status,
        findingCount: findings.length,
        technologySummary: technologyDetection.summary,
        technologyDetection: technologyDetection.raw,
        knownRiskFindingCount: knownRiskFindingsFromTechnology(technologyDetection).length,
        safeCrawlerSummary: safeCrawlerResult.summary,
        safeCrawlerPages: safeCrawlerResult.pages,
      },
    },
  };
}