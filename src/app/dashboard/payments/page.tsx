import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Banknote,
  CalendarDays,
  CheckCircle2,
  Clock3,
  CreditCard,
  IndianRupee,
  Plus,
  ReceiptText,
  RefreshCcw,
  ShieldCheck,
  WalletCards,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { formatDateTime } from "@/lib/utils/risk";
import { addManualPayment, updateManualPaymentStatus } from "./actions";

type PaymentRow = {
  id: string;
  customer_feedback_id: string | null;
  payer_name: string;
  payer_email: string | null;
  payer_phone: string | null;
  amount: number | null;
  currency: string | null;
  payment_method: string | null;
  payment_status: string | null;
  payment_reference: string | null;
  payment_date: string | null;
  due_date: string | null;
  notes: string | null;
  created_at: string;
};

type LeadRow = {
  id: string;
  business_name: string;
  website_url: string | null;
};

const statusLabels: Record<string, string> = {
  pending: "Pending",
  received: "Received",
  partial: "Partial",
  failed: "Failed",
  refunded: "Refunded",
};

const statusClasses: Record<string, string> = {
  pending: "border-amber-400/20 bg-amber-400/10 text-amber-100",
  received: "border-emerald-400/20 bg-emerald-400/10 text-emerald-100",
  partial: "border-cyan-400/20 bg-cyan-400/10 text-cyan-100",
  failed: "border-red-400/20 bg-red-400/10 text-red-100",
  refunded: "border-slate-400/20 bg-slate-400/10 text-slate-200",
};

function money(value: number | null | undefined, currency = "INR") {
  if (currency === "INR") {
    return `₹${Number(value ?? 0).toLocaleString("en-IN")}`;
  }

  return `${currency} ${Number(value ?? 0).toLocaleString("en-IN")}`;
}

function totalByStatus(rows: PaymentRow[], status: string) {
  return rows
    .filter((row) => row.payment_status === status)
    .reduce((total, row) => total + Number(row.amount ?? 0), 0);
}

function countByStatus(rows: PaymentRow[], status: string) {
  return rows.filter((row) => row.payment_status === status).length;
}

function methodLabel(method?: string | null) {
  if (method === "upi") return "UPI";
  if (method === "bank_transfer") return "Bank transfer";
  if (method === "cash") return "Cash";
  if (method === "manual_invoice") return "Manual invoice";
  if (method === "other") return "Other";
  return "Manual";
}

export default async function PaymentsPage({
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

  const { data: paymentData, error: paymentError } = await supabase
    .from("manual_payments")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const { data: leadData } = await supabase
    .from("customer_feedback")
    .select("id, business_name, website_url")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const payments = (paymentData ?? []) as PaymentRow[];
  const leads = (leadData ?? []) as LeadRow[];

  const receivedTotal = totalByStatus(payments, "received");
  const pendingTotal = totalByStatus(payments, "pending");
  const partialTotal = totalByStatus(payments, "partial");
  const refundedTotal = totalByStatus(payments, "refunded");

  const stats = [
    {
      label: "Received",
      value: money(receivedTotal),
      icon: CheckCircle2,
      className: "border-emerald-400/20 bg-emerald-400/10 text-emerald-100",
    },
    {
      label: "Pending",
      value: money(pendingTotal),
      icon: Clock3,
      className: "border-amber-400/20 bg-amber-400/10 text-amber-100",
    },
    {
      label: "Partial",
      value: money(partialTotal),
      icon: RefreshCcw,
      className: "border-cyan-400/20 bg-cyan-400/10 text-cyan-100",
    },
    {
      label: "Refunded",
      value: money(refundedTotal),
      icon: ReceiptText,
      className: "border-slate-400/20 bg-slate-400/10 text-slate-100",
    },
  ];

  return (
    <main className="min-h-screen bg-slate-950 p-6 text-white">
      <div className="mx-auto max-w-7xl">
        <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-8">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-400/10 ring-1 ring-cyan-300/30">
              <IndianRupee className="h-6 w-6 text-cyan-300" />
            </div>
            <div>
              <h1 className="text-4xl font-black">Manual payment tracking</h1>
              <p className="text-slate-400">
                Track paid pilots and client payments without Razorpay or online gateway.
              </p>
            </div>
          </div>

          <p className="max-w-3xl leading-8 text-slate-300">
            This page only records payments manually. Collect money through UPI, bank transfer,
            cash, or manual invoice, then update the payment status here.
          </p>
        </section>

        {params.message ? (
          <div className="mt-6 rounded-3xl border border-cyan-300/20 bg-cyan-300/10 p-5 text-cyan-100">
            {params.message}
          </div>
        ) : null}

        {paymentError ? (
          <div className="mt-6 rounded-3xl border border-red-300/20 bg-red-300/10 p-5 text-red-100">
            {paymentError.message}
          </div>
        ) : null}

        <section className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map((stat) => {
            const Icon = stat.icon;

            return (
              <div key={stat.label} className={`rounded-3xl border p-6 ${stat.className}`}>
                <Icon className="mb-4 h-7 w-7" />
                <p className="text-sm opacity-80">{stat.label}</p>
                <p className="mt-2 text-4xl font-black">{stat.value}</p>
              </div>
            );
          })}
        </section>

        <section className="mt-8 grid gap-8 xl:grid-cols-[0.8fr_1.2fr]">
          <form action={addManualPayment} className="rounded-3xl border border-white/10 bg-white/[0.04] p-8">
            <div className="mb-6 flex items-center gap-3">
              <Plus className="h-7 w-7 text-cyan-300" />
              <h2 className="text-3xl font-black">Add payment</h2>
            </div>

            <div className="grid gap-4">
              <label className="grid gap-2">
                <span className="text-sm font-semibold text-slate-300">Link CRM lead</span>
                <select name="customer_feedback_id" className="rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none focus:border-cyan-300">
                  <option value="">No linked lead</option>
                  {leads.map((lead) => (
                    <option key={lead.id} value={lead.id}>
                      {lead.business_name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="grid gap-2">
                <span className="text-sm font-semibold text-slate-300">Payer name *</span>
                <input name="payer_name" placeholder="Client or business name" className="rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none focus:border-cyan-300" />
              </label>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="grid gap-2">
                  <span className="text-sm font-semibold text-slate-300">Email</span>
                  <input name="payer_email" type="email" placeholder="client@example.com" className="rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none focus:border-cyan-300" />
                </label>

                <label className="grid gap-2">
                  <span className="text-sm font-semibold text-slate-300">Phone</span>
                  <input name="payer_phone" placeholder="+91..." className="rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none focus:border-cyan-300" />
                </label>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="grid gap-2">
                  <span className="text-sm font-semibold text-slate-300">Amount *</span>
                  <input name="amount" type="number" min="1" placeholder="499" className="rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none focus:border-cyan-300" />
                </label>

                <label className="grid gap-2">
                  <span className="text-sm font-semibold text-slate-300">Currency</span>
                  <select name="currency" defaultValue="INR" className="rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none focus:border-cyan-300">
                    <option value="INR">INR</option>
                    <option value="USD">USD</option>
                  </select>
                </label>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="grid gap-2">
                  <span className="text-sm font-semibold text-slate-300">Method</span>
                  <select name="payment_method" defaultValue="upi" className="rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none focus:border-cyan-300">
                    <option value="upi">UPI</option>
                    <option value="bank_transfer">Bank transfer</option>
                    <option value="cash">Cash</option>
                    <option value="manual_invoice">Manual invoice</option>
                    <option value="other">Other</option>
                  </select>
                </label>

                <label className="grid gap-2">
                  <span className="text-sm font-semibold text-slate-300">Status</span>
                  <select name="payment_status" defaultValue="pending" className="rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none focus:border-cyan-300">
                    <option value="pending">Pending</option>
                    <option value="received">Received</option>
                    <option value="partial">Partial</option>
                    <option value="failed">Failed</option>
                    <option value="refunded">Refunded</option>
                  </select>
                </label>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="grid gap-2">
                  <span className="text-sm font-semibold text-slate-300">Payment date</span>
                  <input name="payment_date" type="date" className="rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none focus:border-cyan-300" />
                </label>

                <label className="grid gap-2">
                  <span className="text-sm font-semibold text-slate-300">Due date</span>
                  <input name="due_date" type="date" className="rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none focus:border-cyan-300" />
                </label>
              </div>

              <label className="grid gap-2">
                <span className="text-sm font-semibold text-slate-300">Payment reference</span>
                <input name="payment_reference" placeholder="UPI transaction ID / bank ref / invoice no." className="rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none focus:border-cyan-300" />
              </label>

              <label className="grid gap-2">
                <span className="text-sm font-semibold text-slate-300">Notes</span>
                <textarea name="notes" rows={3} placeholder="Example: First paid pilot advance received." className="rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none focus:border-cyan-300" />
              </label>

              <button type="submit" className="inline-flex items-center justify-center gap-2 rounded-2xl bg-cyan-300 px-5 py-4 font-bold text-slate-950 hover:bg-cyan-200">
                <CheckCircle2 className="h-5 w-5" />
                Save payment
              </button>
            </div>
          </form>

          <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-8">
            <div className="mb-6 flex items-center gap-3">
              <WalletCards className="h-7 w-7 text-cyan-300" />
              <h2 className="text-3xl font-black">Payment board</h2>
            </div>

            <div className="mb-6 grid gap-3 md:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-slate-950 p-4">
                <p className="text-sm text-slate-400">Received count</p>
                <p className="mt-2 text-3xl font-black">{countByStatus(payments, "received")}</p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-slate-950 p-4">
                <p className="text-sm text-slate-400">Pending count</p>
                <p className="mt-2 text-3xl font-black">{countByStatus(payments, "pending")}</p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-slate-950 p-4">
                <p className="text-sm text-slate-400">All records</p>
                <p className="mt-2 text-3xl font-black">{payments.length}</p>
              </div>
            </div>

            {payments.length === 0 ? (
              <div className="rounded-3xl border border-white/10 bg-slate-950 p-8 text-center">
                <Banknote className="mx-auto mb-4 h-10 w-10 text-cyan-300" />
                <h3 className="text-xl font-black">No payments yet</h3>
                <p className="mt-2 text-slate-400">
                  Add your first manual payment after a client agrees to a pilot.
                </p>
              </div>
            ) : (
              <div className="grid gap-5">
                {payments.map((payment) => (
                  <div key={payment.id} className="rounded-3xl border border-white/10 bg-slate-950 p-6">
                    <div className="mb-4 flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
                      <div>
                        <div className="mb-2 flex flex-wrap items-center gap-2">
                          <h3 className="text-2xl font-black">{payment.payer_name}</h3>
                          <span className={`rounded-full border px-3 py-1 text-xs font-bold ${statusClasses[payment.payment_status || "pending"] ?? statusClasses.pending}`}>
                            {statusLabels[payment.payment_status || "pending"] ?? payment.payment_status}
                          </span>
                        </div>

                        <p className="text-sm text-slate-400">
                          {methodLabel(payment.payment_method)} · Added {formatDateTime(payment.created_at)}
                        </p>
                      </div>

                      <div className="rounded-2xl border border-cyan-300/20 bg-cyan-300/10 p-4 text-cyan-100">
                        <p className="text-xs opacity-80">Amount</p>
                        <p className="text-2xl font-black">
                          {money(Number(payment.amount ?? 0), payment.currency || "INR")}
                        </p>
                      </div>
                    </div>

                    <div className="grid gap-3 text-sm text-slate-300 md:grid-cols-2">
                      {payment.payer_email ? <p><span className="font-bold text-white">Email:</span> {payment.payer_email}</p> : null}
                      {payment.payer_phone ? <p><span className="font-bold text-white">Phone:</span> {payment.payer_phone}</p> : null}
                      {payment.payment_reference ? <p><span className="font-bold text-white">Reference:</span> {payment.payment_reference}</p> : null}
                      {payment.payment_date ? <p><span className="font-bold text-white">Payment date:</span> {payment.payment_date}</p> : null}
                      {payment.due_date ? <p><span className="font-bold text-white">Due date:</span> {payment.due_date}</p> : null}
                    </div>

                    {payment.notes ? (
                      <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                        <p className="mb-2 font-bold text-white">Notes</p>
                        <p className="text-sm leading-6 text-slate-400">{payment.notes}</p>
                      </div>
                    ) : null}

                    <Link
                      href={`/dashboard/payments/${payment.id}/receipt`}
                      className="mt-5 inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 px-4 py-3 text-sm font-bold text-white hover:bg-white/10"
                    >
                      <ReceiptText className="h-4 w-4" />
                      Open invoice / receipt
                    </Link>

                    <form action={updateManualPaymentStatus} className="mt-5 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                      <input type="hidden" name="payment_id" value={payment.id} />

                      <div className="grid gap-3 md:grid-cols-4">
                        <select name="payment_status" defaultValue={payment.payment_status || "pending"} className="rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none focus:border-cyan-300">
                          <option value="pending">Pending</option>
                          <option value="received">Received</option>
                          <option value="partial">Partial</option>
                          <option value="failed">Failed</option>
                          <option value="refunded">Refunded</option>
                        </select>

                        <input name="payment_date" type="date" defaultValue={payment.payment_date ?? ""} className="rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none focus:border-cyan-300" />

                        <input name="payment_reference" defaultValue={payment.payment_reference ?? ""} placeholder="Reference" className="rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none focus:border-cyan-300" />

                        <button type="submit" className="rounded-2xl bg-cyan-300 px-4 py-3 text-sm font-bold text-slate-950 hover:bg-cyan-200">
                          Update
                        </button>
                      </div>

                      <textarea name="notes" rows={2} defaultValue={payment.notes ?? ""} placeholder="Notes" className="mt-3 w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none focus:border-cyan-300" />
                    </form>
                  </div>
                ))}
              </div>
            )}
          </section>
        </section>

        <section className="mt-8 rounded-3xl border border-amber-300/20 bg-amber-300/10 p-8">
          <div className="mb-3 flex items-center gap-3">
            <ShieldCheck className="h-7 w-7 text-amber-200" />
            <h2 className="text-2xl font-black text-amber-100">Important payment note</h2>
          </div>

          <p className="max-w-4xl leading-8 text-amber-50/90">
            This is only manual tracking. It does not collect money, verify bank transactions,
            generate tax invoices, or replace accounting. For real paid pilots, confirm payment
            manually and ask a CA or trusted adult guardian for tax and legal setup.
          </p>
        </section>
      </div>
    </main>
  );
}