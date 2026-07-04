import Link from "next/link";
import { ArrowLeft, Download, FileText, Globe2, ShieldAlert, ShieldCheck } from "lucide-react";
import { brand } from "@/config/brand";

const findings = [
  {
    severity: "medium",
    title: "Content Security Policy header is missing",
    description:
      "The homepage response does not show a Content-Security-Policy header.",
    recommendation:
      "Ask the developer to add a suitable Content-Security-Policy header to reduce browser-side attack risk.",
  },
  {
    severity: "medium",
    title: "Privacy policy should be clearer near forms",
    description:
      "The website collects contact details, but privacy context should be more visible for users.",
    recommendation:
      "Add privacy wording near contact forms and link to a clear Privacy Policy page.",
  },
  {
    severity: "low",
    title: "Referrer-Policy header is missing",
    description:
      "The homepage response does not show a Referrer-Policy header.",
    recommendation:
      "Add a Referrer-Policy header such as strict-origin-when-cross-origin.",
  },
];

export default function SampleReportPage() {
  return (
    <main className="min-h-screen bg-slate-950 p-6 text-white">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-300 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Back home
          </Link>

          <Link
            href="/signup"
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-cyan-300 px-5 py-3 text-sm font-bold text-slate-950 hover:bg-cyan-200"
          >
            <Download className="h-4 w-4" />
            Create your own report
          </Link>
        </div>

        <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-8">
          <div className="mb-8 flex flex-col justify-between gap-5 md:flex-row md:items-start">
            <div>
              <div className="mb-3 flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-400/10 ring-1 ring-cyan-300/30">
                  <ShieldCheck className="h-6 w-6 text-cyan-300" />
                </div>
                <div>
                  <h1 className="text-3xl font-black">{brand.product}</h1>
                  <p className="text-slate-400">Public sample report</p>
                </div>
              </div>

              <div className="mt-5 flex items-center gap-2 text-slate-300">
                <Globe2 className="h-5 w-5 text-cyan-300" />
                <span>sample-business.example</span>
              </div>
              <p className="mt-1 text-sm text-slate-500">https://sample-business.example</p>
            </div>

            <div className="rounded-3xl border border-cyan-300/20 bg-cyan-300/10 p-6 text-center">
              <p className="text-sm text-cyan-100">Overall score</p>
              <p className="mt-2 text-5xl font-black text-white">78</p>
              <p className="mt-3 rounded-full border border-amber-400/30 bg-amber-400/10 px-3 py-1 text-sm font-bold text-amber-100">
                Needs improvement
              </p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-3xl border border-white/10 bg-slate-950 p-5">
              <p className="text-sm text-slate-400">Security score</p>
              <p className="mt-2 text-4xl font-black">72</p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-slate-950 p-5">
              <p className="text-sm text-slate-400">Privacy score</p>
              <p className="mt-2 text-4xl font-black">80</p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-slate-950 p-5">
              <p className="text-sm text-slate-400">Trust score</p>
              <p className="mt-2 text-4xl font-black">82</p>
            </div>
          </div>

          <div className="mt-6 rounded-3xl border border-cyan-300/20 bg-cyan-300/10 p-6">
            <h2 className="text-xl font-bold text-cyan-100">AI-style simple explanation</h2>
            <p className="mt-3 leading-7 text-cyan-50/90">
              This website is usable but needs improvement. The main weak area is security. Share this report with the website developer to improve security headers and privacy wording.
            </p>
          </div>

          <div className="mt-6 rounded-3xl border border-white/10 bg-slate-950 p-6">
            <h2 className="text-xl font-bold">Executive summary</h2>
            <p className="mt-3 leading-7 text-slate-300">
              The website has a working HTTPS setup and visible trust signals, but several passive checks show improvement areas in browser security headers and privacy wording around contact forms.
            </p>
            <p className="mt-4 text-sm text-slate-500">
              Disclaimer: This is a sample report. VeyraSec V1 performs basic passive readiness checks only.
            </p>
          </div>
        </section>

        <section className="mt-8">
          <div className="mb-4 flex items-center gap-3">
            <ShieldAlert className="h-6 w-6 text-cyan-300" />
            <h2 className="text-2xl font-bold">Sample findings</h2>
          </div>

          <div className="grid gap-4">
            {findings.map((finding) => (
              <div
                key={finding.title}
                className="rounded-3xl border border-white/10 bg-white/[0.04] p-6"
              >
                <div className="mb-3 flex flex-col justify-between gap-3 md:flex-row md:items-center">
                  <h3 className="text-xl font-bold">{finding.title}</h3>
                  <span className="w-fit rounded-full border border-amber-400/30 bg-amber-400/10 px-3 py-1 text-xs font-bold uppercase tracking-wide text-amber-100">
                    {finding.severity}
                  </span>
                </div>
                <p className="leading-7 text-slate-300">{finding.description}</p>
                <div className="mt-4 rounded-2xl border border-cyan-300/20 bg-cyan-300/10 p-4">
                  <p className="text-sm font-bold text-cyan-100">Recommendation</p>
                  <p className="mt-1 text-sm leading-6 text-cyan-50/90">
                    {finding.recommendation}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-10 rounded-3xl border border-white/10 bg-white/[0.04] p-8 text-center">
          <FileText className="mx-auto mb-4 h-10 w-10 text-cyan-300" />
          <h2 className="text-2xl font-black">Generate your own report</h2>
          <p className="mx-auto mt-2 max-w-2xl text-slate-400">
            Create an account, add your website, run a safe passive scan, and download a PDF report.
          </p>
          <Link
            href="/signup"
            className="mt-6 inline-flex items-center justify-center rounded-2xl bg-cyan-300 px-6 py-4 font-bold text-slate-950 hover:bg-cyan-200"
          >
            Start free
          </Link>
        </section>
      </div>
    </main>
  );
}