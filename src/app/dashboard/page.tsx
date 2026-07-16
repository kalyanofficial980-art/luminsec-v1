import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowRight,
  BriefcaseBusiness,
  CheckCircle2,
  FileText,
  FlaskConical,
  Globe2,
  Rocket,
  Settings,
  ShieldCheck,
  Target,
  Users,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import {
  accountTypeLabel,
  isAdmin,
  isAgencyAccount,
  normalizeProfile,
} from "@/lib/auth/profile";

function scoreClass(score: number) {
  if (score >= 80)
    return "border-emerald-400/20 bg-emerald-400/10 text-emerald-100";
  if (score >= 60) return "border-amber-400/20 bg-amber-400/10 text-amber-100";
  return "border-red-400/20 bg-red-400/10 text-red-100";
}

function getWelcomeText(accountType: string | null) {
  if (accountType === "small_business") {
    return {
      title: "Your website trust dashboard",
      description:
        "Add your business website, run a safe passive scan, and download a clear trust report.",
      icon: Globe2,
    };
  }

  if (accountType === "freelancer_agency") {
    return {
      title: "Your agency workspace",
      description:
        "Manage client websites, create trust reports, and use reports for customer conversations.",
      icon: BriefcaseBusiness,
    };
  }

  if (accountType === "testing") {
    return {
      title: "Your testing workspace",
      description:
        "Try VeyraSec with demo websites before using it with real customers.",
      icon: FlaskConical,
    };
  }

  return {
    title: "Your VeyraSec dashboard",
    description:
      "Add a website and create your first safe passive website trust report.",
    icon: ShieldCheck,
  };
}

export default async function DashboardPage() {
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

  const { data: websites } = await supabase
    .from("websites")
    .select("id, name, url, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const { data: scans } = await supabase
    .from("scan_results")
    .select("id, overall_score, created_at, website_id")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const websiteRows = websites ?? [];
  const scanRows = scans ?? [];
  const latestScan = scanRows[0];
  const latestScore = Number(latestScan?.overall_score ?? 0);

  const welcome = getWelcomeText(profile.account_type);
  const WelcomeIcon = welcome.icon;

  const commonActions = [
    {
      title: "Add website",
      description: "Add your first website or customer website.",
      href: "/dashboard/websites/new",
      icon: Globe2,
    },
    {
      title: "View reports",
      description:
        "Open scan reports, PDF pages, action plans, and comparisons.",
      href: "/dashboard/scans",
      icon: FileText,
    },
    {
      title: "Settings",
      description: "Update business details used in reports.",
      href: "/dashboard/settings",
      icon: Settings,
    },
  ];

  const agencyActions = isAgencyAccount(profile)
    ? [
        {
          title: "Agency mode",
          description: "Manage clients and link websites to client records.",
          href: "/dashboard/agency",
          icon: BriefcaseBusiness,
        },
      ]
    : [];

  const adminActions = isAdmin(profile)
    ? [
        {
          title: "Validation CRM",
          description:
            "Track leads, demos, objections, and paid pilot feedback.",
          href: "/dashboard/validation",
          icon: Users,
        },
        {
          title: "V2 launch page",
          description:
            "Open founder launch readiness and production checklist.",
          href: "/dashboard/v2-launch",
          icon: Rocket,
        },
      ]
    : [];

  const nextSteps =
    profile.account_type === "small_business"
      ? [
          "Add your website.",
          "Run one passive trust scan.",
          "Download the PDF report.",
          "Share the action plan with your developer.",
        ]
      : profile.account_type === "freelancer_agency"
        ? [
            "Add one client website.",
            "Run a scan and create a PDF report.",
            "Use the report to explain website trust issues.",
            "Track interested clients separately.",
          ]
        : [
            "Add a demo website like example.com.",
            "Run a scan.",
            "Open report, action plan, and PDF.",
            "Decide which customer type you want to serve.",
          ];

  return (
    <main className="min-h-screen bg-slate-950 p-6 text-white">
      <div className="mx-auto max-w-7xl">
        <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-8">
          <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-start">
            <div>
              <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-400/10 ring-1 ring-cyan-300/30">
                <WelcomeIcon className="h-8 w-8 text-cyan-300" />
              </div>

              <p className="mb-3 text-sm font-bold uppercase tracking-[0.25em] text-cyan-300">
                {accountTypeLabel(profile.account_type)}
              </p>

              <h1 className="text-4xl font-black tracking-tight md:text-5xl">
                {welcome.title}
              </h1>

              <p className="mt-4 max-w-3xl leading-8 text-slate-300">
                {welcome.description}
              </p>

              <p className="mt-4 text-sm text-slate-500">
                Logged in as {profile.email || user.email}
              </p>
            </div>

            <div className="rounded-3xl border border-cyan-300/20 bg-cyan-300/10 p-6 text-center text-cyan-100">
              <ShieldCheck className="mx-auto mb-3 h-9 w-9" />
              <p className="text-sm opacity-80">Role</p>
              <p className="mt-2 text-3xl font-black">
                {profile.role === "admin" ? "Admin" : "User"}
              </p>
            </div>
          </div>
        </section>

        <section className="mt-8 grid gap-4 md:grid-cols-3">
          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
            <Globe2 className="mb-4 h-7 w-7 text-cyan-300" />
            <p className="text-sm text-slate-400">Websites</p>
            <p className="mt-2 text-4xl font-black">{websiteRows.length}</p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
            <FileText className="mb-4 h-7 w-7 text-cyan-300" />
            <p className="text-sm text-slate-400">Reports</p>
            <p className="mt-2 text-4xl font-black">{scanRows.length}</p>
          </div>

          <div
            className={`rounded-3xl border p-6 ${latestScan ? scoreClass(latestScore) : "border-slate-400/20 bg-slate-400/10 text-slate-100"}`}
          >
            <Target className="mb-4 h-7 w-7" />
            <p className="text-sm opacity-80">Latest score</p>
            <p className="mt-2 text-4xl font-black">
              {latestScan ? `${latestScore}/100` : "No scan"}
            </p>
          </div>
        </section>

        <section className="mt-8 grid gap-8 lg:grid-cols-[0.8fr_1.2fr]">
          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-8">
            <div className="mb-6 flex items-center gap-3">
              <CheckCircle2 className="h-7 w-7 text-cyan-300" />
              <h2 className="text-3xl font-black">Next steps</h2>
            </div>

            <div className="grid gap-3">
              {nextSteps.map((step, index) => (
                <div
                  key={step}
                  className="rounded-2xl border border-white/10 bg-slate-950 p-4"
                >
                  <div className="flex gap-3">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-cyan-300 text-xs font-black text-slate-950">
                      {index + 1}
                    </span>
                    <p className="leading-7 text-slate-300">{step}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-8">
            <div className="mb-6 flex items-center gap-3">
              <Rocket className="h-7 w-7 text-cyan-300" />
              <h2 className="text-3xl font-black">Available actions</h2>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {[...commonActions, ...agencyActions, ...adminActions].map(
                (action) => {
                  const Icon = action.icon;

                  return (
                    <Link
                      key={action.href}
                      href={action.href}
                      className="rounded-3xl border border-white/10 bg-slate-950 p-6 hover:bg-white/[0.05]"
                    >
                      <Icon className="mb-4 h-7 w-7 text-cyan-300" />
                      <h3 className="text-xl font-black">{action.title}</h3>
                      <p className="mt-3 text-sm leading-6 text-slate-400">
                        {action.description}
                      </p>
                      <p className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-cyan-300">
                        Open <ArrowRight className="h-4 w-4" />
                      </p>
                    </Link>
                  );
                },
              )}
            </div>
          </div>
        </section>

        <section className="mt-8 rounded-3xl border border-amber-300/20 bg-amber-300/10 p-8">
          <h2 className="text-2xl font-black text-amber-100">
            Product safety note
          </h2>
          <p className="mt-3 max-w-4xl leading-8 text-amber-50/90">
            VeyraSec performs safe passive website trust checks only. It is not
            a penetration testing platform, not a vulnerability exploitation
            tool, and not legal compliance certification.
          </p>
        </section>
      </div>
    </main>
  );
}
