import { redirect } from "next/navigation";
import { LogOut, ShieldCheck } from "lucide-react";
import { brand } from "@/config/brand";
import { createClient } from "@/lib/supabase/server";
import { logout } from "./actions";

export default async function AppDashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { count: websiteCount } = await supabase
    .from("websites")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id);

  const { count: scanCount } = await supabase
    .from("scan_jobs")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id);

  return (
    <main className="min-h-screen bg-slate-950 p-6 text-white">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-400/10 ring-1 ring-cyan-300/30">
              <ShieldCheck className="h-6 w-6 text-cyan-300" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">{brand.name} Dashboard</h1>
              <p className="text-slate-400">Logged in as {user.email}</p>
            </div>
          </div>

          <form action={logout}>
            <button
              type="submit"
              className="inline-flex items-center gap-2 rounded-2xl border border-white/10 px-4 py-3 text-sm font-semibold text-white hover:bg-white/10"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </button>
          </form>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
            <p className="text-sm text-slate-400">Websites</p>
            <p className="mt-2 text-4xl font-black">{websiteCount ?? 0}</p>
          </div>
          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
            <p className="text-sm text-slate-400">Scans</p>
            <p className="mt-2 text-4xl font-black">{scanCount ?? 0}</p>
          </div>
          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
            <p className="text-sm text-slate-400">Average score</p>
            <p className="mt-2 text-4xl font-black">--</p>
          </div>
        </div>

        <div className="mt-6 rounded-3xl border border-cyan-300/20 bg-cyan-300/10 p-6">
          <h2 className="text-xl font-bold text-cyan-100">Part 2 complete</h2>
          <p className="mt-2 text-cyan-50/80">
            Auth and database foundation are connected. Part 3 will add websites and scanner workflow.
          </p>
        </div>
      </div>
    </main>
  );
}
