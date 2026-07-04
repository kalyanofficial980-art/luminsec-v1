import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  ClipboardCheck,
  FileText,
  Hammer,
  Rocket,
  ShieldAlert,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { formatDateTime } from "@/lib/utils/risk";
import {
  buildReportActionPlan,
  groupActionsByPriority,
  type ReportActionItem,
  type ReportFindingForAction,
} from "@/lib/report/action-plan";

function getWebsiteUrl(websites: unknown) {
  if (Array.isArray(websites)) {
    const firstWebsite = websites[0] as { url?: string | null; name?: string | null } | undefined;
    return firstWebsite?.url || "Website report";
  }

  if (websites && typeof websites === "object" && "url" in websites) {
    return String((websites as { url?: string | null }).url || "Website report");
  }

  return "Website report";
}

function priorityClass(priority: ReportActionItem["priority"]) {
  if (priority === "urgent") return "border-red-400/20 bg-red-400/10 text-red-100";
  if (priority === "important") return "border-amber-400/20 bg-amber-400/10 text-amber-100";
  return "border-cyan-400/20 bg-cyan-400/10 text-cyan-100";
}

function scoreClass(score: number) {
  if (score >= 80) return "border-emerald-400/20 bg-emerald-400/10 text-emerald-100";
  if (score >= 60) return "border-amber-400/20 bg-amber-400/10 text-amber-100";
  return "border-red-400/20 bg-red-400/10 text-red-100";
}

function ActionCard({ action, index }: { action: ReportActionItem; index: number }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-slate-950 p-6">
      <div className="mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
        <div>
          <div className="mb-3 flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-cyan-300 font-black text-slate-950">
              {index + 1}
            </div>
            <h3 className="text-2xl font-black">{action.title}</h3>
          </div>

          <p className="leading-7 text-slate-400">{action.reason}</p>
        </div>

        <span className={`w-fit rounded-full border px-3 py-1 text-xs font-bold ${priorityClass(action.priority)}`}>
          {action.priority}
        </span>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_0.4fr]">
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <p className="mb-3 font-bold text-white">Steps</p>
          <ol className="space-y-3">
            {action.steps.map((step, stepIndex) => (
              <li key={step} className="flex gap-3 text-sm leading-6 text-slate-300">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/10 text-xs font-black text-cyan-300">
                  {stepIndex + 1}
                </span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
        </div>

        <div className="grid gap-3">
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <div className="mb-2 flex items-center gap-2 text-cyan-300">
              <UserRound className="h-4 w-4" />
              <p className="text-sm font-bold">Owner</p>
            </div>
            <p className="text-sm leading-6 text-slate-300">{action.owner}</p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <div className="mb-2 flex items-center gap-2 text-cyan-300">
              <Hammer className="h-4 w-4" />
              <p className="text-sm font-bold">Effort</p>
            </div>
            <p className="text-sm font-bold text-slate-300">{action.effort}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default async function ReportActionPlanPage({
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

  const { data: result } = await supabase
    .from("scan_results")
    .select("id, website_id, overall_score, security_score, privacy_score, trust_score, risk_level, summary, created_at, websites(name, url)")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!result) {
    notFound();
  }

  const { data: findingsRows } = await supabase
    .from("scan_findings")
    .select("title, severity, category, description, recommendation")
    .eq("scan_result_id", result.id);

  const findings = (findingsRows ?? []) as ReportFindingForAction[];
  const actions = buildReportActionPlan(findings);
  const grouped = groupActionsByPriority(actions);
  const websiteUrl = getWebsiteUrl(result.websites);

  const priorityStats = [
    {
      label: "Urgent",
      count: grouped.urgent.length,
      className: "border-red-400/20 bg-red-400/10 text-red-100",
    },
    {
      label: "Important",
      count: grouped.important.length,
      className: "border-amber-400/20 bg-amber-400/10 text-amber-100",
    },
    {
      label: "Improvement",
      count: grouped.improvement.length,
      className: "border-cyan-400/20 bg-cyan-400/10 text-cyan-100",
    },
  ];

  return (
    <main className="min-h-screen bg-slate-950 p-6 text-white">
      <div className="mx-auto max-w-7xl">
        <Link
          href={`/dashboard/scans/${result.id}`}
          className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-slate-300 hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to report
        </Link>

        <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-8">
          <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-start">
            <div>
              <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-400/10 ring-1 ring-cyan-300/30">
                <ClipboardCheck className="h-8 w-8 text-cyan-300" />
              </div>

              <h1 className="text-4xl font-black tracking-tight md:text-5xl">
                Report action plan
              </h1>

              <p className="mt-4 max-w-3xl break-all leading-8 text-slate-300">
                {websiteUrl}
              </p>

              <p className="mt-2 text-sm text-slate-500">
                Based on scan from {formatDateTime(result.created_at)}
              </p>
            </div>

            <div className={`rounded-3xl border p-6 text-center ${scoreClass(Number(result.overall_score ?? 0))}`}>
              <p className="text-sm opacity-80">Overall readiness</p>
              <p className="mt-2 text-5xl font-black">{Number(result.overall_score ?? 0)}/100</p>
            </div>
          </div>
        </section>

        <section className="mt-8 grid gap-4 md:grid-cols-3">
          {priorityStats.map((stat) => (
            <div key={stat.label} className={`rounded-3xl border p-6 ${stat.className}`}>
              <p className="text-sm opacity-80">{stat.label} actions</p>
              <p className="mt-2 text-4xl font-black">{stat.count}</p>
            </div>
          ))}
        </section>

        <section className="mt-8 rounded-3xl border border-cyan-300/20 bg-cyan-300/10 p-8">
          <div className="mb-4 flex items-center gap-3">
            <Rocket className="h-7 w-7 text-cyan-300" />
            <h2 className="text-3xl font-black text-cyan-100">Customer-friendly summary</h2>
          </div>

          <p className="max-w-4xl leading-8 text-cyan-50/90">
            This action plan converts technical findings into practical next steps. Share it with
            the website owner, developer, or agency team. After changes are completed, run a new
            scan and use the comparison page to show before-after improvement.
          </p>
        </section>

        {grouped.urgent.length > 0 ? (
          <section className="mt-8">
            <div className="mb-5 flex items-center gap-3">
              <ShieldAlert className="h-7 w-7 text-red-300" />
              <h2 className="text-3xl font-black">Urgent actions</h2>
            </div>

            <div className="grid gap-5">
              {grouped.urgent.map((action, index) => (
                <ActionCard key={action.title} action={action} index={index} />
              ))}
            </div>
          </section>
        ) : null}

        {grouped.important.length > 0 ? (
          <section className="mt-8">
            <div className="mb-5 flex items-center gap-3">
              <ShieldCheck className="h-7 w-7 text-amber-300" />
              <h2 className="text-3xl font-black">Important actions</h2>
            </div>

            <div className="grid gap-5">
              {grouped.important.map((action, index) => (
                <ActionCard key={action.title} action={action} index={grouped.urgent.length + index} />
              ))}
            </div>
          </section>
        ) : null}

        {grouped.improvement.length > 0 ? (
          <section className="mt-8">
            <div className="mb-5 flex items-center gap-3">
              <CheckCircle2 className="h-7 w-7 text-cyan-300" />
              <h2 className="text-3xl font-black">Improvement actions</h2>
            </div>

            <div className="grid gap-5">
              {grouped.improvement.map((action, index) => (
                <ActionCard
                  key={action.title}
                  action={action}
                  index={grouped.urgent.length + grouped.important.length + index}
                />
              ))}
            </div>
          </section>
        ) : null}

        <section className="mt-8 grid gap-5 md:grid-cols-3">
          <Link
            href={`/dashboard/scans/${result.id}`}
            className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 hover:bg-white/[0.07]"
          >
            <FileText className="mb-4 h-7 w-7 text-cyan-300" />
            <h2 className="text-2xl font-black">Open report</h2>
            <p className="mt-3 text-slate-400">Return to full findings and summary.</p>
          </Link>

          <Link
            href={`/dashboard/scans/${result.id}/comparison`}
            className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 hover:bg-white/[0.07]"
          >
            <ArrowRight className="mb-4 h-7 w-7 text-cyan-300" />
            <h2 className="text-2xl font-black">Compare scans</h2>
            <p className="mt-3 text-slate-400">Show before-after improvement after fixes.</p>
          </Link>

          <Link
            href={`/dashboard/scans/${result.id}/print`}
            className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 hover:bg-white/[0.07]"
          >
            <FileText className="mb-4 h-7 w-7 text-cyan-300" />
            <h2 className="text-2xl font-black">Print PDF</h2>
            <p className="mt-3 text-slate-400">Save a client-ready PDF report.</p>
          </Link>
        </section>

        <section className="mt-8 rounded-3xl border border-amber-300/20 bg-amber-300/10 p-8">
          <h2 className="text-2xl font-black text-amber-100">Important note</h2>
          <p className="mt-3 leading-8 text-amber-50/90">
            This action plan is based on safe passive website checks only. It is not legal advice,
            not a compliance certificate, not a full cybersecurity audit, and not a penetration test.
          </p>
        </section>
      </div>
    </main>
  );
}