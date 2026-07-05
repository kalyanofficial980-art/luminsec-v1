import Link from "next/link";
import { ShieldCheck, Lock, SearchCheck, AlertTriangle } from "lucide-react";

export default function SecurityPage() {
  const items = [
    {
      icon: SearchCheck,
      title: "Passive checks only",
      text: "VeyraSec checks public website signals such as HTTPS, basic headers, privacy indicators, and trust readiness.",
    },
    {
      icon: Lock,
      title: "No exploit testing",
      text: "VeyraSec does not perform brute force, login testing, vulnerability exploitation, directory brute forcing, or port scanning.",
    },
    {
      icon: ShieldCheck,
      title: "For owned websites",
      text: "Users should only check websites they own, manage, or are authorized to review.",
    },
    {
      icon: AlertTriangle,
      title: "Not a full audit",
      text: "Reports are simple trust-readiness reports. They are not legal advice, compliance certification, or a penetration test.",
    },
  ];

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-16 text-white">
      <div className="mx-auto max-w-6xl">
        <Link href="/" className="text-sm font-bold text-cyan-300 hover:text-cyan-200">
          ← Back to home
        </Link>

        <section className="mt-8 rounded-3xl border border-white/10 bg-white/[0.04] p-8 md:p-12">
          <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-cyan-400/10 ring-1 ring-cyan-300/30">
            <ShieldCheck className="h-9 w-9 text-cyan-300" />
          </div>

          <h1 className="mt-8 text-4xl font-black tracking-tight md:text-6xl">
            Security and safety
          </h1>

          <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-300">
            VeyraSec is built for safe, passive website trust reports for small businesses.
            It helps website owners understand visible trust signals without running intrusive tests.
          </p>
        </section>

        <section className="mt-8 grid gap-5 md:grid-cols-2">
          {items.map((item) => (
            <div key={item.title} className="rounded-3xl border border-white/10 bg-white/[0.04] p-7">
              <item.icon className="h-8 w-8 text-cyan-300" />
              <h2 className="mt-5 text-2xl font-black">{item.title}</h2>
              <p className="mt-3 leading-7 text-slate-300">{item.text}</p>
            </div>
          ))}
        </section>

        <section className="mt-8 rounded-3xl border border-amber-300/20 bg-amber-300/10 p-8">
          <h2 className="text-2xl font-black text-amber-100">Important note</h2>
          <p className="mt-4 leading-8 text-amber-50/90">
            VeyraSec reports are informational and based on passive public signals.
            For high-risk systems, legal compliance, or full security assurance, businesses should work with qualified cybersecurity professionals.
          </p>
        </section>
      </div>
    </main>
  );
}