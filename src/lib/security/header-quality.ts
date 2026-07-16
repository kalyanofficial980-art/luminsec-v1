export type HeaderQualitySeverity =
  "info" | "low" | "medium" | "high" | "critical";

export type HeaderQualityFinding = {
  id: string;
  title: string;
  description: string;
  category: string;
  severity: HeaderQualitySeverity;
  risk_level: HeaderQualitySeverity;
  evidence: string;
  recommendation: string;
};

type HeaderQualityInput = {
  headers: Headers | null;
  finalUrl?: string;
  checkedUrl?: string;
};

function headerValue(headers: Headers | null, name: string) {
  return headers?.get(name) || "";
}

function normalize(value: unknown) {
  return String(value || "").trim();
}

function lower(value: unknown) {
  return normalize(value).toLowerCase();
}

function finding(
  id: string,
  title: string,
  severity: HeaderQualitySeverity,
  evidence: string,
  recommendation: string,
  description: string,
): HeaderQualityFinding {
  return {
    id,
    title,
    severity,
    risk_level: severity,
    category: "security_headers",
    evidence,
    recommendation,
    description,
  };
}

function sourceLine(input: HeaderQualityInput) {
  return `Source URL: ${input.finalUrl || input.checkedUrl || "unknown"}`;
}

function parseHstsMaxAge(hsts: string) {
  const match = hsts.match(/max-age\s*=\s*(\d+)/i);
  if (!match) return null;

  const value = Number(match[1]);
  return Number.isFinite(value) ? value : null;
}

function cspHasDirective(csp: string, directive: string) {
  return new RegExp(`(^|;)\\s*${directive}\\b`, "i").test(csp);
}

function analyzeHsts(
  input: HeaderQualityInput,
  findings: HeaderQualityFinding[],
) {
  const hsts = headerValue(input.headers, "strict-transport-security");

  if (!hsts) {
    findings.push(
      finding(
        "missing_hsts",
        "Missing Strict-Transport-Security header",
        "medium",
        `${sourceLine(input)}\nHeader checked: Strict-Transport-Security\nObserved: missing`,
        "Add Strict-Transport-Security after confirming HTTPS works correctly across the full website.",
        "HSTS helps browsers continue using HTTPS after the first secure visit.",
      ),
    );

    return;
  }

  const maxAge = parseHstsMaxAge(hsts);

  if (maxAge === null) {
    findings.push(
      finding(
        "weak_hsts_missing_max_age",
        "HSTS header is missing max-age",
        "medium",
        `${sourceLine(input)}\nHeader: Strict-Transport-Security\nObserved: ${hsts}`,
        "Set a clear HSTS max-age value after confirming HTTPS works correctly.",
        "An HSTS header without max-age is incomplete and may not give browsers a clear HTTPS enforcement period.",
      ),
    );
  } else if (maxAge < 15552000) {
    findings.push(
      finding(
        "weak_hsts_short_max_age",
        "HSTS max-age is shorter than recommended",
        "low",
        `${sourceLine(input)}\nHeader: Strict-Transport-Security\nObserved: ${hsts}\nParsed max-age: ${maxAge}`,
        "Use a longer HSTS max-age after testing HTTPS stability. A common target is at least 180 days.",
        "A short HSTS duration gives weaker long-term HTTPS protection.",
      ),
    );
  }

  if (!/includesubdomains/i.test(hsts)) {
    findings.push(
      finding(
        "hsts_missing_include_subdomains",
        "HSTS does not include subdomains",
        "low",
        `${sourceLine(input)}\nHeader: Strict-Transport-Security\nObserved: ${hsts}`,
        "Add includeSubDomains only after confirming all subdomains support HTTPS correctly.",
        "Without includeSubDomains, browser HTTPS enforcement may not cover subdomains.",
      ),
    );
  }
}

function analyzeCsp(
  input: HeaderQualityInput,
  findings: HeaderQualityFinding[],
) {
  const csp = headerValue(input.headers, "content-security-policy");

  if (!csp) {
    findings.push(
      finding(
        "missing_csp",
        "Missing Content-Security-Policy header",
        "medium",
        `${sourceLine(input)}\nHeader checked: Content-Security-Policy\nObserved: missing`,
        "Add a Content-Security-Policy appropriate for the website and test carefully before enforcing.",
        "A CSP can reduce the impact of unexpected or injected scripts when configured correctly.",
      ),
    );

    return;
  }

  const weakSignals: string[] = [];

  if (/\bunsafe-inline\b/i.test(csp)) weakSignals.push("uses unsafe-inline");
  if (/\bunsafe-eval\b/i.test(csp)) weakSignals.push("uses unsafe-eval");
  if (/(^|[\s;])\*\s*(;|$)/.test(csp))
    weakSignals.push("allows wildcard source");
  if (!cspHasDirective(csp, "object-src"))
    weakSignals.push("missing object-src");
  if (!cspHasDirective(csp, "base-uri")) weakSignals.push("missing base-uri");
  if (!cspHasDirective(csp, "frame-ancestors"))
    weakSignals.push("missing frame-ancestors");

  if (weakSignals.length > 0) {
    findings.push(
      finding(
        "weak_csp_policy",
        "Content-Security-Policy needs hardening",
        "low",
        `${sourceLine(input)}\nHeader: Content-Security-Policy\nObserved: ${csp}\nQuality signals: ${weakSignals.join(", ")}`,
        "Review CSP sources and reduce unsafe directives where possible. Add object-src, base-uri, and frame-ancestors if appropriate.",
        "The website has a CSP, but visible quality signals suggest it may not provide strong protection yet.",
      ),
    );
  }
}

function analyzeClickjacking(
  input: HeaderQualityInput,
  findings: HeaderQualityFinding[],
) {
  const xfo = lower(headerValue(input.headers, "x-frame-options"));
  const csp = lower(headerValue(input.headers, "content-security-policy"));

  const hasFrameAncestors = csp.includes("frame-ancestors");

  if (!xfo && !hasFrameAncestors) {
    findings.push(
      finding(
        "missing_clickjacking_protection",
        "Missing clickjacking protection header",
        "medium",
        `${sourceLine(input)}\nHeaders checked: X-Frame-Options and CSP frame-ancestors\nObserved: missing`,
        "Add X-Frame-Options or CSP frame-ancestors to control where the site can be framed.",
        "Without a visible framing policy, the website may be easier to embed in unwanted frames.",
      ),
    );

    return;
  }

  if (xfo && !["deny", "sameorigin"].includes(xfo)) {
    findings.push(
      finding(
        "weak_x_frame_options",
        "X-Frame-Options value needs review",
        "low",
        `${sourceLine(input)}\nHeader: X-Frame-Options\nObserved: ${xfo}`,
        "Use DENY or SAMEORIGIN, or move framing control to CSP frame-ancestors.",
        "The visible X-Frame-Options value is not one of the common protective values.",
      ),
    );
  }
}

function analyzeContentType(
  input: HeaderQualityInput,
  findings: HeaderQualityFinding[],
) {
  const value = lower(headerValue(input.headers, "x-content-type-options"));

  if (!value) {
    findings.push(
      finding(
        "missing_x_content_type_options",
        "Missing X-Content-Type-Options header",
        "low",
        `${sourceLine(input)}\nHeader checked: X-Content-Type-Options\nObserved: missing`,
        "Add X-Content-Type-Options: nosniff.",
        "The nosniff header helps reduce content-type confusion in browsers.",
      ),
    );

    return;
  }

  if (value !== "nosniff") {
    findings.push(
      finding(
        "weak_x_content_type_options",
        "X-Content-Type-Options value needs review",
        "low",
        `${sourceLine(input)}\nHeader: X-Content-Type-Options\nObserved: ${value}`,
        "Set X-Content-Type-Options to nosniff.",
        "The visible X-Content-Type-Options value is not the expected nosniff value.",
      ),
    );
  }
}

function analyzeReferrerPolicy(
  input: HeaderQualityInput,
  findings: HeaderQualityFinding[],
) {
  const value = lower(headerValue(input.headers, "referrer-policy"));

  if (!value) {
    findings.push(
      finding(
        "missing_referrer_policy",
        "Missing Referrer-Policy header",
        "low",
        `${sourceLine(input)}\nHeader checked: Referrer-Policy\nObserved: missing`,
        "Add a Referrer-Policy such as strict-origin-when-cross-origin.",
        "A referrer policy helps control how much URL information is shared with other sites.",
      ),
    );

    return;
  }

  if (["unsafe-url", "no-referrer-when-downgrade"].includes(value)) {
    findings.push(
      finding(
        "weak_referrer_policy",
        "Referrer-Policy value is weak",
        "low",
        `${sourceLine(input)}\nHeader: Referrer-Policy\nObserved: ${value}`,
        "Use a stronger policy such as strict-origin-when-cross-origin, same-origin, or no-referrer depending on website needs.",
        "The visible referrer policy may share more URL information than necessary.",
      ),
    );
  }
}

function analyzePermissionsPolicy(
  input: HeaderQualityInput,
  findings: HeaderQualityFinding[],
) {
  const value = headerValue(input.headers, "permissions-policy");

  if (!value) {
    findings.push(
      finding(
        "missing_permissions_policy",
        "Missing Permissions-Policy header",
        "low",
        `${sourceLine(input)}\nHeader checked: Permissions-Policy\nObserved: missing`,
        "Add a Permissions-Policy header to limit browser features the site does not need.",
        "A permissions policy helps reduce unnecessary browser capability exposure.",
      ),
    );

    return;
  }

  if (value.length < 12) {
    findings.push(
      finding(
        "weak_permissions_policy",
        "Permissions-Policy value needs review",
        "info",
        `${sourceLine(input)}\nHeader: Permissions-Policy\nObserved: ${value}`,
        "Review the Permissions-Policy value and restrict unused browser features.",
        "The visible permissions policy is very short and may not meaningfully restrict browser capabilities.",
      ),
    );
  }
}

export function headerQualityFindingsFromHeaders(
  input: HeaderQualityInput,
): HeaderQualityFinding[] {
  const findings: HeaderQualityFinding[] = [];

  analyzeHsts(input, findings);
  analyzeCsp(input, findings);
  analyzeClickjacking(input, findings);
  analyzeContentType(input, findings);
  analyzeReferrerPolicy(input, findings);
  analyzePermissionsPolicy(input, findings);

  return findings;
}


