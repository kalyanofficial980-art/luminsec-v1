import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import {
  ArrowLeft,
  Copy,
  ExternalLink,
  Globe2,
  Lock,
  Share2,
  ShieldCheck,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { requireDashboardUser } from "@/lib/auth/route-access";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

const appUrl =
  process.env.NEXT_PUBLIC_APP_URL ||
  process.env.APP_URL ||
  "http://localhost:3000";

async function enablePublicShare(formData: FormData) {
  "use server";

  const scanId = String(formData.get("scan_id") ?? "").trim();

  if (!scanId) {
    redirect("/dashboard/scans");
  }

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  let scanQuery = supabase
    .from("scan_results")
    .select("id, user_id, public_share_id")
    .eq("id", scanId);

  if (profile?.role !== "admin") {
    scanQuery = scanQuery.eq("user_id", user.id);
  }

  const { data: scan } = await scanQuery.maybeSingle();

  if (!scan) {
    redirect("/dashboard/scans");
  }

  const shareId = scan.public_share_id || crypto.randomUUID();

  await supabase
    .from("scan_results")
    .update({
      is_public: true,
      public_share_id: shareId,
    })
    .eq("id", scan.id);

  revalidatePath(`/dashboard/scans/${scan.id}/share`);
  revalidatePath(`/reports/${shareId}`);

  redirect(`/dashboard/scans/${scan.id}/share`);
}

async function disablePublicShare(formData: FormData) {
  "use server";

  const scanId = String(formData.get("scan_id") ?? "").trim();

  if (!scanId) {
    redirect("/dashboard/scans");
  }

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  let scanQuery = supabase
    .from("scan_results")
    .select("id, user_id, public_share_id")
    .eq("id", scanId);

  if (profile?.role !== "admin") {
    scanQuery = scanQuery.eq("user_id", user.id);
  }

  const { data: scan } = await scanQuery.maybeSingle();

  if (!scan) {
    redirect("/dashboard/scans");
  }

  await supabase
    .from("scan_results")
    .update({
      is_public: false,
    })
    .eq("id", scan.id);

  revalidatePath(`/dashboard/scans/${scan.id}/share`);

  if (scan.public_share_id) {
    revalidatePath(`/reports/${scan.public_share_id}`);
  }

  redirect(`/dashboard/scans/${scan.id}/share`);
}

function scoreClass(score: number) {
  if (score >= 85) return "text-emerald-300";
  if (score >= 65) return "text-amber-300";
  if (score >= 40) return "text-orange-300";
  return "text-red-300";
}

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

export default async function ShareReportPage({ params }: PageProps) {
  const { id } = await params;
  const { supabase, user, profile } = await requireDashboardUser();

  let scanQuery = supabase
    .from("scan_results")
    .select(
      "id, user_id, url, domain, overall_score, score, risk_level, summary, is_public, public_share_id, created_at"
    )
    .eq("id", id);

  if (profile.role !== "admin") {
    scanQuery = scanQuery.eq("user_id", user.id);
  }

  const { data: scan } = await scanQuery.maybeSingle();

  if (!scan) {
    notFound();
  }

  const shareUrl = scan.public_share_id
    ? `${appUrl}/reports/${scan.public_share_id}`
    : "";

  const overallScore = clampScore(scan.overall_score ?? scan.score);

  return (
    <main className="min-h-screen bg-slate-950 p-6 text-white">
      <div className="mx-auto max-w-5xl">
        <Link
          href={`/dashboard/scans/${scan.id}`}
          className="mb-6 inline-flex items-center gap-2 text-sm font-bold text-cyan-300 hover:text-cyan-200"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to report
        </Link>

        <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-8">
          <div className="flex flex-col justify-between gap-8 lg:flex-row lg:items-start">
            <div>
              <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-400/10 ring-1 ring-cyan-300/30">
                <Share2 className="h-8 w-8 text-cyan-300" />
              </div>

              <p className="text-sm font-black uppercase tracking-[0.3em] text-cyan-300">
                Public share
              </p>

              <h1 className="mt-4 text-4xl font-black tracking-tight md:text-5xl">
                Share professional report
              </h1>

              <p className="mt-4 max-w-3xl leading-8 text-slate-300">
                Create a share-safe public cybersecurity posture report. Public reports do not expose admin tools, subscription data, private account data, or internal dashboard pages.
              </p>
            </div>

            <div className="rounded-3xl border border-white/10 bg-slate-950 p-6 text-center">
              <p className="text-sm font-bold text-slate-400">Overall score</p>
              <p className={`mt-2 text-6xl font-black ${scoreClass(overallScore)}`}>
                {overallScore}
              </p>
              <p className="mt-2 text-sm text-slate-500">out of 100</p>
            </div>
          </div>
        </section>

        <section className="mt-8 rounded-3xl border border-white/10 bg-white/[0.04] p-8">
          <div className="flex items-start gap-4">
            {scan.is_public ? (
              <ShieldCheck className="mt-1 h-8 w-8 shrink-0 text-emerald-300" />
            ) : (
              <Lock className="mt-1 h-8 w-8 shrink-0 text-amber-300" />
            )}

            <div className="min-w-0 flex-1">
              <h2 className="text-2xl font-black">
                {scan.is_public ? "Public sharing is enabled" : "Public sharing is disabled"}
              </h2>

              <p className="mt-3 leading-8 text-slate-300">
                {scan.is_public
                  ? "Anyone with the link can view this public report."
                  : "Enable sharing to create a public report link for clients, developers, or business owners."}
              </p>

              <div className="mt-5 rounded-2xl border border-white/10 bg-slate-950 p-5">
                <div className="mb-3 flex items-center gap-2 text-sm font-bold text-slate-400">
                  <Globe2 className="h-4 w-4" />
                  Report URL
                </div>

                {scan.is_public && shareUrl ? (
                  <a
                    href={shareUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="break-all font-mono text-sm leading-7 text-cyan-200 hover:text-cyan-100"
                  >
                    {shareUrl}
                  </a>
                ) : (
                  <p className="text-sm text-slate-500">
                    No public URL is active yet.
                  </p>
                )}
              </div>

              <div className="mt-6 flex flex-wrap gap-3">
                {scan.is_public && shareUrl ? (
                  <>
                    <a
                      href={shareUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 rounded-2xl bg-cyan-300 px-5 py-4 font-black text-slate-950 hover:bg-cyan-200"
                    >
                      Open public report
                      <ExternalLink className="h-5 w-5" />
                    </a>

                    <form action={disablePublicShare}>
                      <input type="hidden" name="scan_id" value={scan.id} />
                      <button
                        type="submit"
                        className="rounded-2xl border border-red-300/20 bg-red-300/10 px-5 py-4 font-black text-red-100 hover:bg-red-300/20"
                      >
                        Disable sharing
                      </button>
                    </form>
                  </>
                ) : (
                  <form action={enablePublicShare}>
                    <input type="hidden" name="scan_id" value={scan.id} />
                    <button
                      type="submit"
                      className="rounded-2xl bg-cyan-300 px-5 py-4 font-black text-slate-950 hover:bg-cyan-200"
                    >
                      Enable public sharing
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>
        </section>

        <section className="mt-8 rounded-3xl border border-amber-300/20 bg-amber-300/10 p-8">
          <h2 className="text-2xl font-black text-amber-100">Share safety rules</h2>
          <div className="mt-4 grid gap-3 text-amber-50/90">
            {[
              "Only the selected report is shared.",
              "Private dashboard pages are not shared.",
              "Admin tools and subscription data are never exposed.",
              "The report remains passive-scope only, not a penetration test.",
              "You can disable the link anytime.",
            ].map((item) => (
              <div key={item} className="flex gap-3">
                <Copy className="mt-1 h-4 w-4 shrink-0" />
                <p className="leading-7">{item}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-8 rounded-3xl border border-white/10 bg-white/[0.04] p-8">
          <h2 className="text-2xl font-black">Report preview</h2>
          <p className="mt-3 text-sm text-slate-400">
            {text(scan.domain, text(scan.url, "Website"))}
          </p>
          <p className="mt-4 leading-8 text-slate-300">
            {text(scan.summary, "Passive website security posture report generated by VeyraSec.")}
          </p>
        </section>
      </div>
    </main>
  );
}