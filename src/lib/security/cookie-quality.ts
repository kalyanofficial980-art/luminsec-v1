export type CookieQualitySeverity = "info" | "low" | "medium" | "high" | "critical";

export type CookieQualityFinding = {
  id: string;
  title: string;
  description: string;
  category: string;
  severity: CookieQualitySeverity;
  risk_level: CookieQualitySeverity;
  evidence: string;
  recommendation: string;
};

type CookieQualityInput = {
  headers: Headers | null;
  finalUrl?: string;
  checkedUrl?: string;
};

type ParsedCookie = {
  name: string;
  raw: string;
  attributes: Set<string>;
  attributeMap: Record<string, string>;
  sameSite: string;
  maxAge: number | null;
  expiresAt: Date | null;
};

function sourceUrl(input: CookieQualityInput) {
  return input.finalUrl || input.checkedUrl || "unknown";
}

function getSetCookieValues(headers: Headers | null) {
  if (!headers) return [];

  const maybeHeaders = headers as Headers & {
    getSetCookie?: () => string[];
  };

  if (typeof maybeHeaders.getSetCookie === "function") {
    return maybeHeaders.getSetCookie().filter(Boolean);
  }

  const raw = headers.get("set-cookie") || "";

  if (!raw.trim()) return [];

  return raw
    .split(/,(?=\s*[^;,=\s]+=[^;,\s]+)/g)
    .map((value) => value.trim())
    .filter(Boolean);
}

function parseCookie(raw: string): ParsedCookie | null {
  const parts = raw
    .split(";")
    .map((part) => part.trim())
    .filter(Boolean);

  const first = parts[0] || "";
  const equalsIndex = first.indexOf("=");

  if (equalsIndex <= 0) return null;

  const name = first.slice(0, equalsIndex).trim();
  const attributes = new Set<string>();
  const attributeMap: Record<string, string> = {};

  for (const part of parts.slice(1)) {
    const index = part.indexOf("=");
    const key = (index >= 0 ? part.slice(0, index) : part).trim().toLowerCase();
    const value = index >= 0 ? part.slice(index + 1).trim() : "true";

    if (key) {
      attributes.add(key);
      attributeMap[key] = value;
    }
  }

  const maxAgeRaw = attributeMap["max-age"];
  const maxAge = maxAgeRaw && Number.isFinite(Number(maxAgeRaw)) ? Number(maxAgeRaw) : null;

  const expiresRaw = attributeMap.expires;
  const expiresAt = expiresRaw ? new Date(expiresRaw) : null;

  return {
    name,
    raw,
    attributes,
    attributeMap,
    sameSite: (attributeMap.samesite || "").toLowerCase(),
    maxAge,
    expiresAt: expiresAt && !Number.isNaN(expiresAt.getTime()) ? expiresAt : null,
  };
}

function isHttps(input: CookieQualityInput) {
  const url = sourceUrl(input).toLowerCase();
  return url.startsWith("https://");
}

function isSensitiveCookie(cookie: ParsedCookie) {
  const name = cookie.name.toLowerCase();

  if (/csrf|xsrf/.test(name)) {
    return false;
  }

  return /session|sess|sid|auth|token|jwt|login|account|user|admin|cart|checkout|payment/.test(name);
}

function finding(
  id: string,
  title: string,
  severity: CookieQualitySeverity,
  evidence: string,
  recommendation: string,
  description: string
): CookieQualityFinding {
  return {
    id,
    title,
    severity,
    risk_level: severity,
    category: "cookies",
    evidence,
    recommendation,
    description,
  };
}

function cookieEvidence(input: CookieQualityInput, cookie: ParsedCookie, extra: string) {
  return [
    `Source URL: ${sourceUrl(input)}`,
    `Cookie name: ${cookie.name}`,
    `Observed Set-Cookie: ${cookie.raw.slice(0, 900)}`,
    extra,
  ]
    .filter(Boolean)
    .join("\n");
}

function cookieLifetimeDays(cookie: ParsedCookie) {
  if (cookie.maxAge !== null) {
    return Math.round(cookie.maxAge / 86400);
  }

  if (cookie.expiresAt) {
    const diffMs = cookie.expiresAt.getTime() - Date.now();
    return Math.round(diffMs / 86400000);
  }

  return null;
}

export function cookieQualityFindingsFromHeaders(input: CookieQualityInput): CookieQualityFinding[] {
  const findings: CookieQualityFinding[] = [];
  const cookies = getSetCookieValues(input.headers)
    .map(parseCookie)
    .filter((cookie): cookie is ParsedCookie => Boolean(cookie));

  if (cookies.length === 0) {
    return findings;
  }

  for (const cookie of cookies) {
    const sensitive = isSensitiveCookie(cookie);
    const secure = cookie.attributes.has("secure");
    const httpOnly = cookie.attributes.has("httponly");
    const hasSameSite = cookie.attributes.has("samesite");
    const lifetimeDays = cookieLifetimeDays(cookie);

    if (isHttps(input) && !secure) {
      findings.push(
        finding(
          "cookie_missing_secure",
          sensitive ? "Sensitive cookie missing Secure attribute" : "Cookie missing Secure attribute",
          sensitive ? "medium" : "low",
          cookieEvidence(input, cookie, "Expected: Secure attribute on HTTPS cookies."),
          "Set Secure on cookies that should only be sent over HTTPS.",
          "A visible cookie does not clearly include the Secure attribute, so browsers may send it over non-HTTPS requests in some situations."
        )
      );
    }

    if (sensitive && !httpOnly) {
      findings.push(
        finding(
          "cookie_missing_httponly",
          "Sensitive cookie missing HttpOnly attribute",
          "medium",
          cookieEvidence(input, cookie, "Expected: HttpOnly on sensitive/session-style cookies."),
          "Set HttpOnly on session or sensitive cookies where JavaScript access is not required.",
          "A likely sensitive cookie is visible without HttpOnly, which can increase exposure if client-side script is compromised."
        )
      );
    }

    if (!hasSameSite) {
      findings.push(
        finding(
          "cookie_missing_samesite",
          "Cookie missing SameSite attribute",
          "low",
          cookieEvidence(input, cookie, "Expected: SameSite=Lax or SameSite=Strict where appropriate."),
          "Set SameSite=Lax or SameSite=Strict where appropriate for the website workflow.",
          "A visible cookie does not clearly include SameSite, which helps browsers control cross-site cookie sending."
        )
      );
    }

    if (cookie.sameSite === "none" && !secure) {
      findings.push(
        finding(
          "cookie_samesite_none_without_secure",
          "Cookie uses SameSite=None without Secure",
          "medium",
          cookieEvidence(input, cookie, "Observed: SameSite=None without Secure."),
          "When SameSite=None is required, also set Secure.",
          "Modern browsers expect SameSite=None cookies to also use Secure."
        )
      );
    }

    if (sensitive && lifetimeDays !== null && lifetimeDays > 30) {
      findings.push(
        finding(
          "sensitive_cookie_long_lifetime",
          "Sensitive cookie lifetime needs review",
          "low",
          cookieEvidence(input, cookie, `Observed lifetime: about ${lifetimeDays} day(s).`),
          "Review whether sensitive cookies need a shorter lifetime or additional session controls.",
          "A likely sensitive cookie appears long-lived. This may be valid for some workflows, but should be reviewed."
        )
      );
    }
  }

  return findings;
}