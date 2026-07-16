import Link from "next/link";
import {
  ArrowLeft,
  Building2,
  CheckCircle2,
  HelpCircle,
  Mail,
  MessageSquare,
  Phone,
  ShieldCheck,
} from "lucide-react";
import { brand } from "@/config/brand";
import { submitContactLead } from "./actions";

export default async function ContactPage({
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

        <section className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-8">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-400/10 ring-1 ring-cyan-300/30">
                <MessageSquare className="h-6 w-6 text-cyan-300" />
              </div>
              <div>
                <h1 className="text-4xl font-black">Contact VeyraSec</h1>
                <p className="text-slate-400">
                  Support, demo, and pilot requests
                </p>
              </div>
            </div>

            <p className="leading-8 text-slate-300">
              Use this page to request a VeyraSec demo, ask a support question,
              or start a small business website trust report pilot.
            </p>

            <div className="mt-8 grid gap-4">
              <div className="rounded-3xl border border-cyan-300/20 bg-cyan-300/10 p-6">
                <div className="mb-3 flex items-center gap-3">
                  <ShieldCheck className="h-6 w-6 text-cyan-300" />
                  <h2 className="text-xl font-black text-cyan-100">
                    V1 safety scope
                  </h2>
                </div>
                <p className="leading-7 text-cyan-50/90">
                  VeyraSec V1 uses safe passive checks only. It does not hack,
                  exploit, brute force, test passwords, or perform intrusive
                  scanning.
                </p>
              </div>

              <div className="rounded-3xl border border-white/10 bg-slate-950 p-6">
                <div className="mb-3 flex items-center gap-3">
                  <HelpCircle className="h-6 w-6 text-cyan-300" />
                  <h2 className="text-xl font-black">
                    Good reasons to contact
                  </h2>
                </div>
                <ul className="space-y-3 text-slate-300">
                  <li className="flex gap-3">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-cyan-300" />
                    Request a website trust report demo
                  </li>
                  <li className="flex gap-3">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-cyan-300" />
                    Ask about agency pilot pricing
                  </li>
                  <li className="flex gap-3">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-cyan-300" />
                    Report a product issue
                  </li>
                  <li className="flex gap-3">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-cyan-300" />
                    Share feedback on the V1 report
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <form
            action={submitContactLead}
            className="rounded-3xl border border-white/10 bg-white/[0.04] p-8"
          >
            <h2 className="text-3xl font-black">Send a message</h2>
            <p className="mt-2 text-slate-400">
              We will use this for V1 customer validation and support follow-up.
            </p>

            {params.message ? (
              <div className="mt-6 rounded-2xl border border-cyan-300/20 bg-cyan-300/10 p-4 text-cyan-100">
                {params.message}
              </div>
            ) : null}

            <input type="hidden" name="source" value="contact-page" />

            <div className="mt-6 grid gap-4">
              <label className="grid gap-2">
                <span className="text-sm font-semibold text-slate-300">
                  Name *
                </span>
                <input
                  name="name"
                  placeholder="Your name"
                  className="rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none focus:border-cyan-300"
                />
              </label>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="grid gap-2">
                  <span className="text-sm font-semibold text-slate-300">
                    Email *
                  </span>
                  <input
                    name="email"
                    type="email"
                    placeholder="you@example.com"
                    className="rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none focus:border-cyan-300"
                  />
                </label>

                <label className="grid gap-2">
                  <span className="text-sm font-semibold text-slate-300">
                    Phone
                  </span>
                  <input
                    name="phone"
                    placeholder="+91 90000 00000"
                    className="rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none focus:border-cyan-300"
                  />
                </label>
              </div>

              <label className="grid gap-2">
                <span className="text-sm font-semibold text-slate-300">
                  Company / Business name
                </span>
                <input
                  name="company_name"
                  placeholder="Example: Local Web Agency"
                  className="rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none focus:border-cyan-300"
                />
              </label>

              <label className="grid gap-2">
                <span className="text-sm font-semibold text-slate-300">
                  Website URL
                </span>
                <input
                  name="website_url"
                  placeholder="https://example.com"
                  className="rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none focus:border-cyan-300"
                />
              </label>

              <label className="grid gap-2">
                <span className="text-sm font-semibold text-slate-300">
                  Request type
                </span>
                <select
                  name="lead_type"
                  className="rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none focus:border-cyan-300"
                >
                  <option value="demo">Demo request</option>
                  <option value="support">Support question</option>
                  <option value="agency">Agency pilot</option>
                  <option value="business_report">
                    Business website report
                  </option>
                  <option value="feedback">Product feedback</option>
                </select>
              </label>

              <label className="grid gap-2">
                <span className="text-sm font-semibold text-slate-300">
                  Message
                </span>
                <textarea
                  name="message"
                  rows={5}
                  placeholder="Tell us what you need..."
                  className="rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none focus:border-cyan-300"
                />
              </label>

              <button
                type="submit"
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-cyan-300 px-5 py-4 font-bold text-slate-950 hover:bg-cyan-200"
              >
                <Mail className="h-5 w-5" />
                Submit request
              </button>
            </div>
          </form>
        </section>

        <section className="mt-8 grid gap-4 md:grid-cols-3">
          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
            <Mail className="mb-4 h-7 w-7 text-cyan-300" />
            <h2 className="text-xl font-black">Email</h2>
            <p className="mt-2 break-all text-slate-400">
              {brand.supportEmail}
            </p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
            <Phone className="mb-4 h-7 w-7 text-cyan-300" />
            <h2 className="text-xl font-black">Pilot follow-up</h2>
            <p className="mt-2 text-slate-400">
              Use WhatsApp, call, or email based on customer preference.
            </p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
            <Building2 className="mb-4 h-7 w-7 text-cyan-300" />
            <h2 className="text-xl font-black">Best-fit users</h2>
            <p className="mt-2 text-slate-400">
              Web agencies, freelancers, clinics, coaching centers, and small
              businesses.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}


