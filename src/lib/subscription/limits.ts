export type SubscriptionPlan = {
  id: string;
  name: string;
  description: string | null;
  monthly_price: number;
  currency: string;
  max_websites: number;
  max_scans_per_month: number;
  pdf_reports_enabled: boolean;
  public_share_enabled: boolean;
  agency_mode_enabled: boolean;
  manual_payments_enabled: boolean;
  priority_support_enabled: boolean;
};

export type UserSubscription = {
  id: string;
  user_id: string;
  plan_id: string;
  status: "trial" | "active" | "past_due" | "cancelled" | "expired";
  current_period_start: string;
  current_period_end: string | null;
  scans_used_this_period: number;
};

export function priceText(plan: Pick<SubscriptionPlan, "monthly_price" | "currency">) {
  const price = Number(plan.monthly_price ?? 0);

  if (price === 0) {
    return "Free";
  }

  if (plan.currency === "INR") {
    return `₹${price.toLocaleString("en-IN")}/month`;
  }

  return `${plan.currency} ${price.toLocaleString("en-IN")}/month`;
}

export function planBadgeClass(planId: string) {
  if (planId === "agency") return "border-purple-400/20 bg-purple-400/10 text-purple-100";
  if (planId === "pro") return "border-cyan-400/20 bg-cyan-400/10 text-cyan-100";
  if (planId === "basic") return "border-emerald-400/20 bg-emerald-400/10 text-emerald-100";
  return "border-amber-400/20 bg-amber-400/10 text-amber-100";
}

export function statusBadgeClass(status: string) {
  if (status === "active") return "border-emerald-400/20 bg-emerald-400/10 text-emerald-100";
  if (status === "trial") return "border-cyan-400/20 bg-cyan-400/10 text-cyan-100";
  if (status === "past_due") return "border-amber-400/20 bg-amber-400/10 text-amber-100";
  return "border-red-400/20 bg-red-400/10 text-red-100";
}

export function yesNo(value: boolean) {
  return value ? "Yes" : "No";
}

export function featureRows(plan: SubscriptionPlan) {
  return [
    {
      label: "Websites",
      value: String(plan.max_websites),
      enabled: true,
    },
    {
      label: "Scans per month",
      value: String(plan.max_scans_per_month),
      enabled: true,
    },
    {
      label: "PDF reports",
      value: yesNo(plan.pdf_reports_enabled),
      enabled: plan.pdf_reports_enabled,
    },
    {
      label: "Public share links",
      value: yesNo(plan.public_share_enabled),
      enabled: plan.public_share_enabled,
    },
    {
      label: "Agency mode",
      value: yesNo(plan.agency_mode_enabled),
      enabled: plan.agency_mode_enabled,
    },
    {
      label: "Manual payments",
      value: yesNo(plan.manual_payments_enabled),
      enabled: plan.manual_payments_enabled,
    },
    {
      label: "Priority support",
      value: yesNo(plan.priority_support_enabled),
      enabled: plan.priority_support_enabled,
    },
  ];
}

export function usagePercent(used: number, limit: number) {
  if (limit <= 0) {
    return 0;
  }

  return Math.min(100, Math.round((used / limit) * 100));
}

export function isLimitReached(used: number, limit: number) {
  return used >= limit;
}