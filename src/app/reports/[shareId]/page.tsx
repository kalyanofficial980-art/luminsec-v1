import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
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

export const metadata: Metadata = {
  title: "Shared VeyraSec Report",
  robots: {
    index: false,
    follow: false,
  },
};

function scoreClass(score: number) {
  if (score >= 80) return "border-emerald-400/20 bg-emerald-400/10 text-emerald-100";
  if (score >= 60) return "border-amber-400/20 bg-amber-400/10 text-amber-100";
  return "border-red-400/20 bg-red-400/10 text-red-100";
}

function getWebsiteUrl(websites: unknown) {
  if (Array.isArray(websites)) {
    const firstWebsite = websites[0] as { url?: string | null } | undefined;
    return firstWebsite?.url || "Website report";
  }

  if (websites && typeof websites === "object" && "url" in websites) {
    return String((websites as { url?: string | null }).url || "Website report");
  }

  return "Website report";
}

export default async function PublicReportPage({
  params,
}: {
  params: Promise<{ shareId: string }>;
}) {
  const { shareId } = await params;
  const supabase = await createClient();

  const { data: result } = await supabase
    .from("scan_results")
    .select("id, public_share_id, is_public, overall_score, security_score, privacy_score, trust_score, risk_level, summary, created_at, websites(name, url)")
    .eq("public_share_id", shareId)
    .eq("is_public", true)
    .maybeSingle();

  if (!result) {
    notFound();
  }

  const { data: findingsRows } = await supabase
    .from("scan_findings")
    .select("id, category, severity, title, description, recommendation, evidence")
    .eq("scan_result_id", result.id)
    .order("severity", { ascending: true });

  const findings = findingsRows ?? [];
  const websiteUrl = getWebsiteUrl(result.websites);
  const overallScore = Number(result.overall_score ?? 0);

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-8 text-white">
      <div className="mx-auto max-w-6xl">
        <Link
          href="/"
          className="mb-8 inline-flex items-center gap-2 text-sm font-semibold text-slate-300 hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          VeyraSec
        </Link>

        <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-8">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-400/10 ring-1 ring-cyan-300/30">
              <ShieldCheck className="h-6 w-6 text-cyan-300" />
            </div>
            <div>
              <h1 className="text-4xl font-black">Shared Website Trust Report</h1>
              <p className="break-all text-slate-400">{websiteUrl}</p>
            </div>
          </div>

          <p className="max-w-3xl leading-8 text-slate-300">
            This is a shared VeyraSec report created using safe passive website checks.
            It is not a full cybersecurity audit, legal advice, or penetration test.
          </p>

          <p className="mt-4 text-sm text-slate-500">
            Report created: {formatDateTime(result.created_at)}
          </p>
        </section>

        <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ["Overall", Number(result.overall_score ?? 0)],
            ["Security", Number(result.security_score ?? 0)],
            ["Privacy", Number(result.privacy_score ?? 0)],
            ["Trust", Number(result.trust_score ?? 0)],
          ].map(([label, value]) => (
            <div key={String(label)} className={`rounded-3xl border p-6 ${scoreClass(Number(value))}`}>
              <p className="text-sm opacity-80">{label}</p>
              <p className="mt-2 text-4xl font-black">{Number(value)}/100</p>
            </div>
          ))}
        </section>

        <section className="mt-8 rounded-3xl border border-white/10 bg-white/[0.04] p-8">
          <div className="mb-6 flex items-center gap-3">
            <FileText className="h-7 w-7 text-cyan-300" />
            <h2 className="text-3xl font-black">Executive summary</h2>
          </div>

          <p className="leading-8 text-slate-300">{result.summary}</p>
        </section>

        <section className="mt-8 rounded-3xl border border-white/10 bg-white/[0.04] p-8">
          <div className="mb-6 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Globe2 className="h-7 w-7 text-cyan-300" />
              <h2 className="text-3xl font-black">Findings</h2>
            </div>

            <span className="rounded-full border border-white/10 px-3 py-1 text-sm font-bold text-slate-300">
              {findings.length}
            </span>
          </div>

          {findings.length === 0 ? (
            <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 p-5 text-emerald-100">
              No findings were stored for this shared report.
            </div>
          ) : (
            <div className="grid gap-4">
              {findings.map((finding) => (
                <div key={finding.id} className="rounded-3xl border border-white/10 bg-slate-950 p-6">
                  <div className="mb-3 flex flex-wrap items-center gap-2">
                    <h3 className="text-xl font-black">{finding.title}</h3>
                    <span className="rounded-full border border-white/10 px-2 py-1 text-xs font-bold text-slate-300">
                      {finding.severity}
                    </span>
                    <span className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-2 py-1 text-xs font-bold text-cyan-100">
                      {finding.category}
                    </span>
                  </div>

                  <p className="leading-7 text-slate-300">{finding.description}</p>

                  {finding.recommendation ? (
                    <div className="mt-4 rounded-2xl border border-cyan-300/20 bg-cyan-300/10 p-4">
                      <p className="mb-1 flex items-center gap-2 font-bold text-cyan-100">
                        <CheckCircle2 className="h-4 w-4" />
                        Recommendation
                      </p>
                      <p className="leading-7 text-cyan-50/90">{finding.recommendation}</p>
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="mt-8 rounded-3xl border border-amber-300/20 bg-amber-300/10 p-8">
          <div className="mb-3 flex items-center gap-3">
            <AlertTriangle className="h-7 w-7 text-amber-200" />
            <h2 className="text-2xl font-black text-amber-100">Important disclaimer</h2>
          </div>

          <p className="leading-8 text-amber-50/90">
            This shared report is based on safe passive checks only. It does not verify full
            security, legal compliance, server-side vulnerabilities, authentication flows, or
            business-specific risk. For high-risk systems, use qualified cybersecurity and legal professionals.
          </p>
        </section>

        <footer className="py-8 text-center text-sm text-slate-500">
          Shared via {brand.name} {brand.version}
        </footer>
      </div>
    </main>
  );
}