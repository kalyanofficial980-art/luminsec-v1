"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  BriefcaseBusiness,
  CreditCard,
  FileText,
  Globe2,
  Home,
  Rocket,
  Settings,
  ShieldCheck,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { brand } from "@/config/brand";
import type { DashboardProfile } from "@/lib/auth/profile";
import { accountTypeLabel } from "@/lib/auth/profile";
import type { DashboardNavSubscription } from "@/lib/subscription/navigation";
import {
  canShowAgencyNavigation,
  canShowFounderNavigation,
  planStatusLabel,
} from "@/lib/subscription/navigation";

type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
};

type NavSection = {
  title: string;
  items: NavItem[];
};

function getNavSections(
  profile: DashboardProfile,
  subscription: DashboardNavSubscription
): NavSection[] {
  const mainItems: NavItem[] = [
    {
      label: "Dashboard",
      href: "/dashboard",
      icon: Home,
    },
    {
      label: "Websites",
      href: "/dashboard/websites",
      icon: Globe2,
    },
    {
      label: "Reports",
      href: "/dashboard/scans",
      icon: FileText,
    },
    {
      label: "Subscription",
      href: "/dashboard/subscription",
      icon: CreditCard,
    },
  ];

  const agencyItems: NavItem[] = canShowAgencyNavigation(profile, subscription)
    ? [
        {
          label: "Agency",
          href: "/dashboard/agency",
          icon: BriefcaseBusiness,
        },
      ]
    : [];

  const founderItems: NavItem[] = canShowFounderNavigation(profile)
    ? [
        {
          label: "Payments",
          href: "/dashboard/payments",
          icon: CreditCard,
        },
        {
          label: "Plan Approvals",
          href: "/dashboard/admin/subscriptions",
          icon: CreditCard,
        },
        {
          label: "SaaS Readiness",
          href: "/dashboard/admin/saas-readiness",
          icon: ShieldCheck,
        },
        {
          label: "Access Audit",
          href: "/dashboard/admin/access-audit",
          icon: ShieldCheck,
        },
        {
          label: "Launch Checklist",
          href: "/dashboard/admin/launch-checklist",
          icon: ShieldCheck,
        },
        {
          label: "Validation CRM",
          href: "/dashboard/validation",
          icon: Users,
        },
        {
          label: "Production Status",
          href: "/dashboard/status",
          icon: Activity,
        },
        {
          label: "V2 Launch",
          href: "/dashboard/v2-launch",
          icon: Rocket,
        },
      ]
    : [];

  const settingsItems: NavItem[] = [
    {
      label: "Settings",
      href: "/dashboard/settings",
      icon: Settings,
    },
  ];

  return [
    {
      title: "Main",
      items: mainItems,
    },
    {
      title: "Agency",
      items: agencyItems,
    },
    {
      title: "Founder tools",
      items: founderItems,
    },
    {
      title: "Account",
      items: settingsItems,
    },
  ].filter((section) => section.items.length > 0);
}

function isActive(pathname: string, href: string) {
  if (href === "/dashboard") {
    return pathname === "/dashboard";
  }

  return pathname.startsWith(href);
}

function NavLink({
  item,
  active,
}: {
  item: NavItem;
  active: boolean;
}) {
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-bold transition ${
        active
          ? "bg-cyan-300 text-slate-950"
          : "text-slate-300 hover:bg-white/10 hover:text-white"
      }`}
    >
      <Icon className="h-5 w-5" />
      {item.label}
    </Link>
  );
}

function MobileNavLink({
  item,
  active,
}: {
  item: NavItem;
  active: boolean;
}) {
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      className={`flex shrink-0 items-center gap-2 rounded-2xl px-4 py-2 text-xs font-bold ${
        active
          ? "bg-cyan-300 text-slate-950"
          : "border border-white/10 text-slate-300"
      }`}
    >
      <Icon className="h-4 w-4" />
      {item.label}
    </Link>
  );
}

export function DashboardShell({
  children,
  profile,
  subscription,
}: {
  children: ReactNode;
  profile: DashboardProfile;
  subscription: DashboardNavSubscription;
}) {
  const pathname = usePathname();
  const navSections = getNavSections(profile, subscription);
  const mobileItems = navSections.flatMap((section) => section.items);

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <aside className="fixed left-0 top-0 z-40 hidden h-screen w-72 border-r border-white/10 bg-slate-950/95 p-5 backdrop-blur lg:block">
        <Link
          href="/dashboard"
          className="mb-5 flex items-center gap-3 rounded-3xl border border-white/10 bg-white/[0.04] p-4"
        >
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-300 text-slate-950">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xl font-black">{brand.name}</p>
            <p className="text-xs text-slate-400">{brand.version}</p>
          </div>
        </Link>

        <div className="mb-5 rounded-3xl border border-cyan-300/20 bg-cyan-300/10 p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-cyan-100/70">Account</p>
          <p className="mt-2 font-black text-cyan-100">{accountTypeLabel(profile.account_type)}</p>
          <p className="mt-1 text-xs text-cyan-50/70">{profile.role === "admin" ? "Admin full access" : planStatusLabel(subscription)}</p>
          <p className="mt-1 text-xs text-cyan-50/70">
            {profile.role === "admin" ? "Founder admin" : "SaaS user"}
          </p>
        </div>

        <nav className="grid gap-5">
          {navSections.map((section) => (
            <div key={section.title}>
              <p className="mb-2 px-4 text-[11px] font-black uppercase tracking-[0.2em] text-slate-500">
                {section.title}
              </p>

              <div className="grid gap-2">
                {section.items.map((item) => (
                  <NavLink
                    key={item.href}
                    item={item}
                    active={isActive(pathname, item.href)}
                  />
                ))}
              </div>
            </div>
          ))}
        </nav>
        <div className="mt-5 rounded-3xl border border-cyan-300/20 bg-cyan-300/10 p-4 text-xs leading-6 text-cyan-50/90">
          Passive website trust reports only. Not advanced security testing.
        </div></aside>

      <div className="border-b border-white/10 bg-slate-950/95 p-4 backdrop-blur lg:hidden">
        <Link href="/dashboard" className="mb-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-cyan-300 text-slate-950">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <p className="font-black">{brand.name}</p>
            <p className="text-xs text-slate-400">
              {accountTypeLabel(profile.account_type)} · {profile.role === "admin" ? "Admin full access" : planStatusLabel(subscription)}
            </p>
          </div>
        </Link>

        <nav className="flex gap-2 overflow-x-auto pb-1">
          {mobileItems.map((item) => (
            <MobileNavLink
              key={item.href}
              item={item}
              active={isActive(pathname, item.href)}
            />
          ))}
        </nav>
      </div>

      <div className="lg:pl-72">{children}</div>
    </div>
  );
}

export default DashboardShell;