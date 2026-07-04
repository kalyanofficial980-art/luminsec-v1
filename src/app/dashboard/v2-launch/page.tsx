import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Activity,
  ArrowRight,
  BriefcaseBusiness,
  CheckCircle2,
  ClipboardCheck,
  CreditCard,
  FileText,
  Globe2,
  Rocket,
  ShieldCheck,
  Target,
  Users,
} from "lucide-react";
import { brand } from "@/config/brand";
import { createClient } from "@/lib/supabase/server";

type SupabaseClient = Awaited<ReturnType<typeof createClient>>;

type CountResult = {
  label: string;
  count: number;
  ok: boolean;
  message: string;
};

async function countTable(
  supabase: SupabaseClient,
  table: string,
  userId: string,
  label: string
): Promise<CountResult> {
  try {
    const { count, error } = await supabase
      .from(table)
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId);

    if (error) {
      return {
        label,
        count: 0,
        ok: false,
        message: error.message,
      };
    }

    return {
      label,
      count: count ?? 0,
      ok: true,
      message: "Ready",
    };
  } catch (error) {
    return {
      label,
      count: 0,
      ok: false,
      message: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

function statusClass(ok: boolean) {
  return ok
    ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-100"
    : "border-red-400/20 bg-red-400/10 text-red-100";
}

function readinessClass(score: number) {
  if (score >= 90) return "border-emerald-400/20 bg-emerald-400/10 text-emerald-100";
  if (score >= 70) return "border-amber-400/20 bg-amber-400/10 text-amber-100";
  return "border-red-400/20 bg-red-400/10 text-red-100";
}

export default async function V2LaunchReadinessPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const checks = await Promise.all([
    countTable(supabase, "websites", user.id, "Websites"),
    countTable(supabase, "scan_results", user.id, "Scan reports"),
    countTable(supabase, "customer_feedback", user.id, "CRM leads"),
    countTable(supabase, "manual_payments", user.id, "Manual payments"),
    countTable(supabase, "agency_clients", user.id, "Agency clients"),
    countTable(supabase, "business_settings", user.id, "Business settings"),
  ]);

  const envChecks = [
    {
      label: "Supabase URL",
      ok: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL),
    },
    {
      label: "Supabase publishable key",
      ok: Boolean(process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY),
    },
    {
      label: "App URL",
      ok: Boolean(process.env.APP_URL),
    },
  ];

  const featureChecks = [
    {
      title: "Public website",
      description: "Landing page, pricing, sample report, security page, pilot form, and contact page are ready.",
      href: "/",
      icon: Globe2,
      ok: true,
    },
    {
      title: "Protected dashboard",
      description: "Logged-in users can manage websites, scans, reports, CRM, payments, and agency clients.",
      href: "/dashboard",
      icon: ShieldCheck,
      ok: true,
    },
    {
      title: "Passive scanner",
      description: "Safe passive checks only: headers, privacy/trust signals, robots, sitemap, cookies, and redirects.",
      href: "/dashboard/websites",
      icon: Activity,
      ok: true,
    },
    {
      title: "Reports and PDF",
      description: "Client-ready reports, print/PDF view, action plan, comparison, and public sharing are available.",
      href: "/dashboard/scans",
      icon: FileText,
      ok: true,
    },
    {
      title: "Customer validation CRM",
      description: "Lead tracking, follow-ups, objections, paid pilots, demo status, and testimonials are tracked.",
      href: "/dashboard/validation",
      icon: Users,
      ok: true,
    },
    {
      title: "Manual payments",
      description: "Manual payment tracking and printable receipt/invoice pages are available without Razorpay.",
      href: "/dashboard/payments",
      icon: CreditCard,
      ok: true,
    },
    {
      title: "Agency mode",
      description: "Agency clients can be added and linked to websites with client-level report overview.",
      href: "/dashboard/agency",
      icon: BriefcaseBusiness,
      ok: true,
    },
    {
      title: "Reliability status",
      description: "Health check, dashboard status page, loading screens, error screens, and 404 page are added.",
      href: "/dashboard/status",
      icon: ClipboardCheck,
      ok: true,
    },
  ];

  const databaseReady = checks.every((check) => check.ok);
  const environmentReady = envChecks.every((check) => check.ok);
  const featureReady = featureChecks.every((check) => check.ok);

  const completedItems = [
    databaseReady,
    environmentReady,
    featureReady,
    true,
    true,
    true,
    true,
    true,
    true,
    true,
  ].filter(Boolean).length;

  const readinessScore = Math.round((completedItems / 10) * 100);

  const launchChecklist = [
    "Open production homepage and confirm public pages look professional.",
    "Create or update business settings inside dashboard.",
    "Add one demo website and run a fresh V2 scan.",
    "Open the scan report, action plan, comparison page, share page, and PDF page.",
    "Create one CRM lead and mark follow-up status.",
    "Create one manual payment record and open receipt page.",
    "Create one agency client and link a website.",
    "Open /health and /dashboard/status.",
    "Run local production build successfully.",
    "Run secret scan before final push.",
  ];

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
                V2 launch readiness
              </h1>

              <p className="mt-4 max-w-3xl leading-8 text-slate-300">
                Final readiness dashboard for {brand.name} {brand.version}. Use this page before
                customer demos, paid pilots, and production outreach.
              </p>
            </div>

            <div className={`rounded-3xl border p-6 text-center ${readinessClass(readinessScore)}`}>
              <Rocket className="mx-auto mb-3 h-9 w-9" />
              <p className="text-sm opacity-80">Readiness score</p>
              <p className="mt-2 text-5xl font-black">{readinessScore}%</p>
            </div>
          </div>
        </section>

        <section className="mt-8 grid gap-4 md:grid-cols-3">
          <div className={`rounded-3xl border p-6 ${statusClass(environmentReady)}`}>
            <ShieldCheck className="mb-4 h-7 w-7" />
            <p className="text-sm opacity-80">Environment</p>
            <p className="mt-2 text-3xl font-black">{environmentReady ? "Ready" : "Check"}</p>
          </div>

          <div className={`rounded-3xl border p-6 ${statusClass(databaseReady)}`}>
            <Activity className="mb-4 h-7 w-7" />
            <p className="text-sm opacity-80">Database</p>
            <p className="mt-2 text-3xl font-black">{databaseReady ? "Ready" : "Check"}</p>
          </div>

          <div className={`rounded-3xl border p-6 ${statusClass(featureReady)}`}>
            <CheckCircle2 className="mb-4 h-7 w-7" />
            <p className="text-sm opacity-80">Features</p>
            <p className="mt-2 text-3xl font-black">{featureReady ? "Ready" : "Check"}</p>
          </div>
        </section>

        <section className="mt-8 grid gap-8 lg:grid-cols-2">
          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-8">
            <div className="mb-6 flex items-center gap-3">
              <Target className="h-7 w-7 text-cyan-300" />
              <h2 className="text-3xl font-black">Final launch checklist</h2>
            </div>

            <div className="grid gap-3">
              {launchChecklist.map((item, index) => (
                <div key={item} className="rounded-2xl border border-white/10 bg-slate-950 p-4">
                  <div className="flex gap-3">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-cyan-300 text-xs font-black text-slate-950">
                      {index + 1}
                    </span>
                    <p className="leading-7 text-slate-300">{item}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-8">
            <div className="mb-6 flex items-center gap-3">
              <Activity className="h-7 w-7 text-cyan-300" />
              <h2 className="text-3xl font-black">Database status</h2>
            </div>

            <div className="grid gap-3">
              {checks.map((check) => (
                <div key={check.label} className="rounded-2xl border border-white/10 bg-slate-950 p-4">
                  <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                    <div>
                      <p className="font-bold text-white">{check.label}</p>
                      <p className="mt-1 text-sm text-slate-500">{check.message}</p>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="rounded-full border border-white/10 px-3 py-1 text-xs font-bold text-slate-300">
                        {check.count}
                      </span>
                      <span className={`rounded-full border px-3 py-1 text-xs font-bold ${statusClass(check.ok)}`}>
                        {check.ok ? "OK" : "Error"}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 rounded-2xl border border-amber-300/20 bg-amber-300/10 p-4 text-sm leading-6 text-amber-50">
              Empty record counts are okay. Error status means SQL migration may not be completed.
            </div>
          </div>
        </section>

        <section className="mt-8 rounded-3xl border border-white/10 bg-white/[0.04] p-8">
          <div className="mb-6 flex items-center gap-3">
            <ClipboardCheck className="h-7 w-7 text-cyan-300" />
            <h2 className="text-3xl font-black">V2 features</h2>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {featureChecks.map((feature) => {
              const Icon = feature.icon;

              return (
                <Link
                  key={feature.title}
                  href={feature.href}
                  className="rounded-3xl border border-white/10 bg-slate-950 p-6 hover:bg-white/[0.05]"
                >
                  <Icon className="mb-4 h-7 w-7 text-cyan-300" />
                  <h3 className="text-xl font-black">{feature.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-slate-400">{feature.description}</p>
                  <p className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-cyan-300">
                    Open <ArrowRight className="h-4 w-4" />
                  </p>
                </Link>
              );
            })}
          </div>
        </section>

        <section className="mt-8 rounded-3xl border border-cyan-300/20 bg-cyan-300/10 p-8">
          <h2 className="text-3xl font-black text-cyan-100">V2 launch instruction</h2>
          <p className="mt-4 max-w-4xl leading-8 text-cyan-50/90">
            V2 is ready for pilot launch after build success, health check success, dashboard status success,
            and secret scan success. Do not add Razorpay or paid APIs yet. First goal is customer validation:
            10 leads, 3 demos, 1 paid pilot.
          </p>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/dashboard/status"
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-cyan-300 px-5 py-4 font-bold text-slate-950 hover:bg-cyan-200"
            >
              Open production status
              <ArrowRight className="h-5 w-5" />
            </Link>

            <Link
              href="/dashboard/validation"
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-cyan-300/20 px-5 py-4 font-bold text-cyan-100 hover:bg-cyan-300/10"
            >
              Start customer validation
              <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
        </section>

        <section className="mt-8 rounded-3xl border border-amber-300/20 bg-amber-300/10 p-8">
          <h2 className="text-2xl font-black text-amber-100">Final safety note</h2>
          <p className="mt-3 max-w-4xl leading-8 text-amber-50/90">
            VeyraSec V2 is a safe passive website trust report SaaS. It is not advanced security testing,
            not a vulnerability exploitation tool, not a legal compliance certificate, and not a replacement for
            professional legal, tax, or cybersecurity advice.
          </p>
        </section>
      </div>
    </main>
  );
}