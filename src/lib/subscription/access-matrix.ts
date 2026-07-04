export type AccessPlanId = "trial" | "basic" | "pro" | "agency" | "admin";

export type AccessRule = {
  feature: string;
  trial: boolean | string;
  basic: boolean | string;
  pro: boolean | string;
  agency: boolean | string;
  admin: boolean | string;
};

export const accessMatrix: AccessRule[] = [
  {
    feature: "Websites",
    trial: "1",
    basic: "3",
    pro: "10",
    agency: "50",
    admin: "Unlimited",
  },
  {
    feature: "Scans per period",
    trial: "3",
    basic: "20",
    pro: "100",
    agency: "300",
    admin: "Unlimited",
  },
  {
    feature: "PDF reports",
    trial: true,
    basic: true,
    pro: true,
    agency: true,
    admin: true,
  },
  {
    feature: "Public report links",
    trial: false,
    basic: true,
    pro: true,
    agency: true,
    admin: true,
  },
  {
    feature: "Agency clients",
    trial: false,
    basic: false,
    pro: false,
    agency: true,
    admin: true,
  },
  {
    feature: "Plan approvals",
    trial: false,
    basic: false,
    pro: false,
    agency: false,
    admin: true,
  },
  {
    feature: "SaaS readiness",
    trial: false,
    basic: false,
    pro: false,
    agency: false,
    admin: true,
  },
  {
    feature: "Validation CRM",
    trial: false,
    basic: false,
    pro: false,
    agency: false,
    admin: true,
  },
  {
    feature: "Production status",
    trial: false,
    basic: false,
    pro: false,
    agency: false,
    admin: true,
  },
];

export function accessValueText(value: boolean | string) {
  if (value === true) return "Yes";
  if (value === false) return "No";
  return value;
}

export function accessValueClass(value: boolean | string) {
  if (value === true) return "border-emerald-400/20 bg-emerald-400/10 text-emerald-100";
  if (value === false) return "border-slate-400/20 bg-slate-400/10 text-slate-300";
  if (value === "Unlimited") return "border-purple-400/20 bg-purple-400/10 text-purple-100";
  return "border-cyan-400/20 bg-cyan-400/10 text-cyan-100";
}