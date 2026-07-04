import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, Globe2, ShieldCheck } from "lucide-react";
import { brand } from "@/config/brand";
import { PrintButton } from "@/components/report/print-button";
import { createClient } from "@/lib/supabase/server";
import { formatDateTime, getRiskLabel } from "@/lib/utils/risk";

export default async function ScanPrintPage({
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
      raw_result,
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
    <main className="min-h-screen bg-slate-100 px-4 py-6 text-slate-950 print:bg-white print:px-0 print:py-0">
      <div className="mx-auto max-w-4xl rounded-3xl bg-white p-8 shadow-xl print:max-w-none print:rounded-none print:p-8 print:shadow-none">
        <div className="mb-6 flex items-center justify-between gap-4 print:hidden">
          <Link
            href={`/app/scans/${result.id}`}
            className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 px-5 py-3 font-semibold text-slate-700 hover:bg-slate-50"
          >
            <ArrowLeft className="h-5 w-5" />
            Back to report
          </Link>

          <PrintButton />
        </div>

        <header className="border-b border-slate-200 pb-6">
          <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-start">
            <div>
              <div className="mb-3 flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-950 text-cyan-300">
                  <ShieldCheck className="h-6 w-6" />
                </div>
                <div>
                  <h1 className="text-3xl font-black">{brand.name}</h1>
                  <p className="text-sm font-semibold uppercase tracking-[0.25em] text-slate-500">
                    Website Trust Report
                  </p>
                </div>
              </div>

              <p className="max-w-2xl text-sm leading-6 text-slate-600">
                Basic passive website security, privacy, and trust readiness report.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 p-4 text-right">
              <p className="text-sm text-slate-500">Overall score</p>
              <p className="text-5xl font-black">{result.overall_score}</p>
              <p className="text-sm font-bold">{getRiskLabel(result.risk_level)}</p>
            </div>
          </div>
        </header>

        <section className="mt-6 grid gap-4 border-b border-slate-200 pb-6 md:grid-cols-2">
          <div>
            <p className="text-sm font-bold text-slate-500">Website</p>
            <div className="mt-2 flex items-start gap-2">
              <Globe2 className="mt-1 h-5 w-5 text-slate-500" />
              <div>
                <p className="font-bold">{website?.label || website?.domain || "Website"}</p>
                <p className="break-all text-sm text-slate-600">{website?.url}</p>
              </div>
            </div>
          </div>

          <div>
            <p className="text-sm font-bold text-slate-500">Report details</p>
            <p className="mt-2 text-sm text-slate-700">Scan date: {formatDateTime(result.created_at)}</p>
            <p className="text-sm text-slate-700">Report ID: {result.id}</p>
          </div>
        </section>

        <section className="mt-6 grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 p-5">
            <p className="text-sm text-slate-500">Security score</p>
            <p className="mt-2 text-4xl font-black">{result.security_score}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 p-5">
            <p className="text-sm text-slate-500">Privacy score</p>
            <p className="mt-2 text-4xl font-black">{result.privacy_score}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 p-5">
            <p className="text-sm text-slate-500">Trust score</p>
            <p className="mt-2 text-4xl font-black">{result.trust_score}</p>
          </div>
        </section>

        <section className="mt-6 rounded-2xl border border-slate-200 p-6">
          <h2 className="text-xl font-black">Executive summary</h2>
          <p className="mt-3 leading-7 text-slate-700">{result.summary}</p>
        </section>

        <section className="mt-6">
          <h2 className="text-xl font-black">Findings and recommendations</h2>

          {!findings || findings.length === 0 ? (
            <div className="mt-4 rounded-2xl border border-slate-200 p-6 text-slate-600">
              No findings saved for this scan.
            </div>
          ) : (
            <div className="mt-4 grid gap-4">
              {findings.map((finding, index) => (
                <div key={finding.id} className="break-inside-avoid rounded-2xl border border-slate-200 p-5">
                  <div className="mb-2 flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
                    <h3 className="text-lg font-black">
                      {index + 1}. {finding.title}
                    </h3>
                    <span className="w-fit rounded-full border border-slate-300 px-3 py-1 text-xs font-bold uppercase">
                      {finding.severity}
                    </span>
                  </div>

                  <p className="leading-7 text-slate-700">{finding.description}</p>

                  <div className="mt-4 rounded-xl bg-slate-100 p-4">
                    <p className="text-sm font-black">Recommendation</p>
                    <p className="mt-1 text-sm leading-6 text-slate-700">{finding.recommendation}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="mt-8 border-t border-slate-200 pt-5 text-xs leading-6 text-slate-500">
          <p className="font-bold text-slate-700">Disclaimer</p>
          <p>
            This report is generated using safe passive checks based on public website responses.
            It is not legal advice, not a full cybersecurity audit, and not a penetration test.
            VeyraSec does not perform exploitation, brute force, password testing, or intrusive scanning in V1.
          </p>
        </section>
      </div>
    </main>
  );
}