export type TlsCertificateSeverity =
  "info" | "low" | "medium" | "high" | "critical";

export type TlsCertificateFinding = {
  id: string;
  title: string;
  description: string;
  category: string;
  severity: TlsCertificateSeverity;
  risk_level: TlsCertificateSeverity;
  evidence: string;
  recommendation: string;
  confidence?: "high" | "medium" | "low";
  verification_status?:
    "verified_by_scan" | "likely_signal" | "needs_confirmation" | "not_visible";
  evidence_type?: "http_probe" | "scan_quality" | "unknown";
  source_url?: string;
  observed_value?: string;
  expected_value?: string;
  limitation?: string;
  root_cause?: string;
};

type PeerCertificateLike = {
  subject?: Record<string, string>;
  issuer?: Record<string, string>;
  subjectaltname?: string;
  valid_from?: string;
  valid_to?: string;
  fingerprint256?: string;
  serialNumber?: string;
  bits?: number;
  modulus?: string;
  raw?: Buffer;
};

type TlsProbeResult = {
  host: string;
  port: number;
  checkedUrl: string;
  authorized: boolean;
  authorizationError: string;
  protocol: string;
  cipherName: string;
  cert: PeerCertificateLike | null;
  error?: string;
};

function finding(
  id: string,
  title: string,
  severity: TlsCertificateSeverity,
  evidence: string,
  recommendation: string,
  description: string,
  sourceUrl: string,
  observedValue: string,
): TlsCertificateFinding {
  return {
    id,
    title,
    severity,
    risk_level: severity,
    category: "tls_certificate",
    evidence,
    recommendation,
    description,
    confidence: "high",
    verification_status: "verified_by_scan",
    evidence_type: "http_probe",
    source_url: sourceUrl,
    observed_value: observedValue,
    expected_value:
      "Website should present a valid, trusted, hostname-matching TLS certificate with safe expiry margin.",
    limitation:
      "TLS certificate check uses passive HTTPS handshake only. It does not perform full SSL Labs style protocol grading.",
    root_cause: "tls_certificate_quality",
  };
}

function parseUrl(inputUrl: string) {
  try {
    const url = new URL(
      inputUrl.startsWith("http") ? inputUrl : `https://${inputUrl}`,
    );
    return {
      checkedUrl: url.toString(),
      host: url.hostname,
      port: url.port ? Number(url.port) : 443,
    };
  } catch {
    return null;
  }
}

function extractDnsNames(cert: PeerCertificateLike | null) {
  if (!cert?.subjectaltname) return [];

  return cert.subjectaltname
    .split(",")
    .map((item) => item.trim())
    .filter((item) => /^DNS:/i.test(item))
    .map((item) => item.replace(/^DNS:/i, "").trim().toLowerCase())
    .filter(Boolean);
}

function hostnameMatchesPattern(hostname: string, pattern: string) {
  const host = hostname.toLowerCase();
  const candidate = pattern.toLowerCase();

  if (host === candidate) return true;

  if (!candidate.startsWith("*.")) return false;

  const suffix = candidate.slice(2);
  if (!host.endsWith(`.${suffix}`)) return false;

  const leftSide = host.slice(0, host.length - suffix.length - 1);
  return leftSide.length > 0 && !leftSide.includes(".");
}

function certificateMatchesHostname(
  hostname: string,
  cert: PeerCertificateLike | null,
) {
  if (!cert) return false;

  const dnsNames = extractDnsNames(cert);

  if (dnsNames.length > 0) {
    return dnsNames.some((name) => hostnameMatchesPattern(hostname, name));
  }

  const commonName = cert.subject?.CN?.toLowerCase();

  if (!commonName) return false;

  return hostnameMatchesPattern(hostname, commonName);
}

function certificateNameEvidence(cert: PeerCertificateLike | null) {
  const dnsNames = extractDnsNames(cert);
  const commonName = cert?.subject?.CN || "not visible";

  return [
    `Subject CN: ${commonName}`,
    `Subject Alternative Names: ${dnsNames.length > 0 ? dnsNames.slice(0, 12).join(", ") : "not visible"}`,
  ].join("\n");
}

function parseDate(value?: string) {
  if (!value) return null;

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function daysUntil(date: Date) {
  return Math.ceil((date.getTime() - Date.now()) / 86400000);
}

function samePartyName(
  left?: Record<string, string>,
  right?: Record<string, string>,
) {
  const leftName = `${left?.CN || ""}|${left?.O || ""}`.toLowerCase();
  const rightName = `${right?.CN || ""}|${right?.O || ""}`.toLowerCase();

  return Boolean(leftName.trim()) && leftName === rightName;
}

function certificateSummary(result: TlsProbeResult) {
  const cert = result.cert;
  const validFrom = cert?.valid_from || "not visible";
  const validTo = cert?.valid_to || "not visible";
  const issuer = cert?.issuer?.CN || cert?.issuer?.O || "not visible";
  const subject = cert?.subject?.CN || cert?.subject?.O || "not visible";

  return [
    `Source URL: ${result.checkedUrl}`,
    `TLS host: ${result.host}:${result.port}`,
    `Authorized by runtime: ${result.authorized}`,
    result.authorizationError
      ? `Authorization error: ${result.authorizationError}`
      : "",
    `Protocol: ${result.protocol || "not visible"}`,
    `Cipher: ${result.cipherName || "not visible"}`,
    `Subject: ${subject}`,
    `Issuer: ${issuer}`,
    `Valid from: ${validFrom}`,
    `Valid to: ${validTo}`,
    cert?.fingerprint256 ? `Fingerprint SHA-256: ${cert.fingerprint256}` : "",
    cert?.serialNumber ? `Serial number: ${cert.serialNumber}` : "",
    typeof cert?.bits === "number" ? `Key size: ${cert.bits} bits` : "",
    certificateNameEvidence(cert),
  ]
    .filter(Boolean)
    .join("\n");
}

async function probeTlsCertificate(inputUrl: string): Promise<TlsProbeResult> {
  const parsed = parseUrl(inputUrl);

  if (!parsed) {
    return {
      host: "unknown",
      port: 443,
      checkedUrl: inputUrl,
      authorized: false,
      authorizationError: "Invalid URL",
      protocol: "",
      cipherName: "",
      cert: null,
      error: "Invalid URL",
    };
  }

  const tls = await import("node:tls");

  return await new Promise<TlsProbeResult>((resolve) => {
    const socket = tls.connect(
      {
        host: parsed.host,
        port: parsed.port,
        servername: parsed.host,
        rejectUnauthorized: false,
        timeout: 8000,
      },
      () => {
        const peerCert = socket.getPeerCertificate(true) as PeerCertificateLike;
        const cipher = socket.getCipher();

        const result: TlsProbeResult = {
          host: parsed.host,
          port: parsed.port,
          checkedUrl: parsed.checkedUrl,
          authorized: Boolean(socket.authorized),
          authorizationError: socket.authorizationError
            ? String(socket.authorizationError)
            : "",
          protocol: socket.getProtocol() || "",
          cipherName: cipher?.name || "",
          cert: peerCert && Object.keys(peerCert).length > 0 ? peerCert : null,
        };

        socket.end();
        resolve(result);
      },
    );

    const timer = setTimeout(() => {
      socket.destroy();
      resolve({
        host: parsed.host,
        port: parsed.port,
        checkedUrl: parsed.checkedUrl,
        authorized: false,
        authorizationError: "TLS handshake timed out",
        protocol: "",
        cipherName: "",
        cert: null,
        error: "TLS handshake timed out",
      });
    }, 9000);

    socket.once("error", (error) => {
      clearTimeout(timer);
      socket.destroy();
      resolve({
        host: parsed.host,
        port: parsed.port,
        checkedUrl: parsed.checkedUrl,
        authorized: false,
        authorizationError: error.message,
        protocol: "",
        cipherName: "",
        cert: null,
        error: error.message,
      });
    });

    socket.once("close", () => {
      clearTimeout(timer);
    });
  });
}

export async function tlsCertificateFindingsForUrl(
  inputUrl: string,
): Promise<TlsCertificateFinding[]> {
  const result = await probeTlsCertificate(inputUrl);
  const findings: TlsCertificateFinding[] = [];
  const evidence = certificateSummary(result);

  if (result.error || !result.cert) {
    findings.push(
      finding(
        "tls_certificate_not_verified",
        "TLS certificate could not be verified",
        "medium",
        evidence,
        "Confirm the website supports HTTPS on port 443 and presents a valid public certificate.",
        "The scanner could not complete a visible TLS certificate verification for the website.",
        result.checkedUrl,
        result.error || result.authorizationError || "certificate not visible",
      ),
    );

    return findings;
  }

  if (!result.authorized && result.authorizationError) {
    findings.push(
      finding(
        "tls_certificate_not_trusted",
        "TLS certificate is not trusted by the runtime",
        "high",
        evidence,
        "Install a valid certificate from a trusted certificate authority and verify the full certificate chain.",
        "The website presented a TLS certificate, but the runtime did not consider it trusted.",
        result.checkedUrl,
        result.authorizationError,
      ),
    );
  }

  const validTo = parseDate(result.cert.valid_to);
  const validFrom = parseDate(result.cert.valid_from);

  if (!validTo || !validFrom) {
    findings.push(
      finding(
        "tls_certificate_validity_dates_not_visible",
        "TLS certificate validity dates are not clearly visible",
        "low",
        evidence,
        "Review the certificate and confirm its validity period.",
        "The scan could not read clear certificate validity dates.",
        result.checkedUrl,
        "validity dates not visible",
      ),
    );
  } else {
    const remainingDays = daysUntil(validTo);

    if (remainingDays < 0) {
      findings.push(
        finding(
          "tls_certificate_expired",
          "TLS certificate is expired",
          "high",
          evidence,
          "Renew and deploy a valid TLS certificate immediately.",
          "The website certificate appears expired based on the visible validity date.",
          result.checkedUrl,
          `expired ${Math.abs(remainingDays)} day(s) ago`,
        ),
      );
    } else if (remainingDays <= 14) {
      findings.push(
        finding(
          "tls_certificate_expires_very_soon",
          "TLS certificate expires very soon",
          "medium",
          evidence,
          "Renew the TLS certificate before expiry and verify auto-renewal.",
          "The website certificate is close to expiry.",
          result.checkedUrl,
          `${remainingDays} day(s) remaining`,
        ),
      );
    } else if (remainingDays <= 30) {
      findings.push(
        finding(
          "tls_certificate_expires_soon",
          "TLS certificate expires soon",
          "low",
          evidence,
          "Check certificate auto-renewal and renewal monitoring.",
          "The website certificate is within a short expiry window.",
          result.checkedUrl,
          `${remainingDays} day(s) remaining`,
        ),
      );
    }
  }

  if (!certificateMatchesHostname(result.host, result.cert)) {
    findings.push(
      finding(
        "tls_certificate_hostname_mismatch",
        "TLS certificate does not clearly match the hostname",
        "high",
        evidence,
        "Deploy a certificate whose Subject Alternative Name includes the exact hostname or a valid wildcard match.",
        "The visible certificate names do not clearly match the scanned hostname.",
        result.checkedUrl,
        `hostname checked: ${result.host}`,
      ),
    );
  }

  const dnsNames = extractDnsNames(result.cert);
  if (dnsNames.length === 0) {
    findings.push(
      finding(
        "tls_certificate_missing_subject_alt_name",
        "TLS certificate Subject Alternative Name is not visible",
        "low",
        evidence,
        "Use a certificate with Subject Alternative Name entries for all covered hostnames.",
        "Modern certificates should include hostname coverage in Subject Alternative Name.",
        result.checkedUrl,
        "SAN not visible",
      ),
    );
  }

  if (
    typeof result.cert.bits === "number" &&
    result.cert.bits > 0 &&
    result.cert.bits < 2048
  ) {
    findings.push(
      finding(
        "tls_certificate_weak_key_size",
        "TLS certificate key size is weak",
        "medium",
        evidence,
        "Use a certificate key size of at least 2048-bit RSA or a modern equivalent.",
        "The visible certificate key size appears weaker than commonly expected.",
        result.checkedUrl,
        `${result.cert.bits} bits`,
      ),
    );
  }

  if (samePartyName(result.cert.subject, result.cert.issuer)) {
    findings.push(
      finding(
        "tls_certificate_self_signed_signal",
        "TLS certificate appears self-signed",
        "medium",
        evidence,
        "Use a certificate issued by a trusted public certificate authority for public websites.",
        "The certificate subject and issuer appear to be the same party.",
        result.checkedUrl,
        "subject and issuer appear similar",
      ),
    );
  }

  return findings;
}
