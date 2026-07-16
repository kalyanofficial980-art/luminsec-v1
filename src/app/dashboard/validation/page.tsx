import { redirect } from "next/navigation";
import {
  Building2,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  IndianRupee,
  MessageSquare,
  Plus,
  Target,
  Trophy,
  Users,
} from "lucide-react";
import { brand } from "@/config/brand";
import { createClient } from "@/lib/supabase/server";
import { addCustomerFeedback, updateLeadStatus } from "./actions";
import { formatDateTime } from "@/lib/utils/risk";

type LeadRow = {
  id: string;
  business_name: string;
  website_url: string | null;
  contact_channel: string | null;
  lead_type: string | null;
  lead_source: string | null;
  status: string;
  priority: string;
  expected_value: number | null;
  follow_up_date: string | null;
  objection_type: string | null;
  feedback: string | null;
  objection: string | null;
  next_step: string | null;
  is_paid_pilot: boolean;
  demo_completed: boolean;
  testimonial_received: boolean;
  created_at: string;
};

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

const priorityClasses: Record<string, string> = {
  high: "border-red-400/20 bg-red-400/10 text-red-100",
  medium: "border-amber-400/20 bg-amber-400/10 text-amber-100",
  low: "border-slate-400/20 bg-slate-400/10 text-slate-200",
};

function money(value: number | null | undefined) {
  return `₹${Number(value ?? 0).toLocaleString("en-IN")}`;
}

function countByStatus(rows: LeadRow[], status: string) {
  return rows.filter((row) => row.status === status).length;
}

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

  const { data, error } = await supabase
    .from("customer_feedback")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const rows = (data ?? []) as LeadRow[];

  const totalLeads = rows.length;
  const expectedPipeline = rows.reduce(
    (total, row) => total + Number(row.expected_value ?? 0),
    0,
  );
  const paidPilots = rows.filter(
    (row) => row.is_paid_pilot || row.status === "paid_pilot",
  ).length;
  const demoCompleted = rows.filter((row) => row.demo_completed).length;
  const testimonials = rows.filter((row) => row.testimonial_received).length;
  const followUps = rows.filter((row) => row.follow_up_date).length;

  const pipeline = [
    ["Not contacted", countByStatus(rows, "not_contacted")],
    ["Contacted", countByStatus(rows, "contacted")],
    ["Replied", countByStatus(rows, "replied")],
    ["Demo booked", countByStatus(rows, "demo_booked")],
    ["Feedback", countByStatus(rows, "feedback_received")],
    ["Paid pilot", countByStatus(rows, "paid_pilot")],
  ];

  return (
    <main className="min-h-screen bg-slate-950 p-6 text-white">
      <div className="mx-auto max-w-7xl">
        <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-8">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-400/10 ring-1 ring-cyan-300/30">
              <Target className="h-6 w-6 text-cyan-300" />
            </div>
            <div>
              <h1 className="text-4xl font-black">Customer validation CRM</h1>
              <p className="text-slate-400">
                {brand.name} leads, demos, objections, follow-ups, and paid
                pilots
              </p>
            </div>
          </div>

          <p className="max-w-3xl leading-8 text-slate-300">
            Use this CRM to manage your first 10–25 customer conversations.
            Track who replied, who needs follow-up, who completed a demo, and
            who can become a paid pilot.
          </p>
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

        <section className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
          {[
            ["Total leads", totalLeads, Users],
            ["Pipeline value", money(expectedPipeline), IndianRupee],
            ["Follow-ups", followUps, CalendarDays],
            ["Demo done", demoCompleted, CheckCircle2],
            ["Paid pilots", paidPilots, Trophy],
            ["Testimonials", testimonials, MessageSquare],
          ].map(([label, value, Icon]) => {
            const IconComponent = Icon as typeof Users;

            return (
              <div
                key={String(label)}
                className="rounded-3xl border border-white/10 bg-white/[0.04] p-5"
              >
                <IconComponent className="mb-4 h-6 w-6 text-cyan-300" />
                <p className="text-sm text-slate-400">{String(label)}</p>
                <p className="mt-2 text-3xl font-black">{String(value)}</p>
              </div>
            );
          })}
        </section>

        <section className="mt-8 rounded-3xl border border-white/10 bg-white/[0.04] p-8">
          <div className="mb-6 flex items-center gap-3">
            <ClipboardList className="h-7 w-7 text-cyan-300" />
            <h2 className="text-3xl font-black">Pipeline</h2>
          </div>

          <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-6">
            {pipeline.map(([label, count]) => (
              <div
                key={String(label)}
                className="rounded-2xl border border-white/10 bg-slate-950 p-5"
              >
                <p className="text-sm text-slate-400">{String(label)}</p>
                <p className="mt-2 text-3xl font-black">{count}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-8 grid gap-8 xl:grid-cols-[0.8fr_1.2fr]">
          <form
            action={addCustomerFeedback}
            className="rounded-3xl border border-white/10 bg-white/[0.04] p-8"
          >
            <div className="mb-6 flex items-center gap-3">
              <Plus className="h-7 w-7 text-cyan-300" />
              <h2 className="text-3xl font-black">Add lead</h2>
            </div>

            <div className="grid gap-4">
              <label className="grid gap-2">
                <span className="text-sm font-semibold text-slate-300">
                  Business name *
                </span>
                <input
                  name="business_name"
                  placeholder="Example: Local Web Agency"
                  className="rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none focus:border-cyan-300"
                />
              </label>

              <label className="grid gap-2">
                <span className="text-sm font-semibold text-slate-300">
                  Website URL
                </span>
                <input
                  name="website_url"
                  placeholder="https://example.com"
                  className="rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none focus:border-cyan-300"
                />
              </label>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="grid gap-2">
                  <span className="text-sm font-semibold text-slate-300">
                    Channel
                  </span>
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
                  <span className="text-sm font-semibold text-slate-300">
                    Lead type
                  </span>
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

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="grid gap-2">
                  <span className="text-sm font-semibold text-slate-300">
                    Lead source
                  </span>
                  <input
                    name="lead_source"
                    placeholder="Google / Instagram / referral"
                    className="rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none focus:border-cyan-300"
                  />
                </label>

                <label className="grid gap-2">
                  <span className="text-sm font-semibold text-slate-300">
                    Expected value
                  </span>
                  <input
                    name="expected_value"
                    type="number"
                    min="0"
                    placeholder="499"
                    className="rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none focus:border-cyan-300"
                  />
                </label>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="grid gap-2">
                  <span className="text-sm font-semibold text-slate-300">
                    Status
                  </span>
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
                  <span className="text-sm font-semibold text-slate-300">
                    Priority
                  </span>
                  <select
                    name="priority"
                    className="rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none focus:border-cyan-300"
                  >
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="low">Low</option>
                  </select>
                </label>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="grid gap-2">
                  <span className="text-sm font-semibold text-slate-300">
                    Follow-up date
                  </span>
                  <input
                    name="follow_up_date"
                    type="date"
                    className="rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none focus:border-cyan-300"
                  />
                </label>

                <label className="grid gap-2">
                  <span className="text-sm font-semibold text-slate-300">
                    Objection type
                  </span>
                  <select
                    name="objection_type"
                    className="rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none focus:border-cyan-300"
                  >
                    <option value="">Select</option>
                    <option value="price">Price</option>
                    <option value="trust">Trust</option>
                    <option value="not_needed">Not needed</option>
                    <option value="full_audit_confusion">
                      Full audit confusion
                    </option>
                    <option value="technical">Technical doubt</option>
                  </select>
                </label>
              </div>

              <label className="grid gap-2">
                <span className="text-sm font-semibold text-slate-300">
                  Feedback
                </span>
                <textarea
                  name="feedback"
                  rows={3}
                  placeholder="What did customer say?"
                  className="rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none focus:border-cyan-300"
                />
              </label>

              <label className="grid gap-2">
                <span className="text-sm font-semibold text-slate-300">
                  Objection
                </span>
                <textarea
                  name="objection"
                  rows={3}
                  placeholder="Example: They asked if it is a full audit."
                  className="rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none focus:border-cyan-300"
                />
              </label>

              <label className="grid gap-2">
                <span className="text-sm font-semibold text-slate-300">
                  Next step
                </span>
                <input
                  name="next_step"
                  placeholder="Example: Send sample PDF tomorrow"
                  className="rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none focus:border-cyan-300"
                />
              </label>

              <div className="grid gap-3">
                <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-slate-950 p-4">
                  <input
                    name="demo_completed"
                    type="checkbox"
                    className="h-5 w-5"
                  />
                  <span className="text-sm font-semibold text-slate-300">
                    Demo completed
                  </span>
                </label>

                <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-slate-950 p-4">
                  <input
                    name="is_paid_pilot"
                    type="checkbox"
                    className="h-5 w-5"
                  />
                  <span className="text-sm font-semibold text-slate-300">
                    Paid pilot
                  </span>
                </label>

                <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-slate-950 p-4">
                  <input
                    name="testimonial_received"
                    type="checkbox"
                    className="h-5 w-5"
                  />
                  <span className="text-sm font-semibold text-slate-300">
                    Testimonial received
                  </span>
                </label>
              </div>

              <button
                type="submit"
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-cyan-300 px-5 py-4 font-bold text-slate-950 hover:bg-cyan-200"
              >
                <CheckCircle2 className="h-5 w-5" />
                Save lead
              </button>
            </div>
          </form>

          <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-8">
            <div className="mb-6 flex items-center gap-3">
              <Building2 className="h-7 w-7 text-cyan-300" />
              <h2 className="text-3xl font-black">Lead board</h2>
            </div>

            {rows.length === 0 ? (
              <div className="rounded-3xl border border-white/10 bg-slate-950 p-8 text-center">
                <MessageSquare className="mx-auto mb-4 h-10 w-10 text-cyan-300" />
                <h3 className="text-xl font-black">No CRM leads yet</h3>
                <p className="mt-2 text-slate-400">
                  Add your first lead after outreach.
                </p>
              </div>
            ) : (
              <div className="grid gap-5">
                {rows.map((row) => (
                  <div
                    key={row.id}
                    className="rounded-3xl border border-white/10 bg-slate-950 p-6"
                  >
                    <div className="mb-4 flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
                      <div>
                        <div className="mb-2 flex flex-wrap items-center gap-2">
                          <h3 className="text-2xl font-black">
                            {row.business_name}
                          </h3>
                          <span
                            className={`rounded-full border px-3 py-1 text-xs font-bold ${statusClasses[row.status] ?? statusClasses.not_contacted}`}
                          >
                            {statusLabels[row.status] ?? row.status}
                          </span>
                          <span
                            className={`rounded-full border px-3 py-1 text-xs font-bold ${priorityClasses[row.priority] ?? priorityClasses.medium}`}
                          >
                            {row.priority}
                          </span>
                        </div>

                        <p className="break-all text-sm text-slate-400">
                          {row.website_url || "No website added"}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          Added {formatDateTime(row.created_at)}
                        </p>
                      </div>

                      <div className="rounded-2xl border border-cyan-300/20 bg-cyan-300/10 p-4 text-cyan-100">
                        <p className="text-xs opacity-80">Expected value</p>
                        <p className="text-2xl font-black">
                          {money(row.expected_value)}
                        </p>
                      </div>
                    </div>

                    <div className="grid gap-3 text-sm text-slate-300 md:grid-cols-2">
                      {row.lead_type ? (
                        <p>
                          <span className="font-bold text-white">
                            Lead type:
                          </span>{" "}
                          {row.lead_type}
                        </p>
                      ) : null}
                      {row.lead_source ? (
                        <p>
                          <span className="font-bold text-white">Source:</span>{" "}
                          {row.lead_source}
                        </p>
                      ) : null}
                      {row.contact_channel ? (
                        <p>
                          <span className="font-bold text-white">Channel:</span>{" "}
                          {row.contact_channel}
                        </p>
                      ) : null}
                      {row.follow_up_date ? (
                        <p>
                          <span className="font-bold text-white">
                            Follow-up:
                          </span>{" "}
                          {row.follow_up_date}
                        </p>
                      ) : null}
                      {row.objection_type ? (
                        <p>
                          <span className="font-bold text-white">
                            Objection type:
                          </span>{" "}
                          {row.objection_type}
                        </p>
                      ) : null}
                      {row.next_step ? (
                        <p>
                          <span className="font-bold text-white">Next:</span>{" "}
                          {row.next_step}
                        </p>
                      ) : null}
                    </div>

                    {row.feedback || row.objection ? (
                      <div className="mt-4 grid gap-3 md:grid-cols-2">
                        {row.feedback ? (
                          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                            <p className="mb-2 font-bold text-white">
                              Feedback
                            </p>
                            <p className="text-sm leading-6 text-slate-400">
                              {row.feedback}
                            </p>
                          </div>
                        ) : null}

                        {row.objection ? (
                          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                            <p className="mb-2 font-bold text-white">
                              Objection
                            </p>
                            <p className="text-sm leading-6 text-slate-400">
                              {row.objection}
                            </p>
                          </div>
                        ) : null}
                      </div>
                    ) : null}

                    <div className="mt-4 flex flex-wrap gap-2">
                      {row.demo_completed ? (
                        <span className="rounded-full border border-purple-400/20 bg-purple-400/10 px-3 py-1 text-xs font-bold text-purple-100">
                          Demo done
                        </span>
                      ) : null}
                      {row.is_paid_pilot ? (
                        <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs font-bold text-emerald-100">
                          Paid pilot
                        </span>
                      ) : null}
                      {row.testimonial_received ? (
                        <span className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-xs font-bold text-cyan-100">
                          Testimonial
                        </span>
                      ) : null}
                    </div>

                    <form
                      action={updateLeadStatus}
                      className="mt-5 rounded-2xl border border-white/10 bg-white/[0.03] p-4"
                    >
                      <input type="hidden" name="lead_id" value={row.id} />

                      <div className="grid gap-3 md:grid-cols-3">
                        <select
                          name="status"
                          defaultValue={row.status}
                          className="rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none focus:border-cyan-300"
                        >
                          <option value="not_contacted">Not contacted</option>
                          <option value="contacted">Contacted</option>
                          <option value="replied">Replied</option>
                          <option value="demo_booked">Demo booked</option>
                          <option value="feedback_received">
                            Feedback received
                          </option>
                          <option value="paid_pilot">Paid pilot</option>
                          <option value="rejected">Rejected</option>
                        </select>

                        <input
                          name="follow_up_date"
                          type="date"
                          defaultValue={row.follow_up_date ?? ""}
                          className="rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none focus:border-cyan-300"
                        />

                        <input
                          name="next_step"
                          defaultValue={row.next_step ?? ""}
                          placeholder="Next step"
                          className="rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none focus:border-cyan-300"
                        />
                      </div>

                      <div className="mt-3 flex flex-wrap gap-3">
                        <label className="flex items-center gap-2 text-sm text-slate-300">
                          <input
                            name="demo_completed"
                            type="checkbox"
                            defaultChecked={row.demo_completed}
                          />
                          Demo
                        </label>

                        <label className="flex items-center gap-2 text-sm text-slate-300">
                          <input
                            name="is_paid_pilot"
                            type="checkbox"
                            defaultChecked={row.is_paid_pilot}
                          />
                          Paid
                        </label>

                        <label className="flex items-center gap-2 text-sm text-slate-300">
                          <input
                            name="testimonial_received"
                            type="checkbox"
                            defaultChecked={row.testimonial_received}
                          />
                          Testimonial
                        </label>

                        <button
                          type="submit"
                          className="ml-auto rounded-2xl bg-cyan-300 px-4 py-2 text-sm font-bold text-slate-950 hover:bg-cyan-200"
                        >
                          Update
                        </button>
                      </div>
                    </form>
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
