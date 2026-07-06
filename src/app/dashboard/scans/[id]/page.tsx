import Link from "next/link";
import { notFound } from "next/navigation";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  ClipboardCheck,
  ExternalLink,
  FileText,
  Gauge,
  Lightbulb,
  ShieldCheck,
  Wrench,
} from "lucide-react";
import { requireDashboardUser } from "@/lib/auth/route-access";
import { calculateEvidenceBasedScoring } from "@/lib/security/evidence-based-scoring";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

function clampScore(value: unknown) {
  const score = Number(value);

  if (!Number.isFinite(score)) {
    return 0;
  }

  return Math.max(0, Math.min(100, Math.round(score)));
}

function normalizeText(value: unknown, fallback = "") {
  const text = String(value ?? "").trim();
  return text.length > 0 ? text : fallback;
}

function normalizeRisk(value: unknown) {
  const risk = String(value ?? "unknown").toLowerCase();

  if (risk.includes("critical")) return "critical";
  if (risk.includes("high")) return "high";
  if (risk.includes("medium") || risk.includes("moderate")) return "medium";
  if (risk.includes("low")) return "low";

  return "unknown";
}

function riskLabel(value: unknown) {
  const risk = normalizeRisk(value);

  if (risk === "critical") return "Critical";
  if (risk === "high") return "High";
  if (risk === "medium") return "Medium";
  if (risk === "low") return "Low";

  return "Review";
}

function riskClass(value: unknown) {
  const risk = normalizeRisk(value);

  if (risk === "critical") return "border-red-400/30 bg-red-400/10 text-red-100";
  if (risk === "high") return "border-orange-400/30 bg-orange-400/10 text-orange-100";
  if (risk === "medium") return "border-amber-400/30 bg-amber-400/10 text-amber-100";
  if (risk === "low") return "border-emerald-400/30 bg-emerald-400/10 text-emerald-100";

  return "border-slate-400/30 bg-slate-400/10 text-slate-200";
}

function severityClass(value: unknown) {
  const severity = normalizeRisk(value);

  if (severity === "critical") return "border-red-400/30 bg-red-400/10 text-red-100";
  if (severity === "high") return "border-orange-400/30 bg-orange-400/10 text-orange-100";
  if (severity === "medium") return "border-amber-400/30 bg-amber-400/10 text-amber-100";
  if (severity === "low") return "border-emerald-400/30 bg-emerald-400/10 text-emerald-100";

  return "border-cyan-400/30 bg-cyan-400/10 text-cyan-100";
}

function scoreClass(score: number) {
  if (score >= 85) return "text-emerald-300";
  if (score >= 65) return "text-amber-300";
  if (score >= 40) return "text-orange-300";
  return "text-red-300";
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function extractSection(body: unknown, label: string) {
  const text = normalizeText(body);
  const pattern = new RegExp(
    `${escapeRegExp(label)}:\\s*([\\s\\S]*?)(?=\\n\\n[A-Z][A-Za-z\\s]+:|$)`,
    "i"
  );
  const match = text.match(pattern);

  return normalizeText(match?.[1]);
}

function safeArray(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.map((item) => String(item ?? "").trim()).filter(Boolean);
}

function evidenceLines(value: unknown) {
  const text = normalizeText(value);

  if (!text) {
    return [];
  }

  return text
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean);
}

function scoreCard(label: string, value: number) {
  return (
    <div className="rounded-3xl border border-white/10 bg-slate-950/70 p-5">
      <p className="text-sm font-bold text-slate-400">{label}</p>
      <p className={`mt-3 text-4xl font-black ${scoreClass(value)}`}>{value}</p>
      <p className="mt-1 text-xs font-bold text-slate-500">out of 100</p>
    </div>
  );
}


type ReportFindingForEvidence = {
  id?: unknown;
  category?: unknown;
  severity?: unknown;
  title?: unknown;
  description?: unknown;
  recommendation?: unknown;
  evidence?: unknown;
};

function inferFindingEvidenceType(finding: ReportFindingForEvidence) {
  const joined = [
    finding.category,
    finding.title,
    finding.description,
    finding.evidence,
  ]
    .map((value) => normalizeText(value).toLowerCase())
    .join(" ");

  if (joined.includes("header")) return "response_header";
  if (joined.includes("cookie")) return "set_cookie";
  if (joined.includes("dns") || joined.includes("spf") || joined.includes("dmarc") || joined.includes("caa")) return "http_probe";
  if (joined.includes("tls") || joined.includes("certificate")) return "http_probe";
  if (joined.includes("customer") || joined.includes("form") || joined.includes("privacy") || joined.includes("consent") || joined.includes("dpdp")) return "html_signal";
  if (joined.includes("technology")) return "technology_signal";
  if (joined.includes("known risk") || joined.includes("advisory")) return "known_risk_advisory";

  return "unknown";
}

function inferFindingVerificationStatus(finding: ReportFindingForEvidence) {
  const evidence = evidenceLines(finding.evidence);
  const joined = [
    finding.category,
    finding.title,
    finding.description,
    finding.evidence,
  ]
    .map((value) => normalizeText(value).toLowerCase())
    .join(" ");

  if (evidence.length === 0) return "needs_confirmation";
  if (joined.includes("likely") || joined.includes("advisory") || joined.includes("dpdp") || joined.includes("self-attestation")) return "likely_signal";

  return "verified_by_scan";
}

function inferFindingConfidence(finding: ReportFindingForEvidence) {
  const confidence = extractSection(finding.description, "Confidence").toLowerCase();

  if (confidence.includes("high")) return "high";
  if (confidence.includes("medium")) return "medium";
  if (confidence.includes("low")) return "low";

  return evidenceLines(finding.evidence).length > 0 ? "high" : "low";
}

function actionList(title: string, items: string[], icon: "owner" | "developer" | "fast") {
  const Icon = icon === "developer" ? Wrench : icon === "fast" ? Lightbulb : ClipboardCheck;

  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
      <div className="mb-5 flex items-center gap-3">
        <Icon className="h-6 w-6 text-cyan-300" />
        <h2 className="text-xl font-black text-white">{title}</h2>
      </div>

      {items.length > 0 ? (
        <div className="grid gap-3">
          {items.map((item, index) => (
            <div key={`${item}-${index}`} className="rounded-2xl border border-white/10 bg-slate-950 p-4">
              <div className="flex gap-3">
                <CheckCircle2 className="mt-1 h-5 w-5 shrink-0 text-emerald-300" />
                <p className="leading-7 text-slate-300">{item}</p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="leading-7 text-slate-400">No specific items in this section for this scan.</p>
      )}
    </div>
  );
}

export default async function ScanReportPage({ params }: PageProps) {
  const { id } = await params;
  const { supabase, user, profile } = await requireDashboardUser();

  let scanQuery = supabase
    .from("scan_results")
    .select(
      "id, user_id, website_id, url, domain, status, overall_score, score, security_score, privacy_score, trust_score, risk_level, summary, raw_result, raw, created_at, is_public, public_share_id"
    )
    .eq("id", id);

  if (profile.role !== "admin") {
    scanQuery = scanQuery.eq("user_id", user.id);
  }

  const { data: scan } = await scanQuery.maybeSingle();

  if (!scan) {
    notFound();
  }

  let findingsQuery = supabase
    .from("scan_findings")
    .select("id, category, severity, title, description, recommendation, evidence, created_at")
    .eq("scan_result_id", scan.id)
    .order("created_at", { ascending: true });

  if (profile.role !== "admin") {
    findingsQuery = findingsQuery.eq("user_id", user.id);
  }

  const { data: findings } = await findingsQuery;

  let websiteName = scan.domain || "Website";

  if (scan.website_id) {
    let websiteQuery = supabase
      .from("websites")
      .select("name, url, domain")
      .eq("id", scan.website_id);

    if (profile.role !== "admin") {
      websiteQuery = websiteQuery.eq("user_id", user.id);
    }

    const { data: website } = await websiteQuery.maybeSingle();

    websiteName = website?.name || website?.domain || scan.domain || "Website";
  }

  const rawResult = (scan.raw_result || scan.raw || {}) as {
    professional?: {
      summary?: {
        score?: {
          overall?: number;
          security?: number;
          privacy?: number;
          trust?: number;
          exposure?: number;
          technicalHygiene?: number;
        };
        topRisks?: string[];
        fastestFixes?: string[];
        ownerActions?: string[];
        developerActions?: string[];
      };
    };
  };

  const professionalSummary = rawResult.professional?.summary;

  const overallScore = clampScore(
    professionalSummary?.score?.overall ?? scan.overall_score ?? scan.score
  );
  const securityScore = clampScore(
    professionalSummary?.score?.security ?? scan.security_score
  );
  const privacyScore = clampScore(
    professionalSummary?.score?.privacy ?? scan.privacy_score
  );
  const trustScore = clampScore(
    professionalSummary?.score?.trust ?? scan.trust_score
  );
  const exposureScore = clampScore(professionalSummary?.score?.exposure ?? 0);
  const hygieneScore = clampScore(professionalSummary?.score?.technicalHygiene ?? 0);

  const topRisks = safeArray(professionalSummary?.topRisks);
  const fastestFixes = safeArray(professionalSummary?.fastestFixes);
  const ownerActions = safeArray(professionalSummary?.ownerActions);
  const developerActions = safeArray(professionalSummary?.developerActions);
  const professionalMeta = professionalSummary as unknown as {
    scoreExplanation?: unknown;
    riskReason?: unknown;
    scoreDrivers?: unknown;
    scoreImprovements?: unknown;
  } | undefined;
  const scoreExplanation = safeArray(professionalMeta?.scoreExplanation);
  const riskReason = normalizeText(professionalMeta?.riskReason);
  const scoreDrivers = safeArray(professionalMeta?.scoreDrivers);
  const scoreImprovements = safeArray(professionalMeta?.scoreImprovements);

  const reportUrl = scan.url || `https://${scan.domain}`;

  const evidenceBasedScoring = calculateEvidenceBasedScoring(
    (findings ?? []).map((finding) => ({
      id: finding.id,
      category: finding.category,
      severity: finding.severity,
      risk_level: finding.severity,
      title: finding.title,
      evidence: finding.evidence,
      confidence: inferFindingConfidence(finding),
      verification_status: inferFindingVerificationStatus(finding),
      evidence_type: inferFindingEvidenceType(finding),
      source_url: reportUrl,
      root_cause: `${normalizeText(finding.category, "general")}_${normalizeText(finding.title, "finding").slice(0, 80)}`,
    }))
  );

  return (
    <main className="min-h-screen bg-slate-950 p-6 text-white">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
          <Link
            href="/dashboard/scans"
            className="inline-flex items-center gap-2 text-sm font-bold text-cyan-300 hover:text-cyan-200"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to reports
          </Link>

          <div className="flex flex-wrap gap-3">
            <Link
              href={`/dashboard/scans/${scan.id}/action-plan`}
              className="rounded-2xl border border-white/10 px-4 py-3 text-sm font-black text-white hover:bg-white/10"
            >
              Action plan
            </Link>
            <Link
              href={`/dashboard/scans/${scan.id}/comparison`}
              className="rounded-2xl border border-white/10 px-4 py-3 text-sm font-black text-white hover:bg-white/10"
            >
              Comparison
            </Link>
            <Link
              href={`/dashboard/scans/${scan.id}/retest-proof`}
              className="rounded-2xl border border-white/10 px-4 py-3 text-sm font-black text-white hover:bg-white/10"
            >
              Retest proof
            </Link>
            <Link
              href={`/dashboard/scans/${scan.id}/verified-report`}
              className="rounded-2xl border border-cyan-300/20 bg-cyan-300/10 px-4 py-3 text-sm font-black text-cyan-100 hover:bg-cyan-300/20"
            >
              Verified report
            </Link>
            <Link
              href={`/dashboard/scans/${scan.id}/print`}
              className="rounded-2xl bg-cyan-300 px-4 py-3 text-sm font-black text-slate-950 hover:bg-cyan-200"
            >
              Print / PDF
            </Link>
            <Link
              href={`/dashboard/scans/${scan.id}/share`}
              className="rounded-2xl border border-cyan-300/30 bg-cyan-300/10 px-4 py-3 text-sm font-black text-cyan-100 hover:bg-cyan-300/20"
            >
              Share
            </Link>
          </div>
        </div>

        <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-8">
          <div className="flex flex-col justify-between gap-8 xl:flex-row xl:items-start">
            <div>
              <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-3xl bg-cyan-400/10 ring-1 ring-cyan-300/30">
                <ShieldCheck className="h-9 w-9 text-cyan-300" />
              </div>

              <p className="text-sm font-black uppercase tracking-[0.3em] text-cyan-300">
                Security posture report
              </p>

              <h1 className="mt-4 text-4xl font-black tracking-tight md:text-6xl">
                {websiteName}
              </h1>

              <a
                href={reportUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-4 inline-flex items-center gap-2 break-all text-sm font-bold text-slate-300 hover:text-cyan-200"
              >
                {reportUrl}
                <ExternalLink className="h-4 w-4 shrink-0" />
              </a>

              <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-300">
                {normalizeText(
                  scan.summary,
                  "VeyraSec reviewed visible website security posture signals and generated a fix-first report."
                )}
              </p>

              <p className="mt-4 text-sm text-slate-500">
                Scan date: {scan.created_at ? new Date(scan.created_at).toLocaleString("en-IN") : "Not available"}
              </p>
            </div>

            <div className="rounded-3xl border border-white/10 bg-slate-950 p-6 text-center">
              <p className="text-sm font-bold text-slate-400">Overall score</p>
              <p className={`mt-3 text-7xl font-black ${scoreClass(overallScore)}`}>
                {overallScore}
              </p>
              <p className="mt-2 text-sm font-bold text-slate-500">out of 100</p>

              <div className={`mt-5 rounded-full border px-5 py-3 text-sm font-black ${riskClass(scan.risk_level)}`}>
                {riskLabel(scan.risk_level)} risk
              </div>
            </div>
          </div>
        </section>

        <section className="mt-8 grid gap-4 md:grid-cols-3 xl:grid-cols-6">
          {scoreCard("Security", securityScore)}
          {scoreCard("Privacy", privacyScore)}
          {scoreCard("Trust", trustScore)}
          {scoreCard("Exposure", exposureScore)}
          {scoreCard("Technical hygiene", hygieneScore)}
          {scoreCard("Overall", overallScore)}
        </section>
        <section className="mt-8 rounded-3xl border border-cyan-300/20 bg-cyan-300/10 p-8">
          <div className="mb-6 flex items-center gap-3">
            <Gauge className="h-7 w-7 text-cyan-300" />
            <div>
              <h2 className="text-3xl font-black">Evidence-based readiness scoring</h2>
              <p className="mt-2 max-w-4xl leading-7 text-cyan-50/80">
                This section weights findings by evidence strength. Verified scan evidence counts more than advisory signals, and not-visible items do not automatically fail the business.
              </p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {scoreCard("Evidence overall", evidenceBasedScoring.overall)}
            {scoreCard("Customer data", evidenceBasedScoring.categoryScores.customer_data_security)}
            {scoreCard("DPDP readiness", evidenceBasedScoring.categoryScores.dpdp_readiness)}
            {scoreCard("CERT-In readiness", evidenceBasedScoring.categoryScores.cert_in_readiness)}
            {scoreCard("Domain trust", evidenceBasedScoring.categoryScores.domain_trust)}
            {scoreCard("Website security", evidenceBasedScoring.categoryScores.website_security)}
            {scoreCard("Business evidence", evidenceBasedScoring.categoryScores.business_attestation)}
            {scoreCard("Scan quality", evidenceBasedScoring.categoryScores.scan_quality)}
          </div>

          <div className="mt-6 grid gap-5 lg:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-slate-950 p-5">
              <h3 className="font-black text-white">Evidence confidence</h3>
              <p className="mt-3 text-lg font-black text-cyan-100">{evidenceBasedScoring.confidenceLabel}</p>
              <div className="mt-4 grid gap-2 text-sm leading-7 text-slate-300">
                <p>Verified by scan: {evidenceBasedScoring.evidenceCounts.verifiedByScan}</p>
                <p>Likely signals: {evidenceBasedScoring.evidenceCounts.likelySignals}</p>
                <p>Needs confirmation: {evidenceBasedScoring.evidenceCounts.needsConfirmation}</p>
                <p>Self-attestation: {evidenceBasedScoring.evidenceCounts.selfAttestation}</p>
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-slate-950 p-5">
              <h3 className="font-black text-white">Evidence strengths</h3>
              <div className="mt-4 grid gap-3">
                {(evidenceBasedScoring.topEvidenceStrengths.length > 0 ? evidenceBasedScoring.topEvidenceStrengths : ["No strong evidence strengths were generated for this scan."]).map((item, index) => (
                  <p key={`${item}-${index}`} className="leading-7 text-slate-300">{item}</p>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-slate-950 p-5">
              <h3 className="font-black text-white">Evidence limitations</h3>
              <div className="mt-4 grid gap-3">
                {(evidenceBasedScoring.topEvidenceLimitations.length > 0 ? evidenceBasedScoring.topEvidenceLimitations : ["No evidence limitations were generated for this scan."]).map((item, index) => (
                  <p key={`${item}-${index}`} className="leading-7 text-slate-300">{item}</p>
                ))}
              </div>
            </div>
          </div>

          <p className="mt-6 rounded-2xl border border-amber-300/20 bg-amber-300/10 p-4 text-sm leading-7 text-amber-50/90">
            Evidence-based scoring is readiness evidence only. It is not legal certification, compliance proof, exploit testing, or a penetration test.
          </p>
        </section>


        <section className="mt-8 rounded-3xl border border-white/10 bg-white/[0.04] p-8">
          <div className="mb-6 flex items-center gap-3">
            <Gauge className="h-7 w-7 text-cyan-300" />
            <h2 className="text-3xl font-black">Score explanation</h2>
          </div>

          {riskReason ? (
            <div className="rounded-2xl border border-cyan-300/20 bg-cyan-300/10 p-5">
              <h3 className="font-black text-cyan-100">Risk reason</h3>
              <p className="mt-3 leading-8 text-cyan-50/90">{riskReason}</p>
            </div>
          ) : null}

          <div className="mt-5 grid gap-5 lg:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-slate-950 p-5">
              <h3 className="font-black text-white">How score was decided</h3>
              <div className="mt-4 grid gap-3">
                {(scoreExplanation.length > 0 ? scoreExplanation : ["Score is based on visible website security posture signals."]).map((item, index) => (
                  <p key={`${item}-${index}`} className="leading-7 text-slate-300">{item}</p>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-slate-950 p-5">
              <h3 className="font-black text-white">What reduced score</h3>
              <div className="mt-4 grid gap-3">
                {(scoreDrivers.length > 0 ? scoreDrivers : ["No score drivers were stored for this scan."]).map((item, index) => (
                  <p key={`${item}-${index}`} className="leading-7 text-slate-300">{item}</p>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-slate-950 p-5">
              <h3 className="font-black text-white">How to improve score</h3>
              <div className="mt-4 grid gap-3">
                {(scoreImprovements.length > 0 ? scoreImprovements : ["Fix the highest-priority findings and run a retest."]).map((item, index) => (
                  <p key={`${item}-${index}`} className="leading-7 text-slate-300">{item}</p>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="mt-8 grid gap-8 lg:grid-cols-2">
          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
            <div className="mb-5 flex items-center gap-3">
              <AlertTriangle className="h-6 w-6 text-amber-300" />
              <h2 className="text-xl font-black">Top risks</h2>
            </div>

            {topRisks.length > 0 ? (
              <div className="grid gap-3">
                {topRisks.map((risk) => (
                  <div key={risk} className="rounded-2xl border border-amber-300/20 bg-amber-300/10 p-4">
                    <p className="leading-7 text-amber-50">{risk}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="leading-7 text-slate-400">No top risks available for this scan.</p>
            )}
          </div>

          {actionList("Fastest fixes", fastestFixes, "fast")}
        </section>

        <section className="mt-8 grid gap-8 lg:grid-cols-2">
          {actionList("Business owner actions", ownerActions, "owner")}
          {actionList("Developer actions", developerActions, "developer")}
        </section>

        <section className="mt-8 rounded-3xl border border-white/10 bg-white/[0.04] p-8">
          <div className="mb-6 flex items-center gap-3">
            <FileText className="h-7 w-7 text-cyan-300" />
            <h2 className="text-3xl font-black">Findings</h2>
          </div>

          {(findings ?? []).length > 0 ? (
            <div className="grid gap-6">
              {(findings ?? []).map((finding, index) => {
                const whatWeFound =
                  extractSection(finding.description, "What we found") ||
                  normalizeText(finding.description, "This item should be reviewed.");

                const whyItMatters = extractSection(finding.description, "Why it matters");
                const businessImpact = extractSection(finding.description, "Business impact");
                const technicalImpact = extractSection(finding.description, "Technical impact");
                const confidence = extractSection(finding.description, "Confidence");

                const priority = extractSection(finding.recommendation, "Priority");
                const effort = extractSection(finding.recommendation, "Estimated effort");
                const fixSummary = extractSection(finding.recommendation, "Fix summary");
                const developerFix = extractSection(finding.recommendation, "Developer fix");
                const retest = extractSection(finding.recommendation, "Retest");

                const evidence = evidenceLines(finding.evidence);

                return (
                  <article
                    key={finding.id}
                    className="rounded-3xl border border-white/10 bg-slate-950 p-6"
                  >
                    <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
                      <div>
                        <div className="mb-3 flex flex-wrap gap-2">
                          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-black text-slate-300">
                            #{index + 1}
                          </span>
                          <span className={`rounded-full border px-3 py-1 text-xs font-black ${severityClass(finding.severity)}`}>
                            {riskLabel(finding.severity)}
                          </span>
                          <span className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1 text-xs font-black text-cyan-100">
                            {normalizeText(finding.category, "general").replaceAll("_", " ")}
                          </span>
                        </div>

                        <h3 className="text-2xl font-black text-white">
                          {normalizeText(finding.title, "Finding")}
                        </h3>
                      </div>

                      {confidence ? (
                        <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-bold text-slate-300">
                          Confidence: {confidence}
                        </div>
                      ) : null}
                    </div>

                    <div className="mt-6 grid gap-4 lg:grid-cols-2">
                      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                        <h4 className="font-black text-cyan-100">What we found</h4>
                        <p className="mt-3 leading-7 text-slate-300">{whatWeFound}</p>
                      </div>

                      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                        <h4 className="font-black text-cyan-100">Why it matters</h4>
                        <p className="mt-3 leading-7 text-slate-300">
                          {whyItMatters || "This item can affect website security posture, trust, or technical hygiene."}
                        </p>
                      </div>

                      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                        <h4 className="font-black text-cyan-100">Business impact</h4>
                        <p className="mt-3 leading-7 text-slate-300">
                          {businessImpact || "This may reduce customer confidence or make the website look less security-ready."}
                        </p>
                      </div>

                      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                        <h4 className="font-black text-cyan-100">Technical impact</h4>
                        <p className="mt-3 leading-7 text-slate-300">
                          {technicalImpact || "Ask your developer to review this item in the website configuration."}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 rounded-2xl border border-emerald-300/20 bg-emerald-300/10 p-5">
                      <h4 className="font-black text-emerald-100">Fix-first guidance</h4>
                      <div className="mt-3 grid gap-3 text-sm leading-7 text-emerald-50/90">
                        {priority ? <p><strong>Priority:</strong> {priority}</p> : null}
                        {effort ? <p><strong>Estimated effort:</strong> {effort}</p> : null}
                        <p><strong>Fix summary:</strong> {fixSummary || normalizeText(finding.recommendation, "Review and fix this issue.")}</p>
                        {developerFix ? <p><strong>Developer fix:</strong> {developerFix}</p> : null}
                        {retest ? <p><strong>Retest:</strong> {retest}</p> : null}
                      </div>
                    </div>

                    <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                      <h4 className="font-black text-slate-100">Evidence</h4>
                      {evidence.length > 0 ? (
                        <div className="mt-3 grid gap-2">
                          {evidence.map((line) => (
                            <p key={line} className="break-words rounded-xl bg-slate-900 px-3 py-2 font-mono text-xs leading-6 text-slate-300">
                              {line}
                            </p>
                          ))}
                        </div>
                      ) : (
                        <p className="mt-3 leading-7 text-slate-400">
                          Evidence was not stored for this item.
                        </p>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="rounded-3xl border border-emerald-300/20 bg-emerald-300/10 p-6">
              <CheckCircle2 className="h-8 w-8 text-emerald-300" />
              <h3 className="mt-4 text-2xl font-black text-emerald-100">
                No visible findings saved
              </h3>
              <p className="mt-3 leading-7 text-emerald-50/90">
                This scan did not store visible security posture findings.
              </p>
            </div>
          )}
        </section>

        <section className="mt-8 rounded-3xl border border-amber-300/20 bg-amber-300/10 p-8">
          <div className="flex gap-4">
            <Gauge className="mt-1 h-7 w-7 shrink-0 text-amber-200" />
            <div>
              <h2 className="text-2xl font-black text-amber-100">Important scope note</h2>
              <p className="mt-4 max-w-4xl leading-8 text-amber-50/90">
                This is a passive website security posture report based on visible public signals.
                It is not legal advice, compliance certification, exploit testing, vulnerability exploitation,
                login testing, brute force testing, or a penetration test.
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
