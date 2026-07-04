import Link from "next/link";
import { redirect } from "next/navigation";
import { FileText, Globe2, LogOut, Plus, ShieldCheck } from "lucide-react";
import { brand } from "@/config/brand";
import { createClient } from "@/lib/supabase/server";
import { logout } from "./actions";
import { formatDateTime, getRiskBadgeClass, getRiskLabel } from "@/lib/utils/risk";

export default async function AppDashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { count: websiteCount } = await supabase
    .from("websites")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id);

  const { count: scanCount } = await supabase
    .from("scan_jobs")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id);

  const { data: latestWebsites } = await supabase
    .from("websites")
    .select("id, url, domain, label, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(5);

  const { data: latestScans } = await supabase
    .from("scan_results")
    .select(`
      id,
      overall_score,
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
    .order("created_at", { ascending: false })
    .limit(5);

  const averageScore =
    latestScans && latestScans.length > 0
      ? Math.round(
          latestScans.reduce((total, scan) => total + Number(scan.overall_score ?? 0), 0) /
            latestScans.length
        )
      : null;

  return (
    <main className="min-h-screen bg-slate-950 p-6 text-white">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-400/10 ring-1 ring-cyan-300/30">
              <ShieldCheck className="h-6 w-6 text-cyan-300" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">{brand.name} Dashboard</h1>
              <p className="text-slate-400">Logged in as {user.email}</p>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              href="/app/websites/new"
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-cyan-300 px-4 py-3 text-sm font-bold text-slate-950 hover:bg-cyan-200"
            >
              <Plus className="h-4 w-4" />
              Add Website
            </Link>

            <form action={logout}>
              <button
                type="submit"
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-white/10 px-4 py-3 text-sm font-semibold text-white hover:bg-white/10"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </button>
            </form>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Link
            href="/app/websites"
            className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 transition hover:bg-white/[0.07]"
          >
            <p className="text-sm text-slate-400">Websites</p>
            <p className="mt-2 text-4xl font-black">{websiteCount ?? 0}</p>
          </Link>

          <Link
            href="/app/scans"
            className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 transition hover:bg-white/[0.07]"
          >
            <p className="text-sm text-slate-400">Scans</p>
            <p className="mt-2 text-4xl font-black">{scanCount ?? 0}</p>
          </Link>

          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
            <p className="text-sm text-slate-400">Average latest score</p>
            <p className="mt-2 text-4xl font-black">{averageScore ?? "--"}</p>
          </div>
        </div>

        <div className="mt-6 rounded-3xl border border-cyan-300/20 bg-cyan-300/10 p-6">
          <h2 className="text-xl font-bold text-cyan-100">Part 5 active</h2>
          <p className="mt-2 text-cyan-50/80">
            Scan history and latest reports are now part of the V1 dashboard.
          </p>
        </div>

        <section className="mt-8">
          <div className="mb-4 flex items-center justify-between gap-4">
            <h2 className="text-2xl font-bold">Latest scan reports</h2>
            <Link href="/app/scans" className="text-sm font-semibold text-cyan-300 hover:text-cyan-200">
              View all
            </Link>
          </div>

          {!latestScans || latestScans.length === 0 ? (
            <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-8 text-center">
              <FileText className="mx-auto mb-4 h-10 w-10 text-cyan-300" />
              <h3 className="text-xl font-bold">No scan reports yet</h3>
              <p className="mt-2 text-slate-400">Run a passive scan from your websites page.</p>
              <Link
                href="/app/websites"
                className="mt-5 inline-flex items-center justify-center gap-2 rounded-2xl bg-cyan-300 px-5 py-3 font-bold text-slate-950 hover:bg-cyan-200"
              >
                Go to websites
              </Link>
            </div>
          ) : (
            <div className="grid gap-4">
              {latestScans.map((scan) => {
                const website = Array.isArray(scan.websites)
                  ? scan.websites[0]
                  : scan.websites;

                return (
                  <Link
                    key={scan.id}
                    href={`/app/scans/${scan.id}`}
                    className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 transition hover:bg-white/[0.07]"
                  >
                    <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
                      <div className="flex items-start gap-3">
                        <FileText className="mt-1 h-5 w-5 text-cyan-300" />
                        <div>
                          <p className="font-bold">{website?.label || website?.domain || "Website"}</p>
                          <p className="break-all text-sm text-slate-400">{website?.url}</p>
                          <p className="mt-1 text-xs text-slate-500">
                            {formatDateTime(scan.created_at)}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="text-2xl font-black">{scan.overall_score}</span>
                        <span
                          className={`rounded-full border px-3 py-1 text-xs font-bold ${getRiskBadgeClass(
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
        </section>

        <section className="mt-8">
          <div className="mb-4 flex items-center justify-between gap-4">
            <h2 className="text-2xl font-bold">Latest websites</h2>
            <Link href="/app/websites" className="text-sm font-semibold text-cyan-300 hover:text-cyan-200">
              View all
            </Link>
          </div>

          {!latestWebsites || latestWebsites.length === 0 ? (
            <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-8 text-center">
              <Globe2 className="mx-auto mb-4 h-10 w-10 text-cyan-300" />
              <h3 className="text-xl font-bold">No websites added yet</h3>
              <p className="mt-2 text-slate-400">Add your first website to begin VeyraSec V1 workflow.</p>
              <Link
                href="/app/websites/new"
                className="mt-5 inline-flex items-center justify-center gap-2 rounded-2xl bg-cyan-300 px-5 py-3 font-bold text-slate-950 hover:bg-cyan-200"
              >
                <Plus className="h-5 w-5" />
                Add website
              </Link>
            </div>
          ) : (
            <div className="grid gap-4">
              {latestWebsites.map((website) => (
                <Link
                  key={website.id}
                  href="/app/websites"
                  className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 transition hover:bg-white/[0.07]"
                >
                  <div className="flex items-start gap-3">
                    <Globe2 className="mt-1 h-5 w-5 text-cyan-300" />
                    <div>
                      <p className="font-bold">{website.label || website.domain}</p>
                      <p className="break-all text-sm text-slate-400">{website.url}</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
