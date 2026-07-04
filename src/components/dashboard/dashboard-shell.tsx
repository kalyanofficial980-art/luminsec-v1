"use client";

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
  Target,
  Users,
} from "lucide-react";
import { brand } from "@/config/brand";

const navItems = [
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
    label: "Agency",
    href: "/dashboard/agency",
    icon: BriefcaseBusiness,
  },
  {
    label: "Payments",
    href: "/dashboard/payments",
    icon: CreditCard,
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
  {
    label: "Settings",
    href: "/dashboard/settings",
    icon: Settings,
  },
];

function isActive(pathname: string, href: string) {
  if (href === "/dashboard") {
    return pathname === "/dashboard";
  }

  return pathname.startsWith(href);
}

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <aside className="fixed left-0 top-0 z-40 hidden h-screen w-72 border-r border-white/10 bg-slate-950/95 p-5 backdrop-blur lg:block">
        <Link href="/dashboard" className="mb-8 flex items-center gap-3 rounded-3xl border border-white/10 bg-white/[0.04] p-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-300 text-slate-950">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xl font-black">{brand.name}</p>
            <p className="text-xs text-slate-400">{brand.version}</p>
          </div>
        </Link>

        <nav className="grid gap-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(pathname, item.href);

            return (
              <Link
                key={item.href}
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
          })}
        </nav>

        <div className="absolute bottom-5 left-5 right-5 rounded-3xl border border-amber-300/20 bg-amber-300/10 p-4 text-xs leading-6 text-amber-50/90">
          Safe passive website trust reports only. Not a penetration testing platform.
        </div>
      </aside>

      <div className="border-b border-white/10 bg-slate-950/95 p-4 backdrop-blur lg:hidden">
        <Link href="/dashboard" className="mb-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-cyan-300 text-slate-950">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <p className="font-black">{brand.name}</p>
            <p className="text-xs text-slate-400">{brand.version}</p>
          </div>
        </Link>

        <nav className="flex gap-2 overflow-x-auto pb-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(pathname, item.href);

            return (
              <Link
                key={item.href}
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
          })}
        </nav>
      </div>

      <div className="lg:pl-72">{children}</div>
    </div>
  );
}

export default DashboardShell;