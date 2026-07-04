import { ShieldCheck } from "lucide-react";
import { brand } from "@/config/brand";

export default function AppDashboardPage() {
  return (
    <main className="min-h-screen bg-slate-950 p-6 text-white">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-400/10 ring-1 ring-cyan-300/30">
            <ShieldCheck className="h-6 w-6 text-cyan-300" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">{brand.name} Dashboard</h1>
            <p className="text-slate-400">V1 setup completed. Scanner starts in next parts.</p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
            <p className="text-sm text-slate-400">Websites</p>
            <p className="mt-2 text-4xl font-black">0</p>
          </div>
          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
            <p className="text-sm text-slate-400">Scans</p>
            <p className="mt-2 text-4xl font-black">0</p>
          </div>
          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
            <p className="text-sm text-slate-400">Average score</p>
            <p className="mt-2 text-4xl font-black">--</p>
          </div>
        </div>

        <div className="mt-6 rounded-3xl border border-cyan-300/20 bg-cyan-300/10 p-6">
          <h2 className="text-xl font-bold text-cyan-100">Next part</h2>
          <p className="mt-2 text-cyan-50/80">
            Part 2 will connect Supabase auth and database foundation.
          </p>
        </div>
      </div>
    </main>
  );
}
