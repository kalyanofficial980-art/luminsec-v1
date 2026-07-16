import Link from "next/link";
import {
  Building2,
  CheckCircle2,
  CreditCard,
  ExternalLink,
  Lock,
  Save,
  Settings,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { requireDashboardUser } from "@/lib/auth/route-access";
import { accountTypeLabel } from "@/lib/auth/profile";
import {
  featureRows,
  planBadgeClass,
  priceText,
  statusBadgeClass,
  type SubscriptionPlan,
} from "@/lib/subscription/limits";
import { updateProfileSettings, updateReportSettings } from "./actions";

type BusinessSettings = {
  business_name: string | null;
  report_prepared_by: string | null;
  contact_email: string | null;
  phone: string | null;
  website: string | null;
  address: string | null;
  footer_note: string | null;
};

const fallbackTrialPlan: SubscriptionPlan = {
  id: "trial",
  name: "Trial",
  description: "Try VeyraSec with basic website trust reports.",
  monthly_price: 0,
  currency: "INR",
  max_websites: 1,
  max_scans_per_month: 3,
  pdf_reports_enabled: true,
  public_share_enabled: false,
  agency_mode_enabled: false,
  manual_payments_enabled: false,
  priority_support_enabled: false,
};

function getJoinedPlan(value: unknown): SubscriptionPlan | null {
  if (Array.isArray(value)) {
    return (value[0] ?? null) as SubscriptionPlan | null;
  }

  return (value ?? null) as SubscriptionPlan | null;
}

function safeDate(value: string | null | undefined) {
  if (!value) return "Not set";

  try {
    return new Intl.DateTimeFormat("en-IN", {
      dateStyle: "medium",
    }).format(new Date(value));
  } catch {
    return value;
  }
}

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string }>;
}) {
  const params = await searchParams;
  const { supabase, user, profile } = await requireDashboardUser();

  const { data: businessSettingsData } = await supabase
    .from("business_settings")
    .select(
      "business_name, report_prepared_by, contact_email, phone, website, address, footer_note",
    )
    .eq("user_id", user.id)
    .maybeSingle();

  const businessSettings = (businessSettingsData ??
    null) as BusinessSettings | null;

  const { data: subscriptionData } = await supabase
    .from("user_subscriptions")
    .select(
      "plan_id, status, current_period_start, current_period_end, subscription_plans(*)",
    )
    .eq("user_id", user.id)
    .maybeSingle();

  const currentPlan =
    getJoinedPlan(subscriptionData?.subscription_plans) ?? fallbackTrialPlan;
  const currentStatus = subscriptionData?.status ?? "trial";

  return (
    <main className="min-h-screen bg-slate-950 p-6 text-white">
      <div className="mx-auto max-w-7xl">
        <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-8">
          <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-start">
            <div>
              <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-400/10 ring-1 ring-cyan-300/30">
                <Settings className="h-8 w-8 text-cyan-300" />
              </div>

              <h1 className="text-4xl font-black tracking-tight md:text-5xl">
                SaaS settings
              </h1>

              <p className="mt-4 max-w-3xl leading-8 text-slate-300">
                Manage your profile, account type, report branding, and plan
                visibility. Account type changes do not unlock paid features.
                Feature access is controlled by your subscription plan.
              </p>
            </div>

            <div
              className={`rounded-3xl border p-6 text-center ${planBadgeClass(currentPlan.id)}`}
            >
              <CreditCard className="mx-auto mb-3 h-9 w-9" />
              <p className="text-sm opacity-80">Current plan</p>
              <p className="mt-2 text-4xl font-black">{currentPlan.name}</p>
              <p className="mt-2 text-sm font-bold">{priceText(currentPlan)}</p>
            </div>
          </div>
        </section>

        {params.message ? (
          <div className="mt-6 rounded-3xl border border-cyan-300/20 bg-cyan-300/10 p-5 text-cyan-100">
            {params.message}
          </div>
        ) : null}

        <section className="mt-8 grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
          <form
            action={updateProfileSettings}
            className="rounded-3xl border border-white/10 bg-white/[0.04] p-8"
          >
            <div className="mb-6 flex items-center gap-3">
              <UserRound className="h-7 w-7 text-cyan-300" />
              <h2 className="text-3xl font-black">Profile and account type</h2>
            </div>

            <div className="grid gap-5">
              <label className="grid gap-2">
                <span className="text-sm font-semibold text-slate-300">
                  Your name
                </span>
                <input
                  name="full_name"
                  defaultValue={profile.full_name ?? ""}
                  placeholder="Your name"
                  className="rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none focus:border-cyan-300"
                />
              </label>

              <label className="grid gap-2">
                <span className="text-sm font-semibold text-slate-300">
                  Business / project name
                </span>
                <input
                  name="business_name"
                  defaultValue={profile.business_name ?? ""}
                  placeholder="Business name"
                  className="rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none focus:border-cyan-300"
                />
              </label>

              <label className="grid gap-2">
                <span className="text-sm font-semibold text-slate-300">
                  Main website URL
                </span>
                <input
                  name="website_url"
                  defaultValue={profile.website_url ?? ""}
                  placeholder="https://example.com"
                  className="rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none focus:border-cyan-300"
                />
              </label>

              <fieldset className="grid gap-3">
                <legend className="mb-1 text-sm font-semibold text-slate-300">
                  Account type
                </legend>

                <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-white/10 bg-slate-950 p-4 hover:bg-white/[0.05]">
                  <input
                    name="account_type"
                    type="radio"
                    value="small_business"
                    defaultChecked={profile.account_type === "small_business"}
                    className="mt-1 h-5 w-5"
                  />
                  <span>
                    <span className="block font-bold text-white">
                      Small business owner
                    </span>
                    <span className="mt-1 block text-sm leading-6 text-slate-400">
                      Simple dashboard for checking your own website.
                    </span>
                  </span>
                </label>

                <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-white/10 bg-slate-950 p-4 hover:bg-white/[0.05]">
                  <input
                    name="account_type"
                    type="radio"
                    value="freelancer_agency"
                    defaultChecked={
                      profile.account_type === "freelancer_agency"
                    }
                    className="mt-1 h-5 w-5"
                  />
                  <span>
                    <span className="block font-bold text-white">
                      Freelancer / agency
                    </span>
                    <span className="mt-1 block text-sm leading-6 text-slate-400">
                      Use VeyraSec for client websites. Agency features still
                      require an Agency-enabled plan.
                    </span>
                  </span>
                </label>

                <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-white/10 bg-slate-950 p-4 hover:bg-white/[0.05]">
                  <input
                    name="account_type"
                    type="radio"
                    value="testing"
                    defaultChecked={profile.account_type === "testing"}
                    className="mt-1 h-5 w-5"
                  />
                  <span>
                    <span className="block font-bold text-white">
                      Testing VeyraSec
                    </span>
                    <span className="mt-1 block text-sm leading-6 text-slate-400">
                      Testing mode before using the app with real customers.
                    </span>
                  </span>
                </label>
              </fieldset>

              <button
                type="submit"
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-cyan-300 px-5 py-4 font-bold text-slate-950 hover:bg-cyan-200"
              >
                <Save className="h-5 w-5" />
                Save profile
              </button>
            </div>
          </form>

          <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-8">
            <div className="mb-6 flex items-center gap-3">
              <ShieldCheck className="h-7 w-7 text-cyan-300" />
              <h2 className="text-3xl font-black">Plan visibility</h2>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div
                className={`rounded-3xl border p-5 ${planBadgeClass(currentPlan.id)}`}
              >
                <p className="text-sm opacity-80">Plan</p>
                <p className="mt-2 text-3xl font-black">{currentPlan.name}</p>
                <p className="mt-2 text-sm font-bold">
                  {priceText(currentPlan)}
                </p>
              </div>

              <div
                className={`rounded-3xl border p-5 ${statusBadgeClass(currentStatus)}`}
              >
                <p className="text-sm opacity-80">Status</p>
                <p className="mt-2 text-3xl font-black">{currentStatus}</p>
                <p className="mt-2 text-sm font-bold">
                  Ends: {safeDate(subscriptionData?.current_period_end)}
                </p>
              </div>
            </div>

            <div className="mt-6 grid gap-3">
              {featureRows(currentPlan).map((feature) => (
                <div
                  key={feature.label}
                  className={`flex items-center justify-between gap-3 rounded-2xl border p-4 ${
                    feature.enabled
                      ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-100"
                      : "border-slate-400/20 bg-slate-400/10 text-slate-200"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {feature.enabled ? (
                      <CheckCircle2 className="h-5 w-5" />
                    ) : (
                      <Lock className="h-5 w-5" />
                    )}
                    <span className="font-bold">{feature.label}</span>
                  </div>

                  <span className="text-sm font-black">{feature.value}</span>
                </div>
              ))}
            </div>

            <Link
              href="/dashboard/subscription"
              className="mt-6 inline-flex items-center justify-center gap-2 rounded-2xl border border-cyan-300/20 bg-cyan-300/10 px-5 py-4 font-bold text-cyan-100 hover:bg-cyan-300/20"
            >
              View subscription
              <ExternalLink className="h-5 w-5" />
            </Link>
          </section>
        </section>

        <form
          action={updateReportSettings}
          className="mt-8 rounded-3xl border border-white/10 bg-white/[0.04] p-8"
        >
          <div className="mb-6 flex items-center gap-3">
            <Building2 className="h-7 w-7 text-cyan-300" />
            <h2 className="text-3xl font-black">Report business settings</h2>
          </div>

          <p className="mb-6 max-w-3xl leading-8 text-slate-300">
            These details are used for client-facing reports and receipts where
            supported.
          </p>

          <div className="grid gap-5 md:grid-cols-2">
            <label className="grid gap-2">
              <span className="text-sm font-semibold text-slate-300">
                Report business name
              </span>
              <input
                name="report_business_name"
                defaultValue={
                  businessSettings?.business_name ?? profile.business_name ?? ""
                }
                placeholder="Your business name"
                className="rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none focus:border-cyan-300"
              />
            </label>

            <label className="grid gap-2">
              <span className="text-sm font-semibold text-slate-300">
                Prepared by
              </span>
              <input
                name="report_prepared_by"
                defaultValue={
                  businessSettings?.report_prepared_by ??
                  profile.full_name ??
                  ""
                }
                placeholder="Your name or team name"
                className="rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none focus:border-cyan-300"
              />
            </label>

            <label className="grid gap-2">
              <span className="text-sm font-semibold text-slate-300">
                Contact email
              </span>
              <input
                name="contact_email"
                defaultValue={
                  businessSettings?.contact_email ??
                  profile.email ??
                  user.email ??
                  ""
                }
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
                defaultValue={businessSettings?.phone ?? ""}
                placeholder="+91..."
                className="rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none focus:border-cyan-300"
              />
            </label>

            <label className="grid gap-2">
              <span className="text-sm font-semibold text-slate-300">
                Business website
              </span>
              <input
                name="website"
                defaultValue={
                  businessSettings?.website ?? profile.website_url ?? ""
                }
                placeholder="https://yourwebsite.com"
                className="rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none focus:border-cyan-300"
              />
            </label>

            <label className="grid gap-2">
              <span className="text-sm font-semibold text-slate-300">
                Address
              </span>
              <input
                name="address"
                defaultValue={businessSettings?.address ?? ""}
                placeholder="City, state, country"
                className="rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none focus:border-cyan-300"
              />
            </label>

            <label className="grid gap-2 md:col-span-2">
              <span className="text-sm font-semibold text-slate-300">
                Report footer note
              </span>
              <textarea
                name="footer_note"
                rows={3}
                defaultValue={
                  businessSettings?.footer_note ??
                  "This report is a safe passive website trust check, not a penetration test or legal compliance certificate."
                }
                className="rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none focus:border-cyan-300"
              />
            </label>
          </div>

          <button
            type="submit"
            className="mt-6 inline-flex items-center justify-center gap-2 rounded-2xl bg-cyan-300 px-5 py-4 font-bold text-slate-950 hover:bg-cyan-200"
          >
            <Save className="h-5 w-5" />
            Save report settings
          </button>
        </form>

        <section className="mt-8 rounded-3xl border border-amber-300/20 bg-amber-300/10 p-8">
          <h2 className="text-2xl font-black text-amber-100">
            Important SaaS rule
          </h2>
          <p className="mt-4 max-w-4xl leading-8 text-amber-50/90">
            Account type is for dashboard personalization only. It does not
            unlock paid features. Website limits, scan limits, PDF access,
            public sharing, agency mode, and manual payment tools are controlled
            by subscription plan and admin approval.
          </p>

          <p className="mt-4 text-sm text-amber-50/80">
            Current account type: {accountTypeLabel(profile.account_type)} ·
            Role: {profile.role}
          </p>
        </section>
      </div>
    </main>
  );
}


