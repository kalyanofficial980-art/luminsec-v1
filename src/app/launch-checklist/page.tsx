import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  ClipboardCheck,
  FileText,
  Globe2,
  Lock,
  Rocket,
  ShieldCheck,
  Users,
} from "lucide-react";
import { brand } from "@/config/brand";

const productChecklist = [
  "Homepage explains the problem clearly",
  "Signup and login work",
  "User dashboard works",
  "Website add workflow works",
  "Safe passive scan works",
  "Scan report page works",
  "Scan history works",
  "Printable PDF report works",
  "English and Telugu-English report modes work",
  "Pricing page is live",
  "Sample report page is live",
  "Disclaimer page is live",
];

const safetyChecklist = [
  "Only passive checks are performed",
  "No exploitation",
  "No brute force",
  "No login testing",
  "No password testing",
  "No intrusive scanning",
  "Disclaimer is visible",
  "Customer demo explains V1 limits clearly",
];

const launchSteps = [
  {
    title: "Day 1: Product sanity check",
    text: "Test homepage, signup, login, add website, passive scan, report page, PDF print page, and language mode.",
  },
  {
    title: "Day 2: Demo material",
    text: "Use /sample-report, /pitch, and /demo-script to prepare a clean 5 to 7 minute demo.",
  },
  {
    title: "Day 3: First 10 leads",
    text: "Collect 10 websites from small businesses, local agencies, freelancers, clinics, and coaching centers.",
  },
  {
    title: "Day 4: Outreach",
    text: "Send simple WhatsApp, email, or LinkedIn messages. Offer a free starter website trust report.",
  },
  {
    title: "Day 5: Calls and feedback",
    text: "Do short demos, collect objections, and improve the report wording.",
  },
  {
    title: "Day 6-7: First paid pilot",
    text: "Offer a low-cost pilot report and starter explanation call. Focus on learning, not big revenue.",
  },
];

const metrics = [
  {
    label: "Target leads",
    value: "10",
  },
  {
    label: "Demo calls",
    value: "3",
  },
  {
    label: "Free reports",
    value: "5",
  },
  {
    label: "Paid pilot goal",
    value: "1",
  },
];

export default function LaunchChecklistPage() {
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
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-400/10 ring-1 ring-cyan-300/30">
              <Rocket className="h-6 w-6 text-cyan-300" />
            </div>
            <div>
              <h1 className="text-4xl font-black">V1 launch checklist</h1>
              <p className="text-slate-400">{brand.name} first customer launch system</p>
            </div>
          </div>

          <p className="max-w-3xl leading-8 text-slate-300">
            This page helps you verify that VeyraSec V1 is ready for real pilot users.
            The goal is simple: prove that small businesses and agencies understand the report,
            find it useful, and are willing to test or pay for it.
          </p>

          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {metrics.map((metric) => (
              <div key={metric.label} className="rounded-3xl border border-white/10 bg-slate-950 p-6">
                <p className="text-sm text-slate-400">{metric.label}</p>
                <p className="mt-2 text-4xl font-black">{metric.value}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-8 grid gap-8 lg:grid-cols-2">
          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-8">
            <div className="mb-6 flex items-center gap-3">
              <ClipboardCheck className="h-7 w-7 text-cyan-300" />
              <h2 className="text-3xl font-black">Product readiness</h2>
            </div>

            <div className="grid gap-3">
              {productChecklist.map((item) => (
                <div key={item} className="flex gap-3 rounded-2xl border border-white/10 bg-slate-950 p-4">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-cyan-300" />
                  <span className="text-slate-300">{item}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-cyan-300/20 bg-cyan-300/10 p-8">
            <div className="mb-6 flex items-center gap-3">
              <ShieldCheck className="h-7 w-7 text-cyan-300" />
              <h2 className="text-3xl font-black text-cyan-100">Safety scope</h2>
            </div>

            <div className="grid gap-3">
              {safetyChecklist.map((item) => (
                <div key={item} className="flex gap-3 rounded-2xl bg-slate-950/70 p-4">
                  <Lock className="mt-0.5 h-5 w-5 shrink-0 text-cyan-300" />
                  <span className="text-cyan-50">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mt-8 rounded-3xl border border-white/10 bg-white/[0.04] p-8">
          <div className="mb-6 flex items-center gap-3">
            <Globe2 className="h-7 w-7 text-cyan-300" />
            <h2 className="text-3xl font-black">7-day launch plan</h2>
          </div>

          <div className="grid gap-4">
            {launchSteps.map((step, index) => (
              <div key={step.title} className="rounded-3xl border border-white/10 bg-slate-950 p-6">
                <div className="flex gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-cyan-300 font-black text-slate-950">
                    {index + 1}
                  </div>
                  <div>
                    <h3 className="text-xl font-black">{step.title}</h3>
                    <p className="mt-2 leading-7 text-slate-400">{step.text}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-8 grid gap-5 md:grid-cols-3">
          <Link
            href="/outreach"
            className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 transition hover:bg-white/[0.07]"
          >
            <Users className="mb-4 h-7 w-7 text-cyan-300" />
            <h2 className="text-2xl font-black">Outreach system</h2>
            <p className="mt-3 text-slate-400">Open first 10 customer lead system and scripts.</p>
          </Link>

          <Link
            href="/demo-script"
            className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 transition hover:bg-white/[0.07]"
          >
            <FileText className="mb-4 h-7 w-7 text-cyan-300" />
            <h2 className="text-2xl font-black">Demo script</h2>
            <p className="mt-3 text-slate-400">Use the 7-minute sales demo script.</p>
          </Link>

          <Link
            href="/sample-report"
            className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 transition hover:bg-white/[0.07]"
          >
            <ShieldCheck className="mb-4 h-7 w-7 text-cyan-300" />
            <h2 className="text-2xl font-black">Sample report</h2>
            <p className="mt-3 text-slate-400">Show a public report before asking users to sign up.</p>
          </Link>
        </section>
      </div>
    </main>
  );
}