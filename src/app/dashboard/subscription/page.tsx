import { redirect } from "next/navigation";
import {
  CheckCircle2,
  CreditCard,
  FileText,
  Globe2,
  Lock,
  Rocket,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import {
  featureRows,
  isLimitReached,
  planBadgeClass,
  priceText,
  statusBadgeClass,
  usagePercent,
  type SubscriptionPlan,
} from "@/lib/subscription/limits";
import { requestPlanChange } from "./actions";

type SubscriptionRequestRow = {
  id: string;
  requested_plan_id: string;
  status: string;
  created_at: string;
};

function progressClass(percent: number) {
  if (percent >= 100) return "bg-red-400";
  if (percent >= 80) return "bg-amber-400";
  return "bg-cyan-300";
}

function getJoinedPlan(subscription: any): SubscriptionPlan | null {
  const plan = subscription?.subscription_plans;

  if (Array.isArray(plan)) {
    return (plan[0] ?? null) as SubscriptionPlan | null;
  }

  return (plan ?? null) as SubscriptionPlan | null;
}

export default async function SubscriptionPage({
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

  const { data: plansData } = await supabase
    .from("subscription_plans")
    .select("*")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  let { data: subscriptionData } = await supabase
    .from("user_subscriptions")
    .select("id, user_id, plan_id, status, current_period_start, current_period_end, scans_used_this_period, subscription_plans(*)")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!subscriptionData) {
    await supabase.from("user_subscriptions").insert({
      user_id: user.id,
      plan_id: "trial",
      status: "trial",
      current_period_end: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
    });

    const retry = await supabase
      .from("user_subscriptions")
      .select("id, user_id, plan_id, status, current_period_start, current_period_end, scans_used_this_period, subscription_plans(*)")
      .eq("user_id", user.id)
      .maybeSingle();

    subscriptionData = retry.data;
  }

  const plans = (plansData ?? []) as SubscriptionPlan[];
  const currentPlan = getJoinedPlan(subscriptionData) || plans.find((plan) => plan.id === "trial") || null;
  const currentPlanId = subscriptionData?.plan_id || currentPlan?.id || "trial";
  const currentStatus = subscriptionData?.status || "trial";

  const periodStart = subscriptionData?.current_period_start
    ? new Date(subscriptionData.current_period_start)
    : new Date();

  if (!subscriptionData?.current_period_start) {
    periodStart.setUTCDate(1);
    periodStart.setUTCHours(0, 0, 0, 0);
  }

  const periodEnd = subscriptionData?.current_period_end
    ? new Date(subscriptionData.current_period_end)
    : null;

  const { count: websiteCount } = await supabase
    .from("websites")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id);

  let scanUsageQuery = supabase
    .from("scan_results")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .gte("created_at", periodStart.toISOString());

  if (periodEnd) {
    scanUsageQuery = scanUsageQuery.lt("created_at", periodEnd.toISOString());
  }

  const { count: scanCount } = await scanUsageQuery;

  const { data: requestsData } = await supabase
    .from("subscription_requests")
    .select("id, requested_plan_id, status, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(5);

  const requests = (requestsData ?? []) as SubscriptionRequestRow[];

  const usedWebsites = websiteCount ?? 0;
  const usedScans = scanCount ?? 0;

  const websitePercent = currentPlan ? usagePercent(usedWebsites, currentPlan.max_websites) : 0;
  const scanPercent = currentPlan ? usagePercent(usedScans, currentPlan.max_scans_per_month) : 0;

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
                Subscription and limits
              </h1>

              <p className="mt-4 max-w-3xl leading-8 text-slate-300">
                VeyraSec currently uses manual subscription approval. Choose a plan, submit a request,
                and the founder/admin can upgrade your account manually.
              </p>
            </div>

            <div className={`rounded-3xl border p-6 text-center ${planBadgeClass(currentPlanId)}`}>
              <Sparkles className="mx-auto mb-3 h-9 w-9" />
              <p className="text-sm opacity-80">Current plan</p>
              <p className="mt-2 text-4xl font-black">{currentPlan?.name || "Trial"}</p>
              <p className="mt-2 text-sm font-bold">{currentPlan ? priceText(currentPlan) : "Free"}</p>
            </div>
          </div>
        </section>

        {params.message ? (
          <div className="mt-6 rounded-3xl border border-cyan-300/20 bg-cyan-300/10 p-5 text-cyan-100">
            {params.message}
          </div>
        ) : null}

        <section className="mt-8 grid gap-4 md:grid-cols-3">
          <div className={`rounded-3xl border p-6 ${statusBadgeClass(currentStatus)}`}>
            <ShieldCheck className="mb-4 h-7 w-7" />
            <p className="text-sm opacity-80">Subscription status</p>
            <p className="mt-2 text-3xl font-black">{currentStatus}</p>
          </div>

          <div className={`rounded-3xl border p-6 ${isLimitReached(usedWebsites, currentPlan?.max_websites ?? 1) ? "border-red-400/20 bg-red-400/10 text-red-100" : "border-cyan-400/20 bg-cyan-400/10 text-cyan-100"}`}>
            <Globe2 className="mb-4 h-7 w-7" />
            <p className="text-sm opacity-80">Website usage</p>
            <p className="mt-2 text-3xl font-black">
              {usedWebsites}/{currentPlan?.max_websites ?? 1}
            </p>
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-950/60">
              <div className={`h-full ${progressClass(websitePercent)}`} style={{ width: `${websitePercent}%` }} />
            </div>
          </div>

          <div className={`rounded-3xl border p-6 ${isLimitReached(usedScans, currentPlan?.max_scans_per_month ?? 3) ? "border-red-400/20 bg-red-400/10 text-red-100" : "border-cyan-400/20 bg-cyan-400/10 text-cyan-100"}`}>
            <FileText className="mb-4 h-7 w-7" />
            <p className="text-sm opacity-80">Scans this period</p>
            <p className="mt-2 text-3xl font-black">
              {usedScans}/{currentPlan?.max_scans_per_month ?? 3}
            </p>
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-950/60">
              <div className={`h-full ${progressClass(scanPercent)}`} style={{ width: `${scanPercent}%` }} />
            </div>
          </div>
        </section>

        {currentPlan ? (
          <section className="mt-8 rounded-3xl border border-white/10 bg-white/[0.04] p-8">
            <div className="mb-6 flex items-center gap-3">
              <CheckCircle2 className="h-7 w-7 text-cyan-300" />
              <h2 className="text-3xl font-black">Current feature access</h2>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {featureRows(currentPlan).map((feature) => (
                <div
                  key={feature.label}
                  className={`rounded-3xl border p-5 ${
                    feature.enabled
                      ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-100"
                      : "border-slate-400/20 bg-slate-400/10 text-slate-200"
                  }`}
                >
                  {feature.enabled ? (
                    <CheckCircle2 className="mb-4 h-6 w-6" />
                  ) : (
                    <Lock className="mb-4 h-6 w-6" />
                  )}
                  <p className="text-sm opacity-80">{feature.label}</p>
                  <p className="mt-2 text-2xl font-black">{feature.value}</p>
                </div>
              ))}
            </div>
          </section>
        ) : null}

        <section className="mt-8 rounded-3xl border border-white/10 bg-white/[0.04] p-8">
          <div className="mb-6 flex items-center gap-3">
            <Rocket className="h-7 w-7 text-cyan-300" />
            <h2 className="text-3xl font-black">Available plans</h2>
          </div>

          <div className="grid gap-5 xl:grid-cols-4">
            {plans.map((plan) => {
              const isCurrent = plan.id === currentPlanId;

              return (
                <div key={plan.id} className={`rounded-3xl border p-6 ${planBadgeClass(plan.id)}`}>
                  <div className="mb-5 flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-3xl font-black">{plan.name}</h3>
                      <p className="mt-2 text-sm leading-6 opacity-80">{plan.description}</p>
                    </div>

                    {isCurrent ? (
                      <span className="rounded-full bg-slate-950/40 px-3 py-1 text-xs font-bold">
                        Current
                      </span>
                    ) : null}
                  </div>

                  <p className="text-4xl font-black">{priceText(plan)}</p>

                  <div className="mt-6 grid gap-3">
                    {featureRows(plan).map((feature) => (
                      <div key={feature.label} className="flex items-center justify-between gap-3 rounded-2xl bg-slate-950/40 p-3 text-sm">
                        <span>{feature.label}</span>
                        <span className="font-bold">{feature.value}</span>
                      </div>
                    ))}
                  </div>

                  {isCurrent ? (
                    <div className="mt-6 rounded-2xl border border-white/10 bg-slate-950/40 p-4 text-center text-sm font-bold">
                      You are on this plan
                    </div>
                  ) : (
                    <form action={requestPlanChange} className="mt-6 grid gap-3">
                      <input type="hidden" name="plan_id" value={plan.id} />
                      <textarea
                        name="message"
                        rows={2}
                        placeholder="Optional note: why you want this plan"
                        className="rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-cyan-300"
                      />
                      <button
                        type="submit"
                        className="rounded-2xl bg-cyan-300 px-4 py-3 text-sm font-bold text-slate-950 hover:bg-cyan-200"
                      >
                        Request {plan.name}
                      </button>
                    </form>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        <section className="mt-8 grid gap-8 lg:grid-cols-2">
          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-8">
            <div className="mb-6 flex items-center gap-3">
              <Users className="h-7 w-7 text-cyan-300" />
              <h2 className="text-3xl font-black">Recent plan requests</h2>
            </div>

            {requests.length === 0 ? (
              <p className="rounded-2xl border border-white/10 bg-slate-950 p-5 text-slate-400">
                No plan requests yet.
              </p>
            ) : (
              <div className="grid gap-3">
                {requests.map((request) => (
                  <div key={request.id} className="rounded-2xl border border-white/10 bg-slate-950 p-5">
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-bold text-white">{request.requested_plan_id}</p>
                      <span className="rounded-full border border-amber-400/20 bg-amber-400/10 px-3 py-1 text-xs font-bold text-amber-100">
                        {request.status}
                      </span>
                    </div>
                    <p className="mt-2 text-xs text-slate-500">{request.created_at}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-3xl border border-amber-300/20 bg-amber-300/10 p-8">
            <h2 className="text-2xl font-black text-amber-100">Important subscription note</h2>
            <p className="mt-4 leading-8 text-amber-50/90">
              This is manual subscription logic only. It does not collect money, does not verify
              payment, and does not use Razorpay. The founder/admin must manually approve upgrades
              after payment/legal setup is handled properly.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}