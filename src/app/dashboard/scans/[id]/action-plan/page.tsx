import Link from "next/link";
import { notFound } from "next/navigation";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  ClipboardCheck,
  Clock,
  ExternalLink,
  FileText,
  Gauge,
  Lightbulb,
  RefreshCcw,
  ShieldCheck,
  Wrench,
} from "lucide-react";
import { requireDashboardUser } from "@/lib/auth/route-access";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

type FindingRow = {
  id: string;
  category: string | null;
  severity: string | null;
  title: string | null;
  description: string | null;
  recommendation: string | null;
  evidence: string | null;
  created_at: string | null;
};

function text(value: unknown, fallback = "") {
  const raw = String(value ?? "").trim();
  return raw.length > 0 ? raw : fallback;
}

function clampScore(value: unknown) {
  const score = Number(value);

  if (!Number.isFinite(score)) {
    return 0;
  }

  return Math.max(0, Math.min(100, Math.round(score)));
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function extractSection(body: unknown, label: string) {
  const raw = text(body);
  const pattern = new RegExp(
    `${escapeRegExp(label)}:\\s*([\\s\\S]*?)(?=\\n\\n[A-Z][A-Za-z\\s]+:|$)`,
    "i"
  );
  const match = raw.match(pattern);

  return text(match?.[1]);
}

function normalizeRisk(value: unknown) {
  const raw = String(value ?? "").toLowerCase();

  if (raw.includes("critical")) return "critical";
  if (raw.includes("high")) return "high";
  if (raw.includes("medium") || raw.includes("moderate")) return "medium";
  if (raw.includes("low")) return "low";

  return "review";
}

function severityLabel(value: unknown) {
  const risk = normalizeRisk(value);

  if (risk === "critical") return "Critical";
  if (risk === "high") return "High";
  if (risk === "medium") return "Medium";
  if (risk === "low") return "Low";

  return "Review";
}

function severityClass(value: unknown) {
  const risk = normalizeRisk(value);

  if (risk === "critical") return "border-red-400/30 bg-red-400/10 text-red-100";
  if (risk === "high") return "border-orange-400/30 bg-orange-400/10 text-orange-100";
  if (risk === "medium") return "border-amber-400/30 bg-amber-400/10 text-amber-100";
  if (risk === "low") return "border-emerald-400/30 bg-emerald-400/10 text-emerald-100";

  return "border-slate-400/30 bg-slate-400/10 text-slate-200";
}

function scoreClass(score: number) {
  if (score >= 85) return "text-emerald-300";
  if (score >= 65) return "text-amber-300";
  if (score >= 40) return "text-orange-300";
  return "text-red-300";
}

function safeArray(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.map((item) => String(item ?? "").trim()).filter(Boolean);
}

function getPriority(finding: FindingRow) {
  const priority = extractSection(finding.recommendation, "Priority").toLowerCase();
  const severity = normalizeRisk(finding.severity);

  if (priority.includes("fix now")) return "fix_now";
  if (priority.includes("fix this week")) return "fix_this_week";
  if (priority.includes("ask developer")) return "ask_developer";
  if (priority.includes("monitor")) return "monitor";
  if (priority.includes("optional")) return "optional";

  if (severity === "critical" || severity === "high") return "fix_now";
  if (severity === "medium") return "fix_this_week";
  if (severity === "low") return "monitor";

  return "optional";
}

function priorityLabel(priority: string) {
  if (priority === "fix_now") return "Fix now";
  if (priority === "fix_this_week") return "Fix this week";
  if (priority === "ask_developer") return "Ask developer";
  if (priority === "monitor") return "Monitor";
  return "Optional";
}

function priorityClass(priority: string) {
  if (priority === "fix_now") return "border-red-400/30 bg-red-400/10 text-red-100";
  if (priority === "fix_this_week") return "border-amber-400/30 bg-amber-400/10 text-amber-100";
  if (priority === "ask_developer") return "border-cyan-400/30 bg-cyan-400/10 text-cyan-100";
  if (priority === "monitor") return "border-emerald-400/30 bg-emerald-400/10 text-emerald-100";
  return "border-slate-400/30 bg-slate-400/10 text-slate-200";
}

function effortText(finding: FindingRow) {
  return extractSection(finding.recommendation, "Estimated effort") || "Review";
}

function fixSummary(finding: FindingRow) {
  return (
    extractSection(finding.recommendation, "Fix summary") ||
    text(finding.recommendation, "Review this item and apply the recommended fix.")
  );
}

function developerFix(finding: FindingRow) {
  return (
    extractSection(finding.recommendation, "Developer fix") ||
    fixSummary(finding)
  );
}

function retestText(finding: FindingRow) {
  return (
    extractSection(finding.recommendation, "Retest") ||
    "Run a new VeyraSec scan after applying the fix and confirm this finding no longer appears."
  );
}

function businessImpact(finding: FindingRow) {
  return (
    extractSection(finding.description, "Business impact") ||
    "This may affect customer confidence, trust readiness, or website security posture."
  );
}

function whatWeFound(finding: FindingRow) {
  return (
    extractSection(finding.description, "What we found") ||
    text(finding.description, "This website security posture item should be reviewed.")
  );
}

function sortFindings(findings: FindingRow[]) {
  const priorityOrder: Record<string, number> = {
    fix_now: 1,
    fix_this_week: 2,
    ask_developer: 3,
    monitor: 4,
    optional: 5,
  };

  const severityOrder: Record<string, number> = {
    critical: 1,
    high: 2,
    medium: 3,
    low: 4,
    review: 5,
  };

  return [...findings].sort((a, b) => {
    const priorityDiff = priorityOrder[getPriority(a)] - priorityOrder[getPriority(b)];

    if (priorityDiff !== 0) {
      return priorityDiff;
    }

    return severityOrder[normalizeRisk(a.severity)] - severityOrder[normalizeRisk(b.severity)];
  });
}

function ActionBucket({
  title,
  description,
  findings,
  icon,
}: {
  title: string;
  description: string;
  findings: FindingRow[];
  icon: "urgent" | "week" | "developer" | "monitor";
}) {
  const Icon =
    icon === "urgent"
      ? AlertTriangle
      : icon === "developer"
        ? Wrench
        : icon === "monitor"
          ? Clock
          : Lightbulb;

  return (
    <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
      <div className="mb-5 flex items-start gap-3">
        <Icon className="mt-1 h-6 w-6 shrink-0 text-cyan-300" />
        <div>
          <h2 className="text-2xl font-black text-white">{title}</h2>
          <p className="mt-2 leading-7 text-slate-400">{description}</p>
        </div>
      </div>

      {findings.length > 0 ? (
        <div className="grid gap-3">
          {findings.map((finding) => {
            const priority = getPriority(finding);

            return (
              <Link
                key={finding.id}
                href={`#finding-${finding.id}`}
                className="block rounded-2xl border border-white/10 bg-slate-950 p-4 hover:bg-white/[0.03]"
              >
                <div className="mb-2 flex flex-wrap gap-2">
                  <span className={`rounded-full border px-3 py-1 text-xs font-black ${priorityClass(priority)}`}>
                    {priorityLabel(priority)}
                  </span>
                  <span className={`rounded-full border px-3 py-1 text-xs font-black ${severityClass(finding.severity)}`}>
                    {severityLabel(finding.severity)}
                  </span>
                </div>

                <h3 className="font-black text-white">{text(finding.title, "Finding")}</h3>
                <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-400">
                  {fixSummary(finding)}
                </p>
              </Link>
            );
          })}
        </div>
      ) : (
        <p className="rounded-2xl border border-white/10 bg-slate-950 p-4 leading-7 text-slate-400">
          No items in this bucket.
        </p>
      )}
    </section>
  );
}

function ActionList({
  title,
  items,
  fallback,
  icon,
}: {
  title: string;
  items: string[];
  fallback: string;
  icon: "owner" | "developer" | "retest";
}) {
  const Icon = icon === "developer" ? Wrench : icon === "retest" ? RefreshCcw : ClipboardCheck;

  return (
    <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
      <div className="mb-5 flex items-center gap-3">
        <Icon className="h-6 w-6 text-cyan-300" />
        <h2 className="text-xl font-black text-white">{title}</h2>
      </div>

      {items.length > 0 ? (
        <div className="grid gap-3">
          {items.map((item, index) => (
            <div key={`${item}-${index}`} className="rounded-2xl border border-white/10 bg-slate-950 p-4">
              <div className="flex gap-3">
                <CheckCircle2 className="mt-1 h-5 w-5 shrink-0 text-emerald-300" />
                <p className="leading-7 text-slate-300">{item}</p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="rounded-2xl border border-white/10 bg-slate-950 p-4 leading-7 text-slate-400">
          {fallback}
        </p>
      )}
    </section>
  );
}

export default async function ActionPlanPage({ params }: PageProps) {
  const { id } = await params;
  const { supabase, user, profile } = await requireDashboardUser();

  let scanQuery = supabase
    .from("scan_results")
    .select(
      "id, user_id, website_id, url, domain, overall_score, score, risk_level, summary, raw_result, raw, created_at"
    )
    .eq("id", id);

  if (profile.role !== "admin") {
    scanQuery = scanQuery.eq("user_id", user.id);
  }

  const { data: scan } = await scanQuery.maybeSingle();

  if (!scan) {
    notFound();
  }

  let findingsQuery = supabase
    .from("scan_findings")
    .select("id, category, severity, title, description, recommendation, evidence, created_at")
    .eq("scan_result_id", scan.id)
    .order("created_at", { ascending: true });

  if (profile.role !== "admin") {
    findingsQuery = findingsQuery.eq("user_id", user.id);
  }

  const { data: findingRows } = await findingsQuery;
  const findings = sortFindings((findingRows ?? []) as FindingRow[]);

  let websiteName = scan.domain || "Website";

  if (scan.website_id) {
    let websiteQuery = supabase
      .from("websites")
      .select("name, url, domain")
      .eq("id", scan.website_id);

    if (profile.role !== "admin") {
      websiteQuery = websiteQuery.eq("user_id", user.id);
    }

    const { data: website } = await websiteQuery.maybeSingle();

    websiteName = website?.name || website?.domain || scan.domain || "Website";
  }

  const rawResult = (scan.raw_result || scan.raw || {}) as {
    professional?: {
      summary?: {
        fastestFixes?: string[];
        ownerActions?: string[];
        developerActions?: string[];
      };
    };
  };

  const professionalSummary = rawResult.professional?.summary;
  const ownerActions = safeArray(professionalSummary?.ownerActions);
  const developerActions = safeArray(professionalSummary?.developerActions);
  const fastestFixes = safeArray(professionalSummary?.fastestFixes);
  const professionalMeta = professionalSummary as unknown as {
    riskReason?: unknown;
    scoreImprovements?: unknown;
  } | undefined;
  const riskReason = text(professionalMeta?.riskReason);
  const scoreImprovements = safeArray(professionalMeta?.scoreImprovements);

  const fixNow = findings.filter((finding) => getPriority(finding) === "fix_now");
  const fixThisWeek = findings.filter((finding) => getPriority(finding) === "fix_this_week");
  const askDeveloper = findings.filter((finding) => getPriority(finding) === "ask_developer");
  const monitor = findings.filter((finding) =>
    ["monitor", "optional"].includes(getPriority(finding))
  );

  const retestItems = findings.map((finding) => retestText(finding)).filter(Boolean);
  const overallScore = clampScore(scan.overall_score ?? scan.score);
  const reportUrl = scan.url || `https://${scan.domain}`;

  return (
    <main className="min-h-screen bg-slate-950 p-6 text-white">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
          <Link
            href={`/dashboard/scans/${scan.id}`}
            className="inline-flex items-center gap-2 text-sm font-bold text-cyan-300 hover:text-cyan-200"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to report
          </Link>

          <div className="flex flex-wrap gap-3">
            <Link
              href={`/dashboard/scans/${scan.id}/print`}
              className="rounded-2xl border border-white/10 px-4 py-3 text-sm font-black text-white hover:bg-white/10"
            >
              Print / PDF
            </Link>
            <Link
              href={`/dashboard/scans/${scan.id}/share`}
              className="rounded-2xl bg-cyan-300 px-4 py-3 text-sm font-black text-slate-950 hover:bg-cyan-200"
            >
              Share report
            </Link>
          </div>
        </div>

        <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-8">
          <div className="flex flex-col justify-between gap-8 xl:flex-row xl:items-start">
            <div>
              <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-3xl bg-cyan-400/10 ring-1 ring-cyan-300/30">
                <ClipboardCheck className="h-9 w-9 text-cyan-300" />
              </div>

              <p className="text-sm font-black uppercase tracking-[0.3em] text-cyan-300">
                Professional action plan
              </p>

              <h1 className="mt-4 text-4xl font-black tracking-tight md:text-6xl">
                {websiteName}
              </h1>

              <a
                href={reportUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-4 inline-flex items-center gap-2 break-all text-sm font-bold text-slate-300 hover:text-cyan-200"
              >
                {reportUrl}
                <ExternalLink className="h-4 w-4 shrink-0" />
              </a>

              <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-300">
                This fix-first action plan turns VeyraSec findings into owner actions, developer tasks, and retest steps.
              </p>

              <p className="mt-4 text-sm text-slate-500">
                Scan date: {scan.created_at ? new Date(scan.created_at).toLocaleString("en-IN") : "Not available"}
              </p>
            </div>

            <div className="rounded-3xl border border-white/10 bg-slate-950 p-6 text-center">
              <p className="text-sm font-bold text-slate-400">Overall score</p>
              <p className={`mt-3 text-7xl font-black ${scoreClass(overallScore)}`}>
                {overallScore}
              </p>
              <p className="mt-2 text-sm font-bold text-slate-500">out of 100</p>

              <div className={`mt-5 rounded-full border px-5 py-3 text-sm font-black ${severityClass(scan.risk_level)}`}>
                {severityLabel(scan.risk_level)} risk
              </div>
            </div>
          </div>
        </section>

        <section className="mt-8 rounded-3xl border border-cyan-300/20 bg-cyan-300/10 p-8">
          <h2 className="text-2xl font-black text-cyan-100">Score improvement strategy</h2>
          <p className="mt-4 leading-8 text-cyan-50/90">
            {riskReason || "Fix the highest-priority findings first, then run a retest to confirm score improvement."}
          </p>

          <div className="mt-5 grid gap-3 md:grid-cols-2">
            {(scoreImprovements.length > 0 ? scoreImprovements : ["Fix highest-priority findings and retest the website."]).map((item, index) => (
              <div key={`${item}-${index}`} className="rounded-2xl border border-cyan-200/20 bg-slate-950/60 p-4">
                <p className="leading-7 text-cyan-50/90">{item}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-8 grid gap-4 md:grid-cols-4">
          {[
            ["Fix now", fixNow.length, "text-red-300"],
            ["Fix this week", fixThisWeek.length, "text-amber-300"],
            ["Ask developer", askDeveloper.length, "text-cyan-300"],
            ["Monitor/optional", monitor.length, "text-emerald-300"],
          ].map(([label, value, className]) => (
            <div key={label} className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
              <p className="text-sm font-bold text-slate-400">{label}</p>
              <p className={`mt-3 text-4xl font-black ${className}`}>{value}</p>
            </div>
          ))}
        </section>

        <section className="mt-8 grid gap-8 lg:grid-cols-2">
          <ActionBucket
            title="Fix now"
            description="Highest-priority items. Review these first because they carry the strongest security posture or trust impact."
            findings={fixNow}
            icon="urgent"
          />

          <ActionBucket
            title="Fix this week"
            description="Important hygiene and trust improvements that should be handled soon."
            findings={fixThisWeek}
            icon="week"
          />

          <ActionBucket
            title="Ask developer"
            description="Technical items that usually need a developer, hosting provider, or website platform setting."
            findings={askDeveloper}
            icon="developer"
          />

          <ActionBucket
            title="Monitor / optional"
            description="Lower-priority items to monitor, improve when convenient, or accept with awareness."
            findings={monitor}
            icon="monitor"
          />
        </section>

        <section className="mt-8 grid gap-8 lg:grid-cols-3">
          <ActionList
            title="Fastest fixes"
            items={fastestFixes}
            fallback="No fast fixes were generated for this scan."
            icon="owner"
          />

          <ActionList
            title="Business owner actions"
            items={ownerActions}
            fallback="No specific business owner actions were generated for this scan."
            icon="owner"
          />

          <ActionList
            title="Developer handoff"
            items={developerActions}
            fallback="No specific developer handoff actions were generated for this scan."
            icon="developer"
          />
        </section>

        <section className="mt-8 rounded-3xl border border-white/10 bg-white/[0.04] p-8">
          <div className="mb-6 flex items-center gap-3">
            <RefreshCcw className="h-7 w-7 text-cyan-300" />
            <h2 className="text-3xl font-black">Retest checklist</h2>
          </div>

          {retestItems.length > 0 ? (
            <div className="grid gap-3 md:grid-cols-2">
              {retestItems.map((item, index) => (
                <div key={`${item}-${index}`} className="rounded-2xl border border-white/10 bg-slate-950 p-4">
                  <div className="flex gap-3">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-cyan-300 text-xs font-black text-slate-950">
                      {index + 1}
                    </span>
                    <p className="leading-7 text-slate-300">{item}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="rounded-2xl border border-white/10 bg-slate-950 p-4 leading-7 text-slate-400">
              No retest checklist items were generated.
            </p>
          )}
        </section>

        <section className="mt-8 rounded-3xl border border-white/10 bg-white/[0.04] p-8">
          <div className="mb-6 flex items-center gap-3">
            <FileText className="h-7 w-7 text-cyan-300" />
            <h2 className="text-3xl font-black">Finding-by-finding plan</h2>
          </div>

          {findings.length > 0 ? (
            <div className="grid gap-6">
              {findings.map((finding, index) => {
                const priority = getPriority(finding);

                return (
                  <article
                    id={`finding-${finding.id}`}
                    key={finding.id}
                    className="rounded-3xl border border-white/10 bg-slate-950 p-6"
                  >
                    <div className="mb-4 flex flex-wrap gap-2">
                      <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-black text-slate-300">
                        #{index + 1}
                      </span>
                      <span className={`rounded-full border px-3 py-1 text-xs font-black ${priorityClass(priority)}`}>
                        {priorityLabel(priority)}
                      </span>
                      <span className={`rounded-full border px-3 py-1 text-xs font-black ${severityClass(finding.severity)}`}>
                        {severityLabel(finding.severity)}
                      </span>
                      <span className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1 text-xs font-black text-cyan-100">
                        {text(finding.category, "general").replaceAll("_", " ")}
                      </span>
                    </div>

                    <h3 className="text-2xl font-black text-white">
                      {text(finding.title, "Finding")}
                    </h3>

                    <div className="mt-6 grid gap-4 lg:grid-cols-2">
                      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                        <h4 className="font-black text-cyan-100">What to fix</h4>
                        <p className="mt-3 leading-7 text-slate-300">{fixSummary(finding)}</p>
                      </div>

                      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                        <h4 className="font-black text-cyan-100">Why this matters</h4>
                        <p className="mt-3 leading-7 text-slate-300">{businessImpact(finding)}</p>
                      </div>

                      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                        <h4 className="font-black text-cyan-100">Developer instruction</h4>
                        <p className="mt-3 leading-7 text-slate-300">{developerFix(finding)}</p>
                      </div>

                      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                        <h4 className="font-black text-cyan-100">Retest instruction</h4>
                        <p className="mt-3 leading-7 text-slate-300">{retestText(finding)}</p>
                      </div>
                    </div>

                    <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                      <h4 className="font-black text-slate-100">Original finding</h4>
                      <p className="mt-3 leading-7 text-slate-300">{whatWeFound(finding)}</p>
                      <p className="mt-3 text-sm font-bold text-slate-500">
                        Estimated effort: {effortText(finding)}
                      </p>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="rounded-3xl border border-emerald-300/20 bg-emerald-300/10 p-6">
              <CheckCircle2 className="h-8 w-8 text-emerald-300" />
              <h3 className="mt-4 text-2xl font-black text-emerald-100">
                No action items saved
              </h3>
              <p className="mt-3 leading-7 text-emerald-50/90">
                This scan did not store visible findings that require an action plan.
              </p>
            </div>
          )}
        </section>

        <section className="mt-8 rounded-3xl border border-amber-300/20 bg-amber-300/10 p-8">
          <div className="flex gap-4">
            <Gauge className="mt-1 h-7 w-7 shrink-0 text-amber-200" />
            <div>
              <h2 className="text-2xl font-black text-amber-100">Action plan scope</h2>
              <p className="mt-4 max-w-4xl leading-8 text-amber-50/90">
                This action plan is based on passive visible website signals. It is designed for business owners and developers to prioritize fixes.
                It is not exploit testing, login testing, brute force testing, compliance certification, or a penetration test.
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}