import Link from "next/link";
import { ArrowLeft, CheckCircle2, ShieldCheck } from "lucide-react";
import { brand } from "@/config/brand";

const plans = [
  {
    name: "Starter",
    price: "Free",
    description: "For testing VeyraSec V1 prototype.",
    features: [
      "Add websites",
      "Run safe passive scans",
      "View trust score",
      "Open scan history",
      "Printable PDF report",
    ],
    cta: "Start free",
    href: "/signup",
    highlight: false,
  },
  {
    name: "Basic Report",
    price: "₹499",
    description: "For one small business website report.",
    features: [
      "One website trust report",
      "Security headers review",
      "Privacy policy visibility check",
      "Contact form risk signals",
      "PDF report for owner/developer",
    ],
    cta: "Use V1 dashboard",
    href: "/signup",
    highlight: true,
  },
  {
    name: "Agency Pilot",
    price: "₹2,999+",
    description: "For agencies managing multiple client websites.",
    features: [
      "Multiple client reports",
      "Scan history dashboard",
      "Printable reports",
      "English and Telugu-English explanations",
      "V1 pilot support",
    ],
    cta: "Apply for pilot",
    href: "/pilot",
    highlight: false,
  },
];

export default function PricingPage() {
  return (
    <main className="min-h-screen bg-slate-950 px-6 py-8 text-white">
      <div className="mx-auto max-w-7xl">
        <Link
          href="/"
          className="mb-10 inline-flex items-center gap-2 text-sm font-semibold text-slate-300 hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Back home
        </Link>

        <section className="mb-12 text-center">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-400/10 ring-1 ring-cyan-300/30">
            <ShieldCheck className="h-7 w-7 text-cyan-300" />
          </div>
          <h1 className="text-5xl font-black">Simple V1 pricing</h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg leading-8 text-slate-300">
            {brand.name} V1 is a prototype. Pricing is designed for early pilots, small businesses, and agencies.
          </p>
        </section>

        <section className="grid gap-5 lg:grid-cols-3">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`rounded-3xl border p-7 ${
                plan.highlight
                  ? "border-cyan-300/40 bg-cyan-300/10"
                  : "border-white/10 bg-white/[0.04]"
              }`}
            >
              <h2 className="text-2xl font-black">{plan.name}</h2>
              <p className="mt-2 text-slate-400">{plan.description}</p>
              <p className="mt-6 text-5xl font-black">{plan.price}</p>

              <ul className="mt-8 space-y-4">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex gap-3 text-slate-300">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-cyan-300" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <Link
                href={plan.href}
                className={`mt-8 inline-flex w-full items-center justify-center rounded-2xl px-5 py-4 font-bold ${
                  plan.highlight
                    ? "bg-cyan-300 text-slate-950 hover:bg-cyan-200"
                    : "border border-white/10 text-white hover:bg-white/10"
                }`}
              >
                {plan.cta}
              </Link>
            </div>
          ))}
        </section>

        <section className="mt-10 rounded-3xl border border-white/10 bg-white/[0.04] p-6 text-sm leading-7 text-slate-400">
          <p className="font-bold text-white">V1 note</p>
          <p>
            These are early pilot prices. VeyraSec V1 performs basic passive checks only. It does not replace legal advice, a full cybersecurity audit, or penetration testing.
          </p>
        </section>
      </div>
    </main>
  );
}