import Link from "next/link";
import {
  ArrowLeft,
  Building2,
  CheckCircle2,
  ClipboardList,
  Mail,
  MessageSquare,
  Phone,
  Send,
  ShieldCheck,
  Target,
  Users,
} from "lucide-react";
import { brand } from "@/config/brand";

const leadTypes = [
  "Local web design agencies",
  "Freelance website developers",
  "Clinics with websites",
  "Coaching centers",
  "Small ecommerce websites",
  "Real estate landing pages",
  "Schools or institutes",
  "Gyms and fitness centers",
  "Local service businesses",
  "Startup founders",
];

const trackerRows = [
  ["1", "Web business", "Find website", "Not contacted"],
  ["2", "Clinic", "Find website", "Not contacted"],
  ["3", "Coaching center", "Find website", "Not contacted"],
  ["4", "Freelancer", "Find portfolio", "Not contacted"],
  ["5", "Local business", "Find website", "Not contacted"],
  ["6", "Startup", "Find landing page", "Not contacted"],
  ["7", "Ecommerce", "Find store URL", "Not contacted"],
  ["8", "Institute", "Find website", "Not contacted"],
  ["9", "Business", "Find contact", "Not contacted"],
  ["10", "Business owner", "Find WhatsApp", "Not contacted"],
];

const outreachSteps = [
  "Find the business website",
  "Run a VeyraSec scan",
  "Open report and screenshot score",
  "Send short message",
  "Offer free starter explanation",
  "Ask for 10-minute call",
  "Record objections",
  "Offer paid pilot report",
];

const messageTemplates = [
  {
    title: "WhatsApp short message",
    icon: MessageSquare,
    text: "Hi, I checked your website with my VeyraSec V1 tool. It creates a starter website trust report using safe passive checks. I found a few improvement areas in security/privacy signals. I can share a free sample report and explain it in 10 minutes. Interested?",
  },
  {
    title: "Web business message",
    icon: Send,
    text: "Hi, I built VeyraSec for web agencies. It helps create simple website security, privacy, and trust reports for clients. Agencies can use it as a before-after report after website improvements. I am taking pilot feedback. Can I show you a 5-minute demo?",
  },
  {
    title: "Email message",
    icon: Mail,
    text: "Subject: Free website trust report for your business\n\nHi,\nI am building VeyraSec, a tool that creates starter website security, privacy, and trust readiness reports using safe passive checks. I would like to create a free sample report for your website and get your feedback. It is not a penetration test and does not attack your website. Would you be open to a short demo?",
  },
  {
    title: "Telugu-English message",
    icon: Phone,
    text: "Hi sir/madam, nenu VeyraSec ane website trust report tool build chestunna. Mee website lo starter security, privacy, trust signals ela unnayo simple report laga chupistundi. Idi hacking kaadu, safe passive checks only. Mee website ki free sample report create chesi explain cheyyacha?",
  },
];

const callScript = [
  {
    label: "Start",
    text: "Thanks for your time. I will show a simple website trust report. This is not hacking or penetration testing. It only checks public website signals.",
  },
  {
    label: "Problem",
    text: "Many business websites collect leads, but owners do not know whether privacy policy, HTTPS, forms, and security headers are clear.",
  },
  {
    label: "Demo",
    text: "Here is the report. It shows overall score, security score, privacy score, trust score, findings, and recommendations.",
  },
  {
    label: "Close",
    text: "Would this report be useful for your website or your clients? What should I improve before I make this a paid service?",
  },
];

export default function OutreachPage() {
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
              <Users className="h-6 w-6 text-cyan-300" />
            </div>
            <div>
              <h1 className="text-4xl font-black">
                First 10 customer outreach system
              </h1>
              <p className="text-slate-400">
                {brand.name} pilot customer validation
              </p>
            </div>
          </div>

          <p className="max-w-3xl leading-8 text-slate-300">
            The first goal is not big revenue. The first goal is proof: find 10
            real website owners or agencies, show the report, collect
            objections, and close one paid pilot.
          </p>

          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              ["Leads", "10"],
              ["Demo calls", "3"],
              ["Feedback replies", "5"],
              ["Paid pilot", "1"],
            ].map(([label, value]) => (
              <div
                key={label}
                className="rounded-3xl border border-white/10 bg-slate-950 p-6"
              >
                <p className="text-sm text-slate-400">{label}</p>
                <p className="mt-2 text-4xl font-black">{value}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-8 grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-3xl border border-cyan-300/20 bg-cyan-300/10 p-8">
            <div className="mb-6 flex items-center gap-3">
              <Target className="h-7 w-7 text-cyan-300" />
              <h2 className="text-3xl font-black text-cyan-100">
                Best first targets
              </h2>
            </div>

            <div className="grid gap-3">
              {leadTypes.map((item) => (
                <div
                  key={item}
                  className="flex gap-3 rounded-2xl bg-slate-950/70 p-4"
                >
                  <Building2 className="mt-0.5 h-5 w-5 shrink-0 text-cyan-300" />
                  <span className="text-cyan-50">{item}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-8">
            <div className="mb-6 flex items-center gap-3">
              <ClipboardList className="h-7 w-7 text-cyan-300" />
              <h2 className="text-3xl font-black">Outreach process</h2>
            </div>

            <div className="grid gap-3">
              {outreachSteps.map((step, index) => (
                <div
                  key={step}
                  className="flex gap-4 rounded-2xl border border-white/10 bg-slate-950 p-4"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-cyan-300 font-black text-slate-950">
                    {index + 1}
                  </div>
                  <p className="font-semibold text-slate-300">{step}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mt-8 rounded-3xl border border-white/10 bg-white/[0.04] p-8">
          <div className="mb-6 flex items-center gap-3">
            <ShieldCheck className="h-7 w-7 text-cyan-300" />
            <h2 className="text-3xl font-black">First 10 lead tracker</h2>
          </div>

          <div className="overflow-hidden rounded-3xl border border-white/10">
            <table className="w-full min-w-[760px] border-collapse text-left text-sm">
              <thead className="bg-slate-900 text-slate-300">
                <tr>
                  <th className="p-4">#</th>
                  <th className="p-4">Target type</th>
                  <th className="p-4">Next action</th>
                  <th className="p-4">Status</th>
                </tr>
              </thead>
              <tbody>
                {trackerRows.map((row) => (
                  <tr
                    key={row[0]}
                    className="border-t border-white/10 bg-slate-950/60"
                  >
                    <td className="p-4 font-bold text-cyan-300">{row[0]}</td>
                    <td className="p-4 text-slate-200">{row[1]}</td>
                    <td className="p-4 text-slate-400">{row[2]}</td>
                    <td className="p-4">
                      <span className="rounded-full border border-slate-400/20 bg-slate-400/10 px-3 py-1 text-xs font-bold text-slate-200">
                        {row[3]}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="mt-4 text-sm text-slate-500">
            Tip: copy this table into Google Sheets and update names, website
            URLs, contact info, status, and notes.
          </p>
        </section>

        <section className="mt-8">
          <div className="mb-6 flex items-center gap-3">
            <MessageSquare className="h-7 w-7 text-cyan-300" />
            <h2 className="text-3xl font-black">Message templates</h2>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {messageTemplates.map((template) => {
              const Icon = template.icon;

              return (
                <div
                  key={template.title}
                  className="rounded-3xl border border-white/10 bg-white/[0.04] p-6"
                >
                  <div className="mb-4 flex items-center gap-3">
                    <Icon className="h-6 w-6 text-cyan-300" />
                    <h3 className="text-xl font-black">{template.title}</h3>
                  </div>
                  <pre className="whitespace-pre-wrap rounded-2xl border border-white/10 bg-slate-950 p-4 text-sm leading-7 text-slate-300">
                    {template.text}
                  </pre>
                </div>
              );
            })}
          </div>
        </section>

        <section className="mt-8 rounded-3xl border border-white/10 bg-white/[0.04] p-8">
          <div className="mb-6 flex items-center gap-3">
            <Phone className="h-7 w-7 text-cyan-300" />
            <h2 className="text-3xl font-black">10-minute call script</h2>
          </div>

          <div className="grid gap-4">
            {callScript.map((item) => (
              <div
                key={item.label}
                className="rounded-3xl border border-white/10 bg-slate-950 p-6"
              >
                <h3 className="text-xl font-black text-cyan-300">
                  {item.label}
                </h3>
                <p className="mt-3 leading-8 text-slate-300">{item.text}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-8 rounded-3xl border border-cyan-300/20 bg-cyan-300/10 p-8 text-center">
          <CheckCircle2 className="mx-auto mb-4 h-10 w-10 text-cyan-300" />
          <h2 className="text-3xl font-black text-cyan-100">
            First validation target
          </h2>
          <p className="mx-auto mt-3 max-w-3xl leading-8 text-cyan-50/90">
            Send 10 messages. Get 5 replies. Book 3 demos. Deliver 5 free
            reports. Close 1 paid pilot. Then improve VeyraSec based on real
            objections.
          </p>

          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              href="/sample-report"
              className="inline-flex items-center justify-center rounded-2xl bg-cyan-300 px-6 py-4 font-bold text-slate-950 hover:bg-cyan-200"
            >
              Open sample report
            </Link>
            <Link
              href="/launch-checklist"
              className="inline-flex items-center justify-center rounded-2xl border border-cyan-300/20 px-6 py-4 font-bold text-cyan-100 hover:bg-cyan-300/10"
            >
              Launch checklist
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}


