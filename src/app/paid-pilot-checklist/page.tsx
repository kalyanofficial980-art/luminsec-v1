import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  ClipboardCheck,
  FileText,
  MessageSquare,
  Rocket,
  ShieldCheck,
  Wallet,
} from "lucide-react";
import { brand } from "@/config/brand";

const beforeCall = [
  "Open customer website",
  "Create VeyraSec account",
  "Add website in dashboard",
  "Run passive scan",
  "Open report",
  "Open Telugu-English mode if needed",
  "Open printable PDF version",
  "Prepare 3 simple findings to explain",
];

const demoFlow = [
  "Explain VeyraSec in one line",
  "Say V1 uses safe passive checks only",
  "Show website score",
  "Explain security score",
  "Explain privacy score",
  "Explain trust score",
  "Show findings and recommendations",
  "Open PDF report",
  "Ask if this is useful for their business or clients",
];

const closeScript = [
  "This is a starter website trust readiness report, not a full security audit.",
  "I can prepare this report for your website and explain it in a short call.",
  "For the pilot, the price is INR 499 to INR 999 depending on website size.",
  "After your developer makes changes, I can run one recheck and share an updated report.",
];

const deliveryChecklist = [
  "Customer website URL confirmed",
  "Permission received to run passive check",
  "Payment received manually",
  "Scan report generated",
  "PDF report saved",
  "Report explained to customer",
  "Feedback recorded in dashboard validation tracker",
  "Before-after recheck offered",
  "Testimonial requested",
];

const feedbackQuestions = [
  "Was the report easy to understand?",
  "Which finding was most useful?",
  "Would you share this with your developer?",
  "Would you pay for this report again?",
  "What should be improved before next version?",
];

export default function PaidPilotChecklistPage() {
  return (
    <main className="min-h-screen bg-slate-950 px-6 py-8 text-white">
      <div className="mx-auto max-w-7xl">
        <Link
          href="/"
          className="mb-8 inline-flex items-center gap-2 text-sm font-semibold text-slate-300 hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Back home
        </Link>

        <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-8">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/10 px-4 py-2 text-sm text-cyan-100">
            <Rocket className="h-4 w-4" />
            First paid pilot execution
          </div>

          <h1 className="max-w-4xl text-5xl font-black tracking-tight md:text-7xl">
            Close the first paid VeyraSec pilot.
          </h1>

          <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-300">
            This checklist is the exact execution system for your first paid V1
            customer. Keep it simple: explain the report, collect payment
            manually, deliver PDF, record feedback, and ask for testimonial.
          </p>

          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            <div className="rounded-3xl border border-white/10 bg-slate-950 p-6">
              <p className="text-sm text-slate-400">Pilot price</p>
              <p className="mt-2 text-3xl font-black">INR 499+</p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-slate-950 p-6">
              <p className="text-sm text-slate-400">Delivery time</p>
              <p className="mt-2 text-3xl font-black">24 hrs</p>
            </div>
            <div className="rounded-3xl border border-cyan-300/20 bg-cyan-300/10 p-6">
              <p className="text-sm text-cyan-100">Goal</p>
              <p className="mt-2 text-3xl font-black">1 paid pilot</p>
            </div>
          </div>
        </section>

        <section className="mt-8 grid gap-8 lg:grid-cols-2">
          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-8">
            <div className="mb-6 flex items-center gap-3">
              <ClipboardCheck className="h-7 w-7 text-cyan-300" />
              <h2 className="text-3xl font-black">Before the call</h2>
            </div>

            <div className="grid gap-3">
              {beforeCall.map((item) => (
                <div
                  key={item}
                  className="flex gap-3 rounded-2xl border border-white/10 bg-slate-950 p-4"
                >
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-cyan-300" />
                  <span className="text-slate-300">{item}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-cyan-300/20 bg-cyan-300/10 p-8">
            <div className="mb-6 flex items-center gap-3">
              <ShieldCheck className="h-7 w-7 text-cyan-300" />
              <h2 className="text-3xl font-black text-cyan-100">Demo flow</h2>
            </div>

            <div className="grid gap-3">
              {demoFlow.map((item, index) => (
                <div
                  key={item}
                  className="flex gap-4 rounded-2xl bg-slate-950/70 p-4"
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-cyan-300 text-sm font-black text-slate-950">
                    {index + 1}
                  </div>
                  <span className="font-semibold text-cyan-50">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mt-8 rounded-3xl border border-white/10 bg-white/[0.04] p-8">
          <div className="mb-6 flex items-center gap-3">
            <MessageSquare className="h-7 w-7 text-cyan-300" />
            <h2 className="text-3xl font-black">Closing script</h2>
          </div>

          <div className="grid gap-4">
            {closeScript.map((line, index) => (
              <div
                key={line}
                className="rounded-3xl border border-white/10 bg-slate-950 p-6"
              >
                <p className="mb-2 text-sm font-bold text-cyan-300">
                  Line {index + 1}
                </p>
                <p className="text-lg font-semibold leading-8 text-slate-200">
                  "{line}"
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-8 grid gap-8 lg:grid-cols-2">
          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-8">
            <div className="mb-6 flex items-center gap-3">
              <Wallet className="h-7 w-7 text-cyan-300" />
              <h2 className="text-3xl font-black">Manual payment note</h2>
            </div>

            <p className="leading-8 text-slate-300">
              For V1 pilot, do not waste time integrating payment gateway. Use
              manual UPI or bank transfer. After payment, generate the report
              and deliver the PDF.
            </p>

            <div className="mt-6 rounded-2xl border border-amber-300/20 bg-amber-300/10 p-5">
              <p className="font-bold text-amber-100">Payment message</p>
              <p className="mt-2 leading-7 text-amber-50/90">
                "For the pilot report, payment is INR 499. After payment, I will
                prepare the report, explain the findings, and share the PDF."
              </p>
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-8">
            <div className="mb-6 flex items-center gap-3">
              <FileText className="h-7 w-7 text-cyan-300" />
              <h2 className="text-3xl font-black">Delivery checklist</h2>
            </div>

            <div className="grid gap-3">
              {deliveryChecklist.map((item) => (
                <div
                  key={item}
                  className="flex gap-3 rounded-2xl border border-white/10 bg-slate-950 p-4"
                >
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-cyan-300" />
                  <span className="text-slate-300">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mt-8 rounded-3xl border border-cyan-300/20 bg-cyan-300/10 p-8">
          <h2 className="text-3xl font-black text-cyan-100">
            Feedback questions
          </h2>
          <div className="mt-6 grid gap-3 md:grid-cols-2">
            {feedbackQuestions.map((question) => (
              <div
                key={question}
                className="rounded-2xl bg-slate-950/70 p-5 font-semibold text-cyan-50"
              >
                {question}
              </div>
            ))}
          </div>
        </section>

        <section className="mt-8 rounded-3xl border border-white/10 bg-white/[0.04] p-8 text-center">
          <h2 className="text-3xl font-black">V1 is now pilot-launch ready</h2>
          <p className="mx-auto mt-4 max-w-3xl leading-8 text-slate-300">
            Stop building more features for now. Use VeyraSec with real
            customers. Your next milestone is one paid pilot and one
            testimonial.
          </p>

          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              href="/pilot"
              className="inline-flex items-center justify-center rounded-2xl bg-cyan-300 px-6 py-4 font-bold text-slate-950 hover:bg-cyan-200"
            >
              Open pilot page
            </Link>
            <Link
              href="/dashboard/validation"
              className="inline-flex items-center justify-center rounded-2xl border border-white/10 px-6 py-4 font-bold text-white hover:bg-white/10"
            >
              Track customer feedback
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
