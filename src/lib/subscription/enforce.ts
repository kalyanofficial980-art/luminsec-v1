import { createClient } from "@/lib/supabase/server";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

export type PlanLimit = {
  id: string;
  name: string;
  maxWebsites: number;
  maxScansPerMonth: number;
  pdfReportsEnabled: boolean;
  publicShareEnabled: boolean;
  agencyModeEnabled: boolean;
  manualPaymentsEnabled: boolean;
};

export type SubscriptionAccess = {
  plan: PlanLimit;
  status: string;
  isUsable: boolean;
  currentPeriodStart: string | null;
  currentPeriodEnd: string | null;
};

export type UsageCounts = {
  websiteCount: number;
  scansThisPeriod: number;
};

export type LimitDecision = {
  allowed: boolean;
  message: string;
};

const fallbackTrialPlan: PlanLimit = {
  id: "trial",
  name: "Trial",
  maxWebsites: 1,
  maxScansPerMonth: 3,
  pdfReportsEnabled: true,
  publicShareEnabled: false,
  agencyModeEnabled: false,
  manualPaymentsEnabled: false,
};

function asRecord(value: unknown) {
  if (!value || typeof value !== "object") {
    return null;
  }

  return value as Record<string, unknown>;
}

function text(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

function numberValue(value: unknown, fallback: number) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function boolValue(value: unknown, fallback: boolean) {
  return typeof value === "boolean" ? value : fallback;
}

function normalizePlan(value: unknown): PlanLimit | null {
  const row = asRecord(value);

  if (!row) {
    return null;
  }

  const id = text(row.id, "trial");

  return {
    id,
    name: text(row.name, id),
    maxWebsites: numberValue(row.max_websites, fallbackTrialPlan.maxWebsites),
    maxScansPerMonth: numberValue(
      row.max_scans_per_month,
      fallbackTrialPlan.maxScansPerMonth,
    ),
    pdfReportsEnabled: boolValue(
      row.pdf_reports_enabled,
      fallbackTrialPlan.pdfReportsEnabled,
    ),
    publicShareEnabled: boolValue(
      row.public_share_enabled,
      fallbackTrialPlan.publicShareEnabled,
    ),
    agencyModeEnabled: boolValue(
      row.agency_mode_enabled,
      fallbackTrialPlan.agencyModeEnabled,
    ),
    manualPaymentsEnabled: boolValue(
      row.manual_payments_enabled,
      fallbackTrialPlan.manualPaymentsEnabled,
    ),
  };
}

function normalizeJoinedPlan(value: unknown): PlanLimit | null {
  if (Array.isArray(value)) {
    return normalizePlan(value[0]);
  }

  return normalizePlan(value);
}

function monthStartIso() {
  const date = new Date();
  date.setUTCDate(1);
  date.setUTCHours(0, 0, 0, 0);
  return date.toISOString();
}

async function getPlanById(
  supabase: SupabaseServerClient,
  planId: string,
): Promise<PlanLimit | null> {
  const { data } = await supabase
    .from("subscription_plans")
    .select("*")
    .eq("id", planId)
    .maybeSingle();

  return normalizePlan(data);
}

async function createTrialIfMissing(
  supabase: SupabaseServerClient,
  userId: string,
) {
  await supabase.from("user_subscriptions").insert({
    user_id: userId,
    plan_id: "trial",
    status: "trial",
    current_period_start: new Date().toISOString(),
    current_period_end: new Date(
      Date.now() + 14 * 24 * 60 * 60 * 1000,
    ).toISOString(),
  });
}

export async function getUserIsAdmin(
  supabase: SupabaseServerClient,
  userId: string,
): Promise<boolean> {
  const { data } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .maybeSingle();

  const row = asRecord(data);

  return row?.role === "admin";
}

export async function getUserSubscriptionAccess(
  supabase: SupabaseServerClient,
  userId: string,
): Promise<SubscriptionAccess> {
  let { data: subscriptionData } = await supabase
    .from("user_subscriptions")
    .select(
      "id, user_id, plan_id, status, current_period_start, current_period_end, subscription_plans(*)",
    )
    .eq("user_id", userId)
    .maybeSingle();

  if (!subscriptionData) {
    await createTrialIfMissing(supabase, userId);

    const retry = await supabase
      .from("user_subscriptions")
      .select(
        "id, user_id, plan_id, status, current_period_start, current_period_end, subscription_plans(*)",
      )
      .eq("user_id", userId)
      .maybeSingle();

    subscriptionData = retry.data;
  }

  const subscriptionRow = asRecord(subscriptionData);
  const planId = text(subscriptionRow?.plan_id, "trial");
  const status = text(subscriptionRow?.status, "trial");

  const joinedPlan = normalizeJoinedPlan(subscriptionRow?.subscription_plans);
  const fetchedPlan = joinedPlan ?? (await getPlanById(supabase, planId));

  return {
    plan: fetchedPlan ?? fallbackTrialPlan,
    status,
    isUsable: status === "trial" || status === "active",
    currentPeriodStart: text(subscriptionRow?.current_period_start, "") || null,
    currentPeriodEnd: text(subscriptionRow?.current_period_end, "") || null,
  };
}

export async function getUserUsageCounts(
  supabase: SupabaseServerClient,
  userId: string,
): Promise<UsageCounts> {
  const access = await getUserSubscriptionAccess(supabase, userId);
  const periodStart = access.currentPeriodStart || monthStartIso();
  const periodEnd = access.currentPeriodEnd;

  const { count: websiteCount } = await supabase
    .from("websites")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId);

  let scanQuery = supabase
    .from("scan_results")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .gte("created_at", periodStart);

  if (periodEnd) {
    scanQuery = scanQuery.lt("created_at", periodEnd);
  }

  const { count: scansThisPeriod } = await scanQuery;

  return {
    websiteCount: websiteCount ?? 0,
    scansThisPeriod: scansThisPeriod ?? 0,
  };
}

export function canAddWebsite(
  access: SubscriptionAccess,
  usage: UsageCounts,
): LimitDecision {
  if (!access.isUsable) {
    return {
      allowed: false,
      message:
        "Your subscription is not active. Please open Subscription and request a plan.",
    };
  }

  if (usage.websiteCount >= access.plan.maxWebsites) {
    return {
      allowed: false,
      message: `${access.plan.name} plan website limit reached. You can add ${access.plan.maxWebsites} website(s). Please upgrade to add more websites.`,
    };
  }

  return {
    allowed: true,
    message: "Allowed",
  };
}

export function canRunScan(
  access: SubscriptionAccess,
  usage: UsageCounts,
): LimitDecision {
  if (!access.isUsable) {
    return {
      allowed: false,
      message:
        "Your subscription is not active. Please open Subscription and request a plan.",
    };
  }

  if (usage.scansThisPeriod >= access.plan.maxScansPerMonth) {
    return {
      allowed: false,
      message: `${access.plan.name} plan scan limit reached. You can run ${access.plan.maxScansPerMonth} scan(s) in this subscription period. Please upgrade to run more scans.`,
    };
  }

  return {
    allowed: true,
    message: "Allowed",
  };
}

export function encodeLimitMessage(message: string) {
  return encodeURIComponent(message);
}


