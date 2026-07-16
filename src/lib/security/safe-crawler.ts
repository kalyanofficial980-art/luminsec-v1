export type CrawlerFindingSeverity =
  "info" | "low" | "medium" | "high" | "critical";

export type SafeCrawlerFinding = {
  id: string;
  title: string;
  description: string;
  category: string;
  severity: CrawlerFindingSeverity;
  risk_level: CrawlerFindingSeverity;
  evidence: string;
  recommendation: string;
};

export type CrawledPageSignal = {
  url: string;
  status: number | null;
  title: string;
  hasPrivacySignal: boolean;
  hasContactSignal: boolean;
  formCount: number;
  passwordFieldCount: number;
  insecureAssetCount: number;
  insecureLinkCount: number;
  externalScriptCount: number;
  blankTargetWithoutRelCount: number;
  internalLinksFound: number;
  error?: string;
};

export type SafeCrawlerResult = {
  startUrl: string;
  origin: string;
  pages: CrawledPageSignal[];
  findings: SafeCrawlerFinding[];
  summary: {
    maxPages: number;
    crawledPages: number;
    discoveredInternalLinks: number;
    pagesWithForms: number;
    pagesWithPasswordFields: number;
    pagesWithMixedContent: number;
    pagesWithInsecureLinks: number;
    pagesWithBlankTargetWithoutRel: number;
    pagesWithErrors: number;
    privacySignalFound: boolean;
    contactSignalFound: boolean;
    stoppedReason: string;
  };
};

type FetchResult = {
  ok: boolean;
  url: string;
  finalUrl: string;
  status: number | null;
  body: string;
  error?: string;
};

const USER_AGENT = "VeyraSec-SafeCrawler/1.0 (+same-domain-public-pages-only)";
const DEFAULT_MAX_PAGES = 6;
const REQUEST_TIMEOUT_MS = 4000;
const MAX_SCAN_TIME_MS = 14000;

function normalizeInputUrl(input: string) {
  const trimmed = String(input || "").trim();

  if (!trimmed) {
    throw new Error("Website URL is required.");
  }

  const withProtocol = /^https?:\/\//i.test(trimmed)
    ? trimmed
    : `https://${trimmed}`;
  const url = new URL(withProtocol);

  url.hash = "";

  return url;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function text(value: unknown) {
  return String(value ?? "").trim();
}

function lower(value: unknown) {
  return text(value).toLowerCase();
}

function finding(
  id: string,
  title: string,
  severity: CrawlerFindingSeverity,
  category: string,
  evidence: string,
  recommendation: string,
  description: string,
): SafeCrawlerFinding {
  return {
    id,
    title,
    severity,
    risk_level: severity,
    category,
    evidence,
    recommendation,
    description,
  };
}

function isLikelyHtmlUrl(url: URL) {
  const path = url.pathname.toLowerCase();

  return !/\.(png|jpg|jpeg|gif|webp|svg|ico|css|js|pdf|zip|rar|7z|mp4|mp3|avi|mov|woff|woff2|ttf|eot|xml|json)$/i.test(
    path,
  );
}

function isUnsafePath(url: URL) {
  const path = `${url.pathname}${url.search}`.toLowerCase();

  return [
    "logout",
    "signout",
    "delete",
    "remove",
    "destroy",
    "unsubscribe",
    "checkout",
    "cart",
    "payment",
    "pay",
    "admin",
    "wp-admin",
    "login",
    "signin",
    "signup",
    "register",
  ].some((word) => path.includes(word));
}

function normalizeDiscoveredUrl(
  rawHref: string,
  baseUrl: string,
  origin: string,
) {
  const href = text(rawHref);

  if (!href) {
    return null;
  }

  if (
    href.startsWith("#") ||
    href.startsWith("mailto:") ||
    href.startsWith("tel:") ||
    href.startsWith("javascript:") ||
    href.startsWith("data:")
  ) {
    return null;
  }

  try {
    const parsed = new URL(href, baseUrl);

    parsed.hash = "";

    if (!["http:", "https:"].includes(parsed.protocol)) {
      return null;
    }

    if (parsed.origin !== origin) {
      return null;
    }

    if (!isLikelyHtmlUrl(parsed)) {
      return null;
    }

    if (isUnsafePath(parsed)) {
      return null;
    }

    return parsed.toString();
  } catch {
    return null;
  }
}

function extractLinks(body: string, baseUrl: string, origin: string) {
  const links: string[] = [];
  const matches = body.matchAll(/<a\b[^>]*\bhref=["']([^"']+)["'][^>]*>/gi);

  for (const match of matches) {
    const normalized = normalizeDiscoveredUrl(match[1], baseUrl, origin);

    if (normalized) {
      links.push(normalized);
    }
  }

  return [...new Set(links)].slice(0, 30);
}

function extractTitle(body: string) {
  const match = body.match(/<title[^>]*>([\s\S]*?)<\/title>/i);

  return text(
    match?.[1]
      ?.replace(/\s+/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">"),
  );
}

function countMatches(body: string, pattern: RegExp) {
  return (body.match(pattern) || []).length;
}

function hasPrivacySignal(body: string) {
  return /privacy\s*policy|\/privacy|data\s*protection|cookie\s*policy/i.test(
    body,
  );
}

function hasContactSignal(body: string) {
  return /contact|support|mailto:|tel:|whatsapp|help\s*center/i.test(body);
}

function pageSignals(
  url: string,
  status: number | null,
  body: string,
  error?: string,
): CrawledPageSignal {
  const title = extractTitle(body);
  const formCount = countMatches(body, /<form\b/gi);
  const passwordFieldCount = countMatches(
    body,
    /<input\b[^>]*type=["']password["'][^>]*>/gi,
  );
  const insecureAssetCount = countMatches(
    body,
    /\b(?:src|href)=["']http:\/\/[^"']+["']/gi,
  );
  const insecureLinkCount = countMatches(
    body,
    /<a\b[^>]*href=["']http:\/\/[^"']+["'][^>]*>/gi,
  );
  const externalScriptCount = countMatches(
    body,
    /<script\b[^>]*\bsrc=["']https?:\/\/[^"']+["'][^>]*>/gi,
  );
  const blankTargetMatches =
    body.match(/<a\b[^>]*target=["']_blank["'][^>]*>/gi) || [];
  const blankTargetWithoutRelCount = blankTargetMatches.filter(
    (anchor) => !/rel=["'][^"']*(noopener|noreferrer)[^"']*["']/i.test(anchor),
  ).length;

  return {
    url,
    status,
    title,
    hasPrivacySignal: hasPrivacySignal(body),
    hasContactSignal: hasContactSignal(body),
    formCount,
    passwordFieldCount,
    insecureAssetCount,
    insecureLinkCount,
    externalScriptCount,
    blankTargetWithoutRelCount,
    internalLinksFound: 0,
    error,
  };
}

async function fetchPage(url: string): Promise<FetchResult> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      method: "GET",
      redirect: "follow",
      signal: controller.signal,
      headers: {
        "user-agent": USER_AGENT,
        accept: "text/html, text/plain, */*",
      },
    });

    const contentType = response.headers.get("content-type") || "";
    let body = "";

    if (
      contentType.includes("text/") ||
      contentType.includes("html") ||
      contentType.length === 0
    ) {
      body = await response.text();
      body = body.slice(0, 180000);
    }

    return {
      ok: response.ok,
      url,
      finalUrl: response.url,
      status: response.status,
      body,
    };
  } catch (error) {
    return {
      ok: false,
      url,
      finalUrl: url,
      status: null,
      body: "",
      error: error instanceof Error ? error.message : "Request failed",
    };
  } finally {
    clearTimeout(timer);
  }
}

function buildCrawlerFindings(
  result: Omit<SafeCrawlerResult, "findings">,
): SafeCrawlerFinding[] {
  const findings: SafeCrawlerFinding[] = [];
  const pages = result.pages;

  const errorPages = pages.filter(
    (page) => page.error || (page.status !== null && page.status >= 400),
  );
  const pagesWithForms = pages.filter((page) => page.formCount > 0);
  const pagesWithPasswordFields = pages.filter(
    (page) => page.passwordFieldCount > 0,
  );
  const pagesWithMixedContent = pages.filter(
    (page) => page.insecureAssetCount > 0,
  );
  const pagesWithInsecureLinks = pages.filter(
    (page) => page.insecureLinkCount > 0,
  );
  const pagesWithBlankTargetWithoutRel = pages.filter(
    (page) => page.blankTargetWithoutRelCount > 0,
  );
  const highScriptPages = pages.filter(
    (page) => page.externalScriptCount >= 20,
  );
  const pagesWithoutTitle = pages.filter((page) => !page.title);

  if (pages.length > 1) {
    findings.push(
      finding(
        "safe_crawler_pages_reviewed",
        "Limited same-domain public pages reviewed",
        "info",
        "content",
        pages
          .map((page) => `${page.status ?? "no status"} ${page.url}`)
          .join("\n"),
        "Use this as a safe site-level posture snapshot. Increase crawl depth only after authorization, rate limits, and monitoring are mature.",
        [
          "What we found: VeyraSec safely reviewed a limited number of public same-domain pages.",
          "",
          "Why it matters: Reviewing more than the homepage gives a better picture of visible trust, privacy, content, and form signals.",
          "",
          "Business impact: A broader public-page review helps owners find trust gaps before customers do.",
          "",
          "Technical impact: This crawler uses GET requests only and does not submit forms, attempt login, inject payloads, or guess hidden paths.",
          "",
          "Confidence: High confidence",
        ].join("\n"),
      ),
    );
  }

  if (!result.summary.privacySignalFound) {
    findings.push(
      finding(
        "crawl_privacy_signal_missing",
        "Privacy signal not found across crawled pages",
        "medium",
        "privacy",
        `Pages reviewed: ${pages.length}\nPrivacy signal found: no`,
        "Add a clear privacy policy link and ensure it is visible from key public pages.",
        [
          "What we found: The limited crawler did not find a visible privacy policy or privacy-related signal across reviewed public pages.",
          "",
          "Why it matters: Privacy information is a core trust signal for websites that collect user data, use analytics, or support account/payment flows.",
          "",
          "Business impact: Missing privacy signals can reduce customer trust and make the website look less ready for serious users.",
          "",
          "Technical impact: Add a consistent privacy policy link in footer/navigation and verify it is reachable.",
          "",
          "Confidence: Medium confidence",
        ].join("\n"),
      ),
    );
  }

  if (!result.summary.contactSignalFound) {
    findings.push(
      finding(
        "crawl_contact_signal_missing",
        "Contact/support signal not found across crawled pages",
        "low",
        "trust_signals",
        `Pages reviewed: ${pages.length}\nContact/support signal found: no`,
        "Add a clear contact, support, help, email, phone, or business identity signal.",
        [
          "What we found: The limited crawler did not find a visible contact/support signal across reviewed public pages.",
          "",
          "Why it matters: Contact and support signals help visitors trust the website and know how to reach the business.",
          "",
          "Business impact: Weak contact visibility can reduce conversions and customer confidence.",
          "",
          "Technical impact: Add contact/support links in navigation or footer and verify they are visible on important pages.",
          "",
          "Confidence: Medium confidence",
        ].join("\n"),
      ),
    );
  }

  if (pagesWithForms.length > 0) {
    findings.push(
      finding(
        "crawl_public_forms_detected",
        "Public forms detected during safe crawl",
        "low",
        "forms",
        pagesWithForms
          .map((page) => `${page.url} - forms: ${page.formCount}`)
          .join("\n"),
        "Review public forms for purpose clarity, HTTPS, privacy disclosure, spam protection, and secure backend handling.",
        [
          "What we found: VeyraSec detected one or more public HTML forms. No forms were submitted.",
          "",
          "Why it matters: Public forms may collect personal data and should have clear purpose, privacy disclosure, and secure handling.",
          "",
          "Business impact: Clear and secure forms improve trust and reduce support/privacy risk.",
          "",
          "Technical impact: Review form action, method, data handling, validation, spam protection, and privacy notice.",
          "",
          "Confidence: High confidence",
        ].join("\n"),
      ),
    );
  }

  if (pagesWithPasswordFields.length > 0) {
    findings.push(
      finding(
        "crawl_password_fields_detected",
        "Password fields detected on public pages",
        "medium",
        "forms",
        pagesWithPasswordFields
          .map(
            (page) =>
              `${page.url} - password fields: ${page.passwordFieldCount}`,
          )
          .join("\n"),
        "Confirm login/account pages are expected, protected by HTTPS, and supported by strong authentication and session settings.",
        [
          "What we found: VeyraSec detected visible password input fields on public pages. No login attempt was made.",
          "",
          "Why it matters: Login surfaces need careful HTTPS, session cookie, rate limit, and account security configuration.",
          "",
          "Business impact: Weak login posture can damage customer trust and increase support/security risk.",
          "",
          "Technical impact: Review authentication flow, session cookies, password reset, rate limits, and security headers.",
          "",
          "Confidence: High confidence",
        ].join("\n"),
      ),
    );
  }

  if (pagesWithMixedContent.length > 0) {
    findings.push(
      finding(
        "crawl_mixed_content_detected",
        "Possible mixed-content references found across crawled pages",
        "medium",
        "content",
        pagesWithMixedContent
          .map(
            (page) =>
              `${page.url} - insecure assets: ${page.insecureAssetCount}`,
          )
          .join("\n"),
        "Replace HTTP asset references with HTTPS or remove the insecure references.",
        [
          "What we found: One or more crawled pages appear to reference HTTP assets or links from public HTML.",
          "",
          "Why it matters: Mixed content can weaken browser trust and may cause assets to be blocked.",
          "",
          "Business impact: Broken or insecure assets can hurt trust, UX, and conversion.",
          "",
          "Technical impact: Update HTTP asset URLs to HTTPS and retest the affected pages.",
          "",
          "Confidence: Medium confidence",
        ].join("\n"),
      ),
    );
  }

  if (pagesWithInsecureLinks.length > 0) {
    findings.push(
      finding(
        "crawl_insecure_http_links_detected",
        "HTTP links found on crawled pages",
        "low",
        "content",
        pagesWithInsecureLinks
          .map((page) => `${page.url} - HTTP links: ${page.insecureLinkCount}`)
          .join("\n"),
        "Review HTTP links and use HTTPS links where available.",
        [
          "What we found: One or more public pages contain HTTP links.",
          "",
          "Why it matters: HTTP links can reduce user trust and may send visitors to non-encrypted destinations.",
          "",
          "Business impact: Insecure outbound links can make a professional website look less trustworthy.",
          "",
          "Technical impact: Replace HTTP links with HTTPS equivalents where possible.",
          "",
          "Confidence: Medium confidence",
        ].join("\n"),
      ),
    );
  }

  if (pagesWithBlankTargetWithoutRel.length > 0) {
    findings.push(
      finding(
        "crawl_blank_target_without_rel",
        "External new-tab links missing rel protection",
        "low",
        "content",
        pagesWithBlankTargetWithoutRel
          .map(
            (page) =>
              `${page.url} - target=_blank links without rel protection: ${page.blankTargetWithoutRelCount}`,
          )
          .join("\n"),
        'Add rel="noopener noreferrer" to target="_blank" links.',
        [
          "What we found: Some links opening in a new tab appear to lack rel=noopener/noreferrer.",
          "",
          "Why it matters: Adding rel protection is a simple browser security hygiene improvement.",
          "",
          "Business impact: Small hygiene fixes improve professional trust posture.",
          "",
          'Technical impact: Add rel="noopener noreferrer" to target="_blank" links.',
          "",
          "Confidence: Medium confidence",
        ].join("\n"),
      ),
    );
  }

  if (highScriptPages.length > 0) {
    findings.push(
      finding(
        "crawl_high_script_count_pages",
        "High script count found on crawled pages",
        "low",
        "technology",
        highScriptPages
          .map(
            (page) =>
              `${page.url} - external scripts: ${page.externalScriptCount}`,
          )
          .join("\n"),
        "Review third-party scripts and remove unused scripts to reduce dependency and supply-chain exposure.",
        [
          "What we found: One or more crawled pages load a high number of external scripts.",
          "",
          "Why it matters: More scripts can increase performance, privacy, and supply-chain complexity.",
          "",
          "Business impact: Script bloat can reduce performance and increase trust/privacy review burden.",
          "",
          "Technical impact: Audit third-party scripts, remove unused scripts, and document necessary vendors.",
          "",
          "Confidence: Medium confidence",
        ].join("\n"),
      ),
    );
  }

  if (pagesWithoutTitle.length > 0) {
    findings.push(
      finding(
        "crawl_pages_without_title",
        "Some crawled pages are missing title tags",
        "low",
        "content",
        pagesWithoutTitle.map((page) => page.url).join("\n"),
        "Add clear title tags to important public pages.",
        [
          "What we found: One or more crawled public pages did not expose a clear title tag.",
          "",
          "Why it matters: Page titles help users, search engines, accessibility tools, and professional content hygiene.",
          "",
          "Business impact: Better page metadata improves trust and discoverability.",
          "",
          "Technical impact: Add concise and accurate title tags to public pages.",
          "",
          "Confidence: Medium confidence",
        ].join("\n"),
      ),
    );
  }

  if (errorPages.length > 0) {
    findings.push(
      finding(
        "crawl_page_errors_observed",
        "Some discovered public pages returned errors",
        "low",
        "availability",
        errorPages
          .map(
            (page) =>
              `${page.status ?? "no status"} ${page.url}${page.error ? ` - ${page.error}` : ""}`,
          )
          .join("\n"),
        "Review broken public links and fix or redirect them.",
        [
          "What we found: Some discovered same-domain public pages returned an error or could not be fetched.",
          "",
          "Why it matters: Broken public pages reduce trust and may indicate stale links or routing issues.",
          "",
          "Business impact: Broken links can hurt conversion, SEO, and customer confidence.",
          "",
          "Technical impact: Fix broken links, add redirects, or remove stale references.",
          "",
          "Confidence: Medium confidence",
        ].join("\n"),
      ),
    );
  }

  return findings;
}

export async function runSafeSameDomainCrawler(
  inputUrl: string,
  options?: {
    maxPages?: number;
  },
): Promise<SafeCrawlerResult> {
  const start = Date.now();
  const normalized = normalizeInputUrl(inputUrl);
  const origin = normalized.origin;
  const maxPages = Math.max(
    1,
    Math.min(options?.maxPages ?? DEFAULT_MAX_PAGES, 10),
  );

  const queue: string[] = [normalized.toString()];
  const seen = new Set<string>();
  const pages: CrawledPageSignal[] = [];
  let discoveredInternalLinks = 0;
  let stoppedReason = "page limit reached";

  while (queue.length > 0 && pages.length < maxPages) {
    if (Date.now() - start > MAX_SCAN_TIME_MS) {
      stoppedReason = "time limit reached";
      break;
    }

    const currentUrl = queue.shift();

    if (!currentUrl || seen.has(currentUrl)) {
      continue;
    }

    seen.add(currentUrl);

    const response = await fetchPage(currentUrl);
    const signal = pageSignals(
      response.finalUrl || currentUrl,
      response.status,
      response.body,
      response.error,
    );

    if (response.body) {
      const links = extractLinks(
        response.body,
        response.finalUrl || currentUrl,
        origin,
      );
      signal.internalLinksFound = links.length;
      discoveredInternalLinks += links.length;

      for (const link of links) {
        if (
          !seen.has(link) &&
          !queue.includes(link) &&
          pages.length + queue.length < maxPages
        ) {
          queue.push(link);
        }
      }
    }

    pages.push(signal);

    if (queue.length > 0 && pages.length < maxPages) {
      await sleep(150);
    }
  }

  if (queue.length === 0 && pages.length < maxPages) {
    stoppedReason = "no more safe same-domain links discovered";
  }

  const summaryWithoutFindings = {
    startUrl: normalized.toString(),
    origin,
    pages,
    summary: {
      maxPages,
      crawledPages: pages.length,
      discoveredInternalLinks,
      pagesWithForms: pages.filter((page) => page.formCount > 0).length,
      pagesWithPasswordFields: pages.filter(
        (page) => page.passwordFieldCount > 0,
      ).length,
      pagesWithMixedContent: pages.filter((page) => page.insecureAssetCount > 0)
        .length,
      pagesWithInsecureLinks: pages.filter((page) => page.insecureLinkCount > 0)
        .length,
      pagesWithBlankTargetWithoutRel: pages.filter(
        (page) => page.blankTargetWithoutRelCount > 0,
      ).length,
      pagesWithErrors: pages.filter(
        (page) => page.error || (page.status !== null && page.status >= 400),
      ).length,
      privacySignalFound: pages.some((page) => page.hasPrivacySignal),
      contactSignalFound: pages.some((page) => page.hasContactSignal),
      stoppedReason,
    },
  };

  const findings = buildCrawlerFindings(summaryWithoutFindings);

  return {
    ...summaryWithoutFindings,
    findings,
  };
}
