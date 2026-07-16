import Link from "next/link";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { brand } from "@/config/brand";

export default function DisclaimerPage() {
  return (
    <main className="min-h-screen bg-slate-950 px-6 py-8 text-white">
      <div className="mx-auto max-w-4xl">
        <Link
          href="/"
          className="mb-10 inline-flex items-center gap-2 text-sm font-semibold text-slate-300 hover:text-white"
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
              <h1 className="text-3xl font-black">Disclaimer</h1>
              <p className="text-slate-400">{brand.name} V1 safety scope</p>
            </div>
          </div>

          <div className="space-y-6 leading-8 text-slate-300">
            <p>
              VeyraSec V1 performs basic passive checks using publicly available
              website responses. It is designed to help small businesses
              understand common website trust, privacy, and readiness signals.
            </p>

            <p>
              VeyraSec V1 is not a full cybersecurity audit, not a penetration
              test, and not legal advice. It does not guarantee that a website
              is secure or compliant.
            </p>

            <p>
              V1 does not perform exploitation, brute force, password testing,
              intrusive scanning, vulnerability exploitation, or unauthorized
              access attempts.
            </p>

            <p>
              Businesses should consult qualified cybersecurity professionals,
              developers, and legal advisors before relying on any report for
              compliance, legal, or high-risk security decisions.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
