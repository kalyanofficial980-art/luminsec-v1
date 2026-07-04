import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  CreditCard,
  Lock,
  ShieldCheck,
  Users,
  XCircle,
} from "lucide-react";
import { requireAdmin } from "@/lib/auth/route-access";
import {
  accessMatrix,
  accessValueClass,
  accessValueText,
} from "@/lib/subscription/access-matrix";

function statusClass(ok: boolean) {
  return ok
    ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-100"
    : "border-red-400/20 bg-red-400/10 text-red-100";
}

export default async function AccessAuditPage() {
  const { supabase } = await requireAdmin();

  const { data: plans } = await supabase
    .from("subscription_plans")
    .select("id, name, max_websites, max_scans_per_month, pdf_reports_enabled, public_share_enabled, agency_mode_enabled, manual_payments_enabled, is_active")
    .order("sort_order", { ascending: true });

  const { count: adminCount } = await supabase
    .from("profiles")
    .select("id", { count: "exact", head: true })
    .eq("role", "admin");

  const { count: userCount } = await supabase
    .from("profiles")
    .select("id", { count: "exact", head: true });

  const { count: pendingRequestCount } = await supabase
    .from("subscription_requests")
    .select("id", { count: "exact", head: true })
    .eq("status", "pending");

  const planRows = plans ?? [];
  const planIds = planRows.map((plan) => plan.id);
  const requiredPlans = ["trial", "basic", "pro", "agency"];
  const missingPlans = requiredPlans.filter((plan) => !planIds.includes(plan));

  const planConfigOk =
    missingPlans.length === 0 &&
    planRows.some((plan) => plan.id === "trial" && plan.pdf_reports_enabled && !plan.public_share_enabled && !plan.agency_mode_enabled) &&
    planRows.some((plan) => plan.id === "basic" && plan.public_share_enabled && !plan.agency_mode_enabled) &&
    planRows.some((plan) => plan.id === "pro" && plan.public_share_enabled && !plan.agency_mode_enabled) &&
    planRows.some((plan) => plan.id === "agency" && plan.public_share_enabled && plan.agency_mode_enabled);

  const auditCards = [
    {
      label: "Plan configuration",
      ok: planConfigOk,
      message: planConfigOk ? "Trial, Basic, Pro, and Agency rules are aligned." : `Missing/misaligned: ${missingPlans.join(", ") || "plan settings"}`,
    },
    {
      label: "Admin account",
      ok: (adminCount ?? 0) >= 1,
      message: `${adminCount ?? 0} admin account(s) found.`,
    },
    {
      label: "Users",
      ok: (userCount ?? 0) >= 1,
      message: `${userCount ?? 0} profile record(s) found.`,
    },
    {
      label: "Plan requests",
      ok: true,
      message: `${pendingRequestCount ?? 0} pending request(s).`,
    },
  ];

  const protectedPages = [
    {
      page: "/dashboard/admin/subscriptions",
      access: "Admin only",
    },
    {
      page: "/dashboard/admin/saas-readiness",
      access: "Admin only",
    },
    {
      page: "/dashboard/admin/access-audit",
      access: "Admin only",
    },
    {
      page: "/dashboard/status",
      access: "Admin only",
    },
    {
      page: "/dashboard/v2-launch",
      access: "Admin only",
    },
    {
      page: "/dashboard/validation",
      access: "Admin only",
    },
    {
      page: "/dashboard/payments",
      access: "Admin only",
    },
    {
      page: "/dashboard/agency",
      access: "Agency plan or admin",
    },
    {
      page: "/dashboard/scans/[id]/share",
      access: "Public share plan or admin",
    },
    {
      page: "/dashboard/scans/[id]/print",
      access: "PDF plan or admin",
    },
  ];

  return (
    <main className="min-h-screen bg-slate-950 p-6 text-white">
      <div className="mx-auto max-w-7xl">
        <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-8">
          <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-start">
            <div>
              <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-400/10 ring-1 ring-cyan-300/30">
                <ShieldCheck className="h-8 w-8 text-cyan-300" />
              </div>

              <h1 className="text-4xl font-black tracking-tight md:text-5xl">
                Access audit
              </h1>

              <p className="mt-4 max-w-3xl leading-8 text-slate-300">
                Admin-only audit for customer access, subscription rules, protected pages, and launch readiness.
              </p>
            </div>

            <Link
              href="/dashboard/admin/saas-readiness"
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-cyan-300/20 bg-cyan-300/10 px-5 py-4 font-bold text-cyan-100 hover:bg-cyan-300/20"
            >
              SaaS readiness
              <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
        </section>

        <section className="mt-8 grid gap-4 md:grid-cols-4">
          {auditCards.map((card) => (
            <div key={card.label} className={`rounded-3xl border p-6 ${statusClass(card.ok)}`}>
              {card.ok ? (
                <CheckCircle2 className="mb-4 h-7 w-7" />
              ) : (
                <XCircle className="mb-4 h-7 w-7" />
              )}
              <p className="text-sm opacity-80">{card.label}</p>
              <p className="mt-2 text-lg font-black">{card.ok ? "OK" : "Check"}</p>
              <p className="mt-2 text-sm leading-6 opacity-80">{card.message}</p>
            </div>
          ))}
        </section>

        <section className="mt-8 rounded-3xl border border-white/10 bg-white/[0.04] p-8">
          <div className="mb-6 flex items-center gap-3">
            <CreditCard className="h-7 w-7 text-cyan-300" />
            <h2 className="text-3xl font-black">Customer access matrix</h2>
          </div>

          <div className="overflow-x-auto rounded-3xl border border-white/10">
            <table className="w-full min-w-[850px] border-collapse text-left text-sm">
              <thead className="bg-slate-950 text-slate-300">
                <tr>
                  <th className="border-b border-white/10 p-4">Feature</th>
                  <th className="border-b border-white/10 p-4">Trial</th>
                  <th className="border-b border-white/10 p-4">Basic</th>
                  <th className="border-b border-white/10 p-4">Pro</th>
                  <th className="border-b border-white/10 p-4">Agency</th>
                  <th className="border-b border-white/10 p-4">Admin</th>
                </tr>
              </thead>
              <tbody>
                {accessMatrix.map((row) => (
                  <tr key={row.feature} className="bg-slate-950/60">
                    <td className="border-b border-white/10 p-4 font-bold text-white">{row.feature}</td>
                    {(["trial", "basic", "pro", "agency", "admin"] as const).map((plan) => (
                      <td key={plan} className="border-b border-white/10 p-4">
                        <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${accessValueClass(row[plan])}`}>
                          {accessValueText(row[plan])}
                        </span>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="mt-8 grid gap-8 lg:grid-cols-2">
          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-8">
            <div className="mb-6 flex items-center gap-3">
              <Lock className="h-7 w-7 text-cyan-300" />
              <h2 className="text-3xl font-black">Protected pages</h2>
            </div>

            <div className="grid gap-3">
              {protectedPages.map((page) => (
                <div key={page.page} className="rounded-2xl border border-white/10 bg-slate-950 p-4">
                  <p className="font-bold text-white">{page.page}</p>
                  <p className="mt-1 text-sm text-slate-400">{page.access}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-8">
            <div className="mb-6 flex items-center gap-3">
              <Users className="h-7 w-7 text-cyan-300" />
              <h2 className="text-3xl font-black">Manual test checklist</h2>
            </div>

            <div className="grid gap-3">
              {[
                "Admin sees founder tools and full access.",
                "Trial user sees only Dashboard, Websites, Reports, Subscription, Settings.",
                "Trial user cannot open public share page.",
                "Trial user cannot open Agency page.",
                "Basic/Pro user can open public share page.",
                "Agency user can open Agency page.",
                "Normal user cannot open admin pages.",
                "Website limit blocks correctly.",
                "Scan limit blocks correctly.",
                "Plan approval changes customer access.",
              ].map((item, index) => (
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
        </section>

        <section className="mt-8 rounded-3xl border border-amber-300/20 bg-amber-300/10 p-8">
          <h2 className="text-2xl font-black text-amber-100">Launch rule</h2>
          <p className="mt-4 max-w-4xl leading-8 text-amber-50/90">
            Account type only personalizes the dashboard. Subscription plan controls feature access.
            Admin accounts are for internal operations only.
          </p>
        </section>
      </div>
    </main>
  );
}