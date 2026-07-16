export type SubscriptionPlanId =
  "single_report" | "beginner" | "starter" | "business" | "pro";

export type SubscriptionPlan = {
  id: string;
  name: string;
  description: string | null;
  monthly_price: number | null;
  currency: string | null;
  max_websites: number | null;
  max_scans_per_month: number | null;
  pdf_reports_enabled: boolean | null;
  public_share_enabled: boolean | null;
  agency_mode_enabled?: boolean | null;
  manual_payments_enabled: boolean | null;
  priority_support_enabled: boolean | null;
  is_active?: boolean | null;
  sort_order?: number | null;
};

export type SubscriptionRequestRow = {
  id: string;
  requested_plan_id: string;
  status: string;
  created_at: string;
};

export const customerPlanIds: SubscriptionPlanId[] = [
  "single_report",
  "beginner",
  "starter",
  "business",
  "pro",
];

export function normalizePlanId(value: unknown): SubscriptionPlanId {
  const plan = String(value ?? "")
    .trim()
    .toLowerCase();

  if (plan === "single_report") return "single_report";
  if (plan === "starter" || plan === "basic") return "starter";
  if (plan === "business") return "business";
  if (plan === "pro" || plan === "agency") return "pro";

  return "beginner";
}

export function getPlanDisplayName(value: unknown) {
  const plan = normalizePlanId(value);

  const labels: Record<SubscriptionPlanId, string> = {
    single_report: "Single-time Report",
    beginner: "Beginner",
    starter: "Starter",
    business: "Business",
    pro: "Pro",
  };

  return labels[plan];
}

export function planBadgeClass(value: unknown) {
  const plan = normalizePlanId(value);

  const classes: Record<SubscriptionPlanId, string> = {
    single_report: "border-violet-400/20 bg-violet-400/10 text-violet-100",
    beginner: "border-slate-400/20 bg-slate-400/10 text-slate-100",
    starter: "border-cyan-400/20 bg-cyan-400/10 text-cyan-100",
    business: "border-emerald-400/20 bg-emerald-400/10 text-emerald-100",
    pro: "border-amber-400/20 bg-amber-400/10 text-amber-100",
  };

  return classes[plan];
}

export function statusBadgeClass(value: unknown) {
  const status = String(value ?? "")
    .trim()
    .toLowerCase();

  if (status === "active")
    return "border-emerald-400/20 bg-emerald-400/10 text-emerald-100";
  if (status === "trial")
    return "border-cyan-400/20 bg-cyan-400/10 text-cyan-100";
  if (status === "pending")
    return "border-amber-400/20 bg-amber-400/10 text-amber-100";
  if (status === "approved")
    return "border-emerald-400/20 bg-emerald-400/10 text-emerald-100";
  if (status === "rejected")
    return "border-red-400/20 bg-red-400/10 text-red-100";
  if (status === "past_due")
    return "border-orange-400/20 bg-orange-400/10 text-orange-100";
  if (status === "cancelled" || status === "expired")
    return "border-red-400/20 bg-red-400/10 text-red-100";

  return "border-slate-400/20 bg-slate-400/10 text-slate-200";
}

export function priceText(
  plan:
    | Pick<SubscriptionPlan, "id" | "monthly_price" | "currency">
    | null
    | undefined,
) {
  if (!plan) return "Price not set";

  const price = Number(plan.monthly_price ?? 0);
  const currency = String(plan.currency ?? "INR").toUpperCase();
  const symbol = currency === "INR" ? "₹" : `${currency} `;

  if (plan.id === "single_report") {
    return `${symbol}${price.toLocaleString("en-IN")} / report`;
  }

  if (price <= 0) return "Free";

  return `${symbol}${price.toLocaleString("en-IN")} / month`;
}

export function usagePercent(used: number, limit: number | null | undefined) {
  const safeLimit = Number(limit ?? 0);
  if (safeLimit <= 0) return 0;

  return Math.min(100, Math.round((Number(used || 0) / safeLimit) * 100));
}

export function isLimitReached(used: number, limit: number | null | undefined) {
  const safeLimit = Number(limit ?? 0);
  if (safeLimit <= 0) return false;

  return Number(used || 0) >= safeLimit;
}

export function featureRows(plan: SubscriptionPlan) {
  const planId = normalizePlanId(plan.id);
  const pdfEnabled = Boolean(plan.pdf_reports_enabled);
  const shareEnabled = Boolean(plan.public_share_enabled);
  const manualPaymentsEnabled = Boolean(plan.manual_payments_enabled);
  const prioritySupportEnabled = Boolean(plan.priority_support_enabled);

  return [
    {
      label: "Websites",
      value: String(plan.max_websites ?? 1),
      enabled: true,
    },
    {
      label: "Scans",
      value:
        planId === "single_report"
          ? "1 report"
          : `${plan.max_scans_per_month ?? 1} / month`,
      enabled: true,
    },
    {
      label: "PDF / print report",
      value: pdfEnabled ? "Included" : "Not included",
      enabled: pdfEnabled,
    },
    {
      label: "Public share",
      value: shareEnabled ? "Included" : "Not included",
      enabled: shareEnabled,
    },
    {
      label: "Manual payment",
      value: manualPaymentsEnabled ? "Manual" : "Not included",
      enabled: manualPaymentsEnabled,
    },
    {
      label: "Priority support",
      value: prioritySupportEnabled ? "Included" : "Standard",
      enabled: prioritySupportEnabled,
    },
  ];
}

export function hasPdfReports(
  plan: Pick<SubscriptionPlan, "pdf_reports_enabled"> | null | undefined,
) {
  return Boolean(plan?.pdf_reports_enabled);
}

export function hasPublicShare(
  plan: Pick<SubscriptionPlan, "public_share_enabled"> | null | undefined,
) {
  return Boolean(plan?.public_share_enabled);
}

export function hasManualPayments(
  plan: Pick<SubscriptionPlan, "manual_payments_enabled"> | null | undefined,
) {
  return Boolean(plan?.manual_payments_enabled);
}

export function hasPrioritySupport(
  plan: Pick<SubscriptionPlan, "priority_support_enabled"> | null | undefined,
) {
  return Boolean(plan?.priority_support_enabled);
}


