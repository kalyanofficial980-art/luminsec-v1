import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, FileText, Globe2, ShieldCheck } from "lucide-react";
import { brand } from "@/config/brand";
import { createClient } from "@/lib/supabase/server";
import { formatDateTime, getRiskBadgeClass, getRiskLabel } from "@/lib/utils/risk";

export default async function ScansPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: scans, error } = await supabase
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
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <main className="min-h-screen bg-slate-950 p-6 text-white">
      <div className="mx-auto max-w-6xl">
        <Link
          href="/dashboard"
          className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-slate-300 hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to dashboard
        </Link>

        <div className="mb-8 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-400/10 ring-1 ring-cyan-300/30">
            <ShieldCheck className="h-6 w-6 text-cyan-300" />
          </div>
          <div>
            <h1 className="text-3xl font-black">Scan history</h1>
            <p className="text-slate-400">{brand.name} passive scan reports</p>
          </div>
        </div>

        {error ? (
          <div className="rounded-3xl border border-red-300/20 bg-red-300/10 p-6 text-red-100">
            {error.message}
          </div>
        ) : null}

        {!scans || scans.length === 0 ? (
          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-10 text-center">
            <FileText className="mx-auto mb-4 h-10 w-10 text-cyan-300" />
            <h2 className="text-2xl font-bold">No scan reports yet</h2>
            <p className="mx-auto mt-2 max-w-xl text-slate-400">
              Add a website and run your first safe passive scan.
            </p>
            <Link
              href="/dashboard/websites"
              className="mt-6 inline-flex items-center justify-center rounded-2xl bg-cyan-300 px-5 py-3 font-bold text-slate-950 hover:bg-cyan-200"
            >
              Go to websites
            </Link>
          </div>
        ) : (
          <div className="grid gap-4">
            {scans.map((scan) => {
              const website = Array.isArray(scan.websites)
                ? scan.websites[0]
                : scan.websites;

              return (
                <Link
                  key={scan.id}
                  href={`/dashboard/scans/${scan.id}`}
                  className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 transition hover:bg-white/[0.07]"
                >
                  <div className="flex flex-col justify-between gap-5 md:flex-row md:items-center">
                    <div>
                      <div className="mb-2 flex items-center gap-2">
                        <Globe2 className="h-5 w-5 text-cyan-300" />
                        <h2 className="text-xl font-bold">
                          {website?.label || website?.domain || "Website"}
                        </h2>
                      </div>
                      <p className="break-all text-sm text-slate-400">{website?.url}</p>
                      <p className="mt-2 text-sm text-slate-500">
                        Scanned {formatDateTime(scan.created_at)}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                      <div className="rounded-2xl border border-white/10 bg-slate-950 px-5 py-3 text-center">
                        <p className="text-xs text-slate-400">Score</p>
                        <p className="text-2xl font-black">{scan.overall_score}</p>
                      </div>
                      <span
                        className={`rounded-full border px-4 py-2 text-sm font-bold ${getRiskBadgeClass(
                          scan.risk_level
                        )}`}
                      >
                        {getRiskLabel(scan.risk_level)}
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
