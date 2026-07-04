import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  Lock,
  ShieldAlert,
  ShieldCheck,
} from "lucide-react";
import { brand } from "@/config/brand";

const safeScope = [
  "Safe passive website checks only",
  "HTTPS and public response inspection",
  "Security header visibility checks",
  "Privacy policy and trust signal checks",
  "No exploitation",
  "No brute force",
  "No password testing",
  "No login testing",
  "No intrusive scanning",
];

const reportLimits = [
  "Not legal advice",
  "Not a full cybersecurity audit",
  "Not a penetration test",
  "Not a guarantee of compliance",
  "Not a replacement for professional security review",
];

export default function SecurityPage() {
  return (
    <main className="min-h-screen bg-slate-950 px-6 py-8 text-white">
      <div className="mx-auto max-w-5xl">
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
              <ShieldCheck className="h-6 w-6 text-cyan-300" />
            </div>
            <div>
              <h1 className="text-4xl font-black">Security and safety scope</h1>
              <p className="text-slate-400">{brand.name} V1 production safety note</p>
            </div>
          </div>

          <p className="max-w-3xl leading-8 text-slate-300">
            VeyraSec V1 is designed for small business website trust readiness.
            It uses safe passive checks only and avoids intrusive testing.
          </p>
        </section>

        <section className="mt-8 grid gap-8 lg:grid-cols-2">
          <div className="rounded-3xl border border-cyan-300/20 bg-cyan-300/10 p-8">
            <div className="mb-6 flex items-center gap-3">
              <Lock className="h-7 w-7 text-cyan-300" />
              <h2 className="text-3xl font-black text-cyan-100">What V1 does</h2>
            </div>

            <div className="grid gap-3">
              {safeScope.map((item) => (
                <div key={item} className="flex gap-3 rounded-2xl bg-slate-950/70 p-4">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-cyan-300" />
                  <span className="text-cyan-50">{item}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-amber-300/20 bg-amber-300/10 p-8">
            <div className="mb-6 flex items-center gap-3">
              <ShieldAlert className="h-7 w-7 text-amber-200" />
              <h2 className="text-3xl font-black text-amber-100">Important limits</h2>
            </div>

            <div className="grid gap-3">
              {reportLimits.map((item) => (
                <div key={item} className="flex gap-3 rounded-2xl bg-slate-950/70 p-4">
                  <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-amber-200" />
                  <span className="text-amber-50">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mt-8 rounded-3xl border border-white/10 bg-white/[0.04] p-8">
          <h2 className="text-3xl font-black">Responsible use</h2>
          <p className="mt-4 leading-8 text-slate-300">
            Only scan websites you own, manage, or have permission to review.
            For high-risk systems, legal compliance, or real security assurance,
            consult qualified cybersecurity and legal professionals.
          </p>
        </section>
      </div>
    </main>
  );
}