export type EvidenceConfidence = "high" | "medium" | "low";

export type VerificationStatus =
  "verified_by_scan" | "likely_signal" | "needs_confirmation" | "not_visible";

export type EvidenceType =
  | "response_header"
  | "set_cookie"
  | "html_signal"
  | "crawler_page"
  | "well_known_file"
  | "technology_signal"
  | "known_risk_advisory"
  | "http_probe"
  | "scan_quality"
  | "unknown";

export type ScanQualityLevel = "high" | "medium" | "low";

export type FindingEvidence = {
  type: EvidenceType;
  sourceUrl: string;
  observedValue: string;
  expectedValue: string;
  confidence: EvidenceConfidence;
  limitation: string;
  verificationStatus: VerificationStatus;
};

export type ScanQualityResult = {
  level: ScanQualityLevel;
  score: number;
  reachable: boolean;
  finalUrl: string;
  headersCaptured: boolean;
  htmlCaptured: boolean;
  httpProbeCompleted: boolean;
  crawlerPagesCount: number;
  timeoutCount: number;
  blocked: boolean;
  blockedReason: string;
  notes: string[];
};

type MinimalFetchResult = {
  ok: boolean;
  url: string;
  status: number | null;
  redirected: boolean;
  finalUrl: string;
  headers: Headers | null;
  body: string;
  error?: string;
};

type PassiveFindingBase = {
  id: string;
  title: string;
  description: string;
  category: string;
  severity: string;
  risk_level: string;
  evidence: string;
  recommendation: string;
};

function cleanText(value: unknown) {
  return String(value || "").trim();
}

function lower(value: unknown) {
  return cleanText(value).toLowerCase();
}

function firstUrl(value: string) {
  const match = value.match(/https?:\/\/[^\s"'<>]+/i);
  return match ? match[0].replace(/[),.;]+$/, "") : "";
}

function evidenceTypeForFinding(finding: PassiveFindingBase): EvidenceType {
  const haystack =
    `${finding.id} ${finding.title} ${finding.category} ${finding.evidence}`.toLowerCase();

  if (/set-cookie|cookie/.test(haystack)) return "set_cookie";
  if (
    /header|strict-transport-security|content-security-policy|x-frame-options|x-content-type-options|referrer-policy|permissions-policy/.test(
      haystack,
    )
  )
    return "response_header";
  if (/http probe|http redirect|https|tls/.test(haystack)) return "http_probe";
  if (/security\.txt|robots\.txt|sitemap\.xml/.test(haystack))
    return "well_known_file";
  if (
    /wordpress|woocommerce|shopify|next\.js|react|vercel|cloudflare|technology|x-powered-by|generator/.test(
      haystack,
    )
  )
    return "technology_signal";
  if (/known risk|review recommended|advisory|potential/.test(haystack))
    return "known_risk_advisory";
  if (
    /crawler|page|form|privacy|contact|script|mixed content|homepage|html/.test(
      haystack,
    )
  )
    return "html_signal";

  return "unknown";
}

function expectedValueForFinding(finding: PassiveFindingBase) {
  const id = lower(finding.id);
  const title = lower(finding.title);

  if (id.includes("hsts") || title.includes("strict-transport-security")) {
    return "Strict-Transport-Security header present with safe HTTPS deployment.";
  }

  if (id.includes("csp") || title.includes("content-security-policy")) {
    return "Content-Security-Policy header present and appropriate for the website.";
  }

  if (id.includes("x_frame") || title.includes("clickjacking")) {
    return "X-Frame-Options or CSP frame-ancestors present.";
  }

  if (
    id.includes("x_content_type") ||
    title.includes("x-content-type-options")
  ) {
    return "X-Content-Type-Options: nosniff present.";
  }

  if (id.includes("referrer")) {
    return "Referrer-Policy header present.";
  }

  if (id.includes("permissions")) {
    return "Permissions-Policy header present.";
  }

  if (id.includes("cookie")) {
    return "Visible cookies use appropriate Secure, HttpOnly, and SameSite attributes.";
  }

  if (id.includes("privacy")) {
    return "Clear privacy policy or privacy signal visible near customer-data collection paths.";
  }

  if (id.includes("contact")) {
    return "Clear contact, support, grievance, or business identity signal visible.";
  }

  if (id.includes("security_txt")) {
    return "/.well-known/security.txt available with security contact details.";
  }

  if (id.includes("robots")) {
    return "/robots.txt available when crawler guidance is needed.";
  }

  if (id.includes("sitemap")) {
    return "/sitemap.xml available when public discovery guidance is needed.";
  }

  return "Expected secure, clear, and customer-trust-ready website signal.";
}

function confidenceForFinding(finding: PassiveFindingBase): EvidenceConfidence {
  const evidenceType = evidenceTypeForFinding(finding);
  const haystack =
    `${finding.id} ${finding.title} ${finding.category} ${finding.evidence}`.toLowerCase();

  if (
    evidenceType === "response_header" ||
    evidenceType === "set_cookie" ||
    evidenceType === "http_probe" ||
    evidenceType === "well_known_file"
  ) {
    return "high";
  }

  if (evidenceType === "html_signal" || evidenceType === "technology_signal") {
    return "medium";
  }

  if (
    evidenceType === "known_risk_advisory" ||
    /potential|review|advisory|may|could/.test(haystack)
  ) {
    return "low";
  }

  return "medium";
}

function verificationStatusForFinding(
  finding: PassiveFindingBase,
): VerificationStatus {
  const confidence = confidenceForFinding(finding);
  const haystack =
    `${finding.id} ${finding.title} ${finding.category} ${finding.evidence}`.toLowerCase();

  if (
    /log retention|incident owner|backup|cert-in|cert in|breach process|internal process/.test(
      haystack,
    )
  ) {
    return "needs_confirmation";
  }

  if (confidence === "high") return "verified_by_scan";
  if (confidence === "medium") return "likely_signal";

  return "needs_confirmation";
}

export function rootCauseForFinding(finding: PassiveFindingBase) {
  const haystack =
    `${finding.id} ${finding.title} ${finding.category} ${finding.description} ${finding.recommendation} ${finding.evidence}`.toLowerCase();

  const rules: Array<[string, RegExp]> = [
    [
      "https_transport",
      /https|http to https|redirect|hsts|strict-transport-security/,
    ],
    ["content_security_policy", /\bcsp\b|content-security-policy/],
    ["clickjacking_headers", /x-frame-options|frame-ancestors|clickjack/],
    ["content_type_header", /x-content-type-options|nosniff/],
    ["referrer_policy", /referrer-policy/],
    ["permissions_policy", /permissions-policy/],
    ["security_txt", /security\.txt/],
    ["privacy_policy", /privacy policy|privacy signal|privacy link/],
    ["contact_grievance", /contact|support|grievance/],
    ["consent_purpose", /consent|purpose/],
    [
      "data_request_deletion",
      /data deletion|data request|delete data|access request/,
    ],
    ["breach_readiness", /breach|notification/],
    [
      "cert_incident_reporting",
      /cert|incident reporting|6 hour|6-hour|six hour/,
    ],
    ["log_retention", /log retention|180 day|180-day|logs/],
    ["security_contact", /security contact|incident contact/],
    ["backup_restore", /backup|restore|recovery/],
    ["forms_customer_data", /form|lead|appointment|booking/],
    ["password_fields", /password field|login/],
    ["cookie_security", /cookie|secure flag|httponly|samesite/],
    ["payment_scripts", /payment|razorpay|stripe|paypal|checkout/],
    ["tracking_scripts", /tracking|analytics|tag manager|meta pixel|hotjar/],
    [
      "third_party_scripts",
      /third-party|third party|external script|script count/,
    ],
    ["mixed_content", /mixed content|http asset|insecure asset/],
    [
      "technology_review",
      /wordpress|woocommerce|shopify|next\.js|react|vercel|netlify|cloudflare|nginx|apache|technology|x-powered-by|generator/,
    ],
    ["page_metadata", /title tag|meta description|page title/],
    ["public_page_error", /page error|broken link|404|availability/],
  ];

  for (const [key, pattern] of rules) {
    if (pattern.test(haystack)) {
      return key;
    }
  }

  return (
    lower(finding.category).replace(/[^a-z0-9]+/g, "_") || "general_review"
  );
}

function limitationForFinding(finding: PassiveFindingBase) {
  const status = verificationStatusForFinding(finding);
  const evidenceType = evidenceTypeForFinding(finding);

  if (status === "needs_confirmation") {
    return "This item cannot be fully confirmed from public website signals alone and should be confirmed by the business owner or developer.";
  }

  if (evidenceType === "html_signal") {
    return "This evidence is based on public HTML observed during the scan. JavaScript-rendered or authenticated content may not be fully visible.";
  }

  if (
    evidenceType === "technology_signal" ||
    evidenceType === "known_risk_advisory"
  ) {
    return "Technology signals are advisory and may be incomplete if the website hides or changes implementation details.";
  }

  return "This evidence is based on public, non-authenticated scan data captured at scan time.";
}

export function buildFindingEvidence(
  finding: PassiveFindingBase,
): FindingEvidence {
  const confidence = confidenceForFinding(finding);

  return {
    type: evidenceTypeForFinding(finding),
    sourceUrl: firstUrl(finding.evidence),
    observedValue: cleanText(finding.evidence).slice(0, 1200),
    expectedValue: expectedValueForFinding(finding),
    confidence,
    limitation: limitationForFinding(finding),
    verificationStatus: verificationStatusForFinding(finding),
  };
}

export function enrichPassiveFinding<T extends PassiveFindingBase>(finding: T) {
  const evidence = buildFindingEvidence(finding);

  return {
    ...finding,
    confidence: evidence.confidence,
    verification_status: evidence.verificationStatus,
    evidence_type: evidence.type,
    evidence_records: [evidence],
    source_url: evidence.sourceUrl,
    observed_value: evidence.observedValue,
    expected_value: evidence.expectedValue,
    limitation: evidence.limitation,
    root_cause: rootCauseForFinding(finding),
  };
}

function crawlerPagesCount(summary: unknown) {
  if (!summary || typeof summary !== "object") return 0;

  const value = summary as Record<string, unknown>;
  const candidates = [
    value.pagesVisited,
    value.pagesCrawled,
    value.crawledPages,
    value.pageCount,
    value.pagesCount,
    value.totalPages,
  ];

  for (const candidate of candidates) {
    const numberValue = Number(candidate);
    if (Number.isFinite(numberValue) && numberValue >= 0) {
      return numberValue;
    }
  }

  return 0;
}

function isTimeout(result: MinimalFetchResult) {
  return /abort|timeout|timed out/i.test(result.error || "");
}

function isBlocked(result: MinimalFetchResult) {
  return (
    result.status === 401 || result.status === 403 || result.status === 429
  );
}

export function calculateScanQuality(input: {
  target: MinimalFetchResult;
  httpProbe: MinimalFetchResult;
  securityTxt: MinimalFetchResult;
  robotsTxt: MinimalFetchResult;
  sitemapXml: MinimalFetchResult;
  crawlerSummary: unknown;
}): ScanQualityResult {
  const notes: string[] = [];
  const reachable = input.target.ok;
  const headersCaptured = Boolean(input.target.headers);
  const htmlCaptured = cleanText(input.target.body).length > 0;
  const httpProbeCompleted =
    input.httpProbe.status !== null || input.httpProbe.error === undefined;
  const crawlerPages = crawlerPagesCount(input.crawlerSummary);
  const results = [
    input.target,
    input.httpProbe,
    input.securityTxt,
    input.robotsTxt,
    input.sitemapXml,
  ];
  const timeoutCount = results.filter(isTimeout).length;
  const blockedResult = results.find(isBlocked);
  const blocked = Boolean(blockedResult);

  let score = 100;

  if (!reachable) {
    score -= 35;
    notes.push("Target URL did not return a successful response.");
  }

  if (!headersCaptured) {
    score -= 20;
    notes.push("Response headers were not captured.");
  }

  if (!htmlCaptured) {
    score -= 20;
    notes.push("Homepage HTML body was not captured or was empty.");
  }

  if (!httpProbeCompleted) {
    score -= 10;
    notes.push("HTTP to HTTPS probe could not be completed.");
  }

  if (crawlerPages === 0) {
    score -= 10;
    notes.push("Same-domain crawler did not confirm additional public pages.");
  }

  if (timeoutCount > 0) {
    score -= Math.min(20, timeoutCount * 7);
    notes.push(
      `${timeoutCount} request${timeoutCount === 1 ? "" : "s"} timed out during scan.`,
    );
  }

  if (blocked) {
    score -= 15;
    notes.push(
      `One or more requests appeared blocked with status ${blockedResult?.status}.`,
    );
  }

  const boundedScore = Math.max(0, Math.min(100, Math.round(score)));
  const level: ScanQualityLevel =
    boundedScore >= 80 ? "high" : boundedScore >= 55 ? "medium" : "low";

  if (notes.length === 0) {
    notes.push(
      "Scan captured the main public evidence needed for a readiness report.",
    );
  }

  return {
    level,
    score: boundedScore,
    reachable,
    finalUrl: input.target.finalUrl || input.target.url,
    headersCaptured,
    htmlCaptured,
    httpProbeCompleted,
    crawlerPagesCount: crawlerPages,
    timeoutCount,
    blocked,
    blockedReason: blockedResult ? `HTTP ${blockedResult.status}` : "",
    notes,
  };
}
