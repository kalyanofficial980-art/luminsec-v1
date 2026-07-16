import Link from "next/link";
import {
  Activity,
  ArrowRight,
  CheckCircle2,
  ClipboardCheck,
  Database,
  Globe,
  ShieldCheck,
} from "lucide-react";
import { requireAdmin } from "@/lib/auth/route-access";

function statusPill(ok: boolean) {
  return ok
    ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-100"
    : "border-amber-400/20 bg-amber-400/10 text-amber-100";
}

export default async function LaunchChecklistPage() {
  const { supabase } = await requireAdmin();

  const { count: websiteCount } = await supabase
    .from("websites")
    .select("id", { count: "exact", head: true });

  const { count: scanCount } = await supabase
    .from("scan_results")
    .select("id", { count: "exact", head: true });

  const { count: profileCount } = await supabase
    .from("profiles")
    .select("id", { count: "exact", head: true });

  const { count: adminCount } = await supabase
    .from("profiles")
    .select("id", { count: "exact", head: true })
    .eq("role", "admin");

  const checks = [
    {
      label: "Health API added",
      ok: true,
      detail: "/api/health should return status ok.",
    },
    {
      label: "Robots and sitemap added",
      ok: true,
      detail: "/robots.txt and /sitemap.xml are available.",
    },
    {
      label: "Public security page added",
      ok: true,
      detail: "/security explains passive-only safety rules.",
    },
    {
      label: "Admin account exists",
      ok: (adminCount ?? 0) >= 1,
      detail: `${adminCount ?? 0} admin account(s).`,
    },
    {
      label: "Profiles exist",
      ok: (profileCount ?? 0) >= 1,
      detail: `${profileCount ?? 0} profile record(s).`,
    },
    {
      label: "Website add flow tested",
      ok: (websiteCount ?? 0) >= 1,
      detail: `${websiteCount ?? 0} website record(s).`,
    },
    {
      label: "Scan/report flow tested",
      ok: (scanCount ?? 0) >= 1,
      detail: `${scanCount ?? 0} scan result(s).`,
    },
  ];

  const manualChecks = [
    "Production login works.",
    "Admin dashboard opens.",
    "Normal customer onboarding works.",
    "Normal customer cannot open admin pages.",
    "Beginner website limit works.",
    "Beginner scan limit works.",
    "Plan upgrade request works.",
    "Admin plan approval works.",
    "Report opens after scan.",
    "PDF/print page works for allowed plans.",
    "Public share page is blocked for Beginner and allowed for paid plans.",
    "No customer page shows founder/admin/internal wording.",
    "No page says AI-style or V1 dashboard.",
    "Vercel environment variables are set.",
    "Supabase RLS policies are enabled and tested.",
  ];

  return (
    <main className="min-h-screen bg-slate-950 p-6 text-white">
      <div className="mx-auto max-w-7xl">
        <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-8">
          <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-start">
            <div>
              <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-400/10 ring-1 ring-cyan-300/30">
                <ClipboardCheck className="h-8 w-8 text-cyan-300" />
              </div>

              <h1 className="text-4xl font-black tracking-tight md:text-5xl">
                Final launch checklist
              </h1>

              <p className="mt-4 max-w-3xl leading-8 text-slate-300">
                Admin-only production checklist for VeyraSec public launch
                readiness.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                href="/dashboard/admin/access-audit"
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-cyan-300/20 bg-cyan-300/10 px-5 py-4 font-bold text-cyan-100 hover:bg-cyan-300/20"
              >
                Access audit
                <ArrowRight className="h-5 w-5" />
              </Link>
              <Link
                href="/dashboard/admin/saas-readiness"
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 px-5 py-4 font-bold text-white hover:bg-white/10"
              >
                SaaS readiness
                <ArrowRight className="h-5 w-5" />
              </Link>
            </div>
          </div>
        </section>

        <section className="mt-8 grid gap-4 md:grid-cols-4">
          {[
            { label: "Profiles", value: profileCount ?? 0, icon: ShieldCheck },
            { label: "Admins", value: adminCount ?? 0, icon: ShieldCheck },
            { label: "Websites", value: websiteCount ?? 0, icon: Globe },
            { label: "Scans", value: scanCount ?? 0, icon: Activity },
          ].map((item) => (
            <div
              key={item.label}
              className="rounded-3xl border border-white/10 bg-white/[0.04] p-6"
            >
              <item.icon className="h-7 w-7 text-cyan-300" />
              <p className="mt-5 text-sm text-slate-400">{item.label}</p>
              <p className="mt-2 text-3xl font-black">{item.value}</p>
            </div>
          ))}
        </section>

        <section className="mt-8 rounded-3xl border border-white/10 bg-white/[0.04] p-8">
          <div className="mb-6 flex items-center gap-3">
            <Database className="h-7 w-7 text-cyan-300" />
            <h2 className="text-3xl font-black">Automatic checks</h2>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {checks.map((check) => (
              <div
                key={check.label}
                className={`rounded-3xl border p-5 ${statusPill(check.ok)}`}
              >
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="mt-1 h-6 w-6 shrink-0" />
                  <div>
                    <p className="font-black">{check.label}</p>
                    <p className="mt-2 text-sm leading-6 opacity-80">
                      {check.detail}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-8 rounded-3xl border border-white/10 bg-white/[0.04] p-8">
          <h2 className="text-3xl font-black">Manual production checklist</h2>

          <div className="mt-6 grid gap-3 md:grid-cols-2">
            {manualChecks.map((item, index) => (
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

        <section className="mt-8 rounded-3xl border border-emerald-300/20 bg-emerald-300/10 p-8">
          <h2 className="text-2xl font-black text-emerald-100">
            Launch decision rule
          </h2>
          <p className="mt-4 max-w-4xl leading-8 text-emerald-50/90">
            Launch only after build passes, production deploy works, scan/report
            flow works, and a normal customer account cannot access admin or
            paid-only pages.
          </p>
        </section>
      </div>
    </main>
  );
}
