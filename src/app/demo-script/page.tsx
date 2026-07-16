import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  ClipboardList,
  FileText,
  MessageSquare,
  ShieldCheck,
} from "lucide-react";
import { brand } from "@/config/brand";

const demoSteps = [
  {
    title: "1. Opening",
    time: "30 seconds",
    script:
      "Hi, I built VeyraSec to help small businesses understand basic website security, privacy, and trust issues without technical confusion.",
  },
  {
    title: "2. Problem",
    time: "45 seconds",
    script:
      "Most business owners have a website, but they do not know whether HTTPS, privacy policy, contact forms, and browser security headers are configured properly.",
  },
  {
    title: "3. Product demo",
    time: "2 minutes",
    script:
      "Now I will add a website URL, run a safe passive scan, and show the report. VeyraSec does not attack the website. It only checks public signals.",
  },
  {
    title: "4. Report explanation",
    time: "2 minutes",
    script:
      "Here we can see the overall score, security score, privacy score, trust score, findings, and recommendations. This makes it easy for the owner or developer to fix issues.",
  },
  {
    title: "5. Language mode",
    time: "45 seconds",
    script:
      "For Indian small businesses, I also added Telugu-English explanation mode, so non-technical owners can understand the report clearly.",
  },
  {
    title: "6. PDF output",
    time: "45 seconds",
    script:
      "The report can be opened in printable format and saved as PDF. Agencies can share this report with clients before and after website improvements.",
  },
  {
    title: "7. Closing",
    time: "45 seconds",
    script:
      "VeyraSec V1 is ready for pilot testing with small businesses and web agencies. The next step is customer feedback and paid pilot reports.",
  },
];

const objections = [
  {
    question: "Is this a full security audit?",
    answer:
      "No. V1 is a basic passive readiness check. It is not legal advice and not a penetration test.",
  },
  {
    question: "Will this attack my website?",
    answer:
      "No. VeyraSec V1 uses safe passive checks based on public website responses only.",
  },
  {
    question: "Who is this for?",
    answer:
      "Small business owners, web agencies, freelancers, clinics, coaching centers, and startup websites.",
  },
  {
    question: "Why should I pay?",
    answer:
      "Because the report converts technical website trust issues into clear owner-friendly and developer-friendly action points.",
  },
];

const liveDemoChecklist = [
  "Open homepage",
  "Open sample report",
  "Login to dashboard",
  "Add website",
  "Run passive scan",
  "Open report",
  "Switch TE-EN mode",
  "Open PDF print page",
  "Explain pricing",
];

export default function DemoScriptPage() {
  return (
    <main className="min-h-screen bg-slate-950 px-6 py-8 text-white">
      <div className="mx-auto max-w-6xl">
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
              <MessageSquare className="h-6 w-6 text-cyan-300" />
            </div>
            <div>
              <h1 className="text-4xl font-black">Customer demo script</h1>
              <p className="text-slate-400">
                {brand.name} 7-minute V1 sales demo
              </p>
            </div>
          </div>

          <p className="max-w-3xl leading-8 text-slate-300">
            Use this script when showing VeyraSec to a small business owner,
            freelancer, web agency, mentor, investor, or early pilot customer.
          </p>
        </section>

        <section className="mt-8 grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-3xl border border-cyan-300/20 bg-cyan-300/10 p-6">
            <div className="mb-5 flex items-center gap-3">
              <ClipboardList className="h-7 w-7 text-cyan-300" />
              <h2 className="text-2xl font-black text-cyan-100">
                Live demo checklist
              </h2>
            </div>

            <div className="grid gap-3">
              {liveDemoChecklist.map((item) => (
                <div
                  key={item}
                  className="flex gap-3 rounded-2xl bg-slate-950/70 p-4"
                >
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-cyan-300" />
                  <span className="text-cyan-50">{item}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
            <div className="mb-5 flex items-center gap-3">
              <ShieldCheck className="h-7 w-7 text-cyan-300" />
              <h2 className="text-2xl font-black">One-line pitch</h2>
            </div>

            <div className="rounded-2xl border border-white/10 bg-slate-950 p-6">
              <p className="text-xl font-bold leading-8 text-white">
                VeyraSec helps small businesses understand website security,
                privacy, and trust gaps using safe passive checks and simple PDF
                reports.
              </p>
            </div>

            <div className="mt-5 rounded-2xl border border-amber-300/20 bg-amber-300/10 p-5">
              <p className="font-bold text-amber-100">
                Important safety sentence
              </p>
              <p className="mt-2 leading-7 text-amber-50/90">
                VeyraSec V1 does not hack, exploit, brute force, or perform
                intrusive scanning. It only checks public website signals.
              </p>
            </div>
          </div>
        </section>

        <section className="mt-8">
          <div className="mb-5 flex items-center gap-3">
            <FileText className="h-7 w-7 text-cyan-300" />
            <h2 className="text-3xl font-black">7-minute demo script</h2>
          </div>

          <div className="grid gap-4">
            {demoSteps.map((step) => (
              <div
                key={step.title}
                className="rounded-3xl border border-white/10 bg-white/[0.04] p-6"
              >
                <div className="mb-3 flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
                  <h3 className="text-xl font-black">{step.title}</h3>
                  <span className="w-fit rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1 text-sm font-bold text-cyan-100">
                    {step.time}
                  </span>
                </div>
                <p className="leading-8 text-slate-300">{step.script}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-8 rounded-3xl border border-white/10 bg-white/[0.04] p-8">
          <h2 className="text-3xl font-black">
            Telugu-English customer version
          </h2>

          <div className="mt-5 space-y-4 leading-8 text-slate-300">
            <p>
              "Sir/Madam, VeyraSec ane tool small business websites kosam. Mee
              website lo basic security, privacy, trust signals correct ga
              unnaya leda ani simple report laga chupistundi."
            </p>
            <p>
              "Idi hacking tool kaadu. Website ni attack cheyyadu. Public ga
              available website response based on safe passive checks matrame
              chestundi."
            </p>
            <p>
              "Report lo score, findings, recommendations untayi. Mee developer
              ki direct ga share chesi fixes cheyyinchachu. PDF report kuda
              download cheyyachu."
            </p>
            <p>
              "Web agencies ki idi useful, because clients ki professional
              before-after report chupinchachu."
            </p>
          </div>
        </section>

        <section className="mt-8">
          <h2 className="mb-5 text-3xl font-black">Objection handling</h2>

          <div className="grid gap-4 md:grid-cols-2">
            {objections.map((item) => (
              <div
                key={item.question}
                className="rounded-3xl border border-white/10 bg-white/[0.04] p-6"
              >
                <h3 className="text-xl font-bold text-white">
                  {item.question}
                </h3>
                <p className="mt-3 leading-7 text-slate-300">{item.answer}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-8 rounded-3xl border border-cyan-300/20 bg-cyan-300/10 p-8 text-center">
          <h2 className="text-3xl font-black text-cyan-100">Demo close</h2>
          <p className="mx-auto mt-3 max-w-3xl leading-8 text-cyan-50/90">
            "I am currently taking pilot users. I can scan your website, explain
            the report, and give you a PDF that your developer can use for basic
            improvements."
          </p>

          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              href="/sample-report"
              className="inline-flex items-center justify-center rounded-2xl bg-cyan-300 px-6 py-4 font-bold text-slate-950 hover:bg-cyan-200"
            >
              Open sample report
            </Link>
            <Link
              href="/pitch"
              className="inline-flex items-center justify-center rounded-2xl border border-cyan-300/20 px-6 py-4 font-bold text-cyan-100 hover:bg-cyan-300/10"
            >
              Open pitch page
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
