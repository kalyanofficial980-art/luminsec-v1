import Link from "next/link";
import { notFound } from "next/navigation";
import {
  AlertTriangle,
  ArrowLeft,
  BadgeCheck,
  CheckCircle2,
  ClipboardCheck,
  CreditCard,
  ShieldCheck,
  XCircle,
} from "lucide-react";
import { requireDashboardUser } from "@/lib/auth/route-access";
import {
  calculateVerifiedReportReadiness,
  verifiedReportStatusClass,
  verifiedReportStatusLabel,
} from "@/lib/security/verified-paid-report";
import { requestVerifiedPaidReportAction } from "./actions";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
  searchParams: Promise<{
    message?: string;
  }>;
};

function text(value: unknown, fallback = "") {
  const normalized = String(value ?? "").trim();
  return normalized.length > 0 ? normalized : fallback;
}

function safeDate(value: unknown) {
  const date = value ? new Date(String(value)) : null;
  return date && !Number.isNaN(date.getTime()) ? date.toLocaleString("en-IN") : "Not available";
}

function statCard(label: string, value: string | number, tone: "good" | "warn" | "bad" | "neutral" = "neutral") {
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

export default async function VerifiedReportRequestPage({ params, searchParams }: PageProps) {
  const { id } = await params;
  const query = await searchParams;
  const { supabase, user, profile } = await requireDashboardUser();

  let scanQuery = supabase
    .from("scan_results")
    .select("id, user_id, url, domain, overall_score, score, risk_level, created_at")
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
    .select("id, category, severity, title, manual_review_status, verified_for_paid_report")
    .eq("scan_result_id", scan.id);

  if (profile.role !== "admin") {
    findingsQuery = findingsQuery.eq("user_id", user.id);
  }

  const { data: findings } = await findingsQuery;

  const { data: request } = await supabase
    .from("verified_report_requests")
    .select("id, status, customer_message, admin_notes, reviewed_at, delivered_at, created_at, updated_at")
    .eq("scan_result_id", scan.id)
    .eq("user_id", scan.user_id)
    .maybeSingle();

  const rows = findings ?? [];
  const approvedCount = rows.filter((finding) => finding.verified_for_paid_report || finding.manual_review_status === "approved").length;
  const pendingCount = rows.filter((finding) => !finding.manual_review_status || finding.manual_review_status === "pending").length;
  const rejectedCount = rows.filter((finding) => finding.manual_review_status === "rejected").length;

  const readiness = calculateVerifiedReportReadiness({
    requestStatus: request?.status,
    totalFindingCount: rows.length,
    approvedFindingCount: approvedCount,
    pendingFindingCount: pendingCount,
    rejectedFindingCount: rejectedCount,
  });

  const websiteLabel = text(scan.domain || scan.url, "Website");

  return (
    <main className="min-h-screen bg-slate-950 p-6 text-white">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6">
          <Link
            href={`/dashboard/scans/${scan.id}`}
            className="inline-flex items-center gap-2 text-sm font-bold text-cyan-300 hover:text-cyan-200"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to report
          </Link>
        </div>

        <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-8">
          <div className="flex flex-col justify-between gap-8 xl:flex-row xl:items-start">
            <div>
              <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-3xl bg-cyan-400/10 ring-1 ring-cyan-300/30">
                <BadgeCheck className="h-9 w-9 text-cyan-300" />
              </div>

              <p className="text-sm font-black uppercase tracking-[0.3em] text-cyan-300">
                Verified paid report
              </p>

              <h1 className="mt-4 text-4xl font-black tracking-tight md:text-6xl">
                {websiteLabel}
              </h1>

              <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-300">
                Request a manual-reviewed paid report. Admin-approved findings become verified evidence.
                Pending and rejected findings are not treated as verified.
              </p>

              <p className="mt-5 text-sm text-slate-500">
                Scan date: {safeDate(scan.created_at)}
              </p>
            </div>

            <div className="rounded-3xl border border-white/10 bg-slate-950 p-6 text-center">
              <p className="text-sm font-bold text-slate-400">Request status</p>
              <div className={`mt-4 rounded-full border px-5 py-3 text-sm font-black ${verifiedReportStatusClass(readiness.status)}`}>
                {verifiedReportStatusLabel(readiness.status)}
              </div>

              <p className="mt-6 text-sm font-bold text-slate-400">Verified evidence</p>
              <p className="mt-3 text-6xl font-black text-cyan-300">
                {readiness.verifiedPercent}%
              </p>
            </div>
          </div>
        </section>

        {query.message ? (
          <section className="mt-6 rounded-2xl border border-cyan-300/20 bg-cyan-300/10 p-4 text-cyan-50">
            {query.message}
          </section>
        ) : null}

        <section className="mt-8 grid gap-4 md:grid-cols-4">
          {statCard("Total findings", readiness.totalFindingCount)}
          {statCard("Approved", readiness.approvedFindingCount, readiness.approvedFindingCount > 0 ? "good" : "neutral")}
          {statCard("Pending review", readiness.pendingFindingCount, readiness.pendingFindingCount > 0 ? "warn" : "good")}
          {statCard("Rejected", readiness.rejectedFindingCount, readiness.rejectedFindingCount > 0 ? "bad" : "neutral")}
        </section>

        {readiness.readyForDelivery ? (
          <section className="mt-8 rounded-3xl border border-emerald-300/20 bg-emerald-300/10 p-8">
            <CheckCircle2 className="h-8 w-8 text-emerald-300" />
            <h2 className="mt-4 text-2xl font-black text-emerald-100">
              Ready for verified paid report delivery
            </h2>
            <p className="mt-3 max-w-4xl leading-8 text-emerald-50/90">
              This report request is approved and has manually approved findings.
              Use the main report, print page, retest proof page, and admin notes for customer delivery.
            </p>
          </section>
        ) : (
          <section className="mt-8 rounded-3xl border border-amber-300/20 bg-amber-300/10 p-8">
            <AlertTriangle className="h-8 w-8 text-amber-200" />
            <h2 className="mt-4 text-2xl font-black text-amber-100">
              Not ready for verified delivery yet
            </h2>
            <p className="mt-3 max-w-4xl leading-8 text-amber-50/90">
              A verified paid report should be delivered only after manual review is complete and admin approval is given.
            </p>
          </section>
        )}

        {request ? (
          <section className="mt-8 rounded-3xl border border-white/10 bg-white/[0.04] p-8">
            <div className="mb-6 flex items-center gap-3">
              <ClipboardCheck className="h-7 w-7 text-cyan-300" />
              <h2 className="text-3xl font-black">Existing request</h2>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-slate-950 p-5">
                <p className="text-sm text-slate-400">Requested</p>
                <p className="mt-2 font-bold text-white">{safeDate(request.created_at)}</p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-slate-950 p-5">
                <p className="text-sm text-slate-400">Last updated</p>
                <p className="mt-2 font-bold text-white">{safeDate(request.updated_at)}</p>
              </div>
            </div>

            {request.customer_message ? (
              <div className="mt-5 rounded-2xl border border-white/10 bg-slate-950 p-5">
                <p className="text-sm font-black text-cyan-100">Customer message</p>
                <p className="mt-3 leading-7 text-slate-300">{request.customer_message}</p>
              </div>
            ) : null}

            {request.admin_notes ? (
              <div className="mt-5 rounded-2xl border border-white/10 bg-slate-950 p-5">
                <p className="text-sm font-black text-cyan-100">Admin notes</p>
                <p className="mt-3 leading-7 text-slate-300">{request.admin_notes}</p>
              </div>
            ) : null}
          </section>
        ) : (
          <section className="mt-8 rounded-3xl border border-white/10 bg-white/[0.04] p-8">
            <div className="mb-6 flex items-center gap-3">
              <CreditCard className="h-7 w-7 text-cyan-300" />
              <h2 className="text-3xl font-black">Request verified paid report</h2>
            </div>

            <form action={requestVerifiedPaidReportAction} className="grid gap-4">
              <input type="hidden" name="scan_id" value={scan.id} />

              <label className="text-sm font-black text-slate-300" htmlFor="customer-message">
                Message for reviewer
              </label>

              <textarea
                id="customer-message"
                name="customer_message"
                rows={4}
                placeholder="Example: Please review this scan for a paid customer-ready report."
                className="rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none focus:border-cyan-300/50"
              />

              <button
                type="submit"
                className="inline-flex w-fit items-center justify-center gap-2 rounded-2xl bg-cyan-300 px-5 py-3 text-sm font-black text-slate-950 hover:bg-cyan-200"
              >
                <ShieldCheck className="h-4 w-4" />
                Request verified report
              </button>
            </form>
          </section>
        )}

        <section className="mt-8 rounded-3xl border border-white/10 bg-white/[0.04] p-8">
          <h2 className="text-3xl font-black">Verified report rules</h2>

          <div className="mt-6 grid gap-3">
            {readiness.notes.map((note) => (
              <p key={note} className="rounded-2xl border border-white/10 bg-slate-950 p-4 leading-7 text-slate-300">
                {note}
              </p>
            ))}
          </div>
        </section>

        <section className="mt-8 rounded-3xl border border-amber-300/20 bg-amber-300/10 p-8">
          <h2 className="text-2xl font-black text-amber-100">Important scope note</h2>
          <p className="mt-4 max-w-4xl leading-8 text-amber-50/90">
            Verified paid report means the included evidence was manually reviewed for report delivery.
            It is not legal advice, legal compliance certification, exploit testing, vulnerability exploitation,
            login testing, brute force testing, or a penetration test.
          </p>
        </section>
      </div>
    </main>
  );
}