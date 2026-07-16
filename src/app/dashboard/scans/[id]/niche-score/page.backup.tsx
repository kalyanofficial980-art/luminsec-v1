import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle2,
  FileText,
  ShieldCheck,
  Target,
  Wrench,
} from "lucide-react";
import { requireDashboardUser } from "@/lib/auth/route-access";
import { calculateNicheScoring } from "@/lib/security/niche-scoring";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

type FindingRow = {
  id: string;
  title: string | null;
  category: string | null;
  severity: string | null;
  description: string | null;
  recommendation: string | null;
  evidence: string | null;
};

function text(value: unknown, fallback = "") {
  const raw = String(value ?? "").trim();
  return raw.length > 0 ? raw : fallback;
}

function scoreTone(score: number) {
  if (score >= 85) return "text-emerald-300";
  if (score >= 70) return "text-cyan-300";
  if (score >= 50) return "text-amber-300";
  return "text-red-300";
}

function scoreBorder(score: number) {
  if (score >= 85) return "border-emerald-300/25 bg-emerald-300/10";
  if (score >= 70) return "border-cyan-300/25 bg-cyan-300/10";
  if (score >= 50) return "border-amber-300/25 bg-amber-300/10";
  return "border-red-300/25 bg-red-300/10";
}

function severityClass(value: string) {
  if (value === "critical")
    return "border-red-400/40 bg-red-400/10 text-red-100";
  if (value === "high")
    return "border-orange-400/40 bg-orange-400/10 text-orange-100";
  if (value === "medium")
    return "border-amber-400/40 bg-amber-400/10 text-amber-100";
  if (value === "low")
    return "border-emerald-400/40 bg-emerald-400/10 text-emerald-100";
  return "border-cyan-400/40 bg-cyan-400/10 text-cyan-100";
}

function moduleLabel(value: string) {
  if (value === "customer_data_security") return "Customer data";
  if (value === "dpdp_readiness") return "DPDP";
  if (value === "cert_in_readiness") return "CERT-In";
  return "Website trust";
}

function dateText(value: unknown) {
  const raw = String(value ?? "");
  if (!raw) return "Not available";

  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return "Not available";

  return date.toLocaleString("en-IN");
}

export default async function NicheScorePage({ params }: PageProps) {
  const { id } = await params;
  const { supabase, user, profile } = await requireDashboardUser();

  let scanQuery = supabase
    .from("scan_results")
    .select("id, user_id, url, domain, created_at")
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
    .select(
      "id, title, category, severity, description, recommendation, evidence",
    )
    .eq("scan_result_id", scan.id);

  if (profile.role !== "admin") {
    findingsQuery = findingsQuery.eq("user_id", user.id);
  }

  const { data: findingRows } = await findingsQuery;
  const findings = (findingRows ?? []) as FindingRow[];
  const scoring = calculateNicheScoring(findings);

  const websiteName = text(scan.domain, text(scan.url, "Website"));

  return (
    <main className="min-h-screen bg-slate-950 p-6 text-white">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
          <Link
            href={`/dashboard/scans/${scan.id}`}
            className="inline-flex items-center gap-2 text-sm font-black text-cyan-300 hover:text-cyan-200"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to report
          </Link>

          <div className="flex flex-wrap gap-3">
            <Link
              href={`/dashboard/scans/${scan.id}/action-plan`}
              className="rounded-2xl border border-white/10 px-4 py-3 text-sm font-black text-white hover:bg-white/10"
            >
              Action plan
            </Link>
            <Link
              href={`/dashboard/scans/${scan.id}/print`}
              className="rounded-2xl border border-white/10 px-4 py-3 text-sm font-black text-white hover:bg-white/10"
            >
              Print / PDF
            </Link>
            <Link
              href={`/dashboard/scans/${scan.id}/share`}
              className="rounded-2xl bg-cyan-300 px-4 py-3 text-sm font-black text-slate-950 hover:bg-cyan-200"
            >
              Share report
            </Link>
          </div>
        </div>

        <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-8">
          <div className="flex flex-col justify-between gap-8 xl:flex-row xl:items-start">
            <div>
              <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-3xl bg-cyan-400/10 ring-1 ring-cyan-300/30">
                <Target className="h-9 w-9 text-cyan-300" />
              </div>

              <p className="text-sm font-black uppercase tracking-[0.3em] text-cyan-300">
                Niche scoring
              </p>

              <h1 className="mt-4 text-4xl font-black tracking-tight md:text-6xl">
                Customer-data readiness score
              </h1>

              <p className="mt-5 max-w-4xl text-lg leading-8 text-slate-300">
                This score is built for Indian small businesses that collect
                customer data through websites, forms, bookings, or payments. It
                groups repeated findings and shows the most important fixes
                first.
              </p>

              <p className="mt-4 text-sm text-slate-500">
                {websiteName} · Scan date: {dateText(scan.created_at)}
              </p>
            </div>

            <div
              className={`rounded-3xl border p-7 text-center ${scoreBorder(scoring.overallScore)}`}
            >
              <ShieldCheck className="mx-auto h-10 w-10 text-cyan-300" />
              <p className="mt-3 text-sm font-black uppercase tracking-[0.2em] text-slate-400">
                Overall readiness
              </p>
              <p
                className={`mt-3 text-7xl font-black ${scoreTone(scoring.overallScore)}`}
              >
                {scoring.overallScore}
              </p>
              <p className="mt-2 text-sm font-bold text-slate-400">/100</p>
            </div>
          </div>
        </section>

        <section className="mt-8 rounded-3xl border border-white/10 bg-white/[0.04] p-6">
          <h2 className="text-2xl font-black">Customer explanation</h2>
          <p className="mt-3 max-w-5xl leading-8 text-slate-300">
            {scoring.summary.customerMessage}
          </p>

          <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {scoring.modules.map((module) => (
              <div
                key={module.key}
                className={`rounded-3xl border p-5 ${scoreBorder(module.score)}`}
              >
                <p className="text-sm font-black text-slate-300">
                  {module.label}
                </p>
                <p
                  className={`mt-3 text-5xl font-black ${scoreTone(module.score)}`}
                >
                  {module.score}
                </p>
                <p className="mt-3 text-sm leading-6 text-slate-400">
                  {module.explanation}
                </p>
                <p className="mt-4 text-xs font-bold text-slate-500">
                  {module.findingCount} grouped item
                  {module.findingCount === 1 ? "" : "s"} · penalty cap{" "}
                  {module.maxWeight}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-8 grid gap-6 lg:grid-cols-[1fr_380px]">
          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
            <div className="flex items-center gap-3">
              <Wrench className="h-6 w-6 text-cyan-300" />
              <h2 className="text-2xl font-black">Top 5 fixes first</h2>
            </div>

            <div className="mt-6 grid gap-4">
              {scoring.topFixes.length > 0 ? (
                scoring.topFixes.map((finding, index) => (
                  <article
                    key={finding.id}
                    className="rounded-3xl border border-white/10 bg-slate-950 p-5"
                  >
                    <div className="flex flex-wrap gap-2">
                      <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-black text-slate-300">
                        #{index + 1}
                      </span>
                      <span
                        className={`rounded-full border px-3 py-1 text-xs font-black ${severityClass(finding.severity)}`}
                      >
                        {finding.severity.toUpperCase()}
                      </span>
                      <span className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1 text-xs font-black text-cyan-100">
                        {moduleLabel(finding.module)}
                      </span>
                      <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-black text-slate-300">
                        {finding.confidence} confidence
                      </span>
                    </div>

                    <h3 className="mt-4 text-xl font-black text-white">
                      {finding.title}
                    </h3>

                    <p className="mt-3 leading-7 text-slate-300">
                      {finding.businessImpact}
                    </p>

                    <div className="mt-4 rounded-2xl border border-cyan-300/20 bg-cyan-300/10 p-4">
                      <p className="text-sm font-black text-cyan-100">
                        Developer action
                      </p>
                      <p className="mt-2 leading-7 text-cyan-50/90">
                        {finding.developerAction}
                      </p>
                    </div>

                    <p className="mt-4 leading-7 text-slate-400">
                      {finding.recommendation}
                    </p>

                    {finding.evidenceSamples.length > 0 ? (
                      <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                        <p className="text-sm font-black text-slate-300">
                          Evidence samples
                        </p>
                        <ul className="mt-2 list-disc space-y-2 pl-5 text-sm leading-6 text-slate-400">
                          {finding.evidenceSamples.map(
                            (evidence, evidenceIndex) => (
                              <li key={`${finding.id}-${evidenceIndex}`}>
                                {evidence}
                              </li>
                            ),
                          )}
                        </ul>
                      </div>
                    ) : null}

                    <p className="mt-4 text-xs font-bold text-slate-500">
                      Grouped {finding.findingCount} related item
                      {finding.findingCount === 1 ? "" : "s"} · scoring penalty{" "}
                      {finding.penalty}
                    </p>
                  </article>
                ))
              ) : (
                <div className="rounded-3xl border border-emerald-300/20 bg-emerald-300/10 p-6">
                  <CheckCircle2 className="h-8 w-8 text-emerald-300" />
                  <h3 className="mt-3 text-xl font-black text-emerald-100">
                    No priority fixes found
                  </h3>
                  <p className="mt-2 leading-7 text-emerald-50/90">
                    This scan did not produce items that need priority scoring.
                  </p>
                </div>
              )}
            </div>
          </div>

          <aside className="space-y-6">
            <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
              <FileText className="h-8 w-8 text-cyan-300" />
              <h2 className="mt-4 text-xl font-black">Summary</h2>

              <div className="mt-5 space-y-4 text-sm">
                <div className="flex justify-between gap-4">
                  <span className="text-slate-400">Raw items</span>
                  <strong>{scoring.summary.totalRawFindings}</strong>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-slate-400">Grouped items</span>
                  <strong>{scoring.summary.groupedFindingCount}</strong>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-slate-400">Critical/high groups</span>
                  <strong>{scoring.summary.criticalOrHighGroups}</strong>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-slate-400">Medium groups</span>
                  <strong>{scoring.summary.mediumGroups}</strong>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-slate-400">Low/info groups</span>
                  <strong>{scoring.summary.lowOrInfoGroups}</strong>
                </div>
              </div>
            </section>

            <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
              <h2 className="text-xl font-black">Score explanation</h2>
              <ul className="mt-4 space-y-3 text-sm leading-6 text-slate-300">
                {scoring.summary.scoreExplanation.map((item, index) => (
                  <li
                    key={`${item}-${index}`}
                    className="rounded-2xl border border-white/10 bg-slate-950 p-3"
                  >
                    {item}
                  </li>
                ))}
              </ul>
            </section>
          </aside>
        </section>

        <section className="mt-8 rounded-3xl border border-amber-300/20 bg-amber-300/10 p-6">
          <h2 className="text-xl font-black text-amber-100">Important note</h2>
          <p className="mt-3 leading-8 text-amber-50/90">
            This is a customer-data security and readiness score based on
            visible signals. It is not legal advice, not DPDP/CERT-In
            certification, and not a penetration test.
          </p>
        </section>
      </div>
    </main>
  );
}
