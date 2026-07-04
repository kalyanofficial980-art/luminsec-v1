export type ReportLanguage = "en" | "te";

type FindingInput = {
  severity: string;
  category: string;
  title: string;
  description?: string | null;
  recommendation?: string | null;
};

type SummaryInput = {
  overallScore: number;
  securityScore: number;
  privacyScore: number;
  trustScore: number;
  riskLevel: string;
  findings: FindingInput[];
  language: ReportLanguage;
};

export function getReportLanguage(value: string | undefined | null): ReportLanguage {
  return value === "te" ? "te" : "en";
}

export function getReportCopy(language: ReportLanguage) {
  if (language === "te") {
    return {
      modeLabel: "Telugu-English",
      reportTitle: "Website Trust Report",
      safePassiveResult: "Safe passive scan result",
      aiSummaryTitle: "Plain-language summary",
      executiveSummary: "Executive summary",
      findings: "Findings",
      recommendation: "Recommendation",
      plainExplanation: "Simple explanation",
      downloadPdf: "Download PDF",
      allReports: "All reports",
      backToWebsites: "Back to websites",
      overallScore: "Overall score",
      securityScore: "Security score",
      privacyScore: "Privacy score",
      trustScore: "Trust score",
      disclaimer:
        "Disclaimer: Idi basic passive readiness check only. Idi legal advice kaadu, full cybersecurity audit kaadu, penetration test kaadu.",
    };
  }

  return {
    modeLabel: "English",
    reportTitle: "Website Trust Report",
    safePassiveResult: "Safe passive scan result",
    aiSummaryTitle: "Plain-language summary",
    executiveSummary: "Executive summary",
    findings: "Findings",
    recommendation: "Recommendation",
    plainExplanation: "Plain-language explanation",
    downloadPdf: "Download PDF",
    allReports: "All reports",
    backToWebsites: "Back to websites",
    overallScore: "Overall score",
    securityScore: "Security score",
    privacyScore: "Privacy score",
    trustScore: "Trust score",
    disclaimer:
      "Disclaimer: This is a basic passive readiness check. It is not legal advice, not a full cybersecurity audit, and not a penetration test.",
  };
}

function countSeverity(findings: FindingInput[], severity: string) {
  return findings.filter((finding) => finding.severity === severity).length;
}

function getMainWeakArea(input: SummaryInput) {
  const scores = [
    { key: "security", score: input.securityScore },
    { key: "privacy", score: input.privacyScore },
    { key: "trust", score: input.trustScore },
  ];

  return scores.sort((a, b) => a.score - b.score)[0];
}

export function getAiStyleSummary(input: SummaryInput) {
  const highCount = countSeverity(input.findings, "high");
  const mediumCount = countSeverity(input.findings, "medium");
  const lowCount = countSeverity(input.findings, "low");
  const weakArea = getMainWeakArea(input);

  if (input.language === "te") {
    const weakAreaText =
      weakArea.key === "security"
        ? "security side"
        : weakArea.key === "privacy"
          ? "privacy side"
          : "trust side";

    if (input.overallScore >= 80) {
      return `Mee website basic passive checks lo good ga undi. Overall score ${input.overallScore}/100. Still, ${weakAreaText} lo small improvements chesthe customer trust inka better avuthundi. High issues ${highCount}, medium issues ${mediumCount}, low issues ${lowCount} detect ayyayi.`;
    }

    if (input.overallScore >= 60) {
      return `Mee website usable ga undi, but improvement avasaram. Overall score ${input.overallScore}/100. Main weak area ${weakAreaText}. High issues ${highCount}, medium issues ${mediumCount}, low issues ${lowCount}. Developer ki report share chesi headers, privacy wording, trust pages improve cheyyandi.`;
    }

    if (input.overallScore >= 40) {
      return `Mee website lo multiple basic readiness gaps unnayi. Overall score ${input.overallScore}/100. ${weakAreaText} first priority. High issues ${highCount}, medium issues ${mediumCount}. Business website customer data collect chesthe privacy policy and form wording clear ga undali.`;
    }

    return `Mee website basic passive scan lo high risk range lo undi. Overall score ${input.overallScore}/100. First HTTPS/security headers/privacy policy/contact form privacy wording check cheyyali. Developer support teesukoni fixes complete cheyyadam better.`;
  }

  if (input.overallScore >= 80) {
    return `This website has a good basic readiness posture with an overall score of ${input.overallScore}/100. The weakest area is ${weakArea.key}, so improving that area can increase customer trust further. Detected findings: ${highCount} high, ${mediumCount} medium, and ${lowCount} low.`;
  }

  if (input.overallScore >= 60) {
    return `This website is usable but needs improvement. Overall score is ${input.overallScore}/100, with ${weakArea.key} being the weakest area. The report found ${highCount} high, ${mediumCount} medium, and ${lowCount} low findings. Share this report with the website developer to improve headers, privacy wording, and trust signals.`;
  }

  if (input.overallScore >= 40) {
    return `This website has multiple basic readiness gaps. Overall score is ${input.overallScore}/100. The first priority should be improving ${weakArea.key}. If the website collects user data, privacy policy visibility and contact-form wording should be reviewed.`;
  }

  return `This website appears high risk based on the basic passive checks. Overall score is ${input.overallScore}/100. Review HTTPS, security headers, privacy policy visibility, and contact-form privacy wording before using it for customer data collection.`;
}

export function explainFinding(finding: FindingInput, language: ReportLanguage) {
  const category = finding.category.toLowerCase();
  const severity = finding.severity.toLowerCase();

  if (language === "te") {
    if (category.includes("security")) {
      return `Idi ${severity} level security-related finding. Simple ga cheppalante, browser/server protection improve cheyyali. Website developer ki recommendation share chesi fix cheyyandi.`;
    }

    if (category.includes("privacy") || category.includes("forms")) {
      return `Idi privacy/customer data related finding. Website user name, phone, email, message lantivi collect chesthe, privacy policy and form wording clear ga undali.`;
    }

    if (category.includes("trust")) {
      return `Idi trust signal related finding. Customer ki website professional and reliable ga kanipinchadaniki terms, sitemap, robots, policy links lantivi useful.`;
    }

    return `Idi basic readiness finding. Business owner/developer recommendation follow chesthe website trust and safety improve avuthundi.`;
  }

  if (category.includes("security")) {
    return `This is a ${severity} security-related finding. In simple terms, the website should improve browser or server-side protection. Share the recommendation with the developer.`;
  }

  if (category.includes("privacy") || category.includes("forms")) {
    return `This is related to privacy or customer data collection. If the website collects names, phone numbers, email addresses, or messages, the privacy policy and form wording should be clear.`;
  }

  if (category.includes("trust")) {
    return `This is a trust-signal finding. Terms, sitemap, robots, and policy links help the website look more professional and reliable.`;
  }

  return `This is a basic readiness finding. Following the recommendation can improve website trust and safety.`;
}