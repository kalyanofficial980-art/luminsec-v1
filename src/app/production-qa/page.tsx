import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  ClipboardCheck,
  Database,
  Globe2,
  Lock,
  Rocket,
  ShieldCheck,
} from "lucide-react";
import { brand } from "@/config/brand";

const qaSections = [
  {
    title: "Public website",
    icon: Globe2,
    items: [
      "Homepage opens",
      "Pricing page opens",
      "Sample report opens",
      "Contact page opens",
      "Pilot page opens",
      "Security page opens",
      "Disclaimer page opens",
    ],
  },
  {
    title: "SaaS dashboard",
    icon: ShieldCheck,
    items: [
      "Signup works",
      "Login works",
      "Dashboard opens",
      "Add website works",
      "Passive scan works",
      "Report page opens",
      "PDF print page opens",
      "Settings save works",
      "Customer validation tracker works",
    ],
  },
  {
    title: "Supabase",
    icon: Database,
    items: [
      "RLS enabled on user tables",
      "No service role key in frontend",
      "Contact leads allow insert only",
      "Auth redirect URLs set",
      "Email confirmation setting intentional",
      "Tables are not publicly readable",
    ],
  },
  {
    title: "Production",
    icon: Lock,
    items: [
      "Vercel env variables set",
      "APP_URL points to production",
      "Security headers active",
      "Robots file active",
      "Sitemap active",
      "Old /app URLs redirect to /dashboard",
    ],
  },
];

export default function ProductionQaPage() {
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
              <ClipboardCheck className="h-6 w-6 text-cyan-300" />
            </div>
            <div>
              <h1 className="text-4xl font-black">Production QA checklist</h1>
              <p className="text-slate-400">
                {brand.name} V1 pilot launch readiness
              </p>
            </div>
          </div>

          <p className="max-w-3xl leading-8 text-slate-300">
            Use this page before every pilot launch demo. If every section is
            checked, VeyraSec V1 is ready for controlled customer validation.
          </p>
        </section>

        <section className="mt-8 grid gap-6 lg:grid-cols-2">
          {qaSections.map((section) => {
            const Icon = section.icon;

            return (
              <div
                key={section.title}
                className="rounded-3xl border border-white/10 bg-white/[0.04] p-8"
              >
                <div className="mb-6 flex items-center gap-3">
                  <Icon className="h-7 w-7 text-cyan-300" />
                  <h2 className="text-3xl font-black">{section.title}</h2>
                </div>

                <div className="grid gap-3">
                  {section.items.map((item) => (
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
            );
          })}
        </section>

        <section className="mt-8 rounded-3xl border border-cyan-300/20 bg-cyan-300/10 p-8 text-center">
          <Rocket className="mx-auto mb-4 h-10 w-10 text-cyan-300" />
          <h2 className="text-3xl font-black text-cyan-100">
            V1 production rule
          </h2>
          <p className="mx-auto mt-3 max-w-3xl leading-8 text-cyan-50/90">
            Launch only as a pilot. Do not claim full compliance, full security
            audit, or penetration testing. Sell it as a starter website trust
            readiness report.
          </p>
        </section>
      </div>
    </main>
  );
}


