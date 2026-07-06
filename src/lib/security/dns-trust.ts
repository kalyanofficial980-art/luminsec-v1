export type DnsTrustSeverity = "info" | "low" | "medium" | "high" | "critical";

export type DnsTrustFinding = {
  id: string;
  title: string;
  description: string;
  category: string;
  severity: DnsTrustSeverity;
  risk_level: DnsTrustSeverity;
  evidence: string;
  recommendation: string;
  confidence?: "high" | "medium" | "low";
  verification_status?: "verified_by_scan" | "likely_signal" | "needs_confirmation" | "not_visible";
  evidence_type?: "http_probe" | "scan_quality" | "unknown";
  source_url?: string;
  observed_value?: string;
  expected_value?: string;
  limitation?: string;
  root_cause?: string;
};

type DnsProbeResult = {
  checkedUrl: string;
  host: string;
  domainChecked: string;
  mx: string[];
  spf: string[];
  dmarc: string[];
  caa: string[];
  txtErrors: string[];
};

function finding(
  id: string,
  title: string,
  severity: DnsTrustSeverity,
  evidence: string,
  recommendation: string,
  description: string,
  sourceUrl: string,
  observedValue: string
): DnsTrustFinding {
  return {
    id,
    title,
    severity,
    risk_level: severity,
    category: "dns_trust",
    evidence,
    recommendation,
    description,
    confidence: "high",
    verification_status: "verified_by_scan",
    evidence_type: "http_probe",
    source_url: sourceUrl,
    observed_value: observedValue,
    expected_value: "Domain should have visible DNS trust records such as MX, SPF, DMARC, and CAA where appropriate.",
    limitation: "Passive DNS lookup only. This does not verify mailbox configuration, email delivery, or full DNSSEC posture.",
    root_cause: "dns_trust_records",
  };
}

function parseInput(inputUrl: string) {
  try {
    const url = new URL(inputUrl.startsWith("http") ? inputUrl : `https://${inputUrl}`);

    return {
      checkedUrl: url.toString(),
      host: url.hostname.toLowerCase(),
    };
  } catch {
    return {
      checkedUrl: inputUrl,
      host: String(inputUrl || "").replace(/^https?:\/\//i, "").split("/")[0].toLowerCase(),
    };
  }
}

function candidateDomains(host: string) {
  const cleanHost = host.replace(/^www\./i, "").replace(/\.$/, "");
  const parts = cleanHost.split(".").filter(Boolean);

  const candidates = new Set<string>();

  if (cleanHost) candidates.add(cleanHost);

  if (parts.length >= 2) {
    candidates.add(parts.slice(-2).join("."));
  }

  if (parts.length >= 3) {
    const twoPartPublicSuffixes = new Set([
      "co.in",
      "com.au",
      "co.uk",
      "org.uk",
      "ac.in",
      "net.in",
      "firm.in",
      "gen.in",
      "ind.in",
    ]);

    const lastTwo = parts.slice(-2).join(".");
    if (twoPartPublicSuffixes.has(lastTwo)) {
      candidates.add(parts.slice(-3).join("."));
    }
  }

  return Array.from(candidates);
}

async function resolveTxtSafe(domain: string) {
  try {
    const dns = await import("node:dns/promises");
    const records = await dns.resolveTxt(domain);
    return {
      records: records.map((parts) => parts.join("")),
      error: "",
    };
  } catch (error) {
    return {
      records: [] as string[],
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

async function resolveMxSafe(domain: string) {
  try {
    const dns = await import("node:dns/promises");
    const records = await dns.resolveMx(domain);
    return {
      records: records.map((record) => `${record.exchange} priority=${record.priority}`),
      error: "",
    };
  } catch (error) {
    return {
      records: [] as string[],
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

async function resolveCaaSafe(domain: string) {
  try {
    const dns = await import("node:dns/promises");
    const records = await dns.resolveCaa(domain);
    return {
      records: records.map((record) => `${record.critical ? "critical " : ""}${record.issue || record.issuewild || record.iodef || "unknown"}`),
      error: "",
    };
  } catch (error) {
    return {
      records: [] as string[],
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

function spfRecords(txt: string[]) {
  return txt.filter((record) => /^v=spf1\b/i.test(record.trim()));
}

function dmarcRecords(txt: string[]) {
  return txt.filter((record) => /^v=dmarc1\b/i.test(record.trim()));
}

function dmarcPolicy(record: string) {
  const match = record.match(/(?:^|;)\s*p\s*=\s*([^;\s]+)/i);
  return match?.[1]?.toLowerCase() || "";
}

function spfTooPermissive(record: string) {
  const normalized = record.toLowerCase();
  return normalized.includes("+all") || normalized.includes("?all");
}

function spfSoftFail(record: string) {
  return record.toLowerCase().includes("~all");
}

function evidence(result: DnsProbeResult) {
  return [
    `Source URL: ${result.checkedUrl}`,
    `Host: ${result.host}`,
    `Domain checked: ${result.domainChecked}`,
    `MX records: ${result.mx.length > 0 ? result.mx.join(" | ") : "not visible"}`,
    `SPF records: ${result.spf.length > 0 ? result.spf.join(" | ") : "not visible"}`,
    `DMARC records: ${result.dmarc.length > 0 ? result.dmarc.join(" | ") : "not visible"}`,
    `CAA records: ${result.caa.length > 0 ? result.caa.join(" | ") : "not visible"}`,
    result.txtErrors.length > 0 ? `Lookup notes: ${result.txtErrors.join(" | ")}` : "",
    "Limitation: DNS visibility can vary by resolver and propagation. This is not email delivery verification.",
  ]
    .filter(Boolean)
    .join("\n");
}

async function probeDnsTrust(inputUrl: string): Promise<DnsProbeResult> {
  const parsed = parseInput(inputUrl);
  const domains = candidateDomains(parsed.host);

  let best: DnsProbeResult | null = null;

  for (const domain of domains) {
    const [txtResult, dmarcTxtResult, mxResult, caaResult] = await Promise.all([
      resolveTxtSafe(domain),
      resolveTxtSafe(`_dmarc.${domain}`),
      resolveMxSafe(domain),
      resolveCaaSafe(domain),
    ]);

    const result: DnsProbeResult = {
      checkedUrl: parsed.checkedUrl,
      host: parsed.host,
      domainChecked: domain,
      mx: mxResult.records,
      spf: spfRecords(txtResult.records),
      dmarc: dmarcRecords(dmarcTxtResult.records),
      caa: caaResult.records,
      txtErrors: [txtResult.error, dmarcTxtResult.error, mxResult.error, caaResult.error].filter(Boolean),
    };

    const score = result.mx.length + result.spf.length + result.dmarc.length + result.caa.length;

    if (!best || score > best.mx.length + best.spf.length + best.dmarc.length + best.caa.length) {
      best = result;
    }

    if (score >= 3) break;
  }

  return (
    best || {
      checkedUrl: parsed.checkedUrl,
      host: parsed.host,
      domainChecked: parsed.host,
      mx: [],
      spf: [],
      dmarc: [],
      caa: [],
      txtErrors: ["No DNS result available"],
    }
  );
}

export async function dnsTrustFindingsForUrl(inputUrl: string): Promise<DnsTrustFinding[]> {
  const result = await probeDnsTrust(inputUrl);
  const findings: DnsTrustFinding[] = [];
  const proof = evidence(result);

  if (result.mx.length === 0) {
    findings.push(
      finding(
        "dns_mx_records_not_visible",
        "MX records are not visible for the domain",
        "info",
        proof,
        "Add MX records if the domain sends or receives business email. Ignore this only if the domain intentionally does not use email.",
        "The DNS lookup did not find visible MX records for the checked domain.",
        result.checkedUrl,
        "MX not visible"
      )
    );
  }

  if (result.spf.length === 0) {
    findings.push(
      finding(
        "dns_spf_record_missing",
        "SPF record is not visible",
        "low",
        proof,
        "Add an SPF TXT record that lists approved email senders for the domain.",
        "SPF helps receiving mail servers understand which systems are allowed to send email for the domain.",
        result.checkedUrl,
        "SPF not visible"
      )
    );
  } else if (result.spf.length > 1) {
    findings.push(
      finding(
        "dns_multiple_spf_records",
        "Multiple SPF records are visible",
        "medium",
        proof,
        "Keep only one SPF record and combine all approved senders into that single record.",
        "Multiple SPF records can cause email authentication failures.",
        result.checkedUrl,
        `${result.spf.length} SPF records`
      )
    );
  } else if (spfTooPermissive(result.spf[0])) {
    findings.push(
      finding(
        "dns_spf_record_too_permissive",
        "SPF record is too permissive",
        "medium",
        proof,
        "Avoid +all or ?all in SPF. Use a stricter all mechanism after confirming authorized senders.",
        "The visible SPF policy appears permissive and may reduce spoofing protection.",
        result.checkedUrl,
        result.spf[0]
      )
    );
  } else if (spfSoftFail(result.spf[0])) {
    findings.push(
      finding(
        "dns_spf_record_softfail",
        "SPF record uses softfail",
        "info",
        proof,
        "Review whether SPF can safely move from ~all to -all after confirming all legitimate senders.",
        "The visible SPF policy uses softfail. This can be acceptable during rollout, but should be reviewed.",
        result.checkedUrl,
        result.spf[0]
      )
    );
  }

  if (result.dmarc.length === 0) {
    findings.push(
      finding(
        "dns_dmarc_record_missing",
        "DMARC record is not visible",
        "low",
        proof,
        "Add a DMARC TXT record at _dmarc.domain with reporting and an appropriate policy.",
        "DMARC helps protect the domain from spoofed email when aligned with SPF or DKIM.",
        result.checkedUrl,
        "DMARC not visible"
      )
    );
  } else {
    const policy = dmarcPolicy(result.dmarc[0]);

    if (!policy) {
      findings.push(
        finding(
          "dns_dmarc_policy_not_clear",
          "DMARC policy is not clear",
          "low",
          proof,
          "Set a clear DMARC policy such as p=none for monitoring or p=quarantine/reject after rollout.",
          "The visible DMARC record does not clearly expose a p= policy.",
          result.checkedUrl,
          result.dmarc[0]
        )
      );
    } else if (policy === "none") {
      findings.push(
        finding(
          "dns_dmarc_monitoring_only",
          "DMARC is in monitoring-only mode",
          "info",
          proof,
          "Use p=none for monitoring, then move to quarantine or reject after confirming legitimate mail alignment.",
          "The domain has DMARC, but the policy does not yet enforce blocking or quarantine.",
          result.checkedUrl,
          result.dmarc[0]
        )
      );
    }
  }

  if (result.caa.length === 0) {
    findings.push(
      finding(
        "dns_caa_record_missing",
        "CAA record is not visible",
        "info",
        proof,
        "Add CAA records to specify which certificate authorities may issue certificates for the domain.",
        "CAA records can reduce unauthorized certificate issuance risk.",
        result.checkedUrl,
        "CAA not visible"
      )
    );
  }

  return findings;
}