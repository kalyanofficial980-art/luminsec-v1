import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Activity,
  ArrowRight,
  CheckCircle2,
  Database,
  Globe2,
  Server,
  ShieldAlert,
  ShieldCheck,
} from "lucide-react";
import { brand } from "@/config/brand";
import { createClient } from "@/lib/supabase/server";

type SupabaseClient = Awaited<ReturnType<typeof createClient>>;

type CheckResult = {
  name: string;
  ok: boolean;
  message: string;
  count?: number | null;
};

async function checkTable(
  supabase: SupabaseClient,
  table: string,
  userId: string
): Promise<CheckResult> {
  try {
    const { count, error } = await supabase
      .from(table)
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId);

    if (error) {
      return {
        name: table,
        ok: false,
        message: error.message,
        count: null,
      };
    }

    return {
      name: table,
      ok: true,
      message: "Connected",
      count: count ?? 0,
    };
  } catch (error) {
    return {
      name: table,
      ok: false,
      message: error instanceof Error ? error.message : "Unknown error",
      count: null,
    };
  }
}

function statusClass(ok: boolean) {
  return ok
    ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-100"
    : "border-red-400/20 bg-red-400/10 text-red-100";
}

function envStatus() {
  return [
    {
      name: "NEXT_PUBLIC_SUPABASE_URL",
      ok: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL),
    },
    {
      name: "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
      ok: Boolean(process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY),
    },
    {
      name: "APP_URL",
      ok: Boolean(process.env.APP_URL),
    },
  ];
}

export default async function DashboardStatusPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const tableChecks = await Promise.all([
    checkTable(supabase, "websites", user.id),
    checkTable(supabase, "scan_results", user.id),
    checkTable(supabase, "scan_findings", user.id),
    checkTable(supabase, "customer_feedback", user.id),
    checkTable(supabase, "manual_payments", user.id),
    checkTable(supabase, "agency_clients", user.id),
    checkTable(supabase, "business_settings", user.id),
  ]);

  const environmentChecks = envStatus();
  const databaseOk = tableChecks.every((check) => check.ok);
  const environmentOk = environmentChecks.every((check) => check.ok);
  const systemOk = databaseOk && environmentOk;

  return (
    <main className="min-h-screen bg-slate-950 p-6 text-white">
      <div className="mx-auto max-w-7xl">
        <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-8">
          <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-start">
            <div>
              <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-400/10 ring-1 ring-cyan-300/30">
                <Activity className="h-8 w-8 text-cyan-300" />
              </div>

              <h1 className="text-4xl font-black tracking-tight md:text-5xl">
                Production status
              </h1>

              <p className="mt-4 max-w-3xl leading-8 text-slate-300">
                Check environment variables, Supabase tables, and production readiness signals for {brand.name}.
              </p>
            </div>

            <div className={`rounded-3xl border p-6 text-center ${statusClass(systemOk)}`}>
              {systemOk ? (
                <CheckCircle2 className="mx-auto mb-3 h-9 w-9" />
              ) : (
                <ShieldAlert className="mx-auto mb-3 h-9 w-9" />
              )}
              <p className="text-sm opacity-80">System status</p>
              <p className="mt-2 text-3xl font-black">
                {systemOk ? "Healthy" : "Needs attention"}
              </p>
            </div>
          </div>
        </section>

        <section className="mt-8 grid gap-4 md:grid-cols-3">
          <div className={`rounded-3xl border p-6 ${statusClass(environmentOk)}`}>
            <Server className="mb-4 h-7 w-7" />
            <p className="text-sm opacity-80">Environment</p>
            <p className="mt-2 text-3xl font-black">{environmentOk ? "OK" : "Check"}</p>
          </div>

          <div className={`rounded-3xl border p-6 ${statusClass(databaseOk)}`}>
            <Database className="mb-4 h-7 w-7" />
            <p className="text-sm opacity-80">Database</p>
            <p className="mt-2 text-3xl font-black">{databaseOk ? "OK" : "Check"}</p>
          </div>

          <Link
            href="/health"
            target="_blank"
            className="rounded-3xl border border-cyan-400/20 bg-cyan-400/10 p-6 text-cyan-100 hover:bg-cyan-400/20"
          >
            <Globe2 className="mb-4 h-7 w-7" />
            <p className="text-sm opacity-80">Public health route</p>
            <p className="mt-2 flex items-center gap-2 text-3xl font-black">
              Open <ArrowRight className="h-6 w-6" />
            </p>
          </Link>
        </section>

        <section className="mt-8 grid gap-8 lg:grid-cols-2">
          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-8">
            <div className="mb-6 flex items-center gap-3">
              <Server className="h-7 w-7 text-cyan-300" />
              <h2 className="text-3xl font-black">Environment checks</h2>
            </div>

            <div className="grid gap-3">
              {environmentChecks.map((check) => (
                <div key={check.name} className="rounded-2xl border border-white/10 bg-slate-950 p-4">
                  <div className="flex items-center justify-between gap-4">
                    <p className="font-bold text-white">{check.name}</p>
                    <span className={`rounded-full border px-3 py-1 text-xs font-bold ${statusClass(check.ok)}`}>
                      {check.ok ? "Present" : "Missing"}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <p className="mt-5 rounded-2xl border border-amber-300/20 bg-amber-300/10 p-4 text-sm leading-6 text-amber-50">
              This page only checks whether required variables exist. It does not expose secret values.
            </p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-8">
            <div className="mb-6 flex items-center gap-3">
              <Database className="h-7 w-7 text-cyan-300" />
              <h2 className="text-3xl font-black">Database checks</h2>
            </div>

            <div className="grid gap-3">
              {tableChecks.map((check) => (
                <div key={check.name} className="rounded-2xl border border-white/10 bg-slate-950 p-4">
                  <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                    <div>
                      <p className="font-bold text-white">{check.name}</p>
                      <p className="mt-1 text-sm text-slate-500">{check.message}</p>
                    </div>

                    <div className="flex items-center gap-2">
                      {typeof check.count === "number" ? (
                        <span className="rounded-full border border-white/10 px-3 py-1 text-xs font-bold text-slate-300">
                          {check.count} records
                        </span>
                      ) : null}

                      <span className={`rounded-full border px-3 py-1 text-xs font-bold ${statusClass(check.ok)}`}>
                        {check.ok ? "OK" : "Error"}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mt-8 rounded-3xl border border-white/10 bg-white/[0.04] p-8">
          <div className="mb-6 flex items-center gap-3">
            <ShieldCheck className="h-7 w-7 text-cyan-300" />
            <h2 className="text-3xl font-black">Reliability checklist</h2>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {[
              "Vercel environment variables are set for Production.",
              "Supabase RLS is enabled on user-owned tables.",
              "No service role key is stored in frontend or Vercel public variables.",
              "Public report sharing is private by default.",
              "Health route does not expose secrets.",
              "Manual payment tracking does not collect money automatically.",
              "Reports clearly say safe passive checks only.",
              "Dashboard error and loading pages are available.",
            ].map((item) => (
              <div key={item} className="rounded-2xl border border-white/10 bg-slate-950 p-4">
                <div className="flex gap-3">
                  <CheckCircle2 className="mt-1 h-5 w-5 shrink-0 text-cyan-300" />
                  <p className="leading-7 text-slate-300">{item}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}