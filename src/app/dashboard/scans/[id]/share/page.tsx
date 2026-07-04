import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowLeft,
  Copy,
  ExternalLink,
  Globe2,
  Lock,
  Share2,
  ShieldCheck,
} from "lucide-react";
import { requireFeatureAccess } from "@/lib/subscription/feature-access";
import { disablePublicReport, enablePublicReport } from "./actions";

function getWebsiteUrl(websites: unknown) {
  if (Array.isArray(websites)) {
    const first = websites[0] as { url?: string; name?: string } | undefined;
    return first?.url || first?.name || "Website";
  }

  const website = websites as { url?: string; name?: string } | null;

  return website?.url || website?.name || "Website";
}

export default async function ShareReportPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ message?: string }>;
}) {
  const { id } = await params;
  const query = await searchParams;
  const { supabase, user } = await requireFeatureAccess("public_share");

  const { data: scan } = await supabase
    .from("scan_results")
    .select("id, website_id, overall_score, risk_level, created_at, is_public, public_share_id, websites(name, url)")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!scan) {
    redirect("/dashboard/scans");
  }

  const shareUrl =
    scan.public_share_id
      ? `${process.env.APP_URL || "http://localhost:3000"}/reports/${scan.public_share_id}`
      : "";

  return (
    <main className="min-h-screen bg-slate-950 p-6 text-white">
      <div className="mx-auto max-w-4xl">
        <Link
          href={`/dashboard/scans/${scan.id}`}
          className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-slate-300 hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to report
        </Link>

        <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-8">
          <div className="mb-8 flex items-start justify-between gap-6">
            <div>
              <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-400/10 ring-1 ring-cyan-300/30">
                <Share2 className="h-8 w-8 text-cyan-300" />
              </div>

              <h1 className="text-4xl font-black tracking-tight">
                Public report sharing
              </h1>

              <p className="mt-4 max-w-2xl leading-8 text-slate-300">
                Create a public read-only link for this report. Only people with the link can view it.
              </p>
            </div>

            <div
              className={`rounded-3xl border p-5 text-center ${
                scan.is_public
                  ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-100"
                  : "border-slate-400/20 bg-slate-400/10 text-slate-100"
              }`}
            >
              {scan.is_public ? (
                <Globe2 className="mx-auto mb-3 h-8 w-8" />
              ) : (
                <Lock className="mx-auto mb-3 h-8 w-8" />
              )}
              <p className="text-sm opacity-80">Status</p>
              <p className="mt-1 text-2xl font-black">
                {scan.is_public ? "Public" : "Private"}
              </p>
            </div>
          </div>

          {query.message ? (
            <div className="mb-6 rounded-2xl border border-cyan-300/20 bg-cyan-300/10 p-4 text-cyan-100">
              {query.message}
            </div>
          ) : null}

          <div className="rounded-3xl border border-white/10 bg-slate-950 p-6">
            <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
              <div>
                <p className="text-sm text-slate-400">Website</p>
                <p className="mt-1 text-xl font-black">{getWebsiteUrl(scan.websites)}</p>
                <p className="mt-2 text-sm text-slate-500">
                  Score: {scan.overall_score}/100 · Risk: {scan.risk_level}
                </p>
              </div>

              <ShieldCheck className="h-10 w-10 text-cyan-300" />
            </div>
          </div>

          {scan.is_public && shareUrl ? (
            <div className="mt-6 rounded-3xl border border-emerald-400/20 bg-emerald-400/10 p-6">
              <p className="mb-2 text-sm font-bold text-emerald-100">Public report link</p>
              <div className="rounded-2xl border border-emerald-400/20 bg-slate-950 p-4 text-sm text-emerald-50 break-all">
                {shareUrl}
              </div>

              <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                <Link
                  href={shareUrl}
                  target="_blank"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-cyan-300 px-5 py-4 font-bold text-slate-950 hover:bg-cyan-200"
                >
                  Open public report
                  <ExternalLink className="h-5 w-5" />
                </Link>

                <div className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 px-5 py-4 text-sm font-bold text-emerald-100">
                  <Copy className="h-5 w-5" />
                  Copy manually
                </div>
              </div>
            </div>
          ) : (
            <div className="mt-6 rounded-3xl border border-slate-400/20 bg-slate-400/10 p-6 text-slate-200">
              <p className="font-bold">This report is currently private.</p>
              <p className="mt-2 text-sm leading-6 text-slate-400">
                Enable public sharing to create a read-only report link.
              </p>
            </div>
          )}

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            {scan.is_public ? (
              <form action={disablePublicReport}>
                <input type="hidden" name="scan_id" value={scan.id} />
                <button
                  type="submit"
                  className="rounded-2xl border border-red-400/20 bg-red-400/10 px-5 py-4 font-bold text-red-100 hover:bg-red-400/20"
                >
                  Disable public link
                </button>
              </form>
            ) : (
              <form action={enablePublicReport}>
                <input type="hidden" name="scan_id" value={scan.id} />
                <button
                  type="submit"
                  className="rounded-2xl bg-cyan-300 px-5 py-4 font-bold text-slate-950 hover:bg-cyan-200"
                >
                  Enable public link
                </button>
              </form>
            )}

            <Link
              href="/dashboard/subscription"
              className="inline-flex items-center justify-center rounded-2xl border border-white/10 px-5 py-4 font-bold text-white hover:bg-white/10"
            >
              View subscription
            </Link>
          </div>

          <div className="mt-8 rounded-2xl border border-amber-300/20 bg-amber-300/10 p-4 text-sm leading-7 text-amber-50/90">
            Public sharing is plan-protected. Reports remain safe passive website trust reports only.
            Do not treat them as legal compliance certification or penetration test results.
          </div>
        </section>
      </div>
    </main>
  );
}