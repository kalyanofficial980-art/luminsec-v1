import Link from "next/link";
import {
  CheckCircle2,
  CreditCard,
  ShieldCheck,
  UserRound,
  XCircle,
} from "lucide-react";
import { requireAdmin } from "@/lib/auth/route-access";
import {
  planBadgeClass,
  priceText,
  statusBadgeClass,
  type SubscriptionPlan,
} from "@/lib/subscription/limits";
import {
  approveSubscriptionRequest,
  manuallySetSubscription,
  rejectSubscriptionRequest,
} from "./actions";

type ProfileRow = {
  id: string;
  email: string | null;
  full_name: string | null;
  business_name: string | null;
  account_type: string | null;
};

function getJoinedPlan(value: any) {
  if (Array.isArray(value)) {
    return value[0] as any;
  }

  return value as any;
}

function getProfile(profiles: ProfileRow[], userId: string) {
  return profiles.find((profile) => profile.id === userId) ?? null;
}

function personLabel(profile: ProfileRow | null, userId: string) {
  if (!profile) return userId;
  return profile.business_name || profile.full_name || profile.email || userId;
}

function safeDate(value: string | null | undefined) {
  if (!value) return "Not set";

  try {
    return new Intl.DateTimeFormat("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(value));
  } catch {
    return value;
  }
}

export default async function AdminSubscriptionsPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string }>;
}) {
  const params = await searchParams;
  const { supabase } = await requireAdmin();

  const { data: plansData } = await supabase
    .from("subscription_plans")
    .select("*")
    .order("sort_order", { ascending: true });

  const { data: requestsData } = await supabase
    .from("subscription_requests")
    .select(
      "id, user_id, requested_plan_id, message, status, created_at, subscription_plans(name, monthly_price, currency)",
    )
    .order("created_at", { ascending: false })
    .limit(50);

  const { data: subscriptionsData } = await supabase
    .from("user_subscriptions")
    .select(
      "id, user_id, plan_id, status, current_period_start, current_period_end, scans_used_this_period, created_at, subscription_plans(name, monthly_price, currency)",
    )
    .order("created_at", { ascending: false })
    .limit(50);

  const requests = requestsData ?? [];
  const subscriptions = subscriptionsData ?? [];
  const plans = (plansData ?? []) as SubscriptionPlan[];

  const userIds = Array.from(
    new Set([
      ...requests.map((request: any) => String(request.user_id)),
      ...subscriptions.map((subscription: any) => String(subscription.user_id)),
    ]),
  );

  let profiles: ProfileRow[] = [];

  if (userIds.length > 0) {
    const { data: profilesData } = await supabase
      .from("profiles")
      .select("id, email, full_name, business_name, account_type")
      .in("id", userIds);

    profiles = (profilesData ?? []) as ProfileRow[];
  }

  const pendingRequests = requests.filter(
    (request: any) => request.status === "pending",
  );
  const activeSubscriptions = subscriptions.filter(
    (subscription: any) => subscription.status === "active",
  );

  return (
    <main className="min-h-screen bg-slate-950 p-6 text-white">
      <div className="mx-auto max-w-7xl">
        <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-8">
          <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-start">
            <div>
              <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-400/10 ring-1 ring-cyan-300/30">
                <CreditCard className="h-8 w-8 text-cyan-300" />
              </div>

              <h1 className="text-4xl font-black tracking-tight md:text-5xl">
                Subscription approvals
              </h1>

              <p className="mt-4 max-w-3xl leading-8 text-slate-300">
                Founder/admin panel to approve, reject, and manually update
                VeyraSec user plans. This is manual subscription control only.
              </p>
            </div>

            <Link
              href="/dashboard/subscription"
              className="rounded-2xl border border-cyan-300/20 bg-cyan-300/10 px-5 py-4 text-sm font-bold text-cyan-100 hover:bg-cyan-300/20"
            >
              View user subscription page
            </Link>
          </div>
        </section>

        {params.message ? (
          <div className="mt-6 rounded-3xl border border-cyan-300/20 bg-cyan-300/10 p-5 text-cyan-100">
            {params.message}
          </div>
        ) : null}

        <section className="mt-8 grid gap-4 md:grid-cols-3">
          <div className="rounded-3xl border border-amber-400/20 bg-amber-400/10 p-6 text-amber-100">
            <CreditCard className="mb-4 h-7 w-7" />
            <p className="text-sm opacity-80">Pending requests</p>
            <p className="mt-2 text-4xl font-black">{pendingRequests.length}</p>
          </div>

          <div className="rounded-3xl border border-emerald-400/20 bg-emerald-400/10 p-6 text-emerald-100">
            <CheckCircle2 className="mb-4 h-7 w-7" />
            <p className="text-sm opacity-80">Active subscriptions</p>
            <p className="mt-2 text-4xl font-black">
              {activeSubscriptions.length}
            </p>
          </div>

          <div className="rounded-3xl border border-cyan-400/20 bg-cyan-400/10 p-6 text-cyan-100">
            <ShieldCheck className="mb-4 h-7 w-7" />
            <p className="text-sm opacity-80">Available plans</p>
            <p className="mt-2 text-4xl font-black">{plans.length}</p>
          </div>
        </section>

        <section className="mt-8 rounded-3xl border border-white/10 bg-white/[0.04] p-8">
          <h2 className="text-3xl font-black">Plan requests</h2>

          {requests.length === 0 ? (
            <p className="mt-6 rounded-2xl border border-white/10 bg-slate-950 p-5 text-slate-400">
              No subscription requests yet.
            </p>
          ) : (
            <div className="mt-6 grid gap-4">
              {requests.map((request: any) => {
                const profile = getProfile(profiles, String(request.user_id));
                const plan = getJoinedPlan(request.subscription_plans);

                return (
                  <div
                    key={request.id}
                    className="rounded-3xl border border-white/10 bg-slate-950 p-6"
                  >
                    <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-start">
                      <div>
                        <div className="mb-3 flex items-center gap-3">
                          <UserRound className="h-6 w-6 text-cyan-300" />
                          <h3 className="text-2xl font-black">
                            {personLabel(profile, String(request.user_id))}
                          </h3>
                        </div>

                        <p className="text-sm text-slate-400">
                          {profile?.email || "No email"} ·{" "}
                          {profile?.account_type || "No account type"}
                        </p>

                        <p className="mt-3 text-sm text-slate-500">
                          Requested: {safeDate(request.created_at)}
                        </p>

                        {request.message ? (
                          <p className="mt-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-sm leading-7 text-slate-300">
                            {request.message}
                          </p>
                        ) : null}
                      </div>

                      <div className="min-w-72">
                        <div
                          className={`rounded-2xl border p-4 ${planBadgeClass(request.requested_plan_id)}`}
                        >
                          <p className="text-sm opacity-80">Requested plan</p>
                          <p className="mt-1 text-2xl font-black">
                            {plan?.name || request.requested_plan_id}
                          </p>
                          <p className="mt-1 text-sm font-bold">
                            {plan ? priceText(plan) : "Price not found"}
                          </p>
                        </div>

                        <div
                          className={`mt-3 rounded-2xl border p-3 text-center text-sm font-bold ${statusBadgeClass(request.status)}`}
                        >
                          {request.status}
                        </div>

                        {request.status === "pending" ? (
                          <div className="mt-4 grid gap-3 sm:grid-cols-2">
                            <form action={approveSubscriptionRequest}>
                              <input
                                type="hidden"
                                name="request_id"
                                value={request.id}
                              />
                              <button
                                type="submit"
                                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-300 px-4 py-3 text-sm font-black text-slate-950 hover:bg-emerald-200"
                              >
                                <CheckCircle2 className="h-5 w-5" />
                                Approve
                              </button>
                            </form>

                            <form action={rejectSubscriptionRequest}>
                              <input
                                type="hidden"
                                name="request_id"
                                value={request.id}
                              />
                              <button
                                type="submit"
                                className="flex w-full items-center justify-center gap-2 rounded-2xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm font-black text-red-100 hover:bg-red-400/20"
                              >
                                <XCircle className="h-5 w-5" />
                                Reject
                              </button>
                            </form>
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <section className="mt-8 rounded-3xl border border-white/10 bg-white/[0.04] p-8">
          <h2 className="text-3xl font-black">Current subscriptions</h2>

          {subscriptions.length === 0 ? (
            <p className="mt-6 rounded-2xl border border-white/10 bg-slate-950 p-5 text-slate-400">
              No subscriptions found.
            </p>
          ) : (
            <div className="mt-6 overflow-hidden rounded-3xl border border-white/10">
              <div className="grid grid-cols-1 gap-0 md:grid-cols-[1.3fr_0.8fr_0.8fr_1.2fr]">
                {subscriptions.map((subscription: any) => {
                  const profile = getProfile(
                    profiles,
                    String(subscription.user_id),
                  );
                  const plan = getJoinedPlan(subscription.subscription_plans);

                  return (
                    <div key={subscription.id} className="contents">
                      <div className="border-b border-white/10 bg-slate-950 p-5">
                        <p className="font-black text-white">
                          {personLabel(profile, String(subscription.user_id))}
                        </p>
                        <p className="mt-1 text-sm text-slate-500">
                          {profile?.email || "No email"}
                        </p>
                      </div>

                      <div className="border-b border-white/10 bg-slate-950 p-5">
                        <span
                          className={`rounded-full border px-3 py-1 text-xs font-bold ${planBadgeClass(subscription.plan_id)}`}
                        >
                          {plan?.name || subscription.plan_id}
                        </span>
                      </div>

                      <div className="border-b border-white/10 bg-slate-950 p-5">
                        <span
                          className={`rounded-full border px-3 py-1 text-xs font-bold ${statusBadgeClass(subscription.status)}`}
                        >
                          {subscription.status}
                        </span>
                      </div>

                      <div className="border-b border-white/10 bg-slate-950 p-5 text-sm text-slate-400">
                        <p>Ends: {safeDate(subscription.current_period_end)}</p>

                        <form
                          action={manuallySetSubscription}
                          className="mt-4 grid gap-3"
                        >
                          <input
                            type="hidden"
                            name="user_id"
                            value={subscription.user_id}
                          />

                          <select
                            name="plan_id"
                            defaultValue={subscription.plan_id}
                            className="rounded-2xl border border-white/10 bg-slate-900 px-3 py-2 text-white outline-none"
                          >
                            {plans.map((plan) => (
                              <option key={plan.id} value={plan.id}>
                                {plan.name}
                              </option>
                            ))}
                          </select>

                          <select
                            name="status"
                            defaultValue={subscription.status}
                            className="rounded-2xl border border-white/10 bg-slate-900 px-3 py-2 text-white outline-none"
                          >
                            <option value="beginner">beginner</option>
                            <option value="active">active</option>
                            <option value="past_due">past_due</option>
                            <option value="cancelled">cancelled</option>
                            <option value="expired">expired</option>
                          </select>

                          <button
                            type="submit"
                            className="rounded-2xl bg-cyan-300 px-4 py-2 text-sm font-black text-slate-950 hover:bg-cyan-200"
                          >
                            Update
                          </button>
                        </form>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </section>

        <section className="mt-8 rounded-3xl border border-amber-300/20 bg-amber-300/10 p-8">
          <h2 className="text-2xl font-black text-amber-100">
            Manual approval note
          </h2>
          <p className="mt-4 leading-8 text-amber-50/90">
            This panel only changes VeyraSec plan access. It does not verify
            payment, does not collect money, and does not handle GST/tax/legal
            compliance. Use an adult guardian and CA/CS before real billing.
          </p>
        </section>
      </div>
    </main>
  );
}



