import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  FileText,
  Globe2,
  Lock,
  Rocket,
  ShieldCheck,
  Target,
  Users,
} from "lucide-react";
import { brand } from "@/config/brand";

const proofPoints = [
  "Working authentication with Supabase",
  "User dashboard and website management",
  "Safe passive scanner engine",
  "Security, privacy, and trust scores",
  "Scan history and report pages",
  "Printable PDF report workflow",
  "English and Telugu-English explanation modes",
  "Public pricing, disclaimer, and sample report pages",
];

const marketSignals = [
  {
    title: "Small businesses are online",
    text: "Many small businesses now depend on websites, landing pages, forms, and WhatsApp lead funnels.",
  },
  {
    title: "Trust gap is visible",
    text: "Owners usually do not know whether HTTPS, privacy policy, forms, and headers are configured properly.",
  },
  {
    title: "Agencies need reporting",
    text: "Freelancers and web agencies need a simple report they can share with clients before and after fixes.",
  },
];

const roadmap = [
  "V1: Passive website trust report",
  "V2: Business client workspace",
  "V3: Scheduled monitoring and alerts",
  "V4: AI remediation guidance",
  "V5: Compliance-ready business reports",
];

const demoFlow = [
  "Open VeyraSec landing page",
  "Create account or login",
  "Add client website URL",
  "Run safe passive scan",
  "Explain score and findings",
  "Switch English / Telugu-English mode",
  "Open printable PDF report",
  "Close with business or owner pricing",
];

export default function PitchPage() {
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

        <section className="grid gap-10 rounded-3xl border border-white/10 bg-white/[0.04] p-8 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/10 px-4 py-2 text-sm text-cyan-100">
              <Rocket className="h-4 w-4" />
              V1 funding proof page
            </div>

            <h1 className="max-w-4xl text-5xl font-black tracking-tight md:text-7xl">
              VeyraSec turns website trust risk into simple business reports.
            </h1>

            <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-300">
              {brand.name} is a cybersecurity and privacy readiness SaaS for
              small businesses, freelancers, web agencies, and early-stage
              startups. V1 proves that a user can add a website, run safe
              passive checks, view findings, and download a client-ready report.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/sample-report"
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-cyan-300 px-6 py-4 font-bold text-slate-950 hover:bg-cyan-200"
              >
                View sample report
                <ArrowRight className="h-5 w-5" />
              </Link>
              <Link
                href="/demo-script"
                className="inline-flex items-center justify-center rounded-2xl border border-white/10 px-6 py-4 font-bold text-white hover:bg-white/10"
              >
                Open demo script
              </Link>
            </div>
          </div>

          <div className="rounded-3xl border border-cyan-300/20 bg-cyan-300/10 p-6">
            <div className="mb-6 flex items-center gap-3">
              <ShieldCheck className="h-8 w-8 text-cyan-300" />
              <div>
                <h2 className="text-2xl font-black">Current V1 status</h2>
                <p className="text-cyan-50/80">Working prototype</p>
              </div>
            </div>

            <div className="grid gap-3">
              {proofPoints.map((point) => (
                <div
                  key={point}
                  className="flex gap-3 rounded-2xl bg-slate-950/60 p-4"
                >
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-cyan-300" />
                  <span className="text-cyan-50">{point}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mt-8 grid gap-5 md:grid-cols-3">
          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
            <Target className="mb-4 h-7 w-7 text-cyan-300" />
            <h2 className="text-2xl font-black">Problem</h2>
            <p className="mt-3 leading-7 text-slate-300">
              Small businesses collect leads through websites, but most owners
              cannot understand starter website security, privacy, and trust
              gaps.
            </p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
            <FileText className="mb-4 h-7 w-7 text-cyan-300" />
            <h2 className="text-2xl font-black">Solution</h2>
            <p className="mt-3 leading-7 text-slate-300">
              VeyraSec creates a simple website trust report with scores,
              findings, recommendations, language modes, and printable PDF
              output.
            </p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
            <Users className="mb-4 h-7 w-7 text-cyan-300" />
            <h2 className="text-2xl font-black">Customer</h2>
            <p className="mt-3 leading-7 text-slate-300">
              Early customers can be web agencies, local business owners,
              freelancers, clinics, coaching centers, and startup founders.
            </p>
          </div>
        </section>

        <section className="mt-8 rounded-3xl border border-white/10 bg-white/[0.04] p-8">
          <div className="mb-6 flex items-center gap-3">
            <Globe2 className="h-7 w-7 text-cyan-300" />
            <h2 className="text-3xl font-black">Market signals</h2>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {marketSignals.map((item) => (
              <div
                key={item.title}
                className="rounded-3xl border border-white/10 bg-slate-950 p-6"
              >
                <h3 className="text-xl font-bold">{item.title}</h3>
                <p className="mt-3 leading-7 text-slate-400">{item.text}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-8 grid gap-8 lg:grid-cols-2">
          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-8">
            <div className="mb-6 flex items-center gap-3">
              <Lock className="h-7 w-7 text-cyan-300" />
              <h2 className="text-3xl font-black">Business model</h2>
            </div>

            <div className="space-y-4 text-slate-300">
              <div className="rounded-2xl border border-white/10 bg-slate-950 p-5">
                <p className="font-bold text-white">Starter</p>
                <p className="mt-1 text-sm">
                  Free beginner for product adoption and feedback.
                </p>
              </div>
              <div className="rounded-2xl border border-cyan-300/20 bg-cyan-300/10 p-5">
                <p className="font-bold text-cyan-100">Starter Report</p>
                <p className="mt-1 text-sm text-cyan-50/80">
                  One website report for small business owners.
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-slate-950 p-5">
                <p className="font-bold text-white">Business Pilot</p>
                <p className="mt-1 text-sm">
                  Recurring package for agencies managing multiple websites.
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-8">
            <div className="mb-6 flex items-center gap-3">
              <Rocket className="h-7 w-7 text-cyan-300" />
              <h2 className="text-3xl font-black">Roadmap</h2>
            </div>

            <div className="space-y-4">
              {roadmap.map((item, index) => (
                <div
                  key={item}
                  className="flex gap-4 rounded-2xl border border-white/10 bg-slate-950 p-5"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-cyan-300 font-black text-slate-950">
                    {index + 1}
                  </div>
                  <p className="font-semibold text-slate-200">{item}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mt-8 rounded-3xl border border-cyan-300/20 bg-cyan-300/10 p-8">
          <h2 className="text-3xl font-black text-cyan-100">
            Demo flow for investors or customers
          </h2>
          <div className="mt-6 grid gap-3 md:grid-cols-2 lg:grid-cols-4">
            {demoFlow.map((item, index) => (
              <div key={item} className="rounded-2xl bg-slate-950/70 p-5">
                <p className="text-sm font-bold text-cyan-300">
                  Step {index + 1}
                </p>
                <p className="mt-2 font-semibold text-cyan-50">{item}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-8 rounded-3xl border border-white/10 bg-white/[0.04] p-8 text-center">
          <h2 className="text-3xl font-black">V1 funding proof statement</h2>
          <p className="mx-auto mt-4 max-w-3xl leading-8 text-slate-300">
            VeyraSec V1 is not just an idea. It is a working web product with
            login, database, scanning workflow, scan history, reports, PDF print
            mode, language modes, and public sales pages. The next milestone is
            customer validation with small businesses and agencies.
          </p>

          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              href="/signup"
              className="inline-flex items-center justify-center rounded-2xl bg-cyan-300 px-6 py-4 font-bold text-slate-950 hover:bg-cyan-200"
            >
              Try product
            </Link>
            <Link
              href="/pricing"
              className="inline-flex items-center justify-center rounded-2xl border border-white/10 px-6 py-4 font-bold text-white hover:bg-white/10"
            >
              View pricing
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
