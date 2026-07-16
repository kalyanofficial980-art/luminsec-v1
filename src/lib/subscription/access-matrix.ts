export type AccessValue = "yes" | "limited" | "no" | "admin";
export type AccessPlan =
  "single_report" | "beginner" | "starter" | "business" | "pro" | "admin";

export type AccessMatrixRow = {
  feature: string;
  single_report: AccessValue;
  beginner: AccessValue;
  starter: AccessValue;
  business: AccessValue;
  pro: AccessValue;
  admin: AccessValue;
};

export const accessMatrix: AccessMatrixRow[] = [
  {
    feature: "Dashboard",
    single_report: "limited",
    beginner: "yes",
    starter: "yes",
    business: "yes",
    pro: "yes",
    admin: "admin",
  },
  {
    feature: "Website scan",
    single_report: "limited",
    beginner: "limited",
    starter: "yes",
    business: "yes",
    pro: "yes",
    admin: "admin",
  },
  {
    feature: "PDF / print report",
    single_report: "yes",
    beginner: "yes",
    starter: "yes",
    business: "yes",
    pro: "yes",
    admin: "admin",
  },
  {
    feature: "Public share report",
    single_report: "no",
    beginner: "no",
    starter: "yes",
    business: "yes",
    pro: "yes",
    admin: "admin",
  },
  {
    feature: "Manual-reviewed paid report",
    single_report: "yes",
    beginner: "limited",
    starter: "limited",
    business: "yes",
    pro: "yes",
    admin: "admin",
  },
  {
    feature: "Retest proof",
    single_report: "no",
    beginner: "no",
    starter: "limited",
    business: "yes",
    pro: "yes",
    admin: "admin",
  },
  {
    feature: "Priority support",
    single_report: "no",
    beginner: "no",
    starter: "no",
    business: "yes",
    pro: "yes",
    admin: "admin",
  },
];

export function accessValueText(value: AccessValue) {
  if (value === "yes") return "Yes";
  if (value === "limited") return "Limited";
  if (value === "admin") return "Admin";
  return "No";
}

export function accessValueClass(value: AccessValue) {
  if (value === "yes")
    return "border-emerald-400/20 bg-emerald-400/10 text-emerald-100";
  if (value === "limited")
    return "border-amber-400/20 bg-amber-400/10 text-amber-100";
  if (value === "admin")
    return "border-cyan-400/20 bg-cyan-400/10 text-cyan-100";
  return "border-slate-400/20 bg-slate-400/10 text-slate-300";
}


