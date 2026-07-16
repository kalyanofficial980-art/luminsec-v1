import Link from "next/link";
import {
  AlertTriangle,
  ArrowLeft,
  BadgeCheck,
  CheckCircle2,
  ExternalLink,
  FileText,
  ShieldCheck,
  XCircle,
} from "lucide-react";
import { requireAdmin } from "@/lib/auth/route-access";
import {
  verifiedReportStatusClass,
  verifiedReportStatusLabel,
} from "@/lib/security/verified-paid-report";
import { updateVerifiedReportRequestAction } from "./actions";

type PageProps = {
  searchParams: Promise<{
    message?: string;
    status?: string;
  }>;
};

function text(value: unknown, fallback = "") {
  const normalized = String(value ?? "").trim();
  return normalized.length > 0 ? normalized : fallback;
}

function safeDate(value: unknown) {
  const date = value ? new Date(String(value)) : null;
  return date && !Number.isNaN(date.getTime())
    ? date.toLocaleString("en-IN")
    : "Not available";
}

function getJoinedScan(value: unknown) {
  if (Array.isArray(value)) return value[0];
  return value;
}

export default async function AdminVerifiedReportsPage({
  searchParams,
}: PageProps) {
  const params = await searchParams;
  const { supabase } = await requireAdmin();

  const requestedStatus = [
    "requested",
    "in_review",
    "approved",
    "rejected",
    "delivered",
  ].includes(text(params.status).toLowerCase())
    ? text(params.status).toLowerCase()
    : "requested";

  let requestsQuery = supabase
    .from("verified_report_requests")
    .select(
      "id, user_id, scan_result_id, status, customer_message, admin_notes, reviewed_at, delivered_at, created_at, updated_at, scan_results(id, url, domain, overall_score, score, risk_level, created_at)",
    )
    .order("created_at", { ascending: false })
    .limit(80);

  if (requestedStatus) {
    requestsQuery = requestsQuery.eq("status", requestedStatus);
  }

  const { data: requests, error } = await requestsQuery;

  const rows = requests ?? [];

  const counts = {
    visible: rows.length,
    requested: rows.filter((row: any) => row.status === "requested").length,
    approved: rows.filter(
      (row: any) => row.status === "approved" || row.status === "delivered",
    ).length,
    rejected: rows.filter((row: any) => row.status === "rejected").length,
  };

  return (
    <main className="min-h-screen bg-slate-950 p-6 text-white">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6">
          <Link
            href="/dashboard/admin/manual-review"
            className="inline-flex items-center gap-2 text-sm font-bold text-cyan-300 hover:text-cyan-200"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to manual review
          </Link>
        </div>

        <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-8">
          <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-start">
            <div>
              <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-400/10 ring-1 ring-cyan-300/30">
                <BadgeCheck className="h-8 w-8 text-cyan-300" />
              </div>

              <h1 className="text-4xl font-black tracking-tight md:text-5xl">
                Verified paid reports
              </h1>

              <p className="mt-4 max-w-3xl leading-8 text-slate-300">
                Admin workflow for approving, rejecting, and delivering paid
                report requests. Approve only after manual review is complete.
              </p>
            </div>

            <Link
              href="/dashboard/admin/manual-review"
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-cyan-300/20 bg-cyan-300/10 px-5 py-4 font-bold text-cyan-100 hover:bg-cyan-300/20"
            >
              Manual review queue
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
            {
              label: "Visible requests",
              value: counts.visible,
              icon: FileText,
            },
            {
              label: "Requested",
              value: counts.requested,
              icon: AlertTriangle,
            },
            {
              label: "Approved/delivered",
              value: counts.approved,
              icon: CheckCircle2,
            },
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
              { label: "Requested", value: "requested" },
              { label: "In review", value: "in_review" },
              { label: "Approved", value: "approved" },
              { label: "Delivered", value: "delivered" },
              { label: "Rejected", value: "rejected" },
            ].map((filter) => (
              <Link
                key={filter.value}
                href={`/dashboard/admin/verified-reports?status=${filter.value}`}
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
            rows.map((request: unknown, index: number) => {
              const scan = getJoinedScan(request.scan_results);
              const website = text(
                scan?.domain || scan?.url,
                "Unknown website",
              );

              return (
                <article
                  key={request.id}
                  className="rounded-3xl border border-white/10 bg-white/[0.04] p-6"
                >
                  <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-start">
                    <div>
                      <div className="mb-3 flex flex-wrap gap-2">
                        <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-black text-slate-300">
                          #{index + 1}
                        </span>
                        <span
                          className={`rounded-full border px-3 py-1 text-xs font-black ${verifiedReportStatusClass(request.status)}`}
                        >
                          {verifiedReportStatusLabel(request.status)}
                        </span>
                      </div>

                      <h2 className="text-2xl font-black text-white">
                        {website}
                      </h2>
                      <p className="mt-2 text-sm text-slate-400">
                        Requested: {safeDate(request.created_at)}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-3">
                      <Link
                        href={`/dashboard/scans/${request.scan_result_id}`}
                        className="inline-flex items-center justify-center gap-2 rounded-2xl border border-cyan-300/20 bg-cyan-300/10 px-4 py-3 text-sm font-black text-cyan-100 hover:bg-cyan-300/20"
                      >
                        Open report
                        <ExternalLink className="h-4 w-4" />
                      </Link>

                      <Link
                        href={`/dashboard/scans/${request.scan_result_id}/verified-report`}
                        className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 px-4 py-3 text-sm font-black text-white hover:bg-white/10"
                      >
                        Customer view
                        <ExternalLink className="h-4 w-4" />
                      </Link>
                    </div>
                  </div>

                  <div className="mt-5 grid gap-4 lg:grid-cols-2">
                    <div className="rounded-2xl border border-white/10 bg-slate-950 p-4">
                      <h3 className="font-black text-cyan-100">
                        Customer message
                      </h3>
                      <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-7 text-slate-300">
                        {text(request.customer_message, "No customer message.")}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-slate-950 p-4">
                      <h3 className="font-black text-cyan-100">Admin notes</h3>
                      <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-7 text-slate-300">
                        {text(request.admin_notes, "No admin notes yet.")}
                      </p>
                    </div>
                  </div>

                  <form
                    action={updateVerifiedReportRequestAction}
                    className="mt-5 rounded-2xl border border-white/10 bg-slate-950 p-4"
                  >
                    <input type="hidden" name="request_id" value={request.id} />

                    <label
                      className="text-sm font-black text-slate-300"
                      htmlFor={`status-${request.id}`}
                    >
                      Workflow status
                    </label>

                    <select
                      id={`status-${request.id}`}
                      name="status"
                      defaultValue={request.status}
                      className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none focus:border-cyan-300/50"
                    >
                      <option value="requested">Requested</option>
                      <option value="in_review">In review</option>
                      <option value="approved">Approved</option>
                      <option value="delivered">Delivered</option>
                      <option value="rejected">Rejected</option>
                    </select>

                    <label
                      className="mt-4 block text-sm font-black text-slate-300"
                      htmlFor={`notes-${request.id}`}
                    >
                      Admin notes
                    </label>

                    <textarea
                      id={`notes-${request.id}`}
                      name="admin_notes"
                      defaultValue={text(request.admin_notes)}
                      rows={3}
                      placeholder="Example: Manual review completed. Approved findings only will be used in paid report."
                      className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none focus:border-cyan-300/50"
                    />

                    <button
                      type="submit"
                      className="mt-4 inline-flex items-center justify-center gap-2 rounded-2xl bg-cyan-300 px-5 py-3 text-sm font-black text-slate-950 hover:bg-cyan-200"
                    >
                      <ShieldCheck className="h-4 w-4" />
                      Save workflow
                    </button>
                  </form>
                </article>
              );
            })
          ) : (
            <div className="rounded-3xl border border-emerald-300/20 bg-emerald-300/10 p-8">
              <CheckCircle2 className="h-8 w-8 text-emerald-300" />
              <h2 className="mt-4 text-2xl font-black text-emerald-100">
                No verified report requests in this status
              </h2>
              <p className="mt-3 leading-7 text-emerald-50/90">
                Requests will appear here after customers request a verified
                paid report.
              </p>
            </div>
          )}
        </section>

        <section className="mt-8 rounded-3xl border border-amber-300/20 bg-amber-300/10 p-8">
          <h2 className="text-2xl font-black text-amber-100">Delivery rule</h2>
          <p className="mt-4 max-w-4xl leading-8 text-amber-50/90">
            Deliver only after manual review. A verified paid report means
            reviewed evidence, not legal certification, compliance proof,
            exploit testing, or a penetration test.
          </p>
        </section>
      </div>
    </main>
  );
}
