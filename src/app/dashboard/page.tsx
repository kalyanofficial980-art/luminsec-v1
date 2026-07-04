import Link from "next/link";
import { redirect } from "next/navigation";
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  Building2,
  CheckCircle2,
  ClipboardList,
  FileText,
  Globe2,
  Plus,
  Rocket,
  ShieldCheck,
  Target,
  TrendingUp,
  Users,
} from "lucide-react";
import { brand } from "@/config/brand";
import { createClient } from "@/lib/supabase/server";
import { formatDateTime } from "@/lib/utils/risk";

function average(numbers: number[]) {
  if (numbers.length === 0) return 0;
  return Math.round(numbers.reduce((total, value) => total + value, 0) / numbers.length);
}

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

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const [
    websitesResponse,
    scansResponse,
    validationResponse,
    settingsResponse,
  ] = await Promise.all([
    supabase
      .from("websites")
      .select("id, name, url, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),

    supabase
      .from("scan_results")
      .select("id, website_id, overall_score, security_score, privacy_score, trust_score, risk_level, summary, created_at, websites(name, url)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(8),

    supabase
      .from("customer_feedback")
      .select("id, business_name, website_url, status, is_paid_pilot, next_step, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(8),

    supabase
      .from("business_settings")
      .select("business_name, owner_name")
      .eq("user_id", user.id)
      .maybeSingle(),
  ]);

  const websites = websitesResponse.data ?? [];
  const scans = scansResponse.data ?? [];
  const validationRows = validationResponse.data ?? [];
  const settings = settingsResponse.data;

  const totalWebsites = websites.length;
  const totalScans = scans.length;
  const scores = scans
    .map((scan) => Number(scan.overall_score ?? 0))
    .filter((score) => score > 0);

  const avgScore = average(scores);
  const latestScan = scans[0];
  const needsAttention = scans.filter((scan) => Number(scan.overall_score ?? 0) < 60).length;
  const validationCount = validationRows.length;
  const paidPilots = validationRows.filter((row) => row.is_paid_pilot).length;
  const demoOrReplyCount = validationRows.filter((row) =>
    ["replied", "demo_booked", "feedback_received", "paid_pilot"].includes(String(row.status))
  ).length;

  const quickStats = [
    {
      label: "Websites",
      value: totalWebsites,
      helper: "Tracked websites",
      icon: Globe2,
      href: "/dashboard/websites",
    },
    {
      label: "Scans",
      value: totalScans,
      helper: "Recent reports",
      icon: FileText,
      href: "/dashboard/scans",
    },
    {
      label: "Average score",
      value: avgScore > 0 ? `${avgScore}/100` : "0/100",
      helper: avgScore > 0 ? scoreLabel(avgScore) : "No scans yet",
      icon: BarChart3,
      href: "/dashboard/scans",
    },
    {
      label: "Paid pilots",
      value: paidPilots,
      helper: "Manual paid pilots",
      icon: Rocket,
      href: "/dashboard/validation",
    },
  ];

  const actions = [
    {
      title: "Add website",
      text: "Add a customer or demo website and run a safe passive scan.",
      href: "/dashboard/websites/new",
      icon: Plus,
    },
    {
      title: "View scan reports",
      text: "Open latest reports, PDF pages, and language modes.",
      href: "/dashboard/scans",
      icon: FileText,
    },
    {
      title: "Track customers",
      text: "Record leads, feedback, objections, demos, and pilots.",
      href: "/dashboard/validation",
      icon: Target,
    },
    {
      title: "Update settings",
      text: "Add business details that appear inside reports.",
      href: "/dashboard/settings",
      icon: Building2,
    },
  ];

  return (
    <main className="min-h-screen bg-slate-950 p-6 text-white">
      <div className="mx-auto max-w-7xl">
        <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-8">
          <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-start">
            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/10 px-4 py-2 text-sm font-semibold text-cyan-100">
                <ShieldCheck className="h-4 w-4" />
                {brand.name} {brand.version}
              </div>

              <h1 className="text-4xl font-black tracking-tight md:text-5xl">
                SaaS command center
              </h1>

              <p className="mt-4 max-w-3xl leading-8 text-slate-300">
                Track websites, reports, customer validation, and paid pilot progress from one dashboard.
              </p>

              <p className="mt-3 text-sm text-slate-500">
                Signed in as {user.email}
              </p>
            </div>

            <div className="rounded-3xl border border-cyan-300/20 bg-cyan-300/10 p-6 lg:min-w-80">
              <p className="text-sm font-bold text-cyan-100">Workspace profile</p>
              <p className="mt-3 text-2xl font-black text-white">
                {settings?.business_name || "Business not added"}
              </p>
              <p className="mt-1 text-sm text-cyan-50/80">
                {settings?.owner_name || "Add your details in settings"}
              </p>

              <Link
                href="/dashboard/settings"
                className="mt-5 inline-flex items-center gap-2 rounded-2xl border border-cyan-300/20 px-4 py-3 text-sm font-bold text-cyan-100 hover:bg-cyan-300/10"
              >
                Open settings
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>

        <section className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {quickStats.map((stat) => {
            const Icon = stat.icon;

            return (
              <Link
                key={stat.label}
                href={stat.href}
                className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 transition hover:bg-white/[0.07]"
              >
                <div className="mb-5 flex items-center justify-between gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-400/10 ring-1 ring-cyan-300/30">
                    <Icon className="h-6 w-6 text-cyan-300" />
                  </div>
                  <ArrowRight className="h-5 w-5 text-slate-500" />
                </div>

                <p className="text-sm text-slate-400">{stat.label}</p>
                <p className="mt-2 text-4xl font-black">{stat.value}</p>
                <p className="mt-2 text-sm text-slate-500">{stat.helper}</p>
              </Link>
            );
          })}
        </section>

        <section className="mt-8 grid gap-8 xl:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-8">
            <div className="mb-6 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <TrendingUp className="h-7 w-7 text-cyan-300" />
                <h2 className="text-3xl font-black">V2 progress snapshot</h2>
              </div>

              <Link
                href="/dashboard/scans"
                className="hidden rounded-2xl border border-white/10 px-4 py-3 text-sm font-bold text-slate-300 hover:bg-white/10 hover:text-white sm:inline-flex"
              >
                All reports
              </Link>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className={`rounded-3xl border p-6 ${scoreClass(avgScore)}`}>
                <p className="text-sm opacity-80">Average readiness</p>
                <p className="mt-2 text-4xl font-black">{avgScore}/100</p>
                <p className="mt-2 text-sm font-bold">{scoreLabel(avgScore)}</p>
              </div>

              <div className="rounded-3xl border border-amber-400/20 bg-amber-400/10 p-6 text-amber-100">
                <p className="text-sm opacity-80">Needs attention</p>
                <p className="mt-2 text-4xl font-black">{needsAttention}</p>
                <p className="mt-2 text-sm font-bold">Low-score reports</p>
              </div>

              <div className="rounded-3xl border border-cyan-400/20 bg-cyan-400/10 p-6 text-cyan-100">
                <p className="text-sm opacity-80">Customer replies</p>
                <p className="mt-2 text-4xl font-black">{demoOrReplyCount}</p>
                <p className="mt-2 text-sm font-bold">Validation activity</p>
              </div>
            </div>

            {latestScan ? (
              <div className="mt-6 rounded-3xl border border-white/10 bg-slate-950 p-6">
                <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
                  <div>
                    <p className="text-sm text-slate-500">Latest scan</p>
                    <h3 className="mt-1 break-all text-2xl font-black">
                      {getWebsiteUrl(latestScan.websites)}
                    </h3>
                    <p className="mt-2 text-sm text-slate-500">
                      {formatDateTime(latestScan.created_at)}
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className={`rounded-full border px-4 py-2 text-sm font-bold ${scoreClass(Number(latestScan.overall_score ?? 0))}`}>
                      {Number(latestScan.overall_score ?? 0)}/100
                    </span>
                    <Link
                      href={`/dashboard/scans/${latestScan.id}`}
                      className="rounded-2xl bg-cyan-300 px-4 py-3 text-sm font-bold text-slate-950 hover:bg-cyan-200"
                    >
                      Open report
                    </Link>
                  </div>
                </div>
              </div>
            ) : (
              <div className="mt-6 rounded-3xl border border-white/10 bg-slate-950 p-8 text-center">
                <AlertTriangle className="mx-auto mb-4 h-10 w-10 text-cyan-300" />
                <h3 className="text-xl font-black">No scans yet</h3>
                <p className="mt-2 text-slate-400">
                  Add your first website and run a passive trust check.
                </p>
                <Link
                  href="/dashboard/websites/new"
                  className="mt-5 inline-flex items-center justify-center rounded-2xl bg-cyan-300 px-5 py-3 font-bold text-slate-950 hover:bg-cyan-200"
                >
                  Add first website
                </Link>
              </div>
            )}
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-8">
            <div className="mb-6 flex items-center gap-3">
              <ClipboardList className="h-7 w-7 text-cyan-300" />
              <h2 className="text-3xl font-black">Quick actions</h2>
            </div>

            <div className="grid gap-4">
              {actions.map((action) => {
                const Icon = action.icon;

                return (
                  <Link
                    key={action.title}
                    href={action.href}
                    className="rounded-3xl border border-white/10 bg-slate-950 p-5 transition hover:bg-white/[0.05]"
                  >
                    <div className="flex gap-4">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-cyan-400/10 ring-1 ring-cyan-300/30">
                        <Icon className="h-5 w-5 text-cyan-300" />
                      </div>
                      <div>
                        <h3 className="font-black">{action.title}</h3>
                        <p className="mt-1 text-sm leading-6 text-slate-400">{action.text}</p>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>

        <section className="mt-8 grid gap-8 xl:grid-cols-2">
          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-8">
            <div className="mb-6 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <FileText className="h-7 w-7 text-cyan-300" />
                <h2 className="text-3xl font-black">Recent reports</h2>
              </div>
              <Link href="/dashboard/scans" className="text-sm font-bold text-cyan-300 hover:text-cyan-200">
                View all
              </Link>
            </div>

            {scans.length === 0 ? (
              <div className="rounded-3xl border border-white/10 bg-slate-950 p-8 text-center">
                <FileText className="mx-auto mb-4 h-10 w-10 text-cyan-300" />
                <h3 className="text-xl font-black">No reports yet</h3>
                <p className="mt-2 text-slate-400">Run a scan to create your first report.</p>
              </div>
            ) : (
              <div className="grid gap-3">
                {scans.slice(0, 5).map((scan) => (
                  <Link
                    key={scan.id}
                    href={`/dashboard/scans/${scan.id}`}
                    className="rounded-2xl border border-white/10 bg-slate-950 p-4 transition hover:bg-white/[0.05]"
                  >
                    <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                      <div>
                        <p className="break-all font-bold text-white">
                          {getWebsiteUrl(scan.websites)}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          {formatDateTime(scan.created_at)}
                        </p>
                      </div>

                      <span className={`w-fit rounded-full border px-3 py-1 text-xs font-bold ${scoreClass(Number(scan.overall_score ?? 0))}`}>
                        {Number(scan.overall_score ?? 0)}/100
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-8">
            <div className="mb-6 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Users className="h-7 w-7 text-cyan-300" />
                <h2 className="text-3xl font-black">Customer validation</h2>
              </div>
              <Link href="/dashboard/validation" className="text-sm font-bold text-cyan-300 hover:text-cyan-200">
                View CRM
              </Link>
            </div>

            {validationRows.length === 0 ? (
              <div className="rounded-3xl border border-white/10 bg-slate-950 p-8 text-center">
                <Users className="mx-auto mb-4 h-10 w-10 text-cyan-300" />
                <h3 className="text-xl font-black">No validation notes yet</h3>
                <p className="mt-2 text-slate-400">Add leads after your first customer outreach.</p>
              </div>
            ) : (
              <div className="grid gap-3">
                {validationRows.slice(0, 5).map((row) => (
                  <Link
                    key={row.id}
                    href="/dashboard/validation"
                    className="rounded-2xl border border-white/10 bg-slate-950 p-4 transition hover:bg-white/[0.05]"
                  >
                    <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                      <div>
                        <p className="font-bold text-white">{row.business_name}</p>
                        <p className="mt-1 break-all text-xs text-slate-500">
                          {row.website_url || "No website added"}
                        </p>
                        {row.next_step ? (
                          <p className="mt-2 text-sm text-slate-400">
                            Next: {row.next_step}
                          </p>
                        ) : null}
                      </div>

                      <span className="w-fit rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-xs font-bold text-cyan-100">
                        {row.is_paid_pilot ? "Paid pilot" : row.status}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </section>

        <section className="mt-8 rounded-3xl border border-cyan-300/20 bg-cyan-300/10 p-8">
          <div className="flex flex-col justify-between gap-5 md:flex-row md:items-center">
            <div>
              <h2 className="text-3xl font-black text-cyan-100">Next V2 goal</h2>
              <p className="mt-3 max-w-3xl leading-8 text-cyan-50/90">
                Add 10 real websites or leads, run useful reports, and use customer feedback
                to improve VeyraSec before adding payment gateway or paid AI.
              </p>
            </div>

            <Link
              href="/outreach"
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-cyan-300 px-5 py-4 font-bold text-slate-950 hover:bg-cyan-200"
            >
              Start outreach
              <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}