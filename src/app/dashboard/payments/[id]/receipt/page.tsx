import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  CreditCard,
  FileText,
  IndianRupee,
  ReceiptText,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { brand } from "@/config/brand";
import { createClient } from "@/lib/supabase/server";
import { formatDateTime } from "@/lib/utils/risk";
import { PrintButton } from "@/components/report/print-button";

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
  business_name?: string | null;
  website_url?: string | null;
};

function money(value: number | null | undefined, currency = "INR") {
  if (currency === "INR") {
    return `₹${Number(value ?? 0).toLocaleString("en-IN")}`;
  }

  return `${currency} ${Number(value ?? 0).toLocaleString("en-IN")}`;
}

function statusLabel(status?: string | null) {
  if (status === "received") return "Receipt";
  if (status === "partial") return "Partial Payment Receipt";
  if (status === "refunded") return "Refund Record";
  return "Payment Invoice";
}

function statusClass(status?: string | null) {
  if (status === "received") return "border-emerald-200 bg-emerald-50 text-emerald-900";
  if (status === "partial") return "border-cyan-200 bg-cyan-50 text-cyan-900";
  if (status === "failed") return "border-red-200 bg-red-50 text-red-900";
  if (status === "refunded") return "border-slate-200 bg-slate-50 text-slate-800";
  return "border-amber-200 bg-amber-50 text-amber-900";
}

function methodLabel(method?: string | null) {
  if (method === "upi") return "UPI";
  if (method === "bank_transfer") return "Bank transfer";
  if (method === "cash") return "Cash";
  if (method === "manual_invoice") return "Manual invoice";
  if (method === "other") return "Other";
  return "Manual";
}

function shortId(id: string) {
  return id.slice(0, 8).toUpperCase();
}

export default async function PaymentReceiptPage({
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

  const { data: payment } = await supabase
    .from("manual_payments")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!payment) {
    notFound();
  }

  const paymentRow = payment as PaymentRow;

  const { data: businessSettings } = await supabase
    .from("business_settings")
    .select("business_name, owner_name, email, phone, website, address, report_footer_note")
    .eq("user_id", user.id)
    .maybeSingle();

  let linkedLead: LeadRow | null = null;

  if (paymentRow.customer_feedback_id) {
    const { data: lead } = await supabase
      .from("customer_feedback")
      .select("business_name, website_url")
      .eq("id", paymentRow.customer_feedback_id)
      .eq("user_id", user.id)
      .maybeSingle();

    linkedLead = lead as LeadRow | null;
  }

  const currency = paymentRow.currency || "INR";
  const documentTitle = statusLabel(paymentRow.payment_status);
  const documentNumber = `VS-${shortId(paymentRow.id)}`;

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-6 text-slate-950 print:bg-white print:px-0 print:py-0">
      <style>
        {`
          @page {
            size: A4;
            margin: 14mm;
          }

          @media print {
            .no-print {
              display: none !important;
            }

            body {
              background: white !important;
            }
          }
        `}
      </style>

      <div className="no-print mx-auto mb-5 flex max-w-4xl items-center justify-between gap-3">
        <Link
          href="/dashboard/payments"
          className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to payments
        </Link>

        <PrintButton />
      </div>

      <article className="mx-auto max-w-4xl rounded-[2rem] bg-white p-8 shadow-xl shadow-slate-300/40 print:max-w-none print:rounded-none print:p-0 print:shadow-none">
        <section className="rounded-[1.75rem] bg-slate-950 p-8 text-white print:rounded-none">
          <div className="flex flex-col justify-between gap-8 md:flex-row md:items-start">
            <div>
              <div className="mb-6 flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-300/10 ring-1 ring-cyan-300/30">
                  <ReceiptText className="h-7 w-7 text-cyan-300" />
                </div>
                <div>
                  <p className="text-2xl font-black">{brand.name}</p>
                  <p className="text-xs uppercase tracking-[0.25em] text-cyan-200/70">
                    Manual payment document
                  </p>
                </div>
              </div>

              <h1 className="text-5xl font-black tracking-tight">{documentTitle}</h1>

              <p className="mt-4 text-slate-300">
                Document No: <span className="font-bold text-white">{documentNumber}</span>
              </p>

              <p className="mt-1 text-slate-300">
                Created: <span className="font-bold text-white">{formatDateTime(paymentRow.created_at)}</span>
              </p>
            </div>

            <div className="rounded-3xl border border-cyan-300/20 bg-cyan-300/10 p-6 text-center">
              <p className="text-sm text-cyan-100/80">Amount</p>
              <p className="mt-2 text-5xl font-black text-white">
                {money(paymentRow.amount, currency)}
              </p>
              <p className="mt-2 text-sm font-bold uppercase text-cyan-100">
                {paymentRow.payment_status || "pending"}
              </p>
            </div>
          </div>
        </section>

        <section className="mt-8 grid gap-6 md:grid-cols-2 print:mt-6">
          <div className="rounded-3xl border border-slate-200 p-6">
            <div className="mb-4 flex items-center gap-3">
              <ShieldCheck className="h-6 w-6 text-slate-700" />
              <h2 className="text-2xl font-black">From</h2>
            </div>

            <div className="space-y-2 text-slate-700">
              <p className="text-xl font-black text-slate-950">
                {businessSettings?.business_name || brand.name}
              </p>
              <p>{businessSettings?.owner_name || "Business owner"}</p>
              {businessSettings?.email ? <p>{businessSettings.email}</p> : null}
              {businessSettings?.phone ? <p>{businessSettings.phone}</p> : null}
              {businessSettings?.website ? <p className="break-all">{businessSettings.website}</p> : null}
              {businessSettings?.address ? <p className="leading-7">{businessSettings.address}</p> : null}
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 p-6">
            <div className="mb-4 flex items-center gap-3">
              <UserRound className="h-6 w-6 text-slate-700" />
              <h2 className="text-2xl font-black">Bill to</h2>
            </div>

            <div className="space-y-2 text-slate-700">
              <p className="text-xl font-black text-slate-950">{paymentRow.payer_name}</p>
              {paymentRow.payer_email ? <p>{paymentRow.payer_email}</p> : null}
              {paymentRow.payer_phone ? <p>{paymentRow.payer_phone}</p> : null}
              {linkedLead?.business_name ? <p>CRM lead: {linkedLead.business_name}</p> : null}
              {linkedLead?.website_url ? <p className="break-all">{linkedLead.website_url}</p> : null}
            </div>
          </div>
        </section>

        <section className="mt-8 rounded-3xl border border-slate-200 p-6 print:mt-6">
          <div className="mb-5 flex items-center gap-3">
            <FileText className="h-6 w-6 text-slate-700" />
            <h2 className="text-2xl font-black">Payment details</h2>
          </div>

          <div className="overflow-hidden rounded-3xl border border-slate-200">
            <table className="w-full border-collapse text-left text-sm">
              <thead className="bg-slate-950 text-white">
                <tr>
                  <th className="p-4">Description</th>
                  <th className="p-4">Method</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-t border-slate-200 align-top">
                  <td className="p-4">
                    <p className="font-bold text-slate-950">VeyraSec website trust report / pilot service</p>
                    <p className="mt-1 text-slate-600">
                      Manual payment record. No online gateway collection.
                    </p>
                  </td>
                  <td className="p-4 text-slate-700">{methodLabel(paymentRow.payment_method)}</td>
                  <td className="p-4">
                    <span className={`rounded-full border px-3 py-1 text-xs font-bold ${statusClass(paymentRow.payment_status)}`}>
                      {paymentRow.payment_status || "pending"}
                    </span>
                  </td>
                  <td className="p-4 text-right text-lg font-black">
                    {money(paymentRow.amount, currency)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section className="mt-8 grid gap-4 md:grid-cols-3 print:mt-6">
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
            <div className="mb-2 flex items-center gap-2 text-slate-700">
              <CreditCard className="h-5 w-5" />
              <p className="font-bold">Reference</p>
            </div>
            <p className="break-all text-slate-900">{paymentRow.payment_reference || "Not added"}</p>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
            <div className="mb-2 flex items-center gap-2 text-slate-700">
              <CalendarDays className="h-5 w-5" />
              <p className="font-bold">Payment date</p>
            </div>
            <p className="text-slate-900">{paymentRow.payment_date || "Not received yet"}</p>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
            <div className="mb-2 flex items-center gap-2 text-slate-700">
              <IndianRupee className="h-5 w-5" />
              <p className="font-bold">Due date</p>
            </div>
            <p className="text-slate-900">{paymentRow.due_date || "Not added"}</p>
          </div>
        </section>

        {paymentRow.notes ? (
          <section className="mt-8 rounded-3xl border border-slate-200 bg-slate-50 p-6 print:mt-6">
            <h2 className="text-2xl font-black">Notes</h2>
            <p className="mt-3 leading-8 text-slate-700">{paymentRow.notes}</p>
          </section>
        ) : null}

        <section className="mt-8 rounded-3xl border border-amber-200 bg-amber-50 p-6 text-amber-950 print:mt-6">
          <h2 className="text-2xl font-black">Important note</h2>
          <p className="mt-3 leading-8">
            This is a manually generated payment document from VeyraSec. It does not collect money,
            verify bank transactions, generate GST/tax-compliant invoices automatically, or replace
            accounting records. Confirm payment manually and take advice from a CA or trusted adult
            guardian for tax/legal setup.
          </p>
        </section>

        <footer className="mt-8 border-t border-slate-200 pt-5 text-sm text-slate-500">
          <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
            <p>
              Prepared with {brand.name} {brand.version}. Manual payment tracking only.
            </p>
            <p className="break-all">
              {businessSettings?.email || brand.supportEmail}
              {businessSettings?.phone ? ` · ${businessSettings.phone}` : ""}
            </p>
          </div>
        </footer>
      </article>
    </main>
  );
}