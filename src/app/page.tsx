import Link from "next/link";
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  FileText,
  Globe2,
  Languages,
  Lock,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";
import { brand } from "@/config/brand";

const features = [
  {
    title: "Safe passive checks",
    text: "Review public website trust signals without exploitation, brute force, password testing, or intrusive scanning.",
    icon: Lock,
  },
  {
    title: "Business-ready reports",
    text: "Generate clear security, privacy, and trust readiness reports that business owners can understand.",
    icon: FileText,
  },
  {
    title: "Small business fix workflow",
    text: "Useful for small business owners who need clear before-after readiness reports for developers.",
    icon: Building2,
  },
  {
    title: "English + Telugu-English",
    text: "Explain report findings in simple language for Indian small business customers.",
    icon: Languages,
  },
];

const useCases = [
  "Small business website trust report",
  "Small business before-after readiness report",
  "Small business readiness checklist",
  "Clinic, coaching center, local service website review",
];

const safetyRules = [
  "No exploitation",
  "No brute force",
  "No login testing",
  "No password testing",
  "No intrusive scanning",
];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <header className="border-b border-white/10 px-6 py-5">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-400/10 ring-1 ring-cyan-300/30">
              <ShieldCheck className="h-6 w-6 text-cyan-300" />
            </div>
            <div>
              <p className="text-xl font-black tracking-tight">{brand.name}</p>
              <p className="text-xs uppercase tracking-[0.24em] text-cyan-200/70">
                {brand.version}
              </p>
            </div>
          </Link>

          <nav className="hidden items-center gap-6 text-sm font-semibold text-slate-300 md:flex">
            <Link href="/pricing" className="hover:text-white">
              Pricing
            </Link>
            <Link href="/sample-report" className="hover:text-white">
              Sample report
            </Link>
            <Link href="/security" className="hover:text-white">
              Security
            </Link>
            <Link href="/contact" className="hover:text-white">
              Contact
            </Link>
          </nav>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="hidden rounded-2xl border border-white/10 px-4 py-3 text-sm font-bold text-slate-200 hover:bg-white/10 sm:inline-flex"
            >
              Login
            </Link>
            <Link
              href="/pilot"
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-cyan-300 px-4 py-3 text-sm font-bold text-slate-950 hover:bg-cyan-200"
            >
              Apply for pilot
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </header>

      <section className="px-6 py-20 md:py-28">
        <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <div>
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/10 px-4 py-2 text-sm font-semibold text-cyan-100">
              <Sparkles className="h-4 w-4" />
              Website trust reports for pilot customers
            </div>

            <h1 className="max-w-5xl text-5xl font-black tracking-tight md:text-7xl">
              Turn a website into a clear security, privacy, and trust readiness
              report.
            </h1>

            <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-300">
              {brand.name} helps Indian small businesses explain basic website
              trust risks using safe passive checks and business-ready reports.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/pilot"
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-cyan-300 px-6 py-4 font-bold text-slate-950 hover:bg-cyan-200"
              >
                Request pilot report
                <ArrowRight className="h-5 w-5" />
              </Link>
              <Link
                href="/sample-report"
                className="inline-flex items-center justify-center rounded-2xl border border-white/10 px-6 py-4 font-bold text-white hover:bg-white/10"
              >
                View sample report
              </Link>
            </div>

            <p className="mt-5 text-sm leading-6 text-slate-500">
              VeyraSec V2 Beta is for controlled pilot use. It is not a full
              cybersecurity audit, not legal advice, and not a penetration test.
            </p>
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 shadow-2xl shadow-cyan-950/20">
            <div className="rounded-[1.5rem] border border-cyan-300/20 bg-cyan-300/10 p-6">
              <div className="mb-5 flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm text-cyan-100/80">
                    Website Trust Score
                  </p>
                  <p className="mt-2 text-6xl font-black text-white">78</p>
                </div>
                <div className="rounded-2xl bg-slate-950/70 p-4">
                  <Globe2 className="h-9 w-9 text-cyan-300" />
                </div>
              </div>

              <div className="grid gap-3">
                {[
                  ["Security readiness", "72/100"],
                  ["Privacy readiness", "80/100"],
                  ["Trust signals", "83/100"],
                ].map(([label, value]) => (
                  <div
                    key={label}
                    className="flex items-center justify-between rounded-2xl bg-slate-950/70 p-4"
                  >
                    <span className="text-cyan-50/90">{label}</span>
                    <span className="font-black text-white">{value}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-5 grid gap-3">
              {[
                "HTTPS detected",
                "Privacy policy found",
                "Security headers need improvement",
                "Business-ready PDF available",
              ].map((item) => (
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
        </div>
      </section>

      <section className="border-y border-white/10 bg-white/[0.03] px-6 py-14">
        <div className="mx-auto grid max-w-7xl gap-5 md:grid-cols-4">
          {features.map((feature) => {
            const Icon = feature.icon;

            return (
              <div
                key={feature.title}
                className="rounded-3xl border border-white/10 bg-slate-950 p-6"
              >
                <Icon className="mb-4 h-7 w-7 text-cyan-300" />
                <h2 className="text-xl font-black">{feature.title}</h2>
                <p className="mt-3 leading-7 text-slate-400">{feature.text}</p>
              </div>
            );
          })}
        </div>
      </section>

      <section className="px-6 py-16">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-2">
          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-8">
            <div className="mb-6 flex items-center gap-3">
              <Users className="h-7 w-7 text-cyan-300" />
              <h2 className="text-3xl font-black">Best-fit use cases</h2>
            </div>

            <div className="grid gap-3">
              {useCases.map((item) => (
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
              <Lock className="h-7 w-7 text-cyan-300" />
              <h2 className="text-3xl font-black text-cyan-100">
                Safe V2 scope
              </h2>
            </div>

            <div className="grid gap-3">
              {safetyRules.map((item) => (
                <div
                  key={item}
                  className="rounded-2xl bg-slate-950/70 p-4 font-semibold text-cyan-50"
                >
                  {item}
                </div>
              ))}
            </div>

            <Link
              href="/security"
              className="mt-6 inline-flex items-center justify-center rounded-2xl border border-cyan-300/20 px-5 py-3 font-bold text-cyan-100 hover:bg-cyan-300/10"
            >
              Read security scope
            </Link>
          </div>
        </div>
      </section>

      <section className="px-6 pb-16">
        <div className="mx-auto rounded-[2rem] border border-white/10 bg-white/[0.04] p-8 text-center md:max-w-5xl md:p-12">
          <h2 className="text-4xl font-black">
            Ready to test VeyraSec on a real website?
          </h2>
          <p className="mx-auto mt-4 max-w-3xl leading-8 text-slate-300">
            Start with one website. Get a basic trust report, PDF output, and a
            simple explanation call.
          </p>

          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              href="/pilot"
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-cyan-300 px-6 py-4 font-bold text-slate-950 hover:bg-cyan-200"
            >
              Apply for pilot
              <ArrowRight className="h-5 w-5" />
            </Link>
            <Link
              href="/pricing"
              className="inline-flex items-center justify-center rounded-2xl border border-white/10 px-6 py-4 font-bold text-white hover:bg-white/10"
            >
              See pricing
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-white/10 px-6 py-8 text-sm text-slate-500">
        <div className="mx-auto flex max-w-7xl flex-col justify-between gap-4 md:flex-row md:items-center">
          <p>
            © {new Date().getFullYear()} {brand.name}. Safe passive website
            trust reports.
          </p>

          <div className="flex flex-wrap gap-3">
            <Link href="/pricing" className="text-cyan-300 hover:text-cyan-200">
              Pricing
            </Link>
            <span>·</span>
            <Link
              href="/sample-report"
              className="text-cyan-300 hover:text-cyan-200"
            >
              Sample report
            </Link>
            <span>·</span>
            <Link href="/contact" className="text-cyan-300 hover:text-cyan-200">
              Contact
            </Link>
            <span>·</span>
            <Link
              href="/security"
              className="text-cyan-300 hover:text-cyan-200"
            >
              Security
            </Link>
            <span>·</span>
            <Link
              href="/legal/disclaimer"
              className="text-cyan-300 hover:text-cyan-200"
            >
              Disclaimer
            </Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
