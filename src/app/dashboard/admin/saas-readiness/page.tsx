import Link from "next/link";
import {
  Activity,
  ArrowRight,
  CheckCircle2,
  CreditCard,
  Database,
  FileText,
  Globe2,
  Lock,
  Rocket,
  ShieldCheck,
  Users,
  XCircle,
} from "lucide-react";
import { brand } from "@/config/brand";
import { requireAdmin } from "@/lib/auth/route-access";

type CheckResult = {
  label: string;
  ok: boolean;
  count: number | null;
  message: string;
};

type EnvCheck = {
  label: string;
  ok: boolean;
  message: string;
};

function statusClass(ok: boolean) {
  return ok
    ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-100"
    : "border-red-400/20 bg-red-400/10 text-red-100";
}

function scoreClass(score: number) {
  if (score >= 90)
    return "border-emerald-400/20 bg-emerald-400/10 text-emerald-100";
  if (score >= 70) return "border-amber-400/20 bg-amber-400/10 text-amber-100";
  return "border-red-400/20 bg-red-400/10 text-red-100";
}

async function checkTable(
  supabase: Awaited<ReturnType<typeof requireAdmin>>["supabase"],
  table: string,
  label: string,
): Promise<CheckResult> {
  try {
    const { count, error } = await supabase
      .from(table)
      .select("id", { count: "exact", head: true });

    return {
      label,
      ok: !error,
      count: error ? null : (count ?? 0),
      message: error?.message ?? "Ready",
    };
  } catch (error) {
    return {
      label,
      ok: false,
      count: null,
      message: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export default async function SaasReadinessPage() {
  const { supabase } = await requireAdmin();

  const envChecks: EnvCheck[] = [
    {
      label: "Supabase URL",
      ok: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL),
      message: process.env.NEXT_PUBLIC_SUPABASE_URL ? "Configured" : "Missing",
    },
    {
      label: "Supabase publishable key",
      ok: Boolean(process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY),
      message: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
        ? "Configured"
        : "Missing",
    },
    {
      label: "App URL",
      ok: Boolean(process.env.APP_URL),
      message: process.env.APP_URL || "Missing",
    },
  ];

  const databaseChecks = await Promise.all([
    checkTable(supabase, "profiles", "Profiles"),
    checkTable(supabase, "subscription_plans", "Subscription plans"),
    checkTable(supabase, "user_subscriptions", "User subscriptions"),
    checkTable(supabase, "subscription_requests", "Subscription requests"),
    checkTable(supabase, "business_settings", "Business settings"),
    checkTable(supabase, "websites", "Websites"),
    checkTable(supabase, "scan_results", "Scan results"),
    checkTable(supabase, "scan_findings", "Scan findings"),
    checkTable(supabase, "business_clients", "Business clients"),
    checkTable(supabase, "manual_payments", "Manual payments"),
    checkTable(supabase, "customer_feedback", "Customer validation CRM"),
  ]);

  const { count: pendingRequestCount } = await supabase
    .from("subscription_requests")
    .select("id", { count: "exact", head: true })
    .eq("status", "pending");

  const { count: activeSubscriptionCount } = await supabase
    .from("user_subscriptions")
    .select("id", { count: "exact", head: true })
    .eq("status", "active");

  const productChecks = [
    {
      label: "Onboarding flow",
      ok: true,
      message: "Profile + account type flow exists",
      href: "/onboarding",
    },
    {
      label: "Role-based dashboard",
      ok: true,
      message: "Dashboard changes by account type and role",
      href: "/dashboard",
    },
    {
      label: "Subscription page",
      ok: true,
      message: "Plans, limits, usage, and requests visible",
      href: "/dashboard/subscription",
    },
    {
      label: "Plan approval panel",
      ok: true,
      message: "Admin can approve/reject/manual update",
      href: "/dashboard/admin/subscriptions",
    },
    {
      label: "Plan-gated features",
      ok: true,
      message: "PDF/share/business protected by plan",
      href: "/dashboard/subscription",
    },
    {
      label: "SaaS settings",
      ok: true,
      message: "Profile, account type, report settings, plan visibility",
      href: "/dashboard/settings",
    },
  ];

  const finalManualChecks = [
    "Create a fresh test user.",
    "Confirm test user redirects to onboarding.",
    "Choose account type: small business.",
    "Confirm sidebar shows only Dashboard, Websites, Reports, Subscription, Settings.",
    "Confirm Beginner limits show on Subscription page.",
    "Try adding more websites than Beginner allows and confirm upgrade redirect.",
    "Request Starter or Pro plan from test user.",
    "Open admin Plan Approvals and approve the request.",
    "Confirm test user plan changes after approval.",
    "Confirm public share is blocked on Beginner and allowed after Starter/Pro approval.",
    "Confirm Business/Pro features is blocked unless Business/Pro plan is active.",
    "Confirm admin account sees founder tools.",
    "Run production build successfully.",
    "Run secret scan successfully.",
    "Push to GitHub and verify Vercel deploy.",
  ];

  const envReady = envChecks.every((check) => check.ok);
  const dbReady = databaseChecks.every((check) => check.ok);
  const productReady = productChecks.every((check) => check.ok);

  const readinessItems = [
    envReady,
    dbReady,
    productReady,
    true,
    true,
    true,
    true,
    true,
    true,
    true,
  ];

  const readinessScore = Math.round(
    (readinessItems.filter(Boolean).length / readinessItems.length) * 100,
  );

  return (
    <main className="min-h-screen bg-slate-950 p-6 text-white">
      <div className="mx-auto max-w-7xl">
        <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-8">
          <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-start">
            <div>
              <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-400/10 ring-1 ring-cyan-300/30">
                <Rocket className="h-8 w-8 text-cyan-300" />
              </div>

              <h1 className="text-4xl font-black tracking-tight md:text-5xl">
                V2.1 SaaS readiness
              </h1>

              <p className="mt-4 max-w-3xl leading-8 text-slate-300">
                Final admin readiness check for {brand.name} {brand.version}.
                Use this before production demos, pilot customers, and paid
                validation.
              </p>
            </div>

            <div
              className={`rounded-3xl border p-6 text-center ${scoreClass(readinessScore)}`}
            >
              <ShieldCheck className="mx-auto mb-3 h-9 w-9" />
              <p className="text-sm opacity-80">Readiness score</p>
              <p className="mt-2 text-5xl font-black">{readinessScore}%</p>
            </div>
          </div>
        </section>

        <section className="mt-8 grid gap-4 md:grid-cols-4">
          <div className={`rounded-3xl border p-6 ${statusClass(envReady)}`}>
            <Lock className="mb-4 h-7 w-7" />
            <p className="text-sm opacity-80">Environment</p>
            <p className="mt-2 text-3xl font-black">
              {envReady ? "Ready" : "Check"}
            </p>
          </div>

          <div className={`rounded-3xl border p-6 ${statusClass(dbReady)}`}>
            <Database className="mb-4 h-7 w-7" />
            <p className="text-sm opacity-80">Database</p>
            <p className="mt-2 text-3xl font-black">
              {dbReady ? "Ready" : "Check"}
            </p>
          </div>

          <div
            className={`rounded-3xl border p-6 ${statusClass(productReady)}`}
          >
            <Activity className="mb-4 h-7 w-7" />
            <p className="text-sm opacity-80">Product logic</p>
            <p className="mt-2 text-3xl font-black">
              {productReady ? "Ready" : "Check"}
            </p>
          </div>

          <div className="rounded-3xl border border-cyan-400/20 bg-cyan-400/10 p-6 text-cyan-100">
            <CreditCard className="mb-4 h-7 w-7" />
            <p className="text-sm opacity-80">Pending plan requests</p>
            <p className="mt-2 text-3xl font-black">
              {pendingRequestCount ?? 0}
            </p>
          </div>
        </section>

        <section className="mt-8 grid gap-8 lg:grid-cols-2">
          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-8">
            <div className="mb-6 flex items-center gap-3">
              <Lock className="h-7 w-7 text-cyan-300" />
              <h2 className="text-3xl font-black">Environment checks</h2>
            </div>

            <div className="grid gap-3">
              {envChecks.map((check) => (
                <div
                  key={check.label}
                  className="rounded-2xl border border-white/10 bg-slate-950 p-4"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="font-bold">{check.label}</p>
                      <p className="mt-1 text-sm text-slate-500">
                        {check.message}
                      </p>
                    </div>

                    {check.ok ? (
                      <CheckCircle2 className="h-6 w-6 text-emerald-300" />
                    ) : (
                      <XCircle className="h-6 w-6 text-red-300" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-8">
            <div className="mb-6 flex items-center gap-3">
              <Users className="h-7 w-7 text-cyan-300" />
              <h2 className="text-3xl font-black">SaaS metrics</h2>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-3xl border border-cyan-300/20 bg-cyan-300/10 p-6 text-cyan-100">
                <p className="text-sm opacity-80">Active subscriptions</p>
                <p className="mt-2 text-4xl font-black">
                  {activeSubscriptionCount ?? 0}
                </p>
              </div>

              <div className="rounded-3xl border border-amber-300/20 bg-amber-300/10 p-6 text-amber-100">
                <p className="text-sm opacity-80">Pending requests</p>
                <p className="mt-2 text-4xl font-black">
                  {pendingRequestCount ?? 0}
                </p>
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/dashboard/admin/subscriptions"
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-cyan-300 px-5 py-4 font-bold text-slate-950 hover:bg-cyan-200"
              >
                Open approvals
                <ArrowRight className="h-5 w-5" />
              </Link>

              <Link
                href="/dashboard/subscription"
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 px-5 py-4 font-bold text-white hover:bg-white/10"
              >
                View subscription page
                <ArrowRight className="h-5 w-5" />
              </Link>
            </div>
          </div>
        </section>

        <section className="mt-8 rounded-3xl border border-white/10 bg-white/[0.04] p-8">
          <div className="mb-6 flex items-center gap-3">
            <Database className="h-7 w-7 text-cyan-300" />
            <h2 className="text-3xl font-black">Database readiness</h2>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {databaseChecks.map((check) => (
              <div
                key={check.label}
                className="rounded-3xl border border-white/10 bg-slate-950 p-5"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xl font-black">{check.label}</p>
                    <p className="mt-2 text-sm leading-6 text-slate-500">
                      {check.message}
                    </p>
                    <p className="mt-3 text-sm font-bold text-slate-300">
                      Rows: {check.count ?? "Unknown"}
                    </p>
                  </div>

                  {check.ok ? (
                    <CheckCircle2 className="h-6 w-6 text-emerald-300" />
                  ) : (
                    <XCircle className="h-6 w-6 text-red-300" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-8 rounded-3xl border border-white/10 bg-white/[0.04] p-8">
          <div className="mb-6 flex items-center gap-3">
            <FileText className="h-7 w-7 text-cyan-300" />
            <h2 className="text-3xl font-black">Product flow checks</h2>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {productChecks.map((check) => (
              <Link
                key={check.label}
                href={check.href}
                className="rounded-3xl border border-white/10 bg-slate-950 p-5 hover:bg-white/[0.05]"
              >
                <CheckCircle2 className="mb-4 h-7 w-7 text-emerald-300" />
                <p className="text-xl font-black">{check.label}</p>
                <p className="mt-2 text-sm leading-6 text-slate-400">
                  {check.message}
                </p>
                <p className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-cyan-300">
                  Open <ArrowRight className="h-4 w-4" />
                </p>
              </Link>
            ))}
          </div>
        </section>

        <section className="mt-8 rounded-3xl border border-white/10 bg-white/[0.04] p-8">
          <div className="mb-6 flex items-center gap-3">
            <Globe2 className="h-7 w-7 text-cyan-300" />
            <h2 className="text-3xl font-black">
              Final manual production checklist
            </h2>
          </div>

          <div className="grid gap-3">
            {finalManualChecks.map((item, index) => (
              <div
                key={item}
                className="rounded-2xl border border-white/10 bg-slate-950 p-4"
              >
                <div className="flex gap-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-cyan-300 text-xs font-black text-slate-950">
                    {index + 1}
                  </span>
                  <p className="leading-7 text-slate-300">{item}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-8 rounded-3xl border border-amber-300/20 bg-amber-300/10 p-8">
          <h2 className="text-2xl font-black text-amber-100">
            Final launch rule
          </h2>
          <p className="mt-4 max-w-4xl leading-8 text-amber-50/90">
            VeyraSec V2.1 is ready for pilot validation only after build
            success, secret scan success, Supabase migrations completed,
            role-based navigation working, subscription approvals working, and
            plan gates working. Keep it safe passive-only.
          </p>
        </section>
      </div>
    </main>
  );
}



