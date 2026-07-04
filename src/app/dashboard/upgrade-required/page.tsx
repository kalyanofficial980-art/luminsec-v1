import Link from "next/link";
import { ArrowRight, Lock, ShieldAlert } from "lucide-react";

function getMessage(feature?: string) {
  if (feature === "admin") {
    return {
      title: "Admin access required",
      description:
        "This page is for VeyraSec founder/admin use only. Normal SaaS users cannot open internal operations pages.",
      actionText: "Back to dashboard",
      actionHref: "/dashboard",
    };
  }

  if (feature === "agency" || feature === "agency_mode") {
    return {
      title: "Agency plan required",
      description:
        "Agency mode is available only when your plan includes agency features.",
      actionText: "View subscription",
      actionHref: "/dashboard/subscription",
    };
  }

  if (feature === "pdf_reports") {
    return {
      title: "PDF reports not included",
      description:
        "Your current plan does not include PDF report access. Upgrade your plan to export client-ready PDF reports.",
      actionText: "View subscription",
      actionHref: "/dashboard/subscription",
    };
  }

  if (feature === "public_share") {
    return {
      title: "Public sharing not included",
      description:
        "Your current plan does not include public report links. Upgrade your plan to share reports with clients using public links.",
      actionText: "View subscription",
      actionHref: "/dashboard/subscription",
    };
  }

  return {
    title: "Access not available",
    description:
      "Your current account type or plan does not include this page.",
    actionText: "View subscription",
    actionHref: "/dashboard/subscription",
  };
}

export default async function UpgradeRequiredPage({
  searchParams,
}: {
  searchParams: Promise<{ feature?: string }>;
}) {
  const params = await searchParams;
  const message = getMessage(params.feature);

  return (
    <main className="min-h-screen bg-slate-950 p-6 text-white">
      <div className="mx-auto flex min-h-[80vh] max-w-3xl items-center justify-center">
        <section className="w-full rounded-3xl border border-amber-300/20 bg-amber-300/10 p-8 text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-3xl bg-amber-300 text-slate-950">
            <Lock className="h-8 w-8" />
          </div>

          <h1 className="text-4xl font-black tracking-tight">{message.title}</h1>

          <p className="mx-auto mt-5 max-w-2xl leading-8 text-amber-50/90">
            {message.description}
          </p>

          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              href={message.actionHref}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-cyan-300 px-5 py-4 font-bold text-slate-950 hover:bg-cyan-200"
            >
              {message.actionText}
              <ArrowRight className="h-5 w-5" />
            </Link>

            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 px-5 py-4 font-bold text-white hover:bg-white/10"
            >
              <ShieldAlert className="h-5 w-5" />
              Dashboard
            </Link>
          </div>

          <p className="mt-8 text-sm text-amber-50/70">
            Safe passive website trust reports only. Not advanced security testing.
          </p>
        </section>
      </div>
    </main>
  );
}