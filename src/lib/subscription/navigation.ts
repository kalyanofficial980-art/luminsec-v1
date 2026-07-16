import type { DashboardProfile } from "@/lib/auth/profile";

export type DashboardNavSubscription = {
  planId: string;
  planName: string;
  status: string;
  agencyModeEnabled: boolean;
  manualPaymentsEnabled: boolean;
  publicShareEnabled: boolean;
  pdfReportsEnabled: boolean;
};

export const fallbackNavSubscription: DashboardNavSubscription = {
  planId: "trial",
  planName: "Trial",
  status: "trial",
  agencyModeEnabled: false,
  manualPaymentsEnabled: false,
  publicShareEnabled: false,
  pdfReportsEnabled: true,
};

export function isSubscriptionUsable(status: string) {
  return status === "trial" || status === "active";
}

export function canShowAgencyNavigation(
  profile: DashboardProfile,
  subscription: DashboardNavSubscription,
) {
  if (profile.role === "admin") {
    return true;
  }

  return (
    isSubscriptionUsable(subscription.status) && subscription.agencyModeEnabled
  );
}

export function canShowFounderNavigation(profile: DashboardProfile) {
  return profile.role === "admin";
}

export function planStatusLabel(subscription: DashboardNavSubscription) {
  return `${subscription.planName} · ${subscription.status}`;
}


