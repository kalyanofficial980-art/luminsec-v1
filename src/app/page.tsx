import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  FileText,
  Globe2,
  Lock,
  Radar,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { brand } from "@/config/brand";

const checks = [
  "HTTPS and SSL readiness",
  "Security headers visibility",
  "Privacy policy presence",
  "Contact form risk signals",
  "Basic trust score",
  "Printable PDF report",
];

const audiences = [
  "Small business websites",
  "Clinics and coaching centers",
  "Agencies and freelancers",
  "Early-stage startups",
];

const steps = [
  "Add website URL",
  "Run safe passive scan",
  "Review scores and findings",
  "Download client-ready PDF",
];

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <section className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-6 py-8">
        <header className="flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-400/10 ring-1 ring-cyan-300/30">
              <ShieldCheck className="h-6 w-6 text-cyan-300" />
            </div>
            <div>
              <p className="text-lg font-bold tracking-tight">{brand.name}</p>
              <p className="text-xs uppercase tracking-[0.3em] text-cyan-200/70">
                {brand.version}
              </p>
            </div>
          </Link>

          <nav className="hidden items-center gap-6 text-sm text-slate-300 md:flex">
            <a href="#features" className="hover:text-white">Features</a>
            <Link href="/pricing" className="hover:text-white">Pricing</Link>
            <Link href="/sample-report" className="hover:text-white">Sample report</Link>
            <Link href="/pitch" className="hover:text-white">Pitch</Link>
            <Link href="/demo-script" className="hover:text-white">Demo script</Link>
            <Link href="/login" className="hover:text-white">Login</Link>
          </nav>

          <Link
            href="/signup"
            className="rounded-2xl bg-cyan-300 px-5 py-3 text-sm font-bold text-slate-950 hover:bg-cyan-200"
          >
            Start free
          </Link>
        </header>

        <div className="grid flex-1 items-center gap-12 py-16 lg:grid-cols-[1.05fr_0.95fr]">
          <div>
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/10 px-4 py-2 text-sm text-cyan-100">
              <Sparkles className="h-4 w-4" />
              Passive website trust checks for modern small businesses
            </div>

            <h1 className="max-w-4xl text-5xl font-black tracking-tight text-white md:text-7xl">
              Turn website security and privacy risks into clear reports.
            </h1>

            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
              {brand.description}
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/signup"
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-cyan-300 px-6 py-4 font-semibold text-slate-950 transition hover:bg-cyan-200"
              >
                Create account
                <ArrowRight className="h-5 w-5" />
              </Link>
              <Link
                href="/sample-report"
                className="inline-flex items-center justify-center rounded-2xl border border-white/10 px-6 py-4 font-semibold text-white transition hover:bg-white/10"
              >
                View sample report
              </Link>
            </div>

            <p className="mt-5 text-sm text-slate-500">
              V1 uses safe passive checks only. Not legal advice. Not a full penetration test.
            </p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 shadow-2xl shadow-cyan-950/40">
            <div className="rounded-2xl border border-white/10 bg-slate-900 p-5">
              <div className="mb-6 flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm text-slate-400">Sample website score</p>
                  <p className="text-5xl font-black">78</p>
                </div>
                <div className="rounded-2xl bg-amber-400/10 px-4 py-2 text-sm font-semibold text-amber-200">
                  Needs improvement
                </div>
              </div>

              <div className="space-y-3">
                {[
                  ["HTTPS", "Good", "text-emerald-300"],
                  ["Security Headers", "Missing CSP", "text-amber-300"],
                  ["Privacy Policy", "Found", "text-emerald-300"],
                  ["Contact Form", "Review required", "text-amber-300"],
                ].map(([label, value, color]) => (
                  <div
                    key={label}
                    className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.03] p-4"
                  >
                    <span className="text-slate-300">{label}</span>
                    <span className={color}>{value}</span>
                  </div>
                ))}
              </div>

              <div className="mt-5 rounded-2xl bg-cyan-300/10 p-4 text-sm leading-6 text-cyan-100">
                AI-style summary: This website has a good HTTPS setup but should improve browser security headers and contact-form privacy wording.
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="border-t border-white/10 bg-slate-950 px-6 py-20">
        <div className="mx-auto max-w-7xl">
          <div className="mb-10 flex items-center gap-3">
            <Radar className="h-6 w-6 text-cyan-300" />
            <h2 className="text-3xl font-bold">V1 feature scope</h2>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {checks.map((item) => (
              <div key={item} className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
                <CheckCircle2 className="mb-4 h-6 w-6 text-cyan-300" />
                <p className="font-semibold">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-white/10 bg-slate-900/50 px-6 py-20">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-2">
          <div>
            <FileText className="mb-5 h-8 w-8 text-cyan-300" />
            <h2 className="text-3xl font-bold">Simple workflow for owners and agencies.</h2>
            <p className="mt-4 text-slate-300">
              VeyraSec converts public website signals into a clear dashboard and PDF report.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {steps.map((item, index) => (
              <div key={item} className="rounded-3xl border border-white/10 bg-slate-950 p-6">
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-2xl bg-cyan-300 text-lg font-black text-slate-950">
                  {index + 1}
                </div>
                <p className="font-semibold">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-white/10 bg-slate-950 px-6 py-20">
        <div className="mx-auto max-w-7xl">
          <div className="mb-10">
            <Globe2 className="mb-5 h-8 w-8 text-cyan-300" />
            <h2 className="text-3xl font-bold">Built for businesses without a security team.</h2>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {audiences.map((item) => (
              <div key={item} className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
                <Lock className="mb-4 h-5 w-5 text-cyan-300" />
                <p className="font-semibold">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-white/10 px-6 py-16 text-center">
        <h2 className="text-3xl font-black">Ready to try VeyraSec V1?</h2>
        <p className="mx-auto mt-3 max-w-2xl text-slate-400">
          Add a website, run a safe passive scan, and download a client-ready report.
        </p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Link
            href="/signup"
            className="inline-flex items-center justify-center rounded-2xl bg-cyan-300 px-6 py-4 font-bold text-slate-950 hover:bg-cyan-200"
          >
            Start free
          </Link>
          <Link
            href="/pricing"
            className="inline-flex items-center justify-center rounded-2xl border border-white/10 px-6 py-4 font-bold text-white hover:bg-white/10"
          >
            View pricing
          </Link>
        </div>
      </section>

      <footer className="border-t border-white/10 px-6 py-10 text-center text-sm text-slate-500">
        © 2026 {brand.name}. Basic passive readiness checks only.{" "}
        <Link href="/legal/disclaimer" className="text-cyan-300 hover:text-cyan-200">
          Disclaimer
        </Link>
      </footer>
    </main>
  );
}