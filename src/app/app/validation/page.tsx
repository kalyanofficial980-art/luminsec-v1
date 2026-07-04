import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowLeft,
  Building2,
  CheckCircle2,
  ClipboardList,
  MessageSquare,
  Plus,
  ShieldCheck,
  Target,
} from "lucide-react";
import { brand } from "@/config/brand";
import { createClient } from "@/lib/supabase/server";
import { addCustomerFeedback } from "./actions";
import { formatDateTime } from "@/lib/utils/risk";

const statusLabels: Record<string, string> = {
  not_contacted: "Not contacted",
  contacted: "Contacted",
  replied: "Replied",
  demo_booked: "Demo booked",
  feedback_received: "Feedback received",
  paid_pilot: "Paid pilot",
  rejected: "Rejected",
};

const statusClasses: Record<string, string> = {
  not_contacted: "border-slate-400/20 bg-slate-400/10 text-slate-200",
  contacted: "border-blue-400/20 bg-blue-400/10 text-blue-100",
  replied: "border-cyan-400/20 bg-cyan-400/10 text-cyan-100",
  demo_booked: "border-purple-400/20 bg-purple-400/10 text-purple-100",
  feedback_received: "border-amber-400/20 bg-amber-400/10 text-amber-100",
  paid_pilot: "border-emerald-400/20 bg-emerald-400/10 text-emerald-100",
  rejected: "border-red-400/20 bg-red-400/10 text-red-100",
};

export default async function CustomerValidationPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: feedbackRows, error } = await supabase
    .from("customer_feedback")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const totalLeads = feedbackRows?.length ?? 0;
  const paidPilots = feedbackRows?.filter((row) => row.is_paid_pilot).length ?? 0;
  const demoBooked =
    feedbackRows?.filter((row) => row.status === "demo_booked" || row.status === "paid_pilot").length ?? 0;
  const replies =
    feedbackRows?.filter(
      (row) =>
        row.status === "replied" ||
        row.status === "demo_booked" ||
        row.status === "feedback_received" ||
        row.status === "paid_pilot"
    ).length ?? 0;

  return (
    <main className="min-h-screen bg-slate-950 p-6 text-white">
      <div className="mx-auto max-w-7xl">
        <Link
          href="/app"
          className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-slate-300 hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to SaaS dashboard
        </Link>

        <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-8">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-400/10 ring-1 ring-cyan-300/30">
              <Target className="h-6 w-6 text-cyan-300" />
            </div>
            <div>
              <h1 className="text-4xl font-black">Customer validation tracker</h1>
              <p className="text-slate-400">
                {brand.name} SaaS pilot feedback and first customer proof
              </p>
            </div>
          </div>

          <p className="max-w-3xl leading-8 text-slate-300">
            Track your first 10 customer conversations, objections, feedback, demo status,
            and paid pilot opportunities. This is for SaaS validation, not mobile app tracking.
          </p>

          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-3xl border border-white/10 bg-slate-950 p-6">
              <p className="text-sm text-slate-400">Total leads</p>
              <p className="mt-2 text-4xl font-black">{totalLeads}</p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-slate-950 p-6">
              <p className="text-sm text-slate-400">Replies</p>
              <p className="mt-2 text-4xl font-black">{replies}</p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-slate-950 p-6">
              <p className="text-sm text-slate-400">Demo booked</p>
              <p className="mt-2 text-4xl font-black">{demoBooked}</p>
            </div>
            <div className="rounded-3xl border border-cyan-300/20 bg-cyan-300/10 p-6">
              <p className="text-sm text-cyan-100">Paid pilots</p>
              <p className="mt-2 text-4xl font-black">{paidPilots}</p>
            </div>
          </div>
        </section>

        {params.message ? (
          <div className="mt-6 rounded-3xl border border-cyan-300/20 bg-cyan-300/10 p-5 text-cyan-100">
            {params.message}
          </div>
        ) : null}

        {error ? (
          <div className="mt-6 rounded-3xl border border-red-300/20 bg-red-300/10 p-5 text-red-100">
            {error.message}
          </div>
        ) : null}

        <section className="mt-8 grid gap-8 lg:grid-cols-[0.85fr_1.15fr]">
          <form action={addCustomerFeedback} className="rounded-3xl border border-white/10 bg-white/[0.04] p-8">
            <div className="mb-6 flex items-center gap-3">
              <Plus className="h-7 w-7 text-cyan-300" />
              <h2 className="text-3xl font-black">Add validation note</h2>
            </div>

            <div className="grid gap-4">
              <label className="grid gap-2">
                <span className="text-sm font-semibold text-slate-300">Business name *</span>
                <input
                  name="business_name"
                  placeholder="Example: Sri Lakshmi Clinic"
                  className="rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none focus:border-cyan-300"
                />
              </label>

              <label className="grid gap-2">
                <span className="text-sm font-semibold text-slate-300">Website URL</span>
                <input
                  name="website_url"
                  placeholder="https://example.com"
                  className="rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none focus:border-cyan-300"
                />
              </label>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="grid gap-2">
                  <span className="text-sm font-semibold text-slate-300">Contact channel</span>
                  <select
                    name="contact_channel"
                    className="rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none focus:border-cyan-300"
                  >
                    <option value="">Select</option>
                    <option value="whatsapp">WhatsApp</option>
                    <option value="email">Email</option>
                    <option value="linkedin">LinkedIn</option>
                    <option value="phone">Phone</option>
                    <option value="direct">Direct</option>
                  </select>
                </label>

                <label className="grid gap-2">
                  <span className="text-sm font-semibold text-slate-300">Lead type</span>
                  <select
                    name="lead_type"
                    className="rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none focus:border-cyan-300"
                  >
                    <option value="">Select</option>
                    <option value="business_owner">Business owner</option>
                    <option value="web_agency">Web agency</option>
                    <option value="freelancer">Freelancer</option>
                    <option value="clinic">Clinic</option>
                    <option value="coaching_center">Coaching center</option>
                    <option value="startup">Startup</option>
                  </select>
                </label>
              </div>

              <label className="grid gap-2">
                <span className="text-sm font-semibold text-slate-300">Status</span>
                <select
                  name="status"
                  className="rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none focus:border-cyan-300"
                >
                  <option value="not_contacted">Not contacted</option>
                  <option value="contacted">Contacted</option>
                  <option value="replied">Replied</option>
                  <option value="demo_booked">Demo booked</option>
                  <option value="feedback_received">Feedback received</option>
                  <option value="paid_pilot">Paid pilot</option>
                  <option value="rejected">Rejected</option>
                </select>
              </label>

              <label className="grid gap-2">
                <span className="text-sm font-semibold text-slate-300">Feedback</span>
                <textarea
                  name="feedback"
                  rows={4}
                  placeholder="What did the customer say?"
                  className="rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none focus:border-cyan-300"
                />
              </label>

              <label className="grid gap-2">
                <span className="text-sm font-semibold text-slate-300">Objection</span>
                <textarea
                  name="objection"
                  rows={3}
                  placeholder="Example: Is this a full audit? Is it safe? Why pay?"
                  className="rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none focus:border-cyan-300"
                />
              </label>

              <label className="grid gap-2">
                <span className="text-sm font-semibold text-slate-300">Next step</span>
                <input
                  name="next_step"
                  placeholder="Example: Send PDF report tomorrow"
                  className="rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none focus:border-cyan-300"
                />
              </label>

              <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-slate-950 p-4">
                <input name="is_paid_pilot" type="checkbox" className="h-5 w-5" />
                <span className="text-sm font-semibold text-slate-300">This is a paid pilot</span>
              </label>

              <button
                type="submit"
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-cyan-300 px-5 py-4 font-bold text-slate-950 hover:bg-cyan-200"
              >
                <CheckCircle2 className="h-5 w-5" />
                Save validation note
              </button>
            </div>
          </form>

          <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-8">
            <div className="mb-6 flex items-center gap-3">
              <ClipboardList className="h-7 w-7 text-cyan-300" />
              <h2 className="text-3xl font-black">Validation notes</h2>
            </div>

            {!feedbackRows || feedbackRows.length === 0 ? (
              <div className="rounded-3xl border border-white/10 bg-slate-950 p-8 text-center">
                <MessageSquare className="mx-auto mb-4 h-10 w-10 text-cyan-300" />
                <h3 className="text-xl font-black">No customer notes yet</h3>
                <p className="mt-2 text-slate-400">
                  Add your first lead after contacting a business or agency.
                </p>
              </div>
            ) : (
              <div className="grid gap-4">
                {feedbackRows.map((row) => (
                  <div key={row.id} className="rounded-3xl border border-white/10 bg-slate-950 p-6">
                    <div className="mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                      <div>
                        <div className="mb-2 flex items-center gap-2">
                          <Building2 className="h-5 w-5 text-cyan-300" />
                          <h3 className="text-xl font-black">{row.business_name}</h3>
                        </div>
                        {row.website_url ? (
                          <p className="break-all text-sm text-slate-400">{row.website_url}</p>
                        ) : null}
                        <p className="mt-1 text-xs text-slate-500">
                          Added {formatDateTime(row.created_at)}
                        </p>
                      </div>

                      <span
                        className={`w-fit rounded-full border px-3 py-1 text-xs font-bold ${
                          statusClasses[row.status] ?? statusClasses.not_contacted
                        }`}
                      >
                        {statusLabels[row.status] ?? row.status}
                      </span>
                    </div>

                    <div className="grid gap-3 text-sm text-slate-300">
                      {row.lead_type ? <p><span className="font-bold text-white">Lead type:</span> {row.lead_type}</p> : null}
                      {row.contact_channel ? <p><span className="font-bold text-white">Channel:</span> {row.contact_channel}</p> : null}
                      {row.feedback ? <p><span className="font-bold text-white">Feedback:</span> {row.feedback}</p> : null}
                      {row.objection ? <p><span className="font-bold text-white">Objection:</span> {row.objection}</p> : null}
                      {row.next_step ? <p><span className="font-bold text-white">Next step:</span> {row.next_step}</p> : null}
                      {row.is_paid_pilot ? (
                        <p className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 p-3 font-bold text-emerald-100">
                          Paid pilot marked
                        </p>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </section>
      </div>
    </main>
  );
}