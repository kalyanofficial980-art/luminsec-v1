import Link from "next/link";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  ClipboardCheck,
  ExternalLink,
  FileText,
  ShieldCheck,
  XCircle,
} from "lucide-react";
import { requireAdmin } from "@/lib/auth/route-access";
import { updateFindingManualReviewAction } from "./actions";

type PageProps = {
  searchParams: Promise<{
    message?: string;
    status?: string;
  }>;
};

function normalizeText(value: unknown, fallback = "") {
  const text = String(value ?? "").trim();
  return text.length > 0 ? text : fallback;
}

function statusClass(status: unknown) {
  const value = normalizeText(status, "pending").toLowerCase();

  if (value === "approved")
    return "border-emerald-400/30 bg-emerald-400/10 text-emerald-100";
  if (value === "rejected")
    return "border-red-400/30 bg-red-400/10 text-red-100";

  return "border-amber-400/30 bg-amber-400/10 text-amber-100";
}

function severityClass(value: unknown) {
  const severity = normalizeText(value, "review").toLowerCase();

  if (severity.includes("critical"))
    return "border-red-400/30 bg-red-400/10 text-red-100";
  if (severity.includes("high"))
    return "border-orange-400/30 bg-orange-400/10 text-orange-100";
  if (severity.includes("medium"))
    return "border-amber-400/30 bg-amber-400/10 text-amber-100";
  if (severity.includes("low"))
    return "border-emerald-400/30 bg-emerald-400/10 text-emerald-100";

  return "border-slate-400/30 bg-slate-400/10 text-slate-200";
}

export default async function ManualReviewQueuePage({
  searchParams,
}: PageProps) {
  const params = await searchParams;
  const { supabase } = await requireAdmin();

  const requestedStatus = ["pending", "approved", "rejected"].includes(
    normalizeText(params.status).toLowerCase(),
  )
    ? normalizeText(params.status).toLowerCase()
    : "pending";

  let findingsQuery = supabase
    .from("scan_findings")
    .select(
      "id, scan_result_id, user_id, category, severity, title, description, recommendation, evidence, created_at, manual_review_status, manual_review_notes, manual_reviewed_at, verified_for_paid_report",
    )
    .order("created_at", { ascending: false })
    .limit(60);

  if (requestedStatus === "pending") {
    findingsQuery = findingsQuery.or(
      "manual_review_status.eq.pending,manual_review_status.is.null",
    );
  } else {
    findingsQuery = findingsQuery.eq("manual_review_status", requestedStatus);
  }

  const { data: findings, error } = await findingsQuery;

  const rows = findings ?? [];
  const scanIds = Array.from(
    new Set(
      rows
        .map((finding) => normalizeText(finding.scan_result_id))
        .filter(Boolean),
    ),
  );

  const { data: scans } =
    scanIds.length > 0
      ? await supabase
          .from("scan_results")
          .select(
            "id, url, domain, overall_score, score, risk_level, created_at",
          )
          .in("id", scanIds)
      : { data: [] };

  const scanMap = new Map((scans ?? []).map((scan) => [scan.id, scan]));

  const counts = {
    visible: rows.length,
    approved: rows.filter(
      (finding) => finding.manual_review_status === "approved",
    ).length,
    rejected: rows.filter(
      (finding) => finding.manual_review_status === "rejected",
    ).length,
    pending: rows.filter(
      (finding) =>
        !finding.manual_review_status ||
        finding.manual_review_status === "pending",
    ).length,
  };

  return (
    <main className="min-h-screen bg-slate-950 p-6 text-white">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6">
          <Link
            href="/dashboard/admin/access-audit"
            className="inline-flex items-center gap-2 text-sm font-bold text-cyan-300 hover:text-cyan-200"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to admin audit
          </Link>
        </div>

        <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-8">
          <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-start">
            <div>
              <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-400/10 ring-1 ring-cyan-300/30">
                <ClipboardCheck className="h-8 w-8 text-cyan-300" />
              </div>

              <h1 className="text-4xl font-black tracking-tight md:text-5xl">
                Manual review queue
              </h1>

              <p className="mt-4 max-w-3xl leading-8 text-slate-300">
                Admin-only queue for reviewing findings before a paid report is
                treated as verified. Approve only findings with clear evidence.
                Reject noisy or incorrect findings.
              </p>
            </div>

            <Link
              href="/dashboard/admin/subscriptions"
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-cyan-300/20 bg-cyan-300/10 px-5 py-4 font-bold text-cyan-100 hover:bg-cyan-300/20"
            >
              Plan approvals
              <ExternalLink className="h-5 w-5" />
            </Link>
          </div>
        </section>

        {params.message ? (
          <section className="mt-6 rounded-2xl border border-cyan-300/20 bg-cyan-300/10 p-4 text-cyan-50">
            {params.message}
          </section>
        ) : null}

        {error ? (
          <section className="mt-6 rounded-2xl border border-red-400/20 bg-red-400/10 p-4 text-red-100">
            Database message: {error.message}
          </section>
        ) : null}

        <section className="mt-8 grid gap-4 md:grid-cols-4">
          {[
            { label: "Visible queue", value: counts.visible, icon: FileText },
            { label: "Pending", value: counts.pending, icon: AlertTriangle },
            { label: "Approved", value: counts.approved, icon: CheckCircle2 },
            { label: "Rejected", value: counts.rejected, icon: XCircle },
          ].map((card) => (
            <div
              key={card.label}
              className="rounded-3xl border border-white/10 bg-slate-950/70 p-6"
            >
              <card.icon className="mb-4 h-7 w-7 text-cyan-300" />
              <p className="text-sm text-slate-400">{card.label}</p>
              <p className="mt-2 text-3xl font-black text-white">
                {card.value}
              </p>
            </div>
          ))}
        </section>

        <section className="mt-8 rounded-3xl border border-white/10 bg-white/[0.04] p-6">
          <div className="flex flex-wrap gap-3">
            {[
              { label: "Pending", value: "pending" },
              { label: "Approved", value: "approved" },
              { label: "Rejected", value: "rejected" },
            ].map((filter) => (
              <Link
                key={filter.value}
                href={`/dashboard/admin/manual-review?status=${filter.value}`}
                className={`rounded-2xl border px-4 py-3 text-sm font-black ${
                  requestedStatus === filter.value
                    ? "border-cyan-300/40 bg-cyan-300/20 text-cyan-50"
                    : "border-white/10 bg-slate-950 text-slate-300 hover:bg-white/10"
                }`}
              >
                {filter.label}
              </Link>
            ))}
          </div>
        </section>

        <section className="mt-8 grid gap-6">
          {rows.length > 0 ? (
            rows.map((finding, index) => {
              const scan = scanMap.get(finding.scan_result_id);
              const status = normalizeText(
                finding.manual_review_status,
                "pending",
              );
              const reportHref = finding.scan_result_id
                ? `/dashboard/scans/${finding.scan_result_id}`
                : "/dashboard/scans";

              return (
                <article
                  key={finding.id}
                  className="rounded-3xl border border-white/10 bg-white/[0.04] p-6"
                >
                  <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
                    <div>
                      <div className="mb-3 flex flex-wrap gap-2">
                        <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-black text-slate-300">
                          #{index + 1}
                        </span>
                        <span
                          className={`rounded-full border px-3 py-1 text-xs font-black ${severityClass(finding.severity)}`}
                        >
                          {normalizeText(finding.severity, "review")}
                        </span>
                        <span
                          className={`rounded-full border px-3 py-1 text-xs font-black ${statusClass(status)}`}
                        >
                          {status}
                        </span>
                        {finding.verified_for_paid_report ? (
                          <span className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-xs font-black text-emerald-100">
                            verified for paid report
                          </span>
                        ) : null}
                      </div>

                      <h2 className="text-2xl font-black text-white">
                        {normalizeText(finding.title, "Finding")}
                      </h2>

                      <p className="mt-2 text-sm text-slate-400">
                        {normalizeText(
                          scan?.domain || scan?.url,
                          "Unknown website",
                        )}
                      </p>
                    </div>

                    <Link
                      href={reportHref}
                      className="inline-flex items-center justify-center gap-2 rounded-2xl border border-cyan-300/20 bg-cyan-300/10 px-4 py-3 text-sm font-black text-cyan-100 hover:bg-cyan-300/20"
                    >
                      Open report
                      <ExternalLink className="h-4 w-4" />
                    </Link>
                  </div>

                  <div className="mt-5 grid gap-4 lg:grid-cols-2">
                    <div className="rounded-2xl border border-white/10 bg-slate-950 p-4">
                      <h3 className="font-black text-cyan-100">
                        Finding evidence
                      </h3>
                      <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-7 text-slate-300">
                        {normalizeText(
                          finding.evidence,
                          "No evidence stored. Review carefully before approving.",
                        )}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-slate-950 p-4">
                      <h3 className="font-black text-cyan-100">
                        Recommendation
                      </h3>
                      <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-7 text-slate-300">
                        {normalizeText(
                          finding.recommendation,
                          "No recommendation stored.",
                        )}
                      </p>
                    </div>
                  </div>

                  <form
                    action={updateFindingManualReviewAction}
                    className="mt-5 rounded-2xl border border-white/10 bg-slate-950 p-4"
                  >
                    <input type="hidden" name="finding_id" value={finding.id} />

                    <label
                      className="text-sm font-black text-slate-300"
                      htmlFor={`status-${finding.id}`}
                    >
                      Review decision
                    </label>

                    <select
                      id={`status-${finding.id}`}
                      name="manual_review_status"
                      defaultValue={status}
                      className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none focus:border-cyan-300/50"
                    >
                      <option value="pending">Pending</option>
                      <option value="approved">Approve as verified</option>
                      <option value="rejected">Reject / false positive</option>
                    </select>

                    <label
                      className="mt-4 block text-sm font-black text-slate-300"
                      htmlFor={`notes-${finding.id}`}
                    >
                      Reviewer notes
                    </label>

                    <textarea
                      id={`notes-${finding.id}`}
                      name="manual_review_notes"
                      defaultValue={normalizeText(finding.manual_review_notes)}
                      rows={3}
                      placeholder="Example: Evidence confirmed from headers. Safe to include in paid report."
                      className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none focus:border-cyan-300/50"
                    />

                    <button
                      type="submit"
                      className="mt-4 inline-flex items-center justify-center gap-2 rounded-2xl bg-cyan-300 px-5 py-3 text-sm font-black text-slate-950 hover:bg-cyan-200"
                    >
                      <ShieldCheck className="h-4 w-4" />
                      Save review
                    </button>
                  </form>
                </article>
              );
            })
          ) : (
            <div className="rounded-3xl border border-emerald-300/20 bg-emerald-300/10 p-8">
              <CheckCircle2 className="h-8 w-8 text-emerald-300" />
              <h2 className="mt-4 text-2xl font-black text-emerald-100">
                No findings in this queue
              </h2>
              <p className="mt-3 leading-7 text-emerald-50/90">
                This review status currently has no findings.
              </p>
            </div>
          )}
        </section>

        <section className="mt-8 rounded-3xl border border-amber-300/20 bg-amber-300/10 p-8">
          <h2 className="text-2xl font-black text-amber-100">
            Manual review rule
          </h2>
          <p className="mt-4 max-w-4xl leading-8 text-amber-50/90">
            Approved findings can be used for verified paid reports. Pending and
            rejected findings should not be presented as verified evidence. This
            review does not create legal certification, compliance proof,
            exploit testing, or a penetration test.
          </p>
        </section>
      </div>
    </main>
  );
}



