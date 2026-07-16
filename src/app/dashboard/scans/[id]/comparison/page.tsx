import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  BarChart3,
  CheckCircle2,
  FileText,
  MinusCircle,
  PlusCircle,
  ShieldAlert,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { formatDateTime } from "@/lib/utils/risk";
import {
  changeLabel,
  changeTone,
  compareFindings,
  compareScores,
  type ComparableFinding,
} from "@/lib/report/compare";

function scoreClass(score: number) {
  if (score >= 80)
    return "border-emerald-400/20 bg-emerald-400/10 text-emerald-100";
  if (score >= 60) return "border-amber-400/20 bg-amber-400/10 text-amber-100";
  return "border-red-400/20 bg-red-400/10 text-red-100";
}

function changeClass(change: number) {
  if (change > 0)
    return "border-emerald-400/20 bg-emerald-400/10 text-emerald-100";
  if (change < 0) return "border-red-400/20 bg-red-400/10 text-red-100";
  return "border-slate-400/20 bg-slate-400/10 text-slate-100";
}

function ChangeIcon({ change }: { change: number }) {
  if (change > 0) return <TrendingUp className="h-6 w-6" />;
  if (change < 0) return <TrendingDown className="h-6 w-6" />;
  return <MinusCircle className="h-6 w-6" />;
}

function getWebsiteUrl(websites: unknown) {
  if (Array.isArray(websites)) {
    const firstWebsite = websites[0] as
      { url?: string | null; name?: string | null } | undefined;
    return firstWebsite?.url || "Website report";
  }

  if (websites && typeof websites === "object" && "url" in websites) {
    return String(
      (websites as { url?: string | null }).url || "Website report",
    );
  }

  return "Website report";
}

function FindingList({
  title,
  icon,
  findings,
  emptyText,
  tone,
}: {
  title: string;
  icon: React.ReactNode;
  findings: ComparableFinding[];
  emptyText: string;
  tone: "new" | "fixed" | "same";
}) {
  const toneClass =
    tone === "fixed"
      ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-100"
      : tone === "new"
        ? "border-red-400/20 bg-red-400/10 text-red-100"
        : "border-slate-400/20 bg-slate-400/10 text-slate-100";

  return (
    <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-8">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {icon}
          <h2 className="text-3xl font-black">{title}</h2>
        </div>
        <span
          className={`rounded-full border px-3 py-1 text-sm font-bold ${toneClass}`}
        >
          {findings.length}
        </span>
      </div>

      {findings.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-slate-950 p-5 text-slate-400">
          {emptyText}
        </div>
      ) : (
        <div className="grid gap-3">
          {findings.map((finding) => (
            <div
              key={`${finding.title}-${finding.category}`}
              className="rounded-2xl border border-white/10 bg-slate-950 p-5"
            >
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <h3 className="font-black text-white">{finding.title}</h3>
                {finding.severity ? (
                  <span className="rounded-full border border-white/10 px-2 py-1 text-xs font-bold text-slate-300">
                    {finding.severity}
                  </span>
                ) : null}
                {finding.category ? (
                  <span className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-2 py-1 text-xs font-bold text-cyan-100">
                    {finding.category}
                  </span>
                ) : null}
              </div>

              {finding.description ? (
                <p className="text-sm leading-6 text-slate-400">
                  {finding.description}
                </p>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

export default async function ScanComparisonPage({
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

  const { data: currentScan } = await supabase
    .from("scan_results")
    .select(
      "id, website_id, overall_score, security_score, privacy_score, trust_score, risk_level, summary, created_at, websites(name, url)",
    )
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!currentScan) {
    notFound();
  }

  const { data: previousScan } = await supabase
    .from("scan_results")
    .select(
      "id, website_id, overall_score, security_score, privacy_score, trust_score, risk_level, summary, created_at",
    )
    .eq("website_id", currentScan.website_id)
    .eq("user_id", user.id)
    .lt("created_at", currentScan.created_at)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data: currentFindingsRows } = await supabase
    .from("scan_findings")
    .select("title, category, severity, description, recommendation")
    .eq("scan_result_id", currentScan.id);

  const currentFindings = (currentFindingsRows ?? []) as ComparableFinding[];

  const previousFindings = previousScan
    ? (((
        await supabase
          .from("scan_findings")
          .select("title, category, severity, description, recommendation")
          .eq("scan_result_id", previousScan.id)
      ).data ?? []) as ComparableFinding[])
    : [];

  const scoreComparison = previousScan
    ? compareScores(currentScan, previousScan)
    : null;

  const findingComparison = previousScan
    ? compareFindings(currentFindings, previousFindings)
    : {
        newFindings: currentFindings,
        fixedFindings: [],
        unchangedFindings: [],
      };

  const scoreCards =
    previousScan && scoreComparison
      ? [
          {
            label: "Overall",
            current: Number(currentScan.overall_score ?? 0),
            previous: Number(previousScan.overall_score ?? 0),
            change: scoreComparison.overallChange,
          },
          {
            label: "Security",
            current: Number(currentScan.security_score ?? 0),
            previous: Number(previousScan.security_score ?? 0),
            change: scoreComparison.securityChange,
          },
          {
            label: "Privacy",
            current: Number(currentScan.privacy_score ?? 0),
            previous: Number(previousScan.privacy_score ?? 0),
            change: scoreComparison.privacyChange,
          },
          {
            label: "Trust",
            current: Number(currentScan.trust_score ?? 0),
            previous: Number(previousScan.trust_score ?? 0),
            change: scoreComparison.trustChange,
          },
        ]
      : [];

  return (
    <main className="min-h-screen bg-slate-950 p-6 text-white">
      <div className="mx-auto max-w-7xl">
        <Link
          href={`/dashboard/scans/${currentScan.id}`}
          className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-slate-300 hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to report
        </Link>

        <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-8">
          <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-start">
            <div>
              <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-400/10 ring-1 ring-cyan-300/30">
                <BarChart3 className="h-8 w-8 text-cyan-300" />
              </div>

              <h1 className="text-4xl font-black tracking-tight md:text-5xl">
                Before-after report comparison
              </h1>

              <p className="mt-4 max-w-3xl break-all leading-8 text-slate-300">
                {getWebsiteUrl(currentScan.websites)}
              </p>

              <p className="mt-2 text-sm text-slate-500">
                Current scan: {formatDateTime(currentScan.created_at)}
              </p>
            </div>

            <Link
              href={`/dashboard/scans/${currentScan.id}`}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-cyan-300 px-5 py-4 font-bold text-slate-950 hover:bg-cyan-200"
            >
              Open current report
              <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
        </section>

        {!previousScan ? (
          <section className="mt-8 rounded-3xl border border-cyan-300/20 bg-cyan-300/10 p-8 text-center">
            <ShieldAlert className="mx-auto mb-4 h-12 w-12 text-cyan-300" />
            <h2 className="text-3xl font-black text-cyan-100">
              No previous scan yet
            </h2>
            <p className="mx-auto mt-3 max-w-3xl leading-8 text-cyan-50/90">
              Run another scan later for the same website to compare
              before-after improvement. For now, this page shows current
              findings as new findings.
            </p>
          </section>
        ) : (
          <>
            <section className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {scoreCards.map((card) => (
                <div
                  key={card.label}
                  className={`rounded-3xl border p-6 ${changeClass(card.change)}`}
                >
                  <div className="mb-5 flex items-center justify-between gap-4">
                    <ChangeIcon change={card.change} />
                    <span className="rounded-full bg-slate-950/40 px-3 py-1 text-xs font-bold">
                      {changeTone(card.change)}
                    </span>
                  </div>

                  <p className="text-sm opacity-80">{card.label} change</p>
                  <p className="mt-2 text-4xl font-black">
                    {changeLabel(card.change)}
                  </p>
                  <p className="mt-2 text-sm">
                    {card.previous}/100 → {card.current}/100
                  </p>
                </div>
              ))}
            </section>

            <section className="mt-8 rounded-3xl border border-white/10 bg-white/[0.04] p-8">
              <div className="mb-6 flex items-center gap-3">
                <FileText className="h-7 w-7 text-cyan-300" />
                <h2 className="text-3xl font-black">Compared scans</h2>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <Link
                  href={`/dashboard/scans/${previousScan.id}`}
                  className={`rounded-3xl border p-6 ${scoreClass(Number(previousScan.overall_score ?? 0))}`}
                >
                  <p className="text-sm opacity-80">Previous scan</p>
                  <p className="mt-2 text-5xl font-black">
                    {Number(previousScan.overall_score ?? 0)}/100
                  </p>
                  <p className="mt-2 text-sm">
                    {formatDateTime(previousScan.created_at)}
                  </p>
                </Link>

                <Link
                  href={`/dashboard/scans/${currentScan.id}`}
                  className={`rounded-3xl border p-6 ${scoreClass(Number(currentScan.overall_score ?? 0))}`}
                >
                  <p className="text-sm opacity-80">Current scan</p>
                  <p className="mt-2 text-5xl font-black">
                    {Number(currentScan.overall_score ?? 0)}/100
                  </p>
                  <p className="mt-2 text-sm">
                    {formatDateTime(currentScan.created_at)}
                  </p>
                </Link>
              </div>
            </section>
          </>
        )}

        <section className="mt-8 grid gap-8 xl:grid-cols-3">
          <FindingList
            title="Fixed findings"
            icon={<CheckCircle2 className="h-7 w-7 text-emerald-300" />}
            findings={findingComparison.fixedFindings}
            emptyText="No fixed findings detected yet."
            tone="fixed"
          />

          <FindingList
            title="New findings"
            icon={<PlusCircle className="h-7 w-7 text-red-300" />}
            findings={findingComparison.newFindings}
            emptyText="No new findings detected."
            tone="new"
          />

          <FindingList
            title="Unchanged findings"
            icon={<MinusCircle className="h-7 w-7 text-slate-300" />}
            findings={findingComparison.unchangedFindings}
            emptyText="No unchanged findings detected."
            tone="same"
          />
        </section>

        <section className="mt-8 rounded-3xl border border-cyan-300/20 bg-cyan-300/10 p-8">
          <h2 className="text-3xl font-black text-cyan-100">
            How to use this with customers
          </h2>
          <p className="mt-4 max-w-4xl leading-8 text-cyan-50/90">
            Use this page to show before-after improvement. For agencies, this
            is useful after fixing headers, adding privacy pages, improving
            trust signals, and rerunning the scan. It helps customers understand
            progress without claiming this is a full audit or penetration test.
          </p>
        </section>
      </div>
    </main>
  );
}
