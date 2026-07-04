import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  ArrowLeft,
  BarChart3,
  Calendar,
  ExternalLink,
  FileText,
  Globe2,
  PlayCircle,
  ShieldAlert,
  ShieldCheck,
  TrendingUp,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { formatDateTime } from "@/lib/utils/risk";
import { startPassiveScan } from "../actions";

function scoreLabel(score: number) {
  if (score >= 80) return "Strong";
  if (score >= 60) return "Needs improvement";
  return "Needs attention";
}

function scoreClass(score: number) {
  if (score >= 80) return "border-emerald-400/20 bg-emerald-400/10 text-emerald-100";
  if (score >= 60) return "border-amber-400/20 bg-amber-400/10 text-amber-100";
  return "border-red-400/20 bg-red-400/10 text-red-100";
}

function safeScore(value: unknown) {
  return Number(value ?? 0);
}

export default async function WebsiteDetailPage({
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

  const { data: website } = await supabase
    .from("websites")
    .select("id, name, url, created_at")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!website) {
    notFound();
  }

  const { data: scans } = await supabase
    .from("scan_results")
    .select("id, overall_score, security_score, privacy_score, trust_score, risk_level, summary, created_at")
    .eq("website_id", website.id)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const scanRows = scans ?? [];
  const latestScan = scanRows[0];

  const latestOverall = safeScore(latestScan?.overall_score);
  const latestSecurity = safeScore(latestScan?.security_score);
  const latestPrivacy = safeScore(latestScan?.privacy_score);
  const latestTrust = safeScore(latestScan?.trust_score);

  const previousScan = scanRows[1];
  const previousOverall = safeScore(previousScan?.overall_score);
  const scoreChange = latestScan && previousScan ? latestOverall - previousOverall : null;

  const scoreCards = [
    {
      label: "Overall readiness",
      value: latestOverall,
      icon: BarChart3,
    },
    {
      label: "Security",
      value: latestSecurity,
      icon: ShieldCheck,
    },
    {
      label: "Privacy",
      value: latestPrivacy,
      icon: ShieldAlert,
    },
    {
      label: "Trust",
      value: latestTrust,
      icon: TrendingUp,
    },
  ];

  return (
    <main className="min-h-screen bg-slate-950 p-6 text-white">
      <div className="mx-auto max-w-7xl">
        <Link
          href="/dashboard/websites"
          className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-slate-300 hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to websites
        </Link>

        <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-8">
          <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-start">
            <div>
              <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-400/10 ring-1 ring-cyan-300/30">
                <Globe2 className="h-8 w-8 text-cyan-300" />
              </div>

              <h1 className="break-all text-4xl font-black tracking-tight md:text-5xl">
                {website.name || website.url}
              </h1>

              <a
                href={website.url}
                target="_blank"
                rel="noreferrer"
                className="mt-4 inline-flex break-all text-slate-300 hover:text-cyan-300"
              >
                {website.url}
              </a>

              <p className="mt-3 flex items-center gap-2 text-sm text-slate-500">
                <Calendar className="h-4 w-4" />
                Added {formatDateTime(website.created_at)}
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
              <form action={startPassiveScan}>
                <input type="hidden" name="website_id" value={website.id} />
                <button
                  type="submit"
                  className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-cyan-300 px-5 py-4 font-bold text-slate-950 hover:bg-cyan-200"
                >
                  <PlayCircle className="h-5 w-5" />
                  Run new scan
                </button>
              </form>

              {latestScan ? (
                <Link
                  href={`/dashboard/scans/${latestScan.id}`}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 px-5 py-4 font-bold text-white hover:bg-white/10"
                >
                  <FileText className="h-5 w-5" />
                  Open latest report
                </Link>
              ) : null}

              <a
                href={website.url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 px-5 py-4 font-bold text-white hover:bg-white/10"
              >
                <ExternalLink className="h-5 w-5" />
                Visit website
              </a>
            </div>
          </div>
        </section>

        {latestScan ? (
          <section className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {scoreCards.map((card) => {
              const Icon = card.icon;

              return (
                <div key={card.label} className={`rounded-3xl border p-6 ${scoreClass(card.value)}`}>
                  <div className="mb-5 flex items-center justify-between gap-4">
                    <Icon className="h-7 w-7" />
                    <span className="rounded-full bg-slate-950/40 px-3 py-1 text-xs font-bold">
                      {scoreLabel(card.value)}
                    </span>
                  </div>

                  <p className="text-sm opacity-80">{card.label}</p>
                  <p className="mt-2 text-4xl font-black">{card.value}/100</p>
                </div>
              );
            })}
          </section>
        ) : (
          <section className="mt-8 rounded-3xl border border-cyan-300/20 bg-cyan-300/10 p-8 text-center">
            <ShieldCheck className="mx-auto mb-4 h-12 w-12 text-cyan-300" />
            <h2 className="text-3xl font-black text-cyan-100">No scans yet</h2>
            <p className="mx-auto mt-3 max-w-2xl leading-8 text-cyan-50/90">
              Run the first passive scan to create a website trust report for this website.
            </p>

            <form action={startPassiveScan} className="mt-6">
              <input type="hidden" name="website_id" value={website.id} />
              <button
                type="submit"
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-cyan-300 px-6 py-4 font-bold text-slate-950 hover:bg-cyan-200"
              >
                <PlayCircle className="h-5 w-5" />
                Run first scan
              </button>
            </form>
          </section>
        )}

        {latestScan ? (
          <section className="mt-8 grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
            <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-8">
              <div className="mb-6 flex items-center gap-3">
                <BarChart3 className="h-7 w-7 text-cyan-300" />
                <h2 className="text-3xl font-black">Latest scan summary</h2>
              </div>

              <div className={`rounded-3xl border p-6 ${scoreClass(latestOverall)}`}>
                <p className="text-sm opacity-80">Latest overall score</p>
                <p className="mt-2 text-6xl font-black">{latestOverall}/100</p>
                <p className="mt-2 font-bold">{scoreLabel(latestOverall)}</p>
              </div>

              {scoreChange !== null ? (
                <div className="mt-5 rounded-3xl border border-white/10 bg-slate-950 p-6">
                  <p className="text-sm text-slate-400">Change from previous scan</p>
                  <p className={`mt-2 text-4xl font-black ${scoreChange >= 0 ? "text-emerald-300" : "text-red-300"}`}>
                    {scoreChange >= 0 ? "+" : ""}
                    {scoreChange}
                  </p>
                  <p className="mt-2 text-sm text-slate-500">
                    Previous score: {previousOverall}/100
                  </p>
                </div>
              ) : (
                <div className="mt-5 rounded-3xl border border-white/10 bg-slate-950 p-6">
                  <p className="text-sm text-slate-400">Comparison</p>
                  <p className="mt-2 text-slate-300">
                    Run one more scan later to see before-after progress.
                  </p>
                </div>
              )}

              <p className="mt-5 rounded-3xl border border-white/10 bg-slate-950 p-5 leading-8 text-slate-300">
                {latestScan.summary || "No summary available."}
              </p>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-8">
              <div className="mb-6 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <FileText className="h-7 w-7 text-cyan-300" />
                  <h2 className="text-3xl font-black">Scan history</h2>
                </div>
                <span className="rounded-full border border-white/10 px-3 py-1 text-sm font-bold text-slate-300">
                  {scanRows.length} scans
                </span>
              </div>

              <div className="grid gap-3">
                {scanRows.map((scan) => {
                  const score = safeScore(scan.overall_score);

                  return (
                    <Link
                      key={scan.id}
                      href={`/dashboard/scans/${scan.id}`}
                      className="rounded-2xl border border-white/10 bg-slate-950 p-4 transition hover:bg-white/[0.05]"
                    >
                      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                        <div>
                          <p className="font-bold text-white">
                            Report generated
                          </p>
                          <p className="mt-1 text-xs text-slate-500">
                            {formatDateTime(scan.created_at)}
                          </p>
                        </div>

                        <div className="flex items-center gap-3">
                          <span className={`rounded-full border px-3 py-1 text-xs font-bold ${scoreClass(score)}`}>
                            {score}/100
                          </span>
                          <span className="text-sm font-bold text-cyan-300">
                            Open
                          </span>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          </section>
        ) : null}
      </div>
    </main>
  );
}