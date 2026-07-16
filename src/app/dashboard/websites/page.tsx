import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowRight,
  BarChart3,
  ExternalLink,
  FileText,
  Globe2,
  Plus,
  ShieldCheck,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { formatDateTime } from "@/lib/utils/risk";
import { startPassiveScan } from "./actions";

function scoreClass(score: number) {
  if (score >= 80)
    return "border-emerald-400/20 bg-emerald-400/10 text-emerald-100";
  if (score >= 60) return "border-amber-400/20 bg-amber-400/10 text-amber-100";
  return "border-red-400/20 bg-red-400/10 text-red-100";
}

export default async function WebsitesPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: websites } = await supabase
    .from("websites")
    .select("id, name, url, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const websiteRows = websites ?? [];
  const websiteIds = websiteRows.map((website) => website.id);

  const { data: scans } =
    websiteIds.length > 0
      ? await supabase
          .from("scan_results")
          .select("id, website_id, overall_score, created_at")
          .eq("user_id", user.id)
          .in("website_id", websiteIds)
          .order("created_at", { ascending: false })
      : { data: [] };

  const latestScanByWebsite = new Map<string, unknown>();

  for (const scan of scans ?? []) {
    if (!latestScanByWebsite.has(scan.website_id)) {
      latestScanByWebsite.set(scan.website_id, scan);
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 p-6 text-white">
      <div className="mx-auto max-w-7xl">
        <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-8">
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-start">
            <div>
              <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-400/10 ring-1 ring-cyan-300/30">
                <Globe2 className="h-8 w-8 text-cyan-300" />
              </div>

              <h1 className="text-4xl font-black tracking-tight md:text-5xl">
                Websites
              </h1>
              <p className="mt-4 max-w-3xl leading-8 text-slate-300">
                Manage websites, open website workspaces, and run safe passive
                trust reports.
              </p>
            </div>

            <Link
              href="/dashboard/websites/new"
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-cyan-300 px-5 py-4 font-bold text-slate-950 hover:bg-cyan-200"
            >
              <Plus className="h-5 w-5" />
              Add website
            </Link>
          </div>
        </section>

        {websiteRows.length === 0 ? (
          <section className="mt-8 rounded-3xl border border-cyan-300/20 bg-cyan-300/10 p-8 text-center">
            <ShieldCheck className="mx-auto mb-4 h-12 w-12 text-cyan-300" />
            <h2 className="text-3xl font-black text-cyan-100">
              No websites yet
            </h2>
            <p className="mx-auto mt-3 max-w-2xl leading-8 text-cyan-50/90">
              Add your first customer or demo website to generate a VeyraSec
              trust report.
            </p>

            <Link
              href="/dashboard/websites/new"
              className="mt-6 inline-flex items-center justify-center gap-2 rounded-2xl bg-cyan-300 px-6 py-4 font-bold text-slate-950 hover:bg-cyan-200"
            >
              <Plus className="h-5 w-5" />
              Add first website
            </Link>
          </section>
        ) : (
          <section className="mt-8 grid gap-5">
            {websiteRows.map((website) => {
              const latestScan = latestScanByWebsite.get(website.id);
              const latestScore = Number(latestScan?.overall_score ?? 0);

              return (
                <div
                  key={website.id}
                  className="rounded-3xl border border-white/10 bg-white/[0.04] p-6"
                >
                  <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-center">
                    <div>
                      <Link
                        href={`/dashboard/websites/${website.id}`}
                        className="group inline-flex items-center gap-3"
                      >
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-400/10 ring-1 ring-cyan-300/30">
                          <Globe2 className="h-6 w-6 text-cyan-300" />
                        </div>

                        <div>
                          <h2 className="break-all text-2xl font-black group-hover:text-cyan-300">
                            {website.name || website.url}
                          </h2>
                          <p className="mt-1 break-all text-sm text-slate-400">
                            {website.url}
                          </p>
                        </div>
                      </Link>

                      <p className="mt-4 text-sm text-slate-500">
                        Added {formatDateTime(website.created_at)}
                      </p>
                    </div>

                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                      {latestScan ? (
                        <Link
                          href={`/dashboard/scans/${latestScan.id}`}
                          className={`inline-flex items-center justify-center gap-2 rounded-2xl border px-4 py-3 text-sm font-bold ${scoreClass(latestScore)}`}
                        >
                          <BarChart3 className="h-4 w-4" />
                          {latestScore}/100 latest score
                        </Link>
                      ) : (
                        <span className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-400/20 bg-slate-400/10 px-4 py-3 text-sm font-bold text-slate-200">
                          <FileText className="h-4 w-4" />
                          No scan yet
                        </span>
                      )}

                      <form action={startPassiveScan}>
                        <input
                          type="hidden"
                          name="website_id"
                          value={website.id}
                        />
                        <button
                          type="submit"
                          className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-cyan-300 px-4 py-3 text-sm font-bold text-slate-950 hover:bg-cyan-200"
                        >
                          Run scan
                        </button>
                      </form>

                      <Link
                        href={`/dashboard/websites/${website.id}`}
                        className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 px-4 py-3 text-sm font-bold text-white hover:bg-white/10"
                      >
                        Open
                        <ArrowRight className="h-4 w-4" />
                      </Link>

                      <a
                        href={website.url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 px-4 py-3 text-sm font-bold text-white hover:bg-white/10"
                      >
                        Visit
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </div>
                  </div>
                </div>
              );
            })}
          </section>
        )}
      </div>
    </main>
  );
}
