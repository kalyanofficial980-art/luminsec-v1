import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  FileText,
  Globe2,
  Printer,
  ShieldCheck,
} from "lucide-react";
import { requireDashboardUser } from "@/lib/auth/route-access";

function clampScore(value: unknown) {
  const score = Number(value);

  if (!Number.isFinite(score)) {
    return 0;
  }

  return Math.max(0, Math.min(100, Math.round(score)));
}

function text(value: unknown, fallback = "") {
  const raw = String(value ?? "").trim();
  return raw.length > 0 ? raw : fallback;
}

function riskLabel(value: unknown) {
  const risk = String(value ?? "").toLowerCase();

  if (risk.includes("critical")) return "Critical";
  if (risk.includes("high")) return "High";
  if (risk.includes("medium") || risk.includes("moderate")) return "Medium";
  if (risk.includes("low")) return "Low";

  return "Review";
}

function riskClass(value: unknown) {
  const risk = String(value ?? "").toLowerCase();

  if (risk.includes("critical"))
    return "border-red-400/30 bg-red-400/10 text-red-100";
  if (risk.includes("high"))
    return "border-orange-400/30 bg-orange-400/10 text-orange-100";
  if (risk.includes("medium") || risk.includes("moderate"))
    return "border-amber-400/30 bg-amber-400/10 text-amber-100";
  if (risk.includes("low"))
    return "border-emerald-400/30 bg-emerald-400/10 text-emerald-100";

  return "border-slate-400/30 bg-slate-400/10 text-slate-200";
}

function scoreClass(score: number) {
  if (score >= 85) return "text-emerald-300";
  if (score >= 65) return "text-amber-300";
  if (score >= 40) return "text-orange-300";
  return "text-red-300";
}

function dateText(value: unknown) {
  const raw = String(value ?? "");

  if (!raw) {
    return "Date not available";
  }

  const date = new Date(raw);

  if (Number.isNaN(date.getTime())) {
    return "Date not available";
  }

  return date.toLocaleString("en-IN");
}

export default async function ReportsPage() {
  const { supabase, user, profile } = await requireDashboardUser();

  let query = supabase
    .from("scan_results")
    .select(
      "id, user_id, website_id, url, domain, status, overall_score, score, security_score, privacy_score, trust_score, risk_level, summary, created_at",
    )
    .order("created_at", { ascending: false })
    .limit(50);

  if (profile.role !== "admin") {
    query = query.eq("user_id", user.id);
  }

  const { data: scans, error } = await query;

  const reports = scans ?? [];

  return (
    <main className="min-h-screen bg-slate-950 p-6 text-white">
      <div className="mx-auto max-w-7xl">
        <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-8">
          <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-start">
            <div>
              <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-400/10 ring-1 ring-cyan-300/30">
                <FileText className="h-8 w-8 text-cyan-300" />
              </div>

              <p className="text-sm font-black uppercase tracking-[0.3em] text-cyan-300">
                Reports
              </p>

              <h1 className="mt-4 text-4xl font-black tracking-tight md:text-5xl">
                Security posture reports
              </h1>

              <p className="mt-4 max-w-3xl leading-8 text-slate-300">
                Review passive website security posture reports, scores,
                findings, and fix-first action plans.
              </p>
            </div>

            <Link
              href="/dashboard/websites"
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-cyan-300 px-5 py-4 font-black text-slate-950 hover:bg-cyan-200"
            >
              Run scan
              <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
        </section>

        {error ? (
          <section className="mt-8 rounded-3xl border border-red-400/20 bg-red-400/10 p-8">
            <AlertTriangle className="h-8 w-8 text-red-200" />
            <h2 className="mt-4 text-2xl font-black text-red-100">
              Reports could not load
            </h2>
            <p className="mt-3 leading-8 text-red-50/90">
              Supabase returned an error while loading reports.
            </p>
            <p className="mt-4 rounded-2xl border border-red-200/20 bg-red-950/40 p-4 font-mono text-sm text-red-50">
              {error.message}
            </p>
          </section>
        ) : reports.length === 0 ? (
          <section className="mt-8 rounded-3xl border border-white/10 bg-white/[0.04] p-8 text-center">
            <ShieldCheck className="mx-auto h-12 w-12 text-cyan-300" />
            <h2 className="mt-5 text-3xl font-black">No reports yet</h2>
            <p className="mx-auto mt-3 max-w-2xl leading-8 text-slate-300">
              Add a website and run your first passive security posture scan to
              generate a report.
            </p>

            <Link
              href="/dashboard/websites"
              className="mt-6 inline-flex rounded-2xl bg-cyan-300 px-5 py-4 font-black text-slate-950 hover:bg-cyan-200"
            >
              Go to websites
            </Link>
          </section>
        ) : (
          <section className="mt-8 grid gap-5">
            {reports.map((scan) => {
              const overallScore = clampScore(scan.overall_score ?? scan.score);
              const securityScore = clampScore(scan.security_score);
              const privacyScore = clampScore(scan.privacy_score);
              const trustScore = clampScore(scan.trust_score);
              const websiteLabel = text(scan.domain, text(scan.url, "Website"));

              return (
                <article
                  key={scan.id}
                  className="rounded-3xl border border-white/10 bg-white/[0.04] p-6"
                >
                  <div className="flex flex-col justify-between gap-6 xl:flex-row xl:items-center">
                    <div className="min-w-0">
                      <div className="mb-3 flex flex-wrap gap-2">
                        <span
                          className={`rounded-full border px-3 py-1 text-xs font-black ${riskClass(scan.risk_level)}`}
                        >
                          {riskLabel(scan.risk_level)} risk
                        </span>
                        <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-black text-slate-300">
                          {text(scan.status, "completed")}
                        </span>
                      </div>

                      <h2 className="break-words text-2xl font-black text-white">
                        {websiteLabel}
                      </h2>

                      <div className="mt-2 flex items-center gap-2 break-all text-sm text-slate-400">
                        <Globe2 className="h-4 w-4 shrink-0" />
                        {text(scan.url, scan.domain || "URL not available")}
                      </div>

                      <p className="mt-4 max-w-4xl leading-7 text-slate-300">
                        {text(
                          scan.summary,
                          "Passive website security posture report generated by VeyraSec.",
                        )}
                      </p>

                      <p className="mt-3 text-sm text-slate-500">
                        {dateText(scan.created_at)}
                      </p>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-4 xl:w-[520px]">
                      <div className="rounded-2xl border border-white/10 bg-slate-950 p-4 text-center">
                        <p className="text-xs font-bold text-slate-500">
                          Overall
                        </p>
                        <p
                          className={`mt-2 text-3xl font-black ${scoreClass(overallScore)}`}
                        >
                          {overallScore}
                        </p>
                      </div>

                      <div className="rounded-2xl border border-white/10 bg-slate-950 p-4 text-center">
                        <p className="text-xs font-bold text-slate-500">
                          Security
                        </p>
                        <p className="mt-2 text-2xl font-black text-white">
                          {securityScore}
                        </p>
                      </div>

                      <div className="rounded-2xl border border-white/10 bg-slate-950 p-4 text-center">
                        <p className="text-xs font-bold text-slate-500">
                          Privacy
                        </p>
                        <p className="mt-2 text-2xl font-black text-white">
                          {privacyScore}
                        </p>
                      </div>

                      <div className="rounded-2xl border border-white/10 bg-slate-950 p-4 text-center">
                        <p className="text-xs font-bold text-slate-500">
                          Trust
                        </p>
                        <p className="mt-2 text-2xl font-black text-white">
                          {trustScore}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 flex flex-wrap gap-3">
                    <Link
                      href={`/dashboard/scans/${scan.id}`}
                      className="inline-flex items-center gap-2 rounded-2xl bg-cyan-300 px-4 py-3 text-sm font-black text-slate-950 hover:bg-cyan-200"
                    >
                      Open report
                      <ArrowRight className="h-4 w-4" />
                    </Link>

                    <Link
                      href={`/dashboard/scans/${scan.id}/print`}
                      className="inline-flex items-center gap-2 rounded-2xl border border-white/10 px-4 py-3 text-sm font-black text-white hover:bg-white/10"
                    >
                      <Printer className="h-4 w-4" />
                      Print / PDF
                    </Link>
                  </div>
                </article>
              );
            })}
          </section>
        )}
      </div>
    </main>
  );
}
