import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  ClipboardList,
  FileText,
  Globe2,
  Rocket,
  ShieldCheck,
  Target,
  Users,
} from "lucide-react";
import { brand } from "@/config/brand";

const readyAssets = [
  {
    title: "Product URL",
    value: "https://luminsec-v1.vercel.app",
  },
  {
    title: "Sample report",
    value: "/sample-report",
  },
  {
    title: "Pricing",
    value: "/pricing",
  },
  {
    title: "Pilot application",
    value: "/pilot",
  },
  {
    title: "Security scope",
    value: "/security",
  },
  {
    title: "Demo script",
    value: "/demo-script",
  },
];

const launchProof = [
  "Professional public landing page",
  "Signup and login",
  "SaaS dashboard",
  "Website management",
  "Safe passive scanner",
  "Scan history",
  "Report pages",
  "Printable PDF workflow",
  "English and Telugu-English explanations",
  "Customer validation tracker",
  "Business settings inside reports",
  "Contact and pilot lead capture",
  "Security and production QA pages",
];

const firstPilotOffer = [
  "One website passive trust report",
  "Score explanation call",
  "PDF report for business owner",
  "Developer-friendly recommendations",
  "Before-after recheck after fixes",
  "Clear safety disclaimer",
];

const launchRules = [
  "Do not say full audit",
  "Do not say penetration test",
  "Do not say legal compliance certificate",
  "Say starter passive website trust report",
  "Scan only owned or permitted websites",
  "Use manual UPI or bank transfer for first paid pilot",
];

export default function LaunchPackagePage() {
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
            V1 pilot launch package
          </div>

          <h1 className="max-w-4xl text-5xl font-black tracking-tight md:text-7xl">
            VeyraSec V1 is ready for controlled pilot launch.
          </h1>

          <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-300">
            {brand.name} now has the core SaaS workflow needed to approach first
            pilot customers: public website, dashboard, scanner, reports, PDF
            workflow, pricing, safety scope, lead capture, and customer
            validation tracking.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/pilot"
              className="inline-flex items-center justify-center rounded-2xl bg-cyan-300 px-6 py-4 font-bold text-slate-950 hover:bg-cyan-200"
            >
              Open pilot page
            </Link>
            <Link
              href="/paid-pilot-checklist"
              className="inline-flex items-center justify-center rounded-2xl border border-white/10 px-6 py-4 font-bold text-white hover:bg-white/10"
            >
              First paid pilot checklist
            </Link>
          </div>
        </section>

        <section className="mt-8 grid gap-5 md:grid-cols-3">
          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
            <Target className="mb-4 h-7 w-7 text-cyan-300" />
            <h2 className="text-2xl font-black">Launch goal</h2>
            <p className="mt-3 leading-7 text-slate-300">
              Get 10 real leads, 3 demos, 5 feedback conversations, and 1 paid
              pilot.
            </p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
            <Users className="mb-4 h-7 w-7 text-cyan-300" />
            <h2 className="text-2xl font-black">Best customers</h2>
            <p className="mt-3 leading-7 text-slate-300">
              Web agencies, freelancers, clinics, coaching centers, small
              businesses, and startup websites.
            </p>
          </div>

          <div className="rounded-3xl border border-cyan-300/20 bg-cyan-300/10 p-6">
            <ShieldCheck className="mb-4 h-7 w-7 text-cyan-300" />
            <h2 className="text-2xl font-black text-cyan-100">
              Safe positioning
            </h2>
            <p className="mt-3 leading-7 text-cyan-50/90">
              Starter passive website trust report. Not a full audit. Not legal
              advice. Not a penetration test.
            </p>
          </div>
        </section>

        <section className="mt-8 rounded-3xl border border-white/10 bg-white/[0.04] p-8">
          <div className="mb-6 flex items-center gap-3">
            <Globe2 className="h-7 w-7 text-cyan-300" />
            <h2 className="text-3xl font-black">Launch assets</h2>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {readyAssets.map((asset) => (
              <div
                key={asset.title}
                className="rounded-3xl border border-white/10 bg-slate-950 p-6"
              >
                <p className="text-sm text-slate-400">{asset.title}</p>
                <p className="mt-2 break-all text-lg font-bold text-white">
                  {asset.value}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-8 grid gap-8 lg:grid-cols-2">
          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-8">
            <div className="mb-6 flex items-center gap-3">
              <CheckCircle2 className="h-7 w-7 text-cyan-300" />
              <h2 className="text-3xl font-black">V1 proof completed</h2>
            </div>

            <div className="grid gap-3">
              {launchProof.map((item) => (
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
              <FileText className="h-7 w-7 text-cyan-300" />
              <h2 className="text-3xl font-black text-cyan-100">
                First paid pilot offer
              </h2>
            </div>

            <div className="grid gap-3">
              {firstPilotOffer.map((item) => (
                <div
                  key={item}
                  className="flex gap-3 rounded-2xl bg-slate-950/70 p-4"
                >
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-cyan-300" />
                  <span className="text-cyan-50">{item}</span>
                </div>
              ))}
            </div>

            <div className="mt-6 rounded-2xl border border-cyan-300/20 bg-slate-950/70 p-5">
              <p className="text-sm font-bold text-cyan-100">
                Suggested pilot price
              </p>
              <p className="mt-2 text-3xl font-black text-white">
                INR 499 - INR 999
              </p>
              <p className="mt-2 text-sm leading-6 text-cyan-50/80">
                Start low for first customer validation. Increase pricing after
                proof and testimonials.
              </p>
            </div>
          </div>
        </section>

        <section className="mt-8 rounded-3xl border border-amber-300/20 bg-amber-300/10 p-8">
          <div className="mb-6 flex items-center gap-3">
            <ClipboardList className="h-7 w-7 text-amber-200" />
            <h2 className="text-3xl font-black text-amber-100">Launch rules</h2>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            {launchRules.map((item) => (
              <div
                key={item}
                className="rounded-2xl bg-slate-950/70 p-4 font-semibold text-amber-50"
              >
                {item}
              </div>
            ))}
          </div>
        </section>

        <section className="mt-8 rounded-3xl border border-white/10 bg-white/[0.04] p-8 text-center">
          <h2 className="text-3xl font-black">Final V1 launch statement</h2>
          <p className="mx-auto mt-4 max-w-3xl leading-8 text-slate-300">
            VeyraSec V1 is ready for pilot launch. The next step is not more
            features. The next step is customer conversations, feedback, and one
            paid pilot.
          </p>

          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              href="/outreach"
              className="inline-flex items-center justify-center rounded-2xl bg-cyan-300 px-6 py-4 font-bold text-slate-950 hover:bg-cyan-200"
            >
              Start outreach
            </Link>
            <Link
              href="/dashboard/validation"
              className="inline-flex items-center justify-center rounded-2xl border border-white/10 px-6 py-4 font-bold text-white hover:bg-white/10"
            >
              Track validation
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
