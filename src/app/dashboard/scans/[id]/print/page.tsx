import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  FileText,
  Globe2,
  ShieldCheck,
} from "lucide-react";
import { brand } from "@/config/brand";
import { createClient } from "@/lib/supabase/server";
import { formatDateTime } from "@/lib/utils/risk";
import { PrintButton } from "@/components/report/print-button";

type FindingRow = {
  id: string;
  category: string | null;
  severity: string | null;
  title: string;
  description: string | null;
  recommendation: string | null;
  evidence: string | null;
};

type RawResult = {
  scoreBreakdown?: {
    topReasons?: string[];
  };
  topReasons?: string[];
};

function getWebsiteData(websites: unknown) {
  if (Array.isArray(websites)) {
    const firstWebsite = websites[0] as { url?: string | null; name?: string | null } | undefined;

    return {
      url: firstWebsite?.url || "Website report",
      name: firstWebsite?.name || "Website",
    };
  }

  if (websites && typeof websites === "object") {
    const item = websites as { url?: string | null; name?: string | null };

    return {
      url: item.url || "Website report",
      name: item.name || "Website",
    };
  }

  return {
    url: "Website report",
    name: "Website",
  };
}

function scoreClass(score: number) {
  if (score >= 80) return "border-emerald-200 bg-emerald-50 text-emerald-900";
  if (score >= 60) return "border-amber-200 bg-amber-50 text-amber-900";
  return "border-red-200 bg-red-50 text-red-900";
}

function scoreLabel(score: number) {
  if (score >= 80) return "Strong";
  if (score >= 60) return "Needs improvement";
  return "Needs attention";
}

function severityClass(severity?: string | null) {
  if (severity === "high") return "bg-red-50 text-red-800 ring-red-200";
  if (severity === "medium") return "bg-amber-50 text-amber-800 ring-amber-200";
  if (severity === "low") return "bg-blue-50 text-blue-800 ring-blue-200";
  return "bg-slate-100 text-slate-700 ring-slate-200";
}

function countSeverity(findings: FindingRow[], severity: string) {
  return findings.filter((finding) => finding.severity === severity).length;
}

function getRawObject(raw: unknown): RawResult {
  if (raw && typeof raw === "object") {
    return raw as RawResult;
  }

  return {};
}

function buildActionPlan(findings: FindingRow[]) {
  const actions: string[] = [];
  const titles = findings.map((finding) => finding.title.toLowerCase()).join(" ");

  if (titles.includes("https")) {
    actions.push("Fix HTTPS and redirect issues first because they affect basic visitor trust.");
  }

  if (
    titles.includes("hsts") ||
    titles.includes("content security policy") ||
    titles.includes("clickjacking") ||
    titles.includes("x-content-type-options")
  ) {
    actions.push("Ask the developer to add or improve security headers, then rerun the scan.");
  }

  if (titles.includes("privacy")) {
    actions.push("Add a clear privacy policy link in the footer or navigation.");
  }

  if (titles.includes("contact")) {
    actions.push("Add a visible contact page, email, phone number, or contact form.");
  }

  if (titles.includes("sitemap") || titles.includes("robots")) {
    actions.push("Add robots.txt and sitemap.xml to improve basic public website discoverability.");
  }

  if (actions.length === 0) {
    actions.push("Review the listed findings with your developer and rerun the scan after changes.");
  }

  actions.push("After changes are completed, run a fresh VeyraSec scan and compare before-after progress.");

  return actions.slice(0, 6);
}

export default async function PrintReportPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: result } = await supabase
    .from("scan_results")
    .select(
      "id, overall_score, security_score, privacy_score, trust_score, risk_level, summary, raw_result, created_at, websites(name, url)"
    )
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!result) {
    notFound();
  }

  const { data: findingsRows } = await supabase
    .from("scan_findings")
    .select("id, category, severity, title, description, recommendation, evidence")
    .eq("scan_result_id", result.id)
    .order("severity", { ascending: true });

  const { data: businessSettings } = await supabase
    .from("business_settings")
    .select("business_name, owner_name, email, phone, website, address, report_footer_note")
    .eq("user_id", user.id)
    .maybeSingle();

  const findings = (findingsRows ?? []) as FindingRow[];
  const website = getWebsiteData(result.websites);
  const raw = getRawObject(result.raw_result);

  const topReasons =
    raw.scoreBreakdown?.topReasons && raw.scoreBreakdown.topReasons.length > 0
      ? raw.scoreBreakdown.topReasons
      : raw.topReasons && raw.topReasons.length > 0
        ? raw.topReasons
        : [];

  const scoreCards = [
    ["Overall readiness", Number(result.overall_score ?? 0)],
    ["Security", Number(result.security_score ?? 0)],
    ["Privacy", Number(result.privacy_score ?? 0)],
    ["Trust", Number(result.trust_score ?? 0)],
  ];

  const severityCards = [
    ["High", countSeverity(findings, "high"), "border-red-200 bg-red-50 text-red-800"],
    ["Medium", countSeverity(findings, "medium"), "border-amber-200 bg-amber-50 text-amber-800"],
    ["Low", countSeverity(findings, "low"), "border-blue-200 bg-blue-50 text-blue-800"],
    ["Info", countSeverity(findings, "info"), "border-slate-200 bg-slate-50 text-slate-700"],
  ];

  const actionPlan = buildActionPlan(findings);

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-6 text-slate-950 print:bg-white print:px-0 print:py-0">
      <style>
        {`
          @page {
            size: A4;
            margin: 14mm;
          }

          @media print {
            .page-break {
              break-before: page;
            }

            .avoid-break {
              break-inside: avoid;
            }

            .no-print {
              display: none !important;
            }

            body {
              background: white !important;
            }
          }
        `}
      </style>

      <div className="no-print mx-auto mb-5 flex max-w-5xl items-center justify-between gap-3">
        <Link
          href={`/dashboard/scans/${result.id}`}
          className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to report
        </Link>

        <PrintButton />
      </div>

      <article className="mx-auto max-w-5xl rounded-[2rem] bg-white p-8 shadow-xl shadow-slate-300/40 print:max-w-none print:rounded-none print:p-0 print:shadow-none">
        <section className="avoid-break rounded-[1.75rem] bg-slate-950 p-8 text-white print:rounded-none">
          <div className="flex flex-col justify-between gap-8 md:flex-row md:items-start">
            <div>
              <div className="mb-6 flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-300/10 ring-1 ring-cyan-300/30">
                  <ShieldCheck className="h-7 w-7 text-cyan-300" />
                </div>
                <div>
                  <p className="text-2xl font-black">{brand.name}</p>
                  <p className="text-xs uppercase tracking-[0.25em] text-cyan-200/70">
                    Website Trust Report
                  </p>
                </div>
              </div>

              <h1 className="max-w-3xl text-4xl font-black tracking-tight">
                Website security, privacy, and trust readiness report
              </h1>

              <p className="mt-5 max-w-3xl break-all text-lg leading-8 text-slate-300">
                {website.url}
              </p>
            </div>

            <div className="rounded-3xl border border-cyan-300/20 bg-cyan-300/10 p-6 text-center">
              <p className="text-sm text-cyan-100/80">Overall score</p>
              <p className="mt-2 text-6xl font-black text-white">
                {Number(result.overall_score ?? 0)}
              </p>
              <p className="mt-2 text-sm font-bold text-cyan-100">
                {scoreLabel(Number(result.overall_score ?? 0))}
              </p>
            </div>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl bg-white/10 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Prepared for</p>
              <p className="mt-2 break-all font-bold">{website.name}</p>
              <p className="mt-1 break-all text-sm text-slate-300">{website.url}</p>
            </div>

            <div className="rounded-2xl bg-white/10 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Prepared by</p>
              <p className="mt-2 font-bold">
                {businessSettings?.business_name || brand.name}
              </p>
              <p className="mt-1 text-sm text-slate-300">
                {businessSettings?.owner_name || "Report owner"}
              </p>
            </div>

            <div className="rounded-2xl bg-white/10 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Report date</p>
              <p className="mt-2 font-bold">{formatDateTime(result.created_at)}</p>
              <p className="mt-1 text-sm text-slate-300">Safe passive checks only</p>
            </div>
          </div>
        </section>

        <section className="avoid-break mt-8 grid gap-4 md:grid-cols-4 print:mt-6">
          {scoreCards.map(([label, score]) => (
            <div key={String(label)} className={`rounded-3xl border p-5 ${scoreClass(Number(score))}`}>
              <p className="text-sm opacity-80">{label}</p>
              <p className="mt-2 text-4xl font-black">{Number(score)}/100</p>
              <p className="mt-2 text-sm font-bold">{scoreLabel(Number(score))}</p>
            </div>
          ))}
        </section>

        <section className="avoid-break mt-8 rounded-3xl border border-slate-200 p-6 print:mt-6">
          <div className="mb-4 flex items-center gap-3">
            <FileText className="h-6 w-6 text-slate-700" />
            <h2 className="text-2xl font-black">Executive summary</h2>
          </div>

          <p className="leading-8 text-slate-700">{result.summary}</p>
        </section>

        <section className="avoid-break mt-8 grid gap-4 md:grid-cols-4 print:mt-6">
          {severityCards.map(([label, value, className]) => (
            <div key={String(label)} className={`rounded-3xl border p-5 ${String(className)}`}>
              <p className="text-sm opacity-80">{label} findings</p>
              <p className="mt-2 text-4xl font-black">{Number(value)}</p>
            </div>
          ))}
        </section>

        <section className="avoid-break mt-8 grid gap-6 md:grid-cols-2 print:mt-6">
          <div className="rounded-3xl border border-slate-200 p-6">
            <div className="mb-4 flex items-center gap-3">
              <AlertTriangle className="h-6 w-6 text-amber-600" />
              <h2 className="text-2xl font-black">Main score reasons</h2>
            </div>

            {topReasons.length === 0 ? (
              <p className="text-slate-600">No score reasons were stored for this report.</p>
            ) : (
              <ol className="space-y-3">
                {topReasons.slice(0, 5).map((reason, index) => (
                  <li key={reason} className="flex gap-3 text-sm leading-6 text-slate-700">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-950 text-xs font-black text-white">
                      {index + 1}
                    </span>
                    <span>{reason}</span>
                  </li>
                ))}
              </ol>
            )}
          </div>

          <div className="rounded-3xl border border-slate-200 p-6">
            <div className="mb-4 flex items-center gap-3">
              <CheckCircle2 className="h-6 w-6 text-emerald-600" />
              <h2 className="text-2xl font-black">Recommended action plan</h2>
            </div>

            <ol className="space-y-3">
              {actionPlan.map((action, index) => (
                <li key={action} className="flex gap-3 text-sm leading-6 text-slate-700">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xs font-black text-emerald-900">
                    {index + 1}
                  </span>
                  <span>{action}</span>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="page-break mt-8">
          <div className="mb-5 flex items-center gap-3">
            <Globe2 className="h-7 w-7 text-slate-700" />
            <h2 className="text-3xl font-black">Findings table</h2>
          </div>

          {findings.length === 0 ? (
            <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-6 text-emerald-900">
              No findings were stored for this report.
            </div>
          ) : (
            <div className="overflow-hidden rounded-3xl border border-slate-200">
              <table className="w-full border-collapse text-left text-sm">
                <thead className="bg-slate-950 text-white">
                  <tr>
                    <th className="p-4">Severity</th>
                    <th className="p-4">Category</th>
                    <th className="p-4">Finding</th>
                    <th className="p-4">Recommended fix</th>
                  </tr>
                </thead>
                <tbody>
                  {findings.map((finding) => (
                    <tr key={finding.id} className="border-t border-slate-200 align-top">
                      <td className="p-4">
                        <span className={`rounded-full px-3 py-1 text-xs font-bold ring-1 ${severityClass(finding.severity)}`}>
                          {finding.severity || "info"}
                        </span>
                      </td>
                      <td className="p-4 font-semibold text-slate-700">{finding.category || "trust"}</td>
                      <td className="p-4">
                        <p className="font-bold text-slate-950">{finding.title}</p>
                        {finding.description ? (
                          <p className="mt-2 leading-6 text-slate-600">{finding.description}</p>
                        ) : null}
                      </td>
                      <td className="p-4 leading-6 text-slate-700">
                        {finding.recommendation || "Review with your developer."}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="page-break mt-8">
          <h2 className="mb-5 text-3xl font-black">Detailed findings</h2>

          <div className="grid gap-5">
            {findings.map((finding) => (
              <div key={finding.id} className="avoid-break rounded-3xl border border-slate-200 p-6">
                <div className="mb-3 flex flex-wrap items-center gap-2">
                  <h3 className="text-xl font-black">{finding.title}</h3>
                  <span className={`rounded-full px-3 py-1 text-xs font-bold ring-1 ${severityClass(finding.severity)}`}>
                    {finding.severity || "info"}
                  </span>
                  <span className="rounded-full bg-cyan-50 px-3 py-1 text-xs font-bold text-cyan-800 ring-1 ring-cyan-200">
                    {finding.category || "trust"}
                  </span>
                </div>

                {finding.description ? (
                  <p className="leading-7 text-slate-700">{finding.description}</p>
                ) : null}

                {finding.recommendation ? (
                  <div className="mt-4 rounded-2xl bg-emerald-50 p-4 text-emerald-900 ring-1 ring-emerald-200">
                    <p className="mb-1 font-black">Recommendation</p>
                    <p className="leading-7">{finding.recommendation}</p>
                  </div>
                ) : null}

                {finding.evidence ? (
                  <div className="mt-4 rounded-2xl bg-slate-100 p-4 text-sm text-slate-700">
                    <p className="mb-1 font-black">Evidence</p>
                    <p className="break-all leading-6">{finding.evidence}</p>
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        </section>

        <section className="avoid-break mt-8 rounded-3xl border border-amber-200 bg-amber-50 p-6 text-amber-950">
          <h2 className="text-2xl font-black">Important disclaimer</h2>
          <p className="mt-3 leading-8">
            This report is based on safe passive website checks only. It is not a full cybersecurity audit,
            not legal advice, not compliance certification, and not a penetration test. It does not test login
            areas, hidden systems, server-side vulnerabilities, business-specific risk, or non-public assets.
          </p>
        </section>

        {businessSettings?.report_footer_note ? (
          <section className="avoid-break mt-6 rounded-3xl border border-slate-200 bg-slate-50 p-6">
            <h2 className="text-xl font-black">Report note</h2>
            <p className="mt-3 leading-7 text-slate-700">{businessSettings.report_footer_note}</p>
          </section>
        ) : null}

        <footer className="mt-8 border-t border-slate-200 pt-5 text-sm text-slate-500">
          <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
            <p>Prepared with {brand.name} {brand.version}. Safe passive website trust report.</p>
            <p className="break-all">
              {businessSettings?.email || brand.supportEmail}
              {businessSettings?.phone ? ` · ${businessSettings.phone}` : ""}
            </p>
          </div>
        </footer>
      </article>
    </main>
  );
}