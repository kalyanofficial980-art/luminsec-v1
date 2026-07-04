import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import DashboardShell from "@/components/dashboard/dashboard-shell";
import { createClient } from "@/lib/supabase/server";
import { normalizeProfile } from "@/lib/auth/profile";
import {
  fallbackNavSubscription,
  type DashboardNavSubscription,
} from "@/lib/subscription/navigation";

function asRecord(value: unknown) {
  if (!value || typeof value !== "object") {
    return null;
  }

  return value as Record<string, unknown>;
}

function text(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

function boolValue(value: unknown, fallback: boolean) {
  return typeof value === "boolean" ? value : fallback;
}

function getJoinedPlan(value: unknown) {
  if (Array.isArray(value)) {
    return asRecord(value[0]);
  }

  return asRecord(value);
}

function normalizeNavSubscription(value: unknown): DashboardNavSubscription {
  const row = asRecord(value);

  if (!row) {
    return fallbackNavSubscription;
  }

  const plan = getJoinedPlan(row.subscription_plans);
  const planId = text(row.plan_id, fallbackNavSubscription.planId);

  return {
    planId,
    planName: text(plan?.name, planId === "trial" ? "Trial" : planId),
    status: text(row.status, fallbackNavSubscription.status),
    agencyModeEnabled: boolValue(plan?.agency_mode_enabled, fallbackNavSubscription.agencyModeEnabled),
    manualPaymentsEnabled: boolValue(plan?.manual_payments_enabled, fallbackNavSubscription.manualPaymentsEnabled),
    publicShareEnabled: boolValue(plan?.public_share_enabled, fallbackNavSubscription.publicShareEnabled),
    pdfReportsEnabled: boolValue(plan?.pdf_reports_enabled, fallbackNavSubscription.pdfReportsEnabled),
  };
}

export default async function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profileData } = await supabase
    .from("profiles")
    .select("id, email, full_name, business_name, website_url, role, account_type, onboarding_completed")
    .eq("id", user.id)
    .maybeSingle();

  const profile = normalizeProfile(profileData);

  if (!profile?.onboarding_completed) {
    redirect("/onboarding");
  }

  const { data: subscriptionData } = await supabase
    .from("user_subscriptions")
    .select("plan_id, status, subscription_plans(name, agency_mode_enabled, manual_payments_enabled, public_share_enabled, pdf_reports_enabled)")
    .eq("user_id", user.id)
    .maybeSingle();

  const subscription = normalizeNavSubscription(subscriptionData);

  return (
    <DashboardShell profile={profile} subscription={subscription}>
      {children}
    </DashboardShell>
  );
}