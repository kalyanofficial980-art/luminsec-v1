"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  ClipboardList,
  ExternalLink,
  FileText,
  Globe2,
  Home,
  LayoutDashboard,
  Megaphone,
  PlusCircle,
  Rocket,
  ShieldCheck,
  Target,
} from "lucide-react";
import { brand } from "@/config/brand";

type DashboardShellProps = {
  children: React.ReactNode;
};

const primaryNav = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "Websites",
    href: "/dashboard/websites",
    icon: Globe2,
  },
  {
    label: "Scan Reports",
    href: "/dashboard/scans",
    icon: FileText,
  },
  {
    label: "Customer Validation",
    href: "/dashboard/validation",
    icon: Target,
  },
];

const quickActions = [
  {
    label: "Add Website",
    href: "/dashboard/websites/new",
    icon: PlusCircle,
  },
  {
    label: "Sample Report",
    href: "/sample-report",
    icon: BarChart3,
  },
];

const growthNav = [
  {
    label: "Launch Checklist",
    href: "/launch-checklist",
    icon: Rocket,
  },
  {
    label: "Outreach System",
    href: "/outreach",
    icon: Megaphone,
  },
  {
    label: "Demo Script",
    href: "/demo-script",
    icon: ClipboardList,
  },
  {
    label: "Pitch Page",
    href: "/pitch",
    icon: ExternalLink,
  },
];

function isActivePath(pathname: string, href: string) {
  if (href === "/dashboard") {
    return pathname === "/dashboard";
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

function NavLink({
  href,
  label,
  icon: Icon,
  pathname,
}: {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  pathname: string;
}) {
  const active = isActivePath(pathname, href);

  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition ${
        active
          ? "bg-cyan-300 text-slate-950 shadow-lg shadow-cyan-950/30"
          : "text-slate-300 hover:bg-white/10 hover:text-white"
      }`}
    >
      <Icon className="h-5 w-5 shrink-0" />
      <span>{label}</span>
    </Link>
  );
}

export function DashboardShell({ children }: DashboardShellProps) {
  const pathname = usePathname();

  if (pathname.includes("/print")) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <aside className="hidden border-r border-white/10 bg-slate-950/95 lg:fixed lg:inset-y-0 lg:left-0 lg:z-40 lg:flex lg:w-72 lg:flex-col">
        <div className="flex h-full flex-col px-5 py-6">
          <Link href="/dashboard" className="mb-8 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-400/10 ring-1 ring-cyan-300/30">
              <ShieldCheck className="h-7 w-7 text-cyan-300" />
            </div>
            <div>
              <p className="text-xl font-black tracking-tight">{brand.name}</p>
              <p className="text-xs uppercase tracking-[0.25em] text-cyan-200/70">
                SaaS Workspace
              </p>
            </div>
          </Link>

          <div className="space-y-7">
            <nav>
              <p className="mb-3 px-4 text-xs font-bold uppercase tracking-[0.25em] text-slate-500">
                Workspace
              </p>
              <div className="grid gap-2">
                {primaryNav.map((item) => (
                  <NavLink key={item.href} {...item} pathname={pathname} />
                ))}
              </div>
            </nav>

            <nav>
              <p className="mb-3 px-4 text-xs font-bold uppercase tracking-[0.25em] text-slate-500">
                Quick Actions
              </p>
              <div className="grid gap-2">
                {quickActions.map((item) => (
                  <NavLink key={item.href} {...item} pathname={pathname} />
                ))}
              </div>
            </nav>

            <nav>
              <p className="mb-3 px-4 text-xs font-bold uppercase tracking-[0.25em] text-slate-500">
                Launch
              </p>
              <div className="grid gap-2">
                {growthNav.map((item) => (
                  <NavLink key={item.href} {...item} pathname={pathname} />
                ))}
              </div>
            </nav>
          </div>

          <div className="mt-auto rounded-3xl border border-cyan-300/20 bg-cyan-300/10 p-5">
            <p className="text-sm font-bold text-cyan-100">V1 Safety Scope</p>
            <p className="mt-2 text-xs leading-6 text-cyan-50/80">
              Safe passive checks only. No exploitation, no brute force, no intrusive scanning.
            </p>
          </div>
        </div>
      </aside>

      <div className="lg:pl-72">
        <header className="sticky top-0 z-30 border-b border-white/10 bg-slate-950/90 px-4 py-4 backdrop-blur lg:px-8">
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between gap-4">
              <Link href="/dashboard" className="flex items-center gap-3 lg:hidden">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-cyan-400/10 ring-1 ring-cyan-300/30">
                  <ShieldCheck className="h-5 w-5 text-cyan-300" />
                </div>
                <div>
                  <p className="font-black">{brand.name}</p>
                  <p className="text-xs text-slate-400">SaaS Dashboard</p>
                </div>
              </Link>

              <div className="hidden lg:block">
                <p className="text-sm text-slate-500">VeyraSec V1</p>
                <h1 className="text-xl font-black">Professional SaaS Dashboard</h1>
              </div>

              <Link
                href="/"
                className="inline-flex items-center gap-2 rounded-2xl border border-white/10 px-4 py-3 text-sm font-semibold text-slate-300 hover:bg-white/10 hover:text-white"
              >
                <Home className="h-4 w-4" />
                Website
              </Link>
            </div>

            <nav className="flex gap-2 overflow-x-auto pb-1 lg:hidden">
              {[...primaryNav, ...quickActions].map((item) => {
                const Icon = item.icon;
                const active = isActivePath(pathname, item.href);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex shrink-0 items-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold ${
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
        </header>

        <div>{children}</div>
      </div>
    </div>
  );
}