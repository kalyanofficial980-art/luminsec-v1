import { redirect } from "next/navigation";
import {
  ArrowRight,
  Building2,
  FlaskConical,
  ShieldCheck,
  UserRound,
  Users,
} from "lucide-react";
import { brand } from "@/config/brand";
import { createClient } from "@/lib/supabase/server";
import { completeOnboarding } from "./actions";

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("onboarding_completed, full_name, business_name, website_url, account_type")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.onboarding_completed) {
    redirect("/dashboard");
  }

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-10 text-white">
      <div className="mx-auto max-w-5xl">
        <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-8">
          <div className="mb-8 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-300 text-slate-950">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <p className="text-2xl font-black">{brand.name}</p>
              <p className="text-sm text-slate-400">{brand.version}</p>
            </div>
          </div>

          <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr]">
            <div>
              <h1 className="text-4xl font-black tracking-tight md:text-5xl">
                Set up your VeyraSec workspace
              </h1>

              <p className="mt-5 leading-8 text-slate-300">
                Choose how you want to use VeyraSec. This decides which dashboard pages and
                limits you will see later.
              </p>

              <div className="mt-8 grid gap-4">
                <div className="rounded-3xl border border-cyan-300/20 bg-cyan-300/10 p-5">
                  <Building2 className="mb-3 h-7 w-7 text-cyan-300" />
                  <h2 className="text-xl font-black text-cyan-100">Small business</h2>
                  <p className="mt-2 text-sm leading-6 text-cyan-50/90">
                    Simple dashboard for your own website trust report.
                  </p>
                </div>

                <div className="rounded-3xl border border-purple-300/20 bg-purple-300/10 p-5">
                  <Users className="mb-3 h-7 w-7 text-purple-300" />
                  <h2 className="text-xl font-black text-purple-100">Freelancer / agency</h2>
                  <p className="mt-2 text-sm leading-6 text-purple-50/90">
                    Manage client websites and reports later with agency features.
                  </p>
                </div>

                <div className="rounded-3xl border border-amber-300/20 bg-amber-300/10 p-5">
                  <FlaskConical className="mb-3 h-7 w-7 text-amber-300" />
                  <h2 className="text-xl font-black text-amber-100">Testing</h2>
                  <p className="mt-2 text-sm leading-6 text-amber-50/90">
                    Try the product before using it with real customers.
                  </p>
                </div>
              </div>
            </div>

            <form action={completeOnboarding} className="rounded-3xl border border-white/10 bg-slate-950 p-6">
              <div className="mb-6 flex items-center gap-3">
                <UserRound className="h-7 w-7 text-cyan-300" />
                <h2 className="text-3xl font-black">Your details</h2>
              </div>

              {params.message ? (
                <div className="mb-5 rounded-2xl border border-amber-300/20 bg-amber-300/10 p-4 text-amber-100">
                  {params.message}
                </div>
              ) : null}

              <div className="grid gap-5">
                <label className="grid gap-2">
                  <span className="text-sm font-semibold text-slate-300">Your name</span>
                  <input
                    name="full_name"
                    defaultValue={profile?.full_name ?? ""}
                    placeholder="Example: Kalyan"
                    className="rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none focus:border-cyan-300"
                  />
                </label>

                <label className="grid gap-2">
                  <span className="text-sm font-semibold text-slate-300">Business / project name</span>
                  <input
                    name="business_name"
                    defaultValue={profile?.business_name ?? ""}
                    placeholder="Example: VeyraSec Pilot"
                    className="rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none focus:border-cyan-300"
                  />
                </label>

                <label className="grid gap-2">
                  <span className="text-sm font-semibold text-slate-300">Website URL</span>
                  <input
                    name="website_url"
                    defaultValue={profile?.website_url ?? ""}
                    placeholder="https://example.com"
                    className="rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none focus:border-cyan-300"
                  />
                </label>

                <fieldset className="grid gap-3">
                  <legend className="mb-1 text-sm font-semibold text-slate-300">
                    Account type *
                  </legend>

                  <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4 hover:bg-white/[0.06]">
                    <input
                      name="account_type"
                      type="radio"
                      value="small_business"
                      defaultChecked={profile?.account_type === "small_business"}
                      className="mt-1 h-5 w-5"
                    />
                    <span>
                      <span className="block font-bold text-white">Small business owner</span>
                      <span className="mt-1 block text-sm leading-6 text-slate-400">
                        I want to check my own website.
                      </span>
                    </span>
                  </label>

                  <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4 hover:bg-white/[0.06]">
                    <input
                      name="account_type"
                      type="radio"
                      value="freelancer_agency"
                      defaultChecked={profile?.account_type === "freelancer_agency"}
                      className="mt-1 h-5 w-5"
                    />
                    <span>
                      <span className="block font-bold text-white">Freelancer / agency</span>
                      <span className="mt-1 block text-sm leading-6 text-slate-400">
                        I want to check websites for clients.
                      </span>
                    </span>
                  </label>

                  <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4 hover:bg-white/[0.06]">
                    <input
                      name="account_type"
                      type="radio"
                      value="testing"
                      defaultChecked={profile?.account_type === "testing"}
                      className="mt-1 h-5 w-5"
                    />
                    <span>
                      <span className="block font-bold text-white">Testing VeyraSec</span>
                      <span className="mt-1 block text-sm leading-6 text-slate-400">
                        I am exploring the product first.
                      </span>
                    </span>
                  </label>
                </fieldset>

                <button
                  type="submit"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-cyan-300 px-5 py-4 font-bold text-slate-950 hover:bg-cyan-200"
                >
                  Continue to dashboard
                  <ArrowRight className="h-5 w-5" />
                </button>
              </div>
            </form>
          </div>
        </section>

        <p className="mt-6 text-center text-sm text-slate-500">
          Safe passive website trust reports only. Not a penetration testing platform.
        </p>
      </div>
    </main>
  );
}