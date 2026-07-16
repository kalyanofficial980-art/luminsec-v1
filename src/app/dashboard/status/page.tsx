import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Database,
  Globe2,
  Server,
  ShieldCheck,
  Settings,
  XCircle,
} from "lucide-react";
import { requireDashboardUser } from "@/lib/auth/route-access";
import {
  countToCheck,
  envCheck,
  overallHealth,
  safeCount,
  type HealthCheck,
  type HealthLevel,
} from "@/lib/status/system-health";

function levelClass(level: HealthLevel) {
  if (level === "healthy") {
    return "border-emerald-400/30 bg-emerald-400/10 text-emerald-100";
  }

  if (level === "warning") {
    return "border-amber-400/30 bg-amber-400/10 text-amber-100";
  }

  return "border-red-400/30 bg-red-400/10 text-red-100";
}

function levelIcon(level: HealthLevel) {
  if (level === "healthy") return CheckCircle2;
  if (level === "warning") return AlertTriangle;
  return XCircle;
}

function levelLabel(level: HealthLevel) {
  if (level === "healthy") return "Healthy";
  if (level === "warning") return "Warning";
  return "Error";
}

function HealthCard({ check }: { check: HealthCheck }) {
  const Icon = levelIcons[check.level];

  return (
    <article className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-black text-white">{check.name}</h3>
          <p className="mt-2 leading-7 text-slate-300">{check.message}</p>
          {check.detail ? (
            <p className="mt-3 rounded-2xl border border-white/10 bg-slate-950 p-3 font-mono text-xs leading-6 text-slate-400">
              {check.detail}
            </p>
          ) : null}
        </div>

        <span
          className={`inline-flex shrink-0 items-center gap-2 rounded-full border px-3 py-1 text-xs font-black ${levelClass(check.level)}`}
        >
          <Icon className="h-4 w-4" />
          {levelLabel(check.level)}
        </span>
      </div>
    </article>
  );
}

export default async function DashboardStatusPage() {
  const { supabase, user, profile } = await requireDashboardUser();
  const isAdmin = profile.role === "admin";

  const envChecks: HealthCheck[] = [
    envCheck("NEXT_PUBLIC_SUPABASE_URL", process.env.NEXT_PUBLIC_SUPABASE_URL),
    envCheck(
      "NEXT_PUBLIC_SUPABASE_ANON_KEY",
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    ),
    envCheck("NEXT_PUBLIC_APP_URL", process.env.NEXT_PUBLIC_APP_URL),
  ];

  const countResults = await Promise.all([
    safeCount(supabase, "profiles", "Profiles table"),
    safeCount(supabase, "websites", "Websites table", {
      userId: user.id,
      userScoped: !isAdmin,
    }),
    safeCount(supabase, "scan_results", "Scan results table", {
      userId: user.id,
      userScoped: !isAdmin,
    }),
    safeCount(supabase, "scan_findings", "Scan findings table", {
      userId: user.id,
      userScoped: !isAdmin,
    }),
    safeCount(supabase, "business_settings", "Business settings table"),
  ]);

  const databaseChecks = countResults.map(countToCheck);

  const checks = [...envChecks, ...databaseChecks];
  const currentHealth = overallHealth(checks);

  const healthyCount = checks.filter(
    (check) => check.level === "healthy",
  ).length;
  const warningCount = checks.filter(
    (check) => check.level === "warning",
  ).length;
  const errorCount = checks.filter((check) => check.level === "error").length;

  return (
    <main className="min-h-screen bg-slate-950 p-6 text-white">
      <div className="mx-auto max-w-7xl">
        <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-8">
          <div className="flex flex-col justify-between gap-8 xl:flex-row xl:items-start">
            <div>
              <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-3xl bg-cyan-400/10 ring-1 ring-cyan-300/30">
                <Server className="h-9 w-9 text-cyan-300" />
              </div>

              <p className="text-sm font-black uppercase tracking-[0.3em] text-cyan-300">
                Production status
              </p>

              <h1 className="mt-4 text-4xl font-black tracking-tight md:text-6xl">
                VeyraSec system health
              </h1>

              <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-300">
                This page checks core SaaS runtime configuration, Supabase
                database access, report tables, and optional business settings
                without exposing secrets.
              </p>
            </div>

            <div
              className={`rounded-3xl border p-6 text-center ${levelClass(currentHealth)}`}
            >
              <p className="text-sm font-black uppercase tracking-[0.2em]">
                Overall
              </p>
              <p className="mt-3 text-4xl font-black">
                {levelLabel(currentHealth)}
              </p>
              <p className="mt-3 text-sm opacity-80">
                {healthyCount} healthy / {warningCount} warning / {errorCount}{" "}
                error
              </p>
            </div>
          </div>
        </section>

        <section className="mt-8 grid gap-4 md:grid-cols-3">
          <div className="rounded-3xl border border-emerald-400/20 bg-emerald-400/10 p-6">
            <CheckCircle2 className="h-8 w-8 text-emerald-300" />
            <p className="mt-4 text-sm font-bold text-emerald-100/80">
              Healthy checks
            </p>
            <p className="mt-2 text-4xl font-black text-emerald-100">
              {healthyCount}
            </p>
          </div>

          <div className="rounded-3xl border border-amber-400/20 bg-amber-400/10 p-6">
            <AlertTriangle className="h-8 w-8 text-amber-300" />
            <p className="mt-4 text-sm font-bold text-amber-100/80">Warnings</p>
            <p className="mt-2 text-4xl font-black text-amber-100">
              {warningCount}
            </p>
          </div>

          <div className="rounded-3xl border border-red-400/20 bg-red-400/10 p-6">
            <XCircle className="h-8 w-8 text-red-300" />
            <p className="mt-4 text-sm font-bold text-red-100/80">Errors</p>
            <p className="mt-2 text-4xl font-black text-red-100">
              {errorCount}
            </p>
          </div>
        </section>

        <section className="mt-8">
          <div className="mb-5 flex items-center gap-3">
            <Settings className="h-7 w-7 text-cyan-300" />
            <h2 className="text-3xl font-black">Environment checks</h2>
          </div>

          <div className="grid gap-5 lg:grid-cols-3">
            {envChecks.map((check) => (
              <HealthCard key={check.name} check={check} />
            ))}
          </div>
        </section>

        <section className="mt-8">
          <div className="mb-5 flex items-center gap-3">
            <Database className="h-7 w-7 text-cyan-300" />
            <h2 className="text-3xl font-black">Database checks</h2>
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            {databaseChecks.map((check) => (
              <HealthCard key={check.name} check={check} />
            ))}
          </div>
        </section>

        <section className="mt-8 rounded-3xl border border-cyan-300/20 bg-cyan-300/10 p-8">
          <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
            <div>
              <div className="flex items-center gap-3">
                <ShieldCheck className="h-7 w-7 text-cyan-200" />
                <h2 className="text-2xl font-black text-cyan-100">
                  V3 report system
                </h2>
              </div>

              <p className="mt-4 max-w-3xl leading-8 text-cyan-50/90">
                Professional reports, action plans, print/PDF pages, public
                share reports, score explanations, and risk reasons are now part
                of the production health surface.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/dashboard/scans"
                className="inline-flex items-center gap-2 rounded-2xl bg-cyan-300 px-5 py-4 font-black text-slate-950 hover:bg-cyan-200"
              >
                Open reports
                <ArrowRight className="h-5 w-5" />
              </Link>

              <Link
                href="/api/health"
                className="inline-flex items-center gap-2 rounded-2xl border border-cyan-200/20 px-5 py-4 font-black text-cyan-50 hover:bg-cyan-200/10"
              >
                API health
                <Globe2 className="h-5 w-5" />
              </Link>
            </div>
          </div>
        </section>

        <section className="mt-8 rounded-3xl border border-amber-300/20 bg-amber-300/10 p-8">
          <h2 className="text-2xl font-black text-amber-100">
            Status logic rule
          </h2>
          <p className="mt-4 max-w-4xl leading-8 text-amber-50/90">
            Missing optional configuration should show a warning, not crash the
            customer dashboard. Only missing required environment variables or
            inaccessible core SaaS tables should be treated as errors.
          </p>
        </section>
      </div>
    </main>
  );
}
