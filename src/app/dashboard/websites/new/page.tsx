import Link from "next/link";
import { ArrowLeft, CreditCard, Globe2, ShieldCheck } from "lucide-react";
import { requireDashboardUser } from "@/lib/auth/route-access";
import {
  canAddWebsite,
  getUserSubscriptionAccess,
  getUserUsageCounts,
} from "@/lib/subscription/enforce";
import { addWebsite } from "../actions";

export default async function NewWebsitePage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string }>;
}) {
  const params = await searchParams;
  const { supabase, user, profile } = await requireDashboardUser();

  const access = await getUserSubscriptionAccess(supabase, user.id);
  const usage = await getUserUsageCounts(supabase, user.id);
  const isAdminUser = profile.role === "admin";
  const decision = isAdminUser
    ? { allowed: true, message: "Admin bypass enabled" }
    : canAddWebsite(access, usage);

  return (
    <main className="min-h-screen bg-slate-950 p-6 text-white">
      <div className="mx-auto max-w-3xl">
        <Link
          href="/dashboard/websites"
          className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-slate-300 hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to websites
        </Link>

        <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-8">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-400/10 ring-1 ring-cyan-300/30">
              <Globe2 className="h-6 w-6 text-cyan-300" />
            </div>
            <div>
              <h1 className="text-4xl font-black">Add website</h1>
              <p className="text-slate-400">Add a website before running a passive trust scan.</p>
            </div>
          </div>

          {params.message ? (
            <div className="mb-6 rounded-2xl border border-amber-300/20 bg-amber-300/10 p-4 text-amber-100">
              {params.message}
            </div>
          ) : null}

          <div
            className={`mb-6 rounded-3xl border p-5 ${
              decision.allowed
                ? "border-cyan-300/20 bg-cyan-300/10 text-cyan-100"
                : "border-red-300/20 bg-red-300/10 text-red-100"
            }`}
          >
            <div className="flex items-start gap-3">
              <CreditCard className="mt-1 h-6 w-6 shrink-0" />
              <div>
                <p className="font-black">
                  {isAdminUser ? "Admin account" : `${access.plan.name} plan`}
                </p>
                <p className="mt-2 text-sm leading-6 opacity-90">
                  Websites used: {usage.websiteCount}/{access.plan.maxWebsites}
                  {isAdminUser ? " · Admin bypass is enabled." : ""}
                </p>
                {!decision.allowed ? (
                  <p className="mt-2 text-sm leading-6">{decision.message}</p>
                ) : null}
              </div>
            </div>
          </div>

          {decision.allowed ? (
            <form action={addWebsite} className="grid gap-5">
              <label className="grid gap-2">
                <span className="text-sm font-semibold text-slate-300">Website name</span>
                <input
                  name="name"
                  placeholder="Example: Client website"
                  className="rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none focus:border-cyan-300"
                />
              </label>

              <label className="grid gap-2">
                <span className="text-sm font-semibold text-slate-300">Website URL *</span>
                <input
                  name="url"
                  placeholder="https://example.com"
                  required
                  className="rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none focus:border-cyan-300"
                />
              </label>

              <div className="rounded-2xl border border-cyan-300/20 bg-cyan-300/10 p-4 text-sm leading-7 text-cyan-50/90">
                VeyraSec only performs safe passive checks. No login testing, no exploit testing,
                no brute force, no port scanning, and no penetration testing.
              </div>

              <button
                type="submit"
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-cyan-300 px-5 py-4 font-bold text-slate-950 hover:bg-cyan-200"
              >
                <ShieldCheck className="h-5 w-5" />
                Save website
              </button>
            </form>
          ) : (
            <Link
              href="/dashboard/subscription"
              className="inline-flex items-center justify-center rounded-2xl bg-cyan-300 px-5 py-4 font-bold text-slate-950 hover:bg-cyan-200"
            >
              View subscription / upgrade
            </Link>
          )}
        </section>
      </div>
    </main>
  );
}