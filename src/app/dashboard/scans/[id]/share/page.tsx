import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  ArrowLeft,
  Copy,
  ExternalLink,
  Link2,
  Lock,
  ShieldCheck,
  Unlock,
} from "lucide-react";
import { brand } from "@/config/brand";
import { createClient } from "@/lib/supabase/server";
import { formatDateTime } from "@/lib/utils/risk";
import { disablePublicReport, enablePublicReport } from "./actions";

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

export default async function ShareReportPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ message?: string }>;
}) {
  const { id } = await params;
  const query = await searchParams;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: result } = await supabase
    .from("scan_results")
    .select("id, public_share_id, is_public, overall_score, created_at, websites(name, url)")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!result) {
    notFound();
  }

  const publicUrl =
    result.public_share_id ? `${brand.url}/reports/${result.public_share_id}` : "";

  return (
    <main className="min-h-screen bg-slate-950 p-6 text-white">
      <div className="mx-auto max-w-5xl">
        <Link
          href={`/dashboard/scans/${result.id}`}
          className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-slate-300 hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to report
        </Link>

        <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-8">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-400/10 ring-1 ring-cyan-300/30">
              <Link2 className="h-6 w-6 text-cyan-300" />
            </div>
            <div>
              <h1 className="text-4xl font-black">Public report sharing</h1>
              <p className="break-all text-slate-400">{getWebsiteUrl(result.websites)}</p>
            </div>
          </div>

          <p className="max-w-3xl leading-8 text-slate-300">
            Enable a public client link for this report. Anyone with the link can view the shared
            report summary and findings, but they cannot access your SaaS dashboard.
          </p>

          {query.message ? (
            <div className="mt-6 rounded-2xl border border-cyan-300/20 bg-cyan-300/10 p-4 text-cyan-100">
              {query.message}
            </div>
          ) : null}

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <div className="rounded-3xl border border-white/10 bg-slate-950 p-6">
              <p className="text-sm text-slate-400">Score</p>
              <p className="mt-2 text-4xl font-black">{Number(result.overall_score ?? 0)}/100</p>
            </div>

            <div className="rounded-3xl border border-white/10 bg-slate-950 p-6">
              <p className="text-sm text-slate-400">Created</p>
              <p className="mt-2 text-lg font-black">{formatDateTime(result.created_at)}</p>
            </div>

            <div
              className={`rounded-3xl border p-6 ${
                result.is_public
                  ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-100"
                  : "border-slate-400/20 bg-slate-400/10 text-slate-100"
              }`}
            >
              <p className="text-sm opacity-80">Sharing status</p>
              <p className="mt-2 text-2xl font-black">
                {result.is_public ? "Public" : "Private"}
              </p>
            </div>
          </div>
        </section>

        <section className="mt-8 rounded-3xl border border-white/10 bg-white/[0.04] p-8">
          {result.is_public && publicUrl ? (
            <>
              <div className="mb-6 flex items-center gap-3">
                <Unlock className="h-7 w-7 text-emerald-300" />
                <h2 className="text-3xl font-black">Public link is enabled</h2>
              </div>

              <div className="rounded-2xl border border-white/10 bg-slate-950 p-5">
                <p className="mb-2 text-sm font-bold text-slate-400">Client report link</p>
                <p className="break-all text-cyan-300">{publicUrl}</p>
              </div>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <a
                  href={publicUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-cyan-300 px-5 py-4 font-bold text-slate-950 hover:bg-cyan-200"
                >
                  <ExternalLink className="h-5 w-5" />
                  Open public report
                </a>

                <div className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 px-5 py-4 font-bold text-slate-300">
                  <Copy className="h-5 w-5" />
                  Copy link manually
                </div>

                <form action={disablePublicReport}>
                  <input type="hidden" name="scan_id" value={result.id} />
                  <button
                    type="submit"
                    className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-red-300/20 bg-red-300/10 px-5 py-4 font-bold text-red-100 hover:bg-red-300/20"
                  >
                    <Lock className="h-5 w-5" />
                    Disable public link
                  </button>
                </form>
              </div>
            </>
          ) : (
            <>
              <div className="mb-6 flex items-center gap-3">
                <Lock className="h-7 w-7 text-slate-300" />
                <h2 className="text-3xl font-black">Report is private</h2>
              </div>

              <p className="max-w-3xl leading-8 text-slate-300">
                Enable sharing only when you want to send this report to a customer or client.
                You can disable the link later.
              </p>

              <form action={enablePublicReport} className="mt-6">
                <input type="hidden" name="scan_id" value={result.id} />
                <button
                  type="submit"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-cyan-300 px-6 py-4 font-bold text-slate-950 hover:bg-cyan-200"
                >
                  <ShieldCheck className="h-5 w-5" />
                  Enable public report link
                </button>
              </form>
            </>
          )}
        </section>

        <section className="mt-8 rounded-3xl border border-amber-300/20 bg-amber-300/10 p-8">
          <h2 className="text-2xl font-black text-amber-100">Sharing safety note</h2>
          <p className="mt-3 leading-8 text-amber-50/90">
            Public reports are useful for clients, but only share reports for websites you own,
            manage, or have permission to review. The report is still a basic passive readiness
            report, not a full audit or penetration test.
          </p>
        </section>
      </div>
    </main>
  );
}