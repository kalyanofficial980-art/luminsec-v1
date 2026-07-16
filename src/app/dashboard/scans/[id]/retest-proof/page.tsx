import Link from "next/link";
import { notFound } from "next/navigation";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  ExternalLink,
  FileText,
  GitCompare,
  ShieldCheck,
  XCircle,
} from "lucide-react";
import { requireDashboardUser } from "@/lib/auth/route-access";
import {
  calculateRetestProof,
  normalizeRetestSeverity,
  type RetestProofItem,
} from "@/lib/security/retest-proof";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

function normalizeText(value: unknown, fallback = "") {
  const text = String(value ?? "").trim();
  return text.length > 0 ? text : fallback;
}

function scoreClass(score: number) {
  if (score >= 85) return "text-emerald-300";
  if (score >= 65) return "text-amber-300";
  if (score >= 40) return "text-orange-300";
  return "text-red-300";
}

function severityClass(value: unknown) {
  const severity = normalizeRetestSeverity(value);

  if (severity === "critical")
    return "border-red-400/30 bg-red-400/10 text-red-100";
  if (severity === "high")
    return "border-orange-400/30 bg-orange-400/10 text-orange-100";
  if (severity === "medium")
    return "border-amber-400/30 bg-amber-400/10 text-amber-100";
  if (severity === "low")
    return "border-emerald-400/30 bg-emerald-400/10 text-emerald-100";

  return "border-slate-400/30 bg-slate-400/10 text-slate-200";
}

function statCard(
  label: string,
  value: number | string,
  tone: "good" | "warn" | "bad" | "neutral" = "neutral",
) {
  const toneClass =
    tone === "good"
      ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-100"
      : tone === "warn"
        ? "border-amber-400/20 bg-amber-400/10 text-amber-100"
        : tone === "bad"
          ? "border-red-400/20 bg-red-400/10 text-red-100"
          : "border-white/10 bg-slate-950/70 text-white";

  return (
    <div className={`rounded-3xl border p-6 ${toneClass}`}>
      <p className="text-sm opacity-80">{label}</p>
      <p className="mt-3 text-4xl font-black">{value}</p>
    </div>
  );
}

function findingList(
  title: string,
  items: RetestProofItem[],
  type: "fixed" | "open" | "new",
) {
  const Icon =
    type === "fixed" ? CheckCircle2 : type === "open" ? AlertTriangle : XCircle;
  const emptyText =
    type === "fixed"
      ? "No fixed findings detected between these two scans."
      : type === "open"
        ? "No still-open findings detected between these two scans."
        : "No newly detected findings in the current scan.";

  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
      <div className="mb-5 flex items-center gap-3">
        <Icon className="h-6 w-6 text-cyan-300" />
        <h2 className="text-2xl font-black text-white">{title}</h2>
      </div>

      {items.length > 0 ? (
        <div className="grid gap-4">
          {items.map((item) => (
            <div
              key={item.key}
              className="rounded-2xl border border-white/10 bg-slate-950 p-4"
            >
              <div className="mb-3 flex flex-wrap gap-2">
                <span
                  className={`rounded-full border px-3 py-1 text-xs font-black ${severityClass(item.severity)}`}
                >
                  {item.severity}
                </span>
                <span className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1 text-xs font-black text-cyan-100">
                  {item.category.replaceAll("_", " ")}
                </span>
              </div>

              <h3 className="font-black text-white">{item.title}</h3>
              <p className="mt-3 break-words font-mono text-xs leading-6 text-slate-400">
                {item.evidenceSummary}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <p className="leading-7 text-slate-400">{emptyText}</p>
      )}
    </div>
  );
}

export default async function RetestProofPage({ params }: PageProps) {
  const { id } = await params;
  const { supabase, user, profile } = await requireDashboardUser();

  let currentScanQuery = supabase
    .from("scan_results")
    .select(
      "id, user_id, website_id, url, domain, overall_score, score, risk_level, created_at",
    )
    .eq("id", id);

  if (profile.role !== "admin") {
    currentScanQuery = currentScanQuery.eq("user_id", user.id);
  }

  const { data: currentScan } = await currentScanQuery.maybeSingle();

  if (!currentScan) {
    notFound();
  }

  let previousScanQuery = supabase
    .from("scan_results")
    .select(
      "id, user_id, website_id, url, domain, overall_score, score, risk_level, created_at",
    )
    .neq("id", currentScan.id)
    .order("created_at", { ascending: false })
    .limit(1);

  if (currentScan.created_at) {
    previousScanQuery = previousScanQuery.lt(
      "created_at",
      currentScan.created_at,
    );
  }

  if (currentScan.website_id) {
    previousScanQuery = previousScanQuery.eq(
      "website_id",
      currentScan.website_id,
    );
  } else if (currentScan.domain) {
    previousScanQuery = previousScanQuery.eq("domain", currentScan.domain);
  } else {
    previousScanQuery = previousScanQuery.eq("url", currentScan.url);
  }

  if (profile.role !== "admin") {
    previousScanQuery = previousScanQuery.eq("user_id", user.id);
  }

  const { data: previousScans } = await previousScanQuery;
  const previousScan = (previousScans ?? [])[0];

  async function loadFindings(scanId?: string) {
    if (!scanId) {
      return [];
    }

    let query = supabase
      .from("scan_findings")
      .select(
        "id, category, severity, title, description, recommendation, evidence, created_at",
      )
      .eq("scan_result_id", scanId)
      .order("created_at", { ascending: true });

    if (profile.role !== "admin") {
      query = query.eq("user_id", user.id);
    }

    const { data } = await query;

    return data ?? [];
  }

  const [previousFindings, currentFindings] = await Promise.all([
    loadFindings(previousScan?.id),
    loadFindings(currentScan.id),
  ]);

  const proof = calculateRetestProof({
    previousFindings,
    currentFindings,
  });

  const websiteLabel = normalizeText(
    currentScan.domain || currentScan.url,
    "Website",
  );
  const currentScore = Number(
    currentScan.overall_score ?? currentScan.score ?? 0,
  );
  const previousScore = Number(
    previousScan?.overall_score ?? previousScan?.score ?? 0,
  );
  const scoreChange = Number.isFinite(currentScore - previousScore)
    ? Math.round(currentScore - previousScore)
    : 0;

  return (
    <main className="min-h-screen bg-slate-950 p-6 text-white">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
          <Link
            href={`/dashboard/scans/${currentScan.id}`}
            className="inline-flex items-center gap-2 text-sm font-bold text-cyan-300 hover:text-cyan-200"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to report
          </Link>

          <Link
            href={`/dashboard/scans/${currentScan.id}/comparison`}
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-cyan-300/20 bg-cyan-300/10 px-5 py-4 text-sm font-black text-cyan-100 hover:bg-cyan-300/20"
          >
            Comparison
            <ExternalLink className="h-4 w-4" />
          </Link>
        </div>

        <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-8">
          <div className="flex flex-col justify-between gap-8 xl:flex-row xl:items-start">
            <div>
              <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-3xl bg-cyan-400/10 ring-1 ring-cyan-300/30">
                <GitCompare className="h-9 w-9 text-cyan-300" />
              </div>

              <p className="text-sm font-black uppercase tracking-[0.3em] text-cyan-300">
                Retest proof
              </p>

              <h1 className="mt-4 text-4xl font-black tracking-tight md:text-6xl">
                {websiteLabel}
              </h1>

              <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-300">
                This page compares the current scan against the previous scan
                for the same website and shows what appears fixed, still open,
                or newly detected.
              </p>

              <div className="mt-5 grid gap-2 text-sm text-slate-400">
                <p>
                  Current scan:{" "}
                  {currentScan.created_at
                    ? new Date(currentScan.created_at).toLocaleString("en-IN")
                    : "Not available"}
                </p>
                <p>
                  Previous scan:{" "}
                  {previousScan?.created_at
                    ? new Date(previousScan.created_at).toLocaleString("en-IN")
                    : "No previous scan found"}
                </p>
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-slate-950 p-6 text-center">
              <p className="text-sm font-bold text-slate-400">
                Retest proof score
              </p>
              <p
                className={`mt-3 text-7xl font-black ${scoreClass(proof.retestProofScore)}`}
              >
                {proof.retestProofScore}
              </p>
              <p className="mt-2 text-sm font-bold text-slate-500">
                out of 100
              </p>

              <div className="mt-5 rounded-full border border-cyan-300/20 bg-cyan-300/10 px-5 py-3 text-sm font-black text-cyan-100">
                {proof.statusLabel}
              </div>
            </div>
          </div>
        </section>

        {!previousScan ? (
          <section className="mt-8 rounded-3xl border border-amber-300/20 bg-amber-300/10 p-8">
            <AlertTriangle className="h-8 w-8 text-amber-200" />
            <h2 className="mt-4 text-2xl font-black text-amber-100">
              No previous scan found
            </h2>
            <p className="mt-3 max-w-4xl leading-8 text-amber-50/90">
              This scan is currently a baseline. Run another scan for the same
              website after fixes to generate retest proof.
            </p>
          </section>
        ) : null}

        <section className="mt-8 grid gap-4 md:grid-cols-3 xl:grid-cols-6">
          {statCard("Previous findings", proof.previousFindingCount)}
          {statCard("Current findings", proof.currentFindingCount)}
          {statCard("Fixed", proof.fixedCount, "good")}
          {statCard(
            "Still open",
            proof.stillOpenCount,
            proof.stillOpenCount > 0 ? "warn" : "good",
          )}
          {statCard("New", proof.newCount, proof.newCount > 0 ? "bad" : "good")}
          {statCard(
            "Improvement",
            `${proof.improvementPercent}%`,
            proof.improvementPercent > 0 ? "good" : "neutral",
          )}
        </section>

        <section className="mt-8 grid gap-8 lg:grid-cols-3">
          <div className="rounded-3xl border border-emerald-300/20 bg-emerald-300/10 p-6">
            <CheckCircle2 className="h-7 w-7 text-emerald-300" />
            <p className="mt-3 text-sm text-emerald-50/80">High-risk fixed</p>
            <p className="mt-2 text-4xl font-black text-emerald-100">
              {proof.highRiskFixedCount}
            </p>
          </div>

          <div className="rounded-3xl border border-amber-300/20 bg-amber-300/10 p-6">
            <AlertTriangle className="h-7 w-7 text-amber-200" />
            <p className="mt-3 text-sm text-amber-50/80">
              High-risk still open
            </p>
            <p className="mt-2 text-4xl font-black text-amber-100">
              {proof.highRiskStillOpenCount}
            </p>
          </div>

          <div className="rounded-3xl border border-red-300/20 bg-red-300/10 p-6">
            <XCircle className="h-7 w-7 text-red-200" />
            <p className="mt-3 text-sm text-red-50/80">High-risk new</p>
            <p className="mt-2 text-4xl font-black text-red-100">
              {proof.highRiskNewCount}
            </p>
          </div>
        </section>

        <section className="mt-8 rounded-3xl border border-white/10 bg-white/[0.04] p-8">
          <div className="mb-6 flex items-center gap-3">
            <FileText className="h-7 w-7 text-cyan-300" />
            <h2 className="text-3xl font-black">Score movement</h2>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {statCard(
              "Previous score",
              previousScan ? Math.round(previousScore || 0) : "N/A",
            )}
            {statCard("Current score", Math.round(currentScore || 0))}
            {statCard(
              "Score change",
              previousScan
                ? `${scoreChange >= 0 ? "+" : ""}${scoreChange}`
                : "N/A",
              scoreChange > 0 ? "good" : scoreChange < 0 ? "bad" : "neutral",
            )}
          </div>
        </section>

        <section className="mt-8 grid gap-8">
          {findingList("Fixed findings", proof.fixed, "fixed")}
          {findingList("Still-open findings", proof.stillOpen, "open")}
          {findingList("Newly detected findings", proof.newlyDetected, "new")}
        </section>

        <section className="mt-8 rounded-3xl border border-white/10 bg-white/[0.04] p-8">
          <div className="mb-6 flex items-center gap-3">
            <ShieldCheck className="h-7 w-7 text-cyan-300" />
            <h2 className="text-3xl font-black">Retest proof notes</h2>
          </div>

          <div className="grid gap-3">
            {proof.notes.map((note) => (
              <p
                key={note}
                className="rounded-2xl border border-white/10 bg-slate-950 p-4 leading-7 text-slate-300"
              >
                {note}
              </p>
            ))}
          </div>
        </section>

        <section className="mt-8 rounded-3xl border border-amber-300/20 bg-amber-300/10 p-8">
          <h2 className="text-2xl font-black text-amber-100">
            Important scope note
          </h2>
          <p className="mt-4 max-w-4xl leading-8 text-amber-50/90">
            Retest proof is based on visible scan findings and normalized
            root-cause matching. It is improvement evidence only. It is not
            legal advice, compliance certification, exploit testing,
            vulnerability exploitation, login testing, brute force testing, or a
            penetration test.
          </p>
        </section>
      </div>
    </main>
  );
}
