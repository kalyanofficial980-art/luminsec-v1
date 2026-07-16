import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { normalizeProfile, type DashboardProfile } from "@/lib/auth/profile";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

export type FeatureKey =
  "pdf_reports" | "public_share" | "agency_mode" | "manual_payments";

export type PlanFeatureSet = {
  planId: string;
  planName: string;
  status: string;
  pdfReportsEnabled: boolean;
  publicShareEnabled: boolean;
  agencyModeEnabled: boolean;
  manualPaymentsEnabled: boolean;
};

export type FeatureAccessContext = {
  supabase: SupabaseServerClient;
  user: {
    id: string;
    email?: string;
  };
  profile: DashboardProfile;
  features: PlanFeatureSet;
};

const fallbackFeatures: PlanFeatureSet = {
  planId: "trial",
  planName: "Trial",
  status: "trial",
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

function getJoinedPlan(value: unknown) {
  if (Array.isArray(value)) {
    return asRecord(value[0]);
  }

  return asRecord(value);
}

function text(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

function boolValue(value: unknown, fallback: boolean) {
  return typeof value === "boolean" ? value : fallback;
}

export function featureLabel(feature: FeatureKey) {
  if (feature === "pdf_reports") return "PDF reports";
  if (feature === "public_share") return "Public share links";
  if (feature === "agency_mode") return "Agency mode";
  if (feature === "manual_payments") return "Manual payments";

  return "Feature";
}

export function featureMessage(feature: FeatureKey) {
  if (feature === "pdf_reports") {
    return "Your current plan does not include PDF reports. Please upgrade to use PDF export.";
  }

  if (feature === "public_share") {
    return "Your current plan does not include public share links. Please upgrade to share reports publicly.";
  }

  if (feature === "agency_mode") {
    return "Your current plan does not include agency mode. Please upgrade to manage client websites.";
  }

  if (feature === "manual_payments") {
    return "Your current plan does not include manual payment tracking.";
  }

  return "Your current plan does not include this feature.";
}

export function isFeatureSubscriptionUsable(status: string) {
  return status === "trial" || status === "active";
}

export function featureEnabled(features: PlanFeatureSet, feature: FeatureKey) {
  if (!isFeatureSubscriptionUsable(features.status)) {
    return false;
  }

  if (feature === "pdf_reports") return features.pdfReportsEnabled;
  if (feature === "public_share") return features.publicShareEnabled;
  if (feature === "agency_mode") return features.agencyModeEnabled;
  if (feature === "manual_payments") return features.manualPaymentsEnabled;

  return false;
}

export async function getPlanFeaturesForUser(
  supabase: SupabaseServerClient,
  userId: string,
): Promise<PlanFeatureSet> {
  const { data } = await supabase
    .from("user_subscriptions")
    .select(
      "plan_id, status, subscription_plans(name, pdf_reports_enabled, public_share_enabled, agency_mode_enabled, manual_payments_enabled)",
    )
    .eq("user_id", userId)
    .maybeSingle();

  const row = asRecord(data);

  if (!row) {
    return fallbackFeatures;
  }

  const plan = getJoinedPlan(row.subscription_plans);
  const planId = text(row.plan_id, fallbackFeatures.planId);

  return {
    planId,
    planName: text(plan?.name, planId === "trial" ? "Trial" : planId),
    status: text(row.status, fallbackFeatures.status),
    pdfReportsEnabled: boolValue(
      plan?.pdf_reports_enabled,
      fallbackFeatures.pdfReportsEnabled,
    ),
    publicShareEnabled: boolValue(
      plan?.public_share_enabled,
      fallbackFeatures.publicShareEnabled,
    ),
    agencyModeEnabled: boolValue(
      plan?.agency_mode_enabled,
      fallbackFeatures.agencyModeEnabled,
    ),
    manualPaymentsEnabled: boolValue(
      plan?.manual_payments_enabled,
      fallbackFeatures.manualPaymentsEnabled,
    ),
  };
}

export async function userCanAccessFeature(
  supabase: SupabaseServerClient,
  userId: string,
  feature: FeatureKey,
) {
  const { data: profileData } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .maybeSingle();

  if (profileData?.role === "admin") {
    return true;
  }

  const features = await getPlanFeaturesForUser(supabase, userId);

  return featureEnabled(features, feature);
}

export async function requireFeatureAccess(
  feature: FeatureKey,
): Promise<FeatureAccessContext> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profileData } = await supabase
    .from("profiles")
    .select(
      "id, email, full_name, business_name, website_url, role, account_type, onboarding_completed",
    )
    .eq("id", user.id)
    .maybeSingle();

  const profile = normalizeProfile(profileData);

  if (!profile?.onboarding_completed) {
    redirect("/onboarding");
  }

  const features = await getPlanFeaturesForUser(supabase, user.id);

  if (profile.role !== "admin" && !featureEnabled(features, feature)) {
    redirect(`/dashboard/upgrade-required?feature=${feature}`);
  }

  return {
    supabase,
    user: {
      id: user.id,
      email: user.email ?? undefined,
    },
    profile,
    features,
  };
}
