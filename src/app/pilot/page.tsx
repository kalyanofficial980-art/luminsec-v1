import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  FileText,
  Globe2,
  Rocket,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { brand } from "@/config/brand";
import { submitPilotLead } from "@/app/contact/actions";

const pilotBenefits = [
  "Website trust score",
  "Security, privacy, and trust findings",
  "English and Telugu-English explanations",
  "Printable PDF report",
  "Founder explanation call",
  "Developer-friendly recommendations",
];

const pilotFit = [
  "You own a small business website",
  "You run a web design agency",
  "You manage client websites",
  "Your website collects leads through forms",
  "You want a simple before-after report",
];

export default async function PilotPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string }>;
}) {
  const params = await searchParams;

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

        <section className="grid gap-8 lg:grid-cols-[1fr_0.95fr]">
          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-8">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/10 px-4 py-2 text-sm text-cyan-100">
              <Sparkles className="h-4 w-4" />
              V1 pilot program
            </div>

            <h1 className="max-w-4xl text-5xl font-black tracking-tight md:text-6xl">
              Get a basic website trust report for your business or client.
            </h1>

            <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-300">
              {brand.name} V1 helps small businesses and agencies understand basic
              website security, privacy, and trust readiness using safe passive checks.
            </p>

            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              {pilotBenefits.map((item) => (
                <div key={item} className="flex gap-3 rounded-2xl border border-white/10 bg-slate-950 p-4">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-cyan-300" />
                  <span className="text-slate-300">{item}</span>
                </div>
              ))}
            </div>

            <div className="mt-8 rounded-3xl border border-amber-300/20 bg-amber-300/10 p-6">
              <div className="mb-3 flex items-center gap-3">
                <ShieldCheck className="h-6 w-6 text-amber-200" />
                <h2 className="text-xl font-black text-amber-100">Important V1 limit</h2>
              </div>
              <p className="leading-7 text-amber-50/90">
                This is not legal advice, not a full cybersecurity audit, and not a penetration test.
                It is a safe passive website readiness report.
              </p>
            </div>
          </div>

          <form action={submitPilotLead} className="rounded-3xl border border-cyan-300/20 bg-cyan-300/10 p-8">
            <div className="mb-6 flex items-center gap-3">
              <Rocket className="h-7 w-7 text-cyan-300" />
              <h2 className="text-3xl font-black text-cyan-100">Apply for pilot</h2>
            </div>

            <p className="leading-7 text-cyan-50/90">
              Submit your website. We will review it with VeyraSec V1 and contact you for the next step.
            </p>

            {params.message ? (
              <div className="mt-6 rounded-2xl border border-cyan-300/20 bg-slate-950/70 p-4 text-cyan-100">
                {params.message}
              </div>
            ) : null}

            <input type="hidden" name="source" value="pilot-page" />
            <input type="hidden" name="lead_type" value="pilot" />

            <div className="mt-6 grid gap-4">
              <label className="grid gap-2">
                <span className="text-sm font-semibold text-cyan-100">Name *</span>
                <input
                  name="name"
                  placeholder="Your name"
                  className="rounded-2xl border border-cyan-300/20 bg-slate-950 px-4 py-3 text-white outline-none focus:border-cyan-300"
                />
              </label>

              <label className="grid gap-2">
                <span className="text-sm font-semibold text-cyan-100">Email *</span>
                <input
                  name="email"
                  type="email"
                  placeholder="you@example.com"
                  className="rounded-2xl border border-cyan-300/20 bg-slate-950 px-4 py-3 text-white outline-none focus:border-cyan-300"
                />
              </label>

              <label className="grid gap-2">
                <span className="text-sm font-semibold text-cyan-100">Phone / WhatsApp</span>
                <input
                  name="phone"
                  placeholder="+91 90000 00000"
                  className="rounded-2xl border border-cyan-300/20 bg-slate-950 px-4 py-3 text-white outline-none focus:border-cyan-300"
                />
              </label>

              <label className="grid gap-2">
                <span className="text-sm font-semibold text-cyan-100">Business / Agency name</span>
                <input
                  name="company_name"
                  placeholder="Business name"
                  className="rounded-2xl border border-cyan-300/20 bg-slate-950 px-4 py-3 text-white outline-none focus:border-cyan-300"
                />
              </label>

              <label className="grid gap-2">
                <span className="text-sm font-semibold text-cyan-100">Website URL *</span>
                <input
                  name="website_url"
                  placeholder="https://example.com"
                  className="rounded-2xl border border-cyan-300/20 bg-slate-950 px-4 py-3 text-white outline-none focus:border-cyan-300"
                />
              </label>

              <label className="grid gap-2">
                <span className="text-sm font-semibold text-cyan-100">What do you need?</span>
                <textarea
                  name="message"
                  rows={4}
                  placeholder="Example: I want a report for my clinic website / my agency client website."
                  className="rounded-2xl border border-cyan-300/20 bg-slate-950 px-4 py-3 text-white outline-none focus:border-cyan-300"
                />
              </label>

              <button
                type="submit"
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-cyan-300 px-5 py-4 font-bold text-slate-950 hover:bg-cyan-200"
              >
                <Rocket className="h-5 w-5" />
                Submit pilot request
              </button>
            </div>
          </form>
        </section>

        <section className="mt-8 grid gap-5 md:grid-cols-2">
          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-8">
            <div className="mb-5 flex items-center gap-3">
              <Globe2 className="h-7 w-7 text-cyan-300" />
              <h2 className="text-3xl font-black">Best pilot fit</h2>
            </div>

            <div className="grid gap-3">
              {pilotFit.map((item) => (
                <div key={item} className="flex gap-3 rounded-2xl border border-white/10 bg-slate-950 p-4">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-cyan-300" />
                  <span className="text-slate-300">{item}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-8">
            <div className="mb-5 flex items-center gap-3">
              <FileText className="h-7 w-7 text-cyan-300" />
              <h2 className="text-3xl font-black">See before applying</h2>
            </div>

            <p className="leading-8 text-slate-300">
              View a public sample report first. Then submit your website if the report format
              looks useful for your business or clients.
            </p>

            <Link
              href="/sample-report"
              className="mt-6 inline-flex items-center justify-center rounded-2xl border border-white/10 px-6 py-4 font-bold text-white hover:bg-white/10"
            >
              Open sample report
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}