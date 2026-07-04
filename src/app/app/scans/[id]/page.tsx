import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, Globe2, ShieldAlert, ShieldCheck } from "lucide-react";
import { brand } from "@/config/brand";
import { createClient } from "@/lib/supabase/server";

const severityClasses: Record<string, string> = {
  critical: "border-red-400/30 bg-red-400/10 text-red-100",
  high: "border-orange-400/30 bg-orange-400/10 text-orange-100",
  medium: "border-amber-400/30 bg-amber-400/10 text-amber-100",
  low: "border-blue-400/30 bg-blue-400/10 text-blue-100",
  info: "border-slate-400/30 bg-slate-400/10 text-slate-100",
};

const riskLabels: Record<string, string> = {
  good: "Good",
  needs_improvement: "Needs improvement",
  risky: "Risky",
  high_risk: "High risk",
  unknown: "Unknown",
};

export default async function ScanReportPage({
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
    redirect("/app/websites?message=Scan report not found");
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

  return (
    <main className="min-h-screen bg-slate-950 p-6 text-white">
      <div className="mx-auto max-w-6xl">
        <Link
          href="/app/websites"
          className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-slate-300 hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to websites
        </Link>

        <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-8">
          <div className="mb-8 flex flex-col justify-between gap-5 md:flex-row md:items-start">
            <div>
              <div className="mb-3 flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-400/10 ring-1 ring-cyan-300/30">
                  <ShieldCheck className="h-6 w-6 text-cyan-300" />
                </div>
                <div>
                  <h1 className="text-3xl font-black">{brand.product}</h1>
                  <p className="text-slate-400">Safe passive scan result</p>
                </div>
              </div>

              <div className="mt-5 flex items-center gap-2 text-slate-300">
                <Globe2 className="h-5 w-5 text-cyan-300" />
                <span className="break-all">{website?.label || website?.domain}</span>
              </div>
              <p className="mt-1 break-all text-sm text-slate-500">{website?.url}</p>
            </div>

            <div className="rounded-3xl border border-cyan-300/20 bg-cyan-300/10 p-6 text-center">
              <p className="text-sm text-cyan-100">Overall score</p>
              <p className="mt-2 text-5xl font-black text-white">{result.overall_score}</p>
              <p className="mt-2 text-sm font-semibold text-cyan-100">
                {riskLabels[result.risk_level] ?? result.risk_level}
              </p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-3xl border border-white/10 bg-slate-950 p-5">
              <p className="text-sm text-slate-400">Security score</p>
              <p className="mt-2 text-4xl font-black">{result.security_score}</p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-slate-950 p-5">
              <p className="text-sm text-slate-400">Privacy score</p>
              <p className="mt-2 text-4xl font-black">{result.privacy_score}</p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-slate-950 p-5">
              <p className="text-sm text-slate-400">Trust score</p>
              <p className="mt-2 text-4xl font-black">{result.trust_score}</p>
            </div>
          </div>

          <div className="mt-6 rounded-3xl border border-white/10 bg-slate-950 p-6">
            <h2 className="text-xl font-bold">Executive summary</h2>
            <p className="mt-3 leading-7 text-slate-300">{result.summary}</p>
            <p className="mt-4 text-sm text-slate-500">
              Disclaimer: This is a basic passive readiness check. It is not legal advice and not a full penetration test.
            </p>
          </div>
        </section>

        <section className="mt-8">
          <div className="mb-4 flex items-center gap-3">
            <ShieldAlert className="h-6 w-6 text-cyan-300" />
            <h2 className="text-2xl font-bold">Findings</h2>
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
                  <p className="leading-7 text-slate-300">{finding.description}</p>
                  <div className="mt-4 rounded-2xl border border-cyan-300/20 bg-cyan-300/10 p-4">
                    <p className="text-sm font-bold text-cyan-100">Recommendation</p>
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
