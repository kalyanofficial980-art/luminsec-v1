import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, Download, FileText, Globe2, Languages, ShieldAlert, ShieldCheck } from "lucide-react";
import { brand } from "@/config/brand";
import { createClient } from "@/lib/supabase/server";
import { getAiStyleSummary, explainFinding, getReportCopy, getReportLanguage } from "@/lib/report/explain";
import { formatDateTime, getRiskBadgeClass, getRiskLabel } from "@/lib/utils/risk";

const severityClasses: Record<string, string> = {
  critical: "border-red-400/30 bg-red-400/10 text-red-100",
  high: "border-orange-400/30 bg-orange-400/10 text-orange-100",
  medium: "border-amber-400/30 bg-amber-400/10 text-amber-100",
  low: "border-blue-400/30 bg-blue-400/10 text-blue-100",
  info: "border-slate-400/30 bg-slate-400/10 text-slate-100",
};

export default async function ScanReportPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ lang?: string }>;
}) {
  const { id } = await params;
  const { lang } = await searchParams;
  const language = getReportLanguage(lang);
  const copy = getReportCopy(language);

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: result, error } = await supabase
    .from("scan_results")
    .select(`
      id,
      overall_score,
      security_score,
      privacy_score,
      trust_score,
      risk_level,
      summary,
      created_at,
      websites (
        url,
        domain,
        label
      )
    `)
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (error || !result) {
    redirect("/dashboard/websites?message=Scan report not found");
  }

  const { data: findings } = await supabase
    .from("scan_findings")
    .select("id, category, severity, title, description, recommendation, evidence, created_at")
    .eq("scan_result_id", result.id)
    .eq("user_id", user.id)
    .order("created_at", { ascending: true });

  const website = Array.isArray(result.websites)
    ? result.websites[0]
    : result.websites;

  const aiSummary = getAiStyleSummary({
    overallScore: result.overall_score,
    securityScore: result.security_score,
    privacyScore: result.privacy_score,
    trustScore: result.trust_score,
    riskLevel: result.risk_level,
    findings: findings ?? [],
    language,
  });

  return (
    <main className="min-h-screen bg-slate-950 p-6 text-white">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <Link
            href="/dashboard/websites"
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-300 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            {copy.backToWebsites}
          </Link>

          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="inline-flex items-center gap-2 rounded-2xl border border-white/10 p-1">
              <Languages className="ml-3 h-4 w-4 text-cyan-300" />
              <Link
                href={`/dashboard/scans/${result.id}?lang=en`}
                className={`rounded-xl px-3 py-2 text-sm font-bold ${
                  language === "en" ? "bg-cyan-300 text-slate-950" : "text-slate-300 hover:bg-white/10"
                }`}
              >
                EN
              </Link>
              <Link
                href={`/dashboard/scans/${result.id}?lang=te`}
                className={`rounded-xl px-3 py-2 text-sm font-bold ${
                  language === "te" ? "bg-cyan-300 text-slate-950" : "text-slate-300 hover:bg-white/10"
                }`}
              >
                TE-EN
              </Link>
            </div>

            <Link
              href="/dashboard/scans"
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 px-5 py-3 text-sm font-semibold text-white hover:bg-white/10"
            >
              <FileText className="h-4 w-4" />
              {copy.allReports}
            </Link>

            <Link
              href={`/dashboard/scans/${result.id}/print?lang=${language}`}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-cyan-300 px-5 py-3 text-sm font-bold text-slate-950 hover:bg-cyan-200"
            >
              <Download className="h-4 w-4" />
              {copy.downloadPdf}
            </Link>
          </div>
        </div>

        <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-8">
          <div className="mb-8 flex flex-col justify-between gap-5 md:flex-row md:items-start">
            <div>
              <div className="mb-3 flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-400/10 ring-1 ring-cyan-300/30">
                  <ShieldCheck className="h-6 w-6 text-cyan-300" />
                </div>
                <div>
                  <h1 className="text-3xl font-black">{brand.product}</h1>
                  <p className="text-slate-400">
                    {copy.safePassiveResult} - {formatDateTime(result.created_at)} - {copy.modeLabel}
                  </p>
                </div>
              </div>

              <div className="mt-5 flex items-center gap-2 text-slate-300">
                <Globe2 className="h-5 w-5 text-cyan-300" />
                <span className="break-all">{website?.label || website?.domain}</span>
              </div>
              <p className="mt-1 break-all text-sm text-slate-500">{website?.url}</p>
            </div>

            <div className="rounded-3xl border border-cyan-300/20 bg-cyan-300/10 p-6 text-center">
              <p className="text-sm text-cyan-100">{copy.overallScore}</p>
              <p className="mt-2 text-5xl font-black text-white">{result.overall_score}</p>
              <p
                className={`mt-3 rounded-full border px-3 py-1 text-sm font-bold ${getRiskBadgeClass(
                  result.risk_level
                )}`}
              >
                {getRiskLabel(result.risk_level)}
              </p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-3xl border border-white/10 bg-slate-950 p-5">
              <p className="text-sm text-slate-400">{copy.securityScore}</p>
              <p className="mt-2 text-4xl font-black">{result.security_score}</p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-slate-950 p-5">
              <p className="text-sm text-slate-400">{copy.privacyScore}</p>
              <p className="mt-2 text-4xl font-black">{result.privacy_score}</p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-slate-950 p-5">
              <p className="text-sm text-slate-400">{copy.trustScore}</p>
              <p className="mt-2 text-4xl font-black">{result.trust_score}</p>
            </div>
          </div>

          <div className="mt-6 rounded-3xl border border-cyan-300/20 bg-cyan-300/10 p-6">
            <h2 className="text-xl font-bold text-cyan-100">{copy.aiSummaryTitle}</h2>
            <p className="mt-3 leading-7 text-cyan-50/90">{aiSummary}</p>
          </div>

          <div className="mt-6 rounded-3xl border border-white/10 bg-slate-950 p-6">
            <h2 className="text-xl font-bold">{copy.executiveSummary}</h2>
            <p className="mt-3 leading-7 text-slate-300">{result.summary}</p>
            <p className="mt-4 text-sm text-slate-500">{copy.disclaimer}</p>
          </div>
        </section>

        <section className="mt-8">
          <div className="mb-4 flex items-center gap-3">
            <ShieldAlert className="h-6 w-6 text-cyan-300" />
            <h2 className="text-2xl font-bold">{copy.findings}</h2>
          </div>

          {!findings || findings.length === 0 ? (
            <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-8 text-center text-slate-300">
              No findings saved for this scan.
            </div>
          ) : (
            <div className="grid gap-4">
              {findings.map((finding) => (
                <div
                  key={finding.id}
                  className="rounded-3xl border border-white/10 bg-white/[0.04] p-6"
                >
                  <div className="mb-3 flex flex-col justify-between gap-3 md:flex-row md:items-center">
                    <h3 className="text-xl font-bold">{finding.title}</h3>
                    <span
                      className={`w-fit rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-wide ${
                        severityClasses[finding.severity] ?? severityClasses.info
                      }`}
                    >
                      {finding.severity}
                    </span>
                  </div>

                  <div className="mb-4 rounded-2xl border border-cyan-300/20 bg-cyan-300/10 p-4">
                    <p className="text-sm font-bold text-cyan-100">{copy.plainExplanation}</p>
                    <p className="mt-1 text-sm leading-6 text-cyan-50/90">
                      {explainFinding(finding, language)}
                    </p>
                  </div>

                  <p className="leading-7 text-slate-300">{finding.description}</p>
                  <div className="mt-4 rounded-2xl border border-cyan-300/20 bg-cyan-300/10 p-4">
                    <p className="text-sm font-bold text-cyan-100">{copy.recommendation}</p>
                    <p className="mt-1 text-sm leading-6 text-cyan-50/90">
                      {finding.recommendation}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}