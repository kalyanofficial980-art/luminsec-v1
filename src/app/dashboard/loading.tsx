import { ShieldCheck } from "lucide-react";

export default function DashboardLoading() {
  return (
    <main className="min-h-screen bg-slate-950 p-6 text-white">
      <div className="mx-auto max-w-5xl rounded-3xl border border-white/10 bg-white/[0.04] p-8 text-center">
        <ShieldCheck className="mx-auto mb-5 h-12 w-12 animate-pulse text-cyan-300" />
        <h1 className="text-3xl font-black">Loading dashboard...</h1>
        <p className="mt-3 text-slate-400">Fetching your workspace data.</p>
      </div>
    </main>
  );
}
